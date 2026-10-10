# AppScreen Studio — Model Context Protocol (MCP) Server 🤖📱

The **AppScreen Studio MCP Server** enables any AI agent (Claude Desktop, Cursor, Antigravity, Windsurf, Roo Code, Cline, VS Code Copilot, or custom Python/TypeScript agents) to programmatically inspect, generate, translate, validate, and render production-ready Google Play Store screenshots and feature graphics.

Built entirely with standard Node.js (ES Modules) over **stdio JSON-RPC 2.0** conforming to the **2024-11-05 MCP specification**, requiring **zero external npm dependencies**.

---

## 🚀 Quick Setup Guide

### 1. Claude Desktop
Add to your Claude Desktop configuration file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "appscreen": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/appscreen/mcp/server.js"]
    }
  }
}
```
*(Replace `/ABSOLUTE/PATH/TO/appscreen` with your local cloned repository directory)*.

---

### 2. Cursor IDE
Add to `.cursor/mcp.json` in your project root or configure via **Cursor Settings → Features → MCP → Add New MCP Server**:

```json
{
  "mcpServers": {
    "appscreen": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/appscreen/mcp/server.js"]
    }
  }
}
```

---

### 3. Antigravity / Windsurf / Roo Code / Cline
Configure an stdio MCP server with:
- **Server Name:** `appscreen`
- **Command:** `node`
- **Arguments:** `["/ABSOLUTE/PATH/TO/appscreen/mcp/server.js"]`

---

## 🛠️ Complete Tool Reference (19 Tools)

### Project Creation & Management

#### 1. `create_project`
Generates a new listing project with Google Play Store compliance presets or pre-populates from curated templates.
- **Arguments:**
  - `project_name` *(string)*: Name of the app or project.
  - `template_id` *(string, optional)*: ID of a curated template (e.g., `"vibrant_saas"`, `"dark_fintech"`, `"bold_fitness"`, `"food_delivery"`, `"minimal_travel"`, `"ai_photo"`).
  - `canvas_preset` *(string, optional)*: Target device preset: `"phone_standard"` (1080×1920), `"phone_modern"` (1080×2400), `"tablet_7"` (1200×1920), or `"tablet_10"` (1600×2560).
  - `output_file_path` *(string, optional)*: Path on disk to automatically save the created project JSON.

#### 2. `inspect_project`
Returns structured metadata, screen counts, headlines, character counts, color palettes, and compliance status.
- **Arguments:**
  - `file_path` *(string, optional)*: Path to project `.json` file on disk.
  - `project_data` *(object, optional)*: Project JSON object passed in memory.

#### 3. `save_project_file`
Saves an AppScreen project JSON object to a `.json` file in the workspace.
- **Arguments:**
  - `file_path` *(string, required)*: Target file path.
  - `project_data` *(object, required)*: AppScreen project object.

#### 4. `load_project_file`
Loads and parses an AppScreen project JSON file from disk.
- **Arguments:**
  - `file_path` *(string, required)*: Path to `.json` file.

---

### Screens & Layout Operations

#### 5. `add_screen`
Appends a new screenshot to the listing with full styling.
- **Arguments:**
  - `headline_text` *(string, optional)*: Main punchy marketing title (< 45 chars recommended).
  - `subtitle_text` *(string, optional)*: Supporting caption (< 85 chars recommended).
  - `background_type` *(string, optional)*: `"gradient"` or `"solid"`.
  - `color1` *(string, optional)*: Primary or gradient start color hex (e.g. `"#4f46e5"`).
  - `color2` *(string, optional)*: Gradient end color hex (e.g. `"#7c3aed"`).
  - `device_type` *(string, optional)*: `"modern_phone"`, `"minimal"`, `"frameless"`, or `"tablet"`.
  - `badge_label` *(string, optional)*: Floating badge/pill text (e.g. `"★ 4.9 Rating"`).

#### 6. `update_screen`
Modifies content, typography, colors, mockup frame styling, or embeds local screenshot images.
- **Arguments:**
  - `screen_index_or_id` *(string, required)*: Screen ID (e.g. `"screen-1"`) or 0-based numeric index (e.g. `"0"`).
  - `headline_text` *(string, optional)*: Updated headline text.
  - `headline_color` *(string, optional)*: Headline text hex color.
  - `headline_font` *(string, optional)*: Font family (e.g. `"Plus Jakarta Sans"`, `"Cairo"`).
  - `subtitle_text` *(string, optional)*: Updated subtitle text.
  - `subtitle_color` *(string, optional)*: Subtitle text hex color.
  - `subtitle_font` *(string, optional)*: Font family (e.g. `"Inter"`, `"Tajawal"`).
  - `color1` / `color2` *(string, optional)*: Background colors.
  - `device_rotation` *(number, optional)*: Device tilt angle in degrees (-15 to +15).
  - `device_scale` *(number, optional)*: Device mockup scale multiplier (e.g. `0.95`).
  - `device_type` *(string, optional)*: `"modern_phone"`, `"minimal"`, `"frameless"`, `"tablet"`.
  - `device_color` *(string, optional)*: Device frame color hex.
  - `screenshot_path` *(string, optional)*: Path to local image file (`.png`, `.jpg`, `.webp`) to embed inside the mockup.

#### 7. `remove_screen`
Deletes a screen from the project by index or ID.
- **Arguments:**
  - `screen_index_or_id` *(string, required)*: Screen ID or 0-based index.

#### 8. `add_badge_to_screen`
Adds a trust badge, rating seal, download counter, or floating card.
- **Arguments:**
  - `screen_index_or_id` *(string, required)*: Target screen ID or index.
  - `label` *(string, required)*: Main badge text (e.g. `"★ 4.9 (200k+ Reviews)"`).
  - `sublabel` *(string, optional)*: Secondary text for floating cards.
  - `badge_type` *(string, optional)*: `"rating_badge"`, `"pill_badge"`, `"ui_card"`, `"stars_row"`.
  - `fill_color` / `text_color` *(string, optional)*: Custom badge colors.

---

### Discovery & Curated Presets

#### 9. `list_templates`
Lists all curated listing templates with categories and descriptions.
- **Arguments:**
  - `category` *(string, optional)*: Filter by category (`Productivity`, `Finance`, `Fitness`, `Food`, etc.).

#### 10. `get_template`
Retrieves full screen layouts, typography, and color settings for a specific template.
- **Arguments:**
  - `template_id` *(string, required)*: Unique ID of the template.

#### 11. `list_devices`
Lists all realistic device mockup frame presets, aspect ratios, and dimensions.

#### 12. `list_palettes`
Lists all curated color palettes (Electric Indigo, Cyber Emerald, Sunset Coral, Ocean Cyan, Obsidian & Gold, Clean Light, etc.).

#### 13. `apply_palette`
Applies a curated color palette across all screens or to a specific screen in one command.
- **Arguments:**
  - `palette_id` *(string, required)*: Palette ID (e.g. `"cyber_emerald"`, `"indigo_dream"`, `"sunset_coral"`, `"obsidian_gold"`).
  - `screen_index_or_id` *(string, optional)*: Target a single screen, or omit to apply to the entire listing.

#### 14. `list_fonts`
Lists Google Fonts with categories, script support, and recommended default fonts per language.
- **Arguments:**
  - `language_code` *(string, optional)*: ISO language code (e.g. `"ar"`, `"ja"`, `"en"`, `"es"`).

#### 15. `list_badges`
Lists pre-designed badges, pills, trust seals, and floating cards.
- **Arguments:**
  - `category` *(string, optional)*: `"badges"`, `"cards"`, or `"shapes"`.

---

### Store Compliance & Rendering

#### 16. `localize_project`
Translates and localizes all screens and the feature graphic into any language with native RTL mirror layout and Arabic font switching (`Cairo`).
- **Arguments:**
  - `language_code` *(string, required)*: Target language (e.g. `"ar"`, `"es"`, `"fr"`, `"de"`, `"ja"`).
  - `translations` *(array, required)*: Array of translated items with `screen_index`, `headline`, `subtitle`, and optional `badge_label`.
  - `feature_translation` *(object, optional)*: Translated feature graphic headline and subtitle.

#### 17. `generate_feature_graphic`
Generates or updates the mandatory 1024×500 Google Play Feature Graphic.
- **Arguments:**
  - `headline_text` *(string, required)*: Main banner headline (< 35 chars).
  - `subtitle_text` *(string, optional)*: Supporting tagline (< 65 chars).
  - `color1` / `color2` *(string, optional)*: Gradient start and end colors.

#### 18. `validate_project`
Runs strict Google Play Store ASO & compliance audits. Returns issues, warnings, and a compliance score (0–100%).
- Checks:
  - Exact dimensions (1080×1920, 1080×2400, 1200×1920, 1600×2560).
  - Screen count requirement (minimum 4, maximum 8).
  - Headline (< 45 chars) and subtitle (< 85 chars) readability limits.
  - Presence of real screenshots.
  - Localization completeness across all configured languages.
  - Feature graphic availability.

#### 19. `render_screen_svg`
Renders a vector SVG string of any screen or feature graphic for instant visual inspection without requiring a browser or canvas.
- **Arguments:**
  - `screen_index_or_id` *(string, optional)*: Screen ID/index, or `"feature"` for feature graphic.
  - `language_code` *(string, optional)*: Language copy to render (e.g. `"ar"` for RTL).
  - `output_svg_path` *(string, optional)*: File path to save the generated `.svg`.

---

## 📚 MCP Resources (7 URIs)

AI agents can inspect system resources using `resources/read`:

| Resource URI | Description |
|---|---|
| `appscreen://templates` | Curated Google Play Store listing templates |
| `appscreen://devices` | Device mockup presets, bezels, and dimensions |
| `appscreen://palettes` | Gradient and solid color listing palettes |
| `appscreen://fonts` | Google Fonts library with language recommendation mappings |
| `appscreen://badges` | Ready-made badges, rating seals, and floating UI cards |
| `appscreen://schema` | Formal JSON schema of AppScreen Studio project format |
| `appscreen://guidelines` | Google Play Store policies, ASO guidelines, and size limits |

