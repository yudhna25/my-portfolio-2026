# Stellar Odyssey — Tinh chỉnh G1/G2 trước V9/G3

> **Cập nhật triển khai 10/10/2026:** P1–P4 đã hoàn tất code và kiểm kỹ thuật/local theo lệnh “bắt đầu kế hoạch tinh chỉnh g1-g2”. Opening tâm→O, năm lớn/contour chậm dài, intake chuỗi+dải và comet lớn/S liên tục đã có trong bản tích hợp. **G1/G2 vẫn chờ người dùng duyệt visual lại; V9/G3 chưa bắt đầu.** [Verification](../outputs/visual-revision-2026-10-09/g1-g2-implementation/verification.md) · [Ảnh/clip](../outputs/visual-revision-2026-10-09/g1-g2-implementation/review.html).

Ngày: **10/10/2026**. Nguồn: phản hồi visual của người dùng và phỏng vấn `grill-me`, Q1–Q11 trong phiên này.

**Lịch sử phiên Q12: người dùng đã chốt phương án tổng hợp ở Q12 — “Chốt phương án, chưa sửa code”.** Chỉ lập phương án, chưa sửa code. G1 được mở lại để tinh chỉnh, G2 yêu cầu cải thiện Experience và chưa được duyệt. V9/G3 chưa được phép bắt đầu. Chốt ý tưởng trong tài liệu này không thay thế duyệt visual trên bản chạy mới.

Tài liệu này ưu tiên trong đúng phạm vi dưới đây so với mô tả V1/V3/V6 cũ trong [prompts.md](../prompts.md). Giữ bằng chứng các phiên cũ; không gọi phương án là animation đã triển khai hoặc đã kiểm chứng.

## 1. Phạm vi và quyết định đã chọn

| Câu hỏi | Người dùng chọn | Quyết định để làm prototype sau khi thống nhất |
|---|---|---|
| Q1 | A — Vòng sáng → O | Thay việc đóng rèm rồi hiện Hero bằng một cảnh liên tục: vòng sáng trở thành O hố đen cuối của PORTFOLIO. |
| Q2 | A — Năm chủ đạo | 2026 là lớp chủ đạo phía sau: bề rộng mục tiêu 1,25–1,35 lần PORTFOLIO, chiều cao phần số nhìn thấy gần 2 lần chữ PORTFOLIO. Mobile vẫn đủ bốn số. |
| Q3 | A — Kết hợp chuỗi + dải | Bản sao mờ nối đuôi và dải kéo dài cùng tạo dòng hút; đầu chuỗi còn nhận ra chữ, gần O trở thành sợi mảnh liên tục. |
| Q4 | C — Comet rất lớn | Desktop: lõi sáng 48–56px, halo 200–240px. Đây là kích thước phần sáng nhìn thấy, không chỉ kích thước plane chứa vùng trong suốt. |
| Q5 | A — Nhịp thích ứng | Mở lần đầu khoảng 1,6–2,0s; mở lại khi tài nguyên sẵn khoảng 0,8–1,0s. Không ép chờ đủ 2s mỗi lần. |
| Q6 | B — Rất chậm, lưu sáng dài | Meteor trên contour năm: một vòng khoảng 10–14s, đuôi 30–40% đường contour từng số; giữ sao bên trong, bỏ viền cố định. |
| Q7 | A — Nhánh → phễu chung | Chữ và từng mục Nav thành các nhánh nhập vào một phễu quanh O, khoảng 1–1,5 vòng xoắn. Không giữ bản sao đậm dày đến tận lõi. |
| Q8 | A — S liên tục qua ba mốc | Giữ ba mốc công ty, đường S lượn liên tục, nối mềm sang departure. Comet/camera/chữ vẫn chung tiến độ cuộn. |
| Q9 | A — Nở sáng mềm | Halo nở rồi dịu trong một nhịp dài khi qua công ty; lõi trắng, cyan nhẹ ở đuôi. Không chớp sáng toàn màn hình. |
| Q10 | A — Từ tâm màn hình → O | Vòng sáng khởi đầu giữa màn hình, thu nhỏ và chuyển tới O; Hero mở phía sau khi vị trí/hình sáng khớp, không cắt cảnh. |
| Q11 | A — Bay vào, đuôi đã dài | Comet đi vào từ ngoài khung với đuôi đã hình thành; tại công ty đầu tiên đã có đầy đủ dáng comet. Xử lý ngoại lệ đuôi ngắn V6/V8. |
| Q12 | Chốt phương án, chưa sửa code | Xác nhận bản tổng hợp Q1–Q11; chưa triển khai và chưa nghiệm thu visual G1/G2. |

