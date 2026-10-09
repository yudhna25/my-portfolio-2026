# 🌌 KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT: PHASE 4B
## AWWWARDS AESTHETIC & EXPERIENCE OVERHAUL — "STELLAR ODYSSEY"
*Bản thiết kế chiến lược & quản trị thực thi sau buổi thẩm định Grill-Me ngày 07/10/2026*

---

## 🎯 1. TỔNG QUAN CHIẾN LƯỢC & MỤC TIÊU

### 1.1 Bối cảnh & Lý do nâng cấp
Dự án **Stellar Odyssey** đã hoàn tất 100% Phase 0 $\to$ Phase 3 và hơn 60% Phase 4 (vừa vượt qua các kiểm định nghiêm ngặt về Responsive 320–1920px, 3D Quality Tiers 165 FPS, OS Reduced-Motion, WCAG 2.1 AA Keyboard & Screen Reader, SEO, PWA, và WebP CLS = 0.0000).

Tuy nhiên, để từ một sản phẩm chuẩn chỉ về mặt kỹ thuật tiến lên **đẳng cấp đoạt giải Awwwards (Site of the Day / Site of the Month / Developer Award)**, dự án cần một cú bứt phá về **Ngôn ngữ Thị giác (Visual Identity)** và **Trải nghiệm Xúc giác Số (Sensory & Tactile Experience)**. 

### 1.2 Các Trục Nâng Cấp Then Chốt (Đã chốt qua 2 vòng Grill-Me)
1. **Bảng màu:** 90% Monochrome B&W thuần khiết + 10% Quang phổ Vật lý (*Cosmic Amber* cho Hố đen & *Electric Cyan* lạnh cho viền tương tác, con trỏ, logos, ảnh).
2. **Bề mặt Kính mờ:** Chuyển toàn bộ thẻ nội dung sang **Dark Tinted Smoked Glass** (`rgba(5,5,5,0.65)` + `backdrop-blur-md` + viền mảnh `Electric Cyan` 0.5px `rgba(0,240,255,0.15)`), bảo toàn độ tương phản văn bản >7:1 (WCAG AA) đồng thời hé lộ chiều sâu của persistent 3D Canvas phía sau.
3. **Gọt giũa bố cục:** Loại bỏ hoàn toàn dải chữ chạy Marquee; Xóa bỏ section Playground độc lập để mạch truyện liền mạch; Tái phân bổ tính năng tinh hoa (`ScrollOrbitDemo` $\to$ Mission Progress Orbit; `Constellation Grid` & `Magnetic Field` $\to$ Skills & Works).
4. **Vũ trụ 3D Chân thực:** Hệ thống chòm sao hoàng đạo chuẩn thiên văn: **Kim Ngưu / Taurus (Hero)** với Pleiades & Aldebaran $\to$ **Thiên Nga / Cygnus (Skills)** $\to$ **Thợ Săn / Orion (Works)** $\to$ **Nhân Mã / Sagittarius (Contact)** bên Hố đen siêu nặng Sagittarius A*; bổ sung Vòng Einstein, Sao băng phản hồi tương tác (Reactive Meteors), và Dòng hải lưu bụi sao theo con trỏ (Stardust Wake).
5. **Cơ học Quang học Chính xác (Cảm hứng Anime.js):** 
   - Lề trái: Vòng chia độ tiêu cự thiên văn xoay đồng trục theo scroll (`18mm → 50mm → 200mm → ∞`) + Telemetry HUD (`[RA/DEC, MET]`).
   - Lề phải: Con quay hồi chuyển 3 trục (3-Axis Gyroscope Rings) xoay vi sai thay thế scrollbar.
   - Thước đo kính ngắm quang học Viewfinder & Focus Reticle trong Works (`TARGET LOCKED` + Anamorphic Lens Flare).
   - Núm xoay khía kim loại (Knurled Metal Dial Switch) cho Theme/Sound/Lang.
6. **Âm thanh Không gian Sâu:** Procedural Web Audio API (code thuần, 0 byte file ngoài) tạo nền âm drone u trầm ~45Hz + micro-haptic radio clicks/chirps; nút `SOUND [OFF/ON]`.
7. **Tương tác Không-Thời gian & Giải mã:** Thấu kính hấp dẫn (Gravitational Lensing) trên con trỏ; Giải mã tín hiệu vô tuyến (Radio Transmission Decryption) tại Contact.

---

## 📋 2. PHÂN RÃ CÔNG VIỆC CHI TIẾT (WORK BREAKDOWN STRUCTURE - WBS)

Phase 4B được chia thành 4 Wave thực thi theo thứ tự logic phụ thuộc:

```
[Wave 1: Tinh gọn Bố cục & Bảng màu Nền tảng]
   Task 4B.1: Palette & Smoked Glass ──┐
   Task 4B.2: Declutter & Playground  ──┴──► [Nền tảng layout mới sẵn sàng]

[Wave 2: Âm thanh & Nền Thiên văn 3D]
   Task 4B.3: Web Audio Engine       ──┐
   Task 4B.4: 3D Celestial System    ──┴──► [Không gian âm thanh & 3D hoàn chỉnh]

[Wave 3: Cơ học Quang học & Tương tác Chuyên sâu]
   Task 4B.5: Optical Barrel & HUD   ──┐
   Task 4B.6: Target-Lock Reticle    ──┼──► [Hệ thống cơ học & tương tác đồng bộ]
   Task 4B.7: Gravitational Lensing  ──┤
   Task 4B.8: Transmission & Skills  ──┘

[Wave 4: Nghiệm thu & Chuyển giao]
   Task 4B.9: Review Phase 4B (Visual QA, FPS, A11y, Audio Verification)
```

