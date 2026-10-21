import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../../../', import.meta.url).pathname;
const data = JSON.parse(readFileSync(root + 'src/3d/data/symbolTargets.json'));
const browser = await chromium.launch({ });
const page = await browser.newPage();
const out = {};
for (const logo of data.logos) {
  const buf = readFileSync(root + logo.path), mime = logo.path.endsWith('.svg') ? 'image/svg+xml' : 'image/webp';
  const url = `data:${mime};base64,${buf.toString('base64')}`;
  const k = 512 / Math.max(logo.width, logo.height), w = Math.round(logo.width * k), h = Math.round(logo.height * k);
  out[logo.id] = await page.evaluate(async ({ url, w, h }) => {
    const img = new Image(); img.src = url; await img.decode();
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data; let s = ''; for (let i = 0; i < d.length; i++) s += String.fromCharCode(d[i]);
    return { w, h, rgba: btoa(s) };
  }, { url, w, h });
}
writeFileSync(process.argv[2], JSON.stringify(out));
await browser.close();
