# V0 — Contract hiện tại và các điểm nối tối thiểu

09/10/2026. **Hiện tại** là source đã hash trong `baseline.json`. **Đề xuất** là giao diện cần thực hiện ở các task sau, chưa có trong ứng dụng. Mọi đường dẫn từ gốc repo. Brief trong `prompts.md` ưu tiên hơn tài liệu R0–R8 và palette/glow cũ của skill.

## 1. Progress và camera — giữ một đường điều khiển

**Hiện tại:** App mount `useScrollProgress({ scope, story:true, locale, ready, initialPosition:restore, historyManaged:true })`. Hook đo `[data-story-chapter]` tương đối với `#smooth-content`, lấy visible scroll từ ScrollSmoother hoặc native scroll. Range chapter kết thúc tại marker kế tiếp; không dùng phần trăm toàn trang. `hero` production là marker cao0; portal bắt đầu ở y=0. Lab có chapter Hero cao một viewport, nên pixel y giữa Lab/App khác nhau dù scene dùng cùng chapter/p.

Store API:

```js
setStoryPosition(chapter, progress, scrollProgress, manual = true)
setStoryManual(boolean)
setStoryAnchor({ left, top, width, height, fixed } | null)
setWorksInteraction('Selection' | 'Focus' | 'Hover', id | null)
clearWorksInteraction()
```

Các field `storyChapter`, `chapterProgress`, `storyManual`, `scrollProgress`, `currentSection`, `storyAnchor` giữ tên. Alias Nav: works→work, contact→transmission, portal→hero, departure→experience. `controls.current` của hook có `seek(id,p,manual)`, `hold()`, `resume()`; manual phải pause producer trước khi seek, synchronize DOM/Smoother, không chỉ đổi store rồi để scroll ghi đè.

Remeasure giữ chapter/p qua locale/resize/GSAP media. `initialPosition` được dùng một lần theo history entry key. Route root đã sở hữu popstate/hashchange, nên production dùng `historyManaged:true`; Lab delegate cùng hook, không mount producer thứ hai.

**Camera:** `storyCameraPath(chapter,p,out,frozen,aspect)` tại `src/3d/utils/cameraPath.js`, consumer `CameraRig` priority −1. Story mode set pose trực tiếp, không damping theo delta. FOV portrait tính `2*atan(tan(π/6)/min(1,aspect))`; không timeline camera trong section. BH center `[0,0,-200]`, đơn vị scene là Schwarzschild radius; observer hiện luôn ngoài chân trời.

| Pose hiện tại | position | target trước aspect bias |
|---|---|---|
| Hero | `[0,2.2,-168]` | `[0,0,-200]` |
| Close portal | `[1,1.4,-192]` | `[0,-0.2,-200]` |
| About | `[2,5,-154]` | `[-36,-16,-200]` |
| Skills | `[2,5,-145]` | `[-50,-35,-200]` |
| Education / Experience | `[2,5,-110]` | `[-64,-42,-200]` |
| Works | `[0,4,-160]` | `[140,0,-210]` |
| Contact | `[2,4,-160]` | `[-22,-5,-200]` |

Luôn gọi helper để lấy pose thực: lookX có frame bias; portrait Contact còn blend lookX về0 và lookY thêm−23. Finale đến Contact pose tại p=.44 và giữ. V3 sửa riêng portal trajectory, V9 sửa finale framing; không restore pose cũ từ handoff R3.2 đã bị R3.3/R4 thay.

## 2. Hero/final O — giao diện V1 ↔ V2 ↔ V3

**Hiện tại:** `Hero` gọi `PortalHeading({label,name,year,visible,glitch,children})`. Lab gọi cùng component, không bật production glitch. `label` semantic PORTFOLIO; glyph cuối có `[data-story-anchor="portal"]`, các glyph có `[data-portal-char]`. Producer publish rect viewport `{left,top,width,height,fixed:true}` vì heading nằm ngoài smoother. Fonts/resize/locale/refresh đo lại; không trừ visible scroll khỏi rect fixed.

PortalHeading hiện giữ glyph O trắng và đặt mini BH trong counter; 2026 là chữ solid trắng/25%, đặt lệch phải, không phải outline mới. Glitch hiện 7 khoảng0.1s sau delay1.5s/repeatDelay1.4s; chỉ cuối năm. Header `pointer-events-none`; V1 phải mở tương tác đúng vùng tên nếu thêm decode hover/focus, không làm anchor chuyển vị trí ngoài ý muốn.

