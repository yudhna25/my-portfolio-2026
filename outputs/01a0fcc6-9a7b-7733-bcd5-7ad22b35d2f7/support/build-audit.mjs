import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const out = path.resolve(import.meta.dirname, '..');
const live = 'https://my-portfolio-2026-seven.vercel.app/';
const behance = 'https://www.behance.net/gallery/241524417/Edura-LMS';
const wcag = 'https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide';
const gsapReact = 'https://gsap.com/resources/React/';
const hiring = 'https://www.uxdesigninstitute.com/state-of-ux-hiring';
// Records distinguish observed failures, code evidence, and hypotheses. No invented user frequencies.
const findings = [
 ['A01','P1','Bug','Local','Menu section gây TypeError','Work/Journey/Contact không đưa người xem tới nội dung.','Console: undefined.style trong ScrollSmoother.offset. Nav.jsx:43-49; log local-console.json.','Resolve string bằng document.querySelector trước khi truyền Element vào GSAP. Dùng native anchor là hướng đơn giản hơn khi redesign.','Reload sạch. Click và Enter trên mọi mục. Không còn error, section tới đúng vị trí.','Trước deploy','Đã tái hiện',gsapReact],
 ['A02','P1','Bug','Live + Local','Navbar bị cắt trên mobile','Mục Contact không đọc hoặc chạm được đầy đủ.','Live 320: Contact x=276,9 tới 327,3. Local 375: Contact x=347,3 tới 397,7. E04/E05.','Giữ logo và menu thu gọn ở mobile. Link native, nút mở menu có aria-expanded và vùng chạm rộng.','320/375/390 px: không chồng chữ, mọi mục mở được bằng touch và keyboard.','Trước deploy','Đã tái hiện','src/components/Nav.jsx:56-77'],
 ['A03','P1','Bug','Live + Local','Email/contact bị cắt','Kênh liên hệ chính mất chữ hoặc mép nút.','Live 320: mail link left=-60,5 px. Live 375: left=-5,5 px. Local 375: mép phải nút vượt vùng nhìn. E04/E05.','Email được wrap hoặc break hợp lý. Giảm padding mobile, đặt max-width:100%. Giữ mailto đúng.','Email và icon hiển thị đủ ở 320/375 px, zoom 200%, không cắt nút.','Trước deploy','Đã tái hiện','src/components/Footer.jsx:92-103'],
 ['A04','P1','Bug','Live + Local','2/3 dự án không có đích case study','VERIS/VIE trông có thể click nhưng không mở được và không vào Tab order.','DOM href=null. data.js:33-50. Work.jsx:154.','Điền URL thật. Nếu chưa sẵn sàng, dùng card thường với trạng thái rõ ràng.','Mọi card được giới thiệu là case study có URL hoạt động và dùng được bằng Enter.','Trước deploy','Đã tái hiện',live],
 ['A05','P2','Bug','Live + Local','LinkedIn và Website dùng #','Nhấp vào không tới hồ sơ chuyên nghiệp.','DOM có hai href="#". Live icon còn thiếu tên truy cập.','Điền LinkedIn thật và Behance. Bỏ icon chưa có đích.','Mọi social link có tên và URL đúng, không còn #.','Trước deploy','Đã tái hiện','src/components/Footer.jsx:108-115'],
 ['A06','P1','Bug','Local','Gallery có nội dung vượt khung 720 px','Heading/progress và một phần card bị overflow-hidden cắt.','1280×720: heading top=-143,6; pin top=-115; progress bottom=621 > pin bottom=605. E06.','Bỏ fixed h-screen cho gallery. Ưu tiên grid dọc; nếu pin, cần fallback theo chiều cao và filter chỉ còn 1 card.','720 px và landscape: heading, card, tags, controls đều đọc được.','Trước deploy','Đã tái hiện','src/components/Work.jsx:129-194'],
 ['A07','P2','Bug','Local','Chữ Education vượt cột tablet','Tiêu đề lớn lấn sang nội dung bên phải.','768 px: edu-title clientWidth=189, scrollWidth=353. Education.jsx:52-55.','Giảm font bằng clamp hoặc chỉ chia cột từ lg. Không chữa bằng overflow hidden.','768/820/1024 px: tiêu đề không lấn timeline, không gãy từ.','Trước deploy','Đã tái hiện','src/components/Education.jsx:50-65'],
 ['A08','P2','Pain point','Local','CONNECT vỡ thành CONNE / CT ở tablet','CTA cuối trang mất sự chỉn chu.','E07: screenshot tablet 768×1024.','Điều chỉnh scale chữ và breakpoint footer. Tránh để SplitText chia từ khi cột hẹp.','CONNECT giữ nguyên từ ở tablet, heading không che contact.','Visual polish','Đã tái hiện','src/components/Footer.jsx:87-94'],
 ['A09','P1','Bug','Local','Lint toàn repo thất bại','CI có gate lint sẽ chặn. Vercel build hiện tại vẫn có thể thành công.','npm run lint: 488 errors, 26 warnings. 486 errors nằm ngoài src trong gsap-public.','Đưa bản vendored gsap-public ra khỏi phạm vi lint hoặc bỏ bản sao sau khi xác minh không dùng. Dùng dependency gsap hiện có.','npm run lint exit 0. Không disable rules toàn repo để che lỗi.','Trước deploy','Đã tái hiện','eslint.config.js:8; gsap-public/'],
 ['A10','P2','Bug','Local','Hai lỗi lint trong source','Source chưa đạt kiểm tra đã cấu hình. Chưa chứng minh cả hai là crash runtime.','eslint src: Preloader.jsx:13 và Work.jsx:112, react-hooks/refs.','Chuyển cập nhật ref callback khỏi render. Kiểm tra tương tác contextSafe với analyzer ở Work trước khi chọn fix hoặc exception hẹp.','Lint src exit 0 và filter/loader hoạt động. Không tắt react-hooks toàn cục.','Trước deploy','Đã tái hiện','support/source-lint.json'],
 ['A11','P2','Bug','Local','Preloader tween không tìm thấy welcome node','Hiệu ứng welcome dự kiến không chạy.','Console GSAP target .welcome-word not found. Target chỉ mount sau setWelcome.','Giữ node trong DOM rồi đổi visibility hoặc tạo tween sau khi node đã mount.','Reload: không còn target not found, không còn overlay sau intro.','Trước deploy','Đã tái hiện','src/components/Preloader.jsx:55-64'],
 ['A12','P1','Pain point','Live + Local','Preloader phần trăm giả khóa nội dung','Recruiter phải đợi intro mỗi reload trước khi xem năng lực.','Counter theo duration, không theo tài nguyên. Local timeline khoảng 5,05 s.','Bỏ counter giả. Intro 0,6-0,9 s không khóa đọc/click; reduced motion hiển thị ngay.','Không trì hoãn CTA hoặc case study vì intro. Thời gian ghi là thiết kế, không gọi là thời gian tải.','Trước deploy','Code xác nhận','src/components/Preloader.jsx:37-74; App.jsx:42-47'],
 ['A13','P1','Pain point','Live + Local','Ảnh cover gốc quá nặng','Tăng dữ liệu tải và bộ nhớ trên thiết bị di động.','project2.jpg 11.483.789 bytes, 7680×4320. Avatar + 3 cover = 17.210.780 bytes.','Xuất WebP/AVIF từ asset gốc, đúng kích thước hiển thị. srcset/sizes; ưu tiên project2 trước.','Đo bytes thực tế sau xuất. Cover mobile khoảng 200-400 KB là ngân sách đề xuất, không phải số đã đạt.','Trước deploy','Code xác nhận','public/project2.jpg; src/components/Work.jsx:163'],
 ['A14','P2','Pain point','Local','Ảnh chưa có chiến lược responsive','Mobile vẫn tải ảnh desktop; avatar dưới fold tải sớm.','Avatar không lazy. Cover lazy nhưng thiếu srcset/sizes. Khung đã có tỷ lệ nên chưa kết luận CLS lỗi.','Lazy avatar. Khai báo kích thước nội tại và responsive variants.','Ảnh nhỏ được chọn ở mobile. Khung không nhảy khi ảnh tải.','Trước deploy','Code xác nhận','src/components/About.jsx:112; Work.jsx:163'],
 ['A15','P1','Bug','Local','Reduced motion chưa bao phủ GSAP','Marquee, parallax, pin, cursor, scramble vẫn được tạo.','App/Hero/Preloader có nhánh reduce; Work/About/Education/Footer/Marquee/Cursor không có. CSS chỉ tắt animation CSS.','Dùng gsap.matchMedia cho các motion liên quan. Reduced motion render trạng thái cuối, không pin/scrub/scramble.','Test runtime với reduced motion: nội dung đủ và mọi hành động còn dùng được.','Trước deploy','Code xác nhận','src/index.css:89-93; các components GSAP'],
 ['A16','P1','Bug','Live + Local','Ba marquee chạy liên tục không có pause','Khó tập trung vào nội dung bên cạnh.','Marquee repeat:-1. Không có control pause/stop.','Giữ tối đa một marquee có mục đích và pause control, hoặc dùng dải tĩnh.','Chuyển động >5 s có cách dừng; reduced motion không chạy.','Trước deploy','Code xác nhận',wcag],
 ['A17','P2','Bug','Local','Marquee lặp văn bản trong accessibility tree','Screen reader đọc khẩu hiệu nhiều lần.','Nửa đầu có 4 bản sao, chỉ nửa sau aria-hidden.','Ẩn phần trang trí khỏi tree. Nếu có thông tin cần đọc, cung cấp một câu tĩnh.','Screen reader đọc thông tin một lần.','Trước deploy','Code xác nhận','src/components/Marquee.jsx:44-54'],
 ['A18','P1','Bug','Local','Một số chữ nhỏ không đạt tương phản','Giảm khả năng đọc và chất lượng accessibility.','Đỏ/paper 3,33:1; trắng/đỏ 3,64:1; white/40 trên dark 3,83:1; gray500/dark 3,60:1.','Tách accent trang trí và màu chữ. Đỏ tối hơn trên paper, xám sáng hơn trên dark, filter selected có màu chữ đủ contrast.','Normal text ≥4,5:1; large text ≥3:1. Kiểm tra nền thực và hover/focus.','Trước deploy','Code xác nhận','Hero.jsx:113; Work.jsx:140,192; Education.jsx:75'],
 ['A19','P2','Bug','Local','Filter không công bố trạng thái chọn','Screen reader không biết category đang áp dụng.','Button không có aria-pressed, chỉ đổi màu. Keyboard Enter đã đổi All thành 3 cards.','Thêm aria-pressed. Dùng label/count ngắn có ngữ cảnh nếu cần thông báo kết quả.','Keyboard và screen reader nhận đúng selected state và số kết quả.','Trước deploy','Đã tái hiện','src/components/Work.jsx:136-146'],
 ['A20','P2','Bug','Live + Local','Hai h1, một h1 là năm trang trí','Outline không nói rõ tên và chuyên môn của người thiết kế.','DOM có h1 2026 và PORTFOLIO.','Một h1 tên + vai trò. Năm trang trí dùng span aria-hidden.','Heading outline mô tả đúng cá nhân, nội dung phụ theo h2/h3.','Nội dung chủ lực','Đã tái hiện','src/components/Hero.jsx:98-107'],
 ['A21','P2','Pain point','Local','Thiếu native anchor và skip link','Không copy được link section; đường tới main dài hơn cho bàn phím.','Nav dùng buttons và GSAP. Không skip link. Live hiện có href anchors.','Dùng anchor #work/#about/#contact và skip link tới main. GSAP chỉ enhancement nếu cần.','Copy link, back/hash và skip link hoạt động; focus không bị nav che.','Trước deploy','Code xác nhận','src/components/Nav.jsx:57-77'],
 ['A22','P2','Rủi ro','Local','Focus có thể nằm sau overlay intro','Tab có thể tới control không nhìn thấy.','Overlay không trap focus; nội dung phía sau không inert. Chưa test trong cửa sổ intro.','Bỏ loader khóa hoặc đặt vùng phía sau inert trong thời gian overlay.','Reload và Tab ngay: focus luôn nhìn thấy.','Trước deploy','Cần kiểm tra thêm','src/components/Preloader.jsx:82; App.jsx:67-83'],
 ['A23','P2','Rủi ro','Local','Cursor hover có thể mất sau filter','Cards remount nhưng listeners gắn một lần vào DOM ban đầu.','Cursor.jsx:32-38, Work thay filtered cards.','Bỏ enhancement nếu không giúp đọc, hoặc dùng delegation trên root.','Filter mọi category rồi hover: cursor hoạt động nhất quán; pointer coarse dùng native.','Visual polish','Cần kiểm tra thêm','src/components/Cursor.jsx:32-38'],
 ['A24','P1','Pain point','Live + Local','Định vị multimedia lấn vai trò UX/UI','Recruiter product team khó nhận ra ứng viên Junior UX/UI phù hợp.','Hero ghi Multimedia Executive/Designer. Người dùng xác nhận mục tiêu Junior UX/UI/Product Designer. E01/E05.','Tên và UX/UI Designer là thông tin chính. Multimedia/motion là năng lực bổ trợ có bằng chứng.','Trong 5 giây đọc, người xem nói đúng tên, vai trò và lĩnh vực mạnh.','Nội dung chủ lực','Đã tái hiện',live],
 ['A25','P1','Pain point','Live + Local','Selected Work xuất hiện sau hồ sơ và học vấn','Bằng chứng năng lực đến muộn.','Flow: Hero → About → Education → Work. Không có CTA hero xem case study.','Hero → Edura nổi bật → dự án UX/UI thứ hai → About/Experience gọn → Contact. Education đưa vào phần ngắn hoặc CV.','Case study chủ lực tới được bằng một hành động từ hero.','Nội dung chủ lực','Đã tái hiện','src/App.jsx:74-79; Hero.jsx:103-131'],
 ['A26','P1','Pain point','Live + Local','Edura chưa nói rõ Lead UI và quyết định cá nhân','Khó phân biệt đóng góp cá nhân với thành quả của cả nhóm.','Card có description/tags nhưng không có role, team, timeline, decision. Lead UI do bạn xác nhận.','Bổ sung summary Lead UI, scope, 3 quyết định, artifact và phản hồi thật. Phân biệt UI lead với ownership UX research.','Reviewer chỉ ra được bạn làm gì, vì sao, bằng chứng ở đâu.','Nội dung chủ lực','Đã tái hiện',behance],
 ['A27','P1','Pain point','Live + Local','Claim Excellent/business value thiếu nguồn trên trang','Khó đánh giá độ tin cậy. Không kết luận claim sai.','Card ghi Excellent for UX innovation; About ghi tangible business value nhưng không dẫn chứng.','Gắn rubric/feedback có nguồn. Nếu là bài học hoặc đánh giá lớp, nêu đúng bối cảnh. Chỉ dùng metric có thật.','Mọi claim kết quả có nguồn, phạm vi, ngày hoặc phương pháp.','Nội dung chủ lực','Code xác nhận','src/data.js:27; About.jsx:128'],
 ['A28','P1','Pain point','Live + Local','VERIS copy không khớp ảnh sản phẩm','Mô tả social feed trong khi cover nói trải nghiệm/chữa lành cảm xúc.','Asset cover có viết trải nghiệm và trò chuyện nhân vật. E06. Copy ghi social network/feed algorithm.','Đọc brief gốc và viết đúng vấn đề, audience, phạm vi. Đổi category nếu cần.','Copy, UI screens và case study kể cùng một sản phẩm.','Nội dung chủ lực','Đã tái hiện','src/data.js:38; public/project2.jpg'],
 ['A29','P2','Pain point','Live + Local','Covers chưa chứng minh chất lượng UI','Edura là lớp học/logo, VIE chủ yếu lifestyle; recruiter chưa thấy interface hoặc system.','E08 và covers public/project1.jpg, project3.jpg.','Hero Edura dùng UI screens thật. VIE dùng application/brand system thật; giữ ảnh lifestyle làm phụ.','Nhìn thumbnail nhận ra loại sản phẩm và năng lực thiết kế.','Visual polish','Đã tái hiện',behance],
 ['A30','P2','Pain point','Live + Local','Lỗi tiếng Anh trong cover VERIS','Giảm cảm giác polished ngay trên mockup UI.','Cover ghi Let’s you in. E06.','Sửa thiết kế gốc thành Welcome back hoặc Let’s get you in theo flow; export lại.','Proofread tất cả UI text trong image và case study.','Nội dung chủ lực','Đã tái hiện','public/project2.jpg'],
 ['A31','P2','Pain point','Live + Local','Portrait glow không đồng nhất visual language','Ảnh cá nhân có mood khác paper/black/red và UI cases.','E02: glow lớn và cutout; local hover đổi từ grayscale sang màu.','Dùng portrait ánh sáng sạch, crop tự nhiên, bỏ glow mạnh. Giữ một xử lý màu nhất quán.','Ảnh hỗ trợ nhận diện cá nhân, không cạnh tranh với UI.','Visual polish','Đã tái hiện','public/avatar.png; About.jsx:111'],
 ['A32','P2','Pain point','Live + Local','Experience không ưu tiên UX/UI gần đây','Internship Designveloper bị đọc sau multimedia cũ.','Thứ tự HOSANA → UPWORK → DESIGNVELOPER, dù internship Sep-Dec 2025.','Mới nhất lên đầu. Mỗi role có scope, deliverable, collaboration thật. Rút history thành list đọc nhanh.','Reviewer tìm thấy UX/UI experience mà không phải đọc hết history.','Nội dung chủ lực','Code xác nhận','src/data.js:63-87; About.jsx:166-173'],
 ['A33','P2','Pain point','Live + Local','Soft skills và software chiếm nhiều diện tích','Thông tin ít phân biệt ứng viên trong khi case study chưa sâu.','Nhiều badges: time management/teamwork/adaptability; icon software prominent.','Rút còn năng lực gắn artifact: interaction, UI system, prototyping, handoff. Tool list đưa xuống phụ.','Mỗi năng lực chính trỏ tới một ví dụ cụ thể.','Nội dung chủ lực','Đã tái hiện','src/data.js:53-61; About.jsx:132-159'],
 ['A34','P1','Pain point','Live + Local','Thiếu CV tải về và đường tới hồ sơ tuyển dụng','Recruiter không có gói thông tin ngắn để chuyển tiếp.','Không tìm thấy PDF CV/link CV trong DOM, src hoặc public. LinkedIn placeholder.','Thêm PDF CV cập nhật, LinkedIn thật và email rõ. Ghi availability/location đúng thực tế.','CV tải được trên mobile, có ngày cập nhật; contact không cần form/backend.','Nội dung chủ lực','Code xác nhận','src/components/Nav.jsx; Footer.jsx; public/'],
 ['A35','P2','Pain point','Live + Local','Metadata và favicon còn Vite template','Tab/search/share không thể hiện danh tính chuyên nghiệp.','HTTP HTML: title=my-portfolio, favicon=/vite.svg, không description/OG/canonical.','Title theo tên + UX/UI Designer. Description, OG image từ work thật, favicon cá nhân. Canonical theo domain xác nhận.','View source và social preview thể hiện đúng cá nhân, ảnh và URL.','Trước deploy','Đã tái hiện','index.html:5-8'],
 ['A36','P2','Rủi ro','Deploy','Node/build/output chưa được ghi rõ','Nguy cơ cấu hình môi trường khác local; chưa có failure production do Node.','Local Node 24.12.0, Vite installed 7.3.0. Không engines/.nvmrc; README vẫn template.','Ghi Node tương thích, build=npm run build, output=dist và env nếu có. Không dùng vite preview làm production server.','Clean checkout npm ci + build trên môi trường CI tương thích thành công.','Trước deploy','Cần kiểm tra thêm','package.json; README.md; https://vite.dev/guide/static-deploy.html'],
 ['A37','P2','Pain point','Live + Local','Bản public và working tree khác nhau','Kết quả test dễ bị hiểu nhầm giữa bản đang online và bản chưa commit.','Live JS index-D264NIrm; local index-Ca5rCiJk. Local có Journey/filter/pin ngang, live không có.','Chốt revision được deploy. Test preview cùng commit trước production. Lưu smoke checklist, không thêm hệ thống release riêng.','Bản preview và production trỏ đúng revision đã kiểm.','Trước deploy','Đã tái hiện',live],
 ['A38','P2','Pain point','Live','Archive Loading là nội dung treo','Tạo cảm giác website còn dang dở.','DOM Work có Archive Loading...; không thấy luồng archive.','Bỏ archive placeholder. Chỉ thêm khi đã có nội dung và hành động thật.','Không có loading placeholder vĩnh viễn.','Nội dung chủ lực','Đã tái hiện',live],
 ['A39','P2','Pain point','Edura Behance','Case study dài và phần lớn ở dạng ảnh','Cần bản đọc nhanh cho recruiter, nội dung ảnh khó tìm kiếm và đọc bằng assistive tech.','DOM có Project Module 0-118, height khoảng 90.856 px ở viewport desktop; chỉ skim phần mở đầu.','Tạo bản tóm tắt trên portfolio: problem/Lead UI/3 decisions/evidence/reflection. Link Behance để xem đầy đủ.','Reviewer đọc summary trong 1-2 phút rồi chọn xem sâu. Không sao chép toàn bộ 119 modules.','Nội dung chủ lực','Đã tái hiện',behance],
 ['A40','P3','Pain point','Local','Footer ưu tiên framework hơn ứng viên','Built with GSAP 3.15 không giúp tuyển dụng UX/UI đánh giá năng lực.','Footer có framework version.','Bỏ version hoặc thay availability/location cập nhật.','Footer chỉ còn contact và thông tin nghề nghiệp hữu ích.','Visual polish','Code xác nhận','src/components/Footer.jsx:123'],
 ['A41','P2','Rủi ro','Live + Local','Chưa có số liệu performance thực tế','Không thể khẳng định điểm Lighthouse hoặc Core Web Vitals từ kích thước bundle.','Build JS 401,63 KB, gzip 138,59 KB; chưa chạy Lighthouse/throttled profile/field data.','Đo lab mobile trước/sau; LCP/INP/CLS dùng field data khi có. Không thêm analytics chỉ để trang trí dashboard.','Báo cáo có thiết bị, mạng, run và metric. Mục tiêu LCP ≤2,5 s, INP ≤200 ms, CLS ≤0,1.','Trước deploy','Cần kiểm tra thêm','https://web.dev/articles/vitals'],
 ['A42','P2','Rủi ro','Local','Keyboard trong gallery ngang chưa kiểm đủ','Link ngoài viewport có thể nhận focus khi pin/transform. Hiện VERIS/VIE chưa có link thật.','Work pin track bằng transform ở ≥768 px. Chưa thể kiểm đủ focus mọi case.','Ưu tiên grid hoặc đảm bảo focus đưa card vào vùng nhìn; không ép người dùng wheel để mở case.','Tab qua mọi case sau khi bổ sung URL. Focus nhìn thấy ở 768/1024/1440 và reduced motion.','Trước deploy','Cần kiểm tra thêm','src/components/Work.jsx:53-81'],
];

