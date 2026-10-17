const smooth = (a, b, p) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// First Light: a pulse at the last O, a burst at BURST, then a large hole bends the
// lockup and shrinks into the unchanged portal anchor. One clock, p = 0..1.
export const OPENING_BURST = 0.40;

export function openingPose(p, anchor, width, height, out) {
  const settle = smooth(0.42, 0.96, p);
  const size = Math.min(220, Math.min(width, height) * 0.2);
  const target = Math.max(1, anchor.height * 0.48);
  out.p = p;
  out.move = smooth(OPENING_BURST, 1, p);
  // The light, the burst and the hole never leave the O slot.
  out.x = anchor.left + anchor.width / 2;
  out.y = anchor.top + anchor.height / 2;
  out.shadow = size * Math.exp(Math.log(target / size) * settle);
  out.collapse = settle;
  // Lensed copy of the lockup: strong at birth, released before the DOM takes over.
  out.text = smooth(0.41, 0.52, p) * (1 - smooth(0.88, 1, p));
  out.lens = (1.35 - 0.25 * settle) * (1 - smooth(0.84, 0.98, p));
  out.chroma = 0.07 * (1 - settle);
  out.reveal = smooth(0.88, 1, p);
  // Starfield shock/fold clock starts at the burst.
  out.clock = Math.min(1, Math.max(0, (p - OPENING_BURST) / (1 - OPENING_BURST))) * 0.75;
  return out;
}
