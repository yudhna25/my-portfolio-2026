# R3.2 — Hero thật / portal shared

**✅ Xong trong phạm vi R3.2.** Hero production dùng typography DOM và O cuối để mở portal R2.2; đi thẳng Nav/hash đến section, cuộn ngược, dừng và reduced-motion đã kiểm trên render thật. Chưa thực hiện R3.3 hoặc các section redesign phía sau.

Ngày: 08/10/2026. Phụ thuộc đọc/đối chiếu: AGENTS.md hiện tại, kế hoạch 07/10 mục 3/12/13/15, quy ước prompts R0–R8, storyboard R1.1, contract R2.1, verification R2.2 và bàn giao R3.1. Áp dụng frontend-design, gsap-react, gsap-scrolltrigger, react-3d-ui và Ponytail full; không thêm dependency.

## Thay đổi / ownership

- `Hero.jsx` dùng `PortalHeading.jsx` chung với lab. PORTFOLIO theo font Unbounded Variable thật, đủ ngang 320–1920; năm xám phía sau/lệch phải, đủ bốn số trong viewport; tên nhỏ bên trái dưới. Hai key `hero.portfolio`/`hero.year` được thêm cho cả Vi/En; các key khác giữ nguyên.
- Glyph cuối (index 8, O thứ ba) là `[data-story-anchor="portal"]`, luôn là chữ sáng đầy đủ. HDR silhouette được composite trong counter O bằng cùng `BlackHole`/copy-mask R2.2. Chỉnh hai hệ số fit chung để vòng/đĩa không lọt ra khe I→O; không shader hoặc ray pipeline riêng.
- App dùng `GalaxyScene story` và producer DOM chung. Hero fixed ngoài ScrollSmoother; portal đo từ marker DOM, cao **175vh**. Không giữ một viewport trống trước portal. Main reading content ẩn/inert đến khi portal settle, rồi About hiện.
- `useScrollProgress` chờ loading xong, đo lại theo fonts/locale/resize/refresh; nhận hash DOM `#about/#work/#transmission` và back/forward. Nav/Menu story jump đặt vị trí cuộn thật trực tiếp; focus keyboard chạy ở frame producer đã cập nhật. Query manual scrub chỉ áp dụng trong lab, không khóa production.
- `CameraRig` vẫn là camera writer duy nhất. Camera/path/ray shader/HDR System/bloom mask giữ hash baseline. Camera story và composite lấy cùng chapter/p; story không dùng offset/intensity từ `contactProgress` cũ.
- Lens vẫn bóp heading tại con trỏ; không transform layout của glyph O. Glitch chỉ mutate số cuối, năm accessible luôn 2026. Glitch pause/reset khi hidden, rời Hero hoặc portal bắt đầu; reduced giữ số 6.
- Frame đầu không dense starfield/chòm sao/BH lớn. Bỏ App fullscreen grain RGB cũ; local dust trong portal shared vẫn nhẹ. Ambient/meteor hoạt động sau portal, fade về 0 ở Experience để chờ sao băng dẫn đường. Works constellation prototype chỉ mount trong lab, không triển khai R5 trong App.
- Sửa một dòng CSS reduced-motion: `transition-duration: 0s !important`. Giá trị 0,01ms trên `*` trước đó vô tình tạo transition inherited visibility, làm About nhận focus khi computed style còn hidden dù inline đã visible. Native focus fresh reduced đã pass sau sửa, không thêm retry loop.

## Kiểm chứng cuối

Edge 154 thật, Windows, headless Playwright với GPU ANGLE/D3D11 NVIDIA RTX 4060. Browser plugin Chrome thiếu executable; CUA lỗi trusted Node ở lần khởi tạo. Dùng Edge đã cài với bundled Playwright để mở ứng dụng thật, gửi mouse/wheel/keyboard và chụp PNG; không thay renderer bằng mock.

