// Output-only checks against the real App; no preview root or production probes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = path.dirname(fileURLToPath(import.meta.url));
const base = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const dev = base.includes(':5173'), quick = process.argv.includes('--quick');
const prefix = dev ? 'browser-route' : 'production-route';
const report = { status: 'running', base, browser: null, checkedAt: new Date().toISOString(), configurations: [], extra: [], errors: [], warnings: [], limits: ['Desktop Edge emulates phone viewport/touch and reduced-motion; no physical phone or OS toggle.', 'Compiled checks inspect real DOM/history and WebGL resource calls; exact store/camera checks use dev modules only.', 'Actual installed PWA/deployment HTTPS behavior is checked separately by integration owner.'] };
fs.mkdirSync(path.join(out, 'screenshots'), { recursive: true });
const save = () => fs.writeFileSync(path.join(out, `${prefix}-results.json`), JSON.stringify(report, null, 2));
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browser = browser.version();

async function attach(page, record) {
  page.on('pageerror', error => { record.errors.push(String(error)); (record.errorStacks ??= []).push(error.stack); });
  page.on('console', message => { if (message.type() === 'error') record.errors.push(message.text()); if (message.type() === 'warning') record.warnings.push(message.text()); });
  record.failedResources = [];
  page.on('response', response => { if (response.status() >= 400) record.failedResources.push({ url: response.url(), status: response.status() }); });
  await page.addInitScript(() => {
    window.__routeDocument = Math.random().toString(36).slice(2);
    window.__routePreloaderMounts = 0;
    new MutationObserver(entries => { for (const entry of entries) for (const node of entry.addedNodes) if (node.nodeType === 1 && (node.matches?.('[data-preloader]') || node.querySelector?.('[data-preloader]'))) window.__routePreloaderMounts++; }).observe(document, { subtree: true, childList: true });
    const listenerIDs = new WeakMap(); let nextListener = 0;
    const listenerSets = { window: new Set(), document: new Set() };
    const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener;
    const key = (type, fn, options) => { if (!fn || typeof fn !== 'function' && typeof fn !== 'object') return null; if (!listenerIDs.has(fn)) listenerIDs.set(fn, ++nextListener); return `${type}:${listenerIDs.get(fn)}:${options === true || options?.capture === true}`; };
    EventTarget.prototype.addEventListener = function (type, fn, options) { const set = this === window ? listenerSets.window : this === document ? listenerSets.document : null; const id = set && key(type, fn, options); if (id) set.add(id); return add.call(this, type, fn, options); };
    EventTarget.prototype.removeEventListener = function (type, fn, options) { const set = this === window ? listenerSets.window : this === document ? listenerSets.document : null; const id = set && key(type, fn, options); if (id) set.delete(id); return remove.call(this, type, fn, options); };
    window.__routeListeners = () => Object.fromEntries(Object.entries(listenerSets).map(([name, set]) => [name, [...set].map(item => item.split(':')[0]).sort()]));
    const kinds = ['Buffer', 'Texture', 'Framebuffer', 'Renderbuffer', 'Program', 'Shader'];
    const stats = Object.fromEntries(kinds.map(kind => [kind, { created: 0, deleted: 0, contextLost: 0, live: 0 }]));
    const seen = new WeakSet(), objects = new WeakMap(), contexts = new WeakMap();
    for (const prototype of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean)) for (const kind of kinds) {
      const createName = `create${kind}`, deleteName = `delete${kind}`, create = prototype[createName], removeResource = prototype[deleteName];
      if (!create || seen.has(create)) continue; seen.add(create);
      prototype[createName] = function (...args) {
        const value = create.apply(this, args);
        if (value) {
          stats[kind].created++; stats[kind].live++; const entry = { kind, deleted: false }; objects.set(value, entry);
          if (!contexts.has(this)) {
            const owned = new Set(); contexts.set(this, owned);
            add.call(this.canvas, 'webglcontextlost', () => { for (const object of owned) if (!object.deleted) { object.deleted = true; stats[object.kind].contextLost++; stats[object.kind].live--; } });
          }
          contexts.get(this).add(entry);
        }
        return value;
      };
      prototype[deleteName] = function (value) { const entry = value && objects.get(value); if (entry && !entry.deleted) { entry.deleted = true; stats[kind].deleted++; stats[kind].live--; } return removeResource.call(this, value); };
    }
    window.__routeGL = stats;
  });
}

