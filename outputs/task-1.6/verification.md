# Task 1.6 — StarField, Nebula, BlackHole

04/10/2026 — Codex.

## Triển khai

- `src/3d/components/StarField.jsx`: count mặc định 10000, frozen mặc định false. Giữ nguyên cả vertex/fragment shader prototype: attenuation 230/z, seed twinkle, trắng #FFFFFF và xám #BBBBBB, additive/depthWrite false/frustumCulled false.
- `src/3d/utils/buildStarGeometry.js`: module-level factory sinh BufferGeometry, position/aSize/aSeed. Phân bố x ±34, y ±20, z -300..130. useMemo chỉ tạo lại khi count đổi; effect dispose geometry khi count đổi/unmount. Math.random nằm trong factory, không nằm trong body component/useFrame.
- `src/3d/quality.js`: export QUALITY = high 10000 / medium 4000 / low 1500. Bộ đệm thuộc tính lần lượt 200000 / 80000 / 30000 bytes.
- `src/3d/components/Nebula.jsx`: position/scale/colorA/colorB/frozen; giữ nguyên 2 shader, fbm 5 octave, procedural additive. GalaxyScene dùng đúng hai lớp và vị trí/màu của prototype.
- `src/3d/components/BlackHole.jsx`: group z=-200, sphere horizon đen, photon torus trắng, accretion shader và tilted torus. Rotation/pulse tương đương prototype chuyển vào vertex shader, CPU chỉ cập nhật uTime. Sửa lỗi alpha tail của prototype để về 0 tại r>=1: không còn hình vuông ở mép plane khi xem cận cảnh. Không thêm bloom.
- Các callback useFrame chỉ cập nhật uniform; không new object/vector/material, không random, không setState. Delta cộng dồn (cap 0.1s) giữ pha khi frozen và tránh bước nhảy lớn sau pause. uPixelRatio theo gl.getPixelRatio() thực tế, không theo DPR chưa cap của window.
- `GalaxyScene.jsx`: gắn StarField + 2 Nebula + BlackHole, nối useReducedMotion, dùng QUALITY theo breakpoint đã có; prop count tùy chọn cho QA/tier control tương lai. Giữ children extension point, camera/DPR/fallback/visibility của task 1.5.
- Không sửa App, component DOM, dependencies, CameraRig, postprocessing hay prototype. SHA256 src/3d-lab.jsx giữ nguyên `C1EE729EB315A4C95C7B97C7A9DD0C7B4E8C1FDFF0C60EBCA31619A7C62E8F4D`.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS, Vite + PWA hoàn tất; cảnh báo chunk 3D >500kB vẫn có, không tắt cảnh báo |
| ESLint 6 file production trong task | PASS, gồm react-hooks/purity |
| node outputs/task-1.6/check-shaders.mjs | PASS: 4 shader StarField/Nebula khớp nguyên văn prototype, hash prototype không đổi, buffers/attributes/ranges/disposal đúng cả 3 tier |
| Browser chức năng | 21/21 PASS ở cả lượt trước và sau sửa alpha disk; browser-final-results.json |
| WebGL/shader compile | Không WebGL error; shader programs runnable; không lỗi shader trong console |
| Tài nguyên steady state | 7 geometries, 7 draw calls, 0 textures; đổi count không tạo thêm renderer hoặc tích lũy geometry |
| Tier changes | Count đúng 10000/4000/1500; geometry cũ nhận dispose khi đổi tier |
| Reduced motion | Mô phỏng matchMedia chỉ trong QA: cả 5 material có uTime đứng yên, geometry giữ nguyên, thời gian tiếp tục khi bật lại |
| Unmount | 14/14 geometry/material được dispose; Canvas và ScrollSmoother bị gỡ; cleanup.json |
| Góc nhìn camera | Bản cuối có 6365 / 7610 / 8633 sao trong frustum tại z=0 / 55 / 110, và 2586 sao tại z=-160 để kiểm hố đen cận cảnh |
| Cuối trang QA | scrollY=maxScroll=2790 tại camera z=110; vẫn 10000 points, 7 draw calls; end-state.json, end.png |
| Trang chính | Preloader xong, 1 Canvas, cuộn tới scrollY=maxScroll=3923; app-end-state.json, app-end.png |

