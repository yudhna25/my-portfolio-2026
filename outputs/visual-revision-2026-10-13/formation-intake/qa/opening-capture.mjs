import assert from 'node:assert/strict';
import { chromium, edge, base, capture, save } from './common.mjs';
const browser = await chromium.launch({ executablePath: edge, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
const errors = [], records = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  for (const p of [.08, .20, .32, .42, .52, .65, .8, .9, .99]) {
    await page.waitForFunction(p => Number(document.querySelector('[data-preloader]')?.dataset.openingProgress) >= p, p);
    const record = await page.locator('[data-preloader]').evaluate(n => ({ p: +n.dataset.openingProgress, duration: +n.dataset.openingDuration }));
    assert(record.p < p + .12, 'Natural capture missed formation checkpoint');
    await capture(page, 'opening-' + String(p).replace('.', '-'));
    records.push(record);
  }
  assert.equal(errors.length, 0, errors.join('\n'));
  save('opening-capture.json', { records, errors, method: 'Natural running presentation, no timeline seeking' });
} finally { await browser.close(); }
