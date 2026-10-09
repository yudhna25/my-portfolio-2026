# R7.1 — Finale production / kiểm chứng

09/10/2026. **✅ Hoàn tất R7.1 trên local dev và compiled preview; bàn giao R7.2.** Chỉ tích hợp finale R2.4 vào production, không viết engine/shader/Canvas mới. Contact vẫn giữ nội dung/panel terminal cũ để R7.2 thay; không coi toàn bộ redesign Contact đã xong.

## Thay đổi và ownership

- App thêm finale **2,25 viewport** riêng sau Works 160vh; reduced-motion thu đoạn chuyển cảnh về 0. Không nổ trong khoảng đọc/chọn dự án.
- Giữ nguyên `finale.js`, orbit R2.3, curve/trails, HDR ray/copy/mask và quality tiers R2.4. Nhịp: rút nhãn 0–.12 → co/tăng tốc .12–.34 → nén **10%** .34–.44 → lóe/tinh vân .44–.70 → khí về tâm/hố đen .70–1. Collision và BH cùng world center `[0,0,-200]`.
- DOM Work pin tiếp vào finale, rút bằng `finaleState.label`. `worksFinaleSelection` chụp Selection → Focus → Hover khi rời Works; DOM/renderer cùng dùng snapshot. Hover mất ở boundary không làm preview/độ sáng bật về trạng thái khác. Không controller orbit mới.
- Contact visibility/inner translate đọc `finaleState.contact` (.88–1), root `#transmission` đứng yên cho Nav/hash. Nội dung inert trong finale và mở khi Contact settle. Bỏ pulse CSS cũ để không tự nhấp nháy trong đoạn kết.
- Gỡ đủ **4 caller contactProgress**: Contact timeline, store, legacy CameraRig offset, BlackHole intensity. Không còn `contact-approach`/veil timeline chồng story.
- StarField approach story đọc progress trực tiếp; StarField/Nebula elapsed time dừng trong finale/Contact. ShootingStars vẫn ở chương yên và nhường finale; hidden/reduced giữ cơ chế cũ.
- CameraRig vẫn writer duy nhất. Shared cameraPath thêm **Contact endpoint riêng**, vì pose About R3.3 đẩy BH sát mép: camera `[2,4,-160]`, aim desktop `[-22×frameBias,-5,-200]`; portrait blend về aim `[0,-28,-200]`. Blend cùng ease/progress finale, đến endpoint tại .44 rồi giữ, direct Contact cùng pose. About không đổi.

## Lệnh / kết quả hiện hành

| Lệnh | Kết quả |
|---|---|
| `npm run build` | PASS **5,38s**; `dist/sw.js`/manifest tạo đúng, precache34 entries/2757,27KiB. Bundle >500KB warning có sẵn. |
| `npm run lint` | PASS **0 errors**, 2 warnings inline class trong SplashCursor cũ; không warning mới ở phần sửa. |
| `node outputs/redesign/r7.1/check-finale.mjs` | PASS31.544 assertions; 5 viewport ×7 origins ×101 progress, clamp/finite/endpoint/reverse/collision/gas/tier. |
| `node outputs/redesign/r7.1/check-integration.mjs` | PASS161 assertions: store thật, hover snapshot, precedence/default Contact, wiring/legacy removal/ambient schedule và baseline. |
| `node outputs/redesign/r7.1/verify-browser.mjs` | PASS4 contexts: matrix1440/390 + fresh/direct/reload Contact cho mỗi viewport. |
| `node outputs/redesign/r7.1/verify-browser.mjs http://127.0.0.1:5173 --extras` | PASS DPR tối đa/medium, native Tab không vào inert content, Menu→Contact. |
| `node outputs/redesign/r7.1/verify-browser.mjs http://127.0.0.1:5173 --ambient-only` | PASS alpha điểm sao băng thực sự >.001 trong Skills; vào finale thì nhường. |
| `node outputs/redesign/r7.1/preview-smoke.mjs` | PASS compiled preview1440/390, không dev imports; native scroll/Back/direct/reload/reduced. |
| `node outputs/redesign/r7.1/check-pixels.mjs` | PASS25 Canvas PNG +152 DOM poses. |
| `node outputs/redesign/r7.1/preview-smoke.mjs --lab-only` | PASS dev lab shared finale6 poses tới/lùi +legacy render; không cần source probes. |

