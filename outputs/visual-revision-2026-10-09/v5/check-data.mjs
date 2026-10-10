import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const out = 'outputs/visual-revision-2026-10-09/v5';
const read = p => fs.readFileSync(p, 'utf8'), json = p => JSON.parse(read(p));
const data = json('src/3d/data/symbolTargets.json'), old = json(out + '/before/symbolTargets.json');
// JSON serialization canonicalizes -0 to 0; both encode the same affine basis.
const v4 = JSON.parse(JSON.stringify(json('outputs/visual-revision-2026-10-09/v4/education-data.json'))), baseline = json(out + '/baseline.json');
let assertions = 0; const equal = (a,b,label) => { assertions++; assert.deepEqual(a,b,label); };
const ok = (v,label) => { assertions++; assert(v,label); };
for (const key of Object.keys(old).filter(k => !['education','educationSource'].includes(k))) equal(data[key],old[key],'Preserved Skills field '+key);
const logoReceipts=data.logos.map(logo=>{
  const bytes=fs.readFileSync(logo.path),rawHash=createHash('sha256').update(bytes).digest('hex');
  const sourceHash=createHash('sha256').update(logo.path.endsWith('.svg')?bytes.toString('utf8').replaceAll('\r\n','\n'):bytes).digest('hex');
  ok(rawHash===logo.sha256||sourceHash===logo.sha256,'Logo source identity (raw or original SVG LF) '+logo.id);
  return{id:logo.id,rawHash,sourceHash,metadataHash:logo.sha256,crlfCheckout:rawHash!==sourceHash};
});
const load = async (file,d) => import('data:text/javascript;base64,' + Buffer.from(read(file)
  .replace("import data from '@/3d/data/symbolTargets.json';", 'const data = '+JSON.stringify(d)+';')).toString('base64'));
const actual = await load('src/3d/utils/symbolMorph.js',data), previous = await load(out+'/before/symbolMorph.js',old);
for (const id of actual.SYMBOL_TOOL_IDS) {
  const a=actual.createSymbolPool(), b=previous.createSymbolPool();
  actual.setSymbolTarget(a,id); previous.setSymbolTarget(b,id);
  for(let i=0;i<160;i++) {
    const delta=[1/60,.04,0,1/120][i%4]; actual.advanceSymbolPool(a,delta); previous.advanceSymbolPool(b,delta);
    for(const key of ['positions','goal','weights','sizes','phase','formation','lines','logo','updates','settled']) equal(a[key],b[key],id+' '+key+' frame '+i);
  }
}
const anchors=[];
for(let index=0;index<data.education.length;index++) {
  const item=data.education[index], verified=v4.education[index], {hitHull,...artwork}=item.artwork;
  equal({...item,artwork},verified,'V4 geometry/projection/artwork/epoch unchanged '+item.name);
  equal(createHash('sha256').update(fs.readFileSync('public'+artwork.url)).digest('hex'),artwork.sha256,'Asset hash '+item.name);
  ok(hitHull.length>=3,'Projected figure hull');
  const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  for(const star of item.geometry.stars) for(let i=0;i<hitHull.length;i++) ok(cross(hitHull[i],hitHull[(i+1)%hitHull.length],star.position)>=-1e-8,'Hit hull contains '+star.id);
  for(const anchor of artwork.anchors) {
    const [u,v]=anchor.vectorPixel, m=artwork.vectorPixelToLocal;
    const xy=[m[0][0]*u+m[0][1]*v+m[0][2],m[1][0]*u+m[1][1]*v+m[1][2]];
    const error=Math.max(...xy.map((x,i)=>Math.abs(x-anchor.localPosition[i]))); ok(error<1e-10,'Artwork three-anchor calibration');
    const star=[...item.geometry.stars,...item.calibrationStars].find(s=>s.hip===anchor.hip);
    ok(star,'HIP calibration star exists'); ok(Math.max(...star.position.map((x,i)=>Math.abs(x-anchor.localPosition[i])))<1e-8,'HIP geometry matches art');
    anchors.push({constellation:item.name,hip:anchor.hip,localError:error});
  }
  const pool=actual.createSymbolPool();
  for(let i=0;i<30;i++) {actual.setSymbolTarget(pool,actual.SYMBOL_EDUCATION_IDS[i%3]); actual.advanceSymbolPool(pool,.03);}
  actual.setSymbolTarget(pool,item.id); for(let i=0;i<240;i++) actual.advanceSymbolPool(pool,1/60);
  equal(pool.positions,pool.goal,'Settled exact geometry '+item.name); ok(pool.target.edges.length*6<=192*6,'Bounded link glow');
  actual.setSymbolTarget(pool,null); for(let i=0;i<240;i++) actual.advanceSymbolPool(pool,1/60);
  equal(pool.positions,pool.base,'Rapid switch returns exactly to base');
  actual.setSymbolTarget(pool,item.id);actual.advanceSymbolPool(pool,0,true);equal(pool.positions,pool.goal,'Reduced static exact');
}
const sco=data.education.find(i=>i.name==='Scorpius');ok(sco.geometry.stars.some(s=>s.hip===82671),'Scorpius uses source HIP82671');
ok(!sco.geometry.stars.some(s=>s.hip===82729),'HIP82729 remains calibration only');
const changed=[], concurrent=[];
const parallelOwners=['src/components/sections/Experience.jsx','src/3d/components/StoryMeteor.jsx','src/3d/utils/storyMeteor.js',
  'src/components/Work.jsx','src/3d/components/WorksConstellations.jsx','src/3d/utils/worksOrbit.js','src/3d/data/worksConstellations.json'];
for(const[p,hash]of Object.entries(baseline.hashes)) {
  const current=createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  if(current!==hash) {
    if(baseline.owned.includes(p)) changed.push(p);
    else {ok(parallelOwners.includes(p),'Shared/protected file unexpectedly changed: '+p);concurrent.push({path:p,before:hash,current});}
  }
}
fs.writeFileSync(out+'/data-results.json',JSON.stringify({status:'pass',assertions,anchors,changed,protectedFiles:Object.keys(baseline.hashes).length-changed.length-concurrent.length,
  skillsExactMath:actual.SYMBOL_TOOL_IDS.length,source:v4.catalog,concurrent,logoReceipts},null,2));
console.log('V5 data/pool/scope checks PASS:',assertions,'assertions;',anchors.length,'HIP anchors;',changed.length,'owned files');
