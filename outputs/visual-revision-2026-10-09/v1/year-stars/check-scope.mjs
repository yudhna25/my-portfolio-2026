import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root='outputs/visual-revision-2026-10-09/v1',out=`${root}/year-stars`;
const read=path=>fs.readFileSync(path,'utf8').replaceAll('\r\n','\n');
const sha=path=>crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const before=read(`${out}/PortalHeading.before.jsx`),after=read('src/components/effects/PortalHeading.jsx');
const checks=[];
function check(label,condition){assert(condition,label);checks.push({label,pass:true});}
check('Hero caller and all copy unchanged',read(`${out}/Hero.before.jsx`)===read('src/components/Hero.jsx'));
for(const [label,start,end] of [['heading, O anchor and details JSX','      <h1','\n}'],['portal intake transforms','    const bend =','    const digit ='],['glitch timeline','    const flash =','    const nameNode ='],['decode timeline','    const nameNode =','    let running;']]) {
  const section=text=>text.slice(text.indexOf(start),text.indexOf(end,text.indexOf(start)));
  check(`${label} unchanged`,section(before)===section(after));
}
const previous=JSON.parse(read(`${root}/browser-results.json`)),current=JSON.parse(read(`${out}/browser-results.json`));
for(const [index,metric] of current.metrics.entries()) {
  const old=previous.metrics[index];
  for(const key of ['content','title','year','anchor','name','role','intro','indicator']) {
    check(`geometry ${index} ${key} unchanged`,Object.keys(metric[key]).every(axis=>Math.abs(metric[key][axis]-old[key][axis])<0.1));
  }
}
const build=JSON.parse(read(`${out}/build-results.json`));
check('browser source stable',JSON.stringify(current.sourceStart)===JSON.stringify(current.sourceEnd));
check('build and browser match',Object.keys(current.sourceEnd).every(file=>current.sourceEnd[file]===build.sourceEnd[file]));
const production=JSON.parse(read(`${out}/production-results.json`));
check('production dist fingerprint matches',Object.keys(production.buildFingerprint).every(file=>sha(file)===production.buildFingerprint[file]));
check('all screenshots exist',current.frames.every(frame=>fs.existsSync(frame.file)));
fs.writeFileSync(`${out}/scope-results.json`,JSON.stringify({checks,ownedSource:Object.fromEntries(['src/components/Hero.jsx','src/components/effects/PortalHeading.jsx','src/styles/hero.css'].map(file=>[file,sha(file)]))},null,2)+'\n');
console.log(`${checks.length} scope/integrity checks pass`);
