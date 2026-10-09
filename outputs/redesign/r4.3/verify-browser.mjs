// Run from project root. Uses the production App/Canvas and installed Edge; no GPU benchmark.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = 'outputs/redesign/r4.3/';
const phase = process.env.R43_PHASE ?? 'all';
mkdirSync(out + 'screenshots', { recursive: true });
const source = JSON.parse(readFileSync('outputs/redesign/r0.2/constellation-data.json'));
const data = JSON.parse(readFileSync('src/3d/data/symbolTargets.json'));
const ids = ['saigonUniversity', 'greenAcademy', 'arenaMultimedia'];
const mapping = { saigonUniversity: 'Cir', greenAcademy: 'Tel', arenaMultimedia: 'Pic' };
const copy = Object.fromEntries(['vi', 'en'].map(locale => [locale, JSON.parse(readFileSync('src/i18n/locales/' + locale + '.json')).education]));
for (const id of ids) {
  const item = data.education.find(item => item.id === id);
  assert.equal(item.constellationId, mapping[id]);
  assert.deepEqual(item.geometry, source.constellations.find(item => item.id === mapping[id]).geometry);
}
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const results = [], errors = [], warnings = [];
let status = 'running';
let page;
function watch(p) {
  p.on('pageerror', error => errors.push(error.message));
  p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
}
async function init(p, locale = 'vi', url = 'http://127.0.0.1:5173/#education') {
  watch(p); await p.goto(url); await p.waitForSelector('[data-education-stage]');
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2800);
  await p.evaluate(async locale => {
    const urls = performance.getEntriesByType('resource').map(item => item.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots } = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { useEducationStore } = await import(loaded('/src/stores/useEducationStore.js'));
    const { useSkillsStore } = await import(loaded('/src/stores/useSkillsStore.js'));
    const { ScrollSmoother, ScrollTrigger } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { default: i18n } = await import(loaded('/src/i18n/config.js'));
    window.qa = { roots: _roots, fiber: _roots.get(document.querySelector('canvas')).store, useScrollStore, useEducationStore, useSkillsStore, ScrollSmoother, ScrollTrigger, storyCameraPath, i18n };
    await i18n.changeLanguage(locale);
  }, locale);
  await p.waitForTimeout(250);
}
async function scroll(chapter = 'education', progress = 0, p = page) {
  await p.evaluate(({ chapter, progress }) => {
    const content = document.querySelector('#smooth-content'), base = content.getBoundingClientRect().top;
    const chapters = [...content.querySelectorAll('[data-story-chapter]')], element = chapters.find(item => item.dataset.storyChapter === chapter);
    const index = chapters.indexOf(element), top = element.getBoundingClientRect().top - base;
    const bottom = chapters[index + 1]?.getBoundingClientRect().top - base ?? top + element.offsetHeight;
    window.qa.useScrollStore.getState().setStoryManual(false);
    const smoother = window.qa.ScrollSmoother.get(), y = top + (bottom - top) * progress;
    if (smoother) smoother.scrollTop(y); else scrollTo(0, y);
  }, { chapter, progress }); await p.waitForTimeout(200);
}
async function position(id, p = page) {
  await p.evaluate(id => {
    const stage = document.querySelector('[data-education-stage="' + id + '"]').getBoundingClientRect();
    const button = document.querySelector('[data-education-item="' + id + '"]').getBoundingClientRect();
    const content = document.querySelector('#smooth-content'), base = content.getBoundingClientRect().top;
    const section = document.querySelector('#education').getBoundingClientRect();
    const top = Math.min(stage.top, button.top), bottom = Math.max(stage.bottom, button.bottom);
    const y = Math.max(section.top - base, top - base - Math.max(72, (innerHeight - (bottom - top)) / 2));
    window.qa.useScrollStore.getState().setStoryManual(false);
    const smoother = window.qa.ScrollSmoother.get(); if (smoother) smoother.scrollTop(y); else scrollTo(0, y);
  }, id); await p.waitForTimeout(150);
}
async function snap(label, p = page) {
  const s = await p.evaluate(() => {
    const { fiber, useEducationStore, useSkillsStore, useScrollStore, storyCameraPath } = window.qa;
    const f = fiber.getState(), state = useEducationStore.getState(), story = useScrollStore.getState();
    const target = state.focus ?? state.selection ?? state.hover, root = f.scene.getObjectByName('symbol-stars'), pool = root.userData.pool;
    const points = root.getObjectByName('symbol-pool'), links = root.getObjectByName('symbol-links'), anchor = root.getObjectByName('symbol-anchor');
    const stage = document.querySelector('[data-education-stage="' + state.anchorId + '"]')?.getBoundingClientRect();
    const projected = anchor.position.clone().project(f.camera), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pose = storyCameraPath(story.storyChapter, story.chapterProgress, {}, reduced, innerWidth / innerHeight);
    const expected = f.camera.clone(); expected.position.set(pose.x, pose.y, pose.z); expected.lookAt(pose.lookX, pose.lookY, pose.lookZ);
    const mainStars = pool.target?.geometry?.stars ?? [], contextStars = pool.target?.geometry?.supportingStars ?? [];
    let baseError = 0, goalError = 0, geometryError = 0, linkError = 0;
    for (let i = 0; i < pool.positions.length; i++) { baseError = Math.max(baseError, Math.abs(pool.positions[i] - pool.base[i])); goalError = Math.max(goalError, Math.abs(pool.positions[i] - pool.goal[i])); }
    [...mainStars, ...contextStars].forEach((star, index) => star.position.forEach((value, axis) => { geometryError = Math.max(geometryError, Math.abs(pool.goal[index * 3 + axis] - value)); }));
    if (links.geometry.drawRange.count) pool.target.edges.forEach((edge, i) => edge.forEach((point, end) => { for (let axis = 0; axis < 3; axis++) linkError = Math.max(linkError, Math.abs(links.geometry.attributes.position.array[(i * 2 + end) * 3 + axis] - pool.positions[point * 3 + axis])); }));
    const projectedStars = mainStars.map((star, i) => { const point = f.camera.position.clone().fromArray(pool.positions, i * 3).applyMatrix4(anchor.matrixWorld).project(f.camera); return { id: star.id, x: (point.x + 1) * innerWidth / 2, y: (1 - point.y) * innerHeight / 2, size: pool.sizes[i], weight: pool.weights[i] }; });
    const labels = [...document.querySelectorAll('[data-education-item]')].map(button => ({ id: button.dataset.educationItem, tag: button.tagName, text: button.innerText, regionText: (button.closest('[data-education-region]') ?? button.closest('li')).innerText, pressed: button.getAttribute('aria-pressed'), box: button.getBoundingClientRect().toJSON(), opacity: getComputedStyle(button).opacity, visibility: getComputedStyle(button).visibility, fontSize: getComputedStyle(button).fontSize }));
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const bh = f.camera.position.clone().set(0, 0, -200).project(f.camera);
    return { chapter: story.storyChapter, progress: story.chapterProgress, manual: story.storyManual, target, channels: [state.hover, state.focus, state.selection], visible: state.visible, poolTarget: pool.target?.id ?? null,
      active: root.visible, anchorVisible: anchor.visible, anchorScale: anchor.scale.toArray(), anchorQError: anchor.quaternion.angleTo(f.camera.quaternion), anchorError: stage ? Math.max(Math.abs((projected.x + 1) * innerWidth / 2 - stage.left - stage.width / 2), Math.abs((1 - projected.y) * innerHeight / 2 - stage.top - stage.height / 2)) : null,
      formation: pool.formation, lines: pool.lines, logo: pool.logo, baseError, goalError, geometryError, linkError, settled: pool.settled, stage: stage?.toJSON(),
      positions: [...pool.positions], mainStars: projectedStars, mainCount: mainStars.length, supportingCount: contextStars.length, weights: [...pool.weights], renderedEdges: links.geometry.drawRange.count / 2, lineOpacity: links.material.opacity,
      visibleLogos: root.getObjectsByProperty('isMesh', true).filter(mesh => mesh.visible).length, poolCount: points.geometry.attributes.position.count, poolUuid: points.geometry.uuid, version: points.geometry.attributes.position.version,
      canvas: document.querySelectorAll('canvas').length, pools: f.scene.getObjectsByProperty('name', 'symbol-pool').length, writers: f.internal.subscribers.filter(subscriber => subscriber.priority === -1).length,
      poseError: Math.max(Math.abs(pose.x - f.camera.position.x), Math.abs(pose.y - f.camera.position.y), Math.abs(pose.z - f.camera.position.z)), qError: expected.quaternion.angleTo(f.camera.quaternion), observerR: f.camera.position.distanceTo(f.camera.position.clone().set(0, 0, -200)),
      bh: [(bh.x + 1) * innerWidth / 2, (1 - bh.y) * innerHeight / 2], viewport: [innerWidth, innerHeight], labels, mapHeightVh: document.querySelector('#education').offsetHeight / innerHeight,
      reduced, locale: document.documentElement.lang, focus: document.activeElement.dataset.educationItem ?? document.activeElement.tagName, skillsTarget: useSkillsStore.getState().focus ?? useSkillsStore.getState().selection ?? useSkillsStore.getState().hover,
      overflow: document.documentElement.scrollWidth - innerWidth, heroOpacity: getComputedStyle(document.querySelector('[data-portal-stage]')).opacity, memory: { ...f.gl.info.memory }, subscribers: f.internal.subscribers.length, glError: gl.getError(), frameloop: f.frameloop, dpr: f.gl.getPixelRatio(), gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
  });
  results.push({ label, ...s });
  assert.equal(s.canvas, 1, label); assert.equal(s.pools, 1, label); assert.equal(s.writers, 1, label); assert.equal(s.poolCount, 192, label);
  assert.equal(s.overflow, 0, label); assert.equal(s.glError, 0, label); assert(s.poseError < 1e-7, label); assert(s.qError < 1e-7, label); assert(s.observerR > 1, label);
  assert(s.positions.every(Number.isFinite), label); assert.equal(s.visibleLogos, 0, label); assert(s.geometryError < 1e-7, label); assert(s.linkError < 1e-7, label);
  assert.equal(s.labels.length, 3, label); assert(s.labels.every(item => item.tag === 'BUTTON' && item.box.width > 0 && item.box.height >= 44 && item.opacity === '1' && item.visibility === 'visible'), label + ' readable labels');
  assert.equal(s.labels.filter(item => item.pressed === 'true').length, s.target ? 1 : 0, label + ' one DOM target');
  assert(s.labels.every(item => item.box.left >= -1 && item.box.right <= s.viewport[0] + 1), label + ' label horizontal bounds');
  if (s.target) assert(s.stage.left >= -1 && s.stage.right <= s.viewport[0] + 1, label + ' stage horizontal bounds');
  for (const item of s.labels) for (const value of Object.values(copy[s.locale].institutions[item.id])) assert(item.regionText.includes(value), label + ' approved institution copy: ' + item.id);
  if (s.viewport[0] >= 1024) assert(s.mapHeightVh >= 1.5 && s.mapHeightVh <= 2.05, label + ' desktop map height: ' + s.mapHeightVh);
  if (s.active && s.poolTarget && s.goalError === 0) for (const star of s.mainStars) {
    assert(star.x >= s.stage.left - 1 && star.x <= s.stage.right + 1 && star.y >= s.stage.top - 1 && star.y <= s.stage.bottom + 1, label + ' chart point in stage');
    assert(s.labels.every(item => star.x < item.box.left - 4 || star.x > item.box.right + 4 || star.y < item.box.top - 4 || star.y > item.box.bottom + 4), label + ' main star clear of school label');
  }
  if (s.chapter !== 'hero' && s.chapter !== 'portal') assert.equal(s.heroOpacity, '0', label + ' Hero hidden');
  if (s.active && s.target) { assert(s.anchorError < .002, label + ' anchor: ' + s.anchorError); assert(s.anchorQError < 1e-7, label + ' chart faces camera'); assert(s.anchorScale.every(value => value > 0 && value === s.anchorScale[0]), label + ' uniform positive chart scale'); }
  if (s.poolTarget) { const item = data.education.find(item => item.id === s.poolTarget); assert(item, label); assert.equal(s.mainCount, item.geometry.stars.length, label); assert.equal(s.supportingCount, item.geometry.supportingStars.length, label); if (s.lines === 1) assert.equal(s.renderedEdges, item.geometry.edges.length, label); }
  return s;
}
async function shot(name, p = page) { await p.screenshot({ path: out + 'screenshots/' + name + '.png' }); }
async function tapBackground(id, p = page) {
  const point = await p.evaluate(id => {
    const rect = document.querySelector('[data-education-stage="' + id + '"]').getBoundingClientRect();
    const x = rect.left + rect.width / 2, y = Math.max(80, Math.min(innerHeight - 12, rect.top + rect.height / 2));
    const hit = document.elementFromPoint(x, y);
    if (!hit?.closest('#education') || hit.closest('[data-education-item],[data-education-clear]')) throw Error('No visible Education background tap point');
    return { x, y };
  }, id);
  await p.touchscreen.tap(point.x, point.y);
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  page = await context.newPage(); await context.tracing.start({ screenshots: true, snapshots: true }); await init(page); await scroll();
  await snap('idle'); await shot('1440-idle');
  for (const id of ids) {
    await position(id); await page.locator('[data-education-item="' + id + '"]').hover(); await page.waitForTimeout(170);
    const start = await snap(id + '-stars-first'); assert.equal(start.poolTarget, id); assert.equal(start.lines, 0); assert.equal(start.logo, 0);
    await page.waitForTimeout(1400); const done = await snap(id + '-formed'); assert.equal(done.goalError, 0); assert.equal(done.lines, 1); await shot('1440-' + id);
    await page.mouse.move(2, 80); await page.waitForTimeout(1800); const leave = await snap(id + '-leave'); assert.equal(leave.target, null); assert.equal(leave.baseError, 0); assert.equal(leave.renderedEdges, 0);
  }
  for (let i = 0; i < 9; i++) { const id = ids[i % 3]; await position(id); await page.locator('[data-education-item="' + id + '"]').hover(); await page.waitForTimeout(40); const state = await snap('rapid-' + i); assert.equal(state.poolTarget, id); assert.equal(state.renderedEdges, 0); }
  await position(ids[0]); await page.mouse.move(2, 80); await page.keyboard.press('Tab'); await page.locator('[data-education-item="' + ids[0] + '"]').focus(); await page.waitForTimeout(150);
  assert.equal((await snap('keyboard-focus')).target, ids[0]); await page.keyboard.press('Escape'); assert.equal((await snap('escape-keeps-focus')).target, null);
  await page.keyboard.press('Enter'); assert.equal((await snap('enter-after-escape')).target, ids[0]); await page.keyboard.press('Tab'); assert.equal((await snap('tab-next')).target, ids[1]);
  await page.keyboard.press('Shift+Tab'); assert.equal((await snap('shift-tab')).target, ids[0]); await page.locator('#education-heading').evaluate(element => { element.tabIndex = -1; element.focus(); });
  assert.equal((await snap('blur-clear')).target, null);
  await position(ids[1]); await page.locator('[data-education-item="' + ids[1] + '"]').hover(); await page.waitForTimeout(1500); await scroll('experience');
  const outside = await snap('scroll-out'); assert.equal(outside.target, null); assert.equal(outside.poolTarget, null); assert.equal(outside.active, false); assert.equal(outside.baseError, 0);
  await scroll('education'); assert.equal((await snap('reverse-no-stale')).poolTarget, null);
  await scroll('skills'); await page.locator('[data-skill-clear]').focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  const entered = await snap('native-tab-skills-to-education'); assert(['skills', 'education'].includes(entered.chapter)); assert.equal(entered.focus, ids[0]); assert.equal(entered.target, ids[0]); assert.equal(entered.poolTarget, ids[0]); assert.equal(entered.active, true);
  for (let cycle = 0; cycle < 3; cycle++) {
    await position(ids[2]); await page.locator('[data-education-item="' + ids[2] + '"]').focus(); await page.waitForTimeout(120);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(220); const reduced = await snap('live-reduced-' + cycle); assert.equal(reduced.focus, ids[2]); if (reduced.visible) assert.equal(reduced.target, ids[2]);
    await page.evaluate(() => window.qa.i18n.changeLanguage('en')); await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(250); await position(ids[2]); const mobile = await snap('live-en-mobile-' + cycle); assert.equal(mobile.focus, ids[2]); if (mobile.visible) assert.equal(mobile.target, ids[2]);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.evaluate(() => window.qa.i18n.changeLanguage('vi')); await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(250); await position(ids[2]); const desktop = await snap('live-vi-desktop-' + cycle); assert.equal(desktop.focus, ids[2]); if (desktop.visible) assert.equal(desktop.target, ids[2]);
  }
  await page.mouse.wheel(0, 1600); await page.waitForTimeout(1600); const focusOut = await snap('native-wheel-focus-out'); assert.notEqual(focusOut.chapter, 'education'); assert.equal(focusOut.target, null); assert.equal(focusOut.poolTarget, null); assert.equal(focusOut.baseError, 0);
  await page.mouse.wheel(0, -1600); await page.waitForTimeout(1600); const focusBack = await snap('native-wheel-focus-reverse'); assert.equal(focusBack.chapter, 'education'); assert.equal(focusBack.target, null); assert.equal(focusBack.poolTarget, null);
  await position(ids[2]); await page.keyboard.press('Enter'); await page.waitForTimeout(80); assert.equal((await snap('focus-enter-reselect')).target, ids[2]); await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(150); await page.evaluate(() => window.qa.i18n.changeLanguage('en')); await page.waitForTimeout(150); const escaped = await snap('escape-survives-reflow'); assert.equal(escaped.focus, ids[2]); assert.equal(escaped.target, null); assert.equal(escaped.poolTarget, null);
  await context.tracing.stop({ path: out + 'browser-trace.zip' }); await context.close();
  for (const width of phase === 'quick' ? [] : [320, 390, 768, 1440, 1920]) for (const locale of ['vi', 'en']) for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion });
    page = await context.newPage(); await init(page, locale); await scroll();
    assert.equal(await page.evaluate(() => innerWidth), width, 'actual CSS viewport');
    for (const id of ids) { await position(id); await page.locator('[data-education-item="' + id + '"]').hover(); await page.waitForTimeout(reducedMotion === 'reduce' ? 120 : 1550); const record = await snap(width + '-' + locale + '-' + reducedMotion + '-' + id); assert.equal(record.poolTarget, id); assert.equal(record.goalError, 0); if (width === 390 && locale === 'vi' && reducedMotion === 'no-preference') await shot('390-' + id); }
    await shot(width + '-' + locale + '-' + reducedMotion); await context.close();
  }
  for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, reducedMotion });
    page = await context.newPage(); await init(page); await scroll();
    assert.equal(await page.evaluate(() => innerWidth), 390, 'actual touch CSS viewport');
    for (const id of ids) { await position(id); await page.locator('[data-education-item="' + id + '"]').tap(); await page.waitForTimeout(reducedMotion === 'reduce' ? 120 : 1600); assert.equal((await snap('touch-' + reducedMotion + '-' + id)).target, id); }
    await page.locator('[data-education-item="' + ids[2] + '"]').tap(); assert.equal((await snap('touch-toggle-' + reducedMotion)).target, null);
    await position(ids[1]); await page.locator('[data-education-item="' + ids[1] + '"]').tap(); await tapBackground(ids[1]); assert.equal((await snap('touch-background-' + reducedMotion)).target, null);
    await shot('touch-' + reducedMotion); await context.close();
  }
  assert.deepEqual(errors, []); status = 'pass'; console.log('PASS Education Browser', results.length, 'snapshots');
} catch (error) { status = 'fail'; console.error(error); throw error; }
finally { writeFileSync(out + 'browser-verification.json', JSON.stringify({ status, results, errors, warnings: [...new Set(warnings)] }, null, 2)); await browser.close(); }
