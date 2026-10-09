# R2.2 — Portal dùng chung trong lab

Phạm vi: chứng minh portal tại `3d-lab.html?story=1`. App vẫn dùng `story=false`; chưa thay Hero production, chưa glitch năm, chưa làm orbit/finale.

## API và ownership

- Tái dùng `GalaxyScene`, một Canvas, `BlackHoleSystem` và ảnh HDR hiện có. `CameraRig` vẫn là scene camera writer duy nhất, priority −1. `CameraRig.jsx`, `cameraPath.js`, `useSmoothScroll.js` giữ nguyên hash R2.1.
- `portalProgress(chapter,p,reduced)` và `portalState(p,out)` trong `src/3d/utils/portal.js` là hàm thuần. Cấp `out` một lần, tái dùng; không elapsed time/random/history. Hero luôn effective p=0; portal reduced dùng p=1; các chương sau dùng p=1.
- `PortalHeading` là mẫu DOM semantic dùng chung: props `label`, `name`, `year`, `visible`; giữ `aria-label` và toàn bộ ký tự trong DOM. R3.2 có thể tái dùng trực tiếp hoặc giữ đúng anchor attributes khi tích hợp Hero đã duyệt. Chưa có motion glitch hoặc typography Hero hoàn chỉnh.
- Progress vẫn từ producer R2.1: `useLabScroll` → `useScrollProgress`. Manual seek sync scroll và dừng producer; Resume đưa DOM về pose đang giữ rồi tiếp tục. `PortalHeading` subscribe cùng store trong context GSAP và điều khiển timeline paused; không thêm ticker producer/camera writer/setState mỗi frame.

## Anchor sửa từ contract R2.1

Mẫu PORTFOLIO phải đứng yên trong đoạn portal, nên nằm **ngoài `#smooth-content`**, fixed trong viewport. O index 8 (O thứ ba/cuối) có `data-story-anchor="portal"`; không transform riêng O. Hai nét L/I gần O chỉ transform nhẹ; cả heading fade theo cùng p.

`storyAnchor = {left,top,width,height,fixed}` dùng CSS px. Với mẫu hiện tại `fixed=true`, left/top là viewport coordinates, **không trừ visible scroll**. Hook đo lại bằng resize/fonts/locale/refresh như R2.1, query anchor ngoài content và giữ field `fixed` trong equality của store. BlackHole chỉ đọc cache này; không query DOM trong useFrame. R3.2 cần giữ fixed anchor cho portal; nếu đổi sang anchor trong flow phải chuyển top content → viewport trước khi đưa vào shader. Không tái sử dụng công thức top−visibleY của R2.1 cho fixed anchor.

Uniform viewport dùng `window.innerWidth/innerHeight` giống CSS viewport để tránh lệch tạm thời khi Fiber ResizeObserver chưa cập nhật size. HDR target vẫn lấy size/DPR/tier thật của renderer.

## Ba nhịp / composite

Portal range giữ **1,75 viewport** theo DOM R2.1. Camera path và target không đổi:

| p | Trạng thái render | Camera |
|---|---|---|
| 0 | Mini HDR trong O; bụi nhỏ, không nền sao/BH lớn/chòm sao | Hero `[0,2.2,-168]`, nhìn BH |
| 0…0,43 | Aperture/core mở từ O, bụi co/xoắn và hai nét gần bị kéo; heading fade 0,28…0,43 | Tiến tới close pose đến p=0,45 |
| 0,43…0,48 | Core đã phủ khung, visibility về 0 | Close observer bên ngoài chân trời |
| 0,48…0,60 | Khoảng tối; đổi mini→full sampling ở p=0,52; backdrop bật dưới lớp tối | Giữ close pose đến p=0,60 |
| 0,60…0,74 | Ảnh lớn/sao mở dần; camera đẩy ra trong khi vẫn nhìn lại BH | Close → About |
| 0,74…1 | Ejection tiếp tục, settle About; typography portal đã rút | About `[2,3,-169]`, target lệch trái theo aspect để BH bên phải |

`uPortalScale` remap full-screen NDC ray image quanh `uRayCenter` sang `uPortalCenter`, không scale mesh. `uPortalRadius` là aperture ellipse bằng CSS px và cùng growth. UV ngoài texture được chặn trước alpha, tránh smear cạnh. Một đoạn GLSL `PORTAL_IMAGE_GLSL` được dùng chung bởi copy và bloom mask; mask giữ đúng các tia bị hấp thụ, không xóa đĩa phía trước.

R3F phiên bản cài đặt sao chép scalar uniform wrappers khi apply props. `BlackHole` dùng onUpdate giữ **cùng đối tượng uniforms** cho copy/mask, tránh mini mode bị đứng ở giá trị khởi tạo. Visibility/veil nằm trong composite GL; low tier không composer vẫn có blackout. Không dùng CSS mask để thay chuyển cảnh.

Story giữ `uTime=0`, frozen ambient và bụi procedural lấy trực tiếp p để screenshot/reverse xác định. Backdrop chỉ mở từ p=0,52; các đường Constellations cũ tắt riêng trong story. Production không đổi các nhánh đó. Shader ray tracing RK4 nguyên bản, observer min r≈8,183 >1; không đưa observer vào singularity. Không tuyên bố trùng NASA 100%.

## Bàn giao và kiểm chứng

- Lab: `http://127.0.0.1:5173/3d-lab.html?story=1&chapter=portal&p=.25`. Điều khiển chapter/5 pose/slider/Hold/Resume/locale/reduced vẫn dùng R2.1.
- Pure check: `node outputs/redesign/r2.2/check-portal.mjs`.
- Browser check: `node outputs/redesign/r2.2/verify-portal.mjs` dùng Edge và Playwright runtime đã cài, không thêm package.
- Pixel check: chạy `outputs/redesign/r2.2/check-pixels.py` bằng Python bundled có Pillow. `contact-sheet.jpg` là ảnh render thật; khác storyboard R1.
- Xem `verification.md`, `browser-results.json`, `pixel-results.json`, `integrity.json` và `trace.json.gz` để lấy cấu hình/số đo/giới hạn. Một HDR target ứng dụng không đồng nghĩa toàn pipeline chỉ có một target: composer còn buffers/mips sẵn có, phải dùng số đếm instrument thật.

R3.2 tích hợp mẫu/contract này; R2.3/R2.4 sẽ chứng minh orbit/finale riêng. Không chạy các task đó ở phiên R2.2.
