# R3.1 — caller và giới hạn dọn source

Audit đọc trực tiếp source ngày 08/10/2026 sau R2.4; không sửa source hoặc AGENTS. Đây là bằng chứng caller, chưa phải kiểm chứng Browser/render của R3.1.

## Caller hiện tại và thay đổi nhỏ nhất

| Module | Caller thực | Hành động trong R3.1 |
|---|---|---|
| CockpitRails | `src/App.jsx:20,67` | Gỡ import và render. Không caller lab. MET interval, GSAP gyro, Lang/Sound/Theme knurled controls đều nằm trong module này. |
| KnurledSwitch | `src/components/layout/CockpitRails.jsx:10,298,453,461` | Chỉ cockpit dùng; gỡ file khi cockpit đã được gỡ. Không thay bằng control trang trí mới. |
| ThemeToggle | `src/App.jsx:19,66` | Gỡ cả control mobile `lg:hidden`, không chỉ cockpit desktop. |
| MissionProgressOrbit | `src/components/layout/Nav.jsx:9,150` | Gỡ import/render; không caller khác. Giữ toàn bộ Nav navigation, focus và auto-hide. |
| Constellations cũ | `src/3d/GalaxyScene.jsx:10,81` | Gỡ import/render/file; chỉ GalaxyScene dùng. Taurus/Cygnus/Orion/Sagittarius và contact fade cũ không được đưa vào scene mới. |
| StardustWake | `src/3d/GalaxyScene.jsx:12,85` | Gỡ import/render/file. Không đụng Cursor lens. |
| Planet | `src/App.jsx:24,72` | Gỡ lazy import, child, ref `aboutPlanet:29`, prop tại `About:81`. Gỡ About `planetAnchor` param (`src/components/About.jsx:8`) và placeholder `data-planet-window:90–96`. |
| OrbitalSkills | `src/App.jsx:23,73` | Gỡ lazy import, child, ref `skillsOrbit:28`, Skills prop tại `App:82`; gỡ param `orbitAnchor` và nguyên window/pause checkbox (`Skills:158–165`). Checkbox không còn consumer sau gỡ model. |
| useSectionAnchor | chỉ `Planet.jsx:4,7` và `OrbitalSkills.jsx:6,30` | Không còn caller runtime sau gỡ model, nhưng kế hoạch mục13 và R2 handoff nêu hook này để reuse neo DOM. Giữ hook, không tạo helper thay thế. |
| orbitalSkills data | `OrbitalSkills.jsx:7,54`, `src/components/sections/Skills.jsx:7,206` | Giữ `src/data/skills.js` và `PORTFOLIO_DATA.tools`. DOM vẫn dùng danh sách, R4 cần dữ liệu tool/năng lực; không xóa theo model. |
| WorksConstellations mới | `GalaxyScene.jsx:11,76`, dữ liệu `src/3d/data/worksConstellations.json` | Giữ; R2.3/R2.4 dùng story=true. Không nhầm chòm mới với `Constellations.jsx` cũ. |

App sau gỡ hai set-piece không cần render-prop children truyền quality; `<GalaxyScene />` đủ cho production hiện tại. **Giữ API children của GalaxyScene**: lab còn dùng `<LabTelemetry>` (`src/3d-lab.jsx:99`), shared scene không được chặn children vì App đã không dùng.

## Dark từ đầu tải

- `index.html:61` vẫn nạp `/theme-init.js` đồng bộ trước CSS/main. Giữ đường bootstrap, đổi thành dark cố định; xử lý saved `stellar-theme=light` trước render/CSS, set hoặc xóa root theme nhất quán, bỏ root light/class light nếu có và giữ meta `#050505`.
- `index.html:54` hiện `color-scheme=dark light`; đổi `dark`.
- `src/styles/globals.css:48–64` còn toàn bộ `[data-theme='light']` roles; gỡ/khóa light roles để descendant hay stale attrs không tạo mặt sáng. Các primitive neutral dark, font/token semantic còn dùng nên giữ.
- Theme store live callers chỉ CockpitRails/ThemeToggle. Sau gỡ chúng, store không được main/App tự import. Nếu giữ module fixed-dark làm compatibility thì API action không được sinh light và bootstrap phải tự đủ. Nếu xóa module phải đối chiếu thêm `tools/check-stores.mjs` vì checker cũ import và kiểm light API. Không để checker cố khẳng định light là hành vi hợp lệ sau đổi spec.
- `src/main.jsx:3,8` `registerSW({ immediate: true })`, manifest/Vite/PWA icons/SEO không cần sửa cho việc gỡ toggle. Không thay localStorage Sound/Lang.

## Màu và kính cần dọn tận nguồn

