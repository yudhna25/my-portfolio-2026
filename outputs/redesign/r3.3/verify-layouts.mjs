import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = 'outputs/redesign/r3.3', origin = process.env.R33_ORIGIN ?? 'http://127.0.0.1:5173';
const phase = process.env.R33_PHASE ?? 'all';
fs.mkdirSync(`${out}/screenshots`, { recursive: true });
const results = { started: new Date().toISOString(), browser: 'Edge 154 / bundled Playwright fallback; Chrome plugin unavailable', layouts: [], portal: [], cycles: [], jumps: [], errors: [], warnings: [], measurements: 'No FPS measurement; other browser verification may run concurrently' };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
page.on('pageerror', error => results.errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error') results.errors.push(message.text());
  if (message.type() === 'warning') results.warnings.push(message.text());
});

async function init() {
  const url = `${origin}/#about`;
  if (page.url() === url) await page.reload(); else await page.goto(url);
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(item => item.name);
    const loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const fiber = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { ScrollSmoother, ScrollTrigger, gsap } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { i18n } = await import(loaded('/src/i18n/config.js'));
    window.qa = { ...fiber, useScrollStore, ScrollSmoother, ScrollTrigger, gsap, storyCameraPath, i18n, store: fiber._roots.get(document.querySelector('canvas')).store };
  });
}

async function readSnapshot() {
  return page.evaluate(() => {
    const story = qa.useScrollStore.getState(), fiber = qa.store.getState();
    const expected = qa.storyCameraPath(story.storyChapter, story.chapterProgress, {}, matchMedia('(prefers-reduced-motion: reduce)').matches, innerWidth / innerHeight);
    const ray = fiber.scene.getObjectByName('accretion-disk').material.uniforms;
    const anchor = document.querySelector('[data-story-anchor="portal"]').getBoundingClientRect();
    const image = document.querySelector('#about img'), button = document.querySelector('#about button');
    const paragraphs = [...document.querySelectorAll('#about p[data-about-bio]')];
    const semantic = node => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.nodeType !== Node.ELEMENT_NODE || node.getAttribute('aria-hidden') === 'true') return '';
      return [...node.childNodes].map(semantic).join('');
    };
    const normalize = text => text.replace(/\s+/g, ' ').trim();
    const rect = element => { const value = element.getBoundingClientRect(); return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height }; };
    const about = document.getElementById('about'), reading = document.querySelector('[data-story-content]');
    const display = [...document.querySelectorAll('#about [data-about-decode]')].map(element => ({ text: element.textContent, rect: rect(element), opacity: +getComputedStyle(element).opacity }));
    const names = []; fiber.scene.traverse(object => { if (object.name) names.push(object.name); });
    return {
      width: innerWidth, height: innerHeight, locale: qa.i18n.language, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      chapter: story.storyChapter, progress: story.chapterProgress, hash: location.hash, manual: story.storyManual,
      nativeScrollY: scrollY, visibleScrollY: qa.ScrollSmoother.get()?.scrollTop() ?? scrollY,
      camera: fiber.camera.position.toArray(), cameraFinite: fiber.camera.position.toArray().every(Number.isFinite),
      poseError: Math.max(Math.abs(fiber.camera.position.x - expected.x), Math.abs(fiber.camera.position.y - expected.y), Math.abs(fiber.camera.position.z - expected.z)),
      observerR: Math.hypot(fiber.camera.position.x, fiber.camera.position.y, fiber.camera.position.z + 200),
      canvas: document.querySelectorAll('canvas').length, writers: fiber.internal.subscribers.filter(item => item.priority === -1).length,
      glError: fiber.gl.getContext().getError(), overflow: document.documentElement.scrollWidth - innerWidth,
      anchorError: Math.max(Math.abs(ray.uPortalCenter.value.x * innerWidth - anchor.left - anchor.width / 2), Math.abs((1 - ray.uPortalCenter.value.y) * innerHeight - anchor.top - anchor.height / 2)),
      mini: ray.uPortalMini.value, visibility: ray.uPortalVisibility.value, pull: ray.uPortalPull.value,
      center: ray.uPortalCenter.value.toArray(), scale: ray.uPortalScale.value, aperture: ray.uPortalRadius.value.toArray(),
      backdrop: fiber.scene.getObjectByName('portal-backdrop').visible,
      contentVisible: getComputedStyle(reading).visibility, inert: reading.inert,
      semanticBio: paragraphs.map(element => normalize(semantic(element))),
      expectedBio: [normalize(qa.i18n.t('about.bioFirst')), normalize(qa.i18n.t('about.bioSecond'))],
      quote: normalize(semantic(document.querySelector('#about blockquote'))), expectedQuote: normalize(qa.i18n.t('about.quote')),
      headingLabel: document.getElementById('about-heading').getAttribute('aria-label'), expectedName: qa.i18n.t('hero.name'),
      image: { src: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight, decoded: image.complete, alt: image.alt, aspect: getComputedStyle(image).aspectRatio, rect: rect(image) },
      portrait: { name: button.getAttribute('aria-label'), pressed: button.getAttribute('aria-pressed'), background: getComputedStyle(button).backgroundColor, border: getComputedStyle(button).borderWidth, rect: rect(button) },
      aboutRect: rect(about), paragraphRects: paragraphs.map(rect), display,
      obsoleteDOM: document.querySelectorAll('#about-tools,#about-skills,#about .skill-pill,#about .tool-icon,#about figcaption,#about [data-parallax],#about .avatar-wrap').length,
      obsoleteScene: names.filter(name => /planet|about-anchor/i.test(name)),
      activePortrait: document.activeElement === button, activeId: document.activeElement.id,
      activeTag: document.activeElement.tagName, activeLabel: document.activeElement.getAttribute('aria-label'),
      aboutIntroCount: qa.gsap.globalTimeline.getChildren(true, true, true).filter(item => item.vars.id === 'about-introduction').length,
    };
  });
}

