# V7 — Works figures / interaction verification

09/10/2026. **Component V7 kiểm chứng xong; production projected-figure integration chờ V8.** Không sửa App, Lab, camera, progress/route stores, locales, BH hoặc asset V4. [Handoff](./handoff.md) có patch ref, focus restore và contract V9; AGENTS row để V8 append tuần tự theo V0.

## Kết quả

| Kiểm tra | Kết quả / bằng chứng |
|---|---|
| Build | PASS, 5.21s; [build.log](./build.log), PWA40 entries. Warning chunk lớn hiện có vẫn còn |
| Scoped lint ba file V7 | PASS, 0 errors/0 warnings |
| Lint toàn repo | PASS, 0 errors/2 warnings cũ SplashCursor; [lint.log](./lint.log) |
| Self-check | PASS; [check.mjs](./check.mjs), [check-results.json](./check-results.json) |
| Browser component | **42/42** nhóm kiểm tra; [browser-results.json](./browser-results.json) |
| Lifecycle/fallback/entry | **7/7**; [extra-results.json](./extra-results.json) |
| R6.2 reader/Back hiện tại | **2/2** tại390/1440 qua DOM fallback; [route-results.json](./route-results.json). Không coi là projected-figure end-to-end |
| Console/resources | Lượt component cuối0 error/0 response ≥400. Warning THREE.Clock cũ. Test asset-failure chủ động trả404 được ghi riêng, không coi là lỗi tải trong lượt bình thường |
| Ownership | [integrity.json](./integrity.json):23 protected files nguyên hash baseline; geometry ngoài artwork deep-equal HEAD; thay đổi V5/V6 được giữ |

Harness [qa.html](./qa.html) / [qa.jsx](./qa.jsx) chạy **chính component source** cùng một GalaxyScene, CameraRig priority−1, producer/useSmoothScroll của repo và stable layout ref. Không có renderer/camera/Works store thay thế. Browser plugin không tìm thấy Chrome executable; dùng Playwright runtime có sẵn với Microsoft Edge154.0.4258.62. Không cài dependency.

## Fit và projection

| Viewport CSS pixel | Scalar so với renderer cũ | Overflow | Overlap figure/panel | Interaction CLS / tổng CLS quan sát |
|---|---:|---:|---:|---:|
| 390×844 | 1.691× | 0px | 0 | 0 / 0 |
| 768×1024 | 1.490× | 0px | 0 | 0 / 0 |
| 1440×900 | 1.800× | 0px | 0 | 0 / 0 |
| 1920×1080 | 1.800× | 0px | 0 | 0 / 0 |

Desktop đạt ~1.8×; mobile/tablet giảm scalar để giữ tam giác, panel dưới và khoảng trống nhãn. Không ép1.8× khi hợp artwork+sao không fit. Self-check quét sáu pha idle/viewport, kiểm bounds trong khung, ba cặp không giao nhau và panel không che figure được chọn. Browser kiểm cả ba panel, không giao nhau với **bất kỳ figure nào**, stage height/scroll không đổi khi mở/chuyển panel.

Projected DOM region khớp renderer AABB trong<0.1 CSS pixel ở cả bốn viewport. Bounds là hợp tọa độ catalog/supporting stars và plane artwork đã calibrate, qua matrixWorld và camera thực; không hộp HTML đặt theo vị trí đoán. Scalar không đổi geometry/projection/relative positions. Vùng bấm luôn≥44×44px.

CLS probe bắt đầu sau fonts ready, ghi node/rect và trạng thái thao tác. Một lượt đầu phát hiện caption bị reset kích thước trong cleanup selection; đã giữ geometry styles qua selection và chỉ clear khi vào fallback. [cls-before-cleanup-fix.json](./cls-before-cleanup-fix.json) là evidence trước sửa, không phải lượt nghiệm thu. Lượt cuối không ghi layout-shift entry nào ở bốn viewport. Script vẫn ghi riêng live preference shifts nếu môi trường phát sinh; không che lỗi bằng overflow hoặc bỏ nguồn đo.

## Hành vi đã kiểm

