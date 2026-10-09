# Task 4.7 — PWA / Service Worker audit

Ngày kiểm chứng: 06/10/2026. Kết quả: **✅ Xong** trong bản production local.

## Thay đổi

- `vite.config.js`: sửa manifest theo tên/màu được yêu cầu; thêm `id`, `scope`, `orientation: any`; khai báo riêng `any` và `maskable` ở cả 192px/512px. Giữ `registerType: autoUpdate`.
- Precache HTML, CSS, tất cả JS chunks, WOFF2, WebP, PNG, SVG; tắt việc thêm icon lần thứ hai vì glob đã bao gồm chúng.
- `public/pwa-maskable-192x192.png`, `public/pwa-maskable-512x512.png`: render trực tiếp từ vector của `favicon.svg`, đổi nền thành hình vuông kín `#050505`. Logo mono giữ nguyên; không phóng to một PNG nhỏ để làm bản 512px.
- `index.html`: thêm `apple-touch-icon` trỏ đến bản nền kín 192px.
- `src/main.jsx` đã có `registerSW({ immediate: true })`, dùng đúng virtual module của plugin; giữ nguyên. Không thêm cơ chế đăng ký SW khác hoặc UI cài đặt riêng.
- Giữ các thay đổi task khác đang có, gồm audit ảnh 4.8. Không sửa camera, shader hoặc component portfolio trong task này.
- AGENTS giữ đầy đủ nội dung cũ và thêm đúng một dòng 4.7. Task 4.8 đồng thời đổi newline cuối baseline từ CRLF sang LF; checker đối chiếu nội dung sau chuẩn hóa newline, không ghi lại phần cũ.

Đã đọc `frontend-design` và áp dụng vào tính nhất quán của icon mono. Không tìm thấy `clean-code/SKILL.md` sau khi tìm workspace, `.codex/skills`, `.agents/skills`, plugin cache; áp dụng quy tắc code dự án và Ponytail full. Không thêm dependency production.

## Manifest và icon

| Tiêu chí | Giá trị / kiểm chứng | Kết quả |
| --- | --- | --- |
| name | Trần Vũ Anh Duy — Stellar Odyssey | PASS |
| short_name | Anh Duy Portfolio | PASS |
| theme_color / background_color | #050505 / #050505 | PASS |
| display | standalone | PASS |
| orientation | any | PASS |
| id / start_url / scope | / / / | PASS |
| HTML link manifest | /manifest.webmanifest; một link | PASS |
| Icon any | PNG decode được, đúng 192×192 và 512×512 | PASS |
| Icon maskable | PNG decode được, đúng 192×192 và 512×512, alpha tối thiểu 255 | PASS |
| Maskable safe zone | Logo nằm trong bán kính 68.21/181.38px; giới hạn 76.8/204.8px | PASS |
| Apple touch icon | PNG nền kín, URL hợp lệ | PASS |