async function devQA(page) {
  if (!dev) return;
  await page.evaluate(async () => {
    const loaded = name => performance.getEntriesByType('resource').map(entry => entry.name).filter(url => url.includes(name)).at(-1);
    if (window.routeQA) {
      const fiberURL = loaded('/@react-three_fiber.js');
      if (!routeQA.roots && fiberURL) routeQA.roots = (await import(fiberURL))._roots;
      return;
    }
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js') ?? '/src/stores/useScrollStore.js');
    const { ScrollSmoother, ScrollTrigger, gsap } = await import(loaded('/src/hooks/useGSAPSetup.js') ?? '/src/hooks/useGSAPSetup.js');
    const { useLangStore } = await import(loaded('/src/stores/useLangStore.js') ?? '/src/stores/useLangStore.js');
    const fiberURL = loaded('/@react-three_fiber.js');
    const roots = fiberURL ? (await import(fiberURL))._roots : null;
    window.routeQA = { useScrollStore, ScrollSmoother, ScrollTrigger, gsap, useLangStore, roots };
  });
}

async function sample(page, label) {
  const state = await page.evaluate(() => {
    const qa = window.routeQA, s = qa?.useScrollStore.getState(), smoother = qa?.ScrollSmoother.get();
    const canvas = document.querySelector('canvas'), fiber = canvas && qa?.roots?.get(canvas)?.store.getState();
    const target = document.querySelector('#work-target-edura'), preview = document.querySelector('[data-work-preview]');
    const frame = document.querySelector('[data-work-background]');
    return { url: location.pathname + location.hash, documentID: window.__routeDocument, lang: document.documentElement.lang, reduced: matchMedia('(prefers-reduced-motion:reduce)').matches,
      scrollY, visibleScroll: smoother?.scrollTop() ?? scrollY, viewport: [innerWidth, innerHeight], overflow: document.documentElement.scrollWidth - innerWidth,
      canvas: document.querySelectorAll('canvas').length, reader: document.querySelectorAll('[data-edura-reader]').length, main: document.querySelectorAll('main').length,
      focus: document.activeElement?.id ?? '', loadingLock: document.body.classList.contains('loading-lock'), menuLock: document.documentElement.classList.contains('stellar-menu-open'), menu: document.querySelector('#stellar-menu')?.open ?? false,
      title: document.title, meta: document.querySelector('meta[name="description"]')?.content, canonical: document.querySelector('link[rel="canonical"]')?.href, history: history.state, historyLength: history.length,
      preloaderMounts: window.__routePreloaderMounts, listeners: window.__routeListeners?.(), gl: window.__routeGL,
      work: { selected: target?.getAttribute('aria-pressed'), preview: preview?.dataset.active, frameTop: frame?.getBoundingClientRect().top, targetTop: target?.getBoundingClientRect().top },
      store: s ? { chapter: s.storyChapter, progress: s.chapterProgress, selection: s.worksSelection, focus: s.worksFocus, hover: s.worksHover, orbit: { ...s.worksOrbit } } : null,
      smoother: qa ? !!smoother : null, triggers: qa?.ScrollTrigger.getAll().length ?? null,
      camera: fiber ? { position: fiber.camera.position.toArray(), quaternion: fiber.camera.quaternion.toArray(), writers: fiber.internal.subscribers.filter(item => item.priority === -1).length, memory: { ...fiber.gl.info.memory }, glError: fiber.gl.getContext().getError() } : null,
      disposed: window.__routeResources ? { geometries: window.__routeResources.geometries.size, materials: window.__routeResources.materials.size, seenGeometries: window.__routeResources.seenGeometries.size, seenMaterials: window.__routeResources.seenMaterials.size, frameSubscribers: window.__routeResources.fiber.internal.subscribers.length, memory: { ...window.__routeResources.fiber.gl.info.memory } } : null,
    };
  });
  state.label = label; return state;
}

