/**
 * App Screen Generator - Context Menu Component
 * Provides custom right-click context menus for canvas elements, background stage, and filmstrip screens.
 */

import { activeDoc, FEATURE_ID } from '../state/store.js';
import { getLayerItem, getLayerOrder, ensureScreenDevices } from '../state/layers.js';
import { docSize } from '../canvas/compose.js';

export class ContextMenu {
  constructor() {
    this.menuEl = null;
    this.isOpen = false;
    this.activeItems = [];
    this.createDom();
    this.bindGlobalEvents();
  }

  /**
   * Creates the floating menu DOM element and attaches it to document.body.
   */
  createDom() {
    let el = document.getElementById('studio-context-menu');
    if (!el) {
      el = document.createElement('div');
      el.id = 'studio-context-menu';
      el.className = 'studio-context-menu hidden';
      el.setAttribute('role', 'menu');
      el.setAttribute('tabindex', '-1');
      document.body.appendChild(el);
    }
    this.menuEl = el;
  }

  /**
   * Binds global document dismiss listeners (click outside, escape, scroll).
   */
  bindGlobalEvents() {
    // Dismiss on click outside
    document.addEventListener('mousedown', (e) => {
      if (!this.isOpen) return;
      if (!this.menuEl.contains(e.target)) {
        this.hide();
      }
    });

    // Dismiss on Escape key
    window.addEventListener('keydown', (e) => {
      if (this.isOpen && e.key === 'Escape') {
        this.hide();
      }
    });

    // Dismiss on scroll or window resize
    window.addEventListener('resize', () => this.hide(), { passive: true });
    window.addEventListener('scroll', () => this.hide(), { passive: true });
    const stage = document.getElementById('canvas-stage-wrapper');
    if (stage) {
      stage.addEventListener('scroll', () => this.hide(), { passive: true });
    }
  }

  /**
   * Displays the context menu at the specified viewport coordinates with the provided items.
   * @param {number} clientX Viewport X
   * @param {number} clientY Viewport Y
   * @param {Array<Object>} items Array of menu items or divider descriptors
   */
  show(clientX, clientY, items) {
    if (!this.menuEl || !items || items.length === 0) return;
    this.activeItems = items;
    this.renderItems(items);

    // Make visible to measure dimensions
    this.menuEl.classList.remove('hidden');
    this.isOpen = true;

    const menuW = this.menuEl.offsetWidth || 220;
    const menuH = this.menuEl.offsetHeight || 280;
    const pad = 10;

    let posX = clientX;
    let posY = clientY;

    // Viewport collision adjustment (horizontal)
    if (posX + menuW > window.innerWidth - pad) {
      posX = Math.max(pad, clientX - menuW);
    }
    // Viewport collision adjustment (vertical)
    if (posY + menuH > window.innerHeight - pad) {
      posY = Math.max(pad, clientY - menuH);
    }

    this.menuEl.style.left = `${Math.round(posX)}px`;
    this.menuEl.style.top = `${Math.round(posY)}px`;
  }

  /**
   * Hides the context menu.
   */
  hide() {
    if (!this.menuEl || !this.isOpen) return;
    this.menuEl.classList.add('hidden');
    this.isOpen = false;
    this.activeItems = [];
  }

