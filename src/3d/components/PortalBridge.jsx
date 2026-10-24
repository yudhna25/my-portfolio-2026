import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry, DoubleSide, NormalBlending, Vector2, Vector3 } from 'three';
import { BLACK_HOLE_CENTER } from '@/3d/utils/cameraPath';
import { bridgeCamera, echoRadius, portalProgress, portalState } from '@/3d/utils/portal';
import { createLockupRaster } from '@/3d/utils/openingLockup';
import { BRIDGE_SHEET_FRAG, BRIDGE_SHEET_VERT, BRIDGE_VEIL_FRAG, BRIDGE_VEIL_VERT } from '@/3d/shaders/portalBridge';
import { useScrollStore } from '@/stores/useScrollStore';

const RESOLUTION = { low: [90, 120], medium: [130, 180], high: [170, 240] };
const hole = new Vector3();

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

export function PortalBridge({ quality = 'high', reduced = false }) {
  const sheet = useRef(null);
  const veil = useRef(null);
  const phase = useRef({});
  const camera = useRef({});
  const lockup = useRef(null);
  const wasAtRest = useRef(true);
  const geometry = useMemo(() => sheetGeometry(...RESOLUTION[quality]), [quality]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => { lockup.current?.dispose(); lockup.current = null; }, []);
  const sheetUniforms = useMemo(() => ({
    uViewport: { value: new Vector2(1, 1) }, uPivot: { value: new Vector2() }, uOrigin: { value: new Vector2() },
    uLift: { value: 0 }, uFocal: { value: 1 }, uDistance: { value: 1 }, uDepth: { value: 0 }, uThroat: { value: 1 }, uCos: { value: 1 }, uSin: { value: 0 },
    uRmax: { value: 1 }, uLockup: { value: null }, uLockupReady: { value: 0 }, uSlide: { value: 0 }, uAlpha: { value: 0 },
    uDepthAmount: { value: 0 }, uTime: { value: 0 },
  }), []);
  const veilUniforms = useMemo(() => ({
    uViewport: { value: new Vector2(1, 1) }, uMouth: { value: new Vector2() },
    uCover: { value: 0 }, uTunnel: { value: 0 }, uFuture: { value: 0 }, uFlash: { value: 0 }, uExit: { value: 0 },
    uEcho: { value: 0 }, uLit: { value: 0 }, uFront: { value: 0 }, uTime: { value: 0 }, uScroll: { value: 0 }, uFar: { value: 0 },
  }), []);

  useFrame((state, delta) => {
    if (!sheet.current || !veil.current) return;
    // The material keeps its own uniform objects; write through it.
    const su = sheet.current.material.uniforms, vu = veil.current.material.uniforms;
    const scroll = useScrollStore.getState();
    const p = portalProgress(scroll.storyChapter, scroll.chapterProgress, reduced);
    const width = window.innerWidth, height = window.innerHeight;
    const busy = document.querySelector('[data-preloader]');
    // Keep a raster of the resting Hero; re-take it the moment the crossing starts so the
    // sheet carries exactly what was on screen, glitched year included.
    if (!reduced && !busy && (p === 0 || wasAtRest.current)) {
      lockup.current ??= createLockupRaster({ intro: true });
      if (p > 0) lockup.current.refresh();
      su.uLockupReady.value = lockup.current.update(width, height, Math.min(2, window.devicePixelRatio || 1)) ? 1 : 0;
      su.uLockup.value = lockup.current.texture;
    }
    wasAtRest.current = p === 0;
    const active = !reduced && p > 0 && p < 1 && !busy;
    sheet.current.visible = veil.current.visible = active;
    if (!active) { publishEcho(null); return; }
    const ph = portalState(p, phase.current);
    const cam = bridgeCamera(ph, scroll.storyAnchor, width, height, camera.current);
    const time = (vu.uTime.value += Math.min(delta, 0.05));
    sheet.current.visible = ph.sheet > 0;
    su.uViewport.value.set(width, height);
    su.uPivot.value.set(cam.pivotX, cam.pivotY);
    su.uOrigin.value.set(cam.originX, cam.originY);
    su.uFocal.value = cam.focal;
    su.uDistance.value = cam.distance;
    su.uDepth.value = cam.depth;
    su.uThroat.value = cam.throat;
    su.uLift.value = cam.lift;
    su.uCos.value = cam.cos; su.uSin.value = cam.sin;
    su.uRmax.value = Math.max(width, height) * 3.5;
    su.uSlide.value = ph.slide;
    su.uAlpha.value = ph.sheet;
    su.uDepthAmount.value = ph.depth;
    su.uTime.value = time;

    // Inside the throat the mouth is straight ahead; on the far side it is the real hole.
    let mx = cam.pivotX, my = cam.pivotY;
    if (p >= 0.5) {
      hole.set(...BLACK_HOLE_CENTER).project(state.camera);
      mx = (hole.x * 0.5 + 0.5) * width; my = (0.5 - hole.y * 0.5) * height;
    }
    const front = echoRadius(ph, width, height);
    vu.uViewport.value.set(width, height);
    vu.uMouth.value.set(mx, my);
    vu.uCover.value = ph.cover;
    vu.uTunnel.value = ph.tunnel;
    vu.uFuture.value = ph.future;
    vu.uFlash.value = ph.flash;
    vu.uExit.value = ph.exit;
    vu.uEcho.value = ph.echo;
    vu.uLit.value = ph.lit;
    vu.uFront.value = front;
    vu.uScroll.value = p;
    vu.uFar.value = ph.sheet * Math.min(1, ph.tilt * 2);
    publishEcho(p > 0.58 ? { x: mx, y: my, front, lit: ph.lit } : null);
  });

  return <>
    <mesh ref={veil} name="portal-bridge-veil" frustumCulled={false} renderOrder={9.6} visible={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial vertexShader={BRIDGE_VEIL_VERT} fragmentShader={BRIDGE_VEIL_FRAG} uniforms={veilUniforms}
        transparent blending={NormalBlending} depthTest={false} depthWrite={false} toneMapped={false} />
    </mesh>
    {/* The funnel folds over itself when tilted: depth keeps the near rim over the throat. */}
    <mesh ref={sheet} name="portal-bridge-sheet" geometry={geometry} frustumCulled={false} renderOrder={9.7} visible={false}>
      <shaderMaterial vertexShader={BRIDGE_SHEET_VERT} fragmentShader={BRIDGE_SHEET_FRAG} uniforms={sheetUniforms} side={DoubleSide}
        transparent blending={NormalBlending} depthTest depthWrite toneMapped={false} />
    </mesh>
  </>;
}

// About reveals itself under the same echo front; the DOM reads it from CSS variables.
let published = null;
function publishEcho(echo) {
  if (!echo && !published) return;
  published = echo;
  document.querySelectorAll('[data-echo-mask]').forEach(node => {
    if (!echo) { node.style.removeProperty('--echo-x'); node.removeAttribute('data-echo'); return; }
    const box = node.getBoundingClientRect();
    node.dataset.echo = echo.lit >= 1 ? 'done' : 'on';
    node.style.setProperty('--echo-x', `${(echo.x - box.left).toFixed(1)}px`);
    node.style.setProperty('--echo-y', `${(echo.y - box.top).toFixed(1)}px`);
    node.style.setProperty('--echo-r', `${echo.front.toFixed(1)}px`);
    node.style.setProperty('--echo-lit', echo.lit.toFixed(3));
  });
}
