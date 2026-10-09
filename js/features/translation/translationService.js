/**
 * App Screen Generator - AI Translation Service
 * Translates the texts of new language copies with the user's own AI provider key
 * (Gemini, Claude or ChatGPT). Keys stay in this browser and calls go straight to the provider.
 */

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'es', name: 'Spanish (Español)', flag: '🇪🇸', dir: 'ltr' },
  { code: 'ar', name: 'Arabic (العربية)', flag: '🇸🇦', dir: 'rtl' },
  { code: 'fr', name: 'French (Français)', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', name: 'German (Deutsch)', flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese (Português)', flag: '🇧🇷', dir: 'ltr' },
  { code: 'ja', name: 'Japanese (日本語)', flag: '🇯🇵', dir: 'ltr' },
  { code: 'hi', name: 'Hindi (हिन्दी)', flag: '🇮🇳', dir: 'ltr' },
  { code: 'it', name: 'Italian (Italiano)', flag: '🇮🇹', dir: 'ltr' },
  { code: 'tr', name: 'Turkish (Türkçe)', flag: '🇹🇷', dir: 'ltr' },
  { code: 'id', name: 'Indonesian (Bahasa)', flag: '🇮🇩', dir: 'ltr' },
  { code: 'ru', name: 'Russian (Русский)', flag: '🇷🇺', dir: 'ltr' }
];

/**
 * Provider adapters. `verify` lists the models the key can use (doubles as key validation);
 * `generate` sends one prompt and returns the reply text. `preferred` = default model if the key has it.
 */
export const AI_PROVIDERS = {
  gemini: {
    name: 'Gemini',
    keyHint: 'From aistudio.google.com/apikey',
    preferred: ['gemini-2.5-flash', 'gemini-2.0-flash'],
    async verify(key) {
      const data = await callJson('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
      return (data.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name))
        .map(m => m.name.replace(/^models\//, ''));
    },
    async generate(key, model, system, user) {
      const data = await callJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });
      return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    }
  },
  claude: {
    name: 'Claude',
    keyHint: 'From console.anthropic.com',
    preferred: ['claude-sonnet-5-5', 'claude-haiku-4-5-20251001'],
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      // Required by Anthropic for calls made directly from a browser page
      'anthropic-dangerous-direct-browser-access': 'true',
      'Content-Type': 'application/json'
    }),
    async verify(key) {
      const data = await callJson('https://api.anthropic.com/v1/models?limit=100', { headers: this.headers(key) });
      return (data.data || []).map(m => m.id);
    },
    async generate(key, model, system, user) {
      const data = await callJson('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: this.headers(key),
        body: JSON.stringify({ model, max_tokens: 4096, system, messages: [{ role: 'user', content: user }] })
      });
      return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    }
  },
  openai: {
    name: 'ChatGPT',
    keyHint: 'From platform.openai.com/api-keys',
    preferred: ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini'],
    async verify(key) {
      const data = await callJson('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
      return (data.data || []).map(m => m.id).filter(id => /^(gpt|o\d|chatgpt)/.test(id) && !/(audio|realtime|tts|transcribe|image|search)/.test(id)).sort();
    },
    async generate(key, model, system, user) {
      const data = await callJson('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
      });
      return data.choices?.[0]?.message?.content || '';
    }
  }
};

/** fetch → JSON, turning HTTP errors into readable messages (the provider's own message when it sends one). */
async function callJson(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch {
    throw new Error('Could not reach the provider. Check your internet connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || data.message || `HTTP ${res.status}`;
    throw new Error(res.status === 401 || res.status === 403 || /api key/i.test(msg) ? `Invalid API key (${msg})` : msg);
  }
  return data;
}

// ---- Settings (per browser) ----

const SETTINGS_KEY = 'appscreen_ai_settings';

/** @returns {{provider: string, keys: Object, models: Object}} */
export function getAiSettings() {
  try {
    return { provider: 'gemini', keys: {}, models: {}, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { provider: 'gemini', keys: {}, models: {} };
  }
}

export function saveAiSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save AI settings:', err);
  }
}

/** True when the selected provider has a verified key. */
export function isAiReady() {
  const s = getAiSettings();
  return Boolean(s.keys[s.provider] && s.models[s.provider]);
}

/**
 * Checks a key with the provider. Resolves with the usable models and the one to default to.
 * @returns {Promise<{models: string[], model: string}>}
 */
export async function verifyApiKey(provider, key) {
  const p = AI_PROVIDERS[provider];
  const models = await p.verify(key);
  if (!models.length) throw new Error('The key works, but no suitable text models are available for it.');
  return { models, model: p.preferred.find(m => models.includes(m)) || models[0] };
}

// ---- Translation ----

const languageName = (code) => SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;

/**
 * Translates a list of texts in one request with the configured provider.
 * @returns {Promise<string[]>} Translations in the same order
 */
export async function translateTexts(texts, fromLang, toLang) {
  if (!texts.length) return [];
  const settings = getAiSettings();
  const provider = AI_PROVIDERS[settings.provider];
  const key = settings.keys[settings.provider];
  const model = settings.models[settings.provider];
  if (!provider || !key || !model) throw new Error('Add and verify an AI API key in Settings first.');

  const system = `You translate Google Play Store screenshot marketing texts from ${languageName(fromLang)} to ${languageName(toLang)}.
Write natural, short, punchy store-listing copy a native speaker would use. Keep emojis, symbols, numbers, prices and brand names as they are.
You receive a JSON array of strings. Reply with ONLY a JSON array of the translated strings, same length and order.`;
  const reply = await provider.generate(key, model, system, JSON.stringify(texts));

  // Models sometimes wrap JSON in a code fence
  const match = reply.match(/\[[\s\S]*\]/);
  let result;
  try {
    result = JSON.parse(match ? match[0] : reply);
  } catch {
    throw new Error(`${provider.name} returned an unexpected answer. Try again.`);
  }
  if (!Array.isArray(result) || result.length !== texts.length || !result.every(t => typeof t === 'string')) {
    throw new Error(`${provider.name} returned ${Array.isArray(result) ? result.length : 0} of ${texts.length} texts. Try again.`);
  }
  return result;
}

/**
 * Builds a full copy of `screens` for another language: everything is cloned (screenshots, layout,
 * layers), and headlines, subtitles and badge labels are translated with AI when `translate` is on.
 * Throws if translation fails, so no half-translated copy is created.
 */
export async function buildLanguageCopy(screens, fromLang, toLang, translate = true) {
  const copy = JSON.parse(JSON.stringify(screens));
  if (!translate) return copy;

  // Every translatable piece of text, as [object, property]
  const slots = [];
  for (const screen of copy) {
    for (const field of [screen.headline, screen.subtitle]) {
      if (field?.text) slots.push([field, 'text']);
    }
    for (const shape of screen.shapes || []) {
      if (shape.type === 'text' && shape.text) {
        slots.push([shape, 'text']);
      }
      // Skip pure symbols like ★★★★★
      for (const key of ['label', 'sublabel']) if (/\p{L}/u.test(shape[key] || '')) slots.push([shape, key]);
    }
  }

  const translated = await translateTexts(slots.map(([obj, key]) => obj[key]), fromLang, toLang);
  slots.forEach(([obj, key], i) => { obj[key] = translated[i]; });
  return copy;
}
