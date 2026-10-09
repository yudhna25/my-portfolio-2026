import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] ? path.join(process.argv[2], 'sharp') : 'sharp');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'public/constellations/manifest.json')));
const education = JSON.parse(await fs.readFile(path.join(here, 'education-data.json'))).education;
const works = JSON.parse(await fs.readFile(path.join(here, 'works-artwork.json'))).works;
const width = 1510, rowHeight = 340;
const elements = [], opacityElements = [], records = [];
const text = (label, w, h, size = 16) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="0" y="${size + 3}" font-family="Arial" font-size="${size}" fill="#fafafa">${label}</text></svg>`);
await fs.mkdir(path.join(here, 'previews'), { recursive: true });
elements.push({ input: text('V4 · Stellarium / Johan Meuris · true vector derivatives · ICRS J1991.25', width - 30, 40, 22), left: 20, top: 10 });
opacityElements.push({ input: text('V4 · silhouette at 256px on #050505 · art only · 8% / 12% / 25% / 35%', 1200, 40, 21), left: 20, top: 10 });
for (const [i, asset] of manifest.assets.entries()) {
  const top = 90 + i * rowHeight;
  const side = asset.artwork.viewBox[2], size = 260;
  const file = path.join(root, 'public', asset.artwork.url);
  const svg = await fs.readFile(file, 'utf8');
  const sourceSmall = await sharp(path.join(here, 'sources', `${asset.name.toLowerCase()}.png`)).resize(size, size, { withoutEnlargement: true }).png().toBuffer();
  const src = await sharp({ create: { width: size, height: size, channels: 4, background: '#050505' } }).composite([{ input: sourceSmall, gravity: 'centre' }]).png().toBuffer();
  const vector = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  const meta = await sharp(Buffer.from(svg)).metadata();
  assert.equal(meta.format, 'svg');
  await sharp(Buffer.from(svg)).png().toFile(path.join(here, 'previews', `${asset.name.toLowerCase()}-vector.png`));
  const data = [...education, ...works].find(e => e.constellationId === asset.id);
  const plane = asset.artwork.plane;
  const starXY = position => [(position[0] - plane.center[0]) / plane.width * side + side / 2,
    side / 2 - (position[1] - plane.center[1]) / plane.height * side];
  const stars = new Map(data.geometry.stars.map(s => [s.id, s]));
  const links = data.geometry.edges.map(([a, b]) => {
    const p = starXY(stars.get(a).position), q = starXY(stars.get(b).position);
    return `<path d="M${p} L${q}" fill="none" stroke="#999" stroke-width="${side / 256 * .8}"/>`;
  }).join('');
  const nodes = data.geometry.stars.map(s => {
    const [x, y] = starXY(s.position), r = Math.max(1.2, 3 - s.vmag * .2) * side / 256;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fafafa"/>`;
  }).join('');
  const anchors = asset.artwork.anchors.map(a => {
    const [x, y] = a.vectorPixel;
    const tx = Math.max(3, Math.min(side - 62 * side / 512, x + 7 * side / 512));
    const ty = Math.max(12 * side / 512, Math.min(side - 3, y - 7 * side / 512));
    return `<circle cx="${x}" cy="${y}" r="${side * .014}" fill="none" stroke="#ddd" stroke-width="${side * .0018}"/><text x="${tx}" y="${ty}" fill="#ddd" font-family="Arial" font-size="${side * .023}">${a.hip}</text>`;
  }).join('');
  const body = svg.slice(svg.indexOf('<g '), svg.lastIndexOf('</svg>'));
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}"><rect width="100%" height="100%" fill="#050505"/><g opacity=".3">${body}</g>${links}${nodes}${anchors}</svg>`);
  await sharp(overlay).png().toFile(path.join(here, 'previews', `${asset.name.toLowerCase()}-overlay.png`));
  elements.push({ input: text(`${asset.assignment} → ${asset.name} (${asset.id})`, 720, 33, 18), left: 20, top: top - 8 });
  for (const [x, label, input] of [[20, `Source ${side}×${side}`, src], [325, 'Vector 100% · north up', vector], [630, 'Stars + art 30% · 3 HIP anchors', await sharp(overlay).resize(size, size).png().toBuffer()]]) {
    elements.push({ input, left: x, top: top + 32 });
    elements.push({ input: text(label, 290, 24, 12), left: x, top: top + 297 });
  }
  const opacityStats = [];
  opacityElements.push({ input: text(`${asset.assignment} → ${asset.name}`, 700, 28, 17), left: 20, top: 65 + i * 305 });
  for (const [j, opacity] of [.08, .12, .25, .35].entries()) {
    const mini = 132, left = 945 + (j % 2) * 145, y = top + 32 + Math.floor(j / 2) * 149;
    const dimmed = Buffer.from(svg.replace('<g fill="none"', `<g opacity="${opacity}" fill="none"`).replace('<g fill="#D4D4D4"', `<g opacity="${opacity}" fill="#D4D4D4"`));
    const raster = await sharp(dimmed).resize(mini, mini).flatten({ background: '#050505' }).png().toBuffer();
    elements.push({ input: raster, left, top: y });
    elements.push({ input: text(`${opacity * 100}%`, 100, 20, 11), left, top: y + mini });
    const { data: pixels } = await sharp(raster).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const peak = Math.max(...pixels);
    assert(peak > 10 && peak < 100, `${asset.id} opacity ${opacity}`);
    opacityStats.push({ opacity, previewSize: mini, peakChannel: peak, background: 5 });
    await fs.writeFile(path.join(here, 'previews', `${asset.name.toLowerCase()}-${Math.round(opacity * 100)}.png`), raster);
    const large = await sharp(dimmed).resize(256, 256).flatten({ background: '#050505' }).png().toBuffer();
    opacityElements.push({ input: large, left: 20 + j * 300, top: 94 + i * 305 });
    opacityElements.push({ input: text(`${opacity * 100}%`, 80, 20, 12), left: 20 + j * 300, top: 350 + i * 305 });
  }
  records.push({ id: asset.id, decodedWidth: meta.width, decodedHeight: meta.height, opacityStats });
}
const totalHeight = 90 + manifest.assets.length * rowHeight + 50;
elements.push({ input: text('Artwork: FAL 1.3 · line patterns: CC BY-SA 4.0 · catalog: ESA / CDS terms · no recovered vector master', width - 30, 35, 13), left: 20, top: totalHeight - 35 });
await sharp({ create: { width, height: totalHeight, channels: 4, background: '#050505' } }).composite(elements).png().toFile(path.join(here, 'contact-sheet.png'));
await sharp({ create: { width: 1220, height: 1890, channels: 4, background: '#050505' } }).composite(opacityElements).png().toFile(path.join(here, 'opacity-sheet.png'));
await fs.writeFile(path.join(here, 'decode-results.json'), JSON.stringify({ renderer: `sharp ${sharp.versions.sharp} / librsvg ${sharp.versions.rsvg}`, assets: records }, null, 2) + '\n');
console.log(JSON.stringify({ assets: records.length, opacityChecks: records.length * 4, width, height: totalHeight }));
