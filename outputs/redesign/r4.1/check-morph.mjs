// Run: node outputs/redesign/r4.1/check-morph.mjs
// The real module is imported unchanged apart from Vite's JSON alias.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = path => readFileSync(resolve(root, path));
const json = path => JSON.parse(read(path));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const data = json('src/3d/data/symbolTargets.json');
const source = read('src/3d/utils/symbolMorph.js').toString()
  .replace("import data from '@/3d/data/symbolTargets.json';", `const data = ${JSON.stringify(data)};`);
assert(!source.includes("from '@/"), 'A new alias import needs an explicit self-check mapping.');
const morph = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { createSymbolPool, setSymbolTarget, advanceSymbolPool, resetSymbolPool,
  SYMBOL_POOL_COUNT, SYMBOL_TARGETS, SYMBOL_TOOL_IDS, SYMBOL_EDUCATION_IDS } = morph;
let checks = 0;
const ok = (value, message) => { checks++; assert.ok(value, message); };
const equal = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };
const near = (a, b, epsilon, message) => ok(Math.abs(a - b) <= epsilon, `${message}: ${a} / ${b}`);
const maxError = (a, b) => a.reduce((maximum, value, i) => Math.max(maximum, Math.abs(value - b[i])), 0);
const run = (pool, seconds, hz = 60, frozen = false) => {
  for (let frame = 0; frame < Math.round(seconds * hz); frame++) advanceSymbolPool(pool, 1 / hz, frozen);
};
const ids = [...SYMBOL_TOOL_IDS, ...SYMBOL_EDUCATION_IDS];
equal(ids.length, 10, 'Seven tools/AI + three Education targets');
equal(Object.keys(SYMBOL_TARGETS).sort(), [...ids].sort(), 'No invented extra targets');
equal(data.aiLogos, ['chatgpt', 'claude', 'google-antigravity'], 'AI identities');
equal(SYMBOL_TARGETS.ai.parts.map(part => part.id), data.aiLogos, 'AI target uses exactly the three real marks');
equal(SYMBOL_POOL_COUNT, 192, 'Bounded pool; no full StarField morph');

const manifest = json(data.logoSource);
equal(data.logos.length, 9, 'Six software marks + three AI marks');
let maximumEdges = 0;
for (const logo of data.logos) {
  const original = manifest.assets.find(asset => asset.id === logo.id);
  ok(original, `${logo.id} exists in R0.2`);
  const file = original.files.find(item => item.role === 'web');
  equal(logo.path, `outputs/redesign/r0.2/${file.path}`, `${logo.id} original asset path`);
  equal(read(logo.path).length, logo.bytes, `${logo.id} decoded source byte receipt`);
  equal(hash(read(logo.path)), logo.sha256, `${logo.id} unchanged source bytes`);
  for (const key of ['bytes', 'sha256', 'width', 'height']) equal(logo[key], file[key], `${logo.id} ${key}`);
  for (const key of ['monoType', 'sourceUrl', 'sourcePageUrl', 'attribution', 'treatment']) {
    equal(logo[key], original[key], `${logo.id} ${key}`);
  }
  ok(logo.width > 0 && logo.height > 0, `${logo.id} original aspect ratio`);
  equal(logo.sampling.originalLogoRequired, true, `${logo.id} particle outline cannot replace finished mark`);
  const count = data.aiLogos.includes(logo.id) ? 64 : SYMBOL_POOL_COUNT;
  equal(logo.points.length, count, `${logo.id} bounded star count`);
  equal(new Set(logo.points.map(point => point.join(','))).size, count, `${logo.id} no duplicate points`);
  const boundX = logo.width / Math.max(logo.width, logo.height);
  const boundY = logo.height / Math.max(logo.width, logo.height);
  for (const [x, y, z] of logo.points) {
    ok(Number.isFinite(x) && Number.isFinite(y) && z === 0, `${logo.id} finite readable face`);
    ok(Math.abs(x) <= boundX + 1e-6 && Math.abs(y) <= boundY + 1e-6, `${logo.id} uniform aspect preserved`);
  }
  const uniqueEdges = new Set();
  for (const edge of logo.edges) {
    const [a, b] = edge;
    ok(Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b < count && a < b, `${logo.id} valid edge`);
    const pa = logo.points[a], pb = logo.points[b];
    ok(Math.hypot(...pa.map((value, i) => value - pb[i])) <= logo.sampling.edgeMax + 1e-6,
      `${logo.id} short, subtle link`);
    uniqueEdges.add(edge.join(','));
  }
  equal(uniqueEdges.size, logo.edges.length, `${logo.id} no duplicate links`);
}
for (const target of Object.values(SYMBOL_TARGETS)) {
  maximumEdges = Math.max(maximumEdges, target.edges.length);
  ok(target.edges.length * 6 <= SYMBOL_POOL_COUNT * 12, `${target.id} fits preallocated link buffer`);
}

