import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { PORTFOLIO_DATA } from '../../src/data.js';
import { navigationSections } from '../../src/data/navigation.js';

const locales = Object.fromEntries(['vi', 'en'].map((lang) => [lang,
  JSON.parse(readFileSync(new URL(`../../src/i18n/locales/${lang}.json`, import.meta.url)))]));
for (const [lang, { contact }] of Object.entries(locales)) {
  const draft = readFileSync(new URL(`../content-${lang}.md`, import.meta.url), 'utf8');
  for (const key of ['heading', 'alternateHeading', 'subHeading', 'emailCta']) assert(draft.includes(contact[key]));
  assert.equal(contact.email, PORTFOLIO_DATA.profile.email);
  assert.equal(contact.emailUrl, `mailto:${PORTFOLIO_DATA.profile.email}`);
  assert.equal(contact.phone, PORTFOLIO_DATA.profile.phone);
  assert.equal(contact.facebookUrl, PORTFOLIO_DATA.profile.facebook);
  assert.equal(contact.linkedinUrl, '');
  assert.equal(contact.behanceUrl, '');
}
assert.deepEqual(Object.keys(locales.vi.contact), Object.keys(locales.en.contact));
assert.equal(navigationSections.find(({ key }) => key === 'contact').id, 'transmission');
assert.match(readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8'), /<Contact\s*\/>\s*<\/main>\s*<Footer\s*\/>/);
console.log('PASS: approved Vi/En copy, profile contacts, empty placeholders, locale parity, navigation target, App order');

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
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), { polling: 50 });
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#transmission'), email = section.locator('[data-contact-email]');
    const initial = await section.locator('[data-contact-line]').evaluateAll((items) => items.map((el) => getComputedStyle(el).opacity));
    assert.deepEqual(initial, ['0', '0']);
    const accessible = await section.ariaSnapshot();
    assert(accessible.includes(locales.vi.contact.heading));
    const duplicateIds = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    assert.deepEqual(duplicateIds, []);
    const scrollTo = async (selector, offset = 120) => {
      await page.evaluate(async ({ selector, offset }) => {
        const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
        const el = document.querySelector(selector), smoother = ScrollSmoother.get();
        window.scrollTo(0, (smoother ? smoother.offset(el, 'top top') : el.getBoundingClientRect().top + scrollY) - offset);
      }, { selector, offset });
      await page.waitForTimeout(1600);
    };
    const snapshot = async (label, lang = 'vi') => {
      const pose = await section.evaluate((el) => ({
        viewport: innerWidth, language: el.lang, background: getComputedStyle(el).backgroundColor,
        lines: [...el.querySelectorAll('[data-contact-line]')].map((line) => ({ text: line.textContent,
          lang: line.lang || el.lang, opacity: getComputedStyle(line).opacity,
          font: getComputedStyle(line).fontFamily, width: line.scrollWidth, available: line.clientWidth,
          color: getComputedStyle(line).color, stroke: getComputedStyle(line).webkitTextStrokeWidth,
          y: new DOMMatrixReadOnly(getComputedStyle(line).transform).m42 })),
        subtitle: el.querySelector('h2 + p').textContent.trim(),
        email: { href: el.querySelector('[data-contact-email]').getAttribute('href'),
          label: el.querySelector('[data-contact-email]').textContent.trim(),
          background: getComputedStyle(el.querySelector('[data-contact-email]')).backgroundColor,
          color: getComputedStyle(el.querySelector('[data-contact-email]')).color,
          shadow: getComputedStyle(el.querySelector('[data-contact-email]')).boxShadow },
        links: [...el.querySelectorAll('a')].map((link) => ({ text: link.textContent.trim(), href: link.getAttribute('href'),
          target: link.target, rel: link.rel, height: link.getBoundingClientRect().height })),
        overflow: [...el.querySelectorAll('*')].filter((item) => {
          const r = item.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1);
        }).map((item) => item.className),
        extraShadows: [...el.querySelectorAll('*')].filter((item) => getComputedStyle(item).boxShadow !== 'none'
          && !item.closest('[data-contact-email]')).map((item) => item.tagName),
      }));
      assert.equal(pose.language, lang);
      assert.equal(pose.background, 'rgb(5, 5, 5)');
      assert.equal(pose.lines[0].text, locales[lang].contact.heading);
      assert.equal(pose.lines[1].text, locales[lang].contact.alternateHeading);
      for (const line of pose.lines) { assert(line.font.includes('Unbounded')); assert.equal(line.opacity, '1'); assert.equal(line.y, 0); assert(line.width <= line.available + 1, `${label}: heading clipped`); }
      assert.equal(pose.lines[1].stroke, '1px');
      assert.equal(pose.subtitle, locales[lang].contact.subHeading);
      assert.equal(pose.email.href, locales[lang].contact.emailUrl);
      assert.equal(pose.email.label, locales[lang].contact.emailCta);
      assert.equal(pose.email.background, 'rgb(250, 250, 250)');
      assert.equal(pose.email.color, 'rgb(0, 0, 0)');
      assert(pose.email.shadow.includes('30px'));
      assert.deepEqual(pose.extraShadows, []);
      assert.deepEqual(pose.overflow, []);
      assert.equal(pose.links.length, 4); // CTA + Email/Facebook/phone; empty LinkedIn/Behance never render.
      assert(pose.links.every((link) => link.href && link.href !== '#' && link.height >= 44));
      assert(pose.links.some((link) => link.href === 'tel:0822021418'));
      const facebook = pose.links.find((link) => link.text === 'Facebook');
      assert.equal(facebook.href, PORTFOLIO_DATA.profile.facebook);
      assert.equal(facebook.target, '_blank');
      assert(facebook.rel.includes('noopener') && facebook.rel.includes('noreferrer'));
      poses.push({ label, ...pose });
    };
    await page.locator('nav a[href="#transmission"]').filter({ visible: true }).click();
    await page.waitForTimeout(2800);
    await snapshot('vi-nav-contact');
    const buttonBox = await email.boundingBox();
    await page.mouse.move(buttonBox.x + buttonBox.width - 12, buttonBox.y + buttonBox.height / 2);
    await page.waitForTimeout(450);
    const magnetic = await email.evaluate((el) => getComputedStyle(el).translate);
    const distance = Math.hypot(...magnetic.split(' ').map(parseFloat));
    assert(distance > 1 && distance <= 8.01, magnetic);
    await page.mouse.move(20, 150);
    await page.waitForTimeout(450);
    assert(Math.hypot(...(await email.evaluate((el) => getComputedStyle(el).translate)).split(' ').map(parseFloat)) < 0.01);
    await email.focus();
    assert(Number.parseFloat(await email.evaluate((el) => getComputedStyle(el).outlineWidth)) >= 2);
    await page.evaluate(() => {
      document.querySelector('[data-contact-email]').addEventListener('click', (event) => {
        window.__contactMailto = event.currentTarget.getAttribute('href'); event.preventDefault();
      }, { once: true });
    });
    await email.click();
    assert.equal(await page.evaluate(() => window.__contactMailto), locales.vi.contact.emailUrl);
    const glow = section.locator('[data-contact-glow]');
    const opacityBefore = await glow.evaluate((el) => Number(getComputedStyle(el).opacity));
    await page.waitForTimeout(700);
    const opacityAfter = await glow.evaluate((el) => Number(getComputedStyle(el).opacity));
    assert(Math.abs(opacityBefore - opacityAfter) > 0.005);
    await page.mouse.move(20, 150);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await scrollTo('#transmission');
      await snapshot(`vi-${width}`);
      if ([320, 1440].includes(width)) await page.screenshot({ path: `outputs/task-2.12/contact-${width}.png` });
    }
    await scrollTo('#about', 0);
    assert(await page.evaluate(async () => {
      const { gsap } = await import('/src/hooks/useGSAPSetup.js');
      return gsap.getTweensOf('[data-contact-glow]')[0].paused();
    }), 'Offscreen pulse pauses');
    await page.mouse.wheel(0, -160);
    await page.waitForTimeout(700);
    await page.locator('nav button[aria-controls="stellar-menu"]').click();
    await page.getByRole('button', { name: 'En', exact: true }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await scrollTo('#transmission');
    await snapshot('en-menu-toggle', 'en');
    await page.screenshot({ path: 'outputs/task-2.12/contact-en.png' });
    for (let cycle = 0; cycle < 2; cycle++) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(800);
      const reduced = await page.evaluate(async () => {
        const { gsap, ScrollTrigger, ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
        const el = document.getElementById('transmission');
        return { smoother: !!ScrollSmoother.get(), triggers: ScrollTrigger.getAll().filter((trigger) => el.contains(trigger.trigger)).length,
          tweens: gsap.getTweensOf(el.querySelectorAll('[data-contact-glow], [data-contact-line]')).length,
          lines: [...el.querySelectorAll('[data-contact-line]')].map((line) => ({ opacity: getComputedStyle(line).opacity, transform: getComputedStyle(line).transform })) };
      });
      assert.equal(reduced.triggers, 0); assert.equal(reduced.tweens, 0); assert.equal(reduced.smoother, false);
      assert(reduced.lines.every((line) => line.opacity === '1' && line.transform === 'none'), JSON.stringify(reduced));
      await snapshot(`en-reduced-${cycle}`, 'en');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await scrollTo('#transmission');
      assert.equal(await page.evaluate(async () => {
        const { gsap } = await import('/src/hooks/useGSAPSetup.js'); return gsap.getTweensOf('[data-contact-glow]').length;
      }), 1, 'One pulse after preference rebuild');
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), { polling: 50 });
    await page.evaluate(() => document.fonts.ready);
    await scrollTo('#transmission');
    await snapshot('vi-mobile-reduced-fresh');
    assert.equal(await page.locator('[data-custom-cursor]').count(), 0);
    await page.screenshot({ path: 'outputs/task-2.12/contact-mobile-reduced.png' });
    writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ initial, duplicateIds, poses, magnetic,
      pulse: { opacityBefore, opacityAfter }, accessible, errors, warnings: [...new Set(warnings)] }, null, 2));
    assert.deepEqual(errors, []);
    console.log(`PASS: ${poses.length} Browser poses; native Nav/menu/hover/mailto, magnetic <=8px, pulse/reduced-motion/cleanup, 0 console errors`);
  } finally { await browser.close(); }
}
