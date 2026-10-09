import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PerspectiveCamera, Vector3 } from 'three';
import { storyCameraPath, STORY_CHAPTERS } from '../../../src/3d/utils/cameraPath.js';
import { createMeteorLayout, meteorReadingY, meteorEmphasis, meteorVisibility, worksArrival, sampleStoryMeteor, writeStoryMeteor, STORY_METEOR_SAMPLES, STORY_METEOR_TRAIL } from '../../../src/3d/utils/storyMeteor.js';
import { ambientMeteorVisibility, createShootingStars, advanceShootingStars, clearShootingStars, METEOR_COUNT, METEOR_SAMPLES } from '../../../src/3d/utils/shootingStars.js';

let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks++; };
const near = (a,b,e=1e-6) => ok(Math.abs(a-b)<e, `${a} != ${b}`);
const target = {}, scratch = {}, v = new Vector3(), camera = new PerspectiveCamera();
for (const [width,height] of [[320,740],[390,844],[768,1024],[1440,900],[1920,1080]]) {
  const layout = createMeteorLayout();
  Object.assign(layout, { width,height,range:height*2.5 });
  layout.points.set([.08,.12*height,.2,.38*height,.63,.95*height,.75,1.55*height,.62,3*height]);
  layout.milestones.set([.38*height,.95*height,1.55*height]);
  const forward = new Map(), positions = new Float32Array(STORY_METEOR_SAMPLES*3);
  for (const reverse of [false,true]) for (let i=0; i<=400; i++) {
    const journey=(reverse?400-i:i)/200;
    writeStoryMeteor(layout,journey,positions,scratch,target);
    ok(positions.every(Number.isFinite),'finite trail');
    if (reverse) assert.deepEqual(positions,forward.get(journey));
    else forward.set(journey,positions.slice());
    sampleStoryMeteor(layout,journey,scratch,target);
    for (const [j,key] of ['x','y','z'].entries()) near(positions[j],scratch[key],1e-4);
    sampleStoryMeteor(layout,Math.max(0,journey-STORY_METEOR_TRAIL),scratch,target);
    for (const [j,key] of ['x','y','z'].entries()) near(positions[positions.length-3+j],scratch[key],1e-4);
    const chapter=journey<=1?'experience':'departure', p=journey<=1?journey:journey-1;
    const pose=storyCameraPath(chapter,p,target,false,width/height);
    camera.aspect=width/height; camera.fov=2*Math.atan(Math.tan(Math.PI/6)/Math.min(1,width/height))*180/Math.PI;
    camera.position.set(pose.x,pose.y,pose.z); camera.lookAt(pose.lookX,pose.lookY,pose.lookZ); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    v.fromArray(positions).project(camera);
    near((1-v.y)*height/2,journey<=1?meteorReadingY(layout,p)-p*layout.range:height*.5,.001);
    ok(v.x>=-1&&v.x<=1&&v.z<1,'head stays in frame');
    ok(camera.position.distanceTo(new Vector3(0,0,-200))>1,'observer outside horizon');
  }
  for (const [a,b] of [['education','experience'],['experience','departure'],['departure','works']]) {
    assert.deepEqual(storyCameraPath(a,1,{},false,width/height),storyCameraPath(b,0,{},false,width/height));
  }
  const at={...sampleStoryMeteor(layout,1,{}, {})};
  for (const q of [1-1e-7,1+1e-7]) {
    const point=sampleStoryMeteor(layout,q,{},{});
    ok(Math.hypot(point.x-at.x,point.y-at.y,point.z-at.z)<1e-4,'continuous head boundary');
  }
  const left=sampleStoryMeteor(layout,1-1e-6,{},{}),right=sampleStoryMeteor(layout,1+1e-6,{},{});
  ok(Math.hypot(right.x-2*at.x+left.x,right.y-2*at.y+left.y,right.z-2*at.z+left.z)/1e-6<0.01,'matching zero tangent at departure');
  for (let index=0; index<3; index++) {
    let lo=0,hi=1;
    for(let i=0;i<50;i++){const p=(lo+hi)/2;if(meteorReadingY(layout,p)<layout.milestones[index])lo=p;else hi=p;}
    near(meteorEmphasis(layout,index,(lo+hi)/2),1);
  }
}
for (const chapter of STORY_CHAPTERS) for(const p of [0,.25,.5,.75,1]) {
  if(['hero','portal','experience','departure','finale'].includes(chapter.id)) near(ambientMeteorVisibility(chapter.id,p),0);
  ok(Number.isFinite(meteorVisibility(chapter.id,p)),'finite visibility');
}
near(worksArrival('departure',0),0); near(worksArrival('departure',1),1);
near(meteorVisibility('departure',1),0); near(meteorVisibility('works',0),0);
for (const random of [()=>0.1,()=>0.9]) {
  const pool=createShootingStars(random), pos=new Float32Array(METEOR_COUNT*METEOR_SAMPLES*3), alpha=new Float32Array(METEOR_COUNT*METEOR_SAMPLES);
  const initial=pool.remaining; advanceShootingStars(pool,1/60,1,pos,alpha,random,false); near(pool.remaining,initial);
  let bursts=0,previous=pool.remaining;
  for(let i=0;i<1200;i++){advanceShootingStars(pool,1/60,1,pos,alpha,random);if(pool.remaining>previous){bursts++;ok(pool.remaining>=4&&pool.remaining<=7,'ambient interval');ok(pool.meteors.filter(m=>Number.isFinite(m.age)).length>=2,'2–3 ambient meteors');} previous=pool.remaining;}
  ok(bursts>=2,'ambient still emits'); clearShootingStars(pool); ok(pool.meteors.every(m=>m.age===Infinity),'clear');
}
for(const locale of ['vi','en']) {
  const current=JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`));
  const before=JSON.parse(fs.readFileSync(`outputs/redesign/r5.1/before/src/i18n/locales/${locale}.json`));
  assert.deepEqual(current,before);
}
const result={status:'PASS',checks,viewports:5,forwardReversePairs:2005,trailSamples:STORY_METEOR_SAMPLES,ambientSlots:METEOR_COUNT};
fs.writeFileSync('outputs/redesign/r5.1/check-motion-results.json',JSON.stringify(result,null,2)); console.log(result);

