import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r3.3',result={started:new Date().toISOString(),errors:[],warnings:[],portrait:[],intro:{},touch:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());if(m.type()==='warning')result.warnings.push(m.text());});
const filter=()=>page.locator('.avatar-img').evaluate(el=>getComputedStyle(el).filter);
try {
 await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
 await page.evaluate(async()=>{
  const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);
  const {gsap,ScrollSmoother}=await import(loaded('/src/hooks/useGSAPSetup.js'));
  const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));
  const {default:i18n}=await import(loaded('/src/i18n/config.js'));
  const fiber=await import(loaded('/@react-three_fiber.js'));
  window.qa={gsap,ScrollSmoother,useScrollStore,i18n,fiber,intro:gsap.getById('about-introduction'),store:fiber._roots.get(document.querySelector('canvas')).store};
 });
 result.intro.before=await page.evaluate(()=>({paused:qa.intro.paused(),progress:qa.intro.progress(),decodeDurations:qa.intro.getChildren().filter(t=>t.vars.scrambleText).map(t=>t.duration()),fullDuration:qa.intro.duration()}));
 assert.equal(result.intro.before.paused,true);assert.deepEqual(result.intro.before.decodeDurations,[.9,.9,.9]);
 await page.evaluate(()=>{
  qa.layoutStart=[...document.querySelectorAll('[data-about-bio]')].map(e=>[e.offsetTop,e.offsetHeight,e.offsetWidth]);qa.decodeStart=performance.now();qa.decodeFrames=[];qa.layoutShifts=[];
  qa.observer=new PerformanceObserver(list=>qa.layoutShifts.push(...list.getEntries().map(e=>({value:e.value,recent:e.hadRecentInput}))));qa.observer.observe({type:'layout-shift',buffered:false});
  qa.stop=qa.gsap.ticker.add(()=>{if(qa.useScrollStore.getState().storyChapter==='about')qa.decodeFrames.push({ms:performance.now()-qa.decodeStart,p:qa.intro.progress(),opacity:[...document.querySelectorAll('[data-about-bio]')].map(e=>+getComputedStyle(e).opacity),accessible:document.querySelector('#about-heading').getAttribute('aria-label')});});
 });
 await page.locator('nav a[href="#about"]').first().click();await page.waitForTimeout(1300);
 result.intro.after=await page.evaluate(()=>{
  qa.gsap.ticker.remove(qa.stop);qa.observer.disconnect();
  const normalize=s=>s.replace(/\s+/g,' ').trim(),semantic=e=>{const copy=e.cloneNode(true);copy.querySelectorAll('[aria-hidden="true"]').forEach(n=>n.remove());return normalize(copy.textContent);};
  return{progress:qa.intro.progress(),frames:qa.decodeFrames.length,minBioOpacity:Math.min(...qa.decodeFrames.flatMap(f=>f.opacity)),names:[...new Set(qa.decodeFrames.map(f=>f.accessible))],layoutStart:qa.layoutStart,layoutEnd:[...document.querySelectorAll('[data-about-bio]')].map(e=>[e.offsetTop,e.offsetHeight,e.offsetWidth]),layoutShifts:qa.layoutShifts,visual:[...document.querySelectorAll('[data-about-decode]')].map(e=>e.textContent),semanticBios:[...document.querySelectorAll('#about p[data-about-bio]')].map(semantic),expectedBios:[qa.i18n.t('about.bioFirst'),qa.i18n.t('about.bioSecond')].map(normalize),ariaName:document.querySelector('#about-heading').getAttribute('aria-label'),expectedName:qa.i18n.t('hero.name')};
 });
 assert.equal(result.intro.after.progress,1);assert.ok(result.intro.after.minBioOpacity>=.79);assert.equal(result.intro.after.frames>20,true);assert.deepEqual(result.intro.after.layoutEnd,result.intro.after.layoutStart);assert.deepEqual(result.intro.after.semanticBios,result.intro.after.expectedBios);assert.deepEqual(result.intro.after.names,[result.intro.after.expectedName]);
 assert.deepEqual(result.intro.after.visual,['TRẦN VŨ','ANH DUY','Thiết kế không chỉ là hình ảnh — nó là cách giải quyết vấn đề.']);
 const button=page.locator('#about button');await page.mouse.move(20,80);await page.waitForTimeout(350);assert.equal(await filter(),'grayscale(1)');
 const geometry=await button.boundingBox();assert.ok(geometry.width>=44&&geometry.height>=44);
 await button.hover();await page.waitForTimeout(350);assert.equal(await filter(),'grayscale(0)');await page.screenshot({path:`${out}/screenshots/portrait-hover.png`});result.portrait.push({type:'hover',filter:await filter()});
 await page.mouse.move(20,80);await page.waitForTimeout(350);assert.equal(await filter(),'grayscale(1)');
 await page.locator('#about').evaluate(e=>{e.tabIndex=-1;e.focus({preventScroll:true});});await page.keyboard.press('Tab');await page.waitForTimeout(350);
 assert.equal(await button.evaluate(e=>e===document.activeElement),true);assert.equal(await filter(),'grayscale(0)');result.portrait.push({type:'nativeTab',filter:await filter(),focus:true});
 await page.keyboard.press('Enter');assert.equal(await button.getAttribute('aria-pressed'),'true');await page.keyboard.press('Space');assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await button.evaluate(e=>e===document.activeElement),true);result.portrait.push({type:'nativeEnterSpace',preservedFocus:true});
 await page.keyboard.press('Enter');await page.keyboard.press('Escape');assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await button.evaluate(e=>e===document.activeElement),true);
 await page.evaluate(()=>qa.i18n.changeLanguage('en'));await page.waitForTimeout(1200);assert.equal(await button.evaluate(e=>e===document.activeElement),true);assert.equal(await button.getAttribute('aria-label'),'Keep portrait in color');result.portrait.push({type:'localeFocus',lang:'en',preservedFocus:true});
 await page.keyboard.press('Tab');await page.waitForTimeout(350);assert.equal(await button.evaluate(e=>e===document.activeElement),false);assert.equal(await filter(),'grayscale(1)');
 // Pause a newly rebuilt introduction while hidden; only its visual spans may decode.
 await page.evaluate(()=>{qa.useScrollStore.getState().setStoryPosition('hero',0,0,true);return qa.i18n.changeLanguage('vi');});await page.waitForTimeout(120);
 await page.evaluate(()=>{qa.intro=qa.gsap.getById('about-introduction');qa.useScrollStore.getState().setStoryPosition('about',0,0,true);});await page.waitForTimeout(120);
 result.intro.hidden=await page.evaluate(async()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));const before=qa.intro.progress();await new Promise(r=>setTimeout(r,350));const after=qa.intro.progress(),paused=qa.intro.paused();delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return{simulated:true,before,after,paused};
 });assert.equal(result.intro.hidden.after,result.intro.hidden.before);assert.equal(result.intro.hidden.paused,true);
 await page.evaluate(()=>qa.useScrollStore.getState().setStoryPosition('skills',0,0,true));const p=await page.evaluate(()=>qa.intro.progress());await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>qa.intro.progress()),p);result.intro.offscreen={paused:true};
 await page.evaluate(()=>qa.useScrollStore.getState().setStoryPosition('about',0,0,true));await page.waitForTimeout(1100);
 // Compare compositing with/without the image at a held scene frame; source alpha is audited separately.
 await page.evaluate(()=>{const y=document.getElementById('about').getBoundingClientRect().top-document.querySelector('main').getBoundingClientRect().top;const smoother=qa.ScrollSmoother.get();if(smoother)smoother.scrollTop(y);else scrollTo(0,y);});await page.waitForTimeout(500);
 await page.mouse.move(20,80);await page.evaluate(()=>qa.store.getState().setFrameloop('never'));await page.waitForTimeout(100);
 await page.screenshot({path:`${out}/screenshots/alpha-image.png`});await page.locator('.avatar-img').evaluate(e=>{e.style.visibility='hidden';});await page.screenshot({path:`${out}/screenshots/alpha-background.png`});await page.locator('.avatar-img').evaluate(e=>{e.style.removeProperty('visibility');});await page.evaluate(()=>qa.store.getState().setFrameloop('always'));
 result.alpha={rect:await button.boundingBox(),heldScene:true};
 for(const motion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:motion});const touch=await context.newPage();touch.on('pageerror',e=>result.errors.push(e.message));touch.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
  await touch.goto('http://127.0.0.1:5173/#about');await touch.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await touch.waitForTimeout(1250);
  const b=touch.locator('#about button'),f=()=>touch.locator('.avatar-img').evaluate(e=>getComputedStyle(e).filter);assert.equal(await f(),'grayscale(1)');
  await b.tap();await touch.waitForTimeout(350);assert.equal(await b.getAttribute('aria-pressed'),'true');assert.equal(await f(),'grayscale(0)');
  await touch.screenshot({path:`${out}/screenshots/touch-color-${motion}.png`});await b.tap();await touch.waitForTimeout(350);assert.equal(await b.getAttribute('aria-pressed'),'false');assert.equal(await f(),'grayscale(1)');
  result.touch.push({motion,firstTap:'color',secondTap:'grayscale',hover:await touch.evaluate(()=>matchMedia('(hover:hover)').matches),focusVisible:await b.evaluate(e=>e.matches(':focus-visible')),canvas:await touch.locator('canvas').count()});await context.close();
 }
 result.finished=new Date().toISOString();assert.equal(result.errors.length,0);fs.writeFileSync(`${out}/interaction-results.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({introFrames:result.intro.after.frames,minBioOpacity:result.intro.after.minBioOpacity,portrait:result.portrait,touch:result.touch,errors:result.errors}));
}catch(error){result.failure=error.stack;fs.writeFileSync(`${out}/interaction-failure.json`,JSON.stringify(result,null,2));throw error;}finally{await browser.close();}
