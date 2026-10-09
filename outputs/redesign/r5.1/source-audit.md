# R5.1 — Source, copy và handoff audit

08/10/2026. Read-only audit trước tích hợp. Chỉ ghi báo cáo này; không sửa src/public/locales/AGENTS. Đã đọc kế hoạch mục 7–9/12–13, quy ước chung, R1.1 Experience/Works, R2.3 contract, R4.3 handoff, Experience/data/locale/camera/progress và mọi caller meteor.

## Nội dung phải giữ

| ID | Công ty / vai trò | Niên hạn Vi / En | Loại |
|---|---|---|---|
| hosanaMedia | HOSANA MEDIA / Multimedia Executive | Sep 2024 – Feb 2025 | Full-time |
| upwork | UPWORK / Multimedia Creator | 2024 – nay / 2024 – Present | Freelance |
| designveloper | DESIGNVELOPER / UX/UI Designer Intern | Sep 2025 – Dec 2025 | Internship |

`src/data.js:experience` giữ thứ tự HOSANA→UPWORK→DESIGNVELOPER; text thực từ `experience.positions.*`. Đã so toàn namespace Experience với `outputs/redesign/r1.1/content.json`: **Vi=True, En=True**, không copy drift. Giữ description/type/period, không thêm metric hoặc suy luận ba lần nghỉ/chuyển việc. UPWORK kéo dài từ 2024 nên chồng cả HOSANA và internship; đường bay chỉ dẫn thứ tự đọc.

## Keep / remove

- Giữ `#experience`, `experience-heading`, H3 company, role, period, type, description, i18n, responsive, reduced/full DOM và cleanup. Nội dung không chờ meteor mới đọc được.
- Bỏ mission card/border/glass/hover-card `article[data-hover-card]`; badge không cần giữ hình HUD. Loại entrance opacity0 và card x/y batch khi thay bố cục; không tạo timeline vector nối ba card. Heading parallax `data-speed=0.3` chỉ giữ nếu không chồng transform với nhấn mốc.
- Một curve xác định theo progress cho head/trail; không dùng random event/pool ambient làm meteor dẫn chuyện. DOM nhấn company/role dùng transform/opacity và progress chung, không setState hoặc tween mới mỗi frame.
- Giữ sao băng nền ở vùng yên sau portal. Work reticle/filter/preview và Contact terminal chờ R5.2/R7.2; R5.1 chỉ gỡ các trigger meteor trang trí cũ, giữ audio/copy/mailto/link actions.

## Meteor callers thực tế

Đã grep toàn `src` cho `ShootingStars`, `trigger-shooting-star`, `triggerReactiveMeteor`, `triggerShootingStar`:

| Path | Trách nhiệm / caller |
|---|---|
| `src/3d/GalaxyScene.jsx` | Một mount ShootingStars khi `!hidden && !ambientFrozen`; App truyền `story freezeAmbient={false}`, lab story mặc định đóng băng ambient để đối chiếu. |
| `src/3d/components/ShootingStars.jsx` | Một listener window `trigger-shooting-star`, cleanup khi frozen/unmount; chỉ nhận khi points root visible. Frame đọc chapter/p và advance pool theo delta. |
| `src/3d/utils/shootingStars.js` | Dispatcher API; reactive slots 3..5, background slots 0..2, tổng 6×24 samples. Background 2–3 vệt mỗi 4–7 giây. |
| `src/components/Work.jsx` | Import API; một call trong `changeFilter()` khi đổi filter. |
| `src/components/sections/Contact.jsx` | Import API; một call copy trong `handleTransmit()`, một call email anchor onclick. |

Không có caller event khác. Xóa đúng ba callsite/import Work+Contact theo scope R5.1; grep lại rồi có thể dọn listener/API reactive đã hết caller. Không đổi Sound, clipboard hoặc mailto. Background random vẫn giữ nhịp cũ.

Gating hiện tại đã phù hợp: opacity0 ở Hero/portal/Experience/finale; About ramp p0..0.1; Education fade p0.9..1; Skills/Works/Contact opacity1. Opacity0 clear pool và return; khi fading chỉ advance sao cũ, `emitting=false`. Hidden Canvas `never` và ambient unmount; reduced/freezeAmbient không mount. Nếu giữ listener, cần tránh nhận event dựa vào root.visible của frame cũ ngay sau đổi chapter.

