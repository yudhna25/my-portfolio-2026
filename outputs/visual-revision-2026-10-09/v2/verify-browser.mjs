import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href);
const out = 'outputs/visual-revision-2026-10-09/v2';
const base = process.argv.find(arg=>arg.startsWith('http')) || 'http://127.0.0.1:5183';
const profileOnly=process.argv.includes('--profile-only');
const report = { started: new Date().toISOString(), base, configurations: [], errors: [], warnings: [] };
const source=()=>Object.fromEntries(['src/3d/components/BlackHole.jsx','src/3d/components/BlackHoleSystem.jsx','src/3d/components/BlackHoleBloomMask.jsx','src/3d/shaders/blackHole.js','src/3d/quality.js','src/components/Hero.jsx','src/components/effects/PortalHeading.jsx','src/styles/hero.css'].filter(p=>fs.existsSync(p)).map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
report.sourceBefore=source();
report.hotReload='Vite WebSocket blocked per test page to prevent concurrent V1 edits navigating a captured page.';
fs.mkdirSync(`${out}/screenshots`, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
report.browser = browser.version();
const save = () => fs.writeFileSync(`${out}/${profileOnly?'performance-results':'browser-results'}.json`, JSON.stringify(report, null, 2));
let page, context, current;
async function ready() {
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(async () => {
    const url = performance.getEntriesByType('resource').map(e => e.name).find(u => u.includes('/@react-three_fiber.js'));
    if (!url) return false;
    const { _roots } = await import(url);
    return !!_roots.get(document.querySelector('canvas'))?.store.getState().scene.getObjectByName('accretion-disk');
  });
  await page.evaluate(async () => {
    const url = name => performance.getEntriesByType('resource').map(e => e.name).filter(u => u.includes(name)).at(-1);
    const fiber = await import(url('/@react-three_fiber.js'));
    const scroll = await import(url('/src/stores/useScrollStore.js'));
    const { ScrollSmoother } = await import(url('/src/hooks/useGSAPSetup.js'));
    const root = fiber._roots.get(document.querySelector('canvas')).store;
    const renderer = root.getState().gl, gl = renderer.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const qa = window.qa = { ...fiber, scroll: scroll.useScrollStore, root, ScrollSmoother, frames: 0, rays: 0, perFrame: [],
      cpu: [], gpu: [], gaps: [], measure: false, ray: null, target: null, targets: new Map(), disposal: [], query: null, timing: false, timer: !!ext,
      timerScope:'frame', pending:[], rayDisposed:0, rayGeometryDisposed:0, watchedRay:new WeakSet() };
    const render = renderer.render.bind(renderer), setTarget = renderer.setRenderTarget.bind(renderer);
    renderer.setRenderTarget = target => {
      if (target && !qa.targets.has(target)) {
        qa.targets.set(target, target.texture.uuid);
        target.addEventListener('dispose', () => qa.disposal.push({ id: target.texture.uuid, width: target.width, height: target.height }));
      }
      return setTarget(target);
    };
    renderer.render = (scene, camera) => {
      const ray = scene.children[0]?.material;
      const isRay=!!ray?.uniforms?.uObserver;
      if (isRay) {
        qa.rays++; qa.ray = ray; qa.target = renderer.getRenderTarget();
        if(!qa.watchedRay.has(ray)) { qa.watchedRay.add(ray); ray.addEventListener('dispose',()=>qa.rayDisposed++); scene.children[0].geometry.addEventListener('dispose',()=>qa.rayGeometryDisposed++); }
      }
      const timeRay=isRay && qa.measure && ext && !qa.query && qa.timerScope==='ray';
      if(timeRay) {qa.query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,qa.query);}
      const result=render(scene,camera);
      if(timeRay) {gl.endQuery(ext.TIME_ELAPSED_EXT);qa.pending.push({query:qa.query,scope:'ray'});qa.query=null;}
      return result;
    };
    qa.before = fiber.addEffect(() => {
      qa.start = performance.now();
      while (qa.pending.length && gl.getQueryParameter(qa.pending[0].query, gl.QUERY_RESULT_AVAILABLE)) {
        const pending=qa.pending.shift();
        if (qa.measure && pending.scope===qa.timerScope && !gl.getParameter(ext.GPU_DISJOINT_EXT)) qa.gpu.push(gl.getQueryParameter(pending.query, gl.QUERY_RESULT) / 1e6);
        gl.deleteQuery(pending.query);
      }
      if (qa.measure && ext && !qa.query && qa.timerScope==='frame') { qa.query = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, qa.query); qa.timing = true; }
    });
    qa.after = fiber.addAfterEffect(() => {
      const now = performance.now();
      qa.frames++; qa.perFrame.push(qa.rays); qa.rays = 0;
      if (qa.timing) { gl.endQuery(ext.TIME_ELAPSED_EXT);qa.pending.push({query:qa.query,scope:'frame'});qa.query=null; qa.timing = false; }
      if (qa.measure) { qa.cpu.push(now - qa.start); if (qa.previous) qa.gaps.push(now - qa.previous); }
      qa.previous = now;
    });
  });
  await page.waitForTimeout(300);
}
async function seek(chapter, p) {
  await page.evaluate(({ chapter, p }) => {
    const content = document.querySelector('#smooth-content'), top = content.getBoundingClientRect().top;
    const nodes = [...content.querySelectorAll('[data-story-chapter]')];
    const i = nodes.findIndex(n => n.dataset.storyChapter === (chapter === 'hero' ? 'portal' : chapter));
    const start = nodes[i].getBoundingClientRect().top - top;
    const end = nodes[i+1]?.getBoundingClientRect().top - top || document.documentElement.scrollHeight - innerHeight;
    const y = start + (end - start) * p;
    qa.scroll.getState().setStoryPosition(chapter, p, y / Math.max(1, document.documentElement.scrollHeight - innerHeight), true);
    const smoother = qa.ScrollSmoother.get();
    if (smoother) { smoother.scrollTop(y); const t = smoother.scrollTrigger; t.update(); const tween=t.getTween(); if(typeof tween?.progress==='function') tween.progress(1).pause(); t.animation.progress(t.progress); }
    else scrollTo(0, y);
  }, { chapter, p });
  await page.waitForTimeout(250);
}
async function snapshot(pixels = false) {
  return page.evaluate(async pixels => {
    const f = qa.root.getState(), renderer = f.gl, gl = renderer.getContext(), u = qa.ray.uniforms;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const copy = f.scene.getObjectByName('accretion-disk').material.uniforms;
    const values = Object.fromEntries(Object.entries(u).map(([key, uniform]) => [key, typeof uniform.value === 'number' ? uniform.value : uniform.value.toArray()]));
    const uniformsFinite = Object.values(values).flat().every(Number.isFinite);
    const shared = Object.keys(copy).filter(key => key !== 'uImage').every(key => copy[key] === u[key]);
    const result = { chapter: qa.scroll.getState().storyChapter, p: qa.scroll.getState().chapterProgress,
      canvas: document.querySelectorAll('canvas').length, tier: document.querySelector('[data-galaxy-scene]').dataset.quality,
      viewport: [innerWidth, innerHeight], deviceDpr: devicePixelRatio, rendererDpr: renderer.getPixelRatio(),
      drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], target: [qa.target.width, qa.target.height],
      targetMiB: qa.target.width * qa.target.height * 8 / 1048576, memory: { ...renderer.info.memory },
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      uniforms: values, uniformsFinite, shared, rayPerFrame: [Math.min(...qa.perFrame.slice(-50)), Math.max(...qa.perFrame.slice(-50))],
      anchor: qa.scroll.getState().storyAnchor, camera: f.camera.position.toArray(), glError: gl.getError(),
      disposeEvents: qa.disposal.length, rayId: qa.target.texture.uuid,
      compiledMask: renderer.info.programs.map(p => gl.getShaderSource(p.fragmentShader)).find(s => s.includes('Restore only rays absorbed'))?.includes('return texture2D(image, uv)') ?? false,
    };
    if (pixels) {
      const data = new Uint16Array(qa.target.width * qa.target.height * 4);
      renderer.readRenderTargetPixels(qa.target, 0, 0, qa.target.width, qa.target.height, data);
      let nonfinite = 0, nonmono = 0, captured = 0, lit = 0, max = 0;
      for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 4; c++) if ((data[i+c] & 0x7c00) === 0x7c00) nonfinite++;
        if (data[i] !== data[i+1] || data[i] !== data[i+2]) nonmono++;
        if (data[i+3] >= 0x3c00 && data[i] === 0) captured++;
        if (data[i] > 0) lit++;
        max = Math.max(max, data[i]);
      }
      result.pixels = { count: data.length / 4, nonfinite, nonmono, captured, lit, maxHalfBits: max, glError: gl.getError() };
      result.pixels.coreLeak = await new Promise(resolve => {
        const stop=qa.addAfterEffect(() => {
          stop(); const canvas=document.createElement('canvas'); canvas.width=qa.target.width; canvas.height=qa.target.height;
          const ctx=canvas.getContext('2d'); ctx.drawImage(document.querySelector('canvas'),0,0);
          const final=ctx.getImageData(0,0,canvas.width,canvas.height).data;
          let leak=0, checked=0;
          for(let y=0;y<canvas.height;y++) for(let x=0;x<canvas.width;x++) {
            const i=(y*canvas.width+x)*4, j=((canvas.height-1-y)*canvas.width+x)*4;
            if(data[i+3]>=0x3c00 && data[i]===0) { checked++; if(Math.max(final[j],final[j+1],final[j+2])>1) leak++; }
          }
          resolve({checked,leak});
        });
      });
    }
    return result;
  }, pixels);
}
function check(s) {
  assert.equal(s.canvas, 1); assert.equal(s.uniformsFinite, true); assert.equal(s.shared, true);
  assert.deepEqual(s.target, s.drawingBuffer); assert.equal(s.glError, 0);
  assert.deepEqual(s.rayPerFrame, [1, 1]);
  assert(Math.hypot(...s.uniforms.uObserver) >= 1.099999);
  if (s.pixels) { assert.equal(s.pixels.nonfinite, 0); assert.equal(s.pixels.nonmono, 0); assert.equal(s.pixels.glError, 0); assert.equal(s.pixels.coreLeak.leak,0); }
}
async function capture(label, pixels = true) {
  const s = await snapshot(pixels); check(s); current.frames.push({ label, ...s });
  await page.screenshot({ path: `${out}/screenshots/${current.id}-${label}.png` });
  const data = await page.evaluate(() => new Promise(resolve => {
    const stop = qa.addAfterEffect(() => { stop(); resolve(document.querySelector('canvas').toDataURL()); });
  }));
  fs.writeFileSync(`${out}/screenshots/${current.id}-${label}-canvas.png`, Buffer.from(data.split(',')[1], 'base64'));
  save(); return s;
}
async function benchmark(label,scope='frame') {
  const result = await page.evaluate(async ({scope,duration}) => {
    qa.timerScope=scope;
    qa.cpu = []; qa.gpu = []; qa.gaps = []; qa.measure = true;
    const start = performance.now(), before = qa.frames;
    await new Promise(resolve => setTimeout(resolve, duration));
    const ms = performance.now() - start; qa.measure = false;
    const stats = array => { const a = [...array].sort((a,b) => a-b); return { samples: a.length, mean: a.reduce((s,v) => s+v,0) / a.length || null, p95: a[Math.floor(a.length * .95)] ?? null, max: a.at(-1) ?? null }; };
    return { ms, frames: qa.frames - before, fps: (qa.frames - before) * 1000 / ms, cpuSubmissionMs: stats(qa.cpu), gpuMs: stats(qa.gpu), frameIntervalMs: stats(qa.gaps), gpuTimer: qa.timer };
  },{scope,duration:profileOnly?6000:2200});
  current.performance.push({ label, ...result }); save();
}
try {
  for (const [width, height, dpr] of [[390,844,3],[900,900,2],[1440,900,1],[1920,1080,2]]) {
    current = { id: `${width}-dpr${dpr}`, frames: [], performance: [] }; report.configurations.push(current);
    context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr, serviceWorkers: 'block', hasTouch: width === 390 });
    page = await context.newPage(); await page.routeWebSocket('**',ws=>ws.send('{"type":"connected"}')); page.setDefaultTimeout(60000);
    current.source=source();
    page.on('pageerror', e => { report.errors.push(e.message); save(); });
    page.on('console', m => { if (m.type() === 'error') { report.errors.push(m.text()); save(); } if (m.type() === 'warning') report.warnings.push(m.text()); });
    await page.goto(base); await ready(); await seek('hero',0);
    if(profileOnly) {
      const s=await snapshot();check(s);current.frames.push({label:'configuration',...s});
      await benchmark('O-size full target');await seek('portal',width===390?.30:.28);
      await benchmark('close-up full target');await benchmark('close-up ray only','ray');
      await context.close();console.log(`PROFILE ${current.id}`);save();continue;
    }
    await capture('o-size'); await benchmark('O-size full target');
    // Output-only preview of the V1 contract: hide the existing glyph, keeping its rect.
    const style = await page.addStyleTag({ content: '[data-story-anchor="portal"]{color:transparent!important}' });
    await capture('o-slot-preview'); await style.evaluate(node => node.remove());
    await seek('portal', width === 390 ? .30 : .28); const close = await capture('close-up'); await benchmark('close-up full target'); await benchmark('close-up ray only','ray');
    await seek('portal',.4); await capture('dark-core',false);
    await seek('portal',width === 390 ? .30 : .28); const reverse = await snapshot(); check(reverse);
    assert.deepEqual(reverse.uniforms, close.uniforms);
    await seek('portal',.66); await capture('physical-observer-close');
    await seek('about',0); await capture('about',false);
    await seek('finale',.8); await capture('finale-api',false);
    await seek('contact',0); await capture('contact-api',false);
    if (width === 1440) {
      await seek('hero',0);
      // Isolated finite-input stress: temporarily replace the sole camera callback,
      // never mount another writer or modify CameraRig source.
      await page.evaluate(() => {
        const sub=qa.root.getState().internal.subscribers.find(s=>s.priority===-1);
        qa.cameraSub=sub;qa.cameraCallback=sub.ref.current;
      });
      for(const [label,position] of [['center',[0,0,0]],['inside',[0,0,.5]],['safe',[0,0,1.1]],['near',[1,1,8]]]) {
        await page.evaluate(position => {
          qa.cameraSub.ref.current=() => { const camera=qa.root.getState().camera;camera.position.set(position[0],position[1],position[2]-200);camera.lookAt(0,0,-200); };
        },position);
        await page.waitForTimeout(150);await capture(`observer-${label}`);
      }
      await page.evaluate(()=>{qa.cameraSub.ref.current=qa.cameraCallback;});await page.waitForTimeout(200);
      const before = await snapshot();
      await page.setViewportSize({width:1024,height:768}); await page.waitForTimeout(800); await seek('hero',0); await capture('resized');
      await page.setViewportSize({width:1440,height:900}); await page.waitForTimeout(800); await seek('hero',0);
      const restored = await capture('resize-restored'); assert.equal(restored.rayId,before.rayId); assert(restored.disposeEvents > before.disposeEvents);
      await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForTimeout(800); await capture('reduced');
      await page.emulateMedia({reducedMotion:'no-preference'}); await page.waitForTimeout(800);
      const disposal = await page.evaluate(async () => {
        const targets = [...qa.targets.values()];
        const { navigateRoute, EDURA_ROUTE } = await import('/src/stores/useRouteStore.js');
        navigateRoute(null, EDURA_ROUTE);
        await new Promise(resolve => setTimeout(resolve,600));
        return { targets, disposal:qa.disposal, rayDisposed:qa.rayDisposed, rayGeometryDisposed:qa.rayGeometryDisposed, canvases:document.querySelectorAll('canvas').length, memory:qa.root.getState().gl.info.memory };
      });
      current.disposal = disposal; assert.equal(disposal.canvases,0); assert(disposal.disposal.some(d=>d.id===before.rayId)); assert(disposal.rayDisposed>0);assert(disposal.rayGeometryDisposed>0);
    }
    await context.close(); console.log(`PASS ${current.id}`); save();
  }
  if(!profileOnly) {
  // The existing context-lost fallback must retain DOM content and remove Canvas.
  context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  page = await context.newPage(); await page.routeWebSocket('**',ws=>ws.send('{"type":"connected"}')); await page.goto(base); await ready(); await seek('about',0);
  await page.evaluate(() => qa.root.getState().gl.forceContextLoss()); await page.waitForTimeout(800);
  report.fallback = await page.evaluate(() => ({canvas:document.querySelectorAll('canvas').length, fallback:!!document.querySelector('[data-scene-fallback]'), about:!!document.querySelector('#about')}));
  await page.screenshot({path:`${out}/screenshots/fallback.png`}); assert.equal(report.fallback.canvas,0); assert.equal(report.fallback.about,true);
  }
  assert.deepEqual(report.errors,[]); report.status='PASS';
} catch (error) { report.status='FAIL'; report.failure=error.stack; throw error; }
finally { report.finished=new Date().toISOString(); report.sourceAfter=source();save(); await browser.close(); }
