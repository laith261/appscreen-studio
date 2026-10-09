/**
 * App Screen Generator - Reactive Store & State Management
 * Manages project configuration, screens, active selection, undo/redo history, and localization.
 */

export const FEATURE_ID = 'feature';

/**
 * The document being edited: a listing screen, or the feature graphic when activeScreenId is 'feature'.
 * @param {Object} state
 */
export function activeDoc(state) {
  return state.activeScreenId === FEATURE_ID ? state.feature : state.screens.find(s => s.id === state.activeScreenId);
}

/** A fresh, empty 1024 × 500 feature graphic: texts on the left, every screen shown on the right. */
export function makeFeatureDoc() {
  return {
    id: FEATURE_ID,
    name: 'Feature graphic',
    background: { type: 'solid', color1: '#1e293b', color2: '#0f172a', angle: 135, solidColor: '#1e293b' },
    headline: { text: '', fontFamily: 'Plus Jakarta Sans', fontSize: 54, fontWeight: '800', color: '#ffffff', align: 'center', lineHeight: 1.15, x: 240, yOffset: 150, maxWidth: 400 },
    subtitle: { text: '', fontFamily: 'Inter', fontSize: 24, fontWeight: '400', color: '#cbd5e1', align: 'center', lineHeight: 1.4, x: 240, yOffset: 300, maxWidth: 380 },
    showcase: { order: [], hiddenIds: [], x: 724, y: 250, fitWidth: 540, height: 420, gap: 16, radius: 16, shadow: true, rotation: 0 },
    shapes: [],
    layerOrder: ['showcase', 'headline', 'subtitle'] // explicit order, so anything added lands on top
  };
}

export class Store {
  /**
   * Initializes the store with default settings and listeners.
   */
  constructor() {
    this.listeners = [];
    this.history = []; // undo stack of pre-change snapshots (JSON)
    this.future = [];  // redo stack
    this.lastUpdateAt = 0;
    this.maxHistory = 30;

    this.state = this.getDefaultState();
  }

  /**
   * Returns a fresh, empty project: one blank screen with an empty phone frame and no text.
   * @returns {Object} Default project state
   */
  getDefaultState() {
    const state = {
      projectName: 'My Play Store App',
      canvasPreset: 'phone_standard', // phone_standard (1080x1920), phone_modern (1080x2400), tablet_7 (1200x1920), tablet_10 (1600x2560)
      width: 1080,
      height: 1920,
      activeScreenId: 'screen-1',
      activeElementId: null, // 'device' | 'headline' | 'subtitle' | shapeId
      activeLanguage: 'en', // language of the copy being edited (its screens live in `screens`)
      languages: ['en'], // every language copy in the project, first = original
      localeScreens: {}, // screens of the other language copies, keyed by language code
      feature: makeFeatureDoc(), // the 1024 × 500 Play Store feature graphic of the active language copy
      localeFeature: {}, // feature graphics of the other language copies
      zoom: 0.35, // display zoom level in canvas viewport
      screens: [
        {
          id: 'screen-1',
          name: 'Screen 1',
          background: { type: 'solid', color1: '#1e293b', color2: '#0f172a', angle: 135, solidColor: '#1e293b' },
          layout: 'header_top',
          headline: {
            text: '',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 72,
            fontWeight: '800',
            color: '#ffffff',
            align: 'center',
            letterSpacing: 0,
            lineHeight: 1.2,
            yOffset: 120
          },
          subtitle: {
            text: '',
            fontFamily: 'Inter',
            fontSize: 34,
            fontWeight: '400',
            color: '#cbd5e1',
            align: 'center',
            letterSpacing: 0,
            lineHeight: 1.4,
            yOffset: 310
          },
          device: {
            type: 'modern_phone',
            color: '#0f172a',
            scale: 0.92,
            x: 540,
            y: 1180,
            rotation: 0,
            shadowColor: 'rgba(0, 0, 0, 0.45)',
            shadowBlur: 50,
            shadowOffsetY: 35,
            image: null,
            imageFit: 'cover',
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageScale: 1
          },
          shapes: []
        }
      ]
    };

    return state;
  }