| Nguồn | Vị trí / ảnh hưởng | Giới hạn sửa |
|---|---|---|
| globals | `globals.css:14–17,79–81,99–101`: amber, tint lệch xanh `rgba(10,10,16,.38)`, border cyan, public aliases | Bỏ accent có màu hoặc chuyển consumer thật sang white/neutral; giữ token còn dùng với giá trị neutral nếu section migration chưa đến. |
| CSS chung | `index.css:102–145`: `.glass-card`, `.glass-tab`, active/hover cyan và blur !important | Không chỉ xóa class JSX hoặc chỉ gỡ border. CSS !important có thể khôi phục blur/màu khi section hover/focus. Dọn nguồn theo phạm vi redesign, còn layout/interaction giữ cho task section sau. |
| Nav | `Nav.jsx:102,141`: blur nền; menu glass-tab + hover cyan | Nền tối/neutral, bỏ kính/chrome; giữ hit size44/focus/Nav autoshow. |
| Menu | `MenuOverlay.jsx:173`: nền rgba + backdrop-blur-2xl | Có thể thay mặt dark cố định; không đổi dialog logic/focus trap/Escape/lock/lang. |
| Skills | `Skills.jsx:166–264`: vector HUD, pulse dot, active/link text, cyan SVG/glow/focus; `277–285`: glass groups/hover bars | Window/pause dead phải gỡ ngay. Vector structure/card đầy đủ do R4 thay, nhưng màu/caption HUD trang trí không cần chờ. Giữ tools/competencies/technical text và keyboard button behavior nếu danh sách tạm giữ. |
| About | `About.jsx:74,87,99,136,162`: portrait/info/tools/pills glass | Gỡ kính trong cleanup có thể giữ bố cục/txt/reveal nguyên; portrait asset/halo/tools transfer/bio redesign do R3.3/R4. |
| Education/Experience | `Education.jsx:76`, `Experience.jsx:63,72` glass | Neutral style cleanup; không dựng chòm/story mới trong R3.1. |
| Contact | `Contact.jsx:118–193`: cyan terminal labels/buttons/feedback/equalizer | Đổi màu neutral bây giờ; nội dung terminal và equalizer chỉ gỡ ở R7.2 như prompt riêng đã giới hạn. Giữ copy/mail actions, audio opt-in, ScrambleText và contactProgress writer hiện tại. |
| Work reticle | `TargetLockReticle.jsx:69,73,74`: cyan focus token/amber flare | Neutral bây giờ, module/trigger/brackets do R5.2 thay. Không xóa reticle trong task này. |
| ShootingStars | `ShootingStars.jsx:27–29`: `mix(vec3(.7,.95,1),vec3(1),...)` | Sửa màu output trắng, giữ pool/useFrame/visible/reduced/events; user cấm xóa sao băng. |

Không cần đổi bất kỳ shader ray black-hole, CameraRig, cameraPath, progress contract, HDR target/composer hoặc quality tier. Meteor fragment là shader riêng và output màu là ngoại lệ sửa được yêu cầu rõ.

## Giữ lens, Sound, Lang và navigation

- `src/components/Cursor.jsx:19` lens selector hiện là `[data-project-image], main h1, main h2, [data-project-card] h3`; About avatar hiện **chưa nằm trong selector**. Có thể bổ sung selector ảnh avatar đang có nếu muốn đúng phạm vi heading/ảnh, không thay DOM hit/focus. Hero fallback (`Cursor:89–94`) bắt vùng heading dù Hero pointer events passthrough.
- Lens SVG `#ff0000/#00ff00` ở `Cursor:23–29` là dữ liệu kênh R/G cho `feDisplacementMap`, **không phải màu được render lên UI**. Không thay bằng grayscale vì sẽ làm mất displacement độc lập hai trục.
- Lens dùng desktop fine pointer, coarse/maxTouchPoints guard; filter/lens DOM chỉ mount khi không reduced (`Cursor:244–256`). Cursor mono/VIEW vẫn còn khi reduced, magnetic không chạy transform khi reduced. Delegated listeners cleanup hiện có phải giữ.
- `SoundToggle` còn caller Nav (`Nav:8,131`); resetAudio chỉ chạy khi SoundToggle unmount. Gỡ cockpit không được unmount Nav hoặc gọi resetAudio/reset preference. Dial ở SoundToggle là control chức năng, không phải KnurledSwitch/cockpit module.
- Tuy không import KnurledSwitch, dial này vẫn có 24 vạch, hai vòng và metallic gradient giống knurled chrome. Thay riêng phần icon bằng speaker SVG mono tĩnh là cleanup hợp lý; giữ button switch/ARIA/status/store/actions/useEffect, bỏ `dial` ref/useGSAP rotation/dependencies nếu không còn animation. Không cần thêm control hoặc state mới.
- MenuOverlay giữ hai nút Vi/En và global useLangStore; không mất khả năng đổi ngôn ngữ khi gỡ switch bên cockpit. R3.1 chưa cần thêm control mới.
- `contactProgress`: gỡ reader trong chòm cũ **không** có nghĩa xóa store/writer. Contact/CameraRig/BlackHole còn dùng production legacy cho đến R3.2/R7 tích hợp story.

## Mã có màu nhưng không phải render hiện tại

`Aurora.jsx`, `EvilEye.jsx`, `SplashCursor.jsx`, `src/assets/react.svg` không có caller trong App/lab/current source graph; không gom chúng thành lỗi UI mới chỉ vì grep thấy màu. Không sửa/xóa component không liên quan để đạt giả định grep=0. Ảnh sản phẩm nguyên màu và màu chân dung khi tương tác là ngoại lệ thiết kế đã chốt; phép kiểm màu phải loại riêng các vùng asset này.

## Kiểm chứng root cần thực hiện

Storage light→reload: đo ngay bootstrap root/body/meta và sau load; `320/390/1440/1920`, Vi/En, fresh/live reduced; snapshot không cockpit/orbit/wake/chòm cũ, render mono ngoài asset exceptions. Native Tab/ShiftTab/Escape/Menu restore/auto-hide, Sound first-click opt-in/mute/reload persistence; hover heading/project image (và avatar nếu bổ sung) kiểm displacement trong80px/ngoài0 và hitbox không đổi. Lab story R2.2 portal/R2.3 Works/R2.4 finale smoke cần giữ một Canvas/camera writer/HDR ray pipeline. Build/scoped lint; đối chiếu baseline hiện tại để không nhận thay đổi task trước là mới.
