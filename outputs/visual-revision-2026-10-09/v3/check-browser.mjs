// Output-only V3 QA: held story progress uses the existing store and scroll bridge.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.STELLAR_PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.STELLAR_PLAYWRIGHT_MODULE).href : 'playwright');
const out = 'outputs/visual-revision-2026-10-09/v3';
const base = process.argv.find(value => value.startsWith('http')) || 'http://127.0.0.1:5183';
const smoke = process.argv.includes('--smoke');
const lifecycleOnly = process.argv.includes('--lifecycle-only');
const labSmoke = process.argv.includes('--lab-smoke');
const tailOnly = process.argv.includes('--tail-only');
const backdropOnly = process.argv.includes('--backdrop-only');
const checkpoints = [0, .25, .44, .47, .50, .70, .94, 1];
const sourceFiles = ['src/App.jsx', 'src/components/Hero.jsx', 'src/components/effects/PortalHeading.jsx',
  'src/components/About.jsx', 'src/components/layout/Nav.jsx', 'src/components/Cursor.jsx',
  'src/3d/GalaxyScene.jsx', 'src/3d/components/CameraRig.jsx', 'src/3d/utils/cameraPath.js',
  'src/3d/utils/portal.js', 'src/3d/hooks/useScrollProgress.js', 'src/stores/useScrollStore.js',
  'src/3d/components/BlackHole.jsx', 'src/3d/components/BlackHoleSystem.jsx',
  'src/3d/components/BlackHoleBloomMask.jsx', 'src/3d/shaders/blackHole.js', 'src/3d/quality.js'];
sourceFiles.push('src/3d/components/StarField.jsx', 'src/3d/components/Nebula.jsx',
  'src/3d/components/SceneFallback.jsx', 'src/styles/hero.css', 'src/3d-lab.jsx');
