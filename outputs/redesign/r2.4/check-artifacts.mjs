import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { PNG } = require('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs/lib/png.js');
const dir = 'outputs/redesign/r2.4/';
const baseline = JSON.parse(readFileSync(dir+'baseline.json','utf8'));
const allowed = new Set(['AGENTS.md','src/3d-lab.jsx','src/3d/GalaxyScene.jsx','src/3d/components/WorksConstellations.jsx','src/3d/components/BlackHole.jsx','src/3d/components/BlackHoleSystem.jsx','src/3d/components/BlackHoleBloomMask.jsx','src/3d/shaders/blackHole.js','src/3d/utils/cameraPath.js','src/i18n/locales/vi/lab.json','src/i18n/locales/en/lab.json']);
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const changed=[],preserved=[];
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}),baseline.head,'HEAD unchanged');
assert.equal(execFileSync('git',['diff','--cached','--raw'],{encoding:'utf8'}),baseline.index,'staging unchanged');
for(const [file,hash] of Object.entries(baseline.hashes)) {
  assert(existsSync(file),file+' removed');
  if(sha(file)!==hash){assert(allowed.has(file),'unexpected change '+file);changed.push(file);}else preserved.push(file);
}
const images=[];
for(const file of readdirSync(dir+'screenshots/').filter(x=>x.endsWith('.png'))){
  const {width,height,data}=PNG.sync.read(readFileSync(dir+'screenshots/'+file));
  let colored=0,dark=0,white=0,black=0,max=0;
  for(let i=0;i<data.length;i+=4){if(data[i]!==data[i+1]||data[i]!==data[i+2])colored++;if(data[i]<32)dark++;if(data[i]===255)white++;if(data[i]===0)black++;max=Math.max(max,data[i]);}
  const total=width*height;
  assert.equal(colored,0,file+' monochrome');assert(white/total<.02,file+' no flat white flash');
  if(file.endsWith('-0-58.png'))assert(dark/total>.08,file+' dark pockets');
  if(file==='desktop-1.png'||file==='mobile-1.png')assert(black>100,file+' preserved horizon');
  images.push({file,width,height,colored,darkFraction:dark/total,whiteFraction:white/total,blackPixels:black,max});
}
const flatten = obj => Object.entries(obj).flatMap(([key,value])=>typeof value==='object'?flatten(value).map(k=>key+'.'+k):[key]).sort();
assert.deepEqual(flatten(JSON.parse(readFileSync('src/i18n/locales/vi/lab.json'))),flatten(JSON.parse(readFileSync('src/i18n/locales/en/lab.json'))));
assert(readFileSync('AGENTS.md','utf8').startsWith(readFileSync(dir+'agents-before.txt','utf8')),'AGENTS append only');
for(const file of ['verification.md','handoff.md','trace.zip','clips/desktop.webm','clips/mobile.webm','check-results.json','browser-results.json','scroll-results.json']) assert(existsSync(dir+file),file);
const result={status:'pass',changed,preserved:preserved.length,images,localeKeys:flatten(JSON.parse(readFileSync('src/i18n/locales/vi/lab.json'))).length,newSource:['src/3d/utils/finale.js']};
writeFileSync(dir+'integrity.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,changed,preserved:result.preserved,images:images.length,localeKeys:result.localeKeys}));
