// Schwarzschild null geodesics in Cartesian coordinates, rs = 1:
// x'' = -1.5 |x cross x'|² x / |x|⁵, equivalent to u'' = 1.5u² - u.
// See Bruneton 2020, equation 8: https://arxiv.org/abs/2010.08735.
// Finite RK4 integration and procedural emission are approximations; this is
// not NASA's offline simulation or its original fluid/temperature data.
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
  uniform float uFinaleEnabled, uFinaleHole, uFinaleOrigin;
  uniform vec4 uFinaleGas;
  vec2 portalRayUV(vec2 uv) {
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
  ${PORTAL_IMAGE_GLSL}
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
  float diskEmission(vec3 p, vec3 ray) {
    float r = length(p.xz);
    float angle = atan(p.z, p.x);
    // Keplerian shear: inner lanes move faster, bright knots are stretched.
    float phase = angle - uTime * 0.42 * pow(3.0 / r, 1.5);
    vec3 domain = vec3(r * 0.9, cos(phase) * 6.0, sin(phase) * 6.0);
    float knots = turbulence(domain);
    float lane = sin(r * 12.0 + knots * 8.0);
    float fine = sin(r * 28.0 + noise(domain * 2.7) * 5.0);
    float bands = 0.12 + 0.75 * pow(0.5 + 0.5 * lane, 2.0)
      + 0.13 * pow(0.5 + 0.5 * fine, 3.0);
    float profile = pow(3.0 / r, 3.2) * smoothstep(3.0, 3.25, r)
      * (1.0 - smoothstep(5.5, 9.0, r));
    float speed = sqrt(0.5 / (r - 1.0));
    vec3 velocity = vec3(p.z, 0.0, -p.x) / r;
    float towardObserver = dot(velocity, -normalize(ray));
    float shift = sqrt((1.0 - 1.0 / r) / (1.0 - 1.0 / length(uObserver)))
      * sqrt(1.0 - speed * speed) / (1.0 - speed * towardObserver);
    // Relativistic beaming, monochrome at the user's explicit preference.
    return uDiskIntensity * 2.8 * profile * bands * (0.4 + 0.9 * knots * knots) * pow(shift, 3.0);
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
    float aperture = portalCoverage(vUv);
    if ((uPortalEnabled > 0.5 && uPortalVisibility <= 0.00001)
      || (uFinaleEnabled > 0.5 && uFinaleHole <= 0.00001)) discard;
    if (aperture <= 0.0) discard;
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
    if (sqrt(momentum2) > 9.6 || (observerRadius > 9.0 && dot(p, v) > 0.0)) discard;
    float light = 0.0;
    float coverage = 0.0;
    float impact = sqrt(momentum2);
    float rimWidth = max(fwidth(impact) * 1.25, 0.008);
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
        vec3 hit = mix(previous, p, t);
        float diskRadius = length(hit);
        if (diskRadius >= 3.0 && diskRadius <= 9.0) {
          light = diskEmission(uDiskFrame * hit, uDiskFrame * mix(previousVelocity, v, t));
          coverage = 1.0;
          break;
        }
      }
      if (radius < 1.01) { coverage = 1.0; break; }
      if (radius > max(observerRadius + 1.0, 24.0) && dot(p, v) > 0.0) break;
      // Critical rays beyond the finite budget must not expose background stars.
      if (i == TRACE_STEPS - 1) coverage = 1.0;
    }
    // Critical impact parameter = 3√3/2. The narrow white rim stays outside
    // captured rays; foreground gas is preserved by the same HDR alpha mask.
    float rim = exp(-pow((impact - 2.598076) / rimWidth, 2.0))
      * smoothstep(2.598076 - rimWidth * 0.4, 2.598076 + rimWidth * 0.4, impact)
      * step(dot(direction, radial), 0.0);
    light += rim * 1.65 * uDiskIntensity;
    coverage = max(coverage, rim);
    gl_FragColor = vec4(vec3(light), coverage * aperture);
  }
