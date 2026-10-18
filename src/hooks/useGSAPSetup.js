import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Flip } from 'gsap/Flip';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { forgetReveal, revealStarlight } from '@/lib/textReveal';

// Module initialization runs once, before React's effects (including StrictMode).
gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText, ScrambleTextPlugin, ScrollToPlugin, Flip, DrawSVGPlugin);
gsap.defaults({ duration: 0.6, ease: 'power2.out' });

export function useGSAPSetup(callback, config) {
  return useGSAP(callback, config);
}

/**
 * Call inside useGSAP/useGSAPSetup, gsap.matchMedia, or a contextSafe callback.
 * SplitText joins that GSAP context and automatically reverts on cleanup.
 * Pass `type` to split only the units you need; the returned instance also has revert().
 */
export function splitText(source, opts = {}) {
  return SplitText.create(source, {
    linesClass: 'split-line',
    charsClass: 'split-char',
    ...opts,
  });
}

/** Call in the owning useGSAP context, after guarding reduced motion. Headings are born from starlight. */
export function revealHeadings(targets, contextSafe, scroll = true) {
  const list = Array.from(targets).filter((target) => target.getClientRects().length);
  list.forEach((target) => revealStarlight(target, contextSafe, scroll));
  return () => forgetReveal(list);
}

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, ScrambleTextPlugin, ScrollToPlugin, Flip, DrawSVGPlugin };

