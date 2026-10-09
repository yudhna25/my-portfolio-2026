import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const out = 'outputs/visual-revision-2026-10-09/v3';
const hash = path => createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const app = JSON.parse(fs.readFileSync(`${out}/browser-results.json`));
const lab = JSON.parse(fs.readFileSync(`${out}/browser-lab-results.json`));
assert.equal(app.status, 'PASS'); assert.equal(lab.status, 'PASS');
assert.deepEqual(app.sourceBefore, app.sourceAfter);
assert.deepEqual(app.sourceAfter, lab.sourceAfter);
for (const [path, expected] of Object.entries(app.sourceAfter)) assert.equal(hash(path), expected, `Source drift: ${path}`);
const frames = [...app.configurations, ...lab.configurations].flatMap(config => config.frames);
const fallback = app.scenarios.filter(item => item.file).map(item => ({file:item.file}));
const images = [...new Set([...frames,...fallback].map(frame => frame.file))].map(path => ({path,sha256:hash(path),bytes:fs.statSync(path).size}));
assert.equal(frames.length, 116); assert.equal(images.length, 118);
const listing = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(item => item.isDirectory() ? listing(`${dir}/${item.name}`) : [`${dir}/${item.name}`]);
const dist = listing('dist').map(path => ({path,sha256:hash(path)}));
fs.writeFileSync(`${out}/final-evidence.json`, JSON.stringify({status:'PASS', finalizedAt:new Date().toISOString(),
  source:app.sourceAfter, appFrames:100, appComparisons:61, labFrames:16, labComparisons:8,
  images, dist, buildLogSha256:hash(`${out}/build.log`), lintLogSha256:hash(`${out}/lint.log`),
  gate:'G1 pending human visual approval', limits:app.limits},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',sourceFiles:Object.keys(app.sourceAfter).length,images:images.length,distFiles:dist.length}));
