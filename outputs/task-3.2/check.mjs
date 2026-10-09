import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { useScrollStore } from '../../src/stores/useScrollStore.js';
import { cameraPath } from '../../src/3d/utils/cameraPath.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const baseline = JSON.parse(read('./baseline.json'));
for (const path of ['src/components/Hero.jsx', 'src/3d/utils/cameraPath.js', 'src/3d/components/BlackHoleSystem.jsx', 'src/3d/components/BlackHoleBloomMask.jsx']) {
  const hash = createHash('sha256').update(readFileSync(new URL(`../../${path}`, import.meta.url))).digest('hex');
  assert.equal(hash, baseline.hashes[path], `${path} remains unchanged`);
}
const { setContactProgress } = useScrollStore.getState();
for (const [input, expected] of [[-1, 0], [0.5, 0.5], [2, 1], [NaN, 1], [Infinity, 1], ['1', 1]]) {
  setContactProgress(input); assert.equal(useScrollStore.getState().contactProgress, expected);
}
setContactProgress(0);
const endpoint = cameraPath(1);
assert(endpoint.y > 0 && Math.hypot(endpoint.x, endpoint.y, endpoint.z - 2 + 200) > 3);
assert.match(read('../../src/3d/shaders/blackHole.js'), /return uDiskIntensity \* 2\.1/);
console.log('PASS: protected Hero/path/compositor, finite/clamped Contact state, safe endpoint, HDR intensity');

