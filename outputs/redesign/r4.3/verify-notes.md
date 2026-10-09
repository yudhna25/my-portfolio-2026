# R4.3 — Browser verification handoff

08/10/2026. Browser sessions from this verifier are closed. Root owns source, baseline integrity, build/lint, production preview, performance measurement, the final verification report and AGENTS append.

## Final evidence

- `node outputs/redesign/r4.3/verify-browser.mjs`: **PASS111 snapshots**. Includes60 formed target states across20 configurations:320/390/768/1440/1920 × Vi/En × normal/reduced, and51 interaction/lifecycle-change snapshots. Run log: `browser-run.log`; structured evidence: `browser-verification.json`; trace: `browser-trace.zip`; actual PNGs: `screenshots/`.
- Native mouse: all3 institutions, star-first and link-later timing, exact formed geometry, leave exact home,9 rapid swaps. Keyboard: focus, Tab/ShiftTab, Escape with focus retained, Enter to select again, blur clear, and native Tab from Skills into the first visible Education control before the chapter top reaches the viewport top. Shared camera keeps the actual chapter pose in that overlap.
- Three live reduced/locale/resize cycles retain native DOM focus and the selected target while its stage is visible. Trusted wheel input moves focus-owned Education into Experience: target/pool cleared, base error0. Reverse returns without a stale target. Enter reselects; Escape remains cleared through subsequent reduced/locale reflow.
- Native touch via Playwright `hasTouch:true, isMobile:true`: all3 targets, tap active to clear and tap a visible background point to clear, both normal and reduced. The actual CSS viewport is checked as390px; no silent mobile viewport expansion.
- Main-star goal coordinates match the exact R0.2 subset with Float32 rounding only: maximum error**2.8733856183293938e-8 scene units**. Circinus3 main/11 context/2 links; Telescopium2/6/1; Pictor3/12/2. Link-buffer endpoint error**0**. Every formed main star stays within its stage and clear of the school button. Stage transform is a positive uniform scale and faces the camera, preserving source orientation.
- Maximum active DOM/world anchor error**0.0001972913743202298px**; camera position error**0**; quaternion difference≤**5.960464477539063e-8rad**. One Canvas, one192-point pool, one camera writer, no visible software/logo mesh in Education. Desktop map height is**1.75 viewport** at1440/1920.0 horizontal overflow and0 WebGL errors in all111 snapshots.
- All three approved institution name/period/degree/description strings are present in their DOM regions in both locales and motion modes. Buttons remain visible and at least44px high. No text depends on Canvas or hover.
- `node outputs/redesign/r4.3/verify-lifecycle.mjs`: **PASS3 StrictMode mount/unmount cycles + context-loss fallback**. Reuses the existing R4.2 fixture that mounts the real current App; no copied scene or extra Canvas. Each SymbolStars instance has3 geometries/11 materials/9 textures and emits the same dispose counts. Total mounted scene memory stays9 geometries/23 textures,10 frame subscribers. Initial31 ScrollTriggers, then23/23 from existing once-only entrances, with no growth. Unmount leaves0 Canvas/0 subscribers/0 triggers/no ScrollSmoother; both Education and Skills stores have null channels/visiblefalse. Scroll-out resets the pool exactly and stops position-buffer uploads. Fallback keeps all3 institution controls/content and native keyboard focus usable over `rgb(5,5,5)`.
- Normal run console errors**0**, warning only the pre-existing THREE.Clock deprecation. Forced context-loss teardown adds a WEBGL_lose_context extension warning after context disposal; separated in `lifecycle-verification.json`.

## Diagnostic evidence, not final pass frames

`browser-diagnostic-focus-reflow.json/.log` preserves a pre-fix failure: native Arena focus survived resize and the stage was visible again, but the selection channel had been cleared. `reflow-diagnostic.json/.log` instruments actual store calls and DOM ranges. In the direct-education diagnostic, focus remained owned but chapter progress shifted when the earlier portal/Skills height changed: Education top3557.95→2882.95px with nativeY4201, progress.40827→.83685; after390px reflow Education top3718.70px with nativeY4177, progress.23183. These are evidence of the range-change defect, not final results. Root fixed the shared producer to retain chapter/progress when the active DOM range changes; clean source-freeze5 quick51 and full111 then pass.

The initial mobile grid defect is also resolved in final source:12 columns with64px gaps forced a704px minimum span. The current mobile base grid has one column, and final touch tests confirm actual innerWidth390px. Root also moved the Education camera endpoint back, and retained dark backgrounds only behind labels/header so the chart stars are not dimmed by a full-section overlay.

## Limits and rerun

Installed Edge/Playwright render the actual WebGL scene through ANGLE/NVIDIA RTX4060, headless, deviceScaleFactor1. Mobile/touch and reduced-motion are browser emulation; no physical phone, thermal or OS toggle claim. This verifier performs no FPS benchmark; root measures performance after these browser sessions close. The Browser plugin limitation is documented by root separately.

```powershell
node outputs/redesign/r4.3/verify-browser.mjs
node outputs/redesign/r4.3/verify-lifecycle.mjs
```

`$env:R43_PHASE='quick'` skips the20-config matrix but retains the51 main interaction checks. Clear or set it to`all` for the complete111-snapshot run.
