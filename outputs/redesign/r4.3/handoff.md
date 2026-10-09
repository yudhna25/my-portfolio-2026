# R4.3 → R5.1

08/10/2026. Education production dùng nguyên pool R4.1, không tạo renderer/Canvas/camera mới. Bàn giao cho Experience, chưa triển khai R5.1.

## DOM / geometry / anchors

`src/components/Education.jsx` giữ `#education`, wrapper `[data-story-chapter="education"]` trong App, H2 `education-heading`, ba H3 chứa native school button. Section desktop cao1,75viewport; ul là ba nhánh cùng tồn tại, không ol/timeline tuần tự.

| ID | Mapping | Geometry R0.2 | Desktop branch |
|---|---|---|---|
| saigonUniversity | SGU / CNTT /2021–2026 → Circinus |3 main+11 context,2 edges|col1/span5,row1|
| greenAcademy | Green / dựng phim /2022–2023 → Telescopium |2 main+6 context,1 edge|col8/span5,row1,+18vh|
| arenaMultimedia | Arena /2024–nay → Pictor |3 main+12 context,2 edges|col3/span5,row2|

Source giữ `src/3d/data/symbolTargets.json` exact subset `outputs/redesign/r0.2/constellation-data.json`; north+Y/west+X/gnomonic/ICRS J1991.25, một scale hai trục, không mirror/stretch/rotate hình. Context không thêm link. Tel chỉ HIP90568→90422; không thêm telescope minh họa để làm hình đông hơn. Circinus liên quan compa vẽ kỹ thuật. Cách liên hệ trường là diễn giải thiết kế, không định nghĩa thiên văn; IAU không quy định stick figure duy nhất. Nguồn/attribution chi tiết `source-audit.md` và data R0.2.

App giữ stable ref map `educationStages`, truyền `stageRefs` vào Education và `educationAnchors` vào bridge hiện có `SkillsSymbols`. Mỗi window có `data-education-stage="ID"`, button `data-education-item="ID"`, vùng đầy đủ `data-education-region="ID"`. Anchor đọc vị trí DOM thật qua `useSectionAnchor`; locale/resize/refresh đo lại. Mobile một cột, các window rộng92/88/84% lệch nhẹ; labels đọc full width. Desktop window cao31vh, không card/border quanh mốc.

## State / input / renderer

`src/stores/useEducationStore.js`: `interact('hover'|'focus'|'selection', id|null)`, `clear()`, `setVisible(boolean)`. `activeEducation` ưu tiên focus→selection→hover. `anchorId` theo target có ưu tiên cao nhất, giữ anchor cuối khi clear để points tan tại đúng vùng cũ. Không persist. Mapping nhỏ `src/data/education.js`; không thay data.js hoặc nội dung ngành/trường/niên khóa Vi/En đã duyệt.

Hover/focus chọn một chòm; touch/pen tap toggle; background tap/click hoặc Escape clear. Escape giữ native focus; Enter/Space chọn lại. Pointer hover không được kéo anchor khỏi school đang keyboard focus. IntersectionObserver sở hữu stage visibility; offstage clear pointer/touch, giữ keyboard ownership qua reflow tạm; offchapter clear mọi kênh. Reduced chọn/clear là static endpoint tức thì, DOM đầy đủ.

Bridge `SkillsSymbols` vẫn **một SymbolStars instance/pool192**, chọn consumer Skills/Education và ref tương ứng. Control Education có thể nhận focus khi viewport đang chứa cả cuối Skills/đầu Education trước khi chapter top đổi; visible input được quyền dùng renderer trong trường hợp đó. Skills native focus có ưu tiên khi cả hai vùng còn nhìn thấy. Camera không chạy theo selection, vẫn CameraRig/shared story pose. Primitive/source/pool/StarField/HDR/quality giữ hash.

Formation0–0,45s trước links0,55–1s, vmag dẫn kích thước sao chủ đạo3–4,5px, context dịu. Leave trả exact base; swap từ current positions; offstage/offsection reset ngay và dừng upload. R4.3 không thêm sao nền, sticker, logo hoặc composer.

## Camera / progress

EDUCATION endpoint mới `[2,5,-110,-64,-42,-200]`: pullback, BH nền góc phải trên. ABOUT và SKILLS endpoint R4.2 giữ nguyên. Target thực lấy `storyCameraPath(...aspect)` và CameraRig FOV responsive; không hardcode projection pixel thành world pose. Tâm BH endpoint khoảng desktop1440×900 `(1221,63;165,40)` /mobile390×844 `(333,80;282,67)`. Observer radius90,1615, ngoài chân trời.

Skills→Education vẫn liên tục; **Experience p=0 dùng EDUCATION mới này**. R5.1 bắt đầu từ pose mới, không restore EDUCATION cũ `[2,5,-156,-10,0,-200]` hoặc pose thử R4.3 trước pullback. Nếu chỉnh đường camera để theo meteor, sửa contract chung và verify endpoint, không section writer.

R4.3 sửa thêm `useScrollProgress.measure`: nếu ranges top/end của chapter đang đọc đổi do responsive content phía trước, giữ chapter/progress và seek ranges mới trước publish. Locale/GSAP media hold cũ giữ nguyên; manual vẫn seek theo contract. Không rewrite Smoother hay thêm producer. Việc này tránh transient Skills khi Education reflow và mất selection đang focus. Khi R5.1 thay height Experience, giữ cách đo ranges DOM này.

## Evidence / limits

`verification.md`, `browser-verification.json`:111 snapshots,20 configs320/390/768/1440/1920 ×Vi/En×normal/reduced; source/chart→pool→projected star/links, native rapid/Tab/touch/scrollout/reverse. Three StrictMode lifecycles dispose3geometry/11material/9texture mỗi lượt, unmount0Canvas/subscriber/trigger/Smoother; fallback giữ schools và focus. Productionpreview8configs/24interactions; Hero/About/Skills/Education regression16records. Geometry float32 error≤2,874e−8, link/pose error0, anchor≤0,000198px. `integrity-results.json` bảo toàn baseline96:7 sửa/89 hash nguyên/2 file mới; renderer assets/data/anchor không đổi, HEAD/index và AGENTS prefix nguyên.

Browser Chrome thiếu executable; Edge154 fallback thật. Mobile/touch/OS reduced/hidden là emulation, chưa test điện thoại hoặc OS/screen reader vật lý. THREE.Clock/chunk>500KB/SplashCursor lint warnings kế thừa; forced context loss là test chủ động. Không dùng trace lỗi trước fix làm trạng thái bản cuối.
