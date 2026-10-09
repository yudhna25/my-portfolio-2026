import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const baseURL = process.argv[2] ?? 'http://127.0.0.1:4173';
assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(baseURL), 'Run against a local production preview only');
const root = resolve(import.meta.dirname, '../../..');
const { chromium } = await import(pathToFileURL('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'));
const images = ['overview', 'problem', 'solution'].map((name) => `/projects/edura/${name}.webp`);
const sw = await readFile(resolve(root, 'dist/sw.js'), 'utf8');
const urls = [...sw.matchAll(/url:"([^"\n]+)"/g)].map((match) => match[1]);
assert(urls.includes('index.html') && urls.includes('manifest.webmanifest'), 'Offline core includes document and manifest');
assert(images.every((url) => urls.includes(url.slice(1))), 'All three used case images precached');
assert.equal(urls.filter((url) => url.startsWith('projects/edura/') && url.endsWith('.webp')).length, 3, 'No research gallery in SW');
assert(sw.includes('NavigationRoute') && sw.includes('createHandlerBoundToURL("index.html")'), 'Generated SW has SPA navigation fallback');
const buildHash = createHash('sha256').update(sw).digest('hex');
const expectedHashes = Object.fromEntries(await Promise.all(images.map(async (url) => [url, createHash('sha256').update(await readFile(resolve(root, `public${url}`))).digest('hex')])));
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const results = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, serviceWorkers: 'allow' });
    const errors = [], consoleErrors = [], requestFailures = [], responses = [];
    let phase = 'online';
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push({ message: message.text(), url: message.location().url, phase }); });
    page.on('requestfailed', (request) => requestFailures.push({ url: request.url(), error: request.failure()?.errorText, phase }));
    page.on('response', (response) => responses.push({ url: response.url(), status: response.status(), sw: response.fromServiceWorker() }));
    const cdp = await context.newCDPSession(page);
    try {
      await page.goto(`${baseURL}/projects/edura`);
      await page.waitForSelector('[data-edura-reader]');
      await page.waitForFunction(() => navigator.serviceWorker.controller);
      await page.reload();
      await page.waitForSelector('[data-edura-reader]');
      await page.evaluate(async () => { await document.fonts.ready; for (const image of document.images) { image.loading = 'eager'; await image.decode(); } });
      const online = await page.evaluate(async () => ({ title: document.title, canvas: document.querySelectorAll('canvas').length, h1: document.querySelector('h1')?.textContent, sw: navigator.serviceWorker.controller?.scriptURL, cacheNames: await caches.keys(), cacheURLs: (await Promise.all((await caches.keys()).map(async (name) => (await (await caches.open(name)).keys()).map((request) => request.url)))).flat() }));
      assert.equal(online.canvas, 0, 'Reader has no background Canvas');
      assert(online.h1.includes('EDURA'), 'Case content rendered');
      assert(urls.every((url) => online.cacheURLs.some((cached) => new URL(cached).pathname === `/${url}`)), 'Every precache entry in browser cache');
      const manifest = await cdp.send('Page.getAppManifest');
      assert.deepEqual(manifest.errors, [], 'Browser parses web manifest');
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await context.setOffline(true);
      await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      phase = 'intentional-offline-probe';
      const uncachedBlocked = await page.evaluate(async () => { try { await fetch('/r62-uncached-network-probe.txt'); return false; } catch { return true; } });
      assert(uncachedBlocked, 'Offline is real: uncached request fails');
      responses.length = 0;
      phase = 'offline-case';
      const offlineDocument = await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-edura-reader]');
      await page.evaluate(async () => { await document.fonts.ready; for (const image of document.images) { image.loading = 'eager'; await image.decode(); } });
      assert(offlineDocument.fromServiceWorker() && offlineDocument.status() === 200, 'Offline case document from SW fallback');
      const assets = await page.evaluate(async (images) => Promise.all(images.map(async (url) => { const response = await fetch(url); const bytes = await response.arrayBuffer(); const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map((byte) => byte.toString(16).padStart(2, '0')).join(''); return { url, status: response.status, bytes: bytes.byteLength, hash }; })), images);
      assert(assets.every((asset) => asset.status === 200 && asset.hash === expectedHashes[asset.url]), 'All three original-color case assets offline and byte-identical');
      const offlineReader = await page.evaluate(() => ({ online: navigator.onLine, canvas: document.querySelectorAll('canvas').length, title: document.title, lang: document.documentElement.lang, images: [...document.images].map((image) => ({ url: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight, loaded: image.complete })), overflow: document.documentElement.scrollWidth - innerWidth }));
      assert.equal(offlineReader.canvas, 0);
      assert.equal(offlineReader.online, false);
      assert.equal(offlineReader.overflow, 0);
      await page.screenshot({ path: resolve(import.meta.dirname, mobile ? 'pwa-offline-case-mobile.png' : 'pwa-offline-case-desktop.png') });
      phase = 'offline-main';
      const mainDocument = await page.goto(`${baseURL}/#work`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#work-target-edura');
      await page.waitForFunction(() => !document.body.classList.contains('loading-lock') && document.querySelector('[data-galaxy-scene] canvas'));
      assert(mainDocument.fromServiceWorker() && mainDocument.status() === 200, 'Offline main document from SW');
      const offlineMain = await page.evaluate(() => ({ sections: [...document.querySelectorAll('section[id]')].map((section) => section.id), canvas: document.querySelectorAll('canvas').length, title: document.title, lock: document.body.classList.contains('loading-lock'), focus: document.activeElement?.id }));
      assert.equal(offlineMain.canvas, 1, 'Main portfolio resumes single Canvas');
      assert(offlineMain.sections.includes('about') && offlineMain.sections.includes('work') && offlineMain.sections.includes('transmission'), 'Core portfolio remains available offline');
      const record = { mobile, browser: browser.version(), buildHash, urls, online, manifestErrors: manifest.errors, uncachedBlocked, offlineReader, offlineMain, assets, responses, errors, consoleErrors, requestFailures };
      results.push(record);
      assert.deepEqual(errors, [], 'No application exceptions');
      assert.deepEqual(requestFailures.filter((request) => request.url.startsWith(baseURL) && !request.url.endsWith('/r62-uncached-network-probe.txt')), [], 'No unexpected first-party request failures');
      console.log(`PASS ${mobile ? '390 mobile viewport' : '1440 desktop'}: case direct/reload + core offline, HTTP cache disabled, SW fallback, 3 hashes, reader0Canvas/main1Canvas`);
    } catch (error) { results.push({ mobile, error: error.message, errors, consoleErrors, requestFailures, responses }); throw error; }
    finally { await context.close(); }
  }
} finally { await browser.close(); await writeFile(resolve(import.meta.dirname, 'pwa-browser-results.json'), JSON.stringify({ baseURL, buildHash, testedUTC: new Date().toISOString(), results }, null, 2)); }
