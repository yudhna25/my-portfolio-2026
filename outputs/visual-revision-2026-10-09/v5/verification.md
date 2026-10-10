# V5 — Education: Orion / Scorpius / Leo

09/10/2026. **Implementation và kiểm chứng local hoàn tất.** Production Education đã dùng refs/contract hiện có; không chờ wiring App hoặc store. Locale/credit, dòng tiến độ AGENTS và nghiệm thu bản tích hợp G2 bàn giao V8, chưa tự áp dụng ở worker V5.

## Phạm vi và dependency

Đã đọc AGENTS, Quy ước chung trong `prompts.md`, ownership/contract V0, handoff V3/V4 và repo skills `galaxy-portfolio`, `react-3d-ui`. G1 dựa trên xác nhận trực tiếp của người dùng trong yêu cầu V5 hiện tại; handoff V3 cũ còn ghi pending, không dùng trạng thái cũ để mở lại thiết kế.

Chỉ sửa sáu file ownership: Education.jsx, data/education.js, SkillsSymbols.jsx, SymbolStars.jsx, symbolMorph.js, symbolTargets.json. Giữ copy/năm học/layout, canonical school IDs, một SymbolStars pool192. Không sửa App/camera/producer/stores/Lab/locales/assets V4/config/dependencies/AGENTS; không thực hiện V6/V7/Git/deploy.

`baseline.json` ghi 114 hash mới ở đầu phiên, `before/` giữ sáu file trước thay đổi. `data-results.json` tại lần kiểm cuối phân biệt 6 file V5, 102 file protected không đổi và 6 file thuộc V6/V7 đang thay đổi song song. Không hoàn tác/nhận ownership các thay đổi song song. `verified-source.json` và `final-evidence.json` ghi hash sáu source cuối, build output/log; sáu source V5 ổn định giữa Browser matrix và build cuối. Build dùng working tree hiện có gồm phần song song, không phải một checkout chỉ có V5.

## Dữ liệu, artwork và alignment

| Trường / canonical ID | Chòm sao mới | Main HIP / cạnh | Ba HIP calibration artwork |
| --- | --- | --- | --- |
| SGU / saigonUniversity | Orion | 21 / 24 | 27913, 27366, 22449 |
| Green / greenAcademy | Scorpius | 13 / 12 | 78820, 85927, 82729 |
| Arena / arenaMultimedia | Leo | 9 / 10 | 57632, 49669, 47908 |

Geometry, edges, projection và artwork transform lấy nguyên pack V4 `education-data.json`. Nguồn HIP I/239/hip_main, ICRS vị trí epoch J1991.25, Johnson V, chưa áp dụng proper motion; không đổi nhãn thành J2000 hoặc ngày hiện tại. Gnomonic north +Y / west +X giữ đúng chiều V4. Scorpius HIP82671 là main node; HIP82729 chỉ calibration, không tự thêm nó vào main stars/edges.

Artwork ở sau sao với localZ=-.01, cùng billboard quaternion/basis/scale. Kiểm tra thực tế phát hiện plane có độ sâu gây lệch dưới 1px tại anchor lệch tâm; đã bù vị trí/scale theo observer ray bằng vector tái dùng, chỉ đọc camera. Không camera writer/Canvas/composer mới.

36 render poses (3 trường × 3 viewport × Vi/En × forward/reverse), mỗi pose đối chiếu 3 HIP: **108 anchor checks**, gồm **96 đối chiếu với node Float32 thực đang render** và **12 đối chiếu calibration ray HIP82729**. Sai số projection trước rasterization tối đa: artwork→star **0.0002473px**, DOM hit hull→star **0.0000511px**. Forward/reverse sai số màn hình tối đa **2.11e-12px** tại cùng visible scroll đã lượng tử hóa trong fixture. Đây là tọa độ object/camera thực, không tuyên bố GPU rasterization chính xác dưới pixel. Các số/poses nằm trong `extras-results.json`.

