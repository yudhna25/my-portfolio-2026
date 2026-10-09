# R2.2 — Verification portal trong lab

**Trạng thái: ✅ prototype portal dùng chung đã chứng minh trong lab; chưa tích hợp Hero production.** Ngày địa phương 08/10/2026; Browser run kết thúc 2026-10-07T20:32:22.975Z.

## Thay đổi và phạm vi

Neo ảnh HDR hiện có vào O thứ ba/cuối của PORTFOLIO semantic; composite/mask dùng cùng remap/aperture/visibility. Không thêm ray tracer, HDR target, Canvas hoặc composer thứ hai. CameraRig/path R2.1 không sửa. Ba nhịp dùng cùng chapter progress trên range DOM 1,75 viewport: mở O → tối/đổi mapping → đẩy ra nhìn BH và settle About. Nền sao chỉ mở sau portal; chòm sao vector cũ tắt riêng trong story. Bụi/biến dạng hai nét gần O theo p, không auto play.

Hai lỗi được tìm và sửa qua render thật: O trong flow cũ ra ngoài màn hình trước portal, nên mẫu DOM fixed được đo trong viewport; Fiber cài đặt clone scalar uniform wrappers, nên copy material được gắn lại đúng shared uniform objects trong onUpdate. GLSL single initialized return loại warning ANGLE mới. DOM timeline subscribe store trong useGSAP cleanup, không ticker độc lập.

`App` vẫn default story=false; chưa redesign section/glitch/finale. Xem [handoff](handoff.md) cho API, shader, anchor `fixed` và ràng buộc tích hợp R3.2.

## Lệnh / kết quả

| Kiểm tra | Kết quả / bằng chứng |
|---|---|
| `npm run build` | Exit 0; Vite 5,71s; PWA29 precache entries/2233,85KiB, dist/sw.js tạo thành công. `build.log` |
| `npx eslint` 10 source file sửa/thêm | Exit 0, 0 warning; `scoped-lint.log` |
| `npm run lint` | Exit 0, 0 error; 2 warning SplashCursor có sẵn, không sửa ngoài phạm vi; `lint.log` |
| `node outputs/redesign/r2.2/check-portal.mjs` | 31.187 assertions /1001 p, clamp/nonfinite/reverse/output reuse/dark swap/ownership/shared uniforms/DOM subscription; `check-portal-result.json` |
| `node outputs/redesign/r2.2/verify-portal.mjs` | Exit 0; 59 records, 0 console error/0 WebGL error; `browser-results.json`, `browser-run.log` |
| bundled Python `check-pixels.py` | 20 PNG/10 cặp forward-reverse exact; toàn ảnh không exclude, changed pixels=0, maxRGBdiff=0, MAE=0. `pixel-results.json` |

Build hiện cấu hình production main; lab được kiểm trên Vite dev tại `127.0.0.1:5173/3d-lab.html?story=1`, không tuyên bố có lab route trong dist. Không cài thư viện mới.

## Render / tương tác / lifecycle

- Desktop1440×900/high và mobile viewport390×844/low, DPR1: 0/.25/.5/.75/1 tới/lùi; camera position/target, shader pull/mini/visibility/scale/center/aperture khớp. PORTFOLIO aria-label đủ, O index8, 2026 đủ4 số và trong viewport.
- Mốc .5 cả hai chiều/hai viewport: RGBmax=0; 20ảnh mono, 0pixel channel lệch>1. Frame đầu không backdrop/BH lớn/chòm sao; mini ở O, vùng quanh gầnđen. P=.75 ejection còn gần; p=1 ổn định About/BH phải/coređen/đĩa sáng.
- Pause rồi wheel/pointer giữ pose/pull; Resume sync về vị trí đang giữ. 182 rendered samples khi native wheel/Smoother settle: shader pull error max=0.000000000; DOM opacity error max=0.000048369, trong 0,00005 do GSAP CSSPlugin làm tròn4 chữ số, không lệch progress một tick.
- Boundary .43/.48/.519/.52/.60/.65 finite; .48… .60 visibility0 che đổi mini→full tại .52. Self-check dense1001p xác nhận continuous progress và mapping switch trong khoảng tối.
- 3 vòng resize320→390→1440, localeVi/En/fonts: anchor error max <0,1px (records đo thực 0), overflow0, p=.25 được giữ; DOM remeasure. 3 vòng legacy↔story có subscribers8 và memory6geometry/23texture ổn định ở cùng high pose.
- Live/fresh reduced-motion: portal dùng endpoint p=1, camera và composite cùng About; Hero staticmini p=0; không biến dạng/zoom theo scroll. Fresh jumps About .5 và Portal .75 không phải đi qua Works.
- **3 Canvas unmount thật** qua event context-loss mô phỏng và source fallback hiện có: targets đang render **21→0** cả3; sau fresh root là target ứng dụng mới. Trigger là event mô phỏng, không phải GPU/hardware context crash thực.
- Cùng root trong mọi mini/full/resize: **1 HDR ray target texture ID**, 1 ray-render/frame, 1Canvas/1scene-camera writer. High pipeline **21 target objects đang được render**, gồm 1HDR ứng dụng + buffers/mips/composer hiện có; không báo sai là chỉ1 target toàn pipeline. Peak21, resize events dispose/reallocate buffers. `browser-results.json` ghi IDs và counts trước/sau.
- Readback **toàn ảnh RGBA16F** ở10 forward poses: 22,436,580 half-float components, 0Inf/NaN/0GLerror; readback có nonzero data, không chỉ buffer0 giả pass. Target desktop1224×765, mobile293×633. Observer minr≈8,183>1 trong checker; actualcamera finite/position&direction errors <1e-9.
- App default Hero/Contact smoke: uPortalEnabled=0, 1Canvas, camera legacypath error<0,01; production section/camera/script/style không bị redesign.

