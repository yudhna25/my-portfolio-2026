# V8 integration handoff — G2 pending

> **Superseded measurements, 10/10/2026:** the authorized G1/G2 P1–P4 implementation is now technically/local verified; [current verification](../g1-g2-implementation/verification.md), [same-build gallery](../g1-g2-implementation/review.html), [handoff](../g1-g2-implementation/handoff.md). G1/G2 human visual approval remains pending; V9/G3 stay on hold. V8 evidence below is historical, including the old first-tail exception; the new authored entry tail is measured≈42vw at all three companies. Existing protected contracts/assets remain unchanged.

## Shared interfaces

- `Portfolio.worksLayout`: one stable `{current:createWorksLayout()}` object. Same ref goes to `<Work layoutRef>` and `<WorksConstellations layoutRef>`. Renderer publishes `ready/width/height/basis/figures/onChange`; it is projection telemetry, not a second selection store. Work owns the single callback and cleans it up.
- R6.2 history/route store is unchanged. Back first seeks through the existing producer and completes Smoother scrub, then waits boundedly for the Works projection before focusing `work-target-edura`. New input cancels pending focus. Fallback still focuses the native control. `work-case-edura` and route metadata remain intact.
- Work's optional `nativeNavigation` defaults false; Lab sets true because its page has no SPA reader route subscriber. CTA remains a separate anchor. Production uses the unchanged navigateRoute/saveMainEntry contract.
- Education gets three stable stage refs. SkillsSymbols remains the only shared SymbolStars/pool192 renderer; three EducationArtwork instances follow their own stage anchors. Artwork is enabled only in the Education chapter, while native early-focus pool ownership stays intact. No Education art in Skills.
- Experience's stable `onLayout` callback writes its measured layout into one ref for StoryMeteor. Lab now uses the same component instead of a duplicate generic chapter/departure. Camera/progress/curve/wake helpers are untouched.
- Works and Education fallback artwork URLs resolve from `import.meta.env.BASE_URL`; EducationArtwork already used this convention. V4 mappings/star positions/edges/assets remain identical.
- `ConstellationCredits` mounts once outside Smoother in App and Lab. Two consumer triggers target its native auto popover. Main new keys: `education.constellationNames.*`, `education.figureLabel`, `constellationCredits.*`; Lab source labels/notes updated. No store patch needed.
- Education polygons suppress native/global scaled outline/shadow and keep keyboard non-scaling white2px stroke. Do not remove this focus treatment when reusing the hotspots.

## Preserved contract for V9

Existing `worksOrbit` remains the only origin/phase. `syncWorksOrbit` captures once when leaving Works into positive finale/contact; reverse uses the same origin. `worksFinaleSelection` and Work presentation ownership return on reverse. No additional snapshot writer was introduced. Idle uses the existing analytic eased integration; compare route restore against the snapshot captured at CTA activation.

Finale stays225vh and existing helpers remain unchanged. V9 may begin only after explicit human G2 approval; it must recheck Hero/portal G1 after changing shared files. No finale400vh, explosion or Contact rewrite in V8.

## Evidence and review

See verification.md, browser-results.json, extras-results.json, interaction-results.json, fallback-results.json, performance-results.json, build-source.json and evidence-index.json. Review.html uses only final V8 captures from the same compiled source; failure diagnostics and worker baseline images are excluded.

Pending human decision: G2 Education/meteor/Works art direction, including the known V6 entry-tail exception. First milestone6.23% desktop/14.60% mobile is a worker measurement retained as an explicit exception, not new V8 approval. Mature tail42%. No physical phone/OS/Safari/Firefox/HTTPS verification in V8.

Worker AGENTS rows V5/V6/V7 are appended by root sequentially with their historical evidence status. The V8 row records technical completion and G2 pending; existing rows stay unchanged.
