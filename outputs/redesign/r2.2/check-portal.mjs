import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { portalProgress, portalState } from '../../../src/3d/utils/portal.js';
import { storyCameraPath, BLACK_HOLE_CENTER } from '../../../src/3d/utils/cameraPath.js';
import { BLACK_HOLE_FRAG, BLACK_HOLE_VERT, BLACK_HOLE_COPY, PORTAL_IMAGE_GLSL } from '../../../src/3d/shaders/blackHole.js';
import { BLACK_HOLE_FRAG as beforeFrag, BLACK_HOLE_VERT as beforeVert } from './before/src/3d/shaders/blackHole.js';

let checks = 0;
const check = (condition, message) => { checks++; assert.ok(condition, message); };
const same = (actual, expected, message) => { checks++; assert.deepEqual(actual, expected, message); };
const fields = ['mini', 'visibility', 'growth', 'textOpacity', 'dust', 'pull'];
const snapshot = state => Object.fromEntries(fields.map(key => [key, state[key]]));
const output = {};

same(portalProgress('hero', 0.8), 0, 'Hero always uses mini idle');
same(portalProgress('about', 0), 1, 'About direct jump opens universe');
same(portalProgress('contact', 0), 1, 'Contact does not require traversing portal');
same(portalProgress('portal', 0.25), 0.25, 'Portal uses local progress');
same(portalProgress('portal', 0.25, true), 1, 'Reduced-motion uses portal endpoint');
for (const [value, expected] of [[-1, 0], [2, 1], [NaN, 0], [Infinity, 0], [-Infinity, 0]]) {
  same(portalProgress('portal', value), expected, `Trust boundary clamp ${value}`);
}

const start = snapshot(portalState(0));
const end = snapshot(portalState(1));
same(start, { mini: 1, visibility: 1, growth: 1, textOpacity: 1, dust: 0.12, pull: 0 }, 'Mini idle endpoint');
same(end.mini, 0, 'Large scene endpoint');
same(end.visibility, 1, 'Large BH fully visible');
check(Math.abs(end.growth - 600) < 1e-8, 'Finite max aperture growth');
same(end.textOpacity, 0, 'Portal semantic heading visually withdrawn');
same(end.dust, 0, 'Dust withdrawn after portal');
same(end.pull, 1, 'Dust pull reaches story endpoint');

let minimumRadius = Infinity;
let previousGrowth = 0;
const forward = [];
for (let index = 0; index <= 1000; index++) {
  const p = index / 1000;
  check(portalState(p, output) === output, 'Reuse caller output');
  for (const key of fields) check(Number.isFinite(output[key]), `${p}: finite ${key}`);
  check(output.mini === 0 || output.mini === 1, `${p}: mapping is a single phase`);
  check(output.visibility >= 0 && output.visibility <= 1, `${p}: visibility bounds`);
  check(output.textOpacity >= 0 && output.textOpacity <= 1, `${p}: semantic opacity bounds`);
  check(output.dust >= 0 && output.dust <= 0.12, `${p}: subtle dust bounds`);
  same(output.pull, p, `${p}: dust pull derives directly from shared progress`);
  check(output.growth >= 1 && output.growth <= 600 + 1e-8, `${p}: positive finite scale`);
  check(output.growth >= previousGrowth - 1e-8, `${p}: growth monotonic before dark mapping swap`);
  previousGrowth = output.growth;
  if (p >= 0.48 && p <= 0.60) same(output.visibility, 0, `${p}: mapping change hidden`);
  forward.push(snapshot(output));
  for (const aspect of [390 / 844, 1440 / 900]) {
    const pose = storyCameraPath('portal', p, {}, false, aspect);
    const radius = Math.hypot(pose.x - BLACK_HOLE_CENTER[0], pose.y - BLACK_HOLE_CENTER[1], pose.z - BLACK_HOLE_CENTER[2]);
    minimumRadius = Math.min(minimumRadius, radius);
    check(radius > 1.01, `${p}: exterior ray observer ${aspect}`);
    for (const value of Object.values(pose)) check(Number.isFinite(value), `${p}: camera finite`);
  }
}
for (let index = 1000; index >= 0; index--) {
  same(snapshot(portalState(index / 1000, output)), forward[index], `${index}: reverse state exact`);
}
for (const value of [-1, NaN, Infinity, -Infinity]) same(snapshot(portalState(value)), start, `State lower/nonfinite clamp ${value}`);
same(snapshot(portalState(2)), end, 'State upper clamp');

same(BLACK_HOLE_FRAG, beforeFrag, 'One existing ray algorithm, unchanged');
same(BLACK_HOLE_VERT, beforeVert, 'Full-screen NDC vertex retained');
check(typeof PORTAL_IMAGE_GLSL === 'string' && PORTAL_IMAGE_GLSL.length > 50, 'Shared portal GLSL exists');
check(BLACK_HOLE_COPY.includes(PORTAL_IMAGE_GLSL), 'Copy consumes shared portal mapping GLSL');
const source = async path => readFile(new URL(`../../../${path}`, import.meta.url), 'utf8');
const [mask, system, blackHole, scene, heading] = await Promise.all([
  source('src/3d/components/BlackHoleBloomMask.jsx'),
  source('src/3d/components/BlackHoleSystem.jsx'),
  source('src/3d/components/BlackHole.jsx'),
  source('src/3d/GalaxyScene.jsx'),
  source('src/components/effects/PortalHeading.jsx'),
]);
check(mask.includes('PORTAL_IMAGE_GLSL') && mask.includes('${PORTAL_IMAGE_GLSL}'), 'Bloom mask consumes same GLSL snippet');
same((system.match(/new WebGLRenderTarget\(/g) ?? []).length, 1, 'One application HDR target');
same((system.match(/<EffectComposer\b/g) ?? []).length, 1, 'One existing composer');
same((scene.match(/<Canvas\b/g) ?? []).length, 1, 'One persistent Canvas');
same((scene.match(/<CameraRig\b/g) ?? []).length, 1, 'One scene camera owner');
same((blackHole.match(/gl\.render\(active\.scene, active\.camera\)/g) ?? []).length, 1, 'One HDR ray render call');
check(/material\.uniforms\s*=\s*copyUniforms/.test(blackHole), 'Retain shared scalar uniform identities after Fiber assignment');
check(heading.includes('useScrollStore.subscribe(draw)'), 'DOM pose subscribes to same progress publish');
check(!heading.includes('ticker.add(draw)'), 'No separately ordered DOM draw ticker');

const result = { passed: true, checks, sampledProgress: 1001, minimumObserverRadius: minimumRadius, boundary: { start, end }, note: 'Pure Node checks logic/source ownership only; Browser/GPU/color checks remain separate.' };
await writeFile(new URL('./check-portal-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
