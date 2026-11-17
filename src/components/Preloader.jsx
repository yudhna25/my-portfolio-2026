import { useLayoutEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { useTranslation } from 'react-i18next';
import { gsap } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { OPENING_SECONDS, openingPose } from '@/3d/utils/opening';
import '@/styles/opening.css';

export function Preloader({ onComplete, opening, covered = false }) {
  const root = useRef(null), veil = useRef(null);
  const done = useRef(onComplete), completed = useRef(false), started = useRef(null);
  const local = useRef({ active: false, reveal: 0 });
  const presentation = opening ?? local;
  const reduced = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const { t } = useTranslation();
  // Jue (2026-11-17): the full First Light still plays every load, but after ~2s a quiet
  // "skip" lets a returning visitor fast-forward it. Its orbit ring doubles as progress.
  const skipRef = useRef(null), orbit = useRef(null), skipAction = useRef(null);
  const [skippable, setSkippable] = useState(false);
  useLayoutEffect(() => { done.current = onComplete; }, [onComplete]);

  useGSAP((context, contextSafe) => {
    if (completed.current) return;
    let active = true, timeline, forced = false;
    const complete = () => {
      if (!active || completed.current) return;
      presentation.current.active = false;
      presentation.current.reveal = 1;
      completed.current = true;
      done.current?.();
    };
    if (reduced || fallback) { complete(); return; }
    started.current ??= performance.now();
    const model = { p: 0 };
    const measure = () => document.querySelector('[data-story-anchor="portal"]')?.getBoundingClientRect();
    const draw = () => {
      const anchor = measure();
      if (!active || !veil.current || !root.current || !anchor?.height) return;
      const width = window.innerWidth, height = window.innerHeight;
      const pose = openingPose(model.p, anchor, width, height, presentation.current);
      pose.active = true;
      // The language gate already covers the first frame and hands its star to the O.
      veil.current.style.opacity = covered ? '0' : String(1 - Math.min(1, model.p / 0.04));
      root.current.dataset.openingProgress = String(model.p);
      orbit.current?.style.setProperty('stroke-dashoffset', String(1 - model.p));
    };
    const begin = contextSafe(() => {
      if (!active || timeline || document.hidden) return;
      const ready = document.fonts.status === 'loaded' && (useScrollStore.getState().sceneFallback
        || document.querySelector('[data-galaxy-scene]')?.dataset.sceneReady === 'true');
      if ((!ready && !forced) || !measure()?.height) return;
      // Every load, a reload included, plays the full First Light at the same pace.
      const duration = OPENING_SECONDS;
      root.current.dataset.openingDuration = String(duration);
      root.current.dataset.openingReady = forced ? 'watchdog' : 'scene-font';
      timeline = gsap.timeline({ id: 'preloader-intro', onComplete: complete })
        .to(model, { p: 1, duration, ease: 'none', onUpdate: draw });
    });
    const visibility = () => { timeline?.paused(document.hidden); begin(); };
    // Fast-forward rather than cut, so the hole still lands in the O.
    skipAction.current = contextSafe(() => {
      if (completed.current) return;
      forced = true; begin();
      if (timeline) gsap.to(timeline, { timeScale: 7, duration: 0.25, ease: 'power2.in' });
    });
    const skipTimer = window.setTimeout(() => setSkippable(true), 2000);
    const key = event => {
      if (completed.current) return;
      if (event.key === 'Escape') { skipAction.current?.(); return; }
      if (event.key !== 'Tab') return;
      event.preventDefault();
      skipRef.current?.focus();
    };
    const waitTimer = window.setTimeout(() => { forced = true; begin(); }, Math.max(0, 5000 - (performance.now() - started.current)));
    draw(); gsap.ticker.add(begin);
    document.addEventListener('visibilitychange', visibility); document.addEventListener('keydown', key, true);
    window.addEventListener('resize', draw); document.fonts?.addEventListener('loadingdone', draw);
    root.current.focus({ preventScroll: true }); begin();
    return () => {
      active = false; presentation.current.active = false;
      window.clearTimeout(waitTimer); window.clearTimeout(skipTimer);
      gsap.ticker.remove(begin);
      document.removeEventListener('visibilitychange', visibility); document.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', draw); document.fonts?.removeEventListener('loadingdone', draw);
    };
  }, { scope: root, dependencies: [reduced, fallback, presentation], revertOnUpdate: true });

  if (reduced || fallback) return null;
  return <div ref={root} role="status" aria-label={t('preloader.counterLabel')} aria-live="polite" tabIndex={-1}
    className="stellar-opening fixed inset-0 z-[9999] overflow-hidden" data-preloader>
    <div ref={veil} className={`absolute inset-0 bg-(--bg-void) ${covered ? 'opacity-0' : ''}`} data-opening-veil />
    <button ref={skipRef} type="button" data-opening-skip onClick={() => skipAction.current?.()} tabIndex={skippable ? 0 : -1} aria-hidden={!skippable || undefined}
      className={`group absolute right-[max(1.5rem,env(safe-area-inset-right))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] inline-flex min-h-11 items-center gap-3 px-2 font-body text-sm text-(--text-secondary) transition-opacity duration-1000 hover:text-(--text-primary) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white ${skippable ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 20 20" className="size-5 -rotate-90">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <circle ref={orbit} cx="10" cy="10" r="8" fill="none" stroke="var(--accent-amber,#FFB25B)" strokeWidth="1.25" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
      </svg>
      {t('preloader.skip')}
    </button>
  </div>;
}

export default Preloader;
