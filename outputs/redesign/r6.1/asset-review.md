# R6.1 — Kiểm tra ba figure EDURA

**08/10/2026.** Phạm vi đọc asset gốc/pack R0.3 và storyboard R1.1; chỉ ghi artifact trong `outputs/redesign/r6.1/`. Không sửa/copy `src`, `public`, AGENTS hoặc ảnh gốc. Áp dụng skill accessibility cho alt/caption và mô tả DOM của hình chứa nhiều chữ.

## Lựa chọn bàn giao

| ID | Loại bằng chứng | File gốc | Bytes | Kích thước / decode |
|---|---|---|---:|---|
| A02 | UI overview của EDURA | `b6e8ee241524417.695a8ca904163.webp` | 92.204 | WebP RGB 1400×989 / pass |
| A07 | Đặt vấn đề trong tài liệu concept | `1457a2241524417.695a8ca903243.webp` | 135.960 | WebP RGB 1400×989 / pass |
| A09 | Hướng giải pháp concept | `1463c6241524417.695a8ca906149.webp` | 96.112 | WebP RGB 1400×989 / pass |

Ba file tổng **324.276 byte**, ba SHA-256 khác nhau, khớp hoàn toàn asset-index R0.3. Không có alpha: slide hoàn chỉnh RGB có nền kín là phù hợp, không cần cutout. [selected-assets.json](selected-assets.json) chứa path tuyệt đối/tương đối, URL CDN/Behance, hash, kích thước, bytes, alt/caption/attribution Vi/En nguyên từ pack, classification và giới hạn sử dụng. Đường `public/projects/edura/{overview,problem,solution}.webp` chỉ là đề xuất để Agent tích hợp copy ba ảnh thực sự dùng; audit này không tạo file public.

**Tái dùng nguyên WebP**, không tạo derivative bổ sung: mỗi ảnh 92–136KB đã hợp lý cho ảnh rộng. Giữ contain, không crop/grayscale/blur/filter màu, không nội suy để giả độ nét. Width/height HTML phải là 1400/989; max CSS 1280px như storyboard, mobile trừ padding32px. Tại DPR1 ảnh đủ native cho 1280px. Nguồn chỉ có 1400px, không tuyên bố native 2× ở 1280px CSS/DPR2 hoặc 3; dựng bản phóng từ cùng ảnh không tạo thêm chi tiết.

## Quan sát ảnh thật

Đã mở qua `view_image` cả A02/A07/A09 gốc và frame `r1.1/frames/{1440,390}/vi/edura.png`.

- **A02:** mockup điện thoại và nhận diện EDURA màu xanh lam. Nhìn thấy bảng điểm/lịch học/học phí/khóa học; điểm danh và tiến độ bên dưới. Các con số và tên trong UI là dữ liệu mockup, không metric, không flow. Dùng một lần làm figure mở đầu; phần quyết định bố cục/màu liên hệ lại figure này.
- **A07:** slide Current Situation về thông tin học tập phân tán, nhóm chat, quản lý nền tảng/hỗ trợ ngoài giờ. Đây là framing được tài liệu đặt ra; ảnh không chứng minh một mẫu nghiên cứu hoặc kết quả test. Caption/DOM summary giữ attribution theo tài liệu.
- **A09:** slide Solution với bốn hướng tập trung thông tin, hỗ trợ tự động, dashboard, tùy biến. Chatbot và lời hứa 24/7 nằm trong slide concept, không được diễn giải là hệ thống đã triển khai. Câu ngoặc kép cuối ảnh là thông điệp concept; không gắn nhãn testimonial/phỏng vấn.

Pillow12.3.0 load ảnh hoàn chỉnh. Pixel có `max(R,G,B)-min(R,G,B)>8`: A02 **1.246.694**, A07 **1.266.406**, A09 **1.226.255** trên **1.384.600 pixel** mỗi ảnh. Đây là kiểm tra ảnh có màu và không bị grayscale trong asset; CSS runtime cần Browser của Agent tích hợp kiểm riêng. Hash khớp pack là bằng chứng không chỉnh semantic nội dung hoặc tái encode ảnh gốc.

## Storyboard và khả năng đọc

Storyboard đã dùng đúng ba ảnh theo thứ tự A02→A07→A09 với khung mono, full-frame, chiều rộng ảnh1280px desktop và body820px. Reader thực tế cần bổ sung các đoạn quyết định UI/artifact/kết quả có nguồn theo R0.3, giữ khoảng thở quanh figure thay vì tạo gallery26ảnh.

Ở 320/390px, chữ đã đốt trong slide nhỏ đến không đọc toàn bộ được: đây là giới hạn của nguồn, không phải lý do thay font hoặc dựng lại slide. Copy/caption DOM Vi/En là phần đọc chính, không dùng alt làm bản chép toàn bộ chữ. Có thể thêm liên kết ảnh gốc1400px có label thật để xem chi tiết bằng bàn phím/native browser; không cần một thư viện viewer/zoom. Storyboard R1.1 chỉ minh họa bố cục, chưa chứng minh lazy/CLS/keyboard của page JSX.

## Giới hạn nội dung và nguồn

APMS **A15–A17 bị loại**: là phân tích đối thủ, không màn EDURA. Không lấy gallery khác cùng tên, không tự tạo flow bằng ảnh APMS, không thêm ảnh trang trí/persona/quote chưa xác minh để lấp thiếu. Ba figure đủ cho reader **giới hạn** đang được phép; chúng không gỡ G01(video), G02(rationale/system), G04(outcome), G05(lessons) hoặc gallery chưa đầy đủ.

URL/sourcePage lấy từ pack provenance đã xác minh; audit này không GET lại CDN hoặc gallery Behance và không claim liveHTTP200/gallery đầy đủ. Đánh giá Excellent không nằm trong các ảnh và không được suy ra từ asset. Không dùng số liệu OnCourse hoặc mockup như metric EDURA.

## Chạy lại

```powershell
& 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' outputs/redesign/r6.1/check-selected-assets.py
```

Checker stdlib+Pillow có sẵn: assert source hash/bytes, classification/selection, WebP RGB/1400×989/decode, màu, uniqueness; ghi lại selected-assets.json. Exit0, 3/3 pass, không cài package. Cần Agent tích hợp kiểm dimensions/filter/màu/lazy/CLS/alt thật trong Browser sau khi tạo page. Route/history/Back restore và nghỉ scene vẫn là R6.2.
