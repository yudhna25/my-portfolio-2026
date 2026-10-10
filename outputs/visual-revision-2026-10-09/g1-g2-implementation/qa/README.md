# G1/G2 refinement — output-only QA

These scripts have not launched a browser or changed source. Run from `D:\Projects\my-portfolio-2026` after source integration. All evidence goes to the sibling implementation directory. Existing V8 results are baseline references only.

Runtime: `C:\Program Files\nodejs\node.exe`; Playwright is loaded from the installed Codex runtime, and Edge from `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`. No new dependencies. Keep normal Edge frame-limit behavior; do not use `--disable-frame-rate-limit` to improve a measurement.

```powershell
node outputs/visual-revision-2026-10-09/g1-g2-implementation/qa/build-production.mjs
python -m http.server 5199 --bind 127.0.0.1 --directory outputs/visual-revision-2026-10-09/g1-g2-implementation/production
```

The protection baseline is already captured (56 files,0 drift at handoff). Do not recapture it. The `--capture` mode exists only for a future independent run and refuses overwriting the existing baseline.

Use an independent terminal for the server. If port5199 already serves V8, stop that process first or use a new port and set `$env:QA_BASE_URL = 'http://127.0.0.1:5210'` for both scripts. Do not accidentally measure V8 under new filenames.

```powershell
node outputs/visual-revision-2026-10-09/g1-g2-implementation/qa/check-observer.mjs
node outputs/visual-revision-2026-10-09/g1-g2-implementation/qa/verify-browser.mjs
node outputs/visual-revision-2026-10-09/g1-g2-implementation/qa/verify-opening-fallback.mjs
node outputs/visual-revision-2026-10-09/g1-g2-implementation/qa/measure-performance.mjs
node outputs/visual-revision-2026-10-09/g1-g2-implementation/qa/capture-clips.mjs
node outputs/visual-revision-2026-10-09/g1-g2-implementation/qa/protected-source.mjs
```

The matrix includes320/390/768/1440/1920, cold and same-session warm opening observation, four long year-cycle poses at320/1440, native platform scroll through forward/reverse portal and meteor, full entry tail, unchanged section controls,6 EDURA Back cycles and3 live reduced/hidden cycles. It reads production exports/Fiber resources, never calls the scroll/selection writer. Screen size/core uniforms are not proof of visible ink or glow size; review screenshots and pixel measurements. Native mouse wheel is separately used for frame cadence. Capture-clips records opening→portal/reverse and Experience→departure→Works from the same production source, using real CDP frames and timestamps.

Opening observation is a rAF DOM log from before app startup. A loader-to-Hero visual overlap, accurate final O position, cold1.6–2.0s/warm0.8–1.0s presentation, no blank frame/pop and controlled slow-resource fallback require reviewing the capture and implementation readiness state; the harness deliberately does not convert a timing log into visual approval. Opening FPS starts only when the actual root can be observed. Need additional runs for slow font/WebGL and no-WebGL. Installed `ffmpeg`/`ffprobe` are at `E:\ffmpeg-2025-04-14-git-3b2a9410ef-full_build\bin\`. Clip encoding is30fps for review, not a renderer FPS result.

Selectors needed: `[data-preloader]`, `[data-preloader-ring]`, `[data-opening-veil]`, loader's `data-opening-duration/ready`, `[data-portal-stage]`, `[data-hero-year]`, `.hero-year-base`, `.hero-year-tail`, `[data-story-anchor="portal"]`, existing story chapter markers/native section controls. Current decorative pools are `[data-portal-trails]` containing `.portal-trail-copy`: observers check inert/aria-hidden, declared/actual counts, no IDs/links and pool stability through reverse/Back/reduced. Named scene nodes `story-meteor`, `story-meteor-head`, `story-meteor-trail` and existing userData `journey/tailPixels/span` are retained observation contracts.

Opening-fallback adds1800ms font delay, aborted font requests, disabled WebGL at390/1440, and a fresh reduced-motion opening. Readiness delay and timeline duration are logged separately from frame telemetry. Expected injected network/WebGL failures are separated from unexpected errors. Reveal alignment compares actual ring and O centers while the veil is opening; it does not infer image quality from loader duration alone. The opening phase records `data-scene-ready`, font status and fallback independently.

Run source protection capture once before implementation, then compare; do not recapture to hide drift. If root already captured a stronger baseline, compare that instead. Build-source hashes freeze the source/public/config used for current screenshots. Timing/structural checks remain technical evidence, not human G1/G2 approval or permission for V9/G3.
