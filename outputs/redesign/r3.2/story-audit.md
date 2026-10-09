# R3.2 — Audit tuyến truyện và điều hướng

08/10/2026. Audit read-only trước tích hợp; không sửa source, AGENTS hoặc thực hiện Browser. Trạng thái đọc trực tiếp: R3.1 đã xong, App còn scene/producer `story=false`. Báo cáo này là khuyến nghị triển khai, không phải bằng chứng motion đã pass.

## Luồng dùng lại

| Phần thật | API / hành vi hiện có | R3.2 dùng lại |
|---|---|---|
| `src/App.jsx` | Một `useSmoothScroll`, một `useScrollProgress`, một lazy GalaxyScene; loading effect hiện luôn `scrollTo(0,0)` | Bật story cho producer và scene cùng nhau, truyền locale để đo lại; không mount thêm useLabScroll trong App. Bảo toàn điểm đến hash/native restore khi preloader kết thúc. |
| `src/3d/hooks/useScrollProgress.js` | Đọc visible Smoother position; đo `[data-story-chapter]`; manual seek/hold/resume; ResizeObserver/font/refresh cleanup | Thêm marker trên DOM thật và khoảng portal 1.75 viewport. Giữ một producer, không lấy phần trăm tổng trang để suy chapter. |
| `src/stores/useScrollStore.js` | `setStoryPosition(chapter,p,rawProgress,manual)`; storyAnchor CSS px; orbit handoff imperative | Giữ progress/anchor chung. Phân biệt chapter ID với DOM section ID cho navigation. |
| `CameraRig` / `cameraPath.js` | Scene camera writer duy nhất priority -1; story pose trực tiếp, zero pointer parallax; reduced dùng endpoint | Không cần camera writer/timeline mới. Portal cuối và About có cùng observer `[2,3,-169]`, target trước aspect bias `[-12,0,-200]`. |
| `PortalHeading` / `portal.js` | Semantic fixed heading, O cuối, fade/bend qua cùng chapter/p; portal render xác định | Tái dùng component/motion contract; thay typography/metadata thật và thêm glitch cục bộ. Không giữ Hero-exit timeline cũ chồng lên portal. |
| `BlackHole` / `BlackHoleSystem` | Một HDR ray render, shared copy/mask uniforms, p0 mini O; blackout đổi mini/full ở p=.52 | Không chỉnh RK4, scale mesh hoặc tạo FBO/Canvas thứ hai. |
| `GalaxyScene.PortalBackdrop` | Story chỉ hiện StarField/Nebula khi effective portal p>=.52 | Dùng nguyên visibility; không để ambient meteor nằm ngoài gate và lộ trước portal. |

## Marker và ID thực

| DOM ID / đích Nav | Chapter trong contract | Ghi chú |
|---|---|---|
| `hero` | `hero` | H1/metadata fixed nằm ngoài smooth-content; marker trong flow giữ scroll range. |
| Marker portal riêng | `portal` | 1.75 viewport trước About; không phải khoảng trống để kéo tổng trang. |
| `about` | `about` | Điểm nghỉ và endpoint portal. |
| `skills` | `skills` | Nội dung hiện tại giữ cho R4; chỉ marker/pose integration ở R3.2. |
| `education` | `education` | Không redesign Education ở R3.2. |
| `experience` | `experience` | Camera foundation có quỹ đạo cuối tới Works; meteor dẫn chuyện là R5.1. |
| `work` | `works` | Nav/Menu/data/navigation hiện dùng **work**, không phải works. |
| `transmission` | `contact` | Contact thực, khác Footer có ID **contact**. |
| Footer `contact` | Không chương mới | Giữ pose Contact qua Footer; không để hash #contact bị hiểu như section transmission một cách ngầm. |

`setStoryPosition` hiện gán `currentSection=chapter`. Bật story nguyên trạng sẽ khiến Nav mất active state ở Works và Contact. Producer nên giữ cả `element.id` và chapter khi đo DOM, hoặc map rõ `works -> work`, `contact -> transmission` trước công bố currentSection. Không đổi tất cả ID production chỉ để khớp tên lab. Marker portal có thể dùng currentSection=hero để Nav không nhận chapter giả như một link mới.

## Direct jump / hash / loading

