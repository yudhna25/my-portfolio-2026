import assert from 'node:assert/strict';
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import sharp from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';

const out = new URL('./', import.meta.url);
const report = { browser: '', layout: [], surfaces: [], pixels: [], interactions: [], errors: [], checks: 0 };
const check = (value, message) => { assert(value, message); report.checks++; };
const save = () => writeFileSync(new URL('results.json', out), JSON.stringify(report, null, 2));
const channels = color => color.match(/[\d.]+/g)?.map(Number) ?? [];
const luminance = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const blend = (front, back, alpha) => front.map((v, i) => v * alpha + back[i] * (1 - alpha));
const glass = blend([5, 5, 5], [255, 255, 255], 0.65);
const guarded = blend([5, 5, 5], glass, 0.2);
const worst = blend([255, 255, 255], guarded, 0.05);
report.bounds = { unguardedWhite: contrast([250, 250, 250], glass), guardedWithWhiteNoise: contrast([250, 250, 250], worst), worstBackground: worst, backdropTransmission: 0.35 * 0.8 };
check(report.bounds.guardedWithWhiteNoise >= 7, 'Conservative white backdrop + grain contrast');

const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
report.browser = browser.version();
const ids = ['about', 'work', 'experience', 'education', 'transmission'];
const expected = { about: 2, work: 3, experience: 3, education: 3, transmission: 1 };
async function open(width, theme = 'dark', reducedMotion = 'reduce') {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion, serviceWorkers: 'block' });
  await context.addInitScript(theme => localStorage.setItem('stellar-theme', theme), theme);
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(String(e)));
  page.on('console', e => { if (e.type() === 'error') report.errors.push(e.text()); });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preloader]').waitFor({ state: 'detached' });
  await page.locator('[data-galaxy-scene] canvas').waitFor();
  await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 4000))]));
  await page.waitForTimeout(reducedMotion === 'reduce' ? 700 : 5400);
  return { page, context };
}
async function pose(page, selector) {
  await page.evaluate(async selector => {
    const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
    const e = document.querySelector(selector), smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(e, false, 'center center');
    else e.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, selector);
  await page.waitForTimeout(1400);
}
async function dom(page, theme, width) {
  const data = await page.evaluate(ids => {
    const rect = e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    const text = e => [...e.querySelectorAll('*')].filter(n => !n.closest('[aria-hidden="true"]') && [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim())).map(n => {
      const s = getComputedStyle(n); return { tag: n.tagName, text: n.textContent.trim().slice(0, 90), color: s.color, font: s.fontFamily, bg: s.backgroundColor, opacity: s.opacity, stroke: s.webkitTextStrokeColor, rect: rect(n), disabled: n.matches(':disabled') };
    });
    return { width: innerWidth, client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth, tokens: Object.fromEntries(['--color-cosmic-amber', '--color-electric-cyan', '--color-glass-surface', '--border-glass', '--border-glass-subtle'].map(k => [k, getComputedStyle(document.documentElement).getPropertyValue(k).trim()])), sections: ids.map(id => ({ id, bg: getComputedStyle(document.getElementById(id)).backgroundColor, cards: [...document.querySelectorAll(`#${id} [data-glass-card]`)].map(e => { const s = getComputedStyle(e); return { bg: s.backgroundColor, image: s.backgroundImage, blur: s.backdropFilter, border: s.borderTopColor, color: s.color, rect: rect(e), texts: text(e) }; }) })) };
  }, ids);
  data.theme = theme;
  report.layout.push({ width, theme, client: data.client, scroll: data.scroll });
  check(data.client === data.scroll, `Horizontal overflow ${width}/${theme}`);
  check(data.tokens['--color-cosmic-amber'].toUpperCase() === '#F59E0B', 'Amber token');
  check(data.tokens['--color-electric-cyan'].toUpperCase() === '#00F0FF', 'Cyan token');
  check(data.tokens['--color-glass-surface'] === 'rgba(5, 5, 5, 0.65)', 'Exact glass token');
  for (const section of data.sections) {
    check(section.bg === 'rgba(0, 0, 0, 0)', `Opaque section ${section.id}`);
    check(section.cards.length === expected[section.id], `Surface count ${section.id}`);
    for (const card of section.cards) {
      check(card.bg === 'rgba(5, 5, 5, 0.65)' && card.blur === 'blur(12px)', `Glass CSS ${section.id}`);
      check(card.border === 'rgba(255, 255, 255, 0.08)', `Subtle border ${section.id}`);
      check(card.image.includes('0.2'), 'Neutral legibility guard');
      for (const t of card.texts) {
        const rgb = channels(t.color);
        // The Contact CTA has its own opaque white surface and black foreground.
        const background = t.bg === 'rgb(250, 250, 250)' ? [250, 250, 250] : rgb[0] === 0 && rgb[1] === 0 && rgb[2] === 0 ? [250, 250, 250] : worst;
        t.boundContrast = contrast(rgb, background);
        check(t.boundContrast >= 7, `Text contrast ${width}/${theme}/${section.id}/${t.text}: ${t.boundContrast}`);
        check(rgb.length === 3 || rgb[3] > 0, 'Transparent heading text');
      }
    }
  }
  report.surfaces.push(data);
}
async function pixelProbe(page, section, white = false) {
  const selector = `#${section} [data-glass-card]${section === 'about' ? ':nth-child(2)' : ''}`;
  // About's text panel is the second direct grid child, not the nested avatar.
  const actual = section === 'about' ? '#about div[data-glass-card].col-span-12' : selector;
  await pose(page, actual);
  const text = await page.locator(actual).first().evaluate(e => [...e.querySelectorAll('h1,h2,h3,p')].filter(n => n.textContent.trim()).map(n => {
    const s = getComputedStyle(n), walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT), rects = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) {
      const range = document.createRange(); range.selectNodeContents(walker.currentNode);
      for (const r of range.getClientRects()) rects.push({ x: r.x, y: r.y, width: r.width, height: r.height });
    }
    return { text: n.getAttribute('aria-label') || n.textContent.trim().slice(0, 65), color: s.color, rects };
  }));
  const hide = await page.addStyleTag({ content: '.glass-card, .glass-card * { color: transparent !important; -webkit-text-stroke-color: transparent !important; text-shadow: none !important; }' });
  const png = await page.screenshot();
  await hide.evaluate(e => e.remove());
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rows = [];
  for (const t of text) {
    let min = Infinity, maxL = 0, samples = 0;
    for (const r of t.rects) {
      const x1 = Math.max(0, Math.ceil(r.x + 1)), x2 = Math.min(info.width, Math.floor(r.x + r.width - 1));
      const y1 = Math.max(90, Math.ceil(r.y + 1)), y2 = Math.min(info.height, Math.floor(r.y + r.height - 1));
      for (let y = y1; y < y2; y += 2) for (let x = x1; x < x2; x += 2) {
        const offset = (y * info.width + x) * 3, bg = [data[offset], data[offset + 1], data[offset + 2]];
        min = Math.min(min, contrast(channels(t.color), bg)); maxL = Math.max(maxL, luminance(bg)); samples++;
      }
    }
    if (!samples) continue;
    check(min >= 7, `Pixel backdrop contrast ${section}/${white}/${t.text}: ${min}`);
    rows.push({ text: t.text, foreground: t.color, minContrast: min, maxBackgroundLuminance: maxL });
  }
  check(rows.length > 0, 'Missing pixel text probes');
  report.pixels.push({ section, backdrop: white ? 'forced-white stress test' : 'actual Canvas', rows });
}
try {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const { page, context } = await open(width);
    await dom(page, 'dark', width);
    await context.close();
    console.log(`DOM/contrast dark ${width} PASS`);
  }
  for (const width of [390, 1440]) {
    const { page, context } = await open(width, 'light');
    await dom(page, 'light', width);
    await context.close();
    console.log(`DOM/contrast light ${width} PASS`);
  }
  const { page, context } = await open(1440);
  const cdp = await context.newCDPSession(page);
  await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument');
  const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#mission-hosanaMedia' });
  report.cdpBackground = await cdp.send('CSS.getBackgroundColors', { nodeId });
  for (const id of ids) await pixelProbe(page, id);
  const white = await page.addStyleTag({ content: '[data-galaxy-scene] { background: white !important; } [data-galaxy-scene] canvas { visibility: hidden !important; }' });
  for (const id of ids) await pixelProbe(page, id, true);
  await page.screenshot({ path: new URL('white-stress.png', out).pathname.replace(/^\/(\w:)/, '$1') });
  await white.evaluate(e => e.remove());
  // The color guard works independently of backdrop-filter support.
  const noBlur = await page.addStyleTag({ content: '.glass-card { backdrop-filter: none !important; }' });
  await pixelProbe(page, 'transmission');
  await noBlur.evaluate(e => e.remove());
  await context.close();
  const normal = await open(1440, 'dark', 'no-preference');
  for (const id of ids) {
    await pose(normal.page, id === 'about' ? '#about div[data-glass-card].col-span-12' : `#${id} [data-glass-card]`);
    await normal.page.screenshot({ path: new URL(`${id}-desktop.png`, out).pathname.replace(/^\/(\w:)/, '$1') });
  }
  await pose(normal.page, '#work [data-glass-card]');
  const work = normal.page.locator('#work [data-glass-card]').first();
  await work.hover(); await normal.page.waitForTimeout(200);
  const hover = await work.evaluate(e => { const s = getComputedStyle(e); return { border: s.borderTopColor, transform: s.transform, shadow: s.boxShadow }; });
  check(hover.border === 'rgba(0, 240, 255, 0.15)', 'Cyan hover border overridden');
  check(hover.shadow === 'none', 'Card glow not allowed');
  report.interactions.push({ type: 'hover', ...hover });
  await work.focus();
  check(await work.evaluate(e => parseFloat(getComputedStyle(e).outlineWidth) >= 2), 'Focus ring lost');
  for (const filter of ['Product Design', 'UX/UI', 'Graphic', 'Tất cả']) {
    await pose(normal.page, '#work button[aria-pressed]');
    await normal.page.locator('#work button[aria-pressed]').filter({ hasText: filter }).click();
    await normal.page.waitForTimeout(900);
    report.interactions.push({ filter, cards: await normal.page.locator('#work article[data-project-card]:not(.hidden)').count() });
  }
  check(report.interactions.at(-1).cards === 3, 'Flip filter regression');
  await normal.context.close();
  const mobile = await open(390);
  await pose(mobile.page, '#transmission [data-glass-card]');
  await mobile.page.screenshot({ path: new URL('contact-mobile.png', out).pathname.replace(/^\/(\w:)/, '$1') });
  await mobile.context.close();
  check(report.errors.length === 0, `Console errors: ${report.errors.join('\n')}`);
  const protectedFiles = JSON.parse(readFileSync(new URL('protected-baseline.json', out), 'utf8'));
  report.protectedFiles = Object.fromEntries(Object.entries(protectedFiles).map(([file, before]) => [file, { before, after: createHash('sha256').update(readFileSync(new URL('../../' + file, out))).digest('hex') }]));
  report.concurrentChanges = Object.keys(report.protectedFiles).filter(file => report.protectedFiles[file].before !== report.protectedFiles[file].after);
  // Other Phase 4B sessions share this checkout; retain their locale updates.
  for (const [file, hash] of Object.entries(report.protectedFiles)) if (!file.startsWith('src/i18n/')) check(hash.before === hash.after, `Unexpected protected file change ${file}`);
  report.status = 'PASS'; save();
  console.log(JSON.stringify({ status: report.status, checks: report.checks, minPixelContrast: Math.min(...report.pixels.flatMap(p => p.rows.map(r => r.minContrast))), bounds: report.bounds }, null, 2));
} catch (error) { report.status = 'FAIL'; report.failure = String(error); save(); throw error; }
finally { await browser.close(); }
