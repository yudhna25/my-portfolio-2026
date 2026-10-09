# R6.2 — PWA / deployment audit

09/10/2026 · Asia/Saigon · audit from task-start files, not a browser pass. Root integration agent owns source/config edits and final verification.

## Current facts and evidence

- `vite.config.js` uses VitePWA `registerType: autoUpdate`; `main.jsx` registers SW immediately. Fixed-dark manifest retains id/start_url/scope `/`, standalone, any orientation, four any/maskable icons, mono theme/background. No router dependency in `package.json`; no `vercel.json` existed at audit.
- Production Workbox navigation fallback already exists: installed `vite-plugin-pwa/dist/index.js:838` defaults `navigateFallback: "index.html"`; current R6.1 `dist/sw.js` registers `NavigationRoute(createHandlerBoundToURL("index.html"))`. This is existing behavior, not evidence that `/projects/edura` UI is wired yet.
- Existing glob `**/*.{js,css,html,woff2,webp,png,svg}` precaches 35 URLs from current build; the three EDURA files are `/projects/edura/overview.webp`, `problem.webp`, `solution.webp`, totaling 324,276 bytes, 1400×989. No research pack/gallery copied into public. R6.1 selected-assets/provenance preserves original bytes/color. Runtime same-origin image CacheFirst retains 64 items/30 days; Google Fonts styles SWR seven days, font files CacheFirst one year.
- Static HTML currently has homepage title/description/canonical/alternate/OG/Twitter metadata. `src/i18n/config.js` currently overwrites title/description with homepage copy on every language change. Route integration must resolve this coordination so reader metadata does not revert while selecting Vi/En.
- `pwa-inputs.json` records current input/SW hashes and capture timestamp; `sw-input.js` is the existing generated R6.1 SW. These are a fresh audit snapshot, separate from R6.1's verification, and must not be claimed as R6.2 final build.

## Minimal proposed changes

1. Keep native History integration; no framework/router dependency. For production Vercel, explicitly rewrite `/projects/edura` to `/index.html`. If trailing-slash URL is accepted by route matcher, include that exact route too. Avoid a `/projects/edura/*` rewrite swallowing the three image URLs or future static assets.
2. Workbox already has correct index navigation fallback. Keeping the verified default is sufficient; spelling `navigateFallback: 'index.html'` explicitly is also a small contract clarification. Optional exact root/reader allowlist can restrict fallback; no extra service-worker engine/cache library is necessary. Confirm final generated worker rather than trusting config alone.
3. Retain only three used case assets in public/precache. Current policy makes reader UI and all three case images available after successful SW installation, even before user scroll-loads each image. Uncached external links/media still require network. A first visit without a previously installed SW cannot open offline; this is the browser's initial-install boundary, not a fallback failure.
4. Root integration should update route title/description and canonical/OG/Twitter URL/labels together with language, then restore main metadata on return. Without prerender/server-rendering, raw HTML/no-JS social crawler metadata remains homepage; record that limit instead of claiming server-side case metadata.
5. Keep registration, dark bootstrap, icon manifest, Sound opt-in, existing core/offline asset rules intact. Reader must unmount main scene and smooth-scroll producer; PWA checker verifies zero reader Canvas and one main Canvas after offline navigation, route checker owns detailed cleanup/history restoration.

## Prepared production-browser check

`verify-pwa-browser.mjs` is output-only; installed Edge154 + bundled Playwright, no browser or dependency installation. Run only after root builds final source and starts production preview:

```powershell
node outputs/redesign/r6.2/verify-pwa-browser.mjs http://127.0.0.1:4173
```

- Assert final SW includes index/manifest and precisely three case WebP entries, navigation fallback, and original public image hashes.
- Desktop1440/mobile viewport390 load `/projects/edura` directly and reload under active SW; wait for images/fonts and inspect parsed manifest/cache URLs.
- Disable browser HTTP cache, set actual network offline, prove uncached fetch fails, then reload reader: HTTP200 from SW, all three images byte-identical and decoded, zero Canvas/overflow.
- Navigate offline to `/#work`: main HTML also from SW, core About/Works/Contact DOM present, one main Canvas and no loading lock. Record page exceptions, console messages, all failed requests and response SW provenance.
- Save `pwa-browser-results.json` plus actual desktop/mobile offline reader screenshots. Network probe failures are deliberately induced and will be reported separately; any unexpected first-party failure or exception needs review.

Browser preview proves local SPA fallback and generated SW behavior; deployed HTTPS/Vercel server itself, phone GPU/OS installation and no-JS crawler rendering are not tested by this script. Existing native Browser plugin can remain unavailable while installed Edge provides real production render/interaction evidence.

## Status

Audit and checker preparation complete. Final root source/build/browser checks pending; this file makes no route/offline/installability pass claim before they run.
