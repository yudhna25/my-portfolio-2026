// Works chapter: glass project cards on orbit around a compact lens, and the lens itself.
// Monochrome by default; amber (the hot inner disk) only where gravity is doing work.

export const WORKS_TRAIL = 8;

export const WORKS_CARD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Glass card: frosted fill, iridescent rim, the project image inside. The cursor trail
// (uv, energy, speed) swirls the image into a small accretion disk that settles back.
export const WORKS_CARD_FRAG = /* glsl */ `
  #define TRAIL ${WORKS_TRAIL}
  uniform sampler2D uMap;
  uniform float uMapReady, uImageAspect, uOpacity, uHover, uOpen, uTime, uRadius;
  uniform vec2 uSize;
  uniform vec4 uTrail[TRAIL];
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float box(vec2 p, vec2 extent, float r) {
    vec2 q = abs(p) - extent + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  vec2 rotate(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float edge = box(p, uSize * 0.5, uRadius);
    float aa = fwidth(edge) * 1.5;
    float inside = 1.0 - smoothstep(-aa, 0.0, edge);
    if (inside <= 0.0) discard;
    float aspect = uSize.x / uSize.y;

    // Swirl: each trail sample is a short-lived well; samples are inverted (pull from the
    // spiral) so the picture winds around the cursor instead of tearing.
    vec2 s = vUv;
    float well = 0.0, flash = 0.0, core = 0.0;
    for (int i = 0; i < TRAIL; i++) {
      vec4 t = uTrail[i];
      if (t.z <= 0.001) continue;
      vec2 d = (s - t.xy) * vec2(aspect, 1.0);
      float r = length(d);
      float w = t.z * exp(-r * r / 0.032);
      float turn = w * (2.2 + 4.0 * t.w) / (0.35 + 6.0 * r);
      d = rotate(d, -turn) * (1.0 + 0.45 * w);
      s = t.xy + d / vec2(aspect, 1.0);
      well = max(well, w);
      // Hot inner edge of the mini disk, brightest on fast strokes.
      flash = max(flash, t.z * (0.35 + t.w) * exp(-pow((r - 0.055) / 0.022, 2.0)));
      core = max(core, t.z * (1.0 - smoothstep(0.012, 0.03, r)));
    }
    // Torn pixels: the disturbed picture breaks into a jittered grain of sparks.
    vec2 cell = floor(s * vec2(aspect, 1.0) * 140.0);
    float grain = hash(cell + floor(uTime * 12.0));
    float spark = well > 0.04 ? step(grain, 1.0 - 0.6 * well) : 1.0;

    vec2 cover = vec2(min(1.0, aspect / uImageAspect), min(1.0, uImageAspect / aspect));
    vec2 image = (s - 0.5) * cover + 0.5;
    vec3 photo = texture2D(uMap, clamp(image, 0.0, 1.0)).rgb;
    float grey = dot(photo, vec3(0.299, 0.587, 0.114));
    float wake = max(uHover, uOpen);
    photo = mix(vec3(grey), photo, 0.25 + 0.75 * wake) * spark;
    float showImage = uMapReady * (0.12 + 0.46 * uHover + 0.84 * uOpen);

    // Frosted glass, a sheen across the top, and a thin iridescent rim.
    float sheen = smoothstep(0.35, 1.0, vUv.y) * 0.05 + smoothstep(0.6, 0.0, abs(vUv.x - vUv.y * 0.6 - 0.15)) * 0.025;
    float rim = 1.0 - smoothstep(0.0, aa * 2.5 + 0.004 * uSize.y, -edge);
    float angle = atan(p.y, p.x);
    vec3 iris = 0.55 + 0.45 * cos(6.2831 * (angle / 6.2831 + uTime * 0.05 + vec3(0.0, 0.33, 0.67)));
    vec3 rimColor = mix(vec3(1.0), iris, 0.35 + 0.4 * wake);
    vec3 color = vec3(0.035) + sheen + photo * showImage;
    color = mix(color, rimColor, rim * (0.32 + 0.5 * wake));
    color += vec3(1.0, 0.62, 0.22) * flash * 2.2;
    color *= 1.0 - core * 0.92;
    float alpha = (0.3 + 0.62 * uOpen + 0.25 * uHover) * (0.75 + 0.25 * spark);
    alpha = max(alpha, rim * 0.8);
    alpha = max(alpha, min(1.0, flash * 2.0));
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0) * inside * uOpacity);
  }
`;

