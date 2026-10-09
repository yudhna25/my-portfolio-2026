import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
mkdirSync(new URL('screenshots/', out), { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const errors = [], warnings = [], results = [], streams = [], benchmarks = [], lifecycle = [], mounts = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
let page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
async function init(url) {
  await page.goto(url);
  await page.waitForSelector('[data-galaxy-scene] canvas');
  if (new URL(url).pathname === '/') {
    await page.waitForFunction(async () => {
      const url = performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.includes('/src/stores/useLoadingStore.js')).at(-1);
      return url && !(await import(url)).useLoadingStore.getState().isLoading;
    });
    await page.waitForTimeout(300);
    await page.waitForTimeout(3500);
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(async () => {
    const url = performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.includes('/@react-three_fiber.js')).at(-1);
    if (!url) return false;
    const { _roots } = await import(url);
    return Boolean(_roots.get(document.querySelector('[data-galaxy-scene] canvas')));
  });
  // Warm fonts expose StrictMode's first transient root; wait for its cleanup/remount.
  await page.waitForTimeout(650);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(entry => entry.name);
    const loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots, addAfterEffect } = await import(loaded('/@react-three_fiber.js'));
    const { ScrollSmoother, ScrollTrigger, gsap } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { storyCameraPath, cameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { portalState, portalProgress } = await import(loaded("/src/3d/utils/portal.js"));
    window.r22 = { portalState, portalProgress, fiber: _roots.get(document.querySelector('[data-galaxy-scene] canvas')).store, addAfterEffect, ScrollSmoother, ScrollTrigger, gsap, useScrollStore, storyCameraPath, cameraPath };
  });
  await page.waitForTimeout(650);
}

