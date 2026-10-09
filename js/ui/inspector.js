/**
 * App Screen Generator - Clean & Intuitive Property Inspector
 * Replaces cramped forms with clean visual color chips, size presets,
 * and spacious contextual controls.
 */

import { guardedRender } from './renderGuard.js';
import { mountFontPicker } from './fontPicker.js';
import { TEXT_PRESETS } from '../features/text/fontManager.js';
import { processImageUpload } from '../canvas/imageUploader.js';
import { activeDoc, FEATURE_ID } from '../state/store.js';
import { showcaseOrder, renderScreenShot } from '../canvas/compose.js';
import { setBackgroundImage, readImageFile } from '../canvas/imageUploader.js';
import { removeBackgroundFromDataUrl } from '../canvas/backgroundRemoval.js';
import { getLayerItem, ensureScreenDevices } from '../state/layers.js';

export class Inspector {
  /**
   * @param {HTMLElement} containerEl
   * @param {Object} store
   */
  constructor(containerEl, store) {
    this.container = containerEl;
    this.store = store;

    this.store.subscribe(guardedRender(this.container, () => this.render()));
    this.render();
  }

  /**
   * Renders contextual inspector controls.
   */
  render() {
    const state = this.store.getState();
    const screen = this.store.getActiveScreen();
    if (!screen) {
      this.container.innerHTML = '<div class="p-6 text-slate-400 text-center">No screen active</div>';
      return;
    }

    const activeEl = state.activeElementId;
    const isDevice = activeEl === 'device' || (typeof activeEl === 'string' && activeEl.startsWith('device-'));
    let selectedShape = null;
    let selectedDevice = null;

    if (isDevice) {
      selectedDevice = getLayerItem(screen, activeEl);
    } else if (activeEl && activeEl !== 'headline' && activeEl !== 'subtitle') {
      selectedShape = screen.shapes?.find(s => s.id === activeEl) || null;
    }

    this.container.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'clean-inspector-wrap';

    if (selectedShape?.type === 'image') {
      this.renderImageItemSection(wrap, selectedShape);
    } else if (selectedShape?.type === 'text') {
      this.renderTextSection(wrap, screen, activeEl, selectedShape);
    } else if (selectedShape) {
      this.renderShapeSection(wrap, screen, selectedShape);
    } else if (activeEl === 'showcase' && screen.showcase) {
      this.renderShowcaseSection(wrap, screen.showcase, state);
    } else if (activeEl === 'headline' || activeEl === 'subtitle') {
      this.renderTextSection(wrap, screen, activeEl, screen[activeEl]);
    } else if (selectedDevice && !selectedDevice.hidden) {
      this.renderDeviceSection(wrap, screen, selectedDevice);
    } else {
      this.renderScreenSection(wrap, screen, state);
    }

    this.container.appendChild(wrap);
  }

