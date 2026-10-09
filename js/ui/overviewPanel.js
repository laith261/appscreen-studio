/**
 * App Screen Generator - Side-by-Side Overview
 * Shows every listing screen next to each other, the way they appear
 * in the Google Play store listing. Click a screen to edit it.
 */

export class OverviewPanel {
  /**
   * @param {HTMLElement} containerEl Overview container element
   * @param {Object} store App store
   * @param {Object} exporter Exporter instance (provides offscreen rendering)
   */
  constructor(containerEl, store, exporter) {
    this.container = containerEl;
    this.store = store;
    this.exporter = exporter;
    this.isOpen = false;
    this.renderToken = 0;
    this.debounceId = null;
    this.thumbHeight = 520;
    this.onSelectScreen = null;

    // Re-render while open so edits/translations stay in sync
    this.store.subscribe(() => {
      if (!this.isOpen) return;
      clearTimeout(this.debounceId);
      this.debounceId = setTimeout(() => this.render(), 150);
    });
  }

  /** Shows the overview and renders all screens. */
  open() {
    this.isOpen = true;
    this.container.classList.remove('hidden');
    this.render();
  }

  /** Hides the overview. */
  close() {
    this.isOpen = false;
    this.container.classList.add('hidden');
  }

  /** Changes preview size (in CSS px height). */
  setThumbHeight(px) {
    this.thumbHeight = px;
    this.container.style.setProperty('--overview-thumb-h', `${px}px`);
  }

  /**
   * Renders every screen to a canvas and lays them out in a row.
   * A render token prevents stale async renders from overwriting newer ones.
   */
  async render() {
    const token = ++this.renderToken;
    const state = this.store.getState();
    const lang = state.activeLanguage || 'en';

    const row = document.createElement('div');
    row.className = 'overview-row';

    for (let i = 0; i < state.screens.length; i++) {
      const screen = state.screens[i];
      const card = this.buildCard(screen, i, screen.id === state.activeScreenId);
      row.appendChild(card);

      try {
        const canvas = await this.exporter.renderScreenOffscreen(screen, lang);
        if (token !== this.renderToken) return; // newer render started
        canvas.className = 'overview-canvas';
        card.querySelector('.overview-frame').appendChild(canvas);
      } catch (err) {
        console.error('Overview render failed for screen', screen.id, err);
        card.querySelector('.overview-frame').innerHTML = '<div class="overview-error">Preview failed</div>';
      }
    }

    if (token !== this.renderToken) return;
    this.container.querySelector('.overview-scroll').replaceChildren(row);
  }

  /** Builds a single screen card (frame + label). */
  buildCard(screen, index, isActive) {
    const card = document.createElement('div');
    card.className = `overview-card ${isActive ? 'active' : ''}`;
    card.title = 'Click to edit this screen';
    card.innerHTML = `
      <div class="overview-frame"></div>
      <div class="overview-label">
        <span class="overview-index">${index + 1}</span>
        <span class="overview-name"></span>
      </div>
    `;
    card.querySelector('.overview-name').textContent = screen.name || `Screen ${index + 1}`;
    card.onclick = () => {
      this.store.setActiveScreen(screen.id);
      if (this.onSelectScreen) this.onSelectScreen(screen.id);
    };
    return card;
  }
}
