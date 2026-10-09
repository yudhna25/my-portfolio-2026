import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href);
const out='outputs/visual-revision-2026-10-09/v1',base='http://127.0.0.1:5182';
const vi=JSON.parse(fs.readFileSync('src/i18n/locales/vi.json')),en=JSON.parse(fs.readFileSync('src/i18n/locales/en.json'));
const report={startedAt:new Date().toISOString(),base,buildFingerprint:JSON.parse(fs.readFileSync(`${out}/build-results.json`)).dist,checks:[],errors:[],configurations:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});report.browser=browser.version();
const save=()=>fs.writeFileSync(`${out}/production-results.json`,JSON.stringify(report,null,2)+'\n');
function check(label,value,detail){report.checks.push({label,pass:!!value,detail});save();assert(value,label);}
try {
  for(const [width,height] of [[390,844],[1440,900]]) {
    const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block',deviceScaleFactor:1});const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push({width,message:e.message}));page.on('console',m=>{if(m.type()==='error')report.errors.push({width,message:m.text()});});
    await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.querySelector('[data-portal-stage]')?.dataset.heroIdle==='true');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(750);
    report.configurations.push(await page.evaluate(()=>{const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),quality:document.querySelector('[data-galaxy-scene]').dataset.quality};}));
    check(`${width}: semantic heading/year`,await page.getByRole('heading',{name:'PORTFOLIO',exact:true}).count()===1&&await page.locator('[data-hero-year]>.sr-only').textContent()==='2026');
    const anchor=await page.locator('[data-story-anchor]').boundingBox();
    await page.locator('[data-hero-name]').hover();await page.waitForTimeout(80);
    check(`${width}: production hover decode`,await page.locator('[data-hero-decode]').textContent()!==vi.hero.name);
    await page.waitForTimeout(650);check(`${width}: Vietnamese decode restored`,await page.locator('[data-hero-decode]').textContent()===vi.hero.name);
    check(`${width}: anchor stable`,JSON.stringify(anchor)===JSON.stringify(await page.locator('[data-story-anchor]').boundingBox()));
    const first=await page.locator('[data-year-dash]').first().evaluate(e=>getComputedStyle(e).strokeDashoffset);await page.waitForTimeout(500);const second=await page.locator('[data-year-dash]').first().evaluate(e=>getComputedStyle(e).strokeDashoffset);
    check(`${width}: dash runs continuously`,first!==second,{first,second});
    await page.screenshot({path:`${out}/screenshots/${width}-production-vi.png`});
    await page.getByRole('button',{name:vi.nav.openMenu,exact:true}).click();await page.getByRole('button',{name:vi.nav.langEnFull,exact:true}).click();await page.keyboard.press('Escape');await page.waitForTimeout(950);
    check(`${width}: native menu language switch`,await page.locator('html').getAttribute('lang')==='en'&&await page.locator('[data-hero-decode]').textContent()===en.hero.name);
    await page.keyboard.press('Tab');await page.waitForTimeout(50);
    check(`${width}: native Tab focus/ring`,await page.locator('[data-hero-name]').evaluate(e=>document.activeElement===e&&getComputedStyle(e).outlineWidth==='2px'));
    await page.waitForTimeout(650);await page.screenshot({path:`${out}/screenshots/${width}-production-en.png`});
    await page.mouse.move(width*.5,height*.5);await page.mouse.wheel(0,250);await page.waitForFunction(()=>document.querySelector('[data-portal-stage]').dataset.heroIdle==='false');await page.waitForTimeout(1300);
    check(`${width}: native portal pauses/resets`,await page.evaluate(()=>document.querySelector('[data-year-digit]').dataset.digit==='6'&&document.querySelector('[data-hero-name]').tabIndex===-1&&parseFloat(getComputedStyle(document.querySelector('[data-year-dash]')).strokeDashoffset)===0));
    await page.mouse.wheel(0,-600);await page.waitForFunction(()=>document.querySelector('[data-portal-stage]').dataset.heroIdle==='true');await page.waitForTimeout(750);
    check(`${width}: native reverse restores Hero`,await page.locator('[data-hero-decode]').textContent()===en.hero.name&&await page.locator('[data-year-digit]').getAttribute('data-digit')==='6');
    check(`${width}: page overflow 0 / one Canvas`,await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth===0&&document.querySelectorAll('canvas').length===1));
    await context.close();
  }
  check('production browser errors 0',report.errors.length===0,report.errors);report.completedAt=new Date().toISOString();save();console.log(JSON.stringify({checks:report.checks.length,configurations:report.configurations,errors:report.errors},null,2));
}catch(e){report.failure=e.stack;save();throw e;}finally{await browser.close();}
