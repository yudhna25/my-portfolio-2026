# R5.2 — Browser QA

08/10/2026. Agent QA chỉ ghi trong thư mục outputs; Agent tích hợp sở hữu source/AGENTS/build/lint/production preview/lifecycle/FPS. Browser đã dùng là Edge 154 thật qua Playwright runtime sẵn có; Browser plugin/Chrome không hoạt động trong phiên nên dùng fallback này. Không cài dependency và không chạy GPU benchmark cùng Agent khác.

## Trạng thái bằng chứng

- Full suite **386/386 PASS**, 20 cấu hình + ownership/quỹ đạo/native entry/native scroll/lens/touch/3 live cycles, đã hoàn tất trên nguồn trước sửa một prop chiều cao ảnh. Giữ nguyên trong `browser-full-before-image-dimensions-fix-results.json`, `browser-full-before-image-dimensions-fix-summary.json`, `.log` và `browser-full-before-image-dimensions-fix-trace.zip`.
- Production audit sau đó phát hiện metadata ảnh kế thừa sai: EDURA decode **1600×1131**, VERIS/VIE **1600×900**, trước đó width/height khai báo 1600×1000. Agent tích hợp chỉ sửa height prop, giữ asset/aspect16:10/object-contain/quỹ đạo/input. Harness ban đầu mới kiểm width/height có tồn tại; đã tăng thành **attributes phải bằng naturalWidth/naturalHeight**.
- **Final matrix 340/340 PASS**, 20 cấu hình trên height prop đã sửa. `browser-results.json`, `browser-summary.json`, `browser-run.log`, `browser-trace.zip` (265,097,616 bytes) là bằng chứng cuối. 60 preview đều attributes bằng decoded1600×1131/1600×900; bản full386 ở trên không được gọi là full suite trên metadata cuối. Browser đã đóng, Agent tích hợp tiếp tục kiểm production/FPS độc lập.

Work.jsx SHA256 sau final matrix: `7BC83EF08AE3D6AC1E180EF1811B68C45C9D3068E7DB9A8FA23E96D9C1647A22`. Đây là receipt nguồn UI lúc chốt QA; protection/hash phần khác thuộc integrity report của Agent tích hợp.

## Cách chạy / môi trường

```powershell
$env:R52_PHASE='entry'
node outputs/redesign/r5.2/verify-browser.mjs *> outputs/redesign/r5.2/browser-entry.log
$env:R52_PHASE='all'
node outputs/redesign/r5.2/verify-browser.mjs *> outputs/redesign/r5.2/browser-run.log
# Sau sửa metadata: đủ ma trận, không lặp lại các extra không thay đổi.
$env:R52_PHASE='matrix'
node outputs/redesign/r5.2/verify-browser.mjs *> outputs/redesign/r5.2/browser-run.log
node outputs/redesign/r5.2/summarise-browser.mjs
```

Windows/RTX4060, ANGLE D3D11, DPR1, app dev thật `http://127.0.0.1:5173/#work`. Viewports320/390×844 và768/1440/1920×900, mỗi width Vi/En × normal/reduced. Media reduced và mobile touch là mô phỏng; chưa kiểm điện thoại thật hoặc OS setting. Direct #work vào đúng Works, không replay meteor. QA đọc Fiber/Zustand từ các resource URL đã load, không thêm probe production. Manual pose test dừng producer và đồng bộ playhead Smoother; native entry/wheel/hidden/live reflow dùng producer thật.

## Bộ kiểm trên app thật

- Mỗi cấu hình17 snapshots: idle trước/sau, 5 progress đọc0/.25/.5/.75/1, ba preview, rapid hover, Tab ba target, pointer đối nghịch focus, pointerleave giữ focus và Escape clear. Click pin/retap/background clear kiểm riêng với native mouse/touch; preview giữ ảnh gốc có màu, tên/lĩnh vực/alt Vi/En.
- Buffer Float32 sao chính + supporting và các cặp nối của cả Cen/Gem/Cyg đối chiếu exact với JSON geometry production. 20×361 góc analytic dùng actual geometry/basis/camera: cả **17/17/10 sao chính** luôn nằm trong viewport, không bị header/preview che ở mọi góc. Đây là quét hình chiếu geometry, không giả chạy idle controller tới mọi góc bằng thời gian.
- Targets≥44px, native elementFromPoint đúng button; target/preview footprint đo trong hệ tọa độ stage. Đồng thời kiểm stage.top tuyệt đối<1px tại từng pose. Không gọi root dịch phân số pixel do cuộn là layout shift của nội dung.
- Một Canvas và một camera subscriber priority−1 mọi snapshot; camera XYZ đối chiếu `storyCameraPath`, geometry finite, WebGL getError0, overflow0, meteor không hiện ở Works. Ownership source tĩnh thuộc checker của Agent tích hợp.
- Orbit dừng êm rồi velocity0, phase giữ exact thêm250ms; release không nhảy pha. Khi handoff tới prototype/manual engine finale, origin chỉ capture một lần, reverse cùng progress tái tạo exact position/scale; Contact giữ origin và reduced return Works nhả latch. **Production finale/reader chưa có trong R5.2**, không claim đã chạy R7/R6.
- Hidden emulation: frameloop never và phase giữ exact; quay về visible lại bình thường. Education offscreen giữ phase. Ba vòng reduced↔normal/390↔1440/En↔Vi giữ focus/preview VERIS và chapterWorks.
- Lens native pointer trên ảnh dự án thực: `data-active=true`, visible và backdrop filter `url("#cursor-gravity")`; mouseleave ẩn, reduced không render lens; image footprint giữ nguyên. Không có RGB/glitch/Canvas mới.
- EDURA: nút case study disabled/pending, không href giả; chỉ Behance là link phụ thật, blank/noopener. VERIS/VIE không link/CTA giả. Đây là kiểm DOM URL/affordance, không coi route nội bộ chưa có là hoàn thành.

