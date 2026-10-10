import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';

const output = 'outputs/visual-revision-2026-10-09/v6/check-lifecycle-results.json';
const results = { checks: [], lifecycle: [], consoleErrors: [], warnings: [], limitations: ['document.hidden is simulated, not a real OS/tab visibility toggle.', 'Fixture uses the production GalaxyScene/StoryMeteor/Experience but does not mount the full App.'] };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', error => results.consoleErrors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') results.consoleErrors.push(message.text());
  if (message.type() === 'warning') results.warnings.push(message.text());
});
await page.addInitScript(() => {
  const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
  const visibility = new Set();
  document.addEventListener = function(type, callback, options) { if (type === 'visibilitychange') visibility.add(callback); return add(type, callback, options); };
  document.removeEventListener = function(type, callback, options) { if (type === 'visibilitychange') visibility.delete(callback); return remove(type, callback, options); };
  window.v6VisibilityListeners = () => visibility.size;
});
function check(name, pass, detail) { results.checks.push({ name, pass: !!pass, detail }); if (!pass) console.error('FAIL', name, detail); }

try {
  await page.goto('http://127.0.0.1:5183/outputs/visual-revision-2026-10-09/v6/fixture.html');
  await page.waitForSelector('[data-meteor-label]');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(entry => entry.name);
    const loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots } = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const original = useScrollStore.subscribe;
    let storeSubscribers = 0;
    useScrollStore.subscribe = callback => { storeSubscribers++; const unsubscribe = original(callback); let active = true; return () => { if (active) storeSubscribers--; active = false; unsubscribe(); }; };
    window.v6qa = { roots: _roots, store: useScrollStore, storeSubscribers: () => storeSubscribers, fiber: null, frames: 0, disposed: { geometry: [], material: [] } };
    v6qa.attach = () => {
      const fiber = _roots.get(document.querySelector('canvas')).store;
      v6qa.fiber = fiber;
      const state = fiber.getState(), root = state.scene.getObjectByName('story-meteor');
      const geometry = [...new Set(root.children.map(mesh => mesh.geometry))], material = [...new Set(root.children.map(mesh => mesh.material))];
      v6qa.disposed = { geometry: [], material: [] }; v6qa.frames = 0;
      for (const item of geometry) item.addEventListener('dispose', () => v6qa.disposed.geometry.push(item.uuid));
      for (const item of material) item.addEventListener('dispose', () => v6qa.disposed.material.push(item.uuid));
      const render = state.gl.render;
      state.gl.render = function(scene, camera) { v6qa.frames++; return render.call(this, scene, camera); };
      return { geometry: geometry.length, material: material.length, subscribers: state.internal.subscribers.length, visibilityListeners: v6VisibilityListeners(), canvas: document.querySelectorAll('canvas').length };
    };
    v6qa.snapshot = () => {
      const state = v6qa.fiber.getState(), root = state.scene.getObjectByName('story-meteor');
      return { visible: root.visible, version: root.children[0].geometry.attributes.position.version, frames: v6qa.frames, frameloop: state.frameloop, subscribers: state.internal.subscribers.length, visibilityListeners: v6VisibilityListeners(), labels: [...document.querySelectorAll('[data-meteor-label]')].map(label => ({ text: label.textContent, opacity: getComputedStyle(label).opacity })), wakes: [...document.querySelectorAll('[data-meteor-wake]')].map(wake => +getComputedStyle(wake).opacity) };
    };
    useScrollStore.getState().setStoryPosition('experience', .3, 0, true);
  });
  await page.waitForTimeout(200);
  const initial = await page.evaluate(() => v6qa.attach());
  check('single canvas / two unique geometry / three unique materials', initial.canvas === 1 && initial.geometry === 2 && initial.material === 3, initial);

  for (let cycle = 1; cycle <= 3; cycle++) {
    await page.evaluate(() => v6qa.store.getState().setStoryPosition('experience', .3, 0, true));
    await page.waitForTimeout(120);
    const alive = await page.evaluate(() => v6qa.snapshot());
    check(`lifecycle ${cycle}: render active and subscriber count stable`, alive.visible && alive.subscribers === initial.subscribers && alive.visibilityListeners === initial.visibilityListeners, alive);
    await page.evaluate(() => v6Mount(false));
    await page.waitForSelector('canvas', { state: 'detached' });
    await page.waitForTimeout(450);
    const disposed = await page.evaluate(() => ({ geometry: [...new Set(v6qa.disposed.geometry)].length, material: [...new Set(v6qa.disposed.material)].length, subscribers: v6qa.fiber.getState().internal.subscribers.length, visibilityListeners: v6VisibilityListeners(), labels: document.querySelectorAll('[data-meteor-label]').length }));
    check(`lifecycle ${cycle}: all V6 resources disposed / subscriptions removed`, disposed.geometry === 2 && disposed.material === 3 && disposed.subscribers === 0 && disposed.labels === 3, disposed);
    results.lifecycle.push({ cycle, alive, disposed });
    await page.evaluate(() => v6Mount(true));
    await page.waitForSelector('canvas');
    await page.waitForTimeout(700);
    const next = await page.evaluate(() => v6qa.attach());
    check(`lifecycle ${cycle}: remount keeps resource and subscriber counts`, next.geometry === 2 && next.material === 3 && next.subscribers === initial.subscribers && next.visibilityListeners === initial.visibilityListeners, next);
  }

  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(200);
  const hiddenStart = await page.evaluate(() => v6qa.snapshot());
  await page.waitForTimeout(450);
  const hiddenEnd = await page.evaluate(() => v6qa.snapshot());
  check('hidden simulation: never loop, zero render calls, geometry held, wake off', hiddenStart.frameloop === 'never' && hiddenEnd.frames === hiddenStart.frames && hiddenEnd.version === hiddenStart.version && hiddenEnd.wakes.every(value => value === 0), { hiddenStart, hiddenEnd });
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(250);
  const resumed = await page.evaluate(() => v6qa.snapshot());
  check('visible resume: always loop and meteor resumes', resumed.frameloop === 'always' && resumed.frames > hiddenEnd.frames && resumed.visible, resumed);

  await page.evaluate(() => v6qa.store.getState().setStoryPosition('works', .4, .6, true));
  await page.waitForTimeout(120);
  const offStart = await page.evaluate(() => v6qa.snapshot());
  await page.waitForTimeout(300);
  const offEnd = await page.evaluate(() => v6qa.snapshot());
  check('offscreen Works: meteor hidden, no buffer uploads, wakes off', !offEnd.visible && offEnd.version === offStart.version && offEnd.wakes.every(value => value === 0), { offStart, offEnd });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => v6qa.store.getState().setStoryPosition('experience', .3, 0, true));
  await page.waitForTimeout(250);
  const reducedStart = await page.evaluate(() => v6qa.snapshot());
  await page.waitForTimeout(300);
  const reducedEnd = await page.evaluate(() => v6qa.snapshot());
  check('reduced motion: meteor hidden, buffers held, wakes off, three full labels', !reducedEnd.visible && reducedEnd.version === reducedStart.version && reducedEnd.wakes.every(value => value === 0) && reducedEnd.labels.length === 3 && reducedEnd.labels.every(label => label.opacity === '1' && label.text.length > 0), { reducedStart, reducedEnd });
  for (let index = 0; index < 3; index++) { await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(100); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(100); }
  const reducedSubscribers = await page.evaluate(() => ({ store: v6qa.storeSubscribers(), visibility: v6VisibilityListeners(), fiber: v6qa.fiber.getState().internal.subscribers.length }));
  check('three live reduced-motion cycles: Experience store subscription does not accumulate', reducedSubscribers.store === 1 && reducedSubscribers.visibility === reducedEnd.visibilityListeners && reducedSubscribers.fiber === reducedEnd.subscribers, reducedSubscribers);

  const loss = await page.evaluate(() => { const gl = v6qa.fiber.getState().gl.getContext(), ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); return !!ext; });
  if (loss) {
    await page.waitForSelector('[data-galaxy-scene] > [data-scene-fallback]');
    await page.waitForTimeout(350);
    const fallback = await page.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, background: getComputedStyle(document.querySelector('[data-scene-fallback]')).backgroundColor, labels: [...document.querySelectorAll('[data-meteor-label]')].map(label => label.textContent), wakes: [...document.querySelectorAll('[data-meteor-wake]')].map(wake => +getComputedStyle(wake).opacity), store: v6qa.store.getState().sceneFallback, disposed: { geometry: [...new Set(v6qa.disposed.geometry)].length, material: [...new Set(v6qa.disposed.material)].length } }));
    check('actual WebGL context loss: static #050505 fallback / full DOM / V6 disposed', fallback.canvas === 0 && fallback.background === 'rgb(5, 5, 5)' && fallback.labels.length === 3 && fallback.labels.every(text => text.length > 0) && fallback.store && fallback.disposed.geometry === 2 && fallback.disposed.material === 3, fallback);
  } else { results.limitations.push('WEBGL_lose_context unavailable; context-loss test could not run.'); check('context-loss extension available', false, loss); }
  check('no runtime console errors', results.consoleErrors.length === 0, results.consoleErrors);
} catch (error) { results.error = error.stack; check('harness completed', false, error.message); }
finally { await browser.close(); results.passed = results.checks.filter(check => check.pass).length; results.total = results.checks.length; writeFileSync(output, JSON.stringify(results, null, 2)); console.log(JSON.stringify({ passed: results.passed, total: results.total, error: results.error, warnings: results.warnings }, null, 2)); if (results.checks.some(check => !check.pass)) process.exitCode = 1; }
