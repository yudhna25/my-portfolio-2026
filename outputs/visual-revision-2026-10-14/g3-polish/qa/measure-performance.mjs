import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, edge, base, out, sha, ready, scrollChapter, save } from './common.mjs';
const build=JSON.parse(fs.readFileSync(out+'/build-source.json','utf8'));
for(const [file,hash]of Object.entries(build.source))assert.equal(sha(file),hash,file);

const browser = await chromium.launch({ executablePath: edge, headless: true });
const records = [];
const resultsFile=process.env.QA_HIDE_TRAILS ? 'diagnostics/performance-no-trails.json' : process.env.QA_PROFILE ? 'diagnostics/performance-profile.json' : process.env.QA_DISABLE_MASK ? 'diagnostics/performance-no-mask.json' : 'performance-results.json';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000}); await ready(page);
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
    save(resultsFile, {status:'measured',records});
    console.log(JSON.stringify(record));
  };
  for(const [chapter,p,label,scroll] of [['finale',.34,'compression-hold',0],['finale',.5,'wave-native-scroll',500],['finale',.62,'large-plasma-star',0],['finale',.82,'spacetime-collapse-hold',0],['contact',0,'contact-large-core',0],['portal',.2,'portal-regression-native',500]]){await scrollChapter(page,chapter,p);await observe(label,2500,scroll)}
  for (const record of records) assert.equal(record.glError, 0, record.label);
  // Record measured performance without turning desktop emulation into a device claim.
  save(resultsFile, { status: 'measured', source:build.source, method: 'Actual negative-priority R3F frame observer; no render override, no forced frame-limit flags. Each checkpoint samples 2.5 seconds after settling. Native wheel includes Smoother settling. Frame-time percentiles complement FPS; clip encoding is not FPS.', records });

} finally { await browser.close(); }