const source = () => Object.fromEntries(sourceFiles.map(file => [file, createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
fs.mkdirSync(`${out}/screenshots`, { recursive: true });
const report = { started: new Date().toISOString(), base, sourceBefore: source(), browser: null,
  configurations: [], comparisons: [], scenarios: [], lifecycle: [], errors: [], warnings: [],
  limits: ['Desktop Edge headless; 390px/touch viewport is not a physical phone.',
    'Held checkpoints use the existing story store and exact visible scroll; native producer sampled separately.',
    'Authored pose/uniforms/DOM state compared at equal progress; ambient uTime, idle glitch/dots and pointer following recorded separately.',
    'No FPS claim, GPU benchmark, screen reader, OS motion switch, public HTTPS, Safari or Firefox validation.'] };
if (tailOnly) {
  const previous = JSON.parse(fs.readFileSync(`${out}/browser-results.json`, 'utf8'));
  assert.deepEqual(previous.sourceAfter, report.sourceBefore, 'Resume only the exact source already captured');
  assert.deepEqual(previous.sourceBefore, report.sourceBefore, 'Previous checkpoint evidence had no source drift');
  Object.assign(report, previous, { tailResumedAt: new Date().toISOString(), tailResumedFrom: 'browser-attempt-2.json' });
  delete report.status; delete report.failure; delete report.finished;
  report.configurations = report.configurations.filter(item => item.frames.length > 0);
  report.scenarios = report.scenarios.filter(item => item.label !== 'initial-no-webgl');
}
if (backdropOnly) {
  const integrated = JSON.parse(fs.readFileSync(`${out}/browser-results.json`, 'utf8'));
  assert.deepEqual(report.sourceBefore, integrated.sourceAfter, 'Backdrop checks use the same integrated source as the matrix');
  const scope = JSON.parse(fs.readFileSync(`${out}/scope-results.json`, 'utf8'));
  const entries = [...scope.currentV3Sources, ...scope.preservedV2Pipeline];
  for (const entry of entries) assert.equal(report.sourceBefore[entry.path], entry.sha256, `Final scope/build source differs: ${entry.path}`);
  report.matchesIntegratedEvidence = { file: 'browser-results.json', sourceEqual: true,
    finalScopeFile: 'scope-results.json', finalScopeSourceEqual: true };
}
if (fs.existsSync(`${out}/scope-results.json`)) {
  const scope = JSON.parse(fs.readFileSync(`${out}/scope-results.json`, 'utf8'));
  for (const entry of [...scope.currentV3Sources, ...scope.preservedV2Pipeline])
    assert.equal(report.sourceBefore[entry.path], entry.sha256, `Source differs from final scope/build snapshot: ${entry.path}`);
  report.finalScopeSourceCheck = { file: 'scope-results.json', checkedAt: scope.checkedAt, sourceEqual: true };
}
const save = () => fs.writeFileSync(`${out}/${smoke ? 'browser-smoke-results' : lifecycleOnly ? 'browser-lifecycle-results' : labSmoke ? 'browser-lab-results' : backdropOnly ? 'browser-backdrop-results' : 'browser-results'}.json`, JSON.stringify(report, null, 2) + '\n');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
report.browser = browser.version();
let page, context, current;

async function ready() {
  await page.waitForSelector('[data-galaxy-scene] canvas');
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  // Direct hash restoration can finish a transient StrictMode Canvas before this mount settles.
  await page.waitForTimeout(650);
  await page.waitForFunction(async () => {
    const canvas = document.querySelector('canvas');
    const urls = [...new Set(performance.getEntriesByType('resource').map(entry => entry.name)
      .filter(url => url.includes('/@react-three_fiber.js') && !url.endsWith('.map')))];
    for (const url of urls) {
      const fiber = await import(url), root = fiber._roots?.get(canvas)?.store;
      if (root?.getState().scene.getObjectByName('accretion-disk')) {
        // Back may leave multiple resource entries; select the module owning this Canvas.
        window.v3ReadyFiberUrl = url;
        window.v3ReadyRoot = root;
        window.v3ReadyCanvas = canvas;
        return true;
      }
    }
    return false;
  });
  await page.evaluate(async () => {
    const resourceUrls = performance.getEntriesByType('resource').map(entry => entry.name);
    const loaded = part => resourceUrls.filter(url => url.includes(part)).at(-1);
    const moduleUrls = { scroll: loaded('/src/stores/useScrollStore.js') || '/src/stores/useScrollStore.js',
      gsap: loaded('/src/hooks/useGSAPSetup.js') || '/src/hooks/useGSAPSetup.js',
      fiberObserved: resourceUrls.filter(url => url.includes('/@react-three_fiber.js') && !url.endsWith('.map')) };
    const scroll = await import(moduleUrls.scroll);
    const gsap = await import(moduleUrls.gsap);
    let fiber, root;
    const rootCandidates = [];
    for (const url of [...new Set([window.v3ReadyFiberUrl, ...moduleUrls.fiberObserved,
      '/node_modules/.vite/deps/@react-three_fiber.js'].filter(Boolean))]) {
      const candidate = await import(url), candidateRoot = candidate._roots?.get(document.querySelector('canvas'))?.store;
      rootCandidates.push({ url, roots: [...candidate._roots].map(([canvas, value]) => ({ current: canvas === document.querySelector('canvas'),
        connected: canvas.isConnected, active: value.store.getState().internal.active,
        disk: !!value.store.getState().scene.getObjectByName('accretion-disk') })) });
      if (candidateRoot?.getState().scene.getObjectByName('accretion-disk')) {
        fiber = candidate; root = candidateRoot; moduleUrls.fiber = url; break;
      }
    }
    if (!root) throw new Error(`No mounted Canvas root: ${JSON.stringify({ moduleUrls, rootCandidates, canvasCount: document.querySelectorAll('canvas').length,
      readyCanvasSame: window.v3ReadyCanvas === document.querySelector('canvas'), readyRootActive: window.v3ReadyRoot?.getState().internal.active,
      readyFiberUrl: window.v3ReadyFiberUrl, url: location.href })}`);
    window.v3ReadyCanvas = document.querySelector('canvas');
    window.v3qa?.cleanups.forEach(dispose => dispose());
    const qa = window.v3qa = { fiber, scroll: scroll.useScrollStore, gsap,
      root, moduleUrls, frames: 0, rays: 0,
      perFrame: [], ray: null, target: null, targets: new Map(), disposals: [], rayDisposed: 0,
      watched: new WeakSet(), cleanups: [],
      ranges() {
        const content = document.getElementById('smooth-content'), top = content.getBoundingClientRect().top;
        const list = [...content.querySelectorAll('[data-story-chapter]')].map(element => ({ id: element.dataset.storyChapter,
          top: element.getBoundingClientRect().top - top, height: element.offsetHeight })).sort((a, b) => a.top - b.top);
        for (let i = 0; i < list.length; i++) list[i].end = list[i + 1]?.top ?? document.documentElement.scrollHeight - innerHeight;
        return list;
      },
    };
    const renderer = qa.root.getState().gl;
    const render = renderer.render.bind(renderer), setTarget = renderer.setRenderTarget.bind(renderer);
    renderer.setRenderTarget = target => {
      if (target && !qa.targets.has(target)) {
        qa.targets.set(target, target.texture.uuid);
        target.addEventListener('dispose', () => qa.disposals.push({ id: target.texture.uuid, width: target.width, height: target.height }));
      }
      return setTarget(target);
    };
    renderer.render = (scene, camera) => {
      const material = scene.children[0]?.material;
      if (material?.uniforms?.uObserver) {
        qa.rays++;
        qa.ray = material;
        qa.target = renderer.getRenderTarget();
        if (!qa.watched.has(material)) {
          qa.watched.add(material);
          material.addEventListener('dispose', () => qa.rayDisposed++);
        }
      }
      return render(scene, camera);
    };
    qa.cleanups.push(fiber.addAfterEffect(() => {
      qa.frames++;
      qa.perFrame.push(qa.rays);
      if (qa.perFrame.length > 120) qa.perFrame.shift();
      qa.rays = 0;
    }));
  });
  try {
    await page.waitForFunction(() => !!v3qa.ray && v3qa.frames >= 3, null, { timeout: 10000 });
  } catch (error) {
    report.readyDiagnostic = await page.evaluate(() => {
      const state = v3qa.root.getState();
      return { frames: v3qa.frames, ray: !!v3qa.ray, url: location.href, visibility: document.visibilityState,
        active: state.internal.active, frameloop: state.frameloop, canvasSame: document.querySelector('canvas') === v3ReadyCanvas,
        mappedCurrent: v3qa.fiber._roots.has(document.querySelector('canvas')),
        rootCount: v3qa.fiber._roots.size, actualRoots: [...v3qa.fiber._roots].map(([canvas, root]) => ({ connected: canvas.isConnected,
          current: canvas === document.querySelector('canvas'), active: root.store.getState().internal.active,
          geometryCount: root.store.getState().gl.info.memory.geometries })),
        memory: state.gl.info.memory, chapter: v3qa.scroll.getState().storyChapter };
    });
    throw error;
  }
}

async function setup(width, height, locale = 'vi', suffix = '', url = base) {
  context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1,
    hasTouch: width < 768, reducedMotion: 'no-preference', serviceWorkers: 'block' });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  // Capture one source revision even if an independent artwork worker updates Vite.
  await page.routeWebSocket('**', ws => ws.send('{"type":"connected"}'));
  current = { id: `${width}-${locale}${suffix}`, width, height, locale, frames: [] };
  report.configurations.push(current);
  page.on('pageerror', error => { report.errors.push({ id: current.id, message: error.message }); save(); });
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) report[message.type() === 'error' ? 'errors' : 'warnings']
      .push({ id: current.id, type: message.type(), message: message.text() });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await ready();
  await language(locale);
  current.environment = await page.evaluate(() => {
    const frame = v3qa.root.getState(), gl = frame.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { userAgent: navigator.userAgent, dpr: devicePixelRatio, rendererDpr: frame.gl.getPixelRatio(),
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), ranges: v3qa.ranges(), moduleUrls: v3qa.moduleUrls };
  });
  assert(Math.abs(current.environment.ranges.find(range => range.id === 'portal').height - height * 4) < 2,
    'Full-motion portal must occupy 400vh');
}

