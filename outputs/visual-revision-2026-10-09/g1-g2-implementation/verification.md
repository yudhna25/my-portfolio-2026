# Tinh chỉnh G1/G2 — verification 10/10/2026

**Kỹ thuật/local PASS; G1/G2 chờ người dùng duyệt visual lại. V9/G3 chưa bắt đầu.** [Ảnh và clip](review.html) · [Handoff](handoff.md) · [Source/build](build-source.json) · [Scope/parity](check-results.json).

## Phạm vi và build

Thực hiện P1–P4 theo [phương án đã chốt](../../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md). 11 file nguồn cũ được sửa, 3 file mới; 108/119 file baseline giữ hash. Bộ bảo vệ riêng 56 file (camera/producer/stores/BH/ambient/Skills/Education/Works/EDURA/locales/public/config) PASS. AGENTS giữ nguyên prefix 61967 bytes rồi chỉ append. Không thêm dependency, route, Canvas R3F hoặc writer.

`npm run build` PASS, PWA40 entries; `npm run lint`: 0 lỗi, 2 warning SplashCursor cũ. Chunk lớn/THREE.Clock cũ được ghi riêng. Source đo tại **2026-10-10T06:06:06.028Z**; một production build output-only có index + Lab, phục vụ loopback5212. Build chuẩn dist cũng pass; không sửa vite.config. 118 source/asset hashes khớp bản đo. Kiểm locale: 254 keys + 93 keys + 2 keys, Vi/En parity100%; không đổi copy.

## Opening và 2026

Vòng mono từ tâm đến O thật; cold1.8s, warm-ready0.9s (reload chậm vẫn1.8s). Đây là thời gian trình diễn, tách khỏi tải font/shader. Hero đã có dưới veil; idle chờ opening hoàn tất. Font/layout đổi trong lúc mở được đo lại. GSAP scaleX/Y thật, không dùng shorthand scale quickSetter. Watchdog5s và finish deadline vẫn có; reduced không render overlay.

7 tình huống độc lập PASS: font trễ1.8s trên390/1440; font trễ6s thật đi qua watchdog390; font abort390; no-WebGL390/1440; fresh reduce390. Không frame reveal thiếu Hero; sai tâm tối đa <0.001px ở các ca fallback; photon ring/O ratio0.96. 19 lỗi network/context **do test chủ động gây ra** được tách khỏi0 lỗi không dự kiến. [Log](opening-fallback-results.json).

2026 rộng khoảng1.30 lần PORTFOLIO, đủ bốn số. Không stroke cố định normal; tail35% + wake10%, lap10–14s, giữ glitch6↔7. Các snapshot4/8/12/16s ở320/1440 bổ sung ảnh ready; không lấy một frame để kết luận cả vòng. Hai SVG sao/contour trùng basis. Seed/vị trí/nhóm sao gốc được rasterize một lần vào PNG mono, tránh pattern repaint; cache2D tách rời không thêm DOM/WebGL Canvas. Reduced/fallback có contour chấm tĩnh để đọc số.

| Viewport | Overflow | Year / PORTFOLIO width | Lệch tâm khi reveal | Photon / O |
|---|---:|---:|---:|---:|
| 320 × 760 | 0px | 1.304 | 0.0000px | 0.960 |
| 390 × 844 | 0px | 1.304 | 0.0000px | 0.960 |
| 768 × 1024 | 0px | 1.304 | 0.0000px | 0.957 |
| 1440 × 900 | 0px | 1.304 | 0.0001px | 0.960 |
| 1920 × 1080 | 0px | 1.304 | 0.0001px | 0.960 |

## Intake và comet

Sau ảnh theo từng glyph/word/control đo thật; 6 snapshots/source mobile, 8 desktop, một pool mỗi consumer. Bản sao inert/aria-hidden, không ID/link/handler/focus. Chữ nhận ra ở đầu, giảm đậm trước join; nhánh nhập một funnel toán học1.25 vòng, thu mảnh và bị che khi vào core. Không biến dạng pixel từng chữ bằng shader; chất lượng silhouette cần người dùng xem clip. Will-change chỉ khi intake active. [12 ảnh tiến/lùi](intake/final-capture.json); cùng progress cho cùng pose qua33,272 assertions, native camera reverse sai lệch <0.03 world units. Raw transform strings ở ảnh tới/lùi có thể khác bởi residual Smoother <1.1px; không tuyên bố pixel hash giống nhau.

