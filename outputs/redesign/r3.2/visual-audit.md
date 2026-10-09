# R3.2 — Audit typography / motion trước tích hợp

08/10/2026. Read-only source audit; chưa kiểm render R3.2 production. Root tích hợp sở hữu `src`/`AGENTS.md`; audit này chỉ ghi tài liệu.

## Nguồn đã đọc và frame đã xem

- `AGENTS.md` mới nhất xác nhận R3.1 đã hoàn tất; App hiện `story=false`, Hero vẫn tên lớn/exit cũ.
- Kế hoạch mới mục 3, 12–13, 15; Quy ước chung bắt buộc trong `outputs/prompts-redesign-r0-r8.md`; R1.1 `handoff-notes.md`, `measured-anchors.json`, phần Hero/glitch trong frame manifest và generator.
- `src/components/Hero.jsx`, `effects/PortalHeading.jsx`, `Cursor.jsx`, `hooks/useGSAPSetup.js`, locale `hero.*` Vi/En; shared `3d/utils/portal.js`, `BlackHole.jsx`, `BlackHoleSystem.jsx`, `BlackHoleBloomMask.jsx`, shader portal remap/aperture; R2.2 verification/handoff; R3.1 handoff.
- Skills đọc cho phần audit: frontend-design, gsap-react, gsap-scrolltrigger, react-3d-ui. Tái dùng font/stack/ngôn ngữ đã chốt, không đề xuất theme hoặc package mới.
- Đã mở ảnh thật bằng image viewer: `outputs/redesign/r1.1/frames/1440/vi/hero.png`, `frames/390/vi/hero.png`, `frames/320/en/hero.png`. Đây là storyboard SVG/HTML minh họa; không phải bằng chứng production portal/glitch đang chạy.

## Constraints bố cục

| Khung tham chiếu | PORTFOLIO / tên | Năm đầy đủ | Neo O cuối |
|---|---|---|---|
| 1440×900 | Chữ x56…1384, bề ngang1328px; baseline360; tên trái x56, baseline414; role494 / tagline539 | Bounds đo x450…1381.71 / y288.25…706.18; 6 x1149.87…1380 | Tâm đo (1295.30,308.39), normalized (.89952,.34265) |
| 390×844 | Chữ x20…370, bề ngang350px; baseline240; tên x20 / baseline278; role451 / tagline487 | Bounds x67…370.41 / y285.45…419.13; 6 x294.27…369 | Tâm (346.62,225.43), normalized (.88876,.26709) |
| 320×844 | Chữ x20…300, bề ngang280px; cùng cao độ mobile, tên được reflow | Bounds x67…300.16 / y285.33…419.16; 6 x241.59…299 | Tâm (281.29,225.41), normalized (.87903,.26707) |

Các số trên là tọa độ frame để giữ thứ bậc/hướng nhìn, không hardcode vào shader. PORTFOLIO sáng nhất, năm xám ở lớp sau lệch xuống/phải; cả bốn số nằm trong frame. Mobile chủ động đẩy năm xuống dưới tên, role/tagline xuống tiếp theo để không chồng chữ khó đọc. Tại 320px không cắt chữ hoặc thu nội dung chính thành caption. Hãy đo tự nhiên bằng font thật và CSS responsive; generator SVG có `textLength` nên cỡ 137px/38px không tương đương trực tiếp với DOM không ép ngang.

O thứ ba là ký tự index8 của PORTFOLIO; hình storyboard giữ **vòng glyph O sáng**, mini BH nằm trong lòng O. Đừng chọn hai O trước, đừng dùng opacity0 trên toàn glyph nếu khiến mất vòng nhận diện. Không biến toàn heading thành ảnh/Canvas texture.

## Tái dùng tối thiểu / tránh chồng writer

