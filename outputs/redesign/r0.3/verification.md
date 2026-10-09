# R0.3 — EDURA content pack có căn cứ

**Ngày bàn giao:** 08/10/2026, Asia/Saigon. **Phạm vi:** nội dung và kiểm kê asset cho reader dự kiến `/projects/edura`; chưa viết route/giao diện, chưa xuất bản.

**Kết luận:** content pack cho phần đã xác minh được bàn giao; **349 assertions PASS**, 92 file nguồn giữ nguyên, 26 ảnh decode/hash đúng, 19 claim và 10 block Vi/En có references hợp lệ. **Case study đầy đủ còn thiếu video flow, artifact system/rationale, kết quả đo và bài học cá nhân**. Các thiếu hụt được tách ở [gaps.md](gaps.md), không tạo placeholder để xuất bản.

## Đầu ra chính

- [content.md](content.md): outline sáu phần, 10 block Vi/En; phần bài học chỉ là metadata chưa có copy.
- [content-index.json](content-index.json): block IDs, namespace i18n đề xuất, claim/asset IDs và mức sẵn sàng. Không ghi vào locale ứng dụng.
- [asset-index.json](asset-index.json): đủ 26 file gốc, URL/bytes/hash/kích thước/decode/duplicate/classification, alt/caption Vi/En và khuyến nghị kích thước.
- [claim-register.md](claim-register.md), [claims.json](claims.json): claim → nguồn → trạng thái → giới hạn sử dụng.
- [sources.json](sources.json), [owner-confirmation.json](owner-confirmation.json): nguồn công khai, audit cũ và xác nhận trực tiếp trong phiên này.
- [integration-handoff.md](integration-handoff.md), [progress-row.txt](progress-row.txt): Agent tích hợp giữ quyền append AGENTS tuần tự với R0.2.

## Đã đọc và áp dụng

AGENTS mới nhất, kế hoạch mục 11/16, Quy ước chung của prompts R0–R8, bàn giao R0.1, inventory/manifest/contact sheet EDURA, copy EDURA trong data.js/locales, Q04 và các câu hỏi còn thiếu của audit cũ. Skill `ui-ux-pro-max` từ `C:/Users/PC/.agents/skills/ui-ux-pro-max/SKILL.md`: áp dụng content priority, semantic alt/caption và khả năng đọc ảnh/đoạn văn. Query local tập trung về content không tìm được match tốt cho biên tập case study; không coi kết quả generic là nguồn cho claim dự án, không tạo design system mới. Ponytail full: tái dùng ảnh/manifest, chỉ thêm content pack và một checker assert.

## Ảnh và nguồn

| Kiểm tra | Kết quả thực tế |
|:---|:---|
| Inventory hiện tại | **26 WebP**, **24 SHA-256 khác nhau**, **2.878.812 byte** |
| Decode/hash | 26/26 Pillow 12.3.0 load được, 1400×989; bytes/SHA-256 khớp manifest trước |
| Duplicate | A25 = A23; A26 = A24. Không nhân đôi gallery, không xóa bản gốc |
| Ảnh mặc định | A02 overview sản phẩm; A07 vấn đề; A09 hướng giải pháp |
| Ảnh tùy chọn | A10 phân khúc; A18 Problem/Solution; A19 splash; A22 ý tưởng nhận diện, mỗi ảnh có giới hạn cụ thể |
| APMS | A15–A17 là `competitor-apms`, `exclude`; không đưa vào product gallery/flow EDURA |
| Màu/định dạng | Giữ nguyên file và màu gốc; không resize/crop/re-encode ảnh sản phẩm trong task này |
| Asset mới | **0 ảnh EDURA mới**. Không tải lại tập có sẵn, không tuyên bố đủ 119 module |
| Legibility | Đã xem contact sheet và ảnh gốc A02/A09/A18/A19/A22; reviewer độc lập xem A02/A07/A09/A22. Slide chữ dày khó đọc tại mobile: copy DOM Vi/En là phần đọc chính, viewer ảnh gốc là đề xuất R6 chưa code |

26 URL CDN được kiểm tra đúng host/project ID theo manifest; HTTP 200 của ảnh là bằng chứng lần tải 07/10/2026. Không tuyên bố đã GET lại tất cả URL trong phiên này. URL/bytes/hash/decode của **nguồn mới** OnCourse và ảnh chụp truy cập Behance được kiểm tra riêng.

### Nguồn công khai truy cập trong phiên

