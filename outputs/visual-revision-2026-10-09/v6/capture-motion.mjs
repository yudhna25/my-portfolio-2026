import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { renameSync } from 'node:fs';
import runtime from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core/lib/coreBundle.js';
// Test process only: reuse installed ffmpeg rather than downloading another binary.
runtime.registry.registry.findExecutable('ffmpeg').executablePathOrDie = () => 'E:/ffmpeg-2025-04-14-git-3b2a9410ef-full_build/bin/ffmpeg.exe';
const out = 'outputs/visual-revision-2026-10-09/v6/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
for (const [width, height] of [[1440, 900], [390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, recordVideo: { dir: out, size: { width, height } } });
  const page = await context.newPage(); await page.goto('http://127.0.0.1:5183/#experience'); await page.waitForSelector('[data-meteor-label]'); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(2700);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(x => x.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { ScrollSmoother } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const seek = (chapter, p) => {
      const content = document.querySelector('#smooth-content'), base = content.getBoundingClientRect().top;
      const start = document.querySelector('[data-story-chapter="' + chapter + '"]').getBoundingClientRect().top - base;
      const end = document.querySelector('[data-story-chapter="' + (chapter === 'experience' ? 'departure' : 'works') + '"]').getBoundingClientRect().top - base;
      useScrollStore.getState().setStoryPosition(chapter, p, undefined, true); ScrollSmoother.get().scrollTop(start + (end - start) * p);
    };
    const segments = [['experience', .01, .5, 2200], ['experience', .5, .5, 700], ['departure', 0, .85, 1600], ['departure', .85, 0, 1600], ['experience', .5, .01, 2200]];
    for (const [chapter, from, to, duration] of segments) { const start = performance.now(); while (performance.now() - start < duration) { const p = Math.min(1, (performance.now() - start) / duration); seek(chapter, from + (to - from) * p); await new Promise(requestAnimationFrame); } seek(chapter, to); }
  });
  const video = page.video(); await context.close(); renameSync(await video.path(), out + width + '-forward-hold-reverse.webm');
}
await browser.close();
