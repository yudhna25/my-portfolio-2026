import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,edge,out,sha,save} from './common.mjs';
const build=JSON.parse(fs.readFileSync(out+'/build-source.json','utf8'));
for(const [file,hash]of Object.entries({...build.source,...build.dist}))assert.equal(sha(file),hash,file);
const clips=JSON.parse(fs.readFileSync(out+'/clip-results.json','utf8'));
assert.deepEqual(clips.source,build.source);
for(const clip of clips.records)assert.equal(sha(clip.file),clip.sha256);
for(const report of ['upgrade-results.json','browser-results.json','extras-results.json']){const data=JSON.parse(fs.readFileSync(out+'/'+report));assert.equal(data.status,'pass',report);if(data.source)assert.deepEqual(data.source,build.source,report);}
const browser=await chromium.launch({executablePath:edge,headless:true});
const records=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto(pathToFileURL(path.resolve(out,'review.html')).href);
 const images=await page.evaluate(async()=>{const nodes=[...document.images];for(const node of nodes){node.loading='eager';await node.decode();}return nodes.map(n=>({src:n.getAttribute('src'),width:n.naturalWidth,height:n.naturalHeight}));});
 assert.equal(images.length,12);assert(images.every(n=>n.width&&n.height));
 for(let index=0;index<2;index++){
  const video=page.locator('video').nth(index);
  await video.evaluate(async v=>{v.muted=true;await v.play();});await page.waitForTimeout(700);
  const moving=await video.evaluate(v=>({time:v.currentTime,duration:v.duration,error:v.error?.message}));
  assert(moving.time>.1&&Number.isFinite(moving.duration)&&!moving.error);
  await video.evaluate(v=>{v.pause();v.currentTime=v.duration*.6;});
  await page.waitForFunction(i=>{const v=document.querySelectorAll('video')[i];return !v.seeking&&Math.abs(v.currentTime-v.duration*.6)<.2},index);
  records.push(moving);
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 const files=[...images.map(n=>out+'/'+n.src),...clips.records.map(c=>c.file),out+'/review.html'];
 save('evidence-index.json',{date:new Date().toISOString(),files:Object.fromEntries(files.map(f=>[f,sha(f)]))});
 save('gallery-results.json',{status:'pass',browser:browser.version(),images,videos:records,errors});console.log('Gallery: 12 images decoded; both videos play and seek; all source/dist hashes match');
}finally{await browser.close();}
