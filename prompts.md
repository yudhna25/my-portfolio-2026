# Bộ prompts chỉnh visual Stellar Odyssey — V0–V11

> **Cập nhật triển khai 10/10/2026:** P1–P4 đã hoàn tất code và kiểm kỹ thuật/local theo lệnh “bắt đầu kế hoạch tinh chỉnh g1-g2”. Opening tâm→O, năm lớn/contour chậm dài, intake chuỗi+dải và comet lớn/S liên tục đã có trong bản tích hợp. **G1/G2 vẫn chờ người dùng duyệt visual lại; V9/G3 chưa bắt đầu.** [Verification](outputs/visual-revision-2026-10-09/g1-g2-implementation/verification.md) · [Gallery](outputs/visual-revision-2026-10-09/g1-g2-implementation/review.html).

> **Lịch sử phiên Q12 — G1 mở lại, G2 yêu cầu cải thiện, chưa duyệt.** Người dùng yêu cầu chỉ lên phương án trước khi sửa code. Đọc [kế hoạch tinh chỉnh G1/G2](docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md): Q1–Q11 đã chọn, Q12 đã xác nhận **“Chốt phương án, chưa sửa code”**. V8 đã kiểm kỹ thuật/local; kết quả đó không thay duyệt thẩm mỹ. **V9/G3 chưa bắt đầu và phải chờ G1/G2 được duyệt lại trên bản sửa.**
>
> Trong phạm vi mới, không khôi phục viền cố định 2026 theo V1: năm lớn hơn, meteor contour 10–14s/vòng, đuôi 30–40%. Opening nối vòng sáng từ tâm màn hình vào O. Intake V3 cần chuỗi sau ảnh + dải xoắn, từng mục Nav nhập phễu chung. Experience V6 chọn comet rất lớn (lõi nhìn thấy 48–56px, halo 200–240px desktop), đường S liên tục và đuôi đã dài từ entry; hạn chế giữ nguyên curve/birth cũ được thay thế đúng phạm vi này. Giữ sao intake, camera/producer đơn nhất, BH sắc nét, V4/Skills/Education/Works/EDURA và phần khác không được yêu cầu sửa. Các prompt bên dưới là lịch sử/spec gốc 09/10; không thực thi lại hoặc tự mở worker trong phiên lập phương án.

Ngày soạn: **09/10/2026**. Dự án: **Portfolio Trần Vũ Anh Duy**.

**12 nhiệm vụ cho AI Agent, chưa thực thi trong lần soạn tài liệu này.** Bộ prompts này cụ thể hóa bảy yêu cầu visual đã thống nhất, dựa trên kiến trúc hiện có và `outputs/prompts-redesign-r0-r8.md`. Không chạy lại toàn bộ R0–R8.

## Cách dùng và đường dẫn

1. Mở Agent tại **thư mục gốc dự án**, nơi có `package.json` và `AGENTS.md`. Copy nguyên khối prompt của đúng một task bên dưới; Agent phải đọc quy ước chung trong file này trước khi làm.
2. Mọi đường dẫn trong tài liệu được tính **tương đối từ thư mục gốc dự án**. Khi chuyển máy, không sửa đường dẫn theo tên tài khoản hoặc ổ đĩa. Dùng tên file, alias `@/` và thư mục dự án hiện tại.
3. Bắt đầu V0. Đọc bàn giao và xác nhận các dependency trước khi giao task tiếp theo. Các thư mục `outputs/visual-revision-2026-10-09/v*/` là đầu ra cần tạo, không phải bằng chứng đã tồn tại.
4. Giao việc trong Agent/chat do người dùng chọn. Không tự mở chat, đổi model, chạy task khác, deploy, publish hay gửi tin cho người khác.
5. Các task song song có quyền sửa file riêng. Một Agent tích hợp sở hữu file chung và ghi tiến độ `AGENTS.md` tuần tự; không để nhiều Agent cùng ghi file này.

## Độ khó, phụ thuộc và nhóm song song

Thang độ khó 1–5. Điểm đánh giá độ phức tạp triển khai, không phải ước lượng thời gian.

| Task | Nhiệm vụ | Độ khó | Phải chờ | Chạy song song |
|---|---|---:|---|---|
| V0 | Baseline, ownership, contract tích hợp | 2/5 | — | Chạy trước các task còn lại |
| V1 | Hero: bố cục, outline 2026, decode, glitch | 3/5 | V0 | V2 và V4 |
| V2 | Hố đen thay O, đĩa nghiêng, render sắc nét | 5/5 | V0 | V1 và V4 |
| V3 | Portal Hero → About hút/đẩy, đảo chiều | **5/5 — khó nhất** | V1, V2 | V4 nếu V4 chưa xong |
| V4 | Sáu artwork vector và dữ liệu chòm sao | 4/5 | V0 | V1, V2 hoặc V3 |
| V5 | Education: Orion, Scorpius, Leo | 3/5 | V4, G1 | V6 và V7 |
| V6 | Meteor Experience lớn, sáng, cyan và light wake | 4/5 | G1 | V5 và V7; không phụ thuộc V4 |
| V7 | Works: chòm sao lớn, hover trực tiếp, preview cạnh | 5/5 | V4, G1 | V5 và V6 |
| V8 | Tích hợp Education / Experience / Works | 3/5 | V5, V6, V7 | Chạy tuần tự |
| V9 | Finale Works → Contact quy mô lớn | **5/5 — khó thứ hai** | V8, G2 | Chạy tuần tự |
| V10 | Responsive, a11y, hiệu năng, regression | 4/5 | V9, G3 | Chạy tuần tự |
| V11 | Review độc lập và báo cáo nghiệm thu | 3/5 | V10 | Chạy sau bản tích hợp cuối |

**V3 khó nhất** vì phải đồng bộ DOM, camera, shader, visibility, focus và scroll tới/lùi, đồng thời giữ hố đen sắc nét khi tiến sát. **V9 đứng thứ hai** vì cần nối liên tục va chạm → sóng xung kích → khí → đĩa bồi tụ → hố đen lớn, có chiều sâu và đảo ngược được.

Lịch giao việc đề xuất:

```text
V0
 ├─ V1 ─┐
 ├─ V2 ─┴─ V3 ─ G1
 └─ V4 ───────────────┬─ V5 ─┐
                      └─ V7 ─┤
               G1 ────── V6 ─┴─ V8 ─ G2 ─ V9 ─ G3 ─ V10 ─ V11

V5 và V7 cần cả V4 lẫn G1. V6 chỉ cần G1.
```

Có thể dùng tối đa ba Agent thực thi cùng một Agent tích hợp. Không bắt buộc mở đủ Agent. V1/V2/V4 và V5/V6/V7 chỉ chạy song song sau khi V0 khóa ownership; nếu thực tế phát sinh file chung, bàn giao yêu cầu cho Agent tích hợp, không tự sửa đồng thời.

### Ba điểm duyệt visual đã thống nhất

