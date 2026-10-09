/**
 * App Screen Generator - Custom Saved Color Palettes Feature
 * Allows users to save customized color schemes (background solid or gradient,
 * typography colors, badge accents) as reusable color palettes that persist
 * in localStorage and can be applied anytime to any screen or project.
 */

import { activeDoc } from '../../state/store.js';

const STORAGE_KEY = 'appscreen_custom_saved_colors';

/**
 * Retrieves all custom saved color palettes from localStorage.
 * @returns {Array<Object>} List of saved color palette objects
 */
export function getSavedColors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read saved colors from localStorage:', error);
    return [];
  }
}

/**
 * Saves a list of color palettes to localStorage.
 * @param {Array<Object>} colors
 * @returns {boolean} Success status
 */
function persistColors(colors) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    return true;
  } catch (error) {
    console.error('Failed to save colors to localStorage:', error);
    return false;
  }
}

/**
 * Saves the current active screen color scheme as a reusable color palette.
 * @param {Object} store The state store
 * @param {string} [customName] Optional user-provided name
 * @returns {Object|null} The newly created color palette object, or null on error
 */
export function saveCurrentColors(store, customName = '') {
  try {
    const screen = store.getActiveScreen();
    if (!screen) return null;

    const saved = getSavedColors();
    const count = saved.length + 1;
    const name = (customName && customName.trim()) ? customName.trim() : `Custom Palette ${count}`;

    const bg = screen.background || { type: 'solid', solidColor: '#0f172a' };
    const isSolid = bg.type === 'solid';

    const solidColor = bg.solidColor || bg.color1 || '#0f172a';
    const color1 = bg.color1 || '#4f46e5';
    const color2 = bg.color2 || '#7c3aed';
    const angle = bg.angle || 135;

    const previewStyle = isSolid ? solidColor : `linear-gradient(${angle}deg, ${color1}, ${color2})`;

    const headlineColor = screen.headline?.color || '#ffffff';
    const subtitleColor = screen.subtitle?.color || '#cbd5e1';
    const firstShape = (screen.shapes || [])[0];
    const badgeFill = firstShape?.fillColor || (isSolid ? '#38bdf8' : '#ffffff');
    const badgeText = firstShape?.textColor || (isSolid ? '#0f172a' : '#4f46e5');

    const newPalette = {
      id: `custom_color_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      type: isSolid ? 'solid' : 'gradient',
      solidColor,
      color1,
      color2,
      angle,
      headlineColor,
      subtitleColor,
      badgeFill,
      badgeText,
      previewGradient: previewStyle,
      createdAt: Date.now(),
      badge: isSolid ? 'Solid' : 'Gradient',
      tagline: isSolid ? `Solid color: ${solidColor}` : `Gradient: ${color1} → ${color2}`
    };

    saved.unshift(newPalette);
    persistColors(saved);
    return newPalette;
  } catch (error) {
    console.error('Error saving current colors:', error);
    return null;
  }
}

/**
 * Deletes a saved color palette by ID.
 * @param {string} colorId
 * @returns {boolean} Success status
 */
export function deleteSavedColor(colorId) {
  try {
    const saved = getSavedColors();
    const updated = saved.filter(c => c.id !== colorId);
    persistColors(updated);
    return true;
  } catch (error) {
    console.error('Error deleting saved color palette:', error);
    return false;
  }
}

/**
 * Applies a custom saved color palette to the active screen or across all screens.
 * @param {Object} store State store
 * @param {string} colorId ID of the saved color palette
 * @param {boolean} [applyAllScreens=false] If true, applies across all project screens
 * @returns {boolean} Success status
 */
export function applyCustomColor(store, colorId, applyAllScreens = false) {
  try {
    const saved = getSavedColors();
    const palette = saved.find(c => c.id === colorId);
    if (!palette) return false;

    store.update(state => {
      const applyToScreen = (screen) => {
        if (palette.type === 'solid') {
          screen.background = {
            type: 'solid',
            solidColor: palette.solidColor || '#0f172a'
          };
        } else {
          screen.background = {
            type: 'gradient',
            color1: palette.color1,
            color2: palette.color2,
            angle: palette.angle || 135,
            solidColor: palette.color1
          };
        }

        if (screen.headline) {
          screen.headline.color = palette.headlineColor;
        }
        if (screen.subtitle) {
          screen.subtitle.color = palette.subtitleColor;
        }
        if (screen.shapes && screen.shapes.length > 0) {
          const badge = screen.shapes[0];
          badge.fillColor = palette.badgeFill;
          if (badge.textColor !== undefined) {
            badge.textColor = palette.badgeText;
          }
        }
      };

      if (applyAllScreens) {
        state.screens.forEach(screen => applyToScreen(screen));
      } else {
        const active = activeDoc(state);
        if (active) applyToScreen(active);
      }
    });

    return true;
  } catch (error) {
    console.error('Error applying custom color palette:', error);
    return false;
  }
}
