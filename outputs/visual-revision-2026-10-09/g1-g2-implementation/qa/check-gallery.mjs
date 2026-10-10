import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium,edge,out,save,sha} from './common.mjs';
const errors=[],failures=[];
const browser=await chromium.launch({executablePath:edge,headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});
  const url='http://127.0.0.1:5211/'+out+'/review.html';
  assert.equal((await page.goto(url)).status(),200);
  const images=await page.evaluate(async()=>{
    const images=[...document.images];
    await Promise.all(images.map(async image=>{image.loading='eager';await image.decode();}));
    return images.map(image=>({src:image.getAttribute('src'),width:image.naturalWidth,height:image.naturalHeight}));
  });
  assert(images.length>50);
  assert(images.every(image=>image.width>0&&image.height>0));
  const videos=[];
  for(const video of await page.locator('video').all()) {
    await video.evaluate(el=>{el.preload='auto';el.muted=true;el.load();});
    await video.evaluate(async el=>{
      await new Promise((resolve,reject)=>{if(el.readyState>=2)return resolve();el.addEventListener('loadeddata',resolve,{once:true});el.addEventListener('error',()=>reject(new Error('Video decode failed')),{once:true});setTimeout(()=>reject(new Error('Video metadata timeout')),15000);});
      await el.play();
    });
    await page.waitForTimeout(150);
    const target=await video.evaluate(el=>{
      el.pause();
      const target=Math.min(2,el.duration*.6);el.currentTime=target;return target;
    });
    await page.waitForFunction(({src,target})=>{const video=[...document.querySelectorAll('video')].find(v=>v.getAttribute('src')===src);return Math.abs(video.currentTime-target)<.1&&!video.seeking&&video.readyState>=2;},{src:await video.getAttribute('src'),target},{timeout:15000}).catch(async error=>{console.error(JSON.stringify(await video.evaluate(el=>({src:el.currentSrc,time:el.currentTime,duration:el.duration,seeking:el.seeking,ready:el.readyState,network:el.networkState,error:el.error?.message,seekable:[...Array(el.seekable.length)].map((_,i)=>[el.seekable.start(i),el.seekable.end(i)])}))));throw error;});
    videos.push(await video.evaluate(el=>({src:el.getAttribute('src'),duration:el.duration,width:el.videoWidth,height:el.videoHeight,seek:el.currentTime,error:el.error?.message??null})));
  }
  assert.equal(videos.length,2);
  assert(videos.every(video=>video.duration>8&&video.width===1440&&!video.error));
  if(errors.length||failures.length)console.error(JSON.stringify({errors,failures}));
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  await page.screenshot({path:out+'/gallery-preview.png'});
  save('gallery-results.json',{status:'pass',url,sourceBuild:JSON.parse(fs.readFileSync(out+'/build-source.json','utf8')).at,htmlHash:sha(out+'/review.html'),images,videos,errors,failures});
  console.log(JSON.stringify({status:'pass',images:images.length,videos:videos.length,errors:0,failedHttp:0}));
}finally{await browser.close();}
