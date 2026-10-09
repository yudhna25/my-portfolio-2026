# Task 3.3 + 3.4 — ShootingStars / FloatingObjects

Ngày: 06/10/2026. Hoàn thành một lần theo heartbeat đã hẹn.

Thêm hai lớp trang trí mono vào GalaxyScene dùng chung của App và 3d-lab. ShootingStars tái dùng pool 3 hạt đầu + trail, tổng 72 điểm: mỗi 4–7 giây phát 2–3 vệt trắng, sống 0.65–1 giây, không thêm bloom. FloatingObjects gồm 3 icosahedron + 3 torus nhỏ, mặt #1A1A1A, edge trắng opacity 0.18; dùng chung 2 geometry mặt + 2 geometry edge. Các hình nằm quanh mép khung hình, bob/rotation chậm bằng useFrame delta.

GalaxyScene tái dùng trạng thái visibility và reduced-motion hiện có. Trang ẩn: unmount hai lớp, frameloop never. Reduced-motion: bỏ sao băng, giữ sáu hình tĩnh. Resume bắt đầu một nhịp mới, không phát bù các burst trong thời gian ẩn. Các lớp đọc pose camera để giữ bố cục, không ghi vào camera. Không thêm dependency, composer, màu hoặc copy UI.

Files tạo/sửa: src/3d/components/ShootingStars.jsx, src/3d/components/FloatingObjects.jsx, src/3d/utils/shootingStars.js, src/3d/GalaxyScene.jsx. Task này không sửa camera/hố đen. cameraPath, StarField, BlackHoleSystem và 3d-lab.jsx giữ hash ban đầu. CameraRig, BlackHole và shader blackHole được phiên “Task chẵn” cập nhật lúc 00:31:45 UTC cho task 3.2 Contact đang chạy song song; read_thread xác nhận chính xác ba fileChange này. Giữ nguyên các phiên bản đó; protected.json giữ baseline cũ, concurrent-changes.json ghi hash trước/sau chính xác.

Áp dụng react-3d-ui, threejs-fundamentals, gsap-performance và Ponytail full. Đọc kế-hoạch.md mục 8 và scene/AGENTS hiện hành; không viết lại các hiệu ứng/camera đã có.

| Kiểm chứng | Kết quả |
|:---|:---|
| Vite production build | PASS, 5.00s ở lượt đầu; lượt cuối PASS sau sửa lint |
| ESLint toàn repo | 0 errors; 2 warnings SplashCursor cũ |
| Check CPU | Pool 2–3, timing 4–7s, fade/position hữu hạn, delta 0 và frame dài không phát backlog; 4 biên random, hơn 120s mô phỏng mỗi biên |
| Browser phiên mới | 32/32 checks PASS; 0 runtime / console error |
| Burst đo thực | Peak 2/3/2/2 hạt; khoảng cách 4.741/5.677/5.000 giây |
| Motion / visibility | Live reduced-motion: 0 meteor / hình tĩnh; 3 vòng hidden-visible: 0 frame khi ẩn; resume không backlog |
| Cleanup | 2 unmount/remount; 1 Canvas, 11 geometry / 23 texture nội bộ scene / 8 subscriber ổn định trong pose high thường |
| Camera / hố đen | 4 file giữ baseline; 3 phiên bản task 3.2 được ghi nhận và giữ nguyên, không reset |

Đo frame thực của Fiber trên Browser foreground, RTX 4060 / ANGLE D3D11 / DPR 1 / màn hình 165Hz, bloom bật:

| Scene | Viewport / tier | FPS |
|:---|:---|---:|
| GalaxyScene | 1440×900 / 24000 sao | 165.0 |
| GalaxyScene | 768×1024 / 12000 sao | 165.0 |
| GalaxyScene | 390×844 / 6000 sao | 165.0 |
| GalaxyScene — phiên cuối | 1280×720 / high, 21s | 164.9 |
| App hero | 1440×900 / 24k sao | 165.0 |
| App about | 1440×900 / 24k sao | 165.0 |
| App skills | 1440×900 / 24k sao | 165.0 |

Quan sát ảnh desktop-meteors.png (burst thật, chỉ pause fixture để chụp), tablet.png, mobile.png và app-about/app-skills.png: vệt mảnh, edge mờ, sáu hình nhỏ; sao và đĩa bồi tụ vẫn là nền chính. Viewport override đã reset sau QA.

Giới hạn: responsive được mô phỏng trên máy dev, chưa đo điện thoại thật/DPR cao hay GPU yếu. Reduced-motion và document.hidden được đổi qua fixture, chưa toggle OS trực tiếp. FPS >120 là kết quả trên cấu hình trên, không phải cam kết mọi thiết bị. Các warning cũ THREE.Clock và chunk >500KB còn. Log tích lũy session-console.json có một error createRoot từ HMR của fixture khi sửa QA; lượt chạy cuối trên tab mới qa-console.json và App tải mới app-console.json đều 0 error.

Launcher shell gặp lỗi volume G: (OS 87), nên build/lint/check chạy bằng Node child_process với đúng CLI đã cài. Chrome DevTools không tìm thấy Chrome; Browser in-app kiểm chứng render thực tế thành công. Không deploy/commit, không tạo task hay lịch chạy mới.

Chạy lại một check duy nhất: node outputs/task-3.3-3.4/check.mjs --artifacts. UI fixture: http://localhost:5173/outputs/task-3.3-3.4/qa.html. Nó dùng production GalaxyScene; App performance tái dùng fixture task 3.1 hiện có, không sửa fixture cũ.

Check hash cuối đã bắt được cập nhật task 3.2 đang chạy song song; lỗi guard ban đầu được giữ trong initial-guard-failure.json. Dòng AGENTS đầu của task đã ghi trước khi guard phát hiện concurrency; dòng bổ sung đính chính nhận định “giữ hash” cho ba file của task 3.2, không sửa/xóa dòng cũ. Bản build/lint cuối kiểm tra cây code đã tích hợp hai task.

Task 3.2 cũng thêm dòng mới vào bảng Tiến độ trước phần Commands trong AGENTS.md. Guard so prefix byte vì vậy báo khác; kiểm tra cuối giữ mọi dòng nội dung cũ đúng thứ tự và không sửa/xóa dòng cũ, cho phép thêm dòng tiến độ mới. Dòng 3.2 và cả hai dòng 3.3/3.4 đều được bảo toàn. Build bản tích hợp cuối: PASS 5.07s; lint 0 errors / 2 warnings cũ.

Kết quả cuối: check.mjs --artifacts PASS — cadence/pool/delta, hash baseline và phiên bản 3.2, 32/32 Browser, responsive/FPS/console, nội dung AGENTS cũ giữ nguyên.
