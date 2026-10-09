# R1.1 — Storyboard Stellar Odyssey

08/10/2026 · **✅ Đủ bộ frame và bàn giao bố cục; chưa triển khai ứng dụng hoặc hiệu ứng.**

## Mở xem

- `storyboard.html`: viewer HTML/SVG tĩnh, chọn frame / 1440 / 390 / 320 / Vi / En. Prev/Next và checkbox Guide hoạt động; không Canvas, không React app thứ hai. Mở bằng trình duyệt, giữ nguyên cấu trúc thư mục trong repo để các asset tương đối tải được.
- `contact-sheet-1440.png`, `contact-sheet-390.png`, `contact-sheet-320.png`: tổng quan 25 trạng thái. Dùng PNG riêng trong `frames/<width>/<locale>/` để đọc ở kích thước thật; sheet thu nhỏ không thay thế kiểm tra chữ.
- `frame-manifest.json`: 150 frame, kích thước, pose đề xuất, anchor, tiến độ và đường dẫn ảnh.
- `content.json`, `handoff-notes.md`, `measured-anchors.json`: copy/source và bàn giao R2.

## Phạm vi và nguồn

Đã đọc AGENTS mới nhất, toàn bộ kế hoạch nâng cấp 07/10, Quy ước chung của prompt pack, baseline/inventory R0.1, asset R0.2 và content/asset R0.3. Không mở lại Q1–Q23. Dùng frontend-design và ui-ux-pro-max; giữ Ponytail full: SVG/HTML + stdlib, Pillow và Browser runtime có sẵn; không thêm dependency.

Font: Unbounded variable từ package hiện có (Latin/Latin-ext/Vietnamese), Space Grotesk 400/500 và JetBrains Mono 400 từ chính Google Fonts CSS đang dùng trong project. Các file font được lưu local cho artifact; nguồn/bytes/format/hash/copyright/OFL nằm trong `fonts/`. Google trả TrueType, được đặt đuôi `.ttf` đúng format.

Chân dung dùng cutout màu/alpha R0.2; chỉ crop alpha trống bằng SVG viewBox `(35,16,629,984)`, không chỉnh lại ảnh. Grey/default và màu/selected có frame riêng, không panel/halo. Logo dùng asset chính thức đã xác minh R0.2: frame Figma và AI gồm ChatGPT, Claude, Google Antigravity. Sáu hình sao dùng nguyên HIP/position/edge convention Stellarium Modern của R0.2, chiếu SVG với cùng scale trên hai trục và North lên trên. IAU không quy định một stick figure duy nhất. Telescopium có 2 sao/1 cạnh, Circinus/Pictor có 3 sao/2 cạnh; supporting stars không thêm cạnh bịa.

Hố đen là ảnh **render hiện có** `outputs/nasa-black-hole-2026-10-05/desktop-start.png` qua crop/mask mềm. Đây là texture khí procedural mono của project, không ảnh NASA gốc hoặc chứng nhận “100% NASA”. Trail, refraction và tinh vân trong frame là minh họa SVG. Ảnh dự án/reader giữ màu gốc theo kế hoạch; UI/cảnh và logo mono, không thêm cyan/amber/HUD.

## Bao phủ các trạng thái

| Nhóm | Frame |
|---|---|
| Hero | Idle; glitch riêng số cuối, semantic 2026 |
| Portal | Tiến về O / tối nối hai thang / bật ra nhìn BH |
| About | Điểm nghỉ; chân dung trả màu |
| Skills | Figma active; AI Tools active, ba hãng |
| Education | SGU/Circinus; Green/Telescopium; Arena/Pictor active riêng |
| Experience | Cuối một đường bay qua ba mốc thật |
| Works | Idle; EDURA/VERIS/VIE preview cùng vùng cố định |
| Finale | Rút nội dung / co quỹ đạo / nén-va chạm / tinh vân bung / BH |
| Contact | Email trong vùng tối; copy và gửi riêng |
| EDURA | Reader editorial: intro, Lead UI, vấn đề, ảnh A02/A07/A09 |
| Reduced-motion | Danh sách pose nghỉ; các endpoint nội dung tương ứng ở bộ frame |

25 trạng thái × 3 độ rộng × 2 locale = **150 PNG Browser**, gồm đủ 1440 và 390 yêu cầu, bổ sung reflow 320 và En. Education full section 1575px desktop = 1,75 × 900px; mobile 1477px = 1,75 × 844px. Portal chốt 1,75 viewport; finale riêng 2,25 viewport, nén `0.46–0.56` = 10%, tách khỏi thời gian xem Works. Không thêm scroll gap làm nội dung thay storyboard.

