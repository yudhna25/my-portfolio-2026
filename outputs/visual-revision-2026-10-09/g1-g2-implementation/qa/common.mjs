import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

export { chromium };
export const base = process.env.QA_BASE_URL ?? 'http://127.0.0.1:5199';
export const out = 'outputs/visual-revision-2026-10-09/g1-g2-implementation';
export const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
export const inventory = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? inventory(dir + '/' + e.name) : [dir + '/' + e.name]);
export const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
export const hashes = files => Object.fromEntries([...files].sort().map(file => [file, sha(file)]));
export const save = (name, value) => { fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(out + '/' + name, JSON.stringify(value, null, 2) + '\n'); };

// Inspect the loaded production modules and real Fiber root; never import an entry chunk or create another scene.
export async function ready(page, { opening = false } = {}) {
  await page.bringToFront();
  await page.waitForFunction(() => !document.hidden);
  if (!opening) {
    await page.waitForFunction(() => !document.querySelector('[data-preloader]') && !document.body.classList.contains('loading-lock'), undefined, { timeout: 15000 });
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve,5000))]));
  }
  for (let attempt = 0; attempt < 80; attempt++) {
    const attached = await page.evaluate(async () => {
      const canvas = document.querySelector('[data-galaxy-scene] canvas');
      if (!canvas) return false;
      const urls = performance.getEntriesByType('resource').map(entry => entry.name);
      const modules = await Promise.all([...new Set(urls.filter(url => /\/assets\/.*\.js$/.test(url) && !/\/assets\/(index|lab)-/.test(url)))].map(url => import(url)));
      const exports = modules.flatMap(module => Object.values(module));
      const store = exports.find(value => typeof value?.getState === 'function' && 'storyChapter' in value.getState());
      let fiber = canvas[Object.keys(canvas).find(key => key.startsWith('__reactFiber$'))], runtime;
      while (fiber && !runtime) {
        for (let hook = fiber.memoizedState; hook && !runtime; hook = hook.next) {
          const state = hook.memoizedState?.current;
          if (state?.gl && state?.scene && state?.camera && typeof state.get === 'function') runtime = state;
        }
        fiber = fiber.return;
      }
      const smoother = exports.find(value => value?.create && value?.get && !value?.getAll);
      const trigger = exports.find(value => value?.getAll && value?.refresh);
      const gsap = exports.find(value => value?.globalTimeline && value?.getById && value?.ticker);
      if (!store || !runtime || !smoother || !trigger) return false;
      window.motionQA = { store, root: { getState: runtime.get }, smoother, trigger, gsap };
      return true;
    });
    if (attached) return;
    await page.waitForTimeout(200);
  }
  throw new Error('Current production exports/Fiber root did not become observable');
}

export async function scrollChapter(page, chapter, progress) {
  const target = await page.evaluate(({ chapter, progress }) => {
    const content = document.getElementById('smooth-content'), top = content.getBoundingClientRect().top;
    const chapters = [...content.querySelectorAll('[data-story-chapter]')].map(el => ({ id: el.dataset.storyChapter, top: el.getBoundingClientRect().top - top })).sort((a, b) => a.top - b.top);
    const index = chapters.findIndex(item => item.id === chapter);
    if (index < 0) throw new Error('Missing chapter: ' + chapter);
    const end = chapters[index + 1]?.top ?? document.documentElement.scrollHeight - innerHeight;
    const y = chapters[index].top + (end - chapters[index].top) * progress;
    // Platform scroll only: the production producer must publish the chapter and progress.
    scrollTo({ top: y, behavior: 'instant' });
    return { chapter, progress, y };
  }, { chapter, progress });
  try { await page.waitForFunction(({ chapter, progress, y }) => {
    const state = motionQA.store.getState();
    const visibleY = motionQA.smoother.get()?.scrollTop() ?? scrollY;
    return (state.storyChapter === chapter || chapter === 'portal' && progress === 0 && state.storyChapter === 'hero') && Math.abs(state.chapterProgress - progress) < .003 && Math.abs(visibleY - y) < 1.1;
  }, target, { timeout: 7000 }); } catch(error) {
    error.message += '\n'+JSON.stringify({target,actual:await page.evaluate(()=>({chapter:motionQA.store.getState().storyChapter,p:motionQA.store.getState().chapterProgress,y:motionQA.smoother.get()?.scrollTop()??scrollY,nativeY:scrollY}))});
    throw new Error(error.message, {cause:error});
  }
  await page.waitForTimeout(180);
  return target;
}

