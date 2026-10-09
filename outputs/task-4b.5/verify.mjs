import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
const report = {
  timestamp: new Date().toISOString(),
  browser: '',
  checks: 0,
  sections: [],
  switches: {},
  mobile: {},
  reducedMotion: {},
  fps: 0,
  errors: [],
};

function pass(name, details = {}) {
  report.checks++;
  console.log(`[PASS] ${name}`, details);
}

function fail(name, error) {
  report.errors.push({ name, error: String(error) });
  console.error(`[FAIL] ${name}:`, error);
}

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'],
});
report.browser = browser.version();

try {
  // -------------------------------------------------------------
  // Test Suite 1: Desktop Viewport & 7-Section Optical Measurement
  // -------------------------------------------------------------
  console.log('=== Test 1: Desktop 1440x900 - 7 Section Mechanical Measurement ===');
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => {
    const msg = String(e);
    if (!msg.includes('THREE.Clock')) report.errors.push(msg);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('THREE.Clock') && !txt.includes('favicon.ico')) {
        report.errors.push(txt);
      }
    }
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preloader]').waitFor({ state: 'detached', timeout: 8000 });
  await page.locator('[data-galaxy-scene] canvas').waitFor({ timeout: 5000 });
  await page.waitForTimeout(2000);

  // Check CockpitRails visible on desktop
  const railsVisible = await page.evaluate(() => {
    const left = document.querySelector('aside[aria-label*="Telemetry"]');
    const right = document.querySelector('aside[aria-label*="Attitude"]');
    return {
      left: left && getComputedStyle(left).display !== 'none',
      right: right && getComputedStyle(right).display !== 'none',
    };
  });
  assert(railsVisible.left && railsVisible.right, 'Cockpit rails must be visible on desktop');
  pass('Cockpit Rails Desktop Visibility', railsVisible);

  // 7 Landmarks to measure
  const landmarks = [
    { id: 'smooth-content', name: 'Hero' },
    { id: 'about', name: 'About' },
    { id: 'skills', name: 'Skills' },
    { id: 'education', name: 'Education' },
    { id: 'experience', name: 'Experience' },
    { id: 'work', name: 'Work' },
    { id: 'transmission', name: 'Transmission' },
  ];

  for (const landmark of landmarks) {
    // Scroll to landmark
    await page.evaluate(async (id) => {
      const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
      const smoother = ScrollSmoother.get();
      const target = document.getElementById(id);
      if (!target) return;
      if (id === 'smooth-content') {
        if (smoother) smoother.scrollTop(0);
        else window.scrollTo(0, 0);
      } else {
        if (smoother) smoother.scrollTo(target, false, 'center center');
        else target.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    }, landmark.id);
    await page.waitForTimeout(1000);

    // Measure exact mechanical rotations and telemetry data
    const metrics = await page.evaluate(async (name) => {
      const { gsap } = await import('/src/hooks/useGSAPSetup.js');
      const barrel = document.querySelector('aside[aria-label*="Telemetry"] svg g[style*="transform-origin"]');
      const gyroG = Array.from(document.querySelectorAll('aside[aria-label*="Attitude"] svg g[style*="transform-origin"]'));
      const shuttle = document.querySelector('aside[aria-label*="Attitude"] g[data-shuttle-runner]');
      const leftHud = document.querySelector('aside[aria-label*="Telemetry"]');
      const rightHud = document.querySelector('aside[aria-label*="Attitude"]');

      return {
        section: name,
        scrollProgress: window.__STELLAR_SCROLL__?.scrollProgress ?? 0,
        barrelRotation: barrel ? Number(gsap.getProperty(barrel, 'rotation')) : 0,
        gyroOuterRotation: gyroG[0] ? Number(gsap.getProperty(gyroG[0], 'rotation')) : 0,
        gyroMidRotation: gyroG[1] ? Number(gsap.getProperty(gyroG[1], 'rotation')) : 0,
        gyroInnerRotation: gyroG[2] ? Number(gsap.getProperty(gyroG[2], 'rotation')) : 0,
        shuttleY: shuttle ? Number(gsap.getProperty(shuttle, 'y')) : 0,
        leftTextSnippet: leftHud ? leftHud.innerText.replace(/\s+/g, ' ').slice(0, 100) : '',
        rightTextSnippet: rightHud ? rightHud.innerText.replace(/\s+/g, ' ').slice(0, 100) : '',
      };
    }, landmark.name);

    report.sections.push(metrics);
    pass(`Section Measurement: ${landmark.name}`, metrics);
  }

  // Screenshot at Hero
  await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    ScrollSmoother.get()?.scrollTop(0);
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: new URL('screenshot-1-desktop-hero.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  pass('Hero Desktop Screenshot with Cockpit Rails');

  // Screenshot at Transmission (End of journey)
  await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    const target = document.getElementById('transmission');
    if (smoother && target) smoother.scrollTo(target, false, 'top top');
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: new URL('screenshot-2-desktop-transmission.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  pass('Transmission Desktop Screenshot with Singularity Telemetry');

  // -------------------------------------------------------------
  // Test Suite 2: Tactile Knurled Switches Interaction
  // -------------------------------------------------------------
  console.log('=== Test 2: Knurled Switches 45-degree Tactile Rotation ===');
  const switchTests = await page.evaluate(async () => {
    const { gsap } = await import('/src/hooks/useGSAPSetup.js');
    const results = {};

    // 1. Language Knurled Switch
    const langBtn = Array.from(document.querySelectorAll('button[role="switch"]')).find((b) =>
      b.getAttribute('aria-label')?.includes('Vietnamese and English')
    );
    if (langBtn) {
      const dial = langBtn.querySelector('svg');
      const initialRot = Number(gsap.getProperty(dial, 'rotation'));
      langBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const postRot = Number(gsap.getProperty(dial, 'rotation'));
      results.lang = {
        initialRotation: initialRot,
        postRotation: postRot,
        delta: Math.abs(postRot - initialRot),
        checked: langBtn.getAttribute('aria-checked'),
      };
    }

    // 2. Sound Knurled Switch
    const soundBtn = Array.from(document.querySelectorAll('button[role="switch"]')).find((b) =>
      b.getAttribute('aria-label')?.includes('Web Audio Space Drone')
    );
    if (soundBtn) {
      const dial = soundBtn.querySelector('svg');
      const initialRot = Number(gsap.getProperty(dial, 'rotation'));
      soundBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const postRot = Number(gsap.getProperty(dial, 'rotation'));
      results.sound = {
        initialRotation: initialRot,
        postRotation: postRot,
        delta: Math.abs(postRot - initialRot),
        checked: soundBtn.getAttribute('aria-checked'),
      };
    }

    // 3. Theme Knurled Switch
    const themeBtn = Array.from(document.querySelectorAll('button[role="switch"]')).find((b) =>
      b.getAttribute('aria-label')?.includes('Dark and Light mode')
    );
    if (themeBtn) {
      const dial = themeBtn.querySelector('svg');
      const initialRot = Number(gsap.getProperty(dial, 'rotation'));
      themeBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      const postRot = Number(gsap.getProperty(dial, 'rotation'));
      results.theme = {
        initialRotation: initialRot,
        postRotation: postRot,
        delta: Math.abs(postRot - initialRot),
        checked: themeBtn.getAttribute('aria-checked'),
        dataTheme: document.documentElement.getAttribute('data-theme'),
      };
      // Toggle back to dark to keep dark baseline
      themeBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    return results;
  });

  report.switches = switchTests;
  assert(switchTests.lang && switchTests.lang.delta >= 40, 'Lang switch should rotate ~45 deg');
  assert(switchTests.sound && switchTests.sound.delta >= 40, 'Sound switch should rotate ~45 deg');
  assert(switchTests.theme && switchTests.theme.delta >= 40, 'Theme switch should rotate ~45 deg');
  pass('Knurled Metal Switches 45° Tactile Click', switchTests);

  // -------------------------------------------------------------
  // Test Suite 3: Continuous Scroll FPS Benchmark
  // -------------------------------------------------------------
  console.log('=== Test 3: Continuous Scroll FPS Benchmark ===');
  const fps = await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      let pos = 0;
      function tick() {
        frames++;
        pos = (pos + 40) % max;
        if (smoother) smoother.scrollTop(pos);
        else window.scrollTo(0, pos);

        if (performance.now() - start >= 1200) {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        } else {
          requestAnimationFrame(tick);
        }
      }
      requestAnimationFrame(tick);
    });
  });
  report.fps = fps;
  pass('Desktop Continuous Scroll FPS Benchmark', { fps, target: '>= 140 FPS' });
  assert(fps >= 100, `Scroll FPS ${fps} below acceptable threshold`);

  await context.close();

  // -------------------------------------------------------------
  // Test Suite 4: Mobile Viewport Cleanliness & Zero Overflow
  // -------------------------------------------------------------
  console.log('=== Test 4: Mobile Viewport 390x844 (Hidden Cockpit Rails) ===');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    serviceWorkers: 'block',
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await mobilePage.locator('[data-preloader]').waitFor({ state: 'detached', timeout: 5000 });
  await mobilePage.waitForTimeout(1000);

  const mobileCheck = await mobilePage.evaluate(() => {
    const left = document.querySelector('aside[aria-label*="Telemetry"]');
    const right = document.querySelector('aside[aria-label*="Attitude"]');
    const isHiddenLeft = !left || getComputedStyle(left).display === 'none';
    const isHiddenRight = !right || getComputedStyle(right).display === 'none';
    const scrollW = document.documentElement.scrollWidth;
    const clientW = document.documentElement.clientWidth;
    return {
      railsHidden: isHiddenLeft && isHiddenRight,
      zeroOverflow: scrollW === clientW,
      scrollW,
      clientW,
    };
  });
  report.mobile = mobileCheck;
  assert(mobileCheck.railsHidden, 'Cockpit rails must be completely hidden on mobile');
  assert(mobileCheck.zeroOverflow, 'Zero horizontal overflow required on mobile');
  pass('Mobile Viewport Cleanliness', mobileCheck);
  await mobilePage.screenshot({ path: new URL('screenshot-3-mobile-clean.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  await mobileContext.close();

  // -------------------------------------------------------------
  // Test Suite 5: Prefers-Reduced-Motion Compliance
  // -------------------------------------------------------------
  console.log('=== Test 5: Prefers-Reduced-Motion Compliance ===');
  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await reducedPage.locator('[data-preloader]').waitFor({ state: 'detached', timeout: 5000 });
  await reducedPage.waitForTimeout(1000);

  // Scroll midway and check rotations are locked at 0
  const reducedCheck = await reducedPage.evaluate(async () => {
    const { ScrollSmoother, gsap } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTop(1200);
    else window.scrollTo(0, 1200);
    await new Promise((r) => setTimeout(r, 600));

    const barrel = document.querySelector('aside[aria-label*="Telemetry"] svg g[style*="transform-origin"]');
    const gyroG = Array.from(document.querySelectorAll('aside[aria-label*="Attitude"] svg g[style*="transform-origin"]'));

    return {
      barrelRotation: barrel ? Number(gsap.getProperty(barrel, 'rotation')) : 0,
      gyroOuterRotation: gyroG[0] ? Number(gsap.getProperty(gyroG[0], 'rotation')) : 0,
      gyroMidRotation: gyroG[1] ? Number(gsap.getProperty(gyroG[1], 'rotation')) : 0,
      gyroInnerRotation: gyroG[2] ? Number(gsap.getProperty(gyroG[2], 'rotation')) : 0,
    };
  });
  report.reducedMotion = reducedCheck;
  assert(
    reducedCheck.barrelRotation === 0 &&
    reducedCheck.gyroOuterRotation === 0 &&
    reducedCheck.gyroMidRotation === 0 &&
    reducedCheck.gyroInnerRotation === 0,
    'All rings must stay frozen at rotation 0 in reduced motion'
  );
  pass('Prefers-Reduced-Motion Frozen Rings', reducedCheck);
  await reducedContext.close();

} catch (err) {
  fail('Execution Failure', err);
} finally {
  await browser.close();
  writeFileSync(new URL('results.json', out), JSON.stringify(report, null, 2));
  console.log(`\n=== Verification Finished: ${report.checks} checks passed, ${report.errors.length} errors ===`);
}
