import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium, edge, base, out, ready, scrollChapter, save, sha } from './common.mjs';

const build = JSON.parse(fs.readFileSync(out + '/build-source.json', 'utf8'));
for (const [file, hash] of Object.entries(build.source)) assert.equal(sha(file), hash, 'Source changed after build: ' + file);
const browser = await chromium.launch({ executablePath: edge, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
const page = await context.newPage(), session = await context.newCDPSession(page), records = [];
fs.mkdirSync(out + '/clips', { recursive: true });
let recording, closing = false;
const protocolErrors = [];
session.on('Page.screencastFrame', frame => {
  const active = recording;
  session.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(error => { if (!closing) protocolErrors.push(error.message); });
  if (!active || frame.metadata.timestamp < active.started || frame.metadata.timestamp - active.last < .032) return;
  active.last = frame.metadata.timestamp;
  const file = path.resolve(active.directory + '/frame-' + String(active.frames.length).padStart(4, '0') + '.jpg');
  fs.writeFileSync(file, Buffer.from(frame.data, 'base64'));
  active.frames.push({ file, time: frame.metadata.timestamp });
});
async function clip(name, action) {
  const directory = out + '/clip-frames/' + name; fs.mkdirSync(directory, { recursive: true });
  const active = { directory, frames: [], last: -Infinity, started: Date.now() / 1000 };
  recording = active;
  await session.send('Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 1440, maxHeight: 900, everyNthFrame: 2 });
  try { await action(); } finally { recording = null; await session.send('Page.stopScreencast'); }
  const frames = active.frames;
  assert(frames.length > 15, 'Insufficient actual browser frames: ' + name);
  const list = frames.map((frame, index) => "file '" + frame.file.replaceAll('\\', '/') + "'\nduration " + (frames[index + 1] ? Math.max(.01, frames[index + 1].time - frame.time) : .05)).join('\n');
  fs.writeFileSync(directory + '/frames.txt', list + '\n');
  const file = out + '/clips/' + name + '.webm';
  const encoded = await new Promise((resolve, reject) => {
    const process = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', directory + '/frames.txt', '-vf', 'fps=30', '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-pix_fmt', 'yuv420p', file], { windowsHide: true });
    let stderr = ''; process.stderr.on('data', data => { stderr += data; });
    process.on('error', reject); process.on('close', status => resolve({ status, stderr }));
  });
  assert.equal(encoded.status, 0, encoded.stderr);
  records.push({ name, frames: frames.length, seconds: frames.at(-1).time - frames[0].time, file, sha256: sha(file) });
}
try {
  await clip('opening-portal-current', async () => {
    await page.goto(base); await ready(page); await page.waitForTimeout(550);
    await scrollChapter(page, 'portal', .02);
    for (const distance of [360, 360, 360, -480, -480, 550]) { await page.mouse.wheel(0, distance); await page.waitForTimeout(800); }
    await page.waitForTimeout(400);
  });
  await clip('experience-departure-current', async () => {
    await scrollChapter(page, 'experience', .015); await page.waitForTimeout(450);
    const distance = await page.evaluate(() => {
      const a = document.querySelector('[data-story-chapter="experience"]').getBoundingClientRect();
      const b = document.querySelector('[data-story-chapter="works"]').getBoundingClientRect(); return b.top - a.top;
    });
    for (let step = 0; step < 12; step++) { await page.mouse.wheel(0, distance / 12); await page.waitForTimeout(600); }
    await page.waitForTimeout(500);
  });
  assert.equal(protocolErrors.length, 0, protocolErrors.join('\n'));
  save('clip-results.json', { source: build.source, method: 'Actual CDP frames with browser timestamps, encoded at30fps using installed ffmpeg. Frames are isolated by recording start epoch; encoding is async so ACKs drain. Clip encoding does not measure rendered FPS.', protocolErrors, records });
  console.log(JSON.stringify(records));
} finally { closing = true; recording = null; await browser.close(); }