export async function scene(page) {
  return page.evaluate(() => {
    const state = motionQA.store.getState(), root = motionQA.root.getState(), meteor = root.scene.getObjectByName('story-meteor');
    const head = root.scene.getObjectByName('story-meteor-head'), trail = root.scene.getObjectByName('story-meteor-trail');
    const uniform = head?.material?.uniforms;
    const point = uniform?.uHead.value.clone().project(root.camera);
    const visible = node => { for (let item = node; item; item = item.parent) if (!item.visible) return false; return Boolean(node); };
    const rect = selector => { const el = document.querySelector(selector); if (!el) return null; const box = el.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height, opacity: +getComputedStyle(el).opacity, transform: getComputedStyle(el).transform, inert: el.inert }; };
    const copyLayers = [...document.querySelectorAll('[data-portal-trails]')];
    const copies = copyLayers.flatMap(layer => [...layer.querySelectorAll('.portal-trail-copy')]);
    const timeline = motionQA.gsap?.getById('hero-year-meteors');
    return {
      chapter: state.storyChapter, p: state.chapterProgress, manual: state.storyManual, width: innerWidth, height: innerHeight,
      y: motionQA.smoother.get()?.scrollTop() ?? scrollY, canvas: document.querySelectorAll('canvas').length,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      smoother: Boolean(motionQA.smoother.get()), triggers: motionQA.trigger.getAll().length,
      camera: root.camera.position.toArray(), quaternion: root.camera.quaternion.toArray(), frameloop: root.frameloop,
      subscribers: root.internal.subscribers.length, resources: { ...root.gl.info.memory }, glError: root.gl.getContext().getError(),
      hero: rect('[data-portal-stage]'), year: rect('[data-hero-year] svg'), heading: rect('#hero-heading'), anchor: rect('[data-story-anchor="portal"]'),
      yearContours: rect('[data-year-contours]'),
      yearBase: [...document.querySelectorAll('.hero-year-base')].map(node => ({ stroke: getComputedStyle(node).stroke, width: getComputedStyle(node).strokeWidth, opacity: getComputedStyle(node).strokeOpacity })),
      yearTail: [...document.querySelectorAll('.hero-year-tail')].map(node => ({ dash: getComputedStyle(node).strokeDasharray, offset: getComputedStyle(node).strokeDashoffset })),
      yearDurations: timeline?.getChildren(false, true, false).map(tween => tween.duration()) ?? [],
      activeTimelines: ['hero-year-meteors', 'hero-year-twinkle', 'hero-year-glitch'].map(id => ({ id, active: motionQA.gsap?.getById(id)?.isActive() ?? false })),
      copies: { count: copies.length, focusable: copies.filter(node => !node.closest('[inert]') && (node.matches('a,button:not([disabled]),[tabindex="0"]') || node.querySelector('a:not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),[tabindex="0"]'))).length,
        layers: copyLayers.map(layer => ({ className: layer.className, inert: layer.inert, ariaHidden: layer.getAttribute('aria-hidden'), hidden: layer.hidden,
          progress: +layer.dataset.progress, sources: +layer.dataset.sourceCount, declared: +layer.dataset.copyCount,
          actual: layer.querySelectorAll('.portal-trail-copy').length, ribbons: layer.querySelectorAll('.portal-trail-ribbon:not(.portal-trail-common)').length,
          commonRibbons: layer.querySelectorAll('.portal-trail-common').length,
          identities: layer.querySelectorAll('[id],a[href],[tabindex]:not([tabindex="-1"])').length,
          samples: [...layer.querySelectorAll('.portal-trail-copy')].slice(0, 8).map(node => ({ transform: node.style.transform, opacity: +getComputedStyle(node).opacity })) })),
      },
      meteor: { visible: visible(meteor), journey: meteor?.userData.journey, span: meteor?.userData.span, tailPixels: meteor?.userData.tailPixels,
        core: uniform?.uCore.value, diameter: uniform?.uDiameter.value, opacity: uniform?.uOpacity.value,
        x: point ? (point.x + 1) * innerWidth / 2 : null, y: point ? (1 - point.y) * innerHeight / 2 : null,
        positions: trail ? [...trail.geometry.attributes.position.array] : [] },
      selection: state.worksSelection, hover: state.worksHover, orbit: { ...state.worksOrbit }, active: document.activeElement.id,
    };
  });
}

