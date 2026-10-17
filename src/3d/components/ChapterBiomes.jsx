import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { BLACK_HOLE_CENTER, storyCameraPath } from '@/3d/utils/cameraPath';
import { biomeWeights } from '@/3d/utils/chapterWave';

// One region of sky per reading chapter, all on the same continuous flight: About drifts
// through a stellar nursery, Skills passes a ringed world and its moons, Education sits
// inside an observatory's celestial grid, Experience flies along a spiral arm. Each is a
// world-placed cloud of gas puffs and stars, so the camera's drift gives real parallax.
// The BH stays the far landmark: every region is composed away from it.

const VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind (0 gas, 1 star), seed, orbit radius
  attribute vec2 aOrbit; // angular speed, phase
  uniform float uPixelRatio, uTime, uWeight, uFade, uProjection, uGain;
  uniform vec3 uRingU, uRingV, uRingCenter;
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  void main() {
    vec3 world = position;
    if (aShape.w > 0.0) {
      // Keplerian orbit in the ring plane: inner material turns faster.
      float angle = aOrbit.y + uTime * aOrbit.x;
      world = uRingCenter + (uRingU * cos(angle) + uRingV * sin(angle)) * aShape.w + position;
    }
    vec4 view = viewMatrix * vec4(world, 1.0);
    float depth = -view.z;
    gl_Position = projectionMatrix * view;
    float gas = 1.0 - aShape.y;
    float pixels = aShape.x * uPixelRatio * uProjection / max(depth, 1.0);
    gl_PointSize = clamp(pixels, 1.0, mix(6.0, 150.0, gas) * uPixelRatio);
    vColor = aColor;
    vKind = aShape.y;
    vSeed = aShape.z;
    float twinkle = mix(1.0, 0.75 + 0.25 * sin(uTime * (0.6 + aShape.z * 1.4) + aShape.z * 50.0), aShape.y);
    // Gas fades as it nears the lens instead of filling the frame; faint far puffs drop out.
    float nearFade = smoothstep(4.0, 14.0, depth);
    vAlpha = uGain * uWeight * uFade * twinkle * nearFade * step(0.0, depth) * min(1.0, pixels);
  }
`;
const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a;
    if (vKind > 0.5) {
      a = pow(1.0 - smoothstep(0.0, 0.5, d), 2.6);
    } else {
      // Gas puff: a soft, slightly offset core so overlapping puffs read as billows.
      vec2 skew = c + 0.08 * vec2(sin(vSeed * 40.0), cos(vSeed * 57.0));
      a = exp(-dot(skew, skew) * 14.0) * 0.15;
    }
    a *= vAlpha;
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const GRID_VERT = /* glsl */ `
  varying float vDepthFade;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vDepthFade = smoothstep(0.0, 30.0, -view.z);
    gl_Position = projectionMatrix * view;
  }
`;
const GRID_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vDepthFade;
  void main() { gl_FragColor = vec4(uColor, uOpacity * vDepthFade); }
`;

