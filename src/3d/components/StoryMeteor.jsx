import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, PlaneGeometry, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { meteorFlare, meteorVisibility, STORY_METEOR_SAMPLES, writeStoryRibbon } from '@/3d/utils/storyMeteor';

const RIBBON_VERTEX = /* glsl */ `
  attribute vec2 aNormal;
  attribute float aSide, aAlong;
  uniform vec2 uViewport;
  uniform float uWidth;
  varying float vAlong, vAcross;
  void main() {
    vAlong = aAlong; vAcross = aSide;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float taper = pow(max(0.0, 1.0 - aAlong), 0.7) * mix(0.28, 1.0, smoothstep(0.0, 0.18, aAlong));
    clip.xy += aNormal * aSide * uWidth * taper / uViewport * clip.w;
    gl_Position = clip;
  }
`;
const RIBBON_FRAGMENT = /* glsl */ `
  uniform float uOpacity, uJourney, uWake;
  varying float vAlong, vAcross;
  float gas(vec2 p) {
    return sin(p.x * 19.0 + sin(p.y * 5.0)) * sin(p.y * 11.0 + p.x * 3.0);
  }
  void main() {
    float a = abs(vAcross);
    float turbulence = gas(vec2(vAlong * 2.0 - uJourney * 7.0, vAcross * 1.8));
    float ridge = exp(-pow((vAcross + turbulence * 0.045) * 7.0, 2.0));
    float sheath = exp(-a * a * 7.0) * (0.55 + turbulence * 0.12);
    float fade = pow(1.0 - vAlong, 1.5) * (1.0 - smoothstep(0.86, 1.0, a));
    float density = mix(ridge * 0.8 + sheath * 0.24, sheath * 0.065, uWake);
    vec3 color = mix(vec3(0.58, 0.89, 0.96), vec3(1.0), ridge * (1.0 - uWake));
    gl_FragColor = vec4(color, density * fade * uOpacity);
  }
`;
const HEAD_VERTEX = /* glsl */ `
  uniform vec3 uHead;
  uniform vec2 uViewport;
  uniform float uDiameter;
  varying vec2 vPixel;
  void main() {
    vec4 clip = projectionMatrix * viewMatrix * vec4(uHead, 1.0);
    vPixel = position.xy * uDiameter * 0.5;
    clip.xy += position.xy * uDiameter / uViewport * clip.w;
    gl_Position = clip;
  }
`;
const HEAD_FRAGMENT = /* glsl */ `
  uniform float uOpacity, uCore, uHalo, uDiameter, uFlare;
  varying vec2 vPixel;
  void main() {
    float radius = length(vPixel);
    float core = 1.0 - smoothstep(uCore * 0.43, uCore * 0.5, radius);
    float halo = exp(-1.322 * pow(radius / (uHalo * 0.5), 2.0)) * (0.30 + 0.01 * uFlare);
    // Bound the visible light itself; the compositor can expose very faint tails.
    halo *= 1.0 - smoothstep(uHalo * 0.42, uHalo * 0.5, radius);
    vec3 light = vec3(1.0) * (core + halo * (1.0 - core));
    gl_FragColor = vec4(light, uOpacity);
  }
`;

