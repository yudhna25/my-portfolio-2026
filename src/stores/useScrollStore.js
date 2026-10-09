import { create } from 'zustand';
import { createWorksOrbit, syncWorksOrbit, WORKS_IDS } from '@/3d/utils/worksOrbit';
import { STORY_IDLE_PHASE } from '@/3d/utils/cameraPath';

export const useScrollStore = create((set) => ({
  scrollProgress: 0,
  currentSection: 'hero',
  storyChapter: 'hero',
  chapterProgress: 0,
  storyManual: false,
  storyAnchor: null,
  sceneFallback: false,
  setSceneFallback: sceneFallback => set(state => state.sceneFallback === sceneFallback ? state : { sceneFallback }),
  worksOrbit: createWorksOrbit(STORY_IDLE_PHASE),
  worksSelection: null,
  worksHover: null,
  worksFocus: null,
  worksFinaleSelection: null,
  setWorksInteraction: (channel, id) => {
    if (!['Selection', 'Hover', 'Focus'].includes(channel) || id !== null && !WORKS_IDS.includes(id)) return;
    const key = `works${channel}`;
    set((state) => state[key] === id ? state : { [key]: id });
  },
  clearWorksInteraction: () => set({ worksSelection: null, worksHover: null, worksFocus: null }),
  setStoryPosition: (chapter, progress, scrollProgress, manual = true) => {
    if (typeof chapter !== 'string' || !Number.isFinite(progress)) return;
    const p = Math.min(1, Math.max(0, progress));
    set((state) => {
      const presentation = state.storyChapter === 'works' && (chapter === 'finale' || chapter === 'contact')
        ? state.worksSelection ?? state.worksFocus ?? state.worksHover : state.worksFinaleSelection;
      syncWorksOrbit(state.worksOrbit, chapter, p);
      const scroll = Number.isFinite(scrollProgress) ? Math.min(1, Math.max(0, scrollProgress)) : state.scrollProgress;
      return state.storyChapter === chapter && state.chapterProgress === p && state.scrollProgress === scroll && state.storyManual === manual
        ? state : { storyChapter: chapter, chapterProgress: p, scrollProgress: scroll, storyManual: manual, worksFinaleSelection: presentation,
          currentSection: chapter === 'works' ? 'work' : chapter === 'contact' ? 'transmission' : chapter === 'portal' ? 'hero' : chapter === 'departure' ? 'experience' : chapter };
    });
  },
  setStoryManual: (storyManual) => set((state) => state.storyManual === storyManual ? state : { storyManual }),
  setStoryAnchor: (storyAnchor) => set((state) => {
    const old = state.storyAnchor;
    return old?.left === storyAnchor?.left && old?.top === storyAnchor?.top && old?.width === storyAnchor?.width && old?.height === storyAnchor?.height && old?.fixed === storyAnchor?.fixed
      ? state : { storyAnchor };
  }),
  // The scroll bridge supplies progress; CameraRig consumes it without measuring again.
  setProgress: (progress) => {
    if (Number.isFinite(progress)) {
      set({ scrollProgress: Math.min(1, Math.max(0, progress)) });
    }
  },
  setCurrentSection: (currentSection) => set({ currentSection }),
}));
