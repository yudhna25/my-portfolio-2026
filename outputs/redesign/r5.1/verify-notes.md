# R5.1 — Browser QA cuối

08/10/2026, Edge 154 / Playwright trên ứng dụng thật `http://127.0.0.1:5173/`. **PASS 262 snapshots, 8 cấu hình, 0 console error / 0 WebGL error**. Chỉ còn warning đã có: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`

## Lệnh và môi trường

```powershell
$env:R51_PHASE='all'
node outputs/redesign/r5.1/verify-browser.mjs *> outputs/redesign/r5.1/browser-run.log
```

- Browser: `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`, headless; runtime Playwright có sẵn. Plugin Browser/Chrome không hoạt động trong phiên này nên dùng Edge thực, không cài dependency.
- Desktop 1440×900 và mobile viewport 390×844, Vi/En, normal/reduced-motion: đủ 8 tổ hợp. Device scale factor 1; DPR thực của scene ghi tại mỗi snapshot (theo quality tier hiện hành).
- GPU: ANGLE / NVIDIA GeForce RTX 4060 / Direct3D11. Bộ kiểm này không benchmark FPS; Browser đã đóng trước khi Agent tích hợp đo performance.
- `browser-results.json`, `browser-run.log`, `browser-trace.zip` và 121 PNG của harness này trong `screenshots/` là bằng chứng R5.1 mới (8×15 frame + 1 direct-work). Các ảnh có prefix `production-` do Agent tích hợp kiểm riêng. Quick cuối trước full cũng PASS 58 snapshots; các quick trước sửa head/material không được dùng làm bằng chứng final.

## Phạm vi đã chạy

| Kiểm tra | Kết quả thực tế |
|---|---|
| Experience và departure tại p=0/.25/.5/.75/1, tới/lùi trong cả 8 cấu hình | PASS; các buffer head/trail nhìn thấy tái tạo đúng từng giá trị Float32 khi đảo chiều |
| Dừng p=.47 của hai chapter 400ms | PASS; head, trail và Works orbit không đổi |
| HOSANA / UPWORK / DESIGNVELOPER | PASS; head đi khoảng 24px trên label DOM thật, nhãn tương ứng active và opacity >.999 khi normal |
| Head / trail material | PASS; head opacity bằng trail opacity, size 5 CSS px × DPR, đúng 1 điểm head / 128 điểm trail |
| Departure p=.05/.12 | Đã mở ảnh thật; head trắng hiện rõ và trail mảnh. Works chưa hiện trước ngưỡng arrival .3 ở normal |
| Native wheel chậm (5×80), nhanh (+2200), đảo chiều (−1300) | PASS; producer theo visible DOM, sai lệch progress dưới .0006 |
| Hidden → chờ → resume | PASS; frameloop `never`, buffer versions/positions và orbit giữ nguyên; resume về đúng pose |
| 3 vòng reduced → 390/En → normal/1440/Vi | PASS; nội dung đủ, nhãn opacity 1 trong reduced, meteor ẩn, camera hữu hạn và progress theo DOM sau reflow |
| About / Skills / Education ambient | PASS; visible, uVisibility=1 tại p=.5 |
| Hai burst ambient thực ở Skills | PASS; peak 3 vệt mỗi burst, khoảng cách 4345.6ms (yêu cầu 4–7s), 1532 mẫu rAF / 9368.2ms |
| Portal / Experience / departure / finale | PASS; ambient nhường cảnh, không meteor nền visible |
| Native Nav Enter → #work và reload #work 390/En | PASS; chapter Works, không replay StoryMeteor, Works visible, fresh orbit origin 0 |
| Single renderer ownership | 1 Canvas, 1 head, 1 subscriber camera priority −1 tại cả 262 snapshots |

## Số đo và đối chiếu

- Sai lệch head-label lớn nhất **0.45569px**, so với vị trí `label.top − 24px`, trong 12 mốc normal (4 tổ hợp × 3 công ty). Đây là rounding fractional native/Smoother scroll; test giới hạn <1px. Reduced không render meteor nên các buffer head cũ không được coi là vị trí minh họa reduced.
- Sai lệch geometry nhìn thấy lớn nhất **0.0000152588 scene units** khi reconstruct layout từ DOM và đối chiếu `writeStoryMeteor`; tolerance .001. Stop/reverse so với frame trước dùng so sánh buffer chính xác, không tolerance.
- Camera XYZ so với contract: **0**; sai lệch quaternion lớn nhất **5.16191e-8 rad** (độ chính xác `angleTo`), giới hạn <1e-7. Observer nhỏ nhất trong Experience **90.16097**; departure **40.19950**; cả bộ pose đều r>1, không NaN/Infinity.
- Cả 3 company/role/period/type/description vẫn đúng namespace Experience Vi/En. DOM đọc được không phụ thuộc head đến mốc; opacity thấp nhất .72. Không overflow ngang ở các snapshot.
- `snap()` đọc buffer/material/camera thật qua Fiber `_roots`; layout tái dựng từ label DOM/native range, không thêm probe production. Việc đối chiếu camera/curve dùng cùng utility nguồn và được bổ sung bởi self-check độc lập của Agent tích hợp; đây không phải chứng minh vật lý thiên văn.
- Các `milestoneHeadErrorPx` được tính từ headPixel/label box đã lưu. Harness đã giữ cùng record trả về để serialize metric này cho những lần chạy tiếp theo; sửa phần ghi kết quả không thay acceptance assertion đã pass trong full run.

## Visual review và giới hạn

Đã mở PNG desktop DESIGNVELOPER, mobile En UPWORK và hai early departure. Head rõ, core nhỏ; trail trắng mảnh có fade, không panel. BH vẫn ở phía phải và không che label/bio chính. Có đoạn đổi hướng nhẹ của tail trên desktop; ảnh giữ nguyên để review thẩm mỹ, geometry pass không thay cho đánh giá visual.

Finale chưa có DOM chapter production trong R5.1; kiểm gating finale dùng **manual engine pose**, không tuyên bố transition finale production đã chạy. Reduced-motion là browser media emulation và mobile là viewport của máy RTX 4060; chưa kiểm điện thoại hoặc OS preference thật. Hidden là document visibility emulation qua event/getter; nội dung native wheel/Nav Enter và hash reload chạy thật. Không kiểm FPS/thermal trong harness này và không thay thế báo cáo performance/lifecycle mount của Agent tích hợp.

Các test chỉ chạm output QA; không sửa src/public/AGENTS. Bàn giao source path, build/lint/integrity/geometry-preservation và append tiến độ cho Agent tích hợp.
