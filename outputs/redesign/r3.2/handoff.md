# R3.2 → R3.3

**Hero/portal production đã tích hợp và kiểm chứng.** R3.3 tiếp tục About trong wrapper hiện có; không dựng scene, progress producer hay portal riêng.

## Path / state dùng thật

- App: `src/App.jsx`. Canvas persistent ngoài `#smooth-wrapper`; `Hero` fixed cũng ngoài `#smooth-content`. App gọi `useScrollProgress({scope: root, story: true, locale, ready: !loading})` và `GalaxyScene story freezeAmbient={false}`.
- Semantic typography + glitch: `src/components/Hero.jsx` → `src/components/effects/PortalHeading.jsx`, lab dùng cùng component. i18n `hero.portfolio`, `hero.year`, name/role/tagline keys cũ. Đừng thêm một SplitText/transform writer khác trên glyph O hoặc raster hóa heading.
- Anchor: `[data-story-anchor="portal"]` tại span thứ9 (O thứ3/cuối). Store `storyAnchor = {left, top, width, height, fixed: true}` là rect viewport của heading fixed; không trừ visible scroll nữa. Hook đo lại khi resize/locale/fonts/refresh; lens là filter tại con trỏ, không đổi rect.
- Progress store: `src/stores/useScrollStore.js` vẫn `storyChapter`, `chapterProgress`, `storyManual`, `setStoryPosition`, `setStoryManual`. `currentSection` alias works→work, contact→transmission, portal→hero để Nav/section cũ nhận đúng ID. `scrollProgress` vẫn visibleY/maxScroll phục vụ code anchor legacy.
- Producer: `src/3d/hooks/useScrollProgress.js`; lab delegate qua `useLabScroll`. Manual seek/hold/resume còn cho lab; App query chapter/p không kích hoạt manual. Hash DOM và Nav/Menu jump đi thẳng mốc, không xem lại intro.
- Camera writer duy nhất: `src/3d/components/CameraRig.jsx`, priority−1, `storyCameraPath(chapter,p,out,reduced,aspect)` từ `src/3d/utils/cameraPath.js`. Không timeline camera trong section. Hero→portal→About dùng pose từ R2; About base observer `[2,3,-169]`, target/FOV có bias portrait theo hàm chung. Luôn dùng hàm để nhận pose chính xác.
- Portal: `src/3d/utils/portal.js` xuất `portalProgress`/`portalState`; shader/HDR/copy-mask/bloom R2.2 chung trong `BlackHole`/`BlackHoleSystem`/`BlackHoleBloomMask`. Fit mini chung .105/shadow, radius .255w/.19h. Không thêm FBO/ray shader/Canvas cho O.

## DOM và trạng thái đọc

App có `<section id="hero">` chứa marker hero cao0 và marker portal cao175vh. Portal start0/end=start About, phạm vi1,75viewport thật. Dưới `[data-story-content]` có chapter wrappers about/skills/education/experience/works/contact; giữ wrapper About và `#about` để đo range/deep link đúng.

`portalState`: text fade .28→.43; mini fade .43→.48; đổi composite ở p=.52 trong khoảng tối; large BH reveal .60→.74; p=1 settle About. Main reading content opacity/visibility + inert/aria-hidden do App sở hữu, chỉ đọc khi `portalProgress(...)===1`. R3.3 không thêm parent gate hoặc scroll gap cạnh tranh. Cuộn ngược main lại inert và Hero trở lại đúng p.

`PortalBackdrop` trong GalaxyScene ẩn StarField/Nebula trước p=.52; frame đầu chỉ mini BH/dust local. App ambient không freeze; lab story mặc định freezeAmbient để đối chiếu. Ray gas time story vẫn theo contract chung, không tích lũy thời gian để suy pose. Meteor không phát ở Hero/portal/Experience/finale; About fade vào10% đầu, Education fade ra10% cuối; rời vùng clears pool để không phục hồi vệt cũ. Q23 sao băng ngẫu nhiên vẫn còn sau portal.

Glitch chỉ số6→7 khoảng100ms/1,5s, paused/reset khi rời Hero/hidden/portal; accessible2026. Reduced không glitch, portal/finale dùng endpoint tương ứng; Hero idle vẫn Hero. Global reduced CSS transition-duration0s tránh inherited visibility trễ làm hỏng native focus.

## Giới hạn bàn giao

About hiện còn panel/halo/bio/tool cũ; R3.3 mới thay bằng asset cutout và copy đã chốt. Asset/data R0.2/R0.3 chưa sửa. Các section phía sau, reticle Work/terminal Contact và route case study vẫn nguyên scope riêng.

`contactProgress` producer cũ vẫn ở Contact; story camera/intensity đã bỏ ảnh hưởng của nó. Không xóa caller đó tùy ý trước R7.2. Direct Contact hiện dùng pose story Contact; không claim finale production đã tích hợp.

WorksConstellations R2.3 chỉ mount lab qua render-prop children, App chưa mount chúng. Finale contract/composite R2.4 vẫn dùng chung; production không có marker finale trong R3.2. R5/R7 sẽ tích hợp sau, không tự tạo scheduler/controller hay chạy task đó ở phiên này.

Evidence: `verification.md`, `baseline.json`/`integrity-results.json`, `browser-results.json` (64records), `preview-results.json`, `frames-manifest.json`, 48 PNG thật. Reverse pose/uniform chính xác ở cùng p; screenshot toàn DOM còn ambient/entrance khác, đã ghi giới hạn. Browser plugin unavailable; kiểm bằng Edge154 thật trên RTX4060, mobile/reduced emulation.