Thông số trên là hướng/khoảng đã chọn cho prototype, không phải kết quả đo mới. Tỷ lệ, độ sáng và thời lượng cụ thể sẽ được đối chiếu trên các viewport trước khi xin duyệt G1/G2 lại. Không tự hạ cấp lựa chọn comet C về A.

Phần giữ nguyên: vẻ sao bị hút hiện tại; O hố đen sắc nét và lõi tối; đoạn đẩy ra About; nội dung, ngôn ngữ, âm thanh opt-in, Skills, Education, Works/preview, EDURA reader/Back và các section khác. Người dùng đánh giá các phần còn lại tương đối ổn, **không đồng nghĩa đã duyệt G2** hoặc cho phép tự redesign các phần này.

## 2. Vì sao bản hiện tại cần thay đổi

Đây là kết quả đọc source hiện tại, không phải tái đo Browser/FPS trong phiên lập phương án.

| Vấn đề | Cơ chế hiện tại và điểm sửa gốc |
|---|---|
| Preloader → Hero thiếu nối cảnh | `Preloader.jsx`: count 2s, reveal 0,32s, watchdog 2,4s; chỉ báo hoàn tất sau rèm. `App.jsx` truyền `active={!loading}`; `PortalHeading` giấu heading rồi đặt opacity về 1 khi active. Có thể lộ Canvas/Nav trước khi heading xuất hiện. Cần một đoạn bàn giao có chồng hình và điều kiện sẵn sàng, không chỉ tăng fade của rèm. |
| 2026 yếu hơn PORTFOLIO | `hero.css`: year 5,6032em × 1,3312em so với composition 7,05em, nominal width khoảng 79,5%. `.hero-year-base` có stroke 0,6px/opacity 0,24 và chứa pattern sao; bỏ stroke phải giữ sao nội bộ. Meteor hiện 4–5,2s/vòng, đuôi 36/1000 = 3,6%, quá ngắn so với hướng mới. |
| Text/Nav bị hút vẫn là khối phẳng | `portalIntake` trong `src/3d/utils/portal.js` trả một affine transform cho mỗi node: dịch, xoay, scale, opacity. Nav bị biến đổi theo khối; không có chuỗi bản sao/strip uốn liên tục. Chỉnh easing của khối cũ không tạo được dải xoắn người dùng yêu cầu. |
| Meteor chưa đủ lớn và trơn | `StoryMeteor.jsx`: plane halo 80px desktop/52px mobile, bright core 16px/10px; không có nhịp flare riêng tại từng công ty. `sampleStoryMeteor`: từng đoạn dùng cubic smoothstep khiến vận tốc ngang về 0 ở mỗi waypoint, độ cong không nối liên tục. Tăng số samples đơn thuần không sửa nhịp khựng này. |
| Đuôi ngắn ở công ty đầu | `writeStoryRibbon` giới hạn lịch sử đường bay bởi thời điểm sinh q=0. Tail trưởng thành đặt mục tiêu 42% viewport width, nhưng đầu hành trình chưa có đủ đường phía sau. V6/V8 ghi 6,23% desktop/14,60% mobile tại milestone đầu; đó là bằng chứng cũ, chưa được xử lý trong phiên này. |

Nguồn để đối chiếu: `src/components/Preloader.jsx`, `src/App.jsx`, `src/components/effects/PortalHeading.jsx`, `src/styles/hero.css`, `src/components/layout/Nav.jsx`, `src/components/Cursor.jsx`, `src/3d/utils/portal.js`, `src/3d/components/StoryMeteor.jsx`, `src/3d/utils/storyMeteor.js`, `src/components/sections/Experience.jsx`.

## 3. Storyboard đã chọn

### 3.1 Mở màn: vòng sáng từ tâm vào O

1. Một vòng sáng mono trên nền tối ở giữa màn hình; đủ đơn giản để render ngay. Vẫn có cách hoàn tất hoặc fallback khi font/WebGL/tài nguyên chậm hoặc thất bại; không dùng phần trăm giả để che thời gian tải.
2. Khi sẵn sàng, vòng thu nhỏ và chuyển theo một đường liên tục đến **vị trí O đo từ Hero thật**. Hình ảnh năm, sao và PORTFOLIO được lộ dần phía sau trong cùng đoạn chuyển.
3. Khớp vị trí, tỷ lệ và mức sáng trước khi trao hình ảnh cho O hố đen đang có. Không nhảy camera, không hai O chồng lệch, không khung đen trống giữa hai cảnh.
4. Hero ổn định, tên/intro/Nav hiện đồng bộ; nhận scroll/focus trở lại. Các animation idle tiếp tục pha đang có, không reset đồng loạt gây giật ngay sau mở màn.

