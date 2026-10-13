# G1/G2 lượt hai — kiểm chứng 12/10/2026

Đã triển khai theo plan người dùng duyệt. Kiểm chức năng đạt; G1/G2 vẫn chờ duyệt visual. Hiệu năng intake trên GPU kiểm tra còn hạn chế, chưa nghiệm thu performance/điện thoại.

## Build và fingerprint

- Build production và lint: PASS. Lint 0 errors, 2 warnings SplashCursor cũ; chunk >500KB cũ. Log mới: [build](build.log), [lint](lint.log).
- [baseline.json](baseline.json) là hash trước sửa của 118 source/asset/config files. [build-source.json](build-source.json) giữ hash source và toàn bộ dist bản review. 14 file cũ thay đổi trong phạm vi, 104 file được bảo toàn; thêm src/3d/utils/opening.js. Package/lock/config/public assets, camera path/rig, stores, Skills/Education/Works/EDURA/Contact/Footer và locales giữ hash.
- Không dùng report/FPS 10/10 làm phép đo 12/10. Browser hiện tại Edge 155.0.4283.45; GPU ANGLE Intel UHD 630/D3D11, viewport mô phỏng, DPR 1. Không phải RTX 4060 của các báo cáo cũ.

## Chức năng và hình ảnh

- [browser-results.json](browser-results.json): 527 assertions, 320×760 / 390×844 / 768×1024 / 1440×900 / 1920×1080. Portal tới/lùi: 0/.25/.44/.47/.50/.70/.94/.999; endpoint 1 dùng About ổn định. Camera reverse sai khác dưới 0.03 world units khi native scroll có rounding; meteor geometry dưới 0.01.
- [hero-matrix.json](hero-matrix.json): 10 tổ hợp Vi/En, cùng lề trái và center Y giữa year/heading; đủ bốn số, 0px overflow; desktop intro một dòng, mobile không orphan một từ; đúng một About DOM.
- [extras-results.json](extras-results.json): 49 assertions: Tab/Escape/menu/locale/resize, 6 route retirement cycles, Lab 390/1440. Lab kiểm trên dev entry hiện có; production config chỉ build index.
- [opening-fallback-results.json](opening-fallback-results.json): 7 cases — font chậm, font watchdog, font lỗi, no-WebGL và reduced. 19 console faults do injection ghi riêng; không là lỗi production. Readiness chờ font/3 scene frames, watchdog 5s; cold presentation 4.5s và warm-ready 2s, tách khỏi thời gian tải. Reduced/no-WebGL bỏ trình diễn dài.
- [opening-lifecycle.json](opening-lifecycle.json): ẩn 1.2s giữ nguyên p, resize 1440→390 nối O, live reduced trong intro rồi bật lại không phát lại/kẹt loading. Đã sửa callback đọc SVG sau unmount và bỏ timeout completion gây jump sau hidden pause.
- Độ lệch tâm opening cuối so với anchor O tối đa 0.066px trong matrix; tỷ lệ shadow scale cuối gần 1 (dung sai 1%). Cùng HDR hole/target/composer, không pop sang ảnh, không blur/white flash. Nav ẩn khi loading; đo anchor thật vẫn giữ layout.
- [hold-glitch.json](hold-glitch.json): giữ 7 khoảng 3.4s, rapid wheel reverse, rồi kiểm camera/copy/meteor đứng nguyên 600ms sau khi progress producer ổn định. ScrollSmoother settling là thay đổi input progress; không thêm tween/autoplay của story sau scroll. Ambient background/twinkle có thể khác, story pose giữ nguyên.
- [motion-results.json](motion-results.json): 80060 assert checks cho finite pose, same-p deterministic, velocity continuity tại mốc, opening endpoint, departure join và protected scope.
- [pixel-results.json](pixel-results.json): lõi trắng đo từ PNG 50–51px desktop, 30–31px mobile. Halo uniform 84/51 CSS px, không là phép đo bán kính glow; đã bỏ milestone flare và radial DOM wake. Particle pool 24/12, dùng chung position/normal của ribbon, nhỏ cyan và không history simulation.
- PNG và WebM mới trong [review.html](review.html), lấy từ build review thật. Clip lấy CDP frames/timestamps, resample 30fps; encoding rate không là FPS render. [clip-results.json](clip-results.json) có hashes/timestamps; JPEG trung gian đã xóa. Ảnh từ timeline hết hiệu lực và thử nghiệm remapping ở diagnostics, không dùng nghiệm thu.

