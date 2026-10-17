# Handoff — V9 spacetime revision

**Đã triển khai, chờ người dùng duyệt G3.** [Review](review.html) · [Kiểm chứng](verification.md). G2 giữ trạng thái đã duyệt. Chưa V10/release/deploy.

## Đã thay đổi

1. Giữ nhịp .00–.44; .44–.68 sóng biến dạng và sao plasma hiện rõ, .68–.96 co sụp/giãn xoắn quanh cùng tâm, .96–1 BH lớn ổn định và Contact vào. Giữ 400vh và các mốc gốc; người dùng mới nhất thay nội dung thị giác sau .44.
2. Shader formation dùng chung cho preloader và finale; StarField cong/radial stretch → tangential shear → ổn định. Preloader vẫn cùng BH HDR lùi vào final-O, không dùng ảnh thay thế.
3. Works orbit ellipse chung, tốc độ đích .075 rad/s (~84s/vòng), đứng tư thế figure; hover/focus/selection pause như trước. Snapshot phase hiện tại nối vào đoạn scroll tăng tốc.
4. Bỏ .hero-year-base stroke ở cả normal/reduced; giữ nodes để lấy mẫu portal, sao năm và runner 6.5–7.9s cũ.

## Ownership và contract

| File | Trách nhiệm |
|---|---|
| src/3d/utils/finale.js | Thêm formation clock và điều chỉnh hole birth .78–.96; producer/store không đổi |
| src/3d/shaders/formation.js | Shared plasma + screen-space spacetimeWarp; không state engine |
| src/3d/components/StarField.jsx | Consume opening/formation clock, projected BH center, shader uniforms; refs tái sử dụng |
| src/3d/GalaxyScene.jsx | Truyền reduced riêng với ambient frozen cho StarField |
| src/3d/components/BlackHole.jsx | Nối finale clock vào uOpening sẵn có; cùng center/ray target |
| src/3d/shaders/blackHole.js | Birth coverage nằm trong ray shader; copy không gate lần hai khiến sao mất, gas giảm để giữ plasma rõ |
| src/3d/utils/worksOrbit.js | Responsive common ellipse + offset figure, không đổi latch/snapshot/selection |
| src/3d/components/WorksConstellations.jsx | Convert orbit basis pixel → world, hit regions theo figure thật |
| src/styles/hero.css | Stroke nền none; sao/runner giữ |

Agent tích hợp giữ các file trên. Không còn patch worker chờ áp dụng. App/Contact/camera/path/producer/stores/Lab/locale/assets/package giữ hash baseline V9.

## Review cần người dùng xem

- Độ mạnh và nhịp sóng biến dạng → sao lớn → co sụp, cùng cảnh khi cuộn ngược.
- Preloader nối về O có tự nhiên; 2026 đúng lớp sao + vệt chạy.
- Quỹ đạo Works chậm trước khi tăng tốc, hover/selection vẫn dễ dùng.
- BH lớn và chữ Contact cùng tồn tại rõ ràng.

Nếu G3 được duyệt, mới mở V10: ưu tiên profile plasma/ray shader trên iGPU và thiết bị thật, giữ độ nét. Bản hiện tại đo iGPU ~33fps ở sao lớn, ~17fps ở co sụp, ~16fps ở Contact; chưa nghiệm thu performance. Không coi kiểm kỹ thuật là duyệt visual.

## Trạng thái bàn giao cuối

Build/lint pass (2 lint warnings cũ); 2102 analytic + 786 Browser + 23 lifecycle checks, 4 fallback, 2 opening lifecycle và 3 cấu hình HDR pass. Framebuffer .62/.80/.86 khi giữ/cuộn ngược trùng khớp. Gallery 6 ảnh/48 checkpoint/4 clip đã kiểm decode, play và seek; source/dist không đổi so bản build. Không còn tác vụ triển khai nào trong vòng chỉnh này; bước tiếp theo là người dùng duyệt hoặc phản hồi G3.
