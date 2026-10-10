import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/visual-revision-2026-10-09/v7';
const report={date:new Date().toISOString(),cases:[],errors:[],warnings:[],resources:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
report.browser=browser.version();
const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
function observe(page){page.on('pageerror',e=>report.errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())});page.on('response',r=>{if(r.status()>=400)report.resources.push({url:r.url(),status:r.status()})})}
async function inspect(page){return page.evaluate(async()=>{
 const fiberURL=performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js'))?.name;
 const scene=(await import(fiberURL))._roots.get(document.querySelector('canvas')).store.getState();
 window.v7Scene=scene;
 const rect=el=>el?.getBoundingClientRect().toJSON();
 const state=v7QA.store.getState();
 return {layout:v7QA.layoutRef.current,buttons:[...document.querySelectorAll('[data-work-target]')].map(el=>({id:el.dataset.workTarget,rect:rect(el),label:el.getAttribute('aria-label'),pressed:el.getAttribute('aria-pressed')})),panel:rect(document.querySelector('[data-work-content]')),target:document.querySelector('[data-work-preview]')?.dataset.active,
   orbit:{...state.worksOrbit},selection:state.worksSelection,focus:state.worksFocus,hover:state.worksHover,finaleSelection:state.worksFinaleSelection,
   scroll:scrollY,stage:rect(document.querySelector('#work')),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   scene:['edura','veris','vie'].map(id=>{const g=scene.scene.getObjectByName('works-'+id);return {id,position:g.position.toArray(),scale:g.scale.toArray(),opacity:g.children[2].material.opacity,loaded:!!g.children[2].material.map,strength:g.children[1].material.uniforms.uStrength.value,line:g.children[0].material.opacity}}),
   gpu:scene.gl.getContext().getParameter(scene.gl.getContext().getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL),info:scene.gl.info.memory,drawCalls:scene.gl.info.render.calls};
})}
async function clear(page){await page.mouse.move(2,2);await page.keyboard.press('Escape');await page.evaluate(()=>v7QA.store.getState().clearWorksInteraction());await page.waitForTimeout(50)}
async function figure(page,id,kind='hover') {const b=await page.locator('#work-target-'+id).boundingBox();assert(b);const x=b.x+b.width/2,y=b.y+b.height/2;if(kind==='click')await page.mouse.click(x,y);else if(kind==='tap')await page.touchscreen.tap(x,y);else await page.mouse.move(x,y)}
async function select(page,id){await clear(page);await figure(page,id);await page.waitForTimeout(300)}
let currentPage;
async function step(name,fn){try{await currentPage?.evaluate(name=>window.v7Check=name,name);const value=await fn();report.cases.push({name,passed:true,value});}catch(e){report.cases.push({name,passed:false,error:e.stack});throw e;}}
try {
 for(const [width,height]of [[390,844],[768,1024],[1440,900],[1920,1080]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();currentPage=page;observe(page);
  await page.goto('http://127.0.0.1:5173/'+out+'/qa.html');await page.waitForFunction(()=>window.v7QA?.layoutRef.current.ready);await page.waitForTimeout(800);
  await page.evaluate(async()=>{
    await document.fonts.ready;
    window.workShifts=[];
    window.shiftObserver=new PerformanceObserver(list=>{for(const entry of list.getEntries())workShifts.push({check:window.v7Check,value:entry.value,recentInput:entry.hadRecentInput,sources:entry.sources.map(source=>({node:source.node?.id||source.node?.nodeName,text:source.node?.textContent?.slice(0,80),previous:source.previousRect.toJSON(),current:source.currentRect.toJSON()}))})});
    shiftObserver.observe({type:'layout-shift'});
  });
  await page.evaluate(()=>{
    window.graceSamples=[];
    document.addEventListener('pointerleave',event=>{
      if(!event.target.matches?.('[data-work-target],[data-work-content]')||event.relatedTarget?.closest?.('[data-work-target],[data-work-content]'))return;
      const before=document.querySelector('[data-work-preview]')?.dataset.active,start=performance.now();
      setTimeout(()=>graceSamples.push({before,after:document.querySelector('[data-work-preview]')?.dataset.active,elapsed:performance.now()-start}),60);
    },true);
  });
  await step(`fit/projection/idle ${width}`,async()=>{
   const r=await inspect(page);assert.equal(r.overflow,0);
   for(let i=0;i<3;i++){const b=r.layout.figures[i],dom=r.buttons[i];assert(b.left>=0&&b.right<=width&&b.top>=130&&b.bottom<=height-16);assert(Math.abs(dom.rect.left-b.left)<.1&&Math.abs(dom.rect.top-b.top)<.1);assert(Math.abs(dom.rect.right-b.right)<.1&&Math.abs(dom.rect.bottom-b.bottom)<.1);assert(dom.label&&dom.rect.width>=44&&dom.rect.height>=44);assert(r.scene[i].loaded);assert.equal(r.scene[i].opacity,.1)}
   for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.equal(overlap(r.layout.figures[i],r.layout.figures[j]),0);
   await page.screenshot({path:`${out}/idle-${width}.png`});return r;
  });
  for(const id of ['edura','veris','vie']){
   await step(`figure/panel/CTA ${width} ${id}`,async()=>{
    await select(page,id);const before=await inspect(page);assert.equal(before.target,id);assert.equal(before.selection,null);
    assert.equal(before.scene.find(g=>g.id===id).opacity,.3);assert(before.scene.find(g=>g.id===id).line>=.6);
    for(const b of before.layout.figures)assert.equal(overlap(before.panel,b),0,`panel overlaps ${b.id}`);
    assert(before.panel.left>=0&&before.panel.right<=width&&before.panel.bottom<=height);
    await page.locator('[data-work-content]').hover();await page.waitForTimeout(220);assert.equal((await inspect(page)).target,id);
    if(id==='edura'){await page.locator('[data-work-action]').hover();await page.waitForTimeout(220);assert.equal((await inspect(page)).target,id);assert.equal(await page.locator('[data-work-action]').getAttribute('href'),'/projects/edura');assert.equal(await page.locator('[data-work-behance]').getAttribute('target'),'_blank');assert((await page.locator('[data-work-behance]').getAttribute('rel')).includes('noopener'));}
    else assert.equal(await page.locator('[data-work-content] a').count(),0);
    assert.equal((await inspect(page)).stage.height,before.stage.height);assert.equal((await inspect(page)).scroll,before.scroll);
    await page.screenshot({path:`${out}/selected-${id}-${width}.png`});
    await page.mouse.move(2,height-2);
    await page.waitForTimeout(300);
    const grace=await page.evaluate(id=>graceSamples.filter(x=>x.before===id).at(-1),id);
    assert(grace, 'native exit captured');assert.equal(grace.after,id,JSON.stringify(grace));
    assert.equal(await page.locator('[data-work-preview]').getAttribute('data-active'),'empty');return {...before,grace};
   });
  }
  await step(`keyboard/Tab/Escape ${width}`,async()=>{
   await clear(page);await page.keyboard.press('Tab');await page.locator('#work-target-edura').focus();await page.waitForTimeout(50);
   assert.equal((await inspect(page)).target,'edura');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'work-case-edura');
   await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'work-target-edura');
   await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-work-behance')),true);
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'work-target-veris');
   await page.keyboard.press('Escape');assert.equal((await inspect(page)).target,'empty');assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-work-background')),true);
   return {nativeTab:true};
  });
  await step(`pin/rapid/clear ${width}`,async()=>{
   for(const id of ['edura','veris','vie','edura','vie','veris','edura','veris','vie','edura']){await figure(page,id,'click');assert.equal((await inspect(page)).selection,id);}
   await page.mouse.move(2,height-2);await page.waitForTimeout(250);assert.equal((await inspect(page)).target,'edura');
   await page.locator('[data-work-background]').click({position:{x:10,y:height-10}});assert.equal((await inspect(page)).target,'empty');return {changes:10};
  });
  await step(`single snapshot/reverse ${width}`,async()=>{
   await figure(page,'edura','click');await page.waitForTimeout(1600);const initial=await inspect(page);
   await page.evaluate(()=>v7QA.store.getState().setStoryPosition('finale',.25,.8,true));await page.waitForTimeout(120);const first=await inspect(page);
   for(const p of [.65,.1,.4,0,.25]){await page.evaluate(p=>v7QA.store.getState().setStoryPosition('finale',p,.8,true),p);await page.waitForTimeout(50)}
   const reversed=await inspect(page);assert.equal(reversed.orbit.captures,first.orbit.captures);assert.equal(reversed.orbit.origin,first.orbit.origin);assert.deepEqual(reversed.scene,first.scene);assert.equal(reversed.finaleSelection,'edura');
   await page.evaluate(()=>v7QA.store.getState().setStoryPosition('works',0,0,true));await page.waitForTimeout(60);const returned=await inspect(page);assert.equal(returned.orbit.phase,first.orbit.origin);assert.equal(returned.selection,'edura');
   assert(Math.abs(first.orbit.origin-initial.orbit.phase)<.00002);
   return {initial:initial.orbit,first:first.orbit,reversed:reversed.orbit,returned:returned.orbit};
  });
  await step(`hover then immediate handoff/reverse ${width}`,async()=>{
   await clear(page);await figure(page,'veris');await page.waitForTimeout(30);
   const prior=await inspect(page);await page.evaluate(()=>v7QA.store.getState().setStoryPosition('finale',.2,.8,true));await page.waitForTimeout(60);
   const captured=await inspect(page);assert.equal(captured.finaleSelection,'veris');
   await page.evaluate(()=>v7QA.store.getState().setStoryPosition('finale',.4,.8,true));await page.waitForTimeout(30);
   await page.evaluate(()=>v7QA.store.getState().setStoryPosition('works',0,0,true));await page.waitForTimeout(60);
   const returned=await inspect(page);assert.equal(returned.target,'veris');assert.equal(returned.orbit.origin,captured.orbit.origin);
   assert(Math.abs(captured.orbit.origin-prior.orbit.phase)<.002);
   assert.equal(returned.orbit.captures,captured.orbit.captures);return {prior:prior.orbit,captured:captured.orbit,returned:returned.orbit};
  });
  await step(`live reduced/hidden ${width}`,async()=>{
   await clear(page);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(250);const before=await inspect(page);await page.waitForTimeout(400);const after=await inspect(page);assert.equal(after.orbit.phase,before.orbit.phase);assert.deepEqual(after.scene,before.scene);
   await page.screenshot({path:`${out}/reduced-${width}.png`});
   await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(250);assert((await inspect(page)).orbit.phase>after.orbit.phase);
   const hidden=await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return v7QA.store.getState().worksOrbit.phase});await page.waitForTimeout(300);assert.equal((await inspect(page)).orbit.phase,hidden);
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});return {static:true,hidden:true};
  });
  if(width===1440)await step('frame/resources 1440',async()=>{
   await clear(page);const fps=await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name;const {addAfterEffect}=await import(url);let count=0;const stop=addAfterEffect(()=>count++);const start=performance.now();await new Promise(r=>setTimeout(r,2500));stop();return {frames:count,milliseconds:performance.now()-start,fps:count*1000/(performance.now()-start)}});
   return {...fps,gpu:(await inspect(page)).gpu,memory:(await inspect(page)).info,drawCalls:(await inspect(page)).drawCalls};
  });
  await step(`stage layout shifts ${width}`,async()=>{
    const shifts=await page.evaluate(()=>{shiftObserver.disconnect();return workShifts});
    report.shiftDiagnostic={width,shifts};
    const cls=shifts.filter(entry=>!entry.recentInput).reduce((sum,entry)=>sum+entry.value,0);
    assert.equal(shifts.filter(entry=>!entry.check.includes('reduced/hidden')).reduce((sum,entry)=>sum+entry.value,0),0);
    return {allShifts:shifts,cls,interactionCLS:0};
  });
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();currentPage=page;observe(page);
 await page.goto('http://127.0.0.1:5173/'+out+'/qa.html');await page.waitForFunction(()=>window.v7QA?.layoutRef.current.ready);
 await step('native tap/pin/clear 390',async()=>{
  await figure(page,'edura','tap');assert.equal((await inspect(page)).selection,'edura');
  await figure(page,'edura','tap');assert.equal((await inspect(page)).target,'empty');
  await figure(page,'veris','tap');assert.equal((await inspect(page)).selection,'veris');
  await page.touchscreen.tap(8,820);assert.equal((await inspect(page)).target,'empty');return {touch:true};
 });await context.close();
}catch(e){report.failure=e.stack;console.error(e.stack)}finally{fs.writeFileSync(out+'/browser-results.json',JSON.stringify(report,null,2)+'\n');await browser.close()}
console.log(JSON.stringify({passed:report.cases.filter(c=>c.passed).length,total:report.cases.length,failure:report.failure,errors:report.errors,resources:report.resources},null,2));
if(report.failure||report.errors.length||report.resources.length)process.exitCode=1;
