import { Vector3 } from 'three';
import { storyCameraPath } from './cameraPath.js';
import { bandSchedule, journey } from './chapterWave.js';

// World layout of the reading chapters' sky, shared by the sky itself and the camera that
// rides the light band: the nebula ribbon (About), the band of light that grows out of its
// tail, and Arp 273, whose arm the band becomes. Built once, lazily, from the camera's base
// path (without the band follow, which depends on it).

export const ARP_RADIUS = 16;
// How far along the ribbon (from 0.6) the band peels away from it.
export const BRANCH_SPAN = 0.24;
// The large disk's arms before the collision: a loose two-armed log spiral.
export const REST_PITCH = 0.4;
export const armAngle = (r, arm, pitch = REST_PITCH, phase = 0) => phase + arm * Math.PI + Math.log(r / 0.9) / Math.tan(pitch);

// Camera basis at a chapter's base pose: where to put a region so it frames away from the BH.
function chapterBasis(chapter, progress = 0.5) {
  const pose = storyCameraPath(chapter, progress, {}, false, 16 / 9, false);
  const eye = new Vector3(pose.x, pose.y, pose.z);
  const forward = new Vector3(pose.lookX, pose.lookY, pose.lookZ).sub(eye).normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const up = new Vector3().crossVectors(right, forward).normalize();
  // A point in front of the camera: d ahead, x right, y up (world units).
  const at = (d, x = 0, y = 0) => eye.clone().addScaledVector(forward, d).addScaledVector(right, x).addScaledVector(up, y);
  return { eye, forward, right, up, at };
}

// The ribbon runs from high in the far left down toward the lower frame. Its width direction
// twists slowly along it, and it narrows at the tail into the band's width.
function ribbonFrame() {
  const basis = chapterBasis('about');
  const start = basis.at(84, -40, 32), end = basis.at(42, 2, -22);
  const along = end.clone().sub(start);
  const bow = basis.forward.clone().multiplyScalar(-1).addScaledVector(basis.right, -0.4).normalize();
  const sway = new Vector3().crossVectors(along, bow).normalize();
  const center = s => start.clone().addScaledVector(along, s).addScaledVector(bow, 14 * Math.sin(Math.PI * s))
    .addScaledVector(sway, 3.5 * Math.sin(2.3 * Math.PI * s + 1));
  const frame = s => {
    const tangent = center(Math.min(1, s + 0.01)).sub(center(Math.max(0, s - 0.01))).normalize();
    const flat = new Vector3().crossVectors(tangent, basis.forward).normalize();
    const width = flat.clone().applyAxisAngle(tangent, 1.1 * s);
    return { tangent, width, depth: new Vector3().crossVectors(tangent, width) };
  };
  const taper = s => 1 - 0.8 * Math.min(1, Math.max(0, (s - 0.62) / 0.38)) ** 1.5;
  const breadth = s => (6 + 11 * Math.sin(Math.PI * Math.min(1, s * 1.15)) * (1 - 0.45 * s)) * taper(s);
  return { center, frame, breadth };
}

// Arp 273's frame: the large disk nearly face on, left of the reading column.
function arpFrame() {
  const basis = chapterBasis('education', 0.6);
  const center = basis.at(64, -9, -7);
  const normal = basis.forward.clone().multiplyScalar(-1).applyAxisAngle(basis.right, -0.62).applyAxisAngle(basis.forward, 0.2).normalize();
  const x = basis.right.clone().sub(normal.clone().multiplyScalar(basis.right.dot(normal))).normalize();
  const y = new Vector3().crossVectors(normal, x);
  const toWorld = local => center.clone().addScaledVector(x, local.x).addScaledVector(y, local.y).addScaledVector(normal, local.z);
  // The companion's fall, in the disk's own frame: from high behind, past the rim, to below.
  const path = [new Vector3(-30, 26, -16), new Vector3(-6, 6, -10), new Vector3(12, -20, 2)];
  const companion = c => {
    const s = 1 - c;
    return path[0].clone().multiplyScalar(s * s).addScaledVector(path[1], 2 * s * c).addScaledVector(path[2], c * c);
  };
  return { center, x, y, normal, toWorld, companion, rest: path[2], phase: 0 };
}

// Turns the spiral so arm 0, followed outward past the rim, heads toward the band's source:
// the band then runs straight on into the arm instead of doubling back.
function alignArms(arp, source) {
  const local = source.clone().sub(arp.center);
  const goal = Math.atan2(local.dot(arp.y), local.dot(arp.x));
  const r = ARP_RADIUS, angle = armAngle(r, 0);
  // Outward direction along the spiral at the rim: radial plus the winding's tangential part.
  const k = 1 / Math.tan(REST_PITCH);
  const outward = Math.atan2(Math.sin(angle) + k * Math.cos(angle), Math.cos(angle) - k * Math.sin(angle));
  // Aim the rim point a little behind the outward direction so the swoop has room.
  arp.phase = goal - outward + 0.35;
}

