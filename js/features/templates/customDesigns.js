/**
 * App Screen Generator - Custom Saved Designs Feature
 * Allows users to save their customized canvas screen layouts (typography, positions,
 * device frames, shapes, and backgrounds) as reusable templates that persist in localStorage
 * and can be applied anytime to any screen or project.
 */

import { activeDoc } from '../../state/store.js';

const STORAGE_KEY = 'appscreen_custom_saved_designs';

/**
 * Retrieves all custom saved designs from localStorage.
 * @returns {Array<Object>} List of saved design templates
 */
export function getSavedDesigns() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read saved designs from localStorage:', error);
    return [];
  }
}

/**
 * Saves a list of designs to localStorage.
 * @param {Array<Object>} designs
 * @returns {boolean} Success status
 */
function persistDesigns(designs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    return true;
  } catch (error) {
    console.error('Failed to save designs to localStorage:', error);
    return false;
  }
}

/**
 * Generates a dynamic mini vector wireframe SVG representing the design's layout.
 * @param {Object} layout
 * @returns {string} SVG markup string
 */
export function generateDesignWireframeSvg(layout) {
  const bg = layout.background || {};
  const grad1 = bg.color1 || '#4f46e5';
  const grad2 = bg.color2 || '#7c3aed';
  const dev = layout.device || { scale: 0.92, y: 1180, rotation: 0 };
  const shapes = layout.shapes || [];

  // Map canvas Y coords (0..1920) to SVG coords (0..220)
  const mapY = (y) => Math.round((y / 1920) * 220);
  const devY = mapY(dev.y || 1180);
  const devRot = dev.rotation || 0;

  // Shapes elements
  const shapeElements = shapes.map((s, idx) => {
    const sy = mapY(s.y || 350);
    const sw = Math.round(((s.width || 400) / 1080) * 160);
    const sh = Math.max(10, Math.round(((s.height || 60) / 1920) * 220));
    const sx = Math.round(((s.x || 540) / 1080) * 160) - sw / 2;
    const fill = s.fillColor || '#ffffff';
    const opacity = s.opacity ?? 0.9;
    return `<rect x="${Math.max(8, sx)}" y="${Math.max(10, sy - sh / 2)}" width="${Math.min(144, sw)}" height="${sh}" rx="${sh / 2}" fill="${fill}" opacity="${opacity}" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>`;
  }).join('');

  const bgGradId = `svg_bg_${Math.floor(Math.random() * 1000000)}`;

  return `<svg viewBox="0 0 160 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${bgGradId}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${grad1}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${grad2}" stop-opacity="0.85"/>
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="156" height="216" rx="10" fill="url(#${bgGradId})" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    
    <!-- Headline & Subtitle wireframe bars -->
    <rect x="24" y="${mapY(layout.headline?.yOffset || 175)}" width="112" height="9" rx="4.5" fill="#ffffff" opacity="0.95"/>
    <rect x="36" y="${mapY(layout.subtitle?.yOffset || 360)}" width="88" height="7" rx="3.5" fill="#ffffff" opacity="0.75"/>
    
    <!-- Shapes / Badges -->
    ${shapeElements}
    
    <!-- Device mockup frame -->
    <g transform="translate(80, ${devY}) rotate(${devRot}) translate(-38, -68)">
      <rect x="3" y="6" width="70" height="136" rx="12" fill="#000000" opacity="0.35"/>
      <rect x="0" y="0" width="76" height="140" rx="12" fill="#0f172a" stroke="rgba(255,255,255,0.3)" stroke-width="1.8"/>
      <rect x="4" y="5" width="68" height="130" rx="9" fill="rgba(255,255,255,0.12)"/>
      <circle cx="38" cy="11" r="2.2" fill="#0f172a" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>
      <rect x="12" y="24" width="44" height="28" rx="4" fill="rgba(255,255,255,0.2)"/>
      <rect x="12" y="60" width="52" height="6" rx="2" fill="rgba(255,255,255,0.15)"/>
      <rect x="12" y="72" width="36" height="6" rx="2" fill="rgba(255,255,255,0.1)"/>
    </g>
  </svg>`;
}

/**
 * Saves the current active screen layout as a custom reusable design template.
 * @param {Object} store The state store
 * @param {string} [customName] Optional user-provided name
 * @returns {Object|null} The newly created design template object, or null on error
 */
