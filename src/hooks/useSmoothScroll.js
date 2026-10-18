import { useGSAP } from '@gsap/react';
import { gsap, ScrollSmoother, ScrollTrigger } from '@/hooks/useGSAPSetup';
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

      // ScrollSmoother's own resize watch only refreshes itself: when content above a
      // trigger grows or shrinks without a window resize (late fonts, a re-split, a lazy
      // image) every other ScrollTrigger would keep stale offsets and fire early or late.
      const content = document.querySelector('#smooth-content');
      let timer = 0;
      const refresh = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => { if (!ScrollTrigger.isRefreshing) ScrollTrigger.refresh(); }, 150);
      };
      const observer = content && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(refresh) : null;
      observer?.observe(content);
      document.fonts?.addEventListener?.('loadingdone', refresh);
      return () => {
        window.clearTimeout(timer);
        observer?.disconnect();
        document.fonts?.removeEventListener?.('loadingdone', refresh);
      };
    });

    // Kills the owned smoother on unmount and on StrictMode's cleanup pass.
    // matchMedia also reverts immediately when reduced motion is enabled.
    return () => media.revert();
  }, { scope });

  useGSAP(() => {
    ScrollSmoother.get()?.paused(paused);
  }, { scope, dependencies: [paused, reducedMotion], revertOnUpdate: true });
}
