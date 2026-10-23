// Schwarzschild null geodesics in Cartesian coordinates, rs = 1:
// x'' = -1.5 |x cross x'|² x / |x|⁵, equivalent to u'' = 1.5u² - u.
// See Bruneton 2020, equation 8: https://arxiv.org/abs/2010.08735.
// Finite RK4 integration and procedural emission are approximations; this is
// not NASA's offline simulation or its original fluid/temperature data.
import { FORMATION_GLSL } from './formation';

export const BLACK_HOLE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// The HDR pass already traces composed screen pixels; copy/mask never magnify it.
export const PORTAL_IMAGE_GLSL = /* glsl */ `
  uniform float uPortalEnabled, uPortalMini, uPortalScale, uPortalVisibility, uPortalDust, uPortalPull;
  uniform vec2 uPortalCenter, uRayCenter, uPortalRadius, uPortalViewport;
  uniform float uFinaleEnabled, uFinaleHole, uFinaleOrigin, uFinaleScale;
  uniform vec4 uFinaleGas;
  uniform vec4 uOpening;
  vec2 portalRayUV(vec2 uv) {
    if (uFinaleEnabled > 0.5) return uRayCenter + (uv - uRayCenter) / max(uFinaleScale, 0.001);
    return uPortalEnabled > 0.5 && uPortalMini > 0.5
      ? uRayCenter + (uv - uPortalCenter) / max(uPortalScale, 0.001) : uv;
  }
  float portalCoverage(vec2 uv) {
    if (uPortalEnabled < 0.5 || uPortalMini < 0.5) return 1.0;
    vec2 offset = (uv - uPortalCenter) * uPortalViewport;
    // Feather outside the disk, with an aperture aligned to its physical plane.
    offset = mat2(0.573576, -0.819152, 0.819152, 0.573576) * offset;
    return 1.0 - smoothstep(0.96, 1.0, length(offset / max(uPortalRadius, vec2(1.0))));
  }
  vec4 portalImage(sampler2D image, vec2 uv) {
    return texture2D(image, uv);
  }
`;

