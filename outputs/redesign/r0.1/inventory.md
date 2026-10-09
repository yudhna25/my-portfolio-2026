# R0.1 — Inventory hiện tại, file map và ownership

Audit bắt đầu 07/10/2026, bàn giao 08/10/2026 (Asia/Saigon). **Chưa sửa ứng dụng hoặc chạy R0.2/R0.3.** Quyết định giữ/gỡ dựa trên kế hoạch Q1–Q23, không dựa trạng thái hoàn thành của báo cáo phase cũ.

## Baseline và working tree

- Workspace: `D:/Projects/my-portfolio-2026`; branch `feature/stellar-odyssey`; HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb`.
- [baseline.json](baseline.json) được tạo mới lúc `2026-10-07T16:54:37.906Z`, gồm **92 file**: 72 trong src, 16 trong public, index.html/vite.config.js/package.json/package-lock.json. Mỗi file có bytes/SHA-256. Đây là snapshot working tree, bao gồm file untracked, không chỉ Git HEAD.
- [working-tree.txt](working-tree.txt): 16 mục tracked có thay đổi và 34 mục untracked ở mức hiển thị thư mục. Có 6 deletion đã staged (`public/avatar.png`, project1–3.jpg, vite.svg, src/App.css); `tailwind.config.js` bị xóa ở working tree. Giữ nguyên tất cả.
- Những file tracked đã sửa gồm eslint.config.js, index.html, package*.json, postcss.config.js, App.jsx, index.css, main.jsx, vite.config.js. Nhiều thư mục src/3d/components/hooks/i18n/stores… còn untracked; reset/checkout theo HEAD sẽ làm mất kết quả các phase.
- Build chỉ tái tạo `dist/` đang được ignore; audit chỉ thêm outputs và append tiến độ AGENTS. Không commit, stage, reset, restore, cài package hoặc deploy.
- Chạy lại kiểm bảo toàn: `node outputs/redesign/r0.1/check-baseline.mjs`. Sau khi các task redesign thật bắt đầu, check này sẽ fail nếu source khác snapshot, đó là hành vi đúng.

## Luồng và mốc DOM thực tế

```text
index.html → theme-init.js trước CSS → main.jsx → i18n/config + registerSW → StrictMode App
App → useSmoothScroll + useScrollProgress → Zustand useScrollStore
    → Preloader/Cursor/Nav/Menu/ThemeToggle/CockpitRails
    → một GalaxyScene Canvas → CameraRig → StarField/Nebula/Constellations/HDR BH/meteors/wake
    → DOM Hero → About → Skills → Education → Experience → Work → Contact → Footer
Contact ScrollTrigger → contactProgress → CameraRig + BlackHole + Constellations
3d-lab.html → src/3d-lab.jsx → useLabScroll → cùng GalaxyScene, chưa có chapter/portal/finale
```

| Khu vực | File và mốc hiện tại | Điều hướng/neo |
|---|---|---|
| Smoother | App.jsx:78–79, hooks/useSmoothScroll.js:15 | `#smooth-wrapper`, `#smooth-content`, main tabindex -1 |
| Hero | components/Hero.jsx | `#hero`, `#hero-heading`, `[data-hero-name]`; heading vẫn là họ tên |
| About | components/About.jsx:66 | `#about`, `#about-heading`, `[data-planet-window]`, `[data-parallax="crop"]` |
| Skills | components/sections/Skills.jsx:153 | `#skills`, `#skills-heading`, `[data-orbit-window]`, `[data-orbit-pause]`, `[data-constellation-grid]` |
| Education | components/Education.jsx:58 | `#education`, `#education-heading`, các item/line/node SVG; không nằm trong sections/ |
| Experience | components/sections/Experience.jsx:39 | `#experience`, `#experience-heading`, `[data-mission]` |
| Works | components/Work.jsx:101 | `#work`, `#works-heading`, `#works-grid`, `[data-project-card]`, `[data-project-image]` |
| Contact | components/sections/Contact.jsx:92 | **`#transmission`**, `#transmission-heading`, `[data-transmission-terminal]`, `[data-contact-email]` |
| Footer | components/Footer.jsx:80 | `#site-footer`; không phải một section trong currentSection |
| Menu | components/layout/MenuOverlay.jsx:162 | dialog `#stellar-menu`, không phải section câu chuyện |

`src/data/navigation.js` có đúng 7 đích theo thứ tự trên, không Playground/marquee. `useScrollProgress` đo section[id] trong smooth-content, publish currentSection theo reading line 35% viewport; `site-footer` không tạo currentSection mới.

