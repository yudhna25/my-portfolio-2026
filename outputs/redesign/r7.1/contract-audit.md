# R7.1 — Audit contract trước tích hợp

09/10/2026. Đọc mã hiện tại và bàn giao R2.1/R2.3/R2.4/R5.2/R6.2; read-only đối với src/public/config/AGENTS. Đây là danh sách rủi ro trước sửa, chưa là kết quả nghiệm thu.

## Phạm vi phải nối

| File | Thực tế trước R7.1 | Thay đổi nhỏ nhất cần xét |
|---|---|---|
| `src/App.jsx` | `works` nối thẳng `contact`; không DOM range finale | Thêm range `data-story-chapter="finale"` 2.25 viewport sau vùng Works160vh. Giữ một producer/Canvas/CameraRig và reader unmount hiện có. |
| `src/components/Work.jsx` | Root absolute100vh được pin `y=p*height` chỉ trong Works; mọi chương khác reset y0 | Nối transform/opacity phần nhãn + preview theo `finaleState.label`; giữ viewport position ở boundary Works→finale, inert ngoài Works. Không tự chạy tween rút nhãn theo thời gian. |
| `src/components/sections/Contact.jsx` | `contact-approach` scrub0.45 vừa ghi contactProgress vừa tween chữ độc lập | Bỏ writer timeline cũ, nối visibility qua `finaleState.contact` từ progress chung. Contact layout/content redesign thuộc R7.2. |
| `src/3d/GalaxyScene.jsx`, StarField/Nebula | App `freezeAmbient={false}` làm ambient thời gian tiếp tục trong finale; lab R2.4 mặc định freeze | Đảm bảo pause/deterministic nền trong finale; không áp phép so pixel lab vào production khi còn uTime/uApproach theo delta. |
| Shared Works/BlackHole/finale/camera | Renderer R2.4 sẵn và dùng chung | Giữ geometry, authored phase functions, projected collision/BH center, HDR target/mask, quality. Không cần component gas/renderer mới. |

## Toàn bộ legacy contactProgress caller

`rg -n "contactProgress|setContactProgress|veil" src` trước sửa cho:

- `src/components/sections/Contact.jsx`: lấy setter, reset0 lúc mount/rebuild và cleanup; tween object `phase.progress` được `onUpdate` ghi vào store. Trigger `contact-approach`, top-bottom→top15%, scrub.45.
- `src/stores/useScrollStore.js`: scalar0 và finite/clamped setter.
- `src/3d/components/CameraRig.jsx`: **nhánh non-story** trộn global progress và contactProgress rồi ép z−2×contact. Nhánh story đã return trước đó.
- `src/3d/components/BlackHole.jsx`: nhánh non-story diskIntensity1+.45×contact; nhánh story intensity1+.35×authored.hole, shear3×collapse đã đúng finale.
- Không thấy caller `veil` trong src hiện tại. Không có veil để gỡ; không khôi phục veil.

Vì App đã story=true, legacy z/intensity hiện không tác động tuyến production, nhưng writer Contact vẫn sống và tạo state/timeline song song. Gỡ bốn caller theo phạm vi này sẽ làm non-story lab dùng đường camera cơ bản+intensity1. Cần smoke legacy lab nếu xóa nhánh đó. Không sửa body ray tracing hoặc thêm camera owner.

## Phase và route

`worksOrbit` identity phải giữ: phase/origin/velocity/latched/visited/captures/resumePending. `setStoryPosition` gọi `syncWorksOrbit` đồng bộ trước publish; WorksConstellations là writer idle duy nhất. Đầu finale p>0 hoặc Contact latch origin=phase; ngược trong finale kể cả p0 giữ origin; chỉ canonical Works mới release và skip frame idle đầu.

R6.2 đã lưu toàn bộ orbit vào history.snapshot; restore Object.assign vào object hiện có, selected thì velocity0. Restore pose suy từ chapter/p/aspect thay vì viết camera thêm. Finale range mới tự được hook đo theo DOM; không thay saved y thành phần trăm toàn trang. Cùng viewport quay lại Works phải giữ y/p/phase/selection/focus.

