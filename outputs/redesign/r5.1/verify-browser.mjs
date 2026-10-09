// Production App/Fiber introspection; the native DOM is the measurement source.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = 'outputs/redesign/r5.1/', phase = process.env.R51_PHASE ?? 'all';
mkdirSync(out + 'screenshots', { recursive: true });
const copy = Object.fromEntries(['vi', 'en'].map(lang => [lang, JSON.parse(readFileSync('src/i18n/locales/' + lang + '.json')).experience]));
const ids = ['hosanaMedia', 'upwork', 'designveloper'];
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const results = [], errors = [], warnings = [], ambient = []; let page, status = 'running';
function watch(p) { p.on('pageerror', error => errors.push(error.message)); p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); }); }
async function init(p, locale = 'vi', hash = 'experience') {
  watch(p); await p.goto('http://127.0.0.1:5173/#' + hash); await p.waitForSelector('[data-meteor-label]'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2800);
  await p.evaluate(async locale => {
    const urls = performance.getEntriesByType('resource').map(item => item.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots } = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const meteor = await import(loaded('/src/3d/utils/storyMeteor.js'));
    const { ambientMeteorVisibility } = await import(loaded('/src/3d/utils/shootingStars.js'));
    const { gsap, ScrollSmoother, ScrollTrigger } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { default: i18n } = await import(loaded('/src/i18n/config.js'));
    window.qa = { roots: _roots, fiber: _roots.get(document.querySelector('canvas')).store, useScrollStore, storyCameraPath, meteor, ambientMeteorVisibility, gsap, ScrollSmoother, ScrollTrigger, i18n };
    await i18n.changeLanguage(locale);
    window.qa.layout = () => {
      const rect = document.querySelector('#experience').getBoundingClientRect(), departure = document.querySelector('[data-story-chapter="departure"]').getBoundingClientRect();
      const layout = meteor.createMeteorLayout(); layout.width = innerWidth; layout.height = innerHeight; layout.range = departure.top - rect.top;
      layout.points[0] = .08; layout.points[1] = .12 * innerHeight;
      [...document.querySelectorAll('[data-meteor-label]')].forEach((label, i) => { const box = label.getBoundingClientRect(), y = box.top - rect.top - 24; layout.points[(i + 1) * 2] = (box.left + box.width * (i === 1 ? .72 : .35)) / innerWidth; layout.points[(i + 1) * 2 + 1] = y; layout.milestones[i] = y; });
      layout.points[8] = .62; layout.points[9] = layout.range + innerHeight * .5; return layout;
    };
    window.qa.ranges = () => {
      const content = document.querySelector('#smooth-content'), base = content.getBoundingClientRect().top;
      const ranges = [...content.querySelectorAll('[data-story-chapter]')].map(element => ({ id: element.dataset.storyChapter, domId: element.id || element.querySelector('section[id]')?.id, top: element.getBoundingClientRect().top - base })).sort((a,b) => a.top-b.top);
      ranges.forEach((range, i) => range.end = ranges[i+1]?.top ?? document.documentElement.scrollHeight-innerHeight); return ranges;
    };
  }, locale); await p.waitForTimeout(200);
}
async function seek(chapter, progress, manual = true, p = page) {
  await p.evaluate(({ chapter, progress, manual }) => {
    const range = qa.ranges().find(range => range.id === chapter);
    if (!range) { if (chapter !== 'finale' || !manual) throw Error('Missing actual DOM chapter: ' + chapter); qa.useScrollStore.getState().setStoryPosition(chapter,progress,undefined,true); return; }
    const y = range.top + (range.end - range.top) * progress;
    const state = qa.useScrollStore.getState(); state.setStoryPosition(chapter, progress, y / Math.max(1, document.documentElement.scrollHeight-innerHeight), manual);
    const smoother = qa.ScrollSmoother.get(); if (smoother) smoother.scrollTop(y); else scrollTo(0, y);
  }, { chapter, progress, manual }); await p.waitForTimeout(150);
}
async function snap(label, p = page) {
  const s = await p.evaluate(() => {
    const f = qa.fiber.getState(), state = qa.useScrollStore.getState(), layout = qa.layout(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const group = f.scene.getObjectByName('story-meteor'), head = f.scene.getObjectByName('story-meteor-head'), trail = f.scene.getObjectByName('story-meteor-trail'), random = f.scene.getObjectByName('shooting-stars'), works = f.scene.getObjectByName('works-constellations');
    const journey = (state.storyChapter === 'departure' ? 1 : 0) + state.chapterProgress;
    const expected = new Float32Array(trail.geometry.attributes.position.array.length); qa.meteor.writeStoryMeteor(layout, journey, expected, {}, {});
    const positions = [...trail.geometry.attributes.position.array], headPosition = [...head.geometry.attributes.position.array], projection = f.camera.position.clone().fromArray(headPosition).project(f.camera);
    let geometryError = 0; positions.forEach((value, i) => geometryError = Math.max(geometryError, Math.abs(value - expected[i])));
    const pose = qa.storyCameraPath(state.storyChapter, state.chapterProgress, {}, reduced, innerWidth/innerHeight), expectedCamera = f.camera.clone(); expectedCamera.position.set(pose.x,pose.y,pose.z); expectedCamera.lookAt(pose.lookX,pose.lookY,pose.lookZ);
    const labels = [...document.querySelectorAll('[data-meteor-label]')].map((element, i) => ({ id: element.closest('[data-experience-item]').dataset.experienceItem, box: element.getBoundingClientRect().toJSON(), opacity: Number(getComputedStyle(element).opacity), active: element.dataset.active, expected: reduced ? 1 : .72 + qa.meteor.meteorEmphasis(layout, i, state.chapterProgress) * .28, text: element.closest('article').textContent }));
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), bh = f.camera.position.clone().set(0,0,-200).project(f.camera);
    const randomAlphas = random ? [...random.geometry.attributes.aAlpha.array] : [];
    const range = qa.ranges().find(item => item.id === state.storyChapter), scroll = qa.ScrollSmoother.get()?.scrollTop() ?? scrollY;
    return { chapter: state.storyChapter, currentSection: state.currentSection, progress: state.chapterProgress, manual: state.storyManual, range, actualScroll: scroll, domProgress: range ? Math.max(0,Math.min(1,(scroll-range.top)/(range.end-range.top))) : null,
      visible: group.visible, meteorExpected: !reduced && qa.meteor.meteorVisibility(state.storyChapter,state.chapterProgress)>0, opacity: head.material.uniforms.uOpacity.value, trailOpacity: trail.material.uniforms.uOpacity.value, headSize: head.material.uniforms.uSize.value, headDpr: head.material.uniforms.uPixelRatio.value, headCount: head.geometry.attributes.position.count, trailCount: trail.geometry.attributes.position.count,
      head: headPosition, positions, geometryError, headPixel: [(projection.x+1)*innerWidth/2,(1-projection.y)*innerHeight/2], trailVersion: trail.geometry.attributes.position.version, headVersion: head.geometry.attributes.position.version,
      fades: [...trail.geometry.attributes.aFade.array], labels, layout: {width:layout.width,height:layout.height,range:layout.range,points:[...layout.points],milestones:[...layout.milestones]},
      worksVisible: works.visible, worksPhase: state.worksOrbit.phase, worksOrigin: state.worksOrbit.origin, worksLatched: state.worksOrbit.latched, worksStrength: works.children.slice(0,3).map(group=>group.children[1].material.uniforms.uStrength.value),
      ambientPresent: Boolean(random), ambientVisible: random?.visible??false, ambientVisibility: random?.material.uniforms.uVisibility.value??0, ambientExpected: qa.ambientMeteorVisibility(state.storyChapter,state.chapterProgress), ambientMaxAlpha: Math.max(0,...randomAlphas),
      canvas: document.querySelectorAll('canvas').length, heads: f.scene.getObjectsByProperty('name','story-meteor-head').length, writers:f.internal.subscribers.filter(item=>item.priority===-1).length, subscribers:f.internal.subscribers.length, memory:{...f.gl.info.memory},
      poseError:Math.max(Math.abs(pose.x-f.camera.position.x),Math.abs(pose.y-f.camera.position.y),Math.abs(pose.z-f.camera.position.z)),qError:expectedCamera.quaternion.angleTo(f.camera.quaternion),observerR:f.camera.position.distanceTo(f.camera.position.clone().set(0,0,-200)),bh:[(bh.x+1)*innerWidth/2,(1-bh.y)*innerHeight/2],
      viewport:[innerWidth,innerHeight],locale:document.documentElement.lang,reduced,hidden:document.hidden,frameloop:f.frameloop,overflow:document.documentElement.scrollWidth-innerWidth,glError:gl.getError(),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),dpr:f.gl.getPixelRatio() };
  });
  const record = { label, ...s }; results.push(record);
  assert.equal(s.canvas,1,label); assert.equal(s.heads,1,label); assert.equal(s.writers,1,label); assert.equal(s.headCount,1,label); assert.equal(s.trailCount,128,label);
  assert.equal(s.overflow,0,label); assert.equal(s.glError,0,label); assert(s.poseError<1e-7,label); assert(s.qError<1e-7,label); assert(s.observerR>1,label); assert(s.positions.every(Number.isFinite),label);
  if(!s.hidden) assert.equal(s.visible,s.meteorExpected,label+' meteor gating');
  if(s.visible&&!s.hidden) { assert(s.geometryError<.001,label+' exact curve '+s.geometryError); assert.deepEqual(s.head,s.positions.slice(0,3),label+' one head on trail'); assert.equal(s.opacity,s.trailOpacity,label+' head/trail opacity'); assert.equal(s.headSize,5,label+' 5px head'); assert.equal(s.headDpr,s.dpr,label+' head DPR'); }
  assert(s.fades.every((value,i,array)=>value>=0&&value<=1&&(i===0||value<=array[i-1])),label+' monotonic trail fade');
  assert.equal(s.labels.length,3,label); for(const item of s.labels) { for(const text of Object.values(copy[s.locale].positions[item.id])) assert(item.text.includes(text),label+' copy '+item.id); assert(item.opacity>=.7199,label+' readable opacity'); }
  if(s.chapter==='experience') for(const item of s.labels) assert(Math.abs(item.opacity-item.expected)<.0001,label+' emphasis');
  if(['experience','departure','portal','finale'].includes(s.chapter)&&!s.hidden) assert.equal(s.ambientVisible,false,label+' ambient yielded');
  if(s.chapter==='departure') assert.equal(s.currentSection,'experience',label+' nav ownership');
  if(!s.manual&&!s.hidden) assert(Math.abs(s.domProgress-s.progress)<.0006,label+' visible DOM progress');
  return record;
}
async function shot(name,p=page) { await p.screenshot({path:out+'screenshots/'+name+'.png'}); }
async function poseSet(name) {
  const forward=new Map();
  for(const chapter of ['experience','departure']) {
    for(const progress of [0,.25,.5,.75,1]) { await seek(chapter,progress); const record=await snap(name+'-'+chapter+'-forward-'+progress); forward.set(chapter+progress,record); await shot(name+'-'+chapter+'-'+progress); }
    for(const progress of [1,.75,.5,.25,0]) { await seek(chapter,progress); const record=await snap(name+'-'+chapter+'-reverse-'+progress),first=forward.get(chapter+progress); if(record.visible){assert.deepEqual(record.positions,first.positions,'reverse exact curve');assert.deepEqual(record.head,first.head,'reverse exact head');}assert.equal(record.poseError,first.poseError); }
    await seek(chapter,.47); const held=await snap(name+'-'+chapter+'-stop-before'); await page.waitForTimeout(400);const after=await snap(name+'-'+chapter+'-stop-after');assert.deepEqual(after.positions,held.positions,'stop geometry');assert.deepEqual(after.head,held.head,'stop head');assert.equal(after.worksPhase,held.worksPhase,'no idle orbit during story');
  }
  const milestones=await page.evaluate(()=>{const layout=qa.layout();return [...layout.milestones].map(y=>{let lo=0,hi=1;for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(qa.meteor.meteorReadingY(layout,mid)<y)lo=mid;else hi=mid;}return(lo+hi)/2;});});
  for(let i=0;i<3;i++) {await seek('experience',milestones[i]);const record=await snap(name+'-milestone-'+ids[i]);record.milestoneHeadErrorPx=record.headPixel[1]-(record.labels[i].box.top-24);if(!record.reduced){assert(Math.abs(record.milestoneHeadErrorPx)<1,'head ~24px above actual label (fractional native scroll rounding): '+record.milestoneHeadErrorPx);assert.equal(record.labels[i].active,'true');assert(record.labels[i].opacity>.999);}await shot(name+'-milestone-'+ids[i]);}
  for(const progress of [.05,.12]){await seek('departure',progress);await snap(name+'-early-departure-'+progress);await shot(name+'-early-departure-'+progress);}
}
async function ambientWait(chapter) {
  await seek(chapter,.5);const expected=await snap('ambient-'+chapter+'-start');assert(expected.ambientVisible);assert.equal(expected.ambientVisibility,1);
  const observation=await page.evaluate(async()=>{
    const start=performance.now(),events=[],frames=[];let alive=false;
    while(performance.now()-start<15500) {await new Promise(requestAnimationFrame);const f=qa.fiber.getState(),root=f.scene.getObjectByName('shooting-stars');const alpha=root.geometry.attributes.aAlpha.array;let slots=0;for(let i=0;i<3;i++)if(alpha[i*24]>0)slots++;if(slots>0&&!alive)events.push({ms:performance.now()-start,slots});alive=slots>0;if(events.length)events.at(-1).maxSlots=Math.max(events.at(-1).maxSlots??0,slots);frames.push({ms:performance.now()-start,visible:root.visible,maxAlpha:Math.max(...alpha)});if(events.length>=2&&!alive)break;}
    return {events,frames,elapsed:performance.now()-start};
  });
  assert(observation.events.length>=2,'two actual ambient bursts');const interval=observation.events[1].ms-observation.events[0].ms;assert(interval>=3900&&interval<=7100,'actual ambient interval4–7s: '+interval);assert(observation.events.every(item=>item.maxSlots>=2&&item.maxSlots<=3),'actual burst2–3meteors');ambient.push({chapter,...observation,intervalMs:interval});
}
try {
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});page=await context.newPage();await context.tracing.start({screenshots:true,snapshots:true});await init(page);await poseSet('1440-vi-normal');
  if(phase!=='quick') for(const width of [390,1440])for(const locale of ['vi','en'])for(const reducedMotion of ['no-preference','reduce']) {if(width===1440&&locale==='vi'&&reducedMotion==='no-preference')continue;await page.setViewportSize({width,height:width===390?844:900});await page.emulateMedia({reducedMotion});await page.evaluate(locale=>qa.i18n.changeLanguage(locale),locale);await page.waitForTimeout(250);await poseSet(width+'-'+locale+'-'+reducedMotion);}
  await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>qa.i18n.changeLanguage('vi'));await page.waitForTimeout(250);
  await seek('experience',.1,false);for(let i=0;i<5;i++){await page.mouse.wheel(0,80);await page.waitForTimeout(180);await snap('native-slow-'+i);}await page.mouse.wheel(0,2200);await page.waitForTimeout(1500);await snap('native-fast-forward');await page.mouse.wheel(0,-1300);await page.waitForTimeout(1500);await snap('native-fast-reverse');
  await seek('departure',.45);const preHidden=await snap('hidden-before');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(150);const hidden=await snap('hidden');await page.waitForTimeout(400);const held=await snap('hidden-held');assert.equal(hidden.frameloop,'never');assert.equal(held.trailVersion,hidden.trailVersion);assert.deepEqual(held.positions,hidden.positions);assert.equal(held.worksPhase,preHidden.worksPhase);await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(150);assert.deepEqual((await snap('hidden-resume')).positions,preHidden.positions);
  for(let cycle=0;cycle<3;cycle++) {await seek('experience',.57,false);await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(180);const reduced=await snap('lifecycle-reduced-'+cycle);assert.equal(reduced.visible,false);assert(reduced.labels.every(item=>item.opacity===1));await page.setViewportSize({width:390,height:844});await page.evaluate(()=>qa.i18n.changeLanguage('en'));await page.waitForTimeout(220);await snap('lifecycle-mobile-'+cycle);await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>qa.i18n.changeLanguage('vi'));await page.waitForTimeout(220);await snap('lifecycle-desktop-'+cycle);}
  for(const chapter of ['about','skills','education']) {await seek(chapter,.5);const record=await snap('ambient-quiet-'+chapter);assert(record.ambientVisible);assert.equal(record.ambientVisibility,1);}
  if(phase!=='quick')await ambientWait('skills');
  for(const chapter of ['portal','experience','departure','finale']){await seek(chapter,.5);await page.waitForTimeout(250);const record=await snap('ambient-off-'+chapter);assert.equal(record.ambientVisible,false);}
  await seek('about',.5,false);await page.locator('nav a[href="#work"]').first().focus();await page.keyboard.press('Enter');await page.waitForTimeout(250);const nav=await snap('nav-work-direct');assert.equal(nav.chapter,'works');assert.equal(nav.visible,false);assert.equal(nav.worksVisible,true);assert.equal(await page.evaluate(()=>location.hash),'#work');
  await context.tracing.stop({path:out+'browser-trace.zip'});await context.close();
  const fresh=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});page=await fresh.newPage();await init(page,'en','work');const deep=await snap('reload-work-direct');assert.equal(deep.chapter,'works');assert.equal(deep.visible,false);assert.equal(deep.worksVisible,true);assert.equal(deep.worksOrigin,0);await shot('390-en-direct-work');await fresh.close();
  assert.deepEqual(errors,[]);status='pass';console.log('PASS R5.1 Browser',results.length,'snapshots',ambient.length,'ambient observations');
}catch(error){status='fail';console.error(error);throw error;}
finally{writeFileSync(out+'browser-results.json',JSON.stringify({status,results,ambient,errors,warnings:[...new Set(warnings)]},null,2));await browser.close();}
