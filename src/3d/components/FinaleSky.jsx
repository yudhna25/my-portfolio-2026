import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector2, Vector3 } from 'three';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { finaleState } from '@/3d/utils/finale';
import { useScrollStore } from '@/stores/useScrollStore';

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
// Drawn behind the black-hole composite, so the shadow reads as a black sun on the sky.
const FRAG = /* glsl */ `
  uniform float uDawn, uAspect, uHorizon;
  uniform vec2 uCenter;
  varying vec2 vUv;
  void main() {
    vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
    // A planet far larger than the frame, its limb slightly rolled for a cinematic horizon.
    float roll = 0.06;
    vec2 local = mat2(cos(roll), -sin(roll), sin(roll), cos(roll)) * q;
    float radius = 3.2;
    float horizon = mix(-0.75, uHorizon, uDawn);
    float height = length(local - vec2(0.0, horizon - 0.5 - radius)) - radius;
    // Sky: amber at the horizon, indigo overhead.
    float above = max(height, 0.0);
    vec3 sky = mix(vec3(0.95, 0.46, 0.18), vec3(0.20, 0.08, 0.26), smoothstep(0.0, 0.42, above));
    sky = mix(sky, vec3(0.02, 0.015, 0.05), smoothstep(0.35, 0.95, above));
    float skyAlpha = (0.5 * exp(-above * 3.6) + 0.08) * uDawn;
    // Warm halo of the black sun's disk light scattered in the atmosphere.
    vec2 sun = (uCenter - 0.5) * vec2(uAspect, 1.0);
    float halo = exp(-length(q - sun) / 0.32) * 0.55 * uDawn;
    vec3 rgb = sky * skyAlpha + vec3(1.0, 0.62, 0.30) * halo;
    float a = clamp(skyAlpha + halo, 0.0, 0.92);
    // Limb: a thin hot rim and a soft atmosphere band, the night side below.
    float rim = exp(-abs(height) / 0.0025) * 1.6 + exp(-max(height, 0.0) / 0.03) * 0.35 * step(0.0, height);
    float lit = 0.6 + 0.4 * exp(-abs(local.x - sun.x) / 0.6);
    rgb += vec3(1.0, 0.70, 0.38) * rim * lit * uDawn;
    a = max(a, clamp(rim * uDawn, 0.0, 1.0));
    float body = smoothstep(0.0, -0.004, height) * uDawn;
    vec3 night = mix(vec3(0.05, 0.025, 0.02), vec3(0.008, 0.006, 0.012), smoothstep(0.0, 0.25, -height));
    rgb = mix(rgb, night, body);
    a = max(a, body);
    gl_FragColor = vec4(rgb / max(a, 0.00001), a);
  }
`;

const center = new Vector3(...BLACK_HOLE_CENTER);

export function FinaleSky({ reduced = false }) {
  const mesh = useRef(null);
  const phase = useRef({});
  const projected = useMemo(() => new Vector3(), []);
  const uniforms = useMemo(() => ({ uDawn: { value: 0 }, uAspect: { value: 1 }, uHorizon: { value: 0.2 }, uCenter: { value: new Vector2(0.5, 0.5) } }), []);
  useFrame(({ camera, size }) => {
    if (!mesh.current) return;
    const state = useScrollStore.getState();
    const authored = finaleState(state.storyChapter === 'finale' ? state.chapterProgress : 0, phase.current);
    mesh.current.visible = !reduced && state.storyChapter === 'finale' && authored.dawn > 0.001;
    if (!mesh.current.visible) return;
    const portrait = size.height > size.width, values = mesh.current.material.uniforms;
    values.uDawn.value = authored.dawn;
    values.uAspect.value = size.width / Math.max(1, size.height);
    // Keep the horizon under the hole; portrait frames sit the hole lower.
    values.uHorizon.value = portrait ? 0.14 : 0.2;
    projected.copy(center).project(camera);
    if (Number.isFinite(projected.x) && Number.isFinite(projected.y)) values.uCenter.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
  });
  return <mesh ref={mesh} name="finale-sky" frustumCulled={false} renderOrder={4} visible={false}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>;
}
