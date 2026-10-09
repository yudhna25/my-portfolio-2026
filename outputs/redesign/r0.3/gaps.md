# R0.3 — Thiếu hụt và phạm vi R6 có thể triển khai

**08/10/2026.** Đây là báo cáo biên tập nội bộ, không phải copy hoặc placeholder để xuất bản.

## Đã được bổ sung trong phiên

Tác giả đã xác nhận trực tiếp ba phạm vi quyết định: **quy tắc bố cục, màu chủ đạo, thiết kế hệ thống giao diện**; trạng thái **concept/prototype UI/UX trên Figma**; đánh giá **Excellent từ hội đồng giám khảo Lead UX/UI Designer của Arena Multimedia**. Vai trò **Lead UI** đã được xác nhận trong Q04 của audit cũ. Nguồn mới được giữ nguyên tại [owner-confirmation.json](owner-confirmation.json).

Các xác nhận này gỡ thiếu hụt về role và trạng thái sản phẩm. Chúng không tự tạo ra video, thư viện component, rubric, feedback usability hoặc số đo hiệu quả.

## Các thiếu hụt còn lại

| ID | Thiếu đầu vào | Nội dung R6 bị chặn | Bằng chứng tối thiểu để mở lại | Xử lý hiện tại |
|:---|:---|:---|:---|:---|
| G01 | Tác giả có video nhưng chưa gửi URL/file có thể truy cập | Flow walkthrough, tên/thứ tự bước, trạng thái bắt đầu–hoàn tất và các màn hình cận cảnh trong R6.1 | Link video hoặc file được phép xem; xác nhận các màn là EDURA và trạng thái prototype; timestamp từng bước sau khi xem | Chỉ dùng overview A02, không dựng sơ đồ flow hoặc lấy APMS lấp chỗ. Không render “flow coming soon”. |
| G02 | Quy tắc bố cục cụ thể, rationale chọn màu, component/token/state và tradeoff | Bài phân tích sâu ba quyết định cá nhân; hình minh họa design system của R6.1 | Ví dụ thật cho từng quyết định: constraint → lựa chọn → artifact → tradeoff; frame/library Figma hoặc đoạn video phù hợp | Public copy chỉ nêu scope đã xác nhận và bố cục/màu quan sát được. Không chế token hay component sheet. |
| G03 | Chưa có biên bản/nhận xét/rubric, ngày và phạm vi của Excellent | Badge chứng nhận độc lập hoặc mô tả điểm mạnh theo tiêu chí cụ thể | Tài liệu hội đồng, đúng phạm vi đánh giá, nội dung được phép công khai | Có câu Vi/En tùy chọn “Theo tác giả / According to the author”. Không “award-winning”, “UX innovation”, “validated usability”. |
| G04 | Chưa có test protocol, số người/task/feedback hoặc dữ liệu trước–sau | Outcome đo được, tăng hài lòng, giảm stress/thời gian, tác động kinh doanh | Báo cáo test thật, task/mẫu/ngày và thay đổi sau feedback; hoặc chỉ dẫn rõ đây chưa test | Phần kết quả chỉ mô tả concept/prototype và artifact. Số trên mockup không phải outcome. |
| G05 | Chưa có reflection của tác giả | Phần bài học cá nhân trong R6.1 | Một bài học từ quyết định, giới hạn hoặc feedback thật; điều tác giả sẽ thay đổi và vì sao | Outline có slot biên tập, nhưng không có copy giả “Tôi học được…”. Bỏ cả section trong reader giới hạn. |
| G06 | Methodology, ownership UX, team size và timeline chưa được cung cấp | Narrative nghiên cứu cá nhân, credit nhóm, mốc dự án cụ thể | Ai làm phần nào; hoạt động nghiên cứu và nguồn; tên/credit được phép dùng; thời gian thực | Không suy ra UX ownership từ tag UX Research hoặc persona. Metadata role/status đủ; các field còn thiếu không xuất bản. |
| G07 | Gallery hiện không truy cập đầy đủ; chỉ có 26 file/24 nội dung độc nhất | Tuyên bố đủ 119 module, UI đầy đủ, các màn/error states chưa xem | Export hoặc nguồn công khai truy cập được từ đúng project 241524417; kiểm tra provenance/bytes/hash/decode | Không tải lại ảnh có sẵn; không đoán URL module hoặc dùng project EDURA khác trùng tên. |

## Handoff R6

- **Có thể bắt đầu bố cục R6.1 giới hạn:** overview, role/scope, vấn đề của concept, ba phạm vi quyết định UI, overview artifact và kết quả ở cấp thiết kế. 3 ảnh mặc định A02/A07/A09, copy DOM Vi/En và caption có giới hạn rõ. Có thể cân nhắc 4 ảnh tùy chọn từ asset-index, không bắt buộc lấp hết outline.
- **Chưa đủ cho case study đầy đủ:** flow thao tác, system walkthrough chi tiết, hiệu quả đo, reflection cá nhân. Không quảng bá reader một phần là một case nghiên cứu/flow/outcome hoàn chỉnh.
- **R6.2 route, Back restore, nghỉ Canvas:** thiếu video/rubric không chặn thiết kế cơ chế route. R0.3 chưa tạo route/UI, không kiểm chứng deep link/Back/SEO/PWA reader.
- **Excellent:** đã gỡ thiếu hụt về người đánh giá theo lời tác giả, nhưng chứng cứ công khai và tiêu chí còn thiếu. Chỉ câu được gắn attribution ở content-index; không lặp copy legacy “Excellent về đổi mới UX”.
- **OnCourse:** primary publisher truy cập được và mô tả khảo sát tháng 5/2023 với 300 giáo viên tại 18 học khu K–12; slide A08 ghi 2024. Không biến số này thành khảo sát học viên EDURA. Copy chính không cần con số; xem [nguồn gốc](https://oncoursesystems.com/making-school-data-work-fixing-fragmentation/).

## Câu hỏi đang chờ

Đã hỏi tác giả **URL video flow** và **link nhận xét/rubric cùng phạm vi Excellent** trong phiên R0.3. Chưa nhận được URL tại thời điểm lập pack. Câu hỏi này không ngăn bàn giao phần đã xác minh. G02/G04/G05/G06 được lưu ở đây để bổ sung có chủ đích; không tiếp tục hỏi dồn hoặc tự nhận đã đủ dữ liệu.

Không sửa `src/`, `public/` hoặc nội dung i18n hiện có. Copy legacy vẫn còn trong ứng dụng cho đến task tích hợp được giao; content pack chỉ rõ câu nào không nên kế thừa.
