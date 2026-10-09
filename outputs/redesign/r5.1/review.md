# R5.1 — Independent source review

08/10/2026. So diff hiện tại với `outputs/redesign/r5.1/before/`, đọc đầy đủ hai file mới `StoryMeteor.jsx`/`storyMeteor.js`. Chỉ ghi báo cáo; không sửa application hoặc AGENTS.

**Không có blocker runtime đã xác nhận trong source review này.** Điểm tangent của bản trung gian đã được sửa trong source cuối; kiểm tra lifecycle thật ghi ở cuối. Báo cáo này không thay kết quả Browser/build của root.

## Phạm vi đối chiếu

12 file baseline thay đổi: App, Experience, Work, Contact, ShootingStars component/utility, WorksConstellations, cameraPath, useScrollStore, hai lab locale và `3d-lab.jsx` (departure 110vh khớp mốc thật). Hai file meteor mới; 86 file baseline còn lại giữ hash. Work/Contact diff chỉ gỡ ba callsite và hai imports event; audio/clipboard/mailto/filter/links giữ nguyên. Main locale/content Experience/data không đổi. CameraRig/useScrollProgress/GalaxyScene/shader/HDR/quality và source geometry không cần sửa trong lượt này.

## Ownership / boundary

- App mount một `StoryMeteor` và một `WorksConstellations` dưới Canvas hiện có, dùng callback quality sẵn có. Lab dùng shared Works/camera nhưng không DOM meteor; hai lab locale nói rõ giới hạn đó. `captureMeteorLayout` stable useCallback, không effect rebuild mỗi App render.
- Experience giữ DOM semantic `ul/li/article/h3`, không panel/card/hover surface, có đủ công ty/vai trò/ngày/loại/description. Nhấn chỉ opacity company+role từ0.72 đến1; reduced dùng opacity1. Không opacity0 chờ đầu sao; ngày công việc chồng nhau giữ nguyên.
- `departure` nằm sau phần đọc trong cùng section Experience; producer sorted DOM range tự tìm Experience→departure→Works. Store alias departure→experience cho Nav. Không thêm producer, camera writer hay threshold store.
- Camera Experience luôn giữ EDUCATION mới `[2,5,-110,-64,-42,-200]`. departure0 cùng endpoint đó; departure1 cùng WORKS. Works basis tiếp tục tính từ cùng cameraPath Works; geometry/orbit không parent vào live camera. Ambient không ghi camera.
- Ambient đã tách utility `ambientMeteorVisibility`, default chapter không yên trả0: Hero/portal/Experience/departure/finale đều nhường sân khấu. About/Contact/Works ramp phù hợp; Education fade cuối. Background pool còn ba slot đúng nhịp2–3/4–7s. Eventdispatcher/reactive handler và mọi caller cũ hết khỏi src.
- Works reveal chỉ mở trong departure qua progress0.3..1; frozen giữ endpoint tức thì. Idle orbit vẫn chỉ advance trong chapterWorks. Phase/origin không reset bởi handoff hoặc curve; direct #work không cần đi qua Experience để dựng basis.

## Curve / world-basis checks

`sampleStoryMeteor(layout, q, out, pose)` là pure sampling, không clock/random/position history; `writeStoryMeteor` lấy 128 sample phía sau journey, alpha giảm theo index. Source cuối trừ scroll analytic bằng **`q * layout.range` của chính sample**. Mỗi điểm thuộc một world curve cố định và là vị trí đầu sao tại progress q, độc lập với journey đang render; không capture giá trị lúc vượt boundary. Points/pose/scratch/typed buffers giữ identity, không allocation/layout read trong useFrame. Resize/locale/refresh đo DOM ngoài frame; milestone emphasis dùng cùng meteorReadingY.

Đã chạy Node độc lập với module thật và `three.PerspectiveCamera` đã cài:

