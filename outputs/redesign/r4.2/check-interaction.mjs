import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const root = new URL('../../../', import.meta.url);
const file = path => new URL(path, root);
const { skillTools } = await import(file('src/data/skills.js'));
// Resolve Vite's two aliases for Node; execute the real store, not a copy.
const source = readFileSync(file('src/stores/useSkillsStore.js'), 'utf8')
  .replace("from 'zustand'", `from '${import.meta.resolve('zustand')}'`)
  .replace("from '@/data/skills'", `from '${file('src/data/skills.js').href}'`);
const { useSkillsStore: store, activeSkill } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const { interact, clear, setVisible } = store.getState();
const target = () => activeSkill(store.getState());

clear();
setVisible(true);
interact('hover', 'figma');
interact('selection', 'davinci-resolve');
interact('focus', 'ai');
assert.equal(target(), 'ai');
interact('hover', 'photoshop');
interact('hover', null);
assert.equal(target(), 'ai', 'pointer leave cannot clear keyboard ownership');
interact('focus', null);
assert.equal(target(), 'davinci-resolve');
interact('selection', null);
assert.equal(target(), null);
for (let i = 0; i < 30; i++) {
  const id = skillTools[i % skillTools.length].id;
  interact('selection', id);
  assert.equal(target(), id);
}
const stable = store.getState();
interact('selection', stable.selection);
interact('invalid-channel', 'figma');
interact('focus', 'unapproved-tool');
assert.equal(store.getState(), stable, 'duplicates and invalid inputs do not publish state');
clear();
assert.equal(target(), null);
assert.equal(store.getState().visible, true, 'input reset does not rewrite viewport ownership');
setVisible(false);
assert.equal(store.getState().visible, false);

const { storyCameraPath } = await import(file('src/3d/utils/cameraPath.js'));
for (const aspect of [320 / 844, 390 / 844, 768 / 900, 1440 / 900, 1920 / 1080]) {
  const about = storyCameraPath('about', 1, {}, false, aspect);
  assert.deepEqual(about, { x: 2, y: 5, z: -154, lookX: -36 * Math.min(1, 0.54 * Math.max(1, aspect)), lookY: -16, lookZ: -200, parallax: 0 });
  assert.deepEqual(storyCameraPath('skills', 0, {}, false, aspect), about);
  assert.deepEqual(storyCameraPath('skills', 1, {}, false, aspect), storyCameraPath('education', 0, {}, false, aspect));
  for (const chapter of ['skills', 'education']) {
    assert.deepEqual(storyCameraPath(chapter, 0.1, {}, true, aspect), storyCameraPath(chapter, 1, {}, false, aspect));
  }
}

const { hashes } = JSON.parse(readFileSync(new URL('./baseline.json', import.meta.url), 'utf8'));
for (const path of ['src/3d/components/SymbolStars.jsx', 'src/3d/utils/symbolMorph.js', 'src/3d/data/symbolTargets.json', 'src/3d/hooks/useSectionAnchor.js']) {
  assert.equal(createHash('sha256').update(readFileSync(file(path))).digest('hex'), hashes[path], `${path}: preserve R4.1 contract`);
}
console.log('PASS: input priority, 30 swaps, validation/reset; 5 camera aspects/reduced; R4.1 renderer and anchor hashes unchanged.');
