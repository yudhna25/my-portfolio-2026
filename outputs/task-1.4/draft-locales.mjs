import { readFile } from 'node:fs/promises';

// Fixed source lines keep this task's approved copy auditable. No translation
// is generated here: extract only content, removing Markdown delimiters.
const drafts = Object.fromEntries(await Promise.all(['vi', 'en'].map(async lang => [
  lang,
  (await readFile(new URL(`../content-${lang}.md`, import.meta.url), 'utf8')).split(/\r?\n/),
])));
export const locales = { vi: {}, en: {} };
export const sourceMap = {};

const clean = text => text.trim().replace(/^\*\*(.*)\*\*$/, '$1').replace(/^`(.*)`$/, '$1').replace(/^"(.*)"$/, '$1');
const field = line => clean(line.slice(line.indexOf(': ') + 2));
const quoted = line => line.match(/"(.*?)"/)[1];
const bold = line => line.match(/\*\*(.*?)\*\*/)[1];
const code = line => line.match(/`(.*?)`/)[1];
const sectionTitle = quoted;
const bullet = line => clean(line.replace(/^- /, ''));
const list = line => line.split(' · ').map(clean);
const fieldList = line => list(field(line));
const heading = line => line.replace(/^### (?:\d+\. )?/, '');
const title = line => heading(line).split(' — ')[0];
const period = line => heading(line).split(' — ')[1];

function assign(object, key, value) {
  const parts = key.split('.');
  let parent = object;
  for (const part of parts.slice(0, -1)) parent = parent[part] ??= {};
  parent[parts.at(-1)] = value;
}

function add(key, viLine, enLine, extract = field) {
  sourceMap[key] = { vi: viLine, en: enLine };
  for (const lang of ['vi', 'en']) {
    const lineNumber = lang === 'vi' ? viLine : enLine;
    assign(locales[lang], key, lineNumber === null ? '' : extract(drafts[lang][lineNumber - 1]));
  }
}

add('hero.name', 23, 22);
add('hero.tagline', 24, 23, code);
add('hero.subTagline', 25, 24);
add('hero.scrollIndicator', 26, 25);

add('about.sectionLabel', 39, 30, sectionTitle);
add('about.heading', 40, 31, bold);
add('about.subLabel', 41, 32);
add('about.bioFirst', 43, 34, quoted);
add('about.bioSecond', 44, 35, quoted);
add('about.quote', 45, 36);
add('about.photoCaption', 46, 37);
add('about.toolsLabel', 47, 38);
add('about.skillsLabel', 48, 39);

add('works.sectionLabel', 50, 41, sectionTitle);
add('works.heading', 51, 42);
['all', 'productDesign', 'uxUi', 'graphic'].forEach((key, index) => {
  add(`works.filters.${key}`, 52, 43, line => fieldList(line)[index]);
});
add('works.cursorCta', 53, 44);
for (const [key, viLine, enLine] of [['eduraLms', 55, 46], ['verisApp', 61, 52], ['viePerfume', 66, 57]]) {
  const prefix = `works.projects.${key}`;
  add(`${prefix}.title`, viLine, enLine, title);
  add(`${prefix}.category`, viLine + 1, enLine + 1);
  add(`${prefix}.description`, viLine + 2, enLine + 2);
  add(`${prefix}.tags`, viLine + 3, enLine + 3, fieldList);
  if (key === 'eduraLms') add(`${prefix}.linkUrl`, 59, 50, line => field(line).replace(/ ✅$/, ''));
  else add(`${prefix}.caseStudyLabel`, viLine, enLine, quoted);
}

add('skills.heading', 71, 62, sectionTitle);
add('skills.toolsLabel', 72, 63, heading);
add('skills.tools', 73, 64, list);
add('skills.competenciesLabel', 75, 66, heading);
add('skills.competencies', 76, 67, list);
add('skills.technicalLabel', 78, 69, line => heading(line).split(' (')[0]);
add('skills.technicalLevel', 78, 69, () => '');
add('skills.technical', 79, 70, list);

add('education.heading', 81, 72, sectionTitle);
for (const [key, viLine, enLine] of [['saigonUniversity', 82, 73], ['arenaMultimedia', 86, 77], ['greenAcademy', 90, 81]]) {
  const prefix = `education.institutions.${key}`;
  add(`${prefix}.name`, viLine, enLine, title);
  add(`${prefix}.period`, viLine, enLine, period);
  add(`${prefix}.degree`, viLine + 1, enLine + 1, bullet);
  add(`${prefix}.description`, viLine + 2, enLine + 2, bullet);
}

add('experience.heading', 94, 85, sectionTitle);
for (const [key, viLine, enLine] of [['hosanaMedia', 95, 86], ['upwork', 98, 89], ['designveloper', 101, 92]]) {
  const prefix = `experience.positions.${key}`;
  add(`${prefix}.company`, viLine, enLine, title);
  ['role', 'period', 'type'].forEach((part, index) => {
    add(`${prefix}.${part}`, viLine, enLine, line => period(line).split(' · ')[index]);
  });
  add(`${prefix}.description`, viLine + 1, enLine + 1, bullet);
}

add('playground.heading', 104, 95, sectionTitle);
['starfieldExplorer', 'nebulaShaderPlayground', 'scrollProgressOrbit', 'magneticField', 'textScrambleLab', 'constellationGrid', 'wormholeTunnel', 'marqueeGenerator'].forEach((key, index) => {
  add(`playground.experiments.${key}.title`, 107 + index, 98 + index, line => line.split('|')[2].trim());
  add(`playground.experiments.${key}.type`, 107 + index, 98 + index, line => line.split('|')[3].trim());
});

add('contact.sectionLabel', 116, 107, sectionTitle);
add('contact.heading', 117, 108, bold);
add('contact.alternateHeading', 117, 108, quoted);
add('contact.subHeading', 118, 109);
add('contact.emailCta', 119, 110, code);
add('contact.email', 12, 11);
add('contact.emailUrl', 119, 110, line => line.split(' → ')[1]);
add('contact.phone', 13, 12);
add('contact.facebookUrl', 14, 13);
add('contact.linkedinUrl', 15, 14, () => '');
add('contact.behanceUrl', 16, 15, () => '');
['facebook', 'linkedin', 'behance'].forEach((key, index) => {
  add(`contact.${key}Label`, 120, 111, line => fieldList(line)[index].split(' `')[0]);
});

['about', 'works', 'skills', 'education', 'experience', 'playground', 'contact'].forEach((key, index) => {
  const viLabel = drafts.vi[30 + index].split('|')[2].trim();
  const enLabel = list(drafts.en[27])[index];
  sourceMap[`nav.${key}`] = { vi: 31 + index, en: 28 };
  assign(locales.vi, `nav.${key}`, viLabel);
  assign(locales.en, `nav.${key}`, enLabel);
});

add('footer.copyright', 121, 112);
add('preloader.counterLabel', 19, 18, quoted);
add('preloader.counterRange', 19, 18, line => line.split(' → ')[1]);
add('preloader.minimalLabel', 20, 19);
add('common.profile.displayName', 9, 9);
add('common.profile.englishName', 10, null);
add('common.profile.role', 11, 10, bold);
add('common.profile.disciplines', 11, 10, line => line.match(/\((.*?)\)/)[1]);
['design', 'projects', 'collaboration'].forEach((key, index) => {
  add(`common.marquees.${key}`, 124 + index, 115 + index, quoted);
});
