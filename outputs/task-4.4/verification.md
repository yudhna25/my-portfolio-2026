# Task 4.4 — Keyboard navigation & focus management

**Kết quả: ✅ Xong trong phạm vi kiểm toán bàn phím.** 06/10/2026, Windows 11 / Edge 154.0.4258.53. Build pass; lint 0 errors / 2 warnings cũ ở SplashCursor. Không thêm dependency.

## Các lỗi đã sửa

| Vị trí | Lỗi / hành vi đã hoàn thiện |
| --- | --- |
| `src/index.css:86` | Focus ring dùng chung: trắng, solid 2px, offset 4px; nền đen 6px giúp ring đọc được trên theme sáng. Ring xuất hiện tức thì, không bị `transition-all` tween từ offset 0. Forced-colors dùng CanvasText. |
| `src/index.css:93` | Controls trong entrance của Works, Playground, Contact và Footer hiện opacity 1 ngay khi chứa focus, không phải đợi fade. |
| `src/components/Footer.jsx:46` | `autoAlpha:0` đã làm email biến khỏi thứ tự Tab. Đổi riêng nhóm links sang opacity, giữ animation và nội dung. |
| `src/components/effects/LiveDemo.jsx:18` | Demo lazy trước đây bị bỏ qua khi Tab đi nhanh. Thêm điểm vào `tabIndex=0` có tên, mount khi vào viewport **hoặc chứa focus**, giữ controls khi người dùng còn ở trong demo. Cleanup listener/observer đầy đủ. |
| `src/components/layout/Nav.jsx:71` | Skip/link section kích hoạt bằng bàn phím chuyển scroll và focus đến đích tức thì; Tab tiếp theo vào control của section. Skip đứng trên preloader (z=10000), target `#smooth-content`. Giữ handler focus auto-reveal của Nav. |
| `src/components/layout/MenuOverlay.jsx:39` | Native dialog giữ Tab trong menu; mở/đóng bằng bàn phím hiện ngay để focus không nằm sau clip. Escape đóng tức thì, trả đúng opener; link section đưa focus đến đích. Phiên mở bằng chuột chuyển sang chế độ bàn phím khi nhận keydown. |

Work filter buttons, checkbox Pause, Theme Toggle, Contact anchors đã có native semantics; tái dùng, không viết control thay thế. Không đặt tabIndex dương, không bỏ outline, không thay layout/store/3D. Các cập nhật ARIA/copy/SEO/assets/reduced-motion từ công việc song song được giữ lại.

## Kiểm chứng tự động

Một check chạy được: [check.mjs](./check.mjs). Dùng Playwright đã có trong runtime, nhấn phím thật; không `.focus()` control để bỏ qua thứ tự Tab. Lưu `document.activeElement`, label/section/type, vị trí, opacity của cả chuỗi cha, focus-visible, outline, disabled/inert tại từng bước duyệt toàn trang trong [browser-results.json](./browser-results.json).

Lượt cuối chạy trên bản production snapshot tại `127.0.0.1:4174`; snapshot `site/` tránh HMR và build đồng thời làm mất focus/thay chunk giữa phép đo. Vi/En và theme được chọn qua control thật.

| Viewport | Ngôn ngữ | Motion | Theme | Tab toàn trang | Shift+Tab | Menu focus records | PageDown samples | Kiểm tra tương tác |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1440×900 | Vi | Bình thường | Dark | 36 | 34 | 25 | 14 | 11 |
| 390×900 | Vi | Bình thường | Light | 29 | 27 | 25 | 18 | 10 |
| 1440×900 | En | Reduced | Light | 32 | 32 | 25 | 15 | 9 |
| 320×900 | En | Reduced | Dark | 25 | 25 | 25 | 19 | 8 |