---

## 💡 MCP Prompts (3 Guided Workflows)

Agents can trigger pre-built optimization flows using `prompts/get`:

1. **`generate_play_store_listing`**
   - Inputs: `app_name`, `app_category`, `key_features`, `preferred_theme`
   - Crafts a complete, high-converting 5-screen listing storyboard.
2. **`audit_and_fix_listing`**
   - Inputs: `file_path`
   - Performs an automated ASO audit, fixes text overflows, and verifies compliance.
3. **`localize_listing_flow`**
   - Inputs: `file_path`, `target_languages`
   - Generates culturally tailored copy and applies localized typography.

---

## 🤖 Example Agent Interaction

Here is an example prompt you can give to Claude, Cursor, or your AI assistant:

> *"Generate a complete 5-screen Google Play Store listing for my fitness app 'PulseFit'. Use a dark theme with neon emerald accents. Add rating badges, set modern punch-hole phones, and localize the listing to Arabic with RTL Cairo typography. Finally, validate compliance and save the project to `pulsefit_listing.json`."*

The AI agent will automatically:
1. Call `create_project` with template `"bold_fitness"` or canvas preset `"phone_modern"`.
2. Call `apply_palette` with `"cyber_emerald"`.
3. Call `add_badge_to_screen` to insert rating and download badges.
4. Call `localize_project` with `language_code: "ar"` and Arabic translations.
5. Call `generate_feature_graphic` with a 1024×500 promotional banner.
6. Call `validate_project` to ensure 100% Google Play compliance.
7. Call `render_screen_svg` to verify the vector design.

---

## 🧪 Testing

To run the automated MCP test suite:

```bash
npm test
# Or test the MCP server specifically:
node tests/mcp_server.check.mjs
```
