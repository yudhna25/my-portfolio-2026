import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RAY_SCALE_LEVELS, renderBudget } from '@/3d/quality';

const WINDOW = 45;            // frames per measurement window (~0.75 s at 60 fps)
const SETTLE = 2.5;           // seconds ignored after mount (shader compiles, texture uploads)
const SLOW_MS = 1000 / 42;    // median frame slower than 42 fps: the GPU cannot keep up
const FAST_MS = 1000 / 56;    // median frame faster than 56 fps: headroom to sharpen again

function setLevel(level) {
  renderBudget.level = level;
  renderBudget.ray = RAY_SCALE_LEVELS[level];
}

// A display or browser capped at 30 Hz (Low Power Mode) shows evenly spaced ~33 ms
// frames; that is a refresh limit, not GPU load, and lowering resolution would not help.
function refreshCapped(sorted) {
  const median = sorted[sorted.length >> 1], high = sorted[Math.floor(sorted.length * 0.8)];
  return median > 32 && median < 34.5 && high < 35.5;
}

/**
 * Dynamic resolution for the black-hole ray pass only. A GPU that holds the frame rate
 * never leaves level 0 (identical image); a weak one renders the ray image at a lower
 * scale instead of dropping frames, and climbs back as soon as the scene allows.
 * `?quality=max` pins full quality (reviews, captures); `?ray=0.65` pins a scale.
 */
export function AdaptiveQuality() {
  const frames = useRef([]);
  const state = useRef({ age: 0, slow: 0, fast: 0, need: 4, lastClimb: -Infinity });
  const pinned = useRef(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const forced = Number(query.get('ray'));
    pinned.current = query.get('quality') === 'max' ? 1 : forced > 0 && forced <= 1 ? forced : null;
    if (pinned.current !== null) { renderBudget.level = 0; renderBudget.ray = pinned.current; }
    return () => setLevel(0);
  }, []);

  useFrame((_, delta) => {
    const run = state.current;
    run.age += delta;
    if (pinned.current !== null || run.age < SETTLE || document.hidden) return;
    // Long stalls (tab switches, route changes, GC) say nothing about steady GPU load.
    if (delta > 0.25) { frames.current.length = 0; return; }
    frames.current.push(delta * 1000);
    if (frames.current.length < WINDOW) return;
    const sorted = frames.current.sort((a, b) => a - b);
    const median = sorted[WINDOW >> 1];
    frames.current = [];
    const level = renderBudget.level;
    if (median > SLOW_MS && !refreshCapped(sorted)) {
      run.fast = 0;
      if (++run.slow >= 2 && level < RAY_SCALE_LEVELS.length - 1) {
        // Falling again soon after climbing means that level does not fit: wait longer next time.
        if (run.age - run.lastClimb < 4) run.need = Math.min(run.need * 2, 32);
        setLevel(level + 1);
        run.slow = 0;
      }
    } else if (median < FAST_MS) {
      run.slow = 0;
      if (++run.fast >= run.need && level > 0) {
        setLevel(level - 1);
        run.fast = 0;
        run.lastClimb = run.age;
      }
    } else {
      run.slow = 0;
      run.fast = 0;
    }
  });
  return null;
}
