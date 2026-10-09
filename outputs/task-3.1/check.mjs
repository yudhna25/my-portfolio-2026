import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const json = (file) => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
for (const { path, sha256 } of json('./protected.json')) {
  const hash = createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex');
  assert.equal(hash, sha256, `${path}: protected scene/content unchanged`);
}
const result = json('./browser-results.json');
assert.equal(result.errors.length, 0, result.errors.join('\n'));
assert(result.checks.length >= 39 && result.checks.every((check) => check.pass), 'all lifecycle / motion checks pass');
for (const section of ['about', 'skills']) {
  const fps = result.fps.filter((pose) => pose.section === section && !pose.hidden);
  assert(fps.length && fps.every((pose) => pose.frames > 240 && pose.fps > 120), `${section}: measured Fiber FPS >120`);
}
for (const pose of result.captures.filter((pose) => pose.planet?.visible)) {
  const surface = pose.planet.materials.find((material) => material.name === 'planet-surface');
  assert.equal(surface.type, 'MeshStandardMaterial');
  assert.equal(surface.color, '111111');
  assert(pose.planet.materials.every((material) => !material.map && !material.shadow));
  assert(pose.planet.materials.slice(1).every((material) => material.type === 'MeshBasicMaterial' && material.color === 'ffffff'));
}
const responsive = json('./browser-responsive.json');
assert.equal(responsive.length, 6);
for (const { pose, overflow } of responsive) {
  const piece = pose.planet ?? pose.orbit;
  assert(overflow <= 0 && pose.canvas === 1 && piece?.visible);
  assert(Math.abs(piece.center[0] - piece.bounds.left - piece.bounds.width / 2) < 2);
  assert(Math.abs(piece.center[1] - piece.bounds.top - piece.bounds.height / 2) < 2);
  const viewportWidth = pose.size.width - overflow; // Canvas excludes the scrollbar; media queries include it.
  assert.equal(pose.starCount, viewportWidth < 768 ? 6000 : viewportWidth < 1024 ? 12000 : 24000);
}
assert.equal(json('./app-console.json').filter((entry) => entry.level === 'error').length, 0);
const fallback = json('./fallback.json');
assert.equal(fallback.canvas, 0);
assert.equal(fallback.sections, 8);
assert(fallback.fallback.includes('Chế độ xem tĩnh'));
console.log(`PASS: protected files, ${result.checks.length} scene checks, 6 responsive poses, measured FPS, mono materials, 0 App errors`);
