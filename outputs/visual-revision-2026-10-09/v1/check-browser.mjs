import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href);
const base = process.argv[2] || 'http://127.0.0.1:5181';
const out = 'outputs/visual-revision-2026-10-09/v1';
const fingerprint = () => Object.fromEntries(['src/components/Hero.jsx','src/components/effects/PortalHeading.jsx','src/styles/hero.css','src/3d/components/BlackHole.jsx','src/3d/components/BlackHoleSystem.jsx','src/3d/shaders/blackHole.js','src/3d/quality.js'].map(file => [file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
const report = { startedAt:new Date().toISOString(), base, sourceStart:fingerprint(), checks:[], frames:[], metrics:[], errors:[], warnings:[] };
const save = () => fs.writeFileSync(`${out}/browser-results.json`, JSON.stringify(report,null,2)+'\n');
const browser = await chromium.launch({channel:'msedge',headless:true});
report.browser=browser.version();
function check(label, value, detail) { report.checks.push({label,pass:Boolean(value),detail}); save(); assert(value,label); }
function track(page,label) {
  const evaluate=page.evaluate.bind(page);
  page.evaluate=async (...args)=>{
    let timer;
    try { return await Promise.race([evaluate(...args),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label}: evaluate timeout`)),20000);})]); }
    finally { clearTimeout(timer); }
  };
  page.on('pageerror', e => report.errors.push({label,message:e.message}));
  page.on('console', m => { if (m.type()==='error'||m.type()==='warning') report[m.type()==='error'?'errors':'warnings'].push({label,message:m.text()}); });
}
async function bridge(page) {
  await page.evaluate(async () => {
    const {useScrollStore}=await import('/src/stores/useScrollStore.js');
    const gsap=await import('/src/hooks/useGSAPSetup.js');
    const {i18n}=await import('/src/i18n/config.js');
    window.v1={scroll:useScrollStore,gsap,i18n};
  });
}
async function seek(page,chapter,p=0) {
  await page.evaluate(({chapter,p})=>{
    const content=document.getElementById('smooth-content');
    const markers=[...content.querySelectorAll('[data-story-chapter]')];
    const range=markers.find(e=>e.dataset.storyChapter===(chapter==='hero'?'portal':chapter));
    const start=range.getBoundingClientRect().top-content.getBoundingClientRect().top;
    const next=markers[markers.indexOf(range)+1];
    const end=next?next.getBoundingClientRect().top-content.getBoundingClientRect().top:document.documentElement.scrollHeight-innerHeight;
    const y=start+(end-start)*p;
    v1.scroll.getState().setStoryPosition(chapter,p,y/Math.max(1,document.documentElement.scrollHeight-innerHeight),true);
    const smoother=v1.gsap.ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTop(y); const trigger=smoother.scrollTrigger; trigger.update();
      const tween=trigger.getTween(); if (typeof tween?.progress==='function') tween.progress(1).pause();
      trigger.animation.progress(trigger.progress);
    } else window.scrollTo(0,y);
  },{chapter,p});
}
async function metrics(page) {
  return page.evaluate(()=>{
    const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const svg=document.querySelector('.hero-year-svg'), title=document.querySelector('h1');
    const c=document.createElement('canvas').getContext('2d');
    const font=parseFloat(getComputedStyle(title).fontSize);c.font=`800 ${font}px "Unbounded Variable"`;
    const o=c.measureText('O');
    const result={width:innerWidth,height:innerHeight,lang:document.documentElement.lang,rootFont:getComputedStyle(document.documentElement).fontSize,
      content:rect('[data-hero-content]'),title:rect('h1'),year:rect('.hero-year-svg'),anchor:rect('[data-story-anchor]'),name:rect('[data-hero-name]'),role:rect('[data-hero-role]'),intro:rect('[data-hero-layer="intro"]'),indicator:rect('[data-hero-layer="indicator"]'),
      yearFontRatio:1000*svg.getScreenCTM().a/font,stroke:getComputedStyle(svg.querySelector('tspan[data-year-glyph]')).strokeWidth,
      vector:getComputedStyle(svg.querySelector('tspan[data-year-glyph]')).vectorEffect,
      anchorInkHeight:o.actualBoundingBoxAscent+o.actualBoundingBoxDescent,
      finalColor:getComputedStyle(document.querySelector('[data-portal-char]:last-child')).color,
      overflow:document.documentElement.scrollWidth-innerWidth, heroOverflow:document.querySelector('[data-hero-content]').scrollWidth-document.querySelector('[data-hero-content]').clientWidth,
      scrollableHero:document.querySelector('[data-hero-details]').scrollHeight>document.querySelector('[data-hero-details]').clientHeight,
      outsideOverflow:[...document.querySelectorAll('body *')].filter(e=>!e.closest('[data-portal-stage]')&&e.getBoundingClientRect().right>innerWidth+1).slice(0,8).map(e=>({tag:e.tagName,id:e.id,class:e.className?.baseVal??e.className,right:e.getBoundingClientRect().right})),
      semanticYear:document.querySelector('[data-hero-year]>.sr-only').textContent,
      accessibleTitle:title.getAttribute('aria-label'),glyphs:document.querySelectorAll('[data-portal-char]').length,
      nameSemantic:document.querySelector('[data-hero-name]>.sr-only').textContent,nameVisual:document.querySelector('[data-hero-decode]').textContent,
      dashOffset:getComputedStyle(document.querySelector('[data-year-dash]')).strokeDashoffset,
      idle:document.querySelector('[data-portal-stage]').dataset.heroIdle, canvasCount:document.querySelectorAll('canvas').length};
    return result;
  });
}
async function snap(page,label) {
  const file=`${out}/screenshots/${label}.png`;await page.screenshot({path:file});report.frames.push({label,file,source:fingerprint()});save();
}
function geometryChecks(m,label) {
  check(`${label}: Hero has no horizontal overflow`,m.heroOverflow===0,m);
  if(m.rootFont==='16px') check(`${label}: page has no horizontal overflow`,m.overflow===0,m.overflow);
  check(`${label}: all four year digits fit`,m.year.left>=0&&m.year.right<=m.width&&Math.abs(m.yearFontRatio-1.6)<0.001,m.yearFontRatio);
  check(`${label}: heading/anchor fit`,m.anchor.width>0&&m.anchor.height>0&&m.anchor.right<=m.width&&m.title.left>=0,m.anchor);
  check(`${label}: semantic year/title stable`,m.semanticYear==='2026'&&m.accessibleTitle==='PORTFOLIO'&&m.glyphs===9);
  check(`${label}: final glyph transparent`,m.finalColor==='rgba(0, 0, 0, 0)');
  check(`${label}: contour 2px`,m.stroke==='2px'&&m.vector==='non-scaling-stroke');
  check(`${label}: complete decoded name`,m.nameSemantic===m.nameVisual,m.nameVisual);
  check(`${label}: role position`,m.width>=768?Math.abs(m.name.top+m.name.height/2-m.role.top-m.role.height/2)<1:m.role.top>=m.name.bottom,m.role);
  check(`${label}: left alignment`,Math.abs(m.year.left-m.title.left)<0.1&&Math.abs(m.name.left-m.title.left)<0.1&&Math.abs(m.intro.left-m.title.left)<0.1);
  if(m.width>=768) check(`${label}: 14% desktop inset`,Math.abs(m.title.left/m.width-.14)<0.001);
}
try {
  for(const [width,height] of [[320,568],[390,844],[1440,900],[1920,1080]]) {
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<768,serviceWorkers:'block'});
    const page=await context.newPage();track(page,`${width}-app`);
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelector('[data-portal-stage]')?.dataset.heroIdle==='true');
    await bridge(page);await page.evaluate(()=>document.fonts.ready);
    for(const lang of ['vi','en']) {
      await page.evaluate(lang=>v1.i18n.changeLanguage(lang),lang);await seek(page,'hero');await page.waitForTimeout(750);
      const m=await metrics(page);report.metrics.push(m);geometryChecks(m,`${width}-${lang}`);
      check(`${width}-${lang}: one canvas`,m.canvasCount===1);
      await snap(page,`${width}-${lang}`);
      await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.waitForTimeout(350);await seek(page,'hero');await page.waitForTimeout(750);
      const scaled=await metrics(page);report.metrics.push(scaled);geometryChecks(scaled,`${width}-${lang}-text200`);
      await snap(page,`${width}-${lang}-text200`);
      if(scaled.scrollableHero) {
        const before=(await metrics(page)).anchor;
        await page.locator('[data-hero-name]').focus();await page.keyboard.press('PageDown');await page.waitForTimeout(300);
        check(`${width}-${lang}-text200: keyboard can read overflow`,await page.evaluate(()=>document.querySelector('[data-hero-details]').scrollTop>0&&v1.scroll.getState().chapterProgress===0));
        check(`${width}-${lang}-text200: detail scroll preserves O`,JSON.stringify(before)===JSON.stringify((await metrics(page)).anchor));
        await snap(page,`${width}-${lang}-text200-scrolled`);
        await page.evaluate(()=>document.querySelector('[data-hero-details]').scrollTop=0);
      }
      await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));await page.waitForTimeout(350);await seek(page,'hero');
    }
    if(width===1440) {
      await page.evaluate(()=>v1.i18n.changeLanguage('vi'));await seek(page,'portal',.08);await seek(page,'hero');
      await page.waitForTimeout(60);
      check('name entry decodes',await page.evaluate(()=>v1.gsap.gsap.getById('hero-name-decode').isActive()&&document.querySelector('[data-hero-decode]').textContent!==v1.i18n.t('hero.name')));
      await page.waitForTimeout(650);const anchor=(await metrics(page)).anchor;
      await page.locator('[data-hero-name]').hover();await page.waitForTimeout(60);
      check('native hover decodes',await page.evaluate(()=>v1.gsap.gsap.getById('hero-name-decode').isActive()));
      await page.waitForTimeout(650);
      await page.evaluate(()=>{const nodes=[...document.querySelectorAll('a[href],button,[tabindex="0"]')].filter(e=>e.getClientRects().length&&!e.closest('[inert]'));const name=document.querySelector('[data-hero-name]');nodes[nodes.indexOf(name)-1].focus();});
      await page.keyboard.press('Tab');await page.waitForTimeout(60);
      check('native Tab focus decodes/ring',await page.evaluate(()=>document.activeElement.matches('[data-hero-name]')&&v1.gsap.gsap.getById('hero-name-decode').isActive()&&getComputedStyle(document.activeElement).outlineWidth==='2px'));
      await page.waitForTimeout(650);
      check('decode preserves O anchor',JSON.stringify(anchor)===JSON.stringify((await metrics(page)).anchor));
      const timing=await page.evaluate(()=>({flash:v1.gsap.gsap.getById('hero-year-glitch').duration(),dash:v1.gsap.gsap.getById('hero-year-dash').duration()}));
      check('cycle 15.8s / dash 6s',Math.abs(timing.flash-15.8)<0.001&&timing.dash===6,timing);
      await page.evaluate(()=>{v1.gsap.gsap.getById('hero-year-glitch').pause().time(0,false);v1.gsap.gsap.getById('hero-year-dash').pause().time(0);});
      for(const [time,expected,noise] of [[0,'6',false],[11.9,'6',false],[12.1,'6',true],[12.3,'7',true],[12.5,'7',false],[15.3,'7',false],[15.5,'7',true],[15.7,'6',true],[15.8,'6',false]]) {
        await page.evaluate(time=>{v1.gsap.gsap.getById('hero-year-glitch').time(time,false);},time);
        const state=await page.evaluate(()=>({digit:document.querySelector('[data-year-digit]').dataset.digit,noise:Number(getComputedStyle(document.querySelector('[data-year-noise]')).opacity),year:document.querySelector('[data-hero-year]>.sr-only').textContent}));
        check(`glitch checkpoint ${time}`,state.digit===expected&&(state.noise>0)===noise&&state.year==='2026',state);
        if([12.1,12.5,15.7].includes(time)) await snap(page,`1440-glitch-${time}`);
      }
      await seek(page,'portal',.08);
      const paused=await page.evaluate(()=>({flash:v1.gsap.gsap.getById('hero-year-glitch').paused(),dash:v1.gsap.gsap.getById('hero-year-dash').paused(),digit:document.querySelector('[data-year-digit]').dataset.digit,noise:Number(getComputedStyle(document.querySelector('[data-year-noise]')).opacity),tab:document.querySelector('[data-hero-name]').tabIndex}));
      check('portal pauses/resets/removes focus',paused.flash&&paused.dash&&paused.digit==='6'&&paused.noise===0&&paused.tab===-1,paused);
      await seek(page,'hero');await page.waitForTimeout(100);
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
      check('hidden event pauses/resets',await page.evaluate(()=>v1.gsap.gsap.getById('hero-year-glitch').paused()&&v1.gsap.gsap.getById('hero-year-dash').paused()&&document.querySelector('[data-year-digit]').dataset.digit==='6'));
      await page.waitForTimeout(250);
      check('hidden holds clocks at 0',await page.evaluate(()=>v1.gsap.gsap.getById('hero-year-glitch').time()===0&&v1.gsap.gsap.getById('hero-year-dash').time()===0));
      await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
      await page.waitForTimeout(150);
      check('visible restarts full 6 hold',await page.evaluate(()=>!v1.gsap.gsap.getById('hero-year-glitch').paused()&&v1.gsap.gsap.getById('hero-year-glitch').time()<1&&document.querySelector('[data-year-digit]').dataset.digit==='6'));
      await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);await seek(page,'hero');
      check('live reduced removes all ambient timelines',await page.evaluate(()=>!v1.gsap.gsap.getById('hero-year-glitch')&&!v1.gsap.gsap.getById('hero-year-dash')&&!v1.gsap.gsap.getById('hero-name-decode')&&document.querySelector('[data-year-digit]').dataset.digit==='6'));
      await snap(page,'1440-reduced');await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(150);await seek(page,'hero');
      check('motion resumes with one timeline per ID',await page.evaluate(()=>['hero-year-glitch','hero-year-dash','hero-name-decode'].every(id=>v1.gsap.gsap.globalTimeline.getChildren(true,true,true).filter(t=>t.vars.id===id).length===1)));
    }
    await context.close();
  }
  // Output-only fixture exercises StrictMode/props/unmount without changing App or stores.
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const page=await context.newPage();track(page,'fixture');
  await page.addInitScript(()=>{
    window.v1Listeners=[];
    const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener=function(type,listener,...args){if(type==='visibilitychange'||type==='pointerenter'||type==='focus')window.v1Listeners.push({target:this,type,listener});return add.call(this,type,listener,...args);};
    EventTarget.prototype.removeEventListener=function(type,listener,...args){window.v1Listeners=window.v1Listeners.filter(x=>!(x.target===this&&x.type===type&&x.listener===listener));return remove.call(this,type,listener,...args);};
  });
  await page.goto(`${base}/${out}/fixture.html`);await page.waitForSelector('[data-hero-name]');await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{v1Fixture.gsap.getById('hero-year-glitch').restart();});
  for(const [wait,expected] of [[11500,'6'],[1200,'7'],[2200,'7'],[1300,'6']]) {
    await page.waitForTimeout(wait);
    const real=await page.evaluate(()=>({time:v1Fixture.gsap.getById('hero-year-glitch').time(),digit:document.querySelector('[data-year-digit]').dataset.digit,year:document.querySelector('[data-hero-year]>.sr-only').textContent}));
    check(`real wall-clock cycle ${expected} at ${real.time.toFixed(2)}`,real.digit===expected&&real.year==='2026',real);
  }
  for(let i=0;i<3;i++) {
    await page.evaluate(()=>v1Fixture.render({visible:false}));await page.waitForTimeout(80);
    check(`props hidden reset ${i}`,await page.evaluate(()=>document.querySelector('[data-portal-stage]').inert&&document.querySelector('[data-year-digit]').dataset.digit==='6'&&v1Fixture.gsap.getById('hero-year-dash').paused()));
    await page.evaluate(()=>v1Fixture.render({visible:true,name:'TRAN VU ANH DUY'}));await page.waitForTimeout(80);
    check(`StrictMode/rebuild only one ${i}`,await page.evaluate(()=>['hero-year-glitch','hero-year-dash','hero-name-decode'].every(id=>v1Fixture.gsap.globalTimeline.getChildren(true,true,true).filter(t=>t.vars.id===id).length===1)));
  }
  await page.evaluate(()=>v1Fixture.unmount());await page.waitForTimeout(100);
  check('unmount kills ambient timelines',await page.evaluate(()=>['hero-year-glitch','hero-year-dash','hero-name-decode'].every(id=>!v1Fixture.gsap.getById(id))));
  check('unmount removes listeners',await page.evaluate(()=>v1Listeners.filter(x=>x.type==='visibilitychange'||x.target?.matches?.('[data-hero-name]')).length===v1Fixture.listenerBaseline));
  check('unmount removes store subscription',await page.evaluate(()=>v1Fixture.subscriptions()===0));
  await context.close();
  const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  const reducedPage=await reduced.newPage();track(reducedPage,'fresh-reduced');await reducedPage.goto(base);await reducedPage.waitForFunction(()=>document.querySelector('[data-portal-stage]')?.dataset.heroIdle==='true');await bridge(reducedPage);
  check('fresh reduced static and readable',await reducedPage.evaluate(()=>!v1.gsap.gsap.getById('hero-year-glitch')&&!v1.gsap.gsap.getById('hero-year-dash')&&document.querySelector('[data-hero-name]').tabIndex===0&&document.querySelector('[data-hero-decode]').textContent===v1.i18n.t('hero.name')));
  await snap(reducedPage,'390-fresh-reduced');await reduced.close();
  const lab=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});const labPage=await lab.newPage();track(labPage,'lab');await labPage.goto(`${base}/3d-lab.html?story=1&chapter=hero&p=0`);await labPage.waitForFunction(()=>document.querySelector('[data-portal-stage]')?.dataset.heroIdle==='true');await bridge(labPage);await labPage.evaluate(()=>document.fonts.ready);
  check('Lab API/font/no role compatible',await labPage.evaluate(()=>document.fonts.check('800 100px "Unbounded Variable"')&&!document.querySelector('[data-hero-role]')&&!v1.gsap.gsap.getById('hero-year-glitch')&&Boolean(v1.gsap.gsap.getById('hero-year-dash'))&&document.querySelector('[data-story-anchor]').getBoundingClientRect().width>0));
  await snap(labPage,'1440-lab');await lab.close();
  check('zero browser errors',report.errors.length===0,report.errors);
  report.completedAt=new Date().toISOString();report.sourceEnd=fingerprint();save();
  console.log(JSON.stringify({checks:report.checks.length,frames:report.frames.length,errors:report.errors,warnings:report.warnings},null,2));
} catch(e) {report.failure=e.stack;save();throw e;} finally {await browser.close();}
