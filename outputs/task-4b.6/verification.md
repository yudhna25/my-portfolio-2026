# Task 4B.6 — Target-Lock Viewfinder & Anamorphic Lens Flare

**Ngày:** 07/10/2026 · **Kết quả:** PASS — 122 assertions, build pass, lint 0 errors / 2 warnings cũ.

## Thay đổi

- Tạo `src/components/ui/TargetLockReticle.jsx`; gắn bên trong ảnh của cả EDURA, VERIS và VIE trong `src/components/Work.jsx`.
- Bốn bracket có vạch chia cơ khí, dịch từ ±10px về vị trí khóa trong 0.35s khi tâm ảnh chạm 50% viewport. Vạch tiêu cự cyan trượt 32px về tâm cùng thời điểm.
- Tại mốc 0.35s, nhãn `[TARGET LOCKED // SPEC: 2026]` hiện với một nhịp giảm/tăng opacity nhẹ, gọi `playRadioClick()` hiện có. Flare amber cao 2px quét từ trái sang phải trong **0.8s**, opacity tối đa 0.22 rồi về 0. Tổng timeline 1.15s.
- Chỉ animate transform/opacity; dùng token Amber/Cyan/kính đã có. Overlay `pointer-events: none`, `aria-hidden`, không có phần tử focusable; ảnh và CTA vẫn dùng hành vi cũ.
- `useGSAP` quản lý timeline và ScrollTrigger, `revertOnUpdate: true`. Mỗi reticle chạy một lần trong vòng đời mount; card bị filter sẽ unmount reticle. Hiện lại card sẽ tạo vòng đời mới. Guard tránh radio click lặp do refresh cùng vòng đời.
- Reduced-motion: component trả về `null`; context gỡ animation và trigger khi preference đổi trực tiếp. Khi tắt reduce, reticle được tạo lại.
- Thêm duy nhất key `works.targetLocked` vào cả Vi/En. Giữ nguyên ảnh, nội dung dự án, Flip, cursor/magnetic và liên kết case study.

Đã áp dụng skill `ui-ux-pro-max` từ `C:/Users/PC/.agents/skills/ui-ux-pro-max/SKILL.md` cho chuyển động tiết chế, reduced-motion và cleanup. Không tìm thấy skill `clean-code` trong các nguồn local đã tra; áp dụng quy tắc code hiện có, tái sử dụng audio engine/GSAP/hook thay vì thêm dependency hay abstraction.

## Môi trường và cách chạy lại

- Windows, Microsoft Edge headless **154.0.4258.53**, Playwright bundled runtime.
- URL `http://127.0.0.1:5173/`, dark theme, DPR 1, chiều cao viewport 900px; service worker bị bypass để kiểm tra source dev hiện tại.
- Script: [verify.mjs](./verify.mjs). Dữ liệu máy đọc: [results.json](./results.json).

```powershell
npm run dev -- --host 127.0.0.1
# Trong terminal thứ hai:
node outputs/task-4b.6/verify.mjs
npm run build
npm run lint
```

Script dùng đường dẫn Edge/Playwright đang cài trên máy này; máy khác cần thay hai đường dẫn runtime ở đầu file.

## Kết quả kiểm chứng

| Hạng mục | Kết quả |
|:---|:---|
| Khóa nét 3 dự án | Đủ 4 góc, vị trí co về `(0,0)`, marker về tâm, nhãn resolve đúng, flare opacity 0.22 rồi về 0 |
| Ranh giới overlay | Bounding box trùng ảnh, không vượt khỏi ảnh ở cả 6 viewport |
| Tương tác | 0 phần tử focusable trong overlay; hit test tại CTA EDURA vẫn trả về link |
| Liên kết EDURA | Giữ `target="_blank"`, `rel="noopener noreferrer"` |
| Sound bật | AudioContext `running`; số radio click tăng đúng 1 khi khóa EDURA, sau click bật sound trước đó |
| Sound tắt | Khóa VERIS/VIE không tạo AudioContext, 0 radio click |
| Filter Product → UX/UI → Graphic → All | Reticle lần lượt 1 / 1 / 1 / 3, trigger không trùng ID, card bị ẩn không giữ trigger |
| Đổi Vi → En → Vi | Nhãn đúng key, không tích lũy target trigger; parity hai locale pass |
| Fresh reduced-motion 390px | 0 reticle, 0 ScrollTrigger toàn trang, không ScrollSmoother, không audio, không tràn ngang |
| Console / mạng | 0 console/runtime errors, 0 HTTP 404, 0 failed requests trong lượt kiểm tra cuối |