1. Tái dùng `PortalHeading` với DOM production thật, fixed ngoài `#smooth-content`; giữ `data-portal-stage`, `data-portal-char`, `data-story-anchor="portal"` tại index8. Cache fixed viewport rect từ producer R2.1. Không transform riêng O hoặc font-size theo animation; hai nét gần O L/I có thể dùng contraction shared đã chứng minh.
2. Thay Hero cũ, không giữ song song `hero-exit` scrub1 + scale0.94 hay SplitText bọc/transform glyph cạnh anchor. Chữ portal dùng shared `portalState(p)` trực tiếp qua timeline paused/subscription. Một progress và một writer opacity/pose đủ.
3. Shared sample hiện h1 `11.6vw`, year `24vw`, inset24/48/80px; đây chưa phải typography final. Kiểm width tự nhiên đủ PORTFOLIO ở320 và năm ở1920; frame generator đã ép spacing/glyphs nên không sao chép cỡ chữ mù.
4. Shared shader mini aperture hiện rx=width×.52, ry=height×.48; ray core quy mô min(width,height)×.21. O sáng DOM ở lớp trước có thể tự che phần ray phía ngoài lòng O; kiểm ảnh thực counter/disk trước khi đổi shader hoặc thêm pipeline. Bloom/mask và HDR target vẫn dùng chung.
5. Theo R2.2: p0 mini/bụi → chữ fade .28… .43 → visibility về0 .43… .48 → đổi mini/full tại .52 trong tối .48… .60 → ejection .60…1. Không thay endpoint hoặc chèn gap không có diễn biến. Portal thật 1.75 viewport; About chỉ đến sau settle.

## Glitch 6 → 7

- Semantic year tĩnh `2026` bằng aria-label hoặc một sr-only span; visual year aria-hidden. `202` là ba glyph tĩnh. 6/7 chiếm cùng một slot giữ width, 7 tuyệt đối trong slot; chỉ transform/opacity đổi trong100ms. Không đổi toàn chuỗi thành2027, không aria-live, không RGB/noise màn hình.
- GSAP timeline trong useGSAP: initial delay1.5s, flash duration.1s, repeatDelay1.4s → khoảng cách bắt đầu flash1500ms. Biến dạng cục bộ tối đa1–2px đủ tạo nháy nhận biết; không rung cả năm.
- Điều kiện chạy: active sau preloader, chapter Hero, visible document, Hero trong viewport, reduced=false. Khi portal bắt đầu/offscreen/hidden, pause **và trả6 ngay**; pause đơn thuần giữa100ms có thể để7 mắc kẹt. Khi quay lại có thể restart với delay1.5s, tránh flash ngay lúc reverse settle.
- Cleanup timeline/subscription/visibility listener/observer; locale/live reduced rebuild không nhân loop. Cadence record phải đọc transitions của hai glyph thực, không chỉ kiểm timeline duration.

## Lens / accessibility risks

- `Cursor` hiện selector `main h1` và fallback Hero khi pointer event.target là `#smooth-content`. PortalHeading fixed ngoài main sẽ không tự khớp selector này; cần explicit Hero heading eligibility/rect fallback cho DOM fixed và điều kiện heading còn visible. Không để lens xuất hiện trên vùng heading vô hình ở các section sau.
- Lens backdrop chỉ bóp pixel, không transform O/container. Tại cùng font/viewport, pointer trước/sau phải giữ glyph bbox và store anchor tương ứng; tránh ảnh hưởng focus/hit target. Fine pointer desktop-only và reduced off giữ nguyên.
- H1 semantic PORTFOLIO, họ tên riêng, role/subTagline/scrollIndicator từ i18n có sẵn; thêm key PORTFOLIO/year nếu chưa có. Năm semantic không đổi do glitch.
- Direct #about/#work/#transmission phải bỏ intro/portal và đến đúng pose, không chờ preloader-intro tick để thấy thông tin. Hai ID Contact vẫn phân biệt: section `transmission`, Footer `contact`.
- Reticle/terminal/nội dung các section khác hiện còn tạm từ R3.1; R3.2 không mở rộng thành redesign chúng. Cũ `contactProgress` phải không chồng camera/intensity trong story, và meteor nền chỉ sau portal/nhường chuyển cảnh.

## Verify cần root thực hiện

