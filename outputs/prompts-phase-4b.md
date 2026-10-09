# 🤖 BỘ PROMPT CHO AI AGENTS — PHASE 4B (AWWWARDS AESTHETIC & EXPERIENCE OVERHAUL)
## Dự án: Stellar Odyssey · Portfolio Trần Vũ Anh Duy (2026 Rebuild)

> **Cách dùng:** Copy từng khối lệnh trong dấu ```` ``` ````, dán vào AI Agent tương ứng (**Antigravity** = Gemini / Visual 3D Specialist; **Codex** = OpenAI / Architecture & Logic Specialist; **Claude** = Anthropic / Principal Reviewer & Auditor).
> **Nguyên tắc cốt lõi:**
> - Tuyệt đối không cài thêm thư viện ngoài (Anime.js, Framer Motion, React Bits). Tận dụng 100% GSAP Club + Three.js/R3F + Tailwind CSS 4 + Web Audio API thuần.
> - Duy trì chuẩn B&W 90% + 10% Quang phổ Vật lý (*Cosmic Amber* & *Electric Cyan*).
> - Giữ vững tiêu chuẩn hiệu năng: Desktop $\ge 140$ FPS, Mobile $\ge 60$ FPS, WCAG 2.1 AA Contrast $\ge 7:1$.

---

## 🎯 TASK 4B.1 — Palette Overhaul & Smoked Glassmorphism
*(Agent: Codex · P0 · ~2.5h)*

```markdown
Bạn là một Principal Design Systems & CSS Engineer chuyên về giao diện đẳng cấp Awwwards. Nhiệm vụ của bạn là nâng cấp hệ thống bảng màu và bề mặt giao diện của "Stellar Odyssey" sang chuẩn "Monochrome + Quang Phổ Vật Lý" và Dark Tinted Smoked Glass — task 4B.1 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
1. Bổ sung tokens màu quang phổ: Cosmic Amber (`#F59E0B` - vàng cam nhiệt của đĩa bồi tụ) và Electric Cyan (`#00F0FF` - xanh băng lạnh viễn thám).
2. Chuyển toàn bộ thẻ card (About, Works, Experience, Education, Contact) sang Dark Tinted Smoked Glass (`rgba(5,5,5,0.65)` + `backdrop-blur-md` + viền mảnh `rgba(0,240,255,0.15)` hoặc `rgba(255,255,255,0.08)`).
3. Đảm bảo lộ rõ chiều sâu không gian của 3D Canvas phía sau mà văn bản trắng `#FAFAFA` vẫn đạt độ tương phản WCAG AA (≥7:1).

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.1.
2. src/styles/globals.css và src/index.css — tokens hiện tại.
3. Toàn bộ các file sections: src/components/About.jsx, src/components/Work.jsx, src/components/sections/Experience.jsx, src/components/sections/Education.jsx, src/components/sections/Contact.jsx.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- ui-ux-pro-max (color theory, glassmorphism contrast, dark aesthetics)
- clean-code (tokens nhất quán, không hardcode hex màu lộn xộn)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Cập nhật tokens CSS trong src/index.css và globals.css:
   - `--color-cosmic-amber: #F59E0B;`
   - `--color-electric-cyan: #00F0FF;`
   - `--color-glass-surface: rgba(5, 5, 5, 0.65);`
   - `--border-glass: rgba(0, 240, 255, 0.15);`
   - `--border-glass-subtle: rgba(255, 255, 255, 0.08);`
2. Cập nhật các card surfaces trong 5 sections chính:
   - Thay thế các class nền đục hoặc viền trắng cũ bằng `bg-(--color-glass-surface) backdrop-blur-md border border-(--border-glass-subtle) hover:border-(--border-glass) transition-colors`.
3. Kiểm tra độ tương phản text: đảm bảo tiêu đề Unbounded và đoạn văn Space Grotesk có độ tương phản ≥ 7:1 so với nền kính hun khói.

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint mới.
- Toàn bộ card có hiệu ứng kính hun khói mờ tinh tế, nhìn thấy sao và hố đen chuyển động phía sau.
- Độ tương phản chữ đạt chuẩn WCAG AA.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy script kiểm tra CDP Edge đo contrast ratio và chụp snapshot bề mặt card. Lưu báo cáo vào `outputs/task-4b.1/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.1, ✅ Xong).

⛔ CẤM:
- KHÔNG dùng kính trong suốt 100% không có tinted đen gây chìm chữ và mất tương phản.
- KHÔNG dùng màu gradient sặc sỡ phá vỡ tỷ lệ 90% Monochrome.
```

