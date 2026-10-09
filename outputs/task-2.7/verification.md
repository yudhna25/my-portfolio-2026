# Task 2.7 — Works: Chòm Sao Dự Án

Hoàn thành 05/10/2026.

## Thay đổi
- `src/components/Work.jsx`: grid dọc 12 cột, cards 8/7/8 cột xen trái/phải ở ≥768px, full width trên mobile. Heading Unbounded 8vw; body Space Grotesk, labels/tags JetBrains Mono.
- Giữ `Flip.getState → cập nhật filter → Flip.from`. Đo cả grid và cards để giữ chiều cao ở frame đầu; container giữ flow, cards absolute trong animation. `flushSync` commit React trước phép đo cuối. Filtered cards vẫn mounted, `inert`/`aria-hidden`; Flip trả lại layout tự nhiên.
- Bỏ pin ngang/containerAnimation/progress bar WIP vì không phù hợp bố cục dọc yêu cầu.
- Clip ảnh từ dưới + text stagger, ScrollTrigger scrub 0.35; useGSAP scope/cleanup. Reduced motion bỏ reveal/Flip; đổi preference giữa Flip hoàn tất ngay animation đang chạy.
- EDURA là link duy nhất, target `_blank`, rel `noopener noreferrer`, cursor XEM. VERIS/VIE có nút disabled CASE STUDY COMING SOON và cursor mặc định. Không card glow.
- `src/data.js`: chỉ đổi 3 đường dẫn JPG sang WebP tương ứng đã duyệt; hash ảnh giữ nguyên.
- Locales Vi/En: thêm `works.filterLabel`, `works.tagsLabel`, `works.viewCaseStudy`; dùng toàn bộ content/tag/title đã có.
- Không sửa App/Nav/Cursor, không thêm project/dependency.

## Verify
- `npm run build`: PASS, xem `build.log`. Còn cảnh báo bundle size hiện có.
- `npm run lint`: PASS (0 errors, 2 warnings cũ SplashCursor). Lỗi refs trong Work WIP đã được loại bỏ.
- `npm run dev`/Browser tại localhost:5173: render/preloader/smooth scroll hoạt động. Server có sẵn được tái sử dụng; instance kiểm tra trùng :5174 đã dừng.
- Runnable check: mở `/outputs/task-2.7/check.html`, nhấn Run check; reduced motion: thêm `?reduced=1`.
- **34/34 normal + 27/27 reduced = 61/61 PASS**: kết quả 3/1/1/1, giữ chiều cao frame đầu, layout cuối, filter nhanh, cursor thực tế theo event, Vi/En, live reduced motion, StrictMode/unmount cleanup, số ScrollTrigger ổn định. Kết quả lưu `check-normal.json`, `check-reduced.json`.
- App thật: native mouse chọn UX/UI/Graphic/All; Tab từ Graphic vào EDURA có outline 2px; Enter chọn filter. Hover EDURA cho XEM, border white alpha .35 và gradient opacity 1; VERIS/VIE cursor default, nút disabled.
- Native click EDURA mở tab mới **Edura LMS :: Behance**, URL `https://www.behance.net/gallery/241524417/Edura-LMS`. Đã đóng tab kiểm tra sau khi xác nhận.
- Cả 3 WebP load naturalWidth 1600 trên App thật; hash SHA256 không đổi.
- Responsive App: 320px không overflow (section 310/310, cards client/scroll 268/268); 768px: spans `1 / span 8`, `6 / span 7`, `1 / span 8`; desktop 1280px: cards ~774.7 / 674.8 / 774.7px, Unbounded 102.4px.
- Console phiên App mới: **0 errors**, chỉ warning THREE.Clock cũ; xem `console-final.json`. Phiên cũ từng nhận lỗi About trong lúc file được cập nhật đồng thời, không còn ở phiên xác nhận mới.
- Reduced motion là mô phỏng MediaQueryList; chưa đổi preference OS trực tiếp.

## Evidence
- `works-heading.png`: heading/filter/nền #050505 trên App.
- `works-edura.png`: card EDURA, cursor XEM, hover border/CTA mono.
- `works-vie.png`: card VIE và nút coming soon.
- `mobile-320.json`, build/lint logs, check JSON.

Flip options tham khảo [tài liệu GSAP chính thức](https://gsap.com/docs/v3/Plugins/Flip/).
