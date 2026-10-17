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
  vec4 stellarFormation(vec2 uv) {
    if (uOpening.x < 0.5 || uOpening.y >= 0.72) return vec4(0.0);
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
    return vec4(light / max(a, 0.00001), a);
  }
`;
