import { create } from 'zustand';
import { ScrollSmoother } from '@/hooks/useGSAPSetup';
import { useScrollStore } from '@/stores/useScrollStore';
import { useLoadingStore } from '@/stores/useLoadingStore';
import { storyCameraPath } from '@/3d/utils/cameraPath';

export const EDURA_ROUTE = '/projects/edura';
const chapters = { hero: 'hero', about: 'about', skills: 'skills', education: 'education', experience: 'experience', work: 'works', transmission: 'contact' };
const finite = value => Number.isFinite(value) && Math.abs(value) < 1e7;

export function readMainSnapshot(value) {
  if (!value || !finite(value.y) || value.y < 0 || !['hero', 'portal', 'about', 'skills', 'education', 'experience', 'departure', 'works', 'finale', 'contact'].includes(value.chapter)
    || !finite(value.p) || value.p < 0 || value.p > 1 || !finite(value.width) || value.width <= 0
    || !finite(value.height) || value.height <= 0 || !finite(value.scrollProgress)
    || !value.orbit || !['phase', 'origin', 'velocity', 'captures'].every(key => finite(value.orbit[key]))
    || !['latched', 'visited', 'resumePending'].every(key => typeof value.orbit[key] === 'boolean')
    || !Array.isArray(value.pose) || value.pose.length !== 6 || !value.pose.every(finite)
    || value.selection !== null && !['edura', 'veris', 'vie'].includes(value.selection)) return null;
  return value;
}

function readRoute() {
  const path = location.pathname.replace(/\/$/, '') === EDURA_ROUTE ? EDURA_ROUTE : '/';
  const entry = history.state?.stellar ?? {};
  const key = typeof entry.id === 'string' ? entry.id : crypto.randomUUID();
  const snapshot = path === '/' ? readMainSnapshot(entry.snapshot) : null;
  const chapter = chapters[location.hash.slice(1)];
  return { path, entry, url: location.pathname + location.search + location.hash, restore: snapshot ? { ...snapshot, key } : path === '/' && chapter
    ? { key, chapter, p: 0, selection: chapter === 'works' ? 'edura' : null } : null };
}

function prepare(route) {
  if (route.path === EDURA_ROUTE || route.restore) useLoadingStore.getState().setLoading(false);
  const state = useScrollStore.getState();
  if (route.restore) {
    const saved = route.restore;
    state.setStoryPosition(saved.chapter, saved.p, saved.scrollProgress ?? 0, true);
    if (saved.orbit) Object.assign(state.worksOrbit, saved.orbit, saved.selection ? { velocity: 0 } : {});
    useScrollStore.setState({ worksSelection: saved.selection, worksHover: null, worksFocus: null });
  } else if (route.path === EDURA_ROUTE) state.setStoryManual(true);
  else state.setStoryPosition('hero', 0, 0, false);
}

const initial = readRoute();
prepare(initial);
export const useRouteStore = create(() => ({ ...initial,
  sync: () => {
    const route = readRoute(), current = useRouteStore.getState();
    if (route.url === current.url && route.entry.id === current.entry.id) return;
    prepare(route);
    useRouteStore.setState(route);
  },
}));

function saveMainEntry() {
  const state = useScrollStore.getState();
  const pose = storyCameraPath(state.storyChapter, state.chapterProgress, undefined,
    matchMedia('(prefers-reduced-motion: reduce)').matches, innerWidth / innerHeight);
  const snapshot = { y: ScrollSmoother.get()?.scrollTop() ?? scrollY, width: innerWidth, height: innerHeight,
    chapter: state.storyChapter, p: state.chapterProgress, scrollProgress: state.scrollProgress,
    selection: state.worksSelection ?? state.worksFocus ?? state.worksHover,
    orbit: { ...state.worksOrbit }, pose: [pose.x, pose.y, pose.z, pose.lookX, pose.lookY, pose.lookZ],
    focus: document.activeElement?.id || 'work-target-edura' };
  const id = crypto.randomUUID();
  history.replaceState({ ...history.state, stellar: { id, snapshot } }, '', location.href);
  return id;
}

export function navigateRoute(event, href) {
  if (event && (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
  event?.preventDefault();
  const from = useRouteStore.getState().path === '/' ? saveMainEntry() : null;
  history.pushState({ stellar: { id: crypto.randomUUID(), from } }, '', href);
  useRouteStore.getState().sync();
}

export function pushMainAnchor(id) {
  saveMainEntry();
  history.pushState({ stellar: { id: crypto.randomUUID() } }, '', `/#${id}`);
}

export function returnToWorks() {
  if (typeof history.state?.stellar?.from === 'string') history.back();
  else navigateRoute(null, '/#work');
}
