import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const json = path => JSON.parse(read(path));
for (const { path, sha256 } of json('./protected.json')) {
  assert.equal(createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex'), sha256, `${path}: 3D/stores/copy/tokens untouched`);
}
for (const file of ['browser-desktop.json', 'browser-mobile.json', 'browser-lifecycle.json', 'browser-reduced.json']) {
  const result = json(`./${file}`);
  assert(result.checks.length >= 20 && result.checks.every(check => check.pass), `${file}: all browser assertions`);
  assert.equal(result.errors.length, 0, result.errors.join('\n'));
  assert(result.poses.every(pose => pose.targets.length === 6 && pose.overflow <= 0 && pose.canvas === 1));
}
assert.equal(json('./console.json').filter(message => message.level === 'error').length, 0);
const oldLines = read('./agents-before.md').split(/\r?\n/).filter(line => line.trim());
const lines = read('../../AGENTS.md').split(/\r?\n/);
let cursor = 0;
for (const line of oldLines) {
  while (cursor < lines.length && lines[cursor] !== line) cursor++;
  assert(cursor++ < lines.length, 'existing AGENTS content preserved');
}
console.log('PASS: Browser speeds/scrub/reverse/layout/crop/motion/locale, console, protected files and AGENTS');
