import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, CustomBlending, DataTexture, DoubleSide, FloatType, MaxEquation, RGBAFormat, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { activeEducation, useEducationStore } from '@/stores/useEducationStore';
import { CHAPTER_PALETTE, PALETTE_CHAPTERS, journey, paletteWeights, skyLayers } from '@/3d/utils/chapterWave';
import { ARP_RADIUS as RADIUS, REST_PITCH, armAngle, skyLayout } from '@/3d/utils/skyPath';
import { EDUCATION_KNOTS, educationBeat, knotLabels, knotLocal } from '@/3d/utils/educationKnots';

// One continuous sky across the reading chapters, after real Hubble and JWST plates. About
// trucks along a nebula ribbon (Veil-like filaments: teal oxygen braided inside ember
// hydrogen, young blue stars). Its tail becomes a band of flowing light that the camera
// rides through Skills (see bandFollow) until it winds into the arm of Arp 273's large
// spiral in Education; the disk lights up around it while its small companion falls in.
// The companion's pass winds the spiral into a rose (tight petal arms, pink star-forming
// knots, a tidal arm reaching for the companion), and the rose is Experience's sky.
// Everything is world-placed (layout in skyPath), so the camera's moves give real parallax.

const COUNTS = { high: 1, medium: 0.6, low: 0.3 };

// Static clouds: gas puffs (kind 0) and stars (kind 1), sizes in world units.
const VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind (0 gas, 1 star), seed, unused
  uniform float uPixelRatio, uTime, uWeight, uProjection, uGain;
  uniform vec3 uFlow; // the cloud's long axis, for light rippling along it
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  void main() {
    vec3 p = position;
    float t = uTime, gas = 1.0 - aShape.y;
    // Alive at rest: a slow, coherent flow field, so neighbouring gas moves together and the
    // ribbon undulates and churns instead of jittering. Stars inside it drift less.
    vec3 field = vec3(
      sin(p.y * 0.11 + t * 0.13) + 0.5 * sin(p.z * 0.23 - t * 0.07 + aShape.z * 6.0),
      sin(p.z * 0.09 + t * 0.11) + 0.5 * sin(p.x * 0.21 + t * 0.09 + aShape.z * 5.0),
      sin(p.x * 0.10 - t * 0.12) + 0.5 * sin(p.y * 0.19 - t * 0.08 + aShape.z * 4.0));
    vec3 world = p + field * mix(0.3, 1.2, gas);
    vec4 view = viewMatrix * vec4(world, 1.0);
    float depth = -view.z;
    gl_Position = projectionMatrix * view;
    // Puffs swell and settle, each on its own slow breath.
    float breath = 1.0 + gas * 0.14 * sin(t * 0.28 + aShape.z * 20.0);
    float pixels = aShape.x * breath * uPixelRatio * uProjection / max(depth, 1.0);
    gl_PointSize = clamp(pixels, 1.0, mix(6.0, 160.0, gas) * uPixelRatio);
    vColor = aColor;
    vKind = aShape.y;
    vSeed = aShape.z;
    float twinkle = mix(1.0, 0.8 + 0.2 * sin(uTime * (0.6 + aShape.z * 1.4) + aShape.z * 50.0), aShape.y);
    // Slow waves of light travel down the ribbon, as if it were lit from within.
    float ripple = 0.78 + 0.32 * sin(dot(p, uFlow) * 0.11 - t * 0.42 + aShape.z * 0.8);
    // Gas fades as it nears the lens instead of filling the frame; faint far puffs drop out.
    float nearFade = smoothstep(4.0, 14.0, depth);
    vAlpha = uGain * uWeight * twinkle * mix(1.0, ripple, mix(0.4, 1.0, gas)) * nearFade * step(0.0, depth) * min(1.0, pixels);
  }
`;
const FRAG = /* glsl */ `
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a;
    if (vKind > 0.5) {
      a = pow(1.0 - smoothstep(0.0, 0.5, d), 2.6);
    } else {
      // Gas puff: a soft, offset core that slowly circles, so overlapping puffs churn.
      float turn = vSeed * 40.0 + uTime * (0.12 + 0.1 * vSeed);
      vec2 skew = c + 0.08 * vec2(sin(turn), cos(turn * 1.3));
      a = exp(-dot(skew, skew) * 14.0) * 0.15;
    }
    a *= vAlpha;
    if (a < 0.002) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