export const BLACK_HOLE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uDiskIntensity;
  uniform vec3 uObserver;
  uniform mat4 uCameraMatrix;
  uniform mat4 uInverseProjection;
  uniform mat3 uDiskFrame;
  uniform float uDiskWarm;
  // Angular speed at the innermost stable orbit (rad/s) and the flow-layer period (s).
  #define DISK_SPIN 0.85
  #define DISK_FLOW 7.0
  ${PORTAL_IMAGE_GLSL}
  // Soft amber blackbody seen through the disk's own glare: embers, orange, gold,
  // warm cream at the hottest inner lanes. Never blue-white, never saturated red.
  vec3 diskPalette(float t) {
    vec3 c = mix(vec3(0.62, 0.17, 0.03), vec3(1.0, 0.43, 0.10), smoothstep(0.05, 0.42, t));
    c = mix(c, vec3(1.0, 0.64, 0.27), smoothstep(0.38, 0.74, t));
    return mix(c, vec3(1.0, 0.84, 0.60), smoothstep(0.72, 1.2, t));
  }
  varying vec2 vUv;

  float hash(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
      mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
      mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float turbulence(vec3 p) {
    return noise(p) * 0.55 + noise(p * 2.03) * 0.3 + noise(p * 4.01) * 0.15;
  }
  ${FORMATION_GLSL}
  // Gas streaks, periodic in angle: radially fine, azimuthally long. Octaves finer
  // than the pixel footprint settle to their mean instead of aliasing into rings.
  float diskGas(float r, float phase, float seed, float footprint) {
    vec3 q = vec3(r * 2.4 + seed, cos(phase) * 1.7, sin(phase) * 1.7);
    float sum = 0.0, amplitude = 0.5, scale = 2.4;
    for (int i = 0; i < DISK_OCTAVES; i++) {
      float keep = 1.0 - smoothstep(0.25, 0.75, footprint * scale);
      sum += amplitude * mix(0.5, noise(q), keep);
      q = q * vec3(2.3, 2.0, 2.0) + vec3(1.7, 3.1, 0.6);
      amplitude *= 0.5; scale *= 2.3;
    }
    return sum / (1.0 - amplitude * 2.0);
  }
  // Emission (rgb) and opacity (a) where a ray crosses the disk plane.
  vec4 diskEmission(vec3 p, vec3 ray, float footprint) {
    float r = length(p);
    float angle = atan(p.z, p.x);
    // Keplerian shear: inner lanes turn faster. Two staggered flow layers restart
    // in turn, each faded out at its reset, so the shear never winds the gas into
    // ever finer rings however long the page is open.
    float omega = DISK_SPIN * pow(3.0 / max(r, 2.2), 1.5);
    float cycle = uTime / DISK_FLOW;
    float ta = fract(cycle), tb = fract(cycle + 0.5);
    float wa = 1.0 - abs(2.0 * ta - 1.0), wb = 1.0 - wa;
    float base = uTime * DISK_SPIN * 0.12;
    float ga = diskGas(r, angle + base + omega * ta * DISK_FLOW, floor(cycle) * 7.31, footprint);
    float gb = diskGas(r, angle + base + omega * tb * DISK_FLOW, floor(cycle + 0.5) * 7.31 + 3.7, footprint);
    // Restore the contrast the crossfade averages away.
    float gas = 0.5 + (ga * wa + gb * wb - 0.5) / sqrt(wa * wa + wb * wb);
    float streak = smoothstep(0.30, 0.80, gas);
    // Hot knots: shorter clumps riding the same two flows, faded below a pixel.
    float knotScale = 1.0 - smoothstep(0.2, 0.6, footprint * 9.0);
    float ka = noise(vec3(r * 9.0 + floor(cycle) * 5.1, cos(angle + base + omega * ta * DISK_FLOW) * 4.5, sin(angle + base + omega * ta * DISK_FLOW) * 4.5));
    float kb = noise(vec3(r * 9.0 + floor(cycle + 0.5) * 5.1 + 2.3, cos(angle + base + omega * tb * DISK_FLOW) * 4.5, sin(angle + base + omega * tb * DISK_FLOW) * 4.5));
    float knots = mix(1.0, 0.55 + 0.9 * smoothstep(0.35, 0.9, 0.5 + (ka * wa + kb * wb - 0.5) / sqrt(wa * wa + wb * wb)), knotScale);
    // Broad annuli breathe under the streaks; low frequency, never a vinyl groove.
    float annuli = 0.78 + 0.22 * sin(r * 4.3 + gas * 5.0);
    float inner = smoothstep(2.95, 3.3, r);
    float profile = pow(3.0 / r, 2.6) * inner * (1.0 - smoothstep(5.8, 9.0, r));
    // Gas past the innermost stable orbit spirals in as faint, reddened threads.
    float plunge = smoothstep(1.7, 3.0, r) * (1.0 - inner) * 0.16;
    float density = (profile * annuli + plunge) * (0.22 + 1.55 * streak * streak) * knots;
    float orbit = max(r, 3.0);
    float speed = sqrt(0.5 / (orbit - 1.0));
    vec3 velocity = vec3(p.z, 0.0, -p.x) / r;
    float towardObserver = dot(velocity, -normalize(ray));
    float shift = sqrt(max(1.0 - 1.0 / r, 0.02) / (1.0 - 1.0 / length(uObserver)))
      * sqrt(1.0 - speed * speed) / (1.0 - speed * towardObserver);
    // Observed temperature: hotter inward, blue-shifted (here: whiter) where the gas
    // approaches, redder where it recedes; the finale grade leans it to embers.
    float temperature = pow(3.0 / orbit, 0.62) * shift * (0.86 + 0.28 * streak) - 0.12 * uDiskWarm;
    float intensity = uDiskIntensity * 2.5 * density * pow(shift, 3.0);
    float opacity = clamp((inner * (1.0 - smoothstep(6.5, 9.0, r)) * (0.30 + 0.75 * streak) + plunge) * 1.1, 0.0, 0.94);
    return vec4(diskPalette(temperature) * intensity, opacity);
  }
  vec3 acceleration(vec3 p, float angularMomentum2) {
    // RK4 substages can cross the horizon; bound gravity before any division.
    float r2 = max(dot(p, p), 1.0);
    return -1.5 * angularMomentum2 * p / (r2 * r2 * sqrt(r2));
  }
  void advance(inout vec3 p, inout vec3 v, float h, float angularMomentum2) {
    vec3 a1 = acceleration(p, angularMomentum2);
    vec3 v2 = v + a1 * (h * 0.5);
    vec3 a2 = acceleration(p + v * (h * 0.5), angularMomentum2);
    vec3 v3 = v + a2 * (h * 0.5);
    vec3 a3 = acceleration(p + v2 * (h * 0.5), angularMomentum2);
    vec3 v4 = v + a3 * h;
    vec3 a4 = acceleration(p + v3 * h, angularMomentum2);
    p += h / 6.0 * (v + 2.0 * v2 + 2.0 * v3 + v4);
    v += h / 6.0 * (a1 + 2.0 * a2 + 2.0 * a3 + a4);
  }
  void main() {
    vec4 formation = stellarFormation(vUv);
    float birth = uFinaleEnabled > 0.5 ? smoothstep(0.0, 0.4, uFinaleHole)
      : uOpening.x > 0.5 ? smoothstep(0.40, 0.50, uOpening.y) : 1.0;
    if (birth <= 0.00001) { gl_FragColor = formation; return; }
    float aperture = portalCoverage(vUv);
    if ((uPortalEnabled > 0.5 && uPortalVisibility <= 0.00001)
      || (uFinaleEnabled > 0.5 && uFinaleHole <= 0.00001)) discard;
    if (aperture <= 0.0) { gl_FragColor = formation; return; }
    vec4 view = uInverseProjection * vec4(portalRayUV(vUv) * 2.0 - 1.0, 1.0, 1.0);
    vec3 direction = normalize(mat3(uCameraMatrix) * (view.xyz / view.w));
    vec3 p = uObserver;
    float observerRadius = max(length(p), 1.1);
    vec3 radial = p / observerRadius;
    // Convert a static observer's local orthonormal ray to coordinate velocity.
    vec3 vr = dot(direction, radial) * radial;
    vec3 v = vr + (direction - vr) / sqrt(1.0 - 1.0 / observerRadius);
    vec3 momentum = cross(p, v);
    float momentum2 = dot(momentum, momentum);
    // No emission beyond r=9: b=9/sqrt(1-1/9)=9.546 cannot reach the disk.
    if (sqrt(momentum2) > 9.6 || (observerRadius > 9.0 && dot(p, v) > 0.0)) { gl_FragColor = formation; return; }
    vec3 light = vec3(0.0);
    float transmit = 1.0;
    float coverage = 0.0;
    int crossings = 0;
    float impact = sqrt(momentum2);
    float rimWidth = max(fwidth(impact), 0.0005);
    // Pixel footprint on the disk, taken here in uniform control flow.
    float footprint = rimWidth * 1.6;
    vec3 diskNormal = vec3(uDiskFrame[0].y, uDiskFrame[1].y, uDiskFrame[2].y);
    for (int i = 0; i < TRACE_STEPS; i++) {
      vec3 previous = p;
      vec3 previousVelocity = v;
      float r = length(p);
      float h = max(0.035, r * TRACE_STEP);
      float inwardSpeed = max(-dot(p, v) / r, 0.0);
      if (inwardSpeed > 0.0) h = min(h, (r - 1.0) * 0.4 / inwardSpeed);
      advance(p, v, h, momentum2);
      float radius = length(p);
      float previousPlane = dot(diskNormal, previous), plane = dot(diskNormal, p);
      if (previousPlane * plane <= 0.0 && abs(previousPlane - plane) > 0.000001) {
        float t = previousPlane / (previousPlane - plane);
        // Hermite refinement resolves curved disk intersections without tracing extra rays.
        vec3 c1 = previousVelocity * h;
        vec3 c2 = 3.0 * (p - previous) - 2.0 * c1 - v * h;
        vec3 c3 = 2.0 * (previous - p) + c1 + v * h;
        for (int refine = 0; refine < 2; refine++) {
          vec3 point = previous + t * (c1 + t * (c2 + t * c3));
          float slope = dot(diskNormal, c1 + t * (2.0 * c2 + t * 3.0 * c3));
          if (abs(slope) > 0.000001) t = clamp(t - dot(diskNormal, point) / slope, 0.0, 1.0);
        }
        vec3 hit = previous + t * (c1 + t * (c2 + t * c3));
        float diskRadius = length(hit);
        if (diskRadius >= 1.7 && diskRadius <= 9.0) {
          // The disk is translucent: rays pass on to its lensed far side and to the
          // higher-order images that thread the photon ring, each one demagnified.
          vec4 gas = diskEmission(uDiskFrame * hit, uDiskFrame * mix(previousVelocity, v, t),
            footprint * pow(23.0, float(crossings)));
          light += transmit * gas.rgb;
          transmit *= 1.0 - gas.a;
          crossings++;
          if (transmit < 0.04 || crossings >= DISK_CROSSINGS) { coverage = 1.0 - transmit; break; }
        }
      }
      if (radius < 1.01) { coverage = 1.0; break; }
      if (radius > max(observerRadius + 1.0, 24.0) && dot(p, v) > 0.0) { coverage = 1.0 - transmit; break; }
      // Critical rays beyond the finite budget must not expose background stars.
      if (i == TRACE_STEPS - 1) coverage = 1.0;
    }
    // Critical impact parameter = 3√3/2. The narrow white rim stays outside
    // captured rays; foreground gas is preserved by the same HDR alpha mask.
    float rim = exp(-pow((impact - 2.598076) / rimWidth, 2.0))
      * smoothstep(2.598076 - rimWidth * 0.4, 2.598076 + rimWidth * 0.4, impact)
      * step(dot(direction, radial), 0.0);
    light += rim * 0.85 * uDiskIntensity * diskPalette(1.05);
    coverage = max(coverage, rim);
    // Light is already premultiplied by the disk's own opacity; keep a little cover
    // under faint translucent gas so the half-float division stays finite.
    float glow = max(light.r, max(light.g, light.b));
    coverage = max(coverage, min(glow * 0.25, 1.0));
    float holeAlpha = coverage * aperture * birth;
    if (uOpening.x > 0.5 && dot(light, vec3(1.0)) < 0.00001) holeAlpha = coverage * aperture
      * (uFinaleEnabled > 0.5 ? smoothstep(0.0, 0.2, uFinaleHole) : smoothstep(0.40, 0.44, uOpening.y));
    float a = holeAlpha + formation.a * (1.0 - holeAlpha);
    gl_FragColor = vec4((light * aperture * birth + formation.rgb * formation.a * (1.0 - holeAlpha)) / max(a, 0.00001), a);
  }
`;

export const BLACK_HOLE_COPY = /* glsl */ `
  uniform sampler2D uImage;
  uniform sampler2D uOpeningText;
  uniform vec4 uOpeningLens;
  uniform float uOpeningReach;
  uniform vec4 uOpeningRect;
  uniform float uFinaleZoom;
  varying vec2 vUv;
  ${PORTAL_IMAGE_GLSL}
  vec4 openingSample(vec2 uv) {
    vec2 local = (uv - uOpeningRect.xy) / uOpeningRect.zw;
    // Sample first: mip selection needs derivatives from every pixel of the quad.
    vec4 color = texture2D(uOpeningText, local);
    vec2 inside = step(vec2(0.0), local) * step(local, vec2(1.0));
    return color * inside.x * inside.y;
  }
  // Opening: a raster of the Hero lockup, bent by a point lens of Einstein radius
  // uOpeningLens.y (CSS px) around the O. Rays inside the ring sample the far side.
  // Idle Hero (uOpeningReach > 0): a mirror of the year in uOpeningRect, with a lens bounded
  // to that reach so its outer band is undeflected and crossfades into the masked DOM copy.
  vec4 openingText(vec2 uv) {
    if (uOpeningLens.x < 0.5 || uOpeningLens.w <= 0.0) return vec4(0.0);
    vec2 d = (uv - uPortalCenter) * uPortalViewport;
    float r = max(length(d), 1.0);
    float bound = uOpeningReach > 0.0 ? 1.0 - smoothstep(0.45, 0.8, r / uOpeningReach) : 1.0;
    // Linear, like the CSS radial-gradient mask it complements.
    float fade = uOpeningReach > 0.0 ? clamp((1.0 - r / uOpeningReach) / 0.2, 0.0, 1.0) : 1.0;
    if (fade <= 0.0) return vec4(0.0);
    vec2 shift = d / r * (uOpeningLens.y * uOpeningLens.y / r) * bound / uPortalViewport;
    vec4 red = openingSample(uv - shift * (1.0 + uOpeningLens.z));
    vec4 green = openingSample(uv - shift);
    vec4 blue = openingSample(uv - shift * (1.0 - uOpeningLens.z));
    vec3 rgb = vec3(red.r * red.a, green.g * green.a, blue.b * blue.a);
    return vec4(rgb, max(green.a, max(red.a, blue.a))) * uOpeningLens.w * fade;
  }
  // Kilonova: a raymarched fireball in screen-height units around the projected BH,
  // radius uFireball.x, heat .y (1 = blue-white, 0.2 = embers), density .z, flattening .w.
  uniform vec4 uFireball;
  uniform float uFireTime;
  float fireHash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1) * 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float fireNoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(fireHash(i), fireHash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(fireHash(i + vec3(0.0, 1.0, 0.0)), fireHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(fireHash(i + vec3(0.0, 0.0, 1.0)), fireHash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(fireHash(i + vec3(0.0, 1.0, 1.0)), fireHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
  }
  float fireFbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < FINALE_OCTAVES; i++) { v += a * fireNoise(p); p = p * 2.02 + vec3(3.1, 1.7, 5.3); a *= 0.5; }
    return v;
  }
  // Approximate blackbody ramp: embers, orange, yellow-white, white, blue-white.
  vec3 blackbody(float t) {
    vec3 c = mix(vec3(0.32, 0.03, 0.01), vec3(1.0, 0.30, 0.06), smoothstep(0.0, 0.35, t));
    c = mix(c, vec3(1.0, 0.72, 0.40), smoothstep(0.30, 0.60, t));
    c = mix(c, vec3(1.0, 0.95, 0.88), smoothstep(0.55, 0.85, t));
    return mix(c, vec3(0.70, 0.82, 1.0), smoothstep(0.85, 1.2, t));
  }
  vec4 kilonova(vec2 tilted) {
    float radius = uFireball.x, heat = uFireball.y, density = uFireball.z, squash = uFireball.w;
    if (radius <= 0.0 || density <= 0.0) return vec4(0.0);
    vec2 q = tilted / radius;
    float q2 = dot(q, q);
    if (q2 > 1.3) return vec4(0.0);
    // March front to back along the view axis through the bounding sphere.
    float chord = sqrt(1.3 - q2), dz = 2.0 * chord / float(FIRE_STEPS);
    vec3 rgb = vec3(0.0);
    float alpha = 0.0;
    for (int i = 0; i < FIRE_STEPS; i++) {
      vec3 pos = vec3(q.x, q.y * (1.0 + 6.0 * squash), -chord + (float(i) + 0.5) * dz);
      // As the remnant flattens it shears into the disk plane: inner gas turns faster.
      float plane = length(pos.xz);
      float turn = squash * (1.8 / (0.22 + plane) + uFireTime * 0.25);
      pos.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * pos.xz;
      float r = length(pos);
      float shell = smoothstep(1.0, mix(0.70, 0.35, squash), r) * mix(1.0, smoothstep(0.12, 0.6, r), 0.7 * (1.0 - heat))
        // The flattened remnant opens a gap where the new hole forms.
        * mix(1.0, smoothstep(0.06, 0.28, plane), squash);
      float n = fireFbm(pos * 2.6 + vec3(heat * 1.7, 0.0, uFireTime * 0.06));
      // Filaments burn hot; the gaps between them read as cooler, darker dust.
      float d = shell * smoothstep(0.42, 0.74, n + 0.2 * (1.0 - r)) * density * (1.0 - 0.6 * squash);
      float temperature = heat * (1.25 - 0.85 * r) + (n - 0.5) * 0.6;
      float absorbed = 1.0 - exp(-d * dz * 10.0);
      rgb += (1.0 - alpha) * blackbody(temperature) * (0.35 + 2.6 * temperature * temperature) * absorbed;
      alpha += (1.0 - alpha) * absorbed;
      if (alpha > 0.97) break;
    }
    // Unresolved hot core and a thin limb glow.
    float core = exp(-q2 * 16.0) * heat * heat * density * 1.8;
    float limb = exp(-abs(sqrt(q2) - 0.9) * 14.0) * 0.12 * density * heat * (1.0 - squash) * (1.0 - squash);
    rgb += blackbody(1.1) * core + blackbody(heat) * limb;
    alpha = max(alpha, clamp(core + limb, 0.0, 1.0));
    return vec4(rgb, alpha);
  }
  vec4 finaleGas(vec2 uv) {
    float progress = uFinaleGas.w;
    float burst = progress - 0.44;
    if (uFireball.z + uFinaleGas.z < 0.00001 && (burst < 0.0 || burst > 0.3)) return vec4(0.0);
    vec2 p = (uv - uRayCenter) * uPortalViewport / uPortalViewport.y / max(uFinaleZoom, 0.001);
    float growth = smoothstep(0.44, 0.70, progress);
    float aspect = uPortalViewport.x / uPortalViewport.y;
    float sweep = max(1.3, aspect) * 1.18;
    float r = length(p), angle = atan(p.y, p.x);
    // Screen axes of the tilted disk: x runs along its 55 degree diagonal.
    vec2 tilted = mat2(0.573576, -0.819152, 0.819152, 0.573576) * p;
    vec4 fire = kilonova(tilted);
    vec3 rgb = fire.rgb;
    float alpha = fire.a;
    // One shock front races ahead of the fireball across the frame.
    float waveRadius = 0.018 + sweep * growth;
    float ridge = r - waveRadius * (1.0 + 0.017 * sin(angle * 7.0 + uFinaleOrigin));
    float wave = exp(-pow(ridge / (0.003 + 0.008 * growth), 2.0)) + exp(-pow((ridge + 0.018) / 0.024, 2.0)) * 0.13;
    float arcs = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(angle * 3.0 + 0.5 * sin(angle * 11.0)), 2.0);
    wave *= arcs * smoothstep(0.44, 0.46, progress) * (1.0 - smoothstep(0.62, 0.70, progress)) * 0.55;
    rgb += vec3(0.85, 0.9, 1.0) * wave * (1.0 - alpha);
    alpha = max(alpha, clamp(wave, 0.0, 0.8));
    // The streams' point of convergence brightens before the merger.
    float core = exp(-pow(r / (0.010 + uFinaleGas.z * 0.026), 2.0)) * uFinaleGas.z;
    rgb += vec3(0.8, 0.88, 1.0) * core * 2.4;
    alpha = max(alpha, clamp(core, 0.0, 1.0));
    // Collision flash and an anamorphic streak across the screen.
    // Gated as a branch: before the collision the exponentials would overflow to NaN.
    if (burst >= 0.0) {
      float flare = exp(-burst * 22.0);
      float streak = flare * (exp(-abs(p.y) / (0.0015 + burst * 0.05)) * exp(-abs(p.x) / 0.8) * 1.4
        + exp(-abs(p.y) / 0.0009) * exp(-abs(p.x) / 0.3) * 1.2);
      float flash = exp(-burst * 60.0) * (0.2 + exp(-r / 0.3));
      rgb += vec3(0.6, 0.78, 1.0) * streak + vec3(1.0, 0.95, 0.88) * flash * 2.0;
      alpha = max(alpha, clamp(streak + flash, 0.0, 1.0));
    }
    return vec4(rgb, alpha);
  }
  // Authored photon echoes bracket the dark crossing; their clock is scroll, not time.
  float portalEcho(vec2 uv) {
    float p = uPortalPull;
    float pull = smoothstep(0.06, 0.18, p) * (1.0 - smoothstep(0.35, 0.43, p));
    float release = smoothstep(0.50, 0.56, p) * (1.0 - smoothstep(0.75, 0.88, p));
    if (pull + release < 0.0001 || uOpening.x > 0.5) return 0.0;
    vec2 px = (uv - uPortalCenter) * uPortalViewport;
    float r = length(px), angle = atan(px.y, px.x);
    float core = uPortalRadius.x * (0.48 / 2.8);
    float eject = clamp((p - 0.50) / 0.38, 0.0, 1.0);
    float light = 0.0;
    for (int i = 0; i < 3; i++) {
      float lane = float(i);
      float radius = p < 0.5 ? core * (1.22 + lane * 0.32) + 12.0
        : uPortalViewport.y * (0.035 + pow(eject, 0.8) * (0.6 + lane * 0.15));
      float wave = sin(angle * 3.0 + p * 18.0 + lane) * radius * 0.012;
      float line = exp(-pow((r - radius - wave) / max(fwidth(r), 1.1), 2.0));
      float arc = pow(max(0.0, sin(angle * 2.0 - p * 12.0 + lane * 1.7)), 6.0);
      light += line * arc / (1.0 + lane);
    }
    return light * (pull * 0.32 + release * 0.55);
  }
  void main() {
    vec4 image = portalImage(uImage, vUv);
    if (uFinaleEnabled > 0.5) {
      vec4 gas = finaleGas(vUv);
      float a = image.a + gas.a * (1.0 - image.a);
      if (a < 0.00001) discard;
      vec3 rgb = image.rgb * image.a + gas.rgb * (1.0 - image.a);
      gl_FragColor = vec4(rgb / a, a);
      return;
    }
    if (uPortalEnabled > 0.5) {
      float a = 1.0 - uPortalVisibility + image.a * uPortalVisibility;
      vec3 rgb = image.rgb * image.a * uPortalVisibility;
      // The lockup sits behind the hole and its disk.
      vec4 text = openingText(vUv);
      rgb += text.rgb * (1.0 - a);
      a += text.a * (1.0 - a);
      vec2 dustPx = (vUv - uPortalCenter) * uPortalViewport;
      float twist = uPortalPull * 0.5 * exp(-length(dustPx) / 120.0);
      dustPx = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * dustPx * (1.0 + uPortalPull * 2.0);
      vec2 cell = floor(dustPx / 7.0);
      float grain = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      float dust = step(0.99, grain) * exp(-dot(fract(dustPx / 7.0) - 0.5, fract(dustPx / 7.0) - 0.5) * 80.0)
        * exp(-length(dustPx) / 100.0) * uPortalDust * (1.0 - image.a);
      a = max(a, dust);
      rgb += vec3(dust * 0.7);
      float echo = portalEcho(vUv) * (1.0 - image.a);
      a = max(a, echo);
      rgb += vec3(echo * 0.85);
      gl_FragColor = vec4(rgb / max(a, 0.00001), a);
      return;
    }
    if (image.a < 0.001) discard;
    gl_FragColor = image;
  }
`;
