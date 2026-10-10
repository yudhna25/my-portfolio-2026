import fs from 'node:fs';import assert from 'node:assert/strict';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/visual-revision-2026-10-09/v7',url='http://127.0.0.1:5173/'+out+'/qa.html';
const report={cases:[],errors:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
async function boot(options={}){const page=await browser.newPage(options);page.on('pageerror',e=>report.errors.push(e.stack));await page.goto(url);await page.waitForFunction(()=>window.v7QA?.layoutRef.current.ready);await page.waitForTimeout(200);return page}
async function scene(page){await page.evaluate(async()=>{const loaded=performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name;window.extraScene=(await import(loaded))._roots.get(document.querySelector('canvas')).store.getState()})}
try{
 const page=await boot({viewport:{width:1440,height:900}});await scene(page);
 const cycles=[];
 for(let i=0;i<3;i++){
  await scene(page);const before=await page.evaluate(()=>({memory:{...extraScene.gl.info.memory},ready:v7QA.layoutRef.current.ready}));
  await page.evaluate(()=>{window.retired=extraScene;v7QA.setSceneVisible(false)});await page.waitForTimeout(400);
  const after=await page.evaluate(()=>({memory:{...retired.gl.info.memory},canvas:document.querySelectorAll('canvas').length,ready:v7QA.layoutRef.current.ready,subscriber:typeof v7QA.layoutRef.current.onChange}));
  assert.equal(after.canvas,0);assert.equal(after.ready,false);assert.equal(after.memory.geometries,0);assert(after.memory.textures<=1);
  await page.evaluate(()=>v7QA.setSceneVisible(true));await page.waitForFunction(()=>v7QA.layoutRef.current.ready&&document.querySelector('canvas'));await page.waitForTimeout(300);await scene(page);
  const restored=await page.evaluate(()=>({...extraScene.gl.info.memory}));assert.equal(restored.geometries,before.memory.geometries);assert.equal(restored.textures,before.memory.textures);cycles.push({before,after,restored});
 }
 report.cases.push({name:'3 Canvas lifecycle/disposal cycles',passed:true,cycles});
 await page.evaluate(()=>v7QA.store.getState().setSceneFallback(true));await page.waitForTimeout(100);
 const fallbackDOM=await page.evaluate(()=>[...document.querySelectorAll('[data-work-target]')].map(el=>({rect:el.getBoundingClientRect().toJSON(),hidden:el.hidden,transform:el.style.transform,width:el.style.width,height:el.style.height})));
 for(const b of fallbackDOM){assert.equal(b.hidden,false);assert.equal(b.transform,'');assert.equal(b.width,'');assert.equal(b.height,'');assert(b.rect.width>=44&&b.rect.height>=44)}
 await page.evaluate(()=>v7QA.store.getState().setSceneFallback(false));await page.waitForTimeout(100);
 const restoredDOM=await page.evaluate(()=>[...document.querySelectorAll('[data-work-target]')].every(el=>el.getBoundingClientRect().width>44));assert.equal(restoredDOM,true);
 report.cases.push({name:'semantic fallback clears projected transforms and restores them',passed:true,fallbackDOM});
 await page.evaluate(()=>v7QA.progress.current.seek('departure',.2,false));await page.waitForFunction(()=>!v7QA.layoutRef.current.ready);
 await page.keyboard.press('Tab');await page.locator('#work-target-edura').focus();
 await page.waitForFunction(()=>v7QA.store.getState().storyChapter==='works'&&v7QA.layoutRef.current.ready);
 const entry=await page.evaluate(()=>({focus:document.activeElement.id,chapter:v7QA.store.getState().storyChapter,p:v7QA.store.getState().chapterProgress,target:document.querySelector('[data-work-preview]').dataset.active}));
 assert.equal(entry.focus,'work-target-edura');assert.equal(entry.target,'edura');assert(entry.p<.01);
 report.cases.push({name:'native keyboard entry from preceding chapter',passed:true,entry});
 await page.keyboard.press('Escape');
 const fps=await page.evaluate(async()=>{
  const gl=extraScene.gl.getContext(),names=['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced'];const originals=new Map();let draws=0,frames=0,totalDraws=0,empty=0;
  for(const name of names){const original=gl[name];if(!original)continue;originals.set(name,original);gl[name]=function(...args){draws++;return original.apply(this,args)}}
  const loaded=performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name;
  const stop=(await import(loaded)).addAfterEffect(()=>{if(draws)frames++;else empty++;totalDraws+=draws;draws=0});const start=performance.now();await new Promise(r=>setTimeout(r,2500));stop();for(const [name,original]of originals)gl[name]=original;
  return {frames,empty,totalDraws,duration:performance.now()-start,fps:frames*1000/(performance.now()-start),drawsPerFrame:totalDraws/frames};
 });assert(fps.frames>0);assert.equal(fps.empty,0);report.cases.push({name:'actual GL draw-backed frame counter',passed:true,value:fps});
 await page.evaluate(async()=>{const {createWorksOrbit}=await import('/src/3d/utils/worksOrbit.js');v7QA.store.setState({worksOrbit:createWorksOrbit(),worksSelection:null,worksFocus:null,worksHover:null,worksFinaleSelection:null});v7QA.store.getState().setStoryPosition('finale',.25,.8,true)});await page.waitForTimeout(100);
 const deep=await page.evaluate(()=>({orbit:{...v7QA.store.getState().worksOrbit},positions:['edura','veris','vie'].map(id=>extraScene.scene.getObjectByName('works-'+id).position.toArray())}));assert.equal(deep.orbit.origin,0);assert.equal(deep.orbit.captures,1);
 await page.evaluate(()=>v7QA.store.getState().setStoryPosition('finale',.8,.8,true));await page.waitForTimeout(40);await page.evaluate(()=>v7QA.store.getState().setStoryPosition('finale',.25,.8,true));await page.waitForTimeout(40);
 const reversed=await page.evaluate(()=>({orbit:{...v7QA.store.getState().worksOrbit},positions:['edura','veris','vie'].map(id=>extraScene.scene.getObjectByName('works-'+id).position.toArray())}));assert.deepEqual(reversed,deep);report.cases.push({name:'deterministic fresh finale seed/reverse',passed:true,deep});await page.close();
 const staticPage=await boot({viewport:{width:390,height:844},reducedMotion:'reduce'});await scene(staticPage);
 const pose=await staticPage.evaluate(()=>({phase:v7QA.store.getState().worksOrbit.phase,positions:['edura','veris','vie'].map(id=>extraScene.scene.getObjectByName('works-'+id).position.toArray())}));await staticPage.waitForTimeout(400);const still=await staticPage.evaluate(()=>({phase:v7QA.store.getState().worksOrbit.phase,positions:['edura','veris','vie'].map(id=>extraScene.scene.getObjectByName('works-'+id).position.toArray())}));assert.deepEqual(pose,still);report.cases.push({name:'fresh reduced boot',passed:true,pose});await staticPage.close();
 const failed=await browser.newPage({viewport:{width:390,height:844}});failed.on('pageerror',e=>report.errors.push(e.stack));await failed.route('**/constellations/*.svg',r=>r.fulfill({status:404,body:'intentional V7 asset failure'}));await failed.goto(url);await failed.waitForFunction(()=>window.v7QA?.layoutRef.current.ready);await failed.waitForTimeout(200);await scene(failed);
 const fallback=await failed.evaluate(()=>({visible:extraScene.scene.getObjectByName('works-constellations').visible,opacity:['edura','veris','vie'].map(id=>extraScene.scene.getObjectByName('works-'+id).children[2].material.opacity),targets:[...document.querySelectorAll('[data-work-target]')].map(el=>!el.hidden)}));assert.equal(fallback.visible,true);assert.deepEqual(fallback.opacity,[0,0,0]);assert.deepEqual(fallback.targets,[true,true,true]);report.cases.push({name:'artwork 404 leaves stars/semantic controls usable',passed:true,expected404:true,fallback});await failed.close();
}catch(e){report.failure=e.stack;console.error(e.stack)}finally{fs.writeFileSync(out+'/extra-results.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log(JSON.stringify({cases:report.cases.length,failure:report.failure,errors:report.errors}));if(report.failure||report.errors.length)process.exitCode=1;
