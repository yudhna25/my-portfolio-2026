# Task 3.2 — Contact black-hole transition

Hoàn thành 06/10/2026 tại `D:\Projects\my-portfolio-2026`.

## Thay đổi

- `src/components/sections/Contact.jsx`: thay reveal một lần bằng một timeline scrub `contact-approach`, gắn section mới `#transmission` (Footer WIP đang dùng `#contact`). Range `top bottom` → `top 15%`, scrub 0.45s, không pin/snap. Timeline điều khiển một scalar 0→1 và reveal hai dòng heading + copy bằng transform/opacity; giữ nguyên nội dung i18n, email/magnetic/glow pulse.
- `src/stores/useScrollStore.js`: thêm `contactProgress` và setter hữu hạn/clamp 0..1, bỏ qua giá trị lặp. Contact là chủ timeline; CameraRig và BlackHole đọc state bằng `getState()` trong frame, không subscribe React theo từng tick. Cleanup `useGSAP` reset scalar về 0; đổi ngôn ngữ/reduced-motion không tạo trigger trùng.
- `src/3d/components/CameraRig.jsx`: giữ nguyên `cameraPath`/parallax/lookAt/easing toàn trang; thêm offset z = −2 × contactProgress. Camera thực sự tiến về tâm z=−200. Hero có progress Contact 0, offset 0. Không có tween GSAP thứ hai tranh quyền điều khiển camera.
- `src/3d/components/BlackHole.jsx` + `src/3d/shaders/blackHole.js`: uniform `uDiskIntensity` mặc định 1, tăng tối đa 1.45 từ cùng scalar. Nhân vào emission trong HDR ray shader, trước copy/bloom. Không tăng màu nền/alpha hoặc nhân toàn framebuffer; tia bị horizon hấp thụ vẫn zero. Không thay geodesics, vật liệu, bloom parameters, composer hoặc mask.
- Contact dùng gradient mono bán trong suốt để Canvas hiện phía sau; veil mạnh hơn trên mobile/tablet và phía text desktop, backplate đen 90% cho email/social/phone. Không glow ngoài CTA, không thay Footer WIP.
- Reduced-motion: không timeline scrub hoặc pulse của Contact; copy opacity 1 / transform none; camera Contact ở pose cố định `cameraPath(1)` + offset −2z = khoảng `[-3.5, 0.18, -193]`, disk intensity 1.45 và thời gian shader dừng. Ngoài section transmission, giữ pose frozen cũ `cameraPath(0)` / intensity 1. Thay pose ngay ở ranh giới section, không interpolated camera animation.
- `kế-hoạch.md` mục 7.8: thay mô tả wormhole/portal bằng transition hố đen đúng R3-Q3. Không sửa Hero/App/GalaxyScene hoặc thêm Canvas/dependency/texture asset.

## Kiểm chứng

- `npm run build`: PASS, Vite/PWA; còn cảnh báo chunk >500KB hiện có (Fiber/events ~920KB, main ~507KB).
- `npm run lint`: 0 errors, 2 warnings cũ `SplashCursor.jsx` (inline class).
- `node outputs/task-3.2/check.mjs`: PASS — clamp/invalid values, endpoint an toàn, SHA-256 Hero/path/compositor/mask không đổi, uniform đúng HDR shader.
- `node outputs/task-3.2/check.mjs --browser`: trang App thật, dev `http://127.0.0.1:5173/`, Edge/Playwright runtime có sẵn. 10 Contact poses + 4 Hero poses; screenshot và JSON tại thư mục này.
- Scrub 0 / 0.25 / 0.5 / 0.75 / 1: camera z giảm liên tục, z khớp `cameraPath(scrollProgress).z − 2 × contactProgress` trong sai số 0.003; GPU uniform thực khớp 1 / 1.1125 / 1.225 / 1.3375 / 1.45. Text đạt opacity 1 ở cuối; cuộn ngược về giữa đưa opacity xuống lại.
- Đo GPU uniform qua `gl.info.programs` → native WebGL `getUniform`, không lấy giá trị từ state để giả định shader đã cập nhật. Shader pass không phát sinh WebGL error.
- Hero normal/reduced-motion, scroll 0/180: camera/quaternion/text opacity/transform khớp baseline trước sửa; Contact progress 0 và GPU intensity 1 ở cả bốn pose. `Hero.jsx`, `cameraPath.js`, `BlackHoleSystem.jsx`, `BlackHoleBloomMask.jsx` giữ SHA-256 nguyên vẹn.
- Ba vòng Contact → Hero → Contact: duy nhất một trigger `contact-approach`; intensity về 1 ở Hero. Resource plateau 11 geometries / 23 textures / 13 programs / 8 frame subscribers. Các textures thuộc pipeline render target/bloom/LUT hiện có; task không load texture asset mới.
- Responsive 320 / 768 / 1440 / 1920: không tràn ngang, hai dòng heading hiện đủ, một Canvas. Đổi En lúc Contact đang hiện: timeline dựng lại đúng pose, một scrub trigger. Email giữ `mailto:anhduy25work@gmail.com`.
- Live reduced-motion: 0 Contact triggers, không ScrollSmoother, pose cố định và GPU uTime không đổi sau 650ms; text opacity 1 / transform none. Quay về Hero khớp baseline reduced; chuyển lại normal có đúng một scrub trigger.
- FPS 165.2 khi native wheel cuộn qua transition (331 frames / 2s), high 24.000 sao, RTX 4060 / Edge ANGLE D3D11 / DPR 1. Đếm callback frame thực của Fiber, không suy FPS render từ một vòng requestAnimationFrame riêng.
- Console App: 0 errors; còn warning `THREE.Clock deprecated` từ thư viện cũ. Không suppress warning. Không thay các effect ShootingStars/FloatingObjects đã có trong scene.

## Bằng chứng và giới hạn

- `baseline.json`, `baseline-hero.png`: source hashes và bốn Hero poses trước sửa.
- `browser-results.json`: camera/quaternion/GPU intensity/text/trigger/resources/FPS/console.
- `contact-desktop.png`, `contact-mobile.png`, `contact-en.png`, `contact-reduced.png`: screenshots App thật.
- Browser Chrome plugin không có Chrome trên máy; dùng Edge và Playwright đã có, không cài thêm. Reduced-motion dùng Browser media emulation, chưa toggle OS trực tiếp. FPS là máy dev DPR1, không khẳng định trên mobile thật.
- Dev HMR có thể tạo module URLs khác nhau. Probe import đúng resource URL đang được trang dùng, tránh đọc một store/Fiber registry cũ.
- Lịch 3.2 trước đó chỉ là thẻ đề xuất, chưa được kích hoạt. Phiên này thực hiện sau khi người dùng hỏi trạng thái; giờ bắt đầu đã qua mốc hẹn 03:44 ngày 06/10/2026. Không có automation 3.2 đang hoạt động để xóa.

## API đã đối chiếu

- [GSAP ScrollTrigger / timeline scrub](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Fiber useFrame / cleanup](https://r3f.docs.pmnd.rs/api/hooks)
- [Three.js ShaderMaterial uniforms](https://threejs.org/docs/pages/ShaderMaterial.html)
