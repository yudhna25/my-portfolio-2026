import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector2, Vector3 } from 'three';
import { useSectionAnchor } from '@/3d/hooks/useSectionAnchor';
import { advanceSymbolPool, createSymbolPool, resetSymbolPool, setSymbolTarget, SYMBOL_LOGOS, SYMBOL_POOL_COUNT, SYMBOL_TARGETS } from '@/3d/utils/symbolMorph';

const urls = import.meta.glob('../../../outputs/redesign/r0.2/logos/mono/*', { eager: true, query: '?url', import: 'default' });
const vertex = /* glsl */ `
  attribute float aSize;
  attribute float aWeight;
  uniform float uDpr;
  uniform float uFormation;
  uniform float uLogo;
  uniform float uEducation;
  varying float vAlpha;
  varying float vEducation;
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vEducation = uEducation * uFormation;
    gl_PointSize = mix(1.2, aSize, uFormation) * uDpr * mix(1.0, 3.0, vEducation);
    vAlpha = mix(0.22, aWeight * (1.0 - uLogo * 0.65), uFormation);
  }
`;
const fragment = /* glsl */ `
  varying float vAlpha;
  varying float vEducation;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = 1.0 - smoothstep(0.12, 0.5, r);
    float glow = min(1.0, exp(-r * r * 110.0) + 0.22 * exp(-r * r * 16.0)) * (1.0 - smoothstep(0.42, 0.5, r));
    gl_FragColor = vec4(vec3(1.0), mix(a * a, glow, vEducation) * vAlpha);
  }
`;
const glowVertex = /* glsl */ `
  attribute vec3 aOther;
  attribute float aSide;
  attribute float aEnd;
  uniform vec2 uResolution;
  uniform float uDpr;
  varying float vSide;
  void main() {
    vec4 a = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 b = projectionMatrix * modelViewMatrix * vec4(aOther, 1.0);
    vec2 direction = (b.xy / b.w - a.xy / a.w) * uResolution * (1.0 - 2.0 * aEnd);
    vec2 normal = vec2(-direction.y, direction.x) / max(length(direction), 0.0001);
    a.xy += normal * aSide * 5.0 * uDpr * 2.0 / uResolution * a.w;
    gl_Position = a;
    vSide = aSide;
  }
`;
const glowFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vSide;
  void main() {
    float alpha = (0.15 * (1.0 - smoothstep(0.02, 0.16, abs(vSide))) + 0.2 * exp(-vSide * vSide * 6.0));
    gl_FragColor = vec4(vec3(1.0), alpha * uOpacity);
  }
