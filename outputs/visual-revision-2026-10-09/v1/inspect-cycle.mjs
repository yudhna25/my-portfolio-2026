import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
page.on('pageerror',e=>console.log(e.message));
await page.goto('http://127.0.0.1:5181');
await page.waitForFunction(()=>document.querySelector('[data-portal-stage]')?.dataset.heroIdle==='true');
await page.evaluate(async()=>{const {gsap}=await import('/src/hooks/useGSAPSetup.js');window.v1Fixture={gsap};});
console.log('app mounted');
for(const action of ['flashPause','flashZero','dashPause','dashZero']) {
  console.log(action);
  await Promise.race([page.evaluate(action=>{const f=v1Fixture.gsap.getById('hero-year-glitch'),d=v1Fixture.gsap.getById('hero-year-dash');if(action==='flashPause')f.pause();if(action==='flashZero')f.time(0,false);if(action==='dashPause')d.pause();if(action==='dashZero')d.time(0);},action),new Promise((_,reject)=>setTimeout(()=>reject(new Error(action+' timeout')),5000))]);
}
for(const t of [0,11.9,12.1,12.3,12.5,15.3,15.5,15.7,15.8]) {
  console.log('seeking',t);
  const result=await Promise.race([page.evaluate(t=>{const flash=v1Fixture.gsap.getById('hero-year-glitch');flash.pause();flash.time(t,false);return {digit:document.querySelector('[data-year-digit]').dataset.digit,time:flash.time()};},t),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Seek timeout')),5000))]);
  console.log(result);
}
await browser.close();
