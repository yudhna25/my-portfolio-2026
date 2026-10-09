# Task 3.12 — Mobile quality tiers

Ngày 06/10/2026. **PASS cấu hình, build và Browser viewport QA**; chưa đo nhiệt độ/FPS trên điện thoại vật lý.

| Tier tự động | Viewport | StarField | DPR | Bloom | Chromatic |
|---|---|---:|---|---|---|
| Low | <768px | 1.500 | 1 | Không tạo composer | Tắt |
| Medium | 768–1023px | 4.000 | [1, 1.75] | intensity 0.15 | Tắt |
| High | ≥1024px | 24.000, giữ bản hiện tại | [1, 1.75] | intensity 0.3, giữ bản hiện tại | Tắt như task 1.8 |

## Thay đổi

- `src/3d/quality.js`: dùng cấu hình sẵn có; medium/low đổi 12k/6k → 4k/1.5k, high 24k và toàn bộ RAY_QUALITY giữ nguyên.
- `GalaxyScene.jsx`: DPR mobile 1; prop `quality` tùy chọn cho Lab/UI đã có, tự chọn theo breakpoint nếu không truyền; `data-quality` phản ánh tier thực. Giữ API `count`, `rayQuality`, `enableBloom` và children JSX cũ; children dạng render function nhận quality để App truyền props cho Planet/OrbitalSkills. Không thêm Context/store/dependency.
- `BlackHoleSystem.jsx`: low unmount composer/bloom/mask, hố đen/HDR ray image tiếp tục render. Medium giảm intensity một nửa; các thông số bloom khác và high không đổi. `enableBloom={false}` vẫn tắt effect ở mọi tier. Chromatic đã được bỏ từ task 1.8, không thêm lại.
- `App.jsx`, `Planet.jsx`, `OrbitalSkills.jsx`: chuyển quality qua props, dùng tier chung cho geometry. Planet low giữ 24 segments như trước; orbital low dùng core detail 0 / torus 32 segments, high vẫn detail 1 / 64 segments. Giữ đủ 10 vệ tinh, DOM labels và nút pause.
- `3d-lab.jsx`, lab locales Vi/En: điều khiển tier dùng cùng cấu hình production; số sao là interpolation từ QUALITY. Nút bloom disabled/aria-pressed=false ở low, bật lại khi chọn tier cao hơn. `3d-lab.html` trỏ favicon.svg sẵn có để hết favicon 404 cũ trong phiên QA.

## Kiểm chứng

- `npm run build`: pass, 5.13s; `npm run lint`: 0 errors, 2 warnings SplashCursor cũ. Chunk warning cũ vẫn còn.
- `node outputs/task-3.12/check.mjs`: source Hero/CameraRig/useScrollProgress/store/StarField/Nebula/shader/anchor giữ nguyên; ray tiers nguyên bản. JSON lab hợp lệ, 29 keys/locale, parity Vi/En.
- `node outputs/task-3.12/check.mjs --browser`: **17 poses PASS**, App thật dev :5173, Edge/ANGLE D3D11/RTX 4060. Viewport 390×844, deviceScaleFactor 3, touch/mobile emulation; đo bằng Fiber addAfterEffect sau render, mỗi khoảng 3 giây.

| Vùng ở 390px | FPS render |
|---|---:|
| Hero | 165.1 |
| About / planet | 165.0 |
| Skills / orbital | 164.9 |
| Contact / hố đen | 165.1 |
| Desktop Contact | 165.3 |

- Đếm geometry StarField thực: low 1500 / medium 4000 / high 24000; đọc DPR thực từ renderer. Mobile drawing buffer 390×844 dù device DPR 3; baseline renderer DPR 1.75. Số pixel drawing buffer giảm khoảng 67%, số sao mobile giảm 75% so với baseline 6k.
- Hố đen low: HDR target 293×633 (baseline 355×768), 0 composer, resources ổn định 10 geometries / 2 textures / 7 callbacks sau warm-up. Medium/high 1 composer; intensity React effect props đúng 0.15/0.3. Không ChromaticAberration.
- Resize 767/768/1023/1024/1440 rồi 390→768→1440→390: tier/DPR/count/composer đúng, cùng một Canvas element; không tăng resources qua các chu kỳ. Store progress vẫn khớp vị trí DOM trong sai số <0.00001.
- Desktop so baseline: count/DPR/composer/HDR target/resources đều khớp; high vẫn 192 bước ray tracer, viewport 1440 DPR1.75, HDR 1280×750, bloom 0.3. Camera, shader, StarField source và đường đồng bộ 3.11 nguyên vẹn.
- Reduced-motion mobile: camera và uTime không đổi sau 500ms; 3D vẫn hiển thị. Canvas được aria-hidden ở wrapper; nội dung/controls DOM vẫn truy cập được. Lab low/high override hoạt động, aria trạng thái bloom đúng.
- Browser plugin kiểm tra hình ảnh trang thật, console sạch. Automation kiểm tra 0 console/page/WebGL errors; còn warning THREE.Clock hiện có.

## Bằng chứng / giới hạn

`source-baseline.json`, `browser-baseline.json`, `browser-results.json`, `check.mjs`, `mobile-contact.png`, `desktop-contact.png`.

FPS trên là GPU máy dev tại viewport mô phỏng, không phải phép đo trên SoC điện thoại. Chưa có điện thoại vật lý để đo nhiệt độ hoặc throttling dài hạn; không khẳng định máy thật sẽ luôn đạt 165 FPS hay không nóng. Tải GPU đã giảm qua DPR, particles, bỏ toàn bộ composer low và geometry orbital nhẹ hơn; mobile vẫn giữ 3D.

Tham chiếu: [R3F Canvas DPR](https://r3f.docs.pmnd.rs/api/canvas), [EffectComposer](https://react-postprocessing.docs.pmnd.rs/effect-composer); đối chiếu với mã thư viện đang cài.
