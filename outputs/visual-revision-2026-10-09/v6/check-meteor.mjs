import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as meteor from '../../../src/3d/utils/storyMeteor.js';
import { storyCameraPath } from '../../../src/3d/utils/cameraPath.js';
import { PerspectiveCamera } from 'three';

// The baseline owns the authored curve; render presentation can change independently.
const cameraUrl = new URL('../../../src/3d/utils/cameraPath.js', import.meta.url).href;
const baselineSource = readFileSync(new URL('./storyMeteor-before.mjs', import.meta.url), 'utf8');
const baseline = await import(`data:text/javascript;base64,${Buffer.from(baselineSource.replace("'./cameraPath.js'", JSON.stringify(cameraUrl))).toString('base64')}`);
let checks = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
const check = (actual, message) => { assert.ok(actual, message); checks++; };
const near = (actual, expected, message) => { check(Math.abs(actual - expected) < 1e-8, message); };
const oldConstants = ['STORY_METEOR_SAMPLES', 'STORY_METEOR_TRAIL'];
for (const name of oldConstants) equal(meteor[name], baseline[name], `${name}: existing sampler contract`);
const legacy = ['createMeteorLayout', 'meteorReadingY', 'meteorEmphasis', 'meteorVisibility', 'worksArrival', 'sampleStoryMeteor', 'writeStoryMeteor'];
for (const name of legacy) check(typeof meteor[name] === 'function', `${name}: existing caller export survives`);

function project(point, pose, width, height) {
  const aspect = width / height;
  let fx = pose.lookX - pose.x, fy = pose.lookY - pose.y, fz = pose.lookZ - pose.z;
  const length = Math.hypot(fx, fy, fz); fx /= length; fy /= length; fz /= length;
  const horizontal = Math.hypot(fz, fx), rx = -fz / horizontal, rz = fx / horizontal;
  const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
  const dx = point.x - pose.x, dy = point.y - pose.y, dz = point.z - pose.z;
  const depth = dx * fx + dy * fy + dz * fz;
  const visibleHeight = 2 * Math.tan(Math.PI / 6) / Math.min(1, aspect) * depth;
  return { x: .5 + (dx * rx + dz * rz) / (visibleHeight * aspect), y: .5 + (dx * ux + dy * uy + dz * uz) / visibleHeight, depth };
}