| Task ID | Nhiệm vụ | Trọng tâm thực thi | Ưu tiên | Giờ | Agent | Dependencies |
|:---|:---|:---|:---:|:---:|:---:|:---|
| **4B.1** | Palette & Smoked Glassmorphism | Bổ sung tokens Cosmic Amber, Electric Cyan; đổi các card sang Dark Smoked Glass `rgba(5,5,5,0.65)` + `backdrop-blur-md` | P0 | 2.5h | Codex | Phase 4A |
| **4B.2** | Layout Declutter & Playground Restructure | Gỡ bỏ 3 dải Marquee; xóa section Playground; chuyển `ScrollOrbitDemo` thành HUD Orbit; tích hợp grid/magnetic vào Skills/Works | P0 | 2.5h | Codex | 4B.1 |
| **4B.3** | Deep Space Web Audio Engine | Web Audio API procedural: ~45Hz ambient sub-bass drone + radio clicks; núm xoay `SOUND [OFF/ON]` trên Nav; 0KB file ngoài | P1 | 3h | Codex | 4B.2 |
| **4B.4** | 3D Celestial System & Zodiac Constellations | 4 chòm sao hoàng đạo chuẩn: Kim Ngưu (Hero), Thiên Nga (Skills), Thợ Săn (Works), Nhân Mã (Contact); Vòng Einstein; Sao băng phản hồi; Bụi sao theo chuột | P0 | 4h | Antigravity | 4B.1 |
| **4B.5** | Precision Optical Barrel & Cockpit Rails | Anime.js-style: Vòng chia độ tiêu cự 18mm $\to$ $\infty$ + Telemetry HUD (lề trái); Con quay hồi chuyển 3 trục Gyroscope (lề phải); Núm xoay khía kim loại | P0 | 3.5h | Antigravity | 4B.2 |
| **4B.6** | Target-Lock Viewfinder & Lens Flare | Kính ngắm quang học khóa nét tự động trong Selected Works: Reticle 4 góc `TARGET LOCKED`, vạch tiêu cự trượt, anamorphic flare | P1 | 2.5h | Codex | 4B.5 |
| **4B.7** | Interactive Gravitational Lensing | Con trỏ bẻ cong không-thời gian vi mô: SVG displacement filter kéo dãn pixel chữ và ảnh khi chuột lướt qua | P1 | 2h | Codex | 4B.5 |
| **4B.8** | Transmission Decryption & Constellation Graphs | Giải mã email từ sóng vô tuyến/nhị phân tại Contact; Mạng lưới sao liên kết vector phát sáng khi hover trong Skills | P1 | 2.5h | Codex | 4B.4 |
| **4B.9** | Review & Verification Phase 4B | Đo kiểm toàn diện: FPS $\ge 140$, WCAG contrast $\ge 7:1$, Web Audio Autoplay, responsive không vỡ lề; báo cáo `review-phase-4b.md` | P0 | 2h | Claude | 4B.1–4B.8 |

---

## 🛡️ 3. KẾ HOẠCH QUẢN TRỊ RỦI RO & PHƯƠNG ÁN DỰ PHÒNG

1. **Rủi ro tương phản chữ trên nền kính mờ:**
   - *Biện pháp:* Tấm nền Dark Tinted Smoked Glass `rgba(5, 5, 5, 0.65)` kết hợp `backdrop-blur-md` dày dặn. Thêm lớp `drop-shadow` nhẹ cho text tiêu đề. Đo kiểm tương phản tự động bằng Playwright CDP đảm bảo luôn $\ge 7:1$.
2. **Rủi ro chính sách Autoplay của trình duyệt với Web Audio:**
   - *Biện pháp:* Mặc định `isMuted = true`. Module âm thanh chỉ gọi `audioCtx.resume()` sau khi có hành động click thật sự của người dùng vào nút `SOUND [ON]` hoặc tương tác đầu tiên.
3. **Rủi ro sụt giảm FPS do nhồi nhiều chi tiết cơ học Anime.js:**
   - *Biện pháp:* Toàn bộ chi tiết cơ học (Ống kính, HUD, Reticle, Gyroscope) được làm bằng **SVG Vector 2D thuần** điều khiển qua GSAP transform/drawSVG, không tạo thêm Mesh 3D trong WebGL, giữ vững mức 140–165 FPS.
4. **Rủi ro giao diện chật chội trên Mobile:**
   - *Biện pháp:* Ẩn hoàn toàn thanh Cockpit Rails ở hai lề biên khi màn hình `<1024px`, thay thế bằng thanh tiến độ mini thanh lịch trên Nav.

---

## 📈 4. DEFINITION OF DONE & TIÊU CHÍ ĐO LƯỜNG (KPIs)

- **Definition of Done (DoD):**
  1. 100% các tính năng 4B.1 $\to$ 4B.8 chạy mượt mà, không sinh lỗi console.
  2. `npm run build` pass, không sinh chunk rác ngoài kiểm soát.
  3. `npm run lint` đạt 0 errors.
  4. Đạt chuẩn WCAG 2.1 AA (Contrast text $\ge 4.5:1$ cho body text và $\ge 7:1$ cho headings).
  5. Hỗ trợ hoàn hảo `prefers-reduced-motion` (tắt xoay cơ học, tắt lens warp, giữ tĩnh các chòm sao).
- **Chỉ số đo lường hiệu quả (KPIs):**
  - **FPS Desktop:** $\ge 140$ FPS ổn định.
  - **FPS Mobile Viewport:** $\ge 60$ FPS.
  - **Dung lượng mạng gia tăng:** $< 25$ KB gzip (nhờ dùng SVG + Web Audio API procedural thay vì assets nặng).
  - **Độ hài lòng thị giác:** Đạt chuẩn thẩm mỹ Awwwards Site of the Day.
