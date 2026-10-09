# Task 2.14 — Spec / bilingual content review

Ngày kiểm tra: 06/10/2026. Phạm vi: working tree hiện tại; chỉ đọc source, ghi artifact này. Nội dung gốc đã duyệt không bị chỉnh sửa trong lượt review.

## Key parity và nguồn chuẩn

| Bộ locale | Vi | En | Cấu trúc / mảng / interpolation |
|---|---:|---:|---|
| translation | 180 string leaves | 180 | Khớp 100%; không thiếu key ở một bên |
| lab | 29 | 29 | Khớp; `fpsValue` dùng cùng `{{value}}` |
| scene | 2 | 2 | Khớp |

- So sánh shape đệ quy kiểm tra cả object/array và độ dài, không chỉ số key.
- So sánh 142 string leaves gốc mỗi locale với extractor `outputs/task-1.4/draft-locales.mjs`: **không có giá trị nào khác draft**.
- 38 leaves bổ sung mỗi locale phục vụ tools/coreSkills của About, label/accessibility của Works/Nav, pause orbit, LiveDemo, theme toggle và Voyage Log. Nội dung bổ sung có giọng văn ngắn, rõ; không thấy lỗi ngữ pháp đáng kể.
- 64 lời gọi `t('literal.key')` ngoài namespace lab/scene có đích đầy đủ; đối chiếu thủ công các họ key động nav, education, experience, project tags, tools, social, playground và orbitalSkills cũng có đủ đích.
- `outputs/task-1.4/check-i18n.mjs` dùng `assert.deepEqual(actual[lang], expected[lang])`. Không nên chạy nguyên script này để kết luận Phase 2 lỗi, vì extra keys hợp lệ sẽ làm assertion cũ fail. Có thể dùng lại flatten/sourceMap và kiểm tra approved **subset**.

## Nội dung chuẩn cần xác nhận trước khi sửa

Theo yêu cầu “CẤM đổi nội dung draft đã duyệt khi chưa được yêu cầu”, các đề xuất dưới đây chỉ là review. Không tự suy ra thành tích hoặc đổi giọng văn đã duyệt.

| Mức | Key / nguồn | Nhận xét và đề xuất có điều kiện |
|---|---|---|
| P1 — thông tin học vấn | `education.institutions.saigonUniversity.description`; `outputs/content-vi.md:84`, `content-en.md:75` | Vi “Tốt nghiệp loại Giỏi” khác thông tin phân loại mà En “Graduated Good Tier” gợi ra; cụm En cũng không tự nhiên. Cần user cung cấp tên phân loại trên văn bằng hoặc bản dịch chính thức. Chỉ khi xác nhận mới đổi sang `Graduated with …`. Không tự đổi thành “Good”, “Very Good” hoặc “Distinction”. |
| P2 — ngữ pháp | `education.institutions.arenaMultimedia.description`; `content-en.md:79` | “Distinction Tier Semester 2 (UX/UI)” thiếu giới từ và cấu trúc tự nhiên. Đề xuất `Awarded Distinction in Semester 2 (UX/UI). Focus: …`, sau khi xác nhận tên xếp loại. |
| P2 — tên bằng | `education.institutions.arenaMultimedia.degree`; `content-vi.md:87`, `content-en.md:78` | Vi dùng tiếng Anh “Advanced Diploma Multimedia”, En “Advanced Diploma in Multimedia”. Thiếu “in” ở Vi; nên xác nhận tên chính thức của bằng trước khi đồng nhất. |
| P2 — ngữ pháp | `experience.positions.designveloper.description`; `content-en.md:93` | Hai câu đầu là quá khứ, câu cuối “Design handoff with Developers” là fragment và dùng chữ hoa Developers không cần thiết. Đề xuất `Handed off designs to developers.` nếu user cho phép sửa bản duyệt. |
| P2 — nhất quán thì | `works.projects.verisApp.description`; `content-en.md:54` | Mở đầu mô tả sản phẩm ở hiện tại, sau đó “Redefined…” dùng quá khứ. Vi “Tái định nghĩa…” không đặt mốc quá khứ. Đề xuất `Redefines the algorithm-driven feed interface for clarity.` nếu được duyệt; không thêm claim mới. |
| P2 — lệch ý song ngữ | `common.marquees.collaboration`; `content-vi.md:126`, `content-en.md:117` | Vi “Hợp tác • Tầm nhìn • Sáng tạo • Thành công”; En “Let's Talk • Collaboration • Vision • Success”. En không có “Creativity”, có “Let's Talk” thêm. Cả hai đúng draft; cần user chọn giữ creative adaptation hay đồng nhất ý. Không tự thay dải đã duyệt. |

