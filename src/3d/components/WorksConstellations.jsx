import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import { AdditiveBlending, BufferAttribute, BufferGeometry, DynamicDrawUsage, LinearFilter, Matrix4, Quaternion, Raycaster, SRGBColorSpace, TextureLoader, Vector2, Vector3, Vector4, WebGLRenderTarget } from 'three';
import data from '@/3d/data/worksConstellations.json';
import { PORTFOLIO_DATA } from '@/data';
import { i18n } from '@/i18n/config';
import { WORKS_CARD_FRAG, WORKS_CARD_VERT, WORKS_LENS_FRAG, WORKS_LENS_VERT } from '@/3d/shaders/worksLens';
import { clearTrail, createPointerTracker, createTrail, stepTrail } from '@/3d/utils/worksPointer';
import { createRingText } from '@/3d/utils/worksRingText';
import { BLACK_HOLE_CENTER, storyCameraPath } from '@/3d/utils/cameraPath';
import { advanceWorksOrbit, worksBounds, worksStage, worksFigure, WORKS_IDS } from '@/3d/utils/worksOrbit';
import { finaleState, finaleSmooth } from '@/3d/utils/finale';
import { meteorTargets, worksArrival } from '@/3d/utils/storyMeteor';
import { useScrollStore } from '@/stores/useScrollStore';

// Stellarium Modern / CC BY-SA 4.0; Hipparcos ICRS J1991.25.
// See worksConstellations.json for exact coordinates, edges and attribution.
const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aRole;
  uniform float uPixelRatio;
  uniform float uActive;
  varying float vRole;
  void main() {
    vRole = aRole;
    gl_PointSize = aSize * uPixelRatio * (1.0 + uActive * 0.7);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const STAR_FRAG = /* glsl */ `
  uniform float uStrength;
  uniform float uActive;
  varying float vRole;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.02, 0.3, d);
    float halo = (1.0 - smoothstep(0.05, 0.5, d)) * 0.35 * uActive;
    if (d > 0.5) discard;
    gl_FragColor = vec4(vec3(1.0), (core * core + halo) * vRole * uStrength);
  }
`;

const TRAIL_VERT = /* glsl */ `
  attribute float aFade;
  varying float vFade;
  void main() { vFade = aFade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const TRAIL_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying float vFade;
  void main() { gl_FragColor = vec4(vec3(1.0), vFade * uOpacity); }
`;

// Tidal streams: stars stripped from each figure trail along its own authored history
// (the chirped inspiral), fanning out with age and pouring into the collision point.
const STREAM_SAMPLES = 24;
const STREAM_LAG = 0.07;
const STREAM_VERT = /* glsl */ `
  #define SAMPLES ${STREAM_SAMPLES}
  uniform vec4 uHistory[SAMPLES * 3];
  uniform float uOpacity, uPixelRatio;
  attribute vec4 aSeed;
  attribute float aSpread;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    int figure = int(aSeed.x + 0.5);
    float index = aSeed.y * float(SAMPLES - 1);
    int k = int(floor(index));
    vec4 h = mix(uHistory[figure * SAMPLES + k], uHistory[figure * SAMPLES + min(k + 1, SAMPLES - 1)], fract(index));
    vec3 fan = vec3(aSeed.z - 0.5, aSeed.w - 0.5, fract(aSeed.z * 7.13) - 0.5) * aSpread * (0.15 + aSeed.y * 3.2);
    vec4 view = modelViewMatrix * vec4(h.xyz + (position + fan) * h.w, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp((1.0 + 2.0 * fract(aSeed.w * 5.31)) * uPixelRatio * 24.0 / max(-view.z, 1.0), 1.0, 5.0);
    float head = 1.0 - aSeed.y;
    vAlpha = uOpacity * pow(head, 1.4) * (0.35 + 0.65 * fract(aSeed.z * 3.7));
    vColor = mix(vec3(0.55, 0.7, 1.0), vec3(1.0, 0.97, 0.92), pow(head, 3.0)) * (0.8 + 1.6 * pow(head, 4.0));
  }
`;
// Cards behind the lens plane render only into the lens pass, on this layer.
const BEHIND_LAYER = 5;
const CARD_PAD = 1.12;
const OPEN_Z = 2;
const CARD_SCALE = 0.74;
const CARD_KEYS = ['eduraLms', 'verisApp', 'viePerfume'];
const damp = (value, target, rate, delta) => target + (value - target) * Math.exp(-rate * delta);
const smooth = t => t * t * (3 - 2 * t);
function setLayer(group, behind, order) {
  for (const child of group.children) {
    if (behind) child.layers.set(BEHIND_LAYER); else child.layers.set(0);
    child.renderOrder = order + (child.userData.order ?? 0);
  }
}

const STREAM_FRAG = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    gl_FragColor = vec4(vColor, pow(1.0 - smoothstep(0.0, 0.5, r), 1.8) * vAlpha);
  }
