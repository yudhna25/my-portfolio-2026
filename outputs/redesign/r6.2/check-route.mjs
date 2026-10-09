import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = 'outputs/redesign/r6.2';
const read = file => JSON.parse(fs.readFileSync(file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(`${dir}/${item.name}`) : [`${dir}/${item.name}`]);
const leaves = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => typeof item === 'object' ? leaves(item, `${prefix}${key}.`) : [`${prefix}${key}`]).sort();
const baseline = read(`${out}/baseline.json`), changed = [], preserved = [];
for (const [file, info] of Object.entries(baseline.files)) {
  assert(fs.existsSync(file), file);
  (hash(fs.readFileSync(file)) === info.sha256 ? preserved : changed).push(file);
}
assert.deepEqual(changed.sort(), ['src/App.jsx', 'src/3d/hooks/useScrollProgress.js', 'src/components/Work.jsx', 'src/components/layout/MenuOverlay.jsx', 'src/components/layout/Nav.jsx', 'src/components/pages/Edura.jsx', 'src/i18n/config.js', 'src/i18n/locales/en.json', 'src/i18n/locales/vi.json', 'vite.config.js'].sort());
const added = [...walk('src'), ...walk('public')].filter(file => !baseline.files[file]);
assert.deepEqual(added, ['src/stores/useRouteStore.js']);
assert.deepEqual(read('vercel.json').rewrites, [{ source: '/projects/edura', destination: '/index.html' }, { source: '/projects/edura/', destination: '/index.html' }]);
for (const lang of ['vi', 'en']) {
  const before = read(`${out}/before/src/i18n/locales/${lang}.json`), current = read(`src/i18n/locales/${lang}.json`);
  delete before.works.readerPending;
  delete current.edura.metaTitle; delete current.edura.metaDescription;
  assert.deepEqual(current, before, `${lang}: verified content preserved`);
}
assert.deepEqual(leaves(read('src/i18n/locales/vi.json')), leaves(read('src/i18n/locales/en.json')));
assert.equal(execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(), baseline.head);
assert.equal(hash(execFileSync('git', ['diff', '--cached', '--binary'], { maxBuffer: 64 * 1024 * 1024 })), baseline.stagedDiffHash);
const beforeAgents = fs.readFileSync(`${out}/before/agents-before.txt`, 'utf8'), agents = fs.readFileSync('AGENTS.md', 'utf8');
assert(agents.startsWith(beforeAgents));
const rows = agents.slice(beforeAgents.length).split(/\r?\n/).filter(Boolean);
assert(rows.length <= 1 && rows.every(row => row.startsWith('|') && row.includes('R6.2')));

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
let validation;
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173/projects/edura');
  await page.locator('[data-edura-reader]').waitFor();
  validation = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(item => item.name).filter(name => name.includes('/src/stores/useRouteStore.js')).at(-1);
    const { readMainSnapshot, useRouteStore, navigateRoute } = await import(url);
    const valid = { y: 400, width: 1440, height: 900, chapter: 'works', p: .4, scrollProgress: .7, selection: 'edura', pose: [1, 2, 3, 4, 5, 6], orbit: { phase: .8, origin: .3, velocity: 0, captures: 1, latched: true, visited: true, resumePending: false } };
    const results = [readMainSnapshot(valid) === valid];
    for (const patch of [{ y: -1 }, { width: 0 }, { chapter: 'unknown' }, { p: 1.1 }, { p: NaN }, { scrollProgress: Infinity }, { pose: [0] }, { selection: 'unknown' }, { orbit: { ...valid.orbit, phase: '1' } }, { orbit: { ...valid.orbit, latched: 1 } }]) results.push(readMainSnapshot({ ...valid, ...patch }) === null);
    const route = useRouteStore.getState(); route.sync(); results.push(useRouteStore.getState() === route);
    const initial = location.href, length = history.length;
    for (const patch of [{ button: 1 }, { button: 0, ctrlKey: true }, { button: 0, metaKey: true }, { button: 0, shiftKey: true }, { button: 0, altKey: true }, { button: 0, defaultPrevented: true }]) navigateRoute({ ...patch, preventDefault() { throw Error('Modified native click intercepted'); } }, '/#work');
    results.push(location.href === initial && history.length === length);
    return { results, cases: results.length };
  });
  assert(validation.results.every(Boolean));
} finally { await browser.close(); }
const result = { status: 'pass', checkedAt: new Date().toISOString(), validation, baselineFiles: Object.keys(baseline.files).length, preserved: preserved.length, changed, added: [...added, 'vercel.json'], agentsRowsAdded: rows.length, head: baseline.head, stagedDiffPreserved: true };
fs.writeFileSync(`${out}/integrity.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
