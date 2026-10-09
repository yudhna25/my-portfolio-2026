// node outputs/redesign/r4.3/check-source.mjs
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = file => readFileSync(root + file, 'utf8');
const json = file => JSON.parse(read(file));
const data = json('src/3d/data/symbolTargets.json');
const source = json(data.educationSource.path);
const module = read('src/3d/utils/symbolMorph.js').replace("import data from '@/3d/data/symbolTargets.json';", `const data = ${JSON.stringify(data)};`);
const { SYMBOL_TARGETS, SYMBOL_EDUCATION_IDS, createSymbolPool, setSymbolTarget, advanceSymbolPool } = await import(`data:text/javascript;base64,${Buffer.from(module).toString('base64')}`);
const mappings = [['saigonUniversity','Cir',3,11,2],['greenAcademy','Tel',2,6,1],['arenaMultimedia','Pic',3,12,2]];
assert.equal(createHash('sha256').update(read(data.educationSource.path)).digest('hex'), data.educationSource.sha256);
assert.deepEqual(SYMBOL_EDUCATION_IDS, mappings.map(row => row[0]));
const records = [];
for (const [id,cid,members,context,edges] of mappings) {
  const target = data.education.find(item => item.id === id), original = source.constellations.find(item => item.id === cid);
  assert.equal(target.constellationId, cid); assert.deepEqual(target.geometry, original.geometry); assert.deepEqual(target.projection, original.projection);
  assert.deepEqual([target.geometry.stars.length,target.geometry.supportingStars.length,target.geometry.edges.length], [members,context,edges]);
  const pool = createSymbolPool(); setSymbolTarget(pool,id); advanceSymbolPool(pool,0,true);
  const ordered = [...original.geometry.stars,...original.geometry.supportingStars];
  ordered.forEach((star,i) => star.position.forEach((value,axis) => assert.equal(pool.positions[i*3+axis], Math.fround(value))));
  SYMBOL_TARGETS[id].edges.forEach(pair => assert.ok(pair.every(index => index < members)));
  const base = pool.base; setSymbolTarget(pool,null); advanceSymbolPool(pool,0,true); assert.deepEqual(pool.positions,base);
  for (const locale of ['vi','en']) assert.deepEqual(json(`src/i18n/locales/${locale}.json`).education.institutions[id], json('outputs/redesign/r1.1/content.json').locales[locale].education.institutions[id]);
  records.push({id,constellation:original.name,members,context,edges,sourcePositionsExactFloat32:true,contextLinked:false,resetExact:true});
}
const result = {status:'pass',catalog:source.catalog,convention:source.chartConvention,records};
writeFileSync(root+'outputs/redesign/r4.3/source-results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