Tổng 340 focus records được lưu; thêm 96 bước Shift+Tab trong dialog được assert. Tab giảm trên mobile vì 7 link Nav nằm trong menu; reduced-motion bỏ 4 controls demo vốn disabled. Demo lazy có điểm vào trước controls; khi đi ngược, một số controls chưa mount, vẫn vào được bằng Tab từ điểm vào. Không có trap ngoài dialog.

- Tab đầu tiên thấy skip link cả khi preloader đang chạy; Enter focus main.
- Nav ẩn sau scroll xuống 3000px; Shift+Tab từ Theme về Menu cho thấy Nav ngay.
- Menu: focus ngay bên trong, 2 vòng Tab và 2 vòng Shift+Tab không thoát nền, Escape đóng ngay và restore đúng opener. Space mở menu; Enter link Skills chuyển focus section, Tab tiếp theo tới Pause.
- Works: Enter/Space đổi filter + aria-pressed; card đang inert không vào Tab. Pause checkbox Space đổi 2 lần. Theme Enter/Space đổi theme và accessible label. Slider shader dùng ArrowRight/ArrowLeft đúng bước 0.1.
- Email CTA nhận focus, Enter phát trusted click với chính xác `mailto:anhduy25work@gmail.com`; test chặn default để không mở ứng dụng bên ngoài.
- Mọi focus record có opacity 1, nằm trong viewport, ring trắng 2px / offset 4px, không disabled/inert. Forced-colors giữ solid 2px với màu hệ thống.
- Control+Home/PageDown đọc đủ Hero, About, Skills, Education, Experience, Works, Playground, Contact đến cuối trang ở cả 4 cấu hình. Static text không bị thêm Tab stop.
- Source AST và DOM không có tabIndex >0; tìm toàn src không có outline:none / outline-none. Quality, shader hố đen và scroll store giữ nguyên theo baseline (chuẩn hóa line endings).

**Console lượt cuối: 0 page/console errors.** Warning cũ THREE.Clock vẫn còn; chunk-size warning khi build và 2 warnings SplashCursor thuộc phạm vi khác. Hai log HMR lỗi trong tab dev cũ khi đang sửa đã được phân biệt với runtime: tab dev mới sạch lỗi, xem [native-browser-logs.json](./native-browser-logs.json).

## Browser trực tiếp và bằng chứng

Browser plugin kiểm tra thêm trên dev `:5173` và production `:4174`: Tab đầu/Enter main; Enter mở menu, 12 Tab trở về Close, Shift+Tab về En, Escape về đúng Menu; quan sát ring rõ nét.

![Focus ở Close trong menu production](./browser-menu-production.png)

Ảnh tự động: `menu-{width}-{language}.png`, `email-{width}-{language}.png`. Source trước sửa nằm trong `source-baseline.json`; không dùng snapshot này để hoàn tác thay đổi đồng thời.

Chạy lại từ project root (mặc định dev :5173):

```powershell
node outputs/task-4.4/check.mjs
# Hoặc production snapshot:
npm run preview -- --host 127.0.0.1 --port 4174 --strictPort --outDir outputs/task-4.4/site
$env:STELLAR_QA_URL='http://127.0.0.1:4174/'
node outputs/task-4.4/check.mjs
```

## Phạm vi và tiêu chí

Đối chiếu WCAG 2.1 2.1.1 / 2.1.2 / 2.4.3 / 2.4.7: native keyboard controls, thứ tự DOM, trap chỉ trong dialog, focus ring nhìn thấy. Hành vi dialog tham khảo [WAI-ARIA APG Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/); focus indicator theo [W3C Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html). Áp dụng [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) và skill accessibility. Skill `a11y-debugging` không có trong các thư mục skills local đã tìm; dùng tài liệu chính thức cho phần đó.

Viewport mobile và reduced-motion được mô phỏng bằng browser. Chưa xác nhận mail client OS, bàn phím trên điện thoại thật hoặc NVDA; kiểm toán screen reader thuộc task 4.5, kết quả này không phải chứng nhận toàn bộ WCAG AA.
