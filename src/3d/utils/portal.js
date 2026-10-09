import { clampStoryProgress } from './cameraPath.js';

const smooth = (a, b, value) => {
  const t = clampStoryProgress((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export function portalProgress(chapter, progress, frozen = false) {
  return chapter === 'hero' ? 0 : chapter === 'portal' ? frozen ? 1 : clampStoryProgress(progress) : 1;
}

export function portalState(progress, out = {}) {
  const p = clampStoryProgress(progress);
  out.pull = p;
  out.mini = p < 0.52 ? 1 : 0;
  out.visibility = out.mini ? 1 - smooth(0.43, 0.48, p) : smooth(0.60, 0.74, p);
  out.growth = Math.exp(Math.log(600) * Math.pow(smooth(0, 0.45, p), 4));
  out.textOpacity = 1 - smooth(0.28, 0.43, p);
  out.dust = out.textOpacity * 0.12;
  return out;
}
