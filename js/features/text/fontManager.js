/**
 * App Screen Generator - Font Manager & Typography Engine
 * Dynamically loads Google Fonts, calculates multi-line canvas text wrapping,
 * handles text styling, shadows, and RTL text direction for Arabic/Hebrew.
 */

export const POPULAR_FONTS = [
  // --- Modern Latin / Universal Fonts ---
  { name: 'Plus Jakarta Sans', category: 'Modern Tech Sans', weights: [400, 600, 700, 800], scripts: ['latin'] },
  { name: 'Inter', category: 'Clean UI Sans', weights: [400, 500, 600, 700], scripts: ['latin', 'cyrillic', 'greek'] },
  { name: 'Poppins', category: 'Geometric Sans', weights: [400, 600, 700, 800], scripts: ['latin', 'devanagari'] },
  { name: 'Montserrat', category: 'Punchy Heading Sans', weights: [400, 600, 700, 800, 900], scripts: ['latin', 'cyrillic'] },
  { name: 'Roboto', category: 'Android Standard', weights: [400, 500, 700, 900], scripts: ['latin', 'cyrillic', 'greek'] },
  { name: 'Outfit', category: 'Modern Geometric', weights: [400, 600, 700, 800], scripts: ['latin'] },
  { name: 'Oswald', category: 'Condensed Display', weights: [400, 600, 700], scripts: ['latin', 'cyrillic'] },
  { name: 'Playfair Display', category: 'Elegant Serif', weights: [400, 700, 900], scripts: ['latin', 'cyrillic'] },
  { name: 'Anton', category: 'Ultra Bold Promo', weights: [400], scripts: ['latin'] },
  { name: 'Caveat', category: 'Handwritten Casual', weights: [400, 700], scripts: ['latin', 'cyrillic'] },

  // --- Arabic & RTL Fonts (Curated for Google Play AppScreens) ---
  { name: 'Cairo', category: 'Modern Arabic & Sans', weights: [400, 600, 700, 800], scripts: ['arabic', 'latin'] },
  { name: 'Tajawal', category: 'Clean Arabic Sans', weights: [400, 500, 700, 800], scripts: ['arabic', 'latin'] },
  { name: 'Almarai', category: 'Contemporary Tech Arabic', weights: [400, 700, 800], scripts: ['arabic'] },
  { name: 'Readex Pro', category: 'Accessible Tech Arabic', weights: [400, 500, 600, 700], scripts: ['arabic', 'latin'] },
  { name: 'IBM Plex Sans Arabic', category: 'Corporate Tech Arabic', weights: [400, 600, 700], scripts: ['arabic'] },
  { name: 'Amiri', category: 'Classical Naskh Serif', weights: [400, 700], scripts: ['arabic'] },

  // --- Asian Fonts ---
  { name: 'Noto Sans JP', category: 'Modern Japanese Sans', weights: [400, 500, 700], scripts: ['japanese', 'latin'] },
  { name: 'Noto Sans KR', category: 'Modern Korean Sans', weights: [400, 500, 700], scripts: ['korean', 'latin'] },
  { name: 'Noto Sans SC', category: 'Simplified Chinese Sans', weights: [400, 500, 700], scripts: ['chinese', 'latin'] }
];

/**
 * Checks if a given font supports the script of the target language.
 * @param {string} fontName
 * @param {string} langCode
 * @returns {boolean}
 */
export function isFontSupportedForLanguage(fontName, langCode) {
  if (!fontName) return false;
  const font = POPULAR_FONTS.find(f => f.name.toLowerCase() === fontName.toLowerCase());
  if (!font) return true; // allow custom / external fonts
  const code = (langCode || 'en').toLowerCase().split('-')[0];
  if (code === 'ar' || code === 'fa' || code === 'ur') {
    return font.scripts?.includes('arabic');
  }
  if (code === 'ja') {
    return font.scripts?.includes('japanese');
  }
  if (code === 'ko') {
    return font.scripts?.includes('korean');
  }
  if (code === 'zh') {
    return font.scripts?.includes('chinese');
  }
  if (code === 'ru' || code === 'uk') {
    return font.scripts?.includes('cyrillic');
  }
  return font.scripts?.includes('latin');
}

