import fs from 'node:fs';
const source=fs.readFileSync('outputs/redesign/r3.3/verify-integrity.mjs','utf8');
let text=source.replaceAll('outputs/redesign/r3.3','outputs/redesign/r4.3');
text=text.replace(/const allowed = new Set\(.*?\);/,`const allowed = new Set(['src/components/Education.jsx','src/App.jsx','src/3d/components/SkillsSymbols.jsx','src/3d/utils/cameraPath.js','src/i18n/locales/vi.json','src/i18n/locales/en.json']);`);
const start=text.indexOf("assert.deepEqual(newFiles"),end=text.indexOf("assert.equal(hash(git('diff'",start);
text=text.slice(0,start)+`assert.deepEqual(newFiles.sort(), ['src/data/education.js','src/stores/useEducationStore.js'].sort(), 'Only Education mapping/store added');\n`+text.slice(end);
const a=text.indexOf("  for (const key of ['portraitToggle'"),b=text.indexOf('\n}',a);
text=text.slice(0,a)+`  assert.deepEqual(current.education.institutions, before.education.institutions, 'Approved institutional copy unchanged');
  for (const key of ['mapNote','interactionHint','clearSelection','constellations']) { assert.ok(current.education[key]); delete current.education[key]; }
  assert.deepEqual(current,before,lang+': only Education interaction keys added');`+text.slice(b);
text=text.replaceAll('R3\\.3','R4\\.3').replaceAll('R3.3','R4.3');
text=text.replace(/added: \[\{ path: 'public\/avatar-cutout.webp'.*?\}\],/,'added: newFiles.map(path => ({path,sha256:hash(read(path))})),');
text=text.replace("localeNewKeysOnly: ['about.portraitToggle', 'about.portraitHint']", "localeNewKeysOnly: ['education.mapNote','education.interactionHint','education.clearSelection','education.constellations']");
fs.writeFileSync('outputs/redesign/r4.3/verify-integrity.mjs',text);
