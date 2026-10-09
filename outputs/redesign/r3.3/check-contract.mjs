import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { STORY_CHAPTERS, BLACK_HOLE_CENTER, clampStoryProgress, segmentProgress, storyCameraPath } from '../../../src/3d/utils/cameraPath.js';
import { portalProgress, portalState } from '../../../src/3d/utils/portal.js';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = file => readFileSync(resolve(root, file), 'utf8');
const baseline = JSON.parse(read('outputs/redesign/r3.3/baseline.json'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
let assertions = 0;
const check = (value, label) => { assert.ok(value, label); assertions++; };
const equal = (actual, expected, label) => { assert.deepEqual(actual, expected, label); assertions++; };

for (const value of [-1, 0, .5, 1, 2, NaN, Infinity, '0.5']) {
  const p = clampStoryProgress(value);
  check(Number.isFinite(p) && p >= 0 && p <= 1, 'Progress clamps finite 0..1');
}
equal(segmentProgress(75, 50, 100), .5, 'DOM range local progress');
equal(segmentProgress(75, 100, 100), 0, 'Zero range finite');
equal(segmentProgress(-10, 0, 100), 0, 'Before range clamps');
equal(segmentProgress(110, 0, 100), 1, 'After range clamps');
equal(portalProgress('hero', .8), 0, 'Hero has no large universe');
equal(portalProgress('portal', .25, true), 1, 'Reduced portal goes to settled pose');
equal(portalProgress('about', 0), 1, 'About begins after settled portal');

const out = {}, phase = {}, progress = [0, .25, .5, .75, 1];
let minimumRadius = Infinity;
for (const aspect of [320 / 844, 390 / 844, 768 / 1024, 1440 / 900, 1920 / 1080]) {
  for (const { id } of STORY_CHAPTERS) {
    const forward = progress.map(p => {
      check(storyCameraPath(id, p, out, false, aspect) === out, 'Reusable camera output');
      check(portalState(portalProgress(id, p), phase) === phase, 'Reusable shared portal output');
      check(Object.values(out).every(Number.isFinite) && Object.values(phase).every(Number.isFinite), 'Finite camera and portal values');
      equal(out.parallax, 0, 'Story camera has no pointer drift');
      const radius = Math.hypot(out.x - BLACK_HOLE_CENTER[0], out.y - BLACK_HOLE_CENTER[1], out.z - BLACK_HOLE_CENTER[2]);
      minimumRadius = Math.min(minimumRadius, radius);
      check(radius > 1, 'Ray observer stays outside horizon');
      return { camera: { ...out }, portal: { ...phase } };
    });
    const reverse = [...progress].reverse().map(p => ({ camera: { ...storyCameraPath(id, p, out, false, aspect) }, portal: { ...portalState(portalProgress(id, p), phase) } })).reverse();
    equal(reverse, forward, `${id}: reversing to the same progress gives the same pose`);
    equal(storyCameraPath(id, .25, out, true, aspect), storyCameraPath(id, 1, {}, false, aspect), `${id}: reduced endpoint`);
    equal(storyCameraPath(id, -1, {}, false, aspect), storyCameraPath(id, 0, {}, false, aspect), `${id}: low camera progress clamp`);
    equal(storyCameraPath(id, 2, {}, false, aspect), storyCameraPath(id, 1, {}, false, aspect), `${id}: high camera progress clamp`);
    equal(storyCameraPath(id, NaN, {}, false, aspect), storyCameraPath(id, 0, {}, false, aspect), `${id}: invalid camera progress clamp`);
  }
  for (const [previous, next] of [['hero', 'portal'], ['portal', 'about'], ['about', 'skills'], ['skills', 'education'], ['education', 'experience'], ['experience', 'works'], ['works', 'finale'], ['finale', 'contact']]) {
    equal(storyCameraPath(previous, 1, {}, false, aspect), storyCameraPath(next, 0, {}, false, aspect), `${previous}->${next}: continuous endpoint`);
  }
  equal(storyCameraPath('about', 0, {}, false, aspect), storyCameraPath('about', 1, {}, false, aspect), 'About reading pose stable while reading');
}

const leaves = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => item && typeof item === 'object' ? leaves(item, `${prefix}${key}.`) : [`${prefix}${key}`]);
const vi = JSON.parse(read('src/i18n/locales/vi.json')), en = JSON.parse(read('src/i18n/locales/en.json'));
equal(leaves(vi).sort(), leaves(en).sort(), 'Vi/En key parity');
for (const lang of ['vi', 'en']) {
  const current = lang === 'vi' ? vi : en;
  const before = JSON.parse(read(`outputs/redesign/r3.3/before/src/i18n/locales/${lang}.json`));
  for (const key of ['heading', 'subLabel', 'bioFirst', 'bioSecond', 'quote', 'avatarAlt', 'tools', 'coreSkills']) equal(current.about[key], before.about[key], `${lang}.${key}: approved About copy / R4 data preserved`);
  const split = current.about.bioFirst.indexOf('. ') + 1 || current.about.bioFirst.length;
  const opening = current.about.bioFirst.slice(0, split);
  equal(opening, lang === 'vi' ? 'Thiết kế không chỉ là hình ảnh — nó là cách giải quyết vấn đề.' : "Design is not just about visuals — it's about solving problems.", `${lang}: only confirmed opening sentence selected`);
  equal(opening + current.about.bioFirst.slice(split), before.about.bioFirst, `${lang}: opening/rest reconstruct original paragraph`);
}

const sourceFiles = directory => readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? sourceFiles(`${directory}/${entry.name}`) : /\.(jsx|js)$/.test(entry.name) ? [`${directory}/${entry.name}`] : []);
const source = sourceFiles('src').map(read).join('\n');
equal((source.match(/<CameraRig\b/g) ?? []).length, 1, 'One CameraRig owner');
equal((source.match(/<Canvas\b/g) ?? []).length, 1, 'One R3F Canvas');
equal((source.match(/new WebGLRenderTarget\(/g) ?? []).length, 1, 'One explicit HDR ray target');
for (const file of ['src/App.jsx', 'src/3d/GalaxyScene.jsx', 'src/3d/components/CameraRig.jsx', 'src/3d/shaders/blackHole.js', 'src/3d/components/BlackHoleSystem.jsx', 'src/3d/components/BlackHoleBloomMask.jsx', 'src/data.js', 'src/data/skills.js']) {
  equal(hash(readFileSync(resolve(root, file))), baseline.files[file].sha256, `${file}: infrastructure / R4 data unchanged`);
}
// Native lifecycle exposed Smoother cleanup resetting scroll on live reduced-motion.
// The shared producer restores its chapter against remeasured ranges; App/Smoother/store remain protected.
const scroll = read('src/3d/hooks/useScrollProgress.js');
equal((scroll.match(/gsap\.ticker\.add\(update\)/g) ?? []).length, 1, 'One shared scroll producer');
equal((scroll.match(/gsap\.ticker\.remove\(update\)/g) ?? []).length, 1, 'Shared scroll producer cleaned up');
for (const event of ['matchMediaInit', 'matchMedia']) {
  equal((scroll.match(new RegExp(`gsap\\.addEventListener\\('${event}'`, 'g')) ?? []).length, 1, `${event}: one media listener`);
  equal((scroll.match(new RegExp(`gsap\\.removeEventListener\\('${event}'`, 'g')) ?? []).length, 1, `${event}: media listener cleaned up`);
}
check(read('src/App.jsx').includes('useScrollProgress({ scope: root, story: true'), 'App still uses the shared story producer');
const about = read('src/components/About.jsx');
check(!/PORTFOLIO_DATA|useSectionAnchor|<Planet\b|<Canvas\b|<CameraRig\b|camera\.position|camera\.lookAt|about-tools|about-skills|skill-pill|photoCaption|avatar-wrap|data-parallax/.test(about), 'About contains no tools, old portrait frame, planet anchor or camera writer');
check(/id="about"/.test(about) && /aria-labelledby="about-heading"/.test(about) && /id="about-heading"/.test(about), 'Semantic About section and heading');
check(about.includes('aria-pressed={color}') && about.includes("t('about.portraitToggle')") && about.includes('type="button"'), 'Native named portrait toggle');
check(about.includes('src="/avatar-cutout.webp"') && about.includes('width="800" height="1000"') && about.includes('aspect-[4/5]'), 'Cutout uses exact size/aspect');
check(about.includes("t('about.bioSecond')") && about.includes("t('about.quote')"), 'Real second bio and quote remain');
check(about.includes('aria-hidden="true" data-about-decode') && about.includes('className="sr-only"'), 'Accessible copy separate from changing visual letters');
check(about.includes('duration: 0.9') && !about.includes('setInterval') && about.includes('if (reduced) return'), '0.9s decode has static reduced mode');
check(about.includes('unsubscribe()') && about.includes("removeEventListener('visibilitychange'"), 'Store / document listeners cleaned up');

const result = { status: 'PASS', checkedAt: new Date().toISOString(), assertions, minObserverRadius: minimumRadius, mainLocaleKeys: leaves(vi).length, scope: 'Pure camera/portal contract and source/locale ownership; Browser, alpha pixels and focus still require real verification' };
writeFileSync(resolve(root, 'outputs/redesign/r3.3/check-contract-results.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