`;

function projectWorks(layoutRef, root, camera, figures, groups, size, basis, ready) {
  const data = layoutRef?.current;
  if (!data) return;
  data.width = size.width; data.height = size.height; data.basis = basis; data.ready = ready;
  if (ready) {
    root.updateWorldMatrix(true, true);
    camera.updateMatrixWorld();
    for (let i = 0; i < figures.length; i++) {
      const box = data.figures[i], figure = figures[i];
      box.left = box.top = Infinity; box.right = box.bottom = -Infinity;
      for (const corner of figure.corners) {
        const point = figure.projected.copy(corner).applyMatrix4(groups[i].matrixWorld).project(camera);
        const x = (point.x + 1) * size.width / 2, y = (1 - point.y) * size.height / 2;
        box.left = Math.min(box.left, x); box.right = Math.max(box.right, x);
        box.top = Math.min(box.top, y); box.bottom = Math.max(box.bottom, y);
      }
    }
  }
  data.onChange?.();
}

export function WorksConstellations({ frozen = false, quality = 'high', layoutRef }) {
  const root = useRef(null);
  const trailMesh = useRef(null);
  const streamMesh = useRef(null);
  const phaseState = useRef({});
  const sampled = useRef({});
  const groups = useRef([]);
  const size = useThree(state => state.size);
  const figures = useMemo(() => data.constellations.map(item => {
    const stars = [...item.geometry.stars, ...item.geometry.supportingStars];
    const byId = new Map(item.geometry.stars.map(star => [star.id, star.position]));
    const points = new BufferGeometry();
    points.setAttribute('position', new BufferAttribute(new Float32Array(stars.flatMap(star => star.position)), 3));
    points.setAttribute('aSize', new BufferAttribute(new Float32Array(stars.map((star, i) => i < item.geometry.stars.length ? Math.max(8, 14 - star.vmag) : 2.5)), 1));
    points.setAttribute('aRole', new BufferAttribute(new Float32Array(stars.map((_, i) => i < item.geometry.stars.length ? 1 : 0.25)), 1));
    const lines = new BufferGeometry();
    lines.setAttribute('position', new BufferAttribute(new Float32Array(item.geometry.edges.flatMap(edge => edge.flatMap(id => byId.get(id)))), 3));
    const bounds = worksBounds(item);
    const corners = [new Vector3(bounds.left, bounds.top, 0), new Vector3(bounds.right, bounds.top, 0),
      new Vector3(bounds.right, bounds.bottom, 0), new Vector3(bounds.left, bounds.bottom, 0)];
    const card = [(bounds.right - bounds.left) * CARD_PAD, (bounds.top - bounds.bottom) * CARD_PAD];
    const trail = createTrail();
    return { points, lines, bounds, corners, projected: new Vector3(), card,
      cardCenter: [(bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2, item.artwork.plane.localZ - 0.01],
      trail, hover: 0, open: 0,
      cardUniforms: { uMap: { value: null }, uMapReady: { value: 0 }, uImageAspect: { value: 1.6 }, uOpacity: { value: 0 },
        uHover: { value: 0 }, uOpen: { value: 0 }, uTime: { value: 0 }, uRadius: { value: Math.min(...card) * 0.06 },
        uSize: { value: new Vector2(...card) }, uTrail: { value: trail.samples } },
      uniforms: { uPixelRatio: { value: 1 }, uStrength: { value: 1 }, uActive: { value: 0 } } };
  }), []);
  const trails = useMemo(() => {
    const samples = quality === 'low' ? 12 : quality === 'medium' ? 18 : 24;
    const stars = data.constellations.flatMap((item, index) => item.geometry.stars.map(star => ({ position: star.position, index })));
    const positions = new Float32Array(stars.length * samples * 6);
    const fades = new Float32Array(stars.length * samples * 2);
    for (let i = 0; i < fades.length; i++) fades[i] = Math.pow(1 - (i % (samples * 2)) / (samples * 2), 1.6);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
    geometry.setAttribute('aFade', new BufferAttribute(fades, 1));
    return { geometry, stars, samples, uniforms: { uOpacity: { value: 0 } } };
  }, [quality]);
  const streams = useMemo(() => {
    const count = quality === 'low' ? 10000 : quality === 'medium' ? 24000 : 48000;
    const positions = new Float32Array(count * 3), seeds = new Float32Array(count * 4), spreads = new Float32Array(count);
    const random = index => { const value = Math.sin((index + 1) * 78.233 + 20261017) * 43758.5453; return value - Math.floor(value); };
    for (let i = 0; i < count; i++) {
      const figure = i % 3, item = data.constellations[figure], stars = item.geometry.stars;
      const star = stars[Math.floor(random(i * 5) * stars.length)].position;
      positions.set(star, i * 3);
      // Bias toward the head so the stream reads as bright near each figure.
      seeds.set([figure, Math.pow(random(i * 5 + 1), 1.6), random(i * 5 + 2), random(i * 5 + 3)], i * 4);
      const bounds = worksBounds(item);
      spreads[i] = (bounds.right - bounds.left) * 0.08;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aSeed', new BufferAttribute(seeds, 4));
    geometry.setAttribute('aSpread', new BufferAttribute(spreads, 1));
    return { geometry, uniforms: { uHistory: { value: Array.from({ length: STREAM_SAMPLES * 3 }, () => new Vector4()) },
      uOpacity: { value: 0 }, uPixelRatio: { value: 1 } } };
  }, [quality]);
  const basis = useMemo(() => {
    const aspect = size.width / size.height;
    const pose = storyCameraPath('works', 0, {}, false, aspect);
    const eye = new Vector3(pose.x, pose.y, pose.z);
    const target = new Vector3(pose.lookX, pose.lookY, pose.lookZ);
    const rotation = new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(eye, target, new Vector3(0, 1, 0)));
    const distance = 24;
    const height = 2 * Math.tan(Math.PI / 6) / Math.min(1, aspect) * distance;
    const width = height * aspect;
    const center = target.sub(eye).normalize().multiplyScalar(distance).add(eye);
    const hole = new Vector3(...BLACK_HOLE_CENTER).sub(center).applyQuaternion(rotation.clone().invert());
    const stage = worksStage(size.width, size.height, figures.map(figure => figure.bounds));
    const units = width / size.width;
    const mobile = size.width < 1024;
    const orbitX = (stage.orbit.x - size.width / 2) * units, orbitY = (size.height / 2 - stage.orbit.y) * units;
    // Open pose: the card flies forward in front of the lens, clear of the mono column.
    const lensOpen = [orbitX + (mobile ? 0 : width * 0.09), mobile ? height * 0.1 : orbitY];
    const perspective = distance / (distance - OPEN_Z);
    const open = figures.map(({ bounds }) => {
      const w = (bounds.right - bounds.left) * CARD_PAD, h = (bounds.top - bounds.bottom) * CARD_PAD;
      const scale = Math.min((mobile ? 0.34 : 0.44) * height / h, (mobile ? 0.86 : 0.42) * width / w) / perspective;
      return { scale, x: lensOpen[0] - (bounds.left + bounds.right) / 2 * scale, y: lensOpen[1] - (bounds.top + bounds.bottom) / 2 * scale, z: OPEN_Z };
    });
    // Glass cards are heavier than bare figures: ride the same orbit a size smaller.
    const figureScale = stage.scale * units * CARD_SCALE;
    return { center, rotation, hole, scale: figureScale, drift: stage.drift * units, depth: distance * 0.12,
      lens: [orbitX, orbitY], lensOpen, open, mobile,
      orbit: { x: (stage.orbit.x - size.width / 2) * units, y: (size.height / 2 - stage.orbit.y) * units, rx: stage.orbit.rx * units, ry: stage.orbit.ry * units },
      offsets: figures.map(({ bounds }) => [-(bounds.left + bounds.right) * figureScale / 2, -(bounds.top + bounds.bottom) * figureScale / 2]),
      centers: stage.centers.map(([x, y]) => [(x - size.width / 2) * units, (size.height / 2 - y) * units]) };
  }, [size.width, size.height, figures]);
  useEffect(() => () => figures.forEach(figure => { figure.points.dispose(); figure.lines.dispose(); }), [figures]);
  useEffect(() => () => trails.geometry.dispose(), [trails]);
  useEffect(() => () => streams.geometry.dispose(), [streams]);
  const lens = useMemo(() => ({
    target: new WebGLRenderTarget(1, 1, { minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false, stencilBuffer: false }),
    buffer: new Vector2(), point: new Vector3(), pointer: new Vector2(), raycaster: new Raycaster(), strength: 0, open: 0, scroll: 0, time: 0,
    uniforms: { uScene: { value: null }, uText: { value: null }, uResolution: { value: new Vector2(1, 1) }, uCenter: { value: new Vector2() },
      uEinstein: { value: 1 }, uShadow: { value: 1 }, uStrength: { value: 0 }, uTime: { value: 0 }, uWarm: { value: 0 },
      uTextAlpha: { value: 0 }, uTextScroll: { value: 0 }, uRing: { value: new Vector4(1, 0.5, -0.1, 1) } },
  }), []);
  const lensMesh = useRef(null);
  const frontMesh = useRef(null);
  useEffect(() => {
    lens.uniforms.uScene.value = lens.target.texture;
    lens.raycaster.layers.enableAll();
    const ring = createRingText();
    lens.ring = ring;
    lens.uniforms.uText.value = ring.texture;
    lens.tracker = createPointerTracker();
    return () => { lens.target.dispose(); ring.dispose(); lens.tracker.dispose(); };
  }, [lens]);
  useEffect(() => {
    let alive = true;
    const loader = new TextureLoader();
    const textures = PORTFOLIO_DATA.projects.map((project, i) => loader.load(import.meta.env.BASE_URL + project.imageUrl.replace(/^\//, ''), texture => {
      if (!alive) { texture.dispose(); return; }
      texture.colorSpace = SRGBColorSpace;
      const values = figures[i]?.cardUniforms;
      if (!values) return;
      values.uMap.value = texture; values.uMapReady.value = 1;
      values.uImageAspect.value = texture.image.width / texture.image.height;
    }, undefined, () => { /* The glass card stays usable without its picture. */ }));
    return () => { alive = false; textures.forEach(texture => texture.dispose()); };
  }, [figures]);
  useEffect(() => {
    let alive = true;
    const loader = new TextureLoader();
    const textures = data.constellations.map((item, i) => loader.load(import.meta.env.BASE_URL + item.artwork.url.replace(/^\//, ''), texture => {
      if (!alive) { texture.dispose(); return; }
      texture.colorSpace = SRGBColorSpace;
      const material = groups.current[i]?.children[2]?.material;
      if (material) { material.map = texture; material.needsUpdate = true; }
    }, undefined, () => { /* Stars and semantic targets remain usable if artwork fails. */ }));
    return () => { alive = false; textures.forEach(texture => texture.dispose()); };
  }, []);
  useEffect(() => () => { const data = layoutRef?.current; if (data) { data.ready = false; data.onChange?.(); } }, [layoutRef]);

  useFrame(({ gl, camera }, delta) => {
    if (!root.current) return;
    const state = useScrollStore.getState();
    const active = state.storyChapter === 'works';
    const arriving = state.storyChapter === 'departure';
    const finale = state.storyChapter === 'finale';
    const p = finale ? state.chapterProgress : 0;
    const authored = finaleState(p, phaseState.current);
    const arrival = frozen ? 1 : worksArrival(state.storyChapter, state.chapterProgress);
    if (arriving) {
      // Rest-pose figure centres in world space, the comet fragments' destinations.
      const phase = state.worksOrbit.latched ? state.worksOrbit.origin : state.worksOrbit.phase;
      for (let i = 0; i < figures.length; i++) {
        const pose = worksFigure(0, phase, i, basis, sampled.current), bounds = figures[i].bounds;
        const local = figures[i].projected.set(pose.x + (bounds.left + bounds.right) / 2 * pose.scale,
          pose.y + (bounds.top + bounds.bottom) / 2 * pose.scale, pose.z).applyQuaternion(basis.rotation).add(basis.center);
        meteorTargets.points[i].x = local.x; meteorTargets.points[i].y = local.y; meteorTargets.points[i].z = local.z;
      }
      meteorTargets.ready = true;
    }
    root.current.visible = active || arriving && arrival > 0 || !frozen && finale && p < 0.55;
    const selected = finale ? state.worksFinaleSelection : state.worksSelection ?? state.worksFocus ?? state.worksHover;
    advanceWorksOrbit(state.worksOrbit, delta, Boolean(selected), frozen, active && !document.hidden);
    lens.strength = !root.current.visible ? 0 : active ? 1 : arriving ? arrival : finale ? 1 - finaleSmooth(0, 0.12, p) : 0;
    if (!root.current.visible) { projectWorks(layoutRef, root.current, camera, figures, groups.current, size, basis, false); return; }
    const dt = Math.min(0.05, Math.max(0, delta));
    if (!frozen) lens.time += dt;
    const opened = active ? state.worksSelection : null;
    const lensOn = lens.strength > 0.002;
    // Swirl only under a real mouse; touch keeps tap-to-open.
    let hit = null, hitCard = null;
    if (active && !frozen && lens.tracker?.mouse) {
      lens.pointer.set(lens.tracker.x / size.width * 2 - 1, 1 - lens.tracker.y / size.height * 2);
      lens.raycaster.setFromCamera(lens.pointer, camera);
      const found = lens.raycaster.intersectObjects(groups.current.map(group => group?.children[3]).filter(Boolean), false)[0];
      if (found?.uv) { hit = found.uv; hitCard = found.object; }
    }
    let openAmount = 0, hoverAmount = 0;
    const phase = state.worksOrbit.latched ? state.worksOrbit.origin : state.worksOrbit.phase;
    root.current.userData.phase = phase;
    root.current.userData.progress = p;
    for (let i = 0; i < groups.current.length; i++) {
      const group = groups.current[i];
      if (!group) continue;
      const figure = figures[i], id = WORKS_IDS[i];
      figure.open = frozen ? Number(opened === id) : damp(figure.open, Number(opened === id), 3.4, dt);
      const o = smooth(figure.open);
      const pose = worksFigure(p, phase, i, basis, sampled.current);
      if (o > 0.0001) {
        // Fly out of the ring toward the camera, arcing forward on the way.
        const flight = basis.open[i];
        pose.x += (flight.x - pose.x) * o; pose.y += (flight.y - pose.y) * o;
        pose.z += (flight.z - pose.z) * o + Math.sin(o * Math.PI) * 2.5;
        pose.scale += (flight.scale - pose.scale) * o;
      }
      group.position.set(pose.x, pose.y, pose.z);
      group.scale.setScalar(pose.scale);
      const behind = lensOn && pose.z < -0.05;
      setLayer(group, behind, lensOn && !behind ? 11 : 0);
      const highlighted = selected === id;
      figure.hover = frozen ? Number(highlighted) : damp(figure.hover, Number(highlighted), 6, dt);
      openAmount = Math.max(openAmount, o); hoverAmount = Math.max(hoverAmount, figure.hover);
      const card = figure.cardUniforms;
      // The glass gives way to the tidal streams as the finale's inspiral begins.
      card.uOpacity.value = arrival * (1 - finaleSmooth(0.1, 0.26, p)) * (opened && opened !== id ? 0.3 : 1);
      card.uHover.value = figure.hover; card.uOpen.value = o; card.uTime.value = lens.time;
      if (hitCard === group.children[3]) stepTrail(figure.trail, hit, figure.card[0] / figure.card[1], dt);
      else if (frozen || !active) clearTrail(figure.trail);
      else stepTrail(figure.trail, null, 1, dt);
      const energy = finaleSmooth(0.34, 0.44, p);
      const strength = (highlighted ? 1.6 : selected ? 0.65 : 1) * authored.stars * arrival * (1 + energy * 3);
      group.children[0].material.opacity = (highlighted ? 0.65 : 0.16) * authored.stars * arrival;
      group.children[1].material.uniforms.uStrength.value = strength;
      group.children[1].material.uniforms.uActive.value = (highlighted ? 1 : 0) + energy * 2;
      group.children[1].material.uniforms.uPixelRatio.value = gl.getPixelRatio();
      const art = group.children[2].material;
      art.opacity = art.map ? (highlighted ? 0.3 : 0.1) * (1 - 0.7 * o) * authored.stars * arrival : 0;
    }
    if (lensOn) {
      const values = lens.uniforms;
      const dpr = gl.getPixelRatio();
      root.current.updateWorldMatrix(true, false);
      lens.point.set(basis.lens[0] + (basis.lensOpen[0] - basis.lens[0]) * openAmount,
        basis.lens[1] + (basis.lensOpen[1] - basis.lens[1]) * openAmount, 0).applyMatrix4(root.current.matrixWorld).project(camera);
      values.uCenter.value.set((lens.point.x + 1) / 2 * size.width * dpr, (lens.point.y + 1) / 2 * size.height * dpr);
      const short = Math.min(size.width, size.height) * dpr;
      values.uEinstein.value = short * (0.075 + 0.105 * openAmount);
      values.uShadow.value = values.uEinstein.value * (0.42 - 0.17 * openAmount);
      values.uStrength.value = lens.strength;
      values.uTime.value = lens.time;
      values.uWarm.value = Math.max(openAmount, hoverAmount * 0.6);
      // The open project's name rides a tilted ring: lifted through the lens behind, crossing in front.
      const radius = basis.mobile ? size.width * 0.46 : Math.min(size.height * 0.5, size.width * 0.3);
      values.uRing.value.set(radius * dpr, basis.mobile ? 0.62 : 0.5, -0.1, size.height * (basis.mobile ? 0.07 : 0.11) * dpr);
      values.uTextAlpha.value = smooth(Math.max(0, Math.min(1, (openAmount - 0.3) / 0.7)));
      if (!frozen) lens.scroll += dt * 0.012;
      values.uTextScroll.value = lens.scroll;
      const index = WORKS_IDS.indexOf(opened);
      if (index >= 0 && lens.ring) {
        const path = `works.projects.${CARD_KEYS[index]}`;
        lens.ring.update(`${i18n.t(`${path}.title`)} • ${i18n.t('works.voyage', { number: `0${index + 1}` }).toUpperCase()} • ${i18n.t(`${path}.category`)} • `);
      }
    }
    projectWorks(layoutRef, root.current, camera, figures, groups.current, size, basis, active);
    streamMesh.current.visible = finale && authored.streams > 0;
    if (streamMesh.current.visible) {
      const values = streamMesh.current.material.uniforms;
      values.uOpacity.value = authored.streams;
      values.uPixelRatio.value = gl.getPixelRatio();
      for (let f = 0; f < 3; f++) for (let k = 0; k < STREAM_SAMPLES; k++) {
        const pose = worksFigure(Math.max(0, p - k / (STREAM_SAMPLES - 1) * STREAM_LAG), phase, f, basis, sampled.current);
        values.uHistory.value[f * STREAM_SAMPLES + k].set(pose.x, pose.y, pose.z, pose.scale);
      }
    }
    trailMesh.current.visible = finale && authored.trails > 0;
    trailMesh.current.material.uniforms.uOpacity.value = authored.trails * 0.2;
    if (trailMesh.current.visible) {
      const attribute = trailMesh.current.geometry.attributes.position;
      const array = attribute.array;
      let cursor = 0;
      // History is authored progress, never a list of previously rendered frames.
      for (let i = 0; i < trails.stars.length; i++) {
        const star = trails.stars[i];
        for (let j = 0; j < trails.samples; j++) for (let end = 0; end < 2; end++) {
          const q = Math.max(0, p - (j + end) / trails.samples * 0.055);
          const pose = worksFigure(q, phase, star.index, basis, sampled.current);
          array[cursor++] = pose.x + star.position[0] * pose.scale;
          array[cursor++] = pose.y + star.position[1] * pose.scale;
          array[cursor++] = pose.z + star.position[2] * pose.scale;
        }
      }
      attribute.needsUpdate = true;
    }
  }, -0.75);

  useFrame(({ gl, scene, camera }) => {
    const mesh = lensMesh.current;
    if (!mesh) return;
    mesh.visible = lens.strength > 0.002 && Boolean(root.current?.visible);
    if (frontMesh.current) frontMesh.current.visible = mesh.visible && lens.uniforms.uTextAlpha.value > 0.001;
    if (!mesh.visible) return;
    gl.getDrawingBufferSize(lens.buffer);
    if (lens.target.width !== lens.buffer.x || lens.target.height !== lens.buffer.y) lens.target.setSize(lens.buffer.x, lens.buffer.y);
    lens.uniforms.uResolution.value.copy(lens.buffer);
    // Cards behind the lens plane, alone, for the lens to bend; same camera, same frame.
    const previous = gl.getRenderTarget(), autoClear = gl.autoClear, background = scene.background;
    const mask = camera.layers.mask, clearAlpha = gl.getClearAlpha();
    try {
      scene.background = null;
      camera.layers.set(BEHIND_LAYER);
      gl.autoClear = true;
      gl.setRenderTarget(lens.target);
      gl.setClearAlpha(0);
      gl.render(scene, camera);
    } finally {
      gl.setClearAlpha(clearAlpha);
      gl.setRenderTarget(previous);
      gl.autoClear = autoClear;
      camera.layers.mask = mask;
      scene.background = background;
    }
  }, -0.6);

  return <>
  <mesh ref={lensMesh} name="works-lens" frustumCulled={false} renderOrder={9} visible={false}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial vertexShader={WORKS_LENS_VERT} fragmentShader={WORKS_LENS_FRAG} uniforms={lens.uniforms}
      onUpdate={material => { material.uniforms = lens.uniforms; }} transparent premultipliedAlpha depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>
  <mesh ref={frontMesh} name="works-lens-front" frustumCulled={false} renderOrder={12} visible={false}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial vertexShader={WORKS_LENS_VERT} fragmentShader={WORKS_LENS_FRAG} uniforms={lens.uniforms} defines={{ FRONT_PASS: 1 }}
      onUpdate={material => { material.uniforms = lens.uniforms; }} transparent premultipliedAlpha depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>
  <group ref={root} name="works-constellations" position={basis.center} quaternion={basis.rotation}>
    {figures.map((figure, i) => <group key={WORKS_IDS[i]} name={`works-${WORKS_IDS[i]}`} ref={group => { groups.current[i] = group; }}>
      <lineSegments geometry={figure.lines} frustumCulled={false} userData={{ order: 0.2 }}>
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.13} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <points geometry={figure.points} frustumCulled={false} userData={{ order: 0.3 }}>
        <shaderMaterial vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={figure.uniforms} transparent depthWrite={false} toneMapped={false} />
      </points>
      <mesh name={`works-art-${WORKS_IDS[i]}`} userData={{ order: 0.1 }} position={[...data.constellations[i].artwork.plane.center.slice(0, 2), data.constellations[i].artwork.plane.localZ]}>
        <planeGeometry args={[data.constellations[i].artwork.plane.width, data.constellations[i].artwork.plane.height]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh name={`works-card-${WORKS_IDS[i]}`} position={figure.cardCenter} frustumCulled={false}>
        <planeGeometry args={figure.card} />
        <shaderMaterial vertexShader={WORKS_CARD_VERT} fragmentShader={WORKS_CARD_FRAG} uniforms={figure.cardUniforms}
          onUpdate={material => { material.uniforms = figure.cardUniforms; }} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>)}
    <Select enabled>
      <points ref={streamMesh} name="finale-streams" geometry={streams.geometry} frustumCulled={false} renderOrder={6} visible={false}>
        <shaderMaterial vertexShader={STREAM_VERT} fragmentShader={STREAM_FRAG} uniforms={streams.uniforms}
          onUpdate={material => { material.uniforms = streams.uniforms; }} transparent depthTest={false} depthWrite={false} toneMapped={false} blending={AdditiveBlending} />
      </points>
    </Select>
    <lineSegments ref={trailMesh} name="finale-trails" geometry={trails.geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={TRAIL_VERT} fragmentShader={TRAIL_FRAG} uniforms={trails.uniforms}
        onUpdate={material => { material.uniforms = trails.uniforms; }} transparent depthWrite={false} toneMapped={false} />
    </lineSegments>
  </group>
  </>;
}
