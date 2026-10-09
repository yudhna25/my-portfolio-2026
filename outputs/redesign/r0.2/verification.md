# R0.2 — Asset preparation

**08/10/2026 · ✅ Asset chuẩn bị xong; chưa tích hợp UI/scene.**

Đầu ra gồm chân dung màu có alpha, **9 logo xác minh đúng hãng**, và **6 chòm sao có nguồn geometry/catalog**. [assets-manifest.json](assets-manifest.json) ghi path, trạng thái, source URL, attribution, định dạng, kích thước, alpha, byte size và SHA-256. Xem [contact-sheet.html](contact-sheet.html), [contact-sheet.png](contact-sheet.png) và [constellation-data.json](constellation-data.json).

## Phạm vi và bảo toàn

- Đã đọc AGENTS mới nhất, kế hoạch mục 4–6/8/13/16, quy ước chung, R0.1 inventory, tools data và ảnh/icon thật. Áp dụng imagegen cho chân dung; threejs-fundamentals cho tọa độ/projection; Ponytail full để dùng native SVG/ImageMagick, stdlib và runtime có sẵn.
- Snapshot **mới của R0.2** ở [source-baseline.json](source-baseline.json), không dùng hash cũ làm bằng chứng hiện tại. **92/92 file src/public/index/vite/package và hai tài liệu kế hoạch/prompt giữ hash**, file set/HEAD/tracked status giữ nguyên. Không cài dependency, sửa ứng dụng, sửa locale hoặc dữ liệu R0.3.
- R0.3 chạy song song và sở hữu thư mục riêng. Tích hợp chỉ đọc handoff/checker, chạy 349 assertion trong bộ nhớ với dòng ghi `verification.json` được bỏ khỏi bản thực thi; kết quả lưu **trong R0.2** tại [r03-integration-check.json](r03-integration-check.json). Không sửa file R0.3. Append dòng tiến độ R0.2 rồi dòng R0.3 đã bàn giao, giữ mọi byte cũ AGENTS.
- Không chạy build/lint/FPS cho một task chỉ chuẩn bị asset. Không tuyên bố hiệu ứng redesign hoặc ứng dụng đã pass.

## Chân dung

| Bản | Path | Kết quả |
|---|---|---|
| Gốc | `public/avatar.webp`, bản lưu `portrait/avatar-original.webp` | 800×1000; giữ byte/hash. Vòng xanh, vòng trắng và họa tiết tam giác đã nhúng trong ảnh |
| Chỉnh lần 1 | `portrait/avatar-cutout-v1.png` | Không chọn vì làm nét lại vùng mặt hơn ảnh gốc |
| Chỉnh lần 2 | `portrait/avatar-cutout-v2.png` | Bản chọn; vòng/halo/trang trí dưới giày đã bỏ; giữ nhận diện, tư thế, kính, tay, trang phục và màu qua đối chiếu thị giác |
| Dùng web | **`portrait/avatar-cutout-color.webp`** | **800×1000, RGBA, 66.084 byte (~64,5 KiB)**; WebP quality 88, alpha-quality 100 |

