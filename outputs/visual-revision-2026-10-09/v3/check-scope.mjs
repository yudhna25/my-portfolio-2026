import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const out = 'outputs/visual-revision-2026-10-09/v3';
const allowed = new Set(['AGENTS.md', 'src/App.jsx', 'src/3d-lab.jsx', 'src/3d/GalaxyScene.jsx',
  'src/3d/components/BlackHole.jsx', 'src/3d/components/StarField.jsx', 'src/3d/components/Nebula.jsx',
  'src/3d/components/SceneFallback.jsx', 'src/3d/hooks/useScrollProgress.js', 'src/3d/utils/cameraPath.js',
  'src/3d/utils/portal.js', 'src/components/About.jsx', 'src/components/Cursor.jsx',
  'src/components/Hero.jsx', 'src/components/effects/PortalHeading.jsx', 'src/components/layout/Nav.jsx',
  'src/stores/useScrollStore.js', 'src/styles/hero.css']);
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const predecessor = JSON.parse(fs.readFileSync('outputs/visual-revision-2026-10-09/v2/integrity-results.json')).entries;
const entries = predecessor.filter(entry => !allowed.has(entry.path)).map(entry => ({
  path: entry.path, before: entry.after, after: hash(entry.path),
}));
for (const entry of entries) assert.equal(entry.after, entry.before, `Protected predecessor file changed: ${entry.path}`);
const pipeline = ['src/3d/components/BlackHoleSystem.jsx', 'src/3d/components/BlackHoleBloomMask.jsx',
  'src/3d/shaders/blackHole.js', 'src/3d/quality.js'].map(path => ({ path, sha256: hash(path) }));
const sources = [...allowed].filter(path => path.startsWith('src/')).map(path => ({path,sha256:hash(path)}));
fs.writeFileSync(`${out}/scope-results.json`, JSON.stringify({ status: 'PASS', checkedAt: new Date().toISOString(),
  comparedTo: 'V2 final integrity hashes, not a new baseline measurement', protectedCount: entries.length,
  entries, preservedV2Pipeline: pipeline, currentV3Sources: sources }, null, 2)+'\n');
console.log(JSON.stringify({ status: 'PASS', protectedCount: entries.length, pipelineFiles: pipeline.length }));
