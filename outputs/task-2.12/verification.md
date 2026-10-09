# Task 2.12 — Contact / Transmission

Hoàn thành 05/10/2026 trong `D:\Projects\my-portfolio-2026`.

## Thay đổi

- Tạo `src/components/sections/Contact.jsx`: headline hai dòng solid/stroke, Vi/En từ `contact.*`, nền `#050505`, Unbounded / Space Grotesk / JetBrains Mono.
- CTA email nền `#FAFAFA`, chữ đen, `data-magnetic`, glow đúng token `--glow-button`. Pulse chỉ tween opacity của lớp shadow trong CTA; dừng khi ngoài viewport. Không tween shadow/layout, không thêm hiệu ứng ngoài nút.
- Email + Facebook hiển thị; LinkedIn/Behance không render khi URL rỗng. Phone mono có `tel:0822021418`; mọi giá trị khớp `PORTFOLIO_DATA.profile` / locale hiện có, không tạo URL mới.
- Reveal từng dòng dùng một tween GSAP, y theo chiều cao dòng và stagger 0.14s. `motion-safe:opacity-0` giữ cả hai dòng đúng trạng thái trước reveal; tránh dư transform phần trăm khi ScrollSmoother refresh. `useGSAP` cleanup / live reduced-motion trả về text tĩnh và không có tween/trigger của Contact.
- App gắn Contact trong main, ngay trước Footer. Footer WIP đang sở hữu ID `contact`, nên section mới dùng `transmission`; `data/navigation.js` nối nhãn Contact của Nav/Menu tới anchor này, không trùng ID.
- Không sửa Footer, data, locale, content draft; không thêm dependency.

## Kết quả

- `npm run build`: PASS. Còn cảnh báo chunk lớn hiện có (scene 3D ~1,032KB; main ~501KB).
- ESLint phần source đã sửa: PASS. `npm run lint`: 0 errors, 2 warnings cũ trong `SplashCursor.jsx` (inline class).
- `node outputs/task-2.12/check.mjs`: PASS — nội dung draft Vi/En, profile/email/phone/Facebook, placeholder rỗng, parity nhóm Contact, thứ tự App và navigation target.
- `node outputs/task-2.12/check.mjs --browser`: PASS — 11 trạng thái trên Edge/Playwright, trang App thật qua dev server `http://127.0.0.1:5173/`.
- Responsive 320 / 390 / 768 / 1024 / 1440 / 1920: không tràn ngang hoặc clip headline; dấu Việt, font, hai dòng solid/stroke đúng. Đã xem ảnh desktop và mobile.
- Native Nav tới section mới; Menu đổi En, Escape đóng; source và ARIA chứa đúng nội dung hai ngôn ngữ. Không có ID trùng.
- Native pointer hover CTA: magnetic đo 7.2082px, ≤8px, reset về 0 khi rời; focus outline ≥2px. Các link có hit area ≥44px; Facebook `_blank` + `noopener noreferrer`.
- Click CTA thật: đích đúng `mailto:anhduy25work@gmail.com`. Test chặn default protocol handler một lần để không mở ứng dụng email hệ điều hành; chưa verify việc mở mail client OS hoặc gửi email.
- Pulse thay đổi opacity 0.3706 → 0.2833 trong 700ms; không có box-shadow trên phần tử nào ngoài CTA. Pulse pause khi Contact ngoài viewport.
- Hai lần bật/tắt reduced-motion: 0 Contact triggers/tweens khi reduce, headline opacity 1 / transform none, không ScrollSmoother; trở lại normal chỉ một pulse. Mobile reduced-motion sau reload: PASS, không DOM custom cursor.
- Console: 0 errors; còn một warning cũ `THREE.Clock deprecated` từ scene. Reduced-motion được mô phỏng bằng Browser media emulation, chưa bật công tắc OS trực tiếp.
- SHA256 Footer trước/sau giống nhau: `B4936099F86A131EC556C8C090F4BCBB3E2F2035E0225C7D7F74DB48AD52A3C3`.

## Bằng chứng

- `browser-results.json`: 11 poses, màu/font/transform/link/overflow, magnetic, pulse, ARIA, console.
- `contact-1440.png`, `contact-320.png`, `contact-en.png`, `contact-mobile-reduced.png`: ảnh viewport thực.
- Browser plugin Chrome DevTools không chạy được vì máy không có Chrome; dùng Edge đã cài và Playwright runtime có sẵn, không cài thêm công cụ.
