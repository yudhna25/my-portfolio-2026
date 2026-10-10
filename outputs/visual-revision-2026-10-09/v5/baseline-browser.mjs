import fs from 'node:fs';
import { chromium, base, out, ready, seek, poolSnapshot } from './browser-common.mjs';
fs.mkdirSync(out + '/skills-before', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1,
  reducedMotion: 'reduce', serviceWorkers: 'block' });
const page = await context.newPage(), report = { snapshots: {}, errors: [] };
await page.routeWebSocket('**', ws => ws.send('{"type":"connected"}'));
page.on('pageerror', e => report.errors.push(e.message));
await page.goto(base); await ready(page); await seek(page, 'skills', .2);
for (const id of ['figma','photoshop','illustrator','after-effects','premiere-pro','davinci-resolve','ai']) {
  await page.evaluate(id => { v5qa.skills.getState().clear(); v5qa.skills.getState().interact('selection', id); }, id);
  await page.waitForTimeout(180);
  report.snapshots[id] = await poolSnapshot(page);
  await page.screenshot({ path: out + '/skills-before/' + id + '.png' });
}
fs.writeFileSync(out + '/skills-before.json', JSON.stringify(report, null, 2));
await browser.close(); console.log('Saved 7 static Skills baseline states; errors:', report.errors.length);
