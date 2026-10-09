import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import pngjs from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js';

const out = new URL('./', import.meta.url);
const report = { checks: [], performance: [], pixels: [], errors: [], warnings: [], requests: [] };
const check = (condition, label) => { assert(condition, label); report.checks.push(label); };
const save = () => writeFileSync(new URL('results.json', out), JSON.stringify(report, null, 2));
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browser = browser.version();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await context.addInitScript(() => {
    localStorage.setItem('stellar-theme', 'dark');
    const records = [];
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (listener?.name === 'hideLens' || (type === 'pointermove' && String(listener).includes('moveLens'))) {
        if (!records.some(r => r.active && r.node === this && r.type === type && r.listener === listener)) records.push({ node: this, type, listener, active: true });
      }
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (type, listener, options) {
      records.forEach(r => { if (r.node === this && r.type === type && r.listener === listener) r.active = false; });
      return remove.call(this, type, listener, options);
    };
    window.lensListenerCount = () => records.filter(r => r.active).length;
    window.renderSamples = [];
    const draw = WebGL2RenderingContext.prototype.drawArrays;
    WebGL2RenderingContext.prototype.drawArrays = function (mode, first, count) {
      // StarField draws 24,000 POINTS once per main scene render, including composer mode.
      if (window.measureRender && mode === this.POINTS && count === 24000) window.renderSamples.push(performance.now());
      return draw.call(this, mode, first, count);
    };
  });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(String(e)));
  page.on('console', e => { if (e.type() === 'error') report.errors.push(e.text()); if (e.type() === 'warning') report.warnings.push(e.text()); });
  page.on('request', r => report.requests.push(r.url()));
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('[data-preloader]').waitFor({ state: 'detached' });
  await page.locator('[data-galaxy-scene] canvas').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(5200);
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  report.gpu = await page.evaluate(() => {
    const gl = document.querySelector('canvas').getContext('webgl2'), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight], dpr: devicePixelRatio };
  });
  const lensState = () => page.evaluate(() => {
    const lens = document.querySelector('[data-cursor-lens]');
    return { active: lens?.dataset.active === 'true', count: document.querySelectorAll('[data-cursor-lens]').length,
      filterCount: document.querySelectorAll('#cursor-gravity').length, rect: lens && { x: lens.getBoundingClientRect().x, y: lens.getBoundingClientRect().y, w: lens.offsetWidth, h: lens.offsetHeight },
      visible: lens && getComputedStyle(lens).visibility, cursor: document.querySelector('[data-custom-cursor]')?.dataset.cursorState, listeners: window.lensListenerCount() };
  });
  async function pose(selector) {
    await page.evaluate(async selector => {
      const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
      const target = document.querySelector(selector), smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTo(target, false, 'center center'); else target.scrollIntoView({ block: 'center', behavior: 'instant' });
    }, selector);
    await page.waitForTimeout(1500);
  }
  async function hover(selector, rx = .5, ry = .5) {
    const box = await page.locator(selector).first().boundingBox();
    const x = Math.round(box.x + box.width * rx), y = Math.round(box.y + box.height * ry);
    await page.mouse.move(x, y); await page.waitForTimeout(320);
    return { x, y, box };
  }
  check((await lensState()).count === 1 && (await lensState()).filterCount === 1, 'StrictMode: one lens/filter');
  check((await lensState()).listeners === 3, 'StrictMode: one pointermove + scroll/resize listener');
  await hover('#hero-heading');
  check((await lensState()).active, 'Hero heading detects pointer-through layout');
  await page.screenshot({ path: fileURLToPath(new URL('hero-lens.png', out)) });
  await hover('#hero [data-hero-sub]');
  check(!(await lensState()).active, 'Normal paragraph does not activate');
  await pose('#about h2'); await hover('#about h2');
  check((await lensState()).active, 'About heading activates');
  await pose('#work h2'); await hover('#work h2');
  check((await lensState()).active, 'Works heading activates');

  async function pixelProof(name, point) {
    check((await lensState()).active, `${name}: pointer really activates filter`);
    const css = await page.addStyleTag({ content: '.gsap-cursor-ring,.gsap-cursor-dot{visibility:hidden!important}' });
    await page.evaluate(() => document.querySelector('[data-cursor-lens]').style.visibility = 'hidden');
    const off = await page.screenshot({ path: fileURLToPath(new URL(`${name}-off.png`, out)) });
    await page.evaluate(() => document.querySelector('[data-cursor-lens]').style.visibility = 'visible');
    const on = await page.screenshot({ path: fileURLToPath(new URL(`${name}-on.png`, out)) });
    const a = pngjs.PNG.sync.read(off), b = pngjs.PNG.sync.read(on);
    let inside = 0, outside = 0, max = 0;
    const crop = new pngjs.PNG({ width: 600, height: 200 });
    for (let y = -50; y < 50; y++) for (let x = -50; x < 50; x++) {
      const index = ((point.y + y) * a.width + point.x + x) * 4;
      const difference = Math.max(...[0, 1, 2].map(c => Math.abs(a.data[index + c] - b.data[index + c])));
      if (difference > 4) { if (Math.hypot(x + .5, y + .5) <= 40) inside++; else outside++; }
      max = Math.max(max, difference);
      for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) for (let panel = 0; panel < 3; panel++) {
        const dest = (((y + 50) * 2 + sy) * crop.width + (x + 50) * 2 + sx + panel * 200) * 4;
        for (let c = 0; c < 3; c++) crop.data[dest + c] = panel === 0 ? a.data[index + c] : panel === 1 ? b.data[index + c] : Math.min(255, Math.abs(a.data[index + c] - b.data[index + c]) * 3);
        crop.data[dest + 3] = 255;
      }
    }
    writeFileSync(new URL(`${name}-comparison.png`, out), pngjs.PNG.sync.write(crop));
    report.pixels.push({ name, x: point.x, y: point.y, insideChangedOver4: inside, outsideChangedOver4: outside, maxDifference: max });
    check(inside > 20, `${name}: actual displaced pixels`);
    check(outside <= 4, `${name}: change bounded to radius 40px`);
    await css.evaluate(e => e.remove());
  }
  // Freeze only the 3D background during the typography pixel comparison.
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(400);
  const headingPoint = await page.evaluate(() => {
    for (const char of document.querySelectorAll('#work h2 .split-char')) {
      const r = char.getBoundingClientRect(), x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2);
      if (x > 220 && x < innerWidth - 220 && document.elementFromPoint(x, y)?.closest('#work h2')) return { x, y };
    }
    throw new Error('No unobscured heading glyph');
  });
  await page.mouse.move(headingPoint.x, headingPoint.y); await page.waitForTimeout(400);
  await pixelProof('heading', headingPoint);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(500);
  // High-contrast project edge, 20px away from center so curvature is visible.
  await pose('[data-project-image]');
  const projectPoint = await hover('[data-project-image]', .55, .5);
  projectPoint.y -= 20; await page.mouse.move(projectPoint.x, projectPoint.y); await page.waitForTimeout(700);
  let s = await lensState();
  check(s.active && s.rect.w === 80 && s.rect.h === 80, 'Project lens: 80px diameter');
  check(Math.abs(s.rect.x + 40 - projectPoint.x) < .01 && Math.abs(s.rect.y + 40 - projectPoint.y) < .01, 'Lens precisely follows viewport coordinates');
  check(s.cursor === 'view', 'Existing VIEW contract preserved');
  await pixelProof('project', projectPoint);
  await page.screenshot({ path: fileURLToPath(new URL('works-lens.png', out)) });
  await page.waitForTimeout(2000);

  // Real CDP input + actual StarField draw submissions, rather than RAF alone.
  const traceFrames = [];
  cdp.on('Tracing.dataCollected', ({ value }) => value.forEach(e => { if (e.name === 'DrawFrame') traceFrames.push({ ts: e.ts, pid: e.pid, tid: e.tid }); }));
  await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline.frame', transferMode: 'ReportEvents' });
  for (const enabled of [false, true, false, true]) {
    await page.evaluate(enabled => { document.querySelector('[data-cursor-lens]').style.backdropFilter = enabled ? 'url("#cursor-gravity")' : 'none'; window.renderSamples = []; window.measureRender = true; }, enabled);
    const before = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    const started = Date.now(); let inputEvents = 0;
    while (Date.now() - started < 5000) {
      const t = (Date.now() - started) / 450;
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: projectPoint.x + Math.sin(t) * 90, y: projectPoint.y + Math.cos(t * 1.3) * 55, pointerType: 'mouse' });
      inputEvents++; await delay(5);
    }
    const result = await page.evaluate(() => { window.measureRender = false; return { samples: window.renderSamples, active: document.querySelector('[data-cursor-lens]').dataset.active }; });
    const after = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
    const intervals = result.samples.slice(1).map((v, i) => v - result.samples[i]);
    const sorted = [...intervals].sort((a, b) => a - b);
    const fps = intervals.length * 1000 / (result.samples.at(-1) - result.samples[0]);
    const metric = { enabled, durationMs: Date.now() - started, inputEvents, frames: result.samples.length, fps, p95FrameMs: sorted[Math.floor(sorted.length * .95)], slowFramesOver16_7Ms: intervals.filter(v => v > 16.7).length,
      scriptMs: (after.ScriptDuration - before.ScriptDuration) * 1000, taskMs: (after.TaskDuration - before.TaskDuration) * 1000, layouts: after.LayoutCount - before.LayoutCount, lensActive: result.active };
    report.performance.push(metric);
    check(fps >= 60, `Actual 3D render FPS >=60, lens ${enabled}`);
    check(metric.lensActive === 'true', 'Lens stayed on project during continuous input');
  }
  const complete = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.end'); await complete;
  report.cdpDrawFrame = { events: traceFrames.length, streams: [...new Set(traceFrames.map(e => `${e.pid}:${e.tid}`))] };
  check(traceFrames.length > 600, 'CDP captured compositor DrawFrame events');

  for (let i = 0; i < 3; i++) {
    await pose(`[data-project-card]:nth-child(${i + 1}) [data-project-image]`);
    await hover(`[data-project-card]:nth-child(${i + 1}) [data-project-image]`);
    check((await lensState()).active, `Cover ${i + 1} activates (including pending project)`);
  }
  await pose('#work h2'); await hover('#work h2');
  await page.keyboard.press('Tab');
  check(!(await lensState()).active && (await lensState()).visible === 'hidden', 'Tab hides supplemental visual');
  await hover('#work h2'); await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
  check(!(await lensState()).active, 'Scroll clears stale lens');
  await hover('#work h2'); await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  check(!(await lensState()).active, 'Blur clears lens');
  await hover('#work h2');
  await page.locator('#work h2').evaluate(e => e.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch', clientX: 300, clientY: 300 })));
  check(!(await lensState()).active, 'Touch input clears lens');
  await page.locator('button[aria-controls="stellar-menu"]').focus(); await page.keyboard.press('Enter');
  await page.locator('#stellar-menu[open]').waitFor();
  await hover('#stellar-menu a');
  check(!(await lensState()).active, 'Menu headings/links excluded');
  await page.keyboard.press('Escape');
  check(await page.locator('button[aria-controls="stellar-menu"]').evaluate(e => document.activeElement === e), 'Menu focus restore preserved');
  await pose('#transmission'); await hover('#transmission [data-magnetic]');
  check(!(await lensState()).active, 'Email CTA excluded from warp');
  report.magnetic = await page.locator('#transmission [data-magnetic]').evaluate(e => e.style.translate);
  check(report.magnetic !== '', 'Existing magnetic handler preserved');

  for (let i = 0; i < 3; i++) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !document.querySelector('[data-cursor-lens]'));
    check((await lensState()).count === 0 && (await lensState()).filterCount === 0, 'Reduced motion removes lens + filter');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('[data-cursor-lens]') && window.lensListenerCount() === 3);
    check((await lensState()).count === 1 && (await lensState()).listeners === 3, 'Live motion rebuild has one listener set');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => !document.querySelector('[data-custom-cursor]') && window.lensListenerCount() === 0);
    check((await lensState()).count === 0 && (await lensState()).listeners === 0, 'Mobile unmount cleans all lens listeners');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.querySelector('[data-cursor-lens]') && window.lensListenerCount() === 3);
    check((await lensState()).count === 1 && (await lensState()).listeners === 3, 'Desktop remount has one listener set');
  }
  check(await page.locator('canvas').count() === 1, 'No additional 3D Canvas');
  for (const width of [1023, 1024, 1920, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(width => !!document.querySelector('[data-cursor-lens]') === (width >= 1024), width);
    check((await lensState()).count === Number(width >= 1024), `Desktop-only breakpoint ${width}`);
    if (width >= 1024) { await pose('#work h2'); await hover('#work h2'); check((await lensState()).active, `Resized heading ${width}`); }
  }
  await page.evaluate(async () => { const { useLangStore } = await import('/src/stores/useLangStore.js'); useLangStore.getState().setLang('en'); });
  await page.waitForTimeout(1700); await pose('[data-project-image]'); await hover('[data-project-image]');
  check((await lensState()).active, 'English/autoSplit rebuild activates');
  check(await page.locator('[data-cursor-label]').textContent() === 'VIEW', 'VIEW label still translates');
  for (const options of [{ viewport: { width: 1440, height: 900 }, hasTouch: true }, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }]) {
    const ctx = await browser.newContext({ ...options, serviceWorkers: 'block' });
    const p = await ctx.newPage(); p.on('pageerror', e => report.errors.push(String(e)));
    await p.goto('http://127.0.0.1:5173/'); await p.locator('[data-preloader]').waitFor({ state: 'detached' }); await p.waitForTimeout(3500);
    if (options.hasTouch) await p.touchscreen.tap(100, 300);
    const active = await p.locator('[data-cursor-lens][data-active="true"]').count();
    check(active === 0, `Fresh ${options.hasTouch ? 'touch' : 'reduced'} never activates`);
    if (options.reducedMotion || options.isMobile) check(await p.locator('[data-cursor-lens]').count() === 0, 'Fresh mobile/reduced: no lens DOM');
    await ctx.close();
  }
  check(!report.requests.some(u => /\/lens.*\.(png|jpg|webp|svg)/.test(u)), 'No external displacement asset');
  check(report.errors.length === 0, 'No runtime/console errors');
  save(); console.log(JSON.stringify({ checks: report.checks.length, performance: report.performance, pixels: report.pixels, gpu: report.gpu, compositor: report.cdpDrawFrame, errors: report.errors }, null, 2));
} catch (error) { report.failure = String(error.stack); save(); throw error; }
finally { await browser.close(); }
