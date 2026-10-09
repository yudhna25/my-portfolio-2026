import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'file:///C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const out = 'outputs/redesign/r3.3', result = { started: new Date().toISOString(), samples: [], errors: [] };
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', e => result.errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') result.errors.push(m.text()); });
try {
  await page.goto('http://127.0.0.1:5173/#about'); await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(e => e.name), url = name => urls.filter(u => u.includes(name)).at(-1);
    const fiber = await import(url('/@react-three_fiber.js'));
    const store = fiber._roots.get(document.querySelector('canvas')).store, gl = store.getState().gl, render = gl.render.bind(gl);
    window.qa = { ...fiber, store, rayCalls: 0 };
    gl.render = (scene, camera) => { if (scene.children[0]?.material?.uniforms?.uObserver) qa.rayCalls++; return render(scene, camera); };
  });
  for (const mode of ['idle', 'portrait hover / lens']) {
    if (mode !== 'idle') await page.locator('#about button').hover(); else await page.mouse.move(20, 80);
    await page.waitForTimeout(400);
    const sample = await page.evaluate(() => new Promise(resolve => {
      const start = performance.now(), ray = qa.rayCalls; let frames = 0; const stop = qa.addAfterEffect(() => frames++);
      setTimeout(() => { stop(); const f = qa.store.getState(), gl = f.gl.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info'), ms = performance.now() - start;
        resolve({ frames, ms, fps: frames * 1000 / ms, rayCalls: qa.rayCalls - ray, dpr: f.gl.getPixelRatio(), size: [innerWidth, innerHeight], gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), drawCalls: f.gl.info.render.calls, geometries: f.gl.info.memory.geometries, textures: f.gl.info.memory.textures, glError: gl.getError(), lens: document.querySelector('[data-cursor-lens]')?.dataset.active }); }, 3000);
    }));
    assert.ok(Math.abs(sample.frames - sample.rayCalls) <= 1); assert.equal(sample.glError, 0); result.samples.push({ mode, ...sample });
  }
  assert.deepEqual(result.errors, []); result.finished = new Date().toISOString();
  fs.writeFileSync(`${out}/performance-results.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
} finally { await browser.close(); }
