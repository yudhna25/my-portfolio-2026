# R3.3 — Audit chân dung và frame About

08/10/2026. Audit read-only; không sửa `src`, `public`, dữ liệu R0.2 hoặc AGENTS. Bằng chứng này xác minh asset và bố cục storyboard, không thay thế kiểm tra ứng dụng production.

## Asset được chọn

`outputs/redesign/r0.2/portrait/avatar-cutout-color.webp`, role `web` của `avatar-cutout` trong manifest R0.2. Decode Pillow hiện tại: WEBP/RGBA, 800×1000 (4:5), 66.084 bytes. SHA256 `6b2fea6dcbd2bd204fc0aa6c545cbe7a696670fc4532c992378c3393d53b511f` khớp manifest.

541.430 pixel alpha0; 258.560 pixel alpha1–254; 10 pixel alpha255; 242.694 pixel alpha≥240. Bbox alpha `[35,16,664,1000]`. Cả 11 probe nền/ngoài người đều alpha0. Transparency thật; không dùng nền đen để giả cutout.

Đã mở ảnh WebP, proof R0.2 trên nền tối và composite decode mới `portrait-on-dark.png` trên #050505. Khuôn mặt, kính, tay giơ, tóc, tư thế ngồi/trang phục nhận diện được; không còn vòng xanh, tam giác hoặc halo ngoại cảnh. In áo, đồng hồ, giày còn màu; hỗ trợ ghế trong tư thế gốc được giữ. Tóc/kính/tay không có viền vòng sáng mới. Hidden RGB trong vùng WebP alpha0 không xuất hiện khi composite đúng alpha; không đánh giá bằng việc bỏ qua alpha.

Giới hạn kế thừa R0.2: asset đã được imagegen chỉnh, texture không pixel-identical với ảnh gốc. R3.3 chỉ dùng đúng asset đã duyệt, không tạo lại người.

Kiểm lại: chạy `C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe outputs/redesign/r3.3/check-portrait.py`. Script assert hash/dimensions/alpha, lưu `portrait-audit.json` và composite; không viết đè R0.2.

## Layout và nội dung đã chốt

Đã mở `r1.1/frames/1440/vi/about.png` và `r1.1/frames/390/vi/about.png`.

- Desktop: chân dung tự do bên trái; tên/vai trò/bio nằm bên phải trên vùng tối. Frame 1440 dùng copy x620–1170, BH nhỏ upper-right tâm (1267,246); đây là pixel storyboard, không tọa độ camera world.
- Mobile: tên/vai trò trước, chân dung lớn phía dưới, sau đó bio/quote full-width. 320px giữ gutter20px và dòng đọc; không kéo nguyên desktop grid vào màn hình hẹp.
- Crop alpha trống nếu cần bằng container/object-fit phục vụ bố cục; giữ intrinsic800×1000 và aspect ratio. Không crop tay/kính/giày chỉ để vừa một panel.
- Grayscale mặc định. Hover/focus trả màu và touch toggle, có nhãn i18n. Màu thật chỉ thuộc chân dung; không thêm glow/cyan/amber xung quanh.
- Handoff R1.1 xác định câu mở đầu là câu đầu `about.bioFirst`; scramble tên và câu đó 0,8–1s. Không tạo/lặp thêm tagline. Hai bio/quote giữ copy được xác nhận; không giải mã cả đoạn.

## Ràng buộc tích hợp từ R3.2

Giữ wrapper `[data-story-chapter="about"]` và `#about`. App sở hữu `data-story-content` gate và portal settle; About không dựng gate/scroll gap/producer riêng. `CameraRig` priority−1 là camera writer duy nhất; lấy pose từ `storyCameraPath` (About base observer `[2,3,-169]`, target/FOV bias responsive qua hàm chung), không hardcode pixel storyboard thành world pose.

Bỏ panel/captionbar/clip overscan/parallax cũ nếu không phục vụ cutout tự do. Gỡ tools/core skills khỏi About nhưng giữ dữ liệu chuyên môn cho R4. Planet/anchor thuộc set piece đã bỏ; không tạo lại tinh cầu, halo hoặc panel thay thế.
