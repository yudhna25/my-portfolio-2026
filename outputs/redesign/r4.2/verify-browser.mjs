import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { skillTools } from '../../../src/data/skills.js';

const out='outputs/redesign/r4.2/'; mkdirSync(out+'screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage(), results=[], errors=[], warnings=[], metrics=[];
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});}
watch(page);await context.tracing.start({screenshots:true,snapshots:true});
async function init(p=page){
  await p.goto('http://127.0.0.1:5173/#skills');await p.waitForTimeout(3200);
  await p.evaluate(async()=>{
    const urls=performance.getEntriesByType('resource').map(x=>x.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);
    const {_roots,addEffect,addAfterEffect}=await import(loaded('/@react-three_fiber.js'));
    const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));
    const {useSkillsStore}=await import(loaded('/src/stores/useSkillsStore.js'));
    const {ScrollSmoother,ScrollTrigger}=await import(loaded('/src/hooks/useGSAPSetup.js'));
    const {storyCameraPath}=await import(loaded('/src/3d/utils/cameraPath.js'));
    const {default:i18n}=await import(loaded('/src/i18n/config.js'));
    window.qa={fiber:_roots.get(document.querySelector('canvas')).store,useScrollStore,useSkillsStore,ScrollSmoother,ScrollTrigger,storyCameraPath,i18n,addEffect,addAfterEffect};
  });
}
async function seek(chapter='skills',p=.12,pg=page){
  await pg.evaluate(({chapter,p})=>{
    const content=document.querySelector('#smooth-content'),sections=[...content.querySelectorAll('[data-story-chapter]')];
    const el=sections.find(e=>e.dataset.storyChapter===chapter),index=sections.indexOf(el),base=content.getBoundingClientRect().top;
    const top=el.getBoundingClientRect().top-base,end=sections[index+1]?.getBoundingClientRect().top-base;
    const scroll=top+(end-top)*p;
    window.qa.useScrollStore.getState().setStoryPosition(chapter,p,0,true);
    const smoother=window.qa.ScrollSmoother.get();if(smoother)smoother.scrollTop(scroll);else scrollTo(0,scroll);
  },{chapter,p});await pg.waitForTimeout(100);
}
async function snap(label,p=page){
  const s=await p.evaluate(()=>{
    const {fiber,useSkillsStore,useScrollStore,storyCameraPath}=window.qa,f=fiber.getState(),state=useSkillsStore.getState(),story=useScrollStore.getState();
    const root=f.scene.getObjectByName('symbol-stars'),pool=root.userData.pool,anchor=root.getObjectByName('symbol-anchor'),stage=document.querySelector('[data-skills-stage]').getBoundingClientRect();
    const proj=anchor.position.clone().project(f.camera),pose=storyCameraPath(story.storyChapter,story.chapterProgress,{},matchMedia('(prefers-reduced-motion: reduce)').matches,innerWidth/innerHeight);
    const expected=f.camera.clone();expected.position.set(pose.x,pose.y,pose.z);expected.lookAt(pose.lookX,pose.lookY,pose.lookZ);
    const qError=expected.quaternion.angleTo(f.camera.quaternion);
    let baseError=0,goalError=0;for(let i=0;i<pool.positions.length;i++){baseError=Math.max(baseError,Math.abs(pool.positions[i]-pool.base[i]));goalError=Math.max(goalError,Math.abs(pool.positions[i]-pool.goal[i]));}
    const logos=root.getObjectsByProperty('isMesh',true).filter(m=>m.visible).map(m=>({name:m.name,opacity:m.material.opacity,map:!!m.material.map?.image,quaternion:m.quaternion.toArray()}));
    const svg=document.querySelector('#skills svg'),vb=svg.viewBox.baseVal,box=svg.getBoundingClientRect(),start=document.querySelector('[data-skill-tool="'+(state.focus??state.selection??state.hover)+'"]')?.getBoundingClientRect();
    let endpointError=0;
    const paths=[...document.querySelectorAll('[data-skill-connection]')].map(path=>{
      const points=path.getAttribute('d')?.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)?.map(Number)??[];
      if(points.length!==14)throw Error('bad path');
      const end=document.querySelector('[data-skill-ability="'+path.dataset.skillConnection+'"]').getBoundingClientRect();
      const actual=[points[0]+box.left,points[1]+box.top,points[12]+box.left,points[13]+box.top];
      const ideal=[start.right,start.top+start.height/2,end.left,end.top+end.height/2];
      endpointError=Math.max(endpointError,...actual.map((n,i)=>Math.abs(n-ideal[i])));
      return {id:path.dataset.skillConnection,opacity:getComputedStyle(path).opacity,d:path.getAttribute('d')};
    });
    const gl=f.gl.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');
    return {label:undefined,chapter:story.storyChapter,p:story.chapterProgress,target:state.focus??state.selection??state.hover,channels:{hover:state.hover,focus:state.focus,selection:state.selection},visible:state.visible,active:root.visible,poolTarget:pool.target?.id??null,phase:pool.phase,formation:pool.formation,logo:pool.logo,baseError,goalError,positions:[...pool.positions],version:f.scene.getObjectByName('symbol-pool').geometry.attributes.position.version,logos,paths,linked:[...document.querySelectorAll('[data-linked="true"]')].map(e=>e.dataset.skillAbility),endpointError,viewbox:[vb.width,vb.height],anchorError:Math.max(Math.abs((proj.x+1)*innerWidth/2-stage.left-stage.width/2),Math.abs((1-proj.y)*innerHeight/2-stage.top-stage.height/2)),poseError:Math.max(Math.abs(pose.x-f.camera.position.x),Math.abs(pose.y-f.camera.position.y),Math.abs(pose.z-f.camera.position.z)),qError,heroOpacity:getComputedStyle(document.querySelector('[data-portal-stage]')).opacity,stage:stage.toJSON(),viewport:[innerWidth,innerHeight],canvas:document.querySelectorAll('canvas').length,roots:document.querySelectorAll('[data-galaxy-scene]').length,overflow:document.documentElement.scrollWidth-innerWidth,memory:{...f.gl.info.memory},subscribers:f.internal.subscribers.length,quality:document.querySelector('[data-galaxy-scene]').dataset.quality,dpr:f.gl.getPixelRatio(),glError:gl.getError(),frameloop:f.frameloop,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),focus:document.activeElement.dataset.skillTool??document.activeElement.dataset.skillClear??document.activeElement.tagName};
  });
  assert.equal(s.canvas,1,label);assert.equal(s.overflow,0,label);assert.equal(s.glError,0,label);assert(s.poseError<1e-7,label);assert(s.qError<1e-7,label);assert(s.paths.length<=3,label);assert(s.endpointError<.001,label+' endpoints '+s.endpointError);assert(s.logos.length<=3,label);
  if(s.active)assert(s.anchorError<.001,label+' anchor '+s.anchorError);
  if(s.chapter!=='hero'&&s.chapter!=='portal')assert.equal(s.heroOpacity,'0',label+' no Hero overlay');
  if(s.target)assert.deepEqual(s.linked,skillTools.find(t=>t.id===s.target).competencies,label);
  for(const logo of s.logos){assert(logo.map,label);assert.deepEqual(logo.quaternion,[0,0,0,1],label);}
  results.push({label,...s});return s;
}
async function shot(name,p=page){await p.screenshot({path:out+'screenshots/'+name+'.png'});}
async function perf(label){
  const v=await page.evaluate(async()=>{
    const {fiber,addEffect,addAfterEffect}=window.qa,f=fiber.getState(),gl=f.gl.getContext(),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const times=[],queries=[],gpu=[];let pending=null,calls=0,triangles=0,points=0;const old=f.gl.info.autoReset;f.gl.info.autoReset=false;
    const before=addEffect(()=>{f.gl.info.reset();if(ext&&times.length%30===0){pending=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,pending);}});
    const after=addAfterEffect(()=>{if(pending){gl.endQuery(ext.TIME_ELAPSED_EXT);queries.push(pending);pending=null;}if(f.frameloop==='always'&&f.gl.info.render.calls>0)times.push(performance.now());calls=f.gl.info.render.calls;triangles=f.gl.info.render.triangles;points=f.gl.info.render.points;});
    await new Promise(r=>setTimeout(r,1200));before();after();f.gl.info.autoReset=old;
    for(const q of queries){if(gl.getQueryParameter(q,gl.QUERY_RESULT_AVAILABLE)&&!gl.getParameter(ext.GPU_DISJOINT_EXT))gpu.push(gl.getQueryParameter(q,gl.QUERY_RESULT)/1e6);gl.deleteQuery(q);}
    const deltas=times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b);gpu.sort((a,b)=>a-b);
    return{fps:1000*(times.length-1)/(times.at(-1)-times[0]),frames:times.length,p95Ms:deltas[Math.floor(deltas.length*.95)],gpuMedianMs:gpu[Math.floor(gpu.length/2)]??null,calls,triangles,points};
  });assert(v.frames>60,label);metrics.push({label,...v});console.log('FPS',label,v.fps);
}
try{
  await init();await seek();
  for(const tool of skillTools){await page.locator('[data-skill-tool="'+tool.id+'"]').hover();await page.waitForTimeout(1650);const s=await snap('hover-'+tool.id);assert.equal(s.poolTarget,tool.id);assert.equal(s.logos.length,tool.id==='ai'?3:1);await shot(tool.id);}
  await perf('desktop-high-ai');
  await page.mouse.move(1,500);await page.waitForTimeout(1800);assert.equal((await snap('leave-return')).baseError,0);
  for(const id of ['figma','ai','photoshop','davinci-resolve','after-effects','illustrator','premiere-pro']){await page.locator('[data-skill-tool="'+id+'"]').hover();await page.waitForTimeout(45);await snap('rapid-'+id);}
  await page.keyboard.press('Tab');await page.locator('[data-skill-tool="figma"]').focus();await page.waitForTimeout(100);assert.equal((await snap('keyboard-figma')).target,'figma');
  await page.mouse.move(720,600);assert.equal((await snap('pointer-background-focus')).target,'figma');
  await page.keyboard.press('Escape');assert.equal((await snap('escape-keep-focus')).target,null);await page.keyboard.press('Enter');assert.equal((await snap('enter-after-escape')).target,'figma');await page.keyboard.press('Space');assert.equal((await snap('space')).target,'figma');
  await page.keyboard.press('Tab');assert.equal((await snap('tab-next')).target,'photoshop');await page.keyboard.press('Shift+Tab');assert.equal((await snap('shift-tab')).target,'figma');
  await seek('education',.2);const outside=await snap('scroll-out');assert.equal(outside.target,null);assert.equal(outside.active,false);await seek();assert.equal((await snap('reverse-no-stale')).poolTarget,null);
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:width<768?844:900});await seek('skills',0);await page.locator('[data-skill-tool="ai"]').hover();await page.waitForTimeout(1650);await snap('width-'+width);await shot('width-'+width);await perf('width-'+width);
    await page.evaluate(()=>window.qa.i18n.changeLanguage('en'));await page.waitForTimeout(300);await snap('en-'+width);await shot('en-'+width);
    await page.evaluate(()=>window.qa.i18n.changeLanguage('vi'));await page.waitForTimeout(200);
  }
  await page.setViewportSize({width:1440,height:900});await seek();await page.locator('[data-skill-tool="ai"]').hover();await page.waitForTimeout(1700);
  await snap('before-hidden');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);const hidden=await snap('hidden');assert.equal(hidden.frameloop,'never');await page.waitForTimeout(500);const held=await snap('hidden-held');assert.equal(held.phase,hidden.phase);assert.equal(held.version,hidden.version);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(100);
  await page.emulateMedia({reducedMotion:'reduce'});await seek('skills',0);await page.locator('[data-skill-tool="ai"]').hover();await page.waitForTimeout(150);const reduced=await snap('reduced');assert.equal(reduced.logo,1);await page.waitForTimeout(450);assert.equal((await snap('reduced-frozen')).phase,reduced.phase);await shot('reduced');
  for(const tool of skillTools){await page.locator('[data-skill-tool="'+tool.id+'"]').hover();await page.waitForTimeout(70);const s=await snap('reduced-'+tool.id);assert.equal(s.poolTarget,tool.id);assert.equal(s.logo,1);assert(s.goalError<.00001);}
  const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const tp=await touch.newPage();watch(tp);await init(tp);await seek('skills',0,tp);
  for(const tool of skillTools){await tp.locator('[data-skill-tool="'+tool.id+'"]').tap();await tp.waitForTimeout(1700);assert.equal((await snap('touch-'+tool.id,tp)).target,tool.id);}
  await tp.locator('[data-skill-tool="ai"]').tap();assert.equal((await snap('touch-toggle-clear',tp)).target,null);
  await tp.locator('[data-skill-tool="figma"]').tap();await tp.locator('[data-skills-stage]').tap({position:{x:12,y:120}});assert.equal((await snap('touch-background-clear',tp)).target,null);await shot('touch',tp);await touch.close();
  assert.deepEqual(errors,[]);console.log('PASS',results.length,'snapshots');
}finally{writeFileSync(out+'browser-verification.json',JSON.stringify({results,metrics,errors,warnings:[...new Set(warnings)]},null,2));await context.tracing.stop({path:out+'browser-trace.zip'});await browser.close();}
