/**
 * App Screen Generator - Font Picker
 * A dropdown where every font is previewed in its own typeface.
 * Keyboard: Enter/Space/↓ opens, ↑/↓/Home/End move, Enter picks, Esc closes.
 */

import { POPULAR_FONTS, loadFont, getRecommendedFontsForLanguage, getDefaultFontForLanguage } from '../features/text/fontManager.js';
import { SUPPORTED_LANGUAGES } from '../features/translation/translationService.js';

/**
 * Replaces `el` with a language-aware font picker.
 * @param {HTMLElement} el Placeholder element
 * @param {string} value Current font family
 * @param {Function} onChange Called with the chosen font family
 * @param {string} label Accessible name, e.g. "Headline font"
 * @param {Object} options Configuration options including active language
 */
export function mountFontPicker(el, value, onChange, label = 'Font', options = {}) {
  const lang = options.lang || 'en';
  const defaultFontName = getDefaultFontForLanguage(lang);
  const currentFontName = value || defaultFontName;
  const current = POPULAR_FONTS.find(f => f.name.toLowerCase() === currentFontName.toLowerCase()) || POPULAR_FONTS[0];
  loadFont(current.name);

  const langObj = SUPPORTED_LANGUAGES.find(l => l.code === lang);
  const langName = langObj ? langObj.name.split(' ')[0] : lang.toUpperCase();
  const sampleText = (lang === 'ar' || lang === 'fa' || lang === 'ur') ? 'أبجد' : (lang === 'ja' ? 'あA' : (lang === 'zh' ? '中A' : (lang === 'ko' ? '한A' : (lang === 'ru' ? 'Бг' : 'Aa'))));

  const { recommended, others } = getRecommendedFontsForLanguage(lang);

  const root = document.createElement('div');
  root.className = 'font-picker';
  root.innerHTML = `
    <button type="button" class="font-picker-btn form-select" aria-haspopup="listbox" aria-expanded="false"></button>
    <ul class="font-picker-list hidden" role="listbox" tabindex="-1"></ul>
  `;
  const btn = root.querySelector('.font-picker-btn');
  const list = root.querySelector('.font-picker-list');
  btn.setAttribute('aria-label', `${label}: ${current.name}`);
  btn.textContent = current.name;
  btn.style.fontFamily = `'${current.name}', sans-serif`;

  const appendOption = (f) => {
    const li = document.createElement('li');
    li.className = 'font-picker-option';
    li.setAttribute('role', 'option');
    li.tabIndex = -1;
    li.dataset.font = f.name;
    li.setAttribute('aria-selected', String(f.name.toLowerCase() === current.name.toLowerCase()));
    
    // Preview sample text according to script
    const fontSample = (f.scripts?.includes('arabic') && (lang === 'ar' || lang === 'fa' || lang === 'ur')) ? 'أبجد'
      : (f.scripts?.includes('japanese') ? 'あA' : sampleText);

    li.innerHTML = `<span class="font-picker-name"></span><span class="font-picker-sample">${fontSample}</span><small class="font-picker-cat"></small>`;
    li.querySelector('.font-picker-name').textContent = f.name;
    li.querySelector('.font-picker-cat').textContent = f.category;
    li.querySelector('.font-picker-name').style.fontFamily = `'${f.name}', sans-serif`;
    li.querySelector('.font-picker-sample').style.fontFamily = `'${f.name}', sans-serif`;
    list.appendChild(li);
  };

  if (recommended.length > 0) {
    const recHeader = document.createElement('li');
    recHeader.className = 'font-picker-header';
    recHeader.textContent = `★ Recommended for ${langName}`;
    list.appendChild(recHeader);
    recommended.forEach(appendOption);

    if (others.length > 0) {
      const otherHeader = document.createElement('li');
      otherHeader.className = 'font-picker-header font-picker-header-secondary';
      otherHeader.textContent = 'All Other Fonts';
      list.appendChild(otherHeader);
      others.forEach(appendOption);
    }
  } else {
    POPULAR_FONTS.forEach(appendOption);
  }

  const optionsList = [...list.querySelectorAll('.font-picker-option')];

  const isOpen = () => !list.classList.contains('hidden');
  const open = () => {
    // Preload recommended fonts first for swift rendering
    recommended.forEach(f => loadFont(f.name));
    others.slice(0, 6).forEach(f => loadFont(f.name));
    list.classList.remove('hidden');
    btn.setAttribute('aria-expanded', 'true');
    (optionsList.find(o => o.dataset.font === current.name) || optionsList[0])?.focus();
    document.addEventListener('pointerdown', onOutside, true);
  };
  const close = (refocus = true) => {
    list.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', onOutside, true);
    if (refocus) btn.focus();
  };
  const onOutside = (e) => { if (!root.contains(e.target)) close(false); };
  const pick = (name) => {
    close();
    if (name !== current.name) onChange(name);
  };

  btn.onclick = () => (isOpen() ? close() : open());
  btn.onkeydown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
  };
  list.onclick = (e) => {
    const opt = e.target.closest('.font-picker-option');
    if (opt) pick(opt.dataset.font);
  };
  list.onkeydown = (e) => {
    const i = optionsList.indexOf(document.activeElement);
    const go = (n) => { e.preventDefault(); optionsList.at(Math.max(0, Math.min(optionsList.length - 1, n)))?.focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(optionsList.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) pick(optionsList[i].dataset.font); }
    else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); close(); }
  };

  el.replaceWith(root);
  return root;
}