## FPS và giới hạn đo

Lượt Browser hiển thị, RTX 4060 / ANGLE D3D11, Canvas 1091×930, DPR 1, không bloom: mỗi tier lấy khoảng 5 mẫu một giây. Median high 165.00, medium 165.08, low 165.00 FPS; các mẫu 164.06–165.99. Evidence: browser-visible-results.json. Tại cuối trang và camera z=110 cũng ghi nhận 165 FPS (end-state.json). Đây là số frame useFrame, không chỉ rAF của DOM; không đại diện mobile/GPU khác hoặc DPR cao hơn.

Phiên Browser chạy nền sau đó ghi nhận khoảng 1 FPS ở **cả ba tier**, kể cả bản cuối (browser-final-results.json). Điều này phù hợp với việc host/tab không được trình bày chủ động; công cụ mở Browser cũng trả trạng thái queued vì thread chưa hiển thị. Đây là suy luận về throttling của môi trường, không phải phép đo GPU riêng. document.visibilityState vẫn báo visible, nên không suy ra mức render chỉ từ thuộc tính này. Giữ cả evidence 165 FPS lẫn evidence 1 FPS; không khẳng định tốc độ luôn >=120 trong mọi trạng thái. Không đổi cờ Browser/OS hay sửa frameloop để vượt giới hạn host.

## DoD còn giới hạn tích hợp

1. Các section WIP thật còn background đục: Hero/Education/Contact rgb(245,245,240), About/Work rgb(26,26,26). Chúng nằm trên Canvas, nên trang chính chưa nhìn thấy trường sao ở mọi đoạn. Scene production đã được kiểm trực quan trên fixture với foreground trong suốt; chưa tính điều đó là hoàn tất yêu cầu hiển thị toàn trang WIP. Việc thay nền/thiết kế DOM thuộc migration Phase 2.
2. Camera production vẫn ở [0,0,0]. Fixture chỉ đặt camera tại các mốc rời rạc, không viết CameraRig. Bay theo cuộn thuộc task 1.7. Prototype z=0→110 thực chất lùi xa hố đen z=-200; giữ nguyên baseline và kiểm thêm z=-160 để chứng minh asset cận cảnh.
3. Console chưa sạch hoàn toàn: THREE.Clock deprecated do Fiber 9.8.1 tạo THREE.Clock trong `node_modules/@react-three/fiber/dist/events-9ce18a08.esm.js`, và GSAP target cũ ở trang WIP. Đã tồn tại ở task 1.5; task này không thêm warning shader. Không che warning hoặc sửa node_modules. console.json/app-console.json lưu evidence.

Vì ba giới hạn trên, ghi tiến độ là phần shader đã triển khai/verify, chưa đánh dấu toàn bộ DoD tích hợp đạt.

## Chạy lại / sử dụng

- Dev server hiện có: http://localhost:5173.
- `/outputs/task-1.6/shader-qa.html`: Run checks + FPS; các nút đổi count, mốc camera, reduced motion, cuộn đầu/cuối, Test unmount. Đây là QA riêng, không import trong App. Để đo FPS, mở trang thành tab đang hiển thị chủ động.
- `import { QUALITY } from '@/3d/quality'`; `<StarField count={QUALITY.medium} frozen={reducedMotion} />` trong Canvas, hoặc `<GalaxyScene count={QUALITY.medium} />`. Khi không truyền count, GalaxyScene dùng breakpoint hiện có.
- `black-hole.png`: bản cuối đã bỏ mép plane vuông; `start.png`/`end.png`: cảnh đầu/cuối trong lượt đo hoạt động trước sửa riêng alpha disk.
- `extract-components.mjs`: nguồn tái tạo 3 component từ prototype, có duy nhất sửa alpha disk được ghi rõ; không tự chạy khi build.

API đối chiếu: [R3F objects, ownership và disposal](https://r3f.docs.pmnd.rs/api/objects), [Three ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html).