Các log build/lint và JSON đính kèm là lượt R7.1 hiện hành; không dùng kết quả prototype cũ thay phép đo mới. Checker math được copy sang thư mục R7.1, không ghi đè bằng chứng R2.4.

## Render / reverse / navigation

- Edge **154.0.4258.62**, Windows/ANGLE D3D11, NVIDIA GeForce **RTX4060**. Desktop1440×900, mobile viewport390×844; resize thêm1920×1000/768×1000. Vi↔En, 3 vòng live reduced-motion tại mỗi viewport, hidden mô phỏng **0 frames/450ms**.
- Mỗi viewport **76 poses**: 26 progress tới +26 ngược, ranh .12/.34/.44/.70/.88/.96 và lân cận, 8 đảo nhanh lúc nén/nổ, locale/resize/motion/route Return. Camera error0; GL error0; một Canvas/một camera subscriber priority−1. Geometry collision max error **1,066e−14** world units.
- Năm mốc **.25/.40/.50/.75/1**: dừng550ms rồi đi lệch và quay lại cùng progress, **PNG Canvas hash trùng tuyệt đối** cho cả hai viewport. Origin không chốt lại trong lượt tới/lùi. Trail lấy mẫu cùng curve/progress, không lịch sử frame.
- Native wheel9 bước mỗi viewport đi qua compression/explosion: p≈.326–.543 desktop, .342–.584 mobile. Producer đọc visible Smoother, không manual store trong stream này. Traces giữ native input và screenshots.
- DOM labels và Contact opacity khớp phase chung ở152 poses. Authored transform tới/lùi khớp sau bù visible scroll; sai số viewport lớn nhất **0,40625px**, do fractional native scroll rounding, không tween lag. Không gọi full-page PNG là trùng tuyệt đối: Cursor/Nav và native subpixel scroll nằm ngoài phép hash Canvas.
- **3 EDURA route cycles mỗi viewport**: reader0 Canvas/0 ScrollTriggers/0 geometry/0 tracked targets; geometry/material dispose được ghi. Back về Works đúng EDURA selection/focus/phase; vào finale tiếp theo latch phase đã restore. Fresh/direct/reload Contact: origin0, hole1, cloud0; không cần từng đi qua Works.
- Compiled preview: **22 native scroll poses**, 8 route records, 2 reduced states. EDURA reader0 Canvas; Back focus `work-target-edura`, scroll lệch<2px; direct/reload `#transmission` mở Contact thao tác được; reduced finale height0. Console0 errors. Warning SW bị Playwright block là policy test, không lỗi SW production; Clock warning cũ còn.
- Test compiled ban đầu gọi goto cùng `#work` sau khi đang scroll finale rồi tự scroll CTA, mở case khi history còn chapter `departure`. Giữ `preview-focus-diagnostic.json`; sửa harness vào vùng Works thật (.3 range) trước click và assert saved chapter `works`. Không sửa route để che test sai entry. Race dev helper đọc Fiber root quá sớm sau remount cũng được sửa ở harness bằng chờ root thật sẵn.

## Ánh sáng / pose

Đã mở xem ảnh desktop/mobile thực. Canvas mono0 pixel lệch RGB; không flash trắng phẳng. Tại .58, dark pixels17,07% desktop/75,14% low mobile, giữ dark lanes và nền sâu; tier thấp giảm detail FBM nhưng vẫn giữ năm pha. Endpoint Canvas giữ lõi đen6332/1550 pixels, đĩa/glow cùng silhouette. Desktop BH lệch phải; portrait BH ở vùng trên giữa, chừa vùng dưới cho Contact R7.2.

Panel Contact cũ hiện che một phần hoặc phần lớn BH khi full-page copy đã hiện, nhất là mobile. R7.1 bàn giao pose/visibility đã ổn định; **R7.2 phải bỏ panel/terminal và bố trí email trong vùng tối**. Không ghi trạng thái này thành visual Contact đã pass toàn bộ thiết kế mới.

