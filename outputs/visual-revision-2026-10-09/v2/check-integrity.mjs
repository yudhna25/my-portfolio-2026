import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const out='outputs/visual-revision-2026-10-09/v2';
const baseline=JSON.parse(fs.readFileSync(`${out}/source-baseline.json`,'utf8').replace(/^\uFEFF/,''));
const owned=['src/3d/components/BlackHole.jsx','src/3d/components/BlackHoleSystem.jsx','src/3d/components/BlackHoleBloomMask.jsx','src/3d/shaders/blackHole.js','src/3d/quality.js'];
const concurrent=['src/components/Hero.jsx','src/components/effects/PortalHeading.jsx'];
const hash=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const entries=baseline.map(({path,sha256})=>{
  path=path.replaceAll('\\','/');const after=hash(path);
  const status=after===sha256.toLowerCase()?'unchanged':owned.includes(path)?'V2':concurrent.includes(path)?'concurrent V1':'unexpected';
  assert.notEqual(status,'unexpected',path);return {path,before:sha256.toLowerCase(),after,status};
});
const browser=JSON.parse(fs.readFileSync(`${out}/browser-results.json`,'utf8'));
assert.equal(browser.status,'PASS');
owned.forEach(path=>{assert.equal(browser.sourceBefore[path],hash(path));assert.equal(browser.sourceAfter[path],hash(path));});
fs.writeFileSync(`${out}/integrity-results.json`,JSON.stringify({status:'PASS',entries,owned,concurrent,limits:['V1 source changes are allowed by ownership; no claim of an integrated visual gate.','New V4 assets are absent from the initial baseline; no V2 writes to those paths.']},null,2));
console.log(JSON.stringify({files:entries.length,unchanged:entries.filter(e=>e.status==='unchanged').length,V2:entries.filter(e=>e.status==='V2').map(e=>e.path),concurrent:entries.filter(e=>e.status==='concurrent V1').map(e=>e.path)}));