- 320/390/768/1024/1440/1920 Vi/En: year/full last-digit bounds trong viewport, width PORTFOLIO, O index8/rect fixed. Hero screenshot đầu không dense starfield/chòm/BH lớn; kiểm O vẫn đọc đúng chữ.
- Cadence ≥3flash,100ms và1500msstart→start; hidden/offscreen/portal/live reduced pause/reset6;3motioncycles không nhân loop.
- Portal0/.25/.5/.75/1 desktop/mobile forward/reverse/hold; thống nhất DOM-opacity/camera/anchor/composite. Resize/locale/fonts, native lens pointer; reload hash3đích,1Canvas/1camera writer.
- Build/scoped lint/console sạch mới; warning nền/viewport mô phỏng ghi đúng giới hạn. Storyboard bounding boxes trên không tự chứng minh DoD production.

## Audit render R3.2 thật — bản inspect ban đầu

Đã mở `screenshots/inspect-1440.png`, `inspect-390.png`, `inspect-320.png` (timestamp file 08/10/2026 10:09:55…57). Đây là render ứng dụng do root cung cấp; audit chỉ xem ảnh/source, không điều khiển Browser hoặc sửa ứng dụng.

- PORTFOLIO gần hết ngang, sắc/sáng; tên nhỏ trái dưới; năm xám đủ bốn số, không bị viewport crop. Mobile390/320 giữ hierarchy, role/tagline đọc rõ. O cuối là glyph sáng đầy đủ; không còn opacity0 của mẫu cũ. Nền gần đen, không thấy dense galaxy/BH lớn/chòm sao. Các điều này đạt bằng mắt ở ba ảnh được cung cấp.
- Desktop ảnh chụp visual `2027`, hai ảnh mobile `2026`. Đây có thể là frame trong flash100ms hợp yêu cầu; không thể kết luận cadence hoặc semantic năm từ ảnh tĩnh. Source chỉ mutate `data-year-digit`, aria-label lấy năm tĩnh. Cadence/reset6 vẫn phải kiểm harness.
- **Lỗi mini BH cần root xác minh/chỉnh fit:** desktop có cụm sáng/crescent thoát ra bên trái vòng O, khoảng x1200/y305, ở khe I→O. Trong lòng O chủ yếu thấy đĩa ngang tại nửa dưới counter; vòng photon/lõi mini không hiện thành silhouette rõ như storyboard. 390/320 nhìn thấy một sọc mỏng rất nhỏ trong O nên khó nhận là BH. Cần xem crop/remap center/scale shared với cache anchor thật để BH ở gọn lòng O; giữ outer O và không fork shader/pipeline. Một ảnh tĩnh chưa chứng minh nguyên nhân math cụ thể.
- Không yêu cầu làm mini sáng/chói hơn hoặc thêm starfield: điều cần sửa là fit/silhouette, giữ typography là điểm đọc chính. So lại after render ở cùng p0 và frozen năm6 để đánh giá.

## Audit after-fit / pixel evidence (bản trước bỏ grain)

Đã mở lại đúng ba đường dẫn `inspect-*` sau khi root cập nhật shared mini scale/counter (.105 shadow; .255width/.19height). Silhouette desktop hiện có vòng/lõi tối/đĩa ngang rõ trong lòng O; không còn crescent sáng lộ khe I→O ở ảnh trước. Mobile390/320 có mini BH nhận diện được; size nhỏ là hợp vai trò portal và không giành typography. Không thấy lỗi visual blocking mới ở ba frame này; nhận xét crop/fit của bản inspect ban đầu đã được khắc phục.

`check-hero-pixels.py` chạy bằng bundled Python/Pillow, exit0; `hero-pixels.json` lưu SHA256 của từng PNG và ROI thật (không chỉnh pixel). Lõi phía trên đĩa desktop180/mobile12/9pixel đều RGBmax3…8; gutter bên phải O RGBmax13 ở cả ba; nền trống RGBmax14…21, không pixel>32. Grain overlay khiến core ở screenshot không đúngRGB0, nhưng vùng tối vẫn rất tối. Đây là các ROI thủ công có bounds ghi rõ; gutter bên phải không đại diện mọi margin của glyph.

**Không claim full PNG monochrome tuyệt đối:** full image có143435/36294/29807pixel channel difference>1, maxΔ210, chủ yếu font LCD antialias (pixel logo x37/y29=(5,5,118) ở1440) và grain tĩnh `noise::after` chứa RGB feTurbulence (ROI nền maxΔ4). Scene/GLSL mono và CSS màu xám cần xác minh riêng theo renderer/computed style; không gộp antialias/grain thành0pixel hoặc ghi sai shader thêm RGB.

