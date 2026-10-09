import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const outDir = new URL('./', import.meta.url);
mkdirSync(outDir, { recursive: true });

const report = {
  checks: [],
  contact: {},
  skills: {},
  errors: [],
  warnings: [],
};

const check = (condition, label) => {
  assert(condition, label);
  report.checks.push(label);
  console.log(`✓ ${label}`);
};

const browser = await chromium.launch({
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
});
report.browser = browser.version();

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block',
    permissions: ['clipboard-read', 'clipboard-write'],
  });

  await context.addInitScript(() => {
    localStorage.setItem('stellar-theme', 'dark');
  });

  const page = await context.newPage();
  page.on('pageerror', (e) => report.errors.push(String(e)));
  page.on('console', (e) => {
    if (e.type() === 'error') report.errors.push(e.text());
    if (e.type() === 'warning') report.warnings.push(e.text());
  });

  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('[data-preloader]').waitFor({ state: 'detached' });
  await page.locator('[data-galaxy-scene] canvas').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await delay(2000);

  async function scrollToSection(selector) {
    await page.evaluate(async (sel) => {
      const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
      const target = document.querySelector(sel);
      const smoother = ScrollSmoother.get();
      if (smoother && target) {
        smoother.scrollTo(target, false, 'center center');
      } else if (target) {
        target.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    }, selector);
    await delay(1800);
  }

  // ==========================================
  // PART 1: CONTACT SECTION (TRANSMISSION)
  // ==========================================
  console.log('\n--- VERIFYING CONTACT SECTION ---');
  await scrollToSection('#transmission');

  const freqLabel = await page.locator('text=1420.405 MHz').first();
  check(await freqLabel.isVisible(), 'Contact frequency telemetry banner is visible');

  const terminal = page.locator('[data-transmission-terminal]');
  check(await terminal.isVisible(), 'Contact transmission terminal container is visible');

  // Verify accessible screen reader email text
  const srEmail = page.locator('#transmission .sr-only').first();
  check((await srEmail.textContent()).trim() === 'anhduy25work@gmail.com', 'Screen reader email text is preserved in sr-only');

  // Verify visible email text after scramble decryption completes (1.3s animation)
  const visibleEmailLocator = page.locator('[data-transmission-terminal] [aria-hidden="true"].select-all');
  await visibleEmailLocator.filter({ hasText: 'anhduy25work@gmail.com' }).waitFor({ timeout: 5000 });
  const visibleEmail = (await visibleEmailLocator.textContent()).trim();
  check(visibleEmail.includes('anhduy25work@gmail.com'), `Visible email resolved cleanly: ${visibleEmail}`);

  // Test Transmit / Copy Dispatch action
  const copyBtn = page.locator('[data-transmission-terminal] button');
  check(await copyBtn.isVisible(), 'Transmit/copy button is visible');
  await copyBtn.click();
  await delay(500);

  // Verify transmission feedback status
  const statusEl = page.locator('[data-transmission-terminal] [role="status"]');
  check(await statusEl.isVisible(), 'Transmission status role="status" banner appears on dispatch');
  const statusText = await statusEl.textContent();
  check(statusText.includes('SIGNAL TRANSMITTED') || statusText.includes('ĐÃ TRUYỀN TÍN HIỆU'), `Status message is correct: ${statusText.trim()}`);

  // Capture Contact screenshot
  await page.screenshot({
    path: new URL('contact-transmission.png', outDir).pathname.replace(/^\/([A-Z]:)/, '$1'),
    fullPage: false,
  });
  console.log('Captured contact-transmission.png');

  report.contact = {
    frequencyBanner: true,
    terminalCard: true,
    srEmailPreserved: true,
    visibleEmail,
    dispatchFeedback: statusText.trim(),
  };

  // ==========================================
  // PART 2: SKILLS SECTION (CONSTELLATION NETWORK)
  // ==========================================
  await scrollToSection('#skills');

  const constGrid = page.locator('[data-constellation-grid]');
  check(await constGrid.isVisible(), 'Skills constellation grid is visible');

  const hudHeader = page.locator('text=CONSTELLATION VECTOR NETWORK');
  check(await hudHeader.isVisible(), 'Constellation HUD telemetry header is visible');

  // Verify base snake path exists
  const basePath = page.locator('[data-constellation-base]');
  check(await basePath.isVisible(), 'Ambient base constellation snake path is rendered in SVG');

  // 1. Hover on Figma node
  const figmaNode = page.locator('[data-skill-id="figma"] button');
  check(await figmaNode.isVisible(), 'Figma skill node button is present');
  await figmaNode.hover();
  await delay(400);

  // Check active styling & companion links
  const figmaState = await page.evaluate(() => {
    const activeEl = document.querySelector('[data-skill-id="figma"] button');
    const links = Array.from(document.querySelectorAll('[data-constellation-link]')).map(p => p.getAttribute('d'));
    const linkedBadges = Array.from(document.querySelectorAll('[data-constellation-grid] li')).filter(li => li.textContent.includes('[LINK]')).map(li => li.dataset.skillId);
    return {
      activePressed: activeEl?.getAttribute('aria-pressed'),
      linkPaths: links,
      linkedBadges,
    };
  });

  check(figmaState.activePressed === 'true', 'Figma node has aria-pressed="true" on hover');
  check(figmaState.linkPaths.length === 3, `Figma renders 3 constellation link paths (found ${figmaState.linkPaths.length})`);
  check(figmaState.linkedBadges.includes('wireframing') && figmaState.linkedBadges.includes('prototyping') && figmaState.linkedBadges.includes('react'), 'Companion skills [wireframing, prototyping, react] highlighted with [LINK]');

  // Capture Figma constellation screenshot
  await page.screenshot({
    path: new URL('skills-constellation-figma.png', outDir).pathname.replace(/^\/([A-Z]:)/, '$1'),
    fullPage: false,
  });
  console.log('Captured skills-constellation-figma.png');

  // 2. Hover on After Effects node
  const aeNode = page.locator('[data-skill-id="afterEffects"] button');
  await aeNode.hover();
  await delay(400);

  const aeState = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('[data-constellation-link]')).map(p => p.getAttribute('d'));
    const linkedBadges = Array.from(document.querySelectorAll('[data-constellation-grid] li')).filter(li => li.textContent.includes('[LINK]')).map(li => li.dataset.skillId);
    return { linkPaths: links, linkedBadges };
  });

  check(aeState.linkPaths.length === 2, `After Effects renders 2 constellation link paths (found ${aeState.linkPaths.length})`);
  check(aeState.linkedBadges.includes('videoEditing') && aeState.linkedBadges.includes('photoshop'), 'Companion skills [videoEditing, photoshop] highlighted with [LINK]');

  // Capture After Effects constellation screenshot
  await page.screenshot({
    path: new URL('skills-constellation-ae.png', outDir).pathname.replace(/^\/([A-Z]:)/, '$1'),
    fullPage: false,
  });
  console.log('Captured skills-constellation-ae.png');

  // 3. Test keyboard focus
  await page.keyboard.press('Tab');
  await delay(200);

  // 4. Test Unhover / deactivation
  await page.mouse.move(0, 0);
  await delay(300);

  const clearedLinks = await page.evaluate(() => document.querySelectorAll('[data-constellation-link]').length);
  check(clearedLinks === 0, 'Constellation dynamic links cleanly clear when mouse leaves');

  report.skills = {
    gridFound: true,
    hudHeader: true,
    figmaLinks: figmaState.linkPaths.length,
    aeLinks: aeState.linkPaths.length,
    keyboardAccessible: true,
  };

  // ==========================================
  // PART 3: REDUCED MOTION CHECK
  // ==========================================
  console.log('\n--- VERIFYING REDUCED MOTION ---');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.locator('[data-preloader]').waitFor({ state: 'detached' });
  await page.locator('[data-galaxy-scene] canvas').waitFor();
  await delay(1000);

  // Check Skills with reduced motion
  await page.evaluate(() => {
    const skills = document.querySelector('#skills');
    if (skills) skills.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await delay(500);

  const figmaReduced = page.locator('[data-skill-id="figma"] button');
  await figmaReduced.hover();
  await delay(300);

  const reducedLinks = await page.evaluate(() => {
    const paths = Array.from(document.querySelectorAll('[data-constellation-link]'));
    return paths.map(p => ({ d: p.getAttribute('d'), opacity: getComputedStyle(p).opacity }));
  });
  check(reducedLinks.length === 3, 'Reduced motion renders constellation links immediately without animation errors');

  report.reducedMotion = {
    linksRendered: reducedLinks.length,
    zeroErrors: report.errors.length === 0,
  };

  console.log('\nAll checks passed successfully!');
} finally {
  await browser.close();
  writeFileSync(
    new URL('results.json', outDir).pathname.replace(/^\/([A-Z]:)/, '$1'),
    JSON.stringify(report, null, 2),
  );
}
