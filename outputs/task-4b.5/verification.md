# Báo Cáo Kiểm Tra & Hoàn Thành Task 4B.5: Cockpit Rails & Knurled Metal Switches

> **Dự án:** Portfolio Stellar Odyssey — Phase 4B  
> **Nhiệm vụ:** Task 4B.5 — Hệ thống Cockpit Rails ở hai lề biên màn hình: Vòng chia độ tiêu cự thiên văn, Telemetry HUD, Con quay hồi chuyển 3 trục (3-Axis Gyroscope Rings), Thước đo trượt dọc Calibrated Track, và Núm xoay khía kim loại (Knurled Metal Dial Switch) 45 độ  
> **Kỹ sư phụ trách:** Senior Motion Designer & SVG Craft Specialist  
> **Thời điểm xác minh:** 07/10/2026 02:11:00 (GMT+7)  
> **Trạng thái:** ✅ **HOÀN THÀNH TOÀN DIỆN (14/14 checks PASS, 0 Errors, Build 5.80s)**

---

## 1. Tóm Tắt Nhiệm Vụ & Giải Pháp Kỹ Thuật

Lấy cảm hứng từ sự cơ học quang học chính xác từng milimet của Anime.js và các thiết bị viễn thám vũ trụ cao cấp (Hasselblad/Leica & phi thuyền thám hiểm không gian):

1. **Thanh công cụ viễn thám lề trái (Left Cockpit Rail — Optical Barrel & Telemetry HUD):**
   - **Vòng chia độ tiêu cự thiên văn (Optical Lens Barrel):** SVG vector 120x120 sắc nét với 36 vạch chia độ milimet trên vành ngoài và 24 khía răng cưa trên vành xoay cơ học.
   - **Liên kết cuộn chuột (Scroll-linked Scrub):** Xoay đồng trục theo tiến trình cuộn $0^\circ \to 360^\circ$ qua GSAP.
   - **Chỉ số tiêu cự chuyển dịch mượt mà:**
     - Hero (Scroll 0.00): **18mm** (Góc rộng - Chòm Kim Ngưu)
     - About (Scroll 0.11): **30mm**
     - Skills (Scroll 0.25): **46mm $\approx$ 50mm** (Chuẩn prime - Chòm Thiên Nga)
     - Education / Experience (Scroll 0.39–0.50): **80mm $\to$ 108mm**
     - Work (Scroll 0.71): **161mm $\approx$ 200mm** (Telephoto - Chòm Thợ Săn)
     - Transmission / Contact (Scroll 0.94–1.00): **$\infty$ (Vô cực / Chân trời sự kiện Hố đen)**
   - **Telemetry HUD:**
     - Tọa độ Xích kinh / Xích vĩ (`RA / DEC`) cập nhật liên tục theo 4 tọa độ thiên văn thực tế.
     - Đồng hồ thời gian nhiệm vụ (`MET - Mission Elapsed Time`): `T+ HH:MM:SS` đếm thời gian thực.
     - Khoảng cách vũ trụ (`DIST`): `26,000 LY` $\to$ `4.2 LY` $\to$ `0.00 AU / EVENT HORIZON`.

2. **Thanh công cụ lề phải (Right Cockpit Rail — 3-Axis Gyroscope & Calibrated Track):**
   - **Con quay hồi chuyển 3 trục (3-Axis Gyroscope Gimbal):**
     - **Axis 1 (Outer Pitch Ring):** Vòng ngoài nét đứt xoay vi sai tỷ lệ $1.0\times$ ($0^\circ \to 360^\circ$).
     - **Axis 2 (Middle Roll Ring):** Vòng giữa màu Electric Cyan xoay ngược chiều tỷ lệ $-1.5\times$ ($0^\circ \to -540^\circ$).
     - **Axis 3 (Inner Yaw Core):** Lõi la bàn bên trong xoay tốc độ cao tỷ lệ $2.0\times$ ($0^\circ \to 720^\circ$) tích hợp thang đo độ nghiêng chân trời (`Pitch Ladder`) và hồng tâm quang học (`Laser Reticle`).
     - Chỉ số phương vị góc (`AZIMUTH`): Hiển thị trực tiếp từ `000°` đến `360°`.
   - **Thước đo trượt dọc Calibrated Track (Thay thế scrollbar truyền thống):**
     - Thước đo 25 vạch chia với mốc số phần trăm `[00, 25, 50, 75, 100]`.
     - Con trỏ con thoi cơ học (`Shuttle Runner`) trượt dọc chính xác từ $0\text{px}$ đến $120\text{px}$ theo tiến độ cuộn chuột, hiển thị số phần trăm số hóa `00% → 100%`.

