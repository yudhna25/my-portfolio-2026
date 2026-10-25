// Einstein–Rosen bridge for the Hero → About crossing. Two passes share one pixel-space
// camera (see bridgeCamera in utils/portal.js): a polar sheet mesh that carries the Hero
// lockup and its stars down the funnel, and a full-screen veil for the void around the
// sheet, the throat, the flash of every later chapter, and the light echo on the far side.

const NOISE = /* glsl */ `
  float hash12(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
  }
  // pow() of a negative base is undefined in GLSL; square explicitly.
  float gauss(float x) { return exp(-x * x); }
  float fbm2(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * noise2(p); p = p * 2.03 + 7.1; a *= 0.5; }
    return s;
  }
`;

export const BRIDGE_SHEET_VERT = /* glsl */ `
  attribute vec2 aPolar;
  uniform vec2 uViewport, uPivot;
  uniform float uLift, uFocal, uDistance, uDepth, uThroat, uCos, uSin, uRmax;
  varying vec2 vSheet;
  varying float vW, vSlope, vDeep;
  void main() {
    float r = pow(aPolar.x, 2.2) * uRmax;
    vec2 q = vec2(cos(aPolar.y), sin(aPolar.y)) * r;
    float z = uDepth * pow(uThroat / (r + uThroat), 1.3);
    float ry = q.y * uCos + z * uSin - uLift, rz = -q.y * uSin + z * uCos;
    float w = (uDistance + rz) / uFocal;
    vSheet = q; vW = w;
    vSlope = 1.3 * z / (r + uThroat);
    vDeep = z / max(uDepth, 1.0);
    // Clip coordinates stay linear in w, so the GPU clips what passes behind the camera.
    vec2 base = vec2(uPivot.x / uViewport.x * 2.0 - 1.0, 1.0 - uPivot.y / uViewport.y * 2.0);
    gl_Position = vec4(base * w + vec2(q.x, -ry) / uViewport * 2.0, 0.9 * w - 0.02, w);
  }
`;

export const BRIDGE_SHEET_FRAG = /* glsl */ `
  uniform sampler2D uLockup;
  uniform vec2 uViewport, uOrigin;
  uniform float uLockupReady, uSlide, uAlpha, uDepthAmount, uTime, uBare;
  varying vec2 vSheet;
  varying float vW, vSlope, vDeep;
  ${NOISE}
  const vec3 VOID = vec3(0.0018, 0.002, 0.0032);
  void main() {
    float H = uViewport.y;
    float r = length(vSheet);
    // Matter flows down the throat: each point shows what started further out. The radial
    // map compresses toward the throat, so stars and letters stretch into long bands.
    float L = mix(0.08, 1.15, uSlide) * H;
    float source = r + uSlide * L * exp(-r / (L * 1.08));
    float twist = uSlide * 3.6 * exp(-r / (0.45 * L + 1.0));
    float angle = atan(vSheet.y, vSheet.x) + twist;
    vec2 src = vec2(cos(angle), sin(angle)) * source;
    // How much the map stretches here; 1 at rest, near 0 at the throat.
    float stretch = 1.0 - uSlide / 1.08 * exp(-r / (L * 1.08));
    vec2 uv = (uOrigin + src) / uViewport;
    vec4 lockup = uLockupReady > 0.5 && uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0
      ? texture2D(uLockup, vec2(uv.x, 1.0 - uv.y)) : vec4(0.0);
    // Stars live in the sheet's own coordinates, so they slide with it.
    vec2 cell = floor(src / 26.0);
    float h = hash12(cell);
    vec2 star = (cell + 0.2 + 0.6 * vec2(hash12(cell + 3.1), hash12(cell + 7.7))) * 26.0;
    vec2 d = src - star;
    // Measure along the radius in display pixels, so a stretched star becomes a streak.
    vec2 radial = normalize(src + 0.0001);
    float along = dot(d, radial) / max(stretch, 0.04), across = dot(d, vec2(-radial.y, radial.x));
    float glint = step(0.86, h) * exp(-(along * along + across * across) * 0.9) * (0.35 + 0.65 * fract(h * 37.0));
    float dust = fbm2(src * 0.0035) * 0.10 + fbm2(src * 0.012 + 3.0) * 0.04;
    vec3 col = VOID + vec3(0.05, 0.055, 0.075) * dust;
    col += vec3(0.93, 0.92, 0.89) * glint;
    col = mix(col, lockup.rgb, lockup.a);
    // The funnel reads by its walls: steeper sheet catches a little warm light, and matter
    // heats toward amber as it nears the throat.
    float heat = (1.0 - stretch) * uDepthAmount;
    vec3 ember = vec3(1.0, 0.70, 0.36);
    float lum = max(max(col.r, col.g), col.b);
    col = mix(col, ember * lum * 1.6, clamp(heat * 1.2, 0.0, 0.85));
    col += ember * 0.012 * smoothstep(0.05, 1.2, vSlope) * uDepthAmount;
    // Deeper sheet sees less of the sky, but a band of the hole's own light warms the
    // walls just above the throat, so the well reads by its glow and not by lines.
    col *= mix(1.0, 0.3, vDeep * vDeep * uDepthAmount);
    col += ember * (0.05 * gauss((vDeep - 0.6) / 0.16) + 0.008 * gauss((vDeep - 0.3) / 0.12)) * uDepthAmount
      * (0.75 + 0.5 * fbm2(normalize(vSheet + 0.0001) * 2.0 + vec2(vDeep * 8.0, -uTime * 0.3)));
    // Swallowed matter fades into the throat; the far sheet melts into the void.
    float swallow = smoothstep(0.02, 0.18, stretch);
    float horizon = 1.0 - smoothstep(3.0, 7.0, vW);
    if (uBare > 0.5) {
      // The far mouth gives back only what fell in: hot letters on clear sky, cooling to
      // ivory as they settle.
      float hot = 1.0 - stretch;
      vec3 glyph = mix(lockup.rgb, vec3(1.0, 0.86, 0.62) * 1.6, clamp(hot * 1.4, 0.0, 0.9));
      gl_FragColor = vec4(glyph, lockup.a * swallow * uAlpha);
      return;
    }
    gl_FragColor = vec4(mix(VOID, col, swallow), uAlpha * horizon);
  }
`;

