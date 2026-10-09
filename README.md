# AppScreen Studio 📱✨

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Web](https://img.shields.io/badge/Platform-Web-brightgreen.svg)]()
[![Google Play Compliant](https://img.shields.io/badge/Google%20Play-1080x1920%20%7C%201080x2400%20%7C%201024x500-blueviolet.svg)]()

**AppScreen Studio** is a client-side web application and design suite for crafting high-converting Google Play Store listing screenshots, realistic device mockups, promotional badges, multilingual localized copies, and feature graphics.

Built entirely with **Vanilla JavaScript (ES Modules)**, **HTML5 Canvas**, and **Google Material Symbols**, backed by a lightweight file-based PHP API for automatic project persistence.

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

### 6. ⚡ Production-Ready Productivity Tools
- **Custom Context Menu:** Right-click anywhere on the canvas or elements to duplicate, delete, lock, hide, reorder layers, center, or reset rotation.
- **All Screens Overview:** Full listing overview grid to review your entire Play Store presentation side-by-side.
- **High-Resolution Export:** Instant export to Single PNG, Single JPEG, or a complete ZIP batch of all screens.
- **Persistent State:** Automatic debounce saving to local project JSON files and localStorage fallback.

---

## 🛠️ Architecture & Tech Stack

```
appscreen/
├── index.html                  # Projects dashboard
├── editor.html                 # Main studio interface
├── css/
│   ├── style.css               # Core layout, themes, and Material Symbols styling
│   └── components.css          # Modals, drawer tabs, context menus, and toolbars
├── js/
│   ├── app.js                  # Application bootstrap and controller
│   ├── state/                  # Reactive state management, store, and layer hierarchy
│   ├── canvas/                 # HTML5 2D canvas renderer, compose engine, and phone frames
│   ├── features/
│   │   ├── text/               # Font manager and typography presets
│   │   ├── shapes/             # Shape library, SVG paths, and badge definitions
│   │   ├── theme/              # Studio themes and curated color palettes
│   │   ├── templates/          # Ready listing templates and saved custom designs
│   │   ├── translation/        # Multi-language copy builder and AI translation service
│   │   └── export/             # High-res canvas export and ZIP batch packaging
│   └── ui/                     # Left drawer dock, inspector, context menu, filmstrip, modals
├── api/
│   └── projects.php            # Lightweight JSON-based project storage API
├── projects/                   # Saved project JSON storage (git-ignored)
└── tests/                      # Automated unit test suite
```

- **Frontend:** Pure Vanilla JavaScript (ES6 Modules), HTML5 Canvas 2D API. No bundler or build step required!
- **Icons:** Google Material Symbols Outlined.
- **Backend (Optional):** PHP 7.4+ for local JSON file persistence (runs seamlessly on XAMPP, Apache, or PHP built-in server).

---

## 🚀 Getting Started

### Option 1: PHP Built-in Server (Fastest)

Clone the repository and start the server:

```bash
git clone https://github.com/<your-username>/appscreen.git
cd appscreen
php -S localhost:8000
```

Open `http://localhost:8000` in your web browser.

### Option 2: XAMPP / Apache

1. Place or clone this folder inside your web server root:
   - **macOS / Linux:** `/Applications/XAMPP/xamppfiles/htdocs/appscreen` or `/var/www/html/appscreen`
   - **Windows:** `C:\xampp\htdocs\appscreen`
2. Start Apache from your XAMPP Control Panel.
3. Open `http://localhost/appscreen/` in your browser.

---

## 🧪 Running Tests

The test suite validates state persistence, multi-language copy isolation, context menu actions, and layer management:

```bash
npm test
```

Or run directly with Node:

```bash
node tests/store.check.mjs
node tests/persistence.check.mjs
node tests/translation_manual.check.mjs
node tests/context_menu.check.mjs
```

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
