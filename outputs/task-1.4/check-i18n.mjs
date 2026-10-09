import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { getI18n } from 'react-i18next';
import { locales as expected } from './draft-locales.mjs';

const actual = {};
const sections = ['hero', 'about', 'works', 'skills', 'education', 'experience', 'playground', 'contact', 'nav', 'footer', 'preloader', 'common'];
function flatten(value, prefix = '', result = {}) {
  if (typeof value === 'string') result[prefix] = value;
  else {
    assert.ok(value && typeof value === 'object', prefix);
    for (const [key, child] of Object.entries(value)) {
      if (!Array.isArray(value)) assert.match(key, /^[a-z][a-zA-Z0-9]*$/, prefix + '.' + key);
      flatten(child, prefix ? `${prefix}.${key}` : key, result);
    }
  }
  return result;
}

for (const lang of ['vi', 'en']) {
  actual[lang] = JSON.parse(await readFile(new URL(`../../src/i18n/locales/${lang}.json`, import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(actual[lang]), sections);
  assert.deepEqual(actual[lang], expected[lang], `Every ${lang} value must equal its approved draft source`);
}
const leaves = { vi: flatten(actual.vi), en: flatten(actual.en) };
assert.deepEqual(Object.keys(leaves.vi), Object.keys(leaves.en), 'Identical string-leaf paths, including array lengths');
for (const lang of ['vi', 'en']) {
  for (const [key, value] of Object.entries(leaves[lang])) assert.ok(!/\[.*?\]/.test(value), `${lang}:${key} has a draft placeholder`);
  assert.equal(actual[lang].contact.linkedinUrl, '');
  assert.equal(actual[lang].contact.behanceUrl, '');
  assert.equal(actual[lang].skills.technicalLevel, '');
}

const hashes = {
  '../content-vi.md': '93621A2DE2F723B1A42A216328F88024CDC0A001699D5DBA020C1AD74859D307',
  '../content-en.md': 'BDB3F3C80FE2C00A69AAFB133FF6ADE7BF2EAA51D58424854181E07A7FC237A8',
  '../../src/stores/useLangStore.js': '4FEB341440E9997AA4DA41186138099408FD42D0797BC627671210491D533060',
};
for (const [path, hash] of Object.entries(hashes)) {
  assert.equal(createHash('sha256').update(await readFile(new URL(path, import.meta.url))).digest('hex').toUpperCase(), hash, `${path} unchanged`);
}
const entry = await readFile(new URL('../../src/main.jsx', import.meta.url), 'utf8');
assert.ok(entry.indexOf("import './i18n/config'") < entry.indexOf("import App from './App.jsx'"));

const server = await createServer({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  clearScreen: false,
});
try {
  const { i18n } = await server.ssrLoadModule('/src/i18n/config.js');
  const { useLangStore } = await server.ssrLoadModule('/src/stores/useLangStore.js');
  assert.equal(i18n.isInitialized, true);
  assert.equal(i18n.language, 'vi');
  assert.deepEqual(i18n.options.fallbackLng, ['en']); // i18next normalizes the string option.
  assert.equal(i18n.options.interpolation.escapeValue, false);
  assert.deepEqual(Object.keys(i18n.options.resources), ['vi', 'en']);
  assert.equal(getI18n(), i18n, 'initReactI18next exposes the same configured instance');
  for (const lang of ['en', 'vi']) {
    await i18n.changeLanguage(lang);
    for (const [key, value] of Object.entries(leaves[lang])) assert.equal(i18n.t(key), value, `${lang}:${key}`);
    assert.deepEqual(i18n.t('skills.tools', { returnObjects: true }), actual[lang].skills.tools);
  }
  const viHero = i18n.getResourceBundle('vi', 'translation').hero;
  const saved = viHero.subTagline;
  delete viHero.subTagline;
  try { assert.equal(i18n.t('hero.subTagline'), actual.en.hero.subTagline, 'Missing Vi entry falls back to En'); }
  finally { viHero.subTagline = saved; }

  const changes = [];
  const onChange = lang => changes.push(lang);
  i18n.on('languageChanged', onChange);
  for (let index = 0; index < 10; index += 1) {
    useLangStore.getState().setLang('en');
    assert.equal(i18n.language, 'en');
    assert.equal(i18n.t('nav.about'), actual.en.nav.about);
    useLangStore.getState().setLang('vi');
    assert.equal(i18n.language, 'vi');
    assert.equal(i18n.t('nav.about'), actual.vi.nav.about);
  }
  assert.equal(changes.length, 20, 'One languageChanged event per actual switch; no feedback loop');
  useLangStore.getState().setLang('vi');
  useLangStore.getState().setLang('invalid');
  assert.equal(changes.length, 20, 'No duplicate language change for the same/invalid store value');
  await i18n.changeLanguage('en');
  assert.equal(useLangStore.getState().lang, 'vi', 'Direct i18n call does not write back to Zustand');
  useLangStore.getState().setLang('vi');
  assert.equal(i18n.language, 'vi', 'The store can reassert its language after a direct debug call');
  i18n.off('languageChanged', onChange);

  const result = {
    languages: ['vi', 'en'],
    sections: sections.length,
    stringLeavesPerLocale: Object.keys(leaves.vi).length,
    keyParity: true,
    draftContentExact: true,
    unchangedDraftsAndLangStore: true,
    defaultLanguage: i18n.language,
    fallbackLanguage: i18n.options.fallbackLng[0],
    defaultTagline: i18n.t('hero.tagline'),
    defaultSubTagline: i18n.t('hero.subTagline'),
    storeSwitchesWithoutLoop: 20,
  };
  await writeFile(new URL('./checks.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} finally {
  await server.close();
}
