# V6 — Experience DOM wake

Owned change: `src/components/sections/Experience.jsx` only. Reuses the shared
`meteorWake(layout, index, chapterProgress)` helper and existing `meteorEmphasis`.

- Three non-interactive, aria-hidden wake strips. A 160×80 CSS radial halo has a
  white center and faint cyan falloff. The white edge sits exactly 24px above
  its label, at the same 35% / 72% / 35% horizontal anchors measured for the curve.
- Each strip receives opacity directly from story progress. No tween, timer,
  accumulated state or frame history. Other chapters, hidden documents and
  reduced-motion set opacity to zero. Existing static content stays readable.
- Existing measurement, mutable layout, `onLayout`, locale content, milestones,
  placements and departure110vh / reduced20vh remain intact. One visibility
  listener is removed during useGSAP cleanup; authored opacity is restored.

Initial scoped lint was blocked by absent node_modules. The V6 owner restored
dependencies from the existing lockfile and reran scoped lint: pass. Package and
lockfile hashes are unchanged. Actual App 390/1440px wake/readability, locale,
stop/reverse/jump and reduced/fallback checks now pass; see verification.md.
