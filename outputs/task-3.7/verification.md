# Task 3.7 — Typography animation

Đã nối SplitText cho 32 heading của App, gồm 31 heading trên trang và tiêu đề Menu. Hero và Footer đã có chars stagger 0.03 nên giữ nguyên timeline; các heading còn lại dùng helper `revealHeadings()` bên cạnh `splitText()` hiện có.

## Thay đổi

- `src/hooks/useGSAPSetup.js`: helper dùng `lines,chars`, `autoSplit`, chars y40/opacity → hiện với expo.out, duration 0.8 và stagger 0.03. Callback `onSplit` nằm trong contextSafe, trả tween để SplitText tự revert và đồng bộ thời gian khi font/width thay đổi. Heading phía trên viewport giữ trạng thái đã hiện; card Work đang hidden không split.
- `About.jsx`, `Education.jsx`, `sections/Skills.jsx`, `Experience.jsx`, `Playground.jsx`, `Contact.jsx`, `Work.jsx`: thêm key ngôn ngữ ở riêng heading, nhãn ARIA và các lời gọi helper. Giữ DOM card, filter Flip, DrawSVG, orbital pause và Contact/camera scrub. Bỏ parent reveal trùng trên heading; các reveal card/copy/ảnh vẫn giữ.
- `layout/MenuOverlay.jsx`: split tiêu đề sau khi dialog mở; animation không có ScrollTrigger riêng trong menu cố định. Giữ timeline mở/đóng, focus trap, Esc và khóa cuộn.
- `Preloader.jsx`: ScrambleText là writer duy nhất cho counter hiển thị khi motion bật. Số scramble rồi kết thúc ở 100%; model số vẫn tăng đơn điệu, timing 2s + curtain 0.32s/watchdog 2.4s giữ nguyên. Reduced-motion dùng số trực tiếp. Counter key theo ngôn ngữ.
- `src/index.css`: class typography ổn định kerning; bỏ will-change cố định trên mọi char. Bỏ text-wrap balance tại các heading mới split để tránh can thiệp cách đo dòng.

Mọi context phụ thuộc locale/reduced-motion và revertOnUpdate. Khi reduced-motion bật, không tạo SplitText hoặc ScrambleText. Không thêm dependency, không sửa App, camera, shader, store, token màu hoặc nội dung Vi/En.

## Kiểm chứng

339/339 kiểm tra Browser pass; `node outputs/task-3.7/check.mjs` pass. Ảnh `about-desktop.png` lấy từ trang chủ bằng click Nav thật; `playground-320.png` từ App trong harness.

- `npm run build`: pass. Cảnh báo chunk >500KB đã có.
- `npm run lint`: 0 errors; 2 warnings cũ tại SplashCursor.
- Browser chạy App thật trong StrictMode qua `qa.html`: cuộn tới từng h1/h2/h3; chars kết thúc opacity1/y0, không nested split, không tween/ScrollTrigger trỏ DOM đã tháo.
- Đổi Vi/En liên tiếp và trong lúc char reveal đang chạy: nội dung DOM/ARIA đúng locale; thay riêng heading, không thay card Flip hoặc checkbox pause quỹ đạo.
- Filter Works qua 4 mục rồi trả All: cards giữ DOM, heading hiện đúng; không console error.
- Bật/tắt reduced-motion trực tiếp trên media signal của harness và tải mới ở reduced-motion: không split DOM, không scramble counter; không tràn ngang.
- Responsive 320×740, 768×900, 1440×900, 1920×1080: heading không tràn; chiều cao dòng split/plain khớp trong sai số 2px. Footer được đo sau khi rotation của entrance cũ kết thúc.
- Menu: Tab ở trong dialog, đổi En khi đang mở re-split đúng, Esc đóng và trả focus; reduced-motion title không split.
- Counter kết thúc 100%, tổng timeline 2.32s (StrictMode tiếp tục progress có thể giảm thời gian còn lại); watchdog vẫn hoàn tất nếu tab/ticker bị throttled.

Reduced-motion là mô phỏng signal trong Browser, chưa đổi thiết lập OS trực tiếp. Không có lỗi console App trong các phiên kiểm chứng; warning THREE.Clock cũ còn từ thư viện.

## Chạy lại

Dev server `npm run dev`; mở `/outputs/task-3.7/qa.html`. Các nút Sweep, Vi/En lifecycle, Motion lifecycle và Capture layout chạy kiểm tra trên App thật. `?reduce` kiểm tra lần tải đầu ở reduced-motion.

`node outputs/task-3.7/check.mjs` kiểm tra bằng chứng đã lưu và hash source đã kiểm chứng; source thay đổi sẽ yêu cầu chạy Browser lại. Các JSON Browser và ảnh nằm cùng thư mục.

API đối chiếu từ tài liệu chính thức: [SplitText autoSplit/onSplit và wrapping](https://gsap.com/docs/v3/Plugins/SplitText/), [ScrambleText](https://gsap.com/docs/v3/Plugins/ScrambleTextPlugin/).
