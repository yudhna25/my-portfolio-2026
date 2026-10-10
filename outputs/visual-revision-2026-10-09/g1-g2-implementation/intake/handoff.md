# G1 intake — handoff 10/10/2026

Implementation authorized by the user's “bắt đầu kế hoạch tinh chỉnh g1-g2”. Visual approval is still pending; this does not start V9/G3.

## Files / ownership

- `src/3d/utils/portal.js`: keeps `portalProgress` / `portalState` boundaries unchanged. `portalIntake` retains its signature and returns a deterministic funnel pose plus `t`. New `portalIntakeSample` takes normalized `t` so the decoration can sample ahead without a history buffer or a second producer.
- `src/components/effects/portalTrails.js` + `src/styles/portal-trails.css`: shared bounded DOM/SVG decoration, **6 snapshots/source initially mobile or 8 desktop after root performance tuning**. One layer per consumer; source geometry is measured at entry/resize/fonts, not every progress write. Decorative text comes from existing localized DOM. Year snapshots reuse root's cached mono PNG stars and append the matching contour; original contour SVG is suppressed during intake. No cloned pattern IDs or 1500-circle definitions.
- `PortalHeading.jsx`: individual year digits, PORTFOLIO characters except O, and measured words for name/role/intro/indicator. Contour laps are 10,11,12,13,14 seconds. Idle meteors/twinkle pause/play without rewinding on hidden; stage exposes `data-static-motion` for root CSS. Existing glitch reset and name decode remain.
- `Nav.jsx`: each actual link/menu/sound control is a separate intake source. Existing interaction/inert/ARIA/ejection and auto-hide logic remain. Its portal override is subscribed before decoration capture so the bar is visible at the measured entry pose.
- `Cursor.jsx`: ring/dot join the same sampled funnel when a pointer position exists, retaining existing desktop/magnetic/lens rules.

No App, Hero, hero.css, GalaxyScene, CameraRig, stores, locales, Lab, BH, StarField or assets were edited by this worker.

## Integration / QA interface

No new props, refs, stores or locale keys are required. Existing `chapterProgress` and `storyAnchor` remain the only inputs. Root makes Hero active beneath the opening overlay independently.

Query `[data-portal-trails]`: `data-source-count`, `data-copy-count`, `data-progress`; children `.portal-trail-copy` are the bounded images and `.portal-trail-ribbon` the connecting paths. The layer is `aria-hidden`, inert, pointer-events none, hidden at rest/after intake; clone IDs, data/ARIA references, actionable href/tabindex/title/name/for and inline event attributes are removed. Only generated PNG data URIs on SVG image elements survive. Actual buttons are never copied as actionable wrapper controls. A pool is removed during locale/reduced/fallback/route cleanup.

`portalIntakeSample` converges branches into a shared 1.25-turn funnel. Quintic branch joins avoid a sudden tangent/acceleration change at the joining thresholds. Early primary snapshots keep near-uniform scale; joined snapshots align with the actual analytic tangent and have their width capped by the local radius, preventing large year/word slabs. Filled tapered strips cover individual entry branches, while Hero paints just one joined spiral; Nav/Cursor do not stack duplicate funnels. An alpha mask matches the existing BlackHole projected shadow radius (`anchor.height * .48 * phase.growth`) so decoration vanishes inside the dark core. At p=0 the measured source pose is unchanged; at p=.435 all copies have faded at the moving measured O center. Originals remain suppressed until p=.5 so they cannot flash during .435–.44, then normal ejection opacity restores them.

Root's initial diagnostic screenshots at p=.1/.22 showed flat text/spikes. These prompted the above aesthetic correction; the first math/lint pass was not a visual pass. Nav's existing absorbing classes already make its bar bg/border transparent; individual control snapshots contribute the visuals and actual controls remain gated.

## Status

Worker writes stopped; root owns the final integration. Scoped lint PASS; **33,272** analytic assertions PASS after root arrival/alpha correction (rest, early readability, width cap, actual tangent, finite values, reverse/direct determinism, convergence, continuity and unchanged phase boundaries). Current integrated Browser/FPS/resources/keyboard/reader evidence is in [root verification](../verification.md); human G1/G2 visual approval remains pending.

Root appends one integrated AGENTS row after all final checks. No independent worker row is required for this refinement.
