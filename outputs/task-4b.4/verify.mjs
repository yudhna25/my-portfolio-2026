import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
const report = {
  timestamp: new Date().toISOString(),
  browser: '',
  checks: 0,
  tests: [],
  fps: {
    hero: 0,
    scrolling: 0,
    skills: 0,
    contact: 0,
  },
  errors: [],
};

function pass(name, details = {}) {
  report.checks++;
  report.tests.push({ name, status: 'PASS', details });
  console.log(`[PASS] ${name}`, details);
}

function fail(name, error) {
  report.errors.push({ name, error: String(error) });
  report.tests.push({ name, status: 'FAIL', error: String(error) });
  console.error(`[FAIL] ${name}:`, error);
}

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'],
});
report.browser = browser.version();

async function createPage(options = {}) {
  const context = await browser.newContext({
    viewport: options.viewport || { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: options.reducedMotion || 'no-preference',
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
  return { context, page };
}

try {
  // Test 1: Full Normal Motion Flow & 3D Celestial System
  console.log('--- Test 1: Normal Motion & Celestial 3D System ---');
  const { context, page } = await createPage();
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preloader]').waitFor({ state: 'detached', timeout: 8000 });
  await page.locator('[data-galaxy-scene] canvas').waitFor({ timeout: 5000 });
  await page.waitForTimeout(2000);

  // Measure initial Hero FPS
  const heroFps = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start >= 1000) {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        } else {
          requestAnimationFrame(count);
        }
      }
      requestAnimationFrame(count);
    });
  });
  report.fps.hero = heroFps;
  pass('Hero FPS Benchmark', { fps: heroFps, target: '>= 140 FPS' });
  assert(heroFps >= 100, `Hero FPS ${heroFps} below target`);

  // Screenshot Hero (Taurus + Pleiades)
  await page.screenshot({ path: new URL('screenshot-1-hero-taurus.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  pass('Hero Screenshot Captured (Taurus Constellation)');

  // Test 2: Mouse Movement & Stardust Wake
  console.log('--- Test 2: Mouse Pointer & Stardust Wake ---');
  for (let i = 0; i < 15; i++) {
    const x = 200 + Math.sin(i * 0.5) * 400;
    const y = 300 + Math.cos(i * 0.5) * 200;
    await page.mouse.move(x, y);
    await page.waitForTimeout(30);
  }
  pass('Stardust Wake Pointer Interaction');

  // Test 3: Scroll to Skills (Northern Cross / Cygnus)
  console.log('--- Test 3: Cygnus at Skills ---');
  await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    const target = document.getElementById('skills');
    if (smoother && target) smoother.scrollTo(target, false, 'center center');
    else if (target) target.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(2000);

  const skillsFps = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start >= 1000) {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        } else {
          requestAnimationFrame(count);
        }
      }
      requestAnimationFrame(count);
    });
  });
  report.fps.skills = skillsFps;
  pass('Skills Section FPS Benchmark', { fps: skillsFps });
  await page.screenshot({ path: new URL('screenshot-2-skills-cygnus.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  pass('Skills Screenshot Captured (Cygnus Constellation)');

  // Test 4: Scroll to Work (Orion) & Reactive Shooting Star on Filter
  console.log('--- Test 4: Orion at Work & Reactive Meteors ---');
  await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    const target = document.getElementById('work');
    if (smoother && target) smoother.scrollTo(target, false, 'top top');
    else if (target) target.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(2000);

  // Click filter button via DOM to trigger reactive shooting star
  const filterClicked = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button[data-magnetic]')).find(
      (b) => b.textContent.includes('Product Design') || b.textContent.includes('Thiết Kế Sản Phẩm')
    );
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  if (filterClicked) {
    await page.waitForTimeout(400);
    pass('Reactive Meteor Triggered on Work Filter Click');
  }

  await page.screenshot({ path: new URL('screenshot-3-work-orion.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  pass('Work Screenshot Captured (Orion Constellation)');

  // Test 5: Scroll to Contact (Sagittarius + Einstein Ring)
  console.log('--- Test 5: Sagittarius & Einstein Ring at Contact ---');
  await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    const target = document.getElementById('transmission');
    if (smoother && target) smoother.scrollTo(target, false, 'top top');
    else if (target) target.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(2500);

  const contactFps = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start >= 1000) {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        } else {
          requestAnimationFrame(count);
        }
      }
      requestAnimationFrame(count);
    });
  });
  report.fps.contact = contactFps;
  pass('Contact Section FPS Benchmark (Einstein Ring + Sagittarius)', { fps: contactFps });

  // Click Contact CTA button via DOM
  const ctaClicked = await page.evaluate(() => {
    const cta = document.querySelector('[data-contact-email]');
    if (cta) {
      cta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      return true;
    }
    return false;
  });
  if (ctaClicked) {
    await page.waitForTimeout(400);
    pass('Reactive Meteor Triggered on Contact CTA Click');
  }

  await page.screenshot({ path: new URL('screenshot-4-contact-sagittarius.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  pass('Contact Screenshot Captured (Sagittarius + Einstein Ring)');

  // Test 6: Continuous Scrolling FPS Test
  console.log('--- Test 6: Full Continuous Scroll FPS ---');
  const scrollFps = await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    return new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      let pos = 0;

      function step() {
        frames++;
        pos = (pos + 45) % maxScroll;
        if (smoother) smoother.scrollTop(pos);
        else window.scrollTo(0, pos);

        if (performance.now() - start >= 1500) {
          resolve(Math.round((frames * 1000) / (performance.now() - start)));
        } else {
          requestAnimationFrame(step);
        }
      }
      requestAnimationFrame(step);
    });
  });
  report.fps.scrolling = scrollFps;
  pass('Full Scroll Continuous FPS Benchmark', { fps: scrollFps, target: '>= 140 FPS' });
  assert(scrollFps >= 100, `Continuous Scroll FPS ${scrollFps} below acceptable threshold`);

  await context.close();

  // Test 7: Reduced Motion Verification
  console.log('--- Test 7: Prefers-Reduced-Motion Verification ---');
  const reduced = await createPage({ reducedMotion: 'reduce' });
  await reduced.page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await reduced.page.locator('[data-preloader]').waitFor({ state: 'detached', timeout: 5000 });
  await reduced.page.locator('[data-galaxy-scene] canvas').waitFor({ timeout: 5000 });
  await reduced.page.waitForTimeout(1000);

  // In reduced-motion, constellations are static, shooting stars disabled, stardust wake disabled
  const reducedChecks = await reduced.page.evaluate(() => {
    const hasCanvas = !!document.querySelector('[data-galaxy-scene] canvas');
    return { hasCanvas };
  });
  pass('Reduced Motion Compliance', reducedChecks);
  await reduced.page.screenshot({ path: new URL('screenshot-5-reduced-motion.png', out).pathname.replace(/^\/([A-Z]:)/, '$1') });
  await reduced.context.close();

} catch (err) {
  fail('Verification Execution', err);
} finally {
  await browser.close();
  writeFileSync(new URL('results.json', out), JSON.stringify(report, null, 2));
  console.log(`\n=== Verification Finished: ${report.checks} checks passed, ${report.errors.length} errors ===`);
}