## Kết luận cuối — refresh sau bỏ App fullscreen grain

Source App không còn `className="noise"`; đã rerun `check-hero-pixels.py`, exit0 và cập nhật `hero-pixels.json`/`hero-pixel-check.log` bằng hash ảnh inspect mới (1440 capture10:34:41). **201pixel core được lấy mẫu đềuRGB0**, 669pixel gutter bên phải O đềuRGB5; 325800pixel nền trống maxRGB15 và channel deviation0. Không còn RGBgrain trong các ROI kiểm. Full PNG vẫn có3441/971/971pixel channel deviation>1 (max210) do LCD text antialias; report không giả monochrome tuyệt đối toàn screenshot.

Đã mở `hero-1920-en.png`, portal forward .5/.75/1 tại1440/390. Typography đầy đủ, O vẫn rõ và mini nằm gọn counter. P=.5 là khoảng tối (Nav vẫn dùng được); p=.75 đẩy ra nhìn BH, disk sáng/lõi tối; p=1 About hiện tại đọc được theo bố cục desktop, mobile avatar trước/bio phía dưới. About vẫn wrapper/halo/copy cũ chờ R3.3; đây không phải audit About redesign. Không thấy white viewport hoặc cắt chữ tại các pose đã mở. Năm7 trong ảnh1920 có thể là100msglitch; cadence/semantic được harness riêng kiểm.

`portal-pixels-audit.json` đã refresh theo **run cuối PASS**, đọc đủ20PNG, lưu hash và diff10cặp không loại vùng: dark p=.5 exact cảhai viewport; mobilep0 exact; các cặp khác chưa exact toànảnh. Desktopp=.75 có65137pixel diff/max10, mobile534/max17; p1diff desktop155127/mobile47064pixel/max250 (About DOM entrance còn chạy), desktopp0diff28115pixel/max63 (year/ambient/controls có thể đổi). Đây là trạng thái **toàn screenshot**, không thể gán nguyên nhân chắc chắn hoặc dùng làm chứng minh reverse pixel exact. `frames-manifest.json` so riêng camera/mini/visibility/pull/center/scale/aperture/anchor/intensity: **10/10cặp exact** từ telemetry Browser; muốn full-pixel equality phải freeze thêm intro/glitch/nav/DOM entrance/ambient khi capture. Bright fraction≥245 của10forward PNG đều≤.0852; chỉ chứng minh các mẫu đã lấy không trắng toànframe, không thay thế continuous trace.

Tổng kết visual ở phạm vi R3.2: typography/O mini đạt bằng mắt trong ảnh thực, core/background mono và tối rõ theo ROI; portal tối/ejection/settle có nhịp nối đúng. Không thấy blocker visual mới. Các giới hạn pixel reversal toànDOM và ảnh mobile mô phỏng đã ghi rõ.

Refresh cuối: Browser 2026-10-08T03:59:18.606Z…04:00:16.887Z,64records; preview03:58:28.679Z…03:58:58.438Z. Cadence cuối7 tại1497.4/3000.1/4497ms, về6 sau96.8/97/97ms; aria luôn2026/prefix202. Preview HDR hai pose.25/.75 mỗi3745440components, nonfinite0/nonmono0/GLerror0; FPS165.1297/165.0418 theo renderer benchmark trong `preview-results.json`. Số này là RTX4060/DPR1/dev-browser reference, không FPS điện thoại thật. Đã mở lại p=.75desktop, p=.25reverse390 và productionHero1440 của run cuối; không thấy lỗi visual mới.

`frames-manifest.json` hiện48PNG với size/path/hash/state:12HeroVi-En widths320…1920,20portal,8production,3devjumps,2lens,3inspect; lịch sử `failure.png` chỉ diagnostic, bị loại khỏi manifest acceptance. Có thể tái chạy `refresh-frame-evidence.py` để cập nhật SHA/diff theo các file thật; script assert đầy đủ48frame/20portal/10shared exact. Không sửa source/AGENTS/verification ở audit này.
