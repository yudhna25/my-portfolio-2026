export const WORKS_IDS = Object.freeze(['edura', 'veris', 'vie']);
export const WORKS_ORBIT_SPEED = 0.075; // radians/second; staged orbit, not astronomy.

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
