# Task 1.7 — CameraRig scroll-linked

05/10/2026 — Codex.

## Triển khai

- Tạo `src/3d/components/CameraRig.jsx`, named export, gắn trước StarField trong GalaxyScene.
- Đọc `useScrollStore.getState().scrollProgress` trong useFrame: không đo scrollY, không subscribe progress để render React.
- Giữ đúng prototype: z += (progress × 110 − z) × 0.12; x += (mouse.x × 1.1 − x) × 0.04; y += (−mouse.y × 0.7 − y) × 0.04; lookAt(0,0,z−100).
- Mouse tracker nằm ở module scope; pointermove listener do effect sở hữu và cleanup khi unmount. Camera lấy từ useThree selector rồi gán vào ref trong effect; chỉ mutate ref trong useFrame, không setState/allocate mỗi frame. ESLint React Compiler pass.
- GalaxyScene truyền `frozen` từ useReducedMotion có sẵn. Khi reduce: reset xyz=[0,0,0], lookAt(0,0,-100), bỏ qua scroll và chuột. Khi tắt reduce: lerp trở lại từ vị trí tĩnh.
- Không thêm ScrollTrigger scrub vì bridge đã cung cấp progress và prototype có lerp. Không sửa App, DOM animation, store, bridge, prototype, camera config, shaders hay postprocessing.
- GalaxyScene chỉ thêm import và JSX CameraRig. `unchanged-files.json` xác nhận hash prototype/store/bridge không đổi.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS, Vite 7.3.6 + PWA; warning chunk 3D >500kB vẫn có |
| ESLint CameraRig/GalaxyScene | PASS |
| Lint toàn repo | Trước/sau đều 2 errors + 2 warnings, không thêm issue: refs ở Preloader/Work, unsupported-syntax ở SplashCursor |
| Browser, frame có kiểm soát | 16/16 PASS, `browser-checks.json`; dùng real R3F advance ở 165 bước/giây, không thay code production |
| Hệ số z/parallax | Frame đầu từ zero: z=13.2; pointer góc phải-dưới: x=0.044, y=-0.028 |
| Slow/fast/reverse scroll | Monotonic và bounded, không overshoot, reverse dùng z × 0.88; camera/renderer giữ identity |
| React commits | Không commit theo store update/useFrame; native lượt scroll/chuột giữ commits=2 |
| Scroll thật với ScrollSmoother | Wheel 360px / max2160 → progress=1/6, z=18.3333333333; cuối trang progress=1, z≈110 |
| Reduced motion mô phỏng | xyz=0 và quaternion ổn định qua 120 frame; Browser cuộn thật tới contact/progress=1 và di chuột vẫn xyz=0, hướng [0,0,-1] |
| Cleanup | Live mouse listeners=0; adds=removes=1, peak=1; camera không đổi sau unmount/store/pointer; Canvas và Smoother được gỡ, `cleanup.json` |
| Trang chủ WIP | Preloader hoàn tất/body mở scroll; đúng 1 Canvas; scrollY=maxScroll=3657, Smoother transform y=-3657; nền scene rgb(5,5,5); không React error, warning GSAP target cũ còn có (`home-check.json`) |
| Native media query | Browser đọc reduce=false trên OS hiện tại, `native-motion.json`; chưa bật/tắt Windows trực tiếp |

Fixture `camera-qa.html/jsx/css` nằm trong outputs, không import bởi App/build. MatchMedia override, controls, profiler và DOM metrics chỉ nằm trong fixture. `?native-motion` dùng media query thực và vô hiệu hóa các bài mô phỏng. HMR fixture cleanup root trước reload.

## Hiệu năng và giới hạn

Lượt Browser native ghi nhận 165fps tại scroll 0, 1/6 và 1; 7 draw calls. Đây là các snapshot useFrame của máy dev, không phải benchmark đa thiết bị. Lượt simulator trước đó bị giới hạn khoảng 1fps khi chạy nền; 16 bài dùng advance để kiểm hệ số/continuity, không dùng các bước advance làm bằng chứng FPS. Xem `native-manual-scroll.json` và `camera-native-end.png`.

Có một warning Three.Clock deprecated từ dependency Fiber, đã có từ trước. Lượt QA bị HMR trước khi thêm dispose root có một createRoot warning trong console lịch sử; lượt tải sạch không có error React. `console.json` giữ nguyên lịch sử để không che lỗi fixture; `native-motion.json` là console lượt sạch.

Quỹ đạo yêu cầu z=progress×110 đi từ 0 tới +110, trong khi BlackHole ở -200: camera nhìn về -z và **đi xa hố đen**, không tiến tới nó. Giữ đúng hệ số và hướng prototype theo ràng buộc người dùng; phù hợp mục 7.1 dòng Scroll “camera zoom out”. Intro tiến về hố đen là timeline Hero riêng, không triển khai trong task này. Camera không thể xuyên hố đen với quỹ đạo hiện tại.

WIP trang chủ có nền DOM đục che scene (đã ghi ở task 1.6). Dùng fixture nội dung trong suốt để kiểm tra chuyển động 3D; không đổi UI WIP để lộ Canvas. Công cụ Browser phiên này không có native app control, nên chưa verify thao tác bật/tắt reduced-motion trực tiếp trong Windows.

API đối chiếu: [R3F useFrame/useThree](https://r3f.docs.pmnd.rs/api/hooks), [Three Object3D lookAt](https://threejs.org/docs/pages/Object3D.html).
