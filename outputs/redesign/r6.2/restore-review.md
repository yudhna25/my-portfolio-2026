# R6.2 — Independent restoration design review

09/10/2026 · Asia/Saigon. Read-only source review; no source/public/config/AGENTS changes and no runtime pass claimed here. Root owns implementation and browser evidence.

Reviewed current AGENTS.md, common redesign conventions, plan §§11–13, R5.2/R6.1 handoffs, App/main, scroll/loading/Works stores, useSmoothScroll/useScrollProgress, Work/WorksConstellations/worksOrbit/CameraRig, Nav/MenuOverlay, Edura/i18n, SoundToggle/audio store, package/vite config. Applied task-listed gsap-react, gsap-scrolltrigger and accessibility guidance to lifecycle/focus review. No router dependency is currently installed; native History is sufficient for two document routes.

## Existing ownership and concrete source points

| Responsibility | Current source | Integration implication |
|---|---|---|
| Main composition / loading lock / scene | src/App.jsx:42–43, 67–68, 90–102 | Mount only main or reader. Reader must not instantiate smooth hooks, preloader, scene, or story content. Main restore should clear loading before mount. |
| Smoother create/revert | src/hooks/useSmoothScroll.js:8–28 | Existing matchMedia owns its single instance; unmount cleans it. Avoid a second scroll writer. |
| Visible scroll / story producer | src/3d/hooks/useScrollProgress.js:37, 42–51 | Capture visible smoother scrollTop, not native window.scrollY while smoother is active. storyManual protects restoration from normal producer. |
| Reflow / media restore | src/3d/hooks/useScrollProgress.js:72–99, 104–114 | Existing producer preserves chapter+progress through locale/resize/reduced changes. Restore coordinates must be measured against new layout. |
| Initial / native hash jump | src/3d/hooks/useScrollProgress.js:130–139, 153–154 | Initial and fonts-ready jumpHash seeks progress0. Popstate also seeks hash0. Saved mid-Works return must take precedence over these callbacks. |
| Focus entry into Works | src/components/Work.jsx:30–54 | Focus before chapter/scroll settles can schedule top-of-Works seek. Restore chapter/scroll first; then focus with preventScroll. |
| Transient owners cleaned | src/components/Work.jsx:57–63 | Unmount clears Hover/Focus. Capture before commit, and restore stable EDURA Selection rather than hoping hover survives. |
| Mutable orbit writer | src/3d/components/WorksConstellations.jsx:103–105; src/3d/utils/worksOrbit.js | Orbit is one existing mutable object. Preserve numeric phase/origin/velocity/latched/visited/captures/resumePending snapshot, restore into it, never create second controller. |
| Camera | src/3d/components/CameraRig.jsx:46–52 | Shared camera pose already derives chapter/progress/reduced/aspect. Restore story state and let sole CameraRig compute pose; do not directly write Three camera from route. |
| Hash history writers | src/components/layout/Nav.jsx:75; src/components/layout/MenuOverlay.jsx:107 | Existing pushState(null) must not inadvertently destroy restore state for retained entries. Reader anchor actions need /#id, not case-relative #id. |
| Metadata language writer | src/i18n/config.js:34–46 | applyLanguage always sets portfolio title/description. Route-aware metadata must update after locale switch and restore portfolio metadata on return. |
| Sound consent | src/components/ui/SoundToggle.jsx:13; src/stores/useAudioStore.js:32–35 | Unmount resets active audio while retaining saved muted preference. Do not auto-start on remount; direct reload still needs click consent. |

Line references describe the source read before root integration and can shift as the implementation changes.

## Required history and restoration invariants

