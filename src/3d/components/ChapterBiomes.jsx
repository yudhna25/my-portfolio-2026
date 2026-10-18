import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, DoubleSide, NormalBlending, Quaternion, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { BLACK_HOLE_CENTER, storyCameraPath } from '@/3d/utils/cameraPath';
import { biomeWeights } from '@/3d/utils/chapterWave';

// One region of sky per reading chapter, all on the same continuous flight: About trucks
// into a globular star cluster, Skills arcs around a ringed world and its moons, Education
// cranes up past a pulsar sweeping its beams, Experience tracks along a spiral arm. Each is a
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

// About: a globular cluster ahead of the camera's push. Thousands of old gold and blue
// straggler stars, densest at the core, so the truck-in streams them past the lens.
function buildCluster(scale) {
  const rand = random(301), cloud = createCloud(), basis = chapterBasis('about', 0);
  const center = basis.at(27, -5, -3);
  const point = new Vector3();
  for (let i = 0; i < 6500 * scale; i++) {
    // King-like profile: a tight core and a long halo.
    const radius = 30 * Math.pow(rand(), 1.9) + 1.2 * rand();
    const theta = rand() * Math.PI * 2, phi = Math.acos(2 * rand() - 1);
    point.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).multiplyScalar(radius).add(center);
    const hue = rand();
    const color = hue < 0.55 ? '#FFD9A0' : hue < 0.85 ? '#FFF1DC' : hue < 0.95 ? '#FFB27A' : '#A9C4FF';
    cloud.push(point, color, 0.05 + Math.pow(rand(), 3) * 0.22, 1, rand());
  }
  // The unresolved glow of the core.
  for (let i = 0; i < 70 * scale; i++) {
    point.set(gaussian(rand), gaussian(rand), gaussian(rand)).multiplyScalar(3.2).add(center);
    cloud.push(point, '#5A4024', 4 + rand() * 4, 0, rand());
  }
  return cloud.build();
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

