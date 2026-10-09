import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(dir, 'sources');
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const receipts = [];
const rad = value => value * Math.PI / 180;
const deg = value => value * 180 / Math.PI;
const spec = [
  ['Cir', 'Circinus', 'SGU', 'education', 'Drawing Compass', 'Compa vẽ kỹ thuật; liên hệ cấu trúc và độ chính xác là diễn giải thiết kế.'],
  ['Tel', 'Telescopium', 'Green Academy', 'education', 'Telescope', 'Kính thiên văn; liên hệ quan sát và dựng phim là diễn giải thiết kế.'],
  ['Pic', 'Pictor', 'Arena Multimedia', 'education', "Painter’s Easel", 'Giá vẽ; liên hệ nghệ thuật thị giác là diễn giải thiết kế.'],
  ['Cen', 'Centaurus', 'EDURA', 'works', 'Centaur', 'Chiron là người thầy trong truyền thuyết; liên hệ LMS là diễn giải thiết kế. Không nhầm Sagittarius.'],
  ['Gem', 'Gemini', 'VERIS', 'works', 'Twins', 'Song Tử; liên hệ kết nối con người là diễn giải thiết kế, không phải ý nghĩa thiên văn về bảo mật.'],
  ['Cyg', 'Cygnus', 'VIE', 'works', 'Swan', 'Thiên Nga; liên hệ sự thanh lịch là diễn giải thiết kế, không phải biểu tượng nước hoa truyền thống.'],
];
await fs.mkdir(sourceDir, { recursive: true });

