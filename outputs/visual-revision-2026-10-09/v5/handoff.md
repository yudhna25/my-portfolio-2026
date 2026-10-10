# V5 → V8 — Education / Orion, Scorpius, Leo

09/10/2026. **V5 implementation và kiểm local hoàn tất; chờ V8 tích hợp locale/credit và gate G2.** G1 được người dùng xác nhận trong yêu cầu V5 hiện tại; handoff V3 cũ vẫn ghi pending. Không mở lại thiết kế Skills hoặc thực thi V6/V7.

## Sáu file thuộc ownership

- `src/components/Education.jsx`: giữ layout/copy/năm học, thêm semantic SVG figure controls từ hull thực; focus/touch/hover và school controls dùng cùng input handlers. No-WebGL hiện SVG tĩnh đúng plane, thông tin vẫn đọc được.
- `src/data/education.js`: SGU→Orion, Green→Scorpius, Arena→Leo; canonical IDs không đổi.
- `src/3d/data/symbolTargets.json`: lấy nguyên geometry/projection/calibration/artwork V4; thêm `artwork.hitHull` chỉ là geometry tương tác, không phải dữ liệu thiên văn. Skills/logo/pool metadata giữ nguyên.
- `src/3d/utils/symbolMorph.js`: target Education thêm artwork/radius từ hợp bounds; pool192, formation/return/AI/Tools giữ nguyên thuật toán.
- `src/3d/components/SymbolStars.jsx`: glow điểm/cạnh chỉ khi target có artwork Education; một quad buffer cho halo cạnh, không composer mới. Export `EducationArtwork` đặt plane V4 trong cùng billboard basis, opacity .10/.30. Bù perspective theo observer ray để localZ=-.01 không kéo lệch ba anchor.
- `src/3d/components/SkillsSymbols.jsx`: vẫn một SymbolStars pool; ba EducationArtwork idle đọc stable refs hiện có, không ba pool hoặc consumer/store riêng.

Không sửa App/camera/producer/stores/Lab/locales/GSAP hooks/config/package/assets V4/AGENTS. Các source V6/V7 đang ghi song song được phân biệt trong `data-results.json`, không hoàn tác hoặc nhận là thay đổi V5.

## Contract đang chạy

`Education({stageRefs})` và `SkillsSymbols({anchor, educationAnchors})` giữ API cũ. **Production đã nối bằng stable refs hiện có của App; không cần patch App/store mới.** Một active ID, ưu tiên focus→selection→hover theo store cũ; leave chỉ clear đúng owner của channel. Escape/background/clear về base; touch tap active bỏ chọn; rapid switch bắt đầu từ current pool positions.

`SymbolStars` thêm optional `educationId=null` để giữ radius của anchor cuối khi target clear. Default cho Skills/Lab cũ tương thích. `EducationArtwork({id,anchor,active=false,enabled=true,frozen=false})` dùng target metadata; load URL qua BASE_URL, depthWrite=false, cùng quaternion/scale với sao. Plane correction đọc camera, không ghi camera. `data-education-art-status="loaded|failed"` nằm trên stage DOM để kiểm asset; asset lỗi không mất sao hoặc control trường.

Figure polygon trong SVG viewBox±1.25×radius dùng convex hull của vertex contour SVG đã hiệu chuẩn + main stars, y đổi dấu duy nhất để sang SVG y-down. `useSectionAnchor` fit40% cạnh nhỏ/radius; cùng scalar nên hit hull theo đúng screen projection, không rectangle phủ cả stage. Focus được viền trắng trên hull. Reduced giữ target/star/line/art tĩnh; hidden dùng frameloop never có sẵn; offscreen art không tiến opacity.

## Patch locale / attribution cho V8 — chưa áp dụng

Merge vào `education` của Vi/En, không thay copy trường hoặc niên khóa:

```json
{
  "constellationNames": { "Orion": "Orion", "Scorpius": "Scorpius", "Leo": "Leo" },
  "figureLabel": "Khám phá {{constellation}} — {{school}}",
  "artworkCreditLabel": "Nguồn và giấy phép hình chòm sao"
}
```

