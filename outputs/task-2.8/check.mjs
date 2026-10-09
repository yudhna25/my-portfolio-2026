import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { PORTFOLIO_DATA } from '../../src/data.js';

const locales = Object.fromEntries(['vi', 'en'].map((lang) => [lang,
  JSON.parse(readFileSync(new URL(`../../src/i18n/locales/${lang}.json`, import.meta.url)))]));
for (const [lang, { skills }] of Object.entries(locales)) {
  const draft = readFileSync(new URL(`../content-${lang}.md`, import.meta.url), 'utf8');
  for (const group of ['tools', 'competencies', 'technical']) {
    assert(draft.includes(skills[`${group}Label`]));
    for (const label of skills[group]) assert(draft.includes(label), label);
  }
  assert.deepEqual(skills.competencies, PORTFOLIO_DATA.skills);
  assert.equal(skills.tools.length, PORTFOLIO_DATA.tools.length);
  assert.equal(skills.tools.length + skills.technical.length, 10);
  assert.equal(skills.technicalLevel, '');
}
assert.deepEqual(Object.keys(locales.vi.skills), Object.keys(locales.en.skills));
assert.match(readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8'), /<GalaxyScene><OrbitalSkills anchor=\{skillsOrbit\} \/><\/GalaxyScene>/);
assert.match(readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8'), /<About \/>\s*<Skills orbitAnchor=\{skillsOrbit\} \/>\s*<Education \/>/);
console.log('PASS: 3 groups, 18 approved labels, 10 satellites, no invented levels, Vi/En parity, App integration');

if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'no-preference' });
    const errors = [], warnings = [], poses = [], lifecycle = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`);
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), { polling: 50 });
    await page.evaluate(() => document.fonts.ready);
    const scene = () => page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const { Vector3, Matrix4 } = await import('/node_modules/.vite/deps/three.js');
      const { useScrollStore } = await import('/src/stores/useScrollStore.js');
      const state = _roots.get(document.querySelector('canvas')).store.getState();
      const group = state.scene.getObjectByName('orbital-skills');
      const bounds = document.querySelector('[data-orbit-window]').getBoundingClientRect();
      const project = (point) => {
        point.project(state.camera);
        return [(point.x + 1) * state.size.width / 2, (1 - point.y) * state.size.height / 2];
      };
      const vector = new Vector3(), matrix = new Matrix4(), nodes = [], materials = [];
      state.camera.updateMatrixWorld();
      group?.updateWorldMatrix(true, true);
      group?.traverse((object) => {
        if (!object.isMesh) return;
        materials.push({ color: object.material.color.toArray(), map: !!object.material.map, toneMapped: object.material.toneMapped });
        if (object.isInstancedMesh) for (let index = 0; index < object.count; index++) {
          object.getMatrixAt(index, matrix);
          nodes.push(project(vector.setFromMatrixPosition(matrix).applyMatrix4(object.matrixWorld)));
        }
      });
      return { section: useScrollStore.getState().currentSection, canvas: document.querySelectorAll('canvas').length,
        group: !!group, visible: group?.visible, rotation: group ? ['skills-tools', 'skills-technical'].map((name) => group.getObjectByName(name).parent.rotation.z) : [],
        core: group ? project(group.getObjectByName('skills-core').getWorldPosition(vector)) : null,
        bounds: bounds.toJSON(), nodes, materials, blackHole: !!state.scene.getObjectByName('black-hole'),
        calls: state.gl.info.render.calls, triangles: state.gl.info.render.triangles,
        geometries: state.gl.info.memory.geometries, textures: state.gl.info.memory.textures,
        subscribers: state.internal.subscribers.length };
    });
    const scrollTo = async (selector, offset = 100) => {
      await page.evaluate(async ({ selector, offset }) => {
        const { ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js');
        const element = document.querySelector(selector), smoother = ScrollSmoother.get();
        window.scrollTo(0, (smoother ? smoother.offset(element, 'top top') : element.getBoundingClientRect().top + scrollY) - offset);
      }, { selector, offset });
      await page.waitForTimeout(1600);
    };
    const snapshot = async (label, lang = 'vi') => {
      const dom = await page.locator('#skills').evaluate((section) => ({
        viewport: innerWidth, heading: section.querySelector('h2').textContent, language: section.lang,
        legend: [...section.querySelectorAll('[data-orbit-label]')].map((el) => el.lastElementChild.textContent),
        bars: [...section.querySelectorAll('[data-skill-item] > span:last-child')].map((el) => ({ aria: el.getAttribute('aria-hidden'), background: getComputedStyle(el).backgroundImage })),
        groups: [...section.querySelectorAll('[data-skill-group]')].map((el) => ({ key: el.dataset.skillGroup, heading: el.querySelector('h3').textContent,
          items: [...el.querySelectorAll('[data-skill-item] > span:first-child')].map((item) => item.textContent), rect: el.getBoundingClientRect().toJSON(),
          shadow: getComputedStyle(el).boxShadow, background: getComputedStyle(el).backgroundColor })),
        overflow: [...section.querySelectorAll('*')].filter((el) => { const r = el.getBoundingClientRect(); return r.width && (r.left < -1 || r.right > innerWidth + 1); }).map((el) => el.tagName),
      }));
      const model = await scene();
      assert.equal(dom.heading, locales[lang].skills.heading); assert.equal(dom.language, lang);
      assert.deepEqual(dom.legend, [...locales[lang].skills.tools, ...locales[lang].skills.technical]);
      assert.equal(dom.groups.length, 3); assert.equal(dom.bars.length, 18);
      assert(dom.bars.every((bar) => bar.aria === 'true' && bar.background.includes('linear-gradient')));
      assert.deepEqual(dom.overflow, []);
      for (const group of dom.groups) {
        assert.equal(group.heading, locales[lang].skills[`${group.key}Label`]);
        assert.deepEqual(group.items, locales[lang].skills[group.key]);
        assert.equal(group.shadow, 'none'); assert.equal(group.background, 'rgb(17, 17, 17)');
      }
      assert.equal(model.canvas, 1); assert.equal(model.section, 'skills'); assert(model.group && model.visible && !model.blackHole, `${label}: ${JSON.stringify(model)}`);
      assert.equal(model.nodes.length, 10); assert.equal(model.textures, 0); assert.equal(model.calls, 8);
      assert(model.materials.every((material) => !material.map && !material.toneMapped && material.color[0] === material.color[1] && material.color[1] === material.color[2]));
      assert(Math.abs(model.core[0] - (model.bounds.left + model.bounds.width / 2)) < 2);
      assert(Math.abs(model.core[1] - (model.bounds.top + model.bounds.height / 2)) < 2);
      assert(model.nodes.every(([x, y]) => x > model.bounds.left && x < model.bounds.right && y > model.bounds.top && y < model.bounds.bottom));
      poses.push({ label, dom, model });
    };
    const initial = await scene(); assert(!initial.group && initial.blackHole);
    await page.locator('nav a[href="#skills"]').filter({ visible: true }).click();
    await page.waitForTimeout(2800);
    await snapshot('vi-native-nav');
    const moving = (await scene()).rotation;
    await page.waitForTimeout(650);
    assert.notDeepEqual((await scene()).rotation, moving);
    const pause = page.locator('#skills [data-orbit-pause]');
    await pause.check(); const stopped = (await scene()).rotation;
    await page.waitForTimeout(650); assert.deepEqual((await scene()).rotation, stopped);
    await pause.focus(); await page.keyboard.press('Space'); assert.equal(await pause.isChecked(), false);
    await page.waitForTimeout(650); assert.notDeepEqual((await scene()).rotation, stopped);
    await page.locator('#skills-heading').click();
    const fps = await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const store = _roots.get(document.querySelector('canvas')).store;
      let frames = 0; const start = performance.now();
      const unsubscribe = store.getState().internal.subscribe({ current: () => frames++ }, 0, store);
      try { await new Promise((resolve) => setTimeout(resolve, 2000)); return { frames, fps: frames * 1000 / (performance.now() - start) }; }
      finally { unsubscribe(); }
    });
    assert(fps.fps > 120, JSON.stringify(fps));
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 }); await scrollTo('#skills'); await snapshot(`vi-${width}`);
      if ([320, 1440].includes(width)) await page.screenshot({ path: `outputs/task-2.8/skills-${width}.png` });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    for (let cycle = 0; cycle < 3; cycle++) {
      await scrollTo('#education'); const out = await scene(); assert(!out.group && out.blackHole, JSON.stringify(out));
      await scrollTo('#skills'); const inside = await scene(); assert(inside.group && !inside.blackHole);
      lifecycle.push({ out, inside });
    }
    assert(lifecycle.every(({ inside }) => inside.geometries === 8 && inside.textures === 0 && inside.subscribers === lifecycle[0].inside.subscribers));
    await scrollTo('#skills [data-skill-group="competencies"]', 80);
    assert((await page.locator('#skills [data-skill-group]').evaluateAll((items) => items.map((el) => getComputedStyle(el).opacity))).every((opacity) => opacity === '1'));
    assert.equal((await scene()).visible, false, 'Offscreen model window does not draw or rotate');
    await page.screenshot({ path: 'outputs/task-2.8/skills-cards.png' });
    await page.mouse.wheel(0, -160); await page.waitForTimeout(700);
    await page.locator('nav button[aria-controls="stellar-menu"]').click();
    await page.getByRole('button', { name: 'En', exact: true }).click();
    await page.keyboard.press('Escape'); await page.waitForTimeout(1000);
    await scrollTo('#skills'); await snapshot('en-menu-toggle', 'en');
    await page.screenshot({ path: 'outputs/task-2.8/skills-en.png' });
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(800); await scrollTo('#skills');
    const frozen = (await scene()).rotation; await page.waitForTimeout(700); assert.deepEqual((await scene()).rotation, frozen);
    await snapshot('en-reduced-motion', 'en');
    await page.screenshot({ path: 'outputs/task-2.8/skills-reduced-desktop.png' });
    const reduced = await page.evaluate(async () => {
      const { gsap, ScrollTrigger, ScrollSmoother } = await import('/src/hooks/useGSAPSetup.js'); const section = document.getElementById('skills');
      return { triggers: ScrollTrigger.getAll().filter((trigger) => section.contains(trigger.trigger)).length,
        tweens: gsap.getTweensOf(section.querySelectorAll('[data-skill-group]')).length, smoother: !!ScrollSmoother.get(),
        styles: [...section.querySelectorAll('[data-skill-group]')].map((el) => ({ opacity: getComputedStyle(el).opacity, transform: getComputedStyle(el).transform })) };
    });
    assert.equal(reduced.triggers, 0); assert.equal(reduced.tweens, 0); assert.equal(reduced.smoother, false);
    assert(reduced.styles.every((style) => style.opacity === '1' && style.transform === 'none'));
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(800); await scrollTo('#skills');
    const resume = (await scene()).rotation; await page.waitForTimeout(650); assert.notDeepEqual((await scene()).rotation, resume);
    await page.setViewportSize({ width: 320, height: 900 }); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.reload();
    await page.waitForFunction(() => !document.body.classList.contains('loading-lock'), { polling: 50 }); await scrollTo('#skills');
    await snapshot('vi-mobile-reduced-fresh'); await page.screenshot({ path: 'outputs/task-2.8/skills-mobile-reduced.png' });
    const accessible = await page.locator('#skills').ariaSnapshot();
    assert(!accessible.includes('progressbar')); for (const value of PORTFOLIO_DATA.skills) assert(accessible.includes(value));
    const renderer = await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js'); const gl = _roots.get(document.querySelector('canvas')).store.getState().gl.getContext();
      return gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL);
    });
    const sections = [];
    for (const id of ['about', 'skills', 'education', 'experience', 'work', 'playground', 'transmission']) {
      await scrollTo(`#${id}`);
      const current = (await scene()).section; assert.equal(current, id); sections.push(current);
    }
    const appErrors = [...errors]; assert.deepEqual(appErrors, []);
    await page.goto('http://127.0.0.1:5173/3d-lab.html'); await page.waitForTimeout(2000);
    const lab = await page.evaluate(async () => {
      const { _roots } = await import('/node_modules/.vite/deps/@react-three_fiber.js');
      const scene = _roots.get(document.querySelector('canvas')).store.getState().scene;
      return { canvas: document.querySelectorAll('canvas').length, blackHole: !!scene.getObjectByName('black-hole'), orbital: !!scene.getObjectByName('orbital-skills') };
    });
    assert.equal(lab.canvas, 1); assert(lab.blackHole && !lab.orbital);
    const labErrors = errors.slice(appErrors.length);
    assert(labErrors.every((error) => error.includes('404') && error.includes('/favicon.ico')), JSON.stringify(labErrors));
    writeFileSync(new URL('./browser-results.json', import.meta.url), JSON.stringify({ initial, poses, lifecycle, fps, reduced, accessible, renderer, sections, lab: { ...lab, errors: labErrors }, errors: appErrors, warnings: [...new Set(warnings)] }, null, 2));
    console.log(`PASS: ${poses.length} Browser poses; 10 nodes/one Canvas, native Nav/pause/keyboard, activation/cleanup/reduced-motion, 7/7 native sections + lab scene, ${fps.fps.toFixed(1)}fps, 0 App console errors; lab favicon baseline: ${labErrors.length}`);
  } finally { await browser.close(); }
}
