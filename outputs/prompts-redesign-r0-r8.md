# 🤖 BỘ PROMPT CHO AI AGENTS — REDESIGN R0–R8

Dự án: **Stellar Odyssey · Portfolio Trần Vũ Anh Duy**. Ngày soạn: **07/10/2026**.

**24 prompt giao việc, chưa được thực thi.** Nguồn thiết kế duy nhất cho đợt này: [kế hoạch đã chốt Q1–Q23](../docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md). Giữ cấu trúc giao việc của `prompts-phase-1.md`, `prompts-phase-2-3.md`, `prompts-phase-4-5.md`, `prompts-phase-4b.md`; không kế thừa quyết định thị giác đã bị thay thế trong các file đó.

## Cách dùng

1. Bắt đầu bằng **R0.1**. Copy nguyên khối `markdown` của một task vào Agent; mỗi khối chỉ cho phép thực hiện task đó và yêu cầu đọc quy ước chung trong file này.
2. Chỉ chuyển task sau khi đã đọc bàn giao/bằng chứng của các task phụ thuộc. R0.2 và R0.3 có thể chạy song song sau R0.1 vì khác thư mục đầu ra; phần append `AGENTS.md` phải được Agent tích hợp ghi tuần tự sau khi nhận bàn giao, tránh hai Agent cùng ghi. Các task sửa App, scene, camera, store hoặc locale nên chạy tuần tự theo bảng.
3. Vai trò trong bảng là gợi ý chuyên môn; dùng Codex/OpenCode/Antigravity/Claude theo cấu hình đang có, không tự đổi model hay mở chat mới. Agent tích hợp sở hữu các file chung; không để hai Agent đồng thời ghi cùng file.
4. Mỗi prompt là lệnh thực hiện trong một phiên triển khai tương lai. Mục 17 của kế hoạch mô tả ranh giới phiên lập kế hoạch trước đó; không cấm thực hiện task được người dùng giao bằng một prompt dưới đây. Không tự chạy các prompt còn lại, deploy, gửi tin hoặc xuất bản.

## Quy ước chung bắt buộc

**Ngữ cảnh và phạm vi**

- Workspace `D:/Projects/my-portfolio-2026`. Đọc `AGENTS.md` mới nhất, kế hoạch mới và file liên quan trước khi sửa. Kiểm tra working tree, giữ thay đổi có sẵn; không reset/checkout đè hoặc sửa dòng tiến độ cũ. Baseline/hash cũ chỉ là tham khảo, không chứng minh trạng thái hiện tại.
- Khi hướng cũ xung đột, quyết định Q1–Q23 trong kế hoạch mới được ưu tiên: dark cố định `#050505`, trắng/xám/đen cho UI/scene. Ngoại lệ: chân dung trả màu khi tương tác và ảnh sản phẩm nguyên màu. Không cyan/amber, cockpit/HUD mới, kính/card About, planet About, orbital Skills cũ, reticle, radio terminal/equalizer. Không phục hồi Playground/marquee.
- Giữ **lens bóp méo heading/ảnh** và **sao băng ngẫu nhiên**. Lens chỉ desktop fine pointer, không đổi hit target/focus; tắt khi reduced-motion. Meteor nền chỉ sau portal, nhường sân khấu lúc portal/meteor dẫn chuyện/finale; khởi điểm nhịp cũ 2–3 vệt mỗi 4–7 giây, không tăng thành nhiễu.
- Hố đen lớn hiện sau portal, còn đến Experience; camera đặt vùng tối sau nội dung, sau đó theo meteor rời hố đen vào Works. Giữ lõi đen/glow bám đĩa và chất NASA-inspired; không tuyên bố trùng NASA 100%.

**Cách triển khai**

- Ponytail full: đọc và tái dùng trước; diff nhỏ nhất đủ yêu cầu. React functional JSX, alias `@/`, Tailwind 4; không inline styles. Text UI/alt/caption qua i18n Vi/En, state chung qua Zustand. Không thêm framework/router/thư viện hiệu ứng khi native hoặc dependency hiện có giải quyết được.
- GSAP trong `useGSAP` hoặc wrapper hiện có, cleanup và live reduced-motion. DOM animation chỉ transform/opacity; shader xử lý biến dạng không gian. 3D nằm trong `src/3d/`; chuyển động độc lập dùng `useFrame` delta, không setInterval hoặc cấp phát object/array mỗi frame.
- **Một persistent Canvas, một CameraRig sở hữu pose, một progress câu chuyện.** Mỗi chế độ chỉ một nguồn ghi progress; manual scrub phải đồng bộ scroll hoặc tạm dừng nguồn ghi scroll. Lab và App dùng chung scene/render logic; không copy engine. Story progress theo mốc DOM/đoạn cuộn, không gắn cứng phần trăm tổng trang. Shader/scene không import section DOM.
- Camera, sao, khí, glow và chữ trong chuyển cảnh dùng trực tiếp cùng progress, hoặc cùng một progress đã lọc. Không giữ damping theo delta riêng cho camera khiến cùng progress tới/lùi ra pose khác. Parallax con trỏ nếu giữ phải về 0 ở đoạn cần so trạng thái story.
- Story portal/meteor/finale xác định theo progress; không physics/random tích lũy thời gian. Ambient orbit/meteor dùng thời gian có kiểm soát, pause hidden/offscreen. Handoff orbit→finale chốt pha một lần, giữ qua mọi lần đảo chiều của cùng lượt; deep link chưa qua Works dùng pha mặc định xác định.
- Keyboard/focus tương đương hover, Escape bỏ chọn; touch chọn riêng, nút hành động riêng. Target ≥44px, safe-area, không overflow từ 320px. Reduced-motion giữ mọi thông tin/CTA trong cảnh tĩnh, bỏ zoom/orbit/meteor/glitch/explosion/lens động. WebGL fallback giữ DOM đầy đủ.

**Skills và công cụ**

- Mỗi task chỉ đọc các `SKILL.md` được liệt kê cho task đó. Dùng catalog nếu có; nếu không, tìm đúng file ở bảng dưới. Khi dùng skill, báo tên skill trong commentary. Không đọc/thực hiện toàn bộ prompt khác vì đang đọc file này.
- Với `prototype`, chỉ áp dụng phương pháp kiểm chứng giả thuyết/state trong lab sẵn có. Yêu cầu cụ thể của bộ prompt này: không tự tạo app, nhiều UI variant, branch, commit hoặc issue; giữ component shared đã chứng minh, chỉ dọn harness thử nghiệm khi tích hợp. Không kéo workflow ngoài phạm vi từ skill vào task.
- Browser dùng kiểm chứng render/interaction thật khi có công cụ hoạt động. Nếu Browser, image generation hoặc thiết bị thật không khả dụng, lưu hạn chế và kiểm tra phần còn làm được; không giả screenshot/FPS/pass. Không cài plugin hay dependency chỉ để hoàn thành checklist.
- `clean-code` chưa tìm thấy trong lần đối chiếu local này; không coi là skill đã cài. Quy tắc AGENTS/Ponytail áp dụng cho code. Review cuối đối chiếu snapshot baseline và working tree, gồm cả file chưa commit; không yêu cầu setup issue tracker hoặc commit ngoài phạm vi.

| Skill đã đối chiếu local | SKILL.md |
|---|---|
| react-3d-ui | `C:/Users/PC/.codex/skills/react-3d-ui/SKILL.md` |
| threejs-fundamentals | `C:/Users/PC/.codex/skills/threejs-fundamentals/SKILL.md` |
| threejs-shaders | `C:/Users/PC/.codex/skills/threejs-shaders/SKILL.md` |
| gsap-scrolltrigger | `C:/Users/PC/.agents/skills/gsap-scrolltrigger/SKILL.md` |
| gsap-performance | `C:/Users/PC/.agents/skills/gsap-performance/SKILL.md` |
| gsap-react | `C:/Users/PC/.agents/skills/gsap-react/SKILL.md` |
| frontend-design | `C:/Users/PC/.agents/skills/frontend-design/SKILL.md` |
| ui-ux-pro-max | `C:/Users/PC/.agents/skills/ui-ux-pro-max/SKILL.md` |
| prototype | `C:/Users/PC/.agents/skills/prototype/SKILL.md` |
| accessibility | `C:/Users/PC/.agents/skills/accessibility/SKILL.md` |
| imagegen | `C:/Users/PC/.codex/skills/.system/imagegen/SKILL.md` |

**Nghiệm thu và bàn giao**

- R0/R1: chứng minh asset/nội dung/storyboard, không dùng build pass để kết luận đã có hiệu ứng. Task sửa ứng dụng: `npm run build`, lint phần sửa và Browser kiểm tra đúng phạm vi. Ghi riêng lỗi/warning nền; yêu cầu 0 console/runtime/WebGL error mới trong phiên kiểm chứng sạch.
- Hai chuyển cảnh có frame progress `0 / 0.25 / 0.5 / 0.75 / 1` tới/lùi, cuộn nhanh, dừng giữa pha, đảo ngay khi nén/nổ, resize và jump trực tiếp. So trạng thái câu chuyện tại cùng progress, không so ambient random như thể deterministic.
- Theo mức liên quan: 320/390/768/1024/1440/1920px, portrait/landscape, Vi/En, keyboard/touch, reduced-motion bật/tắt, hidden/visible và ít nhất 3 vòng lifecycle. Không gắn một bộ test khổng lồ vào từng thay đổi nhỏ; tổng hợp ma trận đầy đủ ở R8.
- FPS mục tiêu desktop >120 trên cấu hình high-refresh tham chiếu, mobile 50–60 trên thiết bị thật phù hợp. Ghi GPU/browser/viewport/DPR/quality/cách đo; màn hình 60Hz hoặc viewport giả lập không chứng minh điện thoại thật đạt mục tiêu. Prototype đo đoạn nặng sớm; không đợi cuối mới đo.
- Lưu `outputs/redesign/<task-id>/verification.md` với thay đổi, lệnh/kết quả, ảnh/trace/số đo, giới hạn, file bàn giao và trạng thái phụ thuộc. Task có logic mới để lại một kiểm tra chạy được nhỏ nhất có ý nghĩa, ưu tiên công cụ kiểm tra đã có; không dựng test framework mới.
- Append đúng một dòng task vào mục Tiến độ `AGENTS.md`, không sửa/xóa dòng cũ. Chỉ ghi ✅ Xong khi DoD đủ bằng chứng; phần chưa kiểm chứng ghi rõ. Cuối phiên nêu task nào đã xong, artifact chính và task kế tiếp; không tự triển khai task kế tiếp.

## Bảng task và thứ tự chạy

R0.2 và R0.3 là nhánh song song duy nhất được đề xuất mặc định. Phần còn lại đi từ trên xuống để tránh xung đột scene/locale/camera. Các dependency dưới đây gồm cả thứ tự bàn giao file chung.

