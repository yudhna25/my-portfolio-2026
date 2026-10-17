import assert from 'node:assert/strict';
import {chromium,edge,base,ready,capture,save,openingObserver} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true}),records=[],errors=[];
try{for(const width of [1440,390]){const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});await openingObserver(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
 for(const p of [.10,.24,.36,.48,.64,.90]){await page.waitForFunction(p=>+document.querySelector('[data-preloader]')?.dataset.openingProgress>=p,p,{timeout:15000});const actual=await page.locator('[data-preloader]').getAttribute('data-opening-progress');await capture(page,'opening-'+p+'-'+width);records.push({width,requested:p,actual:+actual})}
 await ready(page);await page.waitForTimeout(1200);await capture(page,'hero-no-outline-'+width);const outline=await page.locator('.hero-year-base').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).stroke));assert(outline.every(s=>s==='none'));records.push({width,frames:await page.evaluate(()=>openingQA.frames)});await context.close()}
 assert.equal(errors.length,0);save('opening-results.json',{status:'pass',method:'Natural timeline; screenshots include recorded progress and capture latency.',records,errors});console.log('Opening natural sequence passed')
}finally{await browser.close()}
