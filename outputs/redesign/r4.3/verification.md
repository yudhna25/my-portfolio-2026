# R4.3 — Education: bản đồ ba nhánh

**PASS — 08/10/2026.** Thực hiện riêng R4.3 sau R4.2. Renderer, dữ liệu sao và pipeline dùng chung; chưa triển khai R5.1.

## Phạm vi / baseline

Baseline mới lúc `2026-10-08T12:51:57.632Z`: [baseline.json](baseline.json), `before/`, HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb`. Không dùng snapshot R4.2 làm bằng chứng mới, không reset/stage/commit thay đổi cũ.

Trong 96 file baseline: **7 sửa, 89 giữ hash**, thêm2 file mapping/store. Các file sửa: Education, App (stable stage refs), SkillsSymbols (bridge một consumer), cameraPath (EDUCATION endpoint), useScrollProgress (responsive range hold), hai locale (chỉ6 string keys Education mới mỗi locale). File mới `src/data/education.js`, `src/stores/useEducationStore.js`. `data.js`, Skills UI/data/store, SymbolStars/symbolMorph/symbolTargets/useSectionAnchor, GalaxyScene/CameraRig/HDR/shader/quality, public/config/dependency/Nav/Menu/Cursor/Sound/PWA giữ nguyên. HEAD/index/AGENTS prefix được kiểm hash/byte; chỉ append một dòng tiến độ sau verify. [Integrity](integrity-results.json).

Áp dụng frontend-design, react-3d-ui, gsap-react, accessibility và Ponytail full: native school button, Zustand selection, một pool hiện có, observer/GSAP cleanup. Không thêm Canvas/composer/camera writer/framework/dependency hoặc engine riêng trong section.

## Kết quả giao diện

Desktop là bản đồ **1,75 viewport** ở1440/1920, ba nhánh bất đối xứng cùng tồn tại: SGU trái trên, Green phải thấp hơn18vh, Arena trái giữa ở hàng dưới. Không card lớn, node timeline, đường nối tuần tự hoặc thứ tự đào tạo loại trừ nhau. Mobile/tablet một cột; window sao lớn với chiều ngang92/88/84% lệch nhẹ; trường/ngành/niên khóa/description luôn có trong DOM và không phụ thuộc hover/Canvas.

Giữ copy học vấn Vi/En đã duyệt. R0.2/R1.1/R4.1 mapping được đối chiếu:

| Trường / niên khóa | Ngành | Chòm / geometry |
|---|---|---|
| Saigon University /2021–2026 | CNTT |Circinus:3 main+11 context,2 cạnh|
| Green Academy /2022–2023 |Dựng phim chuyên nghiệp|Telescopium:2 main+6 context,1 cạnh|
| Arena Multimedia /2024–nay|Advanced Diploma in Multimedia|Pictor:3 main+12 context,2 cạnh|

Các thời gian hiển thị đồng thời, không biến thành ba bước nối tiếp. H3 bao native button; period/constellation/degree là sibling, không heading nằm trong button. Focus outline trắng rõ, target≥44px. Chỉ label/header có fade tối để đọc, không overlay làm chìm các sao trong stage. Nhãn chòm white/55; không cyan/amber, halo hoặc kính/card.

Frame thật: [Circinus desktop](screenshots/1440-saigonUniversity.png), [Telescopium desktop](screenshots/1440-greenAcademy.png), [Pictor desktop](screenshots/1440-arenaMultimedia.png), [Telescopium mobile production](screenshots/production-390-vi-no-preference-greenAcademy.png). Screenshot viewport có thể cắt phần heading khi đã cuộn để chọn trường; đây là vị trí cuộn thật, không font/viewport clip lỗi ở frame đầu.

## Nguồn hình sao → renderer

`symbolTargets.json` giữ exact subset từ `constellation-data.json` R0.2. [Source audit](source-audit.md), [check-source results](source-results.json), [catalog checker](source-catalog-run.json) xác minh source receipt/hash, star IDs, projection, cạnh và Float32 goal/reset.

- Cạnh theo Stellarium Modern pinned commit `daace2add6a1bf886e8ee1934f51e9c69f818d18`, CC BY-SA4.0; vị trí/Johnson V từ ESA Hipparcos/CDS VizieR I/239, ICRS **J1991.25**, không relabel thành J2000/2026.
- Gnomonic north+Y/celestial west+X, z0, uniform scale hai trục. Không mirror/stretch/rotate từng hình. Billboard toàn stage theo camera giữ orientation; Browser kiểm quaternion và positive uniform scale.
- Cir: HIP71908→75323 và71908→74824. Tel: HIP90568→90422. Pic: HIP32607→27530→27321. Context là sao field có thật, không thêm cạnh hoặc gọi tất cả là thành viên chòm.
- IAU không quy định một stick figure duy nhất. Circinus là compa vẽ kỹ thuật; liên hệ với ngành là diễn giải thiết kế. Ba chòm này tương đối mờ ngoài trời, không gọi là nhóm sao sáng nổi tiếng. Không vẽ compa/telescope/easel thay geometry.

Sao chủ đạo có weight1 và size3–4,5px theo vmag; context dịu weight0,15. Formation0–0,45s; link nhẹ0,55–1s sau points. Không chỉ vẽ vector và không kéo StarField vào hình. Browser xác minh goal→source sai số Float32≤**2,8734e−8**, link endpoint error**0**; các main stars nằm trong window và không đè school button.

## Input / ownership / camera

Một target active. Ưu tiên focus→touch selection→hover; anchor theo target có ưu tiên cao nhất. Hover/leave, focus/blur, tap/tap lại/background clear, Escape giữ native focus, Enter/Space chọn lại. Đổi nhanh từ current positions, không link/target cũ còn sót. Null giữ anchor cuối để tan tại vùng cũ; offwindow/offchapter reset exact và dừng uploads. Reduced-motion giữ endpoint tĩnh, input vẫn dùng được, DOM đầy đủ.

Bridge hiện có `SkillsSymbols` chọn một consumer Skills/Education, một `SymbolStars` instance/pool192. Visible school control có thể nhận focus trước khi chapter top đi qua viewport top; bridge cho phép dùng renderer lúc đó, vẫn giữ Skills keyboard-focus priority. Camera tiếp tục dùng actual shared chapter; không section camera timeline.

EDUCATION endpoint được pullback thành `[2,5,-110,-64,-42,-200]` để BH ở nền phía trên/phải, nhường stage/labels. CameraRig FOV responsive và `storyCameraPath` bias giữ nguyên. Tâm BH endpoint1440×900 khoảng `(1221,63;165,40)`,390×844 `(333,80;282,67)`; observer radius90,1615>1. Skills/ABOUT endpoints không đổi; Skills→Education và Education→Experience p=0 liên tục. R5.1 nhận endpoint mới.

## Các lỗi kiểm thử đã sửa

1. Lưới12 cột với gap64px ở mobile tạo span tối thiểu704px; touch viewport bị nở728px dù overflow delta trông bằng0. Chuyển base thành một cột, desktop mới dùng12 cột; test kiểm **actual innerWidth390**, không chỉ scrollWidth−innerWidth.
2. Observer rebuild theo locale và chapter-entry cleanup có thể clear input đang focus. IO giữ instance qua locale, refresh locale riêng, không clear false→true entry; focus còn thuộc school được giữ qua reflow tạm. Escape không tự bị undo khi window xuất hiện lại.
3. Khi preceding Skills/portal reflow, chapter ranges đổi nhưng native scroll còn cũ, producer có thể publish chapter trước và mất selection. `useScrollProgress.measure` so active old/new ranges, giữ chapter/p và seek ranges mới trước publish. Locale/GSAP media hold và manual controls cũ vẫn giữ; một producer/ticker, không rewrite ScrollSmoother hoặc refocus bằng timeout từng section. [Reflow diagnostic](reflow-diagnostic.json), [QA notes](verify-notes.md) lưu trước-fix; final clean quick/full pass sau sửa.

## Kiểm chứng cuối

| Kiểm tra | Kết quả / bằng chứng |
|---|---|
| Build |PASS5,03s; PWA29 precache entries/sw.js/manifest; [build.log](build.log)|
| Scoped lint |PASS7 file JS/JSX mới/sửa; [scoped-lint.log](scoped-lint.log)|
| Full lint |0 errors/2 warnings SplashCursor cũ; [lint.log](lint.log)|
| Source / state / camera |Exact3 mappings/geometry/context/reset/copy;30 state swaps/validation/focus-anchor priority/5 camera aspects/clamp/exterior; [interaction-check-results.json](interaction-check-results.json)|
| Browser |**111 snapshots**:60 formed targets trong20 configs320/390/768/1440/1920 ×Vi/En×normal/reduced +51 interaction states; [browser-verification.json](browser-verification.json), trace/screenshots|
| Native input |3 targets/points-before-links/leave exact/9 rapid swaps; Tab/ShiftTab/Escape/Enter/blur; Skills→Education focus overlap; trusted wheel scrollout/reverse; touch3targets/toggle/background ở cả2mode|
| Live reflow |3 reduced/locale/resize cycles; native focus/target giữ khi window visible, Escape cleared qua reflow; không stale khi reverse|
| Render |1Canvas/1pool/1camera writer;0overflow/0WebGL error/0console error mới. Anchor≤**0,0001973px**, pose/link error0, quaternion delta≤5,96e−8rad|
| Lifecycle |3 StrictMode mount/unmount: mỗi lượt dispose3geometry/11material/9texture; mounted9geometry/23texture/10subscribers ổn định; unmount0Canvas/subscriber/trigger/Smoother, stores clear. Triggers31→23→23 do once-only entrances, không tăng; [lifecycle-verification.json](lifecycle-verification.json)|
| Fallback |Forced context loss:3 school controls/content và keyboard focus giữ trên#050505,0Canvas; [fallback.png](screenshots/fallback.png)|
| Production |8 configs1440/390×Vi/En×normal/reduced,24 native school interactions, actual width đúng/SW control,0console errors; [preview-results.json](preview-results.json)|
| Regression |16 Hero/About/Skills/Education direct hash states Vi/En/normal-reduced; Hero/year2026/gate/camera đúng,0errors; [regression-results.json](regression-results.json)|

Performance đo riêng sau các Browser khác đã đóng, Edge154/Windows/RTX4060 ANGLE Direct3D11,1440×900/DPR1/high. Mỗi chòm đã formed rồi đo rendered frames3s: Circinus **165,29FPS**, Telescopium **165,28FPS**, Pictor **165,02FPS**;496 rendered frames/mẫu và đúng496 ray renders. GLerror0,9geometry/23texture. [performance-results.json](performance-results.json). `drawCalls` trong artifact là last GL pass, không tổng pipeline. Không suy viewport giả lập thành FPS điện thoại thật.

## Chạy lại / giới hạn

```powershell
npm run build
npm run lint
npx eslint src/App.jsx src/components/Education.jsx src/3d/components/SkillsSymbols.jsx src/3d/utils/cameraPath.js src/3d/hooks/useScrollProgress.js src/stores/useEducationStore.js src/data/education.js
node outputs/redesign/r4.3/check-source.mjs
node outputs/redesign/r4.3/check-interaction.mjs
node outputs/redesign/r4.3/verify-integrity.mjs
# Dev :5173 và npm preview :4173 cần đang chạy:
$env:R43_PHASE='all'
node outputs/redesign/r4.3/verify-browser.mjs
node outputs/redesign/r4.3/verify-lifecycle.mjs
node outputs/redesign/r4.3/verify-preview.mjs
node outputs/redesign/r4.3/verify-regression.mjs
# Chạy riêng sau khi Browser khác đóng:
node outputs/redesign/r4.3/verify-performance.mjs
```

Chrome Browser connector thiếu executable, dùng Edge154 đã cài/bundled Playwright làm fallback thật; không cài thư viện/plugin. Mobile/touch/reduced-motion là browser emulation, chưa test OS toggle, screen reader hoặc điện thoại/nhiệt vật lý. Test forced context loss thêm warning WEBGL_lose_context sau teardown; tách khỏi run bình thường. Clock deprecated/chunk>500KB và2SplashCursor lint warnings có sẵn. SW chỉ smoke registration/control, không claim audit offline/installability mới. Source chart/pose exact không đồng nghĩa PNG ambient từng pixel deterministic.

[handoff.md](handoff.md) ghi geometry/anchor/state/camera thật và thay đổi producer cho R5.1. Chưa làm meteor Experience, không triển khai task tiếp, không deploy.
