import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';import {chromium,base,out,ready,seek} from './browser-common.mjs';
const directory=out+'/clip-frames';fs.mkdirSync(directory,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});await page.goto(base);await ready(page);
const session=await page.context().newCDPSession(page),frames=[];let last=-Infinity;
session.on('Page.screencastFrame',async frame=>{await session.send('Page.screencastFrameAck',{sessionId:frame.sessionId});const time=frame.metadata.timestamp;if(time-last<.09)return;last=time;const file=path.resolve(directory+'/frame-'+String(frames.length).padStart(4,'0')+'.jpg');fs.writeFileSync(file,Buffer.from(frame.data,'base64'));frames.push({file,time});});
await session.send('Page.startScreencast',{format:'jpeg',quality:75,maxWidth:1440,maxHeight:900,everyNthFrame:2});
try{
 await seek(page,'education',.1);await page.locator('[data-education-item="saigonUniversity"]').last().hover();await page.waitForTimeout(1900);
 await seek(page,'experience',.35);await page.evaluate(()=>v8qa.store.getState().setStoryManual(false));await page.mouse.wheel(0,250);await page.waitForTimeout(1800);
 await seek(page,'works',.3);let b=await page.locator('#work-target-edura').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.waitForTimeout(1200);await page.locator('[data-work-content]').hover();await page.waitForTimeout(800);await page.keyboard.press('Escape');await page.mouse.move(2,2);await page.waitForTimeout(450);
}finally{await session.send('Page.stopScreencast');await browser.close()}
if(frames.length<10)throw new Error('Insufficient actual production frames');
const concat=frames.map((f,i)=>"file '"+f.file.replaceAll('\\','/')+"'\nduration "+(frames[i+1]?Math.max(.01,frames[i+1].time-f.time):.15)).join('\n');fs.writeFileSync(directory+'/frames.txt',concat+'\n');
const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',directory+'/frames.txt','-vf','fps=15','-c:v','libvpx-vp9','-crf','36','-b:v','0','-pix_fmt','yuv420p',out+'/clips/integrated-education-experience-works.webm'],{encoding:'utf8',windowsHide:true});if(result.status!==0)throw new Error(result.stderr);
fs.writeFileSync(out+'/clip-results.json',JSON.stringify({source:JSON.parse(fs.readFileSync(out+'/build-source.json','utf8')).source,frames:frames.length,duration:frames.at(-1).time-frames[0].time,path:'clips/integrated-education-experience-works.webm',method:'CDP current-production screencast, actual frame timestamps, encoded with existing system ffmpeg; not an FPS measurement.'},null,2)+'\n');console.log(JSON.stringify({frames:frames.length,seconds:frames.at(-1).time-frames[0].time}));
