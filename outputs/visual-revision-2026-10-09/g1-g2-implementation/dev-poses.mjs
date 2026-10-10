import fs from 'node:fs';
import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/visual-revision-2026-10-09/g1-g2-implementation';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const records=[];
for(const width of [1440,390,320,768,1920]){
 const page=await browser.newPage({viewport:{width,height:width<768?844:width===768?1024:900}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5211/');
 await page.waitForFunction(()=>!document.querySelector('[data-preloader]'),null,{timeout:20000});
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`${out}/hero-dev-${width}.png`});
 records.push({width,errors,layout:await page.evaluate(()=>({year:document.querySelector('.hero-year-svg').getBoundingClientRect().toJSON(),heading:document.querySelector('#hero-heading').getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth-innerWidth,sceneReady:document.querySelector('[data-galaxy-scene]').dataset.sceneReady}))});
 await page.close();
}
fs.writeFileSync(out+'/dev-poses.json',JSON.stringify(records,null,2));
await browser.close();console.log(JSON.stringify(records));
