import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'frame-manifest.json'),'utf8'));
const cons=JSON.parse(fs.readFileSync(path.resolve(dir,'../r0.2/constellation-data.json'),'utf8'));
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const context=await browser.newContext({viewport:{width:1480,height:1100},deviceScaleFactor:1});
const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(pathToFileURL(path.join(dir,'storyboard.html')).href);
await page.waitForFunction(()=>window.__fontsReady===true);
await page.evaluate(async()=>{for(const family of ['Unbounded','Space Grotesk','JetBrains Mono'])await document.fonts.load('400 16px "'+family+'"','Trần Vũ Anh Duy 2026')});
const results=[];
for(const f of manifest.frames){
  await page.setViewportSize({width:f.width,height:f.width===1440?900:844});
  await page.selectOption('#width',String(f.width));await page.selectOption('#locale',f.locale);await page.selectOption('#frame',f.id);
  await page.evaluate(()=>document.fonts.ready);
  const evidence=await page.locator('.board:not([hidden])').evaluate(b=>{
    const svg=b.querySelector('svg'),v=svg.viewBox.baseVal,clips=[];
    for(const e of svg.querySelectorAll('text')){
      if(e.closest('.guides')||b.dataset.frame.startsWith('portal'))continue;
      const box=e.getBBox();
      if(box.x<-.5||box.x+box.width>v.width+.5||box.y<-.5||box.y+box.height>v.height+.5)clips.push({type:'text',text:e.textContent,box:{x:box.x,y:box.y,width:box.width,height:box.height}});
    }
    for(const e of svg.querySelectorAll('foreignObject')){
      const d=e.firstElementChild;if(d.scrollHeight>e.height.baseVal.value+1||d.scrollWidth>e.width.baseVal.value+1)clips.push({type:'copy',text:d.textContent,needed:[d.scrollWidth,d.scrollHeight],available:[e.width.baseVal.value,e.height.baseVal.value]});
    }
    const year=svg.querySelector('[data-year]');
    const g=svg.querySelector('[data-mini-anchor]');
    const title=svg.querySelector('[data-portfolio]');let o=null;if(title){const r=title.getExtentOfChar(8),p=new DOMPoint(r.x+r.width/2,r.y+r.height/2).matrixTransform(svg.getCTM().inverse().multiply(title.getCTM()));o=[p.x/v.width,p.y/v.height]}
    const rect=r=>({x:r.x,y:r.y,width:r.width,height:r.height});
    return {clips,o,constellationMarkup:[...svg.querySelectorAll('[data-constellation]')].map(e=>e.outerHTML),bhMarkup:svg.querySelector('[data-bh]')?.outerHTML||null,year:year?{text:year.textContent,semantic:year.getAttribute('aria-label'),box:rect(year.getBBox()),lastDigit:rect(year.getExtentOfChar(3)),firstThree:[0,1,2].map(i=>rect(year.getExtentOfChar(i))),oIndex:g?.dataset.oIndex}:null,logos:[...svg.querySelectorAll('[data-logo]')].map(e=>e.dataset.logo),constellations:[...svg.querySelectorAll('[data-constellation]')].map(e=>({id:e.dataset.constellation,origin:e.dataset.origin.split(',').map(Number),scale:Number(e.dataset.scale),stars:[...e.querySelectorAll('[data-hip]')].map(s=>({hip:Number(s.dataset.hip),x:Number(s.getAttribute('cx')),y:Number(s.getAttribute('cy'))})),edges:[...e.querySelectorAll('line')].map(l=>[l.x1.baseVal.value,l.y1.baseVal.value,l.x2.baseVal.value,l.y2.baseVal.value])})),controls:[...svg.querySelectorAll('[data-control] rect')].map(e=>[e.width.baseVal.value,e.height.baseVal.value]),overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),canvas:document.querySelectorAll('canvas').length,fonts:['Unbounded','Space Grotesk','JetBrains Mono'].map(f=>({name:f,loaded:document.fonts.check('400 16px "'+f+'"','Trần Vũ Anh Duy 2026')}))};
  });
  for(const g of evidence.constellations){
    const source=cons.constellations.find(c=>c.id===g.id).geometry;
    assert.deepEqual(g.stars.map(s=>s.hip).sort((a,b)=>a-b),source.stars.map(s=>s.hip).sort((a,b)=>a-b));
    assert.equal(g.edges.length,source.edges.length);
    for(const s of source.stars){const p=g.stars.find(p=>p.hip===s.hip);assert(Math.abs(p.x-(g.origin[0]+s.position[0]*g.scale))<.0001);assert(Math.abs(p.y-(g.origin[1]-s.position[1]*g.scale))<.0001)}
    for(const [i,[a,b]] of source.edges.entries()){const p=source.stars.find(s=>s.id===a),q=source.stars.find(s=>s.id===b);const expected=[g.origin[0]+p.position[0]*g.scale,g.origin[1]-p.position[1]*g.scale,g.origin[0]+q.position[0]*g.scale,g.origin[1]-q.position[1]*g.scale];assert(g.edges[i].every((v,j)=>Math.abs(v-expected[j])<.0002));}
  }
  const file=path.join(dir,f.screenshot);fs.mkdirSync(path.dirname(file),{recursive:true});
  await page.locator('.board:not([hidden])>svg').screenshot({path:file});
  results.push({key:f.key,...evidence});
}
await page.selectOption('#width','1440');await page.selectOption('#locale','vi');await page.selectOption('#frame','hero');await page.check('#guides');
await page.locator('.board:not([hidden])>svg').screenshot({path:path.join(dir,'hero-guides.png')});
await browser.close();
const report={checkedAt:new Date().toISOString(),browser:'Edge 154, isolated headless profile',viewports:[{width:1440,height:900,dpr:1},{width:390,height:844,dpr:1},{width:320,height:844,dpr:1}],frameCount:results.length,errorCount:errors.length,errors,clipCount:results.reduce((n,r)=>n+r.clips.length,0),results};
fs.writeFileSync(path.join(dir,'browser-verification.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({frames:results.length,errors,clips:results.filter(r=>r.clips.length).map(r=>({key:r.key,clips:r.clips})),fontFailures:results.filter(r=>r.fonts.some(f=>!f.loaded)).map(r=>r.key)},null,2));
assert.equal(results.length,150);assert.equal(errors.length,0);assert.equal(report.clipCount,0);assert(results.every(r=>r.canvas===0&&r.fonts.every(f=>f.loaded)));assert(results.every(r=>r.controls.every(c=>c[0]>=44&&c[1]>=44)));
assert(results.every(r=>r.overflow===0));
assert(results.filter(r=>r.key.endsWith('-hero')||r.key.endsWith('-glitch')).every(r=>r.year.box.x>=0&&r.year.box.x+r.year.box.width<=Number(r.key.split('-')[0])&&r.year.oIndex==='8'&&r.year.semantic==='2026'));

for(const width of [1440,390,320])for(const locale of ['vi','en']){const at=id=>results.find(r=>r.key===`${width}-${locale}-${id}`);assert.deepEqual(at('works').constellationMarkup,at('finale0').constellationMarkup);assert.equal(at('finale100').bhMarkup,at('contact').bhMarkup)}

for(const width of [1440,390,320])for(const locale of ['vi','en'])assert.deepEqual(results.find(r=>r.key===`${width}-${locale}-hero`).year.firstThree,results.find(r=>r.key===`${width}-${locale}-glitch`).year.firstThree);
