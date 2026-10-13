const smooth = (a, b, p) => {
  const t = Math.min(1, Math.max(0, (p - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export function openingPose(p, anchor, width, height, out) {
  const move = smooth(0.58, 1, p);
  const size = Math.min(156, Math.min(width, height) * 0.19);
  const target = Math.max(1, anchor.height * 0.48);
  out.p = p;
  out.move = move;
  out.x = width / 2 + (anchor.left + anchor.width / 2 - width / 2) * move;
  out.y = height / 2 + (anchor.top + anchor.height / 2 - height / 2) * move;
  out.shadow = size * Math.exp(Math.log(target / size) * move);
  out.hole = smooth(0.29, 0.57, p);
  out.collapse = smooth(0.16, 0.56, p);
  out.reveal = smooth(0.76, 1, p);
  return out;
}
