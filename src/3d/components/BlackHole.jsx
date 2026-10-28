import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Matrix3, Matrix4, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, Vector3 } from 'three';
import { RAY_QUALITY } from '@/3d/quality';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { BLACK_HOLE_VERT, BLACK_HOLE_FRAG, BLACK_HOLE_COPY } from '@/3d/shaders/blackHole';
import { useScrollStore } from '@/stores/useScrollStore';
import { bridgeCamera, bridgeProject, portalProgress, portalSmooth, portalState } from '@/3d/utils/portal';
import { finaleScreenScale, finaleState } from '@/3d/utils/finale';
import { createLockupRaster } from '@/3d/utils/openingLockup';
import { createYearMirror } from '@/3d/utils/yearMirror';

const center = new Vector3(...BLACK_HOLE_CENTER);

export function BlackHole({ target, frozen = false, quality = 'high', story = false, reduced = false, portal, opening }) {
  const rendererRef = useRef(null);
  const phase = useRef({});
  const bridge = useRef({});
  const mouth = useRef({});
  const finale = useRef({});
  const copyDefines = useMemo(() => ({ FINALE_OCTAVES: quality === 'low' ? 2 : 3, FIRE_STEPS: quality === 'low' ? 10 : quality === 'medium' ? 16 : 22 }), [quality]);
  const projected = useMemo(() => new Vector3(), []);
  const bufferSize = useMemo(() => new Vector2(), []);
  const diskTime = useRef(0);
  const lockup = useRef(null);
  const year = useRef(null);
  const yearPull = useRef(0);
  const yearMask = useRef('');
  useEffect(() => () => {
    lockup.current?.dispose(); lockup.current = null;
    year.current?.dispose(); year.current = null;
    document.querySelectorAll('[data-hero-year] > svg, [data-hero-year] > canvas').forEach(node => { node.style.maskImage = node.style.webkitMaskImage = ''; });
  }, []);
  // Complement of the lensed copy's fade (0.8..1 of reach), in each year layer's own box:
  // the stream canvas overflows the year box, and a mask clips to the box it is set on.
  const maskYear = target => {
    const nodes = document.querySelectorAll('[data-hero-year] > svg, [data-hero-year] > canvas');
    if (!nodes.length) return;
    const boxes = [...nodes].map(node => node.getBoundingClientRect());
    const key = target ? `${target.x.toFixed(1)},${target.y.toFixed(1)},${target.reach.toFixed(1)}:${boxes.map(box => `${box.left.toFixed(1)},${box.top.toFixed(1)}`).join(';')}` : '';
    if (key === yearMask.current) return;
    yearMask.current = key;
    nodes.forEach((node, index) => {
      const box = boxes[index];
      const next = target ? `radial-gradient(circle at ${(target.x - box.left).toFixed(1)}px ${(target.y - box.top).toFixed(1)}px, transparent ${(target.reach * 0.8).toFixed(1)}px, black ${target.reach.toFixed(1)}px)` : '';
      node.style.maskImage = node.style.webkitMaskImage = next;
    });
  };
  const renderer = useMemo(() => {
    const tier = RAY_QUALITY[quality];
    const material = new ShaderMaterial({
      vertexShader: BLACK_HOLE_VERT,
      fragmentShader: BLACK_HOLE_FRAG,
      defines: { TRACE_STEPS: tier.steps, TRACE_STEP: tier.step, DISK_OCTAVES: tier.octaves, DISK_CROSSINGS: tier.crossings },
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
    const intro = opening?.current.active && !reduced ? opening.current : null;
    portal.uOpening.value.set(intro ? 1 : 0, intro?.p || 0, intro?.collapse || 0, intro?.shadow || 1);
    portal.uPortalEnabled.value = story ? 1 : 0;
    const ending = story && (state.storyChapter === 'finale' || state.storyChapter === 'contact');
    portal.uFinaleEnabled.value = ending ? 1 : 0;
    const authored = finaleState(reduced || state.storyChapter === 'contact' ? 1 : state.chapterProgress, finale.current);
    portal.uFinaleHole.value = ending ? authored.hole : 1;
    portal.uFinaleOrigin.value = state.worksOrbit.origin;
    portal.uFinaleGas.value.set(authored.cloud, authored.collapse, authored.flare, authored.progress);
    if (ending && !reduced) {
      const q = authored.formation;
      portal.uOpening.value.set(1, q, Math.max(0, Math.min(1, (q - 0.16) / 0.40)), window.innerHeight * 0.24);
    }
    if (story) {
      const p = portalProgress(state.storyChapter, state.chapterProgress, reduced);
      portalState(p, phase.current);
      const anchor = state.storyAnchor;
      // Match the Canvas CSS viewport immediately; Fiber's resize observer may lag.
      const cssWidth = window.innerWidth, cssHeight = window.innerHeight;
      const width = anchor?.width || 32, height = anchor?.height || 40;
      const left = anchor?.left ?? cssWidth * 0.75, top = anchor?.top ?? cssHeight * 0.2;
      // The hole rests in the O and, once the Hero leans back, sits at the funnel's throat.
      const throat = bridgeProject(bridgeCamera(phase.current, anchor, cssWidth, cssHeight, bridge.current), 0, 0, mouth.current);
      const dive = 1 / Math.max(throat.w, 0.05) * (1 + 2.5 * portalSmooth(0.34, 0.46, p));
      portal.uPortalCenter.value.set(throat.x / cssWidth, 1 - throat.y / cssHeight);
      portal.uPortalViewport.value.set(cssWidth, cssHeight);
      projected.copy(center).project(camera);
      portal.uRayCenter.value.set(Number.isFinite(projected.x) ? projected.x * 0.5 + 0.5 : 0.5,
        Number.isFinite(projected.y) ? projected.y * 0.5 + 0.5 : 0.5);
      const distance = camera.position.distanceTo(center);
      const radius = Math.max(1.1, distance);
      const shadowAngle = Math.asin(Math.min(0.999, 2.598076 * Math.sqrt(1 - 1 / radius) / radius));
      const shadow = Math.tan(shadowAngle) * cssHeight / (2 * Math.tan(camera.fov * Math.PI / 360));
      // Grow the actual photon/shadow diameter to about 55vh, before tracing each pixel.
      portal.uFinaleScale.value = ending ? finaleScreenScale(distance, camera.fov, cssHeight, authored.collapse, authored.zoom) : 1;
      // The fireball lives in world units; express its radius in screen heights at this distance.
      const screenRadius = authored.fireRadius / (2 * Math.max(1, distance) * Math.tan(camera.fov * Math.PI / 360));
      portal.uFireball.value.set(ending ? screenRadius : 0, authored.fireHeat, authored.fireDensity, authored.flatten);
      portal.uFinaleZoom.value = ending ? authored.zoom : 1;
      // The anchor is the cap-height slot, not the counter of a visible O glyph.
      portal.uPortalScale.value = Math.max(0.001, height * 0.48 / shadow) * dive;
      portal.uPortalRadius.value.set(height * 2.8 * dive, height * 1.4 * dive);
      portal.uPortalMini.value = phase.current.mini;
      portal.uPortalVisibility.value = phase.current.visibility;
      if (intro) {
        portal.uPortalCenter.value.set(intro.x / cssWidth, 1 - intro.y / cssHeight);
        portal.uPortalScale.value *= intro.shadow / (height * 0.48);
        portal.uPortalRadius.value.set(intro.shadow * 2.8 / 0.48, intro.shadow * 1.4 / 0.48);
        portal.uPortalVisibility.value = 1;
      }
      // Bend a raster of the Hero lockup until the DOM copy is revealed in place.
      const lens = portal.uOpeningLens.value;
      const idleHero = !intro && !reduced && quality !== 'low' && p === 0 && state.storyChapter === 'hero' && !document.querySelector('[data-preloader]');
      // The pull eases in after the opening, or after scrolling back to the top.
      yearPull.current = idleHero ? Math.min(1, yearPull.current + delta / 1.4) : 0;
      if (intro && intro.text > 0) {
        lockup.current ??= createLockupRaster();
        const ready = lockup.current.update(cssWidth, cssHeight, Math.min(2, window.devicePixelRatio || 1));
        portal.uOpeningText.value = lockup.current.texture;
        portal.uOpeningReach.value = 0;
        portal.uOpeningRect.value.set(0, 0, 1, 1);
        lens.set(ready ? 1 : 0, intro.shadow * intro.lens, intro.chroma, intro.text);
        maskYear(null);
      } else if (yearPull.current > 0) {
        // 2026 behind the hole: a bounded point lens bends the digits nearest the O into
        // arcs, and the DOM copy is masked out exactly where the lensed mirror is drawn.
        year.current ??= createYearMirror();
        const x = left + width / 2, y = top + height / 2, reach = height * 4.2;
        const ready = year.current.update(cssWidth, cssHeight, x, y, reach, Math.min(1.5, window.devicePixelRatio || 1));
        const pull = yearPull.current * yearPull.current * (3 - 2 * yearPull.current);
        const einstein = height * 0.95 * pull * (1 + 0.04 * Math.sin(diskTime.current * 0.6));
        portal.uOpeningText.value = year.current.texture;
        portal.uOpeningReach.value = reach;
        portal.uOpeningRect.value.copy(year.current.rect);
        lens.set(ready ? 1 : 0, einstein, 0.008 * pull, 1);
        maskYear(ready ? { x, y, reach } : null);
      } else { lens.x = 0; maskYear(null); }
    }
    uniforms.uDiskIntensity.value = 1 + (ending ? 0.35 * authored.hole : 0);
    portal.uDiskWarm.value = ending ? authored.warm : 0;
    uniforms.uObserver.value.copy(camera.position).sub(center);
    const observer = uniforms.uObserver.value;
    const observerRadius = observer.length();
    // Cinematic zoom/rebase must never send a static ray observer through rs=1.
    if (!Number.isFinite(observerRadius) || observerRadius < 0.000001) observer.set(0, 0, 1.1);
    else if (observerRadius < 1.1) observer.multiplyScalar(1.1 / observerRadius);
    uniforms.uCameraMatrix.value.copy(camera.matrixWorld);
    uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    // Gas has an ambient clock; camera, lensing and collapse keep their scroll clock.
    // The finale disk streams faster so its Keplerian lanes read as motion.
    if (!frozen && !reduced) diskTime.current += Math.min(delta, 0.05) * (1 + (ending ? 1.2 * authored.warm : 0));
    portal.uFireTime.value = diskTime.current;
    uniforms.uTime.value = diskTime.current + (intro ? -8 * Math.pow(1 - Math.min(1, intro.p / 0.88), 2) : 0);
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
