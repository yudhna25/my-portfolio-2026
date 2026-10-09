import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const bootstrap = readFileSync('public/theme-init.js', 'utf8');
const results = [];
function environment({ saved = null, osLight = false, readFails = false, writeFails = false, mediaMissing = false } = {}) {
  let stored = saved;
  const root = { dataset: {}, setAttribute(name, value) { if (name === 'data-theme') this.dataset.theme = value; }, removeAttribute(name) { if (name === 'data-theme') delete this.dataset.theme; } };
  let meta = { content: '#050505' };
  const document = { documentElement: root, querySelector: () => meta, createElement: () => ({}), head: { append(value) { meta = value; } } };
  const window = { localStorage: { getItem() { if (readFails) throw new Error('blocked'); return stored; }, setItem(key, value) { assert.equal(key, 'stellar-theme'); if (writeFails) throw new Error('blocked'); stored = value; } }, matchMedia: mediaMissing ? undefined : () => ({ matches: osLight }) };
  return { document, window, get stored() { return stored; }, get meta() { return meta; }, removeMeta() { meta = null; } };
}
for (const [name, options, expected] of [
  ['OS light on first visit', { osLight: true }, 'light'],
  ['OS dark on first visit', {}, 'dark'],
  ['No OS preference defaults dark', { mediaMissing: true }, 'dark'],
  ['Saved dark overrides light OS', { saved: 'dark', osLight: true }, 'dark'],
  ['Saved light overrides dark OS', { saved: 'light' }, 'light'],
  ['Invalid preference follows OS', { saved: 'invalid', osLight: true }, 'light'],
  ['Blocked storage still follows OS', { readFails: true, osLight: true }, 'light'],
]) {
  const env = environment(options);
  runInNewContext(bootstrap, env);
  const actual = env.document.documentElement.dataset.theme ?? 'dark';
  assert.equal(actual, expected);
  assert.equal(env.meta.content, expected === 'light' ? '#FAFAFA' : '#050505');
  assert.equal(env.stored, options.saved ?? null, 'OS initialization must not save a manual choice');
  results.push({ name, passed: true });
}
const env = environment({ osLight: true });
runInNewContext(bootstrap, env);
globalThis.document = env.document; globalThis.window = env.window;
const { useThemeStore } = await import('../../src/stores/useThemeStore.js');
assert.equal(useThemeStore.getState().theme, 'light');
useThemeStore.getState().toggleTheme();
assert.equal(useThemeStore.getState().theme, 'dark');
assert.equal(env.document.documentElement.dataset.theme, undefined);
assert.equal(env.meta.content, '#050505'); assert.equal(env.stored, 'dark');
results.push({ name: 'Store starts with bootstrap, toggle applies DOM/meta/storage', passed: true });
useThemeStore.getState().setTheme('light');
assert.equal(env.stored, 'light'); assert.equal(env.meta.content, '#FAFAFA');
useThemeStore.getState().setTheme('invalid');
assert.equal(useThemeStore.getState().theme, 'light'); assert.equal(env.stored, 'light');
results.push({ name: 'setTheme validates values and applies immediately', passed: true });
env.removeMeta(); useThemeStore.getState().applyTheme();
assert.equal(env.meta.name, 'theme-color'); assert.equal(env.meta.content, '#FAFAFA');
results.push({ name: 'applyTheme recreates missing meta', passed: true });
const blocked = environment({ writeFails: true });
globalThis.document = blocked.document; globalThis.window = blocked.window;
useThemeStore.getState().setTheme('dark');
assert.equal(useThemeStore.getState().theme, 'dark'); assert.equal(blocked.meta.content, '#050505');
results.push({ name: 'Blocked persistence does not break toggle', passed: true });
delete globalThis.document; delete globalThis.window;
const { useThemeStore: serverStore } = await import('../../src/stores/useThemeStore.js?server');
assert.equal(serverStore.getState().theme, 'dark'); serverStore.getState().toggleTheme();
assert.equal(serverStore.getState().theme, 'light');
results.push({ name: 'SSR has dark default and actions do not throw', passed: true });
const index = readFileSync('index.html', 'utf8');
assert(index.indexOf('/theme-init.js') < index.indexOf('/src/index.css'));
assert(index.indexOf('/src/index.css') < index.indexOf('/src/main.jsx'));
assert(!readFileSync('src/main.jsx', 'utf8').includes("import './index.css'"));
results.push({ name: 'Theme bootstrap and blocking CSS precede React module', passed: true });
const vi = JSON.parse(readFileSync('src/i18n/locales/vi.json', 'utf8'));
const en = JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8'));
assert.deepEqual(Object.keys(vi.common.theme), Object.keys(en.common.theme));
assert.equal(vi.common.theme.toLight, 'Chuyển chế độ sáng'); assert.equal(vi.common.theme.toDark, 'Chuyển chế độ tối');
results.push({ name: 'Toggle labels have Vi/En key parity', passed: true });
writeFileSync('outputs/task-1.9/check-results.json', JSON.stringify(results, null, 2));
console.log(`${results.length}/${results.length} checks passed`);
