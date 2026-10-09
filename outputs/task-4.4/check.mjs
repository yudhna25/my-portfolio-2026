import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const baseline = JSON.parse(readFileSync(new URL('./source-baseline.json', import.meta.url), 'utf8'));
const files = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(`${dir}/${entry.name}`) : /\.(jsx|js)$/.test(entry.name) ? [`${dir}/${entry.name}`] : []);
const walk = (node, visit) => { if (!node || typeof node !== 'object') return; if (node.type) visit(node); for (const value of Object.values(node)) { if (Array.isArray(value)) value.forEach(child => walk(child, visit)); else if (value && typeof value === 'object') walk(value, visit); } };
for (const file of files('src')) walk(parse(readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }), node => {
  if (node.type === 'JSXAttribute' && node.name.name === 'tabIndex') assert(!(Number(node.value?.value ?? node.value?.expression?.value) > 0), `${file}: no positive tabIndex`);
});
assert(!/outline\s*:\s*(none|0)\b|outline-none/.test(readFileSync('src/index.css', 'utf8')));
for (const file of ['src/3d/quality.js', 'src/3d/shaders/blackHole.js', 'src/stores/useScrollStore.js']) assert(readFileSync(file, 'utf8').replaceAll('\r\n','\n') === baseline[file].replaceAll('\r\n','\n'), `${file} protected`);
console.log('PASS: source tabindex/outline audit; quality, shader and store preserved (concurrent motion changes retained)');

