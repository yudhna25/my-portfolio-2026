# Task 4.2 — 3D Quality Tiers & Performance Optimization

Ngày kiểm chứng: 06/10/2026. Kết quả: **build pass; 30 browser poses/lifecycle checks pass; 0 lỗi runtime trong lượt chạy bình thường**. Scene mono, camera/Hero/Contact và shader RK4 high được bảo toàn. Không thêm dependency.

## Cấu hình cuối

| Tier / breakpoint | Sao | DPR | RK4 iterations tối đa / step | HDR scale / cạnh tối đa | Nebula octaves | SelectiveBloom |
| --- | ---: | --- | --- | --- | ---: | --- |
| Low / <768px | 1.500 | 1 cố định | 128 / 0.14 | 0.75 / 768px | 3 | Tắt, 0 composer |
| Medium / 768–1023px | 12.000 | [1, 1.5] | 160 / 0.11 | 0.8 / 1024px | 4 | 0.15, chỉ đĩa hố đen |
| High / ≥1024px | 24.000 | [1, 1.75] | 192 / 0.09 | 0.85 / 1280px | 5 | 0.3, chỉ đĩa + mask giữ lõi đen |

Low giữ mức 1.500 sao của task 3.12 theo lựa chọn “hoặc mức tối ưu cho GPU di động” trong prompt. Mobile vẫn có sao, hai nebula và hố đen procedural; bloom luôn tắt nên cả trường hợp FPS <50 cũng không chạy composer nặng. Không thêm bộ điều khiển FPS tự động. Đây là cấu hình tiết kiệm hơn mức 6.000 sao, chưa phải kết luận benchmark trên GPU điện thoại thật.

Quality được truyền bằng render-prop từ GalaxyScene tới Planet/OrbitalSkills, không thêm Context/store. Planet dùng sphere segments 24/32/40 và ring segments 64/80/96; Orbital dùng torus segments 32/48/64, core detail 0/1/1, giữ 10 satellites instanced. About/Skills thay hố đen và không dùng bloom. ChromaticAberration tiếp tục tắt theo quyết định mono trước đó.

Lab chọn low/medium trên desktop cũng hạ DPR đúng tier; chọn high trên thiết bị nhỏ vẫn bị giới hạn DPR theo breakpoint. Ray shader high, termination guards, horizon/ISCO/lensing/photon/Doppler và mask không đổi.

## FPS, draw calls và triangles thực

Đo App thật trên `http://127.0.0.1:5173/`, Edge headless, NVIDIA RTX 4060 / ANGLE Direct3D11, màn hình khoảng 165Hz; viewport cao 844px, deviceScaleFactor **3** để kiểm tra DPR cap. Mỗi pose đo 3.2 giây sau khi ổn định. Đếm callback của chính Galaxy root, không cộng frame của Canvas demo khác. `gl.info.autoReset=false`, reset một lần ở đầu frame, đọc sau toàn bộ HDR/composer passes rồi khôi phục thiết lập: số draw calls/triangles dưới đây là tổng frame, không phải riêng pass cuối. Triangles không tính points/lines.

| Tier / viewport | Pose | FPS trung bình | FPS thấp nhất theo cửa sổ ~1s | Draw calls/frame | Triangles/frame |
| --- | --- | ---: | ---: | ---: | ---: |
| High / 1440px | Hero | 165.06 | 164.96 | 37 | 520 |
| High / 1440px | About / Planet | 162.18 | 158.56 | 19 | 4.688 |
| High / 1440px | Skills / Orbital | 165.01 | 165.00 | 21 | 1.680 |
| High / 1440px | Contact / BlackHole | 165.11 | 165.00 | 37 | 520 |
| Medium / 834px | Hero | 165.10 | 164.93 | 37 | 520 |
| Medium / 834px | About / Planet | 165.16 | 164.93 | 19 | 3.376 |
| Medium / 834px | Skills / Orbital | 165.02 | 164.98 | 21 | 1.424 |
| Medium / 834px | Contact / BlackHole | 164.05 | 163.20 | 37 | 520 |
| Low / 390px | Hero | 165.08 | 165.00 | 18 | 500 |
| Low / 390px | About / Planet | 165.09 | 165.00 | 19 | 2.320 |
| Low / 390px | Skills / Orbital | 165.19 | 165.00 | 21 | 1.108 |
| Low / 390px | Contact / BlackHole | 164.91 | 164.87 | 18 | 500 |

HDR target high 1280×750, medium 1001×1013, low 293×633. Drawing buffer tương ứng 2520×1477, 1251×1266, 390×844. Toàn bộ cửa sổ đo desktop >120 FPS và mobile viewport >60 FPS. Browser plugin cũng xác nhận Lab khoảng 165 FPS, đổi 3 tier và cuộn về cuối vẫn có sao/hố đen, không lỗi console.

## Lifecycle, cấp phát, fallback

