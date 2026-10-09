import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out = 'outputs/redesign/r3.3', results = { started: new Date().toISOString(), records: [], errors: [], warnings: [] };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  for (const width of [1440, 390]) for (const motion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: motion, hasTouch: width === 390, isMobile: width === 390 });
    const page = await context.newPage();
    page.on('pageerror', error => results.errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') results.errors.push(message.text()); if (message.type() === 'warning') results.warnings.push(message.text()); });
    await page.goto('http://127.0.0.1:4173/#about');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1250);
    for (const locale of ['vi', 'en']) {
      if (locale === 'en') {
        await page.locator('button[aria-haspopup="dialog"]').focus(); await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('dialog')?.open);
        await page.getByRole('button', { name: 'English', exact: true }).click();
        await page.keyboard.press('Escape'); await page.waitForTimeout(1200);
      }
      const state = await page.evaluate(async () => {
        const image = document.querySelector('.avatar-img'), button = document.querySelector('#about button'), reading = document.querySelector('[data-story-content]');
        const bytes = await (await fetch(image.src)).arrayBuffer();
        return { lang: document.documentElement.lang, hash: location.hash, canvas: document.querySelectorAll('canvas').length, overflow: document.documentElement.scrollWidth - innerWidth,
          visible: getComputedStyle(reading).visibility, inert: reading.inert, image: [image.naturalWidth, image.naturalHeight], src: image.getAttribute('src'), bytes: [...new Uint8Array(bytes)],
          name: document.querySelector('#about-heading').getAttribute('aria-label'), button: button.getAttribute('aria-label'), pressed: button.getAttribute('aria-pressed'),
          theme: document.documentElement.dataset.theme, sw: !!navigator.serviceWorker.controller, registrations: (await navigator.serviceWorker.getRegistrations()).length };
      });
      state.sha256 = crypto.createHash('sha256').update(Buffer.from(state.bytes)).digest('hex'); delete state.bytes;
      assert.equal(state.lang, locale); assert.equal(state.hash, '#about'); assert.equal(state.canvas, 1); assert.equal(state.overflow, 0);
      assert.equal(state.visible, 'visible'); assert.equal(state.inert, false); assert.deepEqual(state.image, [800, 1000]); assert.equal(state.src, '/avatar-cutout.webp');
      assert.equal(state.sha256, '6b2fea6dcbd2bd204fc0aa6c545cbe7a696670fc4532c992378c3393d53b511f'); assert.equal(state.theme, 'dark'); assert.ok(state.registrations >= 1);
      const portrait = page.locator('#about button');
      if (width === 390) await portrait.tap(); else { await portrait.focus(); await page.keyboard.press('Enter'); }
      assert.equal(await portrait.getAttribute('aria-pressed'), 'true'); assert.equal(await page.locator('.avatar-img').evaluate(e => getComputedStyle(e).filter), 'grayscale(0)');
      if (width === 390) await portrait.tap(); else await page.keyboard.press('Space');
      assert.equal(await portrait.getAttribute('aria-pressed'), 'false');
      results.records.push({ width, motion, locale, ...state, interaction: width === 390 ? 'two native taps' : 'native Enter / Space' });
      await page.screenshot({ path: `${out}/screenshots/production-${width}-${locale}-${motion}.png` });
    }
    await context.close();
  }
  assert.deepEqual(results.errors, []); results.finished = new Date().toISOString();
  fs.writeFileSync(`${out}/preview-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: 'PASS', records: results.records.length, errors: results.errors, warnings: [...new Set(results.warnings)] }));
} catch (error) { results.failure = error.stack; fs.writeFileSync(`${out}/preview-failure.json`, JSON.stringify(results, null, 2)); throw error; }
finally { await browser.close(); }