---

## 🎯 TASK 4B.2 — Layout Declutter & Playground Restructure
*(Agent: Codex · P0 · ~2.5h)*

```markdown
Bạn là một Principal Frontend Architect. Nhiệm vụ của bạn là tái cấu trúc layout của "Stellar Odyssey" bằng cách loại bỏ Marquee tickers, xóa bỏ section Playground độc lập, và tái phân bổ các tính năng tinh hoa vào các khu vực chức năng chính — task 4B.2 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
1. Gỡ bỏ hoàn toàn 3 dải Marquee tickers để trang web mang phong cách High-End Editorial tĩnh lặng, khoáng đạt.
2. Xóa bỏ `<section id="playground">` độc lập để mạch truyện liền mạch 7 sections.
3. Tái cấu trúc `ScrollOrbitDemo` thành widget `MissionProgressOrbit` trên Nav/HUD; áp dụng `Constellation Grid` và `Magnetic Field` vào Skills và Works.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.2.
2. src/App.jsx, src/components/Marquee.jsx, src/components/sections/Playground.jsx.
3. src/components/layout/Nav.jsx và src/components/layout/MenuOverlay.jsx.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code (loại bỏ code thừa, refactor sạch sẽ)
- vercel-composition-patterns (tách component có trách nhiệm đơn lẻ)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Trong `src/App.jsx`:
   - Gỡ bỏ component `<Marquee />` (cả 3 vị trí giữa các section).
   - Gỡ bỏ `<Playground />`.
2. Tạo component `src/components/ui/MissionProgressOrbit.jsx`:
   - Kế thừa logic tính toán góc xoay quỹ đạo từ `ScrollOrbitDemo.jsx` cũ nhưng thu nhỏ kích thước (đường kính ~36px) gắn tinh tế vào Nav hoặc HUD góc phải.
3. Trong `Nav.jsx` & `MenuOverlay.jsx`:
   - Gỡ bỏ link và mục menu trỏ tới `#playground`. Cập nhật danh sách điều hướng chuẩn 7 sections (Hero, About, Skills, Education, Experience, Work, Contact).
4. Dọn dẹp imports thừa, xóa các file demo không dùng (`ParticleFieldDemo.jsx`, `ShaderPlaygroundDemo.jsx`).

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint.
- Trang web còn lại đúng 7 sections mượt mà, không còn chữ chạy Marquee.
- Menu và Nav trỏ đúng 7 mốc, không sinh link gãy.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy script kiểm tra DOM và ScrollSmoother lướt 7 sections, xác nhận 0 lỗi 404/anchor gãy. Lưu log vào `outputs/task-4b.2/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.2, ✅ Xong).

⛔ CẤM:
- KHÔNG làm gãy chỉ số ScrollTrigger và các điểm neo ScrollTo khi xóa bỏ section Playground.
```

---

## 🎯 TASK 4B.3 — Deep Space Web Audio Engine (Procedural Sound)
*(Agent: Codex · P1 · ~3h)*

