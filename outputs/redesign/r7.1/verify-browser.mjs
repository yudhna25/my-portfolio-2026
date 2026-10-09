// Output-only QA against the production App; source internals are observed through dev imports.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url), file = name => fileURLToPath(new URL(name, out));
const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const quick = process.argv.includes('--quick');
const ambientOnly = process.argv.includes('--ambient-only');
const extras = process.argv.includes('--extras') || ambientOnly;
const report = { status: 'running', base, checkedAt: new Date().toISOString(), configurations: [], errors: [], warnings: [], limits: ['Desktop Edge with emulated viewport/touch/reduced-motion; not a physical phone.', 'Precise held poses synchronize DOM scroll then hold the existing story store; native-wheel stream separately exercises the live producer.', 'Pixel equality covers the actual Canvas; DOM screenshots are separate.', 'Hidden state is simulated through visibilitychange.'] };
mkdirSync(file('screenshots/'), { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browser = browser.version();
const save = () => writeFileSync(file(ambientOnly ? 'ambient-results.json' : extras ? 'extras-results.json' : 'browser-results.json'), JSON.stringify(report, null, 2) + '\n');
let page, context, current;
const near = (a, b, tolerance, label) => assert(Math.abs(a - b) <= tolerance, `${label}: ${a} != ${b}`);

async function setup(width, dpr = 1) {
  context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, deviceScaleFactor: dpr, hasTouch: width === 390, serviceWorkers: 'block' });
  page = await context.newPage();
  current = { width, deviceScaleFactor: dpr, poses: [], comparisons: [], native: [], benchmarks: [], lifecycle: [], errors: [], warnings: [] };
  report.configurations.push(current);
  page.on('pageerror', e => { current.errors.push(e.message); report.errors.push(e.message); });
  page.on('console', m => { if (m.type() === 'error') { current.errors.push(m.text()); report.errors.push(m.text()); } if (m.type() === 'warning') { current.warnings.push(m.text()); report.warnings.push(m.text()); } });
  await page.goto(`${base}/#work`);
  await ready();
}
async function ready() {
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.waitForFunction(async () => {
    const url = performance.getEntriesByType('resource').map(e => e.name).filter(url => url.includes('/@react-three_fiber.js')).at(-1);
    if (!url) return false;
    const { _roots } = await import(url);
    return Boolean(_roots.get(document.querySelector('[data-galaxy-scene] canvas'))?.store.getState().scene.getObjectByName('accretion-disk'));
  });
  await page.evaluate(async () => {
    const loaded = name => performance.getEntriesByType('resource').map(e => e.name).filter(url => url.includes(name)).at(-1);
    const fiber = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { finaleState } = await import(loaded('/src/3d/utils/finale.js'));
    const { ScrollSmoother, ScrollTrigger } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { useLangStore } = await import(loaded('/src/stores/useLangStore.js'));
    window.r71 = { ...fiber, useScrollStore, storyCameraPath, finaleState, ScrollSmoother, ScrollTrigger, useLangStore };
  });
  await page.waitForTimeout(800);
  await page.waitForFunction(() => {
    const root = r71._roots.get(document.querySelector('[data-galaxy-scene] canvas'));
    if (!root?.store.getState().scene.getObjectByName('accretion-disk')) return false;
    r71.store = root.store;
    return true;
  });
  await instrument();
}
async function instrument() {
  await page.evaluate(() => {
    const { store, addEffect, addAfterEffect } = r71, f = store.getState(), renderer = f.gl, gl = renderer.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const d = { frames: 0, rayCalls: 0, frameCalls: [], cpu: [], gpu: [], draws: [], targets: new Set(), disposedTargets: [], geometries: new Set(), materials: new Set(), disposal: [], watched: new WeakSet(), measure: false, query: null, timing: false, ext: Boolean(ext) };
    const render = renderer.render.bind(renderer), setTarget = renderer.setRenderTarget.bind(renderer);
    renderer.setRenderTarget = target => {
      if (target && !d.watched.has(target)) { d.watched.add(target); d.targets.add(target); target.addEventListener('dispose', () => { d.targets.delete(target); d.disposedTargets.push(target.texture.uuid); }); }
      return setTarget(target);
    };
    const watch = (object, collection) => {
      if (!object || d.watched.has(object)) return;
      d.watched.add(object); collection.add(object.uuid); object.addEventListener('dispose', () => d.disposal.push(object.uuid));
    };
    renderer.render = (scene, camera) => {
      if (scene.children[0]?.material?.uniforms?.uObserver) { d.rayCalls++; d.rayTarget = renderer.getRenderTarget(); }
      scene.traverse(o => { watch(o.geometry, d.geometries); for (const material of Array.isArray(o.material) ? o.material : [o.material]) watch(material, d.materials); });
      return render(scene, camera);
    };
    renderer.info.autoReset = false;
    d.before = addEffect(() => {
      renderer.info.reset(); d.start = performance.now();
      if (d.query && gl.getQueryParameter(d.query, gl.QUERY_RESULT_AVAILABLE)) { if (d.measure && !gl.getParameter(ext.GPU_DISJOINT_EXT)) d.gpu.push(gl.getQueryParameter(d.query, gl.QUERY_RESULT) / 1e6); gl.deleteQuery(d.query); d.query = null; }
      if (d.measure && ext && !d.query) { d.query = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, d.query); d.timing = true; }
    });
    d.after = addAfterEffect(() => {
      d.frames++; d.frameCalls.push(d.rayCalls); d.rayCalls = 0;
      if (d.timing) { gl.endQuery(ext.TIME_ELAPSED_EXT); d.timing = false; }
      if (d.measure) { d.cpu.push(performance.now() - d.start); d.draws.push(renderer.info.render.calls); }
    });
    d.stop = () => { d.before(); d.after(); if (d.query) { gl.deleteQuery(d.query); d.query = null; } };
    r71.instrument = d;
  });
}
async function seek(p, chapter = 'finale', hold = true) {
  await page.evaluate(({ p, chapter, hold }) => {
    const { useScrollStore, ScrollSmoother } = r71, s = useScrollStore.getState();
    const content = document.querySelector('#smooth-content'), chapters = [...content.querySelectorAll('[data-story-chapter]')];
    const i = chapters.findIndex(el => el.dataset.storyChapter === chapter); if (i < 0) throw new Error(`Missing chapter ${chapter}`);
    const contentTop = content.getBoundingClientRect().top, top = chapters[i].getBoundingClientRect().top - contentTop;
    const max = document.documentElement.scrollHeight - innerHeight, end = chapters[i + 1] ? chapters[i + 1].getBoundingClientRect().top - contentTop : max;
    const y = top + (end - top) * p;
    s.setStoryPosition(chapter, p, y / max, true);
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTop(y); const trigger = smoother.scrollTrigger; trigger.update();
      const scrub = trigger.getTween(); if (typeof scrub?.progress === 'function') scrub.progress(1).pause();
      trigger.animation.progress(trigger.progress);
    } else scrollTo(0, y);
    s.setStoryPosition(chapter, p, y / max, hold);
  }, { p, chapter, hold });
  await page.waitForTimeout(100);
}
async function snapshot() {
  return page.evaluate(() => {
    const { store, useScrollStore, storyCameraPath, finaleState, ScrollSmoother, ScrollTrigger } = r71;
    const f = store.getState(), s = useScrollStore.getState(), mesh = f.scene.getObjectByName('accretion-disk'), u = mesh.material.uniforms;
    const root = f.scene.getObjectByName('works-constellations'), trail = f.scene.getObjectByName('finale-trails'), meteor = f.scene.getObjectByName('shooting-stars');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const expected = storyCameraPath(s.storyChapter, s.chapterProgress, {}, reduced, innerWidth / innerHeight);
    const phase = finaleState(reduced || s.storyChapter === 'contact' ? 1 : s.chapterProgress);
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const dom = selector => { const el = document.querySelector(selector); return el ? { hidden: el.hidden, inert: el.inert, opacity: +getComputedStyle(el).opacity, visibility: getComputedStyle(el).visibility, ariaHidden: el.getAttribute('aria-hidden'), top: el.getBoundingClientRect().top, height: el.getBoundingClientRect().height } : null; };
    const finale = document.querySelector('[data-story-chapter="finale"]'), contact = document.querySelector('[data-story-chapter="contact"]');
    const contentTop = document.querySelector('#smooth-content').getBoundingClientRect().top;
    const top = finale.getBoundingClientRect().top - contentTop, end = contact.getBoundingClientRect().top - contentTop;
    const y = ScrollSmoother.get()?.scrollTop() ?? scrollY;
    const program = f.gl.properties.get(mesh.material).currentProgram, shader = program && gl.getShaderSource(program.fragmentShader);
    let trailSum = 0; for (let i = 0; i < trail.geometry.attributes.position.array.length; i++) trailSum += trail.geometry.attributes.position.array[i] * (1 + i % 7);
    return { chapter: s.storyChapter, p: s.chapterProgress, manual: s.storyManual, phase, orbit: { ...s.worksOrbit }, selected: s.worksSelection, reduced, language: document.documentElement.lang,
      visible: root.visible, trailVisible: trail.visible, trailSum, ambientVisible: meteor?.visible ?? false,
      groups: root.children.filter(g => g.name.startsWith('works-')).map(g => ({ name: g.name, position: g.position.toArray(), world: g.getWorldPosition(f.camera.position.clone()).toArray(), scale: g.scale.toArray() })),
      camera: f.camera.position.toArray(), cameraError: Math.max(Math.abs(f.camera.position.x - expected.x), Math.abs(f.camera.position.y - expected.y), Math.abs(f.camera.position.z - expected.z)),
      hole: u.uFinaleHole.value, gas: u.uFinaleGas.value.toArray(), enabled: u.uFinaleEnabled.value, rayCenter: u.uRayCenter.value.toArray(), visibility: u.uPortalVisibility.value,
      labels: dom('[data-work-background]'), contactText: dom('[data-contact-content]'), contact: dom('#transmission'),
      domProgress: Math.min(1, Math.max(0, (y - top) / (end - top))), finaleHeightVH: (end - top) / innerHeight, y,
      dpr: f.gl.getPixelRatio(), tier: document.querySelector('[data-galaxy-scene]').dataset.quality, glError: gl.getError(), memory: { ...f.gl.info.memory },
      copyOctaves: mesh.material.defines.FINALE_OCTAVES, compiledOctaves: Number(shader?.match(/#define FINALE_OCTAVES (\d)/)?.[1]), trailVertices: trail.geometry.attributes.position.count,
      canvas: document.querySelectorAll('canvas').length, cameraWriters: f.internal.subscribers.filter(sub => sub.priority === -1).length,
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), viewport: [innerWidth, innerHeight], focus: document.activeElement?.id,
      triggers: ScrollTrigger.getAll().map(item => item.vars.id ?? 'anonymous'), targets: r71.instrument.targets.size };
  });
}
function check(s, label) {
  assert.equal(s.canvas, 1, label); assert.equal(s.cameraWriters, 1, label); assert.equal(s.glError, 0, label); near(s.cameraError, 0, 1e-9, label);
  assert.equal(s.visibility, 1, label); assert.equal(s.enabled, 1, label); assert.equal(s.hole, s.phase.hole, label);
  assert.deepEqual(s.gas, [s.phase.cloud, s.phase.collapse, s.phase.flare, s.phase.progress], label);
  const octaves = s.tier === 'low' ? 2 : s.tier === 'medium' ? 3 : 4;
  assert.equal(s.copyOctaves, octaves, label); assert.equal(s.compiledOctaves, octaves, label);
  assert.equal(s.trailVertices, 44 * 2 * (s.tier === 'low' ? 12 : s.tier === 'medium' ? 18 : 24), label);
  assert(s.finaleHeightVH >= (s.reduced ? 0 : 2) && s.finaleHeightVH <= 2.5, label + ' separate finale range');
  assert(!s.triggers.includes('contact-approach'), label + ' no legacy contact writer');
  if (s.chapter === 'finale') {
    assert.equal(s.ambientVisible, false, label + ' ambient yields');
    if (!s.manual) near(s.p, s.domProgress, 1e-5, label + ' DOM producer');
    if (s.p >= .44 && s.p < .55 && s.visible) s.groups.forEach(g => near(Math.hypot(g.world[0], g.world[1], g.world[2] + 200), 0, 1e-10, label + ' collision center'));
    if (s.p >= .12) assert(s.labels.hidden || s.labels.inert && s.labels.opacity === 0, label + ' labels withdrawn');
  }
}
const hash = value => createHash('sha256').update(value).digest('hex');
async function canvasData() { return page.evaluate(() => new Promise(resolve => { const stop = r71.addAfterEffect(() => { stop(); resolve(document.querySelector('[data-galaxy-scene] canvas').toDataURL()); }); })); }
async function capture(label) {
  await page.screenshot({ path: file(`screenshots/${current.width}-${label}.png`) });
  const data = await canvasData();
  writeFileSync(file(`screenshots/${current.width}-${label}-canvas.png`), Buffer.from(data.split(',')[1], 'base64'));
}
async function pose(p, label, image = false) { await seek(p); const s = await snapshot(); check(s, label); current.poses.push({ label, ...s }); if (image) await capture(label); return s; }
async function benchmark(p, label) {
  await seek(p); await page.waitForTimeout(350);
  const measured = await page.evaluate(async () => {
    const d = r71.instrument; d.cpu = []; d.gpu = []; d.draws = []; d.measure = true;
    const before = d.frames, start = performance.now(); await new Promise(resolve => setTimeout(resolve, 1600)); const elapsed = performance.now() - start; d.measure = false;
    const stats = values => { const a = [...values].sort((a, b) => a - b); return { samples: a.length, mean: a.length ? a.reduce((sum, v) => sum + v, 0) / a.length : null, p95: a[Math.floor(a.length * .95)] ?? null, max: a.at(-1) ?? null }; };
    return { fps: (d.frames - before) * 1000 / elapsed, frames: d.frames - before, elapsed, cpuMs: stats(d.cpu), gpuMs: stats(d.gpu), draws: stats(d.draws), gpuTimer: d.ext,
      rayPerFrame: [Math.min(...d.frameCalls.slice(-100)), Math.max(...d.frameCalls.slice(-100))], targets: d.targets.size, rayDimensions: [d.rayTarget.width, d.rayTarget.height] };
  });
  current.benchmarks.push({ label, p, ...measured, configuration: await snapshot() });
}

try {
  for (const width of extras ? [] : quick ? [1440] : [1440, 390]) {
    await setup(width);
    await context.tracing.start({ screenshots: true, snapshots: true });
    await seek(.3, 'works', false);
    await page.locator('[data-work-background]').click({ position: { x: 8, y: 300 } });
    await page.mouse.move(1, 1); await page.waitForTimeout(900);
    await page.locator('#work-target-edura').hover(); await page.waitForTimeout(1000);
    const before = await snapshot(); assert(before.orbit.phase > 0, 'exercise nonzero idle phase');
    await pose(.001, 'origin'); const origin = (await snapshot()).orbit.origin;
    const points = [0, .06, .1199, .12, .1201, .25, .3399, .34, .3401, .4, .4399, .44, .4401, .5, .58, .6999, .7, .7001, .75, .8799, .88, .8801, .9599, .96, .9601, 1];
    const forwards = new Map();
    for (const p of points) forwards.set(p, await pose(p, `forward-${p}`, [0, .25, .4, .44, .5, .58, .75, 1].includes(p)));
    for (const p of [...points].reverse()) {
      const a = forwards.get(p), b = await pose(p, `reverse-${p}`);
      assert.equal(b.orbit.origin, origin); assert.deepEqual(b.camera, a.camera); assert.deepEqual(b.gas, a.gas);
      if (a.visible) assert.deepEqual(b.groups, a.groups);
      if (a.trailVisible && a.visible) assert.equal(b.trailSum, a.trailSum);
    }
    for (const p of [.25, .4, .5, .75, 1]) {
      await seek(p); const a = await snapshot(), first = hash(await canvasData()); await page.waitForTimeout(550); const held = hash(await canvasData());
      assert.equal(held, first, `held Canvas ${p}`);
      await seek(p === 1 ? .98 : p + .03); await seek(p); const reverse = hash(await canvasData()); assert.equal(reverse, first, `reversed Canvas ${p}`);
      current.comparisons.push({ p, first, held, reverse, origin: a.orbit.origin, trailSum: a.trailSum });
    }
    for (const p of [.39, .46, .415, .51, .435, .45, .40, .43]) { const s = await pose(p, `rapid-${p}`); assert.equal(s.orbit.origin, origin); }
    await seek(.30, 'finale', false);
    await page.mouse.move(width * .5, 400);
    for (const delta of [80, 160, 220, -80, -160, 240, -100, 180, -260]) {
      await page.mouse.wheel(0, delta); await page.waitForTimeout(170);
      const s = await snapshot(); if (s.chapter === 'finale') { check(s, 'native wheel'); assert.equal(s.orbit.origin, origin); current.native.push(s); }
    }
    assert(current.native.some(s => s.p > .34 && s.p < .7), 'native wheel crosses compression/explosion');
    await context.tracing.stop({ path: file(`trace-${width}.zip`) });
    for (const p of [.4, .58, .75]) await benchmark(p, `tier-${p}`);
    for (const language of ['en', 'vi']) {
      await page.evaluate(lang => r71.useLangStore.getState().setLang(lang), language); await page.waitForTimeout(450);
      const s = await pose(.58, `locale-${language}`, true); assert.equal(s.language, language); assert.equal(s.orbit.origin, origin);
    }
    await page.setViewportSize({ width: width === 390 ? 768 : 1920, height: 1000 }); await page.waitForTimeout(600);
    let s = await pose(.58, 'resize'); assert.equal(s.orbit.origin, origin);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 }); await page.waitForTimeout(600);
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.emulateMedia({ reducedMotion: 'reduce' }); s = await pose(.4, `reduced-${cycle}`, cycle === 0); assert.equal(s.hole, 1); assert.equal(s.visible, false);
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await pose(.58, `motion-restored-${cycle}`);
    }
    current.hiddenFrames = await page.evaluate(async () => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(r => setTimeout(r, 200)); const start = r71.instrument.frames; await new Promise(r => setTimeout(r, 450)); const count = r71.instrument.frames - start;
      delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); return count;
    }); assert.equal(current.hiddenFrames, 0);
    for (let cycle = 0; cycle < 3; cycle++) {
      await seek(.3, 'works', false); await page.waitForTimeout(350);
      if (await page.locator('#work-target-edura').getAttribute('aria-pressed') !== 'true') await page.locator('#work-target-edura').click();
      await page.mouse.move(1, 1); await page.waitForTimeout(300);
      await page.evaluate(() => { r71.instrument.stop(); window.r71Old = r71; });
      await page.locator('#work-case-edura').click(); await page.waitForSelector('[data-edura-reader]'); await page.waitForTimeout(650);
      const reader = await page.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, triggers: r71Old.ScrollTrigger.getAll().length, geometries: r71Old.store.getState().gl.info.memory.geometries, disposed: r71Old.instrument.disposal.length, targets: r71Old.instrument.targets.size }));
      assert.equal(reader.canvas, 0); assert.equal(reader.triggers, 0); assert.equal(reader.geometries, 0); assert(reader.disposed > 0);
      await page.goBack(); await ready(); const restored = await snapshot();
      assert.equal(restored.chapter, 'works'); assert.equal(restored.selected, 'edura'); assert.equal(restored.focus, 'work-target-edura');
      const saved = await page.evaluate(() => history.state.stellar.snapshot); near(restored.orbit.phase, saved.orbit.phase, 1e-8, 'case restores phase');
      await pose(.001, `return-latch-${cycle}`); const returned = await pose(.58, `return-finale-${cycle}`); near(returned.orbit.origin, saved.orbit.phase, 1e-8, 'returned phase latched for finale');
      current.lifecycle.push({ cycle, reader, restored, savedPhase: saved.orbit.phase, finale: returned });
    }
    assert.equal(current.errors.length, 0, current.errors.join('\n'));
    await page.evaluate(() => r71.instrument.stop()); await context.close(); save();
    await setup(width);
    await page.evaluate(() => r71.instrument.stop()); await page.goto(`${base}/#transmission`); await ready();
    current.directContact = await snapshot(); check(current.directContact, 'direct Contact'); assert.equal(current.directContact.orbit.origin, 0); assert.equal(current.directContact.hole, 1); await capture('direct-contact');
    await page.reload(); await ready(); current.reloadedContact = await snapshot(); check(current.reloadedContact, 'reload Contact'); assert.equal(current.reloadedContact.orbit.origin, 0);
    await page.evaluate(() => r71.instrument.stop()); await context.close(); save();
  }
  if (extras) {
    await setup(1440, 1.75);
    if (!ambientOnly) {
    for (const p of [.4, .58, .75]) await benchmark(p, `maxDPR-${p}`);
    await page.setViewportSize({ width: 900, height: 1000 }); await page.waitForTimeout(700);
    await benchmark(.58, 'medium-maxDPR');
    await seek(.5); await page.keyboard.press('Tab');
    current.keyboard = await page.evaluate(() => ({ focus: document.activeElement.id, inertAncestor: Boolean(document.activeElement.closest('[inert]')) }));
    assert.equal(current.keyboard.inertAncestor, false, 'Tab avoids withdrawn/inert story content');
    await seek(.3, 'works', false); await page.mouse.wheel(0, -100); await page.waitForTimeout(900);
    await page.locator('[aria-controls="stellar-menu"]').click();
    await page.locator('#stellar-menu a[href="/#transmission"]').click(); await page.waitForTimeout(1500);
    current.navContact = await snapshot(); check(current.navContact, 'native Menu Contact');
    assert.equal(current.navContact.chapter, 'contact'); assert.equal(current.navContact.contactText.inert, false);
    await capture('nav-contact');
    }
    await seek(.5, 'skills', false); await page.waitForTimeout(8000);
    let ambientSeen = false;
    for (let i = 0; i < 100; i++) {
      ambientSeen ||= await page.evaluate(() => {
        const meteor = r71.store.getState().scene.getObjectByName('shooting-stars');
        return Boolean(meteor?.visible && meteor.geometry.attributes.aAlpha.array.some(alpha => alpha > .001));
      });
      if (ambientSeen) break;
      await page.waitForTimeout(100);
    }
    current.quietAmbientSeen = ambientSeen; assert(ambientSeen, 'random ambient meteor retained in quiet chapter');
    await pose(.58, 'ambient-yields');
    await page.evaluate(() => r71.instrument.stop()); await context.close();
  }
  assert.equal(report.errors.length, 0, report.errors.join('\n'));
  report.status = 'pass';
} catch (error) { report.status = 'fail'; report.failure = { message: error.message, stack: error.stack }; process.exitCode = 1; }
finally { save(); await browser.close(); }
console.log(JSON.stringify({ status: report.status, configurations: report.configurations.length, failure: report.failure?.message }, null, 2));
