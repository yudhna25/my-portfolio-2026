import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const file = name => fileURLToPath(new URL(name, import.meta.url));
const labOnly = process.argv.includes('--lab-only');
const base = labOnly ? 'http://127.0.0.1:5173' : 'http://127.0.0.1:4173';
const report = { status: 'running', checkedAt: new Date().toISOString(), base, configurations: [], errors: [], limits: ['Compiled DOM/native scroll verification; no dev imports or source probes.', 'Phone viewport/reduced-motion emulated on desktop Edge; not physical phone.', 'Exact geometry/phase and GPU timing are in the dev matrix.'] };
mkdirSync(file('preview/'), { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browser = browser.version();
async function ready(page) {
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.waitForTimeout(1200);
}
async function state(page) {
  return page.evaluate(() => {
    const contentTop = document.querySelector('#smooth-content')?.getBoundingClientRect().top ?? 0;
    const finale = document.querySelector('[data-story-chapter="finale"]'), end = document.querySelector('[data-story-chapter="contact"]');
    const frame = document.querySelector('[data-work-background]'), copy = document.querySelector('[data-contact-content]');
    const top = finale?.getBoundingClientRect().top - contentTop, height = end?.getBoundingClientRect().top - contentTop - top;
    return { url: location.pathname + location.hash, canvas: document.querySelectorAll('canvas').length, focus: document.activeElement.id,
      y: -contentTop, nativeY: scrollY, finaleHeightVH: height / innerHeight, p: height ? Math.max(0, Math.min(1, (-contentTop - top) / height)) : null,
      labelOpacity: frame && +getComputedStyle(frame).opacity, copyOpacity: copy && +getComputedStyle(copy).opacity, copyInert: copy?.inert,
      selected: document.querySelector('[data-work-preview]')?.dataset.active, lang: document.documentElement.lang,
      reduced: matchMedia('(prefers-reduced-motion:reduce)').matches, overflow: document.documentElement.scrollWidth - innerWidth, title: document.title, history: history.state };
  });
}
async function seek(page, p) {
  await page.evaluate(p => {
    const contentTop = document.querySelector('#smooth-content').getBoundingClientRect().top;
    const finale = document.querySelector('[data-story-chapter="finale"]'), end = document.querySelector('[data-story-chapter="contact"]');
    const top = finale.getBoundingClientRect().top - contentTop, height = end.getBoundingClientRect().top - contentTop - top;
    scrollTo(0, top + height * p);
  }, p);
  await page.waitForTimeout(1600);
  const s = await state(page); assert(Math.abs(s.p - p) < .003, `native finale position ${s.p} vs ${p}`); return s;
}
try {
  for (const width of labOnly ? [] : process.argv.includes('--mobile-only') ? [390] : [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, hasTouch: width === 390, serviceWorkers: 'block' });
    const page = await context.newPage(), r = { width, poses: [], errors: [], warnings: [], routes: [] }; report.configurations.push(r);
    await page.addInitScript(() => {
      window.focusLog = [];
      const focus = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (...args) { window.focusLog.push({ event: 'focus()', id: this.id, at: performance.now(), stack: new Error().stack }); return focus.apply(this, args); };
      for (const type of ['focusin', 'popstate', 'hashchange']) addEventListener(type, e => window.focusLog.push({ event: type, id: e.target.id, at: performance.now(), active: document.activeElement.id, history: history.state }));
    });
    page.on('pageerror', e => r.errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') r.errors.push(m.text()); if (m.type() === 'warning') r.warnings.push(m.text()); });
    await page.goto(`${base}/#work`); await ready(page);
    const before = await state(page); assert.equal(before.selected, 'edura');
    for (const p of [.06, .25, .4, .58, .75, .95]) {
      const s = await seek(page, p); assert.equal(s.canvas, 1); assert.equal(s.overflow, 0); assert(Math.abs(s.finaleHeightVH - 2.25) < 1e-6);
      if (p >= .12) assert.equal(s.labelOpacity, 0); if (p < .88) assert.equal(s.copyOpacity, 0);
      r.poses.push(s); await page.screenshot({ path: file(`preview/${width}-${p}.png`) });
    }
    for (const p of [.75, .58, .4, .25, .06]) r.poses.push(await seek(page, p));
    await page.goto(`${base}/#work`); await ready(page);
    await page.evaluate(() => {
      const contentTop = document.querySelector('#smooth-content').getBoundingClientRect().top;
      const work = document.querySelector('[data-story-chapter="works"]');
      scrollTo(0, work.getBoundingClientRect().top - contentTop + work.getBoundingClientRect().height * .3);
    });
    await page.waitForTimeout(1800);
    const selected = await state(page);
    await page.locator('#work-case-edura').click(); await page.waitForSelector('[data-edura-reader]'); await page.waitForTimeout(800);
    const reader = await state(page); assert.equal(reader.canvas, 0); assert(reader.title.includes('EDURA')); r.routes.push(reader);
    await page.goBack(); await ready(page);
    try { await page.waitForFunction(() => document.activeElement.id === 'work-target-edura', undefined, { timeout: 5000 }); }
    catch (error) { r.focusDiagnostic = { state: await state(page), events: await page.evaluate(() => focusLog) }; throw error; }
    const restored = await state(page); r.routes.push(restored);
    assert.equal(restored.history.stellar.snapshot.chapter, 'works');
    assert.equal(restored.selected, 'edura'); assert.equal(restored.focus, 'work-target-edura'); assert(Math.abs(restored.y - selected.y) < 2);
    await page.goto(`${base}/#transmission`); await ready(page); let contact = await state(page);
    assert.equal(contact.copyOpacity, 1); assert.equal(contact.copyInert, false); assert.equal(contact.canvas, 1); r.routes.push(contact);
    await page.reload(); await ready(page); contact = await state(page); assert.equal(contact.copyOpacity, 1); assert.equal(contact.copyInert, false); r.routes.push(contact);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(900); contact = await state(page);
    assert.equal(contact.finaleHeightVH, 0); assert.equal(contact.copyOpacity, 1); r.reduced = contact;
    await page.screenshot({ path: file(`preview/${width}-contact-reduced.png`) });
    assert.equal(r.errors.length, 0, r.errors.join('\n')); report.errors.push(...r.errors); await context.close();
  }
  if (labOnly) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const page = await context.newPage(); report.lab = [];
    page.on('pageerror', e => report.errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    await page.goto(`${base}/3d-lab.html?story=1&chapter=finale&p=.58`); await ready(page);
    for (const p of [.25, .5, .75, 1, .5, 0]) {
      await page.locator(`[data-pose="${p}"]`).click(); await page.waitForTimeout(650);
      const pose = await page.locator('#lab-story-pose').evaluate(el => ({ position: el.dataset.position.split(',').map(Number), target: el.dataset.target.split(',').map(Number) }));
      assert(pose.position.every(Number.isFinite) && pose.target.every(Number.isFinite)); assert.equal(await page.locator('canvas').count(), 1); report.lab.push({ p, ...pose });
    }
    await page.goto(`${base}/3d-lab.html`); await ready(page); assert.equal(await page.locator('canvas').count(), 1);
    report.legacyFPS = await page.locator('#lab-fps').textContent(); assert.equal(report.errors.length, 0); await context.close();
  }
  report.status = 'pass';
} catch (error) { report.status = 'fail'; report.failure = { message: error.message, stack: error.stack }; process.exitCode = 1; }
finally { writeFileSync(file(labOnly ? 'lab-smoke.json' : 'preview-results.json'), JSON.stringify(report, null, 2)); await browser.close(); }
console.log(JSON.stringify({ status: report.status, configurations: report.configurations.length, failure: report.failure?.message }));
