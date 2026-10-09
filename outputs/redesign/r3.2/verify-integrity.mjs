import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const out='outputs/redesign/r3.2', baseline=JSON.parse(fs.readFileSync(`${out}/baseline.json`));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const allowed=new Set(['src/App.jsx','src/index.css','src/components/Hero.jsx','src/components/effects/PortalHeading.jsx','src/components/Cursor.jsx','src/components/layout/Nav.jsx','src/components/layout/MenuOverlay.jsx','src/3d/GalaxyScene.jsx','src/3d-lab.jsx','src/3d/components/BlackHole.jsx','src/3d/components/ShootingStars.jsx','src/3d/utils/shootingStars.js','src/3d/hooks/useScrollProgress.js','src/stores/useScrollStore.js','src/i18n/locales/vi.json','src/i18n/locales/en.json']);
const changed=[],preserved=[],after={};
for(const[file,value]of Object.entries(baseline.files)){
 const bytes=fs.readFileSync(file);after[file]={sha256:hash(bytes),bytes:bytes.length};
 if(after[file].sha256===value.sha256)preserved.push(file);else{assert.ok(allowed.has(file),`Unexpected change: ${file}`);changed.push(file);}
}
assert.equal(hash(execFileSync('git',['diff','--cached','--binary'],{maxBuffer:64*1024*1024})),baseline.stagedDiffHash);
for(const lang of ['vi','en']){
 const before=JSON.parse(fs.readFileSync(`${out}/before/src/i18n/locales/${lang}.json`)),current=JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}.json`));
 delete current.hero.portfolio;delete current.hero.year;assert.deepEqual(current,before);
}
const agents=fs.readFileSync('AGENTS.md'),before=fs.readFileSync(`${out}/before/agents-before.txt`);assert.ok(agents.subarray(0,before.length).equals(before));
const result={checkedAt:new Date().toISOString(),changed,preserved,stagedDiffUnchanged:true,agentsPrefixPreserved:true,agentsAddedBytes:agents.length-before.length,after};
fs.writeFileSync(`${out}/integrity-results.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({changed:changed.length,preserved:preserved.length,stagedDiffUnchanged:true,agentsAddedBytes:result.agentsAddedBytes}));