const layouts = [];
const ribbonMetrics = [];
for (const [width, height, range] of [[390, 844, 2300], [1440, 900, 1600]]) {
  const layout = meteor.createMeteorLayout();
  equal(layout, baseline.createMeteorLayout(), 'layout field/schema parity');
  Object.assign(layout, { width, height, range });
  layout.points.set([.08, .12 * height, .25, range * .23, .65, range * .55, .75, range * .84, .62, range + height * .5]);
  layout.milestones.set([layout.points[3], layout.points[5], layout.points[7]]);
  const point = {}, oldPoint = {}, pose = {}, oldPose = {};
  const positions = new Float32Array(meteor.STORY_METEOR_SAMPLES * 3);
  const oldPositions = new Float32Array(positions.length);
  const outputs = new Map();
  const queries = Array.from({ length: 401 }, (_, index) => index / 200);
  for (const q of queries) {
    check(meteor.sampleStoryMeteor(layout, q, point, pose) === point, 'sampler reuses supplied output object');
    baseline.sampleStoryMeteor(layout, q, oldPoint, oldPose);
    equal(point, oldPoint, `curve unchanged ${width}px q=${q}`);
    equal(pose, oldPose, `authored camera unchanged ${width}px q=${q}`);
    check(Object.values(point).every(Number.isFinite), 'finite analytic world point');
    const chapter = q > 1 ? 'departure' : 'experience', progress = q > 1 ? q - 1 : q;
    const camera = storyCameraPath(chapter, progress, {}, false, width / height);
    const screen = project(point, camera, width, height);
    near(screen.depth, q <= 1 ? 24 : 24 + 72 * ((q - 1) ** 2 * (3 - 2 * (q - 1))), 'authored depth retained');
    near(screen.y, q <= 1 ? (meteor.meteorReadingY(layout, q) - q * range) / height : .5, 'head stays on DOM reading curve / departure midline');
    if (q >= 1) near(screen.x, .62 + (.5 - .62) * ((q - 1) ** 2 * (3 - 2 * (q - 1))), 'departure horizontal anchor remains authored');
    meteor.writeStoryMeteor(layout, q, positions, point, pose);
    baseline.writeStoryMeteor(layout, q, oldPositions, oldPoint, oldPose);
    equal(positions, oldPositions, 'legacy trail center samples are exact');
    outputs.set(q, positions.slice());
  }
  // Reuse the same scratch and output buffers through reverse, repeat/stop and jumps.
  for (const q of [...queries].reverse().concat([1.9, .07, .81, 1.01, .81, .81, .81])) {
    meteor.writeStoryMeteor(layout, q, positions, point, pose);
    const expected = outputs.get(q);
    if (expected) equal(positions, expected, `deterministic reverse/stop/jump ${width}px q=${q}`);
    else {
      baseline.writeStoryMeteor(layout, q, oldPositions, oldPoint, oldPose);
      equal(positions, oldPositions, `deterministic arbitrary jump ${width}px q=${q}`);
    }
  }
  for (const p of [-1, 0, .01, .035, .25, .5, .7, .85, 1, 2]) {
    equal(meteor.meteorReadingY(layout, p), baseline.meteorReadingY(layout, p), 'DOM reading clock stays unchanged');
    for (let index = 0; index < 3; index++) equal(meteor.meteorEmphasis(layout, index, p), baseline.meteorEmphasis(layout, index, p), 'milestone emphasis clock stays unchanged');
    for (const chapter of ['hero', 'portal', 'experience', 'departure', 'works', 'finale', 'contact']) {
      equal(meteor.meteorVisibility(chapter, p), baseline.meteorVisibility(chapter, p), 'visibility/exit threshold unchanged');
      equal(meteor.worksArrival(chapter, p), baseline.worksArrival(chapter, p), 'Works arrival timing unchanged');
    }
  }
  const ribbon = new Float32Array(meteor.STORY_METEOR_SAMPLES * 2 * 3);
  const normals = new Float32Array(meteor.STORY_METEOR_SAMPLES * 2 * 2);
  const screen = new Float64Array(meteor.STORY_METEOR_SAMPLES * 2);
  const metrics = {};
  const camera = new PerspectiveCamera(2 * Math.atan(Math.tan(Math.PI / 6) / Math.min(1, width / height)) * 180 / Math.PI, width / height, .1, 2000);
  const write = q => {
    const chapter = q <= 1 ? 'experience' : 'departure';
    const cameraPose = storyCameraPath(chapter, q <= 1 ? q : q - 1, oldPose, false, width / height);
    camera.position.set(cameraPose.x, cameraPose.y, cameraPose.z);
    camera.lookAt(cameraPose.lookX, cameraPose.lookY, cameraPose.lookZ);
    camera.updateMatrixWorld();
    check(meteor.writeStoryRibbon(layout, q, ribbon, normals, screen, camera.matrixWorldInverse.elements, camera.projectionMatrix.elements, point, pose, metrics) === metrics, 'ribbon writer reuses metrics output');
  };
  const ribbonSnapshots = new Map();
  for (const q of [0, .01, .05, .2, .4, .6, .8, 1, 1.1, 1.3, 1.5, 1.7, 1.9, 2]) {
    write(q);
    check(ribbon.every(Number.isFinite) && normals.every(Number.isFinite) && screen.every(Number.isFinite) && Object.values(metrics).every(Number.isFinite), 'ribbon screen/world/normal/metrics stay finite');
    check(metrics.span >= 0 && metrics.span <= Math.min(q, .9), 'bounded analytic tail window');
    check(metrics.tailPixels >= 0 && metrics.tailPixels <= width * .5, 'ribbon cannot exceed requested screen budget');
    for (let sample = 0; sample < meteor.STORY_METEOR_SAMPLES; sample++) {
      const offset = sample * 6, normalOffset = sample * 4;
      equal(ribbon.subarray(offset, offset + 3), ribbon.subarray(offset + 3, offset + 6), 'billboard edge vertices share one authored center');
      equal(normals.subarray(normalOffset, normalOffset + 2), normals.subarray(normalOffset + 2, normalOffset + 4), 'billboard edge normals share one tangent');
      check(Math.abs(Math.hypot(normals[normalOffset], normals[normalOffset + 1]) - 1) < 1e-6, 'pixel normal is unit length');
      meteor.sampleStoryMeteor(layout, q - metrics.span * sample / (meteor.STORY_METEOR_SAMPLES - 1), oldPoint, oldPose);
      equal([...ribbon.subarray(offset, offset + 3)], [Math.fround(oldPoint.x), Math.fround(oldPoint.y), Math.fround(oldPoint.z)], 'ribbon stays on preserved authored curve');
    }
    const ratio = metrics.tailPixels / width;
    if ([.6, .8].includes(q)) check(ratio >= .35 && ratio <= .5, 'mature Experience tail meets 35–50% viewport width arc');
    if (q === 0) equal(metrics.tailPixels, 0, 'entry preserves curve birth instead of inventing history');
    ribbonMetrics.push({ width, height, q, span: metrics.span, tailPixels: metrics.tailPixels, widthRatio: ratio });
    ribbonSnapshots.set(q, { ribbon: ribbon.slice(), normals: normals.slice(), screen: screen.slice(), metrics: { ...metrics } });
  }
  for (const q of [...ribbonSnapshots.keys()].reverse().concat([.6, 1.9, .01, 1.3, .6, .6, .6])) {
    write(q);
    const expected = ribbonSnapshots.get(q);
    equal(ribbon, expected.ribbon, 'ribbon reverse/stop/jump exact world vertices');
    equal(normals, expected.normals, 'ribbon reverse/stop/jump exact billboard tangents');
    equal(screen, expected.screen, 'ribbon reverse/stop/jump exact screen projection');
    equal(metrics, expected.metrics, 'ribbon reverse/stop/jump exact metrics');
  }
  // Place the same milestone at explicit distances from the head reading clock.
  const wakeProgress = .5;
  const readingY = meteor.meteorReadingY(layout, wakeProgress);
  for (let index = 0; index < 3; index++) {
    const oldMilestone = layout.milestones[index];
    for (const ratio of [-.3, -.061, -.06, -.03, 0, .13, .26, .261, .7]) {
      layout.milestones[index] = readingY - ratio * height;
      const wake = meteor.meteorWake(layout, index, wakeProgress);
      check(Number.isFinite(wake) && wake >= 0 && wake <= 1, 'milestone wake remains bounded');
      if (ratio <= -.06 || ratio >= .26) check(wake < 1e-12, 'wake is zero outside short local trailing window');
      if (ratio === 0) equal(wake, 1, 'wake peaks at exact head/milestone crossing');
      if (ratio === .13) near(wake, .5, 'wake fades behind head instead of an always-on pulse');
      equal(meteor.meteorWake(layout, index, wakeProgress), wake, 'wake stop is deterministic');
    }
    layout.milestones[index] = oldMilestone;
  }
  layouts.push({ width, height, range, milestones: [...layout.milestones] });
}
const result = { status: 'PASS', checks, baselineSha256: createHash('sha256').update(baselineSource).digest('hex'), layouts, ribbonMetrics, scope: 'Analytic curve, old consumer API, visibility, camera-relative projection, ribbon length/unit normals, localized wake, reverse/stop/jump; visual shaders/resources/FPS require Browser.' };
writeFileSync(new URL('./check-meteor-results.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
