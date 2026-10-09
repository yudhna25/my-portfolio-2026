import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const out='outputs/redesign/r5.1',hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const before=JSON.parse(fs.readFileSync(`${out}/baseline.json`));
const allowed=new Set(['src/App.jsx','src/3d-lab.jsx','src/components/sections/Experience.jsx','src/components/Work.jsx','src/components/sections/Contact.jsx','src/3d/components/ShootingStars.jsx','src/3d/utils/shootingStars.js','src/3d/components/WorksConstellations.jsx','src/3d/utils/cameraPath.js','src/stores/useScrollStore.js','src/i18n/locales/vi/lab.json','src/i18n/locales/en/lab.json']);
const changed=[],preserved=[],after={};
for(const [file,record] of Object.entries(before.files)) {const bytes=fs.readFileSync(file);after[file]={sha256:hash(bytes),bytes:bytes.length};if(record.sha256===after[file].sha256)preserved.push(file);else {assert(allowed.has(file),file);changed.push(file);}}
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(`${dir}/${item.name}`):[`${dir}/${item.name}`]);
const added=[...walk('src'),...walk('public')].filter(file=>!Object.hasOwn(before.files,file));
assert.deepEqual(added.sort(),['src/3d/components/StoryMeteor.jsx','src/3d/utils/storyMeteor.js']);
const git=(...args)=>execFileSync('git',args,{maxBuffer:64*1024*1024});
assert.equal(git('rev-parse','HEAD').toString().trim(),before.head);assert.equal(hash(git('diff','--cached','--binary')),before.stagedDiffHash);
for(const file of ['src/components/Work.jsx','src/components/sections/Contact.jsx']) {
  const cleaned=fs.readFileSync(`${out}/before/${file}`,'utf8').replace(/^import \{ triggerShootingStar \} from '@\/3d\/utils\/shootingStars';\r?\n/m,'').replace(/^\s*triggerShootingStar\(\);\r?\n/gm,'');
  assert.equal(fs.readFileSync(file,'utf8'),cleaned,`${file}: only reactive meteor event removed`);
}
const bytes=fs.readFileSync('AGENTS.md'),previous=fs.readFileSync(`${out}/before/agents-before.txt`);
assert(bytes.subarray(0,previous.length).equals(previous));const rows=bytes.subarray(previous.length).toString().split(/\r?\n/).filter(line=>line.trim());assert(rows.length<=1);if(rows.length)assert.match(rows[0],/^\|.*R5\.1.*\|$/);
const result={checkedAt:new Date().toISOString(),baselineCapturedAt:before.capturedAt,changed,preserved,added:added.map(file=>({file,sha256:hash(fs.readFileSync(file))})),headUnchanged:true,stagedDiffUnchanged:true,agentsPrefixPreserved:true,agentsRowsAppended:rows.length,after};
fs.writeFileSync(`${out}/integrity-results.json`,JSON.stringify(result,null,2));console.log({status:'PASS',changed:changed.length,preserved:preserved.length,added,agentsRowsAppended:rows.length});
