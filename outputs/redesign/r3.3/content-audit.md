# R3.3 — Audit copy / semantic / bàn giao R4

Ngày đối chiếu: 08/10/2026. Phạm vi của audit: đọc source và tài liệu; không sửa `src`, `public`, locale hoặc `AGENTS.md`. Đây là input triển khai, không phải bằng chứng Browser hoặc chứng nhận giao diện mới đã pass.

## Nguồn và copy đã chốt

Nguồn quyết định About là kế hoạch mục 4, 12–13 và `outputs/redesign/r1.1/handoff-notes.md:47`. R0.3 là **EDURA content pack**, không bổ sung hoặc thay thế bio About.

R1.1 ghi rõ: “About câu mở đầu là câu đầu của `about.bioFirst`, đã nằm trong đoạn bio nguyên văn; scramble câu này và `hero.name`, không lặp thêm tagline. Hai bio và quote giữ nguyên.”

| Nội dung | Vi | En | Cách dùng |
|---|---|---|---|
| Họ tên | TRẦN VŨ ANH DUY | TRAN VU ANH DUY | `hero.name`; `about.heading` hiện chia `TRẦN VŨ / ANH DUY` chỉ là cách xuống dòng cũ. H2 mới vẫn đọc họ tên đầy đủ. |
| Vai trò | Creative Designer — UX/UI & Motion | Creative Designer — UX/UI & Motion | `about.subLabel`, giữ nguyên. |
| Câu mở đầu | Thiết kế không chỉ là hình ảnh — nó là cách giải quyết vấn đề. | Design is not just about visuals — it's about solving problems. | Là câu đầu của `about.bioFirst`; giải mã 0,8–1s rồi giữ yên. Không thêm một copy lặp lại bên trên. |
| Bio thứ nhất còn lại | Tôi xây dựng những hành trình người dùng liền mạch, nơi logic UX hòa vào thẩm mỹ UI để tạo ra giá trị kinh doanh thực tế. | I craft seamless user journeys where UX logic meets UI aesthetics to deliver tangible business value. | Nằm cùng paragraph với câu đầu; không scramble phần này. |
| Bio thứ hai | Từ bản phác thảo đầu tiên đến sản phẩm sống trong tay người dùng, tôi đi theo một nguyên tắc: mỗi pixel phải có lý do tồn tại. Nền tảng multimedia cho tôi góc nhìn điện ảnh — và tôi mang góc nhìn đó vào từng màn hình tôi thiết kế. | From the first sketch to the product living in people's hands, I follow one rule: every pixel must earn its place. My multimedia background gives me a cinematic eye — and I bring that eye to every screen I design. | Giữ toàn bộ `about.bioSecond`, chữ thật trong DOM. |
| Quote | Tôi thiết kế những vũ trụ nhỏ — nơi mỗi cú chạm đều có ý nghĩa. | I design small universes — where every touch means something. | `about.quote`, blockquote, không giải mã. |

Cách nhỏ nhất để giữ nguyên copy: tách câu đầu thành span trong paragraph `bioFirst`, dùng bản chữ nguyên văn làm accessible text, chỉ span trình diễn bị scramble. Không cần tạo nội dung mở đầu mới hoặc đổi bio. Không dùng `aria-live` cho mỗi ký tự giải mã. Họ tên có semantic H2 / accessible name ổn định; screen reader không đọc chuỗi ngẫu nhiên. Nếu thêm key UI tương tác ảnh, thêm Vi/En đồng thời; không sửa các key tool/năng lực chỉ vì About ngừng render chúng.

## Chân dung và tương tác

Asset đúng là `outputs/redesign/r0.2/portrait/avatar-cutout-color.webp`, manifest id `avatar-cutout`, role `web`: 800×1000, 66.084 byte, alpha `srgba`, SHA-256 `6b2fea6dcbd2bd204fc0aa6c545cbe7a696670fc4532c992378c3393d53b511f`.

