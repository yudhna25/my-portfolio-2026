import { build } from 'vite';
import { inventory, hashes, save, out } from './common.mjs';

const files = [...inventory('src'), ...inventory('public'), 'package.json', 'package-lock.json', 'vite.config.js', 'index.html', '3d-lab.html'];
const source = hashes(files);
await build({ build: { outDir: out + '/production', rollupOptions: { input: { index: 'index.html', lab: '3d-lab.html' } } } });
save('build-source.json', { at: new Date().toISOString(), source, production: hashes(inventory(out + '/production')) });
