# V0 — Quyền sửa file và lịch tích hợp

09/10/2026. Đây là contract giao việc, **chưa triển khai V1–V11**. Mọi path được tính từ gốc dự án. Baseline HEAD `5296621304fa2192efd0e05bbd5c47679e7d4614`; đọc working tree mới trước mỗi task, không reset về HEAD hoặc baseline này.

## Hai nhóm được chạy song song

| Nhóm | Điều kiện | Các nhánh | Người tích hợp |
|---|---|---|---|
| A | V0 hoàn tất | V1 / V2 / V4 | V3 tích hợp V1+V2; V4 được tiếp tục độc lập |
| B | G1 được duyệt; V5/V7 có V4 | V5 / V6 / V7 | V8; V6 không phụ thuộc V4 |

Không chạy V3 khi V1/V2 còn ghi source. Không chạy V8 khi V5/V6/V7 còn ghi source. V9, V10, V11 tuần tự và giữ các gate G2/G3 trong `prompts.md`. Không tự dispatch các task tiếp theo.

## File dành riêng cho worker

| Owner | Được sửa | Giới hạn |
|---|---|---|
| V1 | `src/components/Hero.jsx`; `src/components/effects/PortalHeading.jsx`; CSS riêng Hero dưới `src/styles/` nếu cần | Typography, year contour, decode/glitch, O slot. Không shader/camera/store/global CSS. Giữ API Lab tương thích. |
| V2 | `src/3d/components/BlackHole.jsx`; `BlackHoleSystem.jsx`; `BlackHoleBloomMask.jsx` trong cùng thư mục; `src/3d/shaders/blackHole.js`; `src/3d/quality.js` | Ray/copy/mask/disk/target. Trong quality chỉ thay ray settings cần thiết; giữ `QUALITY` star counts. Không tự sửa CameraRig/App/phase helpers. |
| V4 | Asset và metadata mới trong `public/constellations/`; tài liệu/dữ liệu/check trong `outputs/visual-revision-2026-10-09/v4/` | Sáu vector, license, manifest, HIP/anchors. Không sửa runtime JSON đang dùng hoặc UI. |
| V5 | `src/components/Education.jsx`; `src/data/education.js`; `src/3d/components/SkillsSymbols.jsx`; `src/3d/components/SymbolStars.jsx`; `src/3d/utils/symbolMorph.js`; `src/3d/data/symbolTargets.json` | Chỉ Education trong renderer/data shared. Giữ pool192, bảy tools, chín logo, Skills input/formation/return. Không sửa asset V4. |
| V6 | `src/components/sections/Experience.jsx`; `src/3d/components/StoryMeteor.jsx`; `src/3d/utils/storyMeteor.js`; shader riêng meteor dưới `src/3d/` nếu cần | Head/tail/wake và milestone emphasis. Giữ curve/departure; không sửa ambient ShootingStars hoặc global composer. |
| V7 | `src/components/Work.jsx`; `src/3d/components/WorksConstellations.jsx`; `src/3d/utils/worksOrbit.js`; artwork metadata trong `src/3d/data/worksConstellations.json` | Scale/figure hit region/preview/orbit presentation. Geometry HIP/edges/projection giữ nguyên. Không sửa route/store/asset V4. |

Các tên file ngắn trong bảng thuộc đúng thư mục ghi tại đầu ô. Worker có thư mục output riêng `outputs/visual-revision-2026-10-09/vX/`, không ghi output của worker khác.

## File chung — chỉ Agent tích hợp ghi

