import fs from 'node:fs';
const j=JSON.parse(fs.readFileSync('outputs/redesign/r4.3/browser-verification.json'));
for(const r of j.results.slice(-6))console.log(JSON.stringify({label:r.label,chapter:r.chapter,p:r.progress,target:r.target,focus:r.focus,visible:r.visible,anchor:r.stage,pose:r.poseError,bh:r.bh}));
