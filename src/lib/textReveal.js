import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Stellar Odyssey's text system: reveals by role instead of one slide-up fade.
//   starlight: display headings. Each glyph is born as a scattered point of light,
//              converges, passes a gravitational lens (shear + amber glow) and locks sharp.
//   dust:      body copy, the same birth word by word with a tighter scatter.
//   items:     lists, one point of light per item.
//   signal:    mono labels decode like a radio transmission.
// Call inside a GSAP context (useGSAP / contextSafe); reduced motion is the caller's guard.

const AMBER_GLOW = 'rgba(255, 178, 91, 0.85)';
const SIGNAL_CHARS = '01<>/+·:░▒';

// Fire as the line clears the bottom edge, so text is already forming when it is read.
// Visibility comes from an IntersectionObserver on the element's real, rendered box rather
// than precomputed ScrollTrigger offsets: pins, chapter transitions and late layout shifts
// above a section moved those offsets and made some reveals fire late or not at all.
const pendingBelow = (target, scroll) => !scroll || target.getBoundingClientRect().top >= window.innerHeight * 0.96;
const waiting = new WeakMap();
let observer = null;
// The chapter wave (space-chapters) keeps an incoming chapter masked until its wave opens it
// and marks it data-wave-veiled meanwhile: text waits for the veil instead of forming unseen.
function afterVeil(target, play) {
  const veil = target.closest('[data-wave-veiled]');
  if (!veil) return play();
  const watcher = new MutationObserver(() => {
    if (veil.hasAttribute('data-wave-veiled')) return;
    watcher.disconnect();
    waiting.delete(target);
    if (target.isConnected) play();
  });
  watcher.observe(veil, { attributes: true, attributeFilter: ['data-wave-veiled'] });
  waiting.set(target, { cancel: () => watcher.disconnect() });
}
function whenVisible(target, play, finish) {
  if (typeof IntersectionObserver === 'undefined') return play();
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const job = waiting.get(entry.target);
      if (!job?.play) continue;
      // Jumped past (menu, Star Map, a restored scroll): it is above the frame, so settle it.
      const above = entry.boundingClientRect.bottom < (entry.rootBounds?.top ?? 0);
      if (!entry.isIntersecting && !above) continue;
      observer.unobserve(entry.target);
      waiting.delete(entry.target);
      if (above) job.finish();
      else afterVeil(entry.target, job.play);
    }
  }, { rootMargin: '0px 0px -4% 0px' });
  waiting.set(target, { play, finish });
  observer.observe(target);
}
function forget(target) {
  const job = waiting.get(target);
  if (!job) return;
  observer?.unobserve(target);
  job.cancel?.();
  waiting.delete(target);
}
// A paused timeline (its from-state applied at once) that plays when the target shows up.
const trigger = (target, scroll) => scroll ? { paused: true } : {};
const arm = (timeline, target, scroll) => {
  if (scroll) whenVisible(target, () => timeline.play(), () => timeline.progress(1));
  return timeline;
};
// Per-glyph blur costs fill rate next to the WebGL sky: desktop only.
const blurAllowed = () => typeof matchMedia !== 'undefined' && matchMedia('(min-width: 1024px) and (pointer: fine)').matches;

// Short on purpose: a heading locks sharp in under 0.9s, a list in about 0.7s.
export function starlightTimeline(chars, { scatter = 1, glow = 22, pace = 1, order = 'random', ...vars } = {}) {
  const blur = blurAllowed();
  return gsap.timeline(vars)
    .fromTo(chars, {
      opacity: 0, scale: 0.06,
      x: () => gsap.utils.random(-90, 90) * scatter,
      y: () => gsap.utils.random(-55, 55) * scatter,
      filter: blur ? 'blur(6px)' : 'none',
    }, {
      opacity: 1, scale: 1, x: 0, y: 0, filter: blur ? 'blur(0px)' : 'none',
      duration: 0.55 * Math.min(Math.max(pace, 0.7), 1.2), ease: 'expo.out', stagger: { amount: Math.min(0.3, chars.length * 0.01 * pace), from: order },
      clearProps: 'filter,transform',
    }, 0)
    // The lens: a shear and a flash of disk light that pass along the line.
    .fromTo(chars, { skewX: 0, textShadow: `0 0 0px ${AMBER_GLOW}` }, {
      keyframes: { skewX: [0, -14, 0], textShadow: [`0 0 0px ${AMBER_GLOW}`, `0 0 ${glow}px ${AMBER_GLOW}`, '0 0 0px rgba(255, 178, 91, 0)'] },
      duration: 0.35, ease: 'power2.inOut', stagger: { amount: Math.min(0.3, chars.length * 0.008 * pace) }, clearProps: 'textShadow',
    }, 0.2);
}

export function revealStarlight(target, contextSafe, scroll = true) {
  const pending = pendingBelow(target, scroll);
  return SplitText.create(target, {
    type: 'lines,chars', autoSplit: true, linesClass: 'starlight-line', charsClass: 'split-char',
    onSplit: contextSafe((split) => {
      if (!pending) return gsap.set(split.chars, { opacity: 1 });
      return arm(starlightTimeline(split.chars, trigger(target, scroll)), target, scroll);
    }),
  });
}

export function revealSignal(target, scroll = true) {
  const text = target.textContent;
  if (!pendingBelow(target, scroll)) return null;
  // Hidden until its turn, then the same text decodes out of noise (length is kept).
  gsap.set(target, { opacity: 0 });
  return arm(gsap.timeline(trigger(target, scroll))
    .set(target, { opacity: 1 })
    .to(target, { duration: 0.8, ease: 'none', scrambleText: { text, chars: SIGNAL_CHARS, revealDelay: 0.3, speed: 0.5, tweenLength: false },
      onComplete: () => { target.textContent = text; } }), target, scroll);
}

// Body copy gets the same birth from starlight, word by word and closer in, so a
// section's heading and content arrive together as one constellation.
export function revealDust(target, contextSafe, scroll = true) {
  const pending = pendingBelow(target, scroll);
  return SplitText.create(target, {
    type: 'words', autoSplit: true, wordsClass: 'split-word',
    onSplit: contextSafe((split) => {
      if (!pending) return gsap.set(split.words, { opacity: 1 });
      return arm(starlightTimeline(split.words, { scatter: 0.35, glow: 8, pace: 0.7, order: 'start', ...trigger(target, scroll) }), target, scroll);
    }),
  });
}

// Lists whose items React keeps updating (selection state, masks) are never split:
// each item is born as one point of light instead.
export function revealItems(target, scroll = true) {
  const items = Array.from(target.children);
  if (!items.length || !pendingBelow(target, scroll)) return null;
  return arm(starlightTimeline(items, { scatter: 0.3, glow: 6, pace: 0.8, order: 'start', ...trigger(target, scroll) }), target, scroll);
}

/** Wire every `[data-reveal="starlight|dust|items|signal"]` inside `scope`; returns a cleanup. */
export function revealWithin(scope, contextSafe) {
  const nodes = [...scope.querySelectorAll('[data-reveal]')];
  nodes.forEach((node) => {
    if (!node.getClientRects().length) return;
    const kind = node.dataset.reveal;
    if (kind === 'starlight') revealStarlight(node, contextSafe);
    else if (kind === 'signal') revealSignal(node);
    else if (kind === 'dust') revealDust(node, contextSafe);
    else if (kind === 'items') revealItems(node);
  });
  return () => nodes.forEach(forget);
}

/** Stop waiting on targets wired outside revealWithin (component-level headings). */
export const forgetReveal = (targets) => Array.from(targets).forEach(forget);
