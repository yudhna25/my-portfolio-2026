import fs from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
const url = 'http://127.0.0.1:5191/';
const report = {
  startedAt: new Date().toISOString(), url,
  method: 'Fresh production preview, isolated Edge headless; installed Playwright. StarField POINTS draw submissions counted, not rAF. In-page instrumentation only, no source edits.',
  connectorLimits: { chrome: 'Chrome stable executable missing', cua: 'MXC G: os error 87' },
  hardware: { os: 'Windows', gpuReportedByOS: 'NVIDIA GeForce RTX 4060', driver: '32.0.16.1047', osRefreshHz: 164, osResolution: '1920x1080' },
  contexts: [], errors: [], warnings: [], responsesFailed: [],
};
const save = () => fs.writeFileSync(new URL('browser-results.json', out), JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browserVersion = browser.version();
try {
  for (const config of [
    { label: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    { label: 'mobile-viewport', viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  ]) {
    const { label, ...options } = config;
    const context = await browser.newContext({ ...options, reducedMotion: 'no-preference', serviceWorkers: 'block' });
    await context.addInitScript(() => {
      localStorage.setItem('stellar-theme', 'dark');
      window.__r0 = { measuring: false, starCount: 0, samples: [], drawCounts: {} };
      const draw = WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays = function (mode, first, count) {
        const m = window.__r0;
        if (m.measuring && mode === this.POINTS) {
          m.drawCounts[count] = (m.drawCounts[count] || 0) + 1;
          if (count === m.starCount) m.samples.push(performance.now());
        }
        return draw.call(this, mode, first, count);
      };
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push({ context: label, type: 'pageerror', message: String(error) }));
    page.on('console', msg => {
      if (msg.type() === 'error') report.errors.push({ context: label, type: 'console', message: msg.text() });
      if (msg.type() === 'warning') report.warnings.push({ context: label, message: msg.text() });
    });
    page.on('response', response => { if (response.status() >= 400) report.responsesFailed.push({ context: label, status: response.status(), url: response.url() }); });
    const record = { ...config, reducedMotion: 'explicit browser emulation: no-preference', serviceWorkers: 'blocked to avoid stale build', poses: [] };
    report.contexts.push(record);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.locator('[data-preloader]').waitFor({ state: 'detached', timeout: 15000 });
    await page.locator('[data-galaxy-scene] canvas').waitFor({ timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(5000);
    record.environment = await page.evaluate(() => {
      const canvas = document.querySelector('canvas'), gl = canvas.getContext('webgl2');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], devicePixelRatio,
        drawingBuffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
        quality: document.querySelector('[data-galaxy-scene]').dataset.quality,
        hidden: document.hidden, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        pointerFine: matchMedia('(pointer: fine)').matches, theme: document.documentElement.dataset.theme || 'dark',
        sections: [...document.querySelectorAll('#smooth-content section[id]')].map(e => ({ id: e.id, heading: e.querySelector('h1,h2')?.getAttribute('aria-label') || e.querySelector('h1,h2')?.textContent })),
        navLinks: [...document.querySelectorAll('header nav a[href]')].map(a => a.getAttribute('href')),
      };
    });
    for (const id of ['hero', 'about', 'skills', 'work', 'transmission']) {
      const targetY = await page.evaluate(id => {
        const content = document.querySelector('#smooth-content'), section = document.getElementById(id);
        return Math.min(Math.max(0, section.getBoundingClientRect().top - content.getBoundingClientRect().top - (id === 'hero' ? 0 : 84)), document.documentElement.scrollHeight - innerHeight);
      }, id);
      for (let attempt = 0; attempt < 8; attempt++) {
        const current = await page.evaluate(() => scrollY);
        if (Math.abs(current - targetY) < 2) break;
        await page.mouse.wheel(0, targetY - current);
        await page.waitForTimeout(450);
      }
      await page.waitForTimeout(2100);
      await page.mouse.move(2, 2);
      const pose = await page.evaluate(id => {
        const e = document.getElementById(id), r = e.getBoundingClientRect();
        const visible = selector => [...document.querySelectorAll(selector)].filter(n => { const s = getComputedStyle(n); return s.display !== 'none' && s.visibility !== 'hidden'; }).length;
        return { id, scrollY, rect: { top: r.top, height: r.height }, canvasCount: document.querySelectorAll('canvas').length,
          overflowX: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          cockpitVisible: visible('aside[aria-label*="Telemetry"],aside[aria-label*="Attitude"]'),
          lensCount: document.querySelectorAll('[data-cursor-lens]').length,
          glassCards: document.querySelectorAll('.glass-card').length,
          documentHidden: document.hidden, bodyColor: getComputedStyle(document.body).backgroundColor,
        };
      }, id);
      pose.targetScrollY = targetY;
      assert.equal(pose.canvasCount, 1, `${label} ${id}: Canvas count`);
      assert.equal(pose.documentHidden, false, 'Benchmark requires a visible document');
      const filename = `${label}-${id}.png`;
      await page.screenshot({ path: fileURLToPath(new URL(filename, out)) });
      pose.screenshot = filename;
      await page.evaluate(() => {
        const quality = document.querySelector('[data-galaxy-scene]').dataset.quality;
        window.__r0.starCount = { high: 24000, medium: 12000, low: 1500 }[quality];
        window.__r0.samples = []; window.__r0.drawCounts = {}; window.__r0.measuring = true;
      });
      await page.waitForTimeout(5000);
      const measurement = await page.evaluate(() => { window.__r0.measuring = false; return { samples: window.__r0.samples, starCount: window.__r0.starCount, pointDrawCounts: window.__r0.drawCounts }; });
      const intervals = measurement.samples.slice(1).map((v, i) => v - measurement.samples[i]);
      const sorted = [...intervals].sort((a, b) => a - b);
      const elapsed = measurement.samples.at(-1) - measurement.samples[0];
      pose.performance = { ...measurement, frames: measurement.samples.length, elapsedMs: elapsed,
        fps: intervals.length * 1000 / elapsed,
        medianFrameMs: sorted[Math.floor(sorted.length * 0.5)], p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
        slowFramesOver16_7Ms: intervals.filter(v => v > 16.7).length,
        scope: 'Stationary section pose, dynamic scene enabled, headless Edge on desktop GPU; not scrolling load or a real phone',
      };
      assert(measurement.samples.length > 20, `${label} ${id}: No actual StarField draw submissions`);
      record.poses.push(pose); save();
      console.log(JSON.stringify({ context: label, id, fps: pose.performance.fps, frames: pose.performance.frames, overflowX: pose.overflowX, screenshot: filename }));
    }
    record.projectCards = await page.locator('#work [data-project-card]').evaluateAll(cards => cards.map(e => ({ tag: e.tagName, href: e.getAttribute('href'), disabled: e.getAttribute('aria-disabled'), title: e.querySelector('h3')?.textContent })));
    await context.close();
  }
} catch (error) {
  report.fatal = String(error); process.exitCode = 1; console.error(error);
} finally {
  report.finishedAt = new Date().toISOString(); save(); await browser.close();
}
