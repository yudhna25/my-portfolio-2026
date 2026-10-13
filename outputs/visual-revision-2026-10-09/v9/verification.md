# V9 — verification · 13/10/2026

**Code và kiểm kỹ thuật hoàn tất; G3 chờ người dùng duyệt. Performance chưa đạt nghiệm thu trên iGPU.** Xem [bản review](review.html) và [handoff](handoff.md).

## Baseline và phạm vi

G2 đã được người dùng duyệt trực tiếp. Đã đọc prompts/AGENTS, handoff V2/V3/V7/V8 và skill repo react-3d-ui/galaxy-portfolio trong tools/codex-skills. Palette cyan nhẹ áp dụng theo lệnh V9 mới hơn quy định mono cũ của skill.

baseline.json ghi 122 hash trước phiên; build-source.json khóa 123 source/asset/config và 46 file dist đang phục vụ. scope-audit.json: 11 source sửa + FinaleParticles.jsx mới; 111 hash baseline giữ nguyên, gồm assets V4, Hero/About/meteor, route/store/producer, Footer, locales, package/config. Không dùng report cũ làm phép đo hiện tại. Working tree đã có thay đổi các phiên trước; không reset hoặc commit chúng.

Contact chỉ đổi class background từ nền đặc sang gradient. CameraRig/HDR target/composer/quality budget giữ nguyên. cameraPath chỉ chỉnh framing Contact và finale height. Một persistent Canvas; một CameraRig; producer vẫn là useScrollProgress hiện có.

## Kết quả hiện tại

| Kiểm tra | Kết quả |
|---|---|
| npm run build | PASS, 5.58s, 1875 modules; PWA 41 entries |
| npm run lint | 0 errors; 2 warning SplashCursor class cũ |
| check-finale.mjs | 1488 assertions PASS; phase/continuity/reverse/seed/capture; world collision error tối đa 1.07e-14 |
| verify-finale.mjs | 937 checks PASS, 132 native poses tại 390/1440/1920×900; 0 console/page/GL error |
| verify-lifecycle.mjs | 23 checks PASS; 3 motion cycles, 3 EDURA Back cycles, resize, rapid reverse, direct Contact, Lab |
| check-fallback.mjs | 4 cases PASS: reduced/no-WebGL ×390/1440 |
| verify-pipeline.mjs | 3 cấu hình PASS: target bằng drawing buffer, finite/mono HDR, mỗi frame một ray pass |

Native poses gồm 0/.001/.119/.12/.121/.339/.34/.341/.439/.44/.441/.49/.58/.699/.70/.701/.82/.90/.959/.96/.961/.999 theo hai hướng. Contact chapter p=0 kiểm endpoint finale p=1. Rapid wheel/reverse, hold, jump và keyboard focus email được kiểm riêng; href/mailto giữ nguyên. Vi/En đổi trong finale không đổi orbit origin, Contact chụp cả hai locale.

Các lần chạy QA đầu phát hiện lỗi trong bộ đo: uTime thuộc ray material; pixel đen đơn lẻ ngoài disk không phải core; screenshot của canvas còn chứa HUD; native Smoother đang settle không phải cùng p tuyệt đối. Đã sửa bộ đo, không đổi ứng dụng để ép kết quả. Lượt PASS cuối dùng native scroll và API ScrollSmoother hiện có để kết thúc scrub, không ghi trực tiếp store. Chênh p giữa hai hướng tối đa 0.0002014 (~0.725px trên 400vh); không gọi toàn bộ ảnh App là pixel-identical vì ambient disk đang chạy.

## Reverse / snapshot / tài nguyên

- Lab dùng cùng scene và producer, ambient freeze. Đọc framebuffer sau frame: hash ảnh p=.58 khi tới, giữ 900ms và đi .96 rồi lùi .58 giống hệt nhau; xem lifecycle-results.json.
- App hold giữ camera, gas progress, seed và snapshot; uTime của disk được phép tăng. Không dùng random mỗi frame hoặc simulation tích lũy.
- Ba motion cycles trở lại cùng 22 geometries/26 textures/21 subscribers (sau các resource đã được dùng). Ba lần vào EDURA: renderer cũ ngắt DOM và GPU về 0 geometry/0 texture; Back trả về Works/EDURA selection/focus, không intro.
- Resize 1440→390→1920→1440 giữ 24 seed đầu và captured orbit origin; quality đổi số lượng hạt theo prefix xác định.
- Reduced live/fresh bỏ finale (height=0), không particles, Contact opacity=1 và focus được. No-WebGL không Canvas và Contact đọc được.
- Direct #transmission kiểm 390 và 1920/DPR2; không chạy chuỗi nổ để tới nội dung.

## Kích thước và độ nét hố đen