- `src/App.jsx`: stable refs, scene children, root visibility/inert, DOM chapter markers, restore/focus.
- `src/3d/GalaxyScene.jsx`: persistent Canvas, backdrop visibility, quality/DPR, fallback và scene scheduling.
- `src/3d/components/CameraRig.jsx`, `src/3d/utils/cameraPath.js`: camera pose/FOV/chapters; không section nào ghi camera riêng.
- `src/3d/hooks/useScrollProgress.js`, `src/3d/hooks/useLabScroll.js`: progress producer/manual seek, remeasure/restore.
- `src/3d/hooks/useSectionAnchor.js`: anchor reader chung, không tự đổi trong worker.
- `src/stores/useScrollStore.js`, `useRouteStore.js`, `useEducationStore.js`, `useSkillsStore.js` trong `src/stores/`: sửa schema/API chỉ qua integrator. Worker vẫn gọi setter có sẵn cho interaction của mình.
- `src/3d/utils/portal.js`, `src/3d/utils/finale.js`: contract pha do V3/V9 tích hợp; V2/V7 bàn giao đề xuất, không sửa song song.
- `src/3d-lab.jsx`, locale trong `src/i18n/`, `src/index.css`, `src/styles/globals.css`, GSAP/scroll/reduced hooks chung.
- Nav/Menu/Cursor/SoundToggle khi cần đưa control vào portal: chỉ V3 tích hợp; giữ behavior reader/menu/audio.
- `AGENTS.md`: integrator append tuần tự, không ghi đồng thời hoặc sửa dòng cũ.

V3/V8 có thể chỉnh điểm nối trong worker files sau khi worker bàn giao. V9 chỉ sửa file liên quan finale/Contact và regression cần thiết; không redesign các section đã duyệt. V10 chỉ sửa regression đợt visual. V11 source read-only.

## Quyền trên property khác quyền trên file

| Property | Writer runtime hiện tại | Owner sửa implementation |
|---|---|---|
| `storyChapter/chapterProgress/scrollProgress/currentSection` | `useScrollProgress` → `setStoryPosition`; restore/manual seek theo cùng contract | Integrator |
| `storyAnchor` | Producer đo final-O DOM rect | Integrator; V1 giữ đúng DOM anchor |
| Camera position/lookAt/FOV | CameraRig, story callback priority −1 | Integrator; V2 chỉ đề xuất pose/rebase |
| Hero text/contour/glitch | PortalHeading/GSAP hiện có | V1; V3 nối pull/eject, không hai writer trên cùng transform |
| HDR target/ray uniforms/copy-mask | BlackHoleSystem/BlackHole; uniforms dùng chung | V2; V3/V9 nối phase sau bàn giao |
| Education hover/focus/selection | Education gọi API Education store có sẵn | V5; schema store do integrator |
| Shared Symbol pool/geometry/material | SymbolStars; consumer do SkillsSymbols chọn | V5 chỉ thêm Education behavior, bảo toàn Skills |
| Meteor layout | Experience đo DOM và truyền mutable layout qua callback/ref | V6; ref/mount tại App do integrator |
| Meteor buffers/head/wake | StoryMeteor đọc curve/progress | V6 |
| Works hover/focus/selection | Work gọi `setWorksInteraction` / `clearWorksInteraction` | V7; schema store do integrator |
| `worksOrbit.phase/velocity` | WorksConstellations gọi `advanceWorksOrbit` | V7 |
| `worksOrbit.origin/latched/captures` | Producer gọi `syncWorksOrbit` trước publish state | V7 helper, integrator nối store; giữ capture/reverse contract |
| History snapshot/prepare/restore | useRouteStore + App + producer | Integrator; V7 giữ canonical IDs và focus target |

## Bàn giao patch file chung

Worker ghi vào `handoff.md`: interface thực tế, file gọi, field mới nếu có, mặc định tương thích, patch đề xuất chưa áp dụng, self-check và bằng chứng. Không tạo store/producer/renderer song song để tránh quyền file.

Integrate tuần tự: đọc diff → nối contract nhỏ nhất → build/lint và kiểm hành vi phụ thuộc → ghi trạng thái. Giữ output evidence của worker nhưng tạo evidence mới cho bản tích hợp tại gate. Dòng tiến độ worker chờ append phải được đánh dấu, không append hai lần.

Không thay package/lockfile/config, không dọn `outputs/redesign/r0.2/logos/mono/`: hiện SymbolStars import trực tiếp các asset này cho production. Mọi file ngoài danh sách owner phải được bàn giao cho integrator, không tự sửa.
