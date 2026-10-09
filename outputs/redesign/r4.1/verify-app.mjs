import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page = await browser.newPage({viewport:{width:1440,height:900}}), errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try {
  await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(3000);
  const before=await page.evaluate(()=>({canvases:document.querySelectorAll('canvas').length,sections:[...document.querySelectorAll('[data-story-chapter]')].map(e=>e.dataset.storyChapter),overflow:document.documentElement.scrollWidth-innerWidth,background:getComputedStyle(document.body).backgroundColor}));
  assert.equal(before.canvases,1);assert.equal(before.overflow,0);
  for(const id of ['about','skills','education','works','contact']) await page.evaluate(id=>document.querySelector(`[data-story-chapter="${id}"]`)?.scrollIntoView(),id);
  await page.waitForTimeout(200); assert.equal(errors.length,0);
  writeFileSync(new URL('./app-smoke.json',import.meta.url),JSON.stringify({status:'pass',date:new Date().toISOString(),...before,errors},null,2));
  console.log('App smoke pass');
} finally {await browser.close();}
