import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const dest = new URL('./sources/', import.meta.url);
export const revision = 'daace2add6a1bf886e8ee1934f51e9c69f818d18';
const base = `https://raw.githubusercontent.com/Stellarium/stellarium/${revision}/skycultures/modern/`;
const receipts = [];
async function download(url, filename) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  assert.equal(response.status, 200, `${filename}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(new URL(filename, dest), bytes);
  receipts.push({ url, finalUrl: response.url, filename, status: response.status,
    retrievedAt: new Date().toISOString(), bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  return bytes;
}
await fs.mkdir(dest, { recursive: true });
const index = JSON.parse(await download(base + 'index.json', 'index.json'));
const figures = index.constellations.filter(c => ['Ori', 'Sco', 'Leo', 'Cen', 'Gem', 'Cyg'].includes(c.id.split(' ').at(-1)));
assert.equal(figures.length, 6);
await Promise.all([
  download(base + 'description.md', 'description.md'),
  download(`https://api.github.com/repos/Stellarium/stellarium/commits/${revision}`, 'revision.json'),
  download('https://johanmeuris.eu/work/stellarium-constellation-art/', 'author.html'),
  download('https://artlibre.org/licence/lal/en/', 'free-art-license.html'),
  download('https://cds.unistra.fr/vizier-org/licences_vizier.html', 'vizier-licenses.html'),
  download(`https://raw.githubusercontent.com/Stellarium/stellarium/${revision}/src/core/modules/ConstellationMgr.cpp`, 'ConstellationMgr.cpp'),
  ...figures.map(c => download(base + c.image.file, c.image.file.split('/').at(-1))),
]);
const readme = await fs.readFile(new URL('../../redesign/r0.2/astronomy/sources/hipparcos-ReadMe.txt', import.meta.url));
await fs.writeFile(new URL('hipparcos-ReadMe.txt', dest), readme);
receipts.push({ filename: 'hipparcos-ReadMe.txt', source: 'outputs/redesign/r0.2/astronomy/sources/hipparcos-ReadMe.txt',
  url: 'https://cdsarc.cds.unistra.fr/ftp/I/239/ReadMe', status: 'inherited snapshot; fresh FTP 403 / ReadMe CGI 500',
  bytes: readme.length, sha256: crypto.createHash('sha256').update(readme).digest('hex') });
const hips = [...new Set(figures.flatMap(c => [...c.lines.flat(), ...c.image.anchors.map(a => a.hip)]))].sort((a,b) => a-b);
const url = new URL('https://vizier.cds.unistra.fr/viz-bin/asu-tsv');
for (const [key, value] of Object.entries({ '-source': 'I/239/hip_main', HIP: hips.join(','), '-out': 'HIP,RAICRS,DEICRS,Vmag', '-out.max': '1000' })) url.searchParams.set(key, value);
await download(url.href, 'hipparcos-stars.tsv');
await fs.writeFile(new URL('./source-receipts.json', import.meta.url), JSON.stringify(receipts.sort((a,b) => a.filename.localeCompare(b.filename)), null, 2) + '\n');
console.log(JSON.stringify({ revision, files: receipts.length, hips: hips.length, sourceDir: new URL('./sources/', import.meta.url).pathname }));
