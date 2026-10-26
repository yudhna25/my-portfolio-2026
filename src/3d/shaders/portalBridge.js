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

const NOISE3 = /* glsl */ `
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash13(i), hash13(i + vec3(1, 0, 0)), f.x), mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x), mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float fbm3(vec3 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * noise3(p); p = p * 2.07 + 5.3; a *= 0.52; }
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
  uniform float uCover, uWarp, uSpeed, uTravel, uRing, uRingGlow, uReveal, uRibbon, uTime, uPlunge, uFlow;
  varying vec2 vUv;
  ${NOISE}
  ${NOISE3}
  #define TAU 6.28318530718
  const vec3 VOID = vec3(0.0018, 0.002, 0.0032);
  // Inside the throat the dark leans to indigo.
  const vec3 DEEP = vec3(0.0026, 0.0024, 0.0072);

  float starDot(vec2 p, float scale, float density) {
    vec2 c = floor(p * scale), f = fract(p * scale) - 0.5;
    float h = hash12(c);
    vec2 o = vec2(hash12(c + 3.1), hash12(c + 7.7)) - 0.5;
    vec2 e = f - o * 0.6;
    // Sharp points; only the rare bright one gets a soft halo.
    float b = fract(h * 37.0);
    return step(1.0 - density, h) * (exp(-dot(e, e) * 900.0) + exp(-dot(e, e) * 120.0) * 0.25 * step(0.85, b)) * (0.3 + 0.7 * b * b);
  }
  // The sky on the far side, seen through the mouth before we reach it: a rose and teal
  // band of the About nebula with a dark dust lane edge.
  vec3 skyThere(vec2 q) {
    float y = q.y * 0.9 + 0.3 * sin(q.x * 0.7);
    float band = gauss(y * 2.45);
    float n = fbm2(q * 2.2 + 11.0), m = fbm2(q * 6.0 - 3.0);
    float dust = smoothstep(0.45, 0.75, fbm2(q * 3.5 + 2.0)) * gauss((y + 0.05) * 5.5);
    vec3 c = vec3(0.003, 0.005, 0.010);
    c += mix(vec3(0.05, 0.16, 0.20), vec3(0.30, 0.08, 0.15), smoothstep(0.4, 0.7, n)) * band * pow(m, 1.5) * 0.9;
    c += vec3(0.9, 0.85, 0.8) * band * gauss(y * 6.3) * 0.25;
    c *= 1.0 - dust * 0.85;
    c += vec3(0.95, 0.94, 1.0) * (starDot(q, 10.0, 0.16) * 1.4 + starDot(q + 5.0, 26.0, 0.18) * 0.6) * (0.6 + band);
    return c;
  }

  void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
    float H = uViewport.y;
    vec3 col = VOID;
    float alpha = uCover;
    vec2 d = px - uCenter;
    float seen = length(d) / H;
    float ringR = uRing / H;
    float inside = 1.0 - smoothstep(ringR * 0.985, ringR, seen);
    if (uWarp > 0.0) {
      // The throat of a spinning hole, in five acts: frame dragging winds its walls of
      // plasma into a slow red river, then tighter and hotter helices with a cold indigo
      // veil turning the other way inside. Near the horizon time all but stops: the river
      // freezes into silver threads and one gravitational-wave pulse crosses the frame.
      // Then time returns at once, and the far mouth opens into the ring we fly through.
      // uFlow is the idle clock, slowed by the same freeze on the JS side.
      float P = uPlunge;
      float build = smoothstep(0.30, 0.55, P);
      float freeze = smoothstep(0.53, 0.58, P) * (1.0 - smoothstep(0.66, 0.70, P));
      float burst = smoothstep(0.66, 0.74, P) * (1.0 - smoothstep(0.86, 0.95, P));
      float opening = smoothstep(0.78, 1.0, P);
      float Pw = P - 0.9 * (clamp(P, 0.56, 0.68) - 0.56);
      float pr = (P - 0.565) / 0.10;
      float pulse = pr > 0.0 && pr < 1.0 ? gauss((seen - pr * 1.4) / 0.045) * (1.0 - pr) : 0.0;
      float sr = seen * (1.0 + 0.05 * pulse);
      float a = atan(d.y, d.x);
      float z = 0.32 / max(sr, 0.002);
      float travel = uFlow * 0.35 + Pw * 5.0 + Pw * Pw * Pw * 22.0;
      float spin = uFlow * 0.12 + Pw * Pw * 7.0;
      float th = a + z * (0.25 + 1.3 * build) - spin;
      // Noise on the wound circle itself, so there is no seam where the angle wraps.
      vec3 q = vec3(cos(th) * 1.6, sin(th) * 1.6, z * 0.55 - travel);
      float n = fbm3(q);
      float thread = 1.0 - abs(fbm3(q * vec3(1.4, 1.4, 0.6) + 9.0) * 2.0 - 1.0);
      float heat = n * n * (0.5 + 0.25 * build) + pow(thread, 10.0) * (0.4 + 0.3 * build);
      // Plasma coming toward us is brighter on one side.
      float doppler = 1.0 + 0.55 * cos(a - 2.6);
      heat = clamp(heat * doppler * (1.0 + 0.5 * burst), 0.0, 1.6);
      vec3 fire = mix(vec3(0.0), vec3(0.45, 0.04, 0.02), clamp(heat / 0.35, 0.0, 1.0));
      fire = mix(fire, vec3(1.0, 0.45, 0.12), clamp((heat - 0.35) / 0.45, 0.0, 1.0));
      fire = mix(fire, vec3(1.0, 0.88, 0.66), clamp((heat - 0.8) / 0.5, 0.0, 1.0));
      fire *= 0.15 + 0.8 * heat;
      fire *= 0.35 + 0.65 * smoothstep(0.0, 0.4, P);
      // Thin-film iridescence on the edges of the hottest threads.
      float edge = smoothstep(0.78, 0.88, thread) * (1.0 - smoothstep(0.9, 0.97, thread));
      vec3 irid = 0.5 + 0.5 * cos(TAU * (thread * 4.0 + vec3(0.0, 0.33, 0.67)) + uFlow * 0.4);
      fire += irid * edge * edge * n * 0.10 * build * (1.0 - opening);
      // Frozen: the river turns to silver crystal.
      vec3 ice = vec3(0.55, 0.68, 0.95) * pow(thread, 18.0) * (0.6 + n) * 1.4 + vec3(0.04, 0.05, 0.09) * n;
      fire = mix(fire, ice, freeze * 0.9);
      // Magnetic flare rings rushing toward us, strongest when time returns.
      float f = fract(z * 0.35 - travel * 0.18);
      fire += vec3(1.0, 0.78, 0.5) * gauss((f - 0.5) * 14.0) * smoothstep(0.32, 0.5, P) * (1.0 - opening) * (1.0 - freeze) * n * n * (1.6 + 2.0 * burst);
      // The inner veil of cold indigo gas, turning the other way: two depths at once.
      float z2 = 0.18 / max(sr, 0.002);
      float th2 = a - z2 * 0.8 + spin * 0.7 + 1.3;
      float gas = fbm3(vec3(cos(th2) * 2.2, sin(th2) * 2.2, z2 * 0.9 - travel * 0.6));
      vec3 cold = mix(vec3(0.10, 0.10, 0.42), vec3(0.04, 0.32, 0.40), smoothstep(0.4, 0.7, fbm2(d / H * 3.0 + uFlow * 0.05)));
      fire += cold * pow(1.0 - abs(gas * 2.0 - 1.0), 16.0) * build * (1.0 - opening) * (0.5 + 0.3 * freeze) * smoothstep(0.05, 0.3, sr) * 0.6;
      // The walls sink into the dark throat and fall away around the opening mouth.
      fire *= exp(-z * 0.10) * smoothstep(0.0, 0.25, sr * 3.0) * smoothstep(ringR, ringR * 1.6, sr);
      // The whole outside sky, squeezed by aberration into a ring of blue-silver stars ahead.
      float halo = max(mix(0.42, 0.16, P), ringR * 2.2);
      vec2 sc = vec2((a / TAU + 0.5) * 240.0 + uFlow * 1.5, log(sr) * 34.0);
      vec2 cf = fract(sc) - 0.5;
      float sh = hash12(floor(sc));
      float star = step(0.93, sh) * exp(-dot(cf, cf) * 22.0) * (0.4 + 0.6 * fract(sh * 31.0));
      fire += vec3(0.75, 0.85, 1.0) * star * gauss((sr - halo) / (0.02 + 0.03 * (1.0 - P))) * 2.2 * (1.0 - opening);
      fire += vec3(0.85, 0.9, 1.0) * pulse * 0.25;
      fire = 1.0 - exp(-fire * 1.15);
      vec3 throat = DEEP + fire;
      // The photon ring at the mouth's edge, split blue inside and amber outside.
      float w = 0.0025 + ringR * 0.012;
      float spread = 1.0 / (1.0 + ringR * 1.5);
      vec3 ring = vec3(gauss((seen - ringR * 0.992) / w), gauss((seen - ringR) / w), gauss((seen - ringR * 1.01) / w)) * vec3(0.9, 0.95, 1.0)
        + vec3(1.0, 0.72, 0.42) * gauss((seen - ringR * 1.04) / (w * 3.0)) * 0.35
        + vec3(0.7, 0.8, 1.0) * exp(-abs(seen - ringR) / (w * 8.0)) * 0.12 * spread;
      ring *= spread * uRingGlow * 1.05;
      // Through the mouth: the far sky, wide-angle and softly lit, until the real one shows.
      float spinThere = uTime * 0.04 + uSpeed * 1.4;
      mat2 turn = mat2(cos(spinThere), -sin(spinThere), sin(spinThere), cos(spinThere));
      vec2 dir = d / max(seen * H, 0.0001);
      float k = seen / max(ringR, 0.0001);
      vec2 qs = dir * (k / sqrt(max(1.0 - k * k * 0.92, 0.05))) * (2.2 - uSpeed * 1.3);
      vec3 there = skyThere(turn * qs * 1.6) * (1.0 - 0.6 * smoothstep(0.85, 1.0, k))
        + vec3(0.9, 0.93, 1.0) * exp(-k * 2.5) * 0.12;
      throat = mix(throat, there, inside * (1.0 - uReveal)) + ring;
      col = mix(col, throat, uWarp);
      alpha = max(alpha * (1.0 - inside * uReveal), uWarp * (1.0 - inside * uReveal));
      // Once revealed, only the ring's own light is laid over the sky inside.
      if (inside * uReveal > 0.0) {
        float glow = clamp(max(ring.r, max(ring.g, ring.b)), 0.0, 1.0);
        col = mix(col, ring / max(glow, 0.001), inside * uReveal);
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