| Gate | Thời điểm | Người dùng duyệt | Điều kiện đi tiếp |
|---|---|---|---|
| G1 | Sau V3 | Hero, O hố đen, glitch, toàn bộ portal tới/lùi | Người dùng xác nhận visual; mới bắt đầu V5/V6/V7 |
| G2 | Sau V8 | Education, meteor Experience, Works và preview | Người dùng xác nhận; mới bắt đầu V9 |
| G3 | Sau V9 | Vụ nổ, quá trình tạo hố đen, Contact trên nền mới | Người dùng xác nhận; mới bắt đầu V10 |

Chuẩn bị ảnh/clip và bản chạy thực tế trước khi xin duyệt. Gate là xác nhận **thẩm mỹ** theo kế hoạch, không thay thế kiểm tra kỹ thuật. Không tự coi việc người dùng im lặng hoặc hết thời gian là đã duyệt. Nếu chưa duyệt, vẫn có thể làm nhánh độc lập được phép, chẳng hạn V4 khi đang chờ G1.

## Quy ước chung bắt buộc

### Nguồn và phạm vi

- Đọc `AGENTS.md` mới nhất, file liên quan và bàn giao predecessor. Kiểm tra working tree, giữ các chỉnh sửa có sẵn; không reset hoặc ghi đè thay đổi của người dùng/Agent khác.
- Thứ tự ưu tiên: chỉ dẫn mới của người dùng → các quyết định visual trong `prompts.md` → quy tắc repo → tài liệu/skill cũ. `outputs/prompts-redesign-r0-r8.md` và `docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md` là nguồn kiến trúc/lịch sử, không khôi phục các quyết định đã bị thay thế.
- Thay thế đúng phạm vi: monochrome có ngoại lệ cyan/orange nhẹ ở glitch, cyan ở meteor và rìa hiệu ứng finale; glitch nhanh cũ đổi sang nhịp hiếm và giữ 7 lâu; portal 175vh và finale 225vh đổi thành **400vh mỗi đoạn** trong chế độ motion đầy đủ.
- Ưu tiên hình ảnh hố đen sắc nét. Đo hiệu năng thật rồi tối ưu điểm nghẽn; không tự làm mờ hoặc giảm độ nét để đạt con số FPS cũ. Không hứa “không bao giờ mờ trên mọi máy” khi chưa đo.
- Giữ Skills, EDURA reader/route/Back restore, audio opt-in, nội dung và những phần không được yêu cầu sửa. Contact chỉ đổi độ trong của nền panel trong V9; giữ copy, bố cục, radio terminal và hành động hiện tại. Không thực thi R7.2 cũ hoặc viết lại Footer trong bộ task này.
- Không phỏng vấn lại các quyết định đã chốt bằng `grill-me`. Nếu người dùng thay hướng visual, cập nhật phần liên quan và dependency trước khi thực thi; dùng skill theo tên khi thực sự cần làm rõ hướng mới.

### Kiến trúc và code

- React functional components + hooks, JSX, import alias `@/`, Tailwind CSS 4, không inline styles. Text/alt/label mới dùng i18n Vi/En; state dùng Zustand hiện có.
- Reuse dependency và helper hiện có. Không thêm framework, router, thư viện animation, physics engine hoặc test framework cho đợt này.
- GSAP dùng `useGSAP`/wrapper hiện có và cleanup đầy đủ. DOM motion chủ yếu transform/opacity. Hiệu ứng outline SVG theo contour và uniforms shader là ngoại lệ cần thiết của yêu cầu visual; không mở rộng thành animation layout mỗi frame.
- Một persistent Canvas, một CameraRig ghi camera pose, một nguồn ghi story progress ở mỗi chế độ. Dùng chung logic Lab/App; không copy engine hoặc tạo Canvas phụ.
- Portal, story meteor và finale là hàm của progress. Cùng progress phải cho cùng trạng thái tới/lùi; không dùng physics/random tích lũy theo thời gian, easing/damping riêng làm camera trễ khác DOM. Parallax con trỏ về 0 khi so trạng thái story.
- Ambient orbit/meteors có thể dùng delta nhưng phải pause hidden/offscreen. V6 không thay kích thước các meteor ambient. Finale capture orbit một lần, giữ snapshot qua reverse; direct entry dùng seed xác định.
- Code 3D ở `src/3d/`, dùng `useFrame` và refs; không setInterval, setState hoặc cấp phát vector/material/array liên tục mỗi frame. Không thêm composer thứ hai.
- Reduced-motion và no-WebGL giữ đầy đủ nội dung, CTA, keyboard/touch. Bỏ glitch/dash chạy, zoom, meteor động và nổ; rút ngắn hai đoạn 400vh để không để khoảng cuộn trống. Target tương tác tối thiểu 44px, có focus rõ và không overflow từ 320px.

### Ownership và bàn giao

- V0 xác nhận danh sách file thực tế. V1/V2/V4 và V5/V6/V7 chỉ sửa các file thuộc task. `src/App.jsx`, `src/3d/GalaxyScene.jsx`, camera/path, producer progress, store chung, Lab và locale chỉ có **Agent tích hợp** sửa khi worker đang chạy song song.
- Worker cần prop/ref/locale/store mới: ghi interface và patch đề xuất vào `handoff.md`, kèm đầu vào/đầu ra; không áp dụng vào file chung. Agent tích hợp nối đúng contract ở V3 hoặc V8. Không tạo store/producer/scene riêng để né ownership.
- V5 và V7 dùng metadata/artwork V4 ở chế độ đọc. Không sửa chéo bộ asset của nhau. Thay đổi renderer dùng chung Skills/Education phải giới hạn vào Education, kiểm tra Skills không đổi.
- Append một dòng task vào `AGENTS.md`, không sửa dòng cũ. Khi chạy song song, worker đưa dòng đề xuất vào handoff; Agent tích hợp append tuần tự. Khi chạy một Agent, append sau task như quy tắc repo.

### Skills — dùng được khi chuyển máy

Hai skill dưới đây **đã được đóng gói trong repo**. Đọc trực tiếp bằng đường dẫn tương đối; không cần cài vào thư mục cá nhân:

| Skill dự án | Đường dẫn từ gốc repo | Vai trò |
|---|---|---|
| `react-3d-ui` | `tools/codex-skills/react-3d-ui/SKILL.md` | R3F, shader, camera, lifecycle, DOM tương tác, fallback |
| `galaxy-portfolio` | `tools/codex-skills/galaxy-portfolio/SKILL.md` | Quy tắc kiến trúc, typography, i18n và phong cách Stellar Odyssey |

Skill bổ sung được ghi **theo tên catalog**, không theo đường dẫn của một máy:

| Skill tùy chọn | Dùng cho |
|---|---|
| `design-taste-frontend` | Bố cục Hero / Education, giữ art direction và hierarchy |
| `design:design-handoff` | Contract và đặc tả bàn giao asset/interaction |
| `design:accessibility-review` | Keyboard, focus, reduced-motion, contrast, touch |
| `design:design-critique` | Review visual độc lập tại gate/bản cuối |
| `ecc:react-performance` | Phân tích React/rendering/bundle khi có điểm nghẽn |
| `ecc:browser-qa` | Kiểm chứng Browser, responsive, lỗi runtime và regression |

