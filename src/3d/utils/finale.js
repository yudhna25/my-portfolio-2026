// Shared scroll clock; no elapsed-time simulation in the collision or debris.
export const FINALE_PHASES = Object.freeze({ retract: 0.12, compress: 0.34, collision: 0.44, nebula: 0.70, formed: 0.96 });
const clamp = p => Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0;
export function finaleSmooth(a, b, p) {
  const t = clamp((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}
export function finaleState(progress, out = {}) {
  const p = clamp(progress);
  out.progress = p;
  out.label = 1 - finaleSmooth(0, 0.12, p);
  out.travel = finaleSmooth(0.12, 0.44, p);
  out.angle = 10.5 * Math.pow(clamp((p - 0.12) / 0.32), 2);
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