const ideas = [
 ['I01','P1','Cinematic product portfolio','Tên và UX/UI Designer rõ. Một UI composition Edura lớn. CTA View Edura và Download CV.','Chuyển ấn tượng đầu thành bằng chứng năng lực.','Ảnh thật từ Figma/Behance, native CSS + GSAP timeline ngắn.','Không autoplay nền nặng, không preloader bắt chờ. Mobile hiển thị cùng thông tin.','design-taste-frontend, gpt-taste, ponytail','Nội dung chủ lực'],
 ['I02','P1','Edura làm chương mở đầu','Case summary: app quản lý tiến độ học tập tại trung tâm, vai trò Lead UI, phạm vi và bài học.','Bám mục tiêu Junior trong product team.','Tái sử dụng artifacts Edura. 3 quyết định UI có ảnh và lý do.','Không tự nhận ownership UX research nếu nhóm khác làm.','product-design:research, redesign-existing-projects','Nội dung chủ lực'],
 ['I03','P1','Hai mức đọc case study','Summary đọc nhanh rồi link tới Behance đầy đủ.','Recruiter có thể skim và hiring manager có thể đào sâu.','Nội dung HTML semantic. Link native.','Không nhúng toàn bộ gallery Behance dài vào trang chủ.','ui-ux-pro-max, ponytail','Nội dung chủ lực'],
 ['I04','P1','Decision → artifact → feedback','Mỗi quyết định: vấn đề, giải pháp, bằng chứng Figma, phản hồi thật và thay đổi sau đó.','Chứng minh tư duy, không chỉ final screens.','Ba block nội dung trực tiếp; không cần CMS.','Nếu không có metric, dùng bằng chứng định tính có nguồn.','product-design:research, design-taste-frontend','Nội dung chủ lực'],
 ['I05','P1','Hình Edura cho thấy UI thật','Một màn hình overview và một flow trọng tâm, crop đủ đọc; cover lớp học làm phụ.','Nhận ra năng lực UI ngay trên thumbnail.','Export AVIF/WebP đúng slot từ design gốc.','Không dùng stock hoặc ảnh AI để giả sản phẩm đã thiết kế.','redesign-existing-projects, gpt-taste','Visual polish'],
 ['I06','P2','Flow spotlight tương tác','Chọn 1 flow Edura: đầu vào → màn hình quyết định → trạng thái hoàn thành.','Cho thấy interaction và state reasoning.','Tabs/buttons native cho 3 bước; GSAP crossfade nếu cần.','Flow do bạn chọn từ prototype thật. Keyboard và reduced motion có fallback.','ui-styling, gsap-core','Visual polish'],
 ['I07','P2','UI system proof','Một khung cho typography, component states và responsive của Edura.','Lead UI được thể hiện qua hệ thống và consistency.','Assets/component hiện có; CSS Grid.','Chỉ trình bày system thực sự có, không chế thêm để claim.','ui-styling, ui-ux-pro-max','Nội dung chủ lực'],
 ['I08','P2','Motion diễn giải sản phẩm','Reveal một nhóm UI khi vào view; nhấn quan hệ giữa hai trạng thái bằng crossfade.','Motion phục vụ hierarchy và cause/effect.','GSAP đã cài, transform/opacity, scoped cleanup.','Không animate mọi block; giảm chuyển động thì đọc ngay.','gsap-core, design-taste-frontend','Visual polish'],
 ['I09','P2','Một khoảnh khắc cinematic','Hero UI lớn, crop có chủ đích, intro 0,6-0,9 s là đề xuất.','Tạo signature đủ nhớ nhưng vẫn truy cập nội dung nhanh.','Timeline nhỏ, native scroll; không thêm animation library.','Không giữ pin ngang mặc định cho recruiter. Không dùng loading % giả.','gpt-taste, gsap-core, ponytail','Visual polish'],
 ['I10','P2','Project composition có nhịp','Edura full-width, dự án UX/UI thứ hai nhỏ hơn; visual/motion work ở phần phụ.','Tránh ba card đồng hạng khi chất lượng bằng chứng khác nhau.','CSS Grid hiện có, mobile một cột.','Không tạo ô rỗng hoặc carousel chỉ để trông phức tạp.','design-taste-frontend, redesign-existing-projects','Visual polish'],
 ['I11','P2','Giữ đen/giấy/đỏ có kỷ luật','Một palette xuyên trang. Đỏ sáng trang trí, đỏ tối cho chữ nhỏ.','Giữ nhận diện, nâng legibility.','Tái sử dụng CSS variables, bỏ hex lặp khi chạm component.','Không đổi brand chỉ vì dataset gợi ý xanh/green.','ui-ux-pro-max, ui-styling, ponytail','Visual polish'],
 ['I12','P2','Typography cinematic nhưng dễ đọc','Tên/role chính, h1 2-3 dòng desktop, body max khoảng 65ch. Heading dùng font sans có cá tính.','Dễ skim và giữ sự mạnh mẽ.','Giữ Space Grotesk/Manrope trước, self-host subsets và font-display:swap nếu tối ưu.','Chưa cần đổi font chỉ để khác. Test dấu tiếng Việt và tablet.','design-taste-frontend, redesign-existing-projects','Visual polish'],
 ['I13','P2','Portrait ánh sáng sạch','Portrait tự nhiên, crop hợp slot, cùng màu neutral.','Tạo kết nối cá nhân mà không làm lấn sản phẩm.','Chụp hoặc chỉnh ảnh thật, tối ưu WebP.','Giữ chân dung thật. Không cần thêm glow/magnetic effect.','redesign-existing-projects','Visual polish'],
 ['I14','P1','Contact phục vụ tuyển dụng','Email, LinkedIn, CV, availability. Contact CTA thống nhất label.','Giảm bước để mời phỏng vấn hoặc chia sẻ hồ sơ.','mailto, anchors và PDF tĩnh.','Không thêm form/backend khi email đã đáp ứng.','ui-styling, ponytail','Nội dung chủ lực'],
 ['I15','P2','Kinh nghiệm kể bằng đóng góp','Designveloper trước. Nêu task thật, artifact, cách handoff/collaboration.','Thể hiện readiness cho product team ở cấp Junior.','List semantic ngắn; education rút gọn.','Không bịa số tăng trưởng hoặc gọi mọi công việc là impact.','product-design:research, redesign-existing-projects','Nội dung chủ lực'],
 ['I16','P2','VERIS có câu chuyện nhất quán','Brief đúng về trải nghiệm/chữa lành cảm xúc; sửa English UI rồi bổ sung case URL.','Có thể thành case thứ hai nếu có reasoning và contribution.','Tái sử dụng Figma/ảnh nguồn thật.','Không xếp là product case mạnh nếu chỉ có visuals.','product-design:research, design-taste-frontend','Nội dung chủ lực'],
 ['I17','P3','Visual playground phụ','VIE, motion reels hoặc brand applications ở cuối trang, chọn ít work tốt.','Multimedia trở thành điểm khác biệt hỗ trợ UX/UI.','Thumbnails + link/video click-to-play.','Không autoplay nhiều video, không thêm gallery framework.','gpt-taste, ponytail','Sau bản chính'],
 ['I18','P2','Social preview có nhận diện','OG card từ UI Edura và tên/role, favicon signature.','Ấn tượng thống nhất khi gửi portfolio.','Ảnh export và meta HTML tĩnh.','Không cần dịch vụ dynamic OG.','redesign-existing-projects, ponytail','Trước deploy'],
 ['I19','P2','Test với recruiter/peer thật','Cho người đọc tìm vai trò, Lead UI contribution, project proof và email.','Xác minh comprehension sau redesign.','Bài test task ngắn, ghi quan sát và lời nói thật.','Không coi audit hiện tại là user study hay bịa tần suất người gặp lỗi.','product-design:research, grill-me','Sau bản chính'],
 ['I20','P3','Themes khi có lý do','Cinematic có thể dùng một theme nhất quán với accent đỏ, không cần toggle ngay.','Giảm scope và tránh màu mỗi section khác hẳn.','CSS tokens đã có.','Chỉ thêm toggle dark/light nếu bạn cần và có thời gian kiểm cả hai.','design-taste-frontend, ponytail','Sau bản chính'],
];

