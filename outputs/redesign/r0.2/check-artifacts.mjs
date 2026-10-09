import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '../../..');
const read = p => fs.readFileSync(path.resolve(root, p));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const json = p => JSON.parse(fs.readFileSync(path.join(dir, p), 'utf8'));
const baseline = json('source-baseline.json');
const currentPaths = [];
function collect(p) { for (const e of fs.readdirSync(path.join(root,p), {withFileTypes:true})) {
  const child = path.posix.join(p,e.name); if (e.isDirectory()) collect(child); else if (e.isFile()) currentPaths.push(child);
} }
collect('src'); collect('public');
currentPaths.push('index.html','vite.config.js',...fs.readdirSync(root).filter(p=>/^package.*\.json$/.test(p)));
assert.deepEqual(currentPaths.sort(), baseline.files.map(f=>f.path).sort(), 'Protected source file list changed');
for (const f of [...baseline.files, ...baseline.additionalProtected]) {
  assert.equal(hash(read(f.path)), f.sha256, `Protected file changed: ${f.path}`);
}
const before = fs.readFileSync(path.join(dir, 'agents-before.txt'));
const now = read('AGENTS.md');
assert.ok(now.subarray(0, before.length).equals(before), 'AGENTS original bytes must remain');
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), baseline.git.head);
assert.equal(execFileSync('git', ['status','--porcelain=v1','--untracked-files=no'],{cwd:root,encoding:'utf8'}).trimEnd(), baseline.git.status.split('\n').filter(l=>l&&!l.startsWith('?? ')).join('\n'));
const manifest = json('assets-manifest.json');
const hashes = new Map();
for (const a of manifest.assets) {
  if (a.status === 'missing') continue;
  for (const f of a.files) {
    const b = read(f.path);
    assert.equal(b.length, f.bytes, f.path);
    assert.equal(hash(b), f.sha256, f.path);
    if (f.role === 'web') {
      assert.ok(!hashes.has(f.sha256), `Duplicate web assets: ${a.id} and ${hashes.get(f.sha256)}`);
      hashes.set(f.sha256, a.id);
    }
  }
}
const browser = json('browser-results.json');
assert.deepEqual(browser.errors, []);
assert.ok(browser.images.every(i => i.complete && i.width > 0 && i.height > 0));
assert.equal(new Set(manifest.assets.filter(a => a.category === 'logo').map(a => a.id)).size, 9);
assert.equal(manifest.status,'ready','An asset is incomplete');
execFileSync('C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',[path.join(dir,'portrait/verify-portrait.py')],{stdio:'inherit'});
for(const a of manifest.assets.filter(a=>a.category==='logo')){
  assert.equal(a.status,'ready'); assert.ok(a.sourceUrl.startsWith('https://'));
  const preview=a.files.find(f=>f.role==='preview');
  const monoDifference=Number(execFileSync('D:/ImageMagick-7.1.1-Q16-HDRI/magick.exe',[path.resolve(root,preview.path),'-fx','max(abs(r-g),abs(g-b))','-format','%[fx:maxima]','info:'],{encoding:'utf8'}));
  assert.equal(monoDifference,0,`Non-mono logo ${a.id}`);
  if(a.files.find(f=>f.role==='web').format==='svg'){
    const web=read(a.files.find(f=>f.role==='web').path).toString('utf8');
    const source=fs.readFileSync(path.join(dir,'logos/source',a.white||a.source),'utf8');
    const paths=s=>[...s.matchAll(/\bd="([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(paths(web),paths(source),`Logo path geometry changed: ${a.id}`);
    assert.ok(!/<script|<foreignObject|<!ENTITY|(?:href|src)=['"](?:https?:|data:|javascript:)/i.test(web));
  }
}
execFileSync(process.execPath, [path.join(dir, 'astronomy/check-constellations.mjs')], { stdio: 'inherit' });
const result = { checkedAt: new Date().toISOString(), protectedSourceFiles: baseline.files.length,
  protectedOtherFiles: baseline.additionalProtected.length,
  r03ConcurrentFiles: (baseline.r03Files || []).map(f => ({ path: f.path,
    changedSinceR02Start: hash(read(f.path)) !== f.sha256 })),
  assets: manifest.assets.length, uniqueWebHashes: hashes.size, browserImages: browser.images.length,
  headUnchanged: true, agentsOriginalPrefixUnchanged: true,
  progressRowsAdded: now.subarray(before.length).toString('utf8').split('\n').filter(l => l.includes('| R0.2 —')).length,
  errors: [] };
fs.writeFileSync(path.join(dir, 'source-integrity.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