```markdown
Bạn là một Creative Audio Engineer & Web Audio Specialist. Nhiệm vụ của bạn là xây dựng hệ thống âm thanh không gian sâu thuần Web Audio API (0 KB file ngoài) cho "Stellar Odyssey" — task 4B.3 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
1. Dựng bộ tổng hợp âm thanh bằng Web Audio API thuần: Nền âm drone u trầm (~45Hz sub-bass kết hợp LFO filter) và tiếng tích tắc sóng vô tuyến vi mô (radio click/chirp) khi tương tác.
2. Xây dựng công tắc xoay kim loại `SOUND [OFF/ON]` gắn trên Nav, tuân thủ 100% Autoplay Policy của trình duyệt.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.3.
2. src/components/layout/Nav.jsx, src/stores/useThemeStore.js.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code (quản lý AudioContext lifecycle, tránh leak)
- ui-ux-pro-max (micro-interactions haptic audio)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Tạo module `src/lib/audioEngine.js`:
   - Quản lý singleton `AudioContext` (chỉ khởi tạo khi có tương tác).
   - Hàm `startSpaceDrone()`: Dùng 2 `OscillatorNode` (tần số 43.65Hz và 55Hz) đi qua `BiquadFilterNode` lowpass và `GainNode` êm dịu, tạo cảm giác vô cực không gian sâu.
   - Hàm `playRadioClick()`: Sóng vuông cực ngắn (~5ms) lọc highpass tạo tiếng lách cách vô tuyến chân thực.
   - Hàm `setMuted(boolean)`: Fade out volume mượt mà trong 0.2s khi tắt âm thanh.
2. Tạo store `src/stores/useAudioStore.js` với Zustand lưu trạng thái vào `localStorage`.
3. Tạo component `src/components/ui/SoundToggle.jsx` gắn vào `Nav.jsx`: hiển thị nhãn `SOUND: [OFF/ON]`, có núm xoay khía kim loại nảy nhẹ khi bấm.
4. Gắn âm thanh radio click vào các nút chính: Menu button, Theme toggle, Project links.

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint.
- Tuân thủ Autoplay: Mặc định tắt, chỉ phát khi người dùng bấm click bật.
- 0 byte file MP3/WAV tải ngoài (tiết kiệm 100% dung lượng mạng).

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy kịch bản Playwright click nút Sound, kiểm tra `audioCtx.state === 'running'`, và xác nhận âm lượng không bị rè/clipping. Lưu vào `outputs/task-4b.3/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.3, ✅ Xong).

⛔ CẤM:
- KHÔNG tự động phát âm thanh khi chưa có click người dùng (vi phạm Autoplay Policy).
- KHÔNG tạo âm lượng quá lớn hoặc tiếng chói gắt làm phiền người dùng.
```

---

## 🎯 TASK 4B.4 — 3D Celestial System & Zodiac Constellations
*(Agent: Antigravity · P0 · ~4h)*

```markdown
Bạn là một Principal 3D Graphics & Shader Engineer. Nhiệm vụ của bạn là nâng cấp cảnh vũ trụ 3D của "Stellar Odyssey" với hệ thống chòm sao hoàng đạo chuẩn xác, Vòng Einstein quanh hố đen, Sao băng phản hồi tương tác, và Bụi sao theo con trỏ — task 4B.4 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
1. Dựng 4 chòm sao chuẩn thiên văn theo 4 chặng hành trình:
   - Hero: Chòm sao Kim Ngưu (Taurus) với cụm sao Thất Nữ Pleiades và sao đỏ Aldebaran.
   - Skills: Chòm sao Thiên Nga (Cygnus) - Thập tự phương Bắc.
   - Works: Chòm sao Thợ Săn (Orion) với vành đai 3 sao.
   - Contact: Chòm sao Nhân Mã (Sagittarius) ôm trọn Hố đen siêu nặng Sagittarius A*.
2. Bổ sung Vòng Einstein (Einstein Ring) ánh sáng bao quanh chân trời sự kiện của Hố đen.
3. Kích hoạt sao băng phản hồi tương tác (Reactive Meteors) khi người dùng click tương tác trên UI.
4. Bụi sao vi mô lượn theo con trỏ chuột (Stardust Wake).

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.4.
2. src/3d/GalaxyScene.jsx, src/3d/components/BlackHole.jsx, src/3d/components/ShootingStars.jsx.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code (tối ưu hóa GPU draw calls, zero allocations trong useFrame)
- a11y-debugging (tôn trọng prefers-reduced-motion)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Tạo `src/3d/components/Constellations.jsx`:
   - Dựng tọa độ chuẩn thiên văn của 4 chòm sao bằng `LineSegments` và `Points`. Đường nối mờ tinh tế (`opacity: 0.2`, màu trắng/electric cyan).
   - Từng chòm sao chỉ sáng le lói khi camera cuộn tới gần phân vùng của nó.
2. Cập nhật `src/3d/components/BlackHole.jsx` & shader:
   - Thêm hiệu ứng khúc xạ vòng tròn Einstein quanh rìa chân trời sự kiện, phản chiếu le lói các ngôi sao phía sau.
3. Trong `ShootingStars.jsx`: Export hàm `triggerShootingStar()` để gọi từ bên ngoài khi có event tương tác (xem project, mở menu, copy mail).
4. Tạo `src/3d/components/StardustWake.jsx`: Vệt bụi sao xoáy nhẹ theo chuột với độ suy hao hạt mượt mà.

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint.
- 4 chòm sao hiển thị sắc nét, Hố đen có vòng Einstein kỳ vĩ.
- Duy trì FPS ≥ 140 trên desktop máy dev.
- Hỗ trợ reduced-motion: Tắt chuyển động hạt và sao băng khi bật OS reduced motion.

