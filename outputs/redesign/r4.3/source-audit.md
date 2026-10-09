# R4.3 — Source, content và storyboard audit

08/10/2026. Audit read-only đối với src/public/locales/AGENTS. Chỉ tạo báo cáo và checker trong thư mục R4.3; không dùng audit này để tuyên bố production Education đã pass.

## Mapping và nội dung phải giữ

| Target renderer / DOM | Trường / ngành | Niên khóa Vi / En | Hình sao | Sao hình + context / cạnh |
|---|---|---|---|---|
| `saigonUniversity` | Saigon University / Cử nhân Công nghệ Thông tin | `2021–2026` / `2021–2026` | Circinus (`Cir`) | 3 +11 /2 |
| `greenAcademy` | Green Academy / Chứng chỉ Dựng phim Chuyên nghiệp | `2022–2023` / `2022–2023` | Telescopium (`Tel`) | 2 +6 /1 |
| `arenaMultimedia` | Arena Multimedia / Advanced Diploma in Multimedia | `2024–nay` / `2024–Present` | Pictor (`Pic`) | 3 +12 /2 |

Vi/En `education.institutions.*` đã đầy đủ tên, period, degree và description. Giữ nguyên những chuỗi đã chốt; `src/data.js` chỉ là legacy data, không phải nguồn mới để tự sửa copy. Cụ thể, En hiện ghi SGU “High Honors” còn legacy data.js ghi “Good Tier”; R4.3 không đổi fact đã chốt dựa vào bản legacy. Các description SGU/Arena/Green vẫn giữ hiện rõ (HCI/prototyping, Distinction kỳ 2, VFX/motion/Premiere/AE), không tự thêm proficiency hoặc thành tích.

Danh sách giao diện nên theo ba vùng SGU→Green→Arena để khớp map, nhưng không dùng `ol` có ý nghĩa ba bước loại trừ nhau, một trục timeline nối từng vùng, hoặc animation scroll lần lượt mới cho đọc. Ba period chồng thời gian cùng tồn tại. Dùng danh sách semantic và native button khám phá, tên/ngành/năm luôn hiện ở mọi trạng thái.

## Source → geometry

Nguồn chính là `outputs/redesign/r0.2/constellation-data.json`, receipt SHA256 `1047432e95bcea8105c521801fee19ff81f2dce92ccf1f1cdfd682f56cfe1c9f`. `src/3d/data/symbolTargets.json` giữ chính geometry/projection/catalog/source URL của ba subset trên; không có nét nối được thêm vào.

