import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const path = name => new URL(name, import.meta.url).pathname.replace(/^\//, '');
mkdirSync(path('screenshots/'), { recursive: true });
const result = { started: new Date().toISOString(), poses: [], interactions: [], lab: [], errors: [], warnings: [] };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
let page;
const listen = p => {
  p.on('pageerror', e => result.errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()); if (m.type() === 'warning') result.warnings.push(m.text()); });
};
async function attach() {
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(e => e.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const fiber = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { ScrollSmoother, ScrollTrigger } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { useAudioStore } = await import(loaded('/src/stores/useAudioStore.js'));
    const { triggerShootingStar } = await import(loaded('/src/3d/utils/shootingStars.js'));
    window.qa = { ...fiber, useScrollStore, useAudioStore, ScrollSmoother, ScrollTrigger, triggerShootingStar,
      store: fiber._roots.get(document.querySelector('[data-galaxy-scene] canvas')).store };
  });
}
async function state() {
  return page.evaluate(() => {
    const f = qa.store.getState(), s = qa.useScrollStore.getState();
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const names = []; f.scene.traverse(o => { if(o.name) names.push(o.name); });
    const palette = [];
    for (const el of document.querySelectorAll('nav *, dialog[open] *, main *')) {
      if (el.closest('svg') || el.matches('img') || el.getBoundingClientRect().width === 0) continue;
      const cs = getComputedStyle(el);
      for (const prop of ['color','backgroundColor','borderTopColor','boxShadow']) {
        const colors = cs[prop].matchAll(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)(?:[, /]+([\d.]+))?\)/g);
        for (const c of colors) if ((c[4] === undefined || Number(c[4]) > 0) && Math.max(+c[1],+c[2],+c[3])-Math.min(+c[1],+c[2],+c[3])>1) palette.push({tag:el.tagName,prop,value:cs[prop]});
      }
    }
    return { theme: document.documentElement.dataset.theme, htmlClass: document.documentElement.className, bodyClass: document.body.className,
      bg: getComputedStyle(document.body).backgroundColor, meta: document.querySelector('meta[name="theme-color"]').content,
      storage: localStorage.getItem('stellar-theme'), palette, names, canvas: document.querySelectorAll('canvas').length,
      hud: document.querySelectorAll('[data-cockpit],[data-mission-progress],[data-theme-toggle],[data-orbit-window],[data-planet-window],[data-constellation-grid]').length,
      glasses: document.querySelectorAll('.glass-card,.glass-tab,.glass-tab-active,[data-glass-card]').length,
      overflow: document.documentElement.scrollWidth-innerWidth, camera: f.camera.position.toArray(), glError: gl.getError(),
      cameraWriters: f.internal.subscribers.filter(s=>s.priority===-1).length, progress:s.scrollProgress, section:s.currentSection,
      dpr:f.gl.getPixelRatio(), quality:document.querySelector('[data-galaxy-scene]').dataset.quality,
      gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER), viewport:[innerWidth,innerHeight],
      lens:document.querySelectorAll('[data-cursor-lens]').length, cursor:document.querySelectorAll('[data-custom-cursor]').length,
      audio:{isMuted:qa.useAudioStore.getState().isMuted,isStarted:qa.useAudioStore.getState().isStarted} };
  });
}
function check(s, label) {
  assert.equal(s.theme,'dark',label); assert.equal(s.bg,'rgb(5, 5, 5)',label); assert.equal(s.meta,'#050505',label); assert.equal(s.storage,'dark',label);
  assert.equal(s.hud,0,label); assert.equal(s.glasses,0,label); assert.equal(s.overflow,0,label); assert.equal(s.palette.length,0,JSON.stringify(s.palette));
  assert.equal(s.canvas,1,label); assert.equal(s.cameraWriters,1,label); assert(s.camera.every(Number.isFinite),label); assert.equal(s.glError,0,label);
  assert(!s.names.some(n=>/stardust|orbital|planet|constellations-(?:cygnus|centaurus|taurus|gemini)/i.test(n)),label);
}
async function jump(id) {
  await page.evaluate(id => {
    const target=document.getElementById(id), smoother=qa.ScrollSmoother.get();
    if(smoother) smoother.scrollTo(target,false,'top 80px');
    else window.scrollTo(0,target.getBoundingClientRect().top+scrollY-80);
    qa.ScrollTrigger.update();
  },id);
  await page.waitForTimeout(1250);
}
async function shot(name) { await page.mouse.move(5,5); await page.screenshot({ path:path(`screenshots/${name}.png`) }); }
async function scenePixels(name) {
  const pixels=await page.evaluate(()=>new Promise(resolve=>{const stop=qa.addAfterEffect(()=>{stop();resolve(document.querySelector('[data-galaxy-scene] canvas').toDataURL());});}));
  writeFileSync(path(`screenshots/${name}.png`),Buffer.from(pixels.split(',')[1],'base64'));
  return page.evaluate(async pixels=>{
    const img=await createImageBitmap(await (await fetch(pixels)).blob()), canvas=new OffscreenCanvas(img.width,img.height),ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,img.width,img.height).data;let colored=0,max=0,bright=0;
    for(let i=0;i<data.length;i+=4){const delta=Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2]);max=Math.max(max,delta);if(delta>1)colored++;if(data[i]>20)bright++;}
    return {width:img.width,height:img.height,colored,max,bright};
  },pixels);
}
try {
  // Production first paint with CSS/React delayed: saved light cannot make a white frame.
  const earlyContext=await browser.newContext({viewport:{width:390,height:844}}), early=await earlyContext.newPage();listen(early);
  await early.addInitScript(()=>{localStorage.setItem('stellar-theme','light');localStorage.setItem('stellar-audio',JSON.stringify({state:{isMuted:false},version:0}));});
  await early.route('**/assets/**',async route=>{await new Promise(r=>setTimeout(r,1500));await route.continue();});
  await early.goto('http://127.0.0.1:4173/',{waitUntil:'commit'});
  await early.waitForFunction(()=>document.body&&document.documentElement.dataset.theme==='dark');
  const first=await early.evaluate(()=>({bg:getComputedStyle(document.body).backgroundColor,meta:document.querySelector('meta[name="theme-color"]').content,storage:localStorage.getItem('stellar-theme'),audio:JSON.parse(localStorage.getItem('stellar-audio')).state.isMuted}));
  assert.equal(first.bg,'rgb(5, 5, 5)');assert.equal(first.storage,'dark');assert.equal(first.meta,'#050505');assert.equal(first.audio,false);
  await early.screenshot({path:path('screenshots/production-before-modules.png')});result.interactions.push({test:'production first paint before modules',...first});
  await early.waitForSelector('[data-sound-toggle]');await early.waitForTimeout(3300);
  assert.equal(await early.locator('[data-sound-toggle]').getAttribute('aria-checked'),'false');
  await early.evaluate(()=>navigator.serviceWorker.ready);await early.reload();await early.waitForTimeout(3800);
  const pwa=await early.evaluate(()=>({controlled:Boolean(navigator.serviceWorker.controller),bg:getComputedStyle(document.body).backgroundColor,theme:document.documentElement.dataset.theme,meta:document.querySelector('meta[name="theme-color"]').content,audio:JSON.parse(localStorage.getItem('stellar-audio')).state.isMuted}));
  assert(pwa.controlled);assert.equal(pwa.bg,'rgb(5, 5, 5)');assert.equal(pwa.audio,false);result.interactions.push({test:'production SW-controlled reload',...pwa});await earlyContext.close();

  page=await context.newPage();listen(page);
  await page.addInitScript(()=>{localStorage.setItem('stellar-theme','light');});
  await page.goto('http://127.0.0.1:5173/');await page.waitForSelector('[data-galaxy-scene] canvas');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(3500);await attach();
  for(const width of [1440,1920,390,320]) {
    await page.setViewportSize({width,height:width<500?844:900});await page.waitForTimeout(900);
    for(const id of ['hero','about','skills','work','transmission']) {
      await jump(id);const s=await state();check(s,`${width}-${id}`);result.poses.push({label:`${width}-${id}`,...s});await shot(`${width}-${id}`);
    }
    if(width<500){assert.equal((await state()).cursor,0);assert.equal((await state()).lens,0);}
    // Native keyboard dialog, language actions and focus restore at every width.
    await jump('hero');const menu=page.locator('nav button[aria-controls="stellar-menu"]');await menu.focus();await page.keyboard.press('Enter');
    await page.waitForSelector('#stellar-menu[open]');await page.waitForTimeout(900);
    for(let i=0;i<24;i++){await page.keyboard.press(i<12?'Tab':'Shift+Tab');assert(await page.evaluate(()=>document.activeElement.closest('#stellar-menu')!==null));}
    await page.locator('#stellar-menu [role="group"] button').nth(1).click();await page.waitForTimeout(700);assert.equal(await page.getAttribute('html','lang'),'en');
    check(await state(),`${width}-en-menu`);await shot(`${width}-menu-en`);
    await page.locator('#stellar-menu [role="group"] button').nth(0).focus();await page.keyboard.press('Enter');await page.waitForTimeout(600);assert.equal(await page.getAttribute('html','lang'),'vi');
    await page.keyboard.press('Escape');assert(await menu.evaluate(el=>document.activeElement===el));
    result.interactions.push({test:'native menu trap/Vi-En/Escape',width,tabSteps:24,restored:true});
  }
  await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(700);await jump('hero');
  const menu=page.locator('nav button[aria-controls="stellar-menu"]');await menu.focus();await page.keyboard.press('Enter');
  await page.locator('#stellar-menu a[href="#about"]').focus();await page.keyboard.press('Enter');await page.waitForTimeout(700);
  assert(await page.evaluate(()=>document.activeElement===document.getElementById('about')));result.interactions.push({test:'native menu keyboard section focus',target:'about'});
  for(const [id,selector] of [['hero','#hero h1'],['about','.avatar-img'],['work','[data-project-image]']]) {
    await jump(id);const target=page.locator(selector).first(),rect=await target.boundingBox();assert(rect);
    const x=rect.x+rect.width*.4,y=Math.min(700,Math.max(130,rect.y+rect.height*.35));
    // Work's existing hover scale changes its box; compare once that hover has settled.
    await page.mouse.move(x,y);await page.waitForTimeout(350);const before=await target.boundingBox();await page.mouse.move(x+4,y);await page.waitForTimeout(250);
    assert.equal(await page.locator('[data-cursor-lens]').getAttribute('data-active'),'true',`${id} lens`);
    const after=await target.boundingBox();assert.deepEqual(after,before,`${id} hitbox`);
    const lens=await page.locator('[data-cursor-lens]').evaluate(el=>({filter:getComputedStyle(el).backdropFilter,width:el.offsetWidth,height:el.offsetHeight}));
    assert(lens.filter.includes('cursor-gravity'));assert.equal(lens.width,80);assert.equal(lens.height,80);
    await page.screenshot({path:path(`screenshots/1440-lens-${id}.png`)});result.interactions.push({test:'lens scoped and stable hitbox',id,lens});
  }
  await page.mouse.move(40,30);assert.equal(await page.locator('[data-cursor-lens]').getAttribute('data-active'),'false');
  await jump('work');await page.locator('[data-cursor="view"]').first().hover();await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-custom-cursor]').getAttribute('data-cursor-state'),'view');result.interactions.push({test:'VIEW cursor',state:'view'});
  await jump('work');const magnet=page.locator('#work button[data-magnetic]').first();await magnet.hover();const mr=await magnet.boundingBox();await page.mouse.move(mr.x+mr.width*.8,mr.y+mr.height*.5);await page.waitForTimeout(350);
  const translate=await magnet.evaluate(el=>getComputedStyle(el).translate);assert.notEqual(translate,'none');assert(Math.hypot(...translate.split(' ').map(parseFloat))<=8.01);result.interactions.push({test:'native magnetic radial bound',translate});
  await jump('hero');await page.mouse.move(700,700);await page.mouse.wheel(0,520);await page.waitForTimeout(800);
  const hidden=await page.locator('header > nav').evaluate(el=>el.getBoundingClientRect().bottom);assert(hidden<=1);
  await page.mouse.wheel(0,-220);await page.waitForTimeout(800);const revealed=await page.locator('header > nav').evaluate(el=>el.getBoundingClientRect().top);assert(Math.abs(revealed)<1);
  result.interactions.push({test:'native nav auto-hide/reveal',hidden,revealed});
  const sound=page.locator('[data-sound-toggle]');await sound.focus();await page.keyboard.press('Space');await page.waitForTimeout(350);
  assert.equal((await state()).audio.isStarted,true);assert.equal((await state()).audio.isMuted,false);await page.keyboard.press('Space');await page.waitForTimeout(350);assert.equal((await state()).audio.isMuted,true);
  await page.keyboard.press('Space');await page.waitForTimeout(350);assert.equal((await state()).audio.isMuted,false);
  await page.reload();await page.waitForSelector('canvas');await page.waitForTimeout(3500);await attach();const audio=(await state()).audio;
  assert.equal(audio.isStarted,false);assert.equal(audio.isMuted,false);assert.equal(await sound.getAttribute('aria-checked'),'false');result.interactions.push({test:'Sound native opt-in/mute/reload',...audio});
  await page.evaluate(()=>qa.triggerShootingStar());await page.waitForTimeout(170);const meteor=await scenePixels('scene-white-meteor');assert.equal(meteor.colored,0);
  assert(await page.evaluate(()=>qa.store.getState().scene.getObjectByName('shooting-stars').geometry.attributes.aAlpha.array.some(a=>a>0)));result.interactions.push({test:'live meteor + scene mono',...meteor});
  for(const reduced of ['reduce','no-preference','reduce','no-preference']) {
    await page.emulateMedia({reducedMotion:reduced});await page.waitForTimeout(850);check(await state(),`motion-${reduced}`);
    assert.equal(await page.locator('[data-cursor-lens]').count(),reduced==='reduce'?0:1);
    assert.equal(await page.evaluate(()=>Boolean(qa.store.getState().scene.getObjectByName('shooting-stars'))),reduced!=='reduce');
    result.interactions.push({test:'live reduced motion cleanup',reduced});
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForSelector('canvas');await page.waitForTimeout(3500);await attach();check(await state(),'fresh-reduced');await shot('1440-fresh-reduced');
  assert.equal(await page.locator('[data-cursor-lens]').count(),0);
  for(const width of [320,390,1440,1920]) {
    await page.setViewportSize({width,height:width<500?844:900});await page.waitForTimeout(750);
    for(const id of ['about','skills','transmission']) {await jump(id);const s=await state();check(s,`${width}-${id}-reduced`);assert.equal(s.lens,0);result.poses.push({label:`${width}-${id}-reduced`,...s});await shot(`${width}-${id}-reduced`);}
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  // Shared lab keeps the validated R2 portal/Works/finale and sole camera writer.
  await page.goto('http://127.0.0.1:5173/3d-lab.html?story=1');await page.waitForSelector('canvas');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1100);
  await page.evaluate(async()=>{const urls=performance.getEntriesByType('resource').map(e=>e.name),loaded=n=>urls.filter(u=>u.includes(n)).at(-1);const fiber=await import(loaded('/@react-three_fiber.js'));const {useScrollStore}=await import(loaded('/src/stores/useScrollStore.js'));window.qa={...fiber,useScrollStore,store:fiber._roots.get(document.querySelector('canvas')).store};});
  for(const [chapter,p] of [['portal',.5],['works',0],['finale',.75],['contact',1]]) {
    await page.selectOption('#lab-chapter',chapter);await page.locator(`[data-pose="${p}"]`).click();await page.waitForTimeout(180);
    const s=await page.evaluate(()=>{const f=qa.store.getState(),s=qa.useScrollStore.getState();return{chapter:s.storyChapter,p:s.chapterProgress,canvas:document.querySelectorAll('canvas').length,cameraWriters:f.internal.subscribers.filter(s=>s.priority===-1).length,camera:f.camera.position.toArray(),works:Boolean(f.scene.getObjectByName('works-constellations')),glError:f.gl.getContext().getError()};});
    assert.equal(s.chapter,chapter);assert.equal(s.p,p);assert.equal(s.canvas,1);assert.equal(s.cameraWriters,1);assert(s.works);assert(s.camera.every(Number.isFinite));assert.equal(s.glError,0);result.lab.push(s);
  }
  assert.equal(result.errors.length,0,JSON.stringify(result.errors));result.completed=new Date().toISOString();result.browser=browser.version();console.log('PASS',result.poses.length,'section snapshots;',result.interactions.length,'interaction checks;',result.lab.length,'shared lab poses.');
} finally { writeFileSync(path('browser-results.json'),JSON.stringify(result,null,2)+'\n');await browser.close(); }
