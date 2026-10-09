import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8').replace(/^\uFEFF/, '');
const baseline = JSON.parse(read('./source-baseline.json'));
for (const [path, original] of Object.entries(baseline)) {
  const current = read(`../../${path}`);
  const classes = (source) => source.slice(source.indexOf('  return (')).match(/className=(?:"[^"]*"|\{`[^`]*`\}|\{[^}]*\})/g);
  assert.deepEqual(classes(current), classes(original), `${path}: layout classes unchanged`);
  assert.match(current, /useGSAP\(/);
  assert.match(current, /revertOnUpdate: true/);
  assert.match(current, /reducedMotion/);
  assert.match(current, /y: 40/);
  assert.match(current, /(?:power3|expo)\.out/);
  if (!path.endsWith('Hero.jsx')) assert.match(current, /stagger: 0\.1/);
}
console.log('PASS: 8 sections preserve layout classes, scoped cleanup/reduced-motion, motion values');

if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [], warnings = [], poses = [], lifecycle = [], fps = [];
  const sections = ['hero', 'about', 'skills', 'education', 'experience', 'work', 'playground', 'transmission'];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), null, { polling: 50 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(4000);
    const inspect = () => page.evaluate(async () => {
      const urls = performance.getEntriesByType('resource').map((entry) => entry.name);
      const loaded = (name) => urls.filter((url) => url.includes(name)).at(-1);
      const { gsap, ScrollTrigger, ScrollSmoother } = await import(loaded('/src/hooks/useGSAPSetup.js'));
      const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
      const selectors = '[data-hero-intro], .hero-char, [data-about-reveal], .split-line, .avatar-wrap, .tool-icon img, .tool-icon span, .skill-pill, [data-skill-reveal], [data-skill-group], #education-heading, [data-education-content], [data-experience-reveal], [data-mission], [data-works-intro], [data-project-text], [data-playground-reveal], [data-experiment], [data-contact-line], [data-contact-copy]';
      return {
        language: document.documentElement.lang, scroll: scrollY, smoother: !!ScrollSmoother.get(), canvas: document.querySelectorAll('canvas').length,
        overflow: document.documentElement.scrollWidth - innerWidth, contactProgress: useScrollStore.getState().contactProgress,
        triggers: ScrollTrigger.getAll().filter((trigger) => trigger.trigger?.closest('main section')).map((trigger) => ({
          id: trigger.vars.id, section: trigger.trigger.closest('main section').id, scrub: trigger.vars.scrub,
          progress: trigger.progress, start: trigger.start, end: trigger.end, paused: trigger.animation?.paused(),
        })),
        targets: [...document.querySelectorAll(`main section :is(${selectors})`)].filter((element) => element.closest('[data-project-card]')?.getAttribute('aria-hidden') !== 'true').map((element) => {
          const rect = element.getBoundingClientRect(), style = getComputedStyle(element);
          return { section: element.closest('section').id, name: element.id || element.className, top: rect.top, bottom: rect.bottom,
            opacity: +style.opacity, minimumOpacity: element.classList.contains('opacity-80') ? 0.8 : 1,
            visibility: style.visibility, y: +gsap.getProperty(element, 'y'), x: +gsap.getProperty(element, 'x') };
        }),
        grid: [...document.querySelectorAll('[data-project-card]:not(.hidden)')].map((card) => ({ position: getComputedStyle(card).position, transform: getComputedStyle(card).transform })),
      };
    });
    const at = async (id, offset = 110) => {
      await page.evaluate(async ({ id, offset }) => {
        const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/src/hooks/useGSAPSetup.js')).at(-1);
        const { ScrollSmoother } = await import(url), element = document.getElementById(id);
        const y = ScrollSmoother.get()?.offset(element, 'top top') ?? element.getBoundingClientRect().top + scrollY;
        scrollTo(0, Math.max(0, y - offset));
      }, { id, offset });
      await page.waitForTimeout(1800); return inspect();
    };
    const visible = (pose) => {
      const targets = pose.targets.filter((target) => target.section !== 'hero' && target.top >= 0 && target.top < 600);
      for (const target of targets) assert(target.opacity >= target.minimumOpacity - 0.01 && target.visibility !== 'hidden', JSON.stringify(target));
      assert.equal(pose.canvas, 1); assert(pose.overflow <= 1, `overflow: ${pose.overflow}`);
    };
    const initial = await inspect();
    assert(sections.every((section) => initial.triggers.some((trigger) => trigger.section === section)), 'all 8 sections own triggers');
    assert(initial.targets.filter((target) => target.section === 'hero').every((target) => target.opacity === 1));
    for (const section of sections.slice(1)) {
      const pose = await at(section); visible(pose); poses.push({ label: section, pose });
      await page.screenshot({ path: `outputs/task-3.6/${section}-1440.png` });
    }
    for (const section of [...sections.slice(1)].reverse()) { const pose = await at(section); visible(pose); }
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(40);
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(40);
      const pose = await at('experience'); visible(pose); lifecycle.push({ cycle, triggers: pose.triggers.length });
    }
    await at('work');
    await page.getByRole('button', { name: 'Graphic', exact: true }).click();
    await page.waitForTimeout(60);
    await page.evaluate(async () => {
      const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/src/stores/useLangStore.js')).at(-1);
      (await import(url)).useLangStore.getState().setLang('en');
    });
    await page.waitForTimeout(1600);
    let pose = await inspect(); visible(pose); assert.equal(pose.language, 'en'); assert(pose.grid.every((card) => card.position !== 'absolute'));
    await page.getByRole('button', { name: 'All', exact: true }).click(); await page.waitForTimeout(1200);
    await at('playground');
    for (const section of ['about', 'skills', 'education', 'experience', 'playground']) {
      pose = await at(section); visible(pose); poses.push({ label: `${section}-en`, pose });
    }
    for (const width of [320, 768, 1920]) {
      await page.setViewportSize({ width, height: width === 320 ? 900 : 1100 });
      await page.waitForTimeout(500); pose = await at('about'); visible(pose);
      await page.screenshot({ path: `outputs/task-3.6/about-${width}.png` }); poses.push({ label: `about-${width}`, pose });
      pose = await at('transmission'); visible(pose); assert(pose.contactProgress > 0.98);
      await page.screenshot({ path: `outputs/task-3.6/contact-${width}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1100 }); await page.waitForTimeout(500);
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(800);
      pose = await inspect(); assert.equal(pose.smoother, false); assert.equal(pose.triggers.length, 0);
      assert(pose.targets.every((target) => target.opacity >= target.minimumOpacity && Math.abs(target.y) < 0.001), JSON.stringify(pose.targets.filter((target) => target.opacity < target.minimumOpacity || Math.abs(target.y) >= 0.001)));
      await at('transmission'); await page.screenshot({ path: 'outputs/task-3.6/contact-reduced.png' });
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(1000);
      pose = await at('about'); visible(pose); assert.equal(pose.smoother, true);
      assert.equal(pose.triggers.filter((trigger) => trigger.id === 'contact-approach').length, 1);
      lifecycle.push({ motionCycle: cycle, triggers: pose.triggers.length });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), null, { polling: 50 }); await page.waitForTimeout(1000);
    pose = await inspect(); assert.equal(pose.triggers.length, 0); assert(pose.targets.every((target) => target.opacity >= target.minimumOpacity));
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(4000);
    for (const section of ['about', 'skills', 'transmission']) {
      await at(section);
      const sample = page.evaluate(async () => {
        const url = performance.getEntriesByType('resource').map((entry) => entry.name).filter((url) => url.includes('/@react-three_fiber.js')).at(-1);
        const { _roots } = await import(url), store = _roots.get(document.querySelector('canvas')).store;
        let frames = 0; const start = performance.now();
        const unsubscribe = store.getState().internal.subscribe({ current: () => frames++ }, 0, store);
        try { await new Promise((resolve) => setTimeout(resolve, 2000)); return { frames, fps: frames * 1000 / (performance.now() - start) }; }
        finally { unsubscribe(); }
      });
      for (let step = 0; step < 12; step++) { await page.mouse.wheel(0, step % 2 ? -80 : 80); await page.waitForTimeout(90); }
      const measurement = await sample; assert(measurement.fps > 120, JSON.stringify(measurement)); fps.push({ section, ...measurement });
    }
    assert.deepEqual(errors, []);
    console.log(`PASS: ${poses.length} poses, rapid scroll/filter/locale, 3 motion cycles + fresh reduced, FPS ${fps.map((sample) => sample.fps.toFixed(1)).join('/')}, 0 App console errors`);
  } finally {
    writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ poses, lifecycle, fps, errors, warnings: [...new Set(warnings)] }, null, 2));
    await browser.close();
  }
}
