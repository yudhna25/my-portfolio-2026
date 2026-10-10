import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const messages=[];page.on('console',m=>messages.push([m.type(),m.text()]));page.on('pageerror',e=>messages.push(['error',e.stack]));
await page.goto('http://127.0.0.1:5173/outputs/visual-revision-2026-10-09/v7/qa.html');
await page.waitForTimeout(5500);
const record=await page.evaluate(async()=>{
 const url=performance.getEntriesByType('resource').find(x=>x.name.includes('/@react-three_fiber.js'))?.name;
 const fiber=url?await import(url):null;const scene=fiber?fiber._roots.get(document.querySelector('canvas'))?.store.getState():null;
 window.v7Scene=scene;
 return {layout:window.v7QA?.layoutRef.current,store:window.v7QA?.store.getState(),renderer:scene?.gl.getContext().getParameter(scene.gl.getContext().RENDERER),figures:['edura','veris','vie'].map(id=>{const g=scene?.scene.getObjectByName('works-'+id);return {id,position:g?.position.toArray(),scale:g?.scale.toArray(),art:g?.children[2]?.material.map?.image?.currentSrc}}),buttons:[...document.querySelectorAll('[data-work-target]')].map(el=>({id:el.id,rect:el.getBoundingClientRect().toJSON(),hidden:el.hidden}))};
});
await page.screenshot({path:'outputs/visual-revision-2026-10-09/v7/initial-1440.png'});
fs.writeFileSync('outputs/visual-revision-2026-10-09/v7/inspect.json',JSON.stringify({browser:browser.version(),record,messages},null,2));
console.log(JSON.stringify({record,messages},null,2));await browser.close();
