import { OPENING_SECONDS } from '@/3d/utils/opening';

// shortcut: cinematic screen-space lensing, not a metric solver; use geodesic background tracing for scientific visualization.
export const SPACETIME_GLSL = /* glsl */ `
  vec2 spacetimeWarp(vec2 point, float clock, float size, out float streak) {
    float r = max(length(point), 0.0001);
    float shock = smoothstep(0.0, 0.035, clock) * (1.0 - smoothstep(0.13, 0.24, clock));
    float fold = smoothstep(0.16, 0.42, clock) * (1.0 - smoothstep(0.55, 0.72, clock));
    float front = 0.025 + clock * 7.5;
    float shell = exp(-pow((r - front) / 0.16, 2.0));
    float gravity = exp(-r / max(0.2, size * 6.2));
    float echo = exp(-pow((r - front * 0.72) / 0.22, 2.0));
    float bend = shock * (shell * sin((r - front) * 15.0) * 0.24 - echo * 0.045);
    float lens = fold * size * 0.90 / (0.10 + r);
    float turn = fold * gravity * 1.9 / (0.3 + r);
    mat2 rotation = mat2(cos(turn), sin(turn), -sin(turn), cos(turn));
    streak = clamp(shock * (shell + echo * 0.2) + fold * gravity, 0.0, 1.0);
    return rotation * point * max(0.08, (r + bend + lens) / r);
  }
`;

