import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from '@babel/parser';
import { createInstance } from 'i18next';
import { locales as approved } from '../task-1.4/draft-locales.mjs';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const resources = {};
const leaves = {};
const emptyAllowed = {
  translation: ['skills.technicalLevel', 'contact.linkedinUrl', 'contact.behanceUrl', 'footer.websiteUrl'],
  lab: ['end.line2'], scene: [],
};
// Reuse task 1.4's string-leaf check, allowing reviewed Phase 2 additions.
function flatten(value, prefix = '', result = {}) {
  if (typeof value === 'string') result[prefix] = value;
  else {
    assert.ok(value && typeof value === 'object', prefix);
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, result);
  }
  return result;
}
const tokens = text => (text.match(/{{[^}]+}}/g) ?? []).sort();
const get = (value, key) => key.split('.').reduce((parent, part) => parent?.[part], value);
const shape = value => typeof value === 'string' ? 'string' : Array.isArray(value)
  ? value.map(shape) : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]));
for (const lang of ['vi', 'en']) {
  resources[lang] = {}; leaves[lang] = {};
  for (const ns of ['translation', 'lab', 'scene']) {
    const path = ns === 'translation' ? `${lang}.json` : `${lang}/${ns}.json`;
    resources[lang][ns] = JSON.parse(await read(`src/i18n/locales/${path}`));
    leaves[lang][ns] = flatten(resources[lang][ns]);
    const empty = Object.entries(leaves[lang][ns]).filter(([, text]) => !text).map(([key]) => key).sort();
    const allowed = [...emptyAllowed[ns], ...(lang === 'en' && ns === 'translation' ? ['common.profile.englishName'] : [])].sort();
    assert.deepEqual(empty, allowed, `${lang}/${ns}: reviewed empty values only`);
    for (const text of Object.values(leaves[lang][ns])) assert.ok(!/\[.*?\]/.test(text), 'No draft placeholders in UI');
  }
  for (const [key, text] of Object.entries(flatten(approved[lang]))) {
    assert.equal(leaves[lang].translation[key], text, `${lang}:${key}: approved draft unchanged`);
  }
}
for (const ns of ['translation', 'lab', 'scene']) {
  assert.deepEqual(shape(resources.vi[ns]), shape(resources.en[ns]), `${ns}: object/array types`);
  assert.deepEqual(Object.keys(leaves.vi[ns]).sort(), Object.keys(leaves.en[ns]).sort(), `${ns}: leaf/array parity`);
  for (const key of Object.keys(leaves.vi[ns])) {
    assert.deepEqual(tokens(leaves.vi[ns][key]), tokens(leaves.en[ns][key]), `${ns}:${key}: interpolation`);
    assert.ok(!/lỗ\s+đen/iu.test(leaves.vi[ns][key]), `${ns}:${key}: use HỐ ĐEN`);
  }
}
const i18n = createInstance();
await i18n.init({ lng: 'vi', fallbackLng: 'en', supportedLngs: ['vi', 'en'], resources, interpolation: { escapeValue: false } });
for (const lang of ['en', 'vi']) {
  await i18n.changeLanguage(lang);
  for (const ns of Object.keys(resources[lang])) {
    for (const [key, value] of Object.entries(leaves[lang][ns])) {
      const options = { lng: lang, ns, version: '3.15', value: 165 };
      const expected = value.replace('{{version}}', '3.15').replace('{{value}}', '165');
      assert.equal(i18n.t(key, options), expected, `${lang}/${ns}:${key}: resolves without fallback/key leak`);
    }
  }
}