| ID | Nhiệm vụ | Vai trò gợi ý | Chờ task |
|---|---|---|---|
| R0.1 | Baseline, kiểm kê giữ/bỏ, ownership | Integration Engineer | — |
| R0.2 | Chân dung, logo mono, dữ liệu sáu chòm sao | Asset / Technical Artist | R0.1 |
| R0.3 | EDURA source và content pack | Content / UX Editor | R0.1 |
| R1.1 | Storyboard desktop/mobile | Creative Director | R0.2, R0.3 |
| R2.1 | Progress/pose/camera chung trong lab | Motion Architect | R1.1 |
| R2.2 | Prototype portal O → hố đen lớn | Creative Technologist | R2.1 |
| R2.3 | Prototype Works orbit và chốt pha | Creative Technologist | R2.2 |
| R2.4 | Prototype finale đảo chiều năm pha | Shader / Motion Engineer | R2.3 |
| R3.1 | Dark cố định và gỡ HUD/legacy | Frontend Engineer | R2.4 |
| R3.2 | Hero và tích hợp portal production | Motion / Frontend Engineer | R3.1 |
| R3.3 | About: con người và vùng đọc | Frontend Designer | R3.2 |
| R4.1 | Pool sao morph, logo và hoàn nguyên | R3F Engineer | R3.3 |
| R4.2 | Skills: tools → năng lực | Interaction Designer | R4.1 |
| R4.3 | Education: bản đồ ba nhánh | Creative Technologist | R4.2 |
| R5.1 | Meteor Experience → Works | Motion Engineer | R4.3 |
| R5.2 | Works: preview và chọn dự án | Interaction / R3F Engineer | R5.1 |
| R6.1 | EDURA reader editorial | Frontend Designer | R5.2 |
| R6.2 | Route, Back restore, nghỉ Canvas | Integration Engineer | R6.1 |
| R7.1 | Tích hợp và polish finale | Shader / Motion Engineer | R6.2 |
| R7.2 | Contact và Footer | Frontend Designer | R7.1 |
| R8.1 | Responsive, motion, a11y, i18n | Accessibility / QA Engineer | R7.2 |
| R8.2 | GPU, FPS, lifecycle, bundle | Performance Engineer | R8.1 |
| R8.3 | Route, PWA/offline, SEO/assets | Web Platform Engineer | R8.2 |
| R8.4 | Review độc lập và nghiệm thu | Principal Reviewer | R8.3 |

Các path mới được đề xuất trong prompt là **đầu ra cần tạo**, không phải file đã tồn tại. Đọc bàn giao predecessor để dùng đúng tên thực tế; không tạo bản song song vì tên khác ví dụ. `Education` hiện ở `src/components/Education.jsx`; Works dùng `#work`, Contact dùng `#transmission`.

---

## 🎯 TASK R0.1 — Baseline, phạm vi giữ/bỏ và quyền sửa file

```markdown
Bạn là Integration Engineer. Thực hiện riêng R0.1 — chuẩn bị baseline cho redesign Stellar Odyssey; chưa sửa ứng dụng.

📖 ĐỌC: AGENTS.md mới nhất; docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md mục 1–2, 12–15; phần Quy ước chung bắt buộc trong outputs/prompts-redesign-r0-r8.md; outputs/visual-redesign-2026-10-07/verification.md. Đọc App.jsx, GalaxyScene.jsx, CameraRig.jsx, cameraPath.js, useScrollProgress.js, useScrollStore.js và luồng Nav/Menu/Theme/SW thực tế dưới src/.
🧰 SKILLS: gsap-performance, threejs-fundamentals. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Có ảnh/số đo nền hiện tại, danh sách phần tái dùng/gỡ và ownership để Agent sau sửa an toàn.
📐 YÊU CẦU:
1. Kiểm tra working tree/tiến độ, tạo baseline hash hiện tại cho src, public, index.html, vite.config.js, package*.json; ghi thay đổi đang có, không coi baseline cũ là mới.
2. Lần theo tất cả caller của cockpit, theme bootstrap/store/toggle, StardustWake, Constellations, TargetLockReticle, Planet, OrbitalSkills, radio/equalizer và contactProgress; lập danh sách giữ/bỏ theo kế hoạch. Giữ lens/Cursor, Sound/Lang, StarField, ShootingStars, HDR hố đen, PWA.
3. Ghi mốc DOM/section ID thực, route hiện có, asset sai pr.png và avatar có halo; lập file map/ownership. Một Agent tích hợp sở hữu App/scene/camera/store/locale. Không tạo abstraction hay bộ quản lý task.
4. Chạy build/lint baseline và Browser snapshot Hero/About/Skills/Works/Contact ở desktop/mobile nếu công cụ hoạt động; đo FPS nền với cấu hình. Phân loại lỗi có sẵn và giới hạn công cụ.
✅ DONE: Baseline tái kiểm tra được, inventory giữ/bỏ đủ caller, ownership và điểm rủi ro rõ; không sửa source/dependency.
🔍 VERIFY: outputs/redesign/r0.1/verification.md + baseline.json + inventory.md; ghi lệnh và bằng chứng thật, các thiếu hụt không giả pass.
📝 XONG: Append một dòng R0.1 vào Tiến độ AGENTS.md; bàn giao cho R0.2/R0.3, không chạy chúng.
⛔ CẤM: reset thay đổi, dọn code luôn trong audit, cài thư viện, triển khai hiệu ứng hoặc tuyên bố redesign đã pass.
```

## 🎯 TASK R0.2 — Asset chân dung, logo và dữ liệu chòm sao

```markdown
Bạn là Technical Artist. Thực hiện riêng R0.2 sau R0.1 — chuẩn bị asset, chưa tích hợp UI/scene.

📖 ĐỌC: AGENTS.md; docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md mục 4–6, 8, 13, 16; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.1/inventory.md; public/avatar.webp, public/icons/* và dữ liệu tools hiện có.
🧰 SKILLS: imagegen (chỉ chỉnh chân dung), threejs-fundamentals. 🔌 PLUGIN: Browser; Ponytail full; image generation khi chỉnh ảnh.
🎯 MỤC TIÊU: Asset đúng nhận diện và hình sao có nguồn đủ để Agent sau dựng thật.
📐 YÊU CẦU:
1. Xem avatar trước khi sửa. Tạo cutout người sạch nền/alpha, bỏ halo xanh/vòng/trang trí ngoại cảnh đã nhúng trong ảnh; giữ người, khuôn mặt, tư thế và quần áo. Dùng image generation để chỉnh ảnh theo skill, giữ bản gốc, không chỉ xóa CSS border. Xuất bản dùng web có màu và transparency, kiểm tra mép tóc/kính/tay trên nền #050505.
2. Chuẩn bị 6 logo phần mềm Figma/Photoshop/Illustrator/After Effects/Premiere/DaVinci Resolve và 3 logo ChatGPT/Claude/Google Antigravity từ nguồn chính thức; mono rõ ở kích thước nhỏ. pr.png hiện là Resolve, không dùng làm Premiere. AI Tools là một nhóm chứa ba logo; không dùng Gemini thay Antigravity. Không dùng imagegen để vẽ lại trademark hoặc dữ liệu sao; nếu thiếu asset chính thức, ghi thiếu cụ thể thay vì chế logo.
3. Sáu chòm: Circinus/Telescopium/Pictor cho SGU/Green/Arena; Centaurus/Gemini/Cygnus cho EDURA/VERIS/VIE. Lưu danh sách sao/ID, vị trí tương đối có nguồn hoặc RA/Dec+epoch/magnitude, projection đã chọn và các cặp nối. Phân biệt nguồn giải thích tên với nguồn geometry; không tự phác tọa độ như dữ liệu thật. Dùng nhất quán một chart convention, giữ chiều/hình sao; ghi IAU không có một stick figure duy nhất.
4. Lưu source URL, attribution, định dạng/kích thước/alpha/hash, sheet so sánh và dữ liệu có cấu trúc trong outputs/redesign/r0.2/. Không ghi src/public ở task asset này; không sửa dữ liệu R0.3.
✅ DONE: Cutout sạch; logo xác minh đúng hãng; sáu hình sao truy xuất nguồn, không vector/icon minh họa tùy ý. Thiếu nguồn phải thể hiện trạng thái chưa đủ thay vì ✅ đầy đủ.
🔍 VERIFY: outputs/redesign/r0.2/verification.md + assets-manifest.json + constellation-data.json + contact sheet cùng thư mục; mở ảnh thật, kiểm tra decode/alpha, duplicate và source→geometry.
📝 XONG: Append dòng R0.2 đúng trạng thái vào AGENTS.md; nếu chạy song song R0.3, giao Agent tích hợp append tuần tự theo quy ước chung. Bàn giao path asset cho R1/R3/R4/R5.
⛔ CẤM: đổi khuôn mặt, tạo logo AI giả, lẫn Centaurus/Sagittarius, nguồn số liệu bịa, kéo cả bầu sao vào logo hoặc sửa ứng dụng trước storyboard.
```

## 🎯 TASK R0.3 — EDURA source và content pack có căn cứ

```markdown
Bạn là Content Editor kiêm UX Case Study Editor. Thực hiện riêng R0.3 sau R0.1, chưa làm route/giao diện.

📖 ĐỌC: AGENTS.md; docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md mục 11, 16; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/visual-redesign-2026-10-07/edura/inventory.md, manifest.json, contact-sheet.png; data/copy EDURA hiện có trong src/data.js và src/i18n/locales/*.json.
🧰 SKILLS: ui-ux-pro-max. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Nội dung Vi/En và ảnh thật đủ thiết kế case study nội bộ /projects/edura, Behance là nguồn/liên kết phụ.
📐 YÊU CẦU:
1. Người dùng đã cho phép lấy tài liệu từ https://www.behance.net/gallery/241524417/Edura-LMS. Kiểm kê 26 WebP/24 nội dung độc nhất đã có; không tải lại khi không cần, không gọi đó là đủ 119 module.
2. Bổ sung UI/flow còn thiếu bằng nguồn công khai thật khi truy cập được; ghi URL/bytes/hash/attribution. Giữ ảnh màu gốc. Không coi APMS ở ảnh 15–17 là UI EDURA.
3. Soạn outline và copy Vi/En: tổng quan/vai trò → vấn đề → quyết định UI → flow/artifact → kết quả có căn cứ → bài học. Lập bảng claim→nguồn→trạng thái. Vai trò Lead UI có xác nhận cũ; không tự nhận mọi nghiên cứu UX là của cá nhân. Số gần 60% là nguồn OnCourse Systems, không phải nghiên cứu EDURA; kỳ vọng tăng hài lòng không phải kết quả đo. Không chuyển claim Excellent về đổi mới UX khi chưa có chứng cứ.
4. Chọn ảnh đáng đọc, alt/caption và kích thước đề xuất; loại duplicate/ảnh trang trí thừa. Lưu copy/content index trong outputs/redesign/r0.3/. Mục chưa có tài liệu ghi gap trong báo cáo riêng, không bịa hoặc tạo placeholder để xuất bản. Nếu thiếu đầu vào quan trọng, hỏi đúng thông tin đó và tiếp tục phần đã có.
✅ DONE: Content pack phân biệt verified/missing, nguồn cho mọi claim và danh mục ảnh thật; đủ bàn giao bố cục dựa trên phần đã xác minh, không giả full case khi còn gap.
🔍 VERIFY: outputs/redesign/r0.3/verification.md + content.md + asset-index.json; kiểm tra chéo copy/ảnh/claim, URL và decode của file mới; không sửa source/public.
📝 XONG: Append R0.3 vào AGENTS.md đúng mức hoàn thành; nếu chạy song song R0.2, giao Agent tích hợp append tuần tự theo quy ước chung. Nêu thiếu hụt chặn nội dung nào của R6.
⛔ CẤM: chế outcome/số liệu/flow chưa có, lấy màn đối thủ làm EDURA, đổi màu ảnh sản phẩm hoặc xuất bản ngoài website.
```

