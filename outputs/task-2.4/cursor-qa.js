import '@fontsource-variable/unbounded';
import '@/index.css';

const params = new URLSearchParams(location.search);
const appMode = params.has('app');
const nativeMatchMedia = window.matchMedia.bind(window);
const nativeReduced = nativeMatchMedia('(prefers-reduced-motion: reduce)').matches;
let reduced = params.get('motion') === 'reduce' || nativeReduced;
let coarse = params.has('coarse');
const media = new Map();
window.matchMedia = (query) => {
  if (!query.includes('prefers-reduced-motion') && !query.includes('min-width: 1024px')) return nativeMatchMedia(query);
  if (!media.has(query)) {
    const native = nativeMatchMedia(query);
    const proxy = new EventTarget();
    Object.defineProperties(proxy, {
      media: { value: query },
      matches: { get: () => query.includes('prefers-reduced-motion') ? (query.includes('no-preference') ? !reduced : reduced) : native.matches && !coarse },
    });
    native.addEventListener('change', () => proxy.dispatchEvent(new Event('change')));
    media.set(query, proxy);
  }
  return media.get(query);
};
const notifyMedia = () => media.forEach((query) => query.dispatchEvent(new Event('change')));

const listeners = new Map();
const peaks = {};
const originalAdd = EventTarget.prototype.addEventListener;
const originalRemove = EventTarget.prototype.removeEventListener;
function listenerKey(target, type, handler) {
  if (!['move', 'over', 'out', 'hide', 'keyboard', 'visibility'].includes(handler?.name)) return null;
  if (target === document && ['pointermove', 'pointerover', 'pointerout', 'keydown', 'visibilitychange'].includes(type)) return 'document:' + type;
  if (target === document.documentElement && type === 'pointerleave') return 'html:pointerleave';
  if (target === window && type === 'blur') return 'window:blur';
  return null;
}
EventTarget.prototype.addEventListener = function (type, handler, options) {
  const key = listenerKey(this, type, handler);
  if (key) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(handler);
    peaks[key] = Math.max(peaks[key] || 0, listeners.get(key).size);
  }
  return originalAdd.call(this, type, handler, options);
};
EventTarget.prototype.removeEventListener = function (type, handler, options) {
  const key = listenerKey(this, type, handler);
  if (key) listeners.get(key)?.delete(handler);
  return originalRemove.call(this, type, handler, options);
};
const { createElement: h, StrictMode } = await import('react');
const { createRoot } = await import('react-dom/client');
const { default: i18n } = await import('@/i18n/config');
const { gsap, ScrollSmoother, ScrollTrigger } = await import('@/hooks/useGSAPSetup');
const { Cursor } = await import('@/components/Cursor');
let quickToCalls = 0;
const originalQuickTo = gsap.quickTo;
gsap.quickTo = (...args) => { quickToCalls++; return originalQuickTo(...args); };
const root = createRoot(document.getElementById('root'));
const App = appMode ? (await import('@/App.jsx')).default : null;
if (appMode) document.getElementById('fixture').hidden = true;
let mounted = true;
const render = () => root.render(mounted ? h(StrictMode, null, h(appMode ? App : Cursor)) : null);
render();

