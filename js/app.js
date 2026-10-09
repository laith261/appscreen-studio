/**
 * App Screen Generator - Application Orchestrator & Entry Point
 * Coordinates reactive state, canvas rendering, modals, tools, and export workflows.
 */

import { appStore } from './state/store.js';
import { CanvasRenderer } from './canvas/renderer.js';
import { Exporter } from './canvas/exporter.js';
import { ScreenSelector } from './ui/screenSelector.js';
import { Inspector } from './ui/inspector.js';
import { LeftDrawer } from './ui/leftDrawer.js';
import { ShapePickerModal } from './ui/shapePickerModal.js';
import { TemplatePickerModal } from './ui/templatePickerModal.js';
import { OverviewPanel } from './ui/overviewPanel.js';
import { SUPPORTED_LANGUAGES, AI_PROVIDERS, getAiSettings, saveAiSettings, isAiReady, verifyApiKey } from './features/translation/translationService.js';
import { themeManager, STUDIO_THEMES } from './features/theme/themeManager.js';
import { activeDoc } from './state/store.js';
import { docSize } from './canvas/compose.js';
import { applyTemplate } from './features/templates/templates.js';
import {
  getLastProjectId,
  setLastProjectId,
  getLocalProject,
  saveLocalProject,
  getUiState,
  saveUiState,
  idbGetProject
} from './features/storage/persistenceManager.js';
import {
  ContextMenu,
  buildElementContextMenuItems,
  buildCanvasContextMenuItems,
  buildScreenCardContextMenuItems,
  duplicateElement,
  deleteElement,
  reorderLayer
} from './ui/contextMenu.js';

class AppScreenStudio {
  constructor() {
    this.store = appStore;

    // 1. Resolve project ID: URL parameter -> saved last project -> new project
    const url = new URL(location.href);
    const isExplicitNew = url.searchParams.get('new') === 'true' || url.searchParams.get('project') === 'new';
    let id = url.searchParams.get('project');
    if (id === 'new') id = null;

    if (!isExplicitNew && !id) {
      id = getLastProjectId();
      if (id) {
        url.searchParams.set('project', id);
        history.replaceState(null, '', url);
      }
    }

    if (isExplicitNew || !id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const templateParam = url.searchParams.get('template');
      url.searchParams.delete('new');
      url.searchParams.delete('template');
      url.searchParams.set('project', id);
      history.replaceState(null, '', url);
      setLastProjectId(id);

      if (templateParam) {
        applyTemplate(this.store, templateParam, true);
        this.store.history = [];
        this.store.future = [];
      }
    } else {
      setLastProjectId(id);
      // Synchronously restore project from local cache before rendering any UI
      const cached = getLocalProject(id);
      if (cached) {
        this.store.loadProject(cached);
        this.store.history = [];
        this.store.future = [];
      }
    }

    this.projectId = id;

    // 2. Restore saved UI preferences (zoom, drawer tab, etc.)
    const uiState = getUiState();
    this.currentZoom = typeof uiState.zoom === 'number' ? uiState.zoom : 0.85;

    this.canvas = document.getElementById('main-app-canvas');
    this.renderer = new CanvasRenderer(this.canvas, this.store);
    this.exporter = new Exporter(this.store);

    // Left Navigation Dock & Quick Drawer
    this.leftDrawer = new LeftDrawer(
      document.getElementById('left-nav-dock'),
      document.getElementById('left-quick-drawer'),
      this.store,
      uiState
    );
    this.leftDrawer.onUiChange = () => {
      this.persistUiState();
      this.updateZoomDisplay();
    };

    // UI Panels
    this.screenSelector = new ScreenSelector(document.getElementById('bottom-screen-strip'), this.store);
    this.inspector = new Inspector(document.getElementById('studio-inspector-sidebar'), this.store);
    this.inspector.onDownloadFeatureGraphic = () => this.exporter.exportFeatureGraphic();

    // Context Menu
    this.contextMenu = new ContextMenu();
    this.initContextMenuHandlers();

    // Modals
    this.shapeModal = new ShapePickerModal(this.store);
    this.templateModal = new TemplatePickerModal(this.store);

    this.initHeader();
    this.initKeyboardShortcuts();
    this.initZoomControls();
    this.initOverview();

    // Restore stage scroll position if saved
    if (uiState.scrollTop || uiState.scrollLeft) {
      setTimeout(() => {
        const stage = document.getElementById('canvas-stage-wrapper');
        if (stage) {
          if (uiState.scrollTop) stage.scrollTop = uiState.scrollTop;
          if (uiState.scrollLeft) stage.scrollLeft = uiState.scrollLeft;
        }
      }, 60);
    }

    // Trigger initial render
    this.renderer.requestRender();
    this.updateZoomDisplay();

    this.store.subscribe(() => {
      this.updateZoomDisplay();
    });

    this.initPersistence();
    this.initProjectSync();
  }