## 🎯 TASK R1.1 — Storyboard cụ thể cho desktop và mobile

```markdown
Bạn là Creative Director. Thực hiện riêng R1.1 sau R0.2/R0.3 — thiết kế storyboard, chưa sửa ứng dụng.

📖 ĐỌC: AGENTS.md; toàn bộ docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; bàn giao outputs/redesign/r0.1/, r0.2/, r0.3/; screenshot baseline và font/asset thực tế.
🧰 SKILLS: frontend-design, ui-ux-pro-max. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Chứng minh bố cục, vùng đọc và nhịp camera bằng frame cụ thể trước khi viết chuyển cảnh.
📐 YÊU CẦU:
1. Tạo storyboard có thể mở xem, dùng asset/text thật. Desktop 1440 và mobile 390: Hero idle; portal ba nhịp; About; Skills active/AI; Education active; cuối Experience; Works idle/preview; finale năm pha; Contact; EDURA reader. Ghi chú reflow tại 320px.
2. Hero PORTFOLIO sáng gần hết ngang; 2026 lớp sau lệch xuống/phải, đủ cả bốn số, 6 còn thấy; tên nhỏ trái dưới. O thứ ba/cuối là điểm hút. Frame đầu gần đen với bụi/refraction nhẹ quanh O, không full galaxy/BH lớn.
3. Đánh dấu camera/target, tâm O→portal, vùng tối sau chữ, tâm collision→BH và khoảng cuộn: portal 1.5–2 viewport; Education 1.5–2; finale riêng 2–2.5, nhịp nén 8–12% đoạn finale. Không dùng scroll gap vô nghĩa thay storyboard.
4. Skills ba vùng không card, Education ba nhánh bất đối xứng, Works ba hình sao thật và preview cố định, Contact BH lệch/email vùng tối. Mobile chọn riêng/hành động riêng. Ghi pose tĩnh reduced-motion và điểm nghỉ để đọc.
5. Dùng công cụ sẵn có tạo frame/SVG/HTML storyboard tối thiểu trong outputs/redesign/r1.1/, không dựng app/Canvas thứ hai; ghi lựa chọn kỹ thuật còn cần chứng minh ở R2, không mở lại Q1–Q23.
✅ DONE: Bộ frame desktop/mobile đủ các trạng thái, chữ đọc rõ, đường nhìn/điểm nối nhất quán, manifest frame và ghi chú handoff.
🔍 VERIFY: outputs/redesign/r1.1/verification.md + storyboard; mở/xem render thực, kiểm tra tên/year/logo/constellation đúng; phân biệt minh họa với hiệu ứng đã chạy.
📝 XONG: Append R1.1 vào AGENTS.md, bàn giao frame/pose cho R2; chưa thực hiện code production.
⛔ CẤM: thay ý tưởng đã chốt, che cắt mất 2026, cyan/amber/HUD, vẽ chòm sao thành người–ngựa/thiên nga, dùng ảnh phác như sản phẩm đã hoàn thành.
```

## 🎯 TASK R2.1 — Progress câu chuyện và một chủ sở hữu camera

```markdown
Bạn là Motion Architect. Thực hiện riêng R2.1 sau R1.1 — nền tảng nhỏ trong lab hiện có, chưa redesign các section production.

📖 ĐỌC: AGENTS.md; kế hoạch docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md mục 3, 9, 12–15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/; src/3d-lab.jsx, src/3d/hooks/useLabScroll.js, useScrollProgress.js, useSectionAnchor.js; src/3d/components/CameraRig.jsx, src/3d/utils/cameraPath.js, src/stores/useScrollStore.js, src/hooks/useSmoothScroll.js.
🧰 SKILLS: prototype, react-3d-ui, gsap-scrolltrigger, gsap-performance. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Lab điều khiển được các chapter/transition, có pose endpoints và contract để portal/finale dùng chung.
📐 YÊU CẦU:
1. Tái dùng store/scroll hook/cameraPath; thêm tối thiểu progress theo mốc DOM từng chương và transition, không hardcode phần trăm chiều dài toàn trang. Đọc visible position của ScrollSmoother, đo lại khi locale/resize/fonts thay đổi. Mỗi chế độ chỉ một producer: useLabScroll/useScrollProgress/manual scrub không đồng thời ghi đè nhau; scrub phải đồng bộ scroll hoặc tạm dừng producer tương ứng.
2. CameraRig là camera writer duy nhất. Chốt endpoint/target cho Hero, portal/ejection, About–Experience, Works, finale, Contact và pose direct jump/reduced; observer ray tracing luôn ngoài chân trời. Pose story suy trực tiếp từ progress chung hoặc cùng progress đã lọc với toàn cảnh; loại damping x/y/z riêng theo delta khiến camera trễ sao/khí. Không thêm OrbitControls hoặc camera timeline ở section.
3. Lab có scrub/pose control i18n để đến đúng progress, dừng, tua ngược, jump không phụ thuộc phải đi qua Works. Giữ production hiện tại mặc định nếu cần cờ lab tạm; lab/App chung scene, không engine copy. Parallax con trỏ về 0 trong story transitions để pose có thể đối chiếu xác định.
4. Ghi contract nhỏ về progress/anchor/pose/selection/idle-phase cho các task sau, seed/phase mặc định cho deep link. Tránh framework scene graph/task orchestrator mới; output pose reuse, không allocation/frame.
✅ DONE: Scrub/jump/resize/reduced đúng mốc, endpoint liên tục; 1 Canvas/1 camera writer, build và scoped lint pass, console sạch mới.
🔍 VERIFY: outputs/redesign/r2.1/verification.md + contract.md; Browser 5 mốc/jump/resize/3 lifecycle, kiểm tra store progress/camera finite; một self-check nhỏ cho endpoint/clamp/reverse.
📝 XONG: Append R2.1 AGENTS.md, bàn giao tên state/path thật cho R2.2; không thực hiện portal/finale luôn.
⛔ CẤM: viết lại ScrollSmoother, setState mỗi frame, writer camera thứ hai, auto chạy story theo delta hoặc làm thay đổi production trước khi tích hợp.
```

## 🎯 TASK R2.2 — Prototype mini O → khoảng tối → bật ra hố đen

```markdown
Bạn là Creative Technologist. Thực hiện riêng R2.2 sau R2.1 — chứng minh portal trong lab.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 3, 13, 15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/ và r2.1/contract.md; src/3d-lab.jsx, GalaxyScene.jsx, BlackHoleSystem.jsx, BlackHole.jsx, BlackHoleBloomMask.jsx, shaders/blackHole.js và hooks/useSectionAnchor.js dưới src/3d/.
🧰 SKILLS: prototype, threejs-shaders, react-3d-ui, gsap-performance. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Hút vào O cuối và bật ra nhìn lại hố đen lớn, một hình render HDR dùng chung, tua ngược đúng.
📐 YÊU CẦU:
1. Trong lab neo đúng O cuối của PORTFOLIO mẫu DOM; composite/mask ray image hiện có vào O, không chỉ scale mesh vì shader dùng full-screen NDC. Không ray-tracer/FBO pipeline/Canvas thứ hai cho mini BH.
2. Progress ba nhịp trên 1.5–2 viewport: camera tiến O/bụi và nét gần bị bẻ nhẹ → lõi mở phủ khung/khoảng tối ngắn → ejection từ BH lớn trong khi camera nhìn về BH, settle About. Typography DOM vẫn semantic; không raster hóa toàn bộ chữ như thay thế accessibility.
3. Đổi pose/composite trong khoảng tối, giữ ray observer r>1 và màu finite; không đưa camera tính toán vào singularity. Frame đầu không starfield lớn/BH lớn/chòm sao; sao nền mở sau portal. Glow bám đĩa, core tối; mobile anchor không lệch khi resize/locale.
4. Mọi trạng thái dẫn chuyện lấy cùng progress R2.1; đóng băng animation thời gian phụ khi đối chiếu. Giữ pipeline production còn chạy; bàn giao component/contract để R3.2 dùng lại, không bản portal riêng cho lab.
✅ DONE: 5 pose tới/lùi khớp, dừng/đảo chiều/jump đúng, không frame trắng/cắt hụt O; build/lint pass, console/WebGL sạch; đo chi phí đoạn mở O và ejection.
🔍 VERIFY: outputs/redesign/r2.2/verification.md; ảnh 0/.25/.5/.75/1 + reverse desktop/mobile, trace/GPU/DPR, 3 vòng resize/mount và số render targets trước/sau.
📝 XONG: Append R2.2 AGENTS.md, bàn giao portal dùng chung; chưa làm Hero/glitch production.
⛔ CẤM: Canvas/composer thứ hai, shader khác cho O, camera khác sở hữu pose, mask CSS giả transition xong hoặc claim NASA 100%.
```

## 🎯 TASK R2.3 — Prototype Works orbit và chốt pha vào finale

