# R5.2 — Works production

08/10/2026 · Codex · **✅ Hoàn thành đúng phạm vi R5.2.** EDURA reader/route vẫn là dependency R6.2; finale production chờ R7.1. Không triển khai hai task đó.

## Thay đổi và phần tái dùng

- `Work.jsx` thay grid/filter/card/Flip/reticle bằng stage DOM trong main: ba nhãn/hit target đứng yên và preview cố định, riêng khoảng đọc/chọn 160vh. Một subscription lấy progress chapter hiện có, quickSetter chỉ transform Y; ResizeObserver đo lại và cleanup qua useGSAP. Không thêm producer, camera writer, orbit controller hoặc Canvas.
- Giữ nguyên shared WorksConstellations và handoff R5.1/R2.3: EDURA→Centaurus, VERIS→Gemini, VIE→Cygnus. Chỉ đổi một dòng strength selected1.2/idle1/others0.35. Geometry, orientation, pool, camera, orbit/capture/finale contract đều nguyên hash.
- Selection → Focus → Hover cùng ưu tiên ở DOM và renderer. Hover/focus preview, leave chỉ trả owner tương ứng; click/Enter/tap pin/unpin; tap nền/Escape clear; focus preview link giữ project. Pin có ưu tiên hơn hover/Tab, không tự clear khi pointer rời. Orbit pause/resume êm tại phase hiện tại, không reset.
- Preview giữ ảnh gốc có màu, alt Vi/En, lazy/async và slot16:10/object-contain. Decode thật: EDURA1600×1131, VERIS/VIE1600×900; width/height attributes cuối khớp intrinsic, khác với tỉ lệ slot. Chỉ render tên/lĩnh vực/status, không đưa description legacy chưa xác minh vào UI.
- EDURA có disabled CTA slot chờ reader và link Behance phụ thật. VERIS/VIE chỉ preview/status, không href/action giả. Đã gỡ TargetLockReticle sau kiểm caller duy nhất. Lens trên heading/ảnh và Sound click hiện có được giữ.

## Baseline và integrity

