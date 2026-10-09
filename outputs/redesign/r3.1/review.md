# R3.1 — independent source review

Ngày 08/10/2026. Review read-only sau cleanup và rà lại source cuối sau sửa tương phản, đối chiếu `baseline.json` và `before/` hiện tại; không chạy Browser song song, không sửa source/AGENTS. Kết quả: **không thấy blocker/major trong phần diff cuối đã đọc**. Source do reviewer kiểm độc lập; số đo Browser bên dưới được đọc từ bằng chứng Agent tích hợp đã tạo.

## Phạm vi và integrity

- Fresh baseline gồm 101 file. Hiện 29 path khác baseline: **21 file sửa + 8 file xóa**, 72 file giữ nguyên SHA-256.
- 8 file xóa đúng caller đã đối chiếu: CockpitRails, KnurledSwitch, ThemeToggle, MissionProgressOrbit, StardustWake, Constellations cũ, Planet, OrbitalSkills. Không còn import runtime vào path xóa.
- Static scan import relative/alias trên toàn JS/JSX: **0 local import path thiếu**. Scan không thay build parser nhưng phù hợp kết quả root build hiện có.
- Giữ exact hash CameraRig/cameraPath, useScrollProgress/useScrollStore, BlackHole/System/BloomMask/ray shader, portal/finale/WorksConstellations/data mới, lab JSX/HTML, locale/config, audioEngine/useAudioStore, dependencies/Vite, avatar/project/PWA/icon assets. Không thấy sửa camera/shader HDR/dependency/content data ngoài scope.
- `tools/check-stores.mjs` là thay đổi kiểm chứng hợp lệ: dùng store thật, resolve Vite alias cho Node, đổi light assertions sang dark/bootstrap/blocked storage/preserve consent. Không thêm framework/check suite.

## Caller, UI và hạ tầng giữ đúng

- App gỡ controls + lazy scene set-pieces, refs và props chết; About/Skills không còn param/window/pause dead. GalaxyScene giữ children API vì LabTelemetry vẫn dùng.
- Skills gỡ vector/HUD/active link state và listeners, giữ danh sách orbitalSkills thật + ba nhóm nội dung cho R4. Data tool/năng lực không bị xóa.
- GalaxyScene gỡ đúng hai module cũ; StarField/ShootingStars/Nebula/HDR/WorksConstellations/new story backdrop/visibility/fallback/tier giữ. ShootingStars chỉ đổi output sang `vec3(1)`; pool/schedule/event/reduced behavior không đổi.
- Nav/Menu đổi mặt tối/kính, bỏ progress orbit; navigation handlers, auto-hide, skip, focus restore/trap, lang buttons, dialog lock/Escape không đổi.
- SoundToggle chỉ đổi phần icon/dial/GSAP thành speaker SVG mono tĩnh. Switch/ARIA/status/selectors/toggleSound/resetAudio lifecycle giữ; không đổi persistence hoặc mặc định opt-in của engine.
- Cursor chỉ thêm `.avatar-img` vào selector và sửa comment. R/G displacement map/filter, VIEW/magnetic, desktop fine/touch/reduced guards và listener cleanup giữ exact behavior.
- Work/Contact chỉ đổi classes/tokens màu và kính. Reticle/terminal/equalizer/content/action/trigger vẫn giữ đúng giới hạn R5.2/R7.2. contactProgress writer và readers production còn nguyên.
- Source cuối dùng nền đặc `bg-(--bg-void)` trong wrapper nội dung đang có của About/Skills/Experience/Work/Contact để bảo vệ vùng đọc trước đĩa sáng. Đây là CSS neutral #050505, không blur/kính, không thêm HUD và không đổi camera. `integrity.json` xác nhận normalized content/action/timeline Work/Contact giữ đúng baseline.

## Fixed dark và mono

- HTML/body khai báo dark từ static document; critical background/meta scheme dark; bootstrap đồng bộ trước CSS/main ghi dark dù saved light, null meta/storage blocked có guard.
- Theme store chỉ còn `theme: dark`/`applyTheme`, xóa set/toggle light; apply gỡ class light root/body, ép meta và storage. Store không còn live UI caller nhưng được giữ nhỏ cho self-check/compatibility.
- CSS gỡ light roles/amber-cyan/tint aliases và toàn bộ glass !important rules. Mounted JSX không còn glass/backdrop-blur/old accent variables. Hover/focus borders, font roles, GSAP classes, reduced CSS giữ.
- RGB gradient trong Cursor là dữ liệu displacement; không coi là màu UI. React logo/Aurora/EvilEye/SplashCursor không mount trong source graph. Project previews/portrait có ngoại lệ asset theo kế hoạch. Review không tuyên bố pixel mono chỉ dựa grep.

## Kiểm chạy thật trong review này

`node tools/check-stores.mjs` → **exit 0**:

> PASS: store defaults, progress bounds, fixed-dark bootstrap/store, blocked storage, consent/language preservation and loading isolation.

Đọc root `build.log`/`lint.log`/`scoped-lint.log`: build **4,86 giây**, PWA25 entries/sw generated; scoped lint rỗng, full lint chỉ hai warning SplashCursor cũ. Không tự chạy lại Browser/build vì root kiểm cùng môi trường.

Đọc root `browser-results.json` và `browser.log`: **32 section snapshots / 19 interaction checks / 4 shared lab poses**, `errors=[]`, mọi pose `glError=0`. Đọc `lens-pixel-results.json`: **405 pixel đổi trong lens80px, 0 pixel đổi ngoài lens**. `lens-results.json` ghi errors rỗng, touch cursor/lens0 và **165,109FPS** trên RTX4060/Edge/DPR1/1440×900 visible. Đây là bằng chứng render/interaction của root, không phải Browser chạy lại bởi reviewer; mobile/reduced-motion vẫn có giới hạn mô phỏng như verification chính.

## Ghi chú nhỏ và phần chờ

- Duplicate border Experience và khoảng trắng ShootingStars/GalaxyScene đã dọn ở source cuối; bỏ ghi chú cosmetic cũ. Không phát hiện lỗi đáng sửa mới trong lần rà lại.
- `tools/audit-phase-2-browser.mjs` là audit lịch sử vẫn mong OrbitalSkills có mặt; không dùng nó để kết luận regressions R3.1. Prompt mới cố ý gỡ behavior đó.
- Hero production vẫn là bố cục/BH legacy và ambient meteor vẫn bắt đầu trong scene legacy; R3.2 mới tích hợp portal/scheduling. About vẫn asset halo cũ/caption/tools/năng lực và border tạm; R3.3/R4 mới thay nội dung/portrait. Works reticle/Contact terminal được mono hóa nhưng chưa bỏ là phạm vi đã giao cho R5.2/R7.2, không phải completion toàn redesign.
