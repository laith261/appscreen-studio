# AppScreen Studio 📱✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Web](https://img.shields.io/badge/Platform-Web-brightgreen.svg)]()
[![Google Play Compliant](https://img.shields.io/badge/Google%20Play-1080x1920%20%7C%201080x2400%20%7C%201024x500-blueviolet.svg)]()
[![MCP Server](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-green.svg)](docs/MCP_GUIDE.md)

**AppScreen Studio** is a client-side web application and design suite for crafting high-converting Google Play Store listing screenshots, realistic device mockups, promotional badges, multilingual localized copies, and feature graphics.

Built entirely with **Vanilla JavaScript (ES Modules)**, **HTML5 Canvas**, and **Google Material Symbols**, backed by pure client-side **IndexedDB** persistence, instant `.json` project backup/restore, and a lightweight Node.js server.

---

## 📸 Screenshots

| 🚀 Studio Dashboard | 📱 Modern SaaS Layout |
|:---:|:---:|
| <img src="docs/screenshots/01_dashboard.png" alt="Studio Dashboard" width="100%"/> | <img src="docs/screenshots/02_editor_saas.png" alt="Modern SaaS Layout" width="100%"/> |

| 💎 Fintech Dark Theme | 🖼️ All Screens Overview |
|:---:|:---:|
| <img src="docs/screenshots/03_editor_fintech.png" alt="Fintech Dark Theme" width="100%"/> | <img src="docs/screenshots/04_editor_overview.png" alt="All Screens Overview" width="100%"/> |

---

## 🌟 Key Features

### 1. 📱 Realistic Device Mockups & Screenshots
- **Multiple Device Styles:**
  - Modern Android Flagship (punch-hole selfie camera, ultra-slim bezels)
  - Minimalist Slim Phone
  - Frameless Floating Screen (modern Play Store aesthetic)
  - Android Tablet Mockups (7-inch and 10-inch)
- **Multi-Device Canvas Support:** Add multiple phone mockups to a single screen, adjust independent positions, rotation, scaling, and z-index.
- **Screenshot Positioning:** Cover / Fill, Contain, vertical offsets, zoom scaling, and realistic drop shadow controls.

### 2. 🎨 Ready-Made Visual Badges & Floating Cards
- **Google Play Store Badges:**
  - `★ 4.9 (100k+ Reviews)`
  - `🚀 50M+ Downloads Worldwide`
  - `🏆 Google Play Editor's Choice`
  - `🛡️ Verified by Play Protect`
  - `★★★★★` (5 Golden Rating Stars)
- **Interactive UI Cards & Accents:**
  - Floating toast notifications (e.g., `🎉 Goal Achieved: 10,000 steps today!`)
  - Transaction status pills (e.g., `✓ Payment Confirmed: $128.50`)
  - Geometric shapes: Rounded rectangles, capsules, circles, glow accents, and organic blobs.
- **Full Styling Freedom:** Custom fill color, stroke color, border width, corner radius, drop shadow, and opacity.

### 3. ✍️ Typography & One-Click Style Presets
- **Google Fonts Library:** Plus Jakarta Sans, Inter, Poppins, Montserrat, Outfit, Cairo (Arabic), and more.
- **Unified Text Layers:** Add unlimited text layers with one-click typography presets:
  - **Headline Style:** Bold, prominent display (72px)
  - **Subtitle Style:** Clean, readable description (34px)
  - **Tag / Eyebrow:** Uppercase accent tag
  - **Promo Callout:** Punchy marketing banner
  - **Body / Caption:** Compact details
- **Precision Controls:** Font size, weight (400–900), alignment, line height, text shadows, and color swatches.

### 4. 🌍 Multilingual Copies & Easy Translation
- **Independent Language Copies:** Maintain dedicated screenshot sets for each language inside a single project.
- **Supported Languages:** English, Spanish, Arabic (with native RTL alignment!), French, German, Portuguese, Japanese, Hindi, Italian, Turkish, Indonesian, Russian.
- **Manual & AI Translation:**
  - Edit translated texts directly on canvas.
  - Or connect your Google Gemini, OpenAI, Claude, or DeepL API key to auto-translate all screens in one click.

### 5. 🖼️ Curated Palettes & 1024 × 500 Feature Graphic
- **Ready Color Palettes:** Electric Indigo, Cyber Emerald, Sunset Coral, Ocean Cyan, Obsidian & Gold, and Clean Light.
- **Save Custom Designs:** Save your unique canvas layouts and custom color palettes to reuse across projects.
- **Play Store Feature Graphic Editor:** Dedicated 1024 × 500 banner canvas with multi-screen showcase arrangement.
- **Intelligent Background Removal:** Pure client-side background eraser that automatically removes solid backgrounds from uploaded logos, app icons, and stickers with boundary flood fill, edge feathering, and real-time sensitivity controls.

### 6. ⚡ Production-Ready Productivity Tools & Precision Controls
- **Slider & Number Input Synchronization:** Every size, scale, and position slider in the inspector features an inline numeric input with real-time two-way synchronization for exact coordinate precision.
- **Direct Canvas Mouse/Touch Manipulation:** Drag, position, rotate, and scale phone frames, text layers, badges, and images directly on the canvas with zero coordinate drift.
- **Custom Context Menu:** Right-click anywhere on the canvas or elements to duplicate, delete, lock, hide, reorder layers, center, or reset rotation.
- **All Screens Overview:** Full listing overview grid to review your entire Play Store presentation side-by-side.
- **High-Resolution Export:** Instant export to Single PNG, Single JPEG, or a complete ZIP batch of all screens.
- **100% Serverless & Offline:** Zero database required. All projects and assets auto-save to browser `IndexedDB` with instant `localStorage` caching and `.json` import/export.

### 7. 🔗 Unified Web Studio ↔ AI MCP Server Bridge (As One!)
- **Shared Engine & Real-Time Sync:** The Web Studio and the MCP Server share the exact same state machine, layer management, and context actions.
- **Live Two-Way Synchronization:** Edits made in the browser automatically sync to `.active_project.json` and the MCP server. Conversely, AI agents calling MCP tools update the open browser canvas live via Server-Sent Events (`/api/events`).
- **Zero-Config Tool Invocation:** AI agents can call MCP tools without needing explicit file paths — tools automatically target your live studio session by default!

---

## 🛠️ Architecture & Tech Stack

```
appscreen-studio/
├── index.html                  # Projects dashboard & template launcher (with live SSE auto-refresh)
├── editor.html                 # Main studio interface (real-time canvas & inspector)
├── server.mjs                  # Unified Web Server + HTTP MCP Endpoint + SSE Live Sync Bridge
├── css/
│   ├── style.css               # Core layout, themes, and Material Symbols styling
│   └── components.css          # Modals, drawer tabs, context menus, and inline slider inputs
├── js/
│   ├── app.js                  # Application bootstrap, controller, and live SSE sync listener
│   ├── state/                  # Reactive state management, store, and layer hierarchy
│   ├── canvas/                 # HTML5 2D canvas renderer, compose engine, and phone frames
│   ├── features/
│   │   ├── text/               # Font manager and typography presets
│   │   ├── shapes/             # Shape library, SVG paths, and badge definitions
│   │   ├── theme/              # Studio themes and curated color palettes
│   │   ├── templates/          # Ready listing templates and saved custom designs
│   │   ├── translation/        # Multi-language copy builder and AI translation service
│   │   ├── storage/            # Serverless IndexedDB & localStorage persistence engine
│   │   └── export/             # High-res canvas export and project JSON backup
│   └── ui/                     # Left drawer dock, inspector, context menu, filmstrip, modals
├── mcp/                        # Model Context Protocol (MCP) Server for AI Agents
│   ├── server.js               # Stdio JSON-RPC 2.0 CLI entrypoint (shares mcp/handler.js)
│   ├── handler.js              # Shared JSON-RPC 2.0 request router for Stdio & HTTP
│   ├── tools.js                # 24 programmatic tools (full 100% parity with web studio)
│   ├── resources.js            # Schemas, templates, devices, and guidelines
│   ├── prompts.js              # Guided AI prompt workflows
│   └── svgRenderer.js          # Headless vector SVG rendering engine (multi-device & feature graphic)
└── tests/                      # Automated unit & integration test suite (8 test suites)
```

- **Frontend:** Pure Vanilla JavaScript (ES6 Modules), HTML5 Canvas 2D API. No bundler or build step required!
- **Storage:** 100% client-side `IndexedDB` with `localStorage` instant cache and `.json` backup/restore.
- **Hosting:** 100% Static — deploy to GitHub Pages, Cloudflare Pages, Vercel, Netlify, or any static host with zero configuration.
- **Icons:** Google Material Symbols Outlined.

---

## 🚀 Getting Started

Because **AppScreen Studio** is completely serverless with zero build step, you can run it locally with any static HTTP server or open it directly:

### Option 1: Quick Local Server (Node.js)

```bash
git clone https://github.com/laith261/appscreen-studio.git
cd appscreen-studio
npm start
```

Or using `npx serve`:

```bash
npx serve .
```

Open `http://localhost:3000` (or the port shown in your terminal) in your browser.

### Option 2: Python Static Server

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in your web browser.

### Option 3: GitHub Pages (Instant Cloud Hosting)

Go to `https://laith261.github.io/appscreen-studio/`

---

## 🧪 Running Tests

The test suite validates state persistence, multi-language copy isolation, context menu actions, dialogs, background removal, MCP tools, and canvas device alignment:

```bash
npm test
```

Or run individual suites with Node:

```bash
node tests/store.check.mjs
node tests/persistence.check.mjs
node tests/translation_manual.check.mjs
node tests/context_menu.check.mjs
node tests/dialog.check.mjs
node tests/background_removal.check.mjs
node tests/mcp_server.check.mjs
node tests/device_boundary.check.mjs
```

---

## 🤖 Model Context Protocol (MCP) Server for AI Agents

AppScreen Studio provides a built-in **MCP server** allowing any AI agent (Claude Desktop, Cursor, Antigravity, Windsurf, Roo Code, VS Code Copilot, Cline, etc.) to programmatically build, translate, validate, and render Play Store screenshots with **100% full parity** with the web studio interface.

### 🔌 Connecting an AI Agent

#### Stdio Mode (Claude Desktop, Cursor, Antigravity, Windsurf)
Add to your Claude Desktop config (`claude_desktop_config.json`), Cursor (`.cursor/mcp.json`), or Antigravity / Windsurf settings:

```json
{
  "mcpServers": {
    "appscreen": {
      "command": "node",
      "args": ["/absolute/path/to/appscreen/mcp/server.js"]
    }
  }
}
```

#### HTTP JSON-RPC Mode (Remote or Web-Based Agents)
When running `npm start`, the server automatically exposes the MCP JSON-RPC 2.0 endpoint at:
`http://localhost:8000/mcp` (or tools list at `http://localhost:8000/api/mcp/tools`).

### ⚡ Highlights:
- **24 Programmatic Tools (100% Web Studio Parity):**
  - **Project & File Lifecycle:** `create_project`, `inspect_project`, `save_project_file`, `load_project_file`.
  - **Screen Operations:** `add_screen`, `update_screen` (full inspector controls, typography, and positioning), `remove_screen`.
  - **Design & Layouts:** `list_templates`, `get_template`, `list_devices`, `list_palettes`, `apply_palette`, `list_fonts`, `list_badges`, `add_badge_to_screen`.
  - **Advanced Layer & Showcase Controls:** `manage_layers` (add phone frames, duplicate, delete, z-order, hide, lock, center, reset rotation), `manage_showcase` (toggle/customize feature graphic 3-card showcase), `add_text_layer`, `add_image_layer`, `update_element`.
  - **Localization & Compliance:** `localize_project` (with native Arabic RTL & Cairo font), `generate_feature_graphic`, `validate_project`, and headless `render_screen_svg`.
- **Live Two-Way Studio Sync:** Tools automatically target your open web studio project without requiring explicit file paths, and changes reflect on your browser canvas in real time.
- **7 MCP Resources:** Templates, devices, palettes, fonts, badges, schema, and Google Play Store quality guidelines (`appscreen://...`).
- **3 Guided Prompts:** High-converting listing generator, market localization, and feature graphic creator.
- **Zero External Dependencies:** Built with pure Node.js stdio JSON-RPC 2.0.

📖 For complete documentation and integration examples, see the [MCP Server Guide](MCP.md) (or [docs/MCP_GUIDE.md](docs/MCP_GUIDE.md)).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Undo |
| `Ctrl + Y` / `Cmd + Shift + Z` | Redo |
| `Delete` / `Backspace` | Delete selected element |
| `Alt + ↑` | Bring layer forward |
| `Alt + ↓` | Send layer backward |
| `Ctrl + +` / `Cmd + +` | Zoom In |
| `Ctrl + -` / `Cmd + -` | Zoom Out |
| `Ctrl + 0` / `Cmd + 0` | Fit to view |
| `Right Click` | Context menu (canvas or element actions) |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