**Đề xuất tối thiểu:**

- V1 giữ `label/name/year/visible/glitch/children` tương thích. Nếu cần role riêng, thêm prop tùy chọn `role` với mặc định không render; Hero reuse `hero.tagline` hiện là Creative Designer, giữ `hero.subTagline` làm intro. Không bắt Lab phải đổi ngay hoặc tạo locale trùng copy.
- Giữ một DOM slot O cuối có kích thước cap-height thật, accessible H1 vẫn PORTFOLIO. Không `display:none`, scale0 hoặc bỏ rect slot khi bỏ glyph trắng. Slot có thể trong suốt, không render chữ O thường chồng lên BH.
- V1 bàn giao cấu trúc layer year/heading/name-role/intro và node transform dành cho V3; V2 chỉ đọc rect qua state hiện có, không query glyph theo index mới.
- Hero intro/dash/glitch do V1 sở hữu. Story intake transforms do V3 sở hữu trên wrapper riêng; không hai timeline ghi cùng transform/opacity của cùng node. V1 pause/reset wall-clock glitch khi p>0, hidden, reduced.
- V2 triển khai diagonal disk≈55° và fit ring bằng cap-height rect, thay cách fit mini counter hiện tại. Mapping phải giống trong ray/copy/mask; mesh fullscreen rotate không xoay disk ray frame.

## 3. HDR, độ nét và phase helper — V2 bàn giao V3/V9

**Hiện tại:** `BlackHoleSystem` có một HalfFloat HDR target, linear filtering, không depth/stencil. Target ratio=`min(dpr*resolution,maxResolution/max(cssWidth,cssHeight))`. Star counts24k/12k/1.5k; ray high192 steps/.85/max1280, medium160/.8/max1024, low128/.75/max768. Ở baseline1440×900 DPR1, high target tính ra1224×765; mobile390×844 low tính ra293×633. Đây là công thức source, không phải phép đọc live FBO.

`BlackHole` ray full-screen dùng `uObserver/uCameraMatrix/uInverseProjection/uTime/uDiskIntensity`, render target một lần rồi phục hồi GL target/autoClear/XR/clearAlpha. `accretion-disk` là copy mesh fullscreen NDC. Copy uniforms và mask cùng tham chiếu portal object; `onUpdate` giữ identity. Medium/high có một SelectiveBloom intensity.15/.3 rồi BlackHoleBloomMask; low không composer. Mask restore absorbed rays, không cắt vòng tròn làm mất foreground disk.

`PORTAL_IMAGE_GLSL` hiện remap UV bằng `uRayCenter+(uv-uPortalCenter)/uPortalScale`, aperture theo `uPortalRadius`. Mini fit hiện `.105/shadow`, radius `.255w/.19h`, tăng tới600×; target resolution lớn hơn đơn thuần chưa chắc giải quyết magnification từ remap này. V2 phải kiểm cả ray view/ROI/projection lẫn buffer, không chỉ đổi maxResolution.

**Owner:** V2 sở hữu render target/ray/mapping/quality; integrator sở hữu phase semantics/anchor/trajectory. Uniform hiện có giữ tương thích; uniform mới cho disk frame hoặc projection chỉ thêm khi cần và phải nêu default cho non-story/finale. Không thêm renderer/composer/camera writer. V2 bàn giao observer tối thiểu an toàn, rebase/mapping trong dark core và bằng chứng close-up, không chạy camera xuyên singularity.

**Portal hiện tại:**

```js
portalProgress(chapter,p,frozen) // hero→0, portal→p hoặc1 nếu frozen, chapter khác→1
portalState(p,out) // pull, mini, visibility, growth, textOpacity, dust
```

Mini→large composite đổi tại.52; mini fade.43–.48, large reveal.60–.74; text fade.28–.43. Camera Hero→Close0–.45, giữ Close.45–.60, Close→About.60–1. `PortalBackdrop` chỉ hiện StarField/Nebula từ.52. V3 sẽ thay mốc và intake/ejection theo brief mới, không để các consumer dùng mốc cũ riêng.

**Đề xuất:** giữ helper và các field hiện có nếu còn caller; mở rộng nhỏ trong `portalState(p,out)` bằng `eject`, `aboutOpacity`, `aboutInteractive` nếu cần. Đây là đề xuất, không phải API đã có. Mọi giá trị được suy từ cùng p, không thêm store progress hoặc timer. Intake0–.44 / core.44–.50 / eject.50–.94 / settle.94–1; mọi consumer lấy cùng contract, continuity tại ranh pha. Ray observer giữ ngoài chân trời, cinematic mapping/rebase che trong core; không tuyên bố chính xác vật lý NASA.

