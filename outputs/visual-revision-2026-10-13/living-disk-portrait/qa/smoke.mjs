import {chromium,edge,base,ready,scrollChapter,capture,save} from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true});
const records=[],errors=[];
try {
  const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page);
  await capture(page,'hero');
  for(const p of [.25,.34,.58,.7,.84,.94,.999]) {
    await scrollChapter(page,'portal',p);await page.waitForTimeout(250);await capture(page,'portal-'+p);
    records.push(await page.evaluate(()=>{const n=motionQA.root.getState().scene.getObjectByName('portrait-stars');return {p:motionQA.store.getState().chapterProgress,visible:n?.visible,count:n?.geometry.attributes.position?.count,morph:n?.material.uniforms.uMorph.value,rect:n?.material.uniforms.uRect.value.toArray(),img:getComputedStyle(document.querySelector('[data-portrait] img')).opacity}}));
  }
  await scrollChapter(page,'about',.12);await capture(page,'about');
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1000);await scrollChapter(page,'about',.15);await capture(page,'about-mobile');
  save('smoke.json',{records,errors});console.log(JSON.stringify({records,errors}));
}finally{await browser.close()}
