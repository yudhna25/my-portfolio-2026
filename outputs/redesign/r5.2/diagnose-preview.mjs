import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}}),records=[];
const snap=async label=>records.push({label,...await page.evaluate(()=>({
  locale:document.documentElement.lang,scroll:scrollY,focus:document.activeElement?.outerHTML.slice(0,200),dialog:document.querySelector('dialog')?.open,
  body:document.body.className,content:document.querySelector('#smooth-content').getBoundingClientRect().toJSON(),
  chapter:document.querySelector('[data-story-chapter=works]').getBoundingClientRect().toJSON(),
  stage:document.querySelector('[data-work-background]').getBoundingClientRect().toJSON(),stageTransform:document.querySelector('[data-work-background]').style.transform,
  preview:document.querySelector('[data-work-preview]').dataset.active
}))});
try{
  await page.goto('http://127.0.0.1:4173/#work');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1500);
  for(const id of ['edura','veris','vie']){await page.locator('[data-work-target='+id+']').click();await page.waitForTimeout(350);}
  await page.keyboard.press('Tab');await page.waitForTimeout(350);await page.keyboard.press('Shift+Tab');await page.waitForTimeout(350);
  await snap('before-menu');await page.locator('button[aria-haspopup="dialog"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('dialog')?.open);
  await page.getByRole('button',{name:'English',exact:true}).click();await page.keyboard.press('Escape');await snap('language-close-0');
  for(const ms of [400,800,1200]){await page.waitForTimeout(ms);await snap('language-close-after-'+ms);}
  await page.locator('[data-work-target=edura]').click();await snap('edura-click-0');
  for(const ms of [350,800,1200]){await page.waitForTimeout(ms);await snap('edura-after-'+ms);}
  console.log(JSON.stringify(records,null,2));
}finally{fs.writeFileSync('outputs/redesign/r5.2/preview-language-diagnostic.json',JSON.stringify(records,null,2));await browser.close();}