- Ba figures luôn cùng hiện: EDURA/Centaurus, VERIS/Gemini, VIE/Cygnus. Artwork đúng asset V4, cùng group/basis/rotation/pose; opacity idle0.10, active0.30. Active lines0.65 và shader node/halo rõ; không composer mới.
- Native mouse vào figure → panel → CTA giữ cùng target. Native pointerleave timer ghi target còn ở~60ms, rời cả hai vùng thì đóng sau180ms. Click/tap pin; ra ngoài vẫn giữ pin; click nền/Escape clear. Rapid10 selections không bị owner cũ đóng panel mới.
- Native Tab/Shift+Tab: EDURA figure → reader CTA → Behance → VERIS. Escape đưa focus về background. Không focus trap hoặc tabindex dương. Native keyboard entry từ chapter trước seek Works, mở info và giữ figure focus.
- EDURA anchor giữ `/projects/edura`; Behance `_blank` + `noopener noreferrer`. VERIS/VIE không có anchor giả, vẫn coming soon. ID/metadata restore giữ nguyên.
- Pinned và hover-immediate handoff: capture một lần; finale forward→reverse→forward giữ origin/captures và pose. Quay về Works phục hồi selection/hover presentation, không nhảy góc; transient owners được kiểm lại theo focus/pointer. Deep jump finale mới dùng phase0 xác định. Không chụp mỗi frame/direction.
- Fresh reduced boot và live reduce/no-preference: orbit/pose tĩnh khi reduce, resume khi no-preference. Hidden simulated qua visibilitychange: phase không tiến. Đây là media/visibility kiểm chứng trình duyệt, **không tuyên bố OS hay thiết bị thật**.

## Render cost và cleanup

[extra-results.json](./extra-results.json) đo **413 rendered frames/2500.5ms =165.17 FPS** ở1440px, NVIDIA RTX4060 / ANGLE Direct3D11. Counter chỉ đếm frame có GL draw,0 empty frames;13662 draw calls (~33.08/frame) của **toàn GalaxyScene**, không lấy riêng useFrame callback làm FPS. Mẫu2.5s local không phải cam kết mọi GPU/mobile hardware.

Ba Canvas mount/unmount cycles:15 geometries/26 textures khi sống →0 geometries/0 textures sau teardown →15/26 khi remount. Buffers/materials/texture load late có dispose; pooled corners/vector/frame output tái dùng. Work giữ subscriber khi renderer unmount để controls fallback vẫn hiện; component cleanup gỡ callback/observer/timer.

Artwork404 test: scene sao vẫn hiện, ba semantic targets dùng được, art opacity0. Semantic fallback test clear projected transforms/width/height rồi restore khi scene hoạt động. Không làm scene boundary sập vì một SVG lỗi.

## R6.2 và giới hạn tích hợp

Native EDURA navigation/unmount reader/Back đã chạy trên App hiện có tại390/1440: reader0 Canvas/0 Smoother; Back1 Canvas, focus `work-target-edura`, snapshot chapter/progress/selection/orbit và y phục hồi. Đây là **controls fallback** vì V7 không được sửa App. `route-harness-module-mismatch.json` lưu lỗi probe ban đầu import store URL không trùng module HMR; script cuối import exact URL đã nạp, không dùng kết quả sai đó.

V8 còn nối ref vào App/Lab, chờ projected region ready khi focus restore và nghiệm thu luồng figure→CTA→reader→Back/Forward trên bản tích hợp; kiểm menu/locale/resize production. V9 nhận cùng `worksFigure`/basis/group và captured origin, không dựng controller mới. Resize trong finale và finale400vh/G2 không được xác nhận ở task V7.

Không publish/deploy, không chỉnh ảnh sản phẩm, không thay content/i18n. V8 nối notice attribution UI của V4; public attribution/asset hashes giữ nguyên.

## Screenshots

| Viewport | Idle | EDURA active | VERIS active | VIE active | Reduced |
|---|---|---|---|---|---|
| 390 | [idle](./idle-390.png) | [EDURA](./selected-edura-390.png) | [VERIS](./selected-veris-390.png) | [VIE](./selected-vie-390.png) | [static](./reduced-390.png) |
| 768 | [idle](./idle-768.png) | [EDURA](./selected-edura-768.png) | [VERIS](./selected-veris-768.png) | [VIE](./selected-vie-768.png) | [static](./reduced-768.png) |
| 1440 | [idle](./idle-1440.png) | [EDURA](./selected-edura-1440.png) | [VERIS](./selected-veris-1440.png) | [VIE](./selected-vie-1440.png) | [static](./reduced-1440.png) |
| 1920 | [idle](./idle-1920.png) | [EDURA](./selected-edura-1920.png) | [VERIS](./selected-veris-1920.png) | [VIE](./selected-vie-1920.png) | [static](./reduced-1920.png) |

## Chạy lại

Từ repo root, bật `npm run dev -- --host 127.0.0.1`, rồi:

```text
node outputs/visual-revision-2026-10-09/v7/check.mjs
node outputs/visual-revision-2026-10-09/v7/verify-browser.mjs
node outputs/visual-revision-2026-10-09/v7/verify-extras.mjs
node outputs/visual-revision-2026-10-09/v7/verify-route.mjs
npm run build
npx eslint src/components/Work.jsx src/3d/components/WorksConstellations.jsx src/3d/utils/worksOrbit.js
```

Không chạy build đồng thời với FPS sampling. Runtime Edge/Playwright paths trong script là môi trường local của lần đo; source/asset/report paths tính từ repo root.