**Cách áp dụng:** đọc skill repo trước; với skill tùy chọn, tìm đúng tên trong catalog của phiên/máy hiện tại và đọc `SKILL.md` trước khi dùng. Báo tên skill đang áp dụng. Không coi tên trong bảng là bằng chứng đã cài. Nếu skill tùy chọn không có, tiếp tục bằng AGENTS, code hiện có và kiểm tra tương đương; ghi rõ hạn chế, không tự cài plugin/dependency.

Chỉ áp dụng phần skill phù hợp task. Brief mới ở đây ưu tiên hơn palette mono/glow-only-CTA hoặc cấu hình sao/post-processing cũ trong `galaxy-portfolio`. Không đưa thêm ChromaticAberration toàn cảnh, đổi GSAP sang Motion, setup issue tracker, tạo branch/commit hay mở rộng redesign do workflow skill gợi ý. Hai skill repo là nền tảng; không cần đọc mọi skill trong bảng cho mọi task.

### Kiểm chứng và đầu ra

- Task sửa app: build, lint phần sửa, và Browser kiểm tra đúng hành vi liên quan. Ghi lỗi/warning có sẵn riêng; không giả PASS nếu không có công cụ hoặc chưa chạy. Task thuần tài liệu/asset kiểm tra đầu ra phù hợp, không dùng build pass để chứng minh artwork đúng.
- Logic mới đáng kể cần một self-check nhỏ có ý nghĩa, ưu tiên checker có sẵn. Không viết test chỉ lặp lại implementation hoặc dựng framework mới.
- `verification.md` ghi bản source/build được kiểm tra, thay đổi, kết quả, ảnh/clip/trace thật, điều chưa kiểm chứng. `handoff.md` ghi file sửa, contract/patch file chung, dependency, dòng tiến độ đề xuất và task tiếp theo.
- Đầu ra mỗi task: `outputs/visual-revision-2026-10-09/vX/`. Các link/path trong bàn giao vẫn tương đối từ repo; không đưa đường dẫn cá nhân vào tài liệu cần mang sang máy khác.
- Ghi browser/GPU/viewport/DPR/tier/cách đo khi báo hiệu năng. FPS callback không tự chứng minh FPS render; viewport mobile trên desktop không chứng minh điện thoại thật. NASA-inspired không đồng nghĩa mô phỏng vật lý chính xác hoặc render gốc NASA.
- Ba gate phải có ảnh/clip từ bản tích hợp hiện tại, không trộn ảnh của các worker ở baseline khác nhau. Kết thúc task với trạng thái rõ: hoàn thành, chờ tích hợp, chờ duyệt hoặc chưa đủ bằng chứng. Không tự chạy task kế tiếp.

---

## TASK V0 — Baseline, ownership và contract

```markdown
Bạn là Integration Engineer. Chỉ thực hiện V0 của prompts.md tại gốc dự án; chưa sửa ứng dụng.

ĐỌC
- Toàn bộ Quy ước chung và lịch phụ thuộc trong prompts.md; AGENTS.md.
- outputs/project-status-2026-10-09/status.md nếu có; các handoff R3.2, R4.1–R4.3, R5.1–R5.2, R6.2, R7.1 hiện có dưới outputs/redesign/.
- src/App.jsx, src/3d/GalaxyScene.jsx, CameraRig.jsx, cameraPath.js, useScrollProgress.js, useScrollStore.js và useRouteStore.js tại các thư mục hiện có.
- Hero/PortalHeading/About/Education/Experience/Work/Contact; SymbolStars/SkillsSymbols/StoryMeteor/WorksConstellations; HDR black-hole pipeline; Lab và quality.

SKILLS
- Repo: galaxy-portfolio, react-3d-ui.
- Tùy chọn: design:design-handoff cho contract. Tra theo mục Skills; không dùng đường dẫn máy cá nhân.

MỤC TIÊU
Có baseline hiện tại và giao diện tích hợp đủ để V1/V2/V4 chạy độc lập, sau đó V5/V6/V7 chạy độc lập mà không ghi trùng file.

CÔNG VIỆC
1. Ghi working tree, hash source/asset/config liên quan, build/lint và warning cũ. Không dùng report cũ như phép đo hiện tại.
2. Khóa ownership: V1 typography; V2 shader/HDR/quality; V4 asset; V5 Education; V6 story meteor; V7 Works. Agent tích hợp giữ App/GalaxyScene/CameraRig/path/producer/store/Lab/locales.
3. Ghi contract đang tồn tại: final-O DOM anchor, portal state/progress, About reveal, Experience curve, Works basis/orbit/selection và snapshot route. Đề xuất phần cần mở rộng tối thiểu, không dựng state engine mới.
4. Làm rõ App đang che/inert vùng đọc đến portal hoàn tất; V3 phải cho About xuất hiện và tương tác theo pha đẩy ra. Ghi cách xử lý measure/layout/focus mà không nhân bản About.
5. Chụp baseline Hero, About, Education, Experience, Works, Contact và checkpoint tới/lùi nếu Browser khả dụng. Ghi cấu hình, giới hạn kiểm chứng.

PHẠM VI
Chỉ tạo outputs/visual-revision-2026-10-09/v0/ và dòng tiến độ AGENTS.md. Không sửa src/public/config/package hoặc tự thực thi visual.

ĐẦU RA / DONE
baseline.json, ownership.md, contract.md, verification.md, handoff.md. Contract phải nêu owner từng property và file, patch nào để tích hợp, cách kiểm tra reverse. Bàn giao V1/V2/V4; không chạy chúng.
```

## TASK V1 — Hero typography, outline 2026 và cosmic glitch

```markdown
Bạn là Frontend / Motion Engineer. Chỉ thực hiện V1. Dependency: V0 đã bàn giao.
Đọc Quy ước chung trong prompts.md, AGENTS.md, v0/ownership.md và contract.md trong outputs/visual-revision-2026-10-09/.

SKILLS
- Repo: galaxy-portfolio, react-3d-ui.
- Tùy chọn: design-taste-frontend cho hierarchy/layout; giữ visual đã chốt, không tự redesign các section khác.

FILE SỞ HỮU
src/components/Hero.jsx, src/components/effects/PortalHeading.jsx; CSS riêng Hero dưới src/styles/ nếu thực sự cần. Không sửa shader, camera, App, store, Cursor, Lab hoặc locale chung trong nhánh song song; bàn giao patch cần thiết.

VISUAL BẮT BUỘC
1. Block chữ nằm gần trung tâm màn hình, cùng căn trái; cạnh trái khoảng 14% viewport desktop. Responsive co lại để không tràn từ 320px. 2026 ở lớp sau, cao khoảng 1.6 lần PORTFOLIO, overlap nhẹ và vẫn đủ bốn số.
2. 2026 fill trong suốt, outline trắng rõ. Dùng contour vector/SVG theo font Unbounded hiện có; nét tham chiếu 2px desktop, dash chạy liên tục theo contour với chu kỳ khoảng 6 giây. Không thay bằng border hộp chữ hoặc ảnh bitmap phóng lớn.
3. PORTFOLIO solid trắng, nhỏ hơn năm, không outline. Giữ final-O semantic anchor cho V2 đặt hố đen; không để thêm chữ O thường chồng lên hố đen. Accessible name vẫn PORTFOLIO.
4. Dưới PORTFOLIO: TRẦN VŨ ANH DUY decode như email khi vào cảnh và hover/focus; Creative Designer ở cạnh. Cả hai nhỏ hơn PORTFOLIO. Mobile tách role sang dòng phù hợp. Giữ intro/subtitle hiện tại và i18n.
5. Chỉ số cuối glitch 6 → 7: giữ 6 khoảng 10–14 giây, cosmic fracture/noise khoảng 0.4 giây, giữ 7 khoảng 3 giây, glitch khoảng 0.4 giây về 6. Cyan/orange nhẹ chỉ ở nhiễu; số chính trắng. Không tăng tần suất hoặc glitch cả 2026.
6. Glitch/dash chỉ chạy khi Hero idle và tab visible; pause/reset khi vào portal, hidden, unmount hoặc reduced-motion. Semantic year giữ 2026; hiệu ứng trang trí không làm screen reader đọc thay đổi liên tục.

CÁCH LÀM
Reuse ScrambleText/useGSAPSetup và props PortalHeading shared Lab/App. Giữ font metrics, kerning, Vietnamese glyphs và O anchor ổn định. Không tự làm animation portal V3 trong task này. Locale bổ sung bàn giao cho integrator.

VERIFY / DONE
Kiểm tra 320/390/1440/1920px, Vi/En, text scale, enter/hover/focus, chu kỳ 6→7→6, hidden/reduced và cleanup. Build/lint phần sửa; ghi ảnh và hạn chế trong outputs/visual-revision-2026-10-09/v1/verification.md. Handoff V3 với anchor/props/timeline rõ; không tuyên bố portal đã hoàn tất.
```

