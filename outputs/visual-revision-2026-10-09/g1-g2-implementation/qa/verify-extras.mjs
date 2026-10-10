import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium, edge, base, out, ready, scrollChapter, scene, selectWork, capture, save, sha} from './common.mjs';
const build=JSON.parse(fs.readFileSync(out+'/build-source.json','utf8'));
for(const [file,hash]of Object.entries(build.source)) assert.equal(sha(file),hash,file);
const report={source:build.source,checks:0,records:[],errors:[]};
const check=(value,message)=>{report.checks++;assert(value,message)};
const browser=await chromium.launch({executablePath:edge,headless:true});
try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<1024,serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(e.stack));
  page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
  await page.goto(base);await ready(page);await page.waitForTimeout(1000);
  for(const lang of ['en','vi']) {
   await scrollChapter(page,'portal',0);
   const trigger=page.locator('button[aria-controls="stellar-menu"]');
   await page.bringToFront();
   await page.waitForFunction(()=>!document.hidden && !document.querySelector('[data-portal-controls]').inert);
   await trigger.focus();
   check(await trigger.evaluate(n=>n===document.activeElement),'Menu trigger actually receives focus before native Enter');
   report.records.push({width,lang,openingMenu:await page.evaluate(()=>({active:document.activeElement.outerHTML,chapter:motionQA.store.getState().storyChapter,p:motionQA.store.getState().chapterProgress,hidden:document.hidden}))});
   await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.getElementById('stellar-menu').open);
   await page.waitForTimeout(750);
   for(let i=0;i<6;i++) {
    await page.keyboard.press('Tab');
    check(await page.locator('#stellar-menu').evaluate(n=>n.contains(document.activeElement)),'Menu native Tab trap');
   }
   await page.locator('#stellar-menu button').filter({hasText:new RegExp('^'+lang+'$','i')}).click();
   await page.waitForFunction(lang=>document.documentElement.lang===lang,lang);
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.getElementById('stellar-menu').open);
   check(await trigger.evaluate(n=>n===document.activeElement),'Escape restores actual trigger');
   await page.waitForTimeout(1000);
   await scrollChapter(page,'portal',.1);const state=await scene(page);
    const layers=state.copies.layers;
    check(state.overflow===0 && layers.length>=2 && layers.length<=3 && new Set(layers.map(l=>l.className)).size===layers.length && layers.filter(l=>l.className.includes('portal-trails--nav')).length===1 && layers.every(l=>l.identities===0),'Locale cleans/recreates single pools, including optional desktop cursor');
   report.records.push({width,lang,portal:state});await capture(page,'portal-'+lang+'-'+width);
  }
  if(width===390) {
   for(const next of [1440,390]) {
    await page.setViewportSize({width:next,height:900});await page.waitForTimeout(1000);
    await scrollChapter(page,'portal',.1);const s=await scene(page);
    check(s.overflow===0 && s.copies.layers.length>=2 && s.copies.layers.length<=3 && new Set(s.copies.layers.map(l=>l.className)).size===s.copies.layers.length && s.copies.focusable===0,'Resize remeasures bounded isolated pools');
    report.records.push({resize:next,state:s});await capture(page,'portal-resize-'+next);
   }
  }
  await scrollChapter(page,'works',.3);await selectWork(page,'edura',width<1024);
  for(let cycle=0;cycle<3;cycle++) {
   await page.evaluate(()=>window.retiredRoot=motionQA.root.getState());
   await page.locator('#work-case-edura').click();await page.waitForURL('**/projects/edura');await page.waitForTimeout(1200);
   const retired=await page.evaluate(()=>({connected:retiredRoot.gl.domElement.isConnected,memory:{...retiredRoot.gl.info.memory},pools:document.querySelectorAll('[data-portal-trails]').length}));
   check(!retired.connected && retired.memory.geometries===0 && retired.memory.textures===0 && retired.pools===0,'Reader completely disposes scene and pools');
   await page.goBack();await ready(page);await page.waitForFunction(()=>document.activeElement.id==='work-target-edura');
   report.records.push({width,cycle,retired,back:await scene(page)});
  }
  await page.close();
 }
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(e.stack));await page.goto(base+'/3d-lab.html?story=1');await ready(page);
  await page.locator('[data-lab-controls] > summary').click();
  await page.locator('#lab-chapter').selectOption('experience');await page.waitForTimeout(700);
  const lab=await scene(page);check(lab.canvas===1 && lab.chapter==='experience','Lab native chapter uses shared renderer');
  check(await page.locator('[data-story-chapter="departure"]').count()===1,'Lab has one departure');
  await capture(page,'lab-experience-'+width);report.records.push({width,lab});await page.close();
 }
 check(report.errors.length===0,'No supplemental console/page error');report.status='pass';
} catch(error) {report.status='fail';report.failure=error.stack;const current=browser.contexts().flatMap(c=>c.pages()).at(-1);if(current){report.failureState=await scene(current).catch(()=>null);report.focus=await current.evaluate(()=>({id:document.activeElement.id,html:document.activeElement.outerHTML,hidden:document.hidden,menu:document.getElementById('stellar-menu')?.open,navInert:document.querySelector('[data-portal-controls]')?.inert})).catch(()=>null);await capture(current,'extras-failure').catch(()=>{})}process.exitCode=1;console.error(error.stack)}
finally {save('extras-results.json',report);await browser.close()}
console.log(JSON.stringify({status:report.status,checks:report.checks,failure:report.failure}));
