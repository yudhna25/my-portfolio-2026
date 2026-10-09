import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),results=[],errors=[],warnings=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
try{
await page.goto('http://127.0.0.1:5173/outputs/redesign/r4.2/lifecycle.html#skills');await page.waitForTimeout(3500);
await page.evaluate(async()=>{
  const urls=performance.getEntriesByType('resource').map(x=>x.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);
  const {_roots}=await import(loaded('/@react-three_fiber.js'));
  const {useSkillsStore}=await import(loaded('/src/stores/useSkillsStore.js'));
  const {ScrollSmoother,ScrollTrigger}=await import(loaded('/src/hooks/useGSAPSetup.js'));
  window.qa={roots:_roots,useSkillsStore,ScrollSmoother,ScrollTrigger};
});
for(let cycle=0;cycle<3;cycle++){
  if(cycle){await page.evaluate(()=>window.mountApp());await page.waitForTimeout(1200);}
  await page.evaluate(()=>{location.hash='about';location.hash='skills';});await page.waitForTimeout(200);
  await page.locator('[data-skill-tool="ai"]').hover();await page.waitForTimeout(1650);
  const mounted=await page.evaluate(()=>{
    const f=window.qa.roots.get(document.querySelector('canvas')).store.getState(),root=f.scene.getObjectByName('symbol-stars');
    const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){materials.add(o.material);if(o.material.map)textures.add(o.material.map);}});
    const disposed={geometries:0,materials:0,textures:0};for(const [name,items]of Object.entries({geometries,materials,textures}))for(const item of items)item.addEventListener('dispose',()=>disposed[name]++);
    window.qa.resources={f,pool:root.userData.pool,geometries,materials,textures,disposed};
    return{counts:{geometries:geometries.size,materials:materials.size,textures:textures.size},memory:{...f.gl.info.memory},subscribers:f.internal.subscribers.length,canvas:document.querySelectorAll('canvas').length,triggers:window.qa.ScrollTrigger.getAll().length};
  });
  assert.deepEqual(mounted.counts,{geometries:3,materials:11,textures:9});assert.equal(mounted.canvas,1);
  // Native scroll out, including when the stage leaves before the chapter ends.
  await page.mouse.move(2,500);await page.evaluate(()=>{location.hash='education';});await page.waitForTimeout(350);
  const out=await page.evaluate(()=>{const r=window.qa.resources,s=window.qa.useSkillsStore.getState();return{target:r.pool.target?.id??null,active:r.f.scene.getObjectByName('symbol-stars').visible,channels:[s.hover,s.focus,s.selection],uploads:r.geometries.values().next().value.attributes.position.version};});
  assert.equal(out.target,null);assert.equal(out.active,false);assert.deepEqual(out.channels,[null,null,null]);
  await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.qa.resources.geometries.values().next().value.attributes.position.version),out.uploads);
  await page.evaluate(()=>window.unmountApp());await page.waitForTimeout(700);
  const unmounted=await page.evaluate(()=>{const r=window.qa.resources,s=window.qa.useSkillsStore.getState();return{disposed:r.disposed,canvas:document.querySelectorAll('canvas').length,subscribers:r.f.internal.subscribers.length,triggers:window.qa.ScrollTrigger.getAll().length,smoother:!!window.qa.ScrollSmoother.get(),state:{hover:s.hover,focus:s.focus,selection:s.selection,visible:s.visible}};});
  assert.equal(unmounted.canvas,0);assert.equal(unmounted.subscribers,0);assert.equal(unmounted.triggers,0);assert.equal(unmounted.smoother,false);assert.deepEqual(unmounted.state,{hover:null,focus:null,selection:null,visible:false});
  assert(unmounted.disposed.geometries>=3);assert(unmounted.disposed.materials>=11);assert(unmounted.disposed.textures>=9);results.push({cycle,mounted,out,unmounted});
}
await page.evaluate(()=>window.mountApp());await page.waitForTimeout(1400);
await page.evaluate(()=>{location.hash='about';location.hash='skills';});await page.waitForTimeout(300);
await page.evaluate(()=>{document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();});
await page.waitForSelector('[data-scene-fallback]');await page.waitForTimeout(250);
await page.locator('[data-skill-tool="figma"]').click();const fallback=await page.evaluate(()=>({canvas:document.querySelectorAll('canvas').length,tools:document.querySelectorAll('[data-skill-tool]').length,abilities:document.querySelectorAll('[data-skill-ability]').length,text:document.querySelector('#skills').innerText,fallback:getComputedStyle(document.querySelector('[data-scene-fallback]')).backgroundColor}));
assert.equal(fallback.canvas,0);assert.equal(fallback.tools,7);assert.equal(fallback.abilities,11);assert.equal(fallback.fallback,'rgb(5, 5, 5)');results.push({fallback});
await page.screenshot({path:'outputs/redesign/r4.2/screenshots/fallback.png'});assert.deepEqual(errors,[]);console.log('PASS lifecycle3/fallback',JSON.stringify(results));
}finally{writeFileSync('outputs/redesign/r4.2/lifecycle-verification.json',JSON.stringify({results,errors,warnings:[...new Set(warnings)]},null,2));await browser.close();}