export function saveCurrentDesign(store, customName = '') {
  try {
    const screen = store.getActiveScreen();
    if (!screen) return null;

    const saved = getSavedDesigns();
    const designNumber = saved.length + 1;
    const name = (customName && customName.trim()) ? customName.trim() : `Custom Design ${designNumber}`;

    // Extract layout data (detach image screenshot so template applies to any image)
    const layout = {
      background: JSON.parse(JSON.stringify(screen.background || { type: 'gradient', color1: '#4f46e5', color2: '#7c3aed' })),
      headline: {
        fontFamily: screen.headline?.fontFamily || 'Plus Jakarta Sans',
        fontSize: screen.headline?.fontSize || 68,
        fontWeight: screen.headline?.fontWeight || '800',
        color: screen.headline?.color || '#ffffff',
        yOffset: screen.headline?.yOffset || 175,
        align: screen.headline?.align || 'center',
        lineHeight: screen.headline?.lineHeight || 1.2
      },
      subtitle: {
        fontFamily: screen.subtitle?.fontFamily || 'Inter',
        fontSize: screen.subtitle?.fontSize || 32,
        fontWeight: screen.subtitle?.fontWeight || '400',
        color: screen.subtitle?.color || '#cbd5e1',
        yOffset: screen.subtitle?.yOffset || 360,
        align: screen.subtitle?.align || 'center',
        lineHeight: screen.subtitle?.lineHeight || 1.4
      },
      device: {
        type: screen.device?.type || 'modern_phone',
        color: screen.device?.color || '#0f172a',
        scale: screen.device?.scale ?? 0.92,
        y: screen.device?.y ?? 1180,
        rotation: screen.device?.rotation ?? 0
      },
      shapes: JSON.parse(JSON.stringify(screen.shapes || []))
    };

    const newDesign = {
      id: `custom_design_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      badge: 'Custom',
      tagline: `Saved layout with ${layout.shapes.length} shape${layout.shapes.length === 1 ? '' : 's'}`,
      description: `Custom saved design created on ${new Date().toLocaleDateString()}`,
      createdAt: Date.now(),
      layout,
      vectorSvg: generateDesignWireframeSvg(layout)
    };

    saved.unshift(newDesign);
    persistDesigns(saved);
    return newDesign;
  } catch (error) {
    console.error('Error saving current design:', error);
    return null;
  }
}

/**
 * Deletes a saved custom design by ID.
 * @param {string} designId
 * @returns {boolean} Success status
 */
export function deleteSavedDesign(designId) {
  try {
    const saved = getSavedDesigns();
    const updated = saved.filter(d => d.id !== designId);
    persistDesigns(updated);
    return true;
  } catch (error) {
    console.error('Error deleting saved design:', error);
    return false;
  }
}

/**
 * Applies a custom saved design to the active screen or across all screens.
 * @param {Object} store State store
 * @param {string} designId ID of the custom design
 * @param {boolean} [applyAllScreens=false] If true, applies across all project screens
 * @returns {boolean} Success status
 */
export function applyCustomDesign(store, designId, applyAllScreens = false) {
  try {
    const saved = getSavedDesigns();
    const design = saved.find(d => d.id === designId);
    if (!design || !design.layout) return false;

    const layout = design.layout;

    store.update(state => {
      const instantiateShapes = (shapes, prefix = 'custom') => {
        return (shapes || []).map((s, idx) => ({
          scale: 1,
          rotation: 0,
          opacity: 1,
          borderRadius: s.borderRadius || (s.type === 'pill_badge' || s.type === 'pill' ? 30 : 16),
          shadow: true,
          shadowBlur: 20,
          shadowOffsetY: 10,
          ...s,
          id: `shape-${prefix}-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`
        }));
      };

      if (applyAllScreens) {
        state.screens.forEach((screen, screenIdx) => {
          screen.background = JSON.parse(JSON.stringify(layout.background));
          if (layout.headline) {
            screen.headline.fontFamily = layout.headline.fontFamily;
            screen.headline.fontSize = layout.headline.fontSize;
            screen.headline.fontWeight = layout.headline.fontWeight;
            screen.headline.color = layout.headline.color;
            screen.headline.yOffset = layout.headline.yOffset;
          }
          if (layout.subtitle) {
            screen.subtitle.fontFamily = layout.subtitle.fontFamily;
            screen.subtitle.fontSize = layout.subtitle.fontSize;
            screen.subtitle.fontWeight = layout.subtitle.fontWeight;
            screen.subtitle.color = layout.subtitle.color;
            screen.subtitle.yOffset = layout.subtitle.yOffset;
          }
          if (layout.device) {
            screen.device.type = layout.device.type;
            screen.device.color = layout.device.color;
            screen.device.scale = layout.device.scale;
            screen.device.y = layout.device.y;
            screen.device.rotation = layout.device.rotation;
          }
          screen.shapes = instantiateShapes(layout.shapes, `all_${screenIdx}`);
        });

        const activeScreen = state.screens.find(s => s.id === state.activeScreenId) || state.screens[0];
        if (activeScreen?.shapes?.length > 0) {
          state.activeElementId = activeScreen.shapes[0].id;
        }
      } else {
        const active = activeDoc(state);
        if (!active) return;

        active.background = JSON.parse(JSON.stringify(layout.background));

        if (layout.headline) {
          active.headline.fontFamily = layout.headline.fontFamily;
          active.headline.fontSize = layout.headline.fontSize;
          active.headline.fontWeight = layout.headline.fontWeight;
          active.headline.color = layout.headline.color;
          active.headline.yOffset = layout.headline.yOffset;
        }

        if (layout.subtitle) {
          active.subtitle.fontFamily = layout.subtitle.fontFamily;
          active.subtitle.fontSize = layout.subtitle.fontSize;
          active.subtitle.fontWeight = layout.subtitle.fontWeight;
          active.subtitle.color = layout.subtitle.color;
          active.subtitle.yOffset = layout.subtitle.yOffset;
        }

        if (layout.device) {
          active.device.type = layout.device.type;
          active.device.color = layout.device.color;
          active.device.scale = layout.device.scale;
          active.device.y = layout.device.y;
          active.device.rotation = layout.device.rotation;
        }

        const newShapes = instantiateShapes(layout.shapes, 'single');
        active.shapes = newShapes;
        if (newShapes.length > 0) {
          state.activeElementId = newShapes[0].id;
        }
      }
    });

    return true;
  } catch (error) {
    console.error('Error applying custom design:', error);
    return false;
  }
}