async function trackSceneDisposal(page) {
  if (!dev) return;
  await page.evaluate(() => {
    const fiber = routeQA.roots.get(document.querySelector('canvas')).store.getState();
    const geometries = new Set(), materials = new Set(), seenGeometries = new Set(), seenMaterials = new Set();
    fiber.scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); for (const item of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) materials.add(item); });
    for (const item of geometries) item.addEventListener('dispose', () => seenGeometries.add(item));
    for (const item of materials) item.addEventListener('dispose', () => seenMaterials.add(item));
    window.__routeResources = { fiber, geometries, materials, seenGeometries, seenMaterials };
  });
}

async function waitMain(page) {
  await page.locator('#work-target-edura').waitFor();
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 1);
  await devQA(page); await page.waitForTimeout(800);
}

async function waitReader(page) {
  await page.locator('[data-edura-reader]').waitFor();
  await page.evaluate(() => document.fonts.ready); await devQA(page); await page.waitForTimeout(800);
}

async function readerAssertions(page, label) {
  const state = await sample(page, label);
  assert.equal(state.url, '/projects/edura', label); assert.equal(state.reader, 1); assert.equal(state.canvas, 0); assert.equal(state.main, 1);
  assert.equal(state.loadingLock, false); assert.equal(state.menuLock, false); assert.equal(state.menu, false); assert.equal(state.overflow, 0);
  assert(state.title.includes('EDURA'), label + ' route metadata');
  if (dev) {
    assert.equal(state.smoother, false, label + ' smoother cleanup'); assert.equal(state.triggers, 0, label + ' trigger cleanup');
    if (state.disposed) { assert.equal(state.disposed.frameSubscribers, 0); assert.equal(state.disposed.seenGeometries, state.disposed.geometries); assert.equal(state.disposed.seenMaterials, state.disposed.materials); assert.equal(state.disposed.memory.geometries, 0); }
  }
  return state;
}

async function enterWorks(page, lang) {
  await page.goto(`${base}/#work`, { waitUntil: 'domcontentloaded' }); await waitMain(page);
  if (dev) await page.evaluate(locale => routeQA.useLangStore.getState().setLang(locale), lang);
  else if (lang === 'en') {
    // Nav intentionally hides on downward entry; a native upward gesture reveals it.
    await page.mouse.wheel(0, -120); await page.waitForTimeout(700);
    await page.locator('[aria-controls="stellar-menu"]').click(); await page.locator('#stellar-menu').waitFor({ state: 'visible' });
    await page.locator('#stellar-menu button[aria-pressed]').filter({ hasText: 'EN' }).click(); await page.keyboard.press('Escape');
  }
  await page.waitForFunction(locale => document.documentElement.lang === locale, lang);
  await page.waitForTimeout(350); await page.mouse.wheel(0, 180); await page.waitForTimeout(1500);
  const background = await page.locator('[data-work-background]').boundingBox();
  await page.mouse.click(background.x + 8, background.y + Math.min(350, background.height * .4));
  await page.mouse.move(1, 1); await page.waitForTimeout(700);
  await page.locator('#work-target-edura').click();
  if (await page.locator('#work-target-edura').getAttribute('aria-pressed') !== 'true') await page.locator('#work-target-edura').click();
  await page.mouse.move(1, 1); await page.waitForTimeout(150);
  const cta = page.locator('[data-work-action]');
  assert.equal(await cta.getAttribute('href'), '/projects/edura'); assert.equal(await cta.evaluate(el => el.tagName), 'A');
  assert.equal(await cta.getAttribute('aria-disabled'), null);
  return sample(page, 'works-selected');
}

