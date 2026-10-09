/**
 * App Screen Generator - Layer helpers
 * Each screen keeps one bottom→top draw order covering the device, both texts and every shape.
 */

const FIXED_LAYERS = ['device', 'showcase', 'headline', 'subtitle'];

/**
 * Ensures screen.devices array is initialized and kept synchronized with screen.device.
 * @param {Object} screen
 * @returns {Array<Object>} List of device objects on this screen
 */
export function ensureScreenDevices(screen) {
  if (!screen) return [];
  if (!screen.devices) {
    if (screen.device) {
      if (!screen.device.id) screen.device.id = 'device';
      screen.device.isDevice = true;
      screen.devices = [screen.device];
    } else {
      screen.devices = [];
    }
  } else {
    screen.devices.forEach((d, i) => {
      if (!d.id) d.id = i === 0 ? 'device' : `device-${Date.now()}-${i}`;
      d.isDevice = true;
    });
    if (!screen.device && screen.devices.length > 0) {
      screen.device = screen.devices[0];
    } else if (screen.device && screen.devices.length > 0) {
      const primary = screen.devices.find(d => d.id === 'device') || screen.devices[0];
      screen.device = primary;
    }
  }
  return screen.devices;
}

/**
 * Returns all devices present on this screen.
 * @param {Object} screen
 * @returns {Array<Object>}
 */
export function getDevices(screen) {
  if (!screen) return [];
  return ensureScreenDevices(screen);
}

/**
 * Returns the screen's layer ids, bottom first.
 * Screens without a saved order keep the original look (shapes behind the phone, texts on top);
 * items missing from a saved order (e.g. a newly added shape or frame) land on top.
 */
export function getLayerOrder(screen) {
  if (!screen) return [];
  // Ensure every shape has a unique id so it is selectable, draggable, and animatable
  if (screen.shapes && Array.isArray(screen.shapes)) {
    screen.shapes.forEach((s, i) => {
      if (!s.id) {
        s.id = `shape-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`;
      }
    });
  }
  ensureScreenDevices(screen);

  const shapeIds = (screen.shapes || []).map(s => s.id).filter(Boolean);
  const extraDeviceIds = (screen.devices || []).map(d => d.id).filter(id => id && id !== 'device');
  const all = [...shapeIds, ...extraDeviceIds, ...FIXED_LAYERS.filter(id => screen[id])];
  if (!screen.layerOrder) return all;
  const kept = screen.layerOrder.filter(id => all.includes(id));
  return [...kept, ...all.filter(id => !kept.includes(id))];
}

/** Returns the object behind a layer id (device / headline / subtitle object, or the shape). */
export function getLayerItem(screen, id) {
  if (!id || !screen) return null;
  if (id === 'device') {
    return screen.devices?.[0] || screen.device;
  }
  if (id.startsWith('device-') || (screen.devices && screen.devices.some(d => d.id === id))) {
    return (screen.devices || []).find(d => d.id === id) || (screen.device?.id === id ? screen.device : null);
  }
  return FIXED_LAYERS.includes(id) ? screen[id] : (screen.shapes || []).find(s => s.id === id);
}

export function isFixedLayer(id) {
  return FIXED_LAYERS.includes(id);
}

