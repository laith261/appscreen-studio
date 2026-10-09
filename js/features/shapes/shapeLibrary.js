/**
 * App Screen Generator - Ready-to-Use Shapes Library
 * Provides geometric shapes, Play Store badges, floating UI cards, and decorative accents
 * with full color, gradient, size, border, rotation, and shadow customization.
 */

export const SHAPE_DEFINITIONS = [
  // --- Category: Google Play Badges ---
  {
    id: 'rating_badge',
    category: 'badges',
    name: 'Top Rated Badge',
    icon: '★',
    defaults: {
      type: 'rating_badge',
      label: '★ 4.9 (100k+ Reviews)',
      width: 440,
      height: 64,
      fillColor: '#ffffff',
      textColor: '#4f46e5',
      borderColor: '#c7d2fe',
      borderWidth: 2,
      borderRadius: 32,
      opacity: 1,
      rotation: 0,
      scale: 1,
      shadow: true
    }
  },
  {
    id: 'download_badge',
    category: 'badges',
    name: '50M+ Downloads',
    icon: '⬇',
    defaults: {
      type: 'pill_badge',
      label: '🚀 50M+ Downloads Worldwide',
      width: 480,
      height: 64,
      fillColor: '#10b981',
      textColor: '#ffffff',
      borderColor: '#059669',
      borderWidth: 0,
      borderRadius: 32,
      opacity: 1,
      rotation: 0,
      scale: 1,
      shadow: true
    }
  },
  {
    id: 'editors_choice',
    category: 'badges',
    name: "Editor's Choice",
    icon: '🎖',
    defaults: {
      type: 'pill_badge',
      label: "🏆 Google Play Editor's Choice",
      width: 480,
      height: 64,
      fillColor: '#f59e0b',
      textColor: '#ffffff',
      borderColor: '#d97706',
      borderWidth: 0,
      borderRadius: 32,
      opacity: 1,
      rotation: 0,
      scale: 1,
      shadow: true
    }
  },
  {
    id: 'verified_secure',
    category: 'badges',
    name: 'Verified Secure',
    icon: '🔒',
    defaults: {
      type: 'pill_badge',
      label: '🛡️ Verified by Play Protect',
      width: 420,
      height: 60,
      fillColor: 'rgba(255, 255, 255, 0.15)',
      textColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.4)',
      borderWidth: 1.5,
      borderRadius: 30,
      opacity: 1,
      rotation: 0,
      scale: 1,
      shadow: false
    }
  },
  {
    id: 'five_stars',
    category: 'badges',
    name: '5 Golden Stars',
    icon: '⭐⭐⭐⭐⭐',
    defaults: {
      type: 'stars_row',
      label: '★★★★★',
      width: 320,
      height: 60,
      fillColor: '#fbbf24',
      textColor: '#fbbf24',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      opacity: 1,
      rotation: 0,
      scale: 1,
      shadow: true
    }
  },

  // --- Category: Floating UI & Notification Cards ---
  {
    id: 'toast_notification',
    category: 'cards',
    name: 'Floating Toast Card',
    icon: '💬',
    defaults: {
      type: 'ui_card',
      label: '🎉 Goal Achieved: 10,000 steps today!',
      sublabel: '2 minutes ago • Daily Health Tracker',
      width: 520,
      height: 100,
      fillColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#1e293b',
      borderColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 1.5,
      borderRadius: 24,
      opacity: 1,
      rotation: -3,
      scale: 1,
      shadow: true
    }
  },
  {
    id: 'payment_card',
    category: 'cards',
    name: 'Transaction Pill',
    icon: '💳',
    defaults: {
      type: 'ui_card',
      label: '✓ Payment Confirmed: $128.50',
      sublabel: 'Instant zero-fee transfer',
      width: 480,
      height: 90,
      fillColor: '#0f172a',
      textColor: '#38bdf8',
      borderColor: '#1e293b',
      borderWidth: 2,
      borderRadius: 20,
      opacity: 1,
      rotation: 4,
      scale: 1,
      shadow: true
    }
  },

  // --- Category: Geometric Shapes ---
  {
    id: 'rounded_rect',
    category: 'geometry',
    name: 'Rounded Rectangle',
    icon: '▢',
    defaults: {
      type: 'rounded_rect',
      label: '',
      width: 360,
      height: 220,
      fillColor: '#6366f1',
      borderColor: '#4338ca',
      borderWidth: 0,
      borderRadius: 28,
      opacity: 0.9,
      rotation: 0,
      scale: 1,
      shadow: true
    }
  },
  {
    id: 'circle',
    category: 'geometry',
    name: 'Circle / Disc',
    icon: '●',
    defaults: {
      type: 'circle',
      label: '',
      width: 260,
      height: 260,
      fillColor: '#ec4899',
      borderColor: '#be185d',
      borderWidth: 0,
      borderRadius: 130,
      opacity: 0.85,
      rotation: 0,
      scale: 1,
      shadow: true
    }
  },
  {
    id: 'pill_shape',
    category: 'geometry',
    name: 'Capsule / Pill',
    icon: '⬭',
    defaults: {
      type: 'pill',
      label: 'EXPLORE MORE',
      width: 380,
      height: 72,
      fillColor: '#8b5cf6',
      textColor: '#ffffff',
      borderColor: '#7c3aed',
      borderWidth: 0,
      borderRadius: 36,
      opacity: 1,
      rotation: 0,
      scale: 1,
      shadow: true
    }
  },
  {
    id: 'star_shape',
    category: 'geometry',
    name: '5-Point Star',
    icon: '★',
    defaults: {
      type: 'star',
      label: '',
      width: 180,
      height: 180,
      fillColor: '#f59e0b',
      borderColor: '#b45309',
      borderWidth: 0,
      borderRadius: 0,
      opacity: 1,
      rotation: 12,
      scale: 1,
      shadow: true
    }
  },

  // --- Category: Decorative Accents & Glows ---
  {
    id: 'glow_orb',
    category: 'accents',
    name: 'Neon Glow Orb',
    icon: '✨',
    defaults: {
      type: 'glow_orb',
      label: '',
      width: 320,
      height: 320,
      radius: 160,
      fillColor: '#38bdf8',
      opacity: 0.4,
      blur: 80,
      rotation: 0,
      scale: 1
    }
  },
  {
    id: 'organic_blob',
    category: 'accents',
    name: 'Organic Fluid Blob',
    icon: '🫧',
    defaults: {
      type: 'blob',
      label: '',
      width: 420,
      height: 380,
      fillColor: '#a855f7',
      opacity: 0.35,
      rotation: -15,
      scale: 1,
      shadow: false
    }
  }
];

