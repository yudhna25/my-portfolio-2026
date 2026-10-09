import { useSyncExternalStore } from 'react';

const motionQuery = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

function subscribe(onChange) {
  motionQuery?.addEventListener('change', onChange);
  return () => motionQuery?.removeEventListener('change', onChange);
}

const getSnapshot = () => motionQuery?.matches ?? false;
const getServerSnapshot = () => false;

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
