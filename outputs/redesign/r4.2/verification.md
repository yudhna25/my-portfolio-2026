# R4.2 — Skills / một tool active

08/10/2026 — **PASS**, tích hợp production; bàn giao R4.3. Dev `http://127.0.0.1:5173/#skills`.

## Kết quả

Skills bỏ ba card, các thanh trang trí/proficiency và legend orbital cũ. Desktop từ768px có tools trái / stage rộng1.8 phần giữa / năng lực phải. Mobile ưu tiên stage rồi tools hai cột, năng lực và nội dung chung. Tất cả tên/năng lực luôn là DOM text, không phụ thuộc hover hoặc WebGL. Stage có window riêng chừa clear control và caption; logo AI không đè tên trên390px. Các đường SVG mono có mask tại label để không cắt chữ ở320px.

| Tool | Năng lực được nối |
|---|---|
| Figma | Wireframing / Prototyping / Design Thinking |
| Photoshop | Xử lý ảnh / Compositing |
| Illustrator | Vector / Branding–Packaging |
| After Effects | Motion Graphics / VFX |
| Premiere | Dựng phim |
| DaVinci Resolve | Dựng phim |
| AI Tools | AI-Assisted Design |

Common giữ5mục: Teamwork, Project Management, Time Management, Adaptability, Attention to Detail. HTML/CSS/JS cơ bản, React đang học. Main locale195leaf/locale; namespace Skills36leaf/locale, parity đúng; không thêm color grading hoặc mức thành thạo.

`useSkillsStore` sở hữu3kênh, selector `focus ?? selection ?? hover`. Mouse leave chỉ xóa hover. Native keyboard focus chọn, blur trả về; Escape clear giữ DOM focus, Enter/Space sau Escape chọn lại. Touch/pen latch một lựa chọn; tap lại active, clear button hoặc background click clear. Chapter rời Skills / stage offscreen / unmount clear toàn bộ kênh; reverse không bật lại target cũ. Hit targets ở DOM, không theo particle.

App giữ stable stage ref. `SkillsSymbols` nối store/ref/reduced/visibility vào **nguyên SymbolStars R4.1** trong persistent Canvas. Không sửa primitive, symbolMorph, symbolTargets, asset logo, anchor helper, GalaxyScene, CameraRig, ray/Bloom pipeline hoặc quality. R4.1 dùng pool192; AI vẫn ba asset thật ChatGPT/Claude/Antigravity. Shader/background toàn bộ giữ mono.

CameraRig tiếp tục là writer duy nhất; chỉ pose SKILLS trong cameraPath đổi thành `[2,5,-145,-50,-35,-200]`, kéo BH lên/phải. ABOUT `[2,5,-154,-36,-16,-200]` nguyên; đầu Skills nối ABOUT, đầu Education nối chính endpoint Skills. Năng lực có nền đọc gradient mềm để hố đen không làm mất chữ khi các hàng cuộn qua vị trí cố định của BH.

Trong verify locale đã tìm lỗi cũ: PortalHeading giữ paused fade ởprogress1, nhưng cleanup của context khác trả opacity về1, khiến Hero phủ Skills. Sửa riêng writer thành GSAP quickSetter theo cùng `portalState.textOpacity`; giữ bend/glitch/timing/nội dung.12checks locale/resize/native và portal tiến/lùi0/.2/.35/.43/1/.35/0 xác nhận cùng fade, Hero opacity0 ngoài portal. Đây là thay đổi source bổ sung cần thiết cho kiểm tra locale R4.2.

## Browser và số liệu thực

Browser MCP đã thử nhưng kernel không khởi tạo: `MXC launcher: enumerate MXC volume G: ... os error87`. Dùng Edge154 / Playwright có sẵn, headless, NVIDIA RTX4060 qua ANGLE D3D11, deviceScaleFactor1. Không cài thêm package/browser. Dev server thực, không mock renderer hoặc camera.

