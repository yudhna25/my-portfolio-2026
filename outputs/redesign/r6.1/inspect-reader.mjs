import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
  for (const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:1000}});
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto('http://127.0.0.1:5173/?reader-preview=edura',{waitUntil:'networkidle'});
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
    await page.screenshot({path:`outputs/redesign/r6.1/inspect-${width}.png`});
    await page.locator('#edura-reflection').scrollIntoViewIfNeeded();
    await page.screenshot({path:`outputs/redesign/r6.1/inspect-${width}-end.png`});
    console.log(JSON.stringify({width,errors,metrics:await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('canvas').length,height:document.documentElement.scrollHeight,images:[...document.images].map(i=>({src:i.getAttribute('src'),natural:i.naturalWidth,render:i.clientWidth}))}))}));
    assert.equal(errors.length,0);await page.close();
  }
} finally {await browser.close();}
