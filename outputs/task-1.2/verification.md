# Task 1.2 — GSAP Setup

Ngày kiểm chứng: 04/10/2026. Agent: Codex.

## Thay đổi đã áp dụng

- `src/hooks/useGSAPSetup.js`: đăng ký useGSAP, ScrollTrigger, ScrollSmoother, SplitText, ScrambleTextPlugin, ScrollToPlugin và Flip tại một điểm ở cấp module. Defaults giữ nguyên `duration: 0.6`, `ease: 'power2.out'`. Hook chuyển tiếp callback/config sang `@gsap/react` để cung cấp context và cleanup.
- `splitText(source, opts)`: bọc `SplitText.create`, dùng class `split-line` / `split-char`. Gọi trong useGSAP/useGSAPSetup, gsap.matchMedia hoặc contextSafe để SplitText tự revert qua context. Có thể gọi `instance.revert()` nếu cần kết thúc sớm. Chọn `opts.type` theo đơn vị cần dùng; không có timeline/effect mới.
- `src/hooks/useSmoothScroll.js`: tạo smoother trong useGSAP + gsap.matchMedia khi `prefers-reduced-motion: no-preference`; giữ `smooth: 1.2`, `effects: true`, `normalizeScroll: true`, `ignoreMobileResize: true`. Cleanup của context gọi ScrollSmoother.revert/kill. Đồng bộ preloader pause qua effect riêng, không tạo lại smoother khi loading thay đổi.
- `src/hooks/useReducedMotion.js`: boolean dùng native matchMedia + useSyncExternalStore; subscribe/unsubscribe sự kiện change, cập nhật khi preference thay đổi.
- `src/App.jsx`: dùng hai hook mới, xóa setup thủ công, chuyển imports sang alias `@/`, thêm ref cho scope. Giữ JSX, props, section animations và cấu trúc fixed nav/cursor/preloader ngoài wrapper. Refresh fonts/load/300ms có guard tránh chạy sau cleanup; loading-lock cũng được cleanup.
- Sau khi người dùng xác nhận ngoại lệ phạm vi, đã xóa đúng 7 dòng `gsap.registerPlugin` trong About, Education, Footer, Hero, Marquee, Nav, Work. Không sửa bất kỳ dòng animation/JSX/import nào trong các component này. `rg -n registerPlugin src` chỉ còn một kết quả ở useGSAPSetup.
- `src/index.css`, `src/main.jsx` và package/config giữ nguyên trong task này.
- App/package được cập nhật Zustand đồng thời bởi luồng làm việc khác trong workspace; giữ nguyên useLoadingStore mới và tích hợp các hook với boolean loading đó. Build cuối đã bao gồm thay đổi này. Tab Browser mới xác nhận không có console error khi tải/cuộn; tab cũ từng ghi lỗi React trong lúc dependency optimization/HMR thay đổi, nên không dùng log tích lũy của tab cũ làm kết quả cuối.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS sau khi xóa 7 đăng ký trùng: Vite 7.3.6, 1735 modules; PWA hoàn thành, không lỗi/cảnh báo build |
| ESLint App + 3 hook + About/Education/Footer/Hero/Marquee/Nav | PASS; Work vẫn có lỗi refs đã tồn tại |
| npm run lint | FAIL do 2 lỗi refs có sẵn trong Preloader/Work; 2 cảnh báo unsupported-syntax trong SplashCursor, giống báo cáo task 1.1 |
| Dev server | Dùng server đang chạy ở http://localhost:5173/ |
| Browser trang chính | Preloader kết thúc, khóa cuộn được bỏ; cuộn thực tế bằng wheel tới các section; wrapper fixed, content transform theo scroll, chỉ một wrapper/content |
| Browser console trang chính | Không có error trong lượt kiểm tải/cuộn; còn cảnh báo target `.welcome-word` / target rỗng của component WIP |
| Browser smoke fixture | 14/14 PASS, console sạch trên tab mới; dữ liệu trong lifecycle-results.json |
| StrictMode | Setup → cleanup → setup tạo 2 instance tuần tự, peak chỉ 1 sống; instance đầu được kill trước instance kế tiếp. Không giữ instance qua unmount để né StrictMode |
| Pause/loading | Paused lúc bắt đầu, resume không tạo lại smoother |
| Reduced motion ban đầu | Không tạo smoother khi query reduce match |
| Reduced motion thay đổi lúc chạy | Kill smoother, cập nhật boolean hook, khôi phục transform/position native; đổi lại tạo một smoother |
| SplitText | Tạo class wrappers; tự revert markup/ARIA khi unmount |
| Final lifecycle cleanup | 4 create / 4 kill qua toàn bộ các vòng thử, peak 1, không còn trigger |
| Ponytail complexity review | Không có abstraction/dependency thừa cần cắt trong phần production đã thêm |

Fixture `gsap-qa.html` / `gsap-qa.jsx` là công cụ kiểm thử riêng trong outputs, không được import vào ứng dụng hoặc bundle production. Chạy bằng cách mở http://localhost:5173/outputs/task-1.2/gsap-qa.html. Nó mô phỏng MediaQueryList.matches/change trong document của fixture, không đổi OS preference và không sửa document của trang chính.

## Giới hạn kiểm chứng

1. **OS reduced motion:** đã thử mở Windows Settings và Control Panel qua Computer Use, nhưng công cụ không nhận được cửa sổ targetable. Chrome DevTools connector cũng không tìm thấy Chrome stable trên máy. Do đó kiểm thử reduced motion ở đây là mô phỏng sự kiện media query trong Browser; chưa xác minh toggle preference Windows thật hoặc OS CSS media query.
2. Cảnh báo Preloader và lỗi lint component cũ còn tồn tại; không sửa animation component Phase 3 trong phạm vi task này. Báo cáo task 1.1 cũng đã ghi nhận lỗi click Profile do selector trong scope Nav; lượt QA này chỉ kiểm tải và cuộn, không xác nhận sửa lỗi đó.

## Tham chiếu API

- [GSAP React: useGSAP và cleanup](https://gsap.com/resources/React/)
- [gsap.matchMedia: revert khi query thay đổi](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/)
- [SplitText: tích hợp context/useGSAP và revert](https://gsap.com/docs/v3/Plugins/SplitText/)

## Ảnh QA

- `scroll-page.jpg`: trang portfolio sau refactor.
- `lifecycle-qa.jpg`: kết quả fixture.