1. **Hiện chưa có hash bridge.** Hook chỉ đọc query `chapter/p` một lần và `seek` đặt manual=true; App không nên dùng query lab để điều hướng production. Các href Nav/Menu hiện preventDefault và không cập nhật URL/history.
2. **Loading effect đè đích.** App `if (loading) window.scrollTo(0,0)` là điểm phải xử lý, không chỉ thêm hash listener. Sau load/font/layout đo xong, resolve hash thật theo DOM ID và sync visible Smoother/native scroll; publish đúng chapter ngay, không bắt người xem đi qua Hero/portal.
3. **Offset gây chọn chương trước.** Nav và Menu hiện trừ nav height+8. Story range bắt đầu ở section top nên About offset sẽ vẫn là portal gần p1, Works offset là Experience, Contact offset là Works. Các section hiện có padding-top ít nhất 96px nên trong story có thể jump target top không trừ offset mà heading vẫn dưới Nav. Legacy/lab đang hoạt động giữ API tương ứng. Browser phải chứng minh exact target chapter, không chỉ ảnh nhìn gần đúng.
4. **Không giữ manual sau jump.** `seek` là API scrub/hold lab; nếu dùng cho production jump phải resume producer đúng lúc, tránh storyManual=true khiến cuộn thật không cập nhật scene. `resume` hiện có phần reinitialize Smoother scrub cần giữ.
5. **Back/hashchange.** Nếu Nav/Menu cập nhật history bằng pushState thì xử lý popstate; nếu native hash thay đổi thì xử lý hashchange. Không tạo router/framework mới. Chỉ một nơi trong scroll bridge đồng bộ điểm đến, cleanup listener đầy đủ. Kiểm reload #about/#work/#transmission, hash đổi khi đang ở portal, Browser Back và fonts/locale/resize sau jump.
6. **Remeasure manual.** Hook hiện giữ chapter/p và sync range mới khi manual. Scroll mode remeasure đọc đúng visibleY; không tự ép về Hero khi locale/reduced đổi.

## Collision và phạm vi scene

- `Contact` vẫn ghi contactProgress qua timeline `contact-approach`, reset 0 ở mount/cleanup. Với `story=true`, **CameraRig return trước nhánh contactProgress**, và BlackHole `uDiskIntensity` dùng story/finale branch. Vì vậy tuyến mới không chồng legacy -2z/+0.45 intensity nếu producer và scene cùng bật story. Chặn/loại writer legacy ở Contact có thể giữ nguyên DOM reveal/content/action; không cần sửa ray shader hoặc camera path để vá triệu chứng.
- `GalaxyScene` đang dùng `ambientFrozen = frozen || story`. Bật story sẽ tắt toàn bộ ShootingStars mãi mãi. Cần phân biệt freeze lab phục vụ đối chiếu với production ambient scheduling. Sao băng nền chạy ở khoảng đọc sau portal, nghỉ Hero/portal, Experience dẫn chuyện và finale; giữ pool/event API/màu trắng/reduced/hidden. Nếu trạng thái đang có trail, rút/fade nhẹ tại boundary thay vì thêm phát dày.
- `story=true` hiện tự mount WorksConstellations mới trong GalaxyScene. Không vô tình dựng Works production trước R5.2. Có thể dùng **children API đang có**, đặt WorksConstellations vào GalaxyScene children ở lab cùng LabTelemetry; App chỉ mount khi R5.2 đã có controls/preview thật. Đây là lựa chọn tối thiểu tránh flag thử nghiệm mới, không sao chép engine.
- Không thêm khoảng finale production trong R3.2. Các pha explosion đã chứng minh ở lab thuộc R7.1. Contact direct pose dùng endpoint của contract; không tạo cinematic Works->Contact khi task chưa được giao.
- Shared story ending ở contact hiện lấy finale p1 và diskIntensity1.35, không dùng contactProgress cũ. Ghi rõ đây là endpoint reuse, không tuyên bố finale production đã hoàn tất.

## Anchor / lens / semantic

