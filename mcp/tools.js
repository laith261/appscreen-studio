/**
 * App Screen Studio - MCP Tools Provider
 * Implements all callable tools for AI agents to create, inspect, modify,
 * validate, localize, and render Play Store screenshots.
 */

import fs from 'node:fs';
import path from 'node:path';
import { Store, makeFeatureDoc, makeDefaultShowcase } from '../js/state/store.js';
import { ensureScreenDevices, getLayerOrder, getLayerItem } from '../js/state/layers.js';
import {
  duplicateElement,
  deleteElement,
  reorderLayer,
  toggleLock,
  toggleHide,
  centerElement,
  resetElementRotation,
  addDeviceFrame,
  addShowcaseElement
} from '../js/ui/contextMenu.js';
import { PLAY_STORE_TEMPLATES } from '../js/features/templates/templates.js';
import { DEVICE_PRESETS } from '../js/canvas/deviceFrames.js';
import { LISTING_PALETTES, SOLID_PALETTES } from '../js/features/theme/themeManager.js';
import { SHAPE_DEFINITIONS } from '../js/features/shapes/shapeLibrary.js';
import { POPULAR_FONTS, getDefaultFontForLanguage, getRecommendedFontsForLanguage, isFontSupportedForLanguage } from '../js/features/text/fontManager.js';
import { renderScreenToSvg, renderFeatureGraphicToSvg } from './svgRenderer.js';