Khoảng 1,6–2,0s / 0,8–1,0s là thời lượng trình diễn, **không bảo đảm tài nguyên tải xong trong thời gian đó**. Cách nhận biết lượt tải nhanh/chậm là chi tiết triển khai; không tạo cờ tồn tại vĩnh viễn khiến một lượt tải chậm bị coi là nhanh. Giữ watchdog/fallback và không khóa người dùng vô hạn. Giữ một Canvas/một camera writer; không thêm scene mở màn độc lập.

### 3.2 Hero: năm lớn, chỉ sao/vệt sao tạo hình

- Nâng hierarchy của 2026 theo Q2; đo phần chữ/số nhìn thấy, không chỉ so bounding box có nhiều khoảng rỗng. Giữ O, Nav và nội dung trong vùng an toàn khi năm lớn lên.
- **Bỏ stroke/border cố định của năm trong chế độ motion đầy đủ.** Sao nội bộ được giữ; không thay viền cũ bằng một viền mờ thường trực khác.
- Contour meteors chạy 10–14s/vòng, đuôi 30–40% chiều dài contour từng số. Lệch pha để đầu sáng/đuôi đủ đọc đường cong, không đồng loạt biến mất làm mất cả năm.
- Giữ glitch 6↔7 và quy tắc pause hiện có; không thêm glitch/cyan/amber mới cho năm. Tinh chỉnh nhịp vệt sao không phải cho phép đổi nội dung 2026.
- Mobile: thu theo chiều rộng/vùng trống để bốn số không bị clip hoặc overflow. Reduced-motion/no-WebGL giữ 2026 đọc được bằng hình sao tĩnh phù hợp, không giữ các dash/twinkle đang chạy. Đây là ngoại lệ tĩnh về khả năng đọc, không khôi phục border thường trực cho bản motion.

### 3.3 Portal: chuỗi sau ảnh nhập vào dải xoắn

1. Lúc bắt đầu cuộn, nội dung thật vẫn nhận ra được. Chữ, từng mục Nav và những phần tiền cảnh Hero tạo nhánh sau ảnh mờ nối tiếp từ đúng vị trí đang đứng.
2. Nhánh kéo dài, cong dần và nhập vào một phễu chung quanh O. Đầu nhánh còn mang hình chữ; phía gần O hẹp, giảm opacity, thành dải gần liên tục.
3. Phễu xoắn khoảng 1–1,5 vòng, có cảm giác trước/sau và thu nhỏ vào tâm. Lõi BH vẫn thấy rõ; không dùng khối chữ quay nguyên bảng hoặc nhiều bản sao đậm che tâm.
4. Dải biến mất bên trong O trước đoạn tối/đẩy ra About; đảo cuộn phục hồi đúng hình và thứ tự. Giữ phần sao đã được người dùng đánh giá ổn.

“Vô số bản sao” được thể hiện bằng cảm giác chuỗi liên tục với **pool hữu hạn**, không tạo vô hạn DOM nodes hoặc allocation mỗi frame. Chọn biểu diễn strip/instance/bản sao tối thiểu đủ hình ảnh trong prototype; không chốt renderer mới khi chưa thử. Các bản sao đều trang trí (`aria-hidden`, inert, pointer-events none), không nhân đôi link/nút, âm thanh hoặc Tab stops.

Phạm vi “mọi thứ” ở đây: các lớp đang nhìn thấy tại Hero (năm/chữ/tên/intro/indicator), từng điều khiển Nav và cursor theo contract hiện có; sao vẫn dùng intake cũ. Không hút các section phía dưới, reader, menu đóng hoặc tạo bản sao toàn ứng dụng. Menu mở/focus cần bàn giao an toàn theo quy tắc tương tác hiện tại.

Giữ portal 400vh và các ranh giới intake/core/eject hiện có làm điểm xuất phát: intake 0–0,44, core 0,44–0,50, eject 0,50–0,94. Ưu tiên thay biểu diễn trong intake; không tự mở rộng thời lượng cuộn. Nếu prototype cần đổi mốc để dải xoắn kịp đọc, đưa lý do và ảnh/clip vào review; đổi mốc phải tích hợp đồng bộ tất cả consumer, không sửa riêng DOM.

### 3.4 Experience: comet rất lớn và đường S liên tục

