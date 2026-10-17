import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Matrix4, Vector2, Vector3, Vector4 } from 'three';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { buildFinaleSeeds, finaleScreenScale, finaleState } from '@/3d/utils/finale';
import { useScrollStore } from '@/stores/useScrollStore';

// Kilonova ejecta: an isotropic shell in world space around the BH (blue polar, red
// equatorial), captured onto Keplerian orbits in the ray-traced disk's screen ellipse.
// Positions are a pure function of scroll progress; only the orbital phase has a clock.
const VERT = /* glsl */ `
  uniform float uP, uTime, uPixelRatio, uShadow, uAspect, uDoppler;
  uniform vec4 uFire;
  uniform vec2 uRayCenter, uDiskA, uDiskB, uFacing;
  varying vec3 vColor;
  varying float vAlpha;
  float hash(float x) { return fract(sin(x * 91.345) * 47453.5453); }
  vec3 blackbody(float t) {
    vec3 c = mix(vec3(0.32, 0.03, 0.01), vec3(1.0, 0.30, 0.06), smoothstep(0.0, 0.35, t));
    c = mix(c, vec3(1.0, 0.72, 0.40), smoothstep(0.30, 0.60, t));
    c = mix(c, vec3(1.0, 0.95, 0.88), smoothstep(0.55, 0.85, t));
    return mix(c, vec3(0.70, 0.82, 1.0), smoothstep(0.85, 1.2, t));
  }
  void main() {
    vec3 s = position;
    float s4 = hash(s.x * 13.1 + s.y * 7.7), s5 = hash(s.y * 19.3 + s.z * 3.1), s6 = hash(s.z * 23.9 + s.x * 5.3);
    float blast = max(uP - 0.44, 0.0);
    float angle = s.x * 6.2831853, latitude = s.y * 2.0 - 1.0, ring = sqrt(1.0 - latitude * latitude);
    vec3 direction = vec3(cos(angle) * ring, latitude, sin(angle) * ring);
    float speed = 0.25 + 0.95 * pow(s.z, 0.6);
    float reach = uFire.x * speed;
    vec3 wobble = vec3(sin(direction.y * 7.0 + s4 * 6.283 + blast * 9.0),
      sin(direction.z * 6.0 + s5 * 6.283 + blast * 7.0), sin(direction.x * 8.0 + s6 * 6.283 + blast * 8.0));
    vec4 view = modelViewMatrix * vec4(direction * reach + wobble * reach * 0.12, 1.0);
    vec4 clip = projectionMatrix * view;
    vec2 ejecta = clip.xy / max(clip.w, 0.001);
    // Capture is staggered per particle; the orbit contracts from 2.2x to its final radius.
    float capture = smoothstep(0.0, 1.0, clamp((uFire.z - s6 * 0.35) / 0.65, 0.0, 1.0));
    float rho = 3.2 + 11.0 * pow(s5, 1.4);
    float orbit = mix(rho * 2.2, rho, capture);
    float theta = angle + 6.0 * pow(3.0 / orbit, 1.5) * (uTime * 0.6 + uP * 10.0);
    vec2 across = normalize(vec2(-uDiskA.y, uDiskA.x)) * length(uDiskB) * (s4 - 0.5) * 0.5 * (1.0 - 0.7 * capture);
    vec2 disk = uRayCenter + (cos(theta) * uDiskA + sin(theta) * uDiskB) * orbit + across;
    vec2 ndc = mix(ejecta, disk, capture);
    gl_Position = vec4(ndc, 0.0, 1.0);
    gl_PointSize = clamp((0.9 + 1.8 * s6) * uPixelRatio * mix(clamp(40.0 / max(-view.z, 1.0), 0.6, 2.2), 1.0, capture), 1.0, 6.0);
    // Far-side orbits pass behind the forming shadow.
    float behind = step(0.0, cos(theta) * uFacing.x + sin(theta) * uFacing.y);
    float inside = 1.0 - smoothstep(uShadow * 0.95, uShadow * 1.15, length((disk - uRayCenter) * vec2(uAspect, 1.0)));
    float occlusion = 1.0 - behind * inside * capture * step(0.0001, uShadow);
    float hot = uFire.y * mix(0.75, 1.15, abs(latitude));
    float temperature = mix(hot, mix(0.38, 0.92, pow(3.2 / rho, 0.8)), capture);
    float doppler = 1.0 + 0.6 * capture * sin(theta - uDoppler);
    vColor = blackbody(temperature) * (0.45 + 1.3 * temperature * temperature) * doppler;
    vAlpha = smoothstep(0.44, 0.452, uP) * (1.0 - smoothstep(0.86, 0.97, uP))
      * (0.25 + 0.75 * s4) * occlusion * mix(1.0, 0.45, capture);
  }
`;
const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor, pow(1.0 - smoothstep(0.0, 0.5, r), 1.6) * vAlpha);
  }
