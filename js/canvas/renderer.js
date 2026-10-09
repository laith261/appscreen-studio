/**
 * App Screen Generator - Core Canvas 2D Rendering Engine & Interactive Viewport
 * Orchestrates rendering of backgrounds, shapes, device frames, typography, and interactive transform controls.
 * Features an on-canvas interactive transform box: move, scale via corner/edge handles, and rotate via rotation stem.
 */

import { isPointInsideShape } from '../features/shapes/shapeLibrary.js';
import { isPointInsideDevice, DEVICE_PRESETS } from './deviceFrames.js';
import { processImageUpload } from './imageUploader.js';
import { getLayerOrder, getLayerItem } from '../state/layers.js';
import { drawDocument, docSize } from './compose.js';
import { FEATURE_ID } from '../state/store.js';

export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {Object} store
   */
  constructor(canvas, store) {
    this.frameToken = 0;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.store = store;

    // Interaction state: dragMode can be null | 'move' | 'scale' | 'rotate'
    this.dragMode = null;
    this.dragTarget = null; // 'device' | 'headline' | 'subtitle' | shapeId
    this.activeHandle = null; // 'tl' | 'tr' | 'br' | 'bl' | 'rot'
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.hasMovedDistance = false;
    this.dragSnapshot = null;

    // Snapshot of element's transform at drag start
    this.initialTransform = null;

    // Cache of loaded user screenshots
    this.activeImageEl = null;

    // Hit-test bounds cached from drawDocument
    this.headlineBounds = null;
    this.subtitleBounds = null;
    this.showcaseBounds = null;

    this.bindEvents();
    this.store.subscribe(() => this.requestRender());
    document.fonts.addEventListener('loadingdone', () => this.requestRender());
  }

  /**
   * Attaches mouse, touch, drag-and-drop, and clipboard listeners.
   */
  bindEvents() {
    this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
    window.addEventListener('mousemove', (e) => this.handlePointerMove(e));
    window.addEventListener('mouseup', () => this.handlePointerUp());

    // File Drag & Drop support on canvas and canvas stage wrapper
    const stage = document.getElementById('canvas-stage-wrapper') || this.canvas;
    if (stage && stage !== this.canvas) {
      stage.addEventListener('contextmenu', (e) => {
        if (e.target === stage) {
          this.handleContextMenu(e);
        }
      });
    }

    ['dragenter', 'dragover'].forEach(evt => {
      stage.addEventListener(evt, (e) => {
        e.preventDefault();
        this.canvas.classList.add('drag-over');
      });
      this.canvas.addEventListener(evt, (e) => {
        e.preventDefault();
        this.canvas.classList.add('drag-over');
      });
    });

    ['dragleave', 'dragend'].forEach(evt => {
      stage.addEventListener(evt, (e) => {
        if (e.target === stage) this.canvas.classList.remove('drag-over');
      });
      this.canvas.addEventListener(evt, () => {
        this.canvas.classList.remove('drag-over');
      });
    });

    const dropHandler = (e) => {
      e.preventDefault();
      this.canvas.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleImageFile(e.dataTransfer.files[0]);
      }
    };

    stage.addEventListener('drop', dropHandler);
    this.canvas.addEventListener('drop', dropHandler);

    // Global Drag & Drop safety (prevent browser navigating away if dropped outside canvas)
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          this.handleImageFile(file);
        }
      }
    });

    // Global Clipboard Paste support (Ctrl+V / Cmd+V)
    window.addEventListener('paste', (e) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files[0]) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          this.handleImageFile(file);
        }
      }
    });
  }

  /**
   * Opens the file picker dialog for the active screen device mockup or specific device.
   * @param {string|null} targetDeviceId
   */
  openFilePicker(targetDeviceId = null) {
    let input = document.getElementById('canvas-hidden-file-input');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'canvas-hidden-file-input';
      input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml';
      input.style.display = 'none';
      document.body.appendChild(input);
    }
    input.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        processImageUpload(e.target.files[0], this.store, targetDeviceId);
        input.value = '';
      }
    };
    input.click();
  }

  /**
   * Opens file picker targeted to a specific device.
   * @param {string} targetDeviceId
   */
  openFilePickerForDevice(targetDeviceId) {
    this.openFilePicker(targetDeviceId);
  }

  /**
   * Converts viewport client coordinates to canvas internal coordinates.
   * @param {number} clientX
   * @param {number} clientY
   * @returns {{ x: number, y: number }}
   */
  getCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  /**
   * Retrieves geometric box descriptor for an element in the screen.
   * Returns { cx, cy, width, height, rotation, scale, item, isText, canRotate, canScale } or null.
   */
  getElementBox(screen, elementId) {
    if (!screen || !elementId) return null;
    const state = this.store.getState();
    const { width: docW } = docSize(state, screen);

    const isDev = elementId === 'device' || (typeof elementId === 'string' && elementId.startsWith('device-'));
    if (isDev) {
      const dev = getLayerItem(screen, elementId);
      if (dev && !dev.hidden) {
        const type = dev.type || 'modern_phone';
        const preset = DEVICE_PRESETS[type] || DEVICE_PRESETS.modern_phone;
        const baseW = preset.width;
        const baseH = preset.height;
        const scale = dev.scale ?? 1;
        return {
          cx: dev.x ?? (docW / 2),
          cy: dev.y ?? 1180,
          baseWidth: baseW,
          baseHeight: baseH,
          width: baseW * scale,
          height: baseH * scale,
          rotation: dev.rotation || 0,
          scale: scale,
          item: dev,
          type: 'device',
          canRotate: true,
          canScale: true
        };
      }
    }

    if (elementId === 'headline' || elementId === 'subtitle') {
      const text = screen[elementId];
      if (!text || text.hidden || !text.text || !text.text.trim()) return null;
      const bounds = elementId === 'headline' ? this.headlineBounds : this.subtitleBounds;
      if (!bounds) return null;
      const bW = Math.max(bounds.width, 40);
      const bH = Math.max(bounds.height + 10, 30);
      const cx = bounds.cx ?? (text.x ?? (docW / 2));
      const cy = bounds.cy ?? ((text.yOffset ?? (elementId === 'headline' ? 120 : 250)) + bH / 2);
      return {
        cx,
        cy,
        baseWidth: bW,
        baseHeight: bH,
        width: bW,
        height: bH,
        rotation: text.rotation || 0,
        scale: text.fontSize || 48,
        item: text,
        type: elementId,
        canRotate: true,
        canScale: true
      };
    }

    if (elementId === 'showcase' && screen.showcase) {
      const sc = screen.showcase;
      const b = this.showcaseBounds || { width: 400, height: 260 };
      return {
        cx: sc.x ?? (docW / 2),
        cy: sc.y ?? 250,
        baseWidth: b.width,
        baseHeight: b.height,
        width: b.width,
        height: b.height,
        rotation: sc.rotation || 0,
        scale: sc.height || 400,
        item: sc,
        type: 'showcase',
        canRotate: true,
        canScale: true
      };
    }

    if (screen.shapes) {
      const shape = screen.shapes.find(s => s.id === elementId);
      if (shape) {
        if (shape.type === 'text') {
          const b = this.itemBounds?.[elementId];
          const bW = b ? Math.max(b.width, 100) : (shape.maxWidth || 400);
          const bH = b ? Math.max(b.height + 20, 40) : ((shape.fontSize || 48) * 1.5);
          const cx = b?.cx ?? (shape.x ?? docW / 2);
          const cy = b?.cy ?? ((shape.y ?? 220) + bH / 2);
          return {
            cx,
            cy,
            baseWidth: bW,
            baseHeight: bH,
            width: bW,
            height: bH,
            rotation: shape.rotation || 0,
            scale: shape.fontSize || 48,
            item: shape,
            type: 'text',
            canRotate: true,
            canScale: true
          };
        }
        const baseW = shape.width || 200;
        const baseH = shape.height || 100;
        const scale = shape.scale ?? 1;
        return {
          cx: shape.x ?? 0,
          cy: shape.y ?? 0,
          baseWidth: baseW,
          baseHeight: baseH,
          width: baseW * scale,
          height: baseH * scale,
          rotation: shape.rotation || 0,
          scale: scale,
          item: shape,
          type: 'shape',
          canRotate: true,
          canScale: true
        };
      }
    }

    return null;
  }

  /**
   * Calculates world coordinates of bounding box corner handles and rotation handle.
   */
  getBoxHandles(box) {
    const { cx, cy, width, height, rotation } = box;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const halfW = width / 2;
    const halfH = height / 2;

    const toWorld = (lx, ly) => ({
      x: cx + lx * cos - ly * sin,
      y: cy + lx * sin + ly * cos
    });

    const rotOffset = 38; // distance of rotation handle above top edge
    const handles = {
      tl: toWorld(-halfW, -halfH),
      tr: toWorld(halfW, -halfH),
      br: toWorld(halfW, halfH),
      bl: toWorld(-halfW, halfH)
    };

    if (box.canRotate) {
      handles.rot = toWorld(0, -halfH - rotOffset);
      handles.rotStem = toWorld(0, -halfH);
    }

    return handles;
  }

  /**
   * Tests if mouse point hits any handle of the active element's transform box.
   * Returns handle id ('tl' | 'tr' | 'br' | 'bl' | 'rot') or null.
   */
  hitTestHandles(box, px, py) {
    if (!box) return null;
    const handles = this.getBoxHandles(box);
    const handleRadius = 14; // click tolerance in canvas coords

    if (handles.rot && Math.hypot(px - handles.rot.x, py - handles.rot.y) <= handleRadius + 4) {
      return 'rot';
    }

    for (const pos of ['tl', 'tr', 'br', 'bl']) {
      const h = handles[pos];
      if (Math.hypot(px - h.x, py - h.y) <= handleRadius) {
        return pos;
      }
    }

    return null;
  }

  /**
   * Tests if point is inside element's rotated bounding box.
   */
  isPointInElementBox(box, px, py) {
    if (!box) return false;
    let dx = px - box.cx;
    let dy = py - box.cy;
    if (box.rotation) {
      const rad = (-box.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      dx = rx;
      dy = ry;
    }
    return Math.abs(dx) <= box.width / 2 && Math.abs(dy) <= box.height / 2;
  }

  /**
   * Handles pointer down for selecting, moving, scaling, and rotating items.
   */
  handlePointerDown(e) {
    if (e.button === 2) return; // Right-click is delegated to handleContextMenu
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    const screen = this.store.getActiveScreen();
    if (!screen) return;

    this.pointerDownX = x;
    this.pointerDownY = y;
    this.hasMovedDistance = false;

    const activeId = this.store.getState().activeElementId;
    const currentBox = activeId ? this.getElementBox(screen, activeId) : null;

    // 1. Check if clicking on an interactive handle of currently selected box
    if (currentBox) {
      const hitHandle = this.hitTestHandles(currentBox, x, y);
      if (hitHandle) {
        this.dragSnapshot = JSON.stringify(this.store.getState());
        this.dragTarget = activeId;
        this.activeHandle = hitHandle;
        this.dragStartX = x;
        this.dragStartY = y;
        this.initialTransform = {
          cx: currentBox.cx,
          cy: currentBox.cy,
          width: currentBox.width,
          height: currentBox.height,
          baseWidth: currentBox.baseWidth,
          baseHeight: currentBox.baseHeight,
          rotation: currentBox.rotation,
          scale: currentBox.scale,
          item: currentBox.item,
          type: currentBox.type,
          initialAngle: Math.atan2(y - currentBox.cy, x - currentBox.cx) * (180 / Math.PI),
          initialDistance: Math.hypot(x - currentBox.cx, y - currentBox.cy)
        };
        this.dragMode = hitHandle === 'rot' ? 'rotate' : 'scale';
        return;
      }
    }

    // 2. Hit-test layers to select or start moving
    const hitId = this.hitTest(screen, x, y);
    if (!hitId) {
      // Deselect if clicking on empty background
      this.store.setActiveElement(null);
      this.dragMode = null;
      this.dragTarget = null;
      return;
    }

    this.store.setActiveElement(hitId);
    const newBox = this.getElementBox(screen, hitId);
    this.dragSnapshot = JSON.stringify(this.store.getState());
    this.dragTarget = hitId;
    this.dragStartX = x;
    this.dragStartY = y;
    this.dragMode = 'move';
    this.activeHandle = null;

    const item = getLayerItem(screen, hitId);
    const isText = hitId === 'headline' || hitId === 'subtitle';
    const state = this.store.getState();
    const docW = docSize(state, screen).width;

    this.initialTransform = {
      cx: newBox ? newBox.cx : (isText ? (item.x ?? docW / 2) : item.x),
      cy: newBox ? newBox.cy : (isText ? (item.yOffset ?? (hitId === 'headline' ? 120 : 250)) : item.y),
      itemX: isText ? (item.x ?? docW / 2) : item.x,
      itemY: isText ? (item.yOffset ?? (hitId === 'headline' ? 120 : 250)) : item.y,
      rotation: newBox ? newBox.rotation : (item.rotation || 0),
      scale: newBox ? newBox.scale : (item.scale || 1),
      fontSize: item.fontSize,
      type: hitId
    };
  }

  /**
   * Returns the id of the topmost visible, unlocked layer under the point, or null.
   */
  hitTest(screen, x, y) {
    // Check active element box first if already selected (for easier grab)
    const activeId = this.store.getState().activeElementId;
    if (activeId) {
      const activeBox = this.getElementBox(screen, activeId);
      if (activeBox && this.isPointInElementBox(activeBox, x, y)) {
        return activeId;
      }
    }

    for (const id of getLayerOrder(screen).reverse()) {
      if (!id) continue;
      const item = getLayerItem(screen, id);
      if (!item || item.hidden || item.locked) continue;
      if ((id === 'headline' || id === 'subtitle') && (!item.text || !item.text.trim())) continue;
      const box = this.getElementBox(screen, id);
      if (box && this.isPointInElementBox(box, x, y)) {
        return id;
      }
      const isDevice = id === 'device' || id.startsWith('device-') || item.isDevice;
      const hit = isDevice ? isPointInsideDevice(item, x, y)
        : id === 'headline' ? isPointInBounds(x, y, this.headlineBounds)
        : id === 'subtitle' ? isPointInBounds(x, y, this.subtitleBounds)
        : id === 'showcase' ? isPointInBounds(x, y, this.showcaseBounds)
        : isPointInsideShape(item, x, y);
      if (hit) return id;
    }
    return null;
  }

  /**
   * Handles dragging for moving, scaling, or rotating elements via bounding box.
   */
  handlePointerMove(e) {
    if (!this.dragMode || !this.dragTarget) {
      this.updateHoverCursor(e);
      return;
    }

    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    const deltaX = x - this.dragStartX;
    const deltaY = y - this.dragStartY;
    if (Math.hypot(deltaX, deltaY) > 4) {
      this.hasMovedDistance = true;
    }

    const screen = this.store.getActiveScreen();
    if (!screen) return;
    const target = this.dragTarget;
    const init = this.initialTransform;
    if (!init) return;

    if (this.dragMode === 'move') {
      this.applyMove(screen, target, init, deltaX, deltaY);
    } else if (this.dragMode === 'rotate') {
      this.applyRotate(screen, target, init, x, y);
    } else if (this.dragMode === 'scale') {
      this.applyScale(screen, target, init, x, y);
    }

    this.requestRender();
  }

  /**
   * Applies translation to the element being moved.
   */
  applyMove(screen, target, init, deltaX, deltaY) {
    const isDev = target === 'device' || (typeof target === 'string' && target.startsWith('device-'));
    if (isDev) {
      const dev = getLayerItem(screen, target);
      if (dev) {
        dev.x = Math.round(init.itemX + deltaX);
        dev.y = Math.round(init.itemY + deltaY);
      }
    } else if (target === 'showcase' && screen.showcase) {
      screen.showcase.x = Math.round(init.itemX + deltaX);
      screen.showcase.y = Math.round(init.itemY + deltaY);
    } else if ((target === 'headline' || target === 'subtitle') && screen[target]) {
      const text = screen[target];
      text.yOffset = Math.round(init.itemY + deltaY);
      text.x = Math.round(init.itemX + deltaX);
    } else if (screen.shapes) {
      const shape = screen.shapes.find(s => s.id === target);
      if (shape) {
        shape.x = Math.round(init.itemX + deltaX);
        shape.y = Math.round(init.itemY + deltaY);
      }
    }
  }

  /**
   * Applies interactive rotation to the element via rotation handle.
   */
  applyRotate(screen, target, init, curX, curY) {
    const curAngle = Math.atan2(curY - init.cy, curX - init.cx) * (180 / Math.PI);
    const deltaAngle = curAngle - init.initialAngle;
    let newRotation = Math.round(init.rotation + deltaAngle);

    // Normalize to -180..180
    while (newRotation > 180) newRotation -= 360;
    while (newRotation < -180) newRotation += 360;

    // Angle snapping to 0, 90, -90, 180 if within 3 degrees
    [0, 45, -45, 90, -90, 180, -180].forEach(snap => {
      if (Math.abs(newRotation - snap) <= 3) newRotation = snap;
    });

    const isDev = target === 'device' || (typeof target === 'string' && target.startsWith('device-'));
    if (isDev) {
      const dev = getLayerItem(screen, target);
      if (dev) dev.rotation = newRotation;
    } else if (target === 'showcase' && screen.showcase) {
      screen.showcase.rotation = newRotation;
    } else if (target === 'headline' || target === 'subtitle') {
      if (screen[target]) screen[target].rotation = newRotation;
    } else if (screen.shapes) {
      const shape = screen.shapes.find(s => s.id === target);
      if (shape) shape.rotation = newRotation;
    }
  }

  /**
   * Applies interactive scale to the element via corner resize handles.
   */
  applyScale(screen, target, init, curX, curY) {
    const curDist = Math.hypot(curX - init.cx, curY - init.cy);
    const ratio = Math.max(0.1, curDist / Math.max(init.initialDistance, 1));

    const isDev = target === 'device' || (typeof target === 'string' && target.startsWith('device-'));
    if (isDev) {
      const dev = getLayerItem(screen, target);
      if (dev) {
        const newScale = Math.max(0.2, Math.min(2.0, Number((init.scale * ratio).toFixed(2))));
        dev.scale = newScale;
      }
    } else if (target === 'showcase' && screen.showcase) {
      const newH = Math.max(100, Math.min(600, Math.round(init.scale * ratio)));
      screen.showcase.height = newH;
      screen.showcase.autoFit = false;
    } else if (target === 'headline' || target === 'subtitle') {
      const text = screen[target];
      if (text) {
        const minSize = 16;
        const maxSize = 160;
        text.fontSize = Math.max(minSize, Math.min(maxSize, Math.round(init.scale * ratio)));
      }
    } else if (screen.shapes) {
      const shape = screen.shapes.find(s => s.id === target);
      if (shape) {
        if (shape.type === 'text') {
          const minSize = 16;
          const maxSize = 160;
          shape.fontSize = Math.max(minSize, Math.min(maxSize, Math.round(init.scale * ratio)));
        } else {
          const newScale = Math.max(0.15, Math.min(3.0, Number((init.scale * ratio).toFixed(2))));
          shape.scale = newScale;
        }
      }
    }
  }

  /**
   * Ends element dragging / transforming and commits undo history.
   */
  handlePointerUp() {
    if (this.dragMode) {
      const target = this.dragTarget;
      const moved = this.hasMovedDistance;
      this.dragMode = null;
      this.dragTarget = null;
      this.activeHandle = null;
      this.initialTransform = null;

      if (moved) {
        this.store.recordHistory(this.dragSnapshot);
        this.store.notify();
      }
    }
  }

  /**
   * Handles context menu (right click) on canvas and stage wrapper.
   * @param {MouseEvent} e
   */
  handleContextMenu(e) {
    e.preventDefault();
    const screen = this.store.getActiveScreen();
    if (!screen) return;

    let hitId = null;
    if (e.target === this.canvas) {
      const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
      hitId = this.hitTest(screen, x, y);
    }

    if (hitId) {
      this.store.setActiveElement(hitId);
      this.requestRender();
    } else {
      this.store.setActiveElement(null);
      this.requestRender();
    }

    if (typeof this.onContextMenu === 'function') {
      this.onContextMenu({
        clientX: e.clientX,
        clientY: e.clientY,
        elementId: hitId,
        screen
      });
    }
  }

  /**
   * Sets cursor style based on hover over handles or selectable items.
   */
  updateHoverCursor(e) {
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    const screen = this.store.getActiveScreen();
    if (!screen) return;

    const activeId = this.store.getState().activeElementId;
    const currentBox = activeId ? this.getElementBox(screen, activeId) : null;

    if (currentBox) {
      const hitHandle = this.hitTestHandles(currentBox, x, y);
      if (hitHandle === 'rot') {
        this.canvas.style.cursor = 'grab';
        return;
      }
      if (hitHandle === 'tl' || hitHandle === 'br') {
        this.canvas.style.cursor = 'nwse-resize';
        return;
      }
      if (hitHandle === 'tr' || hitHandle === 'bl') {
        this.canvas.style.cursor = 'nesw-resize';
        return;
      }
    }

    const id = this.hitTest(screen, x, y);
    const isDev = id === 'device' || (typeof id === 'string' && id.startsWith('device-'));
    const devItem = isDev ? getLayerItem(screen, id) : null;
    if (devItem && !devItem.image) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = id ? 'move' : 'default';
    }
  }

  /**
   * Processes an uploaded image file and sets it on the active screen's device mockup.
   * @param {File} file
   */
  async handleImageFile(file) {
    await processImageUpload(file, this.store);
  }

  /**
   * Schedules a canvas redraw.
   */
  requestRender() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.render());
  }

  /**
   * Primary render routine for canvas.
   */
  async render() {
    const state = this.store.getState();
    const screen = this.store.getActiveScreen();
    if (!screen) return;

    // Canvas matches the document: the Play Store format, or 1024 × 500 for the feature graphic
    const { width, height } = docSize(state, screen);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    // Draw off-screen first: drawing awaits images/screen renders, and an on-screen half-drawn frame would flicker
    const frame = document.createElement('canvas');
    frame.width = width;
    frame.height = height;
    const token = ++this.frameToken;
    const bounds = await drawDocument(frame.getContext('2d'), state, screen, state.activeLanguage || 'en', { editor: true });
    if (token !== this.frameToken) return; // a newer frame started while this one was drawing
    this.headlineBounds = bounds.headline || null;
    this.subtitleBounds = bounds.subtitle || null;
    this.showcaseBounds = bounds.showcase || null;
    this.itemBounds = bounds || {};

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(frame, 0, 0);

    // Render interactive transform box with scale handles & rotation stem
    this.renderTransformBox(this.ctx, screen, state.activeElementId);
  }

  /**
   * Draws a professional bounding box with corner scaling handles and rotation controller.
   */
  renderTransformBox(ctx, screen, activeId) {
    if (!activeId) return;
    const box = this.getElementBox(screen, activeId);
    if (!box) return;

    const { cx, cy, width, height, rotation, canRotate, canScale } = box;
    const halfW = width / 2;
    const halfH = height / 2;
    const rotOffset = 38;

    ctx.save();
    ctx.translate(cx, cy);
    if (rotation) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    // 1. Selection border line
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(99, 102, 241, 0.45)';
    ctx.shadowBlur = 8;
    ctx.strokeRect(-halfW, -halfH, width, height);
    ctx.restore();

    // 2. Rotation stem and rotation handle circle
    if (canRotate) {
      ctx.save();
      // Stem line connecting box top edge to rotation handle
      ctx.beginPath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2;
      ctx.moveTo(0, -halfH);
      ctx.lineTo(0, -halfH - rotOffset);
      ctx.stroke();

      // Rotation handle circle
      ctx.beginPath();
      ctx.arc(0, -halfH - rotOffset, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#6366f1';
      ctx.stroke();

      // Small rotation icon inside handle
      ctx.beginPath();
      ctx.arc(0, -halfH - rotOffset, 3.5, 0, Math.PI * 1.5);
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Corner scaling handles
    if (canScale) {
      const handleSize = 13;
      const hHalf = handleSize / 2;
      const corners = [
        [-halfW, -halfH], // TL
        [halfW, -halfH],  // TR
        [halfW, halfH],   // BR
        [-halfW, halfH]   // BL
      ];

      corners.forEach(([hx, hy]) => {
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 5;
        ctx.fillRect(hx - hHalf, hy - hHalf, handleSize, handleSize);
        ctx.strokeRect(hx - hHalf, hy - hHalf, handleSize, handleSize);
        ctx.restore();
      });
    }

    // 4. Subtle center crosshair anchor indicator
    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.lineTo(7, 0);
    ctx.moveTo(0, -7); ctx.lineTo(0, 7);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}

/**
 * Checks if point is inside a rectangle bounds.
 */
function isPointInBounds(px, py, b) {
  if (!b) return false;
  return px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height;
}
