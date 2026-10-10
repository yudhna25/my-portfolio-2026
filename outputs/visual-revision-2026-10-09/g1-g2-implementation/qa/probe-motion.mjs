import { chromium, edge, base, ready, scrollChapter, scene, save } from './common.mjs';
const browser = await chromium.launch({ executablePath: edge, headless: true });
const records = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await page.goto(base); await ready(page);
  for (const mode of ['reduce', 'no-preference']) {
    await page.emulateMedia({ reducedMotion: mode }); await page.waitForTimeout(200);
    await page.waitForTimeout(1000);
    try { await scrollChapter(page, 'experience', .4); }
    catch(error) { records.push({ mode, seekFailure: error.message, scene: await scene(page) }); }
    for (const wait of [0, 500, 1500]) {
      await page.waitForTimeout(wait);
      records.push({ mode, wait, scene: await scene(page), details: await page.evaluate(() => {
        const root = motionQA.root.getState(), meteor = root.scene.getObjectByName('story-meteor');
        const ancestors = []; for (let n = meteor; n; n = n.parent) ancestors.push({ name: n.name, visible: n.visible });
        return { query: matchMedia('(prefers-reduced-motion: reduce)').matches, canvasConnected: root.gl.domElement.isConnected,
          frame: root.gl.info.render.frame, ancestors, data: meteor?.userData,
          nativeY: scrollY, lock: document.body.className, height: document.documentElement.scrollHeight,
          rect: document.querySelector('[data-story-chapter="experience"]').getBoundingClientRect().top };
      }) });
    }
    save('motion-probe.json', records);
    await ready(page);
    records.push({ mode, afterReady: true, scene: await scene(page) });
  }
  save('motion-probe.json', records);
  console.log(JSON.stringify(records.map(({mode,wait,afterReady,scene,details}) => ({mode,wait,afterReady,smoother:scene.smoother,visible:scene.meteor.visible,chapter:scene.chapter,p:scene.p,details}))));
} finally { await browser.close(); }