`;

const center = new Vector3(...BLACK_HOLE_CENTER);
// Same frame as the ray tracer's uDiskFrame: the disk spans its local x and z axes.
const diskFrame = new Matrix4().makeRotationZ(55 * Math.PI / 180).multiply(new Matrix4().makeRotationX(4 * Math.PI / 180));
const axisA = new Vector3(1, 0, 0).transformDirection(diskFrame);
const axisB = new Vector3(0, 0, 1).transformDirection(diskFrame);

export function FinaleParticles({ quality = 'high', reduced = false }) {
  const mesh = useRef(null);
  const phase = useRef({});
  const clock = useRef(0);
  const scratch = useMemo(() => ({ c: new Vector3(), a: new Vector3(), b: new Vector3(), forward: new Vector3() }), []);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(buildFinaleSeeds(quality === 'low' ? 24000 : quality === 'medium' ? 64000 : 120000), 3));
    return result;
  }, [quality]);
  const uniforms = useMemo(() => ({
    uP: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: 1 }, uShadow: { value: 0 }, uAspect: { value: 1 }, uDoppler: { value: 0 },
    uFire: { value: new Vector4() }, uRayCenter: { value: new Vector2() }, uDiskA: { value: new Vector2() }, uDiskB: { value: new Vector2() },
    uFacing: { value: new Vector2() },
  }), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ gl, camera, size }, delta) => {
    const state = useScrollStore.getState(), p = state.chapterProgress;
    if (!mesh.current) return;
    mesh.current.visible = !reduced && state.storyChapter === 'finale' && p > 0.44 && p < 0.97;
    if (!mesh.current.visible) return;
    clock.current += Math.min(delta, 0.05);
    const authored = finaleState(p, phase.current), values = mesh.current.material.uniforms;
    values.uP.value = p;
    values.uTime.value = clock.current;
    values.uFire.value.set(authored.fireRadius, authored.fireHeat, authored.capture, 0);
    values.uPixelRatio.value = gl.getPixelRatio();
    values.uAspect.value = size.width / Math.max(1, size.height);
    // The particle disk sits at the BH's final apparent size; the shadow grows into it.
    const scale = finaleScreenScale(camera.position.distanceTo(center), camera.fov, size.height, 1, authored.zoom);
    const { c, a, b, forward } = scratch;
    c.copy(center).project(camera);
    a.copy(axisA).multiplyScalar(8).add(center).project(camera).sub(c).multiplyScalar(scale / 8);
    b.copy(axisB).multiplyScalar(8).add(center).project(camera).sub(c).multiplyScalar(scale / 8);
    values.uRayCenter.value.set(c.x, c.y);
    values.uDiskA.value.set(a.x, a.y);
    values.uDiskB.value.set(b.x, b.y);
    camera.getWorldDirection(forward);
    const facingA = axisA.dot(forward), facingB = axisB.dot(forward);
    values.uFacing.value.set(facingA, facingB);
    values.uDoppler.value = Math.atan2(facingB, facingA);
    values.uShadow.value = authored.hole > 0 ? 0.27 * (0.12 + 0.88 * authored.collapse) * authored.zoom : 0;
  });
  return <points ref={mesh} name="finale-particles" position={BLACK_HOLE_CENTER} geometry={geometry} frustumCulled={false} renderOrder={11}>
    <shaderMaterial uniforms={uniforms} vertexShader={VERT} fragmentShader={FRAG} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
  </points>;
}