Meteor dẫn chuyện phải **độc lập mount condition ambientFrozen**: lab cần đóng băng ambient nhưng vẫn đối chiếu pose story tại cùng progress. Không tích lũy thời gian hidden; dừng progress giữ pose. Reduced bỏ chuyển động, vẫn đủ nội dung và pose tĩnh hợp lý.

## Camera và Works boundary

- CameraRig là writer duy nhất, story pose direct ở priority−1, FOV responsive. `useScrollProgress` là producer theo mốc DOM và visible Smoother; giữ fix R4.3 bảo toàn chapter/p khi reflow. Không thêm ticker đo scroll/camera trong section.
- **EDUCATION mới** `[2,5,-110,-64,-42,-200]`; Experience p0 phải xuất phát chính endpoint này. Không phục hồi candidate R1.1 cũ. R4.3 đã đo observer radius90.16, BH góc phải trên.
- Camera hiện Experience0..0.6: EDUCATION→EXPERIENCE `[12,4,-164,18,0,-200]`; 0.6..1: EXPERIENCE→WORKS `[0,4,-160,140,0,-210]`. lookX áp frameBias responsive. Nếu đổi nhịp để theo meteor, giữ Experience0=Education1 và Experience1=Works0 cho mọi aspect/reduced.
- BH vẫn tại world center `[0,0,-200]`; camera rời nó trong đoạn cuối, không hide sớm hoặc dời shader center sang−420. Storyboard head cuối desktop `(1332,760)`, mobile `(w−40,935)` là pixel minh họa, không world pose đã validate. Đã mở PNG Experience thật: ba block lệch x/y không card, curve ghé từng nhãn.
- **Source hiện WorksConstellations chỉ mount lab** (`src/3d-lab.jsx`); App chỉ có SkillsSymbols. Báo cáo R2.3 từng nói GalaxyScene mount nhưng không còn đúng source hiện tại. R5.1 cần mount shared primitive vào production theo quality callback sẵn có. Current primitive chỉ visible khi Works hoặc finale<.55; thêm handoff visibility/strength nhỏ cùng progress để ba hệ hiện dần cuối Experience, không copy engine.
- Works basis rigid tính từ pose Works/aspect/FOV, giữ hình sao north-up/west-right. Không parent basis vào camera đang chạy để sao dính màn hình. Handoff cuối Experience phải khớp basis này.
- `advanceWorksOrbit` chỉ tích phân trong chapter Works; không advance trong Experience reveal, hidden/reduced hoặc pause tương tác. `setStoryPosition` sync orbit trước state publish. Giữ phase/origin/latched khi reverse; fresh deep link #work dùng phase0, quay lại Works đã xem không reseed.
- R5.1 chưa làm preview/route/controls R5.2. Ba hệ shared: EDURA/Centaurus17 chính+12 context/16 cạnh; VERIS/Gemini17+12/16; VIE/Cygnus10+12/9. Không đổi geometry, nhầm Centaurus/Sagittarius hoặc thêm logo thay chòm sao.

## Kiểm chứng cần để lại

Self-check dùng curve thật: head/trail tại0/.25/.5/.75/1 và progress bất kỳ tới/lùi; trail thuộc cùng curve, không accumulator; stop không đổi; endpoint camera, clamp và finite observer. Browser390/1440 kiểm nhấn company/role, slow/fast/reverse/stop, Works reveal cuối, #work jump không replay; phase giữ khi reverse. Đo lại sau Vi/En/resize/reflow. Reduced/hidden không bay; ambient còn thật ở vùng yên trong4–7 giây nhưng nhường portal/Experience/finale. Build/scoped lint, 0 console/WebGL error mới; không dùng screenshot/FPS predecessor làm kết quả R5.1.

Evidence: `docs/ke-hoach-nang-cap-thi-giac-2026-10-07.md` mục7–9/12–13; `outputs/prompts-redesign-r0-r8.md` quy ước chung/R5.1; `outputs/redesign/r1.1/handoff-notes.md`, `build-storyboard.mjs`, `frames/1440/vi/experience.png`; `outputs/redesign/r2.3/contract.md`; `outputs/redesign/r4.3/handoff.md`; source paths trong bảng. Audit không kết luận hiệu ứng R5.1 đã chạy.
