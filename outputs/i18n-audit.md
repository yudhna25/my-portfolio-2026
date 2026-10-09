# Task 2.14 — Audit i18n Vi/En

06/10/2026 · Codex · Hoàn tất kiểm tra và nối i18n. Các đề xuất sửa nội dung đã duyệt ở dưới chưa được áp dụng, theo ràng buộc của người dùng.

## Kết quả

| Kiểm tra | Kết quả |
| --- | --- |
| Text hiển thị hardcode trong src/ | 0, ngoài src/data.js legacy được cho phép |
| Main translation Vi/En | 184/184 string leaves, parity 100% |
| Lab / scene Vi/En | 29/29 và 2/2; tổng 215 leaves/locale |
| Object/array shape, độ dài mảng, interpolation | Khớp 100% |
| Nội dung draft | 142 leaves gốc/locale khớp extractor task 1.4; hai file draft giữ hash |
| Key thiếu trước audit | 0; không coi keys mới Phase 2 là lỗi |
| Key bổ sung | 4/locale cho Footer: disciplines, buildCredit, websiteLabel, websiteUrl |
| Build / lint | PASS; lint 0 errors, 2 warnings cũ SplashCursor; build còn cảnh báo chunk >500 KB |
| Browser App thật | Click Vi/En và Enter trong menu; html lang đổi đúng; 8 section + Footer + 3 marquee đúng bản dịch |
| Đối chiếu DOM Browser | 280/280 giá trị trong hai snapshot En/Vi; không tràn ngang các section tại viewport desktop 1280 × 720 |
| Console phiên kiểm tra | 0 errors; console.json cuối không có error/warn được ghi nhận |

Kiểm tra toàn bộ 51 file JS/JSX bằng rg, AST từ @babel/parser đã có và review thủ công các đường truyền copy. Bao gồm JSX text, literal expression, aria-label/alt/title/placeholder, chuỗi ghi vào DOM, fallback, lab và props. 93 lời gọi t() với key literal có đích ở cả hai locale; 41 lời gọi động được đối chiếu theo domain và nội dung thực tế.

Các họ key động đã soát: navigationSections → nav.*, tool ID → about.tools.*, project path → works.projects.*, institution ID → education.institutions.*, position ID → experience.positions.*, skill groups/indices → skills.*, experiment ID → playground.experiments.*, social → contact.*Url/Label, và các nhánh lab start/travel/end/quality/status. Tên riêng, thuật ngữ ngành và tên experiment giữ theo draft, dù hai locale dùng cùng một chuỗi.

Không coi selector, ID, event, CSS/shader, GSAP ease, enum so sánh category, dấu phân cách, khoảng trắng hoặc chỉ số trang trí là nội dung cần dịch. AST check không phải phân tích data-flow tổng quát; review source và kiểm tra DOM bổ sung phần key động.

## Inventory hardcode ban đầu và cách xử lý

Các dòng sau tham chiếu bản trước khi sửa tại [before/Footer.jsx](task-2.14/before/Footer.jsx), không phải số dòng source hiện tại.

| File / dòng | Chuỗi trước audit | Key / xử lý cuối |
| --- | --- | --- |
| Footer.jsx:69 | Let's | Dùng contact.heading, tách từ để giữ phần nhấn chữ |
| Footer.jsx:69 | Connect | Cùng contact.heading; không tạo hai key fragment mới |
| Footer.jsx:85 | Facebook aria-label | contact.facebookLabel |
| Footer.jsx:88 | LinkedIn aria-label | contact.linkedinLabel; URL trống thì vô hiệu hóa |
| Footer.jsx:91 | Website aria-label | footer.websiteLabel; chuyển href # sang URL rỗng có kiểm soát |
| Footer.jsx:98 | © 2026 Tran Vu Anh Duy | footer.copyright đã có, đúng draft Vi/En |
| Footer.jsx:99 | Graphic / Multimedia / UXUI | footer.disciplines: Đồ họa / Đa phương tiện / UX/UI và Graphic / Multimedia / UX/UI |
| Footer.jsx:100 | Built with GSAP 3.15 | footer.buildCredit với interpolation {{version}}; số phiên bản là dữ liệu kỹ thuật |

