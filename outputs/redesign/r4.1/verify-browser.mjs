import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const out = new URL('./', import.meta.url);
const path = name => new URL(name, out).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(path('screenshots/'), { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const results = [], errors = [], warnings = [], costs = [], lifecycle = [], requests = [];
function monitor() {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); if (m.type() === 'warning') warnings.push(m.text()); });
  page.on('response', r => { if (r.url().includes('/logos/mono/')) requests.push({ url: r.url(), status: r.status() }); });
}
monitor();
await context.tracing.start({ screenshots: true, snapshots: true });
async function init(chapter = 'skills') {
  await page.goto(`http://127.0.0.1:5173/3d-lab.html?story=1&chapter=${chapter}&p=.25`);
  await page.waitForSelector('[data-symbol-choice]');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(x => x.name);
    const loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const { _roots, addEffect, addAfterEffect } = await import(loaded('/@react-three_fiber.js'));
    const { useScrollStore } = await import(loaded('/src/stores/useScrollStore.js'));
    const { storyCameraPath } = await import(loaded('/src/3d/utils/cameraPath.js'));
    const { ScrollSmoother } = await import(loaded('/src/hooks/useGSAPSetup.js'));
    window.qa = { fiber: _roots.get(document.querySelector('canvas')).store, useScrollStore, storyCameraPath, ScrollSmoother, addEffect, addAfterEffect };
  });
}
async function snapshot(label) {
  const s = await page.evaluate(() => {
    const f = window.qa.fiber.getState(), store = window.qa.useScrollStore.getState();
    const root = f.scene.getObjectByName('symbol-stars'), pool = root.userData.pool;
    const points = f.scene.getObjectByName('symbol-pool'), links = f.scene.getObjectByName('symbol-links');
    const logos = root.getObjectsByProperty('isMesh', true).map(mesh => ({ name: mesh.name, visible: mesh.visible,
      opacity: mesh.material.opacity, aspect: mesh.scale.x / mesh.scale.y, orientation: mesh.quaternion.toArray(), map: Boolean(mesh.material.map?.image), position: mesh.position.toArray() }));
    const anchor = root.getObjectByName('symbol-anchor');
    let error = 0, baseError = 0;
    for (let i = 0; i < pool.positions.length; i++) { error = Math.max(error, Math.abs(pool.positions[i] - pool.goal[i])); baseError = Math.max(baseError, Math.abs(pool.positions[i] - pool.base[i])); }
    const pose = window.qa.storyCameraPath(store.storyChapter, store.chapterProgress, {}, matchMedia('(prefers-reduced-motion: reduce)').matches, innerWidth / innerHeight);
    const gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    const bounds = document.querySelector(`[data-symbol-anchor="${store.storyChapter}"]`)?.getBoundingClientRect();
    const projected = anchor.position.clone().project(f.camera);
    const anchorError = bounds ? Math.max(Math.abs((projected.x+1)*innerWidth/2-bounds.x-bounds.width/2), Math.abs((1-projected.y)*innerHeight/2-bounds.y-bounds.height/2)) : null;
    return { chapter: store.storyChapter, progress: store.chapterProgress, active: root.visible, anchorVisible: anchor.visible,
      target: pool.target?.id ?? null, formation: pool.formation, lines: pool.lines, logo: pool.logo, settled: pool.settled, phase: pool.phase, updates: pool.updates,
      error, baseError, poolCount: points.geometry.attributes.position.count, positionVersion: points.geometry.attributes.position.version,
      renderedEdges: links.geometry.drawRange.count / 2, lineOpacity: links.material.opacity, logos,
      visibleLogos: logos.filter(l => l.visible).length, positions: [...pool.positions],
      canvas: document.querySelectorAll('canvas').length, writers: f.internal.subscribers.filter(x => x.priority === -1).length,
      subscribers: f.internal.subscribers.length, memory: { ...f.gl.info.memory }, calls: f.gl.info.render.calls, glError: gl.getError(),
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, hidden: document.hidden, smoother: Boolean(window.qa.ScrollSmoother.get()),
      poseError: Math.max(Math.abs(pose.x - f.camera.position.x), Math.abs(pose.y - f.camera.position.y), Math.abs(pose.z - f.camera.position.z)),
      anchor: bounds && [bounds.x, bounds.y, bounds.width, bounds.height], anchorError, smoothDuration: window.qa.ScrollSmoother.get()?.smooth() ?? 0,
      viewport: [innerWidth, innerHeight], dpr: f.gl.getPixelRatio(),
      gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), overflow: document.documentElement.scrollWidth - innerWidth };
  });
  assert.equal(s.canvas, 1, label); assert.equal(s.writers, 1, label); assert.equal(s.glError, 0, label); assert.equal(s.poolCount, 192, label);
  assert.equal(s.overflow, 0, label); assert(s.poseError < 1e-8, label); assert(s.visibleLogos <= 3, label); assert(s.positions.every(Number.isFinite), label);
  if(s.active) assert(s.anchorError < .001, `${label} DOM/world anchor error ${s.anchorError}px`);
  for (const logo of s.logos.filter(l => l.visible)) assert.deepEqual(logo.orientation, [0, 0, 0, 1], 'logos stay upright');
  results.push({ label, ...s }); return s;
}
async function seek(chapter, progress = .25) {
  await page.locator('#lab-chapter').selectOption(chapter);
  const slider = page.locator('#lab-scrub');
  await slider.press('Home');
  if(progress === 1) await slider.press('End');
  else if(progress > 0) { const rect = await slider.boundingBox(); await slider.click({position:{x:8+(rect.width-16)*progress,y:rect.height/2}}); }
  await page.mouse.move(2, 2);
  await page.waitForTimeout(120);
}
async function select(id) { await page.locator(`[data-symbol-choice="${id}"]`).focus(); await page.keyboard.press('Enter'); }
async function reset() { await page.locator('[data-symbol-reset]').click(); await page.mouse.move(2, 2); }
async function shot(name) { await page.screenshot({ path: path(`screenshots/${name}.png`) }); }
async function perf(label) {
  const value = await page.evaluate(async () => {
    const { fiber, addEffect, addAfterEffect } = window.qa, f = fiber.getState(), gl = f.gl.getContext();
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2'), gpu = [], queries = [];
    const frames = [], start = performance.now(), autoReset = f.gl.info.autoReset;
    let pending = null, calls = 0, triangles = 0, points = 0;
    f.gl.info.autoReset = false;
    const before = addEffect(() => {
      f.gl.info.reset();
      if(ext && frames.length % 30 === 0 && queries.length < 20) { pending = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT,pending); }
    });
    const stop = addAfterEffect(() => {
      if(pending) { gl.endQuery(ext.TIME_ELAPSED_EXT); queries.push(pending); pending = null; }
      frames.push(performance.now()); calls = f.gl.info.render.calls; triangles = f.gl.info.render.triangles; points = f.gl.info.render.points;
    });
    await new Promise(resolve => setTimeout(resolve, 1500)); before(); stop(); f.gl.info.autoReset = autoReset;
    for (const q of queries) {
      if (gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) && !gl.getParameter(ext.GPU_DISJOINT_EXT)) gpu.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6);
      gl.deleteQuery(q);
    }
    gpu.sort((a,b) => a-b);
    return { fps: (frames.length - 1) * 1000 / (frames.at(-1) - frames[0]), frames: frames.length, wallMs: performance.now()-start,
      gpuSampleCount: gpu.length, gpuMedianMs: gpu[Math.floor(gpu.length/2)] ?? null, gpuP95Ms: gpu[Math.floor(gpu.length*.95)] ?? null,
      memory: { ...f.gl.info.memory }, calls, triangles, points };
  });
  costs.push({ label, ...value }); assert(value.fps > 120, label); return value;
}
try {
  await init(); await snapshot('idle base'); await shot('1440-base');
  for (const id of ['figma','photoshop','illustrator','after-effects','premiere-pro','davinci-resolve','ai']) {
    await select(id); await page.waitForTimeout(180); const start = await snapshot(`${id} stars first`); assert.equal(start.logo, 0); assert.equal(start.lines, 0);
    await page.waitForTimeout(500); const middle = await snapshot(`${id} faint links`); assert(middle.lines > 0); assert.equal(middle.logo, 0);
    await page.waitForTimeout(1000); const full = await snapshot(`${id} complete`); assert.equal(full.target, id); assert.equal(full.visibleLogos, id === 'ai' ? 3 : 1); assert(full.error < .00001);
    await shot(`1440-${id}`); await reset(); await page.waitForTimeout(1400); const base = await snapshot(`${id} exact return`); assert.equal(base.baseError, 0); assert.equal(base.renderedEdges, 0); assert.equal(base.visibleLogos, 0);
  }
  await select('ai'); await page.waitForTimeout(1800); const ai = await snapshot('AI orbit begins'); await page.waitForTimeout(500); const next = await snapshot('AI orbit delta'); assert(next.phase > ai.phase); await perf('AI orbit high');
  await reset();
  for (let i = 0; i < 12; i++) { await select(['figma','ai','after-effects','photoshop'][i%4]); await page.waitForTimeout(35); }
  await page.waitForTimeout(1600); const rapid = await snapshot('12 rapid swaps'); assert.equal(rapid.target, 'photoshop'); assert.equal(rapid.visibleLogos, 1);
  await reset(); await page.waitForTimeout(300); await select('illustrator'); await page.waitForTimeout(1600); const reversed = await snapshot('return interrupted and reversed'); assert.equal(reversed.target, 'illustrator'); assert.equal(reversed.error, 0);
  await page.keyboard.press('Escape'); await page.waitForTimeout(1400); const escaped = await snapshot('Escape reset'); assert.equal(escaped.baseError, 0);
  await page.locator('[data-symbol-choice="figma"]').focus(); await page.waitForTimeout(1600); await snapshot('keyboard focus');
  await page.locator('[data-symbol-controls]').focus(); await page.waitForTimeout(1400); assert.equal((await snapshot('blur returns')).baseError, 0);
  await seek('education');
  for (const [id, edgeCount] of [['saigonUniversity',2],['greenAcademy',1],['arenaMultimedia',2]]) {
    await select(id); await page.waitForTimeout(1600); const full = await snapshot(`${id} real geometry`); assert.equal(full.error, 0); assert.equal(full.renderedEdges, edgeCount); assert.equal(full.visibleLogos, 0); await shot(`1440-${id}`);
    await reset(); await page.waitForTimeout(1400); assert.equal((await snapshot(`${id} return`)).baseError, 0);
  }
  await seek('skills'); await select('ai'); await page.waitForTimeout(1800);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(250); const reduced = await snapshot('live reduced AI'); await shot('1440-reduced-ai');
  await page.waitForTimeout(400); const still = await snapshot('reduced holds buffer'); assert.equal(still.phase, reduced.phase); assert.equal(still.positionVersion, reduced.positionVersion); assert.equal(still.smoother, false);
  await seek('education'); await select('saigonUniversity'); await page.waitForTimeout(100); const eduReduced = await snapshot('reduced Education'); assert.equal(eduReduced.error,0); assert.equal(eduReduced.logo,0); assert.equal(eduReduced.lines,1);
  await reset(); await page.waitForTimeout(100); assert.equal((await snapshot('reduced instant return')).baseError,0);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(350); await seek('skills'); await select('ai'); await page.waitForTimeout(1800);
  const beforeHidden = await snapshot('before hidden');
  await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(150); const hidden = await snapshot('hidden simulated'); await page.waitForTimeout(400); const held = await snapshot('hidden holds'); assert.equal(hidden.phase,held.phase); assert.equal(hidden.updates,held.updates);
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(100); const resumed = await snapshot('visible resumes'); assert(resumed.phase-beforeHidden.phase < .025);
  await seek('about'); const inactive = await snapshot('offsection reset'); await page.waitForTimeout(350); const idle = await snapshot('offsection stops'); assert.equal(idle.baseError,0); assert.equal(idle.updates,inactive.updates); assert.equal(idle.active,false);
  await seek('skills'); await select('figma'); await page.waitForTimeout(1600);
  await seek('skills',.99); const outside = await snapshot('anchor offscreen'); assert.equal(outside.baseError,0); assert.equal(outside.active,false);
  await seek('skills',.25); await select('ai'); await page.waitForTimeout(1800);
  for (let i=0;i<3;i++) {
    await page.locator('[data-lab-controls] details').evaluate(element=>{element.open=true;});
    await page.locator('#lab-mode').click(); await page.waitForTimeout(200);
    const removed = await page.evaluate(()=>{const f=window.qa.fiber.getState(); return {root:Boolean(f.scene.getObjectByName('symbol-stars')), memory:{...f.gl.info.memory},subscribers:f.internal.subscribers.length};}); assert.equal(removed.root,false);
    await page.locator('[data-lab-controls] details').evaluate(element=>{element.open=true;}); await page.locator('#lab-mode').click(); await page.waitForTimeout(350); await seek('skills'); await select('figma'); await page.waitForTimeout(1600);
    const mounted = await snapshot(`lifecycle ${i+1}`); lifecycle.push({removed,mountedMemory:mounted.memory,subscribers:mounted.subscribers});
  }
  assert.deepEqual(lifecycle[0],lifecycle[2]);
  for(const width of [320,390,768,1024,1440,1920]) {
    await page.setViewportSize({width,height:width<768?844:900}); await page.waitForTimeout(250); await seek('skills',.25); await select('ai'); await page.waitForTimeout(1700); await snapshot(`${width} AI responsive`); await shot(`${width}-ai`);
    await seek('education',.25); await select('arenaMultimedia'); await page.waitForTimeout(1600); await snapshot(`${width} Education responsive`); if(width===390) await shot('390-education');
  }
  await page.setViewportSize({width:390,height:844}); await page.waitForTimeout(200); await seek('skills');
  await page.locator('[data-lab-controls] details').evaluate(element=>{element.open=true;}); await page.locator('#lab-language').click(); await page.waitForTimeout(250); await snapshot('English keeps camera');
  await select('ai'); await page.waitForTimeout(1700); await perf('AI mobile viewport low');
  assert.equal(errors.length,0, errors.join('\n')); assert(requests.every(r=>r.status===200), 'logo URLs decode');
  writeFileSync(path('browser-results.json'),JSON.stringify({status:'pass',date:new Date().toISOString(),browser:browser.version(),results,errors,warnings,costs,lifecycle,requests},null,2));
  console.log(JSON.stringify({status:'pass',records:results.length,errors,warnings:[...new Set(warnings)],costs,lifecycle,logoRequests:requests.length},null,2));
} catch(error) {
  await shot('failure'); writeFileSync(path('browser-failure.json'),JSON.stringify({error:error.stack,results,errors,warnings,costs,lifecycle,requests},null,2)); throw error;
} finally { await context.tracing.stop({path:path('trace.zip')}); await browser.close(); }