### Responsive

| Viewport | clientWidth | scrollWidth | Tràn ngang |
|---:|---:|---:|---:|
| 320 | 320 | 320 | 0px |
| 390 | 390 | 390 | 0px |
| 768 | 768 | 768 | 0px |
| 1024 | 1024 | 1024 | 0px |
| 1440 | 1440 | 1440 | 0px |
| 1920 | 1920 | 1920 | 0px |

### Live reduced-motion / cleanup

Đã đổi `reduce ↔ no-preference` **3 vòng trên cùng trang**, không reload, bằng Playwright media emulation:

| Trạng thái | Reticle | Target triggers | Tổng ScrollTriggers | ScrollSmoother |
|:---|---:|---:|---:|:---|
| Reduce — cả 3 vòng | 0 | 0 | 0 | Không |
| No-preference — cả 3 vòng | 3 | 3 | 78 | Có |

Tổng trigger ổn định sau mỗi lần khôi phục, không tăng dần. Con số toàn trang trước đó có thể thấp hơn vì các reveal/reticle `once` đã hoàn tất; sau khi khôi phục motion, các context được tạo mới. Đây là kiểm tra media preference mô phỏng; phiên này không lặp lại thao tác Windows Settings thật của task 4.3.

### Hiệu năng flare

Đo ở trang mới riêng, **không chụp ảnh hoặc pause timeline trong cửa sổ đo**. Timeline được kích hoạt qua vị trí ScrollTrigger thật; lấy mẫu 0.8s bắt đầu khi khóa nét.

- Viewport 1440×900, DPR 1, **1 Canvas** persistent.
- 133 callbacks trong 805.9ms, tương ứng **163.79 rAF/s** (`132 / 0.8059`).
- Khoảng cách frame lớn nhất: **12.1ms**.

Đây là tốc độ callback `requestAnimationFrame` của trình duyệt trên máy dev, không phải bộ đếm frame trình bày của GPU và không suy ra hiệu năng điện thoại thật.

## Bằng chứng hình ảnh

| Dự án | Flare đang quét | Đã khóa / flare kết thúc |
|:---|:---|:---|
| EDURA | [Flare](./project-01-flare.png) | [Locked](./project-01-locked.png) |
| VERIS | [Flare](./project-02-flare.png) | [Locked](./project-02-locked.png) |
| VIE | [Flare](./project-03-flare.png) | [Locked](./project-03-locked.png) |

Ảnh flare đóng băng timeline **tại thời điểm nó đã chạy tới tự nhiên**, khoảng 0.709–0.729s, để tránh chi phí chụp CDP làm lỡ hiệu ứng 0.8s. Không seek timeline để dựng trạng thái; sau ảnh, timeline được resume và chụp trạng thái cuối. Phép đo rAF phía trên dùng trang riêng, không đóng băng.

- [Mobile 320px](./project-01-mobile-320.png)
- [Reduced-motion 390px](./reduced-390.png)

Visual review: bracket nằm gọn ở mép ảnh, thước/nhãn nhỏ ở đáy; flare là đường sáng mảnh, không phủ lớp nền đục lên ảnh. Cockpit Rails desktop hiện có vẫn chiếm một phần mép trái ở vài pose; đây là bố cục task 4B.5 có trước, được giữ nguyên trong phạm vi reticle.

## Build, lint và phạm vi bảo toàn

- [build.log](./build.log): **PASS 4.92s**, PWA precache 29 entries. Còn cảnh báo chunk >500KB của bundle hiện tại.
- [lint.log](./lint.log): **0 errors, 2 warnings** `react-hooks/unsupported-syntax` có trước trong `SplashCursor.jsx` (inline class).
- [baseline.json](./baseline.json) và [source-changes.json](./source-changes.json): audio engine/store, GalaxyScene, CameraRig, CockpitRails, globals/index CSS giữ nguyên hash so với lúc bắt đầu.
- Các cập nhật đồng thời Task 4B.8 trong Contact/Skills/locales và dòng tiến độ 4B.7 được giữ lại. Task này không sửa camera, shader, assets hoặc cấu hình Vite.

**Nghiệm thu:** reticle/flare/audio hoạt động trên cả 3 card, reduced-motion tắt sạch, không cản CTA; 122 assertions PASS và không có lỗi console trong phiên kiểm chứng.
