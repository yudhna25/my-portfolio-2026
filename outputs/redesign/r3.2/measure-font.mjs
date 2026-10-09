import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true });
const page = await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('http://127.0.0.1:5173/'); await page.waitForTimeout(2800);
console.log(await page.evaluate(async()=>{await document.fonts.ready;const c=document.createElement('canvas').getContext('2d');c.font='800 100px ' + getComputedStyle(document.querySelector('h1')).fontFamily;return {word:c.measureText('PORTFOLIO').width,year:c.measureText('2026').width};}));
await browser.close();