const questions = [
 ['Q01','Mục tiêu','Ai cần bị thuyết phục?','Nhà tuyển dụng UX/UI hoặc Product Designer','Đã trả lời','Đã chốt','Dùng để xếp IA và project order.'],
 ['Q02','Cấp độ','Ứng tuyển cấp độ/môi trường nào?','Junior trong product team','Đã trả lời','Đã chốt','Ưu tiên reasoning, collaboration, learning và phạm vi thật.'],
 ['Q03','Visual','Hướng hình ảnh nào?','Cinematic, hình ảnh lớn, motion có chọn lọc','Đã trả lời','Đã chốt','Một khoảnh khắc mạnh. Nội dung và native interaction luôn dùng được.'],
 ['Q04','Edura','Vai trò cá nhân chủ lực?','Lead UI. Bằng chứng trong Behance','Đã trả lời','Đã chốt','Phân biệt đóng góp UI lead với công việc UX của nhóm.'],
 ['Q05','Deploy','URL public hiện tại? ',live,'Đã trả lời','Đã chốt','Không publish bản mới trong đợt audit này.'],
 ['Q06','Edura','Ba quyết định UI quan trọng nhất bạn sở hữu là gì?','','Cần bạn bổ sung','Chưa trả lời','Chọn quyết định có constraint, artifact, tradeoff và feedback.'],
 ['Q07','Edura','Team size, timeline, prototype/shipped status và scope thật?','','Cần bạn bổ sung','Chưa trả lời','Nêu role cụ thể. Dự án học tập ghi đúng là học tập.'],
 ['Q08','Edura','Excellent là đánh giá của ai, bằng rubric hay feedback nào?','','Cần bạn bổ sung','Chưa trả lời','Gắn nguồn công khai được. Nếu không có, bỏ claim xếp hạng.'],
 ['Q09','Edura','Bạn có kết quả usability/feedback nào có thể dẫn nguồn?','','Cần bạn bổ sung','Chưa trả lời','Số người test, task và thay đổi thật. Không thay business metric bằng số bịa.'],
 ['Q10','Hồ sơ','LinkedIn và PDF CV cập nhật ở đâu?','','Cần bạn bổ sung','Chưa trả lời','Email + CV + LinkedIn đủ cho bản đầu.'],
 ['Q11','Dự án thứ hai','VERIS là emotional healing hay social networking; contribution cá nhân là gì?','','Cần bạn bổ sung','Chưa trả lời','Chốt brief gốc trước khi viết copy.'],
 ['Q12','Asset','Có quyền công khai những màn hình, research và feedback nào?','','Cần bạn bổ sung','Chưa trả lời','Chọn artifact public được. Ghi rõ phần bị giới hạn nếu thực tế có.'],
 ['Q13','Brand','JUE.STUDIO nên giữ như signature hay đổi sang tên cá nhân?','','Cần bạn quyết định','Chưa trả lời','Đề xuất tên cá nhân chính, JUE là signature phụ. Không đổi logo âm thầm.'],
 ['Q14','Case flow','Flow Edura nào thể hiện rõ năng lực Lead UI nhất?','','Cần bạn quyết định','Chưa trả lời','Chọn một flow có prototype và phản hồi thật để spotlight.'],
];

