# Task 3.6 — ScrollTrigger motion, 06/10/2026

Hoàn tất 8 section, giữ nguyên layout classes, nội dung, App, stores, camera/shaders và dependencies.

| Section | Kết quả |
|:---|:---|
| Hero | Entrance y40, expo.out, tween major 0.8–1s; giữ mốc 1.5/2/2.5s, SplitText char stagger 0.03 theo 7.1 và ScrambleText 1.2s. Giữ exit scrub; chevron tách khỏi intro, pause ngoài viewport. |
| About | SplitText lines, caption/labels/bio/quote/tools/pills y40, duration1, stagger0.1, power3.out; giữ avatar clip và parallax scrub1. Tool img/span nhận reveal, li nhận magnetic. |
| Skills | Heading và 3 nhóm fade-up y40/duration1/stagger0.1/power3.out; orbital slot và pause control giữ nguyên. |
| Education | Heading/content fade-up chuẩn, giữ DrawSVG scrub0.35 và active nodes; reduced-motion không tạo node/draw/reveal trigger. |
| Experience | Label/heading/cards y40/duration1/stagger0.1/power3.out; giữ hướng x±40 xen kẽ theo 7.6. |
| Works | Heading/filter entrance chuẩn, giữ image clip + text scrub0.35; text y40/duration0.9/stagger0.1/power3.out. Hoàn tất Flip đang chạy trước rebuild locale/motion để không giữ card absolute. |
| Playground | Heading + 8 card y40/duration1/stagger0.1/power3.out, giữ bento/demo slots. |
| Contact | Scrub0.45 đồng bộ phase/camera/disk và text; headline expo.out, copy/CTA parent/social parent power3.out, y40/stagger0.1, tween 0.8–1s. Tổng timeline1.4s gồm stagger, phase tuyến tính phủ đúng1.4s; giữ công thức camera/intensity task3.2 và glow pulse sẵn có. |

Entrance độc lập chạy một lần. Khi locale/motion rebuild, target đã qua ngưỡng reveal giữ trạng thái hiện; parallax/3D/Works/Contact scrub vẫn có thể đi ngược theo scroll. Không thêm pin, effect, animation thư viện hoặc abstraction mới.

Mọi tween/trigger nằm trong useGSAP scoped context với revertOnUpdate; callback batch, fonts-ready và SplitText autoSplit dùng contextSafe. Reduced-motion bỏ section animation, giữ nội dung hiện và SVG hoàn chỉnh. Các section dùng ScrollTrigger.refresh(true) có sẵn để gộp refresh, theo [GSAP safe refresh](https://gsap.com/docs/v3/Plugins/ScrollTrigger/static.refresh/).

## Verify

Chạy từ root dự án:

```bash
npm run build
npm run lint
node outputs/task-3.6/check.mjs --browser
```

- Build pass, 4.45s. Lint 0 errors; 2 warnings SplashCursor cũ.
- Check static 8/8: layout className giữ nguyên, useGSAP/revertOnUpdate/reduced-motion và motion values có đủ.
- Edge Headless, App thật/dev :5173: 15 pose, cả 8 section có trigger; kiểm reveal đầu→cuối→ngược, 3 lượt nhảy nhanh cuối→đầu, Work filter + đổi Vi→En giữa Flip, viewport320/768/1440/1920.
- 3 vòng live reduced-motion: 0 trigger trong 8 section, nội dung hiện, smoother tắt. Bật lại: một smoother/Canvas, đúng1 contact-approach, count trigger còn lại13 ổn định qua 3 vòng. Reload fresh reduced-motion cũng pass.
- FPS đo từ R3F subscriber khi native wheel, 1440×1100/DPR1, high24k, RTX4060: About165.1, Skills165.3, Contact165.1 (>120). Đây là kết quả máy dev, không suy rộng sang thiết bị khác.
- 0 App console errors; warning THREE.Clock cũ. Build còn cảnh báo chunk >500KB cũ. Reduced-motion mô phỏng qua browser; chưa toggle OS trực tiếp.
- Browser plugin IAB: Hero intro, click Nav→About, native scroll6pages→Works; kiểm hình sau khi scroll ổn định. Ảnh các pose và số đo đầy đủ: [browser-results.json](browser-results.json).

| Bằng chứng | Link |
|:---|:---|
| About desktop/mobile | [1440](about-1440.png), [320](about-320.png), [768](about-768.png), [1920](about-1920.png) |
| Skills/Education/Experience | [Skills](skills-1440.png), [Education](education-1440.png), [Experience](experience-1440.png) |
| Works/Playground | [Works](work-1440.png), [Playground](playground-1440.png) |
| Contact | [1440](transmission-1440.png), [320](contact-320.png), [768](contact-768.png), [1920](contact-1920.png), [reduced-motion](contact-reduced.png) |

Skills áp dụng: gsap-scrolltrigger, gsap-timeline, gsap-react, gsap-performance, gsap-utils; ecc:motion-patterns cho once-reveal/stagger/accessibility. Giữ GSAP theo yêu cầu dự án, không thêm Motion/AnimatePresence.