| Kiểm tra | Bằng chứng / kết quả |
|---|---|
| Build cuối | `build.log`: Vite 7.3.6, 1842 modules, 4,93s; manifest/sw tạo được, 25 precache entries (~2198 KiB) |
| Scoped lint / full lint | `scoped-lint.log`: 0 error/warning ở 13 JS/JSX sửa; `lint.log`: 0 error, 2 warning SplashCursor có sẵn |
| Contract tự chạy | `check-contract.log`: **792 assertions PASS**, endpoint/clamp/reverse/reduced, locale parity 181 keys, one Canvas/CameraRig/HDR target owner; observer nhỏ nhất r=8,182909 >1 |
| Hero Vi/En | 12 layouts: 320/390/768/1024/1440/1920; 0 overflow, accessible year 2026, O index8, Hero opacity1, backdrop/meteor hidden |
| Portal forward/reverse | 20 poses: p=0/.25/.5/.75/1 tại 1440×900 và 390×844; camera/composite reverse error **0**, camera path error0, direction error≤3,33e−16, anchor error≤5,69e−14 px |
| Dừng | Native position dừng 900ms tại p≈.25 trên hai viewport: camera drift0, pull không đổi |
| Native scroll | `preview-results.json`: 328 samples Hero→portal→About và reverse, max progress error3,59e−8, pose/pull error0; DOM opacity sai số làm tròn≤4,66e−5 |
| Glitch thực | 7 tại 1497,4 / 3000,1 / 4497,0ms; khoảng cách1502,7 /1496,9ms; xung96,8 /97,0 /97,0ms. Prefix202 và aria2026 giữ nguyên; pause portal/hidden pass |
| Jump / lifecycle | 6 dev jumps gồm 3 reload hash, native Nav/Back/mobile Menu; 18 resize records trong 3 cycles reduced on/off tại320/390/1440; 2 lab smoke records. Tổng harness chính **64 records**, errors[] |
| Production preview | 8 loads Hero/#about/#work/#transmission tại1440/390: 1 Canvas, 0 overflow, đúng opacity/inert, dark, SW controller thật/1 registration. Fresh reduced keyboard Menu→About nhận focus đúng, số6 tĩnh. Production query lab bị bỏ qua |
| Contact legacy | Đổi contactProgress thật 0→1→.5→0 tại portal .75: camera không đổi, diskIntensity luôn1 |
| HDR / resources | Mỗi mốc .25/.75 đọc 3.745.440 half-float components: nonfinite0, nonmono0, GL error0. Cùng ray texture UUID, **496 ray renders/496 frames**, 21 targets gồm target composer/mipmap có sẵn, không target mới cho mini O |
| Chi phí render | 1440×900, high24k stars, DPR1, sample3s/mốc: **165,13 FPS (.25)** và **165,04 FPS (.75)**; không đại diện điện thoại thật hoặc mọi cấu hình DPR |
| Lens native pointer | `lens-results.json`/`lens-pixel-results.json`: 275 pixel đổi trong ROI80×80, 0 ngoài ROI; anchor ổn định khi di chuột, lens tắt khi portal bắt đầu. Touch emulation: 0 Cursor/0 lens |
| Visual | `visual-audit.md`, `hero-pixels.json`: mini fit trong O, 201 sampled core pixels RGB0, 669 gutter pixels RGB5, nền ROI mono. Không white viewport trong các pose đã xem |
| Bảo toàn | `integrity-results.json`: 90 baseline paths, 16 sửa/74 giữ exact; staged diff hash giữ nguyên. About/Work/Education/Experience/Skills/Contact/Footer, public assets, main/PWA/config/deps giữ hash. AGENTS append giữ nguyên prefix |

Screenshot thực và SHA256 nằm trong `frames-manifest.json` (48 PNG), thư mục `screenshots/`. `browser-results.json` và `preview-results.json` là kết quả PASS cuối; `*-failure.json` giữ lại như chẩn đoán các lượt trước sửa, không dùng làm kết quả cuối.

**Reverse được chứng minh ở cùng progress/camera/composite, không claim toàn PNG luôn pixel-identical.** Harness đặt vị trí DOM rồi giữ manual p để đối chiếu chính xác; native scroll được đo riêng vì native offset làm tròn pixel. Ambient/time, glitch năm, Nav và entrance About cũ có thể khác giữa hai lần chụp; `portal-pixels-audit.json`/manifest ghi diff nguyên ảnh thực. Không freeze các layer đó trong trải nghiệm production. LCD text antialias có thể tạo lệch kênh ở screenshot; HDR readback mono0 mới là kiểm scene. About hiện vẫn panel/halo/copy cũ chờ R3.3.

Warning có sẵn: THREE.Clock deprecation, chunk>500KB, hai lint warning SplashCursor. Không console/page/WebGL error mới ở các lượt PASS. Mobile/touch/hidden/reduced dùng browser emulation; chưa toggle OS motion hoặc đo máy điện thoại/nhiệt trong task này. Không claim renderer NASA 100% hoặc toàn redesign đã pass.

## Tái kiểm tra

Chạy từ root project; Edge và bundled runtime được dùng trong các script, không cài package:

```powershell
npm run build
npm run lint
node outputs/redesign/r3.2/check-contract.mjs
node outputs/redesign/r3.2/verify-integrity.mjs
npm run dev -- --host 127.0.0.1
# Terminal khác, với dist build mới:
npm run preview -- --host 127.0.0.1 --port 4173
node outputs/redesign/r3.2/verify-browser.mjs
node outputs/redesign/r3.2/verify-preview.mjs
node outputs/redesign/r3.2/verify-lens.mjs
```

Đã chạy scoped lint bằng `npx eslint` trên 13 JS/JSX có trong `integrity-results.json`. Pixel scripts dùng Python/Pillow bundled. `baseline.json` capture lúc 2026-10-08T03:01:53Z trước sửa R3.2, snapshot trong `before/`; không lấy baseline R0/R3.1 làm baseline mới.

Bàn giao cụ thể trong `handoff.md`; chưa chạy R3.3.
