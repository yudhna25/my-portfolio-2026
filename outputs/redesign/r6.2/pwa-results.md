# R6.2 — independent PWA / Sound verification

09/10/2026 · Asia/Saigon · frozen production source v2. Installed Edge154.0.4258.62 / existing bundled Playwright, local preview `http://127.0.0.1:4173`. No source/public/config/AGENTS changes by this audit agent.

## Production offline / SW

`node outputs/redesign/r6.2/verify-pwa-browser.mjs http://127.0.0.1:4173` — **PASS desktop1440×900 + simulated mobile390×844**. Raw evidence `pwa-browser-results.json`; actual screenshots `pwa-offline-case-desktop.png`, `pwa-offline-case-mobile.png` (mobile image opened and visually inspected).

- Built worker SHA256 **874f962d697c2e070df7a73678518e84618b5d318f91f2422da2bcbb93e3e9b7** matched `dist/sw.js` after tests;35 precache entries. Index/manifest and all35 entries present in actual browser caches. Generated navigation fallback binds to `index.html`; manifest parsed with errors `[]`.
- Direct `/projects/edura` and reload render real case. Disable HTTP cache and network, prove a fresh uncached first-party probe fails, then reload: document HTTP200 **from Service Worker**, reader contains0Canvas, overflow0; allthree original image hashes verified offline and decode1400×989.
- Navigate offline `/#work`: document HTTP200 from Service Worker, allseven main sections present, one Canvas, no loading lock. Homepage title restored. Detailed Works focus/pose restoration belongs to root route matrix; this SW checker stops after core scene availability and does not infer focus timing from its early snapshot.
- Case image URLs are exactly three; no26-image research gallery included. Their total324276bytes: overview92204/problem135960/solution96112. CacheFirst runtime image policy remains30days/64entries; installed SW precaches case images and core UI before they are needed offline.

### Raw errors and font limitation

**0 application exceptions,0 unexpected first-party failed resources. Raw offline console is not zero.** Both viewport contexts report:

1. Deliberate uncached probe `r62-uncached-network-probe.txt`: `ERR_INTERNET_DISCONNECTED`, expected proof that network is disabled.
2. Existing external Google Fonts stylesheet `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap`: `ERR_FAILED` on offline reader and main. Five `fonts.gstatic.com` WOFF2 resources cached online, but no Google Fonts CSS entry among40 cache URLs. Core locally bundled Unbounded/font fallback remain available; screenshot shows readable fallback, not identical body typography.

The installed Workbox `CacheableResponse.js:84–85` admits only configured statuses. Current Google CSS rule uses `[200]`; opaque cross-origin CSS response caching may require0. Report this as the observed existing external-resource gap; the audit agent did not change cache source/config or hide log entries. Root integration decides whether to fix narrowly or retain this limitation and evidence.

## Native Sound continuity

`node outputs/redesign/r6.2/verify-sound-route.mjs http://127.0.0.1:4173` — **PASS,13 state records**, `sound-route-results.json`.

- Direct reader before consent: switchOFF,0AudioContexts. Trusted native click enables one running AudioContext and persists isMutedfalse.
- Return to main, then three native **Tab/Enter case actions + pointer Return** cycles keep the same document and exactly one original running AudioContext. Preference and switchON remain; case has0Canvas, main1Canvas.
- Full reader reload with storedON creates0AudioContexts and displaysOFF until a fresh trusted click; per-document opt-in preserved. New trusted click enables sound. Mute suspends that context; returning to main preserves muted storage and the same suspended context.
-0 application/console errors. Warnings are explicitly blocked SW in this isolated Sound context plus existing THREE.Clock deprecation. SW itself was separately tested with registration allowed above.

Earlier diagnostic runs retained under `sound-route-*-failure.json` / `sound-route-pointer-race.json`: unconditional click toggled already-selected EDURA off; immediate pointer actions raced unfinished layout/restore; main Sound button was auto-hidden by normal Nav behavior. Final checker opts-in on visible reader Nav, awaits fonts/singleCanvas plus800ms before repeated keyboard case actions. No force clicks/source patches used. Root's independent full route matrices own completed pointer click evidence; these earlier Sound diagnostics alone do not establish an application defect.

## Deployment / policy / limits

Final config explicitly states Workbox `navigateFallback: 'index.html'`. `vercel.json` rewrites exact `/projects/edura` and trailing-slash form to `/index.html`, preserving `/projects/edura/*.webp` files. Route-aware i18n metadata updates title/description/canonical/alternates/OG/Twitter and homepage restoration; route matrix verifies locale transitions.

Offline policy: after a successful SW install, core portfolio, EDURA reader and the three selected case images work offline. Uncached external links/media and a first-ever visit without installed SW need network; external font CSS fidelity gap noted above. Native history/back/scroll/selection/pose/resource cleanup are covered by the root route checker, not replaced by this PWA script.

Not checked here: deployed HTTPS/Vercel rewrite behavior, a real installed desktop/mobile app, physical phone/SPL/thermal performance, OS reduced-motion, server prerender or no-JS social crawler metadata. Client metadata updates do not change the static raw HTML returned to such crawlers. No dependencies, gallery copies, new routes beyond EDURA, deployment or external publishing added by this audit.