async function language(locale) {
  await page.evaluate(async locale => {
    const { useLangStore } = await import('/src/stores/useLangStore.js');
    useLangStore.getState().setLang(locale);
    await document.fonts.ready;
    v3qa.gsap.ScrollTrigger.refresh();
  }, locale);
  await page.waitForFunction(locale => document.documentElement.lang === locale, locale);
  await page.waitForTimeout(150);
}

async function seek(chapter, p, settle = 120) {
  await page.evaluate(({ chapter, p }) => {
    const range = v3qa.ranges().find(range => range.id === (chapter === 'hero' ? 'portal' : chapter));
    const y = range.top + (range.end - range.top) * p;
    v3qa.scroll.getState().setStoryPosition(chapter, p, y / Math.max(1, document.documentElement.scrollHeight - innerHeight), true);
    const smoother = v3qa.gsap.ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTop(y);
      const trigger = smoother.scrollTrigger;
      trigger.update();
      const tween = trigger.getTween();
      if (typeof tween?.progress === 'function') tween.progress(1).pause();
      trigger.animation.progress(trigger.progress);
    } else scrollTo(0, y);
  }, { chapter, p });
  await page.waitForTimeout(settle);
  // Read only after the existing camera/HDR callbacks have consumed this seek.
  await page.evaluate(() => new Promise(resolve => { const off = v3qa.fiber.addAfterEffect(() => { off(); resolve(); }); }));
}

