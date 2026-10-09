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
  { id: 'works', height: 1 }, { id: 'finale', height: 2.25, transition: true },
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
const CONTACT = [2, 4, -160, -22, -5, -200];

export function clampStoryProgress(value) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function segmentProgress(scroll, start, end) {
  return end > start ? clampStoryProgress((scroll - start) / (end - start)) : 0;
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
    // Reach the collision pose before the burst; stay in that same frame as gas forms the BH.
    case 'finale': from = WORKS; to = CONTACT; p = clampStoryProgress((p - 0.12) / 0.32); break;
  }
  const ease = p * p * (3 - 2 * p);
  target.x = from[0] + (to[0] - from[0]) * ease;
  target.y = from[1] + (to[1] - from[1]) * ease;
  target.z = from[2] + (to[2] - from[2]) * ease;
  target.lookX = (from[3] + (to[3] - from[3]) * ease) * Math.min(1, 0.54 * Math.max(1, aspect));
  target.lookY = from[4] + (to[4] - from[4]) * ease;
  target.lookZ = from[5] + (to[5] - from[5]) * ease;
  // Portrait Contact reserves the lower reading area without clipping the disk to the side.
  const portraitContact = Math.min(1, Math.max(0, (1 - aspect) / 0.4)) * (chapter === 'contact' ? 1 : chapter === 'finale' ? ease : 0);
  target.lookX *= 1 - portraitContact;
  target.lookY -= 23 * portraitContact;
  target.parallax = 0;
  if (chapter === 'portal' && !frozen) {
    const bend = Math.sin(ease * Math.PI);
    target.x += 2.4 * bend * (progress < 0.47 ? -1 : 1);
    target.y += 1.2 * bend;
  }
  return target;
}
