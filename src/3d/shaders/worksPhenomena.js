// Works as a sky full of hidden phenomena. Each constellation keeps a real one inside it
// (Omega Centauri in the Centaur, the Eskimo Nebula in the Twins, the Veil Nebula in the
// Swan), and the project's picture is made of that phenomenon's light:
//   rest   the cursor's trail lets you glimpse it behind the figure,
//   hover  it blooms from the brightest star and the picture forms out of it,
//   open   the mythological drawing breaks into dust and the picture clears into colour,
//          the phenomenon still glowing around and through it.
// The shared cursor field stirs it, and a click sends a gravitational ripple through it.

// Viewport uv of each fragment, where the shared gravity field is sampled.
const SCREEN = /* glsl */ `
  varying vec2 vScreen;
`;
const PASS_SCREEN = /* glsl */ `
  ${SCREEN}
  void passScreen(vec4 clip) { vScreen = clip.xy / clip.w * 0.5 + 0.5; }
`;

const NOISE = /* glsl */ `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) { return noise(p) * 0.55 + noise(p * 2.1) * 0.3 + noise(p * 4.3) * 0.15; }
  float ridge(vec2 p, float sharp) { return pow(1.0 - abs(noise(p) * 2.0 - 1.0), sharp); }
`;

export const ART_VERT = /* glsl */ `
  varying vec2 vUv;
  ${PASS_SCREEN}
  void main() {
    vUv = uv;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    passScreen(clip);
    gl_Position = clip;
  }
`;

