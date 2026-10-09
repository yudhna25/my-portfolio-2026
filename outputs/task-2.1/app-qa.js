// Diagnostic entry imports the real main/App; no QA code enters production.
import { gsap, ScrollSmoother } from '@/hooks/useGSAPSetup';
import { useLoadingStore } from '@/stores/useLoadingStore';

const options = new URLSearchParams(location.search);
const mode = options.get('motion') ?? 'native';
const nativeMatchMedia = window.matchMedia.bind(window);
const nativeReduced = nativeMatchMedia('(prefers-reduced-motion: reduce)').matches;
let reduce = mode === 'reduce';
const media = new Set();
if (mode !== 'native') {
  window.matchMedia = query => {
    const result = nativeMatchMedia(query);
    if (query.includes('prefers-reduced-motion')) {
      Object.defineProperty(result, 'matches', { get: () => query.includes('no-preference') ? !reduce : reduce });
      media.add(result);
    }
    return result;
  };
}
document.querySelector('#qa-reduce').onclick = () => {
  reduce = true;
  for (const query of media) query.dispatchEvent(new Event('change'));
};

const report = { mode, nativeReduced, mounts: 0, completions: 0, samples: [], checks: [], errors: [] };
const output = document.querySelector('#qa-results');
const status = document.querySelector('#qa-status');
const publish = () => { output.textContent = JSON.stringify(report, null, 2); };
window.addEventListener('error', event => { report.errors.push(event.message); publish(); });
window.addEventListener('unhandledrejection', event => { report.errors.push(String(event.reason)); publish(); });
let element;
let started;
let frame;
let transforms = new Set();
let maxTimelines = 0;
const readPercent = () => Number(element?.querySelector('[data-preloader-percent]')?.textContent.replace(/[^0-9]/g, ''));
const sample = () => {
  if (!element?.isConnected) return;
  if (options.has('throttle')) {
    // StrictMode can replace the first timeline after passive effects flush.
    // Hold whichever instance is current, so only the wall-clock deadline wins.
    gsap.getById('preloader-intro')?.pause();
    for (const tween of gsap.getTweensOf(element.querySelector('[data-preloader-spinner]'))) tween.pause();
  }
  const percent = readPercent();
  if (report.samples.at(-1) !== percent) report.samples.push(percent);
  transforms.add(getComputedStyle(element.querySelector('[data-preloader-spinner]')).transform);
  maxTimelines = Math.max(maxTimelines, gsap.globalTimeline.getChildren().filter(child => child.vars.id === 'preloader-intro').length);
  frame = requestAnimationFrame(sample);
};
const observer = new MutationObserver(() => {
  const next = document.querySelector('[data-preloader]');
  if (!next || next === element) return;
  element = next;
  started = performance.now();
  report.mounts++;
  report.initial = {
    label: next.getAttribute('aria-label'), role: next.getAttribute('role'),
    background: getComputedStyle(next).backgroundColor,
    clip: getComputedStyle(next).clipPath,
    font: getComputedStyle(next.querySelector('p')).fontFamily,
    circles: next.querySelectorAll('circle').length,
    stops: [...next.querySelectorAll('stop')].map(stop => getComputedStyle(stop).stopColor),
    duration: gsap.getById('preloader-intro')?.duration(),
    locked: document.body.classList.contains('loading-lock'),
  };
  status.textContent = 'Intro running';
  sample(); publish();
  if (options.has('capture')) {
    document.querySelector('#qa-panel').hidden = true;
    setTimeout(() => {
      gsap.getById('preloader-intro')?.pause().time(1, false);
      for (const tween of gsap.getTweensOf(next.querySelector('[data-preloader-spinner]'))) tween.pause();
    }, 100);
  }
  if (mode === 'change') setTimeout(() => document.querySelector('#qa-reduce').click(), 1200);
  if (options.has('throttle')) setTimeout(() => {
    gsap.getById('preloader-intro')?.pause();
    for (const tween of gsap.getTweensOf(next.querySelector('[data-preloader-spinner]'))) tween.pause();
    gsap.ticker.sleep();
  }, 100);
});
observer.observe(document.querySelector('#root'), { childList: true, subtree: true });
const unsubscribe = useLoadingStore.subscribe((state, previous) => {
  if (state.isLoading || !previous.isLoading) return;
  report.completions++;
  report.elapsedMs = performance.now() - started;
  report.finalPercent = readPercent();
  report.endpointWasPaused = gsap.getById('preloader-intro')?.paused();
  report.finalOpacity = getComputedStyle(element).opacity;
  report.finalClip = getComputedStyle(element).clipPath;
  report.finalTransform = getComputedStyle(element.querySelector('[data-preloader-spinner]')).transform;
  report.rotationSamples = transforms.size;
  report.peakTimelines = maxTimelines;
  cancelAnimationFrame(frame);
  setTimeout(() => {
    const reduced = mode === 'native' ? nativeReduced : reduce;
    const check = (name, passed) => report.checks.push({ name, passed });
    check('One DOM mount and one completion in StrictMode', report.mounts === 1 && report.completions === 1);
    check('At most one intro timeline', maxTimelines === 1);
    check('Completion within 2.5 seconds', report.elapsedMs <= 2500 && (!options.has('throttle') || (report.endpointWasPaused && report.samples.at(-1) < 100)));
    check('Counter starts at zero and reaches 100', report.samples[0] === 0 && report.finalPercent === 100);
    check('Counter monotonic', report.samples.every((value, index) => index === 0 || value >= report.samples[index - 1]));
    check('Status and i18n label', report.initial.role === 'status' && report.initial.label === 'ĐANG KẾT NỐI VỚI VŨ TRỤ...');
    check('Background #050505, mono single SVG ring', report.initial.background === 'rgb(5, 5, 5)' && report.initial.circles === 1 && report.initial.stops.every(color => { const channels = color.match(/\d+/g); return channels[0] === channels[1] && channels[1] === channels[2]; }));
    check('JetBrains Mono', report.initial.font.includes('JetBrains Mono'));
    check('Fade finished before callback', report.finalOpacity === '0');
    check('Preloader and timeline cleaned up', !document.querySelector('[data-preloader]') && !gsap.getById('preloader-intro'));
    check('App unlocked and store completed', !document.body.classList.contains('loading-lock') && !useLoadingStore.getState().isLoading);
    check('Expected spinner behavior', reduced ? report.finalTransform === 'none' : (options.has('throttle') || report.rotationSamples > 2));
    check('Expected curtain behavior', reduced ? report.finalClip === report.initial.clip : ['inset(0% 0% 100%)', 'inset(0% 0% 100% 0%)'].includes(report.finalClip));
    check('No console error', report.errors.length === 0);
    report.smootherResumed = !ScrollSmoother.get() || !ScrollSmoother.get().paused();
    check('Smoother resumed', report.smootherResumed);
    status.textContent = report.checks.every(result => result.passed) ? 'PASS — 15 checks' : 'FAIL — inspect checks';
    observer.disconnect(); publish();
  }, 300);
  if (options.has('throttle')) gsap.ticker.wake();
});
window.addEventListener('pagehide', () => { cancelAnimationFrame(frame); observer.disconnect(); unsubscribe(); window.matchMedia = nativeMatchMedia; }, { once: true });
await import('/src/main.jsx');
