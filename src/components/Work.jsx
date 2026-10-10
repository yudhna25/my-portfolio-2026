import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger, ScrollSmoother } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useScrollStore } from '@/stores/useScrollStore';
import { PORTFOLIO_DATA } from '@/data';
import { playRadioClick } from '@/lib/audioEngine';
import { EDURA_ROUTE, navigateRoute } from '@/stores/useRouteStore';
import { ConstellationCreditButton } from '@/components/ui/ConstellationCredits';
import { finaleState } from '@/3d/utils/finale';
import { placeWorksPreview } from '@/3d/utils/worksOrbit';

const projects = PORTFOLIO_DATA.projects.map((project, index) => ({
  ...project, id: ['edura', 'veris', 'vie'][index], key: ['eduraLms', 'verisApp', 'viePerfume'][index],
}));
const focusRing = 'focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4';

export default function Work({ layoutRef, nativeNavigation = false }) {
  const root = useRef(null);
  const section = useRef(null);
  const pointer = useRef('');
  const focusFrame = useRef(0);
  const closeTimer = useRef(0);
  const presentation = useRef(null);
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const active = useScrollStore(state => state.storyChapter === 'works');
  const fallback = useScrollStore(state => state.sceneFallback) || !layoutRef;
  const selection = useScrollStore(state => state.worksSelection);
  const focus = useScrollStore(state => state.worksFocus);
  const hover = useScrollStore(state => state.worksHover);
  const finaleSelection = useScrollStore(state => state.storyChapter === 'finale' ? state.worksFinaleSelection : undefined);
  const interact = useScrollStore(state => state.setWorksInteraction);
  const clear = useScrollStore(state => state.clearWorksInteraction);
  const target = finaleSelection === undefined ? selection ?? focus ?? hover : finaleSelection;
  const project = projects.find(item => item.id === target);
  const path = project ? `works.projects.${project.key}` : null;
  const cancelClose = () => clearTimeout(closeTimer.current);
  const leave = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      const inside = root.current?.querySelector('[data-work-target]:hover,[data-work-content]:hover');
      const focused = document.activeElement?.closest('[data-work-target],[data-work-content]');
      if (!inside) interact('Hover', null);
      if (!root.current?.contains(focused)) interact('Focus', null);
    }, 180);
  };
  const dismiss = () => { cancelClose(); cancelAnimationFrame(focusFrame.current); root.current.focus({ preventScroll: true }); clear(); };
  const focusProject = (event, id) => {
    cancelClose();
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
    if (!active) { clearTimeout(closeTimer.current); interact('Hover', null); interact('Focus', null); }
    else {
      if (presentation.current) {
        const saved = presentation.current;
        interact('Selection', saved.selection); interact('Focus', saved.focus); interact('Hover', saved.hover);
        presentation.current = null;
        closeTimer.current = setTimeout(() => {
          if (!root.current?.querySelector('[data-work-target]:hover,[data-work-content]:hover')) interact('Hover', null);
          if (!root.current?.contains(document.activeElement?.closest('[data-work-target],[data-work-content]'))) interact('Focus', null);
        }, 180);
      }
      const focused = document.activeElement;
      if (focused?.matches('[data-work-target]:focus-visible')) interact('Focus', focused.dataset.workTarget);
    }
    return () => {
      const state = useScrollStore.getState();
      if (active && ['finale', 'contact'].includes(state.storyChapter) && !presentation.current) {
        presentation.current = { selection: state.worksSelection, focus: state.worksFocus, hover: state.worksHover };
      }
      clearTimeout(closeTimer.current); interact('Hover', null); interact('Focus', null);
    };
  }, [active, interact]);

  useGSAP(() => {
    // Keep DOM order inside main; the existing story producer supplies visible scroll.
    let height = section.current.getBoundingClientRect().height;
    const transition = section.current.closest('[data-story-chapter]')?.nextElementSibling;
    let finaleHeight = transition?.getBoundingClientRect().height ?? 0;
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
    const measure = () => { height = section.current.getBoundingClientRect().height; finaleHeight = transition?.getBoundingClientRect().height ?? 0; draw(); };
    const observer = new ResizeObserver(measure);
    observer.observe(section.current);
    if (transition) observer.observe(transition);
    const unsubscribe = useScrollStore.subscribe(draw);
    draw();
    return () => { cancelAnimationFrame(focusFrame.current); unsubscribe(); observer.disconnect(); };
  }, { scope: section, dependencies: [reduced], revertOnUpdate: true });

  useGSAP(() => {
    const buttons = [...root.current.querySelectorAll('[data-work-target]')];
    const preview = root.current.querySelector('[data-work-preview]');
    if (fallback) {
      gsap.set([...buttons, preview], { clearProps: 'transform,width,height' });
      buttons.forEach(button => { button.classList.remove('sr-only'); button.hidden = false; });
      return;
    }
    const data = layoutRef.current;
    const setters = buttons.map(button => ({ x: gsap.quickSetter(button, 'x', 'px'), y: gsap.quickSetter(button, 'y', 'px'),
      width: gsap.quickSetter(button, 'width', 'px'), height: gsap.quickSetter(button, 'height', 'px') }));
    const previewX = gsap.quickSetter(preview, 'x', 'px'), previewY = gsap.quickSetter(preview, 'y', 'px');
    const position = { x: 0, y: 0 };
    let measuredWidth = 0, measuredHeight = 0;
    const draw = () => {
      const rect = root.current.getBoundingClientRect();
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i], box = data.figures[i];
        // Native Tab must still enter Works from the preceding chapter.
        button.classList.toggle('sr-only', !data.ready);
        if (!data.ready) continue;
        setters[i].x(box.left - rect.left); setters[i].y(box.top - rect.top);
        setters[i].width(Math.max(44, box.right - box.left)); setters[i].height(Math.max(44, box.bottom - box.top));
      }
      if (target && data.ready && (measuredWidth !== data.width || measuredHeight !== data.height)) {
        const panel = preview.getBoundingClientRect();
        placeWorksPreview(data, target, panel.width, panel.height, position);
        previewX(position.x - rect.left); previewY(position.y - rect.top);
        measuredWidth = data.width; measuredHeight = data.height;
      }
    };
    const observer = new ResizeObserver(() => { measuredWidth = 0; draw(); });
    observer.observe(preview);
    data.onChange = draw; draw();
    return () => {
      if (data.onChange === draw) data.onChange = null;
      observer.disconnect();
    };
  }, { scope: root, dependencies: [layoutRef, fallback, target, i18n.resolvedLanguage], revertOnUpdate: true });
  useGSAP(() => { ScrollTrigger.refresh(true); }, {
    scope: section, dependencies: [i18n.resolvedLanguage, reduced], revertOnUpdate: true,
  });

  const preview = <div id="work-preview" data-work-preview data-active={target ?? 'empty'}
        className={`absolute top-0 left-0 z-30 w-[calc(100%-2rem)] lg:w-72 xl:w-80 ${fallback ? 'top-auto! bottom-6! left-4! lg:left-[calc(50%-9rem)]!' : ''}`}>
        {project ? <div data-work-content key={project.id}
          onPointerEnter={event => { cancelClose(); if (event.pointerType === 'mouse') interact('Hover', project.id); }} onPointerLeave={leave}
          onFocusCapture={event => focusProject(event, project.id)}
          onBlurCapture={leave}
          className="grid h-48 grid-cols-[minmax(0,.6fr)_minmax(0,1fr)] items-center gap-3 rounded-sm border border-(--border-glass-subtle) bg-(--color-glass-surface) p-3 backdrop-blur-md lg:h-auto lg:grid-cols-1 lg:gap-2">
          <img data-project-image src={project.imageUrl} alt={t(`${path}.previewAlt`)} width="1600" height={project.id === 'edura' ? 1131 : 900} loading="lazy" decoding="async"
            className="aspect-[16/10] w-full object-contain" />
          <div className="min-w-0">
            <h3 className="font-display text-sm leading-tight font-bold tracking-[-0.03em] lg:text-base">{t(`${path}.title`)}</h3>
            <p className="mt-2 font-body text-[11px] leading-relaxed text-white/70">{t(`${path}.category`)}</p>
            {project.id === 'edura' ? <div className="flex flex-wrap justify-center gap-x-4">
              <a id="work-case-edura" href={EDURA_ROUTE} data-work-action onClick={event => { playRadioClick(); if (!nativeNavigation) navigateRoute(event, EDURA_ROUTE); }}
                className={`inline-flex min-h-11 min-w-11 items-center font-mono text-[10px] text-white underline underline-offset-4 ${focusRing}`}>{t('works.viewCaseStudy')} <span aria-hidden="true" className="ml-2">↗</span></a>
              <a href={project.link} data-work-behance onClick={playRadioClick} target="_blank" rel="noopener noreferrer"
                aria-label={`${t('works.behanceReference')} (${t('common.opensInNewTab')})`}
                className={`inline-flex min-h-11 min-w-11 items-center font-mono text-[10px] text-white/70 underline decoration-white/25 underline-offset-4 ${focusRing}`}>{t('works.behanceReference')} <span aria-hidden="true" className="ml-2">↗</span></a>
            </div> : <p className="mt-4 font-mono text-[10px] leading-relaxed text-white/55 sm:text-xs">{t('works.comingSoon')}</p>}
          </div>
        </div> : null}
      </div>;

  return <section ref={section} id="work" tabIndex={-1} aria-labelledby="works-heading" className="relative min-h-[160vh]">
    <div ref={root} data-work-background tabIndex={-1} role="group" aria-labelledby="works-heading"
      onKeyDownCapture={event => { pointer.current = 'keyboard'; if (event.key === 'Escape') { dismiss(); event.stopPropagation(); } }}
      onClick={event => { if (!event.target.closest('button,a,[data-work-content]')) dismiss(); }}
      className="absolute inset-x-0 top-0 z-20 h-screen px-4 pt-20 text-(--text-primary) sm:px-8 lg:px-12">
      <header className="mx-auto max-w-5xl text-center">
        <ConstellationCreditButton compact className="absolute top-20 left-4 sm:left-8 lg:left-12" />
        <h2 id="works-heading" className="font-display text-[clamp(1rem,2.6vw,2.5rem)] leading-[1.3] font-bold tracking-[-0.04em]">{t('works.heading')}</h2>
        <p id="works-hint" className="pointer-events-none mx-auto mt-3 max-w-sm font-body text-xs leading-relaxed text-white/60">{t('works.interactionHint')}</p>
        <div role="group" aria-label={t('works.selectLabel')} className={fallback ? 'mt-6 grid grid-cols-3 gap-3 sm:gap-8' : ''}>
          {projects.map(item => <div key={item.id}><button id={`work-target-${item.id}`} type="button" data-work-target={item.id}
            aria-label={`${t(`works.projects.${item.key}.title`)} · ${t(`works.constellations.${item.id}`)}`}
            aria-pressed={selection === item.id} aria-expanded={target === item.id} aria-controls="work-preview" aria-describedby="works-hint"
            onPointerEnter={event => { cancelClose(); if (event.pointerType === 'mouse') interact('Hover', item.id); }}
            onPointerLeave={leave}
            onPointerDown={event => { pointer.current = event.pointerType; }}
            onFocus={event => focusProject(event, item.id)}
            onBlur={leave}
            onClick={() => {
              cancelClose();
              const selected = useScrollStore.getState().worksSelection;
              if (['touch', 'pen'].includes(pointer.current)) clear();
              interact('Selection', selected === item.id ? null : item.id);
              pointer.current = '';
            }}
            className={`min-h-11 min-w-11 cursor-pointer rounded-sm text-center ${focusRing} ${fallback ? 'border-b border-white/25 px-1 py-2' : 'absolute top-0 left-0'} ${target === item.id ? 'text-white' : 'text-white/65 hover:text-white'}`}>
            <span className={fallback ? 'block' : 'absolute inset-x-0 -bottom-6 block'}>
              <span className="block font-body text-[clamp(.65rem,1vw,.85rem)] font-medium">{t(`works.projects.${item.key}.title`)}</span>
              <span className="block font-mono text-[9px] text-white/55">{t(`works.constellations.${item.id}`)}</span>
            </span>
          </button>{project?.id === item.id && preview}</div>)}
        </div>
      </header>

      {!project && <div id="work-preview" data-work-preview data-active="empty" hidden />}
      <p aria-live="polite" aria-atomic="true" className="sr-only">{project ? `${t(`${path}.title`)} — ${t(`${path}.category`)}` : t('works.selectLabel')}</p>
    </div>
  </section>;
}