async function download(url, filename, role, attribution, license) {
  const response = await fetch(url, { signal: AbortSignal.timeout(40000) });
  assert.equal(response.status, 200, `${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(path.join(sourceDir, filename), bytes);
  receipts.push({ url, finalUrl: response.url, role, attribution, license, status: response.status, retrievedAt: new Date().toISOString(), path: `astronomy/sources/${filename}`, bytes: bytes.length, sha256: sha256(bytes), contentType: response.headers.get('content-type') });
  return bytes.toString('utf8');
}

// HIP catalog coordinates are ICRS at J1991.25, not positions propagated to J2000.
function parseTsv(text) {
  assert.match(text, /Epoch=J1991\.25/);
  const rows = text.split(/\r?\n/).filter(line => /^\s*\d+\t/.test(line)).map(line => {
    const [hip, raDeg, decDeg, vmag] = line.trim().split('\t').map(Number);
    assert.ok(Number.isInteger(hip) && hip > 0 && raDeg >= 0 && raDeg < 360 && decDeg >= -90 && decDeg <= 90 && Number.isFinite(vmag), line);
    return { id: `HIP ${hip}`, hip, raDeg, decDeg, vmag };
  });
  assert.equal(rows.length, new Set(rows.map(row => row.hip)).size);
  return rows;
}

function centre(stars) {
  const sum = stars.reduce((v, star) => {
    const a = rad(star.raDeg), d = rad(star.decDeg);
    return [v[0] + Math.cos(d) * Math.cos(a), v[1] + Math.cos(d) * Math.sin(a), v[2] + Math.sin(d)];
  }, [0, 0, 0]);
  return { raDeg: (deg(Math.atan2(sum[1], sum[0])) + 360) % 360, decDeg: deg(Math.atan2(sum[2], Math.hypot(sum[0], sum[1]))) };
}

function project(star, origin) {
  const a = rad(star.raDeg - origin.raDeg), d = rad(star.decDeg), d0 = rad(origin.decDeg);
  const denominator = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a);
  assert.ok(denominator > 0, 'Star must be on the front hemisphere of the tangent plane.');
  return [-Math.cos(d) * Math.sin(a) / denominator, (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a)) / denominator];
}

const commitResponse = await fetch('https://api.github.com/repos/Stellarium/stellarium/commits?path=skycultures/modern/index.json&per_page=1', { signal: AbortSignal.timeout(40000) });
assert.equal(commitResponse.status, 200);
const commit = (await commitResponse.json())[0].sha;
const rawBase = `https://raw.githubusercontent.com/Stellarium/stellarium/${commit}/skycultures/modern`;
const sky = JSON.parse(await download(`${rawBase}/index.json`, 'stellarium-modern-index.json', 'stick-figure geometry', 'Stellarium team — Modern sky culture', 'CC BY-SA 4.0'));
await download(`${rawBase}/description.md`, 'stellarium-modern-description.md', 'convention/license/name context', 'Stellarium team', 'Text/data CC BY-SA 4.0; illustrations Free Art License (illustrations not used)');
await download('https://cdsarc.cds.unistra.fr/ftp/I/239/ReadMe', 'hipparcos-ReadMe.txt', 'catalog column/epoch documentation', 'ESA 1997, Hipparcos Catalogue ESA SP-1200; CDS/VizieR I/239', 'VizieR catalog terms: https://cds.unistra.fr/vizier-org/licences_vizier.html');
const figures = spec.map(([abbr]) => sky.constellations.find(c => c.id === `CON modern ${abbr}`));
assert.ok(figures.every(Boolean));
const ids = [...new Set(figures.flatMap(figure => figure.lines.flat().filter(Number.isInteger)))].sort((a, b) => a - b);
const catalogUrl = new URL('https://vizier.cds.unistra.fr/viz-bin/asu-tsv');
for (const [key, value] of Object.entries({ '-source': 'I/239/hip_main', HIP: ids.join(','), '-out': 'HIP,RAICRS,DEICRS,Vmag', '-out.max': '1000' })) catalogUrl.searchParams.set(key, value);
const catalogRows = parseTsv(await download(catalogUrl.href, 'hipparcos-main-stars.tsv', 'main star coordinates/photometry', 'ESA 1997; CDS/VizieR I/239/hip_main', 'VizieR catalog terms'));
const catalog = new Map(catalogRows.map(row => [row.hip, row]));
assert.equal(catalogRows.length, ids.length, 'Every figure star must have catalog coordinates.');

const constellations = [];
for (let index = 0; index < spec.length; index++) {
  const [abbr, name, assignment, section, nameMeaning, designInterpretation] = spec[index];
  const figure = figures[index];
  const hips = [...new Set(figure.lines.flat().filter(Number.isInteger))];
  const mainStars = hips.map(hip => catalog.get(hip));
  const origin = centre(mainStars);
  const maxRadius = Math.max(...mainStars.map(star => Math.atan(Math.hypot(...project(star, origin)))));
  // ponytail: bounded catalog background only; larger star fields belong to the shared scene, not this asset.
  const fieldRadiusDeg = Math.max(4, deg(maxRadius) * 1.2);
  const fieldUrl = new URL('https://vizier.cds.unistra.fr/viz-bin/asu-tsv');
  for (const [key, value] of Object.entries({ '-source': 'I/239/hip_main', '-c': `${origin.raDeg} ${origin.decDeg}`, '-c.rd': String(fieldRadiusDeg), Vmag: '<=5.5', '-out': 'HIP,RAICRS,DEICRS,Vmag', '-out.max': '1000', '-sort': 'Vmag' })) fieldUrl.searchParams.set(key, value);
  const fieldRows = parseTsv(await download(fieldUrl.href, `hipparcos-${abbr}-field.tsv`, 'supporting catalog field stars, no stick-figure edges', 'ESA 1997; CDS/VizieR I/239/hip_main', 'VizieR catalog terms'));
  const halfSpan = Math.tan(rad(fieldRadiusDeg));
  const withPosition = star => ({ ...star, position: [...project(star, origin).map(value => Number((value / halfSpan).toFixed(9))), 0] });
  const edges = figure.lines.flatMap(line => line.filter(Number.isInteger).slice(1).map((hip, i) => [`HIP ${line.filter(Number.isInteger)[i]}`, `HIP ${hip}`]));
  const supportingStars = fieldRows.filter(star => !hips.includes(star.hip)).sort((a, b) => a.vmag - b.vmag || a.hip - b.hip).slice(0, 12).map(withPosition);
  const chartUrl = `https://iauarchive.eso.org/static/public/constellations/gif/${abbr.toUpperCase()}.gif`;
  await download(chartUrl, `iau-${abbr.toUpperCase()}.gif`, 'reference comparison chart only; NOT source of selected edges', 'IAU / Sky & Telescope (Roger Sinnott, Rick Fienberg; patterns Alan MacRobert)', 'CC BY 4.0');
  constellations.push({ id: abbr, name, assignment, section, status: 'ready', nameMeaning, designInterpretation, meaningSourceIds: ['iau-names', ...(abbr === 'Cen' ? ['chandra-centaurus'] : [])], geometry: { convention: 'Stellarium Modern', sourceId: 'stellarium-modern', sourceConstellationId: figure.id, polylinesHip: figure.lines, edges, stars: mainStars.map(withPosition), supportingStars, supportingStarPolicy: 'At most 12 brightest Johnson V <= 5.5 field stars, excluding stick-figure stars. No edge; a cone may include adjacent constellations. These are context, not members added to the figure.', fieldStarsReturned: fieldRows.length }, projection: { type: 'gnomonic', origin, fieldRadiusDeg, uniformScale: 1 / halfSpan, xDirection: 'celestial west right (increasing RA left)', yDirection: 'north up', z: 0, view: 'sky as seen from Earth, not exterior celestial globe', normalization: 'same scalar for x/y; no independent stretch, mirroring or invented coordinates' }, referenceChart: { sourceId: 'iau-charts', path: `astronomy/sources/iau-${abbr.toUpperCase()}.gif`, role: 'comparison only; IAU/MacRobert patterns can differ from selected Modern figure' }, notes: mainStars.length <= 3 ? [`Sparse source figure: ${mainStars.length} main stars / ${edges.length} edges. Do not invent nodes to fill space.`] : [] });
}

const data = { schemaVersion: 1, createdAt: new Date().toISOString(), status: 'ready', catalog: { id: 'I/239/hip_main', frame: 'ICRS', positionEpoch: 'J1991.25', magnitudeBand: 'Johnson V', coordinatesUnit: 'degree', properMotionApplied: false, note: 'RAICRS/DEICRS are J1991.25 positions. They are not relabelled as J2000 or current-date positions.' }, chartConvention: { id: 'stellarium-modern', name: 'Stellarium Modern', commit, license: 'CC BY-SA 4.0', attribution: 'Star-line figures adapted from Stellarium team, Modern sky culture, CC BY-SA 4.0. Catalog positions from ESA 1997, Hipparcos Catalogue ESA SP-1200, CDS/VizieR I/239/hip_main.', iauNote: 'IAU defines constellation boundaries and names, but no unique official stick figure. Selected edges are the Stellarium Modern convention, not an IAU-prescribed shape.' }, sources: [ { id: 'stellarium-modern', url: `${rawBase}/index.json`, role: 'edge HIP IDs', localPath: 'astronomy/sources/stellarium-modern-index.json' }, { id: 'hipparcos', url: catalogUrl.href, role: 'catalog positions/photometry', localPath: 'astronomy/sources/hipparcos-main-stars.tsv' }, { id: 'iau-names', url: 'https://www.iau.org/IAU/IAU/Astronomy-FAQs/Constellations.aspx?hkey=bb9dc841-0618-41b5-ac70-149741062141', role: 'name meanings and absence of official stick figures; not edge geometry' }, { id: 'iau-charts', url: 'https://iauarchive.eso.org/public/themes/constellations/', role: 'comparison only; different chart convention' }, { id: 'chandra-centaurus', url: 'https://chandra.harvard.edu/photo/constellations/centaurus.html', role: 'Chiron/teacher mythology only; not geometry' } ], constellations };
await fs.writeFile(path.join(dir, '..', 'constellation-data.json'), JSON.stringify(data, null, 2) + '\n');
await fs.writeFile(path.join(dir, 'source-receipts.json'), JSON.stringify(receipts, null, 2) + '\n');
const cells = constellations.map((c, i) => {
  const x0 = (i % 3) * 400, y0 = Math.floor(i / 3) * 410;
  const xy = star => [x0 + 200 + star.position[0] * 146, y0 + 203 - star.position[1] * 146];
  const map = new Map(c.geometry.stars.map(star => [star.id, star]));
  const points = c.geometry.stars.map(star => { const [x,y] = xy(star); const radius = Math.max(1.6, 4.4 - star.vmag * .42); return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#fafafa"/><text x="${x + 7}" y="${y - 7}" font-size="9" fill="#b5b5b5">${star.hip}</text>`; }).join('');
  const supporting = c.geometry.supportingStars.map(star => { const [x,y] = xy(star); return `<circle cx="${x}" cy="${y}" r="1" fill="#555"/>`; }).join('');
  const links = c.geometry.edges.map(([a,b]) => { const p=xy(map.get(a)), q=xy(map.get(b)); return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#888" stroke-width=".8"/>`; }).join('');
  return `<g><rect x="${x0+10}" y="${y0+10}" width="380" height="390" fill="none" stroke="#272727"/><text x="${x0+28}" y="${y0+38}" fill="#fafafa" font-size="20">${c.name}</text><text x="${x0+28}" y="${y0+61}" fill="#bbb" font-size="12">${c.assignment} · ${c.geometry.stars.length} stars / ${c.geometry.edges.length} edges</text>${supporting}${links}${points}<text x="${x0+28}" y="${y0+371}" fill="#999" font-size="11">N ↑  ·  E ←  ·  HIP labels  ·  faint dots: catalog field</text></g>`;
}).join('');
await fs.writeFile(path.join(dir, 'constellations-sheet.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="870" viewBox="0 0 1200 870"><rect width="1200" height="870" fill="#050505"/><g font-family="Arial,sans-serif">${cells}<text x="26" y="852" fill="#bbb" font-size="11">Stellarium Modern (CC BY-SA 4.0) · ESA Hipparcos J1991.25 / CDS · Gnomonic, north up, east left · Geometry preview; no animation</text></g></svg>`);
console.log(JSON.stringify({ commit, mainStars: ids.length, figures: constellations.map(c => ({ id: c.id, stars: c.geometry.stars.length, edges: c.geometry.edges.length, supportingStars: c.geometry.supportingStars.length })), sourceCount: receipts.length }, null, 2));
