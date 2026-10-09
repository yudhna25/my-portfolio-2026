# Task 4.3 — Kiểm toán prefers-reduced-motion

Ngày: 06/10/2026. Phạm vi: App thật trong StrictMode, 8 sections, Nav/Menu/Cursor, 3 marquee, Footer, Preloader, GalaxyScene và 3 live demos. Browser: Chromium trong Codex trên Windows. Không đổi dữ liệu, copy hoặc token trong task này.

## Kết luận kiểm chứng Windows thật

Người dùng đã tắt Animation effects trong Windows Settings → Accessibility → Visual effects, sau đó bật lại. Route `/outputs/task-4.3/qa.html` **không có query mô phỏng**, không thay `window.matchMedia` hoặc media rules. Cùng một phiên App ghi đủ các sự kiện native `false → true → false`, không reload giữa hai thay đổi. Cài đặt ban đầu đã được khôi phục **On**.

Bằng chứng: [os-live-roundtrip.json](./os-live-roundtrip.json), [os-reduced-complete.json](./os-reduced-complete.json). Các nút Emulate trên route OS bị disabled. Log gồm trạng thái trước/sau, GPU uniforms và toàn bộ heading/image. Cửa sổ Settings không điều khiển được qua Computer Use do đang thu nhỏ và guard user input; người dùng thao tác trực tiếp. Đây là kiểm chứng OS thật với log trình duyệt, không phải ảnh mô phỏng Settings.

| Trạng thái | ScrollSmoother | ScrollTrigger | Tween DOM đang chạy | Track marquee | SplitText nodes |
| --- | --- | --- | --- | --- | --- |
| OS On, trước thay đổi | Có | 95 | 4 | 3 | 439 |
| OS Off, sau thay đổi | Không | 0 | 0 | 0 | 0 |
| OS On, bật lại | Có | 89 | 3 | 3 | Được tạo lại |

Số trigger sau bật lại thay đổi theo once reveals, locale và filter đã dùng; kiểm tra vòng lặp cố định cùng pose riêng bên dưới xác nhận không tích lũy. Nhãn `250ms`/`1250ms` là thời gian hẹn probe; **timestamp JSON là thời gian thực**. Không dùng các nhãn này để khẳng định độ trễ xử lý OS chính xác khi tab hoặc cửa sổ bị throttle.

## Bốn lỗi đã sửa

- `CameraRig.jsx`: reduced-motion luôn dùng `cameraPath(0) = [0, 2.2, -168]`, kể cả Contact/Footer. Bỏ nhánh pose cuối/offset Contact trong chế độ này; không đăng ký pointer tracker khi frozen.
- `BlackHole.jsx`: contactProgress bằng 0 khi frozen; uDiskIntensity giữ 1, tránh đổi độ sáng theo section trong chế độ tĩnh.
- `MenuOverlay.jsx`: kill tween ScrollTo đang sở hữu khi live preference chuyển sang reduce; focus trap và scroll lock được giữ.
- `Preloader.jsx`: reduced-motion hoàn tất ngay trong useGSAP, **không tạo timeline, spinner, ScrambleText hoặc timer chờ**. Loại bỏ reduced count/fade thay vì dựa vào watchdog khi timer bị throttle. Normal count 2s/curtain 0,32s và watchdog 2,4s được giữ.

## Ma trận kiểm toán