Chỉnh bằng **built-in image_gen**, không CLI/API-key fallback. Hai prompt nguyên văn ở [portrait/edit-prompts.json](portrait/edit-prompts.json); prompt được chọn là `secondPrompt` (“Background extraction only… Preserve the source image's exact face… Change only background transparency…”). Nguồn generation giữ nguyên tại thư mục generated_images mặc định của Codex, bản chọn đã copy vào workspace. ImageMagick chỉ xuất định dạng/kích thước web và tạo ảnh kiểm tra; không dùng AI để tạo logo hay tọa độ sao.

Đã mở ảnh gốc trước chỉnh, mở ảnh thật sau chỉnh, soi tóc/kính/tay trên **#050505**, nền trắng và checkerboard: [portrait-inspection.png](portrait-inspection.png), [portrait/face-and-edge-comparison.png](portrait/face-and-edge-comparison.png), [portrait/cutout-on-white.png](portrait/cutout-on-white.png). Không thấy vòng/halo xanh hoặc nền checkerboard bị nhúng. Màu xanh thuộc áo/đồng hồ và màu giày được giữ. Phần ghế ngồi vốn có trong ảnh được giữ; không thêm đạo cụ.

[Alpha check](portrait/alpha-verification.json): decode WebP thật; **541.430 pixel alpha=0**, 258.560 pixel alpha trung gian, 10 pixel alpha=255; 11 probe ngoài người/corner đều alpha=0. Phần lớn vùng người có alpha khoảng 253 từ generation; giữ alpha mềm, không threshold cứng làm hỏng tóc. Kiểm tra màu trong vùng áo và đồng hồ pass. Nhận diện khuôn mặt/pose được đánh giá bằng ảnh so sánh; **ảnh AI không phải bản sao pixel-identical**, checker không giả làm face-verification tự động.

## Logo

**9/9 ready**, tên và nhận diện được kiểm tra từ nguồn gốc chính thức. Tất cả asset dùng web mono, có alpha; tổng **43.000 byte**. Nguồn màu/native giữ trong `logos/source/`; ảnh đối chiếu ở `logos/preview/`. [logo-assets.json](logo-assets.json) và [logo-check.json](logos/logo-check.json) phân biệt rõ `vendor-provided` với `project-derivative`, giữ attribution và nguồn tải.

| Logo | Nguồn chính thức | Mono bàn giao |
|---|---|---|
| Figma | [Figma brand assets](https://www.figma.com/using-the-figma-brand/) | `logos/mono/figma.svg`: mono-line trắng chính thức, crop padding ngoài |
| Photoshop | [Adobe SVG](https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg) | `logos/mono/photoshop.svg`: tile xám/letter trắng, path gốc |
| Illustrator | [Adobe SVG](https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg) | `logos/mono/illustrator.svg`: derivative mono, path gốc |
| After Effects | [Adobe SVG](https://www.adobe.com/cc-shared/assets/img/product-icons/svg/after-effects.svg) | `logos/mono/after-effects.svg`: derivative mono, path gốc |
| Premiere Pro | [Adobe SVG](https://www.adobe.com/cc-shared/assets/img/product-icons/svg/premiere-pro.svg) | `logos/mono/premiere-pro.svg`: **Pr thật**, riêng với Resolve |
| DaVinci Resolve | [Blackmagic Design press](https://www.blackmagicdesign.com/media/images/davinci-resolve-logo) | `logos/mono/davinci-resolve.webp`: 256² lossless, grayscale TIFF chính thức, giữ ba cánh |
| ChatGPT | [OpenAI brand](https://openai.com/brand/) | `logos/mono/chatgpt.svg`: white Monoblossom chính thức, crop padding |
| Claude | [Anthropic press kit](https://anthropic.com/press-kit) | `logos/mono/claude.svg`: Spark chính thức, fill trắng derivative |
| Google Antigravity | [Google press assets](https://antigravity.google/press) | `logos/mono/google-antigravity.svg`: white icon chính thức; không phải Gemini |

Đã đối chiếu **6 native entry với ZIP chính thức byte-for-byte**; 4 Adobe SVG/URL HTTP200 khớp path geometry. Receipts ở `logos/source/brand-source-receipts.json` và `adobe-source-receipts.json`. Các glyph SVG không bị vẽ lại: chỉ fill/viewBox/padding theo treatment; không script/href ngoài. Rasters mono có **R=G=B chính xác**. **9 web hashes riêng biệt**; Premiere và Resolve khác nhau. `public/icons/pr.png` sai nhãn vẫn giữ nguyên trong audit này, Agent tích hợp sau phải thay caller bằng đúng asset.

Đã xem trực tiếp [logos-inspection.png](logos-inspection.png) với nguồn màu và mono **48/24/16 px**. Ps/Ai/Ae/Pr đọc được; logo AI không lẫn nhau; Resolve giữ ba cánh ở kích thước nhỏ. AI Tools vẫn là **một nhóm chứa ba logo**, không phải ba mục năng lực mới.

## Sáu chòm sao

Geometry dùng **duy nhất Stellarium Modern**, pinned commit `daace2add6a1bf886e8ee1934f51e9c69f818d18`, dữ liệu **CC BY-SA 4.0**. Cạnh là cặp HIP lấy đúng từ [file Modern nguồn](https://raw.githubusercontent.com/Stellarium/stellarium/daace2add6a1bf886e8ee1934f51e9c69f818d18/skycultures/modern/index.json). Tọa độ/magnitude lấy từ [ESA Hipparcos / CDS I/239](https://cdsarc.cds.unistra.fr/ftp/I/239/ReadMe): **ICRS, epoch J1991.25**, RA/Dec độ, Johnson V. Không gắn nhãn J2000/2026 hoặc tự áp proper motion.

| Mapping | Chòm | Sao tạo hình | Cạnh |
|---|---|---:|---:|
| SGU | Circinus | 3 | 2 |
| Green Academy | Telescopium | 2 | 1 |
| Arena Multimedia | Pictor | 3 | 2 |
| EDURA | Centaurus | 17 | 16 |
| VERIS | Gemini | 17 | 16 |
| VIE | Cygnus | 10 | 9 |

Tổng **52 sao tạo hình, 46 cạnh**. Thêm **65 sao catalog hỗ trợ** trong sáu trường nhìn, tối đa 12/chòm, V≤5,5; chúng là context, có thể thuộc vùng chòm lân cận, **không phải node/cạnh thêm vào stick figure**. Không kéo cả StarField vào asset logo/chòm; không có particle simulation trong task này.

Projection **gnomonic**, tâm riêng mỗi chòm; **Bắc lên (+Y), Đông trái, Tây phải (+X), Z=0**. X/Y dùng cùng một scalar; giữ tỷ lệ, không mirror/stretch hoặc vẽ tọa độ bằng tay. JSON có HIP ID, RA/Dec, epoch/magnitude, position, origin/scale, polyline và edge pairs, source IDs, mapping và ghi chú.

[IAU charts](https://iauarchive.eso.org/public/themes/constellations/) sáu GIF đã lưu để đối chiếu, credit IAU/Sky & Telescope, Roger Sinnott/Rick Fienberg/Alan MacRobert; **không lấy các nét nối khác trong chart đó trộn vào Modern**. IAU không có một stick figure chính thức duy nhất. Nguồn giải thích tên/Chiron nằm riêng trong `sources` với role meaning, không dùng làm nguồn tọa độ. Centaurus không bị đổi thành Sagittarius; ý nghĩa dự án là diễn giải thiết kế, không phải kết luận thiên văn.

**Giới hạn visual rõ:** Telescopium của convention được chọn chỉ có hai sao/một cạnh; Circinus/Pictor cũng sparse. Không tự thêm đường để làm giống kính/compa/giá vẽ minh họa. R1/R4 nên tạo ấn tượng bằng độ sáng/không gian/thời điểm xuất hiện của các sao thật và phần context, giữ geometry đã truy xuất. Nếu đổi convention, phải thay nhất quán nguồn/cạnh/proof cho cả sáu trước tích hợp.

Đã mở [sheet sao](astronomy/constellations-sheet.png) và chart nguồn. [Source receipts](astronomy/source-receipts.json) giữ URL cuối, HTTP status, UTC, bytes, hash và attribution cho **16 file**. Checker kiểm **117 sao gồm supporting**: hàng catalog exact, cạnh exact từ Modern, ID/duplicate, projection và inverse projection, chiều Đông-trái; pass.

## Browser và lệnh kiểm tra

Chrome DevTools connector không tìm thấy Chrome stable ở máy này. Dùng **Edge 154.0.4258.62 + Playwright đã cài**, context headless mới tách khỏi profile người dùng; không cài browser/plugin. [browser-results.json](browser-results.json): **47/47 image decode pass**, **0 console/page error**, overflow **0 px** ở 1440 và 390; có [sheet mobile](contact-sheet-mobile.png). Đây là render sheet asset, không phải bằng chứng FPS điện thoại hoặc render scene đã tích hợp.

```powershell
node outputs/redesign/r0.2/logos/prepare.mjs
node outputs/redesign/r0.2/build-review.mjs
node outputs/redesign/r0.2/browser-review.mjs
node outputs/redesign/r0.2/check-artifacts.mjs
```

`prepare.mjs` là kiểm tra/build asset offline từ nguồn đã lưu; không tải lại. Root checker tái kiểm hash toàn bộ manifest, không duplicate web asset, nguồn bất biến, decode/alpha/màu chân dung, SVG path gốc và RGB mono, source→geometry cùng prefix AGENTS. [source-integrity.json](source-integrity.json) là kết quả cuối. Launcher sandbox MXC ổ G lỗi87 như baseline; lệnh artifact chạy qua escalation đã được chấp thuận, không dùng giới hạn đó để giả pass.

## Bàn giao

- **R1:** contact sheet + manifest + chân dung/logo/geometry đã chọn để dựng storyboard; chưa chấp thuận storyboard hoặc triển khai chuyển cảnh.
- **R3:** `portrait/avatar-cutout-color.webp`, bản màu/alpha để grayscale bằng CSS và trả màu khi tương tác sau này; không dùng v1 hay avatar có halo.
- **R4:** `logos/mono/` (6 software, 3 AI trong một nhóm); `constellation-data.json` IDs `Cir/Tel/Pic`; chỉ hội tụ tập sao được chọn, không kéo cả bầu trời.
- **R5:** `constellation-data.json` IDs `Cen/Gem/Cyg`, giữ tỷ lệ/hướng nhìn nguồn và các trạng thái link theo kế hoạch.
- **R0.3:** chỉ append dòng handoff đã kiểm349assertion. Pack phần đã xác minh xong; video/system chi tiết/outcome/reflection vẫn thiếu. Không chạy R6.

Mọi asset/task logic mới nằm trong `outputs/redesign/r0.2/`. Không tự chạy R1/R3/R4/R5 hoặc sửa source/public.
