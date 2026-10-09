# R5.2 — Audit trước tích hợp và review độc lập

08/10/2026. Trạng thái: **đã audit baseline và review source tích hợp R5.2**. Chỉ đọc source, chạy numerical/source checker và ghi artifact; không chạy Browser, không đánh giá cảm nhận render/build. Root sở hữu tích hợp và AGENTS. Phần “baseline” dưới đây ghi trạng thái trước sửa; review implementation hiện tại ở cuối.

## Baseline và dependency thật

Đã đọc prompt R5.2 + quy ước chung, kế hoạch mục 8–9/11–13, AGENTS mới nhất, R2.3 contract, R1.1 Works desktop/mobile frames thật, R5.1 shared renderer/handoff hiện tại. Skills: frontend-design, react-3d-ui, gsap-react, accessibility.

- `src/components/Work.jsx` vẫn là grid ba card, filter + Flip, image clip/reveal và TargetLockReticle. Đây là DOM cần thay; dữ liệu/ảnh/title không bỏ.
- App đã mount một `WorksConstellations` dưới Canvas hiện có sau R5.1. Camera/arrival/departure dùng chung; không cần thêm Canvas, scene riêng, camera writer hoặc orbit controller.
- Chưa có route `/projects/edura`: App luôn render trang chính, không route switch/history reader; chỉ hook scroll lắng nghe popstate để xử lý hash. `vercel.json` không tồn tại. R5.2 giữ slot EDURA chưa điều hướng, R6.2 bật route thật; không dùng URL giả hoặc Behance làm action chính.
- App hiện chưa có mốc DOM `finale`; R5.2 giữ handoff contract và đoạn đọc/chọn riêng. Production finale là trách nhiệm R7.1, không tự thêm đoạn nổ ở đây.

## Project → geometry → asset

| Project/store ID | Legacy data ID / locale key | Chòm sao | Main/context/edges | Ảnh thật |
|---|---|---|---|---|
| edura | 01 / eduraLms | Cen / Centaurus | 17 / 12 / 16 | /project1.webp, intrinsic 1600×1131 |
| veris | 02 / verisApp | Gem / Gemini | 17 / 12 / 16 | /project2.webp, intrinsic 1600×900 |
| vie | 03 / viePerfume | Cyg / Cygnus | 10 / 12 / 9 | /project3.webp, intrinsic 1600×900 |

Đã parse hai JSON và so từng object source → runtime: ba mục `src/3d/data/worksConstellations.json` **bằng nguyên vẹn** ba mục Works R0.2; source SHA256 = `1047432e95bcea8105c521801fee19ff81f2dce92ccf1f1cdfd682f56cfe1c9f`, trùng khai báo runtime. Tổng 44 main + 36 context = 80 điểm, 41 cạnh. Context không thêm links và có thể chứa sao chòm lân cận.

Giữ chart convention Stellarium Modern, commit `daace2add6a1bf886e8ee1934f51e9c69f818d18`, CC BY-SA 4.0; Hipparcos ICRS/J1991.25, north-up/celestial-west-right, local z0, scalar scale chung. IAU quy định tên/biên chòm, không một stick figure duy nhất. Không mirror/stretch/rotate riêng để vừa layout; Centaurus không Sagittarius. Tên/ẩn dụ chỉ là diễn giải sáng tạo, không gán Gemini bảo mật hoặc Cygnus nước hoa như ý nghĩa thiên văn.

Nên map ID rõ bằng metadata nhỏ hoặc field trong data hiện có, không để DOM/store renderer dùng `01` trong khi renderer chỉ nhận `edura`. Tránh mapping ngầm dựa thứ tự `projects` nếu sau này dữ liệu được sắp lại. Không cần abstraction/registry mới.

## Copy / CTA / reticle