// The band of light: a camera-facing strip whose width is measured in units of the band's
// core. Light flows along it as drifting noise, with two thin strands braiding around the
// core. It is revealed up to its head, which leads the camera, and once the galaxy has
// formed around its last stretch that stretch hands its light over to the arm's stars.
const BAND_VERT = /* glsl */ `
  attribute vec3 aTangent;
  attribute vec2 aBand; // t along the band, side -1..1
  uniform float uArm;
  varying vec2 vBand;
  varying float vDepth;
  const float HALO = 3.0;
  void main() {
    float t = aBand.x;
    vec3 toCamera = normalize(cameraPosition - position);
    // Where the band runs straight away from the lens the cross product vanishes; lean on a
    // screen-horizontal side there so the strip never pinches to a notch.
    vec3 across = cross(aTangent, toCamera);
    vec3 side = normalize(across + cross(toCamera, vec3(0.0, 1.0, 0.0)) * 0.25 * (1.0 - smoothstep(0.0, 0.35, length(across))));
    // Wide where it leaves the nebula's tail, a river through Skills, an arm's width at the end.
    float width = mix(2.6, 1.1, smoothstep(0.0, 0.3, t)) * mix(1.0, 0.55, smoothstep(uArm - 0.04, uArm + 0.1, t));
    vec3 world = position + side * aBand.y * width * HALO;
    vBand = vec2(t, aBand.y * HALO);
    vec4 view = viewMatrix * vec4(world, 1.0);
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
  }
`;
const BAND_FRAG = /* glsl */ `
  uniform float uTime, uWeight, uHead, uTail, uForm, uArm, uLength;
  varying vec2 vBand;
  varying float vDepth;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  void main() {
    float t = vBand.x, x = vBand.y, s = t * uLength;
    float flow = s * 0.3 - uTime * 0.8;
    float n = 0.6 * noise(vec2(flow, x * 1.3)) + 0.4 * noise(vec2(flow * 2.4 + 7.0, x * 2.8 - uTime * 0.2));
    float wave = s * 0.22 - uTime * 0.55;
    float strands = exp(-pow(x - 0.75 * sin(wave), 2.0) * 9.0) + exp(-pow(x + 0.75 * sin(wave + 1.9), 2.0) * 9.0);
    float light = 0.1 * exp(-x * x * 0.45) + 0.36 * exp(-x * x * 2.2) * (0.3 + 0.7 * n) + 0.3 * exp(-x * x * 12.0)
      + 0.22 * strands * (0.4 + 0.6 * n);
    light *= 1.0 - smoothstep(2.4, 3.0, abs(x));
    // Colour along it: the nebula's own teal and ember, then aqua-white light, then the arm's blue.
    vec3 nebula = mix(vec3(0.35, 0.85, 0.9), vec3(1.0, 0.52, 0.4), smoothstep(0.6, 1.8, abs(x)));
    vec3 river = mix(vec3(0.55, 1.0, 0.92), vec3(1.0, 0.88, 0.62), 0.45 * n + 0.25 * strands);
    vec3 color = mix(nebula, river, smoothstep(0.02, 0.22, t));
    color = mix(color, vec3(0.68, 0.8, 1.0), smoothstep(uArm - 0.12, uArm + 0.04, t));
    // Revealed behind the head, which glows as a brighter knot leading the way.
    float reveal = 1.0 - smoothstep(uHead - 0.06, uHead, t);
    float head = exp(-pow((t - uHead) * uLength / 3.0, 2.0)) * exp(-x * x * 1.5) * (1.0 - smoothstep(0.9, 0.97, uHead));
    float tail = uTail * uArm;
    float start = smoothstep(0.0, 0.14, t) * smoothstep(tail, tail + 0.12, t) * (1.0 - smoothstep(0.93, 1.0, t));
    float handover = 1.0 - 0.92 * uForm * smoothstep(uArm - 0.06, uArm + 0.06, t);
    float a = (light * reveal + head * 0.5) * start * handover * uWeight * smoothstep(5.0, 20.0, vDepth);
    if (a < 0.002) discard;
    // Max blending: where the strip folds on a tight curve it never doubles up into seams.
    gl_FragColor = vec4(color * a, a);
  }
`;

