# Stellar Odyssey — Bản chốt tinh chỉnh G1/G2 lượt hai

Ngày 12/10/2026. Nguồn: phản hồi ảnh của người dùng và vòng `grill-me` Q1–Q5.

**Người dùng đã xác nhận bản tổng hợp và cho phép triển khai ngày 12/10/2026. Đã triển khai và kiểm chức năng lượt hai; G1/G2 chưa được duyệt visual. V9/G3 vẫn chờ.** Không dùng lựa chọn phương án thay cho nghiệm thu animation đã chạy.

## Quyết định của người dùng

| Câu hỏi | Chọn | Hướng đã thống nhất |
|---|---|---|
| Q1 | A | Preloader: ngôi sao/lớp khí co sụp → lõi tối và đĩa vật chất → hố đen thu về O. |
| Q2 | A | 2026 lớn ở lớp sau; PORTFOLI và hố đen O ở lớp trước trong cùng một dải ngang. |
| Q3 | A | Contour nền trắng mảnh luôn giữ đủ hình 2026, ruột trong suốt; vệt sáng mạnh chạy 3–4s/vòng. |
| Q4 | B | Presentation lần đầu khoảng 4,5s; mở lại khi tài nguyên sẵn khoảng 2s. Tải tài nguyên/readiness được xử lý riêng. |
| Q5 | A | PORTFOLIO nằm gần giữa chiều cao 2026, hai lớp chung lề trái. O cùng baseline với PORTFOLI. |

Phản hồi đã có: dòng chữ/Nav nhập xoắn tương đối đúng hướng và cần polish; comet đủ lớn nhưng vòng lóe rộng không chân thật; dùng particles cyan vừa phải phía sau và làm chuyển động S mượt hơn. Ảnh minh họa cho thấy câu giới thiệu có từ “ảnh.” đứng riêng.

Phạm vi này thay các quyết định tương ứng ngày 10/10: opening chỉ là vòng sáng, bỏ contour nền, lap 10–14s, năm nằm ở hàng riêng, halo 200–240px và flare theo milestone. Bằng chứng/kế hoạch cũ giữ làm lịch sử, không dùng làm bản mới đã đạt.

## P1 — Preloader sao co sụp