function check(snapshot, about = true) {
  assert.equal(snapshot.canvas, 1, 'One Canvas');
  assert.equal(snapshot.writers, 1, 'One camera writer');
  assert.equal(snapshot.overflow, 0, 'No horizontal overflow');
  assert.equal(snapshot.glError, 0, 'No WebGL error');
  assert.equal(snapshot.cameraFinite, true, 'Camera finite');
  assert.ok(snapshot.observerR > 1, 'Exterior observer');
  assert.ok(snapshot.poseError < 1e-9, 'Shared expected camera pose');
  assert.ok(snapshot.anchorError < .1, 'O anchor stays attached');
  assert.deepEqual(snapshot.semanticBio, snapshot.expectedBio, 'Both approved bios accessible without changing letters');
  assert.equal(snapshot.quote, snapshot.expectedQuote);
  assert.equal(snapshot.headingLabel, snapshot.expectedName);
  assert.equal(snapshot.image.src, '/avatar-cutout.webp');
  assert.equal(snapshot.image.decoded, true); assert.equal(snapshot.image.width, 800); assert.equal(snapshot.image.height, 1000);
  assert.equal(snapshot.image.aspect, '4 / 5');
  assert.equal(snapshot.portrait.background, 'rgba(0, 0, 0, 0)'); assert.equal(snapshot.portrait.border, '0px');
  assert.ok(snapshot.portrait.name.length > 10); assert.ok(snapshot.portrait.rect.width >= 44 && snapshot.portrait.rect.height >= 44);
  assert.equal(snapshot.obsoleteDOM, 0); assert.deepEqual(snapshot.obsoleteScene, []);
  if (about) { assert.equal(snapshot.chapter, 'about'); assert.equal(snapshot.contentVisible, 'visible'); assert.equal(snapshot.inert, false); }
}

async function portalPose(progress) {
  await page.evaluate(progress => {
    const store = qa.useScrollStore.getState(), content = document.getElementById('smooth-content').getBoundingClientRect();
    const end = document.querySelector('[data-story-chapter="about"]').getBoundingClientRect().top - content.top;
    store.setStoryManual(false);
    const smoother = qa.ScrollSmoother.get();
    if (smoother) { smoother.scrollTop(progress * end); const trigger = smoother.scrollTrigger; trigger.update(); trigger.animation.invalidate().progress(trigger.progress); }
    else scrollTo(0, progress * end);
    store.setStoryPosition(progress === 0 ? 'hero' : progress === 1 ? 'about' : 'portal', progress === 0 || progress === 1 ? 0 : progress, progress * end / qa.ScrollTrigger.maxScroll(window), true);
  }, progress);
  await page.waitForTimeout(progress === 1 ? 1250 : 200);
}

