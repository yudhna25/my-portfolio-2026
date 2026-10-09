import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { STORY_CHAPTERS, BLACK_HOLE_CENTER, clampStoryProgress, segmentProgress, storyCameraPath } from '../../../src/3d/utils/cameraPath.js';
import { portalProgress, portalState } from '../../../src/3d/utils/portal.js';
import { METEOR_COUNT, METEOR_SAMPLES, createShootingStars, advanceShootingStars } from '../../../src/3d/utils/shootingStars.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = path => readFileSync(resolve(root, path), 'utf8');
let assertions = 0;
const check = (value, label) => { assert.ok(value, label); assertions++; };
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); assertions++; };
const poses = [0, .25, .5, .75, 1];
const out = {};
const phase = {};

for (const value of [-1, 0, .5, 1, 2, NaN, Infinity, '0.5']) {
  const p = clampStoryProgress(value);
  check(Number.isFinite(p) && p >= 0 && p <= 1, 'clamped progress stays finite');
}
equal(segmentProgress(75, 50, 100), .5, 'DOM range progress');
equal(segmentProgress(75, 100, 100), 0, 'zero range clamps');
equal(segmentProgress(-10, 0, 100), 0, 'range start clamps');
equal(segmentProgress(110, 0, 100), 1, 'range end clamps');
equal(portalProgress('hero', .8), 0, 'Hero never reveals universe');
equal(portalProgress('portal', .25, true), 1, 'reduced portal endpoint');
equal(portalProgress('about', 0), 1, 'About is settled portal');
equal(portalState(0, phase), { pull: 0, mini: 1, visibility: 1, growth: 1, textOpacity: 1, dust: .12 }, 'idle mini state');
equal(portalState(.5, phase).visibility, 0, 'pose change stays black');
equal(portalState(1, phase).mini, 0, 'settled full image');
equal(portalState(1, phase).visibility, 1, 'settled full visibility');

let minRadius = Infinity;
for (const aspect of [390 / 844, 1, 1920 / 1080]) {
  for (const { id } of STORY_CHAPTERS) {
    const forward = poses.map(p => {
      check(storyCameraPath(id, p, out, false, aspect) === out, 'camera output reuse');
      check(portalState(portalProgress(id, p), phase) === phase, 'portal output reuse');
      check(Object.values(out).every(Number.isFinite) && Object.values(phase).every(Number.isFinite), 'finite story pose');
      check(out.parallax === 0, 'story has no pointer drift');
      const radius = Math.hypot(out.x - BLACK_HOLE_CENTER[0], out.y - BLACK_HOLE_CENTER[1], out.z - BLACK_HOLE_CENTER[2]);
      minRadius = Math.min(minRadius, radius);
      check(radius > 1, 'ray observer outside horizon');
      return { camera: { ...out }, portal: { ...phase } };
    });
    const reverse = [...poses].reverse().map(p => ({ camera: { ...storyCameraPath(id, p, out, false, aspect) }, portal: { ...portalState(portalProgress(id, p), phase) } })).reverse();
    equal(reverse, forward, 'same progress after reverse');
    equal(storyCameraPath(id, .25, out, true, aspect), storyCameraPath(id, 1, {}, false, aspect), 'reduced camera endpoint');
  }
  for (const [previous, next] of [['hero', 'portal'], ['portal', 'about'], ['about', 'skills'], ['skills', 'education'], ['education', 'experience'], ['experience', 'works'], ['works', 'finale'], ['finale', 'contact']]) {
    equal(storyCameraPath(previous, 1, {}, false, aspect), storyCameraPath(next, 0, {}, false, aspect), `${previous}->${next} endpoint`);
  }
}

const pool = createShootingStars(() => .5);
const positions = new Float32Array(METEOR_COUNT * METEOR_SAMPLES * 3);
const alphas = new Float32Array(METEOR_COUNT * METEOR_SAMPLES);
pool.remaining = .01;
Object.assign(pool.meteors[3], { age: .1, life: .8, x: .1, y: .1, dx: .3, dy: -.2 });
for (let i = 0; i < 3; i++) advanceShootingStars(pool, .05, 1, positions, alphas, () => { throw new Error('blocked emitter must not draw randomness'); }, false);
equal(pool.remaining, .01, 'blocked emitter pauses countdown');
check(pool.meteors.slice(0, 3).every(meteor => meteor.age === Infinity), 'blocked emitter creates no wave');
check(Math.abs(pool.meteors[3].age - .25) < 1e-12, 'active trail keeps advancing while emission is blocked');
check(alphas.some(alpha => alpha > 0), 'active trail remains populated during fade');
check(positions.every(Number.isFinite) && alphas.every(Number.isFinite), 'meteor buffers stay finite');
advanceShootingStars(pool, .05, 1, positions, alphas, () => .5, true);
check(pool.remaining >= 4 && pool.remaining <= 7 && pool.meteors[0].age < .1, 'resume creates scheduled wave');

const keys = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => item && typeof item === 'object' ? keys(item, `${prefix}${key}.`) : [`${prefix}${key}`]);
const vi = JSON.parse(read('src/i18n/locales/vi.json'));
const en = JSON.parse(read('src/i18n/locales/en.json'));
equal(keys(vi).sort(), keys(en).sort(), 'main locale key parity');
equal([vi.hero.portfolio, en.hero.portfolio], ['PORTFOLIO', 'PORTFOLIO'], 'same nine-glyph portal label');
equal([vi.hero.year, en.hero.year], ['2026', '2026'], 'accessible year content');
const sourceFiles = directory => readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(`${directory}/${entry.name}`) : /\.(jsx|js)$/.test(entry.name) ? [`${directory}/${entry.name}`] : []);
const source = sourceFiles('src').map(read).join('\n');
equal((source.match(/<CameraRig\b/g) ?? []).length, 1, 'one camera component owner');
equal((source.match(/<Canvas\b/g) ?? []).length, 1, 'one R3F Canvas owner');
equal((source.match(/new WebGLRenderTarget\(/g) ?? []).length, 1, 'one explicit HDR ray target');
for (const path of ['src/3d/components/CameraRig.jsx', 'src/3d/utils/cameraPath.js', 'src/3d/shaders/blackHole.js', 'src/3d/components/BlackHoleSystem.jsx', 'src/3d/components/BlackHoleBloomMask.jsx']) {
  const sha = contents => createHash('sha256').update(contents).digest('hex');
  equal(sha(read(path)), sha(read(`outputs/redesign/r3.2/before/${path}`)), `${path} unchanged from current task baseline`);
}
check(read('src/components/Hero.jsx').includes("import { PortalHeading } from '@/components/effects/PortalHeading'"), 'Hero reuses semantic shared heading');
check(read('src/3d-lab.jsx').includes('<PortalHeading') && read('src/App.jsx').includes('<GalaxyScene story'), 'lab and production share portal renderer');
check(read('src/index.css').includes('transition-duration: 0s !important;') && !read('src/index.css').includes('transition-duration: 0.01ms'), 'reduced CSS does not create an inherited visibility transition before native focus');
console.log(JSON.stringify({ status: 'PASS', assertions, minObserverRadius: minRadius, mainLocaleKeys: keys(vi).length, scope: 'pure contract / source ownership; Browser still required' }, null, 2));
