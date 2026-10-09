import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInstance } from 'i18next';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const resources = {};
const leaves = {};

function flatten(value, prefix = '', result = {}) {
  if (typeof value === 'string') {
    result[prefix] = value;
  } else if (Array.isArray(value)) {
    result[prefix] = value;
    value.forEach((item, index) => {
      if (typeof item === 'string') {
        result[`${prefix}.${index}`] = item;
      } else {
        flatten(item, `${prefix}.${index}`, result);
      }
    });
  } else {
    assert.ok(value && typeof value === 'object', prefix);
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, result);
    }
  }
  return result;
}

const getTokens = (text) => (typeof text === 'string' ? (text.match(/\{\{[^}]+\}\}/g) ?? []).sort() : []);

const shape = (value) =>
  typeof value === 'string'
    ? 'string'
    : Array.isArray(value)
      ? value.map(shape)
      : Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]));

console.log('--- 1. PARSING & CHECKING LOCALE FILES ---');
for (const lang of ['vi', 'en']) {
  resources[lang] = {};
  leaves[lang] = {};
  for (const ns of ['translation', 'lab', 'scene']) {
    const path = ns === 'translation' ? `${lang}.json` : `${lang}/${ns}.json`;
    const content = await read(`src/i18n/locales/${path}`);
    resources[lang][ns] = JSON.parse(content);
    leaves[lang][ns] = flatten(resources[lang][ns]);

    // Check no raw placeholders like [ ... ]
    for (const [key, text] of Object.entries(leaves[lang][ns])) {
      if (typeof text === 'string') {
        assert.ok(!/\[\s*.*?\s*\]/.test(text), `Found draft bracket placeholder at ${lang}/${ns}:${key} -> "${text}"`);
      }
    }
  }
}
console.log('✓ All 6 locale JSON files parsed and validated successfully (0 syntax errors, 0 bracket placeholders).');

console.log('\n--- 2. VERIFYING PARITY ACROSS ALL NAMESPACES ---');
for (const ns of ['translation', 'lab', 'scene']) {
  assert.deepEqual(shape(resources.vi[ns]), shape(resources.en[ns]), `${ns}: object/array types must match`);
  
  const viKeys = Object.keys(leaves.vi[ns]).sort();
  const enKeys = Object.keys(leaves.en[ns]).sort();
  assert.deepEqual(viKeys, enKeys, `${ns}: leaf key parity mismatch`);
  console.log(`✓ Namespace '${ns}': ${viKeys.length} leaves match 100% between Vi and En.`);

  for (const key of viKeys) {
    const viVal = leaves.vi[ns][key];
    const enVal = leaves.en[ns][key];
    if (typeof viVal === 'string') {
      assert.deepEqual(getTokens(viVal), getTokens(enVal), `${ns}:${key}: interpolation tokens must match`);
      assert.ok(!/lỗ\s+đen/iu.test(viVal), `${ns}:${key}: must use 'hố đen', never 'lỗ đen'`);
    }
  }
}
console.log("✓ Interpolation tokens and 'HỐ ĐEN' glossary verified across all keys.");

console.log('\n--- 3. VERIFYING 6 COPY POLISHES & CONTENT PLACEHOLDERS ---');
const viTrans = leaves.vi.translation;
const enTrans = leaves.en.translation;

// 1. Saigon University
assert.ok(
  enTrans['education.institutions.saigonUniversity.description'].includes('Graduated with High Honors'),
  'Saigon University description in EN must use natural academic honors phrasing'
);
console.log('✓ 1. saigonUniversity.description (EN):', enTrans['education.institutions.saigonUniversity.description']);

// 2. Arena Multimedia description
assert.ok(
  enTrans['education.institutions.arenaMultimedia.description'].startsWith('Awarded Distinction in Semester 2'),
  'Arena Multimedia description in EN must use natural distinction award phrasing'
);
console.log('✓ 2. arenaMultimedia.description (EN):', enTrans['education.institutions.arenaMultimedia.description']);

