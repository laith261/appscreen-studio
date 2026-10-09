/**
 * App Screen Generator - Robust Image Upload Service
 * Handles file reading, automatic orientation & resizing optimization,
 * pre-caching, and instant canvas synchronization.
 */

import { imageCache } from './deviceFrames.js';
import { activeDoc, FEATURE_ID } from '../state/store.js';
import { docSize } from './compose.js';
import { getLayerOrder, getLayerItem, ensureScreenDevices } from '../state/layers.js';
import { customAlert } from '../ui/dialog.js';

/**
 * Validates, decodes and (if huge) downsizes an image file, and pre-caches it for canvas drawing.
 * @param {File|Blob} file
 * @param {number} maxDimension Longest side after optimisation
 * @returns {Promise<{src: string, width: number, height: number}|null>} null if it isn't a usable image
 */
export async function readImageFile(file, maxDimension = 2400) {
  if (!file) return null;
  const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name || '');
  if (!isImage) {
    customAlert({
      title: 'Invalid File',
      message: 'Please select a valid image file (PNG, JPG, WebP, or SVG).',
      icon: 'image',
      type: 'warning'
    });
    return null;
  }
  try {
    const rawDataUrl = await readFileAsDataUrl(file);
    const img = await loadImageElement(rawDataUrl);
    if (!img || !img.naturalWidth || !img.naturalHeight) throw new Error('Image could not be decoded.');

    // Downsize excessively large images to prevent memory lag, then pre-cache for instant drawing
    const src = optimizeImage(img, maxDimension);
    const finalImg = src === rawDataUrl ? img : await loadImageElement(src);
    imageCache.set(src, finalImg);
    return { src, width: finalImg.naturalWidth, height: finalImg.naturalHeight };
  } catch (err) {
    console.error('Failed to process image upload:', err);
    customAlert({
      title: 'Image Load Error',
      message: 'Could not load the image. Please try a different PNG or JPG file.',
      icon: 'broken_image',
      type: 'danger'
    });
    return null;
  }
}

import { removeBackgroundFromDataUrl } from './backgroundRemoval.js';

/**
 * Puts an uploaded app screenshot into the target phone frame (or active phone frame).
 * @param {File|Blob} file
 * @param {Object} store
 * @param {string|null} [targetDeviceId]
 * @param {Object} [options]
 * @param {boolean} [options.removeBackground=false]
 * @returns {Promise<boolean>} true on success
 */
export async function processImageUpload(file, store, targetDeviceId = null, options = {}) {
  let image = await readImageFile(file);
  if (!image) return false;

  let originalSrc = null;
  let bgRemoved = false;
  if (options.removeBackground) {
    try {
      originalSrc = image.src;
      const res = await removeBackgroundFromDataUrl(image.src, options.bgOptions || {});
      if (res && res.src) {
        image = { ...image, src: res.src };
        bgRemoved = true;
      }
    } catch (bgErr) {
      console.warn('Background removal on device upload failed, using original:', bgErr);
    }
  }

  store.update(state => {
    const doc = activeDoc(state);
    if (!doc) return;
    ensureScreenDevices(doc);
    const activeId = targetDeviceId || state.activeElementId;
    let dev = null;
    if (activeId && (activeId === 'device' || (typeof activeId === 'string' && activeId.startsWith('device-')))) {
      dev = getLayerItem(doc, activeId);
    }
    if (!dev) {
      dev = doc.devices?.[0] || doc.device;
    }
    if (!dev) {
      const { width, height } = docSize(state, doc);
      const small = doc.id === FEATURE_ID;
      dev = {
        id: 'device',
        type: 'modern_phone',
        color: '#0f172a',
        scale: small ? 0.3 : 0.92,
        x: small ? width * 0.2 : width / 2,
        y: small ? height / 2 : 1180,
        isDevice: true
      };
      doc.device = dev;
      doc.devices = [dev];
    }
    dev.hidden = false;
    dev.deleted = false;
    dev.image = image.src;
    if (bgRemoved) {
      dev.originalImage = originalSrc;
      dev.bgRemoved = true;
      dev.bgTolerance = options.bgOptions?.tolerance || 32;
    }
    dev.imageFit = dev.imageFit || 'cover';
    dev.imageOffsetX = dev.imageOffsetX || 0;
    dev.imageOffsetY = dev.imageOffsetY || 0;
    dev.imageScale = dev.imageScale || 1;
    if (doc.layerOrder && !doc.layerOrder.includes(dev.id || 'device')) {
      doc.layerOrder.push(dev.id || 'device');
    }
    state.activeElementId = dev.id || 'device';
  });
  return true;
}

