# R4.1 — Renderer sao / logo cho Skills & Education

08/10/2026 · **PASS R4.1** · Phạm vi renderer + lab shared scene; không redesign hai section production.

## Bản bàn giao

`src/3d/components/SymbolStars.jsx`, `src/3d/utils/symbolMorph.js`, `src/3d/data/symbolTargets.json`; lab gọi cùng primitive, `useSectionAnchor` được tái dùng và sửa nguồn scroll native khi focus/pose manual. Chỉ thêm nhãn lab Vi/En, không đổi nội dung các section.

Pool192, một target, typed arrays base/current/goal ổn định. Sáu software riêng + AI nhóm3logo đúng R0.2. Education exact geometry Cir/Tel/Pic; điểm hình rõ trước nét nối mờ; context không thêm cạnh. Formation0–0.45s → links0.55–1s → complete logo1.05–1.5s. Đổi target từ current; return snap exact base; offscreen reset và dừng uploads. Reduced hiện trạng thái tĩnh; hidden do Canvas never sở hữu. Không GSAP tween/state/controller mới trong renderer, không allocation/setState/useFrame, không hút toàn StarField.

API/mapping/ownership/handoff đầy đủ: [contract.md](contract.md). R4.2/R4.3 dùng nguyên renderer này; chưa triển khai layout ba vùng hay các nhánh năng lực.

## Nguồn / tài sản

- 9/9 file web giữ nguyên bytes/SHA, tổng43.000bytes; URL assets thật được TextureLoader decode, không placeholder/Gemini. Metadata/provenance nằm trong symbolTargets và R0.2/logo-assets.json.
- Figma/ChatGPT/Antigravity là white variants vendor; Adobe/Claude/Resolve là project mono derivatives từ native official. Logo hoàn chỉnh dùng chính texture gốc R0.2, aspect nguyên. Adobe sample luminance glyph sáng, không sample tile alpha thành khối vuông.
- Geometry Education giữ source/projection/relative positions/HIP: Cir3+11points/2edges, Tel2+6/1, Pic3+12/2. Stellarium Modern pinned commit CC BY-SA4.0 + Hipparcos ICRS/J1991.25; source SHA trong data.
- `prepare-targets.py` offline raster-decode9webassets, chọn điểm sáng xác định; nearest links ngắn, chỉ đi trong mask glyph. Re-run data hash `0edfec1c16363c7e65b6061105d0c791515130d120f0172b55cdb4a93a9bb903`. Không tải thêm/chỉnh màu/đổi public assets.

## Checks chạy lại

```powershell
node outputs/redesign/r4.1/check-morph.mjs
node outputs/redesign/r4.1/verify-touch.mjs
node outputs/redesign/r4.1/verify-browser.mjs
node outputs/redesign/r4.1/verify-visible-stage.mjs
node outputs/redesign/r4.1/verify-app.mjs
node outputs/redesign/r4.1/build-lab.mjs
npm run build
npm run lint
```

### Pure state / asset self-check

[self-check-results.json](self-check-results.json): PASS6.933 assertions;10targets/9asset receipts/37Education star projections. 30rapid swaps, reverse interrupted return, exact reset error0, identity của5typed arrays giữ nguyên; transient0.4/0.8s và settled4s ở60/165Hz có maxpositionerror0. AIphase tương đương trong tolerance1e−10; bắt đầu orbit chỉ tính phần delta sau1.5s. Frozen Education giữ logo0/lines1 và không dim sai điểm; static buffer không needsUpdate liên tục. Max254edges nhỏ hơn384capacity.

### Browser

Chrome plugin không tìm thấy executable; dùng Edge154 + Playwright runtime đã có, không cài dependency. Browser trace và PNG là render thật, không storyboard. Các kiểm tra reduced/hidden/touch là emulation; không nhận là OS/điện thoại vật lý.

[browser-results.json](browser-results.json) và [touch-results.json](touch-results.json) lưu từng pose/state/buffer/GL/camera/DOM. Desktop sử dụng Smoother smooth1.2; touch native smooth0 được kiểm riêng. Viewports320/390/768/1024/1440/1920; mỗi viewport có AI3logo và Pictor. Tất cả có1Canvas,1camera writer,0horizontal overflow,0GL error, cameraPath error<1e−8. Kiểm cả7tools/3Education, stars-before-links-before-logo,12rapid keyboard swaps, return→reverse, focus/blur/Escape, live reduced→normal, hidden→visible, offsection/offscreen và3mount/unmount.

Normal69records PASS/0console errors; maxDOM/world anchor error **0.000141828125px**. Native touch8records PASS/0errors. [visible-stage-results.json](visible-stage-results.json):10pose1440/390 PASS, toàn bộ điểm hình của Figma/AI/Cir/Tel/Pic nằm ngoài panel kiểm thử; PNG `*-visible-*.png`. Panel Skills/Education thu gọn trên mobile và chuyển góc phải dưới desktop, không đổi layout production. Tổng87Browser records; trace normal/native/visible-stage độc lập.