Các fragment micro-copy còn lại phù hợp mục đích label; thuật ngữ ngành Design Thinking, UX/UI, Motion, brand/tool names, experiment titles tiếng Anh được giữ theo draft. Các period, số điện thoại/email, project title/tag, 3 trường, 3 vị trí và 8 experiments đúng nguồn. `skills.heading` “Arsenal Nebula” là creative adaptation của “Tinh Vân Kỹ Năng”, không coi là lỗi nếu giữ bản duyệt.

## Thuật ngữ HỐ ĐEN

Không có “Lỗ đen/lỗ đen/LỖ ĐEN” trong các locale hiện tại. Namespace lab dùng “hố đen” trong câu và **“HỐ ĐEN”** cho heading `lab.end.line1`, thống nhất thuật ngữ. Không cần uppercase mọi lần xuất hiện trong văn xuôi; đây là glossary lựa chọn từ, không phải viết hoa toàn bộ câu.

## Placeholder / dữ liệu chưa chính thức

| Key / vị trí | Trạng thái | Việc còn cần user cung cấp |
|---|---|---|
| `contact.linkedinUrl` Vi/En | Chuỗi rỗng đúng draft `[URL]` | URL LinkedIn chính thức |
| `contact.behanceUrl` Vi/En | Chuỗi rỗng đúng draft `[URL]` | URL profile Behance chính thức; không dùng link dự án EDURA thay profile |
| `skills.technicalLevel` Vi/En | Chuỗi rỗng theo yêu cầu xác nhận cấp độ | Mức độ kỹ thuật/cách muốn công bố; UI hiện không hiển thị phần rỗng này |
| `common.profile.englishName` En | Chuỗi rỗng có chủ ý trong extractor vì draft En không có field sub-name | Không phải thiếu key. Nếu sau này dùng ở UI, user xác nhận dùng tên nào hoặc bỏ sub-name trùng displayName. Vi đã có “Tran Vu Anh Duy”. |
| `lab.end.line2` Vi/En | Rỗng có chủ ý: heading cuối chỉ một dòng | Không cần user điền |
| VERIS / VIE case study | Nhãn coming soon đúng draft, chưa có link | URL và nội dung case study khi chính thức ra mắt |
| 8 Playground demos | Có title/type chuẩn; chưa có description tách riêng/demo thật | Task 3.5, không bịa thêm nội dung. Lựa chọn trước của user là dùng nguyên type hiện có. |
| Footer WIP `href="#"` LinkedIn/Website | Placeholder trong JSX cũ, ngoài locale | LinkedIn dùng URL chính thức ở trên; Website chưa có nguồn chuẩn/key URL. Không tự bịa Website/Behance replacement. |

## Keys chưa tiêu thụ / cần bảo toàn

- `common.profile.*`, `preloader.counterRange`, `preloader.minimalLabel`: metadata/biến thể chưa được UI hiện tại tiêu thụ; giữ theo draft, không xóa vì unused.
- `works.projects.eduraLms.linkUrl`: nguồn locale có URL; Work hiện lấy `PORTFOLIO_DATA.projects[].link`. URL hai nơi khớp nhau; đây là legacy data đã biết, không thiếu nội dung.
- `footer.copyright`: có đủ Vi/En nhưng Footer WIP chưa dùng. Nối Footer vào key này là sửa nhỏ phù hợp task 2.14; không thiết kế lại Footer.
- `lab.scene`: mô tả có sẵn nhưng Lab chưa render; không phải missing translation.
- `nav.menuPending` và `nav.sectionPending`: các trạng thái fallback còn dùng trong Nav/Menu; không stale chỉ vì App hiện đã nối đủ section/overlay.

## Spec status

Parity và nguồn chuẩn **PASS**. Proofread hoàn tất nhưng các thay đổi copy đã duyệt ở bảng trên cần xác nhận trước khi áp dụng. Text hardcode trong Footer WIP cần migrate; phần audit Standards xử lý inventory toàn source riêng. Review này không chỉnh source/draft/locale và không tự công bố task hoàn thành thay agent chính.