Baseline mới lúc **2026-10-08T14:36:56.536Z**, HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb`; trước sửa đã chụp hash/copy hiện trạng, không lấy baseline R0.1 thay hiện trạng.

`verify-integrity.mjs` xác nhận **4 source files đổi, 1 file gỡ, 95 file giữ đúng hash, 0 source/public file mới**. Giữ HEAD, staged diff và toàn bộ prefix AGENTS cũ. Hai locale chỉ đổi nhóm works; **206 string leaf keys mỗi locale, gồm phần tử array, parity pass**. Không cài dependency hay sửa App/camera/store/data/assets/navigation/PWA.

| Source đổi | Phạm vi |
| --- | --- |
| src/components/Work.jsx | UI, input ownership, stage/preview, guarded native focus entry |
| src/3d/components/WorksConstellations.jsx | Một dòng selected strength |
| src/i18n/locales/vi.json + en.json | Nhãn/control/alt/status Works, bỏ key filter/reticle hết caller |
| src/components/ui/TargetLockReticle.jsx | Gỡ module hết caller |

## Lệnh và kết quả

Chạy tại `D:\Projects\my-portfolio-2026`; cần dev :5173 và preview :4173 phục vụ dist mới. Edge dùng executable đã cài, Playwright bundled; không cài browser/package.

```powershell
npm run build
npm run lint
node outputs/redesign/r5.2/check-production.mjs
$env:R52_PHASE = 'matrix'
node outputs/redesign/r5.2/verify-browser.mjs
Remove-Item Env:R52_PHASE
node outputs/redesign/r5.2/verify-lifecycle.mjs
node outputs/redesign/r5.2/verify-preview.mjs
node outputs/redesign/r5.2/verify-performance.mjs
node outputs/redesign/r5.2/verify-integrity.mjs
```

| Kiểm chứng | Kết quả thật |
| --- | --- |
| Build cuối | PASS **7.32s**; sw/manifest tạo, PWA32 precache entries2417.91KiB |
| Full lint | **0 errors**, 2 warnings SplashCursor cũ |
| Self-check reuse R2.3 | PASS356 geometry/projection/store/orbit assertions +64 DOM/renderer ownership cases; projection error≤4.962e−10, phase60/165Hz delta1.111e−16 |
| Final source Browser matrix | **340/340**, 20 cấu hình:320/390/768/1440/1920 ×Vi/En ×normal/reduced |
| Production dist preview | **24/24**:1440/390 ×Vi/En ×normal/reduced ×3 projects; native Menu đổi locale trong vùng đọc, ảnh decode/attributes/alt/màu/links/1Canvas/overflow kiểm thật |
| Cleanup | 3 vòng App StrictMode mount/unmount: Canvas/frame subscriptions/triggers/Smoother/App-owned store listeners về0; 7 geometry+7 material Works và2+2 meteor dispose đủ mỗi vòng; GPU memory geometry/texture về0 |
| Console/WebGL | Không page/console errors hoặc GL errors trong các acceptance runs; một loại Clock warning cũ |

## Bố cục, geometry và tương tác

Final matrix: anchor Works sai lệch tối đa **0.502px**, camera error **0**, overflow ngang **0px**; target footprint delta≤0.00000763px, preview footprint delta≤0.00000746px. Target nhỏ nhất90.656×53.312px. **60 preview +20 rapid switch windows CLS/rawShift0**. Không suy kết quả này thành CLS0 toàn trang.

20 cấu hình đều scan361 góc phase:17/17/10 sao chính của Cen/Gem/Cyg luôn trong viewport, ngoài vùng header/preview. Buffer và edge pairs đối chiếu dữ liệu R0.2/renderer chung. Source convention ICRS/J1991.25, Stellarium Modern, west-right/north-up được giữ; không coi diễn giải dự án là ý nghĩa thiên văn hoặc stick figure IAU duy nhất.

Suite đầy đủ **386/386** trước sửa duy nhất height attribute được giữ riêng trong `browser-full-before-image-dimensions-fix-*`: rapid hover/ownership, native Tab/ShiftTab/Enter/Escape, tap active/nền clear, phase pause/resume/capture/reverse, slow/fast/native wheel/boundary, hidden/reduced, lens và3 vòng live motion/resize. Height patch không đổi input/shape; final340 kiểm lại ma trận và attributes, production24 kiểm dist cuối. Entry-only10 records và trace cũng giữ riêng. Không gộp mọi lần chạy thành một số pass trên cùng source hash.

Native focus entry đã sửa theo trace: Smoother focusin có thể seek sau React handler, rồi scrub tween cũ kéo visible position về departure. Work dùng guarded rAF→existing Smoother offset/scrollTop→trigger.update→getTween().progress(1).pause→animation.progress(trigger.progress), cancel/connected/activeElement guards và cleanup. Native wheel tiếp tục hoạt động sau jump; không camera/progress writer thứ hai. Trong chapter Works, focus không seek lại.

## Hiệu năng

Đo một Edge session riêng sau khi các Browser khác đã đóng; actual Fiber render frames, high tier,1440×900,DPR1, RTX4060/D3D11. Visible scroll producer được đi tới/lùi liên tục trong Works, mỗi mode khoảng4s:

| Mode | Frames / HDR ray calls | FPS | p95 frame | GL error |
| --- | --- | --- | --- | --- |
| Orbit | 656 /656 | **163.996** | 6.60ms | 0 |
| Selected preview | 661 /661 | **165.114** | 6.30ms | 0 |

Camera finite, memory12 geometries/23 textures ổn định giữa hai mẫu. Đây là đo trên GPU máy Windows; không chứng minh FPS/nhiệt điện thoại thật hoặc DPR khác. Không đo GPU timer-query duration.

## Giới hạn và các run chẩn đoán

- Browser Chrome connector không có Chrome executable; fallback Edge154 + bundled Playwright thật. Mobile/touch/reduced/hidden là emulation, chưa toggle OS reduced hoặc thử máy điện thoại thật. Không deploy, không mở reader chưa tồn tại, không khẳng định HTTP200/launch thành công của Behance bên ngoài.
- Warning cũ: THREE.Clock deprecated; lint2 unsupported inline class của SplashCursor; build chunk>500KB. Không phát sinh error mới trong acceptance. OneCanvas/onecamera và pipeline HDR hiện có giữ nguyên.
- Ngoài cửa sổ preview, suite full trước metadata có tổng raw shifts17.1457/non-recent-input sum2 khi hidden/teleport/motion/locale/live resize; attribution giữ trong JSON. Đây không phải preview CLS hay Web Vitals session-window toàn trang. Finalmatrix rawShift0, không xóa dữ liệu run trước.
- Production verifier ban đầu phát hiện lỗi height1600×1000 thật, đã sửa source. Sau đó có lỗi harness dùng img.width/height (CSS size224×140) thay HTML attributes; đã sửa đọc getAttribute, không nới assertion.
- Ép focus bằng API vào Nav đang ẩn ở mouse modality khiến Smoother center control và rời Works; native keyboard modality reveal Nav thì đúng. Artifact diagnostic giữ lại. Khi đổi locale đúng ranh giới chapter, native mobile có thể đứng phía trước mốc Works mới do reflow; không claim giữ nguyên tọa độ chương qua locale tại ranh giới. Production24 dùng native upward scroll để hiện Nav và đổi locale khi đang ở vùng đọc Works; Nav/hash jump và endpoint có kiểm riêng. Không sửa Nav/store/camera ngoài scope để che tình huống này.

## Bằng chứng và bàn giao

- [Browser notes](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/verify-notes.md), [final summary](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/browser-summary.json), [production result](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/preview-results.json), [performance](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/performance-results.json), [lifecycle](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/lifecycle-results.json), [integrity](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/integrity-results.json).
- Đã mở ảnh render desktop1440 Vi EDURA,320 En EDURA và production390 En reduced VERIS; ảnh màu gốc chỉ nằm ở preview. [Desktop](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/screenshots/1440-vi-normal-edura.png), [production mobile](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/screenshots/production-390-en-reduce-veris.png). Đây là render thực, khác storyboard minh họa.
- [Handoff](D:/Projects/my-portfolio-2026/outputs/redesign/r5.2/handoff.md) chốt projectIDs, owner priority, phase capture và restore order. R6.2: lưu visible scroll+selection+existing worksOrbit; restore scroll/producer chapter trước focus EDURA preventScroll. R7.1 dùng capture contract chung và đoạn finale riêng, không reset phase hoặc tạo controller. R5.2 chỉ cung cấp contract; chưa làm route/history reader/scroll restore/finale production.

AGENTS.md được append đúng một dòng R5.2 sau kiểm chứng; integrity kiểm prefix cũ giữ nguyên.
