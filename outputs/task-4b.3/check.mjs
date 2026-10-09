import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
const base = process.env.STELLAR_QA_URL ?? 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--autoplay-policy=user-gesture-required'] });
const results = { checks: [], live: {}, offline: [], layouts: [], errors: [], warnings: [], audioRequests: [] };
const check = (value, label) => { assert(value, label); results.checks.push(label); };
function watch(page) {
  page.on('pageerror', error => results.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') results.errors.push(message.text()); if (message.type() === 'warning') results.warnings.push(message.text()); });
  page.on('request', request => { if (/\.(mp3|wav|ogg|aac|flac|m4a)(\?|$)/i.test(request.url())) results.audioRequests.push(request.url()); });
  page.on('response', response => { if (response.headers()['content-type']?.startsWith('audio/')) results.audioRequests.push(response.url()); });
}
// Instrument native nodes without substituting the live AudioContext or its DSP.
function traceAudio() {
  const NativeAudioContext = window.AudioContext;
  window.audioQA = { contexts: [], nodes: [], ramps: [], starts: [], stops: [], disconnects: [], listeners: 0 };
  const visibilityListeners = new Set();
  const add = document.addEventListener.bind(document), remove = document.removeEventListener.bind(document);
  document.addEventListener = (type, callback, options) => { if (type === 'visibilitychange' && callback.name === 'handleVisibility') { visibilityListeners.add(callback); window.audioQA.listeners = visibilityListeners.size; } return add(type, callback, options); };
  document.removeEventListener = (type, callback, options) => { if (type === 'visibilitychange' && callback.name === 'handleVisibility') { visibilityListeners.delete(callback); window.audioQA.listeners = visibilityListeners.size; } return remove(type, callback, options); };
  window.AudioContext = new Proxy(NativeAudioContext, {
    construct(Target, args) {
      const context = new Target(...args), qa = window.audioQA;
      qa.contexts.push(context);
      for (const method of ['createGain', 'createBiquadFilter', 'createOscillator']) {
        const create = context[method].bind(context);
        context[method] = (...args) => {
          const node = create(...args), id = qa.nodes.length;
          qa.nodes.push(node);
          const connect = node.connect.bind(node), disconnect = node.disconnect.bind(node);
          node.disconnect = (...args) => { qa.disconnects.push(id); return disconnect(...args); };
          node.connect = (...args) => {
            if (args[0] === context.destination) {
              qa.master = node; qa.analyser = context.createAnalyser(); qa.analyser.fftSize = 8192; connect(qa.analyser);
            }
            return connect(...args);
          };
          if (node.gain) {
            const ramp = node.gain.linearRampToValueAtTime.bind(node.gain);
            node.gain.linearRampToValueAtTime = (value, time) => { qa.ramps.push({ id, value, time, now: context.currentTime }); return ramp(value, time); };
          }
          if (node.start) {
            const start = node.start.bind(node), stop = node.stop.bind(node);
            node.start = (...args) => { qa.starts.push({ id, type: node.type, frequency: node.frequency.value, time: args[0] ?? context.currentTime }); return start(...args); };
            node.stop = (...args) => { qa.stops.push({ id, time: args[0] ?? context.currentTime }); return stop(...args); };
          }
          return node;
        };
      }
      return context;
    },
  });
}
try {
  const vi = JSON.parse(readFileSync('src/i18n/locales/vi.json')), en = JSON.parse(readFileSync('src/i18n/locales/en.json'));
  assert.deepEqual(Object.keys(vi.common.audio), Object.keys(en.common.audio));
  check(!/fetch\(|new Audio\(|decodeAudioData|AudioBufferSourceNode/.test(readFileSync('src/lib/audioEngine.js','utf8')), 'procedural engine: no media fetch/decoder');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  await context.addInitScript(traceAudio);
  const page = await context.newPage(); watch(page);
  await page.goto(base); await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  const sound = page.locator('[data-sound-toggle]');
  check(await sound.getAttribute('aria-checked') === 'false', 'fresh visit Sound OFF');
  await page.keyboard.press('Tab'); check(await page.evaluate(() => document.activeElement.getAttribute('href') === '#smooth-content'), 'first Tab remains skip link');
  await page.getByRole('button', { name: 'Mở menu điều hướng', exact: true }).click(); await page.keyboard.press('Escape');
  await page.locator('button[title][aria-label]:not([aria-controls]):not([data-sound-toggle])').click();
  check(await page.evaluate(() => audioQA.contexts.length) === 0, 'Menu/Theme while OFF never create context');
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(entry => entry.name);
    const loaded = name => urls.filter(url => url.includes(name)).at(-1);
    audioQA.engine = await import(loaded('/src/lib/audioEngine.js'));
    audioQA.store = (await import(loaded('/src/stores/useAudioStore.js'))).useAudioStore;
  });
  check(await page.evaluate(() => audioQA.engine.playRadioClick() === false && audioQA.engine.getAudioContext() === null), 'click helper is lazy and muted');
  // Expire transient activation; arbitrary script must not create the first context.
  await page.evaluate(() => { setTimeout(async () => { audioQA.timerActivation = navigator.userActivation.isActive; audioQA.timerStart = await audioQA.engine.startSpaceDrone(); }, 6000); });
  await page.waitForTimeout(6500);
  check(await page.evaluate(() => audioQA.timerActivation === false && audioQA.timerStart === false && audioQA.contexts.length === 0), 'script outside user activation cannot start audio');
  await sound.click(); await page.waitForFunction(() => document.querySelector('[data-sound-toggle]').getAttribute('aria-checked') === 'true');
  await page.waitForTimeout(300);
  check(await page.evaluate(() => audioQA.engine.getAudioContext().state) === 'running', 'trusted Sound click → audioCtx.state running');
  check(await page.evaluate(() => audioQA.contexts.length === 1 && audioQA.listeners === 1), 'singleton context + one visibility listener');
  const drone = await page.evaluate(() => audioQA.starts.filter(source => source.type === 'sine').map(source => source.frequency));
  check(drone.length === 3 && drone.every((frequency, index) => Math.abs(frequency - [43.65,55,0.07][index]) < 0.00001), 'two sub-bass frequencies + 0.07Hz filter LFO'); results.live.drone = drone;
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('stellar-audio')).state.isMuted === false), 'ON preference persisted');
  const squareCount = () => page.evaluate(() => audioQA.starts.filter(source => source.type === 'square').length);
  let clicks = await squareCount();
  await page.getByRole('button', { name: 'Mở menu điều hướng', exact: true }).click(); await page.keyboard.press('Escape');
  check(await squareCount() === clicks + 1, 'Menu emits one radio click'); clicks++;
  await page.locator('button[title][aria-label]:not([aria-controls]):not([data-sound-toggle])').click();
  check(await squareCount() === clicks + 1, 'Theme emits one radio click'); clicks++;
  await page.evaluate(() => document.querySelector('#work a[href]').addEventListener('click', event => event.preventDefault(), { once: true }));
  await page.locator('#work a[href]').click();
  check(await squareCount() === clicks + 1, 'Project link emits one radio click (navigation intercepted)');
  results.live.signal = await page.evaluate(async () => {
    const samples = new Float32Array(audioQA.analyser.fftSize); let peak = 0, sum = 0, count = 0;
    for (let i = 0; i < 120; i++) {
      audioQA.engine.playRadioClick(); audioQA.analyser.getFloatTimeDomainData(samples);
      for (const sample of samples) { peak = Math.max(peak, Math.abs(sample)); sum += sample * sample; count++; }
      await new Promise(resolve => setTimeout(resolve, 16));
    }
    return { peak, rms: Math.sqrt(sum / count), dBFS: 20 * Math.log10(peak) };
  });
  check(results.live.signal.peak > 0 && results.live.signal.peak < 0.15, 'live signal has >16dB headroom, no clipping');
  await page.evaluate(() => audioQA.store.getState().toggleSound()); await page.waitForTimeout(300);
  check(await page.evaluate(() => audioQA.engine.getAudioContext().state === 'suspended' && audioQA.master.gain.value === 0), 'OFF fades to exact zero then suspends DSP');
  results.live.clicks = await page.evaluate(() => audioQA.starts.filter(source => source.type === 'square').map(source => ({ duration: audioQA.stops.find(stop => stop.id === source.id).time - source.time, disconnected: audioQA.disconnects.includes(source.id) })));
  check(results.live.clicks.every(click => Math.abs(click.duration - 0.005) < 0.000001), 'every radio oscillator stops after exact 5ms');
  check(results.live.clicks.every(click => click.disconnected), 'every completed radio oscillator disconnects');
  const ramp = await page.evaluate(() => audioQA.ramps.filter(ramp => ramp.id === 0).at(-1));
  check(Math.abs(ramp.time - ramp.now - 0.2) < 0.000001 && ramp.value === 0, 'mute uses exact 0.2s gain ramp');
  await page.keyboard.press('Control+Home'); await page.waitForTimeout(1400); await sound.press('Enter'); await page.waitForTimeout(300);
  check(await sound.getAttribute('aria-checked') === 'true', 'Enter enables Sound');
  await sound.press('Space'); await page.waitForTimeout(300); check(await sound.getAttribute('aria-checked') === 'false', 'Space mutes Sound');
  for (let i = 0; i < 12; i++) { await sound.press('Space'); await page.waitForTimeout(40); }
  await page.waitForTimeout(300);
  check(await page.evaluate(() => audioQA.contexts.length === 1 && audioQA.contexts[0].state === 'suspended'), '12 rapid toggles reuse singleton and settle muted');
  await sound.click(); await page.waitForTimeout(350);
  await page.screenshot({ path: 'outputs/task-4b.3/sound-desktop.png' });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(300);
  check(await page.evaluate(() => audioQA.contexts[0].state === 'suspended' && audioQA.master.gain.value === 0), 'hidden tab fades/suspends (visibility simulated)');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(300);
  check(await page.evaluate(() => audioQA.contexts.length === 1 && audioQA.contexts[0].state === 'running'), 'visible tab reuses previously consented context');
  await page.reload(); await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
  check(await sound.getAttribute('aria-checked') === 'false' && await page.evaluate(() => audioQA.contexts.length) === 0, 'reload with saved ON stays silent/OFF until another Sound click');
  // Real React StrictMode mount/unmount of SoundToggle, using the existing runtime.
  await page.evaluate(async () => {
    const urls = performance.getEntriesByType('resource').map(entry => entry.name), loaded = name => urls.filter(url => url.includes(name)).at(-1);
    const reactModule = await import(loaded('/node_modules/.vite/deps/react.js'));
    const React = reactModule.default ?? reactModule;
    const domModule = await import(loaded('/node_modules/.vite/deps/react-dom_client.js'));
    const { createRoot } = domModule.default ?? domModule;
    const { SoundToggle } = await import(loaded('/src/components/ui/SoundToggle.jsx'));
    const container = document.createElement('div'); container.id = 'audio-fixture'; container.className = 'fixed bottom-4 left-4 z-[10000] bg-black'; document.body.append(container);
    audioQA.root = createRoot(container); audioQA.root.render(React.createElement(React.StrictMode, null, React.createElement(SoundToggle)));
  });
  await page.locator('#audio-fixture [data-sound-toggle]').click(); await page.waitForTimeout(300);
  await page.evaluate(() => audioQA.root.unmount()); await page.waitForTimeout(100);
  check(await page.evaluate(() => audioQA.contexts[0].state === 'closed' && audioQA.listeners === 0), 'StrictMode unmount closes context and removes listener');
  check(await page.evaluate(() => audioQA.starts.filter(source => source.type === 'sine').every(source => audioQA.stops.some(stop => stop.id === source.id) && audioQA.disconnects.includes(source.id))), 'unmount stops/disconnects both drone oscillators and LFO');
  await sound.click(); await page.waitForTimeout(300); check(await page.evaluate(() => audioQA.contexts.length === 2 && audioQA.contexts[1].state === 'running'), 're-enable after disposal creates one fresh context');
  console.log('PASS live autoplay, consent, signal, rapid toggles and StrictMode lifecycle');
  await context.close();

  for (const scenario of ['unsupported','resumeRejected','blockedStorage','corruptStorage']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); await context.addInitScript(traceAudio);
    await context.addInitScript(scenario => {
      if (scenario === 'unsupported') window.AudioContext = window.webkitAudioContext = undefined;
      if (scenario === 'resumeRejected') window.AudioContext.prototype.resume = () => Promise.reject(new DOMException('Denied', 'NotAllowedError'));
      if (scenario === 'blockedStorage') for (const method of ['getItem','setItem']) { const original = Storage.prototype[method]; Storage.prototype[method] = function(name, ...args) { if (name === 'stellar-audio') throw new DOMException('Denied','SecurityError'); return original.call(this,name,...args); }; }
      if (scenario === 'corruptStorage') localStorage.setItem('stellar-audio', JSON.stringify({ state: { isMuted: 'bad', isStarted: true, isPending: true }, version: 0 }));
    }, scenario);
    const page = await context.newPage(); watch(page); await page.goto(base); await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
    check(await page.locator('[data-sound-toggle]').getAttribute('aria-checked') === 'false', `${scenario}: starts OFF`);
    await page.locator('[data-sound-toggle]').click(); await page.waitForTimeout(350);
    if (scenario === 'unsupported' || scenario === 'resumeRejected') {
      check(await page.locator('[data-sound-toggle]').getAttribute('aria-checked') === 'false' && await page.locator('[role="status"]').last().textContent() !== '', `${scenario}: accessible error, no audible ON`);
      if (scenario === 'resumeRejected') check(await page.evaluate(() => audioQA.contexts.every(context => context.state === 'closed')), 'resume rejection disposes context');
    } else check(await page.locator('[data-sound-toggle]').getAttribute('aria-checked') === 'true', `${scenario}: Sound still works`);
    await context.close();
  }

  // Render the actual engine graph through native OfflineAudioContext: no recording/file asset.
  for (const mode of ['drone','clickBurst','fade','rapidRamp']) {
    const context = await browser.newContext(); const page = await context.newPage(); watch(page);
    await page.route(base, route => route.fulfill({ contentType: 'text/html', body: '<html><head><link rel="icon" href="data:,"></head><body><button id="render">Render test</button></body></html>' }));
    await page.goto(base);
    await page.evaluate(async ({ engineSource, mode }) => {
      window.AudioContext = class extends OfflineAudioContext {
        constructor() { super(2, 48000 * 2, 48000); this.testTime = 0; window.renderContext = this; }
        get currentTime() { return this.testTime; }
        get state() { return 'running'; }
        resume() { return Promise.resolve(); }
        suspend() { return Promise.resolve(); }
        close() { return Promise.resolve(); }
      };
      const moduleUrl = URL.createObjectURL(new Blob([engineSource], { type: 'text/javascript' }));
      window.renderEngine = await import(moduleUrl); URL.revokeObjectURL(moduleUrl);
      document.querySelector('#render').onclick = async () => {
        await renderEngine.startSpaceDrone();
        if (mode === 'clickBurst') { renderContext.testTime = 0.8; for (let i = 0; i < 100; i++) renderEngine.playRadioClick(); }
        if (mode === 'fade') { renderContext.testTime = 1; await renderEngine.setMuted(true); }
        if (mode === 'rapidRamp') { renderContext.testTime = 0.1; await renderEngine.setMuted(true); renderContext.testTime = 0.15; await renderEngine.setMuted(false); }
        const buffer = await renderContext.startRendering(); let peak = 0, sum = 0, tail = 0, maxDelta = 0;
        const samples = buffer.getChannelData(0);
        samples.forEach((sample, index) => { peak = Math.max(peak, Math.abs(sample)); sum += sample * sample; if (index >= 1.22 * 48000) tail = Math.max(tail, Math.abs(sample)); if (index) maxDelta = Math.max(maxDelta,Math.abs(sample-samples[index-1])); });
        window.renderResult = { mode, sampleRate: buffer.sampleRate, peak, rms: Math.sqrt(sum / samples.length), dBFS: 20 * Math.log10(peak), tail, maxDelta };
        renderEngine.disposeAudio();
      };
    }, { engineSource: readFileSync('src/lib/audioEngine.js','utf8'), mode });
    await page.locator('#render').click(); await page.waitForFunction(() => window.renderResult); const signal = await page.evaluate(() => window.renderResult); results.offline.push(signal);
    check(signal.peak > 0 && signal.peak < 0.15 && signal.maxDelta < 0.025, `${mode}: native DSP below clipping and bounded sample discontinuity`);
    if (mode === 'fade') check(signal.tail === 0, 'offline mute reaches silence after 0.2s');
    await context.close();
  }
  for (const width of [320,390,768,1024,1280,1920]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' }); const page = await context.newPage(); watch(page); await page.goto(base); await page.waitForFunction(() => !document.body.classList.contains('loading-lock'));
    const layout = await page.locator('[data-sound-toggle]').evaluate(element => { const r = element.getBoundingClientRect(), svg = element.querySelector('svg'); return { width: innerWidth, left: r.left, right: r.right, height: r.height, dialTransform: getComputedStyle(svg.parentElement).transform, overflow: document.documentElement.scrollWidth-innerWidth }; }); results.layouts.push(layout);
    check(layout.left >= 0 && layout.right <= width && layout.height >= 44 && layout.overflow === 0, `${width}px: Sound fits Nav, target >=44px, no overflow`);
    await page.locator('[data-sound-toggle]').press('Space'); await page.waitForTimeout(400);
    check(await page.locator('[data-sound-toggle]').evaluate(element => getComputedStyle(element.querySelector('svg').parentElement).transform) === layout.dialTransform, `${width}px reduced-motion: no dial rotation`);
    check(await page.locator('[data-sound-toggle]').evaluate(element => { const style = getComputedStyle(element); return document.activeElement === element && style.outlineWidth === '2px' && style.outlineOffset === '4px'; }), `${width}px: native Space retains visible focus ring`);
    if (width === 1920) {
      await page.getByRole('button', { name: 'Mở menu điều hướng', exact: true }).click();
      await page.getByRole('button', { name: 'English', exact: true }).click(); await page.keyboard.press('Escape');
      check(await page.getByRole('switch', { name: 'Space audio', exact: true }).getAttribute('title') === 'Turn space audio off', 'English switch label/action are translated');
    }
    if (width === 390) await page.screenshot({ path: 'outputs/task-4b.3/sound-mobile.png' });
    await context.close();
  }
  check(results.audioRequests.length === 0, 'zero audio requests/bytes across all scenarios');
  check(results.errors.length === 0, 'zero runtime/console errors');
  console.log(`PASS ${results.checks.length} checks; live peak ${results.live.signal.peak.toFixed(6)}; offline peaks ${results.offline.map(item => item.peak.toFixed(6)).join(', ')}; 0 audio requests`);
} finally {
  results.warnings = [...new Set(results.warnings)];
  writeFileSync('outputs/task-4b.3/browser-results.json', JSON.stringify(results,null,2));
  await browser.close();
}
