/**
 * App Screen Generator - Visual Shape Picker Modal
 * Allows browsing and adding Google Play badges, floating UI cards, geometric shapes, and glow accents.
 */

import { SHAPE_DEFINITIONS, createShape } from '../features/shapes/shapeLibrary.js';
import { activeDoc } from '../state/store.js';
import { docSize } from '../canvas/compose.js';

export class ShapePickerModal {
  /**
   * @param {Object} store
   */
  constructor(store) {
    this.store = store;
    this.modalEl = null;
    this.activeCategory = 'all';
    this.createDom();
  }

  createDom() {
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'modal-backdrop hidden';
    this.modalEl.id = 'shape-picker-modal';

    this.modalEl.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Ready-to-Use Shapes & Badges</h3>
            <p class="modal-desc">Click any shape to add it to your screen. You can customize colors, size, and text.</p>
          </div>
          <button class="modal-close-btn" id="close-shape-modal"><span class="material-symbols-outlined" style="font-size:18px;">close</span></button>
        </div>

        <div class="modal-tabs">
          <button class="modal-tab active" data-cat="all">All Shapes</button>
          <button class="modal-tab" data-cat="badges">Play Store Badges</button>
          <button class="modal-tab" data-cat="cards">Floating UI Cards</button>
          <button class="modal-tab" data-cat="geometry">Geometry</button>
          <button class="modal-tab" data-cat="accents">Glows & Accents</button>
        </div>

        <div class="shape-grid" id="shapes-grid-container"></div>
      </div>
    `;

    document.body.appendChild(this.modalEl);

    // Event handlers
    this.modalEl.querySelector('#close-shape-modal').onclick = () => this.close();
    this.modalEl.onclick = (e) => {
      if (e.target === this.modalEl) this.close();
    };

    const tabs = this.modalEl.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeCategory = tab.dataset.cat;
        this.renderShapes();
      };
    });

    this.renderShapes();
  }

  renderShapes() {
    const grid = this.modalEl.querySelector('#shapes-grid-container');
    grid.innerHTML = '';

    const filtered = this.activeCategory === 'all'
      ? SHAPE_DEFINITIONS
      : SHAPE_DEFINITIONS.filter(s => s.category === this.activeCategory);

    filtered.forEach(shapeDef => {
      const card = document.createElement('div');
      card.className = 'shape-item-card';
      card.innerHTML = `
        <div class="shape-item-icon">${shapeDef.icon}</div>
        <div class="shape-item-name">${shapeDef.name}</div>
        <div class="shape-item-tag">${shapeDef.category}</div>
      `;

      card.onclick = () => {
        this.addShapeToScreen(shapeDef.id);
        this.close();
      };

      grid.appendChild(card);
    });
  }

  addShapeToScreen(shapeDefId) {
    this.store.update(state => {
      const active = activeDoc(state);
      if (!active) return;
      if (!active.shapes) active.shapes = [];

      // Add shape at center of screen
      const { width, height } = docSize(state, active);
      const newShape = createShape(shapeDefId, width / 2, Math.min(450, height / 2));
      active.shapes.push(newShape);
      state.activeElementId = newShape.id;
    });
  }

  open() {
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }
}
