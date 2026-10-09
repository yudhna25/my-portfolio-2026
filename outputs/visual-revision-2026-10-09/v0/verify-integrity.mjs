import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const dir = 'outputs/visual-revision-2026-10-09/v0';
const baseline = JSON.parse(fs.readFileSync(`${dir}/baseline.json`, 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const changes = [];
for (const entry of baseline.inventory) {
  if (!fs.existsSync(entry.path)) { changes.push({path:entry.path,reason:'missing'}); continue; }
  const bytes = fs.readFileSync(entry.path);
  if (entry.path === 'AGENTS.md') {
    assert.equal(sha(bytes.subarray(0,entry.bytes)),entry.sha256,'AGENTS existing bytes changed');
    const tail = bytes.subarray(entry.bytes).toString('utf8');
    const rows = tail.split(/\r?\n/).filter(line=>line.trim());
    assert(rows.length <= 1 && rows.every(line=>line.startsWith('| 09/10/2026 | V0 — Baseline và contract chỉnh visual |')), 'Unexpected progress mutation');
  } else if (sha(bytes) !== entry.sha256) changes.push({path:entry.path,reason:'hash changed'});
}
const walk = directory => fs.existsSync(directory) ? fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(`${directory}/${entry.name}`):entry.isFile()?[`${directory}/${entry.name}`]:[]) : [];
const added = ['src','public','tools/codex-skills','outputs/redesign/r0.2/logos/mono'].flatMap(walk).filter(file=>!baseline.inventory.some(entry=>entry.path===file));
assert.deepEqual(changes,[],'Protected input changed');
assert.deepEqual(added,[],'New application/asset/skill file outside V0');
for (const name of ['baseline.json','ownership.md','contract.md','verification.md','handoff.md']) {
  assert(fs.statSync(`${dir}/${name}`).size > 0);
  if (name.endsWith('.md')) {
    const text = fs.readFileSync(`${dir}/${name}`,'utf8');
    assert(!/[A-Z]:[\\/]/.test(text), `${name}: nonportable authored path`);
    for (const match of text.matchAll(/\]\((screenshots\/[^)]+)\)/g)) assert(fs.existsSync(`${dir}/${match[1]}`),`Missing image ${match[1]}`);
  }
}
const report = JSON.parse(fs.readFileSync(`${dir}/browser-results.json`,'utf8'));
assert.equal(report.status,'captured');
assert.equal(report.frames.length,34);
assert.equal(report.comparisons.length,10);
assert(report.comparisons.every(item=>item.poseEqual && item.activeUniformsEqual && item.readingGateEqual));
assert.equal(report.errors.length,0);
for (const frame of baseline.browser.frames) assert.equal(sha(fs.readFileSync(frame.file)),frame.sha256);
const result = {checkedAt:new Date().toISOString(),status:'PASS',inventoryFiles:baseline.inventory.length,immutableFiles:baseline.inventory.length-1,protectedChanges:changes,addedProtectedFiles:added,agentsPrefixPreserved:true,frames:34,reversePairs:10,
  gitStatus:execFileSync('git',['status','--short'],{encoding:'utf8'}).trimEnd(), headUnchanged:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()===baseline.git.head};
fs.writeFileSync(`${dir}/integrity-results.json`,JSON.stringify(result,null,2)+'\n');
baseline.checks.scope = {status:'PASS',immutableFiles:result.immutableFiles,agentsPrefixPreserved:true,report:`${dir}/integrity-results.json`};
fs.writeFileSync(`${dir}/baseline.json`,JSON.stringify(baseline,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
