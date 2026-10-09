import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Vector3 } from 'three';
import { cameraPath } from '../../src/3d/utils/cameraPath.js';
import { buildStarGeometry } from '../../src/3d/utils/buildStarGeometry.js';
import { QUALITY, RAY_QUALITY } from '../../src/3d/quality.js';
const camera=[];
for(let i=0;i<=1000;i++){
 const p=i/1000,pose=cameraPath(p),radius=Math.hypot(pose.x,pose.z+200);
 assert(pose.y>=.18-1e-9);assert(radius>3);
 if(i>0)assert(pose.z<=camera[i-1].z);
 camera.push(pose);
}
const start=camera[0],end=camera.at(-1);
assert(Math.hypot(start.x,start.y,start.z+200)<33);
assert(Math.hypot(end.x,end.z+200)<14);assert.equal(end.y,.18);assert.equal(end.parallax,0);
const weave=[.1,.3,.5,.7,.9].map(p=>Math.sign(cameraPath(p).x+3.5*p*p*(3-2*p)));
assert.deepEqual(weave,[-1,1,-1,1,-1]);
const geometries={};
for(const[tier,count]of Object.entries(QUALITY)){
 const g=buildStarGeometry(count),positions=g.attributes.position;
 const octants=Array(8).fill(0),mean=new Vector3(),v=new Vector3();
 for(let i=0;i<count;i++){
  v.fromBufferAttribute(positions,i);assert(v.length()>=279.99&&v.length()<=340.01);
  v.normalize();mean.add(v);octants[(v.x>0?1:0)+(v.y>0?2:0)+(v.z>0?4:0)]++;
 }
 mean.divideScalar(count);assert(mean.length()<.035);
 assert(octants.every(n=>n>count*.1&&n<count*.15));
 assert(Math.max(...g.attributes.aSize.array)*1.08<3.241);
 geometries[tier]={count,octants,meanDirection:mean.toArray(),maximumCssPixels:Math.max(...g.attributes.aSize.array)*1.08};g.dispose();
}
// Independent angular equation integration (paper eq.8) as a reference for the
// Cartesian GPU integrator. Tests the critical impact parameter analytically.
function angularRay(b,step=.0005){
 const r=32,f=1-1/r,sinDelta=b*Math.sqrt(f)/r;
 let u=1/r,du=Math.sqrt(1-sinDelta*sinDelta)/b;
 const derivative=(u,du)=>[du,1.5*u*u-u];
 let maxEnergyError=0;
 for(let phi=0;phi<20;phi+=step){
  const a=derivative(u,du),c=derivative(u+a[0]*step/2,du+a[1]*step/2);
  const d=derivative(u+c[0]*step/2,du+c[1]*step/2),e=derivative(u+d[0]*step,du+d[1]*step);
  u+=step*(a[0]+2*c[0]+2*d[0]+e[0])/6;du+=step*(a[1]+2*c[1]+2*d[1]+e[1])/6;
  maxEnergyError=Math.max(maxEnergyError,Math.abs((du*du+u*u*(1-u))*b*b-1));
  if(u>=1)return{captured:true,phi,maxEnergyError};if(u<=0)return{captured:false,phi,maxEnergyError};
 }
 throw Error('reference failed to terminate');
}
const critical=3*Math.sqrt(3)/2,below=angularRay(critical*.995),above=angularRay(critical*1.005);
assert(below.captured);assert(!above.captured);assert(Math.max(below.maxEnergyError,above.maxEnergyError)<1e-9);
const keys=(v,p='')=>Object.entries(v).flatMap(([k,x])=>typeof x==='object'?keys(x,p+k+'.'):[p+k]);
const vi=JSON.parse(fs.readFileSync('src/i18n/locales/vi/lab.json','utf8')),en=JSON.parse(fs.readFileSync('src/i18n/locales/en/lab.json','utf8'));
assert.deepEqual(keys(vi).sort(),keys(en).sort());
const results={status:'PASS',camera:{start,end,startDistance:Math.hypot(start.x,start.y,start.z+200),endDistance:Math.hypot(end.x,end.y,end.z+200),endRadius:Math.hypot(end.x,end.z+200),samples:camera.length,weave},geometries,rayReference:{critical,below,above,tiers:RAY_QUALITY},localeKeys:keys(vi).length};
fs.writeFileSync('outputs/nasa-black-hole-2026-10-05/cpu-results.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
