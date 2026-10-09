# R6.2 — EDURA route / restore verification

Ngày: 09/10/2026 (Asia/Saigon). **PASS trong phạm vi R6.2 local production preview**, với giới hạn offline font bên ngoài/deployment bên dưới. Không thực hiện R7/R8.

## Kết quả

- EDURA dùng link thật `/projects/edura`, normal click/Tab+Enter chuyển route cùng document. Ctrl-click mở tab mới reader độc lập; direct/reload reader và trailing-slash SPA fallback có cấu hình rõ. VERIS/VIE vẫn pending, Behance phụ.
- Back/Forward/Return giữ scroll, selection EDURA, phase đã chụp và pose suy từ contract; focus về `work-target-edura`, không replay intro/meteor/portal. Case đã vào từ Works rồi reload vẫn Return về entry đó. Direct reader Return tới `/#work`; native Back vẫn đi ra document trước ngoài website.
- Reader: 0 Canvas, 0 Smoother, 0 ScrollTrigger, 0 frame subscribers của scene cũ; geometry/material được dispose và GL resources về 0. Main: một Canvas và một camera writer. Ba vòng route không tăng listener/trigger.
- Route/lang cập nhật title/description/canonical/alternate/OG/Twitter, trả lại metadata portfolio khi về main. Nav/Menu/skip/focus và Sound opt-in dùng chung; menu reader → About đóng sạch, không lock cuộn.
- SW thật tải reader và ba ảnh gốc từ cache offline khi HTTP cache tắt; main core `/#work` cũng tải offline. Precache không kéo thêm gallery: đúng ba ảnh R6.1, tổng 324276 bytes.

## Source / baseline

