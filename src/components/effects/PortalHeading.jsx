import { useRef } from 'react';
import { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useScrollStore } from '@/stores/useScrollStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { portalProgress, portalState } from '@/3d/utils/portal';

// One fixed semantic heading and O anchor for lab and production.
export function PortalHeading({ label, name, year, visible = true, glitch = false, children }) {
  const scope = useRef(null);
  const frozen = useReducedMotion();
  useGSAPSetup(() => {
    const stage = scope.current;
    const chars = Array.from(stage.querySelectorAll('[data-portal-char]'));
    const pull = chars.slice(-3, -1);
    const phase = {};
    gsap.set(stage, { opacity: 0 });
    const opacity = gsap.quickSetter(stage, 'opacity');
    const bend = gsap.timeline({ paused: true })
      .to(pull[0], { x: 22, y: -4, rotation: -5, scaleX: 0.85, duration: 1, ease: 'none' }, 0)
      .to(pull[1], { x: 12, y: 3, rotation: 4, scaleX: 0.9, duration: 1, ease: 'none' }, 0);
    const digit = stage.querySelector('[data-year-digit]');
    const resetX = gsap.quickSetter(digit, 'x', 'px');
    const resetOpacity = gsap.quickSetter(digit, 'opacity');
    const restore = () => { digit.textContent = year.slice(-1); resetX(0); resetOpacity(1); };
    const flash = glitch && !frozen ? gsap.timeline({ id: 'hero-year-glitch', paused: true, delay: 1.5, repeat: -1, repeatDelay: 1.4 })
      .call(() => { digit.textContent = '7'; })
      .fromTo(digit, { x: -2, opacity: 0.55 }, { x: 0, opacity: 1, duration: 0.1, ease: 'steps(3)' })
      .call(restore) : null;
    let running = false;
    const draw = () => {
      const state = useScrollStore.getState();
      const p = portalProgress(state.storyChapter, state.chapterProgress, frozen);
      portalState(p, phase);
      opacity(visible ? phase.textOpacity : 0);
      // Slight contraction of the nearest strokes; layout and semantic text stay intact.
      bend.progress(frozen ? 0 : p);
      stage.setAttribute('aria-hidden', !visible || phase.textOpacity === 0 ? 'true' : 'false');
      const idle = visible && !document.hidden && p === 0;
      if (flash && idle !== running) {
        running = idle;
        if (idle) flash.restart(true);
        else { flash.pause(0); restore(); }
      }
    };
    draw();
    const unsubscribe = useScrollStore.subscribe(draw);
    document.addEventListener('visibilitychange', draw);
    return () => { unsubscribe(); document.removeEventListener('visibilitychange', draw); restore(); };
  }, { scope, dependencies: [label, year, frozen, visible, glitch], revertOnUpdate: true });

  return <header ref={scope} data-portal-stage className="pointer-events-none fixed inset-x-4 top-[24vh] z-10 md:inset-x-[4vw]">
    <p data-hero-year aria-label={year} className="absolute right-0 top-[0.85em] -z-10 whitespace-nowrap font-display text-[23vw] font-extrabold leading-none tracking-[-0.035em] text-white/25 md:top-[0.27em] md:text-[19.4vw]">
      <span aria-hidden="true">{year.slice(0, -1)}<span data-year-digit className="inline-block w-[0.9em] text-center">{year.slice(-1)}</span></span>
    </p>
    <h1 id="hero-heading" aria-label={label} className="whitespace-nowrap font-display text-[calc((100vw-2rem)/7.05)] leading-none font-extrabold tracking-[-0.035em] md:text-[calc(92vw/7.05)]">
      {Array.from(label, (char, index) => <span key={index} aria-hidden="true" data-portal-char data-story-anchor={index === label.length - 1 ? 'portal' : undefined} className="inline-block">{char}</span>)}
    </h1>
    <p className="mt-3 font-body text-sm md:text-xl">{name}</p>
    {children}
  </header>;
}
