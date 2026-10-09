import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dir='outputs/task-4.1';
const load=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8').replace(/^\uFEFF/,''));
let samples=0;
for(const width of [320,390,768,1024,1440,1920]) {
 const data=load(`normal-${width}.json`);
 assert.equal(data.errors.length,0,`${width}: runtime errors`);
 for(const lang of ['vi','en']) for(const id of ['hero','about','skills','education','experience','work','playground','transmission','contact','stellar-menu']) {
  const s=data.samples.find(s=>s.width===width&&s.lang===lang&&s.id===id);
  assert.ok(s,`${width} ${lang} ${id}: missing`);samples++;
  assert.equal(s.scroll,s.client,`${width} ${lang} ${id}: horizontal overflow`);
  assert.equal(s.navOverlap.length,0,`${width} ${lang}: Nav collision`);
  assert.ok(s.headings.every(h=>h.outside.every(g=>g.left>=-1&&g.right<=s.client+1)),`${width} ${lang} ${id}: text outside heading`);
  assert.ok(s.containers.every(c=>c.w<=1600.1),`${width}: unbounded container`);
  if(width<1024) assert.ok(s.controls.concat(s.fixedControls).every(c=>c.w>=43.9&&c.h>=43.9),`${width} ${lang} ${id}: touch target <44`);
  if(id!=='stellar-menu') {assert.equal(s.bodyOverflow,'visible');assert.equal(s.rootOverflow,'visible');}
 }
}
for(const width of [320,390,768,1024,1440,1920]) {
 const data=load(`reduced-${width}.json`);
 assert.equal(data.errors.length,0);
 assert.ok(data.samples.length>=20);
 for(const s of data.samples) {assert.equal(s.scroll,s.client);assert.ok(s.headings.every(h=>h.outside.length===0));}
}
const reflow=load('works-reflow.json');
assert.equal(reflow.errors.length,0);
for(const width of [320,390,768,1024,1440,1920]) for(const lang of ['vi','en']) {
 const s=reflow.samples.find(s=>s.width===width&&s.lang===lang);
 assert.ok(s);assert.equal(s.scroll,s.client);assert.ok(s.headings.every(h=>h.outside.length===0));
}
const ultra=load('reduced-2560.json');
assert.equal(ultra.errors.length,0);assert.equal(ultra.samples.length,20);
assert.ok(ultra.samples.every(s=>s.scroll===s.client&&s.containers.every(c=>c.w<=1600.1)));
const safe=load('safe-area.json').safeArea;
assert.equal(safe.after.navHeight,119);
assert.equal(safe.after.navTop,'47px');
assert.equal(safe.after.navSide,'44px');
assert.equal(safe.after.menuHeader,119);
assert.equal(safe.after.indicatorBottom,'66px');
assert.equal(safe.after.menuBottom,'50px');
assert.equal(safe.after.themeTop,'127px');
const demos=load('demos.json');
for(const s of demos.samples) if(s.width<1024) assert.ok(s.controls.every(c=>c.w>=43.9&&c.h>=43.9),`${s.width}: demo touch target`);
const hero=load('final-hero.json');
assert.equal(hero.length,6);
for(const s of hero) {
 assert.equal(s.scroll,s.client);assert.equal(s.gap,32);assert.equal(s.speed,'clamp(0.8)');
 assert.equal(s.cursor,s.width<1024?0:1);assert.equal(s.bodyOverflow,'visible');assert.equal(s.rootOverflow,'visible');
}
const tablet=load('hero-tablet.json');
assert.equal(tablet.width,768);assert.equal(tablet.scroll,tablet.client);
assert.ok(tablet.chars.every(c=>c.left>=0&&c.right<=tablet.client));
assert.ok(fs.readFileSync('index.html','utf8').includes('viewport-fit=cover'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
const concurrent=new Map(load('concurrent-changes.json').map(item=>[item.file,item.after]));
for(const [file,expected] of Object.entries(load('protected.json'))) {
 if(file.includes('\\src\\3d\\')) continue; // Other user-owned session edits the 3D quality tier in parallel.
 assert.equal(hash(file),concurrent.get(file)||expected,file);
}
for(const [file,expected] of Object.entries(load('verified-source.json'))) assert.equal(hash(file),expected,file);
assert.ok(!fs.readFileSync('src/index.css','utf8').includes('overflow-x: hidden'));
console.log(`PASS — ${samples} normal section/locale poses, 6 reduced viewports, safe-area, touch targets, protected content and verified source.`);
