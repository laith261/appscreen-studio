/**
 * App Screen Generator - High-Resolution Export Engine
 * Handles full-resolution PNG/JPEG exports, batch multi-screen downloads,
 * and project JSON import/export.
 */

import { renderDocCanvas } from './compose.js';
import { customAlert } from '../ui/dialog.js';

export class Exporter {
  /**
   * @param {Object} store
   */
  constructor(store) {
    this.store = store;
  }

  /**
   * Renders a given screen off-screen at full native resolution and returns an HTMLCanvasElement.
   * @param {Object} screen
   * @param {string} langCode
   * @returns {Promise<HTMLCanvasElement>}
   */
  async renderScreenOffscreen(screen, langCode = 'en') {
    return renderDocCanvas(this.store.getState(), screen, langCode);
  }

  /**
   * Downloads the active screen as a high-res PNG or JPEG image.
   * @param {string} format 'image/png' | 'image/jpeg'
   */
  async exportCurrentScreen(format = 'image/png') {
    const screen = this.store.getActiveScreen();
    if (!screen) return;

    const state = this.store.getState();
    const lang = state.activeLanguage || 'en';
    const canvas = await this.renderScreenOffscreen(screen, lang);

    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `${slugify(screen.name || 'play-store-screen')}-${lang}.${ext}`;

    const dataUrl = canvas.toDataURL(format, 0.95);
    downloadDataUrl(dataUrl, filename);
  }

  /**
   * Exports all screens sequentially for the current language.
   * @param {Function} onProgress
   */
  async exportAllScreens(onProgress = null) {
    const state = this.store.getState();
    const screens = state.screens;
    const lang = state.activeLanguage || 'en';

    for (let i = 0; i < screens.length; i++) {
      const screen = screens[i];
      const canvas = await this.renderScreenOffscreen(screen, lang);
      const filename = `screen_${i + 1}_${slugify(screen.name || 'slide')}_${lang}.png`;
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      downloadDataUrl(dataUrl, filename);

      if (onProgress) {
        onProgress(Math.round(((i + 1) / screens.length) * 100));
      }
      // Small pause between sequential browser downloads
      await new Promise(r => setTimeout(r, 300));
    }
  }

  /**
   * Exports every screen of every language copy as PNGs (file names carry the language code).
   * @param {Function} onProgress
   */
  async exportAllLanguages(onProgress = null) {
    const state = this.store.getState();
    const jobs = state.languages.flatMap(lang => this.store.getLanguageScreens(lang).map((screen, i) => ({ lang, screen, i })));
    for (let n = 0; n < jobs.length; n++) {
      const { lang, screen, i } = jobs[n];
      const canvas = await this.renderScreenOffscreen(screen, lang);
      downloadDataUrl(canvas.toDataURL('image/png'), `${lang}_screen_${i + 1}_${slugify(screen.name || 'slide')}.png`);
      if (onProgress) onProgress(Math.round(((n + 1) / jobs.length) * 100));
      await new Promise(r => setTimeout(r, 300));
    }
    for (const lang of state.languages) {
      const canvas = await this.renderScreenOffscreen(this.store.getLanguageFeature(lang), lang);
      downloadDataUrl(canvas.toDataURL('image/jpeg', 0.95), `${lang}_feature_graphic.jpg`);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  /**
   * Downloads the feature graphic of the language being edited as JPEG: Google Play rejects
   * feature graphics with an alpha channel, and canvas PNGs always have one.
   */
  async exportFeatureGraphic() {
    const state = this.store.getState();
    const canvas = await this.renderScreenOffscreen(state.feature, state.activeLanguage);
    downloadDataUrl(canvas.toDataURL('image/jpeg', 0.95), `${slugify(state.projectName || 'app')}-feature-graphic-${state.activeLanguage || 'en'}.jpg`);
  }

  /**
   * Saves the entire project state as a JSON file.
   */
  saveProjectFile() {
    const state = this.store.getState();
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `${slugify(state.projectName || 'app-screens')}-project.json`;
    downloadDataUrl(url, filename);
    URL.revokeObjectURL(url);
  }

  /**
   * Loads a project from a JSON file.
   * @param {File} file
   */
  loadProjectFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && data.screens) {
          this.store.loadProject(data);
        } else {
          customAlert({
            title: 'Import Error',
            message: 'Invalid project file format. The file is missing required screens data.',
            icon: 'error',
            type: 'danger'
          });
        }
      } catch (err) {
        customAlert({
          title: 'Import Failed',
          message: 'Failed to parse project JSON file. Please ensure it is a valid JSON export.',
          icon: 'error',
          type: 'danger'
        });
      }
    };
    reader.readAsText(file);
  }
}

/**
 * Triggers browser file download from a data URL or Blob URL.
 */
function downloadDataUrl(url, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Converts a text string into a clean filename slug.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}
