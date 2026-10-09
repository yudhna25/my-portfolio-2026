import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('./source/', import.meta.url);
const url = 'https://www.blackmagicdesign.com/media/partial/images/davinci-resolve-logo-square';
const r = await fetch(url);
const html = await r.text();
await writeFile(new URL('resolve-download-page.html', root), html);
console.log(r.status, [...html.matchAll(/(?:href|src)=["']([^"']+)["']/g)].map(x => x[1]));
for (const id of ['figma-white','claude-original','photoshop','illustrator','after-effects','premiere-pro']) {
  const s = await readFile(new URL(id + '.svg', root), 'utf8');
  console.log(id, s.slice(0, 450));
}