## Số đo full386 trước metadata patch

Anchor tuyệt đối max **0.50195998px**, camera XYZ error **0**; target footprint delta max **0.0000076294px**, preview footprint delta **0**. Min target **90.65625×53.31249px**. 60 preview có1608–2508 pixel có màu trên sample64×40; filter không grayscale. Direct/jump/geometry đều pass. Native entry strict350ms Works/EDURA và reverse Works/VIE có anchor error0; native wheel tiến .200065→.239966→.477604, đảo về .325262, qua Contact rồi trở lại Works.

Pause phase **2.7482145385817476** giữ exact250ms; release **2.7482848835371283**, resumed350ms **2.7673474169396646**. Console/page errors `[]`; warning duy nhất `THREE.Clock` deprecated đã có trước.

## Số đo final matrix340 sau metadata patch

Anchor max **0.50195998px**, camera XYZ error **0**, overflow/WebGL errors0. Target footprint delta **0.0000076294px**, preview footprint delta **0.0000074580px**; 20 phase scans vẫn giữ17/17/10 sao chính clear ở đủ361 góc. 60 preview và20 rapid-switch windows đều **CLS0/rawShift0**, manual readingShifts cũng rỗng. Toàn ma trận final không ghi shift; chỉ là kết quả ma trận này, không mở rộng thành CLS0 cho hidden/live-reflow của suite trước. 0 page/console errors; Clock warning cũ vẫn đúng một loại.

## CLS đúng phạm vi

**Window preview-only** reset sau manual reading/jump đã settle: 60 preview +20 rapid switch đều **CLS0 / rawShift0**, footprint không đổi. Manual readingShifts ở final full386 là rỗng. Không tuyên bố toàn trang CLS0.

Giá trị cộng dồn ngoài window preview ở `lifecycle-desktop-2`: rawShiftSum **17.1457457682**, nonRecentInputShiftSum **2**. Nó gom cả hidden emulation, teleport chapter, đổi reduced mode/locale và resize390→1440 liên tiếp, không phải Web Vitals session-window CLS của một lần xem trang. Attribution thật được giữ trong JSON: full-viewport DIV có lúc biến thành rect0×0 khi đổi visibility/mode; viewport DIV thay390→1440; Nav UL đổi width khi đổi locale; #transmission và preview content rect đổi vị trí khi tái tạo Smoother/reflow. Không loại những entry này khỏi file hay gọi tổng của chúng là preview CLS.

Các run chẩn đoán cũ không phải acceptance: native entry bị tween scrub kéo về departure đã sửa; phép so preview.y tuyệt đối gây false failure. Các file `native-entry-trace.json`, `browser-preview-absolute-coordinate-failure.*`, `browser-cls-window-boundary-failure.*` giữ lại lịch sử. Run failure CLS boundary ghi .004315 tại manual p=1 trước các hover; preview không làm tăng thêm. Harness đã tách readingShifts và capture entry.sources từ run cuối.

## Native focus correction được kiểm

Trace Browser cho thấy native/Smoother focusin center-seek chạy sau React focus handler; rAF seek tới Work top thắng focusin nhưng tween scrub cũ lại kéo visible position về departure. Agent tích hợp dùng public API hiện có: guarded rAF → scrollTop(offset) → trigger.update → getTween()?.progress(1).pause → trigger.animation.progress(trigger.progress). Không producer/camera/timeline mới. Guard kiểm element connected/actual focus, hủy pending rAF khi focus đổi/Escape/unmount. Native wheel sau đó tiếp tục scrub đã được kiểm, không chỉ nhìn thấy một frame đúng.

## Ảnh render thực

- `screenshots/1440-vi-normal-edura.png`: desktop EDURA và link phụ/pending CTA.
- `screenshots/320-en-no-preference-vie.png`: mobile nhỏ nhất En, đủ heading/3 controls/preview.
- `screenshots/390-en-reduce-veris.png`: reduced mobile En.
- `screenshots/1920-vi-no-preference-edura.png`: desktop rộng.
- `screenshots/390-touch-clear.png`: touch clear từ full suite trước patch metadata.

60 ảnh config đã được finalmatrix ghi lại; ảnh touch không thay đổi metadata nhưng nguồn trước patch được ghi rõ. Chưa gọi ảnh mock/storyboard là render thật. Build/scoped lint/full lint/production previews/integrity/FPS/resource disposal xem báo cáo Agent tích hợp; harness này không đo FPS.
