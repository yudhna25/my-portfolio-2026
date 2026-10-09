import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const dir = new URL('./', import.meta.url);
const load = name => JSON.parse(readFileSync(new URL(name, dir), 'utf8'));
let checks = 0;
const ok = (value, message) => { assert(value, message); checks++; };
const same = (a,b,message) => { assert.deepEqual(a,b,message); checks++; };
const os = load('os-live-roundtrip.json'), desktop = load('os-reduced-complete.json');
const cycles = load('live-cycles.json'), extra = load('live-final.json');
const mobile = load('mobile-reduced-complete.json'), keyboard = load('keyboard.json');
same(os.events.map(e=>e.matches), [false,true,false], 'Native Windows round trip');
ok(os.mode==='os' && os.preference===null, 'OS route must not emulate preference');
ok(os.errors.length===0, 'Native OS console errors');
ok(os.samples.at(-1).reduced===false && os.samples.at(-1).smoother, 'OS setting restored');
const ids = ['hero','about','skills','education','experience','work','playground','transmission','site-footer'];
ok(mobile.samples.every(s=>s.width===390),'Mobile viewport must be 390px');
let staticPairs = 0;
for (const run of [desktop, mobile]) {
 ok(run.errors.length===0, 'Tour console errors');
 for(const lang of ['vi','en']) for(const id of ids) {
  const index=run.samples.findIndex(s=>s.label==='tour '+id && s.lang===lang), s=run.samples[index], next=run.samples[index+1];
  ok(index>=0, `Missing ${lang}/${id}`);
  ok(s.reduced && !s.smoother && s.triggers.length===0 && s.visualTweens.length===0, `Hidden animation ${lang}/${id}`);
  ok(s.trackCount===0 && s.splitCount===0 && s.cssAnimations===0, 'Static text and CSS');
  ok(s.content.transform==='none' && s.client===s.scroll, 'Native layout');
  same(s.scene.camera,[run.startPose.x,run.startPose.y,run.startPose.z],'Safe camera pose');
  ok(s.scene.glError===0, 'WebGL error');
  for(const section of s.sections) {
   ok(section.headings.every(h=>h.opacity==='1' && h.visibility==='visible'), 'Heading hidden');
   ok(section.images.every(i=>i.clip==='none' || i.clip==='inset(0px)'), 'Clip scrub left over');
  }
  ok(next.label==='still '+id,'Missing paired probe');
  same(s.scene.camera,next.scene.camera,'Camera moved');
  same(s.scene.quaternion,next.scene.quaternion,'Camera look moved');
  same(s.scene.gpu,next.scene.gpu,'Shader time/intensity moved');
  same(s.scene.objects,next.scene.objects,'Orbit/floating objects moved');
  ok(s.scene.gpu.some(p=>'uTime' in p.values),'Missing GPU time probe');
  ok(s.scene.gpu.every(p=>!('uApproach' in p.values)||p.values.uApproach===0),'Star approach moved');
  staticPairs++;
 }
}
const normals=cycles.samples.filter(s=>s.label==='live no-preference');
const reduces=cycles.samples.filter(s=>s.label==='live reduce');
ok(normals.length===5 && reduces.length===6,'Five live cycles plus final reduce');
ok(normals.every(s=>s.smoother && s.triggers.length===normals[0].triggers.length),'Normal trigger accumulation');
ok(normals.every(s=>s.allTweens<=cycles.samples[0].allTweens),'Tween accumulation');
ok(reduces.every(s=>!s.smoother && s.triggers.length===0 && s.visualTweens.length===0 && s.allTweens<=4),'Reduced context leak');
for(const c of desktop.checks) {
 if(c.type==='filter')ok(c.reduced && !c.activeFlip && c.visual===0,'Reduced Flip running');
 if(c.type==='pointer')same(c.before,c.after,'Mouse camera parallax');
 if(c.type==='preloader')ok(c.duration<=0.34 && c.spinnerTweens===0,'Reduced preloader animation');
}
ok(desktop.checks.filter(c=>c.type==='filter').length===4,'All four filters tested');
const lastPreloader=desktop.preloader.slice(-2);
const preloaderMs=lastPreloader[1].time-lastPreloader[0].time;
ok(preloaderMs<=340,'OS reduced preloader exceeds 340ms');
const livePreloader=extra.checks.filter(c=>c.type==='live-preloader').at(-1);
ok(livePreloader.duration<=0.34 && livePreloader.spinnerRepeats===0,'Live preloader did not reduce');
ok(extra.checks.filter(c=>c.type==='live-menu-scroll').at(-1).error===0,'Old menu scroll continued');
ok(extra.samples.find(s=>s.label==='live menu scrolling before reduce').windowScrollTweens===1,'Missing active ScrollTo before switch');
ok(extra.samples.filter(s=>s.label==='live menu scroll stopped'||s.label==='live menu scroll still').every(s=>s.windowScrollTweens===0),'Active ScrollTo survived reduction');
const lag=mobile.checks.find(c=>c.type==='native-lag');
ok(lag?.reduced && lag.delta>0 && lag.error===0 && lag.settledError===0,'Native scroll lag');
ok(!keyboard.open && !keyboard.lock && keyboard.active==='stellar-menu','Esc/focus restore');
for(const kind of ['starfieldExplorer','nebulaShaderPlayground','scrollProgressOrbit']) {
 const s=mobile.samples.find(s=>s.label==='demo '+kind), next=mobile.samples.find(s=>s.label==='demo still '+kind);
 const demo=s?.demos.find(d=>d.kind===kind), after=next?.demos.find(d=>d.kind===kind);
 ok(demo?.controls.length>0 && demo.controls.every(c=>c.disabled),'Demo controls active');
 same(demo,after,'Demo moved while reduced');
 if(kind==='starfieldExplorer')ok(demo.objects.some(o=>o.uniforms.uStrength===0),'Particle force active');
 if(kind==='nebulaShaderPlayground')ok(demo.objects.some(o=>!('uTime' in o.uniforms)),'Demo shader time active');
 if(kind==='scrollProgressOrbit')ok(demo.orbit?.transform==='none','Scroll orbit active');
}
const finalPreloader=load('final-preloader-live.json');
ok(finalPreloader.errors.length===0,'Final preloader console error');
const fresh=finalPreloader.preloader.slice(0,2);
const finalPreloaderMs=fresh[1].time-fresh[0].time;
ok(finalPreloaderMs<=340,'Final fresh reduced preloader exceeds 340ms');
const finalLive=finalPreloader.checks.find(c=>c.type==='live-preloader');
ok(finalLive.duration===0 && finalLive.spinnerRepeats===0,'Final live reduced preloader still uses animation');
const expected=load('source-final.json');
for(const path of ['src/components/Preloader.jsx','src/components/layout/MenuOverlay.jsx','src/3d/components/CameraRig.jsx','src/3d/components/BlackHole.jsx']) {
 const actual=createHash('sha256').update(readFileSync(new URL('../../'+path,dir))).digest('hex');
 same(actual,expected[path],'Verified source changed: '+path);
}
const result={status:'PASS',checks,staticPairs,osEvents:os.events.map(e=>e.matches),normalTriggerCounts:normals.map(s=>s.triggers.length),reducedTriggerCounts:reduces.map(s=>s.triggers.length),preloaderMs,finalPreloaderMs,finalLiveAnimationDuration:finalLive.duration};
writeFileSync(new URL('check-result.json',dir),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
