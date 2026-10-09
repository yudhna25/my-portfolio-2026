import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DynamicDrawUsage } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import {
  advanceShootingStars,
  createShootingStars,
  clearShootingStars,
  ambientMeteorVisibility,
  METEOR_COUNT,
  METEOR_SAMPLES,
} from '@/3d/utils/shootingStars';

const VERTEX = /* glsl */ `
  attribute float aAlpha;
  uniform float uPixelRatio, uVisibility;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha * uVisibility;
    gl_PointSize = uPixelRatio * (1.2 + aAlpha * 1.8);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying float vAlpha;
  void main() {
    float core = 1.0 - smoothstep(0.08, 0.5, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vec3(1.0), vAlpha * core);
  }
`;

export function ShootingStars({ frozen = false, story = false }) {
  const root = useRef(null);
  const pool = useMemo(() => createShootingStars(), []);
  const uniforms = useMemo(() => ({ uPixelRatio: { value: 1 }, uVisibility: { value: 1 } }), []);

  const totalPoints = METEOR_COUNT * METEOR_SAMPLES;
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute(
      'position',
      new BufferAttribute(new Float32Array(totalPoints * 3), 3).setUsage(DynamicDrawUsage)
    );
    result.setAttribute(
      'aAlpha',
      new BufferAttribute(new Float32Array(totalPoints), 1).setUsage(DynamicDrawUsage)
    );
    return result;
  }, [totalPoints]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, gl, size }, delta) => {
    const active = root.current;
    if (!active) return;
    const { storyChapter: chapter, chapterProgress: p } = useScrollStore.getState();
    const opacity = !story ? 1 : ambientMeteorVisibility(chapter, p);
    active.visible = !frozen && opacity > 0;
    active.material.uniforms.uVisibility.value = opacity;
    if (!active.visible) { clearShootingStars(pool); return; }

    const height = 2 * Math.tan((camera.fov * Math.PI) / 360) * 12;
    active.position.copy(camera.position);
    active.quaternion.copy(camera.quaternion);
    active.translateZ(-12);
    active.scale.setScalar(height);

    const { position, aAlpha } = active.geometry.attributes;
    advanceShootingStars(pool, delta, size.width / size.height, position.array, aAlpha.array, Math.random, opacity === 1);
    position.needsUpdate = true;
    aAlpha.needsUpdate = true;
    active.material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  });

  return (
    <points ref={root} name="shooting-stars" geometry={geometry} frustumCulled={false} renderOrder={20}>
      <shaderMaterial
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

export default ShootingStars;