- `works.projects.*.title/category` dùng được cho preview; ảnh giữ nguyên màu. Alt mới mô tả cover, i18n Vi/En và decoding async. Root đối chiếu decode PIL + production Browser: EDURA intrinsic1600×1131, VERIS/VIE intrinsic1600×900. Source img attributes cuối là width1600 và height=`project.id === 'edura' ? 1131 : 900`. Các ảnh gốc có tỷ lệ khác nhau; **slot CSS** 16:10 + object-contain giữ footprint ổn định và toàn bộ cover, không coi 16:10 là intrinsic ratio của ảnh.
- EDURA legacy description vẫn chứa claim “Excellent về đổi mới UX” trong cả data và locale. Kế hoạch mục 11 cấm đưa claim này sang nội dung mới khi thiếu căn cứ. R5.2 chỉ cần tên/lĩnh vực/ảnh, không mang description cũ vào preview.
- Đã xem `/project2.webp`: VERIS là cover viết trải nghiệm/chữa lành cảm xúc, không chứng minh mạng xã hội/privacy/feed algorithm. R1.1 frame notes cũng đã cảnh báo lệch mô tả. Dùng category UX/UI Design và alt trung tính đúng cover; không lấy mô tả legacy cho nội dung mới.
- EDURA có **slot** “Xem case study” chờ R6.2, không href, không onClick route giả. Ghi dependency trong verification/handoff. VERIS/VIE dùng text sắp ra mắt, không fake link hay button hành động giả. Ba nút **chọn preview** vẫn hoạt động bình thường, kể cả pending.
- URL Behance EDURA thật là `https://www.behance.net/gallery/241524417/Edura-LMS`; nếu hiện, là link phụ có label/opens-new-tab rõ. Tách khỏi nút chọn và CTA pending, không nested interactive controls.
- `TargetLockReticle` chỉ có caller Work (`import` + JSX); lab/scene không import. Gỡ caller sẽ gỡ ba trigger `works-target-lock-*`, bracket/flare/target label và radio click tự chạy của set piece này. Giữ audio engine/Sound và action click thật. Có thể xóa module sau caller check; không cần giữ vì lab.

## Layout đề xuất dựa storyboard + renderer hiện có

Giữ một sân khấu thoáng, heading gọn phía trên, ba đích chọn DOM cố định, preview ở một vùng cố định **dưới** sân khấu. Không ba card, filter, viền hộp hoặc nhãn chạy theo sao. Các frame `r1.1/frames/1440/vi/worksEdura.png` và `390/vi/worksEdura.png` đã được mở xem; chúng là minh họa, không pixel contract với pose cũ -420. Runtime pose mới phải lấy R5.1/cameraPath hiện tại.

- Desktop: preview một hàng image + name/category/action, max-width theo nội dung; cover khoảng 280–320px ngang, vùng text bên cạnh. Heading/selector giữ yên trong Works; ảnh không phủ lên ba hình sao. Dự trữ chiều cao preview ngay ở idle, khi đổi ID chỉ đổi opacity/nội dung, không thay height hoặc đẩy sân khấu.
- Mobile 320/390: ba nút chọn cùng thứ bậc ≥44px, wrap tên nếu cần, không cuộn ngang/carousel. Preview có thể gọn image bên trái + title/category bên phải và action riêng hàng dưới để phần sao vẫn đủ thấy trong viewport; nếu xếp preview ảnh lớn dưới toàn bộ map theo storyboard, phải có frame nghỉ thật mà cả ba chòm còn nhìn được và selector không trôi khỏi đích bấm. Không thu chữ thành nhãn 9px để bù layout.
- Một preview slot có aspect-ratio rõ + vùng metadata/action có min-height theo copy dài nhất. Không mount/unmount slot theo hover gây layout shift. Idle slot có help/nhãn i18n hoặc không gian dự trữ có chủ đích; không tạo gallery/card mới.
- Renderer hiện tính rigid Works basis theo viewport: centers khoảng 46% chiều cao, radiusY desktop13%/mobile17%; figures vẫn giữ orientation. Phải kiểm toàn quỹ đạo, không chỉ phase0: ngôi sao đầu/cuối và preview/header không chồng nhau. Nếu cần thu stage, chỉnh **layout basis/radius/scale chung của component shared** bằng viewport/stage geometry, giữ phase/origin/sampling và cùng basis cho finale; không parent group vào live camera hay thêm một renderer.
- Reduced giữ tất cả ba hình sao và selector/ảnh tĩnh, chọn đổi sáng/preview tức thì; WebGL fallback còn selector/preview/CTA status DOM đầy đủ. Không tắt selection vì Canvas thất bại.

## Ownership / stop / resume cần giữ

Nguồn duy nhất: `useScrollStore.worksSelection/worksFocus/worksHover`, IDs `edura|veris|vie`; `WorksConstellations` sở hữu idle `advanceWorksOrbit`, tốc độ0.075rad/s/ease6/dt cap0.05. Pause/resume chỉ đổi velocity target, không reset phase. Producer `setStoryPosition` latch origin trước khi render finale; R5.2 không mutate/recreate `worksOrbit` hoặc phase mỗi React render.

Renderer hiện effective ID **Selection → Focus → Hover**. DOM preview phải dùng cùng ID để ảnh và sao không lệch nhau. Điểm cần chốt khi implement: selection touch/Enter có thể giữ EDURA, rồi Tab focus VERIS vẫn bị Selection ưu tiên. Focus cần phản hồi tương đương hover theo prompt; có thể chuyển selection khi focus keyboard sang mục khác, hoặc thống nhất ownership priority ở **cả DOM/shared renderer** nếu điều chỉnh. Không để DOM dùng Focus-first còn renderer vẫn Selection-first.

