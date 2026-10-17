import { useLayoutEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useTranslation } from 'react-i18next';
import { gsap } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { openingPose } from '@/3d/utils/opening';
import '@/styles/opening.css';

let openingSeen = false;
export function Preloader({ onComplete, opening }) {
  const root = useRef(null), veil = useRef(null);
  const done = useRef(onComplete), completed = useRef(false), started = useRef(null);
  const local = useRef({ active: false, reveal: 0 });
  const presentation = opening ?? local;
  const reduced = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const { t } = useTranslation();
  useLayoutEffect(() => { done.current = onComplete; }, [onComplete]);

  useGSAP((context, contextSafe) => {
    if (completed.current) return;
    let active = true, timeline, forced = false;
    const complete = () => {
      if (!active || completed.current) return;
      presentation.current.active = false;
      presentation.current.reveal = 1;
      completed.current = true; openingSeen = true;
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
      veil.current.style.opacity = String(1 - Math.min(1, model.p / 0.04));
      root.current.dataset.openingProgress = String(model.p);
    };
    const begin = contextSafe(() => {
      if (!active || timeline || document.hidden) return;
      const ready = document.fonts.status === 'loaded' && (useScrollStore.getState().sceneFallback
        || document.querySelector('[data-galaxy-scene]')?.dataset.sceneReady === 'true');
      if ((!ready && !forced) || !measure()?.height) return;
      const reload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
      const warm = (openingSeen || reload) && performance.now() - started.current < 1800 && !forced;
      const duration = warm ? 2 : 4.5;
      root.current.dataset.openingDuration = String(duration);
      root.current.dataset.openingReady = forced ? 'watchdog' : 'scene-font';
      timeline = gsap.timeline({ id: 'preloader-intro', onComplete: complete })
        .to(model, { p: 1, duration, ease: 'none', onUpdate: draw });
    });
    const visibility = () => { timeline?.paused(document.hidden); begin(); };
    const key = event => { if (event.key === 'Tab' && !completed.current) event.preventDefault(); };
    const waitTimer = window.setTimeout(() => { forced = true; begin(); }, Math.max(0, 5000 - (performance.now() - started.current)));
    draw(); gsap.ticker.add(begin);
    document.addEventListener('visibilitychange', visibility); document.addEventListener('keydown', key, true);
    window.addEventListener('resize', draw); document.fonts?.addEventListener('loadingdone', draw);
    root.current.focus({ preventScroll: true }); begin();
    return () => {
      active = false; presentation.current.active = false;
      window.clearTimeout(waitTimer);
      gsap.ticker.remove(begin);
      document.removeEventListener('visibilitychange', visibility); document.removeEventListener('keydown', key, true);
      window.removeEventListener('resize', draw); document.fonts?.removeEventListener('loadingdone', draw);
    };
  }, { scope: root, dependencies: [reduced, fallback, presentation], revertOnUpdate: true });

  if (reduced || fallback) return null;
  return <div ref={root} role="status" aria-label={t('preloader.counterLabel')} aria-live="polite" tabIndex={-1}
    className="stellar-opening fixed inset-0 z-[9999] overflow-hidden" data-preloader>
    <div ref={veil} className="absolute inset-0 bg-(--bg-void)" data-opening-veil />
  </div>;
}

export default Preloader;
