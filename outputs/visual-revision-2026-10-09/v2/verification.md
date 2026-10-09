# V2 — Hố đen final O, đĩa nghiêng và HDR close-up

09/10/2026. **Implementation V2 và kiểm kỹ thuật hoàn tất; chờ V3 tích hợp/G1. Chưa thực thi V3.** Chỉ sửa bốn file V2: `BlackHole.jsx`, `BlackHoleSystem.jsx`, `shaders/blackHole.js`, `quality.js`. `BlackHoleBloomMask.jsx` giữ nguyên, dùng sampler chung. Không sửa camera/App/progress/store/Lab hoặc asset V4. Skills repo: `react-3d-ui`, `galaxy-portfolio`; không cần `ecc:react-performance` vì số đo cho thấy GPU chiếm chi phí chính.

## Kết quả visual và pipeline

Hố đen fit theo **cap-height ink rect** thay vì counter chữ O. V1 đang làm song song và đã thay O bằng slot trong suốt; ảnh cuối ghi source V1 thực tế trong `browser-results.json`, không phải V2 sửa chữ. Đĩa dùng frame vật lý `inverse(Rz55° * Rx4°)` cho plane crossing, gas và Doppler; không rotate fullscreen mesh. Từ camera/ray uniforms live, tangent chiếu lên màn hình là **54.9365°** ở cả bốn cấu hình. Ring fit analytic bằng96% cap-height; đây là dự đoán từ projection, không claim đo ink/rim bằng detector ảnh. Xem `mapping-results.json`.

Một HDR ray pass/frame, một target RGBA16F; low không composer, medium/high giữ composer SelectiveBloom rồi core mask. Zoom/anchor remap chuyển vào **hướng ray trước RK4**. Copy và mask sample thẳng cùng UV/pixel của target. Target khớp drawing buffer thực kể cả DPR/resize; không còn cap1280px hay render .85/.8/.75 rồi phóng. High1920/DPR1.75 trace3360×1890 pixel thật.

Gas procedural có dải/knots/shear, emission compact r3–9, profile giảm nhanh ở ngoài để tránh lớp sáng rộng; photon rim hẹp mono theo critical impact, có antialias theo footprint pixel. Bloom threshold/intensity giữ nguyên. Dust không chồng trên ray bị hấp thụ, kể cả tier low không có mask composer. Không có cyan hoặc haze bổ sung trong shader BH. Ảnh close-up còn giới hạn chi tiết bởi công thức gas procedural và số bước RK4, không phải dữ liệu khí/render gốc NASA.

Observer finite radius≥1.1; zero/nonfinite vector được phòng vệ. RK4 hạn chế bước hướng vào horizon, acceleration denominator có floor; không tích phân qua singularity. Clamp là phòng vệ kỹ thuật, không mô hình observer vật lý bên trong hố đen. Portal eject là cinematic NASA-inspired; V3 giữ observer ngoại thất và rebase khi bị black curtain che.

## Ảnh từ App và Canvas thật

| Cấu hình | O-sized / full App | Close-up / Canvas thật | Camera close / Canvas |
|---|---|---|---|
| 390×844, device DPR3/render DPR1, low | [O](screenshots/390-dpr3-o-size.png) | [p=.30](screenshots/390-dpr3-close-up-canvas.png) | [p=.66](screenshots/390-dpr3-physical-observer-close-canvas.png) |
| 900×900, device DPR2/render DPR1.5, medium | [O](screenshots/900-dpr2-o-size.png) | [p=.28](screenshots/900-dpr2-close-up-canvas.png) | [p=.66](screenshots/900-dpr2-physical-observer-close-canvas.png) |
| 1440×900, DPR1, high | [O](screenshots/1440-dpr1-o-size.png) | [p=.28](screenshots/1440-dpr1-close-up-canvas.png) | [p=.66](screenshots/1440-dpr1-physical-observer-close-canvas.png) |
| 1920×1080, device DPR2/render DPR1.75, high | [O](screenshots/1920-dpr2-o-size.png) | [p=.28, native3360×1890](screenshots/1920-dpr2-close-up-canvas.png) | [p=.66](screenshots/1920-dpr2-physical-observer-close-canvas.png) |

