import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
page.on('pageerror', e => console.log('PAGE ERROR', e.message));
await page.goto('http://127.0.0.1:5181', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => document.querySelector('[data-portal-stage]')?.dataset.heroIdle === 'true');
await page.waitForTimeout(900);
console.log(await page.evaluate(() => {
  const box = selector => {
    const e = document.querySelector(selector), r = e.getBoundingClientRect(), c = getComputedStyle(e);
    return { x:r.x, y:r.y, width:r.width, height:r.height, font:c.fontSize, stroke:c.strokeWidth, vector:c.vectorEffect, color:c.color };
  };
  return { svg:box('svg.hero-year-svg'), h1:box('h1'), anchor:box('[data-story-anchor]'), name:box('[data-hero-name]'), role:box('[data-hero-role]'), text:box('svg.hero-year-svg text'), intro:box('[data-hero-layer="intro"]'), overflow:document.documentElement.scrollWidth-innerWidth };
}));
await page.screenshot({path:'outputs/visual-revision-2026-10-09/v1/screenshots/initial-1440.png'});
await browser.close();
