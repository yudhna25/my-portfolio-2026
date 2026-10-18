import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Matrix4, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { portalProgress } from '@/3d/utils/portal';
import { CHAPTER_PALETTE, PALETTE_CHAPTERS, paletteWeights } from '@/3d/utils/chapterWave';

const TINTS = Object.fromEntries(PALETTE_CHAPTERS.map(key => [key, new Color(CHAPTER_PALETTE[key].light)]));

// Two parallax layers the far sky cannot give (it rides with the camera): drifting dust
// right in front of the lens and a mid-distance star shell. Each lives in a box that wraps
// around the camera, so there is always depth to fly through and true parallax as it moves.
const VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform vec3 uCamera, uPrevCamera;
  uniform mat4 uPrevViewProjection;
  uniform vec2 uViewport;
  uniform float uBox, uSize, uPixelRatio, uFocus, uBlur, uOpacity, uTime;
  uniform vec3 uTint;
  uniform float uTintMix;
  varying vec3 vColor;
  varying float vAlpha, vStretch, vBokeh;
  varying vec2 vAxis;
  vec3 wrapAround(vec3 camera) {
    vec3 drift = vec3(sin(uTime * 0.05 + aSeed.w * 40.0), cos(uTime * 0.04 + aSeed.w * 31.0), sin(uTime * 0.03 + aSeed.w * 17.0)) * 0.4;
    return mod(aSeed.xyz * uBox + drift - camera + 0.5 * uBox, uBox) - 0.5 * uBox;
  }
  void main() {
    vec3 rel = wrapAround(uCamera), relPrev = wrapAround(uPrevCamera);
    vec4 view = viewMatrix * vec4(uCamera + rel, 1.0);
    vec4 clip = projectionMatrix * view;
    float depth = -view.z;
    // Hide the wrap seam and anything behind or touching the lens.
    float edge = 1.0 - smoothstep(0.36, 0.5, max(max(abs(rel.x), abs(rel.y)), abs(rel.z)) / uBox);
    float front = smoothstep(0.35, 1.2, depth);
    float size = uSize * (0.55 + 0.9 * aSeed.w) / max(depth, 0.35);
    // Out-of-focus grains open into soft discs and spread their light.
    float bokeh = uBlur * clamp(abs(depth - uFocus) / uFocus, 0.0, 1.0);
    size *= 1.0 + 2.0 * bokeh;
    float pixels = clamp(size * uPixelRatio, 1.0, 72.0);
    // Motion blur from the camera's own travel since the last frame.
    vec4 previous = uPrevViewProjection * vec4(uPrevCamera + relPrev, 1.0);
    vec2 delta = (clip.xy / clip.w - previous.xy / max(previous.w, 0.001)) * 0.5 * uViewport * uPixelRatio;
    float travel = previous.w > 0.0 && distance(rel, relPrev) < uBox * 0.3 ? length(delta) : 0.0;
    vStretch = 1.0 + min(travel / max(pixels, 1.0), 10.0);
    vAxis = travel > 0.0 ? vec2(delta.x, -delta.y) / travel : vec2(1.0, 0.0);
    gl_PointSize = pixels * vStretch;
    gl_Position = clip;
    vBokeh = bokeh;
    float tint = fract(aSeed.w * 7.31);
    vColor = mix(vec3(0.78, 0.84, 1.0), vec3(1.0, 0.86, 0.70), step(0.82, tint));
    // Each chapter's region of sky colours the dust and stars passing the lens.
    vColor = mix(vColor, uTint, uTintMix * step(tint, 0.7));
    vAlpha = uOpacity * edge * front * (0.35 + 0.65 * fract(aSeed.w * 3.7))
      / pow(1.0 + 2.0 * bokeh, 1.4) / sqrt(vStretch) * min(1.0, size * uPixelRatio);
  }
