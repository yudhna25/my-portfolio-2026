import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const json = async (file) => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));
const concurrent = await json('concurrent-changes.json');
for (const entry of await json('protected-files.json')) {
  const accepted = concurrent.find((change) => change.path === entry.path);
  if (accepted) {
    assert.equal(accepted.before, entry.hash);
    assert.ok(accepted.path.endsWith('src\\components\\About.jsx'), 'Known parallel parallax change only');
  }
  assert.equal(createHash('sha256').update(await readFile(entry.path)).digest('hex').toUpperCase(), accepted?.after ?? entry.hash, entry.path);
}
for (const { path, hash } of await json('verified-source.json')) {
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex').toUpperCase(), hash, 'Source changed: rerun Browser checks');
}
let total = 0;
const evidence = [];
for (const file of ['browser-live.json', 'browser-cards.json', 'browser-fps.json', 'browser-reduced.json', 'browser-final.json']) {
  const run = await json(file);
  assert.deepEqual(run.errors, [], file);
  assert.deepEqual(run.checks.filter((check) => !check.pass), [], file);
  total += run.checks.length;
  evidence.push(run);
}
const hovers = evidence.flatMap((run) => run.hovers);
for (const section of ['work','skills','experience','playground']) {
  assert.ok(hovers.some((hover) => hover.section === section && !hover.reduced && hover.scale === 1.05 && hover.y === -4 && hover.responseMs < 150), section);
}
assert.ok(hovers.some((hover) => hover.section === 'work' && hover.reduced && hover.scale === 1 && hover.y === 0));
assert.ok(hovers.some((hover) => hover.cta && !hover.reduced && hover.shadow.includes('50px')));
assert.ok(hovers.some((hover) => hover.cta && hover.reduced && hover.shadow.includes('30px') && hover.translate === 'none'));
assert.ok(evidence.flatMap((run) => run.fps).some((run) => run.fps > 120 && !run.hidden && run.maxMagnetic <= 8.01));
assert.ok(evidence.flatMap((run) => run.captures).some((capture) => capture.width === 390));
assert.ok(evidence.flatMap((run) => run.captures).some((capture) => capture.width === 768));
console.log(`PASS — ${total} saved Browser assertions; native hover, reduced motion, FPS and source hashes verified.`);