- Resize 767 → 768 → 1023 → 1024 → 1440 → 390 → 834 → 1440: đúng breakpoint, count, DPR, octaves, quality của child; giữ nguyên Canvas, không tạo composer thứ hai. Sai số store/visible progress <0.00001.
- Cache anchor bằng ResizeObserver + resize + ScrollTrigger refresh có cleanup trong useGSAPSetup. Bỏ DOMRect mỗi frame. Test bắt được độ lệch 34.82px khi CSS đã resize nhưng R3F size còn cũ; đổi phép chiếu sang kích thước CSS viewport hiện tại. Sau sửa: **465 mẫu** cuộn nhanh/reverse/live resize, sai số tâm anchor tối đa **0.0000877px**.
- AST audit toàn bộ `src/3d/`: **10/10 useFrame callbacks** không có new/object literal/array literal/nested closure/clone/toArray/getBoundingClientRect. FloatingObjects và helper sao băng dùng vòng for, LabTelemetry tái dùng options. So sánh **2.000 frame** helper sao băng với baseline: positions/alphas giống hệt. Không tuyên bố thư viện bên trong Three/i18next không cấp phát.
- `frameloop={hidden ? 'never' : 'always'}`: visibility mô phỏng có **0 callback frame trong 600ms** sau khi ổn định; hiện lại tiếp tục render. FloatingObjects/ShootingStars unmount khi hidden. Chỉ kết luận scene ngừng render, không suy rộng thành CPU của toàn trình duyệt bằng 0.
- Live reduced-motion + wheel native tới Skills: camera và các shader time giữ nguyên trong 500ms; anchor vẫn khớp, sao băng không mount. OS setting chưa bật trực tiếp.
- Star geometry cũ dispose qua medium → low → high. Bộ đếm geometry/texture/subscribers tại Contact: medium **11/24/8**, low **10/2/7**, high **11/24/8**; không tăng sau vòng chuyển tier.
- Mất context thật bằng `WEBGL_lose_context`: Canvas unmount, fallback **rgb(5,5,5)**, mailto/DOM vẫn tồn tại; light theme cũng giữ nền #050505. Theo dõi **11 geometries, 23 materials, 21 render targets: tất cả đều dispose**. Renderer memory từ **11 geometries / 24 textures → 0 / 1**. Một texture còn lại là mức nền ổn định; Three.js có thể giữ tài nguyên nội bộ ngoài scene graph sau cleanup, nên đối chiếu dispose events và chu kỳ ổn định thay vì chỉ đòi counter bằng 0. [Three.js disposal FAQ](https://threejs.org/manual/pages/how-to-dispose-of-objects.html).
- Giả lập `getContext('webgl2')` trả null: SceneBoundary hiện SceneFallback, không còn Canvas; Hero/React DOM sống, preloader kết thúc. Có 3 diagnostic console errors dự kiến từ Three/React boundary cho lỗi context đã chủ động tiêm; được lưu riêng, không tính là lỗi của lượt chạy bình thường.

## Files và lệnh tái kiểm chứng

Sửa: `src/3d/quality.js`, `GalaxyScene.jsx`, `components/Nebula.jsx`, `Planet.jsx`, `OrbitalSkills.jsx`, `FloatingObjects.jsx`, `LabTelemetry.jsx`, `SceneFallback.jsx`, `hooks/useSectionAnchor.js`, `utils/shootingStars.js`.

Baseline/đối chiếu: `source-baseline.json`, `source-results.json`; bảo toàn 8 file camera/store/star/RK4/compositor/mask, animation Hero và App quality contract. Các thay đổi responsive đồng thời trong App/Hero và audit assets task 4.8 được giữ nguyên.

```sh
npm run build
npm run lint
node outputs/task-4.2/check.mjs
node outputs/task-4.2/check.mjs --browser
```

`--browser --lifecycle` chỉ chạy kiểm tra lifecycle để khỏi đo lại FPS. Kết quả cuối đầy đủ: `browser-results.json` (**30 checks**), kết quả vòng lifecycle riêng: `lifecycle-results.json` (**18 checks**). Ảnh: `contact-1440.png`, `contact-834.png`, `contact-390.png`, `context-lost.png`, `lab-low.png`.

Build Vite 7.3.6 pass (6.23s + PWA). Lint 0 errors / 2 warning cũ SplashCursor. Runtime thường 0 errors; warning Clock cũ; warning lose-context chỉ trong phép thử context lost. Chunk-size warning cũ còn. Browser checks dùng Playwright đã có sẵn; không cài package.

Giới hạn: viewport 390px chạy trên RTX 4060, không đại diện GPU điện thoại. Chưa đo FPS/nhiệt độ/pin trên điện thoại thật, laptop tích hợp GPU hoặc monitor 60Hz; chưa bảo đảm >60/120 FPS trên mọi phần cứng. Số liệu trên là steady-state sau warm-up; không phải cam kết mọi frame shader compile đều dưới ngân sách.
