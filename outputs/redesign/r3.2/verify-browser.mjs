import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out = 'outputs/redesign/r3.2';
fs.mkdirSync(`${out}/screenshots`, { recursive: true });
const result = { started: new Date().toISOString(), poses: [], layouts: [], interactions: [], jumps: [], cycles: [], lab: [], errors: [], warnings: [] };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', e => result.errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()); if (m.type() === 'warning') result.warnings.push(m.text()); });
async function init(url = 'http://127.0.0.1:5173/') {
  await page.goto(url);
  await page.waitForSelector('[data-galaxy-scene] canvas');
  if (new URL(url).pathname === '/') await page.waitForFunction(async () => {
    const url = performance.getEntriesByType('resource').map(e => e.name).filter(u => u.includes('/src/stores/useLoadingStore.js')).at(-1);
    return url && !(await import(url)).useLoadingStore.getState().isLoading;
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(e => e.name), loaded = n => urls.filter(u => u.includes(n)).at(-1);
    const fiber = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { ScrollSmoother, ScrollTrigger, gsap } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { i18n } = await import(loaded('/src/i18n/config.js'));
    window.qa = { ...fiber, useScrollStore, ScrollSmoother, ScrollTrigger, gsap, storyCameraPath, i18n, store: fiber._roots.get(document.querySelector('canvas')).store };
    const f = qa.store.getState(), gl = f.gl, set = gl.setRenderTarget.bind(gl), render = gl.render.bind(gl);
    const targets = new Set(), rays = new Set(); let rayCalls = 0;
    gl.setRenderTarget = t => { if (t && !targets.has(t)) { targets.add(t); t.addEventListener('dispose', () => targets.delete(t)); } return set(t); };
    gl.render = (scene, camera) => { if (scene.children[0]?.material?.uniforms?.uObserver) { qa.rayUniforms = scene.children[0].material.uniforms; rays.add(gl.getRenderTarget().texture.uuid); rayCalls++; } return render(scene, camera); };
    qa.resources = () => ({ targets: targets.size, rays: [...rays], rayCalls });
  });
  await page.waitForTimeout(100);
}
async function scrollPose(p, hold = false) {
  await page.evaluate(({p,hold}) => {
    qa.useScrollStore.getState().setStoryManual(false);
    const content = document.getElementById('smooth-content').getBoundingClientRect();
    const about = document.querySelector('[data-story-chapter="about"]').getBoundingClientRect();
    const end = about.top - content.top;
    const smoother=qa.ScrollSmoother.get();
    if (smoother) { smoother.scrollTop(p*end);const t=smoother.scrollTrigger;t.update();t.animation.invalidate().progress(t.progress); } else scrollTo(0,p*end);
    if(hold)qa.useScrollStore.getState().setStoryPosition(p===0?'hero':p===1?'about':'portal',p===0||p===1?0:p,p*end/qa.ScrollTrigger.maxScroll(window),true);
  }, {p,hold});
  await page.waitForTimeout(450);
}
async function snapshot() {
  return page.evaluate(() => {
    const s = qa.useScrollStore.getState(), f = qa.store.getState();
    const u = f.scene.getObjectByName('accretion-disk').material.uniforms;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const expected = qa.storyCameraPath(s.storyChapter, s.chapterProgress, {}, reduced, innerWidth / innerHeight);
    const a = document.querySelector('[data-story-anchor="portal"]').getBoundingClientRect();
    const rect = e => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };
    const year = document.querySelector('[data-hero-year]');
    const glyphs = [...document.querySelectorAll('[data-portal-char]')];
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const forward = f.camera.getWorldDirection(f.camera.position.clone()).toArray();
    const direction = [expected.lookX - expected.x, expected.lookY - expected.y, expected.lookZ - expected.z];
    const length = Math.hypot(...direction);
    return { width: innerWidth, height: innerHeight, locale: qa.i18n.language, reduced, chapter: s.storyChapter, p: s.chapterProgress, current: s.currentSection, manual: s.storyManual,
      canvas: document.querySelectorAll('canvas').length, writers: f.internal.subscribers.filter(v => v.priority === -1).length,
      poseError: Math.max(Math.abs(f.camera.position.x - expected.x), Math.abs(f.camera.position.y - expected.y), Math.abs(f.camera.position.z - expected.z)),
      directionError: Math.max(...forward.map((v,i) => Math.abs(v - direction[i] / length))), camera: f.camera.position.toArray(),
      observerR: Math.hypot(f.camera.position.x,f.camera.position.y,f.camera.position.z+200), intensity: qa.rayUniforms.uDiskIntensity.value, mini: u.uPortalMini.value, visibility: u.uPortalVisibility.value, pull: u.uPortalPull.value, center: u.uPortalCenter.value.toArray(), scale: u.uPortalScale.value, aperture: u.uPortalRadius.value.toArray(),
      anchorError: Math.max(Math.abs(u.uPortalCenter.value.x * innerWidth - a.left - a.width/2), Math.abs((1-u.uPortalCenter.value.y) * innerHeight - a.top - a.height/2)),
      anchor: s.storyAnchor, backdrop: f.scene.getObjectByName('portal-backdrop').visible, meteor: f.scene.getObjectByName('shooting-stars')?.visible ?? false,
      worksModels: f.scene.getObjectByName('works-constellations') !== undefined, glError: gl.getError(), dpr: f.gl.getPixelRatio(), gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      resources: qa.resources(), memory: f.gl.info.memory, overflow: document.documentElement.scrollWidth-innerWidth,
      year: year.getAttribute('aria-label'), visualYear: year.textContent, yearRect: rect(year), glyphs: glyphs.map(rect), oIndex: glyphs.findIndex(e => e.dataset.storyAnchor === 'portal'), heading: document.querySelector('h1').getAttribute('aria-label'),
      textOpacity: +getComputedStyle(document.querySelector('[data-portal-stage]')).opacity, contentVisibility: getComputedStyle(document.querySelector('[data-story-content]') ?? document.querySelector('main')).visibility,
      inert: document.querySelector('[data-story-content]')?.inert, flashCount: qa.gsap.globalTimeline.getChildren(true, true, true).filter(t => t.vars.id === 'hero-year-glitch').length,
      hash: location.hash, triggers: qa.ScrollTrigger.getAll().length };
  });
}
function check(s) {
  assert.equal(s.canvas,1); assert.equal(s.writers,1); assert.equal(s.glError,0); assert.ok(s.observerR>1); assert.ok(s.poseError<1e-9); assert.ok(s.directionError<1e-9); assert.ok(s.anchorError<0.1); assert.equal(s.overflow,0); assert.equal(s.year,'2026'); assert.equal(s.oIndex,8); assert.equal(s.heading,'PORTFOLIO');
  assert.ok(s.yearRect.left>=0 && s.yearRect.right<=s.width && s.yearRect.bottom<=s.height);
  assert.ok(s.glyphs[0].left>=0 && s.glyphs.at(-1).right<=s.width);
}
try {
  await init();
  for (const width of [320,390,768,1024,1440,1920]) for (const lang of ['vi','en']) {
    await page.setViewportSize({width,height:width<768?844:900});
    await page.evaluate(lang => qa.i18n.changeLanguage(lang), lang); await scrollPose(0);
    const s=await snapshot(); check(s); assert.equal(s.chapter,'hero'); assert.equal(s.backdrop,false); assert.equal(s.meteor,false); assert.equal(s.textOpacity,1); assert.equal(s.flashCount,1);
    result.layouts.push(s); await page.screenshot({path:`${out}/screenshots/hero-${width}-${lang}.png`});
  }
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:width===390?844:900}); await page.evaluate(()=>qa.i18n.changeLanguage('vi'));
    const forward=new Map();
    for (const direction of ['forward','reverse']) for (const p of direction==='forward'?[0,.25,.5,.75,1]:[1,.75,.5,.25,0]) {
      await scrollPose(p,true);const s=await snapshot();check(s);
      assert.ok(Math.abs((s.chapter==='about'?1:s.p)-p)<.001);
      if(p===.5)assert.equal(s.visibility,0);
      if(p===0)assert.equal(s.backdrop,false);
      if(p===1){assert.equal(s.chapter,'about');assert.equal(s.contentVisibility,'visible');assert.equal(s.inert,false);}
      else assert.equal(s.inert,true);
      const deterministic=[...s.camera,...s.center,s.scale,...s.aperture,s.pull,s.visibility,s.textOpacity];
      if(direction==='forward')forward.set(p,deterministic);else { s.reverseError=Math.max(...deterministic.map((v,i)=>Math.abs(v-forward.get(p)[i])));assert.equal(s.reverseError,0); }
      result.poses.push({direction,requested:p,...s}); await page.screenshot({path:`${out}/screenshots/portal-${width}-${direction}-${p}.png`});
    }
    await scrollPose(.25);const stopped=await snapshot();await page.waitForTimeout(900);const after=await snapshot();const drift=Math.max(...after.camera.map((v,i)=>Math.abs(v-stopped.camera[i])));assert.ok(drift<1e-4);assert.ok(Math.abs(after.pull-stopped.pull)<1e-6);result.interactions.push({type:'stop',width,camera:after.camera,p:after.p,drift});
  }
  await page.setViewportSize({width:1440,height:900});await scrollPose(0);
  result.cadence=await page.evaluate(()=>new Promise(resolve=>{
    const digit=document.querySelector('[data-year-digit]'),year=document.querySelector('[data-hero-year]'),start=performance.now(),events=[];
    const observer=new MutationObserver(()=>events.push({ms:performance.now()-start,value:digit.textContent,aria:year.getAttribute('aria-label'),prefix:year.textContent.trim().slice(0,3)}));observer.observe(digit,{childList:true});
    qa.gsap.getById('hero-year-glitch').restart(true);
    setTimeout(()=>{observer.disconnect();resolve(events);},4900);
  }));
  const flashes=result.cadence.filter(e=>e.value==='7'); assert.ok(flashes.length>=3);
  for(let i=1;i<flashes.length;i++)assert.ok(Math.abs(flashes[i].ms-flashes[i-1].ms-1500)<35);
  for(const e of flashes){const end=result.cadence.find(v=>v.ms>e.ms&&v.value==='6');assert.ok(end && end.ms-e.ms>=80 && end.ms-e.ms<=120);}
  assert.ok(result.cadence.every(e=>e.aria==='2026'&&e.prefix==='202'));
  await scrollPose(.001);await page.waitForTimeout(1700);assert.equal(await page.locator('[data-year-digit]').textContent(),'6');
  await scrollPose(0);
  const hidden=await page.evaluate(async()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));
    const f=qa.gsap.getById('hero-year-glitch');const paused=f.paused();await new Promise(r=>setTimeout(r,1700));const digit=document.querySelector('[data-year-digit]').textContent;
    delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));return{simulated:true,paused,digit};
  });assert.equal(hidden.paused,true);assert.equal(hidden.digit,'6');result.interactions.push({type:'visibility',...hidden});
  for(const hash of ['about','work','transmission']){
    await init(`http://127.0.0.1:5173/#${hash}`);const s=await snapshot();check(s);assert.equal(s.current,hash);assert.equal(s.textOpacity,0);assert.equal(s.contentVisibility,'visible');assert.equal(s.manual,false);result.jumps.push({type:'reload',...s});await page.screenshot({path:`${out}/screenshots/jump-${hash}.png`});
  }
  const before=await snapshot();await page.evaluate(()=>qa.useScrollStore.getState().setContactProgress(1));await page.waitForTimeout(200);const after=await snapshot();assert.deepEqual(after.camera,before.camera);assert.equal(after.intensity,before.intensity);result.interactions.push({type:'legacyContactIgnored',camera:after.camera,intensity:after.intensity});
  for(let cycle=1;cycle<=3;cycle++){
    await scrollPose(.25);
    for(const reduced of ['reduce','no-preference']){
      await page.emulateMedia({reducedMotion:reduced});await page.waitForTimeout(500);
      for(const width of [320,390,1440]){await page.setViewportSize({width,height:width<500?844:900});await page.waitForTimeout(350);const s=await snapshot();check(s);assert.equal(s.flashCount,reduced==='reduce'?0:1);result.cycles.push({cycle,...s});}
    }
  }
  await page.setViewportSize({width:1440,height:900});await scrollPose(0);
  const a=await page.locator('[data-portal-char]').first().boundingBox();await page.mouse.move(a.x+a.width*.5,a.y+a.height*.5);await page.waitForTimeout(150);
  assert.equal(await page.locator('[data-cursor-lens]').getAttribute('data-active'),'true');
  const anchor=await page.evaluate(()=>qa.useScrollStore.getState().storyAnchor);await page.mouse.move(a.x+a.width*.6,a.y+a.height*.6);await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>qa.useScrollStore.getState().storyAnchor),anchor);
  await scrollPose(.01);assert.equal(await page.locator('[data-cursor-lens]').getAttribute('data-active'),'false');result.interactions.push({type:'nativeHeroLens',anchorStable:true,hideOnScroll:true});
  await scrollPose(0);await page.locator('nav a[href="#about"]').first().focus();await page.keyboard.press('Enter');await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>document.activeElement.id),'about');result.interactions.push({type:'nativeEnterFocus',id:'about'});
  await scrollPose(0);await page.locator('nav a[href="#work"]').first().click();await page.waitForTimeout(450);let s=await snapshot();assert.equal(s.current,'work');assert.equal(s.hash,'#work');result.jumps.push({type:'nativeNav',...s});
  await page.goBack();await page.waitForTimeout(550);s=await snapshot();assert.equal(s.current,'about');result.jumps.push({type:'nativeBack',...s});
  await page.setViewportSize({width:390,height:844});await scrollPose(0);await page.locator('button[aria-haspopup="dialog"]').click();await page.waitForTimeout(650);await page.locator('dialog a[href="#about"]').click();await page.waitForTimeout(800);s=await snapshot();assert.equal(s.current,'about');assert.equal(s.hash,'#about');assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'about');result.jumps.push({type:'nativeMobileMenu',...s});
  await init('http://127.0.0.1:5173/3d-lab.html?story=1&chapter=portal&p=0.25');let lab=await snapshot();check(lab);assert.equal(lab.manual,true);assert.equal(lab.p,.25);result.lab.push(lab);
  await page.locator('#lab-chapter').selectOption('works');await page.waitForTimeout(350);lab=await snapshot();check(lab);assert.equal(lab.chapter,'works');result.lab.push(lab);
  assert.equal(result.errors.length,0);
  result.finished=new Date().toISOString();fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({layouts:result.layouts.length,poses:result.poses.length,jumps:result.jumps.length,cycles:result.cycles.length,interactions:result.interactions.length,lab:result.lab.length,errors:result.errors,warnings:[...new Set(result.warnings)],cadence:result.cadence}));
} catch(e) {result.failure=e.stack;fs.writeFileSync(`${out}/browser-failure.json`,JSON.stringify(result,null,2));await page.screenshot({path:`${out}/screenshots/failure.png`});throw e;}
finally{await browser.close();}
