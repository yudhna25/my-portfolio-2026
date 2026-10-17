# Re-run QA from repository root

Install repository dependencies normally. Set STELLAR_PLAYWRIGHT_MODULE to the installed Playwright ES module and STELLAR_FFMPEG to an installed ffmpeg executable; these tools are not application dependencies. QA_BROWSER optionally selects a Chromium browser.

Serve the current production build on 127.0.0.1:5215 and the development Lab on 127.0.0.1:5214. QA_BASE_URL overrides production origin. Run node with each script in this folder. Do not profile while another render/capture test is running.

- check-finale.mjs: analytic phase/camera/orbit/seed tests.
- verify-finale.mjs: 3 viewports, native forward/reverse/hold/jump, locale, core measurement, portal regression. verify-finale-1920.mjs is the targeted retry retained after a navigation timeout.
- verify-lifecycle.mjs and verify-collapse-hold.mjs: live motion, resize, route disposal/Back, exact Lab framebuffer hashes.
- verify-opening.mjs: natural preloader screenshots and progress records, without changing application state. opening-lifecycle.mjs: hidden/resize/live reduced.
- check-fallback.mjs: wait for lazy fallback completion before measuring the shorter document.
- verify-pipeline.mjs: full drawing-buffer HDR, radiance, one ray pass per frame.
- measure-performance.mjs: real R3F frame intervals; does not interpret encoded video as FPS.
- capture-clips.mjs: actual timestamped CDP frames; preloader, orbit, desktop forward/reverse, mobile finale.
- check-review.mjs: source/dist/media hashes and gallery image/video decode/play/seek.

Browser observation uses existing loaded modules/Fiber state. Optional GSAP timeline discovery is not required: completed intro timelines can already have been cleaned up. The application has no test-only runtime hooks.
