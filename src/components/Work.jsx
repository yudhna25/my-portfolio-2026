import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, ScrollSmoother } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { PORTFOLIO_DATA } from '@/data';
import { playRadioClick } from '@/lib/audioEngine';
import { EDURA_ROUTE, navigateRoute } from '@/stores/useRouteStore';
import { finaleState } from '@/3d/utils/finale';

const projects = PORTFOLIO_DATA.projects.map((project, index) => ({
  ...project, id: ['edura', 'veris', 'vie'][index], key: ['eduraLms', 'verisApp', 'viePerfume'][index],
}));
const focusRing = 'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4';

export default function Work() {
  const root = useRef(null);
  const section = useRef(null);
  const pointer = useRef('');
  const focusFrame = useRef(0);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const active = useScrollStore(state => state.storyChapter === 'works');
  const selection = useScrollStore(state => state.worksSelection);
  const focus = useScrollStore(state => state.worksFocus);
  const hover = useScrollStore(state => state.worksHover);
  const finaleSelection = useScrollStore(state => state.storyChapter === 'finale' ? state.worksFinaleSelection : undefined);
  const interact = useScrollStore(state => state.setWorksInteraction);
  const clear = useScrollStore(state => state.clearWorksInteraction);
  const target = finaleSelection === undefined ? selection ?? focus ?? hover : finaleSelection;
  const project = projects.find(item => item.id === target);
  const path = project ? `works.projects.${project.key}` : null;
  const dismiss = () => { cancelAnimationFrame(focusFrame.current); root.current.focus({ preventScroll: true }); clear(); };
  const focusProject = (event, id) => {
    if (['touch', 'pen'].includes(pointer.current) || !event.target.matches(':focus-visible')) return;
    cancelAnimationFrame(focusFrame.current);
    if (useScrollStore.getState().storyChapter !== 'works') {
      const element = event.target;
      // Native focus/Smoother focusin can seek after React's focus handler.
      focusFrame.current = requestAnimationFrame(() => {
        if (!element.isConnected || document.activeElement !== element) return;
        const smoother = ScrollSmoother.get();
        if (smoother) {
          smoother.scrollTop(smoother.offset(section.current, 'top top'));
          const trigger = smoother.scrollTrigger;
          // Finish the existing scrub too: its next tick must not undo the focus jump.
          if (trigger) {
            trigger.update();
            const scrub = trigger.getTween();
            if (typeof scrub?.progress === 'function') scrub.progress(1).pause();
            trigger.animation.progress(trigger.progress);
          }
        } else section.current.scrollIntoView({ block: 'start' });
      });
    }
    interact('Focus', id);
  };

  useEffect(() => {
    if (!active) { interact('Hover', null); interact('Focus', null); }
    else {
      const focused = document.activeElement;
      if (focused?.matches('[data-work-target]:focus-visible')) interact('Focus', focused.dataset.workTarget);
    }
    return () => { interact('Hover', null); interact('Focus', null); };
  }, [active, interact]);

  useGSAP(() => {
    // Keep DOM order inside main; the existing story producer supplies visible scroll.
    let height = section.current.getBoundingClientRect().height;
    const transition = section.current.closest('[data-story-chapter]').nextElementSibling;
    let finaleHeight = transition.getBoundingClientRect().height;
    const phase = {};
    gsap.set(root.current, { opacity: 1, visibility: 'visible', y: 0 });
    const shift = gsap.quickSetter(root.current, 'y', 'px');
    const opacity = gsap.quickSetter(root.current, 'opacity');
    const visibility = gsap.quickSetter(root.current, 'visibility');
    const draw = () => {
      const state = useScrollStore.getState();
      const ending = state.storyChapter === 'finale';
      finaleState(reduced ? 1 : state.chapterProgress, phase);
      const next = state.storyChapter === 'works' ? state.chapterProgress * height
        : ending ? height + state.chapterProgress * finaleHeight + (phase.label - 1) * 16 : 0;
      shift(next);
      opacity(ending ? phase.label : 1);
      visibility(ending && phase.label === 0 ? 'hidden' : 'visible');
      root.current.inert = ending;
    };
    const measure = () => { height = section.current.getBoundingClientRect().height; finaleHeight = transition.getBoundingClientRect().height; draw(); };
    const observer = new ResizeObserver(measure);
    observer.observe(section.current);
    observer.observe(transition);
    const unsubscribe = useScrollStore.subscribe(draw);
    draw();
    return () => { cancelAnimationFrame(focusFrame.current); unsubscribe(); observer.disconnect(); };
  }, { scope: section, dependencies: [reduced], revertOnUpdate: true });

  useGSAP(() => {
    const preview = root.current.querySelector('[data-work-content]');
    if (active && preview && !reduced) gsap.fromTo(preview, { opacity: 0.65, y: 6 }, {
      opacity: 1, y: 0, duration: 0.25, ease: 'power2.out',
    });
  }, { scope: root, dependencies: [active, target, reduced, i18n.resolvedLanguage], revertOnUpdate: true });
  useGSAP(() => { ScrollTrigger.refresh(true); }, {
    scope: section, dependencies: [i18n.resolvedLanguage, reduced], revertOnUpdate: true,
  });

  return <section ref={section} id="work" tabIndex={-1} aria-labelledby="works-heading" className="relative min-h-[160vh]">
    <div ref={root} data-work-background tabIndex={-1} role="group" aria-labelledby="works-heading"
      onKeyDownCapture={event => { pointer.current = 'keyboard'; if (event.key === 'Escape') { dismiss(); event.stopPropagation(); } }}
      onClick={event => { if (!event.target.closest('button,a,[data-work-content]')) dismiss(); }}
      className="absolute inset-x-0 top-0 z-20 h-screen px-4 pt-20 text-(--text-primary) sm:px-8 lg:px-12">
      <header className="mx-auto max-w-5xl text-center">
        <h2 id="works-heading" className="font-display text-[clamp(1rem,2.6vw,2.5rem)] leading-[1.3] font-bold tracking-[-0.04em]">{t('works.heading')}</h2>
        <div role="group" aria-label={t('works.selectLabel')} className="mt-3 grid grid-cols-3 gap-2 sm:gap-8">
          {projects.map(item => <button key={item.id} id={`work-target-${item.id}`} type="button" data-work-target={item.id}
            aria-pressed={selection === item.id} aria-controls="work-preview" aria-describedby="works-hint"
            onPointerEnter={event => { if (event.pointerType === 'mouse') interact('Hover', item.id); }}
            onPointerLeave={() => interact('Hover', null)}
            onPointerDown={event => { pointer.current = event.pointerType; }}
            onFocus={event => focusProject(event, item.id)}
            onBlur={event => { if (!event.relatedTarget?.closest('[data-work-content]')) interact('Focus', null); }}
            onClick={() => {
              const selected = useScrollStore.getState().worksSelection;
              if (['touch', 'pen'].includes(pointer.current)) clear();
              interact('Selection', selected === item.id ? null : item.id);
              pointer.current = '';
            }}
            className={`min-h-11 min-w-11 cursor-pointer border-b px-1 py-2 text-center transition-colors motion-reduce:transition-none ${focusRing} ${target === item.id ? 'border-white/70 text-white' : 'border-white/15 text-white/65 hover:text-white'}`}>
            <span className="block font-body text-[clamp(.7rem,1.3vw,1.15rem)] font-medium">{t(`works.projects.${item.key}.title`)}</span>
            <span className="mt-1 block font-mono text-[9px] text-white/55 sm:text-[10px]">{t(`works.constellations.${item.id}`)}</span>
          </button>)}
        </div>
      </header>

      <div id="work-preview" data-work-preview data-active={target ?? 'empty'}
        className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] mx-auto h-40 max-w-6xl sm:inset-x-8 sm:h-44 lg:inset-x-12 lg:h-48">
        {project ? <div data-work-content key={project.id}
          onFocusCapture={event => focusProject(event, project.id)}
          onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) interact('Focus', null); }}
          className="grid h-full grid-cols-[minmax(0,.65fr)_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-7">
          <img data-project-image src={project.imageUrl} alt={t(`${path}.previewAlt`)} width="1600" height={project.id === 'edura' ? 1131 : 900} loading="lazy" decoding="async"
            className="aspect-[16/10] w-full object-contain" />
          <div className="min-w-0 bg-linear-to-r from-(--bg-void)/90 via-(--bg-void)/65 to-transparent">
            <h3 className="font-display text-[clamp(.95rem,2.4vw,2.2rem)] leading-tight font-bold tracking-[-0.03em]">{t(`${path}.title`)}</h3>
            <p className="mt-2 font-body text-xs leading-relaxed text-white/65 sm:text-sm">{t(`${path}.category`)}</p>
            {project.id === 'edura' ? <>
              <a id="work-case-edura" href={EDURA_ROUTE} data-work-action onClick={event => { playRadioClick(); navigateRoute(event, EDURA_ROUTE); }}
                className={`mt-2 inline-flex min-h-11 items-center font-mono text-[10px] text-white underline underline-offset-4 sm:text-xs ${focusRing}`}>{t('works.viewCaseStudy')} <span aria-hidden="true" className="ml-2">↗</span></a>
              <a href={project.link} data-work-behance onClick={playRadioClick} target="_blank" rel="noopener noreferrer"
                aria-label={`${t('works.behanceReference')} (${t('common.opensInNewTab')})`}
                className={`inline-flex min-h-11 items-center font-mono text-[10px] text-white/70 underline decoration-white/25 underline-offset-4 sm:text-xs ${focusRing}`}>{t('works.behanceReference')} <span aria-hidden="true" className="ml-2">↗</span></a>
            </> : <p className="mt-4 font-mono text-[10px] leading-relaxed text-white/55 sm:text-xs">{t('works.comingSoon')}</p>}
          </div>
        </div> : <p id="works-hint" className="max-w-sm pt-8 font-body text-sm leading-relaxed text-white/60 sm:text-base">{t('works.interactionHint')}</p>}
      </div>
      {project && <p id="works-hint" className="sr-only">{t('works.interactionHint')}</p>}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{project ? `${t(`${path}.title`)} — ${t(`${path}.category`)}` : t('works.selectLabel')}</p>
    </div>
  </section>;
}