Hit target SVG dùng hull từ contour vertex artwork đã hiệu chuẩn + main stars, cùng radius/projection; không rectangle phủ toàn stage. Focus có viền trắng theo hull. Chi tiết hull là dữ liệu tương tác, không giả làm số liệu thiên văn.

## Ánh sáng và kiểm ảnh

Artwork idle **.10**, selected/hover/focus/touch settle **.30**. Điểm có halo và lõi riêng, cạnh có lớp quad halo 5px theo DPR với lõi trắng mảnh; Education line opacity .55, Skills giữ .12. Halo chỉ bật khi target Education có artwork, không thay mặc định của Skills. Các cạnh/node còn phân biệt, hình và nội dung không thành mảng trắng.

Đã mở ảnh render thật: 18 ảnh idle/active của ba trường ở 390/768/1440, 7 ảnh Skills sau thay đổi và fallback390 trong `screenshots/`. Hình sao khớp artwork, idle nhẹ, active sáng rõ; BH/copy/niên khóa vẫn đọc được, overflow đo 0px. Ảnh thể hiện trang hiện tại, không phải mockup. Ví dụ:

- [Orion 1440 active](screenshots/1440-saigonUniversity-active.png)
- [Scorpius 390 active](screenshots/390-greenAcademy-active.png)
- [Leo 768 active](screenshots/768-arenaMultimedia-active.png)
- [No-WebGL 390](screenshots/fallback-390.png)

## Input, reduced-motion, fallback

`browser-results.json`: **78 Education input states pass** — 390 normal/touch 29, 768 normal 23, 1440 normal 23, 390 reduced/touch 3. Bao gồm figure hover; school control/focus; Enter/Space/Escape; pointer leave không xóa focus owner; tap chọn/tap active clear; background clear; 30 rapid store switches + 12 native pointer switches; return base exact; scroll out/reverse/resize. Một active ID theo focus→selection→hover của store cũ, không thêm controller/store mới.

Reduced giữ sao/line/art tĩnh đọc được, content/control đầy đủ. Offscreen clear target và artwork callback không tiếp tục opacity ngoài vùng nhìn. Hidden dùng frameloop never hiện có; mô phỏng đồng thời document.hidden/visibilityState + visibilitychange: **0 frame và elapsed error0 trong 400ms**. Không dùng kết quả mô phỏng để khẳng định hành vi tab/OS thật.

Ép no-WebGL ngay trước load bằng getContext null: SceneFallback thật, **3 figure + 3 school controls**, school content còn đủ, chọn SGU hiện SVG DOM .30, overflow0 tại390. Ép request Orion SVG thất bại: dataset status failed, artwork map absent nhưng sao target/control/trường còn dùng được. `extras-results.json` lưu cả hai.

Phiên bình thường: **0 unexpected console/page/WebGL errors**. Hai phiên chủ động gây lỗi có **4 expected messages** (context creation/error boundary và ERR_FAILED), ghi riêng; không báo chúng là console sạch tuyệt đối.

## Skills regression và pool

Đã chụp/đọc baseline trước sửa bằng `baseline-browser.mjs`; giữ `skills-before.json`, `skills-before/`, không ghi đè baseline bằng code sau sửa. Bảy tools Figma, Photoshop, Illustrator, After Effects, Premiere, Resolve, AI đều **exactRuntimeEqual=true** sau sửa: positions/goals/weights/sizes/phase/formations/line buffers/uniform cũ/root pose/logo pose-load-visibility-opacity. Uniform Education mới bằng0 trong Skills, không tính nó như key baseline cũ. Nine logo identities/metadata giữ nguyên, AI vẫn ChatGPT/Claude/Google Antigravity.

`check-data.mjs`: **12,851 assertions pass**, gồm exact math của7 tool với160 delta frames/tool, projection/calibration V4, hull chứa main stars, edge capacity, rapid switch/return base, frozen state và ownership. Formation/return/AI algorithms giữ nguyên, không làm morph từ bầu sao nền khác.

