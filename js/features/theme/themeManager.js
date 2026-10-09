/**
 * App Screen Generator - Theme Manager
 * Manages Studio Interface Themes (Dark, Light, Midnight) and
 * Curated Screenshot Color Palette Themes.
 */

import { activeDoc } from '../../state/store.js';

export const STUDIO_THEMES = [
  { id: 'dark', name: 'Dark Mode', icon: '🌙' },
  { id: 'light', name: 'Light Mode', icon: '☀️' },
  { id: 'midnight', name: 'Midnight Blue', icon: '🌌' }
];

export const LISTING_PALETTES = [
  {
    id: 'indigo_dream',
    name: 'Electric Indigo',
    color1: '#4f46e5',
    color2: '#7c3aed',
    angle: 135,
    headlineColor: '#ffffff',
    subtitleColor: '#e0e7ff',
    badgeFill: '#ffffff',
    badgeText: '#4f46e5',
    previewGradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)'
  },
  {
    id: 'cyber_emerald',
    name: 'Cyber Emerald',
    color1: '#090d16',
    color2: '#064e3b',
    angle: 160,
    headlineColor: '#34d399',
    subtitleColor: '#a7f3d0',
    badgeFill: 'rgba(52, 211, 153, 0.2)',
    badgeText: '#34d399',
    previewGradient: 'linear-gradient(135deg, #090d16, #064e3b)'
  },
  {
    id: 'sunset_coral',
    name: 'Sunset Coral',
    color1: '#e11d48',
    color2: '#ea580c',
    angle: 145,
    headlineColor: '#ffffff',
    subtitleColor: '#ffe4e6',
    badgeFill: '#ffffff',
    badgeText: '#e11d48',
    previewGradient: 'linear-gradient(135deg, #e11d48, #ea580c)'
  },
  {
    id: 'ocean_cyan',
    name: 'Ocean Cyan',
    color1: '#0369a1',
    color2: '#0f172a',
    angle: 150,
    headlineColor: '#38bdf8',
    subtitleColor: '#bae6fd',
    badgeFill: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#38bdf8',
    previewGradient: 'linear-gradient(135deg, #0369a1, #0f172a)'
  },
  {
    id: 'obsidian_gold',
    name: 'Obsidian & Gold',
    color1: '#111827',
    color2: '#78350f',
    angle: 150,
    headlineColor: '#fbbf24',
    subtitleColor: '#fde68a',
    badgeFill: '#fbbf24',
    badgeText: '#111827',
    previewGradient: 'linear-gradient(135deg, #111827, #78350f)'
  },
  {
    id: 'clean_pastel',
    name: 'Clean Light',
    color1: '#f8fafc',
    color2: '#e2e8f0',
    angle: 180,
    headlineColor: '#0f172a',
    subtitleColor: '#475569',
    badgeFill: '#0f172a',
    badgeText: '#ffffff',
    previewGradient: 'linear-gradient(135deg, #f8fafc, #e2e8f0)'
  }
];

export const SOLID_PALETTES = [
  {
    id: 'solid_dark_slate',
    name: 'Obsidian Slate',
    type: 'solid',
    solidColor: '#0f172a',
    headlineColor: '#ffffff',
    subtitleColor: '#94a3b8',
    badgeFill: '#38bdf8',
    badgeText: '#0f172a',
    previewGradient: '#0f172a'
  },
  {
    id: 'solid_pure_white',
    name: 'Clean White',
    type: 'solid',
    solidColor: '#ffffff',
    headlineColor: '#0f172a',
    subtitleColor: '#475569',
    badgeFill: '#4f46e5',
    badgeText: '#ffffff',
    previewGradient: '#ffffff'
  },
  {
    id: 'solid_midnight_navy',
    name: 'Midnight Navy',
    type: 'solid',
    solidColor: '#0a192f',
    headlineColor: '#64ffda',
    subtitleColor: '#8892b0',
    badgeFill: 'rgba(100, 255, 218, 0.2)',
    badgeText: '#64ffda',
    previewGradient: '#0a192f'
  },
  {
    id: 'solid_deep_emerald',
    name: 'Deep Emerald',
    type: 'solid',
    solidColor: '#064e3b',
    headlineColor: '#34d399',
    subtitleColor: '#a7f3d0',
    badgeFill: '#ffffff',
    badgeText: '#064e3b',
    previewGradient: '#064e3b'
  },
  {
    id: 'solid_crimson',
    name: 'Royal Crimson',
    type: 'solid',
    solidColor: '#881337',
    headlineColor: '#ffe4e6',
    subtitleColor: '#fecdd3',
    badgeFill: '#ffffff',
    badgeText: '#881337',
    previewGradient: '#881337'
  },
  {
    id: 'solid_royal_purple',
    name: 'Royal Purple',
    type: 'solid',
    solidColor: '#3b0764',
    headlineColor: '#e9d5ff',
    subtitleColor: '#d8b4fe',
    badgeFill: '#c084fc',
    badgeText: '#3b0764',
    previewGradient: '#3b0764'
  },
  {
    id: 'solid_warm_charcoal',
    name: 'Warm Charcoal',
    type: 'solid',
    solidColor: '#18181b',
    headlineColor: '#fbbf24',
    subtitleColor: '#fef3c7',
    badgeFill: '#fbbf24',
    badgeText: '#18181b',
    previewGradient: '#18181b'
  },
  {
    id: 'solid_electric_indigo',
    name: 'Electric Indigo',
    type: 'solid',
    solidColor: '#4f46e5',
    headlineColor: '#ffffff',
    subtitleColor: '#c7d2fe',
    badgeFill: '#ffffff',
    badgeText: '#4f46e5',
    previewGradient: '#4f46e5'
  }
];

export class ThemeManager {
  /**
   * Initializes theme manager and restores saved UI preference.
   */
  constructor() {
    this.currentStudioTheme = localStorage.getItem('appscreen_studio_theme') || 'dark';
    this.applyStudioTheme(this.currentStudioTheme);
  }

  /**
   * Applies the UI theme by setting data-theme attribute on <html> element.
   * @param {string} themeId 'dark' | 'light' | 'midnight'
   */
  applyStudioTheme(themeId) {
    if (!STUDIO_THEMES.some(t => t.id === themeId)) {
      themeId = 'dark';
    }
    this.currentStudioTheme = themeId;
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('appscreen_studio_theme', themeId);
    }
  }

  /**
   * Gets current theme object.
   * @returns {Object}
   */
  getCurrentStudioTheme() {
    return STUDIO_THEMES.find(t => t.id === this.currentStudioTheme) || STUDIO_THEMES[0];
  }

  /**
   * Applies a curated listing color palette to current screen or all screens.
   * @param {Object} store App store instance
   * @param {string} paletteId
   * @param {boolean} applyAllScreens
   */
  applyListingPalette(store, paletteId, applyAllScreens = false) {
    const allPalettes = [...SOLID_PALETTES, ...LISTING_PALETTES];
    const palette = allPalettes.find(p => p.id === paletteId);
    if (!palette) return;

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
        // Update first badge if present
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
  }
}

export const themeManager = new ThemeManager();