🔍 KIỂM CHỨNG (VERIFICATION):
Chụp ảnh 4 chòm sao tại 4 góc camera, đo FPS khi kích hoạt sao băng và bụi sao. Lưu vào `outputs/task-4b.4/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.4, ✅ Xong).

⛔ CẤM:
- KHÔNG tạo memory leak hoặc cấp phát bộ nhớ mới (new Vector3) trong `useFrame`.
```

---

## 🎯 TASK 4B.5 — Precision Optical Barrel & Cockpit Rails (Anime.js Inspiration)
*(Agent: Antigravity · P0 · ~3.5h)*

```markdown
Bạn là một Senior Motion Designer & SVG Craft Specialist. Lấy cảm hứng từ sự cơ học quang học chính xác từng milimet của Anime.js, nhiệm vụ của bạn là xây dựng hệ thống Cockpit Rails ở hai lề biên màn hình cho "Stellar Odyssey" — task 4B.5 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
1. Xây dựng thanh công cụ viễn thám lề trái: Vòng chia độ tiêu cự thiên văn xoay đồng trục theo scroll (`18mm → 50mm → 200mm → ∞`) + Telemetry HUD (`RA/DEC`, `MET`, `DIST: 4.2 LY`).
2. Xây dựng thanh lề phải: Con quay hồi chuyển 3 trục (3-Axis Gyroscope Rings) bằng SVG vector xoay vi sai theo scroll thay thế cho scrollbar truyền thống.
3. Tạo núm xoay khía kim loại (Knurled Metal Dial) với độ nảy 45 độ cho Theme, Sound và Language.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.5.
2. src/App.jsx, src/components/layout/Nav.jsx.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code (GSAP ScrollTrigger scrub, SVG vector siêu nhẹ)
- web-design-guidelines (typography vạch đo, căn lề chuẩn)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Tạo component `src/components/layout/CockpitRails.jsx`:
   - Dùng SVG vector siêu sắc nét, cố định `fixed` hai bên lề (`left-4`, `right-4`, `top-1/2 -translate-y-1/2`).
   - Lề trái: Vòng chia độ xoay đồng trục theo progress cuộn chuột bằng GSAP ScrollTrigger `scrub: 1`. Chỉ số tiêu cự chuyển dịch mượt mà từ 18mm tới Vô cực ($\infty$).
   - Lề phải: 3 vành tròn đồng trục lồng nhau (Gimbal) xoay quanh các trục vi sai khi cuộn trang.
   - Ẩn hoàn toàn trên màn hình mobile (`<1024px`) để tránh chiếm diện tích.
2. Tạo component `src/components/ui/KnurledSwitch.jsx` áp dụng cho Theme, Sound, Lang.

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint.
- Các chi tiết cơ học xoay ăn khớp từng pixel cuộn chuột; cảm giác tactile cơ học thỏa mãn.
- 0 pixel tràn ngang, ẩn sạch sẽ trên mobile.

🔍 KIỂM CHỨNG (VERIFICATION):
Quay màn hình / đo tọa độ xoay của các vành cơ học tại 7 mốc section bằng Playwright. Lưu vào `outputs/task-4b.5/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.5, ✅ Xong).

⛔ CẤM:
- KHÔNG dựng mô hình 3D nặng nề cho thanh Cockpit Rails; bắt buộc dùng SVG vector 2D nhẹ + GSAP.
```

---

## 🎯 TASK 4B.6 — Target-Lock Viewfinder & Lens Flare (Works)
*(Agent: Codex · P1 · ~2.5h)*

```markdown
Bạn là một Creative Frontend & Motion Specialist. Nhiệm vụ của bạn là xây dựng hệ thống Kính ngắm quang học khóa mục tiêu (Viewfinder & Reticle) và vệt loé sáng thấu kính điện ảnh (Anamorphic Lens Flare) cho các dự án trong Selected Works — task 4B.6 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
1. Bốn góc ảnh dự án có vạch đo cơ khí co lại khóa nét (`TARGET LOCKED`) khi cuộn tới giữa màn hình.
2. Vạch tiêu cự quang học trượt ngang khớp vào vị trí nét chuẩn, phát ra âm thanh radio click vi mô.
3. Vệt loé sáng thấu kính (Anamorphic Lens Flare) màu Cosmic Amber / Electric Cyan quét nhẹ qua mặt kính.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.6.
2. src/components/Work.jsx.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code (GSAP contextSafe, cleanup triệt để)
- ui-ux-pro-max (cinematic camera aesthetic)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Tạo component `src/components/ui/TargetLockReticle.jsx`:
   - Khung kính ngắm 4 góc bracket vi mô với các vạch milimet cơ học.
   - Khi ScrollTrigger kích hoạt (card vào viewport 50%): 4 góc co chặt vào ảnh, nhãn `[TARGET LOCKED // SPEC: 2026]` chớp sáng le lói.
   - Vệt sáng anamorphic flare (dải ánh sáng dẹt ngang màu Cosmic Amber) quét từ trái qua phải trong 0.8s.