export function StoryMeteor({ layout, frozen = false }) {
  const root = useRef(null);
  const runtime = useRef(null);
  const scratch = useRef({ point: {}, pose: {}, metrics: {}, points: new Float64Array(10), journey: -1, width: 0, height: 0, range: 0 });
  const resources = useMemo(() => {
    const geometry = new BufferGeometry(), count = STORY_METEOR_SAMPLES * 2;
    const positions = new Float32Array(count * 3), normals = new Float32Array(count * 2);
    const side = new Float32Array(count), along = new Float32Array(count), indices = new Uint16Array((STORY_METEOR_SAMPLES - 1) * 6);
    for (let i = 0; i < STORY_METEOR_SAMPLES; i++) {
      side[i * 2] = -1; side[i * 2 + 1] = 1;
      along[i * 2] = along[i * 2 + 1] = i / (STORY_METEOR_SAMPLES - 1);
      if (i < STORY_METEOR_SAMPLES - 1) {
        const a = i * 2, o = i * 6;
        indices[o] = a; indices[o + 1] = a + 1; indices[o + 2] = a + 2;
        indices[o + 3] = a + 1; indices[o + 4] = a + 3; indices[o + 5] = a + 2;
      }
    }
    geometry.setAttribute('position', new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
    geometry.setAttribute('aNormal', new BufferAttribute(normals, 2).setUsage(DynamicDrawUsage));
    geometry.setAttribute('aSide', new BufferAttribute(side, 1));
    geometry.setAttribute('aAlong', new BufferAttribute(along, 1));
    geometry.setIndex(new BufferAttribute(indices, 1));
    const uniforms = () => ({ uOpacity: { value: 0 }, uViewport: { value: new Vector2(1, 1) },
      uWidth: { value: 76 }, uJourney: { value: 0 }, uWake: { value: 0 } });
    const ribbon = uniforms(), wake = uniforms();
    wake.uWake.value = 1;
    return { geometry, head: new PlaneGeometry(2, 2), screen: new Float64Array(STORY_METEOR_SAMPLES * 2), ribbon, wake,
      headUniforms: { uHead: { value: new Vector3() }, uOpacity: { value: 0 }, uViewport: { value: new Vector2(1, 1) },
        uCore: { value: 56 }, uHalo: { value: 208 }, uDiameter: { value: 332.8 }, uFlare: { value: 0 } } };
  }, []);
  useEffect(() => {
    runtime.current = resources;
    return () => { runtime.current = null; resources.geometry.dispose(); resources.head.dispose(); };
  }, [resources]);

  useFrame(({ camera, size }) => {
    const buffers = runtime.current;
    if (!buffers || !root.current) return;
    const state = useScrollStore.getState(), data = layout.current, cache = scratch.current;
    // R3F copies scalar uniform wrappers; update the live material maps.
    const wake = root.current.children[0].material.uniforms, ribbon = root.current.children[1].material.uniforms;
    const head = root.current.children[2].material.uniforms;
    const opacity = meteorVisibility(state.storyChapter, state.chapterProgress);
    root.current.visible = !frozen && !document.hidden && data?.range > 0 && opacity > 0;
    if (!root.current.visible) { cache.journey = -1; return; }
    const journey = (state.storyChapter === 'departure' ? 1 : 0) + state.chapterProgress;
    let changed = journey !== cache.journey || data.width !== cache.width || data.height !== cache.height || data.range !== cache.range;
    for (let i = 0; i < data.points.length; i++) if (data.points[i] !== cache.points[i]) changed = true;
    if (changed) {
      // CameraRig has written this pose; project against it before the render pass.
      camera.updateMatrixWorld();
      writeStoryRibbon(data, journey, buffers.geometry.attributes.position.array, buffers.geometry.attributes.aNormal.array,
        buffers.screen, camera.matrixWorldInverse.elements, camera.projectionMatrix.elements, cache.point, cache.pose, cache.metrics);
      buffers.geometry.attributes.position.needsUpdate = buffers.geometry.attributes.aNormal.needsUpdate = true;
      head.uHead.value.fromArray(buffers.geometry.attributes.position.array);
      cache.journey = journey; cache.width = data.width; cache.height = data.height; cache.range = data.range;
      cache.points.set(data.points);
    }
    const mobile = size.width < 768;
    const flare = state.storyChapter === 'experience' ? meteorFlare(data, state.chapterProgress) : 0;
    ribbon.uViewport.value.set(size.width, size.height);
    ribbon.uWidth.value = mobile ? 68 : 112;
    ribbon.uJourney.value = journey; ribbon.uOpacity.value = opacity;
    wake.uViewport.value.set(size.width, size.height);
    wake.uWidth.value = mobile ? 116 : 216;
    wake.uJourney.value = journey; wake.uOpacity.value = opacity;
    head.uViewport.value.set(size.width, size.height);
    head.uCore.value = mobile ? 34 : 56;
    head.uHalo.value = (mobile ? 116 : 208) + flare * (mobile ? 20 : 24);
    head.uDiameter.value = head.uHalo.value * 1.6;
    head.uFlare.value = flare;
    head.uOpacity.value = opacity;
    root.current.userData.journey = journey;
    root.current.userData.tailPixels = cache.metrics.tailPixels;
    root.current.userData.span = cache.metrics.span;
    root.current.userData.flare = flare;
  });

  return <group ref={root} name="story-meteor" visible={false}>
    <mesh name="story-meteor-wake" geometry={resources.geometry} frustumCulled={false} renderOrder={20}>
      <shaderMaterial vertexShader={RIBBON_VERTEX} fragmentShader={RIBBON_FRAGMENT} uniforms={resources.wake} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    <mesh name="story-meteor-trail" geometry={resources.geometry} frustumCulled={false} renderOrder={21}>
      <shaderMaterial vertexShader={RIBBON_VERTEX} fragmentShader={RIBBON_FRAGMENT} uniforms={resources.ribbon} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    <mesh name="story-meteor-head" geometry={resources.head} frustumCulled={false} renderOrder={22}>
      <shaderMaterial vertexShader={HEAD_VERTEX} fragmentShader={HEAD_FRAGMENT} uniforms={resources.headUniforms} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
  </group>;
}