## TASK V2 — Final O là hố đen, đĩa nghiêng và render nét khi tiến sát

```markdown
Bạn là Shader / R3F Engineer. Chỉ thực hiện V2. Dependency: V0; có thể chạy cùng V1/V4.
Đọc Quy ước chung trong prompts.md, AGENTS.md và contract/ownership V0. Đọc toàn bộ HDR ray → copy → bloom → core mask và các caller/uniforms trước khi sửa.

SKILLS
- Repo: react-3d-ui, galaxy-portfolio.
- Tùy chọn: ecc:react-performance khi đo thấy chi phí React/rendering; shader profiling dùng công cụ hiện có.

FILE SỞ HỮU
src/3d/components/BlackHole.jsx, BlackHoleSystem.jsx, BlackHoleBloomMask.jsx; src/3d/shaders/blackHole.js; src/3d/quality.js. Không sửa Hero/App/camera/progress/store/Lab ở nhánh song song. Đề xuất wiring và pose cần thiết trong handoff.

VISUAL BẮT BUỘC
1. PORTFOLI<hố đen>: hố đen thay hoàn toàn O cuối. Dark/photon ring vừa cap-height chữ; đĩa bồi tụ nghiêng chéo từ dưới trái lên trên phải khoảng 55°, giống hình Ø người dùng đã đưa. Nghiêng đĩa trong ray frame/mapping thật; rotate mesh fullscreen đơn thuần không giải quyết được.
2. Lõi đen rõ, photon rim và gas disk có cấu trúc, bloom bám vùng sáng. Không phủ haze toàn cảnh, viền cyan toàn hố đen hoặc xóa cấu trúc bằng glow.
3. Tiến sát vẫn sắc: xử lý giới hạn target hiện tại theo actual drawing buffer/DPR và góc nhìn. Không phóng một bản render tối đa 1280px thành toàn màn hình. Ray/copy/mask phải cùng mapping và kích thước để không có viền lệch, pixel vỡ hoặc soft core.
4. Chỉ một HDR ray pass mỗi frame, không thêm composer/canvas thứ hai. Profile quality tiers và memory; giữ fallback. Báo chi phí thực, không tự hạ độ nét mới để đạt FPS lịch sử.
5. Camera vật lý/ray observer phải hữu hạn, không chạy RK4 qua singularity gây NaN. Bàn giao cách rebase/mapping ở dark-core pha V3; không tự sửa CameraRig. Portal đi xuyên là cinematic NASA-inspired, không tuyên bố eject từ hố đen là mô phỏng vật lý chính xác.

PHẠM VI BẢO TOÀN
Giữ API dùng bởi finale hiện có; handoff uniforms/mapping dùng tiếp V9. Không thay phase portal/finale, chữ Hero, nội dung hay palette các section không liên quan. Nếu cần asset fallback mới, dùng tên riêng không ghi vào bộ constellations V4.

VERIFY / DONE
Chụp O-sized và close-up thật ở 390/1440/1920px, DPR/tier liên quan; kiểm tra finite pixels/uniforms, core mask, bloom, resize, target dispose và fallback. Ghi cấu hình/frametime/giới hạn vào outputs/visual-revision-2026-10-09/v2/. Handoff V3 gồm uniforms, anchor fit, pose/rebase đề xuất và evidence độ nét. Không tự chạy V3.
```

## TASK V3 — Portal Hero → About: hút tất cả, đẩy ra và reverse

```markdown
Bạn là Integration / Creative Motion Engineer. Chỉ thực hiện V3 — task khó nhất. Dependency: V1 và V2 đã bàn giao; V4 được tiếp tục độc lập.
Đọc Quy ước chung, các quyết định/gate trong prompts.md, AGENTS.md và toàn bộ handoff V0/V1/V2. Khóa V1/V2 khỏi ghi file trong lúc tích hợp.

SKILLS
- Repo: react-3d-ui, galaxy-portfolio.
- Tùy chọn: design:accessibility-review cho visibility/focus/skip link trong chuyển cảnh.

PHẠM VI
Agent tích hợp được sửa Hero/PortalHeading/About, Nav/Cursor và các control cần tham gia hút, src/App.jsx, GalaxyScene, CameraRig/cameraPath, portal.js, producer progress, useScrollStore, Lab và locale cần thiết. Chỉ đổi BH wiring nếu cần V2 contract; không phá pipeline đã chứng minh. Không sửa asset V4.

STORYBOARD / PROGRESS
Đoạn portal dài 400vh khi motion đầy đủ, progress chuẩn hóa 0..1:
- 0..0.44: tất cả thành phần Hero và camera bị hút về O.
- 0.44..0.50: qua dark core; rebase/mapping an toàn và liền mạch.
- 0.50..0.94: sao/ánh sáng, rồi heading, avatar và bio About được đẩy ra theo nhóm.
- 0.94..1: ổn định thành About hiện tại.

YÊU CẦU
1. Hút cả năm, PORTFOLIO, tên/role/intro, hiệu ứng nền, Nav/buttons/cursor nếu đang hiện và camera. Quỹ đạo cong, tidal stretch, độ sâu và lensing tăng dần; không chỉ fade toàn Hero hoặc xoay cả khung hình.
2. Hố đen O phát triển liên tục từ V2, nét ở toàn bộ đoạn áp sát. Không pop sang ảnh khác hoặc che lỗi bằng blur/white flash. Nghiên cứu chuyển động accretion/lensing từ nguồn chính thống nếu cần; có thể tham khảo NASA: https://www.nas.nasa.gov/SC24/research/project19.php. Nêu giới hạn cinematic so với vật lý thật.
3. Ejection dùng About DOM thật; không tạo bản About trang trí trùng nội dung. Điều chỉnh App root/visibility/inert để About bắt đầu xuất hiện ngay trong pha đẩy ra, thay vì đợi portal===1. Giữ layout/copy/avatar đã có; wrapper phục vụ motion không được làm sai anchor/measure.
4. Hiệu ứng, camera, DOM, focus visibility và backdrop dùng cùng progress. Dừng ở bất kỳ p nào phải đứng đúng cảnh; cuộn ngược phục hồi từng bước. Không autoplay sau scroll, không tích lũy random/simulation hoặc reveal once ngăn reverse.
5. Khi Nav/control đã mất khỏi mắt, không để focus đi vào chúng. Giữ skip-link/đường truy cập keyboard tới nội dung; phục hồi control đúng lúc. Menu mở, locale đổi, resize và direct hash phải có trạng thái hợp lệ; không đưa người dùng qua intro ngoài ý muốn khi Back từ EDURA.
6. Reduced-motion/fallback: năm và Hero tĩnh, bỏ hút/đẩy/zoom, About đọc được và đoạn cuộn ngắn; không để 400vh trống. Live toggle không làm kẹt scroll/focus/trigger.

VERIFY
Build/lint, Browser p=0/0.25/0.44/0.47/0.50/0.70/0.94/1 ở cả hai hướng; rapid reverse, stop, jump, resize, Vi/En, 390/1440/1920px, 3 lifecycle/motion cycles. So pose/render story cùng p; ghi ambient khác biệt riêng. Chứng minh một Canvas/producer/camera writer và resource ổn định; không giả FPS hoặc phone-device pass.

ĐẦU RA / G1
outputs/visual-revision-2026-10-09/v3/: verification.md, handoff.md, ảnh/clip Hero-glitch-O-portal tới/lùi của bản tích hợp. Chuẩn bị bản chạy review và xin người dùng duyệt G1. Chờ G1 trước V5/V6/V7; không tự chạy nhóm đó. V4 vẫn được làm độc lập nếu chưa xong.
```

