# R3.3 — Alpha compositing trong Browser

PASS. Dùng pair cuối của `verify-interactions.mjs`, `interaction-results.json` kết thúc 2026-10-08T04:38:21.016Z. Desktop Edge viewport1440×900/DPR1; scene giữ `frameloop='never'`, cùng vị trí About. Một ảnh có portrait; ảnh kia chỉ ẩn `.avatar-img`. DOM/bối cảnh giữ nguyên theo dữ liệu PNG decoded.

Ảnh hiển thị ở rect x104, y162.125, w448, h560 (4:5). Button không border/padding; ảnh width100%/h-auto/object-contain giữ tỷ lệ source800×1000 nên rect button cũng là rect ảnh. Map pixel screenshot về alpha R0.2; bỏ vùng sát silhouette bằng guard4sourcepixel để không nhầm resampling/partial alpha.

- 158.831 pixel browser map vào vùng alpha0 an toàn: **0 pixel khác**, maxRGBdelta0.
- 1.045.120 pixel ngoài rect ảnh: **0 pixel khác**. Chữ About, hint, con trỏ và BH không đổi giữa pair.
- 69.469 pixel foreground alpha≥240 an toàn: 69.391 pixel khác (99,8877%). Các pixel áo/quần cực tối có thể trùng RGB nền; không coi là mất alpha.
- Margin trái/phải/dưới, ngoài tóc, khoảng tay/kính và khoảng hai chân đều trùng nền. Face probe RGB194→5, shirt225→5, pants26→5 khi ẩn người. Ánh sáng nền RGB6 tại margin dưới được giữ6, chứng minh ảnh không tô nền đen lên sao.

Hash pair được lưu đầy đủ trong `alpha-render-audit.json`: image `4fcfe4c67c5ddbb43f010ce920dee8babe0901344953a910378f409a9397b6f5`; background `3fe7a3ba61551f318b1ad3c34890446459320cd2324b7cdf808d60b16c379ccc`. Source hash khớp asset-audit R0.2.

Đã mở pair thật và kiểm PNG decoded bằng Pillow. Kiểm runnable: `C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe outputs/redesign/r3.3/check-alpha-render.py`.

Giới hạn: pair desktopDPR1, scene được hold để so pixel; không tuyên bố mọi frame động pixel-identical. Guard loại vùng partial/resampled alpha nên kết luận compositing nền dựa vào alpha0 an toàn, còn tóc/kính/tay và halo dùng visual review nguồn/composite riêng. Không chỉnh source/public trong audit này.
