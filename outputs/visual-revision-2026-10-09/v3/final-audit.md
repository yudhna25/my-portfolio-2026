# V3 — audit source và self-check cuối

09/10/2026. Audit tĩnh App, About, PortalHeading/Hero, Nav, Cursor, producer, store/fallback, portal/camera và wiring BlackHole hiện tại. Không sửa source trong lần audit cuối.

## Kết quả

`node outputs/visual-revision-2026-10-09/v3/check-portal.mjs` **PASS**: 4.000 progress samples, ba aspect390/844–1440/900–1920/1080, 100.308 assertions. Observer tối thiểu **8.182909 scene units** tính từ BH center, luôn ngoài horizon; look target hữu hạn/khác observer. Đây là kiểm helper camera, không phải geodesic GPU hoặc đo FPS.

- Phase scalars đều hữu hạn và trong range; growth hữu hạn≥1.
- Camera/phase/intake forward và reverse bằng nhau trên cùng input; output reuse không để state từ lượt trước quyết định cảnh.
- Kiểm scalar/camera continuity sát16 ranh pha với epsilon1e−8; portal p0 nối Hero, p1 nối About (tolerance pose1e−10 vì floating point).
- Mini/full mapping switch p=.47 nằm trong core: visibility, Hero text, controls, About, dust bằng0 và backdrop hidden tại .44/.46/.47/.48/.50.
- Reduced portal pose luôn là About endpoint, progress helper frozen trả1; shared chapter400vh và production static short class tồn tại.
- NaN/Infinity/out-of-range input vẫn trả phase/camera hữu hạn.

`check-portal-results.json` chứa hashes helper đã kiểm. Checker lần đầu dùng exact equality ở About boundary nên báo x2.0000000000000004 khác2; sửa oracle dùng tolerance1e−10 ở boundary, giữ reverse exact equality. Đây không phải lỗi source.

## Findings được root sửa trước source freeze

1. Cursor quickTo dot/ring/shape/opacity còn chạy ngắn sau bắt đầu intake: root thêm completion/pause trên transition đầu, không đổi portal writer.
2. Final glyph O luôn transparent ngay cả fallback không BH: root chỉ để transparent khi WebGL có BH; fallback hiển thị O thường, slot cap-height vẫn đo như cũ.
3. Restore chờ Canvas120frames khi fallback: root thêm sceneFallback vào readiness guard, không đưa Direct hash/EDURA Back qua Hero.

Đã đọc lại các guard này trong source sau sửa. Không phát hiện failure mới có bằng chứng trực tiếp trong phần audit này. Không coi audit tĩnh là Browser PASS; root/QA sở hữu chứng cứ native scroll, focus/menu/media/route/resize, shader render và resource.

Giới hạn: không chạy Browser/GPU/FPS/thiết bị thật trong audit cuối. Backdrop có deformation screen-space cinematic, không ray-trace vật lý từng sao; geometry star random lúc mount vẫn là builder cũ, không đổi giữa forward/reverse trong một mount.
