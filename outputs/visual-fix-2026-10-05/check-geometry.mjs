import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { PerspectiveCamera, Vector3 } from 'three';
import { buildStarGeometry } from '../../src/3d/utils/buildStarGeometry.js';
import { cameraPath } from '../../src/3d/utils/cameraPath.js';

let seed = 1042026;
const random = Math.random;
Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const geometry = buildStarGeometry(10000);
Math.random = random;
const octants = Array(8).fill(0), sizes = [0,0,0];
const mean = new Vector3();
for (let i = 0; i < 10000; i++) {
  const point = new Vector3().fromBufferAttribute(geometry.attributes.position,i);
  assert(point.length() >= 279.999 && point.length() <= 340.001);
  point.normalize(); mean.add(point);
  octants[(point.x>0?1:0)+(point.y>0?2:0)+(point.z>0?4:0)]++;
  const size = geometry.attributes.aSize.getX(i);
  assert(size >= 0.799 && size <= 3);
  sizes[size < 1.25 ? 0 : size < 2 ? 1 : 2]++;
}
mean.divideScalar(10000);
assert(mean.length() < 0.025, 'No directional bunching toward the black hole');
assert(octants.every(count=>count>1100 && count<1400),'Stars cover all directions');
assert(sizes[0]>8000 && sizes[2]<400,'Mostly pinpoints, rare bright stars');
const poses = [0.1,0.3,0.5,0.7,0.9].map(cameraPath);
assert.deepEqual(poses.map(p=>Math.sign(p.x)),[-1,1,-1,1,-1]);
const end = cameraPath(1);
assert(Math.hypot(end.x,end.y,end.z+200) < 41);
const camera = new PerspectiveCamera(60, 16/9,0.1,400);
camera.position.set(end.x,end.y,end.z); camera.lookAt(end.lookX,0,-200); camera.updateMatrixWorld();
const screen = new Vector3(0,0,-200).project(camera);
assert(screen.x > 0 && screen.x < 0.8, 'Black hole framed on the right');
const report = { status:'PASS', stars:10000, meanDirection:mean.toArray(), octants, sizeCounts:sizes, poses, end, centerNdc:screen.toArray() };
geometry.dispose();
await writeFile(new URL('./geometry-results.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
