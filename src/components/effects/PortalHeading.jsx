import { useId, useRef } from 'react';
import '@fontsource-variable/unbounded';
import { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useScrollStore } from '@/stores/useScrollStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { portalProgress, portalState, portalIntake } from '@/3d/utils/portal';
import '@/styles/hero.css';

// Contours baked from the installed Unbounded 800; glyph advances stay unchanged.
const YEAR_CONTOURS = {
  "2": "M31 324 C35.667 264 55.833 212.167 91.5 168.5 C127.167 124.833 174.667 91.333 234 68 C293.333 44.667 360 33 434 33 C504.667 33 566.5 43.667 619.5 65 C672.5 86.333 713.667 115.833 743 153.5 C772.333 191.167 787 235 787 285 C787 324.333 776.167 360.667 754.5 394 C732.833 427.333 699.333 459.833 654 491.5 C608.667 523.167 549.667 555.333 477 588 L286 676 L281 618 L807 618 L807 800 L50 800 L50 640 L373 463 C421.667 436.333 459 414.167 485 396.5 C511 378.833 529.333 362.5 540 347.5 C550.667 332.5 556 316.333 556 299 C556 281 551 265.333 541 252 C531 238.667 516.167 228.333 496.5 221 C476.833 213.667 453 210 425 210 C388.333 210 358.5 215.167 335.5 225.5 C312.5 235.833 295.167 249.667 283.5 267 C271.833 284.333 264.667 303.333 262 324 L31 324 Z",
  "0": "M467 817 C381 817 305.833 800.667 241.5 768 C177.167 735.333 127.333 689.667 92 631 C56.667 572.333 39 503.667 39 425 C39 346.333 56.667 277.667 92 219 C127.333 160.333 177.167 114.667 241.5 82 C305.833 49.333 381 33 467 33 C553.667 33 629.167 49.333 693.5 82 C757.833 114.667 807.667 160.333 843 219 C878.333 277.667 896 346.333 896 425 C896.667 503.667 879.167 572.333 843.5 631 C807.833 689.667 757.833 735.333 693.5 768 C629.167 800.667 553.667 817 467 817 Z M468 629 C530.667 629 579.333 611.167 614 575.5 C648.667 539.833 665.667 489.667 665 425 C665 359.667 647.833 309.333 613.5 274 C579.167 238.667 530.667 221 468 221 C406 221 357.5 238.667 322.5 274 C287.5 309.333 270 359.667 270 425 C270 489.667 287.5 539.833 322.5 575.5 C357.5 611.167 406 629 468 629 Z",
  "6": "M454 33 C520.667 33 579.833 43.167 631.5 63.5 C683.167 83.833 724.833 111.167 756.5 145.5 C788.167 179.833 807.333 218.667 814 262 L601 262 C592.333 244 576.667 229 554 217 C531.333 205 500 199 460 199 C414.667 199 376.833 207.333 346.5 224 C316.167 240.667 293.5 265 278.5 297 C263.5 329 256 368.333 256 415 C256 467.667 264.167 511.333 280.5 546 C296.833 580.667 320.333 606.667 351 624 C381.667 641.333 419 650 463 650 C491.667 650 516 646 536 638 C556 630 571 619.333 581 606 C591 592.667 596 578 596 562 C596 544 591.167 528.5 581.5 515.5 C571.833 502.5 557.333 492.667 538 486 C518.667 479.333 495 476 467 476 C429 476 392.333 483.833 357 499.5 C321.667 515.167 288.333 539.667 257 573 L182 523 C202 481 228 444.167 260 412.5 C292 380.833 330.167 355.833 374.5 337.5 C418.833 319.167 469.333 310 526 310 C589.333 310 643.5 320.333 688.5 341 C733.5 361.667 768.167 390.333 792.5 427 C816.833 463.667 829 506 829 554 C829 604.667 814.667 649.833 786 689.5 C757.333 729.167 715.667 760.333 661 783 C606.333 805.667 539 817 459 817 C365 817 287 800.333 225 767 C163 733.667 116.833 687.5 86.5 628.5 C56.167 569.5 41 502 41 426 C41 350 56.333 282.333 87 223 C117.667 163.667 163.667 117.167 225 83.5 C286.333 49.833 362.667 33 454 33 Z",
  "7": "M117 800 L528 168 L528 232 L15 232 L15 50 L742 50 L742 235 L386 800 L117 800 Z"
};
const YEAR_STARS = Array.from({ length: 12 }, (_, group) => Array.from({ length: 125 }, (_, point) => {
  const seed = group * 125 + point + 1;
  const random = n => { const value = Math.sin(seed * n) * 43758.5453; return value - Math.floor(value); };
  return { x: random(12.9898) * 3502, y: random(78.233) * 832, r: 1.5 + random(45.164) * 2.5 };
}));

