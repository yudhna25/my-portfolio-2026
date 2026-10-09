import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(dir);
const data = JSON.parse(await fs.readFile(path.join(root, 'constellation-data.json'), 'utf8'));
const source = JSON.parse(await fs.readFile(path.join(dir, 'sources/stellarium-modern-index.json'), 'utf8'));
const rows = text => new Map(text.split(/\r?\n/).filter(line => /^\s*\d+\t/.test(line)).map(line => { const [hip, ra, dec, mag] = line.trim().split('\t').map(Number); return [hip, { ra, dec, mag }]; }));
const mainCatalog = rows(await fs.readFile(path.join(dir, 'sources/hipparcos-main-stars.tsv'), 'utf8'));
const receipts = JSON.parse(await fs.readFile(path.join(dir, 'source-receipts.json'), 'utf8'));
for (const receipt of receipts) {
  const bytes = await fs.readFile(path.join(root, receipt.path));
  assert.equal(bytes.length, receipt.bytes);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), receipt.sha256, receipt.path);
}
assert.equal(data.catalog.positionEpoch, 'J1991.25');
assert.equal(data.catalog.frame, 'ICRS');
assert.equal(data.catalog.properMotionApplied, false);
assert.deepEqual(data.constellations.map(c => [c.id, c.assignment]), [['Cir','SGU'], ['Tel','Green Academy'], ['Pic','Arena Multimedia'], ['Cen','EDURA'], ['Gem','VERIS'], ['Cyg','VIE']]);
const rad = value => value * Math.PI / 180;
let starCount = 0, edgeCount = 0;
for (const c of data.constellations) {
  const original = source.constellations.find(value => value.id === c.geometry.sourceConstellationId);
  assert.deepEqual(c.geometry.polylinesHip, original.lines);
  const expectedEdges = original.lines.flatMap(line => line.slice(1).map((hip, i) => [`HIP ${line[i]}`, `HIP ${hip}`]));
  assert.deepEqual(c.geometry.edges, expectedEdges, c.name);
  const members = new Set(c.geometry.stars.map(star => star.id));
  assert.deepEqual([...members].sort(), [...new Set(original.lines.flat().map(hip => `HIP ${hip}`))].sort());
  assert.equal(c.geometry.supportingStars.length <= 12, true);
  const supportCatalog = rows(await fs.readFile(path.join(dir, `sources/hipparcos-${c.id}-field.tsv`), 'utf8'));
  for (const star of [...c.geometry.stars, ...c.geometry.supportingStars]) {
    const row = members.has(star.id) ? mainCatalog.get(star.hip) : supportCatalog.get(star.hip);
    assert.ok(row, `${star.id} absent from source`);
    assert.deepEqual([star.raDeg, star.decDeg, star.vmag], [row.ra, row.dec, row.mag]);
    assert.ok(Number.isFinite(star.raDeg) && star.raDeg >= 0 && star.raDeg < 360 && Math.abs(star.decDeg) <= 90 && Number.isFinite(star.vmag));
    const a = rad(star.raDeg - c.projection.origin.raDeg), d = rad(star.decDeg), d0 = rad(c.projection.origin.decDeg);
    const den = Math.sin(d0)*Math.sin(d) + Math.cos(d0)*Math.cos(d)*Math.cos(a);
    const x = -Math.cos(d)*Math.sin(a)/den*c.projection.uniformScale;
    const y = (Math.cos(d0)*Math.sin(d)-Math.sin(d0)*Math.cos(d)*Math.cos(a))/den*c.projection.uniformScale;
    assert.ok(den > 0 && Math.abs(x-star.position[0]) < 1e-8 && Math.abs(y-star.position[1]) < 1e-8 && star.position[2] === 0, `${star.id} projection mismatch`);
    // Inverse gnomonic confirms there is no hidden mirror/stretch in projected data.
    const xx = -star.position[0]/c.projection.uniformScale, yy = star.position[1]/c.projection.uniformScale;
    const rho = Math.hypot(xx,yy), angle = Math.atan(rho);
    const inverseDec = rho === 0 ? d0 : Math.asin(Math.cos(angle)*Math.sin(d0)+yy*Math.sin(angle)*Math.cos(d0)/rho);
    const inverseDeltaRa = rho === 0 ? 0 : Math.atan2(xx*Math.sin(angle),rho*Math.cos(d0)*Math.cos(angle)-yy*Math.sin(d0)*Math.sin(angle));
    assert.ok(Math.abs(inverseDec-d) < 2e-8 && Math.abs(Math.atan2(Math.sin(inverseDeltaRa-a),Math.cos(inverseDeltaRa-a))) < 2e-8);
    if (!members.has(star.id)) assert.ok(star.vmag <= 5.5 && !expectedEdges.flat().includes(star.id));
    starCount++;
  }
  for (const [a,b] of expectedEdges) assert.ok(a !== b && members.has(a) && members.has(b));
  assert.equal(expectedEdges.length, new Set(expectedEdges.map(pair => [...pair].sort().join('|'))).size);
  edgeCount += expectedEdges.length;
}
// Celestial east (larger RA) must render left in this sky-view convention.
assert.ok(-Math.cos(0)*Math.sin(rad(1))/Math.cos(rad(1)) < 0);
console.log(JSON.stringify({ status: 'pass', constellations: data.constellations.length, starsCheckedIncludingSupporting: starCount, edgesChecked: edgeCount, sourceFilesHashed: receipts.length, sourceEpoch: data.catalog.positionEpoch, checks: ['source hashes', 'exact catalog rows', 'exact Modern edges', 'HIP membership and duplicates', 'projection recomputation', 'inverse projection and east-left orientation'] }, null, 2));