const HAZE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.999, 1.0); }
`;
const HAZE_FRAG = /* glsl */ `
  uniform vec3 uTint[4];
  uniform vec2 uFocus[4];
  uniform float uWeight[4];
  varying vec2 vUv;
  void main() {
    vec3 color = vec3(0.0);
    for (int i = 0; i < 4; i++) {
      float glow = 1.0 - smoothstep(0.0, 1.15, distance(vUv, uFocus[i]));
      color += uTint[i] * glow * glow * uWeight[i];
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;

// The ringed world's body: banded, lit by the BH's disk, with a thin atmospheric rim.
const PLANET_VERT = /* glsl */ `
  varying vec3 vNormal, vLocal, vView;
  void main() {
    vLocal = position;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
const PLANET_FRAG = /* glsl */ `
  uniform vec3 uLight;
  uniform float uWeight;
  varying vec3 vNormal, vLocal, vView;
  void main() {
    vec3 n = normalize(vNormal);
    // Lit from the BH's side, biased away from the viewer so the world reads as a crescent.
    vec3 light = normalize(uLight - vView * 0.9);
    float lit = 0.03 + 0.9 * smoothstep(-0.05, 0.5, dot(n, light));
    float band = 0.5 + 0.5 * sin(vLocal.y * 4.2 + sin(vLocal.x * 1.3 + vLocal.z) * 0.6);
    band = 0.65 * band + 0.35 * (0.5 + 0.5 * sin(vLocal.y * 11.0));
    vec3 surface = mix(vec3(0.06, 0.06, 0.09), vec3(0.22, 0.20, 0.18), band) * lit;
    float rim = pow(1.0 - max(dot(n, vView), 0.0), 3.0);
    vec3 color = surface + vec3(0.30, 0.40, 0.70) * rim * (0.25 + 0.75 * lit);
    gl_FragColor = vec4(color, uWeight);
  }
`;

const COUNTS = { high: 1, medium: 0.6, low: 0.3 };

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Camera basis at a chapter's mid pose: where to put a region so it frames away from the BH.
function chapterBasis(chapter, progress = 0.5) {
  const pose = storyCameraPath(chapter, progress, {}, false, 16 / 9);
  const eye = new Vector3(pose.x, pose.y, pose.z);
  const forward = new Vector3(pose.lookX, pose.lookY, pose.lookZ).sub(eye).normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const up = new Vector3().crossVectors(right, forward).normalize();
  // A point in front of the camera: d ahead, x right, y up (world units).
  const at = (d, x = 0, y = 0) => eye.clone().addScaledVector(forward, d).addScaledVector(right, x).addScaledVector(up, y);
  return { eye, forward, right, up, at };
}

function createCloud() {
  const data = { position: [], color: [], shape: [], orbit: [] };
  const color = new Color();
  data.push = (p, hex, size, kind, seed, orbitRadius = 0, speed = 0, phase = 0) => {
    data.position.push(p.x, p.y, p.z);
    color.set(hex);
    data.color.push(color.r, color.g, color.b);
    data.shape.push(size, kind, seed, orbitRadius);
    data.orbit.push(speed, phase);
  };
  data.build = () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(data.position), 3));
    geometry.setAttribute('aColor', new BufferAttribute(new Float32Array(data.color), 3));
    geometry.setAttribute('aShape', new BufferAttribute(new Float32Array(data.shape), 4));
    geometry.setAttribute('aOrbit', new BufferAttribute(new Float32Array(data.orbit), 2));
    return geometry;
  };
  return data;
}

const gaussian = rand => (rand() + rand() + rand() - 1.5) / 1.5;

// About: three dark dust pillars silhouetted against a glowing emission nebula, their
// ionised rims lit amber-rose and hot young stars breaking out at their tips.
function buildNursery(scale) {
  const rand = random(301), glow = createCloud(), dust = createCloud(), rim = createCloud(), basis = chapterBasis('about');
  const point = new Vector3();
  // The emission region behind the pillars, brightest low and to the right.
  for (let i = 0; i < 260 * scale; i++) {
    const x = -6 + rand() * 52, y = -36 + Math.pow(rand(), 1.4) * 40;
    point.copy(basis.at(74 + rand() * 16, x, y));
    glow.push(point, ['#6A3A48', '#7A4E3C', '#2E4060', '#5A3050'][Math.floor(rand() * 4)], 7 + rand() * 7, 0, rand());
  }
  const pillars = [[14, -36, 6.5, 30, -0.08], [28, -35, 4.6, 22, 0.06], [2, -34, 4, 16, -0.16]];
  for (const [x, y, width, height, lean] of pillars) {
    const base = basis.at(56 + rand() * 4, x, y);
    for (let i = 0; i < 300 * scale; i++) {
      const t = Math.pow(rand(), 0.9), radius = width * (1 - 0.62 * t) * (0.25 + 0.75 * Math.abs(gaussian(rand)));
      const angle = rand() * Math.PI * 2;
      point.copy(base).addScaledVector(basis.up, t * height).addScaledVector(basis.right, lean * t * height + Math.cos(angle) * radius)
        .addScaledVector(basis.forward, Math.sin(angle) * radius);
      if (radius > width * (0.5 - 0.15 * t)) rim.push(point, rand() < 0.5 ? '#9A6048' : '#86486A', 1.1 + rand() * 1.4, 0, rand());
      else dust.push(point, '#050407', 3.4 + rand() * 3.4, 0, rand());
    }
    const tip = base.clone().addScaledVector(basis.up, height).addScaledVector(basis.right, lean * height);
    for (let i = 0; i < 18 * scale; i++) {
      point.copy(tip).add(new Vector3(gaussian(rand), gaussian(rand), gaussian(rand)).multiplyScalar(5));
      rim.push(point, rand() < 0.7 ? '#CFE0FF' : '#FFFFFF', 0.10 + rand() * 0.16, 1, rand());
    }
  }
  // A thin veil through the whole frame.
  for (let i = 0; i < 90 * scale; i++) {
    point.copy(basis.at(36 + rand() * 50, (rand() - 0.4) * 90, -34 + Math.pow(rand(), 1.6) * 50));
    glow.push(point, ['#3E2A44', '#4E3036', '#232B44'][Math.floor(rand() * 3)], 5 + rand() * 6, 0, rand());
  }
  return { glow: glow.build(), dust: dust.build(), rim: rim.build() };
}

// Skills: a ringed world low in the left of the frame, its ring turning with real shear.
function buildPlanetary(scale) {
  const rand = random(733), cloud = createCloud(), basis = chapterBasis('skills');
  const center = basis.at(62, -9, -13);
  const tilt = 0.52;
  const u = basis.right.clone().applyAxisAngle(basis.forward, 0.22);
  const v = basis.forward.clone().multiplyScalar(-Math.cos(tilt)).addScaledVector(basis.up, Math.sin(tilt)).normalize();
  const zero = new Vector3();
  for (let i = 0; i < 3200 * scale; i++) {
    let radius = 9 + rand() * 12;
    // A Cassini-like gap and a faint outer ring.
    if (radius > 15.2 && radius < 16.2) radius += 1.2;
    const offset = new Vector3().addScaledVector(basis.up, gaussian(rand) * 0.12);
    const bright = radius < 15.2;
    cloud.push(offset, bright ? (rand() < 0.5 ? '#CDBEA2' : '#A3B5D6') : '#5E6C92', 0.16 + rand() * 0.16, 1, rand(),
      radius, 0.6 * Math.pow(9 / radius, 1.5), rand() * Math.PI * 2);
  }
  // Four moons on wide orbits, and a glow of ring dust.
  for (let i = 0; i < 4; i++) cloud.push(zero, '#F3EEE2', 0.38 + rand() * 0.2, 1, rand(), 28 + i * 7, 0.18 / (1 + i * 0.6), rand() * 6.28);
  for (let i = 0; i < 40 * scale; i++) cloud.push(zero, '#26304C', 2 + rand() * 2, 0, rand(), 10 + rand() * 11, 0.4, rand() * 6.28);
  return { geometry: cloud.build(), center, u, v };
}

// Education: inside an observatory's celestial sphere (right ascension and declination).
function buildObservatoryGrid() {
  const basis = chapterBasis('education');
  const center = basis.eye.clone();
  const radius = 70, points = [];
  const add = (a, b) => points.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const at = (ra, dec) => new Vector3(Math.cos(dec) * Math.cos(ra), Math.sin(dec), Math.cos(dec) * Math.sin(ra)).multiplyScalar(radius).add(center);
  const segments = 96;
  for (let h = 0; h < 24; h += 2) {
    const ra = h / 24 * Math.PI * 2;
    for (let i = 0; i < segments / 2; i++) add(at(ra, -Math.PI / 2 + i / (segments / 2) * Math.PI), at(ra, -Math.PI / 2 + (i + 1) / (segments / 2) * Math.PI));
  }
  for (let d = -75; d <= 75; d += 15) {
    const dec = d * Math.PI / 180;
    for (let i = 0; i < segments; i++) add(at(i / segments * Math.PI * 2, dec), at((i + 1) / segments * Math.PI * 2, dec));
    // Hour ticks along every parallel.
    for (let h = 0; h < 24; h++) {
      const ra = h / 24 * Math.PI * 2;
      add(at(ra, dec - 0.012), at(ra, dec + 0.012));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points), 3));
  return { geometry, center };
}

function buildObservatory(scale) {
  const rand = random(919), cloud = createCloud(), basis = chapterBasis('education');
  const point = new Vector3();
  // Cold blue dust lanes and tight clusters, catalogued stars over the grid.
  for (let i = 0; i < 240 * scale; i++) {
    const t = rand();
    point.copy(basis.at(40 + rand() * 40, -50 + t * 70, -30 + t * 26 + gaussian(rand) * 7));
    cloud.push(point, rand() < 0.6 ? '#1F3C5A' : '#2A4F6E', 3.5 + rand() * 4, 0, rand());
  }
  for (let c = 0; c < 6; c++) {
    const core = basis.at(36 + rand() * 30, (rand() - 0.65) * 70, (rand() - 0.55) * 38);
    for (let i = 0; i < 40 * scale; i++) {
      point.copy(core).add(new Vector3(gaussian(rand), gaussian(rand), gaussian(rand)).multiplyScalar(2.2));
      cloud.push(point, rand() < 0.8 ? '#BFE3FF' : '#FFFFFF', 0.07 + rand() * 0.12, 1, rand());
    }
  }
  return cloud.build();
}

// Experience: a spiral arm sweeping past the camera's inward spiral, dust lanes and HII knots.
function buildArm(scale) {
  const rand = random(1201), cloud = createCloud(), basis = chapterBasis('experience', 0.4);
  const point = new Vector3();
  const along = basis.right.clone().multiplyScalar(0.85).addScaledVector(basis.forward, 0.5).normalize();
  const across = new Vector3().crossVectors(along, basis.up).normalize();
  for (let i = 0; i < 3600 * scale; i++) {
    const t = rand() * 2 - 1;
    // A gentle curve sweeping across the lower frame and away into depth.
    const curve = 10 * t * t;
    const lateral = gaussian(rand) * 9, height = gaussian(rand) * 2.6;
    point.copy(basis.at(44, -4, -22)).addScaledVector(along, t * 64).addScaledVector(across, lateral).addScaledVector(basis.up, height + curve - 4 * t);
    const lane = Math.abs(lateral) < 2.2;
    if (rand() < 0.09) cloud.push(point, lane ? '#4A2A26' : '#2C3058', 3 + rand() * 4, 0, rand());
    else if (rand() < 0.04) cloud.push(point, '#FF7FA0', 0.22 + rand() * 0.2, 1, rand());
    else cloud.push(point, rand() < 0.65 ? '#B9C9FF' : '#FFE2C2', 0.08 + rand() * 0.12, 1, rand());
  }
  return cloud.build();
}

// Tint and focus (screen uv) of each region's ambient haze: a hint of colour in the black.
const HAZE = {
  nursery: { tint: '#2A1420', focus: [0.12, 0.12] },
  planetary: { tint: '#0E1630', focus: [0.18, 0.2] },
  observatory: { tint: '#08202A', focus: [0.3, 0.85] },
  arm: { tint: '#221018', focus: [0.25, 0.1] },
};

function Planet({ ring, weights }) {
  const mesh = useRef(null);
  const uniforms = useMemo(() => ({
    uLight: { value: new Vector3(...BLACK_HOLE_CENTER).sub(ring.center).normalize() }, uWeight: { value: 0 },
  }), [ring]);
  useFrame(() => {
    if (!mesh.current) return;
    const weight = weights.current.planetary;
    mesh.current.visible = weight > 0.002;
    mesh.current.material.uniforms.uWeight.value = weight;
  });
  return <mesh ref={mesh} name="biome-planet" position={ring.center} rotation={[0.2, 0, 0.35]} renderOrder={7}>
    <sphereGeometry args={[4.6, 48, 32]} />
    <shaderMaterial uniforms={uniforms} vertexShader={PLANET_VERT} fragmentShader={PLANET_FRAG} transparent toneMapped={false} />
  </mesh>;
}

function BiomeCloud({ geometry, weightKey, ring, weights, reduced, depthTest = false, dark = false, order = 8 }) {
  const points = useRef(null);
  const uniforms = useMemo(() => ({
    uPixelRatio: { value: 1 }, uTime: { value: 0 }, uWeight: { value: 0 }, uFade: { value: 1 }, uProjection: { value: 700 }, uGain: { value: dark ? 3 : 1 },
    uRingU: { value: ring?.u ?? new Vector3(1, 0, 0) }, uRingV: { value: ring?.v ?? new Vector3(0, 0, 1) },
    uRingCenter: { value: ring?.center ?? new Vector3() },
  }), [ring, dark]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ gl, camera, size }, delta) => {
    if (!points.current) return;
    const values = points.current.material.uniforms;
    // CSS px per world unit at unit depth, so sizes are physical.
    values.uProjection.value = size.height / (2 * Math.tan(camera.fov * Math.PI / 360));
    const weight = weights.current[weightKey];
    points.current.visible = weight > 0.002;
    if (!points.current.visible) return;
    values.uWeight.value = weight;
    values.uPixelRatio.value = gl.getPixelRatio();
    if (!reduced) values.uTime.value += Math.min(delta, 0.1);
  });
  // Dark dust is drawn with normal blending, so it occludes the glow behind it.
  return <points ref={points} name={`biome-${weightKey}${dark ? '-dust' : ''}`} geometry={geometry} frustumCulled={false} renderOrder={order}>
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={depthTest} depthWrite={false} toneMapped={false}
      blending={dark ? NormalBlending : AdditiveBlending} />
  </points>;
}

function ObservatoryGrid({ weights }) {
  const lines = useRef(null);
  const grid = useMemo(() => buildObservatoryGrid(), []);
  const uniforms = useMemo(() => ({ uColor: { value: new Color('#7FB4D9') }, uOpacity: { value: 0 } }), []);
  useEffect(() => () => grid.geometry.dispose(), [grid]);
  useFrame(() => {
    if (!lines.current) return;
    const weight = weights.current.observatory;
    lines.current.visible = weight > 0.002;
    lines.current.material.uniforms.uOpacity.value = 0.075 * weight;
  });
  return <lineSegments ref={lines} name="biome-observatory-grid" geometry={grid.geometry} frustumCulled={false} renderOrder={7}>
    <shaderMaterial uniforms={uniforms} vertexShader={GRID_VERT} fragmentShader={GRID_FRAG} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
  </lineSegments>;
}

function Haze({ weights }) {
  const mesh = useRef(null);
  const uniforms = useMemo(() => ({
    uTint: { value: Object.values(HAZE).map(item => new Color(item.tint)) },
    uFocus: { value: Object.values(HAZE).map(item => new Vector2(...item.focus)) },
    uWeight: { value: [0, 0, 0, 0] },
  }), []);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!mesh.current) return;
    let total = 0;
    const values = mesh.current.material.uniforms;
    Object.keys(HAZE).forEach((key, index) => { values.uWeight.value[index] = weights.current[key]; total += weights.current[key]; });
    mesh.current.visible = total > 0.002;
  });
  return <mesh ref={mesh} name="biome-haze" geometry={geometry} frustumCulled={false} renderOrder={-10}>
    <shaderMaterial uniforms={uniforms} vertexShader={HAZE_VERT} fragmentShader={HAZE_FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={AdditiveBlending} />
  </mesh>;
}

export function ChapterBiomes({ quality = 'high', reduced = false }) {
  const weights = useRef(biomeWeights('hero', 0));
  const scale = COUNTS[quality] ?? 1;
  const clouds = useMemo(() => ({
    nursery: buildNursery(scale),
    planetary: buildPlanetary(scale),
    observatory: buildObservatory(scale),
    arm: buildArm(scale),
  }), [scale]);
  useFrame(() => {
    const state = useScrollStore.getState();
    biomeWeights(state.storyChapter, state.chapterProgress, weights.current);
  }, -0.75);
  return <group name="chapter-biomes">
    <Haze weights={weights} />
    <BiomeCloud geometry={clouds.nursery.glow} weightKey="nursery" weights={weights} reduced={reduced} />
    <BiomeCloud geometry={clouds.nursery.dust} weightKey="nursery" weights={weights} reduced={reduced} dark order={8.5} />
    <BiomeCloud geometry={clouds.nursery.rim} weightKey="nursery" weights={weights} reduced={reduced} order={8.7} />
    <Planet ring={clouds.planetary} weights={weights} />
    <BiomeCloud geometry={clouds.planetary.geometry} ring={clouds.planetary} weightKey="planetary" weights={weights} reduced={reduced} depthTest />
    <BiomeCloud geometry={clouds.observatory} weightKey="observatory" weights={weights} reduced={reduced} />
    <ObservatoryGrid weights={weights} />
    <BiomeCloud geometry={clouds.arm} weightKey="arm" weights={weights} reduced={reduced} />
  </group>;
}
