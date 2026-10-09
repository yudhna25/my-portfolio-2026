/* eslint-disable */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

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

async function runVisualQAFooter() {
  console.log('Spawning headless Edge for Visual QA...');
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

    const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    const pageCdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('Runtime.enable');
    await pageCdp.send('DOM.enable');

    console.log(`Navigating to ${TARGET_URL}...`);
    await pageCdp.send('Page.navigate', { url: TARGET_URL });
    await new Promise((r) => setTimeout(r, 4500)); // wait for preloader

    // Scroll to the bottom to reach Footer
    console.log('Scrolling down to #site-footer...');
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const footer = document.querySelector('footer#site-footer') || document.querySelector('footer');
          if (footer) footer.scrollIntoView({ behavior: 'instant', block: 'end' });
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 2000));

    // Audit computed styles of App container and Footer
    const qaResult = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const rootApp = document.querySelector('div.noise');
          const footer = document.querySelector('footer#site-footer');
          const footerBig = footer ? footer.querySelector('.footer-big') : null;
          const footerLastSpan = footerBig ? footerBig.querySelector('span') : null;
          const emailBtn = footer ? footer.querySelector('a[href^="mailto:"]') : null;
          const socialLinks = footer ? Array.from(footer.querySelectorAll('a[target="_blank"]')) : [];
          const colophon = footer ? footer.querySelector('div:last-child') : null;

          function getStyle(el) {
            if (!el) return null;
            const cs = window.getComputedStyle(el);
            return {
              bg: cs.backgroundColor,
              color: cs.color,
              fontFamily: cs.fontFamily,
              fontSize: cs.fontSize,
              borderTopColor: cs.borderTopColor,
              borderTopWidth: cs.borderTopWidth
            };
          }

          return {
            appRoot: {
              color: getStyle(rootApp)?.color,
              classList: rootApp ? rootApp.className : ''
            },
            footer: {
              id: footer?.id,
              bg: getStyle(footer)?.bg,
              color: getStyle(footer)?.color,
              borderTopColor: getStyle(footer)?.borderTopColor,
              borderTopWidth: getStyle(footer)?.borderTopWidth,
            },
            footerBig: {
              fontFamily: getStyle(footerBig)?.fontFamily,
              color: getStyle(footerBig)?.color,
              lastSpanColor: getStyle(footerLastSpan)?.color,
              lastSpanClass: footerLastSpan?.className
            },
            emailBtn: {
              bg: getStyle(emailBtn)?.bg,
              color: getStyle(emailBtn)?.color,
              fontFamily: getStyle(emailBtn)?.fontFamily
            },
            socialLinksCount: socialLinks.length,
            colophon: {
              color: getStyle(colophon)?.color,
              fontFamily: getStyle(colophon)?.fontFamily
            }
          };
        })()
      `,
      returnByValue: true,
    });

    console.log('\n--- COMPUTED STYLES VERIFICATION RESULT ---');
    console.log(JSON.stringify(qaResult.result.value, null, 2));

    // Take screenshot of Footer
    console.log('\nCapturing screenshot of Footer area...');
    const screenshot = await pageCdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });

    const outDir = path.resolve('outputs', 'task-4.14');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const imgPath = path.join(outDir, 'footer-rendered.png');
    fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`Screenshot saved to ${imgPath} (${(fs.statSync(imgPath).size / 1024).toFixed(1)} KB)`);

    pageCdp.close();
    cdp.close();

    return qaResult.result.value;
  } finally {
    edge.kill();
  }
}

runVisualQAFooter()
  .then(() => {
    console.log('\n✅ Task 4.14 Visual QA Completed Successfully!');
  })
  .catch((err) => {
    console.error('Visual QA failed:', err);
    process.exit(1);
  });