async function snapshot() {
  return page.evaluate(() => {
    const state = v3qa.scroll.getState(), frame = v3qa.root.getState(), gl = frame.gl.getContext();
    const value = item => typeof item === 'number' ? item : item?.toArray?.() ?? null;
    const ray = Object.fromEntries(Object.entries(v3qa.ray.uniforms).map(([key, uniform]) => [key, value(uniform.value)]));
    const copy = frame.scene.getObjectByName('accretion-disk').material.uniforms;
    const cssState = element => {
      const css = getComputedStyle(element), rect = element.getBoundingClientRect();
      return { tag: element.tagName, id: element.id, layer: element.dataset.heroLayer ?? element.dataset.aboutGroup ?? element.dataset.aboutMotion ?? '',
        ambient: element.matches('nav[aria-label], [data-custom-cursor]'),
        transform: css.transform, translate: css.translate, opacity: css.opacity, visibility: css.visibility,
        display: css.display, inert: element.inert, ariaHidden: element.getAttribute('aria-hidden'),
        rect: [rect.x, rect.y, rect.width, rect.height] };
    };
    const dom = [...document.querySelectorAll('[data-portal-stage], [data-hero-content], [data-hero-layer], [data-portal-char], '
      + '[data-story-content], [data-about-motion], #about, #about [data-about-group], #about header, #about figure, '
      + '#about [data-about-bio], [data-about-backdrop], [data-portal-controls], [data-cursor-portal], nav[aria-label], [data-custom-cursor]')]
      .map(cssState);
    const backdrop = frame.scene.getObjectByName('portal-backdrop');
    const ambient = [];
    const authoredScene = [];
    frame.scene.traverse(object => {
      if (object.material?.uniforms?.uTime) ambient.push({ name: object.name, uTime: object.material.uniforms.uTime.value });
      if (['star-field', 'nebula'].includes(object.name)) {
        const uniforms = object.material.uniforms;
        const activePortal = uniforms.uPortal.value === 1;
        let positionHash = 2166136261;
        const positions = object.geometry.attributes.position.array;
        const bits = new Uint32Array(positions.buffer, positions.byteOffset, positions.length);
        for (const item of bits) positionHash = Math.imul(positionHash ^ item, 16777619) >>> 0;
        authoredScene.push({ name: object.name, visible: object.visible, parentVisible: object.parent.visible,
          position: object.position.toArray(), scale: object.scale.toArray(), quaternion: object.quaternion.toArray(),
          geometry: { id: object.geometry.uuid, count: positions.length / 3, positionFnv32: positionHash.toString(16) },
          activePortal, uniforms: Object.fromEntries(Object.entries(uniforms).filter(([key]) => activePortal || key !== 'uTime')
            .map(([key, uniform]) => [key, value(uniform.value)])) });
      }
    });
    const producers = v3qa.gsap.gsap.ticker._listeners.filter(listener => {
      const text = listener.toString();
      return text.includes('state.storyManual') && text.includes('maxScroll') && text.includes('section.top');
    }).length;
    return { chapter: state.storyChapter, p: state.chapterProgress, manual: state.storyManual,
      lang: document.documentElement.lang, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      canvas: document.querySelectorAll('canvas').length, producers,
      cameraWriters: frame.internal.subscribers.filter(subscriber => subscriber.priority === -1).length,
      pose: [...frame.camera.position.toArray(), ...frame.camera.quaternion.toArray(), frame.camera.fov],
      ray, uniformFinite: Object.values(ray).filter(item => item !== null).flat().every(Number.isFinite),
      shared: Object.keys(copy).filter(key => key !== 'uImage').every(key => copy[key] === v3qa.ray.uniforms[key]),
      rayPasses: v3qa.perFrame.slice(-20), target: [v3qa.target.width, v3qa.target.height],
      buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], rayId: v3qa.target.texture.uuid,
      memory: { ...frame.gl.info.memory }, programs: frame.gl.info.programs.length, observedTargets: v3qa.targets.size,
      targetDisposals: v3qa.disposals.length, dom, backdrop: backdrop ? { visible: backdrop.visible,
        position: backdrop.position.toArray(), scale: backdrop.scale.toArray(), quaternion: backdrop.quaternion.toArray() } : null,
      ambient, authoredScene, overflow: document.documentElement.scrollWidth - innerWidth,
      anchor: state.storyAnchor, scroll: v3qa.gsap.ScrollSmoother.get()?.scrollTop() ?? scrollY,
      focus: { id: document.activeElement?.id, tag: document.activeElement?.tagName,
        hidden: !!document.activeElement?.closest('[inert], [aria-hidden="true"]') },
      triggers: v3qa.gsap.ScrollTrigger.getAll().map(trigger => trigger.vars.id ?? null),
      glError: gl.getError(), heroIdle: document.querySelector('[data-portal-stage]')?.dataset.heroIdle };
  });
}

function check(state) {
  assert.equal(state.canvas, 1, 'Exactly one Canvas');
  assert.equal(state.cameraWriters, 1, 'Exactly one priority -1 camera writer');
  assert.equal(state.producers, 1, 'Exactly one existing story producer');
  assert.equal(state.uniformFinite, true);
  assert.equal(state.shared, true, 'HDR copy reads shared portal wrappers');
  assert.deepEqual(state.target, state.buffer, 'Ray HDR target traces current physical buffer');
  assert.equal(state.glError, 0);
  assert(state.pose.every(Number.isFinite));
  assert(state.rayPasses.length > 0 && state.rayPasses.every(count => count === 1), 'One HDR pass per measured Fiber frame');
  assert(Math.hypot(...state.ray.uObserver) >= 1.099999);
  assert.equal(state.overflow, 0, 'No horizontal page overflow in captured state');
}

