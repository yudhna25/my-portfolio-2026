# Task 2.8 — Skills / Tinh Vân Kỹ Năng

Hoàn thành 06/10/2026 trong `D:\Projects\my-portfolio-2026`.

## Thay đổi

- Tạo `src/components/sections/Skills.jsx`: heading Vi/En, ba nhóm Công cụ / Năng lực cốt lõi / Kỹ thuật, Lucide icons, mono borders, 18 tên lấy từ nội dung locale đã duyệt. Grid ba cột từ 1024px, một cột trên mobile; reveal GSAP batch / transform + opacity / `power3.out`, `useGSAP` cleanup.
- Theo lựa chọn của người dùng, 18 thanh gradient xám→trắng chỉ trang trí, không gán phần trăm hoặc trình độ. Các thanh `aria-hidden`, không có `progressbar`. Không sửa content draft hoặc giá trị `skills.technicalLevel` đang trống.
- Tạo `src/data/skills.js`: metadata dùng chung cho 10 vệ tinh và legend DOM, gồm 6 tools của `PORTFOLIO_DATA` + 4 nhãn kỹ thuật hiện có. Các nhãn i18n giữ nguyên; 8 năng lực khớp `PORTFOLIO_DATA.skills`.
- Tạo `src/3d/components/OrbitalSkills.jsx`: lõi trắng, hai vòng mảnh nghiêng và 10 octahedrons xám; 6 + 4 vệ tinh dùng hai InstancedMesh. Geometry/material do R3F quản lý; ma trận được sinh một lần lúc mount. `useFrame` dùng delta, mutate refs và tái sử dụng Three vectors/quaternions, không tạo geometry/material hoặc gọi setState mỗi frame.
- Orbital mount chỉ khi `useScrollStore.currentSection === 'skills'`; unmount/dispose khi ra section. Trong vùng Skills, `GalaxyScene` tạm thay BlackHoleSystem/bloom bằng orbital: tránh mask hố đen che hình và giảm tải GPU. Ngoài Skills, hệ hố đen/bloom hiện có trở lại. Một Canvas dùng chung, không texture / Drei Html / composer thứ hai.
- Cửa sổ DOM trong suốt cho Canvas hiện ở đúng vị trí; một DOM bounds read mỗi frame giữ model bám cửa sổ qua ScrollSmoother và resize. Cửa sổ ngoài viewport: tắt vẽ orbital và dừng quay.
- Native checkbox “Tạm dừng quỹ đạo” / “Pause orbit” có label và keyboard Space; chỉ thêm key chức năng `skills.pauseOrbit` vào hai locale. Reduced-motion giữ orbital tĩnh, không reveal tween/trigger, không smoothing.
- App gắn Skills sau About/trước Education, OrbitalSkills lazy-load vào children của GalaxyScene; bật đích Skills trong Nav/Menu. Không đổi logic loading, không tạo Canvas riêng, không thêm dependency.
- Sửa gốc lỗi reduced-motion tại `src/3d/hooks/useScrollProgress.js`: luôn đo top tương đối với `#smooth-content`, thay vì chọn công thức theo `ScrollSmoother.get()`. Khi smoother cleanup, native scroll và transform được khôi phục ở các thời điểm khác nhau; công thức cũ có thể cache sai tọa độ rồi báo Education khi DOM đang ở Skills. Tọa độ tương đối loại bỏ cả transform và native scroll, ổn định ở cả hai chế độ.

## Kết quả

- `npm run build`: PASS, gồm chunk OrbitalSkills lazy ~2.23KB. Còn cảnh báo chunk lớn hiện có (shared Fiber/events ~920KB, main ~505KB).
- `npm run lint`: PASS, 0 errors; 2 warnings cũ trong `SplashCursor.jsx` (inline class).
- `node outputs/task-2.8/check.mjs`: PASS — draft labels, 3 nhóm / 18 tên / 10 vệ tinh, data parity, locale parity, thanh không có mức độ, thứ tự App và children slot.
- `node outputs/task-2.8/check.mjs --browser`: PASS — trang App thật trên Edge + Playwright runtime có sẵn qua `http://127.0.0.1:5173/`; kết quả chi tiết trong `browser-results.json`.
- 10 poses: native Nav Skills, 320 / 390 / 768 / 1024 / 1440 / 1920, Menu chuyển En, En reduced-motion, mobile Vi reduced-motion sau reload. Ba nhóm/18 thanh/10 labels đúng ở mọi pose, không tràn ngang, core bám tâm cửa sổ <2px và toàn bộ vệ tinh nằm trong bounds. Đã xem ảnh desktop, cards và mobile.
- Native pause checkbox / keyboard Space: quay → dừng → quay. Reduced-motion: hai góc quay không đổi; 0 Skills triggers/tweens, card opacity 1 / transform none, không ScrollSmoother. Đã kiểm tra cả thay đổi media trực tiếp lẫn fresh reload.
- Ba vòng vào Skills → Education → Skills: orbital absent/present đúng; hố đen quay lại ngoài Skills; mỗi lần vào giữ 8 geometries / 0 textures / 5 subscribers, không tăng tài nguyên.
- FPS đo từ callback frame thực của Fiber trong 2 giây: 165.1fps tại Skills, high 24.000 sao, RTX 4060 / Edge ANGLE D3D11 / DPR 1. Scene gồm 8 draw calls, 1.188 triangles, 0 textures. Không dùng FPS của vòng đo requestAnimationFrame để suy ra GPU.
- Hồi quy scroll store: native reduced-motion chọn đúng 7 section chính; scene `3d-lab.html` vẫn có một Canvas + hố đen, không orbital. Reset scroll sau khi bật reduced-motion về Hero đúng; ba lần bật/tắt tại Skills không mất orbital.
- Console App phiên mới: 0 errors. Còn warning thư viện cũ `THREE.Clock deprecated`; không sửa dependency hoặc tắt cảnh báo. Smoke test riêng `3d-lab.html` có 404 `/favicon.ico` do HTML lab chưa khai báo favicon; ghi riêng `lab.errors`, không sửa prototype ngoài phạm vi task.

## Bằng chứng và giới hạn

- `browser-results.json`: poses / bounds / material / resource counts / rotation / FPS / native section mapping / lab smoke / ARIA / console.
- `skills-1440.png`, `skills-320.png`, `skills-cards.png`, `skills-en.png`, `skills-reduced-desktop.png`, `skills-mobile-reduced.png`: viewport screenshots.
- Browser Chrome DevTools plugin không chạy được vì máy không có Chrome; dùng Edge và Playwright runtime có sẵn, không cài công cụ mới.
- Reduced-motion được kiểm tra bằng Browser media emulation; chưa bật công tắc OS trực tiếp. FPS đo trên máy dev DPR 1, không suy ra tốc độ thiết bị mobile thật.
- Một bounds read DOM mỗi frame là chi phí để đồng bộ cửa sổ với transform ScrollSmoother; không đo lại cả danh sách section mỗi frame. Chưa thêm tương tác minidemo ngoài phạm vi task.

## Tài liệu API đã đối chiếu

- [Fiber useFrame / cleanup](https://r3f.docs.pmnd.rs/api/hooks)
- [Fiber performance / instancing](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
