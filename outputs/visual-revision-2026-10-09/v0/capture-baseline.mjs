import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const output = 'outputs/visual-revision-2026-10-09/v0';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const files = [];
function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) walk(relative);
    else if (entry.isFile()) files.push(relative);
  }
}
['src', 'public', 'tools/codex-skills', 'outputs/redesign/r0.2/logos/mono'].forEach(walk);
for (const name of ['AGENTS.md', 'prompts.md', 'package.json', 'package-lock.json', 'vite.config.js', 'eslint.config.js', 'postcss.config.js', 'index.html', '3d-lab.html', 'vercel.json', '.gitignore', 'README.md']) {
  if (fs.existsSync(name)) files.push(name);
}
const inventory = [...new Set(files)].sort().map(file => {
  const bytes = fs.readFileSync(file);
  return { path: file.split(path.sep).join('/'), bytes: bytes.length, sha256: sha(bytes) };
});
const git = args => execFileSync('git', args, { encoding: 'utf8' }).trimEnd();
const baseline = {
  task: 'V0', capturedAt: new Date().toISOString(), root: '.',
  git: { branch: git(['branch', '--show-current']), head: git(['rev-parse', 'HEAD']), status: git(['status', '--short']), diffStat: git(['diff', '--stat']) },
  runtime: { node: process.version, platform: process.platform, arch: process.arch },
  versions: {},
  inventory,
  checks: {},
  browser: { status: 'pending' },
};
for (const name of ['react', 'vite', 'tailwindcss', 'gsap', '@react-three/fiber', 'three', 'zustand', '@react-three/postprocessing', 'postprocessing']) {
  const file = `node_modules/${name}/package.json`;
  baseline.versions[name] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).version : null;
}
fs.writeFileSync(`${output}/baseline.json`, JSON.stringify(baseline, null, 2) + '\n');
console.log(JSON.stringify({ files: inventory.length, branch: baseline.git.branch, head: baseline.git.head, node: baseline.runtime.node, versions: baseline.versions, status: baseline.git.status }, null, 2));
