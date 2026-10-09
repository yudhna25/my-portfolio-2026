import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PNG } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js');
const dir = 'outputs/redesign/r7.1/';
const images = [];
// Canvas alone is mono; the real EDURA preview intentionally retains its product colors.
for (const file of readdirSync(dir + 'screenshots').filter(name => name.endsWith('-canvas.png'))) {
  const { width, height, data } = PNG.sync.read(readFileSync(dir + 'screenshots/' + file));
  let colored = 0, dark = 0, white = 0, black = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) colored++;
    if (data[i] < 32) dark++;
    if (data[i] === 255) white++;
    if (data[i] === 0) black++;
  }
  const total = width * height;
  assert.equal(colored, 0, file + ' mono');
  assert(white / total < .02, file + ' no flat white flash');
  if (file.includes('forward-0.58-')) assert(dark / total > .08, file + ' dark lanes');
  if (file.includes('forward-1-')) assert(black > 100, file + ' dark core');
  images.push({ file, width, height, colored, darkFraction: dark / total, whiteFraction: white / total, blackPixels: black });
}
assert(images.some(image => image.file === '1440-forward-1-canvas.png'));
assert(images.some(image => image.file === '390-forward-1-canvas.png'));
const browser = JSON.parse(readFileSync(dir + 'browser-results.json', 'utf8'));
assert.equal(browser.status, 'pass');
let domPoses = 0, maxDomReverseOffset = 0;
for (const config of browser.configurations) {
  const forward = new Map(config.poses.filter(pose => pose.label.startsWith('forward-')).map(pose => [pose.p, pose]));
  for (const pose of config.poses) {
    if (pose.chapter !== 'finale') continue;
    assert(Math.abs(pose.labels.opacity - pose.phase.label) < 1e-6, pose.label + ' labels share story progress');
    assert(Math.abs(pose.contactText.opacity - pose.phase.contact) < 1e-6, pose.label + ' Contact shares story progress');
    assert.equal(pose.labels.inert, true);
    assert.equal(pose.contactText.inert, true);
    if (pose.label.startsWith('reverse-')) {
      const original = forward.get(pose.p);
      // Native scrolling rounds fractional offsets; compensate the measured visible scroll.
      for (const key of ['contactText', 'labels']) {
        const offset = Math.abs(pose[key].top - original[key].top);
        maxDomReverseOffset = Math.max(maxDomReverseOffset, offset);
        assert(offset < .5, pose.label + ' subpixel native rounding');
        assert(Math.abs(pose[key].top + pose.y - original[key].top - original.y) < .001, pose.label + ' same authored DOM transform');
      }
    }
    domPoses++;
  }
}
const result = { status: 'pass', checkedAt: new Date().toISOString(), images, domPoses, maxDomReverseOffset, scope: 'Actual rendered Canvas PNGs plus recorded DOM story poses; native scroll fractional rounding stays below 0.5px. Product preview is intentionally color. Screen-space gas is the existing R2.4 approximation.' };
writeFileSync(dir + 'pixel-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ status: result.status, images: images.length }));