if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
    const errors = [], warnings = [], poses = [], heroes = [], lifecycle = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), { polling: 50 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1600);
    const snapshot = () => page.evaluate(async () => {
      const urls = performance.getEntriesByType('resource').map((entry) => entry.name);
      const loaded = (name) => urls.filter((url) => url.includes(name)).at(-1);
      const { _roots } = await import(loaded('/@react-three_fiber.js'));
      const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
      const { ScrollTrigger, ScrollSmoother } = await import(loaded('/src/hooks/useGSAPSetup.js'));
      const state = _roots.get(document.querySelector('canvas')).store.getState();
      const program = state.gl.info.programs.find((program) => program.getUniforms().map.uDiskIntensity);
      const uniforms = program?.getUniforms().map;
      const gl = state.gl.getContext(), store = useScrollStore.getState();
      const trigger = ScrollTrigger.getById('contact-approach'), contact = document.getElementById('transmission');
      const hero = document.querySelector('#hero [data-hero-content]') ?? document.querySelector('#hero > div');
      return { y: scrollY, section: store.currentSection, progress: store.scrollProgress, contactProgress: store.contactProgress,
        camera: state.camera.position.toArray(), quaternion: state.camera.quaternion.toArray(), fov: state.camera.fov,
        intensity: uniforms ? gl.getUniform(program.program, uniforms.uDiskIntensity.addr) : null,
        time: uniforms ? gl.getUniform(program.program, uniforms.uTime.addr) : null,
        heroOpacity: getComputedStyle(hero).opacity, heroTransform: getComputedStyle(hero).transform,
        smoother: !!ScrollSmoother.get(), canvas: document.querySelectorAll('canvas').length,
        trigger: trigger ? { start: trigger.start, end: trigger.end, progress: trigger.progress } : null,
        triggerCount: ScrollTrigger.getAll().filter((item) => item.vars.id === 'contact-approach').length,
        contactTriggers: ScrollTrigger.getAll().filter((item) => contact.contains(item.trigger)).length,
        lines: [...contact.querySelectorAll('[data-contact-line]')].map((line) => ({ opacity: +getComputedStyle(line).opacity, transform: getComputedStyle(line).transform, text: line.textContent })),
        overlay: getComputedStyle(contact).backgroundImage, email: contact.querySelector('[data-contact-email]').getAttribute('href'),
        overflow: document.documentElement.scrollWidth - innerWidth, geometries: state.gl.info.memory.geometries,
        textures: state.gl.info.memory.textures, programs: state.gl.info.programs.length,
        subscribers: state.internal.subscribers.length, glError: gl.getError() };
    });
    const at = async (fraction) => {
      const { trigger } = await snapshot();
      await page.evaluate((y) => scrollTo(0, y), trigger.start + (trigger.end - trigger.start) * fraction);
      await page.waitForTimeout(1900); return snapshot();
    };
    const heroCheck = async (motion) => {
      for (const scroll of [0, 180]) {
        await page.evaluate((y) => scrollTo(0, y), scroll); await page.waitForTimeout(1900);
        const pose = await snapshot(); const previous = baseline.poses.find((pose) => pose.reducedMotion === motion && pose.requestedScroll === scroll);
        assert.equal(pose.contactProgress, 0); assert.equal(pose.intensity, 1); assert.equal(pose.canvas, 1);
        for (let i = 0; i < 3; i++) assert(Math.abs(pose.camera[i] - previous.camera[i]) < 0.015, JSON.stringify({ pose, previous }));
        for (let i = 0; i < 4; i++) assert(Math.abs(pose.quaternion[i] - previous.quaternion[i]) < 0.001);
        assert.equal(pose.heroOpacity, previous.heroOpacity); assert.equal(pose.heroTransform, previous.heroTransform);
        heroes.push({ motion, scroll, pose });
      }
    };
    await heroCheck('no-preference');
    for (const fraction of [0, 0.25, 0.5, 0.75, 1.01]) {
      const pose = await at(fraction); const p = Math.min(1, fraction);
      assert(Math.abs(pose.contactProgress - p) < 0.003);
      assert(Math.abs(pose.intensity - (1 + 0.45 * p)) < 0.003);
      assert(Math.abs(pose.camera[2] - (cameraPath(pose.progress).z - 2 * pose.contactProgress)) < 0.003);
      assert.equal(pose.glError, 0); assert.equal(pose.triggerCount, 1); assert.equal(pose.canvas, 1);
      assert.equal(pose.overflow, 0); assert(pose.camera[1] > 0);
      poses.push({ label: `scrub-${fraction}`, pose });
    }
    assert(poses.slice(1).every((item, index) => item.pose.camera[2] < poses[index].pose.camera[2]));
    assert(poses.at(-1).pose.lines.every((line) => line.opacity === 1));
    assert.equal(poses.at(-1).pose.email, 'mailto:anhduy25work@gmail.com');
    await page.screenshot({ path: 'outputs/task-3.2/contact-desktop.png' });
    await at(0.1);
    const fpsPending = page.evaluate(async () => {
      const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/@react-three_fiber.js')).at(-1);
      const { _roots } = await import(url), store = _roots.get(document.querySelector('canvas')).store;
      let frames = 0; const start = performance.now(); const unsubscribe = store.getState().internal.subscribe({ current: () => frames++ }, 0, store);
      try { await new Promise((resolve) => setTimeout(resolve, 2000)); return { frames, fps: frames * 1000 / (performance.now() - start) }; }
      finally { unsubscribe(); }
    });
    for (let step = 0; step < 10; step++) {
      await page.mouse.wheel(0, 80); await page.waitForTimeout(120);
    }
    const fps = await fpsPending;
    assert(fps.fps > 120, JSON.stringify(fps));
    await at(0.5); assert((await snapshot()).lines[0].opacity < 0.6); // Reverse scrub restores intermediate text.
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1600); assert.equal((await snapshot()).intensity, 1);
      const pose = await at(1.01); assert.equal(pose.triggerCount, 1); lifecycle.push(pose);
    }
    assert(lifecycle.every((pose) => pose.geometries === lifecycle[0].geometries && pose.textures === lifecycle[0].textures && pose.programs === lifecycle[0].programs && pose.subscribers === lifecycle[0].subscribers));
    for (const width of [320, 768, 1920]) {
      await page.setViewportSize({ width, height: 1100 }); await page.waitForTimeout(600);
      const pose = await at(1.01); assert.equal(pose.overflow, 0); assert(pose.lines.every((line) => line.opacity === 1));
      assert(Math.abs(pose.intensity - 1.45) < 0.003); poses.push({ label: `width-${width}`, pose });
      if (width === 320) await page.screenshot({ path: 'outputs/task-3.2/contact-mobile.png' });
    }
    await page.setViewportSize({ width: 1440, height: 1100 }); await page.waitForTimeout(700); await at(1.01);
    await page.evaluate(async () => { const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/src/stores/useLangStore.js')).at(-1); const { useLangStore } = await import(url); useLangStore.getState().setLang('en'); });
    await page.waitForTimeout(1000); const english = await at(1.01);
    assert.equal(english.lines[0].text, "LET'S CONNECT"); assert.equal(english.triggerCount, 1); poses.push({ label: 'english', pose: english });
    await page.screenshot({ path: 'outputs/task-3.2/contact-en.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(1000);
    await page.evaluate(() => { const el = document.getElementById('transmission'); scrollTo(0, el.getBoundingClientRect().top + scrollY - 100); });
    await page.waitForTimeout(1000); const reduced = await snapshot(); await page.waitForTimeout(650); const still = await snapshot();
    assert.equal(reduced.section, 'transmission'); assert.equal(reduced.triggerCount, 0); assert.equal(reduced.contactTriggers, 0); assert.equal(reduced.smoother, false);
    assert.deepEqual(still.camera, reduced.camera); assert.equal(still.time, reduced.time);
    const staticCamera = [endpoint.x, endpoint.y, endpoint.z - 2];
    assert(reduced.camera.every((value, index) => Math.abs(value - staticCamera[index]) < 1e-10));
    assert(Math.abs(reduced.intensity - 1.45) < 0.001);
    assert(reduced.lines.every((line) => line.opacity === 1 && line.transform === 'none')); poses.push({ label: 'live-reduced', pose: reduced });
    await page.screenshot({ path: 'outputs/task-3.2/contact-reduced.png' });
    await heroCheck('reduce');
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(1000); await at(1.01);
    assert.equal((await snapshot()).triggerCount, 1);
    const renderer = await page.evaluate(async () => { const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/@react-three_fiber.js')).at(-1); const { _roots } = await import(url); const gl = _roots.get(document.querySelector('canvas')).store.getState().gl.getContext(); return gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL); });
    writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ poses, heroes, lifecycle, fps, renderer, errors, warnings: [...new Set(warnings)] }, null, 2));
    assert.deepEqual(errors, []);
    console.log(`PASS: ${poses.length} Contact poses, ${heroes.length} unchanged Hero poses, reverse/lifecycle/language/reduced-motion, ${fps.fps.toFixed(1)}fps, 0 App console errors`);
  } finally { await browser.close(); }
}