Baseline mới được chụp trước R6.2 ở `baseline.json` và `before/`, 103 file. Final `integrity.json`: 93 file giữ hash, 10 file sửa, thêm `useRouteStore.js` và `vercel.json`; không file cũ mất, không đổi dependency, assets/shaders/camera/main/SW registration giữ nguyên. HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb` và staged diff giữ nguyên. AGENTS được append đúng một dòng khi chốt.

Phạm vi sửa: App tách lifetime portfolio/reader; route store native History; producer nhận snapshot/ownership listener; Work CTA thật + focus scrub guard; Nav/Menu dùng route chung; reader dùng global Nav; locale/config có metadata route; explicit Workbox fallback và hai Vercel rewrites. Không thêm router/framework hoặc camera writer.

`readMainSnapshot` có validation finite/range/chapter/selection/orbit/pose. Same-entry sync được chặn để popstate/hashchange không restore hai lần. Settle muộn bị hủy khi có input mới. `getTween()` trên mobile có thể trả giá trị không có `.progress`; App và Work đã kiểm method trước khi hoàn tất scrub.

## Lệnh / bằng chứng

```powershell
npm run dev -- --host 127.0.0.1
npm run build
npm run lint
npm run preview -- --host 127.0.0.1
node outputs/redesign/r6.2/check-route.mjs
node outputs/redesign/r6.2/verify-route-browser.mjs http://127.0.0.1:5173
node outputs/redesign/r6.2/verify-route-browser.mjs http://127.0.0.1:4173
node outputs/redesign/r6.2/check-results.mjs
node outputs/redesign/r6.2/verify-pwa-browser.mjs http://127.0.0.1:4173
node outputs/redesign/r6.2/verify-sound-route.mjs
```

- `build-final.log`: PASS 6.52s, `dist/sw.js`/manifest sinh đúng; 35 precache entries, 2756.81 KiB. Còn chunk warning >500KB từ runtime hiện có.
- `lint-final.log`: 0 errors, 2 warnings cũ ở SplashCursor inline class. Không issue mới.
- `check-route.mjs` / `integrity.json`: 13 asserts runtime validation/idempotence/modified clicks; hash/locale parity/nội dung R6.1/HEAD/staged/AGENTS preservation pass.
- `browser-route-results.json`: dev 8 cấu hình 390/1440 × Vi/En × normal/reduced, thêm direct/reload/menu/outbound Back; 53 snapshots, PASS.
- `production-route-results.json`: compiled cùng 8 cấu hình + nhóm direct/reload/menu/outbound Back; 53 snapshots, PASS. Cả hai có native Tab+Enter/Back/Forward/Return; 1440 Vi normal thêm 3 pointer route cycles, Ctrl-click/tab mới và case reload→Return.
- `results-summary.json`: 106 snapshots, 0 overflow, 0 page exceptions/console errors/first-party failed responses online. Scroll error tối đa dev 0.002422px, compiled 0px. Store/camera/phase exact kiểm ở dev; compiled kiểm DOM/history/scroll/GL calls, không giả inspect source store qua minified bundle.
- Dev lifecycle high desktop: 17/17 geometry và 25/25 material dispose, frame subscribers 0; GL Buffer/Texture/Framebuffer/Renderbuffer/Program/Shader live đều 0 trong reader. Window/document listeners main 37/21 → reader 21/12, giữ ổn định qua 3 vòng. Main triggers 8 → reader 0, quay lại 8. Default GL resources được giải phóng khi context lost cũng được đếm, không giả mọi tài nguyên đều gọi delete riêng.
- `sound-route-results.json`: PASS, 13 records, trusted opt-in; cùng AudioContext running và preference ON qua 3 Tab/Enter→Return cycles; reload case với ON đã lưu vẫn 0 contexts/aria OFF cho tới trusted click; mute/suspend giữ khi Return. 0 page/console error mới.
- `pwa-browser-results.json` / `pwa-results.md`: SW build SHA256 `874f962d697c2e070df7a73678518e84618b5d318f91f2422da2bcbb93e3e9b7`; desktop 1440 và touch viewport 390 direct/reload/offline HTTP cache disabled. Navigation và ba ảnh trả 200 từ SW, hash đúng/decode thành công; probe chưa cache thất bại chứng minh mạng thực sự offline. Reader 0 Canvas; offline main có 1 Canvas/core DOM/không loading lock.

Ảnh render thật nằm trong `screenshots/` (32 reader/restored desktop/mobile/locale/motion frames) và `pwa-offline-case-{desktop,mobile}.png`. Đã mở xem reader 390/1440 và Works restored 1440: Nav/Return không đè nội dung, vùng đọc rõ, ảnh màu giữ nguyên, không overflow. Những ảnh này là browser production/app render, không storyboard.

## Failures đã xử lý / giới hạn

- Failure mobile `.progress is not a function` là lỗi source thật đã sửa ở toàn bộ hai callers; giữ `browser-route-mobile-getTween-first-failure.json`. Final source v2 đóng băng suốt ma trận.
- Harness đầu thử click Nav khi nó đã auto-hide: không force click, sửa harness bằng native wheel lên rồi menu; giữ `production-route-first-failure.json`. Các diagnostic Tab/selection/external-SVG và Sound sequencing/pointer race được giữ riêng. Final Sound dùng fonts + 800ms readiness và native Tab/Enter; final route matrix độc lập vẫn pass 3 pointer cycles.
- Online warnings: THREE.Clock deprecated cũ; compiled route fixture chủ động block SW nên có warning registration blocked. SW được kiểm riêng trong context cho phép registration thật.
- **Offline console không hoàn toàn sạch**: probe cố ý lỗi, và Google Fonts CSS cũ (`Space Grotesk`/`JetBrains Mono`) có thể chưa runtime-cache nên request báo ERR_FAILED. Local Unbounded/core vẫn precached và nội dung/ảnh đọc được qua fallback fonts. Không đổi policy/font source ngoài phạm vi route và không gọi đây là 0 offline console error. Chi tiết URL/phase nằm trong PWA report.
- Browser plugin trước đó không khởi động trusted runtime; dùng Edge 154.0.4258.62 và Playwright đã có sẵn để kiểm render/native input thật. Không cài browser/thư viện mới. Mobile/touch/OS reduced-motion là emulation trên desktop; chưa đo điện thoại thật/thermal/FPS trong task này.
- Chưa deploy Vercel/public HTTPS hoặc thử cài PWA native; chỉ xác minh cấu hình rewrite và local production SPA+SW. Client metadata không phải SSR metadata cho crawler không chạy JS. Visit đầu chưa có SW/cache vẫn cần mạng; external Behance không thuộc offline core.
- R6.1 vẫn thiếu walkthrough/detailed flow/system/outcome có bằng chứng; R6.2 không tự bổ sung nội dung. Bàn giao `handoff.md` cho R7/R8, không chạy task tiếp.