const catalog = json(data.educationSource.path);
equal(hash(read(data.educationSource.path)), data.educationSource.sha256, 'Catalog receipt');
equal(data.educationSource.catalog, catalog.catalog, 'ICRS/J1991.25 provenance retained');
equal(data.educationSource.sources, catalog.sources, 'Source URLs retained');
const expectedFigures = { Cir: [3, 2], Tel: [2, 1], Pic: [3, 2] };
for (const school of data.education) {
  const original = catalog.constellations.find(item => item.id === school.constellationId);
  equal(school.geometry, original.geometry, `${school.id} exact source geometry, including context stars`);
  equal(school.projection, original.projection, `${school.id} exact source projection`);
  equal([school.geometry.stars.length, school.geometry.edges.length], expectedFigures[school.constellationId],
    `${school.id} sparse figure never filled with invented nodes`);
  const indices = Object.fromEntries(school.geometry.stars.map((star, i) => [star.id, i]));
  equal(SYMBOL_TARGETS[school.id].edges, school.geometry.edges.map(([a, b]) => [indices[a], indices[b]]),
    `${school.id} edges contain main stars only`);
  const { origin, uniformScale } = school.projection;
  const d0 = origin.decDeg * Math.PI / 180;
  for (const star of [...school.geometry.stars, ...school.geometry.supportingStars]) {
    const a = (star.raDeg - origin.raDeg) * Math.PI / 180, d = star.decDeg * Math.PI / 180;
    const den = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a);
    near(star.position[0], -Math.cos(d) * Math.sin(a) / den * uniformScale, 1e-8, `${star.id} west-right projection`);
    near(star.position[1], (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a)) / den * uniformScale,
      1e-8, `${star.id} north-up projection`);
  }
}