Deep Contact fresh có default phase/origin0, seed20261007. Không đòi callback onLeave Works. Nav Contact khi đã idle Works phải capture phase hiện tại một lần; fresh Contact và reload Contact phải xác định với seed mặc định.

## Các rủi ro boundary dễ bị test bỏ sót

1. **Hover-only preview**: Work khi !active clear Hover/Focus, khiến project biến mất ngay tại boundary. Selection pin không bị nên chỉ thử click EDURA sẽ bỏ sót. Snapshot phần trình bày hoặc giữ owner tới hết retract; DOM vẫn phải inert khi rời Works. Star strength selected hiện dùng cùng owner nên cũng có khả năng đổi 1.2/.35→1 ngay boundary.
2. **Works y reset**: .00 finale phải đặt frame đọc đúng vị trí ngay trước đó, sau mới label1→0/y−16. Nếu chỉ thêm opacity thì root đã rơi về top Works ngoài viewport.
3. **Contact vẫn ngoài viewport**: nếu sau range225vh, tại finale.88 Contact top còn cách viewporttop .27vh. Cần framing/transform wrapper theo progress chung để Contact có pose hợp lý khi opacity bắt đầu; không chỉ fade ở một node chưa tới màn hình.
4. **StarField temporal drift**: uTime tick và uApproach damping theo delta; Nebula uTime tick. Lab R2.4 pixel-identical không tự chứng minh production stop/reverse. Freeze nền phù hợp hoặc state deterministic trong finale; vẫn giữ ambient meteor ở vùng yên.
5. **Focus**: inert/aria-hidden và keyboard target phải đồng bộ visibility; không giật focus khi wheel vào finale. Return reader phải focus EDURA chỉ sau hook seek/scene sẵn theo R6.2; đừng sửa restoration vào task này khi chưa có bằng chứng lỗi.
6. **Contact DOM cũ** còn panel/terminal/equalizer và chữ hardcode; phần thay nội dung/layout được giao R7.2. R7.1 cần visibility/camera endpoint đủ bàn giao, không tự tuyên bố Contact redesign đã xong.

## Invariants kiểm chứng cụ thể

- Measured finale DOM end−start / viewportHeight ∈[2,2.5], chuẩn2.25; Works read range riêng160vh. Không bắt đầu compression khi p Works≤1.
- phase/order/numeric state tại p0,.12,.34,.42,.44,.47,.53,.55,.58,.70,.88,.96,1 khớp tới/lùi. Compression .44−.34=.10; cùng p+origin trả cùng camera/star/trail/gas/disk/uniform/DOMopacity.
- `finaleFigure(0)` khớp Works basis tại origin; tại.44 mọi sao main/supporting world cùng BLACK_HOLE_CENTER=[0,0,−200]. Finale1=Contact về pose/intensity/shear/mask.
- Hover-only→wheel finale, selection pin→wheel, EDURA→reader→Back→finale đều giữ origin; đảo wheel không tăng captures. Canonical Works cho idle chạy lại, selection còn giữ thì đứng yên.
- Direct `/#transmission` fresh/reload, Nav Contact, Return reader/#work không cần replay portal/meteor, không NaN observer; ray observer r>1.
- Stop giữa compression và burst ít nhất500ms: story data không đổi; production background không drift theo thời gian trong finale. Ambient pool invisible/cleared; bình yên sau portal vẫn spawn.
- DOM Works inert khi finale bắt đầu, nhãn/preview rút trước orbit shrink; Contact visible/readable khi contact blend>0, khung chữ không haze/whiteout. Reduced giữ cảnh tĩnh và CTA thật đủ.
- Một Canvas/camera writer/HDR render mỗi frame; reader0Canvas. Resize tiers, locale, motion3cycles không tăng targets/geometry/materials/listeners.
- Dùng lại `outputs/redesign/r2.4/check-finale.mjs` cho geometry/collision/clamp/reverse/gas/tier; **checker cũ ghi file kết quả trong r2.4**, nên lưu stdout/bản chạy hiện hành ở r7.1 và không gọi bằng chứng cũ là mới. Thêm assert nhỏ cho production anchors/route hover boundary nếu cần.

Chưa chạy Browser/build/lint ở audit con này; root thực hiện sau sửa. Không thay source hoặc dependencies.
