import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const out='outputs/redesign/r3.2';fs.mkdirSync(`${out}/screenshots`,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',e=>console.log('ERROR',e.message));page.on('console',e=>{if(e.type()==='error')console.log('ERROR',e.text());});
await page.goto('http://127.0.0.1:5173/');await page.waitForTimeout(3200);
await page.evaluate(async()=>{
 const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);
 const fiber=await import(loaded('/@react-three_fiber.js'));
 const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));
 const {ScrollSmoother,ScrollTrigger,gsap}=await import(loaded('/src/hooks/useGSAPSetup.js'));
 window.qa={fiber,useScrollStore,ScrollSmoother,ScrollTrigger,gsap,store:fiber._roots.get(document.querySelector('canvas')).store};
});
for(const width of [1440,390,320]){
 await page.setViewportSize({width,height:width<500?844:900});await page.waitForTimeout(800);
 await page.screenshot({path:`${out}/screenshots/inspect-${width}.png`});
 console.log(JSON.stringify(await page.evaluate(()=>{
 const s=qa.useScrollStore.getState(),r=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height};};
 const chars=[...document.querySelectorAll('[data-portal-char]')],f=qa.store.getState();
 return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,chapter:s.storyChapter,p:s.chapterProgress,anchor:s.storyAnchor,chars:chars.map(r),year:r(document.querySelector('[data-hero-year]')),font:getComputedStyle(document.querySelector('h1')).fontSize,opacity:getComputedStyle(document.querySelector('[data-portal-stage]')).opacity,canvas:document.querySelectorAll('canvas').length,camera:f.camera.position.toArray(),scene:f.scene.children.map(o=>o.name)};
 })));
}
await browser.close();
