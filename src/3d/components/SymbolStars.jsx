import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, CustomBlending, DataTexture, DynamicDrawUsage, LinearFilter, OneFactor, OneMinusSrcAlphaFactor, PlaneGeometry, ShaderMaterial, SRGBColorSpace, TextureLoader, Vector2, Vector3 } from 'three';
import { useSectionAnchor } from '@/3d/hooks/useSectionAnchor';
import { bandPoints, leaveBeat, logoBeat, logoDistance, partPlacement, SDF_RANGE, U_OUT, U_RIM } from '@/3d/utils/logoReveal';
import { useSkillsStore } from '@/stores/useSkillsStore';
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
// Skills logo as an eclipse: the tile darkens the sky, a thin limb and an amber corona breathe around it.
const LOGO_EXPAND = 1.7;
const logoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const logoFragment = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D uSdf;
  uniform vec2 uHalf;
  uniform vec3 uBead;
  uniform float uSilhouette;
  uniform float uCorona;
  uniform float uFade;
  uniform float uTile;
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }
  void main() {
    vec2 p = (vUv - 0.5) * 2.0 * uHalf * ${LOGO_EXPAND.toFixed(2)};
    vec2 uv = clamp(p / (2.0 * uHalf) + 0.5, 0.0, 1.0);
    float beyond = length(max(abs(p) - uHalf, 0.0));
    float d = (texture2D(uSdf, uv).r - 0.5) * ${(2 * SDF_RANGE).toFixed(2)} + beyond;
    float aa = max(fwidth(d), 1e-4);
    float inside = 1.0 - smoothstep(-aa, aa, d);
    vec4 tex = beyond > 0.0 ? vec4(0.0) : texture2D(map, uv);
    float ink = tex.a * smoothstep(0.35, 0.6, dot(tex.rgb, vec3(0.2126, 0.7152, 0.0722))) * uTile;
    float o = max(d, 0.0);
    vec2 dir = p / max(length(p), 1e-4);
    float rays = noise(dir * 5.0 + vec2(uSeed, uTime * 0.07)) * 0.6 + noise(dir * 13.0 - vec2(uTime * 0.05, uSeed)) * 0.4;
    rays = pow(rays, 3.0) * 2.2;
    float breathe = 0.85 + 0.15 * sin(uTime * 1.3 + uSeed);
    float glow = (exp(-o * 16.0) * 0.5 + exp(-o * 4.5) * 0.1 + rays * exp(-o * 3.2) * 0.35) * breathe;
    float limb = exp(-abs(d) * 110.0);
    vec3 amber = vec3(1.0, 0.7, 0.36), warm = vec3(1.0, 0.93, 0.82);
    vec3 color = (amber * glow * (1.0 - inside) + warm * limb * 0.8) * uCorona;
    float bead = length(p - uBead.xy);
    color += uBead.z * (warm * exp(-bead * 26.0) * 1.4 + amber * exp(-bead * 7.0) * 0.45);
    float alpha = inside * uSilhouette;
    color += (vec3(0.016, 0.02, 0.03) + warm * ink * 0.5) * alpha;
    vec2 border = min(vUv, 1.0 - vUv);
    color *= smoothstep(0.0, 0.12, min(border.x, border.y));
    gl_FragColor = vec4(color, alpha) * uFade;
  }
`;
// One continuous light band: keyword, the logo's outline, then a fan to each linked ability.
const BAND_SEGMENTS = 4096;
const bandVertex = /* glsl */ `
  attribute vec3 aOther;
  attribute float aSide;
  attribute float aEnd;
  attribute float aU;
  attribute float aKind;
  uniform vec2 uResolution;
  uniform float uDpr;
  varying float vSide;
  varying float vU;
  varying float vKind;
  void main() {
    vec4 a = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 b = projectionMatrix * modelViewMatrix * vec4(aOther, 1.0);
    vec2 direction = (b.xy / b.w - a.xy / a.w) * uResolution * (1.0 - 2.0 * aEnd);
    vec2 normal = vec2(-direction.y, direction.x) / max(length(direction), 0.0001);
    a.xy += normal * aSide * 7.0 * uDpr * 2.0 / uResolution * a.w;
    gl_Position = a;
    vSide = aSide;
    vU = aU;
    vKind = aKind;
  }
`;
const bandFragment = /* glsl */ `
  uniform float uHead;
  uniform float uTail;
  uniform float uLink;
  uniform float uBridge;
  uniform float uRim;
  uniform float uPulse;
  uniform float uPulseOn;
  uniform float uFade;
  varying float vSide;
  varying float vU;
  varying float vKind;
  void main() {
    float shown = step(uTail, vU) * (1.0 - smoothstep(uHead - 0.002, uHead + 0.002, vU));
    if (shown <= 0.0) discard;
    float kind = vKind < 0.5 || vKind > 2.5 ? uLink : vKind < 1.5 ? uRim : uBridge;
    float core = exp(-vSide * vSide * 40.0), halo = exp(-vSide * vSide * 4.0);
    float lead = exp(-max(uHead - vU, 0.0) * 60.0) * step(uHead, 0.999);
    float pulse = uPulseOn * exp(-pow((vU - uPulse) / 0.015, 2.0)) * step(abs(vKind - 1.0), 0.5);
    vec3 warm = vec3(1.0, 0.94, 0.86), amber = vec3(1.0, 0.7, 0.36);
    vec3 color = warm * core * (0.85 + lead + pulse) + amber * halo * (0.22 + lead * 0.8 + pulse * 0.5);
    gl_FragColor = vec4(color * kind * shown * uFade, 1.0);
  }
