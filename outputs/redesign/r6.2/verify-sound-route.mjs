import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base = process.argv[2] ?? 'http://127.0.0.1:4173';
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(base));
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
const page = await context.newPage();
const result = { base, browser: browser.version(), testedUTC: new Date().toISOString(), records: [], errors: [], warnings: [] };
page.on('pageerror', (error) => result.errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') result.errors.push(message.text()); if (message.type() === 'warning') result.warnings.push(message.text()); });
await page.addInitScript(() => {
  window.__soundContexts = [];
  const Native = window.AudioContext;
  window.AudioContext = class extends Native {
    constructor(...args) { super(...args); window.__soundContexts.push(this); }
  };
  window.__soundDocument = Math.random();
});
const sample = async (label) => {
  const state = await page.evaluate(() => ({ url: location.pathname + location.hash, doc: window.__soundDocument, active: document.querySelector('[data-sound-toggle]')?.getAttribute('aria-checked'), contextStates: window.__soundContexts.map((context) => context.state), preference: JSON.parse(localStorage.getItem('stellar-audio') ?? 'null'), canvas: document.querySelectorAll('canvas').length }));
  result.records.push({ label, ...state }); return state;
};
async function enterCase() {
  for (let step = 0; step < 12; step++) {
    if (await page.evaluate(() => document.activeElement?.id === 'work-case-edura')) {
      await page.keyboard.press('Enter');
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error('Native Tab did not reach EDURA case action');
}
try {
  await page.goto(`${base}/projects/edura`);
  await page.waitForSelector('[data-edura-reader]');
  let state = await sample('direct-case-no-consent');
  assert.equal(state.active, 'false'); assert.equal(state.contextStates.length, 0);
  await page.locator('[data-sound-toggle]').click();
  await page.waitForFunction(() => document.querySelector('[data-sound-toggle]')?.getAttribute('aria-checked') === 'true');
  state = await sample('trusted-sound-click-direct-case');
  const documentID = state.doc;
  assert.deepEqual(state.contextStates, ['running']); assert.equal(state.preference.state.isMuted, false);
  await page.locator('[data-edura-return]').first().click();
  await page.waitForSelector('#work-target-edura');
  await page.waitForFunction(() => !!document.querySelector('canvas') && !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.waitForFunction(() => document.activeElement?.id === 'work-target-edura');
  if (await page.locator('#work-target-edura').getAttribute('aria-pressed') !== 'true') await page.locator('#work-target-edura').click();
  state = await sample('first-return-main');
  assert.equal(state.doc, documentID); assert.equal(state.canvas, 1); assert.equal(state.active, 'true');
  assert.deepEqual(state.contextStates, ['running']); assert.equal(state.preference.state.isMuted, false);
  for (let cycle = 1; cycle <= 3; cycle++) {
    await enterCase();
    await page.waitForSelector('[data-edura-reader]');
    state = await sample(`case-${cycle}`);
    assert.equal(state.doc, documentID); assert.equal(state.canvas, 0); assert.equal(state.active, 'true'); assert.deepEqual(state.contextStates, ['running']); assert.equal(state.preference.state.isMuted, false);
    await page.locator('[data-edura-return]').first().click();
    await page.waitForSelector('#work-case-edura');
    await page.waitForFunction(() => !!document.querySelector('canvas') && !document.body.classList.contains('loading-lock'));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.waitForFunction(() => document.activeElement?.id === 'work-target-edura');
    state = await sample(`return-${cycle}`);
    assert.equal(state.doc, documentID); assert.equal(state.canvas, 1); assert.equal(state.active, 'true'); assert.deepEqual(state.contextStates, ['running']); assert.equal(state.preference.state.isMuted, false);
  }
  await enterCase();
  await page.waitForSelector('[data-edura-reader]');
  await page.reload();
  await page.waitForSelector('[data-edura-reader]');
  state = await sample('reload-case-saved-on-no-autoplay');
  assert.notEqual(state.doc, documentID); assert.equal(state.preference.state.isMuted, false); assert.equal(state.active, 'false'); assert.equal(state.contextStates.length, 0);
  await page.locator('[data-sound-toggle]').click();
  await page.waitForFunction(() => document.querySelector('[data-sound-toggle]')?.getAttribute('aria-checked') === 'true');
  state = await sample('trusted-sound-click-case');
  assert.deepEqual(state.contextStates, ['running']);
  await page.locator('[data-sound-toggle]').click();
  await page.waitForFunction(() => window.__soundContexts[0]?.state === 'suspended');
  state = await sample('mute-case');
  assert.equal(state.active, 'false'); assert.equal(state.preference.state.isMuted, true);
  await page.locator('[data-edura-return]').first().click();
  await page.waitForSelector('#work-case-edura');
  await page.waitForTimeout(800);
  state = await sample('muted-return-main');
  assert.equal(state.active, 'false'); assert.equal(state.preference.state.isMuted, true); assert.deepEqual(state.contextStates, ['suspended']);
  assert.deepEqual(result.errors, []);
  result.status = 'pass';
  console.log('PASS: trusted Sound opt-in, same running AudioContext across 3 native Tab/Enter route + Return click cycles, saved ON reload has no autoplay, muted preference preserved');
} catch (error) { result.status = 'failed'; result.error = error.message; await sample('failure-state'); await page.screenshot({ path: resolve(import.meta.dirname, 'sound-route-failure.png') }); throw error; }
finally { await context.close(); await browser.close(); await writeFile(resolve(import.meta.dirname, 'sound-route-results.json'), JSON.stringify(result, null, 2)); }
