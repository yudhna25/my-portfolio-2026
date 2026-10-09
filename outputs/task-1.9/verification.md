# Task 1.9 — Theme toggle

05/10/2026 — Codex.

## Thay đổi

- `public/theme-init.js`: script classic chạy đồng bộ trong head, trước CSS/React. Ưu tiên giá trị dark/light hợp lệ từ `stellar-theme`, nếu thiếu/sai thì xét OS light, còn lại dark. OS initialization không ghi một lựa chọn manual vào storage. Đọc storage bị chặn vẫn fallback OS.
- `index.html`: meta mặc định sửa về #050505; thêm bootstrap và stylesheet link render-blocking. `src/main.jsx` bỏ import index.css trùng; Fontsource/i18n/React giữ nguyên. Build giữ bootstrap trước CSS/module; theme-init.js nằm trong PWA precache.
- `src/stores/useThemeStore.js`: khởi tạo từ theme đã được bootstrap trước render. toggleTheme gọi setTheme, action hợp lệ áp dụng đồng bộ lên DOM, meta và localStorage. Light gắn data-theme="light"; dark tháo attribute để dùng semantic :root. applyTheme tự tạo meta nếu thiếu. Storage write bị chặn không làm nút hỏng. Không middleware/Context/listener OS liên tục.
- `src/components/ui/ThemeToggle.jsx`: named export, hai selector đơn giản, Lucide Sun/Moon, labels qua i18n. Button 44×44px, fixed top-20/right-4, z-50, pointer-events auto, đặt ngoài smooth-wrapper trong App. Top 80px tránh Nav WIP ở phía trên. Border secondary → foreground khi hover, không animation/glow. Focus dùng outline 2px/offset4 và ring 2px zero-blur màu background để vẫn rõ trên nền WIP khác theme.
- Locales Vi/En thêm common.theme.toLight/toDark. Giữ nguyên mọi giá trị token; SHA256 globals.css không đổi (`palette.before.json`). Không sửa CTA, component WIP, camera/shader, dependencies hoặc Vite config.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS, Vite 7.3.6 + PWA; warning chunk 3D >500kB hiện có còn |
| ESLint 5 JS/JSX trong task | PASS |
| Lint toàn repo | Không thêm issue; trước/sau 2 errors + 2 warnings WIP cũ (refs Preloader/Work, unsupported-syntax SplashCursor) |
| node outputs/task-1.9/check-theme.mjs | 14/14 PASS: bootstrap storage/OS/fallback/blocked storage, store actions, meta recreation, SSR, HTML order, Vi/En parity |
| Browser dev :5173 | Click đổi icon/label/meta/token không reload; nút ngoài wrapper, fixed z50/top80/pointer-auto; Tab/ShiftTab focus rõ trên WIP |
| Browser snapshot checks | 10 snapshots + assertions PASS (`check-browser.mjs`, `browser-results.json`): dark/light, storage priority, clear → OS, no preference → dark, Enter/Space giữ navigation identity, labels En |
| First paint semantic | Light đã lưu dù OS dark: FP/FCP rgb(250,250,250), attribute light. Dark đã lưu dù OS light: FP/FCP rgb(5,5,5), attribute absent. Không có paint sai mode trong hai lượt này |
| Tokens light | background #FAFAFA, nebula #F2F2F2, card #FFFFFF, foreground #111111; glow vẫn token light hiện có 0 0 20px rgba(0,0,0,0.25) |
| Contrast computed CSS | Foreground/background: dark 19.53:1, light 18.09:1. Border trạng thái thường: dark 7.15:1, light 5.50:1; hover về foreground. Button UI mono không glow |
| Keyboard | Nút native button, Tab vào được, Enter/Space activate; outline foreground 2px offset4 + ring background2 zero-blur; focusVisible=true ở cả mode, target44px |
| Production preview :4173 | Bản build tải script/CSS đúng; native OS light, Enter → dark, không restart preloader; refresh giữ dark, CSS asset cuối CfBH5wSr; preview-toggle/preview-refresh.json |
| Console QA | Không error/warning (`qa-console.json`). Trang WIP còn warning Clock/GSAP đã có từ trước |

Dùng dev server :5173 sẵn có của workspace, và npm run preview cho bản dist. OS dark/light/none được mô phỏng trước bootstrap chỉ trong fixture; trang chủ/preview cũng dùng preference native hiện tại (light). Không thay cài đặt Windows.

## Phạm vi và giới hạn

Cơ chế theme, store, nút và CSS semantic đã hoàn thành. Trang WIP hiện còn `bg-[#F5F5F0] text-[#1a1a1a]` tại App root và nhiều màu hardcode trong sections/Nav/Preloader; các phần này **chưa đổi màu đồng bộ theo theme**. Canvas cũng giữ màu/shader đã được duyệt ở các task 3D. `home-check.json` thể hiện body dark #050505/#FAFAFA trong khi root WIP vẫn rgb(245,245,240)/rgb(26,26,26).

Vì vậy kiểm tra tránh FOUC và contrast ở đây áp dụng cho CSS semantic và toggle. Đây không phải xác nhận toàn bộ UI WIP đã được migrate hoặc đạt toàn bộ WCAG. Migration các section/theming 3D thuộc phần UI tiếp theo; không dùng global override/invert để đổi sai artwork hoặc CTA.

Fixture theme-qa.* và các scripts kiểm chứng nằm trong outputs, không đi vào App bundle. Screenshots theme-dark-final.png/theme-light-final.png chứng minh token và nút; home-dark-focus.png chứng minh vị trí/focus trên trang WIP. Test storage chỉ xóa key stellar-theme, không clear dữ liệu origin khác.

Đối chiếu: [Tailwind theme qua data attribute và head bootstrap](https://tailwindcss.com/docs/dark-mode), [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