Không dùng lại `/avatar.webp` có vòng/trang trí ghép sẵn. Ảnh mới giữ tư thế, mặt, quần áo và chiếc ghế gốc; ghế không phải panel UI. R0.2 đã chỉnh bằng imagegen, không có bảo đảm texture pixel-identical. Giữ original và asset R0.2 nguyên vẹn.

Tương tác phù hợp là nút native có target ≥44px, không thêm border/background/caption bar để giả frame. Mặc định grayscale, pointer hover hoặc focus trả màu; touch/native Enter/Space đổi trạng thái màu và `aria-pressed` phản ánh phần chọn được giữ. Chỉ một trạng thái chọn cục bộ cần React state, không đưa vào store scene. Label i18n nói rõ thao tác trả màu và trạng thái; alt giữ `about.avatarAlt`. Focus ring rõ quanh hit target nhưng không di chuyển layout. Kiểm blur/pointer-leave và touch tap lại trở grayscale; reduced-motion vẫn cho phép đổi màu ngay, không chạy chuyển động giải mã/parallax/clip.

Giữ width/height 800×1000 và tỉ lệ 4:5; không kéo overscan h120% hoặc clip inset cũ làm mất đầu/tay/chân. Alpha cần kiểm decode thật trên nền #050505, không chỉ có manifest hoặc CSS transparent. Không thêm drop-shadow/glow/halo thay vòng cũ.

## DOM / progress / camera

Theo handoff R3.2, giữ `#about` và wrapper `[data-story-chapter="about"]` trong App. Parent `[data-story-content]` do App điều khiển opacity/visibility/inert/aria-hidden; About không thêm gate cha hoặc gap cuộn cạnh tranh. Deep link #about và Nav/Menu đi thẳng pose About, không ép chạy portal.

Camera writer duy nhất là `CameraRig` priority −1. Baseline R3.2 có observer `[2,3,-169]`, target nền `[-12,0,-200]`. Trong R3.3, Agent tích hợp đã chỉnh **chỉ constant ABOUT dùng chung** thành observer `[2,5,-154]`, target nền `[-36,-16,-200]` để đẩy hố đen lên/phải và nhường vùng đọc. `storyCameraPath('about', p, out, reduced, aspect)` vẫn đứng yên trong About; lookX nhân bias `min(1, .54*max(1,aspect))`, target thực phải lấy hàm chung. Portal p=1, Skills p=0 và Contact/finale cùng dùng endpoint ABOUT này; checker xác minh endpoint liên tục. Không dùng world units Contact/Works minh họa -420 của storyboard làm pose thực. Không thêm section camera timeline hoặc observer vào About.

Storyboard: desktop portrait trái, copy giữa/phải, BH góc phải trên; vùng đọc fade mềm, không panel kính. Mobile tên/role → portrait → bio. Framing phải kiểm render thực ở 320/390/768/1440; hàm camera giữ đúng ownership không tự chứng minh chữ đủ tương phản. Nếu cần chỉnh framing, Agent tích hợp chỉnh contract camera dùng chung và kiểm portal endpoint liên tục.

`useSectionAnchor` là hook đặt model trang trí vào cửa sổ DOM. Audit hiện không tìm caller About/Planet/anchor mới trong App; R3.1 đã gỡ set piece. Không thêm lại anchor chỉ để dùng hook còn tồn tại. About chỉ import/render một lần qua `src/App.jsx`.

GSAP trong useGSAP có scope/revertOnUpdate theo locale/reduced, callbacks tạo tween về sau phải contextSafe. Họ tên/câu đầu giải mã một lần khi vào đúng vùng nhìn; các paragraph giữ nội dung thật, không chờ một chuỗi animation dài mới đọc được. Hidden/offscreen dừng tác vụ không cần thiết; sống lại reduced hoặc locale không để ký tự ngẫu nhiên/focus mất. Bỏ revealHeadings cũ trên H2 nếu writer scramble mới đã sở hữu cùng node.

