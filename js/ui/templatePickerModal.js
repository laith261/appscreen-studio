/**
 * App Screen Generator - Google Play Listing Templates Gallery Modal
 * Provides ready-to-use screenshot designs optimized for Google Play conversions.
 */

import { PLAY_STORE_TEMPLATES, DESIGN_IDEAS, applyTemplate, applyDesignIdea } from '../features/templates/templates.js';
import { LISTING_PALETTES, themeManager } from '../features/theme/themeManager.js';
import { getSavedDesigns, saveCurrentDesign, deleteSavedDesign, applyCustomDesign, generateDesignWireframeSvg } from '../features/templates/customDesigns.js';
import { customConfirm, customPrompt } from './dialog.js';

export class TemplatePickerModal {
  /**
   * @param {Object} store
   */
  constructor(store) {
    this.store = store;
    this.modalEl = null;
    this.activeSubTab = 'designs'; // 'designs' | 'saved' | 'colors' | 'suites'
    this.createDom();
  }

  createDom() {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-backdrop hidden';
    this.modalEl.id = 'template-picker-modal';

    const saved = getSavedDesigns();

    this.modalEl.innerHTML = `
      <div class="modal-card modal-lg">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Templates & Design Studio</h3>
            <p class="modal-desc">Explore 4 layout ideas with vector previews, customize color palettes, or reuse your saved designs.</p>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <button class="btn btn-primary btn-sm flex items-center gap-1.5" id="modal-save-current-btn" style="white-space:nowrap;">
              <span class="material-symbols-outlined" style="font-size:16px;">bookmark_add</span> Save Current Screen
            </button>
            <button class="modal-close-btn" id="close-template-modal"><span class="material-symbols-outlined" style="font-size:18px;">close</span></button>
          </div>
        </div>

        <div class="template-subtabs-nav modal-subtabs" id="modal-template-subtabs">
          <button type="button" class="template-subtab-btn active flex items-center justify-center gap-1.5" data-subtab="designs">
            <span class="material-symbols-outlined" style="font-size:15px;">design_services</span> Designs (4 Ideas)
          </button>
          <button type="button" class="template-subtab-btn flex items-center justify-center gap-1.5" data-subtab="saved" id="modal-saved-subtab-btn">
            <span class="material-symbols-outlined" style="font-size:15px;">bookmark</span> My Saved Designs (${saved.length})
          </button>
          <button type="button" class="template-subtab-btn flex items-center justify-center gap-1.5" data-subtab="suites">
            <span class="material-symbols-outlined" style="font-size:15px;">auto_awesome</span> Full Suites
          </button>
        </div>

        <div class="template-grid" id="templates-grid-container"></div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Event handlers
    this.modalEl.querySelector('#close-template-modal').onclick = () => this.close();
    this.modalEl.onclick = (e) => {
      if (e.target === this.modalEl) this.close();
    };

    this.modalEl.querySelector('#modal-save-current-btn').onclick = () => {
      this.promptSaveCurrentDesign();
    };

    // Sub-tab switcher
    const nav = this.modalEl.querySelector('#modal-template-subtabs');
    nav.querySelectorAll('.template-subtab-btn').forEach(btn => {
      btn.onclick = () => {
        this.activeSubTab = btn.dataset.subtab;
        nav.querySelectorAll('.template-subtab-btn').forEach(b => b.classList.toggle('active', b === btn));
        this.renderTemplates();
      };
    });

    this.renderTemplates();
  }

  /**
   * Prompts user for a template name and saves current screen.
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
      this.activeSubTab = 'saved';
      const nav = this.modalEl.querySelector('#modal-template-subtabs');
      nav.querySelectorAll('.template-subtab-btn').forEach(b => b.classList.toggle('active', b.dataset.subtab === 'saved'));
      this.renderTemplates();
    }
  }

  renderTemplates() {
    const grid = this.modalEl.querySelector('#templates-grid-container');
    grid.innerHTML = '';

    const savedBtn = this.modalEl.querySelector('#modal-saved-subtab-btn');
    if (savedBtn) {
      savedBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:15px;">bookmark</span> My Saved Designs (${getSavedDesigns().length})`;
    }

