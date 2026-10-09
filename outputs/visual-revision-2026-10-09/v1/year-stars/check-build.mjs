import fs from 'node:fs';
import crypto from 'node:crypto';
import {execSync} from 'node:child_process';
import assert from 'node:assert/strict';
const out='outputs/visual-revision-2026-10-09/v1/year-stars';
const owned=['src/components/Hero.jsx','src/components/effects/PortalHeading.jsx','src/styles/hero.css'];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const baseline=JSON.parse(fs.readFileSync('outputs/visual-revision-2026-10-09/v0/baseline.json'));
const source=()=>Object.fromEntries([...new Set([...baseline.inventory.map(x=>x.path),...owned])].filter(fs.existsSync).map(file=>[file,sha(file)]));
const report={startedAt:new Date().toISOString(),owned,sourceStart:source(),checks:{},logs:{}};
for(const [label,command] of [['scopedLint','node node_modules/eslint/bin/eslint.js src/components/Hero.jsx src/components/effects/PortalHeading.jsx'],['lint','npm run lint'],['build','npm run build']]) {
  try { const log=execSync(command,{encoding:'utf8',stdio:'pipe'});fs.writeFileSync(`${out}/${label}.log`,log);report.checks[label]='PASS'; }
  catch(e) {fs.writeFileSync(`${out}/${label}.log`,String(e.stdout||'')+String(e.stderr||''));report.checks[label]='FAIL';}
  report.logs[label]=`${out}/${label}.log`;
}
report.sourceEnd=source();
report.changedDuringChecks=Object.keys(report.sourceStart).filter(file=>report.sourceStart[file]!==report.sourceEnd[file]);
report.differentFromV0=baseline.inventory.filter(x=>report.sourceEnd[x.path]!==x.sha256).map(x=>({path:x.path,owner:owned.includes(x.path)?'V1':'pre-existing / parallel owner',sha256:report.sourceEnd[x.path]}));
report.dist=Object.fromEntries(fs.readdirSync('dist/assets').map(file=>[`dist/assets/${file}`,sha(`dist/assets/${file}`)]));
report.dist['dist/index.html']=sha('dist/index.html');
report.completedAt=new Date().toISOString();
fs.writeFileSync(`${out}/build-results.json`,JSON.stringify(report,null,2)+'\n');
assert(Object.values(report.checks).every(x=>x==='PASS'),'build/lint must pass');
assert.equal(report.changedDuringChecks.length,0,'source changed while building');
console.log(JSON.stringify({checks:report.checks,changedDuringChecks:report.changedDuringChecks,differentFromV0:report.differentFromV0.map(x=>({path:x.path,owner:x.owner}))},null,2));
