# V3 — Kiểm chứng bản tích hợp và G1

> **Cập nhật review 10/10/2026 — G1 mở lại để tinh chỉnh.** Người dùng đã chốt [phương án opening/năm/intake mới](../../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md) ở Q12, **chưa sửa code và chưa duyệt lại visual**. G2 yêu cầu cải thiện meteor; V9/G3 chưa bắt đầu. Source/build/ảnh/check bên dưới là lịch sử V3 ngày 09/10, không phải bằng chứng animation mới đã được sửa hoặc nghiệm thu. V5–V8 sau đó đã được tích hợp; xem [V8 verification](../v8/verification.md) cho baseline hiện tại.

09/10/2026. **V3 đã tích hợp; G1 chờ người dùng duyệt thẩm mỹ.** Chỉ thay Hero→About và các consumer cần tham gia. V4 không bị chỉnh; V5/V6/V7 chưa chạy.

## Kết quả hiện tại

| Kiểm tra | Bằng chứng |
|---|---|
| Build App | `build.log`: PASS, Vite5.79s; PWA40 entries/3178.43KiB. Warning chunk>500KiB vẫn có; không tắt warning. |
| Repo lint | `lint.log`: PASS,0errors/2warnings cũ `SplashCursor.jsx`149/175 (`unsupported-syntax`). |
| Pure portal/camera | `check-portal-results.json`:4000p×3aspects, reverse/continuity/finite/exterior observer PASS; radius nhỏ nhất8.182909rs. |
| Backdrop interface | `check-backdrop.mjs`:58checks PASS; đây là check nguồn, không thay phép đo Browser. |
| Phạm vi | `scope-results.json`:91file predecessor giữ hash; ray shader/System/mask/quality V2 nguyên hash. BlackHole chỉ thêm center interpolation ở writer hiện có. |
| App Browser | `browser-results.json`:100frame checkpoints,61comparisons,3EDURA lifecycle;0unexpected console/page errors. |
| Lab Browser | `browser-lab-results.json`:16portal frames/8reverse comparisons,0errors; dùng một About thật như App. |
| Fallback | Hai ảnh riêng: live context-loss và initial no-WebGL;0Canvas,portal844px trên viewport390×844; About đọc được/non-inert khi skip bằng keyboard. |

`check-browser.mjs` lưu source hashes trước/sau, cấu hình và evidence thực. Ảnh G1 từ bản tích hợp, không dùng ảnh V1/V2 để nghiệm thu V3. Pipeline đã có được giữ và đo lại trạng thái/counter hiện tại; số FPS cũ không được dùng làm phép đo V3.

## Cấu hình Browser và cách so

- Edge154.0.4258.62 trên Windows, ANGLE/D3D11 **Intel UHD Graphics630**. Playwright headless dùng Edge đã cài, service worker bị block trong context test để không lấy source/cache cũ.
-390×844/touch/low,1440×900/high,1920×1080/high; device/renderDPR1.390px là viewport mô phỏng trên desktop, không phải điện thoại thật. Native Edge cũng được mở xem Hero/scroll và reload source cuối; không dùng lượt này để suy FPS.
- Matrix Vi/En: p=0/.25/.44/.47/.50/.70/.94/1, mỗi cấu hình đi tới rồi đi lùi.96ảnh matrix+1ảnh hold7 thực+3direct-hash=100frame. Hai ảnh fallback và16ảnh Lab được tách riêng.
- Held checkpoint đồng bộ cả store và DOM/Smoother rồi giữ producer; native mode được resume và cuộn wheel thật riêng. Không chỉ đặt store rồi để producer khác ghi đè.
-61comparisons xác nhận camera pose, active ray uniforms, StarField/hai Nebula uniforms/geometry, backdrop visibility và DOM transform/opacity/inert/aria ở cùng p; rect delta lớn nhất0px trong những samples này. Không tuyên bố mọi pixel của hai PNG bằng nhau: idle year twinkle/glitch, pointer following và ambient ngoài portal được ghi riêng.
- Shader uniforms khớp theo float32 GPU; chênh số double JS lớn nhất3.76249e−9, dưới precision có tác dụng trong các samples. `browser-backdrop-results.json` còn giữ targeted48snapshots/27comparisons trước font guards; canonical App/Lab sau guards đã kiểm lại render-state đầy đủ và ghi22source hashes mới.

## Các tình huống đã kiểm

| Tình huống | Kết quả |
|---|---|
| Stop700ms / rapid reverse / jump | Pose, ray/DOM gate/transform đứng đúng cảnh; GPU resources không tăng khi hold. Các jump .94→.25→.70→.44→.50→0→1→.25 kiểm riêng. |
| Native wheel tới/lùi/stop |6cấu hình native producer `manual=false`; p tăng/giảm theo wheel, ổn định sau khi Smoother settle. |
| About thật | Một `#about`; heading/avatar/bio xuất hiện trong portal eject. Root visibility mở từ>.54, input gate.84; inner motion identity tại.94 trở đi, marker/section không transform. |
| Resize |1440→1024→1440 tại p.70; giữ chapter/p, target resize theo drawing buffer, pose/DOM phục hồi. |
| Vi/En giữa eject | Giữ portal/p.70; remeasure theo locale, không dùng timeline once. |
|3motion cycles | Portal rút900px khi reduced, About đọc được; trở lại full mode p.70 hợp lệ.6geometries/23textures/10programs ổn định trong samples normal sau từng cycle. |
| Menu + locale + media + Escape | Focus còn trong dialog, scroll lock được trả; không mất control trigger sau close. |
| Skip trong dark core | Skip-link không bị hút/inert; Enter đến About và focus ở nội dung đọc được. |
|3EDURA/Back cycles | Không replay intro; Works p≈.200062/focus`work-target-edura`; unmount0geometry/0texture/0subscribers/0producer/0Canvas; remount1Canvas/producer/camera và13geometry/23texture/13program ổn định. |
| Direct hashes | `#about`, `#work`, `#transmission` vào đúng chapter, không bắt đi qua intro. |
| Glitch tích hợp | Chờ chu kỳ idle thật đến7 rồi chụp; vào portal reset6, giữ semantic2026. Nhịp/contours/decode V1 được giữ. |
| No-WebGL / context loss | Fallback thật không bị nhầm với alternate DOM bên trong canvas; năm/Hero tĩnh, O trắng thay renderer vắng; đoạn portal100vh/finale0vh. Keyboard skip tới About hợp lệ. |

