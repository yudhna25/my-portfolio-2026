# Task 2.1 — Preloader

Ngày: 05/10/2026. Bắt đầu từ lượt heartbeat đã đặt lịch. Production chỉ sửa `src/components/Preloader.jsx`.

## Thay đổi

- Thay rune/glitch đỏ-cyan và welcome WIP bằng một vòng SVG gradient trắng → xám, phần trăm ở tâm, nền **#050505**, nhãn JetBrains Mono từ `preloader.counterLabel`.
- Counter **0 → 100**, **2 giây**, **power2.inOut**; vòng quay đều một chu kỳ **1,2 giây**. Không ảnh/video/sound, không glow.
- Sau counter: content fade 0,12 giây; curtain clip-path kéo lên cùng fade 0,32 giây. Tổng timeline **2,32 giây**; `onComplete()` chỉ gọi sau reveal.
- Reduced-motion: không quay, không animate clip-path/transform; counter **0,18 giây** + fade **0,16 giây**, tổng **0,34 giây**.
- Watchdog **2.400 ms** tính từ setup đầu tiên, giữ deadline qua StrictMode và thay đổi preference/language. Nếu ticker/timeline bị dừng, đưa timeline tới endpoint rồi gọi contract completion một lần.
- `useGSAP` quản lý timeline/spinner/DOM revert; cleanup hủy timeout. Phần trăm tăng một chiều kể cả lúc context cũ revert; callback prop mới nhất được cập nhật bằng layout effect. Không setState mỗi frame.
- `role="status"`, aria-label từ i18n, aria-live polite; số đếm/SVG là phần trang trí aria-hidden để không đọc 100 thông báo.
- Static styling dùng Tailwind 4; GSAP ghi style runtime. Clip-path chỉ dùng ở curtain ngắn đúng yêu cầu của người dùng, là ngoại lệ có chủ đích của quy tắc transform/opacity.
- Giữ default export tương thích App, thêm named export `Preloader`. Không đổi loading logic App, store, nội dung locale: SHA-256 cả bốn file khớp baseline (`unchanged-files.json`).

## Verify

- `npm run build`: **pass**, Vite + PWA. Cảnh báo bundle GalaxyScene >500 kB vẫn có sẵn.
- `npx eslint src/components/Preloader.jsx`: **pass**; lỗi WIP viết ref trong render đã được loại bỏ khi viết lại.
- Dev server của phiên: **http://127.0.0.1:5174/** (5173 đã có server khác, không dừng server đó).
- Fixture `/outputs/task-2.1/app-qa.html` nhập **main.jsx/App thật** trong StrictMode, theo dõi DOM và subscribe loading store; mọi shim/probe chỉ nằm ở outputs.
- **7 lượt × 15 checks = 105/105 pass**. Check: một mount/completion, tối đa một timeline, thời gian, counter 0/100 và không lùi, i18n/ARIA, palette/SVG/font, fade/curtain, cleanup, App unlock, spinner, console error, smoother resumed.

| Lượt | Thời gian từ DOM mount đến store completion | Kết quả |
|:---|---:|:---|
| Normal load | 2323,8 ms | 15/15 |
| Reload 1 | 2325,1 ms | 15/15 |
| Reload 2 | 2326,6 ms | 15/15 |
| Reload 3 | 2322,3 ms | 15/15 |
| Reduced-motion mô phỏng | 350,7 ms | 15/15; transform none |
| Chuyển sang reduce ở giữa intro | 1540,9 ms | 15/15; counter không lùi, spinner dừng |
| Ticker sleep + timeline giữ pause | 2331,7 ms | 15/15; chỉ có sample 0 trước endpoint, watchdog đưa tới 100 |

Đồng hồ fixture bắt đầu khi MutationObserver thấy DOM, sau thời điểm setup đầu tiên của Preloader; vì vậy số đo watchdog nhỏ hơn 2400 ms. Endpoint timeline trong lượt deadline vẫn `paused=true`, xác nhận completion do watchdog, không do timeline chạy tự nhiên.

`normal-1.json` … `normal-4.json`, `reduced.json`, `motion-change.json`, `deadline.json` chứa kết quả đầy đủ. **0 console error** trong các lượt sau khi sửa fixture (`console.json`). Còn warning `THREE.Clock` có sẵn từ R3F, không thuộc Preloader; không suppress warning.

Trang chính `/` cũng đã mở trực tiếp: Preloader biến mất, `body.loading-lock` được gỡ, **0 console error** (`production-console.json`). Để lại tab dev cho người dùng reload xem intro.

Ảnh `preloader.png` chụp từ component thật ở 50%. Route capture chỉ seek/pause timeline cho ảnh, vẫn giữ watchdog; số đo timing ở bảng lấy từ các route không capture.

## Tham chiếu và giới hạn

Đã mở [Mont-fort](https://mont-fort.com/) trong Browser để tham khảo tinh thần tối giản. Intro của bản live bỏ qua/rất nhanh trên warm cache; không khẳng định clone chính xác từng khung hình. Vòng SVG và nhịp đếm được dựng theo thông số người dùng, không sao chép media/site code.

Reduced-motion kiểm tra qua shim matchMedia trước khi import App, cả khởi tạo và phát change event khi đang chạy. **Chưa toggle cài đặt Windows trực tiếp**: Browser của phiên không cung cấp native computer control/Ponytail callable. Không đổi cài đặt OS để giả vờ đã verify native.

Để chạy lại: mở fixture, dùng Normal và reload ba lần; chọn Reduced motion (simulation), Live motion change và Ticker sleep / deadline. Route chính `/` dùng Preloader production, không có QA controls.
