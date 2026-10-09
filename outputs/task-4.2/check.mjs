import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';
import { QUALITY, RAY_QUALITY } from '../../src/3d/quality.js';
import { createShootingStars, advanceShootingStars } from '../../src/3d/utils/shootingStars.js';

const baseline = JSON.parse(readFileSync(new URL('./source-baseline.json', import.meta.url), 'utf8'));
const protectedFiles = ['src/3d/components/CameraRig.jsx', 'src/3d/hooks/useScrollProgress.js', 'src/stores/useScrollStore.js', 'src/3d/components/StarField.jsx', 'src/3d/components/BlackHole.jsx', 'src/3d/components/BlackHoleSystem.jsx', 'src/3d/components/BlackHoleBloomMask.jsx', 'src/3d/shaders/blackHole.js'];
for (const file of protectedFiles) assert(readFileSync(file, 'utf8').replaceAll('\r\n', '\n') === baseline[file].replaceAll('\r\n', '\n'), `${file} preserved (line endings normalized)`);
// Concurrent responsive work changes App/Hero classes; protect their behavior.
assert.equal(readFileSync('src/components/Hero.jsx', 'utf8').split('  return (')[0].replaceAll('\r\n', '\n'), baseline['src/components/Hero.jsx'].split('  return (')[0].replaceAll('\r\n', '\n'));
for (const contract of ['<Hero active={!loading} />', '<Planet anchor={aboutPlanet} quality={quality} />', '<OrbitalSkills anchor={skillsOrbit} quality={quality} />']) assert(readFileSync('src/App.jsx', 'utf8').includes(contract));
assert.deepEqual(QUALITY, { high: 24000, medium: 12000, low: 1500 });
assert.deepEqual(RAY_QUALITY, { high: { steps: 192, step: 0.09, resolution: 0.85, maxResolution: 1280 }, medium: { steps: 160, step: 0.11, resolution: 0.8, maxResolution: 1024 }, low: { steps: 128, step: 0.14, resolution: 0.75, maxResolution: 768 } });
const walk = (node, visit) => { if (!node || typeof node !== 'object') return; if (node.type) visit(node); for (const value of Object.values(node)) { if (Array.isArray(value)) value.forEach((child) => walk(child, visit)); else if (value && typeof value === 'object') walk(value, visit); } };
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(`${dir}/${entry.name}`) : /\.(jsx|js)$/.test(entry.name) ? [`${dir}/${entry.name}`] : []);
const frameAudit = [];
for (const file of files('src/3d')) {
  const ast = parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  walk(ast, (node) => {
    if (node.type !== 'CallExpression' || node.callee.name !== 'useFrame') return;
    const violations = [];
    walk(node.arguments[0].body, (child) => {
      if (['NewExpression', 'ObjectExpression', 'ArrayExpression', 'ArrowFunctionExpression', 'FunctionExpression'].includes(child.type)) violations.push(`${child.type}:${child.loc.start.line}`);
      if (child.type === 'CallExpression' && ['clone', 'toArray', 'getBoundingClientRect'].includes(child.callee.property?.name)) violations.push(`${child.callee.property.name}:${child.loc.start.line}`);
    });
    assert.deepEqual(violations, [], `${file}: no frame allocations`);
    frameAudit.push({ file, line: node.loc.start.line });
  });
}
// The helper invoked by ShootingStars also preserves its exact pooled output.
const oldMeteors = await import(`data:text/javascript;base64,${Buffer.from(baseline['src/3d/utils/shootingStars.js']).toString('base64')}`);
const random = () => { let seed = 123; return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); };
const beforeRandom = random(), afterRandom = random();
const before = oldMeteors.createShootingStars(beforeRandom), after = createShootingStars(afterRandom);
const oldPositions = new Float32Array(216), newPositions = new Float32Array(216), oldAlphas = new Float32Array(72), newAlphas = new Float32Array(72);
for (let frame = 0; frame < 2000; frame++) { oldMeteors.advanceShootingStars(before, 1 / 60, 1.8, oldPositions, oldAlphas, beforeRandom); advanceShootingStars(after, 1 / 60, 1.8, newPositions, newAlphas, afterRandom); assert.deepEqual(newPositions, oldPositions); assert.deepEqual(newAlphas, oldAlphas); }
writeFileSync(new URL('./source-results.json', import.meta.url), JSON.stringify({ protectedFiles, frameAudit, meteorFrames: 2000, quality: QUALITY, rays: RAY_QUALITY }, null, 2));
console.log(`PASS: ${protectedFiles.length} protected files, ${frameAudit.length} allocation-free useFrame callbacks, 2000 pooled meteor frames`);

