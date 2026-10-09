# 🎨 Moodboard — Stellar Odyssey (Phase 0.1)

> Mục đích: bộ sưu tập tham chiếu trước khi code. Đã chốt qua grill-me ngày 04/10/2026.
> Cách dùng: mở từng link, xem kỹ phần ghi chú "Lấy gì", chụp screenshot vào Figma/FigJam nếu muốn.

---

## A. 4 Website tham chiếu CHÍNH

### 1. Noomo Agency — https://noomoagency.com/
**DNA:** Cinematic 3D storytelling. "Story dictates the medium" — WebGL kể chuyện, không trang trí.
**Lấy gì:**
- Camera bay có kịch bản (không phải particle vô hồn): mở trang → camera di chuyển có mục đích
- Cách 3D + typography + video hòa quyện thành một câu chuyện liền mạch
- Cảm giác "điện ảnh" qua pacing chậm, dứt khoát
- Chuyển cảnh mượt giữa các section

### 2. Anime.js — https://animejs.com/
**DNA:** Dark mode + typography khổng lồ + **live demo nhúng ngay trong trang**, scroll-synced.
**Lấy gì:**
- Heading "All-in-one animation engine." cỡ 8-15vw, text off-white trên nền đen tuyền
- Mỗi section có demo CHẠY THẬT người dùng xem/tương tác trực tiếp (đây là ý tưởng gốc cho LiveDemo component)
- Scroll progress bar tinh tế
- Code cards hiển thị cú pháp → áp dụng cho Playground
- Màu accent chỉ dùng điểm xuyết, text trắng chủ đạo

### 3. Mont-fort — https://mont-fort.com/
**DNA:** Premium corporate minimal + WebGL nền persistent + custom cursor + menu overlay có chiều sâu.
**Lấy gì:**
- **MenuOverlay fullscreen**: mở ra với transition không gian (clip-path/translateZ), link có 2 lớp text lướt khi hover
- **Custom cursor**: vòng + dot, biến thành label khi hover
- Grid 24 cột tạo cảm giác không gian (3D layout)
- Chapter-based scroll: mỗi section là một "chapter" có label
- Ít màu (1 màu brand #2D628C) → sang trọng
- WebGL nền tinh tế, không lấn át nội dung

### 4. Edolus — https://edolus.com/ (tham chiếu gốc của concept)
**DNA:** Cinematic 3D journey qua không gian (Awwwards SOTD).
**Lấy gì:** ý tưởng "du hành ngân hà theo scroll" — nền tảng concept Stellar Odyssey.

---

## B. 12 Tham chiếu bổ sung (Awwwards tier)

| # | Site | Điểm học |
|---|---|---|
| 1 | bruno-simon.com | Portfolio 3D điều khiển bằng phím — tham khảo mức độ tương tác 3D |
| 2 | locomotive.ca | Agency tiêu chuẩn Awwwards — typography, grid, motion |
| 3 | activetheory.net | WebGL storytelling đỉnh cao |
| 4 | aristidebenoist.com | Portfolio designer tối giản, scroll reveal đẹp |
| 5 | robin-noguier.com | Typography khổng lồ + scroll mượt |
| 6 | cuberto.com | Agency motion design nổi tiếng |
| 7 | resn.co.nz | WebGL sáng tạo, phá cách |
| 8 | dogstudio.co | Cinematic + 3D + storytelling |
| 9 | hyunseo.co | Portfolio designer Hàn — dark premium |
| 10 | b14.se | Award-winning agency template |
| 11 | awwwards.com/sites (SOTD) | Lọc theo tag: WebGL, Portfolio, Dark |
| 12 | godly.website | Gallery portfolio chất lượng cao |

---

## C. Nguồn asset miễn phí

| Loại | Nguồn |
|---|---|
| Ảnh nebula/galaxy/space | NASA Image Library (images.nasa.gov) — free |
| Texture star/nebula | Unsplash (tìm "nebula", "galaxy", "starfield") |
| Font Syne | Google Fonts / @fontsource/syne |
| Icons | Lucide React |
| Moodboard tool | Figma / FigJam |

---

## D. Định hướng visual (tóm tắt từ quyết định — cập nhật 04/10/2026)

- **MONO TRẮNG-ĐEN toàn bộ UI** — nền đen sâu (#050505) + text trắng (#FAFAFA) + xám trung gian
- **Glow trắng CHỈ dành cho button/CTA** — không glow card, không accent màu
- **Unbounded 600-900 cho heading khổng lồ** — hỗ trợ tiếng Việt đầy đủ (Syne bị loại vì lỗi dấu tiếng Việt)
- **3D mono**: sao trắng, tinh vân xám, **hố đen** ở cuối hành trình (chất Interstellar)
- **3D kể chuyện** — học Noomo/Edolus: camera bay có kịch bản
- **Menu overlay + custom cursor + live demos** — bộ ba khác biệt

---

## E. Việc cần làm thủ công (bạn)

- [ ] Chụp 10-15 screenshot (A + B) vào Figma/FigJam moodboard
- [ ] Duyệt color palette tại trang `/design-lab.html` (đã tạo ở 0.2)
- [ ] Duyệt type scale tại trang `/design-lab.html`
- [ ] Chọn 3-5 ảnh NASA/Unsplash làm texture nebula dự phòng (nếu shader procedural chưa đủ đẹp)
