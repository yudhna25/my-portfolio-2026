import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium, base, out, ready, seek } from './browser-common.mjs';
const data = JSON.parse(fs.readFileSync('src/3d/data/symbolTargets.json')).education;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report={at:new Date().toISOString(),anchors:[],poses:[],lifecycle:[],errors:[],expectedFailureMessages:[],resources:[]};
const tailOnly=process.argv.includes('--tail-only');
if(tailOnly){
  const previous=JSON.parse(fs.readFileSync(out+'/extras-results.json'));
  assert.equal(previous.anchors.length,36);
  const verified=JSON.parse(fs.readFileSync(out+'/verified-source.json')),baseline=JSON.parse(fs.readFileSync(out+'/baseline.json'));
  for(const p of baseline.owned)assert.equal(createHash('sha256').update(fs.readFileSync(p)).digest('hex'),verified.hashes[p]);
  Object.assign(report,previous,{resumedAt:new Date().toISOString(),lifecycle:[],errors:[],expectedFailureMessages:[]});delete report.status;delete report.failure;
}
let page,context,mode='normal';
const save=()=>fs.writeFileSync(out+'/extras-results.json',JSON.stringify(report,null,2));
async function setup(width=1440,init=null) {
  context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,hasTouch:width===390,serviceWorkers:'block'});
  page=await context.newPage();page.setDefaultTimeout(45000);await page.routeWebSocket('**',ws=>ws.send('{"type":"connected"}'));
  if(init)await page.addInitScript(init);
  page.on('pageerror',e=>(mode==='normal'?report.errors:report.expectedFailureMessages).push(e.message));
  page.on('console',m=>{if(m.type()==='error')(mode==='normal'?report.errors:report.expectedFailureMessages).push(m.text());});
}
async function position(id) {
  const p=await page.evaluate(id=>{
    const top=document.getElementById('smooth-content').getBoundingClientRect().top;
    const c=document.querySelector('[data-story-chapter="education"]'),e=document.querySelector('[data-story-chapter="experience"]');
    const r=document.querySelector('[data-education-stage="'+id+'"]').getBoundingClientRect();
    const y=Math.round(r.top-top-Math.max(80,(innerHeight-r.height)*.25));
    return Math.max(0,Math.min(.98,(y-(c.getBoundingClientRect().top-top))/(e.getBoundingClientRect().top-c.getBoundingClientRect().top)));
  },id);await seek(page,'education',p);
  await page.evaluate(id=>{v5qa.education.getState().clear();v5qa.education.getState().interact('hover',id);},id);await page.waitForTimeout(1600);
}
async function projection(item,width,lang) {
  const result=await page.evaluate(item=>{
    const {scene,camera,gl}=v5qa.root.getState(),pool=scene.getObjectByName('symbol-anchor'),art=scene.getObjectByName('education-art-'+item.id);
    scene.updateMatrixWorld(true);
    const svg=document.querySelector('[data-education-stage="'+item.id+'"] svg'),ctm=svg.getScreenCTM();
    const pixel=v=>{const p=v.project(camera);return[(p.x*.5+.5)*innerWidth,(.5-p.y*.5)*innerHeight];};
    const records=item.artwork.anchors.map(anchor=>{
      const [u,v]=anchor.vectorPixel,plane=item.artwork.plane;
      const index=item.geometry.stars.findIndex(s=>s.hip===anchor.hip),positions=scene.getObjectByName('symbol-pool').geometry.attributes.position;
      const local=index<0?anchor.localPosition:[positions.getX(index),positions.getY(index),positions.getZ(index)];
      const star=pixel(pool.localToWorld(pool.position.clone().set(...local)));
      const image=pixel(art.localToWorld(art.position.clone().set((u/512-.5)*plane.width,(.5-v/512)*plane.height,0)));
      const dom=svg.createSVGPoint();dom.x=anchor.localPosition[0];dom.y=-anchor.localPosition[1];const screen=dom.matrixTransform(ctm);
      return{hip:anchor.hip,role:anchor.role,renderedNode:index>=0,star,image,dom:[screen.x,screen.y],depthError:Math.max(...star.map((x,i)=>Math.abs(x-image[i]))),
        hitProjectionError:Math.max(Math.abs(star[0]-screen.x),Math.abs(star[1]-screen.y))};
    });
    return{records,memory:{...gl.info.memory},canvases:document.querySelectorAll('canvas').length,
      scenePhase:v5qa.scroll.getState().chapterProgress,pose:[...pool.position.toArray(),...pool.quaternion.toArray(),...pool.scale.toArray()],
      artPose:[...art.parent.position.toArray(),...art.parent.quaternion.toArray(),...art.parent.scale.toArray()],overflow:document.documentElement.scrollWidth-innerWidth};
  },item);
  report.anchors.push({width,lang,id:item.id,...result});save();
  assert.equal(result.overflow,0);assert.equal(result.canvases,1);
  assert(result.pose.slice(3).every((x,i)=>Math.abs(x-result.artPose[i+3])<1e-10),'Same billboard rotation/scale');
  for(const a of result.records){assert(a.depthError<.5,'Art anchor depth tolerance');assert(a.hitProjectionError<.01,'DOM hull and stars share screen projection');}
  return result;
}
try{
  if(!tailOnly)for(const width of[390,768,1440]){
    await setup(width);await page.goto(base);await ready(page);
    for(const lang of['vi','en']){
      await page.evaluate(async lang=>{const url=performance.getEntriesByType('resource').map(x=>x.name).find(x=>x.includes('/src/stores/useLangStore.js'));
        const{useLangStore}=await import(url);useLangStore.getState().setLang(lang);await document.fonts.ready;v5qa.gsap.ScrollTrigger.refresh();},lang);
      await page.waitForTimeout(300);
      for(const item of data){await position(item.id);const before=await projection(item,width,lang);
        await seek(page,'experience',.7);await position(item.id);const reverse=await projection(item,width,lang);
        const screenError=Math.max(...before.records.flatMap((a,i)=>a.star.map((x,j)=>Math.abs(x-reverse.records[i].star[j]))));
        assert(screenError<.51,'Native/Smoother subpixel scroll tolerance');
        report.poses.push({width,lang,id:item.id,forwardReverseScreenError:screenError,
          forwardReversePoseError:Math.max(...before.pose.map((x,i)=>Math.abs(x-reverse.pose[i])))});
      }
    }
    report.resources.push({width,loads:await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.name.includes('/constellations/')).map(x=>({url:new URL(x.name).pathname,bytes:x.decodedBodySize}))) });
    await context.close();
  }
  await setup();await page.goto(base);await ready(page);await position(data[0].id);
  // Real rapid mouse motion across the three projected figures, then real background clear.
  for(let i=0;i<12;i++) {const id=data[i%3].id,box=await page.locator('[data-education-figure="'+id+'"]').boundingBox();
    if(box&&box.y>=0&&box.y+box.height<=900){await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.waitForTimeout(30);}}
  await page.mouse.move(4,4);await page.locator('[data-education-clear]').click();await page.waitForTimeout(1600);
  assert.equal(await page.evaluate(()=>Math.max(...v5qa.root.getState().scene.getObjectByName('symbol-stars').userData.pool.positions.map((x,i)=>
    Math.abs(x-v5qa.root.getState().scene.getObjectByName('symbol-stars').userData.pool.base[i])))),0);
  await position(data[0].id);
  const hidden=await page.evaluate(async()=>{
    const frame=v5qa.root.getState();let frames=0;const off=v5qa.fiber.addAfterEffect(()=>frames++);
    const originals={visibilityState:Object.getOwnPropertyDescriptor(document,'visibilityState'),hidden:Object.getOwnPropertyDescriptor(document,'hidden')};
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});
    Object.defineProperty(document,'hidden',{configurable:true,get:()=> true});document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r=>setTimeout(r,100));const start=frames,startElapsed=frame.scene.getObjectByName('symbol-stars').userData.pool.elapsed;
    await new Promise(r=>setTimeout(r,400));const result={frames:frames-start,elapsedError:frame.scene.getObjectByName('symbol-stars').userData.pool.elapsed-startElapsed,frameloop:v5qa.root.getState().frameloop};
    for(const[k,value]of Object.entries(originals)){if(value)Object.defineProperty(document,k,value);else delete document[k];}
    document.dispatchEvent(new Event('visibilitychange'));off();return result;
  });assert.equal(hidden.frames,0);assert.equal(hidden.elapsedError,0);report.hidden={...hidden,method:'visibilityState override + visibilitychange; simulated hidden'};
  for(let cycle=0;cycle<3;cycle++){
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-education-stage]')].every(e=>e.dataset.educationArtStatus==='loaded'));
    const owned=await page.evaluate(()=>{
      const sets={geometry:new Set(),material:new Set(),texture:new Set()};window.v5Disposal=[];
      v5qa.root.getState().scene.traverse(o=>{if(!/^(symbol-|education-)/.test(o.name))return;
        if(o.geometry)sets.geometry.add(o.geometry);if(o.material){sets.material.add(o.material);if(o.material.map)sets.texture.add(o.material.map);}});
      for(const[k,set]of Object.entries(sets))for(const resource of set)resource.addEventListener('dispose',()=>v5Disposal.push({kind:k,id:resource.uuid}));
      return Object.fromEntries(Object.entries(sets).map(([k,v])=>[k,v.size]));
    });
    await page.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(x=>x.name).filter(x=>x.includes('/src/stores/useRouteStore.js')).at(-1);
      const route=await import(url);route.navigateRoute(null,'/projects/edura');});
    await page.waitForSelector('#edura-title');await page.waitForTimeout(250);
    const disposed=await page.evaluate(()=>({canvases:document.querySelectorAll('canvas').length,records:window.v5Disposal}));
    assert.equal(disposed.canvases,0);for(const kind of Object.keys(owned))assert(new Set(disposed.records.filter(r=>r.kind===kind).map(r=>r.id)).size>=owned[kind]);
    report.lifecycle.push({cycle,owned,disposed});save();await page.goBack();await ready(page);await position(data[0].id);
  }
  await context.close();
  // Forced initial no-WebGL: real fallback and all school/figure controls stay available.
  mode='fallback';await setup(390,()=>{const get=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:get.call(this,type,...args);};});
  await page.goto(base+'/#education');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));
  await page.waitForSelector('[data-education-stage] image');
  const fallbackControl=page.locator('button[data-education-item="saigonUniversity"]');await fallbackControl.scrollIntoViewIfNeeded();await fallbackControl.tap();
  await page.waitForTimeout(100);
  report.fallback=await page.evaluate(()=>({figures:document.querySelectorAll('[data-education-figure]').length,schools:document.querySelectorAll('button[data-education-item]').length,
    selected:document.querySelector('button[data-education-item][aria-pressed="true"]')?.dataset.educationItem,
    imageOpacity:document.querySelector('[data-education-stage="saigonUniversity"] image').getAttribute('opacity'),texts:[...document.querySelectorAll('#education h3')].map(x=>x.textContent),overflow:document.documentElement.scrollWidth-innerWidth}));
  assert.equal(report.fallback.selected,data[0].id);assert.equal(report.fallback.imageOpacity,'0.3');assert.equal(report.fallback.schools,3);assert.equal(report.fallback.figures,3);assert.equal(report.fallback.overflow,0);
  await page.screenshot({path:out+'/screenshots/fallback-390.png'});await context.close();
  mode='asset-failure';await setup(390);await page.route('**/constellations/orion.svg',route=>route.abort());await page.goto(base);await ready(page);await position(data[0].id);
  report.assetFailure=await page.evaluate(()=>({status:document.querySelector('[data-education-stage="saigonUniversity"]').dataset.educationArtStatus,
    target:v5qa.root.getState().scene.getObjectByName('symbol-stars').userData.pool.target?.id,school:document.querySelector('button[data-education-item="saigonUniversity"]').textContent,
    artMap:!!v5qa.root.getState().scene.getObjectByName('education-art-saigonUniversity').material.map?.image}));
  assert.equal(report.assetFailure.status,'failed');assert.equal(report.assetFailure.target,data[0].id);assert.equal(report.assetFailure.artMap,false);await context.close();
  assert.equal(report.errors.length,0);report.status='pass';
}catch(e){report.status='fail';report.failure=e.stack;throw e;}
finally{save();await browser.close();}
console.log('V5 extras PASS:',report.anchors.length*3,'projected anchors;',report.lifecycle.length,'resource disposal cycles');
