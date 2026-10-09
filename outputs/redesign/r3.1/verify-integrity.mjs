import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = new URL('../../../', import.meta.url);
const baseline = JSON.parse(readFileSync(new URL('baseline.json', import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const allowed = new Set(['index.html','public/theme-init.js','src/App.jsx','src/index.css','src/styles/globals.css',
  'src/stores/useThemeStore.js','src/3d/GalaxyScene.jsx','src/3d/components/ShootingStars.jsx','src/components/Cursor.jsx',
  'src/components/About.jsx','src/components/Work.jsx','src/components/Education.jsx','src/components/Footer.jsx',
  'src/components/sections/Skills.jsx','src/components/sections/Experience.jsx','src/components/sections/Contact.jsx',
  'src/components/layout/Nav.jsx','src/components/layout/MenuOverlay.jsx','src/components/ui/SoundToggle.jsx',
  'src/components/ui/TargetLockReticle.jsx','tools/check-stores.mjs']);
const deleted = new Set(['src/components/layout/CockpitRails.jsx','src/components/ui/KnurledSwitch.jsx',
  'src/components/ui/ThemeToggle.jsx','src/components/ui/MissionProgressOrbit.jsx','src/3d/components/Constellations.jsx',
  'src/3d/components/StardustWake.jsx','src/3d/components/Planet.jsx','src/3d/components/OrbitalSkills.jsx']);
const files = baseline.files.map(before => {
  const url = new URL(before.path,root), after = existsSync(url) ? hash(readFileSync(url)) : null;
  const status = after === before.sha256 ? 'preserved' : after ? 'modified' : 'deleted';
  if (status === 'modified') assert(allowed.has(before.path),`outside scope: ${before.path}`);
  if (status === 'deleted') assert(deleted.has(before.path),`unexpected delete: ${before.path}`);
  return {...before,after,status};
});
const head = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const indexDiffSha256 = hash(execFileSync('git',['diff','--cached','--binary'],{cwd:root,maxBuffer:64*1024*1024}));
assert.equal(head,baseline.head);assert.equal(indexDiffSha256,baseline.indexDiffSha256);
// Style cleanup cannot rewrite Work/Contact content, actions, timelines or contactProgress.
const normalize = text => text.replace(/className=(?:"[^"]*"|\{`[\s\S]*?`\})/g,'')
  .replace(/data-glass-card/g,'').replace(/\s/g,'');
const contentPreserved = ['src/components/Work.jsx','src/components/sections/Contact.jsx'].map(path=>{
  assert.equal(normalize(readFileSync(new URL(path,root),'utf8')),normalize(readFileSync(new URL(`before/${path}`,import.meta.url),'utf8')),path);
  return {path,contentActionsTimelinePreserved:true};
});
const counts = Object.fromEntries(['preserved','modified','deleted'].map(s=>[s,files.filter(f=>f.status===s).length]));
const result = {checkedAt:new Date().toISOString(),head,indexDiffSha256,counts,contentPreserved,files};
writeFileSync(new URL('integrity.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log('PASS:',JSON.stringify(counts),'; HEAD/index unchanged; Work/Contact content + behavior unchanged.');