- 18 head projections tại journey0/.25/.5/.75/1/1.25/1.5/1.75/2, hai aspect1440×900 và390×844, layout synthetic range2200. Projected Y khớp authored reading fraction/dive center; sai số normalized tối đa **3.3306690738754696e−16**. Scalar right/down basis đúng hướng và responsive FOV.
- Experience1=departure0 và departure1=Works0 tại hai aspect, gồm reduced endpoint tương ứng. Observer ngoài r1 ở các pose đã lấy mẫu. Đây là numerical check với layout synthetic, không chứng minh pixel anchor thực.
- Head tại journey1±epsilon liên tục; hai nhánh đầu sao có đạo hàm tiến về0 ở boundary. Không thấy teleport hay capture phụ thuộc hướng cuộn trong hàm.

## Điểm tangent bản trung gian — đã giải quyết

Số đo khoảng 95.24° đã ghi trước đây thuộc bản trừ `clamp(journey) * range` khi giữ một frame departure. Nó **không còn mô tả source hiện tại**. Source cuối dùng q cho scroll của sample; nhánh DOM tiến tới Y=0.5 với derivative về 0, nhánh dive bắt đầu bằng smoothstep cũng derivative về 0. C0 tại q=1 giữ nguyên và C1 có cùng zero tangent. Đã đọc lại utility và kiểm tra root's `check-motion.mjs`/`check-motion-results.json`: boundary/head, forward/reverse bằng đúng buffer, endpoint camera và projection đều pass trên 5 viewport (40,227 assertions; 2,005 forward/reverse pairs). Đây là numerical check synthetic; Browser vẫn sở hữu bằng chứng curve qua DOM thật.

Head shader hiện có uniform map riêng. Source cuối ghi `uOpacity`/`uPixelRatio` cho cả trail và head; lifecycle runtime dưới đây xác nhận head opacity/DPR cùng trail và vị trí head bằng sample đầu.

Browser còn cần xác nhận với DOM thật: curve qua ba nhãn ở Vi/En, stage visibility/scroll-out, stop/reverse buffers, resize/lifecycle, ambient còn xuất hiện trong vùng yên, và Works thực sự nhìn được trước khi UI cũ R5.2 vào khung. Old Works UI được giữ đúng phạm vi, không lấy lỗi thiết kế chờ R5.2 thành lỗi runtime của meteor. Build/lint/console, ảnh và số đo của root là bằng chứng DoD cuối.

## App StrictMode lifecycle

Chạy `node outputs/redesign/r5.1/verify-lifecycle.mjs` trên Edge headless, viewport 1440×900, dev origin :5173; tái dùng fixture R4.2 với App thật trong StrictMode. Fixture initial mount chỉ để nạp module, sau đó unmount và kiểm ba vòng mount/unmount được đếm riêng. Script quan sát actual listener Set của các Zustand stores đã nạp, gồm subscription React và imperative; không sửa application/fixture.

Kết quả chi tiết: `lifecycle-results.json`, status pass. Mỗi vòng capture hai geometry/hai material Meteor và bảy geometry/bảy material Works (ba cặp points/lines + finale trail). Tất cả unique resources đã emit dispose khi unmount; 1 Canvas, 12 frame subscribers, 22 ScrollTriggers giữ cùng số lượng ở ba vòng. Canvas/frame subscribers/ScrollTriggers về 0, ScrollSmoother không còn, GL memory về geometry0/texture0 sau mỗi unmount. Meteor finite, head khớp trail, cả hai shader opacity/DPR=1. Departure0.6 mở Meteor và Works với ba strength=0.39358600583090386. Không console error; chỉ warning THREE.Clock đã có.

Store count phân biệt ownership: trước mount đã có **1 listener useLangStore**, do `src/i18n/config.js:19` đồng bộ store→i18n suốt đời module; cleanup nằm ở HMR dispose:46. Khi mount, actual listener Sets là Lang3/Loading2/Scroll9/Education5/Skills4/Audio4; khi unmount về Lang1 và năm store còn lại0, đúng baseline, ở cả ba vòng. Toàn bộ **App-owned store subscription delta=0** sau unmount; không gọi literal tổng store=0 để che listener module này. Kiểm này không đo FPS hay chất lượng cảm nhận chuyển cảnh.
