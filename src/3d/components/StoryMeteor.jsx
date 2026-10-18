import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, PlaneGeometry, Vector2, Vector3 } from 'three';
import { useScrollStore } from '@/stores/useScrollStore';
import { meteorSplit, meteorTargets, meteorVisibility, STORY_METEOR_SAMPLES, writeStoryRibbon } from '@/3d/utils/storyMeteor';

const RIBBON_VERTEX = /* glsl */ `
  attribute vec2 aNormal;
  attribute float aSide, aAlong;
  uniform vec2 uViewport;
  uniform float uWidth;
  varying float vAlong, vAcross;
  void main() {
    vAlong = aAlong; vAcross = aSide;
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float taper = pow(max(0.0, 1.0 - aAlong), 0.7) * mix(0.28, 1.0, smoothstep(0.0, 0.18, aAlong));
    clip.xy += aNormal * aSide * uWidth * taper / uViewport * clip.w;
    gl_Position = clip;
  }
`;
const RIBBON_FRAGMENT = /* glsl */ `
  uniform float uOpacity, uJourney, uWake;
  varying float vAlong, vAcross;
  float gas(vec2 p) {
    return sin(p.x * 19.0 + sin(p.y * 5.0)) * sin(p.y * 11.0 + p.x * 3.0);
  }
  void main() {
    float a = abs(vAcross);
    float turbulence = gas(vec2(vAlong * 2.0 - uJourney * 7.0, vAcross * 1.8));
    float ridge = exp(-pow((vAcross + turbulence * 0.045) * 7.0, 2.0));
    float sheath = exp(-a * a * 7.0) * (0.55 + turbulence * 0.12);
    float fade = pow(1.0 - vAlong, 1.5) * (1.0 - smoothstep(0.86, 1.0, a));
    float density = mix(ridge * 0.8 + sheath * 0.24, sheath * 0.065, uWake);
    // Dust tail: sunlight scattered by grains, warm white-gold, curving with the orbit.
    vec3 color = mix(vec3(1.0, 0.84, 0.60), vec3(1.0, 0.97, 0.90), ridge * (1.0 - uWake));
    gl_FragColor = vec4(color, density * fade * uOpacity);
  }
`;
const HEAD_VERTEX = /* glsl */ `
  uniform vec3 uHead;
  uniform vec2 uViewport;
  uniform float uDiameter;
  varying vec2 vPixel;
  void main() {
    vec4 clip = projectionMatrix * viewMatrix * vec4(uHead, 1.0);
    vPixel = position.xy * uDiameter * 0.5;
    clip.xy += position.xy * uDiameter / uViewport * clip.w;
    gl_Position = clip;
  }
`;
// Nucleus, an asymmetric coma (compressed sunward, drawn out along the tail), faint
// sunward jets and a small glare cross. vPixel is in CSS px with y up, like uTail.
const HEAD_FRAGMENT = /* glsl */ `
  uniform float uOpacity, uCore, uHalo, uDiameter, uTime, uFlare;
  uniform vec2 uTail;
  varying vec2 vPixel;
  void main() {
    vec2 side = vec2(-uTail.y, uTail.x);
    float along = dot(vPixel, uTail), across = dot(vPixel, side);
    float coma = length(vec2(along * (along < 0.0 ? 1.8 : 0.55), across));
    float radius = length(vPixel);
    float nucleus = exp(-radius * radius / (2.0 * pow(1.2 + uCore * 0.02 * (1.0 + uFlare), 2.0)));
    float inner = exp(-pow(coma / (uCore * 0.22), 2.0));
    float outer = exp(-pow(coma / (uHalo * 0.2), 1.5));
    float sunward = atan(across, -along);
    float jets = pow(max(cos(sunward * 3.0 + 0.5 + sin(uTime * 0.4) * 0.15), 0.0), 8.0)
      * exp(-radius / (uCore * 0.3)) * step(along, 0.0) * 0.16;
    float glare = (exp(-abs(vPixel.y) / 0.7) * exp(-abs(vPixel.x) / (uHalo * 0.45))
      + exp(-abs(vPixel.x) / 0.7) * exp(-abs(vPixel.y) / (uHalo * 0.3))) * 0.22 * (1.0 + 2.0 * uFlare);
    vec3 light = vec3(1.0) * nucleus * (2.6 + 4.0 * uFlare)
      + vec3(0.82, 1.0, 0.94) * inner * 1.1
      + vec3(0.40, 0.92, 0.78) * outer * 0.22
      + vec3(0.75, 1.0, 0.92) * jets
      + vec3(0.85, 0.93, 1.0) * glare;
    // Keep the quad's square edge invisible.
    light *= 1.0 - smoothstep(0.22, 0.5, radius / uDiameter);
    gl_FragColor = vec4(light, uOpacity);
  }
`;