  /**
   * Subscribes a listener function to state changes.
   * @param {Function} listener
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notifies all registered listeners of a state change.
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    }
  }

  /**
   * Retrieves the current state snapshot.
   * @returns {Object} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Gets the currently active screen object.
   * @returns {Object|null}
   */
  getActiveScreen() {
    if (!this.state.screens || this.state.screens.length === 0) return null;
    return activeDoc(this.state) || this.state.screens[0];
  }

  /**
   * Commits a state modification, saving the previous state to history for undo/redo.
   * @param {Function} updater Function that receives draft state or updates directly
   */
  update(updater) {
    try {
      // Rapid-fire changes (slider drag, typing) become one undo step
      const now = Date.now();
      if (now - this.lastUpdateAt > 500) this.recordHistory(JSON.stringify(this.state));
      this.lastUpdateAt = now;

      // Apply update
      if (typeof updater === 'function') {
        updater(this.state);
      }
      this.notify();
    } catch (err) {
      console.error('Failed to update store state:', err);
    }
  }

  /**
   * Pushes a pre-change snapshot onto the undo stack and clears redo.
   * Also used by canvas drags, which mutate state directly while the pointer moves.
   * @param {string} snapshot JSON of the state before the change
   */
  recordHistory(snapshot) {
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) this.history.shift();
    this.future = [];
  }

  /**
   * Reverts to the state before the last change.
   */
  undo() {
    if (!this.history.length) return;
    this.future.push(JSON.stringify(this.state));
    this.state = JSON.parse(this.history.pop());
    this.notify();
  }

  /**
   * Re-applies the last undone change.
   */
  redo() {
    if (!this.future.length) return;
    this.history.push(JSON.stringify(this.state));
    this.state = JSON.parse(this.future.pop());
    this.notify();
  }

  /**
   * Switches the active screen.
   * @param {string} screenId
   */
  setActiveScreen(screenId) {
    if (this.state.activeScreenId === screenId) return;
    this.update(state => {
      state.activeScreenId = screenId;
      state.activeElementId = null;
    });
  }

  /**
   * Sets the active selection element (device, headline, subtitle, or shape ID).
   * @param {string|null} elementId
   */
  setActiveElement(elementId) {
    this.update(state => {
      state.activeElementId = elementId;
    });
  }

  /**
   * Returns the screens of a language copy (the active copy's screens are `state.screens`).
   * @param {string} lang
   */
  getLanguageScreens(lang) {
    return lang === this.state.activeLanguage ? this.state.screens : this.state.localeScreens[lang];
  }

  /** Feature graphic of a language copy. */
  getLanguageFeature(lang) {
    return lang === this.state.activeLanguage ? this.state.feature : (this.state.localeFeature[lang] || makeFeatureDoc());
  }

  /**
   * Switches editing to another language copy, staying on the same screen position.
   * @param {string} lang
   */
  switchLanguage(lang) {
    const s = this.state;
    if (lang === s.activeLanguage || !s.localeScreens[lang]) return;
    const onFeature = s.activeScreenId === FEATURE_ID;
    const index = Math.max(0, s.screens.findIndex(sc => sc.id === s.activeScreenId));
    this.update(state => {
      state.localeScreens[state.activeLanguage] = state.screens;
      state.localeFeature[state.activeLanguage] = state.feature;
      state.screens = state.localeScreens[lang];
      state.feature = state.localeFeature[lang] || makeFeatureDoc();
      delete state.localeScreens[lang];
      delete state.localeFeature[lang];
      state.activeLanguage = lang;
      state.activeScreenId = onFeature ? FEATURE_ID : (state.screens[index] || state.screens[0]).id;
      state.activeElementId = null;
    });
  }

  /**
   * Adds a language copy with the given screens and switches to it.
   * @param {string} lang
   * @param {Array} screens Full screen list for the new copy
   * @param {Object} feature Feature graphic for the new copy
   */
  addLanguage(lang, screens, feature = makeFeatureDoc()) {
    if (this.state.languages.includes(lang)) return;
    this.update(state => {
      state.languages.push(lang);
      state.localeScreens[lang] = screens;
      state.localeFeature[lang] = feature;
    });
    this.switchLanguage(lang);
  }

  /**
   * Deletes a language copy (the last remaining copy can't be removed).
   * @param {string} lang
   */
  removeLanguage(lang) {
    const s = this.state;
    if (s.languages.length <= 1 || !s.languages.includes(lang)) return;
    if (lang === s.activeLanguage) this.switchLanguage(s.languages.find(l => l !== lang));
    this.update(state => {
      state.languages = state.languages.filter(l => l !== lang);
      delete state.localeScreens[lang];
      delete state.localeFeature[lang];
    });
  }

  /**
   * Updates canvas preset dimensions for Google Play formats.
   * @param {string} presetName
   */
  setCanvasPreset(presetName) {
    const presets = {
      phone_standard: { width: 1080, height: 1920 },
      phone_modern: { width: 1080, height: 2400 },
      tablet_7: { width: 1200, height: 1920 },
      tablet_10: { width: 1600, height: 2560 }
    };

    const target = presets[presetName];
    if (!target) return;

    this.update(state => {
      state.canvasPreset = presetName;
      state.width = target.width;
      state.height = target.height;
    });
  }

  /**
   * Adds a new screen cloned from the active screen or template.
   */
  addScreen() {
    this.update(state => {
      // From the feature graphic, a new screen starts from the last screen instead
      const active = state.activeScreenId === FEATURE_ID ? state.screens.at(-1) : this.getActiveScreen();
      const newIndex = state.screens.length + 1;
      const newScreen = JSON.parse(JSON.stringify(active || state.screens[0]));
      newScreen.id = `screen-${Date.now()}`;
      newScreen.name = `Screen ${newIndex}: Feature`;
      newScreen.headline.text = `Amazing Feature ${newIndex}`;
      newScreen.subtitle.text = `Highlight what makes your app unique and powerful.`;
      state.screens.push(newScreen);
      state.activeScreenId = newScreen.id;
      state.activeElementId = null;
    });
  }

  /**
   * Duplicates an existing screen.
   * @param {string} screenId
   */
  duplicateScreen(screenId) {
    this.update(state => {
      const screen = state.screens.find(s => s.id === screenId);
      if (!screen) return;
      const clone = JSON.parse(JSON.stringify(screen));
      clone.id = `screen-${Date.now()}`;
      clone.name = `${screen.name} (Copy)`;
      const index = state.screens.findIndex(s => s.id === screenId);
      state.screens.splice(index + 1, 0, clone);
      state.activeScreenId = clone.id;
    });
  }

  /**
   * Deletes a screen by ID.
   * @param {string} screenId
   */
  deleteScreen(screenId) {
    if (this.state.screens.length <= 1) {
      alert('You must keep at least one screen in the project.');
      return;
    }
    this.update(state => {
      const idx = state.screens.findIndex(s => s.id === screenId);
      if (idx !== -1) {
        state.screens.splice(idx, 1);
        state.activeScreenId = state.screens[Math.max(0, idx - 1)].id;
        state.activeElementId = null;
      }
    });
  }

  /**
   * Loads a complete project state (e.g. from JSON file or template).
   * @param {Object} projectData
   */
  loadProject(projectData) {
    this.update(state => {
      Object.assign(state, projectData);
      // Projects saved before language copies existed become a single English copy
      if (!Array.isArray(projectData.languages)) {
        state.languages = ['en'];
        state.activeLanguage = 'en';
        state.localeScreens = {};
      }
      // Projects saved before the feature graphic editor get an empty one
      if (!projectData.feature) {
        state.feature = makeFeatureDoc();
        state.localeFeature = {};
      }
    });
  }
}

export const appStore = new Store();