function compare(actual, expected, label) {
  const near = (a, b) => {
    if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((item, index) => near(item, b[index]));
    return typeof a === 'number' ? Number.isFinite(a) && Math.abs(a - b) <= 1e-7 : a === b;
  };
  assert(near(actual.pose, expected.pose), `${label}: camera pose`);
  const keys = Object.keys(actual.ray).filter(key => key !== 'uTime' && !key.startsWith('uFinale'));
  for (const key of keys) assert(near(actual.ray[key], expected.ray[key]), `${label}: ${key}`);
  assert.deepEqual(actual.backdrop, expected.backdrop, `${label}: authored backdrop`);
  let maxBackdropUniformJsDelta = 0;
  if (actual.authoredScene && expected.authoredScene) {
    assert.equal(actual.authoredScene.length, expected.authoredScene.length);
    const gpuEqual = (a, b) => Array.isArray(a) ? Array.isArray(b) && a.length === b.length && a.every((value, index) => gpuEqual(value, b[index]))
      : typeof a === 'number' ? Math.fround(a) === Math.fround(b) : a === b;
    actual.authoredScene.forEach((consumer, index) => {
      const old = expected.authoredScene[index];
      for (const key of ['name', 'visible', 'parentVisible', 'activePortal', 'geometry']) assert.deepEqual(consumer[key], old[key]);
      for (const key of ['position', 'scale', 'quaternion']) assert(near(consumer[key], old[key]));
      assert.deepEqual(Object.keys(consumer.uniforms), Object.keys(old.uniforms));
      for (const key of Object.keys(consumer.uniforms)) {
        assert(gpuEqual(consumer.uniforms[key], old.uniforms[key]), `${label}: live ${consumer.name} ${key} float32 shader value`);
        const values = [consumer.uniforms[key]].flat(), before = [old.uniforms[key]].flat();
        maxBackdropUniformJsDelta = Math.max(maxBackdropUniformJsDelta, ...values.map((value, i) => Math.abs(value - before[i])));
      }
    });
  }
  assert.equal(actual.dom.length, expected.dom.length, `${label}: same semantic DOM`);
  let rectDelta = 0;
  actual.dom.forEach((node, index) => {
    const old = expected.dom[index];
    // Cursor pointer following/visibility and Nav directional auto-hide are ambient;
    // the dedicated portal-control wrapper carries their authored intake state.
    if (!node.ambient) for (const key of ['tag', 'id', 'layer', 'transform', 'translate', 'opacity', 'visibility', 'display', 'inert', 'ariaHidden'])
      assert.equal(node[key], old[key], `${label}: DOM ${index} ${key}`);
    rectDelta = Math.max(rectDelta, ...node.rect.map((value, i) => Math.abs(value - old.rect[i])));
  });
  report.comparisons.push({ id: current.id, label, poseEqual: true, activeRayUniformsEqual: true,
    authoredBackdropEqual: true, authoredDomGateTransformEqual: true, maxRectDelta: rectDelta,
    liveBackdropConsumerStateEqual: actual.authoredScene && expected.authoredScene ? true : null,
    maxBackdropUniformJsDelta, backdropUniformComparison: 'Exact float32 values submitted to GLSL; JS deltas recorded separately',
    ambient: { before: expected.ambient, after: actual.ambient } });
}

async function capture(label) {
  const state = await snapshot();
  check(state);
  if (current.frames.length) assert.equal(state.rayId, current.frames[0].rayId, 'Persistent HDR target during the story checkpoints');
  const file = `${out}/screenshots/${current.id}-${label}.png`;
  await page.screenshot({ path: file });
  current.frames.push({ label, file, ...state });
  save();
  console.log(`${current.id} ${label} p=${state.p} Canvas=${state.canvas} producer=${state.producers}`);
  return state;
}

async function backdropEvidence() {
  const forwards = new Map();
  const read = async label => {
    const state = await snapshot(); check(state);
    assert.equal(state.authoredScene.length, 3, 'One StarField and two Nebula consumers');
    assert(state.authoredScene.every(consumer => consumer.activePortal));
    assert(state.authoredScene.every(consumer => Object.values(consumer.uniforms).flat().every(Number.isFinite)));
    if (current.frames.length) {
      assert.equal(state.rayId, current.frames[0].rayId);
      assert.deepEqual(state.authoredScene.map(consumer => consumer.geometry), current.frames[0].authoredScene.map(consumer => consumer.geometry),
        'Backdrop geometry UUID/count/position bits remain unchanged throughout the portal');
    }
    current.frames.push({ label, ...state }); save(); return state;
  };
  for (const p of checkpoints) { await seek('portal', p); forwards.set(p, await read(`backdrop-forward-${p}`)); }
  for (const p of [...checkpoints].reverse()) {
    await seek('portal', p); const actual = await read(`backdrop-reverse-${p}`);
    compare(actual, forwards.get(p), `backdrop-reverse-${p}`);
  }
  await seek('portal', .70); const before = await snapshot();
  await page.waitForTimeout(700); const stopped = await snapshot(); check(stopped);
  compare(stopped, before, 'backdrop-held-stop-700ms');
  assert.deepEqual(stopped.memory, before.memory); assert.equal(stopped.programs, before.programs);
  report.scenarios.push({ id: current.id, label: 'backdrop-stop', p: stopped.p,
    liveConsumers: stopped.authoredScene, memory: stopped.memory, programs: stopped.programs, glError: stopped.glError });
  console.log(`PASS backdrop ${current.id}: 16 live snapshots + stop; three consumers`);
}

