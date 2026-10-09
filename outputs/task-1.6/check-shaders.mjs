import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { QUALITY } from '../../src/3d/quality.js';
import { buildStarGeometry } from '../../src/3d/utils/buildStarGeometry.js';

const prototype = readFileSync('src/3d-lab.jsx', 'utf8');
assert.equal(createHash('sha256').update(prototype).digest('hex'), 'c1ee729eb315a4c95c7b97c7a9dd0c7b4e8c1fdff0c60ebca31619a7c62e8f4d');
const shader = (source, name) => source.match(new RegExp('const ' + name + ' = /\\* glsl \\*/ `[\\s\\S]*?`;'))[0];
for (const [file, names] of Object.entries({ StarField: ['STAR_VERT', 'STAR_FRAG'], Nebula: ['NEBULA_VERT', 'NEBULA_FRAG'], BlackHole: [] })) {
  const source = readFileSync('src/3d/components/' + file + '.jsx', 'utf8');
  for (const name of names) assert.equal(shader(source, name), shader(prototype, name));
  const frame = source.match(/useFrame\([\s\S]*?\n  \}\);/)[0];
  assert.doesNotMatch(frame, /\bnew\b|Math\.random|\.map\(|setState|setInterval|setTimeout/);
}
const tiers = {};
for (const [tier, count] of Object.entries(QUALITY)) {
  const geometry = buildStarGeometry(count);
  const { position, aSize, aSeed } = geometry.attributes;
  assert.equal(position.count, count);
  assert.equal(aSize.count, count);
  assert.equal(aSeed.count, count);
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    assert.ok(Math.abs(position.getX(i)) <= 34);
    assert.ok(Math.abs(position.getY(i)) <= 20);
    const z = position.getZ(i);
    assert.ok(z >= -300 && z <= 130);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    assert.ok(aSize.getX(i) >= 0.6 && aSize.getX(i) <= 3.4);
    assert.ok(aSeed.getX(i) >= 0 && aSeed.getX(i) <= 1);
  }
  assert.ok(minZ < -290 && maxZ > 120);
  let disposed = false;
  geometry.addEventListener('dispose', () => { disposed = true; });
  geometry.dispose();
  assert.ok(disposed);
  tiers[tier] = { count, minZ, maxZ, bufferBytes: position.array.byteLength + aSize.array.byteLength + aSeed.array.byteLength };
}
const report = { prototypeUnchanged: true, fourStarAndNebulaShaderStringsExactlyPreserved: true, noFrameAllocationsInProductionCallbacks: true, tiers };
writeFileSync('outputs/task-1.6/static-checks.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
