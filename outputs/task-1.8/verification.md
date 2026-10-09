# Task 1.8 — Post-processing

Ngày: 05/10/2026. Thay đổi production: `src/3d/GalaxyScene.jsx`.

## Kết quả

- Thêm một `EffectComposer multisampling={0}`; `enableBloom` mặc định `true`.
- `enableBloom={false}` tháo composer và ambient light, giải phóng các render targets.
- Giữ nguyên Bloom prototype: intensity **0.7**, luminanceThreshold **0.85**, luminanceSmoothing **0.1**, radius **0.75**, **mipmapBlur**.
- Dùng `Selection` / `Select` / `SelectiveBloom` để chỉ bốn mesh của BlackHole tham gia bloom. Với Bloom toàn cảnh, sao trắng cũng vượt threshold 0.85. SelectiveBloom dùng cùng Bloom effect/thông số và giải quyết yêu cầu giới hạn glow.
- Light ref và mảng lights giữ ổn định qua render. Ambient light là yêu cầu của API SelectiveBloom; các material procedural/basic hiện tại không dùng lighting. Không tạo composer trong useFrame.
- Không đổi StarField, Nebula, BlackHole, CameraRig hoặc prototype: SHA-256 trước/sau khớp cả năm file (`unchanged-files.json`). Giữ quỹ đạo camera 0 → -100 và nebula sau hố đen của bản sửa OpenCode.

## Quyết định Chromatic Aberration

Đã thử offset `[0.0008, 0.0008]`, radialModulation, modulationOffset 0.5. Ảnh `candidate-ca-on.png` có viền xanh/đỏ ở sao vùng rìa. Readback có 83.731 pixel lệch màu, 54.915 tại rìa, trong framebuffer 1091×930. Bỏ Chromatic Aberration theo ngoại lệ người dùng cho phép, để giữ mono tuyệt đối. Bản cuối: **0 pixel lệch màu** (max RGB − min RGB > 4) khi bật/tắt Bloom.

## Kiểm tra

- `npm run build`: **pass** (Vite + PWA). Vẫn có cảnh báo bundle lớn >500 kB; không phải lỗi build.
- `npx eslint src/3d/GalaxyScene.jsx`: **pass**.
- `npm ls @react-three/postprocessing postprocessing three @react-three/fiber`: **pass**, không lỗi peer dependency.
- Browser dev server `http://localhost:5173`, fixture `outputs/task-1.8/post-qa.html` dùng GalaxyScene, CameraRig, ScrollSmoother và scroll store thật; nội dung fixture trong suốt để xem Canvas.
- StrictMode, selection, thông số runtime, multisampling, rerender, bật/tắt/bật lại, shader/WebGL, framebuffer mono và glow localization: **15/15 pass** (`browser-results.json`).
- Một composer sống tối đa, rerender thông thường giữ nguyên composer/effect. Bloom tắt: **0** composer, **0** texture postprocessing; bật: **22** texture render targets.
- GPU: **NVIDIA RTX 4060**, ANGLE D3D11; Canvas **1091×930**, DPR **1**, **10.000 sao**, Browser hiển thị. Median FPS: bật **165.00**, tắt **165.00**, bật lại **165.00** (mỗi lượt khoảng 5,3 giây). Đây là số đo máy dev trong phiên hoạt động; không cam kết cho mọi GPU/DPR hoặc tab nền.
- So sánh selection đầy / rỗng trên **cùng composer**: **2.050** pixel tăng >3 mức sáng quanh hố đen; ngoài bán kính **139,5 px** có **0** pixel tăng >3, sai khác tối đa **1** mức. Cách này tách glow khỏi khác biệt output pipeline giữa composer và render trực tiếp. Fixture giữ pose camera đã lấy từ CameraRig và shader time trong lượt so sánh, tránh sai khác do parallax/twinkle; production vẫn animate bình thường.
- Ảnh đối chiếu: `bloom-on.png`, `bloom-off.png`; đọc trạng thái từ các file `*-state.json`.
- Nút Test cleanup: **5 created / 5 disposed**, peak **1**, live **0**, Canvas removed **true**, ScrollSmoother removed **true** (`cleanup.json`).
- Fixture có cleanup khi pagehide/HMR; instrumentation chỉ ở outputs, không nhập vào App hay bundle production.

## Giới hạn còn lại

Console phiên Browser mới không có error, nhưng còn warning **THREE.Clock deprecated** do `@react-three/fiber` tạo Clock trong store. Warning tồn tại trước task 1.8; không suppress warning hoặc sửa node_modules. Vì vậy điều kiện DoD “không warning console” **chưa đạt tuyệt đối** (`console.json`).

Trang WIP hiện có nền section đục che Canvas (đã ghi ở task 1.6); kiểm tra bằng mắt dùng fixture trong suốt với scene production. Task này không migrate section styling.

## Tái kiểm tra

Chạy `npm run dev`, mở `/outputs/task-1.8/post-qa.html`, chọn End — black hole, Run compare + FPS; so sánh Bloom on / off; cuối cùng Test cleanup. Fixture không thuộc entry production.

Tài liệu đối chiếu: [Bloom](https://react-postprocessing.docs.pmnd.rs/effects/bloom), [SelectiveBloom](https://react-postprocessing.docs.pmnd.rs/effects/selective-bloom), [ChromaticAberration](https://react-postprocessing.docs.pmnd.rs/effects/chromatic-aberration).
