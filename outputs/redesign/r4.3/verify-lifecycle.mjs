// Existing fixture mounts the real production App in StrictMode; no copied scene.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const results = [], errors = [], warnings = []; let status = 'running';
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
try {
  await page.goto('http://127.0.0.1:5173/outputs/redesign/r4.2/lifecycle.html#education');
  await page.waitForSelector('[data-education-item]'); await page.waitForTimeout(3200);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(item => item.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots } = await import(loaded('/@react-three_fiber.js'));
    const { useEducationStore } = await import(loaded('/src/stores/useEducationStore.js'));
    const { useSkillsStore } = await import(loaded('/src/stores/useSkillsStore.js'));
    const { ScrollSmoother, ScrollTrigger } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    window.qa = { roots: _roots, useEducationStore, useSkillsStore, ScrollSmoother, ScrollTrigger };
  });
  for (let cycle = 0; cycle < 3; cycle++) {
    if (cycle) { await page.evaluate(() => window.mountApp()); await page.waitForTimeout(1300); }
    await page.evaluate(() => { location.hash = 'skills'; location.hash = 'education'; }); await page.waitForTimeout(250);
    await page.locator('[data-education-item="saigonUniversity"]').hover(); await page.waitForTimeout(1600);
    const mounted = await page.evaluate(() => {
      const f = window.qa.roots.get(document.querySelector('canvas')).store.getState(), root = f.scene.getObjectByName('symbol-stars');
      const geometries = new Set(), materials = new Set(), textures = new Set();
      root.traverse(object => { if (object.geometry) geometries.add(object.geometry); if (object.material) { materials.add(object.material); if (object.material.map) textures.add(object.material.map); } });
      const disposed = { geometries: 0, materials: 0, textures: 0 };
      for (const [name, items] of Object.entries({ geometries, materials, textures })) for (const item of items) item.addEventListener('dispose', () => disposed[name]++);
      window.qa.resources = { f, pool: root.userData.pool, geometries, materials, textures, disposed, position: root.getObjectByName('symbol-pool').geometry.attributes.position };
      const state = window.qa.useEducationStore.getState();
      return { counts: { geometries: geometries.size, materials: materials.size, textures: textures.size }, memory: { ...f.gl.info.memory }, subscribers: f.internal.subscribers.length, canvas: document.querySelectorAll('canvas').length, poolTarget: root.userData.pool.target?.id, target: state.focus ?? state.selection ?? state.hover, triggers: window.qa.ScrollTrigger.getAll().length };
    });
    assert.deepEqual(mounted.counts, { geometries: 3, materials: 11, textures: 9 }); assert.equal(mounted.canvas, 1); assert.equal(mounted.poolTarget, 'saigonUniversity');
    await page.mouse.move(2, 80); await page.evaluate(() => { location.hash = 'experience'; }); await page.waitForTimeout(300);
    const outside = await page.evaluate(() => {
      const r = window.qa.resources, state = window.qa.useEducationStore.getState();
      return { target: r.pool.target?.id ?? null, active: r.f.scene.getObjectByName('symbol-stars').visible, channels: [state.hover, state.focus, state.selection], version: r.position.version, baseError: [...r.pool.positions].reduce((max, value, i) => Math.max(max, Math.abs(value - r.pool.base[i])), 0) };
    });
    assert.equal(outside.target, null); assert.equal(outside.active, false); assert.equal(outside.baseError, 0); assert.deepEqual(outside.channels, [null, null, null]);
    await page.waitForTimeout(300); assert.equal(await page.evaluate(() => window.qa.resources.position.version), outside.version);
    await page.evaluate(() => window.unmountApp()); await page.waitForTimeout(650);
    const unmounted = await page.evaluate(() => {
      const r = window.qa.resources, education = window.qa.useEducationStore.getState(), skills = window.qa.useSkillsStore.getState();
      return { disposed: r.disposed, canvas: document.querySelectorAll('canvas').length, subscribers: r.f.internal.subscribers.length, triggers: window.qa.ScrollTrigger.getAll().length, smoother: Boolean(window.qa.ScrollSmoother.get()), education: { hover: education.hover, focus: education.focus, selection: education.selection, visible: education.visible }, skills: { hover: skills.hover, focus: skills.focus, selection: skills.selection, visible: skills.visible } };
    });
    assert.equal(unmounted.canvas, 0); assert.equal(unmounted.subscribers, 0); assert.equal(unmounted.triggers, 0); assert.equal(unmounted.smoother, false);
    for (const state of [unmounted.education, unmounted.skills]) assert.deepEqual(state, { hover: null, focus: null, selection: null, visible: false });
    assert(unmounted.disposed.geometries >= 3); assert(unmounted.disposed.materials >= 11); assert(unmounted.disposed.textures >= 9); results.push({ cycle, mounted, outside, unmounted });
  }
  await page.evaluate(() => window.mountApp()); await page.waitForTimeout(1400); await page.evaluate(() => { location.hash = 'skills'; location.hash = 'education'; }); await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForSelector('[data-scene-fallback]'); await page.waitForTimeout(200);
  await page.locator('[data-education-item="saigonUniversity"]').focus(); await page.keyboard.press('Enter');
  const fallback = await page.evaluate(() => ({ canvas: document.querySelectorAll('canvas').length, count: document.querySelectorAll('[data-education-item]').length, text: document.querySelector('#education').innerText, focus: document.activeElement.dataset.educationItem, background: getComputedStyle(document.querySelector('[data-scene-fallback]')).backgroundColor }));
  assert.equal(fallback.canvas, 0); assert.equal(fallback.count, 3); assert.equal(fallback.focus, 'saigonUniversity'); assert.equal(fallback.background, 'rgb(5, 5, 5)'); results.push({ fallback });
  await page.screenshot({ path: 'outputs/redesign/r4.3/screenshots/fallback.png' }); assert.deepEqual(errors, []); status = 'pass'; console.log('PASS Education lifecycle3/fallback');
} catch (error) { status = 'fail'; throw error; }
finally { writeFileSync('outputs/redesign/r4.3/lifecycle-verification.json', JSON.stringify({ status, results, errors, warnings: [...new Set(warnings)] }, null, 2)); await browser.close(); }
