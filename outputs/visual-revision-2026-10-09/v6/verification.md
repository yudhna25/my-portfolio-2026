# V6 — Story meteor / light wake

09/10/2026. V6 worker đã triển khai và kiểm chứng; V8/G2 chưa thực hiện. G1 được người dùng xác nhận trong prompt. Chỉ sửa ba file được sở hữu, không sửa camera, App, store, locale, ambient meteor hoặc global post-processing.

## Kết quả visual

- Head là billboard mesh, core trắng 16px / halo 80px desktop; mobile 10px / 52px. Kích thước tính bằng CSS pixels, không phụ thuộc `gl_PointSize` hoặc `lineWidth`. Đo phần trắng ≥245 trong screenshot: desktop 14px ở DPR1, 13,71–14,29px ở DPR1.75; mobile 7,33–8,33px ở device DPR3/render DPR1 do viền nội suy. Đường kính ngoài shader vẫn đúng 16/10px.
- Ribbon indexed 128 cặp vertex, taper tới đuôi, ridge trắng và gas/cyan rất nhẹ. Vùng đầu ribbon hẹp để tránh fan tam giác tại điểm đổi hướng; halo riêng giữ head tròn. Glow additive cục bộ, không texture và không thêm composer/Canvas.
- Tail trưởng thành có chiều dài cung chiếu khoảng 42% viewport: 604,85px desktop1440, 163,79–163,81px mobile390. Đây là chiều dài dọc curve, không phải bounding-box ngang khi meteor quay về bên trái. Đuôi luôn lấy mẫu lại từ progress hiện tại, không lưu lịch sử.
- Wake mesh đi cùng ribbon; ba wake DOM nhỏ bám mép milestone ở cùng anchor. Wake bắt đầu 0,06 viewport trước crossing, đạt đỉnh tại crossing rồi về 0 sau 0,26 viewport. Label vẫn giữ opacity tối thiểu0,72; tại crossing là1. Copy/locale/layout/đo điểm/departure110vh (reduced20vh) giữ nguyên.

**Ngoại lệ entry cần V8/G2 đánh giá:** milestone đầu còn ngắn: desktop89,70px (6,23% width), mobile56,92px (14,60%). Curve cũ bắt đầu gần head và clamp tại q=0; đuôi lớn dần khi curve có thêm đoạn đã đi. Không tự thêm một curve trước entry hoặc đổi thời điểm milestone để ép 35–50%. Vì vậy không tuyên bố cả ba milestone đều đạt target chiều dài. Từ milestone2 tới departure đạt khoảng42%.

Ảnh App thật, head luôn ở khoảng24px phía trên label:

| Pose | Desktop1440/DPR1 | Mobile390/device DPR3, render DPR1 |
|---|---|---|
| HOSANA MEDIA | [Ảnh](screenshots/1440-dpr1-milestone-0.png) | [Ảnh](screenshots/390-dpr3-milestone-0.png) |
| UPWORK | [Ảnh](screenshots/1440-dpr1-milestone-1.png) | [Ảnh](screenshots/390-dpr3-milestone-1.png) |
| DESIGNVELOPER | [Ảnh](screenshots/1440-dpr1-milestone-2.png) | [Ảnh](screenshots/390-dpr3-milestone-2.png) |
| Departure0,35 | [Ảnh](screenshots/1440-dpr1-departure-0.35.png) | [Ảnh](screenshots/390-dpr3-departure-0.35.png) |

## Checks đã chạy

| Check | Kết quả / evidence |
|---|---|
| `npm run build` | Pass, Vite5,05s/1864modules; StoryMeteor chunk5,55KB (gzip2,10KB), PWA40entries. Còn warning chunk>500KB có sẵn. |
| Scoped ESLint ba file V6 | Pass, exit0. |
| Helper self-check | **22.023 assertions pass**: đối chiếu các export cũ với baseline, finite/unit-normal/bounded ribbon, wake, stop/reverse/jump. [Script](check-meteor.mjs), [JSON](check-meteor-results.json). |
| Actual App Edge browser | **3.138 checks /115 poses pass**, 0console/runtime errors, GL error0; duy nhất Clock warning có sẵn. [Script](verify-browser.mjs), [JSON](browser-results.json). |
| Progress | Experience0/.05/.2/.4/.7/1 và departure0/.1/.35/.7/.85/1 tới/lùi; ba milestone, late fade, rapid jumps và hold550ms. Buffers/normals/head/wake giống chính xác khi về cùng progress; hold không tăng upload version. |
| Anchoring / camera | Head khớp sampler cũ, world error<0,00002; mỗi crossing cách label24px với sai số<1px do native scroll làm tròn. Camera pose error<1e−7, curve helper cũ byte logic giữ nguyên; không writer camera mới. |
| Responsive / locale | 1440×900 DPR1 và1,75; 390×844 device DPR3/render DPR1; bốn resize390↔1440; Vi/En giữ đúng toàn bộ nội dung ba mission, 0overflow. |
| Lifecycle / reduced / hidden / fallback | **17/17 pass**, fixture dùng chính GalaxyScene/StoryMeteor/Experience. [Script](check-lifecycle.mjs), [JSON](check-lifecycle-results.json). |
| Resources | Mỗi lần trong3unmount dọn đúng2unique geometries+3materials; Fiber subscribers9→0→9, visibility listeners3→2→3. Không texture/target mới. |
| Hidden / offscreen | Hidden simulation chuyển frameloop `never`, 0render calls mới và buffer giữ nguyên; resume đúng. Works chapter meteor ẩn, 0uploads/wake0. |
| Reduced / no-WebGL | Ba live media cycles không tăng subscription; meteor/wake ẩn, cả3label opacity1. Chủ động `WEBGL_lose_context` tạo nền CSS rgb(5,5,5), Canvas0 và đủ3DOMlabels; resources đã dispose. Có warning contextloss khi test cố ý. |
| Scope | **17file protected không đổi hash**, gồm camera/App/store/locale/ambient/composer/lab/CSS/package/lock/AGENTS. [Snapshot](scope-results.json) ghi riêng10file thay đổi bởi nhánh song song ngoài V6; không hoàn tác chúng. |

