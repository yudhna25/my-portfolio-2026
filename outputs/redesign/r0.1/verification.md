# R0.1 — Baseline audit cho redesign Stellar Odyssey

**✅ Audit R0.1 hoàn thành. Ứng dụng chưa được redesign.** Bắt đầu 07/10/2026, hoàn tất/bàn giao 08/10/2026 theo Asia/Saigon. Không thực hiện R0.2/R0.3.

Đầu ra chính: [baseline.json](baseline.json), [inventory.md](inventory.md), [working-tree.txt](working-tree.txt). Đọc plan mới mục 1–2, 12–15, AGENTS hiện tại, quy ước prompt và report phiên lập kế hoạch; source được đọc trực tiếp để tránh dùng thông tin phase cũ như trạng thái hiện tại.

## Bảo toàn phạm vi

- Snapshot mới có **92 file** src/public/index/vite/package manifests và lock, kèm bytes/SHA-256. Branch `feature/stellar-odyssey`, HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb`.
- Working tree sẵn có 16 mục tracked thay đổi và 34 entry untracked ở mức hiển thị thư mục; gồm staged deletions và nhiều source chưa commit. Không sửa/reset/restore/stage các thay đổi này.
- [check-baseline.mjs](check-baseline.mjs) kiểm hashes, tập file, HEAD/index status và prefix AGENTS. Kết quả cuối ở [source-integrity.json](source-integrity.json): 92/92 giữ nguyên, không thêm/xóa source trong protected scope; AGENTS chỉ append dòng tiến độ R0.1, giữ nguyên 39916 byte cũ.
- Chỉ thêm artifact audit trong outputs, append AGENTS và tái tạo dist bằng build. Không sửa source/public/dependency/config, tạo abstraction, cài plugin/package, commit hoặc deploy.

## Build và lint baseline

| Lệnh | Kết quả | Bằng chứng |
|---|---|---|
| `npm run build` | Exit 0; Vite báo 9.54s, wall 22.122s; dist/sw.js và manifest.webmanifest tạo thành công | [build.log](build.log), [build-result.json](build-result.json) |
| `npm run lint` | Exit 0, **0 errors / 2 warnings** | [lint.log](lint.log), [lint-result.json](lint-result.json) |
| `node outputs/redesign/r0.1/browser-baseline.mjs` | Exit 0; 10 pose, 8261 StarField draw submissions, không pageerror/consoleerror/request ≥400 | [browser.log](browser.log), [browser-results.json](browser-results.json) |
| `node outputs/redesign/r0.1/check-baseline.mjs` | Hash/tập file/HEAD/tracked status/AGENTS prefix pass | [source-integrity.json](source-integrity.json) |

Build và lint chạy đồng thời; wall time này không dùng làm benchmark so với build độc lập của phase trước. Build hiện có chunk warning >500kB: index khoảng 550.24kB và events khoảng 920.22kB minified. PWA precache lần build mới: **29 entries, 2226.05KiB**, khác số 33 trong báo cáo 4.7 cũ vì source/build hiện tại đã đổi qua các phase sau.

Hai warning lint đều ở `src/components/SplashCursor.jsx:149,175`, rule `react-hooks/unsupported-syntax` do class khai báo trong component. File này không có caller App hiện tại; chưa sửa warning trong audit.

## Browser thực tế và phương pháp đo

Browser connector Chrome không tìm được Chrome stable executable. CUA lỗi runtime `MXC launcher: enumerate MXC volume G:\ … os error87`. Không cài/sửa connector. Dùng **Edge đã cài + Playwright bundled** theo workflow QA có sẵn trong outputs; Browser vẫn được kiểm bằng render thật.

- Production preview: `http://127.0.0.1:5191/`, build mới. Edge headless **154.0.4258.62**, Windows, ANGLE/D3D11 **RTX 4060**, driver 32.0.16.1047. WMI reported desktop 1920×1080/refresh 164Hz; không dùng thông tin này để khẳng định giới hạn refresh của mọi thiết bị.
- Desktop: viewport 1440×900, deviceScaleFactor 1, Canvas 1440×900/DPR 1, high 24000 sao. Mobile viewport: 390×844, deviceScaleFactor 3/touch/mobile emulation, Canvas 390×844/**DPR thực 1**, low 1500 sao. Cả hai chạy cùng GPU desktop.
- Dark storage trong context tách biệt, reduced-motion được **emulate no-preference** cho phép đo cảnh động. Không sửa setting OS/profile/browser tabs của người dùng.
- Hook `WebGL2RenderingContext.drawArrays` chỉ trong realm kiểm chứng để ghi timestamp POINTS count 24000 hoặc 1500 của StarField. Mỗi pose đếm khoảng 825–827 lượt/5s, tính FPS theo khoảng giữa mẫu đầu/cuối và p95 frame interval. Count 39/144/150 của constellation/meteor/wake cùng số mẫu, không dùng chúng để tăng số FPS. Đây là **draw submission cadence**, không chỉ rAF và không phải đo GPU completion/presented frames.
- Camera đặt pose bằng native wheel, chờ settle, chuột ở góc trước screenshot/measurement. Đo **đứng yên tại section với scene động**, không phải benchmark đang cuộn/lens active/resize. Không dùng kết quả này kết luận redesign hoặc điện thoại thật đạt mục tiêu.
- Context đo chính chặn Service Worker để tránh cache build cũ; warning “Service Worker registration blocked by Playwright” là cấu hình harness. Context bổ sung cho phép SW và xác nhận registration active/control hiện tại; chưa audit offline/installability lại.

## 10 pose và số đo

| Pose | Desktop FPS / p95ms | Mobile viewport FPS / p95ms | Ảnh |
|---|---|---|---|
| Hero | 165.00 / 6.30 | 165.01 / 6.30 | [desktop](desktop-hero.png), [mobile](mobile-viewport-hero.png) |
| About | 165.00 / 6.30 | 165.01 / 6.30 | [desktop](desktop-about.png), [mobile](mobile-viewport-about.png) |
| Skills | 165.02 / 6.20 | 165.00 / 6.30 | [desktop](desktop-skills.png), [mobile](mobile-viewport-skills.png) |
| Works | 165.01 / 6.20 | 165.01 / 6.30 | [desktop](desktop-work.png), [mobile](mobile-viewport-work.png) |
| Contact / transmission | 165.01 / 6.20 | 165.00 / 6.30 | [desktop](desktop-transmission.png), [mobile](mobile-viewport-transmission.png) |

Đã mở/xem cả 10 ảnh. Tất cả pose có 1 Canvas, document visible, overflow ngang đo được 0px. Desktop có 2 cockpit visible/1 lens DOM; mobile có 0 cockpit visible/0 lens DOM, ThemeToggle mobile vẫn hiện. Đây không phải ma trận responsive/a11y đủ 6 viewport hoặc đo CLS.

Các snapshot mobile có phần cuối section trước còn trong khung. Native wheel trong touch emulation dừng với sai lệch target 30–212px; lưu scrollY/section rect/target trong JSON, không coi ảnh này là kiểm chứng anchor Nav chính xác. Snapshot vẫn ghi đúng khu vực được yêu cầu. Không có lỗi page/console mới; warning ứng dụng còn **THREE.Clock deprecated**.

## Quan sát bổ sung và hạn chế đã phân loại

[additional-browser-observations.json](additional-browser-observations.json) / [ảnh saved-light + reduced](desktop-saved-light-reduced.png): context riêng lưu light rồi load → html theme light, meta #FAFAFA, body rgb250. Với reduced media true/lens 0, vẫn 363 StarField submissions trong 2.2s: freeze appearance chưa dừng GPU rendering. Đây là hành vi baseline cần task sau xử lý, không phải “reduced-motion không được hỗ trợ”.

Các gap lớn đã chỉ owner trong [inventory](inventory.md):

- Hố đen lớn/2 Nebula/4 chòm cũ hiện ngay Hero và Skills. Contact disk/frame lớn sáng qua lớp kính; chưa có portal/finale/visibility theo chapter mới.
- Camera dùng global fraction, contactProgress + zoffset/intensity cũ và damping xy/z riêng; R2 cần contract một producer/progress/pose shared để đảo chiều đúng. Lab dùng useLabScroll, chưa có smooth-content cho anchor.
- Avatar có alpha nhưng vòng/halo xanh/trang trí đã nhúng trong file; pr.png là Resolve, chưa đúng Premiere. Chân dung và ảnh sản phẩm phải giữ màu gốc theo plan.
- VERIS cover không khớp mô tả social/feed/privacy trong data/locales; EDURA source pack chưa đầy đủ và claim/outcome cần thẩm định. Không tự sửa copy hoặc suy diễn hiệu quả sản phẩm trong audit.
- Cover intrinsic sizes 1600×1131/1600×900/1600×900 khác attrs 1600×1000 ở Work. Source copy email báo success ngay cả khi clipboard bị từ chối hoặc không có API; timeout chưa cleanup. Các gap này được phát hiện bằng decode file/đọc source, chưa chạy test clipboard/CLS.
- EDURA action thật hiện mở Behance _blank; VERIS/VIE disabled. /projects/edura HTTP 200 cùng HTML main là fallback, chưa route case/Back restore. SW registration/control hoạt động ở probe, chưa có bằng chứng offline case/installability public.

Các giới hạn công cụ được báo trung thực: không đo điện thoại thật/nhiệt/loa, browser khác, native OS motion, full keyboard/screen reader/contrast, hover lens FPS/scroll FPS, offline PWA/HTTPS public, lifecycle/GPU disposal toàn ma trận. Đây không phải DoD của R0.1; chúng được giao R2/R8. Không dùng ảnh/số 165FPS của baseline để ghi redesign PASS hoặc NASA 100%.

## Skills áp dụng và bàn giao

- `gsap-performance`: audit transform/opacity/quickTo và cleanup; phát hiện cockpit tạo tween theo mỗi progress/render dù CSSẩn, phân biệt render idle với scene static.
- `threejs-fundamentals`: lần theo owner camera, coordinates/camera matrix/HDR target/composer, quality/DPR/dispose và anchor projection. Giữ một Canvas/owner, không tạo renderer mới trong audit.
- Ponytail full: dùng Edge/Playwright/Node/ImageMagick đã cài, source check nhỏ, không cài dependency hoặc dọn code khi audit. Skill/plugin: [Ponytail SKILL.md](C:/Users/PC/.codex/plugins/cache/ponytail/ponytail/4.13.0/skills/ponytail/SKILL.md).

R0.2/R0.3 đủ điều kiện bắt đầu chuẩn bị asset/content từ snapshot+inventory này; không tự khởi chạy trong phiên R0.1. Hai output riêng có thể song song, còn App/scene/camera/store/locale và append AGENTS do một integration owner ghi tuần tự. Chưa triển khai hiệu ứng, chưa deploy.
