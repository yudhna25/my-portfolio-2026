# Kiểm định bộ prompt redesign R0–R8

Ngày: 07/10/2026. Phạm vi: **soạn tài liệu giao việc; chưa thực thi task triển khai**.

Đầu ra: [24 prompt R0–R8](../prompts-redesign-r0-r8.md), dựa trên [kế hoạch Q1–Q23](../../docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md) và cấu trúc của bốn file `prompts-phase-*.md` hiện có.

## Kết quả

| Kiểm tra | Kết quả |
|---|---|
| Task ID và thứ tự R0.1–R8.4 | 24 task duy nhất, đủ 9 giai đoạn |
| Khối prompt để copy | 24 khối `markdown`, 48 dòng mở/đóng fence |
| Cấu trúc theo mẫu phase | Mỗi prompt đủ 9 trường: Đọc, Skills, Plugin, Mục tiêu, Yêu cầu, Done, Verify, Xong, Cấm |
| Dependency | Mọi predecessor tồn tại và đứng trước consumer, không có vòng |
| Quy ước chung / tiến độ / báo cáo | 24/24 prompt đọc quy ước, yêu cầu AGENTS và có đường dẫn verification riêng |
| Skills được dùng | 11 ID có SKILL.md tại path đã đối chiếu local |
| Nguồn/path tham chiếu hiện hữu | 17 đường dẫn trọng yếu tồn tại; path đầu ra tương lai được ghi rõ |
| Bảo toàn nguồn | 97 file src/public/config/package/kế hoạch/prompt phase cũ giữ nguyên SHA-256 so với đầu phiên |
| AGENTS | Chỉ append một dòng tiến độ bộ prompt; kiểm tra phần nội dung cũ bằng byte/hash sau append |

Kết quả kiểm tra máy đọc được nằm ở [verification.json](verification.json). Việc kiểm định ban đầu phát hiện đường dẫn báo cáo R0.2 chưa ghi đầy đủ, đã sửa; regex của bộ kiểm tra cũng được sửa để nhận ID skill chứa chữ số. Lần kiểm tra cuối không còn lỗi.

## Review nội dung và phạm vi

- Đối chiếu đầy đủ các quyết định đã chốt: dark mono/ngoại lệ ảnh màu, Hero O cuối và glitch số 6, portal, About sạch, Skills và AI ba logo, sáu chòm sao dùng đúng nơi tại Education/Works, meteor Experience, preview/EDURA, finale và Contact.
- Kiểm tra độc lập về camera/progress và nguồn/asset/content đã bổ sung: một producer mỗi chế độ, bỏ damping camera riêng trong story, pha orbit chốt một lần, seed direct Contact, và append AGENTS tuần tự khi hai task chuẩn bị chạy song song.
- Tách prototype chuyển cảnh khỏi polish production nhưng yêu cầu dùng chung implementation; không tạo engine thứ hai. `prototype` được giới hạn vào phương pháp kiểm chứng trong lab, không kéo thêm workflow branch/commit/issue/variant. Không bắt skill `code-review` vì workflow của skill không khớp baseline audit này; `clean-code` chưa tìm thấy local và không được khai báo như đã cài.
- EDURA phân biệt tài liệu 26 file/24 nội dung với gallery đầy đủ, APMS với UI EDURA, nguồn số liệu bên ngoài với outcome dự án. CTA chưa có route được ghi dependency, không tạo link hỏng.
- R8 kiểm định responsive/a11y/motion, GPU/FPS/lifecycle, route/PWA/SEO và review độc lập; không gộp viewport giả lập thành điện thoại thật hoặc tuyên bố NASA 100%.

## Giới hạn

Không sửa ứng dụng/assets/dependency, không chạy build hoặc Browser để giả định redesign đã đạt, không deploy. Các lệnh build và Browser QA trong prompt là công việc của những phiên triển khai tiếp theo. Bộ prompt không thay thế bằng chứng chạy ứng dụng.
