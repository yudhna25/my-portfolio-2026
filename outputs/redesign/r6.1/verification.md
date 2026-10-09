# R6.1 — EDURA reader

08–09/10/2026 · Asia/Saigon · Codex. **Hoàn tất page với tư liệu đã xác minh; route/history chờ R6.2.** Không tuyên bố case có flow, system hoặc outcome đầy đủ khi chưa có chứng cứ.

## Phạm vi và kết quả

- Tạo default page `src/components/pages/Edura.jsx`: khung editorial mono, intro/Lead UI → vấn đề → ba quyết định UI → artifact → concept/prototype → nhìn lại. Native semantic DOM, một H1, H2/H3 đúng cấp, skip link, Vi/En, reduced-motion; chỉ intro transform/opacity qua `useGSAP` với cleanup.
- Đưa đúng ba ảnh A02/A07/A09 vào `public/projects/edura/`; nguyên màu/toàn khung, không re-encode/crop/filter. Tổng **324.276 byte**, WebP RGB **1400×989**; max CSS1280px. A02 eager, hai ảnh sau lazy, async, width/height, alt/caption Vi/En và link native tới ảnh gốc.
- Thêm **36 key/locale** dưới `.edura`; các namespace cũ giữ nguyên semantic. 8 body ready × Vi/En khớp pack; deliverables rút gọn thành concept/prototype Figma theo C04. Không APMS, Excellent UX, số liệu tác động hoặc testimonial.
- Bổ sung bối cảnh Arena và hai khó khăn từ trả lời trực tiếp của tác giả: thiếu một thành viên làm prototype chững lại, ít mẫu LMS công khai. Exact quote ở `owner-addendum.json`; không suy ra nguyên nhân, thời gian, cách khắc phục hoặc bài học.
- `onReturn` là callback slot; mặc định disabled khi chưa có handler. Behance là liên kết phụ thật. **Không tạo route, history hoặc điều hướng giả.** EDURA CTA trong Works vẫn chờ R6.2.

## Bằng chứng build và source

