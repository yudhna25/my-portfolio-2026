# R4.1 → R4.2 / R4.3 — SymbolStars

08/10/2026. Renderer chung trong Canvas hiện hữu; lab ở `/3d-lab.html?story=1&chapter=skills&p=.25` hoặc `chapter=education`. Chưa đổi layout/selection production Skills hoặc Education.

## API consumer

```jsx
<SymbolStars anchor={stageRef} target={activeId} active={isSectionActive} frozen={reducedMotion} />
```

- `anchor`: ref tới một DOM window có kích thước thật, dưới `#smooth-content`. `useSectionAnchor` cache bounds qua ResizeObserver/ScrollTrigger refresh; đọc tọa độ đang hiển thị từ `ScrollSmoother.scrollTop()` khi `smooth()>0`, hoặc `window.scrollY` khi native/touch/reduced. Không suy pixel từ progress đã giữ: focus native có thể cuộn DOM khi story pose còn manual. Đây chỉ là reader neo, không producer/writer mới; CameraRig tiếp tục đọc store. Root billboard theo camera và fit 80% chiều nhỏ hơn của window; không layout read/allocation trong useFrame.
- `target`: một ID hợp lệ hoặc `null`; consumer sở hữu hover/focus/touch selection và Escape. Primitive không tạo store mới. `active=false`, window ngoài viewport, hoặc unmount trả pool/dọn lớp hiển thị. Caller giữ DOM text/controls kể cả WebGL fallback.
- `frozen`: consumer truyền `useReducedMotion()`. Chọn/đổi/bỏ chọn hiện trạng thái cuối ngay, không orbit. GalaxyScene sở hữu hidden → frameloop never; không catch-up thời gian đã ẩn.
- Chỉ một target trong một instance. Mount một renderer cho consumer đang hoạt động; không dựng thêm Canvas/controller hay copy renderer vào section. Lab dùng một instance chuyển anchor giữa hai consumer.

## Mapping

| Target | Logo / geometry | Điểm / cạnh |
|---|---|---|
| figma | Figma mono-line, aspect256/369 | 192 /247 |
| photoshop | Adobe Photoshop mono derivative | 192 /254 |
| illustrator | Adobe Illustrator mono derivative | 192 /244 |
| after-effects | Adobe After Effects mono derivative | 192 /248 |
| premiere-pro | Adobe Premiere Pro mono derivative | 192 /250 |
| davinci-resolve | Blackmagic DaVinci Resolve mono derivative | 192 /218 |
| ai | ChatGPT + Claude + Google Antigravity | 64×3 /208 |
| saigonUniversity | Cir / Circinus | 3 hình +11 context /2 |
| greenAcademy | Tel / Telescopium | 2 hình +6 context /1 |
| arenaMultimedia | Pic / Pictor | 3 hình +12 context /2 |

`src/3d/data/symbolTargets.json` giữ source path/bytes/SHA/source URL/monoType cho cả9asset. `SymbolStars` import chính các file R0.2 qua Vite URL glob; không duplicate/rasterize sản phẩm lúc render. Figma/ChatGPT/Antigravity là white variants do hãng cung cấp; Adobe/Claude/Resolve là mono derivatives từ native official, giữ nhận diện. Logo hoàn chỉnh luôn là texture asset thật, giữ aspect; các điểm chỉ gợi cấu trúc. Không dùng `/icons/pr.png` làm Premiere, không dùng Gemini/GPT tự vẽ.

Education là subset exact từ R0.2: gnomonic north+Y/west+X/z0, cùng scale hai trục; không mirror/stretch/rotate riêng. HIP/photometry J1991.25 và Stellarium Modern pinned commit/CC BY-SA4.0/projection/attribution trong data. Context không thêm cạnh. Liên hệ trường/ngành là diễn giải thiết kế, không định nghĩa thiên văn.

## Trình tự / interruption

Pool192 tất cả tiers, chỉ phần sân khấu; StarField24k/12k/1.5k giữ nguyên. `base`, `positions`, `goal`, `weights`, `sizes` là5typed arrays giữ identity trong suốt instance. Base là patch equal-solid-angle xác định; không Math.random/per-frame allocation/setState.

- Chọn: write goal một lần, giữ nguyên positions đang hiển thị. Formation0→0.45s; link0.55→1s (alpha tối đa0.12); asset1.05→1.5s. Morph exponential9/s, cap delta0.05; sai số<0.0001 snap exact goal. Link đi theo cùng positions.
- Swap: old asset/link bị ẩn, points tiếp tục từ hiện tại tới goal mới. Không tween async/stale closure, không nhiều logo cũ chồng nhau.
- Bỏ chọn: ẩn asset/link, goal=base, points trở về rồi snap bằng chính Float32Array gốc (error0). Offsection/offscreen reset exact ngay để dừng GPU uploads; không để return chạy ngầm.
- AI: chỉ sau hội tụ và1.5s mới orbit0.12rad/s, dùng phần delta thực vượt mốc. Ba tâm lệch120°, mỗi mặt giữ quaternion identity trong frame billboard. Quỹ đạo là dàn cảnh nhận diện, không chuyển động thiên văn/physics. Reduced giữ pha hiện có; fresh instance phase0.

Geometry stars/links/plane do renderer dispose;9TextureLoader textures thuộc effect và dispose cả request hoàn tất muộn;11materials do R3F sở hữu. Anchor observer/listeners cleanup qua useGSAP. Quality/visibility/fallback/camera vẫn do GalaxyScene/R2.1; không GSAP tween thêm vào primitive.

## Bàn giao nội dung/layout

R4.2 dùng bảy target trên, split Premiere/Resolve và AI group đúng mapping R3.3/R0.2; legacy `src/data/skills.js` và production UI chưa đổi. Kết nối tới năng lực (tối đa2–3 nhánh) và bố cục ba vùng thuộc R4.2, không dựng framework nối nhánh trong renderer.

R4.3 dùng ba ID trường và source geometry trên; đặt anchor theo bản đồ ba nhánh bất đối xứng. Renderer nhận window nào thì fit vào window đó, không tự định bố cục hoặc biến Telescopium2sao thành hình minh họa nhiều node.

Đo lại viewport/phần nền BH khi tích hợp section thật. Camera ABOUT mới R3.3 `[2,5,-154,-36,-16,-200]` giữ nguyên; không khôi phục pose cũ từ báo cáo R2.1. R2.3/R2.4 Works/origin/finale vẫn cùng renderer/controller hiện có.

## Kiểm tra

`node outputs/redesign/r4.1/check-morph.mjs`; `node outputs/redesign/r4.1/verify-browser.mjs`; `node outputs/redesign/r4.1/verify-touch.mjs`; `node outputs/redesign/r4.1/verify-visible-stage.mjs`; `node outputs/redesign/r4.1/build-lab.mjs`; `npm run build`; `npm run lint`. Bằng chứng và giới hạn trong `verification.md`.