Icon `any` và favicon gốc được giữ nguyên. Kiểm tra maskable dựa trên ảnh đã decode từng pixel, không chỉ dựa vào tên file hoặc metadata. Quy tắc vùng an toàn là vòng tròn bán kính 40% chiều rộng. [web.dev — Maskable icons](https://web.dev/articles/maskable-icon).

## Cache

| Nhóm tài nguyên | Chiến lược | Giới hạn |
| --- | --- | --- |
| index.html, theme-init.js, CSS, toàn bộ JS chunks | Revisioned precache | Build mới cập nhật revision/hash |
| 4 WOFF2 Unbounded, gồm Vietnamese | Revisioned precache | Đều có trong SW và Cache Storage |
| Avatar, 3 project covers WebP, 5 tool PNG, favicon, 4 PWA PNG, manifest | Revisioned precache | Đều có trong SW và Cache Storage |
| Ảnh/texture cùng origin phát sinh, chưa nằm trong precache | CacheFirst | 64 entries, 30 ngày, chỉ status 200 |
| Google Fonts stylesheet | StaleWhileRevalidate | 4 entries, 7 ngày, status 200 |
| Google Fonts file | CacheFirst | 16 entries, 365 ngày, status 0/200 |

**33 URL precache duy nhất, 2,216,987 byte (~2.11 MiB)** trong build được kiểm chứng. Giữ giới hạn mặc định 2 MiB cho từng file của Workbox; không nâng trần để che tài nguyên quá lớn. Không có file bị bỏ qua trong nhóm asset yêu cầu.

Plugin hiện tại đã sinh `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches` và navigation fallback `index.html`; đã kiểm tra trong SW sinh ra. Các font Google bên ngoài chỉ được runtime-cache khi có request đi qua SW; nội dung cơ bản và font display local vẫn dùng được nếu font ngoài chưa có cache. Link Behance/CodePen/Facebook cần mạng.

Precache mặc định chỉ lấy HTML/CSS/JS nên phải mở rộng glob để có font và ảnh. [Vite PWA — Service Worker Precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache). Các chiến lược/expiration dùng API Workbox hiện có. [Workbox build](https://developer.chrome.com/docs/workbox/modules/workbox-build).

## Kiểm chứng production

- `npm run build`: PASS; sinh `dist/sw.js`, `dist/workbox-4e9e9954.js`, `dist/manifest.webmanifest`. Build log ghi 9.40s và 33 precache entries. Vẫn có cảnh báo chunk >500KB đã có từ trước.
- `npm run lint`: PASS, 0 errors; 2 warnings cũ trong `SplashCursor.jsx`.
- Chạy `npm run preview -- --host 127.0.0.1 --port 4177 --strictPort`.
- Một lượt kiểm tra trên dist thay đổi đồng thời bị timeout lúc SW install. Đã lưu snapshot production tại `site/` và chạy `npm run preview -- --host 127.0.0.1 --port 4177 --strictPort --outDir outputs/task-4.7/site` để các lượt kiểm chứng cuối có cùng build. SHA-256 SW của snapshot và dist đã đối chiếu trùng nhau.
- Sau đó chat khác tiếp tục build, làm hash dist thay đổi. Kết quả Browser cuối được khóa theo hash snapshot `189421f0de9792d99411a9417b8aa0f3eda4847a9730f2450ba7d1be3e4c37da`; checker `--snapshot --artifacts` đối chiếu đúng hash này. Dist mới nhất cũng được kiểm tra riêng về manifest/icon/độ phủ precache (`check-dist.log`, `current-dist-static-audit.json`). Dòng AGENTS ghi kết quả tại thời điểm đối chiếu, không cố định hash cho các build tương lai.

Edge Chromium **154.0.4258.53**, profile QA thường riêng biệt, không dùng profile người dùng; desktop 1440×900 và mobile viewport 390×844:

| Kiểm tra | Desktop | Mobile viewport |
| --- | --- | --- |
| Secure context localhost | PASS | PASS |
| SW activated, controller /sw.js, scope / | PASS | PASS |
| CDP Page.getAppManifest: errors=[] | PASS | PASS |
| CDP Page.getInstallabilityErrors: [] | PASS | PASS |
| Browser phát beforeinstallprompt thật | PASS | PASS |
| 33/33 URL có trong Cache Storage | PASS | PASS |
| Network Offline; navigator.onLine=false | PASS | PASS |
| Request chưa cache bị chặn | PASS | PASS |
| Tắt HTTP cache rồi reload: document status 200 từ SW | PASS | PASS |
| 8 section thông tin có trong DOM offline | PASS | PASS |
| 33/33 asset trả 200 và có dữ liệu khi offline | PASS | PASS |
| Ảnh runtime có query riêng decode được offline | PASS | PASS |
| Tất cả 57 response ghi nhận khi offline đến từ SW | PASS | PASS |
| Application exceptions | 0 | 0 |

**100% tiêu chí installability của Chromium được kiểm tra ở trên đạt.** Đây là kết quả API trình duyệt + sự kiện installability, không phải điểm Lighthouse PWA 100. Hạng mục PWA của Lighthouse đã được bỏ. [Chrome — Installability criteria](https://developer.chrome.com/blog/update-install-criteria).

Kiểm thử dùng CDP Network Offline và Playwright context offline, không mô phỏng bằng việc chỉ đổi `navigator.onLine`. Probe không cache phải thất bại; cache HTTP cũng bị tắt. Các lần thử ban đầu dùng incognito được Chromium báo `in-incognito`; đã chuyển sang profile thường riêng. Runtime image được thử bằng `Image.decode()` để request có destination=image, đúng route production.

Browser trong Codex: thêm kiểm chứng App thật khi **tắt preview server**; reload và mở lại trong tab mới vẫn có 8 sections, không có No Internet. Cuộn native làm cả 3 ảnh lazy-load dự án tải thành công, 0 console error. Browser này không có API Network Offline nên đây là phép thử origin-down bổ sung; phép thử Network Offline đầy đủ là Edge ở trên.

Chưa cài app vào Windows/Android/iOS thật; mobile ở đây là mô phỏng viewport/touch Chromium. Bản public cần HTTPS để giữ secure context như localhost trong phép thử. Không thay đổi mạng của hệ điều hành, không deploy và không dùng profile trình duyệt cá nhân.

## Chạy lại và bằng chứng

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 4177 --strictPort
node outputs/task-4.7/check.mjs --browser
```

Hoặc dùng snapshot đã kiểm chứng: preview với `--outDir outputs/task-4.7/site`, chạy checker thêm `--snapshot`. Checker dùng Sharp/Playwright của runtime Codex có sẵn và Edge cài sẵn. `--icons` tái tạo hai PNG maskable từ SVG gốc nếu cần. Profile QA tạm được đóng và xóa sau phép thử; không xóa cache/profile người dùng.

Kiểm tra lại toàn bộ bằng chứng đã lưu: `node outputs/task-4.7/check.mjs --snapshot --artifacts`. Preview snapshot hiện được để chạy trên :4177; dừng server này trước nếu muốn khởi động preview dist mặc định trên cùng cổng.

- `static-audit.json`: manifest, pixel audit, danh sách precache, SHA-256 SW.
- `browser-audit.json`: installability, registration, cache keys, offline responses và asset status của 2 viewport.
- `browser-ui-origin-down.json`, `browser-console.json`: kết quả App thật khi origin ngắt.
- `build.log`, `lint.log`, `check-static.log`, `check-browser.log`: log lệnh.
- `offline-desktop.png`, `offline-mobile.png`: ảnh từ phép thử Network Offline.
- `browser-origin-down.png`: ảnh Browser App thật khi preview đã ngắt.

![Portfolio đọc từ cache khi preview server ngắt](./browser-origin-down.png)