## TASK V4 — Sáu artwork vector, dữ liệu sao và attribution

```markdown
Bạn là Technical Artist / Data Engineer. Chỉ thực hiện V4. Dependency: V0; có thể chạy cùng V1/V2/V3 vì không sửa runtime chung.
Đọc Quy ước chung trong prompts.md, AGENTS.md, ownership V0, src/3d/data/symbolTargets.json và worksConstellations.json, cùng contract geometry/anchor hiện có.

SKILLS
- Repo: react-3d-ui cho geometry, coordinate mapping và local assets.
- Tùy chọn: design:design-handoff cho manifest/contact sheet và thông số bàn giao.

FILE SỞ HỮU
Asset mới dưới public/constellations/ và dữ liệu/check/docs trong outputs/visual-revision-2026-10-09/v4/. Không sửa src, App, store, locale hoặc artwork đã thuộc task khác. Dữ liệu đề xuất cho runtime bàn giao V5/V7, không tự gắn UI.

MAPPING ĐÃ CHỐT
Education: SGU → Orion; Green Academy → Scorpius; Arena → Leo.
Works giữ nguyên: EDURA → Centaurus; VERIS → Gemini; VIE → Cygnus.

NGUỒN / PHONG CÁCH
- Tìm và kiểm tra nguồn Stellarium / Johan Meuris: https://johanmeuris.eu/work/stellarium-constellation-art/
- Metadata mốc tham khảo: https://raw.githubusercontent.com/Stellarium/stellarium/daace2add6a1bf886e8ee1934f51e9c69f818d18/skycultures/modern/index.json
- Artwork: thư mục skycultures/modern/illustrations/ trong repo https://github.com/Stellarium/stellarium; xác nhận revision thực tế, không trộn metadata và ảnh khác bản mà không ghi rõ.
- Kiểm tra Free Art License cho illustration: https://artlibre.org/licence/lal/en/; kiểm tra license/attribution của dữ liệu sao/line pattern riêng, không dùng một license chung cho mọi tài sản.
- Sáu derivative vector trắng/xám dạng outline, giảm shading, giữ silhouette nhận diện. SVG có path vector thật, không bọc PNG trong <image>, không raster upscale, không AI vẽ lại vị trí sao.
- Gemini nguồn tham khảo 256×256, năm hình còn lại 512×512; chưa có vector master/high-res được xác minh. Tạo derivative outline được phép theo nguồn, không tuyên bố phục hồi master gốc.

DỮ LIỆU / ANCHOR
Dùng HIP và line patterns nguồn thật, projection/epoch thống nhất; không nối cạnh tùy ý để hình dễ nhận hơn. Giữ Works geometry hiện có nếu trùng nguồn. Dùng ít nhất ba anchor để căn art theo cùng basis sao, không chỉ center-fit hoặc mirror.
Các anchor tham khảo cần đối chiếu nguồn (pixel x,y → HIP):
- Orion: (59,11)→27913; (329,477)→27366; (421,91)→22449.
- Scorpius: (447,29)→78820; (62,365)→85927; (217,462)→82729. HIP82729 dùng làm calibration star nếu thiếu trong line pattern; không tự tạo cạnh tới sao này.
- Leo: (69,411)→57632; (383,186)→49669; (321,32)→47908.
- Centaurus: (118,157)→68933; (194,444)→71683; (463,412)→56561.
- Gemini: (14,81)→37740; (117,252)→32362; (249,165)→28734.
- Cygnus: (7,382)→107310; (474,46)→94779; (467,453)→95947.
Nếu vector crop/viewBox đổi, ghi transform từ pixel nguồn sang SVG mới để các anchor vẫn đúng. Xác minh tọa độ sao và epoch thay vì coi bảng tham khảo là kết quả test.

ĐẦU RA / DONE
Sáu SVG; manifest nguồn/revision/author/license/credit/hash/viewBox/anchors/transforms; dữ liệu Education và mapping Works bàn giao; contact sheet trên nền tối gồm nguồn → vector → sao overlay. Có check decode SVG/anchors/line pattern và bằng chứng nhận diện. Idle art dự kiến opacity 8–12%, hover/focus/touch 25–35%; kiểm tra silhouette ở các mức này.
verification.md + handoff.md ở v4/. Bàn giao V5/V7 và attribution cần đưa vào runtime qua integrator. Không dùng image generation thay cho dữ liệu thiên văn, không triển khai section.
```

## TASK V5 — Education dễ nhận diện và sáng mạnh khi tương tác