Email/phone/Facebook ở Footer trước đây đọc legacy data.js; nay dùng contact.* như Contact/Menu. Website chưa có nguồn chính thức, giữ nhãn cũ và thêm footer.websiteUrl rỗng; không tự suy ra URL hoặc thay bằng Behance.

Footer dùng dependencies locale, revertOnUpdate và key heading để SplitText cleanup không khôi phục chữ của ngôn ngữ trước. Có reduced-motion gate cho entrance/scramble, cùng aria-label email ổn định khi chữ đang scramble. Chỉnh reflow tối thiểu cho copy: không tách từ cuối của heading, hạ cỡ desktop và xếp cột ngang từ xl, cho email xuống dòng ở màn hình hẹp. Giữ skin WIP hiện có; task này không thiết kế lại Footer.

src/i18n/config.js đồng bộ documentElement.lang lúc khởi tạo và trên languageChanged, có cleanup HMR. Store → i18n giữ nguyên một chiều; không thêm engine, language hoặc Context.

## Proofread bản đã duyệt: 6 đề xuất chờ xác nhận

Theo yêu cầu “CẤM đổi nội dung draft đã duyệt khi chưa được yêu cầu”, đây là đề xuất, không phải các sửa đã áp dụng. Không tự suy ra thành tích hoặc tên văn bằng.

| Nguồn / key | Vấn đề | Đề xuất có điều kiện |
| --- | --- | --- |
| src/i18n/locales/vi.json:125 và en.json:125; education.institutions.saigonUniversity.description | Giỏi và Graduated Good Tier chưa thống nhất nghĩa; câu En không tự nhiên | Cần tên phân loại/bản dịch chính thức trên văn bằng rồi dùng Graduated with …; không tự đổi thành Good, Very Good hoặc Distinction |
| src/i18n/locales/en.json:131; education.institutions.arenaMultimedia.description | Distinction Tier Semester 2 thiếu cấu trúc tự nhiên | Awarded Distinction in Semester 2 (UX/UI). Focus: …, sau khi xác nhận tên xếp loại |
| src/i18n/locales/vi.json:130; education.institutions.arenaMultimedia.degree | Advanced Diploma Multimedia khác Advanced Diploma in Multimedia ở En | Xác nhận tên bằng chính thức rồi đồng nhất |
| src/i18n/locales/en.json:164; experience.positions.designveloper.description | Design handoff with Developers là fragment, chữ hoa Developers không cần thiết | Handed off designs to developers. |
| src/i18n/locales/en.json:62; works.projects.verisApp.description | Redefined dùng quá khứ, đoạn mở đầu mô tả hiện tại | Redefines the algorithm-driven feed interface for clarity., nếu giữ ý hiện tại |
| src/i18n/locales/vi.json:273 và en.json:273; common.marquees.collaboration | En thiếu Creativity và thêm Let's Talk so với Vi | Chọn giữ adaptation hiện tại hoặc đồng nhất thành Collaboration • Vision • Creativity • Success |

Toàn bộ giá trị trên vẫn đúng hai draft: content-vi.md:84/87/88/126 và content-en.md:54/75/78/79/93/117. Các dấu em dash, quote straight và dấu ba chấm preloader cũng được giữ nguyên vì là copy đã duyệt. Không tự thay bằng quy ước của skill.

Tone hiện tại bám CLAUDE.md: bio chủ động, tự tin; micro-copy vũ trụ ngắn, rõ. Cách phối từ tiếng Anh trong label nghề nghiệp/tool/experiment phù hợp bản duyệt. Không bổ sung số liệu hoặc claim chưa có nguồn.

Glossary thống nhất HỐ ĐEN: dùng hố đen trong câu, HỐ ĐEN cho heading lab.end.line1; không có Lỗ đen/LỖ ĐEN. Quy ước chọn thuật ngữ, không ép viết hoa toàn bộ văn xuôi.

## Placeholder cần người dùng cung cấp

