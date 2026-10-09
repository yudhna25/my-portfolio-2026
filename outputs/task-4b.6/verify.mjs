import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
const report = { browser: '', assertions: 0, projects: [], layouts: [], lifecycle: [], fps: null, errors: [], notFound: [], failedRequests: [] };
const check = (pass, label) => { assert(pass, label); report.assertions++; };
const ids = ['01', '02', '03'];
const card = id => `[data-project-card][data-flip-id="project-${id}"]`;
const save = () => writeFileSync(new URL('results.json', out), JSON.stringify(report, null, 2));
const leafKeys = (object, prefix = '') => Object.entries(object).flatMap(([key, value]) => value && typeof value === 'object' ? leafKeys(value, `${prefix}${key}.`) : `${prefix}${key}`);
const vi = JSON.parse(readFileSync(new URL('../../src/i18n/locales/vi.json', out)));
const en = JSON.parse(readFileSync(new URL('../../src/i18n/locales/en.json', out)));
check(JSON.stringify(leafKeys(vi).sort()) === JSON.stringify(leafKeys(en).sort()), 'Vi/En parity');

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browser = browser.version();
async function open(width = 1440, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await context.addInitScript(() => {
    localStorage.setItem('stellar-theme', 'dark');
    localStorage.removeItem('stellar-audio');
    window.__reticleAudioClicks = [];
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      if (this.type === 'square' && this.frequency.value === 1400) window.__reticleAudioClicks.push(performance.now());
      return start.apply(this, args);
    };
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('console', event => { if (event.type() === 'error') report.errors.push(event.text()); });
  page.on('response', response => { if (response.status() === 404) report.notFound.push(response.url()); });
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preloader]').waitFor({ state: 'detached' });
  await page.locator('[data-galaxy-scene] canvas').waitFor();
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 4000))]));
  await page.waitForTimeout(reducedMotion === 'reduce' ? 500 : 3200);
  return { page, context };
}
async function state(page) {
  return page.evaluate(async () => {
    const { ScrollTrigger, ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    // Match the component's Vite URL; a bare URL after HMR creates a second engine.
    if (!window.__reticleAudioUrl) {
      const source = await (await fetch('/src/components/ui/TargetLockReticle.jsx')).text();
      window.__reticleAudioUrl = source.match(/from "([^"]*audioEngine\.js[^"]*)"/)[1];
    }
    const { getAudioContext } = await import(window.__reticleAudioUrl);
    return {
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      reticles: document.querySelectorAll('[data-target-reticle]').length,
      triggers: ScrollTrigger.getAll().filter(trigger => trigger.vars.id?.startsWith('works-target-lock-')).map(trigger => trigger.vars.id),
      allTriggers: ScrollTrigger.getAll().length, smoother: !!ScrollSmoother.get(),
      audioContext: getAudioContext()?.state ?? null, clicks: window.__reticleAudioClicks.length,
      width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
    };
  });
}
async function triggerLock(page, id) {
  await page.evaluate(async id => {
    const { ScrollTrigger, ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const trigger = ScrollTrigger.getById(`works-target-lock-${id}`);
    if (!trigger) throw new Error(`Missing target trigger ${id}`);
    const y = Math.max(0, trigger.start + 1), smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTop(y); else window.scrollTo({ top: y, behavior: 'instant' });
    ScrollTrigger.update();
  }, id);
  await page.waitForFunction(selector => document.querySelector(selector)?.dataset.targetLocked === 'true', `${card(id)} [data-target-reticle]`, { polling: 'raf' });
}
async function pose(page, selector) {
  await page.evaluate(async selector => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const target = document.querySelector(selector), smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(target, false, 'center center');
    else target.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, selector);
  await page.waitForTimeout(750);
}
async function geometry(page, id) {
  return page.locator(`${card(id)} [data-target-reticle]`).evaluate(reticle => {
    const image = reticle.closest('[data-project-image]'), article = reticle.closest('[data-project-card]');
    const rect = element => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const flare = reticle.querySelector('[data-reticle-flare]');
    return {
      locked: reticle.dataset.targetLocked, ariaHidden: reticle.getAttribute('aria-hidden'),
      pointerEvents: getComputedStyle(reticle).pointerEvents, position: getComputedStyle(reticle).position,
      root: rect(reticle), image: rect(image), label: reticle.querySelector('[data-reticle-label]').textContent,
      labelOpacity: Number(getComputedStyle(reticle.querySelector('[data-reticle-label]')).opacity),
      corners: [...reticle.querySelectorAll('[data-reticle-corner]')].map(element => ({ transform: getComputedStyle(element).transform, opacity: getComputedStyle(element).opacity })),
      focus: getComputedStyle(reticle.querySelector('[data-reticle-focus]')).transform,
      flareOpacity: Number(getComputedStyle(flare).opacity), flareHeight: rect(flare).height,
      focusable: reticle.querySelectorAll('a,button,input,[tabindex]').length,
      link: article.querySelector('a')?.getAttribute('href') ?? null,
      target: article.querySelector('a')?.getAttribute('target') ?? null,
      rel: article.querySelector('a')?.getAttribute('rel') ?? null,
    };
  });
}
function checkGeometry(g, label) {
  check(g.ariaHidden === 'true' && g.pointerEvents === 'none' && g.position === 'absolute' && g.focusable === 0, `${label}: decorative non-blocking overlay`);
  check(g.corners.length === 4, `${label}: four brackets`);
  check(g.root.left >= g.image.left - 1 && g.root.right <= g.image.right + 1 && g.root.top >= g.image.top - 1 && g.root.bottom <= g.image.bottom + 1, `${label}: reticle contained in image`);
  check(g.label.includes('2026') && g.label.includes('TARGET LOCKED'), `${label}: specified optical label`);
}
try {
  // Natural first activation on fresh documents; never set lock state or rewind effects.
  for (const id of ids) {
    const { page, context } = await open();
    const initial = await state(page);
    check(initial.reticles === 3 && initial.triggers.length === 3, 'Three mounted target triggers');
    const before = await geometry(page, id); checkGeometry(before, `Project ${id} before lock`);
    let clicksBefore = initial.clicks;
    if (id === '01') {
      await page.locator('[data-sound-toggle]').click();
      await page.waitForFunction(() => document.querySelector('[data-sound-toggle]').getAttribute('aria-checked') === 'true');
      clicksBefore = (await state(page)).clicks;
    }
    await triggerLock(page, id);
    await page.waitForTimeout(350);
    const captureTime = await page.evaluate(async id => {
      const { ScrollTrigger } = await import('/src/hooks/useGSAPSetup.js');
      const animation = ScrollTrigger.getById(`works-target-lock-${id}`).animation;
      animation.pause();
      return animation.time();
    }, id);
    const flare = await geometry(page, id); checkGeometry(flare, `Project ${id} during flare`);
    check(flare.flareOpacity > 0 && flare.locked === 'true', `${id}: locked while flare runs`);
    await page.screenshot({ path: fileURLToPath(new URL(`project-${id}-flare.png`, out)) });
    await page.evaluate(async id => { const { ScrollTrigger } = await import('/src/hooks/useGSAPSetup.js'); ScrollTrigger.getById(`works-target-lock-${id}`).animation.resume(); }, id);
    await page.waitForTimeout(1000);
    const final = await geometry(page, id); checkGeometry(final, `Project ${id} final`);
    check(final.locked === 'true' && final.labelOpacity > 0 && final.flareOpacity < 0.01, `${id}: persistent lock, flare completed`);
    check(JSON.stringify(before.corners.map(c => c.transform)) !== JSON.stringify(final.corners.map(c => c.transform)), `${id}: brackets contract`);
    check(before.focus !== final.focus, `${id}: focus marker settles`);
    await page.screenshot({ path: fileURLToPath(new URL(`project-${id}-locked.png`, out)) });
    const after = await state(page);
    report.projects.push({ id, before, flare, final, state: after, clicksBefore, captureTime });
    if (id === '01') {
      check(after.clicks === clicksBefore + 1 && after.audioContext === 'running', `One consented radio click on lock: before=${clicksBefore}, after=${after.clicks}, context=${after.audioContext}`);
      check(final.target === '_blank' && final.rel.includes('noopener') && final.rel.includes('noreferrer'), 'EDURA safe external link');
      await pose(page, `${card(id)} a [data-magnetic]`);
      check(await page.locator(`${card(id)} a [data-magnetic]`).evaluate(element => {
        const r = element.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('a') === element.closest('a');
      }), 'EDURA CTA hit target remains link');
    } else check(after.audioContext === null && after.clicks === 0, `${id}: muted lock never starts audio`);
    await context.close();
  }

  // Separate from screenshots, so CDP capture overhead does not distort the flare FPS.
  {
    const { page, context } = await open();
    report.fps = await page.evaluate(async () => {
      const { ScrollTrigger, ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
      const trigger = ScrollTrigger.getById('works-target-lock-01');
      const reticle = document.querySelector('[data-flip-id="project-01"] [data-target-reticle]');
      const y = trigger.start + 1;
      ScrollSmoother.get().scrollTop(y); ScrollTrigger.update();
      return new Promise(resolve => {
        let started, last, frames = 0; const intervals = [];
        function frame(now) {
          if (reticle.dataset.targetLocked !== 'true') { requestAnimationFrame(frame); return; }
          started ??= now;
          if (last !== undefined) intervals.push(now - last);
          last = now; frames++;
          if (now - started < 800) { requestAnimationFrame(frame); return; }
          const duration = now - started;
          resolve({ frames, durationMs: duration, fps: (frames - 1) * 1000 / duration, maximumFrameMs: Math.max(...intervals), dpr: devicePixelRatio, canvas: document.querySelectorAll('canvas').length, viewport: `${innerWidth}x${innerHeight}` });
        }
        requestAnimationFrame(frame);
      });
    });
    check(report.fps.frames > 10 && report.fps.canvas === 1, 'Flare frame sample on one persistent Canvas');
    await context.close();
  }
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const { page, context } = await open(width);
    await triggerLock(page, '01'); await page.waitForTimeout(1000);
    const g = await geometry(page, '01'), s = await state(page);
    checkGeometry(g, `${width}px`);
    check(s.width === s.scrollWidth, `${width}px: no horizontal overflow`);
    check(g.image.width > 0 && g.root.width <= width, `${width}px: bounded image overlay`);
    report.layouts.push({ width, geometry: g, state: s });
    if (width === 320) await page.screenshot({ path: fileURLToPath(new URL('project-01-mobile-320.png', out)) });
    await context.close();
  }
  {
    const { page, context } = await open();
    await pose(page, '#work button[aria-controls="works-grid"]');
    for (const [index, expected] of [[1, 1], [2, 1], [3, 1], [0, 3]]) {
      await page.locator('#work button[aria-controls="works-grid"]').nth(index).click(); await page.waitForTimeout(950);
      const s = await state(page);
      check(s.reticles === expected && s.triggers.length <= expected, `Filter ${index}: hidden cards do not own triggers`);
      check(new Set(s.triggers).size === s.triggers.length, 'No duplicate reticle IDs');
      report.lifecycle.push({ filter: index, ...s });
    }
    for (const lang of ['en', 'vi']) {
      await page.evaluate(async lang => { const { useLangStore } = await import('/src/stores/useLangStore.js'); useLangStore.getState().setLang(lang); }, lang);
      await page.waitForTimeout(500);
      check(await page.locator('[data-reticle-label]').evaluateAll(elements => elements.every(e => /2026/.test(e.textContent) && !/works\./.test(e.textContent))), `${lang}: translated label resolves`);
      const s = await state(page); check(s.triggers.length <= 3, 'Locale rebuild does not accumulate triggers');
      report.lifecycle.push({ lang, ...s });
    }
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const reducedMotion of ['reduce', 'no-preference']) {
        await page.emulateMedia({ reducedMotion });
        await page.waitForFunction(reduce => document.querySelectorAll('[data-target-reticle]').length === (reduce ? 0 : 3), reducedMotion === 'reduce', { timeout: 5000 });
        await page.waitForTimeout(300);
        const s = await state(page);
        report.lifecycle.push({ cycle, requested: reducedMotion, ...s });
        check(s.reticles === (s.reduced ? 0 : 3), 'Live preference mounts/removes reticles');
        check(s.reduced ? s.triggers.length === 0 && s.allTriggers === 0 && !s.smoother : s.triggers.length <= 3 && s.smoother, 'Live preference cleanup / smoother');
      }
    }
    await context.close();
  }
  {
    const { page, context } = await open(390, 'reduce');
    await pose(page, `${card('01')} [data-project-image]`);
    const s = await state(page);
    check(s.reticles === 0 && s.triggers.length === 0 && s.allTriggers === 0 && !s.smoother, 'Fresh reduced: no reticle, animation trigger, smoother');
    check(s.audioContext === null && s.clicks === 0 && s.width === s.scrollWidth, 'Fresh reduced: no audio or overflow');
    report.lifecycle.push({ freshReduced: true, ...s });
    await page.screenshot({ path: fileURLToPath(new URL('reduced-390.png', out)) });
    await context.close();
  }
  check(report.errors.length === 0, `Browser errors: ${report.errors}`);
  check(report.notFound.length === 0, `404: ${report.notFound}`);
  console.log(`PASS ${report.assertions} assertions; flare ${report.fps.fps.toFixed(2)} rAF/s; no console errors or 404`);
} finally { save(); await browser.close(); }