  /**
   * Initializes local storage auto-save and browser lifecycle listeners.
   */
  initPersistence() {
    // 1. Immediately save to localStorage whenever store state updates
    this.store.subscribe((state) => {
      saveLocalProject(this.projectId, state);
    });

    // 2. Flush project & UI state synchronously on beforeunload, pagehide, and visibilitychange
    const flushState = () => {
      if (this.projectId) {
        saveLocalProject(this.projectId, this.store.getState());
        this.persistUiState();
      }
    };

    window.addEventListener('beforeunload', flushState);
    window.addEventListener('pagehide', flushState);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushState();
    });

    // 3. Save scroll position on stage scroll (debounced)
    const stage = document.getElementById('canvas-stage-wrapper');
    if (stage) {
      let scrollTimer = null;
      stage.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => this.persistUiState(), 250);
      }, { passive: true });
    }

    // 4. Check IndexedDB in case it has large images or richer offline data
    idbGetProject(this.projectId).then((idbProject) => {
      if (idbProject && idbProject.screens) {
        const currentScreens = this.store.getState().screens;
        let needsHydrate = false;
        idbProject.screens.forEach((idbSc, idx) => {
          const curSc = currentScreens[idx];
          if (curSc && idbSc.device?.image && !curSc.device?.image) {
            curSc.device.image = idbSc.device.image;
            needsHydrate = true;
          }
        });
        if (needsHydrate) {
          this.store.notify();
        }
      }
    }).catch(err => console.warn('IndexedDB check:', err));
  }

  /**
   * Persists active UI view state (drawer tab, collapse state, zoom, scroll position).
   */
  persistUiState() {
    const stage = document.getElementById('canvas-stage-wrapper');
    saveUiState({
      activeTab: this.leftDrawer?.activeTab,
      isDrawerOpen: this.leftDrawer?.isOpen,
      themeFilter: this.leftDrawer?.themeFilter,
      zoom: this.currentZoom,
      scrollTop: stage?.scrollTop || 0,
      scrollLeft: stage?.scrollLeft || 0
    });
  }

  /**
   * Loads the project named in ?project=<id> from the server and autosaves every edit back to
   * projects/<id>.json via api/projects.php. Without the PHP API the editor still works, unsaved.
   */
  async initProjectSync() {
    const status = document.getElementById('save-status');
    const setStatus = (text) => { if (status) status.textContent = text; };

    const id = this.projectId;
    if (!id) return;

    try {
      const res = await fetch(`api/projects.php?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const { project } = await res.json();
        const local = getLocalProject(id);
        // Only load server project if local project was absent or blank
        if (project && (!local || !local.screens || local.screens.length === 0)) {
          this.store.loadProject(project);
          this.store.history = [];
          this.store.future = [];
          this.store.notify();
        }
        setStatus('✓ Saved');
      } else if (res.status === 404) {
        setStatus('✓ Saved locally');
      }
    } catch (err) {
      console.warn('Backend sync unavailable, using local persistence:', err);
      setStatus('✓ Saved locally');
    }

    let timer = null;
    const save = async () => {
      setStatus('Saving…');
      try {
        const state = this.store.getState();
        let thumbUrl = null;
        try {
          const full = await this.exporter.renderScreenOffscreen(state.screens[0], state.activeLanguage || 'en');
          const thumb = document.createElement('canvas');
          thumb.width = 240;
          thumb.height = Math.round(240 * full.height / full.width);
          thumb.getContext('2d').drawImage(full, 0, 0, thumb.width, thumb.height);
          thumbUrl = thumb.toDataURL('image/jpeg', 0.8);
        } catch (thumbErr) {
          console.warn('Could not generate thumbnail for server save:', thumbErr);
        }

        const res = await fetch(`api/projects.php?id=${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: state, thumbnail: thumbUrl })
        });
        if (!res.ok) throw new Error(res.status);
        setStatus(`✓ Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch (err) {
        setStatus('✓ Saved locally');
      }
    };

    this.store.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(save, 800);
    });
  }

  /**
   * Initializes header buttons, dropdowns, and quick actions.
   */
  initHeader() {
    // Project Name edit
    const titleInput = document.getElementById('project-name-input');
    if (titleInput) {
      titleInput.value = this.store.getState().projectName;
      titleInput.oninput = (e) => {
        this.store.update(state => state.projectName = e.target.value);
      };
    }

    // Modal Triggers
    document.getElementById('btn-open-templates')?.addEventListener('click', () => this.templateModal.open());
    document.getElementById('btn-add-shape')?.addEventListener('click', () => this.shapeModal.open());

    // Upload Trigger
    document.getElementById('btn-quick-upload')?.addEventListener('click', () => {
      this.store.setActiveElement('device');
      this.renderer.openFilePicker();
    });

    // Undo / Redo buttons (greyed out when there is nothing to undo / redo)
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    undoBtn.addEventListener('click', () => this.store.undo());
    redoBtn.addEventListener('click', () => this.store.redo());

    // Export menu: one button, choose current screen (PNG / JPEG) or all screens
    const exportMenu = document.getElementById('export-menu');
    const exportBtn = document.getElementById('export-menu-btn');
    exportMenu.querySelectorAll('[data-export]').forEach(item => {
      item.addEventListener('click', async () => {
        exportMenu.open = false;
        const kind = item.dataset.export;
        if (kind === 'png' || kind === 'jpg') return this.exporter.exportCurrentScreen(kind === 'jpg' ? 'image/jpeg' : 'image/png');

        exportBtn.textContent = '⏳ Exporting…';
        exportMenu.classList.add('busy');
        try {
          if (kind === 'feature') await this.exporter.exportFeatureGraphic();
          else if (kind === 'all-langs') await this.exporter.exportAllLanguages();
          else await this.exporter.exportAllScreens();
        } finally {
          exportBtn.textContent = '⬇ Export ▾';
          exportMenu.classList.remove('busy');
        }
      });
    });
    // Close the menu on outside click
    document.addEventListener('click', (e) => {
      if (exportMenu.open && !exportMenu.contains(e.target)) exportMenu.open = false;
    });

    // Settings dialog: preview language + interface theme
    const settingsDialog = document.getElementById('settings-dialog');
    document.getElementById('btn-settings').addEventListener('click', () => settingsDialog.showModal());
    // Click on the backdrop closes it
    settingsDialog.addEventListener('click', (e) => { if (e.target === settingsDialog) settingsDialog.close(); });

    // Language copy switcher (canvas toolbar) lists the project's copies
    const langSelects = [document.getElementById('lang-switch')].filter(Boolean);
    const fillLangSelects = (state) => {
      const options = state.languages.map(code => {
        const l = SUPPORTED_LANGUAGES.find(x => x.code === code);
        return `<option value="${code}">${l ? `${l.flag} ${l.name.split(' ')[0]}` : code}</option>`;
      }).join('') + '<option value="__add">＋ Add language…</option>';
      langSelects.forEach(sel => {
        if (sel.innerHTML !== options) sel.innerHTML = options;
        sel.value = state.activeLanguage;
      });
    };
    langSelects.forEach(sel => {
      sel.onchange = () => {
        if (sel.value === '__add') {
          sel.value = this.store.getState().activeLanguage;
          this.leftDrawer.openTab('translate');
        } else {
          this.store.switchLanguage(sel.value);
        }
      };
    });
    fillLangSelects(this.store.getState());

    const themeSelect = document.getElementById('settings-theme-select');
    themeSelect.innerHTML = STUDIO_THEMES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('');
    themeSelect.value = themeManager.getCurrentStudioTheme().id;
    themeSelect.onchange = () => themeManager.applyStudioTheme(themeSelect.value);

    this.initAiSettings();

    // Reactive header state
    this.store.subscribe((state) => {
      undoBtn.disabled = !this.store.history.length;
      redoBtn.disabled = !this.store.future.length;
      document.getElementById('export-all-count').textContent = state.screens.length;
      document.getElementById('export-langs-count').textContent = state.languages.length;
      fillLangSelects(state);
      if (document.activeElement !== titleInput && titleInput.value !== state.projectName) titleInput.value = state.projectName;
    });
    undoBtn.disabled = redoBtn.disabled = true;
  }

  /**
   * Settings → AI translation: pick a provider, paste a key, verify it with the provider.
   * Only verified keys are saved (in this browser); the verified key's models fill the model list.
   */
  initAiSettings() {
    const $ = (id) => document.getElementById(id);
    const providerSel = $('ai-provider'), keyInput = $('ai-key'), verifyBtn = $('ai-verify');
    const modelGroup = $('ai-model-group'), modelSel = $('ai-model'), status = $('ai-status'), removeBtn = $('ai-remove');
    const setStatus = (text, kind = '') => { status.textContent = text; status.dataset.kind = kind; };

    const show = () => {
      const s = getAiSettings();
      const p = AI_PROVIDERS[s.provider];
      providerSel.value = s.provider;
      keyInput.value = s.keys[s.provider] || '';
      $('ai-key-hint').textContent = p.keyHint;
      const models = s.modelLists?.[s.provider] || [];
      modelSel.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
      modelSel.value = s.models[s.provider] || '';
      modelGroup.classList.toggle('hidden', !models.length);
      removeBtn.classList.toggle('hidden', !s.keys[s.provider]);
      if (isAiReady()) setStatus(`✓ ${p.name} key verified`, 'ok');
      else setStatus('');
    };

    providerSel.onchange = () => {
      saveAiSettings({ ...getAiSettings(), provider: providerSel.value });
      show();
    };
    modelSel.onchange = () => {
      const s = getAiSettings();
      saveAiSettings({ ...s, models: { ...s.models, [s.provider]: modelSel.value } });
    };
    keyInput.oninput = () => setStatus(keyInput.value ? 'Click Verify to check and save this key.' : '');
    keyInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); verifyBtn.click(); } };

    verifyBtn.onclick = async () => {
      const key = keyInput.value.trim();
      const s = getAiSettings();
      if (!key) return setStatus('Paste an API key first.', 'error');
      verifyBtn.disabled = true;
      setStatus(`Checking with ${AI_PROVIDERS[s.provider].name}…`);
      try {
        const { models, model } = await verifyApiKey(s.provider, key);
        saveAiSettings({
          ...s,
          keys: { ...s.keys, [s.provider]: key },
          models: { ...s.models, [s.provider]: model },
          modelLists: { ...s.modelLists, [s.provider]: models }
        });
        show();
        this.leftDrawer.requestRender();
      } catch (err) {
        setStatus(`✗ ${err.message}`, 'error');
      } finally {
        verifyBtn.disabled = false;
      }
    };

    removeBtn.onclick = () => {
      const s = getAiSettings();
      const drop = (o) => { const c = { ...o }; delete c[s.provider]; return c; };
      saveAiSettings({ ...s, keys: drop(s.keys), models: drop(s.models), modelLists: drop(s.modelLists || {}) });
      show();
      this.leftDrawer.requestRender();
    };

    // Refresh whenever the dialog opens; the Languages tab re-checks readiness when it closes
    $('btn-settings').addEventListener('click', show);
    $('settings-dialog').addEventListener('close', () => this.leftDrawer.requestRender());
    this.openSettings = () => { show(); $('settings-dialog').showModal(); keyInput.focus(); };
    this.leftDrawer.onOpenSettings = () => this.openSettings();
  }

  /**
   * Initializes canvas viewport zoom and centering.
   */
  initZoomControls() {
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomFitBtn = document.getElementById('btn-zoom-fit');
    const stageWrapper = document.getElementById('canvas-stage-wrapper');

    zoomInBtn?.addEventListener('click', () => {
      this.currentZoom = Math.min(2.5, Math.round((this.currentZoom + 0.05) * 100) / 100);
      this.updateZoomDisplay();
      this.persistUiState();
    });

    zoomOutBtn?.addEventListener('click', () => {
      this.currentZoom = Math.max(0.2, Math.round((this.currentZoom - 0.05) * 100) / 100);
      this.updateZoomDisplay();
      this.persistUiState();
    });

    zoomFitBtn?.addEventListener('click', () => {
      this.zoomFit();
    });

    // Mouse wheel zoom inside stage wrapper
    stageWrapper?.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        this.currentZoom = Math.max(0.2, Math.min(2.5, Math.round((this.currentZoom + delta) * 100) / 100));
        this.updateZoomDisplay();
        this.persistUiState();
      }
    }, { passive: false });

    // Recalculate zoom layout dimensions on window resize
    window.addEventListener('resize', () => {
      this.updateZoomDisplay();
    });

    // Observe size changes of the stage wrapper (e.g. left drawer expand/collapse)
    if (stageWrapper && window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        this.updateZoomDisplay();
      });
      ro.observe(stageWrapper);
    }
  }

  /**
   * Fits the active document completely into the visible viewport stage with comfortable margins.
   */
  zoomFit() {
    this.currentZoom = 1.0;
    this.updateZoomDisplay(true);
    const stage = document.getElementById('canvas-stage-wrapper');
    if (stage) {
      stage.scrollTop = 0;
      stage.scrollLeft = 0;
    }
    this.persistUiState();
  }

  /**
   * "All Screens" toggle: swaps the single-screen stage for a side-by-side view of every screen.
   */
  initOverview() {
    this.overview = new OverviewPanel(document.getElementById('overview-container'), this.store, this.exporter);
    const btn = document.getElementById('btn-toggle-overview');
    const toggled = ['canvas-stage-wrapper', 'canvas-zoom-group', 'viewport-hint', 'overview-size']
      .map(id => document.getElementById(id));

    const container = document.getElementById('overview-container');
    const range = document.getElementById('overview-size-range');
    // Size previews so every screen fits side by side in the visible area
    const fitAll = () => {
      const { screens, width, height } = this.store.getState();
      const perScreenW = (container.clientWidth - 64 - 24 * (screens.length - 1)) / screens.length;
      const maxH = container.clientHeight - 64 - 32; // padding + label row
      const h = Math.max(160, Math.floor(Math.min(maxH, perScreenW * height / width)));
      this.overview.setThumbHeight(h);
      range.value = h;
    };

    const setOpen = (open) => {
      toggled.forEach(el => el.classList.toggle('hidden', el.id === 'overview-size' ? !open : open));
      if (open) {
        this.overview.open();
        fitAll();
      } else {
        this.overview.close();
        this.updateZoomDisplay();
      }
      btn.classList.toggle('btn-primary', open);
      btn.innerHTML = open
        ? '<span class="material-symbols-outlined" style="font-size:15px; vertical-align:middle; margin-right:4px;">edit</span>Edit Screen'
        : '<span class="material-symbols-outlined" style="font-size:15px; vertical-align:middle; margin-right:4px;">grid_view</span>All Screens';
    };

    btn.addEventListener('click', () => setOpen(!this.overview.isOpen));
    this.overview.onSelectScreen = () => setOpen(false);
    range.addEventListener('input', (e) => {
      this.overview.setThumbHeight(Number(e.target.value));
    });
  }

  /**
   * Updates the on-screen display dimensions of the canvas according to the active zoom level.
   * Ensures the canvas remains centered when smaller than the viewport, and fully scrollable
   * without top clipping when zoomed in beyond 100%.
   * @param {boolean} force Force re-apply even if target dimensions match last applied
   */
  updateZoomDisplay(force = false) {
    const label = document.getElementById('zoom-level-text');
    if (label) label.textContent = `${Math.round(this.currentZoom * 100)}%`;

    if (!this.canvas) return;

    try {
      const stage = document.getElementById('canvas-stage-wrapper');
      if (!stage) return;

      const state = this.store?.getState();
      const screen = this.store?.getActiveScreen();
      const dimensions = (screen && state) ? docSize(state, screen) : null;
      const docW = dimensions?.width || this.canvas.width || 1080;
      const docH = dimensions?.height || this.canvas.height || 1920;

      // Account for stage padding (40px all around = 80px horizontal & vertical)
      const padX = 80;
      const padY = 80;
      const rawW = stage.clientWidth > 0 ? stage.clientWidth : (window.innerWidth - 300);
      const rawH = stage.clientHeight > 0 ? stage.clientHeight : (window.innerHeight - 250);
      const availW = Math.max(120, rawW - padX);
      const availH = Math.max(120, rawH - padY);

      // Fit scale matches viewport dimensions with breathing room
      const baseScale = Math.min(availW / docW, availH / docH);
      const targetW = Math.round(docW * baseScale * this.currentZoom);
      const targetH = Math.round(docH * baseScale * this.currentZoom);

      if (force || targetW !== this.lastAppliedW || targetH !== this.lastAppliedH) {
        const prevScrollTop = stage.scrollTop;
        const prevScrollLeft = stage.scrollLeft;
        const prevScrollHeight = stage.scrollHeight;
        const prevScrollWidth = stage.scrollWidth;

        this.lastAppliedW = targetW;
        this.lastAppliedH = targetH;
        this.canvas.style.width = `${targetW}px`;
        this.canvas.style.height = `${targetH}px`;
        this.canvas.style.transform = '';

        if (!force) {
          if (prevScrollTop > 0 && prevScrollHeight > stage.clientHeight) {
            const ratioY = (prevScrollTop + stage.clientHeight / 2) / prevScrollHeight;
            stage.scrollTop = Math.max(0, ratioY * stage.scrollHeight - stage.clientHeight / 2);
          }
          if (prevScrollLeft > 0 && prevScrollWidth > stage.clientWidth) {
            const ratioX = (prevScrollLeft + stage.clientWidth / 2) / prevScrollWidth;
            stage.scrollLeft = Math.max(0, ratioX * stage.scrollWidth - stage.clientWidth / 2);
          }
        } else {
          stage.scrollTop = 0;
          stage.scrollLeft = 0;
        }
      }
    } catch (err) {
      console.error('Failed to update zoom display:', err);
    }
  }

  /**
   * Initializes context menu event delegates across canvas, stage, filmstrip, and layers.
   */
  initContextMenuHandlers() {
    // 1. Canvas & Stage right-click
    this.renderer.onContextMenu = ({ clientX, clientY, elementId, screen }) => {
      if (elementId) {
        const items = buildElementContextMenuItems({
          store: this.store,
          elementId,
          screen,
          renderer: this.renderer
        });
        this.contextMenu.show(clientX, clientY, items);
      } else {
        const items = buildCanvasContextMenuItems({
          store: this.store,
          screen,
          onFitZoom: () => this.zoomFit(),
          onUndo: () => this.store.undo(),
          onRedo: () => this.store.redo()
        });
        this.contextMenu.show(clientX, clientY, items);
      }
    };

    // 2. Bottom Filmstrip thumbnail cards right-click
    this.screenSelector.onCardContextMenu = ({ clientX, clientY, screen, totalScreens }) => {
      const items = buildScreenCardContextMenuItems({
        store: this.store,
        screen,
        totalScreens
      });
      this.contextMenu.show(clientX, clientY, items);
    };

    // 3. Left drawer layers right-click
    this.leftDrawer.onLayerContextMenu = ({ clientX, clientY, elementId, screen }) => {
      const items = buildElementContextMenuItems({
        store: this.store,
        elementId,
        screen,
        renderer: this.renderer
      });
      this.contextMenu.show(clientX, clientY, items);
    };
  }

  /**
   * Global keyboard shortcuts (Undo, Redo, Duplicate, Delete, Layer Ordering, Escape).
   */
  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't intercept when typing in inputs/textareas
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }

      // Undo: Ctrl/Cmd + Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.store.undo();
        return;
      }

      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        this.store.redo();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const state = this.store.getState();
        const activeId = state.activeElementId;
        if (activeId) {
          duplicateElement(this.store, activeId);
        } else if (state.activeScreenId && state.activeScreenId !== FEATURE_ID) {
          this.store.duplicateScreen(state.activeScreenId);
        }
        return;
      }

      // Layer Order: Bring Forward (Ctrl/Cmd + ]) / Bring to Front (Ctrl/Cmd + Shift + ])
      if ((e.ctrlKey || e.metaKey) && e.key === ']') {
        e.preventDefault();
        const activeId = this.store.getState().activeElementId;
        if (activeId) {
          reorderLayer(this.store, activeId, e.shiftKey ? 'front' : 'forward');
        }
        return;
      }

      // Layer Order: Send Backward (Ctrl/Cmd + [) / Send to Back (Ctrl/Cmd + Shift + [)
      if ((e.ctrlKey || e.metaKey) && e.key === '[') {
        e.preventDefault();
        const activeId = this.store.getState().activeElementId;
        if (activeId) {
          reorderLayer(this.store, activeId, e.shiftKey ? 'back' : 'backward');
        }
        return;
      }

      // Delete: Backspace or Delete key removes active item (device, headline, subtitle, text, shape)
      if (e.key === 'Backspace' || e.key === 'Delete') {
        const state = this.store.getState();
        const activeId = state.activeElementId;
        if (activeId && activeId !== 'showcase') {
          e.preventDefault();
          deleteElement(this.store, activeId);
        }
        return;
      }

      // Escape: Deselect & dismiss menus/modals
      if (e.key === 'Escape') {
        this.contextMenu.hide();
        this.store.setActiveElement(null);
        this.shapeModal.close();
        this.templateModal.close();
        const exp = document.getElementById('export-menu');
        if (exp) exp.open = false;
      }
    });
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.appStudio = new AppScreenStudio();
});
