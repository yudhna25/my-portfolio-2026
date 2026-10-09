# Task 2.6 — About / The Navigator

Ngày: 05/10/2026 · Agent: Codex · Kết quả: hoàn tất.

## Thay đổi

- `src/components/About.jsx`: grid 12 cột (5/7 trên desktop, xếp dọc trên màn nhỏ), nền `--bg-void`, border trắng 6%; avatar WebP grayscale, border 15%, glow token trên pseudo-element opacity 10% (alpha hiệu dụng 3.5%). Không glow tools/pills.
- Heading Unbounded hai dòng, stroke dòng hai; caption JetBrains Mono, hai bio đúng draft, quote Space Grotesk 300 italic. Tất cả text/alt/title dùng `about.*`.
- `src/data.js`: đưa sáu tools vào `PORTFOLIO_DATA`; giữ nguyên skills và experience trong data. Xóa toàn bộ render/animation experience khỏi About.
- Hai locale bổ sung `about.tools` và `about.coreSkills` từ nội dung `skills` đã được duyệt. Check xác nhận thứ tự locale trùng data và mọi copy About có trong draft. Không đổi hai content draft.
- Giữ SplitText lines (autoSplit khi font/width đổi), avatar clip reveal/parallax, tools reveal và pills batch. Reveal dùng `power3.out`; parallax dùng `none` để bám vị trí cuộn. Không đăng ký plugin tại component.
- `useGSAP` scope/cleanup, `contextSafe` cho batch callbacks, dependency ngôn ngữ/reduced-motion. Heading thay node khi đổi ngôn ngữ để không xung đột DOM của SplitText. Refresh sau thay đổi chiều cao text; reduced-motion hiện nội dung ngay, không clip/parallax/reveal.

## Kiểm chứng

```powershell
npm run build
npx eslint src/components/About.jsx src/data.js
node outputs/task-2.6/check.mjs
node outputs/task-2.6/check.mjs --browser
```

- Build và lint phần sửa PASS. Lint toàn repo: 0 error, 2 warning cũ trong SplashCursor.
- Browser thực: Edge headless dùng Playwright có sẵn trong runtime Codex; không cài dependency. Chrome DevTools plugin không chạy được vì máy không có Chrome, nên dùng Edge làm fallback.
- 11 pose PASS: 320/390/768/1024/1440/1920px, bốn lượt Vi↔En và live reduced-motion. Không overflow ngang trong About; ảnh/icon tải đủ và luôn grayscale; font, stroke và quote đúng.
- Native wheel điều khiển parallax; clip mở hết, hai heading lines hiện đầy đủ. Hover pill đổi sang màu text chính; cả tám pills batch hiện đủ. Font Google tải thành công.
- Reduced-motion bỏ SplitText DOM và clip; tắt lại khôi phục hai lines. Sau các lượt đổi locale/resize/motion và cuộn qua About, chỉ còn 4 trigger liên tục, các trigger batch đã tự kết thúc; không có trigger trùng.
- Console: 0 error, 0 failed request. `THREE.Clock` deprecation là warning thư viện 3D có sẵn. Browser chạy ngoài sandbox để tải Google Fonts; lượt sandbox đầu bị chặn mạng.
- `browser-results.json` lưu pose và console. `about-{320,1440,1920}.png` là viewport phần trên; `about-{320,1440,1920}-tools.png` là viewport phần quote/tools/pills.

## Giới hạn

- Reduced-motion được mô phỏng bằng media emulation, chưa toggle OS trực tiếp.
- Giữ lớp noise và các section WIP ngoài About; chúng xuất hiện ở mép screenshot. Không sửa App, CSS global hoặc tạo Experience.jsx.
- Build vẫn báo chunk 3D lớn như baseline. Hai content draft giữ nguyên SHA256: Vi `93621A2DE2F723B1A42A216328F88024CDC0A001699D5DBA020C1AD74859D307`; En `BDB3F3C80FE2C00A69AAFB133FF6ADE7BF2EAA51D58424854181E07A7FC237A8`.
