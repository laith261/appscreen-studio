/**
 * App Screen Generator - Left Navigation Dock & Quick Drawer
 * Provides an uncluttered, step-by-step sidebar for Templates, Image Upload,
 * Typography, Translation, and Shapes.
 */

import { PLAY_STORE_TEMPLATES, DESIGN_IDEAS, applyTemplate, applyDesignIdea } from '../features/templates/templates.js';
import { getSavedDesigns, saveCurrentDesign, deleteSavedDesign, applyCustomDesign, generateDesignWireframeSvg } from '../features/templates/customDesigns.js';
import { SHAPE_DEFINITIONS, createShape } from '../features/shapes/shapeLibrary.js';
import { mountFontPicker } from './fontPicker.js';
import { TEXT_PRESETS } from '../features/text/fontManager.js';
import { SUPPORTED_LANGUAGES, AI_PROVIDERS, buildLanguageCopy, getAiSettings, isAiReady } from '../features/translation/translationService.js';
import { SOLID_PALETTES, LISTING_PALETTES, themeManager } from '../features/theme/themeManager.js';
import { getSavedColors, saveCurrentColors, deleteSavedColor, applyCustomColor } from '../features/theme/customColors.js';
import { processImageUpload, addImageItem } from '../canvas/imageUploader.js';
import { getLayerOrder, getLayerItem, isFixedLayer, ensureScreenDevices, getDevices } from '../state/layers.js';
import { guardedRender } from './renderGuard.js';
import { activeDoc, FEATURE_ID } from '../state/store.js';
import { docSize } from '../canvas/compose.js';
import { customAlert, customConfirm, customPrompt } from './dialog.js';

export class LeftDrawer {
  /**
   * @param {HTMLElement} dockContainer
   * @param {HTMLElement} drawerPanel
   * @param {Object} store
   * @param {Object} [initialUiState]
   */
  constructor(dockContainer, drawerPanel, store, initialUiState = {}) {
    this.dockContainer = dockContainer;
    this.drawerPanel = drawerPanel;
    this.store = store;
    this.activeTab = initialUiState.activeTab || 'templates';
    this.templateSubTab = initialUiState.templateSubTab || 'designs';
    this.themeSubTab = initialUiState.themeSubTab || 'presets';
    this.themeFilter = initialUiState.themeFilter || 'all';
    this.isOpen = initialUiState.isDrawerOpen !== undefined ? initialUiState.isDrawerOpen : true;
    this.onUiChange = null;

    this.init();
    if (!this.isOpen) {
      this.drawerPanel.classList.add('collapsed');
      this.dockContainer.querySelectorAll('.dock-tab-btn').forEach(b => b.classList.remove('active'));
    }
    this.requestRender = guardedRender(this.drawerPanel, () => this.renderDrawerContent());
    this.store.subscribe(() => this.onStoreUpdate());
  }

  init() {
    this.renderDock();
    this.renderDrawerContent();
  }

  onStoreUpdate() {
    // Tabs that show screen data follow every change (static lists like templates don't need to)
    if (!['templates', 'themes', 'shapes'].includes(this.activeTab)) {
      this.requestRender();
    }
  }

  /** Opens a drawer tab by id (same as clicking its dock button). */
  openTab(id) {
    if (this.activeTab === id && this.isOpen) return;
    [...this.dockContainer.querySelectorAll('.dock-tab-btn')].find(b => b.dataset.tab === id)?.click();
  }

