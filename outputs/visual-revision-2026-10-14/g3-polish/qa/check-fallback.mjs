import assert from 'node:assert/strict';
import {chromium,edge,base,capture,save} from './common.mjs';
const records=[],errors=[];
for(const mode of ['no-webgl','reduced']) {
 const browser=await chromium.launch({executablePath:edge,headless:true,args:mode==='no-webgl'?['--disable-webgl']:[]});
 try {for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(base+'#transmission',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!document.querySelector('[data-preloader]')&&!document.body.classList.contains('loading-lock'));
  await page.waitForFunction(()=>document.querySelector('[data-story-chapter="finale"]')?.getBoundingClientRect().height===0,undefined,{timeout:15000});await page.locator('#transmission').scrollIntoViewIfNeeded();await page.waitForTimeout(800);
  await page.locator('[data-contact-email]').focus();
  const state=await page.evaluate(()=>{const panel=document.querySelector('[data-contact-content]');return {width:innerWidth,canvas:document.querySelectorAll('canvas').length,opacity:+getComputedStyle(panel).opacity,inert:panel.inert,focus:document.activeElement.matches('[data-contact-email]'),finale:document.querySelector('[data-story-chapter="finale"]').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth-innerWidth}});
  assert(state.opacity===1&&!state.inert&&state.focus&&state.finale===0&&state.overflow===0,JSON.stringify(state));
  if(mode==='no-webgl')assert.equal(state.canvas,0);
  records.push({mode,...state});await capture(page,'contact-fallback-'+mode+'-'+width);await page.close();
 }}finally{await browser.close();}
}
assert.equal(errors.length,0,JSON.stringify(errors));save('fallback-results.json',{status:'pass',records,errors});console.log('Finale fallbacks: 4 cases passed');
