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

// World centres of the knots as the sky last placed them (spin and winding included), for
// the camera that closes in on the one being read.
export const knotWorld = EDUCATION_KNOTS.map(() => new Vector3());
export const knotState = { ready: false };

const focus = new Vector3();
// While Education reads, the camera closes part of the way in on the school being read and
// glides from one region to the next along the arm; never so close that the arm is lost.
export function knotFocus(chapter, progress, target) {
  if (chapter !== 'education' || !knotState.ready) return;
  const w = smoothstep(0.18, 0.36, progress) * (1 - smoothstep(0.7, 0.86, progress));
  if (w <= 0) return;
  focus.copy(knotWorld[0]).lerp(knotWorld[1], smoothstep(0.36, 0.48, progress)).lerp(knotWorld[2], smoothstep(0.56, 0.68, progress));
  const pull = 0.5 * w, aim = 0.8 * w;
  target.x += (focus.x - target.x) * pull;
  target.y += (focus.y - target.y) * pull;
  target.z += (focus.z - target.z) * pull;
  target.lookX += (focus.x - target.lookX) * aim;
  target.lookY += (focus.y - target.lookY) * aim;
  target.lookZ += (focus.z - target.lookZ) * aim;
}

// The reading layer registers its labels here; the sky writes their screen positions each
// frame, so a label rides beside its knot as the camera cranes and the arm winds.
export const knotLabels = { section: null, items: {} };