const tests = [
 ['T01','Local build','npm run build','Đạt','Vite 7.3.0, 15,15 s. JS 401,63 KB / gzip 138,59 KB. CSS 21,06 KB / gzip 5,23 KB.','Không đồng nghĩa production field performance tốt.','package.json; dist/'],
 ['T02','Lint repo','npm run lint','Lỗi','488 errors + 26 warnings; vendor và hai lỗi source.','CI chỉ bị chặn nếu cấu hình gate lint.','A09/A10'],
 ['T03','Lint source','eslint src --format json','Lỗi','Hai lỗi react-hooks/refs ở Preloader:13, Work:112.','Work có thể cần xác minh analyzer; không gọi là runtime crash.','support/source-lint.json'],
 ['T04','Live HTTP','GET public URL','Đạt','HTTP 200, text/html, x-vercel-cache HIT.','Không có access build history/runtime server logs của Vercel. Không chứng minh mọi deploy trước đây đều thành công.',live],
 ['T05','Local serve','GET 127.0.0.1:4173','Đạt','Production dist phục vụ HTTP 200 qua vite preview.','Preview chỉ dùng để kiểm, không là production server.','Vite preview'],
 ['T06','Version parity','HTML asset hashes + DOM','Khác nhau','Live index-D264NIrm.js; local index-Ca5rCiJk.js.','Audit gắn môi trường. Working tree có thay đổi chưa commit.','A37'],
 ['T07','Desktop hero','Live 1440×900 + Local 1280×720','Pain point','Tên vai trò multimedia và thiếu CTA case chủ lực.','Ảnh initial live 01 bị crop bị loại; dùng ảnh 17 ổn định.','E01'],
 ['T08','Live anchors','Profile / Work / Contact','Đạt một phần','Hash đổi đúng và tới sections; Work heading bị che bởi nav tại điểm nhảy.','Không nhầm với lỗi Nav GSAP ở bản local.','E02/E03'],
 ['T09','Local nav','Click + Enter vào Work','Lỗi','TypeError undefined.style trong Smoother.offset.','Root cause selector scope Nav đã kiểm bằng source và Node. Reload sạch khi kiểm bản sửa.','A01; local-console.json'],
 ['T10','Live mobile','375×812 hero/contact','Lỗi','Nav fit ở 375, email/icon lệch trái. Hero đọc được.','Viewport mô phỏng, không phải thiết bị iOS thật.','06/07 screenshots'],
 ['T11','Live narrow mobile','320×740 contact','Lỗi','Contact nav vượt phải; email bị cắt bên trái.','Không có horizontal scrollbar không chứng minh không clipping.','E04'],
 ['T12','Local mobile','375×812 hero/contact','Lỗi','Nav Contact x tới397,7; viewport375. Email pill vượt vùng nhìn.','Smoother làm click trong lúc cuộn khó đối chiếu; dùng screenshot ổn định.','E05'],
 ['T13','Local tablet','768×1024','Lỗi','edu-title scrollWidth353/clientWidth189; footer CONNECT gãy từ.','Bằng chứng title là DOM geometry, ảnh E07 là footer.','A07/A08; E07'],
 ['T14','Local short desktop','1280×720 gallery','Lỗi','Fixed pin khung720, heading/progress vượt vùng clip.','E06 chụp lúc đã cuộn gallery; không gọi offscreen card là thiếu asset.','A06; E06'],
 ['T15','Filter keyboard','All / UX/UI Design','Đạt một phần','Enter: All=3 cards, UX/UI Design=1 card.','aria-pressed thiếu. Chưa xác minh đầy đủ touch/filter/pin focus ở mọi breakpoint.','A19'],
 ['T16','Project URLs','DOM href của 3 cases','Lỗi','Edura URL thật; VERIS/VIE href null.','Không click card thiếu URL để giả kết quả.','A04'],
 ['T17','Contact destinations','mailto/tel/social DOM','Đạt một phần','mailto/tel đúng cấu trúc, Facebook có URL, LinkedIn/Website #.','Không gửi email/gọi điện/đăng nội dung.','A05'],
 ['T18','Local console','Load + nav + resize','Lỗi','Welcome target not found; Nav TypeError; warning hero sau lỗi nav.','Warning hero có thể là cascade context sau TypeError.','support/local-console.json'],
 ['T19','Images','File bytes + image dimensions','Lỗi','17.210.780 bytes cho avatar+3 covers; VERIS 8K.','Không dùng kích thước ảnh để suy ra LCP/INP.','A13'],
 ['T20','Metadata','Live HTTP HTML + local index.html','Lỗi','Vite favicon/title, không description/OG/canonical.','Không có dữ liệu ranking/Search Console để kết luận mất SEO traffic.','A35'],
 ['T21','Reduced motion','Đọc branches và CSS','Thiếu bao phủ','Một số components GSAP không kiểm media preference.','Chưa bật OS preference hoặc emulate runtime trong phiên này.','A15/A16'],
 ['T22','Accessibility','DOM semantics + màu','Thiếu bao phủ','H1, filter state, contrast, native link được kiểm.','Chưa có full screen reader/axe/zoom audit. Không chứng nhận WCAG compliance.','A17-A22'],
 ['T23','Behance Edura','Mở URL + skim mở đầu','Đạt truy cập','Trang Edura của Anh Duy, có UI app quản lý học tập; Project Modules 0-118.','Không audit toàn bộ 119 modules, chưa trích toàn bộ research/metrics. Lead UI do bạn xác nhận.',behance],
 ['T24','Clean deploy','npm ci + build từ checkout sạch','Chưa chạy','Working tree hiện tại build được.','Không reset/install/redeploy để giữ nguyên thay đổi có sẵn.','A36'],
 ['T25','Performance lab','Lighthouse/mobile throttle','Chưa chạy','Không có điểm Lighthouse hay LCP/INP/CLS đã đo.','Cần profile sau ưu tiên ảnh và lỗi runtime.','https://web.dev/articles/vitals'],
 ['T26','Cross browser','Safari/iOS/Android thật','Chưa chạy','Kiểm tra hiện tại qua in-app browser và viewport override.','Cần device/cross-browser smoke trước publish bản nâng cấp.','A02/A03/A06'],
 ['T27','User research','Interview/task test người xem','Chưa chạy','Không có dữ liệu người dùng trực tiếp về portfolio.','External sources là benchmark, không là complaint hay frequency về trang của bạn.','I19'],
];

