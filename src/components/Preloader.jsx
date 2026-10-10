import { useId, useLayoutEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useTranslation } from 'react-i18next';
import { gsap } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import '@/styles/opening.css';

let openingSeen = false;
const smooth = (a, b, p) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export function Preloader({ onComplete }) {
  const root = useRef(null);
  const ring = useRef(null);
  const veil = useRef(null);
  const light = useRef(null);
  const done = useRef(onComplete);
  const completed = useRef(false);
  const started = useRef(null);
  const reduced = useReducedMotion();
  const { t } = useTranslation();
  const gradient = `opening-${useId()}`;
  useLayoutEffect(() => { done.current = onComplete; }, [onComplete]);

  useGSAP((context, contextSafe) => {
    if (completed.current) return;
    let active = true;
    let timeline;
    let finishTimer;
    let forced = false;
    const complete = () => {
      if (!active || completed.current) return;
      completed.current = true;
      openingSeen = true;
      done.current?.();
    };
    if (reduced) { complete(); return; }
    started.current ??= performance.now();
    gsap.set(ring.current, { xPercent: -50, yPercent: -50, x: 0, y: 0, scale: 1 });
    const x = gsap.quickSetter(ring.current, 'x', 'px');
    const y = gsap.quickSetter(ring.current, 'y', 'px');
    const scaleX = gsap.quickSetter(ring.current, 'scaleX');
    const scaleY = gsap.quickSetter(ring.current, 'scaleY');
    const ringAlpha = gsap.quickSetter(ring.current, 'opacity');
    const veilAlpha = gsap.quickSetter(veil.current, 'opacity');
    const lightAlpha = gsap.quickSetter(light.current, 'opacity');
    const pose = { x: 0, y: 0, scale: 1 };
    const model = { p: 0 };
    const measure = () => {
      const rect = document.querySelector('[data-story-anchor="portal"]')?.getBoundingClientRect();
      if (!rect?.height) return false;
      pose.x = rect.left + rect.width / 2 - window.innerWidth / 2;
      pose.y = rect.top + rect.height / 2 - window.innerHeight / 2;
      pose.scale = Math.max(0.01, rect.height * 0.96 / (ring.current.offsetWidth * 0.84));
      return true;
    };
    const draw = () => {
      measure();
      const p = model.p, move = smooth(0, 0.74, p);
      x(pose.x * move); y(pose.y * move);
      const size = Math.exp(Math.log(pose.scale) * move);
      scaleX(size); scaleY(size);
      // Reveal only once the live photon ring and the opening have the same center.
      veilAlpha(1 - smooth(0.74, 0.98, p));
      ringAlpha(1 - smooth(0.78, 1, p));
      lightAlpha(0.72 + 0.28 * smooth(0, 0.3, p));
    };
    const begin = contextSafe(() => {
      if (!active || timeline || document.hidden) return;
      const fallback = useScrollStore.getState().sceneFallback;
      const ready = document.fonts.status === 'loaded'
        && (fallback || document.querySelector('[data-galaxy-scene]')?.dataset.sceneReady === 'true');
      if ((!ready && !forced) || !measure()) return;
      const reload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
      const warm = (openingSeen || reload) && performance.now() - started.current < 1800 && !forced;
      const duration = warm ? 0.9 : 1.8;
      root.current.dataset.openingDuration = String(duration);
      root.current.dataset.openingReady = forced ? 'watchdog' : 'scene-font';
      timeline = gsap.timeline({ id: 'preloader-intro', onComplete: complete })
        .to(model, { p: 1, duration, ease: 'none', onUpdate: draw });
      finishTimer = window.setTimeout(() => {
        if (active && !document.hidden) timeline.totalProgress(1);
      }, duration * 1000 + 250);
    });
    const resize = draw;
    const visibility = () => { timeline?.paused(document.hidden); begin(); };
    const key = event => { if (event.key === 'Tab' && !completed.current) event.preventDefault(); };
    const waitTimer = window.setTimeout(() => { forced = true; begin(); }, Math.max(0, 5000 - (performance.now() - started.current)));
    gsap.ticker.add(begin);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('keydown', key, true);
    window.addEventListener('resize', resize);
    document.fonts?.addEventListener('loadingdone', resize);
    root.current.focus({ preventScroll: true });
    begin();
    return () => {
      active = false;
      window.clearTimeout(waitTimer); window.clearTimeout(finishTimer);
      gsap.ticker.remove(begin);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', resize);
      document.fonts?.removeEventListener('loadingdone', resize);
    };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  if (reduced) return null;
  return <div ref={root} role="status" aria-label={t('preloader.counterLabel')} aria-live="polite"
    tabIndex={-1} className="stellar-opening fixed inset-0 z-[9999] overflow-hidden" data-preloader>
    <div ref={veil} className="absolute inset-0 bg-(--bg-void)" data-opening-veil />
    <div ref={ring} className="opening-ring" data-preloader-ring aria-hidden="true">
      <svg viewBox="-100 -100 200 200" fill="none" className="size-full overflow-visible" focusable="false">
        <defs><linearGradient id={gradient} x1="-100" y1="-100" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" /><stop offset="0.5" stopColor="#999" /><stop offset="1" stopColor="white" />
        </linearGradient></defs>
        <g ref={light}>
          <circle r="84" stroke={`url(#${gradient})`} strokeWidth="1.2" />
          <circle r="86" stroke="white" strokeWidth="0.35" opacity="0.25" />
          <ellipse rx="112" ry="18" transform="rotate(55)" stroke={`url(#${gradient})`} strokeWidth="0.8" opacity="0.7" />
          <ellipse rx="104" ry="14" transform="rotate(55)" stroke="white" strokeWidth="0.3" opacity="0.3" />
        </g>
      </svg>
    </div>
    <span className="sr-only">{t('preloader.counterLabel')}</span>
  </div>;
}

export default Preloader;