`;

// V4 baked its projective calibration into the SVG. Its plane stays in the stars' billboard basis.
export function EducationArtwork({ id, anchor, active = false, enabled = true, frozen = false }) {
  const target = SYMBOL_TARGETS[id], root = useSectionAnchor(anchor, target.radius, true), mesh = useRef(null);
  const { artwork } = target;
  const geometry = useMemo(() => new PlaneGeometry(artwork.plane.width, artwork.plane.height), [artwork]);
  const observer = useMemo(() => new Vector3(), []);
  useEffect(() => {
    let alive = true;
    const element = anchor.current;
    const texture = new TextureLoader().load(import.meta.env.BASE_URL + artwork.url.replace(/^\//, ''), loaded => {
      if (!alive) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
      if (mesh.current) { mesh.current.material.map = loaded; mesh.current.material.needsUpdate = true; }
      if (element) element.dataset.educationArtStatus = 'loaded';
    }, undefined, () => { if (alive && element) element.dataset.educationArtStatus = 'failed'; });
    return () => { alive = false; texture.dispose(); geometry.dispose(); };
  }, [anchor, artwork, geometry]);
  useFrame(({ camera }, delta) => {
    if (!mesh.current || !root.current) return;
    mesh.current.visible = enabled && root.current.visible && Boolean(mesh.current.material.map?.image);
    if (!mesh.current.visible) return;
    // Behind-plane depth otherwise shifts off-center anchors in perspective; stay on each star's observer ray.
    root.current.worldToLocal(observer.copy(camera.position));
    const depth = 1 - artwork.plane.localZ / observer.z;
    mesh.current.position.set(observer.x + (artwork.plane.center[0] - observer.x) * depth,
      observer.y + (artwork.plane.center[1] - observer.y) * depth, artwork.plane.localZ);
    mesh.current.scale.set(depth, depth, 1);
    const goal = active ? .3 : .1;
    mesh.current.material.opacity = frozen ? goal : mesh.current.material.opacity
      + (goal - mesh.current.material.opacity) * (1 - Math.exp(-12 * Math.min(delta, .05)));
  });
  return <group ref={root} name={'education-art-anchor-' + id}>
    <mesh ref={mesh} name={'education-art-' + id} geometry={geometry} frustumCulled={false}
      position={[artwork.plane.center[0], artwork.plane.center[1], artwork.plane.localZ]}>
      <meshBasicMaterial transparent opacity={.1} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>;
}

// Controlled primitive: the DOM consumer owns selection, not a second scene controller.
export function SymbolStars({ anchor, target = null, active = true, frozen = false, educationId = null }) {
  const root = useSectionAnchor(anchor, SYMBOL_TARGETS[educationId ?? target]?.radius ?? 1, true);
  const stage = useRef(null);
  const points = useRef(null), lines = useRef(null), glow = useRef(null), meshes = useRef([]), runtime = useRef(null);
  const resources = useMemo(() => {
    const pool = createSymbolPool();
    const stars = new BufferGeometry();
    stars.setAttribute('position', new BufferAttribute(pool.positions, 3).setUsage(DynamicDrawUsage));
    stars.setAttribute('aWeight', new BufferAttribute(pool.weights, 1).setUsage(DynamicDrawUsage));
    stars.setAttribute('aSize', new BufferAttribute(pool.sizes, 1).setUsage(DynamicDrawUsage));
    const links = new BufferGeometry();
    links.setAttribute('position', new BufferAttribute(new Float32Array(SYMBOL_POOL_COUNT * 12), 3).setUsage(DynamicDrawUsage));
    links.setDrawRange(0, 0);
    const halo = new BufferGeometry(), count = SYMBOL_POOL_COUNT * 6;
    halo.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage));
    halo.setAttribute('aOther', new BufferAttribute(new Float32Array(count * 3), 3).setUsage(DynamicDrawUsage));
    const sides = new Float32Array(count), ends = new Float32Array(count);
    for (let i = 0; i < SYMBOL_POOL_COUNT; i++) {
      sides.set([-1, -1, 1, -1, 1, 1], i * 6); ends.set([0, 1, 1, 0, 1, 0], i * 6);
    }
    halo.setAttribute('aSide', new BufferAttribute(sides, 1)); halo.setAttribute('aEnd', new BufferAttribute(ends, 1)); halo.setDrawRange(0, 0);
    return { pool, stars, links, halo, plane: new PlaneGeometry(2, 2),
      glowUniforms: { uDpr: { value: 1 }, uOpacity: { value: 0 }, uResolution: { value: new Vector2(1, 1) } },
      uniforms: { uDpr: { value: 1 }, uFormation: { value: 0 }, uLogo: { value: 0 }, uEducation: { value: 0 } } };
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
      resources.stars.dispose(); resources.links.dispose(); resources.halo.dispose(); resources.plane.dispose();
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
      glow.current.visible = false;
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
    const education = Boolean(pool.target?.artwork);
    points.current.material.uniforms.uEducation.value = education ? 1 : 0;
    points.current.renderOrder = education ? 3 : 0;
    lines.current.renderOrder = education ? 2 : 0;
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
        if (education) {
          for (let i = 0; i < edges.length; i++) for (let j = 0; j < 6; j++) {
            const end = data.halo.attributes.aEnd.array[i * 6 + j], index = edges[i][end] * 3, other = edges[i][1 - end] * 3, out = (i * 6 + j) * 3;
            for (let axis = 0; axis < 3; axis++) {
              data.halo.attributes.position.array[out + axis] = pool.positions[index + axis];
              data.halo.attributes.aOther.array[out + axis] = pool.positions[other + axis];
            }
          }
          data.halo.attributes.position.needsUpdate = data.halo.attributes.aOther.needsUpdate = true;
          data.halo.setDrawRange(0, edges.length * 6);
        }
      }
      data.links.setDrawRange(0, edges.length * 2);
    } else data.links.setDrawRange(0, 0);
    lines.current.material.opacity = pool.lines * (education ? .55 : .12) * (1 - pool.logo * .65);
    glow.current.visible = education && pool.lines > 0;
    data.glowUniforms.uOpacity.value = pool.lines;
    data.glowUniforms.uDpr.value = gl.getPixelRatio();
    gl.getDrawingBufferSize(data.glowUniforms.uResolution.value);
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
    <mesh ref={glow} name="education-link-glow" geometry={resources.halo} visible={false} frustumCulled={false} renderOrder={1}>
      <shaderMaterial vertexShader={glowVertex} fragmentShader={glowFragment} uniforms={resources.glowUniforms} transparent depthWrite={false} />
    </mesh>
    {SYMBOL_LOGOS.map((logo, i) => <mesh key={logo.id} ref={mesh => { meshes.current[i] = mesh; }} name={`symbol-logo-${logo.id}`} geometry={resources.plane} visible={false}>
      <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
    </mesh>)}
  </group></group>;
}
