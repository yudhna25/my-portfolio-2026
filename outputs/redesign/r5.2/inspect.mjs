import fs from 'node:fs';
import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r5.2'; fs.mkdirSync(out+'/screenshots',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {for(const width of [1440,390,320]) {
const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>console.log('ERROR '+e.message));
await p.goto('http://127.0.0.1:5173/#work');await p.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(1500);
await p.locator('[data-work-target=edura]').click();await p.waitForTimeout(350);await p.screenshot({path:out+'/screenshots/inspect-'+width+'.png'});
console.log(JSON.stringify(await p.evaluate(()=>({width:innerWidth,active:document.querySelector('[data-work-preview]').dataset.active,header:document.querySelector('[data-work-background] header').getBoundingClientRect().toJSON(),preview:document.querySelector('[data-work-content]').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('canvas').length}))));await p.close();
}}finally{await browser.close();}
