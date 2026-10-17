import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BlendFunction, ChromaticAberrationEffect, NoiseEffect, VignetteEffect } from 'postprocessing';
import { Vector2 } from 'three';
import { finaleSmooth, finaleState } from '@/3d/utils/finale';
import { useScrollStore } from '@/stores/useScrollStore';

// Film grade for the Works→Contact flight only: lens fringing (spiking at the merger),
// grain that keeps blacks black, and a vignette. Every effect is neutral elsewhere.
export function FinaleGrade({ reduced = false }) {
  const phase = useRef({});
  const fringe = useRef(null), grain = useRef(null), vignette = useRef(null);
  const effects = useMemo(() => ({
    fringe: new ChromaticAberrationEffect({ offset: new Vector2(), radialModulation: true, modulationOffset: 0.25 }),
    grain: new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT }),
    vignette: new VignetteEffect({ offset: 0.32, darkness: 0 }),
  }), []);
  useEffect(() => () => Object.values(effects).forEach(effect => effect.dispose()), [effects]);
  useFrame(() => {
    const state = useScrollStore.getState();
    const p = !reduced && state.storyChapter === 'finale' ? state.chapterProgress : 0;
    const authored = finaleState(p, phase.current);
    const burst = p >= 0.44 ? Math.exp(-(p - 0.44) * 30) : finaleSmooth(0.36, 0.44, p) * 0.4;
    if (!fringe.current || !grain.current || !vignette.current) return;
    const offset = authored.grade * 0.0003 + burst * 0.005;
    fringe.current.offset.set(offset, offset * 0.6);
    grain.current.blendMode.opacity.value = authored.grade * 0.45;
    vignette.current.darkness = authored.grade * 0.55;
  });
  return <>
    <primitive ref={fringe} object={effects.fringe} dispose={null} />
    <primitive ref={grain} object={effects.grain} dispose={null} />
    <primitive ref={vignette} object={effects.vignette} dispose={null} />
  </>;
}