## 4. About reveal, đo layout và focus — patch bắt buộc ở V3

**Bằng chứng hiện tại:** `src/App.jsx:89` dùng `portalProgress(...)===1`; toàn `[data-story-content]` opacity0/visibility:hidden/inert/aria-hidden đến endpoint. Frame portal p=.75 có root reading hidden/inert, top≈394px; p=1 visible/non-inert, top0. About source decode `.play()` chỉ khi `storyChapter==='about'`, không dùng p portal. Chỉ bỏ parent opacity gate sẽ chưa tạo ejection: About vẫn nằm sau portal trong flow, ngoài viewport giữa đoạn.

**Patch tối thiểu integrator phải giải quyết:**

1. Giữ một About DOM thật, `#about`, `[data-story-chapter="about"]` và footprint trong flow. Không clone vào Hero/Canvas, không thay range bằng vị trí transform.
2. Mở parent reading visibility đủ sớm cho pha eject, đồng thời gate nhóm About và phần còn lại bằng state suy từ p. Có thể tách wrapper About với rest reading, nhưng giữ chapter marker/nội dung/height. Không để parent inert/aria-hidden phủ About đã được phép tương tác.
3. Đặt transform ejection ở inner visual wrapper/nhóm heading/avatar/bio, không ở chapter marker hoặc root Nav target `#about`. Bù vị trí flow bằng range/visible scroll đã cache: viewport destination trừ vị trí flow đang hiển thị. Marker/range vẫn đo tĩnh và root target không dịch.
4. Đo lại sau fonts/locale/resize/refresh bằng cơ chế hiện có; không `getBoundingClientRect()` mỗi frame. Transform phải về identity lúc p=1 để About bình thường và Nav/hash/route đúng.
5. Mở About interaction khi nhóm đã hiện và tới vị trí đọc được trong pha eject; trước đó không Tab vào avatar/control vô hình. Các section khác không bị Tab vào trạng thái bị che bởi portal. Direct #about/reduced/fallback mở ngay endpoint hợp lệ.
6. Rebind hoặc vô hiệu hóa y/opacity/reveal wall-clock hiện tại khi nó tranh property với ejection. Decode/GSAP cleanup giữ text semantic; stop/reverse story không bị `.play()` cũ chạy tới trạng thái khác. Không đổi bio/avatar/layout ngoài wrapper phục vụ motion.
7. Nav/Sound/Menu ngoài Portfolio ở App (`src/App.jsx:187–188`), không tự bị hút khi Hero transform. V3 cần wrapper portal riêng cho control, giữ auto-hide Nav ở node khác; một writer/property. Skip-link và đường keyboard truy cập nội dung vẫn usable. Menu dialog đang mở giữ focus/scroll lock; không để portal giành focus hoặc làm chìm modal đang dùng.
8. Cursor/lens không đổi hit geometry; state khi swallowed phải tránh pointer/focus vào control mất khỏi mắt. Audio vẫn opt-in, không thêm sound hoặc recreate AudioContext.

V3 đổi production marker portal175vh→400vh, `STORY_CHAPTERS.portal.height`1.75→4 và Lab height class tương ứng. Finale vẫn225vh cho đến V9. Reduced/fallback rút ngắn cả đoạn liên quan, không khoảng cuộn trống. Lab/App dùng chung helpers; Lab không chứng minh About production focus/layout.

## 5. Education và artwork — V4 ↔ V5

**Hiện tại:** `Education` nhận `stageRefs` map stable từ App; IDs `saigonUniversity/greenAcademy/arenaMultimedia`. DOM windows `[data-education-stage]`, controls `[data-education-item]`. `useEducationStore` có hover/focus/selection/visible/anchorId; effective target **focus→selection→hover**, giữ anchor cuối khi clear. API `interact(channel,id)`, `clear()`, `setVisible(boolean)`. Không persist selection.

`SkillsSymbols` chọn consumer dựa chapter/visible/input, Skills focus có ưu tiên khi hai section cùng nhìn thấy. Một `SymbolStars({anchor,target,active,frozen})`, pool192; anchor hook billboard camera và fit80% cạnh nhỏ window. Geometry education gnomonic north+Y/west+X, ICRS J1991.25, links chỉ main HIP, context không thêm cạnh. Mapping cũ Circinus/Telescopium/Pictor; chưa có artwork Education.

