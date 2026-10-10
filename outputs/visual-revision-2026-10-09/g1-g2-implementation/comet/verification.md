# G1/G2 refinement — Experience comet worker verification

> **Integrated final-source update, 10/10/2026:** worker implementation is unchanged, but root has completed same-build QA. [Current verification](../verification.md), [gallery](../review.html), [final pixel results](pixel-results.json): core51px/halo223–225px desktop,31/121px mobile, tail≈42vw at all three companies. Measurements/status below are the earlier worker record, superseded by these integrated checks. G1/G2 visual approval remains pending.

Date: 10/10/2026. Status: **source implementation + math/scoped lint pass; integrated visual/browser acceptance pending root**.

Only source writes: `src/3d/utils/storyMeteor.js`, `src/3d/components/StoryMeteor.jsx`, `src/components/sections/Experience.jsx`. No App, Lab, camera, producer/store, BH, composer, ambient meteor, artwork, locale, package or AGENTS writes by this worker.

## Changes

- A measured piecewise quintic Hermite S path shares tangent/curvature at each company waypoint. Shared reading drift uses quintic endpoint easing. Company anchors and the layout/ref schema remain intact.
- A deterministic offscreen approach at negative q supplies the complete tail at entry. Initial authored point is x=-0.22 viewport widths, y=0.22 viewport heights; the three actual company points still come from DOM measurement. Tail target is 42vw with a bounded analytic search window, not a frame history.
- Departure retains nonzero incoming lateral drift; a short analytic world-space bridge matches derivatives while the existing camera begins its turn. No independent lerp, tween clock, camera writer or additional renderer.
- Desktop head: `uCore=56`; the fully white disc spans about48px, and its white falloff reaches56px. Mobile: `uCore=34`, fully white about29px. These are shader targets requiring rendered pixel verification, not new Browser measurements.
- Halo nominal 208→232px desktop /116→136px mobile. At baseline, its diameter is defined by shader intensity≈0.08; the geometry plane is larger (1.6×halo) to avoid clipping. Halo expands softly at the three measured companies, with only a slight intensity lift. Core is white; the existing subtle cyan remains in the trail/wake.
- DOM wake fade now has continuous first/second endpoint derivatives. Head flare combines the three broad pulses continuously, including any overlap. All are functions of current scroll progress.

## Executed checks

`node outputs/visual-revision-2026-10-09/g1-g2-implementation/comet/check-meteor.mjs`

**16,963 assertions PASS**. Results: [math-results.json](math-results.json).

| Width | First company tail / viewport width | Maximum relative C1 error | Maximum scaled C2 error |
|---|---:|---:|---:|
|390|0.420596|9.55e-7|4.07e-4|
|768|0.420823|5.78e-7|3.80e-4|
|1440|0.420008|1.44e-7|1.61e-4|
|1920|0.420377|3.16e-7|2.44e-4|

The390/1440 fixtures approximate historical V6 measured DOM offsets;768/1920 are synthetic responsive probes. They do not stand in for current integrated Browser evidence. Finite differences use second-order one-sided derivatives and scale-aware tolerance; analytic continuity follows the shared endpoint derivatives. Checks also cover company anchor projection, synchronized flare/wake peaks, continuous nonzero departure drift, dense finite sampling, bounded42vw ribbon, exact forward/reverse/jump buffers, unchanged layout schema and source guards for reduced/hidden/no allocation/disposal.

`npx eslint src/3d/components/StoryMeteor.jsx src/3d/utils/storyMeteor.js src/components/sections/Experience.jsx`

**PASS**, no errors/warnings.

## Integration still required

Root must measure actual white-core/halo pixels at all three companies; inspect text readability, entry, S path, reverse and Experience→departure→Works at390/768/1440/1920. Measure render FPS/frame pacing on the frozen integrated build, resources through three lifecycle/motion cycles, console/WebGL, and regression of camera/Works/EDURA Back. No concurrent Browser/FPS or production build was run by this worker. No physical phone/OS motion claim. Old V6 exact curve-parity checker intentionally does not apply to the newly authorized curve.

