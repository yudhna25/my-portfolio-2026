/* eslint-disable */
import { spawn } from 'node:child_process';
import http from 'node:http';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9222;
const TARGET_URL = 'http://127.0.0.1:5173/';

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Could not connect to Edge DevTools');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function runAudit() {
  console.log('Spawning headless Edge...');
  const edge = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1920,1080',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    const wsUrl = await getWsUrl();
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();

    // Create target tab
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    const sessionSend = (method, params = {}) =>
      cdp.send('Target.sendMessageToTarget', {
        sessionId,
        message: JSON.stringify({ id: cdp.id++, method, params }),
      });

    // We can also connect directly to the page WebSocket
    const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.id === targetId || t.type === 'page');

    const pageCdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageCdp.connect();

    console.log('Enabling Page & Runtime...');
    await pageCdp.send('Page.enable');
    await pageCdp.send('Runtime.enable');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log(`Navigating to ${TARGET_URL}...`);
    await pageCdp.send('Page.navigate', { url: TARGET_URL });

    // Wait for load and preloader dismissal (Preloader takes ~2.4s)
    console.log('Waiting for preloader and assets to settle (5s)...');
    await new Promise((r) => setTimeout(r, 5000));

    // Audit initial images and CLS
    const initialReport = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          let cls = 0;
          const entries = performance.getEntriesByType('layout-shift');
          for (const entry of entries) {
            if (!entry.hadRecentInput) cls += entry.value;
          }

          const imgs = Array.from(document.querySelectorAll('img')).map(img => {
            const rect = img.getBoundingClientRect();
            return {
              src: img.getAttribute('src'),
              currentSrc: img.currentSrc,
              alt: img.getAttribute('alt'),
              widthAttr: img.getAttribute('width'),
              heightAttr: img.getAttribute('height'),
              renderedWidth: rect.width,
              renderedHeight: rect.height,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              loading: img.getAttribute('loading'),
              decoding: img.getAttribute('decoding'),
              complete: img.complete
            };
          });

          return { cls, images: imgs };
        })()
      `,
      returnByValue: true,
    });

    console.log('\n--- INITIAL (HERO/TOP) REPORT ---');
    console.log(`Initial CLS: ${initialReport.result.value.cls}`);
    console.log('Images found:', initialReport.result.value.images);

    // Scroll down to About and Works to trigger lazy loading
    console.log('\nScrolling to About section...');
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const about = document.getElementById('about');
          if (about) about.scrollIntoView({ behavior: 'instant' });
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    console.log('Scrolling to Works section...');
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const work = document.getElementById('work');
          if (work) work.scrollIntoView({ behavior: 'instant' });
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2500));

    console.log('Scrolling to Contact (bottom)...');
    await pageCdp.send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Evaluate Full Page CLS and Image metrics after full scroll
    const fullReport = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          let cls = 0;
          const entries = performance.getEntriesByType('layout-shift');
          const shifts = [];
          for (const entry of entries) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
              shifts.push({
                value: entry.value,
                startTime: entry.startTime,
                sources: entry.sources ? entry.sources.map(s => ({
                  node: s.node ? s.node.nodeName : 'unknown',
                  currentRect: s.currentRect,
                  previousRect: s.previousRect
                })) : []
              });
            }
          }

          const imgs = Array.from(document.querySelectorAll('img')).map(img => {
            const rect = img.getBoundingClientRect();
            const parent = img.parentElement;
            return {
              src: img.getAttribute('src'),
              alt: img.getAttribute('alt'),
              widthAttr: img.getAttribute('width'),
              heightAttr: img.getAttribute('height'),
              renderedWidth: Math.round(rect.width),
              renderedHeight: Math.round(rect.height),
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight,
              loading: img.getAttribute('loading'),
              decoding: img.getAttribute('decoding'),
              complete: img.complete,
              parentAspect: parent ? window.getComputedStyle(parent).aspectRatio : 'none'
            };
          });

          // Check performance resource timing for image formats and sizes
          const imgResources = performance.getEntriesByType('resource')
            .filter(r => r.initiatorType === 'img' || /\\.(webp|png|jpg|svg)/i.test(r.name))
            .map(r => ({
              name: r.name,
              transferSize: r.transferSize,
              decodedBodySize: r.decodedBodySize,
              duration: r.duration
            }));

          return { cls, shifts, images: imgs, resources: imgResources };
        })()
      `,
      returnByValue: true,
    });

    console.log('\n================ FULL AUDIT RESULT (DESKTOP 1920) ================');
    console.log(`TOTAL CUMULATIVE LAYOUT SHIFT (CLS): ${fullReport.result.value.cls}`);
    console.log(`LAYOUT SHIFTS COUNT: ${fullReport.result.value.shifts.length}`);
    if (fullReport.result.value.shifts.length > 0) {
      console.log('Shifts detail:', JSON.stringify(fullReport.result.value.shifts, null, 2));
    }
    console.log('\nALL IMAGES ON PAGE:');
    console.table(fullReport.result.value.images);

    console.log('\nLOADED IMAGE RESOURCES:');
    console.table(fullReport.result.value.resources);

    // Now test Mobile Viewport (390 x 844)
    console.log('\n--- TESTING MOBILE VIEWPORT (390x844) ---');
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    await pageCdp.send('Page.navigate', { url: TARGET_URL });
    await new Promise((r) => setTimeout(r, 4500));

    // Scroll through mobile
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          let pos = 0;
          const max = document.documentElement.scrollHeight;
          while (pos < max) {
            window.scrollTo(0, pos);
            pos += 600;
          }
          window.scrollTo(0, max);
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    const mobileReport = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          let cls = 0;
          const entries = performance.getEntriesByType('layout-shift');
          for (const entry of entries) {
            if (!entry.hadRecentInput) cls += entry.value;
          }
          const imgs = Array.from(document.querySelectorAll('img')).map(img => {
            const rect = img.getBoundingClientRect();
            return {
              src: img.getAttribute('src'),
              alt: img.getAttribute('alt'),
              widthAttr: img.getAttribute('width'),
              heightAttr: img.getAttribute('height'),
              renderedWidth: Math.round(rect.width),
              renderedHeight: Math.round(rect.height),
              loading: img.getAttribute('loading'),
              decoding: img.getAttribute('decoding'),
              complete: img.complete
            };
          });
          return { cls, images: imgs };
        })()
      `,
      returnByValue: true,
    });

    console.log(`MOBILE CLS: ${mobileReport.result.value.cls}`);
    console.table(mobileReport.result.value.images);

    pageCdp.close();
    cdp.close();

    return {
      desktop: fullReport.result.value,
      mobile: mobileReport.result.value,
    };
  } finally {
    edge.kill();
  }
}

runAudit()
  .then((results) => {
    console.log('\n✅ Verification run completed successfully!');
  })
  .catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
