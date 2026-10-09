/**
 * App Screen Generator - Intelligent Client-Side Background Removal Engine
 * Automatically detects and erases solid/gradient/light/dark backgrounds from uploaded images
 * using boundary-seeded flood fill, Euclidean color distance, and anti-aliased alpha feathering.
 * 100% serverless, zero external APIs, runs entirely offline in browser memory.
 */

/**
 * Calculates Euclidean distance between two RGB colors (0 to 100 scale).
 * @param {number} r1
 * @param {number} g1
 * @param {number} b1
 * @param {number} r2
 * @param {number} g2
 * @param {number} b2
 * @returns {number} Distance in percent (0 - 100)
 */
export function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Maximum possible distance in 3D RGB color space is sqrt(255^2 * 3) ~= 441.67
  return (Math.sqrt(dr * dr + dg * dg + db * db) / 441.67) * 100;
}

/**
 * Samples the 4 outer corners and perimeter borders to determine the dominant background color.
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @returns {{r: number, g: number, b: number}}
 */
export function sampleBackgroundColor(data, width, height) {
  const samples = [];
  const addSample = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    const a = data[idx + 3];
    if (a > 20) { // Disregard already transparent pixels
      samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
    }
  };

  // Sample corner patches (3x3 grid at each corner)
  const patchSize = Math.min(5, Math.floor(width / 4), Math.floor(height / 4));
  for (let dy = 0; dy < patchSize; dy++) {
    for (let dx = 0; dx < patchSize; dx++) {
      addSample(dx, dy); // Top-left
      addSample(width - 1 - dx, dy); // Top-right
      addSample(dx, height - 1 - dy); // Bottom-left
      addSample(width - 1 - dx, height - 1 - dy); // Bottom-right
    }
  }

  // Sample edge midpoints
  const midX = Math.floor(width / 2);
  const midY = Math.floor(height / 2);
  addSample(midX, 0);
  addSample(midX, height - 1);
  addSample(0, midY);
  addSample(width - 1, midY);

  if (samples.length === 0) {
    return { r: 255, g: 255, b: 255 }; // Default to pure white
  }

  // Calculate average RGB of the perimeter samples
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < samples.length; i++) {
    sumR += samples[i].r;
    sumG += samples[i].g;
    sumB += samples[i].b;
  }
  return {
    r: Math.round(sumR / samples.length),
    g: Math.round(sumG / samples.length),
    b: Math.round(sumB / samples.length)
  };
}

/**
 * Erases background from an Image or Canvas using boundary-seeded flood fill and smooth feathering.
 * @param {HTMLImageElement|HTMLCanvasElement} img
 * @param {Object} [options]
 * @param {number} [options.tolerance=32] Color distance threshold (0 - 100)
 * @param {number} [options.feather=2] Edge anti-aliasing / feathering radius (0 - 10)
 * @param {boolean} [options.contiguous=true] If true, only deletes background touching outer borders
 * @param {{r: number, g: number, b: number}|null} [options.targetColor=null] Explicit background color
 * @returns {HTMLCanvasElement}
 */
export function removeBackground(img, options = {}) {
  const tolerance = typeof options.tolerance === 'number' ? options.tolerance : 32;
  const feather = typeof options.feather === 'number' ? options.feather : 2;
  const contiguous = options.contiguous !== undefined ? options.contiguous : true;

  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Detect or apply target color
  const target = options.targetColor || sampleBackgroundColor(data, w, h);
  const tr = target.r, tg = target.g, tb = target.b;

  const totalPixels = w * h;
  const mask = new Uint8Array(totalPixels); // 0 = keep foreground, 1 = background to erase

  if (contiguous) {
    // High-performance boundary-connected Breadth-First Flood Fill
    const queue = new Int32Array(totalPixels);
    let head = 0;
    let tail = 0;
    const visited = new Uint8Array(totalPixels);

    const tryPush = (x, y) => {
      if (x < 0 || x >= w || y < 0 || y >= h) return;
      const pIdx = y * w + x;
      if (visited[pIdx]) return;
      visited[pIdx] = 1;

      const dIdx = pIdx * 4;
      const a = data[dIdx + 3];
      if (a < 15) {
        mask[pIdx] = 1;
        queue[tail++] = pIdx;
        return;
      }

      const dist = colorDistance(data[dIdx], data[dIdx + 1], data[dIdx + 2], tr, tg, tb);
      if (dist <= tolerance) {
        mask[pIdx] = 1;
        queue[tail++] = pIdx;
      }
    };

    // Seed all 4 outer image borders
    for (let x = 0; x < w; x++) {
      tryPush(x, 0);
      tryPush(x, h - 1);
    }
    for (let y = 1; y < h - 1; y++) {
      tryPush(0, y);
      tryPush(w - 1, y);
    }

    // Flood fill inwards
    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = Math.floor(curr / w);

      // 4-connected neighbors
      if (cx > 0) tryPush(cx - 1, cy);
      if (cx < w - 1) tryPush(cx + 1, cy);
      if (cy > 0) tryPush(cx, cy - 1);
      if (cy < h - 1) tryPush(cx, cy + 1);
    }
  } else {
    // Global color keying across the entire image
    for (let i = 0; i < totalPixels; i++) {
      const dIdx = i * 4;
      const a = data[dIdx + 3];
      if (a < 15) {
        mask[i] = 1;
        continue;
      }
      const dist = colorDistance(data[dIdx], data[dIdx + 1], data[dIdx + 2], tr, tg, tb);
      if (dist <= tolerance) {
        mask[i] = 1;
      }
    }
  }

  // Alpha feathering and smooth transparent edge gradient
  for (let i = 0; i < totalPixels; i++) {
    if (mask[i] === 1) {
      const dIdx = i * 4;
      const dist = colorDistance(data[dIdx], data[dIdx + 1], data[dIdx + 2], tr, tg, tb);
      if (dist <= tolerance - feather) {
        data[dIdx + 3] = 0; // Fully transparent
      } else {
        // Linear feather falloff for anti-aliased borders
        const factor = (dist - (tolerance - feather)) / (feather || 1);
        data[dIdx + 3] = Math.round(data[dIdx + 3] * Math.max(0, Math.min(1, factor)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Removes background from an image Data URL and returns a transparent PNG Data URL.
 * @param {string} src Data URL or image source
 * @param {Object} [options]
 * @returns {Promise<{src: string, width: number, height: number, targetColor: Object}>}
 */
export async function removeBackgroundFromDataUrl(src, options = {}) {
  const img = new Image();
  if (src.startsWith('http://') || src.startsWith('https://')) {
    img.crossOrigin = 'anonymous';
  }

  await new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for background removal.'));
    img.src = src;
  });

  const canvas = removeBackground(img, options);
  return {
    src: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
    targetColor: options.targetColor || null
  };
}