| Thành phần | Hành vi reduce | Bằng chứng |
| --- | --- | --- |
| useReducedMotion | useSyncExternalStore nhận MQL change, subscribe/unsubscribe | Native OS round trip + 5 vòng mô phỏng |
| ScrollSmoother/parallax | Context matchMedia revert/kill; smooth-content transform none; cuộn native | Smoother absent, triggers 0; phép đo native lag |
| Hero | Tên/tagline/subline hiện thẳng sau preloader, không split/scramble; indicator tĩnh | Opacity 1, split 0, visual tween 0 |
| About | Không split/reveal clip/avatar parallax | Heading hiện, clip inset(0)/none |
| Skills | Cards hiện thẳng; vòng quay không cập nhật | Orbit parent rotations bằng nhau trong cặp probe |
| Education | SVG đã vẽ hoàn chỉnh, không DrawSVG scrub/reveal | Không education triggers; heading hiện |
| Experience | Không reveal hoặc data-speed parallax | Triggers 0, heading hiện |
| Works | Filter tức thì, không Flip; cover không clip scrub | 4 filters activeFlip false, visual 0 |
| Playground | Không reveal/parallax | Heading hiện; demo probes riêng |
| Contact | Không scrub camera/veil/CTA pulse | Triggers 0; camera và disk intensity ổn định |
| Footer | Không reveal, scramble hoặc magnetic | Heading hiện; tween 0 |
| Marquee ×3 | Một đoạn text tĩnh, flex-wrap; không duplicated track | trackCount 0, no infinite tween |
| Nav | Không auto-hide tween; ScrollTo duration 0 | Triggers 0; source guard |
| MenuOverlay | Timeline pause ở trạng thái mở/đóng, không depth transition; Esc/Tab/lock còn hoạt động | Menu probe + keyboard.json |
| Cursor/magnetic | Không quickTo easing/magnetic; chỉ cập nhật marker trực tiếp theo vị trí pointer | Không visual tween; CTA translate trống |
| ThemeToggle/card hover | Reduced CSS bỏ dịch chuyển/scale, giữ phản hồi màu/border và focus | Media guard source; CSS animation 0 |
| CameraRig | Pose cameraPath(0), không look/parallax theo chuột hoặc scroll | Camera/quaternion bằng nhau trong các cặp probe |
| StarField/Nebula | uTime không tăng; uApproach = 0 | GPU + material uniform probes |
| BlackHole | uTime không tăng, uDiskIntensity = 1 | Native GPU gl.getUniform, kể cả shader trong HDR scene riêng |
| Planet/OrbitalSkills | Không spin/scale entrance; anchor chỉ theo cuộn native | Static paired object probes |
| FloatingObjects | elapsed không tăng; hình không xoay/drift | Child transforms paired probes |
| ShootingStars | Không mount khi frozen | GalaxyScene conditional guard |
| ParticleFieldDemo | uStrength = 0; push/pointer disabled; demand render | Demo probes + source |
| ShaderPlaygroundDemo | Không có uTime; fieldset disabled; demand render | Demo probes + source |
| ScrollOrbitDemo | Không ScrollTrigger; ring tĩnh; button disabled | Demo probes + source |
| Preloader | Hoàn tất ngay, không tạo spinner/ScrambleText/timeline | OS native probe trước sửa cuối + final reduced probe 0s |

Các component prototype không mount trong App (SplashCursor/EvilEye và bản lab cũ) không phải animation ngầm của trang. GalaxyScene có thể vẫn render một scene tĩnh với frameloop always khi tab visible; dữ liệu camera/uniform/rotation không đổi. Không coi số frame tĩnh là chuyển động hình ảnh.

## Kết quả phép đo bổ sung

- OS thật: 18 poses (9 vùng gồm Footer × Vi/En), 36 snapshots tour/still; mọi heading opacity 1, ảnh clip inset(0)/none, camera/quaternion/material uniform/GPU uniform không đổi trong từng cặp.
- Mobile 390×844: cùng tour Vi/En; thêm 3 cặp demo. Parent rotation của tools/technical bằng 0; FloatingObjects child positions/rotations không đổi. Particle uStrength 0, Shader fieldset disabled, ScrollOrbit button disabled và transform none.
- Cuộn native: dịch 100px → bounding top đổi đúng 100px ngay; sai số tức thì 0px, sai số sau 500ms 0px.
- 5 vòng no-preference/reduce: normal 95 triggers mỗi vòng, reduce 0 mỗi vòng. Tween toàn cục reduced 3–4 (callback/timeline nội bộ, không có visual tween), normal 96–97, không tăng qua các vòng.
- Preloader reduced trước tinh chỉnh cuối: **283,2ms** trong Windows thật và **234,8ms** mobile fresh. Sau tinh chỉnh hoàn tất ngay: **110,1ms** quan sát mount/remove mobile fresh, **0s animation duration**, spinner repeat 0 khi live đổi preference. [final-preloader-live.json](./final-preloader-live.json). Vòng OS thật dùng phiên trước chỉnh preloader cuối; hook MQL và mọi guard section/3D giữ nguyên, nhánh preloader cuối được kiểm chứng bằng mô phỏng có kiểm soát.
- Active menu ScrollTo: 1 tween đang chạy trước đổi preference → 0 sau reduce và vẫn 0 ở probe tiếp theo; vị trí không tiếp tục đổi. [live-final.json](./live-final.json).
- Menu reduced: mở/đóng không tween; scroll lock được giữ trong dialog và trả lại khi đóng. Native Enter → Tab → Esc khôi phục focus vào trigger, dialog đóng và class lock được tháo.
- Kiểm tra normal OS bật lại: uTime tăng từ 15,3423 lên 15,8568; animation được phục hồi.
- Build: pass 6,14s, precache 33 entries. Lint: exit 0, **0 errors / 2 warnings SplashCursor cũ**. [build.log](./build.log), [lint.log](./lint.log).
- Chỉ sửa 4 source files nêu trên. [source-baseline.json](./source-baseline.json), [source-final.json](./source-final.json), [concurrent-changes.json](./concurrent-changes.json) ghi những file thay đổi đồng thời từ các phiên khác; task này không hoàn tác chúng.