1. **Real href:** EDURA CTA is an anchor /projects/edura. Intercept only a primary, unmodified, same-origin native click. Ctrl/Cmd/Shift/Alt, middle click, target=_blank, copy link and open new tab remain browser-owned. VERIS/VIE have no active link.
2. **Per-entry immutable snapshot:** Replace the current main history entry with a compact, serializable copy before pushing reader. Save visible scroll, story chapter/progress, EDURA selection, existing orbit scalars, focus origin and a validated entry identity. JSON snapshot must not share the mutating orbit reference. Do not persist stale element references or arbitrary state callbacks.
3. **Native Back remains native:** Browser popstate renders the requested route; never push inside popstate. history.length alone cannot identify a main predecessor (it may be another website). Return may back only when reader entry records a known immediately preceding main entry; otherwise navigate /#work. Do not manufacture a loop or trap outbound Back.
4. **Restore before release:** Publish saved story state with storyManual held and loading false before main mount. Wait for actual DOM/font/Smoother readiness, measure/seek, finish the existing Smoother scrub animation, then release the single producer. Initial/fonts-ready/hash callbacks must not replay #work progress0 over a saved position.
5. **Layout-aware:** Same viewport/locale preserves visible scroll within normal numeric tolerance. Case resize/locale/reduced changes should use saved semantic chapter+progress against fresh DOM ranges so the Works pose remains Works, rather than restoring stale pixels into Education/Experience.
6. **Focus last:** After Works is the producer-confirmed chapter, set stable EDURA Selection and focus #work-target-edura with preventScroll. Root chooses whether to restore CTA focus vs target; accepted prompt explicitly requests focus EDURA. Preserve focus ring and avoid Work focus-entry fallback scheduling an unwanted seek.
7. **Orbit continuity:** Restore same object scalars before the first active scene frame. EDURA selection pauses the existing writer, preventing phase drift during delayed focus. Camera gets the same story pose; responsive/reduced pose is derived by the shared function.
8. **Reader is a real alternative subtree:** Zero Canvas, zero Smoother, zero main ScrollTriggers or story ticker subscription while case is mounted. Let scoped contexts/unmount own disposal; do not globally kill unrelated GSAP state. Reader intro is scoped and already reduced-aware.
9. **StrictMode/idempotence:** Subscribe once per owner; cleanup popstate/hash/listeners/pending RAFs and late fonts promises. The first development effect cleanup must not advance history, reset snapshot, or send focus to a disconnected node.
10. **Direct entry/reload:** /projects/edura works from network, reload and cached SW navigation. Case scroll remains document-native. Return from a direct reader goes /#work with correct chapter/focus and skips preloader. Reader loaded externally must still let Back leave the website.
11. **Reader anchors:** Case navigation to About/Skills/Works/Contact points to real /#ids. Internal clicks use route handoff then measured jump; Ctrl/Cmd behavior remains native. Menu-open route change removes dialog lock/inert state and cancels pending menu close seek.
12. **SEO/locale:** Title/description/canonical/OG route values derive actual pathname and current locale, restored when going main. i18n languageChanged must not overwrite reader metadata with portfolio values. Unknown path handling must be explicit instead of claiming arbitrary pages as EDURA.
13. **PWA policy:** Existing selected three EDURA images only are in public (324276bytes); no research gallery is copied. Workbox navigation fallback serves index for case offline once SW/core is cached; keep asset fetches out of HTML fallback. Vercel fallback must preserve real static files and case image requests. No new router/framework is necessary.

## Targeted test matrix for root

| Entry / action | Expected result | Evidence to record |
|---|---|---|
| Works mid-progress, EDURA CTA pointer click | URL /projects/edura; same document; no heavy scene | href/pathname, snapshot visible scroll/chapter/phase, Canvas/Smoother/trigger counts |
| Works EDURA selection → native Tab/Enter CTA | Reader H1/main focus; keyboard remains native | activeElement and accessible names/focus ring |
| Ctrl/Cmd click / middle click / copied URL | New tab or native action; current Works unchanged | opener URL/history/phase snapshot; tab direct reader |
| Reader Back → Forward ×3 | Main exact snapshot; reader back without duplicate route listener | scroll/chapter/phase/focus; loading false; resource counts across cycles |
| Reader Return after Works | Same known main entry restored, not added loop | history entry identity and URL sequence |
| Direct reader from outside site → native Back | Browser leaves site | real previous page, no intercepted outbound Back |
| Direct reader Return / reader reload Return | /#work pose + EDURA focus; no intro | heading/selection/store/canvas; no loading lock/preloader |
| Main #work saved p>0 → Back | Restored p remains >0 after fonts-ready and >300ms refresh | sample at initial/300ms/1s, no hash0 overwrite |
| Reader scroll/reload / Back → Forward | Reader document scroll policy intentional | native scroll and saved case entry state |
| Reader Vi→En, resize1440→390, reduced toggle before Return | Main still Works, stable selection, layout-aware pose | chapterProgress/anchor/overflow/focus at both viewports |
| Route change while menu open / native Back hash route | Dialog closes and locks cleared | dialog.open, html stellar-menu-open, body loading-lock, smoother pause |
| Nav from reader / Ctrl-click anchor | /#requested section direct pose, no mandatory cinematic | href + currentSection/storyChapter/focus; modifier untouched |
| Sound ON main → reader → main/reload | No automatic replay/consent change | isMuted/isStarted/localStorage/audio context lifecycle |
| Build + preview /projects/edura network reload | Same SPA reader shell, 200 HTML; real images200 WebP | HTTP content type/path and page/error logs |
| SW-controlled offline /projects/edura | Reader/core and cached selected assets work; no network error page | navigator.serviceWorker.controller, offline asset response/cache provenance |
| Unknown/static asset URL | No accidental case route/HTML as image | route behavior, MIME/status |

Minimum responsive integration set: 390 and1440, Vi/En, reduced on/off. Source self-check should assert history snapshot finite/clamped fields and native click bypass; runtime evidence must prove restoration timing/resource teardown instead of replacing it with a source grep.

## Gaps / boundaries

This document is a design review, not an implementation acceptance. No browser route behavior has been measured by this agent yet. Root owns final build/lint/console and production preview/SW evidence. Real phone/OS reduced-motion and deployed public HTTPS remain separate limitations unless actually tested. Reader content/video/outcome gaps from R6.1 are unchanged and outside R6.2.