- **53snapshots PASS**:7hover đầy đủ logo,7rapid swaps, leave exactbase0, Tab/ShiftTab/Escape/Enter/Space, focus chống pointer background, scroll-out/reverse,320/390/768/1440 + Vi/En, hidden,7reduced states,7trusted touch taps + toggle/background clear.
- Camera position error0; quaternion angle max0.00000004215rad. DOM/world anchor max**0.00011536px**; SVG đầu/cuối max**0.00012208px**. Tối đa3SVGlinks đúng mapping,1target,AI3asset. Không overflow; một Canvas;0WebGLerror;0consoleerror.
- Hidden được mô phỏng bằng visibility event +document.hidden getter: frameloopnever, phase/uploadversion giữ nguyên qua500ms. Reduced được Playwright emulateMedia: logo và goal cuối hiện ngay, phase AI không chạy.

| Lượt render AI | FPS | p95 frame(ms) | GPU median toàn frame(ms) | draw calls | triangles | points |
|---|---:|---:|---:|---:|---:|---:|
| High1440×900, Skills p.12 |165.06|6.40|2.157|30|34|24336|
| Low320×844 |165.01|6.30|0.055|11|14|1836|
| Low390×844 |165.03|6.30|0.072|11|14|1836|
| Medium768×900 |165.05|6.30|2.470|30|34|12336|
| High1440×900, Skills p0 |165.04|6.30|2.644|30|34|24336|

FPS chỉ đếm frame có root frameloopalways và renderer calls>0, không lấy global idle callback làm rendered FPS. `EXT_disjoint_timer_query_webgl2` bao toàn render-loop; thông số draw calls/points gồm background, shooting-stars, composer khi tier cho phép. Mỗi đoạn khoảng1.2s/198–199renderedframes, gần trần165Hz máy dev; không suy ra khả năng điện thoại thật.

## Lifecycle / fallback

`lifecycle.html` mount **App thật trong StrictMode**, không scene/prototype riêng.3cycles: resources SymbolStars mỗi cycle3geometry/11material/9texture; dispose events đủ3/11/9. Scene memory mounted ổn định10geometry/26texture; subscribers10. Rời Skills outer `symbol-stars.visible=false`, pooltargetnull, kênhnull và position upload version dừng. Unmount:0Canvas/0subscribers/0ScrollTrigger/noSmoother, visiblefalse và selectionnull. Triggers48lượt đầu/38lượt sau do entranceonce; không tăng qua remount.

Context loss qua WEBGL_lose_context dẫn đến CSSfallback `rgb(5,5,5)`,0Canvas;7tool/11ability và common/technical vẫn đọc được, Figma click hoạt động.0consoleerror. Forced teardown có warning extension không hỗ trợ sau context đã mất; tách với phiên bình thường chỉ warning THREE.Clock cũ.

## Checks và phạm vi

`npm run build` PASS5.09s +PWA; scoped eslint PASS; full lint0errors/2warnings SplashCursor cũ; chunk>500KB cảnh báo cũ. `check-content.mjs`, `check-interaction.mjs` và `check-artifacts.mjs` PASS.96baseline trước append tiến độ:89hash giữ/7source sửa; sau append:88hash giữ/8file sửa gồm AGENTS;2file source mới. HEAD/index và AGENTS prefix giữ. Không đổi dependency/public/content drafts/About/Work/Education/Experience/Contact.

Lệnh chạy lại từ project root:

```powershell
node outputs/redesign/r4.2/check-content.mjs
node outputs/redesign/r4.2/check-interaction.mjs
node outputs/redesign/r4.2/check-artifacts.mjs
node outputs/redesign/r4.2/verify-browser.mjs
node outputs/redesign/r4.2/verify-lifecycle.mjs
node outputs/redesign/r4.2/inspect-hero.mjs
npm run build
npm run lint
```

Bằng chứng: `browser-verification.json`, `browser-trace.zip`, `screenshots/` (7tool,4width/Vi-En, touch/reduced/fallback), `lifecycle-verification.json`, `hero-regression.json`, `content-check.json`, `artifact-integrity.json`. Các `inspect*`/`*-first.png` là diagnostic trước polish, không ảnh chốt; ảnh chốt trong `screenshots/`.

Giới hạn: mobile/touch là viewport/touch emulation trên GPU desktop; hidden/reduced là mô phỏng, chưa toggle OS hoặc đo điện thoại/thermal thật. Không claim165FPS trên điện thoại. R4.3 chưa triển khai; contract trong `handoff.md`.
