import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
mkdirSync(new URL('screenshots/', out), { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const errors = [], warnings = [], results = [], streams = [];
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
    window.r21 = { fiber: _roots.get(document.querySelector('[data-galaxy-scene] canvas')).store, addAfterEffect, ScrollSmoother, ScrollTrigger, gsap, useScrollStore, storyCameraPath, cameraPath };
  });
  await page.waitForTimeout(650);
}
const snapshot = () => page.evaluate(() => {
  const { fiber, useScrollStore, ScrollSmoother, ScrollTrigger, storyCameraPath } = window.r21;
  const state = useScrollStore.getState(), frame = fiber.getState();
  const content = document.getElementById('smooth-content'), top = content.getBoundingClientRect().top;
  const max = document.documentElement.scrollHeight - innerHeight;
  const visualY = ScrollSmoother.get()?.scrollTop() ?? scrollY;
  const sections = [...content.querySelectorAll('[data-story-chapter]')].map(el => ({ id: el.dataset.storyChapter, top: el.getBoundingClientRect().top - top }));
  sections.forEach((section, index) => { section.end = sections[index + 1]?.top ?? max; });
  const chapter = sections.filter(section => section.top <= visualY + 0.000001).at(-1);
  const expectedP = chapter ? Math.max(0, Math.min(1, (visualY - chapter.top) / (chapter.end - chapter.top))) : 0;
  const frozen = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const target = storyCameraPath(state.storyChapter, state.chapterProgress, {}, frozen, innerWidth / innerHeight);
  const camera = frame.camera.position.toArray();
  const forward = frame.camera.getWorldDirection(frame.camera.position.clone()).toArray();
  const expectedForward = [target.lookX - target.x, target.lookY - target.y, target.lookZ - target.z];
  const length = Math.hypot(...expectedForward);
  const poseError = Math.max(...camera.map((v, i) => Math.abs(v - [target.x, target.y, target.z][i])));
  const directionError = Math.max(...forward.map((v, i) => Math.abs(v - expectedForward[i] / length)));
  const bhNDC = frame.camera.position.clone().set(0, 0, -200).project(frame.camera).toArray();
  return { chapter: state.storyChapter, p: state.chapterProgress, manual: state.storyManual, raw: state.scrollProgress,
    nativeY: scrollY, visualY, max, expectedChapter: chapter?.id, expectedP, camera, target, poseError, directionError,
    radius: Math.hypot(camera[0], camera[1], camera[2] + 200), bhNDC, anchor: state.storyAnchor, sections,
    canvas: document.querySelectorAll('[data-galaxy-scene] canvas').length,
    cameraWriterPriority: frame.internal.subscribers.filter(s => s.priority === -1).length,
    subscribers: frame.internal.subscribers.length, triggerCount: ScrollTrigger.getAll().length,
    smoother: Boolean(ScrollSmoother.get()), overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
    glError: frame.gl.getContext().getError(), frozen, viewport: [innerWidth, innerHeight], locale: document.documentElement.lang };
});
function check(s, label) {
  assert.equal(s.canvas, 1, label); assert.equal(s.cameraWriterPriority, 1, label);
  assert.equal(s.glError, 0, label); assert.equal(s.overflow, 0, label);
  assert(s.camera.every(Number.isFinite) && s.radius > 1.01, label);
  assert(s.poseError < 1e-9 && s.directionError < 1e-9, `${label}: camera mismatch ${JSON.stringify(s)}`);
  if (s.chapter === 'works') assert(Math.abs(s.bhNDC[0]) > 1, `${label}: BH still in Works`);
  if (!s.manual) {
    assert.equal(s.chapter, s.expectedChapter, label);
    assert(Math.abs(s.p - s.expectedP) < 1e-6, label);
    assert(Math.abs(s.raw - s.visualY / s.max) < 1e-6, label);
  }
  results.push({ label, ...s });
}
async function pose(chapter, p, label, screenshot) {
  await page.selectOption('#lab-chapter', chapter);
  await page.locator(`[data-pose="${p}"]`).click();
  await page.waitForTimeout(650);
  const s = await snapshot(); check(s, label);
  assert.equal(s.chapter, chapter); assert.equal(s.p, p); assert(s.manual);
  const bounds = s.sections.find(item => item.id === chapter);
  assert(Math.abs(s.visualY - (bounds.top + (bounds.end - bounds.top) * p)) < 1, label);
  if (screenshot) await page.screenshot({ path: new URL(`screenshots/${screenshot}.png`, out).pathname.replace(/^\/(\w:)/, '$1') });
  return s;
}
try {
  await init('http://127.0.0.1:5173/3d-lab.html?story=1');
  check(await snapshot(), 'initial Hero');
  for (const chapter of ['hero', 'portal', 'about', 'works', 'contact']) await pose(chapter, 0.5, `five chapters / ${chapter}`, chapter);
  for (const chapter of ['portal', 'finale']) {
    const forward = [];
    for (const p of [0, .25, .5, .75, 1]) forward.push(await pose(chapter, p, `${chapter} forward ${p}`));
    for (const [index, p] of [1, .75, .5, .25, 0].entries()) {
      const reverse = await pose(chapter, p, `${chapter} reverse ${p}`);
      assert.deepEqual(reverse.camera, forward[4 - index].camera);
    }
  }
  await pose('portal', .5, 'manual hold start');
  const held = await snapshot();
  await page.mouse.move(2, 2); await page.mouse.wheel(0, 900); await page.waitForTimeout(1200);
  const still = await snapshot(); check(still, 'manual wheel / pointer held');
  assert.equal(still.p, held.p); assert.deepEqual(still.camera, held.camera);
  await page.locator('#lab-hold').click(); await page.waitForTimeout(300);
  const resumed = await snapshot(); check(resumed, 'resume synced DOM'); assert(!resumed.manual);
  // Sample after Fiber has rendered: store/camera/scene share the same visible position.
  const sample = page.evaluate(async () => {
    const { fiber, addAfterEffect, ScrollSmoother, useScrollStore, storyCameraPath } = window.r21;
    const samples = [], target = {};
    return new Promise(resolve => {
      const stop = addAfterEffect(() => {
        const s = useScrollStore.getState(), f = fiber.getState();
        const y = ScrollSmoother.get()?.scrollTop() ?? scrollY;
        storyCameraPath(s.storyChapter, s.chapterProgress, target, false, innerWidth / innerHeight);
        samples.push({ chapter: s.storyChapter, p: s.chapterProgress, nativeY: scrollY, visualY: y, rawError: Math.abs(s.scrollProgress - y / (document.documentElement.scrollHeight - innerHeight)), poseError: Math.max(Math.abs(f.camera.position.x - target.x), Math.abs(f.camera.position.y - target.y), Math.abs(f.camera.position.z - target.z)) });
      });
      setTimeout(() => { stop(); resolve(samples); }, 1800);
    });
  });
  await page.mouse.wheel(0, 800);
  streams.push({ label: 'visible smoother wheel / settling', samples: await sample });
  assert(streams[0].samples.length > 20);
  assert(streams[0].samples.every(s => s.poseError < 1e-9 && s.rawError < 1e-6));
  assert(streams[0].samples.some(s => Math.abs(s.nativeY - s.visualY) > 1));
  await pose('finale', .75, 'resize start');
  for (const width of [390, 320, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 }); await page.waitForTimeout(750);
    let s = await snapshot(); check(s, `resize ${width}`); assert.equal(s.chapter, 'finale'); assert.equal(s.p, .75);
    await page.locator('details').evaluate(el => { el.open = true; });
    await page.locator('#lab-language').click(); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(650);
    s = await snapshot(); check(s, `locale resize ${width}`); assert.equal(s.chapter, 'finale'); assert.equal(s.p, .75);
    await page.locator('details').evaluate(el => { el.open = false; });
    if (width !== 1440) await page.screenshot({ path: new URL(`screenshots/finale-${width}.png`, out).pathname.replace(/^\/(\w:)/, '$1') });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(750);
  check(await snapshot(), 'live reduced / finale');
  for (const chapter of ['hero', 'portal', 'about', 'works', 'contact']) await pose(chapter, .5, `reduced ${chapter}`);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(650);
  const lifecycle = [];
  for (let cycle = 1; cycle <= 3; cycle++) {
    await page.locator('details').evaluate(el => { el.open = true; });
    await page.locator('#lab-mode').click(); await page.waitForTimeout(200);
    await page.locator('#lab-mode').click(); await page.waitForTimeout(650);
    await pose('portal', .25, `mode lifecycle ${cycle}`);
    const s = await snapshot(); lifecycle.push([s.subscribers, s.triggerCount, s.cameraWriterPriority]);
  }
  assert(lifecycle.every(s => JSON.stringify(s) === JSON.stringify(lifecycle[0])), 'mode lifecycle resources stable');
  await init('http://127.0.0.1:5173/3d-lab.html?story=1&chapter=contact&p=.75');
  const direct = await snapshot(); check(direct, 'fresh direct Contact'); assert.equal(direct.chapter, 'contact'); assert.equal(direct.p, .75);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await init('http://127.0.0.1:5173/3d-lab.html?story=1&chapter=portal&p=.25');
  const reduced = await snapshot(); check(reduced, 'fresh reduced direct Portal'); assert.equal(reduced.chapter, 'portal'); assert.equal(reduced.p, .25);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.close();
  page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
  await init('http://127.0.0.1:5173/');
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.waitForTimeout(1000);
  const legacy = await page.evaluate(() => {
    const { fiber, useScrollStore, cameraPath } = window.r21;
    const s = useScrollStore.getState(), f = fiber.getState(), p = cameraPath(s.scrollProgress + (1 - s.scrollProgress) * s.contactProgress);
    return { camera: f.camera.position.toArray(), desired: [p.x, p.y, p.z - 2 * s.contactProgress], canvas: document.querySelectorAll('[data-galaxy-scene] canvas').length, content: document.querySelectorAll('section[id]').length };
  });
  assert.equal(legacy.canvas, 1); assert(legacy.camera.every((v, i) => Math.abs(v - legacy.desired[i]) < .01));
  results.push({ label: 'production default Hero smoke', ...legacy });
  await page.evaluate(() => { const el = document.getElementById('transmission'); window.r21.ScrollSmoother.get()?.scrollTo(el, false, 'top top'); });
  await page.waitForTimeout(1700);
  const contact = await page.evaluate(() => {
    const { fiber, useScrollStore, cameraPath } = window.r21;
    const s = useScrollStore.getState(), f = fiber.getState(), p = cameraPath(s.scrollProgress + (1 - s.scrollProgress) * s.contactProgress);
    return { camera: f.camera.position.toArray(), desired: [p.x, p.y, p.z - 2 * s.contactProgress], canvas: document.querySelectorAll('[data-galaxy-scene] canvas').length, contact: s.contactProgress, storyManual: s.storyManual };
  });
  assert.equal(contact.canvas, 1); assert(contact.camera.every((v, i) => Math.abs(v - contact.desired[i]) < .01));
  results.push({ label: 'production default Contact smoke', ...contact });
  assert.equal(errors.length, 0, JSON.stringify(errors));
} finally {
  writeFileSync(new URL('browser-results.json', out), JSON.stringify({ checkedAt: new Date().toISOString(), browser: await browser.version(), device: 'isolated Edge headless on development PC; viewport simulation', errors, warnings: [...new Set(warnings)], results, streams }, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ poses: results.length, streamSamples: streams.map(s => s.samples.length), errors, warnings: [...new Set(warnings)] }, null, 2));
