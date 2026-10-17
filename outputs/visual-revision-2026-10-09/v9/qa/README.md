# Tái kiểm V9

Chạy từ gốc repo. Không có dependency mới trong package.json.

1. npm run build; npm run lint.
2. Chạy preview ở port5215 và dev/Lab ở5214 (npm run preview/dev với --host127.0.0.1 --port tương ứng). QA_BASE_URL có thể đổi URL preview. URL Lab trong verify-lifecycle.mjs cần sửa nếu đổi port.
3. Đặt STELLAR_PLAYWRIGHT_MODULE trỏ index.mjs của Playwright đã cài; QA_BROWSER tùy chọn trỏ browser. STELLAR_FFMPEG trỏ ffmpeg đã cài khi ghi clip. Không đặt đường dẫn máy cá nhân vào source.
4. Tạo lại build-source.json nếu source/build thay đổi, rồi chạy lần lượt:

- node outputs/visual-revision-2026-10-09/v9/qa/check-finale.mjs
- node outputs/visual-revision-2026-10-09/v9/qa/verify-finale.mjs
- node outputs/visual-revision-2026-10-09/v9/qa/verify-lifecycle.mjs
- node outputs/visual-revision-2026-10-09/v9/qa/check-fallback.mjs
- node outputs/visual-revision-2026-10-09/v9/qa/verify-pipeline.mjs
- node outputs/visual-revision-2026-10-09/v9/qa/measure-performance.mjs
- node outputs/visual-revision-2026-10-09/v9/qa/capture-clips.mjs
- node outputs/visual-revision-2026-10-09/v9/qa/check-review.mjs

Đo performance riêng, không chạy QA/clip khác cạnh tranh GPU. Không lấy tốc độ encode30fps làm render FPS. Native checkpoints đi qua scroll/Smoother API và producer thật; Lab sử dụng control hiện có để giữ progress tuyệt đối. Readback/hash không sửa shader, không thêm HDR pass.
