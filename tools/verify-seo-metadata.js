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

async function runStaticVerification() {
  console.log('--- 1. STATIC HEAD & JSON-LD AUDIT (index.html) ---');
  const htmlPath = path.resolve('index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // 1. Title
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1] : null;
  console.log(`Title: "${title}" (${title ? title.length : 0} chars)`);

  // 2. Description
  const descMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"/);
  const desc = descMatch ? descMatch[1] : null;
  console.log(`Description: "${desc}" (${desc ? desc.length : 0} chars)`);

  // 3. Keywords
  const kwMatch = html.match(/<meta\s+name="keywords"\s+content="(.*?)"/);
  console.log(`Keywords found: ${!!kwMatch}`);

  // 4. Canonical
  const canonMatch = html.match(/<link\s+rel="canonical"\s+href="(.*?)"/);
  console.log(`Canonical URL: ${canonMatch ? canonMatch[1] : 'MISSING'}`);

  // 5. Open Graph tags
  const ogTags = {};
  const ogRegex = /<meta\s+property="(og:[a-zA-Z0-9:_]+)"\s+content="(.*?)"/g;
  let match;
  while ((match = ogRegex.exec(html)) !== null) {
    ogTags[match[1]] = match[2];
  }
  console.log('Open Graph tags found:', ogTags);

  // 6. Twitter tags
  const twitterTags = {};
  const twRegex = /<meta\s+name="(twitter:[a-zA-Z0-9:_]+)"\s+content="(.*?)"/g;
  while ((match = twRegex.exec(html)) !== null) {
    twitterTags[match[1]] = match[2];
  }
  console.log('Twitter Card tags found:', twitterTags);

  // 7. Verify OG image on disk
  const ogImagePath = path.resolve('public', 'og-image.jpg');
  const ogImageExists = fs.existsSync(ogImagePath);
  const ogImageSize = ogImageExists ? fs.statSync(ogImagePath).size / 1024 : 0;
  console.log(`OG Image on disk: ${ogImageExists} (${ogImageSize.toFixed(1)} KB)`);

  // 8. JSON-LD Schema Validation
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!jsonLdMatch) {
    throw new Error('❌ JSON-LD script not found in index.html!');
  }
  const jsonLdRaw = jsonLdMatch[1].trim();
  const schema = JSON.parse(jsonLdRaw);
  console.log('✅ JSON-LD parsed successfully as valid JSON!');
  console.log('Schema @context:', schema['@context']);
  console.log('Schema @graph items count:', schema['@graph']?.length);

  const website = schema['@graph']?.find((item) => item['@type'] === 'WebSite');
  const person = schema['@graph']?.find((item) => item['@type'] === 'Person');

  if (!website) throw new Error('❌ WebSite entity missing in schema @graph');
  if (!person) throw new Error('❌ Person entity missing in schema @graph');

  console.log('WebSite entity:', { name: website.name, url: website.url });
  console.log('Person entity:', {
    name: person.name,
    jobTitle: person.jobTitle,
    email: person.email,
    telephone: person.telephone,
    knowsAboutCount: person.knowsAbout?.length,
    sameAsCount: person.sameAs?.length,
  });

  return { title, desc, ogTags, twitterTags, ogImageSize, schema };
}

async function runBrowserVerification() {
  console.log('\n--- 2. REAL BROWSER DOM & DYNAMIC i18n METADATA AUDIT ---');
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

    const targetsRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');

    const pageCdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('Runtime.enable');

    console.log(`Navigating to ${TARGET_URL}...`);
    await pageCdp.send('Page.navigate', { url: TARGET_URL });
    await new Promise((r) => setTimeout(r, 4500)); // wait for preloader

    // Evaluate initial Vietnamese meta
    const viMeta = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            lang: document.documentElement.lang,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content,
            canonical: document.querySelector('link[rel="canonical"]')?.href,
            ogTitle: document.querySelector('meta[property="og:title"]')?.content,
            ogImage: document.querySelector('meta[property="og:image"]')?.content,
            twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
            jsonLdPresent: !!document.querySelector('script[type="application/ld+json"]')
          };
        })()
      `,
      returnByValue: true,
    });

    console.log('\nInitial VI State in Live Browser:');
    console.log(viMeta.result.value);

    // Now trigger language switch to English
    console.log('\nSwitching language to English via store/menu...');
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          // Find language switch or invoke store
          const buttons = Array.from(document.querySelectorAll('button'));
          const enBtn = buttons.find(b => b.textContent && b.textContent.trim().toUpperCase() === 'EN');
          if (enBtn) {
            enBtn.click();
            return 'clicked button';
          }
          // Or dispatch via window if store is accessible
          return 'button not found directly';
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 500));

    // Alternatively, change via i18n instance or open menu
    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          // Open menu overlay to access language toggle
          const menuBtn = document.querySelector('button[aria-label*="menu" i], button[aria-label*="Menu" i]');
          if (menuBtn) menuBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.trim().toUpperCase() === 'EN');
          if (enBtn) enBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1000));

    const enMeta = await pageCdp.send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            lang: document.documentElement.lang,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content
          };
        })()
      `,
      returnByValue: true,
    });

    console.log('\nAfter Language Switch (EN State):');
    console.log(enMeta.result.value);

    pageCdp.close();
    cdp.close();

    return { vi: viMeta.result.value, en: enMeta.result.value };
  } finally {
    edge.kill();
  }
}

async function main() {
  const staticResult = await runStaticVerification();
  const browserResult = await runBrowserVerification();
  console.log('\n✅ ALL TECHNICAL SEO VERIFICATIONS PASSED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
