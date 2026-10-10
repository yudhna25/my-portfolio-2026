import { finaleState } from './finale.js';

export const WORKS_IDS = Object.freeze(['edura', 'veris', 'vie']);
export const WORKS_ORBIT_SPEED = 0.075; // radians/second; staged orbit, not astronomy.

// Geometry telemetry, not interaction state. App passes this same object to both consumers.
export function createWorksLayout() {
  return { ready: false, width: 0, height: 0, basis: null, onChange: null,
    figures: WORKS_IDS.map(id => ({ id, left: 0, top: 0, right: 0, bottom: 0 })) };
}

export function worksBounds(item) {
  const { plane } = item.artwork;
  const bounds = { left: plane.center[0] - plane.width / 2, right: plane.center[0] + plane.width / 2,
    top: plane.center[1] + plane.height / 2, bottom: plane.center[1] - plane.height / 2 };
  for (const star of [...item.geometry.stars, ...item.geometry.supportingStars]) {
    bounds.left = Math.min(bounds.left, star.position[0]); bounds.right = Math.max(bounds.right, star.position[0]);
    bounds.top = Math.max(bounds.top, star.position[1]); bounds.bottom = Math.min(bounds.bottom, star.position[1]);
  }
  return bounds;
}

export function worksStage(width, height, bounds) {
  const mobile = width < 1024;
  const widths = bounds.map(b => b.right - b.left);
  const heights = bounds.map(b => b.top - b.bottom);
  const drift = mobile ? 4 : 8;
  const desired = Math.min(width * 0.15, height * 0.13) * 1.8;
  const scale = mobile ? Math.min(desired, (width - 60) / (widths[1] + widths[2]),
    Math.max(44, height - 422) / (heights[0] + Math.max(heights[1], heights[2])))
    : Math.min(desired, (width - 144) / widths.reduce((a, b) => a + b, 0),
      (height * 0.52 - 64) / Math.max(...heights));
  const centers = mobile ? [
    [width / 2, 148 + heights[0] * scale / 2],
    [24 + widths[1] * scale / 2, 170 + heights[0] * scale + Math.max(heights[1], heights[2]) * scale / 2],
    [width - 24 - widths[2] * scale / 2, 170 + heights[0] * scale + Math.max(heights[1], heights[2]) * scale / 2],
  ] : [[48 + widths[0] * scale / 2, height * 0.4],
    [width - 48 - widths[1] * scale / 2, height * 0.4], [width / 2, height * 0.74]];
  return { scale, drift, centers: centers.map(([x, y], i) => [
    x - (bounds[i].left + bounds[i].right) * scale / 2,
    y + (bounds[i].top + bounds[i].bottom) * scale / 2,
  ]) };
}

// Readable triangle at idle; the same captured pose contracts into the existing finale.
export function worksFigure(progress, origin, index, basis, out) {
  finaleState(progress, out);
  const phase = origin + index * Math.PI * 2 / 3;
  const x = basis.centers[index][0] + Math.sin(phase) * basis.drift;
  const y = basis.centers[index][1] + Math.cos(phase) * basis.drift;
  const cosine = Math.cos(out.angle), sine = Math.sin(out.angle);
  out.x = basis.hole.x * out.travel + (x * cosine - y * sine) * out.radius;
  out.y = basis.hole.y * out.travel + (x * sine + y * cosine) * out.radius;
  out.z = basis.hole.z * out.travel;
  out.scale = basis.scale * out.figure;
  return out;
}

export function placeWorksPreview(layout, id, width, height, out) {
  const margin = 16;
  if (layout.width < 1024) { out.x = margin; out.y = layout.height - height - 24; return out; }
  const box = layout.figures.find(item => item.id === id);
  if (!box) return out;
  const clampX = x => Math.max(margin, Math.min(layout.width - width - margin, x));
  const clampY = y => Math.max(132, Math.min(layout.height - height - margin, y));
  const candidates = [[box.right + 20, box.top], [box.left - width - 20, box.top],
    [(box.left + box.right - width) / 2, box.top - height - 20],
    [(box.left + box.right - width) / 2, box.bottom + 20],
    [(layout.width - width) / 2, 132]];
  let best = Infinity;
  for (const [cx, cy] of candidates) {
    const x = clampX(cx), y = clampY(cy);
    let score = Math.hypot(x + width / 2 - (box.left + box.right) / 2, y + height / 2 - (box.top + box.bottom) / 2);
    for (const figure of layout.figures) {
      const overlap = Math.max(0, Math.min(x + width, figure.right + 8) - Math.max(x, figure.left - 8))
        * Math.max(0, Math.min(y + height, figure.bottom + 8) - Math.max(y, figure.top - 8));
      score += overlap * (figure.id === id ? 1000 : 100);
    }
    if (score < best) { best = score; out.x = x; out.y = y; }
  }
  return out;
}

// Imperative frame data, shared through the store; never subscribe to its scalars.
export function createWorksOrbit(phase = 0) {
  return { phase, origin: phase, velocity: 0, latched: false, visited: false, captures: 0, resumePending: false };
}

// Called synchronously by the sole story producer, before the next idle frame.
export function syncWorksOrbit(orbit, chapter, progress) {
  if (chapter === 'works') {
    if (orbit.latched) {
      orbit.phase = orbit.origin;
      orbit.velocity = 0;
      orbit.latched = false;
      orbit.resumePending = true;
    }
    orbit.visited = true;
  } else if ((chapter === 'finale' && progress > 0 || chapter === 'contact') && !orbit.latched) {
    orbit.origin = orbit.phase;
    orbit.latched = true;
    orbit.velocity = 0;
    orbit.captures++;
  }
}

export function advanceWorksOrbit(orbit, delta, paused, frozen, active) {
  if (frozen || !active || orbit.latched) return;
  if (orbit.resumePending) { orbit.resumePending = false; return; }
  const dt = Math.min(0.05, Math.max(0, delta));
  const target = paused ? 0 : WORKS_ORBIT_SPEED;
  const decay = Math.exp(-6 * dt);
  // Integrate the exponential easing exactly; same speed at different refresh rates.
  orbit.phase += target * dt + (orbit.velocity - target) * (1 - decay) / 6;
  orbit.velocity = target + (orbit.velocity - target) * decay;
  if (paused && orbit.velocity < 0.00001) orbit.velocity = 0;
}
