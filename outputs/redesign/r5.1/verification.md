# R5.1 — Meteor Experience → Works

**08/10/2026 · ✅ Hoàn thành R5.1.** Meteor dẫn chuyện, trail xác định theo scroll, handoff camera và lịch ambient đã tích hợp vào App hiện tại. Chưa làm R5.2 preview/selection, R6 reader hoặc R7 finale production.

## Thay đổi và phạm vi

- Experience bỏ ba mission-card, viền/kính/badge HUD và entrance ẩn nội dung. Ba khối dọc lệch ngang trên desktop, một cột trên mobile; HOSANA MEDIA / UPWORK / DESIGNVELOPER, vai trò, kỳ làm việc, loại việc và mô tả đều giữ nguyên Vi/En. Company+role nhấn từ opacity0.72→1 khi đầu sao đi ngang; nội dung luôn đọc được. UPWORK2024–nay chồng thời gian hai công việc còn lại, không kể thành ba lần chuyển việc loại trừ nhau.
- `StoryMeteor` mới dùng một head5 CSS px và line128 samples, lõi trắng1px, fade theo chiều dài. Curve lấy mốc từ DOM thật và chuyển sang world-space; head/trail cùng một hàm, sample phía sau cùng progress, không history/delta/random. Các scratch/typed arrays tái dùng, không layout read hay allocation trong useFrame.
- Thêm **chapter DOM `departure`** ở cuối Experience, cao110vh (reduced20vh). Camera giữ pose EDUCATION R4.3 trong phần đọc; departure đổi trực tiếp tới WORKS theo shared progress. CameraRig vẫn writer duy nhất; không đổi CameraRig/useScrollProgress/Smoother/HDR shader. Main store alias departure→experience cho Nav; lab có nhãn/pose cùng contract, không scene/meteor copy.
- App dùng lại **WorksConstellations R2.3**, hiện dần trong departure0.3→1; head tan0.7→1. BH rời khung bằng camera chuyển hướng. Direct Nav/hash `#work` dựng pose Works và không replay đường bay. R5.2 phải dùng instance này, không mount renderer thêm.
- Ambient vẫn random2–3 vệt mỗi4–7s, pool3×24. Hero/portal/Experience/departure/finale nhường sân khấu; Education/Works fade về0 ở cuối chapter, About/Works/Contact fade vào đầu chapter, Skills giữ nhịp yên. Gỡ toàn bộ reactive event dispatcher/listener và ba caller cũ Work filter/Contact copy/mailto; các action/audio còn nguyên.

Paths/parameters/ownership chi tiết trong [handoff.md](handoff.md). Code thêm đúng hai file `src/3d/components/StoryMeteor.jsx`, `src/3d/utils/storyMeteor.js`; không dependency/asset/framework mới.

## Baseline và bảo toàn

`capture-baseline.mjs` đã chụp **98 source/public/config/package files** mới lúc `2026-10-08T13:51:26.478Z`, trước sửa source. Snapshot cũ R4.3 chỉ dùng làm tài liệu tham khảo.

