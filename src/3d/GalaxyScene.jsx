import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Selection } from '@react-three/postprocessing';
import { SceneBoundary } from '@/3d/components/SceneBoundary';
import { SceneFallback } from '@/3d/components/SceneFallback';
import { useMediaQuery } from '@/3d/hooks/useMediaQuery';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { StarField } from '@/3d/components/StarField';
import { ShootingStars } from '@/3d/components/ShootingStars';
import { Nebula } from '@/3d/components/Nebula';
import { BlackHoleSystem } from '@/3d/components/BlackHoleSystem';
import { CameraRig } from '@/3d/components/CameraRig';
import { QUALITY } from '@/3d/quality';
import { INITIAL_CAMERA_POSITION } from '@/3d/utils/cameraPath';
import { portalProgress } from '@/3d/utils/portal';
import { useScrollStore } from '@/stores/useScrollStore';

function PortalBackdrop({ children, story, reduced }) {
  const root = useRef(null);
  useFrame(() => {
    if (root.current) {
      const state = useScrollStore.getState();
      root.current.visible = !story || portalProgress(state.storyChapter, state.chapterProgress, reduced) >= 0.52;
    }
  }, -0.5);
  return <group name="portal-backdrop" ref={root}>{children}</group>;
}

function subscribeToVisibility(notify) {
  document.addEventListener('visibilitychange', notify);
  return () => document.removeEventListener('visibilitychange', notify);
}

function isHidden() {
  return typeof document !== 'undefined' && document.hidden;
}

export function GalaxyScene({ children, count, quality: chosenQuality, rayQuality, enableBloom = true, story = false, freezeAmbient = story }) {
  const host = useRef(null);
  const [contextLost, setContextLost] = useState(false);
  const hidden = useSyncExternalStore(subscribeToVisibility, isHidden, () => false);
  const frozen = useReducedMotion();
  const mobile = useMediaQuery('(max-width: 767px)');
  const tablet = useMediaQuery('(max-width: 1023px)');
  const quality = chosenQuality ?? rayQuality ?? (mobile ? 'low' : tablet ? 'medium' : 'high');
  // Keep existing ambient effects still while comparing R2 story poses.
  const ambientFrozen = frozen || freezeAmbient;

  useEffect(() => {
    const canvas = host.current?.querySelector('canvas');
    if (!canvas) return;
    const lost = () => setContextLost(true);
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [contextLost]);

  return (
    <div ref={host} aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none bg-(--bg-void)" data-galaxy-scene data-quality={quality}>
      <SceneBoundary>
        {contextLost ? <SceneFallback /> : <Canvas
          className="pointer-events-none!"
          aria-hidden="true"
          camera={{ position: INITIAL_CAMERA_POSITION, fov: 60, near: 0.1, far: 400 }}
          dpr={mobile || quality === 'low' ? 1 : [1, tablet || quality === 'medium' ? 1.5 : 1.75]}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          frameloop={hidden ? 'never' : 'always'}
          fallback={<SceneFallback />}
        >
          <color attach="background" args={['#050505']} />
          <Suspense fallback={null}>
            <Selection>
              <CameraRig frozen={frozen} story={story} />
              <PortalBackdrop story={story} reduced={frozen}>
                <StarField count={count ?? QUALITY[quality]} frozen={ambientFrozen} story={story} />
                <Nebula position={[0, 0, -240]} scale={[80, 40, 1]} colorA="#202020" colorB="#4A4A4A" frozen={ambientFrozen} quality={quality} story={story} />
                <Nebula position={[-16, 5, -270]} scale={[50, 30, 1]} colorA="#262626" colorB="#5A5A5A" frozen={ambientFrozen} quality={quality} story={story} />
              </PortalBackdrop>
              <BlackHoleSystem frozen={ambientFrozen} reduced={frozen} story={story} quality={quality} enableBloom={enableBloom} />
              {!hidden && !ambientFrozen && <ShootingStars frozen={frozen} story={story} />}
              {typeof children === 'function' ? children(quality) : children}
            </Selection>
          </Suspense>
        </Canvas>}
      </SceneBoundary>
    </div>
  );
}
