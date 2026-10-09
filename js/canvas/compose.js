/**
 * App Screen Generator - Document drawing
 * One place that draws a document (a listing screen or the feature graphic) onto a canvas.
 * Used by the editor canvas, exports, previews and the feature graphic's screens showcase.
 */

import { renderShape } from '../features/shapes/shapeLibrary.js';
import { renderDevice, loadCachedImage } from './deviceFrames.js';
import { renderWrappedText, loadFont } from '../features/text/fontManager.js';
import { getLayerOrder, getLayerItem } from '../state/layers.js';
import { FEATURE_ID } from '../state/store.js';

export const FEATURE_SIZE = { width: 1024, height: 500 };

/** Canvas size of a document: screens use the project's Play Store format, the feature graphic is 1024 × 500. */
export function docSize(state, doc) {
  return doc?.id === FEATURE_ID ? FEATURE_SIZE : { width: state.width, height: state.height };
}

/**
 * Draws `doc` (bottom → top in its layer order, hidden layers skipped).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} state Project state (format size, screens for the showcase)
 * @param {Object} doc Screen or feature graphic
 * @param {string} lang Language of the copy (RTL handling)
 * @param {{editor?: boolean}} opts editor = draw placeholders for empty texts
 * @returns {Promise<Object>} Hit-test bounds: { headline, subtitle, showcase }
 */
export async function drawDocument(ctx, state, doc, lang, { editor = false, transparentBg = false, onlyDevice = false } = {}) {
  const { width, height } = docSize(state, doc);
  const bounds = {};
  if (!transparentBg) {
    await drawBackground(ctx, doc.background, width, height);
  }

  for (const id of getLayerOrder(doc)) {
    const item = getLayerItem(doc, id);
    if (!item || item.hidden) continue;

    if (id === 'device' || id.startsWith('device-') || item.isDevice) {
      renderDevice(ctx, item, item.image ? await loadCachedImage(item.image) : null);
    } else if (id === 'headline' || id === 'subtitle') {
      if (!onlyDevice) bounds[id] = drawText(ctx, doc, id, width, lang, editor);
    } else if (id === 'showcase') {
      bounds.showcase = await drawShowcase(ctx, state, item, lang);
    } else if (item.type === 'image') {
      drawImageItem(ctx, item, await loadCachedImage(item.src));
    } else if (item.type === 'text') {
      if (!onlyDevice) bounds[id] = drawTextItem(ctx, item, width, lang, editor);
    } else {
      if (!onlyDevice) renderShape(ctx, item);
    }
  }
  return bounds;
}

/** Renders a document to its own full-size canvas. */
export async function renderDocCanvas(state, doc, lang, opts = {}) {
  const { width, height } = docSize(state, doc);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  await drawDocument(canvas.getContext('2d'), state, doc, lang, opts);
  return canvas;
}

async function drawBackground(ctx, bg = {}, width, height) {
  ctx.fillStyle = bg.solidColor || '#0f172a';
  if (bg.type !== 'solid') {
    const a = (bg.angle || 135) * Math.PI / 180;
    const grad = ctx.createLinearGradient(
      width / 2 - Math.cos(a) * width / 2, height / 2 - Math.sin(a) * height / 2,
      width / 2 + Math.cos(a) * width / 2, height / 2 + Math.sin(a) * height / 2
    );
    grad.addColorStop(0, bg.color1 || '#4f46e5');
    grad.addColorStop(1, bg.color2 || '#7c3aed');
    ctx.fillStyle = grad;
  }
  ctx.fillRect(0, 0, width, height);

  // Optional picture on top of the color, scaled to cover
  const img = bg.image ? await loadCachedImage(bg.image) : null;
  if (img) {
    const s = Math.max(width / img.naturalWidth, height / img.naturalHeight);
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  }
}

function drawText(ctx, doc, key, width, lang, editor) {
  const field = doc[key];
  if (!field || field.hidden) return null;
  const isHeadline = key === 'headline';
  const isRtl = lang === 'ar';
  const empty = !field.text || !field.text.trim();
  if (empty) return null;
  loadFont(field.fontFamily || (isHeadline ? 'Plus Jakarta Sans' : 'Inter'));

  return renderWrappedText(ctx, {
    text: field.text,
    fontFamily: isRtl ? 'Cairo' : (field.fontFamily || (isHeadline ? 'Plus Jakarta Sans' : 'Inter')),
    fontSize: field.fontSize || (isHeadline ? 72 : 34),
    fontWeight: field.fontWeight || (isHeadline ? '800' : '400'),
    color: field.color || (isHeadline ? '#ffffff' : '#e0e7ff'),
    align: isRtl ? 'center' : (field.align || 'center'),
    lineHeight: field.lineHeight || (isHeadline ? 1.2 : 1.4),
    x: field.x ?? width / 2,
    y: field.yOffset ?? (isHeadline ? 120 : 310),
    maxWidth: field.maxWidth || width - (isHeadline ? 160 : 200),
    rotation: field.rotation || 0,
    shadow: field.shadow !== undefined ? field.shadow : isHeadline
  }).bounds;
}