// The band: it peels off the ribbon's tail, swoops round toward the galaxy, then runs along
// arm 0 of the disk from the rim in to the bulge. Corner-cut smoothed, then sampled by arc
// length, so t is a fraction of its length.
function bandPath(ribbon, arp) {
  const raw = [];
  for (let i = 0; i <= 30; i++) raw.push(ribbon.center(0.6 + BRANCH_SPAN * i / 30));
  const arm = [];
  for (let i = 0; i <= 80; i++) {
    const r = ARP_RADIUS * 0.98 - (ARP_RADIUS * 0.98 - 1.1) * Math.pow(i / 80, 0.8), angle = armAngle(r, 0, REST_PITCH, arp.phase);
    arm.push(arp.toWorld(new Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0)));
  }
  const p0 = raw[raw.length - 1], p3 = arm[0];
  const out = p0.clone().sub(raw[raw.length - 2]).normalize();
  const into = arm[1].clone().sub(arm[0]).normalize();
  // Leave along the ribbon's direction as seen from the arriving camera (its depth part
  // dropped), so the turn toward the galaxy reads as a wide hook on screen, never a cusp.
  const viewer = chapterBasis('about', 1).eye;
  const sight = p0.clone().sub(viewer).normalize();
  const flat = out.addScaledVector(sight, -out.dot(sight)).normalize();
  const p1 = p0.clone().addScaledVector(flat, 22), p2 = p3.clone().addScaledVector(into, -34);
  for (let i = 1; i < 60; i++) {
    const c = i / 60, s = 1 - c;
    raw.push(p0.clone().multiplyScalar(s * s * s).addScaledVector(p1, 3 * s * s * c).addScaledVector(p2, 3 * s * c * c).addScaledVector(p3, c * c * c));
  }
  raw.push(...arm);
  // Where the arm begins, as a fraction of the length (measured before smoothing, which
  // barely moves it).
  let before = 0, total = 0;
  for (let i = 1; i < raw.length; i++) {
    const step = raw[i].distanceTo(raw[i - 1]);
    total += step;
    if (i <= raw.length - arm.length) before += step;
  }
  const armStart = before / total;
  const path = smoothPath(raw, 4);
  raw.length = 0;
  raw.push(...path);
  const lengths = [0];
  for (let i = 1; i < raw.length; i++) lengths.push(lengths[i - 1] + raw[i].distanceTo(raw[i - 1]));
  const length = lengths[lengths.length - 1];
  // Point and tangent at fraction t of the length.
  const at = (t, point = new Vector3(), tangent) => {
    const target = Math.min(1, Math.max(0, t)) * length;
    let i = 1;
    while (i < raw.length - 1 && lengths[i] < target) i++;
    const k = (target - lengths[i - 1]) / Math.max(1e-6, lengths[i] - lengths[i - 1]);
    point.copy(raw[i - 1]).lerp(raw[i], k);
    tangent?.copy(raw[i]).sub(raw[i - 1]).normalize();
    return point;
  };
  return { at, length, armStart };
}

// Chaikin corner cutting; each pass doubles the points and keeps both ends.
function smoothPath(points, passes) {
  let path = points;
  for (let pass = 0; pass < passes; pass++) {
    const next = [path[0]];
    for (let i = 0; i < path.length - 1; i++) {
      next.push(path[i].clone().lerp(path[i + 1], 0.25), path[i].clone().lerp(path[i + 1], 0.75));
    }
    next.push(path[path.length - 1]);
    path = next;
  }
  return path;
}

let layout = null;
export function skyLayout() {
  if (!layout) {
    const ribbon = ribbonFrame(), arp = arpFrame();
    alignArms(arp, ribbon.center(1));
    layout = { ribbon, arp, band: bandPath(ribbon, arp) };
  }
  return layout;
}

const schedule = {}, head = new Vector3(), ahead = new Vector3(), eye = new Vector3(), behind = new Vector3();
const before = new Vector3(), after = new Vector3();

// Rides the band. It eases in from About's framing by turning to the band's head along its
// own line of sight, then swings round behind the head and chases it, closing in, so every
// turn of the band is a turn of the camera; before Education it swings back out along its
// line of sight and blends into Education's framing as the band winds into the galaxy.
export function bandFollow(chapter, progress, target) {
  const j = journey(chapter, progress);
  if (j === null) return;
  bandSchedule(j, schedule);
  if (schedule.follow <= 0) return;
  const { band } = skyLayout();
  band.at(schedule.travel, head);
  band.at(schedule.travel + 0.06, ahead);
  // A smoothed heading, so the chase never jerks on the path's small wiggles.
  band.at(schedule.travel - 0.04, before);
  band.at(schedule.travel + 0.04, after);
  behind.copy(before).sub(after).normalize().addScaledVector(UP, 0.4).normalize();
  eye.set(target.x, target.y, target.z).sub(head);
  const distance = eye.length() || 1;
  eye.multiplyScalar(1 / distance).lerp(behind, schedule.chase).normalize()
    .multiplyScalar(distance + (20 - distance) * schedule.zoom).add(head);
  const w = schedule.follow;
  target.x += (eye.x - target.x) * w;
  target.y += (eye.y - target.y) * w;
  target.z += (eye.z - target.z) * w;
  target.lookX += (ahead.x - target.lookX) * w;
  target.lookY += (ahead.y - target.lookY) * w;
  target.lookZ += (ahead.z - target.lookZ) * w;
}
const UP = new Vector3(0, 1, 0);