/**
 * Adds an uploaded picture (logo, artwork…) as a movable layer on the active document, and selects it.
 * Supports auto background removal for transparent logos and graphics.
 * @param {File|Blob} file
 * @param {Object} store
 * @param {Object} [options]
 * @param {boolean} [options.removeBackground=false]
 * @param {Object} [options.bgOptions]
 * @returns {Promise<boolean>} true on success
 */
export async function addImageItem(file, store, options = {}) {
  let image = await readImageFile(file, 1600);
  if (!image) return false;

  let originalSrc = null;
  let bgRemoved = false;
  if (options.removeBackground) {
    try {
      originalSrc = image.src;
      const res = await removeBackgroundFromDataUrl(image.src, options.bgOptions || {});
      if (res && res.src) {
        image = { ...image, src: res.src, width: res.width, height: res.height };
        bgRemoved = true;
      }
    } catch (bgErr) {
      console.warn('Background removal failed, keeping original:', bgErr);
    }
  }

  const id = `image-${Date.now()}`;
  store.update(state => {
    const doc = activeDoc(state);
    if (!doc) return;
    const { width, height } = docSize(state, doc);
    // Start at up to 40% of the canvas, keeping the picture's proportions
    const fit = Math.min(1, (width * 0.4) / image.width, (height * 0.4) / image.height);
    doc.shapes = doc.shapes || [];
    // Freeze the current stacking so the new picture lands on top (documents without a saved order put shapes at the bottom)
    if (!doc.layerOrder) doc.layerOrder = getLayerOrder(doc);
    doc.shapes.push({
      id,
      type: 'image',
      src: image.src,
      originalSrc: originalSrc || (bgRemoved ? originalSrc : null),
      bgRemoved,
      bgTolerance: options.bgOptions?.tolerance || 32,
      bgFeather: options.bgOptions?.feather || 2,
      x: Math.round(width / 2),
      y: Math.round(height / 2),
      width: Math.round(image.width * fit),
      height: Math.round(image.height * fit),
      scale: 1,
      rotation: 0,
      opacity: 1,
      radius: 0,
      shadow: false
    });
    state.activeElementId = id;
  });
  return true;
}

/**
 * Sets (or replaces) the active document's background picture, drawn over its color, scaled to cover.
 * @returns {Promise<boolean>} true on success
 */
export async function setBackgroundImage(file, store) {
  const image = await readImageFile(file);
  if (!image) return false;
  store.update(state => {
    const doc = activeDoc(state);
    if (doc) doc.background = { ...doc.background, image: image.src };
  });
  return true;
}

/**
 * Reads a File into a Data URL.
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an HTMLImageElement from a source URL.
 */
function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode error.'));
    img.src = src;
  });
}

/**
 * Optimizes huge images down to a maximum dimension while maintaining aspect ratio and quality.
 */
function optimizeImage(img, maxDimension = 2400) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  // If within bounds, return original src
  if (w <= maxDimension && h <= maxDimension) {
    return img.src;
  }

  // Calculate scaled dimensions
  let newW = w;
  let newH = h;
  if (w > h && w > maxDimension) {
    newW = maxDimension;
    newH = Math.round((h * maxDimension) / w);
  } else if (h > maxDimension) {
    newH = maxDimension;
    newW = Math.round((w * maxDimension) / h);
  }

  const canvas = document.createElement('canvas');
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, newW, newH);

  return canvas.toDataURL('image/png', 0.95);
}
