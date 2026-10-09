import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';

const NEBULA_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const NEBULA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
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
    gl_FragColor = vec4(col, alpha);
  }
`;

export function Nebula({ position, scale, colorA = '#202020', colorB = '#5A5A5A', frozen = false, quality = 'high', story = false }) {
  const material = useRef(null);
  const defines = useMemo(() => ({ FBM_OCTAVES: quality === 'low' ? 3 : quality === 'medium' ? 4 : 5 }), [quality]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new Color(colorA) },
    uColorB: { value: new Color(colorB) },
  }), [colorA, colorB]);

  useFrame((_, delta) => {
    const chapter = useScrollStore.getState().storyChapter;
    const ending = story && (chapter === 'finale' || chapter === 'contact');
    if (material.current && !frozen && !ending) {
      material.current.uniforms.uTime.value += Math.min(delta, 0.1);
    }
  });

  return (
    <mesh name="nebula" position={position} scale={scale}>
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
