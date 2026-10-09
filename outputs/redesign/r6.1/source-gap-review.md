# R6.1 — Truy cập nguồn EDURA mới và gap còn lại

08/10/2026 · Asia/Saigon. Chỉ dự án owner https://www.behance.net/gallery/241524417/Edura-LMS, project 241524417; không sử dụng dự án khác cùng tên.

## Bằng chứng mới

- Web reader mở đúng URL: `Cache miss` (reference turn56view0), không trả nội dung gallery.
- Search đúng project ID/từ video/prototype trên Behance trả các dự án LMS/Edura khác; toàn bộ kết quả khác ID 241524417 bị loại, không mở/lấy asset hoặc copy từ chúng.
- Installed Edge 154 điều hướng thường đúng URL, HTTP **403**, document cuối `chrome-error://chromewebdata/` với error page. Không xác minh được gallery; **0 module mới / 0 walkthrough URL / 0 product assets tải mới**.
- Lưu source-access.json (status/browser/date/requests/links/errors), source-access.html và source-access.png. HTML/screenshot là error document, không chứng cứ UI EDURA. Checker trong inspect-primary-source.mjs đảm bảo gallery không verified thì không xuất URL module/walkthrough usable.
- Lệnh: `node outputs/redesign/r6.1/inspect-primary-source.mjs`, exit 0; kết quả truy cập fail được giữ nguyên, không coi exit 0 là gallery pass.

Không login, đổi danh tính, đoán module, gọi API riêng hoặc lấy project trùng tên. Reader có thể dùng 3 asset verified hiện có. Xác nhận mới R6.1 cung cấp bối cảnh Arena và hai constraint để viết Reflection; flow chi tiết/system library/measured outcomes/bài học hay biện pháp xử lý vẫn thiếu. Link video vẫn chưa được cung cấp; không suy ra từ snapshot.

## Biên tập kết quả công khai gọn hơn

R0.3 body results.deliverables có phần nói về “bộ tư liệu công khai đã thu thập”. Đây là ngôn ngữ quy trình audit, không giúp người đọc xem tác phẩm. Đề xuất câu public ngắn dựa trực tiếp C04 / S-USER-20261008:

- Vi: **Thiết kế được thể hiện dưới dạng concept và prototype UI/UX trên Figma.**
- En: **The design takes the form of a UI/UX concept and Figma prototype.**

Có thể đặt heading “Concept và prototype / Concept and prototype”. Không thêm số người dùng, bài test, tác động hài lòng/stress/time/business hoặc hoàn thiện design system. Gap outcome nằm trong báo cáo riêng. Role/scope cũng có thể bỏ “the author confirms” khi chính tác giả giới thiệu portfolio: dữ liệu đã xác nhận được phát biểu trực tiếp ngôi tôi. Excellent nếu dùng vẫn cần attribution; đề xuất omit vì optional và không có assessment record.

Ba quyết định UI nên giữ 1–2 câu scope + observed artifact, không mở rộng thành lý do UX giả. Section Flow chưa có walkthrough thì public gọi “Tư liệu thiết kế / Design artifacts”; không sơ đồ bước hoặc bài học tác giả giả.
## Bổ sung xác nhận tác giả trong R6.1 — bối cảnh và Reflection

Nguồn mới: trực tiếp người dùng trong phiên R6.1, root lưu owner-addendum.json cùng thư mục. Không sửa hoặc coi R0.3 đã chứa dữ liệu này. Nội dung dưới đây thay thế trạng thái cũ “chưa author reflection” chỉ ở mức hai constraint; không tự bổ sung bài học/giải pháp/thành quả.

**Nguyên văn người dùng:**

> dự án này là dự án cuối kì của học kì UX/UI ở Arena Multimedia, khó khăn duy nhất là giữa lúc làm đồ án nhóm bị thiếu đi một người nên mọi thứ về prototype bị chững lại một khoảng thời gian, dự án cũng thiếu mẫu tham khảo bởi LMS mà công khai thông tin và UI không có nhiều

**Copy Vi/En ngắn được phép:**

| Mục | Vi | En |
|:---|:---|:---|
| Bối cảnh | EDURA là đồ án cuối kỳ của học kỳ UX/UI tại Arena Multimedia. | EDURA was the final project for the UX/UI semester at Arena Multimedia. |
| Constraint prototype | Trong quá trình làm đồ án, nhóm thiếu một thành viên, khiến tiến độ prototype bị chững lại một thời gian. | During the project, the team was one member short, which stalled prototype work for a period of time. |
| Constraint tư liệu | Tôi cũng gặp khó khăn khi tìm tư liệu tham khảo: các mẫu LMS công khai thông tin và giao diện để đối chiếu còn hạn chế. | I also found reference material difficult to find: publicly available LMS information and UI examples were limited. |

Câu tư liệu là reflection trải nghiệm tác giả, không khảo sát độc lập toàn bộ thị trường LMS. Không thêm số lượng competitor, số màn, thời gian trì hoãn hoặc tên sản phẩm không có nguồn. Hạn chế cả ngành LMS nên không phát biểu như thống kê thị trường verified.

**Giới hạn:**

- “Thiếu một người” không cho biết đội ban đầu bao nhiêu thành viên, ai/nguyên nhân người đó không còn hoặc vai trò người đó. Không viết “thành viên bỏ cuộc/rời nhóm” hoặc “tôi nhận thêm phần prototype” nếu chưa được xác nhận.
- “Chững lại một khoảng thời gian” không cho biết bao lâu, cách khắc phục, project có phục hồi/chốt deadline thế nào. Không tự viết resilience/teamwork success hoặc timeline.
- Có thể dùng heading “Nhìn lại / Reflection” hoặc “Những giới hạn của dự án / Project constraints”, hai đoạn constraint thật. Không “Bài học / Lessons learned” kéo theo câu học được chưa tác giả nói.
- Không suy ra thiết kế đổi màu/bố cục/system vì constraint này; chưa có constraint → lựa chọn UI → tradeoff → evidence cụ thể.
- Đồ án Arena không tự chứng minh grade, award, shipped status, research ownership hoặc rubric Excellent. Excellent vẫn optional owner report riêng, đề xuất omit mặc định.
- Các gap chưa được gỡ: video/URL flow, artifact system/rationale, usability/operational metrics, action/lesson/iteration/recovery cụ thể. Reader đủ bối cảnh + Reflection constraint nhưng chưa là flow/outcome/system case đầy đủ.

Đối chiếu root owner-addendum.json trước verify cuối để bảo đảm giữ exact quote và allowed scope; subtask không tự tạo file xác nhận tác giả thay root.