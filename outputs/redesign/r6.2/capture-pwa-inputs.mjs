import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const base = resolve(import.meta.dirname, '../../..');
const inputs = ['vite.config.js', 'main.jsx', 'src/main.jsx', 'src/i18n/config.js', 'index.html', 'package.json', 'vercel.json', 'dist/sw.js', 'dist/manifest.webmanifest'];
const files = {};
for (const file of inputs) {
  try {
    const data = await readFile(resolve(base, file));
    files[file] = { bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') };
    if (file === 'dist/sw.js') await writeFile(resolve(import.meta.dirname, 'sw-input.js'), data);
  } catch (error) { if (error.code !== 'ENOENT') throw error; files[file] = { exists: false }; }
}
await writeFile(resolve(import.meta.dirname, 'pwa-inputs.json'), JSON.stringify({ capturedUTC: new Date().toISOString(), note: 'Source/config and current dist baseline, before R6.2 final build. Dist is R6.1 build, not route verification.', files }, null, 2));
console.log('PWA input hashes captured.');
