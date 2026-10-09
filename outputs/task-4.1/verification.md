# Task 4.1 — Responsive Layout Audit

Ngày: 06/10/2026. Kết quả: **PASS** tại 320, 390, 768, 1024, 1440, 1920px; kiểm tra thêm 2560px.

## Những vị trí đã tinh chỉnh

| File | Điều chỉnh |
|---|---|
| `src/index.css`, `src/App.jsx` | Bỏ `overflow-x: hidden` thường trực ở body và root App. Giữ clipping của viewport ScrollSmoother và các dải chữ trang trí. |
| `index.html` | Thêm `viewport-fit=cover` vào viewport meta; giữ toàn bộ SEO/PWA từ các phiên khác. |
| `layout/Nav.jsx` | Chiều cao và padding cộng safe-area top, padding ngang bảo vệ cạnh trái/phải; min-width 44px cho link/logo, giữ auto-hide và offset theo chiều cao thực. |
| `layout/MenuOverlay.jsx`, `styles/menu.css` | Header/footer/khung link có safe-area; email wrap anywhere; link min-width 44px; clamp chữ menu. Bỏ scrollbar-gutter stable khi mở menu để không làm scrollWidth nhỏ hơn clientWidth. Giữ focus trap và scroll lock tạm thời. |
| `Hero.jsx`, `ui/ThemeToggle.jsx` | Safe-area cho padding, indicator và vị trí toggle. Giữ chính xác tên Hero `clamp(44px,12vw,200px)`; indicator cách marquee đầu 32px ở cả 6 viewport. |
| `Work.jsx` | Heading balance + wrap anywhere + `clamp(1.5rem,8vw,8rem)`; min-width 44px cho filter. Sửa chữ En dài ở 320px và bỏ dòng lẻ “ÁN” ở mobile. Giữ Flip, clip reveal và ảnh. |
| `Marquee.jsx` | Reduced-motion dùng chữ tĩnh co giãn/wrap. Dùng `data-speed="clamp(0.8)"` để giữ tốc độ parallax 0.8 nhưng tránh dải đầu bị đẩy lên che Hero indicator. |
| `Footer.jsx` | Container tối đa 1600px, clamp heading/email, line-height 1.15 và text balance; link điện thoại tối thiểu 44×44px; hàng cuối wrap. |

Không sửa nội dung locale JSON, cấu trúc dữ liệu hay token màu/typography toàn cục. Các component đã đạt yêu cầu được giữ nguyên.

## Kết quả DOM

Đo trên Chromium của Browser trong Codex, dev server `http://127.0.0.1:5173/`. Mỗi viewport có 8 section + Footer + MenuOverlay, đủ Vi/En: **20 poses/viewport**. Root và body đều có overflow-x visible khi menu đóng.

| Viewport CSS | clientWidth / scrollWidth khi đóng menu | Khi mở menu | Overflow | Hero font | Works font | Mobile target nhỏ nhất |
|---|---|---|---|---|---|---|
| 320×740 | 310 / 310 | 320 / 320 | 0px | 44px | 25.6px | 44×44px |
| 390×844 | 380 / 380 | 390 / 390 | 0px | 46.8px | 31.2px | 44×44px |
| 768×1024 | 758 / 758 | 768 / 768 | 0px | 92.16px | 61.44px | 44×44px |
| 1024×768 | 1014 / 1014 | 1024 / 1024 | 0px | 122.88px | 81.92px | Không áp dụng yêu cầu mobile |
| 1440×900 | 1430 / 1430 | 1440 / 1440 | 0px | 172.8px | 115.2px | Không áp dụng yêu cầu mobile |
| 1920×1080 | 1910 / 1910 | 1920 / 1920 | 0px | 200px | 128px | Không áp dụng yêu cầu mobile |

10px chênh giữa innerWidth và clientWidth là scrollbar dọc của môi trường đo, không phải overflow. Trong tất cả samples, **scrollWidth === clientWidth**; innerWidth luôn lớn hơn hoặc bằng scrollWidth.

- **120 normal poses**: 0 overflow, 0 va chạm link Nav, container không vượt 1600px, targets mobile đạt 44px.
- **120 reduced-motion poses**: 0 overflow và 0 text Range vượt cạnh heading ở trạng thái tĩnh; thêm **20 poses tại 2560px** cũng pass.
- **12 Works reflow poses** sau chỉnh clamp cuối: 6 viewport × Vi/En, SplitText rebuild đúng và chữ nằm trong heading. 320px Vi: “CHÒM” / “SAO DỰ ÁN”; En: “CONSTELLATION” / “OF PROJECTS”.
- **6 Hero poses trực tiếp ở trang chủ** sau chỉnh marquee cuối: indicator cách dải chữ 32px; Custom Cursor 0 ở 320/390/768, 1 từ 1024px. Hero 768px có bounds chữ x=113.125–644.859 trong clientWidth 758px.
- About giữ xếp dọc ở tablet portrait, chia 5/7 từ 1024px; Skills một cột ở 768px, ba cột từ 1024px. Works dùng grid 12 cột, card 8/7 xen kẽ từ 768px.
- 1920px: About/Skills tối đa 1280px; Works/Footer 1600px và cân giữa. Bonus 2560px vẫn giữ max-width.
- 3 demo thật trong Playground được cuộn tới để mount; các control mobile được đo cả vùng label checkbox, button và range input. Không tính thumbnail/decorative text là control.
- Native wheel tại 390px: cả ba marquee rộng 380px, body/root overflow visible và document vẫn 380/380. API marquee/text/hướng vòng lặp giữ nguyên.

