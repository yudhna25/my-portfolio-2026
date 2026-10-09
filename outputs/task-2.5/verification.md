# Task 2.5 — Hero / Gateway to the Galaxy

Ngày hoàn tất: 06/10/2026 · Agent: Codex · ✅ Xong

## Phạm vi triển khai

Viết lại src/components/Hero.jsx và đổi đúng màu nền bao ngoài của src/App.jsx thành transparent. App đã truyền active={!loading}, giữ nguyên cách nối này.

- Hero trong suốt, tối thiểu toàn màn hình; dùng dvh khi được hỗ trợ. Lớp DOM pointer-events none, không tạo CTA mới hoặc Canvas.
- Tên lấy từ hero.name, bố trí hai dòng, Unbounded 800; clamp(44px,12vw,200px), tracking -0.02em, màu --text-primary (#FAFAFA).
- Sau active và font ready: tên bắt đầu ở 1.5s (SplitText chars, stagger 0.03, expo.out); tagline ở 2.0s (ScrambleText 1.2s); sub-tagline ở 2.3s; indicator ở 2.5s. Chevron nhấp nháy/dịch nhẹ bằng GSAP.
- Một tween ScrollTrigger scrub 1 làm content opacity 1→0 / scale 1→0.94. Scroll không dùng lại timeline intro và không điều khiển camera.
- Reduced-motion hiện text thẳng, không split/scramble/pulse/scroll animation. Live preference change revert các effect cũ.
- Toàn bộ text dùng hero.*; h1 có accessible name đầy đủ, text đang scramble aria-hidden và có bản sr-only ổn định.
- useGSAP scope/revertOnUpdate, contextSafe cho callback font ready, guard hủy callback sau cleanup. Name key theo locale để SplitText revert không ghi đè text mới.
- Mobile tăng khoảng cách giữa tên/tagline để role không nằm trên dải bồi tụ sáng.

Các mốc camera/stars 0/0.5/1.2s trong plan thuộc scene; phiên Hero này không bổ sung hoặc thay đổi animation 3D. CameraRig hiện có vẫn đọc scroll store như trước. Không thêm nền đục, gradient màu hoặc glow.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS, Vite 7.3.6 + PWA; build cuối gồm cả tích hợp Skills đang làm song song |
| npm run lint | 0 errors, 2 warnings cũ SplashCursor.jsx |
| Dev | localhost:5173, tái sử dụng server đang chạy |
| Browser normal + scene | 37/37 PASS, check-normal.json |
| Browser reduced từ mount | 25/25 PASS, check-reduced.json |
| Timeline | Seek trước/sau từng mốc xác nhận đúng thứ tự; tagline hoàn tất đúng string i18n |
| Camera | QA chỉ đọc pose qua useFrame trong GalaxyScene children; khi scroll, CameraRig có sẵn đổi pose, Hero không sửa camera |
| Lifecycle | StrictMode, active true/false, Vi/En, live motion change, unmount trước font callback: không giữ intro/exit/split/smoother cũ |
| App thực | Reload nhìn preloader rồi Hero; chỉ 1 Canvas, sao/hố đen thấy qua nền DOM |
| Native scroll App | 288px: opacity 0.6066, scale 0.9764; qua Hero opacity 0; về đầu opacity/scale 1 |
| Responsive App iframe | 320×800, 390×800, 768×800, 1920×1080, 1280×390; tên không tràn ngang, sub-tagline không đè indicator |
| Font | 320: 44px; 390: 46.8px; 768: 92.16px; 1280: 153.6px; 1920: 200px. Dấu Vi đầy đủ |
| Console | App, normal, reduced, responsive: 0 errors; chỉ THREE.Clock deprecation cũ |

Ảnh: hero-desktop.png, hero-mobile.png, hero-scroll.png, hero-reduced.png. Số đo: responsive-metrics.json, app-scroll-metrics.json, console.json.

Reduced-motion được mô phỏng qua MediaQueryList trước khi import hook, có dispatch change để kiểm tra chuyển trực tiếp. Chưa toggle OS thật. Responsive dùng iframe cùng origin với App thật, không thay viewport OS. Landscape được phép tăng chiều cao section để giữ đủ nội dung. Build còn cảnh báo chunk >500KB cũ.

## Các thay đổi song song

Trong cùng checkout, chat “Task chẵn” đang triển khai task 2.8 Skills. Nhật ký của chat đó xác nhận cập nhật App.jsx, GalaxyScene.jsx, OrbitalSkills.jsx và hai locale. Phiên Hero giữ các thay đổi đó, không sửa file src/3d hoặc locale.

protected-hashes.verify.json ghi nhận các khác biệt song song ở GalaxyScene/locales. camera-shader-tokens.verify.json xác nhận CameraRig, cameraPath, shaders, StarField, BlackHole và CSS tokens vẫn khớp hash đầu phiên. Nhóm hero.* Vi/En giữ nguyên nội dung đã đọc lúc bắt đầu, lưu trong hero-content.verify.json.

## Chạy lại

Chạy npm run dev, mở http://localhost:5173/outputs/task-2.5/check.html?scene rồi nhấn Run check. Dùng ?reduced cho check reduced từ mount; ?preview&reduced&scene để xem Hero + scene tĩnh. Mở responsive.html để xem App ở các kích thước đã kiểm tra.

QA dùng component/hook/store/scene thật; lagSmoothing(0) chỉ nằm trong fixture để tab nền hoàn thành tween. Source trước khi sửa lưu ở Hero.before.jsx và App.before.jsx.

Áp dụng frontend-design, high-end-visual-design, gsap-timeline, gsap-plugins, ui-ux-pro-max, galaxy-portfolio. UI/UX CLI dùng Python đã có trong runtime, đối chiếu Portfolio Grid/mono và React effect cleanup; không đổi design system hoặc thứ tự section theo các gợi ý ngoài spec.
