# Kiểm chứng từ thư mục dự án

Dùng Node và Playwright có sẵn; không thêm dependency ứng dụng. Các đường dẫn bên dưới tính từ repo, biến môi trường trỏ tới runtime kiểm tra trên máy hiện tại.

- `STELLAR_PLAYWRIGHT_MODULE`: file `index.mjs` của Playwright.
- `QA_BROWSER`: executable Chromium/Edge; mặc định Edge trên Windows.
- `QA_BASE_URL`: production preview, mặc định `http://127.0.0.1:5215`.
- `QA_LAB_URL`: dev server, mặc định `http://127.0.0.1:5214`.
- `STELLAR_FFMPEG`: FFmpeg có MJPEG decoder và VP8 encoder, dùng cho clip.

```text
npm run build
npm run lint
npm run preview -- --host 127.0.0.1 --port 5215 --strictPort
npm run dev -- --host 127.0.0.1 --port 5214 --strictPort
node outputs/visual-revision-2026-10-13/formation-intake/qa/check-motion.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/verify-browser.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/verify-extras.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/verify-opening-fallback.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/opening-lifecycle.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/opening-capture.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/measure-performance.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/capture-clips.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/write-review.mjs
node outputs/visual-revision-2026-10-13/formation-intake/qa/check-review.mjs
```

Một số script kiểm hash trong `build-source.json`; sau khi sửa source phải build và ghi fingerprint source/dist mới, không bỏ assertion để tái sử dụng báo cáo cũ. `common.mjs` tái sử dụng observer của lượt hai, đọc module đã load/Fiber root; không dựng runtime thứ hai. Scroll thật đi qua producer production. Opening capture dùng progress DOM đang chạy tự nhiên; endpoint được so bằng uniform HDR và anchor thật.

`smoke.mjs`/`smoke.json` là chẩn đoán ban đầu: handle GSAP trong bundle có thể không điều khiển timeline đang mount, nên ảnh opening không được coi là bằng chứng. Gallery chỉ dùng ảnh được `opening-capture.mjs` ghi lại từ presentation tự nhiên. `lifecycle-probe.json` giải thích geometry warm-up giảm 14→13; bộ chính kiểm số tài nguyên không tăng và ổn định ở hai vòng cuối.

Chạy Browser/FPS/clip tuần tự để tránh nhiều browser tranh GPU. Clip lấy frame CDP, timestamp thật, mã hóa 30 FPS; đó không phải số FPS render. Lab là entry dev, không tuyên bố là route production.

Các biến `QA_DISABLE_MASK`, `QA_HIDE_TRAILS`, `QA_PROFILE` chỉ dùng chẩn đoán chi phí render trong trang Browser tạm; kết quả nằm ở `diagnostics/`. Để trống chúng khi chạy số đo chấp nhận. `performance-results.json` luôn là bản đủ visual; không trộn FPS của bản tắt hiệu ứng vào gallery.