// Mythological figure (the Stellarium line art). Hover redraws its ink outward from the
// brightest star behind an amber front; opening breaks it into dust that drifts away.
export const ART_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uField;
  uniform vec2 uOrigin, uViewport;
  uniform float uReveal, uDissolve, uTime, uOpacity, uIdle;
  varying vec2 vUv;
  ${SCREEN}
  ${NOISE}
  void main() {
    vec4 field = texture2D(uField, vScreen);
    float aspect = uViewport.x / max(uViewport.y, 1.0);
    // Living ink: a slow flow in the lines, plus the cursor's pull.
    vec2 flow = (vec2(noise(vUv * 6.0 + uTime * 0.15), noise(vUv * 6.0 - uTime * 0.12 + 7.0)) - 0.5) * 0.004 * uReveal;
    vec2 uv = vUv + flow - field.rg * vec2(1.0 / aspect, 1.0) * 0.012;
    // Each grain of ink leaves at its own moment, outward from the heart of the figure.
    float grain = hash(floor(vUv * 180.0));
    float drift = clamp(uDissolve * 1.5 - grain * 0.5, 0.0, 1.0);
    vec2 away = normalize(vUv - uOrigin + 1e-4);
    uv -= (away * 0.08 + vec2(0.0, 0.03)) * drift * drift;
    // Loosened ink is round dust, and it thins out before the edge of the drawing.
    float speck = 1.0 - smoothstep(0.2, 0.45, length(fract(vUv * 180.0) - 0.5));
    vec2 rim = min(vUv, 1.0 - vUv);
    float loose = smoothstep(0.0, 0.15, drift) * (1.0 - smoothstep(0.0, 0.12, min(rim.x, rim.y)));
    vec4 art = texture2D(uMap, uv);
    float r = length(vUv - uOrigin);
    float front = uReveal * 1.6 - r + (fbm(vUv * 9.0) - 0.5) * 0.12;
    float drawn = smoothstep(0.0, 0.05, front);
    float glow = exp(-front * front / 0.0012) * smoothstep(0.0, 0.15, uReveal) * (1.0 - uDissolve);
    float ember = sin(drift * 3.14159);
    float ink = art.a * max(uIdle, drawn * (0.5 + 0.1 * sin(uTime * 1.3 + r * 9.0)));
    vec3 ivory = vec3(0.93, 0.92, 0.89);
    vec3 color = mix(ivory, vec3(1.0, 0.70, 0.36), clamp(glow * 1.5 + field.a * 0.5 + ember * 0.8, 0.0, 1.0));
    float alpha = (ink + art.a * glow * 0.9) * (1.0 + ember * 0.6) * (1.0 - smoothstep(0.55, 1.0, drift))
      * mix(1.0, speck, smoothstep(0.0, 0.2, drift)) * (1.0 - loose) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`;

export const PHENOMENON_VERT = ART_VERT;

// The phenomenon behind a figure. The mesh is larger than the picture (uPad) so the light
// can spill past it. Output is premultiplied: emission adds, the cleared picture covers.
export const PHENOMENON_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uField;
  uniform vec4 uPulse;
  uniform vec2 uViewport;
  uniform float uKind, uDraw, uOpen, uTime, uOpacity, uAspect, uPad, uGrain;
  varying vec2 vUv;
  ${SCREEN}
  ${NOISE}
  // Each phenomenon sits at the heart of its picture.
  const vec2 HEART = vec2(0.5);
  float inside(vec2 p) { return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0); }
  // The picture's edge is a drifting cloud, never a straight frame.
  float cloud(vec2 p) {
    vec2 e = min(p, 1.0 - p) * vec2(uAspect, 1.0);
    return smoothstep(0.0, 0.05 + 0.08 * fbm(p * 6.0 + uTime * 0.05), min(e.x, e.y)) * inside(p);
  }
  float lightAt(vec2 p) { return cloud(p) * pow(dot(texture2D(uMap, p).rgb, vec3(0.299, 0.587, 0.114)), 0.9); }

  // Gas glows only where the picture holds real light, thinning away from the heart.
  float glowAt(vec2 p, float r) {
    return cloud(p) * smoothstep(0.18, 0.95, dot(texture2D(uMap, p).rgb, vec3(0.299, 0.587, 0.114))) * exp(-r * r / 0.4);
  }

  // Omega Centauri: the picture as a swarm of suns. The cluster is crowded at its core and
  // thins outward; the picture's light decides which suns burn, so no grid ever shows.
  float swarm(vec2 p, float cells, float seed, float bloom, float crowding, out float hue) {
    // Each layer's cells are turned at their own angle, so layers never line up into rows.
    mat2 turn = mat2(cos(seed), sin(seed), -sin(seed), cos(seed));
    vec2 g = turn * ((p - HEART) * vec2(uAspect, 1.0)) * cells;
    vec2 cell = floor(g);
    vec2 h = vec2(hash(cell + seed), hash(cell + seed + 17.3));
    vec2 centre = cell + 0.5 + (h - 0.5) * 0.6;
    mat2 back = mat2(cos(seed), -sin(seed), sin(seed), cos(seed));
    vec2 star = (back * (centre / cells)) / vec2(uAspect, 1.0) + HEART;
    float r = length((star - HEART) * vec2(uAspect, 1.0));
    float light = lightAt(star);
    // At most every other cell holds a sun, so the swarm never fills into a lattice.
    float present = step(hash(cell + seed + 41.7), min(0.5, light * 0.6 + crowding / (1.0 + r * r / 0.12)));
    float born = smoothstep(0.0, 0.08, bloom * 1.9 - r - h.x * 0.3);
    float flash = born * (1.0 - born) * 4.0;
    float twinkle = 0.65 + 0.35 * sin(uTime * (1.4 + h.y * 3.0) + h.x * 40.0);
    // Radius stays under 0.2 of a cell, inside the cell whatever the jitter.
    float core = pow(1.0 - smoothstep(0.0, mix(0.11, 0.2, light), length(g - centre)), 1.5);
    hue = h.y;
    return core * present * (born * (0.45 + light) * twinkle + flash * 0.9);
  }

  void main() {
    vec4 field = texture2D(uField, vScreen);
    float aspect = uViewport.x / max(uViewport.y, 1.0);
    // Click: a gravitational ripple runs through the phenomenon.
    vec2 fromClick = (vScreen - uPulse.xy) * vec2(aspect, 1.0);
    float wave = exp(-pow((length(fromClick) - uPulse.z * 0.95) * 12.0, 2.0)) * exp(-uPulse.z * 1.6) * uPulse.w;
    vec2 iuv = (vUv - 0.5) * uPad + 0.5;
    vec2 p = iuv - field.rg * vec2(1.0 / aspect, 1.0) * 0.02 * (1.0 - uOpen) + normalize(fromClick + 1e-4) * vec2(1.0 / uAspect, 1.0) * wave * 0.012;
    vec2 q = (p - HEART) * vec2(uAspect, 1.0);
    float r = length(q);
    // The cursor's trail opens a window onto it even before a figure is woken.
    float peek = smoothstep(0.2, 0.6, field.b) * (1.0 - uOpen);
    float bloom = max(uDraw, peek);
    float shown = max(smoothstep(0.0, 0.06, uDraw), peek * 0.75);
    vec3 amber = vec3(1.0, 0.70, 0.36);
    vec3 emission = vec3(0.0);
    if (uKind < 0.5) {
      float hue1, hue2, hue3;
      float fine = swarm(p, uGrain, 0.4, bloom, 0.3, hue1);
      float mid = swarm(p, uGrain * 0.6, 1.3, bloom, 0.12, hue2);
      float giant = swarm(p, uGrain * 0.3, 2.1, bloom, 0.05, hue3);
      // Mostly white and blue-white suns, a few old gold giants among them.
      vec3 white = vec3(0.95, 0.94, 0.9), blue = vec3(0.74, 0.84, 1.0), gold = vec3(1.0, 0.78, 0.5);
      emission = mix(mix(white, blue, step(0.55, hue1)), gold, step(0.88, hue1)) * fine * 1.4
        + mix(white, blue, step(0.5, hue2)) * mid * 1.5 + mix(white, gold, step(0.6, hue3)) * giant * 1.8;
      // Unresolved starlight: the picture's own glow behind the swarm, as a real cluster has.
      emission += mix(gold, white, 0.6) * (exp(-r * r / 0.03) * 0.3 + exp(-r * r / 0.5) * 0.08 + glowAt(p, r) * 0.22) * bloom;
    } else if (uKind < 1.5) {
      // Eskimo Nebula: a dying star breathing out shell after shell of gas.
      float reach = bloom * 1.5;
      float lobes = fbm(q * 4.0 + vec2(uTime * 0.05, 0.0));
      float within = smoothstep(reach, reach - 0.14, r + (lobes - 0.5) * 0.18);
      float shells = pow(0.5 + 0.5 * sin(r * 26.0 - uTime * 0.8 + fbm(q * 5.0) * 2.5), 8.0);
      float gas = glowAt(p, r) * within * (0.25 + 1.2 * shells) * (0.7 + 0.6 * lobes);
      float halo = within * shells * 0.35 * exp(-r * 2.2);
      float rim = exp(-pow((r - reach) * 16.0, 2.0)) * bloom * (1.0 - uOpen) * (0.5 + 0.5 * lobes) * exp(-r * 1.5);
      vec3 cool = vec3(0.42, 0.8, 0.96);
      vec3 tint = mix(cool, amber, smoothstep(0.08, 0.7, r));
      float star = exp(-r * r / 0.0005) * 1.8 + exp(-r * r / 0.012) * 0.3;
      emission = tint * (gas + halo) + mix(cool, amber, 0.6) * rim * 0.9 + mix(vec3(0.92, 0.96, 1.0), cool, 0.3) * star * bloom;
    } else {
      // Veil Nebula: the silk a star left when it burst, hydrogen red beside oxygen teal.
      vec2 w = q * 2.2 + vec2(fbm(q * 1.7 + uTime * 0.02), fbm(q * 1.7 + 4.1 - uTime * 0.02)) * 1.2;
      float red = ridge(w * 3.0, 18.0) + ridge(w * 6.5 + 2.0, 22.0) * 0.5;
      float teal = ridge(w * 3.0 + vec2(0.07, 0.04), 18.0);
      float front = bloom * 1.8 - r + (fbm(q * 3.0) - 0.5) * 0.5;
      float swept = smoothstep(0.0, 0.15, front);
      float shock = exp(-front * front / 0.006) * (1.0 - uOpen) * smoothstep(0.0, 0.1, bloom);
      float gas = glowAt(p, r) * swept * (0.2 + 1.5 * red);
      vec3 rose = vec3(1.0, 0.36, 0.42), oxygen = vec3(0.32, 0.78, 0.9);
      emission = rose * (gas * 0.9 + red * (swept * 0.3 + shock * 1.2)) + oxygen * teal * (swept * 0.3 + shock * 1.0);
    }
    // Once the picture is open the phenomenon steps back to frame it.
    emission *= shown * (1.0 + wave * 2.5) * (1.0 - 0.35 * uOpen);
    // Opening clears the picture from the phenomenon's heart; its edge stays a cloud, never a frame.
    float wet = uOpen * 1.75 - 0.25 - r + (fbm(iuv * 5.0 + 3.0) - 0.5) * 0.45;
    float picture = smoothstep(0.0, 0.25, wet) * cloud(iuv);
    vec3 photo = texture2D(uMap, p).rgb;
    float vignette = 1.0 - smoothstep(0.7, 1.0, length((vUv - 0.5) * 2.0));
    vec3 color = photo * picture + emission * vignette * (1.0 - 0.7 * picture);
    gl_FragColor = vec4(color, picture) * uOpacity;
  }
`;
