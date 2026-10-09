import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Vector2 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { portalProgress, portalState } from '@/3d/utils/portal';

const NEBULA_VERT = /* glsl */ `
  varying vec2 vUv;
  uniform float uPortal;
  uniform float uIntake;
  uniform float uEject;
  uniform float uEjecting;
  uniform vec2 uPortalCenter;
  uniform vec2 uViewport;
  void main() {
    vUv = uv;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    if (uPortal > 0.5 && clip.w > 0.0) {
      float aspect = uViewport.x / max(1.0, uViewport.y);
      vec2 radial = (clip.xy / clip.w - uPortalCenter) * vec2(aspect, 1.0);
      float angle = (uEjecting > 0.5 ? 1.0 - uEject : uIntake) * 0.7 / (0.7 + length(radial));
      mat2 turn = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
      float scale = uEjecting > 0.5 ? uEject : max(0.001, 1.0 - uIntake);
      clip.xy = (uPortalCenter + turn * radial * scale / vec2(aspect, 1.0)) * clip.w;
    }
    gl_Position = clip;
  }
`;

const NEBULA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uPortalOpacity;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < FBM_OCTAVES; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
  void main() {
    vec2 p = vUv * 3.2 + vec2(uTime * 0.008, uTime * 0.004);
    float f = fbm(p);
    float g = fbm(p * 2.1 - f * 0.7);
    vec3 col = mix(uColorA, uColorB, clamp(g * 1.4, 0.0, 1.0));
    vec2 edge = 1.0 - smoothstep(vec2(0.30), vec2(0.50), abs(vUv - 0.5));
    float alpha = smoothstep(0.28, 0.95, g) * 0.2 * edge.x * edge.y;
    gl_FragColor = vec4(col, alpha * uPortalOpacity);
  }
`;

export function Nebula({ position, scale, colorA = '#202020', colorB = '#5A5A5A', frozen = false, quality = 'high', story = false }) {
  const material = useRef(null);
  const phase = useRef({});
  const defines = useMemo(() => ({ FBM_OCTAVES: quality === 'low' ? 3 : quality === 'medium' ? 4 : 5 }), [quality]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPortal: { value: 0 },
    uIntake: { value: 0 },
    uEject: { value: 0 },
    uEjecting: { value: 0 },
    uPortalOpacity: { value: 1 },
    uPortalCenter: { value: new Vector2() },
    uViewport: { value: new Vector2(1, 1) },
    uColorA: { value: new Color(colorA) },
    uColorB: { value: new Color(colorB) },
  }), [colorA, colorB]);

  useFrame((state, delta) => {
    if (!material.current) return;
    const scroll = useScrollStore.getState();
    const chapter = scroll.storyChapter;
    const portal = story && !frozen && (chapter === 'hero' || chapter === 'portal');
    const p = portalProgress(chapter, scroll.chapterProgress, frozen);
    portalState(p, phase.current);
    const values = material.current.uniforms;
    values.uPortal.value = portal ? 1 : 0;
    values.uIntake.value = phase.current.intake;
    values.uEject.value = phase.current.eject;
    values.uEjecting.value = p >= 0.50 ? 1 : 0;
    values.uPortalOpacity.value = !portal ? 1 : p < 0.50
      ? 1 - phase.current.intake * phase.current.intake : phase.current.eject;
    values.uViewport.value.set(state.size.width, state.size.height);
    const anchor = scroll.storyAnchor;
    const center = phase.current.center;
    const x = anchor ? (anchor.left + anchor.width * 0.5) / state.size.width : 0.5;
    const y = anchor ? 1 - (anchor.top + anchor.height * 0.5) / state.size.height : 0.55;
    values.uPortalCenter.value.set((x + (0.5 - x) * center) * 2 - 1, (y + (0.55 - y) * center) * 2 - 1);
    const ending = story && (chapter === 'finale' || chapter === 'contact');
    if (portal) material.current.uniforms.uTime.value = p * 12;
    else if (!frozen && !ending) {
      material.current.uniforms.uTime.value += Math.min(delta, 0.1);
    }
  });

  return (
    <mesh name="nebula" position={position} scale={scale} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        vertexShader={NEBULA_VERT}
        fragmentShader={NEBULA_FRAG}
        defines={defines}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}