Các Range ở heading đang chạy reveal có thể vượt vài pixel so với hộp heading do transform, nhưng vẫn nằm trong viewport. Lượt reduced-motion xác nhận bố cục tĩnh không bị tràn. Không dùng số đo giữa reveal để kết luận glyph bị cắt.

## Safe-area

Mô phỏng CSS env trên trang QA tại 390px: top=47px, bottom=34px, left/right=44px; thay giá trị trong stylesheet QA rồi khôi phục, không sửa CSS production cho mô phỏng.

| Vị trí | Env=0 | Env mô phỏng |
|---|---|---|
| Nav/header menu cao | 72px | 119px |
| Nav padding top / ngang | 0px / 24px | 47px / 44px |
| Hero padding top | 112px | 159px |
| Indicator bottom | 32px | 66px |
| Footer menu padding bottom | 16px | 50px |
| Theme toggle top | 80px | 127px |

16 CSS rules được đối chiếu. Không có overflow sau mô phỏng. Scroll lock overflow hidden chỉ tồn tại tạm thời khi preloader/menu mở; không che lỗi layout thường trực.

## Build, lint và kiểm tra có thể chạy lại

```powershell
npm run build
npm run lint
node outputs/task-4.1/check.mjs
```

- Build cuối: **PASS**, Vite 6.21s, PWA precache 33 assets. Warning chunk >500KB cũ vẫn còn.
- Lint cuối: **0 errors, 2 warnings** cũ tại SplashCursor (`react-hooks/unsupported-syntax`). Không có lỗi mới.
- `check.mjs`: **PASS**; kiểm tra log 6 viewport, reduced-motion, Works reflow, bonus 2560, safe-area, targets, khoảng cách Hero/marquee, viewport-fit, source hashes và dữ liệu được bảo vệ.
- Console phiên trang chủ cuối: **errors/warnings []** trong log Browser đã lưu. Hai lỗi Vite reload tạm thời ở tab QA cũ trong lúc ghi file được tách khỏi phiên xác nhận cuối; không tái xuất hiện. THREE.Clock là warning thư viện đã ghi ở các task trước.

## Bằng chứng và phạm vi

- `normal-*.json`, `reduced-*.json`, `works-reflow.json`: số đo từng section/locale.
- `safe-area.json`, `demos.json`, `final-hero.json`, `hero-tablet.json`, `final-native-scroll.json`, `final-work-390.json`, `final-console.json`.
- `build.log`, `lint.log`, `changed-files.json`, `verified-source.json`, `protected.json`, `concurrent-changes.json`.
- `qa.html`/`qa.jsx` mount App thật trong StrictMode, chỉ được dùng qua dev server; không thêm vào entry production.
- Ảnh trang chủ: `works-390-final.jpg`, `hero-320.jpg`, `hero-1920.jpg`, `hero-768-viewport.jpg`; `hero-768-full.jpg` là full-page. Một số screenshot mặc định trước đó chỉ chụp phần hiển thị trong panel Browser; full-page/clip xác nhận đủ chiều rộng CSS, không suy ra overflow từ ảnh panel bị cắt.

![Works mobile sau sửa](works-390-final.jpg)

Các thay đổi 3D quality từ Task 4.2 và SEO/PWA từ Task 4.6/4.7 được giữ nguyên. `src/i18n/config.js` đổi bởi phiên SEO để đồng bộ title/description; locale JSON, data và stores vẫn khớp baseline của lượt audit. Danh sách hash thay đổi đồng thời được lưu riêng; lượt responsive không sửa các file 3D đó.

Đã áp dụng web-design-guidelines và ui-ux-pro-max. Skill clean-code không có trong các thư mục skill hiện tại; dùng quy tắc code của dự án và chỉnh utility trực tiếp, không thêm abstraction/dependency. Tham chiếu [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) cho text wrapping/safe-area/target và [ScrollSmoother](https://gsap.com/docs/v3/Plugins/ScrollSmoother/) cho clamp speed để tránh initial displacement.

Giới hạn: viewport, reduced-motion và safe-area được mô phỏng; chưa đo thiết bị iOS thật hay bật setting motion ở OS. Đây là audit Chromium, không tuyên bố đã kiểm tra Safari/Firefox.