export async function capture(page, name) {
  fs.mkdirSync(out + '/screenshots', { recursive: true });
  await page.screenshot({ path: path.join(out, 'screenshots', name + '.png') });
}

export async function selectWork(page, id, touch) {
  const target = page.locator('#work-target-' + id);
  await target.waitFor({ state: 'visible' });
  const center = async () => {
    const box = await target.boundingBox();
    if (!box || box.width < 44 || box.height < 44) throw new Error('Projected Works hit region unavailable: ' + id);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  let point = await center();
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else {
    // Hover pauses the real moving figure; measure again before the native click.
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(250);
    point = await center();
    await page.mouse.click(point.x, point.y);
  }
  await page.waitForFunction(id => motionQA.store.getState().worksSelection === id, id);
}

export async function openingObserver(context) {
  await context.addInitScript(() => {
    const frames = [], start = performance.now();
    window.openingQA = { frames, started: start };
    let release;
    const rect = node => { if (!node) return null; const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, w: box.width, h: box.height, opacity: +getComputedStyle(node).opacity }; };
    const sample = time => {
      const loader = document.querySelector('[data-preloader]'), hero = document.querySelector('[data-portal-stage]');
      if (loader || hero) frames.push({ t: time - start, loader: rect(loader), hero: rect(hero), ring: rect(document.querySelector('[data-preloader-ring], [data-preloader-spinner]')), veil: rect(document.querySelector('[data-opening-veil]')),
        anchor: rect(document.querySelector('[data-story-anchor="portal"]')), locked: document.body?.classList.contains('loading-lock') ?? false,
        presentationDuration: loader?.dataset.openingDuration ? +loader.dataset.openingDuration : null, ready: loader?.dataset.openingReady ?? null,
        fontStatus: document.fonts.status, sceneReady: document.querySelector('[data-galaxy-scene]')?.dataset.sceneReady === 'true', fallback: Boolean(document.querySelector('[data-galaxy-scene]>[data-scene-fallback]')) });
      if (hero && !loader && !release) release = time;
      if (time - start < 12000 && (!release || time - release < 700)) requestAnimationFrame(tick);
    };
    // Sample after the frame's animation callbacks, including a late font reflow.
    const tick = time => setTimeout(() => sample(time), 0);
    requestAnimationFrame(tick);
  });
}

export function openingSummary(record) {
  const frames = record.frames, measured = frames.filter(frame => frame.presentationDuration !== null), last = frames.at(-1);
  const revealing = frames.filter(frame => frame.loader && frame.veil?.opacity < .98 && frame.ring?.opacity > .02);
  const alignment = revealing.filter(frame => frame.anchor).map(frame => Math.hypot(frame.ring.x + frame.ring.w / 2 - frame.anchor.x - frame.anchor.w / 2, frame.ring.y + frame.ring.h / 2 - frame.anchor.y - frame.anchor.h / 2));
  const sizes = revealing.filter(frame => frame.anchor?.h).map(frame => frame.ring.w * .84 / frame.anchor.h);
  return { frameCount: frames.length, firstLoaderMs: frames.find(frame => frame.loader)?.t, firstPresentationMs: measured[0]?.t,
    releaseMs: frames.find(frame => !frame.loader && frame.hero)?.t, duration: measured[0]?.presentationDuration, ready: measured[0]?.ready,
    revealFrames: revealing.length, maximumRevealAlignmentPx: alignment.length ? Math.max(...alignment) : null,
    minimumPhotonSizeRatio: sizes.length ? Math.min(...sizes) : null, maximumPhotonSizeRatio: sizes.length ? Math.max(...sizes) : null,
    blankRevealFrames: revealing.filter(frame => !frame.hero || frame.hero.opacity < .9).length,
    final: last ? { heroOpacity: last.hero?.opacity, locked: last.locked, fallback: last.fallback } : null };
}
