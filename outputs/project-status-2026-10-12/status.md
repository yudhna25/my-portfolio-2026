# Tiến độ Stellar Odyssey — 12/10/2026

**Đã triển khai V0–V8 và đợt tinh chỉnh G1/G2 P1–P4; đang chờ người dùng duyệt lại G1/G2. V9, V10, V11 chưa triển khai.** Đây là tiến độ thực thi task, không phải tỷ lệ hoàn thiện thẩm mỹ hoặc công sức.

Nguồn ưu tiên: phần cập nhật 10/10 trong [prompts.md](../../prompts.md), [kế hoạch G1/G2](../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md), [handoff mới nhất](../visual-revision-2026-10-09/g1-g2-implementation/handoff.md), AGENTS và source hiện tại. Phần thân kế hoạch/báo cáo 07–09/10 mô tả lịch sử; không dùng lộ trình R7.2 cũ làm bước tiếp theo của đợt visual hiện hành.

## Đã có trong ứng dụng

| Hạng mục | Trạng thái hiện tại |
|---|---|
| Baseline, ownership, contract — V0 | Đã bàn giao; dùng kiến trúc và state hiện có. |
| Hero, hố đen O, portal — V1–V3 | Đã tích hợp: năm và PORTFOLIO theo bố cục đã chốt, glitch 6↔7, hố đen HDR thay O, hút từng lớp Hero/control/nền/camera và đẩy ra About thật. Portal 400vh, cuộn ngược phục hồi, static/fallback rút ngắn. G1 đang chờ duyệt lại. |
| Artwork — V4 | Sáu hình vector với catalog sao, calibration, provenance/license; đã được consumers tích hợp. |
| Education — V5/V8 | Orion, Scorpius, Leo với hình nền đã căn theo sao, glow và tương tác hover/focus/touch; giữ một pool dùng chung Skills/Education. G2 chờ duyệt. |
| Experience — V6/V8 | Story meteor, ribbon/gas/cyan và light wake đã có. Ngoại lệ đuôi ngắn lúc entry của V6/V8 đã được thay bằng phương án P4. G2 chờ duyệt bản mới. |
| Works — V7/V8 | Chòm sao lớn, artwork cùng basis/quỹ đạo, vùng tương tác theo figure, preview cạnh; keyboard/touch và CTA EDURA được nối. G2 chờ duyệt. |
| Tinh chỉnh P1–P4 | Opening vòng sáng từ tâm → O; năm khoảng 1,30× PORTFOLIO, bỏ viền cố định, contour 10–14s/đuôi 35%; intake chuỗi ảnh + dải phễu khoảng 1,25 vòng; comet lớn và đường S liên tục, đuôi đã dài khi vào khung. Code đã có, kỹ thuật/local đã được worker kiểm 10/10. |
| Finale Works → Contact | Còn bản R7.1 225vh đang hoạt động. **V9 mới chưa làm:** chưa có chuỗi nổ quy mô lớn và hố đen/Contact cuối theo yêu cầu visual mới, chưa đổi thành 400vh. |
| Skills / About / EDURA / audio / i18n | Đang nằm trong luồng production; phần được bảo vệ giữ nguyên phạm vi. EDURA reader nội bộ và Back/Return restore đã được tích hợp. VERIS/VIE vẫn là case study sắp ra mắt. |
| V10/V11 | Chưa kiểm tổng hợp cuối và chưa có nghiệm thu độc lập sau V9/G3. |

Luồng đang chạy: Hero → portal → About → Skills → Education → Experience → departure → Works → finale hiện có → Contact → Footer. EDURA mở từ Works và quay về trạng thái đã lưu.

## Git và kiểm tra mới ngày 12/10

- HEAD `3dc0b91179397f9b62d584cc66ba949d7fdc5e9a`, commit ngày 10/10: `feat: integrate visual revision V5-V8 and apply G1/G2 opening & meteor refinements`.
- Đã đọc trực tiếp `origin/main` trên GitHub: hash trùng HEAD. Source working tree sạch trước phiên báo cáo.
- Máy ban đầu chưa có Vite/ESLint; hai lệnh đầu thất bại vì thiếu dependency. Đã chạy `npm ci` đúng lockfile (750 packages), không sửa package/lockfile/source. Các log trước cài được giữ riêng.

| Kiểm tra mới | Kết quả |
|---|---|
| `npm run build` | **PASS**, Vite 7.3.6, 6,38s. PWA 40 entries / 3228,48 KiB. Đây là build App chuẩn, không phải Browser QA hoặc build Lab riêng. |
| `npm run lint` | **PASS về exit code**, 0 errors / 2 warnings `react-hooks/unsupported-syntax` trong SplashCursor cũ. |
| Vi/En parity | **PASS**, 254 keys chính + 93 Lab + 2 scene = 349/ngôn ngữ. Parity không chứng minh mọi chuỗi hiển thị đã được dịch. |
| `git diff --check` trước tạo báo cáo | PASS, source không có diff. |
| Browser / GPU / phone / HTTPS | **Không chạy mới trong phiên này.** |

