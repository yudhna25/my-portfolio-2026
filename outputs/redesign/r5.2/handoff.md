# R5.2 → R6.2 / R7.1 — Works thật

08/10/2026. Task này thay UI Works; không tạo route case study hoặc finale production.

## Dữ liệu / renderer

- `#work` và Nav/Menu ID `work` giữ nguyên. Ba ID canonical `edura`, `veris`, `vie` ánh xạ `PORTFOLIO_DATA.projects[0..2]` (legacy ID `01/02/03`) và `works.projects.eduraLms/verisApp/viePerfume`.
- EDURA→Centaurus (Cen), VERIS→Gemini (Gem), VIE→Cygnus (Cyg). `WorksConstellations` vẫn đúng một instance đã được R5.1 mount trong App, chung lab. JSON/catalog/projection/edges, basis/quỹ đạo/camera/finale geometry không đổi; chỉ strength selected tăng 1.2, idle1, other0.35. Đây là dàn cảnh portfolio, không chuyển động thiên văn thật hoặc stick figure IAU duy nhất.
- `Work.jsx` bỏ filter/grid/card/Flip/reticle; `TargetLockReticle.jsx` đã gỡ sau kiểm caller duy nhất. Preview không render các description legacy chưa được xác minh; chỉ tên/lĩnh vực/ảnh gốc có màu + alt Vi/En. Public assets/data/navigation/store giữ nguyên hash.

## Đọc / DOM / focus

- `[data-story-chapter="works"]` bao `#work` **160vh** dành riêng việc xem/chọn. Chưa thêm mốc finale; R7.1 tạo đoạn cuộn riêng 2–2.5 viewport theo kế hoạch.
- Controls/preview thuộc đúng DOM section trong main. Frame tuyệt đối 100vh trong section; `gsap.quickSetter(y)` lấy `chapterProgress * cachedSectionHeight` từ producer R2.1/R5.1. ScrollSmoother đã trừ visible scroll, nên frame đứng yên trong viewport. Ngoài Works y=0, content ở vị trí section thật, không hidden/inert làm mất Tab entry. ResizeObserver đo section, unsubscribe/disconnect khi unmount. Không scroll listener/producer/camera/ticker mới.
- Keyboard focus-visible đi từ chương khác vào target/preview dùng existing Smoother offset→scrollTop hoặc native scrollIntoView **sau một requestAnimationFrame**. Native/Smoother focusin có thể seek sau React focus handler nên synchronous seek chưa đủ. Pending frame cũ bị hủy khi có focus-entry handler mới, Escape/background dismiss hoặc unmount; callback còn kiểm element connected + activeElement trước khi seek. Khi có Smoother, sau scrollTop callback đồng bộ chính ScrollTrigger mà Smoother sở hữu bằng `trigger.update(); trigger.getTween()?.progress(1).pause(); trigger.animation.progress(trigger.progress);`. Bước này hoàn tất scrub tween hiện có và đưa animation tới trigger progress mới, tránh tick scrub tiếp theo kéo visible content về vị trí focus cũ. Source cuối **không** dùng `animation.invalidate()` tại Work; không tạo tween/timeline/controller mới. Native fallback chỉ scrollIntoView. Khi đã ở chapter Works không seek lại. Producer hiện có xuất chapter/pose; không tự set camera/progress. Focus được đọc lại khi Works active, tránh mất owner lúc thay chapter. Nav/hash vẫn đi trực tiếp đúng #work; không replay Experience.
- Targets `#work-target-edura|veris|vie`, `data-work-target`; vùng ảnh `#work-preview`, `data-work-preview[data-active]`; nền `data-work-background`. Khung preview luôn giữ footprint160/176/192px theo breakpoint. Intrinsic decode/attributes thật: `/project1.webp` EDURA1600×1131, `/project2.webp` VERIS và `/project3.webp` VIE1600×900; img width1600, height=`project.id === 'edura' ? 1131 : 900`. CSS slot vẫn aspect16:10 + object-contain để giữ nguyên toàn bộ cover trong footprint cố định; không dùng 1600×1000 làm số đo ảnh gốc. Reduced giữ chòm/DOM tĩnh, preview không tween.

## Input / phase

- Dùng nguyên store API `setWorksInteraction('Selection'|'Focus'|'Hover', id|null)` / `clearWorksInteraction()`. Effective project = **Selection → Focus → Hover**, DOM và renderer cùng ưu tiên. Pin selection giữ preview trước hover/Tab đến mục khác; chọn mục khác hoặc clear mới đổi pin. Không claim mọi Tab đổi preview khi pin còn giữ.
- Mouse hover xem nhanh, leave chỉ clear Hover; keyboard focus xem nhanh, blur chỉ clear Focus. Preview link focus tiếp tục owner tương ứng. Click/Enter pin hoặc unpin; touch/pen tap clear các owner cũ rồi toggle Selection, retap active clear hết. Escape/nền focus group bằng preventScroll rồi clear. Không Tab trap.
- `worksOrbit` object được giữ trong Zustand: `phase/origin/velocity/latched/visited/captures/resumePending`. **WorksConstellations vẫn idle writer duy nhất**, 0.075rad/s/damping6/s/delta cap0.05. Không UI reset phase. OR owner pause, clear resume tăng tốc tại phase hiện tại.
- R7.1 giữ capture-once contract R2.3/R2.4: producer setStoryPosition sync capture trước state; finale/jumpContact latch origin, reverse giữ origin; canonical Works release + skip idle frame đầu. Task này không làm controller/finale mới.

## CTA / reader dependency

- Chỉ EDURA có `data-work-action` **disabled button**, nhãn xem case + dòng chuẩn bị. Không href /projects/edura khi route chưa có. `data-work-behance` là liên kết phụ thật: https://www.behance.net/gallery/241524417/Edura-LMS, target_blank + noopener/noreferrer, audio click hiện có.
- VERIS/VIE: tên/lĩnh vực/preview + text sắp ra mắt; không href/nút hành động giả. R6.2 thay slot EDURA bằng route thật /projects/edura, không đổi gesture chọn/hành động riêng.
- Trước mở reader, R6.2 cần lưu **visible scroll** bằng `ScrollSmoother.get()?.scrollTop() ?? scrollY` và giữ store selection cùng chính object worksOrbit; đừng lưu native scroll đang lệch Smoother hoặc tạo orbit mới. Thông tin storyChapter/chapterProgress/scrollProgress đã có; chưa thêm store/history manager tại R5.2.
- Khi Back/return: khôi phục tọa độ cuộn sau layout/Smoother ready và để producer hiện có xác nhận chapter Works, **sau đó** giữ/khôi phục EDURA selection, focus `#work-target-edura` preventScroll. Focus trước khi chapter/scroll restore ổn định có thể kích focus-entry fallback seek về Works top và mất progress đã lưu. Direct reader không history main dẫn `/#work`. Reader route/history/scroll restore thật là dependency R6.2, chưa được triển khai/kiểm pass ở task này.

## Bằng chứng

Xem verification.md, browser/check-production/integrity/lifecycle/preview/performance JSON cùng thư mục. Screenshot storyboard chỉ tham chiếu bố cục; screenshot Browser là render thực. Mobile/OS reduced/hidden là emulation trên Windows, không chứng minh phần cứng điện thoại.
