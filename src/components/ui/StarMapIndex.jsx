import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap, ScrollSmoother, ScrollTrigger } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { navigationSections } from '@/data/navigation';
import { pushMainAnchor } from '@/stores/useRouteStore';
import '@/styles/star-map.css';

// Fixed journey index along the left edge: seven chapters as numbered stations. The current chapter is lit; choosing another flies the camera
// there along the real scroll path, so the chapter waves play on the way.
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const CHAPTER_INDEX = { hero: 0, portal: 0, about: 1, skills: 2, education: 3, experience: 4, departure: 4, works: 5, finale: 5, contact: 6 };

export function StarMapIndex() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const flight = useRef(null);
  const route = useRef(null);
  const chapter = useScrollStore(state => state.storyChapter);
  // The route fill follows scroll without re-rendering the index every frame.
  useEffect(() => {
    const draw = state => { if (route.current) route.current.style.transform = `scaleY(${state.scrollProgress.toFixed(4)})`; };
    draw(useScrollStore.getState());
    return useScrollStore.subscribe(draw);
  }, []);
  useEffect(() => () => flight.current?.kill(), []);
  const active = CHAPTER_INDEX[chapter] ?? 0;
  // Out of the way while the Hero and the portal dive own the frame.
  const shown = chapter !== 'hero' && chapter !== 'portal';

  const fly = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const smoother = ScrollSmoother.get();
    const y = gsap.utils.clamp(0, ScrollTrigger.maxScroll(window), smoother ? smoother.offset(target, 'top top') : target.getBoundingClientRect().top + window.scrollY);
    useScrollStore.getState().setStoryManual(false);
    if (location.hash !== `#${id}`) pushMainAnchor(id);
    flight.current?.kill();
    const land = () => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    const from = smoother ? smoother.scrollTop() : window.scrollY;
    if (reduced || !smoother) {
      if (smoother) smoother.scrollTop(y);
      else window.scrollTo(0, y);
      requestAnimationFrame(land);
      return;
    }
    // Longer journeys take longer, but never long enough to feel like a wait.
    const duration = gsap.utils.clamp(0.9, 2.4, Math.abs(y - from) / window.innerHeight * 0.18);
    flight.current = gsap.to(smoother, { scrollTop: y, duration, ease: 'power2.inOut', onComplete: land });
  };

  return (
    <nav aria-label={t('starMap.label')} data-star-map
      className={`fixed left-[max(0.75rem,env(safe-area-inset-left))] top-1/2 z-[60] hidden -translate-y-1/2 transition-opacity duration-700 lg:block ${shown ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      inert={!shown}>
      {/* The route line, filled to the journey's progress. */}
      <span aria-hidden="true" className="absolute top-3 bottom-3 left-[0.6875rem] w-px bg-white/10">
        <span ref={route} className="absolute inset-0 origin-top scale-y-0 bg-[var(--accent-amber,#F2A65A)] opacity-70" />
      </span>
      <ol className="relative flex flex-col gap-1">
        {navigationSections.map((section, index) => {
          const current = index === active;
          const name = t(`nav.${section.key}`);
          return (
            <li key={section.id}>
              <button type="button" onClick={() => fly(section.id)} aria-current={current ? 'step' : undefined}
                aria-label={t('starMap.jump', { index: NUMERALS[index], name })}
                className="group flex min-h-8 items-center gap-3 rounded-sm py-1 pr-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <span aria-hidden="true" className={`relative z-10 grid size-[1.375rem] place-items-center rounded-full border bg-(--bg-void) transition-colors duration-500 ${current ? 'border-[var(--accent-amber,#F2A65A)]' : 'border-white/15 group-hover:border-white/50'}`}>
                  <span className={`size-1.5 rounded-full transition-all duration-500 ${current ? 'bg-[var(--accent-amber,#F2A65A)] shadow-[0_0_10px_var(--accent-amber,#F2A65A)]' : 'bg-white/30 group-hover:bg-white/70'}`} />
                </span>
                <span aria-hidden="true" className={`w-6 font-mono text-[10px] tracking-[0.2em] transition-colors duration-500 ${current ? 'text-white' : 'text-(--text-secondary) group-hover:text-white'}`}>{NUMERALS[index]}</span>
                {/* Names stay hidden over the reading column; the current one flashes on arrival. */}
                <span key={current ? 'on' : 'off'} aria-hidden="true" data-flash={current || undefined}
                  className="star-map-label flex flex-col rounded-sm bg-(--bg-void)/85 px-2 py-1 leading-tight opacity-0 transition-[opacity,translate] duration-500 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
                  <span className="font-display text-[11px] font-semibold uppercase tracking-[0.14em] text-white">{name}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
