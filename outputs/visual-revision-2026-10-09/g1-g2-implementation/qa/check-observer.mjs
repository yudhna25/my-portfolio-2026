import assert from 'node:assert/strict';
import { openingSummary } from './common.mjs';

const box = (x, y, w, h, opacity = 1) => ({ x, y, w, h, opacity });
const record = { frames: [
  { t: 20, loader: box(0, 0, 1440, 900), hero: box(0, 0, 1440, 900), ring: box(620, 350, 200, 200), anchor: box(940, 400, 60, 60), veil: box(0, 0, 1440, 900), locked: true, presentationDuration: null, ready: null },
  { t: 1800, loader: box(0, 0, 1440, 900), hero: box(0, 0, 1440, 900), ring: box(940, 400, 60, 60, .5), anchor: box(940, 400, 60, 60), veil: box(0, 0, 1440, 900, .5), locked: true, presentationDuration: 1.8, ready: 'scene-font' },
  { t: 2400, loader: null, hero: box(0, 0, 1440, 900), locked: false, presentationDuration: null, fallback: false },
] };
const summary = openingSummary(record);
assert.equal(summary.firstPresentationMs, 1800);
assert.equal(summary.duration, 1.8);
assert.equal(summary.maximumRevealAlignmentPx, 0);
assert.equal(summary.blankRevealFrames, 0);
assert.equal(summary.releaseMs, 2400);
assert.equal(openingSummary({ frames: [] }).final, null);
record.frames[1].hero.opacity = 0;
assert.equal(openingSummary(record).blankRevealFrames, 1);
console.log(JSON.stringify({ status: 'pass', purpose: 'Observer arithmetic only; no app/browser result claimed', assertions: 7 }));
