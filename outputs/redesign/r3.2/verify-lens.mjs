import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const path = name => new URL(name,import.meta.url).pathname.replace(/^\//,'');
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const result = {errors:[]};page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
try {
  await page.goto('http://127.0.0.1:5173/');await page.waitForSelector('canvas');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(3500);
  await page.evaluate(async()=>{const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);const fiber=await import(loaded('/@react-three_fiber.js'));const {gsap}=await import(loaded('/src/hooks/useGSAPSetup.js'));window.lensQA={...fiber,gsap,store:fiber._roots.get(document.querySelector('canvas')).store};});
  await page.mouse.move(470,270);await page.waitForTimeout(600);assert.equal(await page.locator('[data-cursor-lens]').getAttribute('data-active'),'true');
  const rect=await page.locator('[data-cursor-lens]').boundingBox();result.rect=rect;
  await page.evaluate(()=>{lensQA.store.getState().setFrameloop('never');lensQA.gsap.globalTimeline.pause();});await page.waitForTimeout(120);
  const cursorStyle=await page.addStyleTag({content:'.gsap-cursor-dot,.gsap-cursor-ring{visibility:hidden!important}'});
  await page.screenshot({path:path('screenshots/lens-filter-active.png')});
  // Keep the same compositor layer; removing backdrop-filter also changes text AA outside the lens.
  await page.locator('#cursor-gravity feDisplacementMap').evaluate(el=>el.setAttribute('scale','0'));
  await page.screenshot({path:path('screenshots/lens-filter-disabled.png')});
  await page.locator('#cursor-gravity feDisplacementMap').evaluate(el=>el.setAttribute('scale','6'));await cursorStyle.evaluate(el=>el.remove());
  await page.evaluate(()=>{lensQA.gsap.globalTimeline.resume();lensQA.store.getState().setFrameloop('always');});
  await page.mouse.move(20,30);await page.waitForTimeout(200);assert.equal(await page.locator('[data-cursor-lens]').getAttribute('data-active'),'false');
  result.benchmark=await page.evaluate(async()=>{let frames=0;const start=performance.now(),stop=lensQA.addAfterEffect(()=>frames++);await new Promise(r=>setTimeout(r,2200));stop();const f=lensQA.store.getState(),gl=f.gl.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return{frames,elapsedMs:performance.now()-start,fps:frames*1000/(performance.now()-start),dpr:f.gl.getPixelRatio(),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),visible:!document.hidden,viewport:[innerWidth,innerHeight]};});
  const touch=await browser.newPage({viewport:{width:1440,height:900},hasTouch:true,isMobile:true});await touch.goto('http://127.0.0.1:5173/');await touch.waitForSelector('canvas');await touch.waitForTimeout(3300);
  result.touch={cursor:await touch.locator('[data-custom-cursor]').count(),lens:await touch.locator('[data-cursor-lens]').count()};assert.equal(result.touch.cursor,0);assert.equal(result.touch.lens,0);
  assert.equal(result.errors.length,0);console.log('PASS: native scoped lens snapshots, touch guard and render cadence captured.');
} finally {writeFileSync(path('lens-results.json'),JSON.stringify(result,null,2)+'\n');await browser.close();}
