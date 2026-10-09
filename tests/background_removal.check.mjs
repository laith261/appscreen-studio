// Run: node tests/background_removal.check.mjs — tests background removal algorithms
import assert from 'node:assert/strict';
import { colorDistance, sampleBackgroundColor } from '../js/canvas/backgroundRemoval.js';

console.log('Testing Background Removal Engine...');

// 1. Test color distance
const dIdentical = colorDistance(255, 255, 255, 255, 255, 255);
assert.equal(dIdentical, 0, 'identical colors have 0 distance');

const dOpposite = colorDistance(0, 0, 0, 255, 255, 255);
assert.ok(Math.abs(dOpposite - 100) < 0.1, 'opposite colors (black and white) have 100 distance');

const dClose = colorDistance(250, 250, 250, 255, 255, 255);
assert.ok(dClose > 0 && dClose < 5, 'near-white colors have very low distance');

// 2. Test sampleBackgroundColor with 4x4 image buffer
const w = 4;
const h = 4;
const data = new Uint8ClampedArray(w * h * 4);

// Fill with white background (255, 255, 255, 255)
for (let i = 0; i < data.length; i += 4) {
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
  data[i + 3] = 255;
}

// Put red square in the center pixels (1,1), (2,1), (1,2), (2,2)
const centerCoords = [[1, 1], [2, 1], [1, 2], [2, 2]];
for (const [cx, cy] of centerCoords) {
  const idx = (cy * w + cx) * 4;
  data[idx] = 255;   // R
  data[idx + 1] = 0; // G
  data[idx + 2] = 0; // B
  data[idx + 3] = 255;
}

const bg = sampleBackgroundColor(data, w, h);
assert.equal(bg.r, 255, 'detected background red channel is 255');
assert.equal(bg.g, 255, 'detected background green channel is 255');
assert.equal(bg.b, 255, 'detected background blue channel is 255');

console.log('  ✓ Color distance calculation verified');
console.log('  ✓ Background sampling and auto-detection verified');
console.log('All background removal unit checks passed successfully!');
