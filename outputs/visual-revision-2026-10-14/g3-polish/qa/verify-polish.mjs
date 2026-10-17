import assert from 'node:assert/strict';
import {chromium,edge,base,ready,scrollChapter,capture,save} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true});
const report={checks:0,records:[],errors:[]};
const check=(value,label)=>{report.checks++;assert(value,label)};
try {
  for(const width of [390,1440,1920]) {
    const page=await browser.newPage({viewport:{width,height:width===390?844:900},serviceWorkers:'block'});
    page.on('pageerror',e=>report.errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await ready(page);
    await page.evaluate(()=>{
      const root=motionQA.root.getState(),render=root.gl.render;window.diskQA={frames:0,samples:[],counts:{}};
      diskQA.unsubscribe=root.internal.subscribe({current:()=>diskQA.frames++},-100,{getState:root.get});
      root.gl.render=function(scene,camera){
        const uniforms=scene.children[0]?.material?.uniforms;
        if(uniforms?.uObserver){
          const target=this.getRenderTarget();
          diskQA.samples.push({frame:diskQA.frames,time:uniforms.uTime.value,width:target.width,height:target.height,buffer:[this.domElement.width,this.domElement.height]});
          diskQA.counts[diskQA.frames]=(diskQA.counts[diskQA.frames]||0)+1;
        }
        return render.call(this,scene,camera);
      };
    });
    const portrait=()=>page.evaluate(()=>{const n=motionQA.root.getState().scene.getObjectByName('portrait-stars'),b=document.querySelector('[data-portrait]');return {visible:n.visible,count:n.geometry.attributes.position?.count,morph:n.material.uniforms.uMorph.value,time:n.material.uniforms.uTime.value,pressed:b.getAttribute('aria-pressed'),img:+getComputedStyle(b.querySelector('img')).opacity,filter:getComputedStyle(b.querySelector('img')).filter,starsOpacity:n.material.uniforms.uOpacity.value,canvas:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth-innerWidth}});
    for(const chapter of ['hero','portal','about','skills','education','experience','works','contact']) {
      await scrollChapter(page,chapter==='hero'?'portal':chapter,chapter==='hero'?0:chapter==='portal'?.34:.1);
      const before=await page.evaluate(()=>diskQA.samples.at(-1));await page.waitForTimeout(600);
      const after=await page.evaluate(()=>diskQA.samples.at(-1));
      check(after.time>before.time,chapter+' accretion continuously advects');
      check(after.width===after.buffer[0]&&after.height===after.buffer[1],'HDR target matches drawing buffer');
      report.records.push({width,chapter,before,after});
      if(['portal','about'].includes(chapter))await capture(page,chapter+'-'+width);
    }
    await scrollChapter(page,'portal',.86);await page.mouse.move(3,3);await page.waitForTimeout(1000);
    const scattered=await portrait();check(scattered.visible&&scattered.count>1000&&scattered.morph<.5&&scattered.img===0,'Real cutout replaced by stars during entry');
    const box=await page.locator('[data-portrait]').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);await page.waitForTimeout(1050);
    const hovered=await portrait();check(hovered.morph>.999&&hovered.img===1&&hovered.starsOpacity===0&&hovered.filter==='none','Hover resolves complete color photo');await capture(page,'portrait-hover-'+width);
    await page.mouse.move(3,3);await page.waitForTimeout(1050);check((await portrait()).morph<.5,'Pointer leave returns to scroll pose');
    await page.locator('[data-portrait]').focus();await page.waitForTimeout(1050);check((await portrait()).morph>.999,'Keyboard focus condenses portrait');
    await page.keyboard.press('Space');check((await portrait()).pressed==='true','Space pins portrait');await page.keyboard.press('Escape');
    await page.locator('[data-portrait]').evaluate(n=>n.blur());await page.waitForTimeout(1050);
    await scrollChapter(page,'about',.12);const assembled=await portrait();check(assembled.morph===1&&assembled.img===1&&assembled.starsOpacity===0&&assembled.filter==='none'&&assembled.canvas===1&&assembled.overflow===0,'Scroll assembles in one canvas without overflow');
    await capture(page,'portrait-assembled-'+width);report.records.push({width,scattered,hovered,assembled});
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(800);
    const stopped=await page.evaluate(()=>diskQA.samples.at(-1).time);await page.waitForTimeout(400);
    check(await page.evaluate(t=>diskQA.samples.at(-1).time===t,stopped),'Reduced motion freezes gas');
    check(!(await portrait()).visible&&(await portrait()).img===1,'Reduced retains actual accessible image');
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(1800);await scrollChapter(page,'about',.1);await page.waitForTimeout(600);await scrollChapter(page,'about',.1);
    await page.waitForFunction(()=>{const p=motionQA.root.getState().scene.getObjectByName('portrait-stars');return p.material.uniforms.uMorph.value===1&&+getComputedStyle(document.querySelector('.avatar-img')).opacity===1},undefined,{timeout:5000});const restoredPortrait=await portrait();report.records.push({width,restoredPortrait});await capture(page,'portrait-live-restored-'+width);check(restoredPortrait.img===1&&restoredPortrait.starsOpacity===0,'Live motion restores assembled color photo '+JSON.stringify(restoredPortrait));
    check(await page.evaluate(()=>Object.values(diskQA.counts).every(n=>n===1)),'Exactly one HDR render per observed R3F frame');
    await page.close();console.log('Upgrade verified',width);
  }
  // Observe the actual idle timeline instead of seeking a stale GSAP handle.
  const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});await ready(page);
  await page.waitForFunction(()=>document.querySelector('[data-year-digit]')?.dataset.digit==='7',undefined,{timeout:22000});
  await page.waitForTimeout(900);
  const seven=await page.evaluate(()=>({digit:document.querySelector('[data-year-digit]').dataset.digit,base:getComputedStyle(document.querySelector('[data-year-digit] .hero-year-base')).strokeOpacity,runner:getComputedStyle(document.querySelector('[data-year-digit] [data-year-meteor]')).opacity,colors:[...document.querySelectorAll('[data-year-noise] path')].map(n=>getComputedStyle(n).stroke)}));
  check(+seven.base<=.1&&+seven.runner===1&&seven.colors.every(c=>c==='rgb(255, 255, 255)'),'2027 bright runner and strictly white glitch');
  await capture(page,'year-2027');await page.waitForTimeout(2000);check(await page.evaluate(()=>document.querySelector('[data-year-digit]').dataset.digit==='7'),'2027 lingers');
  await page.waitForFunction(()=>document.querySelector('[data-year-digit]').dataset.digit==='6',undefined,{timeout:10000});await capture(page,'year-2026');report.records.push({seven});
  await page.close();check(report.errors.length===0,'No unexpected browser errors');report.status='pass';
}catch(error){report.status='fail';report.failure=error.stack;process.exitCode=1;console.error(error.stack)}
finally{save('upgrade-results.json',report);await browser.close()}
console.log(JSON.stringify({status:report.status,checks:report.checks}));