// Ion tail: straight, narrow, blue streamers pointing directly away from the sun,
// independent of the curved dust tail. Built in screen space from the head.
const ION_VERTEX = /* glsl */ `
  attribute float aAlong, aSide;
  uniform vec3 uHead;
  uniform vec2 uViewport, uDir;
  uniform float uLength, uWidth;
  varying float vAlong, vAcross;
  void main() {
    vAlong = aAlong; vAcross = aSide;
    vec4 clip = projectionMatrix * viewMatrix * vec4(uHead, 1.0);
    vec2 normal = vec2(-uDir.y, uDir.x);
    vec2 offset = uDir * aAlong * uLength + normal * aSide * uWidth * (0.2 + 0.8 * sqrt(aAlong));
    clip.xy += offset * 2.0 / uViewport * clip.w;
    gl_Position = clip;
  }
`;
const ION_FRAGMENT = /* glsl */ `
  uniform float uOpacity, uTime;
  varying float vAlong, vAcross;
  float hash(float x) { return fract(sin(x * 127.1) * 43758.5453); }
  void main() {
    float streamers = 0.0;
    for (int i = 0; i < 5; i++) {
      float lane = float(i);
      float centre = (hash(lane) - 0.5) * 1.3 * vAlong + sin(vAlong * 7.0 - uTime * 0.8 + lane * 2.1) * 0.07 * vAlong;
      streamers += exp(-pow((vAcross - centre) / (0.04 + 0.12 * vAlong), 2.0)) * (0.45 + 0.55 * hash(lane + 7.0));
    }
    float core = exp(-vAcross * vAcross * 7.0);
    float fade = pow(1.0 - vAlong, 1.3) * smoothstep(0.0, 0.05, vAlong) * (1.0 - smoothstep(0.75, 1.0, abs(vAcross)));
    vec3 color = mix(vec3(0.28, 0.52, 1.0), vec3(0.62, 0.82, 1.0), core);
    gl_FragColor = vec4(color * (streamers * 0.5 + core * 0.3), fade * uOpacity);
  }
`;

const ION_SAMPLES = 48;
const smooth = value => { const t = Math.min(1, Math.max(0, value)); return t * t * (3 - 2 * t); };
const headUniforms = () => ({ uHead: { value: new Vector3() }, uOpacity: { value: 0 }, uViewport: { value: new Vector2(1, 1) },
  uCore: { value: 64 }, uHalo: { value: 130 }, uDiameter: { value: 312 }, uTime: { value: 0 }, uFlare: { value: 0 },
  uTail: { value: new Vector2(0, 1) } });

const SPARK_VERTEX = /* glsl */ `
  attribute vec2 aNormal;
  attribute float aAlong, aRank;
  uniform vec2 uViewport;
  uniform float uJourney, uDpr, uCount, uOpacity;
  varying float vAlpha;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    float spread = sin(aRank * 8.3 + uJourney * 21.0) * (7.0 + aAlong * 18.0);
    clip.xy += aNormal * spread / uViewport * clip.w;
    gl_Position = clip;
    gl_PointSize = (2.6 + mod(aRank, 3.0) * 0.9) * uDpr;
    float pulse = pow(0.5 + 0.5 * sin(aRank * 17.0 + uJourney * 37.0), 4.0);
    vAlpha = uOpacity * step(aRank, uCount) * pow(1.0 - aAlong, 0.6) * (0.40 + 0.60 * pulse);
  }
`;
const SPARK_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float light = exp(-r * r * 5.0) * (1.0 - smoothstep(0.7, 1.0, r));
    gl_FragColor = vec4(mix(vec3(0.62, 0.80, 1.0), vec3(1.0), light * 0.35), light * vAlpha);
  }
