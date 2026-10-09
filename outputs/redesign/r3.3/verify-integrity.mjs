import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const out = path.join(root, 'outputs/redesign/r3.3');
const read = file => fs.readFileSync(path.join(root, file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const baseline = JSON.parse(fs.readFileSync(path.join(out, 'baseline.json')));
const git = (...args) => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const allowed = new Set(['src/components/About.jsx', 'src/i18n/locales/vi.json', 'src/i18n/locales/en.json', 'src/3d/utils/cameraPath.js', 'src/3d/hooks/useScrollProgress.js']);
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
assert.deepEqual(newFiles, ['public/avatar-cutout.webp'], 'Only the prepared cutout may be added to source/public');
const manifest = JSON.parse(read('outputs/redesign/r0.2/assets-manifest.json'));
const portrait = manifest.assets.find(asset => asset.id === 'avatar-cutout').files.find(file => file.role === 'web');
const cutout = read('public/avatar-cutout.webp');
assert.equal(portrait.sha256, '6b2fea6dcbd2bd204fc0aa6c545cbe7a696670fc4532c992378c3393d53b511f');
assert.equal(hash(cutout), portrait.sha256, 'Integrated cutout is the exact R0.2 web asset');
assert.equal(hash(read(portrait.path)), portrait.sha256, 'R0.2 web asset remains unchanged');
assert.equal(cutout.length, portrait.bytes);
assert.equal(cutout.subarray(0, 4).toString(), 'RIFF');
assert.equal(cutout.subarray(8, 12).toString(), 'WEBP');
assert.equal(hash(git('diff', '--cached', '--binary')), baseline.stagedDiffHash, 'Existing staged changes preserved');
assert.equal(git('rev-parse', 'HEAD').toString().trim(), baseline.head, 'HEAD preserved');

for (const lang of ['vi', 'en']) {
  const before = JSON.parse(read(`outputs/redesign/r3.3/before/src/i18n/locales/${lang}.json`));
  const current = JSON.parse(read(`src/i18n/locales/${lang}.json`));
  for (const key of ['portraitToggle', 'portraitHint']) {
    assert.ok(!Object.hasOwn(before.about, key), `${key} is a new portrait key`);
    assert.ok(typeof current.about[key] === 'string' && current.about[key].trim(), `${lang}.${key} has real translated content`);
    delete current.about[key];
  }
  assert.deepEqual(current, before, `${lang}: only two portrait UI keys added; all approved copy, tools and skills preserved`);
}

const agents = read('AGENTS.md'), previousAgents = read('outputs/redesign/r3.3/before/agents-before.txt');
assert.ok(agents.subarray(0, previousAgents.length).equals(previousAgents), 'AGENTS original byte prefix preserved');
const progressLines = agents.subarray(previousAgents.length).toString('utf8').split(/\r?\n/).filter(line => line.trim());
assert.ok(progressLines.length <= 1, 'At most one task progress row appended');
if (progressLines.length) assert.match(progressLines[0], /^\|.*R3\.3.*\|$/, 'Only the R3.3 progress row may be appended');

const result = {
  checkedAt: new Date().toISOString(), baselineCapturedAt: baseline.capturedAt,
  changed, preserved, added: [{ path: 'public/avatar-cutout.webp', sha256: hash(cutout), bytes: cutout.length }],
  stagedDiffUnchanged: true, headUnchanged: true, agentsPrefixPreserved: true,
  agentsAddedBytes: agents.length - previousAgents.length, agentsAppendedRows: progressLines.length,
  localeNewKeysOnly: ['about.portraitToggle', 'about.portraitHint'], after,
};
fs.writeFileSync(path.join(out, 'integrity-results.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ status: 'PASS', changed: changed.length, preserved: preserved.length, added: newFiles, stagedDiffUnchanged: true, agentsAppendedRows: progressLines.length }));
