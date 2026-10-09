/**
 * App Screen Generator - Device Frames & Mockup Rendering
 * Renders realistic Android device frames, minimalist frames, frameless cards,
 * punch-hole cameras, shadows, and clips uploaded user screenshots.
 */

// Cache loaded HTMLImageElement objects by source URL
export const imageCache = new Map();

/**
 * Loads an image from a URL or File Data URL and caches the HTMLImageElement.
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
export function loadCachedImage(src) {
  if (!src) return Promise.resolve(null);
  if (imageCache.has(src)) {
    const cached = imageCache.get(src);
    if (cached && (cached.complete || cached.naturalWidth > 0)) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve) => {
    const img = new Image();
    // Only set crossOrigin on external http/https URLs, NEVER on data: or blob:
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => {
      console.warn('Initial image load failed for source');
      if (img.crossOrigin) {
        const retryImg = new Image();
        retryImg.onload = () => {
          imageCache.set(src, retryImg);
          resolve(retryImg);
        };
        retryImg.onerror = () => resolve(null);
        retryImg.src = src;
      } else {
        resolve(null);
      }
    };
    img.src = src;
  });
}

/**
 * Device frame dimensions for various device types (based on standard canvas).
 */
export const DEVICE_PRESETS = {
  modern_phone: {
    width: 680,
    height: 1400,
    bezel: 22,
    screenRadius: 44,
    frameRadius: 58,
    cameraRadius: 10,
    cameraY: 26
  },
  minimal: {
    width: 660,
    height: 1380,
    bezel: 12,
    screenRadius: 36,
    frameRadius: 44,
    cameraRadius: 8,
    cameraY: 20
  },
  frameless: {
    width: 640,
    height: 1360,
    bezel: 0,
    screenRadius: 40,
    frameRadius: 40,
    cameraRadius: 0,
    cameraY: 0
  },
  tablet: {
    width: 820,
    height: 1280,
    bezel: 28,
    screenRadius: 32,
    frameRadius: 48,
    cameraRadius: 8,
    cameraY: 18
  }
};

/**
 * Renders the device frame and clipped user screenshot onto canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} device Device configuration object
 * @param {HTMLImageElement|null} loadedImage Preloaded image object
 */
