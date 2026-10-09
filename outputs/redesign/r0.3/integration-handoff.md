# R0.3 — Bàn giao cho Agent tích hợp R0.2/R0.3

08/10/2026. Người dùng yêu cầu append AGENTS tuần tự nếu R0.2/R0.3 song song. Agent tích hợp là chat **Hoàn tất sửa Stellar Odyssey**, thread `01a1082d-78bd-7980-9efb-e4bd7bf318a5`.

## Trạng thái đúng để ghi tiến độ

**✅ Content pack phần đã xác minh xong; còn gap cho R6 đầy đủ.** Không ghi “đã có đủ119module”, “case study hoàn chỉnh”, “đã làm reader/route” hoặc “usability đã pass”.

Chạy checker [check-pack.py](check-pack.py) và đọc [verification.json](verification.json) trước append. Dòng duy nhất đã soạn tại [progress-row.txt](progress-row.txt). Chỉ append nếu chưa có `R0.3 — EDURA content pack`; giữ nguyên mọi byte/dòng cũ AGENTS. Root R0.3 không tự append để tránh tranh chấp.

## Đầu vào cho Agent sau

- `content-index.json` là content handoff có claim/asset IDs và namespace đề xuất; `content.md` là bản đọc/proofread. Chưa tích hợp i18n source.
- `asset-index.json`: 3 ảnh mặc định A02/A07/A09, 4 tùy chọn A10/A18/A19/A22, đủ26file/24unique; giữ màu thật. Không sao chép duplicate/APMS vào reader.
- `claims.json`/`claim-register.md`/`sources.json`: source status, giới hạn, lời xác nhận tác giả mới.
- `gaps.md`: video chưa URL, system/rationale chi tiết, chứng cứ Excellent, outcome/test, reflection, UX ownership/team/timeline và gallery đầy đủ chưa có.

R6 có thể bắt đầu từ phần verified; không tự điền nội dung trống hoặc vẽ flow chưa xem. Behance là nguồn/link phụ và hiện truy cập thất bại trong phiên, không phải lý do dùng ảnh EDURA khác trùng tên.

R0.2 sở hữu riêng `outputs/redesign/r0.2/`. R0.3 sở hữu riêng thư mục này. Các file R0.3 được tạo sau snapshot R0.2 là thay đổi được phép của task song song; không reset/khôi phục chúng về snapshot ban đầu.
