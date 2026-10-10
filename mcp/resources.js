/**
 * App Screen Studio - MCP Resources Provider
 * Exposes core design assets, schemas, templates, and Google Play Store guidelines as MCP resources.
 */

import { PLAY_STORE_TEMPLATES } from '../js/features/templates/templates.js';
import { DEVICE_PRESETS } from '../js/canvas/deviceFrames.js';
import { LISTING_PALETTES, SOLID_PALETTES } from '../js/features/theme/themeManager.js';
import { SHAPE_DEFINITIONS } from '../js/features/shapes/shapeLibrary.js';
import { POPULAR_FONTS } from '../js/features/text/fontManager.js';

export const RESOURCE_DEFINITIONS = [
  {
    uri: 'appscreen://templates',
    name: 'Curated Play Store Templates',
    description: 'Complete list of curated Play Store listing screenshot templates with full layout structure',
    mimeType: 'application/json'
  },
  {
    uri: 'appscreen://devices',
    name: 'Device Frame Specifications',
    description: 'Supported phone and tablet device frames, dimensions, bezels, and camera coordinates',
    mimeType: 'application/json'
  },
  {
    uri: 'appscreen://palettes',
    name: 'Color Palettes & Themes',
    description: 'Curated high-contrast screenshot color palettes and studio interface themes',
    mimeType: 'application/json'
  },
  {
    uri: 'appscreen://badges',
    name: 'Badges and Shapes Library',
    description: 'Ready-made Play Store badges, ratings, floating notification cards, and decorative shapes',
    mimeType: 'application/json'
  },
  {
    uri: 'appscreen://schema',
    name: 'AppScreen Project Schema',
    description: 'JSON Schema describing project structure, screen layers, typography, and localization format',
    mimeType: 'application/json'
  },
  {
    uri: 'appscreen://guidelines',
    name: 'Google Play Store Screenshot Guidelines',
    description: 'Official Google Play Store screenshot dimension requirements, policies, and conversion best practices',
    mimeType: 'text/markdown'
  },
  {
    uri: 'appscreen://fonts',
    name: 'Google Fonts & Language Recommendations',
    description: 'Available Google Fonts categorized by script (Arabic, Japanese, Korean, Latin, Cyrillic) and default recommendations',
    mimeType: 'application/json'
  }
];

/**
 * Returns JSON schema for AppScreen Studio projects.
 * @returns {Object} JSON schema
 */
function getProjectSchema() {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'AppScreenProject',
    type: 'object',
    required: ['projectName', 'canvasPreset', 'width', 'height', 'screens'],
    properties: {
      projectName: { type: 'string', description: 'Name of the application or project' },
      canvasPreset: {
        type: 'string',
        enum: ['phone_standard', 'phone_modern', 'tablet_7', 'tablet_10'],
        description: 'Target device dimension preset'
      },
      width: { type: 'number', enum: [1080, 1200, 1600] },
      height: { type: 'number', enum: [1920, 2400, 2560] },
      activeLanguage: { type: 'string', default: 'en' },
      languages: { type: 'array', items: { type: 'string' } },
      screens: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'name', 'headline', 'subtitle'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            background: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['solid', 'gradient'] },
                color1: { type: 'string' },
                color2: { type: 'string' },
                angle: { type: 'number' },
                solidColor: { type: 'string' }
              }
            },
            headline: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                fontFamily: { type: 'string' },
                fontSize: { type: 'number' },
                fontWeight: { type: 'string' },
                color: { type: 'string' },
                yOffset: { type: 'number' }
              }
            },
            subtitle: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                fontFamily: { type: 'string' },
                fontSize: { type: 'number' },
                fontWeight: { type: 'string' },
                color: { type: 'string' },
                yOffset: { type: 'number' }
              }
            },
            device: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['modern_phone', 'minimal', 'frameless', 'tablet'] },
                scale: { type: 'number' },
                x: { type: 'number' },
                y: { type: 'number' },
                rotation: { type: 'number' },
                color: { type: 'string' },
                image: { type: ['string', 'null'] }
              }
            },
            shapes: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      },
      feature: {
        type: 'object',
        properties: {
          id: { type: 'string', const: 'feature' },
          name: { type: 'string' },
          headline: { type: 'object' },
          subtitle: { type: 'object' },
          background: { type: 'object' }
        }
      }
    }
  };
}

/**
 * Returns Google Play Store screenshot guidelines markdown.
 * @returns {string} Markdown text
 */
function getPlayStoreGuidelines() {
  return `# Google Play Store Screenshot & Graphic Guidelines

## 1. Screenshot Requirements
- **Format:** JPEG or 24-bit PNG (no alpha).
- **Minimum count:** At least 4 screenshots per supported device category. Maximum 8 screenshots.
- **Dimensions:**
  - Standard Mobile: 1080 × 1920 (9:16) or 1080 × 2400 (9:20).
  - 7-inch Tablet: 1200 × 1920 (16:10).
  - 10-inch Tablet: 1600 × 2560 (16:10).
- **Aspect Ratio:** Minimum 16:9 or 9:16, max 1:2 or 2:1.
- **Minimum dimension:** 320px. Maximum dimension: 3840px.

## 2. Feature Graphic Requirements
- **Dimensions:** Exactly 1024 × 500 px.
- **Format:** JPEG or 24-bit PNG (no alpha).
- **Safety Margin:** Keep critical text and branding within the center 80% to prevent edge clipping across different display formats.
- **Content:** Highlight core brand value; do not display prominent CTA buttons or store rating claims without proper verification.

## 3. High-Converting Copy Best Practices
- **Headline:** Keep under 40-50 characters. Focus on user benefit, not technical jargon (e.g. "Effortless Budgeting" instead of "Financial Management System").
- **Subtitle:** Keep under 80-90 characters. Provide social proof or supportive context.
- **Visual Contrast:** High contrast between text color and background gradient is critical for mobile browsing.
- **Localization:** Localize all text into top target markets (Spanish, French, German, Arabic with RTL, Japanese, Hindi).
`;
}

/**
 * Reads resource content by URI.
 * @param {string} uri Resource URI
 * @returns {{ uri: string, mimeType: string, text: string }|null}
 */
export function readResource(uri) {
  try {
    switch (uri) {
      case 'appscreen://templates':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(PLAY_STORE_TEMPLATES, null, 2)
        };
      case 'appscreen://devices':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(DEVICE_PRESETS, null, 2)
        };
      case 'appscreen://palettes':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ listingPalettes: LISTING_PALETTES, solidPalettes: SOLID_PALETTES }, null, 2)
        };
      case 'appscreen://badges':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(SHAPE_DEFINITIONS, null, 2)
        };
      case 'appscreen://schema':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(getProjectSchema(), null, 2)
        };
      case 'appscreen://guidelines':
        return {
          uri,
          mimeType: 'text/markdown',
          text: getPlayStoreGuidelines()
        };
      case 'appscreen://fonts':
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            fonts: POPULAR_FONTS,
            languageDefaults: {
              ar: 'Cairo',
              ja: 'Noto Sans JP',
              ko: 'Noto Sans KR',
              zh: 'Noto Sans SC',
              ru: 'Montserrat',
              default: 'Plus Jakarta Sans'
            }
          }, null, 2)
        };
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error reading resource ${uri}:`, error);
    return null;
  }
}