export const ACTIVE_SESSION_FILE = path.resolve(process.cwd(), '.active_project.json');

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
    description: 'Updates content, typography, colors, or mockup positioning of a specific screen or the feature graphic ("feature") in a project',
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
          description: 'Screen ID (e.g. "screen-1"), 0-based numeric index (e.g. "0"), or "feature" for the Feature Graphic'
        },
        screen_name: {
          type: 'string',
          description: 'Updated screen title'
        },
        headline_text: {
          type: 'string',
          description: 'Updated headline text'
        },
        headline_size: {
          type: 'number',
          description: 'Headline font size in px'
        },
        headline_x: {
          type: 'number',
          description: 'Headline horizontal X position'
        },
        headline_y: {
          type: 'number',
          description: 'Headline vertical Y offset'
        },
        subtitle_text: {
          type: 'string',
          description: 'Updated subtitle text'
        },
        subtitle_size: {
          type: 'number',
          description: 'Subtitle font size in px'
        },
        subtitle_x: {
          type: 'number',
          description: 'Subtitle horizontal X position'
        },
        subtitle_y: {
          type: 'number',
          description: 'Subtitle vertical Y offset'
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
        background_angle: {
          type: 'number',
          description: 'Gradient angle in degrees (0-360)'
        },
        device_x: {
          type: 'number',
          description: 'Device horizontal X center coordinate on canvas'
        },
        device_y: {
          type: 'number',
          description: 'Device vertical Y center coordinate on canvas'
        },
        device_rotation: {
          type: 'number',
          description: 'Device rotation in degrees (-45 to +45)'
        },
        device_scale: {
          type: 'number',
          description: 'Device scale multiplier (e.g. 0.92 for standard screens, 0.28 for feature graphic)'
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
        },
        remove_screenshot: {
          type: 'boolean',
          description: 'Set true to remove the screenshot from the device mockup'
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
    description: 'Adds a badge, rating seal, or floating card to a screen or the feature graphic ("feature") in the project',
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
          description: 'Screen ID, numeric index, or "feature" for the Feature Graphic'
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
        x_position: {
          type: 'number',
          description: 'Horizontal X coordinate on canvas (defaults to center)'
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
    description: 'Generates or updates the 1024x500 Google Play Store Feature Graphic document for the project. Supports optional 3-card screens showcase, phone mockup frame, and promotional badge.',
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
        },
        include_showcase: {
          type: 'boolean',
          description: 'Whether to add the 3-card screens showcase element on the right side of the feature graphic'
        },
        only_device: {
          type: 'boolean',
          description: 'When include_showcase is true, render only the phone mockups without screen backgrounds/text'
        },
        remove_background: {
          type: 'boolean',
          description: 'When include_showcase is true, make the mini-cards background transparent'
        },
        include_device: {
          type: 'boolean',
          description: 'Whether to add a standalone phone mockup frame onto the feature graphic'
        },
        device_type: {
          type: 'string',
          enum: ['modern_phone', 'minimal', 'frameless', 'tablet'],
          description: 'Device frame style when include_device is true'
        },
        device_color: {
          type: 'string',
          description: 'Device frame color hex when include_device is true'
        },
        device_scale: {
          type: 'number',
          description: 'Device scale on the 1024x500 feature graphic (default: 0.28)'
        },
        device_x: {
          type: 'number',
          description: 'Device horizontal X coordinate on the 1024x500 feature graphic (default: 720)'
        },
        device_y: {
          type: 'number',
          description: 'Device vertical Y coordinate on the 1024x500 feature graphic (default: 250)'
        },
        device_rotation: {
          type: 'number',
          description: 'Device rotation in degrees on the feature graphic (default: 0)'
        },
        screenshot_path: {
          type: 'string',
          description: 'Optional local file path to app screenshot image for the feature graphic device'
        },
        badge_label: {
          type: 'string',
          description: 'Optional promotional pill badge text on the feature graphic'
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
    description: 'Loads and parses an AppScreen project JSON file from disk and sets it as the active live project in the web studio',
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
  },
  {
    name: 'manage_layers',
    description: 'Performs layer and element operations on a screen or the feature graphic ("feature"), using the exact same engine as the web studio (add phone frame, duplicate, delete, reorder z-index, hide/show, lock/unlock, center, reset rotation).',
    inputSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Optional path to project JSON file (defaults to active live studio project)'
        },
        project_data: {
          type: 'object',
          description: 'Optional project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID, 0-based index (default: "0"), or "feature" for the Feature Graphic'
        },
        action: {
          type: 'string',
          enum: [
            'add_device',
            'duplicate',
            'duplicate_screen',
            'delete',
            'forward',
            'backward',
            'front',
            'back',
            'toggle_hide',
            'toggle_lock',
            'center',
            'reset_rotation',
            'remove_screenshot'
          ],
          description: 'Layer or screen operation to execute'
        },
        layer_id: {
          type: 'string',
          description: 'Target layer ID (e.g. "device", "headline", "subtitle", "showcase", or shape/device ID). Required for all actions except add_device and duplicate_screen.'
        },
        axis: {
          type: 'string',
          enum: ['x', 'y', 'both'],
          description: 'Centering axis when action is "center" (default: "both")'
        }
      }
    }
  },
  {
    name: 'manage_showcase',
    description: 'Adds, removes, or updates the 3-card screens showcase element on the 1024x500 Feature Graphic.',
    inputSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Optional path to project JSON file (defaults to active live studio project)'
        },
        project_data: {
          type: 'object',
          description: 'Optional project JSON object'
        },
        action: {
          type: 'string',
          enum: ['add', 'remove', 'update'],
          description: 'Whether to add, remove, or update the showcase element on the feature graphic'
        },
        x: {
          type: 'number',
          description: 'Horizontal X coordinate on the 1024x500 feature graphic'
        },
        y: {
          type: 'number',
          description: 'Vertical Y coordinate on the 1024x500 feature graphic'
        },
        scale: {
          type: 'number',
          description: 'Showcase scale multiplier (e.g. 1.0)'
        },
        rotation: {
          type: 'number',
          description: 'Rotation angle in degrees'
        },
        only_device: {
          type: 'boolean',
          description: 'Render only the phone frames without screen backgrounds/text'
        },
        remove_background: {
          type: 'boolean',
          description: 'Make the mini-cards background transparent'
        }
      }
    }
  },
  {
    name: 'add_text_layer',
    description: 'Adds a custom freeform text layer onto a screen or the feature graphic ("feature")',
    inputSchema: {
      type: 'object',
      required: ['text'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Optional path to project JSON file (defaults to active live studio project)'
        },
        project_data: {
          type: 'object',
          description: 'Optional project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID, 0-based index (default: "0"), or "feature" for the Feature Graphic'
        },
        text: {
          type: 'string',
          description: 'Text content for the layer'
        },
        font_family: {
          type: 'string',
          description: 'Font family name (default: "Plus Jakarta Sans")'
        },
        font_size: {
          type: 'number',
          description: 'Font size in px (default: 44)'
        },
        font_weight: {
          type: 'string',
          description: 'Font weight (default: "700")'
        },
        color: {
          type: 'string',
          description: 'Text color hex (default: "#ffffff")'
        },
        x: {
          type: 'number',
          description: 'Horizontal X coordinate on canvas'
        },
        y: {
          type: 'number',
          description: 'Vertical Y coordinate on canvas'
        },
        rotation: {
          type: 'number',
          description: 'Rotation angle in degrees (default: 0)'
        }
      }
    }
  },
  {
    name: 'add_image_layer',
    description: 'Adds a floating image or app logo layer onto any screen or the feature graphic ("feature") from a local file path or data URL',
    inputSchema: {
      type: 'object',
      required: ['image_path'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Optional path to project JSON file (defaults to active live studio project)'
        },
        project_data: {
          type: 'object',
          description: 'Optional project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID, 0-based index (default: "0"), or "feature" for the Feature Graphic'
        },
        image_path: {
          type: 'string',
          description: 'Local file path to PNG/JPG/WebP/SVG image or data:image/... URL'
        },
        x: {
          type: 'number',
          description: 'Horizontal X center coordinate on canvas'
        },
        y: {
          type: 'number',
          description: 'Vertical Y center coordinate on canvas'
        },
        width: {
          type: 'number',
          description: 'Display width in px (default: 240)'
        },
        height: {
          type: 'number',
          description: 'Display height in px (default: 240)'
        },
        scale: {
          type: 'number',
          description: 'Scale multiplier (default: 1)'
        },
        rotation: {
          type: 'number',
          description: 'Rotation in degrees (default: 0)'
        },
        border_radius: {
          type: 'number',
          description: 'Corner border radius in px (default: 24)'
        }
      }
    }
  },
  {
    name: 'update_element',
    description: 'Updates any specific layer or element by ID (any phone frame in multi-device layouts, badge, shape, floating card, text layer, image layer, headline, subtitle, or showcase) with exact inspector controls (position, size, scale, rotation, colors, typography, screenshot).',
    inputSchema: {
      type: 'object',
      required: ['layer_id'],
      properties: {
        file_path: {
          type: 'string',
          description: 'Optional path to project JSON file (defaults to active live studio project)'
        },
        project_data: {
          type: 'object',
          description: 'Optional project JSON object'
        },
        screen_index_or_id: {
          type: 'string',
          description: 'Screen ID, 0-based index (default: "0"), or "feature" for the Feature Graphic'
        },
        layer_id: {
          type: 'string',
          description: 'ID of the layer to modify (e.g. "device", "device-123", "headline", "subtitle", "showcase", or shape/text/image ID)'
        },
        x: { type: 'number', description: 'Horizontal X position' },
        y: { type: 'number', description: 'Vertical Y position' },
        width: { type: 'number', description: 'Width in px (for shapes/badges/images)' },
        height: { type: 'number', description: 'Height in px (for shapes/badges/images)' },
        scale: { type: 'number', description: 'Scale multiplier (e.g. 0.28 to 1.6)' },
        rotation: { type: 'number', description: 'Rotation in degrees' },
        opacity: { type: 'number', description: 'Opacity (0 to 1)' },
        text: { type: 'string', description: 'Text content (for headline, subtitle, text layer, or badge label)' },
        sublabel: { type: 'string', description: 'Secondary text (for ui_card badges)' },
        font_family: { type: 'string', description: 'Font family' },
        font_size: { type: 'number', description: 'Font size in px' },
        color: { type: 'string', description: 'Primary color / text color / device frame color hex' },
        fill_color: { type: 'string', description: 'Background fill color for badges/shapes' },
        device_type: {
          type: 'string',
          enum: ['modern_phone', 'minimal', 'frameless', 'tablet'],
          description: 'Device frame type if layer is a device'
        },
        screenshot_path: {
          type: 'string',
          description: 'Local file path to screenshot image if layer is a device'
        },
        remove_screenshot: {
          type: 'boolean',
          description: 'Remove screenshot image if layer is a device'
        }
      }
    }
  }
];

