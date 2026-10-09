# V3 — Read-only integration audit

09/10/2026. Đọc source hiện tại + Quy ước/G1/V3, V0 contract/handoff, V1 handoff và cập nhật `year-stars`, V2 handoff; áp dụng hai skill repo. Không sửa source, asset V4 hoặc chạy task kế tiếp. Đây là audit tĩnh, chưa phải Browser PASS.

## Những patch tối thiểu

1. **App gate / About thật.** `App.jsx` đang đặt toàn `data-story-content` invisible/inert đến `portalProgress===1`. Tách About khỏi gate của các section còn lại, giữ nguyên một `#about` và marker `data-story-chapter=about`. Root marker/section vẫn có footprint cũ, không transform. Ejection chỉ trên inner visual groups heading/avatar/bio/backdrop. Để About thật xuất hiện trước end portal, bù flow offset bằng range/scroll đã đo: `visualOffsetY = aboutTop - visibleScroll`; inner y compensation là số âm của offset, về 0 ở p=1. Đo lại fonts/locale/resize bằng producer hiện tại, không đo transformed inner mỗi frame.

2. **About animation writer.** `about-introduction` hiện `.play()` khi chapter About, `.pause()` khi rời; bio y/opacity vẫn tự chạy sau scroll. Bind paused timeline progress vào cùng phase hoặc bỏ competing y/opacity tween. Semantic copy/sr-only và portrait toggle giữ. Tất cả group progress, visibility/inert dùng pure `portalState`. Khi gate chuyển đóng và focus đang trong group, chuyển focus preventScroll ra stable main/skip route; không focus nội dung đang inert.

3. **O anchor.** Producer đo `[data-story-anchor=portal]` bằng `getBoundingClientRect`; V1 đặt slot cap-height trong O transparent. Giữ slot và ancestors transform-free; intake PORTFOLI glyphs individually, year/identity/intro riêng. Nếu transform h1/content/header, rect sẽ thay khi ResizeObserver/font/refresh/locale đo lại, khiến BH tự hút sai tâm/scale. Không capture một rect không cập nhật resize suốt portal. V2 fit/mapping/HDR vẫn dùng cùng slot qua store.

4. **Nav/control + skip.** `Nav`/`MenuOverlay` nằm ngoài Portfolio. Dùng outer motion wrapper cho nav/control; auto-hide yPercent chỉ trên inner nav. Trong portal phải suspend/neutral auto-hide timeline, nếu không cùng p lệch do direction và wall-clock. Skip anchor không nằm trong wrapper bị hút/inert. Skip hiện tới `#smooth-content` và scroll0, vô tình đưa lại Hero; đổi đường đọc sang stable `#about` (hoặc chọn heading đọc) và seek endpoint rồi focus. Gating nav bằng visibility + inert + aria-hidden, không opacity một mình. Menu dialog vẫn độc lập/top-layer, pause scroll/focus trap hiện có; không hấp thụ dialog đang được dùng.

5. **Cursor.** `data-custom-cursor` root là `contents`, transform trên root vô hiệu. Dùng wrapper thực có viewport geometry hoặc layer cha từng dot/ring. Portal owns wrapper; pointer quickTo owns children. Khi bắt đầu intake, finish/pause trailing quickTo để held p không tiếp tục di chuyển; backdrop lens hide khi portal, vì lens distortion trên vùng glyph không phải vật thể eject. Native cursor/keyboard luôn usable; no pointer hit surface mới.

6. **Reduced / fallback.** Reduced hook và GSAP media handlers hiện có; reuse chúng, không tạo progress engine. `GalaxyScene` context-loss/fallback chỉ đổi hình, chưa thông báo App để rút 400vh hoặc mở đọc. Cần một static/fallback boolean trong existing store hoặc App callback, propagated tới Hero/About/producer/Lab/camera; no-WebGL mount và boundary failure cũng báo. Portal/finale short, no glitch/intake/eject/zoom. On live toggle giữ chapter/p hoặc lựa chọn endpoint hợp lệ, refresh range rồi seek trước publish focus gate; không khởi động Hero lại khi đang ở Works.

7. **Direct hash / route restore.** `useRouteStore` đã map `/#about`, `/#work`, `/#transmission` vào restore, tắt preloader và set storyManual trước mount. Producer dùng historyManaged=true, restore entry key một lần, fonts remeasure; giữ luồng này. App restore hiện chờ canvas tối đa120frames; fallback không Canvas nên đổi readiness điều kiện thành scene host/explicit ready, đừng bắt scene fallback phải tạo canvas. EDURA Back phải restore chapter/p/orbit/selection trước measurement, seek rồi focus đúng target; không force hero0 từ effect portal/fallback. Không thêm hashchange listener production thứ hai.

## Tập kiểm tra cần chứng minh

- Tới/lùi cùng p0/.25/.44/.47/.50/.70/.94/1: camera/portal uniforms/group matrices/gates giống; ambient time được ghi riêng. About đã visible trong eject và avatar interactive khi visual đọc được; p1 identity không bù flow còn dư.
- Held p giữ story transforms/DOM/decode, rapid reverse/jump không reveal once hoặc camera damping. O rect chuẩn ở mọi checkpoint + resize/Vi-En; không shrink theo intake.
- Tab/Shift-Tab không đi vào absorbed controls/hidden About/rest; skip từ core tới About focus được. Khi reverse làm avatar/control biến mất, focus không nằm dưới inert ancestor.
- Open menu + locale/motion toggle giữ scroll lock và focus trap; Esc restore tới control còn thấy hoặc stable đọc. Direct hash About/Works/Contact bỏ intro; EDURA Back ở Works không bật Hero/gate.
- Live reduced 3 cycles + initial fallback/context-loss: đoạn cuộn ngắn, đầy đủ đọc/CTA, không còn 400vh trống hoặc stale Smoother/producer.

Chưa kiểm Browser, FPS, GPU allocations hoặc thiết bị thật trong audit này. V1/V2 files và V4 asset không bị audit sửa.
