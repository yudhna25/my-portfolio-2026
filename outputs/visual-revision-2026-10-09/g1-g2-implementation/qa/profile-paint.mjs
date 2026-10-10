import {chromium,edge,base,ready,save} from './common.mjs';
const b=await chromium.launch({executablePath:edge,headless:true}),p=await b.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'}),records=[];
try{
 await p.goto(base);await ready(p);await p.waitForTimeout(500);
 for(const [name,css] of [
  ['baseline','/* baseline */'],
  ['svg-composite','.hero-year-svg{will-change:transform}'],
  ['year-composite','[data-hero-year]{will-change:transform}'],
  ['contour-contain','.hero-year-svg{contain:paint;will-change:transform}'],
  ['no-star-fill','.hero-year-base{fill:none!important}'],
  ['no-vector-effect','.hero-year-svg path{vector-effect:none!important}'],
 ]){
  const style=await p.addStyleTag({content:css});
  await p.evaluate(()=>{const r=motionQA.root.getState();window.pFrames=0;window.pRemove=r.internal.subscribe({current:()=>pFrames++},-100,{getState:r.get});window.pStart=performance.now()});
  await p.waitForTimeout(1500);
  const result=await p.evaluate(name=>{pRemove();return{name,fps:pFrames*1000/(performance.now()-pStart)}},name);
  records.push(result);console.log(JSON.stringify(result));await style.evaluate(e=>e.remove());
 }
 const rects=await p.locator('.hero-year-svg').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}));
 save('paint-profile.json',{records,rects});
}finally{await b.close()}