const evidence = [
 ['E01','Hero public desktop','17-live-desktop-hero-stable.jpg','1440×900. Typography mạnh, vai trò multimedia; chưa có CTA case study.'],
 ['E02','Profile public desktop','05-live-mobile-profile.jpg','Ảnh thực tế desktop 1440×900. Software/soft skills chiếm nhiều diện tích.'],
 ['E03','Work public desktop','02-live-desktop-work.jpg','Nhảy Work: heading nằm sau navbar, Edura summary thiếu Lead UI.'],
 ['E04','Contact public 320 px','08-live-320-contact.jpg','Nav Contact và phần đầu email bị cắt.'],
 ['E05','Hero local 375 px','11-local-mobile-hero.jpg','Thêm Journey làm menu tràn; Contact bị cắt.'],
 ['E06','Gallery local 720 px','18-local-gallery-720.jpg','Khung h-screen cắt heading/progress. Covers cho thấy VERIS emotional story và lỗi English.'],
 ['E07','Contact local tablet','15-local-tablet-contact.jpg','768×1024. CONNECT vỡ thành hai phần giữa từ.'],
 ['E08','Edura trên Behance','09-edura-cover.jpg','URL và tác giả đúng. Cover lớp học; UI thật hiện ở module sau.'],
];

assert.equal(new Set(findings.map(x=>x[0])).size, findings.length);
assert.ok(findings.every(x=>x.length===12 && ['P1','P2','P3'].includes(x[1])));
assert.ok(ideas.every(x=>x.length===9));
assert.ok(questions.every(x=>x.length===7));
assert.ok(tests.every(x=>x.length===7));
const wb = Workbook.create();
const ink='#24282E', red='#A83232', paper='#F5F5F0', muted='#606975';
function base(name,title,widths,lastRow){
 const s=wb.worksheets.add(name); s.showGridLines=false;
 const cols=widths.length, end=String.fromCharCode(64+cols);
 s.getRange(`A1:${end}${lastRow}`).format.font={name:'Arial',size:10,color:ink};
 s.getRange(`A1:${end}${lastRow}`).format.verticalAlignment='center';
 widths.forEach((v,i)=>s.getRangeByIndexes(0,i,lastRow,1).format.columnWidth=v);
 s.getRange('A2').values=[[title]]; s.getRange('A2').format.font={name:'Arial',size:16,bold:true,color:ink};
 s.getRange(`A2:${end}2`).format.rowHeight=27;
 s.getRange(`A3:${end}3`).format.borders={bottom:{style:'thin',color:red}};
 return s;
}
function table(s,row,headers,rows,name){
 const end=String.fromCharCode(64+headers.length), last=row+rows.length;
 s.getRange(`A${row}:${end}${last}`).values=[headers,...rows];
 const t=s.tables.add(`A${row}:${end}${last}`,true,name); t.style='TableStyleLight1'; t.showFilterButton=true;
 const body=s.getRange(`A${row+1}:${end}${last}`); body.format.wrapText=true; body.format.verticalAlignment='top'; body.format.rowHeight=94;
 const h=s.getRange(`A${row}:${end}${row}`); h.format.fill=ink; h.format.font={name:'Arial',size:10,bold:true,color:'#FFFFFF'};
 h.format.wrapText=true; h.format.rowHeight=32; h.format.horizontalAlignment='center';
 h.format.borders={insideVertical:{style:'thin',color:'#FFFFFF'}};
 s.freezePanes.freezeRows(row); s.freezePanes.freezeColumns(2);
 return last;
}
function priorities(s,range){
 for(const [label,fill,color] of [['P1','#FBE7E4','#9C2424'],['P2','#FFF2D6','#755315'],['P3','#E9EEF1','#43515C']]) s.getRange(range).conditionalFormats.add('containsText',{text:label,format:{fill,font:{bold:true,color}}});
}
const a=base('Audit','Portfolio audit và kế hoạch nâng cấp',[8,9,15,18,34,35,46,46,42,22,21,48],findings.length+16); a.tabColor=ink;
 a.getRange('A3').values=[['Ngày']]; a.getRange('B3').values=[[new Date('2026-10-02T00:00:00Z')]]; a.getRange('B3').setNumberFormat('dd/mm/yyyy');
 a.getRange('A4').values=[['Mục tiêu']]; a.getRange('B4').values=[['Junior UX/UI hoặc Product Designer, product team. Cinematic, motion có chọn lọc.']]; a.getRange('B4').format.wrapText=false;
 const lastA=12+findings.length;
 a.getRange('A5:F5').values=[['P1',null,'P2',null,'P3',null]];
 a.getRange('B5').formulas=[[`=COUNTIFS(B13:B${lastA},"P1")`]]; a.getRange('D5').formulas=[[`=COUNTIFS(B13:B${lastA},"P2")`]]; a.getRange('F5').formulas=[[`=COUNTIFS(B13:B${lastA},"P3")`]];
 a.getRange('A6:F6').values=[['Tái hiện',null,'Code',null,'Cần test',null]];
 a.getRange('B6').formulas=[[`=COUNTIFS(K13:K${lastA},"Đã tái hiện")`]]; a.getRange('D6').formulas=[[`=COUNTIFS(K13:K${lastA},"Code xác nhận")`]]; a.getRange('F6').formulas=[[`=COUNTIFS(K13:K${lastA},"Cần kiểm tra thêm")`]];
 for(const cell of ['B5','D5','F5','B6','D6','F6']) a.getRange(cell).format.horizontalAlignment='center';
 a.getRange('A5:F5').format.font={name:'Arial',size:11,bold:true,color:red};
 a.getRange('A7').values=[['P1 cần xử lý trước hoặc cùng bản nâng cấp. P2 cải thiện quan trọng. P3 chỉ thêm sau bản chính.']];
 a.getRange('A8').values=[['Thứ tự: sửa runtime/mobile/link/ảnh trước deploy, kể Edura rõ đóng góp Lead UI, rồi polish cinematic.']];
 a.getRange('A9').values=[['Build local đạt, live HTTP 200. Chưa truy cập lịch sử build Vercel, chưa có Lighthouse hoặc user study.']];
 a.getRange('A10').values=[['Lọc Môi trường để phân biệt bản public và working tree. Trạng thái là bằng chứng audit, chưa phải trạng thái đã sửa.']];
 a.getRange('A7:L10').format.font={name:'Arial',size:10,color:muted};
 table(a,12,['ID','Ưu tiên','Loại','Môi trường','Vấn đề','Tác động','Bằng chứng','Giải pháp tối thiểu','Nghiệm thu','Giai đoạn','Xác minh','Nguồn / vị trí'],findings,'PortfolioAudit'); priorities(a,`B13:B${lastA}`);

