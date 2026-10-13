import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,edge,out,save} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true});
const errors=[],records=[];
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve(out,'review.html')).href);
  await page.locator('img').evaluateAll(async images=>{for(const image of images){image.loading='eager';await image.decode()}});
  await page.locator('#phase').selectOption('0.25');
  await page.locator('#portal').evaluate(image=>image.decode());
  for(const video of await page.locator('video').all()) {
    await video.evaluate(async node=>{
      await node.play();
      await new Promise(resolve=>setTimeout(resolve,400));node.pause();
      node.currentTime=Math.min(6,node.duration/2);
      await new Promise((resolve,reject)=>{node.addEventListener('seeked',resolve,{once:true});setTimeout(()=>reject(Error('Video seek timeout')),10000)});
    });
    const record=await video.evaluate(node=>({duration:node.duration,time:node.currentTime,width:node.videoWidth,height:node.videoHeight,error:node.error?.message??null}));
    assert(record.width>0&&record.duration>5&&!record.error);records.push(record);
  }
  assert.equal(errors.length,0,errors.join('\n'));
  await page.screenshot({path:path.join(out,'screenshots/gallery.png')});
  save('gallery-results.json',{status:'pass',images:await page.locator('img').count(),records,errors});
  console.log('Gallery images and both videos decode/play/seek');
} finally {await browser.close()}
