# R3.1 — Cleanup visual, giữ hạ tầng

**✅ Xong riêng R3.1**, 08/10/2026. Đây là cleanup trước tích hợp Hero/sections; chưa kết luận toàn redesign hoàn thành.

Đọc AGENTS mới nhất, kế hoạch mục 2/12–13, quy ước prompts, R0.1 inventory/R2.1 contract/R2.4 handoff và caller thật. Áp dụng frontend-design, gsap-react, accessibility và Ponytail full: không thêm dependency/abstraction/engine, giữ GSAP cleanup, semantics/focus/reduced-motion và một scene/camera writer.

## Baseline và phạm vi

[baseline.json](baseline.json) tạo mới lúc **2026-10-08 02:18:20 UTC**, sau R2.4. Snapshot 101 file src/public/HTML/config/package/check-stores trong `before/`; `agents-before.txt` lưu nguyên AGENTS trước phiên. HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb`. Working tree đã có thay đổi và staged deletions từ trước; không reset, stage hoặc commit.

[integrity.json](integrity.json): **72 hash giữ nguyên, 21 file sửa, 8 file gỡ**; HEAD và hash staged binary diff giữ nguyên. Các file camera/path/scroll/store progress, HDR/ray shader/portal/finale, lab, WorksConstellations mới, locale/data, audioEngine/audioStore, dependencies/Vite/main/PWA assets và avatar/covers giữ nguyên. Work/Contact sau loại phần class/style có **nội dung, action, timeline/contactProgress giống hệt snapshot**. Không ghi src/public asset mới.

Caller đã lần trước khi gỡ: [caller-audit.md](caller-audit.md); review độc lập: [review.md](review.md). Không còn import local thiếu; build parser pass. Không dùng checker Phase 2 còn kỳ vọng OrbitalSkills làm DoD mới.

| Thay đổi | Kết quả |
|---|---|
| HTML/theme-init/theme store/globals | Static dark class/attribute, critical dark background trước CSS/module, scheme/meta #050505; saved light được đổi sang dark; bỏ light roles và actions toggle/setTheme. Storage bị chặn vẫn dark. |
| Global HUD/set pieces | Gỡ CockpitRails/KnurledSwitch/ThemeToggle/MissionProgressOrbit, StardustWake, Constellations cũ, Planet/OrbitalSkills và anchor/window/pause chết. Không HUD thay thế. |
| Surface/color | Gỡ glass !important rules, accent/tint cyan/amber, JSX glass/blur. Các wrapper nội dung sẵn có có nền #050505 đặc để giữ khả năng đọc. |
| Scene | Giữ StarField/ShootingStars/HDR/WorksConstellations mới/quality/visibility/fallback. Chỉ đổi output màu meteor thành trắng; pool/timer/event/useFrame không đổi. |
| Interaction | Giữ Nav auto-hide/dialog trap/Escape/section focus, Sound opt-in/persistence, Lang, Cursor/VIEW/magnetic/lens. Sound icon thành loa mono; lens bao gồm avatar và giữ nguyên RGB displacement data. |
| Skills tạm | Bỏ vector network/HUD/hover state giả; giữ 10 nhãn từ dataset và ba nhóm nội dung cũ cho R4. Không làm logo/stars/skills redesign trong phiên. |

## Lệnh đã chạy

```text
npm run build
npm run lint
npx eslint <17 file JS/JSX sửa + tools/check-stores.mjs>
node tools/check-stores.mjs
node outputs/redesign/r3.1/verify-integrity.mjs
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
node outputs/redesign/r3.1/verify-browser.mjs
node outputs/redesign/r3.1/verify-lens.mjs
<bundled python> outputs/redesign/r3.1/check-lens-pixels.py
```

[build.log](build.log): pass, Vite **4.86s**, sinh `dist/sw.js`/manifest, precache **25 entries / 2214.83 KiB**. [scoped-lint.log](scoped-lint.log): exit 0, không issue. [lint.log](lint.log): full lint 0 error/2 warning SplashCursor cũ. Check-stores pass defaults/clamp/fixed dark/SSR/missing meta/blocked storage/preserve Sound+Lang. Check-integrity pass scope/HEAD/index/content.

## Browser và ảnh thực

Chrome DevTools plugin không tìm được Chrome stable. Browser CUA kernel cũng lỗi `MXC launcher ... G:\ ... os error 87`. Dùng **Edge 154.0.4258.62 / Playwright đã cài**, không cài Browser/dependency. Preview production ở 127.0.0.1:4173; dev server sẵn có 127.0.0.1:5173. Đây là fallback render/thao tác Browser thật, không source-only mock.

[browser-results.json](browser-results.json), [browser.log](browser.log): **32 snapshot section, 19 nhóm kiểm tra tương tác, 4 pose lab, 0 console/page/WebGL error mới**. Lượt cuối 02:35:41–02:37:38 UTC. Warning duy nhất là THREE.Clock deprecated có sẵn.

| Kiểm tra | Bằng chứng |
|---|---|
| 320/390/1440/1920 normal | Hero/About/Skills/Work/Contact: 20 pose, 0px overflow, theme/body/meta dark, 0 HUD/kính cũ, CSS foreground/background/border/shadow neutral. |
| Vi/En + keyboard | Menu cả 4 viewport: 24 Tab/Shift+Tab mỗi viewport không thoát dialog, đổi En bằng click/Vi bằng Enter, Escape về trigger; link About bằng Enter focus đúng section. |
| Native Nav/Sound | Wheel xuống ẩn nav (bottom0), cuộn lên hiện (top0); Space bật/tắt/bật Sound. Reload giữ preference ON nhưng `isStarted=false`, aria-checked false: vẫn cần opt-in document mới. |
| Saved light / first paint | Preview seed light + audio ON; trì hoãn assets/CSS/React 1.5s: body RGB5/meta050505/storage dark trước module, audio preference nguyên. SW ready rồi reload có controller, vẫn dark/consent nguyên. |
| Cursor/lens/magnetic | VIEW trên EDURA; lens 80×80 active tại Hero/portrait/project image và tắt trên nav. Hitbox bằng nhau khi hover đã settle; Work scale1.05 cũ vẫn giữ. Native magnetic translate≈4.8px, radial≤8. |
| Reduced-motion | Fresh reduce + 4 lượt live on/off; About/Skills/Contact ở đủ 4 viewport (12 pose), nội dung còn/0 lens/meteor bay bị gỡ. Mobile width320/390 không cursor/lens; thêm context desktop touch1440 cũng 0/0. |
| Render mono | Reactive meteor thật có aAlpha>0; đọc toàn Canvas 1440×900 có **0 pixel RGB lệch**, max channel difference0. CSS palette mounted DOM cũng không accent màu. |
| Shared lab | Portal .5 / Works0 / finale .75 / Contact1: đúng chapter/progress, camera finite, 1 Canvas/1 writer, WorksConstellations mới còn, GL error0. Không coi smoke này là rerun toàn R2 QA. |

Ảnh ở [screenshots](screenshots/), đã mở/xem frame đại diện Hero/About/Skills/Work/Contact, Menu En320, mobile/reduced và scene meteor. Ví dụ [Hero1440](screenshots/1440-hero.png), [About1440](screenshots/1440-about.png), [Contact1920](screenshots/1920-transmission.png), [Skills320 reduced](screenshots/320-skills-reduced.png), [Menu320 En](screenshots/320-menu-en.png), [first paint](screenshots/production-before-modules.png).

Trong lượt đầu, ảnh thực lộ chữ Contact/About bị đĩa sáng lấn sau khi gỡ glass. Đã sửa bằng nền tối đặc của vùng nội dung sẵn có và chạy lại ma trận. Không che bằng một HUD hoặc sửa camera.

## Lens pixel và số đo

[lens-results.json](lens-results.json), [lens-pixel-results.json](lens-pixel-results.json): dừng Canvas/GSAP trong realm kiểm chứng, giữ cùng compositor/filter, so displacement **6→0**. **405 pixel đổi trong 80px, 0 pixel đổi ngoài**, bounds(440,235)–(505,301), max delta230. Hai ảnh [active](screenshots/lens-filter-active.png) / [scale0](screenshots/lens-filter-disabled.png) chứng minh biến dạng thật; layout/hit target không biến dạng theo lens.

Đo render callback cadence khi đứng Hero: khoảng **165fps**, RTX4060/ANGLE D3D11, viewport1440×900, DPR1, document visible, cửa sổ2.2s. Đây là callback/render cadence trên máy dev, không GPU completion/presented-frame benchmark hoặc số đo điện thoại thật; R3.1 không đặt mục tiêu FPS mới.

Harness có các sửa phép đo được ghi rõ: so hitbox trước/sau hover Work nhầm scale cũ với lens; chọn magnetic offscreen qua ScrollSmoother không kích hoạt native target (lưu [attempt-2](attempt-2.json)); đã dùng filter button đang hiển thị. Control đầu bỏ cả backdrop layer làm raster chữ ngoài lens đổi ([lens-compositor-control.json](lens-compositor-control.json)); control cuối giữ compositor và chỉ đổi displacement, pass đúng phạm vi. Không có console error ứng dụng trong các lượt này. Integrity checker tăng stdlib maxBuffer để đọc staged binary diff lớn cũ; không đổi index.

## Giới hạn và handoff

Mobile là viewport/touch emulation trên desktop GPU; reduced-motion là media emulation, chưa đổi OS thật. Không re-audit toàn installability/offline/public HTTPS, screen reader/loa/nhiệt, mọi R2 reverse/trace hoặc route case. PWA registration/controller đã kiểm sản phẩm; metadata/config/assets được hash guard. Pixel mono kiểm scene/UI style, không yêu cầu ảnh dự án nguyên màu hay font subpixel AA là grayscale.

Hero/BH/camera production vẫn legacy chờ **R3.2**. Avatar halo/About tools và nội dung/panel tạm chờ R3.3/R4; Education/Experience mới chờ owner section. **Work reticle và Contact terminal/equalizer/contactProgress giữ mono**, chờ R5.2/R7.2; copy error/timeout cũ không được sửa trong task này. Không phục hồi Playground/marquee, không triển khai hiệu ứng/route mới. Bàn giao chi tiết tại [handoff.md](handoff.md).