## Quỹ đạo comet

Giữ ba mốc đo từ DOM. Quỹ đạo quintic dùng tiếp tuyến giới hạn và gia tốc 0 tại các mốc; kéo dài đoạn tiếp cận ra trước mốc công ty đầu để tránh một đoạn vào quá ngắn bẻ gắt đoạn sau. Head y chạy 20→80% viewport rồi nối departure. Không dùng LUT/remapping hoặc state engine mới trong bản cuối.

[So sánh đường bay](path-profile.json) dùng layout DOM/camera matrices thật, p=.04.. .96; tốc độ là CSS px/chapter progress, không là tốc độ theo giây/FPS. Hai source dùng cùng camera/layout nhưng approach/end Y tương ứng implementation trước/sau.

| Viewport | max/min speed trước | max/min speed sau | P95 accel trước | P95 accel sau |
|---|---:|---:|---:|---:|
| 320 | 145.88 | 2.54 | 14502 | 17176 |
| 390 | 106.55 | 3.00 | 20087 | 24437 |
| 768 | 82.65 | 5.18 | 87100 | 55726 |
| 1440 | 53.41 | 11.98 | 25405 | 79472 |
| 1920 | 37.31 | 9.96 | 28581 | 67360 |

Tốc độ ít rơi vào đoạn gần đứng yên hơn. Không tuyên bố tốc độ đều hoặc gia tốc luôn nhỏ hơn: P95 gia tốc tăng trên một số layout, đặc biệt desktop; C2 và continuity check bảo đảm nối mềm, còn cảm giác cần duyệt qua clip/cuộn thật. Đã bỏ remapping thử nghiệm vì tăng gia tốc gắt hơn.

## Render và tài nguyên

Phép đo riêng, không quay clip đồng thời; R3F observer priority âm chỉ đọc, không gọi render/camera writer. [performance-results.json](performance-results.json):

| Cảnh | FPS đo | P95 frame ms |
|---|---:|---:|
| opening-presentation | 59.5 | 17.0 |
| hero-idle | 60.1 | 17.3 |
| intake-native-scroll | 33.7 | 62.4 |
| meteor-native-scroll | 59.8 | 17.3 |

Portal/intake chưa đạt mục tiêu hiệu năng cao trên Intel UHD 630. Ablation bỏ mask riêng trong trang QA vẫn khoảng 32 FPS ([diagnostics](diagnostics/performance-no-mask.json)), không đủ bằng chứng coi mask là nút thắt hay bỏ nó khỏi thiết kế. Không hạ pipeline HDR đã chứng minh để làm đẹp số đo. Cần profile CPU/GPU trên máy mục tiêu ở bước performance sau gate.

Một Canvas trong tất cả pose. Ba motion cycles: normal resource ổn định 15 geometries/26 textures; hidden render frame không tăng và frameloop never. Sáu retirements: Canvas disconnected, 0 geometries/0 textures, 0 trail pools. Nguồn producer/store/camera rig/path và shader/mask/quality giữ nguyên hash; thêm opening wiring chỉ đọc ref trong writer uniform cũ. Không thêm composer/Canvas/router/store/dependency.

Runtime warnings: THREE.Clock deprecated cũ; service worker blocked là cấu hình QA. Production cases không có page/console/GL/404 errors. OS media/hidden/touch là mô phỏng; chưa đo điện thoại thật, nhiệt/SPL, native OS motion, HTTPS deployment hoặc production PWA/offline của bản này.

## Giới hạn thẩm mỹ/vật lý và gate

Tham chiếu [NASA — Birth of a Black Hole](https://science.nasa.gov/asset/hubble/birth-of-a-black-hole/): nguồn mô tả một ứng viên sao co sụp qua failed supernova. Website rút gọn thành sao/khí → lõi tối/đĩa → O trong 4.5s; choreography UI, rebase và About ejection là cinematic, không mô phỏng thời gian/hydrodynamics hoặc khẳng định vật thể thật bị đẩy ra khỏi hố đen.

Chờ người dùng duyệt riêng G1 (opening/typography/intake/ejection) và G2 (comet và các section visual liên quan). Không tự coi plan approval hoặc QA pass là visual approval. Không chạy V9/G3, không commit/push lượt này.