2. Tích hợp component vào từng card trong `Work.jsx`.
3. Tích hợp âm thanh `playRadioClick()` từ `audioEngine.js` khi mục tiêu được khóa nét (nếu sound đang bật).

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint.
- Hiệu ứng khóa nét hoạt động mượt mà khi cuộn tới từng dự án.
- Tự động tắt khi reduced-motion được kích hoạt.

🔍 KIỂM CHỨNG (VERIFICATION):
Chụp ảnh khoảnh khắc khóa mục tiêu tại cả 3 card dự án, đo FPS khi flare quét qua. Lưu vào `outputs/task-4b.6/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.6, ✅ Xong).

⛔ CẤM:
- KHÔNG che khuất hình ảnh dự án hoặc cản trở nút bấm xem case study.
```

---

## 🎯 TASK 4B.7 — Interactive Gravitational Lensing (Cursor Warp)
*(Agent: Codex · P1 · ~2h)*

```markdown
Bạn là một Creative Technologist & Shader/SVG Filter Specialist. Nhiệm vụ của bạn là tích hợp hiệu ứng Thấu kính hấp dẫn (Gravitational Lensing) bẻ cong không-thời gian vi mô theo con trỏ chuột cho "Stellar Odyssey" — task 4B.7 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
Khi con trỏ chuột di chuyển trên các ảnh bìa dự án hoặc tiêu đề lớn, vùng không gian xung quanh chuột sẽ bẻ cong nhẹ (Spacetime curvature warp), tạo cảm giác chuột là một tiểu hành tinh hấp dẫn vi mô.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.7.
2. src/components/Cursor.jsx.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code (tối ưu hóa SVG Filter / CSS displacement)
- ui-ux-pro-max (subtle refraction, không làm biến dạng quá lố)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Trong `src/components/Cursor.jsx`:
   - Dựng một SVG `<feDisplacementMap>` hoặc sử dụng CSS backdrop thấu kính hội tụ theo tọa độ chuột.
   - Giới hạn hiệu ứng khúc xạ trong bán kính ~40px quanh tâm con trỏ chuột, chỉ kích hoạt khi hover qua các phần tử ảnh hoặc heading.
   - Độ biến dạng (displacement scale) rất nhẹ (chỉ le lói cong nhẹ mép pixel chữ, không làm méo vỡ đọc chữ).
2. Desktop-only (tự động tắt trên màn hình cảm ứng).

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint.
- Hiệu ứng bẻ cong không-thời gian chân thực, mượt mà 60 FPS khi rê chuột.
- Không gây giật lag hoặc tụt frame trên Canvas 3D.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy script kiểm tra CDP Edge đo frame render khi di chuột liên tục trên ảnh dự án. Lưu vào `outputs/task-4b.7/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.7, ✅ Xong).

⛔ CẤM:
- KHÔNG bẻ cong quá mạnh làm mất khả năng đọc của người dùng.
```

---

## 🎯 TASK 4B.8 — Transmission Decryption & Constellation Graphs
*(Agent: Codex · P1 · ~2.5h)*

```markdown
Bạn là một Principal Frontend Engineer & Data Visualization Specialist. Nhiệm vụ của bạn là xây dựng hiệu ứng Giải mã tín hiệu vô tuyến tại Contact và Mạng lưới liên kết sao vector tại Skills — task 4B.8 trong kế hoạch Phase 4B.