## Một Canvas / producer / camera / HDR và resource

Trong frame có WebGL: một Canvas, một ticker producer hiện có, một camera writer priority−1. Ray render instrumentation thấy **1HDR pass/frame**, kể cả dark core; shared ray/copy/mask wrappers vẫn cùng identity. Target bằng drawing buffer, không phóng lại texture nhỏ. Uniforms hữu hạn và GL error0 ở những frame được kiểm.

Target identity giữ qua các checkpoint; resize dùng target hiện có và `setSize`, không tạo compositor mới. Dispose của target/ray material được quan sát khi EDURA unmount. GPU memory về0geometry/0texture sau unmount; scene subscribers và producer cũng về0. Chỉ kết luận resource ổn định trong các hold/media/route cycles đã chạy; không biến counter callback thành FPS.

V3 chưa đọc lại toàn bộ HDR pixels ở mọi p/DPR như V2. V2 ray shader/quality/mask/System nguyên hash, V3 kiểm wiring/target/counter/finite uniforms/current rendered PNG và safe observer. Không tuyên bố pixel bằng nhau tuyệt đối hoặc không thể mờ trên mọi máy.

## Ảnh để duyệt

Mở `review.html` qua server cổng5183: `outputs/visual-revision-2026-10-09/v3/review.html`. Chọn viewport/Vi-En/mốc, xem hai hướng cạnh nhau; có ảnh giữ7. Gallery chỉ là ảnh tĩnh, link `/` mở App thật để cuộn.

- [Hero O](screenshots/1440-vi-portal-forward-0.png)
- [Glitch giữ7](screenshots/1440-vi-hero-glitch-hold-7.png)
- [Intake .25](screenshots/1440-vi-portal-forward-0.25.png)
- [Dark core .44](screenshots/1440-vi-portal-forward-0.44.png)
- [Ejection .70](screenshots/1440-vi-portal-forward-0.7.png)
- [About ổn định .94](screenshots/1440-vi-portal-forward-0.94.png)
- [Reverse .25](screenshots/1440-vi-portal-reverse-0.25.png)
- [390px eject](screenshots/390-vi-portal-forward-0.7.png)
- [390px About](screenshots/390-vi-portal-forward-0.94.png)

## Diagnostics và giới hạn

- App report14warnings:13`THREE.Clock` cũ qua các mount và1`loseContext: context already lost` khi chủ động mất context. Initial no-WebGL có3creation/error diagnostics dự kiến được giữ riêng trong scenario;0**unexpected**errors, không gọi tổng console “hoàn toàn sạch”. Lab có1Clock warning cũ.
- Sandbox đầu tiên chặn socket/khởi chạy Edge; chạy cùng server/checker ngoài sandbox đã được automatic review cho phép. Không đổi chính sách hệ thống hay thư viện để vượt lỗi.
- Harness trước có race chọn Fiber root khi remount EDURA/direct-hash và click lại project đã pin. Sửa checker để đợi root thực, giữ selected state và lưu attempts riêng. Tail chỉ resume khi22source hashes khớp, không gộp evidence khác source. Initial no-WebGL oracle sửa thành kiểm Hero tĩnh rồi skip tới About, không yêu cầu About dưới fold phải visible tại Hero0.
- Source cuối thêm guard `active` cho callbacks font/measure ở Hero/About/Nav để effect đã cleanup không ghi lại trạng thái cũ trên DOM được React tái sử dụng. Sau đó chạy lại full App và Lab; bản trước guard được giữ riêng, không dùng làm canonical G1.
- Tham khảo [NASA SC24](https://www.nas.nasa.gov/SC24/research/project19.php) cho accretion/photon rings/camera approach. DOM/backdrop warp và ejection là cinematic screen-space; observer không xuyên horizon, không mô phỏng một quá trình vật lý trở ra từ bên trong BH. Không dùng render/texture NASA gốc.
- Chưa đo FPS V3/thermal/điện thoại thật, OS reduced-motion thật/screen reader, browser zoom200%/Safari/Firefox, production HTTPS/offline/PWA hoặc performance regression toàn trang. Lab được kiểm dev, build mặc định chỉ App entry. V1 ghi Nav/Sound text200% còn cần V10; không tuyên bố a11y toàn trang PASS.
- V2 từng đo full-resolution ray shader nặng trên UHD630; giữ chất lượng, không hạ target để đạt FPS quảng cáo. Đây là rủi ro hiệu năng còn cần đo ở V10 và máy đích.

**G1 vẫn chờ người dùng duyệt Hero/O/glitch/portal. Không tự chạy V5/V6/V7; V4 có thể tiếp tục độc lập.**