Một StoryMeteor/curve/layout cũ được nâng cấp: C2 quintic qua ba DOM company anchors; authored q âm cho entry có đuôi~42vw; nối departure không lọc/lerp trễ riêng. Flare nở mềm theo reading progress, white core/cyan đuôi hiện có, không flash toàn màn hình. 16,963 assertions kiểm continuity/reverse/buffers. Pixel phép trừ cùng pose, chỉ tạm ẩn head mesh rồi phục hồi để đo; không tính plane trong suốt là halo. Sai số diameter khoảng±2px, halo ngưỡng head-only luminance20/255.

| Viewport / mốc | Lõi sáng thật | Halo thật | Đuôi tại mốc |
|---|---:|---:|---:|
| 390px / công ty 1 | 31px | 121px | 42.06vw |
| 390px / công ty 2 | 31px | 121px | 41.55vw |
| 390px / công ty 3 | 31px | 121px | 42.02vw |
| 1440px / công ty 1 | 51px | 225px | 42.00vw |
| 1440px / công ty 2 | 51px | 225px | 41.99vw |
| 1440px / công ty 3 | 51px | 225px | 42.00vw |

[Pixel log](comet/pixel-results.json). Mobile core31px/halo121px; desktop core51px/halo223–225px nằm trong lựa chọn C. Độ rõ chữ khi vệt đi qua cần xem thêm ở clip/thiết bị thật.

## Interaction, lifecycle và performance

402 kiểm tra main trên5viewport PASS; native wheel/scroll tới-lùi, Skills/Education/Works, 6 EDURA Back giữ focus work-target-edura/selection/scroll/orbit, 3 live reduce↔normal và hidden↔visible. Reduced: native scroll,0 triggers/active year timelines/copies, camera đứng, comet ẩn. Hidden: frameloop never/render passes không tăng. 49 extras PASS: Enter/Tab/Escape Menu, Vi/En, resize390→1440→390, Lab shared renderer và6reader disposal cycles trả GPU0geometry/0texture,0 trail pools. [Main](browser-results.json) · [Extras](extras-results.json). Main/extras:0 console/page/GL/HTTP404 lỗi; warning thư viện và SW blocked-by-QA được giữ trong JSON.

Đo riêng actual negative-priority R3F frame observer trên Edge/RTX4060/DPR1; không override renderer, không flag gỡ frame limit. Opening đặt cửa sổ danh nghĩa1.2s sau presentation bắt đầu (thực đo1.367s theo timer), không tính compilation/readiness. Wheel samples gồm Smoother settling. Clip encode30fps không phải benchmark. [Số đo](performance-results.json).

| Sample | FPS | p95 ms | p99 ms | Max ms | Frames >16.7ms |
|---|---:|---:|---:|---:|---:|
| opening-presentation | 165.35 | 6.30 | 6.90 | 10.10 | 0/226 |
| hero-idle | 165.09 | 6.30 | 6.40 | 6.80 | 0/331 |
| intake-native-scroll | 132.43 | 11.90 | 14.50 | 14.60 | 0/338 |
| meteor-flare-native-scroll | 164.54 | 6.40 | 6.80 | 15.30 | 0/416 |

Tất cả sample >120FPS, không frame >16.7ms trong lượt đo source cuối. Đây là sample ngắn trên máy dev, không bảo đảm mọi thiết bị/mọi lượt cuộn không hitch. Pool/cache giảm bottleneck của bản thử: year repaint~19–25FPS →~165FPS; intake không cache~1–2FPS →>120FPS. Các profile/attempt thất bại và lượt trước có frame20–24ms là diagnostics, không có trong gallery nghiệm thu.

## Giới hạn và gate

Chưa kiểm điện thoại thật, native OS motion lần mới, Safari/Firefox, HTTPS/deployment, screen reader/SPL/nhiệt thiết bị. Touch/media/hidden mô phỏng trên Edge; phản ứng keyboard/pointer/route là native browser input. Không push/deploy. PWA offline và deep-link server rewrite không chạy lại; Python QA server phục vụ build, route client Back được kiểm. Dev5211 hỗ trợ SPA preview.

Các ảnh/clip trong gallery thuộc cùng source/build hiện tại, có decode/hash trong evidence-index. 132PNG và hai capture WebM được giữ nguyên; gallery dùng thêm hai MP4 H264 transcode từ đúng các frame đó. Edge GPU báo PIPELINE_ERROR_DECODE khi tua WebM, dù ffmpeg decode pass; [media log](review-media-results.json) ghi rõ. [Kiểm gallery native](gallery-results.json) PASS:76ảnh decode,2MP4 phát/tua,0console/HTTP errors; phần archive còn lại được decode/hash trong evidence-index. G1/G2 phải được duyệt lại; giữ V9/G3 chờ. Không lấy review V8 hoặc lựa chọn Q12 làm duyệt animation mới.
