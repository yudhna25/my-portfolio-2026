import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const dir = 'outputs/redesign/r4.3';
fs.mkdirSync(`${dir}/before`, { recursive: true });
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? walk(`${dir}/${item.name}`) : [`${dir}/${item.name}`]);
const files = [...walk('src'), ...walk('public'), 'index.html', 'vite.config.js', 'package.json', 'package-lock.json'];
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const baseline = { capturedAt: new Date().toISOString(), head: git('rev-parse', 'HEAD').toString().trim(), status: git('status', '--short').toString(), stagedDiffHash: hash(git('diff', '--cached', '--binary')), files: {} };
for (const file of files) {
  const bytes = fs.readFileSync(file);
  baseline.files[file] = { sha256: hash(bytes), bytes: bytes.length };
  fs.mkdirSync(path.dirname(`${dir}/before/${file}`), { recursive: true });
  fs.writeFileSync(`${dir}/before/${file}`, bytes);
}
fs.copyFileSync('AGENTS.md', `${dir}/before/agents-before.txt`);
fs.writeFileSync(`${dir}/baseline.json`, JSON.stringify(baseline, null, 2));
console.log(JSON.stringify({ head: baseline.head, files: files.length, stagedDiffHash: baseline.stagedDiffHash }));

