import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DynamicDrawUsage } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { meteorVisibility, STORY_METEOR_SAMPLES, writeStoryMeteor } from '@/3d/utils/storyMeteor';

const VERTEX = /* glsl */ `
  attribute float aFade;
  uniform float uPixelRatio, uSize;
  varying float vFade;
  void main() {
    vFade = aFade;
    gl_PointSize = uPixelRatio * uSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying float vFade;
  void main() { gl_FragColor = vec4(vec3(1.0), vFade * uOpacity); }
`;
const HEAD = /* glsl */ `
  uniform float uOpacity;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vec3(1.0), (1.0 - smoothstep(0.10, 0.5, d)) * vFade * uOpacity);
  }
`;

export function StoryMeteor({ layout, frozen = false }) {
  const root = useRef(null);
  const scratch = useRef({ point: {}, pose: {} });
  const resources = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(STORY_METEOR_SAMPLES * 3), 3).setUsage(DynamicDrawUsage));
    geometry.setAttribute('aFade', new BufferAttribute(Float32Array.from({ length: STORY_METEOR_SAMPLES }, (_, i) => (1 - i / (STORY_METEOR_SAMPLES - 1)) ** 1.8), 1));
    const head = new BufferGeometry();
    head.setAttribute('position', new BufferAttribute(new Float32Array(3), 3).setUsage(DynamicDrawUsage));
    head.setAttribute('aFade', new BufferAttribute(new Float32Array([1]), 1));
    return { geometry, head, uniforms: { uOpacity: { value: 0 }, uPixelRatio: { value: 1 }, uSize: { value: 5 } } };
  }, []);
  useEffect(() => () => { resources.geometry.dispose(); resources.head.dispose(); }, [resources]);

  useFrame(({ gl }) => {
    const state = useScrollStore.getState();
    const data = layout.current;
    const opacity = meteorVisibility(state.storyChapter, state.chapterProgress);
    root.current.visible = !frozen && !document.hidden && data?.range > 0 && opacity > 0;
    if (!root.current.visible) return;
    const journey = (state.storyChapter === 'departure' ? 1 : 0) + state.chapterProgress;
    const geometry = root.current.children[0].geometry, head = root.current.children[1].geometry;
    const uniforms = root.current.children[0].material.uniforms;
    writeStoryMeteor(data, journey, geometry.attributes.position.array, scratch.current.point, scratch.current.pose);
    for (let i = 0; i < 3; i++) head.attributes.position.array[i] = geometry.attributes.position.array[i];
    geometry.attributes.position.needsUpdate = head.attributes.position.needsUpdate = true;
    uniforms.uOpacity.value = opacity;
    uniforms.uPixelRatio.value = gl.getPixelRatio();
    // R3F owns separate uniform maps for the two shader materials.
    root.current.children[1].material.uniforms.uOpacity.value = opacity;
    root.current.children[1].material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return <group ref={root} name="story-meteor" visible={false}>
    <line name="story-meteor-trail" geometry={resources.geometry} frustumCulled={false} renderOrder={21}>
      <shaderMaterial vertexShader={VERTEX} fragmentShader={FRAGMENT} uniforms={resources.uniforms} transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </line>
    <points name="story-meteor-head" geometry={resources.head} frustumCulled={false} renderOrder={22}>
      <shaderMaterial vertexShader={VERTEX} fragmentShader={HEAD} uniforms={resources.uniforms} transparent depthWrite={false} depthTest={false} toneMapped={false} />
    </points>
  </group>;
}
