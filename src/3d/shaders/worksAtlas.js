// Works as a night-sky star atlas. Each project is a plate in the atlas: the mythological
// figure is the engraved overlay, the project picture is cut beneath it in silver hatching
// (the way Uranometria and Hevelius were engraved), and opening a project turns the figure
// away like a page and hand-tints the plate with a watercolour wash, as old atlases were.
// The cursor's gravity field bends the engraved lines it passes.

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
`;

// Mythological figure (the Stellarium line art). It wakes on hover: the ink is redrawn
// outward from the brightest star with an amber burin front, and breathes faintly.
// Opening curls it over its left edge like a turned page.
export const ART_VERT = /* glsl */ `
  uniform vec2 uSize;
  uniform float uFlip;
  varying vec2 vUv;
  varying float vFacing;
  ${PASS_SCREEN}
  void main() {
    vUv = uv;
    float along = position.x + uSize.x * 0.5;
    float angle = uFlip * 3.0 * (1.0 + 0.3 * along / uSize.x);
    vec3 p = vec3(-uSize.x * 0.5 + along * cos(angle), position.y, position.z + along * sin(angle) * 0.9);
    vFacing = cos(angle);
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    passScreen(clip);
    gl_Position = clip;
  }
`;

export const ART_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uField;
  uniform vec2 uOrigin, uViewport;
  uniform float uReveal, uFlip, uTime, uOpacity, uIdle;
  varying vec2 vUv;
  varying float vFacing;
  ${SCREEN}
  ${NOISE}
  void main() {
    vec4 field = texture2D(uField, vScreen);
    float aspect = uViewport.x / max(uViewport.y, 1.0);
    // Living ink: a slow flow in the lines, plus the cursor's pull.
    vec2 flow = (vec2(noise(vUv * 6.0 + uTime * 0.15), noise(vUv * 6.0 - uTime * 0.12 + 7.0)) - 0.5) * 0.004 * uReveal;
    vec2 uv = vUv + flow - field.rg * vec2(1.0 / aspect, 1.0) * 0.012;
    vec4 art = texture2D(uMap, uv);
    float r = length(vUv - uOrigin);
    float front = uReveal * 1.6 - r + (fbm(vUv * 9.0) - 0.5) * 0.12;
    float drawn = smoothstep(0.0, 0.05, front);
    float burin = exp(-front * front / 0.0012) * smoothstep(0.0, 0.15, uReveal) * (1.0 - uFlip);
    float ink = art.a * max(uIdle, drawn * (0.5 + 0.1 * sin(uTime * 1.3 + r * 9.0)));
    vec3 ivory = vec3(0.93, 0.92, 0.89);
    vec3 color = mix(ivory, vec3(1.0, 0.70, 0.36), clamp(burin * 1.5 + field.a * 0.5, 0.0, 1.0));
    float alpha = (ink + art.a * burin * 0.9) * uOpacity * smoothstep(-0.2, 0.25, vFacing);
    gl_FragColor = vec4(color, alpha);
  }
`;

export const PLATE_VERT = /* glsl */ `
  varying vec2 vUv;
  ${PASS_SCREEN}
  void main() {
    vUv = uv;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    passScreen(clip);
    gl_Position = clip;
  }
`;

