export const METEOR_SAMPLES = 24;
export const METEOR_COUNT = 3;

export function ambientMeteorVisibility(chapter, progress) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  if (chapter === 'about' || chapter === 'contact') return Math.min(1, p / 0.1);
  if (chapter === 'education') return Math.min(1, (1 - p) / 0.1);
  if (chapter === 'works') return Math.min(1, p / 0.1, (1 - p) / 0.1);
  return chapter === 'skills' ? 1 : 0;
}

export function createShootingStars(random = Math.random) {
  return {
    remaining: 4 + random() * 3,
    meteors: Array.from({ length: METEOR_COUNT }, () => ({ age: Infinity, life: 1, x: 0, y: 0, dx: 0, dy: 0 })),
  };
}

export function clearShootingStars(pool) {
  for (const meteor of pool.meteors) meteor.age = Infinity;
}

export function advanceShootingStars(pool, delta, aspect, positions, alphas, random = Math.random, emitting = true) {
  const step = Math.min(Math.max(delta, 0), 0.1);
  if (emitting) pool.remaining -= step;

  // Background timer-triggered meteors (slots 0..2)
  if (emitting && pool.remaining <= 0) {
    pool.remaining = 4 + random() * 3;
    const count = random() < 0.5 ? 2 : 3;
    const direction = random() < 0.5 ? -1 : 1;
    for (let index = 0; index < 3; index++) {
      const meteor = pool.meteors[index];
      meteor.age = index < count ? -index * 0.09 : Infinity;
      meteor.x = (random() - 0.5) * aspect * 0.76;
      meteor.y = 0.18 + random() * 0.26;
      meteor.dx = direction * (0.28 + random() * 0.12);
      meteor.dy = -(0.16 + random() * 0.09);
      meteor.life = 0.65 + random() * 0.35;
    }
  }

  // Advance the three ambient slots; story motion has its own analytic curve.
  for (let index = 0; index < pool.meteors.length; index++) {
    const meteor = pool.meteors[index];
    meteor.age += step;
    const active = meteor.age > 0 && meteor.age < meteor.life;
    const fade = active ? Math.sin(Math.PI * meteor.age / meteor.life) * 0.6 : 0;
    for (let sample = 0; sample < METEOR_SAMPLES; sample++) {
      const point = index * METEOR_SAMPLES + sample;
      const tail = sample / (METEOR_SAMPLES - 1);
      const age = Math.max(0, meteor.age - tail * 0.16);
      positions[point * 3] = active ? meteor.x + meteor.dx * age : 0;
      positions[point * 3 + 1] = active ? meteor.y + meteor.dy * age : 0;
      positions[point * 3 + 2] = 0;
      alphas[point] = fade * (1 - tail) ** 2;
    }
  }
}
