import {chromium,edge,base,ready,scrollChapter,scene,save} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true});
const p=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'}),records=[];
try{
 await p.goto(base);await ready(p);
 for(const phase of ['initial','returned']) {
  if(phase==='returned'){await scrollChapter(p,'works',.3);await scrollChapter(p,'portal',0)}
  const trigger=p.locator('button[aria-controls="stellar-menu"]');await trigger.focus();
  const before=await p.evaluate(()=>({active:document.activeElement.outerHTML,inert:document.querySelector('[data-portal-controls]').inert,chapter:motionQA.store.getState().storyChapter,p:motionQA.store.getState().chapterProgress,y:motionQA.smoother.get()?.scrollTop(),hidden:document.hidden}));
  await p.keyboard.press('Enter');await p.waitForTimeout(800);
  records.push({phase,before,open:await p.locator('#stellar-menu').evaluate(n=>n.open),scene:await scene(p)});
  console.log(JSON.stringify({phase,before,open:records.at(-1).open}));
  if(records.at(-1).open){await p.keyboard.press('Escape');await p.waitForTimeout(800)}
 }
 save('menu-probe.json',records);
}finally{await browser.close()}