// 3. Arena Multimedia degree unified
assert.equal(
  viTrans['education.institutions.arenaMultimedia.degree'],
  'Advanced Diploma in Multimedia',
  'Arena Multimedia degree in VI must be unified to Advanced Diploma in Multimedia'
);
assert.equal(
  enTrans['education.institutions.arenaMultimedia.degree'],
  'Advanced Diploma in Multimedia',
  'Arena Multimedia degree in EN must match VI'
);
console.log('✓ 3. arenaMultimedia.degree unified in both:', viTrans['education.institutions.arenaMultimedia.degree']);

// 4. Designveloper description
assert.ok(
  enTrans['experience.positions.designveloper.description'].endsWith('Handed off designs to development teams.'),
  'Designveloper description in EN must end with "Handed off designs to development teams."'
);
assert.ok(
  viTrans['experience.positions.designveloper.description'].endsWith('Bàn giao thiết kế cho đội ngũ phát triển.'),
  'Designveloper description in VI must end with "Bàn giao thiết kế cho đội ngũ phát triển."'
);
console.log('✓ 4. designveloper.description polished in both Vi and En.');

// 5. Veris App present tense
assert.ok(
  enTrans['works.projects.verisApp.description'].includes('Redefines the feed algorithm interface'),
  'Veris App description in EN must use present tense (Redefines)'
);
console.log('✓ 5. verisApp.description (EN):', enTrans['works.projects.verisApp.description']);

// 6. Marquee collaboration parity
assert.equal(
  enTrans['common.marquees.collaboration'],
  'Collaboration • Vision • Creativity • Success',
  'Marquee collaboration in EN must match 4-word cadence'
);
assert.equal(
  viTrans['common.marquees.collaboration'],
  'Hợp tác • Tầm nhìn • Sáng tạo • Thành công',
  'Marquee collaboration in VI'
);
console.log('✓ 6. common.marquees.collaboration words synced:', enTrans['common.marquees.collaboration']);

// 7. Technical level placeholder filled tastefully
assert.equal(viTrans['skills.technicalLevel'], 'Nền tảng & Ứng dụng');
assert.equal(enTrans['skills.technicalLevel'], 'Foundational & Applied');
console.log('✓ 7. skills.technicalLevel non-empty:', viTrans['skills.technicalLevel'], '<->', enTrans['skills.technicalLevel']);

console.log('\n--- 4. SIMULATING I18NEXT RUNTIME RESOLUTION ---');
const i18n = createInstance();
await i18n.init({
  lng: 'vi',
  fallbackLng: 'en',
  supportedLngs: ['vi', 'en'],
  resources,
  interpolation: { escapeValue: false },
});

const allowedEmpty = new Set([
  'contact.linkedinUrl',
  'contact.behanceUrl',
  'footer.websiteUrl',
  'end.line2',
]);

for (const lang of ['vi', 'en']) {
  await i18n.changeLanguage(lang);
  for (const ns of ['translation', 'lab', 'scene']) {
    for (const [key, value] of Object.entries(leaves[lang][ns])) {
      if (typeof value === 'string') {
        const options = { lng: lang, ns, version: '3.15', value: 165, count: 24, author: 'Awwwards' };
        const resolved = i18n.t(key, options);
        if (allowedEmpty.has(key) || (lang === 'en' && key === 'common.profile.englishName')) {
          assert.equal(resolved, '', `Key ${key} in ${lang} should resolve to empty string`);
        } else {
          assert.ok(resolved && !resolved.startsWith(key), `Key ${key} in ${lang}/${ns} failed to resolve: "${resolved}"`);
        }
      }
    }
  }
}
console.log('✓ i18next runtime resolution verified across all leaf keys in both languages with 0 leakage!');

console.log('\n========================================');
console.log('🎉 TASK 4.16 i18n CHECK PASSED 100%! 🎉');
console.log('========================================');