function assertRestore(before, after, label) {
  assert.equal(after.documentID, before.documentID, label + ' no full reload'); assert.equal(after.reader, 0); assert.equal(after.canvas, 1);
  assert.equal(after.loadingLock, false); assert.equal(after.menuLock, false); assert.equal(after.overflow, 0);
  assert.equal(after.work.selected, 'true'); assert.equal(after.work.preview, 'edura'); assert.equal(after.focus, 'work-target-edura');
  assert(Math.abs(after.visibleScroll - before.visibleScroll) <= 2, label + ` scroll ${after.visibleScroll} != ${before.visibleScroll}`);
  assert.equal(after.preloaderMounts, before.preloaderMounts, label + ' no intro replay');
  if (dev) {
    const saved = after.history?.stellar?.snapshot; assert(saved, label + ' per-entry snapshot');
    assert.equal(after.store.chapter, 'works'); assert.equal(after.store.selection, 'edura'); assert(Math.abs(after.store.progress - before.store.progress) < .002);
    assert(Math.abs(after.store.orbit.phase - saved.orbit.phase) < 1e-8, label + ' exact captured idle phase');
    assert.equal(after.camera.writers, 1); assert.equal(after.camera.glError, 0); for (let i = 0; i < 3; i++) assert(Math.abs(after.camera.position[i] - before.camera.position[i]) < 1e-7, label + ' camera pose');
  }
}