```markdown
Bạn là Interaction / R3F Engineer. Chỉ thực hiện V5. Dependency: V4 đã bàn giao và G1 đã được người dùng duyệt.
Đọc Quy ước chung trong prompts.md, AGENTS.md, ownership/contract V0, handoff V3/V4 và bằng chứng G1.

SKILLS
- Repo: galaxy-portfolio, react-3d-ui.
- Tùy chọn: design-taste-frontend cho cân bố cục, không đổi thiết kế Skills.

FILE SỞ HỮU
src/components/Education.jsx; src/data/education.js; src/3d/components/SkillsSymbols.jsx, SymbolStars.jsx; src/3d/utils/symbolMorph.js; src/3d/data/symbolTargets.json. Scope renderer shared chỉ phần Education. Không sửa App, camera, producer, store chung, Lab, locale hoặc asset V4 trong nhánh song song.

YÊU CẦU
1. Thay SGU/Circinus bằng Orion; Green/Telescopium bằng Scorpius; Arena/Pictor bằng Leo. Giữ copy, năm học và layout hiện có nếu không cần thay để hình mới đọc rõ.
2. Dùng HIP/line patterns/anchors đã kiểm chứng V4. Artwork nằm sau sao, cùng projection/basis; căn bằng ít nhất ba anchor, không chỉ hình đặt giữa hoặc mirror sai.
3. Idle art khoảng 8–12% opacity; selected/hover/focus/touch 25–35%. Sao và đường chòm sao sáng mạnh hơn khi tương tác, có glow rõ nhưng vẫn phân biệt các node/cạnh; không thành mảng trắng che hình/copy.
4. Hover trực tiếp figure và điều khiển trường hiện có đều có tương đương keyboard/touch; xử lý ownership input, Escape/clear/return base và rapid switch. Không dùng invisible hotspot lệch khỏi chòm sao.
5. Giữ SymbolStars pool/morph và mọi logo/tool/interaction Skills nguyên behavior. Nếu dùng tham số glow/art mới, giới hạn theo Education, không đổi mặc định shared làm Skills sáng lên hoặc thêm art vào Skills.
6. Reduced-motion dùng trạng thái tĩnh đọc được; hidden/offscreen pause; no-WebGL giữ thông tin và điều khiển trường. Locale/attribution mới ghi patch cho V8.

VERIFY / DONE
Ba trường ở 390/768/1440px, hover/focus/touch, rapid switch, reverse/resize, reduced/fallback và regression đủ các tool Skills. Build/scoped lint; ghi anchors/glow/asset load/resource checks thật. outputs/visual-revision-2026-10-09/v5/verification.md và handoff.md gồm integration/locale patch cho V8. Ghi rõ phần chờ wiring nếu có; không tự sửa file chung hoặc thực hiện V6/V7.
```

## TASK V6 — Experience meteor lớn, sáng, cyan và ánh sáng lan qua

```markdown
Bạn là Shader / Motion Engineer. Chỉ thực hiện V6. Dependency: G1 đã duyệt; không cần chờ V4. Có thể chạy cùng V5/V7.
Đọc Quy ước chung trong prompts.md, AGENTS.md, ownership V0, contract story meteor/curve hiện tại và handoff V3.

SKILLS
- Repo: react-3d-ui, galaxy-portfolio.
- Không bắt buộc skill animation ngoài stack GSAP/R3F đã có.

FILE SỞ HỮU
src/3d/components/StoryMeteor.jsx; src/3d/utils/storyMeteor.js; src/components/sections/Experience.jsx. Nếu cần shader riêng, đặt trong src/3d/ với tên riêng story meteor. Không sửa ambient ShootingStars/shootingStars.js, App/camera/store/locale hoặc global post-processing.

VISUAL
1. Story meteor có core trắng sắc khoảng 14–18px desktop, halo 60–90px, đuôi taper dài 35–50% bề rộng màn hình. Cyan nhẹ trong halo/dải màu; core vẫn trắng. Mobile scale phù hợp để không nuốt milestone/copy.
2. Tail có cấu trúc ribbon/billboard và gas turbulence nhẹ, đầu rõ và đuôi nhỏ dần. Không chỉ tăng point size hoặc lineWidth vốn không ổn định giữa GPU.
3. Ánh sáng lan ngắn qua nền và mép milestone khi meteor đi qua, rồi tắt sau đuôi. Light wake phải cảm nhận được chuyển động và giữ readability, không là lớp sáng thường trực phủ Experience.
4. Meteor, tail, wake và milestone emphasis đều xác định theo cùng story progress: dừng thì đứng, reverse thì lùi chính xác, jump không để trail cũ. Không dùng buffer lịch sử tăng vô hạn hoặc simulation phụ thuộc FPS.
5. Giữ curve/path anchoring và đoạn departure Experience → Works hiện có. Không đổi thời điểm camera rời BH, entry Works hoặc kích thước/tần suất ambient meteor toàn site.
6. Glow xử lý local, không thêm composer/canvas hoặc bloom toàn scene. Reuse geometry/material; no allocations mỗi frame; tắt động khi hidden/reduced/offscreen, static DOM/fallback vẫn đầy đủ.

VERIFY / DONE
Kiểm tra ba milestone và departure ở 390/1440px, DPR liên quan; cùng progress tới/lùi/stop/jump, chữ còn đọc rõ khi head/wake đi qua, resources/frametime và reduced/fallback. Build/scoped lint. Ghi evidence vào outputs/visual-revision-2026-10-09/v6/; handoff V8 với props/curve/interface cần nối. Không tự sửa camera hoặc ambient effects.
```

## TASK V7 — Works chòm sao lớn, hover figure và preview bên cạnh

```markdown
Bạn là Interaction / R3F Engineer. Chỉ thực hiện V7. Dependency: V4 và G1 đã duyệt; có thể chạy cùng V5/V6.
Đọc Quy ước chung trong prompts.md, AGENTS.md, V0 ownership/contract, V4 assets và luồng EDURA Back restore R6.2 đang dùng.

SKILLS
- Repo: react-3d-ui, galaxy-portfolio.
- Tùy chọn: design:accessibility-review cho semantic hotspots, hover/focus/touch và preview CTA.

FILE SỞ HỮU
src/components/Work.jsx; src/3d/components/WorksConstellations.jsx; src/3d/utils/worksOrbit.js. Có thể bổ sung artwork metadata vào src/3d/data/worksConstellations.json nhưng không thay vị trí sao/cạnh đã kiểm chứng. Không sửa App, camera, useScrollStore, useRouteStore, Lab, locales, BH hoặc asset V4 ở nhánh song song.

VISUAL / INTERACTION
1. Giữ EDURA/Centaurus, VERIS/Gemini, VIE/Cygnus. Hiện ba figure cùng lúc, lớn khoảng 1.8 lần hiện tại trong tam giác rộng; fit viewport, không chồng hoặc bị clip. Desktop có khoảng trống cho preview, mobile giữ tam giác và info bên dưới.
2. Artwork V4 nằm sau sao, cùng basis/rotation/scale/pose của chòm sao, không trôi độc lập khi orbit. Idle opacity 8–12%, active 25–35%; active stars/lines glow mạnh, nhìn rõ node và silhouette.
3. Hover vào cả vùng figure tương ứng mới mở info; không dùng selector ở header làm tương tác hover chính. Hover/focus/touch selected pause orbit. Khi Canvas không nhận pointer, semantic DOM hit region phải được đo từ figure đang project thật và có keyboard label, không là hộp lệch hình.
4. Info gồm ảnh/category/CTA hiện ngay cạnh chòm sao desktop, tự chọn phía phù hợp để fit màn hình và không che chòm sao đang chọn. Không làm thay chiều cao stage hoặc nhảy scroll. Mobile info dưới tam giác.
5. Giữ hover khi đi từ figure qua panel: exit grace khoảng 180ms; chỉ đóng khi pointer/focus ra khỏi cả figure lẫn panel. Click/tap pin; Escape hoặc click nền bỏ chọn. CTA là hành động riêng, không xung đột tap chọn. Keyboard đọc được info và tới CTA.
6. EDURA reader/Behance giữ hành động đúng; VERIS/VIE vẫn coming soon. Giữ id work-target-edura và metadata route restore. Không tạo store Works thứ hai; dùng interface store hiện có, patch cần thêm bàn giao V8.
7. Chốt orbit/selection khi sang finale đúng một lần; reverse phục hồi snapshot cũ, không capture lại mỗi frame hoặc mỗi lần đổi hướng. Handoff nguyên contract cần cho V9.

VERIFY / DONE
390/768/1440/1920px; hover figure→panel→CTA, exit grace, focus/Tab/Escape, tap/pin/clear, responsive no overlap/CLS, rapid selection, reverse snapshot và EDURA Back restore. Nếu flow chưa nối do quyền file chung, kiểm tra component và ghi rõ phần chờ V8, không giả end-to-end pass. Build/scoped lint. outputs/visual-revision-2026-10-09/v7/verification.md + handoff.md có props/ref/locale/store patch và screenshot states.
```

