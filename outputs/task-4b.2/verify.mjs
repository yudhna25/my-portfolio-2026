import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
const root = new URL('../../', out);
const report = { browser: '', assertions: 0, layouts: [], tour: [], anchors: [], interactions: [], motion: [], errors: [], notFound: [], failedRequests: [] };
const ids = ['hero', 'about', 'skills', 'education', 'experience', 'work', 'transmission'];
const check = (pass, label) => { assert(pass, label); report.assertions++; };
const save = () => writeFileSync(new URL('results.json', out), JSON.stringify(report, null, 2));
const files = ['src/components/Marquee.jsx', 'src/components/sections/Playground.jsx', 'src/components/effects/LiveDemo.jsx', 'src/components/effects/ScrollOrbitDemo.jsx', 'src/3d/components/ParticleFieldDemo.jsx', 'src/3d/components/ShaderPlaygroundDemo.jsx', 'src/data/playground.js'];
for (const file of files) check(!existsSync(new URL(file, root)), `Obsolete source: ${file}`);
const leaves = (o, prefix = '') => Object.entries(o).flatMap(([k, v]) => typeof v === 'object' && v !== null ? leaves(v, `${prefix}${k}.`) : `${prefix}${k}`);
const vi = JSON.parse(readFileSync(new URL('src/i18n/locales/vi.json', root)));
const en = JSON.parse(readFileSync(new URL('src/i18n/locales/en.json', root)));
check(JSON.stringify(leaves(vi).sort()) === JSON.stringify(leaves(en).sort()), 'Locale parity');
check(!vi.playground && !en.playground && !vi.common.marquees && !en.common.marquees, 'Obsolete locales removed');
report.localeLeaves = leaves(vi).length;
report.buildChunks = readdirSync(new URL('dist/assets', root)).filter(f => f.endsWith('.js'));
check(!report.buildChunks.some(f => /ParticleFieldDemo|ShaderPlaygroundDemo|ScrollOrbitDemo/.test(f)), 'Obsolete production chunks');

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browser = browser.version();
async function open(width, reducedMotion = 'reduce') {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion, deviceScaleFactor: 1, serviceWorkers: 'block' });
  await context.addInitScript(() => localStorage.setItem('stellar-theme', 'dark'));
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('console', event => { if (event.type() === 'error') report.errors.push(event.text()); });
  page.on('response', response => { if (response.status() === 404) report.notFound.push(response.url()); });
  page.on('requestfailed', request => report.failedRequests.push({ url: request.url(), reason: request.failure()?.errorText }));
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preloader]').waitFor({ state: 'detached' });
  await page.locator('[data-galaxy-scene] canvas').waitFor();
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 4000))]));
  await page.waitForTimeout(reducedMotion === 'reduce' ? 600 : 5400);
  return { page, context };
}
async function state(page) {
  return page.evaluate(async () => {
    const { gsap, ScrollSmoother, ScrollTrigger } = await import('/src/hooks/useGSAPSetup.js');
    const { useScrollStore } = await import('/src/stores/useScrollStore.js');
    const store = useScrollStore.getState(), hud = document.querySelector('[data-mission-progress]');
    const smoother = ScrollSmoother.get(), scroll = smoother?.scrollTop() ?? scrollY;
    const max = ScrollTrigger.maxScroll(window);
    return { scroll, max, progress: store.scrollProgress, section: store.currentSection, smoother: !!smoother,
      paused: smoother?.paused() ?? false, triggers: ScrollTrigger.getAll().map(t => t.vars.id || 'unnamed'),
      rotation: Number(gsap.getProperty(hud.querySelector('[data-mission-orbit]'), 'rotation')),
      percent: Number(hud.getAttribute('aria-valuenow')), label: hud.getAttribute('aria-label'), value: hud.querySelector('[data-mission-value]').textContent,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, canvas: document.querySelectorAll('canvas').length };
  });
}
function assertState(s) {
  check(s.progress >= 0 && s.progress <= 1, 'Clamped progress');
  check(Math.abs(s.progress - s.scroll / s.max) < 0.0001, 'Bridge matches visible scroll');
  check(s.percent === Math.round(s.progress * 100) && s.value === `${s.percent}%`, 'HUD percentage matches store');
  check(Math.abs(s.rotation - (s.reduced ? 0 : s.progress * 360)) < 0.01, 'HUD angle matches progress/motion preference');
  check(s.canvas === 1, 'Only persistent Canvas');
  check(!s.triggers.some(id => /marquee|playground/i.test(id)), 'No obsolete ScrollTrigger');
  check(s.smoother === !s.reduced, 'Smoother follows preference');
}
async function scroll(page, id, center = false) {
  await page.evaluate(async ({ id, center }) => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const target = document.getElementById(id), smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(target, false, center ? 'center center' : 'top top');
    else target.scrollIntoView({ block: center ? 'center' : 'start', behavior: 'instant' });
  }, { id, center });
  await page.waitForTimeout(1100);
}
async function pose(page, selector) {
  await page.evaluate(async selector => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const target = document.querySelector(selector), smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(target, false, 'center center');
    else target.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, selector);
  await page.waitForTimeout(1100);
}
async function layout(page, width, lang = 'vi') {
  const result = await page.evaluate(() => {
    const hud = document.querySelector('[data-mission-progress]'), ring = hud.querySelector('[data-mission-orbit]');
    const nodes = [...document.querySelectorAll('[data-constellation-node]')];
    const path = document.querySelector('[data-constellation-grid] path');
    return { client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth,
      sections: [...document.querySelectorAll('#smooth-content > section[id]')].map(e => e.id),
      nav: [...document.querySelectorAll('nav[aria-label] a[href^="#"]')].map(e => e.hash.slice(1)),
      menu: [...document.querySelectorAll('#stellar-menu ul a[href^="#"]')].map(e => e.hash.slice(1)),
      broken: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.hash),
      obsolete: document.querySelectorAll('#playground, [data-marquee], [data-marquee-track], [data-experiment]').length,
      hudFixed: getComputedStyle(hud).position === 'fixed', hudOutside: !document.getElementById('smooth-wrapper').contains(hud),
      ringSize: { width: ring.offsetWidth, height: ring.offsetHeight }, nodes: nodes.length, segments: (path.getAttribute('d').match(/L/g) || []).length,
      vectorEffect: path.getAttribute('vector-effect'), gridColumns: getComputedStyle(document.querySelector('[data-constellation-grid] ol')).gridTemplateColumns.split(' ').length,
      sound: !!document.querySelector('[data-sound-toggle]') };
  });
  result.width = width; result.lang = lang; report.layouts.push(result);
  check(result.client === result.scroll, `Overflow ${width}/${lang}`);
  for (const key of ['sections', 'nav', 'menu']) check(JSON.stringify(result[key]) === JSON.stringify(ids), `Seven ordered ${key} at ${width}/${lang}`);
  check(result.broken.length === 0 && result.obsolete === 0, 'No broken anchor / obsolete DOM');
  check(result.hudFixed && result.hudOutside && result.ringSize.width === 36 && result.ringSize.height === 36, '36px fixed HUD outside smoother');
  check(result.nodes === 10 && result.segments === 9 && result.vectorEffect === 'non-scaling-stroke', 'Responsive constellation path');
  check(result.sound, 'Concurrent SoundToggle preserved');
}
async function tour(page, width) {
  for (const id of ids) {
    await scroll(page, id);
    const s = await state(page); assertState(s);
    check(s.section === id, `Section mapping ${width}/${id}: ${s.section}`);
    const geometry = await page.evaluate(id => ({ id, top: document.getElementById(id).getBoundingClientRect().top, width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }), id);
    check(geometry.width === geometry.scrollWidth, `Tour overflow ${width}/${id}`);
    report.tour.push({ width, ...s, ...geometry });
  }
  await page.evaluate(async () => {
    const { ScrollSmoother, ScrollTrigger } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get(), y = ScrollTrigger.maxScroll(window);
    if (smoother) smoother.scrollTop(y); else window.scrollTo(0, y);
  });
  await page.waitForTimeout(600);
  const end = await state(page); assertState(end);
  check(end.progress > 0.9999 && end.section === 'transmission' && end.percent === 100, 'Contact stays active through Footer at 100%');
  report.tour.push({ width, endpoint: true, ...end });
}
async function anchors(page, menu = false) {
  for (const id of ids) {
    if (menu) {
      await page.locator('button[aria-controls="stellar-menu"]').focus();
      await page.keyboard.press('Enter');
      await page.locator('#stellar-menu[open]').waitFor();
      check((await state(page)).paused || (await state(page)).reduced, 'Menu scroll lock');
    }
    const link = page.locator(`${menu ? '#stellar-menu' : 'nav[aria-label]'} a[href="#${id}"]`);
    await link.focus(); await page.keyboard.press('Enter');
    await page.locator('#stellar-menu').waitFor({ state: 'hidden' });
    await page.waitForTimeout(500);
    const s = await state(page), top = await page.locator(`#${id}`).evaluate(e => e.getBoundingClientRect().top);
    assertState(s);
    check(s.section === id, `Anchor destination ${id}`);
    check(Math.abs(top - (id === 'hero' ? 0 : 80)) < 1, `ScrollTo offset ${id}: ${top}`);
    check(await page.locator(`#${id}`).evaluate(e => document.activeElement === e), 'Keyboard focus follows destination');
    report.anchors.push({ menu, id, top, ...s });
  }
}
try {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const { page, context } = await open(width);
    await layout(page, width); await tour(page, width);
    if (width === 320 || width === 1440) {
      await pose(page, '[data-constellation-grid]');
      await page.screenshot({ path: new URL(`skills-${width}.png`, out).pathname.slice(1) });
    }
    await context.close();
    console.log(`Static ${width}px: seven sections, anchors, progress and overflow pass`);
  }
  const { page, context } = await open(1440, 'no-preference');
  await layout(page, 1440); await tour(page, 1440); await anchors(page); await anchors(page, true);
  await scroll(page, 'hero'); await page.mouse.move(720, 450); await page.mouse.wheel(0, 1200); await page.waitForTimeout(1800);
  const down = await state(page); assertState(down); check(down.scroll > 0, 'Native wheel moves smoother');
  const hidden = await page.locator('nav[aria-label]').evaluate(e => e.getBoundingClientRect().bottom);
  check(hidden < 1, 'Nav auto-hide preserved');
  await page.mouse.wheel(0, -500); await page.waitForTimeout(1600);
  check(await page.locator('nav[aria-label]').evaluate(e => Math.abs(e.getBoundingClientRect().top) < 1), 'Nav upward reveal preserved');
  report.interactions.push({ wheel: down.scroll, navHiddenBottom: hidden });
  await pose(page, '[data-constellation-grid]');
  const graph = page.locator('[data-constellation-grid]');
  await graph.hover(); await page.waitForTimeout(250);
  const alpha = await graph.locator('svg').evaluate(e => getComputedStyle(e).opacity);
  check(Number(alpha) === 0.4, 'Constellation hover response');
  await page.screenshot({ path: new URL('skills-desktop.png', out).pathname.slice(1) });
  await scroll(page, 'work');
  await page.locator('#work button[data-magnetic]').nth(1).click();
  await page.waitForTimeout(1400);
  check(await page.locator('[data-project-card]:not(.hidden)').count() === 1, 'Flip filter product');
  await page.locator('#work button[data-magnetic]').first().click(); await page.waitForTimeout(1300);
  check(await page.locator('[data-project-card]:not(.hidden)').count() === 3, 'Flip filter restores grid');
  await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    ScrollSmoother.get().scrollTo(document.querySelector('#work a [data-magnetic]'), false, 'center center');
  });
  await page.waitForTimeout(1000);
  const magnet = page.locator('#work a [data-magnetic]'), box = await magnet.boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.75); await page.waitForTimeout(400);
  const translate = await magnet.evaluate(e => getComputedStyle(e).translate);
  const movement = translate.match(/-?[\d.]+/g)?.map(Number) || [0, 0];
  check(Math.hypot(...movement) > 1 && Math.hypot(...movement) <= 8.1, 'CTA existing magnetic field ≤8px');
  await page.mouse.move(1400, 100); await page.waitForTimeout(450);
  const restored = await magnet.evaluate(e => getComputedStyle(e).translate);
  check(restored === '0px' || restored === '0px 0px', 'Magnet restores');
  report.interactions.push({ constellationOpacity: alpha, magnetic: translate, restored });
  await page.screenshot({ path: new URL('works-desktop.png', out).pathname.slice(1) });
  for (const lang of ['en', 'vi']) {
    await page.evaluate(async lang => { const { useLangStore } = await import('/src/stores/useLangStore.js'); useLangStore.getState().setLang(lang); }, lang);
    await page.waitForTimeout(1000); await layout(page, 1440, lang);
    check((await state(page)).label === (lang === 'en' ? 'Mission progress' : 'Tiến độ hành trình'), 'HUD bilingual name');
  }
  let normalTriggerCount;
  for (let cycle = 0; cycle < 3; cycle++) {
    for (const preference of ['reduce', 'no-preference']) {
      await page.emulateMedia({ reducedMotion: preference }); await page.waitForTimeout(900);
      const s = await state(page); assertState(s); report.motion.push({ cycle, ...s });
      if (s.reduced) check(s.triggers.length === 0, 'No active triggers in reduced motion');
      else {
        normalTriggerCount ??= s.triggers.length;
        check(s.triggers.length <= normalTriggerCount, 'Trigger count does not accumulate across live cycles');
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 900 }); await page.waitForTimeout(900);
  await layout(page, 390); await anchors(page, true);
  await context.close();
  check(report.errors.length === 0, `Browser console errors: ${report.errors}`);
  check(report.notFound.length === 0, `404 responses: ${report.notFound}`);
  console.log(`PASS ${report.assertions} assertions; zero console errors / 404 responses`);
} finally { save(); await browser.close(); }