  /**
   * Clean Shape Inspector with visual color swatches and size presets.
   */
  renderShapeSection(container, screen, shape) {
    const presetColors = ['#ffffff', '#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e', '#0f172a'];

    container.innerHTML = `
      <div class="insp-card">
        <div class="insp-header-row">
          <div>
            <h4 class="insp-heading">Selected Shape</h4>
            <span class="insp-subheading">${shape.type.replace('_', ' ').toUpperCase()}</span>
          </div>
          <button class="btn btn-danger btn-xs" id="clean-delete-shape"><span class="material-symbols-outlined" style="font-size:14px;">delete</span> Delete</button>
        </div>

        ${shape.label !== undefined ? `
          <div class="form-group mb-3">
            <label class="form-label">Badge Text</label>
            <input type="text" class="form-input" id="clean-shape-label" value="${escapeHtml(shape.label || '')}" />
          </div>
        ` : ''}

        <!-- Quick Color Palette -->
        <div class="form-group mb-4">
          <label class="form-label">Fill Color</label>
          <div class="color-palette-row">
            ${presetColors.map(c => `
              <button class="color-circle ${shape.fillColor === c ? 'selected' : ''}" style="background: ${c};" data-color="${c}"></button>
            `).join('')}
            <input type="color" class="color-swatch-sm" id="clean-shape-custom-color" value="${rgbToHex(shape.fillColor || '#ffffff')}" title="Custom Color" />
          </div>
        </div>

        <!-- Size Presets -->
        <div class="form-group mb-4">
          <label class="form-label">Size (${Math.round((shape.scale || 1) * 100)}%)</label>
          <div class="size-preset-row mb-2">
            ${[['0.75', 'Small'], ['1.0', 'Medium'], ['1.3', 'Large']].map(([v, name]) =>
              `<button class="size-pill ${Math.abs((shape.scale || 1) - v) < 0.001 ? 'active' : ''}" data-scale="${v}">${name}</button>`).join('')}
          </div>
          <input type="range" class="form-range" id="clean-shape-scale" min="0.4" max="1.8" step="0.05" value="${shape.scale || 1}" />
        </div>

        <!-- Rounded Corner Slider (if applicable) -->
        ${shape.borderRadius !== undefined ? `
          <div class="form-group mb-3">
            <label class="form-label">Corner Roundness (${shape.borderRadius}px)</label>
            <input type="range" class="form-range" id="clean-shape-radius" min="0" max="60" step="2" value="${shape.borderRadius}" />
          </div>
        ` : ''}

        <!-- Drop Shadow Toggle -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-700">
          <span class="text-sm font-semibold text-slate-300">Shadow Effect</span>
          <input type="checkbox" id="clean-shape-shadow" ${shape.shadow ? 'checked' : ''} />
        </div>
      </div>
    `;

    const updateShape = (cb) => {
      this.store.update(state => {
        const sc = activeDoc(state);
        const sh = sc?.shapes?.find(s => s.id === shape.id);
        if (sh) cb(sh);
      });
    };

    // Label input
    const labelInput = container.querySelector('#clean-shape-label');
    if (labelInput) labelInput.oninput = (e) => updateShape(s => s.label = e.target.value);

    // Color buttons
    container.querySelectorAll('.color-circle').forEach(btn => {
      btn.onclick = () => updateShape(s => s.fillColor = btn.dataset.color);
    });

    const customColor = container.querySelector('#clean-shape-custom-color');
    if (customColor) customColor.oninput = (e) => updateShape(s => s.fillColor = e.target.value);

    // Size presets
    container.querySelectorAll('.size-pill').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateShape(s => s.scale = parseFloat(btn.dataset.scale));
      };
    });

    const scaleRange = container.querySelector('#clean-shape-scale');
    if (scaleRange) scaleRange.oninput = (e) => updateShape(s => s.scale = parseFloat(e.target.value));

    const radiusRange = container.querySelector('#clean-shape-radius');
    if (radiusRange) radiusRange.oninput = (e) => updateShape(s => s.borderRadius = parseFloat(e.target.value));

    const shadowCheck = container.querySelector('#clean-shape-shadow');
    if (shadowCheck) shadowCheck.onchange = (e) => updateShape(s => s.shadow = e.target.checked);

    // Delete
    container.querySelector('#clean-delete-shape').onclick = () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (sc && sc.shapes) {
          sc.shapes = sc.shapes.filter(s => s.id !== shape.id);
          state.activeElementId = null;
        }
      });
    };
  }

  /**
   * Clean Text Inspector with Ready Styles and freeform typography controls.
   */
  renderTextSection(container, screen, activeEl, targetObj) {
    const textTarget = targetObj || screen[activeEl] || {};
    const previewText = textTarget.text ? (textTarget.text.length > 25 ? textTarget.text.slice(0, 23) + '…' : textTarget.text) : 'Typography & Style';
    const presetColors = ['#ffffff', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7', '#0f172a'];

    container.innerHTML = `
      <div class="insp-card">
        <!-- Header with type badge & delete -->
        <div class="insp-header-row mb-3">
          <div>
            <h4 class="insp-heading">Text Element</h4>
            <span class="insp-subheading">${escapeHtml(previewText)}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-outline btn-xs" id="clean-duplicate-text" title="Duplicate text"><span class="material-symbols-outlined" style="font-size:14px;">content_copy</span> Copy</button>
            <button class="btn btn-danger btn-xs" id="clean-delete-text" title="Delete text"><span class="material-symbols-outlined" style="font-size:14px;">delete</span> Delete</button>
          </div>
        </div>

        <!-- Text Content -->
        <div class="form-group mb-3">
          <label class="form-label">Text Content</label>
          <textarea class="form-textarea" id="clean-text-content" rows="2" placeholder="Enter text...">${escapeHtml(textTarget.text || '')}</textarea>
        </div>

        <!-- Ready Styles Bar -->
        <div class="form-group mb-3">
          <label class="form-label text-[11px] mb-1">Apply Ready Style</label>
          <div class="ready-pills-row">
            ${TEXT_PRESETS.map(p => `
              <button class="ready-pill-btn py-1 px-2 text-[11px] flex items-center gap-1" data-insp-preset="${p.id}" title="Apply ${p.name} style">
                <span class="material-symbols-outlined" style="font-size:13px;">${p.icon}</span> ${p.name}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Font Family Picker -->
        <div class="form-group mb-3">
          <label class="form-label">Font Family</label>
          <div id="clean-font-picker"></div>
        </div>

        <!-- Font Size Slider & Presets -->
        <div class="form-group mb-3">
          <div class="flex items-center justify-between mb-1">
            <label class="form-label mb-0">Font Size</label>
            <span class="text-xs font-mono text-indigo-300 font-bold" id="clean-font-size-label">${textTarget.fontSize || 48}px</span>
          </div>
          <div class="size-preset-row mb-1.5">
            ${[['24', 'Small'], ['36', 'Medium'], ['48', 'Large'], ['72', 'XL']].map(([v, name]) => `
              <button class="size-pill py-1 text-[10px] ${Math.abs((textTarget.fontSize || 48) - v) < 4 ? 'active' : ''}" data-insp-size="${v}">${name}</button>
            `).join('')}
          </div>
          <input type="range" class="form-range" id="clean-text-size" min="16" max="130" step="2" value="${textTarget.fontSize || 48}" />
        </div>

        <!-- Font Weight -->
        <div class="form-group mb-3">
          <label class="form-label text-[11px] mb-1">Weight</label>
          <div class="button-toggle-group">
            ${[['400', 'Regular'], ['600', 'Semi'], ['700', 'Bold'], ['800', 'Black']].map(([w, name]) => `
              <button class="toggle-btn text-[11px] py-1 ${(textTarget.fontWeight || '700') === w ? 'active' : ''}" data-insp-weight="${w}">${name}</button>
            `).join('')}
          </div>
        </div>

        <!-- Text Color -->
        <div class="form-group mb-3">
          <label class="form-label text-[11px] mb-1">Color</label>
          <div class="color-palette-row">
            ${presetColors.map(c => `
              <button class="color-circle ${(textTarget.color || '').toLowerCase() === c ? 'selected' : ''}" style="background: ${c};" data-insp-color="${c}"></button>
            `).join('')}
            <input type="color" class="color-swatch-sm" id="clean-text-color-custom" value="${textTarget.color || '#ffffff'}" title="Custom Color" />
          </div>
        </div>

        <!-- Alignment -->
        <div class="form-group mb-3">
          <label class="form-label text-[11px] mb-1">Text Align</label>
          <div class="button-toggle-group">
            <button class="toggle-btn text-[11px] py-1 ${(textTarget.align || 'center') === 'left' ? 'active' : ''}" data-insp-align="left">Left</button>
            <button class="toggle-btn text-[11px] py-1 ${(textTarget.align || 'center') === 'center' ? 'active' : ''}" data-insp-align="center">Center</button>
            <button class="toggle-btn text-[11px] py-1 ${(textTarget.align || 'center') === 'right' ? 'active' : ''}" data-insp-align="right">Right</button>
          </div>
        </div>

        <!-- Rotation & Reset -->
        <div class="form-group mb-3">
          <div class="flex items-center justify-between mb-1">
            <label class="form-label text-[11px] mb-0">Rotation Angle</label>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono text-indigo-300" id="clean-text-rot-label">${textTarget.rotation || 0}°</span>
              <button class="btn btn-outline btn-xs py-0.5 px-1.5 text-[10px]" id="clean-text-reset-rot" title="Reset angle to 0°">↺ 0°</button>
            </div>
          </div>
          <input type="range" class="form-range" id="clean-text-rotation" min="-180" max="180" step="1" value="${textTarget.rotation || 0}" />
        </div>

        <!-- Drop Shadow Toggle -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-700/60">
          <span class="text-xs font-semibold text-slate-300">Drop Shadow</span>
          <input type="checkbox" id="clean-text-shadow" ${textTarget.shadow ? 'checked' : ''} />
        </div>
      </div>
    `;

    const updateText = (cb) => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        if (activeEl === 'headline' || activeEl === 'subtitle') {
          if (sc[activeEl]) {
            sc[activeEl].hidden = false;
            cb(sc[activeEl]);
          }
        } else if (sc.shapes) {
          const sh = sc.shapes.find(s => s.id === activeEl);
          if (sh) {
            sh.hidden = false;
            cb(sh);
          }
        }
      });
    };

    // Text content
    container.querySelector('#clean-text-content').oninput = (e) => updateText(t => t.text = e.target.value);

    // One-click ready styles
    container.querySelectorAll('[data-insp-preset]').forEach(btn => {
      btn.onclick = () => {
        const preset = TEXT_PRESETS.find(p => p.id === btn.dataset.inspPreset);
        if (preset) {
          updateText(t => {
            t.fontFamily = preset.style.fontFamily;
            t.fontSize = preset.style.fontSize;
            t.fontWeight = preset.style.fontWeight;
            t.color = preset.style.color;
            t.shadow = preset.style.shadow;
            t.lineHeight = preset.style.lineHeight;
            t.align = preset.style.align;
          });
          this.render();
        }
      };
    });

    // Font picker
    mountFontPicker(container.querySelector('#clean-font-picker'), textTarget.fontFamily || 'Plus Jakarta Sans', (font) => updateText(t => t.fontFamily = font), `${label} font`);

    // Font size
    const sizeInput = container.querySelector('#clean-text-size');
    const sizeLabel = container.querySelector('#clean-font-size-label');
    if (sizeInput) {
      sizeInput.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (sizeLabel) sizeLabel.textContent = `${val}px`;
        updateText(t => t.fontSize = val);
      };
    }

    container.querySelectorAll('[data-insp-size]').forEach(btn => {
      btn.onclick = () => {
        const val = parseFloat(btn.dataset.inspSize);
        if (sizeInput) sizeInput.value = val;
        if (sizeLabel) sizeLabel.textContent = `${val}px`;
        updateText(t => t.fontSize = val);
        container.querySelectorAll('[data-insp-size]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    // Font weight
    container.querySelectorAll('[data-insp-weight]').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('[data-insp-weight]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateText(t => t.fontWeight = btn.dataset.inspWeight);
      };
    });

    // Colors
    container.querySelectorAll('[data-insp-color]').forEach(btn => {
      btn.onclick = () => {
        updateText(t => t.color = btn.dataset.inspColor);
        this.render();
      };
    });

    const customColor = container.querySelector('#clean-text-color-custom');
    if (customColor) {
      customColor.oninput = (e) => updateText(t => t.color = e.target.value);
    }

    // Alignment
    container.querySelectorAll('[data-insp-align]').forEach(btn => {
      btn.onclick = () => {
        container.querySelectorAll('[data-insp-align]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateText(t => t.align = btn.dataset.inspAlign);
      };
    });

    // Rotation slider
    const rotInput = container.querySelector('#clean-text-rotation');
    const rotLabel = container.querySelector('#clean-text-rot-label');
    if (rotInput) {
      rotInput.oninput = (e) => {
        const val = parseFloat(e.target.value);
        if (rotLabel) rotLabel.textContent = `${val}°`;
        updateText(t => t.rotation = val);
      };
    }

    container.querySelector('#clean-text-reset-rot')?.addEventListener('click', () => {
      if (rotInput) rotInput.value = 0;
      if (rotLabel) rotLabel.textContent = '0°';
      updateText(t => t.rotation = 0);
    });

    // Shadow
    const shadowCheck = container.querySelector('#clean-text-shadow');
    if (shadowCheck) {
      shadowCheck.onchange = (e) => updateText(t => t.shadow = e.target.checked);
    }

    // Delete
    container.querySelector('#clean-delete-text')?.addEventListener('click', () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        if (activeEl === 'headline' || activeEl === 'subtitle') {
          if (sc[activeEl]) {
            sc[activeEl].text = '';
            sc[activeEl].hidden = true;
            sc[activeEl].deleted = true;
          }
          if (sc.layerOrder) sc.layerOrder = sc.layerOrder.filter(id => id !== activeEl);
        } else if (sc.shapes) {
          sc.shapes = sc.shapes.filter(s => s.id !== activeEl);
          if (sc.layerOrder) sc.layerOrder = sc.layerOrder.filter(id => id !== activeEl);
        }
        state.activeElementId = null;
      });
    });

    // Duplicate
    container.querySelector('#clean-duplicate-text')?.addEventListener('click', () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        const newId = 'text_' + Math.random().toString(36).substr(2, 9);
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
          x: Math.min((textTarget.x ?? 540) + 25, 960),
          y: Math.min((textTarget.y ?? (textTarget.yOffset ?? 200)) + 35, 2000),
          rotation: textTarget.rotation || 0,
          scale: textTarget.scale || 1
        };
        if (!sc.shapes) sc.shapes = [];
        sc.shapes.push(clone);
        state.activeElementId = newId;
      });
    });
  }

  /**
   * Clean Device Mockup Inspector.
   */
  renderDeviceSection(container, screen, devItem = null) {
    const dev = devItem || screen.device || {};
    const devId = dev.id || 'device';

    container.innerHTML = `
      <div class="insp-card">
        <div class="insp-header-row mb-3 flex items-center justify-between">
          <div>
            <h4 class="insp-heading mb-0">Phone Mockup</h4>
            <span class="insp-subheading">Device Frame</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="btn btn-outline btn-xs" id="clean-duplicate-device" title="Duplicate frame"><span class="material-symbols-outlined" style="font-size:14px;">content_copy</span> Copy</button>
            <button class="btn btn-danger btn-xs" id="clean-delete-device" title="Delete device frame"><span class="material-symbols-outlined" style="font-size:14px;">delete</span> Delete Frame</button>
          </div>
        </div>

        <input type="file" id="clean-device-upload-input" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden" />

        ${dev.image ? `
          <div class="flex items-center gap-3 p-2.5 bg-slate-800/40 rounded-xl mb-3 border border-indigo-500/20">
            <img src="${dev.image}" alt="Preview" style="width: 44px; height: 68px; object-fit: cover; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2);" />
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-slate-200">Screenshot Loaded</div>
              <div class="text-[11px] text-slate-400">Fits inside phone mockup</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2 mb-3">
            <button class="btn btn-primary btn-sm" id="clean-device-upload-btn">
              <span class="material-symbols-outlined" style="font-size:15px;">add_photo_alternate</span> Change
            </button>
            <button class="btn btn-outline btn-sm text-rose-400" id="clean-device-remove-img">
              <span class="material-symbols-outlined" style="font-size:15px;">close</span> Remove
            </button>
          </div>

          <!-- Fit mode -->
          <div class="form-group mb-3">
            <label class="form-label mb-1.5">Fit Mode</label>
            <div class="grid grid-cols-2 gap-2">
              <button class="btn btn-outline btn-xs ${(!dev.imageFit || dev.imageFit === 'cover') ? 'btn-primary' : ''}" data-insp-image-fit="cover">
                Fill Screen
              </button>
              <button class="btn btn-outline btn-xs ${dev.imageFit === 'contain' ? 'btn-primary' : ''}" data-insp-image-fit="contain">
                Fit Whole
              </button>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Screenshot Zoom (${Math.round((dev.imageScale || 1) * 100)}%)</label>
            <input type="range" class="form-range" id="clean-image-scale" min="0.5" max="1.5" step="0.02" value="${dev.imageScale || 1}" />
          </div>

          <div class="form-group mb-3">
            <label class="form-label">Screenshot Vertical Offset</label>
            <input type="range" class="form-range" id="clean-image-offset-y" min="-250" max="250" step="5" value="${dev.imageOffsetY || 0}" />
          </div>
        ` : `
          <button class="btn btn-primary w-full py-2.5 mb-3 flex items-center justify-center gap-1.5" id="clean-device-upload-btn">
            <span class="material-symbols-outlined" style="font-size:16px;">upload_file</span> Upload Screenshot
          </button>
        `}

        <!-- Phone Scale & Position -->
        <div class="form-group mb-3">
          <label class="form-label">Phone Size (${Math.round((dev.scale || 0.92) * 100)}%)</label>
          <input type="range" class="form-range" id="clean-device-scale" min="0.5" max="1.3" step="0.02" value="${dev.scale || 0.92}" />
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Phone Vertical Position</label>
          <input type="range" class="form-range" id="clean-device-y" min="700" max="1500" step="10" value="${dev.y || 1180}" />
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Drop Shadow Intensity</label>
          <input type="range" class="form-range" id="clean-device-shadow" min="0" max="80" step="5" value="${dev.shadowBlur || 45}" />
        </div>
      </div>
    `;

    const fileInput = container.querySelector('#clean-device-upload-input');
    const uploadBtn = container.querySelector('#clean-device-upload-btn');
    if (uploadBtn) uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
      if (e.target.files && e.target.files[0]) {
        await processImageUpload(e.target.files[0], this.store, devId);
        fileInput.value = '';
      }
    };

    const removeBtn = container.querySelector('#clean-device-remove-img');
    if (removeBtn) {
      removeBtn.onclick = () => {
        this.store.update(state => {
          const sc = activeDoc(state);
          const targetDev = getLayerItem(sc, devId);
          if (targetDev) targetDev.image = null;
        });
      };
    }

    const updateDev = (cb) => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        const targetDev = getLayerItem(sc, devId);
        if (targetDev) cb(targetDev);
      });
    };

    container.querySelectorAll('[data-insp-image-fit]').forEach(btn => {
      btn.onclick = () => updateDev(d => d.imageFit = btn.dataset.inspImageFit);
    });

    const imgScaleInput = container.querySelector('#clean-image-scale');
    if (imgScaleInput) imgScaleInput.oninput = (e) => updateDev(d => d.imageScale = parseFloat(e.target.value));

    const imgOffsetInput = container.querySelector('#clean-image-offset-y');
    if (imgOffsetInput) imgOffsetInput.oninput = (e) => updateDev(d => d.imageOffsetY = parseFloat(e.target.value));

    container.querySelector('#clean-device-scale').oninput = (e) => updateDev(d => d.scale = parseFloat(e.target.value));
    container.querySelector('#clean-device-y').oninput = (e) => updateDev(d => d.y = parseFloat(e.target.value));
    container.querySelector('#clean-device-shadow').oninput = (e) => updateDev(d => d.shadowBlur = parseFloat(e.target.value));

    container.querySelector('#clean-duplicate-device')?.addEventListener('click', () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        ensureScreenDevices(sc);
        const srcDev = getLayerItem(sc, devId) || sc.device;
        if (!srcDev) return;
        const newId = `device-${Date.now()}`;
        const newDev = {
          ...JSON.parse(JSON.stringify(srcDev)),
          id: newId,
          x: Math.round((srcDev.x || 540) + 70),
          y: Math.round((srcDev.y || 1180) + 40),
          hidden: false,
          isDevice: true
        };
        sc.devices = sc.devices || [];
        sc.devices.push(newDev);
        if (sc.layerOrder) sc.layerOrder.push(newId);
        state.activeElementId = newId;
      });
    });

    container.querySelector('#clean-delete-device')?.addEventListener('click', () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        ensureScreenDevices(sc);
        if (devId === 'device' && (!sc.devices || sc.devices.length <= 1)) {
          if (sc.device) {
            sc.device.hidden = true;
            sc.device.deleted = true;
          }
        } else {
          if (sc.devices) {
            sc.devices = sc.devices.filter(d => d.id !== devId);
            if (sc.device?.id === devId) {
              sc.device = sc.devices[0] || null;
            }
          } else if (sc.device) {
            sc.device.hidden = true;
            sc.device.deleted = true;
          }
        }
        if (sc.layerOrder) {
          sc.layerOrder = sc.layerOrder.filter(id => id !== devId);
        }
        if (state.activeElementId === devId) {
          state.activeElementId = null;
        }
      });
    });
  }

  /**
   * Feature graphic: which screens the showcase shows, their order, and how the tiles look.
   */
  renderShowcaseSection(container, item, state) {
    const order = showcaseOrder(state, item);
    const hidden = item.hiddenIds || [];
    const byId = new Map(state.screens.map(s => [s.id, s]));
    const radius = item.radius ?? 16, gap = item.gap ?? 16, height = item.height || 400, tilt = item.rotation || 0;

    container.innerHTML = `
      <div class="insp-card">
        <h4 class="insp-heading mb-1">Screens showcase</h4>
        <p class="text-xs text-slate-400 mb-3">Drag it on the canvas to move it.</p>

        <label class="form-label mb-2">Screens (tick to show · drag or ↑ ↓ to reorder)</label>
        <ul class="fg-list mb-3">
          ${order.map((id, i) => `
            <li class="fg-row ${hidden.includes(id) ? 'is-off' : ''}" draggable="true" tabindex="0" data-id="${id}">
              <span class="layer-grip" aria-hidden="true">⋮⋮</span>
              <input type="checkbox" ${hidden.includes(id) ? '' : 'checked'} />
              <canvas class="fg-thumb" width="54" height="96"></canvas>
              <span class="fg-name"></span>
              <button type="button" class="layer-btn" data-move="-1" title="Move earlier" aria-label="Move earlier" ${i === 0 ? 'disabled' : ''}>↑</button>
              <button type="button" class="layer-btn" data-move="1" title="Move later" aria-label="Move later" ${i === order.length - 1 ? 'disabled' : ''}>↓</button>
            </li>`).join('')}
        </ul>

        <div class="form-group mb-3">
          <label class="form-label">Size (${item.autoFit === false ? `${height}px tall` : 'auto-fit'})</label>
          <input type="range" class="form-range" data-prop="height" min="120" max="500" step="5" value="${height}" />
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Spacing (${gap}px)</label>
          <input type="range" class="form-range" data-prop="gap" min="0" max="80" step="2" value="${gap}" />
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Corner radius (${radius}px${radius === 0 ? ', square' : ''})</label>
          <input type="range" class="form-range" data-prop="radius" min="0" max="80" step="2" value="${radius}" />
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Tilt (${tilt}°)</label>
          <input type="range" class="form-range" data-prop="rotation" min="-30" max="30" step="1" value="${tilt}" />
        </div>
        <!-- Screen Background Options (Card vs Transparent / Remove Background) -->
        <div class="form-group mb-3 pt-2.5 border-t border-slate-700/60">
          <label class="form-label mb-1.5 flex items-center justify-between">
            <span class="flex items-center gap-1.5 font-bold">
              <span class="material-symbols-outlined text-indigo-400" style="font-size:16px;">auto_fix_high</span>
              <span>Screen Background</span>
            </span>
          </label>
          <div class="grid grid-cols-2 gap-2 mb-2">
            <button type="button" class="btn btn-xs ${!item.removeBackground ? 'btn-primary' : 'btn-outline'}" id="showcase-bg-card">
              Full Card
            </button>
            <button type="button" class="btn btn-xs ${item.removeBackground ? 'btn-primary' : 'btn-outline'}" id="showcase-bg-transparent">
              Remove Background
            </button>
          </div>
          <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input type="checkbox" id="showcase-only-device" ${item.onlyDevice ? 'checked' : ''} />
            <span>Show phone frame only (hide screen text)</span>
          </label>
        </div>

        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" id="showcase-shadow" ${item.shadow ?? true ? 'checked' : ''} /> Drop shadow
        </label>
      </div>
    `;

    const update = (fn) => this.store.update(s => fn(activeDoc(s).showcase));
    const move = (id, to) => update(sc => {
      const rest = showcaseOrder(this.store.getState(), sc).filter(x => x !== id);
      rest.splice(Math.max(0, Math.min(rest.length, to)), 0, id);
      sc.order = rest;
    });

    container.querySelector('#showcase-bg-card')?.addEventListener('click', () => {
      update(sc => { sc.removeBackground = false; sc.transparentBg = false; });
    });
    container.querySelector('#showcase-bg-transparent')?.addEventListener('click', () => {
      update(sc => { sc.removeBackground = true; sc.transparentBg = true; });
    });
    container.querySelector('#showcase-only-device')?.addEventListener('change', (e) => {
      update(sc => { sc.onlyDevice = e.target.checked; });
    });

    container.querySelectorAll('[data-prop]').forEach(input => {
      input.oninput = () => update(sc => {
        sc[input.dataset.prop] = Number(input.value);
        if (input.dataset.prop === 'height') sc.autoFit = false; // the user's size wins over auto-fit
      });
    });
    container.querySelector('#showcase-shadow').onchange = (e) => update(sc => { sc.shadow = e.target.checked; });

    container.querySelectorAll('.fg-row').forEach((row, i) => {
      const id = row.dataset.id;
      const screen = byId.get(id);
      row.querySelector('.fg-name').textContent = screen.name || `Screen ${i + 1}`;
      row.querySelector('input').setAttribute('aria-label', `Show ${screen.name || `screen ${i + 1}`}`);
      row.querySelector('input').onchange = (e) => update(sc => {
        const h = new Set(sc.hiddenIds || []);
        e.target.checked ? h.delete(id) : h.add(id);
        sc.hiddenIds = [...h];
      });
      row.querySelectorAll('[data-move]').forEach(btn => { btn.onclick = () => move(id, i + Number(btn.dataset.move)); });
      row.onkeydown = (e) => {
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { e.preventDefault(); move(id, i + (e.key === 'ArrowUp' ? -1 : 1)); }
      };
      row.ondragstart = (e) => e.dataTransfer.setData('text/plain', id);
      row.ondragover = (e) => {
        e.preventDefault();
        const r = row.getBoundingClientRect();
        const below = e.clientY > r.top + r.height / 2;
        row.classList.toggle('drop-above', !below);
        row.classList.toggle('drop-below', below);
      };
      row.ondragleave = () => row.classList.remove('drop-above', 'drop-below');
      row.ondrop = (e) => {
        e.preventDefault();
        const dragged = e.dataTransfer.getData('text/plain');
        const below = row.classList.contains('drop-below');
        row.classList.remove('drop-above', 'drop-below');
        if (dragged && dragged !== id) move(dragged, order.filter(x => x !== dragged).indexOf(id) + (below ? 1 : 0));
      };
      // Thumbnail from the cached full render (cheap after the first time)
      const thumb = row.querySelector('.fg-thumb');
      renderScreenShot(state, screen, state.activeLanguage).then(shot => thumb.getContext('2d').drawImage(shot, 0, 0, thumb.width, thumb.height));
    });
  }

  /**
   * An uploaded picture on the canvas: size, corners, shadow, opacity, rotation, replace, delete.
   */
  renderImageItemSection(container, item) {
    const scale = item.scale || 1, radius = item.radius || 0, opacity = item.opacity ?? 1, rotation = item.rotation || 0;
    container.innerHTML = `
      <div class="insp-card">
        <h4 class="insp-heading mb-1">Image</h4>
        <p class="text-xs text-slate-400 mb-3">Drag it on the canvas to move it.</p>
        <div class="form-group mb-3">
          <label class="form-label">Size (${Math.round(scale * 100)}%)</label>
          <input type="range" class="form-range" data-prop="scale" min="0.1" max="3" step="0.05" value="${scale}" />
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Corner radius (${radius}px${radius === 0 ? ', square' : ''})</label>
          <input type="range" class="form-range" data-prop="radius" min="0" max="300" step="2" value="${radius}" />
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Opacity (${Math.round(opacity * 100)}%)</label>
          <input type="range" class="form-range" data-prop="opacity" min="0.1" max="1" step="0.05" value="${opacity}" />
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Rotation (${rotation}°)</label>
          <input type="range" class="form-range" data-prop="rotation" min="-180" max="180" step="1" value="${rotation}" />
        </div>
        <label class="flex items-center gap-2 text-sm mb-3">
          <input type="checkbox" id="image-shadow" ${item.shadow ? 'checked' : ''} /> Drop shadow
        </label>

        <!-- Background Removal Control -->
        <div class="form-group mb-3 pt-2.5 border-t border-slate-700/60">
          <div class="flex items-center justify-between mb-1.5">
            <span class="form-label mb-0 flex items-center gap-1.5 font-bold">
              <span class="material-symbols-outlined text-indigo-400" style="font-size:16px;">auto_fix_high</span>
              <span>Background Removal</span>
            </span>
            ${item.bgRemoved ? `<button type="button" class="btn btn-outline btn-xs" id="image-restore-bg" title="Restore original image">Restore</button>` : ''}
          </div>

          ${item.bgRemoved ? `
            <div class="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 mb-2">
              <div class="flex justify-between items-center text-xs mb-1">
                <span class="text-emerald-400 font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined" style="font-size:14px;">check_circle</span> Removed
                </span>
                <span class="text-slate-300 font-mono text-[11px]" id="image-tol-val">${item.bgTolerance || 32}% tolerance</span>
              </div>
              <input type="range" class="form-range" id="image-bg-tolerance" min="5" max="85" step="1" value="${item.bgTolerance || 32}" />
              <div class="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                <span>Tight cutout</span>
                <span>Deep cutout</span>
              </div>
            </div>
          ` : `
            <button type="button" class="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5 border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10" id="image-remove-bg">
              <span class="material-symbols-outlined" style="font-size:16px;">auto_fix_high</span> Remove Background
            </button>
          `}
        </div>

        <input type="file" accept="image/*" class="hidden" id="image-replace-file" />
        <div class="flex gap-2">
          <button type="button" class="btn btn-outline btn-sm flex-1" id="image-replace"><span class="material-symbols-outlined" style="font-size:15px;">refresh</span> Replace</button>
          <button type="button" class="btn btn-outline btn-sm text-rose-400" id="image-delete"><span class="material-symbols-outlined" style="font-size:15px;">delete</span> Delete</button>
        </div>
      </div>
    `;
    const update = (fn) => this.store.update(s => {
      const it = activeDoc(s).shapes.find(sh => sh.id === item.id);
      if (it) fn(it);
    });
    container.querySelectorAll('[data-prop]').forEach(input => {
      input.oninput = () => update(it => { it[input.dataset.prop] = Number(input.value); });
    });
    container.querySelector('#image-shadow').onchange = (e) => update(it => { it.shadow = e.target.checked; });

    // Background removal handlers
    const removeBgBtn = container.querySelector('#image-remove-bg');
    if (removeBgBtn) {
      removeBgBtn.onclick = async () => {
        removeBgBtn.textContent = 'Removing…';
        try {
          const orig = item.originalSrc || item.src;
          const tol = item.bgTolerance || 32;
          const res = await removeBackgroundFromDataUrl(orig, { tolerance: tol, feather: item.bgFeather || 2 });
          update(it => {
            it.originalSrc = orig;
            it.src = res.src;
            it.bgRemoved = true;
            it.bgTolerance = tol;
          });
        } catch (err) {
          console.warn('Background removal error:', err);
        }
      };
    }

    const restoreBgBtn = container.querySelector('#image-restore-bg');
    if (restoreBgBtn) {
      restoreBgBtn.onclick = () => {
        update(it => {
          if (it.originalSrc) {
            it.src = it.originalSrc;
            it.bgRemoved = false;
          }
        });
      };
    }

    const tolRange = container.querySelector('#image-bg-tolerance');
    if (tolRange) {
      let tolTimer = null;
      tolRange.oninput = (e) => {
        const tol = parseInt(e.target.value, 10);
        const label = container.querySelector('#image-tol-val');
        if (label) label.textContent = `${tol}% tolerance`;
        clearTimeout(tolTimer);
        tolTimer = setTimeout(async () => {
          const orig = item.originalSrc || item.src;
          try {
            const res = await removeBackgroundFromDataUrl(orig, { tolerance: tol, feather: item.bgFeather || 2 });
            update(it => {
              it.originalSrc = orig;
              it.src = res.src;
              it.bgTolerance = tol;
              it.bgRemoved = true;
            });
          } catch (err) {
            console.warn('Tolerance adjustment error:', err);
          }
        }, 80);
      };
    }

    const file = container.querySelector('#image-replace-file');
    container.querySelector('#image-replace').onclick = () => file.click();
    file.onchange = async () => {
      const image = await readImageFile(file.files[0], 1600);
      // Keep the on-canvas width, follow the new picture's proportions
      if (image) update(it => {
        it.src = image.src;
        it.originalSrc = null;
        it.bgRemoved = false;
        it.height = Math.round(it.width * image.height / image.width);
      });
    };
    container.querySelector('#image-delete').onclick = () => this.store.update(s => {
      const doc = activeDoc(s);
      doc.shapes = doc.shapes.filter(sh => sh.id !== item.id);
      s.activeElementId = null;
    });
  }

  /**
   * Clean Screen & Background Inspector.
   */
  renderScreenSection(container, screen, state) {
    const bg = screen.background || { type: 'gradient', color1: '#4f46e5', color2: '#7c3aed', angle: 135 };

    const isSolid = bg.type === 'solid';
    const solidColor = rgbToHex(bg.solidColor || bg.color1 || '#0f172a');

    const quickPalettes = [
      { name: 'Indigo', c1: '#4f46e5', c2: '#7c3aed' },
      { name: 'Emerald', c1: '#090d16', c2: '#064e3b' },
      { name: 'Sunset', c1: '#e11d48', c2: '#ea580c' },
      { name: 'Ocean', c1: '#0284c7', c2: '#0f172a' },
      { name: 'Dark Luxe', c1: '#0f172a', c2: '#1e1b4b' }
    ];

    const solidPresets = [
      '#0f172a', '#ffffff', '#1e293b', '#0a192f', '#064e3b',
      '#881337', '#3b0764', '#18181b', '#4f46e5', '#e11d48'
    ];

    container.innerHTML = `
      <div class="insp-card">
        <h4 class="insp-heading mb-1">${screen.id === FEATURE_ID ? 'Feature Graphic Background' : 'Screen Background'}</h4>
        <p class="text-xs text-slate-400 mb-3">Choose one solid color or a modern gradient.</p>

        <!-- Solid vs Gradient Toggle -->
        <label class="form-label mb-1.5">Background Style</label>
        <div class="button-toggle-group mb-3">
          <button type="button" class="toggle-btn text-[11px] py-1 ${isSolid ? 'active' : ''}" id="btn-bg-mode-solid"><span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:3px;">crop_square</span>Solid Color</button>
          <button type="button" class="toggle-btn text-[11px] py-1 ${!isSolid ? 'active' : ''}" id="btn-bg-mode-gradient"><span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:3px;">gradient</span>Gradient</button>
        </div>

        ${isSolid ? `
          <!-- Solid Color Controls -->
          <div class="form-group mb-3">
            <div class="flex items-center justify-between mb-1">
              <label class="form-label mb-0">Solid Color</label>
              <span class="text-xs font-mono text-indigo-300 font-bold" id="clean-bg-solid-label">${solidColor}</span>
            </div>
            <input type="color" class="color-swatch-sm w-full" id="clean-bg-solid-color" value="${solidColor}" />
          </div>

          <!-- Solid Presets -->
          <label class="form-label mb-1.5 text-xs text-slate-300">Quick Solid Colors:</label>
          <div class="color-palette-row mb-3">
            ${solidPresets.map(c => `
              <button type="button" class="color-circle ${solidColor.toLowerCase() === c.toLowerCase() ? 'selected' : ''}" style="background: ${c};" data-solid-c="${c}" title="${c}"></button>
            `).join('')}
          </div>
        ` : `
          <!-- Quick Gradients -->
          <label class="form-label mb-2">Preset Color Themes:</label>
          <div class="gradient-preset-grid mb-3">
            ${quickPalettes.map(p => `
              <button class="gradient-preset-btn" style="background: linear-gradient(135deg, ${p.c1}, ${p.c2})" data-c1="${p.c1}" data-c2="${p.c2}" title="${p.name}"></button>
            `).join('')}
          </div>

          <!-- Custom Gradient Colors -->
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="form-group">
              <label class="form-label">Color 1</label>
              <input type="color" class="color-swatch-sm w-full" id="clean-bg-c1" value="${rgbToHex(bg.color1 || '#4f46e5')}" />
            </div>
            <div class="form-group">
              <label class="form-label">Color 2</label>
              <input type="color" class="color-swatch-sm w-full" id="clean-bg-c2" value="${rgbToHex(bg.color2 || '#7c3aed')}" />
            </div>
          </div>
        `}

        <!-- Background picture -->
        <div class="form-group mb-3">
          <label class="form-label">Background image</label>
          <input type="file" accept="image/*" class="hidden" id="clean-bg-file" />
          <div class="flex gap-2">
            <button type="button" class="btn btn-outline btn-sm flex-1 flex items-center justify-center gap-1.5" id="clean-bg-upload">${bg.image ? '<span class="material-symbols-outlined" style="font-size:15px;">refresh</span> Replace image' : '<span class="material-symbols-outlined" style="font-size:15px;">add_photo_alternate</span> Upload image'}</button>
            ${bg.image ? '<button type="button" class="btn btn-outline btn-sm text-rose-400" id="clean-bg-remove">Remove</button>' : ''}
          </div>
        </div>

        ${screen.id === FEATURE_ID ? `
        <div class="form-group mt-3 pt-3 border-t border-slate-700">
          <button type="button" class="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5" id="clean-feature-download"><span class="material-symbols-outlined" style="font-size:16px;">download</span> Download feature graphic (JPEG)</button>
          <p class="text-xs text-slate-400 mt-1">1024 × 500. Click the screens on the canvas to choose which appear and style them.</p>
        </div>
        ` : `
        <!-- Google Play Format -->
        <div class="form-group mt-3 pt-3 border-t border-slate-700">
          <label class="form-label">Play Store Format</label>
          <select class="form-select" id="clean-preset-select">
            <option value="phone_standard" ${state.canvasPreset === 'phone_standard' ? 'selected' : ''}>Phone (1080 × 1920)</option>
            <option value="phone_modern" ${state.canvasPreset === 'phone_modern' ? 'selected' : ''}>Modern Android (1080 × 2400)</option>
            <option value="tablet_7" ${state.canvasPreset === 'tablet_7' ? 'selected' : ''}>7" Tablet (1200 × 1920)</option>
            <option value="tablet_10" ${state.canvasPreset === 'tablet_10' ? 'selected' : ''}>10" Tablet (1600 × 2560)</option>
          </select>
        </div>

        <!-- Feature graphic: built from the screens -->
        <div class="form-group mt-3">
          <button type="button" class="btn btn-outline btn-sm w-full flex items-center justify-center gap-1.5" id="clean-feature-graphic"><span class="material-symbols-outlined" style="font-size:16px;">featured_video</span> Edit feature graphic</button>
          <p class="text-xs text-slate-400 mt-1">Design the 1024 × 500 Play Store banner from your screens.</p>
        </div>
        `}
      </div>
    `;

    const updateBg = (cb) => {
      this.store.update(s => {
        const sc = activeDoc(s);
        if (sc && sc.background) cb(sc.background);
      });
    };

    // Mode toggles
    container.querySelector('#btn-bg-mode-solid')?.addEventListener('click', () => {
      updateBg(b => {
        b.type = 'solid';
        b.solidColor = b.solidColor || b.color1 || '#0f172a';
      });
      this.render();
    });

    container.querySelector('#btn-bg-mode-gradient')?.addEventListener('click', () => {
      updateBg(b => {
        b.type = 'gradient';
        b.color1 = b.color1 || b.solidColor || '#4f46e5';
        b.color2 = b.color2 || '#7c3aed';
        b.angle = b.angle || 135;
      });
      this.render();
    });

    // Solid controls
    const solidInput = container.querySelector('#clean-bg-solid-color');
    const solidLabel = container.querySelector('#clean-bg-solid-label');
    if (solidInput) {
      solidInput.oninput = (e) => {
        const val = e.target.value;
        if (solidLabel) solidLabel.textContent = val;
        updateBg(b => {
          b.type = 'solid';
          b.solidColor = val;
        });
      };
    }

    container.querySelectorAll('[data-solid-c]').forEach(btn => {
      btn.onclick = () => {
        const val = btn.dataset.solidC;
        if (solidInput) solidInput.value = val;
        if (solidLabel) solidLabel.textContent = val;
        updateBg(b => {
          b.type = 'solid';
          b.solidColor = val;
        });
        container.querySelectorAll('[data-solid-c]').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      };
    });

    // Gradient controls
    container.querySelectorAll('.gradient-preset-btn').forEach(btn => {
      btn.onclick = () => {
        updateBg(b => {
          b.type = 'gradient';
          b.color1 = btn.dataset.c1;
          b.color2 = btn.dataset.c2;
        });
      };
    });

    const c1Input = container.querySelector('#clean-bg-c1');
    const c2Input = container.querySelector('#clean-bg-c2');
    if (c1Input) c1Input.oninput = (e) => updateBg(b => { b.type = 'gradient'; b.color1 = e.target.value; });
    if (c2Input) c2Input.oninput = (e) => updateBg(b => { b.type = 'gradient'; b.color2 = e.target.value; });

    const bgFile = container.querySelector('#clean-bg-file');
    container.querySelector('#clean-bg-upload').onclick = () => bgFile.click();
    bgFile.onchange = () => setBackgroundImage(bgFile.files[0], this.store);
    const bgRemove = container.querySelector('#clean-bg-remove');
    if (bgRemove) bgRemove.onclick = () => updateBg(b => { delete b.image; });
    container.querySelector('#clean-feature-download')?.addEventListener('click', () => this.onDownloadFeatureGraphic?.());

    const presetSelect = container.querySelector('#clean-preset-select');
    if (presetSelect) presetSelect.onchange = (e) => this.store.setCanvasPreset(e.target.value);
    container.querySelector('#clean-feature-graphic')?.addEventListener('click', () => this.store.setActiveScreen(FEATURE_ID));
  }
}

function rgbToHex(val) {
  if (!val) return '#4f46e5';
  val = val.trim();
  if (val.startsWith('#')) {
    if (val.length === 4) return `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`;
    return val.slice(0, 7);
  }
  const match = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#4f46e5';
}

function escapeHtml(str) {
  return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
}
