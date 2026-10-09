import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DynamicDrawUsage, Matrix4, Quaternion, Vector3 } from 'three';
import data from '@/3d/data/worksConstellations.json';
import { BLACK_HOLE_CENTER, storyCameraPath } from '@/3d/utils/cameraPath';
import { advanceWorksOrbit, WORKS_IDS } from '@/3d/utils/worksOrbit';
import { finaleFigure, finaleState } from '@/3d/utils/finale';
import { worksArrival } from '@/3d/utils/storyMeteor';
import { useScrollStore } from '@/stores/useScrollStore';

// Stellarium Modern / CC BY-SA 4.0; Hipparcos ICRS J1991.25.
// See worksConstellations.json for exact coordinates, edges and attribution.
const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aRole;
  uniform float uPixelRatio;
  varying float vRole;
  void main() {
    vRole = aRole;
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const STAR_FRAG = /* glsl */ `
  uniform float uStrength;
  varying float vRole;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.05, 0.5, d);
    if (d > 0.5) discard;
    gl_FragColor = vec4(vec3(1.0), core * core * vRole * uStrength);
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

export function WorksConstellations({ frozen = false, quality = 'high' }) {
  const root = useRef(null);
  const trailMesh = useRef(null);
  const phaseState = useRef({});
  const sampled = useRef({});
  const groups = useRef([]);
  const size = useThree(state => state.size);
  const figures = useMemo(() => data.constellations.map(item => {
    const stars = [...item.geometry.stars, ...item.geometry.supportingStars];
    const byId = new Map(item.geometry.stars.map(star => [star.id, star.position]));
    const points = new BufferGeometry();
    points.setAttribute('position', new BufferAttribute(new Float32Array(stars.flatMap(star => star.position)), 3));
    points.setAttribute('aSize', new BufferAttribute(new Float32Array(stars.map((star, i) => i < item.geometry.stars.length ? Math.max(5, 10 - star.vmag) : 2.5)), 1));
    points.setAttribute('aRole', new BufferAttribute(new Float32Array(stars.map((_, i) => i < item.geometry.stars.length ? 1 : 0.25)), 1));
    const lines = new BufferGeometry();
    lines.setAttribute('position', new BufferAttribute(new Float32Array(item.geometry.edges.flatMap(edge => edge.flatMap(id => byId.get(id)))), 3));
    return { points, lines, uniforms: { uPixelRatio: { value: 1 }, uStrength: { value: 1 } } };
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
    return { center, rotation, hole,
      radiusX: width * 0.28, radiusY: height * (aspect < 1 ? 0.17 : 0.13), scale: Math.min(width * 0.15, height * 0.13), offsetY: height * 0.04 };
  }, [size.width, size.height]);
  useEffect(() => () => figures.forEach(figure => { figure.points.dispose(); figure.lines.dispose(); }), [figures]);
  useEffect(() => () => trails.geometry.dispose(), [trails]);

  useFrame(({ gl }, delta) => {
    if (!root.current) return;
    const state = useScrollStore.getState();
    const active = state.storyChapter === 'works';
    const arriving = state.storyChapter === 'departure';
    const finale = state.storyChapter === 'finale';
    const p = finale ? state.chapterProgress : 0;
    const authored = finaleState(p, phaseState.current);
    const arrival = frozen ? 1 : worksArrival(state.storyChapter, state.chapterProgress);
    root.current.visible = active || arriving && arrival > 0 || !frozen && finale && p < 0.55;
    const selected = finale ? state.worksFinaleSelection : state.worksSelection ?? state.worksFocus ?? state.worksHover;
    advanceWorksOrbit(state.worksOrbit, delta, Boolean(selected), frozen, active && !document.hidden);
    if (!root.current.visible) return;
    const phase = state.worksOrbit.latched ? state.worksOrbit.origin : state.worksOrbit.phase;
    root.current.userData.phase = phase;
    root.current.userData.progress = p;
    for (let i = 0; i < groups.current.length; i++) {
      const group = groups.current[i];
      if (!group) continue;
      const pose = finaleFigure(p, phase, i, basis, sampled.current);
      group.position.set(pose.x, pose.y, pose.z);
      group.scale.setScalar(pose.scale);
      const strength = (selected ? selected === WORKS_IDS[i] ? 1.2 : 0.35 : 1) * authored.stars * arrival;
      group.children[0].material.opacity = 0.13 * strength;
      group.children[1].material.uniforms.uStrength.value = strength;
      group.children[1].material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    }
    trailMesh.current.visible = finale && authored.trails > 0;
    trailMesh.current.material.uniforms.uOpacity.value = authored.trails * 0.16;
    if (trailMesh.current.visible) {
      const attribute = trailMesh.current.geometry.attributes.position;
      const array = attribute.array;
      let cursor = 0;
      // History is authored progress, never a list of previously rendered frames.
      for (let i = 0; i < trails.stars.length; i++) {
        const star = trails.stars[i];
        for (let j = 0; j < trails.samples; j++) for (let end = 0; end < 2; end++) {
          const q = Math.max(0, p - (j + end) / trails.samples * 0.055);
          const pose = finaleFigure(q, phase, star.index, basis, sampled.current);
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
      <lineSegments geometry={figure.lines} frustumCulled={false}>
        <lineBasicMaterial color="#FFFFFF" transparent opacity={0.13} depthWrite={false} toneMapped={false} />
      </lineSegments>
      <points geometry={figure.points} frustumCulled={false}>
        <shaderMaterial vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={figure.uniforms} transparent depthWrite={false} toneMapped={false} />
      </points>
    </group>)}
    <lineSegments ref={trailMesh} name="finale-trails" geometry={trails.geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={TRAIL_VERT} fragmentShader={TRAIL_FRAG} uniforms={trails.uniforms}
        onUpdate={material => { material.uniforms = trails.uniforms; }} transparent depthWrite={false} toneMapped={false} />
    </lineSegments>
  </group>;
}
