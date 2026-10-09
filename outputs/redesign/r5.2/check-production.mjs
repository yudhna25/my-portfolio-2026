import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Reuse the verified R2.3 numerical/real-store checker without editing its files.
// Only module resolution and its report destination change for this output task.
const reference = new URL('../r2.3/check-orbit.mjs', import.meta.url);
const destination = new URL('./check-production-results.json', import.meta.url);
let code = await readFile(reference, 'utf8');
code = code.replace(/from '([^']+)'/g, (match, path) => path.startsWith('.') ? `from '${new URL(path, reference).href}'` : match)
  .replace("new URL('../../../', import.meta.url)", `new URL('../../../', '${reference.href}')`)
  .replace("import.meta.resolve('zustand')", JSON.stringify(import.meta.resolve('zustand')))
  .replace("new URL('./check-results.json', import.meta.url)", `new URL('${destination.href}')`);

const rootURL = new URL('../../../', import.meta.url);
const work = await readFile(new URL('src/components/Work.jsx', rootURL), 'utf8');
const renderer = await readFile(new URL('src/3d/components/WorksConstellations.jsx', rootURL), 'utf8');
const domExpression = work.match(/const target = ([^;]+);/)?.[1];
const sceneExpression = renderer.match(/const selected = ([^;]+);/)?.[1];
assert(domExpression && sceneExpression, 'Actual DOM/renderer ownership expressions exist');
const dom = new Function('state', `const {worksSelection:selection,worksFocus:focus,worksHover:hover}=state;return (${domExpression});`);
const scene = new Function('state', `return (${sceneExpression});`);
let ownerCases = 0;
for (const selection of [null, 'edura', 'veris', 'vie']) for (const focus of [null, 'edura', 'veris', 'vie']) for (const hover of [null, 'edura', 'veris', 'vie']) {
  const state = { worksSelection: selection, worksFocus: focus, worksHover: hover };
  assert.equal(dom(state), scene(state), 'Preview ID and highlighted constellation must agree');
  ownerCases++;
}
const { PORTFOLIO_DATA } = await import(new URL('src/data.js', rootURL));
const ids = ['edura', 'veris', 'vie'], keys = ['eduraLms', 'verisApp', 'viePerfume'];
const expected = ['EDURA LMS', 'VERIS APP', 'VIE PERFUME'];
for (const locale of ['vi', 'en']) {
  const copy = JSON.parse(await readFile(new URL(`src/i18n/locales/${locale}.json`, rootURL), 'utf8')).works;
  for (const [i, key] of keys.entries()) {
    assert.equal(PORTFOLIO_DATA.projects[i].title, expected[i], 'Current data order maps to canonical project IDs');
    assert.equal(copy.projects[key].title, expected[i], 'DOM identity matches source constellation assignment');
    assert(copy.projects[key].previewAlt && copy.projects[key].category && copy.constellations[ids[i]], 'Preview has localized image/name/category/figure');
  }
  for (const key of ['selectLabel', 'interactionHint', 'readerPending', 'behanceReference', 'comingSoon', 'viewCaseStudy']) assert(copy[key], `Localized Works control ${key}`);
}
assert.equal(PORTFOLIO_DATA.projects[0].link, 'https://www.behance.net/gallery/241524417/Edura-LMS');
assert.equal(PORTFOLIO_DATA.projects[1].link, undefined);
assert.equal(PORTFOLIO_DATA.projects[2].link, undefined);
const baseline = JSON.parse(await readFile(new URL('./baseline.json', import.meta.url), 'utf8'));
const edited = new Set(['src/components/Work.jsx', 'src/3d/components/WorksConstellations.jsx', 'src/i18n/locales/vi.json', 'src/i18n/locales/en.json', 'src/components/ui/TargetLockReticle.jsx']);
let preserved = 0;
for (const [file, info] of Object.entries(baseline.files)) {
  if (edited.has(file)) continue;
  const bytes = await readFile(new URL(file, rootURL));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), info.sha256, `${file} stays outside R5.2 scope`);
  preserved++;
}
code = code.replace("report.status = 'pass';", `report.production = {ownerCases:${ownerCases}, preservedBaselineFiles:${preserved}, locales:2, projects:3, eduraReader:'pending R6.2'}; report.status = 'pass';`);
await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