🎯 MỤC TIÊU:
1. Tại Contact: Dòng email và thông điệp giải mã từ sóng nhiễu/nhị phân thành ký tự rõ nét với phản hồi `"SIGNAL TRANSMITTED // PACKET DELIVERED"`.
2. Tại Skills: Các kỹ năng liên kết với nhau bằng mạng lưới đường chỉ sao vector phát sáng linh hoạt khi rê chuột.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — mục WBS Task 4B.8.
2. src/components/sections/Contact.jsx, src/components/sections/Skills.jsx.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code (GSAP DrawSVG, ScrambleText)
- accessibility (bảo toàn text cho Screen Reader qua sr-only)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Trong `src/components/sections/Contact.jsx`:
   - Tích hợp ScrambleText giải mã ký tự email kèm nhãn viễn thám `FREQUENCY: 1420 MHz // HYDROGEN LINE`.
   - Khi click nút copy email, phát âm thanh `playRadioClick()` và hiển thị phản hồi thị giác dạng sóng vô tuyến `"PACKET DELIVERED TO COCKPIT"`.
2. Trong `src/components/sections/Skills.jsx`:
   - Dựng mạng lưới SVG vector nối giữa các kỹ năng có mối liên hệ (ví dụ: UI/UX nối tới Figma và Prototyping).
   - Khi hover vào một thẻ kỹ năng, các đường chỉ sao nối tới các kỹ năng đồng môn phát sáng màu Electric Cyan bằng GSAP DrawSVG.

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint.
- Hiệu ứng giải mã và mạng lưới sao hoạt động mượt mà, đúng chuẩn thẩm mỹ Awwwards.
- Bảo toàn 100% khả năng đọc của Screen Reader (WCAG 2.1 AA).

🔍 KIỂM CHỨNG (VERIFICATION):
Chụp ảnh mạng lưới chòm sao khi hover và hiệu ứng giải mã transmission. Lưu vào `outputs/task-4b.8/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.8, ✅ Xong).

⛔ CẤM:
- KHÔNG làm mất thuộc tính accessibility và nhãn ARIA của các nút liên hệ.
```

---

## 🎯 TASK 4B.9 — Review & Verification Phase 4B
*(Agent: Claude · P0 · ~2h)*

```markdown
Bạn là một Principal QA Architect & Awwwards Judge Specialist. Nhiệm vụ của bạn là tổng kiểm toán toàn diện tất cả các hạng mục của Phase 4B ("Awwwards Aesthetic & Experience Overhaul") — task 4B.9 trong kế hoạch.

🎯 MỤC TIÊU:
Đánh giá độc lập và nghiệm thu toàn diện chất lượng của 8 nhiệm vụ (4B.1 → 4B.8). Xác nhận trang web đạt chuẩn thẩm mỹ Awwwards Site of the Day, duy trì hiệu năng ≥ 140 FPS, 0 lỗi ARIA/WCAG, và Web Audio API an toàn tuyệt đối.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/ke-hoach-phase-4b.md — tiêu chí DoD và KPIs.
2. Toàn bộ báo cáo verification từ `outputs/task-4b.1/` đến `outputs/task-4b.8/`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- health (kiểm toán toàn diện)
- a11y-debugging (kiểm tra WCAG AA contrast trên kính mờ)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Đo kiểm FPS thực tế trên màn hình Desktop: Đảm bảo khi cuộn và kích hoạt đồng thời 3D + Audio + Cockpit Rails, FPS vẫn đạt ≥ 140 FPS.
2. Đo kiểm độ tương phản WCAG AA trên toàn bộ 5 thẻ Dark Smoked Glass: Khẳng định không có vùng text nào dưới 7:1.
3. Kiểm tra tính an toàn của Web Audio API: Xác nhận không có ngoại lệ unhandled AudioContext, không phát tiếng khi chưa click.
4. Kiểm tra Responsive 320px – 1920px: Xác nhận Cockpit Rails ẩn sạch trên mobile và không có lỗi tràn lề.
5. Lập báo cáo toàn diện xuất ra `outputs/review-phase-4b.md` với kết luận: PASS / FAIL và phân loại Blockers, Majors, Minors (nếu có).

✅ DEFINITION OF DONE:
- Báo cáo `outputs/review-phase-4b.md` hoàn thành với 0 Blocker, 0 Major.
- Cập nhật file Excel `ke-hoach-stellar-odyssey.xlsx` đánh dấu hoàn tất Phase 4B.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4B.9, ✅ Xong).
```
