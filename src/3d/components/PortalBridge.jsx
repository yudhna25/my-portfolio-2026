import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DoubleSide, NormalBlending, Vector2, Vector3 } from 'three';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { bridgeCamera, portalProgress, portalState } from '@/3d/utils/portal';
import { createLockupRaster } from '@/3d/utils/openingLockup';
import { createTextRaster } from '@/3d/utils/textRaster';
import { BRIDGE_SHEET_FRAG, BRIDGE_SHEET_VERT, BRIDGE_VEIL_FRAG, BRIDGE_VEIL_VERT } from '@/3d/shaders/portalBridge';
import { useScrollStore } from '@/stores/useScrollStore';

const RESOLUTION = { low: [90, 120], medium: [130, 180], high: [170, 240] };
const hole = new Vector3();
const FLOW = '[data-about-flow]';

// Polar sheet centred on the O, rings packed toward the throat.
function sheetGeometry(rings, segments) {
  const polar = new Float32Array((rings + 1) * (segments + 1) * 2);
  const index = [];
  for (let i = 0; i <= rings; i++) {
    for (let j = 0; j <= segments; j++) {
      const k = (i * (segments + 1) + j) * 2;
      polar[k] = i / rings; polar[k + 1] = j / segments * Math.PI * 2;
      if (i < rings && j < segments) {
        const a = i * (segments + 1) + j, b = a + segments + 1;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('aPolar', new BufferAttribute(polar, 2));
  // Three needs a position attribute to draw; the vertex shader ignores it.
  geometry.setAttribute('position', new BufferAttribute(new Float32Array((rings + 1) * (segments + 1) * 3), 3));
  geometry.setIndex(index);
  return geometry;
}

const sheetUniforms = () => ({
  uViewport: { value: new Vector2(1, 1) }, uPivot: { value: new Vector2() }, uOrigin: { value: new Vector2() },
  uLift: { value: 0 }, uFocal: { value: 1 }, uDistance: { value: 1 }, uDepth: { value: 0 }, uThroat: { value: 1 }, uCos: { value: 1 }, uSin: { value: 0 },
  uRmax: { value: 1 }, uLockup: { value: null }, uLockupReady: { value: 0 }, uSlide: { value: 0 }, uAlpha: { value: 0 },
  uDepthAmount: { value: 0 }, uTime: { value: 0 }, uBare: { value: 0 },
});

function applyCamera(u, cam, width, height) {
  u.uViewport.value.set(width, height);
  u.uPivot.value.set(cam.pivotX, cam.pivotY);
  u.uOrigin.value.set(cam.originX, cam.originY);
  u.uFocal.value = cam.focal;
  u.uDistance.value = cam.distance;
  u.uDepth.value = cam.depth;
  u.uThroat.value = cam.throat;
  u.uLift.value = cam.lift;
  u.uCos.value = cam.cos; u.uSin.value = cam.sin;
  u.uRmax.value = Math.max(width, height) * 3.5;
}

export function PortalBridge({ quality = 'high', reduced = false }) {
  const sheet = useRef(null);
  const outflow = useRef(null);
  const veil = useRef(null);
  const phase = useRef({});
  const camera = useRef({});
  const exit = useRef({});
  const lockup = useRef(null);
  const about = useRef(null);
  const wasAtRest = useRef(true);
  const geometry = useMemo(() => sheetGeometry(...RESOLUTION[quality]), [quality]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => {
    lockup.current?.dispose(); lockup.current = null;
    about.current?.dispose(); about.current = null;
    publishFlow(null);
  }, []);
  const inflowUniforms = useMemo(sheetUniforms, []);
  const outflowUniforms = useMemo(sheetUniforms, []);
  const veilUniforms = useMemo(() => ({
    uViewport: { value: new Vector2(1, 1) }, uCenter: { value: new Vector2() }, uMouth: { value: new Vector2() },
    uCover: { value: 0 }, uWarp: { value: 0 }, uSpeed: { value: 0 }, uTravel: { value: 0 }, uRing: { value: 0 },
    uRingGlow: { value: 0 }, uReveal: { value: 0 }, uRibbon: { value: 0 }, uTime: { value: 0 }, uPlunge: { value: 0 }, uFlow: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (!sheet.current || !outflow.current || !veil.current) return;
    // The materials keep their own uniform objects; write through them.
    const su = sheet.current.material.uniforms, ou = outflow.current.material.uniforms, vu = veil.current.material.uniforms;
    const scroll = useScrollStore.getState();
    const p = portalProgress(scroll.storyChapter, scroll.chapterProgress, reduced);
    const width = window.innerWidth, height = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const busy = document.querySelector('[data-preloader]');
    // Keep a raster of the resting Hero; re-take it the moment the crossing starts so the
    // sheet carries exactly what was on screen, glitched year included.
    if (!reduced && !busy && (p === 0 || wasAtRest.current)) {
      lockup.current ??= createLockupRaster({ intro: true });
      if (p > 0) lockup.current.refresh();
      su.uLockupReady.value = lockup.current.update(width, height, dpr) ? 1 : 0;
      su.uLockup.value = lockup.current.texture;
    }
    wasAtRest.current = p === 0;
    const active = !reduced && p > 0 && p < 1 && !busy;
    sheet.current.visible = outflow.current.visible = veil.current.visible = active;
    if (!active) { publishFlow(null); return; }
    const ph = portalState(p, phase.current);
    const time = (vu.uTime.value += Math.min(delta, 0.05));

    // Near side: the Hero sheet sinking into the funnel.
    const cam = bridgeCamera(ph, scroll.storyAnchor, width, height, camera.current);
    sheet.current.visible = ph.sheet > 0;
    applyCamera(su, cam, width, height);
    su.uSlide.value = ph.slide;
    su.uAlpha.value = ph.sheet;
    // Inside the throat the walls stop catching the hole's light.
    su.uDepthAmount.value = ph.depth * (1 - ph.dolly);
    su.uTime.value = time;

    // Far side: the real hole, the mouth we fly out of.
    hole.set(...BLACK_HOLE_CENTER).project(state.camera);
    const mx = (hole.x * 0.5 + 0.5) * width, my = (0.5 - hole.y * 0.5) * height;
    outflow.current.visible = ph.outflow > 0;
    if (ph.outflow > 0) {
      about.current ??= createTextRaster(FLOW);
      ou.uLockupReady.value = about.current.update(width, height, dpr) ? 1 : 0;
      ou.uLockup.value = about.current.texture;
      // About climbs out of a shallow well at the mouth and unwinds into place.
      const e = exit.current;
      e.originX = e.pivotX = mx; e.originY = e.pivotY = my;
      e.focal = e.distance = height * 1.1;
      e.depth = height * 0.6 * ph.emerge; e.throat = height * 0.08;
      e.lift = 0; e.cos = 1; e.sin = 0;
      applyCamera(ou, e, width, height);
      ou.uSlide.value = ph.emerge;
      ou.uAlpha.value = ph.outflow;
      ou.uDepthAmount.value = ph.emerge;
      ou.uTime.value = time;
      ou.uBare.value = 1;
    }

    vu.uViewport.value.set(width, height);
    // The flight bends towards where the far mouth will be, so we come out facing it.
    vu.uCenter.value.set(cam.pivotX + (mx - cam.pivotX) * ph.drift, cam.pivotY + (my - cam.pivotY) * ph.drift);
    vu.uMouth.value.set(mx, my);
    vu.uCover.value = ph.cover;
    vu.uWarp.value = ph.warp;
    vu.uSpeed.value = ph.speed;
    vu.uPlunge.value = Math.min(1, Math.max(0, (p - 0.40) / 0.22));
    // Idle flow slows almost to a stop while time freezes at the horizon (see the veil).
    const plunge = vu.uPlunge.value;
    const freeze = Math.min(1, Math.max(0, (plunge - 0.53) / 0.05)) * (1 - Math.min(1, Math.max(0, (plunge - 0.66) / 0.04)));
    vu.uFlow.value += Math.min(delta, 0.05) * (1 - 0.94 * freeze);
    // Scroll drives the flight; time only keeps it from freezing when the reader pauses.
    vu.uTravel.value = p * 160 + time * (0.15 + ph.speed * 1.5);
    // The far mouth swells as we close in, then sweeps past the frame as we pass through.
    vu.uRing.value = height * (0.02 + 0.2 * Math.pow(ph.speed, 4)) + Math.hypot(width, height) * 1.3 * ph.pass;
    vu.uRingGlow.value = ph.ring;
    vu.uReveal.value = ph.reveal;
    vu.uRibbon.value = ph.ribbon;
    publishFlow(p > 0.58 ? ph.aboutText : null);
  });

  return <>
    <mesh ref={veil} name="portal-bridge-veil" frustumCulled={false} renderOrder={9.6} visible={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={BRIDGE_VEIL_VERT} fragmentShader={BRIDGE_VEIL_FRAG} uniforms={veilUniforms}
        transparent blending={NormalBlending} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
    {/* The funnel folds over itself when tilted: depth keeps the near rim over the throat. */}
    <mesh ref={sheet} name="portal-bridge-sheet" geometry={geometry} frustumCulled={false} renderOrder={9.7} visible={false}>
      <shaderMaterial vertexShader={BRIDGE_SHEET_VERT} fragmentShader={BRIDGE_SHEET_FRAG} uniforms={inflowUniforms} side={DoubleSide}
        transparent blending={NormalBlending} depthTest depthWrite toneMapped={false} />
    </mesh>
    <mesh ref={outflow} name="portal-bridge-outflow" geometry={geometry} frustumCulled={false} renderOrder={9.8} visible={false}>
      <shaderMaterial vertexShader={BRIDGE_SHEET_VERT} fragmentShader={BRIDGE_SHEET_FRAG} uniforms={outflowUniforms} side={DoubleSide}
        transparent blending={NormalBlending} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
  </>;
}

// The DOM text waits under its raster and takes over once every letter has landed.
let published = null;
function publishFlow(opacity) {
  if (opacity === published) return;
  published = opacity;
  document.querySelectorAll(FLOW).forEach(node => {
    if (opacity === null) node.style.removeProperty('opacity');
    else node.style.opacity = opacity.toFixed(3);
  });
}