  /**
   * Renders the slim vertical dock on the far left.
   */
  renderDock() {
    const tabs = [
      { id: 'templates', icon: 'auto_awesome_motion', label: 'Templates' },
      { id: 'themes', icon: 'palette', label: 'Themes' },
      { id: 'image', icon: 'cloud_upload', label: 'Upload' },
      { id: 'frame', icon: 'smartphone', label: 'Frame' },
      { id: 'text', icon: 'title', label: 'Text' },
      { id: 'shapes', icon: 'category', label: 'Shapes' },
      { id: 'layers', icon: 'layers', label: 'Layers' },
      { id: 'translate', icon: 'translate', label: 'Languages' }
    ];

    this.dockContainer.innerHTML = '';

    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = `dock-tab-btn ${this.activeTab === tab.id ? 'active' : ''}`;
      btn.title = tab.label;
      btn.dataset.tab = tab.id;
      btn.innerHTML = `
        <span class="dock-tab-icon material-symbols-outlined">${tab.icon}</span>
        <span class="dock-tab-label">${tab.label}</span>
      `;

      btn.onclick = () => {
        if (this.activeTab === tab.id && this.isOpen) {
          // Toggle drawer collapse if clicking active tab
          this.isOpen = false;
          this.drawerPanel.classList.add('collapsed');
          this.dockContainer.querySelectorAll('.dock-tab-btn').forEach(b => b.classList.remove('active'));
        } else {
          this.activeTab = tab.id;
          this.isOpen = true;
          this.drawerPanel.classList.remove('collapsed');
          this.dockContainer.querySelectorAll('.dock-tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.renderDrawerContent();
        }
        this.onUiChange?.();
      };

      this.dockContainer.appendChild(btn);
    });
  }

  /**
   * Renders the content of the currently active drawer tab.
   */
  renderDrawerContent() {
    this.drawerPanel.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'drawer-header';

    const titles = {
      templates: { title: 'Listing Templates', desc: 'Choose a ready-to-use Google Play style' },
      themes: { title: 'Color Palettes', desc: 'Restyle backgrounds, texts and badges' },
      image: { title: 'Upload Screenshot', desc: 'Add and position your app screenshot' },
      frame: { title: 'Phone Frame', desc: 'Device style and color' },
      text: { title: 'Text & Typography', desc: 'Text layers, styles, and fonts' },
      shapes: { title: 'Ready Shapes & Badges', desc: 'Add badges, stars, and decorative cards' },
      layers: { title: 'Layers', desc: 'Reorder, hide, lock, or delete items' },
      translate: { title: 'Languages', desc: 'A full copy of the project per language' }
    };

    const cur = titles[this.activeTab] || titles.templates;
    header.innerHTML = `
      <div>
        <h3 class="drawer-title">${cur.title}</h3>
        <p class="drawer-desc">${cur.desc}</p>
      </div>
      <button class="drawer-collapse-btn" title="Close Panel"><span class="material-symbols-outlined" style="font-size:16px;">close</span></button>
    `;

    header.querySelector('.drawer-collapse-btn').onclick = () => {
      this.isOpen = false;
      this.drawerPanel.classList.add('collapsed');
      this.dockContainer.querySelectorAll('.dock-tab-btn').forEach(b => b.classList.remove('active'));
      this.onUiChange?.();
    };

    this.drawerPanel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'drawer-body';

    switch (this.activeTab) {
      case 'templates':
        this.renderTemplatesTab(body);
        break;
      case 'themes':
        this.renderThemesTab(body);
        break;
      case 'image':
        this.renderImageTab(body);
        break;
      case 'frame':
        this.renderFrameTab(body);
        break;
      case 'text':
        this.renderTextTab(body);
        break;
      case 'shapes':
        this.renderShapesTab(body);
        break;
      case 'translate':
        this.renderTranslateTab(body);
        break;
      case 'layers':
        this.renderLayersTab(body);
        break;
    }

    this.drawerPanel.appendChild(body);
  }

  /**
   * Tab 1: Templates (Separate sub-tabs for Designs with vectors & Saved custom designs)
   */
  renderTemplatesTab(container) {
    container.innerHTML = '';

    const saved = getSavedDesigns();
    const subNav = document.createElement('div');
    subNav.className = 'template-subtabs-nav';
    subNav.innerHTML = `
      <button type="button" class="template-subtab-btn flex items-center justify-center gap-1.5 ${this.templateSubTab === 'designs' ? 'active' : ''}" data-subtab="designs">
        <span class="material-symbols-outlined" style="font-size:15px;">design_services</span> Designs
      </button>
      <button type="button" class="template-subtab-btn flex items-center justify-center gap-1.5 ${this.templateSubTab === 'saved' ? 'active' : ''}" data-subtab="saved">
        <span class="material-symbols-outlined" style="font-size:15px;">bookmark</span> Saved (${saved.length})
      </button>
    `;

    const contentWrap = document.createElement('div');
    contentWrap.className = 'template-subtab-content';

    const updateView = () => {
      contentWrap.innerHTML = '';
      if (this.templateSubTab === 'saved') {
        this.renderDrawerSavedDesigns(contentWrap);
      } else {
        this.renderDrawerDesigns(contentWrap);
      }
    };

    subNav.querySelectorAll('.template-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.templateSubTab = btn.dataset.subtab;
        subNav.querySelectorAll('.template-subtab-btn').forEach(b => b.classList.toggle('active', b === btn));
        updateView();
      };
    });

    container.appendChild(subNav);
    container.appendChild(contentWrap);
    updateView();
  }

  /**
   * Prompts the user to save the active screen layout as a reusable template.
   */
  async promptSaveCurrentDesign() {
    const defaultName = `My Layout ${getSavedDesigns().length + 1}`;
    const name = await customPrompt({
      title: 'Save Custom Design Template',
      message: 'Enter a name for this custom design template:',
      defaultValue: defaultName,
      icon: 'bookmark_add',
      confirmText: 'Save Template'
    });
    if (name === null) return;
    const result = saveCurrentDesign(this.store, name);
    if (result) {
      this.templateSubTab = 'saved';
      this.renderDrawerContent();
    }
  }

  /**
   * Renders the 4 Design Layout Ideas with vector previews in Left Drawer.
   */
  renderDrawerDesigns(container) {
    // Quick CTA to save current layout
    const ctaCard = document.createElement('div');
    ctaCard.className = 'save-design-cta-card';
    ctaCard.innerHTML = `
      <div class="save-design-cta-header">
        <span class="material-symbols-outlined" style="font-size:16px;">bookmark</span>
        <span>Save Active Layout</span>
      </div>
      <div class="save-design-cta-desc">
        Save your custom phone angle, fonts, badges, and colors as a reusable template.
      </div>
      <button class="btn btn-primary btn-xs w-full btn-save-current-design flex items-center justify-center gap-1">
        <span class="material-symbols-outlined" style="font-size:14px;">bookmark_add</span> Save Current Screen as Template
      </button>
    `;
    ctaCard.querySelector('.btn-save-current-design').onclick = () => {
      this.promptSaveCurrentDesign();
    };
    container.appendChild(ctaCard);

    const list = document.createElement('div');
    list.className = 'clean-card-list';

    DESIGN_IDEAS.forEach(idea => {
      const card = document.createElement('div');
      card.className = 'template-mini-card';

      card.innerHTML = `
        <div class="design-mini-vector-banner">
          <span class="template-tag">${idea.badge}</span>
          <div class="design-mini-vector-wrap">
            ${idea.vectorSvg}
          </div>
        </div>
        <div class="template-mini-info">
          <h4>${idea.name}</h4>
          <p>${idea.tagline}</p>
          <div class="template-quick-actions">
            <button class="btn btn-primary btn-xs btn-apply-idea">Apply to Screen</button>
            <button class="btn btn-outline btn-xs btn-apply-all-ideas">Load All 4 Ideas</button>
          </div>
        </div>
      `;

      card.querySelector('.btn-apply-idea').onclick = () => {
        applyDesignIdea(this.store, idea.id, false);
      };

      card.querySelector('.btn-apply-all-ideas').onclick = () => {
        applyDesignIdea(this.store, idea.id, true);
      };

      list.appendChild(card);
    });

    container.appendChild(list);
  }

  /**
   * Renders user's saved custom design templates in Left Drawer.
   */
  renderDrawerSavedDesigns(container) {
    const wrap = document.createElement('div');

    // Quick CTA to save current layout
    const topBar = document.createElement('div');
    topBar.className = 'save-design-cta-card';
    topBar.innerHTML = `
      <div class="save-design-cta-header">
        <span class="material-symbols-outlined" style="font-size:16px;">auto_awesome</span>
        <span>Create New Template</span>
      </div>
      <div class="save-design-cta-desc">
        Saves device position, text offsets, fonts, badges, and background into a reusable template.
      </div>
      <button class="btn btn-primary btn-xs w-full btn-save-now flex items-center justify-center gap-1">
        <span class="material-symbols-outlined" style="font-size:14px;">bookmark_add</span> Save Current Screen as Template
      </button>
    `;
    topBar.querySelector('.btn-save-now').onclick = () => {
      this.promptSaveCurrentDesign();
    };
    wrap.appendChild(topBar);

    const saved = getSavedDesigns();

    if (saved.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'saved-designs-empty';
      empty.innerHTML = `
        <div class="saved-designs-empty-icon"><span class="material-symbols-outlined" style="font-size:40px; color:#475569;">folder_open</span></div>
        <h4>No Saved Designs Yet</h4>
        <p>Customize your active screen (fonts, phone angles, shapes, colors) and click above to save it as a reusable template.</p>
      `;
      wrap.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'clean-card-list';

      saved.forEach(design => {
        const card = document.createElement('div');
        card.className = 'template-mini-card saved-design-card';

        const svgContent = design.vectorSvg || generateDesignWireframeSvg(design.layout);

        card.innerHTML = `
          <div class="saved-card-header">
            <span class="saved-card-badge">Custom</span>
            <button class="btn-delete-saved-design" title="Delete Template"><span class="material-symbols-outlined" style="font-size:16px;">delete</span></button>
          </div>
          <div class="design-mini-vector-banner" style="height: 110px;">
            <div class="design-mini-vector-wrap">
              ${svgContent}
            </div>
          </div>
          <div class="template-mini-info">
            <h4>${design.name}</h4>
            <p>${design.tagline || 'Custom saved layout'}</p>
            <div class="template-quick-actions">
              <button class="btn btn-primary btn-xs btn-apply-saved">Apply to Screen</button>
              <button class="btn btn-outline btn-xs btn-apply-saved-all">All Screens</button>
            </div>
          </div>
        `;

        card.querySelector('.btn-apply-saved').onclick = () => {
          applyCustomDesign(this.store, design.id, false);
        };

        card.querySelector('.btn-apply-saved-all').onclick = async () => {
          const confirmed = await customConfirm({
            title: 'Apply to All Screens',
            message: `Apply "${design.name}" across all screens in the project?`,
            confirmText: 'Apply to All',
            icon: 'palette'
          });
          if (confirmed) {
            applyCustomDesign(this.store, design.id, true);
          }
        };

        card.querySelector('.btn-delete-saved-design').onclick = async (e) => {
          e.stopPropagation();
          const confirmed = await customConfirm({
            title: 'Delete Saved Template',
            message: `Delete the saved template "${design.name}"? This action cannot be undone.`,
            confirmText: 'Delete Template',
            isDanger: true,
            icon: 'delete'
          });
          if (confirmed) {
            deleteSavedDesign(design.id);
            this.renderDrawerContent();
          }
        };

        list.appendChild(card);
      });

      wrap.appendChild(list);
    }

    container.appendChild(wrap);
  }

  /**
   * Prompts the user to save current colors as a reusable palette.
   */
  async promptSaveCurrentColors() {
    const count = getSavedColors().length + 1;
    const name = await customPrompt({
      title: 'Save Custom Palette',
      message: 'Enter a name for this custom color palette:',
      defaultValue: `My Palette ${count}`,
      icon: 'palette',
      confirmText: 'Save Palette'
    });
    if (name === null) return;
    const result = saveCurrentColors(this.store, name);
    if (result) {
      this.themeSubTab = 'saved';
      this.renderDrawerContent();
    }
  }

  /**
   * Tab: Listing Color Palettes (Solid, Gradient & Saved Custom Palettes)
   */
  renderThemesTab(container) {
    const wrap = document.createElement('div');
    wrap.className = 'drawer-section';

    const saved = getSavedColors();

    wrap.innerHTML = `
      <!-- Quick CTA to save current colors -->
      <div class="save-design-cta-card mb-3">
        <div class="save-design-cta-header">
          <span class="material-symbols-outlined" style="font-size:16px;">palette</span>
          <span>Save Active Colors</span>
        </div>
        <div class="save-design-cta-desc">
          Save your current background color (solid or gradient), text colors, and badge accents as a reusable palette.
        </div>
        <button class="btn btn-primary btn-xs w-full btn-save-current-colors flex items-center justify-center gap-1">
          <span class="material-symbols-outlined" style="font-size:14px;">bookmark_add</span> Save Current Colors as Palette
        </button>
      </div>

      <!-- Themes Subtabs -->
      <div class="template-subtabs-nav mb-3">
        <button type="button" class="template-subtab-btn flex items-center justify-center gap-1.5 ${this.themeSubTab === 'presets' ? 'active' : ''}" data-theme-subtab="presets">
          <span class="material-symbols-outlined" style="font-size:15px;">palette</span> Ready Palettes
        </button>
        <button type="button" class="template-subtab-btn flex items-center justify-center gap-1.5 ${this.themeSubTab === 'saved' ? 'active' : ''}" data-theme-subtab="saved">
          <span class="material-symbols-outlined" style="font-size:15px;">bookmark</span> Saved (${saved.length})
        </button>
      </div>

      <div id="themes-tab-body"></div>
    `;

    wrap.querySelector('.btn-save-current-colors').onclick = () => {
      this.promptSaveCurrentColors();
    };

    const subNavBtns = wrap.querySelectorAll('[data-theme-subtab]');
    subNavBtns.forEach(btn => {
      btn.onclick = () => {
        this.themeSubTab = btn.dataset.themeSubtab;
        subNavBtns.forEach(b => b.classList.toggle('active', b === btn));
        renderThemeContent();
      };
    });

    const themeBody = wrap.querySelector('#themes-tab-body');

    const renderThemeContent = () => {
      themeBody.innerHTML = '';
      if (this.themeSubTab === 'saved') {
        this.renderSavedThemes(themeBody);
      } else {
        this.renderPresetThemes(themeBody);
      }
    };

    container.appendChild(wrap);
    renderThemeContent();
  }

  /**
   * Renders ready curated palettes with Solid vs Gradient filtering.
   */
  renderPresetThemes(container) {
    const wrap = document.createElement('div');

    // Filter pills: All | Solid Colors | Gradients
    const filterRow = document.createElement('div');
    filterRow.className = 'button-toggle-group mb-3';
    filterRow.innerHTML = `
      <button type="button" class="toggle-btn text-[11px] py-1 ${this.themeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button type="button" class="toggle-btn text-[11px] py-1 ${this.themeFilter === 'solid' ? 'active' : ''}" data-filter="solid"><span class="material-symbols-outlined" style="font-size:13px; vertical-align:middle; margin-right:2px;">crop_square</span>Solid (${SOLID_PALETTES.length})</button>
      <button type="button" class="toggle-btn text-[11px] py-1 ${this.themeFilter === 'gradient' ? 'active' : ''}" data-filter="gradient"><span class="material-symbols-outlined" style="font-size:13px; vertical-align:middle; margin-right:2px;">gradient</span>Gradient (${LISTING_PALETTES.length})</button>
    `;

    filterRow.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.onclick = () => {
        this.themeFilter = btn.dataset.filter;
        this.renderPresetThemes(container);
        this.onUiChange?.();
      };
    });

    wrap.appendChild(filterRow);

    const list = document.createElement('div');
    list.className = 'clean-card-list';

    let palettesToShow = [];
    if (this.themeFilter === 'solid') {
      palettesToShow = SOLID_PALETTES;
    } else if (this.themeFilter === 'gradient') {
      palettesToShow = LISTING_PALETTES;
    } else {
      palettesToShow = [...SOLID_PALETTES, ...LISTING_PALETTES];
    }

    palettesToShow.forEach(p => {
      const card = document.createElement('div');
      card.className = 'template-mini-card';
      const isSolid = p.type === 'solid';

      card.innerHTML = `
        <div class="template-mini-banner" style="background: ${p.previewGradient}">
          <span class="template-tag">${p.name}</span>
          <span class="template-tag" style="float: right; opacity: 0.85;">${isSolid ? 'Solid' : 'Gradient'}</span>
        </div>
        <div class="template-mini-info">
          <h4>${p.name}</h4>
          <p>${isSolid ? `Solid background: ${p.solidColor}` : 'Gradient & accents'}</p>
          <div class="template-quick-actions mt-2">
            <button class="btn btn-outline btn-xs apply-palette-single" data-palette="${p.id}">
              This Screen
            </button>
            <button class="btn btn-primary btn-xs apply-palette-all" data-palette="${p.id}">
              All Screens
            </button>
          </div>
        </div>
      `;

      card.querySelector('.apply-palette-single').onclick = () => {
        themeManager.applyListingPalette(this.store, p.id, false);
      };

      card.querySelector('.apply-palette-all').onclick = () => {
        themeManager.applyListingPalette(this.store, p.id, true);
      };

      list.appendChild(card);
    });

    wrap.appendChild(list);
    container.innerHTML = '';
    container.appendChild(wrap);
  }

  /**
   * Renders saved custom color palettes.
   */
  renderSavedThemes(container) {
    const saved = getSavedColors();
    if (saved.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'saved-designs-empty';
      empty.innerHTML = `
        <div class="saved-designs-empty-icon"><span class="material-symbols-outlined" style="font-size:40px; color:#475569;">palette</span></div>
        <h4>No Saved Color Palettes</h4>
        <p>Style your screen background (solid or gradient), text colors, and badge colors, then click above to save them as a reusable palette.</p>
      `;
      container.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'clean-card-list';

    saved.forEach(pal => {
      const card = document.createElement('div');
      card.className = 'template-mini-card saved-design-card';
      card.innerHTML = `
        <div class="saved-card-header">
          <span class="saved-card-badge">${pal.badge || (pal.type === 'solid' ? 'Solid' : 'Gradient')}</span>
          <button class="btn-delete-saved-design" title="Delete Palette"><span class="material-symbols-outlined" style="font-size:16px;">delete</span></button>
        </div>
        <div class="template-mini-banner" style="background: ${pal.previewGradient}; height: 50px; border-radius: 6px; margin: 4px 8px;">
          <div style="display:flex; align-items:center; gap:6px; padding: 4px 8px;">
            <span style="font-size: 11px; font-weight: 700; color: ${pal.headlineColor};">Title</span>
            <span style="font-size: 10px; color: ${pal.subtitleColor};">Text</span>
            <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${pal.badgeFill}; margin-left:auto;"></span>
          </div>
        </div>
        <div class="template-mini-info">
          <h4>${pal.name}</h4>
          <p>${pal.tagline || (pal.type === 'solid' ? 'Solid color' : 'Gradient')}</p>
          <div class="template-quick-actions mt-2">
            <button class="btn btn-outline btn-xs apply-saved-pal-single">
              This Screen
            </button>
            <button class="btn btn-primary btn-xs apply-saved-pal-all">
              All Screens
            </button>
          </div>
        </div>
      `;

      card.querySelector('.apply-saved-pal-single').onclick = () => {
        applyCustomColor(this.store, pal.id, false);
      };

      card.querySelector('.apply-saved-pal-all').onclick = async () => {
        const confirmed = await customConfirm({
          title: 'Apply Palette to All Screens',
          message: `Apply palette "${pal.name}" across all screens?`,
          confirmText: 'Apply to All',
          icon: 'palette'
        });
        if (confirmed) {
          applyCustomColor(this.store, pal.id, true);
        }
      };

      card.querySelector('.btn-delete-saved-design').onclick = async (e) => {
        e.stopPropagation();
        const confirmed = await customConfirm({
          title: 'Delete Color Palette',
          message: `Delete saved color palette "${pal.name}"? This action cannot be undone.`,
          confirmText: 'Delete Palette',
          isDanger: true,
          icon: 'delete'
        });
        if (confirmed) {
          deleteSavedColor(pal.id);
          this.renderDrawerContent();
        }
      };

      list.appendChild(card);
    });

    container.appendChild(list);
  }

  /**
   * Tab 2: Upload Screenshot & Device Frame
   */
  renderImageTab(container) {
    const screen = this.store.getActiveScreen();
    const isFeature = screen?.id === FEATURE_ID;
    const dev = screen?.device || {};

    const wrap = document.createElement('div');
    wrap.className = 'drawer-section';

    wrap.innerHTML = `
      <input type="file" id="drawer-file-input" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden" />

      ${isFeature ? `
        <!-- Feature Graphic Dedicated Image & Logo Uploader -->
        <div class="mb-4 p-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="material-symbols-outlined text-indigo-400" style="font-size:20px;">featured_video</span>
            <h4 class="text-sm font-bold text-slate-100 mb-0">Feature Graphic (1024 × 500)</h4>
          </div>
          <p class="text-xs text-slate-300 mb-3">Add logos, app icons, 3D badges, or hero graphics directly to this banner.</p>

          <label class="flex items-center gap-2 text-xs text-slate-200 font-semibold mb-3 cursor-pointer select-none bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
            <input type="checkbox" id="feature-add-image-remove-bg" checked />
            <span class="material-symbols-outlined text-indigo-400" style="font-size:16px;">auto_fix_high</span>
            <span>Remove background automatically</span>
          </label>

          <input type="file" id="drawer-feature-image-file" accept="image/*" class="hidden" />
          <button type="button" class="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5 py-2 font-bold" id="drawer-feature-add-image">
            <span class="material-symbols-outlined" style="font-size:16px;">add_photo_alternate</span> Add Image / Logo to Banner
          </button>
        </div>

        <div class="mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Phone Mockup Screenshot (Optional)
        </div>
      ` : ''}

      ${dev.image ? `
        <!-- Active Upload Preview Card -->
        <div class="uploaded-image-card mb-3 p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center gap-3">
          <img src="${dev.image}" alt="Preview" style="width: 52px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 12px rgba(0,0,0,0.25);" />
          <div class="flex-1 min-w-0">
            <div class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-emerald-400" style="font-size:16px;">check</span> Screenshot Loaded
            </div>
            <div class="text-[11px] text-slate-400 mt-0.5">Visible inside phone mockup</div>
            <div class="flex gap-2 mt-2">
              <button class="btn btn-primary btn-xs" id="drawer-btn-change-upload">Change</button>
              <button class="btn btn-outline btn-xs text-rose-400" id="drawer-remove-img">Remove</button>
            </div>
          </div>
        </div>

        <!-- Image Fit & Adjustment Controls -->
        <div class="form-group mb-3">
          <label class="form-label mb-1.5">Screenshot Fit Mode</label>
          <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-outline btn-xs ${(!dev.imageFit || dev.imageFit === 'cover') ? 'btn-primary' : ''}" data-image-fit="cover">
              Fill Screen
            </button>
            <button class="btn btn-outline btn-xs ${dev.imageFit === 'contain' ? 'btn-primary' : ''}" data-image-fit="contain">
              Fit Whole
            </button>
          </div>
        </div>

        <div class="form-group mb-3">
          <div class="flex justify-between items-center mb-1">
            <label class="form-label mb-0">Screenshot Zoom</label>
            <span class="text-xs text-slate-400">${Math.round((dev.imageScale || 1) * 100)}%</span>
          </div>
          <input type="range" class="form-range" id="drawer-image-scale" min="0.5" max="1.5" step="0.02" value="${dev.imageScale || 1}" />
        </div>

        <div class="form-group mb-4">
          <div class="flex justify-between items-center mb-1">
            <label class="form-label mb-0">Vertical Position</label>
            <span class="text-xs text-slate-400">${dev.imageOffsetY || 0}px</span>
          </div>
          <input type="range" class="form-range" id="drawer-image-offset-y" min="-250" max="250" step="5" value="${dev.imageOffsetY || 0}" />
        </div>
      ` : `
        <!-- Big Friendly Upload Box -->
        <div class="primary-upload-zone cursor-pointer" id="primary-upload-drop" title="Click or drop screenshot here">
          <div class="upload-icon"><span class="material-symbols-outlined" style="font-size:42px; color:#64748b;">cloud_upload</span></div>
          <h4 class="upload-title">Drop screenshot here</h4>
          <p class="upload-sub">or click to browse from device</p>
          <button type="button" class="btn btn-primary btn-sm mt-3" id="drawer-btn-upload">Browse Image</button>
        </div>
      `}

      <label class="flex items-center gap-2 text-xs text-slate-300 mt-2 cursor-pointer select-none px-1">
        <input type="checkbox" id="drawer-upload-remove-bg" />
        <span class="material-symbols-outlined text-indigo-400" style="font-size:15px;">auto_fix_high</span>
        <span>Remove screenshot background</span>
      </label>
    `;

    // Feature graphic image uploader wiring
    const featureImgInput = wrap.querySelector('#drawer-feature-image-file');
    const featureAddBtn = wrap.querySelector('#drawer-feature-add-image');
    if (featureAddBtn && featureImgInput) {
      featureAddBtn.onclick = () => featureImgInput.click();
      featureImgInput.onchange = async () => {
        if (featureImgInput.files && featureImgInput.files[0]) {
          const removeBg = wrap.querySelector('#feature-add-image-remove-bg')?.checked ?? true;
          await addImageItem(featureImgInput.files[0], this.store, { removeBackground: removeBg });
          featureImgInput.value = '';
          this.renderDrawerContent();
        }
      };
    }

    // File Input & Upload Wiring
    const fileInput = wrap.querySelector('#drawer-file-input');
    const uploadBtn = wrap.querySelector('#drawer-btn-upload');
    const dropZone = wrap.querySelector('#primary-upload-drop');
    const changeBtn = wrap.querySelector('#drawer-btn-change-upload');

    if (uploadBtn) {
      uploadBtn.onclick = (e) => {
        e.stopPropagation();
        fileInput.click();
      };
    }

    if (dropZone) {
      dropZone.onclick = () => fileInput.click();

      ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.add('border-primary');
        });
      });

      ['dragleave', 'dragend'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropZone.classList.remove('border-primary');
        });
      });

      dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-primary');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          const removeBg = wrap.querySelector('#drawer-upload-remove-bg')?.checked || false;
          await processImageUpload(e.dataTransfer.files[0], this.store, null, { removeBackground: removeBg });
          this.renderDrawerContent();
        }
      });
    }

    if (changeBtn) {
      changeBtn.onclick = (e) => {
        e.stopPropagation();
        fileInput.click();
      };
    }

    fileInput.onchange = async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const removeBg = wrap.querySelector('#drawer-upload-remove-bg')?.checked || false;
        await processImageUpload(file, this.store, null, { removeBackground: removeBg });
        fileInput.value = '';
        this.renderDrawerContent();
      }
    };

    // Remove image
    const removeBtn = wrap.querySelector('#drawer-remove-img');
    if (removeBtn) {
      removeBtn.onclick = () => {
        this.store.update(state => {
          const sc = activeDoc(state);
          if (sc && sc.device) {
            sc.device.image = null;
          }
        });
        this.renderDrawerContent();
      };
    }

    // Fit mode buttons
    wrap.querySelectorAll('[data-image-fit]').forEach(btn => {
      btn.onclick = () => {
        this.store.update(state => {
          const sc = activeDoc(state);
          if (sc && sc.device) sc.device.imageFit = btn.dataset.imageFit;
        });
        this.renderDrawerContent();
      };
    });

    // Image Scale and Offset
    const scaleInput = wrap.querySelector('#drawer-image-scale');
    if (scaleInput) {
      scaleInput.oninput = (e) => {
        this.store.update(state => {
          const sc = activeDoc(state);
          if (sc && sc.device) sc.device.imageScale = parseFloat(e.target.value);
        });
      };
    }

    const offsetInput = wrap.querySelector('#drawer-image-offset-y');
    if (offsetInput) {
      offsetInput.oninput = (e) => {
        this.store.update(state => {
          const sc = activeDoc(state);
          if (sc && sc.device) sc.device.imageOffsetY = parseFloat(e.target.value);
        });
      };
    }

    container.appendChild(wrap);
  }

  /**
   * Tab: Phone frame style + color, for this screen or all screens.
   */
  renderFrameTab(container) {
    const state = this.store.getState();
    const screen = this.store.getActiveScreen();
    if (!screen) return;
    ensureScreenDevices(screen);
    const allDevices = (screen.devices || [screen.device]).filter(Boolean);
    const activeEl = state.activeElementId;
    const isDeviceSelected = activeEl === 'device' || (typeof activeEl === 'string' && activeEl.startsWith('device-'));
    const activeDevId = isDeviceSelected ? activeEl : (allDevices[0]?.id || 'device');
    const dev = getLayerItem(screen, activeDevId) || allDevices[0] || {};
    const visibleDevices = allDevices.filter(d => !d.hidden);

    const styles = [
      { type: 'modern_phone', icon: 'smartphone', name: 'Modern Android' },
      { type: 'minimal', icon: 'stay_current_portrait', name: 'Slim Bezel' },
      { type: 'frameless', icon: 'aspect_ratio', name: 'Frameless' },
      { type: 'tablet', icon: 'tablet_android', name: 'Tablet' }
    ];
    const colors = [
      { hex: '#0f172a', name: 'Midnight' }, { hex: '#374151', name: 'Graphite' },
      { hex: '#cbd5e1', name: 'Silver' }, { hex: '#f8fafc', name: 'White' },
      { hex: '#b08d57', name: 'Gold' }, { hex: '#1e3a8a', name: 'Blue' }
    ];
    const curColor = (dev.color || '#0f172a').toLowerCase();

    const wrap = document.createElement('div');
    wrap.className = 'drawer-section';
    wrap.innerHTML = `
      <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/50">
        <div>
          <span class="text-xs text-slate-200 font-semibold">Phone Frames (${visibleDevices.length})</span>
          <div class="text-[11px] text-slate-400">Add multiple devices to one screen</div>
        </div>
        <button type="button" class="btn btn-primary btn-xs" id="frame-add-new-btn"><span class="material-symbols-outlined" style="font-size:14px;">add</span> Add Frame</button>
      </div>

      ${allDevices.length > 1 ? `
        <div class="mb-3">
          <label class="form-label text-[11px] mb-1.5">Select Frame to Edit</label>
          <div class="flex flex-wrap gap-1.5">
            ${allDevices.map((d, idx) => `
              <button type="button" class="btn btn-xs ${d.id === activeDevId ? 'btn-primary' : 'btn-outline'} ${d.hidden ? 'opacity-40' : ''}" data-select-dev="${d.id}">
                <span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle;">smartphone</span> Frame ${idx + 1} ${d.hidden ? '(Hidden)' : ''}
              </button>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${dev.hidden ? `
        <div class="mb-4 p-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 text-center">
          <div class="text-xs font-semibold text-amber-200 mb-1">Frame Removed from Screen</div>
          <div class="text-[11px] text-amber-300/80 mb-2.5">This device mockup is currently deleted or hidden.</div>
          <button type="button" class="btn btn-primary btn-sm w-full" id="frame-restore-btn"><span class="material-symbols-outlined" style="font-size:15px;">add</span> Restore Phone Frame</button>
        </div>
      ` : `
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-slate-400">Editing: <strong>${dev.id === 'device' && allDevices.length === 1 ? 'Primary Frame' : `Frame ${(allDevices.findIndex(d => d.id === dev.id) + 1) || 1}`}</strong></span>
          <button type="button" class="btn btn-danger btn-xs" id="frame-remove-btn" title="Remove this frame"><span class="material-symbols-outlined" style="font-size:14px;">delete</span> Remove</button>
        </div>
      `}

      <label class="form-label mb-2">Frame style</label>
      <div class="frame-style-grid mb-4">
        ${styles.map(f => `
          <button type="button" class="frame-card ${dev.type === f.type ? 'active' : ''}" data-type="${f.type}" aria-pressed="${dev.type === f.type}">
            <span class="frame-icon material-symbols-outlined" style="font-size:26px;">${f.icon}</span>
            <span class="frame-name">${f.name}</span>
          </button>
        `).join('')}
      </div>

      <label class="form-label mb-2">Frame color</label>
      <div class="frame-color-row mb-4">
        ${colors.map(c => `
          <button type="button" class="frame-color-swatch ${curColor === c.hex ? 'active' : ''}" data-color="${c.hex}" title="${c.name}" aria-label="${c.name}" style="background:${c.hex}"></button>
        `).join('')}
        <input type="color" class="color-swatch-sm" id="frame-color-custom" value="${curColor}" title="Custom color" aria-label="Custom frame color" />
      </div>

      <button type="button" class="btn btn-outline btn-sm w-full mb-2" id="frame-apply-all">Apply this frame style to all screens</button>
      <button type="button" class="btn btn-outline btn-sm w-full" id="frame-duplicate-btn"><span class="material-symbols-outlined" style="font-size:15px;">content_copy</span> Duplicate Selected Frame</button>
    `;

    const setDevice = (fn) => this.store.update(state => {
      const sc = activeDoc(state);
      if (!sc) return;
      ensureScreenDevices(sc);
      const targetDev = getLayerItem(sc, activeDevId) || sc.device;
      if (targetDev) {
        targetDev.hidden = false;
        targetDev.deleted = false;
        fn(targetDev);
      }
      if (sc.layerOrder && !sc.layerOrder.includes(targetDev?.id || 'device')) {
        sc.layerOrder.push(targetDev?.id || 'device');
      }
      state.activeElementId = targetDev?.id || 'device';
    });

    wrap.querySelectorAll('[data-select-dev]').forEach(btn => {
      btn.onclick = () => {
        this.store.setActiveElement(btn.dataset.selectDev);
      };
    });

    const addNewFrame = () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        ensureScreenDevices(sc);
        const count = (sc.devices || []).length;
        const offsetX = count % 2 === 1 ? 220 : -220;
        const offsetY = (count * 25) % 100;
        const baseDev = sc.devices?.[0] || sc.device || {};
        const newId = `device-${Date.now()}`;
        const newDev = {
          id: newId,
          type: baseDev.type || 'modern_phone',
          color: baseDev.color || '#0f172a',
          scale: Math.max(0.65, (baseDev.scale || 0.92) * 0.92),
          x: Math.round((baseDev.x || 540) + offsetX),
          y: Math.round((baseDev.y || 1180) + offsetY),
          rotation: count % 2 === 1 ? 4 : -4,
          shadowColor: 'rgba(0, 0, 0, 0.45)',
          shadowBlur: 45,
          shadowOffsetY: 30,
          image: null,
          imageFit: 'cover',
          imageOffsetX: 0,
          imageOffsetY: 0,
          imageScale: 1,
          hidden: false,
          isDevice: true
        };
        sc.devices = sc.devices || [];
        sc.devices.push(newDev);
        if (sc.layerOrder) sc.layerOrder.push(newId);
        state.activeElementId = newId;
      });
    };

    wrap.querySelector('#frame-add-new-btn')?.addEventListener('click', addNewFrame);

    wrap.querySelector('#frame-duplicate-btn')?.addEventListener('click', () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        ensureScreenDevices(sc);
        const srcDev = getLayerItem(sc, activeDevId) || sc.device;
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

    wrap.querySelector('#frame-restore-btn')?.addEventListener('click', () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        ensureScreenDevices(sc);
        const targetDev = getLayerItem(sc, activeDevId) || sc.device;
        if (targetDev) {
          targetDev.hidden = false;
          targetDev.deleted = false;
        }
        if (sc.layerOrder && !sc.layerOrder.includes(targetDev?.id || 'device')) {
          sc.layerOrder.push(targetDev?.id || 'device');
        }
        state.activeElementId = targetDev?.id || 'device';
      });
    });

    wrap.querySelector('#frame-remove-btn')?.addEventListener('click', () => {
      this.store.update(state => {
        const sc = activeDoc(state);
        if (!sc) return;
        ensureScreenDevices(sc);
        if (activeDevId === 'device' && (!sc.devices || sc.devices.length <= 1)) {
          if (sc.device) {
            sc.device.hidden = true;
            sc.device.deleted = true;
          }
        } else {
          if (sc.devices) {
            sc.devices = sc.devices.filter(d => d.id !== activeDevId);
            if (sc.device?.id === activeDevId) {
              sc.device = sc.devices[0] || null;
            }
          } else if (sc.device) {
            sc.device.hidden = true;
            sc.device.deleted = true;
          }
        }
        if (sc.layerOrder) {
          sc.layerOrder = sc.layerOrder.filter(id => id !== activeDevId);
        }
        if (state.activeElementId === activeDevId) {
          state.activeElementId = null;
        }
      });
    });

    wrap.querySelectorAll('[data-type]').forEach(btn => {
      btn.onclick = () => setDevice(d => { d.type = btn.dataset.type; });
    });
    wrap.querySelectorAll('[data-color]').forEach(btn => {
      btn.onclick = () => setDevice(d => { d.color = btn.dataset.color; });
    });
    wrap.querySelector('#frame-color-custom').oninput = (e) => setDevice(d => { d.color = e.target.value; });
    wrap.querySelector('#frame-apply-all').onclick = () => {
      this.store.update(state => {
        state.screens.forEach(sc => {
          ensureScreenDevices(sc);
          (sc.devices || []).forEach(d => {
            d.type = dev.type;
            d.color = dev.color;
          });
          if (sc.device) {
            sc.device.type = dev.type;
            sc.device.color = dev.color;
          }
        });
      });
    };

    container.appendChild(wrap);
  }

  /**
   * Tab 3: Text & Typography
   * Allows creating custom text elements and styling them freely with ready styles.
   */
  renderTextTab(container) {
    const state = this.store.getState();
    const screen = this.store.getActiveScreen();
    if (!screen) return;

    const wrap = document.createElement('div');
    wrap.className = 'drawer-section';

    // Collect only texts that actually have content or are actively selected
    const texts = [];
    let textIndex = 1;
    const isHeadlineActive = screen.headline && !screen.headline.deleted && !screen.headline.hidden && (screen.headline.text?.trim() || state.activeElementId === 'headline');
    if (isHeadlineActive) {
      texts.push({ id: 'headline', type: 'headline', icon: 'title', obj: screen.headline, label: `Text ${textIndex++}`, defaultText: 'Text' });
    }
    const isSubtitleActive = screen.subtitle && !screen.subtitle.deleted && !screen.subtitle.hidden && (screen.subtitle.text?.trim() || state.activeElementId === 'subtitle');
    if (isSubtitleActive) {
      texts.push({ id: 'subtitle', type: 'subtitle', icon: 'short_text', obj: screen.subtitle, label: `Text ${textIndex++}`, defaultText: 'Text' });
    }
    (screen.shapes || []).filter(s => s.type === 'text' && !s.deleted && !s.hidden && (s.text?.trim() || state.activeElementId === s.id)).forEach((sh) => {
      texts.push({ id: sh.id, type: 'custom', icon: 'text_fields', obj: sh, label: `Text ${textIndex++}`, defaultText: 'Text' });
    });

    // Active text element: if state.activeElementId is a text item, use it. Otherwise, default to first available.
    let activeTextItem = texts.find(t => t.id === state.activeElementId);
    if (!activeTextItem && texts.length > 0) {
      activeTextItem = texts[0];
    }
    const activeObj = activeTextItem?.obj;

    const updateActive = (cb) => {
      if (!activeTextItem) return;
      this.store.update(s => {
        const sc = activeDoc(s);
        if (!sc) return;
        if (activeTextItem.id === 'headline' || activeTextItem.id === 'subtitle') {
          if (sc[activeTextItem.id]) {
            sc[activeTextItem.id].hidden = false;
            cb(sc[activeTextItem.id]);
          }
        } else {
          const sh = sc.shapes?.find(x => x.id === activeTextItem.id);
          if (sh) {
            sh.hidden = false;
            cb(sh);
          }
        }
      });
    };

    const addNewText = (presetId = 'headline') => {
      const preset = TEXT_PRESETS.find(p => p.id === presetId) || TEXT_PRESETS[0];
      const { width, height } = docSize(state, screen);
      const defaultText = preset.id === 'headline' ? 'Catchy App Statement'
        : preset.id === 'subtitle' ? 'Highlight your key features here.'
        : preset.id === 'eyebrow' ? 'SPECIAL FEATURE'
        : preset.id === 'callout' ? 'NEW UPDATE' : 'Custom text note.';

      // If headline was deleted or empty, use it for this new text
      if (screen.headline && (screen.headline.hidden || screen.headline.deleted || !screen.headline.text?.trim())) {
        this.store.update(s => {
          const sc = activeDoc(s);
          if (sc && sc.headline) {
            sc.headline.text = defaultText;
            sc.headline.hidden = false;
            sc.headline.deleted = false;
            sc.headline.fontFamily = preset.style.fontFamily;
            sc.headline.fontSize = preset.style.fontSize;
            sc.headline.fontWeight = preset.style.fontWeight;
            sc.headline.color = preset.style.color;
            sc.headline.align = preset.style.align || 'center';
            sc.headline.lineHeight = preset.style.lineHeight || 1.2;
            sc.headline.shadow = preset.style.shadow || false;
            if (sc.layerOrder && !sc.layerOrder.includes('headline')) {
              sc.layerOrder.push('headline');
            }
            s.activeElementId = 'headline';
          }
        });
        this.renderDrawerContent();
        return;
      }

      // If subtitle was deleted or empty, use it for this new text
      if (screen.subtitle && (screen.subtitle.hidden || screen.subtitle.deleted || !screen.subtitle.text?.trim())) {
        this.store.update(s => {
          const sc = activeDoc(s);
          if (sc && sc.subtitle) {
            sc.subtitle.text = defaultText;
            sc.subtitle.hidden = false;
            sc.subtitle.deleted = false;
            sc.subtitle.fontFamily = preset.style.fontFamily;
            sc.subtitle.fontSize = preset.style.fontSize;
            sc.subtitle.fontWeight = preset.style.fontWeight;
            sc.subtitle.color = preset.style.color;
            sc.subtitle.align = preset.style.align || 'center';
            sc.subtitle.lineHeight = preset.style.lineHeight || 1.35;
            sc.subtitle.shadow = preset.style.shadow || false;
            if (sc.layerOrder && !sc.layerOrder.includes('subtitle')) {
              sc.layerOrder.push('subtitle');
            }
            s.activeElementId = 'subtitle';
          }
        });
        this.renderDrawerContent();
        return;
      }

      const newId = 'text_' + Math.random().toString(36).substr(2, 9);
      const existingCount = screen.shapes?.filter(s => s.type === 'text').length || 0;
      const newText = {
        id: newId,
        type: 'text',
        text: defaultText,
        fontFamily: preset.style.fontFamily,
        fontSize: preset.style.fontSize,
        fontWeight: preset.style.fontWeight,
        color: preset.style.color,
        align: preset.style.align,
        lineHeight: preset.style.lineHeight,
        shadow: preset.style.shadow,
        x: Math.round(width / 2),
        y: Math.min(260 + existingCount * 80, height - 160),
        rotation: 0,
        scale: 1
      };
      this.store.update(s => {
        const sc = activeDoc(s);
        if (!sc.shapes) sc.shapes = [];
        sc.shapes.push(newText);
        s.activeElementId = newId;
      });
      this.renderDrawerContent();
    };

    const duplicateText = () => {
      if (!activeTextItem || !activeObj) return;
      const { width, height } = docSize(state, screen);
      const newId = 'text_' + Math.random().toString(36).substr(2, 9);
      const clone = {
        id: newId,
        type: 'text',
        text: activeObj.text || 'Text copy',
        fontFamily: activeObj.fontFamily || 'Plus Jakarta Sans',
        fontSize: activeObj.fontSize || 48,
        fontWeight: activeObj.fontWeight || '700',
        color: activeObj.color || '#ffffff',
        align: activeObj.align || 'center',
        lineHeight: activeObj.lineHeight || 1.25,
        shadow: activeObj.shadow || false,
        x: Math.min((activeObj.x ?? (width / 2)) + 20, width - 80),
        y: Math.min((activeObj.y ?? (activeObj.yOffset ?? 200)) + 30, height - 100),
        rotation: activeObj.rotation || 0,
        scale: activeObj.scale || 1
      };
      this.store.update(s => {
        const sc = activeDoc(s);
        if (!sc.shapes) sc.shapes = [];
        sc.shapes.push(clone);
        s.activeElementId = newId;
      });
      this.renderDrawerContent();
    };

    const deleteText = (id) => {
      this.store.update(s => {
        const sc = activeDoc(s);
        if (id === 'headline' || id === 'subtitle') {
          if (sc[id]) {
            sc[id].text = '';
            sc[id].hidden = true;
            sc[id].deleted = true;
          }
        } else if (sc.shapes) {
          sc.shapes = sc.shapes.filter(x => x.id !== id);
        }
        if (s.activeElementId === id) s.activeElementId = null;
      });
      this.renderDrawerContent();
    };

    const presetColors = ['#ffffff', '#38bdf8', '#34d399', '#fbbf24', '#f43f5e', '#a855f7', '#0f172a'];

    wrap.innerHTML = `
      <!-- Add Text & Ready Styles -->
      <div class="form-group mb-3 pb-3 border-b border-slate-700/60">
        <div class="flex items-center justify-between mb-2">
          <label class="form-label mb-0 text-slate-200 font-semibold">Add Text by Style</label>
          <button class="btn btn-primary btn-xs" id="btn-add-text-action">+ Add Text</button>
        </div>
        <div class="ready-pills-row">
          ${TEXT_PRESETS.map(p => `
            <button class="ready-pill-btn flex items-center gap-1.5" data-add-preset="${p.id}" title="${p.name} style - ${p.preview}">
              <span class="material-symbols-outlined" style="font-size:14px;">${p.icon}</span> ${p.name}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Texts on Screen -->
      <div class="form-group mb-3">
        <label class="form-label mb-1.5 text-slate-300 font-medium text-xs">Texts on Screen (${texts.length})</label>
        <div class="text-layers-list">
          ${texts.length === 0 ? `
            <div class="p-3 text-center text-xs text-slate-500 italic bg-slate-800/20 rounded-lg border border-slate-700/40">
              No text on this screen yet. Click "+ Add Text" above to create one.
            </div>
          ` : texts.map(t => {
            const isCur = activeTextItem?.id === t.id;
            const snippet = t.obj.text ? escapeHtml(t.obj.text) : '<span class="text-slate-500 italic">(Empty)</span>';
            return `
              <div class="text-item-row ${isCur ? 'active' : ''}" data-select-text="${t.id}" title="Click to select on canvas">
                <span class="text-item-tag flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:13px;">${t.icon}</span>${t.label}</span>
                <span class="text-item-snippet">${snippet}</span>
                <button class="text-item-del" data-del-text="${t.id}" title="Clear / Delete text"><span class="material-symbols-outlined" style="font-size:14px;">delete</span></button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${activeObj ? `
        <!-- Active Text Editor Card -->
        <div class="p-3 bg-slate-800/40 rounded-xl border border-indigo-500/20 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <span class="material-symbols-outlined" style="font-size:15px;">text_fields</span> Edit ${activeTextItem.label}
            </span>
            <div class="flex items-center gap-1.5">
              <button class="btn btn-outline btn-xs py-0.5 px-2 text-[11px]" id="drawer-btn-duplicate-text" title="Duplicate text layer"><span class="material-symbols-outlined" style="font-size:13px;">content_copy</span> Copy</button>
              <button class="btn btn-outline btn-xs py-0.5 px-2 text-rose-400 text-[11px]" id="drawer-btn-delete-text" title="Delete text"><span class="material-symbols-outlined" style="font-size:13px;">delete</span> Del</button>
            </div>
          </div>

          <!-- Text content -->
          <div class="form-group mb-3">
            <textarea class="form-textarea" id="drawer-active-text-content" rows="2" placeholder="Enter text...">${escapeHtml(activeObj.text || '')}</textarea>
          </div>

          <!-- One-click Ready Styles -->
          <div class="form-group mb-3">
            <label class="form-label text-[11px] mb-1">Apply Ready Style</label>
            <div class="ready-pills-row">
              ${TEXT_PRESETS.map(p => `
                <button class="ready-pill-btn py-1 px-2 text-[11px] flex items-center gap-1" data-apply-preset="${p.id}" title="Apply ${p.name} style">
                  <span class="material-symbols-outlined" style="font-size:13px;">${p.icon}</span> ${p.name}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Font Picker -->
          <div class="form-group mb-3">
            <label class="form-label text-[11px] mb-1">Font Family</label>
            <div id="drawer-active-font-picker"></div>
          </div>

          <!-- Font Size Slider & Presets -->
          <div class="form-group mb-3">
            <div class="flex items-center justify-between mb-1">
              <label class="form-label text-[11px] mb-0">Font Size</label>
              <span class="text-xs font-mono text-indigo-300 font-bold" id="drawer-font-size-label">${activeObj.fontSize || 48}px</span>
            </div>
            <div class="size-preset-row mb-1.5">
              ${[['24', 'Small'], ['36', 'Medium'], ['48', 'Large'], ['72', 'XL']].map(([v, name]) => `
                <button class="size-pill py-1 text-[10px] ${Math.abs((activeObj.fontSize || 48) - v) < 4 ? 'active' : ''}" data-font-preset="${v}">${name}</button>
              `).join('')}
            </div>
            <input type="range" class="form-range" id="drawer-active-font-size" min="16" max="130" step="2" value="${activeObj.fontSize || 48}" />
          </div>

          <!-- Font Weight -->
          <div class="form-group mb-3">
            <label class="form-label text-[11px] mb-1">Weight</label>
            <div class="button-toggle-group">
              ${[['400', 'Regular'], ['600', 'Semi'], ['700', 'Bold'], ['800', 'Black']].map(([w, name]) => `
                <button class="toggle-btn text-[11px] py-1 ${(activeObj.fontWeight || '700') === w ? 'active' : ''}" data-font-weight="${w}">${name}</button>
              `).join('')}
            </div>
          </div>

          <!-- Color Palette -->
          <div class="form-group mb-3">
            <label class="form-label text-[11px] mb-1">Text Color</label>
            <div class="color-palette-row">
              ${presetColors.map(c => `
                <button class="color-circle ${(activeObj.color || '').toLowerCase() === c ? 'selected' : ''}" style="background: ${c};" data-text-color="${c}"></button>
              `).join('')}
              <input type="color" class="color-swatch-sm" id="drawer-active-text-color-custom" value="${activeObj.color || '#ffffff'}" title="Custom Color" />
            </div>
          </div>

          <!-- Alignment -->
          <div class="form-group mb-3">
            <label class="form-label text-[11px] mb-1">Alignment</label>
            <div class="button-toggle-group">
              <button class="toggle-btn text-[11px] py-1 ${(activeObj.align || 'center') === 'left' ? 'active' : ''}" data-align="left">Left</button>
              <button class="toggle-btn text-[11px] py-1 ${(activeObj.align || 'center') === 'center' ? 'active' : ''}" data-align="center">Center</button>
              <button class="toggle-btn text-[11px] py-1 ${(activeObj.align || 'center') === 'right' ? 'active' : ''}" data-align="right">Right</button>
            </div>
          </div>

          <!-- Drop Shadow Toggle -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-700/60">
            <span class="text-xs font-semibold text-slate-300">Drop Shadow</span>
            <input type="checkbox" id="drawer-active-shadow" ${activeObj.shadow ? 'checked' : ''} />
          </div>
        </div>
      ` : ''}

      <div class="mt-4 pt-3 border-t border-slate-700">
        <button class="btn btn-outline w-full flex items-center justify-center gap-1.5" id="btn-quick-jump-translate">
          <span class="material-symbols-outlined" style="font-size:16px;">translate</span> Language copies & translation
        </button>
      </div>
    `;

    // Bind Add Text Button & Add Preset Chips
    wrap.querySelector('#btn-add-text-action')?.addEventListener('click', () => addNewText('headline'));
    wrap.querySelectorAll('[data-add-preset]').forEach(btn => {
      btn.onclick = () => addNewText(btn.dataset.addPreset);
    });

    // Select text row
    wrap.querySelectorAll('[data-select-text]').forEach(row => {
      row.onclick = (e) => {
        if (e.target.closest('[data-del-text]')) return;
        this.store.setActiveElement(row.dataset.selectText);
        this.renderDrawerContent();
      };
    });

    // Delete text row
    wrap.querySelectorAll('[data-del-text]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        deleteText(btn.dataset.delText);
      };
    });

    // Active text element wiring
    if (activeObj) {
      // Content typing
      const textarea = wrap.querySelector('#drawer-active-text-content');
      if (textarea) {
        textarea.oninput = (e) => updateActive(t => t.text = e.target.value);
      }

      // One-click apply ready style
      wrap.querySelectorAll('[data-apply-preset]').forEach(btn => {
        btn.onclick = () => {
          const preset = TEXT_PRESETS.find(p => p.id === btn.dataset.applyPreset);
          if (preset) {
            updateActive(t => {
              t.fontFamily = preset.style.fontFamily;
              t.fontSize = preset.style.fontSize;
              t.fontWeight = preset.style.fontWeight;
              t.color = preset.style.color;
              t.shadow = preset.style.shadow;
              t.lineHeight = preset.style.lineHeight;
              t.align = preset.style.align;
            });
            this.renderDrawerContent();
          }
        };
      });

      // Mount Font Picker
      const fontSlot = wrap.querySelector('#drawer-active-font-picker');
      if (fontSlot) {
        mountFontPicker(fontSlot, activeObj.fontFamily || 'Plus Jakarta Sans', (font) => {
          updateActive(t => t.fontFamily = font);
        }, 'Text font');
      }

      // Font size slider & presets
      const sizeInput = wrap.querySelector('#drawer-active-font-size');
      const sizeLabel = wrap.querySelector('#drawer-font-size-label');
      if (sizeInput) {
        sizeInput.oninput = (e) => {
          const val = parseFloat(e.target.value);
          if (sizeLabel) sizeLabel.textContent = `${val}px`;
          updateActive(t => t.fontSize = val);
        };
      }

      wrap.querySelectorAll('[data-font-preset]').forEach(btn => {
        btn.onclick = () => {
          const val = parseFloat(btn.dataset.fontPreset);
          if (sizeInput) sizeInput.value = val;
          if (sizeLabel) sizeLabel.textContent = `${val}px`;
          updateActive(t => t.fontSize = val);
          wrap.querySelectorAll('[data-font-preset]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        };
      });

      // Font weight
      wrap.querySelectorAll('[data-font-weight]').forEach(btn => {
        btn.onclick = () => {
          wrap.querySelectorAll('[data-font-weight]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updateActive(t => t.fontWeight = btn.dataset.fontWeight);
        };
      });

      // Colors
      wrap.querySelectorAll('[data-text-color]').forEach(btn => {
        btn.onclick = () => {
          updateActive(t => t.color = btn.dataset.textColor);
          this.renderDrawerContent();
        };
      });

      const customColor = wrap.querySelector('#drawer-active-text-color-custom');
      if (customColor) {
        customColor.oninput = (e) => updateActive(t => t.color = e.target.value);
      }

      // Alignment
      wrap.querySelectorAll('[data-align]').forEach(btn => {
        btn.onclick = () => {
          wrap.querySelectorAll('[data-align]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          updateActive(t => t.align = btn.dataset.align);
        };
      });

      // Shadow
      const shadowCheck = wrap.querySelector('#drawer-active-shadow');
      if (shadowCheck) {
        shadowCheck.onchange = (e) => updateActive(t => t.shadow = e.target.checked);
      }

      // Duplicate & Delete buttons
      wrap.querySelector('#drawer-btn-duplicate-text')?.addEventListener('click', duplicateText);
      wrap.querySelector('#drawer-btn-delete-text')?.addEventListener('click', () => deleteText(activeTextItem.id));
    }

    wrap.querySelector('#btn-quick-jump-translate')?.addEventListener('click', () => this.openTab('translate'));

    container.appendChild(wrap);
  }

  /**
   * Tab 4: Ready Shapes & Badges
   */
  renderShapesTab(container) {
    const wrap = document.createElement('div');
    wrap.className = 'drawer-section';

    wrap.innerHTML = `
      <input type="file" accept="image/*" class="hidden" id="drawer-add-image-file" />
      <button type="button" class="btn btn-primary btn-sm w-full mb-2 flex items-center justify-center gap-1.5" id="drawer-add-image"><span class="material-symbols-outlined" style="font-size:16px;">add_photo_alternate</span> Add image from computer</button>
      <label class="flex items-center gap-2 text-xs text-slate-300 mb-3 cursor-pointer select-none px-1">
        <input type="checkbox" id="drawer-shapes-remove-bg" />
        <span class="material-symbols-outlined text-indigo-400" style="font-size:15px;">auto_fix_high</span>
        <span>Remove background automatically</span>
      </label>

      <div class="shape-category-pills">
        <button class="pill-filter active" data-cat="all">All</button>
        <button class="pill-filter" data-cat="badges">Badges</button>
        <button class="pill-filter" data-cat="cards">Cards</button>
        <button class="pill-filter" data-cat="geometry">Shapes</button>
      </div>

      <div class="shape-drawer-grid" id="drawer-shape-grid"></div>
    `;

    const addImageFile = wrap.querySelector('#drawer-add-image-file');
    wrap.querySelector('#drawer-add-image').onclick = () => addImageFile.click();
    addImageFile.onchange = async () => {
      const removeBg = wrap.querySelector('#drawer-shapes-remove-bg')?.checked || false;
      await addImageItem(addImageFile.files[0], this.store, { removeBackground: removeBg });
      addImageFile.value = '';
    };

    const renderGrid = (cat) => {
      const grid = wrap.querySelector('#drawer-shape-grid');
      grid.innerHTML = '';
      const items = cat === 'all' ? SHAPE_DEFINITIONS : SHAPE_DEFINITIONS.filter(s => s.category === cat);

      items.forEach(def => {
        const card = document.createElement('div');
        card.className = 'shape-drawer-item';
        card.innerHTML = `
          <span class="shape-icon">${def.icon}</span>
          <span class="shape-name">${def.name}</span>
        `;

        card.onclick = () => {
          this.store.update(state => {
            const sc = activeDoc(state);
            if (!sc) return;
            if (!sc.shapes) sc.shapes = [];
            const { width, height } = docSize(state, sc);
            const shape = createShape(def.id, width / 2, Math.min(450, height / 2));
            sc.shapes.push(shape);
            state.activeElementId = shape.id;
          });
        };

        grid.appendChild(card);
      });
    };

    wrap.querySelectorAll('.pill-filter').forEach(pill => {
      pill.onclick = () => {
        wrap.querySelectorAll('.pill-filter').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        renderGrid(pill.dataset.cat);
      };
    });

    renderGrid('all');
    container.appendChild(wrap);
  }

  /**
   * Layers: every item on the active screen, top layer first.
   * Drag (or Alt+↑/↓) to reorder; buttons toggle visibility / lock and delete shapes.
   */
  renderLayersTab(container) {
    const state = this.store.getState();
    const screen = this.store.getActiveScreen();
    if (!screen) return;

    const names = { device: ['smartphone', 'Phone & screenshot'], showcase: ['featured_video', 'Screens showcase'] };
    const isLayerActive = (id) => {
      const item = getLayerItem(screen, id);
      if (!item) return false;
      if (item.deleted) return false;
      if (id === 'headline' || id === 'subtitle') {
        if (!item.text || !item.text.trim()) return false;
      }
      if (id === 'device' || id.startsWith('device-') || item.isDevice) {
        if (item.hidden || item.deleted) return false;
      }
      return true;
    };

    const topFirst = getLayerOrder(screen).filter(isLayerActive).reverse();
    const edit = (fn) => this.store.update(s => fn(activeDoc(s)));

    if (topFirst.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'p-6 text-center text-xs text-slate-400';
      empty.innerHTML = `
        <div style="font-size:28px; margin-bottom:8px;"><span class="material-symbols-outlined" style="font-size:32px;">layers</span></div>
        <div style="font-weight:600; margin-bottom:4px; color:var(--text, #f1f5f9);">No Active Layers</div>
        <p>Add a phone frame, text, or shapes to see them listed here.</p>
      `;
      container.appendChild(empty);
      return;
    }

    // Moves a layer to a new index in the top-first list and saves the order bottom-first
    const move = (id, toIndex) => {
      const ids = topFirst.filter(x => x !== id);
      ids.splice(Math.max(0, Math.min(ids.length, toIndex)), 0, id);
      edit(sc => { sc.layerOrder = ids.reverse(); });
    };

    const list = document.createElement('ul');
    list.className = 'layer-list';

    topFirst.forEach((id, index) => {
      const item = getLayerItem(screen, id);
      const isFixed = isFixedLayer(id);
      const canDelete = id !== 'showcase';
      let icon = 'category';
      let name = item?.label || 'Shape';

      if (id === 'device') {
        icon = 'smartphone';
        name = (screen.devices && screen.devices.length > 1) ? 'Phone Frame 1' : 'Phone & screenshot';
      } else if (id.startsWith('device-') || item?.isDevice) {
        icon = 'smartphone';
        const devIdx = (screen.devices || []).findIndex(d => d.id === id);
        name = `Phone Frame ${devIdx >= 0 ? devIdx + 1 : 2}`;
      } else if (id === 'headline' || id === 'subtitle' || item?.type === 'text') {
        icon = 'title';
        name = item?.text ? (item.text.length > 22 ? item.text.slice(0, 20) + '…' : item.text) : 'Text Layer';
      } else if (names[id]) {
        [icon, name] = names[id];
      } else if (item?.type === 'image') {
        [icon, name] = ['image', 'Image'];
      } else {
        [icon, name] = ['category', item?.label || SHAPE_DEFINITIONS.find(d => d.defaults.type === item?.type)?.name || 'Shape'];
      }
      const row = document.createElement('li');
      row.className = `layer-row ${state.activeElementId === id ? 'active' : ''} ${item?.hidden ? 'is-hidden' : ''}`;
      row.draggable = true;
      row.tabIndex = 0;
      row.dataset.id = id;
      row.title = 'Click to select · drag or Alt+↑/↓ to reorder';
      row.innerHTML = `
        <span class="layer-grip material-symbols-outlined" aria-hidden="true" style="font-size:16px;">drag_indicator</span>
        <span class="layer-icon material-symbols-outlined" aria-hidden="true" style="font-size:18px;">${icon}</span>
        <span class="layer-name"></span>
        <button class="layer-btn" data-act="hide" title="${item?.hidden ? 'Show' : 'Hide'}" aria-pressed="${!!item?.hidden}"><span class="material-symbols-outlined" style="font-size:15px;">${item?.hidden ? 'visibility_off' : 'visibility'}</span></button>
        <button class="layer-btn" data-act="lock" title="${item?.locked ? 'Unlock' : 'Lock (prevents dragging on canvas)'}" aria-pressed="${!!item?.locked}"><span class="material-symbols-outlined" style="font-size:15px;">${item?.locked ? 'lock' : 'lock_open'}</span></button>
        ${canDelete ? '<button class="layer-btn danger" data-act="delete" title="Delete"><span class="material-symbols-outlined" style="font-size:15px;">delete</span></button>' : ''}
      `;
      row.querySelector('.layer-name').textContent = name;

      row.onclick = (e) => {
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'hide') edit(sc => { const it = getLayerItem(sc, id); if (it) it.hidden = !it.hidden; });
        else if (act === 'lock') edit(sc => { const it = getLayerItem(sc, id); if (it) it.locked = !it.locked; });
        else if (act === 'delete') {
          this.store.update(s => {
            const sc = activeDoc(s);
            if (!sc) return;
            ensureScreenDevices(sc);
            if (id === 'device') {
              if (sc.devices && sc.devices.length > 1) {
                sc.devices = sc.devices.filter(d => d.id !== 'device');
                sc.device = sc.devices[0] || null;
              } else if (sc.device) {
                sc.device.hidden = true;
                sc.device.deleted = true;
              }
            } else if (id.startsWith('device-')) {
              if (sc.devices) {
                sc.devices = sc.devices.filter(d => d.id !== id);
                if (sc.device?.id === id) sc.device = sc.devices[0] || null;
              }
            } else if (id === 'headline' || id === 'subtitle') {
              if (sc[id]) {
                sc[id].text = '';
                sc[id].hidden = true;
                sc[id].deleted = true;
              }
            } else if (sc.shapes) {
              sc.shapes = sc.shapes.filter(sh => sh.id !== id);
            }
            if (sc.layerOrder) {
              sc.layerOrder = sc.layerOrder.filter(lid => lid !== id);
            }
            if (s.activeElementId === id) s.activeElementId = null;
          });
        } else this.store.setActiveElement(id);
      };

      row.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.store.setActiveElement(id);
        if (typeof this.onLayerContextMenu === 'function') {
          this.onLayerContextMenu({
            clientX: e.clientX,
            clientY: e.clientY,
            elementId: id,
            screen
          });
        }
      };

      row.onkeydown = (e) => {
        if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
          e.preventDefault();
          move(id, index + (e.key === 'ArrowUp' ? -1 : 1));
          this.drawerPanel.querySelector(`.layer-row[data-id="${id}"]`)?.focus();
        } else if (e.key === 'Enter') {
          this.store.setActiveElement(id);
        }
      };

      // Native drag & drop: drop above or below the row depending on pointer position
      row.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        row.classList.add('dragging');
      };
      row.ondragend = () => row.classList.remove('dragging');
      row.ondragover = (e) => {
        e.preventDefault();
        const rect = row.getBoundingClientRect();
        const below = e.clientY > rect.top + rect.height / 2;
        row.classList.toggle('drop-above', !below);
        row.classList.toggle('drop-below', below);
      };
      row.ondragleave = () => row.classList.remove('drop-above', 'drop-below');
      row.ondrop = (e) => {
        e.preventDefault();
        const dragged = e.dataTransfer.getData('text/plain');
        if (!dragged || dragged === id) return row.classList.remove('drop-above', 'drop-below');
        const below = row.classList.contains('drop-below');
        const target = topFirst.filter(x => x !== dragged).indexOf(id) + (below ? 1 : 0);
        move(dragged, target);
      };

      list.appendChild(row);
    });

    container.appendChild(list);

    const hint = document.createElement('p');
    hint.className = 'text-xs text-slate-400 mt-3';
    hint.textContent = 'Items at the top of the list are drawn in front.';
    container.appendChild(hint);
  }

  /**
   * Tab 5: Multi-Language Translation Center
   * Manages project language copies. Users can add languages (with or without AI)
   * and select any language copy to edit its elements directly on the canvas.
   */
  renderTranslateTab(container) {
    const state = this.store.getState();
    const langInfo = (code) => SUPPORTED_LANGUAGES.find(l => l.code === code) || { code, flag: '🌐', name: code };
    const originalCode = state.languages[0] || 'en';
    const activeCode = state.activeLanguage || originalCode;

    const available = SUPPORTED_LANGUAGES.filter(l => !state.languages.includes(l.code));
    if (!available.some(l => l.code === this.addLangTarget)) this.addLangTarget = available[0]?.code;
    const aiReady = isAiReady();
    const aiName = AI_PROVIDERS[getAiSettings().provider]?.name || 'AI';
    if (this.autoTranslate === undefined) this.autoTranslate = false;

    const wrap = document.createElement('div');
    wrap.className = 'drawer-section';

    wrap.innerHTML = `
      <div class="flex items-center justify-between mb-1.5">
        <label class="form-label mb-0">Project Languages</label>
        <span class="text-[11px] text-slate-400 font-mono">${state.languages.length} copy${state.languages.length === 1 ? '' : 'ies'}</span>
      </div>
      <p class="text-xs text-slate-400 mb-3">
        Select a language below to work on its elements directly on the canvas.
      </p>

      <ul class="lang-copy-list mb-4">
        ${state.languages.map((code, i) => {
          const l = langInfo(code);
          const count = this.store.getLanguageScreens(code).length;
          const isActive = code === activeCode;
          const isOrig = i === 0;
          return `
            <li class="lang-copy-row ${isActive ? 'active' : ''}" data-code="${code}" tabindex="0" title="Click to edit ${l.name}">
              <span class="lang-copy-flag">${l.flag}</span>
              <span class="lang-copy-name">
                ${l.name}
                ${isOrig ? '<em>original</em>' : (isActive ? '<em style="color:#818cf8; font-weight:700;">• active</em>' : '')}
              </span>
              <span class="lang-copy-count">${count} screen${count === 1 ? '' : 's'}</span>
              ${!isOrig ? `<button class="layer-btn danger" data-remove="${code}" title="Delete ${l.name} copy" aria-label="Delete ${l.name} copy"><span class="material-symbols-outlined" style="font-size:15px;">delete</span></button>` : ''}
            </li>`;
        }).join('')}
      </ul>

      ${available.length ? `
        <div class="trans-quick-box mt-4">
          <label class="form-label mb-2" for="lang-add-select">Add a Language Copy</label>
          <select class="form-select w-full mb-3" id="lang-add-select" ${this.langBusy ? 'disabled' : ''}>
            ${available.map(l => `<option value="${l.code}" ${l.code === this.addLangTarget ? 'selected' : ''}>${l.flag} ${l.name}</option>`).join('')}
          </select>

          <label class="flex items-center gap-2 text-xs mb-3 ${aiReady ? 'text-slate-300 cursor-pointer' : 'text-slate-500'}">
            <input type="checkbox" id="lang-auto-translate" ${this.autoTranslate && aiReady ? 'checked' : ''} ${aiReady ? '' : 'disabled'} />
            <span>Translate texts automatically with ${aiReady ? aiName : 'AI (requires key)'}</span>
          </label>

          <button class="btn btn-primary btn-sm w-full mb-2" id="lang-add-btn" ${this.langBusy ? 'disabled' : ''}></button>

          <p class="text-xs text-slate-400" id="lang-status" aria-live="polite">
            ${escapeHtml(this.langStatus || '')}
          </p>
        </div>
      ` : '<p class="text-xs text-slate-400 mt-4">Every supported language has a copy in this project.</p>'}
    `;

    wrap.querySelectorAll('.lang-copy-row').forEach(row => {
      const open = () => this.store.switchLanguage(row.dataset.code);
      row.onclick = async (e) => {
        const remove = e.target.closest('[data-remove]')?.dataset.remove;
        if (!remove) return open();
        const confirmed = await customConfirm({
          title: 'Delete Language Copy',
          message: `Delete the ${langInfo(remove).name} copy and all its screens? This action cannot be undone.`,
          confirmText: 'Delete Copy',
          isDanger: true,
          icon: 'delete'
        });
        if (confirmed) this.store.removeLanguage(remove);
      };
      row.onkeydown = (e) => { if (e.key === 'Enter') open(); };
    });

    const select = wrap.querySelector('#lang-add-select');
    if (select) {
      const addBtn = wrap.querySelector('#lang-add-btn');
      const label = () => {
        const target = langInfo(this.addLangTarget);
        const useAi = isAiReady() && this.autoTranslate;
        addBtn.innerHTML = useAi
          ? `<span class="material-symbols-outlined" style="font-size:15px; vertical-align:middle; margin-right:3px;">bolt</span>Add & Auto-Translate ${target.name.split(' ')[0]} Copy`
          : `<span class="material-symbols-outlined" style="font-size:15px; vertical-align:middle; margin-right:3px;">add</span>Add ${target.name.split(' ')[0]} Copy`;
      };
      label();
      select.onchange = () => { this.addLangTarget = select.value; label(); };

      const autoCheckbox = wrap.querySelector('#lang-auto-translate');
      if (autoCheckbox) {
        autoCheckbox.onchange = (e) => {
          this.autoTranslate = e.target.checked;
          label();
        };
      }

      addBtn.onclick = async () => {
        const target = langInfo(this.addLangTarget);
        const { activeLanguage, screens: sourceScreens, feature } = this.store.getState();
        const useAi = isAiReady() && this.autoTranslate;
        this.langBusy = true;
        this.langStatus = useAi ? `⏳ Translating ${target.name} copy with ${aiName}…` : `⏳ Adding ${target.name} copy…`;
        this.requestRender();
        try {
          const docs = await buildLanguageCopy([...sourceScreens, feature], activeLanguage, target.code, useAi);
          const featureCopy = docs.pop();
          this.store.addLanguage(target.code, docs, featureCopy);
          this.langStatus = `✓ ${target.name} copy added! You are now editing it on the canvas.`;
        } catch (err) {
          console.error('Adding language failed:', err);
          this.langStatus = `⚠ ${err.message} The copy was not created.`;
        } finally {
          this.langBusy = false;
          this.requestRender();
        }
      };
    }

    container.appendChild(wrap);
  }
}

function escapeHtml(str) {
  return str ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
}
