# V3 → G1 — Bản tích hợp Hero / O / portal

> **Cập nhật 10/10/2026 — G1 mở lại; phương án mới đã chốt, chưa sửa code.** Đọc [kế hoạch G1/G2](../../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md): opening vòng sáng tâm→O, năm chủ đạo không border/vệt chậm dài, text/Nav chuỗi+dải xoắn. Giữ stars intake và O/BH; G1 phải được review lại trên bản sửa. G2 cũng chưa duyệt, V9/G3 chưa bắt đầu. Bàn giao và gallery bên dưới là lịch sử V3; baseline tích hợp hiện tại là [V8 handoff](../v8/handoff.md), không chạy lại V5/V6/V7 theo trạng thái cũ.

09/10/2026. **Chỉ thực hiện V3. Chờ người dùng duyệt G1; chưa thực hiện V5/V6/V7.** V4 giữ quyền làm độc lập. Đường dẫn trong tài liệu tính từ gốc repo.

## Bản review

- App chạy ở origin localhost của phiên review, cổng **5183**, đường dẫn `/`.
- Gallery cùng bản source: `outputs/visual-revision-2026-10-09/v3/review.html`. Có 8 mốc và ảnh hai hướng ở 390/1440/1920, Vi/En. Gallery là ảnh checkpoint tĩnh; không trình bày chúng như clip/FPS.
- `verification.md`, `browser-results.json`, `browser-lab-results.json`, `scope-results.json` ghi bằng chứng và giới hạn. Server chỉ phục vụ local, chưa deploy.
- Final App100frames/61comparisons, Lab16frames/8comparisons, thêm2fallback PNG; `final-evidence.json` xác nhận22source hashes hiện tại và118PNG/45dist files. Build5.79s, lint0errors/2warnings cũ. Source đã chốt sau font guards; callbacks đã cleanup không được đo/ghi lại DOM.

## Ownership và phạm vi

V1/V2 đã bàn giao và dừng ghi source trước tích hợp; không dispatch lại hai worker. V3 giữ typography/contours/star dots/5 contour meteors/decode/glitch của V1. V2 ray shader, disk frame, ray/copy/mask, target đủ drawing buffer và quality được bảo toàn; chỉ sửa writer `uPortalCenter` trong BlackHole để tâm O tiến về tâm viewport. Không áp dụng lại patch worker lên source đang có.

| File | Thay đổi V3 |
|---|---|
| `src/3d/utils/portal.js` | Pha chung, visibility, growth, control gate và hàm intake analytic |
| `src/3d/utils/cameraPath.js` | Portal 400vh; tiếp cận/cong/thoát theo p, giữ pose About đã có |
| `src/components/effects/PortalHeading.jsx`, `src/styles/hero.css` | Intake từng lớp/glyph; giữ O anchor đứng yên; tránh scrollbars khi stretch; O thường chỉ trong fallback |
| `src/components/About.jsx` | Một About thật; bù vị trí flow ở inner frame, eject heading/avatar/bio; gate focus theo p |
| `src/components/layout/Nav.jsx`, `src/components/Cursor.jsx` | Hút wrapper control/cursor; skip ở ngoài; vô hiệu hóa control bị hút; neutral auto-hide trong portal; dừng pointer tween khi vào portal |
| `src/App.jsx` | Tách About khỏi gate rest-reading; portal 400vh/static 100vh; fallback readiness khi restore |
| `src/3d/components/BlackHole.jsx` | Nội suy tâm O → UV(.5,.55), trước ray trace, không remap lại texture |
| `src/3d/GalaxyScene.jsx`, `StarField.jsx`, `Nebula.jsx` | Backdrop hiện tại đi vào/đẩy ra; screen-space differential warp/tidal streak theo p |
| `src/stores/useScrollStore.js`, `SceneFallback.jsx` | Cờ fallback thật; không coi DOM dự phòng bên trong canvas là lỗi WebGL |
| `src/3d/hooks/useScrollProgress.js` | Rebuild/remeasure khi static mode đổi; giữ producer/seek/history contract |
| `src/3d-lab.jsx` | Dùng shared About thật và cùng phase/path; giữ HUD kiểm tra của Lab |

Không đổi asset V4, content/locales/avatar, package/config, audio engine, Skills, Education, Experience, Works, EDURA route/schema, Contact, Footer. `Hero.jsx` không cần thêm patch V3. Các thay đổi V1/V2/V4 có sẵn trong git working tree không phải đều do V3 tạo; `scope-results.json` đối chiếu predecessor để phân biệt.

## Contract đang chạy

`portalProgress(chapter,p,frozen)` giữ API: Hero→0, portal→p hoặc1 khi static, các chapter sau→1. `portalState(p,out)` giữ object reuse; bổ sung `intake/eject/center/backdrop/aboutOpacity/aboutInteractive/controlsOpacity/controlsInteractive`.