```markdown
Bạn là R3F Interaction Engineer. Thực hiện riêng R2.3 sau R2.2 — prototype sân khấu Works/handoff, chưa preview/route production.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 8–9, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.2/constellation-data.json, r1.1/, r2.1/contract.md; src/3d/GalaxyScene.jsx, components/Constellations.jsx, StarField.jsx, utils/buildStarGeometry.js, src/3d-lab.jsx.
🧰 SKILLS: prototype, react-3d-ui, threejs-fundamentals, gsap-performance. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Ba hình sao thật có orbit sống nhưng vẫn chọn được, chuẩn bị pha gốc xác định cho finale.
📐 YÊU CẦU:
1. Dùng dữ liệu nguồn: EDURA/Centaurus, VERIS/Gemini, VIE/Cygnus. Sao sáng tạo hình trước, nét nối phụ mờ, giữ tương quan/projection; không dùng lại visibility/màu của bốn chòm trang trí cũ. Primitive mới nếu cần nằm src/3d/, sẽ dùng nguyên ở R5.2.
2. Ba hệ cùng hiện, orbit chậm đều bằng useFrame delta; hình sao giữ hướng đọc. Hover/focus/chọn dừng êm cả hệ; bỏ chọn tiếp tục mượt. Nhãn/DOM hit target mẫu đứng ổn định, không buộc đuổi theo sao xoay; reduced tĩnh.
3. Chốt idle phase đúng một lần khi progress finale bắt đầu rời Works; giữ gốc đó qua mọi lần đảo hướng, resume từ pha trả về chỉ khi về hoàn toàn Works. Trường hợp rời hover rồi scroll ngay không nhảy góc. Deep link chưa đi qua Works dùng seed/phase mặc định xác định.
4. Camera do R2.1 điều khiển. Lưu contract selection/orbit/finale phase và tối thiểu self-check handoff; không xây controller duplicate, không làm vụ nổ ở task này.
✅ DONE: Chọn/bỏ chọn/rapid hover/touch mẫu đúng; forward→reverse→forward giữ góc/pha, idle resume liên tục; build/lint/console pass, số đo FPS và resources.
🔍 VERIFY: outputs/redesign/r2.3/verification.md + cập nhật contract bàn giao; Browser quay idle→pause→handoff, đổi hướng nhiều lần, jump direct, 390/1440px, reduced/hidden.
📝 XONG: Append R2.3 AGENTS.md, giao cùng component cho R2.4/R5.2.
⛔ CẤM: physics ba vật thể/random orbit, nhãn trôi theo hit target, snapshot lại mỗi wheel đổi hướng, hình minh họa thay chòm sao hoặc route giả.
```

## 🎯 TASK R2.4 — Prototype finale đảo chiều năm pha

```markdown
Bạn là Shader và Motion Engineer. Thực hiện riêng R2.4 sau R2.3 — thử finale trước polish toàn trang.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 9, 13, 15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/, r2.1/contract.md, r2.3/; shared Works component vừa tạo, src/3d/components/Nebula.jsx, BlackHoleSystem.jsx, shaders/blackHole.js, quality.js, src/3d-lab.jsx.
🧰 SKILLS: prototype, threejs-shaders, gsap-scrolltrigger, gsap-performance. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Va chạm→tinh vân→hố đen có thể dừng/đảo ở mọi frame, đo được ngân sách GPU.
📐 YÊU CẦU:
1. Một progress trên đoạn riêng 2–2.5 viewport: nhãn rút → orbit co/tăng tốc/trail cong → nén ngắn 8–12% toàn đoạn rồi collision → nebula trắng/xám nhiều lớp phủ khung giữ vùng tối → khí về tâm tạo đĩa/lõi đen, pose Contact lệch bên.
2. Dùng pha đã chốt R2.3, seed và dữ liệu vị trí ổn định. Sao/trail/khí/glow/camera/nhãn đều suy từ progress; không lấy elapsed time của Nebula/ShootingStars nguyên bản làm vụ nổ. Không simulation random hoặc tween tự chạy tiếp khi dừng scroll.
3. Tâm collision là tâm BH; hình học/shader/camera không có scrub damping khác nhau gây lệch. Tái dùng HDR/BH và vật liệu/pool phù hợp, thêm shader nhỏ chỉ khi cần; đừng dựng engine volumetric mới. Không frame trắng phẳng, bloom phủ core hay popping ở ranh pha.
4. Reduced-motion cảnh tĩnh đủ thông tin, hidden pause, các tier/DPR theo hạ tầng. Prototype không thêm email/copy/terminal Contact và không thay typography production.
✅ DONE: Cả 5 mốc tới/lùi liên tục, đảo ngay giữa nén/nổ không reseed/teleport, stop giữ scene; build/lint/console pass, benchmark đoạn nặng và budget trước khi đi R3.
🔍 VERIFY: outputs/redesign/r2.4/verification.md; ảnh/clip/trace desktop+mobile viewport, các progress pha và rapid reverse, direct Contact seed, 3 lifecycle/resources; ghi giới hạn phần cứng thật.
📝 XONG: Append R2.4 AGENTS.md; bàn giao timeline/component để R7.1 tích hợp và polish, không tạo bản production khác.
⛔ CẤM: autoplay explosion, reset seed mỗi frame, engine lab thứ hai, thêm màu, flash toàn màn hình hoặc tự bỏ chi tiết đảo chiều để tăng FPS.
```

## 🎯 TASK R3.1 — Dark cố định, gỡ cockpit và tàn dư thị giác cũ

```markdown
Bạn là Frontend Engineer. Thực hiện riêng R3.1 sau R2.4 — dọn đúng phạm vi thiết kế đã bỏ, giữ hạ tầng.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 2, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.1/inventory.md và r2.1/contract.md; src/App.jsx, src/index.css, src/styles/globals.css, public/theme-init.js, index.html, src/stores/useThemeStore.js; Nav/Menu/CockpitRails/ThemeToggle/MissionProgressOrbit/KnurledSwitch/Cursor; GalaxyScene/Constellations/StardustWake và callers thực tế.
🧰 SKILLS: frontend-design, gsap-react, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Nền tối và mono nhất quán, bỏ HUD trang trí nhưng Sound/Lang/điều hướng/lens còn nguyên.
📐 YÊU CẦU:
1. Dark cố định từ bootstrap: xử lý light đã lưu, html/body/classes/store/theme-init/meta theme-color. Bỏ ThemeToggle cả mobile, không flash sáng khi reload; không phá PWA registration/metadata/Sound opt-in.
2. Gỡ OPTICAL SYS/GYRO ATTITUDE/cockpit chrome, progress orbit HUD, pointer dust wake, bốn constellation trang trí cũ, cyan/amber/glow có màu, các lớp kính thuộc redesign. Không lấp khoảng trống bằng HUD khác. Kiểm caller trước khi xóa file; giữ module còn được lab/feature cần.
3. Giữ Cursor/VIEW/magnetic và gravitational lens theo heading/ảnh; chuyển style mono nếu cần, không làm mất chức năng hoặc lệch focus/hit target. Sound/Lang vẫn trong Nav/Menu, keyboard/focus trap và auto-hide còn đúng.
4. Gỡ set piece Planet/OrbitalSkills cũ khỏi App và props/anchor chết nếu đã đối chiếu callers; giữ dữ liệu tools/năng lực cho R4. Reticle ở Work và terminal ở Contact sẽ được thay ở R5.2/R7.2; loại màu và HUD toàn cục bây giờ, không viết lại nội dung hai section đó trong task này.
✅ DONE: Reload với preference light vẫn tối, 0 HUD cũ toàn cục, lens hoạt động đúng phạm vi, Sound/Lang/Nav dùng được; build/scoped lint/console pass, không mất source thay đổi có sẵn.
🔍 VERIFY: outputs/redesign/r3.1/verification.md; Browser 320/390/1440/1920, storage light→reload, Vi/En, native focus/menu/sound/lens, reduced on/off; kiểm import chết và màu render mới, không chỉ grep hex.
📝 XONG: Append R3.1 AGENTS.md; ghi phần còn chờ section task, bàn giao R3.2.
⛔ CẤM: cyan/amber, HUD thay thế, xóa lens/ShootingStars, reset preference Sound, sửa shader/camera ngoài contract hoặc phục hồi Playground/marquee.
```

## 🎯 TASK R3.2 — Hero PORTFOLIO / 2026 và portal production

```markdown
Bạn là Motion và Frontend Engineer. Thực hiện riêng R3.2 sau R3.1 — tích hợp Hero/O thật với portal đã chứng minh.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 3, 12–13, 15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/, r2.1/contract.md, r2.2/verification.md; src/components/Hero.jsx, src/App.jsx, src/hooks/useGSAPSetup.js, src/components/Cursor.jsx, shared portal/anchor implementation, src/i18n/locales/{vi,en}.json.
🧰 SKILLS: frontend-design, gsap-react, gsap-scrolltrigger, react-3d-ui. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Frame đầu lấy typography làm chính, O cuối mở hành trình vũ trụ khi scroll, reverse quay về đúng Hero.
📐 YÊU CẦU:
1. PORTFOLIO sáng/sắc gần hết ngang; 2026 lớn lớp sau lệch xuống/phải, đọc đủ bốn số và số cuối, không bị viewport cắt. Họ tên nhỏ trái ngay dưới PORTFOLIO, role/tagline gọn; content DOM semantic/i18n, không chuyển cả chữ thành canvas texture.
2. O thứ ba/cuối neo mini BH shared. Frame đầu chỉ nền gần đen/bụi/refraction nhẹ quanh O, chưa có sao dày/chòm/BH lớn. Lens giữ tác dụng tinh tế lên heading, không làm O anchor lệch khỏi glyph khi đổi locale/font/viewport.
3. Mỗi 1.5 giây chỉ số 6 lóe glitch thành 7 khoảng 80–120ms rồi về 6; accessible year luôn 2026. GSAP/useGSAP cleanup, pause offscreen/hidden/khi portal bắt đầu; reduced-motion giữ 2026 tĩnh. Không setInterval, RGB hoặc noise toàn màn hình.
4. Tích hợp nguyên portal R2.2 và mốc cuộn thật 1.5–2 viewport; ejection vẫn nhìn BH, About xuất hiện khi settle. Dùng một camera/progress R2.1, không copy pipeline lab; loại nhánh thử nghiệm đã hết nhu cầu. Đi Nav/hash trực tiếp phải đúng pose mà không bắt xem intro/portal. Không để contactProgress cũ chồng offset/intensity vào tuyến mới.
✅ DONE: Bố cục đúng 320–1920, O bám chữ, chỉ 6 glitch, frame đầu không full universe; portal 5 mốc tới/lùi/stop/jump đúng, build/lint/console sạch mới, 1 Canvas.
🔍 VERIFY: outputs/redesign/r3.2/verification.md; ảnh Hero Vi/En, ghi cadence glitch, 5 pose forward/reverse desktop/mobile, reload #about/#work/#transmission, resize/3 motion cycles và lens native pointer.
📝 XONG: Append R3.2 AGENTS.md, bàn giao anchor/scene visibility và pose About cho R3.3.
⛔ CẤM: che mất năm, dùng O đầu/giữa, đổi cả 2026 thành 2027, galaxy lớn trước portal, camera writer mới hoặc portal production khác prototype.
```

## 🎯 TASK R3.3 — About: chân dung tự do và giới thiệu dễ đọc