| Kiểm tra | Kết quả / evidence |
|:---|:---|
| Baseline hiện tại | `baseline.json` chụp trước sửa R6.1, 99 file; HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb`, staged diff hash giữ nguyên |
| Integrity | `check-reader.mjs` / `integrity.json`: 97 file cũ giữ hash, chỉ hai locale đổi; thêm một page và ba ảnh, không gỡ file. App, scene/camera/store, CSS/config/dependencies giữ baseline |
| Preview build | `npm run build` khi reader tạm được import vào existing App: **8,34s pass**, `build-preview.log` |
| Final build | Sau gỡ harness, `npm run build`: **5,56s pass**, `build-final.log`; sinh `dist/sw.js`/manifest,35 precache entries/2743,69KiB |
| Lint | Preview + final `npm run lint`: **0 error,2 warning cũ** trong SplashCursor (inline class); không thêm warning source mới |
| Source → copy/assets | `review.md`, `copy-provenance.json`, `selected-assets.json`, `check-selected-assets.py`: archive hash/decode/color pass3/3, public hash trùng archive; `check-reader.mjs` xác minh16 ready bodies,owner facts,parity,lookups và scope |
| Final shell | `check-final-smoke.mjs` / `final-smoke.json`: query preview cũ trở lại Portfolio, PORTFOLIO/1Canvas/0reader/0overflow/0console error.3 ảnh HTTP200 hash đúng và có URL precache trong SW |

Harness chỉ là branch tạm trong **App/entry/StrictMode hiện có**, không root/app/Canvas thứ hai. Đã gỡ branch/import và restore App byte-exact baseline trước build cuối. Page đã compile/chạy thật trong preview; **final production chưa import page cho route**. Đây là bàn giao có chủ đích cho R6.2.

## Browser và thị giác

Browser CUA thất bại với “trusted Node process exited unexpectedly / kernel reset”; dùng **Edge154.0.4258.62 + Playwright đã có**, không cài browser/dependency. Dev5173 và preview4173 cùng shell đã compile; mỗi context mới chặn SW để tránh cache bản cũ.

| Bộ kiểm | Kết quả |
|:---|:---|
| Dev responsive | **20/20**:320/390/768/1440/1920 × Vi/En × normal/reduced; `browser-reader-results.json` |
| Compiled responsive | **8/8**:390/1440 × Vi/En × normal/reduced; `production-reader-results.json` |
| Đọc/thao tác | Tổng224 Tab records +210 vị trí đọc native wheel. Skip Enter focus main, hai Return Enter và tap/click gọi callback; locale đổi bằng nút thật. Target≥44px, focus outline2px |
| Layout/type | Đầu/cuối/các vị trí đọc overflow0; prose16–18px, intro18–24px, line-height≥1,4. 1main/1H1, cấp heading đúng; ảnh đúng intrinsic aspect/no layout crop |
| Ảnh/lazy |3/3 decode1400×989/filter none/object-fit contain/màu thật. Native lazy prefetch2 ảnh ban đầu, cuộn tải đủ3; không giả định lazy chỉ1request lúc load |
| Reduced/scene | DOM/copy/ảnh/controls đủ khi reduced; **0Canvas trong reader**. Đây chưa là phép thử pause/resume scene qua route R6.2 |
| Console |0 pageerror/console error cả28 config. Dev warning0; compiled8 warnings do chủ động chặn SW (“Service Worker registration blocked by Playwright”) |
| Cleanup | `check-lifecycle.mjs` / `lifecycle.json`:3 StrictMode mount/unmount, hủy intro đang chạy sau50ms →0 reader tween;3 live reduced on/off;0Canvas/0error. Hai delayed-call function của plugin GSAP toàn cục ghi riêng, không nhầm là tween reader còn sót |

Đã mở render thật1440/390 đầu/cuối và full-page mobile; ảnh màu lớn, chữ/caption editorial rõ. Screenshot đầy đủ16 file trong `screenshots/`: `browser-reader-*` và `production-reader-*`, mỗi bộ390/1440 Vi/En normal/reduced. Đây là render JSX, không phải ảnh storyboard R1.1.

**CLS cold load không bằng0:** dev **0,0003983539–0,0369638175**, compiled **0,0072641627–0,0367171842**, trước tương tác. Initial luôn Vi bootstrap; En được đổi bằng native button rồi kiểm reader En. Raw layout-shift entries giữ trong JSON; source P/DIV/FIGURE, chưa tách được nguyên nhân font/CSS chỉ từ log này. Không xóa entry hay tuyên bố CLS0. Ảnh width/height giữ đúng và mọi lượt cuộn không tràn.

## Thiếu đầu vào / giới hạn

- `gaps.md`: chưa có video/flow URL, system/rationale chi tiết, test/impact metric hoặc lời tác giả về action/lesson/recovery. Phần nhìn lại chỉ hai constraint đã xác nhận; không có placeholder công khai. R0.3 pack giữ nguyên.
- Đã thử đúng hồ sơ Behance241524417 bằng web reader và Edge: cache miss/HTTP403,0 usable module/video mới (`source-access.*`). Không lấy dự án giống tên hoặc APMS thay thế.
- Chữ đốt trong slide nhỏ trên phone; DOM summary/caption là phần đọc, link ảnh gốc cung cấp chi tiết. Nguồn1400px không chứng minh sắc nét2× ở CSS1280px.
- Chưa kiểm điện thoại/screen reader/OS reduced thật, live Behance200, route/deep-link/Back/scroll-focus restore/metadata/reader offline/PWA installability. Các tích hợp route và pause main scene thuộc **R6.2**. Không cài thư viện, deploy hay đăng Behance.
- Warning chunk>500KB/THREE.Clock là hạ tầng cũ; smoke main có Clock warning. SW warning trong test do chủ động block; không xem là lỗi registration thực.

## Chạy lại và bàn giao

```powershell
node outputs/redesign/r6.1/check-reader.mjs
& 'C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' outputs/redesign/r6.1/check-selected-assets.py
npm run build
npm run lint
node outputs/redesign/r6.1/check-final-smoke.mjs
```

Browser reader cần branch preview tạm, vì task này chưa có route:

```powershell
node outputs/redesign/r6.1/preview-switch.mjs on
npm run dev -- --host 127.0.0.1
node outputs/redesign/r6.1/verify-reader-browser.mjs
node outputs/redesign/r6.1/check-lifecycle.mjs
npm run build
npm run preview -- --host 127.0.0.1
node outputs/redesign/r6.1/verify-reader-browser.mjs http://127.0.0.1:4173 --subset
node outputs/redesign/r6.1/preview-switch.mjs off
npm run build
node outputs/redesign/r6.1/check-reader.mjs
```

Dùng server đã chạy nếu cổng đang bận; dev/preview là process riêng. **Không chạy lại capture-baseline.mjs để biến baseline cũ thành mới.** Preview helper assert App restore đúng baseline; nếu App đã được sửa ở task sau, không dùng helper này để hoàn tác thay đổi mới.

Các lỗi checker đã xử lý: request-log URL string bị gọi như function; git diff buffer1MiB không đủ staged ảnh cũ; lifecycle ban đầu đếm cả delayed calls plugin. Các lượt final chạy sau sửa checker, không thay source để chiều test.

Handoff thật ở `handoff.md`: default export/callback/DOM IDs, namespace,3asset paths, ownership và restore contract Works từ R5.2. Append một dòng R6.1 vào Tiến độ AGENTS; không thực hiện R6.2.
