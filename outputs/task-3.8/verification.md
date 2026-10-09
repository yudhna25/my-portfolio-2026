# Task 3.8 — Image clip reveal

Ngày: 06/10/2026. Sửa phần clip animation trong About.jsx và Work.jsx; tái dùng `.reveal-clip` trong index.css, không sửa helper CSS hoặc thêm dependency.

- Avatar + cả3 project: `inset(12% 8%)` → `inset(0% 0%)`, `scrub:0.8`, `ease:none`; start `top92%`, end `top45%`. Cuộn ngược đưa crop trở lại theo progress.
- Avatar bỏ compound entrance scale/y/opacity của wrapper, thay bằng clip scrub đúng task. Parallax của ảnh con và text animation vẫn giữ.
- Works clip có tween/trigger riêng để giữ text scrub0.35, typography và filter Flip. Trigger chỉ tạo cho card đang hiện; filter/locale/motion rebuild dùng useGSAP revertOnUpdate.
- Reduced-motion bỏ tween/trigger; `.reveal-clip` trả crop0 ngay. Avatar vẫn4:5, project16:10; object-contain/object-cover giữ nguyên, không tween chiều rộng/chiều cao/scale.

## Verify

```bash
npm run build
npx eslint src/components/About.jsx src/components/Work.jsx
node outputs/task-3.8/check.mjs --browser
```

Build pass (lượt cuối5.42s), scoped lint pass. Check Browser Edge/dev5173: **29 pose**, avatar/cả3project progress0/0.5/1/0, crop đúng12/8 →6/4 →0/0; viewport320/768/1440/1920; image ratio giữ4:5/16:10, wrapper không transform.

Filter Graphic chỉ giữ1 image trigger Works, All trả lại3. Ba vòng live reduced-motion:0 image trigger, không smoother, crop0; bật lại đúng4 image trigger (avatar+3project), một Canvas. Reload fresh reduced-motion cũng pass. **0 App console error**; warning THREE.Clock cũ, build chunk>500KB cũ. Reduced-motion được mô phỏng qua Browser; OS chưa toggle trực tiếp.

Browser plugin IAB: click Nav→About, kiểm avatar sau settle và console sạch. Ảnh bằng chứng:

- Avatar: [crop giữa](about-image-reveal-0.5.png), [hiện đủ](about-image-reveal-1.png).
- EDURA: [crop giữa](works-image-reveal-project-01-0.5.png), [hiện đủ](works-image-reveal-project-01-1.png).
- Dữ liệu đầy đủ: [browser-results.json](browser-results.json).

## Thay đổi đồng thời

Trong lượt kiểm thử, các phiên task3.9 hover và task3.10 parallax sửa chung Work/About (hover-card/data-magnetic, avatar data-speed/data-parallax). Phiên3.8 giữ các thay đổi đó, không hoàn tác. Static check giữ nguyên classes/layout About và image wrapper Works, cho phép thay đổi hover bên ngoài thuộc task3.9. Browser/build cuối chạy trên bản tích hợp mới nhất. Baseline nguồn trước3.8: [source-baseline.json](source-baseline.json).

Skills: gsap-scrolltrigger, gsap-core, ui-styling. Không thêm effect, layer, texture hoặc layout mới.
