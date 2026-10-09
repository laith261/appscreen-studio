/**
 * Unit tests for ContextMenu actions and helper operations.
 */

import assert from 'node:assert/strict';
import { Store, activeDoc, FEATURE_ID } from '../js/state/store.js';
import {
  duplicateElement,
  deleteElement,
  reorderLayer,
  toggleLock,
  toggleHide,
  centerElement,
  resetElementRotation,
  removeDeviceScreenshot,
  addDeviceFrame,
  addHeadlineText,
  addSubtitleText,
  addTextLayer,
  buildElementContextMenuItems,
  buildCanvasContextMenuItems,
  buildScreenCardContextMenuItems
} from '../js/ui/contextMenu.js';
import { getLayerItem, getLayerOrder } from '../js/state/layers.js';

console.log('Testing Context Menu & Actions...');

// 1. Test duplicateElement for Device
{
  const store = new Store();
  const screen = store.getActiveScreen();
  const origDevice = screen.device;
  const origX = origDevice.x || 540;

  duplicateElement(store, 'device');
  const updatedDoc = store.getActiveScreen();

  assert.equal(updatedDoc.devices.length, 2, 'Should now have 2 devices');
  const newDev = updatedDoc.devices[1];
  assert.ok(newDev.id.startsWith('device-'), 'New device should have a generated device ID');
  assert.equal(newDev.x, origX + 60, 'New device X should be offset');
  assert.equal(store.getState().activeElementId, newDev.id, 'New device should become activeElementId');
  assert.ok(updatedDoc.layerOrder.includes(newDev.id), 'New device ID should be in layerOrder');
  console.log('  ✓ duplicateElement (device) passed');
}

// 2. Test duplicateElement for Headline / Text
{
  const store = new Store();
  const screen = store.getActiveScreen();
  screen.headline.text = 'Super App';

  duplicateElement(store, 'headline');
  const updatedDoc = store.getActiveScreen();

  assert.equal(updatedDoc.shapes.length, 1, 'Duplicating headline should create a new text shape');
  const textShape = updatedDoc.shapes[0];
  assert.equal(textShape.type, 'text');
  assert.equal(textShape.text, 'Super App');
  assert.equal(store.getState().activeElementId, textShape.id);
  console.log('  ✓ duplicateElement (headline -> text shape) passed');
}

// 3. Test duplicateElement for Shapes
{
  const store = new Store();
  const screen = store.getActiveScreen();
  screen.shapes = [{ id: 'shape-1', type: 'circle', x: 200, y: 200, width: 100, height: 100 }];
  screen.layerOrder = ['device', 'shape-1', 'headline', 'subtitle'];

  duplicateElement(store, 'shape-1');
  const updatedDoc = store.getActiveScreen();

  assert.equal(updatedDoc.shapes.length, 2, 'Should now have 2 shapes');
  const clone = updatedDoc.shapes[1];
  assert.ok(clone.id.startsWith('shape-'), 'Clone should have new shape ID');
  assert.equal(clone.x, 240, 'Clone X should be offset by 40');
  assert.equal(store.getState().activeElementId, clone.id);
  assert.ok(updatedDoc.layerOrder.includes(clone.id));
  console.log('  ✓ duplicateElement (shape) passed');
}

// 4. Test deleteElement
{
  const store = new Store();
  const screen = store.getActiveScreen();
  screen.shapes = [{ id: 'shape-del', type: 'star', x: 100, y: 100 }];
  screen.layerOrder = ['device', 'shape-del', 'headline', 'subtitle'];
  store.setActiveElement('shape-del');

  deleteElement(store, 'shape-del');
  const updatedDoc = store.getActiveScreen();

  assert.equal(updatedDoc.shapes.length, 0, 'Shape should be removed');
  assert.ok(!updatedDoc.layerOrder.includes('shape-del'), 'Shape should be removed from layerOrder');
  assert.equal(store.getState().activeElementId, null, 'activeElementId should be reset to null');
  console.log('  ✓ deleteElement passed');
}

