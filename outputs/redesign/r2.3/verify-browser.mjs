import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
const path = name => new URL(name, out).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(path('screenshots/'), { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await context.tracing.start({ screenshots: true, snapshots: true });
let page = await context.newPage();
const results = [], errors = [], warnings = [], performanceResults = [], lifecycle = [];
function monitor(p) {
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
}
monitor(page);
async function init(url = 'http://127.0.0.1:5173/3d-lab.html?story=1&chapter=works&p=.5') {
  await page.goto(url);
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(e => e.name);
    const loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots, addAfterEffect } = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { ScrollSmoother, ScrollTrigger } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    window.r23 = { fiber: _roots.get(document.querySelector('[data-galaxy-scene] canvas')).store, useScrollStore, storyCameraPath, addAfterEffect, ScrollSmoother, ScrollTrigger };
  });
}
async function snapshot(label) {
  const result = await page.evaluate(() => {
    const { fiber, useScrollStore, storyCameraPath } = window.r23;
    const s = useScrollStore.getState(), f = fiber.getState(), root = f.scene.getObjectByName('works-constellations');
    const expected = storyCameraPath(s.storyChapter, s.chapterProgress, {}, matchMedia('(prefers-reduced-motion: reduce)').matches, innerWidth / innerHeight);
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const groups = root?.children.map(g => {
      const geometry = g.children[1].geometry, a = geometry.attributes.position;
      const point = f.camera.position.clone(), bounds = [Infinity, Infinity, -Infinity, -Infinity];
      for (let i = 0; i < a.count; i++) {
        point.fromBufferAttribute(a, i); g.localToWorld(point); point.project(f.camera);
        const x = (point.x + 1) * innerWidth / 2, y = (1 - point.y) * innerHeight / 2;
        bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.min(bounds[1], y); bounds[2] = Math.max(bounds[2], x); bounds[3] = Math.max(bounds[3], y);
      }
      return { name: g.name, position: g.position.toArray(), rotation: g.quaternion.toArray(), scale: g.scale.toArray(), stars: a.count, edges: g.children[0].geometry.attributes.position.count / 2, strength: g.children[1].material.uniforms.uStrength.value, lineOpacity: g.children[0].material.opacity, bounds };
    });
    const buttons = [...document.querySelectorAll('[data-works-choice]')].map(b => { const r = b.getBoundingClientRect(); return { id: b.dataset.worksChoice, pressed: b.getAttribute('aria-pressed'), rect: [r.x, r.y, r.width, r.height] }; });
    return { chapter: s.storyChapter, p: s.chapterProgress, manual: s.storyManual, nativeY: window.scrollY, visibleY: window.r23.ScrollSmoother.get()?.scrollTop() ?? window.scrollY, smootherPaused: window.r23.ScrollSmoother.get()?.paused(), orbit: { ...s.worksOrbit }, selection: s.worksSelection, hover: s.worksHover, focus: s.worksFocus,
      phase: root?.userData.phase, visible: root?.visible, groups, buttons,
      camera: f.camera.position.toArray(), poseError: Math.max(Math.abs(expected.x - f.camera.position.x), Math.abs(expected.y - f.camera.position.y), Math.abs(expected.z - f.camera.position.z)),
      canvas: document.querySelectorAll('canvas').length, writers: f.internal.subscribers.filter(x => x.priority === -1).length, subscribers: f.internal.subscribers.length,
      memory: { ...f.gl.info.memory }, calls: f.gl.info.render.calls, glError: gl.getError(), overflow: document.documentElement.scrollWidth - innerWidth,
      viewport: [innerWidth, innerHeight], dpr: f.gl.getPixelRatio(), tier: document.querySelector('[data-galaxy-scene]').dataset.quality,
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      smoother: Boolean(window.r23.ScrollSmoother.get()), hidden: document.hidden, controlsVisible: !document.querySelector('[data-works-controls]').hidden };
  });
  assert.equal(result.canvas, 1, label); assert.equal(result.writers, 1, label); assert.equal(result.glError, 0, label); assert.equal(result.overflow, 0, label); assert(result.poseError < 1e-9, label);
  if (result.chapter === 'works') {
    assert.equal(result.visible, true); assert.deepEqual(result.groups.map(g => g.stars), [29, 29, 22]); assert.deepEqual(result.groups.map(g => g.edges), [16, 16, 9]);
    for (const g of result.groups) { assert.deepEqual(g.rotation, [0, 0, 0, 1]); assert(g.bounds[0] >= 0 && g.bounds[1] >= 0 && g.bounds[2] <= result.viewport[0] && g.bounds[3] <= result.viewport[1], `${label}: clipped ${g.name} ${g.bounds}`); }
    for (const b of result.buttons) assert(b.rect[2] >= 44 && b.rect[3] >= 44);
  }
  results.push({ label, ...result }); return result;
}
async function seek(chapter, p, delay = 100) {
  await page.selectOption('#lab-chapter', chapter);
  if ([0, .25, .5, .75, 1].includes(p)) await page.locator(`[data-pose="${p}"]`).click();
  else await page.locator('#lab-scrub').evaluate((el, p) => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    for (const value of [p === 0 ? 1 : 0, p]) { set.call(el, value); el.dispatchEvent(new Event('input', { bubbles: true })); }
  }, p);
  await page.waitForTimeout(delay);
  assert.equal(await page.evaluate(() => window.r23.useScrollStore.getState().chapterProgress), p, 'native range calls the shared seek/DOM sync');
}
async function screenshot(name) {
  await page.addStyleTag({ content: '[data-lab-controls],[data-lab-hud],a[href="/"]{visibility:hidden!important}' });
  await page.screenshot({ path: path(`screenshots/${name}.png`) });
  await page.locator('style').last().evaluate(el => el.remove());
}
async function openDetails() {
  if (await page.locator('[data-lab-controls] details').getAttribute('open') === null) await page.locator('[data-lab-controls] summary').click();
}
try {
  await init();
  const first = await snapshot('desktop idle'); await screenshot('desktop-idle');
  await page.waitForTimeout(350); const moving = await snapshot('idle advances'); assert(moving.orbit.phase > first.orbit.phase);
  const controls = first.buttons.map(b => b.rect);
  await page.locator('[data-works-choice="edura"]').hover(); await page.waitForTimeout(1800);
  const paused = await snapshot('hover settles'); assert.equal(paused.orbit.velocity, 0); assert.equal(paused.groups[1].strength, .35); assert.deepEqual(paused.buttons.map(b => b.rect), controls);
  await screenshot('desktop-hover');
  await page.mouse.move(2, 2); await page.waitForTimeout(10);
  const race = await page.evaluate(() => { const s = window.r23.useScrollStore.getState(), before = s.worksOrbit.phase; s.setWorksInteraction('Hover', null); s.setStoryPosition('finale', .000001, s.scrollProgress, true); return { before, origin: s.worksOrbit.origin, captures: s.worksOrbit.captures }; });
  assert.equal(race.before, race.origin); await snapshot('unhover immediate handoff');
  const pairs = new Map();
  for (const p of [.25, .5, .75, 1, .75, .5, .25, 0, .5, 1]) {
    await seek('finale', p); const s = await snapshot(`finale reverse ${p}`);
    assert.equal(s.orbit.origin, race.origin); assert.equal(s.orbit.captures, race.captures); assert.equal(s.orbit.latched, true);
    if (pairs.has(p)) assert.deepEqual(s.groups.map(g => g.position), pairs.get(p)); else pairs.set(p, s.groups.map(g => g.position));
    if (p === 0 || p === .5) await screenshot(`desktop-handoff-${p}`);
  }
  await seek('works', .5); const resumed = await snapshot('returned Works'); assert.equal(resumed.orbit.latched, false); assert(resumed.orbit.phase >= race.origin && resumed.orbit.phase - race.origin < .01);
  await page.locator('[data-works-choice="veris"]').focus(); await page.waitForTimeout(1800); const focused = await snapshot('keyboard focus pause'); assert.equal(focused.orbit.velocity, 0);
  await page.keyboard.press('Enter'); await snapshot('keyboard selects'); await page.keyboard.press('Escape'); const escaped = await snapshot('Escape clears'); assert.equal(escaped.selection, null); assert.equal(escaped.focus, null);
  assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-works-controls')), true, 'Escape restores focus to the stable stage');
  await page.mouse.move(3, 3); await page.waitForTimeout(300);
  for (let i = 0; i < 6; i++) await page.locator(`[data-works-choice="${['edura','vie','veris'][i % 3]}"]`).hover();
  const rapid = await snapshot('rapid hover retains phase'); assert(rapid.orbit.phase >= escaped.orbit.phase);
  await page.mouse.click(3, 500); const clear = await snapshot('background clears'); assert.equal(clear.selection, null); assert.equal(clear.hover, null); assert.equal(clear.focus, null);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(300); const reduced = await snapshot('live reduce'); await page.waitForTimeout(500); const reducedAgain = await snapshot('reduce holds'); assert.equal(reduced.orbit.phase, reducedAgain.orbit.phase); assert.equal(reduced.smoother, false);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(500); await snapshot('live normal');
  const hiddenStart = await snapshot('before hidden');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(300); const hidden = await snapshot('hidden simulated'); await page.waitForTimeout(600); const hiddenAgain = await snapshot('hidden holds'); assert.equal(hidden.orbit.phase, hiddenAgain.orbit.phase);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(100); const visible = await snapshot('visible resumes'); assert(visible.orbit.phase - hiddenStart.orbit.phase < .02, 'no hidden elapsed-time catchup');
  await seek('about', .5); const offscreen = await snapshot('offscreen'); await page.waitForTimeout(500); const offscreenAgain = await snapshot('offscreen holds'); assert.equal(offscreen.orbit.phase, offscreenAgain.orbit.phase);
  await seek('works', .95); await page.locator('#lab-hold').click();
  await page.waitForFunction(() => !window.r23.useScrollStore.getState().storyManual && !window.r23.ScrollTrigger.isRefreshing);
  await page.waitForTimeout(300); await page.mouse.move(200, 500); await page.mouse.wheel(0, 260); await page.waitForTimeout(1500);
  const scrolled = await snapshot('native Works to finale'); assert.equal(scrolled.chapter, 'finale'); assert.equal(scrolled.orbit.latched, true);
  await page.mouse.wheel(0, -260); await page.waitForTimeout(1000); const scrollBack = await snapshot('native reverse to Works'); assert.equal(scrollBack.chapter, 'works'); assert.equal(scrollBack.orbit.latched, false);
  await page.locator('#lab-hold').click(); await seek('works', .5);
  // GPU/refresh bound, measured after render; no claim about physical phones.
  for (const label of ['desktop idle', 'desktop interaction']) {
    const stream = page.evaluate(async () => { let frames = 0; const started = performance.now(), stop = window.r23.addAfterEffect(() => frames++); await new Promise(r => setTimeout(r, 1800)); stop(); return { frames, elapsedMs: performance.now() - started, fps: frames * 1000 / (performance.now() - started) }; });
    if (label.includes('interaction')) for (let i = 0; i < 9; i++) { await page.locator(`[data-works-choice="${['edura','veris','vie'][i % 3]}"]`).hover(); await page.waitForTimeout(100); }
    performanceResults.push({ label, ...await stream, configuration: await snapshot(`${label} benchmark`) });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(800); await snapshot('mobile viewport'); await screenshot('mobile-idle');
  await openDetails();
  await page.locator('#lab-language').click(); await snapshot('English reflow');
  for (const width of [320, 768, 1024, 1440]) { await page.setViewportSize({ width, height: 900 }); await page.waitForTimeout(650); await snapshot(`resize ${width}`); }
  await seek('finale', .6); const saved = await snapshot('lifecycle saved');
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const f = window.r23.fiber.getState(); window.r23.disposed = { geometries: 0, materials: 0 }; const root = f.scene.getObjectByName('works-constellations'); root.traverse(o => { if (o.geometry) o.geometry.addEventListener('dispose', () => window.r23.disposed.geometries++); if (o.material) o.material.addEventListener('dispose', () => window.r23.disposed.materials++); }); });
    await openDetails(); await page.locator('#lab-mode').click(); await page.waitForTimeout(350);
    const off = await page.evaluate(() => ({ present: Boolean(window.r23.fiber.getState().scene.getObjectByName('works-constellations')), disposed: window.r23.disposed }));
    assert.equal(off.present, false); assert.equal(off.disposed.geometries, 6); assert.equal(off.disposed.materials, 6);
    await openDetails(); await page.locator('#lab-mode').click(); await page.waitForTimeout(650); const back = await snapshot(`lifecycle ${i}`); assert.equal(back.orbit.origin, saved.orbit.origin); assert.equal(back.orbit.captures, saved.orbit.captures); lifecycle.push({ off, restored: back.memory, subscribers: back.subscribers });
  }
  await init('http://127.0.0.1:5173/3d-lab.html?story=1&chapter=contact&p=.75'); const deep = await snapshot('direct Contact'); assert.equal(deep.orbit.origin, 0); assert.equal(deep.orbit.visited, false); assert.equal(deep.orbit.captures, 1);
  await seek('finale', .3); const deepFinale = await snapshot('direct Contact reverse finale'); assert.equal(deepFinale.orbit.origin, 0);
  // Fresh touch page, native pointerType=touch.
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  await context.tracing.stop({ path: path('trace.zip') });
  await context.close(); page = await touch.newPage(); monitor(page); await init();
  await page.locator('[data-works-choice="vie"]').tap(); const tapped = await snapshot('touch selects'); assert.equal(tapped.selection, 'vie');
  await page.locator('[data-works-choice="vie"]').tap(); await page.waitForTimeout(500); const untapped = await snapshot('touch deselects/resumes'); assert.equal(untapped.selection, null); assert.equal(untapped.focus, null); assert(untapped.orbit.velocity > 0);
  await screenshot('mobile-touch');
  const mobileFps = await page.evaluate(async () => { let frames = 0; const started = performance.now(), stop = window.r23.addAfterEffect(() => frames++); await new Promise(r => setTimeout(r, 1800)); stop(); return { frames, elapsedMs: performance.now() - started, fps: frames * 1000 / (performance.now() - started) }; });
  performanceResults.push({ label: 'mobile viewport idle', ...mobileFps, configuration: await snapshot('mobile benchmark') });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await init(); const fresh = await snapshot('fresh reduced'); await page.waitForTimeout(500); const freshAgain = await snapshot('fresh reduced holds'); assert.equal(fresh.orbit.phase, 0); assert.equal(freshAgain.orbit.phase, 0);
  await page.locator('[data-works-choice="edura"]').tap();
  await page.waitForFunction(() => window.r23.fiber.getState().scene.getObjectByName('works-veris').children[1].material.uniforms.uStrength.value === .35);
  const freshSelected = await snapshot('reduced touch selects'); assert.equal(freshSelected.selection, 'edura'); assert.equal(freshSelected.groups[1].strength, .35); await screenshot('mobile-reduced');
  await page.evaluate(() => window.r23.fiber.getState().gl.getContext().getExtension('WEBGL_lose_context').loseContext()); await page.waitForTimeout(400);
  const fallback = await page.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, controlsVisible: !document.querySelector('[data-works-controls]').hidden, choices: document.querySelectorAll('[data-works-choice]').length, body: document.body.innerText }));
  assert.equal(fallback.canvas, 0); assert.equal(fallback.controlsVisible, true); assert.equal(fallback.choices, 3); results.push({ label: 'context loss fallback', ...fallback });
  assert.equal(errors.length, 0, JSON.stringify(errors));
} finally {
  writeFileSync(path('browser-results.json'), JSON.stringify({ browser: await browser.version(), results, errors, warnings: [...new Set(warnings)], performance: performanceResults, lifecycle }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ checks: results.length, errors, performance: performanceResults.map(r => [r.label, r.fps]), lifecycle }, null, 2));
