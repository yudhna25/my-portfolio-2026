import {chromium,edge,base,ready,scrollChapter,selectWork,save} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
 await page.addInitScript(()=>{window.focusQA=[];const focus=HTMLElement.prototype.focus;HTMLElement.prototype.focus=function(...args){const result=focus.apply(this,args);focusQA.push({t:performance.now(),id:this.id,inert:!!this.closest('[inert]'),visible:checkVisibility.call(this),active:document.activeElement.id,stack:new Error().stack?.slice(0,500)});return result};function checkVisibility(){return this.checkVisibility()}});
 await page.addInitScript(()=>{document.addEventListener('focusout',e=>{if(e.target.id==='work-target-edura')focusQA.push({out:true,t:performance.now(),connected:e.target.isConnected,inert:!!e.target.closest('[inert]'),ancestor:e.target.closest('[inert]')?.outerHTML.slice(0,300),chapter:window.motionQA?.store.getState().storyChapter,p:window.motionQA?.store.getState().chapterProgress,visible:e.target.checkVisibility({visibilityProperty:true}),style:e.target.getAttribute('style'),stack:new Error().stack})},true)});
 await page.goto(base);await ready(page);await scrollChapter(page,'works',.3);await selectWork(page,'edura',false);const records=[];
 for(let i=0;i<1;i++){
  await page.locator('#work-case-edura').click();await page.waitForURL('**/projects/edura');await page.waitForTimeout(1000);
  await page.goBack();await ready(page);await page.waitForTimeout(2500);
  records.push(await page.evaluate(i=>({i,focus:focusQA.slice(-12),active:document.activeElement.id,chapter:motionQA.store.getState().storyChapter,reading:document.querySelector('#work')?.closest('[inert]')?.outerHTML.slice(0,200)}),i));
 }
 save('route-probe.json',{records});console.log(records.map(r=>({i:r.i,active:r.active,focus:r.focus.map(f=>({id:f.id,active:f.active,inert:f.inert,visible:f.visible}))})));
}finally{await browser.close()}
