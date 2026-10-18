import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { createGravityField } from './gravityField.js';

// One field per renderer, shared by every consumer and stepped once per frame. It lives
// as long as its renderer (two 128² targets), so mounts and unmounts never reset trails.
const shared = new WeakMap();

export function getGravityField(gl) {
  let field = shared.get(gl);
  if (!field) shared.set(gl, field = createGravityField());
  return field;
}

export function disposeGravityField(gl) {
  shared.get(gl)?.dispose();
  shared.delete(gl);
}

/**
 * Returns the shared cursor gravity field. Read `field.uniform` (sampler2D) and
 * `field.pointer` (vec4) in shaders; both are stable Uniform objects.
 * Call inside the R3F Canvas.
 */
export function useGravityField() {
  const gl = useThree(state => state.gl);
  const reduced = useReducedMotion();
  const field = useMemo(() => getGravityField(gl), [gl]);
  useEffect(() => { field.setEnabled(!reduced); }, [field, reduced]);
  // Before the scene renders, after camera rigs (-1) have moved.
  useFrame((state, delta) => field.step(gl, delta, state.clock.elapsedTime), -0.75);
  return field;
}
