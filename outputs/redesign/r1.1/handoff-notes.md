# R1.1 — Ghi chú bàn giao content, pose và tương tác

08/10/2026. Đây là storyboard minh họa để kiểm bố cục; chưa chứng minh portal, orbit, particle morph hoặc finale chạy trong ứng dụng. `content.json` giữ text Vi/En từ locale hiện tại và các block EDURA có trạng thái `ready` trong R0.3; `proposedKeys` là namespace đề xuất cho nội dung đã chốt, chưa tồn tại trong locale source.

## Trục nhìn và khoảng cuộn đã chốt

| Đoạn | Ràng buộc từ Q1–Q23 / kế hoạch | Điểm nghỉ để đọc |
|---|---|---|
| Hero idle | PORTFOLIO sáng; 2026 đủ bốn số ở lớp sau lệch xuống/phải, số 6 vẫn thấy; họ tên nhỏ trái dưới. O thứ ba là chữ cuối, index 8 trong PORTFOLIO. Chỉ bụi/refraction gần O, chưa bầu sao hoặc hố đen lớn. | Hero ở progress 0; role và subTagline thật không bị phủ bởi vùng hút. |
| Portal | 1,5–2 viewport; ba nhịp tiến về O → lõi tối nuốt khung → đẩy ra trong khi vẫn nhìn hố đen. Tâm O và tâm portal nối nhau trước khoảng tối; khớp pose sang About trong khoảng tối ngắn. | Dừng giữa bất kỳ nhịp nào phải giữ trạng thái; About chỉ đọc sau khi pose ổn định. |
| About | Hố đen lớn được giữ đến Experience, camera đặt vùng tối sau chữ; chân dung tự do, không kính/panel/halo/planet. Họ tên và một câu mở đầu scramble 0,8–1s; bio/quote thật giữ yên để đọc. | Pose About ổn định; không camera chạy theo thời gian khi người xem dừng. |
| Skills | Ba vùng: tool → sân khấu logo lớn nhất → năng lực; tối đa 2–3 nhánh. Figma/PS/AI/AE/Premiere/Resolve/AI Tools riêng; AI Tools gồm ChatGPT, Claude, Antigravity. | Một tool active; tên tools và năng lực luôn đọc được. Cụm kỹ năng chung/nền tảng nằm dưới, không % thành thạo. |
| Education | Bản đồ ba nhánh bất đối xứng, 1,5–2 viewport desktop; SGU/Circinus, Green/Telescopium, Arena/Pictor. Thời gian chồng nhau, không ba bước đào tạo loại trừ nhau. | Tên trường, ngành, niên khóa luôn hiện; chỉ một chòm active. Không kéo dài cuộn để che việc thiếu frame. |
| Experience → Works | Một meteor theo đường cong ghé HOSANA MEDIA → UPWORK → DESIGNVELOPER, rồi bẻ vào chiều sâu; camera theo meteor làm hố đen rời khung. Các công việc có thời gian chồng nhau. | Nội dung từng mốc đọc được ngay cả khi không active; cuối mốc có frame nối hướng nhìn sang Works. |
| Works | Centaurus/EDURA, Gemini/VERIS, Cygnus/VIE cùng hiện; orientation hình sao đủ ổn định. Preview ảnh nguyên màu/tên/lĩnh vực ở vùng cố định; chọn làm cả hệ chậm/dừng êm. | Works idle/selected là đoạn xem dự án riêng, không chiếm scroll của finale. |
| Finale | Riêng 2–2,5 viewport: rút text/preview → co/tăng tốc → nén/va chạm → tinh vân có vùng tối → hố đen/Contact. Nhịp nén dài 8–12% tổng quãng finale, nằm trong pha va chạm. Một tâm collision chính là tâm hình thành BH. | Có thể dừng hoặc đổi hướng tại mọi pha, nhất là ngay lúc nén/nổ; Contact chỉ xuất hiện khi bố cục ổn định. |
| Contact | BH lệch một bên, email thật ở khoảng tối bên còn lại; copy và mail là hai hành động chính. Không terminal/equalizer/thông số giả. | Email giải mã một lần rồi giữ yên; Footer cùng nền không thêm cao trào. |
| EDURA reader | `/projects/edura` mới là route dự kiến, chưa triển khai. Khung editorial mono, ảnh sản phẩm nguyên màu; Canvas nặng nghỉ. | Đọc nội dung bình thường; Back/Trở lại dự án trả Works+selection+focus, URL trực tiếp có fallback `/#work`. |

## Mobile 390 và reflow 320

