# R6.2 — Independent final source review (v1)

09/10/2026 · Asia/Saigon. Reviewed the implemented source after root integration. Read-only: no application/public/config/AGENTS edits. This review does not substitute for root production/SW verification.

## Assessment

No critical route loop, external Back trap, reader Canvas leak or new camera/orbit writer was found in the current v1 source. The small native History design meets the requested two-route scope and reuses the existing progress/camera/orbit infrastructure. Keep the production-preview/SW and full matrix gate before marking R6.2 done.

Files reviewed: App.jsx, stores/useRouteStore.js, 3d/hooks/useScrollProgress.js, Work.jsx, Nav.jsx, MenuOverlay.jsx, pages/Edura.jsx, i18n/config.js, vite.config.js and vercel.json. Existing R5.2/R6.1 content and selected image policy remain intact.

## Resolved design hazards

- **Primary href and modifiers:** Work EDURA is a real /projects/edura anchor. navigateRoute bypasses prevented/non-primary/modifier clicks. Nav and Menu anchors use /#section with modifier bypass. VERIS/VIE remain non-actionable. No framework/router dependency was introduced.
- **Snapshot before unmount:** saveMainEntry obtains visible ScrollSmoother scroll, current story chapter/progress, immutable orbit scalars, effective selection, pose and focus origin. It replaces the current entry before pushing reader. A validated snapshot is rehydrated into the existing mutable worksOrbit object; pinned velocity is deliberately reset to0 to prevent phase drift while waiting for restored focus.
- **History loops:** Route sync reads history and sets state; it never pushes during popstate. Return uses the reader entry's known main predecessor marker rather than history.length. Direct reader Return creates /#work. Native Back from an externally entered reader is not intercepted.
- **Intro and reading lock:** Store prepare disables loading for reader and restored/hash main entry. Reader renders a separate Edura subtree, so Portfolio's hooks/Preloader/Canvas are absent. Returning no longer mounts intro or story meteor replay.
- **One event owner:** Main useScrollProgress is passed historyManaged=true, disabling its old hash/pop listeners. Root App owns the route listeners. The initialPosition key prevents the initial/fonts-ready hash seek from overwriting a saved mid-Works progress.
- **Restore/focus order:** Portfolio waits for fonts and scene/producer readiness, refreshes ranges, seeks the shared producer, completes the existing Smoother scrub, then focuses the EDURA target with preventScroll. The camera still derives its pose from the shared story state; no route code directly writes camera.
- **Resize/locale/reduced:** The restore uses semantic chapter/progress and measured DOM ranges, so a different layout returns to Works rather than stale pixel coordinates in a previous chapter. The existing reflow/GSAP matchMedia restoration remains active.
- **Resource lifecycle:** Portfolio is unmounted in reader. Shared Nav skips auto-hide ScrollTrigger when reader=true; Menu is keyed by route to release its dialog lock and pending seek. Scoped GSAP contexts and scene disposal remain the existing cleanup owners.
- **Sound consent:** Shared Nav/Sound remains mounted across document route changes, retaining the user's current opt-in without re-starting audio from saved preference. A true document reload retains the existing consent-per-document policy.
- **Reader navigation:** Shared Nav uses a reader-specific skip target and direct /#section routing; Menu closes and clears its trigger reference before reader→main handoff. Reader no longer exposes a duplicate brand/skip link.
- **Metadata:** i18n derives case vs portfolio title/description from route state, subscribes to route changes, and updates canonical/OG values. Language switching does not revert reader title to portfolio title.
- **Deployment/offline:** Exact Vercel case rewrites do not capture static case images. Explicit Workbox index navigation fallback is present. Only the selected three case images remain in public; no recovered gallery was copied.

## Two bounded refinements (non-blocking in observed quick checks)

1. **Same-entry event idempotence:** Root listens to both popstate and hashchange. sync currently re-runs prepare and allocates a fresh restore object even when the entry/path/hash is already current. Native Back between hashed entries can emit both events, causing a duplicate restore setup. The consumed key and cleanup/settle paths avoid duplication in quick evidence, but an equality guard keyed by entry id + pathname + hash would make this explicit and avoid resetting a saved position on a late duplicate event. Include hash in the guard so genuine same-entry anchor changes still work.
2. **Late settle after interaction:** Portfolio's initial restore settle waits at most120 RAFs for Canvas. It then seeks the saved pose again even if the user has already started scrolling during delayed scene readiness. The task expects restore after layout/scene readiness, so this is not a demonstrated failing acceptance case, but consider cancelling the final seek if a genuine user navigation has superseded that restore entry. Avoid a new restoration framework; one entry/active guard is sufficient if reproduction warrants it.

Neither suggestion calls for a new library, controller or camera writer. Root should prioritize any reproducible browser failure over speculative expansion.

## Evidence inspected

Read outputs/redesign/r6.2/browser-route-results.json from root's real Edge154 dev run: status pass, one quick1440Vi/non-reduced configuration plus the direct/reload/navigation extra, errors[]. Assertions cover same-document EDURA entry, exact captured scroll/orbit/camera on Back/Return, native Forward,3 repeated cycles, Ctrl popup with zero Canvas, direct/reload reader, language→English plus1440resize/reduced, Menu→About and outbound native Back to a separate document. Scene resource/disposal assertions and known Clock warning are recorded by root. These are root-produced measurements, not independent runtime runs by this reviewer.

Full8 configurations, compiled preview and SW offline artifacts were not yet final when this review was written. Do not infer those passes from the quick JSON. Physical phone/OS reduced-motion and deployed HTTPS remain unverified unless separately measured.

## Remaining scope boundary

R6.1 content gaps (walkthrough/video/detailed system/measured outcomes) remain unchanged; no route work should invent them. Runtime metadata is a client SPA policy, not SSR/crawler rendering proof. No route history or reader infrastructure for other projects was added. R7 finale/Contact redesign is outside this review.