Bộ kiểm tra cuối: **1.157 assertions PASS**, 36 cặp scene tĩnh + 3 cặp demo. [Ảnh Hero reduced 390px](./reduced-hero-mobile.jpg). Xem [check-result.json](./check-result.json). Snapshot và JSON được giữ riêng cho Windows thật, mô phỏng vòng lặp, mobile và sửa preloader cuối.

## Chạy lại kiểm tra

1. `npm run dev`.
2. Mở `/outputs/task-4.3/qa.html` để kiểm chứng Windows thật; dùng Settings đổi Animation effects. Route không có query không giả lập preference.
3. Mở cùng route với `?reducedMotion=reduce` hoặc `?reducedMotion=no-preference` để kiểm tra có kiểm soát. Probe local thay MQL và CSS media rules chỉ trên trang QA; không đưa helper vào production App.
4. Dùng Audit 8 sections, filter, demos, menu, pointer, native lag và 5 live cycles. Lưu nội dung JSON trong `#results`.
5. `node outputs/task-4.3/check.mjs` kiểm tra bằng chứng đã lưu. Không cần cài thư viện mới.

WCAG 2.3.3 Animation from Interactions là tiêu chí **AAA**: cho phép tắt motion animation gây ra bởi interaction. Báo cáo này kiểm toán giảm chuyển động, không phải chứng nhận toàn bộ WCAG AA/AAA. [W3C Understanding 2.3.3](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html). Đường dẫn Windows Settings được đối chiếu với [Microsoft Accessibility](https://support.microsoft.com/en-us/accessibility/windows/make-it-easier-to-focus-on-tasks).

## Lưu ý về probe timing

Các lượt stress với phiên reduced có fade 0,30s cho thấy timer/commit có thể trì hoãn. Vì vậy phiên cuối **bỏ toàn bộ animation và artificial delay của preloader khi reduce**, thay vì chỉ rút deadline timer. Khi đổi preference giữa lúc normal preloader đang mở, context cũ bị revert và nhánh reduced gọi completion ngay. Probe cuối xác nhận animation duration 0/spinner repeat 0, không console error.

MutationObserver ghi thời điểm *delivery* của bản ghi DOM, không phải thời điểm compositor paint: trong lượt live stress cuối nó ghi remove 1,254s sau switch giữa lúc toàn bộ GSAP contexts được cleanup. Không suy diễn wall-clock 0ms hay latency ≤340ms cho mọi CPU/throttle scenario từ animation duration 0. Giới hạn ≤340ms được đo trên **reduced fresh**, còn live change được kiểm tra bằng trạng thái không còn tween/time update, không reload và không tích lũy context.

## Giới hạn

Đã kiểm chứng Windows thật; không có máy macOS hoặc điện thoại vật lý trong phiên này. Viewport mobile là mô phỏng. Không suy ra kết quả macOS từ Windows. Console warning THREE.Clock/chunk lớn và 2 warning SplashCursor là vấn đề đã biết ngoài phạm vi; không có console error từ probe.
