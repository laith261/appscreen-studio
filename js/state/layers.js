/**
 * App Screen Generator - Layer helpers
 * Each screen keeps one bottom→top draw order covering the device, both texts and every shape.
 */

const FIXED_LAYERS = ['device', 'showcase', 'headline', 'subtitle'];

/**
 * Ensures screen.devices array is initialized and kept synchronized with screen.device,
 * and enforces valid default coordinates (x = canvasWidth / 2, y = 1180).
 * @param {Object} screen
 * @param {number} [canvasWidth=1080]
 * @returns {Array<Object>} List of device objects on this screen
 */
export function ensureScreenDevices(screen, canvasWidth = 1080) {
  if (!screen) return [];
  const isFeature = screen.id === 'feature' || screen.height === 500;
  const defaultX = isFeature ? 512 : (canvasWidth || screen.width || 1080) / 2;
  const defaultY = isFeature ? 250 : 1180;
  const defaultScale = isFeature ? 0.28 : 0.92;

  const fixDeviceBounds = (d) => {
    if (!d) return;
    d.isDevice = true;
    if (d.x === undefined || d.x === null) d.x = defaultX;
    if (d.y === undefined || d.y === null) d.y = defaultY;
    if (d.scale === undefined || d.scale === null) d.scale = defaultScale;
    if (isFeature) {
      if (d.y > 550) d.y = defaultY;
      if (d.scale > 0.65) d.scale = defaultScale;
    }
  };

  if (!screen.devices || !Array.isArray(screen.devices)) {
    if (screen.device && !screen.device.deleted) {
      if (!screen.device.id) screen.device.id = 'device';
      fixDeviceBounds(screen.device);
      screen.devices = [screen.device];
    } else {
      screen.devices = [];
      delete screen.device;
    }
  } else {
    if (screen.devices.length === 0) {
      if (screen.device && !screen.device.deleted && !isFeature) {
        if (!screen.device.id) screen.device.id = 'device';
        fixDeviceBounds(screen.device);
        screen.devices.push(screen.device);
      } else {
        delete screen.device;
      }
    } else {
      const seen = new Set();
      screen.devices = screen.devices.filter(d => {
        if (!d || d.deleted) return false;
        const key = d.id || d;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (screen.devices.length === 1) {
        screen.devices[0].id = 'device';
      } else {
        screen.devices.forEach((d, i) => {
          if (!d.id) d.id = i === 0 ? 'device' : `device-${Date.now()}-${i}`;
        });
      }

      screen.devices.forEach(fixDeviceBounds);
      screen.device = screen.devices.find(d => d.id === 'device') || screen.devices[0] || null;
    }
  }

  return screen.devices;
}

/**
 * Normalizes a screen object to guarantee device coordinates, IDs, and devices array.
 * @param {Object} screen
 * @param {number} [canvasWidth=1080]
 */
export function normalizeScreen(screen, canvasWidth = 1080) {
  if (!screen) return;
  ensureScreenDevices(screen, canvasWidth);
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
  const deviceIds = (screen.devices && screen.devices.length > 0)
    ? screen.devices.filter(d => !d.deleted).map(d => d.id).filter(Boolean)
    : (screen.device && !screen.device.deleted ? ['device'] : []);
  const otherFixed = ['showcase', 'headline', 'subtitle'].filter(id => screen[id]);
  const all = [...shapeIds, ...deviceIds, ...otherFixed];

  if (!screen.layerOrder) return all;
  const validDeviceIds = new Set(deviceIds);
  const kept = screen.layerOrder.filter(id => {
    if (id === 'device' || id.startsWith('device-')) {
      return validDeviceIds.has(id);
    }
    return all.includes(id);
  });
  return [...kept, ...all.filter(id => !kept.includes(id))];
}

/** Returns the object behind a layer id (device / headline / subtitle object, or the shape). */
export function getLayerItem(screen, id) {
  if (!id || !screen) return null;
  ensureScreenDevices(screen);
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

