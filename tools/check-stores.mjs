import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { useThemeStore } from '../src/stores/useThemeStore.js';
import { useLangStore } from '../src/stores/useLangStore.js';
import { useLoadingStore } from '../src/stores/useLoadingStore.js';

// Run with: node tools/check-stores.mjs
// Reuse the real store; only resolve Vite aliases for this Node self-check.
const scrollCode = readFileSync(new URL('../src/stores/useScrollStore.js', import.meta.url), 'utf8')
  .replace("from 'zustand'", `from '${import.meta.resolve('zustand')}'`)
  .replace(/from '@\/3d\/utils\/([^']+)'/g, (_, path) => `from '${new URL(`../src/3d/utils/${path}.js`, import.meta.url).href}'`);
const { useScrollStore } = await import(`data:text/javascript;base64,${Buffer.from(scrollCode).toString('base64')}`);
const scroll = useScrollStore.getState();
assert.equal(scroll.scrollProgress, 0);
assert.equal(scroll.currentSection, 'hero');
scroll.setProgress(0.4);
assert.equal(useScrollStore.getState().scrollProgress, 0.4);
scroll.setProgress(-0.1);
assert.equal(useScrollStore.getState().scrollProgress, 0);
scroll.setProgress(1.1);
assert.equal(useScrollStore.getState().scrollProgress, 1);
scroll.setProgress(NaN);
scroll.setProgress(Infinity);
assert.equal(useScrollStore.getState().scrollProgress, 1);
scroll.setCurrentSection('about');
assert.equal(useScrollStore.getState().currentSection, 'about');

const theme = useThemeStore.getState();
assert.equal(theme.theme, 'dark');
theme.applyTheme(); // Safe outside a browser, with no document global.
const element = () => {
  const classes = new Set(['light']);
  const el = { dataset: { theme: 'light' }, setAttribute: (name, value) => { assert.equal(name, 'data-theme'); el.dataset.theme = value; },
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) } };
  return el;
};
const meta = { content: '#FAFAFA' };
const doc = { documentElement: element(), body: element(), querySelector: () => meta };
const saved = new Map([['stellar-theme', 'light'], ['stellar-audio', 'keep'], ['stellar-lang', 'en']]);
globalThis.document = doc;
globalThis.window = { localStorage: { setItem: (key, value) => saved.set(key, value) } };
try {
  const bootstrap = readFileSync(new URL('../public/theme-init.js', import.meta.url), 'utf8');
  runInNewContext(bootstrap, { document, window });
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(saved.get('stellar-theme'), 'dark');
  assert.equal(meta.content, '#050505');
  // The retained store must also recover a legacy light DOM without altering consent/language.
  document.documentElement.dataset.theme = 'light';
  useThemeStore.setState({ theme: 'light' });
  theme.applyTheme();
  assert.equal(document.documentElement.dataset.theme, 'dark');
  assert.equal(useThemeStore.getState().theme, 'dark');
  assert(document.body.classList.contains('dark'));
  assert(!document.body.classList.contains('light'));
  assert.equal(saved.get('stellar-audio'), 'keep');
  assert.equal(saved.get('stellar-lang'), 'en');
  window.localStorage.setItem = () => { throw new Error('Storage unavailable'); };
  runInNewContext(bootstrap, { document, window });
  theme.applyTheme();
  assert.equal(meta.content, '#050505');
  runInNewContext(bootstrap, { document: { documentElement: element(), querySelector: () => null }, window });
} finally {
  delete globalThis.document;
  delete globalThis.window;
}

const lang = useLangStore.getState();
assert.equal(lang.lang, 'vi');
lang.setLang('en');
lang.setLang('invalid');
assert.equal(useLangStore.getState().lang, 'en');

const loading = useLoadingStore.getState();
assert.equal(loading.isLoading, true); // Other domains never alter loading.
loading.setLoading(false);
assert.equal(useLoadingStore.getState().isLoading, false);
assert.equal(useLoadingStore.getState().setLoading, loading.setLoading);

console.log('PASS: store defaults, progress bounds, fixed-dark bootstrap/store, blocked storage, consent/language preservation and loading isolation.');
