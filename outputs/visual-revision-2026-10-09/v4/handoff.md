# V4 → V5 / V7 / V8

Ngày 09/10/2026. V4 hoàn tất bộ asset/dữ liệu/check cục bộ; **chưa gắn vào runtime**, không tự thực thi V5/V7. Đọc `prompts.md` và G1 trước khi chạy hai task này.

## File bàn giao

- `public/constellations/{orion,scorpius,leo,centaurus,gemini,cygnus}.svg`: sáu path vector thật, nền trong suốt, màu #FAFAFA/#D4D4D4, không shading raster.
- `public/constellations/manifest.json`: revision, nguồn, author/license/credit/hash, viewBox, anchors, ba transform và plane của từng hình.
- `public/constellations/ATTRIBUTION.md`: notice công khai của asset. V8 cần nối credit Vi/En vào ứng dụng.
- `education-data.json`: ba entry đề xuất cho `symbolTargets.education`; không thay `schemaVersion/poolCount/logos/aiLogos/logoSource` hoặc dữ liệu Skills.
- `works-artwork.json`: mapping + artwork của ba dự án, kèm bản geometry/projection hiện có để đối chiếu. **Chỉ thêm artwork metadata khi tích hợp; không thay stars/edges/projection.**
- `contact-sheet.png`: nguồn → vector north-up → stars/line overlay và ba HIP anchor, kèm các mức opacity.
- `opacity-sheet.png`: silhouette tại 256px, opacity 8/12/25/35% trên #050505. `previews/` giữ từng bản decode.
- `check-assets.py`, `check-results.json`, `source-receipts.json`, `sources/`: nguồn và kiểm tra offline. `protected-baseline.json`/`concurrent-changes.json` phân biệt source V1/V2 thay đồng thời.

## Mapping và geometry

| Canonical ID | Chòm sao | Main / edges | Context / calibration |
|---|---|---:|---:|
| saigonUniversity | Ori / Orion | 21 / 24 | 0 / 0 |
| greenAcademy | Sco / Scorpius | 13 / 12 | 0 / 1 |
| arenaMultimedia | Leo / Leo | 9 / 10 | 0 / 0 |
| edura | Cen / Centaurus | 17 / 16 | 12 / 0 |
| veris | Gem / Gemini | 17 / 16 | 12 / 0 |
| vie | Cyg / Cygnus | 10 / 9 | 12 / 0 |

ICRS **J1991.25**, `properMotionApplied:false`, gnomonic north +Y / west +X, cùng scalar cho hai trục, z=0. Education center/radius dùng cùng quy tắc có sẵn: trung bình vector unit của main stars, radius 1.2× max angular radius (tối thiểu 4°), uniformScale=1/tan(radius). Không truy vấn thêm context Education; renderer dùng StarField sẵn có. 43 main Education stars lấy trực tiếp từ catalog; pool192 và capacity edges hiện có đủ. HIP82729 chỉ nằm trong `calibrationStars`, không ở edges/main; main pattern Scorpius dùng HIP82671 đúng metadata nguồn. Không thay 82671 bằng 82729.

Works `geometry` gồm main/context và `projection` khớp deep equality với runtime lúc bàn giao. Không cần data patch vị trí/cạnh. Nếu runtime này đã được task khác sửa, chạy checker và xử lý với đúng owner, không copy lại baseline của V4.

## Contract artwork cho renderer

Artwork đã **bake calibration và crop vào path SVG**. Tọa độ SVG y-down; geometry y-up. Đặt artwork như texture trên plane thuộc **cùng group/billboard basis, rotation, scale và pose** với stars/lines:

```js
const { plane } = artwork;
// Cùng root/group của sao; tạo tài nguyên một lần và dispose theo owner hiện có.
// PlaneGeometry(plane.width, plane.height)
// mesh.position = [plane.center[0], plane.center[1], plane.localZ]
// material.transparent = true; material.depthWrite = false
// opacity idle .10 / selected-hover-focus-touch .30 (dải .08–.12 / .25–.35)
```

`plane.width === plane.height`; center **không mặc định [0,0]**. Depth `localZ=-0.01` đặt art sau node trong local billboard. Texture loading/UV dùng convention hiện có của TextureLoader; không mirror x hoặc tự xoay SVG thêm. SVG đã north-up theo geometry. Không dùng một `PlaneGeometry(2,2)` center-fit như logo Skills: scale/center đó sẽ làm anchor lệch.

Mapping được lưu chính xác:

```text
vectorPixelToLocal × [u,v,1] → homogeneous local XY
sourcePixelToVector × [sourceX,sourceY,1] → homogeneous SVG pixel XY
sourcePixelToLocal × [sourceX,sourceY,1] → homogeneous star XY
```

