import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraPath as baselinePath } from './before/src/3d/utils/cameraPath.js';
import { cameraPath, STORY_CHAPTERS, storyCameraPath, clampStoryProgress, segmentProgress, BLACK_HOLE_CENTER } from '../../../src/3d/utils/cameraPath.js';

let checks = 0;
const check = (condition, message) => { checks++; assert.ok(condition, message); };
const same = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const fields = ['x', 'y', 'z', 'lookX', 'lookY', 'lookZ', 'parallax'];
const pose = value => Object.fromEntries(fields.map(key => [key, value[key]]));
const epsilon = 1e-10;

for (const p of [0, 0.25, 0.5, 0.75, 1]) {
  same(cameraPath(p), baselinePath(p), `Legacy camera changed at ${p}`);
}
same(BLACK_HOLE_CENTER, [0, 0, -200], 'Existing ray-tracing center must remain fixed');
same(STORY_CHAPTERS.map(chapter => chapter.id), ['hero', 'portal', 'about', 'skills', 'education', 'experience', 'works', 'finale', 'contact'], 'Chapter order');
same(STORY_CHAPTERS.map(chapter => chapter.height), [1, 1.75, 1, 1, 1.75, 1, 1, 2.25, 1], 'Storyboard DOM ranges');
for (const [input, expected] of [[-1, 0], [2, 1], [0.42, 0.42], [NaN, 0], [Infinity, 0], [-Infinity, 0]]) {
  same(clampStoryProgress(input), expected, `Clamp ${input}`);
}
for (const [scroll, start, end, expected] of [[0, 100, 300, 0], [100, 100, 300, 0], [200, 100, 300, 0.5], [300, 100, 300, 1], [999, 100, 300, 1]]) {
  same(segmentProgress(scroll, start, end), expected, `DOM segment ${scroll}`);
}

const output = {};
let minimumObserverRadius = Infinity;
let sampledPoses = 0;
const aspects = [390 / 844, 1440 / 900];
for (const aspect of aspects) {
  for (let index = 0; index < STORY_CHAPTERS.length; index++) {
    const { id } = STORY_CHAPTERS[index];
    const beginning = pose(storyCameraPath(id, 0, {}, false, aspect));
    const ending = pose(storyCameraPath(id, 1, {}, false, aspect));
    same(pose(storyCameraPath(id, -1, {}, false, aspect)), beginning, `${id} lower clamp`);
    same(pose(storyCameraPath(id, 2, {}, false, aspect)), ending, `${id} upper clamp`);
    for (const input of [NaN, Infinity, -Infinity]) {
      same(pose(storyCameraPath(id, input, {}, false, aspect)), beginning, `${id} nonfinite clamp`);
    }
    if (index + 1 < STORY_CHAPTERS.length) {
      const next = storyCameraPath(STORY_CHAPTERS[index + 1].id, 0, {}, false, aspect);
      for (const field of fields) check(Math.abs(ending[field] - next[field]) < epsilon, `${id} → next boundary ${field}`);
    }
    for (let step = 0; step <= 1000; step++) {
      const p = step / 1000;
      check(storyCameraPath(id, p, output, false, aspect) === output, `${id} reuses output`);
      for (const field of fields) check(Number.isFinite(output[field]), `${id}:${p} finite ${field}`);
      check(output.parallax === 0, `${id}:${p} deterministic parallax`);
      const radius = Math.hypot(output.x - BLACK_HOLE_CENTER[0], output.y - BLACK_HOLE_CENTER[1], output.z - BLACK_HOLE_CENTER[2]);
      minimumObserverRadius = Math.min(minimumObserverRadius, radius);
      check(radius > 1.01, `${id}:${p} observer outside horizon`);
      sampledPoses++;
    }
    const forward = [0, 0.1, 0.25, 0.45, 0.5, 0.6, 0.75, 0.9, 1].map(p => pose(storyCameraPath(id, p, {}, false, aspect)));
    for (let i = forward.length - 1; i >= 0; i--) {
      const p = [0, 0.1, 0.25, 0.45, 0.5, 0.6, 0.75, 0.9, 1][i];
      same(pose(storyCameraPath(id, p, {}, false, aspect)), forward[i], `${id} reverse at ${p}`);
    }
    for (const p of [0, 0.2, 0.7, 1]) same(pose(storyCameraPath(id, p, {}, true, aspect)), ending, `${id} reduced-motion endpoint`);
  }
}
for (const id of ['hero', 'about', 'works', 'contact']) {
  same(pose(storyCameraPath(id, 0)), pose(storyCameraPath(id, 0.75)), `${id} read pose is static`);
}
same(pose(storyCameraPath('portal', 0.45)), pose(storyCameraPath('portal', 0.6)), 'Portal blackout holds a safe observer pose');

const worksProjection = [];
for (const [width, height] of [[320, 844], [390, 844], [1440, 900]]) {
  const aspect = width / height;
  const target = storyCameraPath('works', 0, {}, false, aspect);
  const fov = 2 * Math.atan(Math.tan(Math.PI / 6) / Math.min(1, aspect)) * 180 / Math.PI;
  const camera = new PerspectiveCamera(fov, aspect, 0.1, 400);
  camera.position.set(target.x, target.y, target.z);
  camera.lookAt(target.lookX, target.lookY, target.lookZ);
  camera.updateMatrixWorld();
  const center = new Vector3(...BLACK_HOLE_CENTER).project(camera);
  check(center.x < -1, `${width} Works BH center leaves left edge`);
  let diskMaxNDCX = -Infinity;
  const point = new Vector3();
  for (let step = 0; step < 128; step++) {
    const angle = step / 128 * Math.PI * 2;
    point.set(14 * Math.cos(angle), 0, BLACK_HOLE_CENTER[2] + 14 * Math.sin(angle)).project(camera);
    check(Number.isFinite(point.x), `${width} disk projection finite`);
    diskMaxNDCX = Math.max(diskMaxNDCX, point.x);
  }
  check(diskMaxNDCX < -1, `${width} radius-14 disk outline leaves left edge`);
  worksProjection.push({ width, height, fov, centerNDC: center.toArray(), diskMaxNDCX });
}

const result = {
  status: 'pass', checks, sampledPoses, minimumObserverRadius, aspects, worksProjection,
  legacySamples: [0, 0.25, 0.5, 0.75, 1],
  limits: ['Numeric pose contract only; no portal/finale effect implementation.', 'Black-hole center remains [0,0,-200]; projection checks use the physical radius-14 disk, while ray-traced appearance and browser sync require separate verification.'],
};
await writeFile(new URL('./check-path-results.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
