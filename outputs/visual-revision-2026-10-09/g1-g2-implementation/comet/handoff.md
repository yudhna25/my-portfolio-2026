# Experience comet → G1/G2 integration

> **Integrated final-source update, 10/10/2026:** worker implementation is unchanged, but root has completed same-build QA. [Current verification](../verification.md), [gallery](../review.html), [final pixel results](pixel-results.json): core51px/halo223–225px desktop,31/121px mobile, tail≈42vw at all three companies. Measurements/status below are the earlier worker record, superseded by these integrated checks. G1/G2 visual approval remains pending.

Source writes are finished. Reuse the same renderer, measured layout and App/Lab callers; **no interface patch is required**.

```jsx
<Experience onLayout={captureMeteorLayout} />
<StoryMeteor layout={meteorLayout} frozen={reduced} />
```

Layout stays `{width,height,range,points:Float64Array(10),milestones:Float64Array(3)}`. Only the authored entry point changes to `[-0.22,0.22*height]`; three company anchors35%/72%/35%, their y offsets24px above labels, and the final point `[0.62,range+0.5*height]` stay DOM-derived/current. `meteorReadingY` now uses quintic easing for the22%→50% viewport drift; derive milestone q from this helper in QA, not saved V6 q values. Wake/flare use that same reading function.

`sampleStoryMeteor` accepts authored pre-entry q down to-0.9; Experience0..1 and departure1..2 retain the existing producer contract. Company sections share scalar C2 quintic Hermite endpoint derivatives. Departure x retains an incoming-0.12 normalized viewport/q drift and returns to0.5; depth still ends96. Its first16% analytically blends a continuation of the incoming world tangent into the existing camera-relative trajectory. Camera/progress producer are untouched. All output is analytical and deterministic on rapid reverse; no state/history is accumulated.

`writeStoryRibbon` uses the same caller-owned buffers/scratch and128samples. Its bounded search window grows to≤1.6q so there is enough projected arc during the camera turn. Target is42vw; no frame history or allocation inside sampling/frame callbacks. The resource budget stays2geometries/3materials/3draw calls/510triangles, and manually owned geometry disposal remains.

QA telemetry names stay `story-meteor`, `story-meteor-wake`, `story-meteor-trail`, `story-meteor-head`. `head.material.uniforms.uHead/uCore/uDiameter/uOpacity`, `group.userData.journey/tailPixels/span` survive. Additions: `uHalo`, `uFlare`, `group.userData.flare`. Update **live material uniform maps**, as before; Fiber copies wrapper uniforms. Head core is56desktop/34mobile, with≈48/29px fully white interior; nominal halo208→232desktop/116→136mobile. `uDiameter` is now1.6×halo geometry support, **not** the measured halo diameter. Tail width112/68 and wake216/116px are soft support widths. Do not call plane bounds actual light size.

Reduced/hidden visibility gates and disposal are unchanged; no additional interactions, content, audio or CSS file. Browser/frozen build/FPS/resources/native and rendered pixel acceptance belong to root. See [verification](verification.md) and [16,963 math assertions](math-results.json). Do not reuse old V6 screenshots/FPS as proof of this revision.

### Post-calibration head patch

The first diagnostic5212 calibration measured actual51px desktop /31px mobile core, but335px desktop halo (139px mobile), because compositor conversion lifted faint outer light. Root authorized a head-only soft boundary at0.42–0.5×`uHalo`, zero light beyond the nominal halo radius. **New StoryMeteor.jsx SHA256: `ba036c110ccc9fd289727bfc01fa311d7c2cf0fa45923c97ee631adf9a0ae28e`.** Other two source hashes are unchanged. Source writes have stopped; lint/math pass. Rebuild before re-running `measure-pixels.mjs`; do not measure old5212 chunks and call the patch verified.

`QA_BASE_URL=http://127.0.0.1:<final-port>` plus `QA_CALIBRATION_STAGE=final-integrated-build` reruns six actual-company states and stage-specific captures. The original diagnostic edge width included the halo; revised measurements remove its floor to report core edge honestly. Screenshots must also be visually reviewed for text readability; the halo still brightens the sky behind company labels. No global bloom/composer/BH change is needed or authorized.

### Final rebuilt measurements

Final production5212, build timestamp2026-10-10T04:46:14.837Z: **all three companies measure51px bright core /225px halo at1440;31px/121px at390**, using radial medians of head-only differences against a same-page background capture. Tail41.55–42.06vw. All six images visually reviewed: company/role/period/body remain readable, no head viewport clipping. Assertions confirm the current three source hashes equal the frozen build manifest. See [final pixel results](pixel-results-final-integrated-build.json) and [final screenshots](pixel-calibration/final-integrated-build/).0errors/HTTP failures; known Clock + intentional SW-block warnings only. No source edits during this final QA. FPS/lifecycle/full-journey and human visual G1/G2 approval remain integration responsibilities.
