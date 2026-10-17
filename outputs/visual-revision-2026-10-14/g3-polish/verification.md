# G3 polish — kiểm chứng 14/10/2026

## Phạm vi và fingerprint
Baseline HEAD c0cfb4833850743690f7e4d2f912477c145ff356; working tree ban đầu sạch. baseline.json là hash thực trước sửa, build-source.json khóa 123 source/asset/config và output dist của bản build mới. Đổi 5 source files, giữ nguyên 118; không thêm dependency, Canvas, engine hay producer. prompts.md cập nhật quyết định mới; AGENTS.md chỉ append.

## Đã chạy trên bản cuối
- npm run build: PASS, 10.65s, 1875 modules, PWA41 entries. Warning chunk lớn vẫn còn.
- npm run lint: 0 errors, 2 warnings cũ của SplashCursor (inline class/react compiler).
- upgrade-results.json: 81 checks PASS tại390/1440/1920px: ảnh màu hoàn chỉnh, gather/hover/focus/Space/Escape/reverse, reduced/live motion, runner7 trắng rõ, ambient disk và một HDR pass mỗi frame quan sát.
- lifecycle-results.json:23 checks PASS; resize, rapid reverse,3motion cycles,3EDURA Back, direct Contact390/1920DPR2, Lab hold/reverse. Tài nguyên scene cũ dispose về0 geometry/0 texture; một Canvas.
- collapse-render-results.json: plasma.62, collapse.80/.86 có framebuffer SHA256 bằng nhau khi hold/reverse với ambient bị freeze trong Lab.
- formation-results.json:30 checkpoints ở390/1440/1920, p=.44/.50/.56/.62/.70/.78/.80/.86/.92/.96; một Canvas và GLerror0. Ảnh chụp lại từ build cuối.

## Chẩn đoán trong quá trình kiểm
Lượt đầu lifecycle đọc sau media toggle/scroll khi layout tiếp tục refresh và chapter quay về Works; lưu initial-lifecycle-failure.json. Harness chờ layout rồi điều hướng lại bằng native scroll; 3cycle chạy lại PASS, không đổi source để che lỗi. Một kiểm chân dung cũ yêu cầu object sao visible dù endpoint đã chuyển sang ảnh; sửa assertion để kiểm ảnh opacity1 và sao opacity0. Lượt chụp formation song song bị một console error chưa giữ nội dung; chạy lại tuần tự PASS với errors[]. Không dùng kết quả hoặc media của lượt trước build cuối để nghiệm thu.

## Giới hạn
Đây là diễn họa điện ảnh, không phải mô phỏng tương đối rộng vật lý. Browser desktop và viewport giả lập không chứng minh hiệu năng điện thoại thật; OS motion/visibility được giả lập. Chưa Safari/Firefox/HTTPS public. G3 chưa được người dùng duyệt, chưa V10.

## Kiểm thêm sau khi tiếp tục phiên
- Preloader natural:12 checkpoint1440/390, progress thực lưu ở opening-results.json, nối về Hero không có viền nền.
- Fallback:4cases PASS (no-WebGL/reduced ×390/1440), Contact đọc được, keyboard focus được, finale height0, không overflow. Lượt đầu điều hướng timeout30s; chạy lại60s PASS.
- git diff --check sạch; thông báo chuyển LF→CRLF là cấu hình working copy, không phải lỗi code.

- opening-lifecycle.json:2cases PASS, hidden/resize giữ tiến độ; join O error0px/ratio1, live reduced không replay preloader.

## Hiệu năng bản này
Đo tuần tự, Edge headless,1440×900,DPR1,Intel UHD630, mỗi sample2.5s, observer R3F thực; không chạy clip encoder đồng thời. Không suy ra FPS điện thoại.

| Cảnh | FPS | p95 frame ms |
|---|---:|---:|
| compression-hold | 60.13 | 17.10 |
| wave-native-scroll | 37.12 | 27.90 |
| large-plasma-star | 37.76 | 27.10 |
| spacetime-collapse-hold | 17.57 | 58.20 |
| contact-large-core | 16.77 | 65.70 |
| portal-regression-native | 25.35 | 48.40 |

Hiệu năng iGPU chưa đạt mục tiêu, đặc biệt co sụp/BH lớn; cần V10 sau khi G3 được duyệt. Không dùng FPS lịch sử RTX4060 làm kết quả hiện tại.

## Media và review cuối
clip-results.json khóa4clip thực từ CDP với timestamp của browser: preloader10.46s, portrait9.48s, finale tới/lùi25.88s, mobile12.38s. Encode30fps không phải FPS render. gallery-results.json PASS:4ảnh +30checkpoint decode,4video phát/tua; source/dist/clip hash khớp. evidence-index.json khóa media và review.

Lượt quay đầu đã hoàn tất3clip desktop nhưng mobile resize điều hướng tới boundary sai trước layout ổn định. Quay lại trọn bộ, mobile dùng tải trang mới tại390px; các clip cuối cùng và metadata đã thay thế lượt dở.