- Pointerleave chỉ clear Hover; blur chỉ clear Focus. Rời pointer không xóa focus keyboard hoặc touch selection. Hover vùng selector→preview/CTA không nên mất ID trước khi người xem tương tác với preview; dùng containment/focus-within hoặc selection rõ khi cần, không timer delay/controller mới.
- Tap active hoặc nền clear Selection; touch focus tự phát sinh không giữ pause lại sau clear. Escape/chạm nền chuyển focus tới một group ổn định `tabIndex=-1` rồi clear owners; không focus jump vào chòm đang xoay. Tab qua cả ba nút + Behance/action thật bình thường, không trap.
- Khi section inactive: clear transient Hover/Focus, inert/hidden controls theo visible story stage, tránh focus “ma” trên vùng preview đã fade. Selection có thể giữ để Back/restore R6.2, không reset orbit; không bỏ pending DOM data. Cleanup unmount must clear transient và listeners/triggers thuộc DOM.
- Locale/resize/reduced update không clear selection hoặc recapture origin một cách ngẫu nhiên. Dùng `useGSAP` cleanup cho opacity/reveal; update i18n DOM mà không setState/tick mỗi frame.

## Handoff / kiểm tra sau source tích hợp

Cần bàn giao projectID/localeKey/image/source/CTA availability, selection owners, `worksOrbit` identity/origin/phase + scroll/pose/focus origin cho R6.2. Browser lúc sau phải cover ba preview/rapid switch/keyboard focus+pointerleave/touch toggle+background clear, các viewport320/390/768/1440/1920 Vi/En/reduced, all-phase fit, idle pause/resume và prototype finale origin unchanged. Kiểm link status, raw color ảnh, renderers/Canvas unchanged. Audit này chưa chạy các kiểm tra đó và chưa ghi R5.2 pass.

## Review implementation hiện tại

Đối chiếu `before/`/baseline hiện tại: Work thay grid/filter/Flip/card/reveal/reticle bằng một stage DOM trong main; WorksConstellations chỉ thay selected strength1→1.2, hai locale thêm control/alt/figure labels và bỏ keys filter/reticle không còn caller; TargetLockReticle module đã xóa. Renderer basis, cameraPath, orbit/store, source geometry, App/Canvas, data/assets và PWA giữ hash. Không thấy camera/orbit writer mới, phase reset hoặc source geometry copy mới.

- Stage `absolute h-screen` trong Work `min-h-[160vh]`, transformY = `chapterProgress * cachedSectionHeight` qua một store subscription. Nó triệt scroll cùng range Works do producer đo, giữ header/selector/preview ở vị trí viewport ổn định mà vẫn có DOM order trong main. Chapter khác trả y0 và DOM nằm ở vị trí section tự nhiên; source cuối không hidden/inert gate trên Work. ResizeObserver chỉ measure ngoài frame; cleanup disconnect/unsubscribe qua useGSAP. Không đo layout/setState mỗi frame hoặc top/left animation.
- Preview slot có height cố định160/176/192px theo breakpoint, CSS aspect16:10/object-contain/lazy/async/alt Vi-En. Intrinsic attributes cuối khớp decode: EDURA1600×1131, VERIS/VIE1600×900; CSS slot và source dimensions là hai thông số riêng. Actual content chỉ title/category/alt/action status; không render các descriptions có claim cũ. Tên và selector cố định không parent vào constellation orbit. Source alone không chứng minh all-phase fit/zero pixel overlap; đó là Browser matrix của root.
- Preview target `selection ?? focus ?? hover` trùng hoàn toàn renderer. Mouse only sở hữu Hover; touch/pen không để focus tự phát sinh giữ pause sau toggle. Pointerleave chỉ xóa Hover; blur vào preview giữ Focus, preview focus capture tiếp tục giữ project. Escape/background focus root ổn định rồi clear owners. Active change/unmount chỉ clear transient Hover/Focus, giữ Selection/orbit cho restore. GSAP preview transform/opacity có context cleanup và dependency locale/reduced/ID.
- EDURA reader button disabled, không href/onClick route; dependency i18n rõ. Behance là anchor phụ thật với rel/target/opens-new-tab label. VERIS/VIE có text coming-soon, không anchor/action giả; cả ba nút preview vẫn hoạt động. Không nested interactive controls. Reticle references/caller đã hết; audio click trên Behance giữ engine/Sound opt-in cũ.
- Live announcement dùng title/category và hint/control labels i18n. Reduced bỏ preview tween; Orbit shared frozen theo App vẫn giữ phase/selection. WebGL fallback không phải điều kiện để render DOM Work.

### Hành vi cần ghi đúng phạm vi keyboard