export function renderDevice(ctx, device, loadedImage = null) {
  if (!device) return;

  const type = device.type || 'modern_phone';
  const preset = DEVICE_PRESETS[type] || DEVICE_PRESETS.modern_phone;

  ctx.save();
  ctx.translate(device.x, device.y);

  if (device.rotation) {
    ctx.rotate((device.rotation * Math.PI) / 180);
  }

  const scale = device.scale || 1;
  ctx.scale(scale, scale);

  const w = preset.width;
  const h = preset.height;
  const halfW = w / 2;
  const halfH = h / 2;

  // 1. Draw outer realistic drop shadow
  ctx.save();
  ctx.shadowColor = device.shadowColor || 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = device.shadowBlur !== undefined ? device.shadowBlur : 45;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = device.shadowOffsetY !== undefined ? device.shadowOffsetY : 30;

  drawRoundedRect(ctx, -halfW, -halfH, w, h, preset.frameRadius);
  ctx.fillStyle = device.color || '#0f172a';
  ctx.fill();
  ctx.restore();

  // 2. Draw metallic/matte bezel border (if not frameless)
  if (preset.bezel > 0) {
    // Outer phone chassis
    drawRoundedRect(ctx, -halfW, -halfH, w, h, preset.frameRadius);
    ctx.fillStyle = device.color || '#0f172a';
    ctx.fill();

    // Subtle edge highlight border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // 3. Screen display area coordinates
  const screenX = -halfW + preset.bezel;
  const screenY = -halfH + preset.bezel;
  const screenW = w - preset.bezel * 2;
  const screenH = h - preset.bezel * 2;

  // Clip to inner screen display bounds
  ctx.save();
  drawRoundedRect(ctx, screenX, screenY, screenW, screenH, preset.screenRadius);
  ctx.clip();

  // Background screen color (fallback)
  ctx.fillStyle = '#111827';
  ctx.fillRect(screenX, screenY, screenW, screenH);

  // 4. Render uploaded user screenshot if present
  if (loadedImage) {
    drawScreenContent(ctx, loadedImage, screenX, screenY, screenW, screenH, device);
  } else {
    // Elegant placeholder UI when no screenshot has been uploaded
    drawPlaceholderMockup(ctx, screenX, screenY, screenW, screenH);
  }

  // 5. Screen inner glass reflection (diagonal soft sheen)
  const sheenGrad = ctx.createLinearGradient(screenX, screenY, screenX + screenW, screenY + screenH * 0.6);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  sheenGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.03)');
  sheenGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(screenX, screenY, screenW, screenH);

  ctx.restore(); // restore screen clipping

  // 6. Punch-hole camera (for modern phone and minimal)
  if (preset.cameraRadius > 0) {
    ctx.save();
    ctx.fillStyle = '#050811';
    ctx.beginPath();
    ctx.arc(0, screenY + preset.cameraY, preset.cameraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle camera lens glare
    ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.beginPath();
    ctx.arc(1.5, screenY + preset.cameraY - 1.5, preset.cameraRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Draws uploaded image with proper aspect ratio scaling and offset inside the screen.
 */
function drawScreenContent(ctx, img, sx, sy, sw, sh, device) {
  if (!img) return;
  const fit = device.imageFit || 'cover';
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  if (!imgW || !imgH || !Number.isFinite(imgW) || !Number.isFinite(imgH)) {
    return;
  }

  let renderW, renderH, renderX, renderY;

  const scale = (device.imageScale || 1);
  const offsetX = (device.imageOffsetX || 0);
  const offsetY = (device.imageOffsetY || 0);

  if (fit === 'contain') {
    const ratio = Math.min(sw / imgW, sh / imgH) * scale;
    renderW = imgW * ratio;
    renderH = imgH * ratio;
    renderX = sx + (sw - renderW) / 2 + offsetX;
    renderY = sy + (sh - renderH) / 2 + offsetY;
  } else {
    // 'cover' mode
    const ratio = Math.max(sw / imgW, sh / imgH) * scale;
    renderW = imgW * ratio;
    renderH = imgH * ratio;
    renderX = sx + (sw - renderW) / 2 + offsetX;
    renderY = sy + (sh - renderH) / 2 + offsetY;
  }

  ctx.drawImage(img, renderX, renderY, renderW, renderH);
}

/**
 * Draws an interactive, beautiful placeholder mockup encouraging image upload.
 */
function drawPlaceholderMockup(ctx, sx, sy, sw, sh) {
  // Background card styling
  const bgGrad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
  bgGrad.addColorStop(0, '#1e293b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(sx, sy, sw, sh);

  // Status bar simulation at top
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '600 20px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('9:41', sx + 32, sy + 38);

  ctx.textAlign = 'right';
  ctx.fillText('100% 🔋', sx + sw - 32, sy + 38);

  // Dashed upload zone in center
  const boxW = sw - 80;
  const boxH = 460;
  const boxX = sx + 40;
  const boxY = sy + (sh - boxH) / 2 - 20;

  ctx.save();
  ctx.setLineDash([12, 8]);
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, boxX, boxY, boxW, boxH, 24);
  ctx.stroke();

  // Subtle interior glow
  ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
  ctx.fill();
  ctx.restore();

  // Upload Icon
  ctx.save();
  ctx.font = '64px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📱', sx + sw / 2, boxY + 110);

  // Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Upload App Screenshot', sx + sw / 2, boxY + 195);

  // Visual button inside canvas
  const btnW = 320;
  const btnH = 56;
  const btnX = sx + (sw - btnW) / 2;
  const btnY = boxY + 240;

  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
  btnGrad.addColorStop(0, '#4f46e5');
  btnGrad.addColorStop(1, '#6366f1');
  ctx.fillStyle = btnGrad;
  drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 14);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('📁 Click to Upload', sx + sw / 2, btnY + 36);

  // Helpful instructions
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 20px Inter, sans-serif';
  ctx.fillText('or Drag & Drop image here', sx + sw / 2, boxY + 345);
  ctx.font = '400 17px Inter, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('PNG, JPG, or WebP supported', sx + sw / 2, boxY + 385);

  // Simulated app mockup cards below
  const cardY = boxY + boxH + 35;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  drawRoundedRect(ctx, sx + 40, cardY, sw - 80, 100, 18);
  ctx.fill();

  drawRoundedRect(ctx, sx + 40, cardY + 120, sw - 80, 100, 18);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws a rounded rectangle helper.
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Checks if a canvas point (px, py) is inside the device frame.
 * @param {Object} device
 * @param {number} px
 * @param {number} py
 * @returns {boolean}
 */
export function isPointInsideDevice(device, px, py) {
  const type = device.type || 'modern_phone';
  const preset = DEVICE_PRESETS[type] || DEVICE_PRESETS.modern_phone;
  const scale = device.scale || 1;
  const w = preset.width * scale;
  const h = preset.height * scale;

  let dx = px - device.x;
  let dy = py - device.y;

  if (device.rotation) {
    const rad = (-device.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    dx = rx;
    dy = ry;
  }

  return Math.abs(dx) <= w / 2 && Math.abs(dy) <= h / 2;
}
