import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const out='outputs/visual-revision-2026-10-09/v8';
const baseline=JSON.parse(fs.readFileSync(out+'/baseline.json','utf8'));
const build=JSON.parse(fs.readFileSync(out+'/build-source.json','utf8'));
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const changed=Object.keys(baseline.source).filter(f=>sha(f)!==baseline.source[f]);
const allowed=['src/App.jsx','src/3d-lab.jsx','src/components/Work.jsx','src/components/Education.jsx','src/3d/components/WorksConstellations.jsx','src/3d/components/SkillsSymbols.jsx','src/i18n/locales/vi.json','src/i18n/locales/en.json','src/i18n/locales/vi/lab.json','src/i18n/locales/en/lab.json'];
assert.deepEqual(changed.sort(),allowed.sort());
for(const [file,hash]of Object.entries(build.source))assert.equal(sha(file),hash,'Source drift since production build: '+file);
const leaves=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'?leaves(v,p+k+'.'):[p+k]).sort();
const parity=[];for(const suffix of ['.json','/lab.json']){const vi=JSON.parse(fs.readFileSync('src/i18n/locales/vi'+suffix,'utf8')),en=JSON.parse(fs.readFileSync('src/i18n/locales/en'+suffix,'utf8'));assert.deepEqual(leaves(vi),leaves(en));parity.push({namespace:suffix,keys:leaves(vi).length});}
const app=fs.readFileSync('src/App.jsx','utf8');assert(app.includes('<Work layoutRef={worksLayout} />'));assert(app.includes('quality={quality} layoutRef={worksLayout}'));assert(app.includes('min-h-[225vh]'));
const result={passed:true,changed,added:['src/components/ui/ConstellationCredits.jsx'],preserved:Object.keys(baseline.source).length-changed.length,parity,productionSources:Object.keys(build.source).length};
fs.writeFileSync(out+'/check-results.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
