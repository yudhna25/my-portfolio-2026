import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, PlaneGeometry, SRGBColorSpace, TextureLoader } from 'three';
import { useSectionAnchor } from '@/3d/hooks/useSectionAnchor';
import { advanceSymbolPool, createSymbolPool, resetSymbolPool, setSymbolTarget, SYMBOL_LOGOS, SYMBOL_POOL_COUNT } from '@/3d/utils/symbolMorph';

const urls = import.meta.glob('../../../outputs/redesign/r0.2/logos/mono/*', { eager: true, query: '?url', import: 'default' });
const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aWeight;
  uniform float uDpr;
  uniform float uFormation;
  uniform float uLogo;
  varying float vAlpha;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = mix(1.2, aSize, uFormation) * uDpr;
    vAlpha = mix(0.22, aWeight * (1.0 - uLogo * 0.65), uFormation);
  }
`;
const fragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    float a = 1.0 - smoothstep(0.12, 0.5, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vec3(1.0), a * a * vAlpha);
  }
`;

// Controlled primitive: the DOM consumer owns selection, not a second scene controller.
export function SymbolStars({ anchor, target = null, active = true, frozen = false }) {
  const root = useSectionAnchor(anchor, 1, true);
  const stage = useRef(null);
  const points = useRef(null), lines = useRef(null), meshes = useRef([]), runtime = useRef(null);
  const resources = useMemo(() => {
    const pool = createSymbolPool();
    const stars = new BufferGeometry();
    stars.setAttribute('position', new BufferAttribute(pool.positions, 3).setUsage(DynamicDrawUsage));
    stars.setAttribute('aWeight', new BufferAttribute(pool.weights, 1).setUsage(DynamicDrawUsage));
    stars.setAttribute('aSize', new BufferAttribute(pool.sizes, 1).setUsage(DynamicDrawUsage));
    const links = new BufferGeometry();
    links.setAttribute('position', new BufferAttribute(new Float32Array(SYMBOL_POOL_COUNT * 12), 3).setUsage(DynamicDrawUsage));
    links.setDrawRange(0, 0);
    return { pool, stars, links, plane: new PlaneGeometry(2, 2),
      uniforms: { uDpr: { value: 1 }, uFormation: { value: 0 }, uLogo: { value: 0 } } };
  }, []);

  useEffect(() => {
    runtime.current = resources;
    const loader = new TextureLoader();
    let alive = true;
    const textures = SYMBOL_LOGOS.map((logo, i) => loader.load(urls[`../../../${logo.path}`], texture => {
      if (!alive) { texture.dispose(); return; }
      texture.colorSpace = SRGBColorSpace;
      const mesh = meshes.current[i];
      if (mesh) { mesh.material.map = texture; mesh.material.needsUpdate = true; }
    }));
    return () => {
      alive = false;
      runtime.current = null;
      textures.forEach(texture => texture.dispose());
      resources.stars.dispose(); resources.links.dispose(); resources.plane.dispose();
    };
  }, [resources]);

  useFrame(({ gl }, delta) => {
    const data = runtime.current;
    if (!data || !root.current || !points.current || !lines.current) return;
    const pool = data.pool;
    if (!active || !root.current.visible) {
      if (!pool.settled || pool.target) {
        resetSymbolPool(pool);
        data.stars.attributes.position.needsUpdate = true;
      }
      stage.current.visible = false;
      data.links.setDrawRange(0, 0);
      for (let i = 0; i < meshes.current.length; i++) meshes.current[i].visible = false;
      return;
    }
    stage.current.visible = true;
    const changed = setSymbolTarget(pool, target);
    if (changed) {
      data.stars.attributes.aWeight.needsUpdate = true;
      data.stars.attributes.aSize.needsUpdate = true;
    }
    const moving = advanceSymbolPool(pool, delta, frozen);
    if (moving || changed) data.stars.attributes.position.needsUpdate = true;
    points.current.material.uniforms.uDpr.value = gl.getPixelRatio();
    points.current.material.uniforms.uFormation.value = pool.formation;
    points.current.material.uniforms.uLogo.value = pool.logo;
    const edges = pool.target?.edges;
    if (edges && pool.lines > 0) {
      if (moving || changed) {
        const buffer = data.links.attributes.position.array;
        for (let i = 0; i < edges.length; i++) {
          for (let end = 0; end < 2; end++) {
            const index = edges[i][end] * 3, out = (i * 2 + end) * 3;
            buffer[out] = pool.positions[index]; buffer[out + 1] = pool.positions[index + 1]; buffer[out + 2] = pool.positions[index + 2];
          }
        }
        data.links.attributes.position.needsUpdate = true;
      }
      data.links.setDrawRange(0, edges.length * 2);
    } else data.links.setDrawRange(0, 0);
    lines.current.material.opacity = pool.lines * 0.12 * (1 - pool.logo * 0.65);
    for (let i = 0; i < SYMBOL_LOGOS.length; i++) {
      const mesh = meshes.current[i], logo = SYMBOL_LOGOS[i];
      const part = pool.target?.parts?.indexOf(logo) ?? -1;
      mesh.visible = part >= 0 && pool.logo > 0 && Boolean(mesh.material.map?.image);
      if (!mesh.visible) continue;
      const ai = pool.target.id === 'ai', scale = ai ? 0.42 : 0.9;
      const angle = pool.phase + part * Math.PI * 2 / 3;
      mesh.position.set(ai ? Math.cos(angle) * 0.68 : 0, ai ? Math.sin(angle) * 0.68 : 0, 0.015);
      mesh.scale.set(scale * logo.width / Math.max(logo.width, logo.height), scale * logo.height / Math.max(logo.width, logo.height), 1);
      mesh.material.opacity = pool.logo;
    }
  });

  return <group ref={stage} name="symbol-stars" userData={{ pool: resources.pool }}><group ref={root} name="symbol-anchor">
    <points ref={points} name="symbol-pool" geometry={resources.stars} frustumCulled={false}>
      <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={resources.uniforms} transparent depthWrite={false} />
    </points>
    <lineSegments ref={lines} name="symbol-links" geometry={resources.links} frustumCulled={false}>
      <lineBasicMaterial color="white" transparent opacity={0} depthWrite={false} />
    </lineSegments>
    {SYMBOL_LOGOS.map((logo, i) => <mesh key={logo.id} ref={mesh => { meshes.current[i] = mesh; }} name={`symbol-logo-${logo.id}`} geometry={resources.plane} visible={false}>
      <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
    </mesh>)}
  </group></group>;
}
