# R2.1 — Contract progress / pose cho lab

Phạm vi: foundation trong `src/3d-lab.jsx` hiện có; **chưa dựng portal, orbit, finale hoặc redesign production**. App giữ `story=false`. R2.2 bật story bằng `http://127.0.0.1:5173/3d-lab.html?story=1`.

## Progress và producer

- Store thật: `src/stores/useScrollStore.js`. `scrollProgress` vẫn là visible scroll / max scroll (0…1), giữ nghĩa cho `useSectionAnchor`. Không dùng giá trị này để chia chapter theo phần trăm tổng trang.
- Story dùng `storyChapter`, `chapterProgress` (0…1), `storyManual`, `storyAnchor`; ghi một lần qua `setStoryPosition(id, p, rawProgress, manual)`. UI React chỉ subscribe chapter/manual; progress số được đọc bằng `getState()`.
- App mount `useScrollProgress({scope})`. Lab mount **chỉ** `useLabScroll({scope, story, locale})`, delegate về cùng `useScrollProgress`; không mount hook thứ hai. `useSmoothScroll` được tái dùng nguyên file/API.
- Scroll mode: ticker đọc `ScrollSmoother.get()?.scrollTop() ?? window.scrollY` sau GSAP update. Đây là vị trí **đang nhìn thấy**, gồm lúc smoother chưa đuổi kịp native scroll.
- Ranges lấy từ `[data-story-chapter]` dưới `#smooth-content`. Start = rect.top − content.rect.top; end = start chương kế, chương Contact end = max scroll. Progress cục bộ = clamp((visibleY − start)/(end − start)). Tại boundary, scroll chọn chương kế với p=0; manual có thể giữ chương trước p=1. Camera ở hai trạng thái này giống nhau.
- Đo lại qua ResizeObserver(content), resize/load, ScrollTrigger refresh, locale dependency, fonts.ready/loadingdone. Các listener/ticker/observer được cleanup; promise fonts có active guard.
- Hook trả ref controls: `controls.current.seek(id,p)`, `.hold()`, `.resume()`. Seek kiểm ID có trong DOM, clamp finite p, bật manual **trước** khi sync visible/native scroll. Trong manual ticker không ghi progress. Wheel khi giữ có thể đổi DOM nhưng không đổi pose; Resume đưa DOM về pose đã giữ rồi bật lại producer cuộn. Resize/locale trong manual giữ chapter/p và sync lại range mới.
- URL deep link: `?story=1&chapter=contact&p=.75`; ID không tồn tại bị bỏ qua, p không finite về 0. Deep link được áp dụng một lần sau đo DOM, kể cả StrictMode. Không cần đi qua Works.

## Pose / ownership

`src/3d/utils/cameraPath.js` xuất `STORY_CHAPTERS`, `storyCameraPath(chapter,p,out,frozen,aspect)`, `segmentProgress`, `clampStoryProgress`. Cấp out một lần rồi tái dùng. `CameraRig` là writer duy nhất của scene camera, priority −1. Không section timeline, OrbitControls hay writer khác. Camera fullscreen nội bộ HDR là camera render target riêng, không ghi scene camera.

Story pose suy trực tiếp từ cùng chapter/p; không damping x/y/z theo delta. Pointer parallax = 0 trong toàn story lab. Production tiếp tục dùng `cameraPath` cũ và nhánh damping cũ. FOV giữ công thức adaptive hiện có; lookX có cùng frame bias theo aspect.

