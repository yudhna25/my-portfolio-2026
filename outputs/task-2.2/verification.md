# Task 2.2 — MenuOverlay

Ngày: 05/10/2026. Workspace: D:/Projects/my-portfolio-2026.

## Phạm vi triển khai

- Tạo src/components/layout/MenuOverlay.jsx, src/styles/menu.css và danh sách chung src/data/navigation.js.
- Nối App với Nav bằng trạng thái mở/đóng cục bộ; MenuOverlay nằm ngoài smooth-wrapper.
- Giữ nguyên từng dòng block useGSAP auto-hide của Nav task 2.3. Chỉ nối trigger aria-expanded/controls/haspopup và hiện chữ MENU trên desktop.
- Native dialog modal ở top layer, fixed/inset-0/z-40: nền #050505, 24 cột, không màu accent/glow. Top layer bảo đảm menu phủ Nav z-70 mà không đổi auto-hide hoặc z-index Nav.
- Timeline duy nhất trong useGSAP: clip-path inset từ góc phải trên, z -60 → 0, opacity 0 → 1, 0.7s expo.inOut; đóng đảo timeline. Reduced-motion đưa ngay tới endpoint.
- Nội dung Unbounded 8vw, 2 lớp text chung một ô grid: lớp trên trượt -100%, lớp dưới từ +100% về 0 khi hover/focus; lớp lặp aria-hidden. Padding chữ đủ cho dấu tiếng Việt. Danh sách cuộn bên trong khi chiều cao không đủ, footer luôn truy cập được. Panel di chuyển trong perspective, nội dung giữ mặt phẳng flat để overflow cắt sạch hai lớp chữ.
- Dialog/label dùng overflow: clip để không tạo scroll container tự cuộn khi focus; chỉ danh sách link dùng overflow-y: auto. Focus vào nút đóng; vòng Tab/Shift+Tab rõ ràng, nền inert nhờ showModal; Esc/click vùng trống/link đóng. Trả focus về trigger.
- Pause ScrollSmoother và khóa overflow khi mở; trả đúng paused trước đó khi đóng/unmount; chỉ scrollTo section sau khi đóng xong, offset Nav + 8px.
- Chặn focusin của menu truyền tới focus handler toàn cục của ScrollSmoother: focus link ngoài vùng nhìn cuộn danh sách menu, không cuộn nền.
- GSAP timeline chỉ có một context sở hữu; useLayoutEffect điều khiển play/reverse và cancel RAF. Tránh context lồng nhau tự revert timeline khi reduced-motion đóng tức thì.
- Vi/En dùng useLangStore trực tiếp trong footer. Không thêm store, Context, thư viện hay component LanguageSwitch.
- Theo lựa chọn người dùng: hiển thị đủ 7 mục; skills/experience/playground có aria-disabled/tabIndex -1 đến khi có section. Không thay thứ tự.
- Footer dùng email/Facebook đã có trong contact locale. LinkedIn/Behance chưa có URL nên chỉ hiển thị nhãn pending, không tạo URL giả.

## Build và lint

- npm run build: PASS, xem build.log. Cảnh báo chunk 3D lớn có sẵn.
- ESLint riêng App/MenuOverlay/Nav/navigation: PASS.
- npm run lint: giữ nguyên 1 error Work.jsx (react-hooks/refs), 2 warnings SplashCursor.jsx (unsupported-syntax); không thêm issue. Xem lint-before.log/lint-after.log.
- Nav auto-hide block so với Nav.before.jsx: giống nguyên văn.
- Nav locale key parity Vi/En: PASS; không JSX inline style; không sửa vite.config hay component section/3D.
- static-checks.json lưu kết quả đối chiếu.

## Kiểm chứng Browser

- 36/36 checks bình thường: qa-normal.json.
- 35/35 checks reduced-motion mô phỏng: qa-reduced.json.
- Kiểm tra modal/aria/focus, 24 cột/thứ tự/2 span, disabled links, Vi/En, Esc/cancel, click nền, 4 link với offset 80px, Nav hide/reveal, thay preference khi đang mở, restore smoother thay thế, restore paused=true, 3 unmount/remount, mở/đóng nhanh và reopen giữa reverse.
- Console hai lượt QA cuối: 0 error, 0 warning.
- Trang App thật: 9 bước Tab native luôn nằm trong dialog; bỏ qua 3 mục pending; smooth-content giữ y=0. Shift+Tab đầu → cuối và Tab cuối → đầu đã xác nhận native.
- Focus footer native: dialog.scrollTop=0, header top=0, footer bottom=720 (desktop 1280×720).
- Esc native đóng xong, aria-expanded=false, trả focus trigger, bỏ khóa cuộn.
- Mobile App thật: Vi/En đổi nhãn ngay; wheel trên overlay giữ scroll nền y=0. Click Về tôi → menu đóng, unlock, focus về trigger, section top 79.59px.
- Responsive App 320/390/768/1024: không tràn ngang menu/Nav, đúng font Unbounded Variable và 8vw, footer trong viewport; desktop hiện MENU, mobile ẩn các link Nav.
- Ảnh App thật: menu-mobile.png và menu-desktop.png. Chi tiết thao tác native/responsive lưu native-checks.json.

Chạy lại một check: npm run dev, mở /outputs/task-2.2/menu-qa.html rồi bấm Run checks. Mở thêm ?motion=reduce để chạy nhánh reduced-motion.

Fixture chỉ giả lập matchMedia và tắt GSAP lagSmoothing để giữ elapsed time khi Browser nằm nền. Các cấu hình production giữ nguyên. Browser nền có thể làm tween theo RAF chạy lâu hơn thời lượng khai báo; không dùng kết quả này để suy ra FPS khi foreground. OS reduced-motion chưa toggle trực tiếp; đã verify hook bằng giả lập trước import và thay đổi live.

Trang thật không có console error do menu; warning THREE.Clock cũ từ Fiber vẫn còn. Không mở email hoặc gửi thông tin ra mạng xã hội khi kiểm chứng.

## Tham chiếu đã đọc

- [Mont-fort](https://mont-fort.com/): tham khảo nhịp chữ lớn, link lặp và bố cục menu, triển khai lại theo mono/spec Stellar.
- [MDN overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow): hidden vẫn cho cuộn programmatic/focus; clip không tạo scroll container.
- [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog): modal top layer, inert, focus và cancel.
- [GSAP ScrollSmoother paused](https://gsap.com/docs/v3/Plugins/ScrollSmoother/paused()/): pause/resume. Đối chiếu source GSAP 3.15 đã cài để giữ nested scrolling trong modal.
