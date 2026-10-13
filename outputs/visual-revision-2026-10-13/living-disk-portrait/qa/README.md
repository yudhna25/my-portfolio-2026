# Current-build checks

Run from the project root. No new dependency was installed.

Set STELLAR_PLAYWRIGHT_MODULE to an installed Playwright module entry, QA_BROWSER to the local Chromium/Edge executable if needed, and STELLAR_FFMPEG to an installed ffmpeg executable. Paths are environment-specific and intentionally not committed here. QA_BASE_URL defaults to http://127.0.0.1:5215 and QA_LAB_URL to http://127.0.0.1:5214.

Build and serve the app with npm run build, npm run preview -- --host 127.0.0.1 --port 5215, and npm run dev -- --host 127.0.0.1 --port 5214 for Lab.

Run sequentially to avoid concurrent GPU contention:

1. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/check-portrait.mjs
2. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/verify-upgrade.mjs
3. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/verify-browser.mjs
4. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/verify-extras.mjs
5. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/check-fallback.mjs
6. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/measure-performance.mjs
7. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/capture-clips.mjs
8. node outputs/visual-revision-2026-10-13/living-disk-portrait/qa/check-review.mjs

The build fingerprint must match the source being checked. Regenerate it after an intentional build; never re-label stale screenshots as a fresh measurement. Older smoke files are exploratory; only the final reports/evidence-index are review evidence. diagnostics/before-layout-read-fix-* preserves the superseded performance sample.