// Motes of light carried along the band: the path is sampled into a float texture so each
// mote can ride it, scattered across the band's width and shown only where it is revealed.
const MOTE_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind, seed, unused
  attribute vec4 aFlow; // start, speed, across, lift
  uniform sampler2D uPath, uSlope;
  uniform float uSamples, uPixelRatio, uTime, uWeight, uProjection, uHead, uTail, uArm;
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  vec3 sampleAt(sampler2D map, float t) {
    float x = clamp(t, 0.0, 1.0) * (uSamples - 1.0), i = floor(x);
    vec3 a = texture2D(map, vec2((i + 0.5) / uSamples, 0.5)).xyz;
    vec3 b = texture2D(map, vec2((min(i + 1.0, uSamples - 1.0) + 0.5) / uSamples, 0.5)).xyz;
    return mix(a, b, x - i);
  }
  void main() {
    float t = fract(aFlow.x + uTime * aFlow.y);
    vec3 center = sampleAt(uPath, t), tangent = normalize(sampleAt(uSlope, t));
    vec3 toCamera = normalize(cameraPosition - center), across = cross(tangent, toCamera);
    vec3 side = normalize(across + cross(toCamera, vec3(0.0, 1.0, 0.0)) * 0.25 * (1.0 - smoothstep(0.0, 0.35, length(across))));
    vec3 lift = cross(tangent, side);
    float width = mix(2.6, 1.1, smoothstep(0.0, 0.3, t)) * mix(1.0, 0.55, smoothstep(uArm - 0.04, uArm + 0.1, t));
    vec3 world = center + (side * aFlow.z + lift * aFlow.w) * width;
    vec4 view = viewMatrix * vec4(world, 1.0);
    float depth = -view.z;
    gl_Position = projectionMatrix * view;
    float pixels = aShape.x * uPixelRatio * uProjection / max(depth, 1.0);
    gl_PointSize = clamp(pixels, 1.0, mix(6.0, 60.0, 1.0 - aShape.y) * uPixelRatio);
    vColor = aColor;
    vKind = aShape.y;
    vSeed = aShape.z;
    float tail = uTail * uArm;
    float shown = (1.0 - smoothstep(uHead - 0.03, uHead, t)) * smoothstep(tail, tail + 0.12, t) * smoothstep(0.02, 0.12, t) * (1.0 - smoothstep(0.92, 1.0, t));
    float twinkle = 0.7 + 0.3 * sin(uTime * (1.5 + aShape.z * 3.0) + aShape.z * 40.0);
    vAlpha = uWeight * shown * twinkle * smoothstep(3.0, 10.0, depth) * min(1.0, pixels);
  }
`;

// Arp 273. The large disk is stored in polar form twice, as a loose spiral (rest) and as the
// tightly wound rose, so the collision visibly winds the arms up instead of sliding points.
const ARP_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind, seed, delay
  attribute vec3 aTarget;
  attribute float aGroup; // 0 disk, 1 companion, 2 tidal arm, 3 star-forming knots
  attribute float aForm; // when the star lights up as the band's light fills the disk
  uniform vec3 uCenter, uX, uY, uZ, uComp, uCX, uCY, uCZ;
  uniform vec2 uShift;
  uniform float uPixelRatio, uTime, uWeight, uProjection, uRose, uBurst, uForm, uSpin;
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
        // Once formed the disk turns, very slowly; the rose's petals breathe.
        polar.y += uSpin;
        polar.x *= 1.0 + 0.025 * m * sin(polar.y * 3.0 - uTime * 0.35);
        local = vec3(cos(polar.y) * polar.x, sin(polar.y) * polar.x, polar.z);
        // The near side is pulled toward the companion: the rings crowd off-centre.
        local.xy += uShift * m * pow(polar.x / 16.0, 1.4);
      }
      if (aGroup > 1.5) show = m;
      show *= smoothstep(aForm, aForm + 0.3, uForm);
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
    // Star-forming knots pulse softly, out of step with each other.
    if (aGroup > 2.5) twinkle *= 0.75 + 0.45 * pow(0.5 + 0.5 * sin(uTime * 0.7 + aShape.z * 30.0), 3.0);
    vAlpha = uWeight * show * twinkle * smoothstep(4.0, 14.0, depth) * step(0.0, depth) * min(1.0, pixels);
  }
`;