async function scenarios() {
  await seek('portal', .70);
  const hold = await snapshot();
  await page.waitForTimeout(700);
  const stopped = await snapshot();
  check(stopped); compare(stopped, hold, 'held-stop-700ms');
  assert.deepEqual(stopped.memory, hold.memory, 'Stopped scene does not allocate GPU geometry/textures');
  assert.equal(stopped.programs, hold.programs, 'Stopped scene programs stable');
  report.scenarios.push({ id: current.id, label: 'stop', before: hold.p, after: stopped.p });

  const p25 = current.frames.find(frame => frame.label === 'portal-forward-0.25');
  for (const p of [.94, .25, .70, .44, .50, 0, 1, .25]) await seek('portal', p, 20);
  const rapid = await snapshot(); check(rapid); compare(rapid, p25, 'rapid-reverse-jump');

  await seek('about', 0);
  const about = await snapshot(); check(about);
  assert(about.dom.find(node => node.id === 'about').visibility === 'visible');
  assert.equal(await page.locator('#about').count(), 1, 'True About DOM remains unique');
  report.scenarios.push({ id: current.id, label: 'jump-about', ...about });

  await seek('portal', .70);
  await language(current.locale === 'vi' ? 'en' : 'vi');
  const changed = await snapshot(); check(changed);
  assert.equal(changed.chapter, 'portal'); assert.equal(changed.p, .70);
  await language(current.locale);
  report.scenarios.push({ id: current.id, label: 'locale-mid-ejection', preservedChapter: changed.chapter, preservedProgress: changed.p });

  // Native wheel verifies the mounted producer rather than held-store checkpoints.
  await seek('portal', .25);
  await page.evaluate(() => v3qa.scroll.getState().setStoryManual(false));
  const nativeStart = await snapshot();
  await page.mouse.wheel(0, 180);
  await page.waitForTimeout(1600);
  const nativeForward = await snapshot(); check(nativeForward);
  assert.equal(nativeForward.manual, false); assert(nativeForward.p > nativeStart.p);
  await page.mouse.wheel(0, -180);
  await page.waitForTimeout(1600);
  const nativeReverse = await snapshot(); check(nativeReverse);
  assert(nativeReverse.p < nativeForward.p);
  await page.waitForTimeout(500);
  const nativeStop = await snapshot();
  assert(Math.abs(nativeStop.p - nativeReverse.p) < .001, 'Native stop stays in authored pose after settling');
  report.scenarios.push({ id: current.id, label: 'native-wheel-forward-reverse-stop',
    samples: [nativeStart, nativeForward, nativeReverse, nativeStop].map(state => ({ p: state.p, manual: state.manual, pose: state.pose })) });
}

async function extendedScenarios() {
  await seek('hero', 0);
  await page.waitForFunction(() => document.querySelector('[data-year-digit]')?.dataset.digit === '7', null, { timeout: 20000 });
  await capture('hero-glitch-hold-7');
  await seek('portal', .25);
  assert.equal(await page.locator('[data-year-digit]').getAttribute('data-digit'), '6', 'Leaving idle resets glitch to semantic year');
  const original = page.viewportSize();
  await seek('portal', .70);
  const beforeResize = await snapshot();
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.waitForTimeout(800);
  await seek('portal', .70);
  const resized = await snapshot(); check(resized);
  assert.equal(resized.chapter, 'portal'); assert.equal(resized.p, .70);
  await page.setViewportSize(original);
  await page.waitForTimeout(800);
  await seek('portal', .70);
  const restored = await snapshot(); check(restored);
  assert.equal(restored.rayId, beforeResize.rayId);
  compare(restored, beforeResize, 'resize-restored');
  report.scenarios.push({ id: current.id, label: 'resize', oldTarget: beforeResize.target,
    resizedTarget: resized.target, restoredTarget: restored.target, targetDisposals: restored.targetDisposals });

  for (let cycle = 1; cycle <= 3; cycle++) {
    await seek('portal', cycle % 2 ? .25 : .70);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(800);
    const reduced = await snapshot(); check(reduced);
    const ranges = await page.evaluate(() => v3qa.ranges());
    const range = ranges.find(range => range.id === 'portal');
    assert(range.height <= original.height * 1.5, 'Reduced portal is short');
    assert.equal(await page.locator('#about').count(), 1);
    await seek('about', 0);
    const readable = await snapshot(); check(readable);
    assert.equal(readable.dom.find(node => node.id === 'about').visibility, 'visible');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(800);
    await seek('portal', .70);
    const normal = await snapshot(); check(normal);
    assert.equal(normal.rayId, beforeResize.rayId);
    assert.deepEqual(normal.memory, restored.memory, 'GPU geometry/textures stable after each live motion cycle');
    report.scenarios.push({ id: current.id, label: 'motion-cycle', cycle, reduced,
      shortPortalHeight: range.height, normalMemory: normal.memory, normalPrograms: normal.programs });
  }

  await seek('hero', 0);
  await page.locator('button[aria-controls="stellar-menu"]').click();
  await page.waitForFunction(() => document.getElementById('stellar-menu').open);
  await page.waitForTimeout(800);
  const menuBefore = await snapshot();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.getElementById('stellar-menu').contains(document.activeElement)));
  await language('en');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('stellar-menu').open);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('stellar-menu-open')), false);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForTimeout(500);
  await language('vi');
  report.scenarios.push({ id: current.id, label: 'menu-locale-motion-escape', initialChapter: menuBefore.chapter,
    released: true, focus: (await snapshot()).focus });

  // The skip link must stay keyboard reachable while visual controls are swallowed.
  await seek('portal', .47);
  const skip = page.locator('header > a[href="#about"], a[href="#smooth-content"], a[data-story-skip]');
  assert.equal(await skip.count(), 1);
  await skip.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  const skipped = await snapshot(); check(skipped);
  report.scenarios.push({ id: current.id, label: 'keyboard-skip-from-core', ...skipped });
  assert.equal(skipped.chapter, 'about', 'Skip reaches readable content without replaying intake');
  assert.equal(skipped.focus.hidden, false, 'Skip leaves focus outside an inert/hidden subtree');

  await routeCycles();
}

