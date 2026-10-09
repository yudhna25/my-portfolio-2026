import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const baseline=JSON.parse(readFileSync('outputs/redesign/r4.2/baseline.json','utf8'));
const expected=['src/App.jsx','src/components/sections/Skills.jsx','src/components/effects/PortalHeading.jsx','src/3d/utils/cameraPath.js','src/data/skills.js','src/i18n/locales/vi.json','src/i18n/locales/en.json'];
if(readFileSync('AGENTS.md').length>readFileSync('outputs/redesign/r4.2/agents-before.txt').length)expected.push('AGENTS.md');
const changed=[],kept=[];
for(const [file,hash]of Object.entries(baseline.hashes)){
  const now=createHash('sha256').update(readFileSync(file)).digest('hex');
  (now===hash?kept:changed).push(file);
}
assert.deepEqual(changed.sort(),expected.sort(),'only the stated scope changed');
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'});
const index=execFileSync('git',['diff','--cached','--raw'],{encoding:'utf8'});
assert.equal(head,baseline.head);assert.equal(index,baseline.index);
const before=readFileSync('outputs/redesign/r4.2/agents-before.txt');
const agents=readFileSync('AGENTS.md');assert(agents.subarray(0,before.length).equals(before),'preserve AGENTS prefix');
const symbols=readFileSync('src/3d/components/SkillsSymbols.jsx','utf8');assert(symbols.includes('<SymbolStars'));assert(!symbols.includes('Canvas'));
const skills=readFileSync('src/components/sections/Skills.jsx','utf8');assert(!/orbitalSkills|hover-card|technicalLevel|pauseOrbit/.test(skills));assert(!/tabIndex=\{[1-9]/.test(skills));assert(skills.includes('mask="url(#skills-connection-mask)"'));
const result={status:'PASS',changed,kept:kept.length,newSource:['src/stores/useSkillsStore.js','src/3d/components/SkillsSymbols.jsx'],rendererAndAnchorPreserved:true,headAndIndexPreserved:true,agentsPrefixPreserved:true};
writeFileSync('outputs/redesign/r4.2/artifact-integrity.json',JSON.stringify(result,null,2));console.log(result);