// Education's three star-forming regions on arm 0 (see educationKnots): pink hydrogen gas
// round clusters of young blue stars. Their centres are placed in JS each frame, on the
// arm's morph; the school being read swells and brightens, the others glow quietly.
const KNOT_VERT = /* glsl */ `
  attribute vec3 aColor;
  attribute vec4 aShape; // size, kind, seed, school
  attribute vec3 aOffset;
  uniform vec3 uCenter, uX, uY, uZ;
  uniform vec3 uKnot[3];
  uniform float uLit[3];
  uniform float uPixelRatio, uTime, uWeight, uProjection, uForm;
  varying vec3 vColor;
  varying float vAlpha, vKind, vSeed;
  void main() {
    int school = int(aShape.w + 0.5);
    float lit = school == 0 ? uLit[0] : school == 1 ? uLit[1] : uLit[2];
    vec3 centre = school == 0 ? uKnot[0] : school == 1 ? uKnot[1] : uKnot[2];
    float gas = 1.0 - aShape.y;
    // Lit gas billows outward a little and breathes; the stars stay put and flare.
    float breath = 1.0 + 0.08 * sin(uTime * 0.5 + aShape.z * 20.0);
    vec3 local = centre + aOffset * mix(1.0, 1.0 + 0.35 * lit, gas) * mix(1.0, breath, gas);
    vec3 world = uCenter + uX * local.x + uY * local.y + uZ * local.z;
    vec4 view = viewMatrix * vec4(world, 1.0);
    float depth = -view.z;
    gl_Position = projectionMatrix * view;
    float pixels = aShape.x * (1.0 + mix(0.3, 0.35, gas) * lit) * uPixelRatio * uProjection / max(depth, 1.0);
    gl_PointSize = clamp(pixels, 1.0, mix(8.0, 150.0, gas) * uPixelRatio);
    vColor = aColor * (1.0 + mix(0.3, 1.8, aShape.y) * lit);
    vKind = aShape.y;
    vSeed = aShape.z;
    float twinkle = mix(1.0, 0.75 + 0.25 * sin(uTime * (0.8 + aShape.z * 1.6) + aShape.z * 50.0), aShape.y);
    float pulse = 0.85 + 0.15 * sin(uTime * 0.9 + float(school) * 2.1);
    vAlpha = uWeight * smoothstep(0.55, 1.0, uForm) * twinkle * mix(0.4, pulse * 1.1, lit) * smoothstep(4.0, 14.0, depth) * step(0.0, depth) * min(1.0, pixels);
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

function buildNebula(scale, ribbon) {
  const rand = random(401), glow = createCloud();
  const point = new Vector3();
  const place = (s, w, d) => {
    const { width, depth } = ribbon.frame(s);
    return point.copy(ribbon.center(s)).addScaledVector(width, w).addScaledVector(depth, d);
  };
  const { breadth } = ribbon;
  // Gas: teal oxygen in the middle, ember hydrogen and magenta at the edges, sulphur gold flecks.
  // The tip past where the band peels away stays faint, so the band reads as the tail itself.
  const tip = s => 1 - 0.75 * Math.max(0, (s - 0.84) / 0.16);
  for (let i = 0; i < 2600 * scale; i++) {
    let s = rand();
    if (rand() > tip(s)) s *= 0.84;
    const half = breadth(s), w = gaussian(rand) * half * 1.7, edge = Math.min(1, Math.abs(w) / half);
    const hue = rand();
    const color = edge < 0.3 ? (hue < 0.7 ? '#0A3840' : '#142650') : hue < 0.55 ? '#4C1A0C' : hue < 0.88 ? '#42102F' : '#3A2C0E';
    glow.push(place(s, w, gaussian(rand) * 2.2), color, 2.6 + rand() * 4.5, 0, rand());
  }
  // Filaments: nine braided strands of fine bright threads, the Veil's signature.
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
  return glow.build();
}

function buildArp(scale, frame) {
  const rand = random(273), cloud = createCloud({ aTarget: 3, aGroup: 1, aForm: 1 });
  const zero = new Vector3(), point = new Vector3();
  // Formation: the disk lights up from the rim inward, where the band of light enters it.
  const pushDisk = (rest, rose, hex, size, kind, delay, group = 0, form = 0.55 * (1 - rest.x / RADIUS) + 0.08 * rand()) =>
    cloud.push(rest, hex, size, kind, rand(), delay, { aTarget: [rose.x, rose.y, rose.z], aGroup: [group], aForm: [form] });
  const rest = new Vector3(), rose = new Vector3();
  // Polar (r, angle, height) for a star on arm `arm` at radius r: loose before, tight after.
  const spiral = (r, arm, pitch, scatter) => armAngle(r, arm, pitch, frame.phase) + scatter;
  const disk = (r, arm, scatter, scatterRose) => {
    rest.set(r, spiral(r, arm, REST_PITCH, scatter), gaussian(rand) * 0.25);
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
    pushDisk(rest, rose, color, 0.05 + Math.pow(rand(), 3) * 0.16, 1, delay, 0, field ? 0.25 + rand() * 0.5 : undefined);
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
    pushDisk(rest, rest, '#5C4630', 2.5 + rand() * 3, 0, 0, 0, 0.5 + rand() * 0.2);
  }
  // Pink star-forming knots that light up along the petals as the collision compresses gas.
  for (let i = 0; i < 420 * scale; i++) {
    const r = 2.5 + rand() * (RADIUS - 2.5), arm = i % 2;
    const delay = disk(r, arm, gaussian(rand) * 0.2, gaussian(rand) * 0.06);
    const pink = rand() < 0.65;
    pushDisk(rest, rose, pink ? '#FF8CC0' : '#B4D0FF', 0.14 + rand() * 0.2, 1, delay + 0.1, 3, 0);
    if (i % 3 === 0) pushDisk(rest, rose, pink ? '#5A1640' : '#18285A', 1.6 + rand() * 1.8, 0, delay + 0.1, 3, 0);
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
    if (rand() < 0.06) cloud.push(rest, bridge ? '#141A34' : '#1A2448', 1.6 + rand() * 1.8, 0, rand(), delay, { aTarget: [point.x, point.y, point.z], aGroup: [2], aForm: [0] });
    else cloud.push(rest, bridge ? '#9AA6D8' : '#B4C8FF', 0.04 + rand() * 0.06, 1, rand(), delay, { aTarget: [point.x, point.y, point.z], aGroup: [2], aForm: [0] });
  }
  // UGC 1813, the small companion: an elongated, nearly edge-on disk with a bright nucleus.
  for (let i = 0; i < 1300 * scale; i++) {
    const r = Math.pow(rand(), 1.4) * 6, angle = rand() * Math.PI * 2;
    point.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.32, gaussian(rand) * 0.3);
    cloud.push(point, rand() < 0.6 ? '#FFE4C0' : '#D8DEFF', 0.05 + Math.pow(rand(), 3) * 0.13, 1, rand(), 0, { aTarget: [0, 0, 0], aGroup: [1], aForm: [0] });
  }
  for (let i = 0; i < 40 * scale; i++) {
    point.set(gaussian(rand) * 2.2, gaussian(rand) * 0.6, gaussian(rand) * 0.4);
    cloud.push(point, '#3E3024', 1.6 + rand() * 2, 0, rand(), 1, { aTarget: [0, 0, 0], aGroup: [1], aForm: [0] });
  }
  cloud.push(zero, '#FFF0D8', 0.6, 1, 0.5, 1, { aTarget: [0, 0, 0], aGroup: [1], aForm: [0] });
  return cloud.build();
}

function buildKnots(scale) {
  const rand = random(1810), cloud = createCloud({ aOffset: 3 });
  const zero = new Vector3(), offset = new Vector3();
  const blob = (spread, flat = 0.35) => offset.set(gaussian(rand) * spread, gaussian(rand) * spread * 0.7, gaussian(rand) * spread * flat).toArray();
  EDUCATION_KNOTS.forEach((knot, school) => {
    // Glowing hydrogen, magenta-pink, with a little blue reflection nebulosity.
    for (let i = 0; i < 70 * scale; i++) {
      const hue = rand();
      cloud.push(zero, hue < 0.55 ? '#9A2E6E' : hue < 0.85 ? '#C4508C' : '#3C4CA8', 0.9 + rand() * 1.6, 0, rand(), school, { aOffset: blob(1.2) });
    }
    // The young cluster it is lighting: blue-white stars, a few pink.
    for (let i = 0; i < 140 * scale; i++) {
      const hue = rand();
      cloud.push(zero, hue < 0.3 ? '#FFB0DA' : hue < 0.85 ? '#D4E2FF' : '#FFFFFF', 0.12 + Math.pow(rand(), 3) * 0.32, 1, rand(), school, { aOffset: blob(0.85) });
    }
    cloud.push(zero, '#FFE8F4', 0.9, 1, rand(), school, { aOffset: [0, 0, 0] });
  });
  return cloud.build();
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
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
    update?.(values, size, Math.min(delta, 0.1));
  });
}

function Cloud({ geometry, flow, layerKey, layers, reduced, order = 8 }) {
  const points = useRef(null);
  const extra = useMemo(() => ({ uGain: { value: 1 }, uFlow: { value: flow } }), [flow]);
  const uniforms = useCloudMaterial(extra);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayer(points, layers, layerKey, reduced);
  return <points ref={points} name={`sky-${layerKey}`} geometry={geometry} frustumCulled={false} renderOrder={order}>
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false} toneMapped={false}
      blending={AdditiveBlending} />
  </points>;
}

// A strip along the band's centre line, turned to face the camera at every point.
function buildBand(band) {
  const count = 700, point = new Vector3(), tangent = new Vector3();
  const position = new Float32Array((count + 1) * 6), tangents = new Float32Array((count + 1) * 6), coords = new Float32Array((count + 1) * 4);
  const index = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    band.at(t, point, tangent);
    for (let k = 0; k < 2; k++) {
      position.set([point.x, point.y, point.z], i * 6 + k * 3);
      tangents.set([tangent.x, tangent.y, tangent.z], i * 6 + k * 3);
      coords.set([t, k ? 1 : -1], i * 4 + k * 2);
    }
    if (i < count) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(position, 3));
  geometry.setAttribute('aTangent', new BufferAttribute(tangents, 3));
  geometry.setAttribute('aBand', new BufferAttribute(coords, 2));
  geometry.setIndex(index);
  return geometry;
}

function Band({ geometry, band, layers, reduced }) {
  const mesh = useRef(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uWeight: { value: 0 }, uHead: { value: 0 }, uTail: { value: 0 }, uForm: { value: 0 }, uArm: { value: band.armStart }, uLength: { value: band.length },
  }), [band]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame((_, delta) => {
    if (!mesh.current) return;
    const { band: weight, head, tail, form } = layers.current;
    mesh.current.visible = weight > 0.002 && head > 0.001;
    if (!mesh.current.visible) return;
    const values = mesh.current.material.uniforms;
    values.uWeight.value = weight;
    values.uHead.value = head;
    values.uTail.value = tail;
    values.uForm.value = form;
    if (!reduced) values.uTime.value += Math.min(delta, 0.1);
  });
  return <mesh ref={mesh} name="sky-band" geometry={geometry} frustumCulled={false} renderOrder={8}>
    <shaderMaterial uniforms={uniforms} vertexShader={BAND_VERT} fragmentShader={BAND_FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={CustomBlending} blendEquation={MaxEquation} side={DoubleSide} />
  </mesh>;
}

function buildMotes(scale) {
  const rand = random(611), cloud = createCloud({ aFlow: 4 });
  const zero = new Vector3();
  for (let i = 0; i < 1800 * scale; i++) {
    const hue = rand();
    // Mostly in the core, thinning out toward the band's edges.
    const across = gaussian(rand) * 1.1, lift = gaussian(rand) * 0.6;
    cloud.push(zero, hue < 0.55 ? '#C8FFF6' : hue < 0.85 ? '#FFFFFF' : '#FFE0A8', 0.04 + Math.pow(rand(), 3) * 0.1, 1, rand(), 0,
      { aFlow: [rand(), 0.006 + rand() * 0.008, across, lift] });
  }
  return cloud.build();
}

function pathTextures(band, samples = 1024) {
  const points = new Float32Array(samples * 4), slopes = new Float32Array(samples * 4);
  const point = new Vector3(), tangent = new Vector3();
  for (let i = 0; i < samples; i++) {
    band.at(i / (samples - 1), point, tangent);
    points.set([point.x, point.y, point.z, 1], i * 4);
    slopes.set([tangent.x, tangent.y, tangent.z, 0], i * 4);
  }
  return [points, slopes].map(data => {
    const texture = new DataTexture(data, samples, 1, RGBAFormat, FloatType);
    texture.needsUpdate = true;
    return texture;
  });
}

function Motes({ geometry, band, layers, reduced }) {
  const points = useRef(null);
  const [path, slope] = useMemo(() => pathTextures(band), [band]);
  const extra = useMemo(() => ({
    uPath: { value: path }, uSlope: { value: slope }, uSamples: { value: path.image.width }, uHead: { value: 0 }, uTail: { value: 0 }, uArm: { value: band.armStart },
  }), [path, slope, band]);
  const uniforms = useCloudMaterial(extra);
  useEffect(() => () => { geometry.dispose(); path.dispose(); slope.dispose(); }, [geometry, path, slope]);
  useLayer(points, layers, 'band', reduced, values => {
    values.uHead.value = layers.current.head;
    values.uTail.value = layers.current.tail;
  });
  return <points ref={points} name="sky-band-motes" geometry={geometry} frustumCulled={false} renderOrder={9}>
    <shaderMaterial uniforms={uniforms} vertexShader={MOTE_VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={AdditiveBlending} />
  </points>;
}

// The band's leading light: a soft sprite at its head, drawn on its own so the strip folding
// round a tight turn can never clip it.
const HEAD_VERT = /* glsl */ `
  uniform float uPixelRatio, uProjection;
  varying float vDepth;
  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vDepth = -view.z;
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(7.0 * uPixelRatio * uProjection / max(vDepth, 1.0), 2.0, 220.0 * uPixelRatio);
  }
