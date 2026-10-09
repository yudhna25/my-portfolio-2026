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
  const t = portalSmooth(index * 0.006, 0.435, p);
  const center = portalSmooth(0.04, 0.35, p);
  const ox = anchor ? anchor.left + anchor.width / 2 : width * 0.75;
  const oy = anchor ? anchor.top + anchor.height / 2 : height * 0.4;
  const cx = ox + (width * 0.5 - ox) * center;
  const cy = oy + (height * 0.45 - oy) * center;
  const dx = cx - layout.x, dy = cy - layout.y;
  const curve = Math.sin(t * Math.PI) * 0.24;
  out.x = dx * t - dy * curve;
  out.y = dy * t + dx * curve;
  out.rotation = Math.atan2(dy, dx) * 180 / Math.PI * portalSmooth(0.08, 0.35, p);
  out.scaleX = Math.max(0.01, Math.pow(1 - t, 1.5) * (1 + 3.2 * Math.sin(t * Math.PI)));
  out.scaleY = Math.max(0.01, Math.pow(1 - t, 2.3));
  out.opacity = 1 - portalSmooth(0.34, 0.435, p);
  return out;
}