const snapshot = () => page.evaluate(() => {
  const { fiber, useScrollStore, storyCameraPath, portalState, portalProgress } = window.r22;
  const s = useScrollStore.getState(), f = fiber.getState();
  const u = f.scene.getObjectByName('accretion-disk').material.uniforms;
  const expected = storyCameraPath(s.storyChapter, s.chapterProgress, {}, matchMedia('(prefers-reduced-motion: reduce)').matches, innerWidth / innerHeight);
  const forward = f.camera.getWorldDirection(f.camera.position.clone()).toArray();
  const direction = [expected.lookX - expected.x, expected.lookY - expected.y, expected.lookZ - expected.z];
  const distance = Math.hypot(...direction);
  const anchor = document.querySelector('[data-story-anchor="portal"]')?.getBoundingClientRect();
  const center = u.uPortalCenter.value.toArray();
  const phase = portalState(portalProgress(s.storyChapter, s.chapterProgress, matchMedia('(prefers-reduced-motion: reduce)').matches));
  const gpu = f.gl.getContext(), ext = gpu.getExtension('WEBGL_debug_renderer_info');
  return { chapter: s.storyChapter, p: s.chapterProgress, manual: s.storyManual, camera: f.camera.position.toArray(), target: expected,
    poseError: Math.max(Math.abs(f.camera.position.x - expected.x), Math.abs(f.camera.position.y - expected.y), Math.abs(f.camera.position.z - expected.z)),
    directionError: Math.max(...forward.map((v, i) => Math.abs(v - direction[i] / distance))),
    radius: Math.hypot(f.camera.position.x, f.camera.position.y, f.camera.position.z + 200),
    backdrop: f.scene.getObjectByName('portal-backdrop').visible, phase, anchor: s.storyAnchor,
    anchorError: anchor ? Math.max(Math.abs(center[0] * innerWidth - anchor.left - anchor.width / 2), Math.abs((1 - center[1]) * innerHeight - anchor.top - anchor.height / 2)) : null,
    mini: u.uPortalMini.value, enabled: u.uPortalEnabled.value, visibility: u.uPortalVisibility.value, scale: u.uPortalScale.value,
    center, aperture: u.uPortalRadius.value.toArray(), pull: u.uPortalPull.value, rayCenter: u.uRayCenter.value.toArray(),
    viewport: [innerWidth, innerHeight], dpr: f.gl.getPixelRatio(), tier: document.querySelector('[data-galaxy-scene]').dataset.quality,
    memory: f.gl.info.memory, gpu: ext ? gpu.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gpu.getParameter(gpu.RENDERER),
    glError: gpu.getError(), canvas: document.querySelectorAll('[data-galaxy-scene] canvas').length,
    writers: f.internal.subscribers.filter(sub => sub.priority === -1).length, subscribers: f.internal.subscribers.length,
    overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    heading: document.querySelector('[data-portal-stage] h1')?.getAttribute('aria-label'), year: document.querySelector('[data-portal-stage] > p')?.textContent,
    textOpacity: document.querySelector('[data-portal-stage]') ? Number(getComputedStyle(document.querySelector('[data-portal-stage]')).opacity) : null,
    yearClipped: document.querySelector('[data-portal-stage] > p') ? (() => { const r = document.querySelector('[data-portal-stage] > p').getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight; })() : null,
    oIndex: [...document.querySelectorAll('[data-portal-char]')].findIndex(el => el.dataset.storyAnchor),
    frozen: matchMedia('(prefers-reduced-motion: reduce)').matches };
});
async function instrument() {
  await page.evaluate(() => {
    const { fiber, addAfterEffect } = window.r22, gl = fiber.getState().gl, gpu = gl.getContext();
    const ext = gpu.getExtension('EXT_disjoint_timer_query_webgl2');
    const data = { targets: new Set(), watched: new WeakSet(), rayTargets: new Set(), disposed: [], peak: 0, rayCalls: 0, frameCalls: [], cpu: [], gpu: [], ext: Boolean(ext), query: null, measure: false };
    const set = gl.setRenderTarget.bind(gl), render = gl.render.bind(gl);
    gl.setRenderTarget = target => {
      if (target && !data.targets.has(target)) {
        data.targets.add(target);
        data.peak = Math.max(data.peak, data.targets.size);
        if (!data.watched.has(target)) {
          data.watched.add(target);
          target.addEventListener('dispose', () => { data.targets.delete(target); data.disposed.push(target.texture.uuid); });
        }
      }
      return set(target);
    };
    gl.render = (scene, camera) => {
      const ray = Boolean(scene.children[0]?.material?.uniforms?.uObserver);
      if (!ray) return render(scene, camera);
      data.rayCalls++;
      const target = gl.getRenderTarget(); data.rayTargets.add(target.texture.uuid); data.rayTarget = target;
      if (data.measure && data.query && gpu.getQueryParameter(data.query, gpu.QUERY_RESULT_AVAILABLE)) {
        if (!gpu.getParameter(ext.GPU_DISJOINT_EXT)) data.gpu.push(gpu.getQueryParameter(data.query, gpu.QUERY_RESULT) / 1e6);
        gpu.deleteQuery(data.query); data.query = null;
      }
      let timed = false;
      if (data.measure && ext && !data.query) { data.query = gpu.createQuery(); gpu.beginQuery(ext.TIME_ELAPSED_EXT, data.query); timed = true; }
      const start = performance.now();
      const result = render(scene, camera);
      if (data.measure) data.cpu.push(performance.now() - start);
      if (timed) gpu.endQuery(ext.TIME_ELAPSED_EXT);
      return result;
    };
    data.stop = addAfterEffect(() => { data.frameCalls.push(data.rayCalls); data.rayCalls = 0; });
    window.r22.instrument = data;
  });
}
const targetSnapshot = () => page.evaluate(() => {
  const d = window.r22.instrument;
  return { live: d.targets.size, peak: d.peak, disposedEvents: d.disposed.length, rayTargetIDs: [...d.rayTargets],
    dimensions: [d.rayTarget.width, d.rayTarget.height], frames: d.frameCalls.length,
    minRayCalls: Math.min(...d.frameCalls.slice(1)), maxRayCalls: Math.max(...d.frameCalls.slice(1)) };
});
const hdrSnapshot = () => page.evaluate(() => {
  const f = window.r22.fiber.getState(), d = window.r22.instrument, t = d.rayTarget;
  // RGBA16F values: half-float exponent 31 means Inf/NaN.
  const pixels = new Uint16Array(t.width * t.height * 4);
  f.gl.readRenderTargetPixels(t, 0, 0, t.width, t.height, pixels);
  let nonfinite = 0, nonzero = 0;
  for (const value of pixels) { if ((value & 0x7c00) === 0x7c00) nonfinite++; if (value) nonzero++; }
  return { samples: pixels.length, nonfinite, nonzero, dimensions: [t.width, t.height], glError: f.gl.getContext().getError() };
});
async function benchmark(p, label) {
  await pose(p, `${label} warmup`);
  await page.waitForTimeout(300);
  const measured = await page.evaluate(async label => {
    const d = window.r22.instrument;
    d.cpu = []; d.gpu = []; d.measure = true;
    const before = d.frameCalls.length, start = performance.now(); performance.mark(label);
    await new Promise(resolve => setTimeout(resolve, 1800));
    const elapsed = performance.now() - start, frames = d.frameCalls.length - before;
    d.measure = false;
    const stats = a => ({ samples: a.length, mean: a.length ? a.reduce((sum, v) => sum + v, 0) / a.length : null, max: a.length ? Math.max(...a) : null });
    return { fps: frames * 1000 / elapsed, frames, elapsed, cpuSubmissionMs: stats(d.cpu), gpuRayMs: stats(d.gpu), gpuTimerAvailable: d.ext };
  }, label);
  benchmarks.push({ label, p, ...measured, configuration: await snapshot(), targets: await targetSnapshot() });
}
function check(s, label) {
  assert.equal(s.canvas, 1, label); assert.equal(s.writers, 1, label); assert.equal(s.glError, 0, label); assert.equal(s.overflow, 0, label);
  assert(s.camera.every(Number.isFinite) && s.radius > 1.01 && s.poseError < 1e-9 && s.directionError < 1e-9, label);
  if (s.enabled) {
    assert(s.anchorError < .1, `${label} anchor error ${s.anchorError}`);
    assert.equal(s.mini, s.phase.mini); assert.equal(s.visibility, s.phase.visibility);
    assert.equal(s.heading, 'PORTFOLIO'); assert.equal(s.year, '2026'); assert.equal(s.oIndex, 8);
    assert.equal(s.yearClipped, false, label); assert(Math.abs(s.textOpacity - s.phase.textOpacity) < 1e-5, label);
    assert.equal(s.backdrop, s.phase.pull >= .52);
  }
  assert.equal(s.enabled, 1, label);
  results.push({ label, ...s });
}
async function pose(p, label, screenshot) {
  await page.selectOption('#lab-chapter', 'portal');
  await page.locator(`[data-pose="${p}"]`).click();
  await page.waitForTimeout(650);
  const s = await snapshot(); check(s, label); assert.equal(s.p, p);
  if (screenshot) {
    await page.addStyleTag({ content: '[data-lab-hud],[data-lab-controls],a[href="/"]{visibility:hidden!important}' });
    await page.screenshot({ path: new URL(`screenshots/${screenshot}.png`, out).pathname.replace(/^\/(\w:)/, '$1') });
    await page.locator('style').last().evaluate(el => el.remove());
  }
  return s;
}
try {
  await init('http://127.0.0.1:5173/3d-lab.html?story=1');
  check(await snapshot(), 'Hero initial');
  await instrument();
  for (const viewport of [{ width: 1440, height: 900, label: 'desktop' }, { width: 390, height: 844, label: 'mobile' }]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height }); await page.waitForTimeout(750);
    const forward = [];
    for (const p of [0, .25, .5, .75, 1]) { forward.push(await pose(p, `${viewport.label} forward ${p}`, `${viewport.label}-forward-${p}`)); const hdr = await hdrSnapshot(); assert.equal(hdr.nonfinite, 0); assert.equal(hdr.glError, 0); streams.push({ label: `${viewport.label} HDR ${p}`, ...hdr }); }
    for (const [index, p] of [1, .75, .5, .25, 0].entries()) {
      const reverse = await pose(p, `${viewport.label} reverse ${p}`, `${viewport.label}-reverse-${p}`);
      for (const key of ['camera', 'mini', 'visibility', 'scale', 'center', 'aperture', 'pull', 'rayCenter']) assert.deepEqual(reverse[key], forward[4 - index][key], `${viewport.label} reverse ${key}`);
    }
  }
  // Blackout boundaries and mid-ejection, without a second producer.
  for (const p of [.43, .48, .519, .52, .6, .65]) {
    await page.evaluate(p => window.r22.useScrollStore.getState().setStoryPosition('portal', p, window.r22.useScrollStore.getState().scrollProgress, true), p);
    await page.waitForTimeout(100);
    check(await snapshot(), `boundary ${p}`);
  }
  await pose(.25, 'hold start'); const held = await snapshot();
  await page.mouse.move(2, 2); await page.mouse.wheel(0, 500); await page.waitForTimeout(700);
  const hold = await snapshot(); check(hold, 'wheel / pointer held'); assert.deepEqual(hold.camera, held.camera); assert.equal(hold.pull, held.pull);
  await page.locator('#lab-hold').click(); await page.waitForTimeout(250);
  check(await snapshot(), 'resume at held position');
  const scrollStream = page.evaluate(async () => {
    const { fiber, addAfterEffect, useScrollStore, portalState, portalProgress } = window.r22;
    const samples = [];
    const stop = addAfterEffect(() => {
      const state = useScrollStore.getState(), u = fiber.getState().scene.getObjectByName('accretion-disk').material.uniforms;
      const phase = portalState(portalProgress(state.storyChapter, state.chapterProgress));
      samples.push({ chapter: state.storyChapter, p: state.chapterProgress, pullError: Math.abs(phase.pull - u.uPortalPull.value), opacityError: Math.abs(Number(getComputedStyle(document.querySelector('[data-portal-stage]')).opacity) - phase.textOpacity) });
    });
    await new Promise(resolve => setTimeout(resolve, 1100)); stop(); return samples;
  });
  await page.mouse.wheel(0, 500); const samples = await scrollStream;
  streams.push({ label: 'visible scroll / synchronous DOM and composite', samples });
  console.log('scroll stream', samples.length, Math.max(...samples.map(s => s.pullError)), Math.max(...samples.map(s => s.opacityError)));
  // Installed GSAP CSSPlugin rounds numeric CSS values to 4 decimal places.
  assert(samples.length > 20 && samples.every(s => s.pullError < 1e-9 && s.opacityError <= .0000501));
  await pose(.25, 'resize starting pose');
  for (let cycle = 1; cycle <= 3; cycle++) {
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 }); await page.waitForTimeout(700);
      const s = await snapshot(); check(s, `resize ${cycle}/${width}`); assert.equal(s.p, .25);
    }
    await page.locator('details').evaluate(el => { el.open = true; }); await page.locator('#lab-language').click();
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(650);
    check(await snapshot(), `locale ${cycle}`);
    await page.locator('#lab-mode').click(); await page.waitForTimeout(200); await page.locator('#lab-mode').click(); await page.waitForTimeout(650);
    await pose(.25, `mode lifecycle ${cycle}`);
    lifecycle.push({ cycle, targets: await targetSnapshot(), state: await snapshot() });
    await page.locator('details').evaluate(el => { el.open = false; });
  }
  assert(lifecycle.every(c => c.targets.live === lifecycle[0].targets.live && c.state.subscribers === lifecycle[0].state.subscribers && c.state.memory.textures === lifecycle[0].state.memory.textures), 'resources stable after resize/mode cycles');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(750);
  for (const p of [0, .25, .5, .75, 1]) { const s = await pose(p, `live reduced ${p}`); assert.equal(s.mini, 0); assert.equal(s.pull, 1); }
  await page.selectOption('#lab-chapter', 'hero'); await page.waitForTimeout(650);
  const frozenHero = await snapshot(); check(frozenHero, 'reduced Hero idle'); assert.equal(frozenHero.pull, 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(650);
  await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(750);
  const client = await context.newCDPSession(page);
  await client.send('Tracing.start', { categories: 'devtools.timeline,gpu,blink.user_timing', transferMode: 'ReturnAsStream', streamCompression: 'gzip' });
  await benchmark(.25, 'R2.2-opening-O'); await benchmark(.75, 'R2.2-ejection');
  const complete = new Promise(resolve => client.once('Tracing.tracingComplete', resolve));
  await client.send('Tracing.end'); const trace = await complete, chunks = [];
  while (true) { const chunk = await client.send('IO.read', { handle: trace.stream }); chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8')); if (chunk.eof) break; }
  await client.send('IO.close', { handle: trace.stream }); writeFileSync(new URL('trace.json.gz', out), Buffer.concat(chunks));
  const targetCounts = await targetSnapshot(); assert.equal(targetCounts.rayTargetIDs.length, 1); assert.equal(targetCounts.minRayCalls, 1); assert.equal(targetCounts.maxRayCalls, 1);
  streams.push({ label: 'one HDR ray image / target instrumentation', ...targetCounts });
  for (let cycle = 1; cycle <= 3; cycle++) {
    if (cycle > 1) { await init(`http://127.0.0.1:5173/3d-lab.html?story=1&chapter=portal&p=.25&mount=${cycle}`); await instrument(); await page.waitForTimeout(350); }
    const before = await targetSnapshot();
    // Exercise the existing context-loss fallback so React actually unmounts Canvas.
    await page.evaluate(() => {
      const d = window.r22.instrument; d.stop();
      if (d.query) { window.r22.fiber.getState().gl.getContext().deleteQuery(d.query); d.query = null; }
      document.querySelector('[data-galaxy-scene] canvas').dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    });
    await page.waitForTimeout(900);
    const after = await targetSnapshot();
    assert.equal(await page.locator('[data-galaxy-scene] canvas').count(), 0); assert.equal(after.live, 0);
    mounts.push({ cycle, before, after, actualCanvasUnmount: true, trigger: 'simulated context-loss event through existing fallback' });
  }
  for (const url of ['http://127.0.0.1:5173/3d-lab.html?story=1&chapter=about&p=.5', 'http://127.0.0.1:5173/3d-lab.html?story=1&chapter=portal&p=.75']) {
    await init(url); const s = await snapshot(); check(s, `fresh jump ${s.chapter}`); assert.equal(s.p, Number(new URL(url).searchParams.get('p')));
  }
  await page.emulateMedia({ reducedMotion: 'reduce' }); await init('http://127.0.0.1:5173/3d-lab.html?story=1&chapter=portal&p=.25');
  check(await snapshot(), 'fresh reduced Portal'); await page.emulateMedia({ reducedMotion: 'no-preference' });
  // A fresh production root keeps the legacy camera/composite path.
  await init('http://127.0.0.1:5173/');
  for (const section of ['hero', 'transmission']) {
    if (section === 'transmission') { await page.evaluate(() => window.r22.ScrollSmoother.get()?.scrollTo(document.getElementById('transmission'), false, 'top top')); await page.waitForTimeout(1700); }
    const s = await snapshot(); assert.equal(s.enabled, 0); assert.equal(s.canvas, 1); assert.equal(s.glError, 0); assert(s.camera.every(Number.isFinite));
    const legacy = await page.evaluate(() => { const { fiber, useScrollStore, cameraPath } = window.r22, s = useScrollStore.getState(), c = fiber.getState().camera.position, p = cameraPath(s.scrollProgress + (1 - s.scrollProgress) * s.contactProgress); return Math.max(Math.abs(c.x - p.x), Math.abs(c.y - p.y), Math.abs(c.z - p.z + 2 * s.contactProgress)); });
    assert(legacy < .01); results.push({ label: `production ${section} smoke`, legacyPoseError: legacy, ...s });
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
} finally {
  writeFileSync(new URL('browser-results.json', out), JSON.stringify({ checkedAt: new Date().toISOString(), browser: await browser.version(), device: 'isolated Edge headless on development PC; viewport simulation', errors, warnings: [...new Set(warnings)], results, streams, benchmarks, lifecycle, mounts }, null, 2) + '\n');
  await browser.close();
}