if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const results = [], errors = [], warnings = [], expectedFallbackErrors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 844 }, deviceScaleFactor: 3 });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => document.querySelector('[data-galaxy-scene] canvas') && !document.body.classList.contains('loading-lock'));
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
    await page.evaluate(async () => {
      const urls = performance.getEntriesByType('resource').map((entry) => entry.name), loaded = (name) => urls.filter((url) => url.includes(name)).at(-1);
      const { _roots, addAfterEffect } = await import(loaded('/@react-three_fiber.js'));
      const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
      const { ScrollSmoother } = await import(loaded('/src/hooks/useGSAPSetup.js'));
      const { Vector3 } = await import(loaded('/three.js'));
      window.qa42 = { root: _roots.get(document.querySelector('[data-galaxy-scene] canvas')), addAfterEffect, useScrollStore, ScrollSmoother, Vector3 };
    });
    const at = async (selector) => { await page.evaluate((selector) => { const element = document.querySelector(selector), smoother = window.qa42.ScrollSmoother.get(); scrollTo(0, Math.max(0, (smoother?.offset(element, 'top top') ?? element.getBoundingClientRect().top - document.querySelector('#smooth-content').getBoundingClientRect().top) - 200)); }, selector); await page.waitForTimeout(1400); };
    const snapshot = () => page.evaluate(() => {
      const { root, useScrollStore, ScrollSmoother, Vector3 } = window.qa42, state = root.store.getState(), tree = [];
      const walk = (node) => { if (!node) return; const name = node.type?.name ?? node.type?.render?.name ?? node.type?.type?.name; if (['StarField', 'PlanetModel', 'Orbit', 'BlackHoleSystem', 'SelectiveBloom', 'ChromaticAberration'].includes(name)) { const { quality, count, intensity } = node.memoizedProps ?? {}; tree.push({ name, quality, count, intensity }); } walk(node.child); walk(node.sibling); }; walk(root.fiber.current);
      const gl = state.gl.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info'), hdr = state.scene.getObjectByName('accretion-disk')?.material.uniforms.uImage.value.image;
      const anchorErrors = [];
      for (const [selector, name] of [['[data-planet-window]', 'about-planet'], ['[data-orbit-window]', 'orbital-skills']]) { const model = state.scene.getObjectByName(name); if (!model?.visible) continue; const rect = document.querySelector(selector).getBoundingClientRect(), projected = new Vector3().copy(model.position).project(state.camera); anchorErrors.push(Math.hypot((projected.x + 1) * innerWidth / 2 - (rect.left + rect.width / 2), (1 - projected.y) * innerHeight / 2 - (rect.top + rect.height / 2))); }
      const visual = ScrollSmoother.get()?.scrollTop() ?? scrollY;
      return { width: innerWidth, dpr: state.gl.getPixelRatio(), buffer: [state.gl.domElement.width, state.gl.domElement.height], quality: document.querySelector('[data-galaxy-scene]').dataset.quality, count: state.scene.getObjectByName('star-field').geometry.attributes.position.count,
        tree, hdr: hdr && [hdr.width, hdr.height], nebulaOctaves: state.scene.children.filter((node) => node.material?.defines?.FBM_OCTAVES).map((node) => node.material.defines.FBM_OCTAVES),
        composers: state.internal.subscribers.filter((subscriber) => subscriber.priority > 0).length, glError: gl.getError(), gpu: debug && gl.getParameter(debug.UNMASKED_RENDERER_WEBGL), resources: [state.gl.info.memory.geometries, state.gl.info.memory.textures, state.internal.subscribers.length],
        section: useScrollStore.getState().currentSection, progressError: Math.abs(useScrollStore.getState().scrollProgress - visual / (document.documentElement.scrollHeight - innerHeight)), anchorErrors, frameloop: state.frameloop, canvasCount: document.querySelectorAll('[data-galaxy-scene] canvas').length,
        camera: state.camera.position.toArray(), times: state.scene.children.filter((node) => node.material?.uniforms?.uTime).map((node) => node.material.uniforms.uTime.value) };
    });
    const measure = () => page.evaluate(async () => {
      const { root, addAfterEffect } = window.qa42, state = root.store.getState(), oldAutoReset = state.gl.info.autoReset;
      let frames = 0, sampled = 0, bucketFrames = 0, bucketStart = performance.now(); const start = bucketStart, buckets = [], calls = [], triangles = [], points = [];
      state.gl.info.autoReset = false;
      const removeFrame = state.internal.subscribe({ current: () => { state.gl.info.reset(); frames++; } }, -100, root.store);
      const removeAfter = addAfterEffect(() => { if (sampled === frames) return; sampled = frames; const info = state.gl.info.render; calls.push(info.calls); triangles.push(info.triangles); points.push(info.points); bucketFrames++; const now = performance.now(); if (now - bucketStart >= 1000) { buckets.push(bucketFrames * 1000 / (now - bucketStart)); bucketStart = now; bucketFrames = 0; } });
      try { await new Promise((resolve) => setTimeout(resolve, 3200)); const range = (values) => [Math.min(...values), Math.max(...values)]; return { fps: frames * 1000 / (performance.now() - start), buckets, calls: range(calls), triangles: range(triangles), points: range(points) }; }
      finally { removeFrame(); removeAfter(); state.gl.info.autoReset = oldAutoReset; }
    });
    const check = (pose) => { const tier = pose.width < 768 ? 'low' : pose.width < 1024 ? 'medium' : 'high'; assert.equal(pose.quality, tier); assert.equal(pose.count, QUALITY[tier]); assert.equal(pose.dpr, tier === 'low' ? 1 : tier === 'medium' ? 1.5 : 1.75); assert.deepEqual(pose.nebulaOctaves, [tier === 'low' ? 3 : tier === 'medium' ? 4 : 5, tier === 'low' ? 3 : tier === 'medium' ? 4 : 5]); assert.equal(pose.composers, tier === 'low' || ['about', 'skills'].includes(pose.section) ? 0 : 1); assert.equal(pose.canvasCount, 1); assert.equal(pose.glError, 0); assert(pose.progressError < 0.00001); assert(pose.anchorErrors.every((error) => error < 2)); assert(!pose.tree.some((node) => node.name === 'ChromaticAberration')); for (const piece of pose.tree.filter((node) => ['PlanetModel', 'Orbit', 'BlackHoleSystem'].includes(node.name))) assert.equal(piece.quality, tier); const bloom = pose.tree.find((node) => node.name === 'SelectiveBloom'); if (bloom) assert.equal(bloom.intensity, tier === 'medium' ? 0.15 : 0.3); };
    for (const width of process.argv.includes('--lifecycle') ? [] : [1440, 834, 390]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(800);
      for (const selector of ['#hero', '[data-planet-window]', '[data-orbit-window]', '#transmission']) { await at(selector); const pose = await snapshot(), stats = await measure(); check(pose); assert(stats.fps > (width >= 1024 ? 120 : 60)); assert(stats.buckets.every((fps) => fps > (width >= 1024 ? 120 : 60))); results.push({ label: `${width}-${selector}`, pose, ...stats }); console.log(`${width} ${pose.section}: ${stats.fps.toFixed(1)}fps; calls ${stats.calls}; triangles ${stats.triangles}`); }
      await page.screenshot({ path: `outputs/task-4.2/contact-${width}.png` });
    }
    const canvas = await page.evaluateHandle(() => document.querySelector('[data-galaxy-scene] canvas'));
    for (const width of [767, 768, 1023, 1024, 1440, 390, 834, 1440]) { await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(800); await at('[data-planet-window]'); const pose = await snapshot(); check(pose); assert(await page.evaluate((original) => original === document.querySelector('[data-galaxy-scene] canvas'), canvas)); results.push({ label: `resize-${width}`, pose }); }
    // Observe the cached DOM anchor after each render during fast scroll + resize.
    await page.evaluate(() => {
      const { root, addAfterEffect, Vector3 } = window.qa42, point = new Vector3();
      window.qa42.stream = { samples: 0, maxError: 0 };
      window.qa42.removeStream = addAfterEffect(() => {
        const state = root.store.getState();
        for (const [selector, name] of [['[data-planet-window]', 'about-planet'], ['[data-orbit-window]', 'orbital-skills']]) {
          const model = state.scene.getObjectByName(name); if (!model?.visible) continue;
          const rect = document.querySelector(selector).getBoundingClientRect(); point.copy(model.position).project(state.camera);
          const error = Math.hypot((point.x + 1) * innerWidth / 2 - rect.left - rect.width / 2, (1 - point.y) * innerHeight / 2 - rect.top - rect.height / 2);
          window.qa42.stream.samples++; if (error > window.qa42.stream.maxError) { window.qa42.stream.maxError = error; window.qa42.stream.worst = { selector, width: innerWidth, rootWidth: state.size.width, cameraAspect: state.camera.aspect, rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height }, projected: [(point.x + 1) * innerWidth / 2, (1 - point.y) * innerHeight / 2], progress: window.qa42.useScrollStore.getState().scrollProgress, visual: window.qa42.ScrollSmoother.get()?.scrollTop(), contentTop: document.querySelector('#smooth-content').getBoundingClientRect().top }; }
        }
      });
    });
    for (let index = 0; index < 3; index++) { await page.evaluate(() => { const smoother = window.qa42.ScrollSmoother.get(), element = document.querySelector('#skills'); scrollTo(0, smoother.offset(element, 'top top')); }); await page.waitForTimeout(350); await page.evaluate(() => { const smoother = window.qa42.ScrollSmoother.get(), element = document.querySelector('#about'); scrollTo(0, smoother.offset(element, 'top top')); }); await page.waitForTimeout(350); }
    for (const width of [1200, 1100, 1300, 1440]) { await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(120); }
    await page.waitForTimeout(500); const stream = await page.evaluate(() => { window.qa42.removeStream(); return window.qa42.stream; }); results.push({ label: 'anchor-fast-scroll-resize', ...stream }); assert(stream.samples > 100); assert(stream.maxError < 2);
    await at('#transmission');
    const disposalCycles = [];
    for (const width of [834, 390, 1440]) {
      await page.evaluate(() => { const state = window.qa42.root.store.getState(), geometry = state.scene.getObjectByName('star-field').geometry; window.qa42.tierDisposed = false; geometry.addEventListener('dispose', () => { window.qa42.tierDisposed = true; }); });
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(1000); const pose = await snapshot(); check(pose); assert(await page.evaluate(() => window.qa42.tierDisposed)); disposalCycles.push({ width, resources: pose.resources });
    }
    results.push({ label: 'tier-geometry-disposal', cycles: disposalCycles });
    await at('#transmission');
    await page.evaluate(() => { const state = window.qa42.root.store.getState(); window.qa42.hiddenFrames = 0; window.qa42.removeHiddenProbe = state.internal.subscribe({ current: () => window.qa42.hiddenFrames++ }, -100, window.qa42.root.store); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(500); const hiddenStart = await page.evaluate(() => window.qa42.hiddenFrames); await page.waitForTimeout(600); const hidden = await page.evaluate(() => ({ frames: window.qa42.hiddenFrames, frameloop: window.qa42.root.store.getState().frameloop })); assert.equal(hidden.frames, hiddenStart); assert.equal(hidden.frameloop, 'never'); results.push({ label: 'hidden', ...hidden, framesDuringWindow: hidden.frames - hiddenStart });
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(500); assert((await page.evaluate(() => window.qa42.hiddenFrames)) > hidden.frames); await page.evaluate(() => window.qa42.removeHiddenProbe());
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(1800);
    const nativeDelta = await page.evaluate(() => document.querySelector('#skills').getBoundingClientRect().top - document.querySelector('#smooth-content').getBoundingClientRect().top - scrollY - 200);
    await page.mouse.move(700, 430); await page.mouse.wheel(0, nativeDelta); await page.waitForTimeout(1800);
    const reduced = await snapshot(); check(reduced); results.push({ label: 'reduced-skills', pose: reduced }); assert.equal(reduced.section, 'skills'); await page.waitForTimeout(500); const still = await snapshot(); assert.deepEqual(still.camera, reduced.camera); assert.deepEqual(still.times, reduced.times);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(800); await at('#transmission');
    await page.evaluate(() => {
      const state = window.qa42.root.store.getState(), tracked = [], seen = new Set();
      const track = (object, kind) => { if (!object || seen.has(object)) return; seen.add(object); const item = { kind, disposed: false }; tracked.push(item); object.addEventListener('dispose', () => { item.disposed = true; }); };
      const geometry = state.scene.getObjectByName('star-field').geometry;
      state.scene.traverse((node) => { track(node.geometry, 'geometry'); if (node.material) track(node.material, 'material'); });
      const render = state.gl.render.bind(state.gl), setTarget = state.gl.setRenderTarget.bind(state.gl);
      state.gl.render = (scene, camera) => { scene.traverse((node) => { track(node.geometry, 'geometry'); track(node.material, 'material'); }); return render(scene, camera); };
      state.gl.setRenderTarget = (...args) => { track(args[0], 'renderTarget'); return setTarget(...args); };
      window.qa42.disposal = { tracked, geometry, before: { ...state.gl.info.memory } };
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => window.qa42.root.store.getState().gl.getContext().getExtension('WEBGL_lose_context').loseContext());
    await page.waitForSelector('[data-scene-fallback]'); await page.waitForTimeout(1200);
    const lost = await page.evaluate(() => ({ canvasCount: document.querySelectorAll('[data-galaxy-scene] canvas').length, bg: getComputedStyle(document.querySelector('[data-scene-fallback]')).backgroundColor, domAlive: Boolean(document.querySelector('#transmission a[href^="mailto:"]')), tracked: window.qa42.disposal.tracked, before: window.qa42.disposal.before, after: { ...window.qa42.root.store.getState().gl.info.memory } }));
    assert.equal(lost.canvasCount, 0); assert.equal(lost.bg, 'rgb(5, 5, 5)'); assert(lost.domAlive); assert(lost.tracked.filter((item) => item.kind === 'geometry').every((item) => item.disposed)); assert(lost.tracked.some((item) => item.kind === 'renderTarget' && item.disposed)); results.push({ label: 'context-lost-disposal', ...lost }); await page.screenshot({ path: 'outputs/task-4.2/context-lost.png' });
    await page.evaluate(async () => { const urls = performance.getEntriesByType('resource').map((entry) => entry.name), url = urls.filter((url) => url.includes('/src/stores/useThemeStore.js')).at(-1); (await import(url)).useThemeStore.getState().setTheme('light'); });
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-scene-fallback]')).backgroundColor), 'rgb(5, 5, 5)'); results.push({ label: 'fallback-light-theme', bg: 'rgb(5, 5, 5)' });
    await page.goto('http://127.0.0.1:5173/3d-lab.html'); await page.waitForSelector('[data-galaxy-scene] canvas'); await page.waitForTimeout(1000);
    for (const [name, tier, dpr] of [[/Thấp —/, 'low', 1], [/Trung bình —/, 'medium', 1.5], [/Cao —/, 'high', 1.75]]) {
      await page.getByRole('button', { name }).click(); await page.waitForTimeout(700);
      const lab = await page.evaluate(async () => { const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/@react-three_fiber.js')).at(-1), { _roots } = await import(url), state = _roots.get(document.querySelector('[data-galaxy-scene] canvas')).store.getState(); return { tier: document.querySelector('[data-galaxy-scene]').dataset.quality, dpr: state.gl.getPixelRatio(), count: state.scene.getObjectByName('star-field').geometry.attributes.position.count }; });
      assert.equal(lab.tier, tier); assert.equal(lab.dpr, dpr); assert.equal(lab.count, QUALITY[tier]); results.push({ label: `lab-manual-${tier}`, ...lab });
    }
    assert.deepEqual(errors, []);
    const unsupported = await browser.newContext({ viewport: { width: 390, height: 844 } }); await unsupported.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (type, ...args) { return type === 'webgl2' ? null : original.call(this, type, ...args); }; });
    const noGl = await unsupported.newPage(); noGl.on('console', (message) => { if (message.type() === 'error') expectedFallbackErrors.push(message.text()); }); noGl.on('pageerror', (error) => expectedFallbackErrors.push(error.message));
    await noGl.goto('http://127.0.0.1:5173/'); await noGl.waitForSelector('[data-scene-fallback]'); await noGl.waitForTimeout(2500);
    const fallback = await noGl.evaluate(() => ({ canvasCount: document.querySelectorAll('[data-galaxy-scene] canvas').length, bg: getComputedStyle(document.querySelector('[data-scene-fallback]')).backgroundColor, domAlive: Boolean(document.querySelector('#hero h1')), loading: document.body.classList.contains('loading-lock') })); assert.equal(fallback.canvasCount, 0); assert.equal(fallback.bg, 'rgb(5, 5, 5)'); assert(fallback.domAlive); assert.equal(fallback.loading, false); results.push({ label: 'no-webgl2', ...fallback });
    console.log(`PASS: ${results.length} browser poses/lifecycle checks; 0 normal runtime errors`);
  } finally { writeFileSync(new URL(process.argv.includes('--lifecycle') ? './lifecycle-results.json' : './browser-results.json', import.meta.url), JSON.stringify({ results, errors, warnings: [...new Set(warnings)], expectedFallbackErrors }, null, 2)); await browser.close(); }
}