```markdown
Bạn là Frontend Designer. Thực hiện riêng R3.3 sau R3.2 — About chỉ giới thiệu bản thân.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 4, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.2/assets-manifest.json, r1.1/, r3.2/; src/components/About.jsx, src/App.jsx, src/3d/hooks/useSectionAnchor.js, camera contract, src/i18n/locales/{vi,en}.json.
🧰 SKILLS: frontend-design, gsap-react, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Chân dung không panel/halo trang trí, bio đọc ngay, BH làm nền đúng lúc với vùng tối sau chữ.
📐 YÊU CẦU:
1. Dùng cutout sạch R0.2, không nhúng lại bản avatar có vòng xanh; ảnh đứng tự do trong bố cục, không frame/panel/glass/caption bar giả máy. Grayscale mặc định, hover/focus trả màu, touch tap toggle; target/label i18n rõ và không đổi layout. Giữ kích thước/aspect ratio/alpha đúng.
2. Họ tên + một câu mở đầu giải mã nhanh 0.8–1s; hai đoạn bio xuất hiện theo nhịp đọc, chữ thật đọc được ngay và giữ yên, không scramble cả đoạn. Giữ semantic/screen-reader và nội dung đã xác nhận, dịch Vi/En.
3. Gỡ kho vũ khí phần mềm, năng lực cốt lõi và tinh cầu/anchor bên About. Dữ liệu tools/năng lực chuyển trách nhiệm cho R4, không xóa thông tin chuyên môn. Bỏ lớp kính/cyan/amber, không dùng halo mới thay vòng cũ.
4. Framing BH sau portal qua contract CameraRig: đủ thấy khi chuyển nhịp, lùi/đặt lệch nhường vùng đọc khi đọc bio; không section writer camera. Avatar clip/parallax cũ chỉ giữ nếu còn phục vụ bố cục mới, không chồng transform hoặc layout shift.
✅ DONE: About sạch panel/planet/tools, ảnh trả màu, bio dễ đọc ở mọi mode; build/lint/console pass, reduced tĩnh đầy đủ, không mất focus/overflow.
🔍 VERIFY: outputs/redesign/r3.3/verification.md; Browser 320/390/768/1440, Vi/En, hover/keyboard/tap portrait, alpha trên nền tối, reverse portal→About và jump trực tiếp, reduced on/off.
📝 XONG: Append R3.3 AGENTS.md, bàn giao phần năng lực/tool đã chuyển cho R4.
⛔ CẤM: panel/planet thay thế, tô trắng mất người, giải mã bio dài, proficiency/số liệu tự thêm hoặc camera cố định làm BH che chữ.
```

## 🎯 TASK R4.1 — Pool sao morph logo và hoàn nguyên vị trí gốc

```markdown
Bạn là R3F Engineer. Thực hiện riêng R4.1 sau R3.3 — dựng renderer nhỏ dùng cho Skills/Education, chưa làm lại layout hai section.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 5–6, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.2/, r2.1/contract.md, r2.3/; StarField.jsx, buildStarGeometry.js, Constellations.jsx nếu còn, useSectionAnchor.js, GalaxyScene.jsx dưới src/3d/ và src/data/skills.js.
🧰 SKILLS: react-3d-ui, threejs-shaders, threejs-fundamentals, gsap-performance. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Sao từ vùng nền tạo cấu trúc/logo rồi tháo ngược về đúng nơi, có thể đổi mục liên tục mà không để rác.
📐 YÊU CẦU:
1. Dùng pool biểu diễn giới hạn, typed arrays và base/target position ổn định; nhìn như sao lấy từ vùng nền. Bầu sao xa còn phân bố góc đều và chấm nhỏ, không kéo cả 24k sao vào logo. Tái dùng primitive/anchor có sẵn, chỉ phần dùng chung thực sự cho hai consumer; không framework morph mới.
2. Trình tự sao rõ trước → nét nối mờ → logo mono chính thức rõ hoàn chỉnh. Rời/blur/bỏ chọn/cuộn khỏi section trả position gốc, ẩn logo và dọn liên kết. Đổi tool từ trạng thái hiện tại; một active target, không reset đột ngột, stale tween hoặc ghost particles.
3. Hỗ trợ sáu logo phần mềm riêng và nhóm AI: ChatGPT/Claude/Antigravity hội tụ rồi orbit chung, mỗi mặt giữ hướng đọc. Không dùng logo Gemini hoặc ký hiệu GPT tự chế. Logo thành phẩm dùng asset R0.2, không tự vẽ sai bằng particle.
4. Consumer Education nhận geometry đúng nguồn với điểm sao sáng trước link; giữ projection/relative positions. Không áp hình logo tùy ý cho constellation. Reduced static, offscreen/hidden pause, dispose buffers/materials, không allocation hoặc cập nhật React state mỗi frame.
5. Trong lab shared scene có cách thử target/rapid swap/reverse/reset nhỏ; camera vẫn R2.1. Ghi input/output contract cho section, chỉ thêm đúng những state dùng thực tế.
✅ DONE: Morph/return ổn định, AI đúng3logo, gốc trở về đúng sai số số học; rapid changes/reduced/visibility pass, build/lint/console sạch, có chi phí GPU/pool count.
🔍 VERIFY: outputs/redesign/r4.1/verification.md; self-check base/target/reset và Browser lab 7 tools + 3 chòm Education, đổi nhanh ≥10 lần, 3 lifecycle, positions/resources trước/sau.
📝 XONG: Append R4.1 AGENTS.md, giao cùng renderer/asset mapping cho R4.2/R4.3, không viết lại renderer ở section.
⛔ CẤM: sao neon lớn, hút cả nền về tâm, animation random thay morph có đích, allocation/frame, controller camera hoặc Canvas mới.
```

## 🎯 TASK R4.2 — Skills: tool → logo sao → năng lực

```markdown
Bạn là Interaction Designer kiêm Frontend Engineer. Thực hiện riêng R4.2 sau R4.1 — Skills mới với một tool active.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 5, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/, r4.1/verification.md và contract; src/components/sections/Skills.jsx, src/data/skills.js, src/data.js, src/App.jsx, shared star renderer, src/i18n/locales/{vi,en}.json.
🧰 SKILLS: frontend-design, gsap-react, react-3d-ui, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Bố cục tools trái → sân khấu sao rộng nhất giữa → năng lực phải, thông tin đọc được cả khi không hover.
📐 YÊU CẦU:
1. Gỡ card/thanh phần trăm/trang trí và hệ orbital cũ; desktop ba vùng, mobile xếp dọc ưu tiên stage. Tools mỗi phần mềm một mục, tên/năng lực luôn hiện; cụm common skills và nền tảng kỹ thuật yên phía dưới.
2. Mapping cố định: Figma→Wireframing/Prototyping/Design Thinking; Photoshop→Xử lý ảnh/Compositing; Illustrator→Vector/Branding–Packaging; After Effects→Motion Graphics/VFX; Premiere→Dựng phim; Resolve→Dựng phim; AI Tools→AI-Assisted Design. Tối đa 2–3 nhánh sáng đúng năng lực, không cả lưới cùng sáng. Mỗi đường ánh sáng mono có điểm đầu/cuối bám layout.
3. Dùng nguyên renderer R4.1 cho sao→links→logo. Một AI Tools chứa GPT/Claude/Antigravity quay chung, không ba tool giả mới. Hover/focus chọn, leave/blur trả về; touch chọn/đổi, tap lại active hoặc nền clear, Escape clear. Đổi nhanh và cuộn ra phải dọn sạch, không xóa selection vì pointer nền đi ngang focus bàn phím đang dùng.
4. Teamwork/Project Management/Time Management/Adaptability/Attention to Detail chung; HTML/CSS/JS nền tảng, React đang học. Không thêm color grading hoặc proficiency. Mọi text/label/alt qua i18n, reduced/static đầy đủ.
5. CameraRig đặt BH còn thấy lệch sau vùng đọc, không thay BH bằng OrbitalSkills. Section chỉ gửi anchor/state; hoàn thiện cleanup/store và signal visibility cho renderer.
✅ DONE: 7 mục mapping đúng, một active, ≤3 links, hover/focus/tap/clear/swap hoạt động; không card cũ/proficiency, Vi/En, build/lint/console pass.
🔍 VERIFY: outputs/redesign/r4.2/verification.md; Browser đủ 7 tools gồm AI, rapid swap/scroll out/reverse/Tab/Escape/touch, 320/390/768/1440, locale/resize links, reduced/hidden và resources.
📝 XONG: Append R4.2 AGENTS.md; bàn giao selection/anchor/camera framing cho R4.3.
⛔ CẤM: sai logo Premiere/Resolve, Gemini thay Antigravity, thêm năng lực chưa duyệt, glow có màu, Canvas thứ hai hoặc sửa hit target theo particle chuyển động.
```

## 🎯 TASK R4.3 — Education: bản đồ ba chòm sao có thật

```markdown
Bạn là Creative Technologist. Thực hiện riêng R4.3 sau R4.2 — Education lớn như một bản đồ sao.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 6, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.2/constellation-data.json, r1.1/, r4.1/, r4.2/; src/components/Education.jsx, src/data.js, shared star renderer/anchor, camera contract, src/i18n/locales/{vi,en}.json.
🧰 SKILLS: frontend-design, react-3d-ui, gsap-react, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Ba nhánh bất đối xứng cùng tồn tại, học vấn luôn rõ, chòm sao thức dậy khi khám phá.
📐 YÊU CẦU:
1. Desktop một map khoảng 1.5–2 viewport, ba vùng có khoảng thở, không ba card to hoặc timeline tuần tự. SGU/CNTT 2021–2026→Circinus; Green/Dựng phim 2022–2023→Telescopium; Arena 2024–nay→Pictor. Giữ tên trường/niên khóa/ngành luôn hiện, thể hiện các thời gian chồng nhau.
2. Hover/focus mốc: sao vùng tương ứng hiện/kết tinh từ nền, các sao sáng nhất của vùng dẫn hình, sau mới link nhẹ theo dữ liệu R0.2. Dùng pool R4.1; không chỉ vector xẹt, không vẽ compa/telescope/easel minh họa thay hình sao.
3. Một mốc active; leave/blur/bỏ chọn touch/scroll out tan về nền, rapid switching không để sót sao/link. Touch chạm chọn/chạm nền clear, Escape clear, keyboard focus tương đương. Các vùng khác yên; reduced giữ sao tĩnh/DOM đầy đủ.
4. Camera shared giữ BH trong cảnh, nhường labels và stage; đo lại anchor khi locale/resize, mobile bố cục dọc vẫn cảm giác bản đồ, không thu nhỏ đến không đọc được.
✅ DONE: Ba hình sao đúng nguồn/mapping, dữ liệu học vấn đúng, một active/return sạch; responsive/Vi/En/reduced/build/lint/console pass.
🔍 VERIFY: outputs/redesign/r4.3/verification.md; đối chiếu source chart→render, Browser 3 mốc/rapid switch/scroll out/reverse/tap/keyboard, 320/390/768/1440/1920, 3 lifecycle và pose BH.
📝 XONG: Append R4.3 AGENTS.md; giao geometry/anchors/camera layout cho R5.1.
⛔ CẤM: giả dữ liệu thiên văn, nhầm Circinus la bàn từ, gọi ba chòm mờ là nhóm sao sáng nổi tiếng, mất nội dung khi reduced hoặc biến học vấn thành ba giai đoạn loại trừ nhau.
```