Touch390:8records PASS,12rapid tap swaps, tap chọn/chạm lại bỏ chọn, background/Escape clear, Telescopium2sao/1cạnh, reduced không đổi positionVersion. Full native return error0; DOM/world anchor error trong tolerance0.001px. Cả8records không console error.

Phát hiện và sửa một lỗi neo thật: `scrollProgress*maxScroll` vẫn ở pose manual trong khi focus native cuộn DOM. Helper nay đọc Smoother getter khi smooth>0, native scrollY khi smooth0. [probe-anchor.mjs](probe-anchor.mjs) đo centerworld/DOM; [probe-touch.mjs](probe-touch.mjs) tái hiện touch riêng. Không thêm layout read/frame hoặc thay producer/camera. Desktop anchorError được kiểm ở mọi active pose; native touch khớp trong sai số double.

### Hiệu năng / resources

192pool tất cảtiers; StarField high24.000/medium12.000/low1.500 nguyên. CPU pool5buffers8.448bytes; line buffer9.216bytes/cap384edges; GPU point attrs3.840bytes + plane. Chỉ upload positions khi morph/orbit/reset đổi, static/reduced/offscreen dừng. Renderer sở hữu3geometry/9textures; R3F sở hữu11materials. Không framework morph/physics/random orbit.

Đo `addAfterEffect` sau render; GPU query EXT_disjoint_timer_query_webgl2 bọc **toàn frame**, gồm HDR/compositor, không chỉ một render pass. Cost table/samples/config nằm trong browser-results. RTX4060/165Hz/DPR1; high có24.192points,29draw calls trong AI; low có1.692points,10calls. Viewportmobile trên GPU desktop không phải FPS điện thoại thật.

| Pose / tier | Render FPS | Frames | GPU median /p95 | Samples |
|---|---:|---:|---:|---:|
| AI1440 high /DPR1 | 165.03 |248|2.631 /3.705ms|9|
| AI390 low /DPR1 |165.03|249|0.087 /0.197ms|9|

3lifecycle identical: sau unmount root=false, scene7geometry/23textures/9subscribers; remount Figma9geometry/24textures/11subscribers. Counts là toàn scene với story/legacy thay đổi, không lấy delta làm số tài sản sở hữu của primitive. Sau chọn hết9logos scene max32textures; chọn lại một logo chỉ upload texture đang vẽ. Không tăng counts qua3vòng.

### Build / lint / phạm vi

[build.log](build.log), [lab-build.log](lab-build.log), [lint.log](lint.log): production build và actual lab entry pass; repo lint0errors/2warnings SplashCursor kế thừa; warning chunk>500KB/THREE.Clock cũ ghi riêng. Build lab dùng Vite API input3d-lab.html/outDir riêng, không sửa vite.config hoặc production entry.

[integrity-results.json](integrity-results.json):4file cũ sửa (lab,2locale lab,useSectionAnchor),3file source mới; App/CameraRig/GalaxyScene/StarField/HDR/Works/skills.js/section layouts/data/public/config/deps giữ baseline. AGENTS prefix giữ nguyên, append riêng sau nghiệm thu. [app-smoke.json](app-smoke.json) ghi smoke production entry.

App smoke PASS:1Canvas,0overflow/console errors,8neo `data-story-chapter` hiện hữu, nềnrgb(5,5,5). AGENTS đã append một dòng R4.1. Build actual lab entry compile renderer mới; production App chỉ giữ hạ tầng đang chạy.

Các `*-failure.json` là lượt development (input harness cũ/HMR hoặc binding context), không kết luận bản cuối. Bản cuối dùng source đã chốt, context normal/touch độc lập, JSON PASS timestamp mới. Không dùng HMR warning createRoot của lượt development để nhận console sạch.

## Giới hạn còn lại

Không claim FPS/thermal điện thoại vật lý hoặc OS toggle mới; chưa dựng layout Skills/Education/capability connection, route/preview/finale mới. Camera R2.1/R3.3 và Works R2.3/R2.4 giữ nguyên. Bố cục consumer thật cần đo lại windows/background khi R4.2/R4.3 tích hợp; đây là renderer và contract đã kiểm, không nghiệm thu hai section production.

Primary API references đối chiếu: [Three BufferAttribute](https://threejs.org/docs/pages/BufferAttribute.html), [R3F useFrame/hooks](https://r3f.docs.pmnd.rs/api/hooks); source GSAP3.15 đã cài xác nhận native/touch smooth0 và content transform cache, không dựa vào API đoán.