Playwright chạy trên Edge cài sẵn vì plugin Chrome DevTools không tìm thấy Chrome. Ban đầu dev thiếu node_modules: `npm ci --no-audit --no-fund` khôi phục đúng lockfile, package/lock giữ hash. Một lượt App đầu gặp import `EducationArtwork` đang sửa song song; lượt cuối App đã ổn định và toàn bộ checks pass. V6 không sửa lỗi đó hoặc source ngoài ownership.

## Frame/GPU budget đo thực

GPU: **ANGLE / NVIDIA GeForce RTX4060 / D3D11**, Edge headless, refresh/render cadence khoảng165Hz. Mỗi mẫu3,2s, liên tục seek qua Experience .21–.56. So sánh bằng cách bật/tắt material của riêng meteor trong harness; giữ toàn bộ scene/post-processing hiện tại. Không hạ chất lượng hố đen để lấy FPS.

GPU time dùng `EXT_disjoint_timer_query_webgl2`, cộng các `WebGLRenderer.render` pass trong mỗi frame, loại sample disjoint/unavailable. Không phải thời gian CPU DOM hoặc tất cả chi phí hệ điều hành. Draw calls/triangles cũng cộng qua renderer passes; đây là số cả scene, không chỉ pass cuối. FPS đếm actual rendered after-effects, không dùng riêng rAF nền.

| Viewport / render DPR | Meteor | Rendered FPS | Frame median /p95 ms | Renderer GPU median /p95 ms | Draw calls /triangles |
|---|---|---:|---:|---:|---:|
| 1440×900 /1 | Off | 165,11 | 6,10 /6,40 | 0,415 /2,620 | 24 /28 |
| 1440×900 /1 | On | 164,76 | 6,10 /6,40 | 0,651 /3,286 | 27 /538 |
| 390×844 /1 (device DPR3) | Off | 165,27 | 6,10 /6,30 | 2,441 /3,734 | 5 /8 |
| 390×844 /1 (device DPR3) | On | 165,16 | 6,10 /6,20 | 2,567 /3,445 | 8 /518 |
| 1440×900 /1,75 | Off | 165,24 | 6,10 /6,30 | 1,081 /3,574 | 24 /28 |
| 1440×900 /1,75 | On | 164,66 | 6,10 /6,40 | 1,336 /4,286 | 27 /538 |

V6 thêm **3draw calls/510triangles**, 2geometry/3material. GPU median delta khoảng0,126–0,255ms tùy viewport; các lượt đo tuần tự trên desktop nên p95/delta có nhiễu, không phải bảo đảm tuyệt đối cho GPU di động. Audit source không có `new`/array/object/timer/simulation trong `useFrame`; reusable scratch/matrices/typed buffers, geometry chỉ upload khi progress/layout thay đổi.

## Trace và bàn giao

- [Desktop DPR1 trace](1440-dpr1-trace.zip), [Desktop DPR1.75 trace](1440-dpr1.75-trace.zip), [Mobile DPR3 trace](390-dpr3-trace.zip).
- [Desktop forward/hold/reverse clip](1440-forward-hold-reverse.webm), [Mobile clip](390-forward-hold-reverse.webm). Clip minh họa manual progress; không dùng nó để tính FPS vì recorder30fps.
- [Handoff V8](handoff.md): interface/layout/curve/geometry mới, dòng tiến độ đề xuất và entry-tail exception.

Chưa kiểm chứng điện thoại/GPU di động thật, nhiệt máy, OS reduced-motion trực tiếp hoặc nhận xét thẩm mỹ G2. Mobile ở đây là viewport trên RTX4060. Trace/ảnh App có cả thay đổi V5/V7 cùng thời điểm; V8 cần kiểm chứng lại bản tích hợp cuối. Không tự chạy V8/V9 hoặc xin G2 thay integrator.
