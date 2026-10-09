# R5.1 → R5.2 / R7.1

08/10/2026. Chỉ tích hợp meteor Experience và lối vào Works. Preview/chọn dự án/R6 reader/finale production chưa triển khai trong task này.

## DOM và progress

- Giữ `#experience`, `#experience-heading`, tên/copy Vi–En từ `experience.positions.*`, thứ tự HOSANA MEDIA → UPWORK → DESIGNVELOPER. Ngày và loại công việc giữ nguyên; `ul` thể hiện ba kinh nghiệm có thời gian chồng nhau, không đánh số chuyển việc.
- `[data-story-chapter="experience"]` bao Experience như trước. Cuối phần đọc có **mốc DOM mới `departure`**, trong cùng section, ngay trước wrapper Works. Producer hiện có tự đo/sort cả hai mốc. Experience range kết thúc tại top departure, departure range kết thúc tại top Works; không chia phần trăm toàn trang.
- Departure cao **110vh**, reduced **20vh**. Phần trước nó dành 50vh cuối cho việc đọc mô tả và đầu sao ổn định; không pin, không fake scroll listener/producer. Lab có chapter `departure` và nhãn/ghi chú Vi–En tương ứng, min-height110vh; lab vẫn chỉ minh họa pose camera và shared Works, meteor đo nội dung thật ở App.
- `useScrollStore.currentSection` alias departure → experience để Nav/Menu giữ mục đúng. `storyChapter/chapterProgress/storyManual` và `useScrollProgress` giữ API. Direct `#work` dùng endpoint Works, không replay meteor/intro.

## Layout và đường bay

- `Experience.jsx` đo geometry DOM trong `useGSAP`/ResizeObserver/resize/ScrollTrigger refresh; locale/reduced rebuild có cleanup. `onLayout` stable callback App nhận mutable frame data vào ref `meteorLayout`. Không React setState/frame, không đo layout trong useFrame.
- `createMeteorLayout()` ở `src/3d/utils/storyMeteor.js`: width/height, `range` Experience→departure, 5 control points XY (X normalized viewport, Y theo section px), 3 milestone Y. Đây là cache frame data, không store UI mới.
- Ba control points đo từ `[data-meteor-label]` phía trên tên công ty **24px**. Company+role có opacity0.72→1 theo khoảng cách đầu sao/mốc; description/period/type luôn hiện. Reduced tất cả labels opacity1 và không meteor.
- `meteorReadingY(layout,p)` tăng theo range DOM và reading line22→50% chiều cao viewport. Nội suy X smoothstep qua ba mốc; endpoint cuối X0.62/Y0.5viewport.
- **Journey**: Experience0..1, departure1..2. `sampleStoryMeteor(layout,q,out,pose)` là một curve world xác định; mỗi q dùng scroll/pose của chính q. `writeStoryMeteor(layout,journey,positions,out,pose)` lấy **128 điểm** từ head journey lùi tối đa0.24 trên cùng curve. Không lưu history theo delta/time/random. Alpha `(1-i/127)^1.8`, lõi line1px, head5 CSS px × DPR.
- Departure tăng depth24→96 scene units, X0.62→0.5, centerY0.5; scalar basis lấy `storyCameraPath('departure',p)` và FOV responsive hiện có. Camera writer vẫn chỉ CameraRig; meteor chỉ đọc contract pose để sample world point. Các vector/buffers/scratch reuse; không allocation/frame.
- Head+trail fade ở departure0.70→1; `worksArrival()` mở shared Works từ departure0.30→1. Hai đầu Experience1/departure0 và departure1/Works0 liên tục. Cả pre-curve và dive về zero tangent tại điểm nối; self-check kiểm điều này.
- `StoryMeteor` ở `src/3d/components/StoryMeteor.jsx`, một instance App, hai geometry/head+line và hai shader material, tự dispose. Hai material có uniform maps riêng do R3F sở hữu, đều cập nhật opacity/DPR. Khi inactive/reduced/hidden không viết buffers.

## Camera và shared Works

- **Experience giữ endpoint EDUCATION R4.3:** position `[2,5,-110]`, target trước aspect bias `[-64,-42,-200]`; BH nền góc trên/phải suốt phần đọc.
- **Departure:** smoothstep từ EDUCATION tới WORKS, dùng chính `chapterProgress`, không damping phụ.
- **Works giữ R2.3:** position `[0,4,-160]`, target `[140,0,-210]` trước aspect bias. BH ra ngoài khung qua chuyển hướng camera; không tắt mesh/đổi shader tâm hoặc camera thứ hai.
- App đã mount **một `WorksConstellations` dùng chung lab**, thêm arriving visibility/strength bằng `worksArrival`. Idle chỉ tích phân khi chapterWorks; departure giữ phase đã có, stop/reverse không reset phase/origin. R5.2 dùng instance này, không mount thêm.
- Dữ liệu Centaurus/Gemini/Cygnus, basis/quỹ đạo, `worksOrbit` phase/origin/capture/return contract giữ nguyên. R7.1 tiếp tục capture once từ R2.3/R2.4.
- **Work.jsx vẫn UI cũ chờ R5.2**: R5.1 chỉ bỏ meteor event filter. Preview cố định/selection/links/reticle cleanup không làm ở đây. Trong handoff, ba chòm đã mở ra, heading/card cũ cuộn vào cho tới khi R5.2 thay layout.

## Lịch sao băng nền

`ambientMeteorVisibility(chapter,p)` trong `src/3d/utils/shootingStars.js` dùng bởi ShootingStars:

| Chapter | Lịch |
|---|---|
| Hero / portal / Experience / departure / finale / chapter lạ |0, clear active pool, ngừng countdown|
| About / Contact |fade vào p0..0.1 rồi1|
| Skills |1|
| Education |1, fade xuống0 ở p0.9..1|
| Works |fade vào0..0.1; fade ra0.9..1|

Chỉ phát mới khi opacity1; vệt có sẵn giảm sáng ở khoảng fade. Pool còn **3 slot ×24 points**, random2–3 vệt/4–7s như trước, không reactive slots. Đã gỡ dispatcher/listener `trigger-shooting-star`, `triggerReactiveMeteor`, `triggerShootingStar` và cả ba caller Work filter/Contact copy/mailto. Filter/audio/clipboard/mailto giữ nguyên. GalaxyScene giữ cơ chế hidden/reduced/unmount hiện có; khi quay lại tab, ambient pool mới chờ4–7s, không bù thời gian ẩn.

R7.1 cần giữ gate finale; R5.2 giữ khoảng đọc Works độc lập, không bật ambient trong departure. Không đưa random event vào story curve.

## Kiểm chứng / giới hạn

Xem `verification.md`, `check-motion.mjs`, `browser-results.json`, `lifecycle-results.json`, `preview-results.json`, `performance-results.json`, `integrity-results.json`. Browser kiểm App/scene thật; test mobile/OS reduced/hidden là emulation trên máy Windows, không chứng minh FPS/thermal điện thoại thật. Render cũ của Works và terminal Contact nằm ngoài R5.1. Không đánh dấu toàn redesign hoàn tất.
