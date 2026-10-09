import { mkdir, writeFile } from 'node:fs/promises';
const root = new URL('./', import.meta.url);
await mkdir(new URL('source/', root), { recursive: true });
const pages = {
  figma: 'https://www.figma.com/using-the-figma-brand/',
  antigravity: 'https://antigravity.google/press',
  openai: 'https://openai.com/brand/',
  claude: 'https://www.anthropic.com/news',
  resolve: 'https://www.blackmagicdesign.com/media/images/davinci-resolve-logo',
  adobe: 'https://www.adobe.com/products/creativecloud.html',
};
const results = await Promise.allSettled(Object.entries(pages).map(async ([id, url]) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  const html = await res.text();
  await writeFile(new URL(`source/${id}-page.html`, root), html);
  const links = [...new Set([...html.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(m => m[1]))];
  const selected = links.filter(u => /svg|png|zip|press|brand|download|logo|icon/i.test(u));
  return { id, url, finalUrl: res.url, status: res.status, links: selected };
}));
console.log(JSON.stringify(results, null, 2));
