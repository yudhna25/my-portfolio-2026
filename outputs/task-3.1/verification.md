# Task 3.1 — Section set pieces

Hoàn thành 06/10/2026.

## Thay đổi

- Tạo `src/3d/components/Planet.jsx`: sphere `MeshStandardMaterial #111111`, viền trắng bằng shell BackSide `MeshBasicMaterial`, torus trắng nghiêng, ánh sáng mono. Không texture asset, shader mới, shadow hoặc bloom cho Planet. Geometry sphere 24 segments trên mobile / 40 trên desktop, torus 64 / 96.
- Tái dùng `OrbitalSkills.jsx` từ task 2.8: hai vòng + 10 vệ tinh instanced, pause checkbox và tốc độ quay giữ nguyên. Không tạo OrbitalRings trùng chức năng.
- Tạo `useSectionAnchor.js` từ phép căn vị trí đã chạy của orbital, dùng chung cho cả hai model. Một DOM bounds read/frame, mutate Three vectors/quaternions có sẵn, scale vào nhẹ 0.96→1; reduced-motion scale thẳng 1. Cửa sổ ngoài viewport: `visible=false`, ngừng cập nhật model và orbital ngừng quay.
- Mỗi model mount theo `useScrollStore.currentSection`, unmount ngoài section: không frame subscriber / lights / geometry của set piece ngoài section. R3F quản lý disposal.
- `GalaxyScene.jsx` tạm tháo hệ ray image/bloom khi ở About hoặc Skills, vì sprite/mask toàn màn hình của hố đen sẽ che foreground geometry. Hệ hố đen trở lại ở mọi section khác; không đổi vị trí, camera path, shader, bloom config hoặc prototype.
- App lazy-load Planet vào children của Canvas hiện có. About thêm một cửa sổ trang trí dưới avatar; nền section trong suốt, phần bio/caption giữ nền tối để chữ dễ đọc. Không đổi copy/i18n hoặc ảnh.

## Kiểm chứng

- `npm run build`: PASS (Vite 7.3.6), Planet chunk ~1.14KB; còn cảnh báo chunk >500KB hiện có.
- `npm run lint`: PASS, 0 errors / 2 warnings cũ trong SplashCursor.
- `node outputs/task-3.1/check.mjs`: PASS. Check checksum camera/hố đen/prototype/tokens/locales/drafts; 39/39 lifecycle/motion checks, 6 responsive poses, FPS, mono materials, no texture maps và console App.
- Browser dùng App thật trên Codex In-app Browser; native Nav About + wheel lên/xuống vẫn scroll, một Canvas ở ngoài smoother. QA cũng mount chính App, không dùng scene mô phỏng thay thế.
- Ba vòng About → Skills → Education: đúng model hiện/ẩn, hố đen trở lại ngoài About/Skills. About ổn định 6 geometries / 5 frame subscribers; Skills 8 / 6. Không tăng qua các lần quay lại.
- Sáu poses About/Skills tại 320×850, 768×1024, 1440×1100: model bám tâm cửa sổ dưới 2px, không tràn ngang; 6k/12k/24k sao đúng breakpoint. Canvas không gồm phần scrollbar 10px; media queries dùng chiều rộng viewport đầy đủ.
- Reduced-motion emulation trực tiếp: camera không đổi, góc quay orbital không đổi, scale Planet không đổi. Ngoài viewport, orbital ngừng quay. Hidden-document emulation: `frameloop=never`, **0 Fiber frames**; khi khôi phục, `always` trở lại. Không đổi preference OS thật.
- Native keyboard Space tại checkbox Skills: checked=true, hai mẫu rotation đều `[11.916143999994922, -7.447589999998136]`; bỏ pause vẫn được. Pointer check qua driver ở viewport override không đổi checkbox trong một lượt; dùng keyboard native để kiểm tra hành vi pause, không đổi code checkbox của task 2.8.
- **About 165.0fps / Skills 165.0fps**, mỗi lượt đo callback Fiber thực trong 2.5s, 414 frames; high 24.000 sao, DPR 1, NVIDIA RTX 4060 / ANGLE D3D11. About 6 draw calls / 4.196 triangles; Skills 8 / 1.188. Không suy ra FPS cho thiết bị mobile thật hoặc DPR khác.
- Không có texture map/asset trên set pieces. Three.js r186 tự upload **một DFG LUT nội bộ** khi compile MeshStandardMaterial; renderer memory textures=1 ở About/Skills, ổn định qua các lượt. Texture này thuộc renderer, không phải ảnh/texture được thêm cho model.
- App console: **0 errors**, warning `THREE.Clock deprecated` hiện có. Lỗi bootstrap i18n của trang QA trong lần dựng đầu đã được sửa bằng cùng import config như main; phiên kiểm chứng hoàn tất có `evidence.errors=[]`.
- No-WebGL emulation riêng: fallback “Chế độ xem tĩnh”, 0 Canvas, vẫn đủ 8 section DOM. Renderer bị cố ý từ chối WebGL trong QA; error boundary/fallback giữ nguyên.

## Bằng chứng / chạy lại

- `browser-results.json`: 39 checks, lifecycle, reduced/hidden và FPS.
- `browser-responsive.json`, `pause-keyboard.json`, `app-console.json`, `fallback.json`: dữ liệu Browser.
- `about-desktop.png`: ảnh App thật có avatar/bio/Planet, `about-mobile.png`: pose mobile.
- Chạy dev, mở `/outputs/task-3.1/qa.html`, dùng **Run lifecycle**, **About/Skills → Measure Fiber FPS** và **Capture**. `?reduce` khởi tạo reduced-motion; `?no-webgl` ép fallback. QA chỉ nằm trong outputs, không vào production entry.

## API đã đối chiếu

- [Fiber useFrame và cleanup](https://r3f.docs.pmnd.rs/api/hooks)
- [Three MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html)
- [Three Material sides](https://threejs.org/docs/pages/Material.html)
- DFG LUT: `node_modules/three/src/renderers/WebGLRenderer.js`, `getDFGLUT()` trong bản cài hiện tại.
