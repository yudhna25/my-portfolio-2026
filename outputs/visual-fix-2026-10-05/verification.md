# Hoàn thiện phần OpenCode — 05/10/2026

Phạm vi: bốn góp ý về sao, camera và hố đen; tiếp tục từ shader đang sửa dở sau task 1.8. Các file cũ được lưu dưới dạng `*.before.txt` để đối chiếu, không reset các thay đổi khác của workspace.

## Kết quả và nguyên nhân

- `buildStarGeometry.js`, `StarField.jsx`: giữ phân bố hướng cầu và tỷ lệ 82/15/3, chuyển sang vỏ xa 280–340 đơn vị có tâm đi cùng camera. Sao nền không còn tiến qua camera hoặc phóng to khi tới gần hố đen. Kích thước là 0.8–3 CSS px, theo DPR thật, lõi sắc và dao động sáng nhẹ; sao vẫn được loại khỏi bloom.
- `cameraPath.js`, `CameraRig.jsx`: đường x cũ `sin(2.5πp)` chỉ có 2.5 nhịp và khởi đầu về phải. Bản cuối `-sin(5πp)` có năm nhịp trái–phải–trái–phải–trái; z 0 → -160, lookAt x 0 → -6. Endpoint khoảng (-3,0,-160), cách tâm (0,0,-200) khoảng 40.11 đơn vị. Damping theo delta để tốc độ hội tụ ổn định theo FPS. FOV portrait mở rộng để hố đen vẫn nằm trong khung.
- `BlackHole.jsx`: lỗ ở UV của đĩa nghiêng cũ không tương đương bóng đen trong ảnh camera. Đĩa vẫn chiếu qua phía trên bóng đen. Tách bloom ra vẫn tái hiện lỗi; bloom làm lỗi nặng hơn. Thay bốn mesh rời bằng một shader tạo đĩa nghiêng, ánh sáng bị bẻ cong phía trên/dưới, vòng photon và vùng bóng đen chung tọa độ camera. Độ sáng lệch trái/phải giữ cố định, chỉ các dải khí xoay; bỏ outline ellipse như đường quỹ đạo. Depth write tại phần shader có hình giúp sao không tô lên bóng đen.
- `BlackHoleBloomMask.jsx`, `GalaxyScene.jsx`: mask cuối chuỗi hiệu ứng khôi phục vùng bóng đen sau blur, theo projection của camera mỗi frame. Không che đĩa/vòng photon. Vẫn một composer, SelectiveBloom chỉ một mesh hố đen, giữ intensity 0.7 / threshold 0.85 / smoothing 0.1 / radius 0.75 / mipmapBlur / MSAA 0.
- `Nebula.jsx`: giảm alpha và fade mép billboard, loại khung chữ nhật xám rõ trong bản trước.
- `3d-lab.jsx`, `3d-lab.html`: lab dùng trực tiếp `GalaxyScene`, không giữ bản sao shader/camera. Bridge native scroll vào store có cleanup; HUD trong `src/3d/components/LabTelemetry.jsx`, text trong namespace `lab` Vi/En, styling Tailwind. Reduced motion và visibility do scene production xử lý.

