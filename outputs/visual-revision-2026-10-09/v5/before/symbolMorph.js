import data from '@/3d/data/symbolTargets.json';

export const SYMBOL_POOL_COUNT = data.poolCount;
export const SYMBOL_TOOL_IDS = ['figma', 'photoshop', 'illustrator', 'after-effects', 'premiere-pro', 'davinci-resolve', 'ai'];
export const SYMBOL_EDUCATION_IDS = ['saigonUniversity', 'greenAcademy', 'arenaMultimedia'];
export const SYMBOL_LOGOS = data.logos;
const logos = Object.fromEntries(data.logos.map(logo => [logo.id, logo]));

// Prepared once. Only the small stage pool morphs; StarField keeps its own shell.
export const SYMBOL_TARGETS = Object.fromEntries([
  ...SYMBOL_TOOL_IDS.map(id => {
    const parts = (id === 'ai' ? ['chatgpt', 'claude', 'google-antigravity'] : [id]).map(key => logos[key]);
    let offset = 0;
    const edges = parts.flatMap(logo => {
      const result = logo.edges.map(([a, b]) => [a + offset, b + offset]);
      offset += logo.points.length;
      return result;
    });
    return [id, { id, parts, edges }];
  }),
  ...data.education.map(item => {
    const indices = Object.fromEntries(item.geometry.stars.map((star, index) => [star.id, index]));
    return [item.id, { id: item.id, geometry: item.geometry,
      edges: item.geometry.edges.map(([a, b]) => [indices[a], indices[b]]) }];
  }),
]);

export function createSymbolPool() {
  const base = new Float32Array(SYMBOL_POOL_COUNT * 3);
  // Equal solid-angle samples of a background patch, fixed seed and depth.
  for (let i = 0; i < SYMBOL_POOL_COUNT; i++) {
    const cos = 0.48 + 0.46 * (i + 0.5) / SYMBOL_POOL_COUNT;
    const angle = i * 2.399963229728653;
    const radius = 3.4 + 0.7 * ((i * 37 % SYMBOL_POOL_COUNT) / SYMBOL_POOL_COUNT);
    const ring = radius * Math.sqrt(1 - cos * cos);
    base[i * 3] = Math.cos(angle) * ring;
    base[i * 3 + 1] = Math.sin(angle) * ring;
    base[i * 3 + 2] = -radius * cos;
  }
  return { base, positions: base.slice(), goal: base.slice(), weights: new Float32Array(SYMBOL_POOL_COUNT),
    sizes: new Float32Array(SYMBOL_POOL_COUNT).fill(1.2), target: null, elapsed: 0, phase: 0,
    formation: 0, lines: 0, logo: 0, settled: true, updates: 0 };
}

function writeGoal(pool) {
  pool.goal.set(pool.base);
  const target = pool.target;
  if (!target) return;
  if (target.geometry) {
    const stars = target.geometry.stars, context = target.geometry.supportingStars;
    for (let i = 0; i < stars.length + context.length; i++) {
      const star = i < stars.length ? stars[i] : context[i - stars.length];
      pool.goal.set(star.position, i * 3);
    }
    return;
  }
  let offset = 0;
  for (let part = 0; part < target.parts.length; part++) {
    const logo = target.parts[part];
    const ai = target.id === 'ai';
    const angle = pool.phase + part * Math.PI * 2 / 3;
    const x = ai ? Math.cos(angle) * 0.68 : 0;
    const y = ai ? Math.sin(angle) * 0.68 : 0;
    const scale = ai ? 0.42 : 0.9;
    for (let i = 0; i < logo.points.length; i++) {
      const point = logo.points[i], index = (offset + i) * 3;
      pool.goal[index] = point[0] * scale + x;
      pool.goal[index + 1] = point[1] * scale + y;
      pool.goal[index + 2] = 0;
    }
    offset += logo.points.length;
  }
}

export function setSymbolTarget(pool, id) {
  const target = Object.hasOwn(SYMBOL_TARGETS, id) ? SYMBOL_TARGETS[id] : null;
  if (pool.target === target) return false;
  pool.target = target;
  pool.elapsed = pool.formation = pool.lines = pool.logo = 0;
  pool.settled = false;
  pool.weights.fill(0);
  pool.sizes.fill(1.2);
  if (target?.geometry) {
    target.geometry.stars.forEach((star, i) => {
      pool.weights[i] = 1;
      pool.sizes[i] = Math.max(3, Math.min(4.5, 5.5 - star.vmag * 0.4));
    });
    target.geometry.supportingStars.forEach((_, i) => { pool.weights[i + target.geometry.stars.length] = 0.15; });
  } else if (target) { pool.weights.fill(1); pool.sizes.fill(2.3); }
  writeGoal(pool);
  return true;
}

export function resetSymbolPool(pool) {
  pool.target = null;
  pool.positions.set(pool.base);
  pool.goal.set(pool.base);
  pool.elapsed = pool.formation = pool.lines = pool.logo = 0;
  pool.weights.fill(0);
  pool.sizes.fill(1.2);
  pool.settled = true;
}

const ramp = (value, from, to) => {
  const p = Math.max(0, Math.min(1, (value - from) / (to - from)));
  return p * p * (3 - 2 * p);
};

// No tweens or allocation here: interrupted morphs always start at current positions.
export function advanceSymbolPool(pool, delta, frozen = false) {
  const dt = Math.min(0.05, Math.max(0, delta));
  if (frozen) {
    const changed = !pool.settled || pool.formation !== (pool.target ? 1 : 0);
    if (changed) pool.positions.set(pool.goal);
    pool.settled = true;
    pool.formation = pool.lines = pool.target ? 1 : 0;
    pool.logo = pool.target?.parts ? 1 : 0;
    return changed;
  }
  pool.elapsed += dt;
  pool.formation = pool.target ? ramp(pool.elapsed, 0, 0.45) : 0;
  pool.lines = pool.target ? ramp(pool.elapsed, 0.55, 1) : 0;
  pool.logo = pool.target?.parts ? ramp(pool.elapsed, 1.05, 1.5) : 0;
  if (pool.target?.id === 'ai' && pool.settled && pool.elapsed >= 1.5) {
    pool.phase += Math.min(dt, pool.elapsed - 1.5) * 0.12;
    writeGoal(pool);
    pool.positions.set(pool.goal);
    pool.updates++;
    return true;
  }
  if (pool.settled) return false;
  const ease = 1 - Math.exp(-9 * dt);
  let error = 0;
  for (let i = 0; i < pool.positions.length; i++) {
    pool.positions[i] += (pool.goal[i] - pool.positions[i]) * ease;
    error = Math.max(error, Math.abs(pool.goal[i] - pool.positions[i]));
  }
  if (error < 0.0001) { pool.positions.set(pool.goal); pool.settled = true; }
  pool.updates++;
  return true;
}