    if (this.activeSubTab === 'designs') {
      this.renderDesignsTab(grid);
    } else if (this.activeSubTab === 'saved') {
      this.renderSavedTab(grid);
    } else {
      this.renderSuitesTab(grid);
    }
  }

  /**
   * Renders the 4 Design Layout Ideas, each featuring a vector wireframe illustration.
   */
  renderDesignsTab(grid) {
    DESIGN_IDEAS.forEach(idea => {
      const card = document.createElement('div');
      card.className = 'template-card';

      card.innerHTML = `
        <div class="design-vector-banner">
          <span class="template-badge">${idea.badge}</span>
          <div class="design-vector-svg-wrap">
            ${idea.vectorSvg}
          </div>
        </div>
        <div class="template-body">
          <div class="template-category">Layout Design</div>
          <h4 class="template-name">${idea.name}</h4>
          <p class="template-summary">${idea.tagline}. ${idea.description}</p>
          <div class="template-actions">
            <button class="btn btn-primary btn-sm apply-design-screen-btn">Apply Design to Current Screen</button>
            <button class="btn btn-outline btn-sm apply-design-all-btn">Load All 4 Design Ideas</button>
          </div>
        </div>
      `;

      card.querySelector('.apply-design-screen-btn').onclick = () => {
        applyDesignIdea(this.store, idea.id, false);
        this.close();
      };

      card.querySelector('.apply-design-all-btn').onclick = async () => {
        const confirmed = await customConfirm({
          title: 'Load All Design Ideas',
          message: 'Load all 4 design ideas into the project? This will create a 4-screen layout sequence.',
          confirmText: 'Load All Ideas',
          icon: 'view_carousel'
        });
        if (confirmed) {
          applyDesignIdea(this.store, idea.id, true);
          this.close();
        }
      };

      grid.appendChild(card);
    });
  }

  /**
   * Renders the curated color palettes.
   */
  renderColorsTab(grid) {
    LISTING_PALETTES.forEach(pal => {
      const card = document.createElement('div');
      card.className = 'template-card';

      card.innerHTML = `
        <div class="template-banner" style="background: ${pal.previewGradient}">
          <span class="template-badge">${pal.name}</span>
        </div>
        <div class="template-body">
          <div class="template-category">Color Palette</div>
          <h4 class="template-name">${pal.name}</h4>
          <p class="template-summary">Restyle backgrounds, headline colors, subtitles, and badges.</p>
          <div class="template-actions">
            <button class="btn btn-primary btn-sm apply-pal-screen-btn">Apply Color to Current Screen</button>
            <button class="btn btn-outline btn-sm apply-pal-all-btn">Apply Color to All Screens</button>
          </div>
        </div>
      `;

      card.querySelector('.apply-pal-screen-btn').onclick = () => {
        themeManager.applyListingPalette(this.store, pal.id, false);
        this.close();
      };

      card.querySelector('.apply-pal-all-btn').onclick = () => {
        themeManager.applyListingPalette(this.store, pal.id, true);
        this.close();
      };

      grid.appendChild(card);
    });
  }

  /**
   * Renders full suites combining design layouts and themes.
   */
  renderSuitesTab(grid) {
    PLAY_STORE_TEMPLATES.forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'template-card';
      let selectedIdeaIdx = 0;

      card.innerHTML = `
        <div class="template-banner" style="background: ${tpl.previewGradient}">
          <span class="template-badge">${tpl.badge}</span>
          <div class="template-4ideas-strip">
            ${tpl.screens.map((sc, i) => `
              <div class="template-idea-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" title="${sc.name}: ${sc.headline.text}" style="background: ${sc.background.type === 'solid' ? (sc.background.solidColor || '#0f172a') : `linear-gradient(${sc.background.angle || 135}deg, ${sc.background.color1}, ${sc.background.color2})`}">
                <div class="thumb-phone"></div>
                <span class="thumb-number">${i + 1}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="template-body">
          <div class="template-category">${tpl.category}</div>
          <h4 class="template-name">${tpl.name}</h4>
          <p class="template-summary">${tpl.description}</p>

          <div class="template-ideas-selector">
            <div class="ideas-header">
              <span>4 Screen Ideas</span>
              <span class="selected-idea-label text-xs">Idea 1: ${tpl.screens[0]?.name.split(':')[1]?.trim() || 'Hero'}</span>
            </div>
            <div class="ideas-grid">
              ${tpl.screens.map((sc, i) => `
                <button type="button" class="idea-pill-btn ${i === 0 ? 'active' : ''}" data-idx="${i}" title="${sc.headline.text}">
                  ${sc.name}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="template-actions">
            <button class="btn btn-outline btn-sm apply-screen-btn">Apply Idea 1 to Current Screen</button>
            <button class="btn btn-primary btn-sm apply-all-btn">Load All 4 Screen Ideas</button>
          </div>
        </div>
      `;

      const thumbs = card.querySelectorAll('.template-idea-thumb');
      const pills = card.querySelectorAll('.idea-pill-btn');
      const applyBtn = card.querySelector('.apply-screen-btn');
      const label = card.querySelector('.selected-idea-label');

      const setIdea = (idx) => {
        selectedIdeaIdx = idx;
        thumbs.forEach(t => t.classList.toggle('active', Number(t.dataset.idx) === idx));
        pills.forEach(p => p.classList.toggle('active', Number(p.dataset.idx) === idx));
        const scName = tpl.screens[idx]?.name || `Idea ${idx + 1}`;
        if (label) label.textContent = scName;
        if (applyBtn) applyBtn.textContent = `Apply Idea ${idx + 1} to Current Screen`;
      };

      thumbs.forEach(t => {
        t.onclick = (e) => {
          e.stopPropagation();
          setIdea(Number(t.dataset.idx));
        };
      });

      pills.forEach(p => {
        p.onclick = (e) => {
          e.stopPropagation();
          setIdea(Number(p.dataset.idx));
        };
      });

      applyBtn.onclick = () => {
        applyTemplate(this.store, tpl.id, false, selectedIdeaIdx);
        this.close();
      };

      card.querySelector('.apply-all-btn').onclick = async () => {
        const confirmed = await customConfirm({
          title: `Apply Suite: ${tpl.name}`,
          message: `Load all 4 screens of "${tpl.name}"? This will set up a complete 4-screen listing flow.`,
          confirmText: 'Load All Screens',
          icon: 'dashboard_customize'
        });
        if (confirmed) {
          applyTemplate(this.store, tpl.id, true);
          this.close();
        }
      };

      grid.appendChild(card);
    });
  }

  /**
   * Renders the user's custom saved designs in the modal gallery.
   */
  renderSavedTab(grid) {
    const saved = getSavedDesigns();

    if (saved.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'saved-designs-empty';
      emptyCard.style.gridColumn = '1 / -1';
      emptyCard.innerHTML = `
        <div class="saved-designs-empty-icon"><span class="material-symbols-outlined" style="font-size:42px; color:#64748b;">folder_open</span></div>
        <h4>No Saved Designs Yet</h4>
        <p>You can create any custom layout (device position & angle, custom shapes, fonts, and colors) on the canvas, then save it here to use anytime.</p>
        <button class="btn btn-primary btn-sm btn-modal-empty-save flex items-center justify-center gap-1.5 mx-auto">
          <span class="material-symbols-outlined" style="font-size:16px;">bookmark_add</span> Save Current Screen Layout as Template
        </button>
      `;
      emptyCard.querySelector('.btn-modal-empty-save').onclick = () => {
        this.promptSaveCurrentDesign();
      };
      grid.appendChild(emptyCard);
      return;
    }

    saved.forEach(design => {
      const card = document.createElement('div');
      card.className = 'template-card saved-design-card';

      const svgContent = design.vectorSvg || generateDesignWireframeSvg(design.layout);

      card.innerHTML = `
        <div class="design-vector-banner" style="position: relative;">
          <div class="saved-card-header" style="position: absolute; top: 0; left: 0; right: 0; z-index: 5; background: linear-gradient(to bottom, rgba(15,23,42,0.85), transparent); padding: 8px 12px;">
            <span class="saved-card-badge">Custom</span>
            <button class="btn-delete-saved-design" title="Delete Saved Template" style="color: #cbd5e1;"><span class="material-symbols-outlined" style="font-size:16px;">delete</span></button>
          </div>
          <div class="design-vector-svg-wrap">
            ${svgContent}
          </div>
        </div>
        <div class="template-body">
          <div class="template-category">Custom Saved Design</div>
          <h4 class="template-name">${design.name}</h4>
          <p class="template-summary">${design.tagline || 'Custom layout with device positioning, typography, badges and colors.'}</p>
          <div class="template-actions">
            <button class="btn btn-primary btn-sm apply-saved-screen-btn">Apply Design to Current Screen</button>
            <button class="btn btn-outline btn-sm apply-saved-all-btn">Apply Design to All Screens</button>
          </div>
        </div>
      `;

      card.querySelector('.apply-saved-screen-btn').onclick = () => {
        applyCustomDesign(this.store, design.id, false);
        this.close();
      };

      card.querySelector('.apply-saved-all-btn').onclick = async () => {
        const confirmed = await customConfirm({
          title: 'Apply to All Screens',
          message: `Apply custom design "${design.name}" to all screens in your project?`,
          confirmText: 'Apply to All',
          icon: 'palette'
        });
        if (confirmed) {
          applyCustomDesign(this.store, design.id, true);
          this.close();
        }
      };

      card.querySelector('.btn-delete-saved-design').onclick = async (e) => {
        e.stopPropagation();
        const confirmed = await customConfirm({
          title: 'Delete Custom Template',
          message: `Delete custom template "${design.name}"? This action cannot be undone.`,
          confirmText: 'Delete Template',
          isDanger: true,
          icon: 'delete'
        });
        if (confirmed) {
          deleteSavedDesign(design.id);
          this.renderTemplates();
        }
      };

      grid.appendChild(card);
    });
  }

  open() {
    this.renderTemplates();
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}