/**
 * Reads the shared active project session synced with the web editor, if available.
 * @returns {{ projectId: string, boundFile: string|null, updatedAt: number, source: string, projectData: Object }|null}
 */
export function readActiveSession() {
  try {
    if (fs.existsSync(ACTIVE_SESSION_FILE)) {
      const raw = fs.readFileSync(ACTIVE_SESSION_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.projectData && Array.isArray(parsed.projectData.screens)) {
        return parsed;
      }
      if (parsed && Array.isArray(parsed.screens)) {
        return {
          projectId: 'live-session',
          boundFile: null,
          updatedAt: Date.now(),
          source: 'disk',
          projectData: parsed
        };
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Writes the shared active project session so the web editor and MCP stay in real-time sync.
 * @param {Object} projectData
 * @param {Object} [meta]
 */
export function writeActiveSession(projectData, meta = {}) {
  try {
    const existing = readActiveSession();
    const payload = {
      projectId: meta.projectId || existing?.projectId || 'live-session',
      boundFile: meta.boundFile !== undefined ? meta.boundFile : (existing?.boundFile || null),
      updatedAt: Date.now(),
      source: meta.source || 'mcp',
      projectData
    };
    fs.writeFileSync(ACTIVE_SESSION_FILE, JSON.stringify(payload, null, 2), 'utf8');
    if (payload.boundFile) {
      const boundPath = path.resolve(process.cwd(), payload.boundFile);
      if (boundPath.startsWith(process.cwd())) {
        fs.writeFileSync(boundPath, JSON.stringify(projectData, null, 2), 'utf8');
      }
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Helper to obtain project data from argument, file path, or the live active studio session.
 * @param {Object} args
 * @returns {Object} Project data
 */
function resolveProject(args) {
  let project;
  if (args.project_data && typeof args.project_data === 'object') {
    project = args.project_data;
  } else if (args.file_path) {
    const raw = fs.readFileSync(path.resolve(process.cwd(), args.file_path), 'utf8');
    project = JSON.parse(raw);
  } else {
    const active = readActiveSession();
    if (active && active.projectData) {
      project = active.projectData;
      args._useActiveSession = true;
      args._boundFile = active.boundFile || null;
    } else {
      const store = new Store();
      project = store.getDefaultState();
      args._useActiveSession = true;
    }
  }

  const canvasWidth = project.width || 1080;
  if (Array.isArray(project.screens)) {
    project.screens.forEach(s => {
      if (!s) return;
      ensureScreenDevices(s, canvasWidth);
    });
  }
  if (project.feature && typeof project.feature === 'object') {
    ensureScreenDevices(project.feature, 1024);
  }

  return project;
}

/**
 * Helper to save modified project data to disk and sync with the active studio session.
 * @param {Object} args
 * @param {Object} projectData
 */
function maybeSaveProject(args, projectData) {
  if (args.file_path) {
    const fullPath = path.resolve(process.cwd(), args.file_path);
    fs.writeFileSync(fullPath, JSON.stringify(projectData, null, 2), 'utf8');
    writeActiveSession(projectData, { boundFile: args.file_path, source: 'mcp' });
  } else if (args._useActiveSession) {
    writeActiveSession(projectData, { boundFile: args._boundFile, source: 'mcp' });
  }
}

/**
 * Finds a screen by ID or index, or returns project.feature when identifier is "feature".
 * @param {Array<Object>} screens
 * @param {string|number} identifier
 * @param {Object} [project] Optional project object to resolve "feature"
 * @returns {{ screen: Object|null, index: number, isFeature?: boolean }}
 */
function findScreen(screens, identifier, project = null) {
  const idStr = String(identifier).trim();
  if (idStr.toLowerCase() === 'feature' && project) {
    if (!project.feature) project.feature = makeFeatureDoc();
    ensureScreenDevices(project.feature, 1024);
    return { screen: project.feature, index: -1, isFeature: true };
  }
  if (!Array.isArray(screens)) return { screen: null, index: -1 };
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
          const { screen: targetScreen } = findScreen(project.screens, args.screen_index_or_id, project);
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
            const defaultCanvasWidth = state.width || 1080;
            const defaultCenterX = Math.round(defaultCanvasWidth / 2);
            const defaultCenterY = 1180;

            state.screens = tpl.screens.map((s, idx) => {
              const deviceObj = {
                id: 'device',
                isDevice: true,
                type: s.device?.type || 'modern_phone',
                color: s.device?.color || '#0f172a',
                scale: s.device?.scale !== undefined ? s.device.scale : 0.92,
                x: s.device?.x !== undefined && s.device?.x !== null ? s.device.x : defaultCenterX,
                y: s.device?.y !== undefined && s.device?.y !== null ? s.device.y : defaultCenterY,
                rotation: s.device?.rotation || 0,
                shadowColor: s.device?.shadowColor || 'rgba(0, 0, 0, 0.45)',
                shadowBlur: s.device?.shadowBlur !== undefined ? s.device.shadowBlur : 50,
                shadowOffsetY: s.device?.shadowOffsetY !== undefined ? s.device.shadowOffsetY : 35,
                image: s.device?.image || null
              };

              return {
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
                device: deviceObj,
                devices: [deviceObj],
                shapes: Array.isArray(s.shapes) ? JSON.parse(JSON.stringify(s.shapes)) : []
              };
            });
            state.activeScreenId = 'screen-1';
          }
        } else if (Array.isArray(args.screens) && args.screens.length > 0) {
          const defaultCanvasWidth = state.width || 1080;
          const defaultCenterX = Math.round(defaultCanvasWidth / 2);
          const defaultCenterY = 1180;

          state.screens = args.screens.map((s, idx) => {
            const defaultDev = {
              id: 'device',
              isDevice: true,
              type: 'modern_phone',
              color: '#0f172a',
              scale: 0.92,
              x: defaultCenterX,
              y: defaultCenterY,
              rotation: 0,
              shadowColor: 'rgba(0, 0, 0, 0.45)',
              shadowBlur: 50,
              shadowOffsetY: 35,
              image: null
            };

            const incomingDev = (s.device && typeof s.device === 'object') ? s.device : {};
            const deviceObj = {
              ...defaultDev,
              ...incomingDev
            };

            // Deep-merge & enforce standard device defaults
            deviceObj.id = incomingDev.id || 'device';
            deviceObj.isDevice = true;
            if (deviceObj.x === undefined || deviceObj.x === null) deviceObj.x = defaultCenterX;
            if (deviceObj.y === undefined || deviceObj.y === null) deviceObj.y = defaultCenterY;
            if (deviceObj.scale === undefined || deviceObj.scale === null) deviceObj.scale = 0.92;
            if (deviceObj.rotation === undefined || deviceObj.rotation === null) deviceObj.rotation = 0;
            if (deviceObj.type === undefined || deviceObj.type === null) deviceObj.type = 'modern_phone';
            if (deviceObj.color === undefined || deviceObj.color === null) deviceObj.color = '#0f172a';
            if (deviceObj.shadowColor === undefined || deviceObj.shadowColor === null) deviceObj.shadowColor = 'rgba(0, 0, 0, 0.45)';
            if (deviceObj.shadowBlur === undefined || deviceObj.shadowBlur === null) deviceObj.shadowBlur = 50;
            if (deviceObj.shadowOffsetY === undefined || deviceObj.shadowOffsetY === null) deviceObj.shadowOffsetY = 35;

            // Automatically initialize and populate the devices array on each screen
            let devicesArr;
            if (Array.isArray(s.devices) && s.devices.length > 0) {
              devicesArr = s.devices.map((d, dIdx) => {
                const mergedD = {
                  ...defaultDev,
                  ...d,
                  id: d.id || (dIdx === 0 ? 'device' : `device-${dIdx + 1}`),
                  isDevice: true
                };
                if (mergedD.x === undefined || mergedD.x === null) mergedD.x = defaultCenterX;
                if (mergedD.y === undefined || mergedD.y === null) mergedD.y = defaultCenterY;
                return mergedD;
              });
              const primary = devicesArr.find(d => d.id === 'device') || devicesArr[0];
              Object.assign(deviceObj, primary);
            } else {
              devicesArr = [deviceObj];
            }

            return {
              id: s.id || `screen-${idx + 1}`,
              name: s.name || `Screen ${idx + 1}`,
              background: s.background || { type: 'solid', solidColor: '#0f172a' },
              headline: s.headline || { text: 'Headline', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 160 },
              subtitle: s.subtitle || { text: 'Subtitle description', fontSize: 32, fontWeight: '400', color: '#cbd5e1', yOffset: 340 },
              device: deviceObj,
              devices: devicesArr,
              shapes: s.shapes || []
            };
          });
        }

        if (args.output_file_path) {
          const fullPath = path.resolve(process.cwd(), args.output_file_path);
          fs.writeFileSync(fullPath, JSON.stringify(state, null, 2), 'utf8');
        }
        writeActiveSession(state, { boundFile: args.output_file_path || null, source: 'mcp' });

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
        const feat = project.feature;

        const summary = {
          projectName: project.projectName || 'Untitled',
          canvasPreset: project.canvasPreset || 'phone_standard',
          dimensions: `${project.width}x${project.height}`,
          totalScreens: screens.length,
          activeLanguage: project.activeLanguage || 'en',
          configuredLanguages: languages,
          hasFeatureGraphic: Boolean(feat && (
            (feat.headline && feat.headline.text) ||
            (feat.showcase && feat.showcase.visible !== false) ||
            (Array.isArray(feat.devices) && feat.devices.length > 0)
          )),
          featureGraphic: feat ? {
            headline: feat.headline?.text || '(empty)',
            subtitle: feat.subtitle?.text || '(empty)',
            hasShowcase: Boolean(feat.showcase && feat.showcase.visible !== false),
            devicesCount: Array.isArray(feat.devices) ? feat.devices.length : (feat.device ? 1 : 0),
            badgesCount: Array.isArray(feat.shapes) ? feat.shapes.length : 0
          } : null,
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
            devicesCount: Array.isArray(s.devices) ? s.devices.length : (s.device ? 1 : 0),
            deviceType: s.device?.type || 'modern_phone',
            deviceX: s.device?.x,
            deviceY: s.device?.y,
            deviceScale: s.device?.scale,
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
            id: 'device',
            isDevice: true,
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
        newScreen.devices = [newScreen.device];

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
        const { screen, index, isFeature } = findScreen(project.screens, args.screen_index_or_id, project);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${args.screen_index_or_id}"` }]
          };
        }

        if (args.screen_name !== undefined && !isFeature) {
          screen.name = args.screen_name;
        }

        if (args.headline_text !== undefined) {
          screen.headline.text = args.headline_text;
          if (args.headline_text && screen.headline.visible === false) screen.headline.visible = true;
          if (args.headline_text && screen.headline.hidden) screen.headline.hidden = false;
          if (args.headline_text && screen.headline.deleted) screen.headline.deleted = false;
        }
        if (args.headline_color) screen.headline.color = args.headline_color;
        if (args.headline_font) screen.headline.fontFamily = args.headline_font;
        if (args.headline_size !== undefined) screen.headline.fontSize = args.headline_size;
        if (args.headline_x !== undefined) screen.headline.x = args.headline_x;
        if (args.headline_y !== undefined) screen.headline.yOffset = args.headline_y;

        if (args.subtitle_text !== undefined) {
          screen.subtitle.text = args.subtitle_text;
          if (args.subtitle_text && screen.subtitle.visible === false) screen.subtitle.visible = true;
          if (args.subtitle_text && screen.subtitle.hidden) screen.subtitle.hidden = false;
          if (args.subtitle_text && screen.subtitle.deleted) screen.subtitle.deleted = false;
        }
        if (args.subtitle_color) screen.subtitle.color = args.subtitle_color;
        if (args.subtitle_font) screen.subtitle.fontFamily = args.subtitle_font;
        if (args.subtitle_size !== undefined) screen.subtitle.fontSize = args.subtitle_size;
        if (args.subtitle_x !== undefined) screen.subtitle.x = args.subtitle_x;
        if (args.subtitle_y !== undefined) screen.subtitle.yOffset = args.subtitle_y;

        if (args.color1 || args.color2 || args.background_angle !== undefined) {
          const c1 = args.color1 || screen.background?.color1 || screen.background?.solidColor || '#1e293b';
          const c2 = args.color2 || screen.background?.color2;
          const angle = args.background_angle !== undefined ? args.background_angle : (screen.background?.angle || 135);
          if (c2 || screen.background?.type === 'gradient') {
            screen.background = { type: 'gradient', color1: c1, color2: c2 || c1, angle, solidColor: c1 };
          } else {
            screen.background = { type: 'solid', solidColor: c1 };
          }
        }

        const hasDeviceUpdate = (
          args.device_x !== undefined ||
          args.device_y !== undefined ||
          args.device_rotation !== undefined ||
          args.device_scale !== undefined ||
          args.device_type !== undefined ||
          args.device_color !== undefined ||
          args.screenshot_path !== undefined ||
          args.remove_screenshot !== undefined
        );

        if (!isFeature || hasDeviceUpdate || screen.device) {
          const defaultCenterX = isFeature ? 512 : Math.round((project.width || 1080) / 2);
          const defaultCenterY = isFeature ? 250 : 1180;
          const defaultScale = isFeature ? 0.28 : 0.92;

          if (!screen.device) {
            screen.device = {
              id: 'device',
              isDevice: true,
              type: 'modern_phone',
              color: '#0f172a',
              scale: defaultScale,
              x: defaultCenterX,
              y: defaultCenterY,
              rotation: 0,
              shadowColor: 'rgba(0, 0, 0, 0.45)',
              shadowBlur: 50,
              shadowOffsetY: 35,
              image: null
            };
          }
          if (!screen.device.id) screen.device.id = 'device';
          screen.device.isDevice = true;
          if (screen.device.x === undefined || screen.device.x === null) screen.device.x = defaultCenterX;
          if (screen.device.y === undefined || screen.device.y === null) screen.device.y = defaultCenterY;
          if (args.device_x !== undefined) screen.device.x = args.device_x;
          if (args.device_y !== undefined) screen.device.y = args.device_y;
          if (args.device_rotation !== undefined) screen.device.rotation = args.device_rotation;
          if (args.device_scale !== undefined) screen.device.scale = args.device_scale;
          if (args.device_type) screen.device.type = args.device_type;
          if (args.device_color) screen.device.color = args.device_color;
          if (args.remove_screenshot) screen.device.image = null;

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

          if (!screen.devices || !Array.isArray(screen.devices) || screen.devices.length === 0) {
            screen.devices = [screen.device];
          } else {
            const primary = screen.devices.find(d => d.id === 'device') || screen.devices[0];
            Object.assign(primary, screen.device);
          }

          if (Array.isArray(screen.layerOrder) && !screen.layerOrder.includes(screen.device.id)) {
            screen.layerOrder.push(screen.device.id);
          }
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
        const { screen, index, isFeature } = findScreen(project.screens, args.screen_index_or_id, project);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${args.screen_index_or_id}"` }]
          };
        }

        if (!Array.isArray(screen.shapes)) screen.shapes = [];
        const docWidth = isFeature ? 1024 : (project.width || 1080);

        const badge = {
          id: `shape-${Date.now().toString(36)}-${screen.shapes.length + 1}`,
          type: args.badge_type || 'pill_badge',
          label: args.label,
          sublabel: args.sublabel || '',
          x: args.x_position !== undefined ? args.x_position : docWidth / 2,
          y: args.y_position || (isFeature ? 65 : 105),
          width: isFeature ? 320 : 440,
          height: args.sublabel ? 80 : (isFeature ? 48 : 64),
          fillColor: args.fill_color || '#ffffff',
          textColor: args.text_color || '#4f46e5',
          borderRadius: 32,
          shadow: true
        };

        screen.shapes.push(badge);
        if (Array.isArray(screen.layerOrder) && !screen.layerOrder.includes(badge.id)) {
          screen.layerOrder.push(badge.id);
        }
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

        feat.headline.text = args.headline_text || '';
        feat.headline.visible = Boolean(args.headline_text);
        if (args.subtitle_text !== undefined) {
          feat.subtitle.text = args.subtitle_text;
          feat.subtitle.visible = Boolean(args.subtitle_text);
        } else {
          feat.subtitle.text = '';
          feat.subtitle.visible = false;
        }

        const c1 = args.color1 || '#1e293b';
        const c2 = args.color2 || '#0f172a';
        feat.background = { type: 'gradient', color1: c1, color2: c2, angle: 135, solidColor: c1 };

        // Optional 3-card screens showcase
        if (args.include_showcase) {
          feat.showcase = makeDefaultShowcase();
          if (args.only_device !== undefined) feat.showcase.onlyDevice = Boolean(args.only_device);
          if (args.remove_background !== undefined) {
            feat.showcase.removeBackground = Boolean(args.remove_background);
            feat.showcase.transparentBg = Boolean(args.remove_background);
          }
          if (!feat.layerOrder.includes('showcase')) {
            feat.layerOrder.push('showcase');
          }
        }

        // Optional standalone phone mockup frame on feature graphic
        if (args.include_device) {
          let imageBase64 = null;
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
            imageBase64 = `data:${mime};base64,${imgBuffer.toString('base64')}`;
          }

          const featDevice = {
            id: 'device',
            isDevice: true,
            type: args.device_type || 'modern_phone',
            color: args.device_color || '#0f172a',
            scale: args.device_scale !== undefined ? args.device_scale : 0.28,
            x: args.device_x !== undefined ? args.device_x : 720,
            y: args.device_y !== undefined ? args.device_y : 250,
            rotation: args.device_rotation !== undefined ? args.device_rotation : 0,
            shadowColor: 'rgba(0, 0, 0, 0.45)',
            shadowBlur: 50,
            shadowOffsetY: 35,
            image: imageBase64
          };
          feat.device = featDevice;
          feat.devices = [featDevice];
          if (!feat.layerOrder.includes('device')) {
            feat.layerOrder.push('device');
          }
        }

        // Optional promotional badge on feature graphic
        if (args.badge_label) {
          const badge = {
            id: `badge-${Date.now().toString(36)}`,
            type: 'pill_badge',
            label: args.badge_label,
            x: 240,
            y: 90,
            width: 320,
            height: 46,
            fillColor: '#ffffff',
            textColor: '#4f46e5',
            borderRadius: 23,
            shadow: true
          };
          feat.shapes.push(badge);
          feat.layerOrder.push(badge.id);
        }

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
        const hasConfiguredFeature = project.feature && (
          project.feature.headline?.text ||
          (project.feature.showcase && project.feature.showcase.visible !== false) ||
          (Array.isArray(project.feature.devices) && project.feature.devices.length > 0)
        );
        if (!hasConfiguredFeature) {
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
        writeActiveSession(args.project_data, { boundFile: args.file_path, source: 'mcp' });
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
        const canvasWidth = data.width || 1080;
        if (Array.isArray(data.screens)) {
          data.screens.forEach(s => {
            if (!s) return;
            ensureScreenDevices(s, canvasWidth);
          });
        }
        if (data.feature && typeof data.feature === 'object') {
          ensureScreenDevices(data.feature, 1024);
        }
        writeActiveSession(data, { boundFile: args.file_path, source: 'mcp' });
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }

      case 'manage_layers': {
        const project = resolveProject(args);
        const targetIdOrIdx = args.screen_index_or_id !== undefined ? args.screen_index_or_id : (project.activeScreenId || '0');
        const { screen, isFeature } = findScreen(project.screens, targetIdOrIdx, project);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${targetIdOrIdx}"` }]
          };
        }

        const store = new Store();
        store.loadProject(project);
        store.setActiveScreen(isFeature ? 'feature' : screen.id);

        const action = args.action;
        const layerId = args.layer_id;

        if (action !== 'add_device' && action !== 'duplicate_screen' && !layerId) {
          return {
            isError: true,
            content: [{ type: 'text', text: `"layer_id" is required for action "${action}"` }]
          };
        }

        switch (action) {
          case 'add_device':
            addDeviceFrame(store);
            break;
          case 'duplicate_screen':
            if (!isFeature) store.duplicateScreen(screen.id);
            break;
          case 'duplicate':
            duplicateElement(store, layerId);
            break;
          case 'delete':
            deleteElement(store, layerId);
            break;
          case 'forward':
          case 'backward':
          case 'front':
          case 'back':
            reorderLayer(store, layerId, action);
            break;
          case 'toggle_hide':
            toggleHide(store, layerId);
            break;
          case 'toggle_lock':
            toggleLock(store, layerId);
            break;
          case 'center':
            centerElement(store, layerId, args.axis || 'both');
            break;
          case 'reset_rotation':
            resetElementRotation(store, layerId);
            break;
          case 'remove_screenshot': {
            store.update(st => {
              const doc = isFeature ? st.feature : st.screens.find(s => s.id === screen.id);
              const dev = getLayerItem(doc, layerId) || doc?.device;
              if (dev) dev.image = null;
            });
            break;
          }
          default:
            return {
              isError: true,
              content: [{ type: 'text', text: `Unsupported layer action: "${action}"` }]
            };
        }

        const updatedState = store.getState();
        Object.assign(project, updatedState);
        maybeSaveProject(args, project);

        const updatedDoc = isFeature ? project.feature : project.screens.find(s => s.id === screen.id);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              action,
              screenId: updatedDoc?.id,
              activeElementId: project.activeElementId,
              layerOrder: getLayerOrder(updatedDoc),
              devicesCount: Array.isArray(updatedDoc?.devices) ? updatedDoc.devices.length : 0,
              totalScreens: project.screens.length
            }, null, 2)
          }]
        };
      }

      case 'manage_showcase': {
        const project = resolveProject(args);
        if (!project.feature) project.feature = makeFeatureDoc();
        const store = new Store();
        store.loadProject(project);
        store.setActiveScreen('feature');

        const action = args.action;
        if (action === 'remove') {
          deleteElement(store, 'showcase');
        } else if (action === 'add' || action === 'update') {
          const state = store.getState();
          if (!state.feature.showcase) {
            addShowcaseElement(store);
          }
          store.update(st => {
            const sc = st.feature.showcase;
            if (!sc) return;
            sc.hidden = false;
            sc.visible = true;
            if (args.x !== undefined) sc.x = args.x;
            if (args.y !== undefined) sc.y = args.y;
            if (args.scale !== undefined) sc.scale = args.scale;
            if (args.rotation !== undefined) sc.rotation = args.rotation;
            if (args.only_device !== undefined) sc.onlyDevice = Boolean(args.only_device);
            if (args.remove_background !== undefined) {
              sc.removeBackground = Boolean(args.remove_background);
              sc.transparentBg = Boolean(args.remove_background);
            }
          });
        } else {
          return {
            isError: true,
            content: [{ type: 'text', text: `Unsupported showcase action: "${action}"` }]
          };
        }

        const updatedState = store.getState();
        Object.assign(project, updatedState);
        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              action,
              showcase: project.feature.showcase
            }, null, 2)
          }]
        };
      }

      case 'add_text_layer': {
        const project = resolveProject(args);
        const targetIdOrIdx = args.screen_index_or_id !== undefined ? args.screen_index_or_id : (project.activeScreenId || '0');
        const { screen, isFeature } = findScreen(project.screens, targetIdOrIdx, project);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${targetIdOrIdx}"` }]
          };
        }

        const docW = isFeature ? 1024 : (project.width || 1080);
        const docH = isFeature ? 500 : (project.height || 1920);
        const newId = `text_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const textLayer = {
          id: newId,
          type: 'text',
          text: args.text,
          fontFamily: args.font_family || 'Plus Jakarta Sans',
          fontSize: args.font_size || (isFeature ? 36 : 44),
          fontWeight: args.font_weight || '700',
          color: args.color || '#ffffff',
          align: 'center',
          lineHeight: 1.3,
          x: args.x !== undefined ? args.x : Math.round(docW / 2),
          y: args.y !== undefined ? args.y : Math.round(docH / 2 - 60),
          rotation: args.rotation || 0,
          scale: 1,
          hidden: false,
          locked: false
        };

        if (!Array.isArray(screen.shapes)) screen.shapes = [];
        screen.shapes.push(textLayer);
        if (!Array.isArray(screen.layerOrder)) screen.layerOrder = [...getLayerOrder(screen)];
        if (!screen.layerOrder.includes(newId)) screen.layerOrder.push(newId);

        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenId: screen.id,
              addedTextLayer: textLayer
            }, null, 2)
          }]
        };
      }

      case 'add_image_layer': {
        const project = resolveProject(args);
        const targetIdOrIdx = args.screen_index_or_id !== undefined ? args.screen_index_or_id : (project.activeScreenId || '0');
        const { screen, isFeature } = findScreen(project.screens, targetIdOrIdx, project);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${targetIdOrIdx}"` }]
          };
        }

        let srcDataUrl = args.image_path;
        if (!String(srcDataUrl).startsWith('data:')) {
          const resolvedPath = path.resolve(process.cwd(), args.image_path);
          if (!fs.existsSync(resolvedPath)) {
            return {
              isError: true,
              content: [{ type: 'text', text: `Image file not found: "${args.image_path}"` }]
            };
          }
          const ext = path.extname(resolvedPath).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : (ext === '.webp') ? 'image/webp' : (ext === '.svg') ? 'image/svg+xml' : 'image/png';
          const imgBuffer = fs.readFileSync(resolvedPath);
          srcDataUrl = `data:${mime};base64,${imgBuffer.toString('base64')}`;
        }

        const docW = isFeature ? 1024 : (project.width || 1080);
        const docH = isFeature ? 500 : (project.height || 1920);
        const newId = `img_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
        const imgLayer = {
          id: newId,
          type: 'image',
          label: path.basename(String(args.image_path)).slice(0, 24) || 'Image',
          src: srcDataUrl,
          originalSrc: srcDataUrl,
          x: args.x !== undefined ? args.x : Math.round(docW / 2),
          y: args.y !== undefined ? args.y : Math.round(docH / 2),
          width: args.width || (isFeature ? 160 : 240),
          height: args.height || (isFeature ? 160 : 240),
          scale: args.scale !== undefined ? args.scale : 1,
          rotation: args.rotation || 0,
          borderRadius: args.border_radius !== undefined ? args.border_radius : 24,
          opacity: 1,
          shadow: true,
          hidden: false,
          locked: false
        };

        if (!Array.isArray(screen.shapes)) screen.shapes = [];
        screen.shapes.push(imgLayer);
        if (!Array.isArray(screen.layerOrder)) screen.layerOrder = [...getLayerOrder(screen)];
        if (!screen.layerOrder.includes(newId)) screen.layerOrder.push(newId);

        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenId: screen.id,
              addedImageLayer: { ...imgLayer, src: '(data-url)', originalSrc: '(data-url)' }
            }, null, 2)
          }]
        };
      }

      case 'update_element': {
        const project = resolveProject(args);
        const targetIdOrIdx = args.screen_index_or_id !== undefined ? args.screen_index_or_id : (project.activeScreenId || '0');
        const { screen, isFeature } = findScreen(project.screens, targetIdOrIdx, project);
        if (!screen) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Screen not found: "${targetIdOrIdx}"` }]
          };
        }

        ensureScreenDevices(screen, isFeature ? 1024 : (project.width || 1080));
        const item = getLayerItem(screen, args.layer_id);
        if (!item) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Layer "${args.layer_id}" not found on screen "${screen.id}"` }]
          };
        }

        const isTextFixed = args.layer_id === 'headline' || args.layer_id === 'subtitle';
        const isDevice = args.layer_id === 'device' || (typeof args.layer_id === 'string' && args.layer_id.startsWith('device-')) || item.isDevice;

        if (args.x !== undefined) item.x = args.x;
        if (args.y !== undefined) {
          if (isTextFixed) item.yOffset = args.y;
          else item.y = args.y;
        }
        if (args.width !== undefined) item.width = args.width;
        if (args.height !== undefined) item.height = args.height;
        if (args.scale !== undefined) item.scale = args.scale;
        if (args.rotation !== undefined) item.rotation = args.rotation;
        if (args.opacity !== undefined) item.opacity = args.opacity;

        if (args.text !== undefined) {
          if (isTextFixed || item.type === 'text') item.text = args.text;
          else item.label = args.text;
        }
        if (args.sublabel !== undefined) item.sublabel = args.sublabel;
        if (args.font_family) item.fontFamily = args.font_family;
        if (args.font_size !== undefined) item.fontSize = args.font_size;

        if (args.color) {
          if (isDevice || isTextFixed || item.type === 'text') item.color = args.color;
          else item.textColor = args.color;
        }
        if (args.fill_color) item.fillColor = args.fill_color;

        if (isDevice) {
          if (args.device_type) item.type = args.device_type;
          if (args.remove_screenshot) item.image = null;
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
            item.image = `data:${mime};base64,${imgBuffer.toString('base64')}`;
          }
          if (screen.device && (args.layer_id === 'device' || screen.device.id === item.id)) {
            Object.assign(screen.device, item);
          }
        }

        maybeSaveProject(args, project);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenId: screen.id,
              layerId: args.layer_id,
              updatedElement: item
            }, null, 2)
          }]
        };
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
