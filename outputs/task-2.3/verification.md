# Task 2.3 — Nav

## Scope

- Migrated WIP `src/components/Nav.jsx` to named `Nav` at `src/components/layout/Nav.jsx` (plan 6.1).
- App retains Nav outside `#smooth-wrapper`; `#smooth-content` now accepts skip-link focus.
- Nav uses i18n `nav.*` in Vi/En, `useScrollStore.currentSection`, existing central GSAP registration, ScrollToPlugin + numeric ScrollSmoother.offset coordinates.
- Glass: rgba(5,5,5,.55), blur(12px), white border 8%; Unbounded logo, Space Grotesk 14px uppercase/tracking; no glow/accent/progress bar.
- One owned ScrollTrigger, >80px down hides -100%, up shows. Keyboard focus reveals immediately and holds Nav visible. Reduced motion keeps Nav visible and jumps scroll without animation. useGSAP/contextSafe own cleanup.
- MenuOverlay is not implemented. `onMenuClick` is the explicit connection point; the WIP button announces disabled until supplied.
- `availableSections` is an explicit WIP list in App: about/work/education/contact. User confirmed keeping all seven links and disabling the three missing targets. Skills/Experience/Playground are displayed with aria-disabled and skipped in the tab order, because those sections do not exist. Removing this prop enables all seven once mounted. Section order and contents are unchanged.

## Verification

- `npm run build`: PASS (Vite + PWA). Existing GalaxyScene chunk-size warning remains. Full output: build.log.
- `npx eslint src/components/layout/Nav.jsx src/App.jsx`: PASS. Full `npm run lint`: unchanged baseline 1 error/2 warnings; lint.log.
- Reused running Vite dev server at http://localhost:5173/; real App and fixture both load.
- Browser normal fixture: 13/13 PASS (`normal-checks.json`), including 60/200px threshold, scroll-up reveal, all seven actual link clicks, offset 80px, store-driven active link, home and skip.
- Browser reduced-motion fixture: 13/13 PASS (`reduced-checks.json`), zero owned hide trigger, immediate navigation, visible Nav. Preference simulated before imports; no physical OS setting was changed.
- StrictMode cleanup/remount: 6/6 PASS (`lifecycle-checks.json`); peak one owned hide trigger, zero owned window scroll tweens after unmount. Live preference normal → reduced → normal: trigger count 1 → 0 → 1; Nav y=0.
- Responsive: 1024px desktop (client width 1014 due scrollbar), both Vi/En fit; En first link x=390, logo end x=134, last link end x=982. Mobile 390/320: desktop links hidden, menu 44×44, no header overlap. Menu callback invoked twice by click and Enter with focus outline 2px (`responsive-checks.json`).
- Real WIP App: Về tôi top≈79.59 / Dự án≈80.28 / Học vấn≈79.69 px; store highlight matches each. Liên hệ top≈112.12px is correctly clamped at page bottom; contact highlight correct. No DOM section was reordered.
- Native Tab from hidden Nav revealed y=0 instantly, focused Học vấn with 2px focus-visible outline; next Tab skipped unavailable targets and focused Liên hệ. Enter navigated both. Mobile native first Tab exposed skip link at top=12px, Enter focused `#smooth-content`.
- Steady dev console: 0 errors on App and fixture. Existing THREE.Clock deprecation and GSAP `scale not eligible for reset` warnings from WIP remain (`console-home.json`); fixture has zero errors/warnings (`console-qa.json`). The old tab briefly logged a missing old Nav module during file migration/HMR; a fresh App session verified the final import path cleanly.
- No JSX inline styles, new plugin registration, red accent, glow or old progress bar in Nav. GSAP writes its runtime transform as expected. New nav keys match Vi/En.
- Screenshots: mobile.png plus final desktop.png. Browser viewport overrides restored.

## Limits

- The exact glass/gray specification has insufficient inactive-text contrast on the current cream WIP sections. No palette or opacity was changed. Keyboard/active/focus states are white; the intended #050505 scene backdrop gives gray text approximately 7.1:1. This is not a whole-page WCAG AA claim.
- In-app Browser throttles RAF in background. The isolated QA page disables GSAP lag smoothing only in the fixture and waits for actual DOM poses. Production Nav/GSAP settings are unchanged. Native input was also checked on the real App.
- Existing repo lint baseline: one Work.jsx react-hooks/refs error, two SplashCursor.jsx unsupported-syntax warnings. Existing THREE.Clock warning belongs to Fiber/Three; existing scale/reset warnings belong to WIP GSAP effects.

## Reference

GSAP docs used to verify numeric offsets under transformed content:
- https://gsap.com/docs/v3/Plugins/ScrollSmoother/offset()/
- https://gsap.com/docs/v3/Plugins/ScrollToPlugin/