try {
  for (const width of phase === 'all' ? [320, 390, 768, 1440] : []) for (const locale of ['vi', 'en']) for (const motion of ['no-preference', 'reduce']) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: motion });
    await init();
    await page.evaluate(locale => qa.i18n.changeLanguage(locale), locale);
    await page.waitForTimeout(1250);
    let snapshot = await readSnapshot(); check(snapshot); assert.equal(snapshot.hash, '#about'); assert.equal(snapshot.manual, false);
    assert.ok(snapshot.aboutIntroCount <= 1, 'No duplicated intro timelines; completed timelines may auto-remove');
    if (motion === 'reduce') assert.equal(snapshot.aboutIntroCount, 0);
    const stem = `about-${width}-${locale}-${motion === 'reduce' ? 'reduced' : 'motion'}`;
    await page.screenshot({ path: `${out}/screenshots/${stem}-top.png` });
    if (width < 768) {
      await page.evaluate(() => {
        const target = document.querySelector('#about p[data-about-bio]');
        const smoother = qa.ScrollSmoother.get();
        const top = target.getBoundingClientRect().top - document.getElementById('smooth-content').getBoundingClientRect().top - 110;
        if (smoother) { smoother.scrollTop(top); const trigger = smoother.scrollTrigger; trigger.update(); trigger.animation.invalidate().progress(trigger.progress); }
        else scrollTo(0, top);
      });
      await page.waitForTimeout(350);
      snapshot.bioFrame = await readSnapshot(); check(snapshot.bioFrame);
      assert.ok(snapshot.bioFrame.paragraphRects[0].top >= 80 && snapshot.bioFrame.paragraphRects[0].top < 180);
      await page.screenshot({ path: `${out}/screenshots/${stem}-bio.png` });
    }
    results.layouts.push(snapshot);
    console.log(`layout ${width} ${locale} ${motion} PASS`);
  }

  for (let cycle = 1; cycle <= (phase === 'all' || phase === 'cycles' ? 3 : 0); cycle++) {
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.setViewportSize({ width: 1440, height: 900 }); await init();
    const portrait = page.locator('#about button'); await portrait.focus();
    await page.evaluate(() => {
      qa.lifecycleWrites = [];
      const write = qa.useScrollStore.getState().setStoryPosition;
      qa.useScrollStore.setState({ setStoryPosition: (...args) => {
        if (JSON.stringify(args) !== JSON.stringify(qa.lifecycleWrites.at(-1)?.args)) qa.lifecycleWrites.push({ ms: performance.now(), args, native: scrollY, visible: qa.ScrollSmoother.get()?.scrollTop() ?? scrollY, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, caller: new Error().stack.split('\n').slice(2, 5).join('\n') });
        return write(...args);
      } });
    });
    results.cycleTrace ??= []; results.cycleTrace.push({ cycle, step: 'before-change', ...(await readSnapshot()) });
    for (const motion of ['reduce', 'no-preference']) {
      await page.emulateMedia({ reducedMotion: motion });
      await page.waitForTimeout(200); results.cycleTrace.push({ cycle, step: `after-emulateMedia-${motion}`, ...(await readSnapshot()) });
      await page.evaluate(locale => qa.i18n.changeLanguage(locale), motion === 'reduce' ? 'en' : 'vi');
      await page.waitForTimeout(200); results.cycleTrace.push({ cycle, step: 'after-changeLanguage', ...(await readSnapshot()) });
      await page.setViewportSize({ width: motion === 'reduce' ? 390 : 1440, height: motion === 'reduce' ? 844 : 900 });
      await page.waitForTimeout(1250);
      const snapshot = await readSnapshot(); results.lifecycleWrites = await page.evaluate(() => qa.lifecycleWrites); results.cycleTrace.push({ cycle, step: 'after-resize', ...snapshot }); results.cycles.push({ cycle, ...snapshot }); check(snapshot); assert.equal(snapshot.activePortrait, true, 'Portrait focus survives locale/motion/resize');
      assert.ok(snapshot.aboutIntroCount <= 1, 'No duplicated intro timelines');
      if (motion === 'reduce') assert.equal(snapshot.aboutIntroCount, 0);
    }
    console.log(`lifecycle ${cycle} PASS`);
  }

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const width of phase === 'all' || phase === 'portal' ? [1440, 390] : []) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 }); await init(); await page.evaluate(() => qa.i18n.changeLanguage('vi'));
    const forward = new Map();
    for (const direction of ['forward', 'reverse']) for (const progress of direction === 'forward' ? [0, .25, .5, .75, 1] : [1, .75, .5, .25, 0]) {
      await portalPose(progress);
      const snapshot = await readSnapshot(); check(snapshot, false);
      const deterministic = [...snapshot.camera, ...snapshot.center, snapshot.scale, ...snapshot.aperture, snapshot.pull, snapshot.visibility, snapshot.mini];
      if (direction === 'forward') forward.set(progress, deterministic);
      else { snapshot.reverseError = Math.max(...deterministic.map((value, index) => Math.abs(value - forward.get(progress)[index]))); assert.equal(snapshot.reverseError, 0); }
      if (progress === 0) assert.equal(snapshot.backdrop, false);
      if (progress === .5) assert.equal(snapshot.visibility, 0);
      assert.equal(snapshot.inert, progress !== 1);
      if (progress === 1) assert.equal(snapshot.contentVisible, 'visible');
      results.portal.push({ requested: progress, direction, ...snapshot });
      await page.screenshot({ path: `${out}/screenshots/portal-${width}-${direction}-${progress}.png` });
    }
    await init(); const direct = await readSnapshot(); check(direct); assert.equal(direct.chapter, 'about'); assert.equal(direct.manual, false);
    results.jumps.push(direct); console.log(`portal ${width} 5 poses forward/reverse and native #about PASS`);
  }

  assert.deepEqual(results.errors, [], 'No new console / runtime errors');
  results.finished = new Date().toISOString();
  fs.writeFileSync(`${out}/${phase === 'all' ? 'layout' : phase}-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ status: 'PASS', layouts: results.layouts.length, portalPoses: results.portal.length, cycles: results.cycles.length, jumps: results.jumps.length, errors: results.errors, warnings: [...new Set(results.warnings)] }));
} catch (error) {
  results.failure = error.stack; results.failureSnapshot = await readSnapshot(); fs.writeFileSync(`${out}/${phase === 'all' ? 'layout' : phase}-failure.json`, JSON.stringify(results, null, 2));
  await page.screenshot({ path: `${out}/screenshots/${phase}-failure.png` }); throw error;
} finally { await browser.close(); }