async function sourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(new URL(directory, root), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await sourceFiles(path));
    else if (/\.(js|jsx)$/.test(path) && path !== 'src/data.js') files.push(path);
  }
  return files;
}
function walk(node, callback, parent) {
  if (!node || typeof node !== 'object') return;
  if (node.type) callback(node, parent);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'start', 'end', 'comments', 'tokens'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach(child => walk(child, callback, node));
    else if (value && typeof value === 'object') walk(value, callback, node);
  }
}
function displayLiterals(node) {
  if (!node) return [];
  if (node.type === 'JSXExpressionContainer') return displayLiterals(node.expression);
  if (node.type === 'StringLiteral') return [node.value];
  if (node.type === 'TemplateLiteral' && !node.expressions.length) return [node.quasis[0].value.cooked];
  if (node.type === 'ConditionalExpression') return [...displayLiterals(node.consequent), ...displayLiterals(node.alternate)];
  if (node.type === 'LogicalExpression') return displayLiterals(node.right);
  if (node.type === 'ArrayExpression') return node.elements.flatMap(displayLiterals);
  return [];
}
const hardcoded = [], literalCalls = [], dynamicCalls = [];
const files = await sourceFiles('src');
for (const file of files) {
  const source = await read(file);
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const ns = source.match(/useTranslation\(['"](lab|scene)['"]\)/)?.[1] ?? 'translation';
  const record = (node, values) => values.filter(value => /\p{L}/u.test(value)).forEach(text => hardcoded.push({ file, line: node.loc.start.line, text: text.trim() }));
  walk(ast, (node, parent) => {
    if (node.type === 'JSXText') record(node, [node.value]);
    if (node.type === 'JSXExpressionContainer' && parent?.type !== 'JSXAttribute') record(node, displayLiterals(node.expression));
    if (node.type === 'JSXAttribute' && /^(aria-label|aria-description|alt|title|placeholder|label|text)$/.test(node.name.name)) record(node, displayLiterals(node.value));
    if (node.type === 'AssignmentExpression' && ['textContent', 'innerText', 'innerHTML', 'title'].includes(node.left.property?.name)) record(node, displayLiterals(node.right));
    if (node.type !== 'CallExpression' || node.callee.type !== 'Identifier' || node.callee.name !== 't') return;
    const key = node.arguments[0];
    const call = { file, line: node.loc.start.line, ns, expression: source.slice(key.start, key.end) };
    if (key.type === 'StringLiteral') {
      for (const lang of ['vi', 'en']) assert.notEqual(get(resources[lang][ns], key.value), undefined, `${file}:${call.line}: ${lang}/${ns}:${key.value}`);
      literalCalls.push(call);
    } else dynamicCalls.push(call); // Runtime families are reviewed in i18n-audit.md and Browser.
  });
}
assert.deepEqual(hardcoded, [], 'No hardcoded visible JSX/DOM copy outside data.js legacy');
const legacyCopy = [];
walk(parse(await read('outputs/task-2.14/before/Footer.jsx'), { sourceType: 'module', plugins: ['jsx'] }), node => {
  if (node.type === 'JSXText' && /\p{L}/u.test(node.value)) legacyCopy.push(node.value.trim());
  if (node.type === 'JSXAttribute' && /^(aria-label|alt|title|placeholder)$/.test(node.name.name)) {
    legacyCopy.push(...displayLiterals(node.value).filter(text => /\p{L}/u.test(text)));
  }
});
assert.equal(legacyCopy.length, 8, 'Detector catches the eight original Footer literals');
const protectedHashes = JSON.parse(await read('outputs/task-2.14/protected-hashes.before.json'));
for (const { Path, Hash } of protectedHashes) {
  const data = await readFile(Path);
  assert.equal(createHash('sha256').update(data).digest('hex').toUpperCase(), Hash, `${Path}: untouched`);
}
let browserCopyChecks = 0;
let snapshots = [];
try { snapshots = JSON.parse(await read('outputs/task-2.14/browser.json')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const sectionNamespaces = { hero: 'hero', about: 'about', work: 'works', skills: 'skills', education: 'education', experience: 'experience', playground: 'playground', transmission: 'contact' };
const normalize = text => String(text ?? '').replace(/\s/g, '');
for (const snapshot of snapshots) {
  assert.ok(['vi', 'en'].includes(snapshot.lang), 'html lang follows selection');
  assert.equal(snapshot.sections.length, 8);
  assert.equal(snapshot.canvasCount, 1);
  const copy = resources[snapshot.lang].translation;
  for (const section of snapshot.sections) {
    assert.equal(section.horizontalOverflow, false, `${snapshot.lang}/${section.id}: no overflow`);
    const body = normalize(section.text + section.heading + section.attributes.join('') + (section.id === 'work' ? snapshot.cursor : ''));
    for (const [key, text] of Object.entries(flatten(copy[sectionNamespaces[section.id]]))) {
      if (!text || key.endsWith('Url') || (section.id === 'transmission' && /^(linkedin|behance)Label$/.test(key))) continue;
      assert.ok(body.includes(normalize(text)), `${snapshot.lang}/${section.id}:${key}: Browser DOM copy`);
      browserCopyChecks++;
    }
  }
  assert.equal(snapshot.footer.heading, copy.contact.heading, 'Footer SplitText does not restore previous locale');
  for (const key of ['copyright', 'disciplines', 'buildCredit']) {
    assert.ok(normalize(snapshot.footer.text).includes(normalize(copy.footer[key].replace('{{version}}', '3.15'))));
    browserCopyChecks++;
  }
  assert.deepEqual(snapshot.marquees, Object.values(copy.common.marquees));
  assert.ok(snapshot.footer.pending.every(link => link.href === null), 'No placeholder # links');
}
const result = {
  parity: '100%', namespaces: Object.fromEntries(Object.keys(leaves.vi).map(ns => [ns, Object.keys(leaves.vi[ns]).length])),
  approvedLeavesPerLocale: Object.keys(flatten(approved.vi)).length,
  approvedDraftsAndProtectedSourceUnchanged: true, interpolationParity: true,
  filesScanned: files.length, hardcodedVisibleCopy: hardcoded, originalDetectorFindings: legacyCopy.length,
  browserSavedSnapshots: snapshots.length, browserCopyChecks,
  literalCalls, dynamicCalls, emptyValues: Object.fromEntries(['vi', 'en'].map(lang => [lang, Object.fromEntries(Object.entries(leaves[lang]).map(([ns, values]) => [ns, Object.keys(values).filter(key => !values[key])]))])),
};
await writeFile(new URL('./checks.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ ...result, literalCalls: literalCalls.length, dynamicCalls: dynamicCalls.length }, null, 2));
