import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { QUALITY, RAY_QUALITY } from '../../src/3d/quality.js';

const baselineMode = process.argv.includes('--baseline');
const baseline = JSON.parse(readFileSync(new URL('./source-baseline.json', import.meta.url), 'utf8'));
for (const path of ['src/components/Hero.jsx', 'src/3d/components/CameraRig.jsx', 'src/3d/hooks/useScrollProgress.js', 'src/stores/useScrollStore.js', 'src/3d/components/StarField.jsx', 'src/3d/components/Nebula.jsx', 'src/3d/shaders/blackHole.js', 'src/3d/hooks/useSectionAnchor.js']) assert.equal(readFileSync(path, 'utf8'), baseline[path], `${path} protected`);
if (!baselineMode) assert.deepEqual(QUALITY, { high: 24000, medium: 4000, low: 1500 });
assert.deepEqual(RAY_QUALITY, { high: { steps: 192, step: 0.09, resolution: 0.85, maxResolution: 1280 }, medium: { steps: 160, step: 0.11, resolution: 0.8, maxResolution: 1024 }, low: { steps: 128, step: 0.14, resolution: 0.75, maxResolution: 768 } });
const localeKeys = (object) => Object.entries(object).flatMap(([key, value]) => typeof value === 'object' ? localeKeys(value).map((child) => `${key}.${child}`) : [key]).sort();
const locale = (language) => JSON.parse(readFileSync(`src/i18n/locales/${language}/lab.json`, 'utf8'));
assert.deepEqual(localeKeys(locale('vi')), localeKeys(locale('en')));
assert.equal(localeKeys(locale('vi')).length, 29);
console.log('PASS: protected Hero/camera/store/anchor/shaders, original ray tiers');

