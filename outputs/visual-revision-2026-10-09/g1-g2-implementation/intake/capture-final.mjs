import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, edge, base, out, ready, scrollChapter, scene, sha } from '../qa/common.mjs';

const directory = `${out}/intake/final-images`;
fs.mkdirSync(directory, { recursive: true });
const build = JSON.parse(fs.readFileSync(`${out}/build-source.json`, 'utf8'));
for (const [file, hash] of Object.entries(build.source)) assert.equal(sha(file), hash, `Frozen source changed: ${file}`);
const report = { base, started: new Date().toISOString(), build: sha(`${out}/build-source.json`), cases: [], errors: [], warnings: [], missing: [] };
const browser = await chromium.launch({ executablePath: edge, headless: true });
try {
  for (const [width, height] of [[320, 760], [1440, 900]]) {
    if (process.env.QA_FOCUS_WIDTH && width !== +process.env.QA_FOCUS_WIDTH) continue;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width === 320, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.stack));
    page.on('console', message => {
      if (message.type() === 'error') report.errors.push(message.text());
      if (message.type() === 'warning') report.warnings.push(message.text());
    });
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) report.missing.push({ url: response.url(), status: response.status() }); });
    await page.goto(base); await ready(page);
    if (width === 1440) await page.mouse.move(460, 440);
    for (const [direction, progress] of [['forward', .05], ['forward', .10], ['forward', .16], ['forward', .22], ['forward', .28], ['reverse', .10]]) {
      await scrollChapter(page, 'portal', progress);
      const state = await scene(page);
      const decoration = await page.evaluate(() => ({
        nav: (() => { const node = document.querySelector('[data-portal-controls] nav'), style = getComputedStyle(node);
          return { background: style.backgroundColor, border: style.borderBottomColor, backdrop: style.backdropFilter,
            transform: style.transform, absorbing: node.parentElement.dataset.absorbing, inert: node.parentElement.inert }; })(),
        pools: [...document.querySelectorAll('[data-portal-trails]')].map(layer => ({
          className: layer.className, hidden: layer.hidden, mask: layer.style.maskImage,
          inert: layer.inert, ariaHidden: layer.getAttribute('aria-hidden'),
          copies: layer.querySelectorAll('.portal-trail-copy').length,
          primarySamples: [...layer.querySelectorAll('.portal-trail-copy')].filter((_, index) => index % (+layer.dataset.copyCount / +layer.dataset.sourceCount) === 0)
            .slice(0, 16).map(node => ({ transform: node.style.transform, opacity: node.style.opacity })),
          common: layer.querySelector('.portal-trail-common')?.getAttribute('d') ?? null,
          ids: layer.querySelectorAll('[id]').length,
          handlers: [...layer.querySelectorAll('*')].flatMap(node => [...node.attributes].filter(attribute => /^on/.test(attribute.name))).length,
        })),
      }));
      const file = `${directory}/portal-${progress.toFixed(2)}-${direction}-${width}.png`;
      await page.screenshot({ path: file });
      assert.equal(state.overflow, 0); assert.equal(state.canvas, 1); assert.equal(state.glError, 0);
      assert(decoration.nav.inert && decoration.nav.absorbing === 'true');
      assert.equal(decoration.nav.background, 'rgba(0, 0, 0, 0)');
      assert.equal(decoration.nav.border, 'rgba(0, 0, 0, 0)');
      assert(decoration.pools.every(pool => pool.inert && pool.ariaHidden === 'true' && pool.ids === 0 && pool.handlers === 0));
      report.cases.push({ width, height, direction, requested: progress, actual: state.p, file, sha256: sha(file),
        chapter: state.chapter, manual: state.manual, overflow: state.overflow, canvas: state.canvas, glError: state.glError,
        anchor: state.anchor, resources: state.resources, copies: state.copies, decoration });
    }
    await context.close();
  }
} finally { await browser.close(); }
for (const width of [320, 1440]) {
  const forward = report.cases.find(item => item.width === width && item.direction === 'forward' && item.requested === .1);
  const reverse = report.cases.find(item => item.width === width && item.direction === 'reverse');
  if (!forward || !reverse) continue;
  report.cases.find(item => item === reverse).sameDecorationAtReverse =
    JSON.stringify(forward.decoration.pools.map(item => item.primarySamples)) === JSON.stringify(reverse.decoration.pools.map(item => item.primarySamples));
}
assert.equal(report.errors.length, 0); assert.equal(report.missing.length, 0);
fs.writeFileSync(`${out}/intake/final-capture.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ cases: report.cases.length, errors: report.errors, missing: report.missing, reverse: report.cases.filter(item => item.direction === 'reverse').map(item => ({ width: item.width, same: item.sameDecorationAtReverse })), file: `${out}/intake/final-capture.json` }));
