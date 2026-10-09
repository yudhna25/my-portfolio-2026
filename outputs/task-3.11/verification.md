# Task 3.11 — Camera / DOM synchronization

Ngày: 06/10/2026. Kết quả: **PASS** trên máy dev Windows, NVIDIA RTX 4060, Edge, DPR 1.

## Thay đổi

- `src/3d/hooks/useScrollProgress.js`: đọc vị trí DOM thực từ `ScrollSmoother.scrollTop()`; fallback `window.scrollY` khi reduced-motion. Cập nhật trên GSAP ticker sau smoother, bao gồm các frame tiếp tục smoothing sau khi wheel dừng. Progress vẫn là vị trí cuộn / giới hạn cuộn của trang, clamp 0..1; giới hạn được đọc trong cùng tick để tránh cache cũ khi resize.
- Section vẫn chọn theo reading line 35% chiều cao viewport, với tọa độ tương đối `smooth-content`. ResizeObserver theo dõi content reflow; resize/load/ScrollTrigger refresh đo lại mốc. Observer, ticker và listeners đều cleanup trong useGSAP.
- `src/3d/components/CameraRig.jsx`: chạy priority −1, trước các anchor DOM và HDR/composer. Cuối hành trình dùng `p = scrollProgress + (1 − scrollProgress) × contactProgress`, hoàn tất đường bay khi Contact reveal hoàn tất, độc lập chiều cao Footer. Giữ offset −2z và cường độ đĩa của task 3.2.
- `src/3d/utils/cameraPath.js`: thêm output object tùy chọn, tái dùng trong CameraRig để không allocate object mỗi frame. Giữ nguyên toàn bộ công thức đường bay, 5 nhịp weave, framing/FOV và damping 0.12/0.09 đã được duyệt. Hero có contactProgress = 0 nên không đổi route hoặc timing.
- Không đổi kiến trúc Zustand, layout, text, shader, compositor hay component set piece. Một persistent Galaxy Canvas; Canvas nhỏ của LiveDemo 3.5 giữ nguyên.

## Mốc đo thực

Viewport 1440 × 1000, tiếng Việt, tọa độ từ đầu `smooth-content` (px). Mốc được đo lại theo DOM, không hardcode vào production.

| Section | Top |
|---|---:|
| Hero | 0 |
| About | 1082 |
| Skills | 2263.78 |
| Education | 3864.22 |
| Experience | 5028.22 |
| Works | 5880.39 |
| Playground | 9501.19 |
| Contact (`transmission`) | 11529.48 |
| Footer (`contact`) | 12516.95 |

Contact trigger: start 10529 / end 11379. Khi end đạt: contactProgress 0.999998, camera `[-3.500040, 0.180000, -192.999990]`, GPU uDiskIntensity 1.449999. Endpoint mục tiêu `[-3.5, 0.18, -193]`; parallax về 0. Các mẫu scrub 0 / 0.5 / 1 cho cường độ 1 / 1.225 / 1.45 đúng shader thực.

Hero intro labels giữ name 1.5s, tagline 2s, indicator 2.5s; source Hero khớp bản trước task.

## Verify

- `npm run build`: pass, 7.27s; PWA precache thành công. Chunk warning cũ vẫn còn.
- `npm run lint`: 0 errors, 2 warnings cũ trong SplashCursor; không thêm lỗi.
- `node outputs/task-3.11/check.mjs`: 1001 pose đối chiếu công thức path nguyên bản + identity output reuse; đối chiếu nguyên source của store, Hero, App, BlackHole, BlackHoleSystem, GalaxyScene, useSectionAnchor.
- `node outputs/task-3.11/check.mjs --browser`: **28 poses / 4 streams PASS**, dev server :5173. Cuộn nhanh Hero→About, toàn bộ 8 sections, cuộn ngược About/Skills, Contact scrub; resize 320/768/1440/1920; resize liên tục 1280→1024→1440; 3 chu kỳ live reduced-motion bật/tắt. Progress / section / camera / anchor / GL / GPU uniform kiểm trực tiếp trên App.

| Stream | FPS render đo thực | Sai lệch progress tối đa | Frame sai section | Sai lệch anchor tối đa |
|---|---:|---:|---:|---:|
| Hero→About nhanh | 145.2 | 0 | 0 | <0.000001 px |
| Skills cuộn ngược | 164.1 | 0 | 0 | <0.000001 px |
| About cuộn ngược | 165.0 | 0 | 0 | <0.000001 px |
| About resize liên tục | 130.6 | 0 | 0 | <0.000001 px |

Frame counter dùng Fiber `addAfterEffect`, quan sát sau render và anchor callbacks; không lấy FPS từ một vòng rAF riêng. Trước sửa: progress lệch tối đa 0.0684068 (6.84 điểm phần trăm), 24/31 frame chọn sai section trong hai stream nhanh/ngược; native scroll chạy trước visible DOM đến ~869px. Sau sửa store bám visible DOM dù native vẫn chạy trước ~874px. Số anchor error trong baseline không dùng để kết luận vì probe ban đầu chạy trước model callbacks; probe cuối đã chuyển sau render.

Reduced-motion: không smoother; progress khớp native scroll, Contact camera tĩnh chính xác `[-3.5000000000000004, 0.18, -193]`, GPU intensity 1.45. Bật lại motion phục hồi anchor/camera bình thường. Số subscriber/geometries/textures ổn định qua ba chu kỳ (Contact normal 8/11/24, reduced 7/10/24). Policy reduced-motion hiện có tại Footer vẫn giữ nguyên.

Browser plugin kiểm tra Contact trên trang thật: headline nổi trên đĩa/hố đen, nền mono; console errors = 0. Browser automation riêng cũng 0 console errors / pageerrors / WebGL errors. Warning `THREE.Clock` của thư viện hiện có vẫn còn.

## Bằng chứng / giới hạn

- `source-baseline.json`, `browser-baseline.json`, `browser-results.json`, `check.mjs`.
- `contact-final.png`, `about-final.png`, `skills-final.png`.
- Reduced-motion là media emulation, chưa toggle OS trực tiếp; viewport mobile mô phỏng, không khẳng định FPS trên điện thoại thật. FPS báo ở bảng là kết quả các khoảng đo trên máy dev, không bảo đảm cho mọi phần cứng.
- Không cần đổi hệ số damping: lỗi gốc là nguồn progress đi trước DOM và thứ tự update camera/anchor; dùng lại hệ số đã duyệt sau khi sửa nguồn dữ liệu.
- Tham chiếu API chính thức: [R3F frame priorities](https://r3f.docs.pmnd.rs/api/hooks), [GSAP ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/).
