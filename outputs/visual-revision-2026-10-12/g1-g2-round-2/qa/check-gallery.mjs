import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,edge,out,save} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[],videos=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(pathToFileURL(path.resolve(out,'review.html')).href);
 const elements=page.locator('video');assert.equal(await elements.count(),2);
 for(let i=0;i<2;i++) {
  const element=elements.nth(i);await element.scrollIntoViewIfNeeded();
  const record=await element.evaluate(async video=>{
   await video.play();await new Promise(r=>setTimeout(r,300));video.currentTime=Math.min(4,video.duration*.35);
   await new Promise(r=>video.addEventListener('seeked',r,{once:true}));await new Promise(r=>setTimeout(r,300));video.pause();
   return {src:video.getAttribute('src'),width:video.videoWidth,height:video.videoHeight,duration:video.duration,error:video.error?.message,decoded:video.getVideoPlaybackQuality().totalVideoFrames};
  });assert(record.width===1440&&record.height===900&&record.decoded>0&&!record.error);videos.push(record);
 }
 await page.locator('#phase').selectOption('0.7');await page.waitForFunction(()=>document.getElementById('portal').complete);
 assert.equal(await page.locator('#portal').getAttribute('src'),'screenshots/portal-0.7-1440.png');
 assert(await page.locator('#portal').evaluate(image=>image.naturalWidth===1440));
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
 assert.equal(errors.length,0);save('gallery-results.json',{status:'pass',videos,errors});console.log('Gallery videos, images and responsive layout pass');
}finally{await browser.close()}
