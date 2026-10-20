import { useRef } from 'react';
import '@fontsource-variable/unbounded';
import { gsap, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useScrollStore } from '@/stores/useScrollStore';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { portalProgress, portalSmooth, portalState } from '@/3d/utils/portal';
import { createPortalTrails } from '@/components/effects/portalTrails';
import { createYearStream } from '@/components/effects/yearStream';
import '@/styles/hero.css';

// Contours baked from the installed Unbounded 800; glyph advances stay unchanged.
const YEAR_CONTOURS = {
  "2": "M31 324 C35.667 264 55.833 212.167 91.5 168.5 C127.167 124.833 174.667 91.333 234 68 C293.333 44.667 360 33 434 33 C504.667 33 566.5 43.667 619.5 65 C672.5 86.333 713.667 115.833 743 153.5 C772.333 191.167 787 235 787 285 C787 324.333 776.167 360.667 754.5 394 C732.833 427.333 699.333 459.833 654 491.5 C608.667 523.167 549.667 555.333 477 588 L286 676 L281 618 L807 618 L807 800 L50 800 L50 640 L373 463 C421.667 436.333 459 414.167 485 396.5 C511 378.833 529.333 362.5 540 347.5 C550.667 332.5 556 316.333 556 299 C556 281 551 265.333 541 252 C531 238.667 516.167 228.333 496.5 221 C476.833 213.667 453 210 425 210 C388.333 210 358.5 215.167 335.5 225.5 C312.5 235.833 295.167 249.667 283.5 267 C271.833 284.333 264.667 303.333 262 324 L31 324 Z",
  "0": "M467 817 C381 817 305.833 800.667 241.5 768 C177.167 735.333 127.333 689.667 92 631 C56.667 572.333 39 503.667 39 425 C39 346.333 56.667 277.667 92 219 C127.333 160.333 177.167 114.667 241.5 82 C305.833 49.333 381 33 467 33 C553.667 33 629.167 49.333 693.5 82 C757.833 114.667 807.667 160.333 843 219 C878.333 277.667 896 346.333 896 425 C896.667 503.667 879.167 572.333 843.5 631 C807.833 689.667 757.833 735.333 693.5 768 C629.167 800.667 553.667 817 467 817 Z M468 629 C530.667 629 579.333 611.167 614 575.5 C648.667 539.833 665.667 489.667 665 425 C665 359.667 647.833 309.333 613.5 274 C579.167 238.667 530.667 221 468 221 C406 221 357.5 238.667 322.5 274 C287.5 309.333 270 359.667 270 425 C270 489.667 287.5 539.833 322.5 575.5 C357.5 611.167 406 629 468 629 Z",
  "6": "M454 33 C520.667 33 579.833 43.167 631.5 63.5 C683.167 83.833 724.833 111.167 756.5 145.5 C788.167 179.833 807.333 218.667 814 262 L601 262 C592.333 244 576.667 229 554 217 C531.333 205 500 199 460 199 C414.667 199 376.833 207.333 346.5 224 C316.167 240.667 293.5 265 278.5 297 C263.5 329 256 368.333 256 415 C256 467.667 264.167 511.333 280.5 546 C296.833 580.667 320.333 606.667 351 624 C381.667 641.333 419 650 463 650 C491.667 650 516 646 536 638 C556 630 571 619.333 581 606 C591 592.667 596 578 596 562 C596 544 591.167 528.5 581.5 515.5 C571.833 502.5 557.333 492.667 538 486 C518.667 479.333 495 476 467 476 C429 476 392.333 483.833 357 499.5 C321.667 515.167 288.333 539.667 257 573 L182 523 C202 481 228 444.167 260 412.5 C292 380.833 330.167 355.833 374.5 337.5 C418.833 319.167 469.333 310 526 310 C589.333 310 643.5 320.333 688.5 341 C733.5 361.667 768.167 390.333 792.5 427 C816.833 463.667 829 506 829 554 C829 604.667 814.667 649.833 786 689.5 C757.333 729.167 715.667 760.333 661 783 C606.333 805.667 539 817 459 817 C365 817 287 800.333 225 767 C163 733.667 116.833 687.5 86.5 628.5 C56.167 569.5 41 502 41 426 C41 350 56.333 282.333 87 223 C117.667 163.667 163.667 117.167 225 83.5 C286.333 49.833 362.667 33 454 33 Z"
};
const YEAR_ADVANCES = [0, 850, 1785, 2635];
// One-stroke centrelines of the same glyphs, the spine of the tidal stream. Each starts where
// the previous digit hands over and the 6 ends at its inner join, beside the black hole's O.
const YEAR_SPINES = {
  "2": "M146,330 C150,200 290,121 430,121 C575,121 672,190 672,292 C672,400 560,460 420,540 C300,610 200,660 165,709 L807,709",
  "0": "M167,560 C137,430 177,127 467,127 C687,127 780,280 780,425 C780,600 667,723 467,723 C297,723 207,640 167,560",
  "6": "M702,214 C664,150 578,116 454,116 C260,116 148,240 148,426 C148,620 270,734 459,734 C620,734 712,660 712,563 C712,460 620,393 480,393 C360,393 260,450 200,530",
  "7": "M282,722 L652,232 C685,172 655,141 590,141 L105,141"
};
// Every so often the last digit slips to the next year and back.
const YEAR_ALT = { "6": "7" };

