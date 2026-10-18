// Scene units are Schwarzschild radii. The thin disk occupies r = 3..14, y = 0.
export const BLACK_HOLE_CENTER = Object.freeze([0, 0, -200]);

export function cameraPath(progress, target = {}) {
  const p = Math.min(1, Math.max(0, progress));
  const approach = p * p * (3 - 2 * p);
  target.x = -Math.sin(p * Math.PI * 5) * 2.2 * (1 - 0.6 * p) - 3.5 * approach;
  target.y = 2.2 * (1 - approach) + 0.18 * approach;
  target.z = -168 - 23 * approach;
  target.lookX = -4.5 * approach;
  target.lookY = -0.45 * approach;
  target.parallax = 0.35 * (1 - approach);
  return target;
}

const start = cameraPath(0);
export const INITIAL_CAMERA_POSITION = Object.freeze([start.x, start.y, start.z]);

// R2 lab foundation: DOM ranges and exterior poses, no portal/finale renderer.
export const STORY_CHAPTERS = Object.freeze([
  { id: 'hero', height: 1 }, { id: 'portal', height: 4, transition: true },
  { id: 'about', height: 1 }, { id: 'skills', height: 1 },
  { id: 'education', height: 1.75 }, { id: 'experience', height: 1 },
  { id: 'departure', height: 1.1, transition: true },
  { id: 'works', height: 1 }, { id: 'finale', height: 4, transition: true },
  { id: 'contact', height: 1 },
]);
export const STORY_SEED = 20261007;
export const STORY_IDLE_PHASE = 0;

const HERO = [0, 2.2, -168, 0, 0, -200];
const CLOSE = [1, 1.4, -192, 0, -0.2, -200];
// Pull back into the upper-right background, clear of About's portrait and bio.
const ABOUT = [2, 5, -154, -36, -16, -200];
const SKILLS = [2, 5, -145, -50, -35, -200];
const EDUCATION = [2, 5, -110, -64, -42, -200];
// Look away from the existing BH instead of moving its shader center to -420.
const WORKS = [0, 4, -160, 140, 0, -210];
const CONTACT = [2, 4, -160, -12, -1, -200];
// Finale flight: dive in on the merger, get thrown back by the blast, then crane down
// onto the unchanged Contact framing before the new disk is fully formed.
const DIVE = [5, 2.4, -177, 0, 0, -200];
const BLAST = [-8, 8, -143, -3, -0.5, -200];

