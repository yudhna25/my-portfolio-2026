import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Vector4 } from 'three';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { buildFinaleSeeds, finaleState } from '@/3d/utils/finale';
import { useScrollStore } from '@/stores/useScrollStore';

const VERT = /* glsl */ `
  uniform vec4 uPhase;
  uniform float uOrigin, uPixelRatio;
  varying float vAlpha, vEdge;
  void main() {
    float p = uPhase.x, collapse = uPhase.z;
    float expansion = smoothstep(0.44, 0.70, p);
    vec3 seed = position;
    float angle = seed.x * 6.2831853 + uOrigin;
    float latitude = seed.y * 2.0 - 1.0;
    vec3 direction = vec3(cos(angle) * sqrt(1.0 - latitude * latitude),
      sin(angle) * sqrt(1.0 - latitude * latitude), latitude);
    vec4 center = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    float height = -2.0 * center.z / projectionMatrix[1][1];
    float reach = expansion * (0.35 + seed.z * 1.35);
    vec3 burst = direction * reach * height;
    // Three depth strata remain in front of the near plane, including on portrait screens.
    burst.z = direction.z * expansion * (-center.z) * 0.42;
    float turn = angle + expansion * 0.35 + collapse * (4.5 + seed.z * 3.5);
    float radius = height * 0.27 * (1.18 + seed.z * 1.35);
    vec2 disk = vec2(cos(turn), sin(turn) * 0.18) * radius;
    disk = mat2(0.573576, 0.819152, -0.819152, 0.573576) * disk;
    vec3 orbit = vec3(disk, sin(turn) * radius * 0.20);
    vec3 offset = mix(burst, orbit, collapse);
    vec4 view = center + vec4(offset, 0.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp((1.1 + seed.z * 2.3) * (-center.z / -view.z) * uPixelRatio, 1.0, 9.0);
    vAlpha = smoothstep(0.44, 0.475, p) * (1.0 - smoothstep(0.84, 0.96, p))
      * (0.15 + seed.z * 0.65) * (0.65 + 0.35 * (1.0 - abs(latitude)));
    vEdge = smoothstep(0.68, 0.98, seed.z) * (1.0 - collapse);
  }
`;
const FRAG = /* glsl */ `
  varying float vAlpha, vEdge;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float light = pow(1.0 - smoothstep(0.04, 0.5, r), 2.0);
    gl_FragColor = vec4(mix(vec3(1.0), vec3(0.53, 0.83, 0.90), vEdge * 0.65), light * vAlpha);
  }
`;

export function FinaleParticles({ quality = 'high', reduced = false }) {
  const mesh = useRef(null);
  const phase = useRef({});
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(buildFinaleSeeds(quality === 'low' ? 800 : quality === 'medium' ? 1600 : 2600), 3));
    return result;
  }, [quality]);
  const uniforms = useMemo(() => ({ uPhase: { value: new Vector4() }, uOrigin: { value: 0 }, uPixelRatio: { value: 1 } }), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ gl }) => {
    const state = useScrollStore.getState(), p = state.chapterProgress;
    if (!mesh.current) return;
    mesh.current.visible = !reduced && state.storyChapter === 'finale' && p > 0.44 && p < 0.96;
    if (!mesh.current.visible) return;
    const authored = finaleState(p, phase.current), values = mesh.current.material.uniforms;
    values.uPhase.value.set(p, authored.cloud, authored.collapse, authored.flare);
    values.uOrigin.value = state.worksOrbit.origin;
    values.uPixelRatio.value = gl.getPixelRatio();
  });
  return <points ref={mesh} name="finale-particles" position={BLACK_HOLE_CENTER} geometry={geometry} frustumCulled={false} renderOrder={5}>
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
  </points>;
}