const i=base('Y tuong','Ý tưởng cho portfolio cinematic hướng product',[8,9,33,58,40,50,52,42,25,18],ideas.length+25); i.tabColor=red;
 i.getRange('A4').values=[['Thiết kế: cinematic product portfolio. Variance 8/10, motion 5/10, density 3/10 là mức đề xuất.']];
 i.getRange('A5').values=[['Giữ React/Vite, Tailwind v3, GSAP và Lucide hiện có. Chưa có lý do thêm framework, CMS hoặc animation library.']];
 const ideaRows=ideas.map(r=>[...r,'Đề xuất']);
 const lastI=table(i,7,['ID','Ưu tiên','Ý tưởng','Thực hiện cụ thể','Giá trị','Cách làm tối thiểu','Giới hạn / điều kiện','Skill tham khảo','Giai đoạn','Trạng thái'],ideaRows,'PortfolioIdeas');
 priorities(i,`B8:B${lastI}`);
 const copyRow=lastI+3;
 i.getRange(`A${copyRow}`).values=[['Copy nháp để phát triển, chưa thay nội dung website']];
 i.getRange(`A${copyRow}`).format.font={name:'Arial',size:12,bold:true,color:ink};
 i.getRange(`A${copyRow+1}:D${copyRow+4}`).values=[
  ['Hero','Trần Vũ Anh Duy','UX/UI Designer','I design clear digital experiences and use motion to explain how they work.'],
  ['Edura','Edura LMS','Lead UI','A learning management app for education centers. UI scope, decisions and evidence cần lấy đúng từ case study.'],
  ['CTA','View Edura','Download CV','Contact'],
  ['Case story','Problem + constraints','My decisions + artifacts','Feedback + changes + reflection']
 ]; i.getRange(`A${copyRow+1}:D${copyRow+4}`).format.wrapText=true; i.getRange(`A${copyRow+1}:D${copyRow+4}`).format.rowHeight=62;

