// Guards Jue's site-wide rules (2026-11-17): no em dash in content or UI, and no text under 14px.
// Run: npm run check:rules
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const roots = ['src', 'index.html'];
const skip = [/3d-lab\.jsx$/, /locales\/(vi|en)\/lab\.json$/, /3d\/data\//];
const exts = new Set(['.js', '.jsx', '.json', '.css', '.html']);
const files = [];
const walk = path => {
  if (statSync(path).isDirectory()) { for (const name of readdirSync(path)) walk(join(path, name)); return; }
  if (exts.has(extname(path)) && !skip.some(rule => rule.test(path))) files.push(path);
};
roots.forEach(walk);

const rules = [
  { name: 'em dash', test: /—/ },
  { name: 'Tailwind text under 14px', test: /(?:^|[\s"'`{(:])text-(?:xs|\[(?:[0-9]|1[0-3])(?:\.\d+)?px\]|\[0?\.(?:[0-7]\d*|8[0-6]\d*)rem\])(?=[\s"'`})]|$)/ },
  { name: 'clamp() minimum under 14px', test: /text-\[clamp\((?:0?\.(?:[0-7]\d*|8[0-6]\d*)rem|(?:[0-9]|1[0-3])px)/ },
  { name: 'CSS font-size under 14px', test: /font-size:\s*(?:(?:[0-9]|1[0-3])(?:\.\d+)?px|0?\.(?:[0-7]\d*|8[0-6]\d*)rem)\b/ },
];

const problems = [];
for (const file of files) {
  readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
    for (const rule of rules) if (rule.test.test(line)) problems.push(`${file}:${index + 1}  ${rule.name}`);
  });
}
if (problems.length) {
  console.error(`Site rules broken (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`Site rules hold across ${files.length} files: no em dash, no text under 14px.`);
