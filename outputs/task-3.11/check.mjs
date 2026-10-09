import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { cameraPath } from '../../src/3d/utils/cameraPath.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^\uFEFF/, '');
const baseline = JSON.parse(read('./source-baseline.json'));
for (const path of ['src/stores/useScrollStore.js', 'src/components/Hero.jsx', 'src/App.jsx', 'src/3d/components/BlackHole.jsx', 'src/3d/components/BlackHoleSystem.jsx', 'src/3d/GalaxyScene.jsx', 'src/3d/hooks/useSectionAnchor.js']) assert.equal(read(`../../${path}`), baseline[path], `${path} protected`);
assert.deepEqual(JSON.parse(JSON.stringify(cameraPath(0))), { x: 0, y: 2.2, z: -168, lookX: 0, lookY: 0, parallax: 0.35 });
assert(Math.abs(cameraPath(1).x + 3.5) < 1e-12); assert.equal(cameraPath(1).z, -191);
const output = {};
for (let index = 0; index <= 1000; index++) {
  const p = index / 1000, approach = p * p * (3 - 2 * p);
  assert.equal(cameraPath(p, output), output);
  assert.deepEqual(output, { x: -Math.sin(p * Math.PI * 5) * 2.2 * (1 - 0.6 * p) - 3.5 * approach, y: 2.2 * (1 - approach) + 0.18 * approach, z: -168 - 23 * approach, lookX: -4.5 * approach, lookY: -0.45 * approach, parallax: 0.35 * (1 - approach) });
}
console.log('PASS: store architecture/Hero/App/3D pieces/compositor protected, original route endpoints');

