import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^\uFEFF/, '');
const baseline = JSON.parse(read('./source-baseline.json'));
for (const [path, original] of Object.entries(baseline)) {
  const current = read(`../../${path}`);
  // The existing reveal-clip class changes only clipping, never image dimensions.
  if (path.endsWith('About.jsx')) {
    const classes = (source) => source.slice(source.indexOf('  return (')).replaceAll('reveal-clip ', '').match(/className="[^"]*"/g);
    assert.deepEqual(classes(current), classes(original));
  }
  else {
    // Task 3.9 concurrently owns Work hover styling; verify the image layout here.
    const imageBox = /<div data-project-image className="([^"]*)"/;
    assert.equal(current.match(imageBox)[1].replace('reveal-clip ', ''), original.match(imageBox)[1]);
    assert.match(current, /h-full w-full object-cover/);
  }
  assert.match(current, /clipPath: 'inset\(12% 8%\)'/);
  assert.match(current, /clipPath: 'inset\(0% 0%\)'/);
  assert.match(current, /scrub: 0\.8/);
  assert.match(current, /revertOnUpdate: true/);
}
console.log('PASS: inset endpoints/scrub0.8, JSX layout/copy/ratios unchanged, cleanup retained');

if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const poses = [], errors = [], warnings = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), null, { polling: 50 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1000);
    const inspect = () => page.evaluate(async () => {
      const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/src/hooks/useGSAPSetup.js')).at(-1);
      const { ScrollTrigger, ScrollSmoother } = await import(url);
      const ids = ['about-image-reveal', 'works-image-reveal-project-01', 'works-image-reveal-project-02', 'works-image-reveal-project-03'];
      return { canvas: document.querySelectorAll('canvas').length, smoother: !!ScrollSmoother.get(),
        triggers: ScrollTrigger.getAll().filter((trigger) => ids.includes(trigger.vars.id)).map((trigger) => ({ id: trigger.vars.id, start: trigger.start, end: trigger.end, progress: trigger.progress, scrub: trigger.vars.scrub })),
        images: [...document.querySelectorAll('.avatar-wrap, [data-project-image]')].map((element) => {
          const img = element.querySelector('img'), css = getComputedStyle(element), rect = element.getBoundingClientRect();
          return { id: element.classList.contains('avatar-wrap') ? ids[0] : `works-image-reveal-${element.closest('[data-project-card]').dataset.flipId}`,
            clip: css.clipPath, ratio: rect.width / rect.height, scale: css.transform, fit: getComputedStyle(img).objectFit,
            loaded: img.complete && img.naturalWidth > 0, visible: !element.closest('.hidden') };
        }) };
    });
    const at = async (id, fraction) => {
      const trigger = (await inspect()).triggers.find((trigger) => trigger.id === id); assert(trigger, id);
      await page.evaluate((y) => scrollTo(0, y), Math.max(0, trigger.start + (trigger.end - trigger.start) * fraction));
      await page.waitForTimeout(1800);
      const pose = await inspect(), image = pose.images.find((image) => image.id === id), current = pose.triggers.find((trigger) => trigger.id === id);
      assert.equal(current.scrub, 0.8); assert(Math.abs(current.progress - fraction) < 0.003, JSON.stringify(current));
      const insets = image.clip.match(/[\d.]+/g).map(Number);
      assert(Math.abs(insets[0] - 12 * (1 - fraction)) < 0.04, JSON.stringify(image));
      assert(Math.abs((insets[1] ?? insets[0]) - 8 * (1 - fraction)) < 0.04, JSON.stringify(image));
      if (fraction > 0) assert(image.loaded); assert.equal(image.scale, 'none'); assert.equal(pose.canvas, 1);
      assert(Math.abs(image.ratio - (id.startsWith('about') ? 0.8 : 1.6)) < 0.004, JSON.stringify(image));
      poses.push({ id, fraction, pose }); return pose;
    };
    assert.equal((await inspect()).triggers.length, 4);
    for (const id of ['about-image-reveal', 'works-image-reveal-project-01', 'works-image-reveal-project-02', 'works-image-reveal-project-03']) {
      for (const fraction of [0, 0.5, 1, 0]) {
        await at(id, fraction);
        if (id.endsWith('project-01') || id.startsWith('about')) await page.screenshot({ path: `outputs/task-3.8/${id}-${fraction}.png` });
      }
    }
    for (const width of [320, 768, 1920]) {
      await page.setViewportSize({ width, height: 1000 }); await page.waitForTimeout(600);
      await at('about-image-reveal', 0.5); await at('works-image-reveal-project-01', 1);
    }
    await page.setViewportSize({ width: 1440, height: 1000 }); await page.waitForTimeout(600);
    await at('works-image-reveal-project-01', 0);
    await page.getByRole('button', { name: 'Graphic', exact: true }).click(); await page.waitForTimeout(1000);
    assert.equal((await inspect()).triggers.filter((trigger) => trigger.id.startsWith('works')).length, 1);
    await page.getByRole('button', { name: 'Tất cả', exact: true }).click(); await page.waitForTimeout(1000);
    assert.equal((await inspect()).triggers.length, 4);
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(800);
      const reduced = await inspect(); assert.equal(reduced.triggers.length, 0); assert.equal(reduced.smoother, false);
      assert(reduced.images.every((image) => image.clip === 'inset(0px)' && image.scale === 'none'), JSON.stringify(reduced.images));
      poses.push({ reduced: cycle, pose: reduced });
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(1000);
      assert.equal((await inspect()).triggers.length, 4); await at('about-image-reveal', 1);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), null, { polling: 50 }); await page.waitForTimeout(1000);
    assert.equal((await inspect()).triggers.length, 0); assert((await inspect()).images.every((image) => image.clip === 'inset(0px)'));
    assert.deepEqual(errors, []);
    console.log(`PASS: ${poses.length} image poses, all3 projects/avatar, reverse/320–1920/filter/3motion cycles/fresh reduced, 0 App console errors`);
  } finally {
    writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ poses, errors, warnings: [...new Set(warnings)] }, null, 2));
    await browser.close();
  }
}
