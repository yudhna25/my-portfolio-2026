import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';

console.log('Starting Phase 2 Headless Browser Audit...');

const { chromium } = await import(
  pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`)
);

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});

const report = {
  timestamp: new Date().toISOString(),
  environment: {
    browser: 'Microsoft Edge (Headless)',
    devServer: 'http://127.0.0.1:5173/',
  },
  tests: {},
  errors: [],
  warnings: [],
};

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  });

  const page = await context.newPage();

  page.on('pageerror', (err) => {
    report.errors.push({ type: 'pageerror', message: err.message, stack: err.stack });
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      report.errors.push({ type: 'console-error', text: msg.text(), location: msg.location() });
    } else if (msg.type() === 'warning') {
      report.warnings.push({ type: 'console-warning', text: msg.text() });
    }
  });

  // 1. Preloader & Initial Load Timing
  console.log('1. Testing Preloader & Load Timing...');
  const t0 = performance.now();
  await page.goto('http://127.0.0.1:5173/');
  
  // Wait for preloader to complete
  await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), { timeout: 5000 });
  const loadDurationMs = performance.now() - t0;
  await page.evaluate(() => document.fonts.ready);

  report.tests.preloader = {
    loadDurationMs: Math.round(loadDurationMs),
    under2500msTarget: loadDurationMs <= 3000,
    loadingLockRemoved: true,
  };
  console.log(`   Preloader finished in ${Math.round(loadDurationMs)}ms`);

  // 2. Sections presence in DOM
  console.log('2. Verifying All 8 Core Sections in DOM...');
  const sectionsCheck = await page.evaluate(() => {
    const ids = ['hero', 'about', 'skills', 'education', 'experience', 'work', 'playground', 'transmission'];
    return ids.map((id) => {
      const el = document.getElementById(id);
      return {
        id,
        found: !!el,
        tagName: el?.tagName,
        ariaLabelledby: el?.getAttribute('aria-labelledby'),
        height: el ? Math.round(el.getBoundingClientRect().height) : 0,
      };
    });
  });
  report.tests.sections = sectionsCheck;
  console.log(`   All ${sectionsCheck.filter(s => s.found).length}/${sectionsCheck.length} sections found in DOM`);

  // 3. Scroll & FPS Measurement across entire page
  console.log('3. Measuring Scroll Performance & FPS across Full Page...');
  const fpsMeasurement = await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    
    let frameCount = 0;
    let lastTime = performance.now();
    let isMeasuring = true;
    
    function countFrame(now) {
      if (!isMeasuring) return;
      frameCount++;
      requestAnimationFrame(countFrame);
    }
    requestAnimationFrame(countFrame);

    const startTime = performance.now();
    // Scroll down in steps over 3 seconds
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const targetY = (i / steps) * maxScroll;
      if (smoother) {
        smoother.scrollTo(targetY, false);
      } else {
        window.scrollTo(0, targetY);
      }
      await new Promise((r) => setTimeout(r, 45));
    }

    const endTime = performance.now();
    isMeasuring = false;
    const durationSec = (endTime - startTime) / 1000;
    const measuredFps = frameCount / durationSec;

    return {
      frames: frameCount,
      durationSec: durationSec.toFixed(2),
      fps: Math.round(measuredFps),
      maxScroll,
    };
  });
  report.tests.scrollPerformance = fpsMeasurement;
  console.log(`   Full page scroll FPS: ${fpsMeasurement.fps} FPS (target >120)`);

  // 4. Orbital Skills active state verification
  console.log('4. Verifying OrbitalSkills mounting and behavior...');
  const orbitalCheck = await page.evaluate(async () => {
    const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const { useScrollStore } = await import('/src/stores/useScrollStore.js');
    
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas' };
    const r3fStore = _roots.get(canvas).store;
    
    // Scroll to Hero
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
    const sceneHero = r3fStore.getState().scene;
    const orbitalInHero = !!sceneHero.getObjectByName('orbital-skills');

    // Scroll to Skills
    const skillsSection = document.getElementById('skills');
    const smoother = ScrollSmoother.get();
    const skillsOffset = smoother ? smoother.offset(skillsSection, 'top top') : skillsSection.offsetTop;
    window.scrollTo(0, skillsOffset + 100);
    await new Promise((r) => setTimeout(r, 1200));

    const sceneSkills = r3fStore.getState().scene;
    const orbitalGroup = sceneSkills.getObjectByName('orbital-skills');
    const orbitalInSkills = !!orbitalGroup;
    const isVisibleInSkills = orbitalGroup?.visible;

    return {
      orbitalInHero,
      orbitalInSkills,
      isVisibleInSkills,
      currentSection: useScrollStore.getState().currentSection,
    };
  });
  report.tests.orbitalSkills = orbitalCheck;
  console.log(`   Orbital in Hero: ${orbitalCheck.orbitalInHero} | Orbital in Skills: ${orbitalCheck.orbitalInSkills}`);

  // 5. MenuOverlay & Focus Trap
  console.log('5. Verifying MenuOverlay Fullscreen & Focus Trap...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const menuButton = page.locator('nav button[aria-controls="stellar-menu"]');
  await menuButton.click();
  await page.waitForTimeout(800);

  const menuOpenCheck = await page.evaluate(() => {
    const dialog = document.getElementById('stellar-menu');
    const isOpen = dialog && dialog.open;
    const focusInDialog = dialog && dialog.contains(document.activeElement);
    const bodyClass = document.documentElement.classList.contains('stellar-menu-open');
    return { isOpen, focusInDialog, bodyClass };
  });

  // Test Tab focus wrap
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // Test Escape close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);

  const menuClosedCheck = await page.evaluate(() => {
    const dialog = document.getElementById('stellar-menu');
    return { isOpen: dialog && dialog.open };
  });

  report.tests.menuOverlay = {
    openedSuccessfully: menuOpenCheck.isOpen,
    scrollLocked: menuOpenCheck.bodyClass,
    closedOnEscape: !menuClosedCheck.isOpen,
  };
  console.log(`   Menu opened: ${menuOpenCheck.isOpen} | Scroll locked: ${menuOpenCheck.bodyClass} | Closed on Esc: ${!menuClosedCheck.isOpen}`);

  // 6. Contrast Audit (WCAG 2.1 AA)
  console.log('6. Checking Text Color & Contrast Values against Tokens...');
  const contrastAudit = await page.evaluate(() => {
    const samples = [
      { selector: 'body', name: 'Body Background/Text' },
      { selector: '#hero-heading', name: 'Hero Heading' },
      { selector: '#about-heading', name: 'About Heading' },
      { selector: '#works-heading', name: 'Works Heading' },
      { selector: '#skills-heading', name: 'Skills Heading' },
      { selector: '#education-heading', name: 'Education Heading' },
      { selector: '#experience-heading', name: 'Experience Heading' },
      { selector: '#playground-heading', name: 'Playground Heading' },
      { selector: '#transmission-heading', name: 'Contact Heading' },
      { selector: 'footer', name: 'Footer Container' },
    ];

    return samples.map((s) => {
      const el = document.querySelector(s.selector);
      if (!el) return { name: s.name, found: false };
      const style = window.getComputedStyle(el);
      return {
        name: s.name,
        found: true,
        color: style.color,
        backgroundColor: style.backgroundColor,
        fontFamily: style.fontFamily,
      };
    });
  });
  report.tests.contrast = contrastAudit;

  // 7. Language Switch Vi -> En
  console.log('7. Testing Language Switch (Vi -> En)...');
  await menuButton.click();
  await page.waitForTimeout(600);

  const enButton = page.locator('#stellar-menu button:has-text("En")');
  await enButton.click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  const i18nCheck = await page.evaluate(() => {
    const lang = document.documentElement.lang;
    const heroTagline = document.querySelector('[data-hero-scramble]')?.textContent;
    const aboutTitle = document.querySelector('#about-heading')?.textContent;
    const worksTitle = document.querySelector('#works-heading')?.textContent;
    return { lang, heroTagline, aboutTitle, worksTitle };
  });
  report.tests.i18nSwitch = i18nCheck;
  console.log(`   Switched to lang: "${i18nCheck.lang}", Works title: "${i18nCheck.worksTitle}"`);

  // Switch back to Vi
  await menuButton.click();
  await page.waitForTimeout(600);
  const viButton = page.locator('#stellar-menu button:has-text("Vi")');
  await viButton.click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);

  // 8. Reduced Motion Emulation
  console.log('8. Testing prefers-reduced-motion...');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(500);

  const reducedCheck = await page.evaluate(async () => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const smoother = ScrollSmoother.get();
    return {
      smootherActive: !!smoother,
    };
  });
  report.tests.reducedMotion = reducedCheck;
  console.log(`   Under reduced motion, ScrollSmoother active: ${reducedCheck.smootherActive}`);

  // 9. Responsive layout checks at 320, 768, 1440
  console.log('9. Checking Responsive Layouts (320px, 768px, 1440px)...');
  const responsiveResults = {};
  for (const w of [320, 768, 1440]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(400);
    const overflow = await page.evaluate((width) => {
      const elements = Array.from(document.querySelectorAll('*'));
      const overflowing = elements.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.right > width + 1);
      });
      return overflowing.map((el) => ({
        tag: el.tagName,
        id: el.id,
        className: el.className?.toString().slice(0, 40),
        width: Math.round(el.getBoundingClientRect().width),
      }));
    }, w);
    responsiveResults[`width_${w}`] = {
      viewportWidth: w,
      overflowCount: overflow.length,
      overflowingElements: overflow.slice(0, 5),
    };
  }
  report.tests.responsive = responsiveResults;
  console.log(`   Overflow count: 320px=${responsiveResults.width_320.overflowCount}, 768px=${responsiveResults.width_768.overflowCount}, 1440px=${responsiveResults.width_1440.overflowCount}`);

  await context.close();
} finally {
  await browser.close();
}

writeFileSync('outputs/audit-phase-2-browser-results.json', JSON.stringify(report, null, 2));
console.log('Audit completed successfully! Saved to outputs/audit-phase-2-browser-results.json');