Logo receipts R0.2 có newline conventions khác nhau: Figma/ChatGPT/Claude/Antigravity raw CRLF checkout khác receipt nhưng LF-normalized hash khớp; Photoshop/Illustrator/After Effects/Premiere raw hash khớp receipt; Resolve binary khớp. `logoReceipts` ghi cả raw/source/metadata hash. Không sửa logo hoặc tự nhận tất cả raw hashes trùng receipt lịch sử. Runtime equality không phải tuyên bố PNG pixel hash bằng nhau; ambient background có thể khác phase.

## Asset load và resources

Ba SVG V4 đều decode alpha thành texture512×512: Orion105,067 bytes; Scorpius76,034; Leo79,122 — **260,223 bytes tổng**. Asset hashes/geometry so lại V4; không sửa public assets. `resources` cũng thấy Centaurus/Gemini/Cygnus do phần Works đang được worker song song nối; không tính các thay đổi/load đó là việc V5.

Một pool/Canvas, một reusable edge glow buffer: Orion144, Scorpius72, Leo60 quad vertices (6/cạnh), trong capacity. Không tạo render target/composer/camera bổ sung. Ba vòng navigate EDURA→Back kiểm shared SymbolStars/Artwork subtree: mỗi vòng **7 geometry / 15 material / 12 texture**, đủ **34 dispose records**, reader0Canvas. Đây là tổng resource của shared renderer cùng9logo +3art, không phải 34 resource mới chỉ do Education. Kết quả/UUID dispose ở `lifecycle`.

## Lệnh và môi trường

Browser: **Edge154.0.4258.62**, ANGLE NVIDIA RTX4060/D3D11, renderer DPR1, localhost dev5185. Chrome DevTools không có Chrome khả dụng nên dùng Playwright đã cài trong bundled runtime, không cài dependency. Touch/reduced/hidden là mô phỏng. Shell sandbox mặc định lỗi MXC volume G; lệnh local chạy qua escalation được duyệt, không phải bỏ qua kiểm chứng.

```powershell
npm run dev -- --host 127.0.0.1 --port 5185
$env:STELLAR_PLAYWRIGHT_MODULE='C:\Users\PC\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright\index.mjs'
node outputs/visual-revision-2026-10-09/v5/check-data.mjs
node outputs/visual-revision-2026-10-09/v5/check-browser.mjs
node outputs/visual-revision-2026-10-09/v5/check-extras.mjs
npx eslint src/components/Education.jsx src/data/education.js src/3d/components/SkillsSymbols.jsx src/3d/components/SymbolStars.jsx src/3d/utils/symbolMorph.js
npm run build
git diff --check -- src/components/Education.jsx src/data/education.js src/3d/components/SkillsSymbols.jsx src/3d/components/SymbolStars.jsx src/3d/utils/symbolMorph.js src/3d/data/symbolTargets.json
```

Build cuối **pass4.97s**, PWA generateSW **40 entries /3210.10KiB**, có sw.js và manifest. `build-final.log` + dist hash trong `final-evidence.json`. Cảnh báo chunk>500KB có sẵn, không sửa config/dependency để che warning. Scoped lint **0error/0warning** (`scoped-lint.log` rỗng); diff whitespace check pass. Không claim full repo lint mới.

## Bàn giao và giới hạn

[handoff.md](handoff.md) có API/progress contract giữ nguyên, locale/credit patch, Lab integration note và một dòng AGENTS cho V8 append tuần tự theo ownership. Locale mới hiện có defaultValue tên riêng + tên trường đã dịch, nên không lộ key/mapping cũ; chưa merge key/credit vì worker không sở hữu locale. Không cần patch App để Education production hoạt động. Lab chưa thêm artwork/names theo task này.

Chưa kiểm điện thoại thật, OS reduced/hidden thật, screen reader, Safari/Firefox, production browser/SW offline/HTTPS/deploy; chưa đo FPS/GPU timer/nhiệt ở V5. Tài nguyên/giải phóng đã đo, không thay thành claim FPS>120. License/citation catalog gap được V4 ghi phải giải quyết trước phát hành thương mại; không giả commercial grant. G2 và bản tích hợp với V6/V7/V8 chưa tự tuyên bố pass.
