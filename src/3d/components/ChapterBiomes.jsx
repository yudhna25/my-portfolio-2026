import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, NormalBlending, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { storyCameraPath } from '@/3d/utils/cameraPath';
import { CHAPTER_PALETTE, PALETTE_CHAPTERS, paletteWeights, skyLayers } from '@/3d/utils/chapterWave';

// One continuous sky across the reading chapters, after real Hubble and JWST plates. About
// trucks along a nebula ribbon (Veil-like filaments: teal oxygen braided inside ember
// hydrogen, a dark dust lane, young blue stars). Its lower end unravels into a stream of
// light that flows through Skills and pours, in Education, into Arp 273: a large spiral and
// its small companion falling toward it. The companion's pass winds the spiral into a rose
// (tight petal arms, pink star-forming knots, a tidal arm reaching for the companion), and
// the rose is Experience's sky. Everything is world-placed, so the camera's moves give real
// parallax, and composed away from the BH, which stays the far landmark.

const COUNTS = { high: 1, medium: 0.6, low: 0.3 };

// Static clouds: gas puffs (kind 0) and stars (kind 1), sizes in world units.
const VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind (0 gas, 1 star), seed, unused
  uniform float uPixelRatio, uTime, uWeight, uProjection, uGain;
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  void main() {
    vec3 world = position;
    // Gas billows very slowly in place.
    world += (1.0 - aShape.y) * 0.35 * vec3(sin(uTime * 0.11 + aShape.z * 40.0), sin(uTime * 0.09 + aShape.z * 23.0), cos(uTime * 0.1 + aShape.z * 31.0));
    vec4 view = viewMatrix * vec4(world, 1.0);
    float depth = -view.z;
    gl_Position = projectionMatrix * view;
    float gas = 1.0 - aShape.y;
    float pixels = aShape.x * uPixelRatio * uProjection / max(depth, 1.0);
    gl_PointSize = clamp(pixels, 1.0, mix(6.0, 160.0, gas) * uPixelRatio);
    vColor = aColor;
    vKind = aShape.y;
    vSeed = aShape.z;
    float twinkle = mix(1.0, 0.8 + 0.2 * sin(uTime * (0.6 + aShape.z * 1.4) + aShape.z * 50.0), aShape.y);
    // Gas fades as it nears the lens instead of filling the frame; faint far puffs drop out.
    float nearFade = smoothstep(4.0, 14.0, depth);
    vAlpha = uGain * uWeight * twinkle * nearFade * step(0.0, depth) * min(1.0, pixels);
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

// The stream of light: particles riding a cubic Bezier from the ribbon's tail into the galaxy
// pair, braided around the path. Stars are drawn as short streaks along the flow.
const STREAM_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind, seed, twist rate
  attribute vec4 aFlow; // start, speed, lateral u, lateral v
  uniform vec3 uP0, uP1, uP2, uP3;
  uniform float uPixelRatio, uTime, uWeight, uProjection, uAspect;
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed, vWidth;
  varying vec2 vDir;
  vec3 bezier(float t) {
    float s = 1.0 - t;
    return s * s * s * uP0 + 3.0 * s * s * t * uP1 + 3.0 * s * t * t * uP2 + t * t * t * uP3;
  }
  vec3 slope(float t) {
    float s = 1.0 - t;
    return 3.0 * s * s * (uP1 - uP0) + 6.0 * s * t * (uP2 - uP1) + 3.0 * t * t * (uP3 - uP2);
  }
  void main() {
    float t = fract(aFlow.x + uTime * aFlow.y);
    vec3 tangent = normalize(slope(t));
    vec3 side = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));
    vec3 lift = cross(side, tangent);
    // Wide where it leaves the ribbon, a narrow river through Skills, fanning into the disk.
    float width = mix(5.5, 1.6, smoothstep(0.0, 0.45, t)) * mix(1.0, 2.6, smoothstep(0.82, 1.0, t));
    float twist = t * 11.0 + uTime * 0.2 * aShape.w;
    vec2 lateral = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * aFlow.zw;
    vec3 world = bezier(t) + (side * lateral.x + lift * lateral.y) * width;
    vec4 view = viewMatrix * vec4(world, 1.0);
    float depth = -view.z;
    gl_Position = projectionMatrix * view;
    vec4 ahead = projectionMatrix * viewMatrix * vec4(world + tangent, 1.0);
    vec2 dir = (ahead.xy / ahead.w - gl_Position.xy / gl_Position.w) * vec2(uAspect, 1.0);
    vDir = length(dir) > 1e-5 ? normalize(dir) : vec2(1.0, 0.0);
    float pixels = aShape.x * uPixelRatio * uProjection / max(depth, 1.0);
    // Streaks need room for their length; gas stays round.
    float size = aShape.y > 0.5 ? clamp(pixels * 7.0, 3.0, 26.0 * uPixelRatio) : clamp(pixels, 1.0, 120.0 * uPixelRatio);
    gl_PointSize = size;
    vWidth = aShape.y > 0.5 ? clamp(max(pixels, 1.3 * uPixelRatio) / size, 0.04, 0.5) : 1.0;
    vColor = aColor;
    vKind = aShape.y;
    vSeed = aShape.z;
    float ends = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.86, 1.0, t));
    float pulse = 0.75 + 0.25 * sin(t * 40.0 - uTime * 1.6 + aShape.z * 6.0);
    vAlpha = uWeight * ends * pulse * smoothstep(4.0, 12.0, depth) * step(0.0, depth);
  }
