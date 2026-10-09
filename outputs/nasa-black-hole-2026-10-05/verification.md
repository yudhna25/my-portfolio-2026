# NASA black hole visual update — 05/10/2026

## Kết quả

Scene dùng chung giữa portfolio và 3D Lab đã chuyển từ mặt phẳng giả lập sang truy vết tia sáng Schwarzschild theo góc camera. Giữ **đen–trắng** theo phản hồi của người dùng. Đĩa phía trước có thể đi ngang bóng hố đen; ảnh đĩa phía sau bị bẻ cong thành cung trên/dưới, các ảnh bậc cao tạo vòng photon. Phía trái sáng hơn phía phải do Doppler; vân khí chuyển động với tốc độ quỹ đạo thay đổi theo bán kính.

Chuẩn hình ảnh: [NASA SVS 13326 — Black Hole Accretion Disk Visualization](https://svs.gsfc.nasa.gov/13326), NASA Goddard/Jeremy Schnittman. Phương trình tia: [Bruneton 2020, equation 8](https://arxiv.org/abs/2010.08735).

**Chưa xác nhận trùng 100% với NASA.** Đây là mô phỏng realtime với tích phân hữu hạn và texture khí procedural, không sử dụng dữ liệu fluid/temperature hay renderer gốc của NASA. Sao nền giữ mật độ góc đều nhưng chưa được truy vết lensing. Độ chính xác vật lý của toàn bộ ảnh và mức sai khác với từng pixel của NASA chưa được đo.

## Thay đổi

- `src/3d/shaders/blackHole.js`: RK4 cho tia Schwarzschild, horizon radius 1, ISCO radius 3, đĩa ngoài radius 14; giao cắt đĩa theo tia cong, vân khí/shear/Doppler mono.
- `BlackHole.jsx`: render HDR ray image một lần/frame vào render target, sau đó compositing đúng alpha; khôi phục render state trong finally, dispose material/geometry.
- `BlackHoleSystem.jsx`: sở hữu render target/resize/quality và một composer. Các tier 192/160/128 bước, giới hạn độ phân giải 1280/1024/768. SelectiveBloom chỉ chọn `accretion-disk`; intensity 0.3, threshold 1.0, smoothing 0.15, radius 0.55, mipmap blur, MSAA 0. Bloom nhẹ để giữ chi tiết mono.
- `BlackHoleBloomMask.jsx`: dùng chính HDR ray image để phục hồi pixel bị hấp thụ, thay lớp cắt tròn cũ; không xóa đĩa phía trước. Mặt đĩa/lensing/mask dùng cùng dữ liệu nên không lệch vị trí.
- `cameraPath.js`, `CameraRig.jsx`, `GalaxyScene.jsx`: mặc định `[0, 2.2, -168]`, tâm hố đen `[0, 0, -200]`, khoảng cách 32.08. Cuối `[-3.5, 0.18, -191]`, khoảng cách 9.66, bán kính trong mặt đĩa 9.66; camera nằm **trên vùng phát sáng** r=3..14, cao 0.18 trên mặt y=0. Giữ năm nhịp trái–phải, aim lệch trái cho hố đen bên phải; hiệu chỉnh theo horizontal FOV để quan sát vòng photon trên màn hình dọc/vuông. Parallax giảm về 0 ở cuối, không đi xuyên mặt đĩa. Reduced motion giữ pose khởi đầu gần.
- `StarField.jsx`, `quality.js`: 24k/12k/6k sao (trước 10k/4k/1.5k), vẫn vỏ cầu đi theo camera, điểm sáng sắc. Kích thước tăng từ 1x tới 1.08x, damping, tối đa khoảng 3.24 CSS px; reduced motion giữ 1x.
- `3d-lab.jsx`, lab locales Vi/En: quality mặc định theo breakpoint, cho phép chọn thủ công; thêm hiện/ẩn nội dung, mặc định ẩn để quan sát scene; 29 keys/locale. Dùng chung GalaxyScene, không shader prototype riêng.

## Verify

- `npm run build`: PASS; vẫn cảnh báo chunk size đã có trước.
- `npx eslint src/3d src/3d-lab.jsx`: PASS.
- `npm run lint`: 2 lỗi cũ Preloader/Work và 2 warning cũ SplashCursor; không thêm lỗi trong phần sửa.
- `node outputs/nasa-black-hole-2026-10-05/check-scene.mjs`: PASS, 1001 điểm camera giữ y>=0.18 và r>3; z tiến liên tục; năm nhịp weave đúng; endpoint nằm trên đĩa; mật độ octant của sao cân bằng; growth cap và 29 key Vi/En đúng.
- `check-geodesics.mjs`: PASS. Kiểm tra phân loại capture/escape hai phía của impact parameter tới hạn 3√3/2, conservation energy/angular momentum. Sai số energy lớn nhất trong mẫu thử khoảng 0.000155 high / 0.000508 medium / 0.00262 low. Đây là kiểm tra số học độc lập, không phải chứng nhận toàn bộ render NASA.
- Browser hành trình 7 pose desktop 1280×720/high 24k, tablet 900×900/medium 12k, mobile 390×844/low 6k: PASS; shader runnable, 0 pixel lệch màu, 0 pixel đen thuần bị bloom phủ, camera và ray uniforms khớp, sao đi theo camera, một HDR render/frame, một composer. Lượt đo trên máy dev DPR 1 khoảng 165 FPS; không suy rộng thành hiệu năng phần cứng mobile thật.
- Sau tinh chỉnh khoảng hở ở mép màn hình, đo lại endpoint cả 3 tỷ lệ; xem `final-endpoints.json`. Hành trình và điểm nhìn bên phải được giữ, disk foreground có thể phủ phần lớn màn hình ở cuối theo yêu cầu bay sát mặt đĩa.
- Reduced motion mô phỏng bằng matchMedia: 7/7 pose giữ `[0,2.2,-168]`, ray time 0 và growth 1x. Chưa toggle trực tiếp tùy chọn OS.
- Bloom comparison: selection chỉ `accretion-disk`, có tăng ánh sáng cục bộ, 0 pixel tăng >3 ở vùng sao xa, không phủ pixel bị hấp thụ. So sánh pixel đen với **bilinear HDR source** thực tế, không lấy nearest pixel ở biên.
- Cleanup: ray target 0, composer 0, canvas bị gỡ; peak composer 1. Không sửa node_modules hoặc tắt warning Clock.
- Lab: scroll Home/End, quality tự chọn mobile 6k, hiện/ẩn nội dung và native progress được kiểm tra bằng UI. Ảnh desktop/mobile start/end lưu cùng thư mục.

## Giới hạn hiện có

Portfolio chính vẫn có các section WIP nền đục che Canvas như báo cáo trước; kiểm tra hình ảnh chi tiết tại `/3d-lab.html`, nơi dùng đúng scene production. Main mount smoke: một Canvas high, preloader đã gỡ, 0 console error; vẫn warning GSAP target cũ. Warning `THREE.Clock` từ Fiber vẫn còn. Không có deploy/commit trong phiên này.

## Artifact

`journey-desktop.json`, `journey-mobile.json`, `journey-tablet.json`, `final-endpoints.json`, `reduced-motion.json`, `bloom.json`, `cleanup.json`, `cpu-results.json`, `geodesic-results.json`, `app-smoke.json`, build/lint logs; screenshots `desktop-start.png`, `desktop-end.png`, `mobile-start.png`, `mobile-end.png`. Các file `.before.txt` giữ lại trạng thái trước task.
