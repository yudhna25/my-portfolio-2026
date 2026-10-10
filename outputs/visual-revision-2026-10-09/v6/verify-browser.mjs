import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { PNG } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js';

const out = 'outputs/visual-revision-2026-10-09/v6/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const records = [], performanceRecords = [], errors = [], warnings = [];
const copy = Object.fromEntries(['vi', 'en'].map(lang => [lang, JSON.parse(readFileSync('src/i18n/locales/' + lang + '.json')).experience.positions]));
let status = 'running', checks = 0;
const check = (condition, message) => { checks++; assert(condition, message); };
const same = (a, b, message) => { checks++; assert.deepEqual(a, b, message); };

async function init(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
  await page.goto('http://127.0.0.1:5183/#experience');
  await page.waitForSelector('[data-meteor-label]');
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(2600);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(item => item.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const fiber = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const meteor = await import(loaded('/src/3d/utils/storyMeteor.js'));
    const { ScrollSmoother } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { i18n } = await import(loaded('/src/i18n/config.js'));
    window.qa = { fiber: fiber._roots.get(document.querySelector('canvas')).store, useScrollStore, storyCameraPath, meteor, ScrollSmoother, i18n, addAfterEffect: fiber.addAfterEffect };
    qa.layout = () => {
      const rect = document.querySelector('#experience').getBoundingClientRect(), departure = document.querySelector('[data-story-chapter="departure"]').getBoundingClientRect();
      const layout = meteor.createMeteorLayout(); layout.width = innerWidth; layout.height = innerHeight; layout.range = departure.top - rect.top;
      layout.points[0] = .08; layout.points[1] = .12 * innerHeight;
      [...document.querySelectorAll('[data-meteor-label]')].forEach((label, i) => { const box = label.getBoundingClientRect(), y = box.top - rect.top - 24; layout.points[(i + 1) * 2] = (box.left + box.width * (i === 1 ? .72 : .35)) / innerWidth; layout.points[(i + 1) * 2 + 1] = y; layout.milestones[i] = y; });
      layout.points[8] = .62; layout.points[9] = layout.range + innerHeight * .5; return layout;
    };
    qa.seek = (chapter, progress) => {
      const content = document.querySelector('#smooth-content'), base = content.getBoundingClientRect().top;
      const start = document.querySelector('[data-story-chapter="' + chapter + '"]');
      const next = document.querySelector('[data-story-chapter="' + (chapter === 'experience' ? 'departure' : 'works') + '"]');
      const top = start.getBoundingClientRect().top - base, end = next.getBoundingClientRect().top - base, y = top + (end - top) * progress;
      qa.useScrollStore.getState().setStoryPosition(chapter, progress, y / Math.max(1, document.documentElement.scrollHeight - innerHeight), true);
      const smoother = qa.ScrollSmoother.get(); if (smoother) smoother.scrollTop(y); else scrollTo(0, y);
    };
  });
}
async function seek(page, chapter, progress) { await page.evaluate(({ chapter, progress }) => qa.seek(chapter, progress), { chapter, progress }); await page.waitForTimeout(110); }
async function snap(page, name) {
  const record = await page.evaluate(() => {
    const f = qa.fiber.getState(), state = qa.useScrollStore.getState(), layout = qa.layout(), group = f.scene.getObjectByName('story-meteor');
    const trail = group.children[1], head = group.children[2], wake = group.children[0], pos = trail.geometry.attributes.position;
    const q = state.chapterProgress + (state.storyChapter === 'departure' ? 1 : 0), expected = qa.meteor.sampleStoryMeteor(layout, q, {}, {});
    const projected = head.material.uniforms.uHead.value.clone().project(f.camera);
    const pose = qa.storyCameraPath(state.storyChapter, state.chapterProgress, {}, false, innerWidth / innerHeight);
    const labels = [...document.querySelectorAll('[data-meteor-label]')].map((label, i) => ({ id: label.closest('[data-experience-item]').dataset.experienceItem, rect: label.getBoundingClientRect().toJSON(), opacity: +getComputedStyle(label).opacity, wake: +getComputedStyle(document.querySelectorAll('[data-meteor-wake]')[i]).opacity, expectedWake: state.storyChapter === 'experience' ? qa.meteor.meteorWake(layout, i, state.chapterProgress) : 0, text: label.closest('article').textContent }));
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { chapter: state.storyChapter, p: state.chapterProgress, viewport: [innerWidth, innerHeight], deviceDpr: devicePixelRatio, dpr: f.gl.getPixelRatio(), quality: document.querySelector('[data-galaxy-scene]').dataset.quality, visible: group.visible,
      positions: [...pos.array], normals: [...trail.geometry.attributes.aNormal.array], version: pos.version, head: head.material.uniforms.uHead.value.toArray(), core: head.material.uniforms.uCore.value, halo: head.material.uniforms.uDiameter.value, journey: trail.material.uniforms.uJourney.value, opacity: head.material.uniforms.uOpacity.value, tailPixels: group.userData.tailPixels, span: group.userData.span,
      headError: Math.max(Math.abs(expected.x - pos.array[0]), Math.abs(expected.y - pos.array[1]), Math.abs(expected.z - pos.array[2])), headPixel: [(projected.x + 1) * innerWidth / 2, (1 - projected.y) * innerHeight / 2],
      poseError: Math.max(Math.abs(pose.x - f.camera.position.x), Math.abs(pose.y - f.camera.position.y), Math.abs(pose.z - f.camera.position.z)), labels,
      sameGeometry: trail.geometry === wake.geometry, triangles: trail.geometry.index.count / 3 * 2 + 2, meshCount: group.children.length, canvas: document.querySelectorAll('canvas').length, composers: f.internal.subscribers.filter(item => item.priority === 1).length,
      memory: { ...f.gl.info.memory }, overflow: document.documentElement.scrollWidth - innerWidth, locale: document.documentElement.lang, glError: gl.getError(), gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
  });
  record.name = name; records.push(record);
  check(record.canvas === 1 && record.meshCount === 3 && record.sameGeometry, name + ' one Canvas/shared ribbon');
  check(record.glError === 0 && record.overflow === 0 && record.poseError < 1e-7, name + ' unchanged camera/GL/layout');
  check(record.positions.every(Number.isFinite) && record.normals.every(Number.isFinite), name + ' finite buffers');
  check(record.visible === (record.chapter === 'experience' ? record.p > 0 : record.p < 1), name + ' gating');
  if (record.visible) {
    check(record.headError < .00002 && record.journey === record.p + (record.chapter === 'departure' ? 1 : 0), name + ' exact original head/analytic gas');
    same(record.head, record.positions.slice(0, 3), name + ' head on curve');
    check(record.core === (record.viewport[0] < 768 ? 10 : 16) && record.halo === (record.viewport[0] < 768 ? 52 : 80), name + ' responsive CSS pixels');
    check(record.tailPixels <= record.viewport[0] * .501, name + ' bounded tail');
  }
  for (const label of record.labels) {
    check(label.opacity >= .7199 && Math.abs(label.wake - label.expectedWake) < .0001, name + ' readable, local analytic wake');
    for (const text of Object.values(copy[record.locale][label.id])) check(label.text.includes(text), name + ' exact locale copy');
  }
  return record;
}
async function screenshot(page, name, record) {
  const data = await page.screenshot({ path: out + 'screenshots/' + name + '.png' });
  if (!record?.visible || record.opacity < .95) return;
  const png = PNG.sync.read(data), scale = png.width / record.viewport[0], x = Math.round(record.headPixel[0] * scale), y = Math.round(record.headPixel[1] * scale);
  const white = yy => { if (yy < 0 || yy >= png.height || x < 0 || x >= png.width) return false; const o = (yy * png.width + x) * 4; return png.data[o] >= 245 && png.data[o + 1] >= 245 && png.data[o + 2] >= 245; };
  if (!white(y)) throw new Error(name + ' visible white core missing');
  let lo = y, hi = y; while (white(lo - 1) && y - lo < record.core * scale * 2) lo--; while (white(hi + 1) && hi - y < record.core * scale * 2) hi++;
  record.whiteCorePixels = (hi - lo + 1) / scale;
  // Mobile renders at DPR1; a device-DPR3 screenshot interpolates its subpixel edge.
  check(record.whiteCorePixels >= record.core * (record.viewport[0] < 768 ? .65 : .75) && record.whiteCorePixels <= record.core * 1.25, name + ' actual white core ' + record.whiteCorePixels);
}
async function poses(page, prefix) {
  const forward = new Map();
  for (const chapter of ['experience', 'departure']) {
    const values = chapter === 'experience' ? [0, .05, .2, .4, .7, 1] : [0, .1, .35, .7, .85, 1];
    for (const value of values) { await seek(page, chapter, value); forward.set(chapter + value, await snap(page, prefix + '-forward-' + chapter + '-' + value)); }
    for (const value of [...values].reverse()) { await seek(page, chapter, value); const state = await snap(page, prefix + '-reverse-' + chapter + '-' + value), original = forward.get(chapter + value); if (state.visible) { same(state.positions, original.positions, 'reverse exact positions'); same(state.normals, original.normals, 'reverse exact normals'); same(state.head, original.head, 'reverse exact head'); same(state.labels.map(l => l.wake), original.labels.map(l => l.wake), 'reverse exact wake'); } }
    await seek(page, chapter, .47); const before = await snap(page, prefix + '-stop-' + chapter); await page.waitForTimeout(550); const after = await snap(page, prefix + '-held-' + chapter);
    same(after.positions, before.positions, 'stop holds buffer'); same(after.normals, before.normals, 'stop holds normals'); same(after.version, before.version, 'no stopped uploads'); same(after.journey, before.journey, 'stop holds shader phase');
  }
  const milestones = await page.evaluate(() => { const l = qa.layout(); return [...l.milestones].map(y => { let lo = 0, hi = 1; for (let i = 0; i < 55; i++) { const mid = (lo + hi) / 2; if (qa.meteor.meteorReadingY(l, mid) < y) lo = mid; else hi = mid; } return (lo + hi) / 2; }); });
  for (let i = 0; i < 3; i++) {
    await seek(page, 'experience', milestones[i]); const state = await snap(page, prefix + '-milestone-' + i);
    check(Math.abs(state.headPixel[1] - (state.labels[i].rect.top - 24)) < 1, 'original 24px label anchor'); check(state.labels[i].opacity > .999 && state.labels[i].wake > .999, 'crossing emphasis and wake');
    if (i) check(state.tailPixels >= state.viewport[0] * .35, 'mature tail >=35%');
    await screenshot(page, state.name, state);
  }
  for (const p of [.05, .35, .85]) { await seek(page, 'departure', p); const state = await snap(page, prefix + '-departure-' + p); await screenshot(page, state.name, state); }
  await seek(page, 'experience', .4); const before = await snap(page, prefix + '-jump-before');
  await page.evaluate(() => { for (const [c, p] of [['departure', .9], ['experience', .04], ['departure', .2], ['experience', .4]]) qa.seek(c, p); }); await page.waitForTimeout(100);
  const after = await snap(page, prefix + '-jump-return'); same(after.positions, before.positions, 'jump no old trail'); same(after.normals, before.normals, 'jump exact normals');
}
async function benchmark(page, name, meteor = true) {
  const result = await page.evaluate(async ({ meteor }) => {
    const f = qa.fiber.getState(), g = f.scene.getObjectByName('story-meteor'), trails = g.children.map(mesh => mesh.material), gl = f.gl.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const frames = [], gpu = [], queries = []; let first = performance.now(), previous = first, last = first, draws = 0, triangles = 0, query, drawFrame = 0, triFrame = 0, frameQueries = [];
    const originals = trails.map(material => material.visible); trails.forEach(material => { material.visible = meteor; });
    const originalRender = f.gl.render, render = originalRender.bind(f.gl);
    f.gl.render = (...args) => { if (ext && !query) { query = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, query); } const value = render(...args); drawFrame += f.gl.info.render.calls; triFrame += f.gl.info.render.triangles; if (query) { gl.endQuery(ext.TIME_ELAPSED_EXT); frameQueries.push(query); query = null; } return value; };
    const unsub = qa.addAfterEffect(() => { const now = performance.now(); if (!drawFrame) return; frames.push(now - previous); previous = now; draws = Math.max(draws, drawFrame); triangles = Math.max(triangles, triFrame); drawFrame = triFrame = 0; queries.push(frameQueries); frameQueries = []; });
    while (performance.now() - first < 3200) { await new Promise(requestAnimationFrame); const now = performance.now(); const p = .21 + .35 * (.5 + .5 * Math.sin((now - first) / 700)); qa.seek('experience', p); last = now; }
    unsub(); f.gl.render = originalRender; trails.forEach((material, i) => { material.visible = originals[i]; });
    await new Promise(requestAnimationFrame);
    for (const frame of queries) { let time = 0, valid = frame.length > 0; for (const q of frame) { if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) && !gl.getParameter(ext.GPU_DISJOINT_EXT)) time += gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; else valid = false; gl.deleteQuery(q); } if (valid) gpu.push(time); }
    const sorted = frames.slice(3).sort((a, b) => a - b), sortedGpu = gpu.sort((a, b) => a - b), pct = (a, n) => a[Math.min(a.length - 1, Math.floor(a.length * n))] ?? null;
    return { frames: frames.length, seconds: (last - first) / 1000, fps: frames.length / ((last - first) / 1000), frameMedianMs: pct(sorted, .5), frameP95Ms: pct(sorted, .95), rendererGpuMedianMs: pct(sortedGpu, .5), rendererGpuP95Ms: pct(sortedGpu, .95), gpuSamples: gpu.length, draws, triangles, dpr: f.gl.getPixelRatio(), buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight], size: [innerWidth, innerHeight] };
  }, { meteor });
  performanceRecords.push({ name, meteor, ...result });
  check(result.frames > 30 && Number.isFinite(result.fps), name + ' real rendered telemetry');
}
try {
  for (const [width, height, dpr] of [[1440, 900, 1], [390, 844, 3], [1440, 900, 1.75]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr });
    const page = await context.newPage(); await context.tracing.start({ screenshots: true, snapshots: true }); await init(page);
    const name = width + '-dpr' + dpr; await poses(page, name);
    await page.evaluate(() => qa.i18n.changeLanguage('en')); await page.waitForTimeout(180); await seek(page, 'experience', .4); await snap(page, name + '-en');
    await page.evaluate(() => qa.i18n.changeLanguage('vi')); await page.waitForTimeout(180);
    await benchmark(page, name + '-without-meteor', false); await benchmark(page, name + '-with-meteor', true);
    if (dpr === 1) {
      for (const [w, h] of [[390, 844], [1440, 900], [390, 844], [1440, 900]]) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(240); await seek(page, 'experience', .4); await snap(page, 'resize-' + w); }
    }
    await context.tracing.stop({ path: out + name + '-trace.zip' }); await context.close();
  }
  same(errors, [], 'no App console/runtime errors'); status = 'pass'; console.log('PASS', checks, 'checks;', records.length, 'poses'); console.log(performanceRecords);
} catch (error) { status = 'fail'; console.error(error); throw error; }
finally { writeFileSync(out + 'browser-results.json', JSON.stringify({ status, checks, records, performance: performanceRecords, errors, warnings: [...new Set(warnings)] }, null, 2)); await browser.close(); }