- Cảnh mở có ngôi sao ở tâm với cấu trúc khí/vật chất, chuyển động rõ qua ba trạng thái: bất ổn và nén → co sụp lộ lõi tối, khí xoắn thành đĩa → hố đen ổn định rồi thu/chuyển đúng O cuối PORTFOLIO.
- Presentation cold khoảng 4,5s, warm-ready khoảng 2s; warm rút gọn nhịp của cùng cảnh. Thời gian chờ font/scene tách khỏi thời lượng trình diễn; có readiness/watchdog để tránh reveal thiếu Hero hoặc kẹt loading.
- Ưu tiên mono trên nền tối, ánh sáng có cấu trúc. Ngôi sao ban đầu và khí phải thay đổi hình dáng/mật độ; kết quả không chỉ là nhiều vòng tròn đổi scale. Lõi tối/đĩa cuối phải khớp tâm, scale, hướng đĩa và hình O thật khi bàn giao sang Hero.
- Cảnh lấy cảm hứng co sụp sao như [NASA — Birth of a Black Hole](https://science.nasa.gov/asset/hubble/birth-of-a-black-hole/). Đây là choreography rút gọn cho website, không tuyên bố mô phỏng astrophysics chính xác.
- Tái dùng nền tảng/hố đen hiện có. Một Canvas R3F và một pipeline HDR; không tăng blur, white flash hay đổi sang ảnh hố đen khác để giấu điểm nối. Nếu cần nối presentation vào mapping hiện có, giữ cùng uniform/camera ownership; không tạo engine thứ hai.
- Reduced-motion/no-WebGL phải vào Hero đọc được nhanh, không bị buộc xem cảnh dài. Hidden pause, live toggle/route unmount/StrictMode cleanup an toàn. Back từ EDURA giữ trạng thái Works, không phát lại intro.

## P2 — Hai lớp Hero và độ rõ 2026

- Một khối typography chồng lớp: 2026 lớn phía sau; PORTFOLI + O ở phía trước, ngang giữa thân số, chung lề trái. Không đặt năm thành hàng độc lập bên trên/bên dưới wordmark.
- Giữ hierarchy năm lớn hơn PORTFOLIO, đủ cả bốn số ngay khi Hero xuất hiện. Contour nền mảnh nhưng có tương phản đủ nhận ra toàn bộ năm ở mọi thời điểm; ruột trong suốt, giữ chất sao và glitch 6↔7 đã có.
- Vệt sáng 3–4s/vòng, mạnh hơn bản 10–14s. Glow bám nét contour, không phủ mờ toàn khối. Độ dày/alpha và số vệt là tham số prototype cần đối chiếu ảnh ở desktop/mobile; không lấy một frame sáng nhất làm nghiệm thu cả vòng.
- O vẫn thay đúng ký tự cuối PORTFOLIO, cùng baseline/cap alignment với PORTFOLI. DOM anchor thật là nguồn measure duy nhất cho opening/HDR/intake; wrapper motion không làm sai tọa độ đo.
- Tên/role và intro nằm dưới toàn khối chồng chữ. Desktop đủ rộng: tên/role cùng hàng, intro một dòng khi vừa. Mobile: xuống dòng có chủ đích/cân đối; tránh orphan một từ, overflow hoặc thu font đến khó đọc. Giữ copy và dấu Vi/En.
- Ảnh lỗi phù hợp với `max-w-[40ch]` của intro trong Hero.jsx. Sửa sizing/wrapping theo container và typography thật; không xóa từ hoặc rút copy để làm ảnh trông vừa.

## P3 — Polish intake chữ/Nav

- Giữ storyboard portal 400vh, các pha hiện có và phễu khoảng 1,25 vòng. Giữ từng source nhập chung phễu, nội dung thật và các bản sao inert/aria-hidden.
- Làm nhịp tăng tốc/thu mảnh liên tục; giảm chồng chữ đậm tại join, đồng bộ tangent/ribbon với sau ảnh. `ribbonPath` hiện dùng index 0 trong khi sample copies dùng index nguồn; kiểm/căn lại để dòng không lệch nhau.
- Giữ pool nhỏ đang có; profile trước khi tăng copy/geometry. Không thêm damping theo frame khiến cảnh tiếp tục chạy khi dừng scroll hoặc lệch trạng thái khi reverse.
- Tới/lùi/dừng/jump dùng cùng progress và cùng pose. Giữ ejection About thật, Nav/cursor visibility/inert, menu/skip/focus, locale/resize/hash/Back contracts.

## P4 — Comet tự nhiên hơn và S mượt

- Giữ lõi sáng lớn hiện tại và đuôi đã dài từ entry. Tham chiếu cũ: lõi đo được khoảng 51px desktop/31px mobile; kiểm lại trên bản sửa, không gọi đó là số đo mới.
- Bỏ halo trắng rộng và flare theo milestone; glow mới ôm sát lõi. Bỏ pulse radial của DOM wake nếu nó tạo vòng lóe vẫn nhìn thấy; giữ ánh sáng đuôi/wake có hướng theo đường bay.
- Thêm particles cyan nhỏ phía sau, mật độ vừa phải, thưa dần về đuôi. Prototype dùng một pool giới hạn, khoảng 12–24 hạt nhìn thấy desktop và 6–12 mobile; có thể điều chỉnh trong mức “vừa phải” khi so ảnh, không tăng thành mưa hạt che chữ. Seed/progress xác định, không lịch sử simulation/random tích lũy.
- Path hiện liên tục C2 nhưng tham số theo contentY chưa cho tốc độ nhìn thấy đều. Chỉnh curve/parameterization trong helper chung để giảm tăng/giảm tốc đột ngột; giữ ba mốc công ty, đọc chữ, pre-entry và nối departure. Nếu dùng lookup chiều dài cung, cache theo layout/resize và cùng mapping cho head/trail/emphasis/wake.
- Comet và particles bám cùng progress: dừng thì đứng đúng cảnh, reverse đi lại cùng đường. Không làm mượt bằng tween/frame lerp riêng gây trễ camera hoặc drift khi stop.

## Nơi thay đổi và nơi bảo vệ

| Nhóm | Files/callers phải đối chiếu khi triển khai |
|---|---|
| Opening | `src/components/Preloader.jsx`, `src/styles/opening.css`; App/loading caller và nối GalaxyScene/BlackHole nếu cần khớp presentation → O. |
| Hero | `src/components/Hero.jsx`, `src/components/effects/PortalHeading.jsx`, `src/styles/hero.css`; final-O anchor, Lab caller, opening và intake measure. |
| Intake | `src/3d/utils/portal.js`, `src/components/effects/portalTrails.js`, `src/styles/portal-trails.css`; callers Hero/Nav/Cursor và phase consumers About/App/BH/background. |
| Comet | `src/3d/utils/storyMeteor.js`, `src/3d/components/StoryMeteor.jsx`, `src/components/sections/Experience.jsx`; App/Lab layout callers, camera/producer, tests/fixtures/pixel/resource assertions. |
| Nội dung mới nếu có | Locale Vi/En; không đổi copy hiện tại chỉ để fit layout. |

Giữ Skills/Education/Works/artwork V4, EDURA reader/route/Back, audio, Contact/Footer/copy/actions và finale hiện có. Camera/story producer/state API và HDR pipeline dùng lại; chỉ đổi wiring/measure tối thiểu khi contract bắt buộc. Không thêm dependency, router, store hoặc Canvas/composer thứ hai.

## Kiểm chứng và bàn giao cần có

- Build/lint/parity; chụp fingerprint mới, giải quyết portability đường dẫn QA và phân biệt line endings với thay đổi source. Không coi log/FPS/gallery 10/10 là phép đo của bản sửa.
- Viewports 320/390/768/1440/1920, Vi/En: đủ 2026 ngay khi reveal, PORTFOLIO/O cùng hàng, year nằm sau/giữa đúng khối, tên/intro không orphan/overflow; giữ focus/touch 44px.
- Opening cold/warm/slow font/failure/readiness/watchdog/reduced/fallback/hidden/resize; kiểm điểm nối tâm, silhouette/đĩa và tốc độ khi về O, không chỉ screenshot cuối.
- Portal tám mốc 0/.25/.44/.47/.50/.70/.94/1 cả hai hướng; rapid reverse/hold/jump/resize/menu/locale/keyboard/skip; so pose cùng p, ghi ambient khác biệt riêng.
- Comet ba company milestones và departure: đo lõi/glow thật, xem particle density/độ rõ chữ, thêm kiểm biến thiên vận tốc/gia tốc hiển thị vì C2 alone chưa chứng minh nhịp bay mượt. Native scroll, held/reverse/jump đều cần evidence.
- Ba motion/lifecycle cycles và EDURA Back; one Canvas/camera/story writer/HDR pass, particle/copy resources dispose ổn định. Đo frame time/FPS thật trên máy kiểm tra, ghi phần phone/OS/HTTPS chưa thử.
- Output đề xuất: `outputs/visual-revision-2026-10-12/g1-g2-round-2/` với verification/handoff/fingerprint/ảnh/clip/gallery của cùng build. Bản mới xin duyệt lại G1/G2; chỉ sau duyệt mới tiếp V9.

## Skills và trạng thái

- Interview: `grill-me` → `grilling`. Skill yêu cầu: “Do not act on it until the user confirms you have reached a shared understanding.” Người dùng đã xác nhận chung hướng và yêu cầu triển khai; điều kiện của skill đã được đáp ứng.
- Repo skills theo đường dẫn tương đối: `tools/codex-skills/react-3d-ui/SKILL.md`, `tools/codex-skills/galaxy-portfolio/SKILL.md`. Quyết định người dùng mới hơn ưu tiên so với palette/glow hoặc kiến trúc lịch sử trong skill.
- Đã triển khai và ghi bằng chứng mới tại `outputs/visual-revision-2026-10-12/g1-g2-round-2/`; chưa G1/G2 approval, chưa V9/G3.

## Bàn giao bản đã chạy

[Gallery](../outputs/visual-revision-2026-10-12/g1-g2-round-2/review.html) · [Verification](../outputs/visual-revision-2026-10-12/g1-g2-round-2/verification.md) · [Handoff](../outputs/visual-revision-2026-10-12/g1-g2-round-2/handoff.md). Code/kiểm chức năng hoàn tất; intake khoảng 33 FPS trên Intel UHD 630, còn cần profile trên phần cứng mục tiêu. Chưa G1/G2 visual approval, chưa V9/G3, chưa commit/push lượt này.
