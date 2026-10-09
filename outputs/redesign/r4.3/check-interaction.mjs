import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../../../', import.meta.url), file = path => new URL(path, root);
const { educationInstitutions } = await import(file('src/data/education.js'));
const source = readFileSync(file('src/stores/useEducationStore.js'), 'utf8')
  .replace("from 'zustand'", `from '${import.meta.resolve('zustand')}'`)
  .replace("from '@/data/education'", `from '${file('src/data/education.js').href}'`);
const { useEducationStore: store, activeEducation } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const { interact, clear, setVisible } = store.getState();
const target = () => activeEducation(store.getState());
clear(); setVisible(true);
interact('hover', 'saigonUniversity'); interact('selection', 'greenAcademy'); interact('focus', 'arenaMultimedia');
interact('hover', 'greenAcademy');
assert.equal(target(), 'arenaMultimedia'); assert.equal(store.getState().anchorId, 'arenaMultimedia', 'Lower priority hover cannot steal the focused anchor');
interact('focus', null); assert.equal(target(), 'greenAcademy'); assert.equal(store.getState().anchorId, 'greenAcademy');
interact('selection', null); assert.equal(target(), 'greenAcademy'); interact('hover', null);
assert.equal(target(), null); assert.equal(store.getState().anchorId, 'greenAcademy', 'Return stays at last anchor');
for (let i = 0; i < 30; i++) { const id = educationInstitutions[i % 3].id; interact('selection', id); assert.equal(target(), id); assert.equal(store.getState().anchorId, id); }
const stable = store.getState(); interact('selection', stable.selection); interact('camera', 'saigonUniversity'); interact('focus', 'Sagittarius');
assert.equal(store.getState(), stable, 'Reject duplicates/unknown input'); clear(); assert.equal(target(), null); assert.equal(store.getState().visible, true); setVisible(false);
const { storyCameraPath } = await import(file('src/3d/utils/cameraPath.js'));
for (const aspect of [320/844,390/844,768/900,1440/900,1920/900]) {
  assert.deepEqual(storyCameraPath('skills', 1, {}, false, aspect), storyCameraPath('education', 0, {}, false, aspect));
  assert.deepEqual(storyCameraPath('education', 1, {}, false, aspect), storyCameraPath('experience', 0, {}, false, aspect));
  assert.deepEqual(storyCameraPath('education', .2, {}, true, aspect), storyCameraPath('education', 1, {}, false, aspect));
  const reuse = {}; for (const progress of [-1,0,.1,.25,.5,.75,1,2,NaN]) { assert.equal(storyCameraPath('education',progress,reuse,false,aspect),reuse); assert.ok(Object.values(reuse).every(Number.isFinite)); assert.ok(Math.hypot(reuse.x,reuse.y,reuse.z+200)>1); }
}
const result = { status:'PASS', checkedAt:new Date().toISOString(), swaps:30, cameraAspects:5, oneActive:true, anchorPriority:true, baseReturnAnchor:true, outsideHorizon:true };
writeFileSync(new URL('./interaction-check-results.json',import.meta.url),JSON.stringify(result,null,2)); console.log(JSON.stringify(result));
