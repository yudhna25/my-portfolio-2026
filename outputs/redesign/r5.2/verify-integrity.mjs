import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='outputs/redesign/r5.2', hash=b=>crypto.createHash('sha256').update(b).digest('hex'), baseline=JSON.parse(fs.readFileSync(out+'/baseline.json'));
const allowed=new Set(['src/components/Work.jsx','src/3d/components/WorksConstellations.jsx','src/i18n/locales/vi.json','src/i18n/locales/en.json']);
const removed=['src/components/ui/TargetLockReticle.jsx'], changed=[],preserved=[],after={};
for(const [file,record] of Object.entries(baseline.files)) {
 if(!fs.existsSync(file)){assert(removed.includes(file),file);continue;}
 const bytes=fs.readFileSync(file);after[file]={sha256:hash(bytes),bytes:bytes.length};
 if(record.sha256===after[file].sha256)preserved.push(file);else{assert(allowed.has(file),file);changed.push(file);}
}
for(const lang of ['vi','en']) {
 const original=JSON.parse(fs.readFileSync(out+'/before/src/i18n/locales/'+lang+'.json')),next=JSON.parse(fs.readFileSync('src/i18n/locales/'+lang+'.json'));
 delete original.works;delete next.works;assert.deepEqual(next,original,'only works locale changes');
}
const originalRenderer=fs.readFileSync(out+'/before/src/3d/components/WorksConstellations.jsx','utf8'), renderer=fs.readFileSync('src/3d/components/WorksConstellations.jsx','utf8');
assert.equal(renderer.replace('(selected ? selected === WORKS_IDS[i] ? 1.2 : 0.35 : 1)','(selected && selected !== WORKS_IDS[i] ? 0.35 : 1)'),originalRenderer,'only selected strength changes');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
const added=[...walk('src'),...walk('public')].filter(f=>!Object.hasOwn(baseline.files,f));assert.deepEqual(added,[]);
const git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024});assert.equal(git('rev-parse','HEAD').toString().trim(),baseline.head);assert.equal(hash(git('diff','--cached','--binary')),baseline.stagedDiffHash);
const bytes=fs.readFileSync('AGENTS.md'),previous=fs.readFileSync(out+'/before/agents-before.txt');assert(bytes.subarray(0,previous.length).equals(previous));
const rows=bytes.subarray(previous.length).toString().split(/\r?\n/).filter(l=>l.trim());assert(rows.length<=1);if(rows.length)assert.match(rows[0],/^\|.*R5\.2.*\|$/);
const result={checkedAt:new Date().toISOString(),baselineCapturedAt:baseline.capturedAt,changed,removed,preserved,added,headUnchanged:true,stagedDiffUnchanged:true,agentsPrefixPreserved:true,agentsRowsAppended:rows.length,after};fs.writeFileSync(out+'/integrity-results.json',JSON.stringify(result,null,2));console.log({status:'PASS',changed:changed.length,removed:removed.length,preserved:preserved.length,added:added.length,agentsRowsAppended:rows.length});
