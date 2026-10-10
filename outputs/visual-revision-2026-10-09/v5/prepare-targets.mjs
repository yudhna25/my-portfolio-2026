import fs from 'node:fs';
import assert from 'node:assert/strict';
const pack = JSON.parse(fs.readFileSync('outputs/visual-revision-2026-10-09/v4/education-data.json'));
const data = JSON.parse(fs.readFileSync('src/3d/data/symbolTargets.json'));
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function hull(points) {
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const half = list => { const result = []; for (const p of list) {
    while (result.length > 1 && cross(result.at(-2), result.at(-1), p) <= 0) result.pop(); result.push(p);
  } return result.slice(0, -1); };
  return [...half(points), ...half([...points].reverse())];
}
data.education = pack.education.map(item => {
  const svg = fs.readFileSync('public' + item.artwork.url, 'utf8'), matrix = item.artwork.vectorPixelToLocal;
  const points = item.geometry.stars.map(s => s.position.slice(0, 2));
  for (const match of svg.matchAll(/<path[^>]*d="([^"]+)"/g)) {
    assert([...new Set(match[1].match(/[A-Za-z]/g))].every(c => ['M','L','Z'].includes(c)));
    for (const pair of match[1].matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)) {
      const u = Number(pair[1]), v = Number(pair[2]);
      points.push([matrix[0][0] * u + matrix[0][1] * v + matrix[0][2], matrix[1][0] * u + matrix[1][1] * v + matrix[1][2]]);
    }
  }
  return { ...item, artwork: { ...item.artwork, hitHull: hull(points).map(p => p.map(x => Number(x.toFixed(9)))) } };
});
data.educationSource = { path: 'outputs/visual-revision-2026-10-09/v4/education-data.json', catalog: pack.catalog,
  hitHull: 'Convex union of calibrated SVG M/L contour vertices and main star positions; interaction geometry only.' };
fs.writeFileSync('src/3d/data/symbolTargets.json', JSON.stringify(data) + '\n');
console.log('Applied verified Education entries; Skills fields retained. Hull vertices:', data.education.map(x => x.artwork.hitHull.length));
