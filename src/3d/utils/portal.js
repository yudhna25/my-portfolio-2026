import { clampStoryProgress } from './cameraPath.js';

export const portalSmooth = (a, b, value) => {
  const t = clampStoryProgress((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function portalProgress(chapter, progress, frozen = false) {
  return chapter === 'hero' ? 0 : chapter === 'portal' ? frozen ? 1 : clampStoryProgress(progress) : 1;
}

export function portalState(progress, out = {}) {
  const p = clampStoryProgress(progress);
  out.pull = p;
  out.intake = portalSmooth(0, 0.44, p);
  out.eject = portalSmooth(0.50, 0.94, p);
  out.center = portalSmooth(0.04, 0.35, p);
  // Rebase the exterior observer only while every composed layer is black.
  out.mini = p < 0.47 ? 1 : 0;
  out.visibility = p < 0.47 ? 1 - portalSmooth(0.425, 0.44, p) : portalSmooth(0.50, 0.56, p);
  out.growth = Math.exp(Math.log(120) * out.intake * out.intake);
  out.textOpacity = 1 - portalSmooth(0.34, 0.44, p);
  out.backdrop = p < 0.44 || p > 0.50;
  out.aboutOpacity = portalSmooth(0.54, 0.66, p);
  out.aboutInteractive = p >= 0.84;
  out.controlsOpacity = p < 0.5 ? out.textOpacity : portalSmooth(0.90, 0.96, p);
  out.controlsInteractive = p === 0 || p >= 0.96;
  out.dust = 0.08 * out.textOpacity;
  return out;
}

// Layout is cached without transforms; motion never changes the measured O slot.
export function portalIntake(p, layout, anchor, width, height, index = 0, out = {}) {
  let t = portalSmooth(Math.min(index, 50) * 0.0005, 0.435, p);
  // Stagger arrival along the same funnel instead of stacking opaque glyphs at its join.
  t += (index % 16) * 0.015 * funnelSmooth(0.08, 0.38, t) * (1 - t);
  return portalIntakeSample(p, t, layout, anchor, width, height, index, out);
}

// Every branch joins the same funnel; sampling ahead creates a bounded afterimage ribbon.
const funnelSmooth = (a, b, value) => {
  const t = clampStoryProgress((value - a) / (b - a));
  return t * t * t * (t * (6 * t - 15) + 10);
};
const funnelSlope = (a, b, value) => {
  const t = clampStoryProgress((value - a) / (b - a));
  return 30 * t * t * (t - 1) * (t - 1) / (b - a);
};

export function portalIntakeSample(p, t, layout, anchor, width, height, index = 0, out = {}) {
  t = clampStoryProgress(t);
  const center = portalSmooth(0.04, 0.35, p);
  const ox = anchor ? anchor.left + anchor.width / 2 : width * 0.75;
  const oy = anchor ? anchor.top + anchor.height / 2 : height * 0.4;
  const cx = ox + (width * 0.5 - ox) * center;
  const cy = oy + (height * 0.45 - oy) * center;
  const dx = layout.x - cx, dy = layout.y - cy;
  const radius = Math.hypot(dx, dy);
  const start = Math.atan2(dy, dx);
  const join = funnelSmooth(0.04, 0.46, t);
  // Unwrap the entry angle before blending so no branch takes a sudden long turn.
  const launch = start + Math.atan2(Math.sin(-Math.PI * 0.75 - start), Math.cos(-Math.PI * 0.75 - start));
  const angle = start + (launch - start) * join + Math.PI * 2.5 * funnelSmooth(0.08, 1, t);
  const funnel = Math.min(width, height) * 0.43 * (1 + (index % 5 - 2) * 0.006 * (1 - t));
  const radial = radius * (1 - join) + funnel * join;
  const r = radial * Math.pow(1 - t, 1.45);
  const depth = 0.76 + 0.24 * funnelSmooth(0, 0.46, t);
  out.x = cx + Math.cos(angle) * r - layout.x;
  out.y = cy + Math.sin(angle) * r * depth - layout.y;
  // Preserve the source pose exactly at rest, including its vertical distance from O.
  out.y += dy * (1 - depth) * (1 - join);
  const joinSlope = funnelSlope(0.04, 0.46, t);
  const angleSlope = (launch - start) * joinSlope + Math.PI * 2.5 * funnelSlope(0.08, 1, t);
  const funnelSlopeAt = -Math.min(width, height) * 0.43 * (index % 5 - 2) * 0.006;
  const radiusSlope = ((funnel - radius) * joinSlope + funnelSlopeAt * join) * Math.pow(1 - t, 1.45)
    - 1.45 * radial * Math.pow(1 - t, 0.45);
  const depthSlope = 0.24 * funnelSlope(0, 0.46, t);
  const vx = Math.cos(angle) * radiusSlope - Math.sin(angle) * r * angleSlope;
  const vy = (Math.sin(angle) * radiusSlope + Math.cos(angle) * r * angleSlope) * depth
    + Math.sin(angle) * r * depthSlope - dy * (depthSlope * (1 - join) + (1 - depth) * joinSlope);
  const tangentBase = angle + Math.PI;
  const tangent = tangentBase + Math.atan2(Math.sin(Math.atan2(vy, vx) - tangentBase), Math.cos(Math.atan2(vy, vx) - tangentBase));
  out.rotation = tangent * 180 / Math.PI * funnelSmooth(0.12, 0.38, t);
  const uniform = Math.pow(1 - t, 1.15);
  const stretch = 1 + 1.5 * funnelSmooth(0.20, 0.78, t) * (1 - funnelSmooth(0.78, 1, t));
  const span = layout.width || 1;
  const fit = ((1 - join) * span + join * Math.max(6, r * 0.32)) / span;
  out.scaleX = Math.max(0.001, Math.min(uniform * stretch, fit));
  out.scaleY = Math.max(0.001, uniform * (1 - 0.62 * funnelSmooth(0.25, 0.85, t)));
  out.opacity = (1 - portalSmooth(0.34, 0.435, p)) * (1 - funnelSmooth(0.12, 0.33, t));
  out.t = t;
  out.tangent = tangent;
  out.radius = r;
  return out;
}
