import { useEffect } from 'react';
import { gsap } from '@/hooks/useGSAPSetup';
import { useScrollStore } from '@/stores/useScrollStore';
import { chapterWave, waveRadius, waveScreen } from '@/3d/utils/chapterWave';

const MASK_PROPS = ['maskImage', 'webkitMaskImage', 'maskComposite', 'webkitMaskComposite'];

function clearMask(element) {
  if (!element?.style.maskImage && !element?.style.webkitMaskImage) return;
  for (const prop of MASK_PROPS) element.style[prop] = '';
}

// The incoming chapter is revealed through the same torn gravitational wavefront the sky
// shows: a soft disc from the BH's screen position, with radial slivers ahead of it.
// Reduced motion (or no scene) never masks anything.
export function useChapterReveal({ scope, disabled = false }) {
  useEffect(() => {
    const root = scope.current;
    if (!root || disabled) return;
    const wave = {};
    let masked = null;
    const draw = () => {
      const state = useScrollStore.getState();
      chapterWave(state.storyChapter, state.chapterProgress, wave);
      const element = wave.active && wave.to !== 'departure' ? root.querySelector(`[data-story-chapter="${wave.to}"]`) : null;
      if (masked && masked !== element) clearMask(masked);
      masked = element;
      if (!element) return;
      const width = window.innerWidth, height = window.innerHeight;
      const x = waveScreen.ready ? waveScreen.x * width / waveScreen.width : width * 0.8;
      const y = waveScreen.ready ? waveScreen.y * height / waveScreen.height : height * 0.25;
      const reach = Math.max(Math.hypot(x, y), Math.hypot(width - x, y), Math.hypot(x, height - y), Math.hypot(width - x, height - y));
      // Same front as the screen pass (radius in height units there, px here).
      const radius = waveRadius(wave.phase) * reach;
      const rect = element.getBoundingClientRect();
      const cx = (x - rect.left).toFixed(1), cy = (y - rect.top).toFixed(1);
      const at = `circle at ${cx}px ${cy}px`;
      const turn = (wave.phase * 40).toFixed(2);
      const image = `radial-gradient(${at}, #000 ${Math.max(0, radius - 18)}px, transparent ${radius}px),`
        + `radial-gradient(${at}, #000 ${radius + 14}px, transparent ${radius + 15}px),`
        + `repeating-conic-gradient(from ${turn}deg at ${cx}px ${cy}px, #000 0deg 0.9deg, transparent 0.9deg 2.1deg, #000 2.1deg 2.6deg, transparent 2.6deg 4.3deg)`;
      element.style.maskImage = element.style.webkitMaskImage = image;
      // Inner disc ∪ (outer disc ∩ slivers): a frayed, torn edge rather than a clean circle.
      element.style.maskComposite = 'add, intersect';
      element.style.webkitMaskComposite = 'source-over, source-in';
    };
    gsap.ticker.add(draw);
    return () => {
      gsap.ticker.remove(draw);
      clearMask(masked);
    };
  }, [scope, disabled]);
}
