import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r4.3',result={started:new Date().toISOString(),states:[],errors:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 for(const [width,motion] of [[1440,'no-preference'],[390,'reduce']]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:motion});page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
  await page.goto('http://127.0.0.1:5173/#hero');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.waitForSelector('canvas');await page.waitForTimeout(1200);
  await page.evaluate(async()=>{const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=name=>urls.filter(u=>u.includes(name)).at(-1);const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));const {default:i18n}=await import(loaded('/src/i18n/config.js'));const {_roots}=await import(loaded('/@react-three_fiber.js'));const {storyCameraPath}=await import(loaded('/src/3d/utils/cameraPath.js'));window.qa={useScrollStore,i18n,fiber:_roots.get(document.querySelector('canvas')).store,storyCameraPath};});
  for(const locale of ['vi','en']){
   await page.evaluate(l=>qa.i18n.changeLanguage(l),locale);
   for(const hash of ['hero','about','skills','education']){
    await page.evaluate(hash=>{location.hash=hash;},hash);await page.waitForTimeout(250);
    const state=await page.evaluate(()=>{const s=qa.useScrollStore.getState(),f=qa.fiber.getState(),p=qa.storyCameraPath(s.storyChapter,s.chapterProgress,{},matchMedia('(prefers-reduced-motion: reduce)').matches,innerWidth/innerHeight);return{chapter:s.storyChapter,p:s.chapterProgress,manual:s.storyManual,canvas:document.querySelectorAll('canvas').length,heroOpacity:+getComputedStyle(document.querySelector('[data-portal-stage]')).opacity,inert:document.querySelector('[data-story-content]').inert,poseError:Math.max(Math.abs(p.x-f.camera.position.x),Math.abs(p.y-f.camera.position.y),Math.abs(p.z-f.camera.position.z)),glError:f.gl.getContext().getError(),lang:document.documentElement.lang,year:document.querySelector('[data-hero-year]').getAttribute('aria-label')};});
    assert.equal(state.chapter,hash);assert.equal(state.manual,false);assert.equal(state.canvas,1);assert.equal(state.lang,locale);assert.equal(state.year,'2026');assert.equal(state.heroOpacity,hash==='hero'?1:0);assert.equal(state.inert,hash==='hero');assert.equal(state.glError,0);assert.equal(state.poseError,0);result.states.push({width,motion,hash,...state});
   }
  }
  await page.close();
 }
 assert.deepEqual(result.errors,[]);result.status='PASS';result.finished=new Date().toISOString();fs.writeFileSync(out+'/regression-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:'PASS',states:result.states.length,errors:result.errors}));
}catch(e){result.failure=e.stack;fs.writeFileSync(out+'/regression-failure.json',JSON.stringify(result,null,2));throw e;}finally{await browser.close();}
