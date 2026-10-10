import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, edge, base, out, openingObserver, openingSummary, capture, save, sha } from './common.mjs';

const build = JSON.parse(fs.readFileSync(out + '/build-source.json', 'utf8'));
for (const [file, hash] of Object.entries(build.source)) assert.equal(sha(file), hash, 'Source changed after build: ' + file);
const records = [], errors = [], warnings = [], expectedFaults = [];
let browser;
try {
  for (const [mode, widths] of [['slow-font', [390, 1440]], ['watchdog-font', [390]], ['failed-font', [390]], ['no-webgl', [390, 1440]], ['reduced', [390]]]) {
    browser = await chromium.launch({ executablePath: edge, headless: true, args: mode === 'no-webgl' ? ['--disable-webgl'] : [] });
    for (const width of widths) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, serviceWorkers: 'block', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
      let fontRequests = 0;
      if (mode.includes('font')) await context.route(/\.woff2(?:\?|$)/, async route => {
        fontRequests++;
        if (mode === 'failed-font') await route.abort('failed');
        else { await new Promise(resolve => setTimeout(resolve, mode === 'watchdog-font' ? 6000 : 1800)); await route.continue(); }
      });
      await openingObserver(context);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push({ mode, width, text: error.stack }));
      page.on('console', message => {
        const record = { mode, width, text: message.text() };
        if (message.type() === 'warning') warnings.push(record);
        if (message.type() === 'error') {
          if (mode === 'failed-font' && /ERR_FAILED|Failed to load resource/.test(record.text) || mode === 'no-webgl' && /WebGL|GL context|context creation/.test(record.text)) expectedFaults.push(record);
          else errors.push(record);
        }
      });
      await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('[data-preloader]') && !document.body.classList.contains('loading-lock'), undefined, { timeout: 12000 });
      await page.waitForTimeout(750);
      const opening = await page.evaluate(() => openingQA), summary = openingSummary(opening);
      const final = await page.evaluate(() => {
        const stage = document.querySelector('[data-portal-stage]'), year = stage.querySelector('[data-hero-year] svg'), box = year.getBoundingClientRect();
        return { canvas: document.querySelectorAll('canvas').length, fallback: Boolean(document.querySelector('[data-galaxy-scene]>[data-scene-fallback]')),
          heroOpacity: +getComputedStyle(stage).opacity, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          year: { x: box.x, width: box.width }, yearGlyphs: stage.querySelectorAll('[data-portal-year-glyph]').length,
          staticMotion: stage.dataset.staticMotion, pools: document.querySelectorAll('[data-portal-trails]').length };
      });
      const record = { mode, width, fontRequests, summary, final, frames: opening.frames }; records.push(record);
      assert.equal(final.overflow, 0, mode + ' overflow'); assert.equal(final.heroOpacity, 1, mode + ' final Hero');
      assert(final.year.x >= -1 && final.year.x + final.year.width <= width + 1 && final.yearGlyphs === 4, mode + ' readable full year');
      if (mode.includes('font')) assert(fontRequests > 0, 'Font fault scenario actually intercepted font requests');
      if (mode === 'slow-font') assert(summary.firstPresentationMs >= 1600 && summary.ready === 'scene-font', 'Delayed font waits before presentation');
      if (mode === 'watchdog-font') assert(summary.firstPresentationMs >= 4800 && summary.ready === 'watchdog', 'Long font delay actually uses the watchdog');
      if (mode !== 'reduced') assert(summary.revealFrames > 0 && summary.blankRevealFrames === 0 && summary.maximumRevealAlignmentPx < 3, mode + ' aligned revealing Hero');
      if (mode !== 'reduced') assert(summary.minimumPhotonSizeRatio > .93 && summary.maximumPhotonSizeRatio < .99, mode + ' actual photon ring shrinks to the measured O');
      if (mode === 'no-webgl') assert(final.fallback && final.canvas === 0 && final.staticMotion === 'true' && final.pools === 0, 'No-WebGL keeps static year and no intake copies');
      if (mode === 'reduced') { assert(final.staticMotion === 'true' && final.pools === 0, 'Reduced opens static'); assert(!summary.firstLoaderMs || summary.releaseMs - summary.firstLoaderMs <= 340, 'Reduced has no artificial opening wait'); }
      await capture(page, 'opening-' + mode + '-' + width); await context.close();
    }
    await browser.close(); browser = null;
  }
  assert.equal(errors.length, 0, JSON.stringify(errors));
  save('opening-fallback-results.json', { status: 'pass', source: build.source, records, errors, warnings, expectedFaults, limits: ['Fault injection is simulated. No native OS preference or physical phone check.', 'Failed-font network errors and disabled-WebGL context messages are injected faults, recorded separately.'] });
  console.log(JSON.stringify({ status: 'pass', cases: records.length, expectedFaults: expectedFaults.length }));
} catch (error) {
  save('opening-fallback-results.json', { status: 'fail', source: build.source, records, errors, warnings, expectedFaults, failure: error.stack });
  throw error;
} finally { await browser?.close(); }
