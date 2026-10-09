import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ScrollSmoother, ScrollTrigger, useGSAPSetup } from '@/hooks/useGSAPSetup';

// Fit a decorative model into its DOM window, including ScrollSmoother transforms.
export function useSectionAnchor(anchor, radius, frozen) {
  const root = useRef(null);
  const reveal = useRef(0.96);
  const bounds = useRef({ left: 0, top: 0, width: 0, height: 0 });

  useGSAPSetup(() => {
    const content = document.getElementById('smooth-content');
    const element = anchor.current;
    if (!content || !element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      bounds.current.left = rect.left;
      bounds.current.top = rect.top - content.getBoundingClientRect().top;
      bounds.current.width = rect.width;
      bounds.current.height = rect.height;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(element);
    window.addEventListener('resize', measure);
    ScrollTrigger.addEventListener('refresh', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      ScrollTrigger.removeEventListener('refresh', measure);
    };
  }, { scope: anchor, dependencies: [anchor], revertOnUpdate: true });

  useFrame(({ camera }, delta) => {
    if (!root.current) return;
    const rect = bounds.current;
    const smoother = ScrollSmoother.get();
    // Native/touch focus can scroll DOM while a manual story pose is held.
    const scroll = smoother?.smooth() ? smoother.scrollTop() : window.scrollY;
    const top = rect.top - scroll;
    // Canvas CSS resizes before R3F's ResizeObserver publishes its new size.
    const width = window.innerWidth;
    const viewportHeight = window.innerHeight;
    root.current.visible = rect.width > 0 && rect.height > 0
      && top + rect.height > 0 && top < viewportHeight;
    if (!root.current.visible) return;

    const distance = 8;
    const height = 2 * Math.tan(camera.fov * Math.PI / 360) * distance;
    root.current.position.set(
      ((rect.left + rect.width / 2) / width - 0.5) * height * camera.aspect,
      (0.5 - (top + rect.height / 2) / viewportHeight) * height,
      -distance,
    ).applyQuaternion(camera.quaternion).add(camera.position);
    root.current.quaternion.copy(camera.quaternion);
    reveal.current = frozen ? 1 : reveal.current + (1 - reveal.current) * (1 - Math.exp(-5 * Math.min(delta, 0.1)));
    root.current.scale.setScalar(Math.min(rect.width, rect.height) * 0.4 * height / viewportHeight / radius * reveal.current);
  });

  return root;
}