/**
 * Creates a new shape instance ready to be placed on a screen.
 * @param {string} shapeDefId ID from SHAPE_DEFINITIONS
 * @param {number} x Canvas X coordinate
 * @param {number} y Canvas Y coordinate
 * @returns {Object} New shape instance
 */
export function createShape(shapeDefId, x = 540, y = 500) {
  const def = SHAPE_DEFINITIONS.find(s => s.id === shapeDefId) || SHAPE_DEFINITIONS[0];
  const newShape = JSON.parse(JSON.stringify(def.defaults));
  newShape.id = `shape-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  newShape.x = x;
  newShape.y = y;
  return newShape;
}

/**
 * Renders a shape onto an HTML5 Canvas 2D context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} shape Shape model object
 */
export function renderShape(ctx, shape) {
  if (!shape || shape.opacity === 0) return;

  ctx.save();
  ctx.translate(shape.x, shape.y);
  if (shape.rotation) {
    ctx.rotate((shape.rotation * Math.PI) / 180);
  }
  const scale = shape.scale || 1;
  ctx.scale(scale, scale);
  ctx.globalAlpha = shape.opacity !== undefined ? shape.opacity : 1;

  // Setup shadow
  if (shape.shadow) {
    ctx.shadowColor = shape.shadowColor || 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = shape.shadowBlur || 24;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = shape.shadowOffsetY || 12;
  }

  const w = shape.width || 300;
  const h = shape.height || 100;
  const halfW = w / 2;
  const halfH = h / 2;

  switch (shape.type) {
    case 'rating_badge':
    case 'pill_badge':
    case 'pill': {
      const radius = shape.borderRadius !== undefined ? shape.borderRadius : h / 2;
      drawRoundedRect(ctx, -halfW, -halfH, w, h, radius);
      ctx.fillStyle = shape.fillColor || '#ffffff';
      ctx.fill();

      if (shape.borderWidth > 0 && shape.borderColor) {
        ctx.strokeStyle = shape.borderColor;
        ctx.lineWidth = shape.borderWidth;
        ctx.stroke();
      }

      // Draw label text
      if (shape.label) {
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = shape.textColor || '#1e1b4b';
        ctx.font = `700 ${Math.round(h * 0.42)}px "Plus Jakarta Sans", Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shape.label, 0, 2);
      }
      break;
    }

    case 'ui_card': {
      const radius = shape.borderRadius || 20;
      drawRoundedRect(ctx, -halfW, -halfH, w, h, radius);
      ctx.fillStyle = shape.fillColor || '#ffffff';
      ctx.fill();

      if (shape.borderWidth > 0 && shape.borderColor) {
        ctx.strokeStyle = shape.borderColor;
        ctx.lineWidth = shape.borderWidth;
        ctx.stroke();
      }

      ctx.shadowColor = 'transparent';
      ctx.textAlign = 'center';

      // Primary text
      ctx.fillStyle = shape.textColor || '#1e293b';
      ctx.font = `700 ${Math.round(h * 0.28)}px "Plus Jakarta Sans", Inter, sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.fillText(shape.label || '', 0, -4);

      // Sublabel text
      if (shape.sublabel) {
        ctx.fillStyle = shape.subtextColor || 'rgba(100, 116, 139, 0.9)';
        ctx.font = `500 ${Math.round(h * 0.2)}px Inter, sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(shape.sublabel, 0, 6);
      }
      break;
    }

    case 'stars_row': {
      ctx.fillStyle = shape.fillColor || '#fbbf24';
      ctx.font = `800 ${Math.round(h * 0.75)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shape.label || '★★★★★', 0, 0);
      break;
    }

    case 'rounded_rect': {
      const radius = shape.borderRadius || 24;
      drawRoundedRect(ctx, -halfW, -halfH, w, h, radius);
      ctx.fillStyle = shape.fillColor || '#6366f1';
      ctx.fill();

      if (shape.borderWidth > 0 && shape.borderColor) {
        ctx.strokeStyle = shape.borderColor;
        ctx.lineWidth = shape.borderWidth;
        ctx.stroke();
      }
      break;
    }

    case 'circle': {
      ctx.beginPath();
      ctx.arc(0, 0, halfW, 0, Math.PI * 2);
      ctx.fillStyle = shape.fillColor || '#ec4899';
      ctx.fill();

      if (shape.borderWidth > 0 && shape.borderColor) {
        ctx.strokeStyle = shape.borderColor;
        ctx.lineWidth = shape.borderWidth;
        ctx.stroke();
      }
      break;
    }

    case 'star': {
      drawStar(ctx, 0, 0, 5, halfW, halfW * 0.48);
      ctx.fillStyle = shape.fillColor || '#f59e0b';
      ctx.fill();

      if (shape.borderWidth > 0 && shape.borderColor) {
        ctx.strokeStyle = shape.borderColor;
        ctx.lineWidth = shape.borderWidth;
        ctx.stroke();
      }
      break;
    }

    case 'glow_orb': {
      const rad = shape.radius || halfW;
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
      grad.addColorStop(0, shape.fillColor || '#38bdf8');
      grad.addColorStop(0.5, shape.fillColor || '#38bdf8');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'blob': {
      drawOrganicBlob(ctx, halfW, halfH);
      ctx.fillStyle = shape.fillColor || '#a855f7';
      ctx.fill();
      break;
    }

    default:
      drawRoundedRect(ctx, -halfW, -halfH, w, h, 16);
      ctx.fillStyle = shape.fillColor || '#4f46e5';
      ctx.fill();
      break;
  }

  ctx.restore();
}

/**
 * Draws a rounded rectangle path on canvas.
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Draws a 5-point star polygon.
 */
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

/**
 * Draws a smooth organic blob path using cubic bezier curves.
 */
function drawOrganicBlob(ctx, rx, ry) {
  ctx.beginPath();
  ctx.moveTo(0, -ry * 0.9);
  ctx.bezierCurveTo(rx * 0.8, -ry * 1.1, rx * 1.1, -ry * 0.2, rx * 0.95, ry * 0.4);
  ctx.bezierCurveTo(rx * 0.85, ry * 0.95, rx * 0.2, ry * 1.1, -rx * 0.3, ry * 0.9);
  ctx.bezierCurveTo(-rx * 0.9, ry * 0.75, -rx * 1.1, -ry * 0.1, -rx * 0.85, -ry * 0.6);
  ctx.bezierCurveTo(-rx * 0.65, -ry * 0.95, -rx * 0.3, -ry * 0.9, 0, -ry * 0.9);
  ctx.closePath();
}

/**
 * Tests if a canvas point (px, py) hits the bounding box of a shape.
 * @param {Object} shape
 * @param {number} px
 * @param {number} py
 * @returns {boolean}
 */
export function isPointInsideShape(shape, px, py) {
  const scale = shape.scale || 1;
  const w = (shape.width || 200) * scale;
  const h = (shape.height || 100) * scale;

  // If rotated, unrotate test point
  let dx = px - shape.x;
  let dy = py - shape.y;
  if (shape.rotation) {
    const rad = (-shape.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    dx = rx;
    dy = ry;
  }

  return Math.abs(dx) <= w / 2 && Math.abs(dy) <= h / 2;
}
