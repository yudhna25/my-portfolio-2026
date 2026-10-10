import { clampStoryProgress, storyCameraPath } from './cameraPath.js';

export const STORY_METEOR_SAMPLES = 128;
export const STORY_METEOR_TRAIL = 0.24;
const smooth = value => { const p = clampStoryProgress(value); return p * p * (3 - 2 * p); };

// Frame data shared by the DOM measurement and the single scene renderer.
export function createMeteorLayout() {
  return { width: 1, height: 1, range: 0, points: new Float64Array(10), milestones: new Float64Array(3) };
}

export function meteorReadingY(layout, progress) {
  const p = clampStoryProgress(progress);
  return p * layout.range + (0.22 + 0.28 * smooth(p)) * layout.height;
}

export function meteorEmphasis(layout, index, progress) {
  const distance = Math.abs(meteorReadingY(layout, progress) - layout.milestones[index]);
  return 1 - smooth(distance / (layout.height * 0.2));
}

export function meteorVisibility(chapter, progress) {
  const p = clampStoryProgress(progress);
  return chapter === 'experience' ? smooth(p / 0.035)
    : chapter === 'departure' ? 1 - smooth((p - 0.70) / 0.30) : 0;
}

export function worksArrival(chapter, progress) {
  return chapter === 'departure' ? smooth((progress - 0.30) / 0.70) : 1;
}

// One world curve through the projected DOM milestones, then a depth dive.
// Each sample uses its own authored scroll/pose, never the current frame's history.
// q: Experience 0..1, departure 1..2.
export function sampleStoryMeteor(layout, q, out, pose) {
  q = Math.max(0, Math.min(2, q));
  const aspect = layout.width / layout.height;
  let x, y, depth;
  if (q <= 1) {
    const contentY = meteorReadingY(layout, q);
    const points = layout.points;
    let segment = 0;
    while (segment < 3 && contentY > points[(segment + 1) * 2 + 1]) segment++;
    const start = segment * 2, end = start + 2;
    const t = smooth((contentY - points[start + 1]) / Math.max(1, points[end + 1] - points[start + 1]));
    x = points[start] + (points[end] - points[start]) * t;
    y = (contentY - q * layout.range) / layout.height;
    depth = 24;
    storyCameraPath('experience', 1, pose, false, aspect);
  } else {
    const p = q - 1, ease = smooth(p);
    x = layout.points[8] + (0.5 - layout.points[8]) * ease;
    y = 0.5;
    depth = 24 + 72 * ease;
    storyCameraPath('departure', p, pose, false, aspect);
  }
  // Camera basis in scalars: no Vector/Matrix allocations per trail sample.
  let fx = pose.lookX - pose.x, fy = pose.lookY - pose.y, fz = pose.lookZ - pose.z;
  const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
  const rl = Math.hypot(fz, fx), rx = -fz / rl, rz = fx / rl;
  const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
  // The second basis axis points down, matching DOM coordinates.
  const height = 2 * Math.tan(Math.PI / 6) / Math.min(1, aspect) * depth;
  const sx = (x - 0.5) * height * aspect, sy = (y - 0.5) * height;
  out.x = pose.x + fx * depth + rx * sx + ux * sy;
  out.y = pose.y + fy * depth + uy * sy;
  out.z = pose.z + fz * depth + rz * sx + uz * sy;
  return out;
}

export function writeStoryMeteor(layout, journey, positions, out, pose) {
  for (let i = 0; i < positions.length / 3; i++) {
    const q = journey - i / (positions.length / 3 - 1) * STORY_METEOR_TRAIL;
    sampleStoryMeteor(layout, q, out, pose);
    positions[i * 3] = out.x; positions[i * 3 + 1] = out.y; positions[i * 3 + 2] = out.z;
  }
}
