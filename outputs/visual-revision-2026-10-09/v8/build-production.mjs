import { build } from 'vite';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const out='outputs/visual-revision-2026-10-09/v8';
const inventory=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?inventory(dir+'/'+e.name):[dir+'/'+e.name]);
const hashes=files=>Object.fromEntries(files.sort().map(f=>[f,createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
const source=hashes([...inventory('src'),...inventory('public/constellations')]);
await build({build:{outDir:out+'/production',rollupOptions:{input:{index:'index.html',lab:'3d-lab.html'}}}});
fs.writeFileSync(out+'/build-source.json',JSON.stringify({at:new Date().toISOString(),source,production:hashes(inventory(out+'/production'))},null,2)+'\n');