/**
 * Returns the recommended default font for a specific language and layer role.
 * @param {string} langCode
 * @param {string} type 'headline' | 'subtitle' | 'eyebrow' | 'callout' | 'caption' | 'body'
 * @returns {string} Font family name
 */
export function getDefaultFontForLanguage(langCode, type = 'headline') {
  const code = (langCode || 'en').toLowerCase().split('-')[0];
  if (code === 'ar' || code === 'fa' || code === 'ur') {
    return (type === 'headline' || type === 'callout') ? 'Cairo' : 'Tajawal';
  }
  if (code === 'ja') {
    return 'Noto Sans JP';
  }
  if (code === 'ko') {
    return 'Noto Sans KR';
  }
  if (code === 'zh') {
    return 'Noto Sans SC';
  }
  if (code === 'ru' || code === 'uk') {
    return (type === 'headline' || type === 'callout') ? 'Montserrat' : 'Inter';
  }
  return (type === 'headline' || type === 'eyebrow') ? 'Plus Jakarta Sans' : (type === 'callout' ? 'Outfit' : 'Inter');
}

/**
 * Returns fonts categorized as recommended for the specified language vs others.
 * @param {string} langCode
 * @returns {{ recommended: Array, others: Array, all: Array }}
 */
export function getRecommendedFontsForLanguage(langCode) {
  const code = (langCode || 'en').toLowerCase().split('-')[0];
  const recommended = [];
  const others = [];

  POPULAR_FONTS.forEach(font => {
    let matches = false;
    if (code === 'ar' || code === 'fa' || code === 'ur') {
      matches = font.scripts?.includes('arabic');
    } else if (code === 'ja') {
      matches = font.scripts?.includes('japanese');
    } else if (code === 'ko') {
      matches = font.scripts?.includes('korean');
    } else if (code === 'zh') {
      matches = font.scripts?.includes('chinese');
    } else if (code === 'ru' || code === 'uk') {
      matches = font.scripts?.includes('cyrillic');
    } else {
      matches = font.scripts?.includes('latin');
    }

    if (matches) {
      recommended.push({ ...font, isRecommended: true });
    } else {
      others.push({ ...font, isRecommended: false });
    }
  });

  return { recommended, others, all: [...recommended, ...others] };
}

/**
 * Pre-loads the recommended fonts for the given language into the document.
 * @param {string} langCode
 */
export function ensureLanguageFontsLoaded(langCode) {
  const { recommended } = getRecommendedFontsForLanguage(langCode);
  recommended.forEach(f => loadFont(f.name));
}

// Track loaded font families in the DOM
const loadedFonts = new Set();

/**
 * Dynamically ensures a Google Font family is loaded into the browser document.
 * @param {string} fontFamily
 */
export function loadFont(fontFamily) {
  if (typeof document === 'undefined' || !fontFamily || loadedFonts.has(fontFamily)) return;

  try {
    const fontDef = POPULAR_FONTS.find(f => f.name.toLowerCase() === fontFamily.toLowerCase());
    const weights = fontDef ? fontDef.weights.join(';') : '400;600;700;800';
    const linkId = `gfont-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;

    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weights}&display=swap`;
      // Fetch the font files now (canvas text doesn't trigger it); `loadingdone` then tells the renderer to redraw
      link.onload = () => document.fonts.load(`400 16px "${fontFamily}"`).catch(() => {});
      document.head.appendChild(link);
      loadedFonts.add(fontFamily);
    }
  } catch (err) {
    console.warn(`Could not load font ${fontFamily}:`, err);
  }
}

/**
 * Checks if a string contains Right-to-Left characters (Arabic, Hebrew, etc.).
 * @param {string} text
 * @returns {boolean}
 */
