/**
 * App Screen Studio - MCP Tools Provider
 * Implements all callable tools for AI agents to create, inspect, modify,
 * validate, localize, and render Play Store screenshots.
 */

import fs from 'node:fs';
import path from 'node:path';
import { Store, makeFeatureDoc } from '../js/state/store.js';
import { PLAY_STORE_TEMPLATES } from '../js/features/templates/templates.js';
import { DEVICE_PRESETS } from '../js/canvas/deviceFrames.js';
import { LISTING_PALETTES, SOLID_PALETTES } from '../js/features/theme/themeManager.js';
import { SHAPE_DEFINITIONS } from '../js/features/shapes/shapeLibrary.js';
import { POPULAR_FONTS, getDefaultFontForLanguage, getRecommendedFontsForLanguage, isFontSupportedForLanguage } from '../js/features/text/fontManager.js';
import { renderScreenToSvg, renderFeatureGraphicToSvg } from './svgRenderer.js';

export const TOOL_DEFINITIONS = [
  {
    name: 'list_templates',
    description: 'Lists all curated Google Play Store listing templates (e.g. Modern SaaS, Dark Fintech, Fitness, Food Delivery, Travel, AI Photo)',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional filter by category (e.g. Productivity, Finance, Fitness, Food)'
        }
      }
    }
  },
  {
    name: 'get_template',
    description: 'Retrieves complete layout data, screen definitions, and styling for a specific template ID',
    inputSchema: {
      type: 'object',
      required: ['template_id'],
      properties: {
        template_id: {
          type: 'string',
          description: 'The unique ID of the template (e.g. vibrant_saas, dark_fintech, bold_fitness, food_delivery, minimal_travel, ai_photo)'
        }
      }
    }
  },
  {
    name: 'list_devices',
    description: 'Lists all supported realistic device frames (modern phone, minimalist, frameless, tablet) and dimensions',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_palettes',
    description: 'Lists all curated screenshot color palettes (Electric Indigo, Cyber Emerald, Sunset Coral, Ocean Cyan, Obsidian & Gold, etc.)',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_fonts',
    description: 'Lists all available Google Fonts with their categories, scripts, and recommended default font for any language (Arabic, Japanese, Korean, Latin, Cyrillic, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        language_code: {
          type: 'string',
          description: 'Optional ISO language code (e.g. "ar", "ja", "en", "es") to filter and get recommended fonts for that language'
        }
      }
    }
  },
  {
    name: 'apply_palette',
    description: 'Applies a curated color palette across all screens or to a specific screen in the project',
    inputSchema: {
      type: 'object',
      required: ['palette_id'],
      properties: {
        file_path: { type: 'string', description: 'Path to project JSON file' },
        project_data: { type: 'object', description: 'Project JSON object' },
        palette_id: { type: 'string', description: 'Palette ID (e.g. "electric_indigo", "sunset_coral", "obsidian_gold", "cyber_emerald")' },
        screen_index_or_id: { type: 'string', description: 'Optional screen ID or index to apply to only that screen; omitted applies to ALL screens' }
      }
    }
  },
  {
    name: 'list_badges',
    description: 'Lists all available pre-designed Google Play badges, ratings, download counters, security pills, and floating notification cards',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional filter: "badges", "cards", or "shapes"'
        }
      }
    }
  },
  {
    name: 'create_project',
    description: 'Creates a complete, valid AppScreen Studio project ready for export or further customization. Can initialize from a template or create custom screens.',
    inputSchema: {
      type: 'object',
      properties: {
        project_name: {
          type: 'string',
          description: 'Name of the project or app'
        },
        template_id: {
          type: 'string',
          description: 'Optional ID of a template to base the project on'
        },
        canvas_preset: {
          type: 'string',
          enum: ['phone_standard', 'phone_modern', 'tablet_7', 'tablet_10'],
          description: 'Canvas dimension preset (default: phone_standard: 1080x1920)'
        },
        screens: {
          type: 'array',
          description: 'Custom list of screen objects if not using a template'
        },
        output_file_path: {
          type: 'string',
          description: 'Optional file path to write the created project JSON directly'
        }
      }
    }
  },
  {
    name: 'inspect_project',
    description: 'Inspects and analyzes an AppScreen project (from file path or JSON object), returning screen counts, dimensions, copy texts, languages, and compliance status',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Direct project JSON data if not reading from file'
        }
      }
    }
  },
  {
    name: 'add_screen',
    description: 'Adds a new screen to an existing project',
    inputSchema: {
      type: 'object',
      required: ['headline_text'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file to modify in place'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON data if working in-memory'
        },
        screen_name: {
          type: 'string',
          description: 'Human-readable screen title'
        },
        headline_text: {
          type: 'string',
          description: 'Bold main headline text (benefit-oriented, < 45 chars recommended)'
        },
        subtitle_text: {
          type: 'string',
          description: 'Supporting subtitle text'
        },
        background_type: {
          type: 'string',
          enum: ['gradient', 'solid'],
          description: 'Background type'
        },
        color1: {
          type: 'string',
          description: 'Primary or gradient start color (hex)'
        },
        color2: {
          type: 'string',
          description: 'Gradient end color (hex)'
        },
        device_type: {
          type: 'string',
          enum: ['modern_phone', 'minimal', 'frameless', 'tablet'],
          description: 'Device mockup frame type'
        },
        badge_label: {
          type: 'string',
          description: 'Optional badge or pill label (e.g. "★ 4.9 Rating" or "🚀 10M+ Downloads")'
        }
      }
    }
  },
  {
    name: 'update_screen',
    description: 'Updates content, typography, colors, or mockup positioning of a specific screen in a project',
    inputSchema: {
      type: 'object',
      required: ['screen_index_or_id'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID (e.g. "screen-1") or 0-based numeric index (e.g. "0")'
        },
        headline_text: {
          type: 'string',
          description: 'Updated headline text'
        },
        subtitle_text: {
          type: 'string',
          description: 'Updated subtitle text'
        },
        headline_color: {
          type: 'string',
          description: 'Headline text color hex'
        },
        subtitle_color: {
          type: 'string',
          description: 'Subtitle text color hex'
        },
        color1: {
          type: 'string',
          description: 'Background start color'
        },
        color2: {
          type: 'string',
          description: 'Background end color'
        },
        device_rotation: {
          type: 'number',
          description: 'Device rotation in degrees (-15 to +15)'
        },
        device_scale: {
          type: 'number',
          description: 'Device scale multiplier (e.g. 0.95)'
        },
        headline_font: {
          type: 'string',
          description: 'Headline font family (e.g. "Cairo", "Plus Jakarta Sans", "Noto Sans JP")'
        },
        subtitle_font: {
          type: 'string',
          description: 'Subtitle font family (e.g. "Tajawal", "Inter")'
        },
        device_type: {
          type: 'string',
          enum: ['modern_phone', 'minimal', 'frameless', 'tablet'],
          description: 'Device frame style'
        },
        device_color: {
          type: 'string',
          description: 'Device frame color hex'
        },
        screenshot_path: {
          type: 'string',
          description: 'Local file path to app screenshot image to attach inside the device mockup'
        }
      }
    }
  },
  {
    name: 'remove_screen',
    description: 'Removes a screen from a project by index or ID',
    inputSchema: {
      type: 'object',
      required: ['screen_index_or_id'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID or numeric index'
        }
      }
    }
  },
  {
    name: 'add_badge_to_screen',
    description: 'Adds a badge, rating seal, or floating card to a screen in the project',
    inputSchema: {
      type: 'object',
      required: ['screen_index_or_id', 'label'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID or numeric index'
        },
        badge_type: {
          type: 'string',
          enum: ['rating_badge', 'pill_badge', 'ui_card', 'stars_row', 'rounded_rect'],
          description: 'Badge type'
        },
        label: {
          type: 'string',
          description: 'Main label text (e.g. "★ 4.9 (50k+ Reviews)")'
        },
        sublabel: {
          type: 'string',
          description: 'Secondary text for ui_card'
        },
        fill_color: {
          type: 'string',
          description: 'Background fill color (hex or rgba)'
        },
        text_color: {
          type: 'string',
          description: 'Text color hex'
        },
        y_position: {
          type: 'number',
          description: 'Vertical Y coordinate on canvas (default: 105)'
        }
      }
    }
  },
  {
    name: 'localize_project',
    description: 'Adds or updates a full language copy for a project (e.g. Arabic with RTL, Spanish, French, German, Japanese)',
    inputSchema: {
      type: 'object',
      required: ['language_code', 'translations'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON object'
        },
        language_code: {
          type: 'string',
          description: 'ISO language code (e.g. "ar", "es", "fr", "de", "ja", "pt")'
        },
        translations: {
          type: 'array',
          description: 'List of translation objects per screen, with { screen_index: number, headline: string, subtitle: string, badge_label?: string }',
          items: {
            type: 'object',
            required: ['screen_index', 'headline'],
            properties: {
              screen_index: { type: 'number' },
              headline: { type: 'string' },
              subtitle: { type: 'string' },
              badge_label: { type: 'string' }
            }
          }
        },
        feature_translation: {
          type: 'object',
          description: 'Optional translation for feature graphic { headline: string, subtitle: string }',
          properties: {
            headline: { type: 'string' },
            subtitle: { type: 'string' }
          }
        }
      }
    }
  },
  {
    name: 'generate_feature_graphic',
    description: 'Generates or updates the 1024x500 Google Play Store Feature Graphic document for the project',
    inputSchema: {
      type: 'object',
      required: ['headline_text'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON object'
        },
        headline_text: {
          type: 'string',
          description: 'Promotional headline for the feature graphic (< 35 chars)'
        },
        subtitle_text: {
          type: 'string',
          description: 'Supporting marketing tagline (< 65 chars)'
        },
        color1: {
          type: 'string',
          description: 'Background gradient start color'
        },
        color2: {
          type: 'string',
          description: 'Background gradient end color'
        }
      }
    }
  },
  {
    name: 'validate_project',
    description: 'Runs strict Google Play Store ASO & compliance checks on an AppScreen project, identifying errors, dimension mismatches, character length warnings, and missing translations',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON object'
        }
      }
    }
  },
  {
    name: 'render_screen_svg',
    description: 'Renders an SVG string representation of a specific screen or the feature graphic, allowing agents to visually inspect designs without a browser',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to project JSON file'
        },
        project_data: {
          type: 'object',
          description: 'Project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID or index, or "feature" to render the feature graphic'
        },
        language_code: {
          type: 'string',
          description: 'Language code to render (e.g. "en" or "ar" for RTL)'
        },
        output_svg_path: {
          type: 'string',
          description: 'Optional file path to save the generated SVG'
        }
      }
    }
  },
  {
    name: 'save_project_file',
    description: 'Saves an AppScreen project JSON object to a designated file path in the workspace',
    inputSchema: {
      type: 'object',
      required: ['file_path', 'project_data'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Target file path (must end with .json)'
        },
        project_data: {
          type: 'object',
          description: 'AppScreen project object'
        }
      }
    }
  },
  {
    name: 'load_project_file',
    description: 'Loads and parses an AppScreen project JSON file from disk',
    inputSchema: {
      type: 'object',
      required: ['file_path'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to .json file to load'
        }
      }
    }
  }
];