- Giữ đủ chữ PORTFOLIO và bốn số 2026; giảm cỡ/chỉnh chồng lớp trước khi cắt; O cuối vẫn là cổng bên phải. Tên được phép xuống dòng, không đẩy ra ngoài frame. Nội dung chính không thu nhỏ thành caption.
- Skills xếp dọc danh sách → sân khấu → năng lực; tool là target ít nhất 44px. Chạm tool để chọn, chạm lại hoặc nền để bỏ chọn. AI giữ đủ ba logo và tên nhận diện, không thay Antigravity bằng Gemini.
- Education giữ ba nhánh ở các cao độ khác nhau; tên trường/niên khóa/ngành không bị sao hoặc đường nối phủ. Touch chọn một mốc, chạm nền bỏ chọn.
- Works chạm chỉ chọn preview; EDURA có nút hành động riêng mở reader. VERIS/VIE chỉ preview và nhãn sắp ra mắt, không href/nút giả. Tên/control nằm cố định, không chạy theo chòm.
- Chân dung chạm trả màu, chạm lần nữa grayscale. Desktop hover/focus tương đương; Escape bỏ chọn tại vùng phù hợp.
- Contact email có thể ngắt tại ranh giới hợp lý hoặc giảm cỡ để giữ toàn bộ địa chỉ; nội dung chữ giữ địa chỉ thật. Hai nút copy/mail tách nhau ≥8px và target ≥44px, không đè safe-area.
- EDURA ảnh `contain`, giữ đủ khung/màu; 16px DOM body tại mobile để tóm tắt nguồn. Baked-in text của slide 1400×989 không được coi đọc rõ tại 390/320. Không tạo ảnh flow mới để lấp dữ liệu thiếu.

## Reduced-motion và WebGL fallback

Mỗi section dùng pose tĩnh tương ứng điểm nghỉ: Hero typography+O nhỏ; About chân dung/bio/BH nền; Skills chọn logo tĩnh và năng lực; Education hình sao tĩnh khi chọn; Experience đủ ba mốc; Works ba hình sao/preview tĩnh; Contact BH/email tĩnh; reader DOM. Bỏ zoom/hút/phóng camera, glitch 6→7, orbit, meteor bay, explosion và lens động. Chọn/bỏ chọn vẫn có phản hồi tức thì, không chờ animation. WebGL lỗi vẫn có toàn bộ DOM, CTA, trường học, năng lực và dự án.

## R2 cần chứng minh bằng prototype thật

1. **Một persistent Canvas / một CameraRig / một progress theo mốc DOM.** App/lab mỗi chế độ chỉ một producer; manual scrub đồng bộ scroll hoặc tạm dừng producer. Pose/camera/target, sao/khí/glow/chữ dùng cùng progress, không damping delta riêng gây sai reverse.
2. **Mini O dùng pipeline HDR hiện có.** BH hiện full-screen NDC; scale mesh không tạo mini O. Cần composite/mask output HDR vào chữ O rồi mở toàn khung; không ray-tracer/Canvas thứ hai. Neo O bằng layout thật ở 1440/390/320, resize và locale.
3. **Portal nối pose trong vùng tối.** Observer shader luôn ngoài chân trời; thử progress 0/0,25/0,5/0,75/1 tới/lùi, dừng/đổi hướng/jump, không NaN hoặc teleport. Storyboard chỉ chỉ ra hướng nhìn/vùng đọc; khoảng cách world units phải do lab xác minh.
4. **Orbit idle → finale chốt pha một lần.** Giữ cùng pha qua đảo chiều trong lượt; chỉ về hoàn toàn Works mới tiếp tục idle. Deep-link Contact dùng seed/pha mặc định xác định. Camera/chữ/nebula/BH không teleport; explosion không random/reseed khi đảo.
5. **Chòm sao đúng R0.2.** Dùng Stellarium Modern duy nhất cho edge convention; HIP ICRS epoch J1991.25. Không trộn cạnh IAU chart khác hoặc xoay/lật riêng trục. IAU không quy định một stick figure duy nhất. Telescopium chỉ 2 sao/1 cạnh, Circinus/Pictor chỉ 3 sao/2 cạnh; supporting stars không biến thành node/cạnh bịa.
6. **Sao sáng trước liên kết, không kéo cả StarField vào logo.** Pool biểu diễn có vị trí gốc/đích ổn định; nền xa vẫn mật độ góc đều. Prototype chuyển nhanh tool/focus/touch, hoàn nguyên và offscreen cleanup.
7. **Scheduling và GPU.** Ambient meteor chỉ sau portal, tạm nhường portal/meteor dẫn chuyện/finale; trail rút mượt. Pause hidden/offscreen, static reduced không mặc nhiên nghĩa GPU đã dừng. Đo đoạn nặng có GPU/browser/DPR/quality; mục tiêu desktop >120fps high-refresh, điện thoại thật 50–60. Frame SVG/HTML không có số FPS hiệu ứng.

## Giới hạn content phải giữ khi dựng frame

