import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { worksBounds, worksStage, worksFigure, placeWorksPreview, createWorksOrbit, syncWorksOrbit, advanceWorksOrbit } from '../../../src/3d/utils/worksOrbit.js';

const data = JSON.parse(fs.readFileSync('src/3d/data/worksConstellations.json'));
const art = JSON.parse(fs.readFileSync('outputs/visual-revision-2026-10-09/v4/works-artwork.json'));
const bounds = data.constellations.map(worksBounds);
const rows = [];
for (const [width, height] of [[390,844],[768,1024],[1440,900],[1920,1080]]) {
  const stage = worksStage(width, height, bounds);
  const basis = { ...stage, hole: { x: 0, y: 0, z: -50 } };
  for (const phase of [0,.5,1.5,3,4.5,6]) {
    const boxes = bounds.map((b,i) => {
      const angle = phase + i * Math.PI * 2 / 3;
      const [cx, cy] = stage.centers[i];
      return { id: ['edura','veris','vie'][i], left: cx + Math.sin(angle)*stage.drift + b.left*stage.scale,
        right: cx + Math.sin(angle)*stage.drift + b.right*stage.scale,
        top: cy - Math.cos(angle)*stage.drift - b.top*stage.scale,
        bottom: cy - Math.cos(angle)*stage.drift - b.bottom*stage.scale };
    });
    for (const b of boxes) assert(b.left >= 0 && b.right <= width && b.top >= 132 && b.bottom <= height - 16, JSON.stringify({width, b}));
    for (let i=0;i<3;i++) for(let j=i+1;j<3;j++) assert(boxes[i].right <= boxes[j].left || boxes[j].right <= boxes[i].left || boxes[i].bottom <= boxes[j].top || boxes[j].bottom <= boxes[i].top, `overlap ${width} ${i}/${j}`);
    const layout = {width,height,figures:boxes};
    for (const box of boxes) {
      const pw = width < 1024 ? width - 32 : 320, ph = width < 1024 ? 192 : 340;
      const p=placeWorksPreview(layout,box.id,pw,ph,{});
      assert(p.x >= 0 && p.x+pw <= width && p.y>=0 && p.y+ph <= height);
      assert(p.x+pw <= box.left || box.right <= p.x || p.y+ph <= box.top || box.bottom <= p.y, `panel overlaps selected ${width} ${box.id}`);
    }
    const before = [0,1,2].map(i=>({...worksFigure(.25,phase,i,basis,{})}));
    worksFigure(.8,phase,0,basis,{});
    const after = [0,1,2].map(i=>({...worksFigure(.25,phase,i,basis,{})}));
    assert.deepEqual(before,after);
    assert.equal(worksFigure(.44,phase,0,basis,{}).scale,0);
  }
  rows.push({width,height,scalePx:stage.scale,relativeScale:stage.scale/Math.min(width*.15,height*.13)});
}
const orbit = createWorksOrbit(.7);
syncWorksOrbit(orbit,'works',.5);
for(let i=0;i<120;i++)advanceWorksOrbit(orbit,1/60,false,false,true);
const origin=orbit.phase;
syncWorksOrbit(orbit,'finale',.00001);
for(const p of [.4,.2,.7,.1,0,.6]) { syncWorksOrbit(orbit,'finale',p);advanceWorksOrbit(orbit,.05,false,false,false);assert.equal(orbit.origin,origin); }
assert.equal(orbit.captures,1);
syncWorksOrbit(orbit,'works',1);assert.equal(orbit.phase,origin);
advanceWorksOrbit(orbit,.016,false,false,true);assert.equal(orbit.phase,origin);
advanceWorksOrbit(orbit,.016,false,false,true);assert(orbit.phase>origin);
const frozen=orbit.phase;advanceWorksOrbit(orbit,.05,false,true,true);assert.equal(orbit.phase,frozen);
const fresh=createWorksOrbit();syncWorksOrbit(fresh,'finale',.6);assert.equal(fresh.origin,0);
assert.equal(fresh.captures,1);
for(let i=0;i<3;i++){
  assert.equal(JSON.stringify(data.constellations[i].artwork),JSON.stringify(art.works[i].artwork));
  assert.deepEqual(data.constellations[i].geometry.stars,art.works[i].geometry.stars);
  assert.deepEqual(data.constellations[i].geometry.supportingStars,art.works[i].geometry.supportingStars);
  assert.deepEqual(data.constellations[i].geometry.edges,art.works[i].geometry.edges);
  assert.equal(createHash('sha256').update(fs.readFileSync('public'+data.constellations[i].artwork.url)).digest('hex'),data.constellations[i].artwork.sha256);
  for(const anchor of data.constellations[i].artwork.anchors){const star=data.constellations[i].geometry.stars.find(s=>s.hip===anchor.hip);assert(star);anchor.localPosition.forEach((value,j)=>assert(Math.abs(star.position[j]-value)<1e-8))}
}
const original=JSON.parse(execFileSync('git',['show','HEAD:src/3d/data/worksConstellations.json'],{encoding:'utf8'}));
const withoutArt=JSON.parse(JSON.stringify(data));withoutArt.constellations.forEach(c=>delete c.artwork);
assert.deepEqual(withoutArt,original);
fs.writeFileSync('outputs/visual-revision-2026-10-09/v7/check-results.json',JSON.stringify({passed:true,rows,orbit},null,2)+'\n');
console.log('V7 self-check PASS: fit, selection panel, reversal, single latch, static, V4 geometry parity');
