import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://127.0.0.1:5173';
const production = !base.includes(':5173');
const widths = process.argv.includes('--subset') ? [390, 1440] : [320, 390, 768, 1440, 1920];
const prefix = production ? 'production-reader' : 'browser-reader';
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
const result = { status: 'running', base, checkedAt: new Date().toISOString(), browser: null, records: [], errors: [], warnings: [], limits: ['Preview-only callback verifies Return activation, not route/history/Back restoration.', 'Mobile viewport/touch/reduced motion simulated in desktop Edge; no physical phone or OS setting test.', 'Original-image/Behance href and target validated without visiting external Behance.'] };
const write = () => fs.writeFileSync(path.join(out, `${prefix}-results.json`), JSON.stringify(result, null, 2));
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
result.browser = browser.version();

async function snapshot(page) {
  return page.evaluate(() => {
    const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    const images = [...document.querySelectorAll('[data-edura-asset] img')].map(img => ({ id: img.closest('figure').dataset.eduraAsset, src: img.getAttribute('src'), alt: img.alt, htmlWidth: img.getAttribute('width'), htmlHeight: img.getAttribute('height'), loading: img.loading, decoding: img.decoding, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, complete: img.complete, filter: getComputedStyle(img).filter, fit: getComputedStyle(img).objectFit, ...rect(img) }));
    const headings = [...document.querySelectorAll('main h1,main h2,main h3')].map(node => ({ level: Number(node.tagName.slice(1)), text: node.textContent, id: node.id }));
    const prose = [...document.querySelectorAll('main p')].filter(node => !node.closest('figcaption') && !node.classList.contains('text-sm') && !node.classList.contains('font-mono')).map(node => ({ text: node.textContent.slice(0, 90), fontSize: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight), ...rect(node) }));
    const controls = [...document.querySelectorAll('[data-edura-reader] a,[data-edura-reader] button')].map(node => ({ text: node.textContent.trim(), label: node.getAttribute('aria-label'), href: node.getAttribute('href'), disabled: node.disabled ?? false, ...rect(node) }));
    return { lang: document.documentElement.lang, viewport: { width: innerWidth, height: innerHeight }, overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth), canvasCount: document.querySelectorAll('canvas').length, readerCount: document.querySelectorAll('[data-edura-reader]').length, mainCount: document.querySelectorAll('main').length, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, images, headings, prose, controls, scrollY, scrollHeight: document.documentElement.scrollHeight, text: document.querySelector('main').textContent, cls: window.__readerCLS || [] };
  });
}