async function routeCycles() {
  for (let cycle = 1; cycle <= 3; cycle++) {
    await seek('works', .2);
    // Back restores the selection; clicking it again would intentionally dismiss its preview.
    if (await page.locator('#work-target-edura').getAttribute('aria-pressed') !== 'true') await page.locator('#work-target-edura').click();
    await page.waitForSelector('#work-case-edura');
    await page.waitForTimeout(300);
    const old = await snapshot();
    await page.locator('#work-case-edura').click();
    await page.waitForSelector('#edura-title');
    await page.waitForFunction(() => document.querySelectorAll('canvas').length === 0);
    const unmounted = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length,
      smoother: !!v3qa.gsap.ScrollSmoother.get(), memory: { ...v3qa.root.getState().gl.info.memory },
      targets: [...v3qa.targets.values()], disposals: v3qa.disposals, rayDisposed: v3qa.rayDisposed,
      subscribers: v3qa.root.getState().internal.subscribers.length,
      producers: v3qa.gsap.gsap.ticker._listeners.filter(listener => {
        const text = listener.toString(); return text.includes('state.storyManual') && text.includes('maxScroll') && text.includes('section.top');
      }).length }));
    assert.equal(unmounted.canvases, 0); assert.equal(unmounted.smoother, false); assert.equal(unmounted.producers, 0);
    assert(unmounted.disposals.some(item => item.id === old.rayId)); assert(unmounted.rayDisposed > 0);
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#work-target-edura');
    // Fiber retires an unmounted renderer asynchronously; avoid instrumenting its transient root.
    await page.waitForTimeout(750);
    await ready();
    await page.waitForFunction(() => v3qa.scroll.getState().storyChapter === 'works' && !v3qa.scroll.getState().storyManual);
    await page.waitForTimeout(700);
    const restored = await snapshot(); check(restored);
    assert.equal(restored.chapter, 'works');
    assert(Math.abs(restored.p - old.p) < .003, 'EDURA Back restores Works progress');
    assert.equal(restored.focus.id, 'work-target-edura');
    report.lifecycle.push({ cycle, unmounted, restored: { chapter: restored.chapter, p: restored.p,
      canvas: restored.canvas, producers: restored.producers, cameraWriters: restored.cameraWriters,
      memory: restored.memory, programs: restored.programs, focus: restored.focus }, skippedPortal: true });
  }
}