**Route hiện tại:** main SPA `/`, các hash trên; lab là entry HTML phát triển riêng. Không có router/pathname/popstate/pushState/route EDURA trong src hoặc package router. Preview trả `/projects/edura` HTTP 200 với **cùng HTML /** qua SPA fallback, chưa phải case page. Build mặc định chỉ index.html; không suy rằng lab đã có trong dist.

EDURA hiện mở Behance tab mới (`data.js:33`, `Work.jsx:139–144`); VERIS/VIE không có href và nút case disabled. Các trạng thái này đã kiểm tra lại bằng selector action bên trong article, không nhầm href rỗng của article container với link thật. Nav/Menu tự scroll và focus, chưa có history/pose restore của case.

## Caller map giữ/gỡ/thay

Phạm vi tìm kiếm: toàn src, public/theme-init.js, index.html, vite.config.js. Bằng chứng line-level: [caller-evidence.txt](caller-evidence.txt); imports tĩnh/dynamic: [import-map.json](import-map.json). Các file source trong bảng viết theo đường dẫn dưới src, trừ khi có prefix public/index/vite. Không xóa module trước khi consumer đã được đổi.

| Thành phần | Caller/consumer hiện tại | Quyết định và task sở hữu |
|---|---|---|
| CockpitRails | App.jsx:20,67 | **Gỡ R3.1** cả OPTICAL SYS/GYRO, telemetry, ruler/gyro và khoảng chrome. Component vẫn mount trên mobile, chỉ CSS hidden lg:flex; MET setInterval và GSAP vẫn tồn tại. |
| KnurledSwitch | CockpitRails.jsx:10,298,453,461 | Lang/Sound/Theme trên rails. Không có caller ngoài cockpit trong src. Gỡ chrome cùng rails, giữ chức năng Lang/Sound qua control còn lại; không xóa audio/lang stores. |
| ThemeToggle | App.jsx:19,66; ui/ThemeToggle.jsx:18 | Control mobile `lg:hidden`; gỡ cùng dark cố định R3.1. Chỉ gỡ rails sẽ vẫn còn toggle mobile. |
| Theme store/bootstrap | CockpitRails.jsx:6,68–69; ThemeToggle.jsx:3,7–8; index.html:61→public/theme-init.js; store tự apply attr/meta/storage | **Thay R3.1** toàn chuỗi `stellar-theme`→html data-theme→CSS/meta. Saved light hiện tạo nền #FAFAFA thật; không chỉ xóa button. |
| MissionProgressOrbit | Nav.jsx:9,150→ui/MissionProgressOrbit.jsx | **Gỡ R3.1** HUD progress orbit. Subscribe store trong component cleanup được; Nav/Sound/điều hướng vẫn giữ. |
| StardustWake | GalaxyScene.jsx:11,66 | **Gỡ R3.1** wake con trỏ 150 điểm, gồm cyan. Không nhầm với gravitational lens DOM phải giữ. |
| Bốn Constellations cũ | GalaxyScene.jsx:10,63→components/Constellations.jsx | **Gỡ R3.1**, thay sáu chòm dữ liệu nguồn ở R0.2/R4.3/R5.2. Hiện Taurus/Cygnus/Orion/Sagittarius có colored points/lines, opacity theo global scroll/contact; không tái dùng nguyên geometry/timing. Cygnus mới thuộc VIE. |
| TargetLockReticle | Work.jsx:10,160→ui/TargetLockReticle.jsx | **Gỡ R5.2**, cả lock label, brackets/marker và flare amber. Component gọi playRadioClick; giữ audio helper vì callers khác cần. |
| Planet | App.jsx:24,29,72,81→About planetAnchor→About.jsx:92; Planet.jsx:31 | **Gỡ R3.1/R3.3** lazy import/ref/child/DOM anchor. Hiện chỉ mount khi currentSection=about; consumer useSectionAnchor không bị xóa cùng model. |
| OrbitalSkills | App.jsx:23,28,73,82→Skills orbitAnchor; OrbitalSkills.jsx:69; data/skills.js→orbitalSkills | **Thay R3.1/R4** cả satellites, orbit window/pause và legend/card/vector grid. Dataset còn được Skills DOM dùng, không xóa tools/năng lực trước khi migrate. |
| About tools/core skills | About.jsx:127–160→PORTFOLIO_DATA.tools/skills và about.* | **Chuyển sang R4.2**, About R3.3 chỉ giữ intro/portrait/bio. Gỡ panel/figcaption/planet nhưng không làm mất content tools. |
| Radio/equalizer | Contact.jsx:113–198; locales vi/en.json:179–180 | **Gỡ R7.2** frequency/terminal/RX TX/feedback waveform, cải thiện email/copy/mail. Không gỡ SoundToggle/audio engine vì chữ “radio” trùng tên helper. |
| contactProgress | Store:6–11; writer Contact.jsx:19–30 và cleanup:70; readers CameraRig.jsx:52,58 / BlackHole.jsx:49–50 / Constellations.jsx:308 | **Thay qua R2 contract, R3.2/R7.1 tích hợp**. Không để writer Contact cũ chồng lên progress finale mới; xóa/migrate phải xét cả 3 reader. |
| Cursor/lens/VIEW/magnetic | App.jsx:8,63; Cursor.jsx:19–21,41–44,225–255 | **Giữ**. Lens 80px, SVG displacement scale6, desktop≥1024 fine/hover và loại touch/reduced; ảnh/heading selector. Không cấm RGB dữ liệu displacement nội bộ vì đó không phải màu UI; giữ hit/focus ổn định. R3/R5 đổi selector nếu bỏ card. |
| StarField | GalaxyScene.jsx:8,60; StarField.jsx→buildStarGeometry.js / quality / scroll store | **Giữ** vỏ sao xa 280–340 đi cùng camera, 0.8–3px, density góc đều và zoom tối đa8%. Không hút toàn bộ 24k sao vào logo, R4 dùng pool riêng. |
| ShootingStars | GalaxyScene.jsx:9,65; ShootingStars.jsx→utils/shootingStars.js | **Giữ nhưng chỉnh mono/lịch R5.1**. Ambient2–3 mỗi4–7s, pool6×24 có3reactive slots; hiện shader có cyan nhạt và chạy ngay Hero. |
| Trigger meteor tương tác | Work.jsx:9,76 filter; Contact.jsx:7,74 copy và207 mail; triggerShootingStar dispatch→ShootingStars.jsx:67–74 handler→triggerReactiveMeteor | **Đối chiếu/bỏ trigger trang trí khi redesign**, không xóa ambient pool/helper đang được dùng. Story meteor/finale phải deterministic, không reuse event random. |
| HDR BlackHoleSystem | GalaxyScene.jsx:13,64; System.jsx:5,6,32–38→BlackHole/BloomMask | **Giữ** một half-float target, ray render một lần/frame, high/medium selective bloom, mask dùng cùng ray texture; R2 composite vào O bằng pipeline này, không Canvas/ray-tracer thứ hai. |
| Camera | GalaxyScene.jsx:14,59 / cameraPath.js INITIAL position:16→Canvas; CameraRig→cameraPath(0/p) | **Giữ owner, thay route R2.1**. Một writer camera; z/xy damping riêng và pointer parallax hiện chưa phù hợp story reverse xác định. |
| Scroll/DOM anchors | App.jsx:4,35→useScrollProgress; useSmoothScroll; useSectionAnchor chỉ Planet/OrbitalSkills; Lab→useLabScroll | **Tái dùng/đổi contract R2.1**. Chỉ một producer mỗi chế độ. Hook anchor hiện đòi #smooth-content, lab chưa có root này; không copy hook khác vì khó neo O. |
| Nebula | GalaxyScene.jsx:12,61–62; Nebula.jsx:56–58 | **Tái dùng chất liệu**, time-based uTime của ambient không dùng nguyên cho finale cần tua ngược. Scene hiện luôn mount cả2layer. |
| SceneBoundary/Fallback/tiers | GalaxyScene.jsx:4–7,26–55; SceneBoundary→Fallback | **Giữ** WebGL fallback + tiers/DPR/context-lost. Boundary class là API React error-boundary đang có, không rewrite thành function không bắt lỗi. |
| Sound | Nav.jsx:8,131→SoundToggle; CockpitRails→useAudioStore; UI/helpers còn gọi playRadioClick | **Giữ opt-in** singleton audio/lib + useAudioStore; SoundToggle unmount resetAudio, lưu ý khi thêm route không dispose do removing rails. Không autoplay từ preference đã lưu. |
| Language/i18n | CockpitRails→useLangStore; MenuOverlay→setLang; config.js subscribe store→i18n→html/title/description | **Giữ** control Menu sau gỡ rails, Vi mặc định/En; sau route case cần metadata riêng và Back restore, tránh config ghi đè title case. |
| PWA/SEO/assets | main.jsx:3,8→registerSW; vite.config.js:3,11→VitePWA; index.html metadata/icons/JSON-LD | **Giữ**, R6/R8.3 rà lại fallback/cache ảnh mới. Research ở outputs không copy nguyên public. |

Palette/glass cần dọn tận nguồn: `styles/globals.css:14–17,48–64,99–101`, `index.css:102–145` cùng các class trực tiếp #00F0FF trong Nav, ThemeToggle, CockpitRails, Skills, Contact và shaders wake/constellation/meteor. Gỡ token đơn lẻ không đủ. `--color-electric-cyan` đang tham chiếu `--spectrum-cyan` nhưng không có declaration của biến đó trong src; các màu cyan hardcode vẫn còn. RGB map của lens giữ riêng để không vô tình mất bóp méo.

Các file Aurora/EvilEye/SplashCursor còn nằm trong src nhưng không phải App render trực tiếp. Hai warning lint SplashCursor không chứng minh effect đó đang chạy. Không xóa các file này trong audit. `FloatingObjects` không có trong source hiện tại; report 3.3/3.4 cũ không chứng minh component vẫn tồn tại.

## Asset và nội dung cần bàn giao

Đã xem file thật, kiểm decode/dimensions/alpha bằng ImageMagick; [asset-audit.json](asset-audit.json).

| File | Kết quả hiện tại | Việc tiếp theo |
|---|---|---|
| public/avatar.webp | 800×1000, 112382 bytes, sRGBA/alpha; vòng trắng/halo xanh và hình tam giác dưới giày đã nằm trong pixels | R0.2 cutout sạch, giữ khuôn mặt/tư thế/quần áo. Không chroma-key tất cả pixel xanh: xanh trên áo/đồng hồ/giày thuộc người cần giữ. R3.3 đổi asset, CSS border alone không xóa halo. |
| public/icons/pr.png | 101×101, 16211 bytes, alpha, logo ba cánh **DaVinci Resolve** | `data.js:61` dùng videoEditing chung, label Premiere/DaVinci còn gộp. R0.2 chuẩn bị logo Premiere đúng và tách R4.2; không đổi tên file giả là đã đúng. |
| project1.webp | 1600×1131, 51014 bytes | EDURA cover gốc; giữ màu sản phẩm. Case pack còn thiếu, R0.3 kiểm source/claim thật. |
| project2.webp | 1600×900, 62292 bytes | Cover VERIS nói về viết trải nghiệm/cảm xúc; `data.js:38–41`, Vi/En:63 mô tả social/feed/privacy. **Gap cần xác minh copy**, không tự rewrite và không coi claim chữa lành trên cover là hiệu quả đã chứng minh. |
| project3.webp | 1600×900, 43608 bytes | VIE cover gốc; giữ ảnh nguyên màu trong preview/case theo quyết định. |
| Work img attrs | Work.jsx:153–154 gán cả3ảnh width1600/height1000; frame aspect16/10/object-cover | Khác intrinsic sizes thật. Crop có chủ đích giữ flow nhưng metadata cần đúng khi migrate R5/R8.3; audit này không sửa và không khẳng định CLS đã đo. |

R0.3 đọc inventory EDURA đã có: 26 file/24 nội dung, không full gallery119modules. APMS15–17 là đối thủ; gần60% là nguồn ngoài OnCourse Systems, kỳ vọng hài lòng không phải outcome. `data.js:30` còn claim Excellent UX chưa có nguồn. Giữ các gap trong báo cáo trước khi xuất bản, không chế screen/metrics.

## Ownership cho các Agent sau

| Owner | Phạm vi ghi file | Quy tắc bàn giao |
|---|---|---|
| Một Integration Engineer | App/entry; GalaxyScene; CameraRig/cameraPath; scroll stores/hooks; Nav/Menu/route; locale/config/CSS chung; theme/SW config | Một người ghi tại một thời điểm. Scene nhận anchor/progress/state, không import DOM section. Thay contract phải báo mọi consumer. |
| Asset/Technical Artist R0.2 | outputs/redesign/r0.2/ portrait/logo/geometry/source manifest | Không ghi src/public trong task chuẩn bị; đưa manifest cho người tích hợp. Không tạo camera/Canvas/scene controller. |
| Content Editor R0.3 | outputs/redesign/r0.3/ EDURA content/source/asset index | Không ghi locale/data source trực tiếp khi chạy song song R0.2. Phân biệt verified/missing trước R1/R6. |
| Section/3D implementer | Đúng component/path của task R3–R7 sau nhận contract; tài nguyên shader/geometry cần thực tế | Tái dùng lab implementation, không orbit/portal/finale engine thứ hai. Shared App/scene/locale modifications chỉ sau bàn giao tuần tự. |
| QA reviewer R8 | reports/ảnh/trace; fixes theo task audit có quyền, review cuối đọc-only | Báo số đo/config/giới hạn và mất dữ liệu ngoài scope; không tự deploy hoặc mở nhiệm vụ mới. |

Append AGENTS của hai task R0.2/R0.3 phải tuần tự qua owner tích hợp, dù output asset/content có thể song song. Ownership chỉ là bảng bàn giao, không thêm state/task manager/runtime abstraction.

## Rủi ro đã quan sát, chưa sửa

| Rủi ro | Bằng chứng và hệ quả | Owner sửa |
|---|---|---|
| Camera hiện dựa fraction toàn trang | useScrollProgress:21–23, CameraRig:52–69; thêm section/scroll distance đổi pose mọi nơi | R2.1 mốc chapter thực, một producer; R3/R7 integration |
| Đảo chiều chưa deterministic | Camera zEase/xyEase theo delta khác lookAt; pointer parallax; StarField approach damping | R2.1 cùng progress/pose story, ambient tách riêng và pointer nghỉ transition |
| BH lớn ngay Hero/Skills | GalaxyScene luôn mount BH/two Nebula/Constellations; ảnh desktop Hero/Skills xác nhận | R2.2/R3.2 visibility theo chương và O composite, không gỡ pipeline |
| HDR shader full-screen NDC | BlackHole_copy plane2×2, uniform observer/camera matrix; centerz=-200 | R2.2 reuse target/mask cho O; scale mesh không đủ, ray observer luôn ngoài chân trời |
| Contact cũ đẩy camera/brightness | Contact timeline progress→z−2/uDiskIntensity1→1.45/constellation opacity | R3.2/R7.1 bỏ writer/readers cũ khi contract mới vào, không chồng timeline |
| Reduced tĩnh vẫn render | GalaxyScene frameloop always khi visible; BlackHole useFrame vẫn gl.render; Browser reduce đo363POINTS submissions/2.2s | R2/R8.2 phân biệt static look với dừng GPU, không claim idle0frames hiện tại |
| Hidden/offscreen chưa đồng nghĩa | Hidden Canvas never, meteor/wake unmount; cockpit chỉ CSSẩn vẫn MET/GSAP theo progress; ambient BH chạy ở mọi visible section | R3.1 gỡHUD, R5/R8.2 scene scheduling; reduced/hidden/lifecycle verify lại |
| Lab producer/anchor khác App | Lab useLabScroll ghi globalscroll, App GSAPticker writer; anchor đòi smooth-content không có ởlab | R2.1 một producer mỗi chế độ/manual scrub, reuse anchor phù hợp lab |
| Idle→finale chưa có state | Works hiện grid/filter; không orbital phase snapshot/seed deep Contact | R2.3 chốt pha một lần, R2.4 deterministic, R5/R7 reuse |
| Copy feedback sai dù lỗi | Contact.jsx:73–84 catch clipboard sau đó setTransmitted(true), timer không cleanup | R7.2 feedback đúng kết quả/fallback/i18n, không báo DELIVERED giả |
| Input/menu/hash/history | Nav/Menu scroll/focus nhưng chưa route/case Return; App loading có scrollTo0 | R6.2 phục hồi Works không replay intro; R8.1 jump/reload/Back |
| Saved light còn áp dụng | Browser isolated storage light→htmltheme light/body rgb250/metaFAFAFA | R3.1 bootstrap+store+classes/meta, không chỉ gỡ toggle |
| Nội dung không khớp | VERIS cover khác description; EDURA claim và source gap ở trên | R0.3 xác minh EDURA; R5.2 cần xác minh VERIS copy trước xuất bản |
| Cache/gallery/metadata | Workbox glob toàn WebP/PNG/etc; case gallery vào public sẽ vào precache; i18n config đặt main title; chưa Vercel route config | R6.2/R8.3 tránh cache thừa, main/case SEO và fallback thực |

R0.1 không có tiêu chí nghiệm thu portal/finale mới: chúng chưa được triển khai. Ảnh/FPS của baseline cũ chỉ dùng đối chiếu sau này, không là bằng chứng redesign PASS.

## Điều kiện bàn giao

R0.2/R0.3 có thể bắt đầu từ baseline và inventory này; tài liệu kế hoạch/skills/nguồn vẫn là đầu vào bắt buộc. Không chặn hai task chuẩn bị bởi Browser connector bị lỗi vì đã có Edge fallback và giới hạn ghi rõ. Không tự chạy R0.2/R0.3 trong phiên R0.1.