Ma trận 3×3 row-major, vector cột, chia kết quả cho phần tử thứ ba. `vectorPixelToLocal` là affine: x=plane.center.x+(u/side−0.5)×width; y=plane.center.y+(0.5−v/side)×height. **Không áp dụng `sourcePixelToVector` lần hai trong runtime.** `anchors.vectorPixel` là tọa độ sau crop; không dùng lại pixel nguồn trên viewBox mới. Crop theo silhouette + ba anchor, padding 3% mỗi cạnh dài; vẫn giữ viewBox 512², Gemini256², không tuyên bố thêm độ chi tiết gốc.

Calibration dựng plane từ ba unit star rays như Stellarium `ConstellationMgr.cpp:639–641`, sau đó chiếu plane về gnomonic geometry đang dùng. Đây là projective transform, không affine center-fit. Stellarium implementation đọc vị trí J2000 từ core; bản V4 cố ý dùng vị trí catalog/runtime J1991.25 thống nhất. Không tuyên bố là screenshot Stellarium tại ngày hiện tại. Original art và metadata cùng revision; khác epoch dựng rays đã được ghi rõ.

V5 giữ SymbolStars pool dùng chung Skills/Education và prop mặc định tương thích; art của trường idle có thể là lớp art riêng cùng Canvas theo V0, không ba pool192. `calibrationStars` phục vụ kiểm căn hình; không bắt buộc render và không thêm cạnh. V7 giữ một Works renderer và canonical route/focus IDs; art phải theo cùng orbit/selection/finale snapshot với stars. Hit hull/fit cần dùng hợp của geometry + art bounds; crop art không thay layout/basis hiện có. V9 nhận cùng group, không controller artwork thứ hai.

URL hiện tại `/constellations/*.svg` portable cho Vite/Vercel root deployment của repo. Nếu thay Vite base, resolve bằng `import.meta.env.BASE_URL` và đường dẫn `constellations/<file>.svg`. Không import nguồn từ output directory vào production.

## Attribution và phần integrator còn làm

V8 nối notice đọc được Vi/En, link author, nguồn pinned, FAL1.3 artwork, CC BY-SA4.0 line pattern và ESA1997/CDS credit; giữ assets độc lập để truy cập/copy. `ATTRIBUTION.md` và mỗi SVG đã có tên tác giả, modification notice, original access và license link; public notice chưa thay cho UI credit được yêu cầu. Không sửa locale trong V4. Không cần store/producer/API mới do bộ data này.

**Catalog usage:** nguồn VizieR xác nhận scientific usage/citation; commercial usage tùy nguồn. Chưa có explicit commercial grant riêng I/239 trong nguồn đã đọc. Integrator cần xác nhận trước phát hành thương mại; không coi artwork FAL hoặc line-pattern CC BY-SA là license catalog. Không gửi yêu cầu tới bên ngoài trong task này.

V5/V7/V8 cần kiểm render SVG texture trên runtime ở kích thước thật, alpha/sRGB/resize, asset-failure fallback, union bounds/hit-region, selection/keyboard/touch và orbit/reverse. V4 chỉ chứng minh asset offline và mapping; chưa đo GPU/FPS, PWA/offline hoặc phone/HTTPS của bộ mới.

## Reproduce

Python có numpy/Pillow và Node có sharp từ workspace dependency runtime; không thêm package vào repo.

```text
python outputs/visual-revision-2026-10-09/v4/build-assets.py
node outputs/visual-revision-2026-10-09/v4/render-evidence.mjs <workspace-node-modules-directory>
python outputs/visual-revision-2026-10-09/v4/check-assets.py
```

Builder/checker/render chạy offline trên snapshot đã hash. `fetch-sources.mjs` là bước refresh chủ động, không chạy lại khi chỉ kiểm bàn giao; fresh network cần TLS system CA (`node --use-system-ca`) trong môi trường này. ReadMe HIP kế thừa snapshot R0.2 vì endpoint FTP 403 / ReadMe CGI500; epoch được kiểm lại bằng header query HIP mới, không dựa riêng snapshot cũ.

## Dòng tiến độ chờ integrator append

V4 không ghi `AGENTS.md` theo ownership worker. Append đúng một lần khi tích hợp:

```text
| 09/10/2026 | V4 — Six constellation vectors / HIP anchors | Codex | ✅ Asset/data local xong; runtime chờ V5/V7/V8 | public/constellations 6 SVG path thật + manifest/credits; sources cùng daace2, HIP ICRS J1991.25; 6/6 decode, 18/18 anchors, 24 opacity poses, source edges/Works geometry giữ nguyên; contact/opacity sheets + data/check/handoff ở outputs/visual-revision-2026-10-09/v4. Không sửa runtime/locale/AGENTS; catalog commercial grant chưa xác nhận, runtime/PWA/GPU chờ integrator. |
```
