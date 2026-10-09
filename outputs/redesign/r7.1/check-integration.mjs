import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { create } from 'zustand';
import { createWorksOrbit, syncWorksOrbit, WORKS_IDS } from '../../../src/3d/utils/worksOrbit.js';
import { STORY_IDLE_PHASE } from '../../../src/3d/utils/cameraPath.js';
import { ambientMeteorVisibility } from '../../../src/3d/utils/shootingStars.js';

const dir = 'outputs/redesign/r7.1';
const read = path => fs.readFileSync(path, 'utf8');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const source = read('src/stores/useScrollStore.js');
const makeStore = new Function('create', 'createWorksOrbit', 'syncWorksOrbit', 'WORKS_IDS', 'STORY_IDLE_PHASE',
  source.replace(/^import .*;\r?\n/gm, '').replace('export const useScrollStore =', 'return'));
const report = { checkedAt: new Date().toISOString(), status: 'running', assertions: 0, cases: [] };
const equal = (a, b, label) => { report.assertions++; assert.deepEqual(a, b, label); };
const test = (name, callback) => { callback(); report.cases.push(name); };

try {
  test('real store: hover snapshot, clear live owners, reverse and hold', () => {
    const store = makeStore(create, createWorksOrbit, syncWorksOrbit, WORKS_IDS, STORY_IDLE_PHASE);
    const state = store.getState(), orbit = state.worksOrbit;
    state.setStoryPosition('works', .95, .6, false);
    orbit.phase = 1.234;
    state.setWorksInteraction('Hover', 'edura');
    state.setStoryPosition('finale', .001, .61, false);
    equal(store.getState().worksFinaleSelection, 'edura', 'capture hover before leaving Works');
    state.clearWorksInteraction();
    for (const p of [.5, .34, .44, .75, 1, .4, 0, .5]) {
      state.setStoryPosition('finale', p, .7, true);
      equal(store.getState().worksFinaleSelection, 'edura', 'clearing current focus/pointer cannot erase presentation');
      equal([orbit.origin, orbit.captures, orbit.latched], [1.234, 1, true], 'same pass never recaptures');
      equal(store.getState().worksOrbit, orbit, 'stable orbit identity');
    }
    state.setStoryPosition('contact', 0, .9, false);
    equal([orbit.origin, orbit.captures], [1.234, 1], 'Contact is same capture');
    state.setStoryPosition('works', 1, .6, false);
    equal([orbit.phase, orbit.latched, orbit.resumePending], [1.234, false, true], 'Works resumes from captured phase');
  });
  test('selection precedence and default direct Contact', () => {
    const store = makeStore(create, createWorksOrbit, syncWorksOrbit, WORKS_IDS, STORY_IDLE_PHASE);
    const state = store.getState();
    state.setStoryPosition('contact', 0, 1, false);
    equal([state.worksOrbit.origin, state.worksOrbit.captures], [0, 1], 'fresh direct Contact seed');
    state.setStoryPosition('works', .5, .6, false);
    state.setWorksInteraction('Hover', 'vie');
    state.setWorksInteraction('Focus', 'veris');
    state.setWorksInteraction('Selection', 'edura');
    state.setStoryPosition('finale', 0, .6, true);
    equal(store.getState().worksFinaleSelection, 'edura', 'snapshot same DOM/render precedence');
  });
  test('production wiring and legacy removal', () => {
    const app = read('src/App.jsx');
    equal((app.match(/data-story-chapter="finale"/g) ?? []).length, 1, 'one production finale range');
    equal(app.includes('min-h-[225vh] motion-reduce:min-h-0'), true, 'separate 2.25 viewport, no reduced scroll gap');
    for (const file of ['src/stores/useScrollStore.js', 'src/components/sections/Contact.jsx', 'src/3d/components/CameraRig.jsx', 'src/3d/components/BlackHole.jsx']) {
      equal(/contactProgress|setContactProgress|contact-approach/.test(read(file)), false, `${file}: old writer/offset gone`);
    }
    for (const p of [0, .1, .44, .5, .75, 1]) equal(ambientMeteorVisibility('finale', p), 0, 'ambient meteor yields during finale');
    equal(ambientMeteorVisibility('skills', .5), 1, 'ambient meteor retained in quiet chapter');
  });
  test('baseline / protected source / staged work', () => {
    const baseline = JSON.parse(read(`${dir}/baseline.json`));
    const allowed = new Set(['src/App.jsx', 'src/components/Work.jsx', 'src/components/sections/Contact.jsx', 'src/stores/useScrollStore.js',
      'src/3d/GalaxyScene.jsx', 'src/3d/components/StarField.jsx', 'src/3d/components/Nebula.jsx', 'src/3d/components/WorksConstellations.jsx',
      'src/3d/components/CameraRig.jsx', 'src/3d/components/BlackHole.jsx', 'src/3d/utils/cameraPath.js']);
    const changed = [], preserved = [];
    for (const [file, before] of Object.entries(baseline.files)) {
      equal(fs.existsSync(file), true, `${file}: no baseline deletion`);
      const sha = hash(fs.readFileSync(file));
      if (sha === before.sha256) preserved.push(file);
      else { equal(allowed.has(file), true, `${file}: within R7.1 source scope`); changed.push(file); }
    }
    const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
    equal(git('rev-parse', 'HEAD').toString().trim(), baseline.head, 'HEAD preserved');
    equal(hash(git('diff', '--cached', '--binary')), baseline.stagedDiffHash, 'pre-existing staged work preserved');
    const before = read(`${dir}/before/agents-before.txt`), now = read('AGENTS.md');
    equal(now.startsWith(before), true, 'AGENTS prefix append-only');
    report.integrity = { baselineFiles: Object.keys(baseline.files).length, changed, preservedCount: preserved.length,
      agentsAppended: now.slice(before.length).trim(), head: baseline.head, stagedDiffHash: baseline.stagedDiffHash };
  });
  report.status = 'pass';
} catch (error) {
  report.status = 'fail'; report.error = { name: error.name, message: error.message, stack: error.stack }; process.exitCode = 1;
}
fs.writeFileSync(`${dir}/integration-check.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
