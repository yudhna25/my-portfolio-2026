# Task 3.9 — Hover interactions

Hoàn thành 06/10/2026. 17 card của Works/Skills/Experience/Playground dùng cùng hover: scale 1.05, translateY −4px, border rgba(250,250,250,0.35), không shadow. CTA chính Contact chuyển sang `--glow-button-strong`; không animate box-shadow.

## Source

- `src/index.css`: hover-card/cta-hover; border transition 120ms, transform 140ms. Motion chỉ bật với hover/fine pointer và no-preference. Focus giữ border và outline truy cập.
- `Work.jsx`: surface a/div ở bên trong article được hover; grid/Flip tiếp tục sở hữu article bên ngoài. Bỏ scale ảnh riêng để không nhân đôi scale. Overlay ảnh chỉ bật khi motion cho phép. 4 nút filter dùng marker data-magnetic.
- `sections/Skills.jsx`: wrapper sở hữu entrance, article bên trong sở hữu hover. Experience/Playground đã có wrapper nên chỉ thêm class/marker vào article.
- `sections/Contact.jsx`: CTA thêm border trong suốt và class hover; token glow và pulse hiện có được giữ.
- `Cursor.jsx`: giữ quickTo, clamp/radial 8px, cleanup và translate độc lập. Guard reducedMotion loại magnetic target hoàn toàn, thay cho kiểu dịch tức thời cũ.

Không thêm dependency, màu hoặc glow card. Không sửa các timeline SplitText, image reveal, camera hoặc GLSL. About được phiên khác chỉnh parallax trong lúc QA; giữ bản mới, ghi hash trước/sau ở concurrent-changes.json. Các chỉnh sửa ngoài phạm vi khác vẫn giữ nguyên.

## Verify

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS; cảnh báo chunk >500KB cũ |
| npm run lint | 0 errors / 2 warnings SplashCursor cũ |
| node outputs/task-3.9/check.mjs | PASS; 111 assertions đã lưu qua các snapshot, một số snapshot có chung lịch sử |
| Native pointer trên 4 loại card | Scale1.05/y−4/border250 alpha.35/shadow none |
| Phản hồi hover | Khoảng12–13ms trên card; CTA shadow đổi ngay |
| CTA native pointer | Shadow rgba255 alpha.55 blur50px; không kích hoạt mailto |
| Reduced-motion | Card scale1/y0, chỉ đổi border; CTA giữ glow nền30px; magnetic reset none/0px |
| FPS magnetic liên tục4s | 165.01fps, 661 frames, tab visible, DPR1; độ lệch lớn nhất5.00px, dưới giới hạn8px |
| Locale/Flip | Vi/En, 4 filter và trả All pass; không detached trigger |
| Responsive | 390×844, 768×1024: không tràn, 0 DOM custom cursor |
| Console | 0 errors; warning Clock cũ từ Fiber |

FPS dùng callback frame của Canvas thật, với PointerEvent kiểm thử liên tục để kiểm tra magnetic; hover/border/glow được kiểm riêng bằng pointer native của Browser. Kết quả thuộc máy dev này, không phải benchmark điện thoại.

Reduced-motion được mô phỏng ở hook matchMedia và điều kiện CSSMediaRule của stylesheet thật, giữ nguyên declarations; chưa toggle OS trực tiếp. Harness ban đầu chỉ đổi hook nên CSS vẫn dùng OS preference; đã sửa emulation, kiểm lại cả card và CTA pass. Các JSON reduced cuối cùng là phiên đã sửa.

## Chạy lại

Dev server: npm run dev. Mở `/outputs/task-3.9/qa.html`: chọn card/CTA, hover bằng pointer, dùng Reduced toggle, Measure FPS, Language/Flip và Capture. `check.mjs` đối chiếu bằng chứng và hash source; source thay đổi cần Browser verify lại.

Đối chiếu API: [GSAP quickTo](https://gsap.com/docs/v3/GSAP/gsap.quickTo()/), [CSS translate](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/translate). CSS hover ở inner surface bảo toàn transform của entrance/Flip ở wrapper.
