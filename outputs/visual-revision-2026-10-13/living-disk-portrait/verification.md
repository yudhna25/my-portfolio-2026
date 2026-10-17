# Kiểm chứng — Living disk / star portrait

Ngày 13/10/2026. Code và kiểm chức năng đạt; G1/G2 chưa được duyệt visual, chưa nghiệm thu performance trên iGPU. Đây là phép đo mới của bản tích hợp hiện tại, không dùng báo cáo cũ làm kết quả mới.

## Bản build và phạm vi

- Build cuối: PASS, Vite 7.3.6, 1874 modules, 8,96s; PWA 41 entries / 3240,96 KiB. Warning chunk >500kB còn từ trước.
- Lint: 0 errors, 2 warnings cũ của class trong SplashCursor.jsx. git diff --check pass; Git chỉ nhắc chuyển LF/CRLF.
- 119 hash baseline: 109 giữ nguyên, 10 file sửa; 3 file mới. Không đổi public/assets, package/lock/config, CameraRig/path/producer/store, BH system/mask/quality trong lượt này.
- build-source.json khóa 122 source/asset/config và 46 file dist. scope.json ghi phạm vi so với baseline của phiên, không so với HEAD vốn đã chứa các thay đổi chưa commit từ lượt trước.
- Vi/En main locale: 254 keys parity; chỉ đổi 2 nhãn về chân dung. Không thêm dependency.

## Kiểm chức năng

| Kiểm tra | Kết quả mới |
|---|---|
| Sampling chân dung: alpha, seed, luma, bounds, determinism, locale | 10 assertions PASS |
| Disk/portrait/glitch: 390, 1440, 1920px | 81 checks PASS |
| Portal tới/lùi, hold, rapid reverse, 3 live motion cycles | 225 checks PASS |
| Vi/En, keyboard/menu, resize, Lab, 6 EDURA Back cycles | 49 checks PASS |
| No-WebGL và reduced-motion, direct #about, 390/1440 | 4 cases PASS |

Nguồn: upgrade-results.json, browser-results.json, extras-results.json, fallback-results.json và các script trong qa/.

- Quan sát uTime tăng ở Hero, portal, About, Skills, Education, Experience, Works và Contact. Reduced-motion giữ time đứng; bật lại motion khôi phục điểm sao/ảnh đúng.
- HDR target bằng drawing buffer ở cả 3 viewport; đúng 1 HDR render trong mỗi R3F frame quan sát. Một Canvas DOM; source vẫn một producer App và một CameraRig. Không thêm fullscreen render pass.
- Các mốc portal: 0 / .025 / .06 / .12 / .20 / .25 / .34 / .44 / .47 / .50 / .70 / .94 / .999 rồi ngược lại. .999 là điểm ngay trước biên; vào chapter About kiểm endpoint p=1/morph=1.
- Khi giữ p=.20, camera và đường particle SVG khớp tuyệt đối sau 600ms; reverse camera sai lệch trong ngưỡng .035 của phép seek scroll. Pooled particle count ổn định, copies inert và không có focus target.
- 3 motion cycles mỗi viewport 390/1440: tài nguyên không tăng và đạt plateau. Cả 6 lần vào reader: Canvas disconnected, geometry=0, texture=0, pools=0; Back phục hồi focus EDURA.
- Portrait có 2099 sao tier low, 8207 sao tier high; hover/focus ngưng tụ, Space pin, Escape/leave khôi phục trạng thái scroll. Geometry dùng ảnh cutout hiện có; không có ảnh About trang trí trùng nội dung.
- Glitch quan sát theo thời gian thật: giữ 7, quay lại 6; noise trắng hoàn toàn; base của 7 opacity .1, runner .08. Runner 6,5–7,9s/vòng theo source. Không cyan/cam trong glitch.
- Reduced/no-WebGL: ảnh gốc hiện, nhận focus, About không inert, portal ngắn ≤1.1 viewport, 0 overflow.
- 0 unexpected console/page/GL errors trong các kiểm tra chức năng; lỗi tạo WebGL do cố ý vô hiệu hóa là trường hợp fallback.

## Hiệu năng đo thật

Edge headless / Intel UHD Graphics 630 / ANGLE D3D11, viewport 1440×900, DPR=1. Quan sát callback R3F priority âm; không đổi render loop hoặc ép cờ FPS. Native wheel bao gồm thời gian Smoother settle. Mỗi mẫu 1,2–2,55 giây, là số đo ngắn trên máy này.

| Cảnh | FPS | Frame p95 (ms) |
|---|---:|---:|
| opening-presentation | 51.54 | 32.70 |
| hero-idle | 59.81 | 18.20 |
| intake-native-scroll | 25.00 | 52.80 |
| about-star-portrait | 59.72 | 17.10 |
| meteor-native-scroll | 60.06 | 18.00 |

Pha hút khoảng 25 FPS, chưa đạt mức mượt mong muốn trên iGPU; không tuyên bố performance pass. Đã loại bỏ đo DOM khi About ẩn và ghi thuộc tính lặp mỗi frame. Mẫu trước sửa là 21,07 FPS trong diagnostics/, nhưng hai mẫu ngắn không phải benchmark A/B kiểm soát hoàn toàn. Không giảm độ phân giải để che điểm nghẽn; V10 cần profile sâu đường hút DOM/shader và đo phần cứng đích.

## Cơ sở visual và giới hạn vật lý

Dòng khí bên trong nhanh hơn, kéo giãn thành dải, tương phản Doppler tham khảo [NASA accretion visualization](https://svs.gsfc.nasa.gov/13326). Vòng photon và góc nhìn lao vào tham khảo [NASA plunge](https://svs.gsfc.nasa.gov/14576/). Shader giữ mô hình tia Schwarzschild hiện có; shear r^-1.5 là xấp xỉ định tính, không phải dữ liệu MHD hoặc spin Kerr thực.

Cách ngưng tụ/dissolve dùng shader + hạt được tham khảo từ [Codrops dissolve](https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/) và [scroll distortion](https://tympanus.net/codrops/2024/07/18/how-to-create-distortion-and-grain-effects-on-scroll-with-shaders-in-three-js/). Code được viết cho pipeline hiện tại, không sao chép asset/implementation của bài. Cung sáng, star portrait và glitch là dàn dựng điện ảnh.

Dừng cùng p giữ đúng pose/story; disk advection, cloud drift, twinkle/idle glitch là ambient nên toàn ảnh không nhất thiết trùng từng pixel. Full drawing buffer không có nghĩa vô hạn chi tiết: chất lượng còn tùy DPR, ray budget và GPU.

## Bằng chứng và giới hạn kiểm tra

review.html chọn 12 ảnh cùng hai clip của bản build hiện tại. clip-results.json ghi timestamp capture, frame count và hash; clip 30fps là cách mã hóa, không phải FPS render. gallery-results.json: PASS trên 155.0.4283.45; 12 ảnh decode, cả 2 video phát/tua được. evidence-index.json khóa hash media và gallery. Source/dist đối chiếu lại sau capture đều khớp. Các ảnh smoke không được dùng làm bằng chứng cuối.

Chưa kiểm điện thoại thật, Safari/Firefox, bật/tắt preference bằng UI hệ điều hành, màn hình DPR cao thật, HTTPS/PWA/deploy mới hoặc đánh giá contrast toàn bộ nền động. Reduced-motion/viewport/fallback được mô phỏng trong Browser. Không commit/push/deploy. G1/G2 vẫn chờ người dùng xem bản mới; V9/G3 chưa chạy.