| Key | Trạng thái / nội dung còn thiếu |
| --- | --- |
| contact.linkedinUrl, cả Vi/En | URL LinkedIn chính thức; hiện rỗng và không có link giả |
| contact.behanceUrl, cả Vi/En | URL profile Behance; không dùng link dự án EDURA thay profile |
| skills.technicalLevel, cả Vi/En | Mức độ kỹ thuật/cách muốn công bố; hiện chưa render field trống |
| footer.websiteUrl, cả Vi/En | URL Website cho icon legacy, hoặc xác nhận bỏ icon; hiện rỗng và vô hiệu hóa |

Rỗng có chủ ý, không phải thiếu bản dịch: common.profile.englishName ở En vì draft En không có sub-name; lab.end.line2 ở cả hai vì heading cuối chỉ một dòng. Không tự điền các field này.

Pending đã được duyệt: VERIS/VIE chưa có case-study URL; 8 Playground experiments dùng nguyên title/type, chưa có description riêng và demo thật thuộc task 3.5. Không thêm nội dung mới.

## Standards review

8 literal Footer và html lang cố định đã được xử lý theo AGENTS.md Rule 5 và yêu cầu a11y của CLAUDE.md. Locale lifecycle/reduced-motion của Footer được nối cùng sửa i18n. Không còn vi phạm về copy hiển thị trong src/ ở snapshot đã kiểm tra, ngoài data.js legacy được miễn. Không phát hiện smell mới cần thêm abstraction.

Metadata ngoài src/ còn title/description tiếng Việt cố định trong index.html:11–12. Đề xuất seo.title/seo.description ở task SEO 4.6; không sửa SEO hoặc manifest trong audit này. Các default export component WIP/unused là ghi nhận code-style ngoài i18n, không thay API trong lượt này.

## Spec review

8 section, 3 trường, 3 vị trí, 3 dự án và 8 experiments có đủ bản Vi/En. 142 leaves từ nguồn chuẩn/locale và hai draft giữ nguyên; 4 key Footer mới tương ứng UI legacy, không tạo content/project/ngôn ngữ mới. Parity và completeness kỹ thuật PASS; 6 đề xuất chất lượng copy và 4 thông tin placeholder ở trên vẫn chờ người dùng xác nhận/cung cấp.

Hai trục Standards/Spec được review độc lập trên working tree và đối chiếu lại sau patch. Đây là audit source hiện tại, không phải review commit/branch.

## Chạy lại và bằng chứng

Chạy:

~~~sh
node outputs/task-2.14/check-i18n.mjs
npm run build
npm run lint
~~~

Script dùng lại flatten/extractor của task 1.4 theo approved subset; không chạy assertion whole-object của check cũ vì nó khóa skeleton 142 leaves. Script kiểm tra JSON shape, parity/interpolation, empty allowlist, i18next resolution, source literals và hashes; detector vẫn tìm đúng 8 literal trong backup trước sửa. Nó còn đối chiếu 280 giá trị trong browser.json đã lưu. Snapshot là bằng chứng của phiên này, không thay thế lượt Browser mới khi source thay đổi.

Dev server hiện có localhost:5173. Browser đổi ngôn ngữ qua Menu bằng click và Enter; đọc DOM/attributes của 8 section, cursor và Footer; đối chiếu với JSON; native wheel kiểm tra trang vẫn cuộn. Một click khi menu đang mở animation chạm overlay và đóng menu; sau khi menu mở ổn định, click Vi/En và keyboard đều pass. Không thay transition Menu để phục vụ automation.

Artifact: [checks.json](task-2.14/checks.json), [browser.json](task-2.14/browser.json), [console.json](task-2.14/console.json), [Footer Vi](task-2.14/footer-vi.png), [Footer En](task-2.14/footer-en.png), build.log/lint.log, backup before/ và protected-hashes.before.json. App, GalaxyScene, CameraRig và hai draft giữ nguyên hash trong phiên này. Không kiểm thử toggle reduced-motion OS trực tiếp trong task 2.14.

Skills: ecc:i18n-sync, writing-guidelines, code-review. [Writing Guidelines](https://raw.githubusercontent.com/vercel-labs/writing-guidelines/main/command.md) được đọc mới để đối chiếu cách viết; CLAUDE.md và ràng buộc giữ draft của người dùng có ưu tiên cao hơn các quy tắc prose chung.
