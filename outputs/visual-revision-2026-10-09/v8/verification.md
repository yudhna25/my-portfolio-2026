# V8 — Integrated production verification

> **Superseded measurements, 10/10/2026:** the authorized G1/G2 P1–P4 implementation is now technically/local verified; [current verification](../g1-g2-implementation/verification.md), [same-build gallery](../g1-g2-implementation/review.html), [handoff](../g1-g2-implementation/handoff.md). G1/G2 human visual approval remains pending; V9/G3 stay on hold. V8 evidence below is historical, including the old first-tail exception; the new authored entry tail is measured≈42vw at all three companies. Existing protected contracts/assets remain unchanged.

Status: **technical/local PASS; human G2 pending**. V9 has not started. Date: 10/10/2026 (Asia/Saigon).

## Source and build

V5/V6 chats were idle/completed before integration, V7 had completed. The only delegated reviewer was read-only. [Baseline](baseline.json), [source/build hashes](build-source.json), [scope check](check-results.json).

- Standard `npm run build`: pass on final source; PWA40 entries. Repo lint: 0 errors, 2 existing SplashCursor warnings. Scoped lint: clean. `git diff --check`: pass (CRLF notices only).
- A single output-only Vite **production** build includes index.html and 3d-lab.html, served on loopback5199. No Vite config edit or production route was added. Both entrypoints use the same compiled consumers. Screenshots and clip below are new V8 evidence from that build; no worker baseline image is used to call the integrated site pass.
- 79 baseline source/asset files remain byte-identical, including camera/producer/store/GalaxyScene/BH/compositor/ambient/meteor curve/Skills/EDURA and all V4 assets. Ten integration source files changed; one credits component was added. Final90 source/asset hashes match the measured build.
- Vi/En parity: 254 main keys +93 Lab keys. New Education figure labels/names match Orion/Scorpius/Leo; obsolete Circinus/Telescopium/Pictor labels removed. Credit/source/license labels are bilingual.

## Current production behavior

| Check | Evidence/result |
|---|---|
| Matrix | [browser-results](browser-results.json): 529 executed assertions; 390×844,768×1024,1440×900,1920×1080. G1 portal forward/reverse, all7 Skills tools, all3 Education figures, meteor/departure, all3 Works figures/panels. 0 horizontal overflow in measured states. |
| Native interaction | Mouse on projected figure→panel, touch/pin, keyboard Tab→EDURA CTA/Escape, separate CTA vs selection, VERIS/VIE coming soon. [Additional interactions](interaction-results.json): 180ms grace preserved at90ms, closed after270ms; 48 rapid taps across4 viewports; Works height and scroll unchanged. |
| Route/Back | Three cycles each at390 and1440. Reader Canvas0/Smoother absent, Back Canvas1/projected work-target-edura focus, selection/scroll/orbit restored. Desktop compares the actual history snapshot at CTA activation, not an earlier still-easing orbit sample. All6 unmounts GPU memory0geometry/0texture; each watched scene cleanup24geometry/33material/15texture dispose events, and resources return consistently. |
| Motion/lifecycle | Three live reduce↔normal cycles: Smoother off/on, triggers0↔3, camera static/meteor off when reduced. Normal samples stabilize at8geometry/23texture before first visible uploads. [extras](extras-results.json): hidden subscription changes frameloop to never and produces0 new render passes; resume/frozen lifecycle has0 GL error. No OS Settings was toggled in V8. |
| Lab | Same production SkillsSymbols/Education/Experience/StoryMeteor/Work/WorksConstellations; exactly1 departure marker and1 pool. Native chapter select, real Education control, Works projection, native EDURA navigation. Content Off inert; About ejection remains governed by its existing G1 phase writer. |
| Fallback | [fallback-results](fallback-results.json): Edge --disable-webgl at390/1440, Canvas0, three real SVG artwork images, no overflow, real reader and Back focus. |
| Bilingual/focus | [extras](extras-results.json): 69 checks, bonus320 viewport, main Vi/En, credit Enter/Tab/Escape and trigger focus return, native SVG Tab/Enter. |
| Console/GL/URLs | 0 unexpected console/page errors,0 measured GL errors,0 local404. Expected THREE.Clock deprecation and Playwright service-worker-block warning are listed separately. All6 artwork maps decoded/loaded in current main scene; fallback images use BASE_URL. |

Credits use a native auto popover, including light-dismiss/Escape and return to trigger; [MDN platform behavior](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using). Links preserve V4 author, pinned source, Free Art License1.3, Stellarium CC BY-SA4.0 and ESA/CDS citation; full attribution/manifest are linked via BASE_URL. No public asset was edited.

## Integration fixes discovered by current QA

The tiny-viewBox Education SVG hotspot inherited both a native pointer-focus outline (`auto5px`) and the unlayered global keyboard outline/shadow. These were magnified in SVG local units and obscured the figure. Scoped important outline/shadow resets now apply to the polygon for both pointer and keyboard; keyboard focus uses a white2px **non-scaling stroke**. Native Tab/touch states and final screenshots confirm the correction; no geometry/artwork/radius change was made. Earlier education-debug images are failure diagnostics, not G2 evidence.

Work's shared projection ref is wired to both renderer and DOM. Back focus waits for that projection after the existing seek/settle, is bounded, and cancels on new input. Lab reuses production consumers and native reader navigation; hidden controls use inert. Artwork is enabled only during Education; the Skills regression saw no Education artwork leak. Meteor stays out of SelectiveBloom: child layers1; selected BH disk layer1025; BH/shader/composer source is unchanged and core stays visually dark in the new captures.

## Frame and resource measurement

Current GPU: ANGLE NVIDIA RTX4060 / D3D11, high tier at1440×900, DPR1.75. One passive negative-priority R3F subscription counts frames; scene render passes are counted separately because bloom draws the scene twice. **education: 163.19 / experience: 165.10 / works: 165.16 FPS**, each2.5s. [Measured samples](performance-results.json). The earlier main-suite render-pass rate is not FPS. No physical-phone FPS or thermal claim.

Ambient counts remained1500/12000/24000/24000 across the four viewports. No second Canvas, camera/controller, state store, curve, or renderer was added.

## G2 review and known exception

[Review gallery](review.html), [same-build clip](clips/integrated-education-experience-works.webm) (7.17s, 63 actual captured frames; encoded with installed ffmpeg, not an FPS measurement), [evidence hashes](evidence-index.json), [handoff](handoff.md).

V6's **first milestone tail remains short** (worker quantified6.23% desktop/14.60% mobile); mature tail reaches42%. V8 deliberately preserves the approved curve/birth timing. This visible exception is presented to G2, not silently declared resolved. Scientific catalog attribution retains V4's recorded commercial-grant evidence gap; V8 makes no additional licensing conclusion or publication.

G2 is a human art review; passing scripts cannot approve it. V9's finale400vh/spectacle remains untouched (225vh current marker). No deploy/push/commit or new-task automation was performed.

Not checked: physical touch device/GPU, OS motion toggle, screen reader, Safari/Firefox, public HTTPS/deployment. Touch/reduced/hidden/fallback are browser simulations. Technical checks cover the stated integration, not a full accessibility or legal audit.
