import {chromium,edge,base,ready,save} from './common.mjs';
const b=await chromium.launch({executablePath:edge,headless:true}),page=await b.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'}),records=[];
try{
 await page.goto(base,{waitUntil:'domcontentloaded'});console.log('loaded');await ready(page);console.log('ready');await page.waitForTimeout(800);
 for(const id of ['baseline','hero-year-twinkle','hero-year-meteors']){
  if(id!=='baseline')await page.evaluate(id=>{motionQA.gsap.getById(id)?.pause()},id);
  await page.evaluate(()=>{const root=motionQA.root.getState();window.profileFrames=0;window.removeProfile=root.internal.subscribe({current:()=>profileFrames++},-100,{getState:root.get});window.profileStart=performance.now()});
  await page.waitForTimeout(1800);
  records.push(await page.evaluate(id=>{removeProfile();return{id,frames:profileFrames,elapsed:performance.now()-profileStart,fps:profileFrames*1000/(performance.now()-profileStart)}},id));
  console.log(JSON.stringify(records.at(-1)));save('year-profile.json',records);
 }
 save('year-profile.json',records);console.log(JSON.stringify(records));
}finally{await b.close()}
