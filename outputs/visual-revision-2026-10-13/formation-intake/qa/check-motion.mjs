import assert from 'node:assert/strict';
import fs from 'node:fs';
import { portalFall, storyCameraPath } from '../../../../src/3d/utils/cameraPath.js';
import { portalParticle, portalState } from '../../../../src/3d/utils/portal.js';
import { openingPose } from '../../../../src/3d/utils/opening.js';
let checks = 0;
const check = (v, label) => { checks++; assert(v, label); };
for (const width of [320,390,768,1440,1920]) {
  const anchor = {left:width*.7,top:340,width:70,height:90};
  const end = openingPose(1,anchor,width,900,{});
  check(end.x===anchor.left+35 && end.y===385 && Math.abs(end.shadow-43.2)<1e-8,'Exact O join');
  check(end.move===1 && end.reveal===1,'Opening releases at endpoint');
  let lastFall = 0, lastSpeed = 0;
  for(let i=0;i<=440;i++) {
    const p=i/1000, fall=portalFall(p), pose=storyCameraPath('portal',p,{},false,width/900);
    check(fall>=lastFall && fall>=0 && fall<=1,'Monotonic shared fall');
    if(i>1)check(fall-lastFall>=lastSpeed-1e-10,'Accelerating approach until core');
    lastSpeed=fall-lastFall;lastFall=fall;
    check(Object.values(pose).every(Number.isFinite),'Finite camera');
    check(Math.hypot(pose.x,pose.y,pose.z+200)>1.1,'Safe exterior ray observer');
    for(const seed of [0,.31,.99]) {
      const point=portalParticle(p,120,250,seed,width/2,405,{});
      check(Object.values(point).every(Number.isFinite),'Finite particles');
      assert.deepEqual(point,portalParticle(p,120,250,seed,width/2,405,{}));checks++;
    }
  }
  const rest=portalParticle(0,120,250,.31,width/2,405,{});
  check(Math.abs(rest.x-120)<1e-8 && Math.abs(rest.y-250)<1e-8,'Source silhouette exact at rest');
}
for(const p of [.44,.47,.50])check(portalState(p).visibility===0,'Dark rebase preserved');
const indices=Array.from({length:36},(_,i)=>(4+i*37%120)*2);
check(new Set(indices).size===36 && Math.max(...indices)<256,'Spark indices unique/in bounds');
check(Math.max(...indices.slice(0,18))-Math.min(...indices.slice(0,18))>200,'Mobile spans tail');
fs.writeFileSync('outputs/visual-revision-2026-10-13/formation-intake/math-results.json',JSON.stringify({status:'pass',checks},null,2));
console.log({checks,status:'pass'});
