# R3.3 — About chỉ giới thiệu bản thân

**PASS — 08/10/2026.** Triển khai riêng R3.3 sau R3.2. Bằng chứng bên dưới lấy từ ứng dụng đang render và bản build production; không dùng storyboard làm chứng nhận hiệu ứng đã chạy.

## Phạm vi và baseline

Baseline mới được chụp trước chỉnh sửa lúc `2026-10-08T04:12:05.362Z` trong [baseline.json](baseline.json), kèm bản sao `before/`. HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb`; working tree vốn có nhiều thay đổi của các task trước. Không reset hoặc stage lại các thay đổi đó.

Sửa đúng năm file: `src/components/About.jsx`, hai locale Vi/En, `src/3d/utils/cameraPath.js`, `src/3d/hooks/useScrollProgress.js`. Thêm một asset `public/avatar-cutout.webp`. Trong 90 file baseline, 85 giữ nguyên hash; staged diff/HEAD giữ nguyên. App, GalaxyScene, CameraRig, ScrollSmoother, store, ray shader/HDR, Nav/Menu/Cursor/Sound/PWA và dữ liệu chuyên môn không đổi. [Integrity](integrity-results.json) kiểm tra byte prefix AGENTS và chỉ cho phép một dòng R3.3 mới.

Áp dụng frontend-design, gsap-react, accessibility và Ponytail full: native button, một state màu cục bộ, GSAP có scope/cleanup; không thêm dependency, abstraction hoặc camera writer.

## Giao diện và nội dung

- Cutout đứng tự do: không panel/frame/glass/halo/caption bar; giữ người, tư thế, kích thước 800×1000 và alpha 4:5. Không dùng lại `/avatar.webp` có vòng ghép sẵn.
- Desktop chân dung bên trái, tên/vai trò/bio bên phải. Dưới 1024px reflow theo tên/vai trò → ảnh → bio/quote. Vùng đọc có fade tối mềm toàn section, không card.
- Grayscale mặc định; hover hoặc focus-visible trả màu. Enter/Space và touch tap giữ/tắt màu với `aria-pressed`; Escape bỏ trạng thái giữ màu. Đổi màu tức thời, không animation filter/layout. Nhãn/hướng dẫn dùng hai key i18n mới `about.portraitToggle`, `about.portraitHint`.
- Hai dòng tên và câu đầu `about.bioFirst` giải mã **0,9s**. Accessible name và chữ dành cho screen reader giữ nguyên; không aria-live theo ký tự. Phần còn lại hai bio và quote giữ nguyên copy đã duyệt. Reveal y8/opacity0,8→1 tạo nhịp đọc, không giấu bio hoàn toàn; reduced-motion giữ toàn bộ chữ tĩnh.
- Gỡ tools/core skills khỏi About; giữ nguyên data/locale để R4 tiếp nhận. Không có Planet/anchor mới, không proficiency hoặc số liệu mới.

Ảnh thật đã mở kiểm tra: [desktop](screenshots/about-1440-vi-motion-top.png), [mobile phần đầu](screenshots/about-390-vi-motion-top.png), [mobile bio](screenshots/about-390-vi-motion-bio.png), [hover màu](screenshots/portrait-hover.png).

## Camera và lỗi lifecycle đã sửa

Chỉ hiệu chỉnh constant `ABOUT` trong contract chung: observer `[2,5,-154]`, target nền `[-36,-16,-200]`, lookX vẫn theo bias responsive của `storyCameraPath`. BH lùi lên góc phải, nhường bio. Tâm chiếu tại 1440×900 khoảng `(1239,97;271,01)`, tại 390×844 `(339,38;326,58)`. Observer About cách tâm 46,314 scene units; minimum toàn tuyến kiểm tra là 8,182909, ngoài chân trời r=1.

Portal kết thúc, Skills bắt đầu và finale/Contact cùng tái dùng endpoint ABOUT nên nhận framing này. Endpoint vẫn liên tục; không có camera timeline trong About và không sửa ray tracer/composite.

Kiểm thử live reduced-motion phát hiện lỗi có sẵn: GSAP matchMedia cleanup ScrollSmoother đưa native scroll về 0 sau React rebuild, producer xuất Hero làm parent inert và mất focus. Restore ngay trong React effect chưa đủ vì cleanup xảy ra sau đó. Bản cuối dùng **GSAP `matchMediaInit` → `matchMedia`** trong producer chung: giữ chapter/progress khi teardown, đo ranges mới rồi seek sau cleanup/refresh/recreate. Locale rebuild cũng giữ chapter/progress. Vẫn chỉ một ticker producer; hai listener được cleanup. Không rewrite Smoother, timeout đoán thời điểm hoặc producer thứ hai. Các `*-failure.json` lưu trace trước fix; kết quả cuối là các `*-results.json` có timestamp kết thúc mới.

## Kiểm chứng

| Kiểm tra | Kết quả thật | Bằng chứng |
|---|---|---|
| Build | PASS, Vite 7.3.6, 5,56s; tạo sw.js/manifest; precache26 entries | [build.log](build.log) |
| Scoped ESLint | PASS About/cameraPath/useScrollProgress | Lệnh bên dưới |
| Full ESLint | 0 errors, 2 warnings cũ SplashCursor class syntax | [lint.log](lint.log) |
| Contract/copy/ownership | 1.457 assertions, 183 main keys/locale, endpoints/clamp/reverse, nguyên bio/tool data | [check-contract-results.json](check-contract-results.json) |
| Fresh layout | 320/390/768/1440 × Vi/En × normal/reduced =16 cấu hình; thêm8 mobile bio frames | [layout-results.json](layout-results.json) |
| Portal | 5 mốc 0/.25/.5/.75/1 tới/lùi × desktop1440/mobile390 =20 poses; 2 native #about jumps | Cùng layout-results; 20 PNG portal |
| Live lifecycle | 3 vòng × reduced on/off + Vi/En + resize1440/390 =6 records; focus portrait giữ6/6 | [cycles-results.json](cycles-results.json), layout-results cuối |
| Camera/anchor/render | 1 Canvas/1 writer; max pose/reverse error0; max O anchor error5,684e−14 CSSpx; overflow0, GLerror0 | layout-results |
| Native tương tác | Hover/leave, Tab, Enter/Space, Escape, locale focus; touch hai mode bật/tắt; 213 intro frames, min bio opacity0,8, layout offsets nguyên, layout shifts[] | [interaction-results.json](interaction-results.json) |
| Pause | Introduction pause khi chapter khác; hidden mô phỏng giữ progress rồi resume | interaction-results |
| Production preview | 1440/390 × Vi/En × normal/reduced =8 records; native Enter/Space hoặc tap; SW controlled, asset hash đúng, 0 overflow/error | [preview-results.json](preview-results.json), 8 PNG production |

Layout cuối có 44 records, 8 bio frames bổ sung và 44 PNG; không console/runtime error mới. Preview và interactions cũng `errors: []`. GSAP timeline hoàn thành có thể tự rời global timeline: kiểm không có timeline trùng, không giả định luôn còn một timeline sau khi chạy xong.

## Alpha và hiệu năng

Asset đúng R0.2, 66.084 bytes, SHA256 `6b2fea6dcbd2bd204fc0aa6c545cbe7a696670fc4532c992378c3393d53b511f`. Pillow decode RGBA: 541.430 pixel alpha0, 242.694 alpha≥240; 11 probes nền alpha0. Đã mở nguồn và composite trên #050505, kiểm tóc/kính/tay, không vòng trang trí mới. [Audit nguồn](portrait-audit.json), [asset-audit.md](asset-audit.md).

Browser pair giữ scene và chỉ ẩn ảnh: **158.831 pixel alpha0 an toàn giữ nguyên nền**, 1.045.120 pixel ngoài rect ảnh không đổi, 99,8877% foreground alpha≥240 khác nền. Hash/probes/guard resampling được lưu ở [alpha-render-audit.json](alpha-render-audit.json), [giải thích](alpha-render-audit.md). Không dùng nền đen giả transparency.

[Performance](performance-results.json): Edge154, Windows, RTX4060/ANGLE Direct3D11, 1440×900/DPR1, quality high hiện có. Đo riêng hai cửa sổ ~3s, không Browser khác chạy song song: idle **165,05 FPS**, hover portrait/lens **164,84 FPS**. Mỗi rendered frame đúng một ray render; GLerror0. Lens `data-active=true` khi pointer ở ảnh, không làm đổi hit target. Đây là mẫu máy dev, không bảo đảm FPS thiết bị khác.

## Chạy lại

```powershell
npm run build
npx eslint src/components/About.jsx src/3d/utils/cameraPath.js src/3d/hooks/useScrollProgress.js
npm run lint
node outputs/redesign/r3.3/check-contract.mjs
node outputs/redesign/r3.3/verify-integrity.mjs
& 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' outputs/redesign/r3.3/check-portrait.py
& 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' outputs/redesign/r3.3/check-alpha-render.py
# Vite dev :5173 và npm run preview -- --host 127.0.0.1 --port 4173 cần đang chạy:
node outputs/redesign/r3.3/verify-layouts.mjs
node outputs/redesign/r3.3/verify-interactions.mjs
node outputs/redesign/r3.3/verify-preview.mjs
# Chạy riêng sau khi các Browser khác đã đóng:
node outputs/redesign/r3.3/verify-performance.mjs
```

## Giới hạn và bàn giao

Browser Chrome connector thiếu executable nên dùng Edge154 thật qua Playwright đã cài. Mobile/touch/reduced-motion là browser emulation; chưa thao tác OS motion hoặc điện thoại vật lý/screen reader thật. Hidden dùng mô phỏng `document.hidden`. Alpha pair chỉ desktopDPR1/scene hold; ambient có thời gian nên không tuyên bố toàn PNG forward/reverse giống từng pixel. So sánh reverse xác minh pose/composite uniforms dùng progress chung. PWA chỉ smoke registration/control và fetch asset mới, không chạy lại toàn bộ offline/installability audit 4.7.

Warnings cũ: THREE.Clock deprecated, chunk >500KB, hai SplashCursor lint warnings. Không đổi shader để tuyên bố NASA100%. R0.2 cutout đã qua imagegen: R3.3 dùng đúng file, không bảo đảm texture pixel-identical với ảnh gốc. R4 chịu trách nhiệm mapping tool/năng lực/AI; [handoff.md](handoff.md) ghi path/state/pose thật. Chưa triển khai task sau R3.3.
