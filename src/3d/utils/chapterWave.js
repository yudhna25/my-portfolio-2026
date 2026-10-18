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

// The sky layers along the journey (portal -1..0, About 0..1, Skills 1..2, Education 2..3,
// Experience 3..4, departure 4..5). They overlap, so each one hands over to the next in
// view: the ribbon's tail feeds the stream, the stream runs into the galaxy pair.
// approach is the companion's fall past the large disk; rose is the winding it causes
// (0 a loose spiral, 1 the rose fully wound), lagging behind it into Experience.
export function skyLayers(chapter, progress, out = {}) {
  out.nebula = out.stream = out.arp = out.approach = out.rose = 0;
  if (!(chapter in JOURNEY)) return out;
  const j = JOURNEY[chapter] + clamp01(progress);
  out.nebula = smooth(-0.38, -0.04, j) * (1 - smooth(1.12, 1.6, j));
  out.stream = smooth(0.62, 1.05, j) * (1 - smooth(2.3, 2.9, j));
  out.arp = smooth(1.62, 2.06, j) * (1 - smooth(4.25, 4.7, j));
  out.approach = smooth(1.75, 3.2, j);
  out.rose = smooth(2.45, 3.4, j);
  return out;
}
const scratch = {};
