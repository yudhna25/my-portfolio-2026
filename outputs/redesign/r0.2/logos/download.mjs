import { writeFile, readFile } from 'node:fs/promises';
const root = new URL('./source/', import.meta.url);
const assets = {
  'figma-brand.zip': 'https://static.figma.com/uploads/4fbf4d754dbbc027ba1530205f8747cd97d532e5',
  'claude-brand.zip': 'https://anthropic.com/press-kit',
  'openai-brand.zip': 'https://cdn.openai.com/brand/OpenAI-Logos-2025.zip',
  'antigravity-original.svg': 'https://antigravity.google/assets/image/brand/antigravity-icon__full-color.svg',
  'antigravity-white.svg': 'https://antigravity.google/assets/image/brand/antigravity-icon__white.svg',
};
for (const [name, url] of Object.entries(assets)) {
  const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const data = Buffer.from(await r.arrayBuffer());
  if (r.ok) await writeFile(new URL(name, root), data);
  console.log(JSON.stringify({ name, url, finalUrl: r.url, status: r.status, type: r.headers.get('content-type'), bytes: data.length }));
}
const t = await readFile(new URL('resolve-page.html', root), 'utf8');
console.log('resolve scripts', [...t.matchAll(/<script[^>]*src="([^"]+)"/g)].map(x => x[1]));
console.log('resolve endpoint snippets', [...t.matchAll(/.{0,80}(?:ng-controller|imageId|imageSlug|partial|davinci-resolve-logo-square).{0,120}/g)].map(x => x[0]).slice(-12));
