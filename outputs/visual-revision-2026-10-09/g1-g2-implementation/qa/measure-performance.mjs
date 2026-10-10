import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, edge, base, out, sha, ready, scrollChapter, save } from './common.mjs';
const build=JSON.parse(fs.readFileSync(out+'/build-source.json','utf8'));
for(const [file,hash]of Object.entries(build.source))assert.equal(sha(file),hash,file);

const browser = await chromium.launch({ executablePath: edge, headless: true });
const records = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await page.goto(base); await ready(page, { opening: true });
  const observe = async (label, duration, scroll = 0) => {
    await page.evaluate(() => {
      const root = motionQA.root.getState(), frames = [], started = performance.now();
      const remove = root.internal.subscribe({ current: () => frames.push(performance.now()) }, -100, { getState: root.get });
      window.motionFPS = { root, frames, started, remove };
    });
    if (scroll) await page.mouse.wheel(0, scroll);
    await page.waitForTimeout(duration);
    const record = await page.evaluate(label => {
      const sample = motionFPS, elapsed = performance.now() - sample.started; sample.remove();
      const times = sample.frames.slice(1).map((value, index) => value - sample.frames[index]).sort((a, b) => a - b);
      const gl = sample.root.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { label, elapsed, frames: sample.frames.length, fps: sample.frames.length * 1000 / elapsed,
        frameMs: { p50: times[Math.floor(times.length * .5)], p95: times[Math.floor(times.length * .95)], p99: times[Math.floor(times.length * .99)], maximum: times.at(-1), over16: times.filter(time => time > 16.7).length },
        dpr: sample.root.gl.getPixelRatio(), resources: { ...sample.root.gl.info.memory }, subscribers: sample.root.internal.subscribers.length,
        gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), glError: gl.getError() };
    }, label);
    records.push(record);
    save('performance-results.json', {status:'measured',records});
    console.log(JSON.stringify(record));
  };
  await page.waitForFunction(()=>document.querySelector('[data-preloader]')?.dataset.openingDuration);
  await observe('opening-presentation', 1200);
  if(process.env.QA_DISABLE_MASK) await page.addStyleTag({content:'.portal-trails{mask-image:none!important}'});
  await ready(page); await observe('hero-idle', 2000);
  await scrollChapter(page, 'portal', .12); await observe('intake-native-scroll', 2500, 700);
  await scrollChapter(page, 'experience', .2); await observe('meteor-flare-native-scroll', 2500, 700);
  save('performance-results.json', {status:'measured',records});
  console.log(JSON.stringify(records));
  for (const record of records) assert.equal(record.glError, 0, record.label);
  assert(records.every(record => record.fps > 120), 'Opening/idle/moving scenes must exceed 120 actual R3F FPS');
  save('performance-results.json', { status: 'pass', source:build.source, method: 'Actual negative-priority R3F frame observer; no render override, no forced frame-limit flags. Opening measures 1.2 seconds after the presentation starts, excluding readiness/compilation. Native wheel includes Smoother settling. Frame-time percentiles complement FPS; clip encoding is not FPS.', records });
  console.log(JSON.stringify(records));
} finally { await browser.close(); }
