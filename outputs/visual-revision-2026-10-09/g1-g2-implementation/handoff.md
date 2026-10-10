# G1/G2 refinement handoff — chờ visual approval

P1–P4 đã triển khai và kiểm local. [Verification](verification.md), [gallery](review.html), [plan](../../../docs/ke-hoach-tinh-chinh-g1-g2-2026-10-10.md). **Không mở V9/G3 trước khi người dùng duyệt G1/G2 mới.**

- App chỉ đổi Hero active dưới opening; loading store và caller giữ API. Preloader dùng DOM O thật + data-scene-ready sau3frames, font loaded/fallback/watchdog; cold1.8s/warm-ready0.9s, hidden pause, reduced return null và complete ngay. Font/resize đồng bộ target trên draw, GSAP contextSafe/timers/listeners cleanup.
- PortalHeading/hero.css giữ source text/i18n/O anchor, year hierarchy1.30×, no static outline normal, lap10–14s/tail35%; cache PNG từ sao gốc trong detached2D canvas rồi hiển thị SVG image, không Canvas scene mới. Last glyph6↔7 cập nhật cả silhouette/star image; source snapshots lấy đúng cached image và contour.
- portalIntake/portalIntakeSample giữ signature/phases; sampled analytic funnel1.25 turns, per-source arrival/alpha giảm lump tại join. portalTrails đo sources một lần/resize/font, pool6/8, one common Hero spiral, Nav/Cursor branches, radius alpha-mask bảo vệ BH. Original visuals suppress tới eject, native controls vẫn inert đúng gate. Không store/producer/locale/ref mới.
- StoryMeteor/Experience giữ onLayout/layoutRef, buffers128 và named head/trail objects; q[-.9,2], measured C2S path/pre-entry42vw/continuous departure, scalar flare/wake. Resource budget2geometry/3material. Không copy renderer vào Lab; camera/BH/ambient nguyên hash.
- V4/Skills/Education/Works/EDURA/store/camera producer:56protected files nguyên hash. Native Back restore6cycles và cleanup6cycles đã kiểm. Không sửa finale, Contact/Footer hay art mapping.

Diagnostic selectors: [data-preloader], data-opening-duration/data-opening-ready; [data-galaxy-scene][data-scene-ready]; [data-portal-trails] source/copy/progress, .portal-trail-copy/.portal-trail-common, .hero-year-tail, named story-meteor-head/trail. Không public API mới; không đọc diagnostic attributes để điều khiển production.

Reproduce: npm run build; npm run lint. QA_BASE_URL=http://127.0.0.1:5212; qa/build-production.mjs, verify-opening-fallback.mjs, verify-browser.mjs, verify-extras.mjs, measure-performance.mjs, intake/capture-final.mjs, comet/measure-pixels.mjs (QA_CALIBRATION_STAGE=final frozen source), capture-clips.mjs, encode-review.mjs, check-final.mjs, write-review.mjs, check-gallery.mjs. Browser/FPS chạy tuần tự để tránh hidden-tab pause ảnh hưởng observation; keep measured source frozen.

Giới hạn: DOM afterimages/tapered SVG ribbons là biểu diễn đã chọn, chưa pixel-deformation shader; human visual pending. FPS/frame pacing là sample ngắn trên máy dev. Touch/hidden/reduced giả lập; chưa phone/OS thật/Safari/Firefox/HTTPS. Không deploy/push.
