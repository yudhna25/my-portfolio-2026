import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const records=[];
for(const port of [5173,4173]){
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.goto(`http://127.0.0.1:${port}/`);await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.waitForTimeout(1500);
 await page.evaluate(()=>{window.focusLog=[];const original=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(...args){const reading=document.querySelector('[data-story-content]'),before={time:performance.now(),id:this.id,tag:this.tagName,tabindex:this.getAttribute('tabindex'),visibility:getComputedStyle(this).visibility,opacity:getComputedStyle(reading).opacity,readingVis:getComputedStyle(reading).visibility,style:reading.getAttribute('style'),inert:!!this.closest('[inert]'),dialog:document.querySelector('dialog').open,readingInert:reading.inert,scroll:scrollY};original.apply(this,args);focusLog.push({...before,after:document.activeElement.id,href:document.activeElement.getAttribute('href')});};document.addEventListener('focusin',e=>focusLog.push({event:'focusin',id:e.target.id,tag:e.target.tagName,href:e.target.getAttribute('href')}));});
 await page.locator('button[aria-haspopup="dialog"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('dialog').open);await page.locator('dialog a[href="#about"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(500);
 records.push({port,...await page.evaluate(()=>{document.getElementById('about').focus({preventScroll:true});return{log:focusLog,active:document.activeElement.outerHTML.slice(0,250),inert:document.querySelector('[data-story-content]').inert,scroll:scrollY,hash:location.hash,open:document.querySelector('dialog').open};})});
 await page.close();
}
console.log(JSON.stringify(records,null,2));fs.writeFileSync('outputs/redesign/r3.2/reduced-focus-debug.json',JSON.stringify(records,null,2));await browser.close();
