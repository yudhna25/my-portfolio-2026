# V1 — cập nhật riêng năm dạng sao

09/10/2026. Thay thế đúng yêu cầu 2 theo chỉ dẫn mới của người dùng. Các phần khác của V1 giữ nguyên. Portal V3 / G1 chưa hoàn tất.

## Visual và motion

- 2026 có nền trong suốt, các chấm sao trắng nhỏ nằm trong silhouette Unbounded 800. Trường sao có seed cố định, không đổi vị trí khi render lại hoặc khi 6 chuyển thành 7. 1.500 điểm SVG được chia thành 12 nhóm phân bố ngẫu nhiên, sáng lệch nhịp; opacity .42→.95, mỗi lượt tăng/giảm 1.4–2.15s, khoảng giữ 1.8–3s. Không dùng bitmap, Canvas mới hoặc shader.
- Năm **vệt sao băng trắng** chạy liên tục trên contour: một ở mỗi số, thêm một trên vòng trong của 0. Mỗi vệt có head / wake / tail, lệch pha; một vòng 4–5.2s. Nét nền mờ .6px / opacity .24 giữ chữ số đọc được giữa các vệt. Không dùng border hộp.
- Contour vector trích từ font Unbounded Variable 800 đang cài trong repo, qua bản in vector của trình duyệt (`font-proof.pdf` / `contours.json`). Giữ viewBox 3502×832, baseline 800, advances 0 / 850 / 1785 / 2635 và tỷ lệ năm 1.6. Font parser không đi vào runtime; không thêm dependency. Font nguồn vẫn là gói Unbounded hiện có.
- Meteors/twinkle dùng cùng idle gate với glitch/decode. Khi vào portal hoặc hidden: pause và reset về đầu. Reduced-motion không tạo hai timeline và ẩn sao băng, giữ dots + viền mờ tĩnh. Unmount cleanup qua useGSAP cùng subscription/listener hiện có.
- Chu kỳ 6→7→6 **vẫn 15.8s**, cyan/orange vẫn chỉ ở fracture. Tên, role, intro, indicator, PORTFOLIO / final-O, props, i18n và portal bend cũ không thay đổi.

## Kiểm chứng

| Check | Kết quả |
|---|---|
| Build / scoped lint / repo lint | PASS; build 7.69s. Repo còn 2 warning cũ SplashCursor, 0 errors. |
| Development | **218/218**, 24 ảnh; 0 browser errors. |
| Production | **21/21**, 4 ảnh; native hover, Tab, menu Vi/En, wheel tới/lùi PASS. |
| Phạm vi / source / dist | **137/137**: Hero caller, JSX heading/O/details, portal bend, glitch và decode giữ nguyên; 128 phép so rect của content/title/year/anchor/name/role/intro/indicator với V1 trước sửa giống nhau (<.1px). |
| Viewport / locale / text | 320×568, 390×844, 1440×900, 1920×1080, Vi/En, root font 100%/200%; Hero 0px overflow; O giữ vị trí khi details cuộn. |
| Motion / accessibility | Twinkle lệch nhịp, 5 meteors / timing, chu kỳ glitch thật và seek, semantic year tĩnh 2026, SVG aria-hidden, hidden/live+fresh reduced, props/StrictMode/unmount/subscription/listener và Lab PASS. |

`browser-results.json`, `production-results.json`, `build-results.json`, `scope-results.json` lưu bằng chứng. Source đầu/cuối browser giống nhau và khớp source build. Dist production khớp hash build. Shader/quality hiện trong ảnh thuộc V2 song song; không dùng ảnh này nghiệm thu V2.

Ảnh mới:

- [1440 Vi production](screenshots/1440-production-vi.png), [1440 En production](screenshots/1440-production-en.png)
- [320 Vi](screenshots/320-vi.png), [390 En](screenshots/390-en.png), [1920 Vi](screenshots/1920-vi.png)
- [1440 reduced](screenshots/1440-reduced.png), [390 fresh reduced](screenshots/390-fresh-reduced.png)
- [Glitch giữ 7](screenshots/1440-glitch-12.5.png), [320 text200](screenshots/320-vi-text200.png), [Lab](screenshots/1440-lab.png)

## Handoff V3 và giới hạn

Thay `hero-year-dash` bằng `hero-year-meteors` và `hero-year-twinkle`. Writer lần lượt là strokeDashoffset của `[data-year-meteor] path` và opacity của `[data-year-twinkle]`; V3 chỉ intake wrapper `[data-hero-layer="year"]`, tránh ghi trực tiếp các node này. `[data-year-glyph]` nay gồm path (đổi `d`) và tspan noise (đổi text); `[data-year-digit]` / `[data-year-noise]` vẫn là hai wrapper fracture cũ. Props và `[data-story-anchor="portal"]` không đổi.

`year-stars.patch` chứa riêng thay đổi từ V1 trước sửa sang năm dạng sao; `../v1-owned.patch` được cập nhật thành toàn bộ V1 hiện tại. Cả hai đã nằm trong working tree; không áp dụng lần hai. `Hero.before.jsx`, `PortalHeading.before.jsx`, `hero.before.css` chỉ là snapshot kiểm phạm vi.

Chưa kiểm điện thoại thật, OS reduced-motion/tab hidden thật, Safari/Firefox, screen reader hoặc hiệu năng trên máy yếu. Hidden được mô phỏng bằng visibilitychange; reduced-motion qua browser emulation. Lỗi Nav/Sound tràn khi text200 đã có trước và nằm ngoài V1. Không sửa section khác, không triển khai portal V3.

Dòng AGENTS đề xuất cho integrator (không append song song):

```markdown
| 09/10/2026 | V1 — cập nhật năm dạng sao | Codex | ✅ V1 xong, chờ V3 | Chỉ PortalHeading/hero.css đổi 2026 sang star dots/twinkle +5 meteors contour Unbounded800/lap4–5.2s/viền mờ; layout/O/decode/glitch15.8s/copy/props giữ nguyên. Build/scoped/full lint pass (2 warnings cũ), Browser218 dev+21 production/28 ảnh/0 errors, scope137 pass; hidden/reduced/cleanup pass mô phỏng. outputs/visual-revision-2026-10-09/v1/year-stars/verification.md; chưa portal V3/G1/thiết bị thật. |
```
