import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r5.2', result={started:new Date().toISOString(),records:[],errors:[],warnings:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
 for(const width of [1440,390])for(const motion of ['no-preference','reduce']) {
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1,reducedMotion:motion,hasTouch:width===390,isMobile:width===390});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());if(m.type()==='warning')result.warnings.push(m.text());});
  await page.goto('http://127.0.0.1:4173/#work');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
  // Read inside the Works chapter, away from the exact locale-reflow boundary.
  await page.mouse.wheel(0,260);await page.waitForTimeout(700);await page.mouse.wheel(0,-40);await page.waitForTimeout(700);
  await page.waitForFunction(()=>document.querySelector('[data-story-chapter=works]').getBoundingClientRect().top < -50);
  for(const locale of ['vi','en']) {
   if(locale==='en'){
    // Reveal the existing auto-hidden Nav with native upward scroll before click.
    await page.mouse.wheel(0,-12);await page.waitForTimeout(400);
    await page.locator('button[aria-haspopup="dialog"]').click();await page.waitForFunction(()=>document.querySelector('dialog')?.open);
    await page.getByRole('button',{name:'English',exact:true}).click();await page.keyboard.press('Escape');
    await page.waitForFunction(()=>Math.abs(document.querySelector('[data-work-background]').getBoundingClientRect().top)<1);
   }
   for(const id of ['edura','veris','vie']) {
    if(width===390)await page.locator('[data-work-target='+id+']').tap();else await page.locator('[data-work-target='+id+']').click();await page.waitForTimeout(350);
    await page.locator('[data-work-content] img').evaluate(img=>img.decode());
    const record=await page.evaluate(()=>{
     const preview=document.querySelector('[data-work-preview]'),img=preview.querySelector('img'),root=document.querySelector('[data-work-background]'),surface=new OffscreenCanvas(40,25),ctx=surface.getContext('2d');ctx.drawImage(img,0,0,40,25);const pixels=ctx.getImageData(0,0,40,25).data;let colorPixels=0;for(let i=0;i<pixels.length;i+=4)if(Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2])>8)colorPixels++;
     return {locale:document.documentElement.lang,hash:location.hash,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('canvas').length,active:preview.dataset.active,preview:preview.getBoundingClientRect().toJSON(),stageTop:root.getBoundingClientRect().top,image:{src:img.getAttribute('src'),alt:img.alt,width:img.naturalWidth,height:img.naturalHeight,declared:[Number(img.getAttribute("width")),Number(img.getAttribute("height"))],filter:getComputedStyle(img).filter,colorPixels},text:preview.textContent,action:preview.querySelector('[data-work-action]')?.disabled??null,links:[...preview.querySelectorAll('a')].map(a=>({href:a.href,rel:a.rel,target:a.target})),bodyHidden:document.querySelector('[data-story-content]').inert};
    });
    result.lastMeasured=record;assert.equal(record.locale,locale);assert.equal(record.active,id);assert.equal(record.canvas,1);assert.equal(record.overflow,0);assert.equal(record.image.filter,'none');assert.equal(record.image.width,1600);assert.equal(record.image.height,id==='edura'?1131:900);assert.deepEqual(record.image.declared,[record.image.width,record.image.height]);assert(record.image.alt);assert(record.image.colorPixels>0);assert.equal(record.bodyHidden,false);assert(Math.abs(record.stageTop)<1);
    if(id==='edura'){assert.equal(record.action,true);assert.equal(record.links.length,1);assert.equal(record.links[0].href,'https://www.behance.net/gallery/241524417/Edura-LMS');assert(record.links[0].rel.includes('noopener'));}else{assert.equal(record.action,null);assert.deepEqual(record.links,[]);}
    result.records.push({width,motion,id,...record});await page.screenshot({path:out+'/screenshots/production-'+width+'-'+locale+'-'+motion+'-'+id+'.png'});
   }
  }
  await context.close();
 }
 assert.deepEqual(result.errors,[]);result.status='PASS';result.finished=new Date().toISOString();console.log({status:result.status,records:result.records.length,errors:result.errors});
} catch(error){result.status='FAIL';result.failure=error.message;throw error;}finally{fs.writeFileSync(out+'/preview-results.json',JSON.stringify(result,null,2));await browser.close();}
