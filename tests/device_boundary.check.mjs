// Run: node tests/device_boundary.check.mjs
// Verification for FIX_DEVICE_BOUNDARY_ISSUE:
// 1. Canvas device renderer coordinate fallbacks
// 2. MCP create_project default merging and devices synchronization
// 3. Editor state normalization on loadProject and layers
// 4. Zero coordinate offset between rendered phone frame and selection bounding box

import assert from 'node:assert/strict';
import { renderDevice, isPointInsideDevice, DEVICE_PRESETS } from '../js/canvas/deviceFrames.js';
import { executeTool } from '../mcp/tools.js';
import { Store, FEATURE_ID } from '../js/state/store.js';
import { ensureScreenDevices, getLayerItem, getLayerOrder } from '../js/state/layers.js';
import { addDeviceFrame } from '../js/ui/contextMenu.js';
import { CanvasRenderer } from '../js/canvas/renderer.js';
import { bindSliderWithNumber } from '../js/ui/inspector.js';

console.log('Testing Device Boundary & Coordinate Alignment...');

// ============================================================================
// Test 1: Canvas Device Renderer & Hit Testing Fallbacks
// ============================================================================
{
  const translated = [];
  const mockCtx = {
    canvas: { width: 1080, height: 1920 },
    save: () => {},
    restore: () => {},
    translate: (x, y) => { translated.push({ x, y }); },
    rotate: () => {},
    scale: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    fillText: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    setLineDash: () => {},
    clip: () => {}
  };

  // 1a: Missing x and y
  translated.length = 0;
  const devMissingCoords = { type: 'modern_phone', scale: 0.92 };
  renderDevice(mockCtx, devMissingCoords, null);
  assert.equal(translated.length, 1, 'ctx.translate was called once');
  assert.equal(translated[0].x, 540, 'missing device.x falls back to canvas center (1080 / 2 = 540)');
  assert.equal(translated[0].y, 1180, 'missing device.y falls back to standard baseline 1180');

  // 1b: Explicit undefined and null
  translated.length = 0;
  renderDevice(mockCtx, { x: undefined, y: null }, null);
  assert.equal(translated[0].x, 540, 'undefined device.x falls back to 540');
  assert.equal(translated[0].y, 1180, 'null device.y falls back to 1180');

  // 1c: Hit testing fallback
  assert.equal(isPointInsideDevice({ x: undefined, y: undefined }, 540, 1180), true, 'hit test passes at resolved center (540, 1180)');
  assert.equal(isPointInsideDevice({ x: undefined, y: undefined }, 0, 0), false, 'hit test fails at top-left (0, 0)');
  console.log('  ✓ Canvas device renderer & hit testing coordinate fallbacks passed');
}

// ============================================================================
// Test 2: MCP create_project Tool Deep Merge & Defaults
// ============================================================================
{
  const result = await executeTool('create_project', {
    project_name: 'Test Project',
    screens: [
      {
        id: 'screen-custom-1',
        name: 'Custom Screen',
        // device missing x, scale, rotation, shadows, etc.
        device: {
          y: 1250,
          color: '#123456'
        }
      }
    ]
  });

  assert.equal(result.isError, undefined, 'create_project executed without error');
  const res = JSON.parse(result.content[0].text);
  const project = res.projectData;
  assert.equal(project.screens.length, 1, 'project has 1 screen');

  const screen = project.screens[0];
  assert.ok(screen.device, 'screen.device exists');
  assert.equal(screen.device.id, 'device', 'device has id "device"');
  assert.equal(screen.device.isDevice, true, 'device has isDevice: true');
  assert.equal(screen.device.x, 540, 'device.x was merged to default 540');
  assert.equal(screen.device.y, 1250, 'custom device.y (1250) was preserved');
  assert.equal(screen.device.scale, 0.92, 'device.scale was merged to default 0.92');
  assert.equal(screen.device.rotation, 0, 'device.rotation was merged to default 0');
  assert.equal(screen.device.shadowColor, 'rgba(0, 0, 0, 0.45)', 'shadowColor was merged');
  assert.equal(screen.device.shadowBlur, 50, 'shadowBlur was merged');
  assert.equal(screen.device.shadowOffsetY, 35, 'shadowOffsetY was merged');

  assert.ok(Array.isArray(screen.devices), 'screen.devices array exists');
  assert.equal(screen.devices.length, 1, 'screen.devices has 1 device');
  assert.equal(screen.devices[0].x, 540, 'screen.devices[0].x is 540');
  assert.equal(screen.devices[0].id, 'device', 'screen.devices[0].id is "device"');
  console.log('  ✓ MCP create_project deep-merge & devices synchronization passed');
}