**V4 bàn giao:** public sáu vector thật, source/license/hash, viewBox/source→vector transform, ít nhất ba pixel↔HIP anchors, projection/epoch, stars/main/context/calibration/edges. Reserved manifest tại `public/constellations/manifest.json` nếu dùng; dữ liệu đề xuất runtime ở v4 output. Không đổi canonical school/project IDs. Scorpius HIP82729 thiếu cạnh chỉ là calibration star, không tự nối.

**V5 áp dụng:** mapping Orion/Scorpius/Leo trong education data/target JSON, giữ `logos/poolCount` và Skills behavior. Artwork/glow cần scope Education; không tăng global uFormation/uLogo/alpha làm Skills đổi. Có thể thêm prop tùy chọn hoặc metadata `artwork` chỉ cho Education, default null cho Skills/Lab cũ. Chọn cách đặt art đúng basis và phía sau stars; idle art8–12%, active25–35%. Hiện pool chỉ có một target active, nên không tạo ba SymbolStars pool để có idle artwork của ba trường; dùng lớp artwork riêng nếu cần, cùng Canvas và anchor refs đã có.

Attribution/locale và App/Lab wiring do V8. Không đặt bitmap trong SVG hoặc dùng AI tái tạo dữ liệu sao. V4 không cần sửa runtime, V5 không cần sửa asset namespace V4.

## 6. Experience curve — V6 ↔ V8

**Hiện tại:** `Experience({onLayout})` đo một `createMeteorLayout()` với `{width,height,range,points:Float64Array(10),milestones:Float64Array(3)}`. Callback stable của App lưu cùng mutable object vào `meteorLayout.current`; StoryMeteor đọc `layout.current`. Measurement do ResizeObserver/resize/ScrollTrigger refresh, không React state/frame.

Journey q0–1 Experience, q1–2 departure. Ba mốc đo24px trên label; readingY=p*range+(0.22+0.28*smooth(p))*height. 128 samples, tail history theo authored q−i*0.24, không lịch sử frame. Departure110vh/reduced20vh; depth24→96, fade meteor departure.70–1, Works arrival.30–1. Camera và các đoạn nối lấy cùng `storyCameraPath`; V6 giữ logic curve/departure.

Head hiện5px×DPR, line tail trắng mảnh, không wake. V6 thay presentation thành white core/cyan halo/tapered ribbon và local wake. `meteorEmphasis`/mốc copy vẫn có thể reuse; nếu cần thêm strength wake, suy từ q/curve, không store hoặc timer mới. Quyền DOM milestone styles ở Experience, buffers/shader ở StoryMeteor. Giữ `onLayout` và existing mount để V6 chạy độc lập; API mới phải default tương thích rồi V8 nối.

Không sửa `ShootingStars.jsx` / `shootingStars.js`. Ambient scheduler hiện nhường Hero/portal/Experience/departure/finale; tiếp tục lịch đó. Không tăng global bloom để làm meteor sáng.

## 7. Works, figure projection và route snapshot — V7 ↔ V8 ↔ V9

**Hiện tại:** ba IDs `edura/veris/vie`; Centaurus/Gemini/Cygnus. Works stage160vh, Work inner frame shift bằng cached sectionHeight*p; có ba selector ở header, preview cố định dưới. Selection→Focus→Hover, finale dùng `worksFinaleSelection` chụp khi rời Works. `work-target-edura`, `work-case-edura`, `work-preview`, `data-work-background` là điểm tích hợp cần giữ.

Works basis tính từ WORKS pose/aspect, distance24, radiusX=.28*width; radiusY=.17*height portrait/.13 desktop; scale=min(.15*width,.13*height), offsetY=.04*height. Một WorksConstellations instance trong App/Lab. Geometry/star catalog/projection giữ nguyên; V7 thay scale/layout/active strength/art.

`worksOrbit` giữ identity: `{phase,origin,velocity,latched,visited,captures,resumePending}`. Idle writer `advanceWorksOrbit`0.075rad/s, damping6/s, delta cap.05. Producer `syncWorksOrbit`: finale p>0 hoặc Contact latch origin một lần; reverse giữ origin; về Works release ở phase=origin, skip idle frame đầu. Một lượt mới sau khi trở về Works có thể capture lại; không reset khi chỉ scrub tới/lùi trong finale.