## 🎯 TASK R5.1 — Một sao băng dẫn Experience sang Works

```markdown
Bạn là Motion Engineer. Thực hiện riêng R5.1 sau R4.3 — meteor dẫn chuyện theo scroll và handoff camera.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 1–2, 7–9, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/, r2.1/contract.md, r2.3/, r4.3/; src/components/sections/Experience.jsx, src/data.js, src/3d/components/ShootingStars.jsx, src/3d/utils/shootingStars.js, CameraRig.jsx/cameraPath.js/useScrollProgress.js và scene visibility thực tế.
🧰 SKILLS: gsap-scrolltrigger, gsap-performance, react-3d-ui. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Một đường bay ghé ba kinh nghiệm, đầu sao kéo mắt vào chiều sâu để Works xuất hiện liền mạch.
📐 YÊU CẦU:
1. Bố cục bỏ mission-card/kính/HUD nếu còn; công ty/vai trò/nội dung đọc được mọi lúc. Meteor duy nhất đi đường cong qua HOSANA MEDIA/UPWORK/DESIGNVELOPER; sáng nhấn mốc khi đầu sao ngang qua. Không diễn giải ngày chồng nhau thành các lần chuyển việc độc quyền.
2. Trail là đoạn phía sau đầu sao trên cùng curve, dài/mảnh/lõi trắng/giảm sáng; sampling xác định theo progress, không vệt thời gian tích lũy. Cuộn ngược thu đúng vệt, dừng scene giữ trạng thái; script self-check vị trí/trail cùng progress hai chiều.
3. Cuối Experience meteor bẻ vào chiều sâu, CameraRig theo qua contract rồi BH rời khung và ba hệ Works R2.3 mở ra. Không section tự ghi camera, không cut đột ngột. Đi Nav/hash Works trực tiếp có pose đúng và không replay đường bay.
4. Lập lịch ambient ShootingStars theo chương qua cơ chế nhỏ hiện có: giữ sau portal ở vùng yên, nhường sân khấu khi portal/story meteor/finale active, pause hidden/reduced. Không tái dùng random event làm meteor dẫn chuyện; bỏ event trigger trang trí cũ gây thêm sao lúc chuyển cảnh nếu còn caller.
✅ DONE: Ba mốc nhấn đúng, trail reverse chính xác, BH còn đến Experience rồi rời đúng lúc, Works vào liền mạch; build/lint/console pass, có kiểm chứng random meteor vẫn còn ở vùng yên.
🔍 VERIFY: outputs/redesign/r5.1/verification.md; 5 mốc Experience + handoff cuối tới/lùi, slow/fast/reverse/stop/Nav jump, 390/1440, reduced/hidden, kiểm ambient nhường sân khấu và không xuất hiện hai meteor dẫn chuyện.
📝 XONG: Append R5.1 AGENTS.md; giao curve/pose Works và lịch ambient cho R5.2/R7.1.
⛔ CẤM: random trail, setInterval, camera writer thứ hai, sao băng nối card giả HUD, xóa hẳn meteor nền hoặc BH biến mất trước Experience.
```

## 🎯 TASK R5.2 — Works: ba hệ sao, preview cố định và chọn rõ ràng

```markdown
Bạn là Interaction Designer kiêm R3F Engineer. Thực hiện riêng R5.2 sau R5.1 — đưa sân khấu Works đã prototype vào section thật.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 8–9, 11–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.2/, r1.1/, r2.3/, r5.1/; src/components/Work.jsx, src/components/ui/TargetLockReticle.jsx và callers, src/data.js, src/data/navigation.js, src/i18n/locales/{vi,en}.json, shared Works component.
🧰 SKILLS: frontend-design, react-3d-ui, gsap-react, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Ba dự án thật là trung tâm, dễ khám phá/chọn, ảnh giúp hiểu tác phẩm trước khi mở case.
📐 YÊU CẦU:
1. Tái dùng nguyên orbit/handoff R2.3, thay DOM/data thật: EDURA→Centaurus, VERIS→Gemini, VIE→Cygnus. Không grid card/filter/reticle/bracket/flare amber cũ. Ba hình sao cùng thấy, điểm sáng chính trước links, labels/hit targets ổn định; orbit chậm đều vừa phải.
2. Hover/focus/tap chọn dự án dừng êm cả hệ, chòm chọn sáng hơn/còn lại dịu. Preview ảnh gốc màu + tên + lĩnh vực tại vùng cố định, có dimensions/alt/loading phù hợp; đổi dự án không layout shift. Rời hover/blur/clear tiếp tục orbit mượt, không nhảy phase; tách focus/pointer ownership để không tự clear focus khi chuột rời.
3. Touch chạm chọn/preview, chạm active hoặc nền clear, nút riêng mở EDURA. VERIS/VIE chỉ preview/sắp ra mắt, không href giả hoặc nút hoạt động. EDURA nội bộ sẽ được nối ở R6.2: nếu route chưa tồn tại, slot CTA tạm không điều hướng và ghi rõ dependency, không mở URL 404 hoặc tự trả về Behance làm action chính. Behance chỉ liên kết phụ có thật.
4. Tên/nội dung Vi/En, keyboard/Escape/reduced/static đủ; giữ phase snapshot contract và đoạn đọc/chọn riêng với finale. Camera đã vào từ R5.1, không tự làm finale ở task này.
✅ DONE: Ba preview/selection tốt, labels không chạy khỏi người dùng, chỉ EDURA có slot hành động tương lai, pending thật cho 2 dự án; build/lint/console pass, zero overflow và scene không tăng renderers.
🔍 VERIFY: outputs/redesign/r5.2/verification.md; Browser 3 preview/rapid hover/Tab/Escape/tap clear, 320/390/768/1440/1920, Vi/En/reduced, orbit pause/resume/handoff tới prototype, kiểm link status và màu ảnh.
📝 XONG: Append R5.2 AGENTS.md, ghi rõ phần CTA chờ R6.2; bàn giao projectID/selection/phase/scroll restore contract.
⛔ CẤM: route giả, click VERIS/VIE, logo dự án thay chòm thật, nhãn xoay khó bấm, controller orbit mới, preview che toàn bộ sao hoặc claim sai ý nghĩa thiên văn.
```

## 🎯 TASK R6.1 — EDURA reader editorial bằng nội dung thật

```markdown
Bạn là Frontend Designer. Thực hiện riêng R6.1 sau R5.2 — page nội dung EDURA, route/history hoàn chỉnh ở R6.2.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 11–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r0.3/content.md, asset-index.json, verification.md, r1.1/; outputs/visual-redesign-2026-10-07/edura/inventory.md; src/data.js, locale Vi/En, CSS/type system, các asset đã xác minh.
🧰 SKILLS: frontend-design, ui-ux-pro-max, gsap-react, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Một reader xứng đáng với dự án thật: khung mono, ảnh màu lớn, quyết định thiết kế ngắn và dễ theo dõi.
📐 YÊU CẦU:
1. Tạo page JSX theo folder convention hiện có; trình tự overview/role → problem → quyết định UI → flow/artifact → kết quả có căn cứ → lessons. Dùng pack verified R0.3, không chép 26 ảnh thành gallery dài. Chỉ các phần có chứng cứ mới xuất hiện; thiếu tài liệu quan trọng thì ghi gap trong báo cáo riêng và thu thập tiếp, không bịa copy/outcome hoặc placeholder công khai.
2. Ảnh sản phẩm nguyên màu/chữ, original không bị chỉnh; APMS chỉ xuất hiện nếu được ghi rõ phân tích đối thủ, không gắn nhãn EDURA UI. Không claim Excellent UX hoặc thống kê EDURA từ nguồn bên ngoài. Vai trò/phạm vi cá nhân đúng xác nhận, không tự nhận mọi hoạt động UX.
3. Copy/alt/caption/controls Vi/En, heading order/landmark đúng, ảnh width/height+responsive+lazy/decoding; chọn derivative đủ sắc với bytes hợp lý, giữ provenance. Chỉ ảnh thực sự dùng mới đưa public, không copy cả thư mục research vào production.
4. Chữ editorial và khoảng thở, không HUD/panel/glass, không Canvas/project constellation trong reader. Behance là liên kết phụ. Có nút Return dự kiến với label thật; R6.2 sẽ nối history/focus/scroll. Nếu cần render preview để kiểm UI, dùng preview nhẹ trong shell hiện có và dọn harness trước bàn giao, không dựng app preview thứ hai.
✅ DONE: Page nội dung/ảnh chạy thật, không claim chưa có nguồn, 320–1920 đọc tốt, Vi/En/reduced đầy đủ; build/lint/console pass trong preview. Route/back chưa hoàn tất phải ghi chờ R6.2.
🔍 VERIFY: outputs/redesign/r6.1/verification.md; source→copy/asset checklist, Browser desktop/mobile/read/keyboard, CLS/dimensions/lazy, kiểm màu ảnh/alt; báo thiếu đầu vào thay vì tự ghi toàn bộ case đã pass.
📝 XONG: Append R6.1 AGENTS.md đúng mức hoàn thành, bàn giao page export/path/data/ảnh/CTA cho R6.2.
⛔ CẤM: dùng APMS làm EDURA, dựng screen hoặc metric, blur/grayscale sản phẩm, gallery vô tận, cài thư viện reader hoặc xuất bản Behance thay người dùng.
```

## 🎯 TASK R6.2 — Route EDURA, Back restore và nghỉ Canvas