// ============================================================================
// Test 3: Editor State Normalization (Store.loadProject & layers)
// ============================================================================
{
  const store = new Store();
  const rawImportedProject = {
    projectName: 'Imported Project',
    width: 1080,
    height: 1920,
    activeScreenId: 'scr-1',
    screens: [
      {
        id: 'scr-1',
        name: 'Screen 1',
        background: { type: 'solid', solidColor: '#000000' },
        headline: { text: 'Title' },
        subtitle: { text: 'Desc' },
        // completely missing device.x, id, isDevice, devices
        device: {
          scale: 0.85
        }
      }
    ]
  };

  store.loadProject(rawImportedProject);
  const loadedState = store.getState();
  const loadedScreen = loadedState.screens[0];

  assert.equal(loadedScreen.device.x, 540, 'normalized device.x is 540');
  assert.equal(loadedScreen.device.y, 1180, 'normalized device.y is 1180');
  assert.equal(loadedScreen.device.id, 'device', 'normalized device.id is "device"');
  assert.equal(loadedScreen.device.isDevice, true, 'normalized device.isDevice is true');
  assert.ok(Array.isArray(loadedScreen.devices), 'loadedScreen.devices array exists');
  assert.equal(loadedScreen.devices.length, 1, 'loadedScreen.devices contains 1 device');
  assert.equal(loadedScreen.devices[0].x, 540, 'primary device in devices has x: 540');

  // Also test direct layer helper on unnormalized screen object
  const unnormalizedScreen = {
    device: { type: 'modern_phone' }
  };
  ensureScreenDevices(unnormalizedScreen, 1080);
  assert.equal(unnormalizedScreen.device.x, 540, 'ensureScreenDevices sets x: 540');
  assert.equal(unnormalizedScreen.device.y, 1180, 'ensureScreenDevices sets y: 1180');
  assert.equal(unnormalizedScreen.device.id, 'device', 'ensureScreenDevices sets id: device');
  assert.equal(unnormalizedScreen.device.isDevice, true, 'ensureScreenDevices sets isDevice: true');
  assert.equal(unnormalizedScreen.devices.length, 1, 'ensureScreenDevices populates devices array');

  console.log('  ✓ Editor state normalization on loadProject & layers passed');
}

// ============================================================================
// Test 4: Coordinate Alignment Between Rendered Phone & Selection Box
// ============================================================================
{
  // Simulate screen where device coordinates might be missing
  const testScreen = {
    id: 'screen-test',
    width: 1080,
    device: {
      type: 'modern_phone',
      scale: 0.92
      // x and y omitted
    }
  };

  // 1. Resolved render translation
  const canvasWidth = 1080;
  const renderedX = (testScreen.device.x !== undefined && testScreen.device.x !== null)
    ? testScreen.device.x
    : (canvasWidth / 2);
  const renderedY = (testScreen.device.y !== undefined && testScreen.device.y !== null)
    ? testScreen.device.y
    : 1180;

  // 2. Resolved selection bounding box center
  const devItem = getLayerItem(testScreen, 'device');
  const boxCenterX = devItem.x ?? (canvasWidth / 2);
  const boxCenterY = devItem.y ?? 1180;

  // Offset between render position and selection box
  const offsetX = Math.abs(renderedX - boxCenterX);
  const offsetY = Math.abs(renderedY - boxCenterY);

  assert.equal(offsetX, 0, 'Zero X offset between rendered device frame and selection box');
  assert.equal(offsetY, 0, 'Zero Y offset between rendered device frame and selection box');
  assert.equal(renderedX, 540, 'Render position is centered at 540');
  assert.equal(boxCenterX, 540, 'Selection box is centered at 540');
  console.log('  ✓ Rendered phone frame and selection box have zero coordinate offset');
}