`;
const HEAD_FRAG = /* glsl */ `
  uniform float uWeight, uTime;
  varying float vDepth;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = dot(c, c);
    float pulse = 0.85 + 0.15 * sin(uTime * 2.1);
    float a = (exp(-d * 70.0) * 0.7 + exp(-d * 16.0) * 0.25) * (1.0 - smoothstep(0.12, 0.25, d)) * pulse * uWeight * smoothstep(4.0, 12.0, vDepth);
    if (a < 0.002) discard;
    gl_FragColor = vec4(vec3(0.85, 1.0, 0.96), a);
  }
`;

function BandHead({ band, layers, reduced }) {
  const points = useRef(null);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
    return result;
  }, []);
  const uniforms = useMemo(() => ({ uPixelRatio: { value: 1 }, uProjection: { value: 700 }, uWeight: { value: 0 }, uTime: { value: 0 } }), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ gl, camera, size }, delta) => {
    if (!points.current) return;
    const { band: weight, head } = layers.current;
    // Out once the head has reached the bulge: the light has become the galaxy.
    const shown = weight * Math.min(1, head / 0.02) * (1 - Math.min(1, Math.max(0, (head - 0.9) / 0.07)));
    points.current.visible = shown > 0.002;
    if (!points.current.visible) return;
    band.at(head, points.current.position);
    const values = points.current.material.uniforms;
    values.uWeight.value = shown;
    values.uPixelRatio.value = gl.getPixelRatio();
    values.uProjection.value = projection(camera, size);
    if (!reduced) values.uTime.value += Math.min(delta, 0.1);
  });
  return <points ref={points} name="sky-band-head" geometry={geometry} frustumCulled={false} renderOrder={9}>
    <shaderMaterial uniforms={uniforms} vertexShader={HEAD_VERT} fragmentShader={HEAD_FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={AdditiveBlending} />
  </points>;
}

// The disk's frame and morph uniforms.
function useArpFrame(frame) {
  return useMemo(() => {
    // The companion lies along the line of its fall, tipped nearly edge on.
    const cx = frame.x.clone().multiplyScalar(0.8).addScaledVector(frame.y, -0.6).normalize();
    const cz = frame.normal.clone().applyAxisAngle(cx, 1.25);
    const shift = frame.rest.clone().setZ(0).normalize().multiplyScalar(2.6);
    return {
      uCenter: { value: frame.center }, uX: { value: frame.x }, uY: { value: frame.y }, uZ: { value: frame.normal },
      uComp: { value: new Vector3() }, uCX: { value: cx }, uCY: { value: new Vector3().crossVectors(cz, cx) }, uCZ: { value: cz },
      uShift: { value: new Vector2(shift.x, shift.y) }, uRose: { value: 0 }, uBurst: { value: 0 }, uForm: { value: 0 }, uSpin: { value: 0 },
    };
  }, [frame]);
}

function Arp({ geometry, frame, points, layers, reduced }) {
  const extra = useArpFrame(frame);
  const uniforms = useCloudMaterial(extra);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useLayer(points, layers, 'arp', reduced, (values, size, delta) => {
    const { approach, rose, form, band } = layers.current;
    // The disk turns only once the band has handed over to it; scrolling back eases it home
    // so the arm meets the band again.
    if (form > 0.999 && band < 0.01) { if (!reduced) values.uSpin.value += delta * 0.012; }
    else values.uSpin.value *= Math.exp(-delta * 3);
    values.uRose.value = rose;
    values.uForm.value = form;
    values.uComp.value.copy(frame.toWorld(frame.companion(approach)));
    values.uBurst.value = Math.sin(Math.PI * Math.min(1, approach * 1.15)) * 0.6 + 0.4 * rose;
  });
  return <points ref={points} name="sky-arp" geometry={geometry} frustumCulled={false} renderOrder={8}>
    <shaderMaterial uniforms={uniforms} vertexShader={ARP_VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false}
      toneMapped={false} blending={AdditiveBlending} />
  </points>;
}

// Places the knots on the arm, lights the school being read, and keeps each Education label
// beside its knot on screen (desktop; narrower screens keep the labels in flow).
function Knots({ geometry, frame, arp, layers, reduced }) {
  const points = useRef(null);
  const lit = useRef([0, 0, 0]);
  const scratch = useMemo(() => ({ world: new Vector3(), screen: new Vector3(), hub: new Vector3() }), []);
  const extra = useMemo(() => ({
    uCenter: { value: frame.center }, uX: { value: frame.x }, uY: { value: frame.y }, uZ: { value: frame.normal }, uForm: { value: 0 },
    uKnot: { value: EDUCATION_KNOTS.map(() => new Vector3()) }, uLit: { value: [0, 0, 0] },
  }), [frame]);
  const uniforms = useCloudMaterial(extra);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const toWorld = (local, out) => out.copy(frame.center).addScaledVector(frame.x, local.x).addScaledVector(frame.y, local.y).addScaledVector(frame.normal, local.z);
  useLayer(points, layers, 'arp', reduced, (values, size, delta) => {
    const scroll = useScrollStore.getState();
    const education = useEducationStore.getState();
    const reading = scroll.storyChapter === 'education';
    const chosen = activeEducation(education) ?? (reading ? EDUCATION_KNOTS[educationBeat(scroll.chapterProgress)].id : null);
    // The disk's own morph state, read from its material so the knots never drift off the arm.
    const disk = arp.current?.material.uniforms;
    if (!disk) return;
    values.uForm.value = disk.uForm.value;
    const state = { rose: disk.uRose.value, spin: disk.uSpin.value, time: disk.uTime.value, shift: disk.uShift.value };
    EDUCATION_KNOTS.forEach((knot, index) => {
      knotLocal(knot, frame, state, values.uKnot.value[index]);
      const goal = knot.id === chosen ? 1 : 0;
      lit.current[index] += (goal - lit.current[index]) * (1 - Math.exp(-delta * (reduced ? 30 : 3.5)));
      values.uLit.value[index] = lit.current[index];
    });
  });
  // Labels follow after the camera has moved this frame.
  useFrame(({ camera, size }) => {
    const { section, items } = knotLabels;
    if (!section) return;
    const j = journey(useScrollStore.getState().storyChapter, useScrollStore.getState().chapterProgress);
    const presence = j === null ? 0 : smooth(2.1, 2.28, j) * (1 - smooth(2.9, 3.04, j));
    const live = size.width >= 1024 && points.current?.visible && presence > 0;
    if (!live) { if (section.dataset.knots) delete section.dataset.knots; return; }
    section.dataset.knots = 'live';
    section.style.setProperty('--knots-presence', presence.toFixed(3));
    const box = section.getBoundingClientRect();
    const { world, screen, hub } = scratch;
    const toScreen = (point, out) => out.copy(point).project(camera).set((out.x + 1) * size.width / 2, (1 - out.y) * size.height / 2, out.z);
    toScreen(frame.center, hub);
    // Read every size first, then write, so the frame lays out once.
    const placed = EDUCATION_KNOTS.map((knot, index) => {
      const element = items[knot.id];
      if (!element) return null;
      toWorld(points.current.material.uniforms.uKnot.value[index], world);
      toScreen(world, screen);
      return { element, x: screen.x, y: screen.y, behind: screen.z > 1, width: element.offsetWidth, height: element.offsetHeight };
    });
    const margin = { top: 96, bottom: size.height - 24, left: 112, right: size.width - 24 };
    placed.forEach(item => {
      if (!item) return;
      item.right = item.x >= hub.x;
      const gap = 30;
      item.left = Math.min(Math.max(item.right ? item.x + gap : item.x - gap - item.width, margin.left), margin.right - item.width);
      item.top = item.y - item.height / 2;
    });
    // Labels on the same side stack in arm order without touching.
    [true, false].forEach(side => {
      const column = placed.filter(item => item && item.right === side).sort((a, b) => a.top - b.top);
      column.forEach((item, index) => { if (index) item.top = Math.max(item.top, column[index - 1].top + column[index - 1].height + 14); });
      const overflow = column.length ? column[column.length - 1].top + column[column.length - 1].height - margin.bottom : 0;
      column.forEach(item => { item.top = Math.max(margin.top, item.top - Math.max(0, overflow)); });
    });
    placed.forEach(item => {
      if (!item) return;
      item.element.style.transform = `translate3d(${(item.left - box.left).toFixed(1)}px, ${(item.top - box.top).toFixed(1)}px, 0)`;
      item.element.dataset.side = item.right ? 'right' : 'left';
      item.element.style.visibility = item.behind ? 'hidden' : '';
    });
  });
  return <points ref={points} name="sky-education-knots" geometry={geometry} frustumCulled={false} renderOrder={8}>
    <shaderMaterial uniforms={uniforms} vertexShader={KNOT_VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false}
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
    const { ribbon, arp, band } = skyLayout();
    const flow = ribbon.center(1).sub(ribbon.center(0)).normalize();
    return { nebula: buildNebula(scale, ribbon), flow, band, bandGeometry: buildBand(band), motes: buildMotes(scale), arpFrame: arp, arp: buildArp(scale, arp), knots: buildKnots(scale) };
  }, [scale]);
  const arp = useRef(null);
  useFrame(() => {
    const state = useScrollStore.getState();
    skyLayers(state.storyChapter, state.chapterProgress, layers.current);
  }, -0.75);
  return <group name="chapter-skies">
    <Haze />
    <Cloud geometry={sky.nebula} flow={sky.flow} layerKey="nebula" layers={layers} reduced={reduced} />
    <Band geometry={sky.bandGeometry} band={sky.band} layers={layers} reduced={reduced} />
    <Motes geometry={sky.motes} band={sky.band} layers={layers} reduced={reduced} />
    <BandHead band={sky.band} layers={layers} reduced={reduced} />
    <Arp geometry={sky.arp} frame={sky.arpFrame} points={arp} layers={layers} reduced={reduced} />
    <Knots geometry={sky.knots} frame={sky.arpFrame} arp={arp} layers={layers} reduced={reduced} />
  </group>;
}