const base = createSymbolPool();
equal(base.base, createSymbolPool().base, 'Deterministic home positions');
for (const key of ['base', 'positions', 'goal', 'weights', 'sizes']) ok(base[key] instanceof Float32Array, `${key} typed buffer`);
ok(base.base !== base.positions && base.base !== base.goal, 'Home coordinates cannot be overwritten by position/goal mutations');
ok([...base.base].every(Number.isFinite), 'Home patch has finite positions');
for (let i = 0; i < SYMBOL_POOL_COUNT; i++) {
  const point = base.base.slice(i * 3, i * 3 + 3), radius = Math.hypot(...point);
  ok(radius >= 3.4 - 1e-6 && radius < 4.1 && point[2] < 0, 'Home pool is a small stable background patch');
}
equal(setSymbolTarget(base, 'does-not-exist'), false, 'Unknown target safely returns to empty home');
const frameErrors = {};
for (const id of ids) {
  const normal = createSymbolPool(), reduced = createSymbolPool(), fast = createSymbolPool();
  for (const pool of [normal, reduced, fast]) equal(setSymbolTarget(pool, id), true, `${id} selected`);
  equal(setSymbolTarget(normal, id), false, `${id} same target does not restart`);
  run(normal, 0.4);
  run(fast, 0.4, 165);
  ok(maxError(normal.positions, fast.positions) < 1e-6, `${id} transient morph time-step independence at0.4s`);
  ok(normal.formation > 0 && normal.lines === 0 && normal.logo === 0, `${id} stars precede links and logo`);
  run(normal, 0.4);
  run(fast, 0.4, 165);
  ok(maxError(normal.positions, fast.positions) < 1e-6, `${id} transient morph time-step independence at0.8s`);
  ok(normal.lines > 0 && normal.logo === 0, `${id} links precede logo`);
  run(normal, 3.2);
  run(fast, 3.2, 165);
  ok(normal.settled && fast.settled, `${id} formation settles`);
  frameErrors[id] = maxError(normal.positions, fast.positions);
  ok(frameErrors[id] < 1e-6, `${id} equal 60/165Hz elapsed time (${frameErrors[id]})`);
  near(normal.phase, fast.phase, 1e-10, `${id} orbit phase time-step independence`);
  advanceSymbolPool(reduced, 1 / 60, true);
  equal(reduced.positions, reduced.goal, `${id} reduced static exact goal`);
  equal(reduced.formation, 1, `${id} static stars visible`);
  equal(reduced.lines, 1, `${id} static links visible`);
  equal(reduced.logo, SYMBOL_TARGETS[id].parts ? 1 : 0, `${id} static logo state matches completed normal target`);
  const snapshot = reduced.positions.slice(), phase = reduced.phase;
  run(reduced, 2, 165, true);
  equal(reduced.positions, snapshot, `${id} reduced repeated frames stay static`);
  equal(reduced.phase, phase, `${id} reduced orbit frozen`);
  if (SYMBOL_TARGETS[id].geometry) {
    const stars = [...SYMBOL_TARGETS[id].geometry.stars, ...SYMBOL_TARGETS[id].geometry.supportingStars];
    equal(reduced.goal.slice(0, stars.length * 3), Float32Array.from(stars.flatMap(star => star.position)),
      `${id} target buffer copies exact source positions`);
  }
  setSymbolTarget(normal, null);
  run(normal, 3);
  equal(normal.positions, normal.base, `${id} return snaps exactly home`);
  equal([normal.formation, normal.lines, normal.logo], [0, 0, 0], `${id} no ghost structure after return`);
}

const rapid = createSymbolPool(), originalHome = rapid.base.slice();
const references = ['base', 'positions', 'goal', 'weights', 'sizes'].map(key => rapid[key]);
for (let i = 0; i < 30; i++) {
  const before = rapid.positions.slice();
  setSymbolTarget(rapid, i % 4 === 3 ? null : ids[i % ids.length]);
  equal(rapid.positions, before, `Interrupted swap ${i} starts at current positions`);
  equal([rapid.formation, rapid.lines, rapid.logo], [0, 0, 0], `Interrupted swap ${i} clears old visual links/logo`);
  run(rapid, (i % 3 + 1) / 60);
  ok([...rapid.positions].every(Number.isFinite), `Rapid swap ${i} stays finite`);
  for (let j = 0; j < references.length; j++) ok(rapid[['base', 'positions', 'goal', 'weights', 'sizes'][j]] === references[j], 'Buffer identity retained');
}
setSymbolTarget(rapid, null); run(rapid, 0.1);
const reversing = rapid.positions.slice();
setSymbolTarget(rapid, 'ai'); equal(rapid.positions, reversing, 'Reverse a return without snapping');
run(rapid, 0.1); resetSymbolPool(rapid);
equal(rapid.positions, originalHome, 'Offscreen/reset restores exact original coordinates');
equal(rapid.goal, originalHome, 'Reset clears outstanding goal');
equal(rapid.target, null, 'Reset clears active target');
equal([rapid.formation, rapid.lines, rapid.logo], [0, 0, 0], 'Reset clears ghost visual phases');
equal(rapid.base, originalHome, 'Home coordinates never drift across targets/reverse/reset');
console.log(JSON.stringify({ status: 'pass', checks, pool: SYMBOL_POOL_COUNT, targets: ids.length,
  unchangedLogoReceipts: data.logos.length, educationProjectionStars: data.education.reduce((sum, item) =>
    sum + item.geometry.stars.length + item.geometry.supportingStars.length, 0),
  maximumEdges, linkCapacity: SYMBOL_POOL_COUNT * 2, rapidSwaps: 30, frameErrors }, null, 2));
