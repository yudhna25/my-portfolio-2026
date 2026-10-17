# Verification — formation / intake, 13/10/2026

Bản thực thi Q1 A / Q2 A / Q3 B; chờ duyệt visual G1/G2. **Chức năng đã được kiểm; độ mượt intake trên Intel UHD 630 còn là giới hạn**, không báo performance gate pass. Các báo cáo lượt trước chỉ là lịch sử, không được dùng làm số đo phiên này.

## Phạm vi và build

- `baseline.json`: 117 hash source/public/package/config ở đầu phiên, trên working tree đã có thay đổi lượt hai.
- `scope.json`: 15 file sửa, 2 file nguồn mới, 102 file giữ nguyên so với baseline. Hero/PortalHeading/About, Experience path, Works, Education, assets, locales, quality, stores và producer giữ hash.
- `build-source.json`: 119 source/asset/config hash và 45 dist hash của bản kiểm cuối.
- `npm run build`: pass, Vite 7.3.6, 1.871 modules, 5,55 giây; PWA 40 precache entries. Còn warning chunk >500 kB đã có.
- `npm run lint`: 0 errors, 2 warnings cũ ở SplashCursor (class trong component). `git diff --check` pass; Git báo đổi EOL ở vài file, không có whitespace error.
- Browser còn warning THREE.Clock đã deprecated từ thư viện. Service Worker được chặn có chủ đích trong QA để luôn đọc build hiện tại.
- Không thêm dependency. Không commit, push hoặc deploy.

## Kiểm chức năng

| Phép kiểm | Bằng chứng | Kết quả |
|---|---|---|
| Hàm pose/particle, finite/safe radius, endpoint opening 5 viewport, seed/reverse, comet sample index | `math-results.json` | 22.060 asserts pass |
| Portal, Hero/comet tại 390×844, 1440×900, 1920×900; reverse, hold, rapid reverse, About thật, motion cycles | `browser-results.json` | 225 checks pass, 0 console/page errors; 119 source hashes trùng bản cuối |
| Vi/En, menu Tab/Escape, resize 390↔1440, EDURA Back và Lab | `extras-results.json` | 49 checks pass |
| Font chậm, font lỗi, watchdog, WebGL bị tắt và reduced-motion | `opening-fallback-results.json` | 7 trường hợp pass; 19 console messages của lỗi được chủ động tạo, 0 lỗi ngoài dự kiến |
| Ẩn tab giữa opening + resize; live reduced-motion rồi bật lại | `opening-lifecycle.json` | 2 trường hợp pass |
| Ảnh opening chạy tự nhiên | `opening-capture.json` | 9 checkpoint từ p≈0,08 tới 0,99; không seek timeline |

Các mốc portal kiểm tới/lùi: 0 / 0,025 / 0,06 / 0,12 / 0,20 / 0,25 / 0,34 / 0,44 / 0,47 / 0,50 / 0,70 / 0,94 / gần 1. Camera reverse cùng p sai lệch dưới 0,035 world unit do tolerance producer. Khi producer dừng hẳn, camera và chuỗi path hạt trùng chính xác. Ambient sao/glitch vẫn có clock riêng, không coi khác biệt ambient là lỗi reverse.

Opening endpoint được đo bằng uniform HDR thật so với final-O DOM anchor: center error dưới 1 px (mẫu thực khoảng 0 tới 5,7e−14 px), radius ratio = 1, `uOpening.active=0` sau hoàn tất. Các trường `ring` cũ trong observer không còn áp dụng và để null; không dùng chúng làm bằng chứng nối cảnh.

Reduced-motion không tạo pool hút, portal còn xấp xỉ 1 viewport; chuyển live không kẹt loader. Font lỗi dùng font fallback vẫn đọc được 2026; WebGL lỗi dùng scene tĩnh. Đây là fault injection/media emulation, không phải thiết bị/OS thật.

## Lifecycle, kiến trúc và lỗi đã sửa

Một Canvas gắn DOM, một CameraRig writer và một producer hiện có. Formation bổ sung vào HDR pass/target của BlackHole; không có renderer/composer thứ hai. Canvas2D dùng lấy mẫu chữ chỉ là phần tử detached, không gắn trang và không chạy theo frame. Pool SVG dùng seed cố định, inert/aria-hidden, không có ID hoặc phần tử focus. Một About thật, không tạo bản nội dung trang trí trùng.

