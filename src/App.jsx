import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap, ScrollTrigger, ScrollSmoother, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { useScrollProgress } from '@/3d/hooks/useScrollProgress';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { useScrollStore } from '@/stores/useScrollStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { portalProgress } from '@/3d/utils/portal';
import { EDURA_ROUTE, useRouteStore, returnToWorks } from '@/stores/useRouteStore';
import Edura from '@/components/pages/Edura';

import Preloader from '@/components/Preloader';
import Cursor from '@/components/Cursor';
import { Nav } from '@/components/layout/Nav';
import { MenuOverlay } from '@/components/layout/MenuOverlay';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Work from '@/components/Work';
import Skills from '@/components/sections/Skills';
import Education from '@/components/Education';
import Experience from '@/components/sections/Experience';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/Footer';

const SkillsSymbols = lazy(() => import('@/3d/components/SkillsSymbols').then((module) => ({ default: module.SkillsSymbols })));
const StoryMeteor = lazy(() => import('@/3d/components/StoryMeteor').then((module) => ({ default: module.StoryMeteor })));
const WorksConstellations = lazy(() => import('@/3d/components/WorksConstellations').then((module) => ({ default: module.WorksConstellations })));
const GalaxyScene = lazy(() => import('@/3d/GalaxyScene').then((module) => ({ default: module.GalaxyScene })));

function Portfolio({ restore }) {
  const root = useRef(null);
  const reading = useRef(null);
  const skillsStage = useRef(null);
  const meteorLayout = useRef(null);
  const captureMeteorLayout = useCallback(layout => { meteorLayout.current = layout; }, []);
  const [educationStages] = useState(() => ({ saigonUniversity: { current: null }, greenAcademy: { current: null }, arenaMultimedia: { current: null } }));
  const { i18n } = useTranslation();
  const reduced = useReducedMotion();
  const loading = useLoadingStore((state) => state.isLoading);
  const setLoading = useLoadingStore((state) => state.setLoading);

  useSmoothScroll({ scope: root, paused: loading });
  const progress = useScrollProgress({ scope: root, story: true, locale: i18n.resolvedLanguage, ready: !loading, initialPosition: restore, historyManaged: true });

  useGSAPSetup(() => {
    if (loading || !restore) return;
    let active = true;
    let frame;
    let tries = 0;
    const cancel = () => { active = false; cancelAnimationFrame(frame); };
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    inputs.forEach(type => window.addEventListener(type, cancel, { passive: true }));
    const settle = () => {
      if (!active) return;
      if ((!progress.current || !document.querySelector('canvas')) && tries++ < 120) {
        frame = requestAnimationFrame(settle);
        return;
      }
      ScrollTrigger.refresh();
      progress.current?.seek(restore.chapter, restore.p, false);
      const trigger = ScrollSmoother.get()?.scrollTrigger;
      if (trigger) {
        trigger.update();
        const scrub = trigger.getTween();
        if (typeof scrub?.progress === 'function') scrub.progress(1).pause();
        trigger.animation.progress(trigger.progress);
      }
      frame = requestAnimationFrame(() => {
        if (!active) return;
        const target = document.getElementById(restore.chapter === 'works' ? 'work-target-edura'
          : restore.chapter === 'contact' ? 'transmission' : restore.chapter);
        target?.setAttribute('tabindex', target.matches('button,a') ? '0' : '-1');
        target?.focus({ preventScroll: true });
      });
    };
    document.fonts.ready.then(() => { if (active) frame = requestAnimationFrame(settle); });
    return () => { cancel(); inputs.forEach(type => window.removeEventListener(type, cancel)); };
  }, { scope: root, dependencies: [loading, restore], revertOnUpdate: true });

  useGSAPSetup(() => {
    const stage = reading.current;
    gsap.set(stage, { autoAlpha: 0 });
    const opacity = gsap.quickSetter(stage, 'opacity');
    const visibility = gsap.quickSetter(stage, 'visibility');
    let previous;
    const draw = () => {
      const state = useScrollStore.getState();
      const settled = portalProgress(state.storyChapter, state.chapterProgress, reduced) === 1;
      if (settled === previous) return;
      previous = settled;
      // Publish the readable DOM immediately with inert, before native focus runs.
      opacity(settled ? 1 : 0);
      visibility(settled ? 'visible' : 'hidden');
      stage.inert = !settled;
      stage.setAttribute('aria-hidden', settled ? 'false' : 'true');
    };
    draw();
    return useScrollStore.subscribe(draw);
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  useEffect(() => {
    document.body.classList.toggle('loading-lock', loading);
    return () => document.body.classList.remove('loading-lock');
  }, [loading]);

  // refresh triggers once intro done + fonts ready (layout shifts)
  useGSAPSetup(() => {
    if (loading) return;
    let active = true;
    const refresh = () => {
      if (active) ScrollTrigger.refresh();
    };
    document.fonts?.ready.then(refresh).catch(() => {});
    const timer = window.setTimeout(refresh, 300);
    window.addEventListener('load', refresh);
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener('load', refresh);
    };
  }, { scope: root, dependencies: [loading], revertOnUpdate: true });

  return (
    <div ref={root} className="bg-transparent text-(--text-primary) min-h-screen font-sans">
      {loading && <Preloader onComplete={() => setLoading(false)} />}
      <Cursor />

      <Suspense fallback={null}>
        <GalaxyScene story freezeAmbient={false}>{quality => <>
          <SkillsSymbols anchor={skillsStage} educationAnchors={educationStages} />
          <StoryMeteor layout={meteorLayout} frozen={reduced} />
          <WorksConstellations frozen={reduced} quality={quality} />
        </>}</GalaxyScene>
      </Suspense>
      <Hero active={!loading} />

      <div id="smooth-wrapper" className="z-10">
        <main id="smooth-content" tabIndex={-1}>
          <section id="hero" aria-labelledby="hero-heading">
            <div data-story-chapter="hero" />
            <div data-story-chapter="portal" aria-hidden="true" className="min-h-[175vh] motion-reduce:min-h-screen" />
          </section>
          <div ref={reading} data-story-content className="invisible">
            <div data-story-chapter="about"><About /></div>
            <div data-story-chapter="skills"><Skills stageRef={skillsStage} /></div>
            <div data-story-chapter="education"><Education stageRefs={educationStages} /></div>
            <div data-story-chapter="experience"><Experience onLayout={captureMeteorLayout} /></div>
            <div data-story-chapter="works"><Work /></div>
            <div data-story-chapter="finale" aria-hidden="true" className="min-h-[225vh] motion-reduce:min-h-0" />
            <div data-story-chapter="contact"><Contact /></div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRouteStore(state => state.path);
  const restore = useRouteStore(state => state.restore);
  const [menuOpen, setMenuOpen] = useState(false);
  const reader = route === EDURA_ROUTE;
  useEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const sync = () => useRouteStore.getState().sync();
    const unsubscribe = useRouteStore.subscribe(() => setMenuOpen(false));
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      history.scrollRestoration = previous;
      unsubscribe();
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  useGSAPSetup(() => {
    if (!reader) return;
    window.scrollTo(0, 0);
    const heading = document.getElementById('edura-title');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }, { dependencies: [reader] });
  return <>
    <Nav reader={reader} menuOpen={menuOpen} onMenuClick={() => setMenuOpen(true)} />
    <MenuOverlay key={route} reader={reader} open={menuOpen} onClose={() => setMenuOpen(false)} />
    {reader ? <Edura onReturn={returnToWorks} /> : <Portfolio restore={restore} />}
  </>;
}
