import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const url = 'https://www.behance.net/gallery/241524417/Edura-LMS';
const result = { url, checkedAt: new Date().toISOString(), errors: [] };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  result.browser = browser.version();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => result.errors.push(String(error)));
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  result.status = response?.status();
  await page.waitForTimeout(3000);
  result.finalUrl = page.url();
  result.title = await page.title();
  result.text = await page.locator('body').innerText();
  result.images = await page.locator('img').evaluateAll(images => images.map(image => ({ src: image.currentSrc || image.src, alt: image.alt })));
  fs.writeFileSync(new URL('behance-page.html', import.meta.url), await page.content());
  await page.screenshot({ path: new URL('behance-access.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1') });
} catch (error) {
  result.errors.push(String(error));
} finally {
  fs.writeFileSync(new URL('behance-access.json', import.meta.url), JSON.stringify(result, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ status: result.status, title: result.title, imageCount: result.images?.length, errors: result.errors }));
