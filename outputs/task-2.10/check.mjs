import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { PORTFOLIO_DATA } from '../../src/data.js';

const locales = Object.fromEntries(['vi', 'en'].map((lang) => [lang,
  JSON.parse(readFileSync(new URL(`../../src/i18n/locales/${lang}.json`, import.meta.url)))]));
const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([key, value]) =>
  typeof value === 'string' ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`));
assert.deepEqual(keys(locales.vi).sort(), keys(locales.en).sort());
assert.equal(PORTFOLIO_DATA.experience.length, 3);
for (const [lang, locale] of Object.entries(locales)) {
  const draft = readFileSync(new URL(`../content-${lang}.md`, import.meta.url), 'utf8');
  assert.equal(locale.experience.sectionLabel, 'Voyage Log');
  assert(draft.includes(locale.experience.heading));
  assert.deepEqual(Object.keys(locale.experience.positions), PORTFOLIO_DATA.experience.map(({ id }) => id));
  for (const entry of PORTFOLIO_DATA.experience) {
    const position = locale.experience.positions[entry.id];
    for (const value of Object.values(position)) assert(draft.includes(value), `${lang}: ${value}`);
    for (const field of ['company', 'role', 'type']) assert.equal(position[field], entry[field]);
    if (lang === 'en') {
      assert.equal(position.description, entry.details);
      assert.equal(position.period.replace('–', '—'), entry.year);
    }
  }
}
assert(!/experience|exp-card|Professional History/.test(readFileSync(new URL('../../src/components/About.jsx', import.meta.url), 'utf8')));
const app = readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
assert(/<Education\s*\/>\s*<Experience\s*\/>\s*<Marquee/.test(app));
console.log('PASS: 3 missions, approved Vi/En copy, data/locale IDs, key parity, App order, no duplicate About');

if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
    const errors = [], warnings = [], poses = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
    await page.evaluate(() => document.fonts.ready);
    const cards = page.locator('#experience [data-mission]');
    assert.equal(await cards.count(), 3);
    const initial = await cards.evaluateAll((items) => items.map((el) => ({
      x: new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,
      opacity: getComputedStyle(el).opacity,
    })));
    assert.deepEqual(initial, [{ x: -40, opacity: '0' }, { x: 40, opacity: '0' }, { x: -40, opacity: '0' }]);
    const accessibleLog = await page.locator('#experience').ariaSnapshot();
    for (const { company } of PORTFOLIO_DATA.experience) assert(accessibleLog.includes(company), 'Hidden reveal remains readable to assistive technology');
    const scrollTo = async (selector, offset = 120) => {
      await page.evaluate(async ({ selector, offset }) => {
        const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
        const el = document.querySelector(selector), smoother = ScrollSmoother.get();
        window.scrollTo(0, (smoother ? smoother.offset(el, 'top top') : el.getBoundingClientRect().top + scrollY) - offset);
      }, { selector, offset });
      await page.waitForTimeout(1600);
    };
    const snapshot = async (label, lang = 'vi') => {
      const pose = await page.locator('#experience').evaluate((section) => {
        const items = [...section.querySelectorAll('[data-mission]')];
        return {
          viewport: innerWidth, heading: section.querySelector('h2').textContent,
          background: getComputedStyle(section).backgroundColor, language: section.lang,
          overflow: [...section.querySelectorAll('*')].filter((el) => {
            const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
          }).map((el) => el.className),
          cards: items.map((el) => {
            const r = el.getBoundingClientRect(), article = el.querySelector('article');
            return { x: r.x, y: r.y, width: r.width, height: r.height, text: el.textContent,
              shadow: getComputedStyle(article).boxShadow, descriptionColor: getComputedStyle(article.lastElementChild).color,
              headingFont: getComputedStyle(el.querySelector('h3')).fontFamily };
          }),
        };
      });
      assert.deepEqual(pose.overflow, [], label);
      assert.equal(pose.heading, locales[lang].experience.heading);
      assert.equal(pose.language, lang);
      assert.equal(pose.background, 'rgb(5, 5, 5)');
      for (const [index, card] of pose.cards.entries()) {
        assert.equal(card.shadow, 'none');
        assert.equal(card.descriptionColor, 'rgb(153, 153, 153)');
        assert(card.headingFont.includes('Unbounded'));
        for (const value of Object.values(locales[lang].experience.positions[PORTFOLIO_DATA.experience[index].id])) assert(card.text.includes(value));
        if (index) {
          if (pose.viewport >= 1024) assert(Math.abs(card.y - pose.cards[0].y) < 1 && card.x > pose.cards[index - 1].x);
          else assert(card.y > pose.cards[index - 1].y + pose.cards[index - 1].height);
        }
      }
      poses.push({ label, ...pose });
    };
    await page.locator('nav a[href="#experience"]').filter({ visible: true }).click();
    await page.waitForTimeout(2800);
    await page.mouse.move(900, 600);
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(1400);
    assert((await cards.evaluateAll((items) => items.map((el) => getComputedStyle(el).opacity))).every((opacity) => opacity === '1'));
    const article = page.locator('#experience article').first();
    const borderBefore = await article.evaluate((el) => getComputedStyle(el).borderColor);
    await article.hover();
    assert.notEqual(await article.evaluate((el) => getComputedStyle(el).borderColor), borderBefore);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await scrollTo('#experience');
      await snapshot(`vi-${width}`);
      if ([320, 1440].includes(width)) await page.screenshot({ path: `outputs/task-2.10/experience-${width}.png` });
    }
    await page.mouse.wheel(0, -160);
    await page.waitForTimeout(700);
    await page.locator('nav button[aria-controls="stellar-menu"]').click();
    await page.getByRole('button', { name: 'En', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await scrollTo('#experience');
    await snapshot('en-menu-toggle', 'en');
    await page.screenshot({ path: 'outputs/task-2.10/experience-en.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await scrollTo('#experience');
    assert((await cards.evaluateAll((items) => items.map((el) => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform })))).every((style) => style.opacity === '1' && style.transform === 'none'));
    await snapshot('en-reduced-motion', 'en');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await scrollTo('#work', 0);
    const triggerCount = await page.evaluate(async () => {
      const { ScrollTrigger } = await import('/src/hooks/useGSAPSetup.js');
      return ScrollTrigger.getAll().filter((trigger) => document.getElementById('experience').contains(trigger.trigger)).length;
    });
    assert.equal(triggerCount, 0, 'Completed batch owns no surviving triggers');
    await page.setViewportSize({ width: 320, height: 900 });
    await page.reload();
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
    for (let index = 0; index < 3; index++) {
      await scrollTo(`#experience [data-mission]:nth-child(${index + 1})`, 300);
      assert.equal(await cards.nth(index).evaluate((el) => getComputedStyle(el).opacity), '1');
      assert.equal(await cards.nth(index).evaluate((el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41), 0);
      if (index === 0) assert.equal(await cards.nth(2).evaluate((el) => getComputedStyle(el).opacity), '0', 'Third mobile card waits for its own viewport entry');
    }
    await snapshot('vi-mobile-fresh');
    await page.screenshot({ path: 'outputs/task-2.10/experience-mobile-third.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(800);
    const mobileReduced = await page.evaluate(async () => {
      const { ScrollTrigger, gsap } = await import('/src/hooks/useGSAPSetup.js');
      const section = document.getElementById('experience');
      return { matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
        triggers: ScrollTrigger.getAll().filter((trigger) => section.contains(trigger.trigger)).length,
        cards: [...section.querySelectorAll('[data-mission]')].map((el) => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform, activeTweens: gsap.getTweensOf(el).length })) };
    });
    console.log('Mobile reduced-motion:', JSON.stringify(mobileReduced));
    assert(mobileReduced.matches && mobileReduced.triggers === 0);
    assert(mobileReduced.cards.every((card) => card.opacity === '1' && card.transform === 'none' && card.activeTweens === 0));
    await scrollTo('#experience');
    await snapshot('vi-mobile-reduced');
    writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ initial, poses, accessibleLog, mobileReduced, errors, warnings: [...new Set(warnings)], triggerCount }, null, 2));
    assert.deepEqual(errors, [], 'Console/page errors');
    console.log(`PASS: ${poses.length} Browser poses; native Nav/wheel/hover, menu EN, live reduced-motion, cleanup, 0 console errors`);
  } finally { await browser.close(); }
}
