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
  uniform float uCover, uWarp, uSpeed, uTravel, uBurst, uGlare, uTime;
  varying vec2 vUv;
  ${NOISE}
  #define TAU 6.28318530718
  const vec3 VOID = vec3(0.0018, 0.002, 0.0032);

  // Stars rushing past at relativistic speed, in log-polar space around the point we fly
  // towards. Aberration crowds them ahead; ahead is blueshifted, the rim reddened.
  vec3 starLayer(vec2 d, float count, float seed, float travel, float len) {
    float seen = length(d) / uViewport.y;
    // Aberration: at speed the sky ahead crowds into a narrowing cone.
    float r = seen * (1.0 + 2.5 * uSpeed * uSpeed);
    float u = atan(d.y, d.x) / TAU + 0.5;
    float lane = u * count;
    // Cells wrap around the circle, so there is no seam where the angle jumps.
    float column = mod(floor(lane), count);
    float z = log(r + 0.002) * 3.2 - travel;
    // Constant width in pixels: an angular cell is r * TAU / count wide.
    // A streak can outrun its own cell, so look back over the cells behind this one.
    float width = 0.9 / max(seen * uViewport.y * TAU / count, 0.001);
    float tail = 0.0, bright = 0.0;
    for (int k = 0; k < 3; k++) {
      float row = floor(z) - float(k);
      float h = hash12(vec2(column, row) + seed);
      if (h < 0.72) continue;
      float head = 0.15 + 0.7 * hash12(vec2(column, row) + seed + 4.7);
      // Behind its head a star leaves a streak; at rest it is a point.
      float t = z - row - head;
      float s = smoothstep(-len - 0.02, 0.0, t) * (1.0 - smoothstep(0.0, 0.03, t)) * (0.35 + 0.65 * smoothstep(-len, 0.0, t));
      // Off the lane centre, so the sky does not read as spokes.
      float across = fract(lane) - 0.2 - 0.6 * hash12(vec2(column, row) + seed + 9.3);
      s *= exp(-across * across / (width * width));
      float b = 0.4 + 0.6 * fract(h * 13.0);
      if (s * b > tail * bright) { tail = s; bright = b; }
    }
    float shift = clamp(seen * 1.6, 0.0, 1.0);
    vec3 tint = mix(vec3(0.70, 0.82, 1.0), mix(vec3(1.0, 0.92, 0.80), vec3(1.0, 0.55, 0.32), smoothstep(0.5, 1.0, shift)), smoothstep(0.1, 0.5, shift));
    return tint * tail * bright * 1.6;
  }

  void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
    float H = uViewport.y;
    vec3 col = VOID;
    float alpha = uCover;
    if (uWarp > 0.0) {
      vec2 d = px - uCenter;
      float r = length(d) / H;
      float len = 0.04 + uSpeed * uSpeed * 2.2;
      vec3 stars = starLayer(d, 70.0, 1.0, uTravel, len) + starLayer(d, 130.0, 9.0, uTravel * 1.3, len)
        + starLayer(d, 220.0, 17.0, uTravel * 1.7, len) * 0.7;
      // The far mouth: a point of light ahead that swells as we close in.
      float ahead = 0.004 + 0.05 * uSpeed * uSpeed;
      vec3 mouth = vec3(0.85, 0.92, 1.0) * exp(-r / ahead) * (0.6 + uSpeed) + vec3(1.0, 0.86, 0.66) * exp(-r / (ahead * 4.0)) * 0.25 * uSpeed;
      float edge = 1.0 - smoothstep(0.35, 1.1, r) * 0.6;
      col = mix(col, VOID + stars * edge + mouth, uWarp);
      alpha = max(alpha, uWarp);
    }
    if (uBurst > 0.0) {
      // Bursting through: the mouth's light swallows the frame from the centre out.
      float r = length(px - uCenter) / H;
      float fill = 1.0 - smoothstep(uBurst * 2.2 - 0.6, uBurst * 2.2, r + 0.05);
      vec3 light = mix(vec3(1.0, 0.88, 0.70), vec3(1.0, 0.98, 0.95), exp(-r * 2.0));
      col = mix(col, light, fill * uBurst);
      alpha = max(alpha, fill * uBurst);
    }
    if (uGlare > 0.0) {
      // Out of the far mouth: the glare drains back into it and leaves clear sky behind;
      // the last of the light keeps streaming outward as it slows.
      vec2 d = px - uMouth;
      float r = length(d) / H;
      float reach = mix(0.03, 2.6, uGlare * uGlare * uGlare);
      float glow = exp(-r / (reach * 0.35)) + 0.6 * exp(-r / reach);
      float u = atan(d.y, d.x) / TAU + 0.5;
      float n = mix(noise2(vec2(u * 90.0, log(r + 0.01) * 2.0 - uTravel)), noise2(vec2((u - 1.0) * 90.0, log(r + 0.01) * 2.0 - uTravel)), u);
      float rays = pow(n, 5.0) * smoothstep(0.02, 0.2, r) * uGlare * 0.9;
      vec3 light = mix(vec3(1.0, 0.80, 0.55), vec3(1.0, 0.97, 0.92), clamp(glow * 0.7, 0.0, 1.0));
      float a = clamp(glow * uGlare + rays, 0.0, 1.0);
      col = alpha > 0.001 ? mix(col, light, a) : light;
      alpha = max(alpha, a);
    }
    gl_FragColor = vec4(col, alpha);
  }
`;
