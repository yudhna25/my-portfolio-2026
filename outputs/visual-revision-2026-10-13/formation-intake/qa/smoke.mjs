import { chromium, edge, base, ready, scene, capture, save, openingObserver } from './common.mjs';
const browser=await chromium.launch({executablePath:edge,headless:true,args:['--ignore-gpu-blocklist']});
const context=await browser.newContext({viewport:{width:1440,height:900}});
await openingObserver(context);
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(base,{waitUntil:'domcontentloaded'});await ready(page,{opening:true});
if(!await page.locator('[data-preloader]').count()) throw new Error('Opening finished before observer attached; these are not formation frames');
await page.waitForFunction(()=>motionQA.gsap.getById('preloader-intro'));
for(const p of [.08,.20,.32,.42,.52,.65,.8,.9,.99]){await page.evaluate(p=>motionQA.gsap.getById('preloader-intro')?.pause().progress(p),p);await page.waitForTimeout(80);await capture(page,'opening-'+String(p).replace('.','-'))}
await page.evaluate(()=>motionQA.gsap.getById('preloader-intro')?.totalProgress(1));await ready(page);await capture(page,'hero-1440-vi');save('smoke.json',{errors,scene:await scene(page),opening:await page.evaluate(()=>openingQA)});
await browser.close();console.log('SMOKE saved');
