import assert from 'node:assert/strict';
import { chromium, edge, base, ready, scrollChapter, capture, save } from './common.mjs';
const b = await chromium.launch({executablePath:edge,headless:true});
const page = await b.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
const records=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(base);await ready(page);
 for(const [width,height] of [[320,760],[390,844],[768,1024],[1440,900],[1920,1080]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(800);
  for(const lang of ['vi','en']) {
   await page.evaluate(lang=>motionQA.i18n.changeLanguage(lang),lang);await page.waitForTimeout(700);await scrollChapter(page,'portal',0);
   const layout=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
    const lines=new Map(), walker=document.createTreeWalker(document.querySelector('.hero-intro'),NodeFilter.SHOW_TEXT);let node;
    while(node=walker.nextNode()) for(const word of node.textContent.matchAll(/\S+/g)) {
      const range=document.createRange();range.setStart(node,word.index);range.setEnd(node,word.index+word[0].length);
      const key=Math.round(range.getBoundingClientRect().y);lines.set(key,[...(lines.get(key)||[]),word[0]]);
    }
    return {year:rect('[data-hero-year] svg'),heading:rect('#hero-heading'),anchor:rect('[data-story-anchor="portal"]'),lines:[...lines.values()],overflow:document.documentElement.scrollWidth-innerWidth,abouts:document.querySelectorAll('#about').length};
   });
   records.push({width,height,lang,layout});
   assert.equal(layout.overflow,0);assert(Math.abs(layout.year.x-layout.heading.x)<1);assert(Math.abs(layout.year.y+layout.year.h/2-layout.heading.y-layout.heading.h/2)<1);
   assert(layout.lines.every(line=>line.length>=2),'orphan '+width+lang);if(width>=768)assert.equal(layout.lines.length,1);
   assert.equal(layout.abouts,1);await capture(page,'hero-'+width+'-'+lang);
  }
 }
 assert.equal(errors.length,0);save('hero-matrix.json',{status:'pass',records,errors});console.log('Hero matrix 10/10 pass');
} catch(e) {save('hero-matrix.json',{status:'fail',records,errors,failure:e.stack});throw e} finally {await b.close()}
