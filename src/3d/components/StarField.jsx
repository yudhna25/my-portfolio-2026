import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, Vector2 } from 'three';
import { QUALITY } from '@/3d/quality';
import { buildStarGeometry } from '@/3d/utils/buildStarGeometry';
import { useScrollStore } from '@/stores/useScrollStore';
import { portalProgress, portalState } from '@/3d/utils/portal';

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uApproach;
  uniform float uPortal;
  uniform float uIntake;
  uniform float uEject;
  uniform float uEjecting;
  uniform vec2 uPortalCenter;
  uniform vec2 uViewport;
  varying float vAlpha;
  varying float vSeed;
  varying vec2 vTrailAxis;
  varying float vStretch;
  varying float vVisibility;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vec4 clip = projectionMatrix * mv;
    float trail = 0.0;
    float visibility = 1.0;
    vTrailAxis = vec2(1.0, 0.0);
    if (uPortal > 0.5 && clip.w > 0.0) {
      float aspect = uViewport.x / max(1.0, uViewport.y);
      vec2 radial = (clip.xy / clip.w - uPortalCenter) * vec2(aspect, 1.0);
      float radius = length(radial);
      float pull = pow(uIntake, 1.25);
      float release = smoothstep(aSeed * 0.15, 1.0, uEject);
      float angle = uEjecting > 0.5
        ? (1.0 - release) * (0.55 + aSeed * 0.6) / (1.0 + radius)
        : pull * (0.65 + aSeed * 0.75) / (0.45 + radius);
      mat2 turn = mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
      vec2 bent = turn * radial;
      float scale = uEjecting > 0.5 ? release : max(0.001, 1.0 - pull);
      clip.xy = (uPortalCenter + bent * scale / vec2(aspect, 1.0)) * clip.w;
      vec2 axis = vec2(bent.x, -bent.y);
      vTrailAxis = axis / max(0.00001, length(axis));
      trail = uEjecting > 0.5 ? sin(release * 3.14159265) * 0.7 : sin(pull * 3.14159265);
      visibility = uEjecting > 0.5 ? smoothstep(0.0, 0.16, release) : 1.0 - smoothstep(0.78, 1.0, pull);
    }
    vStretch = 1.0 + trail * (8.0 + aSeed * 6.0);
    // Apparent size of distant stars is independent of the camera's translation.
    gl_PointSize = max(1.0, aSize * uPixelRatio * (1.0 + 0.08 * uApproach)) * vStretch;
    gl_Position = clip;
    vAlpha = 0.85 + 0.15 * sin(uTime * (0.3 + aSeed * 0.5) + aSeed * 60.0);
    vVisibility = visibility;
    vSeed = aSeed;
  }
`;

const STAR_FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vAlpha;
  varying float vSeed;
  varying vec2 vTrailAxis;
  varying float vStretch;
  varying float vVisibility;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    vec2 streak = vec2(dot(c, vTrailAxis), dot(c, vec2(-vTrailAxis.y, vTrailAxis.x)) * vStretch);
    float d = length(streak);
    // Quadratic falloff: sharp core, no soft neon halo.
    float a = 1.0 - smoothstep(0.15, 0.5, d);
    a *= a;
    vec3 col = mix(uColorA, uColorB, step(0.7, vSeed));
    gl_FragColor = vec4(col, a * (0.30 + 0.50 * vAlpha) * vVisibility);
  }
`;

export function StarField({ count = QUALITY.high, frozen = false, story = false }) {
  const stars = useRef(null);
  const material = useRef(null);
  const phase = useRef({});
  const geometry = useMemo(() => buildStarGeometry(count), [count]);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uApproach: { value: 0 },
    uPortal: { value: 0 },
    uIntake: { value: 0 },
    uEject: { value: 0 },
    uEjecting: { value: 0 },
    uPortalCenter: { value: new Vector2() },
    uViewport: { value: new Vector2(1, 1) },
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
    const portal = story && !frozen && (scroll.storyChapter === 'hero' || scroll.storyChapter === 'portal');
    const p = portalProgress(scroll.storyChapter, scroll.chapterProgress, frozen);
    portalState(p, phase.current);
    const values = material.current.uniforms;
    values.uPortal.value = portal ? 1 : 0;
    values.uIntake.value = phase.current.intake;
    const eject = Math.min(1, Math.max(0, (p - 0.50) / 0.20));
    values.uEject.value = eject * eject * (3 - 2 * eject);
    values.uEjecting.value = p >= 0.50 ? 1 : 0;
    values.uViewport.value.set(state.size.width, state.size.height);
    const anchor = scroll.storyAnchor;
    const center = phase.current.center;
    const x = anchor ? (anchor.left + anchor.width * 0.5) / state.size.width : 0.5;
    const y = anchor ? 1 - (anchor.top + anchor.height * 0.5) / state.size.height : 0.55;
    values.uPortalCenter.value.set((x + (0.5 - x) * center) * 2 - 1, (y + (0.55 - y) * center) * 2 - 1);
    const ending = story && (scroll.storyChapter === 'finale' || scroll.storyChapter === 'contact');
    const progress = frozen ? 0 : scroll.scrollProgress;
    if (frozen) material.current.uniforms.uApproach.value = 0;
    else if (story) material.current.uniforms.uApproach.value = progress;
    else material.current.uniforms.uApproach.value += (progress - material.current.uniforms.uApproach.value)
      * (1 - Math.exp(-8 * Math.min(delta, 0.1)));
    if (portal) material.current.uniforms.uTime.value = p * 12;
    else if (!frozen && !ending) material.current.uniforms.uTime.value += Math.min(delta, 0.1);
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