// Education: a pulsar left of the reading column, its wind nebula in cyan and violet
// wisps and dipole field lines looping out of the poles.
function buildPulsar(scale) {
  const rand = random(919), cloud = createCloud(), basis = chapterBasis('education');
  const center = basis.at(82, -6, -4);
  const axis = basis.up.clone().applyAxisAngle(basis.forward, 0.42).applyAxisAngle(basis.right, 0.3).normalize();
  const side = new Vector3().crossVectors(axis, basis.forward).normalize();
  const third = new Vector3().crossVectors(axis, side).normalize();
  const point = new Vector3();
  // Equatorial torus of the wind nebula and the polar jets.
  for (let i = 0; i < 520 * scale; i++) {
    const angle = rand() * Math.PI * 2, radius = 4 + rand() * 9;
    point.copy(center).addScaledVector(side, Math.cos(angle) * radius).addScaledVector(third, Math.sin(angle) * radius)
      .addScaledVector(axis, gaussian(rand) * 1.4);
    cloud.push(point, rand() < 0.6 ? '#1E4A66' : '#3A2A66', 2.2 + rand() * 3.4, 0, rand());
  }
  for (let i = 0; i < 160 * scale; i++) {
    const t = rand() * (rand() < 0.5 ? 1 : -1);
    point.copy(center).addScaledVector(axis, t * 16).addScaledVector(side, gaussian(rand) * (0.6 + Math.abs(t) * 2));
    cloud.push(point, '#2C6A8A', 1.8 + rand() * 2.2, 0, rand());
  }
  // Field lines: r = L sin²θ in planes around the magnetic axis, drawn as fine dots.
  for (let line = 0; line < 10; line++) {
    const turn = line / 10 * Math.PI * 2, size = 7 + (line % 3) * 4;
    const plane = side.clone().multiplyScalar(Math.cos(turn)).addScaledVector(third, Math.sin(turn));
    for (let i = 0; i < 90 * scale; i++) {
      const theta = 0.12 + rand() * (Math.PI - 0.24), r = size * Math.sin(theta) ** 2;
      point.copy(center).addScaledVector(plane, r * Math.sin(theta)).addScaledVector(axis, r * Math.cos(theta));
      cloud.push(point, '#9FD8FF', 0.05 + rand() * 0.04, 1, rand());
    }
  }
  return { geometry: cloud.build(), center, axis, side };
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
  cluster: { tint: '#24180C', focus: [0.3, 0.3] },
  planetary: { tint: '#0E1630', focus: [0.18, 0.2] },
  pulsar: { tint: '#081C2C', focus: [0.25, 0.35] },
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

// The pulsar's core and its two sweeping beams: cones around the spin axis's precession,
// soft along their length, flashing as they cross the line of sight.
const BEAM_VERT = /* glsl */ `
  varying float vAlong, vAcross;
  void main() {
    vAlong = uv.y;
    vAcross = abs(uv.x - 0.5) * 2.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const BEAM_FRAG = /* glsl */ `
  uniform float uWeight, uFlash;
  varying float vAlong, vAcross;
  void main() {
    float core = pow(1.0 - vAcross, 3.0);
    float fall = pow(1.0 - vAlong, 1.6) * smoothstep(0.0, 0.04, vAlong);
    gl_FragColor = vec4(vec3(0.45, 0.8, 1.0), core * fall * (0.07 + 0.3 * uFlash) * uWeight);
  }
`;

function Pulsar({ pulsar, weights, reduced }) {
  const spin = useRef(null), beams = useRef(null), core = useRef(null);
  const uniforms = useMemo(() => ({ uWeight: { value: 0 }, uFlash: { value: 0 } }), []);
  const clock = useRef(0);
  const orientation = useMemo(() => {
    // Spin axis tilted from the magnetic axis, so the beams sweep a cone across the frame.
    const up = new Vector3(0, 1, 0);
    return new Quaternion().setFromUnitVectors(up, pulsar.axis);
  }, [pulsar]);
  useFrame(({ camera }, delta) => {
    if (!spin.current) return;
    const weight = weights.current.pulsar;
    spin.current.visible = weight > 0.002;
    if (!spin.current.visible) return;
    if (!reduced) clock.current += Math.min(delta, 0.1);
    beams.current.rotation.y = clock.current * 1.6;
    // Flash when a beam swings toward the camera.
    beams.current.updateWorldMatrix(true, false);
    const tip = new Vector3(0, 1, 0).applyQuaternion(beams.current.getWorldQuaternion(new Quaternion()));
    const view = camera.position.clone().sub(pulsar.center).normalize();
    const flash = Math.pow(Math.max(0, Math.abs(tip.dot(view))), 24);
    beams.current.traverse(mesh => {
      if (!mesh.material) return;
      mesh.material.uniforms.uWeight.value = weight;
      mesh.material.uniforms.uFlash.value = flash;
    });
    core.current.material.uniforms.uWeight.value = weight;
    core.current.material.uniforms.uFlash.value = flash;
  });
  return <group ref={spin} name="biome-pulsar-beams" position={pulsar.center} quaternion={orientation} renderOrder={8}>
    <group ref={beams} rotation={[0, 0, 0]}>
      {[1, -1].map(sign => (
        <group key={sign} rotation={[0, 0, sign > 0 ? 0.5 : Math.PI + 0.5]}>
          <mesh position={[0, 30, 0]} renderOrder={8} frustumCulled={false}>
            <coneGeometry args={[4, 60, 32, 1, true]} />
            <shaderMaterial uniforms={uniforms} vertexShader={BEAM_VERT} fragmentShader={BEAM_FRAG} transparent depthTest={false} depthWrite={false}
              toneMapped={false} blending={AdditiveBlending} side={DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
    <mesh ref={core} renderOrder={8}>
      <sphereGeometry args={[0.4, 16, 12]} />
      <shaderMaterial uniforms={uniforms} vertexShader={BEAM_VERT} fragmentShader={`
        uniform float uWeight, uFlash;
        void main() { gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * (1.2 + 2.0 * uFlash), uWeight); }
      `} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
    </mesh>
  </group>;
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
    cluster: buildCluster(scale),
    planetary: buildPlanetary(scale),
    pulsar: buildPulsar(scale),
    arm: buildArm(scale),
  }), [scale]);
  useFrame(() => {
    const state = useScrollStore.getState();
    biomeWeights(state.storyChapter, state.chapterProgress, weights.current);
  }, -0.75);
  return <group name="chapter-biomes">
    <Haze weights={weights} />
    <BiomeCloud geometry={clouds.cluster} weightKey="cluster" weights={weights} reduced={reduced} />
    <Planet ring={clouds.planetary} weights={weights} />
    <BiomeCloud geometry={clouds.planetary.geometry} ring={clouds.planetary} weightKey="planetary" weights={weights} reduced={reduced} depthTest />
    <BiomeCloud geometry={clouds.pulsar.geometry} weightKey="pulsar" weights={weights} reduced={reduced} />
    <Pulsar pulsar={clouds.pulsar} weights={weights} reduced={reduced} />
    <BiomeCloud geometry={clouds.arm} weightKey="arm" weights={weights} reduced={reduced} />
  </group>;
}
