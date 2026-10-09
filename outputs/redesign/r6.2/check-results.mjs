import fs from 'node:fs';
import assert from 'node:assert/strict';
const out = 'outputs/redesign/r6.2';
const result = { status: 'pass', checkedAt: new Date().toISOString(), matrix: [] };
for (const prefix of ['browser-route', 'production-route']) {
  const report = JSON.parse(fs.readFileSync(`${out}/${prefix}-results.json`));
  assert.equal(report.status, 'pass'); assert.equal(report.configurations.length, 8);
  let maxScrollError = 0, snapshots = 0;
  for (const record of [...report.configurations, ...report.extra]) {
    assert.equal(record.status, 'pass'); assert.deepEqual(record.errors, []); assert.deepEqual(record.failedResources, []);
    snapshots += record.states.length;
    for (const state of record.states) {
      assert.equal(state.overflow, 0);
      if (!state.reader) { assert(!state.title.includes('EDURA')); assert(state.canonical.endsWith('/')); }
      if (state.reader) for (const resource of Object.values(state.gl)) assert.equal(resource.live, 0, `${prefix}/${state.label}: live WebGL resource`);
    }
    if (record.name) continue;
    const before = record.states[0];
    for (const label of ['native-back', 'return']) {
      const restored = record.states.find(state => state.label === label);
      maxScrollError = Math.max(maxScrollError, Math.abs(restored.visibleScroll - before.visibleScroll));
    }
    const cycles = record.states.filter(state => /^cycle\d/.test(state.label));
    for (const kind of ['reader', 'restore']) {
      const states = cycles.filter(state => state.label.endsWith(kind));
      for (const state of states) {
        assert.deepEqual(state.listeners, states[0].listeners, `${prefix}: listener counts/types grow`);
        assert.equal(state.triggers, states[0].triggers);
        assert.equal(state.canvas, kind === 'reader' ? 0 : 1);
      }
    }
  }
  assert(maxScrollError <= 2);
  result.matrix.push({ prefix, configs: 8, extras: report.extra.length, snapshots, maxScrollError, exceptions: 0, firstPartyFailures: 0 });
}
fs.writeFileSync(`${out}/results-summary.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