```markdown
Bạn là Integration Engineer. Thực hiện riêng R6.2 sau R6.1 — route nội bộ /projects/edura và hành vi trở lại Works.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 11–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r5.2/ và r6.1/; src/App.jsx, main.jsx, Work.jsx, Nav/Menu, scroll/loading stores, useSmoothScroll/useScrollProgress, GalaxyScene/CameraRig, i18n/config.js, package.json, vite.config.js, vercel.json nếu có.
🧰 SKILLS: gsap-react, gsap-scrolltrigger, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Click EDURA mở case cùng website, Back trở lại đúng điểm khám phá mà không replay intro.
📐 YÊU CẦU:
1. Trace entry/scroll/restoration và dùng native History/router đã cài nếu đủ; không thêm framework/router mới chỉ cho hai route. Đường /projects/edura hỗ trợ link thật/copy/mở tab mới/deep load/reload, hành vi Ctrl/Cmd-click đúng; EDURA CTA R5.2 nay bật thật, VERIS/VIE vẫn pending.
2. Trước khi rời Works, lưu state cần thiết theo history entry: vị trí cuộn nhìn thấy, selected project, orbit/phase phù hợp, pose và focus origin. Dừng/unmount scene nặng và cleanup Smoother/triggers khi đọc case; không để Canvas chạy nền hoặc intro lock cuộn case.
3. Browser Back từ case đã vào qua Works hoặc Return khôi phục Works đúng scroll/selection/phase/focus EDURA sau khi fonts/layout/scene sẵn; không replay preloader/meteor/portal. Mở case trực tiếp không có entry trang chính thì Return dẫn /#work với pose/focus đúng. Không chặn Back đi ra ngoài website nếu đó là lịch sử native thật.
4. Forward/Back nhiều lần, reload case, đổi Vi/En/resize/reduced và route lúc menu mở đều không duplicate listeners/triggers/canvas. Nav từ case về anchor chính phải đúng pose; không chạy cinematic bắt buộc để đến anchor.
5. Chốt SPA fallback cho deployment thực tế và Workbox navigation fallback cho case; xem lại precache để không nuốt toàn bộ gallery. Giữ offline core, SEO/lang/title đúng route và restore title khi về trang chính; ghi policy case offline theo tài nguyên đã cached.
✅ DONE: EDURA link thật, route/direct/reload/Back/Return đúng, reader không render scene nặng, native navigation và keyboard còn chuẩn; production preview build/lint/console pass.
🔍 VERIFY: outputs/redesign/r6.2/verification.md; Browser native click/Tab/Back/Forward/tab mới/direct/reload, 3 vòng route (resources/focus/scroll), 390/1440 Vi/En/reduced; preview SPA+SW navigation checks, không chỉ dev server.
📝 XONG: Append R6.2 AGENTS.md; bàn giao route/state/PWA policy cho R7/R8.
⛔ CẤM: full reload khi click nội bộ nếu phá restore, href giả/# cho case, history loop, replay intro, Canvas nền reader, đổi Sound opt-in hoặc xóa offline core.
```

## 🎯 TASK R7.1 — Tích hợp và polish finale Works → Contact

```markdown
Bạn là Shader và Motion Engineer. Thực hiện riêng R7.1 sau R6.2 — đưa finale R2.4 vào production, không viết engine mới.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 9, 12–15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/, r2.1/contract.md, r2.3/, r2.4/, r5.2/, r6.2/; shared finale/Works components, src/components/Work.jsx, sections/Contact.jsx, useScrollStore/useScrollProgress, CameraRig/cameraPath, BlackHoleSystem/shaders và quality tiers.
🧰 SKILLS: threejs-shaders, react-3d-ui, gsap-scrolltrigger, gsap-performance. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Cao trào tinh tế, có thể kéo cuộn qua lại ở mọi pha; tâm BH chính là tâm collision.
📐 YÊU CẦU:
1. Tái dùng finale R2.4, nối đúng anchors/layout Works thật; đoạn riêng 2–2.5 viewport sau khoảng đọc/chọn, không bắt scene bắt đầu nổ khi người xem đang preview. Nhãn/preview rút trước, orbit co/tăng tốc/trails, nén 8–12% đoạn, collision lóe cục bộ, nebula có thể tích/vùng tối/chiều sâu, khí về tâm tạo BH/Contact.
2. Giữ orbit phase chốt R2.3 suốt cùng lượt tới/lùi, gồm pause-hover→scroll và route Return. Seed mặc định cho direct Contact/reload đủ xác định; không đòi event onLeave phải từng chạy. Khí/camera/stars/glow/chữ cùng progress hoặc tiến độ đã lọc chung, không easing riêng làm trễ tâm.
3. Gỡ timeline/contactProgress cũ nếu còn ép z/intensity/veil chồng với finale; kiểm toàn bộ caller trước thay. CameraRig vẫn là owner duy nhất, production/lab cùng logic, không nhánh autoplay hoặc animation trả ngược khác. Dừng scroll giữ mọi trạng thái story, kể cả giữa nổ.
4. Polish vật liệu ánh sáng mono, bụi/nebula nhiều lớp đủ chiều sâu, không haze che chữ; core black/bloom bám đĩa, Contact settle với BH lệch bên. Ambient meteors nhường sân khấu; reduced tĩnh, hidden pause, giảm tier/DPR trước khi cắt mất story.
✅ DONE: 5 pha đúng, forward/reverse liên tục tại mọi ranh pha và giữa vụ nổ, không teleport/reseed/frame trắng phẳng; build/lint/console pass, trace đoạn nặng, Contact pose và 1 Canvas.
🔍 VERIFY: outputs/redesign/r7.1/verification.md; 5 mốc tới/lùi + các ranh pha, đảo nhanh lúc nén/nổ/stop, Nav Contact/direct hash/Back case→Works, resize/Vi/En/reduced, 3 lifecycle và FPS/resources đúng cấu hình.
📝 XONG: Append R7.1 AGENTS.md, bàn giao pose đã ổn định/progress/visibility của chữ cho R7.2.
⛔ CẤM: animation nổ tự chạy, chốt lại phase khi đảo wheel, flash trắng phẳng, BH khác tâm collision, CameraRig khác, random physics hoặc tạo finale production mới từ đầu.
```

## 🎯 TASK R7.2 — Contact: email lớn, hố đen lệch và Footer yên

```markdown
Bạn là Frontend Designer. Thực hiện riêng R7.2 sau R7.1 — Contact là điểm nghỉ rõ ràng để liên hệ.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 10, 12–13; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r1.1/, r7.1/; src/components/sections/Contact.jsx, src/components/Footer.jsx, src/data.js, Cursor.jsx, Nav/Menu, src/lib/audioEngine.js và locale Vi/En.
🧰 SKILLS: frontend-design, gsap-react, accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: BH lớn lệch một bên, email trong vùng tối rộng bên kia; copy và mail dễ thao tác.
📐 YÊU CẦU:
1. Bỏ hoàn toàn radio terminal/equalizer/frequency 1420.405 MHz và chi tiết thông số giả, panel/kính/HUD/chip màu. Lời mời ngắn, email thật lớn có wrap hợp lý trên 320px, kênh thật gọn phía dưới. Giữ id transmission hoặc migrate mọi caller/hash nếu buộc đổi, không tạo hai đích Contact.
2. Email ScrambleText một lần khi đến nơi, sau đó tĩnh; screen reader đọc đúng email thật. Lần reverse/enter lại không chạy loạn, không scramble khi đang focus/copy; reduced hiện thẳng. Scene BH đã settle trước nội dung chính theo contract R7.1, không thêm timeline camera.
3. Copy email dùng clipboard native với fallback khi không hỗ trợ/quyền lỗi; feedback i18n/aria-live vừa đủ. Mailto thật giữ trusted click/keyboard; social chỉ URL thật, không link giả. Magnetic/lens nếu có phải giữ hit/focus/selection, Sound vẫn opt-in, không tự thêm tiếng nổ.
4. Footer cùng nền tối/type, nội dung gọn, không CTA/email lặp gây cạnh tranh hoặc cinematic mới; giữ links/metadata cần thiết. Sau entry, vùng email sạch và đủ contrast AA dù đĩa BH rực.
✅ DONE: Email/copy/mail hoạt động, layout đọc rõ, keyboard/touch/reduced/Vi/En đầy đủ, không màu/panel terminal; build/lint/console pass, reverse finale→Works còn đúng.
🔍 VERIFY: outputs/redesign/r7.2/verification.md; Browser 320/390/768/1440/1920, native copy/feedback lỗi/mailto activation, Tab/Escape/selection, cuộn tới/lùi và dừng đọc email, reduced/locale; OS mail client chưa mở được phải ghi rõ.
📝 XONG: Append R7.2 AGENTS.md, chuyển R8.1 để kiểm toàn hành trình.
⛔ CẤM: thông số giả/equalizer, email glitch liên tục, copy feedback giả, phá mailto trusted gesture, che email bằng glow hoặc tác động camera từ DOM.
```

## 🎯 TASK R8.1 — Responsive, keyboard/touch, reduced-motion và i18n

```markdown
Bạn là Accessibility và QA Engineer. Thực hiện riêng R8.1 sau R7.2 — audit và sửa gap thực tế của redesign, không thêm ý tưởng mới.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 12 và 15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; các verification R3–R7; Nav/Menu/Cursor, tất cả section, EDURA page/route, reduced-motion/scroll hooks, locale Vi/En, CSS và các component 3D mới.
🧰 SKILLS: accessibility, gsap-react, frontend-design. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Hành trình dễ đọc/dễ chọn ở mọi thiết bị và chế độ, không chỉ đẹp khi hover desktop.
📐 YÊU CẦU:
1. Ma trận 320/390/768/1024/1440/1920px, portrait/landscape, Vi/En. Test native scroll thực và ScrollSmoother, overflow 0, không cắt PORTFOLIO/year/CTA/email, safe-area/targets 44px/contrast WCAG AA; không dùng overflow hidden toàn body để che lỗi.
2. Tab/ShiftTab/Enter/Space/Escape/skip link/menu focus trap và restore. Focus tương đương hover; Skills/Education một active, Works có target ổn định/chạm chọn + CTA riêng, portrait toggle. Không di chuyển focus theo orbit hoặc click một lần vừa chọn vừa mở case. Screen reader đọc tên heading/năm 2026/email/links đúng.
3. Reduced-motion bật trước load và đổi trực tiếp: scene tĩnh đủ thông tin, tắt zoom/orbit/meteor/explosion/glitch/lens động, không focus/scroll trap. Test OS thật nếu công cụ/thiết bị hỗ trợ, ghi rõ mô phỏng nếu dùng emulation; không tự đổi cài đặt OS của user khi không cần thiết.
4. Nav/hash/reload giữa trang/jump thẳng mọi section/direct EDURA/Back/resize/locale không ép cinematic, không sai pose/anchor. Đo anchor/link drift khi đổi Vi/En. Locale parity/không text UI hardcode, không lấy copy từ data legacy chưa xác minh.
5. Sửa gap bằng diff nhỏ tại nguồn, giữ story và timeline chung. Ít nhất 3 vòng motion/locale/route không nhân trigger/listener. Build/lint phần sửa và console phiên mới; không giữ thay đổi QA thử nghiệm trong sản phẩm.
✅ DONE: Ma trận có kết quả/bằng chứng, gap mức blocker/major đã fix, 0 overflow/layout shift do animation, thông tin/CTA tĩnh đầy đủ; không gọi điện thoại giả lập là thiết bị thật.
🔍 VERIFY: outputs/redesign/r8.1/verification.md + matrix/screenshot; ghi từng mode đã test, bỏ qua có lý do; giữ một regression check nhỏ cho gap logic quan trọng nếu có.
📝 XONG: Append R8.1 AGENTS.md đúng kết quả, bàn giao issue còn lại cho R8.2/R8.3/R8.4.
⛔ CẤM: xóa tương tác để qua audit, restore HUD/màu, tabindex dương, giấu nội dung khi reduced, bỏ qua motion mà làm hỏng Back hoặc claim test OS/điện thoại thật khi chưa làm.
```

