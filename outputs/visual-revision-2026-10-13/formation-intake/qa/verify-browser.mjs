import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, edge, base, out, sha, ready, scrollChapter, scene, capture, save } from './common.mjs';
const build=JSON.parse(fs.readFileSync(out+'/build-source.json','utf8'));
for(const [file,hash]of Object.entries(build.source))assert.equal(sha(file),hash,file);
const report={source:build.source,checks:0,records:[],errors:[]};
const check=(v,label)=>{report.checks++;assert(v,label)};
const browser=await chromium.launch({executablePath:edge,headless:true});
try {
 for(const width of [390,1440,1920]) {
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  const start=await scene(page);check(start.canvas===1&&start.overflow===0,'One Canvas/no overflow');
  await capture(page,'hero-'+width);
  const poses=new Map();
  for(const p of [0,.025,.06,.12,.20,.25,.34,.44,.47,.50,.70,.94,.999]) {
   await scrollChapter(page,'portal',p);await page.waitForTimeout(220);
   const s=await scene(page);poses.set(p,s);
   check(s.canvas===1&&s.glError===0&&s.overflow===0,'Portal render valid');
   check(s.copies.focusable===0 && s.copies.layers.every(x=>x.inert&&x.ariaHidden==='true'),'Particle pools inert');
   if(p>0&&p<.4) {
    const particles=await page.locator('[data-portal-trails]:not([hidden])').evaluateAll(ns=>ns.map(n=>({count:+n.dataset.particleCount,paths:n.querySelectorAll('.portal-trail-particles').length,copies:+n.dataset.copyCount,visible:[...n.querySelectorAll('.portal-trail-particles')].some(p=>p.getAttribute('d')&&+p.style.opacity>0)})));
    check(particles.length>=2&&particles.every(x=>x.count>0&&x.copies===x.paths),'Bounded particles and one source copy per item');
    if(p>=.06)check(particles.some(x=>x.visible),'Early disintegration visible');
    report.records.push({width,p,particles});
   }
   await capture(page,'portal-'+p+'-'+width);report.records.push({width,direction:'forward',state:s});
  }
  for(const p of [.94,.70,.50,.47,.44,.34,.25,.20,.12,.06,.025,0]) {
   await scrollChapter(page,'portal',p);await page.waitForTimeout(220);const s=await scene(page),a=poses.get(p);
   check(s.camera.every((x,i)=>Math.abs(x-a.camera[i])<.035),'Camera reverse matches');
   check(s.copies.count===a.copies.count && s.canvas===1,'Reverse pool count stable');
   if([.25,.12,0].includes(p))await capture(page,'reverse-'+p+'-'+width);
   report.records.push({width,direction:'reverse',state:s});
  }
  await scrollChapter(page,'portal',.20);await page.waitForTimeout(600);
  const readHold=()=>page.evaluate(()=>({p:motionQA.store.getState().chapterProgress,camera:motionQA.root.getState().camera.position.toArray(),paths:[...document.querySelectorAll('.portal-trail-particles')].map(p=>p.getAttribute('d'))}));
  const held=await readHold();await page.waitForTimeout(600);const heldAgain=await readHold();
  check(held.p===heldAgain.p&&JSON.stringify(held.camera)===JSON.stringify(heldAgain.camera)&&JSON.stringify(held.paths)===JSON.stringify(heldAgain.paths),'Held camera and particles exact');
  for(const p of [.34,.06,.28,.12])await scrollChapter(page,'portal',p);
  check((await scene(page)).canvas===1,'Rapid reverse remains valid');
  await scrollChapter(page,'portal',.9);
  check(await page.locator('#about').evaluate(n=>!n.closest('[inert]')),'About real DOM revealed during ejection');
  for(const p of [.15,.5,.85]) {
   await scrollChapter(page,'experience',p);const s=await scene(page);
   check(s.meteor.sparks===(width<768?18:36)&&s.meteor.core===(width<768?34:56),'Moderate cyan pool/core unchanged');
   await capture(page,'meteor-'+p+'-'+width);report.records.push({width,meteor:s.meteor});
  }
  if(width===390||width===1440) {
   const memories=[];
   for(let i=0;i<3;i++) {
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(450);
    check(await page.locator('[data-story-chapter="portal"]').evaluate(n=>n.getBoundingClientRect().height<innerHeight*1.1),'Reduced portal short');
    check(await page.locator('[data-portal-trails]').count()===0,'Reduced disposes particles');
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(600);await scrollChapter(page,'portal',.12);
    const s=await scene(page);memories.push(s.resources);check(s.canvas===1,'Live motion one Canvas');
   }
   report.records.push({width,memories});
   check(memories.every((m,i)=>!i||(m.geometries<=memories[i-1].geometries&&m.textures<=memories[i-1].textures))&&JSON.stringify(memories[1])===JSON.stringify(memories[2]),'Resources never grow and plateau after warm-up '+JSON.stringify(memories));
  }
  await page.close();console.log('Verified width',width);
 }
 check(report.errors.length===0,'No browser/GL error');report.status='pass';
}catch(e){report.status='fail';report.failure=e.stack;process.exitCode=1;console.error(e.stack);const page=browser.contexts().flatMap(c=>c.pages()).at(-1);if(page){await capture(page,'failure');report.last=await scene(page).catch(()=>null)}}
finally{save('browser-results.json',report);await browser.close();}