- O cuối chính xác là index8, chữ thứ9 trong PORTFOLIO. `data-story-anchor="portal"` trên glyph cuối, fixed header ngoài smooth-content; store fixed=true. Không translate/scale riêng O hoặc parent heading khi intro vì hook chỉ đo ở resize/font/refresh, không mỗi frame.
- Shared PortalHeading chỉ bend L/I (`chars.slice(-3,-1)`), O vẫn đứng yên. Label/whole accessible heading bằng DOM; year accessible luôn2026. Glitch visual số cuối aria-hidden, ba glyph202 không đổi. Không dùng SplitText autoSplit quanh anchor nếu nó tạo wrapper/transform thay glyph bounds.
- Cursor lens selector hiện là `[data-project-image], .avatar-img, main h1, main h2, [data-project-card] h3`; fallback Hero tìm `#hero-heading` chỉ khi pointer target là smooth-content. Heading fixed mới cần selector/eligible rect cho chính heading thật dù nằm ngoài main; không làm cả viewport thành lens target.
- Lens phải hide khi portal kéo/nuốt chữ, kể cả người xem ngừng di chuột sau khi scroll. Guard state/subscription và cleanup phải làm việc này; chỉ kiểm trong pointermove sẽ để lens đứng lại trên frame cinematic.
- Giữ VIEW/magnetic/keyboard hit targets. Anchor lấy layout glyph rect; SVG backdrop lens chỉ biến dạng pixel nên không nên thay anchor/hitbox.
- About chỉ mở nội dung khi camera đã gần điểm nghỉ theo shared portal progress. Đừng cho DOM About nhảy qua blackout chỉ vì top section vừa vào viewport. R3.3 vẫn sở hữu portrait/bio/tools redesign; R3.2 chỉ handoff visibility/pose.

Các khuyến nghị trên lấy từ source hiện hành và contract đã bàn giao; root agent sở hữu mọi source/AGENTS. Audit này không chạy build/Browser và không xác nhận DoD đã hoàn tất.

## Review source sau tích hợp R3.2 (trước Browser)

Đã đọc lại 11 source diff so với `outputs/redesign/r3.2/before/`: App, useScrollProgress, PortalHeading, Hero, GalaxyScene, ShootingStars, useScrollStore, Cursor, Nav, MenuOverlay và 3d-lab. Đây vẫn là review read-only; root sẽ xác nhận/sửa và Browser sẽ chứng minh hành vi.

### Đã xử lý đúng từ source

- App dùng cùng scene/producer `story=true`, ready theo loading; bỏ scrollTo0 trong loading effect, truyền locale; một Canvas/CameraRig như trước.
- Hero marker có độ cao0, portal bắt đầu0 và kết thúc sau175vh; update p0 map về hero, nên frame idle không chạy camera/portal và scroll bắt đầu trực tiếp chuyển cảnh. About và phần đọc gated khi portal effective p=1; reduced mở endpoint không zoom.
- Store map works/contact/portal về work/transmission/hero cho Nav. Hook đo domId ở section con và hashseek nhận đúng ID thật. Fixed O thêm ResizeObserver; không có transform O/parent intro.
- Nav/Menu bỏ nav offset khi có marker story và jump tức thì; Nav hủy manual trước direct jump. Lab giữ WorksConstellations qua children API của GalaxyScene; App không mount Works model/finale spacer.
- Glitch chỉ DOM digit cuối, aria-hidden; source timeline delay1.5s, flash100ms, repeatDelay1.4s tương ứng cadence1.5s. Reduced không tạo flash; visibility/story subscribe dừng và restore6, cleanup bỏ subscribe/listener; Browser còn phải đo thật.
- Cursor chọn #hero-heading và có story subscription hideLens khi pointer đứng yên; VIEW/magnetic/lens-map dữ liệu giữ nguyên. Ray shader/cameraPath/CameraRig không sửa.
- Production ambient có freezeAmbient=false, lab mặc định freezeAmbient=story; meteor trắng được giữ và blocked ở hero/portal/experience/finale. contactProgress cũ không tham gia CameraRig/HDR story branch.

### Findings gửi root trước verify

| Mức | Vị trí | Hành vi cần xem/sửa |
|---|---|---|
| P2 | App reading subscription | Mọi store update gọi gsap.set(autoAlpha) và ghi inert/aria-hidden dù settled không đổi. Trong scroll/legacy Contact timeline việc này lặp mỗi frame. Cache boolean settled; chỉ đổi DOM khi visibility thực sự đổi. |
| P2 | ShootingStars useFrame gate | Gate hiện hide ngay và giữ nguyên tuổi hạt; vệt active mất đột ngột, rồi hiện lại giữa vệt sau Experience hoặc reverse. Quy ước yêu cầu trail rút/fade ở boundary. Ngừng lịch phát khi blocked, rút/fade vệt có sẵn rồi clear; không đóng băng hình active để mang qua chương sau. |
| P2 | Nav/Menu + hash bridge | Nav/Menu preventDefault nhưng không ghi URL/hash/history. Tải #about rồi chọn Works sẽ vẫn có URL#about và reload về About; Back không có section entry mới. Hook chỉ nghe hashchange; nếu dùng pushState cần popstate. Dùng history/hash native tối thiểu, không router. |

