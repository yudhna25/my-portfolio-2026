# G1 intake verification — 10/10/2026

## Executed

- `node outputs/visual-revision-2026-10-09/g1-g2-implementation/intake/check.mjs`: **PASS, 33,272 assertions after root's visual correction**. Viewports 320/390/768/1440/1920; five representative source indexes each. Results: [self-check.json](self-check.json).
- `npx eslint src/3d/utils/portal.js src/components/effects/portalTrails.js src/components/effects/PortalHeading.jsx src/components/layout/Nav.jsx src/components/Cursor.jsx`: **PASS, 0 errors/warnings**.
- Source review: phase boundaries 0–.44 intake, .44–.50 black, .50–.94 eject, controls restored .90–.96 unchanged. No edits to camera/star/BH or additional writer/Canvas/store. All clone content comes from source DOM; copies are inert, hidden from accessibility, noninteractive and without IDs/inline handlers.

Analytic coverage includes identity pose at p0 (no shift, rotation0, scale1), early X scale≤1 and Y scale>.8, joined source width constrained by local radius, analytic tangents matching finite differences, finite positive scales/opacity bounds, exact same pose forward/reverse/direct across436 progress samples, terminal convergence to the same measured moving O, continuous joins and portal gate rules. This is math evidence, not a visual-performance claim.

An initial self-check import pointed one directory too high; corrected before the PASS run. Scoped lint initially found one unused parameter; the same parameter now supplies a small branch-radius separation and lint passes.

Root's first production images exposed an aesthetic failure (flat, overly stretched text and spikes). They remain diagnostics, not final evidence. Early scale/tangent/width caps, staggered arrival and alpha prevent a glyph lump; final pool6mobile/8desktop, filled taper branches + one common spiral/core mask and active-only compositor promotion passed root's frame-cost tuning. Year uses cached PNG stars + contour snapshots, with no contour left behind. Final-source captures/logs are referenced in [integrated verification](../verification.md).

## Integrated handoff

Root owns actual spiral/ribbon review and native motion/route/resize/keyboard/FPS checks on the combined source. [Root report](../verification.md) and [gallery](../review.html) supersede worker-only integration limits. Human G1/G2 acceptance remains pending; no V9/G3 work.

Known scope limit: the artwork effect uses bounded text/visual afterimages plus filled tapered strips, rather than a pixel-deformation shader. Its visual quality must be judged on the integrated clip; it has not received G1 visual approval. The live alpha core mask is a compositing cost that integrated frame-pacing QA must measure.
