import assert from 'node:assert/strict';
import fs from 'node:fs';
import { out, inventory, hashes, save, sha } from './common.mjs';

const file = out + '/protected-baseline.json';
if (process.argv.includes('--capture')) {
  assert(!fs.existsSync(file), 'Existing protection baseline must not be overwritten');
  const source = hashes([...inventory('public'),
    'src/3d/components/CameraRig.jsx', 'src/3d/utils/cameraPath.js', 'src/3d/hooks/useScrollProgress.js',
    'src/stores/useScrollStore.js', 'src/stores/useRouteStore.js', 'src/3d/components/StarField.jsx',
    'src/3d/utils/buildStarGeometry.js', 'src/3d/components/Nebula.jsx', 'src/3d/components/BlackHole.jsx',
    'src/3d/components/BlackHoleSystem.jsx', 'src/3d/components/BlackHoleBloomMask.jsx', 'src/3d/shaders/blackHole.js',
    'src/components/sections/Skills.jsx', 'src/3d/components/SkillsSymbols.jsx', 'src/components/Education.jsx',
    'src/3d/components/SymbolStars.jsx', 'src/3d/utils/symbolMorph.js', 'src/3d/data/symbolTargets.json', 'src/components/Work.jsx', 'src/3d/components/WorksConstellations.jsx',
    'src/3d/utils/worksOrbit.js', 'src/3d/data/worksConstellations.json', 'src/components/pages/Edura.jsx',
    'src/i18n/locales/vi.json', 'src/i18n/locales/en.json', 'package.json', 'package-lock.json', 'vite.config.js']);
  save('protected-baseline.json', { at: new Date().toISOString(), source });
  console.log(JSON.stringify({ captured: Object.keys(source).length }));
} else {
  const baseline = JSON.parse(fs.readFileSync(file, 'utf8'));
  const changed = Object.entries(baseline.source).filter(([path, hash]) => !fs.existsSync(path) || sha(path) !== hash).map(([path]) => path);
  const result = { status: changed.length ? 'fail' : 'pass', protected: Object.keys(baseline.source).length, changed };
  save('protected-results.json', result); assert.equal(changed.length, 0, 'Protected source drift: ' + changed.join(', ')); console.log(JSON.stringify(result));
}