try {
  for (const width of widths) for (const lang of ['vi', 'en']) for (const reduced of [false, true]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width <= 768, reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
    await context.addInitScript(() => {
      window.__readerCLS = [];
      new PerformanceObserver(list => { for (const e of list.getEntries()) window.__readerCLS.push({ value: e.value, hadRecentInput: e.hadRecentInput, startTime: e.startTime, nodes: (e.sources || []).map(source => source.node?.tagName) }); }).observe({ type: 'layout-shift', buffered: true });
    });
    const page = await context.newPage();
    const errors = [], warnings = [], requests = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); if (msg.type() === 'warning') warnings.push(msg.text()); });
    page.on('request', request => { if (request.url().includes('/projects/edura/')) requests.push({ url: request.url(), time: Date.now() }); });
    const record = { width, lang, reduced, errors, warnings, requests, keyboard: [], readPositions: [], initial: null, final: null };
    result.records.push(record); write();
    try {
      await page.goto(`${base}/?reader-preview=edura`, { waitUntil: 'domcontentloaded' });
      await page.locator('[data-edura-reader]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(850);
      record.initial = await snapshot(page);
      record.initialCLS = record.initial.cls.filter(entry => !entry.hadRecentInput).reduce((sum, entry) => sum + entry.value, 0);
      record.initialAssetRequestCount = requests.length;
      const languageButton = page.locator(`header button[aria-pressed]`).filter({ hasText: lang.toUpperCase() }).first();
      if (width <= 768) await languageButton.tap(); else await languageButton.click();
      await page.waitForFunction(expected => document.documentElement.lang === expected, lang);
      await page.waitForTimeout(100);
      let state = await snapshot(page);
      assert.equal(state.overflow, 0); assert.equal(state.canvasCount, 0); assert.equal(state.readerCount, 1); assert.equal(state.mainCount, 1);
      assert.equal(state.lang, lang); assert.equal(state.reduced, reduced); assert.equal(state.images.length, 3);
      assert.equal(state.headings.filter(h => h.level === 1).length, 1);
      for (let i = 1; i < state.headings.length; i++) assert(state.headings[i].level <= state.headings[i - 1].level + 1, 'Heading level skipped');
      assert(state.prose.length >= 10); assert(state.prose.every(p => p.fontSize >= 16 && p.lineHeight >= p.fontSize * 1.4));
      assert(state.controls.every(control => control.width >= 44 && control.height >= 44), 'Interactive target below44px');
      assert.deepEqual(state.images.map(img => img.id), ['A02', 'A07', 'A09']);
      assert.deepEqual(state.images.map(img => img.loading), ['eager', 'lazy', 'lazy']);
      for (const img of state.images) { assert.equal(img.htmlWidth, '1400'); assert.equal(img.htmlHeight, '989'); assert.equal(img.decoding, 'async'); assert.equal(img.filter, 'none'); assert.equal(img.fit, 'contain'); assert(img.alt.length > 25); assert(img.width <= 1400); assert(Math.abs(img.width / img.height - 1400 / 989) < 0.0002); }
      for (let step = 0; step < 30; step++) {
        const position = await page.evaluate(() => ({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight }));
        record.readPositions.push(position);
        assert.equal(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth)), 0);
        if (position.max - position.y < 2) break;
        await page.mouse.wheel(0, 700); await page.waitForTimeout(100);
      }
      assert(record.readPositions.at(-1).max - record.readPositions.at(-1).y < 2, 'Native wheel did not reach reader footer');
      await page.locator('[data-edura-asset] img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
      record.colors = await page.locator('[data-edura-asset] img').evaluateAll(images => images.map(img => {
        const canvas = new OffscreenCanvas(80, 56); const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 80, 56);
        const pixels = ctx.getImageData(0, 0, 80, 56).data; let chromatic = 0;
        for (let i = 0; i < pixels.length; i += 4) if (Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]) > 8) chromatic++;
        return { id: img.closest('figure').dataset.eduraAsset, chromaticPixels: chromatic, filter: getComputedStyle(img).filter, width: img.naturalWidth, height: img.naturalHeight };
      }));
      assert(record.colors.every(image => image.chromaticPixels > 100 && image.width === 1400 && image.height === 989 && image.filter === 'none'));
      assert.equal(new Set(requests.map(request => request.url)).size, 3, 'All three actual images must be requested');
      const originals = await page.locator('[data-edura-asset] a').evaluateAll(links => links.map(link => ({ href: link.getAttribute('href'), target: link.target, rel: link.rel, label: link.getAttribute('aria-label') })));
      assert.deepEqual(originals.map(link => link.href), ['/projects/edura/overview.webp', '/projects/edura/problem.webp', '/projects/edura/solution.webp']);
      assert(originals.every(link => link.target === '_blank' && link.rel.includes('noopener') && link.rel.includes('noreferrer') && link.label.length > 30)); record.originals = originals;
      record.behance = await page.locator('footer a').evaluate(link => ({ href: link.href, target: link.target, rel: link.rel }));
      assert.equal(record.behance.href, 'https://www.behance.net/gallery/241524417/Edura-LMS'); assert.equal(record.behance.target, '_blank'); assert(record.behance.rel.includes('noopener'));
      await languageButton.click();
      for (let step = 0; step < 4; step++) { if (await page.evaluate(() => document.activeElement?.getAttribute('href') === '#edura-main')) break; await page.keyboard.press('Shift+Tab'); }
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '#edura-main');
      record.skipFocused = await page.evaluate(() => ({ text: document.activeElement.textContent, rect: document.activeElement.getBoundingClientRect().toJSON(), outline: getComputedStyle(document.activeElement).outlineWidth }));
      assert(record.skipFocused.rect.y >= 0 && record.skipFocused.outline === '2px');
      await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => document.activeElement.id), 'edura-main');
      for (let step = 0; step < 5; step++) { await page.keyboard.press('Shift+Tab'); if (await page.evaluate(() => document.activeElement?.getAttribute('href') === '#edura-main')) break; }
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('href')), '#edura-main');
      let returns = 0;
      for (let step = 0; step < 8; step++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => ({ tag: document.activeElement.tagName, text: document.activeElement.textContent.trim(), href: document.activeElement.getAttribute('href'), returned: document.activeElement.hasAttribute('data-edura-return'), outline: getComputedStyle(document.activeElement).outlineWidth }));
        record.keyboard.push(focused); assert(['A', 'BUTTON'].includes(focused.tag)); assert.equal(focused.outline, '2px');
        if (focused.returned) { await page.keyboard.press('Enter'); returns++; }
      }
      assert.equal(returns, 2); assert.equal(await page.evaluate(() => window.__readerReturnClicks), 2);
      const opposite = lang === 'vi' ? 'en' : 'vi';
      const oppositeButton = page.locator('header button[aria-pressed]').filter({ hasText: opposite.toUpperCase() }).first();
      if (width <= 768) await oppositeButton.tap(); else await oppositeButton.click();
      await page.waitForFunction(expected => document.documentElement.lang === expected, opposite);
      record.languageChanged = await page.locator('main').innerText();
      assert.notEqual(record.languageChanged, state.text);
      if (width <= 768) await languageButton.tap(); else await languageButton.click();
      await page.waitForFunction(expected => document.documentElement.lang === expected, lang);
      await page.locator('[data-edura-return]').first()[width <= 768 ? 'tap' : 'click']();
      assert.equal(await page.evaluate(() => window.__readerReturnClicks), 3);
      record.final = await snapshot(page); assert.equal(record.final.overflow, 0); assert.equal(record.final.canvasCount, 0);
      record.allCLS = record.final.cls.filter(entry => !entry.hadRecentInput).reduce((sum, entry) => sum + entry.value, 0);
      if ([390, 1440].includes(width)) {
        await page.keyboard.press('Control+Home'); await page.waitForTimeout(100);
        record.screenshot = `screenshots/${prefix}-${width}-${lang}-${reduced ? 'reduced' : 'normal'}.png`;
        await page.screenshot({ path: path.join(out, record.screenshot), fullPage: true });
      }
      assert.deepEqual(errors, []); record.status = 'pass';
      result.warnings.push(...warnings.map(text => ({ width, lang, reduced, text })));
      console.log(JSON.stringify({ width, lang, reduced, status: 'pass', initialCLS: record.initialCLS, assetRequests: requests.length, keyboard: record.keyboard.length, readSteps: record.readPositions.length }));
    } catch (error) { record.status = 'fail'; record.failure = String(error); throw error; }
    finally { write(); await context.close(); }
  }
  result.status = 'pass';
} catch (error) { result.status = 'fail'; result.errors.push(String(error)); process.exitCode = 1; }
finally { await browser.close(); write(); }
console.log(JSON.stringify({ status: result.status, records: result.records.length, errors: result.errors }));
