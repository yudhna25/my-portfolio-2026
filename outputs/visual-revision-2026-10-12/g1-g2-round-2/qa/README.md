# Chạy kiểm chứng từ thư mục dự án

Không thêm dependency cho ứng dụng. Dùng Playwright và Python/Pillow có sẵn trong môi trường kiểm tra.

Các biến môi trường:

- `STELLAR_PLAYWRIGHT_MODULE`: file `index.mjs` của Playwright đã cài.
- `QA_BROWSER`: executable của Edge/Chromium nếu khác Edge mặc định trên Windows.
- `QA_BASE_URL`: server production; mặc định `http://127.0.0.1:5215`.
- `QA_LAB_URL`: server dev; mặc định `http://127.0.0.1:5214`.
- `STELLAR_FFMPEG`: executable có decoder MJPEG/encoder VP8, cần cho clip.

```text
npm run build
npm run lint
npm run preview -- --host 127.0.0.1 --port 5215 --strictPort
npm run dev -- --host 127.0.0.1 --port 5214 --strictPort
node outputs/visual-revision-2026-10-12/g1-g2-round-2/check-motion.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/fingerprint.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/verify-browser.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/verify-extras.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/hero-matrix.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/verify-opening-fallback.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/opening-lifecycle.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/hold-glitch.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/profile-path.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/measure-performance.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/opening-native.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/capture-clips.mjs
python outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/measure-pixels.py
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/write-review.mjs
node outputs/visual-revision-2026-10-12/g1-g2-round-2/qa/check-gallery.mjs
```

Production QA đọc namespace của đúng module đã được trang tải và Fiber root đang mount. Import dùng cùng URL để giữ ESM singleton. Khi GSAP không export trực tiếp, observer đọc global timeline từ context/ScrollTrigger đã mount; không tạo timeline, camera hay renderer mới. Native scroll là producer chính; clip dùng wheel thật. Opening screenshot dùng progress đang chạy tự nhiên.

`profile-path.mjs` lấy implementation trước sửa từ Git HEAD và đối chiếu trên layout/camera đo được. Nếu HEAD đã đổi source sau commit, hãy chọn lại ref baseline trước khi chạy so sánh; phần `after` vẫn là source hiện tại.

Clip lấy frame CDP và resample theo timestamp ở 30 FPS, giữ timestamp trong `clip-results.json`; xóa JPEG trung gian sau mã hóa. 30 FPS của file video không phải FPS render. `QA_DISABLE_MASK=1` chỉ là ablation trong trang kiểm tra, ghi riêng vào `diagnostics/performance-no-mask.json`; không là bằng chứng render của build.

Lab hiện là entry dev; config production của repo chỉ build index. Các kiểm Lab ghi riêng, không tuyên bố Lab có trong deployment production. `diagnostics/` lưu bằng chứng thử nghiệm/lỗi đã sửa, không dùng làm gallery nghiệm thu.