Đo đường cắt qua tâm từ HalfFloat HDR target, lấy hai miền captured-dark lớn hai phía của dải disk foreground. Loại các pixel đen rời rạc trên khí (nhóm <1% chiều cao); không lấy halo/đĩa ngoài làm đường kính. Chụp full frame xác nhận photon silhouette khớp. Cùng phép đo tại p=.96 và Contact:

| Viewport | Lõi tối / chiều cao | HDR target |
|---|---:|---|
| 390×900 | 59.22% | 390×900, DPR1 |
| 1440×900 | 55.67% | 1440×900, DPR1 |
| 1920×900 | 56.22% | 1920×900, DPR1 |

Không shrink endpoint. Kiểm thêm thiết bị mô phỏng DPR3/2: mobile renderer DPR1; desktop1920 renderer DPR1.75 với target3360×1575. HDR có 14,708–17,302 mức radiance half-float phân biệt, không NaN/Inf, RGB mono. Ray pass/frame đo 67/67,17/17,6/6; đây là số đếm pass, không phải benchmark FPS. Copy/mask sample UV nguyên target; chỉ hướng tia được scale trước tích phân.

V3 regression: 0/.25/.44/.47/.50/.70/.94/.999 ở cả ba viewport; uFinaleEnabled=0, uFinaleScale=1, một Canvas, không GL error. Portal path/producer/DOM không đổi so baseline. Ảnh portal-regression-* kèm trong screenshots.

## Frametime đo riêng

Edge headless trên ANGLE/Intel UHD Graphics 630/D3D11, 1440×900, high tier, DPR1. Một browser QA, không chạy clip/QA khác cạnh tranh GPU; observer R3F priority âm, không thêm render hoặc ép frame limit. Mỗi mẫu 2.5s. Đây không phải kết quả điện thoại/RTX4060.

| Cảnh | FPS đo | p50 / p95 frame ms |
|---|---:|---:|
| Nén tại .34 | 59.79 | 16.7 / 17.1 |
| Wave + native scroll | 60.18 | 16.6 / 17.9 |
| Gas tại .70 | 60.00 | 16.7 / 18.3 |
| Disk đang hình thành .82 | 20.75 | 48.2 / 51.9 |
| Contact, lõi lớn | 15.96 | 61.2 / 63.7 |
| Portal V3 native | 24.69 | 43.3 / 53.5 |

**Rủi ro chính:** diện tích ray-traced disk lớn làm iGPU chậm. Không hạ target resolution/blur hoặc giảm RK4 budget để che điều này. V10 cần profiling GPU và tối ưu giữ hình sau khi G3 được duyệt; không đánh dấu performance pass. Đo dài hạn nhiệt/điện thoại/OS motion thật/HTTPS production chưa làm.

## Visual và giới hạn

Review trực tiếp ảnh core/shockwave/accretion và Contact desktop/mobile: core tập trung, có vùng tối giữa gas, không white flash; center không đổi; nền gradient thấy BH, heading/email/CTA vẫn đọc được. Contact giữ copy/layout/actions, nên một số label phụ màu muted cũ vẫn tương phản thấp; V9 không phải audit WCAG toàn site. Mobile crop ngang BH là có chủ đích vì đường kính tính theo chiều cao.

Gas là ba lát procedural có perspective scale và angular flow; hạt có camera-space depth/parallax. Đây là chuyển động cinematic xác định theo scroll, không phải mô phỏng thủy động lực học/GRMHD. Ambient gas của disk tiếp tục chạy; shockwave/collapse không autoplay.

Warning hiện tại: chunk >500KB, THREE.Clock deprecated, 2 lint warning SplashCursor cũ. Service worker bị Playwright chặn trong QA là cấu hình harness. Không thêm âm thanh nổ, không sửa audio.

## Evidence và tái chạy

review.html tham chiếu media bằng đường dẫn tương đối. Clip lấy CDP frame thật theo timestamp, encode WebM30fps để phát lại đúng thời gian; encoding không phải FPS đo. Các script trong qa/ dùng module Playwright và ffmpeg đã cài qua biến STELLAR_PLAYWRIGHT_MODULE / STELLAR_FFMPEG; không thêm npm dependency. Server preview mặc định5215, Lab dev5214; QA_BASE_URL/QA_LAB_URL theo common/harness nếu cần. Xem qa/README.md.

G3 chưa duyệt. Không chạy V10/release/deploy, không commit/push.

### Gallery đã kiểm

check-review.mjs PASS: 6 ảnh trực tiếp và 33 lựa chọn checkpoint decode; hai WebM phát và seek được; 123 source/46 dist hash trùng bản build. Desktop clip25.24s/447 frame ghi thực, mobile12.21s/296 frame; xem clip-results.json. evidence-index.json khóa hash các media được review.
