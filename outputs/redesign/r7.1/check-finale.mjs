import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { Matrix4, Quaternion, ShaderMaterial, Vector3 } from 'three';
import { BLACK_HOLE_CENTER, STORY_CHAPTERS, storyCameraPath } from '../../../src/3d/utils/cameraPath.js';
import { FINALE_PHASES, finaleFigure, finaleState } from '../../../src/3d/utils/finale.js';
import { BLACK_HOLE_COPY } from '../../../src/3d/shaders/blackHole.js';

// Exercise the real component's basis without copying its projection math.
const component = await readFile(new URL('../../../src/3d/components/WorksConstellations.jsx', import.meta.url), 'utf8');
const body = component.match(/const basis = useMemo\(\(\) => \{([\s\S]*?)\}, \[size\.width, size\.height\]\);/)?.[1];
assert.ok(body, 'Works basis must remain identifiable in the actual component');
const buildBasis = new Function('size', 'storyCameraPath', 'Vector3', 'Quaternion', 'Matrix4', 'BLACK_HOLE_CENTER', body);
const data = JSON.parse(await readFile(new URL('../../../src/3d/data/worksConstellations.json', import.meta.url), 'utf8'));
const report = { status: 'running', checkedAt: new Date().toISOString(), assertions: 0, maxCollisionError: 0, maxBoundaryError: 0, viewports: [] };
const near = (actual, expected, tolerance = 1e-10, label = '') => {
  report.assertions++;
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} !== ${expected}`);
};
const equal = (actual, expected, label = '') => { report.assertions++; assert.deepEqual(actual, expected, label); };
const origins = [0, 0.01, Math.PI / 3, Math.PI, Math.PI * 2, 12.345, -2.8];
const progress = [...new Set([0, 0.12, 0.34, 0.42, 0.43, 0.44, 0.47, 0.53, 0.55, 0.58, 0.70, 0.88, 0.96, 1,
  ...Array.from({ length: 101 }, (_, i) => i / 100)])].sort((a, b) => a - b);

try {
  equal(FINALE_PHASES.compress, 0.34, 'compression begins at .34');
  equal(FINALE_PHASES.collision, 0.44, 'collision at .44');
  near(FINALE_PHASES.collision - FINALE_PHASES.compress, 0.10, 1e-15, 'compression is exactly 10% of finale');
  equal(STORY_CHAPTERS.find(chapter => chapter.id === 'finale').height, 2.25, 'finale remains its own 2.25 viewport segment');
  equal(finaleState(0), { progress: 0, label: 1, travel: 0, angle: 0, radius: 1, figure: 1, stars: 1,
    trails: 0, cloud: 0, collapse: 0, hole: 0, flare: 0, contact: 0, phase: 'retract' }, 'Works endpoint has no finale offset');
  const ending = finaleState(1);
  equal([ending.radius, ending.figure, ending.stars, ending.trails, ending.cloud, ending.flare, ending.label], [0, 0, 0, 0, 0, 0, 0], 'temporary effects vanish at Contact');
  equal([ending.travel, ending.collapse, ending.hole, ending.contact], [1, 1, 1, 1], 'Contact is fully formed');
  for (const invalid of [NaN, Infinity, -Infinity]) equal(finaleState(invalid), finaleState(0), 'non-finite progress defaults safely');
  equal(finaleState(-1), finaleState(0));
  equal(finaleState(2), finaleState(1));
  let previous = finaleState(0.34);
  for (let i = 1; i <= 100; i++) {
    const current = finaleState(0.34 + i * 0.001);
    equal(current.radius <= previous.radius && current.figure <= previous.figure && current.travel >= previous.travel, true, 'compression moves toward center monotonically');
    previous = current;
  }
  for (const boundary of Object.values(FINALE_PHASES)) {
    const before = finaleState(boundary - 1e-8), after = finaleState(boundary + 1e-8);
    for (const key of Object.keys(before).filter(key => typeof before[key] === 'number')) {
      const error = Math.abs(before[key] - after[key]);
      report.maxBoundaryError = Math.max(report.maxBoundaryError, error);
      near(before[key], after[key], 1e-5, `${key} continuous around phase ${boundary}`);
    }
  }
  for (const [width, height] of [[1440, 900], [390, 844], [320, 844], [768, 1024], [2560, 1440]]) {
    const basis = buildBasis({ width, height }, storyCameraPath, Vector3, Quaternion, Matrix4, BLACK_HOLE_CENTER);
    const aspect = width / height;
    const world = (pose, local = [0, 0, 0]) => new Vector3(pose.x + local[0] * pose.scale,
      pose.y + local[1] * pose.scale, pose.z + local[2] * pose.scale).applyQuaternion(basis.rotation).add(basis.center);
    for (const origin of origins) for (let index = 0; index < 3; index++) {
      const initial = finaleFigure(0, origin, index, basis);
      const angle = origin + index * Math.PI * 2 / 3;
      near(initial.x, Math.cos(angle) * basis.radiusX);
      near(initial.y, Math.sin(angle) * basis.radiusY + basis.offsetY);
      near(initial.z, 0); near(initial.scale, basis.scale);
      const collision = finaleFigure(0.44, origin, index, basis);
      near(collision.scale, 0, 1e-12, 'every figure shrinks to the collision point');
      for (const star of [...data.constellations[index].geometry.stars, ...data.constellations[index].geometry.supportingStars]) {
        const error = world(collision, star.position).distanceTo(new Vector3(...BLACK_HOLE_CENTER));
        report.maxCollisionError = Math.max(report.maxCollisionError, error);
        near(error, 0, 1e-10, 'actual stars reach world BH center after Works basis rotation');
      }
      const snapshots = progress.map(p => finaleFigure(p, origin, index, basis));
      const reusable = {};
      for (let i = progress.length - 1; i >= 0; i--) {
        equal(finaleFigure(progress[i], origin, index, basis, reusable), snapshots[i], 'reverse matches forward state exactly');
        report.assertions++;
        assert.equal(finaleFigure(progress[i], origin, index, basis, reusable), reusable, 'caller-owned output identity stays stable');
      }
      for (const p of [0.4399, 0.4401, 0.41, 0.47, 0.43, 0.53, 0.34, 0, 0.96, 1]) {
        equal(finaleFigure(p, origin, index, basis), finaleFigure(p, origin, index, basis), 'rapid reverse/hold is history independent');
      }
    }
    equal(storyCameraPath('finale', 0, {}, false, aspect), storyCameraPath('works', 1, {}, false, aspect), 'camera continuity at Works/finale boundary');
    const contact = storyCameraPath('contact', 0, {}, false, aspect);
    equal(storyCameraPath('finale', 1, {}, false, aspect), contact, 'camera continuity at finale/Contact boundary');
    equal(storyCameraPath('finale', 0.44, {}, false, aspect), contact, 'camera reaches collision frame by .44');
    for (const p of progress) {
      const camera = storyCameraPath('finale', p, {}, false, aspect);
      equal(Object.values(camera).every(Number.isFinite), true, 'camera stays finite');
      equal(Math.hypot(camera.x, camera.y, camera.z + 200) > 1, true, 'observer remains outside BH horizon');
      equal(storyCameraPath('finale', p, {}, true, aspect), contact, 'reduced finale uses static Contact pose');
    }
    report.viewports.push({ width, height, origins: origins.length, sampledProgress: progress.length });
  }
  report.originalAssertions = report.assertions;
  // Evaluate the actual alpha/RGB expressions: no double-precision noise oracle needed.
  const alphaExpression = BLACK_HOLE_COPY.match(/float alpha = ([^;]+);/)?.[1];
  const colorExpression = BLACK_HOLE_COPY.match(/return vec4\(vec3\(([^\n]+)\), alpha\);/)?.[1];
  equal(Boolean(alphaExpression && colorExpression), true, 'gas premultiplied expressions remain identifiable');
  const gasSample = new Function('density', 'strands', 'flare', 'clamp', 'mix',
    `const alpha = ${alphaExpression}; return { alpha, rgb: ${colorExpression} };`);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const mix = (a, b, t) => a + (b - a) * t;
  let maxGasStraightRgb = 0;
  for (let d = 0; d <= 100; d++) for (let s = 0; s <= 20; s++) {
    const gas = gasSample(d / 100, s / 20, 0, clamp, mix);
    const straight = gas.alpha ? gas.rgb / gas.alpha : gas.rgb;
    equal(gas.alpha >= 0 && gas.alpha <= 0.9, true, 'gas alpha remains bounded');
    equal(straight >= 0 && straight <= 0.82 + 1e-12, true, 'gas without flare cannot cross Bloom threshold');
    maxGasStraightRgb = Math.max(maxGasStraightRgb, straight);
  }
  const oldHotspot = gasSample(0.8607431511142442, 0.9866181696804708, 0, clamp, mix);
  equal(oldHotspot.rgb / oldHotspot.alpha < 0.82, true, 'previous HDR gas regression hotspot is now bounded');
  equal(gasSample(0, 0, 1, clamp, mix).rgb > 1, true, 'compact authored flare may still emit HDR');
  const holeComponent = await readFile(new URL('../../../src/3d/components/BlackHole.jsx', import.meta.url), 'utf8');
  const updateBody = holeComponent.match(/onUpdate=\{material => \{([^}]+)\}\}/)?.[1];
  equal(Boolean(updateBody), true, 'actual copy shader onUpdate is identifiable');
  const update = new Function('material', 'copyUniforms', updateBody);
  const material = new ShaderMaterial({ defines: { FINALE_OCTAVES: 4 } });
  const copyUniforms = {};
  for (const octave of [3, 2, 4]) {
    const version = material.version;
    material.defines = { FINALE_OCTAVES: octave };
    update(material, copyUniforms);
    equal(material.version > version, true, 'copy shader tier change invalidates the compiled program');
    report.assertions++;
    assert.equal(material.uniforms, copyUniforms, 'copy/mask uniform identity is retained');
  }
  material.dispose();
  report.regressions = { assertions: report.assertions - report.originalAssertions, gasSamples: 2121, maxGasStraightRgb,
    tierOctavesChecked: [3, 2, 4], previousHotspotStraightRgb: oldHotspot.rgb / oldHotspot.alpha };
  report.status = 'pass';
} catch (error) {
  report.status = 'fail'; report.error = { name: error.name, message: error.message, stack: error.stack }; process.exitCode = 1;
}
await writeFile(new URL('./check-results.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
