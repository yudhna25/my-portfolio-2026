import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix3, Matrix4, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3 } from 'three';
import { RAY_QUALITY } from '@/3d/quality';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { BLACK_HOLE_VERT, BLACK_HOLE_FRAG, BLACK_HOLE_COPY } from '@/3d/shaders/blackHole';
import { useScrollStore } from '@/stores/useScrollStore';
import { portalProgress, portalState } from '@/3d/utils/portal';
import { finaleState } from '@/3d/utils/finale';

const center = new Vector3(...BLACK_HOLE_CENTER);

export function BlackHole({ target, frozen = false, quality = 'high', story = false, reduced = false, portal }) {
  const rendererRef = useRef(null);
  const phase = useRef({});
  const finale = useRef({});
  const copyDefines = useMemo(() => ({ FINALE_OCTAVES: quality === 'low' ? 2 : quality === 'medium' ? 3 : 4 }), [quality]);
  const projected = useMemo(() => new Vector3(), []);
  const bufferSize = useMemo(() => new Vector2(), []);
  const renderer = useMemo(() => {
    const tier = RAY_QUALITY[quality];
    const material = new ShaderMaterial({
      vertexShader: BLACK_HOLE_VERT,
      fragmentShader: BLACK_HOLE_FRAG,
      defines: { TRACE_STEPS: tier.steps, TRACE_STEP: tier.step },
      uniforms: {
        uTime: { value: 0 },
        uDiskIntensity: { value: 1 },
        uObserver: { value: new Vector3() },
        uCameraMatrix: { value: new Matrix4() },
        uInverseProjection: { value: new Matrix4() },
        // A real tilted disk plane: 55° screen diagonal, slightly above edge-on.
        uDiskFrame: { value: new Matrix3().setFromMatrix4(new Matrix4().makeRotationZ(55 * Math.PI / 180)
          .multiply(new Matrix4().makeRotationX(4 * Math.PI / 180))).transpose() },
        ...portal,
      },
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const geometry = new PlaneGeometry(2, 2);
    const scene = new Scene();
    scene.add(new Mesh(geometry, material));
    return { scene, material, geometry, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, [quality, portal]);
  const copyUniforms = useMemo(() => ({ uImage: { value: target.texture }, ...portal }), [target, portal]);
  useEffect(() => {
    rendererRef.current = renderer;
    return () => {
      rendererRef.current = null;
      renderer.material.dispose();
      renderer.geometry.dispose();
    };
  }, [renderer]);

  useFrame(({ camera, gl }, delta) => {
    camera.updateMatrixWorld();
    const active = rendererRef.current;
    if (!active) return;
    const uniforms = active.material.uniforms;
    gl.getDrawingBufferSize(bufferSize);
    if (target.width !== bufferSize.x || target.height !== bufferSize.y) target.setSize(bufferSize.x, bufferSize.y);
    const state = useScrollStore.getState();
    portal.uPortalEnabled.value = story ? 1 : 0;
    const ending = story && (state.storyChapter === 'finale' || state.storyChapter === 'contact');
    portal.uFinaleEnabled.value = ending ? 1 : 0;
    const authored = finaleState(reduced || state.storyChapter === 'contact' ? 1 : state.chapterProgress, finale.current);
    portal.uFinaleHole.value = ending ? authored.hole : 1;
    portal.uFinaleOrigin.value = state.worksOrbit.origin;
    portal.uFinaleGas.value.set(authored.cloud, authored.collapse, authored.flare, authored.progress);
    if (story) {
      const p = portalProgress(state.storyChapter, state.chapterProgress, reduced);
      portalState(p, phase.current);
      const anchor = state.storyAnchor;
      // Match the Canvas CSS viewport immediately; Fiber's resize observer may lag.
      const cssWidth = window.innerWidth, cssHeight = window.innerHeight;
      const width = anchor?.width || 32, height = anchor?.height || 40;
      const left = anchor?.left ?? cssWidth * 0.75, top = anchor?.top ?? cssHeight * 0.2;
      const anchorX = (left + width / 2) / cssWidth, anchorY = 1 - (top + height / 2) / cssHeight;
      portal.uPortalCenter.value.set(anchorX + (0.5 - anchorX) * phase.current.center,
        anchorY + (0.55 - anchorY) * phase.current.center);
      portal.uPortalViewport.value.set(cssWidth, cssHeight);
      projected.copy(center).project(camera);
      portal.uRayCenter.value.set(Number.isFinite(projected.x) ? projected.x * 0.5 + 0.5 : 0.5,
        Number.isFinite(projected.y) ? projected.y * 0.5 + 0.5 : 0.5);
      const radius = Math.max(1.1, camera.position.distanceTo(center));
      const shadowAngle = Math.asin(Math.min(0.999, 2.598076 * Math.sqrt(1 - 1 / radius) / radius));
      const shadow = Math.tan(shadowAngle) * cssHeight / (2 * Math.tan(camera.fov * Math.PI / 360));
      // The anchor is the cap-height slot, not the counter of a visible O glyph.
      portal.uPortalScale.value = Math.max(0.001, height * 0.48 / shadow) * phase.current.growth;
      portal.uPortalRadius.value.set(height * 2.8 * phase.current.growth, height * 1.4 * phase.current.growth);
      portal.uPortalMini.value = phase.current.mini;
      portal.uPortalVisibility.value = phase.current.visibility;
      portal.uPortalDust.value = phase.current.dust;
      portal.uPortalPull.value = phase.current.pull;
    }
    uniforms.uDiskIntensity.value = 1 + (ending ? 0.35 * authored.hole : 0);
    uniforms.uObserver.value.copy(camera.position).sub(center);
    const observer = uniforms.uObserver.value;
    const observerRadius = observer.length();
    // Cinematic zoom/rebase must never send a static ray observer through rs=1.
    if (!Number.isFinite(observerRadius) || observerRadius < 0.000001) observer.set(0, 0, 1.1);
    else if (observerRadius < 1.1) observer.multiplyScalar(1.1 / observerRadius);
    uniforms.uCameraMatrix.value.copy(camera.matrixWorld);
    uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    if (story) uniforms.uTime.value = ending ? authored.collapse * 3 : 0;
    else if (!frozen) uniforms.uTime.value += Math.min(delta, 0.1);
    // Preserve R3F/composer state: the HDR ray image is rendered exactly once.
    const previousTarget = gl.getRenderTarget();
    const autoClear = gl.autoClear;
    const xr = gl.xr.enabled;
    const clearAlpha = gl.getClearAlpha();
    try {
      gl.xr.enabled = false;
      gl.autoClear = true;
      gl.setRenderTarget(target);
      gl.setClearAlpha(0);
      gl.render(active.scene, active.camera);
    } finally {
      gl.setClearAlpha(clearAlpha);
      gl.setRenderTarget(previousTarget);
      gl.autoClear = autoClear;
      gl.xr.enabled = xr;
    }
  });

  return (
    <group name="black-hole">
      <mesh name="accretion-disk" frustumCulled={false} renderOrder={10}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          vertexShader={BLACK_HOLE_VERT} fragmentShader={BLACK_HOLE_COPY}
          defines={copyDefines}
          uniforms={copyUniforms} transparent toneMapped={false}
          // Fiber copies scalar uniform wrappers; retain the shared copy/mask objects.
          onUpdate={material => { material.uniforms = copyUniforms; material.needsUpdate = true; }}
          depthWrite={false} depthTest={false}
        />
      </mesh>
    </group>
  );
}
