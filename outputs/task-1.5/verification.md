# Task 1.5 — GalaxyScene

Kiểm chứng ngày 04/10/2026. Agent: Codex.

## Triển khai

- `src/3d/GalaxyScene.jsx`: Canvas persistent, div fixed/inset-0/z-0, pointer events tắt cả trên wrapper Canvas; nhận children R3F và Suspense cho các scene asset về sau. App lazy-load scene và đặt nó ngoài smooth-wrapper; wrapper DOM có z-10.
- Giữ camera `[0, 0, 0]`, fov 60, near 0.1, far 400; DPR `[1, 1.75]`; antialias false, powerPreference high-performance; background `#050505`, giống prototype. Không dùng manual color conversion.
- Visibility dùng useSyncExternalStore: frameloop always khi visible, never khi document.hidden; không tạo lại renderer khi đổi visibility.
- `src/3d/components/SceneBoundary.jsx` giữ ErrorBoundary từ prototype; `SceneFallback.jsx` giữ thông điệp static, dùng translation keys trong namespace scene. Thêm `src/i18n/locales/vi/scene.json` và `en/scene.json`, dùng cấu hình i18n Task 1.4 đã có trong workspace.
- `src/3d/hooks/useScrollProgress.js`: bridge actual window.scrollY → useScrollStore; clamp 0..1, currentSection theo section/footer id tại reading line 35% viewport. Hero WIP chưa có id thì dùng mặc định hero. Tự nhận thêm section ids ở các phase tiếp theo.
- Section positions cache sau load/resize/ScrollTrigger refresh; trừ transform chung của smooth-content để không nhầm smoothed position với scrollY thật. Không dùng ScrollSmoother.offset vì API này tạo trigger và có thể refresh lại trong startup. Listener passive, gộp scroll updates bằng rAF, chỉ ghi store khi giá trị đổi; cleanup hủy listener/rAF.
- `src/3d/hooks/useMediaQuery.js`: matchMedia + useSyncExternalStore, subscribe/unsubscribe; GalaxyScene chọn high desktop, medium tablet 768–1023px, low mobile <768px, thể hiện qua data-quality. DPR/config renderer giữ đúng prototype; particle/effect budget sẽ được áp dụng khi các children task 1.6/1.8 được thêm.
- Chỉ sửa App để nối hook/lazy Canvas/layering, và cập nhật comment useScrollStore. Không thay UI sections, prototype, vite.config hay dependency versions. Không có StarField/Nebula/CameraRig/post-processing mới.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS; Vite 7.3.6 + PWA build hoàn tất |
| npm run dev | Server workspace đang chạy ở localhost:5173; thử mở server khác cùng cổng báo port occupied, dùng server hiện có |
| ESLint phần sửa | PASS: src/3d, App.jsx, useScrollStore |
| npm run lint | 2 lỗi refs cũ Preloader/Work, 2 cảnh báo unsupported-syntax cũ SplashCursor; before/after đều 4 issue, không thêm issue |
| check-stores.mjs | PASS |
| R3F/lifecycle fixture | 14/14 PASS: config/camera/background, children, full viewport, 1 smoother, progress/section, visibility pause/resume, unmount cleanup |
| No-WebGL fixture | 3/3 PASS: chặn getContext WebGL trong document fixture; fallback thay Canvas, DOM/smoother và bridge vẫn hoạt động |
| Scene child error | 3/3 PASS: lỗi được SceneBoundary bắt; fallback/DOM/scroll vẫn hoạt động |
| Responsive resize | Mobile 390×844: canvas 380×844/tier low; tablet 850×900: canvas 840×900/tier medium; desktop 1280×720: canvas 1270×720/tier high. 10px còn lại là scrollbar. Viewport đã reset |
| WIP FPS rAF | Phiên sạch sau preloader: ~162–165 FPS; lúc bắt đầu wheel có sample 159 FPS; tại cuối trang ~162–165 FPS, đều trên 120. Đây là rAF của App, số frame R3F đo riêng ở dòng dưới |
| Scene FPS | useFrame đếm frame mỗi giây như prototype: khoảng 164–165 FPS; 10 sample cuối đều 165 FPS. Đo khung Canvas chưa có set pieces/post-processing |
| Pixel nền | Screenshot scene.png tại pixel (900,680): RGB (5,5,5), đúng #050505 |
| Trang WIP thật | 1 canvas ngoài smooth-content, fixed z-0/pointer none; DOM wrapper fixed z-10; preloader kết thúc/unlock; wheel scroll hoạt động |
| Store trên WIP | Wheel qua About: 1440/3534 = 0.4074703, currentSection about; cuối trang: progress 1, currentSection contact |
| Console trang chính | Không error; còn warning target GSAP của WIP và THREE.Clock deprecated từ phiên bản Fiber/Three hiện có |

## Phạm vi và giới hạn

- WIP đang có background đục ở nhiều section nên Canvas nằm phía sau các nền đó. Đây là khung tích hợp; foreground UI và các set pieces sẽ làm ở phase/task tương ứng.
- Kiểm thử hidden dùng override document.hidden + visibilitychange chỉ trong fixture, xác nhận frameloop và số frame dừng/resume. Không thay cờ WebGL hay tùy chọn OS/browser của người dùng.
- Không thêm chuyển động 3D trong task này. Reduced motion của DOM vẫn đi qua useSmoothScroll/useReducedMotion đã có; children animation ở task sau cần sử dụng preference đó. Frameloop visible luôn always theo yêu cầu task.
- Build có cảnh báo chunk 3D khoảng 932KB minified (252KB gzip); scene đã lazy-load. Không sửa cấu hình Vite để bỏ cảnh báo.
- FPS đo trong fixture đang chạy; HMR, thay viewport và các tab QA chạy đồng thời có thể làm sample dao động, không dùng các sample chuyển tiếp đó để đánh giá steady state. Kết quả này không dự đoán FPS sau khi thêm shaders/post-processing.

## Chạy lại

- `/outputs/task-1.5/scene-qa.html`: config, scroll, visibility, FPS; nút Test unmount cleanup kiểm listener/renderer cleanup.
- Thêm `?no-webgl` hoặc `?scene-error`: kiểm hai đường fallback.
- Thêm `?app`: App WIP với panel state/FPS rAF; cuộn bằng wheel. Panel/overrides nằm trong outputs, không được import vào production App.
- `scene-results.json`, `cleanup-results.json`, `fallback-results.json`, `mobile.json`, `tablet.json`, `app-state.json`, `home-results.json` chứa evidence; ảnh home.png, scene.png, mobile.png, fallback.png.

## API đã đối chiếu

- [R3F Canvas, frameloop, camera và fallback](https://r3f.docs.pmnd.rs/api/canvas)
- [R3F performance và color management](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [ScrollSmoother native scroll và fixed elements](https://gsap.com/docs/v3/Plugins/ScrollSmoother/)

