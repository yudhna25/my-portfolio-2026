import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r5.2', result={started:new Date().toISOString(),samples:[],errors:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
try {
  await page.goto('http://127.0.0.1:5173/#work');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
  await page.evaluate(async()=>{
    const urls=performance.getEntriesByType('resource').map(e=>e.name),url=name=>urls.filter(u=>u.includes(name)).at(-1);
    const fiber=await import(url('/@react-three_fiber.js')),{useScrollStore}=await import(url('/src/stores/useScrollStore.js')),{ScrollSmoother}=await import(url('/src/hooks/useGSAPSetup.js'));
    const store=fiber._roots.get(document.querySelector('canvas')).store,gl=store.getState().gl,render=gl.render.bind(gl);
    window.qa={...fiber,store,useScrollStore,ScrollSmoother,rayCalls:0};
    gl.render=(scene,camera)=>{if(scene.children[0]?.material?.uniforms?.uObserver)qa.rayCalls++;return render(scene,camera);};
  });
  for(const mode of ['orbit','preview']) {
    const chapter='works';
    await page.mouse.move(8,450); await page.keyboard.press('Escape');
    if(mode==='preview') { await page.locator('[data-work-target=edura]').click(); await page.mouse.move(8,450); }
    await page.waitForTimeout(400);
    const sample=await page.evaluate(chapter=>new Promise(resolve=>{
      const content=document.querySelector('#smooth-content'),base=content.getBoundingClientRect().top,chapters=[...content.querySelectorAll('[data-story-chapter]')],element=chapters.find(el=>el.dataset.storyChapter===chapter),index=chapters.indexOf(element);
      const top=element.getBoundingClientRect().top-base,end=chapters[index+1].getBoundingClientRect().top-base,range=end-top,smoother=qa.ScrollSmoother.get();
      qa.useScrollStore.getState().setStoryManual(false);
      const start=performance.now(),ray=qa.rayCalls,intervals=[];let frames=0,last=start,minP=1,maxP=0,finite=true;
      const stop=qa.addAfterEffect(()=>{const now=performance.now();frames++;intervals.push(now-last);last=now;const s=qa.useScrollStore.getState(),c=qa.store.getState().camera;if(s.storyChapter===chapter){minP=Math.min(minP,s.chapterProgress);maxP=Math.max(maxP,s.chapterProgress);}finite&&=c.position.toArray().every(Number.isFinite);});
      function tick(now){const t=(now-start)/4000;if(t<1){const p=.03+.94*(1-Math.abs(2*t-1));const y=top+range*p;if(smoother)smoother.scrollTop(y);else scrollTo(0,y);requestAnimationFrame(tick);}else{
        stop();const f=qa.store.getState(),gl=f.gl.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info'),ms=now-start;intervals.sort((a,b)=>a-b);
        resolve({chapter,frames,ms,fps:frames*1000/ms,p50ms:intervals[Math.floor(intervals.length*.5)],p95ms:intervals[Math.floor(intervals.length*.95)],minP,maxP,finite,rayCalls:qa.rayCalls-ray,viewport:[innerWidth,innerHeight],dpr:f.gl.getPixelRatio(),quality:document.querySelector('[data-galaxy-scene]').dataset.quality,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),memory:{...f.gl.info.memory},glError:gl.getError()});
      }}requestAnimationFrame(tick);
    }),chapter);
    assert.ok(Math.abs(sample.frames-sample.rayCalls)<=1);assert.equal(sample.glError,0);assert(sample.finite);assert(sample.minP<.08&&sample.maxP>.9);result.samples.push({...sample,mode});
  }
  assert.deepEqual(result.errors,[]);result.finished=new Date().toISOString();fs.writeFileSync(`${out}/performance-results.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
} finally {await browser.close();}