**Selection là pin có ưu tiên hơn Focus/Hover**, giữ đúng contract R2.3. Khi đã pin EDURA, Tab focus VERIS chưa đổi preview cho đến khi nhấn chọn VERIS hoặc clear pin; pointer hover cũng vậy. Không được mô tả “mọi lần Tab đều đổi preview” trong verification. Hint hiện nói “press to keep a selection”, nên trạng thái pin có giải thích; Browser cần kiểm Enter đổi chọn, Escape clear và không mất focus khi pointerleave.

**Active gate issue đã được sửa; native focus seek có guard và scrub sync riêng.** Bản trung gian `hidden={!active}` loại selector khỏi native Tab sequence khi chưa ở Works. Root đã bỏ gate và giữ DOM trong main; ngoài chapter Works, stage ở section top/y0 và offscreen theo vị trí thật. Root's Browser kiểm sau đó thấy synchronous React focus seek vẫn có thể bị native/Smoother focusin ghi scroll tiếp, đưa focus EDURA về chapter departure; chỉ rAF seek cũng chưa hoàn tất visible scrub. Source frozen cuối hoãn seek một `requestAnimationFrame` riêng của focus entry. Callback chỉ chạy khi element còn connected và chính nó còn activeElement; handler mới hủy pending frame cũ, Escape/background dismiss hủy frame, useGSAP cleanup unmount cũng hủy frame.

Callback khi có Smoother gọi `smoother.scrollTop(smoother.offset(section.current, 'top top'))`, rồi lấy `smoother.scrollTrigger` và gọi chính xác `trigger.update(); trigger.getTween()?.progress(1).pause(); trigger.animation.progress(trigger.progress);`. Nó hoàn tất scrub tween đã tồn tại và đồng bộ playhead với trigger progress mới; source cuối không gọi `animation.invalidate()` tại Work. Đây là public API trên ScrollTrigger/animation mà Smoother hiện có sở hữu, không tạo tween/timeline/producer/controller mới. Khi không có Smoother, fallback chỉ `section.current.scrollIntoView({ block: 'start' })`. Handler không setStoryPosition/manual/progress store hoặc camera.

Effect khi Works active reassert target đang focus-visible để giữ Focus qua cleanup ở boundary. Focus trong chính chapter Works không seek, nên Tab giữa targets hoặc tới preview không đưa progress về0. Thay focus trước callback làm guard bỏ callback cũ. Source frozen đã được đọc lại; root báo Browser matrix20/20 đã pass, extras native/lifecycle/preview/performance còn đang hoàn thiện. Báo cáo source này không nhận kết quả đó là final DoD hoặc tự suy native Tab/Shift+Tab pass từ code. Không tạo fixed portal mới ngoài main. R6.2 phải khôi phục visible scroll và để producer xác nhận chapter Works **trước** restore focus EDURA, để focus-entry fallback không ghi đè progress restore bằng một seek về section top.

### Checker chạy được

`node outputs/redesign/r5.2/check-production.mjs` **PASS**. Harness tái dùng nguyên checker R2.3 qua resolution/output destination riêng, không sửa R2.3 hay source. 356 assertions geometry/projection/real-store guards/capture/reverse/release/60-vs-165Hz/offscreen; thêm 64 actual DOM-vs-renderer owner combinations, ba canonical identity + control/alt keys ở hai locale, pending link status từ data và 95 baseline file hashes được giữ.

Artifact: `check-production-results.json`; đã chạy lại một lần sau fix intrinsic image attributes cuối (15:46:42 UTC), vẫn PASS356 + ownerCases64 + protectedBaseline95. Checker không hardcode intrinsic1600×1000 nên không cần sửa assumptions hoặc bỏ protected hash check. Max projection error4.961370758671535e−10, refresh-rate phase difference1.1102230246251565e−16. Không mới controller hoặc task framework. Checker không nhận UI click thật/Browser layout/console/FPS đã pass; kết quả đó do root/Browser agent cung cấp. Final matrix rerun/production24 đang do root kiểm bổ sung; báo cáo này chưa nhận final DoD. Không có blocker runtime mới xác nhận từ source/numerics; pin semantics và keyboard fix/verification trên cần giữ trong kết luận nghiệm thu.

### Nghiệm thu tích hợp sau review

Root đã đọc evidence cuối: final matrix340/20 configs, production24, StrictMode cleanup3cycles và self-check356+64 đều PASS; FPS riêng163.996/165.114 ở1440×900/high/DPR1/RTX4060, console/GL errors0. Final integrity giữ95 hash và AGENTS prefix, chỉ append1row. Kết quả và các run chẩn đoán/giới hạn được ghi đầy đủ trong verification.md; các câu “pending” phía trên là trạng thái tại thời điểm source review, không còn là thiếu hụt nghiệm thu R5.2. EDURA reader/R6.2 và finale/R7.1 vẫn chưa được triển khai đúng scope.
