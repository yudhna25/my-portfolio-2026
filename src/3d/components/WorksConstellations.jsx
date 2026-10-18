import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import { AdditiveBlending, BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, DynamicDrawUsage, Matrix4, Quaternion, SRGBColorSpace, TextureLoader, Vector2, Vector3, Vector4 } from 'three';
import data from '@/3d/data/worksConstellations.json';
import { PORTFOLIO_DATA } from '@/data';
import { useGravityField } from '@/3d/field/useGravityField';
import { ART_FRAG, ART_VERT, GRID_FRAG, GRID_VERT, PLATE_FRAG, PLATE_VERT } from '@/3d/shaders/worksAtlas';
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
// Each project is a plate in a night-sky star atlas (see worksAtlas.js).
const IMAGE_ASPECTS = [1600 / 1131, 16 / 9, 16 / 9];
const OPEN_Z = 2;
const FIGURE_SCALE = 0.9;
const ART_PIXELS = 1536;
const damp = (value, target, rate, delta) => target + (value - target) * Math.exp(-rate * delta);
const smooth = t => t * t * (3 - 2 * t);

// RA/Dec graticule in the figure's own gnomonic projection (x = celestial west right).
function buildGraticule(item, origin, reach) {
  const { raDeg, decDeg } = item.projection.origin;
  const scale = item.projection.uniformScale, rad = Math.PI / 180;
  const ra0 = raDeg * rad, dec0 = decDeg * rad;
  const project = (ra, dec) => {
    const a = ra * rad, d = dec * rad;
    const c = Math.sin(dec0) * Math.sin(d) + Math.cos(dec0) * Math.cos(d) * Math.cos(a - ra0);
    if (c < 0.2) return null;
    return [-Math.cos(d) * Math.sin(a - ra0) / c * scale, (Math.cos(dec0) * Math.sin(d) - Math.sin(dec0) * Math.cos(d) * Math.cos(a - ra0)) / c * scale];
  };
  const positions = [], radii = [];
  const segment = (from, to) => {
    if (!from || !to) return;
    const r0 = Math.hypot(from[0] - origin[0], from[1] - origin[1]) / reach, r1 = Math.hypot(to[0] - origin[0], to[1] - origin[1]) / reach;
    if (r0 > 1 && r1 > 1) return;
    positions.push(from[0], from[1], -0.02, to[0], to[1], -0.02);
    radii.push(r0, r1);
  };
  const span = 40;
  const decStart = Math.ceil((decDeg - span) / 5) * 5;
  for (let dec = decStart; dec <= decDeg + span; dec += 5) {
    for (let ra = raDeg - span * 2; ra < raDeg + span * 2; ra += 1) segment(project(ra, dec), project(ra + 1, dec));
  }
  const raStart = Math.ceil((raDeg - span * 2) / 7.5) * 7.5;
  for (let ra = raStart; ra <= raDeg + span * 2; ra += 7.5) {
    for (let dec = decDeg - span; dec < decDeg + span; dec += 1) segment(project(ra, dec), project(ra, dec + 1));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute('aRadius', new BufferAttribute(new Float32Array(radii), 1));
  return geometry;
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
  const field = useGravityField();
  const motion = useRef(WORKS_IDS.map(() => ({ reveal: 0, open: 0 })));
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
    const index = data.constellations.indexOf(item), aspect = IMAGE_ASPECTS[index];
    const { plane } = item.artwork;
    const rect = new Vector4(plane.center[0], plane.center[1], plane.width, plane.width / aspect);
    const bright = item.geometry.stars.reduce((a, b) => (b.vmag < a.vmag ? b : a));
    const toUv = (x, y, w, h, cx, cy) => new Vector2((x - cx) / w + 0.5, (y - cy) / h + 0.5);
    return { points, lines, bounds, corners, projected: new Vector3(), rect, plane,
      grid: buildGraticule(item, bright.position, plane.width * 0.62),
      gridUniforms: { uReveal: { value: 0 }, uOpacity: { value: 0 } },
      artUniforms: { uMap: { value: null }, uField: field.uniform, uViewport: { value: new Vector2(1, 1) }, uSize: { value: new Vector2(plane.width, plane.height) },
        uOrigin: { value: toUv(...bright.position.slice(0, 2), plane.width, plane.height, plane.center[0], plane.center[1]) },
        uReveal: { value: 0 }, uFlip: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: 0 }, uIdle: { value: 0.1 } },
      plateUniforms: { uMap: { value: null }, uField: field.uniform, uViewport: { value: new Vector2(1, 1) }, uAspect: { value: aspect },
        uLines: { value: 96 }, uDraw: { value: 0 }, uOpen: { value: 0 }, uTime: { value: 0 }, uOpacity: { value: 0 },
        uOrigin: { value: toUv(...bright.position.slice(0, 2), rect.z, rect.w, rect.x, rect.y) } },
      uniforms: { uPixelRatio: { value: 1 }, uStrength: { value: 1 }, uActive: { value: 0 } } };
  }), [field]);
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
    const figureScale = stage.scale * units * FIGURE_SCALE;
    // Open: the figure comes forward, its received picture large, clear of the mono column.
    const openCenter = [(stage.orbit.x - size.width / 2) * units + (mobile ? 0 : width * 0.12), mobile ? height * 0.21 : (size.height / 2 - stage.orbit.y) * units];
    const perspective = distance / (distance - OPEN_Z);
    const open = figures.map(({ rect }) => {
      const scale = Math.min((mobile ? 0.32 : 0.58) * height / rect.w, (mobile ? 0.9 : 0.5) * width / rect.z) / perspective;
      return { scale, x: openCenter[0] - rect.x * scale, y: openCenter[1] - rect.y * scale, z: OPEN_Z };
    });
    return { center, rotation, hole, units, scale: figureScale, drift: stage.drift * units, depth: distance * 0.08, open,
      orbit: { x: (stage.orbit.x - size.width / 2) * units, y: (size.height / 2 - stage.orbit.y) * units, rx: stage.orbit.rx * units, ry: stage.orbit.ry * units },
      offsets: figures.map(({ bounds }) => [-(bounds.left + bounds.right) * figureScale / 2, -(bounds.top + bounds.bottom) * figureScale / 2]),
      centers: stage.centers.map(([x, y]) => [(x - size.width / 2) * units, (size.height / 2 - y) * units]) };
  }, [size.width, size.height, figures]);
  useEffect(() => () => figures.forEach(figure => { figure.points.dispose(); figure.lines.dispose(); figure.grid.dispose(); }), [figures]);
  useEffect(() => {
    let alive = true;
    const loader = new TextureLoader();
    const textures = PORTFOLIO_DATA.projects.map((project, i) => loader.load(import.meta.env.BASE_URL + project.imageUrl.replace(/^\//, ''), texture => {
      if (!alive) { texture.dispose(); return; }
      texture.colorSpace = SRGBColorSpace;
      figures[i].plateUniforms.uMap.value = texture;
    }, undefined, () => { /* The constellation stays usable without its picture. */ }));
    return () => { alive = false; textures.forEach(texture => texture.dispose()); };
  }, [figures]);
  useEffect(() => () => trails.geometry.dispose(), [trails]);
  useEffect(() => () => streams.geometry.dispose(), [streams]);
  useEffect(() => {
    let alive = true;
    const textures = [];
    // Rasterise the vector figures large: the open page fills a third of the screen.
    data.constellations.forEach((item, i) => {
      const image = new Image();
      image.src = import.meta.env.BASE_URL + item.artwork.url.replace(/^\//, '');
      image.decode().then(() => {
        if (!alive) return;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = ART_PIXELS;
        canvas.getContext('2d').drawImage(image, 0, 0, ART_PIXELS, ART_PIXELS);
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = SRGBColorSpace;
        textures.push(texture);
        figures[i].artUniforms.uMap.value = texture;
      }).catch(() => { /* Stars and semantic targets remain usable if artwork fails. */ });
    });
    return () => { alive = false; textures.forEach(texture => texture.dispose()); };
  }, [figures]);
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
    if (!root.current.visible) { projectWorks(layoutRef, root.current, camera, figures, groups.current, size, basis, false); return; }
    const dt = Math.min(0.05, Math.max(0, delta));
    const opened = active ? state.worksSelection : null;
    const phase = state.worksOrbit.latched ? state.worksOrbit.origin : state.worksOrbit.phase;
    root.current.userData.phase = phase;
    root.current.userData.progress = p;
    for (let i = 0; i < groups.current.length; i++) {
      const group = groups.current[i];
      if (!group) continue;
      const id = WORKS_IDS[i], held = motion.current[i];
      const highlighted = selected === id;
      held.open = frozen ? Number(opened === id) : damp(held.open, Number(opened === id), 2.6, dt);
      // The engraving is cut while the figure is held, and fades faster than it was cut.
      const want = Number(highlighted && active);
      held.reveal = frozen ? want : damp(held.reveal, want, want > held.reveal ? 0.9 : 3, dt);
      const o = smooth(held.open);
      const pose = worksFigure(p, phase, i, basis, sampled.current);
      if (o > 0.0001) {
        const flight = basis.open[i];
        pose.x += (flight.x - pose.x) * o; pose.y += (flight.y - pose.y) * o;
        pose.z += (flight.z - pose.z) * o;
        pose.scale += (flight.scale - pose.scale) * o;
      }
      group.position.set(pose.x, pose.y, pose.z);
      group.scale.setScalar(pose.scale);
      const dim = opened && opened !== id ? 0.12 : 1;
      const reveal = Math.max(held.reveal, o);
      // Through the materials, as for the star points; the memo stays read-only here.
      const art = group.children[2].material.uniforms;
      art.uReveal.value = reveal; art.uFlip.value = o;
      art.uTime.value += frozen ? 0 : dt;
      art.uViewport.value.set(size.width, size.height);
      art.uOpacity.value = art.uMap.value ? authored.stars * arrival * dim : 0;
      const plate = group.children[3].material.uniforms;
      plate.uDraw.value = reveal; plate.uOpen.value = o; plate.uTime.value = art.uTime.value;
      plate.uViewport.value.set(size.width, size.height);
      // Engraved lines keep a steady spacing on screen, however large the plate is drawn.
      plate.uLines.value = Math.min(120, Math.max(36, figures[i].rect.w * pose.scale / basis.units / (quality === 'low' ? 6 : 4.5)));
      plate.uOpacity.value = plate.uMap.value ? authored.label * arrival * dim : 0;
      const grid = group.children[4].material.uniforms;
      grid.uReveal.value = reveal;
      grid.uOpacity.value = authored.label * arrival * dim * (1 - 0.5 * o);
      const energy = finaleSmooth(0.34, 0.44, p);
      const strength = (highlighted ? 1.6 : selected ? 0.65 : 1) * authored.stars * arrival * (1 + energy * 3) * dim;
      group.children[0].material.opacity = (highlighted ? 0.55 : 0.16) * authored.stars * arrival * dim * (1 - 0.6 * o);
      group.children[1].material.uniforms.uStrength.value = strength;
      group.children[1].material.uniforms.uActive.value = (highlighted ? 1 : 0) + energy * 2;
      group.children[1].material.uniforms.uPixelRatio.value = gl.getPixelRatio();
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

  return <group ref={root} name="works-constellations" position={basis.center} quaternion={basis.rotation}>
    {figures.map((figure, i) => <group key={WORKS_IDS[i]} name={`works-${WORKS_IDS[i]}`} ref={group => { groups.current[i] = group; }}>
      <lineSegments geometry={figure.lines} frustumCulled={false} renderOrder={4}>
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.13} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <points geometry={figure.points} frustumCulled={false} renderOrder={5}>
        <shaderMaterial vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={figure.uniforms} transparent depthWrite={false} toneMapped={false} />
      </points>
      <mesh name={`works-art-${WORKS_IDS[i]}`} position={[figure.plane.center[0], figure.plane.center[1], figure.plane.localZ]} renderOrder={3}>
        <planeGeometry args={[figure.plane.width, figure.plane.height, 48, 1]} />
        <shaderMaterial vertexShader={ART_VERT} fragmentShader={ART_FRAG} uniforms={figure.artUniforms}
          onUpdate={material => { material.uniforms = figure.artUniforms; }} transparent depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh position={[figure.rect.x, figure.rect.y, figure.plane.localZ - 0.005]} renderOrder={1}>
        <planeGeometry args={[figure.rect.z, figure.rect.w]} />
        <shaderMaterial vertexShader={PLATE_VERT} fragmentShader={PLATE_FRAG} uniforms={figure.plateUniforms}
          onUpdate={material => { material.uniforms = figure.plateUniforms; }} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <lineSegments geometry={figure.grid} frustumCulled={false} renderOrder={2}>
        <shaderMaterial vertexShader={GRID_VERT} fragmentShader={GRID_FRAG} uniforms={figure.gridUniforms}
          onUpdate={material => { material.uniforms = figure.gridUniforms; }} transparent depthWrite={false} toneMapped={false} />
      </lineSegments>
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
  </group>;
}
