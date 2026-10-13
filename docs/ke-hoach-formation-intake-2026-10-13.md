# Formation / intake — quyết định 13/10/2026

Người dùng yêu cầu triển khai ngay sau thống nhất và đã chọn **Q1 A / Q2 A / Q3 B** qua grill-me. Phạm vi: preloader, handoff vào Hero, hút Hero/Nav/camera, thêm nhẹ hạt cyan của comet. Các phần khác được đánh giá khá ổn; không coi đó là duyệt toàn bộ G1/G2 và không mở V9.

## Hình ảnh đã chốt

- Ngôi sao lớn trắng–bạc, bề mặt plasma cuộn và có chiều sâu. Lõi co sụp, vùng tối mở ra, khí cuốn thành đĩa bồi tụ. Dùng cùng hố đen/HDR để tiếp tục vào scene.
- Góc nhìn lùi, đổi khung nhẹ; nền sao và hố đen thay đổi đồng bộ. PORTFOLIO hiện quanh hố đen tại O cuối. Giữ thời lượng presentation 4,5 giây lần đầu / 2 giây reload sẵn sàng, readiness tính riêng.
- Chữ và Nav tan sớm thành hạt từ hình dáng nguồn; các dòng hạt xoắn tăng tốc vào lõi. Camera lao theo đường cong nhẹ. Scroll dừng thì cảnh dừng, scroll ngược hoàn nguyên.
- Comet thêm vừa phải cyan particles, phân bố cả đuôi; giữ head/halo/path đang có.

## Cơ sở tham khảo

- [NASA — Birth of a Black Hole](https://science.nasa.gov/asset/hubble/birth-of-a-black-hole/): tham khảo sao sụp mà không cần một vụ nổ lớn.
- [NASA — Black Hole’s Warped World](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/): đĩa bồi tụ, chênh lệch tốc độ chuyển động của khí, độ sáng bất đối xứng và ánh sáng bị bẻ cong.
- [NASA SVS 14576 — camera plunge](https://svs.gsfc.nasa.gov/14576/): tham khảo thay đổi khung nhìn khi camera tiến vào gần hố đen.
- [NASA SVS 20228 — tidal disruption](https://svs.gsfc.nasa.gov/20228/): tham khảo vật chất bị kéo giãn và cuốn vào dòng khí.

Website dùng plasma procedural và quỹ đạo theo progress để kể chuyện. Không phải dữ liệu mô phỏng thủy động lực học của NASA; tốc độ, kích thước, sự tan hạt của chữ và lối sang About là dụng ý điện ảnh. Không sử dụng video/ảnh NASA làm asset runtime.

## Phạm vi tích hợp và kiểm chứng

Giữ một Canvas, CameraRig, producer và HDR target/pass; ray trace ở kích thước drawing buffer hiện có. Formation thêm nhánh trong shader hiện có, không có Canvas/composer mới. Giữ final-O anchor, portal 400vh, dark rebase .44–.50 và About thật. Giữ reduced-motion/fallback, focus/skip, EDURA Back restore.

Reuse opening ref, shader noise, scroll store và các bộ kiểm hiện có. Kiểm source/hash, build/lint, opening thật, Hero tại 390/1440/1920, portal tới/lùi/dừng/rapid reverse, lifecycle/motion, Vi/En/resize, route, fallback, FPS trên GPU máy kiểm tra. Kết quả hiện tại ở [outputs/visual-revision-2026-10-13/formation-intake](../outputs/visual-revision-2026-10-13/formation-intake/).
