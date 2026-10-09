/**
 * App Screen Generator - Screen Selector Carousel & Manager
 * Bottom thumbnail bar allowing switching, adding, duplicating, and deleting listing screens.
 */

import { FEATURE_ID } from '../state/store.js';

export class ScreenSelector {
  /**
   * @param {HTMLElement} containerEl
   * @param {Object} store
   */
  constructor(containerEl, store) {
    this.container = containerEl;
    this.store = store;

    this.store.subscribe(() => this.render());
    this.render();
  }

  /**
   * Renders the filmstrip of screens.
   */
  render() {
    const state = this.store.getState();
    const screens = state.screens;
    const activeId = state.activeScreenId;

    this.container.innerHTML = '';

    const list = document.createElement('div');
    list.className = 'screen-strip-list';

    screens.forEach((screen, index) => {
      const card = document.createElement('div');
      card.className = `screen-thumb-card ${screen.id === activeId ? 'active' : ''}`;
      card.title = `Click to edit ${screen.name}`;

      // Card Mini Preview
      const preview = document.createElement('div');
      preview.className = 'thumb-mini-preview';

      // Set preview background matching screen
      if (screen.background) {
        if (screen.background.type === 'solid') {
          preview.style.background = screen.background.solidColor || '#0f172a';
        } else {
          preview.style.background = `linear-gradient(${screen.background.angle || 135}deg, ${screen.background.color1 || '#4f46e5'}, ${screen.background.color2 || '#7c3aed'})`;
        }
      }

      // Miniature headline representation
      const textPreview = document.createElement('div');
      textPreview.className = 'thumb-mini-text';
      textPreview.innerText = screen.headline?.text || `Screen ${index + 1}`;
      preview.appendChild(textPreview);

      // Miniature phone silhouette
      const phoneSim = document.createElement('div');
      phoneSim.className = 'thumb-mini-phone';
      preview.appendChild(phoneSim);

      card.appendChild(preview);

      // Card Label & Actions
      const meta = document.createElement('div');
      meta.className = 'thumb-meta';

      const label = document.createElement('span');
      label.className = 'thumb-title';
      label.innerText = screen.name || `Screen ${index + 1}`;
      meta.appendChild(label);

      // Actions: duplicate & delete
      const actions = document.createElement('div');
      actions.className = 'thumb-actions';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'thumb-action-btn';
      copyBtn.title = 'Duplicate Screen';
      copyBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;">content_copy</span>';
      copyBtn.onclick = (e) => {
        e.stopPropagation();
        this.store.duplicateScreen(screen.id);
      };
      actions.appendChild(copyBtn);

      if (screens.length > 1) {
        const delBtn = document.createElement('button');
        delBtn.className = 'thumb-action-btn danger';
        delBtn.title = 'Delete Screen';
        delBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:15px;">delete</span>';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          if (confirm(`Delete ${screen.name}?`)) {
            this.store.deleteScreen(screen.id);
          }
        };
        actions.appendChild(delBtn);
      }

      meta.appendChild(actions);
      card.appendChild(meta);

      card.onclick = () => {
        this.store.setActiveScreen(screen.id);
      };

      card.oncontextmenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.store.setActiveScreen(screen.id);
        if (typeof this.onCardContextMenu === 'function') {
          this.onCardContextMenu({
            clientX: e.clientX,
            clientY: e.clientY,
            screen,
            totalScreens: screens.length
          });
        }
      };

      list.appendChild(card);
    });

    // Feature graphic: its own 1024 × 500 document, edited like a screen
    const featureCard = document.createElement('div');
    featureCard.className = `screen-thumb-card feature-thumb-card ${activeId === FEATURE_ID ? 'active' : ''}`;
    featureCard.title = 'Edit the 1024 × 500 feature graphic';
    const fbg = state.feature?.background || {};
    featureCard.innerHTML = `
      <div class="thumb-mini-preview feature-mini-preview"><span><span class="material-symbols-outlined" style="font-size:14px; vertical-align:middle; margin-right:2px;">featured_video</span>1024 × 500</span></div>
      <div class="thumb-meta"><span class="thumb-title">Feature graphic</span></div>
    `;
    featureCard.querySelector('.feature-mini-preview').style.background = fbg.type === 'solid'
      ? (fbg.solidColor || '#1e293b')
      : `linear-gradient(${fbg.angle || 135}deg, ${fbg.color1 || '#4f46e5'}, ${fbg.color2 || '#7c3aed'})`;
    featureCard.onclick = () => this.store.setActiveScreen(FEATURE_ID);
    featureCard.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.store.setActiveScreen(FEATURE_ID);
      if (typeof this.onCardContextMenu === 'function') {
        this.onCardContextMenu({
          clientX: e.clientX,
          clientY: e.clientY,
          screen: state.feature || { id: FEATURE_ID, name: 'Feature graphic' },
          totalScreens: screens.length
        });
      }
    };
    list.appendChild(featureCard);

    // Add Screen Card Button
    const addCard = document.createElement('div');
    addCard.className = 'screen-add-card';
    addCard.innerHTML = `
      <div class="add-icon"><span class="material-symbols-outlined" style="font-size:24px;">add</span></div>
      <div class="add-text">Add Screen</div>
    `;
    addCard.onclick = () => {
      this.store.addScreen();
    };
    list.appendChild(addCard);

    this.container.appendChild(list);
  }
}
