# 📋 Review Phase 1 — Stellar Odyssey (Task 1.10)

Ngày: 05/10/2026 · Reviewer: Claude (Principal Engineer + Accessibility Auditor) · Branch: `feature/stellar-odyssey`

## Kết luận: **PHASE 1 — PASS** ✅ (0 Blocker, 0 Major; 6 Minor + 1 gap đã biết)

Không có vấn đề nào chặn việc sang Phase 2. Toàn bộ issue còn lại là Minor hoặc gap đã ghi nhận trong kế hoạch (Phase 4 xử lý).

---

## Bảng tổng hợp

| Task | Đạt? | Vấn đề | Mức độ | Đề xuất |
|:---|:---:|:---|:---:|:---|
| 1.1 Design System CSS | ✅ | — | — | — |
| 1.2 GSAP Setup | ✅ | — | — | — |
| 1.3 Zustand Stores | ✅ | — | — | — |
| 1.4 i18n | ✅ | — | — | — |
| 1.5 GalaxyScene | ✅ | Chunk 3D ~932KB (>500kB warning) | Minor | Task 4.9/4.10 |
| 1.6 StarField/Nebula/Hố đen | ✅ | — | — | — |
| 1.7 CameraRig | ✅ | `cameraPath(p)` tạo object mỗi frame (frozen branch gọi mỗi frame) | Minor | Hoist hằng số start pose |
| 1.8 Post-processing | ✅ | Warning THREE.Clock (thư viện Fiber, không phải code mình) | Minor | Bỏ qua / nâng cấp Fiber sau |
| 1.9 Theme Toggle | ✅ | `theme-init.js:17` null-guard meta theme-color còn thiếu | Minor | Thêm `?.` |
| (ngoài plan) 2.1 Preloader | ✅ | — | — | — |
| (ngoài plan) Visual fix + NASA ray-trace | ✅ | Mô phỏng realtime, KHÔNG phải render NASA 100% (đã tự khai báo) | Info | — |

---

## 1. Spec compliance ✅

- **Token màu 4.1**: 9 giá trị dark + light + glow khớp từng số (`src/styles/globals.css`) — kiểm chứng độc lập bằng browser: `data-theme="light"` → bg `rgb(250,250,250)` = #FAFAFA, border #666666 ✓.
- **Mono tuyệt đối**: đo pixel toàn framebuffer 3D: **0 pixel lệch màu** (|R−G|, |G−B|, |R−B| đều ≤ 6) ở cả pose đầu và cuối ✓.
- **Glow chỉ button**: UI không glow; trong 3D, SelectiveBloom chỉ chọn đĩa hố đen (không phải button nhưng là quyết định đã chốt cho scene, R3-Q2) ✓.
- **Typography 4.2**: Unbounded (dấu tiếng Việt OK — verify browser), Space Grotesk, JetBrains Mono ✓.

## 2. Kiến trúc ✅

- Cấu trúc đủ: `src/styles` · `src/stores` (4) · `src/3d` (components/hooks/shaders/utils) · `src/i18n` (config + vi/en + lab/scene namespaces) · `src/hooks` ✓.
- Zustand: store mỏng, guard hợp lệ, `applyTheme` chạm DOM đúng chỗ; CameraRig đọc bằng `getState()` không re-render ✓.
- i18n mặc định **vi** (store 'vi' → config) ✓; lab có 29 keys Vi/En riêng, parity pass ✓.
- GalaxyScene: 1 Canvas fixed z-0, lazy-load, 1 composer duy nhất (BlackHoleSystem), fallback + SceneBoundary ✓.
- BlackHole: render HDR ray image 1 lần/frame vào render target, restore state trong `finally`, dispose đầy đủ ✓.

## 3. Hiệu năng ✅ (đo thực tế)

| Phép đo | Kết quả |
|:---|:---|
| FPS lab (end pose, ray-trace 192 bước, DPR1) | **165 FPS** (telemetry `#lab-fps`) |
| Canvas homepage mount | ✅ 1 canvas, quality high |
| gl.getError() | 0 ✓ |
| Console error (homepage + lab) | 0 ✓ |
| Allocation per frame | StarField/CameraRig sạch; chỉ 1 object nhỏ từ `cameraPath()` (Minor) |
| ScrollSmoother | 1 instance (fixtures 1.2/1.5: 14/14 lifecycle) |

## 4. A11y ✅ (1 gap)

- ThemeToggle: `<button>` + `aria-label` + `title` ("Chuyển chế độ sáng/tối"), focus-visible ring đủ — verify browser: toggle dark↔light hoạt động, meta theme-color đổi, localStorage lưu ✓.
- Reduced-motion: wired ở smoother (matchMedia) + CameraRig (frozen pose `cameraPath(0)`) + BlackHole (uTime frozen) + StarField (uApproach/uTime frozen) + Preloader (rút ngắn 0.34s) ✓.
- **Gap đã biết**: chưa ai toggle trực tiếp OS reduced-motion (mọi kiểm chứng qua matchMedia mô phỏng). → Xác nhận lại ở task 4.3.
- Preloader: `role="status"` + `aria-live="polite"`, % không spam screen reader (aria-hidden trên số trang trí) ✓.

## 5. Chất lượng code ✅

- **Lint: 1 error + 2 warnings — TOÀN BỘ là WIP cũ** (`Work.jsx:111` refs-during-render; `SplashCursor` inline class ×2). Code Phase 1 **thêm 0 lỗi lint**. Lỗi Preloader cũ đã biến mất nhờ 2.1.
- Build pass (chỉ còn warning chunk size đã biết).
- Ứng xử trung thực của agent: báo cáo NASA ghi rõ "không phải render NASA gốc", kèm kiểm chứng số học độc lập (sai số energy geodesic 1.55e-4 high / 5.08e-4 medium / 2.62e-3 low) — đáng khen.

## 6. Regression ✅

- Homepage: preloader hoàn tất, WIP sections render, smooth scroll hoạt động, theme toggle hoạt động, canvas mounted, 0 console error.

## 7. Xác nhận 4 phản hồi visual của user (phiên trước)

| Phản hồi | Kết quả đo |
|:---|:---|
| Sao hội tụ về tâm | ✅ FIX — vỏ cầu theo camera, 4 góc phần tư: [17147, 16341, 18477, 14497] — cân bằng, không hội tụ |
| Sao quá to kiểu neon | ✅ FIX — kích thước ≤3.24 CSS px, falloff bậc 2, mật độ thực tế 82/15/3% |
| Camera gần hơn + lượn + hố đen bên phải | ✅ FIX — end pose: lõi đen 92,348 px (≈7.7% màn hình), centroid (968, 603) vs tâm (643, 466) → lệch PHẢI ✓; 5 nhịp weave trong cameraPath |
| Glow sai vị trí | ✅ FIX — ray image + bloom mask dùng chung dữ liệu tia (cấu trúc không thể lệch); lõi đen 92k px không bị bloom phủ |

## 8. Việc cần làm trước Phase 2 (không chặn)

1. (Tuỳ chọn) Hoist `cameraPath(0)` trong nhánh frozen của CameraRig.
2. (Tuỳ chọn) Null-guard `meta[name="theme-color"]` trong `public/theme-init.js`.
3. Nhắc lại: WIP section còn nền đục che Canvas — Hero trong suốt ở 2.5 sẽ mở toàn cảnh; không phải lỗi Phase 1.
4. OS reduced-motion thật → kiểm ở 4.3.
5. Chunk 3D 932KB → 4.9/4.10.

*Report này kèm dòng tiến độ trong AGENTS.md. Không sửa code trong phiên review.*
