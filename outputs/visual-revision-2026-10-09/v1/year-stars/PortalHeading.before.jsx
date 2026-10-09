import { useRef } from 'react';
import '@fontsource-variable/unbounded';
import { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useScrollStore } from '@/stores/useScrollStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { portalProgress, portalState } from '@/3d/utils/portal';
import '@/styles/hero.css';

// Native SVG text contours share the heading's local Unbounded font and weight.
export function PortalHeading({ label, name, year, role, visible = true, glitch = false, children }) {
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
    const noise = stage.querySelector('[data-year-noise]');
    const glyphs = stage.querySelectorAll('[data-year-glyph]');
    const changeDigit = value => {
      glyphs.forEach(glyph => { glyph.textContent = value; });
      digit.dataset.digit = value;
    };
    const resetDigit = () => changeDigit(year.slice(-1));
    const dash = !frozen ? gsap.to(stage.querySelectorAll('[data-year-dash]'), {
      id: 'hero-year-dash', strokeDashoffset: -36, duration: 6, ease: 'none', repeat: -1, paused: true,
    }) : null;
    const flash = glitch && !frozen ? gsap.timeline({ id: 'hero-year-glitch', paused: true, repeat: -1 }) : null;
    if (flash) {
      for (const [start, next] of [[12, '7'], [15.4, year.slice(-1)]]) {
        flash.set(noise, { opacity: 0.55 }, start)
          .to(noise, { x: 20, y: -8, duration: 0.1, repeat: 3, yoyo: true, ease: 'steps(2)' }, start)
          .to(digit, { x: -8, opacity: 0.75, duration: 0.1, repeat: 3, yoyo: true, ease: 'steps(2)' }, start)
          .call(() => changeDigit(next), [], start + 0.2)
          .set(noise, { opacity: 0, x: 0, y: 0 }, start + 0.4)
          .set(digit, { opacity: 1, x: 0 }, start + 0.4);
      }
    }
    const nameNode = stage.querySelector('[data-hero-name]');
    const decoded = stage.querySelector('[data-hero-decode]');
    const decode = !frozen ? gsap.timeline({ id: 'hero-name-decode', paused: true }).to(decoded, {
      duration: 0.6, ease: 'none', scrambleText: { text: name, chars: 'upperAndLowerCase', tweenLength: false, revealDelay: 0.2 },
    }) : null;
    let running;
    const replay = () => { if (running) decode?.restart(); };
    const draw = () => {
      const state = useScrollStore.getState();
      const p = portalProgress(state.storyChapter, state.chapterProgress, frozen);
      portalState(p, phase);
      opacity(visible ? phase.textOpacity : 0);
      // Preserve the old intake until V3 owns the portal transforms.
      bend.progress(frozen ? 0 : p);
      const hidden = !visible || phase.textOpacity === 0;
      stage.setAttribute('aria-hidden', hidden ? 'true' : 'false');
      stage.inert = hidden;
      const idle = visible && !document.hidden && p === 0;
      if (idle === running) return;
      running = idle;
      stage.dataset.heroIdle = String(idle);
      nameNode.tabIndex = idle ? 0 : -1;
      if (idle) {
        dash?.restart();
        flash?.restart();
        decode?.restart();
      } else {
        dash?.pause(0);
        flash?.pause(0);
        decode?.pause(0);
        resetDigit();
        decoded.textContent = name;
        if (document.activeElement === nameNode) nameNode.blur();
      }
    };
    draw();
    const unsubscribe = useScrollStore.subscribe(draw);
    document.addEventListener('visibilitychange', draw);
    nameNode.addEventListener('pointerenter', replay);
    nameNode.addEventListener('focus', replay);
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', draw);
      nameNode.removeEventListener('pointerenter', replay);
      nameNode.removeEventListener('focus', replay);
      resetDigit();
      decoded.textContent = name;
    };
  }, { scope, dependencies: [label, name, year, frozen, visible, glitch], revertOnUpdate: true });

  const prefix = year.slice(0, -1);
  const lastDigit = year.slice(-1);
  return <header ref={scope} data-portal-stage className="portal-heading pointer-events-none fixed inset-0 z-20 flex items-center text-white">
    <div data-hero-content className="relative isolate mx-4 w-[calc(100%-2rem)] md:ml-[14vw] md:mr-0 md:w-[72vw]">
      <div data-hero-layer="year" data-hero-year className="relative z-0 -mb-[0.24em]">
        <span className="sr-only">{year}</span>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 3502 832" className="hero-year-svg" fill="none" stroke="white" strokeWidth="2">
          <text x="0" y="800" vectorEffect="non-scaling-stroke" className="hero-year-base">{prefix}</text>
          <text x="0" y="800" vectorEffect="non-scaling-stroke" data-year-dash>{prefix}</text>
          <g data-year-digit data-digit={lastDigit}>
            <text x="0" y="800" vectorEffect="non-scaling-stroke" className="hero-year-base"><tspan stroke="none">{prefix}</tspan><tspan data-year-glyph>{lastDigit}</tspan></text>
            <text x="0" y="800" vectorEffect="non-scaling-stroke" data-year-dash><tspan stroke="none">{prefix}</tspan><tspan data-year-glyph>{lastDigit}</tspan></text>
          </g>
          <g data-year-noise className="opacity-0">
            <text x="0" y="800" vectorEffect="non-scaling-stroke" className="hero-noise-cyan"><tspan stroke="none">{prefix}</tspan><tspan data-year-glyph>{lastDigit}</tspan></text>
            <text x="0" y="800" vectorEffect="non-scaling-stroke" className="hero-noise-orange"><tspan stroke="none">{prefix}</tspan><tspan data-year-glyph>{lastDigit}</tspan></text>
          </g>
        </svg>
      </div>
      <h1 id="hero-heading" data-hero-layer="heading" aria-label={label} className="relative z-10 whitespace-nowrap font-display leading-none font-extrabold tracking-[-0.035em]">
        {Array.from(label, (char, index) => <span key={index} aria-hidden="true" data-portal-char className={`relative inline-block${index === label.length - 1 ? ' text-transparent' : ''}`}>
          {char}
          {index === label.length - 1 && <span data-story-anchor="portal" className="hero-o-anchor" />}
        </span>)}
      </h1>
      <div data-hero-details className="min-h-0 overflow-y-auto">
      <div data-hero-layer="identity" className="relative z-10 mt-[16px] flex flex-col items-start gap-[4px] font-body text-[clamp(0.875rem,1.25vw,1.5rem)] md:flex-row md:items-center md:gap-6">
        <p data-hero-name tabIndex={0} className="relative inline-grid min-h-[44px] max-w-full items-center break-words rounded-sm px-[4px] leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white">
          <span className="sr-only">{name}</span>
          <span aria-hidden="true" className="invisible col-start-1 row-start-1">{name}</span>
          <span aria-hidden="true" data-hero-decode className="absolute inset-x-[4px] inset-y-0 flex items-center">{name}</span>
        </p>
        {role && <p data-hero-role className="max-w-full leading-relaxed text-white/70">{role}</p>}
      </div>
      {children}
      </div>
    </div>
  </header>;
}