/**
 * Helper to obtain project data from file path or directly from argument.
 * @param {Object} args
 * @returns {Object} Project data
 */
function resolveProject(args) {
  if (args.project_data && typeof args.project_data === 'object') {
    return args.project_data;
  }
  if (args.file_path) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), args.file_path), 'utf8');
    return JSON.parse(raw);
  }
  throw new Error('Either "project_data" or "file_path" must be provided');
}

/**
 * Helper to save modified project data if file_path was provided.
 * @param {Object} args
 * @param {Object} projectData
 */
function maybeSaveProject(args, projectData) {
  if (args.file_path) {
    const fullPath = path.resolve(process.cwd(), args.file_path);
    fs.writeFileSync(fullPath, JSON.stringify(projectData, null, 2), 'utf8');
  }
}

/**
 * Finds a screen by ID or index.
 * @param {Array<Object>} screens
 * @param {string|number} identifier
 * @returns {{ screen: Object|null, index: number }}
 */
function findScreen(screens, identifier) {
  if (!Array.isArray(screens)) return { screen: null, index: -1 };
  const idStr = String(identifier).trim();
  const num = parseInt(idStr, 10);
  if (!isNaN(num) && String(num) === idStr && num >= 0 && num < screens.length) {
    return { screen: screens[num], index: num };
  }
  const idx = screens.findIndex(s => s.id === idStr);
  if (idx !== -1) {
    return { screen: screens[idx], index: idx };
  }
  return { screen: null, index: -1 };
}