Close-up p=.28/.30 là mapping zoom trong ray shader từ progress hiện có; camera close p=.66 dùng exterior observer thật và visibility đang reveal theo helper cũ. Không claim quỹ đạo/phase V3 đã triển khai. Các ảnh `o-slot-preview` chỉ thêm CSS kiểm thử tạm giữ rect; ảnh `o-size` không có patch CSS. Có79PNG cuối:39 poses×App/Canvas +1fallback. Canvas capture trong `addAfterEffect`, không dùng ảnh dựng/AI.

## Kiểm chứng kỹ thuật

| Kiểm tra | Kết quả / bằng chứng |
|---|---|
| Build cuối | PASS exit0, Vite7.3.6,1864modules,17.90s; PWA40entries/3162.74KiB. `build.log`. Build gồm thay đổi V1/V4 đang có, không claim V2 tạo assets này. |
| Lint | PASS0errors;2warnings cũ `SplashCursor.jsx:149/175` unsupported-syntax. `lint.log`. Scoped lint V2 cũng pass. |
| Browser | Edge154.0.4258.62 headless/Windows/ANGLE Intel UHD630 D3D11. Service workers blocked. Vite websocket kiểm thử nhận connected nhưng không forward reload để V1 ghi song song không ngắt ảnh. |
| Pipeline | Mọi39pose có1Canvas, ray count1/frame, target==drawing buffer, copy/ray uniform wrappers cùng identity. Compiled bloom mask medium/high sample trực tiếp cùng UV; low không composer. |
| HDR | **47,754,672 pixels** đọc toàn target tại các pose có pixel check:0NaN/Infinity half-float,0pixel lệch R/G/B. Uniform/camera matrix hữu hạn ở mọi39pose. Không claim finite mọi cấu hình GPU chưa chạy. |
| Core/bloom | So pixel HDR alpha1/RGB0 với Canvas cuối: **0pixel core rò sáng** ở các pose đã scan, giữ foreground emission không bị circular cutout xóa. Không có post color tint. |
| Reverse | Hold p=.28/.30, đi .4 rồi quay lại: ray/copy uniforms exact bằng trước. Camera/progress dùng producer/store có sẵn; không writer thứ hai. Không kiểm đầy đủ quỹ đạo V3 mới. |
| Safe observer | Test tạm thay callback camera duy nhất: center/inside .5/safe1.1/near `[1,1,8]`, rồi restore. Tất cả uniforms/HDR/core finite; không sửa CameraRig hoặc gọi stress này là quỹ đạo vật lý. [Center](screenshots/1440-dpr1-observer-center-canvas.png). |
| CPU geodesic | PASS analytic critical b=3√3/2: below.995 capture/above1.005 escape ở3tier; energy error≤.001705, angular drift≤.0000631. **1818** finite stress rays r1.1/1.5/2.7/8/32/90; disk frame orthonormal. `geodesic-results.json`. |
| Resize/dispose | 1440→1024→1440: target cùng UUID, đúng drawing buffer, old allocation dispose; không tạo target mới mỗi frame. EDURA route unmount: ray material1/geometry1 dispose, target dispose, Canvas0, renderer memory0geometry/0texture. `browser-results.json` disposal. |
| Reduced motion | Browser emulation pass; camera/scene giữ behavior có sẵn, uniforms finite, target chung. [Ảnh](screenshots/1440-dpr1-reduced.png). Không toggle OS thật. |
| Fallback | Forced context loss: Canvas0, SceneFallback có, About DOM vẫn có/ảnh đọc được. [Ảnh](screenshots/fallback.png). Không test initial no-WebGL trong phiên này. |
| Finale API | Các pose About/finale .8/Contact0 chạy cùng uniforms/gas/copy/mask, không console/GL error. Phase helpers/camera/store giữ hash; không claim nghiệm thu spectacle V9. |
| Console |0page/console errors trong run cuối;4Clock deprecated warnings cũ. `browser-hmr-close-attempt.json` giữ run trước: shader checks pass nhưng websocket bị close chủ ý tạo Vite dev-tool errors; harness sửa handshake rồi chạy lại. |
| Ownership |108baseline paths:102unchanged,4V2 sửa,2V1 sửa đồng thời; CSS V1/asset V4 mới được giữ. AGENTS/package/config/camera/progress/store/mask không đổi. Source fingerprints V2 và V1 trước/sau run cuối stable. `integrity-results.json`. |