| Mốc | Observer x,y,z | Target x,y,z trước frame bias | Range / pose đọc |
|---|---|---|---|
| Hero | 0,2.2,-168 | 0,0,-200 | 1 viewport, đứng yên |
| Portal close | 1,1.4,-192 | 0,-0.2,-200 | 1.75 viewport: 0…45% tiến; 45…60% giữ; 60…100% ejection về About |
| About / Contact | 2,3,-169 | -12,0,-200 | Đứng yên, vùng đọc trái |
| Skills | -2,5,-164 | -13,0,-200 | Đổi từ About trong 25% đầu, rồi giữ |
| Education | 2,5,-156 | -10,0,-200 | 1.75 viewport; đổi từ Skills trong 25% đầu, rồi giữ |
| Experience intermediate | 12,4,-164 | 18,0,-200 | 0…60% từ Education; 60…100% quay về Works |
| Works | 0,4,-160 | 140,0,-210 | Đứng yên; tâm/vành BH ngoài mép trái ở các viewport kiểm |
| Finale | Works → Contact | Works → Contact | 2.25 viewport; chỉ path nền tảng, chưa có năm pha hiệu ứng |

Mỗi đoạn nội suy smoothstep p²(3−2p). Các boundary liền nhau khớp position/target. Hố đen ray tracing hiện cố định `[0,0,-200]`; không dùng literal camera z=-420 trong sketch R1 vì cần hiệu chỉnh theo scene thật. Observer gần nhất r≈8.183, luôn ngoài chân trời r=1. Đây là pose nền tảng có thể tinh chỉnh chung ở R2.2–R2.4 sau khi chứng minh renderer, không phải chứng nhận hiệu ứng storyboard đã chạy.

Reduced-motion: `storyCameraPath(..., frozen=true)` dùng endpoint p=1 của **chapter đang chọn**; Hero vẫn pose Hero, portal/finale kết thúc tại About/Contact. Các effect sau phải dùng cùng quy tắc effective p = frozen ? 1 : chapterProgress, giữ thông tin/CTA, không chạy zoom. Pose direct jump chỉ phụ thuộc chapter/p/aspect/reduced, không phụ thuộc hành trình trước đó.

## Anchor / selection / phase

- Anchor thật: `<span data-story-anchor="portal">O</span>` thứ ba/cuối trong PORTFOLIO lab Hero. `storyAnchor = {left, top, width, height}` đo bằng CSS px; left theo viewport, top theo content chưa trừ visibleY. Screen center = (left+width/2, top+height/2−visibleY). R2.2 đọc cache/store hoặc hook anchor hiện có; shader không query/import section DOM. Đây là glyph lab, chưa phải Hero production redesign.
- `STORY_SEED = 20261007`, `STORY_IDLE_PHASE = 0` là mặc định cho deep link chưa qua Works. Ambient cũ được freeze khi story=true để kiểm pose; không auto advance story theo delta. Scene App mặc định không freeze thêm.
- R2.1 **chưa có selection hoặc idle orbit**. Selection default none; task R2.3 sẽ sở hữu selection/phase handoff và snapshot pha một lần cho finale. Không thêm field/controller suy đoán ở đây. Không dùng Math.random/clock để suy pose portal/finale.
- R2.2 cần dựng visibility/bụi/lens/minihole từ cùng portal progress; Hero lab hiện vẫn render scene cũ để thử pose. R2.4 cần dùng cùng tâm collision→BH và các pha R1 (nén 8–12%) nhưng R2.1 chưa dựng/đổi các pha đó.

## Điều khiển / bàn giao

Chọn chương hoặc 0/25/50/75/100% sẽ seek và giữ; slider hỗ trợ tua tới/lùi; Resume quay lại scroll mode; Hold giữ tiến độ hiện tại. Vi/En, quality/bloom và toggle legacy nằm trong details controls phụ. Native select/range/buttons hỗ trợ keyboard; controls mới ≥44px. `LabTelemetry` chỉ đọc camera/store và cập nhật output diagnostic, không ghi camera hoặc React state mỗi frame.

R2.2 tái dùng `GalaxyScene story`, `CameraRig story`, store/bridge/path trên; không copy scene hoặc thêm producer/writer. Contract và screenshot ở đây kiểm foundation; R1.1 vẫn là nguồn bố cục/nhịp thị giác đã chốt.