export function PortalHeading({ label, name, year, role, visible = true, glitch = false, children }) {
  const scope = useRef(null);
  const starsId = useId();
  const reduced = useReducedMotion();
  const fallback = useScrollStore(state => state.sceneFallback);
  const frozen = reduced || fallback;
  useGSAPSetup(() => {
    const stage = scope.current;
    let active = true;
    const chars = Array.from(stage.querySelectorAll('[data-portal-char]'));
    const phase = {};
    gsap.set(stage, { opacity: 0 });
    const opacity = gsap.quickSetter(stage, 'opacity');
    const layers = [stage.querySelector('[data-hero-year]'), ...chars.slice(0, -1),
      ...stage.querySelectorAll('[data-hero-layer="identity"], [data-hero-layer="intro"], [data-hero-layer="indicator"]')];
    gsap.set(layers, { transform: 'none', opacity: 1 });
    const intake = layers.map(node => ({ node, layout: {}, pose: {},
      transform: value => { node.style.transform = value; }, opacity: gsap.quickSetter(node, 'opacity') }));
    const measure = () => {
      if (!active) return;
      intake.forEach(item => item.transform('none'));
      intake.forEach(item => { const rect = item.node.getBoundingClientRect(); item.layout.x = rect.left + rect.width / 2; item.layout.y = rect.top + rect.height / 2; });
      draw();
    };
    const digit = stage.querySelector('[data-year-digit]');
    const noise = stage.querySelector('[data-year-noise]');
    const glyphs = stage.querySelectorAll('[data-year-glyph]');
    const changeDigit = value => {
      glyphs.forEach(glyph => {
        if (glyph.tagName === 'path') glyph.setAttribute('d', YEAR_CONTOURS[value]);
        else glyph.textContent = value;
      });
      digit.dataset.digit = value;
    };
    const resetDigit = () => changeDigit(year.slice(-1));
    const meteors = !frozen ? gsap.timeline({ id: 'hero-year-meteors', paused: true }) : null;
    const twinkle = !frozen ? gsap.timeline({ id: 'hero-year-twinkle', paused: true }) : null;
    stage.querySelectorAll('[data-year-meteor]').forEach((meteor, index) => {
      const paths = meteor.querySelectorAll('path');
      gsap.set(paths, { strokeDashoffset: -index * 197 });
      meteors?.to(paths, { strokeDashoffset: -index * 197 - 1000, duration: 4 + index * 0.3, repeat: -1, ease: 'none' }, 0);
    });
    stage.querySelectorAll('[data-year-twinkle]').forEach((group, index) => {
      twinkle?.to(group, { opacity: 0.95, duration: 1.4 + index % 4 * 0.25, repeat: -1, yoyo: true, repeatDelay: 1.8 + index % 3 * 0.6, ease: 'sine.inOut' }, index * 0.37);
    });
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
      opacity(visible && p < 0.44 ? 1 : 0);
      intake.forEach((item, index) => {
        portalIntake(frozen ? 0 : p, item.layout, state.storyAnchor, window.innerWidth, window.innerHeight, index, item.pose);
        const value = item.pose;
        item.transform(`translate(${value.x}px, ${value.y}px) rotate(${value.rotation}deg) scale(${value.scaleX}, ${value.scaleY})`);
        item.opacity(value.opacity);
      });
      const hidden = !visible || phase.textOpacity === 0;
      stage.setAttribute('aria-hidden', hidden ? 'true' : 'false');
      stage.inert = hidden;
      const idle = visible && !document.hidden && p === 0;
      if (idle === running) return;
      running = idle;
      stage.dataset.heroIdle = String(idle);
      nameNode.tabIndex = idle ? 0 : -1;
      if (idle) {
        meteors?.restart();
        twinkle?.restart();
        flash?.restart();
        decode?.restart();
      } else {
        meteors?.pause(0);
        twinkle?.pause(0);
        flash?.pause(0);
        decode?.pause(0);
        resetDigit();
        decoded.textContent = name;
        if (document.activeElement === nameNode) nameNode.blur();
      }
    };
    measure();
    const unsubscribe = useScrollStore.subscribe(draw);
    document.addEventListener('visibilitychange', draw);
    window.addEventListener('resize', measure);
    document.fonts?.addEventListener('loadingdone', measure);
    document.fonts?.ready.then(() => { if (active) measure(); });
    nameNode.addEventListener('pointerenter', replay);
    nameNode.addEventListener('focus', replay);
    return () => {
      active = false;
      unsubscribe();
      document.removeEventListener('visibilitychange', draw);
      window.removeEventListener('resize', measure);
      document.fonts?.removeEventListener('loadingdone', measure);
      nameNode.removeEventListener('pointerenter', replay);
      nameNode.removeEventListener('focus', replay);
      resetDigit();
      decoded.textContent = name;
    };
  }, { scope, dependencies: [label, name, year, frozen, visible, glitch], revertOnUpdate: true });

  const prefix = year.slice(0, -1);
  const lastDigit = year.slice(-1);
  return <header ref={scope} data-portal-stage className="portal-heading pointer-events-none fixed inset-0 z-20 flex items-center overflow-hidden text-white">
    <div data-hero-content className="relative isolate mx-4 w-[calc(100%-2rem)] md:ml-[14vw] md:mr-0 md:w-[72vw]">
      <div data-hero-layer="year" data-hero-year className="relative z-0 -mb-[0.24em]">
        <span className="sr-only">{year}</span>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 3502 832" className="hero-year-svg" fill="none" stroke="white" strokeWidth="2">
          <defs>
            <pattern id={starsId} width="3502" height="832" patternUnits="userSpaceOnUse">
              {YEAR_STARS.map((group, index) => <g key={index} data-year-twinkle className="hero-year-stars">
                {group.map((star, point) => <circle key={point} cx={star.x} cy={star.y} r={star.r} />)}
              </g>)}
            </pattern>
            {[0, 850, 1785, 2635].map((offset, index) => <pattern key={index} id={`${starsId}-${index}`} href={`#${starsId}`} patternTransform={`translate(${-offset} 0)`} />)}
          </defs>
          {Array.from(prefix, (char, index) => <g key={index} transform={`translate(${[0, 850, 1785][index]} 0)`}>
            <path d={YEAR_CONTOURS[char]} className="hero-year-base" fill={`url(#${starsId}-${index})`} />
            {(char === '0' ? YEAR_CONTOURS[char].match(/M[^M]+/g) : [YEAR_CONTOURS[char]]).map((path, contour) => <g key={contour} data-year-meteor>
              <path d={path} pathLength="1000" className="hero-year-tail" />
              <path d={path} pathLength="1000" className="hero-year-wake" />
              <path d={path} pathLength="1000" className="hero-year-head" />
            </g>)}
          </g>)}
          <g data-year-digit data-digit={lastDigit}>
            <g transform="translate(2635 0)">
              <path data-year-glyph d={YEAR_CONTOURS[lastDigit]} className="hero-year-base" fill={`url(#${starsId}-3)`} />
              <g data-year-meteor>
                <path data-year-glyph d={YEAR_CONTOURS[lastDigit]} pathLength="1000" className="hero-year-tail" />
                <path data-year-glyph d={YEAR_CONTOURS[lastDigit]} pathLength="1000" className="hero-year-wake" />
                <path data-year-glyph d={YEAR_CONTOURS[lastDigit]} pathLength="1000" className="hero-year-head" />
              </g>
            </g>
          </g>
          <g data-year-noise className="opacity-0">
            <text x="0" y="800" vectorEffect="non-scaling-stroke" className="hero-noise-cyan"><tspan stroke="none">{prefix}</tspan><tspan data-year-glyph>{lastDigit}</tspan></text>
            <text x="0" y="800" vectorEffect="non-scaling-stroke" className="hero-noise-orange"><tspan stroke="none">{prefix}</tspan><tspan data-year-glyph>{lastDigit}</tspan></text>
          </g>
        </svg>
      </div>
      <h1 id="hero-heading" data-hero-layer="heading" aria-label={label} className="relative z-10 whitespace-nowrap font-display leading-none font-extrabold tracking-[-0.035em]">
        {Array.from(label, (char, index) => <span key={index} aria-hidden="true" data-portal-char className={`relative inline-block${index === label.length - 1 && !fallback ? ' text-transparent' : ''}`}>
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
