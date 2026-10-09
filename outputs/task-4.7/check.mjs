import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const runtime = `${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules`;
const sharp = createRequire(pathToFileURL(`${runtime}/package.json`))('sharp');
const output = new URL('./', import.meta.url);
const dist = process.argv.includes('--snapshot') ? 'outputs/task-4.7/site' : 'dist';
if (process.argv.includes('--icons')) {
  const svg = (await readFile('public/favicon.svg', 'utf8')).replace('rx="112" fill="#0A0A0A"', 'fill="#050505"');
  assert(!svg.includes('rx="112"'), 'maskable background must fill the square');
  for (const size of [192, 512]) await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/pwa-maskable-${size}x${size}.png`);
  console.log('PASS: maskable PNGs rendered directly from the existing vector');
  process.exit(0);
}
const manifest = JSON.parse(await readFile(`${dist}/manifest.webmanifest`, 'utf8'));
for (const [key, value] of Object.entries({ id: '/', name: 'Trần Vũ Anh Duy — Stellar Odyssey', short_name: 'Anh Duy Portfolio', theme_color: '#050505', background_color: '#050505', display: 'standalone', start_url: '/', scope: '/' })) assert.equal(manifest[key], value, key);
assert(['any', 'portrait-primary'].includes(manifest.orientation));
const icons = [];
for (const size of [192, 512]) for (const purpose of ['any', 'maskable']) {
  const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}` && item.purpose === purpose);
  assert(icon, `${size}px ${purpose} declared`);
  assert.equal(icon.type, 'image/png');
  const { data, info } = await sharp(`${dist}/${icon.src}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, size); assert.equal(info.height, size);
  let minAlpha = 255, logoRadius = 0;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    minAlpha = Math.min(minAlpha, data[i + 3]);
    if (data[i] > 20) logoRadius = Math.max(logoRadius, Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2));
  }
  if (purpose === 'maskable') { assert.equal(minAlpha, 255); assert(logoRadius <= size * 0.4, 'logo inside 40% radius safe zone'); }
  icons.push({ src: icon.src, size, purpose, minAlpha, logoRadius, safeRadius: size * 0.4 });
}
const sw = await readFile(`${dist}/sw.js`, 'utf8');
const buildHash = createHash('sha256').update(sw).digest('hex');
const precache = JSON.parse(sw.match(/precacheAndRoute\((\[.*?\]),/s)[1].replace(/([{,])(url|revision):/g, '$1"$2":'));
const urls = new Set(precache.map((entry) => entry.url));
for (const file of await readdir(dist, { recursive: true })) {
  const path = file.replaceAll('\\', '/');
  if (/\.(js|css|html|woff2|webp|png|svg)$/.test(path) && !/^(sw\.js|workbox-.*\.js)$/.test(path)) assert(urls.has(path), `${path} must be precached`);
}
assert(urls.has('manifest.webmanifest'));
for (const feature of ['skipWaiting', 'clientsClaim', 'cleanupOutdatedCaches', 'index.html', 'CacheFirst', 'StaleWhileRevalidate', 'stellar-images', 'stellar-fonts']) assert(sw.includes(feature), `${feature} SW feature`);
assert((await readFile(`${dist}/index.html`, 'utf8')).includes('rel="manifest"'));
assert((await readFile('src/main.jsx', 'utf8')).includes('registerSW({ immediate: true })'));
await writeFile(new URL('static-audit.json', output), JSON.stringify({ buildHash, manifest, icons, precache }, null, 2));
console.log(`PASS: manifest, 4 decoded icons, opaque maskable safe zone, ${urls.size} precache URLs, runtime caching, SW registration`);

if (process.argv.includes('--artifacts')) {
  const agents = await readFile('AGENTS.md', 'utf8');
  const before = await readFile(new URL('agents-before.md', output), 'utf8');
  assert(agents.replaceAll('\r\n', '\n').startsWith(before.replaceAll('\r\n', '\n')), 'AGENTS content append-only');
  assert.equal(agents.match(/\| Task 4\.7 — PWA \/ Service Worker audit \|/g)?.length, 1);
  assert((await readFile(new URL('verification.md', output), 'utf8')).includes('✅ Xong'));
  const results = JSON.parse(await readFile(new URL('browser-audit.json', output), 'utf8'));
  assert.equal(results.length, 2);
  for (const result of results) {
    assert.equal(result.buildHash, buildHash, 'browser results match audited SW');
    assert.deepEqual(result.installability.installabilityErrors, []);
    assert(result.online.promptSeen && result.networkBlocked && !result.offline.online);
    assert.equal(result.offlineAssets.length, urls.size);
    assert(result.offlineAssets.every((asset) => asset.status === 200 && asset.bytes > 0));
    assert(result.offlineResponses.every((response) => response.serviceWorker));
  }
  const ui = JSON.parse(await readFile(new URL('browser-ui-origin-down.json', output), 'utf8'));
  assert.equal(ui.sectionCount, 8); assert(!ui.noInternet && ui.projects.every((project) => project.loaded));
  assert.deepEqual(JSON.parse(await readFile(new URL('browser-console.json', output), 'utf8')), []);
  console.log('PASS: report, append-only progress, matching browser SW hash, installability, offline assets, real Browser origin-down proof');
}

if (process.argv.includes('--browser')) {
  const { chromium } = await import(pathToFileURL(`${runtime}/playwright/index.mjs`));
  const results = [];
  try {
    for (const mobile of [false, true]) {
      // A disposable regular profile avoids Chromium's intentional incognito install block.
      const profile = await mkdtemp(resolve(tmpdir(), 'stellar-pwa-'));
      const context = await chromium.launchPersistentContext(profile, { executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'allow' });
      try {
      const page = await context.newPage();
      const errors = [], responses = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('response', (response) => responses.push({ url: response.url(), status: response.status(), serviceWorker: response.fromServiceWorker() }));
      await page.addInitScript(() => { window.installPromptSeen = false; addEventListener('beforeinstallprompt', () => { window.installPromptSeen = true; }); });
      await page.goto('http://127.0.0.1:4177/');
      await page.waitForFunction(() => navigator.serviceWorker.controller && !document.body.classList.contains('loading-lock'));
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#about') && document.querySelector('[data-galaxy-scene] canvas') && !document.body.classList.contains('loading-lock'));
      await page.evaluate(() => document.fonts.ready);
      const cdp = await context.newCDPSession(page);
      const installability = await cdp.send('Page.getInstallabilityErrors');
      const appManifest = await cdp.send('Page.getAppManifest');
      assert.deepEqual(installability.installabilityErrors, [], 'browser installability');
      assert.deepEqual(appManifest.errors, [], 'browser parsed manifest');
      const online = await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        const cacheNames = await caches.keys();
        const cached = (await Promise.all(cacheNames.map(async (name) => (await (await caches.open(name)).keys()).map((request) => request.url)))).flat();
        const runtimeImage = new Image(); runtimeImage.src = '/project1.webp?runtime=task47'; await runtimeImage.decode();
        return { secure: isSecureContext, controller: navigator.serviceWorker.controller.scriptURL, scope: registration.scope, state: registration.active.state, cached, runtimeImageWidth: runtimeImage.naturalWidth, promptSeen: window.installPromptSeen };
      });
      assert(online.secure && online.state === 'activated');
      for (const url of urls) assert(online.cached.some((cached) => new URL(cached).pathname === `/${url}`), `${url} in browser cache`);
      assert(online.runtimeImageWidth > 0);
      await page.waitForFunction(async () => Boolean(await caches.match('/project1.webp?runtime=task47')));
      // Disable HTTP cache too: offline success must come from the Service Worker.
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await context.setOffline(true);
      await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      const networkBlocked = await page.evaluate(async () => { try { await fetch('/offline-probe-task47.txt'); return false; } catch { return true; } });
      assert(networkBlocked, 'uncached network request must fail');
      responses.length = 0;
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !document.body.classList.contains('loading-lock') && document.querySelector('#about'));
      const offline = await page.evaluate(async () => {
        const image = new Image(); image.src = '/project1.webp?runtime=task47'; await image.decode();
        return { online: navigator.onLine, title: document.title, text: document.body.innerText, sections: [...document.querySelectorAll('section[id]')].map((section) => section.id), controller: navigator.serviceWorker.controller?.scriptURL, runtimeImageWidth: image.naturalWidth, images: [...document.images].filter((img) => img.src.includes('project') || img.src.includes('avatar')).map((img) => ({ src: img.src, loaded: img.complete && img.naturalWidth > 0 })), fontsReady: document.fonts.status };
      });
      assert.equal(offline.online, false);
      assert(offline.text.includes('TRẦN VŨ ANH DUY') || offline.text.includes('Trần Vũ Anh Duy'));
      assert.equal(offline.runtimeImageWidth, online.runtimeImageWidth);
      assert.equal(offline.sections.length, 8, 'all portfolio sections offline');
      const offlineAssets = await page.evaluate(async (urls) => Promise.all(urls.map(async (url) => {
        const response = await fetch(`/${url}`); return { url, status: response.status, bytes: (await response.arrayBuffer()).byteLength };
      })), [...urls]);
      assert(offlineAssets.every((asset) => asset.status === 200 && asset.bytes > 0), 'every precached asset fetches offline');
      const documentResponse = responses.find((response) => response.url === 'http://127.0.0.1:4177/');
      assert(documentResponse?.serviceWorker && documentResponse.status === 200, 'offline document from SW');
      await page.screenshot({ path: new URL(mobile ? 'offline-mobile.png' : 'offline-desktop.png', output).pathname.replace(/^\/(\w:)/, '$1') });
      const result = { mobile, buildHash, browserVersion: context.browser().version(), installability, manifestErrors: appManifest.errors, online, networkBlocked, offline, offlineAssets, offlineResponses: [...responses], errors };
      results.push(result);
      assert.deepEqual(errors, [], 'no application exceptions');
      console.log(`PASS: ${mobile ? 'mobile viewport' : 'desktop'} browser installability, all precache entries present, offline reload with HTTP cache disabled, runtime image cached`);
      } finally {
        await context.close();
        assert(profile.startsWith(resolve(tmpdir(), 'stellar-pwa-')), 'cleanup only the disposable QA profile');
        await rm(profile, { recursive: true, force: true });
      }
    }
  } finally { await writeFile(new URL('browser-audit.json', output), JSON.stringify(results, null, 2)); }
}
