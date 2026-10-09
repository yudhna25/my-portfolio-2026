import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Vector3, Matrix3, Matrix4 } from 'three';
import { RAY_QUALITY, QUALITY } from '../../../src/3d/quality.js';
// Compare the exterior integrator with the analytic capture threshold; separately
// stress RK4 substages at the safe observer limit instead of asserting fake physics inside rs.
function trace(radius, direction, tier) {
  const p=new Vector3(0,0,radius), radial=p.clone().normalize(), vr=radial.clone().multiplyScalar(direction.dot(radial));
  const v=vr.clone().add(direction.clone().sub(vr).multiplyScalar(1/Math.sqrt(1-1/radius)));
  const momentum=p.clone().cross(v), h2=momentum.lengthSq();
  let error=0, drift=0;
  const acceleration=p=>p.clone().multiplyScalar(-1.5*h2/Math.pow(Math.max(p.lengthSq(),1),2.5));
  for(let i=0;i<tier.steps;i++) {
    const r=p.length(), inward=Math.max(-p.dot(v)/r,0);
    const h=Math.min(Math.max(.035,r*tier.step),inward>0?(r-1)*.4/inward:Infinity), a1=acceleration(p);
    const v2=v.clone().addScaledVector(a1,h/2), a2=acceleration(p.clone().addScaledVector(v,h/2));
    const v3=v.clone().addScaledVector(a2,h/2), a3=acceleration(p.clone().addScaledVector(v2,h/2));
    const v4=v.clone().addScaledVector(a3,h), a4=acceleration(p.clone().addScaledVector(v3,h));
    p.addScaledVector(v,h/6).addScaledVector(v2,h/3).addScaledVector(v3,h/3).addScaledVector(v4,h/6);
    v.addScaledVector(a1,h/6).addScaledVector(a2,h/3).addScaledVector(a3,h/3).addScaledVector(a4,h/6);
    assert([...p.toArray(),...v.toArray()].every(Number.isFinite));
    error=Math.max(error,Math.abs(v.lengthSq()-h2/Math.pow(p.length(),3)-1));
    drift=Math.max(drift,p.clone().cross(v).distanceTo(momentum)/Math.max(momentum.length(),.000001));
    if(p.length()<1.01) return {captured:true,steps:i+1,error,drift};
    if(p.length()>Math.max(radius+1,24)&&p.dot(v)>0) return {captured:false,steps:i+1,error,drift};
  }
  return {captured:null,steps:tier.steps,error,drift};
}
const critical=3*Math.sqrt(3)/2, results={};
for(const [name,tier] of Object.entries(RAY_QUALITY)) {
  const rays=[.995,1.005].map(factor=>{
    const s=critical*factor*Math.sqrt(1-1/32)/32;
    return trace(32,new Vector3(-s,0,-Math.sqrt(1-s*s)),tier);
  });
  assert.equal(rays[0].captured,true); assert.equal(rays[1].captured,false);
  rays.forEach(r=>{assert(r.error<.02);assert(r.drift<.002);});
  let stress=0;
  for(const radius of [1.1,1.5,2.7,8,32,90]) for(let j=0;j<=100;j++) {
    const theta=j*Math.PI/100; trace(radius,new Vector3(Math.sin(theta),0,-Math.cos(theta)),tier);stress++;
  }
  results[name]={rays,finiteStressRays:stress};
}
const frame=new Matrix3().setFromMatrix4(new Matrix4().makeRotationZ(55*Math.PI/180).multiply(new Matrix4().makeRotationX(4*Math.PI/180))).transpose();
const identity=frame.clone().multiply(frame.clone().transpose());
assert(identity.elements.every((v,i)=>Math.abs(v-(i%4===0?1:0))<1e-12));
assert.deepEqual(QUALITY,{high:24000,medium:12000,low:1500});
fs.writeFileSync('outputs/visual-revision-2026-10-09/v2/geodesic-results.json',JSON.stringify({status:'PASS',critical,results,diskFrameOrthonormal:true},null,2));
console.log(JSON.stringify(results));
