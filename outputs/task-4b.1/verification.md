# Task 4B.1 — Palette & Smoked Glass

Ngày: **07/10/2026**. Trạng thái: **PASS**. Phạm vi: 5 sections About / Works / Experience / Education / Contact; 12 bề mặt chính và các caption/tool/chip của About.

## Thay đổi

- `src/styles/globals.css`: primitive spectrum Amber/Cyan và glass tint; public aliases `--color-cosmic-amber`, `--color-electric-cyan`, `--color-glass-surface` trong theme boundaries và Tailwind 4 `@theme inline static`. Giá trị resolve đúng **#F59E0B / #00F0FF / rgba(5,5,5,0.65)**. Border tokens đúng **rgba(0,240,255,0.15)** và **rgba(255,255,255,0.08)**. Không đổi các giá trị mono cũ hoặc glow CTA.
- `src/index.css`: một hook `.glass-card` cho lớp bảo vệ độ đọc; hover/focus dùng `--border-glass`, không bị rule `.hover-card` trắng cũ ghi đè. Chip lồng dùng backdrop đã blur của panel, tránh blur hai lần.
- `About.jsx`: avatar, caption, panel nội dung, tools và pills dùng token kính; heading/prose trắng đặc. Không dùng stroke bán trong suốt cho tên trong panel.
- `Work.jsx`: 3 project surfaces kính, section nền trong suốt; giữ ảnh, link, coming-soon, Flip và toàn bộ useGSAP.
- `Experience.jsx`: 3 mission cards kính; mô tả, năm/role và heading trắng.
- `Education.jsx`: 3 article kính, giữ đường SVG/DrawSVG và bố cục xen kẽ. File thực tế ở `src/components/Education.jsx`; dự án không có `src/components/sections/Education.jsx`.
- `Contact.jsx`: một panel kính cho toàn bộ nội dung, links dùng divider thay kính lồng. CTA giữ nền trắng/chữ đen và glow riêng. Điều chỉnh clamp/padding mobile để bù khoảng đệm panel.

Amber được khai báo sẵn cho các task 3D tiếp theo; task này chỉ dùng cyan ở viền mảnh hover/focus. Không thêm gradient màu hoặc đổi shader/Canvas. UI bề mặt/chữ vẫn monochrome.

## Độ tương phản: lý do có lớp bảo vệ

Token kính **65%** được giữ chính xác. Nhưng rgba(5,5,5,.65) trên pixel trắng tạo RGB92.5, chỉ **6.357:1** với #FAFAFA; blur không tự làm nền tối hơn. Vì vậy `.glass-card` có lớp scrim **#050505 20%** đồng nhất, khai báo bằng hai stop cùng màu của background-image (không có chuyển màu). Qua hai lớp, nền trắng tối đa thành RGB75; giả định thêm grain trắng 5% ở lớp trên cùng cho RGB84. Bound bảo thủ của chữ #FAFAFA là **7.255:1**. Độ truyền sáng còn **28%**, đủ để hình dạng đĩa bồi tụ và sao lộ qua kính.

Không dùng text-shadow để thay cho phép đo contrast. Text nội dung/metadata trong các card được nâng lên primary trắng; CTA đen trên mặt trắng được đo riêng. Các tiêu đề section đứng ngoài card ở Works/Education/Experience không nằm trong bound kính này; đây không phải chứng nhận toàn bộ trang WCAG.

Mục tiêu 7:1 nghiêm hơn mức AA cho body text; ngưỡng 7:1 thuộc Contrast Enhanced (AAA) cho text thường. [W3C Understanding 1.4.6](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html).

## Edge / CDP verification

Lệnh tái chạy: `npm run dev` rồi `node outputs/task-4b.1/verify.mjs`. Script dùng Edge headless có sẵn + Playwright/Sharp của bundled runtime, không cài dependency cho project.

Browser: **Edge 154.0.4258.53**. **1646 assertions PASS**, 0 console/page error trong lượt cuối. [results.json](./results.json).

