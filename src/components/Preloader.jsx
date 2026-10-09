import { useId, useLayoutEffect, useMemo, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useTranslation } from 'react-i18next';
import { gsap } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const MOTION = {
  count: 2,
  reveal: 0.32,
  spin: 1.2,
  maxWaitMs: 2400,
};

export function Preloader({ onComplete }) {
  const root = useRef(null);
  const content = useRef(null);
  const spinner = useRef(null);
  const counter = useRef(null);
  const done = useRef(onComplete);
  const completed = useRef(false);
  const percent = useRef(0);
  const deadline = useRef(null);
  const reducedMotion = useReducedMotion();
  const { t, i18n } = useTranslation();
  const gradientId = `stellar-spinner-${useId()}`;
  const format = useMemo(() => new Intl.NumberFormat(i18n.resolvedLanguage ?? 'vi', {
    style: 'percent', maximumFractionDigits: 0,
  }), [i18n.resolvedLanguage]);

  useLayoutEffect(() => {
    done.current = onComplete;
  }, [onComplete]);

  useGSAP(() => {
    if (completed.current) return;
    // Reduced motion needs no artificial loading delay or animation ticker.
    if (reducedMotion) {
      completed.current = true;
      percent.current = 100;
      counter.current.textContent = format.format(1);
      done.current?.();
      return;
    }
    // Keep the original deadline through StrictMode and locale changes.
    deadline.current ??= performance.now() + MOTION.maxWaitMs;
    let active = true;
    const progress = { value: percent.current };
    const countDuration = MOTION.count * (1 - percent.current / 100);
    counter.current.textContent = format.format(percent.current / 100);
    const rotation = gsap.to(spinner.current, {
      rotation: 360, duration: MOTION.spin, ease: 'none', repeat: -1,
    });
    const timeline = gsap.timeline({
      id: 'preloader-intro',
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        if (!active || completed.current) return;
        completed.current = true;
        rotation?.kill();
        done.current?.();
      },
    });

    timeline.addLabel('connect', 0);
    timeline.to(progress, {
      value: 100,
      duration: countDuration,
      onUpdate: () => {
        if (!active || !counter.current) return;
        // Reverting an old context must never rewind the numeric progress.
        percent.current = Math.max(percent.current, Math.round(progress.value));
      },
    }, 'connect');
    timeline.to(counter.current, {
      duration: countDuration,
      ease: 'none',
      scrambleText: { text: format.format(1), chars: '0123456789', tweenLength: false, speed: 0.5 },
    }, 'connect');
    timeline.addLabel('reveal');
    timeline.call(() => rotation?.pause(), null, 'reveal');
    timeline.to(content.current, { autoAlpha: 0, duration: 0.12 }, 'reveal');
    timeline.to(root.current, {
      autoAlpha: 0,
      // One short full-screen curtain is the requested clip-path exception.
      clipPath: 'inset(0% 0% 100% 0%)',
      duration: MOTION.reveal,
      ease: 'power3.inOut',
    }, 'reveal');

    // Finish even if the ticker is throttled or applies lag smoothing.
    const timeout = window.setTimeout(() => {
      if (active) timeline.totalProgress(1);
    }, Math.max(0, deadline.current - performance.now()));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      // useGSAP's context reverts the timeline, rotation and DOM styles.
    };
  }, { scope: root, dependencies: [reducedMotion, format], revertOnUpdate: true });

  return (
    <div
      ref={root}
      role="status"
      aria-label={t('preloader.counterLabel')}
      aria-live="polite"
      className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden bg-(--bg-void) px-6 text-(--text-primary) [clip-path:inset(0%_0%_0%_0%)] will-change-opacity"
      data-preloader
    >
      <div ref={content} className="flex flex-col items-center gap-7 text-center font-mono">
        <div aria-hidden="true" className="relative grid size-36 place-items-center sm:size-40">
          <div ref={spinner} className="absolute inset-0 motion-safe:will-change-transform" data-preloader-spinner>
            <svg viewBox="0 0 160 160" className="size-full" fill="none" aria-hidden="true" focusable="false">
              <defs>
                <linearGradient id={gradientId} x1="12" y1="12" x2="148" y2="148" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFFFF" />
                  <stop offset="0.55" stopColor="#999999" />
                  <stop offset="1" stopColor="#333333" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="68" stroke={`url(#${gradientId})`} strokeWidth="1.5" strokeDasharray="342 85.257" strokeLinecap="round" />
            </svg>
          </div>
          {/* Decorative progress is excluded from live announcements every frame. */}
          <span key={i18n.resolvedLanguage} ref={counter} className="text-[2rem] leading-none tracking-[-0.06em] tabular-nums sm:text-[2.25rem]" data-preloader-percent>
            {format.format(0)}
          </span>
        </div>
        <p className="max-w-80 text-[0.625rem] leading-5 tracking-[0.16em] text-(--text-secondary) sm:text-[0.6875rem]">
          {t('preloader.counterLabel')}
        </p>
      </div>
    </div>
  );
}

export default Preloader;