/** Draws a standalone text item placed on the canvas, with full styling and rotation. */
function drawTextItem(ctx, item, width, lang, editor) {
  if (!item || item.hidden) return null;
  const empty = !item.text || !item.text.trim();
  if (empty) return null;
  const isRtl = lang === 'ar';
  loadFont(item.fontFamily || 'Plus Jakarta Sans');

  const x = item.x ?? width / 2;
  const y = item.y ?? 220;
  const maxWidth = item.maxWidth || Math.min(width - 120, 880);

  return renderWrappedText(ctx, {
    text: item.text,
    fontFamily: isRtl ? 'Cairo' : (item.fontFamily || 'Plus Jakarta Sans'),
    fontSize: Math.round((item.fontSize || 48) * (item.scale || 1)),
    fontWeight: item.fontWeight || '700',
    color: item.color || '#ffffff',
    align: isRtl ? 'center' : (item.align || 'center'),
    lineHeight: item.lineHeight || 1.25,
    x,
    y,
    maxWidth,
    rotation: item.rotation || 0,
    shadow: item.shadow ?? false
  }).bounds;
}

/** An uploaded picture placed on the canvas (logo, artwork…), centred on x/y. */
function drawImageItem(ctx, item, img) {
  if (!img) return;
  const s = item.scale || 1;
  const w = (item.width || 200) * s, h = (item.height || 200) * s;
  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.rotation) ctx.rotate(item.rotation * Math.PI / 180);
  ctx.globalAlpha = item.opacity ?? 1;
  roundedTile(ctx, img, -w / 2, -h / 2, w, h, item.radius || 0, item.shadow);
  ctx.restore();
}

/** Draws an image into a rectangle with optional rounded corners and drop shadow. */
function roundedTile(ctx, img, x, y, w, h, radius, shadow, transparentBg = false) {
  ctx.save();
  if (!transparentBg) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(radius, w / 2, h / 2));
    if (shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = Math.max(12, h * 0.06);
      ctx.shadowOffsetY = Math.max(6, h * 0.025);
      ctx.fillStyle = '#000';
      ctx.fill(); // casts the shadow under the tile
      ctx.shadowColor = 'transparent';
    }
    ctx.clip();
  }
  ctx.drawImage(img, x, y, w, h);
  ctx.restore();
}

// ---- Screens showcase (feature graphic) ----

// ponytail: cache keyed by full screen JSON; cleared wholesale past 40 entries — fine for a handful of screens
const shotCache = new Map();

/** Full-size render of a listing screen, cached until the screen (or format/language) changes. */
export async function renderScreenShot(state, screen, lang, opts = {}) {
  const transparentBg = !!opts.transparentBg;
  const onlyDevice = !!opts.onlyDevice;
  const key = `${lang}|${state.width}x${state.height}|${transparentBg}|${onlyDevice}|${JSON.stringify(screen)}`;
  if (!shotCache.has(key)) {
    if (shotCache.size > 40) shotCache.clear();
    shotCache.set(key, renderDocCanvas(state, screen, lang, { transparentBg, onlyDevice }));
  }
  return shotCache.get(key);
}

/** Every screen id in the showcase's order; screens it hasn't seen yet are appended. */
export function showcaseOrder(state, item) {
  const ids = state.screens.map(s => s.id);
  const order = (item.order || []).filter(id => ids.includes(id));
  return [...order, ...ids.filter(id => !order.includes(id))];
}

/** The screens the showcase shows, in order (hidden ones left out). */
export function showcaseScreens(state, item) {
  const byId = new Map(state.screens.map(s => [s.id, s]));
  const hidden = item.hiddenIds || [];
  return showcaseOrder(state, item).filter(id => !hidden.includes(id)).map(id => byId.get(id));
}

/** The chosen screens side by side, centred on x/y, `height` tall. Returns its unrotated bounds. */
async function drawShowcase(ctx, state, item, lang) {
  const screens = showcaseScreens(state, item);
  const ratio = state.width / state.height;
  const gap = item.gap ?? 16;
  let h = item.height || 400;
  // Until the user sets a size, shrink so all screens fit in `fitWidth` (the banner's right side)
  if (item.autoFit !== false && screens.length) {
    const fitWidth = item.fitWidth || 540;
    h = Math.min(h, (fitWidth - (screens.length - 1) * gap) / (screens.length * ratio));
  }
  const w = h * ratio;
  const total = screens.length ? screens.length * w + (screens.length - 1) * gap : w;
  const left = -total / 2, top = -h / 2;

  const removeBg = !!(item.removeBackground || item.transparentBg);
  const onlyDevice = !!item.onlyDevice;

  const shots = await Promise.all(screens.map(s => renderScreenShot(state, s, lang, { transparentBg: removeBg, onlyDevice })));

  ctx.save();
  ctx.translate(item.x, item.y);
  if (item.rotation) ctx.rotate(item.rotation * Math.PI / 180);
  shots.forEach((shot, i) => roundedTile(ctx, shot, left + i * (w + gap), top, w, h, removeBg ? 0 : (item.radius ?? 16), removeBg ? false : (item.shadow ?? true), removeBg));
  ctx.restore();

  return { x: item.x + left, y: item.y + top, width: total, height: h };
}
