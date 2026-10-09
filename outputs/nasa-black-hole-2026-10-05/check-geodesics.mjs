import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { RAY_QUALITY } from '../../src/3d/quality.js';
// Validate the Cartesian integrator against two exact constants of motion and
// the analytic critical impact parameter, independently of disk appearance.
function trace(b,step){
 const r=32,f=1-1/r,sin=b*Math.sqrt(f)/r;
 let p=new Vector3(0,0,r),v=new Vector3(-sin/Math.sqrt(f),0,-Math.sqrt(1-sin*sin));
 const angular=p.clone().cross(v),h2=angular.lengthSq();
 let energyError=0,momentumError=0,steps=0;
 const acceleration=p=>p.clone().multiplyScalar(-1.5*h2/Math.pow(p.length(),5));
 for(;steps<5000;steps++){
  const h=Math.max(.035,p.length()*step),a1=acceleration(p);
  const v2=v.clone().addScaledVector(a1,h/2),a2=acceleration(p.clone().addScaledVector(v,h/2));
  const v3=v.clone().addScaledVector(a2,h/2),a3=acceleration(p.clone().addScaledVector(v2,h/2));
  const v4=v.clone().addScaledVector(a3,h),a4=acceleration(p.clone().addScaledVector(v3,h));
  p.addScaledVector(v,h/6).addScaledVector(v2,h/3).addScaledVector(v3,h/3).addScaledVector(v4,h/6);
  v.addScaledVector(a1,h/6).addScaledVector(a2,h/3).addScaledVector(a3,h/3).addScaledVector(a4,h/6);
  energyError=Math.max(energyError,Math.abs(v.lengthSq()-h2/Math.pow(p.length(),3)-1));
  momentumError=Math.max(momentumError,p.clone().cross(v).distanceTo(angular)/b);
  if(p.length()<1.01)return{captured:true,steps,energyError,momentumError};
  if(p.length()>r+1&&p.dot(v)>0)return{captured:false,steps,energyError,momentumError};
 }
 throw Error('ray did not terminate');
}
const critical=3*Math.sqrt(3)/2,results={};
for(const[tier,settings]of Object.entries(RAY_QUALITY)){
 const below=trace(critical*.995,settings.step),above=trace(critical*1.005,settings.step);
 assert(below.captured);assert(!above.captured);assert(below.steps<settings.steps&&above.steps<settings.steps);
 assert(below.energyError<.02&&above.energyError<.02);assert(Math.max(below.momentumError,above.momentumError)<.002);
 results[tier]={below,above};
}
fs.writeFileSync('outputs/nasa-black-hole-2026-10-05/geodesic-results.json',JSON.stringify({status:'PASS',critical,results},null,2));console.log(JSON.stringify(results,null,2));