## Browser và kết quả thật

Browser connector trong phiên không khởi tạo được Chrome; dùng **Edge 154 đã cài qua Playwright bundled**, profile headless riêng. Đây là kiểm render trình duyệt thật với viewport 1440×900, 390×844, 320×844, DPR1; mobile là viewport, không điện thoại thật. Không sửa cấu hình/profile trình duyệt người dùng.

Lượt cuối `verify-storyboard.mjs` exit 0:

- **150/150** frame chụp và kiểm Vi/En. **0 console/page error**, **0 chữ nội dung tại vùng đọc hoặc foreignObject bị cắt**, **0px overflow** viewer ở ba viewport; cả ba font family tải local.
- Hero giữ đủ bốn số, glyph 6 còn trong khung; mini BH đặt ở O thứ ba/index8. Glitch minh họa bằng thay glyph cuối trong slot của 6: **ba glyph 202 có bbox giống hệt idle**, semantic vẫn 2026, không nhiễu toàn khung. Năm vẫn nguyên bốn số ở nhịp portal tiếp cận; biến mất trong pha tối theo kịch bản. Typography PORTFOLIO được zoom ra khỏi khung trong nhịp hút, nên không tính như vùng nội dung để đọc; tên/bio/indicator rút trước nhịp này.
- **162 nhóm hình sao / 1566 cạnh** được đối chiếu HIP, vị trí uniform projection và từng cặp nối với JSON R0.2. Không vẽ người-ngựa/thiên nga hoặc logo bằng dữ liệu sao giả.
- Works idle → finale0 có markup hình sao giống nhau; finale100 → Contact có silhouette/vị trí BH giống nhau, cả ba width và hai locale. Đây chứng minh endpoint của frame, chưa chứng minh nội suy chuyển cảnh.
- Mock touch targets có chiều cao tối thiểu **48px**; tool chọn riêng, preview/CTA riêng; VERIS/VIE không có CTA mở. Controls của viewer là nút thật; các đối tượng trong SVG là minh họa, không phải chức năng ứng dụng.
- Review thị giác độc lập mở PNG desktop/mobile/320: đã sửa spacing Nav, mép vùng tối, khoảng trống chân dung/reader, caption EDURA và mép khí finale. Không còn lỗi frame cần chặn bàn giao. Đã mở sheet và reader PNG thật sau export.

## Lệnh tái kiểm tra

```powershell
node outputs/redesign/r1.1/build-storyboard.mjs
node outputs/redesign/r1.1/verify-storyboard.mjs
& 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' outputs/redesign/r1.1/export-sheets.py
node outputs/redesign/r1.1/check-artifacts.mjs
```

Verifier dùng runtime/Edge đã có trên máy này, không cài package. `browser-verification.json` giữ số đo/glyph/geometry từng frame; `artifact-integrity.json` giữ hash PNG/HTML và kiểm source.

## Giữ source và giới hạn bàn giao

Baseline phiên này bảo vệ **279 file**: **92 source/public/config/package** cùng tài liệu/handoff R0.1–R0.3. `check-artifacts.mjs` đối chiếu toàn bộ hash, HEAD và tracked working tree; AGENTS giữ nguyên prefix, chỉ append một dòng R1.1. Không sửa source/public/dependency hoặc dữ liệu R0.3, không build/lint production lại vì không có sửa ứng dụng. Kết quả build/lint R0.1 là baseline cũ, không được tính như verification mới của R1.1.

Các camera/world target trong manifest là **ứng viên bố cục**, chưa ray-project trong CameraRig. Neo O đo bằng Browser và các tâm BH/collision phải được R2 khớp với DOM thực ở resize/locale. Pose static không xác nhận reduced-motion đã triển khai trong production. Chưa đo FPS, mobile GPU/nhiệt, lens/morph/orbit, portal hoặc reverse giữa các pha. R2 cần chứng minh những điều đó trước production; không tuyên bố redesign/hiệu ứng pass.

Reader dùng phần EDURA đã xác minh; ảnh baked-in không bảo đảm đọc nhỏ ở mobile, có DOM body/caption riêng. Flow/video/system sâu/outcome/lessons còn thiếu ở R0.3, không được lấp bằng claim hoặc public placeholder. Chỉ bàn giao R2 và các phase sau; chưa chạy chúng.