## Chi phí thực — giữ độ nét

Đợt profile riêng **không chạy build trong cùng tiến trình**, mỗi mode6s, có hàng đợi EXT_disjoint_timer_query_webgl2 để lấy nhiều GPU samples. Máy vẫn là desktop dùng chung, không lock GPU/thermal/background apps. `performance-results.json` có source hashes, sample counts, mean/p95/max, CPU submission và frame intervals. Đợt functional2.2s trước chịu tải build/worker song song, giữ số đo raw trong browser-results nhưng không dùng làm bảng chính.

| Viewport / tier / render DPR | HDR target | Ray texture MiB | O FPS / GPU mean ms | Close FPS / full GPU mean ms | Close ray mean / p95 ms |
|---|---|---:|---:|---:|---:|
| 390×844 / low /1 |390×844|2.51|59.89 /0.887|59.96 /9.133|9.043 /9.682|
| 900×900 / medium /1.5 |1350×1350|13.90|59.93 /9.637|24.94 /38.260|26.847 /28.705|
| 1440×900 / high /1 |1440×900|9.89|59.99 /9.576|29.31 /32.847|25.835 /28.734|
| 1920×1080 / high /1.75 |3360×1890|48.45|18.64 /49.004|6.33 /151.413|120.205 /130.099|

Full GPU p95 close lần lượt9.651/48.932/36.599/168.373ms. Ray GPU samples359/155/167/31; full close359/144/170/33. CPU submission p95 close1.2/.9/.8/1.1ms; phần nặng là GPU ray và postprocessing, không thấy lý do sửa React rendering. Ray/full scope đo ở hai cửa sổ khác nhau, không lấy hiệu hai mean làm chi phí bloom chính xác.

Memory ray tính width×height×8bytes RGBA16F, **không** tổng VRAM đo từ driver. `renderer.info.memory` tại O: low2geometries/1texture; medium/high3geometries/23textures (copy/ray/composer/bloom, ambient đang ẩn ở Hero). Texture counters không đổi thành bytes của toàn scene. Target high48.45MiB là rủi ro rõ trên integrated/mobile GPU; composer còn allocations riêng. Không thêm composer, không hạ target/DPR/chi tiết để đạt FPS cũ. Early cull b>9.6/outgoing ngoài emission và dùng plane dot thay matrix×vector mỗi bước giảm phép tính mà giữ mapping/độ nét.

FPS đếm frame R3F thực có ray render, đối chiếu1pass/frame và GPU timer; browser headless cadence≈60Hz. Không tuyên bố đạt120/165fps hoặc hiệu năng điện thoại từ viewport giả lập. **High1920/DPR1.75 close-up chưa đủ mượt trên UHD630.** Muốn giữ chất lượng trên nhóm GPU này cần tối ưu thuật toán tiếp với evidence, không tự giảm nét; tích hợp V3/G1 không được bỏ qua giới hạn này.

## Cách chạy lại và giới hạn

`npm run build`, `npm run lint`; `node outputs/visual-revision-2026-10-09/v2/check-geodesics.mjs`, `check-mapping.mjs`, `check-integrity.mjs`. Browser: `node outputs/visual-revision-2026-10-09/v2/verify-browser.mjs <local-url>`, thêm `--profile-only` để đo riêng. Cung cấp `STELLAR_PLAYWRIGHT_MODULE` tới Playwright đã có trong runtime, không cài dependency vào project. Server/browser ngoài sandbox vì Edge sandbox launch lỗi và sandbox build bị EPERM; cuối đã chạy được qua escalation tự động, không còn bước bị chặn.

Đối chiếu API với [Three WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) (drawing buffer physical pixels/DPR/readback) và [RenderTarget](https://threejs.org/docs/pages/RenderTarget.html) (size/disposal); actual behavior xác nhận trên installed Three0.186.1 bằng run trên.

Chưa kiểm điện thoại thật/RTX/OS motion/screen reader/public HTTPS/initial no-WebGL hoặc toàn portal V3/G1. Không chụp clip, không deploy/commit/chạy task sau. Chi tiết uniforms/anchor fit/rebase đề xuất và dòng AGENTS chờ integrator nằm trong [handoff](handoff.md).