Trong kiểm Browser R3.3, chuyển reduced-motion trực tiếp từ About đã phát hiện Smoother media cleanup đưa native scroll về 0, khiến parent inert và focus rơi về body khi đổi locale. Đây là lỗi lifecycle hạ tầng có sẵn được task này làm lộ. Agent tích hợp sửa tại producer chung `useScrollProgress`: GSAP `matchMediaInit` giữ chapter/p, guard không publish trong media teardown, event `matchMedia` cuối đo lại range và seek về chapter đã giữ. Không sửa Smoother/App/store hoặc thêm producer. Ba vòng reduced on/off + locale + resize đã pass sau sửa; trace thất bại trước sửa giữ riêng để không nhầm với pass cuối.

## Dữ liệu bỏ khỏi About nhưng phải giữ cho R4

Caller hiện tại:

- `src/components/About.jsx` render `PORTFOLIO_DATA.tools` và `PORTFOLIO_DATA.skills`; ngừng import/render hai nhóm này trong R3.3.
- `src/data/skills.js` vẫn lấy `PORTFOLIO_DATA.tools` để dựng `orbitalSkills`; `src/components/sections/Skills.jsx` vẫn dùng danh sách này và locale `skills.*`. Không xóa/đổi ID/index tool trong R3.3.
- `about.tools.*`, `about.coreSkills`, `about.toolsLabel`, `about.skillsLabel` sẽ không còn caller About sau cleanup nhưng vẫn là nội dung chuyên môn đã có; giữ key/data cho R4 migration. `skills.competencies` hiện đã chứa cùng tám năng lực, `skills.technical` giữ mức nền tảng/đang học.

| Nhóm | Dữ liệu hiện tại phải giữ | R4 đã chốt |
|---|---|---|
| Tools | figma, photoshop, illustrator, afterEffects, videoEditing, generativeAi trong `PORTFOLIO_DATA.tools` | Sáu phần mềm riêng + một nhóm AI. `videoEditing` hiện gộp Premiere/Resolve; R4 mới tách, asset `pr.png` cũ thực tế là Resolve. |
| Core | Design Thinking, AI-Assisted Design, Motion Graphics, Project Management, Time Management, Adaptability, Teamwork, Attention to Detail | Mapping trực tiếp 2–3 nhánh/tool, cụm năng lực chung bên dưới; không tự thêm proficiency hoặc số %. |
| Technical | HTML/CSS/JS cơ bản; React (đang học); Prototyping (Figma); Wireframing | Giữ mức xác nhận này, không nâng lên chuyên gia. |
| AI | AI Tools (Generative) / Generative AI Tools | Một nhóm ChatGPT + Claude + Google Antigravity, không Gemini. Logo chính thức R0.2; không tự vẽ trademark. |

Mapping kế hoạch mục 5: Figma→Wireframing/Prototyping/Design Thinking; Photoshop→Xử lý ảnh/Compositing; Illustrator→Thiết kế vector/Branding–Packaging; After Effects→Motion Graphics/VFX; Premiere→Dựng phim; DaVinci Resolve→Dựng phim; AI Tools→AI-Assisted Design. Không tự bổ sung color grading. R3.3 không triển khai logo sao, nhóm AI hoặc layout Skills mới.

## Những bằng chứng Agent tích hợp còn phải thu

Build/scoped lint; Browser 320/390/768/1440 × Vi/En × normal/reduced; hover/native keyboard/touch color toggle; alt/name/aria-pressed/focus ring; decode/alpha trên #050505; bio hai paragraph + quote đúng nguyên văn, accessible name không scramble; không panel/caption/planet/tools trong About; portal reverse/direct #about vẫn khớp camera; không overflow/layout shift hoặc lỗi console/WebGL mới. Phân biệt Browser viewport giả lập với thiết bị mobile thật và tài liệu audit với hiệu ứng đã chạy.
