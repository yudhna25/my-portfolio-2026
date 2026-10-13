import assert from 'node:assert/strict';
import {chromium,edge,base,ready,scrollChapter,scene,capture,save} from './common.mjs';
const settle=async()=>{await page.waitForFunction(async()=>{const p=motionQA.store.getState().chapterProgress;await new Promise(r=>setTimeout(r,250));return p===motionQA.store.getState().chapterProgress});await page.waitForTimeout(100)};
const b=await chromium.launch({executablePath:edge,headless:true}),page=await b.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
try {
 await page.goto(base);await ready(page);
 await page.waitForFunction(()=>document.querySelector('[data-year-digit]').dataset.digit==='7',undefined,{timeout:20000});
 const began=Date.now();await capture(page,'hero-glitch-7');
 await page.waitForFunction(()=>document.querySelector('[data-year-digit]').dataset.digit==='6',undefined,{timeout:5000});
 const dwell=Date.now()-began;assert(dwell>=3000&&dwell<=3700);
 await scrollChapter(page,'portal',.25);for(const distance of [600,-900,900,-600]){await page.mouse.wheel(0,distance);await page.waitForTimeout(30)}await scrollChapter(page,'portal',.25);await settle();const a=await scene(page);await page.waitForTimeout(600);const held=await scene(page);
 assert.deepEqual(a.camera,held.camera);assert.deepEqual(a.copies.layers.map(l=>l.samples),held.copies.layers.map(l=>l.samples));
 await scrollChapter(page,'experience',.5);await settle();const c=await scene(page);await page.waitForTimeout(600);const d=await scene(page);
 assert.deepEqual(c.meteor.positions,d.meteor.positions);assert.equal(c.meteor.journey,d.meteor.journey);
 save('hold-glitch.json',{status:'pass',dwellMs:dwell,portalHeldMs:600,cometHeldMs:600,ambient:'Background/twinkle remain ambient; story pose and trails held.'});console.log('Glitch dwell and story hold pass');
}finally{await b.close()}
