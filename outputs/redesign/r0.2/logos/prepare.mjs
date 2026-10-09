import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const magick = 'D:/ImageMagick-7.1.1-Q16-HDRI/magick.exe';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const path = relative => fileURLToPath(new URL(relative, root));
const run = (...args) => execFileSync(magick, args, { encoding: 'utf8' }).trim();
const zipReceipts = JSON.parse(await readFile(new URL('logos/source/brand-source-receipts.json', root), 'utf8'));
for (const receipt of zipReceipts) {
  assert.equal(hash(await readFile(new URL(`logos/source/${receipt.file}`, root))), receipt.entrySha256, `${receipt.file}: no longer matches official ZIP entry`);
  assert.equal(hash(await readFile(new URL(`logos/source/${receipt.zip}`, root))), receipt.zipSha256, `${receipt.zip}: archive changed`);
  assert(receipt.exactExtractedBytesMatch, `${receipt.file}: extraction receipt failed`);
}
const adobeReceipts = JSON.parse(await readFile(new URL('logos/source/adobe-source-receipts.json', root), 'utf8'));
for (const receipt of adobeReceipts) {
  assert.equal(hash(await readFile(new URL(`logos/source/${receipt.id}.svg`, root))), receipt.sha256, `${receipt.id}: official source hash changed`);
  assert(receipt.httpStatus === 200 && receipt.identicalPathGeometry, `${receipt.id}: source not verified`);
}
for (const folder of ['logos/mono/', 'logos/preview/']) await mkdir(new URL(folder, root), { recursive: true });
const definitions = [
  { id: 'figma', label: 'Figma', vendor: 'Figma', source: 'figma-original.svg', white: 'figma-white.svg', page: 'https://www.figma.com/using-the-figma-brand/', url: 'https://static.figma.com/uploads/4fbf4d754dbbc027ba1530205f8747cd97d532e5', entry: 'Figma Brand Assets/Figma Icon (Mono-line)/Figma Icon (Mono-line white).svg', treatment: 'Official mono-line white SVG; outer document padding removed; path geometry unchanged.' },
  ...[['photoshop', 'Adobe Photoshop'], ['illustrator', 'Adobe Illustrator'], ['after-effects', 'Adobe After Effects'], ['premiere-pro', 'Adobe Premiere Pro']].map(([id, label]) => ({ id, label, vendor: 'Adobe', source: `${id}.svg`, page: 'https://www.adobe.com/creativecloud.html', url: `https://www.adobe.com/cc-shared/assets/img/product-icons/svg/${id}.svg`, treatment: 'Project monochrome treatment of official app-icon SVG: tile #1A1A1A, letterform paths #FFFFFF; path geometry unchanged. Not an official monochrome variant.' })),
  { id: 'davinci-resolve', label: 'DaVinci Resolve', vendor: 'Blackmagic Design', source: 'resolve-original.tif', reference: 'resolve-original.png', page: 'https://www.blackmagicdesign.com/media/images/davinci-resolve-logo', url: 'https://downloads.blackmagicdesign.com/press/press-images/davinci-resolve-logo-square/20210518-sdl66n/DaVinci-Resolve-Logo-Square.zip', entry: 'DaVinci-Resolve-Logo-Square.tif', treatment: 'Project luminance-only treatment of official TIFF, RGB auto-level, alpha preserved, resized to 256px WebP. All three petals and original app-tile silhouette retained; not an official mono variant.' },
  { id: 'chatgpt', label: 'ChatGPT', vendor: 'OpenAI', source: 'chatgpt-original.svg', white: 'chatgpt-white.svg', page: 'https://openai.com/brand/', url: 'https://cdn.openai.com/brand/OpenAI-Logos-2025.zip', entry: 'OpenAI-logos(new)/SVGs/OpenAI-white-monoblossom.svg', treatment: 'Official white Monoblossom SVG used for ChatGPT; outer document padding removed; path geometry unchanged.' },
  { id: 'claude', label: 'Claude', vendor: 'Anthropic', source: 'claude-original.svg', page: 'https://www.anthropic.com/news', url: 'https://anthropic.com/press-kit', entry: 'Anthropic media resources/Anthropic logos/Claude logos/3 Claude Spark/SVG/Claude Spark - Clay.svg', treatment: 'Project monochrome treatment of official Clay Spark SVG: fill #FFFFFF; path geometry unchanged. Not an official white Spark variant.' },
  { id: 'google-antigravity', label: 'Google Antigravity', vendor: 'Google', source: 'antigravity-original.svg', white: 'antigravity-white.svg', page: 'https://antigravity.google/press', url: 'https://antigravity.google/assets/image/brand/antigravity-icon__white.svg', originalUrl: 'https://antigravity.google/assets/image/brand/antigravity-icon__full-color.svg', treatment: 'Official white Antigravity icon SVG, outer document padding removed; path geometry unchanged. This is Antigravity, not Gemini.' },
];
const assets = [];
for (const d of definitions) {
  const sourcePath = `logos/source/${d.source}`;
  const bytes = await readFile(new URL(sourcePath, root));
  const sourceHash = hash(bytes);
  const svg = d.source.endsWith('.svg');
  const web = `logos/mono/${d.id}.${svg ? 'svg' : 'webp'}`;
  const reference = `logos/preview/${d.id}-reference.png`;
  const originalRaster = `logos/preview/${d.id}-original.png`;
  run('-background', 'none', path(sourcePath), '-resize', '512x512', `PNG32:${path(originalRaster)}`);
  run(path(originalRaster), '-trim', '+repage', '-resize', '256x256', '-gravity', 'center', '-background', 'none', '-extent', '256x256', `PNG32:${path(reference)}`);
  if (svg) {
    let text = d.white ? await readFile(new URL(`logos/source/${d.white}`, root), 'utf8') : bytes.toString('utf8');
    assert(!/<script|<foreignObject|<!ENTITY|(?:href|src)=['"](?:https?:|data:|javascript:)/i.test(text), `${d.id}: unsafe SVG`);
    const originalPaths = [...text.matchAll(/\bd="([^"]+)"/g)].map(m => m[1]);
    if (d.vendor === 'Adobe') text = text.replace(/fill="#[0-9a-f]+"/gi, (_, i) => i < text.indexOf('id="Vector_2"') ? 'fill="#1A1A1A"' : 'fill="#FFFFFF"');
    if (d.id === 'claude') text = text.replace('fill="#D97757"', 'fill="#FFFFFF"');
    const tmp = `logos/preview/${d.id}-mono-full.png`;
    await writeFile(new URL(web, root), text);
    run('-background', 'none', path(web), '-resize', '512x512', `PNG32:${path(tmp)}`);
    if (d.vendor !== 'Adobe') {
      const [x, y, width, height] = run(path(tmp), '-format', '%@', 'info:').match(/(\d+)x(\d+)\+(\d+)\+(\d+)/).slice(1).map(Number).map((v, i, a) => a[[2, 3, 0, 1][i]]);
      const [vx, vy, vw, vh] = text.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
      const [rw, rh] = run('identify', '-format', '%w %h', path(tmp)).split(' ').map(Number);
      const px = width * .035, py = height * .035;
      const box = [vx + (x - px) * vw / rw, vy + (y - py) * vh / rh, (width + 2 * px) * vw / rw, (height + 2 * py) * vh / rh];
      text = text.replace(/viewBox="[^"]+"/, `viewBox="${box.map(v => +v.toFixed(5)).join(' ')}"`).replace(/width="[^"]+"/, 'width="256"').replace(/height="[^"]+"/, `height="${Math.round(256 * box[3] / box[2])}"`);
      await writeFile(new URL(web, root), text);
    }
    assert.deepEqual([...text.matchAll(/\bd="([^"]+)"/g)].map(m => m[1]), originalPaths, `${d.id}: logo path changed`);
  } else {
    run(path(sourcePath), '-colorspace', 'Gray', '-channel', 'RGB', '-auto-level', '+channel', '-colorspace', 'sRGB', '-trim', '+repage', '-resize', '256x256', '-define', 'webp:lossless=true', path(web));
  }
  const preview = `logos/preview/${d.id}-mono.png`;
  run('-background', 'none', path(web), '-resize', '256x256', '-gravity', 'center', '-background', 'none', '-extent', '256x256', `PNG32:${path(preview)}`);
  const monoError = Number(run(path(preview), '-fx', 'max(abs(r-g),abs(g-b))', '-format', '%[fx:maxima]', 'info:'));
  assert(monoError === 0, `${d.id}: non-monochrome pixels ${monoError}`);
  assert.equal(hash(await readFile(new URL(sourcePath, root))), sourceHash, `${d.id}: original modified`);
  const files = [];
  const fileRoles = [['web', web], ['reference', reference], ['source', sourcePath], ['preview', preview]];
  if (d.white) fileRoles.push(['source-mono', `logos/source/${d.white}`]);
  for (const [role, file] of fileRoles) {
    const data = await readFile(new URL(file, root));
    const [width, height, channels] = run('identify', '-format', '%w %h %[channels]', path(file)).split(' ');
    const alphaRaster = file.endsWith('.svg') ? (role === 'source' ? originalRaster : preview) : file;
    const rasterOpaque = run('identify', '-format', '%[opaque]', path(alphaRaster));
    files.push({ role, path: file, format: file.split('.').at(-1), bytes: data.length, sha256: hash(data), width: Number(width), height: Number(height), alpha: rasterOpaque.toLowerCase() !== 'true', alphaMethod: file.endsWith('.svg') ? 'ImageMagick raster decode with -background none, real PNG alpha' : 'native decoded alpha channel', channels });
  }
  assets.push({ ...d, status: d.url ? 'ready' : 'provenance_url_pending', monoType: d.white ? 'vendor-provided' : 'project-derivative', attribution: `${d.vendor}; logo and associated marks belong to their respective owner. Source native files retained for attribution and identity verification.`, sourceUrl: d.url, sourcePageUrl: d.page, monoSourceEntry: d.white ? d.entry : undefined, originalSourceEntry: d.id === 'figma' ? 'Figma Brand Assets/Figma Icon (Full-color)/Figma Icon (Full-color).svg' : d.id === 'chatgpt' ? 'OpenAI-logos(new)/SVGs/OpenAI-black-monoblossom.svg' : d.white ? undefined : d.entry, files, checks: { originalUnchanged: true, pathGeometryUnchanged: svg, geometryComparedAgainst: d.white ? `logos/source/${d.white}` : sourcePath, decoded: true, monochromeMaxChannelDifference: monoError } });
}
assert.equal(new Set(assets.map(a => a.id)).size, 9);
assert.equal(new Set(assets.map(a => a.files.find(f => f.role === 'web').sha256)).size, 9, 'duplicate brand glyph');
await writeFile(new URL('logo-assets.json', root), JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), tool: 'ImageMagick/native SVG; no image generation', assets }, null, 2) + '\n');
await writeFile(new URL('logos/logo-check.json', root), JSON.stringify({ checkedAt: new Date().toISOString(), logos: assets.length, sourceHashesPreserved: true, exactBrandArchiveEntriesChecked: zipReceipts.length, officialAdobeUrlsChecked: adobeReceipts.length, distinctWebHashes: 9, errors: [], pending: assets.filter(a => a.status !== 'ready').map(a => a.id) }, null, 2) + '\n');
console.log(JSON.stringify({ logos: 9, ready: assets.filter(a => a.status === 'ready').length, metadata: 'outputs/redesign/r0.2/logo-assets.json' }));
