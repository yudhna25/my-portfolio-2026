import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = path.join(root, 'outputs/redesign/r4.3');
const read = file => fs.readFileSync(path.join(root, file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const baseline = JSON.parse(fs.readFileSync(path.join(out, 'baseline.json')));
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const allowed = new Set(['src/components/Education.jsx','src/App.jsx','src/3d/components/SkillsSymbols.jsx','src/3d/utils/cameraPath.js','src/3d/hooks/useScrollProgress.js','src/i18n/locales/vi.json','src/i18n/locales/en.json']);
const changed = [], preserved = [], after = {};
const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(`${directory}/${item.name}`) : [`${directory}/${item.name}`]);

for (const [file, previous] of Object.entries(baseline.files)) {
  const bytes = read(file);
  after[file] = { sha256: hash(bytes), bytes: bytes.length };
  if (after[file].sha256 === previous.sha256) preserved.push(file);
  else {
    assert.ok(allowed.has(file), `Unexpected baseline file change: ${file}`);
    changed.push(file);
  }
}

const newFiles = [...walk('src'), ...walk('public')].filter(file => !Object.hasOwn(baseline.files, file));
assert.deepEqual(newFiles.sort(), ['src/data/education.js','src/stores/useEducationStore.js'].sort(), 'Only Education mapping/store added');
assert.equal(hash(git('diff', '--cached', '--binary')), baseline.stagedDiffHash, 'Existing staged changes preserved');
assert.equal(git('rev-parse', 'HEAD').toString().trim(), baseline.head, 'HEAD preserved');

for (const lang of ['vi', 'en']) {
  const before = JSON.parse(read(`outputs/redesign/r4.3/before/src/i18n/locales/${lang}.json`));
  const current = JSON.parse(read(`src/i18n/locales/${lang}.json`));
  assert.deepEqual(current.education.institutions, before.education.institutions, 'Approved institutional copy unchanged');
  for (const key of ['mapNote','interactionHint','clearSelection','constellations']) { assert.ok(current.education[key]); delete current.education[key]; }
  assert.deepEqual(current,before,lang+': only Education interaction keys added');
}

const agents = read('AGENTS.md'), previousAgents = read('outputs/redesign/r4.3/before/agents-before.txt');
assert.ok(agents.subarray(0, previousAgents.length).equals(previousAgents), 'AGENTS original byte prefix preserved');
const progressLines = agents.subarray(previousAgents.length).toString('utf8').split(/\r?\n/).filter(line => line.trim());
assert.ok(progressLines.length <= 1, 'At most one task progress row appended');
if (progressLines.length) assert.match(progressLines[0], /^\|.*R4\.3.*\|$/, 'Only the R4.3 progress row may be appended');

const result = {
  checkedAt: new Date().toISOString(), baselineCapturedAt: baseline.capturedAt,
  changed, preserved, added: newFiles.map(path => ({path,sha256:hash(read(path))})),
  stagedDiffUnchanged: true, headUnchanged: true, agentsPrefixPreserved: true,
  agentsAddedBytes: agents.length - previousAgents.length, agentsAppendedRows: progressLines.length,
  localeNewKeysOnly: ['education.mapNote','education.interactionHint','education.clearSelection','education.constellations'], after,
};
fs.writeFileSync(path.join(out, 'integrity-results.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ status: 'PASS', changed: changed.length, preserved: preserved.length, added: newFiles, stagedDiffUnchanged: true, agentsAppendedRows: progressLines.length }));