## Chi phí đoạn mở O / ejection

Edge 154.0.4258.62, Windows máydev, **ANGLE NVIDIA RTX4060 Direct3D11**, viewport1440×900/high24k sao, DPR1; HDR1224×765, TRACE_STEPS192. 1,8s đo mỗi đoạn sau warmup; time phụ frozen. EXT_disjoint_timer_query_webgl2 đo riêng region ray gl.render (không toàn composer).

| Đo | Render FPS | CPU submission mean/max ms | GPU ray mean/max ms | GPU samples |
|---|---:|---:|---:|---:|
| R2.2-opening-O / p=0.25 | 165.49 | 0.052 / 0.200 | 0.648 / 1.548 | 297 |
| R2.2-ejection / p=0.75 | 165.11 | 0.056 / 0.200 | 0.618 / 1.460 | 298 |

FPS lấy R3F after-render callbacks, không lấy ticker DOM. CPU submission là chi phí JS gửi ray draw, không phải thời gian GPU. `trace.json.gz` có CDP devtools.timeline/gpu/blink.user_timing và hai mark mởO/ejection; `trace-summary.json` kiểm decode/events. Không suy FPS hoặc nhiệt điện thoại thật từ desktop viewport.

## Bảo toàn / giới hạn

- Baseline R2.2 được tạo mới trước sửa tại 2026-10-07T20:04:33.373772+00:00, không dùng hash cũ như mới. **82/92file giữ hash,10file sửa đúng scope +2file source mới**, CameraRig/cameraPath/App/useSmoothScroll/public/config/packages giữ hash. HEAD và tracked working tree giữ nguyên; `integrity.json`. Lab Vi/En67keys parity.
- Browser plugin Chrome không gọi được vì thiếu Chrome stable executable; dùng Edge headless Playwright runtime sẵn có, capture render WebGL thật. Mobile, resize, OS reduced-motion/context loss là mô phỏng; chưa test điện thoại thật/OS toggle/hardware loss.
- Warning THREE.Clock có sẵn từ Fiber, 2lint warnings SplashCursor và chunk>500KB có sẵn; 0 warning shader ANGLE mới sau sửa. Không đổi library/dependency để dọn warning ngoài task.
- Mini dùng crop/remap của **cùng ảnh ray** hiện có, không ray render riêng ở độ phân giải mini. HDR vẫn render toàn target một lần/frame — chi phí cố định này được đo ở trên. Shader khí procedural hiện có; không claim NASA100%.
- `contact-sheet.jpg`/20PNG là render thực, không phải storyboard minh họa; test chỉ giấu HUD/controls/back link khi chụp, giữ scene/semantic heading, không sửa pixel gốc.

## Bàn giao

[Lab portal](http://127.0.0.1:5173/3d-lab.html?story=1&chapter=portal&p=.25), [contact sheet](contact-sheet.jpg), [frame manifest](frame-manifest.json), [handoff R3.2](handoff.md). R2.2 xong trong lab; chưa chạy R2.3/R2.4 hoặc tích hợp Hero/glitch production.
