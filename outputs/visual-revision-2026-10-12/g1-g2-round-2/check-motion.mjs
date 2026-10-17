import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { openingPose } from '../../../src/3d/utils/opening.js';
import { createMeteorLayout, sampleStoryMeteor } from '../../../src/3d/utils/storyMeteor.js';
import { portalIntakeSample } from '../../../src/3d/utils/portal.js';
const out = 'outputs/visual-revision-2026-10-12/g1-g2-round-2';
let checks = 0;
const velocities = [];
for (const [width, height] of [[320,760],[390,844],[768,1024],[1440,900],[1920,1080]]) {
  const anchor = { left: width * .64, top: height * .42, width: 72, height: 68 };
  const finish = openingPose(1, anchor, width, height, {});
  assert.equal(finish.x, anchor.left + anchor.width / 2); assert.equal(finish.y, anchor.top + anchor.height / 2);
  assert(Math.abs(finish.shadow - anchor.height * .48) < 1e-10); assert.equal(finish.reveal, 1); checks += 4;
  const layout = createMeteorLayout(); layout.width=width; layout.height=height; layout.range=height*3.5;
  layout.points.set([-.22,height*.20,.28,height*.65,.70,height*1.8,.45,height*2.9,.62,layout.range+height*.8]);

  let oldPoint, min = Infinity, max = 0;
  for(let i=0;i<=4000;i++) {
    const p=i/4000;
    const point=sampleStoryMeteor(layout,p,{},{});
    assert(Number.isFinite(point.x+point.y+point.z));
    assert.deepEqual(point,sampleStoryMeteor(layout,p,{},{}));
    if(oldPoint&&p>.04&&p<.96){const speed=Math.hypot(point.x-oldPoint.x,point.y-oldPoint.y,point.z-oldPoint.z)*4000;min=Math.min(min,speed);max=Math.max(max,speed)}
    oldPoint=point; checks+=2;
    const intro=openingPose(p,anchor,width,height,{}); assert(Object.values(intro).every(Number.isFinite)); checks++;
    const pull=portalIntakeSample(p,p,{x:width*.1,y:height*.2,width:70,height:40},anchor,width,height,7,{});
    assert(Object.values(pull).every(Number.isFinite)); checks++;
  }
  for(let i=1;i<=3;i++) {
    const p=(layout.points[i*2+1]-.2*height)/(layout.range+.6*height),epsilon=1e-5;
    const a=sampleStoryMeteor(layout,p-epsilon,{},{}),b=sampleStoryMeteor(layout,p,{},{}),c=sampleStoryMeteor(layout,p+epsilon,{},{});
    const delta=Math.hypot(...['x','y','z'].map(k=>(c[k]-b[k])/epsilon-(b[k]-a[k])/epsilon));
    assert(delta<.01,'Milestone velocity discontinuity '+width+'/'+i);checks++;
  }
  const a=sampleStoryMeteor(layout,1-1e-6,{},{}), b=sampleStoryMeteor(layout,1+1e-6,{},{});
  assert(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.001);checks++;
  velocities.push({width,min,max,ratio:max/min});
}
const baseline=JSON.parse(fs.readFileSync(out+'/baseline.json','utf8'));
const allowed=new Set(['src/App.jsx','src/3d/GalaxyScene.jsx','src/3d/components/BlackHole.jsx','src/3d/components/BlackHoleSystem.jsx',
  'src/components/Hero.jsx','src/components/effects/PortalHeading.jsx','src/components/Preloader.jsx','src/styles/hero.css','src/styles/opening.css',
  'src/components/effects/portalTrails.js','src/3d/utils/portal.js','src/3d/utils/storyMeteor.js','src/3d/components/StoryMeteor.jsx','src/components/sections/Experience.jsx']);
const changed=[],preserved=[];
for(const[file,hash]of Object.entries(baseline.files)){
 const actual=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(actual!==hash){assert(allowed.has(file),file+' changed outside scope');changed.push(file)}else preserved.push(file);
}
fs.writeFileSync(out+'/motion-results.json',JSON.stringify({status:'PASS',checks,velocities,changed,preserved},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',checks,velocities,changed:changed.length,preserved:preserved.length}));