const report = { appMode, nativeReduced, motionSimulation: true, checks: [], performance: [], nativeEvents: 0 };
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const near = (a, b, tolerance = 0.6) => Math.abs(a - b) <= tolerance;
const output = document.getElementById('qa-results');
const status = document.getElementById('qa-status');
let running = false;
function publish() {
  const passed = report.checks.filter((check) => check.pass).length;
  report.cursorCount = document.querySelectorAll('[data-custom-cursor]').length;
  report.listeners = Object.fromEntries([...listeners].map(([key, handlers]) => [key, handlers.size]));
  report.peaks = peaks;
  report.quickToCalls = quickToCalls;
  report.reduced = reduced;
  report.coarse = coarse;
  report.viewport = { width: innerWidth, height: innerHeight };
  status.textContent = `${running ? 'RUNNING' : 'READY'} / ${passed}/${report.checks.length} PASS / cursor ${report.cursorCount} / reduced ${reduced} / coarse ${coarse}`;
  output.textContent = JSON.stringify(report, null, 2);
}
const check = (name, pass, details) => { report.checks.push({ name, pass: Boolean(pass), details }); publish(); };
function sample() {
  const stage = document.querySelector('[data-custom-cursor]');
  if (!stage) return null;
  const ring = stage.querySelector('.gsap-cursor-ring');
  const dot = stage.querySelector('.gsap-cursor-dot');
  const fill = stage.querySelector('[data-cursor-fill]');
  const label = stage.querySelector('[data-cursor-label]');
  const box = (node) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; };
  return { mode: stage.dataset.cursorState, opacity: getComputedStyle(stage).visibility === 'visible' ? 1 : 0, blend: getComputedStyle(ring).mixBlendMode, pointerEvents: getComputedStyle(stage).pointerEvents, ariaHidden: stage.getAttribute('aria-hidden'), ring: box(ring), shape: box(fill), dot: box(dot), label: label.textContent.trim(), labelOpacity: +getComputedStyle(label).opacity, font: getComputedStyle(label).fontFamily, fontSize: getComputedStyle(label).fontSize, dotOpacity: +getComputedStyle(dot).opacity, fill: getComputedStyle(fill).fill };
}
let previousTarget = null;
function point(target, x, y, pointerType = 'mouse') {
  if (previousTarget !== target) {
    previousTarget?.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: target, pointerType }));
    target.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, relatedTarget: previousTarget, pointerType }));
    previousTarget = target;
  }
  target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y, pointerType }));
}
function center(element) { const r = element.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }
function translation(element) { const values = getComputedStyle(element).translate.split(' ').map(parseFloat); return { x: values[0] || 0, y: values[1] || 0 }; }
originalAdd.call(document, 'pointermove', (event) => {
  if (event.isTrusted) {
    report.nativeEvents++;
    report.lastNative = { x: event.clientX, y: event.clientY, pointerType: event.pointerType, target: event.target.closest?.('.work-card, [data-cursor="view"], [data-magnetic]')?.id || event.target.tagName };
    if (!running) publish();
  }
}, { passive: true });
document.querySelectorAll('#fixture a').forEach((link) => link.addEventListener('click', (event) => event.preventDefault()));

async function performanceRun(speed) {
  const target = appMode ? document.querySelector('#root .work-card') : document.getElementById('project');
  const r = target.getBoundingClientRect();
  point(target, r.x + 40, r.y + 40);
  await wait(360);
  const before = quickToCalls;
  const frames = [];
  let events = 0;
  let previous;
  const started = performance.now();
  await new Promise((resolve) => {
    function frame(now) {
      if (previous) frames.push(now - previous);
      previous = now;
      const elapsed = now - started;
      const steps = speed === 'fast' ? 8 : 1;
      for (let step = 0; step < steps; step++) {
        const phase = elapsed / (speed === 'fast' ? 45 : 450) + step * 0.25;
        point(target, r.x + r.width / 2 + Math.sin(phase) * r.width * .4, r.y + r.height / 2 + Math.cos(phase) * r.height * .4);
        events++;
      }
      if (elapsed < 2000) requestAnimationFrame(frame); else resolve();
    }
    requestAnimationFrame(frame);
  });
  const sorted = [...frames].sort((a, b) => a - b);
  const result = { speed, frames: frames.length, events, fps: frames.length * 1000 / frames.reduce((sum, dt) => sum + dt, 0), p95FrameMs: sorted[Math.floor(sorted.length * .95)], quickToCreatedDuringMovement: quickToCalls - before };
  report.performance.push(result);
  check(speed + ' pointer: reuses quickTo and sustains 60fps', result.fps >= 60 && result.quickToCreatedDuringMovement === 0, result);
}

