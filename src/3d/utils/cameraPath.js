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
  if (chapter === 'portal' && !frozen) {
    const bend = Math.sin(ease * Math.PI);
    target.x += 2.4 * bend * (progress < 0.47 ? -1 : 1);
    target.y += 1.2 * bend;
  }
  return target;
}
