import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Matrix4,Quaternion,Vector3} from 'three';
import {BLACK_HOLE_CENTER,STORY_CHAPTERS,storyCameraPath} from '../../../../src/3d/utils/cameraPath.js';
import {FINALE_PHASES,finaleState,buildFinaleSeeds} from '../../../../src/3d/utils/finale.js';
import {worksBounds,worksStage,worksFigure,createWorksOrbit,syncWorksOrbit,advanceWorksOrbit} from '../../../../src/3d/utils/worksOrbit.js';
const out='outputs/visual-revision-2026-10-09/v9', report={assertions:0,maxCollisionError:0};
const check=(value,message)=>{report.assertions++;assert(value,message)};
const source=fs.readFileSync('src/3d/components/WorksConstellations.jsx','utf8');
const body=source.match(/const basis = useMemo\(\(\) => \{([\s\S]*?)\}, \[size.width, size.height, figures\]\);/)[1];
const build=new Function('size','figures','storyCameraPath','Vector3','Quaternion','Matrix4','BLACK_HOLE_CENTER','worksStage',body);
const data=JSON.parse(fs.readFileSync('src/3d/data/worksConstellations.json','utf8'));
const figures=data.constellations.map(item=>({bounds:worksBounds(item)}));
check(STORY_CHAPTERS.find(c=>c.id==='finale').height===4,'400vh');
check(JSON.stringify(FINALE_PHASES)===JSON.stringify({retract:.12,compress:.34,collision:.44,nebula:.70,formed:.96}),'fixed phase gates');
const seeds=buildFinaleSeeds(2600),small=buildFinaleSeeds(800);
check(seeds.every(n=>Number.isFinite(n)&&n>=0&&n<1),'finite bounded seeds');
check(small.every((n,i)=>n===seeds[i]),'quality preserves the common particle identities');
for(const p of [NaN,Infinity,-Infinity,-1])check(JSON.stringify(finaleState(p))===JSON.stringify(finaleState(0)),'invalid progress safe');
for(const [width,height]of [[390,844],[768,1024],[1440,900],[1920,900]]){
 const basis=build({width,height},figures,storyCameraPath,Vector3,Quaternion,Matrix4,BLACK_HOLE_CENTER,worksStage),aspect=width/height;
 const contact=storyCameraPath('contact',0,{},false,aspect);
 for(const p of [0,.119999,.12,.120001,.339999,.34,.340001,.439999,.44,.440001,.699999,.7,.700001,.959999,.96,.960001,1]){
  const phase=finaleState(p);check(Object.values(phase).filter(n=>typeof n==='number').every(Number.isFinite),'finite phase');
  if(p>=.96)check(phase.hole===1&&phase.cloud===0&&phase.flare===0,'stable formed endpoint');
  if(p<=.12)check(phase.angle===0&&phase.figure===1,'retract info keeps figures stationary');
  if(p<=.96)check(phase.contact===0,'Contact waits until .96');
  const pose=storyCameraPath('finale',p,{},false,aspect);check(Object.values(pose).every(Number.isFinite)&&Math.hypot(pose.x,pose.y,pose.z+200)>1.1,'safe exterior observer');
  if(p>=.44)check(JSON.stringify(pose)===JSON.stringify(contact),'collision and BH use one stable camera frame');
  for(const origin of [0,.75,4.4])for(let i=0;i<3;i++){
   const forward=worksFigure(p,origin,i,basis,{}),reverse=worksFigure(p,origin,i,basis,{});
   check(JSON.stringify(forward)===JSON.stringify(reverse),'history independent figure pose');
   if(p>=.44){const world=new Vector3(forward.x,forward.y,forward.z).applyQuaternion(basis.rotation).add(basis.center);const error=world.distanceTo(new Vector3(...BLACK_HOLE_CENTER));report.maxCollisionError=Math.max(report.maxCollisionError,error);check(error<1e-10,'actual figure collision is actual BH world center');}
  }
 }
 for(const boundary of Object.values(FINALE_PHASES)){const a=finaleState(boundary-1e-7),b=finaleState(boundary+1e-7);for(const key of Object.keys(a).filter(k=>typeof a[k]==='number'))check(Math.abs(a[key]-b[key])<.0001,key+' phase continuity');}
 const orbit=createWorksOrbit(.712);syncWorksOrbit(orbit,'works',.9);syncWorksOrbit(orbit,'finale',.1);const saved=orbit.origin;
 for(const p of [.7,.44,.12,.96,.34,1]){syncWorksOrbit(orbit,'finale',p);advanceWorksOrbit(orbit,1,false,false,true);check(orbit.origin===saved&&orbit.captures===1,'one capture across hold/reverse/jump');}
 syncWorksOrbit(orbit,'works',1);check(orbit.phase===saved&&!orbit.latched,'Works origin restored');
}
report.status='pass';fs.writeFileSync(out+'/math-results.json',JSON.stringify(report,null,2));console.log(report);
