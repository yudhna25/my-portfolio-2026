# G1/G2 refinement — kiểm chứng phiên lập phương án

Ngày: **10/10/2026**. Phạm vi: **tài liệu + trạng thái review, không sửa ứng dụng**.

## Quyết định và nguồn

- Đọc source opening/Hero/portal/Nav/cursor/meteor/Experience và quy ước `prompts.md`, V8 verification/handoff, kế hoạch 07/10 và báo cáo hiện trạng 09/10.
- Áp dụng `grill-me` → `grilling`: phỏng vấn theo design tree, các câu phụ thuộc chỉ hỏi ở vòng tiếp theo. Một Agent chỉ đọc source để đối chiếu cơ chế; không ghi file/code hoặc tự chạy task khác.
- Người dùng đã chọn Q1 A, Q2 A, Q3 A, Q4 C; Q5 A, Q6 B, Q7 A, Q8 A, Q9 A; Q10 A, Q11 A. Cụ thể trong [kế hoạch](../../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md). Q12 đã xác nhận **“Chốt phương án, chưa sửa code”**.
- G1 mở lại; G2 yêu cầu cải thiện, chưa duyệt. V9/G3 chưa bắt đầu. Chốt phương án không thay duyệt thẩm mỹ bản chạy mới hoặc tự cấp phép sửa code ở phiên chỉ lập phương án này.

## File tài liệu cập nhật

| File | Thay đổi |
|---|---|
| `docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md` | Quyết định, nguyên nhân từ source, storyboard, phạm vi/file dự kiến, acceptance, design tree. |
| `prompts.md` | Banner ưu tiên yêu cầu mới; không chạy V9 hay khôi phục border/curve cũ. |
| `docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md` | Banner lịch sử/ưu tiên tài liệu mới; giữ nội dung gốc. |
| `outputs/project-status-2026-10-09/status.md` | Tình trạng mới và đính chính R7.2 không phải task kế tiếp. |
| `outputs/visual-revision-2026-10-09/v3/verification.md`, `handoff.md`, `review.html` | G1 mở lại, ảnh/bằng chứng V3 là lịch sử, ưu tiên phương án đã chốt và baseline V8. |
| `outputs/visual-revision-2026-10-09/v8/verification.md` | Ghi phản hồi người dùng, giữ kết quả kỹ thuật/build cũ. |
| `outputs/visual-revision-2026-10-09/v8/handoff.md` | Ghi G1/G2 cần tinh chỉnh, giữ interface/route/orbit baseline. |
| `outputs/visual-revision-2026-10-09/v8/review.html` | Banner chỉ rõ ảnh/clip baseline; không thay media. |
| `AGENTS.md` | Append dòng phiên lập phương án, không sửa dòng lịch sử. |

## Kiểm tra bảo toàn

[baseline.json](baseline.json) ghi SHA-256/bytes trước khi sửa tài liệu: **120 source/public/config files**, **76 ảnh/clip V8**, prefix `AGENTS.md` **61.288 bytes**. Kết quả đối chiếu cuối phiên trong `check-results.json`:

| Kiểm tra đã chạy | Kết quả |
|---|---|
| 120 source/public/config | SHA-256 khớp toàn bộ; không thêm/xóa file trong tập bảo vệ. |
| 76 ảnh/clip V8 | SHA-256 khớp toàn bộ; gallery vẫn dùng bằng chứng baseline. |
| AGENTS | Prefix 61.288 bytes khớp hash; append đúng một dòng mới. |
| Link mới | 17 link tương đối trong kế hoạch/báo cáo/banner cập nhật đều tồn tại. |
| Lựa chọn người dùng | Q4 C (comet rất lớn), Q6 B (rất chậm/đuôi dài), Q12 đã chốt nhất quán trong các tài liệu cập nhật. |
| Whitespace | `git diff --check`: exit 0. |

Các file code đang modified từ V5–V8 được giữ, không reset. Báo cáo lịch sử 09/10 còn tham chiếu `build.log` và `lint.log` hiện không có trong thư mục của nó; giữ nguyên phần lịch sử, không tạo lại log hoặc dùng chúng làm bằng chứng mới. Kiểm tra link mới ở trên không bao gồm các tham chiếu lịch sử này. Không dùng build cũ làm kiểm chứng cho phương án chưa triển khai.

## Chưa kiểm tra / giới hạn

Không chạy lại build/lint, Browser, video opening hay benchmark vì phiên này không sửa code. Những vấn đề visual đã nêu **chưa được sửa**. Thời lượng, kích thước sáng, contour và đường cong trong kế hoạch là mục tiêu prototype đã chọn, không phải số đo ứng dụng mới. Không có kiểm điện thoại thật/OS/HTTPS mới. Nghiệm thu G1/G2 phải dùng ảnh/clip và số đo từ bản tích hợp sau sửa; FPS cũ V8 không chứng minh các hiệu ứng mới sẽ mượt.
