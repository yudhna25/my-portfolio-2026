import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector3 } from 'three';
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
      },
      depthTest: false, depthWrite: false, toneMapped: false,
    });
    const geometry = new PlaneGeometry(2, 2);
    const scene = new Scene();
    scene.add(new Mesh(geometry, material));
    return { scene, material, geometry, camera: new OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, [quality]);
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
      portal.uPortalCenter.value.set((left + width / 2) / cssWidth, 1 - (top + height / 2) / cssHeight);
      portal.uPortalViewport.value.set(cssWidth, cssHeight);
      projected.copy(center).project(camera);
      portal.uRayCenter.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
      const radius = camera.position.distanceTo(center);
      const shadow = 2.598 * cssHeight / (2 * Math.tan(camera.fov * Math.PI / 360) * radius);
      // Fit the same HDR silhouette inside the bright O's counter in both surfaces.
      portal.uPortalScale.value = Math.max(0.001, Math.min(width, height) * 0.105 / shadow) * phase.current.growth;
      portal.uPortalRadius.value.set(width * 0.255 * phase.current.growth, height * 0.19 * phase.current.growth);
      portal.uPortalMini.value = phase.current.mini;
      portal.uPortalVisibility.value = phase.current.visibility;
      portal.uPortalDust.value = phase.current.dust;
      portal.uPortalPull.value = phase.current.pull;
    }
    uniforms.uDiskIntensity.value = 1 + (ending ? 0.35 * authored.hole : 0);
    uniforms.uObserver.value.copy(camera.position).sub(center);
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
