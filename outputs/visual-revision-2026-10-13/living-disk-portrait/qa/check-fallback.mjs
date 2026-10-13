import assert from 'node:assert/strict';
import {chromium,edge,base,capture,save} from './common.mjs';
const records=[],errors=[];
for(const mode of ['no-webgl','reduced']) {
 const browser=await chromium.launch({executablePath:edge,headless:true,args:mode==='no-webgl'?['--disable-webgl']:[]});
 try {for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(base+'#about');
  await page.waitForFunction(()=>!document.querySelector('[data-preloader]')&&!document.body.classList.contains('loading-lock'));
  await page.locator('[data-portrait]').scrollIntoViewIfNeeded();await page.waitForTimeout(650);
  await page.locator('[data-portrait]').focus();
  const state=await page.evaluate(()=>{const button=document.querySelector('[data-portrait]'),img=button.querySelector('img');return {width:innerWidth,canvas:document.querySelectorAll('canvas').length,opacity:+getComputedStyle(img).opacity,loaded:img.complete&&img.naturalWidth>0,visible:getComputedStyle(document.getElementById('about')).visibility,focus:document.activeElement===button,inert:!!button.closest('[inert]'),portal:document.querySelector('[data-story-chapter="portal"]').getBoundingClientRect().height,viewport:innerHeight,overflow:document.documentElement.scrollWidth-innerWidth};});
  assert(state.opacity===1&&state.loaded&&state.visible==='visible'&&state.focus&&!state.inert&&state.portal<=state.viewport*1.1&&state.overflow===0,JSON.stringify(state));
  if(mode==='no-webgl')assert.equal(state.canvas,0);
  records.push({mode,...state});await capture(page,'portrait-fallback-'+mode+'-'+width);await page.close();
 }}finally{await browser.close();}
}
assert.equal(errors.length,0,JSON.stringify(errors));save('fallback-results.json',{status:'pass',records,errors});console.log('Portrait fallbacks: 4 cases passed');