/**
 * Executes a tool by name with arguments.
 * @param {string} name Tool name
 * @param {Object} args Tool arguments
 * @returns {Promise<Object>} Result object for MCP tools/call
 */
export async function executeTool(name, args = {}) {
  try {
    switch (name) {
      case 'list_templates': {
        let templates = PLAY_STORE_TEMPLATES;
        if (args.category) {
          templates = templates.filter(t => t.category.toLowerCase() === args.category.toLowerCase());
        }
        const summaries = templates.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          badge: t.badge || null,
          screensCount: t.screens ? t.screens.length : 0,
          description: t.description
        }));
        return { content: [{ type: 'text', text: JSON.stringify(summaries, null, 2) }] };
      }

      case 'get_template': {
        const template = PLAY_STORE_TEMPLATES.find(t => t.id === args.template_id);
        if (!template) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Template not found: "${args.template_id}". Use list_templates to view available templates.` }]
          };
        }
        return { content: [{ type: 'text', text: JSON.stringify(template, null, 2) }] };
      }

      case 'list_devices': {
        return { content: [{ type: 'text', text: JSON.stringify(DEVICE_PRESETS, null, 2) }] };
      }

      case 'list_palettes': {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ listingPalettes: LISTING_PALETTES, solidPalettes: SOLID_PALETTES }, null, 2)
          }]
        };
      }

      case 'list_fonts': {
        const lang = args.language_code ? String(args.language_code).toLowerCase().trim() : null;
        let recommended = null;
        let defaultFont = null;
        if (lang) {
          defaultFont = getDefaultFontForLanguage(lang);
          recommended = getRecommendedFontsForLanguage(lang);
        }
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              targetLanguage: lang || 'all',
              defaultFontForLanguage: defaultFont,
              recommendedFonts: recommended,
              popularFonts: POPULAR_FONTS
            }, null, 2)
          }]
        };
      }

      case 'apply_palette': {
        const project = resolveProject(args);
        const palette = [...LISTING_PALETTES, ...SOLID_PALETTES].find(p => p.id === args.palette_id);
        if (!palette) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Palette not found: "${args.palette_id}". Use list_palettes to see available palettes.` }]
          };
        }

        const applyToScreen = (sc) => {
          if (palette.type === 'solid' || palette.solidColor) {
            sc.background = {
              type: 'solid',
              solidColor: palette.solidColor
            };
          } else {
            sc.background = {
              type: 'gradient',
              color1: palette.color1,
              color2: palette.color2,
              angle: palette.angle || 135,
              solidColor: palette.color1
            };
          }
          if (palette.headlineColor && sc.headline) {
            sc.headline.color = palette.headlineColor;
          }
          if (palette.subtitleColor && sc.subtitle) {
            sc.subtitle.color = palette.subtitleColor;
          }
          if (Array.isArray(sc.shapes) && sc.shapes.length > 0) {
            sc.shapes.forEach(shape => {
              if (palette.badgeFill) shape.fillColor = palette.badgeFill;
              if (palette.badgeText) shape.textColor = palette.badgeText;
            });
          }
        };

        let appliedCount = 0;
        if (args.screen_index_or_id !== undefined && args.screen_index_or_id !== null && args.screen_index_or_id !== '') {
          const { screen: targetScreen } = findScreen(project.screens, args.screen_index_or_id);
          if (!targetScreen) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Screen not found: "${args.screen_index_or_id}"` }]
            };
          }
          applyToScreen(targetScreen);
          appliedCount = 1;
        } else {
          (project.screens || []).forEach(applyToScreen);
          appliedCount = (project.screens || []).length;
        }

        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              paletteId: palette.id,
              paletteName: palette.name,
              screensUpdated: appliedCount
            }, null, 2)
          }]
        };
      }

      case 'list_badges': {
        let badges = SHAPE_DEFINITIONS;
        if (args.category) {
          badges = badges.filter(b => b.category.toLowerCase() === args.category.toLowerCase());
        }
        return { content: [{ type: 'text', text: JSON.stringify(badges, null, 2) }] };
      }

      case 'create_project': {
        const store = new Store();
        const state = store.getDefaultState();

        if (args.project_name) {
          state.projectName = args.project_name;
        }

        if (args.canvas_preset) {
          state.canvasPreset = args.canvas_preset;
          if (args.canvas_preset === 'phone_modern') {
            state.width = 1080;
            state.height = 2400;
          } else if (args.canvas_preset === 'tablet_7') {
            state.width = 1200;
            state.height = 1920;
          } else if (args.canvas_preset === 'tablet_10') {
            state.width = 1600;
            state.height = 2560;
          } else {
            state.width = 1080;
            state.height = 1920;
          }
        }

        if (args.template_id) {
          const tpl = PLAY_STORE_TEMPLATES.find(t => t.id === args.template_id);
          if (tpl && Array.isArray(tpl.screens)) {
            state.screens = tpl.screens.map((s, idx) => ({
              id: `screen-${idx + 1}`,
              name: s.name || `Screen ${idx + 1}`,
              background: JSON.parse(JSON.stringify(s.background || { type: 'solid', solidColor: '#1e293b' })),
              layout: 'header_top',
              headline: {
                text: s.headline?.text || '',
                fontFamily: s.headline?.fontFamily || 'Plus Jakarta Sans',
                fontSize: s.headline?.fontSize || 72,
                fontWeight: s.headline?.fontWeight || '800',
                color: s.headline?.color || '#ffffff',
                align: 'center',
                letterSpacing: 0,
                lineHeight: 1.2,
                yOffset: s.headline?.yOffset || 120
              },
              subtitle: {
                text: s.subtitle?.text || '',
                fontFamily: s.subtitle?.fontFamily || 'Inter',
                fontSize: s.subtitle?.fontSize || 34,
                fontWeight: s.subtitle?.fontWeight || '400',
                color: s.subtitle?.color || '#cbd5e1',
                align: 'center',
                letterSpacing: 0,
                lineHeight: 1.4,
                yOffset: s.subtitle?.yOffset || 310
              },
              device: {
                type: s.device?.type || 'modern_phone',
                color: s.device?.color || '#0f172a',
                scale: s.device?.scale !== undefined ? s.device.scale : 0.92,
                x: 540,
                y: s.device?.y !== undefined ? s.device.y : 1180,
                rotation: s.device?.rotation || 0,
                shadowColor: 'rgba(0, 0, 0, 0.45)',
                shadowBlur: 50,
                shadowOffsetY: 35,
                image: null
              },
              shapes: Array.isArray(s.shapes) ? JSON.parse(JSON.stringify(s.shapes)) : []
            }));
            state.activeScreenId = 'screen-1';
          }
        } else if (Array.isArray(args.screens) && args.screens.length > 0) {
          state.screens = args.screens.map((s, idx) => ({
            id: s.id || `screen-${idx + 1}`,
            name: s.name || `Screen ${idx + 1}`,
            background: s.background || { type: 'solid', solidColor: '#0f172a' },
            headline: s.headline || { text: 'Headline', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 160 },
            subtitle: s.subtitle || { text: 'Subtitle description', fontSize: 32, fontWeight: '400', color: '#cbd5e1', yOffset: 340 },
            device: s.device || { type: 'modern_phone', color: '#0f172a', scale: 0.92, x: 540, y: 1180, rotation: 0, image: null },
            shapes: s.shapes || []
          }));
        }

        if (args.output_file_path) {
          const fullPath = path.resolve(process.cwd(), args.output_file_path);
          fs.writeFileSync(fullPath, JSON.stringify(state, null, 2), 'utf8');
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              projectName: state.projectName,
              screensCount: state.screens.length,
              dimensions: `${state.width}x${state.height}`,
              outputFile: args.output_file_path || null,
              projectData: state
            }, null, 2)
          }]
        };
      }

      case 'inspect_project': {
        const project = resolveProject(args);
        const screens = project.screens || [];
        const languages = project.languages || ['en'];

        const summary = {
          projectName: project.projectName || 'Untitled',
          canvasPreset: project.canvasPreset || 'phone_standard',
          dimensions: `${project.width}x${project.height}`,
          totalScreens: screens.length,
          activeLanguage: project.activeLanguage || 'en',
          configuredLanguages: languages,
          hasFeatureGraphic: Boolean(project.feature && project.feature.headline && project.feature.headline.text),
          screens: screens.map((s, i) => ({
            index: i,
            id: s.id,
            name: s.name,
            headline: s.headline?.text || '(empty)',
            headlineChars: s.headline?.text ? s.headline.text.length : 0,
            subtitle: s.subtitle?.text || '(empty)',
            subtitleChars: s.subtitle?.text ? s.subtitle.text.length : 0,
            bgType: s.background?.type || 'solid',
            bgColor: s.background?.solidColor || s.background?.color1 || '#0f172a',
            badgesCount: s.shapes?.length || 0,
            deviceType: s.device?.type || 'modern_phone',
            hasCustomScreenshot: Boolean(s.device?.image)
          }))
        };

        return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
      }

      case 'add_screen': {
        const project = resolveProject(args);
        const screens = project.screens || [];
        const nextIdx = screens.length + 1;
        const newId = `screen-${Date.now().toString(36)}-${nextIdx}`;

        const bgType = args.background_type || (args.color2 ? 'gradient' : 'solid');
        const color1 = args.color1 || '#1e293b';
        const color2 = args.color2 || '#0f172a';

        const newScreen = {
          id: newId,
          name: args.screen_name || `Screen ${nextIdx}`,
          background: bgType === 'gradient'
            ? { type: 'gradient', color1, color2, angle: 135, solidColor: color1 }
            : { type: 'solid', solidColor: color1 },
          layout: 'header_top',
          headline: {
            text: args.headline_text || '',
            fontFamily: 'Plus Jakarta Sans',
            fontSize: 68,
            fontWeight: '800',
            color: '#ffffff',
            align: 'center',
            letterSpacing: 0,
            lineHeight: 1.2,
            yOffset: 140
          },
          subtitle: {
            text: args.subtitle_text || '',
            fontFamily: 'Inter',
            fontSize: 32,
            fontWeight: '400',
            color: '#cbd5e1',
            align: 'center',
            letterSpacing: 0,
            lineHeight: 1.4,
            yOffset: 330
          },
          device: {
            type: args.device_type || 'modern_phone',
            color: '#0f172a',
            scale: 0.92,
            x: (project.width || 1080) / 2,
            y: 1180,
            rotation: 0,
            shadowColor: 'rgba(0, 0, 0, 0.45)',
            shadowBlur: 50,
            shadowOffsetY: 35,
            image: null
          },
          shapes: []
        };

        if (args.badge_label) {
          newScreen.shapes.push({
            id: `badge-${Date.now().toString(36)}`,
            type: 'pill_badge',
            label: args.badge_label,
            x: (project.width || 1080) / 2,
            y: 95,
            width: 440,
            height: 60,
            fillColor: '#ffffff',
            textColor: '#4f46e5',
            borderRadius: 30
          });
        }

        screens.push(newScreen);
        project.screens = screens;
        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenId: newId,
              screenIndex: screens.length - 1,
              totalScreens: screens.length,
              screen: newScreen
            }, null, 2)
          }]
        };
      }

      case 'update_screen': {
        const project = resolveProject(args);
        const { screen, index } = findScreen(project.screens, args.screen_index_or_id);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${args.screen_index_or_id}"` }]
          };
        }

        if (args.headline_text !== undefined) screen.headline.text = args.headline_text;
        if (args.headline_color) screen.headline.color = args.headline_color;
        if (args.headline_font) screen.headline.fontFamily = args.headline_font;

        if (args.subtitle_text !== undefined) screen.subtitle.text = args.subtitle_text;
        if (args.subtitle_color) screen.subtitle.color = args.subtitle_color;
        if (args.subtitle_font) screen.subtitle.fontFamily = args.subtitle_font;

        if (args.color1 || args.color2) {
          const c1 = args.color1 || screen.background?.color1 || screen.background?.solidColor || '#1e293b';
          const c2 = args.color2 || screen.background?.color2;
          if (c2) {
            screen.background = { type: 'gradient', color1: c1, color2: c2, angle: screen.background?.angle || 135, solidColor: c1 };
          } else {
            screen.background = { type: 'solid', solidColor: c1 };
          }
        }

        if (!screen.device) screen.device = { type: 'modern_phone', scale: 0.9, rotation: 0, image: null };
        if (args.device_rotation !== undefined) screen.device.rotation = args.device_rotation;
        if (args.device_scale !== undefined) screen.device.scale = args.device_scale;
        if (args.device_type) screen.device.type = args.device_type;
        if (args.device_color) screen.device.color = args.device_color;

        if (args.screenshot_path) {
          const resolvedPath = path.resolve(process.cwd(), args.screenshot_path);
          if (!fs.existsSync(resolvedPath)) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Screenshot file not found: "${args.screenshot_path}"` }]
            };
          }
          const ext = path.extname(resolvedPath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : (ext === '.webp') ? 'image/webp' : 'image/png';
          const imgBuffer = fs.readFileSync(resolvedPath);
          screen.device.image = `data:${mime};base64,${imgBuffer.toString('base64')}`;
        }

        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenIndex: index,
              screenId: screen.id,
              screen
            }, null, 2)
          }]
        };
      }

      case 'remove_screen': {
        const project = resolveProject(args);
        const { screen, index } = findScreen(project.screens, args.screen_index_or_id);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${args.screen_index_or_id}"` }]
          };
        }

        project.screens.splice(index, 1);
        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              removedScreenId: screen.id,
              remainingScreens: project.screens.length
            }, null, 2)
          }]
        };
      }

      case 'add_badge_to_screen': {
        const project = resolveProject(args);
        const { screen, index } = findScreen(project.screens, args.screen_index_or_id);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${args.screen_index_or_id}"` }]
          };
        }

        if (!Array.isArray(screen.shapes)) screen.shapes = [];

        const badge = {
          id: `shape-${Date.now().toString(36)}-${screen.shapes.length + 1}`,
          type: args.badge_type || 'pill_badge',
          label: args.label,
          sublabel: args.sublabel || '',
          x: (project.width || 1080) / 2,
          y: args.y_position || 105,
          width: 440,
          height: args.sublabel ? 80 : 64,
          fillColor: args.fill_color || '#ffffff',
          textColor: args.text_color || '#4f46e5',
          borderRadius: 32,
          shadow: true
        };

        screen.shapes.push(badge);
        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenIndex: index,
              screenId: screen.id,
              addedBadge: badge
            }, null, 2)
          }]
        };
      }

      case 'localize_project': {
        const project = resolveProject(args);
        const lang = String(args.language_code).toLowerCase().trim();

        if (!Array.isArray(project.languages)) project.languages = ['en'];
        if (!project.languages.includes(lang)) {
          project.languages.push(lang);
        }

        if (!project.localeScreens) project.localeScreens = {};

        // Clone active screens as base for localization
        const baseScreens = JSON.parse(JSON.stringify(project.screens || []));

        if (Array.isArray(args.translations)) {
          for (const item of args.translations) {
            const idx = item.screen_index;
            if (idx >= 0 && idx < baseScreens.length) {
              const sc = baseScreens[idx];
              if (item.headline) sc.headline.text = item.headline;
              if (item.subtitle) sc.subtitle.text = item.subtitle;
              if (item.badge_label && sc.shapes && sc.shapes.length > 0) {
                sc.shapes[0].label = item.badge_label;
              }
              // Adjust alignment for RTL languages
              if (lang === 'ar') {
                sc.headline.fontFamily = 'Cairo';
                sc.subtitle.fontFamily = 'Cairo';
              }
            }
          }
        }

        project.localeScreens[lang] = baseScreens;

        if (args.feature_translation && project.feature) {
          if (!project.localeFeature) project.localeFeature = {};
          const featCopy = JSON.parse(JSON.stringify(project.feature));
          if (args.feature_translation.headline) featCopy.headline.text = args.feature_translation.headline;
          if (args.feature_translation.subtitle) featCopy.subtitle.text = args.feature_translation.subtitle;
          project.localeFeature[lang] = featCopy;
        }

        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              languageAdded: lang,
              allLanguages: project.languages,
              localizedScreensCount: baseScreens.length
            }, null, 2)
          }]
        };
      }

      case 'generate_feature_graphic': {
        const project = resolveProject(args);
        const feat = makeFeatureDoc();

        feat.headline.text = args.headline_text;
        if (args.subtitle_text) feat.subtitle.text = args.subtitle_text;

        const c1 = args.color1 || '#1e293b';
        const c2 = args.color2 || '#0f172a';
        feat.background = { type: 'gradient', color1: c1, color2: c2, angle: 135, solidColor: c1 };

        project.feature = feat;
        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              featureGraphic: feat
            }, null, 2)
          }]
        };
      }

      case 'validate_project': {
        const project = resolveProject(args);
        const screens = project.screens || [];
        const issues = [];
        const warnings = [];

        // Dimension verification
        const validDimensions = [
          { w: 1080, h: 1920 },
          { w: 1080, h: 2400 },
          { w: 1200, h: 1920 },
          { w: 1600, h: 2560 }
        ];
        const dimMatch = validDimensions.some(d => d.w === project.width && d.h === project.height);
        if (!dimMatch) {
          issues.push(`Unsupported Play Store dimensions: ${project.width}x${project.height}. Must be 1080x1920, 1080x2400, 1200x1920, or 1600x2560.`);
        }

        // Screen count checks
        if (screens.length < 4) {
          issues.push(`Google Play requires at least 4 screenshots (current: ${screens.length}). Add more screens to comply.`);
        } else if (screens.length > 8) {
          warnings.push(`Google Play allows a maximum of 8 screenshots per device type (current: ${screens.length}).`);
        }

        // Screen quality checks
        screens.forEach((s, idx) => {
          const num = idx + 1;
          const hl = s.headline?.text || '';
          const sub = s.subtitle?.text || '';

          if (!hl.trim()) {
            issues.push(`Screen ${num} is missing headline text.`);
          } else if (hl.length > 55) {
            warnings.push(`Screen ${num} headline is ${hl.length} chars (recommend under 45 chars for mobile readability).`);
          }

          if (sub.length > 100) {
            warnings.push(`Screen ${num} subtitle is ${sub.length} chars (recommend under 85 chars).`);
          }

          if (!s.device?.image) {
            warnings.push(`Screen ${num} does not have a real screenshot uploaded yet (device image is null).`);
          }
        });

        // Localization completeness checks
        const languages = project.languages || ['en'];
        if (languages.length > 1 && project.localeScreens) {
          languages.forEach(lang => {
            if (lang !== project.activeLanguage) {
              const locScreens = project.localeScreens[lang];
              if (!Array.isArray(locScreens) || locScreens.length !== screens.length) {
                warnings.push(`Language "${lang}" does not have all screens localized.`);
              }
            }
          });
        }

        // Feature Graphic checks
        if (!project.feature || !project.feature.headline?.text) {
          warnings.push('Feature Graphic is not configured. Google Play requires a 1024x500 Feature Graphic to publish.');
        }

        const score = Math.max(0, Math.min(100, 100 - issues.length * 25 - warnings.length * 5));

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              isValidForPlayStore: issues.length === 0,
              complianceScore: `${score}%`,
              issues,
              warnings,
              screensCount: screens.length,
              languages
            }, null, 2)
          }]
        };
      }

      case 'render_screen_svg': {
        const project = resolveProject(args);
        const target = args.screen_index_or_id || '0';
        let svg = '';

        const lang = (args.language_code || project.activeLanguage || 'en').toLowerCase().trim();
        const screens = (lang !== (project.activeLanguage || 'en') && project.localeScreens && Array.isArray(project.localeScreens[lang]))
          ? project.localeScreens[lang]
          : (project.screens || []);

        if (String(target).toLowerCase() === 'feature') {
          const feat = (lang !== (project.activeLanguage || 'en') && project.localeFeature && project.localeFeature[lang])
            ? project.localeFeature[lang]
            : (project.feature || makeFeatureDoc());
          svg = renderFeatureGraphicToSvg(feat, screens);
        } else {
          const { screen } = findScreen(screens, target);
          if (!screen) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Screen not found: "${target}"` }]
            };
          }
          const isRtl = lang === 'ar';
          svg = renderScreenToSvg(screen, {
            width: project.width || 1080,
            height: project.height || 1920,
            isRtl
          });
        }

        if (args.output_svg_path) {
          const fullPath = path.resolve(process.cwd(), args.output_svg_path);
          fs.writeFileSync(fullPath, svg, 'utf8');
        }

        return {
          content: [{
            type: 'text',
            text: args.output_svg_path
              ? `SVG successfully rendered and saved to ${args.output_svg_path}`
              : svg
          }]
        };
      }

      case 'save_project_file': {
        if (!args.file_path || !args.project_data) {
          return {
            isError: true,
            content: [{ type: 'text', text: 'Both file_path and project_data are required' }]
          };
        }
        const fullPath = path.resolve(process.cwd(), args.file_path);
        fs.writeFileSync(fullPath, JSON.stringify(args.project_data, null, 2), 'utf8');
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ success: true, savedTo: fullPath }, null, 2)
          }]
        };
      }

      case 'load_project_file': {
        const fullPath = path.resolve(process.cwd(), args.file_path);
        if (!fs.existsSync(fullPath)) {
          return {
            isError: true,
            content: [{ type: 'text', text: `File not found: ${args.file_path}` }]
          };
        }
        const raw = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(raw);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      default:
        return {
          isError: true,
          content: [{ type: 'text', text: `Unknown tool: ${name}` }]
        };
    }
  } catch (error) {
    console.error(`Error executing tool "${name}":`, error);
    return {
      isError: true,
      content: [{ type: 'text', text: `Error: ${error.message || String(error)}` }]
    };
  }
}