## Pixel calibration follow-up — diagnostic, before final build

Root requested a short output-only Edge pass on the production snapshot served at5212. `measure-pixels.mjs` uses native platform seek/the real producer to reach all three DOM-derived companies at390/1440. It captures the current page, temporarily hides only the actual named head mesh for an identical-pose background capture, and restores it. No store/camera/progress writes or FPS benchmark. Source hash was checked against the diagnostic build manifest.

Diagnostic results, before the envelope fix: **31px bright core /139px halo on390;51px core /335px halo on1440**, at all three companies. Core passes the chosen size; desktop halo is larger than intended and **fails** the200–240px target. The high-tier compositor makes the old faint Gaussian outskirts visible. These measurements are retained in [pixel-results-pre-final-intake-v1.json](pixel-results-pre-final-intake-v1.json) and the first screenshots directly under `pixel-calibration/`; they are not final integrated acceptance.

With root authorization, one head-shader fade was changed: halo light now fades over radius0.42×`uHalo`→0.5×`uHalo` and is zero outside that radius, independent of the1.6×support plane. White core, flare, BH/composer and every other source file are unchanged. Scoped lint and all16,963 math assertions still pass. Head source SHA256 after patch: `ba036c110ccc9fd289727bfc01fa311d7c2cf0fa45923c97ee631adf9a0ae28e`.

**This new source has not yet been rebuilt/re-measured in this subsection.** Root must rebuild, update build-source.json and rerun calibration. The calibration script saves each stage separately; set `QA_CALIBRATION_STAGE` to the actual build/review stage. The original diagnostic `edge80to20Css` crossed the full light+halo gradient, so its22–145px values are not a core-edge measurement. The revised script subtracts the local halo floor for core-edge contrast. Halo definition stays a radial-median **head-only difference≥20/255**, core stays lit luminance≥230/255 plus head difference≥32/255, with roughly±2px diameter quantization.

## Final frozen-build pixel calibration — PASS

Root rebuilt the final source at `2026-10-10T04:46:14.837Z` (11:46:14 Asia/Saigon), served production at5212. This follow-up wrote outputs only. Executed `measure-pixels.mjs` with `QA_BASE_URL=http://127.0.0.1:5212` and `QA_CALIBRATION_STAGE=final-integrated-build`; final results and stage-specific screenshots are in [pixel-results-final-integrated-build.json](pixel-results-final-integrated-build.json) and [pixel-calibration/final-integrated-build/](pixel-calibration/final-integrated-build/).

|Viewport|Company|Actual bright core|Actual halo|Tail arc / viewport width|
|---|---|---:|---:|---:|
|390×844|Hosana Media|31px|121px|42.055%|
|390×844|Upwork|31px|121px|41.551%|
|390×844|Designveloper|31px|121px|42.020%|
|1440×900|Hosana Media|51px|225px|42.001%|
|1440×900|Upwork|51px|225px|41.992%|
|1440×900|Designveloper|51px|225px|41.997%|

Explicit assertions confirmed exactly three actual-company states per viewport; all desktop core48–56px/halo200–240px targets pass, mobile halo≤144px passes, and all three comet source SHA256s match both the frozen build manifest and current files after QA. There were0page/console errors and0HTTP failures. Four warnings are two repeated known `THREE.Clock` deprecation warnings and two intentional Playwright service-worker-block notices.

All six lit screenshots were visually reviewed. The chosen very large round white core is sharp, with about1–5px desktop /1–6px mobile halo-floor-subtracted80%→20% core-edge width; none is clipped at the viewport boundary. The halo lights the company area, but company names, roles, periods and body copy remain legible in these shots. This is a visual readability review, not a contrast certification for every star/composite background pixel. The compact halo footprint is an intentional soft envelope, not an oversized transparent plane reported as light. The rendered core has a round silhouette; final art-direction approval remains with the user.

No FPS/GPU benchmark or physical-device/OS-motion check was added here. Integration must combine this final-build pixel evidence with its own final source/build motion/lifecycle/regression results; previous diagnostic335px halo remains a documented failure that this rebuilt pass supersedes.
