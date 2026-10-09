# R2.4 → R7.1 — Finale đảo chiều

08/10/2026. Đây là prototype trong `3d-lab.html?story=1&chapter=finale&p=.5`; App production vẫn dùng `story=false`. R7.1 tích hợp **cùng** `WorksConstellations`, `finale.js`, `CameraRig/cameraPath` và `BlackHoleSystem`; không sao chép renderer, thêm Canvas/composer hoặc dựng engine finale khác.

## Progress và pha gốc

- `useScrollStore.setStoryPosition()` là producer duy nhất. Mọi vị trí, camera, nhãn, trail, khí, flare và BH đọc `storyChapter/chapterProgress`; không đo scroll lần hai, chạy tween tự tiếp diễn hoặc damping riêng.
- `CameraRig` ghi camera ở priority −1; `WorksConstellations` cập nhật ở −0.75, trước HDR/composer. Camera story không có pointer parallax. Đoạn `finale` riêng hiện dài **2.25 viewport**; R7.1 nối sau vùng đọc/chọn Works thật.
- Giữ object `worksOrbit` và contract R2.3: lần đầu finale `p>0` hoặc jump Contact chốt `origin=phase` vừa hiển thị; đảo chiều, giữ `finale,p=0`, resize/locale không chốt lại. Chỉ canonical `works` trả `phase=origin`, rồi resume idle theo selection/hover/focus. Deep link chưa qua Works dùng `STORY_IDLE_PHASE=0`, `STORY_SEED=20261007`.
- `finaleFigure(p, origin, index, basis, out)` tái dùng `out`; góc = `origin + index×2π/3 + 18×min(p/.44,1)²`. Giữ geometry/Works basis thật. `basis.hole` là BH world center đổi sang local basis; cả orbit offset, `offsetY` và figure scale cùng về 0. Không nhầm local root origin với tâm BH.

## Năm pha hiện hành

| Progress | Trạng thái suy trực tiếp từ `finaleState(p, out)` |
|---|---|
| 0–.12 | Nhãn rút về 0; camera giữ Works, radius/figure scale giữ 1. Góc authored đã tăng nhẹ; `p=0` khớp hình Works tuyệt đối. |
| .12–.34 | Orbit co/tăng góc, tâm hình tiến về BH; radius còn .24, figure còn .30 tại .34. Trail cong tăng .12→.24; camera đổi từ Works sang pose Contact. |
| .34–.44 | Nén đúng **10%** toàn đoạn. Tại .44, mọi sao/group cùng về `BLACK_HOLE_CENTER=[0,0,-200]`, scale=0; camera đã tới pose Contact. Flare cục bộ tăng .42→.44 rồi giảm đến .53. |
| .44–.70 | Khí nhiều lớp bung theo progress, có lanes/vùng tối; cloud tăng .44→.58. Sao fade .43→.47, trails rút .44→.55; không ghi lịch sử frame. Camera giữ nguyên pose collision/Contact. |
| .70–1 | Khí co thành đĩa/lõi; `hole` tăng .70→.96, `collapse` tới 1 tại endpoint. `contact` tăng .88→1 để R7.1 nối opacity DOM Contact thật. |

**.96 và 1 khác nhau:** tại .96 BH đã hiện đủ nhưng khí/collapse còn kết thúc; tại 1 khí, flare, trail và nhãn đều bằng 0. Finale1 = Contact về camera, shear, intensity và silhouette; không đổi pose sau khi xuất hiện CTA. BH intensity story `1 + .35×hole`, shear `uTime=3×collapse`, Contact luôn dùng effective p=1.

## HDR, khí và mask

- HDR target/ray tracer RK4 được tái dùng, render một lần mỗi frame; khí nằm trong copy shader, không thêm volumetric pass. Hash khí cố định + captured origin + progress; ambient `Nebula`/`ShootingStars` không làm vụ nổ và được freeze trong story lab.
- `uFinaleEnabled/uFinaleHole` điều khiển formation riêng: copy nhân coverage BH với `hole`, mask nhân captured-ray suppression cùng giá trị. **Không dùng `uPortalVisibility` để fade finale**: uniform đó là curtain portal toàn khung và sẽ xóa khí/nền.
- `uFinaleGas = (cloud, collapse, flare, progress)`, `uFinaleOrigin=worksOrbit.origin`; gas center lấy `uRayCenter` chiếu chính BH bằng camera hiện hành. Không dùng center screen giả hoặc camera khác cho khí.
- Khí premultiply RGB bởi alpha đã clamp≤.9; khi flare=0, straight RGB≤**.82**, dưới Bloom threshold1. Chỉ flare nhỏ/đĩa phát HDR; không tăng density thành glow toàn khung, không bỏ mask lõi đen. Production và portal tiếp tục nhánh cũ khi `uFinaleEnabled=0`.

## Ngân sách và lifecycle

| Tier | Trail samples / sao chính | Gas octaves | RK4 steps / target max | DPR / bloom hiện hành |
|---|---|---|---|---|
| Low | 12 | 2 | 128 / 768px | 1 / tắt |
| Medium | 18 | 3 | 160 / 1024px | ≤1.5 / .15 |
| High | 24 | 4 | 192 / 1280px | ≤1.75 / .3 |

Trail pool chỉ 44 sao chính; các chòm vẫn dùng đủ 80 main/supporting points. Mỗi sample tính pose tại `q=max(0,p−(j+end)/samples×.055)`, nên stop/reverse không phụ thuộc FPS. Array/geometry/uniform được tạo ngoài `useFrame`; callbacks chỉ ghi buffer/uniform/object có sẵn. Khi đổi tier, copy material `onUpdate` giữ uniform identity **và đặt `needsUpdate=true`** để recompile octaves.

Reduced-motion dùng endpoint p=1 cho camera/BH, ẩn orbit/trails/nhãn finale và giữ Works selection tĩnh khi ở Works. Hidden tab dùng Canvas `frameloop='never'`; không tích phân idle hoặc bù thời gian đã ẩn. Geometry hình/trail, HDR target, ray material/geometry và mask effect có cleanup; DOM WorksControls subscribe được unsubscribe qua `useGSAP`. R7.1 giữ các owner này khi nối preview/CTA, không giữ thêm pool hoặc listener ngoài lifecycle.

## Kiểm tra và việc R7.1 còn phải làm

Chạy `node outputs/redesign/r2.4/check-finale.mjs`: **31.544 assertions pass**, gồm 27.292 continuity/reverse/collision/camera checks và 4.252 regression gas/tier. Sai lệch collision world tối đa 1.07×10⁻¹⁴; khí không flare max RGB .82. Browser đã đối chiếu năm mốc hold/reverse pixel-identical; số đo ban đầu RTX4060/DPR1 khoảng165fps cả ba tier, GPU full-frame p95<4ms. High DPR1,75 đã pass 165.02–165.38fps; dùng `verification.md` cùng thư mục cho kết quả cuối và trace, không coi số viewport này là số đo điện thoại thật.

R7.1 phải nối anchors Works thật, rút preview/nhãn bằng `label`, nối Contact DOM bằng `contact`, kiểm Back/selection/hash/locale/resize và gỡ caller `contactProgress` cũ nếu chúng chồng camera/intensity/veil. R2.4 chưa thêm email, terminal, typography production hoặc một finale production khác.
