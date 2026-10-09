# Task 2.9 — Education / Star Map

Ngày: 05/10/2026. Kết quả: hoàn thành.

## Thay đổi

- Viết lại `src/components/Education.jsx`: danh sách 3 trường theo `education.*`, trục giữa desktop / trái mobile, nội dung xen kẽ, node 10px / active 18px. Nền #050505; tên trường Unbounded 24px; năm #555; bằng cấp #FAFAFA; chi tiết #999.
- Hai đoạn SVG nối chính xác tâm ba node bằng layout CSS. DrawSVG scrub 0.35, fade-up 24px; active dùng `--glow-button` trắng với opacity 0.35 theo yêu cầu. Reduced-motion hiển thị toàn bộ đường/text, không tween.
- Đăng ký và export DrawSVGPlugin một lần tại `src/hooks/useGSAPSetup.js`. Không thêm dependency, không sửa token, data/locale học vấn, App hay section khác.
- Cleanup useGSAP khi đổi ngôn ngữ/motion/unmount; xóa rõ class active vì ScrollTrigger.kill không tự xóa toggleClass.

## Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | Pass, 6.46s; PWA build thành công |
| `npx eslint src/components/Education.jsx src/hooks/useGSAPSetup.js` | Pass |
| `npm run lint` | 0 errors; 2 warnings SplashCursor cũ |
| Browser runnable check | 23/23 normal + 15/15 reduced = 38/38 pass |
| DrawSVG | Đúng 0/25/50/75/100%; resize/ngôn ngữ vẫn nối tâm node |
| Lifecycle | StrictMode, live reduced-motion, unmount/remount; 0 trigger/smoother còn lại sau unmount |
| App thật trên :5173 | Menu đổi En rồi Vi; cả 3 trường/năm/bằng cấp/chi tiết đúng locale |
| Cuộn native | Đường đầu từ 0 → ~70% → 100%; đoạn sau bắt đầu vẽ, node active chuyển Saigon → Arena |
| Responsive | App thật trong iframe viewport 320/768; desktop 1280. Không tràn ngang section/text; đường khớp node |
| Console | 0 errors; còn warning THREE.Clock thư viện cũ |

Ở 320px (client 310), trục x=25px; ở 768px (client 758), trục x=379px; desktop client 1270, trục x=635px. Chữ trường vẫn 24px, tự xuống dòng ở màn hẹp. API viewport của IAB không áp kích thước lên tab trong lượt này, nên dùng khung iframe cùng origin có viewport thật để xác minh media queries và App đầy đủ.

Reduced-motion được mô phỏng qua MediaQueryList, chưa đổi thiết lập OS trực tiếp. Màu năm #555 được giữ đúng yêu cầu; contrast với #050505 khoảng 2.73:1, không tuyên bố đạt AA cho dòng năm. Section giữ theme dark cục bộ để node/glow trắng đúng spec khi theme trang là light.

## Bằng chứng và chạy lại

- `check.html`: mở `http://localhost:5173/outputs/task-2.9/check.html`, bấm Run check; thêm `?reduced=1` cho chế độ giảm chuyển động.
- `responsive.html`: App thật trong khung, chọn viewport 320/768/1280.
- `check-normal.json`, `check-reduced.json`, `responsive-metrics.json`, `build.log`, `lint.log`.
- Ảnh `education-desktop.png`, `education-mobile.png`.
- Nội dung học vấn đối chiếu locale/draft hiện có. Hash cả file data/locale có thay đổi bởi công việc song song ngoài task này; task 2.9 không sửa các file đó.

Tham khảo API [DrawSVGPlugin chính thức](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/): dùng `100% live` để tính lại độ dài stroke khi kích thước SVG đổi.