const q=base('Cau hoi','Quyết định đã chốt và câu hỏi còn lại',[8,16,58,58,26,22,58],questions.length+12); q.tabColor='#BE8C45';
 q.getRange('A4').values=[['Cột D lưu câu trả lời. Đối chiếu artifacts trên Behance trước; các ô vàng chỉ hỏi phần chưa rõ khi viết case study.']];
 const lastQ=table(q,6,['ID','Nhánh','Câu hỏi','Câu trả lời','Cần ai cung cấp','Trạng thái','Đề xuất / vì sao cần'],questions,'PortfolioQuestions');
 q.getRange(`D12:D${lastQ}`).format.fill='#FFF2D6';
 q.getRange(`F7:F${lastQ}`).dataValidation={rule:{type:'list',values:['Đã chốt','Chưa trả lời','Đã bổ sung']}};

const t=base('Kiem thu','Kiểm thử đã chạy và giới hạn bằng chứng',[8,25,47,23,58,63,55],tests.length+24); t.tabColor='#566879';
 t.getRange('A4').values=[['Đọc kết quả cùng môi trường, viewport và giới hạn. Không có complaint, conversion rate hoặc field metric đã đo.']];
 const lastT=table(t,6,['ID','Hạng mục','Cách kiểm','Kết quả','Quan sát','Giới hạn','Nguồn / liên quan'],tests,'PortfolioTests');
 t.getRange(`D7:D${lastT}`).conditionalFormats.add('containsText',{text:'Lỗi',format:{fill:'#FBE7E4',font:{bold:true,color:'#9C2424'}}});
 const sr=lastT+3;
 t.getRange(`A${sr}`).values=[['Nguồn tham khảo và cách sử dụng']]; t.getRange(`A${sr}`).format.font={name:'Arial',size:12,bold:true};
 t.getRange(`A${sr+1}:D${sr+7}`).values=[
  ['R01','UX Design Institute, report 2024',hiring,'Benchmark về lựa chọn case studies. Nguồn năm 2024, không dùng để mô tả thị trường tuyển dụng 2026.'],
  ['R02','W3C WCAG 2.2.2',wcag,'Chuẩn pause/stop/hide cho nội dung chuyển động liên tục.'],
  ['R03','GSAP React',gsapReact,'Selector scope và contextSafe để xác định root cause Nav.'],
  ['R04','GSAP matchMedia','https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/','Responsive và reduced-motion, cleanup.'],
  ['R05','Vite static deployment','https://vite.dev/guide/static-deploy.html','Build/output/preview.'],
  ['R06','Web Vitals','https://web.dev/articles/vitals','Ngưỡng mục tiêu. Không phải kết quả đo của portfolio.'],
  ['R07','Edura case study',behance,'Nguồn work thật. Lead UI được người dùng xác nhận, chỉ skim modules mở đầu trong phiên audit.']
 ]; t.getRange(`A${sr+1}:D${sr+7}`).format.wrapText=true; t.getRange(`A${sr+1}:D${sr+7}`).format.rowHeight=65;