if (process.argv.includes('--browser') || process.argv.includes('--baseline')) {
  const baselineMode = process.argv.includes('--baseline');
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [], warnings = [], poses = [], streams = [], fps = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), null, { polling: 50 }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(100);
    await page.evaluate(async () => {
      const urls = performance.getEntriesByType('resource').map((entry) => entry.name), loaded = (name) => urls.filter((url) => url.includes(name)).at(-1);
      const { _roots, addAfterEffect } = await import(loaded('/@react-three_fiber.js'));
      const { ScrollSmoother, ScrollTrigger, gsap } = await import(loaded('/src/hooks/useGSAPSetup.js'));
      const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
      const { cameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
      window.task311 = { fiber: _roots.get(document.querySelector('[data-galaxy-scene] canvas')).store, addAfterEffect, ScrollSmoother, ScrollTrigger, gsap, useScrollStore, cameraPath };
    });
    const snapshot = () => page.evaluate(() => {
      const { fiber, ScrollSmoother, ScrollTrigger, gsap, useScrollStore, cameraPath } = window.task311;
      const state = fiber.getState(), store = useScrollStore.getState(), smoother = ScrollSmoother.get(), max = document.documentElement.scrollHeight - innerHeight;
      const visualY = smoother?.scrollTop() ?? scrollY, contentTop = document.getElementById('smooth-content').getBoundingClientRect().top;
      const markers = [...document.querySelectorAll('#smooth-content section[id], #smooth-content footer[id]')].map((element) => ({ id: element.id, top: element.getBoundingClientRect().top - contentTop }));
      const expectedSection = markers.filter((marker) => marker.top <= visualY + innerHeight * 0.35).at(-1)?.id ?? 'hero';
      const route = cameraPath(store.scrollProgress + (1 - store.scrollProgress) * store.contactProgress);
      const anchors = [['about-planet', '[data-planet-window]'], ['orbital-skills', '[data-orbit-window]']].flatMap(([name, selector]) => {
        const model = state.scene.getObjectByName(name), rect = document.querySelector(selector).getBoundingClientRect();
        if (!model?.visible) return [];
        state.camera.updateMatrixWorld(); const center = model.position.clone().project(state.camera);
        const x = (center.x + 1) * innerWidth / 2, y = (1 - center.y) * innerHeight / 2;
        return [{ name, x, y, error: Math.hypot(x - rect.left - rect.width / 2, y - rect.top - rect.height / 2), visible: model.visible }];
      });
      const gl = state.gl.getContext(), program = state.gl.info.programs.find((program) => program.getUniforms().map.uDiskIntensity), uniform = program?.getUniforms().map.uDiskIntensity;
      return { nativeY: scrollY, visualY, max, progress: store.scrollProgress, expectedProgress: max > 0 ? visualY / max : 0,
        section: store.currentSection, expectedSection, contactProgress: store.contactProgress, markers,
        camera: state.camera.position.toArray(), desired: [route.x, route.y, route.z - 2 * store.contactProgress], anchors,
        intensity: uniform ? gl.getUniform(program.program, uniform.addr) : null,
        contactTrigger: (() => { const trigger = ScrollTrigger.getById('contact-approach'); return trigger && { start: trigger.start, end: trigger.end }; })(),
        introLabels: gsap.getById('hero-intro')?.labels, canvas: document.querySelectorAll('[data-galaxy-scene] canvas').length,
        subscriptions: state.internal.subscribers.length, priorities: state.internal.subscribers.map((subscriber) => subscriber.priority),
        geometries: state.gl.info.memory.geometries, textures: state.gl.info.memory.textures, glError: gl.getError() };
    });
    const at = async (selector, offset = 100) => {
      await page.evaluate(({ selector, offset }) => { const element = document.querySelector(selector), smoother = window.task311.ScrollSmoother.get(); scrollTo(0, (smoother?.offset(element, 'top top') ?? element.getBoundingClientRect().top + scrollY) - offset); }, { selector, offset });
      await page.waitForTimeout(1800); return snapshot();
    };
    const check = (pose) => {
      assert(Math.abs(pose.progress - pose.expectedProgress) < 0.00001, JSON.stringify(pose));
      assert.equal(pose.section, pose.expectedSection); assert.equal(pose.canvas, 1); assert.equal(pose.glError, 0);
      assert(pose.anchors.every((anchor) => anchor.error < 2), JSON.stringify(pose.anchors));
    };
    const stream = async (label, wheel, sizes = []) => {
      const sample = page.evaluate(async () => {
        const { fiber, addAfterEffect, useScrollStore, ScrollSmoother } = window.task311;
        const content = document.getElementById('smooth-content'), markers = [...content.querySelectorAll('section[id], footer[id]')].map((element) => ({ id: element.id, top: element.getBoundingClientRect().top - content.getBoundingClientRect().top }));
        let frames = 0, maxError = 0, sectionMismatch = 0, leadPx = 0, maxAnchorError = 0, anchorFrames = 0;
        const start = performance.now();
        // Observe after anchor callbacks and rendering, including models mounted mid-scroll.
        const unsubscribe = addAfterEffect(() => {
          const state = fiber.getState();
          frames++; const store = useScrollStore.getState(), visual = ScrollSmoother.get()?.scrollTop() ?? scrollY;
          const max = document.documentElement.scrollHeight - innerHeight;
          maxError = Math.max(maxError, Math.abs(store.scrollProgress - visual / max)); leadPx = Math.max(leadPx, Math.abs(scrollY - visual));
          const expected = markers.filter((marker) => marker.top <= visual + innerHeight * 0.35).at(-1)?.id ?? 'hero'; if (store.currentSection !== expected) sectionMismatch++;
          for (const [name, selector] of [['about-planet', '[data-planet-window]'], ['orbital-skills', '[data-orbit-window]']]) {
            const model = state.scene.getObjectByName(name); if (!model?.visible) continue;
            const rect = document.querySelector(selector).getBoundingClientRect(); state.camera.updateMatrixWorld(); const center = model.position.clone().project(state.camera);
            maxAnchorError = Math.max(maxAnchorError, Math.hypot((center.x + 1) * innerWidth / 2 - rect.left - rect.width / 2, (1 - center.y) * innerHeight / 2 - rect.top - rect.height / 2)); anchorFrames++;
          }
        });
        try { await new Promise((resolve) => setTimeout(resolve, 2800)); return { frames, fps: frames * 1000 / (performance.now() - start), maxError, sectionMismatch, leadPx, maxAnchorError, anchorFrames }; }
        finally { unsubscribe(); }
      });
      for (const delta of wheel) { await page.mouse.wheel(0, delta); await page.waitForTimeout(160); }
      for (const width of sizes) { await page.setViewportSize({ width, height: 1000 }); await page.waitForTimeout(250); }
      const result = await sample; streams.push({ label, ...result });
      if (!baselineMode) { assert(result.maxError < 0.00001, JSON.stringify(result)); assert.equal(result.sectionMismatch, 0); assert(result.maxAnchorError < 2, JSON.stringify(result)); assert(result.fps > 120); }
    };
    const hero = await snapshot(); poses.push({ label: 'hero', pose: hero }); assert.equal(hero.introLabels.name, 1.5); assert.equal(hero.introLabels.tagline, 2); assert.equal(hero.introLabels.indicator, 2.5);
    await page.waitForTimeout(3500);
    await stream('hero-about-fast', [900, 500, 400]);
    for (const selector of ['#about', '[data-planet-window]', '#skills', '[data-orbit-window]', '#education', '#experience', '#work', '#playground', '#transmission']) {
      const pose = await at(selector); poses.push({ label: selector, pose }); if (!baselineMode) check(pose);
    }
    const end = await snapshot(), trigger = end.contactTrigger;
    for (const fraction of [0, 0.5, 1]) {
      await page.evaluate((y) => scrollTo(0, y), trigger.start + (trigger.end - trigger.start) * fraction); await page.waitForTimeout(2000);
      const pose = await snapshot(); poses.push({ label: `contact-${fraction}`, pose });
      if (!baselineMode) { check(pose); assert(Math.abs(pose.contactProgress - fraction) < 0.002); assert(Math.abs(pose.intensity - 1 - 0.45 * fraction) < 0.002); if (fraction === 1) assert(Math.hypot(...pose.camera.map((value, index) => value - [-3.5, 0.18, -193][index])) < 0.03); }
    }
    await at('[data-orbit-window]', 450); await stream('skills-reverse', [-250, 150, -550, 400]);
    await at('[data-planet-window]', 450); await stream('about-reverse', [-200, 150, -350, 300]);
    if (!baselineMode) {
      for (const width of [768, 320, 1920, 1440]) { await page.setViewportSize({ width, height: 1000 }); await page.waitForTimeout(650); for (const selector of ['[data-planet-window]', '[data-orbit-window]', '#transmission']) { const pose = await at(selector, 450); check(pose); poses.push({ label: `${selector}-${width}`, pose }); } }
      await at('[data-planet-window]', 450); await stream('about-live-resize', [], [1280, 1024, 1440]);
      for (let cycle = 0; cycle < 3; cycle++) { await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(900); await at('#transmission'); const pose = await snapshot(); check(pose); assert.deepEqual(pose.camera, [-3.5 - Math.sin(Math.PI * 5) * 0.88, 0.18, -193]); poses.push({ label: `reduced-${cycle}`, pose }); await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(1000); const resumed = await at('[data-planet-window]', 450); check(resumed); }
      await at('#transmission'); await page.screenshot({ path: 'outputs/task-3.11/contact-final.png' });
      await at('[data-orbit-window]', 450); await page.screenshot({ path: 'outputs/task-3.11/skills-final.png' });
      await at('[data-planet-window]', 450); await page.screenshot({ path: 'outputs/task-3.11/about-final.png' });
    }
    assert.deepEqual(errors, []);
    console.log(`${baselineMode ? 'BASELINE' : 'PASS'}: ${poses.length} poses, ${streams.map((result) => `${result.label}:error${result.maxError.toFixed(5)}/section${result.sectionMismatch}/anchor${result.maxAnchorError.toFixed(2)}px/${result.fps.toFixed(1)}fps`).join('; ')}, 0 errors`);
  } finally { writeFileSync(new URL(baselineMode ? './browser-baseline.json' : './browser-results.json', import.meta.url), JSON.stringify({ poses, streams, fps, errors, warnings: [...new Set(warnings)] }, null, 2)); await browser.close(); }
}
