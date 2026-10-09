/**
 * App Screen Generator - Curated Google Play Listing Templates
 * Provides high-converting, professionally designed screenshot templates for Play Store listings.
 */

import { activeDoc } from '../../state/store.js';

export const PLAY_STORE_TEMPLATES = [
  {
    id: 'vibrant_saas',
    name: 'Modern SaaS & Productivity',
    category: 'Productivity',
    badge: 'Popular',
    previewGradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    description: 'Vibrant indigo & purple gradients with clean floating device, rating badges, and team analytics.',
    screens: [
      {
        name: 'Idea 1: Hero Hook',
        background: { type: 'gradient', color1: '#4f46e5', color2: '#7c3aed', angle: 135 },
        headline: { text: 'Supercharge Your Productivity', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 175 },
        subtitle: { text: 'Organize tasks, collaborate in real-time, and crush your goals.', fontFamily: 'Inter', fontSize: 32, color: '#e0e7ff', yOffset: 360 },
        device: { type: 'modern_phone', color: '#0f172a', scale: 0.92, y: 1180, rotation: 0 },
        shapes: [
          { type: 'rating_badge', label: '★ 4.9 (100k+ Reviews)', x: 540, y: 105, width: 440, height: 60, fillColor: '#ffffff', textColor: '#4f46e5' }
        ]
      },
      {
        name: 'Idea 2: AI Insights',
        background: { type: 'gradient', color1: '#3730a3', color2: '#5b21b6', angle: 140 },
        headline: { text: 'Smart AI-Powered Insights', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 175 },
        subtitle: { text: 'Get actionable data metrics and visual reports at a glance.', fontFamily: 'Inter', fontSize: 32, color: '#c7d2fe', yOffset: 360 },
        device: { type: 'modern_phone', color: '#0f172a', scale: 0.94, y: 1190, rotation: -3 },
        shapes: [
          { type: 'pill_badge', label: '⚡ 3x Faster Decisions', x: 540, y: 105, width: 400, height: 58, fillColor: 'rgba(255,255,255,0.2)', textColor: '#ffffff' }
        ]
      },
      {
        name: 'Idea 3: Collaboration',
        background: { type: 'gradient', color1: '#1e1b4b', color2: '#4338ca', angle: 150 },
        headline: { text: 'Collaborate With Your Team', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#a5b4fc', yOffset: 125 },
        subtitle: { text: 'Real-time sync across desktop, tablet, and mobile devices.', fontFamily: 'Inter', fontSize: 32, color: '#e0e7ff', yOffset: 310 },
        device: { type: 'modern_phone', color: '#0f172a', scale: 1.02, y: 1260, rotation: 2 },
        shapes: [
          { type: 'ui_card', label: '👥 Team Workspace Active', sublabel: '12 Members Collaborating Live', x: 540, y: 550, width: 480, height: 90, fillColor: '#1e1b4b', textColor: '#818cf8' }
        ]
      },
      {
        name: 'Idea 4: Cloud Sync & Security',
        background: { type: 'gradient', color1: '#312e81', color2: '#6366f1', angle: 160 },
        headline: { text: 'Instant Real-Time Cloud Sync', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 120 },
        subtitle: { text: 'Automated backups and bank-grade end-to-end encryption.', fontFamily: 'Inter', fontSize: 32, color: '#c7d2fe', yOffset: 300 },
        device: { type: 'modern_phone', color: '#0f172a', scale: 0.92, y: 1190, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '🔒 Bank-Grade 256-bit AES Encryption', x: 540, y: 430, width: 480, height: 60, fillColor: '#1e1b4b', textColor: '#818cf8' }
        ]
      }
    ]
  },
  {
    id: 'dark_fintech',
    name: 'Fintech & Crypto Luxury',
    category: 'Finance',
    badge: 'Trending',
    previewGradient: 'linear-gradient(135deg, #090d16, #064e3b)',
    description: 'High-trust obsidian black & emerald glow with bank-grade security highlights and real-time cards.',
    screens: [
      {
        name: 'Idea 1: Safe Investing',
        background: { type: 'gradient', color1: '#090d16', color2: '#064e3b', angle: 160 },
        headline: { text: 'Smart Investing Made Effortless', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#34d399', yOffset: 175 },
        subtitle: { text: 'Invest in stocks, crypto, and ETFs with 0% commission fees.', fontFamily: 'Inter', fontSize: 32, color: '#94a3b8', yOffset: 360 },
        device: { type: 'modern_phone', color: '#090d16', scale: 0.92, y: 1180, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '🔒 Bank-Grade 256-bit Security', x: 540, y: 105, width: 460, height: 60, fillColor: 'rgba(52, 211, 153, 0.15)', textColor: '#34d399', borderColor: '#34d399' }
        ]
      },
      {
        name: 'Idea 2: Instant Payouts',
        background: { type: 'gradient', color1: '#090d16', color2: '#111827', angle: 180 },
        headline: { text: 'Instant Global Transfers', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 125 },
        subtitle: { text: 'Send and receive money worldwide in seconds with zero hidden fees.', fontFamily: 'Inter', fontSize: 32, color: '#a7f3d0', yOffset: 310 },
        device: { type: 'modern_phone', color: '#090d16', scale: 1.02, y: 1260, rotation: 3 },
        shapes: [
          { type: 'ui_card', label: '✓ Transfer Sent: $250.00', sublabel: 'Delivered in 1.4 seconds', x: 540, y: 550, width: 480, height: 90, fillColor: '#1e293b', textColor: '#34d399' }
        ]
      },
      {
        name: 'Idea 3: Wealth Growth',
        background: { type: 'gradient', color1: '#022c22', color2: '#064e3b', angle: 150 },
        headline: { text: 'Track Your Wealth Grow', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#6ee7b7', yOffset: 120 },
        subtitle: { text: 'Automated portfolio tracking with real-time analytics & alerts.', fontFamily: 'Inter', fontSize: 32, color: '#a7f3d0', yOffset: 300 },
        device: { type: 'modern_phone', color: '#090d16', scale: 0.92, y: 1190, rotation: -2 },
        shapes: [
          { type: 'pill_badge', label: '📈 +24.8% Average Annual Yield', x: 540, y: 430, width: 460, height: 60, fillColor: '#064e3b', textColor: '#6ee7b7', borderColor: '#34d399' }
        ]
      },
      {
        name: 'Idea 4: Secure Vault',
        background: { type: 'gradient', color1: '#0f172a', color2: '#065f46', angle: 165 },
        headline: { text: 'Guaranteed FDIC Protection', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 175 },
        subtitle: { text: 'Your deposits are protected and insured up to $250,000.', fontFamily: 'Inter', fontSize: 32, color: '#cbd5e1', yOffset: 360 },
        device: { type: 'modern_phone', color: '#090d16', scale: 0.92, y: 1180, rotation: 0 },
        shapes: [
          { type: 'rating_badge', label: '★ 4.9 • Trusted by 2M+ Investors', x: 540, y: 105, width: 480, height: 60, fillColor: '#1e293b', textColor: '#34d399' }
        ]
      }
    ]
  },
  {
    id: 'fitness_glow',
    name: 'Fitness & Lifestyle Energy',
    category: 'Health',
    badge: 'Vibrant',
    previewGradient: 'linear-gradient(135deg, #f43f5e, #f97316)',
    description: 'High-energy coral to sunset orange gradient with motivating goals, heart rate sync & nutrition.',
    screens: [
      {
        name: 'Idea 1: Crush Your Goals',
        background: { type: 'gradient', color1: '#e11d48', color2: '#ea580c', angle: 145 },
        headline: { text: 'Transform Your Health & Fitness', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 175 },
        subtitle: { text: 'Custom workout plans, calorie tracking, and real-time coaching.', fontFamily: 'Inter', fontSize: 32, color: '#ffe4e6', yOffset: 360 },
        device: { type: 'modern_phone', color: '#1c1917', scale: 0.92, y: 1180, rotation: 0 },
        shapes: [
          { type: 'rating_badge', label: '🔥 500+ Daily Workouts', x: 540, y: 105, width: 420, height: 60, fillColor: '#ffffff', textColor: '#e11d48' }
        ]
      },
      {
        name: 'Idea 2: Heart & Vitals',
        background: { type: 'gradient', color1: '#be123c', color2: '#c2410c', angle: 155 },
        headline: { text: 'Smart Heart Rate & Vitals', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 175 },
        subtitle: { text: 'Sync seamlessly with your smartwatch and fitness wearables.', fontFamily: 'Inter', fontSize: 32, color: '#fed7aa', yOffset: 360 },
        device: { type: 'modern_phone', color: '#1c1917', scale: 0.94, y: 1190, rotation: -3 },
        shapes: [
          { type: 'pill_badge', label: '❤️ 24/7 Health Monitoring', x: 540, y: 105, width: 440, height: 58, fillColor: '#ffffff', textColor: '#be123c' }
        ]
      },
      {
        name: 'Idea 3: Nutrition & Macros',
        background: { type: 'gradient', color1: '#9f1239', color2: '#ea580c', angle: 140 },
        headline: { text: 'Personalized Nutrition Plans', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 125 },
        subtitle: { text: 'Track daily macros, water intake, and calories automatically.', fontFamily: 'Inter', fontSize: 32, color: '#ffe4e6', yOffset: 310 },
        device: { type: 'modern_phone', color: '#1c1917', scale: 1.02, y: 1260, rotation: 2 },
        shapes: [
          { type: 'ui_card', label: '🥗 Daily Target: 2,150 kcal', sublabel: 'Protein 140g • Carbs 210g Achieved', x: 540, y: 550, width: 480, height: 90, fillColor: '#881337', textColor: '#fed7aa' }
        ]
      },
      {
        name: 'Idea 4: Streaks & Community',
        background: { type: 'gradient', color1: '#e11d48', color2: '#fb7185', angle: 160 },
        headline: { text: 'Stay Motivated with Friends', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 120 },
        subtitle: { text: 'Compete on leaderboards and celebrate active milestone streaks.', fontFamily: 'Inter', fontSize: 32, color: '#fff1f2', yOffset: 300 },
        device: { type: 'modern_phone', color: '#1c1917', scale: 0.92, y: 1190, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '🏆 30-Day Fitness Challenge Active', x: 540, y: 430, width: 460, height: 60, fillColor: '#ffffff', textColor: '#e11d48' }
        ]
      }
    ]
  },
  {
    id: 'clean_pastel',
    name: 'Minimalist Clean & Elegant',
    category: 'Lifestyle',
    badge: 'Clean',
    previewGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    description: 'Clean bright aesthetic with dark crisp typography, sleek floating frame, and e-commerce shopping flow.',
    screens: [
      {
        name: 'Idea 1: Beautifully Simple',
        background: { type: 'gradient', color1: '#f8fafc', color2: '#e2e8f0', angle: 180 },
        headline: { text: 'Beautifully Simple & Fast', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#0f172a', yOffset: 175 },
        subtitle: { text: 'Designed with mindful aesthetics for clutter-free peace of mind.', fontFamily: 'Inter', fontSize: 32, color: '#475569', yOffset: 360 },
        device: { type: 'minimal', color: '#0f172a', scale: 0.92, y: 1180, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '✨ 100% Ad-Free Experience', x: 540, y: 105, width: 420, height: 58, fillColor: '#0f172a', textColor: '#ffffff' }
        ]
      },
      {
        name: 'Idea 2: Curated Trends',
        background: { type: 'gradient', color1: '#f1f5f9', color2: '#cbd5e1', angle: 170 },
        headline: { text: 'Curated Daily Collections', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#0f172a', yOffset: 125 },
        subtitle: { text: 'Hand-picked essentials and trending styles tailored to your taste.', fontFamily: 'Inter', fontSize: 32, color: '#334155', yOffset: 310 },
        device: { type: 'minimal', color: '#0f172a', scale: 1.02, y: 1260, rotation: 3 },
        shapes: [
          { type: 'ui_card', label: '🛍️ Over 10,000+ Curated Items', sublabel: 'Hand-Selected Premium Quality', x: 540, y: 550, width: 480, height: 90, fillColor: '#ffffff', textColor: '#0f172a' }
        ]
      },
      {
        name: 'Idea 3: Express Checkout',
        background: { type: 'gradient', color1: '#f8fafc', color2: '#e2e8f0', angle: 180 },
        headline: { text: 'One-Tap Instant Checkout', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#0f172a', yOffset: 175 },
        subtitle: { text: 'Pay securely with Google Pay, cards, or PayPal in seconds.', fontFamily: 'Inter', fontSize: 32, color: '#475569', yOffset: 360 },
        device: { type: 'minimal', color: '#0f172a', scale: 0.94, y: 1190, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '🌿 100% Carbon Neutral Orders', x: 540, y: 105, width: 440, height: 58, fillColor: '#ffffff', textColor: '#0f172a', borderColor: '#94a3b8' }
        ]
      },
      {
        name: 'Idea 4: Verified Delight',
        background: { type: 'gradient', color1: '#f1f5f9', color2: '#e2e8f0', angle: 175 },
        headline: { text: 'Loved by Over 1 Million Users', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#0f172a', yOffset: 120 },
        subtitle: { text: 'Hassle-free 30-day returns and 24/7 dedicated customer care.', fontFamily: 'Inter', fontSize: 32, color: '#475569', yOffset: 300 },
        device: { type: 'minimal', color: '#0f172a', scale: 0.92, y: 1190, rotation: 0 },
        shapes: [
          { type: 'rating_badge', label: '★ 4.9 Rating (250k+ Happy Reviews)', x: 540, y: 430, width: 480, height: 60, fillColor: '#0f172a', textColor: '#ffffff' }
        ]
      }
    ]
  },
  {
    id: 'cyber_gaming',
    name: 'Gaming & Cyberpunk Neon',
    category: 'Games',
    badge: 'Action',
    previewGradient: 'linear-gradient(135deg, #050505, #1e1b4b, #0284c7)',
    description: 'High-contrast dark gaming vibe with electric cyan and magenta accents, ranks & guild battles.',
    screens: [
      {
        name: 'Idea 1: Epic Action',
        background: { type: 'gradient', color1: '#020617', color2: '#1e1b4b', angle: 160 },
        headline: { text: 'Next-Gen Multiplayer Arena', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#38bdf8', yOffset: 175 },
        subtitle: { text: 'Compete in high-stakes tournaments with players across the globe.', fontFamily: 'Inter', fontSize: 32, color: '#93c5fd', yOffset: 360 },
        device: { type: 'modern_phone', color: '#020617', scale: 0.92, y: 1180, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '🏆 #1 Ranked PvP Action', x: 540, y: 105, width: 440, height: 58, fillColor: 'rgba(56, 189, 248, 0.2)', textColor: '#38bdf8', borderColor: '#38bdf8' }
        ]
      },
      {
        name: 'Idea 2: Legendary Gear',
        background: { type: 'gradient', color1: '#0f172a', color2: '#312e81', angle: 150 },
        headline: { text: 'Collect Mythic Heroes & Gear', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#f43f5e', yOffset: 175 },
        subtitle: { text: 'Unlock hundreds of unique characters with customizable abilities.', fontFamily: 'Inter', fontSize: 32, color: '#fbcfe8', yOffset: 360 },
        device: { type: 'modern_phone', color: '#020617', scale: 0.94, y: 1190, rotation: -3 },
        shapes: [
          { type: 'pill_badge', label: '⚡ 100+ Legendary Characters', x: 540, y: 105, width: 440, height: 58, fillColor: 'rgba(244, 63, 94, 0.2)', textColor: '#fb7185', borderColor: '#f43f5e' }
        ]
      },
      {
        name: 'Idea 3: Ranked Leagues',
        background: { type: 'gradient', color1: '#020617', color2: '#0c4a6e', angle: 170 },
        headline: { text: 'Climb the Global Leaderboards', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#38bdf8', yOffset: 125 },
        subtitle: { text: 'Seasonal competitive divisions with exclusive rewards and badges.', fontFamily: 'Inter', fontSize: 32, color: '#bae6fd', yOffset: 310 },
        device: { type: 'modern_phone', color: '#020617', scale: 1.02, y: 1260, rotation: 2 },
        shapes: [
          { type: 'ui_card', label: '👑 Grandmaster Tier Unlocked', sublabel: 'Top 0.1% Global Competitive Rank', x: 540, y: 550, width: 480, height: 90, fillColor: '#082f49', textColor: '#38bdf8' }
        ]
      },
      {
        name: 'Idea 4: Guild Wars',
        background: { type: 'gradient', color1: '#020617', color2: '#1e1b4b', angle: 160 },
        headline: { text: 'Team Up with Real Friends', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#c084fc', yOffset: 120 },
        subtitle: { text: 'Form unstoppable guilds, chat with live audio, and dominate together.', fontFamily: 'Inter', fontSize: 32, color: '#e9d5ff', yOffset: 300 },
        device: { type: 'modern_phone', color: '#020617', scale: 0.92, y: 1190, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '⚔️ 50v50 Massive Guild Battles', x: 540, y: 430, width: 460, height: 60, fillColor: 'rgba(192, 132, 252, 0.2)', textColor: '#c084fc', borderColor: '#c084fc' }
        ]
      }
    ]
  },
  {
    id: 'social_dating',
    name: 'Social, Dating & Connections',
    category: 'Social',
    badge: 'Popular',
    previewGradient: 'linear-gradient(135deg, #db2777, #9333ea)',
    description: 'Vibrant romantic sunset with verified matching, crystal audio/video chat, and private safety.',
    screens: [
      {
        name: 'Idea 1: Real Connections',
        background: { type: 'gradient', color1: '#db2777', color2: '#9333ea', angle: 140 },
        headline: { text: 'Meet Meaningful People Nearby', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 175 },
        subtitle: { text: 'Connect with authentic people who share your passions and values.', fontFamily: 'Inter', fontSize: 32, color: '#fbcfe8', yOffset: 360 },
        device: { type: 'modern_phone', color: '#18181b', scale: 0.92, y: 1180, rotation: 0 },
        shapes: [
          { type: 'pill_badge', label: '✨ 100% Verified Profiles Only', x: 540, y: 105, width: 440, height: 58, fillColor: '#ffffff', textColor: '#db2777' }
        ]
      },
      {
        name: 'Idea 2: Video & Voice Chat',
        background: { type: 'gradient', color1: '#c026d3', color2: '#7c3aed', angle: 150 },
        headline: { text: 'Express Yourself Naturally', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 175 },
        subtitle: { text: 'Crystal-clear video dates and playful voice prompts that break the ice.', fontFamily: 'Inter', fontSize: 32, color: '#f5d0fe', yOffset: 360 },
        device: { type: 'modern_phone', color: '#18181b', scale: 0.94, y: 1190, rotation: 3 },
        shapes: [
          { type: 'pill_badge', label: '💬 Over 10M Matches Made Daily', x: 540, y: 105, width: 460, height: 58, fillColor: '#ffffff', textColor: '#7c3aed' }
        ]
      },
      {
        name: 'Idea 3: Shared Passions',
        background: { type: 'gradient', color1: '#e11d48', color2: '#c026d3', angle: 145 },
        headline: { text: 'Match by Shared Passions', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 125 },
        subtitle: { text: 'Find workout buddies, travel partners, coffee lovers, and more.', fontFamily: 'Inter', fontSize: 32, color: '#ffe4e6', yOffset: 310 },
        device: { type: 'modern_phone', color: '#18181b', scale: 1.02, y: 1260, rotation: -2 },
        shapes: [
          { type: 'ui_card', label: '🎯 98% Compatibility Match', sublabel: 'Common: Hiking, Indie Music & Coffee', x: 540, y: 550, width: 480, height: 90, fillColor: '#831843', textColor: '#fbcfe8' }
        ]
      },
      {
        name: 'Idea 4: Safe Community',
        background: { type: 'gradient', color1: '#be185d', color2: '#6b21a8', angle: 160 },
        headline: { text: 'Safe & Respectful Community', fontFamily: 'Plus Jakarta Sans', fontSize: 68, fontWeight: '800', color: '#ffffff', yOffset: 120 },
        subtitle: { text: 'Zero tolerance for fake accounts with 24/7 proactive AI moderation.', fontFamily: 'Inter', fontSize: 32, color: '#fce7f3', yOffset: 300 },
        device: { type: 'modern_phone', color: '#18181b', scale: 0.92, y: 1190, rotation: 0 },
        shapes: [
          { type: 'rating_badge', label: '★ 4.8 Rating • 50M+ Trusted Members', x: 540, y: 430, width: 480, height: 60, fillColor: '#ffffff', textColor: '#be185d' }
        ]
      }
    ]
  }
];

/**
 * Normalizes a template shape definition into an interactive shape instance with a unique ID and full transform defaults.
 * @param {Object} shape
 * @param {number} [screenIdx=0]
 * @param {number} [shapeIdx=0]
 * @returns {Object}
 */
function instantiateTemplateShape(shape, screenIdx = 0, shapeIdx = 0) {
  return {
    scale: 1,
    rotation: 0,
    opacity: 1,
    borderRadius: shape.type === 'pill_badge' || shape.type === 'pill' ? (shape.height ? Math.round(shape.height / 2) : 30) : 16,
    shadow: true,
    shadowBlur: 20,
    shadowOffsetY: 10,
    ...shape,
    id: `shape-${Date.now()}-${screenIdx}-${shapeIdx}-${Math.floor(Math.random() * 1000)}`
  };
}

/**
 * Applies a template to the current project or active screen.
 * @param {Object} store
 * @param {string} templateId
 * @param {boolean} applyAllScreens If true, replaces all screens with the template suite
 * @param {number} [screenIndex=0] If applying to a single screen, which screen idea to apply (0-3)
 */
export function applyTemplate(store, templateId, applyAllScreens = false, screenIndex = 0) {
  const tpl = PLAY_STORE_TEMPLATES.find(t => t.id === templateId);
  if (!tpl) return;

  store.update(state => {
    if (applyAllScreens && tpl.screens && tpl.screens.length > 0) {
      // Replaces project screens with template screens while preserving user uploaded screenshot if available
      const existingScreen = store.getActiveScreen();
      const existingImage = existingScreen?.device?.image || null;

      // Templates only list what they change; fill the rest from a complete blank screen
      // (otherwise e.g. the phone has no x position and renders in the corner)
      const base = store.getDefaultState().screens[0];
      state.screens = tpl.screens.map((s, idx) => {
        const t = JSON.parse(JSON.stringify(s));
        const shapes = (t.shapes || []).map((sh, sIdx) => instantiateTemplateShape(sh, idx, sIdx));
        const screenCopy = {
          ...base,
          ...t,
          headline: { ...base.headline, ...t.headline },
          subtitle: { ...base.subtitle, ...t.subtitle },
          device: { ...base.device, x: state.width / 2, ...t.device },
          shapes
        };
        screenCopy.id = `screen-${Date.now()}-${idx}`;
        if (existingImage && idx === 0) {
          screenCopy.device.image = existingImage;
        }
        return screenCopy;
      });
      state.activeScreenId = state.screens[0].id;
      if (state.screens[0].shapes && state.screens[0].shapes.length > 0) {
        state.activeElementId = state.screens[0].shapes[0].id;
      }
    } else {
      // Apply style only to active screen
      const active = activeDoc(state);
      const chosenIdx = Math.max(0, Math.min(screenIndex, tpl.screens.length - 1));
      const src = tpl.screens[chosenIdx] || tpl.screens[0];
      if (active && src) {
        active.background = JSON.parse(JSON.stringify(src.background));
        if (src.headline) {
          active.headline.fontFamily = src.headline.fontFamily || active.headline.fontFamily;
          active.headline.fontWeight = src.headline.fontWeight || active.headline.fontWeight;
          active.headline.color = src.headline.color || active.headline.color;
          if (src.headline.text) active.headline.text = src.headline.text;
          if (src.headline.fontSize) active.headline.fontSize = src.headline.fontSize;
          if (src.headline.yOffset) active.headline.yOffset = src.headline.yOffset;
        }
        if (src.subtitle) {
          active.subtitle.color = src.subtitle.color || active.subtitle.color;
          active.subtitle.fontFamily = src.subtitle.fontFamily || active.subtitle.fontFamily;
          if (src.subtitle.text) active.subtitle.text = src.subtitle.text;
          if (src.subtitle.fontSize) active.subtitle.fontSize = src.subtitle.fontSize;
          if (src.subtitle.yOffset) active.subtitle.yOffset = src.subtitle.yOffset;

          const hlText = active.headline?.text || '';
          const hlH = estimateTextHeight(hlText, active.headline?.fontSize || 68);
          const minSubY = (active.headline?.yOffset || 120) + hlH + 20;
          if (active.subtitle.yOffset < minSubY) {
            active.subtitle.yOffset = Math.round(minSubY);
          }
        }
        if (src.device) {
          active.device = {
            ...active.device,
            ...JSON.parse(JSON.stringify(src.device)),
            image: active.device?.image || null
          };
        }
        if (src.shapes && src.shapes.length > 0) {
          const newShapes = src.shapes.map((sh, sIdx) => {
            const inst = instantiateTemplateShape(sh, chosenIdx, sIdx);
            if (inst.y > (active.subtitle?.yOffset || 300) && inst.y < 520) {
              const subText = active.subtitle?.text || '';
              const subH = estimateTextHeight(subText, active.subtitle?.fontSize || 32);
              const minShapeY = (active.subtitle?.yOffset || 300) + subH + 26;
              if (inst.y < minShapeY) inst.y = Math.round(minShapeY);
            }
            return inst;
          });
          active.shapes = newShapes;
          state.activeElementId = newShapes[0].id;
        }
      }
    }
  });
}

/**
 * 4 Distinct Design Layout Ideas, each accompanied by a vector wireframe illustration.
 */
export const DESIGN_IDEAS = [
  {
    id: 'idea_hero_centered',
    name: 'Idea 1: Classic Hero',
    badge: 'Popular',
    tagline: 'Centered Device & Top Rating Hook',
    description: 'Straight upright phone with prominent headline and top rating badge. Best for Screen 1 hero hook.',
    vectorSvg: `<svg viewBox="0 0 160 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vbg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0.15"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="156" height="216" rx="10" fill="url(#vbg1)" stroke="#6366f1" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
      <rect x="36" y="16" width="88" height="14" rx="7" fill="#6366f1" fill-opacity="0.35" stroke="#818cf8" stroke-width="1"/>
      <circle cx="46" cy="23" r="3" fill="#fbbf24"/>
      <rect x="54" y="21" width="60" height="4" rx="2" fill="#ffffff" opacity="0.9"/>
      <rect x="24" y="38" width="112" height="9" rx="4.5" fill="#ffffff" opacity="0.95"/>
      <rect x="38" y="52" width="84" height="7" rx="3.5" fill="#c7d2fe" opacity="0.8"/>
      <g transform="translate(42, 74)">
        <rect x="3" y="6" width="70" height="136" rx="12" fill="#000000" opacity="0.35"/>
        <rect x="0" y="0" width="76" height="140" rx="12" fill="#0f172a" stroke="#6366f1" stroke-width="2"/>
        <rect x="4" y="5" width="68" height="130" rx="9" fill="#1e1b4b" opacity="0.9"/>
        <circle cx="38" cy="11" r="2.2" fill="#0f172a" stroke="#475569" stroke-width="0.8"/>
        <rect x="10" y="22" width="48" height="18" rx="4" fill="#6366f1" opacity="0.5"/>
        <rect x="10" y="46" width="48" height="8" rx="2" fill="#ffffff" opacity="0.2"/>
        <rect x="10" y="58" width="36" height="6" rx="2" fill="#ffffff" opacity="0.15"/>
        <rect x="10" y="70" width="48" height="28" rx="4" fill="#818cf8" opacity="0.25"/>
      </g>
    </svg>`,
    layout: {
      headline: { fontSize: 68, fontWeight: '800', yOffset: 175 },
      subtitle: { fontSize: 32, yOffset: 360 },
      device: { type: 'modern_phone', scale: 0.92, y: 1180, rotation: 0 },
      shapes: [
        {
          id: 'idea-badge-1',
          type: 'rating_badge',
          label: '★ 4.9 (100k+ Reviews)',
          x: 540,
          y: 105,
          width: 440,
          height: 60,
          fillColor: '#ffffff',
          textColor: '#4f46e5',
          borderRadius: 30,
          scale: 1,
          rotation: 0,
          opacity: 1,
          shadow: true
        }
      ]
    },
    defaultText: {
      headline: 'Supercharge Your Productivity',
      subtitle: 'Organize tasks, collaborate in real-time, and crush your goals.'
    }
  },
  {
    id: 'idea_dynamic_angle',
    name: 'Idea 2: Dynamic Angle',
    badge: 'Trending',
    tagline: 'Tilted Device & Feature Tag',
    description: 'Dynamic 3D-angled phone with accent pill badge. Great for highlighting a core superpower.',
    vectorSvg: `<svg viewBox="0 0 160 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vbg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#0369a1" stop-opacity="0.15"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="156" height="216" rx="10" fill="url(#vbg2)" stroke="#0284c7" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
      <rect x="20" y="16" width="76" height="14" rx="7" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="1"/>
      <rect x="28" y="21" width="60" height="4" rx="2" fill="#ffffff" opacity="0.9"/>
      <rect x="20" y="38" width="118" height="9" rx="4.5" fill="#ffffff" opacity="0.95"/>
      <rect x="20" y="52" width="88" height="7" rx="3.5" fill="#bae6fd" opacity="0.8"/>
      <g transform="translate(80, 142) rotate(-7) translate(-38, -68)">
        <rect x="4" y="6" width="70" height="136" rx="12" fill="#000000" opacity="0.4"/>
        <rect x="0" y="0" width="76" height="140" rx="12" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
        <rect x="4" y="5" width="68" height="130" rx="9" fill="#0c4a6e" opacity="0.9"/>
        <circle cx="38" cy="11" r="2.2" fill="#0f172a" stroke="#475569" stroke-width="0.8"/>
        <rect x="10" y="22" width="48" height="30" rx="4" fill="#0284c7" opacity="0.4"/>
        <circle cx="34" cy="72" r="14" fill="#38bdf8" opacity="0.3"/>
        <rect x="10" y="96" width="48" height="8" rx="2" fill="#ffffff" opacity="0.2"/>
      </g>
    </svg>`,
    layout: {
      headline: { fontSize: 68, fontWeight: '800', yOffset: 175 },
      subtitle: { fontSize: 32, yOffset: 360 },
      device: { type: 'modern_phone', scale: 0.94, y: 1190, rotation: -4 },
      shapes: [
        {
          id: 'idea-badge-2',
          type: 'pill_badge',
          label: '⚡ 3x Faster Decisions',
          x: 540,
          y: 105,
          width: 400,
          height: 58,
          fillColor: 'rgba(255,255,255,0.2)',
          textColor: '#ffffff',
          borderRadius: 29,
          scale: 1,
          rotation: 0,
          opacity: 1,
          shadow: true
        }
      ]
    },
    defaultText: {
      headline: 'Smart AI-Powered Insights',
      subtitle: 'Get actionable data metrics and visual reports at a glance.'
    }
  },
  {
    id: 'idea_feature_peek',
    name: 'Idea 3: Feature Peek & Card',
    badge: 'High Impact',
    tagline: 'Zoomed Bottom Device & Floating Card',
    description: 'Enlarged phone peek at the bottom with floating UI card overlay. Best for analytics & workflows.',
    vectorSvg: `<svg viewBox="0 0 160 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vbg3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#059669" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#047857" stop-opacity="0.15"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="156" height="216" rx="10" fill="url(#vbg3)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
      <rect x="20" y="18" width="120" height="9" rx="4.5" fill="#ffffff" opacity="0.95"/>
      <rect x="20" y="32" width="98" height="9" rx="4.5" fill="#ffffff" opacity="0.95"/>
      <rect x="20" y="47" width="82" height="7" rx="3.5" fill="#a7f3d0" opacity="0.8"/>
      <g transform="translate(36, 92)">
        <rect x="3" y="6" width="82" height="140" rx="14" fill="#000000" opacity="0.35"/>
        <rect x="0" y="0" width="88" height="140" rx="14" fill="#090d16" stroke="#10b981" stroke-width="2"/>
        <rect x="5" y="6" width="78" height="130" rx="10" fill="#064e3b" opacity="0.9"/>
        <circle cx="44" cy="13" r="2.5" fill="#090d16" stroke="#475569" stroke-width="0.8"/>
        <path d="M 12 70 Q 28 50, 44 62 T 76 35" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>
      </g>
      <g transform="translate(18, 70)">
        <rect x="2" y="3" width="120" height="28" rx="6" fill="#000000" opacity="0.4"/>
        <rect x="0" y="0" width="124" height="28" rx="6" fill="#1e293b" stroke="#34d399" stroke-width="1.2"/>
        <circle cx="14" cy="14" r="5" fill="#10b981" fill-opacity="0.3"/>
        <path d="M 12 14 L 14 16 L 17 12" fill="none" stroke="#34d399" stroke-width="1.2" stroke-linecap="round"/>
        <rect x="24" y="8" width="60" height="5" rx="2" fill="#ffffff" opacity="0.9"/>
        <rect x="24" y="16" width="42" height="4" rx="2" fill="#94a3b8" opacity="0.8"/>
      </g>
    </svg>`,
    layout: {
      headline: { fontSize: 68, fontWeight: '800', yOffset: 125 },
      subtitle: { fontSize: 32, yOffset: 310 },
      device: { type: 'modern_phone', scale: 1.05, y: 1260, rotation: 0 },
      shapes: [
        {
          id: 'idea-card-3',
          type: 'ui_card',
          label: '✓ Transfer Sent: $250.00',
          sublabel: 'Delivered in 1.4 seconds',
          x: 540,
          y: 550,
          width: 500,
          height: 92,
          fillColor: '#1e293b',
          textColor: '#34d399',
          borderRadius: 16,
          scale: 1,
          rotation: 0,
          opacity: 1,
          shadow: true
        }
      ]
    },
    defaultText: {
      headline: 'Instant Global Transfers',
      subtitle: 'Send and receive money worldwide in seconds with zero hidden fees.'
    }
  },
  {
    id: 'idea_social_proof',
    name: 'Idea 4: Social Proof & Trust',
    badge: 'Conversion',
    tagline: 'Minimal Device & Trust Guarantee',
    description: 'Clean balanced layout with security badge and verified community proof. Best for closing trust.',
    vectorSvg: `<svg viewBox="0 0 160 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vbg4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e11d48" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#ea580c" stop-opacity="0.15"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="156" height="216" rx="10" fill="url(#vbg4)" stroke="#f43f5e" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6"/>
      <rect x="24" y="20" width="112" height="9" rx="4.5" fill="#ffffff" opacity="0.95"/>
      <rect x="36" y="34" width="88" height="7" rx="3.5" fill="#ffe4e6" opacity="0.8"/>
      <rect x="30" y="48" width="100" height="14" rx="7" fill="#ffffff" fill-opacity="0.95" stroke="#f43f5e" stroke-width="1"/>
      <text x="36" y="58" font-size="7" fill="#e11d48">★★★★★</text>
      <rect x="74" y="53" width="50" height="4" rx="2" fill="#e11d48" opacity="0.8"/>
      <g transform="translate(44, 72)">
        <rect x="3" y="6" width="66" height="136" rx="10" fill="#000000" opacity="0.35"/>
        <rect x="0" y="0" width="72" height="140" rx="10" fill="#1c1917" stroke="#f43f5e" stroke-width="1.8"/>
        <rect x="3" y="4" width="66" height="132" rx="8" fill="#881337" opacity="0.9"/>
        <rect x="28" y="6" width="16" height="3" rx="1.5" fill="#1c1917"/>
        <rect x="8" y="24" width="50" height="44" rx="5" fill="#ffffff" opacity="0.2"/>
        <circle cx="33" cy="46" r="10" fill="#f97316" opacity="0.6"/>
        <rect x="8" y="78" width="50" height="12" rx="3" fill="#ffffff" opacity="0.15"/>
      </g>
    </svg>`,
    layout: {
      headline: { fontSize: 68, fontWeight: '800', yOffset: 120 },
      subtitle: { fontSize: 32, yOffset: 300 },
      device: { type: 'minimal', scale: 0.90, y: 1190, rotation: 0 },
      shapes: [
        {
          id: 'idea-badge-4',
          type: 'pill_badge',
          label: '🔒 Bank-Grade 256-bit Security',
          x: 540,
          y: 430,
          width: 460,
          height: 60,
          fillColor: 'rgba(255,255,255,0.2)',
          textColor: '#ffffff',
          borderRadius: 30,
          scale: 1,
          rotation: 0,
          opacity: 1,
          shadow: true
        }
      ]
    },
    defaultText: {
      headline: 'Safe, Private & Guaranteed',
      subtitle: 'Your data is protected with 24/7 proactive security and automated cloud backups.'
    }
  }
];

/**
 * Estimates rendered height of text given fontSize and text content.
 * @param {string} text
 * @param {number} [fontSize=68]
 * @param {number} [maxWidth=900]
 * @returns {number}
 */
export function estimateTextHeight(text, fontSize = 68, maxWidth = 900) {
  if (!text) return fontSize * 1.2;
  const charsPerLine = Math.max(12, Math.floor(maxWidth / (fontSize * 0.52)));
  const lines = text.split('\n');
  let totalLines = 0;
  for (const l of lines) {
    totalLines += Math.max(1, Math.ceil(l.length / charsPerLine));
  }
  return totalLines * (fontSize * 1.25);
}

/**
 * Applies a specific design layout idea to the active screen or generates a 4-screen suite.
 * Preserves existing background colors and uploaded screenshots.
 * @param {Object} store
 * @param {string} ideaId
 * @param {boolean} applyAllScreens If true, sets up all 4 design ideas across 4 screens
 */
export function applyDesignIdea(store, ideaId, applyAllScreens = false) {
  const idea = DESIGN_IDEAS.find(i => i.id === ideaId);
  if (!idea) return;

  store.update(state => {
    if (applyAllScreens) {
      const existingScreen = store.getActiveScreen();
      const existingImage = existingScreen?.device?.image || null;
      const base = store.getDefaultState().screens[0];

      state.screens = DESIGN_IDEAS.map((item, idx) => {
        const layout = item.layout;
        const text = item.defaultText;
        const hlY = layout.headline.yOffset;
        const hlH = estimateTextHeight(text.headline, layout.headline.fontSize);
        const subY = Math.max(layout.subtitle.yOffset, hlY + hlH + 20);
        const subH = estimateTextHeight(text.subtitle, layout.subtitle.fontSize);

        const screenShapes = (layout.shapes || []).map((s, sIdx) => {
          const inst = instantiateTemplateShape(s, idx, sIdx);
          if (inst.y > subY && inst.y < 520) {
            const minShapeY = subY + subH + 26;
            if (inst.y < minShapeY) inst.y = Math.round(minShapeY);
          }
          return inst;
        });

        const screenCopy = {
          ...base,
          name: item.name,
          headline: {
            ...base.headline,
            text: text.headline,
            fontSize: layout.headline.fontSize,
            fontWeight: layout.headline.fontWeight,
            yOffset: hlY
          },
          subtitle: {
            ...base.subtitle,
            text: text.subtitle,
            fontSize: layout.subtitle.fontSize,
            yOffset: subY
          },
          device: {
            ...base.device,
            x: state.width / 2,
            ...layout.device,
            image: (idx === 0 && existingImage) ? existingImage : null
          },
          shapes: screenShapes
        };
        screenCopy.id = `screen-${Date.now()}-${idx}`;
        return screenCopy;
      });
      state.activeScreenId = state.screens[0].id;
      if (state.screens[0].shapes && state.screens[0].shapes.length > 0) {
        state.activeElementId = state.screens[0].shapes[0].id;
      }
    } else {
      const active = activeDoc(state);
      if (!active) return;
      const layout = idea.layout;

      if (layout.headline) {
        active.headline.fontSize = layout.headline.fontSize;
        active.headline.fontWeight = layout.headline.fontWeight;
        active.headline.yOffset = layout.headline.yOffset;
        if (!active.headline.text) {
          active.headline.text = idea.defaultText.headline;
        }
      }

      if (layout.subtitle) {
        active.subtitle.fontSize = layout.subtitle.fontSize;
        active.subtitle.yOffset = layout.subtitle.yOffset;
        if (!active.subtitle.text) {
          active.subtitle.text = idea.defaultText.subtitle;
        }

        // Prevent headline / subtitle collision if user text is long
        const hlText = active.headline?.text || '';
        const hlH = estimateTextHeight(hlText, active.headline?.fontSize || 68);
        const minSubY = (active.headline?.yOffset || 120) + hlH + 20;
        if (active.subtitle.yOffset < minSubY) {
          active.subtitle.yOffset = Math.round(minSubY);
        }
      }

      if (layout.device) {
        active.device = {
          ...active.device,
          type: layout.device.type || active.device.type,
          scale: layout.device.scale ?? active.device.scale,
          y: layout.device.y ?? active.device.y,
          rotation: layout.device.rotation ?? 0
        };
      }

      if (layout.shapes && layout.shapes.length > 0) {
        const newShapes = layout.shapes.map((s, sIdx) => {
          const inst = instantiateTemplateShape(s, 0, sIdx);
          // If shape is placed between subtitle and device (around y=350-480), prevent overlap with subtitle
          if (inst.y > (active.subtitle?.yOffset || 300) && inst.y < 520) {
            const subText = active.subtitle?.text || '';
            const subH = estimateTextHeight(subText, active.subtitle?.fontSize || 32);
            const minShapeY = (active.subtitle?.yOffset || 300) + subH + 26;
            if (inst.y < minShapeY) {
              inst.y = Math.round(minShapeY);
            }
          }
          return inst;
        });
        active.shapes = newShapes;
        state.activeElementId = newShapes[0].id;
      }
    }
  });
}
