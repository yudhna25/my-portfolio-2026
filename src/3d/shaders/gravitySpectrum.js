// Screen-space gravity layer, composited after bloom:
// 1. Isopotential aura: a few soft contours of the black hole's well (plus a cosmic
//    undulation and the cursor's own small dent) that fade out with distance from the
//    hole, drawn only into dark space. Felt more than seen.
// 0. Click pulse: a gravitational wave ring that ripples the sky, the aura and the window.
// 2. Hidden spectrum: inside the cursor field's density the sky is shown at another
//    wavelength (infrared false colour, edge line-art, dust filaments, a sky grid),
//    and the swirl drags and magnifies the scene like a small mass.
export const GRAVITY_SPECTRUM_FRAG = /* glsl */ `
  uniform sampler2D uField;
  uniform vec4 uPointer; // uv, presence, speed
  uniform vec4 uHole; // centre uv, shadow radius px, unused
  uniform vec4 uContour; // line opacity, amber, inward flow, spectrum strength
  uniform vec2 uViewport;
  uniform float uTime;
  uniform vec4 uPulse; // click uv, age (s), strength

  float gsHash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float gsNoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(gsHash(i), gsHash(i + vec2(1.0, 0.0)), f.x),
      mix(gsHash(i + vec2(0.0, 1.0)), gsHash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float gsFbm(vec2 p) {
    return gsNoise(p) * 0.55 + gsNoise(p * 2.07 + 3.1) * 0.3 + gsNoise(p * 4.13 + 7.7) * 0.15;
  }
  float gsLuma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float aspect = uViewport.x / max(uViewport.y, 1.0);
    vec2 squash = vec2(1.0 / aspect, 1.0);
    vec4 field = texture2D(uField, uv);
    float spectrum = uContour.w;
    float mask = smoothstep(0.26, 0.42, field.z) * spectrum;

    // Lens: the swirl drags the scene; the pointer's mass magnifies what lies behind it.
    vec2 toPointer = (uv - uPointer.xy) * vec2(aspect, 1.0);
    float pr = length(toPointer);
    float lens = uPointer.z * spectrum * 0.010 * exp(-pr * pr / 0.005);
    // Click pulse: a thin wave packet expanding from the click, decaying as it travels.
    vec2 fromPulse = (uv - uPulse.xy) * vec2(aspect, 1.0);
    float pd = length(fromPulse);
    float front = uPulse.z * 0.95;
    float packet = exp(-pow((pd - front) / 0.035, 2.0)) * uPulse.w * exp(-uPulse.z * 1.6);
    float wave = sin((pd - front) * 120.0) * packet;
    vec2 pulseDir = fromPulse / max(pd, 1e-4) * squash;
    vec2 sampleUv = uv - field.xy * squash * 0.008 * spectrum - toPointer / max(pr, 1e-4) * squash * lens
      + pulseDir * wave * 0.006;
    // Dispersion: lensed light splits a little at the edge of the mass, like a real Einstein ring.
    vec2 split = (toPointer / max(pr, 1e-4) * squash * lens + field.xy * squash * 0.0015 * spectrum + pulseDir * packet * 0.004) * 0.7;
    vec3 base = vec3(texture2D(inputBuffer, sampleUv + split).r, texture2D(inputBuffer, sampleUv).g,
      texture2D(inputBuffer, sampleUv - split).b);
    float light = gsLuma(base);

    // Isopotential lines, denser and more curved towards the hole.
    vec2 px = uv * uViewport;
    float r = length(px - uHole.xy * uViewport);
    float R = max(uHole.z, 1.0);
    float reach = max(R, uViewport.y * 0.05);
    vec2 q = uv * vec2(aspect, 1.0);
    float phi = 6.0 * sqrt(reach / max(r, R * 0.9));
    phi += 0.6 * gsFbm(q * 1.4 + vec2(uTime * 0.012, -uTime * 0.008));
    float rc = length((uv - uPointer.xy) * uViewport);
    phi += uPointer.z * 0.5 * sqrt(uViewport.y * 0.03 / max(rc, uViewport.y * 0.012));
    phi += length(field.xy) * 0.2 + wave * 0.35;
    phi -= uContour.z * 0.45;
    float w = fwidth(phi);
    float level = fract(phi);
    // Soft, slightly wide strokes: an aura rather than a drawing.
    float line = 1.0 - smoothstep(0.4 * w, 2.4 * w + 0.03, min(level, 1.0 - level));
    line *= 1.0 - smoothstep(0.18, 0.45, w); // fade where lines would crowd
    // Strongest beside the hole, gone a few radii out.
    line *= smoothstep(R * 1.15, R * 2.2, r) * exp(-max(r - R, 0.0) / (reach * 6.0));
    float darkness = 1.0 - smoothstep(0.06, 0.4, light);
    vec3 ink = mix(vec3(0.85, 0.83, 0.75), vec3(1.0, 0.37, 0.055), uContour.y);
    vec3 color = base + ink * line * uContour.x * darkness;

    // Hidden spectrum (computed unconditionally: derivatives need uniform control flow).
    vec2 texel = texelSize * 1.5;
    float lx = gsLuma(texture2D(inputBuffer, sampleUv + vec2(texel.x, 0.0)).rgb) - gsLuma(texture2D(inputBuffer, sampleUv - vec2(texel.x, 0.0)).rgb);
    float ly = gsLuma(texture2D(inputBuffer, sampleUv + vec2(0.0, texel.y)).rgb) - gsLuma(texture2D(inputBuffer, sampleUv - vec2(0.0, texel.y)).rgb);
    float edge = clamp(length(vec2(lx, ly)) * 3.0, 0.0, 1.0);
    vec3 infra = mix(vec3(0.006, 0.001, 0.010), vec3(0.70, 0.06, 0.012), smoothstep(0.0, 0.12, light));
    infra = mix(infra, vec3(1.0, 0.67, 0.27), smoothstep(0.12, 0.8, light));
    float dust = pow(1.0 - abs(2.0 * gsFbm(q * 3.2 + uTime * 0.01) - 1.0), 5.0);
    vec2 cell = q * 14.0;
    vec2 gridDistance = abs(fract(cell) - 0.5);
    float grid = 1.0 - smoothstep(0.0, fwidth(cell.x) * 1.2, 0.5 - max(gridDistance.x, gridDistance.y));
    // Colours are linear (the composer encodes to sRGB at the end).
    vec3 hidden = infra + vec3(1.0, 0.34, 0.05) * edge * 1.4 + vec3(0.52, 0.04, 0.013) * dust * 0.35
      + vec3(1.0, 0.52, 0.17) * grid * 0.035 + vec3(1.0, 0.45, 0.12) * line * 0.3;
    // A thin bright rim where the window meets ordinary space, like a photon ring.
    // Only where the window has a sharp edge, so decaying tails do not smear into a band.
    float rim = exp(-pow((field.z - 0.27) / 0.035, 2.0)) * spectrum * clamp(fwidth(field.z) * 30.0 - 0.15, 0.0, 1.0);
    color = mix(color, hidden, mask) + vec3(1.0, 0.57, 0.21) * rim * 0.22;
    // The wave front catches a little disk light as it passes.
    color += vec3(1.0, 0.57, 0.21) * max(wave, 0.0) * 0.05 * darkness;
    outputColor = vec4(color, inputColor.a);
  }
`;