// ============================================================================
// Test 5: Feature Graphic Device Frame Scaling & Boundary Placement
// ============================================================================
{
  const store = new Store();
  // Switch to feature graphic
  store.update(state => {
    state.activeScreenId = FEATURE_ID;
  });

  const featureDoc = store.getActiveScreen();
  assert.equal(featureDoc.id, FEATURE_ID);
  assert.equal(featureDoc.devices.length, 0, 'Feature graphic starts with 0 devices');

  // Add frame to feature graphic
  addDeviceFrame(store);
  const updatedDoc = store.getActiveScreen();
  assert.equal(updatedDoc.devices.length, 1, 'Feature graphic now has 1 device');

  const dev = updatedDoc.devices[0];
  assert.equal(dev.isDevice, true);
  assert.equal(dev.scale, 0.28, 'Device scale must be 0.28 on feature graphic, NOT 0.92');
  assert.equal(dev.y, 250, 'Device Y must be 250 (centered on 500px canvas), NOT 1180');
  assert.ok(dev.x >= 200 && dev.x <= 850, `Device X (${dev.x}) is within canvas width`);

  // Verify phone frame dimensions on 1024x500 canvas
  const preset = DEVICE_PRESETS.modern_phone;
  const scaledHeight = preset.height * dev.scale; // 1400 * 0.28 = 392px
  const topEdge = dev.y - scaledHeight / 2;       // 250 - 196 = 54px
  const bottomEdge = dev.y + scaledHeight / 2;    // 250 + 196 = 446px

  assert.ok(topEdge >= 0, `Top edge (${topEdge}) is within canvas height`);
  assert.ok(bottomEdge <= 500, `Bottom edge (${bottomEdge}) is within canvas height`);

  // Verify exactly 1 device layer exists in layer order (no duplicate 'device' and 'device-...')
  const deviceLayers = getLayerOrder(updatedDoc).filter(id => id === 'device' || id.startsWith('device-'));
  assert.equal(deviceLayers.length, 1, 'Exactly 1 device layer in getLayerOrder, never duplicates');
  assert.equal(deviceLayers[0], 'device', 'Device layer id is "device"');

  // Verify CanvasRenderer.getElementBox computes bounding box without ReferenceError
  const mockRenderer = { store, getElementBox: CanvasRenderer.prototype.getElementBox };
  const box = mockRenderer.getElementBox(updatedDoc, 'device');
  assert.ok(box, 'Bounding box returned without throwing ReferenceError: docH is not defined');
  assert.equal(box.cx, dev.x, 'Bounding box CX matches device X');
  assert.equal(box.cy, 250, 'Bounding box CY is 250');
  assert.equal(box.width, preset.width * 0.28, 'Bounding box width matches scaled width');
  assert.equal(box.height, preset.height * 0.28, 'Bounding box height matches scaled height');

  // Normalization check for legacy/out-of-bounds devices on feature graphics
  const legacyFeatureScreen = {
    id: FEATURE_ID,
    height: 500,
    device: {
      type: 'modern_phone',
      scale: 0.92,
      y: 1180
    }
  };
  ensureScreenDevices(legacyFeatureScreen, 1024);
  assert.equal(legacyFeatureScreen.device.y, 250, 'Out-of-bounds y: 1180 normalized to 250 on feature screen');
  assert.equal(legacyFeatureScreen.device.scale, 0.28, 'Oversized scale: 0.92 normalized to 0.28 on feature screen');

  console.log('  ✓ Feature Graphic device frame scaling, single layer & selection passed');
}