| Pha | Behavior |
|---|---|
| 0..0.44 | Các glyph/lớp Hero + Nav/cursor + background hội tụ theo đường cong, stretch; CameraRig tiến tới exterior close pose; O growth1→120 |
| 0.44..0.50 | Dark core, mọi visual story bị che; đổi mini/full mapping tại .47, không đổi ảnh/shader hoặc xuyên singularity |
| 0.50..0.94 | Star eject đến .70; heading .54.. .78, avatar .60.. .86, bio .66.. .94; camera tới About |
| 0.94..1 | About identity/layout ổn định; Nav/cursor hiện lại .90.. .96, control interactive từ .96 |

About visible khi p>.54; root không nhận focus trước .84. Bản static mở About bình thường, không hút/zoom. Rest-reading vẫn gate đến cuối portal để không Tab vào section chưa xuất hiện. Skip-link ngoài wrapper hút luôn có đường keyboard tới `#about`.

### Một writer cho mỗi property

- Producer hiện có → store chapter/p/anchor. Một producer cho mỗi App/Lab; manual seek tạm giữ producer, native mode resume.
- CameraRig priority−1 → camera pose/FOV. Không camera tween thứ hai; helper trả pose trực tiếp.
- BlackHole → shared ray uniforms/target; copy và mask đọc cùng HDR pixel. V3 không thay target resolution, RK4, bloom/composer hoặc mask.
- PortalHeading → **wrapper/glyph intake**, không ghi transform của digit/noise/meteor/twinkle do V1 sở hữu. Last-O/heading/content ancestors không transform, producer đo cap slot ổn định.
- About → inner frame/three groups, không transform `#about` hoặc chapter marker. Không còn `.play()`/once reveal tranh opacity/y. Copy không bị scramble theo random khi stop/reverse.
- Nav outer wrapper → intake; nav inner auto-hide giữ writer riêng và neutral ở portal. Menu dialog nằm ngoài intake, vẫn giữ focus trap/scroll lock.
- Cursor outer wrapper → intake; pointer child tween hoàn tất trước khi vào portal; lens ẩn trong intake.
- Background uniforms → p; time của Hero/portal xác định bằng p, ambient sau portal được ghi riêng.

Các transform DOM được ghi trực tiếp trên những node đã được đăng ký cleanup trong `useGSAP`; không JSX inline styling, không tween/time simulation cho portal. Đo lại chỉ ở fonts/resize/refresh/ResizeObserver, không đọc rect mỗi frame. Inner About `translateY=−(1−p)*portalRange` đưa chính nội dung thật lên viewport; về identity ở p=1, footprint/range/Nav target vẫn đứng yên.

### Fallback / route

Store chỉ thêm `sceneFallback` và setter equality-guard; không thêm engine/producer/snapshot. SceneFallback bên ngoài Canvas báo true; alternate HTML trong canvas không báo true. Static portal 100vh, finale 0vh; Hero/năm tĩnh, fallback có O trắng, nội dung vẫn đọc được. Live reduced media giữ p qua remeasure. Context-loss giữ fallback đến reload như trước.

EDURA snapshots/canonical focus IDs/orbit unchanged. Restore sẵn store trước mount; App seek sau measure và đợi Canvas hoặc fallback, không replay intro. Không chỉnh schema/native history.

## Giới hạn cinematic

Tham khảo [NASA SC24 — Black-hole flight](https://www.nas.nasa.gov/SC24/research/project19.php): hình ảnh accretion/photon ring và camera approach truyền cảm hứng cho đường đi. Đây là portal cinematic: vật thể DOM/backdrop được warp trong screen-space, observer luôn ngoài horizon (minimum ≈8.183 rs trong self-check); ejection và rebase không phải quá trình vật lý thoát khỏi chân trời sự kiện. Texture khí vẫn procedural của pipeline hiện có, không render NASA gốc. Không blur/white flash/ảnh BH thứ hai để che chuyển mapping.

## Điểm dừng

Người dùng cần duyệt **Hero, O, glitch và portal tới/lùi** ở G1. Nếu cần chỉnh thẩm mỹ, tiếp tục trên phạm vi V3 này rồi cập nhật evidence. Chỉ sau xác nhận G1 mới giao V5/V6/V7 theo dependency; V5/V7 còn cần V4. Không suy việc im lặng thành duyệt.

Chưa đo FPS V3, điện thoại thật, OS motion/screen reader/Safari/Firefox hoặc HTTPS. V2 đã báo shader full resolution nặng trên UHD630; V3 giữ độ nét, không dùng báo cáo FPS cũ làm số đo hiện tại. V1 đã ghi lỗi Nav/Sound ở text200% ngoài phạm vi V1; vẫn cần audit V10, không tuyên bố a11y toàn trang hoàn tất.
