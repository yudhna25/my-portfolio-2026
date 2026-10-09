import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
  await page.goto('http://127.0.0.1:5187/');
  await page.locator('[data-preloader]').waitFor({ state: 'detached' });
  await page.waitForTimeout(5200);
  let rect = await page.locator('#hero-heading').boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.waitForFunction(() => document.querySelector('[data-cursor-lens]')?.dataset.active === 'true');
  await page.locator('header nav a[href="#work"]').click();
  await page.waitForTimeout(2300);
  rect = await page.locator('[data-project-image]').first().boundingBox();
  await page.mouse.move(rect.x + rect.width / 2, Math.min(800, rect.y + rect.height * .35));
  await page.waitForFunction(() => document.querySelector('[data-cursor-lens]')?.dataset.active === 'true');
  const project = await page.evaluate(() => {
    const lens = document.querySelector('[data-cursor-lens]'), s = getComputedStyle(lens);
    return { filter: s.backdropFilter, clip: s.clipPath, width: lens.offsetWidth, height: lens.offsetHeight, canvas: document.querySelectorAll('canvas').length };
  });
  assert(project.width === 80 && project.height === 80 && project.canvas === 1 && project.filter.includes('cursor-gravity') && project.clip === 'circle(50%)');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => !document.querySelector('[data-cursor-lens]'));
  assert(errors.length === 0, JSON.stringify(errors));
  const result = { hero: true, project, reduced: true, errors };
  writeFileSync(new URL('production-smoke.json', import.meta.url), JSON.stringify(result, null, 2));
  console.log(result);
} finally { await browser.close(); }
