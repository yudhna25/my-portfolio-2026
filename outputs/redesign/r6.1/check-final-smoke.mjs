import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const result={errors:[],warnings:[],assets:[],swPrecache:[]};
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  const page=await context.newPage();page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());if(m.type()==='warning')result.warnings.push(m.text());});
  await page.goto('http://127.0.0.1:4173/?reader-preview=edura',{waitUntil:'networkidle'});await page.waitForTimeout(1200);
  result.shell=await page.evaluate(()=>({reader:document.querySelectorAll('[data-edura-reader]').length,canvas:document.querySelectorAll('canvas').length,hero:document.querySelector('#hero-heading')?.textContent,overflow:document.documentElement.scrollWidth-innerWidth}));
  assert.equal(result.shell.reader,0);assert.equal(result.shell.canvas,1);assert.equal(result.shell.overflow,0);assert.equal(result.shell.hero,'PORTFOLIO');
  const sw=fs.readFileSync('dist/sw.js','utf8');
  for(const asset of JSON.parse(fs.readFileSync('outputs/redesign/r6.1/selected-assets.json')).assets){
    const url=asset.recommendedPublicPath.replace('public/','');
    assert(sw.includes(url));result.swPrecache.push(url);
    const response=await context.request.get('http://127.0.0.1:4173/'+url),bytes=await response.body();
    const sha256=crypto.createHash('sha256').update(bytes).digest('hex');assert.equal(response.status(),200);assert.equal(sha256,asset.actual.sha256);
    result.assets.push({url,status:response.status(),bytes:bytes.length,sha256});
  }
  assert(fs.existsSync('dist/manifest.webmanifest'));assert.equal(result.errors.length,0);result.browser=browser.version();result.status='pass';
}finally{await browser.close();fs.writeFileSync('outputs/redesign/r6.1/final-smoke.json',JSON.stringify(result,null,2));}
console.log(JSON.stringify(result,null,2));
