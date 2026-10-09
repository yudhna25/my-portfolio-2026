import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r3.2',result={started:new Date().toISOString(),benchmarks:[],production:[],errors:[],warnings:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage();
page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());if(m.type()==='warning')result.warnings.push(m.text());});
try{
 await page.goto('http://127.0.0.1:5173/');await page.waitForTimeout(3800);await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async()=>{
  const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);
  const fiber=await import(loaded('/@react-three_fiber.js'));
  const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));
  const {gsap,ScrollSmoother}=await import(loaded('/src/hooks/useGSAPSetup.js'));
  const {storyCameraPath}=await import(loaded('/src/3d/utils/cameraPath.js'));
  const {portalState,portalProgress}=await import(loaded('/src/3d/utils/portal.js'));
  const store=fiber._roots.get(document.querySelector('canvas')).store,gl=store.getState().gl,render=gl.render.bind(gl),set=gl.setRenderTarget.bind(gl);
  const targets=new Set(),rayIds=new Set();window.qa={...fiber,useScrollStore,store,gsap,ScrollSmoother,storyCameraPath,portalState,portalProgress,targets,rayIds};
  gl.setRenderTarget=t=>{if(t&&!targets.has(t)){targets.add(t);t.addEventListener('dispose',()=>targets.delete(t));}return set(t);};
  gl.render=(scene,camera)=>{const uniforms=scene.children[0]?.material?.uniforms;if(uniforms?.uObserver){qa.rayUniforms=uniforms;qa.target=gl.getRenderTarget();rayIds.add(qa.target.texture.uuid);qa.rayCalls=(qa.rayCalls??0)+1;}return render(scene,camera);};
 });
 for(const p of [.25,.75]){
  await page.evaluate(p=>qa.useScrollStore.getState().setStoryPosition('portal',p,0,true),p);await page.waitForTimeout(250);
  const metrics=await page.evaluate(()=>new Promise(resolve=>{
   const start=performance.now(),rayStart=qa.rayCalls;let frames=0;
   const dispose=qa.addAfterEffect(()=>frames++);
   setTimeout(()=>{dispose();const f=qa.store.getState(),gl=f.gl.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');resolve({frames,ms:performance.now()-start,fps:frames*1000/(performance.now()-start),rayCalls:qa.rayCalls-rayStart,targets:qa.targets.size,rayIds:[...qa.rayIds],dpr:f.gl.getPixelRatio(),size:[innerWidth,innerHeight],gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),gpuTimerSupported:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')});},3000);
  }));
  const hdr=await page.evaluate(()=>{
   const f=qa.store.getState(),t=qa.target,bytes=new Uint16Array(t.width*t.height*4);f.gl.readRenderTargetPixels(t,0,0,t.width,t.height,bytes);
   let nonfinite=0,nonzero=0,nonmono=0;for(let i=0;i<bytes.length;i+=4){for(let j=0;j<4;j++){if((bytes[i+j]&0x7c00)===0x7c00)nonfinite++;if(bytes[i+j]!==0)nonzero++;}if(bytes[i]!==bytes[i+1]||bytes[i+1]!==bytes[i+2])nonmono++;}
   return{size:[t.width,t.height],components:bytes.length,nonfinite,nonzero,nonmono,glError:f.gl.getContext().getError()};
  });
  assert.equal(hdr.nonfinite,0);assert.equal(hdr.nonmono,0);assert.ok(hdr.nonzero>0);assert.equal(hdr.glError,0);assert.equal(metrics.rayIds.length,1);assert.ok(Math.abs(metrics.frames-metrics.rayCalls)<=1);
  result.benchmarks.push({p,...metrics,hdr});
 }
 result.legacyContact=await page.evaluate(async()=>{
  const s=qa.useScrollStore.getState();s.setStoryPosition('portal',.75,0,true);
  const samples=[];for(const value of [0,1,.5,0]){
   s.setContactProgress(value);await new Promise(resolve=>setTimeout(resolve,60));
   samples.push({input:qa.useScrollStore.getState().contactProgress,camera:qa.store.getState().camera.position.toArray(),intensity:qa.rayUniforms.uDiskIntensity.value});
  }return samples;
 });
 for(const sample of result.legacyContact){assert.deepEqual(sample.camera,result.legacyContact[0].camera);assert.equal(sample.intensity,1);}
 assert.deepEqual(result.legacyContact.map(s=>s.input),[0,1,.5,0]);
 await page.evaluate(()=>{
  qa.useScrollStore.getState().setStoryManual(false);const smoother=qa.ScrollSmoother.get();if(smoother){smoother.scrollTop(0);const t=smoother.scrollTrigger;t.update();t.animation.invalidate().progress(t.progress);}
 });
 await page.waitForTimeout(450);
 await page.evaluate(()=>{
  const samples=[];qa.nativeSamples=samples;qa.stopNative=qa.addAfterEffect(()=>{
   const s=qa.useScrollStore.getState(),f=qa.store.getState(),expected=qa.storyCameraPath(s.storyChapter,s.chapterProgress,{},false,innerWidth/innerHeight),phase=qa.portalState(qa.portalProgress(s.storyChapter,s.chapterProgress));
   const u=f.scene.getObjectByName('accretion-disk').material.uniforms;
   const anchor=document.querySelector('[data-story-chapter="about"]').getBoundingClientRect().top-document.querySelector('main').getBoundingClientRect().top;
   const visible=qa.ScrollSmoother.get()?.scrollTop()??scrollY;
   samples.push({chapter:s.storyChapter,p:s.chapterProgress,visible,progressError:s.storyChapter==='portal'?Math.abs(s.chapterProgress-visible/anchor):0,poseError:Math.max(Math.abs(f.camera.position.x-expected.x),Math.abs(f.camera.position.y-expected.y),Math.abs(f.camera.position.z-expected.z)),pullError:Math.abs(u.uPortalPull.value-phase.pull),opacityError:Math.abs(+getComputedStyle(document.querySelector('[data-portal-stage]')).opacity-phase.textOpacity)});
  });
 });
 for(let i=0;i<9;i++){await page.mouse.wheel(0,i<6?350:-220);await page.waitForTimeout(140);}
 await page.waitForTimeout(500);result.native=await page.evaluate(()=>{qa.stopNative();const a=qa.nativeSamples;return{samples:a.length,chapters:[...new Set(a.map(s=>s.chapter))],maxProgressError:Math.max(...a.map(s=>s.progressError)),maxPoseError:Math.max(...a.map(s=>s.poseError)),maxPullError:Math.max(...a.map(s=>s.pullError)),maxOpacityError:Math.max(...a.map(s=>s.opacityError))};});
 assert.ok(result.native.samples>30);assert.ok(result.native.maxProgressError<1e-7);assert.ok(result.native.maxPoseError<1e-9);assert.equal(result.native.maxPullError,0);assert.ok(result.native.maxOpacityError<=.00005);
 result.meteors=await page.evaluate(async()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms)),s=qa.useScrollStore.getState();s.setStoryPosition('about',.4,0,true);await wait(150);
  const url=performance.getEntriesByType('resource').map(e=>e.name).filter(u=>u.includes('/src/3d/utils/shootingStars.js')).at(-1);const {triggerShootingStar}=await import(url);triggerShootingStar();await wait(150);
  const mesh=qa.store.getState().scene.getObjectByName('shooting-stars'),alpha=()=>Math.max(...mesh.geometry.attributes.aAlpha.array);
  const active={visible:mesh.visible,alpha:alpha(),visibility:mesh.material.uniforms.uVisibility.value};
  s.setStoryPosition('education',.95,0,true);await wait(100);const fading=mesh.material.uniforms.uVisibility.value;
  s.setStoryPosition('experience',0,0,true);await wait(100);const suppressed={visible:mesh.visible,visibility:mesh.material.uniforms.uVisibility.value};
  s.setStoryPosition('about',.4,0,true);await wait(30);return{active,fading,suppressed,returnedAlpha:alpha()};
 });
 assert.equal(result.meteors.active.visible,true);assert.ok(result.meteors.active.alpha>0);assert.ok(Math.abs(result.meteors.fading-.5)<1e-12);assert.equal(result.meteors.suppressed.visible,false);assert.equal(result.meteors.returnedAlpha,0);
 for(const width of [1440,390])for(const hash of ['','about','work','transmission']){
  await page.setViewportSize({width,height:width===390?844:900});await page.goto(`http://127.0.0.1:4173/${hash?`#${hash}`:''}`);
  await page.waitForSelector('canvas');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  const s=await page.evaluate(async()=>({hash:location.hash,canvas:document.querySelectorAll('canvas').length,opacity:+getComputedStyle(document.querySelector('[data-portal-stage]')).opacity,inert:document.querySelector('[data-story-content]').inert,theme:document.documentElement.dataset.theme,year:document.querySelector('[data-hero-year]').getAttribute('aria-label'),anchor:[...document.querySelectorAll('[data-portal-char]')].findIndex(el=>el.dataset.storyAnchor),overflow:document.documentElement.scrollWidth-innerWidth,controlled:!!navigator.serviceWorker.controller,registered:(await navigator.serviceWorker.getRegistrations()).length,htmlLang:document.documentElement.lang}));
  assert.equal(s.canvas,1);assert.equal(s.year,'2026');assert.equal(s.anchor,8);assert.equal(s.overflow,0);assert.equal(s.opacity,hash?0:1);assert.equal(s.inert,!hash);assert.equal(s.theme,'dark');result.production.push({width,...s});
  await page.screenshot({path:`${out}/screenshots/production-${width}-${hash||'hero'}.png`});
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.waitForTimeout(1700);
 assert.equal(await page.locator('[data-year-digit]').textContent(),'6');assert.equal(await page.locator('[data-portal-stage]').evaluate(el=>+getComputedStyle(el).opacity),1);
 await page.locator('button[aria-haspopup="dialog"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('dialog')?.open);await page.locator('dialog a[href="#about"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(450);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'about');result.freshReduced={year:'2026',digit:'6',keyboardFocus:'about',canvas:await page.locator('canvas').count()};
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('http://127.0.0.1:4173/?chapter=portal&p=0.5');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.waitForTimeout(500);assert.equal(await page.locator('[data-portal-stage]').evaluate(el=>+getComputedStyle(el).opacity),1);result.queryLabOnly=true;
 assert.equal(result.errors.length,0);result.finished=new Date().toISOString();fs.writeFileSync(`${out}/preview-results.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(e){result.failure=e.stack;fs.writeFileSync(`${out}/preview-failure.json`,JSON.stringify(result,null,2));throw e;}finally{await browser.close();}