`verify-integrity.mjs` kiểm **12 file baseline sửa / 86 hash nguyên / 2 file mới**. HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb` và staged diff hash giữ nguyên. Không reset/stage/commit. Source geometry chòm sao, data.js, main Vi/En locale, portrait/public/config/package, camera writer, scroll producer, shader/HDR và quality đều giữ hash. Work/Contact đối chiếu byte sau đúng phép gỡ import/eventcall để bảo toàn filter/audio/clipboard/mailto.

AGENTS prefix kiểm bằng bytes; chỉ append một dòng R5.1, không sửa tiến độ cũ. `integrity-results.json` chứa hash sau cùng và kết quả append.

## Lệnh và kết quả

Chạy từ `D:/Projects/my-portfolio-2026`, Node24.12 / npm11.6, dependency sẵn có:

| Lệnh | Bằng chứng |
|---|---|
| `node outputs/redesign/r5.1/check-motion.mjs` |PASS40,227 checks,5viewport,2,005 cặp forward/reverse; projection, head/tail đúng curve, boundary C0/C1, observer ngoài r1, lịch ambient2–3/4–7s, copy Experience nguyên|
| `npx eslint` với12 fileJS/JSX đã sửa/thêm liên quan |PASS0issue; `scoped-lint.log`|
| `npm run lint` |0errors/2warnings SplashCursor đã có; `lint.log`|
| `npm run build` |PASS13.03s ở lượt cuối; `dist/sw.js`, `dist/manifest.webmanifest`, precache32entries; `build.log`|
| `node outputs/redesign/r5.1/verify-browser.mjs` |PASS262 snapshots,8configs,121PNG,trace; `browser-results.json`, `browser-run.log`|
| `node outputs/redesign/r5.1/verify-lifecycle.mjs` |PASS3AppStrictMode mount/unmount; `lifecycle-results.json`|
| `node outputs/redesign/r5.1/verify-preview.mjs` |PASS8production configs Vi/En×1440/390×normal/reduced +4fresh#work loads; `preview-results.json`|
| `node outputs/redesign/r5.1/verify-performance.mjs` |PASS2 đoạn chuyển động tới/lùi,1,322 rendered frames; `performance-results.json`|
| `node outputs/redesign/r5.1/verify-integrity.mjs` |PASS baseline/HEAD/index/approved copy/AGENTS prefix; `integrity-results.json`|

Build warning chunk>500KB và warning `THREE.Clock` có sẵn được ghi riêng. Không tắt rule hoặc che warning. Browser Chrome connector thiếu executable; dùng Edge154 qua Playwright runtime đã cài. Sandbox MXC lỗi ổG nên shell chạy qua escalation được xét duyệt. Một lượt bị gián đoạn bởi hạn mức reviewer/agent; đã tiếp tục qua cùng cơ chế xét duyệt và chạy lại các kiểm chứng cuối.

## Browser / hình render thực

App thật tại :5173; Edge154 headless/ANGLE RTX4060 Direct3D11. **390×844 và1440×900, Vi/En, normal/reduced**. Script đọc actual Fiber buffers/material/camera và actual DOM ranges; không probe vào production source. Chi tiết ở [verify-notes.md](verify-notes.md).

| Tiêu chí | Kết quả |
|---|---|
| Experience và departure0/.25/.5/.75/1 tới/lùi |Buffer head/trail nhìn thấy trùng từng Float32; camera liên tục đúng shared pose|
| Dừng giữa hai chapter |Head/trail và Works phase không đổi sau400ms|
| Ba mốc thật |Head cách phía trên label24px; sai lệch tối đa0.45569px do fractional scroll rounding; nhãn tương ứng opacity1|
| Trail curve thật |Max reconstructed geometry error0.0000152588 scene units; alpha giảm đều,1head/128samples; head opacity/DPR đúng material riêng|
| Camera |XYZ error0, quaternion≤5.16191e−8rad; observer hữu hạn và r>1 ở mọi pose|
| BH→Works |BH ở phải khi đọc Experience; departure mở ba chòm, camera đưa BH khỏi khung. DirectWorks tâmBH x≈−1151px desktop/−312px mobile|
| Native slow/fast/reverse |Wheel5×80/+2200/−1300; progress theo visible Smoother/DOM, sai lệch<0.0006|
| Reflow/live reduced |3 vòng reduced→390/En→normal/1440/Vi; nội dung đầy đủ, labels1, meteor tắt khi reduced, pose/progress hữu hạn|
| Hidden |Frameloopnever; buffer version/positions/Works phase không đổi, resume cùng pose|
| Ambient ở khoảng yên |About/Skills/Education visible1; hai burst Skills thực, peak3vệt/burst, cách4345.6ms qua1532 mẫu|
| Ambient nhường cảnh |Portal/Experience/departure/finale invisible; không có hai meteor dẫn chuyện|
| Điều hướng |Native Nav Enter→#work +reload390/En#work đúngWorks, meteor không hiện/replay, freshorigin0|
| Ownership / lỗi |1Canvas/1head/1camera writer;0console/runtime/WebGLerror mới;0horizontaloverflow ở262snapshot|

Đã mở/xem các PNG desktop HOSANA/UPWORK/DESIGNVELOPER, mobile EnUPWORK, departure0/.05/.12/.25/.5/.75. Company/bio rõ, head nhỏ màu trắng và trail mảnh giảm sáng. BH không che nhãn chính. Các ảnh đầu trước khi sửa head uniform riêng không dùng làm bằng chứng final. Source cuối sửa mẫu trail lấy scroll của **q**, tránh corner từ frame-history; không còn dùng review tangent bản trung gian.

Ảnh tiêu biểu:

- [Desktop — UPWORK](screenshots/1440-vi-normal-milestone-upwork.png)
- [Mobile — UPWORK](screenshots/390-en-no-preference-milestone-upwork.png)
- [Departure — mở Works](screenshots/1440-vi-normal-departure-0.5.png)
- [Đầu đoạn vào chiều sâu](screenshots/1440-vi-normal-early-departure-0.12.png)

Production preview :4173 kiểm8configs/8PNG, đủ Experience copy/label,1Canvas/0overflow/0newconsoleerror, SW registration/control hiện hữu; thêm fresh#work cho4viewport/motionconfig. Test ban đầu cố click Menu đang auto-hide nên timeout; harness đổi sang native focus+Enter theo accessibility hiện có và chạy lạiPASS, không sửa ứng dụng cho lỗi harness. Log lịch sử `preview-initial-autohide.log` được giữ. Đây không phải audit offline/PWA toàn phần R8.3.

## Lifecycle và hiệu năng

Ba vòng App thật trong StrictMode, tái dùng fixtureR4.2; **Meteor dispose2geometry+2material / Works7+7** mỗi vòng (ba cặp point/line + finale trail). Mounted12frame subscribers/22ScrollTriggers ổn định; unmountCanvas0/subscriber0/trigger0/Smoothernull/GLgeometry0texture0. Store listeners thật trở về baseline: mọi App-owned delta0; còn1listener i18n module từ `config.js` đã tồn tại trước mount, cleanup khi HMR module dispose. Không gọi listener nền đó là leak hoặc giả tổngstore0. Xem [review.md](review.md).

Performance chạy riêng sau khi các Browser QA khác đóng, Edge154/RTX4060/high1440×900/DPR1. **Có cuộn tới và lùi**, đo Fiber rendered frames và đối chiếu một HDR ray render/frame; không dùng idle screenshot hay rAF đơn thuần:

| Đoạn | Rendered frames / thời lượng | FPS | Frame p50 / p95 |
|---|---|---|---|
| Experience |662 /4005.7ms|165.26|6.1 /6.9ms|
| Departure→Works |660 /4004.5ms|164.81|6.1 /7.2ms|

Camera hữu hạn, maxprogress≈0.97, GLerror0, rayCalls=renderedFrames. Memory geometry8→14 do Works bắt đầu render, texture23; lifecycle chứng minh tài nguyên được giải phóng. Không suy số liệu này thành hiệu năng điện thoại hoặc tất cả GPU.

## Giới hạn và bàn giao

- Mobile/touch, reduced preference và hidden kiểm bằng browser emulation trên Windows; chưa điện thoại/thermal/OS/screen reader vật lý. Không tự thay preference OS của người dùng.
- Finale chưa có DOM production ở R5.1; kiểm ambientfinale là **manual engine pose**, không claim finale production đã hoàn thành. R7.1 giữ gate này khi tích hợp.
- Work giữ layout/card/reticle cũ cho R5.2; Contact terminal chờR7.2. Ba chòm hiện trong handoff nhưng preview/touchselection/internalreader chưa thuộcDoD R5.1.
- Lab dùng shared camera/Works và kiểm endpointdeparture; meteor đo ba label thật chỉ mount trong App. Không copy engine hay thêm Canvas để minh họa.
- R5.2/R7.1 tiếp nhận [handoff.md](handoff.md): chapterdeparture, curve API, poseWorks, instanceWorks và lịchambient. Chưa chạy task kế tiếp.