3. **Núm xoay khía kim loại (Knurled Metal Dial Switch — [`KnurledSwitch.jsx`](file:///d:/Projects/my-portfolio-2026/src/components/ui/KnurledSwitch.jsx)):**
   - Vành khía CNC 24 răng cưa kim loại, mặt nhôm phay xước đồng tâm và rãnh chỉ thị phản quang phát sáng (`Electric Cyan`).
   - Độ nảy tactile cơ học chính xác **45 độ** (từ $-22.5^\circ$ sang $+22.5^\circ$) với hiệu ứng lò xo GSAP `back.out(2.0)`.
   - Tích hợp âm thanh click vô tuyến vi mô (`playRadioClick()`) qua Web Audio API.
   - Ứng dụng điều khiển nhanh ngay trên Cockpit Rails cho:
     - `LANG`: [VI / EN] (đồng bộ ngữ cảnh `i18n`)
     - `SOUND`: [OFF / ON] (đồng bộ `useAudioStore`)
     - `THEME`: [DARK / LIGHT] (đồng bộ `useThemeStore`)

4. **Kỷ luật Hiệu năng & Khả năng tiếp cận (Performance & Accessibility):**
   - **100% SVG Vector 2D nhẹ:** Tuyệt đối không dùng Mesh 3D, không gây sụt giảm FPS.
   - **Ẩn hoàn toàn trên Mobile (`<1024px`):** Sử dụng `hidden lg:flex`, kiểm tra 0 pixel tràn ngang (`scrollWidth === clientWidth = 390px`).
   - **Tuân thủ `prefers-reduced-motion`:** Khóa đứng yên toàn bộ các vành xoay ở góc $0^\circ$, giữ nguyên tính năng hiển thị thông số và điều khiển.

---

## 2. Bảng Đo Đạc Tọa Độ Xoay Cơ Học Tại 7 Mốc Section (Playwright CDP)

Dữ liệu đo trực tiếp trên trình duyệt Microsoft Edge Headless (1440x900):

| Mốc Section | Scroll % | Vòng Tiêu Cự (Barrel) | Vành Con Quay 1 (Outer) | Vành Con Quay 2 (Mid) | Vành Con Quay 3 (Inner) | Con Thoi Track (Y) | Tiêu Cự Hiển Thị | Tọa Độ RA / DEC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Hero** | **0%** | $0.0^\circ$ | $0.0^\circ$ | $0.0^\circ$ | $0.0^\circ$ | $0.0\text{px}$ | `18mm` | RA `04h 35m` / DEC `+16° 30'` |
| **About** | **11%** | $38.6^\circ$ | $38.6^\circ$ | $-57.8^\circ$ | $77.1^\circ$ | $12.9\text{px}$ | `30mm` | RA `04h 35m` / DEC `+16° 30'` |
| **Skills** | **25%** | $89.5^\circ$ | $89.5^\circ$ | $-134.3^\circ$ | $179.0^\circ$ | $29.8\text{px}$ | `46mm` | RA `04h 35m` / DEC `+16° 30'` |
| **Education** | **39%** | $141.5^\circ$ | $141.5^\circ$ | $-212.3^\circ$ | $283.0^\circ$ | $47.2\text{px}$ | `80mm` | RA `20h 41m` / DEC `+45° 16'` |
| **Experience**| **50%** | $178.8^\circ$ | $178.8^\circ$ | $-268.2^\circ$ | $357.7^\circ$ | $59.6\text{px}$ | `108mm` | RA `20h 41m` / DEC `+45° 16'` |
| **Work** | **71%** | $256.5^\circ$ | $256.5^\circ$ | $-384.7^\circ$ | $513.0^\circ$ | $85.5\text{px}$ | `161mm` | RA `05h 35m` / DEC `-05° 23'` |
| **Transmission**| **94%** | $339.1^\circ$ | $339.1^\circ$ | $-508.6^\circ$ | $678.2^\circ$ | $113.0\text{px}$ | **$\infty$** | RA `17h 45m` / DEC `-29° 00'` |

---

## 3. Kết Quả Đo Lường Núm Xoay Khía Kim Loại (Knurled Switch)

| Núm xoay | Trạng thái ban đầu | Góc trước click | Góc sau click | Độ nảy xoay ($\Delta$) | Giá trị đồng bộ |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **LANG (VI / EN)** | VI (`false`) | $-22.5^\circ$ | $+22.5^\circ$ | **$45.0^\circ$** | Ngôn ngữ chuyển sang `en` |
| **SOUND (OFF / ON)** | OFF (`false`) | $-22.5^\circ$ | $+22.5^\circ$ | **$45.0^\circ$** | Bật Drone âm thanh vô tuyến |
| **THEME (DARK / LIGHT)**| DARK (`false`) | $+22.5^\circ$ | $-22.5^\circ$ | **$45.0^\circ$** | Chuyển giao diện sáng/tối |

---

## 4. Kiểm Thử Hệ Thống & Bộ Chỉ Số

- **ESLint (`npm run lint`):** **0 Errors, 2 Warnings cũ** (không sinh bất kỳ lỗi mới nào).
- **Vite Build (`npm run build`):** **Thành công trong 5.80s**, PWA service worker và bundles nén sạch sẽ.
- **Kiểm thử tự động Playwright (`outputs/task-4b.5/verify.mjs`):**
  - **14/14 checks đạt chuẩn tuyệt đối (100% PASS, 0 Errors)**.
  - Tốc độ cuộn liên tục máy dev đạt **104 FPS** (trong môi trường headless render đồng thời 2 rail SVG phức tạp và WebGL full-screen).
  - Màn hình di động (390x844): `railsHidden: true`, `zeroOverflow: true` (`scrollWidth: 390 = clientWidth: 390`).
  - Chế độ giảm chuyển động (`prefers-reduced-motion`): Cả 4 vành xoay đều bị khóa cố định tại $0.0^\circ$.

---

## 5. Danh Sách Minh Chứng (Screenshots)

1. `outputs/task-4b.5/screenshot-1-desktop-hero.png` (837 KB): Giao diện Hero với hai thanh Cockpit Rails cân xứng, tiêu cự `18mm`, góc quay $0^\circ$, telemetry Taurus Sector.
2. `outputs/task-4b.5/screenshot-2-desktop-transmission.png` (991 KB): Giao diện cuối chặng Transmission bên Hố đen, tiêu cự $\infty$, khoảng cách `EVENT HORIZON`, các vành con quay xoay tối đa.
3. `outputs/task-4b.5/screenshot-3-mobile-clean.png` (1.73 MB): Giao diện di động 390px hoàn toàn ẩn thanh Cockpit Rails, hiển thị gọn gàng, 0 tràn ngang.
