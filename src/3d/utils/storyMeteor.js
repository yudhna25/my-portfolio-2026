import { clampStoryProgress, storyCameraPath } from './cameraPath.js';

export const STORY_METEOR_SAMPLES = 128;
export const STORY_METEOR_TRAIL = 0.24;
const smooth = value => { const p = clampStoryProgress(value); return p * p * (3 - 2 * p); };
const smoother = value => { const p = clampStoryProgress(value); return p * p * p * (10 + p * (-15 + 6 * p)); };

// Frame data shared by the DOM measurement and the single scene renderer.
export function createMeteorLayout() {
  return { width: 1, height: 1, range: 0, points: new Float64Array(10), milestones: new Float64Array(3) };
}

export function meteorReadingY(layout, progress) {
  const p = clampStoryProgress(progress);
  return p * layout.range + (0.22 + 0.28 * smoother(p)) * layout.height;
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

function curveSlope(points, index, exitSlope) {
  if (index === 4) return exitSlope;
  if (index === 0) return (points[2] - points[0]) / Math.max(1, points[3] - points[1]);
  return (points[index * 2 + 2] - points[index * 2 - 2])
    / Math.max(1, points[index * 2 + 3] - points[index * 2 - 1]);
}

function curveBend(points, index) {
  if (index === 0 || index === 4) return 0;
  const left = Math.max(1, points[index * 2 + 1] - points[index * 2 - 1]);
  const right = Math.max(1, points[index * 2 + 3] - points[index * 2 + 1]);
  return 2 * ((points[index * 2 + 2] - points[index * 2]) / right
    - (points[index * 2] - points[index * 2 - 2]) / left) / (left + right);
}

// Shared endpoint derivatives make the measured S path C2 through every milestone.
function curveX(points, contentY, exitSlope) {
  if (contentY < points[1]) return points[0] + (contentY - points[1]) * curveSlope(points, 0, exitSlope);
  if (contentY >= points[9]) return points[8];
  let segment = 0;
  while (segment < 3 && contentY > points[(segment + 1) * 2 + 1]) segment++;
  const start = segment * 2, end = start + 2;
  const span = Math.max(1, points[end + 1] - points[start + 1]);
  const t = clampStoryProgress((contentY - points[start + 1]) / span);
  const t2 = t * t, t3 = t2 * t, t4 = t3 * t, t5 = t4 * t;
  return points[start] * (1 - 10 * t3 + 15 * t4 - 6 * t5)
    + points[end] * (10 * t3 - 15 * t4 + 6 * t5)
    + span * (curveSlope(points, segment, exitSlope) * (t - 6 * t3 + 8 * t4 - 3 * t5)
      + curveSlope(points, segment + 1, exitSlope) * (-4 * t3 + 7 * t4 - 3 * t5))
    + span * span * 0.5 * (curveBend(points, segment) * (t2 - 3 * t3 + 3 * t4 - t5)
      + curveBend(points, segment + 1) * (t3 - 2 * t4 + t5));
}

function worldPoint(x, y, depth, aspect, out, pose) {
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

// Negative q is an authored offscreen approach, not frame history.
// q: pre-entry -0.9..0, Experience 0..1, departure 1..2.
export function sampleStoryMeteor(layout, q, out, pose) {
  q = Math.max(-0.9, Math.min(2, Number.isFinite(q) ? q : 0));
  const aspect = layout.width / layout.height;
  if (q <= 1) {
    const contentY = q < 0 ? q * layout.range + 0.22 * layout.height : meteorReadingY(layout, q);
    storyCameraPath('experience', 1, pose, false, aspect);
    return worldPoint(curveX(layout.points, contentY, -0.12 / Math.max(1, layout.range)),
      (contentY - q * layout.range) / layout.height, 24, aspect, out, pose);
  }
  const p = q - 1, ease = smoother(p);
  let startX = 0, startY = 0, startZ = 0;
  if (p < 0.16) {
    storyCameraPath('experience', 1, pose, false, aspect);
    worldPoint(layout.points[8] - 0.12 * p, 0.5, 24, aspect, out, pose);
    startX = out.x; startY = out.y; startZ = out.z;
  }
  storyCameraPath('departure', p, pose, false, aspect);
  const x = layout.points[8] + (0.5 - layout.points[8]) * ease
    - 0.12 * (p - 6 * p * p * p + 8 * p ** 4 - 3 * p ** 5);
  worldPoint(x, 0.5, 24 + 72 * ease, aspect, out, pose);
  if (p < 0.16) {
    // Preserve the incoming tangent and acceleration while the shared camera turns.
    const join = smoother(p / 0.16);
    out.x = startX + (out.x - startX) * join;
    out.y = startY + (out.y - startY) * join;
    out.z = startZ + (out.z - startZ) * join;
  }
  return out;
}

export function writeStoryMeteor(layout, journey, positions, out, pose) {
  for (let i = 0; i < positions.length / 3; i++) {
    const q = journey - i / (positions.length / 3 - 1) * STORY_METEOR_TRAIL;
    sampleStoryMeteor(layout, q, out, pose);
    positions[i * 3] = out.x; positions[i * 3 + 1] = out.y; positions[i * 3 + 2] = out.z;
  }
}

// A short trailing pulse; the milestone is quiet again after the tail passes.
export function meteorWake(layout, index, progress) {
  const distance = meteorReadingY(layout, progress) - layout.milestones[index];
  return smoother((distance + layout.height * 0.06) / (layout.height * 0.06))
    * (1 - smoother(distance / (layout.height * 0.26)));
}

// Broad progress-driven light swell; no timer can flash again on reverse.
export function meteorFlare(layout, progress) {
  const y = meteorReadingY(layout, progress);
  let quiet = 1;
  for (let i = 0; i < layout.milestones.length; i++) {
    quiet *= smoother(Math.abs(y - layout.milestones[i]) / (layout.height * 0.30));
  }
  return 1 - quiet;
}

function projectPoint(point, view, projection, width, height) {
  const x = view[0] * point.x + view[4] * point.y + view[8] * point.z + view[12];
  const y = view[1] * point.x + view[5] * point.y + view[9] * point.z + view[13];
  const z = view[2] * point.x + view[6] * point.y + view[10] * point.z + view[14];
  const w = projection[3] * x + projection[7] * y + projection[11] * z + projection[15];
  point.px = ((projection[0] * x + projection[4] * y + projection[8] * z + projection[12]) / w + 1) * width / 2;
  point.py = (1 - (projection[1] * x + projection[5] * y + projection[9] * z + projection[13]) / w) * height / 2;
  point.w = w;
}

// Presentation length is measured in this camera, not a frame-history buffer.
export function writeStoryRibbon(layout, journey, positions, normals, screen, view, projection, out, pose, metrics) {
  const width = layout.width, height = layout.height, desired = width * 0.42;
  const maxSpan = Math.min(journey + 0.9, 1.6), step = maxSpan / STORY_METEOR_SAMPLES;
  sampleStoryMeteor(layout, journey, out, pose);
  projectPoint(out, view, projection, width, height);
  metrics.headX = out.px; metrics.headY = out.py;
  let px = out.px, py = out.py, length = 0, span = 0;
  for (let i = 1; i <= STORY_METEOR_SAMPLES; i++) {
    sampleStoryMeteor(layout, journey - i * step, out, pose);
    projectPoint(out, view, projection, width, height);
    if (out.w <= 0.1 || !Number.isFinite(out.px + out.py)) break;
    const segment = Math.hypot(out.px - px, out.py - py);
    if (length + segment >= desired) {
      span = (i - 1 + (desired - length) / Math.max(segment, 0.0001)) * step;
      break;
    }
    length += segment; span = i * step; px = out.px; py = out.py;
  }
  metrics.span = span; metrics.tailPixels = 0;
  for (let i = 0; i < STORY_METEOR_SAMPLES; i++) {
    sampleStoryMeteor(layout, journey - span * i / (STORY_METEOR_SAMPLES - 1), out, pose);
    projectPoint(out, view, projection, width, height);
    screen[i * 2] = out.px; screen[i * 2 + 1] = out.py;
    if (i) metrics.tailPixels += Math.hypot(out.px - screen[(i - 1) * 2], out.py - screen[(i - 1) * 2 + 1]);
    for (let side = 0; side < 2; side++) {
      const offset = (i * 2 + side) * 3;
      positions[offset] = out.x; positions[offset + 1] = out.y; positions[offset + 2] = out.z;
    }
  }
  for (let i = 0; i < STORY_METEOR_SAMPLES; i++) {
    const previous = Math.max(0, i - 1) * 2, next = Math.min(STORY_METEOR_SAMPLES - 1, i + 1) * 2;
    const dx = screen[next] - screen[previous], dy = screen[next + 1] - screen[previous + 1];
    const distance = Math.hypot(dx, dy);
    for (let side = 0; side < 2; side++) {
      const offset = (i * 2 + side) * 2;
      normals[offset] = distance > 0.0001 ? -dy / distance : 0;
      normals[offset + 1] = distance > 0.0001 ? -dx / distance : 1;
    }
  }
  return metrics;
}
