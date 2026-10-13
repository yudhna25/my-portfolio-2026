import { chromium, edge, base, ready, scrollChapter, scene, save } from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
 await page.goto(base);await ready(page);const records=[];
 await scrollChapter(page,'experience',.85);
 for(let cycle=0;cycle<3;cycle++) {
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(800);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(800);await scrollChapter(page,'portal',.12);
  await page.waitForTimeout(1000);const s=await scene(page);records.push({cycle,memory:s.resources,chapter:s.chapter,p:s.p});
 }
 save('lifecycle-probe.json',{records});console.log(records);
}finally{await browser.close();}