**Điểm nối tối thiểu đề xuất cho hover thật:** nếu cần bridge, thêm một stable mutable ref `worksLayout` tại App, truyền cho Work và WorksConstellations theo mẫu meteor. Renderer sở hữu projected figure bounds/hull/centers theo actual group pose/basis/viewport; DOM Work chỉ đọc để đặt semantic hit region và preview. Reuse buffer cho ba IDs, không React state/frame, không world coordinates hardcode vào HTML hoặc store mới. Tên prop cuối do V7 ghi trong handoff; V8 apply App/Lab patch. Đây chưa là API có sẵn.

V7 giữ gate hover figure↔preview180ms và cleanup pending close khi focus/pin/Escape/unmount. Pin vẫn ưu tiên hơn hover. Stable focus IDs trên figure button thay selector cũ; không tạo ID trùng. Artwork anchors cùng basis của stars, không vận hành bằng CSS rotation riêng.

**Route hiện tại:** native `/projects/edura`; snapshot main lưu `{y,width,height,chapter,p,scrollProgress,selection,orbit,pose:[x,y,z,lookX,lookY,lookZ],focus}` trong `history.state.stellar`. Reader unmount Portfolio/Canvas/Smoother, giữ Nav/Menu/Sound. Prepare khôi phục store/orbit trước mount, producer seek sau measure, App chờ ready/fonts/Canvas rồi focus preventScroll; input mới hủy restore muộn. Direct reader Return→`/#work`, Back dùng entry snapshot.

V7 không đổi route schema hoặc IDs. V8 kiểm Back/Forward/focus/orbit/scroll sau stage/preview mới. V9 capture presentation/basis cùng origin; geometry, artwork và stars phải cùng collision center. Không thêm snapshot controller khác. `pose` lưu là evidence, CameraRig vẫn suy pose từ chapter/p/aspect; không restore camera bằng writer thứ hai.

## 8. Finale/Contact — phần giữ cho V9

`finaleState(p,out)` hiện mốc.12/.34/.44/.70/.96, analytic travel/radius/figure/stars/trails/cloud/collapse/hole/flare/contact. `finaleFigure` dùng captured origin, Works basis và BH center, không physics tích lũy. Gas hiện fbm hai lớp screen-space trong copy shader; chưa phải volumetric thật. StarField/Nebula time freeze khi finale/Contact; ambient meteors nhường finale.

Contact root `#transmission` không transform. `[data-contact-content]` alpha=finaleState.contact (.88–1) và translate bù finaleHeight; chỉ non-inert khi chapter Contact. Opaque panel/terminal/copy/actions hiện giữ nguyên. V9 thay chiều dài marker225→400vh, Lab/STORY_CHAPTERS height tương ứng, spectacle/camera framing và panel transparency. Không gỡ terminal, rewrite Footer hoặc xử lý clipboard trong V0.

V2 đảm bảo API/pipeline BH dùng tiếp V9. Khi V9 đổi shared shader/path, regression portal/About G1 là bắt buộc; finale riêng không được làm O/BH close-up mềm trở lại.

## 9. Cách kiểm reverse và tiêu chí contract

- Dùng producer/controller hiện có để seek cả DOM và store rồi hold; khi kiểm native thì resume producer. Không có hai nguồn ghi cùng lúc. So camera và các giá trị tạo hình đang có tác dụng ở cùng chapter/p; anchor và gate phải đúng.
- Baseline có10 cặp portal/finale p0/.25/.5/.75/1: camera/active uniforms khớp; Works transforms finale khớp; reading visibility/inert/aria/opacity khớp. Smoother DOM rect có sai khác tối đa.25px, không claim full screenshot exact.
- Tại finale p=0, `uFinaleOrigin` raw có thể khác trước/sau latch; gas/trails đóng, figure transforms vẫn giống. Không kết luận bug visual từ scalar chưa có tác dụng; preserve snapshot và so lại lúc phase mở.
- V3 cần thêm.44/.47/.50/.70/.94 và sát boundary; V9 thêm.12/.34/.44/.70/.96. Hold/rapid reverse/jump/resize/locale/reduced/route ở task tương ứng, không dùng bộ baseline V0 như nghiệm thu visual mới.
- Portal mới: About phải bắt đầu hiện trong eject, root không inert khi nhóm đã đọc/tương tác được; p=1 transform identity. Finale mới: Contact đọc được, ring giữ50–60% chiều cao màn hình. Các gate G1/G2/G3 là visual review của người dùng, không có xác nhận ngầm.
