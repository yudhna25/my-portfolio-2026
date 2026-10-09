# V1 → V3 — Hero / anchor / timeline

**Handoff cập nhật yêu cầu 2:** year nay là star dots +5 meteors contour. Đọc [bản hiện tại](year-stars/verification.md#handoff-v3-và-giới-hạn) trước phần lịch sử dưới đây. ID `hero-year-dash` đã được thay bằng `hero-year-meteors` (lap4–5.2s) và `hero-year-twinkle` (opacity lệch nhịp). Props, final-O, bố cục, decode/glitch và idle gate giữ nguyên. Source đã dừng sửa; `v1-owned.patch` là toàn bộ bản mới, `year-stars/year-stars.patch` là riêng delta yêu cầu 2.

09/10/2026. **V1 hoàn thành và đã dừng sửa source. V3 chỉ tích hợp sau khi V2 cũng bàn giao.** Không tự chạy V3 hoặc yêu cầu duyệt G1 trên ảnh worker.

## File / phạm vi

Đã sửa `src/components/Hero.jsx`, `src/components/effects/PortalHeading.jsx`; tạo `src/styles/hero.css`, import từ PortalHeading. `v1-owned.patch` chứa đúng ba file, đã áp dụng trong working tree hiện tại; không áp dụng lần hai lên source đang có.

Không sửa App, shader, camera, store, Cursor, Lab, locale, config/package hoặc AGENTS. Những thay đổi BlackHole/BlackHoleSystem/blackHole shader/quality và asset V4 trong working tree là của nhánh song song, không hoàn tác. Fingerprint source/dist: `build-results.json`; fingerprint từng ảnh: `browser-results.json`.

## API tương thích

```jsx
<PortalHeading label={label} name={name} year={year}
  role={role} visible={visible} glitch={glitch}>
  {children}
</PortalHeading>
```

Giữ toàn bộ props cũ. `role` mới là tùy chọn, mặc định undefined → không render. `visible=true`, `glitch=false` giữ mặc định cũ. Hero truyền `role={t('hero.tagline')}` và giữ `hero.subTagline` làm intro. Lab caller cũ chạy được, không cần patch ngay. Nếu muốn Lab có role, integrator thêm `role={i18n.t('hero.tagline')}` vào caller hiện có ở `src/3d-lab.jsx`; **chưa áp dụng**.

Không cần key locale mới, schema/store field mới hoặc App wiring cho V1. Font Unbounded được import trong shared component để Lab cũng dùng đúng font; dependency có sẵn, không đổi package/lockfile.

## Final O / layout

- H1 `#hero-heading`, `aria-label=PORTFOLIO`; 9 `[data-portal-char]` giữ thứ tự. Glyph cuối vẫn giữ font advance và `text-transparent`.
- `[data-story-anchor="portal"]` là span rỗng nằm trong glyph cuối. Không display:none/scale0, không O trắng bổ sung. Producer hiện có tiếp tục đo/publish rect `fixed:true`; V2 đọc `storyAnchor` như cũ. Không thêm writer anchor trong V1.
- CSS cap slot Unbounded 800: left .03125em, top .109375em, width .90625em, height .78125em. Advance/letter spacing của heading giữ −.035em. Nếu đổi font/weight phải đo lại các bounds này.
- Desktop left14vw / width72vw, display size72vw/7.05; mobile left/right1rem, size(100vw−2rem)/7.05. Landscape desktop cao≤550px cap size19vh. Năm SVG dùng font800, tự shaping bằng font hiện có, kích thước chữ 1.6× heading, không raster/vector path giả lập.
- Slot tại cỡ chữ gốc Vi/En giống nhau: 320px 37.016×31.906; 390px 46.016×39.672; 1440px 133.266×114.891; 1920px 177.688×153.188 CSS px. Vị trí đầy đủ nằm trong browser JSON.
- Header fixed viewport z20; Nav/Menu phía trên. Name/details nhận pointer chỉ khi Hero idle. Name là text có focus để replay decode; không giả button có hành động khác.
- Khi text lớn không đủ chỗ, `[data-hero-details]` cuộn bằng wheel/keyboard; year/heading/O đứng yên. V3 cần giữ điều này hoặc dùng layout tương đương có cùng anchor contract.

## Layer / property writer

| Node | Writer V1 hiện tại | V3 nối trên layer ngoài |
|---|---|---|
| `[data-portal-stage]` | Opacity từ portalState cũ; aria-hidden/inert | Thay phase draw hiện tại bằng contract V3, tránh hai writer opacity |
| `[data-hero-content]` | Layout column, giới hạn viewport; không GSAP transform | Có thể làm wrapper intake nếu anchor measurement/capture được giữ đúng |
| `[data-hero-layer="year"]` | Layout; không GSAP transform | Intake năm trên wrapper, không ghi transforms của SVG digit/noise |
| `[data-hero-layer="heading"]` | Typography; bend cũ trên L/I | V3 thay bend cũ, không cộng timeline khác vào cùng char transform |
| `[data-hero-layer="identity"]` | Layout name + role | Intake toàn identity trên wrapper |
| `[data-hero-layer="intro"]` | Copy từ locale; không motion riêng | Intake intro |
| `[data-hero-layer="indicator"]` | Fixed viewport; không motion riêng | Intake indicator; tránh ancestor transform làm đổi containing block |
| `[data-hero-decode]` | ScrambleText đổi text trang trí | Không đổi semantic name, không ghi nội dung từ portal timer |
| `[data-year-dash]` | Stroke dash offset | V1 giữ writer; V3 chỉ transform/opacity wrapper năm |
| `[data-year-digit]`, `[data-year-noise]` | Glyph cuối, x/y/opacity trong fracture | Không ghi trực tiếp từ intake, các node reset khi p>0 |

Portal **cũ** còn để tương thích: `portalState.textOpacity`; bend L x22/y−4/rotation−5/scaleX.85, I x12/y3/rotation4/scaleX.9; reduced bend0. V1 không triển khai hút/đẩy năm, name/intro/Nav/Cursor/audio hoặc About ejection. V3 phải thay writer cũ và dùng shared progress/phase; không thêm producer hoặc camera timeline khác.

Nếu intake transform ancestor của O, V3 phải thống nhất rect cố định/capture với producer và V2 trước, không để DOM rect và store khác nhau. Child ghost của O và cap slot cần giữ trong semantic heading.

## Wall-clock timeline

| ID | Timing / behavior |
|---|---|
| `hero-year-dash` | 6s tuyến tính, offset0→−36 trên dash12/24, repeat−1 |
| `hero-year-glitch` | 0–12 giữ6;12–12.4 fracture, đổi7 ở12.2;12.4–15.4 giữ7;15.4–15.8 fracture, đổi6 ở15.6; repeat15.8s |
| `hero-name-decode` | .6s, revealDelay.2, upperAndLowerCase, tweenLength=false; restart trên enter/hover/focus |

Idle = `visible && !document.hidden && portalProgress(chapter,p,frozen)===0`; reduced-motion không tạo ba timeline. Khi rời idle: pause/reset dash và glitch về0/6, name về copy đầy đủ, name tabindex−1/blur nếu đang focus. Khi lại idle, bắt đầu chu kỳ mới từ hold6 đầy đủ. Semantic year là span sr-only tĩnh2026; SVG aria-hidden. Context cleanup + document/name listeners + store subscription đã kiểm unmount/StrictMode.

## Verification / giới hạn / patch chung

`verification.md`: 208 development checks +21 production checks; build/scoped lint/full lint pass, 0 browser errors cuối. 28 ảnh cuối gồm App/production/Lab/glitch/reduced/text200. Source stable trong capture/build. Ảnh có renderer V2 snapshot cùng lúc; V3 vẫn phải tạo evidence tích hợp mới và kiểm native progress/reverse/resize/language/reduced sau khi thay portal.

**Điểm cần integrator xử lý ngoài V1:** tăng root font200% làm Nav/Sound rộng hơn viewport (320 trang+268px,390+198px; controls vượt phải trên desktop nữa). Hero riêng không overflow, details đọc hết được và O giữ nguyên. Đề xuất sửa layout/co hàng/ẩn nhãn controls khi text phóng lớn trong Nav/Sound tại bước tích hợp/a11y; không shrink copy Hero để che lỗi này. Chưa áp dụng patch chung vì nằm ngoài ownership V1.

Chưa kiểm browser zoom/OS motion/switch tab/screen reader/điện thoại thật, Safari/Firefox hoặc hiệu năng/HDR. SVG contour native dựa vào font và hỗ trợ stroke text/tspan của browser; Edge đã kiểm. V3 cần kiểm regression sau thay lớp/transform, đặc biệt fixed indicator và anchor.

## Dòng AGENTS chờ integrator append một lần

```markdown
| 09/10/2026 | V1 — Hero typography / outline / decode / cosmic glitch | Codex | ✅ V1 xong, chờ V3 tích hợp | Hero/PortalHeading + hero.css: left14vw, SVG Unbounded outline2px/dash6s, O cap slot trong suốt, name decode/i18n role, last6→7→6 chu kỳ15.8s/pause/reset/reduced/cleanup; build/scoped/full lint pass (2 warnings cũ), Browser208 dev+21 production/28 ảnh/0 errors; text200 Hero0overflow/O đứng yên, Nav/Sound ngoài scope còn tràn. outputs/visual-revision-2026-10-09/v1/verification.md; chưa portal V3/G1 hoặc thiết bị/OS thật. |
```
