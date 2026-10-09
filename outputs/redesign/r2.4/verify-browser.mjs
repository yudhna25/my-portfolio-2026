import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
mkdirSync(new URL('screenshots/', out), { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await context.tracing.start({ screenshots: true, snapshots: true });
let page;
const results = { poses: [], stops: [], reverse: [], benchmarks: [], lifecycle: [], errors: [], warnings: [] };
async function init(query = 'story=1') {
  page = await context.newPage();
  page.on('pageerror', e => results.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') results.errors.push(m.text()); if (m.type() === 'warning') results.warnings.push(m.text()); });
  await page.goto(`http://localhost:5173/3d-lab.html?${query}`);
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(e => e.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const fiber = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { finaleState } = await import(loaded('/src/3d/utils/finale.js'));
    window.r24 = { ...fiber, useScrollStore, storyCameraPath, finaleState, store: fiber._roots.get(document.querySelector('[data-galaxy-scene] canvas')).store };
  });
  await instrument();
}
async function seek(p, chapter = 'finale') {
  p = Math.round(p * 1000) / 1000;
  await page.selectOption('#lab-chapter', chapter);
  if ([0,.25,.5,.75,1].includes(p)) await page.locator(`[data-pose="${p}"]`).click();
  else await page.locator('#lab-scrub').evaluate((el, p) => {
    // Telemetry updates this uncontrolled range; ensure React observes a change.
    el.value = p === 0 ? 0.001 : 0;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, p);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, p);
  await page.waitForFunction(p => window.r24.useScrollStore.getState().chapterProgress === p,p);
  await page.waitForTimeout(80);
}
async function snapshot() {
  return page.evaluate(() => {
    const { store, useScrollStore, storyCameraPath, finaleState } = window.r24, f = store.getState(), s = useScrollStore.getState();
    const mesh = f.scene.getObjectByName('accretion-disk'), u = mesh.material.uniforms;
    const root = f.scene.getObjectByName('works-constellations'), trail = f.scene.getObjectByName('finale-trails');
    const expected = storyCameraPath(s.storyChapter, s.chapterProgress, {}, matchMedia('(prefers-reduced-motion: reduce)').matches, innerWidth / innerHeight);
    const phase = finaleState(matchMedia('(prefers-reduced-motion: reduce)').matches || s.storyChapter === 'contact' ? 1 : s.chapterProgress);
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const program = f.gl.properties.get(mesh.material).currentProgram;
    const shader = program ? gl.getShaderSource(program.fragmentShader) : '';
    let trailSum = 0;
    for (let i = 0; i < trail.geometry.attributes.position.array.length; i++) trailSum += trail.geometry.attributes.position.array[i] * (1 + i % 7);
    return { chapter: s.storyChapter, p: s.chapterProgress, phase, origin: s.worksOrbit.origin, captures: s.worksOrbit.captures,
      orbitPhase: s.worksOrbit.phase, latched: s.worksOrbit.latched, visible: root.visible, trailVisible: trail.visible, trailSum,
      groups: root.children.filter(g => g.name.startsWith('works-')).map(g => ({ name: g.name, position: g.position.toArray(), world: g.getWorldPosition(f.camera.position.clone()).toArray(), scale: g.scale.toArray() })),
      camera: f.camera.position.toArray(), cameraError: Math.max(Math.abs(f.camera.position.x - expected.x), Math.abs(f.camera.position.y - expected.y), Math.abs(f.camera.position.z - expected.z)),
      hole: u.uFinaleHole.value, gas: u.uFinaleGas.value.toArray(), enabled: u.uFinaleEnabled.value, rayCenter: u.uRayCenter.value.toArray(), visibility: u.uPortalVisibility.value,
      label: { hidden: document.querySelector('[data-works-controls]').hidden, inert: document.querySelector('[data-works-controls]').inert, opacity: Number(getComputedStyle(document.querySelector('[data-works-controls]')).opacity) },
      dpr: f.gl.getPixelRatio(), tier: document.querySelector('[data-galaxy-scene]').dataset.quality, glError: gl.getError(), memory: { ...f.gl.info.memory },
      copyOctaves: mesh.material.defines.FINALE_OCTAVES, compiledOctaves: Number(shader?.match(/#define FINALE_OCTAVES (\d)/)?.[1]), trailVertices: trail.geometry.attributes.position.count,
      canvas: document.querySelectorAll('[data-galaxy-scene] canvas').length, cameraWriters: f.internal.subscribers.filter(sub => sub.priority === -1).length,
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), viewport: [innerWidth, innerHeight] };
  });
}
async function instrument() {
  await page.evaluate(() => {
    const { store, addEffect, addAfterEffect } = window.r24, f = store.getState(), renderer = f.gl, gl = renderer.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const d = { frames: 0, rayCalls: 0, frameCalls: [], cpu: [], gpu: [], draws: [], triangles: [], lines: [], targets: new Set(), disposed: [], geometries: new Set(), materials: new Set(), disposal: [], watched: new WeakSet(), measure: false, query: null, timing: false, ext: Boolean(ext), hiddenFrames: 0 };
    const render = renderer.render.bind(renderer), setTarget = renderer.setRenderTarget.bind(renderer);
    renderer.setRenderTarget = target => {
      if (target && !d.watched.has(target)) {
        d.watched.add(target); d.targets.add(target);
        target.addEventListener('dispose', () => { d.targets.delete(target); d.disposed.push(target.texture.uuid); });
      }
      return setTarget(target);
    };
    const watch = (object, collection) => {
      if (!object || d.watched.has(object)) return;
      d.watched.add(object); collection.add(object.uuid);
      object.addEventListener('dispose', () => d.disposal.push(object.uuid));
    };
    renderer.render = (scene, camera) => {
      const ray = Boolean(scene.children[0]?.material?.uniforms?.uObserver);
      if (ray) { d.rayCalls++; d.rayUniforms = scene.children[0].material.uniforms; d.rayTarget = renderer.getRenderTarget(); }
      scene.traverse(o => { watch(o.geometry, d.geometries); if (Array.isArray(o.material)) o.material.forEach(m => watch(m, d.materials)); else watch(o.material, d.materials); });
      return render(scene, camera);
    };
    renderer.info.autoReset = false;
    d.before = addEffect(() => {
      renderer.info.reset(); d.start = performance.now();
      if (d.query && gl.getQueryParameter(d.query, gl.QUERY_RESULT_AVAILABLE)) {
        if (d.measure && !gl.getParameter(ext.GPU_DISJOINT_EXT)) d.gpu.push(gl.getQueryParameter(d.query, gl.QUERY_RESULT) / 1e6);
        gl.deleteQuery(d.query); d.query = null;
      }
      if (d.measure && ext && !d.query) { d.query = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, d.query); d.timing = true; }
    });
    d.after = addAfterEffect(() => {
      d.frames++; d.frameCalls.push(d.rayCalls); d.rayCalls = 0;
      if (d.timing) { gl.endQuery(ext.TIME_ELAPSED_EXT); d.timing = false; }
      if (d.measure) { d.cpu.push(performance.now() - d.start); d.draws.push(renderer.info.render.calls); d.triangles.push(renderer.info.render.triangles); d.lines.push(renderer.info.render.lines); }
      if (document.hidden) d.hiddenFrames++;
    });
    window.r24.instrument = d;
  });
}
function check(s, label) {
  assert.equal(s.canvas, 1, label); assert.equal(s.cameraWriters, 1, label); assert.equal(s.glError, 0, label); assert(s.cameraError < 1e-9, label);
  assert.equal(s.visibility, 1, label); assert.equal(s.enabled, 1, label); assert.equal(s.hole, s.phase.hole, label);
  assert.deepEqual(s.gas, [s.phase.cloud, s.phase.collapse, s.phase.flare, s.phase.progress], label);
  const octaves = s.tier === 'low' ? 2 : s.tier === 'medium' ? 3 : 4;
  assert.equal(s.copyOctaves,octaves,label); assert.equal(s.compiledOctaves,octaves,label);
  assert.equal(s.trailVertices,44*2*(s.tier==='low'?12:s.tier==='medium'?18:24),label);
  if (s.p >= .44 && s.p < .55 && s.visible) s.groups.forEach(g => assert(Math.hypot(g.world[0], g.world[1], g.world[2] + 200) < 1e-10, label));
  if (s.chapter === 'finale' && s.p >= .12) assert(s.label.hidden && s.label.inert, label);
  if (s.chapter === 'finale' && s.p < .12) { assert(!s.label.hidden && s.label.inert,label); assert(Math.abs(s.label.opacity-s.phase.label)<1e-5,label); }
}
async function capture(label) {
  const style = await page.addStyleTag({ content: '[data-lab-hud],[data-lab-controls],[data-portal-stage],[data-works-controls],#smooth-wrapper,a[href="/"]{visibility:hidden!important}' });
  await page.screenshot({ path: new URL(`screenshots/${label}.png`, out).pathname.replace(/^\//, '') });
  await style.evaluate(el => el.remove());
}
async function pixels() {
  return page.evaluate(() => new Promise(resolve => {
    const stop = window.r24.addAfterEffect(() => {
      stop();
      resolve(document.querySelector('[data-galaxy-scene] canvas').toDataURL());
    });
  }));
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function pose(p, label, image = false) {
  await seek(p); const s = await snapshot(); assert.equal(s.p,p,label); check(s, label); results.poses.push({ label, ...s }); if (image) await capture(label); return s;
}
async function benchmark(p, label) {
  await seek(p); await page.waitForTimeout(450);
  const measured = await page.evaluate(async () => {
    const d = window.r24.instrument; d.cpu = []; d.gpu = []; d.draws = []; d.triangles = []; d.lines = []; d.measure = true;
    const before = d.frames, start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 1800));
    const elapsed = performance.now() - start; d.measure = false;
    const stats = values => { const a = [...values].sort((a,b) => a-b); return { samples: a.length, mean: a.length ? a.reduce((sum,v) => sum+v,0)/a.length : null, p95: a[Math.floor(a.length*.95)] ?? null, max: a.at(-1) ?? null }; };
    return { fps: (d.frames-before)*1000/elapsed, frames: d.frames-before, elapsed, cpuMs: stats(d.cpu), gpuFullFrameMs: stats(d.gpu), drawCalls: stats(d.draws), triangles: stats(d.triangles), lines: stats(d.lines), gpuTimer: d.ext,
      rayPerFrame: [Math.min(...d.frameCalls.slice(-100)),Math.max(...d.frameCalls.slice(-100))], targets: d.targets.size, rayDimensions: [d.rayTarget.width,d.rayTarget.height] };
  });
  results.benchmarks.push({ label, p, ...measured, configuration: await snapshot() });
  console.log(label, measured.fps.toFixed(1), 'FPS', JSON.stringify(measured.gpuFullFrameMs));
}
try {
  await init();
  // Capture a real idle origin, then keep that origin through both directions.
  await seek(0, 'works'); await page.waitForTimeout(550); await pose(0, 'desktop-start', true);
  await pose(.001,'latch-origin'); const origin = (await snapshot()).origin;
  const stops = [0,.06,.12,.25,.34,.40,.44,.50,.58,.70,.75,.85,.96,1];
  for (const p of stops) await pose(p, `desktop-${String(p).replace('.','-')}`, [0,.25,.40,.44,.58,.75,1].includes(p));
  for (const p of [0.39,0.46,0.415,0.51,0.435,0.45,0.40,0.43]) { const s = await pose(p, `reverse-${p}`); assert.equal(s.origin,origin); results.reverse.push(s); }
  for (const p of [0.25,0.40,0.50,0.75,1]) {
    await seek(p); const before = await snapshot(), a = hash(await pixels()); await page.waitForTimeout(600); const b = hash(await pixels()), after = await snapshot();
    assert.equal(a,b,`held pixels ${p}`); assert.deepEqual(after.camera,before.camera); assert.equal(after.trailSum,before.trailSum); assert.equal(after.origin,origin);
    await seek(Math.min(1,p+.03)); await seek(p); assert.equal(hash(await pixels()),a,`reverse pixels ${p}`);
    results.stops.push({ p, hash:a, trailSum:before.trailSum, origin });
  }
  console.log('poses + pixel holds/reversals pass');
  for (const p of [.40,.58,.75,1]) await benchmark(p,`high-${p}`);
  await page.setViewportSize({width:900,height:1000}); for (const p of [.40,.58,.75]) await benchmark(p,`medium-${p}`); await capture('tablet-nebula');
  await page.setViewportSize({width:390,height:844}); for (const p of [0,.25,.44,.58,.75,1]) await pose(p,`mobile-${String(p).replace('.','-')}`,true);
  for (const p of [.40,.58,.75,1]) await benchmark(p,`low-${p}`);
  // Three remounts reuse the story canvas but must dispose replaced materials/pools.
  for (let i=0;i<3;i++) {
    await page.locator('[data-lab-controls] details').evaluate(el=>el.open=true);
    const before = await page.evaluate(()=>window.r24.instrument.disposal.length);
    await page.click('#lab-mode'); await page.waitForTimeout(200); await page.click('#lab-mode'); await page.waitForTimeout(350); await seek(.58);
    const s=await snapshot(); check(s,`lifecycle${i}`);
    results.lifecycle.push({ i, before, after:await page.evaluate(()=>window.r24.instrument.disposal.length), memory:s.memory, canvas:s.canvas });
    assert(results.lifecycle.at(-1).after > before);
  }
  await page.emulateMedia({reducedMotion:'reduce'}); await pose(.4,'mobile-reduced',true); const reduced=await snapshot(); assert.equal(reduced.hole,1); assert.equal(reduced.visible,false);
  await page.emulateMedia({reducedMotion:'no-preference'});
  const hidden = await page.evaluate(async()=>{
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r=>setTimeout(r,150)); const d=window.r24.instrument, start=d.frames;
    await new Promise(r=>setTimeout(r,500)); const count=d.frames-start;
    delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); return count;
  }); assert.equal(hidden,0); results.hiddenFrames=hidden;
  await page.close(); await init('story=1&chapter=contact&p=0'); const direct=await snapshot(); check(direct,'direct contact'); assert.equal(direct.origin,0); assert.equal(direct.hole,1); results.directContact=direct; await capture('direct-contact');
  assert.equal(results.errors.length,0,results.errors.join('\n'));
  console.log('R2.4 browser PASS',results.poses.length,'poses');
} finally {
  writeFileSync(new URL('browser-results.json',out),JSON.stringify(results,null,2)+'\n');
  await context.tracing.stop({path:new URL('trace.zip',out).pathname.replace(/^\//,'')});
  await browser.close();
}