`;

export const BLACK_HOLE_COPY = /* glsl */ `
  uniform sampler2D uImage;
  varying vec2 vUv;
  ${PORTAL_IMAGE_GLSL}
  // Two depth layers of the existing value-noise recipe, not a volumetric engine.
  // Every coordinate is authored progress + the captured Works origin.
  float gasHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gasNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(gasHash(i), gasHash(i + vec2(1.0, 0.0)), u.x),
      mix(gasHash(i + vec2(0.0, 1.0)), gasHash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float gasFbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < FINALE_OCTAVES; i++) { v += a * gasNoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
    return v;
  }
  vec4 finaleGas(vec2 uv) {
    if (uFinaleGas.x + uFinaleGas.z < 0.00001) return vec4(0.0);
    vec2 p = (uv - uRayCenter) * uPortalViewport / uPortalViewport.y;
    float collapse = uFinaleGas.y;
    float growth = smoothstep(0.44, 0.70, uFinaleGas.w);
    float radius = mix(mix(0.07, 1.3, growth), 0.08, collapse);
    float angle = atan(p.y, p.x) + uFinaleOrigin + growth * 1.2 + collapse * (2.5 + 1.5 * exp(-length(p) * 5.0));
    vec2 q = vec2(cos(angle), sin(angle)) * length(p) / radius;
    q.y /= mix(0.8, 0.17, collapse);
    float warp = gasFbm(q * 2.7 + vec2(13.7, 8.4));
    float nearGas = gasFbm(q * 5.4 + warp * 1.6 + vec2(31.0, growth * 0.8));
    float farGas = gasFbm(q * 2.4 - warp * 0.6 + vec2(8.0, 27.0));
    float envelope = exp(-dot(q, q) * 0.8);
    float strands = smoothstep(0.27, 0.65, nearGas) * 0.7 + smoothstep(0.3, 0.7, farGas) * 0.3;
    // Dark lanes and a left reading pocket prevent a flat white/full-screen flash.
    float lanes = smoothstep(0.19, 0.40, warp);
    float pocket = 1.0 - 0.65 * exp(-dot((uv - vec2(0.17, 0.58)) * vec2(3.0, 3.5), (uv - vec2(0.17, 0.58)) * vec2(3.0, 3.5)));
    float density = strands * envelope * lanes * pocket * uFinaleGas.x;
    float flare = exp(-dot(p, p) * 1800.0) * uFinaleGas.z;
    float alpha = clamp(density * 1.8 + flare, 0.0, 0.9);
    // Gas stays below the bloom threshold; only the compact collision/disk emits HDR.
    return vec4(vec3(mix(0.18, 0.82, strands) * alpha + flare * 1.7), alpha);
  }
  void main() {
    vec4 image = portalImage(uImage, vUv);
    if (uFinaleEnabled > 0.5) {
      image.a *= uFinaleHole;
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
      vec2 dustPx = (vUv - uPortalCenter) * uPortalViewport;
      float twist = uPortalPull * 0.5 * exp(-length(dustPx) / 120.0);
      dustPx = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * dustPx * (1.0 + uPortalPull * 2.0);
      vec2 cell = floor(dustPx / 7.0);
      float grain = fract(sin(dot(cell, vec2(127.1, 311.7))) * 43758.5453);
      float dust = step(0.99, grain) * exp(-dot(fract(dustPx / 7.0) - 0.5, fract(dustPx / 7.0) - 0.5) * 80.0)
        * exp(-length(dustPx) / 100.0) * uPortalDust * (1.0 - image.a);
      a = max(a, dust);
      rgb += vec3(dust * 0.7);
      gl_FragColor = vec4(rgb / max(a, 0.00001), a);
      return;
    }
    if (image.a < 0.001) discard;
    gl_FragColor = image;
  }
`;
