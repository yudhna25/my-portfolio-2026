import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const json = async (name) => JSON.parse(await readFile(new URL(name, import.meta.url), 'utf8'));
for (const { path, hash } of [...await json('protected-files.json'), ...await json('verified-source.json')]) {
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex').toUpperCase(), hash, `Verified file: ${path}`);
}
const evidence = await json('browser-results.json');
assert.ok(evidence.checks.length >= 80, 'Run the Browser lifecycle checks');
assert.deepEqual(evidence.checks.filter((check) => !check.pass), [], 'Browser assertions');
assert.deepEqual(evidence.errors, [], 'Application console/runtime errors');
assert.ok(evidence.layouts.some((layout) => layout.reduced), 'Live reduced-motion coverage');
assert.ok(evidence.layouts.some((layout) => layout.language === 'en'), 'English coverage');
const responsive = await json('browser-responsive.json');
assert.deepEqual(responsive.checks.filter((check) => !check.pass), [], 'Responsive assertions');
for (const width of [320, 768, 1440, 1920]) {
  assert.ok(responsive.layouts.some((layout) => layout.width === width), `Viewport ${width}`);
}
const reduced = await json('browser-reduced.json');
assert.deepEqual(reduced.checks.filter((check) => !check.pass), [], 'Fresh reduced-motion assertions');
assert.ok(reduced.loader.every((sample) => !sample.scramble), 'No scramble under reduced motion');
assert.equal(reduced.layouts[0].reduced, true);
const menu = await json('browser-menu.json');
assert.deepEqual(menu.filter((check) => !check.pass), [], 'Menu keyboard/language/reduced checks');
console.log(`PASS — ${evidence.checks.length + responsive.checks.length + reduced.checks.length} Browser checks; protected files unchanged.`);
