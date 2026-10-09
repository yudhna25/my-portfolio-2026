# R2.1 — read-only flow review

Review source snapshot: `useScrollProgress`, `useLabScroll`, `3d-lab`, `CameraRig`, `GalaxyScene`, `useScrollStore`, `LabTelemetry`. Reviewer did not edit production source or AGENTS.

## Framing finding — resolved by calibrated Works target

The initial WORKS endpoint `[0,4,-160,40,0,-210]` still placed the existing black-hole center inside the viewport. The actual Three.js PerspectiveCamera projection with CameraRig's responsive FOV gave:

| Viewport / aspect | BH center NDC x | BH center NDC y | Inside viewport |
| --- | ---: | ---: | --- |
| 390×844 | −0.7443065971 | −0.0281808768 | Yes |
| 1440×900 | −0.7439131771 | −0.0958016109 | Yes |

The integrating agent changed the WORKS lookX target from 40 to **140**, preserving its position/other target fields. Re-check with the same responsive FOV and aspect confirms the center and sampled physical radius-14 disk outline both leave the left edge:

| Viewport | FOV | BH center NDC x | Maximum disk outline NDC x | Outside left edge |
| --- | ---: | ---: | ---: | --- |
| 320×844 | 113.414050° | −2.6006049502 | −1.2539883010 | Yes |
| 390×844 | 102.655567° | −2.6006049502 | −1.2539883010 | Yes |
| 1440×900 | 60° | −2.5992891802 | −1.1581973402 | Yes |

This resolves the numeric framing finding for Experience p=1, Works and Finale p=0. `check-path.mjs` now includes these assertions, sampling 128 points around the physical radius-14 disk. Ray-traced appearance and bloom remain subject to the integrating agent's Browser verification.

## Flow checks from source

- Ownership: Lab calls `useLabScroll` once, which delegates to `useScrollProgress`; App still calls `useScrollProgress` once with defaults. `story=false` remains the GalaxyScene/CameraRig default, and App does not enable the flag.
- Shared producer: story ticker returns while `storyManual` is true. `seek()` publishes one story transaction before setting native/Smoother scroll, preventing the ticker from replacing an explicit endpoint. No independent manual ticker was added.
- Resume contract: `resume()` re-seeks the held chapter/progress before releasing manual mode. Wheel scrolling while held is ignored by story state; Resume returns the DOM to the held pose, then normal visible-scroll updates resume. This behavior should be written in contract.md.
- Scroll position: `ScrollSmoother.get().scrollTop()` returns the rendered `-currentY` in the installed GSAP source, rather than the underlying target scroll. `scrollProgress` still represents normalized page scroll; chapterProgress is separate.
- Measurement: relative bounds use section rect minus content rect; ResizeObserver, resize, load, refresh, FontFaceSet loadingdone/ready and locale dependency remeasure. Manual chapter/p is reapplied after reflow. The ready callback has an active guard; all registered listeners/ticker/observer are cleaned up.
- Camera ownership: only CameraRig writes the perspective camera. The story branch uses direct `position.set` and `lookAt`, output reuse and zero pointer parallax. Production keeps its existing damping/contact path. Frozen story chooses the current chapter's static endpoint, while frozen production remains legacy cameraPath(0).
- Ambient comparison: GalaxyScene freezes existing StarField/Nebula/Constellations/BlackHole time effects in story mode and unmounts ShootingStars/StardustWake. This is a lab comparison switch, not a new production effect implementation.
- Continuity and framing: numeric self-check passed **181,030 assertions / 18,018 poses**; minimum observer radius 8.1829090182 with BH center `[0,0,-200]`. No portal/finale renderer, phase capture, selection controller or second Canvas was introduced.

## Limits

Browser checks for repeated lifecycle, actual scroll synchronization, font/locale reflow and mobile controls are owned by the integrating agent. The reviewer confirmed source ownership and numeric geometry; this report does not claim motion/FPS/visual-effect completion.
