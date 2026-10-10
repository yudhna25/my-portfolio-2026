import fs from 'node:fs';import assert from 'node:assert/strict';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/visual-revision-2026-10-09/v7';
const report={scope:'Existing production fallback controls + R6.2 route; projected-figure wiring remains V8',cases:[],errors:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
async function state(page){return page.evaluate(()=>{const {useScrollStore,ScrollSmoother}=routeProbe;const s=useScrollStore.getState();return {url:location.pathname,chapter:s.storyChapter,p:s.chapterProgress,selection:s.worksSelection,orbit:{...s.worksOrbit},y:ScrollSmoother.get()?.scrollTop()??scrollY,focus:document.activeElement.id,canvas:document.querySelectorAll('canvas').length,smoother:!!ScrollSmoother.get(),history:history.state}})}
try{
 for(const [width,height]of [[390,844],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.stack));
  await page.goto('http://127.0.0.1:5173/#work');
  await page.waitForFunction(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('/src/stores/useScrollStore.js')));
  await page.evaluate(async()=>{
    const loaded=name=>performance.getEntriesByType('resource').map(e=>e.name).filter(url=>url.includes(name)).at(-1);
    const storeURL=loaded('/src/stores/useScrollStore.js'),gsapURL=loaded('/src/hooks/useGSAPSetup.js');
    window.routeProbe={useScrollStore:(await import(storeURL)).useScrollStore,ScrollSmoother:(await import(gsapURL)).ScrollSmoother,storeURL};
  });
  await page.waitForFunction(()=>routeProbe.useScrollStore.getState().storyChapter==='works'&&!document.querySelector('[data-preloader]'));
  await page.locator('#work-target-edura').click();await page.waitForTimeout(1300);const before=await state(page);
  await page.locator('#work-case-edura').click();await page.waitForURL('**/projects/edura');await page.waitForTimeout(250);const reader=await state(page);assert.equal(reader.canvas,0);assert.equal(reader.smoother,false);
  await page.goBack();await page.waitForFunction(()=>document.activeElement.id==='work-target-edura');const after=await state(page);
  report.diagnostic={width,before,reader,after};
  await page.waitForTimeout(750);report.diagnostic.settled=await state(page);
  assert.equal(after.chapter,'works');assert.equal(after.selection,'edura');assert.equal(after.canvas,1);assert.equal(after.focus,'work-target-edura');assert(Math.abs(after.p-before.p)<.003);assert(Math.abs(after.y-before.y)<1);assert(Math.abs(after.orbit.phase-before.orbit.phase)<.00001);
  await page.screenshot({path:`${out}/production-back-fallback-${width}.png`});report.cases.push({width,passed:true,before,reader,after});await page.close();
 }
}catch(e){report.failure=e.stack;console.error(e.stack)}finally{fs.writeFileSync(out+'/route-results.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log(JSON.stringify({cases:report.cases.length,failure:report.failure,errors:report.errors}));if(report.failure||report.errors.length)process.exitCode=1;