Hố đen là shader xấp xỉ hình ảnh theo góc quan sát, không phải ray tracer thuyết tương đối. Theme mono được giữ. Tham khảo trực tiếp [NASA SVS](https://svs.gsfc.nasa.gov/13326), [giải thích NASA](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/) và [ảnh sao Hubble](https://esahubble.org/images/opo1801a/). Ảnh NASA ở đây là mô phỏng; ảnh Hubble là quan sát với độ phơi sáng khác cảnh nền portfolio.

## Kiểm chứng

- `npm run build`: pass (Vite + PWA), còn warning bundle >500 kB đã có trước.
- `npx eslint src/3d src/3d-lab.jsx`: pass.
- `npm run lint`: vẫn 2 errors cũ tại `Preloader.jsx`, `Work.jsx` và 2 warnings cũ tại `SplashCursor.jsx`; không thêm issue.
- `node outputs/visual-fix-2026-10-05/check-geometry.mjs`: pass. Seed cố định, 10k sao phủ tám octant (1,200–1,303/octant), mean direction <0.025; 8,225 tiny / 1,498 medium / 277 bright; năm dấu x đúng, endpoint và vị trí bên phải đúng (`geometry-results.json`).
- Browser localhost:5173, fixture chạy components production trong StrictMode; pixel được đọc sau render/composer, giữ cùng camera và shader time khi so sánh selection đầy/rỗng.
- Baseline tối giản chỉ thay shader hố đen về bản OpenCode, giữ cùng scene và camera hiện tại: `baseline.json` FAIL. Vùng lõi (bán kính 65% bóng đen) chỉ 32.29% pixel tối khi bật bloom, mean 45.90/255; selection rỗng vẫn chỉ 74.16% pixel tối, mean 38.60/255. Đây là repro trực tiếp của lỗi, không phải chỉ kiểm tra code nguồn.
- Bản cuối desktop: `final-desktop.json` PASS, 100% pixel vùng lõi RGB 0 khi bật bloom hoặc selection rỗng; khoảng 66k pixel quanh đĩa tăng >3 mức sáng, ngoài vùng hố đen không pixel nào tăng >3; framebuffer mono (0 pixel lệch RGB >4).
- `journey-desktop.json`: 7/7 vị trí p=0,0.1,0.3,0.5,0.7,0.9,1 pass. Các quadrant có sao ở mọi pose, tâm star field đi cùng camera (offset 0), kích thước tối đa <3 CSS px. Mật độ trung tâm/ngoài khoảng 1.35–1.46 do phép chiếu phối cảnh; không tuyên bố bằng nhau tuyệt đối theo pixel. Camera đạt năm nhịp và hố đen bên phải cuối hành trình. FPS khoảng 165.34 trong lượt 3.3 giây, browser hoạt động, 1101×930 DPR 1; không phải cam kết cho mọi máy.
- `bloom-off.json`: pass, lõi đen 100%, composer 0.
- `cleanup.json`: 3 created / 3 disposed, peak 1, live 0, canvas removed true.

- `journey-mobile.json`, `final-mobile.json`: 390×844, tier low 1,500 sao, 7/7 pose pass; lõi đen 100%, glow quanh đĩa và không tăng >3 mức sáng ngoài vùng hố đen. Endpoint center x≈246/390 ở bên phải, đĩa nằm trong khung portrait. FPS khoảng 165 trong lượt trên máy dev.
- `final-tablet.json`: 900×900, tier medium 4,000 sao, core/glow/mono/programs pass.
- `reduced-motion.json`: mô phỏng media query trước khi import hook; 7/7 pose có camera [0,0,0], shader time 0 → 0; core pass. Không thay đổi tùy chọn OS.
- Locale `lab` Vi/En: parity 27 string keys pass. Lab endpoint dùng scene production; ảnh `preview.png` và `mobile-lab.png`. Lượt load sạch không có console error (`console-clean.json`); warning Clock của Fiber vẫn có như giới hạn phía dưới.

- `app-smoke.json`: App chính mount 1 Canvas, quality high, ScrollSmoother wrapper có mặt, preloader đã mở khóa body, console errors 0 trong lượt load sạch.

## Chạy lại

Chạy `npm run dev`, mở `/outputs/visual-fix-2026-10-05/qa.html`, chọn Pose 1 rồi Measure core + glow hoặc Run journey + FPS. Thêm `?baseline` để chạy bản shader trước sửa và thấy core test fail. `/outputs/visual-fix-2026-10-05/reduced.html` mô phỏng media query trước khi hook production được tải. Fixture chỉ nằm trong outputs, không nhập vào App/bundle production. `/3d-lab.html` là trang preview dùng scene production, hiện vẫn là entry dev như prototype cũ.

Giới hạn: warning THREE.Clock deprecated từ Fiber vẫn có; không sửa node_modules hoặc suppress warning. Reduced motion cần phân biệt kiểm tra media API mô phỏng với bật tùy chọn OS thật. Trang portfolio WIP vẫn có nền section đục che Canvas như đã ghi ở task 1.6/1.8; thay đổi lần này sửa scene và lab, chưa migrate các section WIP.