// 5. Test reorderLayer
{
  const store = new Store();
  const screen = store.getActiveScreen();
  screen.shapes = [
    { id: 'shape-a', type: 'box' },
    { id: 'shape-b', type: 'box' }
  ];
  screen.layerOrder = ['device', 'shape-a', 'shape-b', 'headline', 'subtitle'];

  // Bring 'device' forward (+1)
  reorderLayer(store, 'device', 'forward');
  assert.deepEqual(screen.layerOrder, ['shape-a', 'device', 'shape-b', 'headline', 'subtitle']);

  // Bring 'shape-a' to front (end)
  reorderLayer(store, 'shape-a', 'front');
  assert.equal(screen.layerOrder.at(-1), 'shape-a');

  // Send 'shape-a' to back (start)
  reorderLayer(store, 'shape-a', 'back');
  assert.equal(screen.layerOrder[0], 'shape-a');

  console.log('  ✓ reorderLayer (forward, front, back) passed');
}

// 6. Test toggleLock & toggleHide
{
  const store = new Store();
  const screen = store.getActiveScreen();
  assert.ok(!screen.device.locked);
  assert.ok(!screen.device.hidden);

  toggleLock(store, 'device');
  assert.equal(screen.device.locked, true);
  toggleLock(store, 'device');
  assert.equal(screen.device.locked, false);

  toggleHide(store, 'device');
  assert.equal(screen.device.hidden, true);
  toggleHide(store, 'device');
  assert.equal(screen.device.hidden, false);

  console.log('  ✓ toggleLock & toggleHide passed');
}

// 7. Test centerElement & resetElementRotation
{
  const store = new Store();
  const screen = store.getActiveScreen();
  screen.device.rotation = 25;
  screen.device.x = 100;

  resetElementRotation(store, 'device');
  assert.equal(screen.device.rotation, 0);

  centerElement(store, 'device', 'x');
  assert.equal(screen.device.x, 540); // 1080 / 2

  console.log('  ✓ centerElement & resetElementRotation passed');
}

// 8. Test removeDeviceScreenshot
{
  const store = new Store();
  const screen = store.getActiveScreen();
  screen.device.image = 'data:image/png;base64,sample';

  removeDeviceScreenshot(store, 'device');
  assert.equal(screen.device.image, null);

  console.log('  ✓ removeDeviceScreenshot passed');
}

// 9. Test Menu Item Builders
{
  const store = new Store();
  const screen = store.getActiveScreen();

  const elemItems = buildElementContextMenuItems({
    store,
    elementId: 'device',
    screen,
    renderer: null
  });
  assert.ok(elemItems.length > 5);
  const dupItem = elemItems.find(i => i.id === 'duplicate');
  const delItem = elemItems.find(i => i.id === 'delete');
  assert.ok(dupItem, 'Element menu must have duplicate item');
  assert.ok(delItem, 'Element menu must have delete item');
  assert.equal(delItem.danger, true);

  const canvasItems = buildCanvasContextMenuItems({
    store,
    screen,
    onFitZoom: () => {},
    onUndo: () => {},
    onRedo: () => {}
  });
  assert.ok(canvasItems.length > 4);
  assert.ok(canvasItems.some(i => i.id === 'add-screen'));
  assert.ok(canvasItems.some(i => i.id === 'duplicate-screen'));

  const cardItems = buildScreenCardContextMenuItems({
    store,
    screen,
    totalScreens: 3
  });
  assert.ok(cardItems.some(i => i.id === 'duplicate-screen'));
  assert.ok(cardItems.some(i => i.id === 'delete-screen'));
  assert.ok(cardItems.some(i => i.id === 'rename-screen'));

  console.log('  ✓ Menu item builders passed');
}

console.log('All context menu checks passed successfully!');
