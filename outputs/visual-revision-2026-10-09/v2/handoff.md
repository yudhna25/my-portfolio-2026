# V2 — Handoff cho V3 và V9

09/10/2026. **V2 hoàn thành implementation và kiểm kỹ thuật; chờ V3 tích hợp/G1. Chưa chạy V3.** Skills: `react-3d-ui`, `galaxy-portfolio` trong repo. Không thêm dependency, asset fallback, store, camera writer, Canvas hoặc composer.

## File và phạm vi

Đã sửa `src/3d/components/BlackHole.jsx`, `BlackHoleSystem.jsx`, `src/3d/shaders/blackHole.js`, `src/3d/quality.js`. `BlackHoleBloomMask.jsx` đọc đầy đủ, giữ nguyên vì nó đã dùng chung sampler và restore chỉ ray bị hấp thụ. Không ghi Hero/App/CameraRig/path/progress/store/Lab/locale/palette hoặc constellations V4. Hero/PortalHeading/CSS và public/constellations có thay đổi đồng thời từ V1/V4; không hoàn tác. `integrity-results.json` phân biệt hash V2 với V1.

## Pipeline thật và điều V3/V9 phải giữ

Một HalfFloat RGBA HDR target, không depth/stencil. Trong `BlackHole` mỗi frame đọc `gl.getDrawingBufferSize()` rồi `target.setSize()` **chỉ khi kích thước thay đổi**. High/medium/low đều trace đủ physical pixels của renderer; DPR do GalaxyScene hiện tại sở hữu (1/≤1.5/≤1.75). Bỏ cap1280/1024/768 và multiplier .85/.8/.75; không thêm auto-resolution. `RAY_QUALITY` chỉ còn `steps/step`: 192/.09,160/.11,128/.14. `QUALITY` 24000/12000/1500 giữ nguyên.

`BLACK_HOLE_FRAG` thực hiện remap hướng ray trước tích phân, không phóng lại texture. `PORTAL_IMAGE_GLSL.portalImage(image,uv)` bây giờ đọc thẳng `texture2D(image,uv)`. Copy mesh và core mask đọc cùng pixel HDR ở cùng UV. Giữ một ray render mỗi frame, kể cả khi shader discard ở pha bị che. SelectiveBloom vẫn .15/.3 ở medium/high, low không composer; mask vẫn sau bloom. GL target/autoClear/XR/clearAlpha được phục hồi bằng try/finally.

**Không đưa lại remap vào copy/mask.** Nếu V9 muốn hố đen lớn hơn, đổi observer/projection hoặc mapping **trước ray integration**, vẫn trace target đủ drawing buffer. Gas copy và `uFinaleEnabled/uFinaleHole/uFinaleOrigin/uFinaleGas`, `FINALE_OCTAVES` giữ semantics hiện tại; không thay finale/portal helpers trong V2.

## Uniform và writer

| Uniform | Nghĩa / writer hiện tại | Ghi chú cho tích hợp |
|---|---|---|
| `uObserver` | CameraRig pose trừ `[0,0,-200]`; BlackHole cập nhật mỗi frame | Phòng vệ radius≥1.1; vector zero/nonfinite→`[0,0,1.1]`. Không dùng clamp này làm quỹ đạo xuyên chân trời. |
| `uCameraMatrix`, `uInverseProjection` | Matrix camera thật, BlackHole copy mỗi frame | Không rotate fullscreen mesh; không writer thứ hai cho camera. |
| `uDiskFrame` **mới** | `inverse(Rz(55°) * Rx(4°))`, Matrix3 world→disk, tạo một lần/tier | Plane crossing dùng row Y; hit/velocity chuyển vào disk frame để tính gas/Doppler. Đây là đĩa nghiêng thật trong ray frame, không screen rotation. Default dùng chung story/non-story/finale. |
| `uPortalScale` | Scale hướng ray quanh `uRayCenter`, BlackHole suy từ anchor và `portalState.growth` | Chỉ tác động ray shader. Default ngoài mini vẫn 1:1 camera projection. |
| `uPortalCenter` | Tâm final-O slot trong viewport UV, Y hướng lên | V3 thêm nội suy slot→tâm viewport tại writer này nếu cần, lấy cùng phase helper; không cần store thứ hai. |
| `uRayCenter` | BH center project từ camera, fallback .5/.5 nếu projection tại tâm không finite | Không phải tâm copy texture đã phóng. Gas finale vẫn dùng giá trị này như cũ. |
| `uPortalRadius` | Feather ellipse CSS px, major `2.8*capHeight*growth`, minor `1.4*capHeight*growth` | Aperture xoay−55° trước chuẩn hóa; ray emission thật kết thúc r=9, feather ở ngoài gas. |
| `uPortalViewport` | CSS viewport, không physical buffer | Chỉ dùng mapping/aperture/dust/gas. Target dùng drawing buffer riêng. |
| `uPortalMini/Visibility/Dust/Pull` | Cùng wrappers cho ray/copy/mask; BlackHole đọc portal helper | Visibility0: blank ray HDR + copy black curtain; mask visibility0. Dust không chồng lên ray đã có coverage. |
| `uTime/uDiskIntensity` | BlackHole; story time xác định, finale collapse×3 và intensity1→1.35 | Giữ API đang dùng bởi finale. Non-story chỉ cộng delta khi không frozen. |