## FPS / resources

Warmup350ms + đo1,6s/mốc bằng R3F after-effect (render thật). CPU là submission/frame; GPU timer `EXT_disjoint_timer_query_webgl2` bao frame, loại mẫu disjoint. Draw calls gồm HDR/composer/mask. Không browser benchmark khác chạy song song trong lượt đo. Số đo phụ thuộc màn hình165Hz/GPU này.

| Tier / viewport / DPR | p | FPS | CPU p95 ms | GPU p95 ms | Draw calls | HDR target |
|---|---:|---:|---:|---:|---:|---|
| High1440×900 /1 | .40 | 165,34 | 1,40 | 4,11 | 31 | 1224×765 |
| High1440×900 /1 | .58 | 165,18 | .70 | 3,85 | 24 | 1224×765 |
| High1440×900 /1,75 | .40 | 164,91 | 1,40 | 4,64 | 31 | 1280×800 |
| High1440×900 /1,75 | .58 | 165,13 | 1,00 | 4,20 | 24 | 1280×800 |
| High1440×900 /1,75 | .75 | 164,96 | .70 | 4,19 | 24 | 1280×800 |
| Medium900×1000 /1,5 | .58 | 165,14 | .90 | 3,85 | 24 | 922×1024 |
| Low390×844 /1 | .40 | 165,15 | .70 | 3,76 | 12 | 293×633 |
| Low390×844 /1 | .58 | 165,16 | .40 | .11 | 5 | 293×633 |

Tất cả sample window ghi **1 HDR ray render/frame**. Low không composer, tracked target1; high hiện hữu21 targets gồm composer. Route unmount trả tracked targets/geometry về0, không thêm renderer. Compiled octaves4/3/2 và trail vertices2112/1584/1056 đúng tier, resize/motion/route không tạo camera owner thứ hai. Detailed mean/p95/samples/resources trong Browser JSON.

## Phạm vi / bàn giao

Baseline105 files chụp mới trước sửa: **11 source sửa,94 giữ hash**, không source file/dependency/public asset mới. HEAD/index staged hash giữ nguyên; AGENTS append-only một dòng R7.1. Không reset thay đổi trước đó. `useRouteStore`, scroll hook/Smoother, locale, quality, finale math, shader ray/copy/mask và public giữ hash baseline. Xem `integration-check.json` sau append cuối.

- [Contract/handoff](handoff.md), [baseline](baseline.json), [source review](source-review.md).
- [Browser matrix](browser-results.json), [max DPR/native Nav](extras-results.json), [ambient alpha](ambient-results.json), [compiled preview](preview-results.json).
- [Math check](check-results.json), [integration/integrity](integration-check.json), [pixel/DOM audit](pixel-results.json).
- [Desktop trace](trace-1440.zip), [mobile trace](trace-390.zip).
- [Nén](screenshots/1440-forward-0.4.png), [tinh vân](screenshots/1440-forward-0.58.png), [BH Canvas](screenshots/1440-forward-1-canvas.png), [mobile BH Canvas](screenshots/390-forward-1-canvas.png), [compiled frames](preview/).

Browser plugin CUA đã lỗi kernel; shell sandbox launcher lỗi MXC volume G:. Dùng Edge/Playwright cài sẵn với shell escalation hẹp cho local QA, không cài browser/dependency, không deploy/commit. Gas vẫn là **FBM screen-space hai lớp** của R2.4, không volumetric vật lý/NASA nguyên bản. Chưa đo điện thoại thật/nhiệt/pin, Safari, OS reduced-motion thật hoặc HTTPS deployment. Contact redesign thuộc R7.2; R8 cần audit các route entry ngoài vùng Works và toàn hành trình sau khi Contact hoàn thành.

Lab không được liệt kê trong Vite build inputs hiện có: `/3d-lab.html` trên compiled preview rơi vào SPA fallback. Vì vậy smoke lab dùng dev5173, kết quả tại `lab-smoke.json`; compiled production App được kiểm riêng ở preview4173. Không mở rộng build config chỉ để chạy lab trong task tích hợp.