// The project plate: silver hatching whose weight follows the picture's light, cut line by
// line from the brightest star; on open, a watercolour wash and the atlas plate border.
export const PLATE_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uField;
  uniform vec2 uOrigin, uViewport;
  uniform float uDraw, uOpen, uTime, uOpacity, uAspect, uLines;
  varying vec2 vUv;
  ${SCREEN}
  ${NOISE}
  float hatch(vec2 p, float angle, float weight, out float index) {
    vec2 n = vec2(cos(angle), sin(angle));
    // Engravers swell their lines along the form; a slow wave keeps them hand-cut.
    float s = dot(p, n) + sin(dot(p, vec2(-n.y, n.x)) * 0.09 + angle * 3.0) * 0.55;
    index = floor(s);
    float d = abs(fract(s) - 0.5);
    float aa = fwidth(s) * 0.8;
    return (1.0 - smoothstep(weight - aa, weight + aa, d)) * step(0.02, weight);
  }
  void main() {
    vec4 field = texture2D(uField, vScreen);
    float aspect = uViewport.x / max(uViewport.y, 1.0);
    vec2 uv = vUv - field.rg * vec2(1.0 / aspect, 1.0) * 0.02 * (1.0 - uOpen);
    vec3 photo = texture2D(uMap, uv).rgb;
    float light = pow(dot(photo, vec3(0.299, 0.587, 0.114)), 0.85);
    vec2 p = uv * vec2(uAspect, 1.0) * uLines;
    float k1, k2;
    float ink = max(hatch(p, -0.49, light * 0.42, k1), hatch(p * 1.15, 0.56, (light - 0.58) * 0.8, k2));
    // Cut line by line outward from the brightest star; the burin front glows amber.
    float r = length((vUv - uOrigin) * vec2(uAspect, 1.0)) / uAspect;
    float front = uDraw * 1.9 - r - hash(vec2(k1, 3.0)) * 0.12;
    float cut = smoothstep(0.0, 0.025, front);
    float burin = exp(-front * front / 0.0006) * (1.0 - uOpen) * smoothstep(0.0, 0.15, uDraw);
    // Hand-tinted wash, spreading unevenly; pigment pools at its edge.
    // Starts dry: below zero everywhere until the page begins to turn.
    float wet = uOpen * 1.75 - 0.25 - r + (fbm(vUv * 5.0 + 3.0) - 0.5) * 0.45;
    float wash = smoothstep(0.0, 0.18, wet);
    float pool = smoothstep(0.0, 0.03, wet) * (1.0 - smoothstep(0.03, 0.12, wet)) * (1.0 - smoothstep(0.6, 1.0, uOpen));
    vec3 ivory = vec3(0.93, 0.92, 0.89);
    vec3 paper = photo * (0.9 + 0.2 * fbm(vUv * 40.0)) * (1.0 - 0.35 * pool);
    // Silver ink only until the wash brings the picture's colour in under the lines.
    vec3 color = mix(ivory, mix(paper, ivory, ink * 0.2), wash);
    color = mix(color, vec3(1.0, 0.70, 0.36), clamp(burin * 1.4, 0.0, 1.0));
    // Before it is opened the engraving is vignetted like a plate cut into the sky.
    float vignette = mix(1.0 - smoothstep(0.78, 1.08, length((vUv - 0.5) * 2.0)), 1.0, uOpen);
    float alpha = max(ink * cut * 0.8 * vignette, wash * 0.96) + burin * ink * vignette;
    // Plate border: double rule with hour ticks between, as on an atlas sheet.
    vec2 m = min(vUv, 1.0 - vUv) * vec2(uAspect, 1.0);
    float edge = min(m.x, m.y);
    float px = fwidth(edge);
    float rule = (1.0 - smoothstep(0.0, px * 1.5, abs(edge - 0.03))) + (1.0 - smoothstep(0.0, px * 1.5, abs(edge - 0.045))) * 0.7;
    float along = (m.x < m.y ? vUv.y : vUv.x) * 24.0;
    float tick = (1.0 - smoothstep(fwidth(along) * 0.6, fwidth(along) * 1.6, abs(fract(along + 0.5) - 0.5)))
      * step(0.03, edge) * step(edge, 0.045);
    float frame = max(rule, tick * 0.8) * smoothstep(0.55, 1.0, uOpen);
    color = mix(color, ivory, frame);
    alpha = max(alpha, frame * 0.9);
    alpha *= mix(smoothstep(0.0, 0.03, edge), 1.0, frame);
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * uOpacity);
  }
`;

// RA/Dec graticule from the figure's own gnomonic projection, inked in with the figure.
export const GRID_VERT = /* glsl */ `
  attribute float aRadius;
  varying float vRadius;
  void main() {
    vRadius = aRadius;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GRID_FRAG = /* glsl */ `
  uniform float uReveal, uOpacity;
  varying float vRadius;
  void main() {
    float drawn = smoothstep(vRadius - 0.1, vRadius, uReveal * 1.4);
    float fade = 1.0 - smoothstep(0.55, 1.0, vRadius);
    gl_FragColor = vec4(vec3(0.93, 0.92, 0.89), drawn * fade * 0.2 * uOpacity);
  }
`;
