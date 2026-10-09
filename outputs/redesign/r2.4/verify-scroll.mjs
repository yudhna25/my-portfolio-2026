import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, renameSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const path = file => new URL(file, import.meta.url).pathname.replace(/^\//,'');
mkdirSync(path('clips/'),{recursive:true});
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const results=[];
for (const mode of ['desktop','mobile','max-dpr']) {
  const viewport = mode==='mobile' ? {width:390,height:844} : {width:1440,height:900};
  const context = await browser.newContext({viewport,deviceScaleFactor:mode==='mobile'?3:mode==='max-dpr'?1.75:1,
    ...(mode==='max-dpr'?{}:{recordVideo:{dir:path('clips/'),size:viewport}})});
  const page=await context.newPage(), errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://localhost:5173/3d-lab.html?story=1&chapter=finale&p=.25');
  await page.waitForSelector('[data-galaxy-scene] canvas');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1100);
  await page.evaluate(async()=>{
    const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=name=>urls.filter(url=>url.includes(name)).at(-1);
    const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));
    const {storyCameraPath}=await import(loaded('/src/3d/utils/cameraPath.js'));
    const {finaleState}=await import(loaded('/src/3d/utils/finale.js'));
    const {_roots,addAfterEffect}=await import(loaded('/@react-three_fiber.js'));
    const {ScrollSmoother}=await import(loaded('/src/hooks/useGSAPSetup.js'));
    const store=_roots.get(document.querySelector('canvas')).store;
    const samples=[],start=performance.now(), output={};
    const stop=addAfterEffect(()=>{
      const f=store.getState(),s=useScrollStore.getState(),u=f.scene.getObjectByName('accretion-disk').material.uniforms;
      const expected=storyCameraPath(s.storyChapter,s.chapterProgress,output,false,innerWidth/innerHeight),phase=finaleState(s.storyChapter==='contact'?1:s.chapterProgress);
      const content=document.getElementById('smooth-content').getBoundingClientRect(),el=document.getElementById(`lab-${s.storyChapter}`);
      const rect=el.getBoundingClientRect(), top=rect.top-content.top, y=ScrollSmoother.get()?.scrollTop()??scrollY;
      const publishedY=s.scrollProgress*(document.documentElement.scrollHeight-innerHeight);
      samples.push({chapter:s.storyChapter,p:s.chapterProgress,manual:s.storyManual,origin:s.worksOrbit.origin,captures:s.worksOrbit.captures,
        cameraError:Math.max(Math.abs(f.camera.position.x-expected.x),Math.abs(f.camera.position.y-expected.y),Math.abs(f.camera.position.z-expected.z)),
        progressError:!s.storyManual?Math.abs(s.chapterProgress-Math.min(1,Math.max(0,(publishedY-top)/rect.height))):0,
        rafScrollSkewPx:Math.abs(y-publishedY),
        holeError:s.storyChapter==='finale'||s.storyChapter==='contact'?Math.abs(u.uFinaleHole.value-phase.hole):0,
        label:document.querySelector('[data-works-controls]').hidden,dpr:f.gl.getPixelRatio(),time:performance.now()-start});
    });
    window.r24s={useScrollStore,store,addAfterEffect,ScrollSmoother,samples,stop};
  });
  if(mode==='max-dpr') {
    // Measure without video/tracing overhead at the infrastructure DPR ceiling.
    const values=[];
    for(const p of [.4,.58,.75]) {
      await page.evaluate(p=>{const s=window.r24s.useScrollStore.getState();s.setStoryPosition('finale',p,s.scrollProgress,true);},p);
      await page.waitForTimeout(650);
      const value=await page.evaluate(async()=>{let frames=0;const start=performance.now(),stop=window.r24s.addAfterEffect(()=>frames++);await new Promise(r=>setTimeout(r,1800));stop();const f=window.r24s.store.getState();return{frames,fps:frames*1000/(performance.now()-start),dpr:f.gl.getPixelRatio(),memory:{...f.gl.info.memory}};});
      values.push({p,...value});assert(value.fps>120);assert.equal(value.dpr,1.75);
    }
    results.push({mode,values,errors});
  } else {
    const wheelScale = mode==='mobile' ? 3 : 1;
    // Native wheel drives the existing Smoother/ScrollTrigger bridge, both ways.
    await page.click('#lab-hold'); await page.waitForTimeout(200);await page.mouse.move(viewport.width*.4,viewport.height*.5);
    for(let i=0;i<13;i++){await page.mouse.wheel(0,100*wheelScale);await page.waitForTimeout(140);}
    await page.waitForTimeout(900);
    for(let i=0;i<12;i++){await page.mouse.wheel(0,-100*wheelScale);await page.waitForTimeout(130);}
    await page.waitForTimeout(900);
    // Reverse in the compression/burst neighborhood without restarting the seed.
    for(const delta of [260,-170,190,-150,180,-120]){await page.mouse.wheel(0,delta*wheelScale);await page.waitForTimeout(190);}
    await page.waitForTimeout(700);
    const data=await page.evaluate(()=>{const w=window.r24s;w.stop();return{samples:w.samples,canvas:document.querySelectorAll('canvas').length,glError:w.store.getState().gl.getContext().getError()};});
    writeFileSync(path(`${mode}-native.json`),JSON.stringify(data,null,2)+'\n');
    const finale=data.samples.filter(x=>x.chapter==='finale');assert(finale.length>100);assert(finale.some(x=>x.p>.7));assert(finale.some(x=>x.p>.34&&x.p<.44));
    assert(Math.max(...finale.map(x=>x.cameraError))<1e-9);
    // CSS transformed getBoundingClientRect rounds subpixel section bounds.
    assert(Math.max(...finale.map(x=>x.progressError))<1e-6);assert(Math.max(...finale.map(x=>x.holeError))<1e-9);
    assert.equal(new Set(finale.map(x=>x.origin)).size,1);assert.equal(new Set(finale.map(x=>x.captures)).size,1);assert.equal(data.canvas,1);assert.equal(data.glError,0);
    if(mode==='mobile')assert(finale.every(x=>x.dpr===1));
    const resources=await page.evaluate(async()=>{
      const f=window.r24s.store.getState(),disposed={geometry:0,material:0,target:0},watched=new WeakSet();
      f.scene.traverse(o=>{for(const resource of [o.geometry,o.material]){if(!resource||watched.has(resource))continue;watched.add(resource);resource.addEventListener('dispose',()=>disposed[resource.isBufferGeometry?'geometry':'material']++);}});
      // The real context-lost fallback unmounts the Canvas while keeping React DOM.
      f.gl.getContext().getExtension('WEBGL_lose_context').loseContext();await new Promise(r=>setTimeout(r,1200));
      return{disposed,memory:{...f.gl.info.memory},canvas:document.querySelectorAll('canvas').length,dom:document.querySelectorAll('[data-story-chapter]').length};
    });
    assert.equal(resources.canvas,0);assert.equal(resources.memory.geometries,0);assert.equal(resources.dom,9);assert(resources.disposed.geometry>=7);assert(resources.disposed.material>=7);
    results.push({mode,viewport,samples:data.samples,resources,errors});
  }
  assert.equal(errors.length,0,JSON.stringify(errors));
  const video=page.video();await context.close();if(video)renameSync(await video.path(),path(`clips/${mode}.webm`));
  console.log(mode,'PASS');
}
await browser.close();writeFileSync(path('scroll-results.json'),JSON.stringify(results,null,2)+'\n');
