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
  uniform float uLockupReady, uSlide, uAlpha, uDepthAmount, uTime;
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
    gl_FragColor = vec4(mix(VOID, col, swallow), uAlpha * horizon);
  }
`;

export const BRIDGE_VEIL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const BRIDGE_VEIL_FRAG = /* glsl */ `
  uniform vec2 uViewport, uMouth;
  uniform float uCover, uTunnel, uFuture, uFlash, uExit, uEcho, uLit, uFront, uTime, uScroll, uFar;
  varying vec2 vUv;
  ${NOISE}
  #define TAU 6.28318530718
  const vec3 VOID = vec3(0.0018, 0.002, 0.0032);

  // Log-spiral galaxy in a unit disc: core, arms and dust.
  vec3 galaxy(vec2 p, float size, float spin, vec3 arm, vec3 core) {
    p /= size;
    float r = length(p), a = atan(p.y, p.x);
    float lane = 0.5 + 0.5 * cos(2.0 * (a - spin - log(r + 0.02) * 2.6));
    float body = exp(-r * 3.2) * (0.25 + 0.75 * pow(lane, 3.0)) * (0.7 + 0.6 * fbm2(p * 9.0));
    return arm * body * 1.6 + core * exp(-r * r * 60.0);
  }
  float starfield(vec2 p, float scale) {
    vec2 c = floor(p * scale), f = fract(p * scale) - 0.5;
    float h = hash12(c);
    return step(0.94, h) * exp(-dot(f, f) * 40.0) * fract(h * 53.0);
  }
  // Each later chapter, as a glimpse framed in a unit disc.
  vec3 chapterSky(int k, vec2 p) {
    vec3 col = vec3(0.02, 0.022, 0.04) + vec3(0.9) * starfield(p + float(k), 18.0);
    if (k == 0) {
      // Skills: the light band.
      float d = dot(p, normalize(vec2(-0.5, 0.86)));
      float band = exp(-d * d * 60.0) * (0.75 + 0.5 * noise2(vec2(dot(p, vec2(0.86, 0.5)) * 14.0 - uTime, d * 40.0)));
      col += vec3(1.0, 0.76, 0.42) * band * 1.4;
    } else if (k == 1) {
      // Education: Arp 273, a rose and its small blue companion.
      col += galaxy(p - vec2(-0.22, 0.05), 0.55, 0.6, vec3(0.95, 0.45, 0.62), vec3(1.0, 0.85, 0.7));
      col += galaxy(p - vec2(0.36, -0.22), 0.22, 2.0, vec3(0.45, 0.62, 1.0), vec3(0.9, 0.95, 1.0));
    } else if (k == 2) {
      // Experience: the rose galaxy.
      col += galaxy(p, 0.8, -0.4, vec3(1.0, 0.42, 0.55), vec3(1.0, 0.8, 0.6));
    } else if (k == 3) {
      // Works: constellations drawn faintly between bright stars.
      vec2 s[6];
      s[0] = vec2(-0.55, -0.15); s[1] = vec2(-0.3, -0.38); s[2] = vec2(-0.02, -0.22);
      s[3] = vec2(0.2, -0.45); s[4] = vec2(0.42, -0.1); s[5] = vec2(0.12, 0.25);
      for (int i = 0; i < 6; i++) {
        col += vec3(1.0, 0.95, 0.88) * exp(-dot(p - s[i], p - s[i]) * 900.0) * 1.6;
        if (i < 5) {
          vec2 a = s[i], b = s[i + 1], ab = b - a;
          float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
          float d = length(p - a - ab * t);
          col += vec3(0.8, 0.85, 1.0) * exp(-d * d * 20000.0) * 0.25;
        }
      }
    } else {
      // Contact: the kilonova blooming around the final hole.
      float r = length(p);
      float shell = gauss((r - 0.32) / 0.11) * (0.6 + 0.8 * fbm2(normalize(p + 0.0001) * 2.0 + vec2(r * 8.0 - uTime, 0.0)));
      col += vec3(1.0, 0.68, 0.30) * shell * 1.5 + vec3(1.0, 0.9, 0.7) * exp(-r * 6.0) * 0.6;
      col *= smoothstep(0.08, 0.13, r);
    }
    return col;
  }
  // Noise around a circle with no seam where the angle wraps.
  float ring(float a, float count, float y) {
    float u = a / TAU + 0.5;
    return mix(noise2(vec2(u * count, y)), noise2(vec2((u - 1.0) * count, y)), u);
  }
  // Streaks flowing along a tunnel around c; direction > 0 runs inward.
  float walls(vec2 px, vec2 c, float direction, float speed) {
    vec2 d = px - c;
    float r = length(d) / uViewport.y, a = atan(d.y, d.x);
    float depth = log(r + 0.004);
    float s = ring(a, 160.0, depth * 1.2 + direction * speed);
    float s2 = ring(a, 64.0, depth * 0.7 + direction * speed * 0.8 + 11.0);
    return pow(s, 6.0) * 1.6 + pow(s2, 4.0) * 0.6;
  }
  void main() {
    vec2 px = vec2(vUv.x, 1.0 - vUv.y) * uViewport;
    vec3 col = VOID;
    float alpha = uCover;
    // Faint far stars above the leaning sheet.
    col += vec3(0.8) * starfield(px / uViewport.y, 70.0) * 0.5 * uFar;
    if (uTunnel > 0.0) {
      vec2 d = px - uMouth;
      float r = length(d) / uViewport.y;
      float flow = uTime * 0.35 + uScroll * 40.0;
      float w = walls(px, uMouth, 1.0, flow);
      vec3 wallCol = mix(vec3(0.93, 0.88, 0.80), vec3(1.0, 0.68, 0.34), noise2(normalize(d + 0.0001) * 3.0 + 5.0));
      vec3 tunnel = VOID + wallCol * w * smoothstep(0.02, 0.35, r) * 0.55;
      // Every later chapter rushes past, nearest on top; blueshifted at the peak.
      for (int k = 4; k >= 0; k--) {
        float u = (uFuture - float(k) * 0.17) / 0.32;
        if (u <= 0.0 || u >= 1.15) continue;
        float radius = 0.012 * exp(u * 6.2);
        float inside = 1.0 - smoothstep(radius * 0.97, radius, r);
        if (inside <= 0.0) continue;
        vec3 sky = chapterSky(k, d / uViewport.y / radius);
        float fade = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.85, 1.12, u));
        tunnel = mix(tunnel, sky, inside * fade);
        tunnel += vec3(0.75, 0.85, 1.0) * gauss((r - radius) / (0.006 + radius * 0.03)) * 0.6 * fade;
      }
      float blue = sin(3.14159 * clamp(uFuture, 0.0, 1.0)) * 0.22;
      tunnel = mix(tunnel, vec3(dot(tunnel, vec3(0.3, 0.4, 0.3))) * vec3(0.75, 0.9, 1.25), blue);
      col = mix(col, tunnel, uTunnel);
      alpha = max(alpha, uTunnel);
    }
    if (uEcho > 0.0 || uExit > 0.0) {
      // Far side: dark dust lit shell by shell by the flash from the throat.
      float r = length(px - uMouth);
      float shell = gauss((r - uFront) / (uFront * 0.035 + 6.0)) + 0.7 * gauss((r - uFront * 0.84) / (uFront * 0.03 + 6.0));
      float behind = 1.0 - smoothstep(uFront * 0.9, uFront, r);
      float lit = clamp(uLit + (1.0 - uLit) * (behind * 0.55 + shell), 0.0, 1.0);
      float dark = (1.0 - lit) * (1.0 - uLit);
      float grain = 0.55 + 0.9 * fbm2(px / uViewport.y * 6.0);
      vec3 rim = vec3(1.0, 0.84, 0.66) * shell * grain * 0.28 * (1.0 - uLit);
      float out_ = walls(px, uMouth, -1.0, uTime * 0.35 + uScroll * 40.0) * uExit * smoothstep(0.0, 0.25, r / uViewport.y);
      vec3 streak = vec3(0.95, 0.86, 0.72) * out_ * 0.5;
      col = VOID * dark + rim + streak;
      alpha = max(dark, max(max(rim.r, streak.r), 0.0));
      // Premultiplied light over transparent dark: lift alpha so the rim shows.
      col /= max(alpha, 0.0001);
    }
    col = mix(col, vec3(1.0, 0.97, 0.92), uFlash);
    alpha = max(alpha, uFlash);
    gl_FragColor = vec4(col, alpha);
  }
`;