export const WORKS_LENS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Point lens over the cards that orbit behind the hole (rendered to uScene, premultiplied).
// A thin tilted disk and the open project's name ride the same plane: their far half is
// sampled through the lens (lifted over the shadow), their near half crosses in front.
export const WORKS_LENS_FRAG = /* glsl */ `
  uniform sampler2D uScene;
  uniform sampler2D uText;
  uniform vec2 uResolution, uCenter;
  uniform float uEinstein, uShadow, uStrength, uTime, uWarm, uTextAlpha, uTextScroll;
  uniform vec4 uRing; // radius (px), cos(tilt), screen angle, glyph height (px)
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 rotate(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
  // Position in the tilted plane; y > 0 is the far half.
  vec2 planar(vec2 q, float tilt, float angle) { vec2 r = rotate(q, -angle); return vec2(r.x, r.y / tilt); }
  float disk(vec2 q) {
    vec2 d = planar(q, 0.16, 0.61);
    float r = length(d) / uShadow;
    float band = smoothstep(1.55, 1.8, r) * (1.0 - smoothstep(2.0, 3.0, r));
    float lanes = 0.65 + 0.35 * sin(r * 26.0 - uTime * 2.2 + atan(d.y, d.x) * 3.0);
    return 0.55 * band * lanes * pow(1.8 / max(r, 1.0), 2.0);
  }
  vec4 ringText(vec2 q, float far) {
    vec2 d = planar(q, uRing.y, uRing.z);
    if ((d.y > 0.0) != (far > 0.5)) return vec4(0.0);
    float rho = length(d);
    float v = 0.5 + (rho - uRing.x) / uRing.w;
    if (v < 0.0 || v > 1.0) return vec4(0.0);
    float u = fract(-atan(d.y, d.x) / 6.2831 + uTextScroll);
    return texture2D(uText, vec2(u, v));
  }

  void main() {
    vec2 q = gl_FragCoord.xy - uCenter;
    #ifdef FRONT_PASS
      // Second pass, over the front cards: only the near half of the name ring.
      gl_FragColor = vec4(ringText(q, 0.0).a) * uTextAlpha * uStrength;
      return;
    #endif
    float r = length(q);
    float reach = uEinstein * 4.5;
    float bound = 1.0 - smoothstep(reach * 0.5, reach, r);
    vec2 beta = q - q * (uEinstein * uEinstein / max(r * r, 1.0)) * bound;
    vec4 behind = texture2D(uScene, (uCenter + beta) / uResolution);
    // Faint lensed stars where the halo hides the real sky.
    vec2 star = floor(beta / 9.0);
    float twinkle = step(0.985, hash(star)) * (1.0 - smoothstep(0.1, 0.45, length(fract(beta / 9.0) - 0.5)));
    float halo = 1.0 - smoothstep(uShadow * 1.2, uShadow * 3.2, r);
    vec3 color = behind.rgb + vec3(twinkle * 0.55 * halo * (1.0 - behind.a));
    float alpha = behind.a + halo * 0.82 * (1.0 - behind.a);

    // Far half of the disk is lensed over the top of the shadow, near half in front.
    float back = disk(beta) * step(0.0, planar(beta, 0.16, 0.61).y);
    float front = disk(q) * step(planar(q, 0.16, 0.61).y, 0.0);
    float hot = mix(0.0, 1.0, uWarm);
    vec3 diskTint = mix(vec3(0.92), vec3(1.0, 0.68, 0.3), hot);
    float shadow = 1.0 - smoothstep(uShadow - 1.5, uShadow + 1.5, r);
    float photon = exp(-pow((r - uShadow * 1.06) / max(1.2, uShadow * 0.035), 2.0));
    color = color * (1.0 - shadow) + diskTint * back * (1.0 - shadow);
    color += mix(vec3(0.95), vec3(1.0, 0.75, 0.42), hot) * photon * 1.4;
    color += diskTint * front;
    alpha = max(alpha, shadow);
    alpha = max(alpha, min(1.0, photon + front + back));

    if (uTextAlpha > 0.001) {
      // Far half only; the near half is drawn by the front pass, over the cards.
      float ink = ringText(beta, 1.0).a * (1.0 - shadow) * 0.85;
      color = mix(color, vec3(1.0, 0.86, 0.66), ink * uTextAlpha);
      alpha = max(alpha, ink * uTextAlpha);
    }
    gl_FragColor = vec4(color, alpha) * uStrength;
  }
`;
