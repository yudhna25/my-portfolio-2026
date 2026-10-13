# Kiểm chứng — spacetime collapse / V9 revision

Ngày 13/10/2026. G2 đã được người dùng duyệt; **G3 vẫn chờ duyệt**. [Gallery thực tế](review.html). Không chạy V10, release, commit/push hoặc deploy.

## Phạm vi và baseline

Người dùng chốt bỏ **viền liên tục 2026**, giữ sao và runner. Giữ nhịp finale đến p=.44; đổi phần sau thành sóng biến dạng → sao lớn → co sụp/BH; áp dụng lensing vào preloader; ba figure Works orbit chậm quanh nhau.

Baseline là fingerprint V9 trước chỉnh sửa (baseline.json), không được dùng làm phép đo mới. Build hiện tại ở build-source.json: 123 source/asset/config và 46 dist hashes. So baseline: **9 source đổi, 114 file giữ hash, không thêm source mới** (scope.json). Working tree vốn có thay đổi từ các vòng trước; không reset hoặc ghi đè chúng. App, Contact, camera/path, producer/stores, locale, assets, package/config, Footer và các section khác giữ hash của V9.

Build **PASS, 5.62s**; lint **0 errors, 2 warnings SplashCursor cũ**. Warning chunk lớn và THREE.Clock cũ còn. Không thêm dependency, physics engine, Canvas hoặc composer.

## Kiểm chức năng và render

- **2102 analytic assertions**: phase/camera/collision, seed, reverse, toàn quỹ đạo 64 góc ở 390/1440/1920; trọn vòng trả đúng pose và giữ figure trong khung.
- **786 Browser assertions**, Edge headless, 390/1440/1920 × 900, Vi/En. Checkpoints 0/.12/.34/.439/.44/.441/.50/.56/.62/.68/.70/.74/.78/.80/.86/.92/.96/.999, tới/lùi, hold, jump, selection, Contact keyboard/readability. Native pixel rounding được ghi trong browser-results.json. Không ghi trực tiếp story store để dựng checkpoint.
- **23 lifecycle assertions**: rapid wheel reverse; resize; 3 live reduced-motion cycles; 3 EDURA Back cycles; direct Contact; Lab render tại .58 hold/reverse trùng SHA-256. Scene cũ dispose về **0 geometries / 0 textures**, không replay intro khi Back.
- Preloader: **12 ảnh theo timeline chạy tự nhiên** tại 1440/390, có progress thực và frame record; không coi timestamp screenshot là pose chính xác tuyệt đối. Hidden/resize và live reduced-motion **2/2 pass**; join quay về đúng O, không loading lock kẹt.
- Fallback **4/4**: no-WebGL và reduced-motion tại 390/1440; finale **0vh**, Contact hiện đầy đủ, email focus được. Media preference/visibility được mô phỏng trong Browser.
- Recheck portal V3 ở 8 mốc × 3 viewport: 1 Canvas, finale off, scale=1, không GL error; ảnh .25/.47/.70 lưu kèm.

### Độ nét và quy mô BH

3 cấu hình HDR: 390 DPR cap1, 1440 DPR1, 1920 DPR cap1.75. Target bằng drawing buffer, tối đa **3360×1575**; **1 ray pass/frame**, không NaN/Inf, radiance mono, hơn 14k mức radiance phân biệt. Giữ RK4 128/160/192 và pipeline V2.

| Viewport | Dark/photon diameter theo chiều cao | .96 → Contact |
|---|---:|---|
| 390×900 | 59.22% | Giữ nguyên |
| 1440×900 | 55.67% | Giữ nguyên |
| 1920×900 | 56.22% | Giữ nguyên |

Đo từ HDR captured dark runs, không lấy halo ngoài làm đường kính. Mobile crop ngang để giữ quy mô theo chiều cao. Contact giữ nguyên nội dung/bố cục/terminal/link/audio.

## Hiệu năng đo mới