## TASK V8 — Tích hợp ba section và duyệt G2

```markdown
Bạn là Integration Engineer. Chỉ thực hiện V8. Dependency: V5/V6/V7 đã bàn giao; G1 và V4 đã hoàn tất. Dừng worker ghi file trước khi tích hợp.
Đọc Quy ước chung trong prompts.md, AGENTS.md, toàn bộ verification/handoff V5–V7 và baseline/contract V0.

SKILLS
- Repo: galaxy-portfolio, react-3d-ui.
- Tùy chọn: ecc:browser-qa cho native interaction và regression của bản tích hợp.

FILE / PHẠM VI
Được sửa src/App.jsx, src/3d/GalaxyScene.jsx, Lab, locales Vi/En, store/ref/interface cần thiết và điểm nối trong worker files. Camera/progress producer chỉ sửa khi contract bắt buộc, giữ một writer. Không tự thay art direction, đổi asset/mapping đã chốt, viết lại Skills/EDURA hoặc triển khai finale V9 sớm.

CÔNG VIỆC
1. Tích hợp V5 Education, V6 meteor/wake, V7 Works theo contract. Không tạo state/renderer/curve thứ hai. Nối i18n/attribution và xác nhận key parity.
2. Asset URL dùng cấu trúc repo/public portable. Artwork chỉ xuất hiện đúng Education/Works, không chảy vào Skills; glow meteor không làm core BH mờ hoặc đổi ambient stars.
3. Regression Skills, camera story, departure, Works snapshot, EDURA route và Back focus/orbit/scroll restore. Recheck Hero/portal G1 sau file chung thay đổi.
4. Kiểm tra bản production build hiện tại và native Browser/touch/keyboard; responsive và 3 lifecycle/motion cycles theo phạm vi. Không dùng ảnh từ ba baseline worker khác nhau để kết luận bản tích hợp pass.
5. Ghi các dòng tiến độ worker đang chờ vào AGENTS.md tuần tự, đúng tình trạng bằng chứng; không sửa dòng cũ.

VERIFY / G2
Build/lint, locale parity, các hành vi thực của ba section, console/WebGL/resources. outputs/visual-revision-2026-10-09/v8/: verification.md, handoff.md, ảnh/clip của Education/Experience/Works trên cùng source/build. Chuẩn bị review G2 cho người dùng. Chờ duyệt G2 trước V9; không tự bắt đầu finale.
```

## TASK V9 — Finale quy mô lớn và hố đen giữ sức nặng khi Contact xuất hiện

```markdown
Bạn là Integration / Shader Motion Engineer. Chỉ thực hiện V9 — task khó thứ hai. Dependency: V8 hoàn tất và G2 được người dùng duyệt.
Đọc Quy ước chung trong prompts.md, AGENTS.md, handoff V2/V3/V7/V8 và finale/orbit/HDR pipeline hiện tại.

SKILLS
- Repo: react-3d-ui, galaxy-portfolio.
- Áp dụng shader/camera profiling hiện có; không đưa physics engine hoặc thư viện motion mới vào scene.

PHẠM VI
Finale state/consumers, Works handoff, camera/path, App/GalaxyScene/Lab, BH uniforms/shader nếu cần và src/components/sections/Contact.jsx. Trong Contact chỉ đổi độ trong/nền gradient của panel; giữ text, bố cục, terminal, link/CTA/audio hiện có. Footer và các section khác không redesign.

STORYBOARD
400vh khi motion đầy đủ; giữ mốc phase 12% / 34% / 44% / 70% / 96%:
- 0..0.12: retract info và chốt snapshot Works.
- 0.12..0.34: ba figure orbit/hội tụ về cùng tâm.
- 0.34..0.44: nén và va chạm, tăng năng lượng.
- 0.44..0.70: shockwave vượt mép khung, particles/gas có chiều sâu.
- 0.70..0.96: khí quay trở lại, cuộn thành đĩa bồi tụ và hố đen.
- 0.96..1: hố đen lớn ổn định, Contact vào cảnh.

VISUAL BẮT BUỘC
1. Vụ nổ phải có quy mô: core sáng tập trung, sóng xung kích mở qua khung hình, nhiều lớp particles/gas ở độ sâu khác nhau và parallax hợp lý. Không là ba đường nhỏ gặp nhau rồi fade, không phủ trắng toàn màn hình để giấu hình.
2. Cyan nhẹ ở rìa wave/gas; core và disk trắng/xám. Bảo toàn dark field để nhận ra scale và cấu trúc. Bloom không xóa mọi chi tiết hoặc làm panel khó đọc.
3. Tâm va chạm chính là tâm hình thành BH. Khí từ vụ nổ trở lại có quỹ đạo và angular flow, cuộn thành cùng disk/core. Không tắt explosion rồi pop một BH nhỏ không liên quan hoặc tạo hai object chồng nhau.
4. Khi hình thành, dark/photon ring BH cao khoảng 50–60% màn hình và giữ lớn khi Contact xuất hiện. Không đo theo halo ngoài rồi để lõi thật rất nhỏ; không shrink đột ngột ở endpoint. Desktop/mobile bố trí để nội dung đọc được.
5. Contact giữ nguyên copy/layout/actions; chỉ nền panel tối/gradient trong hơn để thấy BH phía sau. Không thực hiện prompt R7.2 cũ về gỡ terminal/đổi Footer.
6. Tất cả phase theo cùng progress, analytic/seed xác định, snapshot orbit capture một lần. Reverse phải hoàn nguyên gas→wave→collision→three figures và selection/preview cũ. Dừng, jump, direct route, locale/resize không reseed hoặc đổi tâm.
7. Giữ pipeline nét V2, một Canvas/camera/HDR pass. Không autoplay vụ nổ khi người dùng dừng scroll, không thêm âm thanh nổ. Reduced-motion/fallback bỏ chuỗi nổ/zoom và rút ngắn vùng cuộn, vẫn thấy Works/Contact đầy đủ.

VERIFY / G3
Build/lint; Browser các mốc 0/.12/.34/.44/.70/.96/1 và sát hai phía boundary, tới/lùi/rapid reverse/hold/jump. Kiểm tra 390/1440/1920px, Vi/En, route restore, resources/frametime/core detail và Contact readability. Recheck portal V3 nếu shader/camera chung đổi.
outputs/visual-revision-2026-10-09/v9/: verification.md, handoff.md, ảnh/clip toàn chuỗi và BH/Contact cuối. Xin duyệt G3 bằng bản tích hợp thực tế. Chờ G3 trước V10; không tự chuyển sang release/deploy.
```