const e=base('Bang chung','Ảnh audit trong phiên kiểm tra này',Array(16).fill(11),92); e.freezePanes.unfreeze();
 e.getRange('A4').values=[['Ảnh được chụp từ browser thực tế. E01-E08 liên kết với các findings; filename không quyết định môi trường/viewport.']];
 e.getRange('A1:P92').format.rowHeight=20;
 const sizes=JSON.parse(await fs.readFile(path.join(out,'support/image-sizes.json'),'utf8'));
 for(let n=0;n<evidence.length;n++){
  const [id,title,file,note]=evidence[n];
  const col=n%2===0?0:8, row=6+Math.floor(n/2)*21;
  e.getRangeByIndexes(row,col,1,1).values=[[`${id}. ${title}`]];
  e.getRangeByIndexes(row,col,1,1).format.font={name:'Arial',size:12,bold:true};
  const noteRange=e.getRangeByIndexes(row+1,col,2,7); noteRange.merge(); noteRange.values=[[note]]; noteRange.format.wrapText=true;
  const [w,h]=sizes[file]; const ratio=Math.min(505/w,315/h);
  const bytes=await fs.readFile(path.join(out,'evidence',file));
  e.images.add({dataUrl:`data:image/jpeg;base64,${bytes.toString('base64')}`,anchor:{from:{row:row+3,col},extent:{widthPx:Math.round(w*ratio),heightPx:Math.round(h*ratio)}}});
 }

wb.recalculate();
const expected=findings.filter(r=>r[1]==='P1').length;
assert.equal(a.getRange('B5').values[0][0],expected);
// Check an edit changes the linked counts, then restore the actual record.
const prior=findings[0][1]; a.getRange('B13').values=[['P3']]; wb.recalculate(); assert.equal(a.getRange('B5').values[0][0],expected-1);
a.getRange('B13').values=[[prior]]; wb.recalculate(); assert.equal(a.getRange('B5').values[0][0],expected);
const inspect=await wb.inspect({kind:'table',range:'Audit!A5:F6',include:'values,formulas',tableMaxRows:3,tableMaxCols:6,maxChars:3000});
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:40},maxChars:3000});
await fs.writeFile(path.join(out,'support/workbook-inspection.txt'),inspect.ndjson+'\n'+errors.ndjson);
await fs.mkdir(path.join(out,'support/previews'),{recursive:true});
for(const [sheetName,range,label] of [['Audit','A1:F17','Audit'],['Y tuong','A1:D10','Y tuong'],['Cau hoi','A1:D12','Cau hoi'],['Kiem thu','A1:E10','Kiem thu'],['Bang chung','A1:P26','Bang chung 1'],['Bang chung','A27:P47','Bang chung 2'],['Bang chung','A48:P68','Bang chung 3'],['Bang chung','A69:P90','Bang chung 4']]){
 const preview=await wb.render({sheetName,range,scale:1.5,format:'png'});
 await fs.writeFile(path.join(out,'support/previews',`${label}.png`),new Uint8Array(await preview.arrayBuffer()));
}
const xlsx=await SpreadsheetFile.exportXlsx(wb); await xlsx.save(path.join(out,'Portfolio-Audit-2026-10-02.xlsx'));
await fs.writeFile(path.join(out,'support/audit-data.json'),JSON.stringify({findings,ideas,questions,tests,evidence},null,2));
console.log(JSON.stringify({file:path.join(out,'Portfolio-Audit-2026-10-02.xlsx'),findings:findings.length,ideas:ideas.length,questions:questions.length,tests:tests.length,evidence:evidence.length,p1:expected,counts:a.getRange('A5:F6').values,formulaErrors:errors.ndjson}));
