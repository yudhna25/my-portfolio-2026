import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('./source/', import.meta.url);
const paths = s => [...s.matchAll(/\bd="([^"]+)"/g)].map(m => m[1]);
const receipts = [];
for (const id of ['photoshop', 'illustrator', 'after-effects', 'premiere-pro']) {
  const url = `https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${id}.svg`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const raw = Buffer.from(await response.arrayBuffer());
  const original = await readFile(new URL(`${id}.svg`, root), 'utf8');
  const same = JSON.stringify(paths(raw.toString())) === JSON.stringify(paths(original));
  const receipt = { id, url, finalUrl: response.url, httpStatus: response.status, contentType: response.headers.get('content-type'), bytes: raw.length, sha256: createHash('sha256').update(raw).digest('hex'), identicalPathGeometry: same, checkedAt: new Date().toISOString() };
  console.log(JSON.stringify(receipt));
  assert(response.ok && same && paths(original).length === 3, `${id}: not confirmed official geometry`);
  await writeFile(new URL(`${id}-official.svg`, root), raw);
  receipts.push(receipt);
}
await writeFile(new URL('adobe-source-receipts.json', root), JSON.stringify(receipts, null, 2) + '\n');
