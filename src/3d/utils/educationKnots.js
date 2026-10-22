import { Vector3 } from 'three';
import { ARP_RADIUS, REST_PITCH, armAngle } from './skyPath.js';

// Education's timeline lives on Arp 273's arm 0, the arm the light band winds into: three
// star-forming regions, outermost first, so reading inward along the arm reads forward in
// time. Each is a pink HII knot whose centre follows the same polar morph as the disk's
// stars (ARP_VERT), so it stays on the arm while the collision winds it into the rose.
export const EDUCATION_KNOTS = [
  { id: 'saigonUniversity', r: 12.6 },
  { id: 'greenAcademy', r: 9.2 },
  { id: 'arenaMultimedia', r: 5.9 },
];

// Which school the scroll is on while the chapter reads (progress past the wave's opening).
export function educationBeat(progress) {
  return progress < 0.42 ? 0 : progress < 0.62 ? 1 : 2;
}

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Local (disk-frame) centre of a knot, mirroring ARP_VERT's disk branch with no scatter.
export function knotLocal(knot, frame, { rose, spin, time, shift }, out = new Vector3()) {
  const { r } = knot;
  const restAngle = armAngle(r, 0, REST_PITCH, frame.phase);
  const roseAngle = armAngle(r, 0, 0.13, frame.phase);
  const roseRadius = r * (1 + 0.13 * Math.sin(3 * roseAngle) + 0.06 * Math.sin(5 * roseAngle));
  const delay = 0.45 * (1 - r / ARP_RADIUS);
  const m = smoothstep(delay, delay + 0.45, rose);
  const angle = restAngle + (roseAngle - restAngle) * m + spin;
  let radius = r + (roseRadius - r) * m;
  radius *= 1 + 0.025 * m * Math.sin(angle * 3 - time * 0.35);
  const pull = m * Math.pow(radius / 16, 1.4);
  return out.set(Math.cos(angle) * radius + shift.x * pull, Math.sin(angle) * radius + shift.y * pull, 0);
}

// The reading layer registers its labels here; the sky writes their screen positions each
// frame, so a label rides beside its knot as the camera cranes and the arm winds.
export const knotLabels = { section: null, items: {} };