- DOM computed styles: 12 main surfaces × 8 configurations; nền đúng rgba65%, blur12px, viền subtle8%, neutral scrim và màu text.
- Dark: **320 / 390 / 768 / 1024 / 1440 / 1920px**. Light: **390 / 1440px**. Mỗi cấu hình `scrollWidth === clientWidth`, không thêm body overflow-x hidden để che lỗi.
- Reduced-motion được dùng cho phép đo pixel ổn định; chạy `no-preference` riêng cho ảnh thật, hover/focus và filter. Không thay motion guards hoặc camera.
- CDP `DOM` + `CSS.getBackgroundColors` lấy background/font metadata. Với Canvas, kết quả CSS không đủ phản ánh pixel phía sau: script lấy Range rects của chữ, tạm ẩn foreground text trong trang kiểm chứng, screenshot rồi đo pixel background đã compositing. Không lấy pixel anti-alias glyph làm màu chữ.
- Stress test: nền GalaxyScene trắng hoàn toàn và canvas tạm hidden trong trang kiểm chứng; token kính vẫn65%. Sau test khôi phục CSS. Thêm lượt không backdrop-filter để xác nhận contrast không phụ thuộc blur.
- Mỗi phép đo pixel là một frame/pose; bound toán học trắng+grain ở trên bảo vệ trường hợp sáng hơn giữa các frame. Không suy diễn mọi frame đã được screenshot.

| Section | Min pixel contrast, Canvas thật | Min pixel contrast, nền trắng stress |
| --- | --- | --- |
| about | 18.539:1 | 7.751:1 |
| work | 18.355:1 | 7.760:1 |
| experience | 17.617:1 | 7.777:1 |
| education | 9.966:1 | 7.785:1 |
| transmission | 7.954:1 | 7.734:1 |

Min pixel toàn bộ: **7.734:1**, trên ngưỡng7 mà không làm tròn để pass.

Hover Works: border **rgba(0,240,255,.15)**, transform scale1.05/y−4 theo interaction hiện có, **box-shadow:none**. Focus outline≥2px. Filter Product / UX/UI / Graphic mỗi loại hiện1 card, All trở lại3; Flip không bị thay code.

## Snapshots

- [About desktop](./about-desktop.png)
- [Works desktop](./work-desktop.png)
- [Experience desktop](./experience-desktop.png)
- [Education desktop](./education-desktop.png)
- [Contact desktop — phiên đo contrast](./transmission-desktop.png)
- [Contact — scene đang được cập nhật đồng thời](./contact-current-scene.png)
- [Contact mobile390](./contact-mobile.png)
- [Nền trắng stress](./white-stress.png)

## Build, lint và bảo toàn thay đổi đồng thời

- `npm run build`: pass **4,91s**; log cuối ở [build.log](./build.log). Warning chunk>500KB đã có trước task.
- `npm run lint`: exit0, **0 errors / 2 warnings SplashCursor cũ**; không lỗi mới. [lint.log](./lint.log).
- Không thêm dependencies/assets production, không sửa i18n/data/3D/App trong task này. [source-final.json](./source-final.json) ghi hash7 source files đã sửa.
- Smoke cuối trên scene hiện tại: 1 Canvas, glass65%/blur12px/primary trắng, 1440px không overflow, 0 console error. [current-scene-smoke.json](./current-scene-smoke.json) ghi hash các file 3D được phiên khác cập nhật trong lúc làm task; task này không sửa hoặc hoàn tác chúng. Bound nền trắng của kính không phụ thuộc màu shader.
- `src/i18n/locales/vi.json` và `en.json` đổi trong một phiên khác lúc QA đang chạy; giữ nguyên, ghi before/after trong `results.json.protectedFiles`. App/data.js/CameraRig/BlackHole khớp baseline. [protected-baseline.json](./protected-baseline.json).

## Giới hạn

Đo viewport trên Windows/Edge, chưa kiểm tra điện thoại thật hoặc Safari. Không tuyên bố FPS thiết bị hoặc chứng nhận toàn trang WCAG. Các ảnh đo contrast được chụp trong phiên scene mono. Snapshot smoke cuối ghi scene từ phiên 3D đang thay đổi đồng thời; việc thiết kế/chỉnh shader không thuộc task4B.1. Token65% + neutral scrim và màu primary giữ nguyên trong cả hai root theme.