export function PortalHeading({ label, name, year, role, visible = true, opening, children }) {
  const scope = useRef(null);
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
    const yearLayer = stage.querySelector('[data-hero-year]');
    const streamCanvas = yearLayer.querySelector('[data-year-stream]');
    let stream = createYearStream(streamCanvas, yearLayer.querySelector('svg'), { frozen });
    const dropStream = () => { stream?.dispose(); stream = null; delete yearLayer.dataset.yearGl; };
    streamCanvas.addEventListener('streamlost', dropStream);
    if (stream) yearLayer.dataset.yearGl = 'true';
    // The live stream drains into the hole as YearDust rises from its light; without it the
    // trails carry the SVG digits in instead.
    const streamOpacity = gsap.quickSetter(streamCanvas, 'opacity');
    const sources = [
      ...(stream ? [] : stage.querySelectorAll('[data-portal-year-glyph]')), ...chars.slice(0, -1),
      ...stage.querySelectorAll('[data-hero-decode], [data-hero-role], [data-hero-layer="intro"], [data-hero-layer="indicator"]'),
    ];
    const trails = !frozen ? createPortalTrails(sources.map(node => ({ node,
      words: node.matches('[data-hero-decode], [data-hero-role], [data-hero-layer="intro"], [data-hero-layer="indicator"]'),
    }))) : null;
    const measure = () => {
      if (!active) return;
      trails?.measure();
      if (stream && !stream.resize()) stream.render();
      draw();
    };
    // A gravitational wave rolls through the last digit and the stream re-forms as the next
    // year (6 → 7), then back: 2026 holds for 6 s, 2027 for 7 s. Without WebGL the spine
    // simply swaps under the same timing.
    const alt = yearLayer.querySelector('[data-year-alt]');
    const own = alt?.parentNode.querySelector('.hero-year-stream');
    const wave = { mix: 0, quake: 0 };
    let slipped = false;
    const slip = () => {
      const next = alt.getAttribute('d');
      alt.setAttribute('d', own.getAttribute('d'));
      own.setAttribute('d', next);
      slipped = !slipped;
      wave.mix = 0;
      stream?.shape(0, wave.quake);
    };
    const shapeStream = () => stream?.shape(wave.mix, wave.quake);
    const [toNext, toOwn] = [5, 12];
    const flash = alt && !frozen ? gsap.timeline({ id: 'hero-year-glitch', paused: true, repeat: -1, delay: 0.5 }) : null;
    if (flash) {
      for (const start of [toNext, toOwn]) {
        flash.fromTo(wave, { quake: 0 }, { quake: 1, duration: 0.16, ease: 'power2.in', onUpdate: shapeStream }, start)
          .fromTo(wave, { mix: 0 }, { mix: 1, duration: 0.42, ease: 'power3.inOut', onUpdate: shapeStream }, start + 0.08)
          .call(slip, [], start + 0.5)
          .to(wave, { quake: 0, duration: 0.6, ease: 'expo.out', onUpdate: shapeStream }, start + 0.42);
      }
      flash.set({}, {}, toOwn + 1.1);
    }
    // Scrolling away keeps whichever year is showing: a morph past halfway completes, an
    // earlier one falls back, and the wave calms at once so the stream drains cleanly.
    const settle = () => {
      flash?.pause();
      const complete = wave.mix >= 0.5;
      Object.assign(wave, { mix: 0, quake: 0 });
      if (complete) slip(); else shapeStream();
    };
    // Back at rest the cycle resumes from the year on screen.
    const resume = () => flash && (slipped ? flash.play(toNext + 1.1) : flash.restart(true));
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
      opacity(visible && p < 0.44 ? opening?.current.active ? opening.current.reveal : 1 : 0);
      stream?.drain(portalSmooth(0, 0.07, p));
      streamOpacity(1 - portalSmooth(0.025, 0.075, p));
      if (p > 0 && running) { decode?.pause(0); decoded.textContent = name; }
      trails?.draw(p, state.storyAnchor, visible);
      const hidden = !visible || phase.textOpacity === 0;
      stage.setAttribute('aria-hidden', hidden ? 'true' : 'false');
      stage.inert = hidden;
      const loadingOpening = useLoadingStore.getState().isLoading && document.querySelector('[data-preloader]');
      const idle = visible && !loadingOpening && !document.hidden && p === 0;
      if (idle === running) return;
      running = idle;
      stage.dataset.heroIdle = String(idle);
      nameNode.tabIndex = idle ? 0 : -1;
      if (idle) {
        stream?.play();
        decode?.restart();
        resume();
      } else {
        settle();
        stream?.pause();
        stream?.render();
        decode?.pause(0);
        decoded.textContent = name;
        if (document.activeElement === nameNode) nameNode.blur();
      }
    };
    measure();
    const unsubscribe = useScrollStore.subscribe(draw);
    const unsubscribeLoading = useLoadingStore.subscribe(draw);
    const drawOpening = () => { if (opening?.current.active) draw(); };
    if (opening) gsap.ticker.add(drawOpening);
    document.addEventListener('visibilitychange', draw);
    window.addEventListener('resize', measure);
    document.fonts?.addEventListener('loadingdone', measure);
    document.fonts?.ready.then(() => { if (active) measure(); });
    nameNode.addEventListener('pointerenter', replay);
    nameNode.addEventListener('focus', replay);
    return () => {
      active = false;
      trails?.dispose();
      unsubscribe();
      unsubscribeLoading();
      if (opening) gsap.ticker.remove(drawOpening);
      document.removeEventListener('visibilitychange', draw);
      window.removeEventListener('resize', measure);
      document.fonts?.removeEventListener('loadingdone', measure);
      nameNode.removeEventListener('pointerenter', replay);
      nameNode.removeEventListener('focus', replay);
      flash?.kill();
      if (slipped) slip();
      streamCanvas.removeEventListener('streamlost', dropStream);
      dropStream();
      decoded.textContent = name;
    };
  }, { scope, dependencies: [label, name, year, frozen, visible, opening], revertOnUpdate: true });

  return <header ref={scope} data-portal-stage data-static-motion={frozen} className="portal-heading pointer-events-none fixed inset-0 z-20 flex items-center overflow-hidden text-white">
    <div data-hero-content className="relative isolate mx-4 w-[calc(100%-2rem)] md:ml-[14vw] md:mr-0 md:w-[72vw]">
      <div data-hero-lockup className="relative shrink-0">
      <div data-hero-layer="year" data-hero-year className="relative z-0">
        <span className="sr-only">{year}</span>
        <svg aria-hidden="true" focusable="false" viewBox="0 0 3502 832" className="hero-year-svg">
          {Array.from(year, (char, index) => <g key={index} data-portal-year-glyph={index} transform={`translate(${YEAR_ADVANCES[index]} 0)`}>
            <path d={YEAR_CONTOURS[char]} className="hero-year-base" />
            <path d={YEAR_SPINES[char]} className="hero-year-stream" />
            {index === year.length - 1 && YEAR_ALT[char] && <path d={YEAR_SPINES[YEAR_ALT[char]]} data-year-alt className="hero-year-base" />}
          </g>)}
        </svg>
        <canvas data-year-stream aria-hidden="true" className="hero-year-stream-canvas" />
      </div>
      <h1 id="hero-heading" data-hero-layer="heading" aria-label={label} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap font-display leading-none font-extrabold tracking-[-0.035em]">
        {Array.from(label, (char, index) => <span key={index} aria-hidden="true" data-portal-char className={`relative inline-block${index === label.length - 1 && !fallback ? ' text-transparent' : ''}`}>
          {char}
          {index === label.length - 1 && <span data-story-anchor="portal" className="hero-o-anchor" />}
        </span>)}
      </h1>
      </div>
      <div data-hero-details className="min-h-0 overflow-y-auto">
      <div data-hero-layer="identity" className="relative z-10 mt-[16px] flex flex-col items-start gap-[4px] font-body text-[clamp(0.875rem,1.25vw,1.5rem)] md:flex-row md:items-center md:gap-6">
        <p data-hero-name tabIndex={0} className="relative inline-grid min-h-[44px] max-w-full items-center whitespace-nowrap rounded-sm px-[4px] leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white">
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
