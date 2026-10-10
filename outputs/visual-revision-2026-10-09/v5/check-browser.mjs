import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium, base, out, ready, seek, poolSnapshot } from './browser-common.mjs';
const ids = ['saigonUniversity','greenAcademy','arenaMultimedia'];
fs.mkdirSync(out + '/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { started: new Date().toISOString(), browser: browser.version(), configs: [], errors: [], skills: [] };
const save = () => {
  const text = JSON.stringify(report, null, 2);
  for (let i=0;i<4;i++) try {
    fs.writeFileSync(out + '/browser-results.tmp', text); fs.renameSync(out + '/browser-results.tmp', out + '/browser-results.json'); return;
  } catch(e) { if(i===3)throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,50); }
};
let context, page, current;
async function setup(width, reduced = false, touch = false) {
  context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1,
    hasTouch: touch, reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' });
  page = await context.newPage(); page.setDefaultTimeout(45000);
  await page.routeWebSocket('**', ws => ws.send('{"type":"connected"}'));
  current = { width, reduced, touch, states: [] }; report.configs.push(current);
  page.on('pageerror', e => report.errors.push({ width, type: 'pageerror', message: e.message }));
  page.on('console', m => { if (m.type() === 'error') report.errors.push({ width, type: 'console', message: m.text() }); });
  await page.goto(base); await ready(page);
  current.environment = await page.evaluate(() => {
    const gl = v5qa.root.getState().gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), dpr: v5qa.root.getState().gl.getPixelRatio() };
  });
}
async function region(id) {
  const p = await page.evaluate(id => {
    const content = document.getElementById('smooth-content'), top = content.getBoundingClientRect().top;
    const chapter = document.querySelector('[data-story-chapter="education"]'), end = document.querySelector('[data-story-chapter="experience"]');
    const rect = document.querySelector('[data-education-stage="' + id + '"]').getBoundingClientRect();
    const y = rect.top - top - Math.max(80, (innerHeight - rect.height) * .25);
    return Math.max(0, Math.min(.98, (y - (chapter.getBoundingClientRect().top - top)) / (end.getBoundingClientRect().top - chapter.getBoundingClientRect().top)));
  }, id);
  await seek(page, 'education', p);
}
async function state(label, id) {
  const snapshot = await page.evaluate(() => {
    const scene = v5qa.root.getState().scene, store = v5qa.education.getState(), gl = v5qa.root.getState().gl;
    const pool = scene.getObjectByName('symbol-stars').userData.pool;
    return { active: store.focus ?? store.selection ?? store.hover, channels: { focus: store.focus, selection: store.selection, hover: store.hover },
      target: pool.target?.id ?? null, settled: pool.settled, formation: pool.formation,
      baseError: Math.max(...pool.positions.map((v, i) => Math.abs(v - pool.base[i]))),
      arts: ['saigonUniversity','greenAcademy','arenaMultimedia'].map(id => { const mesh = scene.getObjectByName('education-art-' + id), anchor = scene.getObjectByName('education-art-anchor-' + id);
        return { id, opacity: mesh.material.opacity, visible: mesh.visible && anchor.visible, loaded: !!mesh.material.map?.image, size: [mesh.material.map?.image.width, mesh.material.map?.image.height], pose: [...anchor.position.toArray(), ...anchor.quaternion.toArray(), ...anchor.scale.toArray()] }; }),
      memory: { ...gl.info.memory }, calls: gl.info.render.calls, canvases: document.querySelectorAll('canvas').length,
      glowVisible: scene.getObjectByName('education-link-glow').visible,
      glowVertices: scene.getObjectByName('education-link-glow').geometry.drawRange.count,
      lineOpacity: scene.getObjectByName('symbol-links').material.opacity,
      overflow: document.documentElement.scrollWidth - innerWidth };
  });
  current.states.push({ label, id, ...snapshot }); return snapshot;
}
try {
  // Regression: unchanged buffer goals, sizes, weights, logo layout, shader controls, and captured visual states.
  await setup(1440, true); await seek(page, 'skills', .2);
  const before = JSON.parse(fs.readFileSync(out + '/skills-before.json')).snapshots;
  for (const id of Object.keys(before)) {
    await page.evaluate(id => { v5qa.skills.getState().clear(); v5qa.skills.getState().interact('selection', id); }, id);
    await page.waitForTimeout(200); const after = await poolSnapshot(page);
    const u = { ...after.uniforms }; delete u.uEducation;
    assert.deepEqual({ ...after, uniforms: u }, before[id], 'Skills changed: ' + id);
    await page.screenshot({ path: out + '/screenshots/skills-after-' + id + '.png' });
    report.skills.push({ id, exactRuntimeEqual: true });
  }
  await context.close();
  for (const width of [390,768,1440]) {
    await setup(width, false, width === 390);
    await page.waitForFunction(() => [...document.querySelectorAll('[data-education-stage]')].every(e => e.dataset.educationArtStatus === 'loaded'));
    for (const id of ids) {
      await region(id); await page.mouse.move(4,4); await page.evaluate(() => { document.activeElement?.blur(); v5qa.education.getState().clear(); });
      await page.waitForTimeout(1000); const idle = await state('idle', id);
      assert(idle.arts.every(a => a.loaded)); assert(idle.arts.find(a => a.id === id).visible); assert.equal(idle.overflow,0);
      await page.screenshot({ path: `${out}/screenshots/${width}-${id}-idle.png` });
      const figure = page.locator('[data-education-figure="' + id + '"]');
      const box = await figure.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1600); const hover = await state('figure-hover', id);
      assert.equal(hover.active,id); assert.equal(hover.target,id); assert(hover.glowVisible); assert(hover.lineOpacity >= .5);
      assert(hover.arts.find(a => a.id === id).opacity >= .29);
      await page.screenshot({ path: `${out}/screenshots/${width}-${id}-active.png` });
      await page.mouse.move(4,4); await figure.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
      assert.equal((await state('figure-keyboard',id)).channels.focus,id);
      await page.mouse.move(4,4); assert.equal((await state('pointer-leave-keeps-focus',id)).active,id);
      await page.keyboard.press('Escape'); assert.equal((await state('escape',id)).active,null);
      await page.evaluate(() => document.activeElement?.blur());
      const control = page.locator('button[data-education-item="' + id + '"]');
      await control.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(300);
      assert.equal((await state('school-control',id)).active,id);
      await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement?.blur());
    }
    if (width === 390) for (const id of ids) {
      await region(id); const figure = page.locator('[data-education-figure="' + id + '"]');
      await figure.tap(); await page.waitForTimeout(300); assert.equal((await state('touch-select',id)).channels.selection,id);
      await figure.tap(); await page.waitForTimeout(300); assert.equal((await state('touch-clear',id)).active,null);
    }
    // Interrupted transitions, real input, deterministic return, and chapter visibility.
    await region(ids[0]);
    await page.evaluate(ids => { for (let i=0;i<30;i++) v5qa.education.getState().interact('hover',ids[i%3]); },ids);
    await page.waitForTimeout(1600); assert.equal((await state('rapid-switch',ids[2])).active,ids[2]);
    await page.evaluate(() => v5qa.education.getState().clear()); await page.waitForTimeout(1800);
    assert.equal((await state('return-base',null)).baseError,0);
    await seek(page,'experience',.7); await page.waitForTimeout(300); const outside=await state('scroll-out',null);
    assert.equal(outside.active,null); assert(outside.arts.every(a=>!a.visible));
    await region(ids[1]); await state('reverse-return',ids[1]);
    await page.setViewportSize({width:width===1440?768:1440,height:900}); await page.waitForTimeout(500); await region(ids[0]); await state('resize',ids[0]);
    await context.close();
  }
  await setup(390,true,true);
  for(const id of ids) {await region(id);await page.locator('[data-education-figure="'+id+'"]').tap();await page.waitForTimeout(100);
    const s=await state('reduced',id);assert.equal(s.target,id);assert(s.settled);assert.equal(s.arts.find(a=>a.id===id).opacity,.3);
    await page.evaluate(()=>v5qa.education.getState().clear());}
  await context.close();
  assert.equal(report.errors.length,0); report.status='pass';
} catch(e) { report.status='fail'; report.failure=e.stack; throw e; }
finally { report.finished=new Date().toISOString(); save(); await browser.close(); }
console.log('V5 browser matrix passed',report.configs.map(c=>[c.width,c.states.length]),'Skills',report.skills.length);