const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const baseUrl = process.env.STELLAR_QA_URL ?? 'http://127.0.0.1:5173/';
const reports = [], errors = [], warnings = [];
try {
  for (const { width, language, reduced, theme } of process.argv.includes('--quick') ? [{ width: 1440, language: 'vi', reduced: false, theme: 'dark' }] : [
    { width: 1440, language: 'vi', reduced: false, theme: 'dark' },
    { width: 390, language: 'vi', reduced: false, theme: 'light' },
    { width: 1440, language: 'en', reduced: true, theme: 'light' },
    { width: 320, language: 'en', reduced: true, theme: 'dark' },
  ]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    const report = { width, language, reduced, theme, forward: [], reverse: [], menu: [], assertions: [] }; reports.push(report);
    page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); if (message.type() === 'warning') warnings.push(message.text()); });
    await page.goto(baseUrl); await page.waitForSelector('a[href="#smooth-content"]');
    await page.keyboard.press('Tab');
    const early = await page.evaluate(() => { const element = document.activeElement, rect = element.getBoundingClientRect(); return { href: element.getAttribute('href'), top: rect.top, z: getComputedStyle(element).zIndex, preloader: Boolean(document.querySelector('[data-preloader]')) }; });
    assert.equal(early.href, '#smooth-content'); assert(early.top >= 0); assert(Number(early.z) > 9999); report.earlySkip = early;
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock')); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1400);
    // Use actual controls so the same check works on dev and production bundles.
    const tabTo = async selector => { for (let index = 0; index < 120; index++) { if (await page.evaluate(selector => document.activeElement.matches(selector), selector)) return; await page.keyboard.press('Tab'); } throw new Error(`Tab could not reach ${selector}`); };
    if (language === 'en') {
      await tabTo('button[aria-controls="stellar-menu"]'); await page.keyboard.press('Enter');
      for (let index = 0; index < 20; index++) { if (await page.evaluate(() => document.activeElement.closest('#stellar-menu') && document.activeElement.tagName === 'BUTTON' && document.activeElement.textContent.trim().toUpperCase() === 'EN')) break; await page.keyboard.press('Tab'); }
      await page.keyboard.press('Enter'); await page.waitForFunction(() => document.documentElement.lang === 'en'); await page.keyboard.press('Escape');
    }
    await tabTo('button[title][aria-label]:not([aria-controls])');
    const currentTheme = () => page.evaluate(() => document.documentElement.dataset.theme ?? 'dark');
    if (await currentTheme() !== theme) await page.keyboard.press('Enter');
    for (let index = 0; index < 20; index++) { if (await page.evaluate(() => document.activeElement.getAttribute('href') === '#smooth-content' && !document.activeElement.hasAttribute('aria-label'))) break; await page.keyboard.press('Shift+Tab'); }
    await page.evaluate(() => { window.qa44 = {}; });
    const active = () => page.evaluate(() => {
      const element = document.activeElement, style = getComputedStyle(element), rect = element.getBoundingClientRect();
      const controls = Array.from(document.querySelectorAll('a[href],button,input,[tabindex="0"]'));
      const key = `${element.tagName}:${element.id || element.getAttribute('href') || element.closest('[data-live-demo]')?.dataset.liveDemo || element.closest('section,footer')?.id || ''}:${controls.indexOf(element)}`;
      let opacity = 1; for (let parent = element; parent; parent = parent.parentElement) opacity *= Number(getComputedStyle(parent).opacity);
      const label = element.getAttribute('aria-label') ?? (element.labels?.[0]?.textContent ?? element.textContent).trim().slice(0, 100);
      return { key, tag: element.tagName, id: element.id, href: element.getAttribute('href'), label, type: element.type, section: element.closest('section,footer')?.id, demo: element.closest('[data-live-demo]')?.dataset.liveDemo,
        isEntry: element.hasAttribute('data-live-demo'), opacity, outline: [style.outlineWidth, style.outlineStyle, style.outlineColor, style.outlineOffset], boxShadow: style.boxShadow,
        top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, focusVisible: element.matches(':focus-visible'), inDialog: Boolean(element.closest('dialog[open]')), disabled: element.matches(':disabled'), hidden: Boolean(element.closest('[inert],[aria-hidden="true"]')) };
    });
    const checkFocus = (pose) => { assert.equal(pose.focusVisible, true, `${pose.label}: focus-visible`); assert.equal(pose.opacity, 1, `${pose.label}: opacity`); assert.deepEqual(pose.outline, ['2px', 'solid', 'rgb(255, 255, 255)', '4px'], `${pose.label}: ring`); assert(pose.bottom > 0 && pose.top < 900 && pose.right > 0 && pose.left < width, `${pose.label}: in viewport`); assert.equal(pose.disabled, false); assert.equal(pose.hidden, false); };
    const press = async (key = 'Tab') => { await page.keyboard.press(key); await page.waitForTimeout(100); const entry = await active(); if (entry.isEntry) await page.waitForFunction(() => document.activeElement.querySelector('button,input'), null, { timeout: 10000 }); return active(); };
    await page.keyboard.press('Enter'); assert.equal((await active()).id, 'smooth-content'); report.assertions.push('skip Enter → smooth-content focus');
    await page.keyboard.press('Shift+Tab'); // Theme is the preceding control in natural DOM order.
    for (let index = 0; index < 20; index++) { const pose = await active(); if (pose.href === '#smooth-content' && !pose.label.includes('ANH DUY')) break; await page.keyboard.press('Shift+Tab'); }
    for (let index = 0; index < 90; index++) {
      const pose = await active(); if (pose.tag === 'BODY') { await press(); continue; }
      if (report.forward.length && pose.href === '#smooth-content' && !pose.label.includes('ANH DUY')) break;
      checkFocus(pose); report.forward.push(pose); await press();
    }
    assert.equal(report.forward[0].href, '#smooth-content'); assert(report.forward.some(pose => pose.type === 'checkbox')); assert.equal(report.forward.filter(pose => pose.section === 'work' && pose.tag === 'BUTTON').length, 4);
    assert.equal(report.forward.filter(pose => pose.isEntry).length, 3); assert.equal(report.forward.filter(pose => pose.section === 'site-footer').length, 3);
    if (!reduced) { assert.equal(report.forward.filter(pose => pose.type === 'range').length, 2); assert(report.forward.some(pose => pose.demo === 'starfieldExplorer' && pose.tag === 'BUTTON')); assert(report.forward.some(pose => pose.demo === 'scrollProgressOrbit' && pose.tag === 'BUTTON')); }
    const staticExpected = await page.evaluate(() => Array.from(document.querySelectorAll('a[href],button,input,[tabindex="0"]')).filter(element => !element.closest('dialog,[data-live-demo]') && element.tabIndex >= 0 && !element.matches(':disabled') && !element.closest('[inert],[aria-hidden="true"]') && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden').length);
    assert.equal(report.forward.filter(pose => !pose.demo).length, staticExpected);
    for (let index = 0; index < 80; index++) { const pose = await press('Shift+Tab'); if (pose.tag === 'BODY') continue; checkFocus(pose); report.reverse.push(pose); if (pose.href === '#smooth-content' && !pose.label.includes('ANH DUY')) break; }
    assert(report.reverse.some(pose => pose.section === 'site-footer')); assert(report.reverse.some(pose => pose.type === 'checkbox')); assert(report.reverse.at(-1).href === '#smooth-content');
    const to = async selector => { for (let index = 0; index < 120; index++) { if (await page.evaluate(selector => document.activeElement.matches(selector), selector)) return; await press(); } throw new Error(`Tab could not reach ${selector}`); };
    await to('button[aria-controls="stellar-menu"]'); await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => document.querySelector('#stellar-menu').open && document.querySelector('#stellar-menu').contains(document.activeElement)), true);
    let pose = await active(); checkFocus(pose); report.menu.push(pose); await page.screenshot({ path: `outputs/task-4.4/menu-${width}-${language}.png` });
    const dialogCount = await page.locator('#stellar-menu a[href],#stellar-menu button').count();
    for (let index = 0; index < dialogCount * 2; index++) { pose = await press(); checkFocus(pose); assert(pose.inDialog); report.menu.push(pose); }
    for (let index = 0; index < dialogCount * 2; index++) { pose = await press('Shift+Tab'); checkFocus(pose); assert(pose.inDialog); }
    await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => document.querySelector('#stellar-menu').open), false); assert.equal(await page.evaluate(() => document.activeElement.matches('button[aria-controls="stellar-menu"]')), true); report.assertions.push('menu instant focus, 2 forward/reverse cycles contained, Escape immediate exact opener restore');
    await press(); // Theme toggle.
    const beforeTheme = await currentTheme(); const themeLabel = (await active()).label;
    await page.keyboard.press('Enter'); assert.notEqual(await currentTheme(), beforeTheme); assert.notEqual((await active()).label, themeLabel);
    await page.keyboard.press('Space'); assert.equal(await currentTheme(), beforeTheme); checkFocus(await active()); report.assertions.push('theme Enter/Space + accessible label sync');
    if (!reduced) {
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1400);
      await page.evaluate(() => window.scrollTo(0, 3000)); await page.waitForTimeout(1400);
      assert(await page.evaluate(() => document.querySelector('nav[aria-label]').getBoundingClientRect().bottom < 1));
      await page.keyboard.press('Shift+Tab'); assert(await page.evaluate(() => document.activeElement.closest('nav[aria-label]') && document.querySelector('nav[aria-label]').getBoundingClientRect().top >= -1)); checkFocus(await active()); report.assertions.push('hidden Nav Shift+Tab immediately reveals');
    }
    await to('[data-orbit-pause]'); const checked = await page.locator('[data-orbit-pause]').isChecked(); await page.keyboard.press('Space'); assert.equal(await page.locator('[data-orbit-pause]').isChecked(), !checked); await page.keyboard.press('Space'); assert.equal(await page.locator('[data-orbit-pause]').isChecked(), checked); report.assertions.push('Skills Space toggles pause twice');
    await to('#work button[aria-pressed]'); await press(); await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-pressed')), 'true'); await press(); await page.keyboard.press('Space'); assert.equal(await page.evaluate(() => document.activeElement.getAttribute('aria-pressed')), 'true'); await press(); await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => document.querySelector('#works-grid [inert] a[href]')?.tabIndex ?? 0), 0); await press(); assert.equal((await active()).isEntry, true); report.assertions.push('Works Enter/Space aria-pressed; filtered project is skipped');
    if (!reduced) { await to('[data-live-demo="nebulaShaderPlayground"] input[type="range"]'); const before = Number(await page.evaluate(() => document.activeElement.value)); await page.keyboard.press('ArrowRight'); assert.equal(Number(await page.evaluate(() => document.activeElement.value)), Number((before + 0.1).toFixed(1))); await page.keyboard.press('ArrowLeft'); assert.equal(Number(await page.evaluate(() => document.activeElement.value)), before); report.assertions.push('shader slider native ArrowRight/ArrowLeft'); }
    await to('[data-contact-email]'); checkFocus(await active()); await page.screenshot({ path: `outputs/task-4.4/email-${width}-${language}.png` });
    await page.evaluate(() => { window.qa44.email = null; document.querySelector('[data-contact-email]').addEventListener('click', event => { window.qa44.email = { href: event.currentTarget.href, trusted: event.isTrusted }; event.preventDefault(); }, { once: true }); }); await page.keyboard.press('Enter'); assert.deepEqual(await page.evaluate(() => window.qa44.email), { href: 'mailto:anhduy25work@gmail.com', trusted: true }); report.assertions.push('email Enter dispatches trusted activation to exact mailto (OS launch intercepted)');
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1000);
    if (width >= 1024) { await to('nav[aria-label] a[href="#work"]'); await page.keyboard.press('Enter'); assert.equal((await active()).id, 'work'); await press(); assert.equal((await active()).section, 'work'); report.assertions.push('Nav Enter transfers focus to destination, next Tab reaches filter'); }
    await to('button[aria-controls="stellar-menu"]'); await page.keyboard.press('Space'); assert.equal((await active()).inDialog, true);
    for (let index = 0; index < 20; index++) { if ((await active()).href === '#skills') break; await press(); } assert.equal((await active()).href, '#skills'); await page.keyboard.press('Enter'); assert.equal((await active()).id, 'skills'); await press(); assert.equal((await active()).type, 'checkbox'); report.assertions.push('menu Space opens; link Enter transfers focus to Skills, next Tab pause');
    await page.emulateMedia({ forcedColors: 'active' }); await page.keyboard.press('Space'); const forced = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { width: s.outlineWidth, style: s.outlineStyle, color: s.outlineColor }; }); assert.equal(forced.width, '2px'); assert.equal(forced.style, 'solid'); report.forcedColors = forced;
    await page.keyboard.press('Control+Home'); await page.waitForTimeout(1400);
    const seen = new Set(); report.pageDown = [];
    for (let index = 0; index < 70; index++) {
      const scroll = await page.evaluate(() => ({ y: window.scrollY, max: document.documentElement.scrollHeight - innerHeight, sections: Array.from(document.querySelectorAll('main > section,main section[id]')).filter(element => { const rect = element.getBoundingClientRect(); return rect.top < innerHeight / 2 && rect.bottom > innerHeight / 2; }).map(element => element.id) }));
      scroll.sections.forEach(id => seen.add(id)); report.pageDown.push(scroll);
      if (scroll.y >= scroll.max - 2) break;
      await page.keyboard.press('PageDown'); await page.waitForTimeout(350);
    }
    for (const id of ['hero','about','skills','education','experience','work','playground','transmission']) assert(seen.has(id), `PageDown reaches ${id}`);
    assert(report.pageDown.at(-1).y >= report.pageDown.at(-1).max - 2); report.assertions.push('native Control+Home/PageDown reads all 8 sections to page end');
    assert.equal(await page.evaluate(() => Array.from(document.querySelectorAll('[tabindex]')).filter(element => element.tabIndex > 0).length), 0);
    console.log(`PASS ${width}px ${language} ${reduced ? 'reduced' : 'motion'}: ${report.forward.length} forward, ${report.reverse.length} reverse, ${report.menu.length} menu focus records; ${report.assertions.length} interaction checks`);
    await context.close();
  }
  assert.deepEqual(errors, []);
} finally { writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ reports, errors, warnings: [...new Set(warnings)] }, null, 2)); await browser.close(); }