function smootherStep(a, b, value) {
  const t = clampStoryProgress((value - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function clampStoryProgress(value) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function segmentProgress(scroll, start, end) {
  return end > start ? clampStoryProgress((scroll - start) / (end - start)) : 0;
}

// Accelerating fall; the terminal velocity is hidden inside the existing dark rebase.
export function portalFall(progress) {
  const q = clampStoryProgress(progress / 0.44);
  return q * q * (0.25 + 0.75 * q);
}

// Rotates a point about the BH centre: yaw about world up, then pitch about the horizontal
// axis across the BH→camera direction (ax, az).
function orbitPoint(target, keyX, keyY, keyZ, cosYaw, sinYaw, cosPitch, sinPitch, ax, az) {
  const [cx, cy, cz] = BLACK_HOLE_CENTER;
  const x = target[keyX] - cx, y = target[keyY] - cy, z = target[keyZ] - cz;
  const yx = x * cosYaw + z * sinYaw, yz = -x * sinYaw + z * cosYaw;
  // Rodrigues about the unit axis (ax, 0, az).
  const along = ax * yx + az * yz;
  target[keyX] = cx + yx * cosPitch + -az * y * sinPitch + ax * along * (1 - cosPitch);
  target[keyY] = cy + y * cosPitch + (az * yx - ax * yz) * sinPitch;
  target[keyZ] = cz + yz * cosPitch + ax * y * sinPitch + az * along * (1 - cosPitch);
}

// Reading-chapter drift around the BH, continuous across chapter joins: About pushes in
// (the rack focus is a separate pass), Skills orbits, Education cranes up, Experience
// spirals inward along the arm, and departure releases it all before Works' fixed basis.
// Orbiting the BH keeps it composed where each chapter frames it; the sky turns behind it.
function storyDrift(chapter, progress, target) {
  const s = progress * progress * (3 - 2 * progress);
  let dolly = 0, yaw = 0, pitch = 0;
  if (chapter === 'about') dolly = 2.5 * s;
  else if (chapter === 'skills') { dolly = 2.5; yaw = 0.10 * s; }
  else if (chapter === 'education') { dolly = 2.5; yaw = 0.10; pitch = 0.08 * s; }
  else if (chapter === 'experience') { dolly = 2.5 + 8 * s; yaw = 0.10 + 0.12 * s; pitch = 0.08; }
  else if (chapter === 'departure') {
    const release = 1 - smootherStep(0, 0.7, progress);
    dolly = 10.5 * release; yaw = 0.22 * release; pitch = 0.08 * release;
  }
  if (!dolly && !yaw && !pitch) return;
  const [cx, , cz] = BLACK_HOLE_CENTER;
  const hx = target.x - cx, hz = target.z - cz, length = Math.hypot(hx, hz) || 1;
  const cosYaw = Math.cos(yaw), sinYaw = Math.sin(yaw);
  // Pitch axis: horizontal, across the yawed BH→camera direction (positive raises the camera).
  const dx = (hx * cosYaw + hz * sinYaw) / length, dz = (-hx * sinYaw + hz * cosYaw) / length;
  const ax = -dz, az = dx, cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);
  orbitPoint(target, 'x', 'y', 'z', cosYaw, sinYaw, cosPitch, sinPitch, ax, az);
  orbitPoint(target, 'lookX', 'lookY', 'lookZ', cosYaw, sinYaw, cosPitch, sinPitch, ax, az);
  // Dolly toward the BH; the aim moves with it, so only the BH and near layers grow.
  const fx = BLACK_HOLE_CENTER[0] - target.x, fy = BLACK_HOLE_CENTER[1] - target.y, fz = BLACK_HOLE_CENTER[2] - target.z;
  const reach = Math.hypot(fx, fy, fz) || 1;
  for (const [key, delta] of [['x', fx], ['y', fy], ['z', fz]]) {
    const step = delta / reach * dolly;
    target[key] += step;
    target['look' + key.toUpperCase()] += step;
  }
}

// Each reading chapter has its own way of moving through its region of sky, layered on the
// drift: About trucks straight into a star cluster, Skills arcs around the ringed world,
// Education rises on a crane past the pulsar, Experience tracks sideways along the arm.
// Offsets are in the camera's own frame (right, up, forward; position and aim). A chapter's
// final offset carries into the next and eases out while that one's move eases in, so the
// path stays continuous across every join.
const MOVES = {
  about: { f: 11, u: -1.5, lf: 4, lu: 2, lr: 9 },
  skills: { r: -14, f: 3, lr: 2 },
  education: { u: 14, lu: 4 },
  experience: { r: 17, lr: 11, f: 4, lf: 4, roll: 0.035 },
};
const MOVE_PREVIOUS = { skills: 'about', education: 'skills', experience: 'education', departure: 'experience' };
const MOVE_KEYS = ['r', 'u', 'f', 'lr', 'lu', 'lf', 'roll'];
const moveOffset = {};
const basisRight = [0, 0, 0], basisUp = [0, 0, 0], basisForward = [0, 0, 0];

function chapterMove(chapter, progress, target) {
  for (const key of MOVE_KEYS) moveOffset[key] = 0;
  const own = MOVES[chapter], previous = MOVES[MOVE_PREVIOUS[chapter]];
  if (!own && !previous) return;
  const grow = smootherStep(0.04, 0.82, progress);
  const fade = 1 - smootherStep(0, chapter === 'departure' ? 0.6 : 0.32, progress);
  for (const key of MOVE_KEYS) moveOffset[key] = (own?.[key] ?? 0) * grow + (previous?.[key] ?? 0) * fade;
  // Camera frame of the unmoved pose.
  let fx = target.lookX - target.x, fy = target.lookY - target.y, fz = target.lookZ - target.z;
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;
  let rx = -fz, rz = fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl; rz /= rl;
  basisForward[0] = fx; basisForward[1] = fy; basisForward[2] = fz;
  basisRight[0] = rx; basisRight[1] = 0; basisRight[2] = rz;
  basisUp[0] = -rz * fy; basisUp[1] = rz * fx - rx * fz; basisUp[2] = rx * fy;
  const o = moveOffset;
  ['x', 'y', 'z'].forEach((axis, i) => {
    target[axis] += basisRight[i] * o.r + basisUp[i] * o.u + basisForward[i] * o.f;
    target['look' + axis.toUpperCase()] += basisRight[i] * o.lr + basisUp[i] * o.lu + basisForward[i] * o.lf;
  });
  target.roll += o.roll * Math.sin(Math.PI * Math.min(1, progress)) * (own?.roll ? 1 : 0);
}

export function storyCameraPath(chapter, progress, target = {}, frozen = false, aspect = 1) {
  let p = frozen ? 1 : clampStoryProgress(progress);
  let from = HERO, to = HERO;
  switch (chapter) {
    case 'portal':
      if (p < 0.47) { from = HERO; to = CLOSE; p = clampStoryProgress(p / 0.44); }
      else { from = CLOSE; to = ABOUT; p = clampStoryProgress((p - 0.50) / 0.44); }
      break;
    case 'about': from = to = ABOUT; break;
    case 'contact': from = to = CONTACT; break;
    case 'skills': from = ABOUT; to = SKILLS; p = clampStoryProgress(p / 0.25); break;
    case 'education': from = SKILLS; to = EDUCATION; p = clampStoryProgress(p / 0.25); break;
    case 'experience': from = to = EDUCATION; break;
    case 'departure': from = EDUCATION; to = WORKS; break;
    case 'works': from = to = WORKS; break;
    case 'finale':
      if (frozen) { from = to = CONTACT; break; }
      if (p < 0.44) { from = WORKS; to = DIVE; p = clampStoryProgress((p - 0.12) / 0.32); }
      else if (p < 0.64) { from = DIVE; to = BLAST; p = 1 - Math.pow(1 - (p - 0.44) / 0.20, 3); }
      else { from = BLAST; to = CONTACT; p = clampStoryProgress((p - 0.64) / 0.22); }
      break;
  }
  const ease = chapter === 'portal' && progress < 0.47 && !frozen ? portalFall(progress)
    : chapter === 'finale' && progress >= 0.44 && progress < 0.64 ? p : p * p * (3 - 2 * p);
  target.x = from[0] + (to[0] - from[0]) * ease;
  target.y = from[1] + (to[1] - from[1]) * ease;
  target.z = from[2] + (to[2] - from[2]) * ease;
  target.lookX = (from[3] + (to[3] - from[3]) * ease) * Math.min(1, 0.54 * Math.max(1, aspect));
  target.lookY = from[4] + (to[4] - from[4]) * ease;
  target.lookZ = from[5] + (to[5] - from[5]) * ease;
  // Portrait Contact reserves the lower reading area without clipping the disk to the side.
  const towardContact = chapter === 'contact' || frozen && chapter === 'finale' ? 1 : chapter === 'finale' && progress >= 0.64 ? ease : 0;
  const portraitContact = Math.min(1, Math.max(0, (1 - aspect) / 0.4)) * towardContact;
  target.lookX *= 1 - portraitContact;
  target.lookY -= 12 * portraitContact;
  target.parallax = 0;
  target.roll = 0;
  if (chapter === 'finale' && !frozen) {
    const q = clampStoryProgress(progress);
    // Bank into the spiral, swing back with the blast, level out before the disk forms.
    target.roll = 0.10 * smootherStep(0.16, 0.44, q) * (1 - smootherStep(0.44, 0.58, q))
      - 0.05 * smootherStep(0.48, 0.60, q) * (1 - smootherStep(0.66, 0.82, q));
    // Collision shake on the scroll clock, so scrubbing back replays it.
    const shake = q < 0.44 ? 0 : 0.9 * Math.exp(-(q - 0.44) * 45);
    target.x += Math.sin(q * 731) * shake;
    target.y += Math.cos(q * 913) * shake * 0.7;
    target.roll += Math.sin(q * 1103) * shake * 0.03;
  }
  if (!frozen) {
    storyDrift(chapter, clampStoryProgress(progress), target);
    chapterMove(chapter, clampStoryProgress(progress), target);
  }
  if (chapter === 'portal' && !frozen) {
    const bend = Math.sin(ease * Math.PI);
    target.x += 2.4 * bend * (progress < 0.47 ? -1 : 1);
    target.y += 1.2 * bend;
  }
  return target;
}
