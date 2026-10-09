# Task 2.13 — Marquee

Ngày: 05/10/2026 · Agent: Codex · Trạng thái: ✅ Xong

## Kiểm tra phần đang làm dở

Đã đọc kế-hoạch.md mục 8, AGENTS.md, Marquee.jsx, cả ba caller trong App.jsx và locale Vi/En. Nạp gsap-core, gsap-utils, gsap-performance; áp dụng frontend-design.

Bản đang có đã dùng hai nhóm nội dung giống nhau và GSAP xPercent. Phần còn thiếu: App dùng text tiếng Anh cứng, hướng chưa xen kẽ, dải cuối còn nền cream/border đen, typography chưa đúng 3rem. Vòng requestAnimationFrame tăng tốc không hủy callback khi cleanup; useGSAP chưa revert khi dependencies đổi.

Lưu bản trước khi sửa trong Marquee.before.jsx và App.before.jsx để đối chiếu.

## Phần hoàn thiện

- Marquee.jsx giữ nguyên default export và props text/speed/reverse/className; speed vẫn là thời lượng giây, mặc định 18.
- Giữ track kép với bốn lần lặp mỗi nửa; dùng một tween/strip, xPercent 0 → -50 hoặc -50 → 0, ease none, repeat -1. Bỏ boost/ScrollTrigger/RAF; useGSAP scope và revertOnUpdate đảm nhận cleanup.
- Unbounded 600 / 3rem; nền #050505, chữ #FAFAFA, mọi dấu • #999999, border-y rgba(255,255,255,0.08). Không glow hoặc màu mới.
- Reduced-motion hiển thị một câu tĩnh, xuống dòng để đọc đủ nội dung; bản trang trí aria-hidden, screen reader đọc một bản qua sr-only.
- App gọi nguyên các key đang có: common.marquees.design/projects/collaboration. Hướng trái–phải–trái, thời lượng 18/22/20 giây; giữ vị trí giữa các section.
- Chỉ sửa hai file production: src/components/Marquee.jsx, src/App.jsx. Không sửa CSS tokens, locales, drafts, dependencies hoặc các section.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS, Vite 7.3.6, build cuối 4.84s + PWA thành công |
| npm run lint | 0 errors; 2 warnings cũ ở SplashCursor.jsx |
| Dev | Dùng server đang chạy tại localhost:5173 |
| Browser normal | 52/52 PASS — check-normal.json |
| Browser reduced từ lúc mount | 31/31 PASS — check-reduced.json |
| Loop | Hai nửa bằng nhau, sai lệch điểm nối <1px; midpoint -25%; chuyển động thực trái–phải–trái |
| Lifecycle | StrictMode, đổi text/ngôn ngữ/speed/reverse, live motion change và unmount: không giữ tween/trigger cũ |
| Responsive component | Container 320/768/1280/1920px: track phủ đủ chiều ngang, clipping đúng; reduced static không tràn |
| Màu/font | App đo cả ba strip: #050505/#FAFAFA, Unbounded 48px/600, border alpha 0.08; xem app-metrics.json |
| Light theme | Strip giữ mono và contrast; không phụ thuộc foreground light |
| App thực | Native wheel qua dải đầu; Nav đến Works/Contact + wheel lên để xem dải thứ hai/thứ ba; ScrollSmoother hoạt động |
| Console | App + hai check: 0 console error; App chỉ còn THREE.Clock deprecation cũ |
| Content | SHA256 của vi.json, en.json, content-vi.md, content-en.md giữ nguyên; content-hashes.verify.json |

Ảnh App: marquee-app-design.png, marquee-app-projects.png, marquee-app-collaboration.png.

Reduced-motion được mô phỏng bằng MediaQueryList trước khi import hook và dispatch change để kiểm tra cập nhật trực tiếp. Chưa thay đổi setting OS thật. Kiểm tra responsive dùng chiều rộng container component, không phải resize OS/browser viewport. Build vẫn có cảnh báo chunk >500KB đã có từ trước.

## Chạy lại check

Chạy npm run dev; mở http://localhost:5173/outputs/task-2.13/check.html và nhấn Run check. Với reduced-motion từ lần mount đầu, mở cùng URL thêm ?reduced. Check dùng component thật và store/i18n thật; gsap.ticker.lagSmoothing(0) chỉ nằm trong trang QA để tab nền hoàn thành phép đo.
