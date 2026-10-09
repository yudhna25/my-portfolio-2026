import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const result={fixture:'outputs/redesign/r4.2/lifecycle.html (existing App fixture)',errors:[],cycles:[],motionCycles:[]};
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',error=>result.errors.push(String(error)));
  await page.goto('http://127.0.0.1:5173/outputs/redesign/r4.2/lifecycle.html?reader-preview=edura',{waitUntil:'networkidle'});
  await page.evaluate(async()=>{window.readerQA=(await import('/src/hooks/useGSAPSetup.js')).gsap;});
  await page.waitForTimeout(900);
  const sample=()=>page.evaluate(()=>{
    window.readerTargets=[...new Set([...(window.readerTargets??[]),...document.querySelectorAll('[data-reader-intro]')])];
    return {reader:document.querySelectorAll('[data-edura-reader]').length,canvas:document.querySelectorAll('canvas').length,tweens:window.readerQA.globalTimeline.getChildren(true,true,false).filter(t=>t.targets().some(target=>window.readerTargets.includes(target))).length,allTweens:window.readerQA.globalTimeline.getChildren(true,true,false).map(t=>({targets:t.targets().map(target=>target.tagName??typeof target),duration:t.duration()})),opacity:[...document.querySelectorAll('[data-reader-intro]')].map(el=>getComputedStyle(el).opacity)};
  });
  for(let cycle=1;cycle<=3;cycle++){
    await page.evaluate(()=>window.unmountApp());await page.waitForTimeout(100);
    const unmounted=await sample();assert.equal(unmounted.reader,0);assert.equal(unmounted.canvas,0);assert.equal(unmounted.tweens,0);
    await page.evaluate(()=>window.mountApp());await page.waitForTimeout(50);
    const active=await sample();assert(active.tweens>0);
    await page.evaluate(()=>window.unmountApp());await page.waitForTimeout(100);
    const cancelled=await sample();assert.equal(cancelled.tweens,0);assert.equal(cancelled.reader,0);
    await page.evaluate(()=>window.mountApp());await page.waitForTimeout(800);
    const mounted=await sample();assert.equal(mounted.reader,1);assert.equal(mounted.canvas,0);assert(mounted.opacity.every(value=>value==='1'));
    result.cycles.push({cycle,unmounted,active,cancelled,mounted});
  }
  for(let cycle=1;cycle<=3;cycle++){
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
    const reduced=await sample();assert.equal(reduced.tweens,0);assert(reduced.opacity.every(value=>value==='1'));
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(800);
    const normal=await sample();assert(normal.opacity.every(value=>value==='1'));
    result.motionCycles.push({cycle,reduced,normal});
  }
  await page.evaluate(()=>window.unmountApp());await page.waitForTimeout(100);result.final=await sample();assert.equal(result.final.tweens,0);assert.equal(result.errors.length,0);
  result.browser=browser.version();result.status='pass';
}finally{await browser.close();fs.writeFileSync('outputs/redesign/r6.1/lifecycle.json',JSON.stringify(result,null,2));}
console.log(JSON.stringify(result,null,2));