- [Behance EDURA, project 241524417](https://www.behance.net/gallery/241524417/Edura-LMS): web reader trả cache miss; Browser plugin kernel thoát. Fallback Edge headless **154.0.4258.62** điều hướng thường trả HTTP **403**, rồi hiển thị error document với dòng HTTP ERROR 400. Log [behance-access.json](behance-access.json), [ảnh truy cập](behance-access.png), HTML đã lưu. Error document không phải gallery; ảnh icon error không phải asset EDURA. Không lấy ảnh dự án trùng tên khác từ search.
- [OnCourse — Making School Data Work: Fixing Fragmentation](https://oncoursesystems.com/making-school-data-work-fixing-fragmentation/): web reader và HTTP trực tiếp truy cập được. Lưu HTML **191.133 byte**, SHA-256 `943ef74b7a914ad9b5433d19203a61cd8356b2551afba04b6f381d8d5a699ae4`, HTTP **200**. URL cuối giữ nguyên; xem [source-retrieval.json](source-retrieval.json).
- Bài OnCourse mô tả khảo sát **tháng 5/2023**, **300 giáo viên tại 18 học khu K–12**, gần 60% cho rằng công cụ công nghệ thiếu tích hợp. Metadata HTML ghi xuất bản **04/08/2023**; slide A08 ghi 2024. Đây là bối cảnh bên ngoài, không phải mẫu học viên EDURA hoặc outcome EDURA; chưa kiểm toán dữ liệu thô khảo sát. Copy chính không dùng con số.

## Kiểm chứng copy và claim

- Lead UI có xác nhận Q04 cũ; người dùng trong phiên này xác nhận ownership về bố cục/màu/system, concept/prototype UI/UX trên Figma và Excellent từ hội đồng Arena.
- Copy Vi/En đồng nghĩa, giữ mức `observed/documented`, `user-confirmed`, `external-publisher-verified` hoặc `missing`; không đánh đồng lời xác nhận với tài liệu công khai độc lập.
- Ba phạm vi UI có thể nêu ngôi tôi; không tự thêm lý do chọn, tradeoff, token/library hoặc hiệu quả giảm tải nhận thức khi chưa có artifact.
- Excellent chỉ là block tùy chọn có “Theo tác giả / According to the author”. Không chuyển thành đổi mới UX, award, kiểm định usability hoặc business outcome. Thành phần/số lượng hội đồng không được suy diễn.
- Không tự nhận nghiên cứu UX của nhóm là nghiên cứu cá nhân, không coi persona/quote là mẫu nghiên cứu đã kiểm định. Quote A09 là thông điệp concept; quote A18 chưa có phương pháp/consent.
- Kỳ vọng tăng hài lòng và chatbot trong tài liệu không trở thành kết quả đo hoặc tính năng đã triển khai. Data trong mockup không là số liệu dự án.
- Lessons không có copy giả; video chưa được xem nên không có flow/step/timestamp tự dựng. Khoảng trống nằm trong gaps/report, không xuất bản.

Review độc lập đã đối chiếu claim/copy và nhìn ảnh: bổ sung caption song ngữ cho archive, cảnh báo quote A09, xác định grid chữ Logo ở A22 và chỉnh câu Excellent không suy ra nhiều Lead Designer trong hội đồng. Sau khi toàn bộ file được ghi, review cuối graph claim → source → copy kết luận **0 issue còn mở**: không biến persona/competitor/OnCourse thành nghiên cứu cá nhân hoặc outcome. Không có finding cần sửa ứng dụng trong phạm vi R0.3.

## Kiểm tra chạy lại

```powershell
& 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' outputs/redesign/r0.3/check-pack.py
```

Checker assert kiểm tập file/hash 92 file nguồn hiện tại, HEAD/tracked status và prefix AGENTS; 26 ảnh/duplicate/URL/alt-caption; claim/source/asset references, parity Vi/En và thứ tự outline; không có placeholder ở public copy; HTTP/bytes/hash/UTF-8/evidence của OnCourse và decode PNG truy cập mới. **Lượt cuối exit 0, 349 assertions, errors `[]`**; kết quả máy đọc ở [verification.json](verification.json). Checker không phụ thuộc build hoặc coi build pass là nghiệm thu nội dung. Lượt đầu phát hiện khác thứ tự sort Path Windows so với chuỗi chuẩn hóa; so tập file xác nhận không có file thêm/xóa, checker đã sửa sort hai phía nhất quán rồi pass, không sửa baseline/source để che lỗi.

Các utility trong thư mục chỉ dùng tạo artifact. Không chạy lại `capture.py` hoặc `inspect-source.mjs` trước checker nếu muốn giữ snapshot nguồn của phiên này: nguồn web động có thể đổi bytes và cần cập nhật pack có chủ đích. Không cài package/plugin mới.

## Bảo toàn và bàn giao tiến độ

- Snapshot mới ở [baseline.json](baseline.json): **92 file src/public/index/vite/package**; đối chiếu cuối giữ nguyên. Không sửa source/public/locale/dependency/config; không commit, deploy hoặc publish.
- Sandbox launcher ban đầu lỗi enumerate volume G: (87). Các command đọc/tạo artifact chạy qua escalation được công cụ chấp thuận; đây không phải lý do thiếu dữ liệu nội dung. Browser plugin lỗi được ghi riêng, không giả render gallery.
- R0.2 chạy song song trong chat **“Hoàn tất sửa Stellar Odyssey”**. Theo yêu cầu người dùng, chat đó được giao quyền tích hợp/append AGENTS tuần tự cho hai task; R0.3 chỉ lưu dòng tiến độ và bàn giao, không tự ghi cạnh tranh.
- R6.1 có thể bố trí reader giới hạn trên verified copy/asset. Flow walkthrough, system chi tiết, outcome và bài học chưa đủ; R6.2 route/Back/Canvas chưa thực hiện ở R0.3. Xem từng blocker trong [gaps.md](gaps.md).