`;
const STREAM_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed, vWidth;
  varying vec2 vDir;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    c.y = -c.y;
    float a;
    if (vKind > 0.5) {
      float along = dot(c, vDir), across = dot(c, vec2(-vDir.y, vDir.x));
      // Bright head, fading tail behind it.
      float tail = smoothstep(-0.5, 0.0, along) * (1.0 - smoothstep(0.0, 0.08, along));
      a = tail * exp(-pow(across / (0.5 * vWidth), 2.0)) * (0.35 + 0.65 * smoothstep(-0.5, 0.05, along));
    } else {
      a = exp(-dot(c, c) * 14.0) * 0.15;
    }
    a *= vAlpha;
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

// Arp 273. The large disk is stored in polar form twice, as a loose spiral (rest) and as the
// tightly wound rose, so the collision visibly winds the arms up instead of sliding points.
const ARP_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind, seed, delay
  attribute vec3 aTarget;
  attribute float aGroup; // 0 disk, 1 companion, 2 tidal arm, 3 star-forming knots
  uniform vec3 uCenter, uX, uY, uZ, uComp, uCX, uCY, uCZ;
  uniform vec2 uShift;
  uniform float uPixelRatio, uTime, uWeight, uProjection, uRose, uBurst;
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  void main() {
    float show = 1.0;
    vec3 world;
    if (aGroup > 0.5 && aGroup < 1.5) {
      world = uComp + uCX * position.x + uCY * position.y + uCZ * position.z;
    } else {
      float m = smoothstep(aShape.w, aShape.w + 0.45, uRose);
      vec3 local;
      if (aGroup > 1.5 && aGroup < 2.5) {
        local = mix(position, aTarget, m);
      } else {
        vec3 polar = mix(position, aTarget, m);
        float angle = polar.y + uTime * 0.01;
        local = vec3(cos(angle) * polar.x, sin(angle) * polar.x, polar.z);
        // The near side is pulled toward the companion: the rings crowd off-centre.
        local.xy += uShift * m * pow(polar.x / 16.0, 1.4);
      }
      if (aGroup > 1.5) show = m;
      world = uCenter + uX * local.x + uY * local.y + uZ * local.z;
    }
    vec4 view = viewMatrix * vec4(world, 1.0);
    float depth = -view.z;
    gl_Position = projectionMatrix * view;
    float gas = 1.0 - aShape.y;
    float pixels = aShape.x * uPixelRatio * uProjection / max(depth, 1.0);
    gl_PointSize = clamp(pixels, 1.0, mix(7.0, 140.0, gas) * uPixelRatio);
    vColor = aColor;
    // The companion's nucleus flares into a starburst as it passes.
    if (aGroup > 0.5 && aGroup < 1.5 && aShape.w > 0.5) vColor *= 1.0 + 2.5 * uBurst;
    vKind = aShape.y;
    vSeed = aShape.z;
    float twinkle = mix(1.0, 0.8 + 0.2 * sin(uTime * (0.6 + aShape.z * 1.4) + aShape.z * 50.0), aShape.y);
    vAlpha = uWeight * show * twinkle * smoothstep(4.0, 14.0, depth) * step(0.0, depth) * min(1.0, pixels);
  }
`;

