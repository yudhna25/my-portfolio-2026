# Task 1.1 — Design System CSS

Ngày kiểm chứng: 04/10/2026. Agent: Codex.

## Thay đổi

- `src/styles/globals.css`: primitive → semantic → component; palette dark/light theo kế hoạch; Tailwind 4 `@theme inline static`; font/type scale; ba component hook chỉ có placeholder.
- `src/index.css`: import Tailwind/globals, CDN Space Grotesk 300–500 và JetBrains Mono 400; loại bỏ toàn bộ token/import shadcn cũ; giữ scrollbar, selection, stroke/split/noise/ScrollSmoother helpers; reduced motion.
- `src/main.jsx`: thêm duy nhất import CSS của `@fontsource-variable/unbounded`. Import ở entry JS giúp Vite đóng gói đúng các URL WOFF2; family thực của package là `Unbounded Variable`.
- `AGENTS.md`: thêm một dòng tiến độ, giữ nguyên nội dung cũ.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run build` | PASS, không lỗi/cảnh báo; Vite và PWA hoàn thành |
| `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort` | PASS; server giữ chạy ở `http://localhost:5173/` |
| Dark primitives | PASS; script đọc trực tiếp mục 4.1 và so sánh nguyên văn cả 9 giá trị |
| Glow | Chỉ có `--glow-button` và `--glow-button-strong`; chưa áp dụng shadow vào component |
| `src/index.css` | Không còn `oklch`, shadcn import, primary/destructive/chart/sidebar tokens |
| Font build | PASS; bốn URL font đầu ra trỏ tới WOFF2 hợp lệ, bao gồm Vietnamese |
| Browser — trang chủ | Render WIP; `html/body` = `rgb(5, 5, 5)`; body Space Grotesk; heading Unbounded Variable; dấu trong tên Trần Vũ Anh Duy hiển thị đúng |
| Browser — Design Lab | Nền = `rgb(5, 5, 5)`; Unbounded; mẫu `TRẦN VŨ ANH DUY` có dấu đúng |
| Browser — semantic light | Background `#FAFAFA`, foreground/accent `#111111`, card `#FFFFFF`, secondary `#666666`, glow `0 0 20px rgba(0,0,0,0.25)` |
| Browser — theme lồng nhau | PASS; light → dark → light giữ đúng semantic CSS variables và Tailwind utilities; primitive dark không thay đổi |
| Browser — bề ngang WIP | Không có horizontal document overflow ở viewport QA; typography utility của WIP vẫn override base scale |
| Phạm vi chỉnh sửa | Hash SHA256 của App, tất cả components, Vite config và Design Lab không đổi so với lúc bắt đầu |
| `npx eslint src/main.jsx` | PASS |
| `npm run lint` | FAIL do hai lỗi refs có sẵn trong Preloader/Work; hai cảnh báo unsupported-syntax trong SplashCursor |

## Quyết định và giới hạn

- Mục 4.2 quy định khoảng display 4rem–12vw, body 1rem–1.25rem, label 0.875rem, nhưng không chốt riêng h1–h6. Thang chữ được suy ra trong khoảng đã cho; weight heading là 600/700/800, body/label mặc định 400. Không thay các giá trị spec đã chốt.
- Light mode chưa có giá trị riêng cho elevated/muted hoặc strong glow. Dùng lại các giá trị mono đã có; strong glow light alias về glow light đã được chốt.
- WIP vẫn có class màu sáng/đỏ, font weight và kích thước cũ trong JSX. Đây là giới hạn phạm vi task: không sửa component/UI Phase 2. Nền CSS chung đã chuyển sang #050505; các section hardcode của WIP tiếp tục override nền chung.
- Lỗi click Profile: `ScrollSmoother.offset` đọc `style` của target không tìm thấy trong scope Nav. Đã tái hiện cùng lỗi trên WIP dùng bản CSS nguyên trạng trước migration, nên đây là lỗi có sẵn. Không sửa Nav trong task CSS này.
- Các cảnh báo GSAP về target `.welcome-word` có sẵn trong Preloader. Reduced motion được khai báo ở CSS; không đổi thiết lập motion của hệ điều hành để thử.
- Các trang HTML đối chứng/theme chỉ dùng tạm khi QA và đã được xóa sau kiểm chứng.

## Ảnh QA

- `homepage.png`: WIP sau migration.
- `profile-vietnamese.png`: font Unbounded Variable với tên có dấu.
- `design-lab.png`: tham chiếu mono và mẫu typography tiếng Việt.
