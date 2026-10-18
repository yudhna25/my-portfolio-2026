// Chapter journey between the reading chapters: each one is its own region of sky (a
// "biome"), and crossing into the next sends a gravitational wave out of the BH that tears
// the frame open onto the new region. Everything is a pure function of the scroll clock,
// so scrolling back replays it exactly. The 3D wave and the DOM reveal read the same state.

// Reading chapters in order, and the sky region each one opens onto.
export const BIOMES = Object.freeze(['cluster', 'planetary', 'pulsar', 'arm']);
const CHAPTER_BIOME = { about: 'cluster', skills: 'planetary', education: 'pulsar', experience: 'arm', departure: 'arm' };
const NEXT = { about: 'skills', skills: 'education', education: 'experience', experience: 'departure' };

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

// Weight of each sky region. The region switches as the wavefront crosses the frame, and
// the first and last regions fade with the portal arrival and the Works departure.
export function biomeWeights(chapter, progress, out = {}) {
  for (const biome of BIOMES) out[biome] = 0;
  const p = clamp01(progress);
  if (chapter === 'portal') {
    out.cluster = smooth(0.62, 0.96, p);
    return out;
  }
  const own = CHAPTER_BIOME[chapter];
  if (!own) return out;
  const wave = chapterWave(chapter, p, scratch);
  if (wave.active) {
    const cross = smooth(0.3, 0.7, wave.phase);
    const from = CHAPTER_BIOME[wave.from], to = CHAPTER_BIOME[wave.to];
    if (from === to) out[to] = 1;
    else { out[from] = 1 - cross; out[to] = cross; }
  } else out[own] = 1;
  // Departure: the arm thins out as the camera releases toward Works.
  if (chapter === 'departure') out.arm *= 1 - smooth(0.25, 0.7, p);
  return out;
}
const scratch = {};
