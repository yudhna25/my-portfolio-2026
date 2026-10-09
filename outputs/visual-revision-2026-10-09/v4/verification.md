# V4 — Verification

09/10/2026. **PASS cho asset/dữ liệu/check local; bàn giao V5/V7/V8.** Runtime integration và clearance phát hành không nằm trong kết luận này. Skill đã dùng: repo `tools/codex-skills/react-3d-ui/SKILL.md`. Chỉ ghi `public/constellations/` và `outputs/visual-revision-2026-10-09/v4/`; không sửa src, stores, App, locales, config/dependencies hoặc AGENTS.

## Nguồn và license

[Johan Meuris](https://johanmeuris.eu/work/stellarium-constellation-art/) xác nhận bộ 88 tranh cho Stellarium, làm bằng Illustrator/Photoshop và phát hành Free Art License; trang dated 2005-10-30. Không có vector master/high-res được xác minh. Nguồn của task là PNG Gemini256² và năm PNG512²; không dùng ảnh lớn từ gallery để đổi nguồn hoặc ghép với anchor của PNG nhỏ.

Metadata và sáu PNG đều tải từ revision **daace2add6a1bf886e8ee1934f51e9c69f818d18**, commit API xác nhận ngày **2026-03-05T20:21:47Z**. Revision này là bản pinned của task, không tuyên bố latest HEAD. `source-receipts.json` có URL, thời điểm/status/bytes/SHA-256 của 15 nguồn; source bytes lưu tại `sources/`. `description.md` ghi riêng **Text and data CC BY-SA4.0 / Illustrations Free Art License**. Từng SVG có credit, modified notice, source/license link; public `ATTRIBUTION.md` giữ notice chung có link từng bản.

[FAL1.3](https://artlibre.org/licence/lal/en/) cho sửa/phân phối derivative với attribution, access to originals, notice sửa và cùng/compatible license (§2.2/2.3); bộ art phân phối riêng dưới FAL1.3. Không lấy FAL làm license line patterns hoặc catalog. Line pattern theo notice của Stellarium: CC BY-SA4.0. Các kết quả chiếu/toạ độ giữ ESA1997/CDS attribution; không gán một license chung cho pack.

[VizieR terms](https://cds.unistra.fr/vizier-org/licences_vizier.html) đã lấy HTTP200, nội dung xác nhận scientific usage kèm citation, commercial usage theo nguồn. **Chưa xác nhận explicit commercial grant riêng catalog I/239.** `ATTRIBUTION.md`/handoff ghi rõ để integrator xử lý trước commercial publication. Nguồn [ESA catalog](https://www.cosmos.esa.int/web/hipparcos/catalogues) xác nhận reference ESA1997/SP-1200, không được suy thành blanket commercial license.

ReadMe catalog dùng snapshot đã có ở R0.2 với hash/nguồn kế thừa ghi rõ; tải mới FTP trả403, ReadMe CGI500. Query VizieR mới **88/88 HIP** có `RAICRS/DEICRS` header **ICRS, Epoch=J1991.25**, RA8digits, DE8digits, Johnson V. Không dùng generic `#Coosys J2000` ở đầu response để relabel các cột RAICRS/DEICRS. Không propagation/proper motion, không coi đây là vị trí năm2026.

## Các check mới

`check-assets.py` exit0, kết quả chi tiết [check-results.json](check-results.json); `render-evidence.mjs` decode bằng sharp/librsvg, [decode-results.json](decode-results.json).

| Check | Kết quả |
|---|---|
| Sáu SVG | 6/6 XML parse + librsvg decode; chỉ path vector, không image/base64/script/filter/foreignObject. Transparent background, hai màu trắng/xám. Tổng427,998bytes, từng file37.7–105.1KB. |
| Source integrity | 15/15 receipt bytes/hash, pinned revision API, metadata/ảnh cùng commit; kích thước thật đúng cả sáu. |
| 18 anchors | Pixel↔HIP trong metadata trùng bảng tham khảo; từng RA/Dec đối chiếu query catalog mới rồi independent projection test. |
| Anchor mapping | Max local residual <3×10⁻¹⁵; source→vector→source roundtrip <2×10⁻¹³px. Đây là số học double của calibration, không sai số astrometry hoặc độ chính xác landmark người vẽ. |
| Main stars | 87 main occurrences qua sáu figure; 88 distinct HIP query gồm calibration. Max gnomonic position residual <7×10⁻¹⁰ local units do rounding9digits. |
| Line patterns | 87 edges theo đúng thứ tự source polylines; không thêm cạnh hoặc đổi convention. |
| Scorpius | 13 main /12edges; HIP82671 ở pattern; HIP82729 calibration-only, không cạnh tới sao này. |
| Works | Cả3 geometry (kể cả12context mỗi hình) và projection deep-equal runtime JSON. |
| Source silhouette | 13,893 outer-boundary vertices kiểm ngược về vùng biên ink thật; chênh area contour theo source threshold ≤0.211% (Gemini lớn nhất). Đây là fidelity với binary threshold, không đo recognition của con người. |
| Opacity | 24/24 render8/12/25/35% trên #050505 tại132px; sheet bổ sung256px để quan sát silhouette. Không giả lập runtime hover/selection. |
| Ownership | 82 protected files giữ hash so với snapshot trước build asset;4 file V1/V2 thay đồng thời và1file mới V1 `src/styles/hero.css` được giữ, exact hashes ở concurrent-changes.json. V4 không ghi các file này hoặc sửa baseline để che khác biệt. |

Tổng main occurrences là **87** (21+13+9+17+17+10), edges **87** (24+12+10+16+16+9), query catalog có **88 HIP** do thêm calibration82729. Mọi con số lấy từ JSON, không coi source table tham khảo là test.

## Nhận diện và opacity

Đã mở và quan sát ảnh export cuối [contact-sheet.png](contact-sheet.png) và [opacity-sheet.png](opacity-sheet.png). Source đứng theo pose original; vector/overlay north-up sau calibration. Sự đổi pose là hệ quả của mapping stars, không flip hoặc xoay độc lập để đẹp hơn. Crop bỏ phần trống, giữ ba anchor và padding3%/cạnh dài; source→vector projective matrix lưu từng hình. Hình Lion trở về pose ngang tương ứng Leo source line pattern, không ép sao theo pose lion trong bitmap.

| Art | Dấu hiệu thấy ở full/active | Idle8–12% |
|---|---|---|
| Orion | Tay/chùy giơ cao, áo/rìa shield, đầu và chân | Silhouette tay/chùy còn theo được; nét mặt chìm, đúng vai trò nền |
| Scorpius | Hai càng, thân nhiều đốt, đuôi móc | Đuôi và càng vẫn tách; shading thân đã bỏ |
| Leo | Bờm/đầu sư tử, hai chân trước, đuôi dài | Leo thấp hơn hình khác vì north-up ngang; active25–35% thấy bờm rõ hơn |
| Centaurus | Phần người/cánh tay + thân ngựa/chân + giáo | Body/giáo hiện nhẹ; chân ít nổi tại8% |
| Gemini | Hai đầu, hai cơ thể/đôi chân liên kết | Bóng đôi vẫn theo được; vài đường thô từ nguồn256px còn rõ ở active |
| Cygnus | Hai cánh dài, cổ dài và đầu nhỏ | Silhouette cánh/cổ vẫn tách khỏi nền |

Mức8% rất kín đáo, không dùng như hình nhận diện độc lập thay text;25–35% cho figure rõ hơn sau stars. Nhận diện ở đây là **quan sát của agent trên ảnh export**, không test người dùng độc lập, không gate G2. Không đảm bảo tương phản trên mọi màn hình/điện thoại hoặc nền scene động; V5/V7 cần kiểm kích thước/alpha/color-space thật. SVG không phục hồi detail mất trong nguồn256/512px và không tuyên bố master gốc.

## Giới hạn và bàn giao

Không chạy build/lint toàn app trong V4 vì không sửa runtime và V1/V2 đang ghi source; một build ở thời điểm này không chứng minh task khác hay bản tích hợp đã pass. Script checks/decode/calibration là validation của task này. Không gắn section/UI, không browser/GPU/FPS/reverse/interaction/PWA/offline/phone/HTTPS/deploy test cho asset mới. Không image generation, không raster upscale master, không invented star coordinates/edges, không dependency mới.

V5/V7 áp dụng mapping/metadata theo [handoff.md](handoff.md); V8 nối locale/attribution và append dòng tiến độ đã chuẩn bị. Asset/hash/source/ma trận public nằm tại `public/constellations/manifest.json`; attribution phải vào runtime trước nghiệm thu tích hợp. Không tự chạy task tiếp theo hoặc ghi AGENTS trong worker scope.