  /**
   * Populates the context menu DOM with items.
   * @param {Array<Object>} items
   */
  renderItems(items) {
    this.menuEl.innerHTML = '';

    items.forEach((item) => {
      if (item.separator) {
        const div = document.createElement('div');
        div.className = 'context-menu-divider';
        div.setAttribute('role', 'separator');
        this.menuEl.appendChild(div);
        return;
      }

      if (item.header) {
        const header = document.createElement('div');
        header.className = 'context-menu-header';
        header.textContent = item.header;
        this.menuEl.appendChild(header);
        return;
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`;
      btn.setAttribute('role', 'menuitem');
      if (item.disabled) btn.disabled = true;

      const iconSpan = document.createElement('span');
      iconSpan.className = 'item-icon material-symbols-outlined';
      iconSpan.textContent = item.icon || '';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'item-label';
      labelSpan.textContent = item.label || '';

      btn.appendChild(iconSpan);
      btn.appendChild(labelSpan);

      if (item.shortcut) {
        const scSpan = document.createElement('span');
        scSpan.className = 'item-shortcut';
        scSpan.textContent = item.shortcut;
        btn.appendChild(scSpan);
      }

      btn.onclick = (e) => {
        e.stopPropagation();
        this.hide();
        if (typeof item.action === 'function') {
          try {
            item.action();
          } catch (err) {
            console.error('Error executing context menu action:', err);
          }
        }
      };

      this.menuEl.appendChild(btn);
    });
  }
}

/* ==========================================================================
   Element & Screen Operations (Feature-First Action Helpers)
   ========================================================================== */

/**
 * Duplicates the specified element on the active screen.
 * @param {Object} store
 * @param {string} elementId
 */
export function duplicateElement(store, elementId) {
  if (!elementId || elementId === 'showcase') return;
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc) return;

    if (elementId === 'device' || (typeof elementId === 'string' && elementId.startsWith('device-'))) {
      ensureScreenDevices(sc);
      const srcDev = getLayerItem(sc, elementId) || sc.device;
      if (!srcDev) return;
      const newId = `device-${Date.now()}`;
      const newDev = {
        ...JSON.parse(JSON.stringify(srcDev)),
        id: newId,
        x: Math.round((srcDev.x ?? 540) + 60),
        y: Math.round((srcDev.y ?? 1180) + 40),
        hidden: false,
        deleted: false,
        locked: false,
        isDevice: true
      };
      sc.devices = sc.devices || [];
      sc.devices.push(newDev);
      if (!sc.layerOrder) sc.layerOrder = [...getLayerOrder(sc)];
      if (!sc.layerOrder.includes(newId)) sc.layerOrder.push(newId);
      state.activeElementId = newId;
    } else if (elementId === 'headline' || elementId === 'subtitle') {
      const textTarget = sc[elementId];
      if (!textTarget) return;
      const newId = 'text_' + Math.random().toString(36).substring(2, 9);
      const clone = {
        id: newId,
        type: 'text',
        text: textTarget.text || 'Text copy',
        fontFamily: textTarget.fontFamily || 'Plus Jakarta Sans',
        fontSize: textTarget.fontSize || 48,
        fontWeight: textTarget.fontWeight || '700',
        color: textTarget.color || '#ffffff',
        align: textTarget.align || 'center',
        lineHeight: textTarget.lineHeight || 1.25,
        shadow: textTarget.shadow || false,
        x: Math.min((textTarget.x ?? 540) + 30, 960),
        y: Math.min((textTarget.y ?? (textTarget.yOffset ?? 200)) + 40, 2000),
        rotation: textTarget.rotation || 0,
        scale: textTarget.scale || 1,
        hidden: false,
        locked: false
      };
      if (!sc.shapes) sc.shapes = [];
      sc.shapes.push(clone);
      if (!sc.layerOrder) sc.layerOrder = [...getLayerOrder(sc)];
      if (!sc.layerOrder.includes(newId)) sc.layerOrder.push(newId);
      state.activeElementId = newId;
    } else {
      if (!sc.shapes) sc.shapes = [];
      const shape = sc.shapes.find((s) => s.id === elementId);
      if (!shape) return;
      const newId = `shape-${Date.now()}`;
      const clone = {
        ...JSON.parse(JSON.stringify(shape)),
        id: newId,
        x: Math.round((shape.x ?? 300) + 40),
        y: Math.round((shape.y ?? 300) + 40),
        hidden: false,
        locked: false
      };
      sc.shapes.push(clone);
      if (!sc.layerOrder) sc.layerOrder = [...getLayerOrder(sc)];
      if (!sc.layerOrder.includes(newId)) sc.layerOrder.push(newId);
      state.activeElementId = newId;
    }
  });
}

/**
 * Deletes the specified element from the active screen.
 * @param {Object} store
 * @param {string} elementId
 */
export function deleteElement(store, elementId) {
  if (!elementId || elementId === 'showcase') return;
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc) return;
    ensureScreenDevices(sc);

    if (elementId === 'device') {
      if (sc.devices && sc.devices.length > 1) {
        sc.devices = sc.devices.filter((d) => d.id !== 'device');
        sc.device = sc.devices[0] || null;
      } else if (sc.device) {
        sc.device.hidden = true;
        sc.device.deleted = true;
      }
    } else if (typeof elementId === 'string' && elementId.startsWith('device-')) {
      if (sc.devices) {
        sc.devices = sc.devices.filter((d) => d.id !== elementId);
        if (sc.device?.id === elementId) {
          sc.device = sc.devices[0] || null;
        }
      }
    } else if (elementId === 'headline' || elementId === 'subtitle') {
      if (sc[elementId]) {
        sc[elementId].text = '';
        sc[elementId].hidden = true;
        sc[elementId].deleted = true;
      }
    } else if (sc.shapes) {
      sc.shapes = sc.shapes.filter((sh) => sh.id !== elementId);
    }

    if (sc.layerOrder) {
      sc.layerOrder = sc.layerOrder.filter((lid) => lid !== elementId);
    }
    if (state.activeElementId === elementId) {
      state.activeElementId = null;
    }
  });
}

/**
 * Reorders a layer: 'front', 'back', 'forward', or 'backward'.
 * @param {Object} store
 * @param {string} elementId
 * @param {'front'|'back'|'forward'|'backward'} direction
 */
export function reorderLayer(store, elementId, direction) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc || !elementId) return;
    const currentOrder = [...getLayerOrder(sc)];
    const index = currentOrder.indexOf(elementId);
    if (index === -1) return;

    if (direction === 'front') {
      currentOrder.splice(index, 1);
      currentOrder.push(elementId);
    } else if (direction === 'back') {
      currentOrder.splice(index, 1);
      currentOrder.unshift(elementId);
    } else if (direction === 'forward') {
      if (index < currentOrder.length - 1) {
        const next = currentOrder[index + 1];
        currentOrder[index + 1] = elementId;
        currentOrder[index] = next;
      }
    } else if (direction === 'backward') {
      if (index > 0) {
        const prev = currentOrder[index - 1];
        currentOrder[index - 1] = elementId;
        currentOrder[index] = prev;
      }
    }
    sc.layerOrder = currentOrder;
  });
}

/**
 * Toggles locked state of an element.
 * @param {Object} store
 * @param {string} elementId
 */
export function toggleLock(store, elementId) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc || !elementId) return;
    const item = getLayerItem(sc, elementId);
    if (item) {
      item.locked = !item.locked;
    }
  });
}

/**
 * Toggles hidden state of an element.
 * @param {Object} store
 * @param {string} elementId
 */
export function toggleHide(store, elementId) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc || !elementId) return;
    const item = getLayerItem(sc, elementId);
    if (item) {
      item.hidden = !item.hidden;
    }
  });
}

/**
 * Centers an element horizontally, vertically, or both.
 * @param {Object} store
 * @param {string} elementId
 * @param {'x'|'y'|'both'} axis
 */
export function centerElement(store, elementId, axis = 'both') {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc || !elementId) return;
    const { width: docW, height: docH } = docSize(state, sc);
    const item = getLayerItem(sc, elementId);
    if (!item) return;

    const isDevice = elementId === 'device' || (typeof elementId === 'string' && elementId.startsWith('device-'));
    if (isDevice) {
      if (axis === 'x' || axis === 'both') item.x = Math.round(docW / 2);
      if (axis === 'y' || axis === 'both') item.y = Math.round(docH / 2);
    } else if (elementId === 'headline' || elementId === 'subtitle') {
      if (axis === 'x' || axis === 'both') item.x = Math.round(docW / 2);
      if (axis === 'y' || axis === 'both') item.yOffset = Math.round(docH / 2 - 40);
    } else if (item.type === 'text') {
      if (axis === 'x' || axis === 'both') item.x = Math.round(docW / 2);
      if (axis === 'y' || axis === 'both') item.y = Math.round(docH / 2 - 30);
    } else {
      if (axis === 'x' || axis === 'both') item.x = Math.round(docW / 2);
      if (axis === 'y' || axis === 'both') item.y = Math.round(docH / 2);
    }
  });
}

/**
 * Resets element rotation back to 0 degrees.
 * @param {Object} store
 * @param {string} elementId
 */
export function resetElementRotation(store, elementId) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc || !elementId) return;
    const item = getLayerItem(sc, elementId);
    if (item) {
      item.rotation = 0;
    }
  });
}

/**
 * Removes the screenshot image from a device mockup.
 * @param {Object} store
 * @param {string} deviceId
 */
export function removeDeviceScreenshot(store, deviceId) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc) return;
    const dev = getLayerItem(sc, deviceId) || sc.device;
    if (dev) {
      dev.image = null;
    }
  });
}

/**
 * Adds a new phone mockup frame to the active screen.
 * @param {Object} store
 */
export function addDeviceFrame(store) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc) return;
    ensureScreenDevices(sc);
    const { width: docW, height: docH } = docSize(state, sc);
    const newId = `device-${Date.now()}`;
    const newDev = {
      id: newId,
      type: 'modern_phone',
      color: '#0f172a',
      scale: 0.92,
      x: Math.round(docW / 2),
      y: Math.round(docH / 2 + 100),
      isDevice: true,
      hidden: false,
      deleted: false
    };
    sc.devices = sc.devices || [];
    sc.devices.push(newDev);
    if (!sc.layerOrder) sc.layerOrder = [...getLayerOrder(sc)];
    if (!sc.layerOrder.includes(newId)) sc.layerOrder.push(newId);
    state.activeElementId = newId;
  });
}

/**
 * Adds or unhides headline text.
 * @param {Object} store
 */
export function addHeadlineText(store) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc) return;
    if (!sc.headline || sc.headline.deleted || sc.headline.hidden || !sc.headline.text) {
      if (!sc.headline) sc.headline = {};
      sc.headline.text = 'Catchy Headline';
      sc.headline.hidden = false;
      sc.headline.deleted = false;
      if (!sc.layerOrder) sc.layerOrder = [...getLayerOrder(sc)];
      if (!sc.layerOrder.includes('headline')) {
        sc.layerOrder.push('headline');
      }
      state.activeElementId = 'headline';
    } else {
      addTextLayer(store);
    }
  });
}

/**
 * Adds or unhides subtitle text.
 * @param {Object} store
 */
export function addSubtitleText(store) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc) return;
    if (!sc.subtitle || sc.subtitle.deleted || sc.subtitle.hidden || !sc.subtitle.text) {
      if (!sc.subtitle) sc.subtitle = {};
      sc.subtitle.text = 'Describe your key benefit or feature here.';
      sc.subtitle.hidden = false;
      sc.subtitle.deleted = false;
      if (!sc.layerOrder) sc.layerOrder = [...getLayerOrder(sc)];
      if (!sc.layerOrder.includes('subtitle')) {
        sc.layerOrder.push('subtitle');
      }
      state.activeElementId = 'subtitle';
    } else {
      addTextLayer(store);
    }
  });
}

/**
 * Adds a new independent text layer.
 * @param {Object} store
 */
export function addTextLayer(store) {
  store.update((state) => {
    const sc = activeDoc(state);
    if (!sc) return;
    const { width: docW, height: docH } = docSize(state, sc);
    const newId = 'text_' + Math.random().toString(36).substring(2, 9);
    const textLayer = {
      id: newId,
      type: 'text',
      text: 'Add your text here',
      fontFamily: 'Plus Jakarta Sans',
      fontSize: 44,
      fontWeight: '600',
      color: '#ffffff',
      align: 'center',
      lineHeight: 1.3,
      x: Math.round(docW / 2),
      y: Math.round(docH / 2 - 100),
      rotation: 0,
      scale: 1,
      hidden: false,
      locked: false
    };
    if (!sc.shapes) sc.shapes = [];
    sc.shapes.push(textLayer);
    if (!sc.layerOrder) sc.layerOrder = [...getLayerOrder(sc)];
    if (!sc.layerOrder.includes(newId)) sc.layerOrder.push(newId);
    state.activeElementId = newId;
  });
}

/**
 * Renames a screen via prompt dialog.
 * @param {Object} store
 * @param {string} screenId
 */
export function renameScreen(store, screenId) {
  const state = store.getState();
  const screen = state.screens.find((s) => s.id === screenId);
  if (!screen) return;
  const newName = prompt('Enter screen name:', screen.name || '');
  if (newName && newName.trim()) {
    store.update((s) => {
      const target = s.screens.find((sc) => sc.id === screenId);
      if (target) {
        target.name = newName.trim();
      }
    });
  }
}

/**
 * Builds item list for right-clicking an element on canvas or layers drawer.
 * @param {Object} options
 * @returns {Array<Object>}
 */
export function buildElementContextMenuItems({ store, elementId, screen, renderer }) {
  if (!elementId) return [];
  const item = getLayerItem(screen, elementId);
  const isDevice = elementId === 'device' || (typeof elementId === 'string' && elementId.startsWith('device-'));
  const isShowcase = elementId === 'showcase';

  // Determine user-friendly title
  let title = 'Selected Element';
  if (isDevice) {
    const devIdx = (screen.devices || []).findIndex((d) => d.id === elementId);
    title = `Phone Frame ${devIdx >= 0 ? devIdx + 1 : ''}`.trim();
  } else if (elementId === 'headline' || elementId === 'subtitle' || item?.type === 'text') {
    title = 'Text Layer';
  } else if (item?.type === 'image') {
    title = 'Image Shape';
  } else if (item?.label) {
    title = item.label;
  } else {
    title = 'Shape';
  }

  const items = [
    { header: title },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'content_copy',
      shortcut: '⌘D',
      disabled: isShowcase,
      action: () => duplicateElement(store, elementId)
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      shortcut: 'Del',
      danger: true,
      disabled: isShowcase,
      action: () => deleteElement(store, elementId)
    },
    { separator: true },
    {
      id: 'bring-forward',
      label: 'Bring Forward',
      icon: 'arrow_upward',
      shortcut: '⌘]',
      action: () => reorderLayer(store, elementId, 'forward')
    },
    {
      id: 'bring-front',
      label: 'Bring to Front',
      icon: 'vertical_align_top',
      shortcut: '⇧⌘]',
      action: () => reorderLayer(store, elementId, 'front')
    },
    {
      id: 'send-backward',
      label: 'Send Backward',
      icon: 'arrow_downward',
      shortcut: '⌘[',
      action: () => reorderLayer(store, elementId, 'backward')
    },
    {
      id: 'send-back',
      label: 'Send to Back',
      icon: 'vertical_align_bottom',
      shortcut: '⇧⌘[',
      action: () => reorderLayer(store, elementId, 'back')
    },
    { separator: true },
    {
      id: 'toggle-lock',
      label: item?.locked ? 'Unlock Element' : 'Lock Element',
      icon: item?.locked ? 'lock_open' : 'lock',
      action: () => toggleLock(store, elementId)
    },
    {
      id: 'toggle-hide',
      label: item?.hidden ? 'Show Element' : 'Hide Element',
      icon: item?.hidden ? 'visibility' : 'visibility_off',
      action: () => toggleHide(store, elementId)
    },
    { separator: true },
    {
      id: 'center-horizontal',
      label: 'Center Horizontally',
      icon: 'align_horizontal_center',
      action: () => centerElement(store, elementId, 'x')
    },
    {
      id: 'center-vertical',
      label: 'Center Vertically',
      icon: 'align_vertical_center',
      action: () => centerElement(store, elementId, 'y')
    },
    {
      id: 'center-both',
      label: 'Center on Canvas',
      icon: 'center_focus_strong',
      action: () => centerElement(store, elementId, 'both')
    }
  ];

  if (item && item.rotation) {
    items.push({
      id: 'reset-rotation',
      label: `Reset Rotation (${Math.round(item.rotation)}°)`,
      icon: 'rotate_left',
      action: () => resetElementRotation(store, elementId)
    });
  }

  if (isDevice) {
    items.push({ separator: true });
    items.push({
      id: 'replace-screenshot',
      label: 'Upload / Replace Screenshot...',
      icon: 'add_photo_alternate',
      action: () => {
        if (renderer && typeof renderer.openFilePickerForDevice === 'function') {
          renderer.openFilePickerForDevice(elementId);
        } else if (renderer && typeof renderer.openFilePicker === 'function') {
          renderer.openFilePicker();
        }
      }
    });

    const devObj = getLayerItem(screen, elementId) || screen.device;
    if (devObj?.image) {
      items.push({
        id: 'remove-screenshot',
        label: 'Remove Screenshot',
        icon: 'close',
        danger: true,
        action: () => removeDeviceScreenshot(store, elementId)
      });
    }
  }

  return items;
}

/**
 * Builds item list for right-clicking on empty canvas background.
 * @param {Object} options
 * @returns {Array<Object>}
 */
export function buildCanvasContextMenuItems({ store, screen, onFitZoom, onUndo, onRedo }) {
  const isFeature = screen?.id === FEATURE_ID;
  const items = [
    { header: 'Canvas Background' },
    {
      id: 'add-device',
      label: 'Add Phone Frame',
      icon: 'smartphone',
      action: () => addDeviceFrame(store)
    },
    {
      id: 'add-text',
      label: 'Add Text Layer',
      icon: 'title',
      action: () => addTextLayer(store)
    },
    { separator: true },
    {
      id: 'add-screen',
      label: 'Add New Screen',
      icon: 'add_to_photos',
      action: () => store.addScreen()
    }
  ];

  if (!isFeature && screen?.id) {
    items.push({
      id: 'duplicate-screen',
      label: 'Duplicate This Screen',
      icon: 'content_copy',
      action: () => store.duplicateScreen(screen.id)
    });
  }

  items.push(
    { separator: true },
    {
      id: 'undo',
      label: 'Undo',
      icon: 'undo',
      shortcut: '⌘Z',
      action: () => (onUndo ? onUndo() : store.undo())
    },
    {
      id: 'redo',
      label: 'Redo',
      icon: 'redo',
      shortcut: '⌘Y',
      action: () => (onRedo ? onRedo() : store.redo())
    },
    {
      id: 'fit-view',
      label: 'Fit to Viewport',
      icon: 'fit_screen',
      action: () => (onFitZoom ? onFitZoom() : null)
    }
  );

  return items;
}

/**
 * Builds item list for right-clicking on filmstrip screen thumbnail cards.
 * @param {Object} options
 * @returns {Array<Object>}
 */
export function buildScreenCardContextMenuItems({ store, screen, totalScreens }) {
  if (!screen) return [];
  const isFeature = screen.id === FEATURE_ID;

  if (isFeature) {
    return [
      { header: 'Feature Graphic (1024 × 500)' },
      {
        id: 'select-feature',
        label: 'Edit Feature Graphic',
        icon: 'featured_video',
        action: () => store.setActiveScreen(FEATURE_ID)
      }
    ];
  }

  const items = [
    { header: screen.name || 'Screen' },
    {
      id: 'duplicate-screen',
      label: 'Duplicate Screen',
      icon: 'content_copy',
      action: () => store.duplicateScreen(screen.id)
    },
    {
      id: 'rename-screen',
      label: 'Rename Screen...',
      icon: 'edit',
      action: () => renameScreen(store, screen.id)
    },
    {
      id: 'add-screen',
      label: 'Add New Screen',
      icon: 'add_to_photos',
      action: () => store.addScreen()
    }
  ];

  if (totalScreens > 1) {
    items.push({ separator: true });
    items.push({
      id: 'delete-screen',
      label: 'Delete Screen',
      icon: 'delete',
      danger: true,
      action: () => {
        if (confirm(`Delete ${screen.name || 'this screen'}?`)) {
          store.deleteScreen(screen.id);
        }
      }
    });
  }

  return items;
}
