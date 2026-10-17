import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Stellar Odyssey's text system: three reveals by role instead of one slide-up fade.
//   starlight: display headings. Each glyph is born as a scattered point of light,
//              converges, passes a gravitational lens (shear + amber glow) and locks sharp.
//   signal:    mono labels decode like a radio transmission.
//   comet:     paragraphs are written line by line by a travelling comet head.
// Call inside a GSAP context (useGSAP / contextSafe); reduced motion is the caller's guard.

const AMBER_GLOW = 'rgba(255, 178, 91, 0.85)';
const SIGNAL_CHARS = '01<>/+·:░▒';

const pendingBelow = (target, scroll) => !scroll || target.getBoundingClientRect().top >= window.innerHeight * 0.85;
const trigger = (target, scroll) => scroll ? { scrollTrigger: { trigger: target, start: 'top 85%', once: true } } : {};

export function starlightTimeline(chars, { scatter = 1, glow = 22, ...vars } = {}) {
  return gsap.timeline(vars)
    .fromTo(chars, {
      opacity: 0, scale: 0.06,
      x: () => gsap.utils.random(-90, 90) * scatter,
      y: () => gsap.utils.random(-55, 55) * scatter,
      filter: 'blur(8px)',
    }, {
      opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)',
      duration: 1.15, ease: 'expo.out', stagger: { each: 0.02, from: 'random' },
      clearProps: 'filter',
    }, 0)
    // The lens: a shear and a flash of disk light that pass along the line.
    .fromTo(chars, { skewX: 0, textShadow: `0 0 0px ${AMBER_GLOW}` }, {
      keyframes: { skewX: [0, -14, 0], textShadow: [`0 0 0px ${AMBER_GLOW}`, `0 0 ${glow}px ${AMBER_GLOW}`, '0 0 0px rgba(255, 178, 91, 0)'] },
      duration: 0.55, ease: 'power2.inOut', stagger: 0.016, clearProps: 'textShadow,transform',
    }, 0.5);
}

export function revealStarlight(target, contextSafe, scroll = true) {
  const pending = pendingBelow(target, scroll);
  return SplitText.create(target, {
    type: 'lines,chars', autoSplit: true, linesClass: 'starlight-line', charsClass: 'split-char',
    onSplit: contextSafe((split) => {
      if (!pending) return gsap.set(split.chars, { opacity: 1 });
      return starlightTimeline(split.chars, trigger(target, scroll));
    }),
  });
}

export function revealSignal(target, scroll = true) {
  const text = target.textContent;
  if (!pendingBelow(target, scroll)) return null;
  // Hidden until its turn, then the same text decodes out of noise (length is kept).
  gsap.set(target, { opacity: 0 });
  return gsap.timeline(trigger(target, scroll))
    .set(target, { opacity: 1 })
    .to(target, { duration: 1, ease: 'none', scrambleText: { text, chars: SIGNAL_CHARS, revealDelay: 0.3, speed: 0.5, tweenLength: false },
      onComplete: () => { target.textContent = text; } });
}

export function revealComet(target, contextSafe, scroll = true) {
  const pending = pendingBelow(target, scroll);
  return SplitText.create(target, {
    type: 'lines', autoSplit: true, linesClass: 'comet-line',
    onSplit: contextSafe((split) => {
      if (!pending) return gsap.set(split.lines, { '--sweep': '115%', '--comet': 0 });
      return gsap.timeline({ ...trigger(target, scroll) })
        .fromTo(split.lines, { '--sweep': '0%', '--comet': 1 }, {
          '--sweep': '115%', duration: 1.1, ease: 'power2.inOut', stagger: 0.14,
        }, 0)
        .to(split.lines, { '--comet': 0, duration: 0.3, stagger: 0.14 }, 0.85);
    }),
  });
}

/** Wire every `[data-reveal="starlight|signal|comet"]` inside `scope`. */
export function revealWithin(scope, contextSafe) {
  scope.querySelectorAll('[data-reveal]').forEach((node) => {
    if (!node.getClientRects().length) return;
    const kind = node.dataset.reveal;
    if (kind === 'starlight') revealStarlight(node, contextSafe);
    else if (kind === 'signal') revealSignal(node);
    else if (kind === 'comet') revealComet(node, contextSafe);
  });
}
