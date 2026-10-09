import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r5.1',result={started:new Date().toISOString(),records:[],errors:[],warnings:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
  for(const width of [1440,390])for(const motion of ['no-preference','reduce']) {
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},deviceScaleFactor:1,reducedMotion:motion,hasTouch:width===390,isMobile:width===390});
    const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());if(m.type()==='warning')result.warnings.push(m.text());});
    await page.goto('http://127.0.0.1:4173/#experience');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
    for(const locale of ['vi','en']) {
      if(locale==='en') {await page.locator('button[aria-haspopup="dialog"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('dialog')?.open);await page.getByRole('button',{name:'English',exact:true}).click();await page.keyboard.press('Escape');await page.waitForTimeout(300);}
      const record=await page.evaluate(async()=>({locale:document.documentElement.lang,hash:location.hash,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('canvas').length,labels:[...document.querySelectorAll('[data-meteor-label]')].map(el=>({text:el.textContent,opacity:getComputedStyle(el).opacity})),copy:[...document.querySelectorAll('[data-experience-item] article')].map(el=>el.textContent),departure:document.querySelector('[data-story-chapter="departure"]').offsetHeight,bodyHidden:document.querySelector('[data-story-content]').inert,sw:!!navigator.serviceWorker.controller,registrations:(await navigator.serviceWorker.getRegistrations()).length}));
      assert.equal(record.locale,locale);assert.equal(record.viewport[0],width);assert.equal(record.overflow,0);assert.equal(record.canvas,1);assert.equal(record.bodyHidden,false);assert.equal(record.labels.length,3);assert(record.labels.every(item=>Number(item.opacity)>=.7199));
      const copy=JSON.parse(fs.readFileSync(`src/i18n/locales/${locale}.json`)).experience.positions;Object.values(copy).forEach((position,i)=>Object.values(position).forEach(text=>assert(record.copy[i].includes(text))));
      result.records.push({width,motion,...record});await page.screenshot({path:`${out}/screenshots/production-${width}-${locale}-${motion}-experience.png`});
    }
    await page.goto('http://127.0.0.1:4173/#work');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.waitForTimeout(500);
    assert.equal(await page.evaluate(()=>location.hash),'#work');assert.equal(await page.locator('canvas').count(),1);await context.close();
  }
  assert.deepEqual(result.errors,[]);result.status='PASS';result.finished=new Date().toISOString();fs.writeFileSync(`${out}/preview-results.json`,JSON.stringify(result,null,2));console.log({status:'PASS',records:result.records.length,errors:result.errors,warnings:[...new Set(result.warnings)]});
} finally {await browser.close();}
