# G3 polish — 14/10/2026

G2 đã duyệt. Bản này chờ duyệt G3; không mở V10, release hoặc deploy.

## Thay đổi
- About: cùng progress ngưng tụ hiện có, từ morph 0.68 tới 1 chuyển sao sang ảnh cutout màu gốc; endpoint ảnh hoàn chỉnh và particles tắt. Scroll ngược khôi phục sao. Hover/focus/touch và reduced-motion dùng contract cũ. Không thêm ảnh trùng hoặc Canvas.
- Hero: runner của 7 opacity 1 thay 0.08; giữ trắng, giữ nhịp chạy, không phục hồi viền cố định.
- Plasma: giảm hình dẹt, thêm lớp đối lưu lớn/chi tiết nhỏ với limb shading, corona mảnh hơn, giảm lớp khí phủ; bỏ shadow vẽ riêng để horizon raytrace làm chủ lõi tối. Shader dùng chung preloader và finale.
- Biến dạng: vùng ảnh hưởng rộng hơn, thêm echo phía sau wave, tăng lensing/angular deflection. Phase/camera/collision center giữ nguyên.

## File và contract
5 source files: src/components/About.jsx, src/3d/components/PortraitStars.jsx, src/styles/about.css, src/styles/hero.css, src/3d/shaders/formation.js.

PortraitStars sở hữu --portrait-photo, tính từ cùng uMorph; about.css dùng biến cho ảnh gốc. Cleanup/reduced bỏ biến và data-stars-ready để ảnh fallback hiện ngay. Formation giữ nguyên API uniforms và timeline hiện có; không đổi HDR/RK4/quality/store/producer/path. Khí ambient tiếp tục chuyển động; Lab freeze để so render tại cùng progress.

## Review
Mở review.html cạnh file này; clip preloader, portrait, finale tới/lùi và mobile, cùng các checkpoint. Bản chạy local http://127.0.0.1:5215 và Lab http://127.0.0.1:5214/3d-lab.html?story=1 (cần server đang chạy). Xem verification.md để biết kiểm chứng và giới hạn.

Không commit/push trong phiên sửa này.

## Điểm còn lại
Intel UHD630 DPR1: plasma37.76FPS, collapse17.57FPS, Contact16.77FPS, portal25.35FPS. Chưa performance pass; ưu tiên profiling/quality ở V10 sau khi người dùng duyệt G3. Không giảm độ nét HDR trong vòng polish này.
