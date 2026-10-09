import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const out='outputs/redesign/r6.1';
const read=file=>JSON.parse(fs.readFileSync(file));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(`${dir}/${item.name}`):[`${dir}/${item.name}`]);
const leaves=(value,prefix='')=>Object.entries(value).flatMap(([key,item])=>typeof item==='object'?leaves(item,`${prefix}${key}.`):[`${prefix}${key}`]).sort();
const at=(value,key)=>key.split('.').reduce((result,part)=>result?.[part],value);
const baseline=read(`${out}/baseline.json`),selected=read(`${out}/selected-assets.json`).assets;
const blocks=read('outputs/redesign/r0.3/content-index.json').sections.flatMap(s=>s.blocks).filter(b=>b.status==='ready');
const owner=read(`${out}/owner-addendum.json`);
const locales=Object.fromEntries(['vi','en'].map(lang=>[lang,read(`src/i18n/locales/${lang}.json`)]));
assert.deepEqual(leaves(locales.vi.edura),leaves(locales.en.edura));
let exactBodies=0;
for(const lang of ['vi','en']){
  const before=read(`${out}/before/src/i18n/locales/${lang}.json`);
  const {edura,...unchanged}=locales[lang];assert.deepEqual(unchanged,before);
  for(const block of blocks){
    const copy=at(edura,block.id);assert(copy,block.id);
    if(block.id==='results.deliverables')continue;
    assert.equal(copy.body,block.body[lang],`${lang}/${block.id}`);exactBodies++;
    if(copy.heading)assert.equal(copy.heading,block.heading[lang]);
  }
  assert.equal(edura.context,owner.facts[0][lang]);
  assert.equal(edura.reflection.prototype,owner.facts[1][lang]);
  assert.equal(edura.reflection.references,owner.facts[2][lang]);
  assert.equal(edura.results.deliverables.body,lang==='vi'?'Thiết kế được thể hiện dưới dạng concept và prototype UI/UX trên Figma.':'The design takes the form of a UI/UX concept and Figma prototype.');
  assert(!JSON.stringify(edura).match(/APMS|Excellent UX|placeholder|coming soon|sắp ra mắt/i));
  for(const [i,id] of ['overview','problem','solution'].entries())assert.equal(edura.figures[id].alt,selected[i].alt[lang]);
}
assert.equal(exactBodies,16);
const code=fs.readFileSync('src/components/pages/Edura.jsx','utf8');
for(const key of [...code.matchAll(/t\('([^']+)'\)/g)].map(m=>m[1]))for(const lang of ['vi','en'])assert.equal(typeof at(locales[lang],key),'string',key);
for(const id of ['layout','color','system'])for(const lang of ['vi','en'])for(const field of ['heading','body'])assert.equal(typeof at(locales[lang],`edura.decisions.${id}.${field}`),'string');
assert(code.includes('if (reduced) return;'));assert(code.includes('revertOnUpdate: true'));
assert(!/Canvas|useFrame|ScrollTrigger|setInterval|style=/.test(code));
assert(code.includes('disabled={!onReturn}'));assert(code.includes('width="1400" height="989"'));
for(const asset of selected){
  assert.equal(hash(asset.sourcePath),asset.actual.sha256,`archive ${asset.id}`);
  assert.equal(hash(asset.recommendedPublicPath),asset.actual.sha256,`public ${asset.id}`);
}
assert.deepEqual(walk('public/projects/edura').sort(),selected.map(a=>a.recommendedPublicPath).sort());

const changed=[],preserved=[],missing=[];
for(const [file,info] of Object.entries(baseline.files)){
  if(!fs.existsSync(file))missing.push(file);
  else(hash(file)===info.sha256?preserved:changed).push(file);
}
assert.deepEqual(missing,[]);assert.deepEqual(changed.sort(),['src/i18n/locales/en.json','src/i18n/locales/vi.json']);
const current=[...walk('src'),...walk('public'),'index.html','vite.config.js','package.json','package-lock.json'];
const added=current.filter(file=>!baseline.files[file]).sort();
assert.deepEqual(added,['src/components/pages/Edura.jsx',...selected.map(a=>a.recommendedPublicPath)].sort());
assert.equal(execFileSync('git',['rev-parse','HEAD']).toString().trim(),baseline.head);
assert.equal(crypto.createHash('sha256').update(execFileSync('git',['diff','--cached','--binary'],{maxBuffer:64*1024*1024})).digest('hex'),baseline.stagedDiffHash);
const agents=fs.readFileSync('AGENTS.md','utf8'),beforeAgents=fs.readFileSync(`${out}/before/agents-before.txt`,'utf8');
assert(agents.startsWith(beforeAgents));
const rows=agents.slice(beforeAgents.length).split(/\r?\n/).filter(Boolean);
assert(rows.length<=1&&rows.every(row=>row.startsWith('|')&&row.includes('R6.1')));
const result={status:'pass',checkedAt:new Date().toISOString(),exactReadyBodies:exactBodies,eduraKeysPerLocale:leaves(locales.vi.edura).length,ownerFacts:owner.facts.map(f=>f.id),assets:selected.map(a=>({id:a.id,path:a.recommendedPublicPath,sha256:hash(a.recommendedPublicPath),bytes:fs.statSync(a.recommendedPublicPath).size})),totalAssetBytes:selected.reduce((sum,a)=>sum+a.actual.bytes,0),baselineFiles:Object.keys(baseline.files).length,preserved:preserved.length,changed,added,agentsRowsAdded:rows.length,head:baseline.head,appExactBaseline:true};
fs.writeFileSync(`${out}/integrity.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