async function runChecks() {
  running = true; report.checks = []; report.performance = []; publish();
  try {
    mounted = true; reduced = false; coarse = false; notifyMedia(); render(); await wait(100);
    check('StrictMode: one cursor and one listener per event', document.querySelectorAll('[data-custom-cursor]').length === 1 && [...listeners.values()].every((handlers) => handlers.size === 1), Object.fromEntries([...listeners].map(([key, values]) => [key, values.size])));
    const blank = document.getElementById('blank');
    point(blank, 120, 300); await wait(360);
    const neutral = sample();
    check('Mono default: 28px ring, 4px dot, difference blend', near(neutral.shape.width, 28) && near(neutral.dot.width, 4) && neutral.blend === 'difference', neutral);
    check('A11y: decorative, no focus targets, native cursor preserved', neutral.ariaHidden === 'true' && neutral.pointerEvents === 'none' && !document.querySelector('[data-custom-cursor] [tabindex]') && getComputedStyle(document.body).cursor !== 'none' && getComputedStyle(blank).cursor !== 'none');
    point(blank, 650, 350); await wait(45);
    const follow = sample();
    check('Fast dot leads slower ring', Math.abs(follow.dot.cx - 650) < Math.abs(follow.ring.cx - 650), follow);
    await wait(360); check('Followers settle at pointer', near(sample().dot.cx, 650) && near(sample().ring.cx, 650), sample());
    const project = document.getElementById('project');
    point(project.querySelector('strong'), ...center(project)); await wait(360);
    const view = sample();
    check('Nested VIEW target: 64px fill, XEM, 12px Unbounded, no center dot', view.mode === 'view' && near(view.shape.width, 64) && view.label === 'XEM' && view.labelOpacity === 1 && view.font.includes('Unbounded') && view.fontSize === '12px' && view.dotOpacity === 0, view);
    await i18n.changeLanguage('en'); await wait(40); check('English label live sync', sample().label === 'VIEW', sample().label);
    await i18n.changeLanguage('vi'); await wait(40); check('Vietnamese label live sync', sample().label === 'XEM', sample().label);
    const link = document.getElementById('plain-link'); point(link, ...center(link)); await wait(360);
    check('Ordinary link contracts to 18px', sample().mode === 'link' && near(sample().shape.width, 18) && sample().labelOpacity === 0, sample());
    const legacy = document.getElementById('legacy'); point(legacy, ...center(legacy)); await wait(360);
    check('Existing work-card contract stays VIEW', sample().mode === 'view');
    const magnet = document.getElementById('magnet');
    gsap.set(magnet, { x: 17, y: 9, scale: .9 });
    const transform = magnet.style.transform;
    const r = magnet.getBoundingClientRect();
    point(magnet, r.right, r.bottom); await wait(360);
    const offset = translation(magnet);
    check('Magnetic: bounded radial 8px, section transform unchanged', Math.hypot(offset.x, offset.y) > 7.8 && Math.hypot(offset.x, offset.y) <= 8.01 && magnet.style.transform === transform, { offset, transform: magnet.style.transform });
    point(blank, 100, 360); await wait(360);
    check('Magnetic resets on leave', near(translation(magnet).x, 0, .01) && near(translation(magnet).y, 0, .01), translation(magnet));
    gsap.set(magnet, { clearProps: 'transform' });
    const dynamic = document.createElement('button'); dynamic.dataset.cursor = 'view'; dynamic.dataset.magnetic = ''; dynamic.textContent = 'Dynamic card'; document.getElementById('dynamic').append(dynamic);
    point(dynamic, ...center(dynamic)); await wait(360); check('Delegated hover handles newly mounted card', sample().mode === 'view');
    dynamic.remove(); point(blank, 80, 340); await wait(360); check('Removed magnetic card styles restored', dynamic.style.translate === '', dynamic.getAttribute('style'));
    const disabled = document.getElementById('disabled'); point(disabled, ...center(disabled)); await wait(360);
    check('Disabled target has no VIEW or magnet', sample().mode === 'default' && disabled.style.translate === '');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    check('Keyboard hides decorative cursor', sample().opacity === 0);
    point(blank, 210, 320); check('First movement starts at pointer with no fly-in', near(sample().dot.cx, 210) && near(sample().ring.cx, 210), sample());
    window.dispatchEvent(new Event('blur')); check('Window blur hides and resets', sample().opacity === 0);
    point(blank, 200, 300); const beforeTouch = sample(); point(blank, 800, 500, 'touch'); await wait(360);
    check('Touch events do not move cursor on hybrid device', near(sample().dot.cx, beforeTouch.dot.cx) && near(sample().dot.cy, beforeTouch.dot.cy));
    reduced = true; notifyMedia(); await wait(50); point(blank, 730, 340);
    check('Live reduced motion: direct ring and dot, no lag', near(sample().dot.cx, 730) && near(sample().ring.cx, 730), sample());
    point(project, ...center(project)); check('Reduced VIEW has immediate state', sample().mode === 'view' && near(sample().shape.width, 64) && sample().labelOpacity === 1);
    const rm = magnet.getBoundingClientRect(); point(magnet, rm.right, rm.bottom);
    check('Reduced magnet updates directly', Math.hypot(translation(magnet).x, translation(magnet).y) > 7.8, translation(magnet));
    point(blank, 150, 310); check('Reduced magnet resets directly', near(translation(magnet).x, 0, .01) && near(translation(magnet).y, 0, .01));
    coarse = true; notifyMedia(); await wait(50);
    check('Coarse pointer: zero cursor DOM and zero listeners', !document.querySelector('[data-custom-cursor]') && [...listeners.values()].every((handlers) => handlers.size === 0));
    check('Coarse pointer cleans magnetic styles', ['','none'].includes(magnet.style.translate) && ['', 'none'].includes(project.style.translate), { magnet: magnet.style.translate, project: project.style.translate });
    coarse = false; reduced = false; notifyMedia(); await wait(50);
    check('Fine pointer re-mount stays single', document.querySelectorAll('[data-custom-cursor]').length === 1 && [...listeners.values()].every((handlers) => handlers.size === 1));
    for (let iteration = 0; iteration < 3; iteration++) {
      point(magnet, ...center(magnet)); await wait(30); mounted = false; render(); await wait(40);
      check('Unmount cleanup ' + (iteration + 1), !document.querySelector('[data-custom-cursor]') && ['','none'].includes(magnet.style.translate) && [...listeners.values()].every((handlers) => handlers.size === 0));
      mounted = true; render(); await wait(40);
      check('Remount listener count ' + (iteration + 1), document.querySelectorAll('[data-custom-cursor]').length === 1 && [...listeners.values()].every((handlers) => handlers.size === 1));
    }
    await performanceRun('slow'); await performanceRun('fast');
    point(project, ...center(project)); await wait(360);
    check('No listener double-registration after all transitions', Object.values(peaks).every((peak) => peak === 1), peaks);
  } catch (error) { check('Unexpected exception', false, error.stack); console.error(error); }
  finally { running = false; publish(); }
}
document.getElementById('run').onclick = runChecks;
document.getElementById('slow').onclick = async () => { running = true; await performanceRun('slow'); running = false; publish(); };
document.getElementById('fast').onclick = async () => { running = true; await performanceRun('fast'); running = false; publish(); };
document.getElementById('reduce').onclick = async () => { reduced = !reduced; notifyMedia(); await wait(50); publish(); };
document.getElementById('coarse').onclick = async () => { coarse = !coarse; notifyMedia(); await wait(50); publish(); };
document.getElementById('mount').onclick = async () => { mounted = !mounted; render(); await wait(50); publish(); };
document.getElementById('vi').onclick = async () => { await i18n.changeLanguage('vi'); publish(); };
document.getElementById('en').onclick = async () => { await i18n.changeLanguage('en'); publish(); };
document.getElementById('show-work').onclick = async () => {
  if (!appMode) return;
  const card = document.querySelector('#root .work-card'); card.dataset.cursor = 'view';
  ScrollSmoother.get()?.scrollTo('#work', false, 'top top+=70'); ScrollTrigger.update();
  await wait(900); point(card.querySelector('img'), ...center(card)); await wait(360);
  report.work = sample(); report.workCardBounds = card.getBoundingClientRect().toJSON(); report.workImageTransform = card.querySelector('img').style.transform; publish();
};
document.getElementById('show-email').onclick = async () => {
  if (!appMode) return;
  ScrollSmoother.get()?.scrollTo('#contact', false, 'top top+=70'); ScrollTrigger.update();
  await wait(900);
  const email = document.querySelector('.magnetic-btn');
  const transform = email.style.transform;
  const r = email.getBoundingClientRect(); point(email, r.right - 1, r.bottom - 1); await wait(360);
  const offset = translation(email);
  report.email = { offset, distance: Math.hypot(offset.x, offset.y), transformPreserved: email.style.transform === transform, cursor: sample() };
  point(document.getElementById('qa-panel'), 80, innerHeight - 20); await wait(360);
  report.email.reset = translation(email); publish();
};
window.addEventListener('resize', () => setTimeout(publish, 100));
await wait(appMode ? 3000 : 100); publish();
if (params.has('autorun')) runChecks();




