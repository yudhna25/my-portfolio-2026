import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {chromium,edge,base,out,ready,scrollChapter,save} from './common.mjs';
import {sampleStoryMeteor,createMeteorLayout} from '../../../../src/3d/utils/storyMeteor.js';
const oldFile=out+'/qa/before-storyMeteor.mjs';
fs.writeFileSync(oldFile,execFileSync('git',['show','HEAD:src/3d/utils/storyMeteor.js'],{encoding:'utf8'}).replace("'./cameraPath.js'","'../../../../src/3d/utils/cameraPath.js'"));
const before=await import(pathToFileURL(fs.realpathSync(oldFile)).href);
const browser=await chromium.launch({executablePath:edge,headless:true});const records=[];
function profile(sample,layout,view,projection) {
 const point={},pose={},speeds=[],accelerations=[];let previous,velocity,minX=Infinity,maxX=-Infinity;
 const projected=q=>{
  sample(layout,q,point,pose);
  const x=view[0]*point.x+view[4]*point.y+view[8]*point.z+view[12],y=view[1]*point.x+view[5]*point.y+view[9]*point.z+view[13],z=view[2]*point.x+view[6]*point.y+view[10]*point.z+view[14],w=projection[3]*x+projection[7]*y+projection[11]*z+projection[15];
  return [(projection[0]*x+projection[4]*y+projection[8]*z+projection[12])/w*layout.width/2+layout.width/2,layout.height/2-(projection[1]*x+projection[5]*y+projection[9]*z+projection[13])/w*layout.height/2];
 };
 for(let i=0;i<=2000;i++) {
  const q=.04+i*.92/2000,p=projected(q);assert(p.every(Number.isFinite));minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);
  if(previous){const v=p.map((n,j)=>(n-previous[j])/(.92/2000));speeds.push(Math.hypot(...v));if(velocity)accelerations.push(Math.hypot(...v.map((n,j)=>(n-velocity[j])/(.92/2000))));velocity=v}previous=p;
 }
 speeds.sort((a,b)=>a-b);accelerations.sort((a,b)=>a-b);
 return {minX,maxX,speed:{min:speeds[0],p50:speeds[1000],p95:speeds[1900],max:speeds.at(-1),ratio:speeds.at(-1)/speeds[0]},acceleration:{p95:accelerations[Math.floor(accelerations.length*.95)],max:accelerations.at(-1)}};
}
try {
 const page=await browser.newPage({serviceWorkers:'block'});await page.goto(base);await ready(page);
 for(const [width,height] of [[320,760],[390,844],[768,1024],[1440,900],[1920,1080]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(800);await scrollChapter(page,'experience',.5);
  const data=await page.evaluate(()=>{
   const root=motionQA.root.getState(),c=root.gl.domElement;let f=c[Object.keys(c).find(k=>k.startsWith('__reactFiber$'))],layout;
   while(f&&!layout){for(let h=f.memoizedState;h;h=h.next){const v=h.memoizedState?.current;if(v?.points&&v?.milestones)layout={width:v.width,height:v.height,range:v.range,points:[...v.points],milestones:[...v.milestones]}}f=f.return}
   return {layout,view:[...root.camera.matrixWorldInverse.elements],projection:[...root.camera.projectionMatrix.elements]};
  });
  const layout=createMeteorLayout();for(const [k,v]of Object.entries(data.layout)) ArrayBuffer.isView(layout[k])?layout[k].set(v):layout[k]=v;
  const old=before.createMeteorLayout();old.width=width;old.height=height;old.range=layout.range;old.points.set(layout.points);old.points[1]=height*.22;old.points[9]=layout.range+height*.5;
  const now=profile(sampleStoryMeteor,layout,data.view,data.projection),previous=profile(before.sampleStoryMeteor,old,data.view,data.projection);
  assert(now.minX>=-width*.25&&now.maxX<=width*1.1,'Measured S overshoot '+width);
  records.push({width,height,layout:data.layout,before:previous,after:now});
 }
 save('path-profile.json',{status:'pass',method:'Uniform progress samples of both analytical paths against actual DOM layouts and rendered camera matrices; CSS pixels per chapter progress, not wall-clock speed or FPS.',records});
 console.log(JSON.stringify(records.map(r=>({width:r.width,before:r.before.speed.ratio,after:r.after.speed.ratio,accelerationBefore:r.before.acceleration.p95,accelerationAfter:r.after.acceleration.p95}))));
}finally{await browser.close()}