- Desktop: lõi nhìn thấy 48–56px, quầng 200–240px. Cấu trúc sáng: lõi trắng sắc, halo nở mềm, gas/đuôi có cyan nhẹ đang được phép; tránh một quả cầu blur lớn làm mất cảm giác tốc độ.
- Giữ ba waypoint công ty đã đo từ DOM. Thay easing từng đoạn bằng một đường nối có tangent và độ cong liên tục; các mốc vẫn khớp công ty/wake và không dừng ngang tại từng đoạn.
- Đi vào từ ngoài khung với phần đuôi dài đã hình thành. Bổ sung đoạn đường trước entry có chủ đích, không lấy frame history/random để kéo đuôi; cùng progress luôn cho cùng hình tới/lùi. Đuôi trưởng thành 42% viewport width là baseline để so, không phải tăng thêm vô hạn.
- Khi qua công ty, halo nở rồi dịu theo một dải progress dài; brightness/wake đồng bộ. Cuộn chậm, nhanh, dừng và đảo chiều không gây lóe kép hoặc animation thời gian chạy tiếp độc lập.
- Departure nối cả hướng và nhịp với cuối Experience. Không thêm một bộ lọc lerp riêng để che discontinuity: camera/chữ/comet vẫn cùng producer.
- Mobile thu kích thước theo khoảng trống thật, vẫn nổi bật hơn bản 10px/52px hiện tại; xác nhận bằng hình, không cố giữ halo desktop 240px che chữ trên 390px.

Không đổi meteor nền, ambient stars, BH core, camera story hoặc composer để làm comet này lớn hơn. Reduced-motion/no-WebGL giữ đầy đủ nội dung/wake tĩnh thích hợp, không comet bay hay flare chạy. Audio vẫn opt-in, không thêm tiếng nổ/âm thanh mới.

## 4. Phân rã công việc tại phiên Q12 — lịch sử trước triển khai

| Bước | Phạm vi dự kiến cần tới | Bàn giao / điều kiện |
|---|---|---|
| P1 | `Preloader.jsx`, `PortalHeading.jsx`, `Hero.jsx`, CSS Hero và chỗ nối `App.jsx` khi cần | Một tiến trình mở màn/thông báo ready, giữ store loading hiện có; không thêm loader store/Canvas. Năm và O vẫn cùng projection đo thật. |
| P2 | `portal.js`, `PortalHeading.jsx`, `Nav.jsx`, `Cursor.jsx`; biểu diễn 3D chỉ trong `src/3d/` nếu cần | Cùng tiến độ, cùng anchor, pool trang trí hữu hạn, cleanup/focus/reverse; không thêm camera/progress writer. Tích hợp file chung tuần tự. |
| P3 | `StoryMeteor.jsx`, `storyMeteor.js`, `Experience.jsx` và checker hiện có | Curve/entry/tail/flare/wake cùng contract layout; App và Lab dùng nguyên renderer. Không đổi ownership bằng cách copy renderer. |
| P4 | Kiểm tra bản tích hợp hiện tại | G1 mở màn/năm/portal + G2 meteor mới; regression Skills/Education/Works/EDURA Back, không tự viết lại các section. |
| Duyệt lại | Người dùng xem bản chạy + ảnh/clip cùng source/build | Chỉ sau G1/G2 mới đã được duyệt mới xét bắt đầu V9. G3 vẫn là gate sau V9, không phải tên cho vòng sửa này. |

Các đường dẫn là phạm vi cần kiểm tra, không phải quyền sửa mọi file ngay. Phiên này chỉ thay tài liệu/trạng thái. Không mở worker ghi code, không thay asset V4, locale/content, package/config hoặc source/public.

## 5. Tiêu chí nghiệm thu đã dùng cho bản tinh chỉnh

| Nhóm | Cần chứng minh |
|---|---|
| Opening | Cold/warm/slow font-WebGL và fallback; clip liền từ preloader đến Hero, không frame trống/pop/nhảy O; scroll/focus không kẹt; thời lượng báo cáo phân biệt tải thật và trình diễn. |
| Năm | 320/390/768/1440/1920px: đủ bốn số, tỷ lệ hierarchy, không static stroke, contour dài/chậm; chụp cả pha vệt ngắn nhất và giữ 7. Không dùng một ảnh đẹp để giả full-cycle pass. |
| Portal | Cuộn chậm/nhanh/dừng giữa intake; forward→reverse→forward nhiều lần, resize và menu/focus; cùng progress cho cùng hình, không copies/hit targets tồn dư; BH core sắc và sao giữ hình đã ổn. |
| Meteor | Đo lõi/halo thật ở cả ba công ty, entry có đuôi; clip từ trước Experience đến Works cho thấy curve/wake/departure liên tục. So trajectory derivatives quanh waypoint; tăng samples không đủ bằng chứng. |
| Motion/lifecycle | Ba chu kỳ reduced↔normal, hidden↔visible, mount/unmount/reader Back; không GSAP context, buffers/materials hoặc clone tồn dư. Reduced không có vòng chạy, twinkle, hút/xoắn hoặc comet bay. |
| Bản tích hợp | Build/scoped lint/repo lint/console/WebGL/resources, native mouse/touch/keyboard, EDURA Back focus/selection/scroll/orbit. FPS render + frame-time khi opening/intake/flare hoạt động, trên một source/build; không dùng FPS cũ V8 làm kết quả sửa. |

