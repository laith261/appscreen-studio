/**
 * App Screen Studio - MCP Prompts Provider
 * Provides structured prompts for AI agents to craft high-converting Play Store screenshots,
 * multilingual localizations, and feature graphics.
 */

export const PROMPT_DEFINITIONS = [
  {
    name: 'generate_play_store_listing',
    description: 'Generates a complete 4-to-6 screen storyboard and visual styling for a Google Play Store listing based on app description',
    arguments: [
      {
        name: 'app_name',
        description: 'Name of the Android application',
        required: true
      },
      {
        name: 'app_category',
        description: 'Category (e.g. Productivity, Finance, Fitness, Social, Food, Education)',
        required: true
      },
      {
        name: 'key_features',
        description: 'List or summary of core features to showcase in the screenshots',
        required: true
      },
      {
        name: 'preferred_theme',
        description: 'Color scheme or vibe (e.g. Electric Indigo, Dark Fintech, Minimal Light, Vibrant)',
        required: false
      }
    ]
  },
  {
    name: 'localize_listing',
    description: 'Generates high-converting localized copy (headlines, subtitles, badges) for a target market/language',
    arguments: [
      {
        name: 'project_json',
        description: 'AppScreen project JSON or current screenshot text content',
        required: true
      },
      {
        name: 'target_language',
        description: 'Target language code or name (e.g. ar for Arabic, es for Spanish, fr for French, de for German, ja for Japanese)',
        required: true
      },
      {
        name: 'tone',
        description: 'Marketing tone (e.g. professional, exciting, punchy, playful)',
        required: false
      }
    ]
  },
  {
    name: 'create_feature_graphic',
    description: 'Crafts headline, subtitle, and layout parameters for the mandatory 1024x500 Google Play Store Feature Graphic',
    arguments: [
      {
        name: 'app_name',
        description: 'Name of the application',
        required: true
      },
      {
        name: 'brand_tagline',
        description: 'Core value proposition or slogan',
        required: true
      },
      {
        name: 'primary_color',
        description: 'Main brand hex color',
        required: false
      }
    ]
  }
];

/**
 * Returns formatted messages for a prompt execution.
 * @param {string} name Prompt name
 * @param {Object} args Prompt arguments
 * @returns {{ description: string, messages: Array<Object> }|null}
 */
export function getPrompt(name, args = {}) {
  try {
    switch (name) {
      case 'generate_play_store_listing': {
        const appName = args.app_name || 'App';
        const category = args.app_category || 'General';
        const features = args.key_features || '';
        const theme = args.preferred_theme || 'Electric Indigo';

        const promptText = `You are an expert Google Play Store ASO (App Store Optimization) and visual design specialist.
Design a cohesive, high-converting 4-to-6 screen screenshot storyboard for the app "${appName}" in the "${category}" category.

Features to highlight:
${features}

Preferred Theme: ${theme}

Please provide:
1. Screen-by-screen breakdown (Screen 1 to 5):
   - Headline: Maximum 45 characters, punchy and user-benefit focused.
   - Subtitle: Maximum 85 characters, providing supportive context or social proof.
   - Background gradient: Color 1 (hex), Color 2 (hex), and angle.
   - Device frame: Position (x, y), scale (0.92 to 1.05), and slight rotation (-3 to +3 deg).
   - Accents / Badges: e.g. rating stars, security seal, download pill, or floating card.
2. A ready-to-use JSON payload compatible with AppScreen Studio's 'create_project' tool.
3. Feature Graphic (1024x500) headline and subtitle proposition.`;

        return {
          description: `Play Store Screenshot Generation for ${appName}`,
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: promptText }
            }
          ]
        };
      }

      case 'localize_listing': {
        const targetLang = args.target_language || 'es';
        const tone = args.tone || 'engaging and professional';
        const projectData = args.project_json || '{}';

        const isArabic = targetLang.toLowerCase() === 'ar' || targetLang.toLowerCase().includes('arabic');
        const rtlNote = isArabic
          ? `NOTE: Arabic is an RTL (Right-to-Left) language. Ensure the copy reads naturally in Modern Standard Arabic and specify font Cairo with RTL text-align.`
          : '';

        const promptText = `You are a native localization copywriter specializing in mobile app marketing and App Store Optimization for "${targetLang}".
Translate and culturally adapt the following AppScreen Studio project screens with a ${tone} tone:

${projectData}

${rtlNote}

Requirements:
1. Do not perform literal translation; adapt idioms and marketing hooks to sound natural and persuasive in ${targetLang}.
2. Keep headlines concise (under 45 characters) so they fit nicely on mobile screens.
3. Return the exact JSON structure for the 'localeScreens.${targetLang}' key so it can be applied directly using 'localize_project'.`;

        return {
          description: `Localization to ${targetLang}`,
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: promptText }
            }
          ]
        };
      }

      case 'create_feature_graphic': {
        const appName = args.app_name || 'My App';
        const tagline = args.brand_tagline || 'Experience the future';
        const color = args.primary_color || '#4f46e5';

        const promptText = `You are an ASO specialist designing a Google Play Feature Graphic (1024 × 500 px) for "${appName}".
Tagline: "${tagline}"
Primary Brand Color: "${color}"

Remember Google Play guidelines:
- Dimensions: exactly 1024x500 px.
- Keep critical branding and copy centered in the safe zone (middle 80%).
- Avoid large fake download/rating badges or prices.
- Emphasize visual brand personality and product showcase.

Provide:
1. Refined headline (bold, prominent, < 30 chars).
2. Supporting subtitle (< 60 chars).
3. Complementary gradient background recommendation (Hex 1 and Hex 2).
4. An AppScreen 'generate_feature_graphic' tool call arguments.`;

        return {
          description: `Feature Graphic Design for ${appName}`,
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: promptText }
            }
          ]
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error resolving prompt ${name}:`, error);
    return null;
  }
}
