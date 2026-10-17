import { chromium, edge, base, save, out } from './common.mjs';
const b = await chromium.launch({ executablePath: edge, headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', e => errors.push(e.message));
p.on('console', m => errors.push(m.type() + ': ' + m.text()));
await p.goto(base); await p.waitForTimeout(7000);
const data = await p.evaluate(async () => {
  const c = document.querySelector('canvas');
  let fiber = c?.[Object.keys(c).find(k => k.startsWith('__reactFiber$'))];
  const hooks = [];
  while (fiber) {
    for (let h = fiber.memoizedState; h; h = h.next) hooks.push(Object.keys(h.memoizedState?.current ?? {}));
    fiber = fiber.return;
  }
  const urls = performance.getEntriesByType('resource').map(e => e.name).filter(u => /\/assets\/.*\.js$/.test(u));
  const mods = [];
  for (const u of urls) {

    const m = await import(u);
    mods.push({ u, exports: Object.entries(m).map(([k,v]) => ({ k, type: typeof v, keys: Object.keys(v ?? {}), state: typeof v?.getState === 'function' ? Object.keys(v.getState()) : null })) });
  }
  return { body: document.body.innerText, canvas: !!c, hooks, mods };
});
save('probe.json', { errors, data });
await p.screenshot({ path: out + '/probe.png' }); await b.close();
