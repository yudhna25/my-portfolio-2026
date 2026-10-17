import assert from 'node:assert/strict';
import {chromium,edge,base,ready,openingObserver,openingSummary,capture,save} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true}),records=[];
try {
 for(const mode of ['hidden-resize','live-reduced']) {
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});await openingObserver(context);
  const page=await context.newPage();page.on('pageerror',e=>records.push({error:e.message}));await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>+document.querySelector('[data-preloader]')?.dataset.openingProgress>.15);
  if(mode==='hidden-resize') {
   const hold=await page.evaluate(async()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
    const before=+document.querySelector('[data-preloader]').dataset.openingProgress;await new Promise(r=>setTimeout(r,1200));
    const after=+document.querySelector('[data-preloader]').dataset.openingProgress;delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return {before,after};
   });assert.equal(hold.before,hold.after);await page.setViewportSize({width:390,height:844});await ready(page);await page.waitForTimeout(750);
   const summary=openingSummary(await page.evaluate(()=>openingQA));
   const join=await page.evaluate(()=>{const u=motionQA.root.getState().scene.getObjectByName('accretion-disk').material.uniforms,a=document.querySelector('[data-story-anchor="portal"]').getBoundingClientRect();return {active:u.uOpening.value.x,error:Math.hypot(u.uPortalCenter.value.x*innerWidth-a.left-a.width/2,(1-u.uPortalCenter.value.y)*innerHeight-a.top-a.height/2),ratio:u.uPortalRadius.value.x/(a.height*2.8)}});
   assert.equal(join.active,0);assert(join.error<1&&Math.abs(join.ratio-1)<.001);summary.shaderJoin=join;
   records.push({mode,hold,summary});await capture(page,'opening-resize-complete');
  } else {
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>!document.querySelector('[data-preloader]')&&!document.body.classList.contains('loading-lock'));
   await page.emulateMedia({reducedMotion:'no-preference'});try{await ready(page)}catch(error){save('opening-live-diagnostic.json',{records,availability:await page.evaluate(()=>window.qaAvailability),dom:await page.evaluate(()=>({canvas:document.querySelectorAll('canvas').length,body:document.body.innerText.slice(0,800),hero:document.querySelector('[data-portal-stage]')?.dataset,scene:document.querySelector('[data-galaxy-scene]')?.dataset})),error:error.stack});await capture(page,'opening-live-diagnostic');throw error}assert.equal(await page.locator('[data-preloader]').count(),0);records.push({mode,loader:0});
  }
  await context.close();
 }
 save('opening-lifecycle.json',{status:'pass',records,limits:['document.hidden and OS media preference were simulated in Edge.']});console.log('Opening lifecycle 2/2 pass');
}finally{await browser.close()}
