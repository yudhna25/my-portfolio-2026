# Task 3.5 — Live interactive demos

Ngày 06/10/2026. Đọc kế-hoạch.md 7.7 / R2-Q4, LiveDemo.jsx và lab (shader Nebula dùng chung GalaxyScene). Áp dụng react-3d-ui, threejs-shaders, prototype, gsap-scrolltrigger, ui-ux-pro-max và Ponytail full. Giữ bento, typography/clip/hover/parallax hiện có; không thêm dependency.

- ParticleFieldDemo.jsx: 600 điểm trắng / một draw call cho field, shader đẩy theo pointer/tap. Nút Đẩy hạt là đường thao tác bàn phím; lực suy giảm theo useFrame delta, invalidate chỉ khi đang chuyển động, về 0 frame ở idle. DPR1, không post-processing, không texture.
- ShaderPlaygroundDemo.jsx: value noise + fbm 5 octave từ Nebula tham chiếu, hai uniform scale/warp. Hai range slider native có label/output, hỗ trợ phím Home/End/arrow; demand render chỉ khi input thay đổi. Không chạy time uniform.
- ScrollOrbitDemo.jsx: ScrollTrigger timeline scrub0.35, bar scaleX và orbit rotation cùng progress; cuộn thuận/ngược và nút Thử cuộn đi giữa các điểm scroll. useGSAP cleanup, không pin/nested scroller/layout animation.
- LiveDemo.jsx lazy-load demo khi IntersectionObserver xác nhận trong viewport; offscreen/hidden unmount, listeners/observer cleanup. Reduced-motion giữ hai Canvas demand tĩnh, vô hiệu hóa controls động, không tạo orbit trigger. Nội dung/controls/nhãn Vi-En đều dùng playground.*.
- Năm card ngoài demo dùng link CodePen thật, mở tab riêng với noopener/noreferrer và nhãn “Bản tham khảo của …”. Không tải hoặc nhúng runtime ngoài vào portfolio; nguồn công khai được dùng theo mặc định đã thông báo vì repo chưa có URL riêng.

## Ngân sách

Mỗi demo: Particle 89 dòng, Shader 80 dòng, Scroll 50 dòng; dưới 120 dòng. Build chunk riêng: Particle 3003 bytes, Shader 2681 bytes, Scroll 2217 bytes (raw minified); dưới 200KB/demo. Fiber/Three/GSAP là runtime đã có của GalaxyScene, được chia sẻ, không phải dependency tải mới cho từng demo. Chưa giải quyết warning bundle nền >500KB có sẵn.

Build production cuối pass 5.62s; lint toàn repo exit0, 0 errors/2 warnings SplashCursor cũ. 33 file App/Hero/3D hiện có/stores/tokens giữ SHA-256; không sửa camera, shader hố đen, scene chính, smooth-scroll hook, About/Work. Sân demo giữ #050505 cả theme sáng để các hạt/orbit trắng luôn rõ; chỉ scope LiveDemo, không đổi theme tokens.

## Browser

Bộ QA trong outputs/task-3.5/qa.jsx mount App thật/StrictMode; UI hiện state sau hành động và bằng chứng. Đo FPS bằng chênh lệch gl.info.render.frame của Canvas particle trong 2.6s pointer interaction, đồng thời scene nền và shader slot vẫn hiện. Không dùng FPS rAF để thay thế render counter.

Lượt đầu mở tab nền bị throttling ~1fps, làm scrub/settling checks chưa hoàn tất; không dùng lượt đó làm acceptance. Tab được chọn có document.hidden=false, visibility=visible, focused=true: ~164.7fps và 14/14 checks pass. QA lifecycle quay về slot sau live motion, vì Smoother cũ đổi media context sẽ reset scroll về đầu. Không sửa hành vi chung trong phạm vi task này.

Chạy: `node outputs/task-3.5/serve-qa.mjs`, mở http://127.0.0.1:5185/outputs/task-3.5/qa.html, đợi Ready rồi bấm Verify demos / Lifecycle; thêm `?reduce` để test reduced-motion từ lúc import. `node outputs/task-3.5/check.mjs` đối chiếu các artifact kết quả, budgets, locale parity và AGENTS append-only.

Tham khảo API: [Fiber demand rendering](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [Canvas fallback](https://r3f.docs.pmnd.rs/api/canvas); visual tương tác trực tiếp trong card tham chiếu [Anime.js](https://animejs.com/).

Nguồn card: [GSAP magnetic](https://codepen.io/GreenSock/pen/MWRPXMr), [GSAP ScrambleText](https://codepen.io/GreenSock/pen/gLXgxz), [Constellations — aptorres27](https://codepen.io/aptorres27/pen/mPGZPp), [WormHole — devildrey33](https://codepen.io/devildrey33/pen/zKBpmq), [GSAP Marquee](https://codepen.io/GreenSock/pen/QWOvexM). Đã mở/đối chiếu trang nguồn; không sao chép code của các pen vào sản phẩm.

## Kết quả cuối

- Production desktop 1440×1000: 31/31 checks, particle render 164.68fps. Gồm 14 interaction/idle/scroll checks và 17 locale/live motion/hidden/offscreen cleanup checks. Resize không tạo overflow ngang.
- Production mobile viewport 390×900: 14/14, particle render 164.70fps; range/hint/nút nằm trong khung. Đây là viewport mô phỏng trên máy dev, chưa phải phép đo điện thoại thật.
- Fresh reduced-motion 1280px: 10/10, 0 particle frames trong 2.6s pointer events; force0, orbit0/progress tĩnh50%, không scroll trigger. Thay đổi motion/visibility bằng shim trong QA, chưa toggle OS thật.
- Native controls: slider Home/End → uniforms scale8/warp0; Enter Đẩy hạt → strength0.665; nút Thử cuộn → progress0.1775 sang0.3004. Bằng chứng native-controls.json.
- 0 console errors ở ba phiên production; warning THREE.Clock từ runtime Fiber xuất hiện mỗi khi tạo Canvas (cả scene có sẵn và hai Canvas demo). Không che/suppress warning. Main Vi/En 195 keys/locale (thêm11), giữ tên 8 thí nghiệm.
- Một Canvas nền persistent + tối đa hai Canvas nhỏ khi slot hiện; reduced vẫn render một hình tĩnh, idle không invalidate; hidden/offscreen hủy cả ba demo và tài nguyên riêng. Shader dùng0 texture, không tải shader/model/texture ngoài.
- Final CSS-only sửa nền stage được build/lint lại; reduced/browser proof chạy trên snapshot mới. Logic demo/metrics desktop-mobile giữ nguyên.

![Playground trong portfolio](./playground-desktop.png)
