// Chapter journey between the reading chapters: each one is its own region of sky (a
// "biome"), and crossing into the next sends a gravitational wave out of the BH that tears
// the frame open onto the new region. Everything is a pure function of the scroll clock,
// so scrolling back replays it exactly. The 3D wave and the DOM reveal read the same state.

const NEXT = { about: 'skills', skills: 'education', education: 'experience', experience: 'departure' };

// One continuous sky story: a nebula ribbon (About) unravels into a flowing stream of light
// (Skills) that pours into the colliding galaxy pair Arp 273 (Education), whose collision
// winds the larger disk into a rose (into Experience). Each chapter also has its own faint
// two-tone colour, the single source for every layer that tints the sky by chapter.
export const PALETTE_CHAPTERS = Object.freeze(['about', 'skills', 'education', 'experience']);
export const CHAPTER_PALETTE = Object.freeze({
  // Ember H-alpha and teal oxygen, the ribbon's two gases.
  about: { haze: ['#2A1008', '#06202A'], light: '#FFC2A6' },
  // Aqua stream with a pale gold wake.
  skills: { haze: ['#04242A', '#1E1A08'], light: '#A6F0E6' },
  // Indigo and cold blue of the two galaxies before they meet.
  education: { haze: ['#140E34', '#061A34'], light: '#B4C2FF' },
  // Magenta and violet of the rose's star-forming arms.
  experience: { haze: ['#2C0A26', '#180A30'], light: '#FFBCD8' },
});
const JOURNEY = { portal: -1, about: 0, skills: 1, education: 2, experience: 3, departure: 4 };

// The wave plays over the last stretch of the outgoing chapter, so it has finished by the
// time the incoming one starts: landing on a chapter (menu, Star Map, a link) never shows
// it half open. Half way the wavefront is mid-screen.
const TAIL = 0.2;

const clamp01 = value => Math.min(1, Math.max(0, value));
const smooth = (a, b, value) => {
  const t = clamp01((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Shared per-frame screen data (CSS px), written by the 3D wave and read by the DOM reveal.
export const waveScreen = { x: 0, y: 0, width: 1, height: 1, ready: false };

// Per-frame wave state for the 3D side: BH screen centre (uv), radius (height units) and
// envelope. ChapterWaveDriver writes it first each frame; the sky and the screen pass read it.
export const waveFrame = { center: { x: 0.75, y: 0.75, set(x, y) { this.x = x; this.y = y; } }, radius: 0, strength: 0, phase: 0, active: false, to: null };

export function chapterWave(chapter, progress, out = {}) {
  const p = clamp01(progress);
  out.phase = 0;
  out.from = null;
  out.to = null;
  // The chapter this one hands over to, and whether its wave is still to come.
  out.next = NEXT[chapter] ?? null;
  out.ahead = out.next !== null && p <= 1 - TAIL;
  if (NEXT[chapter] && p > 1 - TAIL && p < 1) {
    out.phase = (p - (1 - TAIL)) / TAIL;
    out.from = chapter;
    out.to = NEXT[chapter];
  }
  out.active = out.phase > 0 && out.phase < 1;
  // Envelope: invisible at both ends so the wave never pops in or hangs at the edge.
  out.strength = out.active ? Math.sin(out.phase * Math.PI) : 0;
  return out;
}

// Wavefront radius as a fraction of the distance from the BH to the farthest screen corner.
export function waveRadius(phase) {
  return Math.pow(clamp01(phase), 1.15) * 1.12;
}

// Weight of each chapter's colour. It switches as the wavefront crosses the frame, and the
// first and last fade with the portal arrival and the Works departure.
export function paletteWeights(chapter, progress, out = {}) {
  for (const key of PALETTE_CHAPTERS) out[key] = 0;
  const p = clamp01(progress);
  if (chapter === 'portal') {
    out.about = smooth(0.62, 0.96, p);
    return out;
  }
  const own = chapter === 'departure' ? 'experience' : chapter;
  if (!(own in out)) return out;
  const wave = chapterWave(chapter, p, scratch);
  if (wave.active && wave.to !== 'departure') {
    const cross = smooth(0.3, 0.7, wave.phase);
    out[wave.from] = 1 - cross;
    out[wave.to] = cross;
  } else out[own] = 1;
  if (chapter === 'departure') out.experience *= 1 - smooth(0.25, 0.7, p);
  return out;
}

// Position along the reading journey: portal -1..0, About 0..1, Skills 1..2, Education 2..3,
// Experience 3..4, departure 4..5; null outside it.
export function journey(chapter, progress) {
  return chapter in JOURNEY ? JOURNEY[chapter] + clamp01(progress) : null;
}

const smoother = (a, b, value) => {
  const t = clamp01((value - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// The light band's schedule, shared by the band itself and the camera that rides it. The
// band's head (fraction of its length) leaves the nebula's tail late in About; the camera
// turns onto it, closes in and follows it through Skills, then pulls back in Education as
// the band winds into the galaxy's arm.
export function bandSchedule(j, out = {}) {
  out.follow = smoother(0.62, 1.0, j) * (1 - smoother(2.05, 2.6, j));
  out.travel = 0.9 * smoother(0.7, 2.2, j);
  out.zoom = smoother(0.7, 1.5, j);
  out.chase = smoother(0.9, 1.4, j) * (1 - smoother(1.85, 2.3, j));
  out.head = Math.min(1, out.travel + 0.14 * smooth(0.3, 0.8, j));
  // Once the head is in the disk the band drains in after it, tail first (0..1 of the way
  // to where the arm begins), so nothing is left hanging over the galaxy.
  out.tail = smooth(1.82, 2.22, j);
  return out;
}

// The sky layers along the journey. They overlap, so each hands over to the next in view:
// the band grows out of the ribbon's tail and becomes the galaxy's arm, which the disk forms
// around (form). approach is the companion's fall past the disk; rose is the winding it
// causes (0 a loose spiral, 1 the rose fully wound), lagging behind it into Experience.
export function skyLayers(chapter, progress, out = {}) {
  out.nebula = out.band = out.arp = out.form = out.approach = out.rose = out.head = out.tail = 0;
  const j = journey(chapter, progress);
  if (j === null) return out;
  out.nebula = smooth(-0.38, -0.04, j) * (1 - smooth(1.3, 1.8, j));
  out.band = smooth(0.3, 0.55, j) * (1 - smooth(2.35, 2.8, j));
  out.arp = smooth(1.8, 2.05, j) * (1 - smooth(4.25, 4.7, j));
  out.form = smooth(1.85, 2.45, j);
  out.approach = smooth(1.95, 3.2, j);
  out.rose = smooth(2.5, 3.4, j);
  bandSchedule(j, scratchBand);
  out.head = scratchBand.head;
  out.tail = scratchBand.tail;
  return out;
}
const scratchBand = {};
const scratch = {};
