# Task 4B.7 — Interactive Gravitational Lensing

Ngày: 07/10/2026. Kết quả: **✅ Xong**.

## Thay đổi

- Chỉ sửa runtime `src/components/Cursor.jsx`: một SVG displacement filter và một lớp backdrop trong suốt 80×80px, clip hình tròn bán kính 40px, đi theo tọa độ viewport bằng `gsap.quickSetter` trong lifecycle `useGSAP` hiện có.
- Bản đồ vector được tạo một lần ở module bằng SVG gradient procedural. Scale = 6; falloff hướng về giá trị trung tính ở mép. Độ dịch mỗi trục tối đa đo từ bản đồ khoảng **1,12 CSS px**. Hai kênh R/G chỉ là dữ liệu vector của filter, không vẽ màu lên trang.
- Chỉ kích hoạt trên `[data-project-image]`, heading lớn trong `main` và heading project. Hero giữ nguyên `pointer-events: none`; Cursor kiểm tra hình chữ nhật heading khi main nhận sự kiện xuyên qua.
- Lớp lens z-30 nằm dưới cockpit HUD/Nav, giữ chữ điều khiển và label VIEW sắc nét. Giữ nguyên vòng/dot, VIEW/XEM, magnetic, cursor hệ thống, layout, dữ liệu và Canvas 3D.
- Chỉ desktop ≥1024px, hover/fine pointer; vô hiệu khi có coarse pointer/touch capability hoặc trình duyệt không nhận CSS backdrop-filter URL. Reduced-motion bỏ cả lens/filter khỏi DOM.
- Tab, rời mục tiêu, scroll, resize, blur, hidden tab và touch input xóa lens. Listener/GSAP được cleanup khi unmount hoặc đổi reduced-motion. Không thêm dependency, texture, Canvas hay render loop riêng.

## Kiểm chứng

Chạy lại trên máy này:

```powershell
npm run dev
node outputs/task-4b.7/verify.mjs
npm run build
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
node outputs/task-4b.7/production-smoke.mjs
npm run lint
```

Hai script dùng Playwright bundled và Edge executable cài sẵn; đường dẫn nằm ở đầu script, không thêm package vào dự án.

- **64/64 assertions pass**, kết quả thô: [results.json](./results.json).
- StrictMode: đúng 1 lens + 1 filter + 1 bộ listener. Ba chu kỳ live reduced-motion/resize: lens DOM 1→0→1, listener 3→0→3, không tích lũy.
- Hover Hero/About/Works, cả 3 cover kể cả project pending; vùng paragraph/CTA/Menu không kích hoạt. Tab/Escape/focus restore và magnetic giữ hoạt động.
- Viewport 390/1023/1024/1440/1920; fresh touch, fresh reduced-motion; đổi Vi→En và autoSplit rebuild pass. VIEW dịch đúng; 1 Canvas.
- **Production smoke pass**: điều hướng bằng Nav thật tới Works, CSS filter URL và circle clip tồn tại trong bundle, reduced-motion gỡ lens, không console/runtime error. [production-smoke.json](./production-smoke.json).
- **Build pass 4,75s**; PWA 29 entries. [build.log](./build.log). Scoped Cursor lint pass; lint toàn repo **0 errors, 2 warnings cũ** ở SplashCursor. Console chỉ còn warning `THREE.Clock` cũ; không lỗi mới.

## Pixel proof

Ảnh OFF/ON được chụp tại cùng tọa độ, ẩn riêng vòng/dot để nhìn vùng khúc xạ. So sánh heading tạm đóng băng nền 3D bằng visibility simulation; scene được khôi phục trước benchmark. Không sửa ứng dụng để tạo ảnh.

| Vùng | Pixel thay đổi >4 mức RGB trong bán kính 40px | Ngoài bán kính 40px, vùng kiểm tra 100×100px |
| --- | ---: | ---: |
| Heading Works | 1.851 | 0 |
| Cover EDURA | 136 | 0 |

Ảnh so sánh trái→phải: OFF, ON, sai khác ×3. Crop được phóng 2×, hiệu ứng thực khoảng 1px.

![Heading: OFF / ON / difference ×3](./heading-comparison.png)

![Project: OFF / ON / difference ×3](./project-comparison.png)

Ảnh đầy đủ: [Hero](./hero-lens.png), [Works với cursor VIEW](./works-lens.png), [heading OFF](./heading-off.png), [heading ON](./heading-on.png), [cover OFF](./project-off.png), [cover ON](./project-on.png).

## CDP Edge — render thực khi rê chuột liên tục

Edge **154.0.4258.53**, Windows, ANGLE/D3D11, **NVIDIA RTX 4060**, viewport và drawing buffer **1440×900**, DPR1, tier high 24.000 sao, scene/bloom hiện hành.

Mỗi lượt 5s, dùng `Input.dispatchMouseEvent` thật khoảng 64 sự kiện/s trên cùng đường rê ở cover. Đếm `WebGL2RenderingContext.drawArrays(POINTS, …, 24000)` của StarField: một submission mỗi main scene render, không dùng RAF đơn thuần làm FPS. Đồng thời trace `DrawFrame` qua CDP và đo Performance metrics. Baseline chỉ bỏ backdrop filter; vòng/dot/magnetic/3D và đường input giữ như lượt ON.

| Lượt | Lens filter | Canvas render frames | FPS | p95 frame ms | Frame >16,7ms |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | OFF | 827 | 165,05 | 6,7 | 0 |
| 2 | ON | 810 | 161,82 | 6,7 | 2 |
| 3 | OFF | 824 | 164,60 | 6,8 | 1 |
| 4 | ON | 827 | 165,03 | 6,9 | 0 |

CDP ghi **3.311 compositor DrawFrame events** trên một stream. Lens ON đạt **161,82–165,03 FPS**, cao hơn ngưỡng 60 FPS. Lượt ON đầu có 470 layout so với 5 ở các lượt còn lại; report giữ nguyên số liệu của toàn ứng dụng, gồm công việc refresh/animation khác. Không quy toàn bộ dao động đó cho lens; lượt ON sau ổn định như baseline. Đây là render/submission và compositor telemetry, không phải phép đo GPU execution time độc lập.

## Giới hạn / tài liệu

- Đã xác minh bằng Edge trên máy dev; chưa xác minh Firefox/Safari, GPU tích hợp hoặc thiết bị thật. CSS support guard giữ cursor thường nếu cú pháp backdrop-filter không được hỗ trợ; parser support không bảo đảm mọi engine render SVG backdrop giống Edge.
- Reduced-motion và touch được mô phỏng qua browser, không thao tác cài đặt OS trong phiên này.
- Skill `ui-ux-pro-max` đã áp dụng, đặc biệt motion sensitivity/reduced-motion. Không tìm thấy skill `clean-code` sau khi tìm các skills roots; lifecycle/cleanup kiểm tra trực tiếp, không cài thêm skill/dependency.
- Tham khảo API: [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter), [MDN feDisplacementMap](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feDisplacementMap), [MDN color-interpolation-filters](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/color-interpolation-filters). Filter dùng sRGB để giá trị vector trung tính 0,5 không bị chuyển sang linearRGB.

Runtime source SHA256 đã kiểm tra: `C8E89DE768FA139F78DA74CBCEFAD1A94985256CB34A764868DB3B816AF461E4`.