const HAZE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.999, 1.0); }
`;
// Each chapter's two tones sit in opposite corners, so its colour reads as a soft gradient.
const HAZE_FRAG = /* glsl */ `
  uniform vec3 uTint[8];
  uniform vec2 uFocus[8];
  uniform float uWeight[8];
  varying vec2 vUv;
  void main() {
    vec3 color = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float glow = 1.0 - smoothstep(0.0, 1.25, distance(vUv, uFocus[i]));
      color += uTint[i] * glow * glow * uWeight[i];
    }
    gl_FragColor = vec4(color, 1.0);
  }
`;
const HAZE_FOCUS = [[0.15, 0.85], [0.85, 0.1]];

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
const gaussian = rand => (rand() + rand() + rand() - 1.5) / 1.5;

// Camera basis at a chapter's pose: where to put a region so it frames away from the BH.
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

function createCloud(extra = {}) {
  const data = { position: [], color: [], shape: [], ...Object.fromEntries(Object.keys(extra).map(key => [key, []])) };
  const color = new Color();
  data.push = (p, hex, size, kind, seed, w = 0, more = {}) => {
    data.position.push(p.x, p.y, p.z);
    color.set(hex);
    data.color.push(color.r, color.g, color.b);
    data.shape.push(size, kind, seed, w);
    for (const key of Object.keys(extra)) data[key].push(...more[key]);
  };
  data.build = () => {
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(data.position), 3));
    geometry.setAttribute('aColor', new BufferAttribute(new Float32Array(data.color), 3));
    geometry.setAttribute('aShape', new BufferAttribute(new Float32Array(data.shape), 4));
    for (const [key, size] of Object.entries(extra)) geometry.setAttribute(key, new BufferAttribute(new Float32Array(data[key]), size));
    return geometry;
  };
  return data;
}

// About: the nebula ribbon, running from high in the far left down toward the lower frame,
// where Skills will pick up its tail. Its width direction twists slowly along it, so the
// truck-in sees it turn from a sheet into an edge-on filament.
function ribbonFrame() {
  const basis = chapterBasis('about');
  const start = basis.at(84, -40, 32), end = basis.at(42, 2, -22);
  const along = end.clone().sub(start);
  const bow = basis.forward.clone().multiplyScalar(-1).addScaledVector(basis.right, -0.4).normalize();
  const sway = new Vector3().crossVectors(along, bow).normalize();
  const center = s => start.clone().addScaledVector(along, s).addScaledVector(bow, 14 * Math.sin(Math.PI * s))
    .addScaledVector(sway, 3.5 * Math.sin(2.3 * Math.PI * s + 1));
  const frame = s => {
    const tangent = center(Math.min(1, s + 0.01)).sub(center(Math.max(0, s - 0.01))).normalize();
    const flat = new Vector3().crossVectors(tangent, basis.forward).normalize();
    const width = flat.clone().applyAxisAngle(tangent, 1.1 * s);
    return { tangent, width, depth: new Vector3().crossVectors(tangent, width) };
  };
  return { center, frame, end: center(1), endTangent: frame(1).tangent };
}

function buildNebula(scale, ribbon) {
  const rand = random(401), glow = createCloud(), dust = createCloud();
  const point = new Vector3();
  const place = (s, w, d) => {
    const { width, depth } = ribbon.frame(s);
    return point.copy(ribbon.center(s)).addScaledVector(width, w).addScaledVector(depth, d);
  };
  const breadth = s => 6 + 11 * Math.sin(Math.PI * Math.min(1, s * 1.15)) * (1 - 0.45 * s);
  // Gas: teal oxygen in the middle, ember hydrogen and magenta at the edges, sulphur gold flecks.
  for (let i = 0; i < 2600 * scale; i++) {
    const s = rand(), half = breadth(s), w = gaussian(rand) * half * 1.7, edge = Math.min(1, Math.abs(w) / half);
    const hue = rand();
    const color = edge < 0.3 ? (hue < 0.7 ? '#0A3840' : '#142650') : hue < 0.55 ? '#4C1A0C' : hue < 0.88 ? '#42102F' : '#3A2C0E';
    glow.push(place(s, w, gaussian(rand) * 2.2), color, 2.6 + rand() * 4.5, 0, rand());
  }
  // Filaments: four braided strands of fine bright threads, the Veil's signature.
  for (let strand = 0; strand < 9; strand++) {
    const teal = strand % 3 !== 0;
    for (let i = 0; i < 620 * scale; i++) {
      const s = rand(), half = breadth(s);
      const w = half * 1.1 * Math.sin(2 * Math.PI * (s * (0.9 + strand * 0.22) + strand / 9) + strand) + 0.5 * Math.sin(s * 23 + strand * 2) + gaussian(rand) * 0.16;
      const d = 1.8 * Math.cos(2 * Math.PI * s * 1.1 + strand) + gaussian(rand) * 0.15;
      glow.push(place(s, w, d), teal ? (rand() < 0.7 ? '#7FE0E6' : '#C8F4FF') : (rand() < 0.7 ? '#FF8C70' : '#FF6FA0'), 0.06 + rand() * 0.06, 1, rand());
      if (i % 5 === 0) glow.push(place(s, w, d), teal ? '#0E4A50' : '#5A1C0C', 0.8 + rand() * 1, 0, rand());
    }
  }
  // Young blue stars born in the ribbon, a few bright ones with soft halos.
  for (let i = 0; i < 520 * scale; i++) {
    const s = rand(), half = breadth(s);
    const bright = rand() < 0.05;
    glow.push(place(s, gaussian(rand) * half * 1.1, gaussian(rand) * 2), bright ? '#E6F0FF' : rand() < 0.7 ? '#A8C4FF' : '#FFE8D0',
      bright ? 0.32 + rand() * 0.2 : 0.06 + Math.pow(rand(), 3) * 0.14, 1, rand());
  }
  // The dark lane that splits the glow, drawn opaque-ish so it eats the light behind it.
  for (let i = 0; i < 700 * scale; i++) {
    const s = 0.08 + rand() * 0.8, half = breadth(s);
    dust.push(place(s, -0.1 * half + 0.3 * half * Math.sin(s * 9) + gaussian(rand) * half * 0.1, gaussian(rand) * 0.6), '#050308', 1.2 + rand() * 1.8, 0, rand());
  }
  return { glow: glow.build(), dust: dust.build() };
}

// Arp 273's frame: the large disk nearly face on, left of the reading column.
function arpFrame() {
  const basis = chapterBasis('education', 0.6);
  const center = basis.at(64, -9, -7);
  const normal = basis.forward.clone().multiplyScalar(-1).applyAxisAngle(basis.right, -0.62).applyAxisAngle(basis.forward, 0.2).normalize();
  const x = basis.right.clone().sub(normal.clone().multiplyScalar(basis.right.dot(normal))).normalize();
  const y = new Vector3().crossVectors(normal, x);
  const toWorld = local => center.clone().addScaledVector(x, local.x).addScaledVector(y, local.y).addScaledVector(normal, local.z);
  // The companion's fall, in the disk's own frame: from high behind, past the rim, to below.
  const path = [new Vector3(-30, 26, -16), new Vector3(-6, 6, -10), new Vector3(12, -20, 2)];
  const companion = c => {
    const s = 1 - c;
    return path[0].clone().multiplyScalar(s * s).addScaledVector(path[1], 2 * s * c).addScaledVector(path[2], c * c);
  };
  return { center, x, y, normal, toWorld, companion, rest: path[2] };
}

const RADIUS = 16;

function buildArp(scale, frame) {
  const rand = random(273), cloud = createCloud({ aTarget: 3, aGroup: 1 });
  const zero = new Vector3(), point = new Vector3();
  const pushDisk = (rest, rose, hex, size, kind, delay, group = 0) =>
    cloud.push(rest, hex, size, kind, rand(), delay, { aTarget: [rose.x, rose.y, rose.z], aGroup: [group] });
  const rest = new Vector3(), rose = new Vector3();
  // Polar (r, angle, height) for a star on arm `arm` at radius r: loose before, tight after.
  const spiral = (r, arm, pitch, scatter) => arm * Math.PI + Math.log(r / 0.9) / Math.tan(pitch) + scatter;
  const disk = (r, arm, scatter, scatterRose) => {
    rest.set(r, spiral(r, arm, 0.4, scatter), gaussian(rand) * 0.25);
    // Tightly wound petals with a three-fold lumpiness, warped out of the plane at the rim.
    const angle = spiral(r, arm, 0.13, scatterRose);
    rose.set(r * (1 + 0.13 * Math.sin(3 * angle + arm) + 0.06 * Math.sin(5 * angle - arm)), angle, gaussian(rand) * 0.3 + 0.012 * r * r * Math.sin(angle - 0.6));
    // The rim answers the pull first, the winding then works inward.
    return 0.45 * (1 - r / RADIUS);
  };
  for (let i = 0; i < 6400 * scale; i++) {
    const field = rand() < 0.3, arm = i % 2;
    const r = field ? 0.6 + Math.pow(rand(), 0.7) * RADIUS : 0.9 + Math.pow(rand(), 0.85) * (RADIUS - 0.9);
    const delay = disk(r, arm, field ? rand() * Math.PI * 2 : gaussian(rand) * 0.28, field ? rand() * Math.PI * 2 : gaussian(rand) * 0.13);
    const hue = rand();
    const color = field ? (hue < 0.6 ? '#FFE6C4' : '#C8D4FF') : hue < 0.55 ? '#AFC6FF' : hue < 0.85 ? '#E8EEFF' : '#FFD9B0';
    pushDisk(rest, rose, color, 0.05 + Math.pow(rand(), 3) * 0.16, 1, delay);
  }
  // Blue gas along the arms and the warm bulge.
  for (let i = 0; i < 260 * scale; i++) {
    const r = 1.5 + rand() * (RADIUS - 2), arm = i % 2;
    const delay = disk(r, arm, gaussian(rand) * 0.3, gaussian(rand) * 0.16);
    pushDisk(rest, rose, rand() < 0.75 ? '#16244C' : '#2A1838', 1.8 + rand() * 2.4, 0, delay);
  }
  for (let i = 0; i < 70 * scale; i++) {
    const r = Math.abs(gaussian(rand)) * 2.2, angle = rand() * Math.PI * 2;
    rest.set(r, angle, gaussian(rand) * 0.5);
    pushDisk(rest, rest, '#5C4630', 2.5 + rand() * 3, 0, 0);
  }
  // Pink star-forming knots that light up along the petals as the collision compresses gas.
  for (let i = 0; i < 420 * scale; i++) {
    const r = 2.5 + rand() * (RADIUS - 2.5), arm = i % 2;
    const delay = disk(r, arm, gaussian(rand) * 0.2, gaussian(rand) * 0.06);
    const pink = rand() < 0.65;
    pushDisk(rest, rose, pink ? '#FF8CC0' : '#B4D0FF', 0.14 + rand() * 0.2, 1, delay + 0.1, 3);
    if (i % 3 === 0) pushDisk(rest, rose, pink ? '#5A1640' : '#18285A', 1.6 + rand() * 1.8, 0, delay + 0.1, 3);
  }
  // The tidal arm: a long stream drawn out of the rim toward the companion's final place,
  // and a faint bridge between them.
  const reach = frame.rest.clone();
  const anchor = new Vector3(Math.cos(-1.2), Math.sin(-1.2), 0).multiplyScalar(RADIUS * 0.9);
  for (let i = 0; i < 1300 * scale; i++) {
    const s = rand(), bridge = rand() < 0.35;
    const bend = bridge ? 0 : 7 * Math.sin(Math.PI * s);
    point.copy(anchor).lerp(reach, s).add(new Vector3(-bend * 0.8, -bend * 0.5, gaussian(rand) * 0.4)).add(new Vector3(gaussian(rand), gaussian(rand), 0).multiplyScalar(bridge ? 0.5 : 1.1));
    rest.copy(anchor).add(new Vector3(gaussian(rand), gaussian(rand), 0));
    const delay = 0.35 + 0.25 * s;
    if (rand() < 0.06) cloud.push(rest, bridge ? '#141A34' : '#1A2448', 1.6 + rand() * 1.8, 0, rand(), delay, { aTarget: [point.x, point.y, point.z], aGroup: [2] });
    else cloud.push(rest, bridge ? '#9AA6D8' : '#B4C8FF', 0.04 + rand() * 0.06, 1, rand(), delay, { aTarget: [point.x, point.y, point.z], aGroup: [2] });
  }
  // UGC 1813, the small companion: an elongated, nearly edge-on disk with a bright nucleus.
  for (let i = 0; i < 1300 * scale; i++) {
    const r = Math.pow(rand(), 1.4) * 6, angle = rand() * Math.PI * 2;
    point.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.32, gaussian(rand) * 0.3);
    cloud.push(point, rand() < 0.6 ? '#FFE4C0' : '#D8DEFF', 0.05 + Math.pow(rand(), 3) * 0.13, 1, rand(), 0, { aTarget: [0, 0, 0], aGroup: [1] });
  }
  for (let i = 0; i < 40 * scale; i++) {
    point.set(gaussian(rand) * 2.2, gaussian(rand) * 0.6, gaussian(rand) * 0.4);
    cloud.push(point, '#3E3024', 1.6 + rand() * 2, 0, rand(), 1, { aTarget: [0, 0, 0], aGroup: [1] });
  }
  cloud.push(zero, '#FFF0D8', 0.6, 1, 0.5, 1, { aTarget: [0, 0, 0], aGroup: [1] });
  return cloud.build();
}

function streamControls(ribbon, arp) {
  const skills = chapterBasis('skills', 0.5);
  // Leaves along the ribbon's own direction, sweeps through the Skills frame, enters the disk at its rim.
  return [
    ribbon.end.clone(),
    ribbon.end.clone().addScaledVector(ribbon.endTangent, 22),
    skills.at(60, -8, -14),
    arp.toWorld(new Vector3(-RADIUS * 0.8, RADIUS * 0.5, 0)),
  ];
}

function buildStream(scale) {
  const rand = random(517), cloud = createCloud({ aFlow: 4 });
  const zero = new Vector3();
  for (let i = 0; i < 3800 * scale; i++) {
    const radius = Math.pow(rand(), 0.6), angle = rand() * Math.PI * 2;
    // Three braids, so the river reads as twisted cords of light rather than a tube.
    const braid = Math.floor(rand() * 3) * Math.PI * 2 / 3;
    const u = rand() < 0.7 ? Math.cos(braid) * 0.6 + gaussian(rand) * 0.22 : Math.cos(angle) * radius;
    const v = rand() < 0.7 ? Math.sin(braid) * 0.6 + gaussian(rand) * 0.22 : Math.sin(angle) * radius;
    const hue = rand();
    const color = hue < 0.5 ? '#9FF2E8' : hue < 0.8 ? '#D8FFF6' : hue < 0.93 ? '#FFE2A8' : '#FF9EC0';
    cloud.push(zero, color, 0.05 + Math.pow(rand(), 2) * 0.09, 1, rand(), 0.5 + rand(), { aFlow: [rand(), 0.018 + rand() * 0.016, u, v] });
  }
  for (let i = 0; i < 300 * scale; i++) {
    cloud.push(zero, rand() < 0.7 ? '#0C3A3C' : '#2C260C', 1.6 + rand() * 2.4, 0, rand(), 0.5, { aFlow: [rand(), 0.01 + rand() * 0.006, gaussian(rand), gaussian(rand)] });
  }
  return cloud.build();
}

const projection = (camera, size) => size.height / (2 * Math.tan(camera.fov * Math.PI / 360));

function useCloudMaterial(extra) {
  return useMemo(() => ({
    uPixelRatio: { value: 1 }, uTime: { value: 0 }, uWeight: { value: 0 }, uProjection: { value: 700 }, ...extra,
  }), [extra]);
}

// Advances a layer's clock and shared uniforms; returns the material uniforms while visible.
function useLayer(ref, layers, key, reduced, update) {
  useFrame(({ gl, camera, size }, delta) => {
    if (!ref.current) return;
    const weight = layers.current[key];
    ref.current.visible = weight > 0.002;
    if (!ref.current.visible) return;
    const values = ref.current.material.uniforms;
    values.uWeight.value = weight;
    values.uPixelRatio.value = gl.getPixelRatio();
    values.uProjection.value = projection(camera, size);
    if (!reduced) values.uTime.value += Math.min(delta, 0.1);
    update?.(values, size);
  });
}

function Cloud({ geometry, layerKey, layers, reduced, dark = false, order = 8 }) {
  const points = useRef(null);
  const extra = useMemo(() => ({ uGain: { value: dark ? 1.1 : 1 } }), [dark]);
  const uniforms = useCloudMaterial(extra);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayer(points, layers, layerKey, reduced);
  // Dark dust is drawn with normal blending, so it occludes the glow behind it.
  return <points ref={points} name={`sky-${layerKey}${dark ? '-dust' : ''}`} geometry={geometry} frustumCulled={false} renderOrder={order}>
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false} toneMapped={false}
      blending={dark ? NormalBlending : AdditiveBlending} />
  </points>;
}

function Stream({ geometry, controls, layers, reduced }) {
  const points = useRef(null);
  const extra = useMemo(() => ({
    uP0: { value: controls[0] }, uP1: { value: controls[1] }, uP2: { value: controls[2] }, uP3: { value: controls[3] }, uAspect: { value: 1 },
  }), [controls]);
  const uniforms = useCloudMaterial(extra);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayer(points, layers, 'stream', reduced, (values, size) => { values.uAspect.value = size.width / Math.max(1, size.height); });
  return <points ref={points} name="sky-stream" geometry={geometry} frustumCulled={false} renderOrder={8}>
    <shaderMaterial uniforms={uniforms} vertexShader={STREAM_VERT} fragmentShader={STREAM_FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={AdditiveBlending} />
  </points>;
}

function Arp({ geometry, frame, layers, reduced }) {
  const points = useRef(null);
  const extra = useMemo(() => {
    // The companion lies along the line of its fall, tipped nearly edge on.
    const cx = frame.x.clone().multiplyScalar(0.8).addScaledVector(frame.y, -0.6).normalize();
    const cz = frame.normal.clone().applyAxisAngle(cx, 1.25);
    const shift = frame.rest.clone().setZ(0).normalize().multiplyScalar(2.6);
    return {
      uCenter: { value: frame.center }, uX: { value: frame.x }, uY: { value: frame.y }, uZ: { value: frame.normal },
      uComp: { value: new Vector3() }, uCX: { value: cx }, uCY: { value: new Vector3().crossVectors(cz, cx) }, uCZ: { value: cz },
      uShift: { value: new Vector2(shift.x, shift.y) }, uRose: { value: 0 }, uBurst: { value: 0 },
    };
  }, [frame]);
  const uniforms = useCloudMaterial(extra);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayer(points, layers, 'arp', reduced, values => {
    const { approach, rose } = layers.current;
    values.uRose.value = rose;
    values.uComp.value.copy(frame.toWorld(frame.companion(approach)));
    values.uBurst.value = Math.sin(Math.PI * Math.min(1, approach * 1.15)) * 0.6 + 0.4 * rose;
  });
  return <points ref={points} name="sky-arp" geometry={geometry} frustumCulled={false} renderOrder={8}>
    <shaderMaterial uniforms={uniforms} vertexShader={ARP_VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={AdditiveBlending} />
  </points>;
}

function Haze() {
  const mesh = useRef(null);
  const weights = useRef({});
  const uniforms = useMemo(() => ({
    uTint: { value: PALETTE_CHAPTERS.flatMap(key => CHAPTER_PALETTE[key].haze.map(hex => new Color(hex))) },
    uFocus: { value: PALETTE_CHAPTERS.flatMap(() => HAZE_FOCUS.map(focus => new Vector2(...focus))) },
    uWeight: { value: new Array(8).fill(0) },
  }), []);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!mesh.current) return;
    const state = useScrollStore.getState();
    paletteWeights(state.storyChapter, state.chapterProgress, weights.current);
    let total = 0;
    const values = mesh.current.material.uniforms;
    PALETTE_CHAPTERS.forEach((key, index) => {
      const weight = weights.current[key];
      values.uWeight.value[index * 2] = values.uWeight.value[index * 2 + 1] = weight;
      total += weight;
    });
    mesh.current.visible = total > 0.002;
  });
  return <mesh ref={mesh} name="sky-haze" geometry={geometry} frustumCulled={false} renderOrder={-10}>
    <shaderMaterial uniforms={uniforms} vertexShader={HAZE_VERT} fragmentShader={HAZE_FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={AdditiveBlending} />
  </mesh>;
}

export function ChapterBiomes({ quality = 'high', reduced = false }) {
  const layers = useRef(skyLayers('hero', 0));
  const scale = COUNTS[quality] ?? 1;
  const sky = useMemo(() => {
    const ribbon = ribbonFrame(), arp = arpFrame();
    return {
      nebula: buildNebula(scale, ribbon),
      stream: buildStream(scale),
      controls: streamControls(ribbon, arp),
      arpFrame: arp,
      arp: buildArp(scale, arp),
    };
  }, [scale]);
  useFrame(() => {
    const state = useScrollStore.getState();
    skyLayers(state.storyChapter, state.chapterProgress, layers.current);
  }, -0.75);
  return <group name="chapter-skies">
    <Haze />
    <Cloud geometry={sky.nebula.glow} layerKey="nebula" layers={layers} reduced={reduced} />
    <Cloud geometry={sky.nebula.dust} layerKey="nebula" layers={layers} reduced={reduced} dark order={9} />
    <Stream geometry={sky.stream} controls={sky.controls} layers={layers} reduced={reduced} />
    <Arp geometry={sky.arp} frame={sky.arpFrame} layers={layers} reduced={reduced} />
  </group>;
}