if (process.argv.includes('--browser') || baselineMode) {
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const results = [], errors = [], warnings = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
    const load = async (url = 'http://127.0.0.1:5173/') => {
      await page.goto(url); await page.waitForFunction(() => document.querySelector('[data-galaxy-scene] canvas') && !document.body.classList.contains('loading-lock')); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
      await page.evaluate(async () => {
        const urls = performance.getEntriesByType('resource').map((entry) => entry.name), loaded = (name) => urls.filter((url) => url.includes(name)).at(-1);
        const { _roots, addAfterEffect } = await import(loaded('/@react-three_fiber.js'));
        const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
        const gsapUrl = loaded('/src/hooks/useGSAPSetup.js');
        window.task312 = { root: _roots.get(document.querySelector('[data-galaxy-scene] canvas')), addAfterEffect, useScrollStore, ScrollSmoother: gsapUrl ? (await import(gsapUrl)).ScrollSmoother : null };
      });
    };
    const snapshot = () => page.evaluate(() => {
      const { root, useScrollStore, ScrollSmoother } = window.task312, state = root.store.getState();
      const tree = [];
      const walk = (node) => { if (!node) return; const name = node.type?.name ?? node.type?.render?.name ?? node.type?.type?.name; if (['StarField', 'PlanetModel', 'Orbit', 'BlackHoleSystem', 'SelectiveBloom', 'ChromaticAberration'].includes(name)) { const { quality, count, intensity } = node.memoizedProps ?? {}; tree.push({ name, quality, count, intensity }); } walk(node.child); walk(node.sibling); };
      walk(root.fiber.current);
      const gl = state.gl.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
      const hdr = state.scene.getObjectByName('accretion-disk')?.material.uniforms.uImage.value.image;
      const visual = ScrollSmoother?.get()?.scrollTop() ?? scrollY, max = document.documentElement.scrollHeight - innerHeight;
      return { width: innerWidth, deviceDpr: devicePixelRatio, dpr: state.gl.getPixelRatio(), buffer: [state.gl.domElement.width, state.gl.domElement.height], quality: document.querySelector('[data-galaxy-scene]').dataset.quality,
        count: state.scene.getObjectByName('star-field').geometry.attributes.position.count, tree, hdr: hdr && [hdr.width, hdr.height],
        composers: state.internal.subscribers.filter((subscriber) => subscriber.priority > 0).length, glError: gl.getError(), gpu: debug && gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
        resources: [state.gl.info.memory.geometries, state.gl.info.memory.textures, state.internal.subscribers.length], points: state.gl.info.render.points,
        section: useScrollStore.getState().currentSection, progressError: Math.abs(useScrollStore.getState().scrollProgress - visual / max),
        canvasCount: document.querySelectorAll('[data-galaxy-scene] canvas').length, hidden: Boolean(state.gl.domElement.closest('[aria-hidden="true"]')), camera: state.camera.position.toArray(),
        shaderTimes: state.scene.children.filter((child) => child.material?.uniforms?.uTime).map((child) => child.material.uniforms.uTime.value) };
    });
    const at = async (selector) => {
      await page.evaluate((selector) => { const element = document.querySelector(selector), smoother = window.task312.ScrollSmoother?.get(); scrollTo(0, (smoother?.offset(element, 'top top') ?? element.getBoundingClientRect().top + scrollY) - 250); }, selector);
      await page.waitForTimeout(1800);
    };
    const fps = async () => page.evaluate(async () => {
      let frames = 0; const start = performance.now(), remove = window.task312.addAfterEffect(() => frames++);
      try { await new Promise((resolve) => setTimeout(resolve, 3000)); const seconds = (performance.now() - start) / 1000; return { frames, seconds, fps: frames / seconds }; } finally { remove(); }
    });
    const check = (pose) => {
      const tier = pose.width < 768 ? 'low' : pose.width < 1024 ? 'medium' : 'high';
      assert.equal(pose.quality, tier); assert.equal(pose.count, QUALITY[tier]); assert.equal(pose.dpr, tier === 'low' ? 1 : 1.75);
      const piece = ['about', 'skills'].includes(pose.section);
      assert.equal(pose.composers, tier === 'low' || piece ? 0 : 1); assert.equal(pose.canvasCount, 1); assert.equal(pose.glError, 0); assert.equal(pose.hidden, true);
      assert(pose.progressError < 0.00001); assert(!pose.tree.some((node) => node.name === 'ChromaticAberration'));
      for (const child of pose.tree.filter((node) => ['PlanetModel', 'Orbit', 'BlackHoleSystem'].includes(node.name))) assert.equal(child.quality, tier);
      const bloom = pose.tree.find((node) => node.name === 'SelectiveBloom'); if (bloom) assert.equal(bloom.intensity, tier === 'medium' ? 0.15 : 0.3);
    };
    await load();
    for (const selector of ['#hero', '[data-planet-window]', '[data-orbit-window]', '#transmission']) {
      await at(selector); const pose = await snapshot(), measurement = await fps(); results.push({ label: `390-${selector}`, pose, ...measurement });
      if (!baselineMode) { check(pose); assert(measurement.fps > 50); }
    }
    if (!baselineMode) {
      await page.screenshot({ path: 'outputs/task-3.12/mobile-contact.png' });
      const initialCanvas = await page.evaluateHandle(() => document.querySelector('[data-galaxy-scene] canvas'));
      for (const width of [767, 768, 1023, 1024, 1440, 390, 768, 1440, 390]) {
        await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(1000); await at('#hero'); const pose = await snapshot(); check(pose);
        assert(await page.evaluate((canvas) => canvas === document.querySelector('[data-galaxy-scene] canvas'), initialCanvas)); results.push({ label: `resize-${width}`, pose });
      }
      await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(1000); await at('#transmission'); const reduced = await snapshot(); check(reduced); await page.waitForTimeout(500); const staticPose = await snapshot(); assert.deepEqual(reduced.camera, staticPose.camera); assert.deepEqual(reduced.shaderTimes, staticPose.shaderTimes); results.push({ label: 'reduced-mobile', pose: reduced });
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: 1440, height: 844 }); await page.waitForTimeout(1000); await at('#transmission'); const desktop = await snapshot(); check(desktop); results.push({ label: 'desktop-contact', pose: desktop, ...await fps() }); await page.screenshot({ path: 'outputs/task-3.12/desktop-contact.png' });
      await page.setViewportSize({ width: 390, height: 844 }); await load('http://127.0.0.1:5173/3d-lab.html'); const lab = await snapshot(); check(lab); results.push({ label: 'lab-low', pose: lab });
      assert(await page.getByRole('button', { name: /Bật bloom/ }).isDisabled());
      await page.getByRole('button', { name: /Cao — 24k/ }).click(); await page.waitForTimeout(1200); const override = await snapshot(); assert.equal(override.quality, 'high'); assert.equal(override.count, 24000); assert.equal(override.composers, 1); assert.equal(override.dpr, 1); results.push({ label: 'lab-high-override', pose: override });
    } else { await page.setViewportSize({ width: 1440, height: 844 }); await page.waitForTimeout(1000); await at('#transmission'); results.push({ label: 'desktop-contact', pose: await snapshot(), ...await fps() }); }
    assert.deepEqual(errors, []);
    console.log(`${baselineMode ? 'BASELINE' : 'PASS'}: ${results.length} poses, ${results.filter((result) => result.fps).map((result) => `${result.label} ${result.fps.toFixed(1)}fps`).join(', ')}, 0 errors`);
  } finally { writeFileSync(new URL(baselineMode ? './browser-baseline.json' : './browser-results.json', import.meta.url), JSON.stringify({ results, errors, warnings: [...new Set(warnings)] }, null, 2)); await browser.close(); }
}