Ba motion cycles tại 390 và 1440 không tăng tài nguyên; hai vòng cuối ổn định. Một lượt warm-up geometry giảm 14→13→13, không yêu cầu mọi mẫu khởi động phải bằng nhau. Sáu lần vào EDURA gỡ Canvas/pool, tài nguyên scene cũ về **0 geometry / 0 texture**; Back phục hồi focus `work-target-edura` cả sáu lần.

QA phát hiện một refresh 300 ms sau mount chạy dư khi Back. Nó phát lại scrub của Smoother, khiến producer thoáng về portal và đặt Works inert, mất focus. Sửa ở App: route restore đã có refresh/seek nên bỏ refresh dành cho intro trong trường hợp có restore. Thử chặn focus của Smoother không giải quyết nguyên nhân và đã được gỡ; useSmoothScroll giữ nguyên hash đầu phiên. Bằng chứng lỗi cũ nằm ở `diagnostics/`, kết quả extras sau sửa mới là kết quả chấp nhận.

## Hiệu năng đo trực tiếp

Edge headless, production preview, 1440×900, DPR 1, ANGLE Direct3D11 **Intel UHD Graphics 630**; không giả lập FPS điện thoại, không ép frame limit. Observer R3F priority âm, không thay render loop. Chạy riêng browser đo, không quay clip cùng lúc.

| Mẫu | Thời gian | FPS | Frame p95 |
|---|---:|---:|---:|
| Opening presentation (không gồm compile/readiness) | 1,20 s | 55,66 | 24,90 ms |
| Hero đứng yên | 2,01 s | 60,15 | 17,00 ms |
| Intake, native wheel + Smoother settle | 2,55 s | **26,69** | **50,50 ms** |
| Comet, native wheel | 2,54 s | 60,23 | 16,90 ms |

`performance-results.json` chứa số mẫu/frame time đầy đủ, GL error = 0. Intake có một frame tối đa 215,90 ms; chưa đạt trải nghiệm 60 FPS trên GPU này. Phép chẩn đoán bỏ mask ≈28,15 FPS, ẩn toàn bộ layer hạt ≈28,95 FPS; CPU profile phần lớn idle. Những phép này gợi ý chi phí render áp sát hố đen là yếu tố lớn; không phải phép đo GPU timer định lượng. Không giảm resolution/RK4 hoặc thay hố đen bằng ảnh để che giới hạn. Mẫu CPU profile riêng intake ≈26,66 FPS, p95≈50,30 ms.

## Media và tái hiện

[Gallery](review.html) ghép ảnh checkpoint và hai clip hiện tại; [handoff](handoff.md) ghi contract. Clip lấy CDP frames/timestamp thật, encode VP8 30 FPS; 30 FPS encode không phải FPS render. `clip-results.json` ghi thời lượng/hash: opening/portal 18,2 giây, comet 10,03 giây. `gallery-results.json` pass: 14 ảnh hiển thị decode được, cả hai video phát/tua được, 0 page errors. `evidence-index.json` ghi 91 media hashes (gồm ảnh chẩn đoán không dùng trong gallery).

[qa/README.md](qa/README.md) có lệnh từ thư mục dự án và biến môi trường cho Playwright/browser/FFmpeg, không khóa vào đường dẫn máy cá nhân. `smoke.json` là chẩn đoán ban đầu, không phải acceptance: handle GSAP lúc đó không trỏ đúng timeline active. Gallery dùng ảnh từ capture tự nhiên thay thế.

## Giới hạn còn lại

Chưa thử điện thoại thật, Safari/Firefox, OS reduced-motion thật, HTTPS/deployment hoặc ma trận GPU rời. Chưa kiểm lại toàn bộ SEO/PWA/offline vì không đổi phần đó. Intake trên iGPU còn chậm; cần quyết định tối ưu GPU sau review visual, không gọi là performance pass.

Plasma và chuyển động là diễn giải cinematic dựa trên [NASA collapse](https://science.nasa.gov/asset/hubble/birth-of-a-black-hole/), [lensing/accretion](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/), [camera plunge](https://svs.gsfc.nasa.gov/14576/) và [tidal disruption](https://svs.gsfc.nasa.gov/20228/). Đây không phải mô phỏng thủy động lực học định lượng; lối ra About là dàn dựng. Không dùng ảnh/video NASA làm asset runtime.