`BlackHoleSystem` vẫn có props `frozen/quality/enableBloom/story/reduced`; `BlackHole` vẫn nhận `target/portal` như trước. Shader exports giữ tên. `uDiskFrame` chỉ ở ray material; copy/mask không cần transform đĩa vì ảnh đã ở screen mapping cuối.

## Fit final O và độ nét

Input `{left,top,width,height,fixed}` vẫn từ producer/store. **Height phải là cap-height ink rect**, không line-height hoặc counter chữ O. V1 hiện có `.hero-o-anchor` với ink rect và glyph O trong suốt; V2 không sửa V1.

Ở Hero, dark/photon diameter≈`0.96*anchor.height`. Shadow fit dùng angular radius `asin((3√3/2)*sqrt(1−1/r)/r)`, pixel radius=`tan(angle)*cssHeight/(2*tan(fov/2))`; scale=`0.48*anchor.height/shadowPx*growth`. Đĩa mở rộng ngoài vòng, nghiêng khoảng55°; góc nhìn di chuyển có foreshortening thật. Không cắt đĩa trong một ellipse nhỏ bằng counter cũ.

Evidence: [1440 O](screenshots/1440-dpr1-o-size.png), [1440 close-up Canvas](screenshots/1440-dpr1-close-up-canvas.png), [1920 O](screenshots/1920-dpr2-o-size.png), [1920 close-up Canvas](screenshots/1920-dpr2-close-up-canvas.png), [390 O](screenshots/390-dpr3-o-size.png), [390 close-up Canvas](screenshots/390-dpr3-close-up-canvas.png). Target live ở high1920/DPR1.75 là3360×1890; đây là trace mới từng pixel, không texture1280px được phóng. Device DPR3/mobile vẫn render DPR1 theo GalaxyScene đã có; không tuyên bố native device-DPR3.

## Pose/rebase đề xuất, chưa áp dụng

1. CameraRig vẫn là writer duy nhất. Hero exterior radius≈32; intake giữ observer ngoài horizon, khuyến nghị radius≥8 như CLOSE hiện tại. Zoom cinematic bằng `growth`/ray mapping; không chạy camera vật lý qua tâm `[0,0,-200]`.
2. V3 có thể đưa `uPortalCenter` từ slot O về .5/.5 trong intake, tại đúng writer BlackHole, dùng cùng portalState của DOM/camera. Fit ring ban đầu vẫn cap-height. Growth đủ lớn để dark core che viewport, không giới hạn target.
3. Trong core .44–.50 dự kiến, đặt visibility0 (black curtain hiện có), rebase CameraRig từ exterior CLOSE về exterior exit pose trước khi reveal. Toggle mini/full camera projection khi bị che; ray/copy/mask không cần texture warp khác nhau. V2 không đổi các mốc .43/.48/.52/.60/.74 hiện có.
4. Eject tiếp về ABOUT pose đã duyệt `[2,5,-154]`/target `[-36,-16,-200]` qua path dùng chung, làm settle identity theo V3. Không infer eject là mô phỏng vật lý; đây là portal cinematic NASA-inspired. Khi sáng trở lại, observer/camera matrices phải finite và quan sát từ exterior.
5. V9 dùng tiếp cùng HDR pipeline và uniforms finale. Nếu đổi Contact framing hoặc disk scale, regression O/close-up/portal là bắt buộc. Không đổi star counts để giấu chi phí shader.

Bước RK4 tiến vào horizon được giới hạn bởi `0.4*(r−1)/inwardSpeed`; acceleration cũng chặn denominator r²≥1 cho substages. CPU analytic capture threshold và GPU observer stress center/inside/safe/near đều hữu hạn. Observer clamp là hàng phòng vệ cuối, **không** một mô hình observer vật lý bên trong horizon.

## Kiểm chứng, giới hạn và tiến độ

Xem `verification.md`, `browser-results.json`, `performance-results.json`, `geodesic-results.json`, `integrity-results.json`, `build.log`, `lint.log`. Technical PASS; G1 vẫn cần bản tích hợp V3 và người dùng duyệt. GPU hiện tại Intel UHD630 chậm ở high/DPR1.75 close-up; giữ độ nét, báo chi phí thật. Chưa điện thoại/RTX/OS motion/HTTPS/visual gate; chưa kiểm native scroll toàn quỹ đạo V3 mới hoặc initial no-WebGL. Không deploy/commit/chạy task tiếp.

Integrator append tuần tự dòng sau vào AGENTS.md (V2 chưa append):

`| 09/10/2026 | V2 — HDR hố đen O/đĩa nghiêng/close-up sắc | Codex | ✅ Kỹ thuật xong; chờ V3/G1 | BlackHole/System/shader/quality: disk frame55°+4°, cap-height fit, ray mapping trước RK4, target đủ drawing buffer, safe observer/RK4; copy/mask pixel chung, một HDR pass/frame. Build/lint pass (2 warnings cũ); Edge154 UHD630 39 poses/79PNG/47.75M HDR pixels finite-mono/core0leak, resize/dispose/fallback/reduced +1818 finite stress rays. High3360×1890 ray48.45MiB và close-up chậm; giữ nét, chưa phone/OS motion/G1; outputs/visual-revision-2026-10-09/v2/verification.md + handoff.md. |`
