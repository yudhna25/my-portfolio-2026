# Living disk / star portrait — bàn giao 13/10/2026

Trạng thái: code đã tích hợp theo yêu cầu mới; dùng verification.md để xem kết quả cuối. G1/G2 vẫn chờ người dùng duyệt visual. Chưa mở V9/G3, không commit/push/deploy.

## Thay đổi và ownership

Một Agent tích hợp sở hữu toàn bộ thay đổi lần này; không có worker đang ghi file. So với baseline của phiên: 10 file hiện có được sửa, 3 file mới, 109 hash được giữ. Xem scope.json và build-source.json. Các sửa đổi chưa commit từ lượt Formation/intake trước được bảo toàn.

| Phần | Chủ sở hữu trạng thái và file |
|---|---|
| Dòng khí | BlackHole.jsx giữ diskTime bằng delta; shader blackHole.js dùng shear r^-1.5. Clock này không ghi camera/progress, pause reduced/hidden. Intro offset về 0 liên tục khi nối O. |
| Chi tiết BH | blackHole.js lọc tần số dưới pixel, thu hẹp rim, nội suy Hermite giao tia với đĩa. Target, composer, bloom/mask, RK4 budget và quality hiện có giữ nguyên. |
| Portal | StarField.jsx tăng phân lớp màn sao đẩy ra; blackHole.js thêm 3 cung mảnh theo uPortalPull. Không thêm pass/producer/camera hoặc tween hậu scroll. |
| Year | PortalHeading.jsx giữ timeline glitch/runner; hero.css dùng trắng, outline riêng chữ 7 mờ. Layout, anchor final-O và decode hiện có giữ nguyên. |
| Portrait DOM | About.jsx xuất ref node/rect/visible/morph/opacity và intent. Đo rect sau transform chỉ khi About hiển thị và motion bật. Wrapper/anchor/flow/content có sẵn giữ nguyên. |
| Portrait GPU | PortraitStars.jsx đọc ref trong useFrame, ảnh cutout có sẵn → geometry bằng portrait.js. Một Points/ShaderMaterial trong Canvas hiện có, không thêm texture GPU hay asset ảnh. App và Lab cùng dùng component, remount theo tier để dispose geometry cũ. |
| Trợ năng | About thật giữ ảnh/alt/button/label Vi–En; hover/focus/Space/touch pin. Không WebGL/reduced → ảnh gốc. about.css chỉ ẩn ảnh khi geometry sẵn sàng. |

## Contract cho lần sau

- Scroll producer/store/CameraRig/path không đổi trong lượt này. App vẫn một useScrollProgress, GalaxyScene vẫn một CameraRig và một Canvas. Portrait không ghi global store.
- Portrait geometry deterministic từ cutout; morph theo portal p=0.76..1, hoặc max với intent hover/focus/pin. Rời hover trả về trạng thái scroll; reverse trả lại cloud. Khi p=1 ảnh đã hoàn chỉnh nên hover không làm biến dạng thêm.
- Ngôi sao cloud có drift/twinkle ambient. Disk có clock ambient độc lập. So reverse bằng camera/DOM/particle paths và progress; không đòi toàn bộ pixel trùng khi khí/sao nền tiếp tục chạy. Lab story giữ freezeAmbient cho đĩa theo cấu hình hiện có.
- Cung portal mảnh chỉ có trong pha hút/đẩy, alpha mask tránh tô sáng lõi đen; không dùng blur/white flash hoặc ảnh thay thế lúc áp sát.
- Không nâng bước ray/giảm drawing buffer để chạy theo một FPS mục tiêu. Chỉ số thực đo nằm trong verification.md; các nhánh tối ưu sâu hơn cần giữ độ nét đã ưu tiên.

## Review

Mở review.html để xem hai clip và các checkpoint. Bản chạy local đang ở http://127.0.0.1:5215/; trên máy khác chạy npm run build rồi npm run preview -- --host 127.0.0.1 --port 5215. Lab chạy npm run dev -- --host 127.0.0.1 --port 5214 rồi mở /3d-lab.html?story=1.

Đĩa khí tham khảo NASA về shear/Doppler/lensing. Các cung sáng, glitch và chân dung sao là dàn dựng điện ảnh; không mô phỏng đầy đủ MHD hay vật lý bên trong chân trời sự kiện. Không tự coi kiểm kỹ thuật là duyệt thẩm mỹ.
