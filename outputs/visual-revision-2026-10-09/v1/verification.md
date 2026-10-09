# V1 — Hero typography / outline / decode / cosmic glitch

**Cập nhật mới theo người dùng:** yêu cầu 2 đã đổi thành dots sao lấp lánh + 5 sao băng chạy contour. Xem [verification hiện tại](year-stars/verification.md): 218 dev +21 production, 137 scope checks PASS; build/lint PASS. Bằng chứng và mô tả outline/dash phía dưới thuộc V1 trước cập nhật, giữ để đối chiếu. `v1-owned.patch` đã cập nhật theo source hiện tại.

09/10/2026. **V1 hoàn thành; chờ V3 tích hợp với V2. Portal mới và gate G1 chưa hoàn tất.**

Skills đã đọc và áp dụng: `tools/codex-skills/galaxy-portfolio/SKILL.md`, `tools/codex-skills/react-3d-ui/SKILL.md`. Brief mới ưu tiên ngoại lệ cyan/orange của glitch. Không thêm dependency, không redesign section khác.

## Bản được kiểm tra

Chỉ V1 sửa `src/components/Hero.jsx`, `src/components/effects/PortalHeading.jsx` và tạo `src/styles/hero.css`. Không sửa App, shader, camera, store, Cursor, Lab, locale, config hoặc package. Dòng tiến độ AGENTS chờ integrator append theo ownership song song.

`build-results.json` lưu SHA-256 của inventory V0 + ba file V1 và toàn bộ dist assets. Source không đổi trong build/lint. `browser-results.json` lưu fingerprint đầu/cuối và từng ảnh; đầu/cuối giống nhau. Shader/quality từ V2 đang có trong working tree và các ảnh App; đó là thay đổi của worker song song, không phải V1. `public/constellations/` từ V4 được giữ nguyên. Không dùng ảnh này để nghiệm thu V2 hoặc G1.

`final-integrity.json` xác nhận ba source V1 khớp bản build/browser, dist vẫn khớp fingerprint và tất cả link ảnh tồn tại. `v1-owned.patch` đã qua reverse check, chỉ chứa ba file V1. Preview production local :5182 được giữ cho xem kết quả; hai dev server kiểm thử đã dừng.

## Thay đổi

- Block gần giữa màn hình; desktop căn trái 14vw, rộng 72vw, mobile dùng khoảng trống 1rem mỗi bên. Năm phía sau heading, overlap nhẹ.
- 2026 dùng **SVG `<text>/<tspan>` với contour stroke của font Unbounded Variable 800 cài sẵn**. Fill none, stroke trắng 2px với `non-scaling-stroke` trên cả text và tspan. Không bitmap, không border hộp, không parser/font dependency. Font size hiển thị năm / heading đo được 1.5996–1.6000.
- Nét outline nền ổn định, dash sáng `12 24`, offset 0→−36, loop tuyến tính 6s. Bốn số vừa viewport.
- PORTFOLIO trắng đặc, không outline. Glyph O cuối giữ font advance nhưng trong suốt; một slot cap-height bên trong giữ `[data-story-anchor="portal"]`. H1 accessible name vẫn PORTFOLIO (9 ký tự).
- Tên dùng ScrambleText 0.6s như email khi vào Hero, pointer enter và focus. Một bản tên tĩnh cho accessibility và một ghost giữ kích thước. Role cạnh tên trên desktop / dòng riêng mobile. Dùng nguyên `hero.tagline` và `hero.subTagline`; không thêm locale.
- Chỉ số cuối: 6 giữ 12s; fracture 0.4s, đổi 7 giữa fracture; 7 giữ 3s; fracture 0.4s về 6. Tổng 15.8s. Số chính trắng; hai mảnh noise cyan/orange chỉ hiện trong fracture. Semantic year luôn 2026, SVG aria-hidden, không aria-live.
- Dash/glitch/decode chỉ chạy khi `visible && !document.hidden && portalProgress === 0`, có guard reduced-motion. Portal/hidden reset về 6, offset 0 và tên đầy đủ. Reduced-motion gỡ ba timeline, giữ nội dung tĩnh. Unmount cleanup context, listener và store subscription.
- Hero z20 để marker portal z10 không chặn hover. Name focus ring 2px đặt bên trong để không bị vùng cuộn cắt. Ở cỡ chữ lớn, chỉ vùng details (name/role/intro) cuộn; năm, heading và O không cuộn.

## Kết quả mới trong phiên

