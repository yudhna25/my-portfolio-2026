import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useScrollStore } from '@/stores/useScrollStore';
import { cameraPath, storyCameraPath } from '@/3d/utils/cameraPath';

const mouse = { x: 0, y: 0 };

function trackMouse(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
}

export function CameraRig({ frozen = false, story = false }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const cameraRef = useRef(null);
  const pathRef = useRef(null);

  useEffect(() => {
    cameraRef.current = camera;
    pathRef.current = cameraPath(0);
    mouse.x = mouse.y = 0;
    if (!frozen && !story) window.addEventListener('pointermove', trackMouse, { passive: true });
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
    activeCamera.fov = 2 * Math.atan(Math.tan(Math.PI / 6) / Math.min(1, size.width / size.height)) * 180 / Math.PI;
    activeCamera.updateProjectionMatrix();
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    const activeCamera = cameraRef.current;
    if (!activeCamera) return;
    if (story) {
      const state = useScrollStore.getState();
      const pose = storyCameraPath(state.storyChapter, state.chapterProgress, pathRef.current, frozen, size.width / size.height);
      activeCamera.position.set(pose.x, pose.y, pose.z);
      activeCamera.lookAt(pose.lookX, pose.lookY, pose.lookZ);
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