## TASK V10 — Kiểm tra tổng hợp, accessibility và hiệu năng thực

```markdown
Bạn là Accessibility / Performance / QA Engineer. Chỉ thực hiện V10. Dependency: V9 hoàn tất, G3 được duyệt.
Đọc Quy ước chung trong prompts.md, AGENTS.md, toàn bộ handoff V0–V9 và bằng chứng G1/G2/G3.

SKILLS
- Repo: react-3d-ui; galaxy-portfolio khi cần đối chiếu chuẩn repo.
- Tùy chọn theo nhánh kiểm tra: design:accessibility-review, ecc:react-performance, ecc:browser-qa. Chỉ đọc/dùng phần phù hợp, không cài tool hoặc mở rộng sang workflow deploy.

PHẠM VI
Được sửa regression do đợt visual V1–V9 tạo ra, gồm file tích hợp cần thiết. Không tự triển khai R8 cũ, audit toàn bộ sản phẩm ngoài yêu cầu hoặc giảm chất lượng hình đã được duyệt. Báo issue cũ riêng.

MA TRẬN / CHECK
1. 320/390/768/1024/1440/1920px, Vi/En, normal/reduced-motion; native Tab/ShiftTab/Escape/skip link/menu, hover/focus/touch/pin và CTA. Không focus vào control Hero đã bị hút hoặc panel vô hình. Mobile info/hit regions khớp figure, target ≥44px.
2. Portal/finale: same-progress forward/reverse, các boundary và sát hai phía, stop/rapid reverse/jump, resize/locale mid-scene. Meteor reverse/wake không lưu dấu cũ. Direct hash/EDURA Back/Forward/Return giữ scroll/selection/orbit/focus hợp lệ.
3. Reduced-motion bật từ đầu và đổi live: không dash/glitch/meteor/explosion/zoom, không đoạn 400vh trống. No-WebGL/context loss vẫn có DOM và hành động; fallback lỗi asset không làm mất section.
4. Đo rendered frame/CPU/GPU phù hợp công cụ, ghi rõ browser/device/GPU/DPR/tier và đoạn nặng. Không coi rAF cadence hoặc mobile viewport desktop là FPS điện thoại. Chỉ tối ưu điểm nghẽn có evidence; không tự blur/giảm sharpness BH để đạt target cũ.
5. Tối thiểu ba lifecycle/route/motion cycles ở điểm liên quan; listeners/triggers/resources không tăng dần. Hidden/offscreen dừng workload cần thiết. Kiểm tra one Canvas/producer/camera writer/HDR pass.
6. Kiểm tra asset SVG/attribution mới trên production preview, URL portable, locale parity và PWA/offline tải asset mới nếu khả dụng. Config chỉ sửa tối thiểu nếu tài sản mới bị bỏ sót; không rewrite SEO/PWA cả repo.
7. Build/lint cuối, phân biệt issue nền và regression mới. Lưu source/build fingerprint cuối cho reviewer V11; không dùng report của build trước để chứng minh build sau.

ĐẦU RA / DONE
outputs/visual-revision-2026-10-09/v10/: verification.md, matrix.md, performance.md, handoff.md và evidence thực. Từng mục PASS/FAIL/chưa kiểm chứng rõ ràng; phone GPU/nhiệt/OS motion/HTTPS public chưa thử thì ghi chưa thử. Bàn giao V11, không deploy hoặc tự đánh dấu production-ready.
```

## TASK V11 — Review độc lập cả bảy yêu cầu

```markdown
Bạn là Principal Reviewer độc lập. Chỉ thực hiện V11. Dependency: V10 đã bàn giao bản cuối và evidence. Đây là task review, không sửa implementation.
Đọc Quy ước chung và các quyết định visual trong prompts.md, AGENTS.md, baseline V0, handoff/verification V1–V10 và toàn bộ diff/source hiện tại liên quan. Gồm cả file chưa commit; không chỉ đọc Git HEAD hoặc báo cáo của worker.

SKILLS
- Repo: galaxy-portfolio, react-3d-ui để đối chiếu kiến trúc và lifecycle.
- Tùy chọn: design:design-critique, ecc:browser-qa; design:accessibility-review nếu evidence focus/reduced chưa rõ. Không bắt buộc skill code-review có workflow issue tracker hoặc setup ngoài scope.

REVIEW
1. Đối chiếu riêng bảy yêu cầu: Hero typography/dash/glitch; final O/BH diagonal; portal hút-đẩy-reverse; Education art/glow/mapping; meteor scale/cyan/wake; Works figure-hover-preview; finale scale và BH/Contact endpoint.
2. Kiểm chứng trên bản chạy cuối, tới/lùi và interactions thật nếu công cụ có. Kiểm tra các gate đã duyệt, không coi build pass hoặc ảnh đẹp ở một frame là đạt animation cả chuỗi.
3. Kiểm tra artwork là vector thật, HIP/anchors/provenance/license có bằng chứng, không fake higher-res master hoặc NASA accuracy. So Source/baseline V0 để phát hiện thay đổi ngoài scope: Skills, EDURA, audio, Contact copy/actions, Footer.
4. Kiểm tra keyboard/touch/reduced/fallback, route restore, one Canvas/producer/camera writer, resource cleanup; đối chiếu performance với cấu hình thật. Số đo không tái kiểm được phải được đánh dấu giới hạn, không xác nhận hộ.
5. Findings phân Blocker/Major/Minor: file và dòng hiện tại, bước tái hiện, expected/actual, evidence, task owner cần xử lý. Không tự sửa code, chạy task khác hoặc dựng issue tracker.

PHẠM VI / ĐẦU RA
Chỉ tạo outputs/visual-revision-2026-10-09/v11/final-review.md, requirements-matrix.md, verification.md và handoff.md; dòng tiến độ qua integrator hoặc append tuần tự nếu đang là reviewer duy nhất.
Kết luận PASS local với giới hạn cụ thể, hoặc NOT PASS với task phải sửa. Không tuyên bố phone/HTTPS/deploy đã pass khi chưa thử. Báo task/owner tiếp theo cho người dùng; không tự thực thi.
```

## Sau V11

Nếu review phát hiện lỗi, giao lại đúng owner của task và kiểm tra lại phần liên quan. Khi bảy yêu cầu visual đã được duyệt và không còn Blocker/Major, mới lập riêng danh sách công việc cuối để phát hành: nội dung còn thiếu, thiết bị thật, HTTPS/deploy và các mục R7.2/R8 còn phù hợp. Các bước phát hành đó **không nằm trong quyền thực thi của bộ prompts V0–V11**.
