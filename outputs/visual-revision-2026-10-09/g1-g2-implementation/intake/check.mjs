import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { portalIntake, portalIntakeSample, portalProgress, portalState } from '../../../../src/3d/utils/portal.js';

let checks = 0;
const verify = condition => { assert(condition); checks++; };
const close = (a, b, epsilon = 1e-8) => verify(Math.abs(a - b) <= epsilon);
for (const width of [320, 390, 768, 1440, 1920]) {
  const height = width < 768 ? 844 : 900;
  const anchor = { left: width * 0.72, top: height * 0.38, width: width * 0.09, height: height * 0.12 };
  for (const index of [0, 3, 15, 37, 49]) {
    const layout = { x: width * (0.12 + index / 75), y: height * (0.13 + index / 90), width: Math.min(320, width * 0.45), height: 30 };
    const rest = portalIntake(0, layout, anchor, width, height, index);
    close(rest.x, 0); close(rest.y, 0); close(rest.rotation, 0);
    close(rest.scaleX, 1); close(rest.scaleY, 1); close(rest.opacity, 1);
    const early = portalIntake(0.1, layout, anchor, width, height, index);
    verify(early.scaleX <= 1 && early.scaleY > 0.8);
    verify(early.opacity > 0.8);
    const joined = portalIntakeSample(0.22, 0.5, layout, anchor, width, height, index);
    verify(joined.scaleX * layout.width <= Math.max(6, joined.radius * 0.32) + 1e-8);
    for (const t of [0.1, 0.2, 0.38, 0.5, 0.72, 0.9]) {
      const point = portalIntakeSample(0.2, t, layout, anchor, width, height, index);
      const before = portalIntakeSample(0.2, t - 1e-5, layout, anchor, width, height, index);
      const after = portalIntakeSample(0.2, t + 1e-5, layout, anchor, width, height, index);
      verify(Math.cos(Math.atan2(after.y - before.y, after.x - before.x) - point.tangent) > 0.9999);
    }
    const states = new Map();
    for (let step = 0; step <= 435; step++) {
      const p = step / 1000;
      const pose = portalIntake(p, layout, anchor, width, height, index);
      verify(Object.values(pose).every(Number.isFinite));
      verify(pose.scaleX > 0 && pose.scaleY > 0 && pose.opacity >= 0 && pose.opacity <= 1);
      states.set(p, JSON.stringify(pose));
    }
    for (let step = 435; step >= 0; step--) {
      const p = step / 1000;
      verify(JSON.stringify(portalIntake(p, layout, anchor, width, height, index)) === states.get(p));
    }
    const end = portalIntake(0.435, layout, anchor, width, height, index);
    close(layout.x + end.x, width * 0.5); close(layout.y + end.y, height * 0.45); close(end.opacity, 0);
    for (const edge of [0.04, 0.08, 0.24, 0.46]) {
      const epsilon = 1e-6;
      const a = portalIntakeSample(0.2, edge - epsilon, layout, anchor, width, height, index);
      const b = portalIntakeSample(0.2, edge + epsilon, layout, anchor, width, height, index);
      verify(Math.hypot(a.x - b.x, a.y - b.y) < width * 0.0001);
    }
  }
  const glyph = { x: width * 0.4, y: height * 0.5, width: width * 0.08, height: height * 0.1 };
  const chain = Array.from({ length: 7 }, (_, i) => portalIntake(0.13, glyph, anchor, width, height, i + 4));
  verify(new Set(chain.map(pose => pose.t.toFixed(5))).size === 7);
  verify(chain.every((pose, i) => !i || Math.hypot(pose.x - chain[i-1].x, pose.y - chain[i-1].y) > 1));
  verify(Array.from({ length: 7 }, (_, i) => portalIntake(0.16, glyph, anchor, width, height, i + 4)).every(pose => pose.opacity < 0.1));
}
verify(portalProgress('hero', 1) === 0);
verify(portalProgress('portal', 0.2, true) === 1);
verify(portalState(0.44).visibility === 0);
verify(portalState(0.47).mini === 0);
verify(portalState(0.5).eject === 0);
verify(portalState(0.94).eject === 1);
verify(portalState(0.96).controlsInteractive);
const result = { checks, result: 'PASS', viewports: [320, 390, 768, 1440, 1920],
  coverage: ['rest identity', 'early readability/no large X stretch', 'joined source width cap', 'true analytic curve tangents', 'finite bounded poses', 'forward/reverse/direct determinism', 'end at measured O convergence center', 'continuous branch joins', 'unchanged portal phase boundaries'],
  browser: 'Root integration will verify actual appearance, focus, DOM pools and FPS.' };
await writeFile(new URL('./self-check.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
