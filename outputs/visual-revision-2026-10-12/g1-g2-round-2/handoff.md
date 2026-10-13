# Bàn giao G1/G2 lượt hai

Plan Q1 A/Q2 A/Q3 A/Q4 B/Q5 A đã được người dùng duyệt; code đã triển khai. Review [gallery](review.html) và [verification](verification.md). G1/G2 visual còn chờ; V9/G3 chưa chạy.

## Ownership/wiring

| Owner | Property và file |
|---|---|
| Preloader | Model p 0..1, openingPose, active/reveal/shadow/center; src/components/Preloader.jsx + src/3d/utils/opening.js. GSAP writer duy nhất của presentation, chờ scene/font, hidden pause và cleanup. |
| App | Một opening ref truyền vào Hero và GalaxyScene; không là global story engine. src/App.jsx. |
| BlackHole | Writer uniform hiện có đọc opening ref khi active, override center/scale/radius/visibility trong cùng HDR pass; GalaxyScene/BlackHoleSystem chỉ nối prop. Không đổi shader, mask, target hoặc quality. |
| Hero | PortalHeading đọc reveal ref, dùng O DOM anchor cũ; typography overlap/contour/name/wrapping. Hero.jsx, PortalHeading.jsx, hero.css. 3–3.8s/lap, base outline luôn có trong full motion; giữ glitch và name decode. |
| Intake | portal.js quintic ramp và portalTrails.js ribbon source index/width/opacity. Giữ pool 6/8, clone inert/aria-hidden, About thật, camera/store producer cũ. |
| Meteor | Experience đo layout; storyMeteor helper C2 tính head/trail/emphasis; StoryMeteor shader/geometry writer hiện có. Giữ core, thu halo, bỏ flare/DOM radial wake, thêm indexed spark pool 24/12 dùng chung ribbon buffers. |

Files cũ thay đổi:

- `src/3d/components/BlackHole.jsx`
- `src/3d/components/BlackHoleSystem.jsx`
- `src/3d/components/StoryMeteor.jsx`
- `src/3d/GalaxyScene.jsx`
- `src/3d/utils/portal.js`
- `src/3d/utils/storyMeteor.js`
- `src/App.jsx`
- `src/components/effects/PortalHeading.jsx`
- `src/components/effects/portalTrails.js`
- `src/components/Hero.jsx`
- `src/components/Preloader.jsx`
- `src/components/sections/Experience.jsx`
- `src/styles/hero.css`
- `src/styles/opening.css`

Thêm src/3d/utils/opening.js. Assets/copy/config/package và các section ngoài phạm vi giữ hash (104 baseline files). Chưa commit/push; giữ các thay đổi docs/report có sẵn đầu phiên, không reset branch.

## Kiểm và bước tiếp theo

Build/lint qua; 527 browser checks + 49 supplemental, matrix Hero Vi/En, 7 fault cases, opening lifecycle, stop/reverse/glitch/pixel/resource checks. QA portable ở [qa/README.md](qa/README.md). Production review server localhost:5215; Lab dùng dev localhost:5214. Server phải chạy khi mở link bản chạy.

Giới hạn cần xét khi duyệt: intake khoảng 33 FPS trên Intel UHD 630/DPR1; các cảnh khác khoảng 60. Chưa pass điện thoại/OS thật/HTTPS. Gia tốc theo progress không luôn thấp hơn bản cũ dù speed variance giảm và nối C2; xem chuyển động thật, không nghiệm thu chỉ từ PNG.

Người dùng review rồi xác nhận G1/G2 hoặc nêu checkpoint cần sửa. Sau gate mới làm V9/performance và QA thiết bị; không tự triển khai nhóm này. Cần retest/hash lại nếu source thay đổi sau build-source.json.