`;

function createBand() {
  const count = BAND_SEGMENTS * 6, geometry = new BufferGeometry();
  const attribute = size => new BufferAttribute(new Float32Array(count * size), size).setUsage(DynamicDrawUsage);
  geometry.setAttribute('position', attribute(3));
  geometry.setAttribute('aOther', attribute(3));
  geometry.setAttribute('aU', attribute(1));
  geometry.setAttribute('aKind', attribute(1));
  const sides = new Float32Array(count), ends = new Float32Array(count);
  for (let i = 0; i < BAND_SEGMENTS; i++) { sides.set([-1, -1, 1, -1, 1, 1], i * 6); ends.set([0, 1, 1, 0, 1, 0], i * 6); }
  geometry.setAttribute('aSide', new BufferAttribute(sides, 1));
  geometry.setAttribute('aEnd', new BufferAttribute(ends, 1));
  geometry.setDrawRange(0, 0);
  const uniforms = { uResolution: { value: new Vector2(1, 1) }, uDpr: { value: 1 }, uHead: { value: 0 }, uTail: { value: 0 },
    uLink: { value: 1 }, uBridge: { value: 1 }, uRim: { value: 1 }, uPulse: { value: 0 }, uPulseOn: { value: 0 }, uFade: { value: 1 } };
  return { geometry, uniforms, points: [], target: null, route: null, phase: 0, beat: null };
}

function writeBand(band) {
  const { points, geometry } = band, position = geometry.attributes.position.array, other = geometry.attributes.aOther.array;
  const u = geometry.attributes.aU.array, kind = geometry.attributes.aKind.array, ends = geometry.attributes.aEnd.array;
  let segment = 0;
  for (let i = 1; i < points.length && segment < BAND_SEGMENTS; i++) {
    const b = points[i];
    if (b.start) continue;
    const a = points[i - 1];
    for (let j = 0; j < 6; j++) {
      const v = segment * 6 + j, end = ends[v], self = end ? b : a, far = end ? a : b;
      position.set([self.x, self.y, 0.02], v * 3); other.set([far.x, far.y, 0.02], v * 3);
      u[v] = self.u; kind[v] = b.kind;
    }
    segment++;
  }
  for (const name of ['position', 'aOther', 'aU', 'aKind']) geometry.attributes[name].needsUpdate = true;
  geometry.setDrawRange(0, segment * 6);
}

function revealLogos(data, refs, gl, time, delta, frozen) {
  const pool = data.pool, now = pool.target?.parts ? pool.target : null, away = refs.leaving.current;
  // Two bands swap roles: the one that was showing drains away while the new one is engraved.
  const activeIndex = 1 - away.band, active = data.bands[activeIndex], gone = data.bands[away.band];
  const activeMesh = refs.bandMeshes.current[activeIndex], goneMesh = refs.bandMeshes.current[away.band];
  if (!activeMesh || !goneMesh) return;
  if (now !== refs.shown.current) {
    if (refs.shown.current) Object.assign(away, { target: refs.shown.current, phase: active.phase, t: 0, beat: active.beat, band: activeIndex });
    refs.shown.current = now;
    data.bands[1 - away.band].target = null;
    return revealLogos(data, refs, gl, time, 0, frozen);
  }
  for (const band of data.bands) {
    band.uniforms.uDpr.value = gl.getPixelRatio();
    gl.getDrawingBufferSize(band.uniforms.uResolution.value);
  }
  const beat = logoBeat(frozen ? 10 : pool.elapsed);
  activeMesh.visible = Boolean(now);
  if (now) {
    const stored = useSkillsStore.getState().route, route = stored?.tool === now.id ? stored : null;
    if (active.target !== now || active.route !== route || active.phase !== pool.phase) {
      bandPoints(now, pool.phase, route, active.points);
      writeBand(active);
      Object.assign(active, { target: now, route, phase: pool.phase });
    }
    active.beat = beat;
    const u = active.uniforms;
    u.uHead.value = beat.head; u.uTail.value = 0; u.uLink.value = beat.link; u.uBridge.value = beat.bridge;
    u.uRim.value = beat.rim; u.uPulseOn.value = beat.pulse; u.uFade.value = 1;
    u.uPulse.value = U_RIM + (U_OUT - U_RIM) * (time * 0.22 % 1);
  }
  let leave = null;
  if (away.target) {
    away.t += frozen ? 10 : Math.min(delta, 0.05);
    leave = leaveBeat(away.t);
    if (leave.fade <= 0 && leave.logo <= 0) { away.target = null; leave = null; }
  }
  goneMesh.visible = Boolean(leave);
  if (leave) {
    const u = gone.uniforms, last = away.beat ?? beat;
    u.uHead.value = last.head; u.uTail.value = leave.tail * last.head; u.uLink.value = last.link; u.uBridge.value = last.bridge;
    u.uRim.value = last.rim; u.uPulseOn.value = 0; u.uFade.value = leave.fade;
  }
  for (let i = 0; i < SYMBOL_LOGOS.length; i++) {
    const mesh = refs.meshes.current[i], logo = SYMBOL_LOGOS[i], material = data.logoMaterials[i];
    const part = now ? now.parts.indexOf(logo) : -1, oldPart = leave ? away.target.parts.indexOf(logo) : -1;
    const current = part >= 0, owner = current ? now : oldPart >= 0 ? away.target : null;
    mesh.visible = Boolean(owner) && Boolean(material.uniforms.uSdf.value);
    if (!mesh.visible) continue;
    const step = current ? beat : away.beat ?? beat, band = current ? active : gone;
    const { x, y, scale } = partPlacement(owner, current ? part : oldPart, current ? pool.phase : away.phase);
    const longest = Math.max(logo.width, logo.height);
    mesh.position.set(x, y, 0.015);
    mesh.scale.set(scale * logo.width / longest * LOGO_EXPAND, scale * logo.height / longest * LOGO_EXPAND, 1);
    const u = material.uniforms, end = band.points.end;
    u.uSilhouette.value = step.silhouette; u.uCorona.value = step.corona; u.uFade.value = current ? 1 : leave.logo;
    u.uTime.value = time;
    u.uBead.value.set(end ? (end[0] - x) / scale : 0, end ? (end[1] - y) / scale : 0, current ? step.bead : 0);
  }
}

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
  const bandMeshes = useRef([]), shown = useRef(null), leaving = useRef({ target: null, phase: 0, t: 0, beat: null, band: 1 });
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
    const logoMaterials = SYMBOL_LOGOS.map((logo, i) => {
      const longest = Math.max(logo.width, logo.height);
      return new ShaderMaterial({ vertexShader: logoVertex, fragmentShader: logoFragment, transparent: true, depthWrite: false, toneMapped: false,
        blending: CustomBlending, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor,
        uniforms: { map: { value: null }, uSdf: { value: null }, uHalf: { value: new Vector2(logo.width / longest, logo.height / longest) },
          uBead: { value: new Vector3() }, uSilhouette: { value: 0 }, uCorona: { value: 0 }, uFade: { value: 1 }, uTile: { value: 0 },
          uTime: { value: 0 }, uSeed: { value: i * 7.31 } } });
    });
    const bands = [createBand(), createBand()].map(band => ({ ...band, material: new ShaderMaterial({ vertexShader: bandVertex,
      fragmentShader: bandFragment, uniforms: band.uniforms, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false }) }));
    return { pool, stars, links, halo, logoMaterials, bands, sdfs: [], plane: new PlaneGeometry(2, 2),
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
      const material = resources.logoMaterials[i], distance = logoDistance(texture.image, logo);
      const sdf = new DataTexture(distance.data, distance.width, distance.height);
      sdf.minFilter = sdf.magFilter = LinearFilter;
      sdf.needsUpdate = true;
      resources.sdfs[i] = sdf;
      material.uniforms.map.value = texture;
      material.uniforms.uSdf.value = sdf;
      material.uniforms.uTile.value = distance.tile ? 1 : 0;
    }));
    return () => {
      alive = false;
      runtime.current = null;
      textures.forEach(texture => texture.dispose());
      resources.stars.dispose(); resources.links.dispose(); resources.halo.dispose(); resources.plane.dispose();
      resources.logoMaterials.forEach(material => material.dispose());
      resources.sdfs.forEach(sdf => sdf?.dispose());
      resources.bands.forEach(band => { band.geometry.dispose(); band.material.dispose(); });
    };
  }, [resources]);

  useFrame(({ gl, clock }, delta) => {
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
      bandMeshes.current.forEach(mesh => { if (mesh) mesh.visible = false; });
      shown.current = leaving.current.target = null;
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
    revealLogos(data, { meshes, bandMeshes, shown, leaving }, gl, clock.elapsedTime, delta, frozen);
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
    {SYMBOL_LOGOS.map((logo, i) => <mesh key={logo.id} ref={mesh => { meshes.current[i] = mesh; }} name={`symbol-logo-${logo.id}`}
      geometry={resources.plane} material={resources.logoMaterials[i]} visible={false} renderOrder={4} />)}
    {resources.bands.map((band, i) => <mesh key={i} ref={mesh => { bandMeshes.current[i] = mesh; }} name={`symbol-band-${i}`}
      geometry={band.geometry} material={band.material} visible={false} frustumCulled={false} renderOrder={5} />)}
  </group></group>;
}