`;
const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vStretch, vBokeh;
  varying vec2 vAxis;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    vec2 streak = vec2(dot(c, vAxis), dot(c, vec2(-vAxis.y, vAxis.x)) * vStretch);
    float d = length(streak);
    float sharp = pow(1.0 - smoothstep(0.0, 0.5, d), 2.2);
    float disc = (1.0 - smoothstep(0.36, 0.5, d)) * (0.6 + 0.4 * smoothstep(0.15, 0.45, d));
    float a = mix(sharp, disc * 0.8, smoothstep(0.15, 0.6, vBokeh)) * vAlpha;
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const LAYERS = {
  // Near dust draws over the BH image (it sits between lens and hole); the star shell draws
  // under it, so the shadow and the disk occlude it.
  dust: { box: 36, size: 9, focus: 9, blur: 1, counts: { high: 2200, medium: 1200, low: 480 }, opacity: 0.55, order: 12 },
  stars: { box: 150, size: 34, focus: 60, blur: 0, counts: { high: 4200, medium: 2400, low: 900 }, opacity: 0.8, order: 9 },
};

const smooth = (a, b, value) => {
  const t = Math.min(1, Math.max(0, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Chapter presence: quiet over the Hero lockup, gone through the portal rebase and the
// kilonova, absent from the unchanged Contact frame.
function presence(chapter, progress) {
  switch (chapter) {
    case 'hero': return 0.45;
    case 'portal': return progress < 0.47 ? 0.45 * (1 - smooth(0, 0.2, progress)) : smooth(0.56, 0.86, progress);
    case 'finale': return 1 - smooth(0.30, 0.44, progress);
    case 'contact': return 0;
    default: return 1;
  }
}

function Layer({ layer, quality, reduced }) {
  const points = useRef(null);
  const state = useRef({ ready: false, time: 0, camera: new Vector3(), matrix: new Matrix4(), biomes: {} });
  const config = LAYERS[layer];
  const geometry = useMemo(() => {
    const count = config.counts[quality] ?? config.counts.high;
    const seeds = new Float32Array(count * 4);
    for (let i = 0; i < seeds.length; i++) {
      const value = Math.sin((i + 1) * (layer === 'dust' ? 12.9898 : 78.233)) * 43758.5453;
      seeds[i] = value - Math.floor(value);
    }
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    result.setAttribute('aSeed', new BufferAttribute(seeds, 4));
    return result;
  }, [config, layer, quality]);
  const uniforms = useMemo(() => ({
    uCamera: { value: new Vector3() }, uPrevCamera: { value: new Vector3() }, uPrevViewProjection: { value: new Matrix4() },
    uViewport: { value: new Vector2(1, 1) }, uBox: { value: config.box }, uSize: { value: config.size }, uPixelRatio: { value: 1 },
    uFocus: { value: config.focus }, uBlur: { value: config.blur }, uOpacity: { value: 0 }, uTime: { value: 0 },
    uTint: { value: new Color() }, uTintMix: { value: 0 },
  }), [config]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, gl, size }, delta) => {
    if (!points.current) return;
    const scroll = useScrollStore.getState();
    const chapter = scroll.storyChapter;
    const opacity = config.opacity * presence(chapter, chapter === 'portal' ? portalProgress(chapter, scroll.chapterProgress, reduced) : scroll.chapterProgress);
    points.current.visible = opacity > 0.001;
    const memory = state.current, values = points.current.material.uniforms;
    camera.updateMatrixWorld();
    if (!memory.ready) {
      memory.camera.copy(camera.position);
      memory.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      memory.ready = true;
    }
    if (points.current.visible) {
      if (!reduced) memory.time += Math.min(delta, 0.1);
      values.uOpacity.value = opacity;
      paletteWeights(chapter, scroll.chapterProgress, memory.biomes);
      let mix = 0;
      values.uTint.value.setRGB(0, 0, 0);
      for (const biome of PALETTE_CHAPTERS) {
        const weight = memory.biomes[biome];
        if (weight > 0) { values.uTint.value.r += TINTS[biome].r * weight; values.uTint.value.g += TINTS[biome].g * weight; values.uTint.value.b += TINTS[biome].b * weight; mix += weight; }
      }
      if (mix > 0) values.uTint.value.multiplyScalar(1 / mix);
      values.uTintMix.value = 0.5 * Math.min(1, mix);
      values.uTime.value = memory.time;
      values.uPixelRatio.value = gl.getPixelRatio();
      values.uViewport.value.set(size.width, size.height);
      values.uCamera.value.copy(camera.position);
      // Reduced motion keeps the depth but never smears it.
      values.uPrevCamera.value.copy(reduced ? camera.position : memory.camera);
      if (reduced) values.uPrevViewProjection.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      else values.uPrevViewProjection.value.copy(memory.matrix);
    }
    memory.camera.copy(camera.position);
    memory.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  });

  return <points ref={points} name={`space-${layer}`} geometry={geometry} frustumCulled={false} renderOrder={config.order}>
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
  </points>;
}

export function SpaceDust({ quality = 'high', reduced = false }) {
  return <>
    <Layer layer="stars" quality={quality} reduced={reduced} />
    <Layer layer="dust" quality={quality} reduced={reduced} />
  </>;
}
