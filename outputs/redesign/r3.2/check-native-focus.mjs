import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto('http://127.0.0.1:5173/');await page.waitForTimeout(3400);
await page.locator('nav a[href="#about"]').first().focus();await page.keyboard.press('Enter');await page.waitForTimeout(500);
console.log(await page.evaluate(()=>({active:document.activeElement.id,tag:document.activeElement.tagName,href:document.activeElement.getAttribute('href'),inert:document.querySelector('[data-story-content]').inert,hash:location.hash})));
await browser.close();
