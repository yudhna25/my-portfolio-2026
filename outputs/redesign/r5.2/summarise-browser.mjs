// Derived report only. Reads the completed actual Browser evidence, no app mutation.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const out = 'outputs/redesign/r5.2/';
const run = JSON.parse(readFileSync(out + 'browser-results.json'));
assert.equal(run.status, 'pass');
const rows = run.results;
const configs = rows.filter(row => row.phaseScan);
const previews = rows.filter(row => /-preview-(edura|veris|vie)$/.test(row.label));
const rapid = rows.filter(row => row.label.endsWith('-rapid-hover'));
const max = list => Math.max(0, ...list);
const local = (box, stage) => ({ x: box.x - stage.x, y: box.y - stage.y, width: box.width, height: box.height });
let targetFootprintError = 0, previewFootprintError = 0;
for (const config of configs) {
  const prefix = config.label.slice(0, -'-idle'.length);
  const progress = rows.filter(row => row.label.startsWith(prefix + '-reading-progress-'));
  for (const pose of progress) for (let i = 0; i < 3; i++) {
    const a = local(config.choices[i].box, config.stageBox), b = local(pose.choices[i].box, pose.stageBox);
    targetFootprintError = max([targetFootprintError, ...Object.keys(a).map(key => Math.abs(a[key] - b[key]))]);
  }
  const group = previews.filter(row => row.label.startsWith(prefix + '-preview-'));
  const a = local(group[0].preview.box, group[0].stageBox);
  for (const row of group.slice(1)) {
    const b = local(row.preview.box, row.stageBox);
    previewFootprintError = max([previewFootprintError, ...Object.keys(a).map(key => Math.abs(a[key] - b[key]))]);
  }
}
const accumulated = rows.reduce((a, b) => a.rawShift > b.rawShift ? a : b);
const summary = {
  status: run.status, snapshots: rows.length, configs: configs.length, errors: run.errors, warnings: run.warnings,
  environment: { browser: 'Installed Edge 154 via bundled Playwright', gpu: rows[0].gpu, dpr: rows[0].dpr, origin: 'http://127.0.0.1:5173/#work' },
  maxVisibleWorksAnchorErrorPx: max(rows.filter(row => row.chapter === 'works' && !row.hidden).map(row => row.stageTopError)),
  maxVisibleCameraError: max(rows.filter(row => !row.hidden).map(row => row.cameraError)),
  maxOverflowPx: max(rows.map(row => row.overflow)),
  targetMinSizePx: [Math.min(...rows.flatMap(row => row.choices.map(choice => choice.box.width))), Math.min(...rows.flatMap(row => row.choices.map(choice => choice.box.height)))],
  maxTargetFootprintErrorPx: targetFootprintError, maxPreviewFootprintErrorPx: previewFootprintError,
  previewWindow: { previews: previews.length, rapidChanges: rapid.length, maxCLS: max([...previews, ...rapid].map(row => row.cls)), maxRawShift: max([...previews, ...rapid].map(row => row.rawShift)), colorPixelsRange: [Math.min(...previews.map(row => row.image.colorPixels)), Math.max(...previews.map(row => row.image.colorPixels))] },
  manualReading: { configsWithShifts: configs.filter(row => row.readingShifts.length).length, attribution: configs.filter(row => row.readingShifts.length).map(row => ({ label: row.label, shifts: row.readingShifts })) },
  accumulatedOutsidePreview: { label: accumulated.label, rawShiftSum: accumulated.rawShift, nonRecentInputShiftSum: accumulated.cls, note: 'Includes simulated document hidden, chapter teleports, locale/reduced-mode switches and live viewport resizes. Not an ordinary preview CLS result or a page-level Web Vitals session-window CLS score.', shifts: accumulated.shifts },
  phaseCoverage: configs.map(row => ({ config: row.label.slice(0, -5), samples: row.phaseScan.samples, minVisible: row.phaseScan.minVisible, minClearOfHeaderAndPreview: row.phaseScan.minClear })),
  native: rows.filter(row => row.label.startsWith('native-')).map(row => ({ label: row.label, chapter: row.chapter, progress: row.progress, focus: row.focus, anchorErrorPx: row.stageTopError })),
  orbit: rows.filter(row => row.label.startsWith('orbit-')).map(row => ({ label: row.label, phase: row.orbit.phase, velocity: row.orbit.velocity })),
  handoff: rows.filter(row => row.label.startsWith('handoff-')).map(row => ({ label: row.label, chapter: row.chapter, progress: row.progress, ...row.orbit })),
  lens: rows.filter(row => row.label.startsWith('project-image-lens')).map(row => ({ label: row.label, ...row.lens })),
  liveCycles: rows.filter(row => row.label.startsWith('lifecycle-')).map(row => ({ label: row.label, chapter: row.chapter, focus: row.focus, active: row.active, viewport: row.viewport, reduced: row.reduced })),
};
writeFileSync(out + 'browser-summary.json', JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ status: summary.status, snapshots: summary.snapshots, configs: summary.configs, maxAnchor: summary.maxVisibleWorksAnchorErrorPx, maxCamera: summary.maxVisibleCameraError, targetFootprint: targetFootprintError, previewFootprint: previewFootprintError, previewCLS: summary.previewWindow.maxCLS, previewRawShift: summary.previewWindow.maxRawShift }, null, 2));
