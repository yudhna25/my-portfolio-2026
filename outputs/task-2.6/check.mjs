import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { PORTFOLIO_DATA } from '../../src/data.js';

const locales = Object.fromEntries(['vi', 'en'].map((lang) => [lang,
  JSON.parse(readFileSync(new URL(`../../src/i18n/locales/${lang}.json`, import.meta.url)))]));
const leaves = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) =>
  typeof child === 'string' ? [`${prefix}${key}`] : leaves(child, `${prefix}${key}.`));
assert.deepEqual(leaves(locales.vi).sort(), leaves(locales.en).sort());
for (const [lang, locale] of Object.entries(locales)) {
  const draft = readFileSync(new URL(`../content-${lang}.md`, import.meta.url), 'utf8');
  for (const text of Object.values(locale.about).filter((text) => typeof text === 'string')) {
    assert(draft.includes(text), `Unapproved About content (${lang}): ${text}`);
  }
  assert.deepEqual(locale.about.coreSkills, PORTFOLIO_DATA.skills);
  assert.deepEqual(Object.keys(locale.about.tools), PORTFOLIO_DATA.tools.map((tool) => tool.id));
  assert.deepEqual(Object.values(locale.about.tools), locale.skills.tools);
}
for (const asset of ['/avatar.webp', ...PORTFOLIO_DATA.tools.map((tool) => tool.icon).filter(Boolean)]) {
  assert(existsSync(new URL(`../../public${asset}`, import.meta.url)), `Missing ${asset}`);
}
const source = readFileSync(new URL('../../src/components/About.jsx', import.meta.url), 'utf8');
assert(!/experience|exp-card|Professional History|registerPlugin|style=/.test(source));
console.log('PASS: locale parity, approved copy, data order, assets, About scope');

if (process.argv.includes('--browser')) {
  // Existing Codex browser runtime + Edge. No added project dependency or fixture.
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
    const errors = [], warnings = [], poses = [], failedRequests = [];
    page.on('requestfailed', (request) => failedRequests.push({ url: request.url(), failure: request.failure() }));
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
    await page.evaluate(() => document.fonts.ready);
    const scrollTo = async (selector, offset = 120) => {
      await page.evaluate(async ({ selector, offset }) => {
        const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
        const el = document.querySelector(selector), smoother = ScrollSmoother.get();
        window.scrollTo(0, (smoother ? smoother.offset(el, 'top top') : el.getBoundingClientRect().top + scrollY) - offset);
      }, { selector, offset });
      await page.waitForTimeout(1500);
    };
    const snapshot = async (label) => {
      const pose = await page.locator('#about').evaluate((section) => {
        const rect = (selector) => {
          const { x, y, width, height } = section.querySelector(selector).getBoundingClientRect();
          return { x, y, width, height };
        };
        const style = (selector) => getComputedStyle(section.querySelector(selector));
        return {
          viewport: innerWidth, heading: section.querySelector('h2').getAttribute('aria-label'),
          avatar: rect('.avatar-col'), title: rect('h2'),
          overflow: [...section.querySelectorAll('*')].filter((el) => {
            const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
          }).map((el) => el.className),
          background: getComputedStyle(section).backgroundColor, border: style('.avatar-wrap').borderColor,
          stroke: style('.stroke-text-white').webkitTextStrokeWidth,
          captionFont: style('figcaption').fontFamily, headingFont: style('h2').fontFamily,
          quoteStyle: style('blockquote').fontStyle, quoteWeight: style('blockquote').fontWeight,
          images: [...section.querySelectorAll('img')].map((img) => ({ loaded: img.complete && img.naturalWidth > 0, filter: getComputedStyle(img).filter })),
          text: section.textContent,
        };
      });
      assert.deepEqual(pose.overflow, [], `${label}: overflow`);
      assert.equal(pose.background, 'rgb(5, 5, 5)');
      assert.equal(pose.stroke, '1px');
      assert(pose.images.every((img) => img.loaded && img.filter === 'grayscale(1)'));
      assert(pose.captionFont.includes('JetBrains Mono') && pose.headingFont.includes('Unbounded'));
      assert.equal(pose.quoteStyle, 'italic');
      assert.equal(pose.quoteWeight, '300');
      assert(!pose.text.includes('Professional History'));
      if (pose.viewport >= 1024) assert(pose.title.x > pose.avatar.x + pose.avatar.width);
      else assert(pose.title.y > pose.avatar.y + pose.avatar.height);
      poses.push({ label, ...pose });
    };
    await scrollTo('#about');
    const beforeWheel = await page.locator('#about .avatar-img').evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.move(800, 600);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1800);
    assert.notEqual(await page.locator('#about .avatar-img').evaluate((el) => getComputedStyle(el).transform), beforeWheel, 'Native wheel drives avatar parallax');
    assert.equal(await page.locator('#about .avatar-wrap').evaluate((el) => getComputedStyle(el).clipPath), 'inset(0%)');
    assert((await page.locator('#about .split-line').evaluateAll((lines) => lines.map((el) => getComputedStyle(el).opacity))).every((opacity) => opacity === '1'));
    assert(await page.evaluate(() => document.fonts.check('400 16px "Space Grotesk"') && document.fonts.check('400 12px "JetBrains Mono"')));
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await scrollTo('#about');
      await snapshot(`vi-${width}`);
      if ([320, 1440, 1920].includes(width)) {
        await page.screenshot({ path: `outputs/task-2.6/about-${width}.png` });
        await scrollTo('#about-skills', 700);
        await page.screenshot({ path: `outputs/task-2.6/about-${width}-tools.png` });
      }
    }
    await scrollTo('#about-skills', 350);
    const pill = page.locator('#about .skill-pill').first();
    await pill.hover();
    assert.equal(await pill.evaluate((el) => getComputedStyle(el).color), 'rgb(250, 250, 250)');
    assert((await page.locator('#about .skill-pill').evaluateAll((pills) => pills.map((el) => getComputedStyle(el).opacity))).every((opacity) => opacity === '1'));
    for (const lang of ['en', 'vi', 'en', 'vi']) {
      await page.evaluate(async (lang) => {
        const { useLangStore } = await import('/src/stores/useLangStore.js');
        useLangStore.getState().setLang(lang);
      }, lang);
      await scrollTo('#about');
      await snapshot(`${lang}-switch`);
      assert.equal(await page.locator('#about blockquote').textContent(), locales[lang].about.quote);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await scrollTo('#about');
    assert.equal(await page.locator('#about .split-line').count(), 0);
    assert.equal(await page.locator('#about .avatar-wrap').evaluate((el) => getComputedStyle(el).clipPath), 'none');
    await snapshot('reduced-motion');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await scrollTo('#education', 0);
    assert.equal(await page.locator('#about .split-line').count(), 2);
    const triggerCount = await page.evaluate(async () => {
      const { ScrollTrigger } = await import('/src/hooks/useGSAPSetup.js');
      return ScrollTrigger.getAll().filter((trigger) => document.getElementById('about').contains(trigger.trigger)).length;
    });
    assert.equal(triggerCount, 4, 'No leaked About triggers after switches; batch completed');
    writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ poses, errors, failedRequests, warnings: [...new Set(warnings)], triggerCount }, null, 2));
    assert.deepEqual(errors, [], 'Browser console/page errors');
    console.log(`PASS: ${poses.length} Browser poses, scroll/batch/hover, locale switches, live reduced-motion, cleanup, 0 console errors`);
  } finally { await browser.close(); }
}