// shortcut: procedural plasma and authored collapse, not radiation hydrodynamics; use offline simulation data for scientific visualization.
export const FORMATION_GLSL = /* glsl */ `
  // First Light (opening only): a pulse at the O, an inhale, then a burst with an
  // anamorphic streak and one shock ring. Clock: p = uOpening.y, burst at 0.40.
  vec4 firstLight(vec2 uv) {
    float p = uOpening.y;
    vec2 d = (uv - uPortalCenter) * uPortalViewport;
    float r = length(d), width = uPortalViewport.x;
    float load = smoothstep(0.0, 0.33, p);
    float inhale = smoothstep(0.33, 0.40, p);
    float pre = 1.0 - step(0.40, p);
    float pulse = 0.72 + 0.28 * sin(p * 33.0);
    float size = mix(2.2, 1.1, inhale);
    float energy = (0.35 + 1.4 * load) * pulse * (1.0 - inhale) + 4.0 * inhale;
    vec3 light = pre * energy * vec3(1.0, 0.97, 0.92)
      * (2.2 * exp(-r * r / (size * size * 3.0)) + 0.22 * exp(-r / 26.0));
    float spike = (12.0 + 70.0 * load) * (1.0 - 0.6 * inhale);
    light += pre * energy * 0.35 * vec3(0.86, 0.91, 1.0) * (exp(-abs(d.y) / 0.7) * exp(-abs(d.x) / spike)
      + exp(-abs(d.x) / 0.7) * exp(-abs(d.y) / spike));
    // Seconds after the burst on a first visit; the warm 2s replay compresses it.
    float b = (p - 0.40) * ${OPENING_SECONDS.toFixed(2)};
    float on = step(0.0, b);
    light += on * exp(-b * 9.0) * (0.12 + exp(-r / (width * 0.22))) * vec3(5.0, 4.8, 4.5);
    float sweep = on * exp(-b * 2.6);
    light += sweep * exp(-abs(d.y) / (1.2 + b * 7.0)) * exp(-abs(d.x) / (width * 0.42)) * vec3(1.6, 2.24, 3.2);
    light += sweep * exp(-abs(d.y) / 0.6) * exp(-abs(d.x) / (width * 0.18)) * 2.0;
    light += on * exp(-b * 3.6) * exp(-pow((r - b * width * 0.85) / (4.0 + b * 22.0), 2.0)) * vec3(0.9, 0.74, 0.58);
    light += on * exp(-b * 3.0) * exp(-r / 55.0) * vec3(2.5, 2.25, 2.0);
    float a = clamp(max(light.r, max(light.g, light.b)), 0.0, 1.0);
    return vec4(light / max(a, 0.00001), a);
  }
  vec4 stellarFormation(vec2 uv) {
    if (uOpening.x > 0.5 && uFinaleEnabled < 0.5) return firstLight(uv);
    // The finale's plasma is the kilonova fireball in the copy pass.
    if (uFinaleEnabled > 0.5 || uOpening.x < 0.5 || uOpening.y >= 0.72) return vec4(0.0);
    float time = uOpening.y;
    float collapse = uOpening.z;
    vec2 center = uFinaleEnabled > 0.5 ? uRayCenter : uPortalCenter;
    vec2 px = (uv - center) * uPortalViewport / max(1.0, uOpening.w);
    float radius = length(px);
    if (radius > 4.0) return vec4(0.0);
    float shear = sin(collapse * 3.14159265);
    float twist = collapse * 1.4 / (0.35 + radius);
    px = mat2(cos(twist), -sin(twist), sin(twist), cos(twist)) * px;
    px.x /= 1.0 + shear * 0.38;
    px.y *= 1.0 + shear * 0.38;
    radius = length(px);
    float stellarRadius = mix(1.42, 0.12, pow(collapse, 1.65));
    float edge = max(fwidth(radius), 0.002);
    float surface = 1.0 - smoothstep(stellarRadius - edge, stellarRadius + edge, radius);
    vec2 sphere = px / stellarRadius;
    float z = sqrt(max(0.0, 1.0 - dot(sphere, sphere)));
    vec3 spherePoint = vec3(sphere, z);
    float turn = time * 2.6 + collapse * 1.8 + spherePoint.y * spherePoint.y * 0.6;
    spherePoint.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * spherePoint.xz;
    // Broad convection shapes the sphere; narrow ridges carry heat without bleaching it.
    vec3 flowPoint = spherePoint * 4.2 + vec3(0.0, -time * 0.8, time * 0.4);
    float broad = turbulence(flowPoint);
    float convection = turbulence(spherePoint * 17.0 + vec3(broad * 3.2, -broad * 2.1, time));
    float granules = noise(spherePoint * 64.0 + convection * 2.0);
    float ridges = pow(max(0.0, 1.0 - abs(convection - 0.50) * 5.0), 3.0);
    float cells = smoothstep(0.25, 0.72, convection);
    float limb = 0.12 + 0.88 * pow(z, 0.65);
    float compression = sin(collapse * 3.14159265);
    float luminance = (0.16 + broad * 0.30 + cells * 0.22 + ridges * 0.14 + granules * 0.16) * limb;
    luminance *= (0.62 + broad * 0.76) * (1.0 + compression * 0.3);
    // Resolved fine structure stays sharp; the low limb gives a luminous volume.
    luminance += pow(1.0 - z, 4.0) * 0.14 * (0.5 + convection);
    float angle = atan(px.y, px.x);
    float prominence = turbulence(vec3(cos(angle) * 5.0, sin(angle) * 5.0, time * 2.2));
    float outside = max(0.0, radius - stellarRadius);
    float plume = pow(prominence, 3.0);
    float threads = pow(0.5 + 0.5 * sin(angle * 47.0 + prominence * 16.0 + outside * 8.0), 4.0);
    float corona = exp(-outside * (15.0 - plume * 9.0)) * (0.06 + plume * 0.6 + threads * plume * 0.22);
    corona *= (1.0 - surface) * (1.0 + compression * 0.4) * (1.0 - smoothstep(0.38, 0.60, time));
    // A rotating, inclined envelope feeds the very same ray-traced disk below.
    vec2 disk = mat2(0.573576, -0.819152, 0.819152, 0.573576) * px;
    disk.y /= mix(0.90, 0.19, collapse);
    float r = length(disk);
    float azimuth = atan(disk.y, disk.x) - collapse * 5.0 - time * 1.5;
    vec3 flow = vec3(cos(azimuth + r * 1.8), sin(azimuth + r * 1.8), r * 0.75);
    float clouds = turbulence(flow * 4.0 + vec3(0.0, 0.0, time * 2.0));
    float filaments = pow(max(0.0, sin(azimuth * 3.0 + r * 7.0 + clouds * 7.0)), 5.0);
    float envelope = exp(-pow((r - 1.9) * 1.1, 2.0)) * smoothstep(0.85, 1.4, r);
    float gas = envelope * (0.025 + filaments * 0.20) * clouds;
    gas *= smoothstep(0.13, 0.37, time) * (1.0 - smoothstep(0.49, 0.72, time));
    float arrive = smoothstep(0.025, 0.12, time);
    float life = arrive * (1.0 - smoothstep(0.32, 0.50, time));
    // The ray-traced horizon owns the shadow; no second painted circular hole.
    corona *= arrive;
    float a = clamp(surface * life + corona + gas, 0.0, 1.0);
    vec3 light = vec3(luminance) * surface * life + vec3(1.05) * corona + vec3(0.72) * gas;
    // Hot plasma grade: dim filaments burn orange, the brightest knots stay white-gold.
    float heat = smoothstep(0.25, 1.1, dot(light, vec3(0.333)));
    light *= mix(vec3(1.0), mix(vec3(1.35, 0.62, 0.26), vec3(1.08, 0.98, 0.86), heat), uDiskWarm);
    return vec4(light / max(a, 0.00001), a);
  }
`;