Không hứa mọi animation luôn mượt trên mọi thiết bị. Giữ chất lượng BH, đánh giá frame pacing/khựng hình trước khi tối ưu bottleneck; desktop viewport trên RTX4060 không thay kiểm điện thoại thật.

## 6. Design tree và trạng thái duyệt

```text
G1/G2 yêu cầu sửa — CHỈ LÊN PHƯƠNG ÁN
├─ Opening: Q1 A → Q5 A → Q10 A
├─ 2026: Q2 A → Q6 B (bỏ border, giữ sao nội bộ)
├─ Intake: Q3 A → Q7 A (nhánh/chuỗi → phễu chung)
└─ Experience: Q4 C → Q8 A + Q9 A → Q11 A
   └─ Q12: người dùng xác nhận bản tổng hợp — ĐÃ CHỐT, CHƯA SỬA CODE
       └─ triển khai riêng theo yêu cầu sau đó → kiểm tích hợp → duyệt G1/G2 lại
           └─ V9 → G3 (chưa bắt đầu)
```

Không còn lựa chọn visual mở từ các nhánh Q1–Q11; những thông số kỹ thuật nhỏ để prototype quyết định bằng đo kiểm, không giả chúng đã được người dùng duyệt từng giá trị. **Q12 đã được người dùng xác nhận ngày 10/10/2026.** Việc duyệt kế hoạch không tự cho phép bắt đầu sửa code trong phiên chỉ lập phương án này.

Baseline/bằng chứng cũ: [V8 verification](../outputs/visual-revision-2026-10-09/v8/verification.md), [V8 handoff](../outputs/visual-revision-2026-10-09/v8/handoff.md). Kiểm chứng tài liệu phiên này: [planning verification](../outputs/visual-revision-2026-10-09/g1-g2-refinement/verification.md).

## 7. Bản triển khai đã kiểm — 10/10/2026

| Bước | Kết quả hiện tại | Bằng chứng |
|---|---|---|
| P1 | Cold1.8s / warm-ready0.9s, vòng tâm→O đo thật, watchdog/fallback/reduced; year/PORTFOLIO≈1.30, bỏ stroke cố định normal, tail35%/lap10–14s | 5viewport320–1920, full-cycle4/8/12/16s, 7font/WebGL/reduced cases |
| P2 | Pool6/8 afterimages/source, nhánh thu vào funnel1.25vòng, originals/contour không còn đứng lại, inert/focus/cleanup | 33,272math checks, native forward/reverse/menu/resize, 12ảnh intake |
| P3 | Core51px/halo223–225px desktop; mobile31/121px, tail≈42vw tại ba công ty, C2S/entry/departure và flare theo progress | 16,963math checks +6pixel poses, clip Experience→Works |
| P4 | Build pass; lint0errors/2warnings cũ; 402main+49extras, 6EDURA Back/disposal, 3motion cycles, 0unexpected console/WebGL errors | Source/build hashes, 56protected files giữ nguyên, 132PNG+2WEBM decode/hash |

FPS actual R3F trên Edge/RTX4060/DPR1: opening165.35, Hero165.09, intake132.43, meteor164.54; sample cuối không frame>16.7ms. Đây là đo ngắn trên máy dev, không thay kiểm điện thoại thật. Không sửa camera/producer/BH/ambient/Skills/Education/Works/EDURA/copy/V4assets. Không thêm dependency/Canvas/store.

Lệnh triển khai mới đã thay giới hạn “chỉ tài liệu” của phiên Q12 trong đúng P1–P4; các phần lịch sử ở trên được giữ để truy nguyên quyết định. [Verification](../outputs/visual-revision-2026-10-09/g1-g2-implementation/verification.md), [handoff](../outputs/visual-revision-2026-10-09/g1-g2-implementation/handoff.md), [gallery cùng build](../outputs/visual-revision-2026-10-09/g1-g2-implementation/review.html). Native OS motion lần mới/phone/Safari/Firefox/HTTPS chưa kiểm. G1/G2 chờ duyệt lại; V9/G3 giữ chờ.
