import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createWorksOrbit, syncWorksOrbit, advanceWorksOrbit, WORKS_IDS, WORKS_ORBIT_SPEED } from '../../../src/3d/utils/worksOrbit.js';
import { STORY_IDLE_PHASE, STORY_SEED } from '../../../src/3d/utils/cameraPath.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = path => readFile(resolve(root, path), 'utf8');
const report = { status: 'running', checkedAt: new Date().toISOString(), assertions: 0, cases: [], geometry: [], metrics: {} };
function equal(actual, expected, message) { report.assertions++; assert.deepEqual(actual, expected, message); }
function near(actual, expected, tolerance, message) { report.assertions++; assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: ${actual} vs ${expected}`); }
function frames(orbit, seconds, fps, paused = false, frozen = false, active = true) {
  for (let i = 0; i < Math.round(seconds * fps); i++) advanceWorksOrbit(orbit, 1 / fps, paused, frozen, active);
}
function check(name, run) { run(); report.cases.push(name); }

try {
  const source = JSON.parse(await read('outputs/redesign/r0.2/constellation-data.json'));
  const runtime = JSON.parse(await read('src/3d/data/worksConstellations.json'));
  check('source equality, graph integrity, gnomonic projection and radius', () => {
    equal(WORKS_IDS, ['edura', 'veris', 'vie'], 'project order');
    equal(runtime.catalog, source.catalog, 'HIP catalog frame/epoch');
    equal(runtime.chartConvention, source.chartConvention, 'Stellarium convention and attribution');
    equal(runtime.constellations, source.constellations.filter(item => item.section === 'works'), 'exact source subset');
    const expected = [[17, 16, 12], [17, 16, 12], [10, 9, 12]];
    let maxProjectionError = 0;
    runtime.constellations.forEach((item, index) => {
      const { stars, edges, supportingStars } = item.geometry;
      equal([stars.length, edges.length, supportingStars.length], expected[index], `${item.id} counts`);
      equal(item.assignment.toLowerCase(), WORKS_IDS[index], `${item.id} assignment`);
      equal(item.status, 'ready', `${item.id} verified data`);
      const nodes = new Set(stars.map(star => star.id));
      equal(nodes.size, stars.length, `${item.id} unique main nodes`);
      for (const edge of edges) equal(edge.every(id => nodes.has(id)), true, `${item.id} edge only connects main nodes`);
      const flattened = item.geometry.polylinesHip.flatMap(line => line.slice(1).map((hip, i) => [`HIP ${line[i]}`, `HIP ${hip}`]));
      equal(edges, flattened, `${item.id} edges match source polylines`);
      const { origin, uniformScale } = item.projection;
      const a0 = origin.raDeg * Math.PI / 180, b0 = origin.decDeg * Math.PI / 180;
      let error = 0;
      for (const star of [...stars, ...supportingStars]) {
        equal(star.position[2], 0, `${star.id} planar source`);
        const a = star.raDeg * Math.PI / 180, b = star.decDeg * Math.PI / 180;
        const denom = Math.sin(b0) * Math.sin(b) + Math.cos(b0) * Math.cos(b) * Math.cos(a - a0);
        const x = -Math.cos(b) * Math.sin(a - a0) / denom * uniformScale;
        const y = (Math.cos(b0) * Math.sin(b) - Math.sin(b0) * Math.cos(b) * Math.cos(a - a0)) / denom * uniformScale;
        near(star.position[0], x, 5.1e-10, `${star.id} west-right gnomonic x`);
        near(star.position[1], y, 5.1e-10, `${star.id} north-up gnomonic y`);
        error = Math.max(error, Math.abs(x - star.position[0]), Math.abs(y - star.position[1]));
      }
      const mainRadius = Math.max(...stars.map(star => Math.hypot(...star.position)));
      const fullRadius = Math.max(...[...stars, ...supportingStars].map(star => Math.hypot(...star.position)));
      equal(fullRadius < 1, true, `${item.id} full field fits source unit radius`);
      report.geometry.push({ id: item.id, stars: stars.length, edges: edges.length, supporting: supportingStars.length, mainRadius, fullRadius, projectionError: error });
      maxProjectionError = Math.max(maxProjectionError, error);
    });
    report.metrics.maxProjectionError = maxProjectionError;
  });

  check('capture once, unhover-to-scroll race, reversals and canonical release', () => {
    const orbit = createWorksOrbit();
    syncWorksOrbit(orbit, 'works', 0.3);
    frames(orbit, 3, 165);
    frames(orbit, 2, 165, true);
    const displayed = orbit.phase;
    syncWorksOrbit(orbit, 'finale', 0.001); // Pointer leave changes the target, not this stored pose.
    advanceWorksOrbit(orbit, 1 / 165, false, false, true);
    equal([orbit.origin, orbit.phase, orbit.captures, orbit.latched], [displayed, displayed, 1, true], 'capture previous displayed phase before idle advance');
    for (const progress of [0.2, 0.8, 0.1, 0, 0.7, 1, 0.3, 0]) {
      syncWorksOrbit(orbit, 'finale', progress);
      frames(orbit, 1, 60, false, false, true);
      equal([orbit.origin, orbit.phase, orbit.captures, orbit.latched], [displayed, displayed, 1, true], `reverse finale ${progress} cannot recapture/release`);
    }
    syncWorksOrbit(orbit, 'contact', 1);
    syncWorksOrbit(orbit, 'experience', 0.4);
    equal(orbit.latched, true, 'non-Works jumps cannot release captured origin');
    syncWorksOrbit(orbit, 'works', 1);
    equal([orbit.phase, orbit.origin, orbit.velocity, orbit.latched, orbit.resumePending], [displayed, displayed, 0, false, true], 'release restores returned phase');
    advanceWorksOrbit(orbit, 1 / 60, false, false, true);
    equal([orbit.phase, orbit.velocity, orbit.resumePending], [displayed, 0, false], 'first release frame is exactly the returned pose');
    frames(orbit, 1, 165);
    equal(orbit.phase > displayed, true, 'idle then resumes continuously');
    const secondDisplayed = orbit.phase;
    syncWorksOrbit(orbit, 'finale', 0.2);
    equal([orbit.origin, orbit.captures], [secondDisplayed, 2], 'next excursion captures once from resumed phase');
  });

  check('deterministic default/deep jumps and finale-zero boundary', () => {
    equal([STORY_IDLE_PHASE, STORY_SEED], [0, 20261007], 'contract defaults');
    for (const chapter of ['finale', 'contact']) {
      const orbit = createWorksOrbit(STORY_IDLE_PHASE);
      syncWorksOrbit(orbit, chapter, 0.7);
      frames(orbit, 5, 165, false, false, true);
      equal([orbit.phase, orbit.origin, orbit.captures, orbit.latched, orbit.visited], [0, 0, 1, true, false], `direct ${chapter} uses deterministic origin`);
    }
    const orbit = createWorksOrbit(1.25);
    syncWorksOrbit(orbit, 'finale', 0);
    equal([orbit.phase, orbit.origin, orbit.captures, orbit.latched], [1.25, 1.25, 0, false], 'first finale0 does not capture');
    frames(orbit, 1, 165, false, false, false);
    equal(orbit.phase, 1.25, 'finale0 has no idle advancement');
    syncWorksOrbit(orbit, 'finale', Number.EPSILON);
    equal([orbit.origin, orbit.captures], [1.25, 1], 'first positive progress captures');
  });

  check('exact exponential easing at 60/165fps and analytic integral', () => {
    const sixty = createWorksOrbit(), high = createWorksOrbit();
    for (const [seconds, paused] of [[2, false], [1, true], [2, false]]) {
      frames(sixty, seconds, 60, paused); frames(high, seconds, 165, paused);
      near(sixty.phase, high.phase, 2e-14, 'equal integrated phase at equal elapsed time');
      near(sixty.velocity, high.velocity, 2e-14, 'equal eased velocity at equal elapsed time');
    }
    const analytic = createWorksOrbit();
    frames(analytic, 2, 165);
    near(analytic.velocity, WORKS_ORBIT_SPEED * (1 - Math.exp(-12)), 2e-14, 'analytic eased velocity');
    near(analytic.phase, WORKS_ORBIT_SPEED * (2 - (1 - Math.exp(-12)) / 6), 2e-14, 'analytic integrated angle');
    report.metrics.refreshRatePhaseDifference = Math.abs(sixty.phase - high.phase);
    report.metrics.refreshRateVelocityDifference = Math.abs(sixty.velocity - high.velocity);
    frames(sixty, 3, 60, true); frames(high, 3, 165, true);
    equal([sixty.velocity, high.velocity], [0, 0], 'settled pause reaches zero');
    near(sixty.phase, high.phase, 0.00001 / 6, 'terminal snap has bounded sub-threshold integration difference');
    report.metrics.pauseSnapPhaseDifference = Math.abs(sixty.phase - high.phase);
  });

  check('frozen/offscreen guards preserve phase, velocity and pending return', () => {
    for (const [frozen, active] of [[true, true], [false, false], [true, false]]) {
      const orbit = createWorksOrbit(0.81);
      frames(orbit, 1, 60);
      const before = { ...orbit };
      frames(orbit, 20, 165, false, frozen, active);
      equal(orbit, before, 'guard performs no phase or velocity mutation');
      syncWorksOrbit(orbit, 'contact', 1);
      syncWorksOrbit(orbit, 'works', 0);
      advanceWorksOrbit(orbit, 1, false, frozen, active);
      equal(orbit.resumePending, true, 'guard does not consume first return frame');
    }
    const orbit = createWorksOrbit();
    const before = { ...orbit };
    advanceWorksOrbit(orbit, -1, false, false, true);
    equal(orbit, before, 'negative delta cannot move backwards');
    advanceWorksOrbit(orbit, 10, false, false, true);
    const capped = createWorksOrbit();
    advanceWorksOrbit(capped, 0.05, false, false, true);
    equal(orbit, capped, 'long resumed frame capped at 50ms');
  });

  // Execute the real store, replacing only path aliases for Node (no implementation copy).
  let storeCode = await read('src/stores/useScrollStore.js');
  storeCode = storeCode.replace(/from 'zustand'/, `from '${import.meta.resolve('zustand')}'`)
    .replace(/from '@\/3d\/utils\/([^']+)'/g, (_, path) => `from '${pathToFileURL(resolve(root, `src/3d/utils/${path}.js`)).href}'`);
  const { useScrollStore } = await import(`data:text/javascript;base64,${Buffer.from(storeCode).toString('base64')}`);
  const frameSource = await read('src/3d/components/WorksConstellations.jsx');
  const expression = frameSource.match(/const selected = ([^;]+);/)?.[1];
  assert.ok(expression, 'actual frame selector exists');
  const selected = new Function('state', `return (${expression});`);
  check('real store OR interaction ownership, validation and synchronous capture', () => {
    const state = () => useScrollStore.getState();
    state().clearWorksInteraction();
    for (let mask = 0; mask < 8; mask++) {
      ['Selection', 'Hover', 'Focus'].forEach((channel, index) => state().setWorksInteraction(channel, mask & 1 << index ? WORKS_IDS[index] : null));
      equal(Boolean(selected(state())), mask > 0, `pause OR truth table mask ${mask}`);
    }
    state().setWorksInteraction('Selection', 'edura');
    state().setWorksInteraction('Focus', 'veris');
    state().setWorksInteraction('Hover', 'vie');
    state().setWorksInteraction('Hover', null);
    equal([state().worksSelection, state().worksFocus, selected(state())], ['edura', 'veris', 'edura'], 'pointerleave preserves selected and focused state');
    state().setWorksInteraction('Focus', null);
    equal(selected(state()), 'edura', 'blur preserves selection');
    const before = state();
    for (const [channel, id] of [['Selection', 'orion'], ['Hover', undefined], ['Other', 'edura']]) state().setWorksInteraction(channel, id);
    equal(state(), before, 'invalid channel/id actions ignored');
    state().clearWorksInteraction();
    equal(selected(state()), null, 'clear removes all interaction owners');
    const orbit = state().worksOrbit;
    state().setStoryPosition('works', 0.5, 0.8);
    frames(orbit, 1, 165);
    const displayed = orbit.phase;
    state().setStoryPosition('finale', 0.01, 0.9);
    equal([orbit.origin, orbit.latched, state().chapterProgress], [displayed, true, 0.01], 'producer captures synchronously before next R3F frame');
    state().setStoryPosition('finale', 0.01, 0.9);
    equal(orbit.captures, 1, 'repeated producer write cannot recapture');
    equal(frameSource.includes('active && !document.hidden'), true, 'actual frame passes hidden/offscreen guard');
  });
  report.status = 'pass';
} catch (error) {
  report.status = 'fail';
  report.error = { name: error.name, message: error.message, stack: error.stack };
  process.exitCode = 1;
}
await writeFile(new URL('./check-results.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