- Role Creative Designer, bio, trường học, thời gian và công ty lấy locale thật, không nâng mức. Bảy mục tools/mapping là nội dung kế hoạch đã duyệt; key mới đề xuất rõ trong JSON.
- About câu mở đầu là câu đầu của `about.bioFirst`, đã nằm trong đoạn bio nguyên văn; scramble câu này và `hero.name`, không lặp thêm tagline. Hai bio và quote giữ nguyên.
- EDURA chỉ `ready` blocks: overview/Lead UI scope/problem/ba phạm vi quyết định/artifact/deliverables. Root storyboard có thể chọn một vài block; không dùng metadata gap làm public placeholder.
- EDURA Excellent chỉ có lời tác giả và thuộc Arena UX/UI jury, chưa rubric; không hiển thị badge độc lập hoặc legacy “Excellent về đổi mới UX”. Reader frame này không dùng optional evaluation.
- Không lấy APMS làm EDURA, không biến OnCourse thành khảo sát EDURA, không tạo outcome hoặc lời reflection. Video/flow/system sâu/test còn thiếu ở R0.3; không tuyên bố reader hoàn chỉnh.
- VERIS title/category/ảnh vẫn dùng dữ liệu thật; description dài loại khỏi storyboard vì cover/copy mismatch đã ghi R0.1. Không tự diễn giải hiệu quả chữa lành.
- Cutout R0.2 là ảnh đã chỉnh bằng imagegen, không bảo đảm texture pixel-identical; dùng bản web đã kiểm alpha, giữ original tại R0.2 và không sửa lại trong R1.1.

Không sửa App/scene/source/public/dependency ở R1.1. Các ràng buộc này bàn giao R2, không tự triển khai R2 hoặc mở lại Q1–Q23.

## Frame/pose bàn giao R2

Mở `storyboard.html` và bật Guide để xem neo O/target/collision cùng biên vùng đọc. `frame-manifest.json` ghi camera/target cho từng frame; `measured-anchors.json` ghi neo O và bbox năm đo trong Browser. Tọa độ scene trong manifest là ứng viên để dựng lab, chưa phải quỹ đạo production đã ray-project. Các tọa độ dưới đây là **pixel của frame**, không world units:

| Đoạn | Desktop 1440 | Mobile 390 / reflow 320 |
|---|---|---|
| Hero | PORTFOLIO x56..1384; tên trái x56. O cuối khoảng (1295,308), neo bằng glyph index8. Năm đầy đủ x450..1382, nằm sau và dưới. | PORTFOLIO chừa20px hai bên. O cuối x≈347/281, y≈225. Năm x67..370/300, cả bốn số; không crop để làm reflow. |
| Portal | Nhịp đầu tăng gần O nhưng vẫn giữ bốn số năm; lõi tối mở từ điểm hút bên phải; exit BH tại (1123,333). | Điểm hút phải; exit BH tại (304,312)/(250,312). Cần lấy anchor DOM thật thay số gần đúng này. |
| About | BH nền (1267,246); portrait tự do bên trái. Copy x620..1170, y288..900 trên vùng tối fade mềm. | Tên/role → portrait lớn y315 → bio x20..w−20; crop alpha trống, không panel. Hai bio/quote full section để đọc. |
| Skills | Tools x64..322 / logo khoảngx600..950 / năng lực x1050..1360. BH dịu góc phải trên. | Tools hai cột, transparent hit areas48px; sân khấu phía dưới; năng lực rồi cụm chung/nền tảng. AI vẫn có đủ ba logo+tên. |
| Education | Circinus (340,470), Telescopium (1070,730), Pictor (580,1150), hình cùng uniform projection. Section1575px. | Ba nhánh ở cao độ380/755/1150, lệch trái/phải/trái; chữ trường/ngành/niên khóa luôn hiện. Section1477px. |
| Experience | Một đầu meteor cuối (1332,760), quay vào chiều sâu; BH rời trái. | Đường cong dùng width thực; đầu cuối x=w−40,y935. Ba công ty, vai trò, period và description giữ nguyên. |
| Works / finale0 | Cùng tâm/scale hình sao: Cen(320,385), Gem(753,302), Cyg(1130,468). Preview x64,y654; metadata x460. | Cen(100,310), Gem(0.72w,477), Cyg(120,650). Preview cố định x20,y795; nút EDURA tách khỏi chọn. |
| Finale / Contact | Tâm collision = BH (1138,390), normalized (0.79,0.433). Email nằm trái; không chuyển sang camera pose khác ở endpoint. | Tâm collision = BH (195,235)/(160,235), normalized (0.5,0.278). Email ở vùng tối phía dưới, chia tại @. |
| Reader | Cột body820px, ảnh rộng1280px; chỉ ready copy/A02/A07/A09. | Body16px, ảnh contain; caption DOM. Back và Behance riêng; Canvas nghỉ. |

Mốc đọc: Hero idle; About sau portal ổn định; Skills/Education mỗi selection giữ yên; nội dung Experience không phải chờ meteor mới đọc; Works có đoạn xem riêng; Contact sau finale ổn định. Reduced-motion dùng chính bố cục của các endpoint, bỏ các frame trung gian và bỏ mọi chuyển động theo thời gian; bảng `reduced` là ghi chú pose, không minh họa một trang mới.

Kiểm frame đã pass: 150 render/0 console error/0 chữ bị cắt/0px overflow; HIP/edge/position đúng source. Works→finale0 cùng geometry; finale100→Contact cùng silhouette/tâm. Hero glitch giữ nguyên ba glyph202, thay riêng slot6; O thứ ba chính xác. **Không chuyển các kết quả này thành tuyên bố reverse, motion hay FPS pass.** R2 phải thực hiện các kiểm tra prototype ở mục trên trước tích hợp.