export const BRIDGE_VEIL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const BRIDGE_VEIL_FRAG = /* glsl */ `
  uniform vec2 uViewport, uCenter, uMouth;
  uniform float uCover, uWarp, uSpeed, uTravel, uRing, uRingGlow, uReveal, uRibbon, uTime;
  varying vec2 vUv;
  ${NOISE}
  #define TAU 6.28318530718
  const vec3 VOID = vec3(0.0018, 0.002, 0.0032);
  // Inside the throat the dark leans to indigo.
  const vec3 DEEP = vec3(0.0026, 0.0024, 0.0072);

  // Noise around a circle (u in 0..1) with no seam where the angle wraps.
  float fbmRing(float u, float count, float y) {
    u = fract(u);
    return mix(fbm2(vec2(u * count, y)), fbm2(vec2((u - 1.0) * count, y)), u);
  }

  // Starlight rushing past in log-polar space around the point we fly towards, wound into
  // a spiral by the spinning throat. Aberration crowds it ahead; ahead is blueshifted.
  vec3 starLayer(float seen, float u, float count, float seed, float travel, float len, float wind) {
    float r = seen * (1.0 + 2.5 * uSpeed * uSpeed);
    float z = log(r + 0.002) * 3.2 - travel;
    float lane = fract(u + wind * log(r + 0.02)) * count;
    float column = mod(floor(lane), count);
    // Constant width in pixels: an angular cell is r * TAU / count wide.
    float width = 0.7 / max(seen * uViewport.y * TAU / count, 0.001);
    float tail = 0.0, bright = 0.0;
    // A streak can outrun its own cell, so look back over the cells behind this one.
    for (int k = 0; k < 3; k++) {
      float row = floor(z) - float(k);
      float h = hash12(vec2(column, row) + seed);
      if (h < 0.76) continue;
      float head = 0.15 + 0.7 * hash12(vec2(column, row) + seed + 4.7);
      float t = z - row - head;
      // Bright head, tail thinning away like a comet's.
      float s = exp(-max(t, 0.0) * 40.0) * smoothstep(-len - 0.02, 0.0, t) * pow(clamp(1.0 + t / (len + 0.02), 0.0, 1.0), 1.6);
      float across = fract(lane) - 0.2 - 0.6 * hash12(vec2(column, row) + seed + 9.3);
      s *= exp(-across * across / (width * width));
      float b = 0.35 + 0.65 * fract(h * 13.0);
      if (s * b > tail * bright) { tail = s; bright = b; }
    }
    float shift = clamp(seen * 1.5, 0.0, 1.0);
    vec3 tint = mix(vec3(0.72, 0.84, 1.0), mix(vec3(1.0, 0.93, 0.84), vec3(1.0, 0.62, 0.48), smoothstep(0.55, 1.0, shift)), smoothstep(0.12, 0.5, shift));
    return tint * tail * bright;
  }

  // What lies beyond the far mouth before we see it for real: a rose and teal haze.
  vec3 beyond(vec2 q) {
    float n = fbm2(q * 3.0 + vec2(uTime * 0.05, 0.0));
    float m = fbm2(q * 6.0 - 4.0);
    return mix(vec3(0.05, 0.11, 0.14), vec3(0.32, 0.10, 0.16), smoothstep(0.35, 0.7, n)) * (0.6 + 0.8 * m) * 0.5;
  }

  void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
    float H = uViewport.y;
    vec3 col = VOID;
    float alpha = uCover;
    vec2 d = px - uCenter;
    float seen = length(d) / H;
    float u = atan(d.y, d.x) / TAU + 0.5;
    float ringR = uRing / H;
    float inside = 1.0 - smoothstep(ringR * 0.985, ringR, seen);
    if (uWarp > 0.0) {
      float lr = log(seen + 0.01);
      float wind = 0.04 + 0.10 * uSpeed;
      // Nebular gas lining the throat: soft filaments flowing past, never dashes.
      float flow = uTravel * 0.22;
      float g1 = fbmRing(u + lr * wind * 1.4, 7.0, lr * 1.1 - flow);
      float g2 = fbmRing(u + lr * wind * 2.0 + 0.37, 17.0, lr * 1.9 - flow * 1.6);
      float gas = pow(g1, 2.6) * 0.9 + pow(g2, 3.2) * 0.6;
      float tone = fbm2(vec2(lr * 0.8 - flow * 0.3, 3.0));
      vec3 gasCol = mix(mix(vec3(0.14, 0.12, 0.40), vec3(0.06, 0.30, 0.34), tone), vec3(0.85, 0.50, 0.36), exp(-seen * 4.0));
      float veilFade = smoothstep(0.02, 0.18, seen) * (1.0 - 0.5 * smoothstep(0.5, 1.2, seen));
      float len = 0.05 + uSpeed * uSpeed * 2.0;
      vec3 stars = starLayer(seen, u, 90.0, 1.0, uTravel, len, wind) + starLayer(seen, u, 170.0, 9.0, uTravel * 1.35, len, wind) * 0.7;
      vec3 throat = DEEP + gasCol * gas * 0.22 * (0.4 + 0.6 * uSpeed) * veilFade + stars * 1.3 * smoothstep(0.0, 0.04, seen - ringR);
      // The far mouth's photon ring, split by the lens into blue inside and amber outside.
      float w = 0.0025 + ringR * 0.012;
      // As it sweeps past us the ring spreads its light thin.
      float spread = 1.0 / (1.0 + ringR * 1.5);
      vec3 ring = vec3(gauss((seen - ringR * 0.992) / w), gauss((seen - ringR) / w), gauss((seen - ringR * 1.01) / w)) * vec3(0.9, 0.95, 1.0)
        + vec3(1.0, 0.72, 0.42) * gauss((seen - ringR * 1.04) / (w * 3.0)) * 0.35
        + vec3(0.7, 0.8, 1.0) * exp(-abs(seen - ringR) / (w * 8.0)) * 0.12 * spread;
      ring *= spread;
      throat += ring * uRingGlow * 1.6;
      // Through the ring: a haze from the other side, until the real sky can show.
      throat = mix(throat, beyond(d / H / max(ringR, 0.01)) + ring * uRingGlow * 1.6, inside * (1.0 - uReveal));
      float a = uWarp * (1.0 - inside * uReveal);
      col = mix(col, throat, uWarp);
      alpha = max(alpha * (1.0 - inside * uReveal), a);
      // Once revealed, only the ring's own light is laid over the sky inside.
      if (inside * uReveal > 0.0) {
        float glow = clamp(max(ring.r, max(ring.g, ring.b)) * uRingGlow * 1.6, 0.0, 1.0);
        col = mix(col, ring * uRingGlow * 1.6 / max(glow, 0.001), inside * uReveal);
        alpha = mix(alpha, glow, inside * uReveal);
      }
    }
    if (uRibbon > 0.0) {
      // Time-reversed accretion: light ribbons unwinding out of the mouth.
      vec2 m = px - uMouth;
      float r = length(m) / H;
      float a = atan(m.y, m.x);
      float lr = log(r + 0.02);
      float phase = uTravel * 0.35 + uTime * 0.25;
      float arm = 0.5 + 0.5 * cos(2.0 * a - 4.2 * lr + phase);
      float silk = 0.65 + 0.7 * fbm2(vec2(cos(a), sin(a)) * 2.0 + vec2(lr * 3.0 - phase * 0.4, 0.0));
      // Fine filaments, many of them, rather than two broad arms.
      float arm2 = 0.5 + 0.5 * cos(5.0 * a - 7.0 * lr + phase * 1.3 + 1.7);
      float band = pow(arm, 60.0) * silk + pow(arm2, 90.0) * silk * 0.6;
      float fade = smoothstep(0.04, 0.14, r) * exp(-r / 0.45);
      float rib = clamp(band * fade * uRibbon * 0.45, 0.0, 1.0);
      vec3 ribCol = mix(vec3(1.0, 0.66, 0.36), vec3(1.0, 0.92, 0.80), silk - 0.5);
      col = alpha > 0.001 ? mix(col, ribCol, rib) : ribCol;
      alpha = max(alpha, rib);
    }
    gl_FragColor = vec4(col, alpha);
  }
`;