Build còn warning chunk >500 kB: main khoảng 669,79 kB và Fiber events khoảng 920,25 kB trước gzip. Cần đo tải/frame time trước khi chọn tối ưu; không hạ độ nét hố đen để đạt số FPS cũ.

Log cục bộ: [build](build.log), [lint](lint.log), [install](install.log), [checks](checks.json), [locale](locale-check.json), [fingerprint](source-check.json). Các file `.log` bị gitignore theo quy tắc repo.

## Bằng chứng trước đó và giới hạn

[QA P1–P4 ngày 10/10](../visual-revision-2026-10-09/g1-g2-implementation/verification.md) ghi 402 main checks, 49 extras, 7 fallback cases, 6 EDURA Back/disposal cycles và 3 motion cycles; 132 PNG, 2 capture WebM cùng 2 MP4 tương thích gallery. Các sample Edge/RTX 4060/DPR1 đạt khoảng 132–165 FPS. **Đó là số đo ngày 10/10, không phải FPS hiện tại hoặc hiệu năng điện thoại.**

Đối chiếu snapshot source 118 file: 92 raw hash trùng, 26 khác; 6 khác biệt được giải thích hoàn toàn bằng CRLF/LF, còn 20 chưa truy nguyên trong phiên báo cáo. Checkout bật `core.autocrlf=true`; chưa kết luận 20 file đó thay đổi hành vi từ khác biệt byte. Do vậy không gọi hồ sơ QA cũ là bằng chứng exact-source của build hôm nay. Script Browser QA hiện còn import runtime theo đường dẫn máy `PC`; cần chuyển sang đường dẫn/runtime cấu hình được khi tái lập QA trên máy này, không sửa trong phiên báo cáo.

Chưa đo mới điện thoại thật/nhiệt, OS reduced-motion thật, Safari/Firefox, screen reader, PWA offline/deep-link server hoặc HTTPS. Git push không chứng minh deployment đang phục vụ đúng build.

## Bước tiếp theo theo thứ tự

1. **Duyệt lại G1/G2 trên bản tinh chỉnh P1–P4.** Xem [gallery mới nhất](../visual-revision-2026-10-09/g1-g2-implementation/review.html) và bản chạy: opening, hierarchy năm/glitch/O, intake/ejection tới-lùi, comet/độ rõ chữ, Education và Works preview. Nếu cần sửa, giới hạn đúng nhóm đó rồi kiểm lại phần liên quan. Chốt phương án, commit/push và build pass không thay visual approval.
2. **Sau G1/G2: thực hiện V9**, task khó thứ hai. Nối va chạm ba chòm sao → shockwave/khí → đĩa bồi tụ → hố đen lớn liên tục; đoạn finale 400vh, cùng progress tới/lùi, giữ snapshot Works, HDR sắc nét và một camera writer. Contact chỉ đổi độ trong của nền panel theo phạm vi đã chốt, giữ copy/actions/bố cục. Recheck portal khi đụng shader/camera chung. Bàn giao và xin duyệt G3.
3. **Sau G3: V10** kiểm toàn hành trình của đợt visual: responsive 320–1920, Vi/En, keyboard/touch/reduced/fallback, reverse/jump/hash/Back, cleanup/resources, frame time/GPU/tải trang. Chuẩn hóa đường dẫn QA và tạo fingerprint/evidence mới của bản cuối; ghi riêng vấn đề nền.
4. **V11** review độc lập cả bảy yêu cầu trên bản tích hợp cuối. Sửa Blocker/Major theo owner và kiểm lại trước nghiệm thu.
5. **Sau V11: lập checklist phát hành riêng.** Kiểm máy thật/HTTPS/deploy/PWA/SEO; điền link công khai còn thiếu, cân nhắc bổ sung case content, xử lý lỗi nền cần thiết. Không tự triển khai các việc release trong bộ visual V0–V11.

## Việc tồn đọng ngoài đợt visual

- Contact vẫn báo thành công khi clipboard không có hoặc bị từ chối: `setTransmitted(true)` nằm sau nhánh/catch. Cần sửa phản hồi theo kết quả thực trước phát hành; đây là vấn đề nền, không phải nhiệm vụ redesign Footer hiện tại.
- LinkedIn, Behance profile và website URL trong locale còn trống; link Behance EDURA đã có. VERIS/VIE chưa có reader hoàn chỉnh; EDURA còn có thể bổ sung flow/process/outcome bằng tư liệu thật.
- README còn template Vite. Một số asset production được import từ `outputs/redesign/`; không xóa toàn bộ outputs như log rác.

Phiên này chỉ tạo báo cáo/check cục bộ và append tiến độ AGENTS; không sửa ứng dụng, không chạy V9, không duyệt thay người dùng, không commit/push/deploy mới.
