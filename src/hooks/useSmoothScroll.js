import { useGSAP } from '@gsap/react';
import { gsap, ScrollSmoother } from '@/hooks/useGSAPSetup';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function useSmoothScroll({ scope, paused = false } = {}) {
  const reducedMotion = useReducedMotion();

  useGSAP(() => {
    const media = gsap.matchMedia(scope);

    media.add('(prefers-reduced-motion: no-preference)', () => {
      if (ScrollSmoother.get()) return;

      ScrollSmoother.create({
        wrapper: '#smooth-wrapper',
        content: '#smooth-content',
        smooth: 1.2,
        // The cropped avatar owns its bounded scrub; never drive its y twice.
        effects: '[data-speed]:not([data-parallax="crop"]), [data-lag]',
        normalizeScroll: true,
        ignoreMobileResize: true,
      });
      // ScrollSmoother.revert() is kill(): matchMedia owns this instance.
    });

    // Kills the owned smoother on unmount and on StrictMode's cleanup pass.
    // matchMedia also reverts immediately when reduced motion is enabled.
    return () => media.revert();
  }, { scope });

  useGSAP(() => {
    ScrollSmoother.get()?.paused(paused);
  }, { scope, dependencies: [paused, reducedMotion], revertOnUpdate: true });
}
