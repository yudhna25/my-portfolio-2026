import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScrollStore } from '@/stores/useScrollStore';
import { cameraPath, storyCameraPath } from '@/3d/utils/cameraPath';
import { aboutDefocus, cameraMotion, VELOCITY_CHAPTERS } from '@/3d/utils/cameraMotion';
import { ScrollSmoother } from '@/hooks/useGSAPSetup';

const mouse = { x: 0, y: 0 };

function trackMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
}

export function CameraRig({ frozen = false, story = false, opening }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const cameraRef = useRef(null);
  const pathRef = useRef(null);
  const baseFov = useRef(60);
  // Hero breathing clock, smoothed pointer, hero weight and the last scroll sample.
  const life = useRef({ time: 0, x: 0, y: 0, hero: 0, scroll: null, fov: 60, velocity: 0 });

  useEffect(() => {
    cameraRef.current = camera;
    pathRef.current = cameraPath(0);
    mouse.x = mouse.y = 0;
    if (!frozen) window.addEventListener('pointermove', trackMouse, { passive: true });
    return () => {
      window.removeEventListener('pointermove', trackMouse);
      cameraRef.current = null;
      pathRef.current = null;
      mouse.x = mouse.y = 0;
    };
  }, [camera, frozen, story]);

  useEffect(() => {
    const activeCamera = cameraRef.current;
    if (!activeCamera) return;
    // Keep the disk framed on portrait screens while preserving desktop FOV 60.
    activeCamera.fov = baseFov.current = 2 * Math.atan(Math.tan(Math.PI / 6) / Math.min(1, size.width / size.height)) * 180 / Math.PI;
    activeCamera.updateProjectionMatrix();
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    const activeCamera = cameraRef.current;
    if (!activeCamera) return;
    if (story) {
      const state = useScrollStore.getState();
      const pose = storyCameraPath(state.storyChapter, state.chapterProgress, pathRef.current, frozen, size.width / size.height);
      if (!frozen && opening?.current.active) {
        const approach = 1 - opening.current.move;
        pose.z -= 9 * approach;
        pose.y += 1.5 * approach;
        pose.lookX += 1.2 * approach;
      }
      const motion = life.current, dt = Math.min(delta, 0.1);
      let roll = pose.roll || 0, fov = baseFov.current;
      cameraMotion.defocus = frozen ? 0 : aboutDefocus(state.storyChapter, state.chapterProgress);
      if (!frozen) {
        // Hero at rest breathes and leans toward the pointer; the BH image stays locked in its O.
        const idle = state.storyChapter === 'hero' && !opening?.current.active;
        motion.hero += ((idle ? 1 : 0) - motion.hero) * (1 - Math.exp(-dt * (idle ? 0.8 : 5)));
        motion.time += dt;
        motion.x += (mouse.x - motion.x) * (1 - Math.exp(-dt * 2.5));
        motion.y += (mouse.y - motion.y) * (1 - Math.exp(-dt * 2.5));
        if (motion.hero > 0.0001) {
          const t = motion.time, w = motion.hero;
          pose.x += w * (0.35 * Math.sin(t * 0.37) + 1.1 * motion.x);
          pose.y += w * (0.22 * Math.sin(t * 0.29 + 1.3) - 0.6 * motion.y);
          pose.z += w * 0.5 * Math.sin(t * 0.21 + 0.4);
          pose.lookX += w * 0.35 * motion.x;
          pose.lookY -= w * 0.2 * motion.y;
          roll += w * (0.006 * Math.sin(t * 0.17) - 0.012 * motion.x);
        }
        // Scroll velocity: a short FOV kick and a bank in the live-anchored reading chapters,
        // and star streaks everywhere (StarField reads the shared speed).
        const smoother = ScrollSmoother.get();
        const scroll = smoother ? smoother.scrollTop() : window.scrollY;
        // Real frame time: a clamped step would overstate the speed on slow frames.
        const velocity = motion.scroll === null || delta <= 0 ? 0 : (scroll - motion.scroll) / Math.max(delta, 0.001);
        motion.scroll = scroll;
        motion.velocity += (velocity - motion.velocity) * (1 - Math.exp(-dt * 8));
        const target = Math.min(1, Math.abs(motion.velocity) / 2600);
        cameraMotion.speed += (target - cameraMotion.speed) * (1 - Math.exp(-dt * (target > cameraMotion.speed ? 6 : 2.5)));
        cameraMotion.direction = Math.sign(motion.velocity);
        const response = cameraMotion.speed * (VELOCITY_CHAPTERS[state.storyChapter] ?? 0);
        fov *= 1 + 0.07 * response;
        roll += 0.02 * response * cameraMotion.direction;
      } else cameraMotion.speed = 0;
      if (Math.abs(fov - motion.fov) > 0.001) {
        motion.fov = activeCamera.fov = fov;
        activeCamera.updateProjectionMatrix();
      }
      activeCamera.position.set(pose.x, pose.y, pose.z);
      activeCamera.lookAt(pose.lookX, pose.lookY, pose.lookZ);
      if (roll) activeCamera.rotateZ(roll);
      return;
    }
    if (frozen) {
      const start = cameraPath(0, pathRef.current);
      activeCamera.position.set(start.x, start.y, start.z);
      activeCamera.lookAt(start.lookX, start.lookY, -200);
      return;
    }

    const state = useScrollStore.getState();
    const target = cameraPath(state.scrollProgress, pathRef.current);
    const zEase = 1 - Math.pow(1 - 0.12, Math.min(delta, 0.1) * 60);
    const xyEase = 1 - Math.pow(1 - 0.09, Math.min(delta, 0.1) * 60);

    // Start nearby; finish above the emitting disk, never below its surface.
    activeCamera.position.z += (target.z - activeCamera.position.z) * zEase;

    // x: lượn trái-phải-trái-phải-trái + trôi dần sang trái; cộng parallax chuột.
    activeCamera.position.x += (target.x + mouse.x * target.parallax - activeCamera.position.x) * xyEase;
    activeCamera.position.y += (target.y - mouse.y * target.parallax * 0.5 - activeCamera.position.y) * xyEase;

    // lookAt trượt từ hố đen (đầu hành trình) sang lệch TRÁI hố đen ở cuối →
    // hố đen hiện về bên PHẢI khung hình lúc tiếp cận.
    // Adapt the aim to horizontal FOV, keeping the shadow visible at the right
    // edge on square/portrait screens even when the foreground disk fills them.
    const frameBias = Math.min(1, 0.54 * Math.max(1, size.width / size.height));
    activeCamera.lookAt(target.lookX * frameBias, target.lookY, -200);
  }, -1); // Camera first, then DOM anchors, HDR ray image and composer.

  return null;
}
