import { HalfFloatType, LinearFilter, Mesh, OrthographicCamera, PlaneGeometry, RGBAFormat, Scene, ShaderMaterial, Uniform, Vector2, Vector4, WebGLRenderTarget } from 'three';
import { pointerPresent, releasePointer, retainPointer } from './pointer.js';

// The cursor's gravity field: a small ping-pong texture of velocity (RG, in screen
// heights per second, aspect-corrected), revealed density (B) and pointer proximity (A).
// Matter near the pointer is pulled in and set orbiting, so trails curl like an
// accretion disk, then decay and heal. Hero reads it as a mask, Works as displacement.
const STEP_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const STEP_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uPrev;
  uniform vec2 uTexel;
  uniform vec4 uPointer; // current uv, previous uv
  uniform vec4 uParams; // radius, swirl, idle halo, presence
  uniform vec3 uDecay; // velocity decay/s, density decay/s, dt
  uniform float uAspect;
  varying vec2 vUv;
  vec2 toSpace(vec2 v) { return vec2(v.x * uAspect, v.y); }
  void main() {
    float dt = uDecay.z;
    vec4 here = texture2D(uPrev, vUv);
    // Semi-Lagrangian self-advection carries the trail along its own flow.
    vec2 back = vUv - here.xy * dt * vec2(1.0 / uAspect, 1.0);
    vec4 state = texture2D(uPrev, back);
    vec4 blur = 0.25 * (texture2D(uPrev, back + vec2(uTexel.x, 0.0)) + texture2D(uPrev, back - vec2(uTexel.x, 0.0))
      + texture2D(uPrev, back + vec2(0.0, uTexel.y)) + texture2D(uPrev, back - vec2(0.0, uTexel.y)));
    state = mix(state, blur, 0.18);
    vec2 velocity = state.xy * exp(-uDecay.x * dt);
    float density = state.z * exp(-uDecay.y * dt);

    float radius = uParams.x, presence = uParams.w;
    vec2 p = toSpace(vUv), b = toSpace(uPointer.xy), a = toSpace(uPointer.zw);
    vec2 ab = b - a;
    float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-7), 0.0, 1.0);
    vec2 d = p - (a + ab * h);
    float stroke = exp(-dot(d, d) / (radius * radius)) * presence;
    vec2 motion = ab / max(dt, 1e-3);
    float speed = min(length(motion), 6.0);
    // The pointer drags the medium with it…
    velocity = mix(velocity, motion, stroke * 0.32);
    // …and, like a small mass, pulls it inward and sets it orbiting.
    vec2 r = p - b;
    float distance = length(r);
    float well = exp(-distance * distance / (radius * radius * 5.0)) * presence;
    vec2 tangent = vec2(-r.y, r.x) / max(distance, 1e-4);
    velocity += (tangent * uParams.y * (0.35 + speed) - r / max(distance, 1e-4) * uParams.y * 0.35) * well * dt;
    float speedLimit = 3.5;
    velocity *= min(1.0, speedLimit / max(length(velocity), 1e-4));

    density += stroke * min(1.0, speed * 0.8) * dt * 7.0;
    // A resting mass keeps a small open window around itself.
    density = max(density, uParams.z * exp(-distance * distance / (radius * radius * 0.7)) * presence);
    gl_FragColor = vec4(velocity, clamp(density, 0.0, 1.0), well);
  }
`;

const DEFAULTS = {
  size: 128,
  radius: 0.065, // in screen heights
  swirl: 2.4,
  idle: 0.55,
  velocityDecay: 1.6,
  densityDecay: 0.9,
};

export function createGravityField(options = {}) {
  const params = { ...DEFAULTS, ...options };
  const targets = [0, 1].map(() => new WebGLRenderTarget(params.size, params.size, {
    type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter,
    depthBuffer: false, stencilBuffer: false,
  }));
  const material = new ShaderMaterial({
    vertexShader: STEP_VERT, fragmentShader: STEP_FRAG,
    uniforms: {
      uPrev: { value: targets[0].texture },
      uTexel: { value: new Vector2(1 / params.size, 1 / params.size) },
      uPointer: { value: new Vector4(0.5, 0.5, 0.5, 0.5) },
      uParams: { value: new Vector4() },
      uDecay: { value: new Vector4() },
      uAspect: { value: 1 },
    },
    depthTest: false, depthWrite: false,
  });
  const geometry = new PlaneGeometry(2, 2);
  const scene = new Scene();
  scene.add(new Mesh(geometry, material));
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const pointer = retainPointer();
  const previous = new Vector2(pointer.x, pointer.y);
  let index = 0;
  let presence = 0;
  let lastTime = -1;
  let quiet = 0; // seconds without a pointer

  const field = {
    params,
    enabled: true,
    // Shared uniforms: put these objects straight into a material's uniforms.
    uniform: new Uniform(targets[0].texture),
    // xy pointer uv (y up), z presence 0..1, w pointer speed (screen heights/s).
    pointer: new Uniform(new Vector4(0.5, 0.5, 0, 0)),
    setEnabled(value) { field.enabled = Boolean(value); },
    step(renderer, delta, time) {
      if (time === lastTime) return; // several consumers, one step per frame
      lastTime = time;
      const dt = Math.min(Math.max(delta, 1 / 240), 1 / 20);
      const present = field.enabled && pointerPresent();
      presence += ((present ? 1 : 0) - presence) * (1 - Math.exp(-dt * (present ? 10 : 4)));
      quiet = present ? 0 : quiet + dt;
      // Once every trail has decayed (e^-5 of density), the idle field costs nothing.
      if (quiet * params.densityDecay > 5 && quiet * params.velocityDecay > 5) return;
      const { innerWidth: width, innerHeight: height } = window;
      const aspect = width / Math.max(1, height);
      const u = material.uniforms;
      // A fresh entry starts at the pointer, never with a streak from the last exit.
      if (presence < 0.01) previous.set(pointer.x, pointer.y);
      u.uPointer.value.set(pointer.x, pointer.y, previous.x, previous.y);
      u.uParams.value.set(params.radius, params.swirl, params.idle, presence);
      u.uDecay.value.set(params.velocityDecay, params.densityDecay, dt, 0);
      u.uAspect.value = aspect;
      const speed = Math.hypot((pointer.x - previous.x) * aspect, pointer.y - previous.y) / dt;
      field.pointer.value.set(pointer.x, pointer.y, presence, speed);
      previous.set(pointer.x, pointer.y);
      u.uPrev.value = targets[index].texture;
      const next = targets[1 - index];
      const current = renderer.getRenderTarget();
      const autoClear = renderer.autoClear;
      const xr = renderer.xr.enabled;
      try {
        renderer.xr.enabled = false;
        renderer.autoClear = false;
        renderer.setRenderTarget(next);
        renderer.render(scene, camera);
      } finally {
        renderer.setRenderTarget(current);
        renderer.autoClear = autoClear;
        renderer.xr.enabled = xr;
      }
      index = 1 - index;
      field.uniform.value = next.texture;
    },
    dispose() {
      releasePointer();
      targets.forEach(target => target.dispose());
      material.dispose();
      geometry.dispose();
    },
  };
  return field;
}
