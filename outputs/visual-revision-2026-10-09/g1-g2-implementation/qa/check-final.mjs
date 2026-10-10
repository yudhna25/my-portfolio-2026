import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {out,inventory,sha,save} from './common.mjs';
const read=name=>JSON.parse(fs.readFileSync(out+'/'+name,'utf8'));
const baseline=read('baseline.json'),build=read('build-source.json');
for(const [file,hash]of Object.entries(build.source))assert.equal(sha(file),hash,file);
for(const [file,hash]of Object.entries(build.production))assert.equal(sha(file),hash,file);
const changed=baseline.files.filter(file=>sha(file.path)!==file.sha256).map(file=>file.path);
const added=inventory('src').filter(file=>!baseline.files.some(item=>item.path===file));
const allowed=new Set(['src/App.jsx','src/3d/GalaxyScene.jsx','src/3d/components/StoryMeteor.jsx','src/3d/utils/storyMeteor.js','src/3d/utils/portal.js','src/components/Preloader.jsx','src/components/effects/PortalHeading.jsx','src/components/layout/Nav.jsx','src/components/Cursor.jsx','src/components/sections/Experience.jsx','src/styles/hero.css']);
assert(changed.every(file=>allowed.has(file)),JSON.stringify(changed));
assert.deepEqual(added.sort(),['src/components/effects/portalTrails.js','src/styles/opening.css','src/styles/portal-trails.css'].sort());
const agents=fs.readFileSync('AGENTS.md');
assert.equal(createHash('sha256').update(agents.subarray(0,baseline.agentsPrefixBytes)).digest('hex'),baseline.agentsPrefixSha256,'AGENTS history must be unchanged');
function leaves(value,prefix=''){return Object.entries(value).flatMap(([key,item])=>typeof item==='object'&&item!==null?leaves(item,prefix+key+'.'):[prefix+key])}
const parity=[];
for(const [vi,en]of [['src/i18n/locales/vi.json','src/i18n/locales/en.json'],['src/i18n/locales/vi/lab.json','src/i18n/locales/en/lab.json'],['src/i18n/locales/vi/scene.json','src/i18n/locales/en/scene.json']]){
 const keys=leaves(JSON.parse(fs.readFileSync(vi))).sort();assert.deepEqual(keys,leaves(JSON.parse(fs.readFileSync(en))).sort());parity.push({vi,en,keys:keys.length});
}
for(const name of ['browser-results.json','extras-results.json','opening-fallback-results.json','performance-results.json']){const report=read(name);assert.equal(report.status,'pass',name);assert.deepEqual(report.source,build.source,name+' build mismatch')}
assert.equal(read('comet/pixel-results.json').status,'pass');
assert.equal(read('comet/pixel-results.json').buildAt,build.at);
assert.equal(read('intake/final-capture.json').build,sha(out+'/build-source.json'));
assert.deepEqual(read('clip-results.json').source,build.source);
const harness=inventory(out+'/qa').filter(file=>file.endsWith('.mjs'));
save('qa/harness-integrity.json',Object.fromEntries(harness.map(file=>[file,sha(file)])));
save('check-results.json',{status:'pass',changed,added,baselineFiles:baseline.files.length,unchanged:baseline.files.length-changed.length,sourceFiles:Object.keys(build.source).length,buildAt:build.at,agentsPrefixBytes:baseline.agentsPrefixBytes,parity,protected:read('protected-results.json')});
console.log(JSON.stringify({status:'pass',changed:changed.length,added:added.length,sourceFiles:Object.keys(build.source).length,parity}));