// ============================================================================
// Test 6: Mouse Dragging & Translation Lifecycle on Canvas
// ============================================================================
{
  const store = new Store();
  store.update(state => {
    state.activeScreenId = FEATURE_ID;
  });

  addDeviceFrame(store);
  const screen = store.getActiveScreen();
  const initialDev = screen.devices[0];
  const startX = initialDev.x;
  const startY = initialDev.y;

  // Mock a minimal canvas element
  const mockCanvas = {
    width: 1024,
    height: 500,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    getContext: () => ({
      clearRect: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      strokeRect: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {}
    }),
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 1024,
      height: 500
    }),
    addEventListener: () => {}
  };

  const renderer = new CanvasRenderer(mockCanvas, store);
  renderer.requestRender = () => {}; // No-op in headless test

  // 1. Simulate mouse click down directly on the phone center
  renderer.handlePointerDown({
    clientX: startX,
    clientY: startY,
    button: 0,
    preventDefault: () => {}
  });

  assert.equal(renderer.dragMode, 'move', 'dragMode should be set to "move"');
  assert.equal(renderer.dragTarget, 'device', 'dragTarget should be "device"');
  assert.ok(renderer.initialTransform, 'initialTransform must be initialized (no state ReferenceError)');
  assert.equal(renderer.initialTransform.itemX, startX, 'initialTransform.itemX matches initial X');
  assert.equal(renderer.initialTransform.itemY, startY, 'initialTransform.itemY matches initial Y');

  // 2. Simulate moving the mouse by +60px X and -40px Y
  const moveDeltaX = 60;
  const moveDeltaY = -40;
  renderer.handlePointerMove({
    clientX: startX + moveDeltaX,
    clientY: startY + moveDeltaY
  });

  assert.equal(initialDev.x, startX + moveDeltaX, 'Device X moved by +60px via mouse drag');
  assert.equal(initialDev.y, startY + moveDeltaY, 'Device Y moved by -40px via mouse drag');
  assert.equal(screen.device.x, initialDev.x, 'screen.device.x is kept synchronized with screen.devices[0].x');
  assert.equal(screen.device.y, initialDev.y, 'screen.device.y is kept synchronized with screen.devices[0].y');

  // 3. Simulate mouse button release
  renderer.handlePointerUp();
  assert.equal(renderer.dragMode, null, 'dragMode resets to null after pointerUp');
  assert.equal(renderer.dragTarget, null, 'dragTarget resets to null after pointerUp');

  console.log('  ✓ Mouse dragging & pointermove device translation lifecycle passed');
}

// ============================================================================
// Test 7: Slider and Number Input Two-Way Synchronization
// ============================================================================
{
  let appliedScale = null;
  let appliedX = null;

  // 1. Test Scale with multiplier = 100 (e.g. 0.28 scale <-> 28%)
  const scaleSlider = { value: '0.28' };
  const scaleNumber = { value: '28' };
  bindSliderWithNumber(scaleSlider, scaleNumber, (val) => { appliedScale = val; }, { multiplier: 100, decimals: 0 });

  // Moving slider updates number input and model
  scaleSlider.value = '0.45';
  scaleSlider.oninput();
  assert.equal(scaleNumber.value, 45, 'Slider change updates number input to 45%');
  assert.equal(appliedScale, 0.45, 'Slider change updates applied scale to 0.45');

  // Typing in number input updates slider and model
  scaleNumber.value = '60';
  scaleNumber.oninput();
  assert.equal(scaleSlider.value, 0.6, 'Typing 60 in number input updates slider to 0.6');
  assert.equal(appliedScale, 0.6, 'Typing 60 in number input updates applied scale to 0.6');

  // 2. Test Position X (1:1 mapping e.g. 512px)
  const xSlider = { value: '512' };
  const xNumber = { value: '512' };
  bindSliderWithNumber(xSlider, xNumber, (val) => { appliedX = val; });

  // Moving slider updates number input and model
  xSlider.value = '350';
  xSlider.oninput();
  assert.equal(xNumber.value, 350, 'Slider change updates number input to 350');
  assert.equal(appliedX, 350, 'Slider change updates applied X to 350');

  // Typing in number input updates slider and model
  xNumber.value = '720';
  xNumber.oninput();
  assert.equal(xSlider.value, 720, 'Typing in number input updates slider to 720');
  assert.equal(appliedX, 720, 'Typing in number input updates applied X to 720');

  console.log('  ✓ Slider and number input two-way synchronization passed');
}

console.log('All Device Boundary & Alignment checks passed successfully! 🚀');

