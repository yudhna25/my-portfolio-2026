# Task 2.10 — Experience / Voyage Log

Ngày: 05/10/2026 · Agent: Codex · Kết quả: hoàn tất.

## Thay đổi

- Tạo `src/components/sections/Experience.jsx`: heading Unbounded, label Voyage Log, ba mission cards HOSANA MEDIA / UPWORK / DESIGNVELOPER. Grid ba cột từ 1024px; một cột trên mobile/tablet.
- Nền `--bg-void`, cards `--bg-surface`; border trắng 10% → hover 35%; badge outline trắng 20%. Role/period dùng JetBrains Mono, mô tả Space Grotesk và `--text-secondary` (#999). Không shadow/glow, không màu mới.
- Mọi copy từ `experience.*`; locale chỉ thêm `sectionLabel: Voyage Log` đúng prompt. Không sửa heading/positions đã duyệt. `data.js` chỉ thêm ba ID liên kết locale, giữ nguyên company/role/year/type/details.
- `App.jsx` gắn Experience ngay sau Education, trước Marquee/Work; bật mục experience trong availableSections cho Nav/Menu.
- Batch reveal x −40 / +40 / −40, 0.8s `power3.out`, stagger 0.12s. Mỗi card có trigger viewport riêng nên card cuối trên mobile chờ đúng lúc xuất hiện. `useGSAP` scope, `contextSafe`, cleanup khi đổi locale/motion; reduced-motion hiện nội dung trực tiếp.
- Section có heading/landmark, danh sách/ba article có tên; opacity reveal không loại nội dung khỏi cây accessibility. Role/badge/label tiếng Anh được đánh dấu lang. Cards không tạo focus hoặc nút giả.

## Kiểm chứng

```powershell
npm run build
npx eslint src/components/sections/Experience.jsx src/App.jsx src/data.js
node outputs/task-2.10/check.mjs
node outputs/task-2.10/check.mjs --browser
```

- Build và lint phần sửa PASS. Lint toàn repo: 0 error, 2 warning SplashCursor có sẵn. Build vẫn cảnh báo chunk 3D lớn như baseline.
- Check đối chiếu đủ ba mục với data/draft Vi và En, key parity, ID, vị trí App, không duplicate experience trong About: PASS.
- Browser thực dùng Edge headless + Playwright có sẵn trong runtime Codex; không cài dependency. Chrome DevTools plugin thiếu Chrome nên tiếp tục dùng Edge. Chạy ngoài sandbox để tải font Google hiện tại.
- 10 pose PASS: 320/390/768/1024/1440/1920px, menu En, reduced-motion desktop, mobile tải mới, reduced-motion mobile. Không overflow ngang; desktop ba cards ngang, mobile dọc; mọi field khớp locale; computed shadow none, mô tả RGB153, font Unbounded đúng.
- Native click Nav tới Experience, wheel scroll, hover border, mở menu/click En/Escape: PASS. Ba cards có trạng thái đầu x −40/+40/−40, opacity0; sau reveal opacity1/x0. Mobile tải mới xác nhận card thứ ba vẫn opacity0 khi chỉ card đầu vào viewport, sau đó từng card hiện đủ.
- Cây accessibility nhận đủ region, h2, list/3 articles/h3 và nội dung ngay cả trước visual reveal. Text #999 trên #111 có contrast khoảng 6.63:1 theo màu khai báo.
- Cleanup sau live media-change trên desktop/mobile: 0 trigger, 0 tween, opacity1, transform none. Batch hoàn tất cũng không giữ trigger. Console: 0 error; chỉ warning THREE.Clock từ thư viện 3D có sẵn.

## Bằng chứng / giới hạn

- `browser-results.json`: pose, trạng thái đầu, cây accessibility, reduced-motion và console.
- `experience-1440.png`, `experience-en.png`: desktop Vi/En; `experience-320.png` và `experience-mobile-third.png`: mobile đầu/cuối section. Dùng viewport screenshots vì capture nguyên section trong compositor có thể bỏ sót phần ngoài viewport khi smoother đang đổi trạng thái.
- Reduced-motion dùng Browser media emulation, chưa toggle OS trực tiếp; chưa chạy NVDA. Lớp noise và Marquee WIP ngoài section giữ nguyên, có thể xuất hiện ở mép ảnh.
- About không sửa: SHA256 trước/sau `6EEF203FA473565A99716E05BB1D4EC3AE0E07D2276D7A8384D56BB176FC02AA`. Hai content draft giữ nguyên hash so với đầu phiên.
