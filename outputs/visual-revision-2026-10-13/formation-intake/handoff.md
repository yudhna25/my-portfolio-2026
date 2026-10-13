# Formation / intake — bàn giao 13/10/2026

Người dùng đã chốt Q1 A / Q2 A / Q3 B và cho triển khai. Bản chạy để review: `http://127.0.0.1:5215/`; [gallery](review.html), [kiểm chứng](verification.md), [quyết định và nguồn NASA](../../../docs/ke-hoach-formation-intake-2026-10-13.md). Phê duyệt phương án chưa phải duyệt visual G1/G2.

## Thay đổi

- Preloader: sao plasma trắng–bạc có bề mặt cuộn, lõi co sụp và vùng tối mở ra; khí nghiêng chuyển vào chính đĩa bồi tụ HDR. Camera lùi nhẹ cùng nền sao, hố đen về final-O khi PORTFOLIO xuất hiện. Presentation giữ 4,5 giây lần đầu / 2 giây khi reload đã sẵn sàng; thời gian chờ font/scene tính riêng.
- Intake: chữ, năm và control tan sớm thành hạt lấy từ hình dáng nguồn, xoắn tăng tốc về lõi. Camera dùng cùng hàm tăng tốc theo progress. Có một bản trang trí ngắn ở đầu cho mỗi nguồn, sau đó là đường hạt SVG; không nhân bản About hoặc tạo renderer mới.
- Comet: thêm nhẹ cyan, 36 hạt desktop / 18 mobile, rải dọc đuôi; giữ head, halo và đường đi lượt hai.
- Sửa lỗi phát hiện khi kiểm Back: bỏ lượt refresh trễ của intro khi route snapshot đã tự refresh/seek. Lượt refresh dư có thể làm producer thoáng về portal, đặt vùng Works inert và mất focus.

## Contract và ownership

`opening` ref vẫn do Preloader cập nhật; CameraRig, StarField và BlackHole đọc cùng pose. `uOpening` chỉ bổ sung vào bộ uniform hiện có; formation nằm trong HDR pass sẵn có. Không thay RK4, mask, render target, quality, producer hay store.

`portalFall` là hàm thuần dùng chung camera và portal growth. Hạt được lấy mẫu khi measure, seed cố định; vị trí và vệt tính trực tiếp từ p, không có simulation tích lũy. Thay đổi locale/resize dựng lại từ DOM thật. Các pool giữ inert/aria-hidden, không có ID/link/focus target.

Giữ portal 400vh, intake 0–0,44, dark core 0,44–0,50, About ejection 0,50–0,94. About thật và pha tương tác giữ nguyên. Reduced-motion/fallback bỏ opening/intake và dùng bố cục ngắn hiện có. EDURA Back không phát lại opening.

## Điểm cần người dùng review

1. Nhịp sao co sụp và chất liệu plasma; độ liền mạch khi camera lùi về chữ O.
2. Mức tan hạt sớm và xoắn mạnh của lựa chọn B; độ nét lõi khi camera áp sát.
3. Mật độ hạt cyan ở đuôi comet.

Chờ duyệt hoặc feedback G1/G2; chưa mở V9/G3. Không commit/push/deploy trong phiên này. Giữ các thay đổi dở từ lượt hai; `baseline.json` là đầu phiên này, không phải HEAD sạch. `scope.json` ghi chính xác phần mới so với baseline, `build-source.json` ghi source/dist được kiểm.

## Giới hạn

Chất liệu plasma, thời gian co sụp, chữ tan hạt và lối ra About là dàn dựng điện ảnh; không phải mô phỏng thủy động lực học hay số liệu vật lý định lượng. Không tải ảnh/video NASA vào runtime. Xem verification cho cấu hình GPU, các phép đo thực và giới hạn thiết bị.