## 🎯 TASK R8.2 — GPU/FPS/lifecycle và tối ưu có số đo

```markdown
Bạn là Performance Engineer. Thực hiện riêng R8.2 sau R8.1 — tối ưu điểm nghẽn đã đo, không xây lại renderer.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 13 và 15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; benchmark ở outputs/redesign/r2.2/, r2.3/, r2.4/, r7.1/ và r8.1/verification.md; GalaxyScene/quality/BlackHoleSystem, pool morph/orbit/finale/meteor, camera/scroll hooks, shader, package.json/vite.config.js.
🧰 SKILLS: react-3d-ui, gsap-performance, threejs-shaders. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Giữ chất lượng đã chốt với chi phí GPU/CPU ổn định, scene không chạy lúc không cần.
📐 YÊU CẦU:
1. Đo production preview Hero/O/portal/Skills AI/Education/Experience/Works/finale/Contact và reader, gồm chậm/nhanh/reverse/stop. Ghi refresh/GPU/browser/resolution/viewport/DPR/quality, số mẫu/thời lượng/FPS/phân vị frame time/render calls/resources; phân biệt rAF với rendered frames. Không lấy FPS idle của ảnh tĩnh chứng minh finale.
2. Mục tiêu desktop >120 FPS trên high-refresh tham chiếu, mobile 50–60 trên thiết bị thật phù hợp. Nếu thiếu thiết bị/refresh không đủ, ghi giới hạn và số ms/frame thực; không dựng kết quả. Giảm tier/DPR/pool count/buffer update trước, giữ glow/core/hình sao thật/5 pha đảo chiều; so ảnh trước/sau để tránh tối ưu phá visual.
3. Kiểm frame allocations/hot loops/ticker/React render; reuse typed arrays/objects/materials/targets, scene không viết state React mỗi frame, không build buffers mỗi hover. Kiểm hidden 0 frames, offscreen pause, reader không chạy scene GPU; reduced-motion không chạy effect động ẩn.
4. Ít nhất 3 vòng route/mount/resize/locale/motion: renderer/Canvas/geometry/material/target/texture/listener/trigger không tăng không giới hạn; dispose đúng ownership, không dispose tài nguyên shared còn được dùng. Kiểm context-lost fallback có DOM đọc được.
5. Kiểm lazy/chunks thực và payload; chỉ split nơi tạo lợi ích đo được, không manualChunks để đổi cảnh báo mà tăng waterfall. Không thêm package/engine/caching layer dự phòng chưa cần.
✅ DONE: Bottleneck có trace và fix nhỏ, metric mục tiêu đạt hoặc giới hạn chưa đạt nêu rõ, resources ổn định, build/lint/console pass và visual/story không hồi quy.
🔍 VERIFY: outputs/redesign/r8.2/verification.md + trace/metrics/trước-sau; giữ runnable check nhỏ cho logic hiệu năng mới nếu cần; báo riêng thiết bị chưa đo.
📝 XONG: Append R8.2 AGENTS.md đúng kết quả, bàn giao budgets/tiers hiện tại cho R8.3/R8.4.
⛔ CẤM: giả FPS, viewport desktop=điện thoại thật, FPS rAF=render không kiểm tra, cắt mất đảo chiều/visual chính, ray tracer/Canvas mới hoặc chia bundle quá mức cần thiết.
```

## 🎯 TASK R8.3 — Route/PWA offline, SEO và tài nguyên production

```markdown
Bạn là Web Platform Engineer. Thực hiện riêng R8.3 sau R8.2 — kiểm hồi quy route/PWA/SEO sau redesign và case page.

📖 ĐỌC: AGENTS.md; kế hoạch mới mục 11–13 và 15; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; outputs/redesign/r6.2/, r8.1/, r8.2/; outputs/task-4.7/verification.md; vite.config.js, index.html, public/theme-init.js, PWA icons/favicon/OG image, src/main.jsx, i18n/config.js, App/route và EDURA assets, deployment config thực tế.
🧰 SKILLS: accessibility. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Case deep-link/refresh và portfolio offline vẫn tốt, metadata/asset đúng nội dung mới.
📐 YÊU CẦU:
1. Build production tạo dist/sw.js và manifest.webmanifest; chạy npm run preview, kiểm registration/control/cache thật, installability/manifest/name/icons any+maskable 192/512/standalone/dark #050505. Giữ tên Trần Vũ Anh Duy — Stellar Odyssey, short_name Anh Duy Portfolio; không chỉ đếm file rồi claim installable.
2. Test /projects/edura trực tiếp/reload từ production và SPA deployment fallback thực; cache core HTML/CSS/JS/fonts/icon/cover đủ. Truy cập portfolio online xong tắt mạng + HTTP cache, reload vẫn đọc info/sections qua SW; xác định case JS/case images cached đến đâu và ghi policy offline case đúng thực tế.
3. Kiểm generated precache không nuốt research gallery hoặc toàn ảnh case không dùng; runtime cache ảnh có giới hạn/expiry hợp lý, navigation fallback không trả app cho asset 404. Test cache update không giữ bundle cũ làm hỏng route, không xóa registration/Workbox tùy tiện để test pass.
4. Title/description/canonical/OG/JSON-LD/lang đúng main/case và Vi/En, URL từ domain cấu hình thật, không bịa. Back restore metadata, dark không flash khi đã lưu light, ảnh có width/height/alt/responsive và bytes hợp lý; favicon/icons sắc/không 404.
5. Sửa lỗi thực tế trong phạm vi platform, giữ nguyên scene/story/Sound. HTTPS public/install app/điện thoại thật chưa test phải ghi riêng; task không cho phép deploy hoặc cài app lên máy người dùng.
✅ DONE: Build/lint pass, offline core/direct case/reload SW/manifest có bằng chứng, SEO/asset không hồi quy, console phiên mới sạch; không tuyên bố 100% mobile installability khi chưa đo.
🔍 VERIFY: outputs/redesign/r8.3/verification.md; production Browser online/offline requests→SW/cache, metadata/dimension/manifest snapshots, route/tab mới/Back cycles, giới hạn môi trường rõ.
📝 XONG: Append R8.3 AGENTS.md, bàn giao final build/hash/evidence cho R8.4.
⛔ CẤM: deploy/cài app/submit website, xóa PWA, cache cả gallery vô ích, giả offline bằng HTTP cache hoặc làm PWA audit trên dev rồi claim production pass.
```

## 🎯 TASK R8.4 — Review độc lập và nghiệm thu toàn hành trình

```markdown
Bạn là Principal Reviewer kiêm Creative Director. Thực hiện riêng R8.4 sau R8.3 — đánh giá độc lập bằng render/số đo, không tự redesign thêm.

📖 ĐỌC: AGENTS.md mới nhất; toàn bộ docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md; Quy ước chung trong outputs/prompts-redesign-r0-r8.md; storyboard R1.1, snapshot baseline R0.1 và bàn giao/verification R2–R8.3; kiểm code đúng luồng liên quan, gồm file untracked/uncommitted, thay vì chỉ đọc báo cáo Agent. Không yêu cầu commit hoặc setup issue tracker để làm review này.
🧰 SKILLS: accessibility, frontend-design, gsap-performance. 🔌 PLUGIN: Browser; Ponytail full.
🎯 MỤC TIÊU: Kết luận có thể review được: đạt đúng thiết kế và tương tác, lỗi còn lại có priority/file/evidence.
📐 YÊU CẦU:
1. So bảng requirements Q1–Q23/mục 15 với artifact chạy thật: Hero/year/O; portal→About; tool stars/AI 3 logos/mapping; 3 chòm Education; story meteor; Works 3 chòm/preview; EDURA case/back; finale; Contact. Xác nhận lens+meteor nền còn đúng lịch, legacy HUD/màu/panel/terminal đã gỡ.
2. Với cả hai transition, chụp 0/.25/.5/.75/1 tới/lùi và so cùng progress khi đóng băng ambient. Kiểm rapid reverse lúc nén/nổ, pause, vòng Works idle→hover→finale→Works idle, seed direct Contact, route Return, Nav/hash/reload/locale/resize. Không chấp nhận review chỉ ảnh idle.
3. Native keyboard/touch/reduced/hidden-visible/WebGL fallback, 6 viewport 320–1920 và portrait/landscape; đúng contrast AA/target 44px/0 overflow. Đối chiếu provenance sao/logo/EDURA, không nhầm ý nghĩa diễn giải sáng tạo với dữ kiện thiên văn, không lấy sản phẩm đối thủ làm EDURA.
4. Tự chạy build/lint và production preview, đọc trace FPS/GPU/lifecycle/offline PWA/route/SEO; thử lại luồng cốt lõi. Không gộp claim giả lập thành thiết bị thật; phân loại lỗi cũ, lỗi mới, kiểm tra chưa làm. Đối chiếu baseline để phát hiện mất thay đổi ngoài phạm vi.
5. Report blocker/major/minor với path/line/repro/expected/actual/evidence; không sửa implementation trong review độc lập. Nếu có blocker/major, kết luận CHƯA ĐẠT và chỉ ra task owner cần fix, không tự khởi chạy những task đó. Nếu đạt và còn hạn chế, ghi PASS với giới hạn cụ thể.
✅ DONE: Ma trận nghiệm thu đầy đủ, findings có thể xử lý, kết luận khớp bằng chứng; không giấu việc chưa đo hoặc lấy báo cáo đẹp thay render thật. Review có thể hoàn thành với kết luận CHƯA ĐẠT; điều đó không có nghĩa redesign đạt nghiệm thu.
🔍 VERIFY: outputs/redesign/r8.4/verification.md + final-review.md + requirements-matrix.md; ảnh/trace tham chiếu đúng build/hash hiện tại, commit nếu có, link relative hoạt động.
📝 XONG: Append R8.4 AGENTS.md đúng PASS/CHƯA ĐẠT; nêu rõ vấn đề cần fix và chưa deploy, không gọi redesign đã xong khi còn yêu cầu bắt buộc chưa hoàn thành.
⛔ CẤM: tự approve bằng báo cáo cũ, sửa code để làm mờ review, thêm ý tưởng ngoài kế hoạch, giả NASA 100%/FPS/mobile test hoặc deploy/submission thay người dùng.
```

---

## Bàn giao sau mỗi task

Một lần bàn giao đủ bốn ý: **đã thay gì → bằng chứng ở đâu → còn hạn chế gì → task nào đủ điều kiện chạy tiếp**. Dùng ID dạng `R0.1` của bộ này để không lẫn với task số cũ của Phase 1–5/4B. Không cập nhật trạng thái hoàn thành của các task chưa chạy.

Tài liệu này chỉ chuẩn bị lệnh giao việc; không đồng nghĩa 24 task đã bắt đầu hoặc vượt DoD.