export function isRtlText(text) {
  if (!text) return false;
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

export const TEXT_PRESETS = [
  {
    id: 'headline',
    name: 'Headline',
    icon: 'title',
    preview: 'Large & Bold',
    style: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 72,
      fontWeight: '800',
      color: '#ffffff',
      shadow: true,
      lineHeight: 1.15,
      align: 'center'
    }
  },
  {
    id: 'subtitle',
    name: 'Subtitle',
    icon: 'short_text',
    preview: 'Readable Description',
    style: {
      fontFamily: 'Inter',
      fontSize: 34,
      fontWeight: '400',
      color: '#cbd5e1',
      shadow: false,
      lineHeight: 1.35,
      align: 'center'
    }
  },
  {
    id: 'eyebrow',
    name: 'Tag / Eyebrow',
    icon: 'label',
    preview: 'UPPERCASE ACCENT',
    style: {
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 22,
      fontWeight: '800',
      color: '#818cf8',
      shadow: false,
      lineHeight: 1.2,
      align: 'center'
    }
  },
  {
    id: 'callout',
    name: 'Promo Callout',
    icon: 'bolt',
    preview: 'Punchy Banner',
    style: {
      fontFamily: 'Outfit',
      fontSize: 48,
      fontWeight: '800',
      color: '#38bdf8',
      shadow: true,
      lineHeight: 1.2,
      align: 'center'
    }
  },
  {
    id: 'caption',
    name: 'Body / Caption',
    icon: 'chat_bubble',
    preview: 'Compact detail',
    style: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: '400',
      color: '#94a3b8',
      shadow: false,
      lineHeight: 1.4,
      align: 'center'
    }
  }
];

/**
 * Renders wrapped multi-line text onto an HTML5 Canvas 2D context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} options Text configuration options
 * @returns {{ width: number, height: number, cx: number, cy: number, bounds: Object }} Calculated rendered text bounds
 */
export function renderWrappedText(ctx, options) {
  const {
    text = '',
    fontFamily = 'Plus Jakarta Sans',
    fontSize = 64,
    fontWeight = '700',
    color = '#ffffff',
    align = 'center',
    maxWidth = 920,
    lineHeight = 1.25,
    x = 540,
    y = 120,
    rotation = 0,
    shadow = false,
    shadowColor = 'rgba(0, 0, 0, 0.35)',
    shadowBlur = 10,
    shadowOffsetY = 4
  } = options;

  if (!text) return { width: 0, height: 0, cx: x, cy: y, bounds: { x, y, width: 0, height: 0, cx: x, cy: y, rotation: 0 } };

  // Handle line wrapping
  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", Inter, system-ui, sans-serif`;

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  let maxLineWidth = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      const measured = ctx.measureText(currentLine).width;
      if (measured > maxLineWidth) maxLineWidth = measured;
      currentLine = words[n];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
    const measured = ctx.measureText(currentLine).width;
    if (measured > maxLineWidth) maxLineWidth = measured;
  }

  const computedLineHeight = fontSize * lineHeight;
  const totalHeight = lines.length * computedLineHeight;
  const actualWidth = Math.max(maxLineWidth, 80);

  // Center coordinates of the rendered text block
  let boundsX = x - actualWidth / 2;
  let cx = x;
  if (align === 'left') {
    boundsX = x;
    cx = x + actualWidth / 2;
  } else if (align === 'right') {
    boundsX = x - actualWidth;
    cx = x - actualWidth / 2;
  }
  const cy = y + totalHeight / 2;

  if (rotation) {
    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';

  if (shadow) {
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shadowOffsetY;
  }

  // Render each line
  lines.forEach((line, index) => {
    const lineY = y + index * computedLineHeight;
    ctx.fillText(line, x, lineY);
  });

  ctx.restore();

  const bounds = {
    x: boundsX,
    y,
    width: actualWidth,
    height: totalHeight,
    cx,
    cy,
    rotation: rotation || 0
  };

  return {
    width: actualWidth,
    height: totalHeight,
    cx,
    cy,
    bounds
  };
}
