import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, edge, base, out, ready, scrollChapter, scene, capture, selectWork, openingObserver, openingSummary, save, sha } from './common.mjs';

const report = { started: new Date().toISOString(), base, assertions: 0, cases: [], motion: [], back: [], errors: [], warnings: [], requests: [], networkFailures: [], limits: ['Edge desktop GPU; touch/media/hidden are browser simulations. This script records visual evidence; human G1/G2 acceptance remains separate.'] };
const build = JSON.parse(fs.readFileSync(out + '/build-source.json', 'utf8'));
for (const [file, hash] of Object.entries(build.source)) assert.equal(sha(file), hash, 'Source changed after measured build: ' + file);
report.source = build.source;
const check = (value, message) => { report.assertions++; assert(value, message); };
const maxDifference = (a, b) => Math.max(...a.map((value, index) => Math.abs(value - b[index])));
const watch = page => {
  page.on('pageerror', error => report.errors.push(error.stack));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); if (message.type() === 'warning') report.warnings.push(message.text()); });
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) report.requests.push({ url: response.url(), status: response.status() }); });
  page.on('requestfailed', request => report.networkFailures.push({url:request.url(),error:request.failure()?.errorText}));
};
const browser = await chromium.launch({ executablePath: edge, headless: true });
report.browser = browser.version();
let page;
try {
  for (const [width, height] of [[320, 760], [390, 844], [768, 1024], [1440, 900], [1920, 1080]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 1024, serviceWorkers: 'block' });
    await openingObserver(context);
    page = await context.newPage(); watch(page);
    await page.goto(base); await ready(page); await page.waitForTimeout(750);
    const entry = { width, height, opening: await page.evaluate(() => openingQA), portal: [], meteor: [] };
    entry.openingSummary = openingSummary(entry.opening);
    report.cases.push(entry);
    let initial = await scene(page);
    check(initial.canvas === 1 && initial.overflow === 0 && !initial.manual, 'Native ready/one Canvas/no overflow ' + width);
    check(entry.opening.frames.some(frame => frame.loader), 'Opening loader observed ' + width);
    check(entry.opening.frames.at(-1).hero?.opacity > .95 && !entry.opening.frames.at(-1).locked, 'Opening releases complete Hero ' + width);
    check(entry.openingSummary.duration >= 1.6 && entry.openingSummary.duration <= 2, 'Cold presentation duration is separate from readiness delay');
    check(entry.openingSummary.revealFrames > 0 && entry.openingSummary.blankRevealFrames === 0 && entry.openingSummary.maximumRevealAlignmentPx < 3, 'Opening reveals aligned O without missing Hero');
    check(entry.openingSummary.minimumPhotonSizeRatio > .93 && entry.openingSummary.maximumPhotonSizeRatio < .99, 'Opening ring actually shrinks to the measured photon size');
    check(initial.yearBase.every(stroke => stroke.stroke === 'none' || +stroke.opacity === 0 || parseFloat(stroke.width) === 0), 'No permanent year contour ' + width);
    check(initial.year && initial.year.x >= -1 && initial.year.x + initial.year.width <= width + 1, 'Four-digit year fits ' + width);
    if (width >= 768) check(initial.year.width / initial.heading.width >= 1.23 && initial.year.width / initial.heading.width <= 1.37, 'Year hierarchy ' + width);
    if (initial.yearDurations.length) check(initial.yearDurations.every(duration => duration >= 10 && duration <= 14), 'Long slow year contour');
    entry.hero = initial; await capture(page, 'hero-' + width);
    if (width === 320 || width === 1440) {
      entry.yearCycle = [];
      for (const time of [4, 8, 12, 16]) {
        await page.waitForTimeout(4000); entry.yearCycle.push({ timeAfterReady: time, state: await scene(page) });
        await capture(page, 'hero-cycle-' + time + '-' + width);
      }
      await page.reload(); await ready(page); await page.waitForTimeout(750);
      entry.warmOpening = await page.evaluate(() => openingQA); entry.warmSummary = openingSummary(entry.warmOpening);
      check(entry.warmSummary.duration === .9 || entry.warmSummary.duration === 1.8, 'Reload selects adaptive duration rather than assuming fast resources');
      check(entry.warmSummary.revealFrames > 0 && entry.warmSummary.blankRevealFrames === 0 && entry.warmSummary.maximumRevealAlignmentPx < 3, 'Warm opening remains aligned');
      await capture(page, 'hero-warm-' + width);
    }
    for (const progress of [.10, .22, .34, .50, .90, .22, .34, .10, 0]) {
      await scrollChapter(page, 'portal', progress);
      const pose = await scene(page); check(pose.overflow === 0 && pose.canvas === 1 && pose.glError === 0, 'Portal actual pose ' + width + '/' + progress);
      if(progress>0 && progress<.44)check(pose.yearContours.opacity===0,'No original contour remains behind the absorbed year');
      check(pose.copies.focusable === 0, 'Intake copies never gain native focus targets');
      check(pose.copies.layers.every(layer => layer.inert && layer.ariaHidden === 'true' && layer.declared === layer.actual && layer.ribbons === layer.sources && layer.commonRibbons <= 1 && layer.identities === 0), 'Intake pool metadata/semantic isolation');
      check(pose.copies.count === initial.copies.count, 'Repeated portal pose does not allocate a second copy pool');
      entry.portal.push(pose); if ([.10, .22, .34, .50, .90].includes(progress) && entry.portal.length < 6) await capture(page, 'portal-' + progress + '-' + width);
    }
    for (const [a, b] of [[1, 5], [2, 6], [0, 7]]) check(maxDifference(entry.portal[a].camera, entry.portal[b].camera) < .03, 'Portal reverse camera returns ' + width);
    await scrollChapter(page, 'experience', .04);
    for (const progress of [.04, .15, .32, .50, .70, .92]) {
      await scrollChapter(page, 'experience', progress);
      const pose = await scene(page); check(pose.meteor.visible && pose.meteor.positions.every(Number.isFinite), 'Visible finite meteor ' + width + '/' + progress);
      check(pose.meteor.tailPixels / width > .39, 'Full authored tail present from entry ' + width + '/' + progress);
      if (width >= 768) check(pose.meteor.core >= 48 && pose.meteor.core <= 56 && pose.meteor.diameter >= 200, 'Large comet core/halo ' + width);
      entry.meteor.push(pose); await capture(page, 'meteor-' + progress + '-' + width);
    }
    await scrollChapter(page, 'experience', .50); const forward = await scene(page);
    for (const [chapter, progress] of [['departure', .6], ['experience', .1], ['departure', .3], ['experience', .5]]) await scrollChapter(page, chapter, progress);
    const reverse = await scene(page); check(maxDifference(forward.meteor.positions, reverse.meteor.positions) < .01, 'Analytic meteor reverse ' + width);
    await scrollChapter(page, 'departure', .6); entry.departure = await scene(page); await capture(page, 'departure-' + width);
    // Regression uses real semantic controls; no synthetic selection-store writer.
    await scrollChapter(page, 'skills', .2); await page.locator('[data-skill-tool="figma"]').hover(); await page.waitForTimeout(700); await capture(page, 'skills-regression-' + width);
    await scrollChapter(page, 'education', .04); await page.locator('[data-education-item="saigonUniversity"]').last().click(); await page.waitForTimeout(1000); await capture(page, 'education-regression-' + width);
    await page.keyboard.press('Escape'); await scrollChapter(page, 'works', .3); await selectWork(page, 'edura', width < 1024); await page.waitForTimeout(250); await capture(page, 'works-regression-' + width);
    if (width === 390 || width === 1440) {
      for (let cycle = 0; cycle < 3; cycle++) {
        await page.locator('#work-case-edura').click(); await page.waitForURL('**/projects/edura'); await page.waitForTimeout(450);
        check(await page.locator('canvas').count() === 0, 'Reader releases Canvas');
        await page.goBack(); await ready(page); await page.waitForFunction(() => document.activeElement.id === 'work-target-edura');
        const state = await scene(page), expected = await page.evaluate(() => history.state?.stellar?.snapshot);
        check(state.copies.count === initial.copies.count, 'Back remount does not retain old trail pools');
        check(state.canvas === 1 && state.chapter === 'works' && state.selection === 'edura' && state.active === 'work-target-edura', 'Reader Back restores real hotspot');
        check(expected && Math.abs(state.y - expected.y) < 1 && Math.abs(state.orbit.phase - expected.orbit.phase) < 1e-6, 'Back preserves captured scroll/orbit');
        report.back.push({ width, cycle, expected, state });
      }
      await capture(page, 'edura-back-' + width);
    }
    check((await scene(page)).overflow === 0, 'Regression overflow ' + width);
    await context.close(); save('browser-results.json', report);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  page = await context.newPage(); watch(page); await page.goto(base); await ready(page);
  for (let cycle = 0; cycle < 3; cycle++) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => !motionQA.smoother.get() && !motionQA.root.getState().scene.getObjectByName('story-meteor')?.visible);
    await page.waitForTimeout(1000); await scrollChapter(page, 'experience', .4);
    const reduced = await scene(page); check(!reduced.smoother && !reduced.meteor.visible && reduced.triggers === 0 && reduced.activeTimelines.every(item => !item.active) && reduced.copies.count === 0, 'Reduced static/no hidden year ticker or trail pool');
    await page.waitForTimeout(250); check(maxDifference(reduced.camera, (await scene(page)).camera) === 0, 'Reduced camera holds');
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(1000); await scrollChapter(page, 'experience', .4);
    await page.waitForFunction(() => motionQA.smoother.get() && motionQA.root.getState().scene.getObjectByName('story-meteor')?.visible, undefined, {timeout:2000});
    const normal = await scene(page); check(normal.smoother && normal.meteor.visible, 'Live preference restores scene after layout refresh');
    const hidden = await page.evaluate(async () => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(resolve => setTimeout(resolve, 100)); const root = motionQA.root.getState(), before = root.gl.info.render.frame, loop = root.frameloop;
      await new Promise(resolve => setTimeout(resolve, 250)); const after = root.gl.info.render.frame;
      delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); return { before, after, loop };
    });
    check(hidden.before === hidden.after && hidden.loop === 'never', 'Hidden stops actual render passes'); report.motion.push({ cycle, reduced, normal, hidden });
  }
  await capture(page, 'motion-resumed'); await context.close();
  check(report.errors.length === 0 && report.requests.length === 0, 'No console/page/404 errors'); report.status = 'pass';
} catch (error) {
  report.status = 'fail'; report.failure = error.stack;
  if (page && !page.isClosed()) await capture(page, 'failure').catch(() => {});
  console.error(error.stack);
} finally { save('browser-results.json', report); await browser.close(); }
console.log(JSON.stringify({ status: report.status, assertions: report.assertions, viewports: report.cases.length, back: report.back.length, motion: report.motion.length, failure: report.failure }));
if (report.status !== 'pass') process.exitCode = 1;
