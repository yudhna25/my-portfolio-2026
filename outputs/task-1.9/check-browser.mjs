import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const samples = JSON.parse(readFileSync('outputs/task-1.9/browser-results.json', 'utf8'));
for (const { name, state } of samples) {
  const light = state.storeTheme === 'light';
  assert.equal(state.attribute, light ? 'light' : null, name);
  assert.equal(state.meta, light ? '#FAFAFA' : '#050505', name);
  assert.equal(state.body.background, light ? 'rgb(250, 250, 250)' : 'rgb(5, 5, 5)', name);
  assert.equal(state.body.color, light ? 'rgb(17, 17, 17)' : 'rgb(250, 250, 250)', name);
  assert(state.body.contrast >= 4.5 && state.button.textContrast >= 4.5 && state.button.borderContrast >= 3, name);
  assert(state.button.outsideWrapper, name);
}
const sample = name => samples.find(entry => entry.name === name).state;
for (const [name, expected] of [
  ['first visit OS dark','dark'], ['saved light refresh overrides OS dark','light'],
  ['saved light correct at first paint','light'], ['saved dark correct at first paint over light OS','dark'],
  ['first visit OS light after clearing storage','light'], ['no OS preference defaults dark','dark'],
]) {
  const state = sample(name); assert.equal(state.initial.theme, expected, name);
  if (name.includes('first paint')) {
    assert(state.paints.some(paint => paint.name === 'first-contentful-paint'), name);
    assert(state.paints.every(paint => paint.background === (expected === 'light' ? 'rgb(250, 250, 250)' : 'rgb(5, 5, 5)')), name);
  }
}
const enter = sample('keyboard Enter toggles without reload'), space = sample('keyboard Space toggles without reload');
assert.equal(enter.navigation, space.navigation); assert.equal(enter.storeTheme,'dark'); assert.equal(space.storeTheme,'light');
assert.equal(sample('English toggle label').button.label,'Switch to light mode');
const focus = JSON.parse(readFileSync('outputs/task-1.9/focus-final.json','utf8'));
assert(focus.focusVisible); assert(focus.outline.includes('2px')); assert(focus.shadow.includes('0px 0px 0px 2px'));
const preview = JSON.parse(readFileSync('outputs/task-1.9/preview-refresh.json','utf8'));
assert.equal(preview.meta,'#050505'); assert.equal(preview.attribute,null); assert.equal(preview.label,'Chuyển chế độ sáng');
writeFileSync('outputs/task-1.9/browser-check-summary.json',JSON.stringify({snapshots:samples.length,passed:true,firstPaintBothModes:true,keyboard:true,contrast:true,productionRefresh:true},null,2));
console.log(`${samples.length} Browser snapshots + keyboard/first paint/preview checks passed`);