En: `figureLabel = "Explore {{constellation}} — {{school}}"`, `artworkCreditLabel = "Constellation sources and licenses"`. Runtime hiện gọi i18n keys mới với defaultValue là tên riêng đã xác minh và tên trường hiện có; không hiển thị nhãn Circinus/Telescopium/Pictor cũ. V8 đồng bộ/loại các key `education.constellations.*` cũ nếu không còn caller, audit locale parity, và nối credit có thể đọc/click từ `public/constellations/ATTRIBUTION.md` + manifest: Johan Meuris / Stellarium, Free Art License1.3 cho artwork, CC BY-SA4.0 cho line pattern và HIP/ESA1997/CDS citation. Không suy license artwork thành commercial grant cho catalog; gap này đã có trong handoff V4, cần giải quyết trước phát hành thương mại.

Lab chưa được sửa theo ownership. V8 có thể dùng export EducationArtwork với `educationAnchor`/selected canonical school ID hiện có để preview một hình ở stage Lab; cập nhật nhãn chòm trong locale Lab. Không mount ba hình chung một anchor. Worker V5 chỉ nghiệm thu production Education, không claim Lab artwork đã nối.

## Verify / tái chạy

`verification.md`, `data-results.json`, `browser-results.json`, `extras-results.json`, `screenshots/` là evidence local. Có 78 trạng thái input, 108 projected anchor checks (ba HIP × ba trường × ba viewport × hai locale × hai chiều): 96 node Float32 đang render và 12 calibration ray HIP82729, không thêm node đó vào Scorpius. Có 7 Skills exact-runtime regressions, 3 lifecycle dispose cycles. Build/scoped lint pass; forced no-WebGL và asset failure giữ controls/content. Hidden được mô phỏng, không OS thật/điện thoại thật.

```text
node outputs/visual-revision-2026-10-09/v5/check-data.mjs
node outputs/visual-revision-2026-10-09/v5/check-browser.mjs
node outputs/visual-revision-2026-10-09/v5/check-extras.mjs
npx eslint src/components/Education.jsx src/data/education.js src/3d/components/SkillsSymbols.jsx src/3d/components/SymbolStars.jsx src/3d/utils/symbolMorph.js
npm run build
```

Browser scripts dùng Playwright sẵn có, Edge, dev URL mặc định5185; đặt `STELLAR_PLAYWRIGHT_MODULE` nếu runtime ở ngoài repo và `STELLAR_QA_URL` nếu đổi cổng. Không thêm npm dependency. `baseline-browser.mjs` đã chạy trước thay đổi, **không chạy lại để ghi đè Skills baseline**. `prepare-targets.mjs` chỉ phục vụ tái tạo target/hull V5, không sửa V4.

## Dòng AGENTS chờ V8 append tuần tự

Worker không ghi file chung khi V6/V7 đang chạy. Append đúng một lần sau khi nhận handoff:

```text
| 09/10/2026 | V5 — Education Orion / Scorpius / Leo | Codex | ✅ Local xong; locale/credit/G2 chờ V8 | Sáu file ownership: V4 HIP/edges/artwork+calibrated hit hull, .10idle/.30active, education-only point/link glow, one pool192, direct figure/school focus-touch-hover/clear/fallback. Build/scoped lint pass; 78 input states/108 projected anchors/7 Skills exact-runtime + math regression/3dispose cycles7geometry15material12texture/0unexpected console-GL errors RTX4060DPR1. Camera/App/producer/store/Lab/locale/assets/AGENTS giữ; source V6/V7 song song ghi riêng. outputs/visual-revision-2026-10-09/v5/verification.md + handoff.md; hidden/touch/reduced mô phỏng, chưa phone/OS/HTTPS/G2. |
```

V8 nhận patch/contract và kiểm bản tích hợp/G2. Không tự chạy task tiếp, commit, push hoặc deploy.