| Kiểm tra | Kết quả / giới hạn |
|---|---|
| Build cuối | PASS, Vite 7.3.6 5.36s; PWA 40 entries / 3163.14 KiB. Không kiểm offline/HTTPS. |
| Lint phần sửa | PASS, 0 lỗi/warning. |
| Lint repo | PASS, 0 errors, 2 warning cũ `SplashCursor.jsx:149/175`. |
| Development | **208/208**, 24 ảnh cuối; 0 browser errors. |
| Production | **21/21**, 4 ảnh; 0 browser errors; native hover, Tab, menu Vi→En, wheel tới/lùi. |
| Viewports / locale | 320×568, 390×844, 1440×900, 1920×1080; Vi/En; mỗi cấu hình có cỡ chữ gốc và root font 200%. |
| Layout | Hero overflow ngang 0px ở cả 16 cấu hình. Trang overflow 0px ở 8 cấu hình cỡ chữ gốc. Desktop inset 14%; role/intro/name căn đúng. |
| Text 200% | Hero không tràn. 320px: PageDown đọc hết vùng details và O rect không đổi. **Nav/Sound ngoài V1 tràn ngang**: trang +268px tại 320, +198px tại 390. Có ảnh và DOM offenders trong JSON; cần integrator sửa. Không tuyên bố toàn trang pass text scaling. |
| Decode | Enter/hover/Tab pass; tiếng Việt trả đúng dấu; accessible name tĩnh; O rect giống nhau trước/sau decode. |
| Glitch seek | 9 checkpoint tại 0/11.9/12.1/12.3/12.5/15.3/15.5/15.7/15.8; số, noise và semantic year đúng. |
| Chu kỳ thực | Fixture chạy thật: 11.513s=6, 12.729s=7, 14.948s=7, 16.266s=6 (local timeline 0.466s sau repeat). Không chỉ suy từ source hoặc seek. |
| Dash | Duration 6s; production hai mẫu offset cách 0.5s khác nhau; reset 0 khi cuộn vào portal. |
| Hidden | Mô phỏng `document.hidden` + visibilitychange: pause, reset, clock giữ 0; visible restart với đủ khoảng giữ 6. Chưa kiểm chuyển tab desktop thật. |
| Reduced | Live media emulation + fresh reduced 390px pass; không còn dash/glitch/decode timeline; giữ nội dung đọc/focus được. Chưa bật OS setting thật. |
| Cleanup | StrictMode + 3 props/visibility rebuild: mỗi ID một timeline; unmount 0 timeline V1, 0 subscription V1, listener về baseline thư viện. |
| Lab | `/3d-lab.html?story=1&chapter=hero&p=0` pass API cũ, font thật, anchor; role bỏ trống và glitch mặc định off, dash vẫn chạy. Build mặc định chưa build riêng entry Lab. |

Browser: Edge 154.0.4258.62 headless trên Windows. Production GPU: ANGLE Intel UHD Graphics 630 / D3D11. Device DPR1; 390px low tier / 1440px high tier. Mobile là viewport trên desktop, không phải điện thoại. Không benchmark FPS hoặc nhiệt trong V1. Warning THREE.Clock deprecated xuất hiện ở scene hiện có; chunk lớn 560/920KB còn nguyên phạm vi ngoài V1.

## Ảnh cuối

| Viewport | Vi | En | Chữ 200% Vi |
|---|---|---|---|
| 320 | [Ảnh](screenshots/320-vi.png) | [Ảnh](screenshots/320-en.png) | [Ảnh](screenshots/320-vi-text200.png), [PageDown / O cố định](screenshots/320-vi-text200-scrolled.png) |
| 390 | [Ảnh](screenshots/390-vi.png) | [Ảnh](screenshots/390-en.png) | [Ảnh](screenshots/390-vi-text200.png) |
| 1440 | [Ảnh](screenshots/1440-vi.png) | [Ảnh](screenshots/1440-en.png) | [Ảnh](screenshots/1440-vi-text200.png) |
| 1920 | [Ảnh](screenshots/1920-vi.png) | [Ảnh](screenshots/1920-en.png) | [Ảnh](screenshots/1920-vi-text200.png) |

Glitch: [fracture 6](screenshots/1440-glitch-12.1.png), [giữ 7](screenshots/1440-glitch-12.5.png), [fracture về 6](screenshots/1440-glitch-15.7.png). Reduced: [desktop live](screenshots/1440-reduced.png), [mobile fresh](screenshots/390-fresh-reduced.png). [Lab](screenshots/1440-lab.png).

Production: [390 Vi](screenshots/390-production-vi.png), [390 En / focus](screenshots/390-production-en.png), [1440 Vi](screenshots/1440-production-vi.png), [1440 En / focus](screenshots/1440-production-en.png).

## Reproduce / evidence

`check-build.mjs` ghi `scopedLint.log`, `lint.log`, `build.log`, `build-results.json`. `check-browser.mjs` dùng Vite local :5181 và fixture output-only để kiểm props/StrictMode/unmount; `check-production.mjs` dùng preview :5182. Cung cấp `STELLAR_PLAYWRIGHT_MODULE` trỏ module Playwright có sẵn từ runtime/catalog; không cài vào package repo.

Các lượt đầu được giữ riêng: `browser-first-attempt.json` checker đếm sai PORTFOLIO=8; lượt hai phát hiện overflow toàn trang khi tăng root font; lượt ba phát hiện marker chặn hover và đã sửa Hero z20. Lượt bốn/năm checker trả nguyên GSAP object qua browser serialization gây timeout; đã sửa callback trả void. Lượt sáu chỉ có favicon 404 của fixture; đã thêm icon hiện có. `browser-before-details-scroll.json` là lượt pass trước khi khóa O khỏi scroll details, không dùng thay lượt cuối. `initial-1440.png` và hai script inspect là chẩn đoán, không phải ảnh nghiệm thu cuối.

Build sandbox ban đầu gặp EPERM realpath ở CSS chung có sẵn; build chuẩn ngoài sandbox pass. Browser ngoài sandbox dùng dev server ngoài sandbox; server sandbox đầu không truy cập được từ browser đó. Không sửa config/source chung để né môi trường.

## Chưa kiểm chứng / bàn giao

Chưa thử điện thoại thật, OS reduced-motion thật, chuyển tab thật, screen reader thật, Safari/Firefox, browser zoom thật (200% được mô phỏng bằng root font), no-WebGL/context loss, FPS/GPU/thermal, offline/HTTPS/deploy. Chưa hoàn tất V3 portal 400vh/intake/ejection/reverse hoặc duyệt G1. Xem `handoff.md` cho writer/anchor/props và lỗi Nav text scaling ngoài ownership.
