# Task 2.11 — Playground / Trạm Không Gian

05/10/2026 — hoàn thành.

## Phạm vi

- Tạo `src/components/sections/Playground.jsx`: bento 12 cột, 8 experiments đúng thứ tự; 3 khung LiveDemo + 5 thumbnail chữ; outline “Sắp ra mắt”, hover viền trắng 0.10 → 0.35, không glow.
- Tạo `src/components/effects/LiveDemo.jsx`: named export nhận `title` + `children`, khung 16/9, label LIVE JetBrains Mono. Khi chưa truyền children, dùng placeholder disabled; không có demo thật/WebGL/canvas mới.
- App gắn ngay sau Works và bật link Nav/Menu. Locale Vi/En chỉ thêm `liveLabel` và `comingSoon`; giữ nguyên toàn bộ tên/type experiments. Theo lựa chọn trực tiếp của người dùng, dùng nguyên `type` làm dòng mô tả/nhãn loại, không viết thêm description hoặc gán tag công nghệ mới.
- GSAP batch fade-up 40px / stagger 0.1, scope/cleanup bằng useGSAP; reduced-motion để nội dung tĩnh. Tái sử dụng hook/setup hiện có, không dependency/state mới.

## Kiểm chứng

| Check | Kết quả |
|---|---|
| `npm run build` | Pass 10.10s; PWA build thành công |
| Lint 3 file JSX đã sửa/tạo | Pass |
| `npm run lint` | 0 errors, 2 warnings SplashCursor cũ |
| Runnable Browser check | 21/21 normal + 20/20 reduced = 41/41 pass |
| Component contract | 8 ô / 3 slots / 5 thumbnails / 8 disabled buttons; children thay placeholder đúng; khung 16/9 |
| i18n | Vi/En: tên và type khớp nguyên locale; nhãn Coming soon/Sắp ra mắt đúng |
| Motion/lifecycle | Cuộn reveal đủ 8 ô, live reduced-motion, StrictMode remount; unmount còn 0 ScrollTrigger/ScrollSmoother |
| App thật :5173 | Playground ngay sau `#work`; Nav desktop và Menu mobile cuộn tới section đúng |
| Native hover | 8/8 ô tăng viền trắng lên opacity 0.35; mọi card box-shadow none |
| Responsive | App trong iframe same-origin 320/768; App desktop 1280. Không tràn ngang, 3 frame luôn 16/9 |
| Console App | 0 errors; còn warning THREE.Clock cũ |

Mobile client 310px: card 270px, frame 228×128.25. Tablet client 758px: hai cột 339px, frame 289×162.5625. Desktop client 1270px: spans 7/5, 6/3/3, 4/4/4; đúng 12 cột. Reduced-motion mô phỏng qua MediaQueryList, chưa đổi thiết lập OS trực tiếp. Warning chunk GalaxyScene >500kB đã tồn tại, không thay đổi kiến trúc 3D trong task này.

## Chạy lại / bằng chứng

- `npm run dev`; mở `/outputs/task-2.11/check.html` và bấm Run check; thêm `?reduced=1` cho reduced-motion.
- `/outputs/task-2.11/responsive.html`: chọn viewport 320/768/1280 cho App thật.
- `/outputs/task-2.11/check.html?preview=1&reduced=1`: cùng component, chế độ chụp toàn grid.
- `check-normal.json`, `check-reduced.json`, `browser-metrics.json`, `build.log`, `lint.log`, `playground-grid.png`, `playground-mobile.png`.

Các thay đổi Contact/App/locale từ công việc song song được giữ nguyên; task này không sửa nội dung section khác, data.js, token hoặc vite.config.