async function fallbackChecks() {
  const readFallback = () => page.evaluate(() => {
    const about = document.getElementById('about'), portal = document.querySelector('[data-story-chapter="portal"]');
    const css = getComputedStyle(about);
    return { canvas: document.querySelectorAll('canvas').length, fallback: !!document.querySelector('[data-scene-fallback]'),
      height: innerHeight, portalHeight: portal.offsetHeight, aboutCount: document.querySelectorAll('#about').length,
      about: { visibility: css.visibility, inert: about.inert, ariaHidden: about.getAttribute('aria-hidden') },
      overflow: document.documentElement.scrollWidth - innerWidth };
  });
  const checkFallback = state => {
    assert.equal(state.canvas, 0); assert.equal(state.fallback, true); assert.equal(state.aboutCount, 1);
    assert(state.portalHeight <= state.height * 1.5, 'No blank 400vh in fallback');
    assert.equal(state.about.visibility, 'visible'); assert.equal(state.about.inert, false);
    assert.equal(state.about.ariaHidden, 'false'); assert.equal(state.overflow, 0);
  };
  if (!tailOnly || !report.scenarios.some(item => item.label === 'live-context-loss')) {
    await setup(390, 844, 'vi', '-live-fallback');
    await seek('portal', .70);
    await page.evaluate(() => v3qa.root.getState().gl.forceContextLoss());
    await page.waitForFunction(() => !!document.querySelector('[data-scene-fallback]') && !document.querySelector('canvas'));
    await page.waitForTimeout(600);
    const live = await readFallback(); checkFallback(live);
    const liveFile = `${out}/screenshots/390-live-fallback.png`;
    await page.screenshot({ path: liveFile });
    report.scenarios.push({ label: 'live-context-loss', file: liveFile, ...live });
    await context.close();
  }

  context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  page = await context.newPage(); page.setDefaultTimeout(60000);
  await page.routeWebSocket('**', ws => ws.send('{"type":"connected"}'));
  const diagnostics = [];
  page.on('pageerror', error => report.errors.push({ id: 'initial-no-webgl', message: error.message }));
  page.on('console', message => {
    if (['error', 'warning'].includes(message.type())) diagnostics.push({ type: message.type(), message: message.text() });
  });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return ['webgl', 'webgl2', 'experimental-webgl'].includes(type) ? null : original.call(this, type, ...args);
    };
  });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-scene-fallback]');
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const initialHero = await readFallback();
  assert.equal(initialHero.canvas, 0); assert.equal(initialHero.fallback, true);
  assert(initialHero.portalHeight <= initialHero.height * 1.5);
  // Initial Hero remains static; the normal keyboard path must reach the real About.
  await page.locator('header > a[href="#about"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => getComputedStyle(document.getElementById('about')).visibility === 'visible'
    && !document.getElementById('about').inert);
  await page.waitForTimeout(400);
  const initial = await readFallback(); checkFallback(initial);
  const initialFile = `${out}/screenshots/390-initial-no-webgl.png`;
  await page.screenshot({ path: initialFile });
  report.scenarios.push({ label: 'initial-no-webgl', file: initialFile, injected: 'WebGL context unavailable; 2D canvas unchanged',
    initialHero, keyboardSkipToAbout: true, expectedDiagnostics: diagnostics, ...initial });
  assert(diagnostics.every(item => /WebGL|CanvasImpl|React will try to recreate|error occurred|THREE\.Clock.*deprecated/i.test(item.message)),
    'No unrelated fallback diagnostics');
  await context.close(); save();
}

try {
  for (const [width, height] of tailOnly ? [] : smoke || lifecycleOnly || labSmoke ? [[1440, 900]] : [[390, 844], [1440, 900], [1920, 1080]]) {
    for (const locale of smoke || lifecycleOnly || labSmoke || backdropOnly ? ['vi'] : ['vi', 'en']) {
      await setup(width, height, locale, labSmoke ? '-lab' : '', labSmoke ? `${base}/3d-lab.html?story=1` : base);
      if (backdropOnly) { await backdropEvidence(); await context.close(); save(); continue; }
      if (lifecycleOnly) { await routeCycles(); await context.close(); save(); continue; }
      const forwards = new Map();
      for (const p of checkpoints) { await seek('portal', p); forwards.set(p, await capture(`portal-forward-${p}`)); }
      if (smoke) { await context.close(); save(); continue; }
      for (const p of [...checkpoints].reverse()) {
        await seek('portal', p);
        const state = await capture(`portal-reverse-${p}`);
        compare(state, forwards.get(p), `portal-reverse-${p}`);
      }
      if (labSmoke) {
        assert.equal(await page.locator('#about').count(), 1);
        await context.close(); save(); continue;
      }
      await scenarios();
      if (width === 1440 && locale === 'vi') await extendedScenarios();
      await context.close(); save();
    }
  }
  // Direct hashes must enter readable destinations without replaying the intake.
  for (const hash of smoke || lifecycleOnly || labSmoke || backdropOnly ? [] : ['about', 'work', 'transmission']) {
    if (tailOnly && report.configurations.some(item => item.frames.some(frame => frame.label === `direct-${hash}`))) continue;
    await setup(1440, 900, 'vi', `-hash-${hash}`, `${base}/#${hash}`);
    const chapter = { about: 'about', work: 'works', transmission: 'contact' }[hash];
    await page.waitForFunction(chapter => v3qa.scroll.getState().storyChapter === chapter, chapter);
    await page.waitForTimeout(500);
    const state = await capture(`direct-${hash}`);
    assert.equal(state.chapter, chapter);
    report.scenarios.push({ id: current.id, label: 'direct-hash', hash, chapter: state.chapter, focus: state.focus });
    await context.close();
  }
  if (!smoke && !lifecycleOnly && !labSmoke && !backdropOnly) await fallbackChecks();
  assert.deepEqual(report.errors, []);
  assert.deepEqual(source(), report.sourceBefore, 'Integrated source stayed fixed during evidence capture');
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.failure = error.stack; process.exitCode = 1;
} finally {
  report.finished = new Date().toISOString(); report.sourceAfter = source(); save();
  await browser.close();
  console.log(JSON.stringify({ status: report.status, configurations: report.configurations.length,
    frames: report.configurations.reduce((sum, item) => sum + item.frames.length, 0),
    comparisons: report.comparisons.length, lifecycle: report.lifecycle.length,
    errors: report.errors.length, warnings: report.warnings.length, failure: report.failure?.split('\n')[0] }));
}
