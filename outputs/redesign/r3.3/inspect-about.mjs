import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out='outputs/redesign/r3.3';fs.mkdirSync(`${out}/screenshots`,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.goto('http://127.0.0.1:5173/#about');await page.waitForFunction(()=>!document.body.classList.contains('loading-lock'));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1200);
await page.evaluate(async()=>{
 const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);
 const fiber=await import(loaded('/@react-three_fiber.js'));
 const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));
 const {ScrollSmoother,gsap}=await import(loaded('/src/hooks/useGSAPSetup.js'));
 const {storyCameraPath}=await import(loaded('/src/3d/utils/cameraPath.js'));
 window.qa={fiber,useScrollStore,ScrollSmoother,gsap,storyCameraPath,store:fiber._roots.get(document.querySelector('canvas')).store};
});
const records=[];
for(const width of [1440,768,390,320]){
 await page.setViewportSize({width,height:width<500?844:900});await page.waitForTimeout(500);
 await page.evaluate(()=>{const target=document.querySelector('[data-story-chapter="about"]'),main=document.querySelector('main'),y=target.getBoundingClientRect().top-main.getBoundingClientRect().top;const sm=qa.ScrollSmoother.get();if(sm)sm.scrollTop(y);else scrollTo(0,y);});await page.waitForTimeout(600);
 const record=await page.evaluate(()=>{
  const rect=el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};},f=qa.store.getState(),position=f.camera.position.clone().set(0,0,-200).project(f.camera),s=qa.useScrollStore.getState();
  return{width:innerWidth,chapter:s.storyChapter,p:s.chapterProgress,overflow:document.documentElement.scrollWidth-innerWidth,camera:f.camera.position.toArray(),BH:[(position.x*.5+.5)*innerWidth,(.5-position.y*.5)*innerHeight],heading:rect(document.querySelector('#about-heading')),portrait:rect(document.querySelector('#about button')),bio:[...document.querySelectorAll('[data-about-bio]')].map(rect),image:{loaded:document.querySelector('.avatar-img').complete,natural:[document.querySelector('.avatar-img').naturalWidth,document.querySelector('.avatar-img').naturalHeight],filter:getComputedStyle(document.querySelector('.avatar-img')).filter},timeline:qa.gsap.getById('about-introduction')?.progress()};
 });records.push(record);await page.screenshot({path:`${out}/screenshots/inspect-${width}.png`});
}
console.log(JSON.stringify({records,errors},null,2));fs.writeFileSync(`${out}/inspect-results.json`,JSON.stringify({records,errors},null,2));await browser.close();