try {
  for (const width of quick ? [1440] : [390, 1440]) for (const lang of quick ? ['vi'] : ['vi', 'en']) for (const reduced of quick ? [false] : [false, true]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390, reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
    const page = await context.newPage(), record = { width, lang, reduced, status: 'running', errors: [], warnings: [], states: [] };
    report.configurations.push(record); save(); await attach(page, record);
    try {
      const before = await enterWorks(page, lang); record.states.push(before); await trackSceneDisposal(page);
      if (dev && !reduced) assert(before.store.orbit.phase > 0, 'Restore must be tested from a nonzero ambient phase');
      record.tabPath = [];
      for (let step = 0; step < 8; step++) {
        await page.keyboard.press('Tab');
        const focus = await page.evaluate(() => ({ id: document.activeElement.id, tag: document.activeElement.tagName, action: document.activeElement.hasAttribute('data-work-action'), outline: getComputedStyle(document.activeElement).outlineWidth }));
        record.tabPath.push(focus); if (focus.action) break;
      }
      assert(record.tabPath.at(-1)?.action, 'Native Tab reaches EDURA action'); assert.equal(record.tabPath.at(-1).outline, '2px');
      await page.keyboard.press('Enter'); await waitReader(page);
      const reader = await readerAssertions(page, 'native-enter-reader'); record.states.push(reader); assert.equal(reader.documentID, before.documentID);
      assert.equal(reader.lang, lang); assert.equal(reader.reduced, reduced); assert(reader.canonical?.endsWith('/projects/edura'));
      await page.screenshot({ path: path.join(out, `screenshots/${prefix}-${width}-${lang}-${reduced ? 'reduced' : 'normal'}-reader.png`) });
      await page.goBack(); await waitMain(page); const back = await sample(page, 'native-back'); record.states.push(back); assertRestore(before, back, 'native Back');
      await page.goForward(); await waitReader(page); record.states.push(await readerAssertions(page, 'native-forward'));
      await page.locator('[data-edura-return]').first().click(); await waitMain(page); const returned = await sample(page, 'return'); record.states.push(returned); assertRestore(before, returned, 'Return');
      await page.screenshot({ path: path.join(out, `screenshots/${prefix}-${width}-${lang}-${reduced ? 'reduced' : 'normal'}-restored.png`) });
      if (width === 1440 && lang === 'vi' && !reduced) {
        for (let cycle = 1; cycle <= 3; cycle++) {
          const cycleBefore = await sample(page, `cycle${cycle}-before`); await trackSceneDisposal(page); await page.locator('[data-work-action]').click(); await waitReader(page);
          record.states.push(await readerAssertions(page, `cycle${cycle}-reader`)); await page.goBack(); await waitMain(page);
          const cycleAfter = await sample(page, `cycle${cycle}-restore`); record.states.push(cycleAfter); assertRestore(cycleBefore, cycleAfter, `cycle${cycle}`);
        }
        const popupPromise = context.waitForEvent('page'); await page.locator('[data-work-action]').click({ modifiers: ['Control'] });
        const popup = await popupPromise; await popup.waitForLoadState('domcontentloaded'); await popup.locator('[data-edura-reader]').waitFor();
        record.modifiedClick = { openerURL: page.url(), popupURL: popup.url(), popupCanvas: await popup.locator('canvas').count() }; assert(record.modifiedClick.popupURL.endsWith('/projects/edura')); assert.equal(record.modifiedClick.popupCanvas, 0); assert(page.url().includes('#work')); await popup.close();
        const beforeReload = await sample(page, 'before-case-reload');
        await page.locator('[data-work-action]').click(); await waitReader(page); await page.reload({ waitUntil: 'domcontentloaded' }); await waitReader(page);
        record.states.push(await readerAssertions(page, 'entered-case-reload')); await page.locator('[data-edura-return]').first().click(); await waitMain(page);
        const afterReload = await sample(page, 'case-reload-return'); record.states.push(afterReload);
        assertRestore({ ...beforeReload, documentID: afterReload.documentID }, afterReload, 'case reload then Return');
      }
      assert.deepEqual(record.errors, []); record.status = 'pass';
      console.log(JSON.stringify({ width, lang, reduced, status: record.status, states: record.states.length }));
    } catch (error) { record.status = 'fail'; record.failure = String(error); throw error; }
    finally { report.warnings.push(...record.warnings); save(); await context.close(); }
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, hasTouch: true, serviceWorkers: 'block' });
  const page = await context.newPage(), extra = { name: 'direct-reload-reader-navigation', status: 'running', errors: [], warnings: [], states: [] }; report.extra.push(extra); await attach(page, extra);
  try {
    await page.goto(`${base}/projects/edura`, { waitUntil: 'domcontentloaded' }); await waitReader(page); extra.states.push(await readerAssertions(page, 'direct'));
    await page.reload({ waitUntil: 'domcontentloaded' }); await waitReader(page); extra.states.push(await readerAssertions(page, 'reload'));
    const en = page.locator('[data-edura-reader] header button[aria-pressed]').filter({ hasText: 'EN' }).first(); if (await en.count()) await en.click();
    else { await page.locator('[aria-controls="stellar-menu"]').click(); await page.locator('#stellar-menu button[aria-pressed]').filter({ hasText: 'EN' }).click(); await page.keyboard.press('Escape'); }
    await page.waitForFunction(() => document.documentElement.lang === 'en'); await page.setViewportSize({ width: 1440, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(250);
    extra.states.push(await readerAssertions(page, 'resize-language-motion')); await page.locator('[data-edura-return]').first().click(); await waitMain(page);
    const directReturn = await sample(page, 'direct-return'); extra.states.push(directReturn); assert.equal(directReturn.url, '/#work'); assert.equal(directReturn.focus, 'work-target-edura'); assert.equal(directReturn.work.selected, 'true');
    await page.goto(`${base}/projects/edura`, { waitUntil: 'domcontentloaded' }); await waitReader(page);
    await page.locator('[aria-controls="stellar-menu"]').click(); await page.locator('#stellar-menu').waitFor({ state: 'visible' });
    const anchor = page.locator('#stellar-menu a[href$="#about"]').first(); assert.equal(await anchor.count(), 1); await anchor.click(); await waitMain(page);
    const caseMenu = await sample(page, 'case-menu-about'); extra.states.push(caseMenu); assert.equal(caseMenu.url, '/#about'); assert.equal(caseMenu.reader, 0); assert.equal(caseMenu.menuLock, false); assert.equal(caseMenu.menu, false); if (dev) assert.equal(caseMenu.store.chapter, 'about');
    const outside = 'data:text/html,%3Ctitle%3ENative-history-check%3C/title%3E';
    await page.goto(outside); await page.goto(`${base}/projects/edura`, { waitUntil: 'domcontentloaded' }); await waitReader(page); await page.goBack(); await page.waitForURL(outside);
    extra.backOutside = { url: page.url(), reader: await page.locator('[data-edura-reader]').count() }; assert.equal(extra.backOutside.reader, 0);
    assert.deepEqual(extra.errors, []); extra.status = 'pass';
  } catch (error) { extra.status = 'fail'; extra.failure = String(error); throw error; }
  finally { save(); await context.close(); }
  report.status = 'pass';
} catch (error) { report.status = 'fail'; report.errors.push(String(error)); process.exitCode = 1; }
finally { await browser.close(); save(); }
console.log(JSON.stringify({ status: report.status, configurations: report.configurations.length, extra: report.extra.length, errors: report.errors }));
