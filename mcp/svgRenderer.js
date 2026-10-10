/**
 * App Screen Studio - SVG Renderer for MCP and Headless Environments
 * Generates self-contained SVG mockups for screenshot screens and feature graphics,
 * allowing AI agents to visually inspect designs without a browser canvas.
 */

import { DEVICE_PRESETS } from '../js/canvas/deviceFrames.js';

/**
 * Escapes special XML characters in text strings.
 * @param {string} str Input string
 * @returns {string} XML-safe string
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wraps text into lines fitting within a maximum character width.
 * @param {string} text Text to wrap
 * @param {number} [maxCharsPerLine=28] Approximate character limit per line
 * @returns {Array<string>} Array of wrapped lines
 */
function wrapTextToLines(text, maxCharsPerLine = 28) {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Generates SVG linear gradient or solid fill definition.
 * @param {Object} background Background config
 * @param {string} gradientId Unique gradient ID
 * @returns {{ def: string, fill: string }}
 */
function createBackgroundFill(background = {}, gradientId = 'bgGrad') {
  try {
    if (background.type === 'solid' || !background.color2) {
      return {
        def: '',
        fill: background.solidColor || background.color1 || '#0f172a'
      };
    }

    const angle = background.angle !== undefined ? background.angle : 135;
    const rad = (angle * Math.PI) / 180;
    const x1 = Math.round(50 - Math.cos(rad) * 50);
    const y1 = Math.round(50 - Math.sin(rad) * 50);
    const x2 = Math.round(50 + Math.cos(rad) * 50);
    const y2 = Math.round(50 + Math.sin(rad) * 50);

    const c1 = background.color1 || '#4f46e5';
    const c2 = background.color2 || '#7c3aed';

    const def = `
      <linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    `;
    return { def, fill: `url(#${gradientId})` };
  } catch (error) {
    console.error('Error creating background fill:', error);
    return { def: '', fill: '#0f172a' };
  }
}

/**
 * Generates SVG markup for a realistic device frame mockup.
 * @param {Object} device Device configuration
 * @returns {string} SVG group markup
 */
function renderDeviceMockup(device = {}) {
  try {
    const type = device.type || 'modern_phone';
    const preset = DEVICE_PRESETS[type] || DEVICE_PRESETS.modern_phone;
    const x = device.x !== undefined ? device.x : 540;
    const y = device.y !== undefined ? device.y : 1180;
    const scale = device.scale !== undefined ? device.scale : 0.92;
    const rotation = device.rotation || 0;
    const frameColor = device.color || '#0f172a';

    const w = preset.width;
    const h = preset.height;
    const halfW = w / 2;
    const halfH = h / 2;
    const bezel = preset.bezel;
    const frameRadius = preset.frameRadius;
    const screenRadius = preset.screenRadius;
    const screenW = w - bezel * 2;
    const screenH = h - bezel * 2;
    const screenX = -halfW + bezel;
    const screenY = -halfH + bezel;

    let cameraSvg = '';
    if (preset.cameraRadius > 0) {
      cameraSvg = `<circle cx="0" cy="${-halfH + preset.cameraY}" r="${preset.cameraRadius}" fill="#030712" stroke="#1f2937" stroke-width="1.5" />`;
    }

    return `
      <g transform="translate(${x}, ${y}) rotate(${rotation}) scale(${scale})">
        <!-- Phone Drop Shadow -->
        <rect x="${-halfW + 4}" y="${-halfH + 18}" width="${w}" height="${h}" rx="${frameRadius}" ry="${frameRadius}" fill="rgba(0,0,0,0.35)" filter="url(#dropShadow)" />
        <!-- Phone Outer Chassis -->
        <rect x="${-halfW}" y="${-halfH}" width="${w}" height="${h}" rx="${frameRadius}" ry="${frameRadius}" fill="${frameColor}" stroke="#334155" stroke-width="3" />
        <!-- Phone Screen Glass -->
        <rect x="${screenX}" y="${screenY}" width="${screenW}" height="${screenH}" rx="${screenRadius}" ry="${screenRadius}" fill="#0b0f19" />
        <!-- Screen Content Mockup Lines -->
        <rect x="${screenX + 30}" y="${screenY + 60}" width="${screenW - 60}" height="140" rx="16" fill="rgba(255,255,255,0.08)" />
        <rect x="${screenX + 30}" y="${screenY + 230}" width="${screenW - 60}" height="80" rx="12" fill="rgba(255,255,255,0.05)" />
        <rect x="${screenX + 30}" y="${screenY + 330}" width="${screenW - 60}" height="80" rx="12" fill="rgba(255,255,255,0.05)" />
        <rect x="${screenX + 30}" y="${screenY + 430}" width="${screenW - 60}" height="260" rx="16" fill="rgba(255,255,255,0.06)" />
        <!-- Punch-hole Selfie Camera -->
        ${cameraSvg}
        <!-- Glass Screen Glare Reflection -->
        <path d="M ${-halfW + bezel} ${-halfH + bezel} L ${halfW - bezel} ${-halfH + bezel + 220} L ${halfW - bezel} ${-halfH + bezel} Z" fill="rgba(255,255,255,0.03)" />
      </g>
    `;
  } catch (error) {
    console.error('Error rendering device mockup:', error);
    return '';
  }
}

/**
 * Generates SVG markup for badges, pills, and cards.
 * @param {Object} shape Shape/badge configuration
 * @returns {string} SVG group markup
 */
function renderShapeElement(shape = {}) {
  try {
    const x = shape.x !== undefined ? shape.x : 540;
    const y = shape.y !== undefined ? shape.y : 105;
    const w = shape.width || 440;
    const h = shape.height || 64;
    const halfW = w / 2;
    const halfH = h / 2;
    const radius = shape.borderRadius !== undefined ? shape.borderRadius : 32;
    const fill = shape.fillColor || '#ffffff';
    const textColor = shape.textColor || '#4f46e5';
    const borderColor = shape.borderColor || 'none';
    const borderWidth = shape.borderWidth || 0;
    const label = escapeXml(shape.label || '');
    const sublabel = escapeXml(shape.sublabel || '');
    const rotation = shape.rotation || 0;
    const scale = shape.scale || 1;

    return `
      <g transform="translate(${x}, ${y}) rotate(${rotation}) scale(${scale})">
        <rect x="${-halfW}" y="${-halfH}" width="${w}" height="${h}" rx="${radius}" ry="${radius}"
              fill="${fill}" stroke="${borderColor}" stroke-width="${borderWidth}"
              filter="url(#badgeShadow)" />
        <text x="0" y="${sublabel ? -6 : 6}" text-anchor="middle" dominant-baseline="middle"
              fill="${textColor}" font-family="Plus Jakarta Sans, sans-serif" font-size="22" font-weight="700">
          ${label}
        </text>
        ${sublabel ? `
          <text x="0" y="16" text-anchor="middle" dominant-baseline="middle"
                fill="${textColor}" opacity="0.8" font-family="Inter, sans-serif" font-size="14" font-weight="500">
            ${sublabel}
          </text>
        ` : ''}
      </g>
    `;
  } catch (error) {
    console.error('Error rendering shape element:', error);
    return '';
  }
}

/**
 * Generates a complete standalone SVG representation of an AppScreen screen.
 * @param {Object} screen Screen configuration
 * @param {Object} [options={}] Rendering options (width, height, isRtl)
 * @returns {string} Full SVG document string
 */
export function renderScreenToSvg(screen, options = {}) {
  try {
    if (!screen) throw new Error('Screen object is required');

    const width = options.width || 1080;
    const height = options.height || 1920;
    const isRtl = Boolean(options.isRtl);

    const gradId = `bgGrad_${screen.id || 'default'}`;
    const bg = createBackgroundFill(screen.background, gradId);

    // Headline setup
    const headline = screen.headline || {};
    const hlText = headline.text || '';
    const hlSize = headline.fontSize || 68;
    const hlWeight = headline.fontWeight || '800';
    const hlColor = headline.color || '#ffffff';
    const hlFont = headline.fontFamily || 'Plus Jakarta Sans';
    const hlY = headline.yOffset || 160;
    const hlLines = wrapTextToLines(hlText, 26);

    // Subtitle setup
    const subtitle = screen.subtitle || {};
    const subText = subtitle.text || '';
    const subSize = subtitle.fontSize || 32;
    const subWeight = subtitle.fontWeight || '400';
    const subColor = subtitle.color || '#cbd5e1';
    const subFont = subtitle.fontFamily || 'Inter';
    const subY = subtitle.yOffset || (hlY + hlLines.length * hlSize * 1.2 + 20);
    const subLines = wrapTextToLines(subText, 38);

    // Device mockup
    const deviceSvg = renderDeviceMockup(screen.device || {});

    // Shapes and badges
    const shapesSvg = Array.isArray(screen.shapes)
      ? screen.shapes.map(renderShapeElement).join('\n')
      : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="25" stdDeviation="30" flood-color="#000000" flood-opacity="0.5" />
    </filter>
    <filter id="badgeShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.25" />
    </filter>
    ${bg.def}
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${height}" fill="${bg.fill}" />

  <!-- Shapes & Badges (Background Layers) -->
  ${shapesSvg}

  <!-- Device Mockup Frame -->
  ${deviceSvg}

  <!-- Headline Text -->
  <text x="${width / 2}" y="${hlY}" text-anchor="middle"
        direction="${isRtl ? 'rtl' : 'ltr'}"
        fill="${hlColor}" font-family="${hlFont}, system-ui, sans-serif"
        font-size="${hlSize}" font-weight="${hlWeight}" letter-spacing="-1">
    ${hlLines.map((line, idx) => `<tspan x="${width / 2}" dy="${idx === 0 ? 0 : hlSize * 1.18}">${escapeXml(line)}</tspan>`).join('\n    ')}
  </text>

  <!-- Subtitle Text -->
  <text x="${width / 2}" y="${subY}" text-anchor="middle"
        direction="${isRtl ? 'rtl' : 'ltr'}"
        fill="${subColor}" font-family="${subFont}, system-ui, sans-serif"
        font-size="${subSize}" font-weight="${subWeight}">
    ${subLines.map((line, idx) => `<tspan x="${width / 2}" dy="${idx === 0 ? 0 : subSize * 1.35}">${escapeXml(line)}</tspan>`).join('\n    ')}
  </text>
</svg>`;
  } catch (error) {
    console.error('Failed to generate SVG for screen:', error);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="#0f172a"/><text x="540" y="960" fill="#ffffff" text-anchor="middle">Error generating SVG</text></svg>`;
  }
}

/**
 * Generates a complete standalone SVG representation of a 1024x500 Feature Graphic.
 * @param {Object} featureDoc Feature graphic document
 * @param {Array<Object>} [screens=[]] Screens to showcase
 * @returns {string} Full SVG document string
 */
export function renderFeatureGraphicToSvg(featureDoc, screens = []) {
  try {
    const width = 1024;
    const height = 500;
    const doc = featureDoc || {};

    const gradId = 'featureBgGrad';
    const bg = createBackgroundFill(doc.background || { type: 'gradient', color1: '#1e293b', color2: '#0f172a', angle: 135 }, gradId);

    const headline = doc.headline || { text: 'Showcase Your App', color: '#ffffff', fontSize: 48 };
    const subtitle = doc.subtitle || { text: 'The ultimate experience on Google Play', color: '#cbd5e1', fontSize: 22 };

    const hlLines = wrapTextToLines(headline.text || '', 20);
    const subLines = wrapTextToLines(subtitle.text || '', 28);

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <filter id="featShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.45" />
    </filter>
    ${bg.def}
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${bg.fill}" />

  <!-- Left: Promotional Copy -->
  <g transform="translate(60, 160)">
    <text x="0" y="0" fill="${headline.color || '#ffffff'}" font-family="Plus Jakarta Sans, sans-serif" font-size="${headline.fontSize || 48}" font-weight="800">
      ${hlLines.map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 54}">${escapeXml(line)}</tspan>`).join('\n      ')}
    </text>
    <text x="0" y="${hlLines.length * 54 + 20}" fill="${subtitle.color || '#cbd5e1'}" font-family="Inter, sans-serif" font-size="${subtitle.fontSize || 22}" font-weight="400">
      ${subLines.map((line, idx) => `<tspan x="0" dy="${idx === 0 ? 0 : 30}">${escapeXml(line)}</tspan>`).join('\n      ')}
    </text>
  </g>

  <!-- Right: Showcase Mockup Arrangement -->
  <g transform="translate(740, 260) scale(0.26)">
    <!-- Back Screen (Tilted) -->
    <g transform="translate(-160, 40) rotate(-12)">
      <rect x="-340" y="-700" width="680" height="1400" rx="58" ry="58" fill="#1e293b" stroke="#475569" stroke-width="4" filter="url(#featShadow)" />
      <rect x="-318" y="-678" width="636" height="1356" rx="44" ry="44" fill="#0f172a" />
    </g>
    <!-- Front Screen (Center) -->
    <g transform="translate(100, 0) rotate(8)">
      <rect x="-340" y="-700" width="680" height="1400" rx="58" ry="58" fill="#0f172a" stroke="#6366f1" stroke-width="5" filter="url(#featShadow)" />
      <rect x="-318" y="-678" width="636" height="1356" rx="44" ry="44" fill="#18181b" />
      <circle cx="0" cy="-652" r="10" fill="#000000" />
    </g>
  </g>
</svg>`;
  } catch (error) {
    console.error('Failed to generate SVG for feature graphic:', error);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500"><rect width="1024" height="500" fill="#1e293b"/><text x="512" y="250" fill="#ffffff" text-anchor="middle">Feature Graphic</text></svg>`;
  }
}
