import { useRef } from 'react';
import { gsap, ScrollSmoother, ScrollTrigger, useGSAPSetup } from '@/hooks/useGSAPSetup';
import { useScrollStore } from '@/stores/useScrollStore';
import { clampStoryProgress, segmentProgress } from '@/3d/utils/cameraPath';

export function useScrollProgress({ scope, story = false, locale, ready = true, initialPosition, historyManaged = false } = {}) {
  const controls = useRef(null);
  const initialized = useRef(false);
  const restoredEntry = useRef(null);
  useGSAPSetup(() => {
    const content = document.getElementById('smooth-content');
    if (!content) return;

    let sections = [];
    let maxScroll = 0;
    let active = true;
    let changingMedia = false;
    const previous = useScrollStore.getState();
    const routeRestore = ready && initialPosition && restoredEntry.current !== initialPosition.key;
    let restore = routeRestore ? { id: initialPosition.chapter, p: initialPosition.p } : story && ready && initialized.current && !previous.storyManual
      ? { id: previous.storyChapter, p: previous.chapterProgress } : null;
    const { setProgress, setCurrentSection } = useScrollStore.getState();

    const seek = (id, value, manual = true) => {
      const section = sections.find(item => item.id === id || item.domId === id);
      if (!story || !section) return;
      const p = clampStoryProgress(value);
      const scroll = section.top + (section.end - section.top) * p;
      // Pause before moving the DOM: no ticker can overwrite the explicit endpoint.
      useScrollStore.getState().setStoryPosition(section.id, p, maxScroll ? scroll / maxScroll : 0, manual);
      const smoother = ScrollSmoother.get();
      if (smoother) smoother.scrollTop(scroll);
      else window.scrollTo(0, scroll);
    };

    const update = () => {
      if (ScrollTrigger.isRefreshing) return;
      // Publish the visible DOM position, including the smoother's settling frames.
      const scroll = ScrollSmoother.get()?.scrollTop() ?? window.scrollY;
      const progress = maxScroll > 0 ? scroll / maxScroll : 0;
      const state = useScrollStore.getState();
      if (story) {
        // Hold the chapter while GSAP reverts the smoother and resets native scroll.
        if (!ready || state.storyManual || changingMedia) return;
        let chapter = sections[0];
        for (const section of sections) {
          // Native scroll offsets can round a fractional section top to a pixel.
          if (section.top > scroll + 0.5) break;
          chapter = section;
        }
        if (chapter) {
          const p = segmentProgress(scroll, chapter.top, chapter.end);
          state.setStoryPosition(chapter.id === 'portal' && p === 0 ? 'hero' : chapter.id, p, progress, false);
        }
        return;
      }
      const readingLine = scroll + window.innerHeight * 0.35;
      let currentSection = 'hero';

      for (const section of sections) {
        if (section.top > readingLine) break;
        currentSection = section.id;
      }

      const clampedProgress = Math.min(1, Math.max(0, progress));
      if (state.scrollProgress !== clampedProgress) setProgress(clampedProgress);
      if (state.currentSection !== currentSection) setCurrentSection(currentSection);
    };

    const measure = () => {
      const state = useScrollStore.getState();
      const oldRange = sections.find(section => section.id === state.storyChapter);
      const contentTop = content.getBoundingClientRect().top;
      maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      sections = Array.from(content.querySelectorAll(story ? '[data-story-chapter]' : 'section[id]'), (element) => ({
        id: story ? element.dataset.storyChapter : element.id,
        domId: element.id || element.querySelector('section[id]')?.id,
        // Relative coordinates survive both smooth transforms and native-scroll restoration.
        top: element.getBoundingClientRect().top - contentTop,
      })).sort((a, b) => a.top - b.top);
      for (let index = 0; index < sections.length; index++) {
        sections[index].end = sections[index + 1]?.top ?? maxScroll;
      }
      if (story) {
        const anchor = document.querySelector('[data-story-anchor="portal"]');
        const rect = anchor?.getBoundingClientRect();
        const fixed = anchor ? !content.contains(anchor) : false;
        useScrollStore.getState().setStoryAnchor(rect ? { left: rect.left, top: rect.top - (fixed ? 0 : contentTop), width: rect.width, height: rect.height, fixed } : null);
        const newRange = sections.find(section => section.id === state.storyChapter);
        // Responsive content above this chapter can grow without a locale rebuild.
        // Keep the reading position in its chapter rather than publishing the previous one.
        if (!restore && ready && !state.storyManual && oldRange && newRange
          && (Math.abs(oldRange.top - newRange.top) > 0.5 || Math.abs(oldRange.end - newRange.end) > 0.5)) {
          restore = { id: state.storyChapter, p: state.chapterProgress };
        }
        if (routeRestore && restore) {
          seek(restore.id, restore.p, false);
          restore = null;
          restoredEntry.current = initialPosition.key;
        } else if (state.storyManual) seek(state.storyChapter, state.chapterProgress);
        else if (restore && !changingMedia) {
          const position = restore;
          restore = null;
          seek(position.id, position.p, false);
          if (routeRestore) restoredEntry.current = initialPosition.key;
        }
      }
      update();
    };

    const beforeMediaChange = () => {
      const state = useScrollStore.getState();
      if (!story || !ready || state.storyManual) return;
      changingMedia = true;
      restore = { id: state.storyChapter, p: state.chapterProgress };
    };
    const afterMediaChange = () => {
      changingMedia = false;
      measure();
    };

    measure();
    controls.current = {
      seek,
      hold: () => useScrollStore.getState().setStoryManual(true),
      resume: () => {
        const state = useScrollStore.getState();
        seek(state.storyChapter, state.chapterProgress);
        // Manual proxy seeks can leave the smoother's scrub playhead initialized
        // at the held pose. Reinitialize once before returning to native updates.
        const trigger = ScrollSmoother.get()?.scrollTrigger;
        if (trigger) { trigger.update(); trigger.animation.invalidate().progress(trigger.progress); }
        useScrollStore.getState().setStoryManual(false);
        update();
      },
    };
    const jumpHash = () => {
      if (story && ready && window.location.hash) seek(window.location.hash.slice(1), 0, false);
    };
    if (story && ready && !initialized.current) {
      initialized.current = true;
      const query = new URLSearchParams(window.location.search);
      if (window.location.pathname.endsWith('/3d-lab.html') && query.has('chapter')) seek(query.get('chapter'), Number(query.get('p') ?? 0));
      else {
        if (!initialPosition) jumpHash();
        document.fonts?.ready.then(() => { if (active) { measure(); if (!initialPosition) jumpHash(); } });
      }
    }
    // Smoother's local refresh and content reflow can change section positions.
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(content);
    const anchor = document.querySelector('[data-story-anchor="portal"]');
    if (anchor) resizeObserver.observe(anchor);
    // Added after GSAP's root update, so ScrollSmoother has rendered this tick.
    gsap.ticker.add(update);
    gsap.addEventListener('matchMediaInit', beforeMediaChange);
    gsap.addEventListener('matchMedia', afterMediaChange);
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (!historyManaged) {
      window.addEventListener('hashchange', jumpHash);
      window.addEventListener('popstate', jumpHash);
    }
    ScrollTrigger.addEventListener('refresh', measure);
    document.fonts?.addEventListener('loadingdone', measure);
    document.fonts?.ready.then(() => { if (active) measure(); });

    return () => {
      active = false;
      controls.current = null;
      resizeObserver.disconnect();
      gsap.ticker.remove(update);
      gsap.removeEventListener('matchMediaInit', beforeMediaChange);
      gsap.removeEventListener('matchMedia', afterMediaChange);
      window.removeEventListener('resize', measure);
      window.removeEventListener('load', measure);
      window.removeEventListener('hashchange', jumpHash);
      window.removeEventListener('popstate', jumpHash);
      ScrollTrigger.removeEventListener('refresh', measure);
      document.fonts?.removeEventListener('loadingdone', measure);
    };
  }, { scope, dependencies: [story, locale, ready, initialPosition, historyManaged], revertOnUpdate: true });
  return controls;
}

