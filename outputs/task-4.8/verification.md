# 🖼️ BÁO CÁO KIỂM ĐỊNH TỐI ƯU HÓA HÌNH ẢNH & TÀI NGUYÊN TĨNH (TASK 4.8)
## Dự án: Stellar Odyssey · Portfolio Trần Vũ Anh Duy

- **Agent:** Web Performance & Asset Optimization Specialist
- **Ngày thực hiện:** 06/10/2026
- **Mục tiêu:** 100% hình ảnh WebP (<300KB), kích thước tường minh (`width`, `height`), container cố định aspect-ratio, `loading="lazy"` & `decoding="async"`, loại trừ hoàn toàn Cumulative Layout Shift (CLS = 0).

---

## ⚡ KẾT QUẢ TỔNG QUAN: **ĐẠT (PASS 100%)** ✅

| Chỉ số / Tiêu chí | Trước khi tối ưu (Phase 0) | Sau khi tối ưu (Task 4.8) | Đạt chuẩn? |
|:---|:---:|:---:|:---:|
| **Tổng dung lượng ảnh trong `public/` & bundle** | ~17.5 MB | **~320 KB** (-98.2%) | ✅ PASS |
| **Ảnh kích thước lớn nhất** | `project2.jpg` (11.48 MB) | `avatar.webp` (109.7 KB) | ✅ PASS (<300KB) |
| **Định dạng ảnh nội dung chính** | JPG / PNG / WebP trộn lẫn | **100% WebP** | ✅ PASS |
| **CLS (Cumulative Layout Shift) Desktop** | Chưa đo | **0.0000** (0 shifts) | ✅ PASS (= 0) |
| **CLS (Cumulative Layout Shift) Mobile** | Chưa đo | **0.0000** (0 shifts) | ✅ PASS (= 0) |
| **Khai báo `width` / `height`** | Thiếu trên `Work.jsx` | **100% thẻ `<img>` có kích thước** | ✅ PASS |
| **Container Aspect Ratio** | `aspect-[4/5]`, `aspect-[16/10]` | Bảo toàn container aspect ratio | ✅ PASS |
| **Tối ưu tải (`loading`, `decoding`)** | Thiếu `decoding="async"` ở tool icons | `loading="lazy"` + `decoding="async"` toàn bộ | ✅ PASS |
| **Alt Text chuẩn i18n** | `Work.jsx` để `alt=""` | **100% ảnh nội dung có i18n alt** | ✅ PASS |
| **`npm run build`** | Pass kèm 17MB file rác | **Pass sạch trong 7.88s, 0 cảnh báo lỗi** | ✅ PASS |
| **`npm run lint`** | 0 errors | **0 errors (giữ nguyên repo clean)** | ✅ PASS |

---

## 1. 📦 KIỂM KÊ VÀ DỌN DẸP DUNG LƯỢNG TÀI NGUYÊN

### 1.1 Loại bỏ các file ảnh gốc thừa (Legacy Raw Files)
Trước Task 4.8, thư mục `public/` còn sót lại các file ảnh gốc dung lượng lớn từ trước khi migrate sang WebP:
- `public/project2.jpg`: **11,483,789 bytes** (~11.5 MB) — ảnh 8K 7680×4320 thừa thãi
- `public/project1.jpg`: **2,336,649 bytes** (~2.3 MB) — ảnh gốc 3368×2380
- `public/avatar.png`: **2,326,468 bytes** (~2.3 MB) — ảnh PNG gốc 1337×1881
- `public/project3.jpg`: **1,063,874 bytes** (~1.06 MB) — ảnh gốc 1920×1080
- `public/vite.svg`: **1,497 bytes** — file mẫu không sử dụng

> **Hành động:** Đã chạy `git rm` xóa triệt để 5 file trên khỏi `public/`. Vite build không còn sao chép 17.2 MB file rác vào thư mục `dist/`.

### 1.2 Bảng thống kê chi tiết các hình ảnh đang phục vụ trong dự án

| File | Vai trò | Kích thước tự nhiên | Định dạng | Dung lượng đĩa | Kích thước tải qua mạng | Giới hạn spec |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| `avatar.webp` | Ảnh chân dung Navigator (About) | 800 × 1000 | WebP | **109.7 KB** | 112.4 KB | < 300 KB |
| `project1.webp` | Ảnh bìa EDURA LMS (Selected Works) | 1600 × 1131 | WebP | **49.8 KB** | 51.0 KB | < 300 KB |
| `project2.webp` | Ảnh bìa VERIS APP (Selected Works) | 1600 × 900 | WebP | **60.8 KB** | 62.3 KB | < 300 KB |
| `project3.webp` | Ảnh bìa VIE PERFUME (Selected Works) | 1600 × 900 | WebP | **42.6 KB** | 43.6 KB | < 300 KB |
| `icons/figma.png` | Icon công cụ Figma | 100 × 100 | PNG | **2.2 KB** | 2.5 KB | < 30 KB |
| `icons/ps.png` | Icon công cụ Photoshop | 100 × 100 | PNG | **3.8 KB** | 4.2 KB | < 30 KB |
| `icons/ai.png` | Icon công cụ Illustrator | 100 × 100 | PNG | **3.3 KB** | 3.7 KB | < 30 KB |
| `icons/ae.png` | Icon công cụ After Effects | 100 × 100 | PNG | **4.4 KB** | 4.9 KB | < 30 KB |
| `icons/pr.png` | Icon Premiere/DaVinci | 101 × 101 | PNG | **15.8 KB** | 16.5 KB | < 30 KB |
| `favicon.svg` | Favicon Hố đen mono | Vector SVG | SVG | **1.0 KB** | 1.3 KB | < 10 KB |
| `pwa-192x192.png` | Biểu tượng PWA App icon | 192 × 192 | PNG | **5.8 KB** | 6.0 KB | < 20 KB |
| `pwa-512x512.png` | Biểu tượng PWA Splash icon | 512 × 512 | PNG | **20.9 KB** | 21.4 KB | < 50 KB |

