import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const json = file => JSON.parse(read(file));
for (const file of ['src/3d/components/ParticleFieldDemo.jsx', 'src/3d/components/ShaderPlaygroundDemo.jsx', 'src/components/effects/ScrollOrbitDemo.jsx']) {
  assert(read(file).trim().split('\n').length < 120, `${file}: line budget`);
  assert(!read(file).includes('setInterval'), `${file}: no timer loop`);
}
const flatten = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) => typeof value === 'object' ? flatten(value, prefix + key + '.') : [prefix + key]);
assert.deepEqual(flatten(json('src/i18n/locales/vi.json')).sort(), flatten(json('src/i18n/locales/en.json')).sort(), 'locale parity');
for (const file of ['browser-desktop.json', 'browser-mobile.json', 'browser-reduced.json']) {
  const result = json(`outputs/task-3.5/${file}`);
  assert(result.checks.length >= 10 && result.checks.every(check => check.pass), `${file}: browser checks`);
  assert.equal(result.errors.length, 0, `${file}: page errors`);
  assert(result.poses.every(pose => pose.overflow <= 0), `${file}: responsive`);
  if (!result.fps.every(sample => sample.reduced)) assert(result.fps.filter(sample => !sample.reduced).every(sample => sample.fps > 120), `${file}: actual active renderer FPS`);
}
assert.equal(json('outputs/task-3.5/console.json').filter(log => log.level === 'error').length, 0, 'console errors');
const native = json('outputs/task-3.5/native-controls.json');
assert(native.some(pose => pose.scale === 8 && pose.warp === 0), 'native keyboard sliders update uniforms');
assert(native.some(pose => pose.strength > 0.1), 'native keyboard particle pulse');
assert(Math.abs(native.at(-1).progress - native[0].progress) > 0.1, 'native scroll button moves orbit');
for (const { path, sha256 } of json('outputs/task-3.5/protected.json')) assert.equal(createHash('sha256').update(read(path)).digest('hex'), sha256, `${path}: existing scene preserved`);
const chunks = readdirSync(new URL('dist/assets/', root)).filter(file => /^(ParticleFieldDemo|ShaderPlaygroundDemo|ScrollOrbitDemo)-.*\.js$/.test(file));
assert.equal(chunks.length, 3);
for (const chunk of chunks) assert(statSync(new URL('dist/assets/' + chunk, root)).size < 200_000, `${chunk}: JS budget`);
const before = read('outputs/task-3.5/agents-before.md').split(/\r?\n/).filter(line => line.trim());
const after = read('AGENTS.md').split(/\r?\n/);
let cursor = 0;
for (const line of before) { while (cursor < after.length && after[cursor] !== line) cursor++; assert(cursor++ < after.length, 'AGENTS preserves old lines'); }
assert(read('AGENTS.md').includes('Task 3.5 — Live demos'));
console.log('PASS: 3 demos / line and JS budgets / locale parity / interactive + idle + motion + lifecycle / preserved scene and AGENTS');