Intel UHD Graphics 630 / ANGLE D3D11, Edge headless, 1440×900 DPR1. R3F frame observer 2.5s mỗi mẫu; không chạy QA/capture khác đồng thời. Không lấy FPS video làm FPS render.

| Cảnh | FPS | Frametime p50 / p95 (ms) |
|---|---:|---:|
| compression-hold | 59.94 | 16.7 / 17.2 |
| wave-native-scroll | 34.64 | 28.2 / 32.8 |
| large-plasma-star | 33.10 | 30.1 / 34.4 |
| spacetime-collapse-hold | 16.69 | 58.6 / 69.5 |
| contact-large-core | 15.91 | 63.8 / 68.0 |
| portal-regression-native | 22.24 | 48.0 / 62.2 |

**Chưa performance pass.** Plasma procedural thêm chi phí; ray-traced disk lớn tiếp tục là điểm nặng trên iGPU. Giữ độ nét như yêu cầu; không hạ resolution/blur để che kết quả. Chưa đo phone thật/nhiệt, Safari/Firefox, OS motion bằng UI thật, HTTPS/PWA/deploy hay contrast toàn bộ nền chuyển động.

## Tính liên tục và giới hạn nghệ thuật

Formation và deformation dùng cùng normalized progress. Trước .44 clock=0 nên warp không làm đổi nhịp va chạm; sao vào sau wave, méo và co lại; vùng tối/đĩa được sinh tại cùng tâm. Ambient gas disk vẫn chuyển động như vòng trước; freeze ambient trong Lab để so framebuffer. 2026 giữ DOM path geometry làm nguồn portal particles nhưng stroke nền là none cả motion và reduced; runner không bị xóa.

Lensing/accretion tham khảo [NASA — Warped World](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/); co sụp sao tham khảo [NASA — Birth of a Black Hole](https://science.nasa.gov/asset/hubble/birth-of-a-black-hole/). Chuỗi nổ → sao xuất hiện → BH là dàn dựng theo yêu cầu, không tuyên bố là lịch trình hình thành vật lý chính xác. Background warp là phép biến đổi screen-space, plasma là procedural, không giải metric không-thời gian hoặc GRMHD. Không tải media NASA vào runtime.

## Ghi chú harness

Lượt đầy đủ đầu hoàn tất 1440/390 rồi timeout navigation 1920; giữ report gốc và chạy lại riêng 1920 thành công. Một probe preloader pause không hoàn tất do timeline observation; ảnh cuối dùng natural timeline. GSAP timeline đã cleanup không còn bị coi là runtime bắt buộc. Fallback test ban đầu đo trước lazy scene hoàn tất; đã chờ trạng thái fallback thật rồi kiểm lại 4/4. Các lượt lỗi không được tính là pass.

Các script portable trong qa/README.md; gallery dùng media tương đối. Clip là frame CDP thực có timestamp, encode WebM30fps để phát lại; không phải offline render tăng chất lượng.

## Chốt bản review

Kiểm thêm ba pha mới **p=.62/.80/.86**: framebuffer Lab ở lượt tới, giữ và cuộn ngược trùng SHA-256 tại từng pha (collapse-render-results.json). Ambient được freeze trong phép so này; App vẫn giữ đĩa khí ambient chuyển động.

Gallery PASS trên Edge 155.0.4283.45: **6 ảnh trực tiếp + 48 checkpoint** decode được, **4 clip** phát và seek được, không console error. Clip preloader 9.23s, Works orbit 6.47s, finale tới/lùi 25.80s, mobile 12.30s. Manifest media nằm trong evidence-index.json. Live orbit có tiến triển và giữ origin chưa capture khi đang ở Works; khoảng đo trước/sau gồm cả thời gian encode nên không dùng để suy ra vận tốc.

Khi tiếp tục phiên ngày 13/10, đối chiếu lại toàn bộ source/dist với build-source.json: **0 hash sai khác**. Không cần build hoặc chạy lại suite đã pass khi source không đổi. Cập nhật progress AGENTS.md và bàn giao; G3 vẫn chờ người dùng xem bản tích hợp này.
