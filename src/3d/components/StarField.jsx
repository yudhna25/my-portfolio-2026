import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color } from 'three';
import { QUALITY } from '@/3d/quality';
import { buildStarGeometry } from '@/3d/utils/buildStarGeometry';
import { useScrollStore } from '@/stores/useScrollStore';

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uApproach;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Apparent size of distant stars is independent of the camera's translation.
    gl_PointSize = max(1.0, aSize * uPixelRatio * (1.0 + 0.08 * uApproach));
    gl_Position = projectionMatrix * mv;
    vAlpha = 0.85 + 0.15 * sin(uTime * (0.3 + aSeed * 0.5) + aSeed * 60.0);
    vSeed = aSeed;
  }
`;

const STAR_FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    // Quadratic falloff: sharp core, no soft neon halo.
    float a = 1.0 - smoothstep(0.15, 0.5, d);
    a *= a;
    vec3 col = mix(uColorA, uColorB, step(0.7, vSeed));
    gl_FragColor = vec4(col, a * (0.30 + 0.50 * vAlpha));
  }
`;

export function StarField({ count = QUALITY.high, frozen = false, story = false }) {
  const stars = useRef(null);
  const material = useRef(null);
  const geometry = useMemo(() => buildStarGeometry(count), [count]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uApproach: { value: 0 },
    uColorA: { value: new Color('#FFFFFF') },
    uColorB: { value: new Color('#BBBBBB') },
  }), []);

  // Geometry supplied as a prop is manually owned; dispose also on tier changes.
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    if (stars.current) stars.current.position.copy(state.camera.position);
    if (!material.current) return;
    // Match the actual drawing buffer, including the Canvas DPR cap / resize.
    material.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    // An intentionally subtle artistic zoom: at most eight percent, no halo.
    const scroll = useScrollStore.getState();
    const ending = story && (scroll.storyChapter === 'finale' || scroll.storyChapter === 'contact');
    const progress = frozen ? 0 : scroll.scrollProgress;
    if (frozen) material.current.uniforms.uApproach.value = 0;
    else if (story) material.current.uniforms.uApproach.value = progress;
    else material.current.uniforms.uApproach.value += (progress - material.current.uniforms.uApproach.value)
      * (1 - Math.exp(-8 * Math.min(delta, 0.1)));
    if (!frozen && !ending) material.current.uniforms.uTime.value += Math.min(delta, 0.1);
  });

  return (
    <points ref={stars} name="star-field" geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