Các findings này đã gửi root để quyết định/fix; không coi chúng đã được sửa trước khi đọc lại hoặc Browser xác nhận. Không có camera writer/engine mới, không thấy source làm sai O cuối hoặc cadence định nghĩa.

### Đối chiếu lần tiếp theo / pure check

Đã đọc lại source sau sửa: App cache settled; reset glitch dùng quickSetter; meteor có visibility theo chapter progress và clear tuổi khi alpha0, `emitting=false` giữ countdown nhưng vẫn tiến tuổi trail; Nav/Menu ghi hash qua pushState, hook có popstate và cleanup. Mini aperture/scale điều chỉnh tại BlackHole shared, shader/HDR pipeline/camera nguyên baseline; lab và App vẫn dùng một implementation.

Đã tạo và chạy `node outputs/redesign/r3.2/check-contract.mjs`: **PASS, 791 assertions**, observer gần nhất **r=8.182909018191513**, **181 main locale keys** parity. Check kiểm clamp/zero range, endpoint/reduced, reverse tại cùng progress, reuse identity, finite/ngoài chân trời, meteor không phát/countdown khi blocked nhưng active age tiếp tục, 1 CameraRig/1 Canvas/1 explicit HDR target và hash CameraRig/cameraPath/ray shader/System/Mask bằng baseline mới của task. Đây là pure/source check, không thay Browser cadence/visual/resize/lifecycle.

Lưu ý thêm đã gửi root: query `chapter/p` trong shared hook vẫn mặc định seek manual=true tại App; production không có Resume UI, nên URL `/?chapter=portal&p=.5` có thể giữ story khi người xem cuộn. Giới hạn query scrub cho lab để loại nhánh thử nghiệm ở production. Menu story direct jump nên reset storyManual=false như Nav nếu trạng thái manual tồn tại. Không có AGENTS/source edit từ agent audit.

### Root cause focus reduced-motion và audit cuối

Debug native Menu keyboard tại fresh reduced-motion cho thấy đọc inline `opacity:1; visibility:visible`, inert=false nhưng computed opacity0/visibilityhidden ở lần focus đầu; About chỉ focus được sau frame sau. Nguyên nhân nằm ở **rule reduced toàn cục `* { transition-duration:0.01ms!important }`**, không phải Zustand chưa công bố visibility. Reading không khai báo transition-property nên giá trị mặc định **all**; rule này vô tình bật transition opacity/visibility trên mọi element. Khi style được đổi, computed style còn trạng thái đầu tại recalculation dù inline đã là trạng thái cuối.

Đối chiếu read-only bằng Edge headless với cùng DOM visibility gate chứng minh:

| Reduced transition-duration | Inline sau mở | Computed ngay sau mở | Focus tức thì |
|---|---|---|---|
| `0.01ms` | opacity1 / visible | opacity0 / hidden, transition-property=all | Thất bại |
| `0s` | opacity1 / visible | opacity1 / visible, transition-property=all | Thành công |

Root đã đổi riêng global reduced transition-duration thành **0s!important**, giữ animation-duration0.01ms. Không dùng rAF retry để che lỗi; root debug App dev đã xác nhận focus About ở rAF đầu. Browser production/final matrix do root thực hiện và lưu trong verification riêng.

Đọc lại source cuối xác nhận query chapter/p chỉ áp dụng pathname `/3d-lab.html`, Menu reset storyManual=false, popstate listener cleanup đầy đủ. Các findings đã nêu ở bảng review trên đều được xử lý tại source; không còn blocker từ audit này.

Checker chạy lại **PASS791**. Đối chiếu SHA256 trực tiếp với before baseline xác nhận **About**, CameraRig, cameraPath, ray shader, HDR System/Mask, package.json/package-lock.json, main.jsx và vite.config.js nguyên hash. R3.3 chưa thực hiện; không đổi avatar/bio/tools About. Một camera writer/Canvas/HDR target và shared PortalHeading/BlackHole vẫn đúng ownership. Agent audit chỉ tạo/sửa tài liệu và checker trong outputs; không source/AGENTS append.