`;

export function StoryMeteor({ layout, frozen = false }) {
  const root = useRef(null);
  const runtime = useRef(null);
  const scratch = useRef({ point: {}, pose: {}, metrics: {}, points: new Float64Array(10), journey: -1, width: 0, height: 0, range: 0 });
  const resources = useMemo(() => {
    const geometry = new BufferGeometry(), count = STORY_METEOR_SAMPLES * 2;
    const positions = new Float32Array(count * 3), normals = new Float32Array(count * 2);
    const side = new Float32Array(count), along = new Float32Array(count), indices = new Uint16Array((STORY_METEOR_SAMPLES - 1) * 6);
    for (let i = 0; i < STORY_METEOR_SAMPLES; i++) {
      side[i * 2] = -1; side[i * 2 + 1] = 1;
      along[i * 2] = along[i * 2 + 1] = i / (STORY_METEOR_SAMPLES - 1);
      if (i < STORY_METEOR_SAMPLES - 1) {
        const a = i * 2, o = i * 6;
        indices[o] = a; indices[o + 1] = a + 1; indices[o + 2] = a + 2;
        indices[o + 3] = a + 1; indices[o + 4] = a + 3; indices[o + 5] = a + 2;
      }
    }
    geometry.setAttribute('position', new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
    geometry.setAttribute('aNormal', new BufferAttribute(normals, 2).setUsage(DynamicDrawUsage));
    geometry.setAttribute('aSide', new BufferAttribute(side, 1));
    geometry.setAttribute('aAlong', new BufferAttribute(along, 1));
    geometry.setIndex(new BufferAttribute(indices, 1));
    const sparks = new BufferGeometry(), ranks = new Float32Array(count), sparkIndices = new Uint16Array(36);
    // Interleaving keeps the smaller mobile pool distributed over the whole tail.
    for (let i = 0; i < 36; i++) { const index = (4 + (i * 37 % 120)) * 2; sparkIndices[i] = index; ranks[index] = i + 1; }
    for (const name of ['position', 'aNormal', 'aAlong']) sparks.setAttribute(name, geometry.getAttribute(name));
    sparks.setAttribute('aRank', new BufferAttribute(ranks, 1)); sparks.setIndex(new BufferAttribute(sparkIndices, 1));
    const uniforms = () => ({ uOpacity: { value: 0 }, uViewport: { value: new Vector2(1, 1) },
      uWidth: { value: 76 }, uJourney: { value: 0 }, uWake: { value: 0 } });
    const ribbon = uniforms(), wake = uniforms();
    wake.uWake.value = 1;
    const ion = new BufferGeometry(), ionAlong = new Float32Array(ION_SAMPLES * 2), ionSide = new Float32Array(ION_SAMPLES * 2);
    const ionIndices = new Uint16Array((ION_SAMPLES - 1) * 6);
    for (let i = 0; i < ION_SAMPLES; i++) {
      ionSide[i * 2] = -1; ionSide[i * 2 + 1] = 1;
      ionAlong[i * 2] = ionAlong[i * 2 + 1] = i / (ION_SAMPLES - 1);
      if (i < ION_SAMPLES - 1) ionIndices.set([i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2], i * 6);
    }
    ion.setAttribute('position', new BufferAttribute(new Float32Array(ION_SAMPLES * 6), 3));
    ion.setAttribute('aAlong', new BufferAttribute(ionAlong, 1));
    ion.setAttribute('aSide', new BufferAttribute(ionSide, 1));
    ion.setIndex(new BufferAttribute(ionIndices, 1));
    return { geometry, sparks, sparkUniforms: { uViewport: { value: new Vector2(1, 1) }, uJourney: { value: 0 },
      uDpr: { value: 1 }, uCount: { value: 36 }, uOpacity: { value: 0 } },
      head: new PlaneGeometry(2, 2), screen: new Float64Array(STORY_METEOR_SAMPLES * 2), ribbon, wake,
      headUniforms: headUniforms(), fragments: [headUniforms(), headUniforms(), headUniforms()], ion,
      ionUniforms: { uHead: { value: new Vector3() }, uViewport: { value: new Vector2(1, 1) }, uDir: { value: new Vector2(0, 1) },
        uLength: { value: 300 }, uWidth: { value: 22 }, uOpacity: { value: 0 }, uTime: { value: 0 } } };
  }, []);
  useEffect(() => {
    runtime.current = resources;
    return () => { runtime.current = null; resources.geometry.dispose(); resources.head.dispose(); resources.sparks.dispose(); resources.ion.dispose(); };
  }, [resources]);
  const ionMesh = useRef(null);
  const fragmentMeshes = useRef([]);
  const probe = useMemo(() => ({ a: new Vector3(), b: new Vector3(), right: new Vector3(), up: new Vector3() }), []);

  useFrame(({ camera, size, gl, clock }) => {
    const buffers = runtime.current;
    if (!buffers || !root.current) return;
    const state = useScrollStore.getState(), data = layout.current, cache = scratch.current;
    // R3F copies scalar uniform wrappers; update the live material maps.
    const wake = root.current.children[0].material.uniforms, ribbon = root.current.children[1].material.uniforms;
    const head = root.current.children[2].material.uniforms;
    const sparks = root.current.children[3].material.uniforms;
    const departure = state.storyChapter === 'departure', p = state.chapterProgress;
    // After the break-up the parent comet and its tails dim; three fragments carry on.
    const opacity = meteorVisibility(state.storyChapter, p) * (departure ? 1 - smooth((p - 0.54) / 0.14) : 1);
    const pieces = departure ? smooth((p - 0.52) / 0.05) * (1 - smooth((p - 0.84) / 0.14)) : 0;
    root.current.visible = !frozen && !document.hidden && data?.range > 0 && (opacity > 0 || pieces > 0);
    if (!root.current.visible) { cache.journey = -1; return; }
    const journey = (state.storyChapter === 'departure' ? 1 : 0) + state.chapterProgress;
    let changed = journey !== cache.journey || data.width !== cache.width || data.height !== cache.height || data.range !== cache.range;
    for (let i = 0; i < data.points.length; i++) if (data.points[i] !== cache.points[i]) changed = true;
    if (changed) {
      // CameraRig has written this pose; project against it before the render pass.
      camera.updateMatrixWorld();
      writeStoryRibbon(data, journey, buffers.geometry.attributes.position.array, buffers.geometry.attributes.aNormal.array,
        buffers.screen, camera.matrixWorldInverse.elements, camera.projectionMatrix.elements, cache.point, cache.pose, cache.metrics);
      buffers.geometry.attributes.position.needsUpdate = buffers.geometry.attributes.aNormal.needsUpdate = true;
      head.uHead.value.fromArray(buffers.geometry.attributes.position.array);
      // Tail directions in px, y up: the dust tail follows the path; the ion tail points
      // straight back, opened away from the dust tail's curve.
      const screen = buffers.screen;
      // Sample a fifth of the way down the tail: the path can curl right at the head.
      const tx = screen[48] - screen[0], ty = screen[1] - screen[49], tl = Math.hypot(tx, ty);
      if (tl > 0.5) {
        const dx = tx / tl, dy = ty / tl;
        head.uTail.value.set(dx, dy);
        const fx = screen[160] - screen[0], fy = screen[1] - screen[161];
        const turn = (dx * fy - dy * fx > 0 ? -1 : 1) * 0.22;
        cache.ion = cache.ion ?? new Vector2();
        cache.ion.set(dx * Math.cos(turn) - dy * Math.sin(turn), dx * Math.sin(turn) + dy * Math.cos(turn));
      }
      cache.journey = journey; cache.width = data.width; cache.height = data.height; cache.range = data.range;
      cache.points.set(data.points);
    }
    const mobile = size.width < 768;
    ribbon.uViewport.value.set(size.width, size.height);
    ribbon.uWidth.value = mobile ? 68 : 112;
    ribbon.uJourney.value = journey; ribbon.uOpacity.value = opacity;
    wake.uViewport.value.set(size.width, size.height);
    wake.uWidth.value = mobile ? 116 : 216;
    wake.uJourney.value = journey; wake.uOpacity.value = opacity;
    head.uViewport.value.set(size.width, size.height);
    head.uCore.value = mobile ? 40 : 64;
    head.uHalo.value = mobile ? 76 : 130;
    head.uDiameter.value = head.uHalo.value * 2.4;
    head.uOpacity.value = opacity;
    head.uTime.value = clock.elapsedTime;
    head.uFlare.value = departure ? Math.exp(-Math.pow((p - 0.55) / 0.025, 2)) : 0;
    if (ionMesh.current) {
      const ion = ionMesh.current.material.uniforms;
      ion.uHead.value.copy(head.uHead.value);
      ion.uViewport.value.set(size.width, size.height);
      if (cache.ion) ion.uDir.value.copy(cache.ion);
      ion.uLength.value = size.width * (mobile ? 0.42 : 0.30);
      ion.uWidth.value = mobile ? 14 : 22;
      ion.uOpacity.value = opacity;
      ion.uTime.value = clock.elapsedTime;
    }
    // Fragments: staggered flights from the parent's position to each figure centre,
    // bowed apart on the camera plane, flaring as they arrive.
    const split = meteorSplit(state.storyChapter, p);
    probe.right.setFromMatrixColumn(camera.matrixWorld, 0);
    probe.up.setFromMatrixColumn(camera.matrixWorld, 1);
    for (let i = 0; i < 3; i++) {
      const mesh = fragmentMeshes.current[i];
      if (!mesh) continue;
      const values = mesh.material.uniforms, target = meteorTargets.ready ? meteorTargets.points[i] : null;
      const t = split > 0 ? Math.min(1, Math.max(0, (p - 0.52 - 0.03 * i) / 0.34)) : 0;
      const flight = t * t * t * (t * (t * 6 - 15) + 10), bow = Math.sin(Math.PI * flight) * 2.4;
      values.uHead.value.copy(head.uHead.value);
      if (target) values.uHead.value.lerp(probe.a.set(target.x, target.y, target.z), flight);
      values.uHead.value.addScaledVector(probe.right, (i - 1) * bow).addScaledVector(probe.up, (i === 1 ? 0.8 : -0.4) * bow);
      probe.a.copy(values.uHead.value).project(camera);
      probe.b.copy(head.uHead.value).project(camera);
      const vx = (probe.b.x - probe.a.x) * size.width, vy = (probe.b.y - probe.a.y) * size.height, vl = Math.hypot(vx, vy);
      values.uTail.value.copy(vl > 2 ? probe.b.set(vx / vl, vy / vl, 0) : head.uTail.value);
      values.uViewport.value.set(size.width, size.height);
      values.uCore.value = head.uCore.value * 0.45;
      values.uHalo.value = head.uHalo.value * 0.5;
      values.uDiameter.value = values.uHalo.value * 2.4;
      values.uTime.value = clock.elapsedTime;
      values.uFlare.value = Math.exp(-Math.pow((t - 0.97) / 0.05, 2)) * 1.2;
      values.uOpacity.value = pieces;
      mesh.visible = pieces > 0;
    }
    root.current.userData.journey = journey;
    root.current.userData.tailPixels = cache.metrics.tailPixels;
    root.current.userData.span = cache.metrics.span;
    sparks.uViewport.value.set(size.width, size.height);
    sparks.uJourney.value = journey; sparks.uDpr.value = gl.getPixelRatio();
    sparks.uCount.value = mobile ? 18 : 36; sparks.uOpacity.value = opacity;
    root.current.userData.sparkCount = mobile ? 18 : 36;
  });

  return <group ref={root} name="story-meteor" visible={false}>
    <mesh name="story-meteor-wake" geometry={resources.geometry} frustumCulled={false} renderOrder={20}>
      <shaderMaterial vertexShader={RIBBON_VERTEX} fragmentShader={RIBBON_FRAGMENT} uniforms={resources.wake} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    <mesh name="story-meteor-trail" geometry={resources.geometry} frustumCulled={false} renderOrder={21}>
      <shaderMaterial vertexShader={RIBBON_VERTEX} fragmentShader={RIBBON_FRAGMENT} uniforms={resources.ribbon} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    <mesh name="story-meteor-head" geometry={resources.head} frustumCulled={false} renderOrder={22}>
      <shaderMaterial vertexShader={HEAD_VERTEX} fragmentShader={HEAD_FRAGMENT} uniforms={resources.headUniforms} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    <points name="story-meteor-sparks" geometry={resources.sparks} frustumCulled={false} renderOrder={23}>
      <shaderMaterial vertexShader={SPARK_VERTEX} fragmentShader={SPARK_FRAGMENT} uniforms={resources.sparkUniforms}
        transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </points>
    <mesh ref={ionMesh} name="story-meteor-ion" geometry={resources.ion} frustumCulled={false} renderOrder={19}>
      <shaderMaterial vertexShader={ION_VERTEX} fragmentShader={ION_FRAGMENT} uniforms={resources.ionUniforms} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>
    {resources.fragments.map((uniforms, i) => <mesh key={i} ref={mesh => { fragmentMeshes.current[i] = mesh; }} name={`story-meteor-fragment-${i}`}
      geometry={resources.head} frustumCulled={false} renderOrder={24} visible={false}>
      <shaderMaterial vertexShader={HEAD_VERTEX} fragmentShader={HEAD_FRAGMENT} uniforms={uniforms} transparent blending={AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
    </mesh>)}
  </group>;
}
