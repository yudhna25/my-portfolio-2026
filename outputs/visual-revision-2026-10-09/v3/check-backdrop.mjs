import assert from 'node:assert/strict';
import fs from 'node:fs';
import { portalState } from '../../../src/3d/utils/portal.js';

const root = new URL('../../../', import.meta.url);
let checks = 0;
for (const file of ['StarField', 'Nebula']) {
  const source = fs.readFileSync(new URL(`src/3d/components/${file}.jsx`, root), 'utf8');
  const shaders = [...source.matchAll(/const \w+_(?:VERT|FRAG) = \/\* glsl \*\/ `([\s\S]*?)`;/g)].map(match => match[1]);
  assert.equal(shaders.length, 2); checks++;
  const uniforms = new Set([...source.matchAll(/\b(u\w+): \{ value:/g)].map(match => match[1]));
  for (const shader of shaders) for (const [, name] of shader.matchAll(/uniform \w+ (u\w+);/g)) {
    assert(uniforms.has(name), `${file}: missing ${name}`); checks++;
  }
  const vertexVaryings = new Map([...shaders[0].matchAll(/varying (\w+) (v\w+);/g)].map(match => [match[2], match[1]]));
  for (const [, type, name] of shaders[1].matchAll(/varying (\w+) (v\w+);/g)) {
    assert.equal(vertexVaryings.get(name), type, `${file}: varying ${name}`); checks++;
  }
  assert(!/new\s|setState\(|\.map\(|\.slice\(/.test(source.slice(source.indexOf('useFrame('), source.indexOf('  return (')))); checks++;
}
const phase = {};
for (const p of [0, .25, .44, .47, .5, .7, .94, 1]) {
  portalState(p, phase);
  for (const key of ['intake', 'eject', 'center']) {
    assert(Number.isFinite(phase[key]) && phase[key] >= 0 && phase[key] <= 1); checks++;
  }
}
portalState(0, phase);
assert.equal(phase.intake, 0); assert.equal(phase.center, 0); checks += 2;
portalState(1, phase);
assert.equal(phase.eject, 1); checks++;
console.log(JSON.stringify({ status: 'PASS', checks, scope: 'Shader interface + backdrop phase assumptions; GPU compile/render remains Browser verification.' }));
