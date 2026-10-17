// Shared scroll clock; no elapsed-time simulation in the collision or debris.
export const FINALE_PHASES = Object.freeze({ retract: 0.12, compress: 0.34, collision: 0.44, nebula: 0.70, formed: 0.96 });
const clamp = p => Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0;
export function finaleSmooth(a, b, p) {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}
// Apparent BH scale: the shadow grows to about 55vh whatever the camera distance.
export function finaleScreenScale(distance, fov, cssHeight, collapse, zoom) {
  const radius = Math.max(1.1, distance);
  const shadowAngle = Math.asin(Math.min(0.999, 2.598076 * Math.sqrt(1 - 1 / radius) / radius));
  const shadow = Math.tan(shadowAngle) * cssHeight / (2 * Math.tan(fov * Math.PI / 360));
  return cssHeight * 0.27 * (0.12 + 0.88 * collapse) * zoom / shadow;
}
export function finaleState(progress, out = {}) {
  const p = clamp(progress);
  out.progress = p;
  out.label = 1 - finaleSmooth(0, 0.12, p);
  out.travel = finaleSmooth(0.12, 0.44, p);
  // Inspiral chirp: the shared turn accelerates without bound toward the collision.
  out.angle = -2.4 * Math.log(1 - 0.985 * clamp((p - 0.12) / 0.32));
  // Luminous tidal streams shed behind each constellation, poured into the collision.
  out.streams = finaleSmooth(0.12, 0.22, p) * (1 - finaleSmooth(0.44, 0.50, p));
  out.radius = (1 - 0.76 * finaleSmooth(0.12, 0.34, p)) * (1 - finaleSmooth(0.34, 0.44, p));
  out.figure = (1 - 0.7 * finaleSmooth(0.12, 0.34, p)) * (1 - finaleSmooth(0.34, 0.44, p));
  out.stars = 1 - finaleSmooth(0.43, 0.47, p);
  out.trails = finaleSmooth(0.12, 0.24, p) * (1 - finaleSmooth(0.44, 0.55, p));
  out.cloud = finaleSmooth(0.44, 0.54, p) * (1 - finaleSmooth(0.84, 0.96, p));
  out.collapse = finaleSmooth(0.70, 0.96, p);
  out.hole = finaleSmooth(0.78, 0.96, p);
  out.formation = 0.16 * finaleSmooth(0.44, 0.68, p) + 0.56 * finaleSmooth(0.68, 0.96, p);
  out.flare = finaleSmooth(0.34, 0.44, p) * (1 - finaleSmooth(0.44, 0.56, p));
  out.contact = finaleSmooth(0.96, 1, p);
  // Push in on the newborn disk, then settle on the unchanged Contact framing.
  out.zoom = 1 + 0.38 * finaleSmooth(0.64, 0.84, p) * (1 - finaleSmooth(0.90, 1, p));
  // Black-sun grade: amber disk and a faster stream during the transition, handed back
  // to the unchanged Contact black hole at p = 1.
  out.warm = finaleSmooth(0.40, 0.52, p) * (1 - finaleSmooth(0.92, 1, p));
  // Kilonova: the fireball (world radius, heat, density) and its flattening into the disk.
  const blast = Math.max(0, p - FINALE_PHASES.collision);
  out.fireRadius = p < FINALE_PHASES.collision ? 0 : 0.6 + 23 * (1 - Math.exp(-blast * 10));
  out.fireHeat = 0.2 + 0.9 * Math.exp(-blast * 9);
  out.fireDensity = finaleSmooth(0.44, 0.47, p) * (1 - finaleSmooth(0.74, 0.88, p));
  out.flatten = finaleSmooth(0.60, 0.88, p);
  // Ejecta captured onto Keplerian orbits; the particle disk hands over to the ray-traced one.
  out.capture = finaleSmooth(0.56, 0.86, p);
  // Finale-only film grade (grain, fringing, vignette); zero on Contact.
  out.grade = finaleSmooth(0.10, 0.30, p) * (1 - finaleSmooth(0.90, 1, p));
  out.phase = p < 0.12 ? 'retract' : p < 0.34 ? 'orbit' : p < 0.44 ? 'compress' : p < 0.70 ? 'nebula' : 'accrete';
  return out;
}
// Local coordinates in the unchanged Works basis; all offsets collapse to BH.
export function finaleFigure(progress, origin, index, basis, out = {}) {
  finaleState(progress, out);
  const angle = origin + index * Math.PI * 2 / 3 + out.angle;
  out.x = basis.hole.x * out.travel + Math.cos(angle) * basis.radiusX * out.radius;
  out.y = basis.hole.y * out.travel + (Math.sin(angle) * basis.radiusY + basis.offsetY) * out.radius;
  out.z = basis.hole.z * out.travel;
  out.scale = basis.scale * out.figure;
  return out;
}

export function buildFinaleSeeds(count) {
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < seeds.length; i++) {
    const value = Math.sin((i + 1) * 127.1 + 20261009) * 43758.5453;
    seeds[i] = value - Math.floor(value);
  }
  return seeds;
}
