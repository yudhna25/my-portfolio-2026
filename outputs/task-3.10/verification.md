# Task 3.10 — DOM parallax

Ngày 06/10/2026. Đọc kế-hoạch.md 4.3 và sections hiện hành; áp dụng gsap-scrolltrigger, gsap-performance, gsap-react, Ponytail full.

- 0.3: hai heading nền Experience/Playground, mono opacity 0.035, absolute/aria-hidden/pointer-events-none, lấy text qua key i18n hiện có. Foreground heading và SplitText giữ riêng.
- 0.5: ảnh About dùng scrub 1 / ease none. Biên dịch chuyển tính từ 20% overscan sẵn có; trong đoạn giữa khung, tăng scroll 20px làm y tăng 10px, đúng tốc độ 0.5. Ngoài biên giữ ảnh tại đầu/cuối range để không lộ mép crop. Trigger đo trên avatar-col tĩnh, không trên lớp clip reveal của task 3.8.
- 0.8: cả ba marquee, data-speed trên band; ScrollSmoother effects dùng scrub native, loop ngang vẫn ở marquee-track riêng.

Tái dùng ScrollSmoother/useGSAP và tween About hiện có; loại ảnh crop khỏi selector effects để chỉ có một owner ghi y. Không thêm library/helper, không animate top/left/width/height, không sửa 3D. Reduced-motion: media context kill Smoother effects; About context revert scrub, mọi parallax y về 0.

Phần task sửa 5 file: useSmoothScroll.js, About.jsx, Marquee.jsx, Experience.jsx, Playground.jsx. Giữ cập nhật clip reveal task 3.8 và hover task 3.9 ở cùng workspace; baseline.json và changed-files.json ghi lại trạng thái. 33 file App/Hero/GSAP setup/3D/stores/tokens bảo vệ bằng SHA-256.

Kiểm chứng Browser dùng App thật trong StrictMode, 6 targets. Đo y trước/sau cuộn (heading/marquee 120px, avatar 20px), ratio/scrub, reverse, offsetTop/offsetLeft/offsetWidth/offsetHeight và scroll extent không đổi; ảnh không vượt crop, không overflow ngang, 1 Canvas. Vi/En giữ DOM heading nền, không SplitText ở lớp trang trí. Hai vòng live motion kiểm tra 5 native effects/1 avatar scrub khi normal và 0 khi reduced, không detached trigger.

Dev HMR từ các task song song đã restart một lượt kiểm tra. Vì vậy QA cuối dùng build snapshot độc lập ở 127.0.0.1:5184, không hot reload; build snapshot pass 4.74s, không thay cấu hình build production. serve-qa.mjs có thể tạo lại snapshot để kiểm tra thủ công.


## Kết quả cuối

- Production build pass (5.34s); ESLint toàn repo exit 0, 0 errors / 2 warnings cũ tại SplashCursor.jsx. Build còn cảnh báo chunk >500KB.
- Desktop 1440×900: 55/55 checks. Production mobile 390×844: 55/55 parallax checks và 26/26 lifecycle checks (browser-mobile.json chứa tổng 81); reduced-motion từ đầu 1280px: 28/28. browser-lifecycle.json chứa bản riêng 26 checks, không cộng lại để tính tổng.
- Mọi pose có 6 targets, không overflow ngang, 1 Canvas; offset/layout/scroll extent giữ nguyên trước và sau parallax. Reverse/scrub/ratio/crop pass. Locale đổi 4 lần, reduced-motion đổi 4 lần; 5 native effects + 1 crop scrub được cleanup/recreate đúng.
- Console hai phiên production: 0 errors; mỗi phiên có 1 warning THREE.Clock cũ.
- Nhịp GSAP ticker khi cuộn: desktop ~165.0fps, mobile ~163.8fps trên máy dev; đây là nhịp animation DOM, không phải phép đo riêng GPU/Canvas hay đảm bảo cho mọi thiết bị.
- Reduced-motion mô phỏng matchMedia trong trang QA (cả reduce/no-preference), chưa đổi cài đặt OS thật. Snapshot tránh HMR từ các task song song; desktop speed checks đã chạy ở dev cùng phiên bản 5 file và có hash đối chiếu.

Tham khảo chính thức: [ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/) và [effects](https://gsap.com/docs/v3/Plugins/ScrollSmoother/effects/). Tốc độ native dùng data-speed; ảnh crop giữ custom scrub giới hạn biên để không tràn khung.

Chạy lại check bằng `node outputs/task-3.10/check.mjs`; mở QA bằng `node outputs/task-3.10/serve-qa.mjs`, URL http://127.0.0.1:5184/outputs/task-3.10/qa.html (`?reduce` cho fresh reduced).

![Experience: heading nền và marquee](./experience-desktop.png)
