import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js';
import { chromium, edge, base, ready, scrollChapter, scene, sha } from '../qa/common.mjs';
import { meteorReadingY } from '../../../../src/3d/utils/storyMeteor.js';

const stage = process.env.QA_CALIBRATION_STAGE ?? 'pre-final diagnostic intake-v1 build';
const run = stage.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const out = new URL('./pixel-calibration/' + run + '/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
const sourceFiles = ['src/3d/utils/storyMeteor.js', 'src/3d/components/StoryMeteor.jsx', 'src/components/sections/Experience.jsx'];
const source = Object.fromEntries(sourceFiles.map(file => [file, sha(file)]));
const build = JSON.parse(fs.readFileSync(new URL('../build-source.json', import.meta.url)));
for (const file of sourceFiles) assert.equal(source[file], build.source[file], 'Comet source must match current built snapshot: ' + file);
const report = { date: '10/10/2026', base, status: 'running', stage,
  source, buildAt: build.at, records: [], errors: [], warnings: [], requests: [],
  method: 'Same page, same native scroll pose. Lit screenshot minus screenshot after temporarily hiding ONLY named head mesh; root remains visible, trail/DOM/wake/camera unchanged. Head is restored after capture. CSS pixels, radial medians over72 rays. Core: lit luminance>=230/255 and head difference>=32/255. Halo: head-only luminance difference>=20/255 (7.84%), continuous radius from center. Core edge:80%→20% radial head contrast above the local halo floor measured outside the core. Geometric plane support is not counted as light size. Radius quantization gives about±2px diameter precision.',
  limits: ['Not final integrated visual acceptance unless repeated against the final rebuilt source.', 'No FPS/GPU benchmark, no physical-phone or OS-motion evidence. Background subtraction can undercount saturated DOM/ambient pixels; radial median reduces that effect.'] };
const browser = await chromium.launch({ executablePath: edge, headless: true });
report.browser = browser.version();
const luma = (png, x, y) => {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return null;
  const offset = (y * png.width + x) * 4;
  return .2126 * png.data[offset] + .7152 * png.data[offset + 1] + .0722 * png.data[offset + 2];
};
const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
function measure(litBuffer, backgroundBuffer, state, uniform) {
  const lit = PNG.sync.read(litBuffer), dark = PNG.sync.read(backgroundBuffer);
  const profiles = [];
  for (let radius = 0; radius <= Math.ceil(uniform.diameter / 2); radius++) {
    const values = [], deltas = [];
    for (let ray = 0; ray < 72; ray++) {
      const angle = ray * Math.PI / 36;
      const x = state.meteor.x + Math.cos(angle) * radius, y = state.meteor.y + Math.sin(angle) * radius;
      const a = luma(lit, x, y), b = luma(dark, x, y);
      if (a !== null && b !== null) { values.push(a); deltas.push(Math.max(0, a - b)); }
    }
    profiles.push({ radius, lit: median(values), headOnly: median(deltas), rays: values.length });
  }
  const lastRadius = predicate => {
    let end = 0;
    for (const ring of profiles) { if (!predicate(ring)) break; end = ring.radius; }
    return end;
  };
  const coreRadius = lastRadius(ring => ring.lit >= 230 && ring.headOnly >= 32);
  const haloRadius = lastRadius(ring => ring.headOnly >= 20);
  const haloFloor = median(profiles.slice(Math.ceil(uniform.core * .60), Math.ceil(uniform.core * .80)).map(ring => ring.headOnly));
  const coreContrast = Math.max(1, profiles[0].headOnly - haloFloor);
  const at80 = lastRadius(ring => ring.headOnly >= haloFloor + .8 * coreContrast);
  const at20 = lastRadius(ring => ring.headOnly >= haloFloor + .2 * coreContrast);
  return { coreDiameterCss: 2 * coreRadius + 1, haloDiameterCss: 2 * haloRadius + 1,
    edge80to20Css: at20 - at80, haloFloor, centerHeadLuminance: profiles[0].headOnly,
    profiles, image: { width: lit.width, height: lit.height } };
}
try {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1024, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.stack));
    page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); if (message.type() === 'warning') report.warnings.push(message.text()); });
    page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) report.requests.push({ url: response.url(), status: response.status() }); });
    await page.goto(base); await ready(page); await page.waitForTimeout(500);
    await scrollChapter(page, 'experience', .02);
    const layout = await page.evaluate(() => {
      const root = document.querySelector('#experience'), box = root.getBoundingClientRect();
      const departure = root.querySelector('[data-story-chapter="departure"]').getBoundingClientRect();
      return { width: innerWidth, height: innerHeight, range: departure.top - box.top,
        milestones: [...root.querySelectorAll('[data-meteor-label]')].map(label => label.getBoundingClientRect().top - box.top - 24) };
    });
    for (let index = 0; index < 3; index++) {
      let low = 0, high = 1;
      for (let i = 0; i < 60; i++) { const middle = (low + high) / 2; if (meteorReadingY(layout, middle) < layout.milestones[index]) low = middle; else high = middle; }
      const p = (low + high) / 2;
      await scrollChapter(page, 'experience', p); await page.waitForTimeout(250);
      const state = await scene(page);
      const uniform = await page.evaluate(() => {
        const root = motionQA.root.getState(), u = root.scene.getObjectByName('story-meteor-head').material.uniforms;
        return { core: u.uCore.value, halo: u.uHalo.value, diameter: u.uDiameter.value, flare: u.uFlare.value,
          dpr: root.gl.getPixelRatio(), labels: [...document.querySelectorAll('[data-meteor-label]')].map(label => ({ text: label.textContent,
            opacity: getComputedStyle(label).opacity, rect: label.getBoundingClientRect().toJSON() })) };
      });
      assert(state.meteor.visible && state.chapter === 'experience');
      const name = `comet-${width}-company-${index + 1}`;
      const litBuffer = await page.screenshot({ path: new URL(name + '-lit.png', out).pathname.replace(/^\/([A-Za-z]:)/, '$1'), scale: 'css' });
      await page.evaluate(async () => {
        const head = motionQA.root.getState().scene.getObjectByName('story-meteor-head');
        window.cometPixelHead = { head, visible: head.visible }; head.visible = false;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      let darkBuffer;
      try { darkBuffer = await page.screenshot({ path: new URL(name + '-background.png', out).pathname.replace(/^\/([A-Za-z]:)/, '$1'), scale: 'css' }); }
      finally { await page.evaluate(() => { cometPixelHead.head.visible = cometPixelHead.visible; delete window.cometPixelHead; }); }
      const metrics = measure(litBuffer, darkBuffer, state, uniform);
      const withinCore = width < 768 ? metrics.coreDiameterCss >= 27 && metrics.coreDiameterCss <= 35 : metrics.coreDiameterCss >= 48 && metrics.coreDiameterCss <= 56;
      const withinHalo = width < 768 ? metrics.haloDiameterCss >= 110 && metrics.haloDiameterCss <= 145 : metrics.haloDiameterCss >= 200 && metrics.haloDiameterCss <= 240;
      report.records.push({ width, height, company: index + 1, requestedProgress: p, actualProgress: state.p,
        head: { x: state.meteor.x, y: state.meteor.y }, tailRatio: state.meteor.tailPixels / width, uniform,
        metrics, withinCore, withinHalo, screenshots: { lit: name + '-lit.png', background: name + '-background.png' } });
      console.log(JSON.stringify({ width, company: index + 1, core: metrics.coreDiameterCss, halo: metrics.haloDiameterCss,
        edge: metrics.edge80to20Css, withinCore, withinHalo, tail: state.meteor.tailPixels / width }));
      fs.writeFileSync(new URL('./pixel-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
    }
    await context.close();
  }
  report.status = report.records.every(record => record.withinCore && record.withinHalo) && !report.errors.length && !report.requests.length ? 'pass' : 'needs-review';
} catch (error) { report.status = 'error'; report.failure = error.stack; throw error; }
finally { await browser.close();
  fs.writeFileSync(new URL('./pixel-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(new URL('./pixel-results-' + run + '.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
}
