import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { skillTools, appliedSkills, commonSkills, technicalSkills } from '../../../src/data/skills.js';

const root = new URL('../../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const locales = ['vi', 'en'].map(lang => JSON.parse(read(`src/i18n/locales/${lang}.json`)));
const expected = {
  figma: ['wireframing', 'prototyping', 'designThinking'],
  photoshop: ['imageEditing', 'compositing'],
  illustrator: ['vectorDesign', 'brandingPackaging'],
  'after-effects': ['motionGraphics', 'vfx'],
  'premiere-pro': ['videoEditing'],
  'davinci-resolve': ['videoEditing'],
  ai: ['aiAssistedDesign'],
};
const toolIds = Object.keys(expected);
const abilityIds = [...new Set(Object.values(expected).flat())];
const symbolIds = JSON.parse(read('src/3d/utils/symbolMorph.js')
  .match(/export const SYMBOL_TOOL_IDS = (\[[^;]+\]);/)[1].replaceAll("'", '"'));
const leaves = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => {
  const path = `${prefix}${key}`;
  return item && typeof item === 'object' ? leaves(item, `${path}.`) : [path];
});

assert.deepEqual(skillTools.map(tool => tool.id), toolIds);
assert.deepEqual(toolIds, symbolIds);
assert.deepEqual(Object.fromEntries(skillTools.map(tool => [tool.id, tool.competencies])), expected);
assert.ok(skillTools.every(tool => Object.keys(tool).length === 2 && tool.competencies.length <= 3));
assert.deepEqual(appliedSkills, abilityIds);
assert.equal(appliedSkills.length, 11);
assert.deepEqual(commonSkills, ['teamwork', 'projectManagement', 'timeManagement', 'adaptability', 'attentionToDetail']);
assert.deepEqual(technicalSkills, ['web', 'react']);
assert.deepEqual(leaves(locales[0]).sort(), leaves(locales[1]).sort());

for (const { skills } of locales) {
  assert.deepEqual(Object.keys(skills.toolNames), toolIds);
  assert.deepEqual(Object.keys(skills.abilityNames), [...abilityIds, ...commonSkills]);
  assert.deepEqual(Object.keys(skills.technicalNames), technicalSkills);
  assert.ok(leaves(skills).every(key => {
    const value = key.split('.').reduce((current, part) => current[part], skills);
    return typeof value === 'string' && value.trim().length > 0;
  }));
  assert.ok(skills.activeTool.includes('{{tool}}'));
  assert.equal(skills.aiMembers, 'ChatGPT · Claude · Antigravity');
  for (const key of ['tools', 'competencies', 'technical', 'pauseOrbit', 'technicalLevel']) {
    assert.ok(!Object.hasOwn(skills, key), `Legacy skills.${key} remains`);
  }
  assert.ok(!/color\s*grading|proficien|thành thạo|%/i.test(JSON.stringify(skills)));
}
assert.equal(locales[0].skills.technicalNames.web, 'HTML/CSS/JS cơ bản');
assert.equal(locales[1].skills.technicalNames.web, 'Basic HTML/CSS/JS');
assert.equal(locales[0].skills.technicalNames.react, 'React (đang học)');
assert.equal(locales[1].skills.technicalNames.react, 'React (learning)');

const result = {
  status: 'PASS', checkedAt: new Date().toISOString(),
  tools: toolIds.length, appliedSkills: appliedSkills.length,
  commonSkills: commonSkills.length, technicalSkills: technicalSkills.length,
  maxBranches: Math.max(...skillTools.map(tool => tool.competencies.length)),
  skillsLeavesPerLocale: leaves(locales[0].skills).length,
  allLocaleLeaves: leaves(locales[0]).length,
  mapping: expected, localeParity: true, reactLearning: true, noGradingOrProficiency: true,
};
writeFileSync(new URL('content-check.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