- Edge convention duy nhất: [Stellarium Modern, commit daace2add6a1bf886e8ee1934f51e9c69f818d18](https://raw.githubusercontent.com/Stellarium/stellarium/daace2add6a1bf886e8ee1934f51e9c69f818d18/skycultures/modern/index.json), CC BY-SA 4.0. Copy local: `outputs/redesign/r0.2/astronomy/sources/stellarium-modern-index.json`.
- Tọa độ và Johnson V từ ESA Hipparcos / CDS VizieR `I/239/hip_main`, **ICRS J1991.25**, không áp proper motion và không đổi nhãn thành J2000/2026. Catalog TSV lưu trong `astronomy/sources/`.
- Projection gnomonic: north +Y, celestial west +X (east trái), cùng một uniform scalar cho X/Y, z0; nhìn trời từ Trái Đất. Không lật, rotate hoặc stretch từng hình để đẹp hơn. Billboard toàn stage theo camera là đặt sân khấu, không đổi geometry.
- Cir: HIP71908→75323 và HIP71908→74824. Tel: **HIP90568→90422**, chỉ hai sao/ một cạnh. Pic: HIP32607→27530→27321.
- Context là 11/6/12 sao field có thật, mag≤5.5, không được biến thành member/link thêm. Cone có thể gồm sao thuộc vùng chòm lân cận; chẳng hạn context Cir có Alpha Centauri. Không gọi toàn context là “sao của Circinus”.
- IAU đặt tên/ranh giới, không đặt một stick figure duy nhất. IAU GIF được lưu để đối chiếu chart, không trộn cạnh IAU/MacRobert vào Modern. Tên Circinus liên quan **compa vẽ kỹ thuật**, không la bàn từ. Cách liên hệ với ba trường là diễn giải thiết kế; không vẽ compa/kính thiên văn/giá vẽ vào renderer.

Đã mở ảnh thật R0.2 `constellations-sheet.png` và R1.1 `frames/1440/vi/educationCir.png`: Cir chạc hẹp với sao 71908 ở dưới/phải; Tel gần dọc với 90422 ở trên/phải; Pic gấp khúc với 32607 dưới/trái. Checker so position Float32 của pool với source, không chỉ so tên file.

Renderer R4.1 đã phù hợp trình tự: formation0–0.45s trước link0.55–1s; size main 3–4.5px dựa trên vmag, context weight0.15, link alpha tối đa0.12. Đây là nâng tương phản để khám phá, không quảng bá ba chòm mờ như nhóm sao sáng nổi tiếng. Pool192 giữ nguyên, StarField không bị kéo vào. Leave/swap/reset dùng chính base buffers; reduced set exact endpoint tức thì. Không cần đổi geometry để R4.3 dựng bố cục.

## Layout và i18n tối thiểu

R1.1 Education desktop1440×900: section1575px =1.75viewport; ba tâm Cir(340,470), Tel(1070,730), Pic(580,1150). Nhãn dưới mỗi vùng và không panel; BH nền góc phải trên. Mobile390: vùng cao độ380/755/1150, lệch trái/phải/trái, label dùng chiều ngang khả dụng. Đây là minh họa bố cục; camera đề xuất R1.1 đã cũ, **không phục hồi** pose camera trước R3.3/R4.2. Production phải đo anchor và vùng BH sau khi mount.

Giữ font/display hiện có; không raster text vào Canvas. Để mỗi vùng có window thật và text dưới/ngoài window. One active consumer chuyển anchor tới window tương ứng; không dựng ba Canvas/ba engine hoặc card lớn. Dùng stable ref map trong App/section theo contract có sẵn, nối bridge SkillsSymbols sang consumer active Skills/Education nhỏ nhất.

Chỉ cần thêm keys `education.hint`, `education.clear`, `education.explore` (interpolation tên chòm), `education.activeConstellation` nếu có live status; tên Circinus/Telescopium/Pictor qua `education.constellations.*` cho cùng quy tắc i18n. Ví dụ hint Vi “Di chuột hoặc dùng Tab để đánh thức một vùng sao. Chạm mốc để chọn; chạm nền hoặc nhấn Esc để bỏ chọn.” / En “Hover or use Tab to awaken a star region. Tap a milestone to select; tap the background or press Esc to clear.” Không mở lại quyết định Q1–Q23, không viết lại copy học vấn.

Keyboard focus, touch latch và hover dùng precedence nhất quán R4.2. Escape clear nhưng giữ native focus; kích hoạt Enter/Space sau Escape phải có phản hồi. Click nền có thể clear selection nhưng không tự blur vô cớ. Scroll out clear và pool reset; reverse quay lại không tự khôi phục selection cũ. Reduced vẫn button/text/chòm tĩnh theo lựa chọn, không ẩn thông tin hoặc ép phải hover mới đọc ngành.

## Kiểm tra chạy lại

`node outputs/redesign/r0.2/astronomy/check-constellations.mjs` xác minh receipt/source catalog/polylines/projection của toàn sáu hình đã chuẩn bị. `node outputs/redesign/r4.3/check-source.mjs` kiểm riêng mapping Education, subset/context/edges, pose pool exact Float32, context không nối và reset exact; đồng thời bảo vệ copy trường học Vi/En so với storyboard approved. Kết quả trong `source-results.json`, `source-catalog-run.json`. Render/interaction/lifecycle/pose BH thật thuộc browser verification R4.3 riêng.
