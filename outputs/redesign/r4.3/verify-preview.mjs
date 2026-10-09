import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r4.3',result={started:new Date().toISOString(),records:[],errors:[],warnings:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
 for(const width of [1440,390])for(const motion of ['no-preference','reduce']){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:motion,hasTouch:width===390,isMobile:width===390}),page=await context.newPage();
  page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());if(m.type()==='warning')result.warnings.push(m.text());});
  await page.goto('http://127.0.0.1:4173/#education');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1800);
  for(const locale of ['vi','en']){
   if(locale==='en'){await page.locator('button[aria-haspopup="dialog"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('dialog')?.open);await page.getByRole('button',{name:'English',exact:true}).click();await page.keyboard.press('Escape');await page.waitForTimeout(300);}
   const state=await page.evaluate(async()=>({locale:document.documentElement.lang,hash:location.hash,inner:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('canvas').length,visible:getComputedStyle(document.querySelector('[data-story-content]')).visibility,inert:document.querySelector('[data-story-content]').inert,schools:[...document.querySelectorAll('[data-education-region]')].map(el=>({id:el.dataset.educationRegion,text:el.innerText})),theme:document.documentElement.dataset.theme,sw:!!navigator.serviceWorker.controller,registrations:(await navigator.serviceWorker.getRegistrations()).length}));
   assert.equal(state.locale,locale);assert.equal(state.hash,'#education');assert.equal(state.inner[0],width);assert.equal(state.overflow,0);assert.equal(state.canvas,1);assert.equal(state.inert,false);assert.equal(state.visible,'visible');assert.equal(state.theme,'dark');assert.equal(state.schools.length,3);
   for(const id of ['saigonUniversity','greenAcademy','arenaMultimedia']){
    const button=page.locator('[data-education-item="'+id+'"]');if(width===390)await button.tap();else{await button.focus();await page.keyboard.press('Enter');}await page.waitForTimeout(motion==='reduce'?100:1600);assert.equal(await button.getAttribute('aria-pressed'),'true');
    await page.screenshot({path:out+'/screenshots/production-'+width+'-'+locale+'-'+motion+'-'+id+'.png'});
    if(width===390)await button.tap();else await page.keyboard.press('Escape');assert.equal(await button.getAttribute('aria-pressed'),'false');
   }
   result.records.push({width,motion,...state,nativeInteractions:3});
  }
  await context.close();
 }
 assert.deepEqual(result.errors,[]);result.finished=new Date().toISOString();result.status='PASS';fs.writeFileSync(out+'/preview-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({status:'PASS',records:result.records.length,errors:result.errors,warnings:[...new Set(result.warnings)]}));
}catch(e){result.failure=e.stack;fs.writeFileSync(out+'/preview-failure.json',JSON.stringify(result,null,2));throw e;}finally{await browser.close();}
