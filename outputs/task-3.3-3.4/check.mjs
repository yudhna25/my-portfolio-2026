import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { advanceShootingStars, createShootingStars, METEOR_SAMPLES } from '../../src/3d/utils/shootingStars.js';

for (const choice of [0, 0.49, 0.5, 0.999999]) {
  const random = () => choice;
  const pool = createShootingStars(random);
  const positions = new Float32Array(3 * METEOR_SAMPLES * 3);
  const alphas = new Float32Array(3 * METEOR_SAMPLES);
  const bursts = [];
  for (let frame = 0; frame < 20000; frame++) {
    const before = pool.remaining;
    advanceShootingStars(pool, 1 / 165, 16 / 9, positions, alphas, random);
    if (pool.remaining > before) {
      bursts.push(frame / 165);
      assert.equal(pool.meteors.filter(meteor => Number.isFinite(meteor.age)).length, choice < 0.5 ? 2 : 3);
      assert(pool.remaining >= 4 && pool.remaining <= 7);
    }
    assert(positions.every(Number.isFinite));
    assert(alphas.every(alpha => alpha >= 0 && alpha <= 0.601));
  }
  assert(bursts.length >= 16);
  for (let index = 1; index < bursts.length; index++) {
    const interval = bursts[index] - bursts[index - 1];
    assert(interval >= 4 - 1 / 165 && interval <= 7 + 1 / 165);
  }
  const paused = createShootingStars(random);
  const before = paused.remaining;
  advanceShootingStars(paused, 0, 1, positions, alphas, random);
  assert.equal(paused.remaining, before);
  advanceShootingStars(paused, 100, 1, positions, alphas, random);
  assert(Math.abs(paused.remaining - before + 0.1) < 1e-9, 'long frame cannot emit a backlog');
}
const load = name => readFileSync(new URL(name, import.meta.url), 'utf8');
const concurrent = JSON.parse(load('./concurrent-changes.json')).files;
for (const { path, sha256 } of JSON.parse(load('./protected.json'))) {
  const change = concurrent.find(file => file.path === path);
  if (change) assert.equal(change.before, sha256, `${path}: original baseline retained`);
  assert.equal(createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex'), change?.after ?? sha256, `${path}: original or recorded task 3.2 version preserved`);
}
if (process.argv.includes('--artifacts')) {
  const result = JSON.parse(load('./browser-results.json'));
  assert(result.checks.length >= 20 && result.checks.every(check => check.pass));
  assert.equal(result.errors.length, 0);
  assert(result.fps.filter(pose => !pose.hidden).every(pose => pose.fps > 120));
  assert(result.bursts.length >= 2 && result.bursts.every(burst => burst.peak >= 2 && burst.peak <= 3));
  const responsive = JSON.parse(load('./responsive.json'));
  assert.equal(responsive.length, 3);
  for (const pose of responsive) {
    assert.equal(pose.objects, 6);
    assert.equal(pose.points, 72);
    assert.equal(pose.materials.length, 12);
    assert(pose.materials.every(material => material.color === '1a1a1a' || material.color === 'ffffff'));
    assert.equal(pose.glError, 0);
    assert(pose.fps > 120);
    assert(pose.centers.every(([x, y]) => Math.abs(x) < 1 && Math.abs(y) < 1));
  }
  // Task 3.2 inserted its new row above Commands; all earlier content must remain in order.
  const currentLines = load('../../AGENTS.md').split(/\r?\n/);
  let cursor = 0;
  for (const line of load('./agents-before.md').split(/\r?\n/).filter(line => line.trim())) {
    while (cursor < currentLines.length && currentLines[cursor] !== line) cursor++;
    assert(cursor < currentLines.length, `AGENTS existing content preserved: ${line}`);
    cursor++;
  }
  assert.equal(JSON.parse(load('./app-console.json')).filter(entry => entry.level === 'error').length, 0);
  assert.equal(JSON.parse(load('./qa-console.json')).filter(entry => entry.level === 'error').length, 0);
  const app = JSON.parse(load('./app-results.json'));
  assert.equal(app.errors.length, 0);
  for (const section of ['hero', 'about', 'skills']) {
    assert(app.fps.some(pose => pose.section === section && pose.fps > 120 && pose.canvas === 1));
  }
}
console.log('PASS: meteor cadence/count/fade/pool/delta, original and recorded concurrent scene versions' + (process.argv.includes('--artifacts') ? ', Browser motion/visibility/cleanup/responsive/FPS/console and append-only AGENTS' : ''));
