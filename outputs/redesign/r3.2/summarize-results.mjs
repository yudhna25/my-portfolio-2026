import fs from 'node:fs';
const dir='outputs/redesign/r3.2',r=JSON.parse(fs.readFileSync(`${dir}/browser-results.json`)),p=JSON.parse(fs.readFileSync(`${dir}/preview-results.json`));
const poses=[...r.poses,...r.layouts,...r.cycles,...r.jumps,...r.lab];
console.log(JSON.stringify({records:poses.length+r.interactions.length,anchorError:Math.max(...poses.map(s=>s.anchorError)),cameraError:Math.max(...poses.map(s=>s.poseError)),directionError:Math.max(...poses.map(s=>s.directionError)),reverseError:Math.max(...r.poses.map(s=>s.reverseError??0)),stopped:r.interactions.filter(v=>v.type==='stop'),native:p.native,benchmarks:p.benchmarks.map(b=>({fps:b.fps,p:b.p})),reduced:p.freshReduced},null,2));
