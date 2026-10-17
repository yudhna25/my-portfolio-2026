import { Vector4 } from 'three';
import { WORKS_TRAIL } from '@/3d/shaders/worksLens';

// Local stand-in for the shared gravity field (src/3d/field/useGravityField.js, landing from
// the Hero branch): a short trail of decaying wells in a card's UV space. Swap the trail
// source for that field once it lands; the card shader only needs (uv, energy, speed).
export function createPointerTracker() {
  const tracker = { x: 0, y: 0, mouse: false, moved: false };
  const move = event => {
    tracker.mouse = event.pointerType === 'mouse';
    tracker.x = event.clientX; tracker.y = event.clientY; tracker.moved = true;
  };
  window.addEventListener('pointermove', move, { passive: true });
  tracker.dispose = () => window.removeEventListener('pointermove', move);
  return tracker;
}

export function createTrail() {
  return { samples: Array.from({ length: WORKS_TRAIL }, () => new Vector4()), last: null, head: 0 };
}

// uv is the hit point (or null), aspect the card's width/height; dt in seconds.
export function stepTrail(trail, uv, aspect, dt) {
  const decay = Math.exp(-dt * 2.4);
  for (const sample of trail.samples) sample.z *= decay;
  if (!uv) { trail.last = null; return; }
  const last = trail.last;
  const distance = last ? Math.hypot((uv.x - last.x) * aspect, uv.y - last.y) : 0;
  if (last && distance < 0.012) {
    // Resting cursor: keep a gentle well under it, no flash.
    const head = trail.samples[trail.head];
    head.z = Math.max(head.z, 0.55); head.w *= decay;
    return;
  }
  trail.head = (trail.head + 1) % trail.samples.length;
  const speed = Math.min(1, distance / Math.max(dt, 1 / 120) / 2.5);
  trail.samples[trail.head].set(uv.x, uv.y, 1, speed);
  trail.last = { x: uv.x, y: uv.y };
}

export function clearTrail(trail) {
  for (const sample of trail.samples) sample.z = 0;
  trail.last = null;
}
