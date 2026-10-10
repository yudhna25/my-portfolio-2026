import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { PerspectiveCamera } from 'three';
import * as meteor from '../../../../src/3d/utils/storyMeteor.js';
import { storyCameraPath } from '../../../../src/3d/utils/cameraPath.js';

let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; };
const same = (actual, expected, label) => { assert.deepEqual(actual, expected, label); checks++; };
const finite = value => Object.values(value).every(Number.isFinite);
const point = {}, pose = {};
const at = (layout, q) => { meteor.sampleStoryMeteor(layout, q, point, pose); return [point.x, point.y, point.z]; };
const length = v => Math.hypot(...v);
const subtract = (a, b) => a.map((x, i) => x - b[i]);
const divide = (a, d) => a.map(x => x / d);
const crossings = (layout, y) => {
  let low = 0, high = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (meteor.meteorReadingY(layout, mid) < y) low = mid; else high = mid;
  }
  return (low + high) / 2;
};
const results = [];
for (const [width, height, range, xs, ys] of [
  [390, 844, 1671.59, [.3685, .693, .3685], [271.187, 632.734, 994.281]],
  [768, 1024, 2150, [.35, .64, .35]],
  [1440, 900, 1613.22, [.1852, .6185, .7037], [312.797, 616.25, 919.703]],
  [1920, 1080, 1880, [.24, .59, .68]],
]) {
  const layout = meteor.createMeteorLayout();
  Object.assign(layout, { width, height, range });
  // 390/1440 approximate historical V6 DOM measurements; others probe responsive geometry.
  // None is new Browser evidence for the current integrated build.
  layout.points.set([-.22, .22 * height, xs[0], ys?.[0] ?? .34 * height, xs[1], ys?.[1] ?? .74 * height,
    xs[2], ys?.[2] ?? 1.15 * height, .62, range + .5 * height]);
  layout.milestones.set([layout.points[3], layout.points[5], layout.points[7]]);
  same(Object.keys(layout), ['width', 'height', 'range', 'points', 'milestones'], 'shared layout schema unchanged');
  const camera = new PerspectiveCamera(2 * Math.atan(Math.tan(Math.PI / 6) / Math.min(1, width / height)) * 180 / Math.PI, width / height, .1, 2000);
  const world = new Float32Array(meteor.STORY_METEOR_SAMPLES * 2 * 3);
  const normals = new Float32Array(meteor.STORY_METEOR_SAMPLES * 2 * 2);
  const screen = new Float64Array(meteor.STORY_METEOR_SAMPLES * 2);
  const metrics = {};
  const render = q => {
    storyCameraPath(q <= 1 ? 'experience' : 'departure', q <= 1 ? q : q - 1, pose, false, width / height);
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(pose.lookX, pose.lookY, pose.lookZ); camera.updateMatrixWorld();
    check(meteor.writeStoryRibbon(layout, q, world, normals, screen, camera.matrixWorldInverse.elements,
      camera.projectionMatrix.elements, point, pose, metrics) === metrics, 'same scratch metrics returned');
    check(world.every(Number.isFinite) && normals.every(Number.isFinite) && screen.every(Number.isFinite) && finite(metrics), 'finite world/screen/tangents');
    check(metrics.span >= 0 && metrics.span <= 1.6, 'bounded authored tail window');
  };
  const milestoneQs = [...layout.milestones].map(y => crossings(layout, y));
  const seams = [0, ...milestoneQs, 1, 1.16];
  const seamResults = [];
  for (const q of seams) {
    const e = 1e-5, middle = at(layout, q), left = at(layout, q - e), right = at(layout, q + e);
    const left2 = at(layout, q - 2 * e), right2 = at(layout, q + 2 * e);
    const left3 = at(layout, q - 3 * e), right3 = at(layout, q + 3 * e);
    const before = divide(middle.map((x, i) => 3 * x - 4 * left[i] + left2[i]), 2 * e);
    const after = divide(middle.map((x, i) => -3 * x + 4 * right[i] - right2[i]), 2 * e);
    const bendLeft = middle.map((x, i) => (2 * x - 5 * left[i] + 4 * left2[i] - left3[i]) / (e * e));
    const bendRight = middle.map((x, i) => (2 * x - 5 * right[i] + 4 * right2[i] - right3[i]) / (e * e));
    const tangentError = length(subtract(before, after)) / Math.max(1, length(before), length(after));
    const curvatureError = length(subtract(bendLeft, bendRight))
      / Math.max(1, length(bendLeft), length(bendRight), length(before), length(after));
    check(tangentError < .004, `C1 seam ${width}px q=${q}: ${tangentError}`);
    check(curvatureError < .012, `C2 seam ${width}px q=${q}: ${curvatureError}`);
    seamResults.push({ q, tangentError, curvatureError });
  }
  check(length(divide(subtract(at(layout, 1 + 1e-5), at(layout, 1 - 1e-5)), 2e-5)) > 1,
    'departure starts with a continuous nonzero lateral drift');
  const snapshots = new Map();
  const tailResults = [];
  for (const q of [0, .01, ...milestoneQs, .4, .6, .8, 1, 1.02, 1.16, 1.3, 1.6, 1.9, 2]) {
    render(q);
    if (q <= 1.6) check(metrics.tailPixels / width > .40 && metrics.tailPixels / width < .44,
      `mature entry/milestone/departure tail ${width}px q=${q}: ${metrics.tailPixels / width}`);
    snapshots.set(q, { world: world.slice(), normals: normals.slice(), screen: screen.slice(), metrics: { ...metrics } });
    tailResults.push({ q, span: metrics.span, ratio: metrics.tailPixels / width });
  }
  check(snapshots.get(0).metrics.headX < 0, 'head begins outside the viewport');
  for (const q of [...snapshots.keys()].reverse().concat([milestoneQs[2], .01, 1.02, milestoneQs[0], .01, .01])) {
    render(q);
    const expected = snapshots.get(q);
    same(world, expected.world, 'reverse/rapid jump exact world path');
    same(normals, expected.normals, 'reverse exact billboard tangents');
    same(screen, expected.screen, 'reverse exact projected path');
    same(metrics, expected.metrics, 'reverse exact tail measurements');
  }
  for (const q of milestoneQs) {
    check(Math.abs(meteor.meteorFlare(layout, q) - 1) < 1e-12, 'halo peaks at the measured company');
    render(q);
    const index = milestoneQs.indexOf(q);
    check(Math.abs(metrics.headX - layout.points[(index + 1) * 2] * width) < 1e-7, 'head retains measured company horizontal anchor');
    check(Math.abs(meteor.meteorWake(layout, index, q) - 1) < 1e-12, 'DOM wake and comet light peak together');
  }
  for (let i = 0; i <= 2000; i++) {
    const q = i / 1000 - .05;
    check(finite(meteor.sampleStoryMeteor(layout, q, point, pose)), 'dense path stays finite');
    const light = meteor.meteorFlare(layout, q);
    check(light >= 0 && light <= 1, 'flare remains bounded');
  }
  results.push({ width, height, range, milestoneQs, seams: seamResults, tails: tailResults });
}

const source = readFileSync(new URL('../../../../src/3d/components/StoryMeteor.jsx', import.meta.url), 'utf8');
check(!/setState|new\s+(Vector|Matrix|Float|Buffer|Plane)/.test(source.split('useFrame(')[1]), 'no allocation/state in frame callback');
check(source.includes('resources.geometry.dispose()') && source.includes('resources.head.dispose()'), 'manually owned geometries keep disposal');
check(source.includes('!frozen && !document.hidden'), 'reduced/hidden visibility gates retained');
const report = { status: 'PASS', checks, fixtures: results,
  scope: 'Analytic C1/C2 seams, authored entry tail, shared layout schema, finite path, exact reverse/jump, flare, source allocation/disposal guards. Rendered pixels/FPS/native/lifecycle must be tested by integration.' };
writeFileSync(new URL('./math-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, checks, fixtures: results.map(r => ({ width: r.width,
  firstMilestoneTail: r.tails[2].ratio, maxC1Error: Math.max(...r.seams.map(s => s.tangentError)),
  maxC2Error: Math.max(...r.seams.map(s => s.curvatureError)) })) }, null, 2));