---

## 2. 📐 AUDIT THẺ `<img>` VÀ LOẠI TRỪ CUMULATIVE LAYOUT SHIFT (CLS)

### 2.1 Mã nguồn JSX sau khi chuẩn hóa

#### 1. Ảnh đại diện Avatar (`src/components/About.jsx:75`)
```jsx
<div className="reveal-clip avatar-wrap relative aspect-[4/5] overflow-clip border border-white/15 bg-(--bg-nebula)">
  <img
    data-speed="0.5"
    data-parallax="crop"
    src="/avatar.webp"
    alt={t('about.heading')}
    width="800"
    height="1000"
    loading="lazy"
    decoding="async"
    className="avatar-img absolute -top-[10%] h-[120%] w-full object-contain grayscale"
  />
</div>
```
- Khung container: `aspect-[4/5]` giữ chỗ cố định tỷ lệ 4:5 trước cả khi ảnh tải xong.
- Thuộc tính `width="800"` và `height="1000"` báo cho trình duyệt tỷ lệ gốc `800/1000 = 0.8`.
- `loading="lazy"` và `decoding="async"` giúp tải mượt mà không chặn luồng chính.

#### 2. Ảnh bìa các dự án (`src/components/Work.jsx:143`)
```jsx
<div data-project-image className="reveal-clip relative aspect-[16/10] overflow-clip">
  <img
    src={project.imageUrl}
    alt={t(`${path}.title`)}
    width="1600"
    height="1000"
    loading="lazy"
    decoding="async"
    className="h-full w-full object-cover"
  />
  <div aria-hidden="true" className="..." />
</div>
```
- Bổ sung `width="1600"` và `height="1000"` (tương ứng tỷ lệ 16:10 của container `aspect-[16/10]`).
- Bổ sung `alt={t(`${path}.title`)}` chuẩn i18n (thay cho `alt=""` cũ).
- Bổ sung `decoding="async"`.

#### 3. Các icon công cụ (`src/components/About.jsx:139`)
```jsx
<img
  src={tool.icon}
  alt={t(`about.tools.${tool.id}`)}
  width="32"
  height="32"
  loading="lazy"
  decoding="async"
  className="size-7 object-contain grayscale opacity-80 transition-opacity duration-200 hover:opacity-100 sm:size-8"
/>
```
- Bổ sung `decoding="async"`.
- Giữ nguyên `width="32"` và `height="32"`.

---

## 3. 🧪 ĐO LƯỜNG THỰC TẾ QUA DEVTOOLS & HEADLESS CHROMIUM

Đo lường trực tiếp trên động cơ Chromium (Microsoft Edge 133 Headless) qua Chrome DevTools Protocol (`tools/verify-images-cls.js`):

### 3.1 Môi trường Desktop (1920 × 1080)
- **Cumulative Layout Shift (CLS):** `0.0000`
- **Số lần xô lệch khung hình (Layout Shifts Count):** `0`
- **Trạng thái hiển thị:**
  - Hero vào mượt mà, Preloader đóng không gây dịch chuyển DOM.
  - Cuộn trang nhanh qua About, Works, Contact: Toàn bộ ảnh nạp ngầm (lazy loading) vào khung container đã có kích thước trước, `LayoutShift` = 0.

### 3.2 Môi trường Mobile (390 × 844, DPR 3)
- **Cumulative Layout Shift (CLS):** `0.0000`
- **Số lần xô lệch khung hình (Layout Shifts Count):** `0`
- **Trạng thái hiển thị:**
  - Mobile card xếp cột đơn 12 cột, ảnh chiếm trọn chiều rộng với tỷ lệ 16:10 (`348px × 218px`).
  - Không có hiện tượng giật khung hình hay nảy card khi ảnh tải chậm.

---

## 4. 📋 TRẠNG THÁI DEFINITION OF DONE (DOD)

- [x] Toàn bộ ảnh hiển thị đều dưới 300KB (lớn nhất là avatar 109.7KB, các cover dự án 42–60KB).
- [x] Đã xóa bỏ hoàn toàn các file ảnh gốc thừa (`project2.jpg` 11.5MB, `project1.jpg` 2.3MB, `avatar.png` 2.3MB, `project3.jpg` 1.06MB).
- [x] 100% ảnh nội dung có định dạng WebP hiện đại.
- [x] 100% thẻ `<img>` có kích thước `width` và `height` rõ ràng.
- [x] Chỉ số CLS đo được trên cả Desktop và Mobile đều bằng **0.0000**.
- [x] `npm run build` hoàn tất sạch sẽ, bundle asset tinh gọn.
- [x] `npm run lint` đạt 0 lỗi.

---

*Báo cáo được lập bởi: Web Performance & Asset Optimization Specialist*  
*Lưu trữ: `outputs/task-4.8/verification.md`*
