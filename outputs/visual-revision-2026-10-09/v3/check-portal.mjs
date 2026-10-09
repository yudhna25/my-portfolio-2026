import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { portalProgress, portalState, portalIntake } from '../../../src/3d/utils/portal.js';
import { BLACK_HOLE_CENTER, STORY_CHAPTERS, storyCameraPath } from '../../../src/3d/utils/cameraPath.js';

const root = new URL('../../../', import.meta.url);
const aspects = [390 / 844, 1440 / 900, 1920 / 1080];
const keys = ['pull', 'intake', 'eject', 'center', 'visibility', 'textOpacity', 'aboutOpacity', 'controlsOpacity', 'dust'];
const sampleCount = 4000;
let assertions = 0;
let minimumObserverRadius = Infinity;
const check = (value, detail) => { assert(value, detail); assertions++; };
const equal = (a, b, detail) => { assert.deepEqual(a, b, detail); assertions++; };
const equalPose = (a, b, detail) => check(Object.keys(a).every(key => Math.abs(a[key] - b[key]) < 1e-10), detail);
const radius = pose => Math.hypot(pose.x - BLACK_HOLE_CENTER[0], pose.y - BLACK_HOLE_CENTER[1], pose.z - BLACK_HOLE_CENTER[2]);
const forward = [];
const phase = {}, pose = {}, intake = {};
const layout = { x: 400, y: 300 }, anchor = { left: 1050, top: 390, width: 133, height: 115, fixed: true };
for (let i = 0; i < sampleCount; i++) {
  const p = i / (sampleCount - 1);
  portalState(p, phase);
  for (const key of keys) check(Number.isFinite(phase[key]) && phase[key] >= 0 && phase[key] <= 1, `${key} range at ${p}`);
  check(Number.isFinite(phase.growth) && phase.growth >= 1, `growth at ${p}`);
  const cameras = aspects.map(aspect => {
    storyCameraPath('portal', p, pose, false, aspect);
    check(Object.values(pose).every(Number.isFinite), `camera finite at ${p}/${aspect}`);
    const distance = radius(pose);
    minimumObserverRadius = Math.min(minimumObserverRadius, distance);
    check(distance >= 8, `observer stays exterior at ${p}/${aspect}`);
    check(Math.hypot(pose.lookX - pose.x, pose.lookY - pose.y, pose.lookZ - pose.z) > 1, `camera target distinct at ${p}`);
    return { ...pose };
  });
  portalIntake(p, layout, anchor, 1440, 900, i % 12, intake);
  check(Object.values(intake).every(Number.isFinite) && intake.scaleX > 0 && intake.scaleY > 0, `intake finite at ${p}`);
  forward.push({ phase: { ...phase }, cameras, intake: { ...intake } });
}
for (let i = sampleCount - 1; i >= 0; i--) {
  const p = i / (sampleCount - 1);
  portalState(p, phase);
  equal(phase, forward[i].phase, `reverse phase at ${p}`);
  aspects.forEach((aspect, index) => {
    storyCameraPath('portal', p, pose, false, aspect);
    equal(pose, forward[i].cameras[index], `reverse camera at ${p}/${aspect}`);
  });
  portalIntake(p, layout, anchor, 1440, 900, i % 12, intake);
  equal(intake, forward[i].intake, `reverse intake at ${p}`);
}
for (const boundary of [.04, .34, .35, .425, .435, .44, .47, .50, .54, .56, .66, .70, .84, .90, .94, .96]) {
  const before = portalState(boundary - 1e-8), after = portalState(boundary + 1e-8);
  for (const key of [...keys, 'growth']) check(Math.abs(before[key] - after[key]) < 1e-4, `${key} continuous around ${boundary}`);
  for (const aspect of aspects) {
    const a = storyCameraPath('portal', boundary - 1e-8, {}, false, aspect);
    const b = storyCameraPath('portal', boundary + 1e-8, {}, false, aspect);
    check(Object.keys(a).every(key => Math.abs(a[key] - b[key]) < 1e-4), `camera continuous around ${boundary}/${aspect}`);
  }
}
for (const p of [.44, .46, .47, .48, .50]) {
  portalState(p, phase);
  for (const key of ['visibility', 'textOpacity', 'aboutOpacity', 'controlsOpacity', 'dust']) equal(phase[key], 0, `${key} dark-core ${p}`);
  equal(phase.backdrop, false, `backdrop hidden in core ${p}`);
}
equal(portalState(.47 - 1e-8).mini, 1, 'mini before mapping rebase');
equal(portalState(.47).mini, 0, 'full mapping after hidden rebase');
for (const aspect of aspects) {
  equalPose(storyCameraPath('portal', 0, {}, false, aspect), storyCameraPath('hero', 0, {}, false, aspect), 'Hero boundary');
  equalPose(storyCameraPath('portal', 1, {}, false, aspect), storyCameraPath('about', 0, {}, false, aspect), 'About boundary');
  for (const p of [0, .25, .44, .47, .50, .70, .94, 1]) {
    equalPose(storyCameraPath('portal', p, {}, true, aspect), storyCameraPath('about', 0, {}, true, aspect), 'reduced portal has no zoom');
    equal(portalProgress('portal', p, true), 1, 'reduced portal readable endpoint');
  }
}
for (const value of [NaN, Infinity, -Infinity, -1, 2, undefined]) {
  check(Object.values(portalState(value)).every(value => typeof value === 'boolean' || Number.isFinite(value)), 'invalid p remains finite');
  check(Object.values(storyCameraPath('portal', value)).every(Number.isFinite), 'invalid camera p remains finite');
}
equal(STORY_CHAPTERS.find(item => item.id === 'portal').height, 4, '400vh shared story range');
const source = fs.readFileSync(new URL('src/App.jsx', root), 'utf8');
check(source.includes("staticMotion ? 'min-h-screen' : 'min-h-[400vh]'"), 'production 400vh short static range');
const sourceHashes = Object.fromEntries(['src/3d/utils/portal.js', 'src/3d/utils/cameraPath.js'].map(path => [path, crypto.createHash('sha256').update(fs.readFileSync(new URL(path, root))).digest('hex')]));
const result = { status: 'PASS', assertions, sampleCount, aspects, minimumObserverRadius, sourceHashes,
  scope: 'Pure analytic portal/intake/camera, forward-reverse equality, scalar/camera continuity, exterior observer and hidden mapping rebase. DOM/GPU/resource behavior requires Browser evidence.' };
fs.writeFileSync(new URL('check-portal-results.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
