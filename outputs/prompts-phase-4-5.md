# 🤖 BỘ PROMPT CHO AI AGENTS — PHASE 4 (POLISH & OPTIMIZATION) + PHASE 5 (LAUNCH)
## Dự án: Stellar Odyssey · Portfolio Trần Vũ Anh Duy (2026 Rebuild)

> **Cách dùng:** Copy từng khối lệnh trong dấu ```` ``` ````, dán vào AI Agent tương ứng (**Antigravity** = Gemini / Visual 3D Specialist; **Codex** = OpenAI / Architecture & Logic Specialist; **Claude** = Anthropic / Principal Reviewer & Auditor).
> **Nguyên tắc cốt lõi:**
> - Mọi prompt đều yêu cầu agent đọc trước tài liệu ngữ cảnh thực tế: `kế-hoạch.md`, `AGENTS.md` (tiến độ hiện tại), `CLAUDE.md`, và các báo cáo review liên quan (`outputs/review-phase-1.md`, `outputs/review-phase-2.md`, `outputs/i18n-audit.md`).
> - **KHÔNG đập đi xây lại** những gì đã hoàn thành ở Phase 0–3 mà tập trung kiểm định (audit), tinh chỉnh (polish), và tối ưu hóa (optimize) dựa trên thực tế mã nguồn.
> - **Tuyệt đối tuân thủ Design System Mono B&W**, tôn trọng `prefers-reduced-motion`, không inline styles, và giữ vững hiệu năng >120 FPS.

---

## 🧭 BỐI CẢNH THỰC TẾ & CÁC ĐIỂM ĐÃ XÊ DỊCH TỪ PHASE 0–3

Trước khi kích hoạt Phase 4 và 5, các Agent cần nắm rõ trạng thái thực tế của codebase hiện tại:

1. **Wormhole → Hố đen (Task 3.2 đã đổi theo R3-Q3):**
   - Không còn khái niệm "Wormhole" ở phần cuối. Điểm đến cuối cùng của hành trình tại Contact là **Hố đen (Black Hole)** với đĩa bồi tụ nghiêng ~75°, vòng photon và hiệu ứng tăng sáng `uDiskIntensity` khi cuộn tới Contact. Mọi prompt Phase 4–5 đồng bộ thuật ngữ Hố đen.
2. **PWA & Image WebP đã được tích hợp từ sớm (Phase 0):**
   - Service worker (`vite-plugin-pwa`), manifest, và các ảnh `avatar.webp`, `project1-3.webp` đã được cấu hình và nén <300KB từ Phase 0.
   - Do đó, **Task 4.7 (PWA)** và **Task 4.8 (Images)** ở Phase 4 chuyển trọng tâm sang **Audit chất lượng**: kiểm tra offline cache reliability, Lighthouse PWA criteria, tránh Layout Shift (CLS), và audit kích thước responsive.
3. **Lazy loading đã có một phần nhưng chunk size còn cảnh báo (Review Phase 1 & 2):**
   - `GalaxyScene` và `OrbitalSkills` đã được `React.lazy()`. Tuy nhiên build vẫn phát cảnh báo chunk Three.js/GSAP >500KB.
   - Trọng tâm của **Task 4.9 & 4.10** là cấu hình `manualChunks` trong `vite.config.js` để chia nhỏ vendor bundle một cách chiến lược.
4. **Vấn đề tồn đọng từ Review Phase 2 cần dọn dẹp (Ưu tiên P0):**
   - `Footer.jsx` vẫn mang mã cũ từ Phase 0: nền kem `#F5F5F0`, chữ đỏ `#FF3333`, font `syne`. Cần chuẩn hóa dứt điểm ở **Task 4.14**.
   - `App.jsx:64` có class `text-[#1a1a1a]` cũ cần chuyển về token `text-(--text-primary)`.
5. **OS Reduced-Motion thật chưa từng được toggle trực tiếp:**
   - Cả hai đợt review 1.10 và 2.15 đều ghi nhận: reduced-motion mới chỉ được test qua mô phỏng browser media emulation. **Task 4.3** là chốt chặn kiểm tra trực tiếp trên cài đặt OS thật.

---

## 📋 BẢN ĐỒ PHỤ THUỘC & THỨ TỰ CHẠY (PHASE 4 & 5)

```
[Wave 1: Tối ưu nền tảng & Dọn dẹp]
  4.1 Responsive ──┐
  4.6 SEO Meta    ──┼──► 4.14 Visual QA & Fix Footer ──► 4.15 Dark/Light Full Test
  4.7 PWA Audit   ──┤
  4.8 Image Audit ──┘

[Wave 2: Hiệu năng 3D, Chuyển động & Bundle]
  4.2 3D Tiers ───► 4.13 Easing Polish
  4.9 Lazy Load ──► 4.10 ManualChunks (Fix >500KB)

[Wave 3: Kiểm định chuyên sâu A11y & Content]
  4.3 OS Reduced-Motion ──┐
  4.4 Keyboard & Focus  ──┼──► 4.11 Lighthouse Audit (Target 90+)
  4.5 ARIA & Semantics  ──┤
  4.16 i18n Proofread   ──┘

[Wave 4: Cross-Browser & Handoff Phase 4]
  4.12 Cross-Browser Audit ──► [PHASE 4 REVIEW & SIGN-OFF]

[Wave 5: Triển khai & Ra mắt (Phase 5)]
  5.1 Final Build ──► 5.2 Vercel Deploy ──► 5.3 Vercel Analytics
                                      └──► 5.4 Smoke Test Live ──► 5.5 Documentation
                                                               └──► 5.6 Awwwards ──► 5.7 Social Launch
```

### Bảng phân công nhanh

| Task | Tên nhiệm vụ | Agent phụ trách | Ưu tiên | Giờ | Chờ task nào |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **4.1** | Responsive Layout Audit (320px–1920px) | Codex | P0 | 3h | Phase 3 |
| **4.2** | 3D Quality Tiers & Performance Optimization | Antigravity | P0 | 3h | Phase 3 |
| **4.3** | prefers-reduced-motion OS Integration & Full Audit | Claude | P0 | 2h | Phase 3 |
| **4.4** | Keyboard Navigation & Focus Management Audit | Claude | P0 | 2h | 4.1 |
| **4.5** | ARIA Landmarks & Screen Reader Audit (WCAG AA) | Claude | P0 | 2h | 4.4 |
| **4.6** | SEO: Metadata, Open Graph, JSON-LD Schema | Codex | P1 | 2h | Phase 3 |
| **4.7** | PWA Audit & Offline Reliability | Codex | P1 | 1.5h | Phase 3 |
| **4.8** | Image & Asset Audit (WebP / CLS / Dimensions) | Codex | P0 | 1.5h | Phase 3 |
| **4.9** | Code Splitting & Dynamic Imports | Antigravity | P1 | 2h | Phase 3 |
| **4.10** | Bundle Analysis & ManualChunks (Fix >500KB warning) | Codex | P1 | 1.5h | 4.9 |
| **4.11** | Lighthouse Audit & Web Vitals (Target 90+) | Claude | P0 | 2h | 4.1–4.10 |
| **4.12** | Cross-Browser Verification (Chrome, Firefox, Safari, Edge) | Claude | P1 | 2h | 4.11 |
| **4.13** | Easing, Camera Lerp & Motion Polish | Antigravity | P1 | 2h | 4.2 |
| **4.14** | Visual QA Pixel-Perfect & Dọn Tàn Dư Legacy (Footer, Root) | Codex | P0 | 2h | 4.1 |
| **4.15** | Dark / Light Mode Audit | Claude | P1 | 1.5h | 4.14 |
| **4.16** | i18n Proofread & Hoàn Thiện Content Placeholders | Claude | P1 | 1.5h | Phase 3 |
| **5.1** | Final Build & Pre-flight Checklist | Codex | P0 | 30m | Phase 4 |
| **5.2** | Vercel Deployment & Production Setup | Codex | P0 | 1h | 5.1 |
| **5.3** | Vercel Analytics & Speed Insights Tracking | Codex | P1 | 30m | 5.2 |
| **5.4** | Production Smoke Test & Live URL Verification | Claude | P0 | 1h | 5.2 |
| **5.5** | Comprehensive README & Portfolio Documentation | Claude | P1 | 1.5h | 5.4 |
| **5.6** | Awwwards / CSSDA Submission Package | Claude | P2 | 1h | 5.4 |
| **5.7** | Social Announcement Strategy (LinkedIn, X, Behance) | Claude | P2 | 30m | 5.4 |

---

# 🎨 BỘ PROMPTS CHI TIẾT — PHASE 4: POLISH & OPTIMIZATION

---

## 🎯 TASK 4.1 — Responsive Layout Audit (320px – 1920px)
*(Agent: Codex · P0 · ~3h · Wave 1)*

```markdown
Bạn là một Senior Layout & Responsive QA Engineer của một digital studio từng đạt giải Site of the Year trên Awwwards. Nhiệm vụ của bạn là rà soát, đo kiểm và tinh chỉnh độ tương thích đa màn hình cho toàn bộ dự án "Stellar Odyssey" — task 4.1 trong kế hoạch.

🎯 MỤC TIÊU:
Kiểm tra và đảm bảo toàn bộ 8 sections cùng Nav, MenuOverlay, Marquee và Footer hiển thị hoàn hảo, không có thanh cuộn ngang ngoài ý muốn (0 horizontal overflow), typography co giãn mượt mà theo clamp, và khoảng đệm an toàn trên tất cả các breakpoint từ 320px đến 1920px+.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 4.2 (Typography scale), mục 7 (Cấu trúc 8 sections) và mục 11 (Verification Plan).
2. AGENTS.md — quy tắc CSS (Tailwind 4, không inline styles, semantic tokens).
3. outputs/review-phase-2.md — lưu ý về responsive metrics đã đo ở Phase 2.
4. Toàn bộ các file trong `src/components/sections/` và `src/components/layout/`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- web-design-guidelines (kiểm tra spacing rhythm, line length, typography scale)
- ui-ux-pro-max (mobile-first, touch density, breakpoint consistency)
- clean-code (tối ưu hóa utility classes, tránh class trùng lặp)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (headless Edge/Playwright).

📐 YÊU CẦU CỤ THỂ:
1. Đo kiểm DOM và visual tại 6 mốc màn hình chuẩn:
   - 320px (Mobile siêu nhỏ - iPhone SE đời cũ): Kiểm tra tiêu đề lớn (Hero Unbounded clamp, Works heading), đảm bảo không tràn lề (`innerWidth >= scrollWidth`).
   - 390px (Mobile phổ thông - iPhone 14/15).
   - 768px (Tablet portrait - iPad Mini/Air): Kiểm tra điểm gãy chia cột của About (split 5/7), Works (8/7 xen kẽ), và Skills (3 cards).
   - 1024px (Tablet landscape / Laptop nhỏ): Điểm xuất hiện của desktop Nav và Custom Cursor.
   - 1440px (Desktop tiêu chuẩn - MacBook Pro / Laptop full HD).
   - 1920px (Màn hình lớn / Ultrawide): Đảm bảo max-width container (`max-w-7xl`, `max-w-[1600px]`) không làm nội dung bị kéo dạt quá xa hoặc lệch bố cục.
2. Safe Areas: Kiểm tra padding `env(safe-area-inset-top)` và `env(safe-area-inset-bottom)` cho Nav, Hero indicator, và MenuOverlay footer trên mobile.
3. Chạm bấm (Touch targets): Đảm bảo trên viewports mobile (<1024px), mọi liên kết, nút bấm, và icon đều đạt kích thước bấm tối thiểu 44×44px (`min-h-11 min-w-11`).
4. Nếu phát hiện overflow hoặc vỡ dòng xấu, điều chỉnh trực tiếp các class Tailwind trong components tương ứng (dùng `overflow-wrap: anywhere`, `text-wrap: balance`, điều chỉnh clamp).

✅ DEFINITION OF DONE:
- `npm run build` pass, không sinh lỗi lint mới.
- 0 pixel tràn ngang (`scrollWidth === clientWidth`) tại toàn bộ 6 mốc màn hình.
- Tiêu đề Unbounded co giãn mượt mà, không cắt chữ, không tràn viền.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy script kiểm tra viewport tự động (hoặc mở dev server với Browser tool) đo `document.documentElement.scrollWidth` tại 320, 390, 768, 1024, 1440, 1920px. Lưu log/snapshot kết quả vào `outputs/task-4.1/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.1, ✅ Xong, tóm tắt các vị trí class đã tinh chỉnh và kết quả verify).

⛔ CẤM:
- KHÔNG dùng `overflow-x: hidden` trên `<body>` để che giấu lỗi tràn ngang gốc.
- KHÔNG thay đổi cấu trúc dữ liệu hoặc nội dung text i18n.
```

---

## 🎯 TASK 4.2 — 3D Quality Tiers & Performance Optimization
*(Agent: Antigravity · P0 · ~3h · Wave 1)*

```markdown
Bạn là một Principal 3D Graphics Engineer kiêm WebGL Performance Specialist. Nhiệm vụ của bạn là rà soát, hoàn thiện và kiểm chứng hệ thống phân tầng chất lượng đồ họa (Quality Tiers) cho cảnh vũ trụ 3D "Stellar Odyssey" — task 4.2 trong kế hoạch.

🎯 MỤC TIÊU:
Đảm bảo cảnh 3D (`GalaxyScene`, `StarField`, `Nebula`, `BlackHoleSystem`, `OrbitalSkills`, `Planet`) tự động thích ứng hoàn hảo theo 3 tầng thiết bị (High / Medium / Low), duy trì ổn định >120 FPS trên máy tính để bàn/laptop và >60 FPS trên thiết bị di động, không gây quá nhiệt hay giật lag.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 4.2 (Mobile fallback), mục 5 (Three.js/R3F), mục 10 (Task 4.2) và mục 11 (Verification Plan).
2. AGENTS.md — các cập nhật visual fix và NASA ray-tracing của Task 1.6, 1.7, 1.8, 3.1, 3.2.
3. `src/3d/quality.js` — file định nghĩa cấu hình QUALITY hiện tại.
4. `src/3d/GalaxyScene.jsx`, `src/3d/components/BlackHoleSystem.jsx`, `src/3d/components/StarField.jsx`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- react-3d-ui (R3F performance patterns, frameloop, selective rendering)
- threejs-shaders (tối ưu vòng lặp shader raymarch/geodesic)
- gsap-performance (đồng bộ render loop và ScrollTrigger)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (chạy dev server và đo FPS thực tế).

📐 YÊU CẦU CỤ THỂ:
1. Rà soát cấu hình 3 tiers trong `src/3d/quality.js` và `GalaxyScene.jsx`:
   - **Low tier (Mobile <768px):** Số hạt sao giảm còn 6.000 (hoặc mức tối ưu cho GPU di động); bước nhảy raymarch hố đen giảm bước; DPR cố định 1.0; tắt Bloom nặng nếu FPS <50.
   - **Medium tier (Tablet 768px–1023px):** Số hạt sao 12.000; raymarch bước trung bình; DPR tối đa 1.5; Bloom đĩa bồi tụ nhẹ.
   - **High tier (Desktop ≥1024px):** Số hạt sao 24.000; raymarch độ chính xác cao (RK4 geodesic mono); DPR [1, 1.75]; SelectiveBloom ôm sát đĩa bồi tụ.
2. Kiểm tra `frameloop`: Xác nhận `GalaxyScene` sử dụng `frameloop={hidden ? 'never' : 'always'}` khi tab bị ẩn để tiết kiệm pin và tài nguyên CPU/GPU 100%.
3. Kiểm tra cấp phát bộ nhớ trong `useFrame`: Đảm bảo không có bất kỳ lệnh `new Vector3()`, `new Matrix4()`, hay tạo object mới nào chạy mỗi khung hình trong toàn bộ `src/3d/`.
4. Fallback WebGL: Kiểm tra `SceneBoundary` và `SceneFallback` đảm bảo nếu WebGL context bị mất (Context Lost) hoặc trình duyệt không hỗ trợ WebGL2, trang vẫn hiển thị hình nền CSS tĩnh `#050505` mà không làm crash ứng dụng React.

✅ DEFINITION OF DONE:
- `npm run build` pass, không lỗi runtime.
- Đo FPS thực tế: Desktop đạt >120 FPS; Mobile viewport (390px) đạt >60 FPS ổn định.
- Tự động hạ tier mượt mà khi co kéo cửa sổ (resize responsive).
- Memory leak: geometries và textures được dọn dẹp khi unmount.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy trang trên browser, đo FPS telemetry qua `src/3d/components/LabTelemetry.jsx` hoặc Performance tab. Lưu số liệu FPS, draw calls, số triangles của cả 3 tier vào `outputs/task-4.2/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.2, ✅ Xong, chi tiết số liệu FPS và cấu hình tier).

⛔ CẤM:
- KHÔNG tắt hoàn toàn 3D trên mobile (vẫn giữ trải nghiệm không gian vũ trụ tối giản).
- KHÔNG đưa màu sắc RGB sặc sỡ vào shader (giữ chất Monochrome B&W thuần khiết).
```

---

## 🎯 TASK 4.3 — prefers-reduced-motion OS Integration & Full Audit
*(Agent: Claude · P0 · ~2h · Wave 2)*

```markdown
Bạn là một Lead Accessibility Auditor đạt chứng chỉ CPACC / WAS chuyên sâu về chuẩn WCAG 2.1 AA/AAA cho các sản phẩm Web cao cấp. Nhiệm vụ của bạn là thực hiện cuộc tổng kiểm tra và nghiệm thu khả năng đáp ứng cài đặt giảm chuyển động (`prefers-reduced-motion`) trên hệ điều hành thực tế — task 4.3 trong kế hoạch.

🎯 MỤC TIÊU:
Giải quyết dứt điểm khoảng trống (gap) đã ghi nhận từ Review Phase 1 và Phase 2: Xác thực rằng khi người dùng kích hoạt "Reduce Motion" trong cài đặt Windows / macOS thật, toàn bộ website "Stellar Odyssey" lập tức chuyển sang chế độ tĩnh hoặc chuyển động tối giản, triệt tiêu mọi nguy cơ gây chóng mặt (vestibular disorders).

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 4.3 (Motion Principles), mục 10 (Task 4.3) và mục 11 (Verification Plan).
2. outputs/review-phase-1.md (mục 4) và outputs/review-phase-2.md (mục 4) — các lưu ý về reduced-motion đã đo.
3. `src/hooks/useReducedMotion.js` và `src/hooks/useSmoothScroll.js`.
4. Toàn bộ các animation trong: `Hero.jsx`, `About.jsx`, `Work.jsx`, `Skills.jsx`, `Education.jsx`, `Experience.jsx`, `Contact.jsx`, `Marquee.jsx`, `Preloader.jsx`, `CameraRig.jsx`, `StarField.jsx`, `OrbitalSkills.jsx`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- accessibility (WCAG 2.1 Criterion 2.3.3 Animation from Interactions)
- a11y-debugging (kiểm tra focus, media queries, accessibility tree)
- gsap-performance (vô hiệu hóa ScrollSmoother và kill active tweens an toàn)

🔌 PLUGIN CÓ THỂ DÙNG: Browser, Code Review.

📐 YÊU CẦU CỤ THỂ:
1. Kiểm tra 100% các điểm chốt chặn chuyển động:
   - **ScrollSmoother:** Phải hoàn toàn bị vô hiệu hóa hoặc bypass. Cuộn trang trở về cơ chế cuộn native của trình duyệt, không có độ trễ mượt (smooth lag = 0).
   - **CameraRig 3D:** Khóa vị trí camera tại tọa độ tĩnh an toàn (`cameraPath(0)`), không tự động di chuyển hay lắc lư theo chuột.
   - **StarField & Shaders:** Đóng băng biến thời gian `uTime` và `uApproach`. Các hạt sao không bay về phía màn hình.
   - **Hero:** Chữ "TRẦN VŨ ANH DUY" và tagline hiển thị ngay lập tức (không chạy SplitText 1.5s hay ScrambleText 1.2s).
   - **Works:** Vô hiệu hóa hoạt cảnh Flip layout khi bấm filter; hình ảnh hiển thị thẳng mà không dùng clip-path scrub.
   - **Skills & Orbital 3D:** Đóng băng vòng quay của các vệ tinh quỹ đạo.
   - **Marquee:** Dải chữ chạy vô tận chuyển thành đoạn text tĩnh xuống dòng tự nhiên, không chuyển động ngang liên tục.
   - **Preloader:** Rút ngắn toàn bộ thời lượng xuống còn ≤0.34s, bỏ hoạt cảnh xoay spinner.
2. Kiểm tra phản ứng trực tiếp khi thay đổi thiết lập lúc trang đang mở (Live preference change):
   - Khi chuyển đổi qua lại giữa `reduce` và `no-preference`, ứng dụng phải cập nhật ngay lập tức mà không cần reload trang và không gây rò rỉ bộ nhớ GSAP context.

✅ DEFINITION OF DONE:
- Xác nhận độc lập: 100% các thành phần chuyển động tôn trọng triệt để `prefers-reduced-motion`.
- Không phát sinh lỗi console hay vỡ bố cục giao diện khi bật tính năng này.
- Có bằng chứng kiểm chứng cụ thể (ảnh chụp màn hình hoặc log kiểm tra DOM/GSAP state).

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy script kiểm tra với cả 2 chế độ `reducedMotion: 'reduce'` và `reducedMotion: 'no-preference'`, đối chiếu trạng thái ScrollSmoother, GSAP triggers count, và CSS transforms. Lưu báo cáo chi tiết vào `outputs/task-4.3/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.3, ✅ Xong, kết luận kiểm toán reduced-motion).

⛔ CẤM:
- KHÔNG được bỏ sót bất kỳ section nào chạy animation ngầm khi reduced-motion đang bật.
```

---

## 🎯 TASK 4.4 — Keyboard Navigation & Focus Management Audit
*(Agent: Claude · P0 · ~2h · Wave 2)*

```markdown
Bạn là một Web Accessibility Specialist chuyên nghiệp. Nhiệm vụ của bạn là rà soát, kiểm thử và hoàn thiện toàn bộ luồng điều hướng bằng bàn phím (Keyboard Navigation) và quản lý tiêu điểm (Focus Management) cho "Stellar Odyssey" — task 4.4 trong kế hoạch.

🎯 MỤC TIÊU:
Đảm bảo người dùng chỉ sử dụng bàn phím (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys) có thể tiếp cận 100% nội dung, kích hoạt mọi chức năng tương tác mà không bị kẹt tiêu điểm (no keyboard trap ngoài ý muốn), thứ tự Tab logic tự nhiên, và luôn nhìn thấy rõ ràng vị trí con trỏ bàn phím (focus indicator).

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 8 (Global Features: A11y), mục 10 (Task 4.4) và mục 11.
2. `src/components/layout/Nav.jsx` (Skip link và focus auto-reveal).
3. `src/components/layout/MenuOverlay.jsx` (Focus trap trong dialog và Esc close).
4. `src/components/Work.jsx` (Filter buttons và project links).
5. `src/components/ui/ThemeToggle.jsx` và `src/components/sections/Skills.jsx` (Checkbox pause).

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- accessibility (WCAG 2.1 Success Criteria: 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible)
- a11y-debugging (tra cứu focus ring styling, tabIndex)
- web-design-guidelines

🔌 PLUGIN CÓ THỂ DÙNG: Browser (tự động hóa nhấn phím Tab/Esc/Enter và chụp snapshot).

📐 YÊU CẦU CỤ THỂ:
1. **Skip to Main Content:**
   - Nhấn phím `Tab` đầu tiên khi vào trang phải hiển thị ngay nút "Chuyển đến nội dung chính" (`#smooth-content`). Kích hoạt bằng `Enter` phải chuyển tiêu điểm vào vùng nội dung chính.
2. **Nav Auto-Reveal:**
   - Khi thanh Nav đang bị ẩn do cuộn xuống, nếu người dùng bàn phím `Shift+Tab` ngược lên các phần tử trên thanh Nav, Nav phải tự động trượt xuống tức thì để tiêu điểm hiển thị rõ ràng.
3. **MenuOverlay Focus Trap & Restore:**
   - Khi mở MenuFullscreen: Tiêu điểm phải lập tức di chuyển vào bên trong Menu. Nhấn `Tab` liên tục phải xoay vòng bên trong Menu, không lọt ra ngoài trang nền.
   - Nhấn `Escape` phải đóng Menu ngay lập tức và đưa tiêu điểm trở lại đúng nút mở Menu trên Navbar.
4. **Interactive Controls:**
   - Bộ lọc Works: Các nút filter bấm được bằng `Enter` hoặc `Space`, thông báo trạng thái qua `aria-pressed`.
   - Nút Pause Orbit ở Skills: Kích hoạt/tắt bằng phím `Space`.
   - Theme Toggle: Bấm được bằng `Enter`/`Space`, thông báo rõ chế độ sáng/tối.
   - Contact CTA Email: Nhận focus và mở mail client khi nhấn `Enter`.
5. **Focus Visible Styling:**
   - Kiểm tra toàn bộ trạng thái `:focus-visible`: Phải có viền rõ nét (tối thiểu 2px trắng tương phản cao `outline-2 outline-white outline-offset-4`).
   - Tuyệt đối không để xảy ra tình trạng ẩn viền tiêu điểm (`outline: none` mà không có style thay thế).

✅ DEFINITION OF DONE:
- Người dùng bàn phím có thể duyệt toàn bộ trang từ đầu đến cuối một cách trực quan, mượt mà.
- 0 keyboard traps ngoài ý muốn; Escape đóng modal chuẩn mực.
- Focus ring hiển thị sắc nét trên mọi thành phần tương tác.

🔍 KIỂM CHỨNG (VERIFICATION):
Viết test script tự động mô phỏng chuỗi nhấn phím `Tab` qua toàn bộ trang, kiểm tra `document.activeElement` tại từng bước. Lưu kết quả vào `outputs/task-4.4/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.4, ✅ Xong, tóm tắt kết quả kiểm toán bàn phím).

⛔ CẤM:
- KHÔNG đặt `tabIndex > 0` (chỉ dùng 0 hoặc -1 để bảo vệ thứ tự DOM tự nhiên).
- KHÔNG xóa bỏ outline trên `:focus-visible`.
```

---

## 🎯 TASK 4.5 — ARIA Landmarks & Screen Reader Audit (WCAG AA)
*(Agent: Claude · P0 · ~2h · Wave 2)*

```markdown
Bạn là một Screen Reader Accessibility Auditor đẳng cấp quốc tế. Nhiệm vụ của bạn là rà soát toàn bộ cấu trúc ngữ nghĩa HTML5 (Semantic Landmarks) và hệ thống nhãn ARIA trên "Stellar Odyssey" — task 4.5 trong kế hoạch.

🎯 MỤC TIÊU:
Đảm bảo trang web cung cấp trải nghiệm hoàn hảo cho người dùng sử dụng trình đọc màn hình (NVDA, VoiceOver, JAWS, TalkBack), đạt 100% tiêu chuẩn WCAG 2.1 AA: các vùng phân định rõ ràng, hình ảnh có alt text chuẩn, các chi tiết trang trí 3D/Canvas được ẩn đúng cách, không phát âm thanh hoặc thông báo rác lặp lại.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 8 (A11y requirements) và mục 11.
2. CLAUDE.md — review focus số 1: ARIA labels, semantic HTML, WCAG 2.1 AA.
3. Toàn bộ các file JSX trong `src/components/`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- accessibility (Landmarks, Accessible Names, ARIA 1.2 patterns)
- a11y-debugging (kiểm tra Accessibility Tree snapshot)

🔌 PLUGIN CÓ THỂ DÙNG: Browser (chụp ariaSnapshot và kiểm tra Accessibility Tree).

📐 YÊU CẦU CỤ THỂ:
1. **Landmark Hierarchy:**
   - Trang phải có đủ: `<header>`, `<nav aria-label="...">`, `<main id="smooth-content">`, `<footer id="contact">` (hoặc footer ngữ nghĩa), và các `<section aria-labelledby="...">` với heading tương ứng.
   - Cấp độ tiêu đề (`h1` → `h6`) phải tuân theo thứ tự phân cấp logic, không nhảy cóc cấp độ vô cớ.
2. **Ẩn chi tiết đồ họa trang trí:**
   - Persistent Canvas 3D (`GalaxyScene`): Bắt buộc có `aria-hidden="true"` để trình đọc màn hình không đọc canvas trống.
   - Custom Cursor (`Cursor.jsx`): Bắt buộc `aria-hidden="true"`.
   - Các SVG icons trang trí, đường kẻ chòm sao, SVG timeline nodes: Bắt buộc có `aria-hidden="true" focusable="false"`.
   - 18 thanh tiến độ kỹ năng trang trí trong Skills: Phải giữ `aria-hidden="true"` (đã làm ở Phase 2, không được gỡ bỏ).
3. **Accessible Name & Descriptions:**
   - Tất cả icon buttons (ví dụ: nút mở Menu, nút đóng Menu, ThemeToggle, mạng xã hội) phải có `aria-label` hoặc văn bản mô tả ẩn rõ ràng bằng cả 2 ngôn ngữ qua i18n.
   - Các link mở tab mới (Behance, Facebook, v.v.) phải có `target="_blank" rel="noopener noreferrer"` kèm nhãn rõ ràng (ví dụ: "mở trong tab mới").
4. **Live Regions & Status:**
   - Preloader: Kiểm tra `role="status"` và `aria-live="polite"`. Số phần trăm trang trí được loại khỏi thông báo lặp từng frame để tránh làm tràn bộ nhớ đọc giọng nói.
   - Text scramble tagline ở Hero: Đảm bảo có `<span className="sr-only">` chứa toàn văn tagline ổn định để screen reader không đọc các ký tự ngẫu nhiên đang xáo trộn.

✅ DEFINITION OF DONE:
- Accessibility Tree phản ánh chính xác cấu trúc tài liệu.
- 100% các nút và link có accessible name có nghĩa.
- Không có lỗi ARIA validation trong console hay audit tool.

🔍 KIỂM CHỨNG (VERIFICATION):
Chụp `ariaSnapshot()` bằng Playwright / Browser tool cho toàn bộ trang chủ và MenuOverlay. Lưu snapshot vào `outputs/task-4.5/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.5, ✅ Xong, kết luận kiểm toán screen reader).

⛔ CẤM:
- KHÔNG lạm dụng ARIA ở những nơi thẻ HTML5 native đã hỗ trợ tốt (Nguyên tắc vàng: "No ARIA is better than bad ARIA").
```

---

## 🎯 TASK 4.6 — SEO: Metadata, Open Graph, JSON-LD Schema
*(Agent: Codex · P1 · ~2h · Wave 1)*

```markdown
Bạn là một Technical SEO & Social Optimization Specialist. Nhiệm vụ của bạn là xây dựng hệ thống thẻ siêu dữ liệu (Metadata), Open Graph, Twitter Cards, Favicon và dữ liệu có cấu trúc JSON-LD hoàn chỉnh cho "Stellar Odyssey" — task 4.6 trong kế hoạch.

🎯 MỤC TIÊU:
Tối ưu hóa khả năng hiển thị trên công cụ tìm kiếm (Google SEO) và hiển thị thẻ xem trước (Rich Snippet / Social Preview) tuyệt đẹp khi chia sẻ link portfolio trên LinkedIn, Facebook, Twitter/X, Zalo, Discord.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 1 (Tổng quan dự án), mục 8 (SEO & Metadata) và mục 10 (Task 4.6).
2. `index.html` — cấu trúc thẻ `<head>` hiện tại.
3. `src/data.js` và `src/i18n/locales/vi.json` / `en.json` — thông tin cá nhân và tác phẩm chính.
4. `public/` — các tài nguyên ảnh đại diện (`avatar.webp`, `pwa-192x192.png`, v.v.).

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- seo-fundamentals (thẻ meta, Open Graph, canonical, schema.org)
- clean-code

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. **Hoàn thiện `index.html` Head Metadata:**
   - `<title>`: Tiêu đề chuyên nghiệp (ví dụ: `Trần Vũ Anh Duy — Creative Designer · Stellar Odyssey Portfolio`).
   - `<meta name="description">`: Đoạn mô tả cô đọng 150–160 ký tự về vai trò Creative Designer (UX/UI, Motion, 3D), định vị phong cách vũ trụ điện ảnh cao cấp.
   - `<meta name="keywords">`: Từ khóa chính xác về ngành nghề và chuyên môn.
   - `<meta name="author">` và `<link rel="canonical" href="...">`.
   - Viewport chuẩn: `width=device-width, initial-scale=1.0` (không chặn user zoom).
2. **Open Graph & Twitter Cards:**
   - `og:type` = `website`, `og:site_name`, `og:title`, `og:description`, `og:url`.
   - `og:image`: Trỏ tới ảnh đại diện chất lượng cao (tạo hoặc chuẩn bị link ảnh 1200×630px mang phong cách hố đen vũ trụ / mockup portfolio).
   - `twitter:card` = `summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.
3. **Dữ liệu có cấu trúc JSON-LD (Schema.org):**
   - Chèn thẻ `<script type="application/ld+json">` chứa Schema `Person` kết hợp `WebSite`:
     - Tên: Trần Vũ Anh Duy
     - Nghề nghiệp (jobTitle): Creative Designer / UX/UI Designer
     - URL website
     - sameAs: Các đường link hồ sơ (Behance, LinkedIn, Facebook)
     - knowAs: Thiết kế trải nghiệm người dùng, Motion Graphics, Thiết kế đồ họa.
4. Đảm bảo hỗ trợ tốt cả tiếng Việt và tiếng Anh khi người dùng chuyển ngữ (đồng bộ `html lang`).

✅ DEFINITION OF DONE:
- `npm run build` pass.
- Đầy đủ 100% thẻ Open Graph và Twitter Card chuẩn không thiếu trường nào.
- Dữ liệu JSON-LD parse hợp lệ qua Schema Validator, 0 lỗi cú pháp.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy kiểm tra cú pháp JSON-LD bằng script node hoặc công cụ kiểm tra thẻ meta trong head. Lưu bằng chứng vào `outputs/task-4.6/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.6, ✅ Xong, danh sách các thẻ meta và schema đã thêm).

⛔ CẤM:
- KHÔNG dùng URL hình ảnh placeholder hỏng hoặc link ngoại vi không tồn tại.
```

---

## 🎯 TASK 4.7 — PWA Audit & Offline Reliability
*(Agent: Codex · P1 · ~1.5h · Wave 1)*

```markdown
Bạn là một Progressive Web App (PWA) Specialist. Nhiệm vụ của bạn là rà soát, kiểm định và tối ưu hóa hệ thống Service Worker và PWA Web Manifest của "Stellar Odyssey" — task 4.7 trong kế hoạch.

🎯 MỤC TIÊU:
Xác thực rằng ứng dụng portfolio có thể cài đặt được như một Native App (Installable PWA) trên máy tính và điện thoại, hỗ trợ bộ nhớ đệm ngoại tuyến (Offline caching) cho các tài nguyên tĩnh cốt lõi, icon hiển thị sắc nét không vỡ.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. `vite.config.js` — cấu hình plugin `VitePWA` hiện tại.
2. `public/manifest.webmanifest` hoặc cấu hình manifest inline trong vite config.
3. `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/favicon.svg`.
4. `src/main.jsx` — đăng ký service worker (`registerSW`).

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- frontend-design

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. **Kiểm tra Web App Manifest:**
   - `name`: "Trần Vũ Anh Duy — Stellar Odyssey"
   - `short_name`: "Anh Duy Portfolio"
   - `theme_color`: "#050505"
   - `background_color`: "#050505"
   - `display`: "standalone"
   - `orientation`: "portrait-primary" (hoặc any)
   - `icons`: Kiểm tra sự tồn tại và tính hợp lệ của icons 192x192 và 512x512 (có mục đích `any` và `maskable`).
2. **Workbox / Service Worker Caching Strategy:**
   - Đảm bảo các tài nguyên tĩnh quan trọng (HTML, CSS bundle, JS chunks, fonts `.woff2`, icon WebP) được precache đầy đủ trong `sw.js`.
   - Chiến lược cache cho hình ảnh dự án và textures: CacheFirst hoặc StaleWhileRevalidate với thời hạn hợp lý.
3. **Thử nghiệm Offline:**
   - Khi ngắt kết nối mạng (Network Offline), người dùng đã từng vào trang vẫn có thể xem lại portfolio và các thông tin cơ bản từ Service Worker cache mà không thấy màn hình "No Internet" của Chrome.

✅ DEFINITION OF DONE:
- `npm run build` tạo ra `dist/sw.js` và `dist/manifest.webmanifest` không lỗi.
- Đạt 100% tiêu chí PWA Installability trong bài kiểm tra của trình duyệt.
- Tải trang thành công ở chế độ Offline.

🔍 KIỂM CHỨNG (VERIFICATION):
Build sản phẩm, chạy `npm run preview`, dùng browser kiểm tra Service Worker registration và tải trang ở trạng thái offline. Lưu kết quả vào `outputs/task-4.7/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.7, ✅ Xong, kết quả audit PWA).
```

---

## 🎯 TASK 4.8 — Image & Asset Audit (WebP / CLS / Dimensions)
*(Agent: Codex · P0 · ~1.5h · Wave 1)*

```markdown
Bạn là một Web Performance & Asset Optimization Specialist. Nhiệm vụ của bạn là rà soát, tối ưu hóa toàn bộ hình ảnh và tài nguyên tĩnh trong dự án "Stellar Odyssey" — task 4.8 trong kế hoạch.

🎯 MỤC TIÊU:
Đảm bảo 100% hình ảnh trên trang đều là định dạng WebP hiện đại, dung lượng nhẹ (<300KB mỗi ảnh), có kích thước chiều rộng/chiều cao tường minh (`width`, `height`) để loại bỏ hoàn toàn hiện tượng xô lệch bố cục khi tải (Cumulative Layout Shift = 0), đồng thời áp dụng `loading="lazy"` và `decoding="async"` hợp lý.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 12 (Việc còn bỏ ngỏ: tối ưu ảnh) và mục 10 (Task 4.8).
2. Thư mục `public/`: kiểm tra toàn bộ file ảnh (`avatar.webp`, `project1.webp`, `project2.webp`, `project3.webp`, các icons...).
3. Các component hiển thị ảnh: `About.jsx`, `Work.jsx`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- web-design-guidelines

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. **Kiểm kê dung lượng tài nguyên:**
   - Xác nhận không còn bất kỳ file ảnh gốc dung lượng lớn nào (như `project2.jpg` 11.5MB cũ) nằm sót lại trong thư mục bundle hay public làm tăng dung lượng deploy.
   - Tất cả ảnh WebP chính phải dưới 300KB (avatar ~110KB, project covers 50–70KB).
2. **Loại trừ Cumulative Layout Shift (CLS):**
   - Mọi thẻ `<img>` trong JSX phải được khai báo thuộc tính `width` và `height` gốc, hoặc đặt trong khung container có tỉ lệ cố định bằng Tailwind CSS (`aspect-[4/5]`, `aspect-[16/10]`).
   - Đảm bảo khi ảnh chưa tải xong hoặc mạng chậm, vị trí và chiều cao của card dự án không bị co giật hay nhảy khung hình.
3. **Thuộc tính tải tối ưu:**
   - Ảnh phía dưới nếp gấp màn hình (About avatar, Works project covers): Thiết lập `loading="lazy"` và `decoding="async"`.
   - Ảnh cover nếu là LCP element (nếu có): Không đặt lazy loading để tránh làm chậm First Contentful Paint.
4. **Kiểm tra Alt Text:**
   - Mọi hình ảnh có ý nghĩa nội dung phải có `alt` text chuẩn lấy từ i18n; các ảnh nền trang trí phụ phải có `alt=""` kèm `aria-hidden="true"`.

✅ DEFINITION OF DONE:
- Toàn bộ ảnh hiển thị đều dưới 300KB, định dạng WebP.
- Chỉ số CLS đo được khi tải trang = 0.
- `npm run build` pass không có cảnh báo tài nguyên hỏng.

🔍 KIỂM CHỨNG (VERIFICATION):
Đo lường CLS và kích thước tải của tất cả ảnh qua script kiểm tra hoặc DevTools. Lưu kết quả vào `outputs/task-4.8/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.8, ✅ Xong, bảng thống kê dung lượng và CLS của ảnh).
```

---

## 🎯 TASK 4.9 — Code Splitting & Dynamic Imports
*(Agent: Antigravity · P1 · ~2h · Wave 3)*

```markdown
Bạn là một Frontend Architecture & Code-Splitting Specialist. Nhiệm vụ của bạn là tối ưu hóa việc phân tách mã nguồn (Code Splitting) và nạp động (Dynamic Imports) cho "Stellar Odyssey" — task 4.9 trong kế hoạch.

🎯 MỤC TIÊU:
Tách biệt luồng tải ban đầu của trang (Initial Landing) khỏi các khối mã nguồn nặng về 3D và tương tác, giúp trình duyệt dựng hình First Contentful Paint (FCP) trong thời gian nhanh nhất (<1.5s), chỉ nạp các thành phần phức tạp khi cần thiết.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. `src/App.jsx` — cấu trúc nạp các component hiện tại (`GalaxyScene`, `OrbitalSkills`, các sections).
2. `vite.config.js` — cấu hình build hiện tại.
3. Kết quả build gần nhất: Chú ý kích thước các file trong `dist/assets/`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- react-best-practices (React.lazy, Suspense boundaries, tree shaking)
- clean-code

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. Rà soát các component đang nạp trong `App.jsx`:
   - `GalaxyScene` và `OrbitalSkills` hiện đã dùng `lazy()`. Kiểm tra xem Suspense fallback có đảm bảo không gây giật layout trong quá trình tải.
   - Đánh giá khả năng nạp động cho các live demo phức tạp trong Playground (`LiveDemo.jsx`).
2. Tách biệt shader và logic tính toán 3D nặng: Đảm bảo các hàm toán học phức tạp hoặc shader code không bị đóng gói vào chunk JS chính của trang (`index-*.js`).
3. Đảm bảo cấu trúc nạp bất đồng bộ không làm ảnh hưởng tới việc khởi tạo và tính toán tọa độ của `ScrollSmoother` và `ScrollTrigger.refresh()`.

✅ DEFINITION OF DONE:
- `npm run build` pass.
- Giảm kích thước file JavaScript ban đầu cần nạp ở lần truy cập đầu tiên.
- Không gây ra lỗi Suspense cascade hoặc hiện tượng chớp trắng (FOUC).

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy `npm run build`, so sánh kích thước các file chunks trước và sau khi tách. Lưu bảng so sánh vào `outputs/task-4.9/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.9, ✅ Xong, kết quả phân tách mã).
```

---

## 🎯 TASK 4.10 — Bundle Analysis & ManualChunks (Fix >500KB warning)
*(Agent: Codex · P1 · ~1.5h · Wave 3)*

```markdown
Bạn là một Webpack/Rollup/Vite Build Optimization Engineer hàng đầu. Nhiệm vụ của bạn là giải quyết dứt điểm cảnh báo kích thước chunk lớn hơn 500kB (`(!) Some chunks are larger than 500 kB after minification`) bằng cách cấu hình `manualChunks` trong `vite.config.js` — task 4.10 trong kế hoạch.

🎯 MỤC TIÊU:
Tái cấu trúc việc chia nhỏ thư viện bên thứ ba (Vendor Chunking) trong Vite Rollup options, đưa tất cả các file chunk về dưới ngưỡng khuyến nghị 500kB (hoặc phân bổ hợp lý theo chức năng), tăng tỷ lệ cache trình duyệt và tối ưu tốc độ tải trang.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. `vite.config.js` — cấu hình hiện tại của dự án.
2. `package.json` — danh sách dependencies: Three.js, React Three Fiber, postprocessing, GSAP Club, Lucide, Zustand, i18next.
3. Log cảnh báo từ các lần build trước: `events-*.esm-*.js (920 kB)` và `index-*.js (505 kB)`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- react-best-practices

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. Cấu hình `build.rollupOptions.output.manualChunks` trong `vite.config.js` theo chiến lược phân nhóm hợp lý:
   - `vendor-three`: bao gồm `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`.
   - `vendor-gsap`: bao gồm `gsap`, `@gsap/react`.
   - `vendor-react`: bao gồm `react`, `react-dom`, `zustand`, `i18next`, `react-i18next`.
   - `vendor-icons`: bao gồm `lucide-react`.
2. Kiểm tra tránh hiện tượng Circular Chunk Dependencies (các chunk phụ thuộc vòng tròn gây lỗi runtime).
3. Đảm bảo cấu hình không làm hỏng cơ chế tree-shaking tự nhiên của Vite.
4. Chạy `npm run build` và kiểm tra báo cáo kích thước file cuối cùng.

✅ DEFINITION OF DONE:
- `npm run build` chạy thành công, không còn cảnh báo vàng `Some chunks are larger than 500 kB` (hoặc các vendor chunk 3D được tách riêng biệt rõ ràng và có lý do kỹ thuật chính đáng).
- Toàn bộ ứng dụng chạy bình thường trong cả môi trường `dev` và `preview` (`npm run preview`), không có lỗi import module trong console.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy `npm run build`, trích xuất bảng phân bổ dung lượng chunks mới từ terminal. Chạy `npm run preview` và kiểm tra console sạch 0 lỗi. Lưu log vào `outputs/task-4.10/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.10, ✅ Xong, danh sách các chunk đã phân tách).
```

---

## 🎯 TASK 4.11 — Lighthouse Audit & Web Vitals (Target 90+)
*(Agent: Claude · P0 · ~2h · Wave 4)*

```markdown
Bạn là một Web Performance Auditor kiêm Google Web Vitals Consultant. Nhiệm vụ của bạn là thực hiện cuộc kiểm toán Lighthouse toàn diện và đo kiểm các chỉ số Core Web Vitals trên bản build production của "Stellar Odyssey" — task 4.11 trong kế hoạch.

🎯 MỤC TIÊU:
Đạt điểm số tối thiểu **90+ trên tất cả 4 hạng mục của Google Lighthouse**:
- **Performance:** ≥ 90 (mục tiêu thách thức cho site Full 3D WebGL)
- **Accessibility:** ≥ 95 (mục tiêu 100)
- **Best Practices:** ≥ 95 (mục tiêu 100)
- **SEO:** ≥ 95 (mục tiêu 100)
Đồng thời xác nhận các chỉ số Core Web Vitals đạt chuẩn: LCP < 2.5s, CLS < 0.1, INP/FID < 100ms.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 11 (Verification Plan: Lighthouse 90+ mọi hạng mục, FCP < 3s, Awwwards checklist).
2. Các kết quả tối ưu hóa từ Tasks 4.1 đến 4.10.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- accessibility (audit a11y theo Lighthouse)
- a11y-debugging
- seo-fundamentals
- clean-code

🔌 PLUGIN CÓ THỂ DÙNG: Browser (chạy audit hoặc script đo kiểm tự động).

📐 YÊU CẦU CỤ THỂ:
1. Chạy bản build production: `npm run build` && `npm run preview`.
2. Thực hiện audit trên môi trường mô phỏng thiết bị di động (Mobile) và máy tính để bàn (Desktop).
3. Đọc kỹ từng vi phạm (nếu có điểm nào <90) và đưa ra danh sách đề xuất khắc phục cụ thể:
   - Nếu Performance bị kéo xuống do render 3D WebGL ban đầu: Tối ưu thời điểm kích hoạt canvas hoặc tinh chỉnh defer scripts.
   - Nếu Accessibility có vi phạm: Chỉ rõ selector và mã lỗi ARIA/contrast.
   - Nếu Best Practices có cảnh báo: Kiểm tra HTTPS, console errors, deprecated APIs.
   - Nếu SEO thiếu thẻ: Bổ sung meta tags còn sót.
4. Lập báo cáo kết quả chi tiết theo từng chỉ số kèm số điểm đạt được.

✅ DEFINITION OF DONE:
- Báo cáo kết quả Lighthouse chi tiết với bằng chứng điểm số.
- Cả 4 hạng mục đều đạt chuẩn ≥ 90 điểm (ưu tiên 95–100 cho Accessibility và SEO).
- FCP và LCP đạt vùng xanh an toàn.

🔍 KIỂM CHỨNG (VERIFICATION):
Lưu toàn bộ kết quả phân tích điểm số và các metric Web Vitals vào `outputs/task-4.11/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.11, ✅ Xong, bảng điểm Lighthouse 4 hạng mục).
```

---

## 🎯 TASK 4.12 — Cross-Browser Verification (Chrome, Firefox, Safari, Edge)
*(Agent: Claude · P1 · ~2h · Wave 4)*

```markdown
Bạn là một Cross-Browser Compatibility Specialist. Nhiệm vụ của bạn là kiểm thử và xác nhận độ tương thích hoàn hảo của "Stellar Odyssey" trên tất cả các engine trình duyệt phổ biến nhất thế giới — task 4.12 trong kế hoạch.

🎯 MỤC TIÊU:
Xác nhận website hiển thị nhất quán, hoạt động mượt mà và không phát sinh lỗi đồ họa hay gãy layout trên cả 3 engine trình duyệt chính:
1. **Chromium** (Google Chrome, Microsoft Edge, Brave, Opera)
2. **Gecko** (Mozilla Firefox)
3. **WebKit** (Apple Safari trên macOS và iOS)

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 11 (Cross-browser check) và mục 5 (Tech stack).
2. Các điểm kỹ thuật đặc thù:
   - CSS `backdrop-filter: blur(...)` (yêu cầu `-webkit-backdrop-filter` trên Safari cũ).
   - CSS `clip-path` polygon / inset transitions.
   - WebGL2 Shader extensions và Float textures trong Three.js / R3F.
   - GSAP ScrollSmoother và passive scroll wheel trên Firefox / Safari.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- web-design-guidelines
- clean-code
- code-review

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. Rà soát các cú pháp CSS và WebGL trong codebase:
   - Kiểm tra xem các thuộc tính hiện đại có vendor prefix cần thiết không (PostCSS/Autoprefixer đã cấu hình chuẩn chưa).
   - Kiểm tra font loading: Đảm bảo Unbounded Variable woff2 hiển thị trơn tru, không bị giật font (FOUT/FOIT) trên Safari hay Firefox.
2. Kiểm tra tính năng WebGL 3D:
   - Kiểm tra `GalaxyScene` và `BlackHoleSystem` trên Firefox (vốn có trình quản lý bộ nhớ WebGL khắt khe hơn Chromium).
   - Xác nhận cơ chế phục hồi Context Lost nếu xảy ra.
3. Kiểm tra trải nghiệm cuộn mượt (ScrollSmoother):
   - Đảm bảo quán tính cuộn (momentum scrolling) trên Safari iOS và macOS không bị xung đột với ScrollSmoother.
4. Lập bảng đối chiếu kết quả tương thích trên 4 trình duyệt lớn.

✅ DEFINITION OF DONE:
- Không phát sinh lỗi gãy layout, lệch font hay vỡ shader trên bất kỳ trình duyệt nào.
- 0 lỗi console đặc thù theo trình duyệt.

🔍 KIỂM CHỨNG (VERIFICATION):
Tổng hợp kết quả kiểm tra và chụp màn hình đối chiếu vào `outputs/task-4.12/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.12, ✅ Xong, kết luận cross-browser).
```

---

## 🎯 TASK 4.13 — Easing, Camera Lerp & Motion Polish
*(Agent: Antigravity · P1 · ~2h · Wave 3)*

```markdown
Bạn là một World-Class Creative Motion Director (từng tham gia sản xuất các tác phẩm đoạt Site of the Month trên Awwwards). Nhiệm vụ của bạn là trau chuốt nhịp điệu chuyển động (Motion Easing & Timing Polish) cho "Stellar Odyssey" — task 4.13 trong kế hoạch.

🎯 MỤC TIÊU:
Nâng tầm cảm giác lướt web từ "chạy mượt mà" lên "trải nghiệm điện ảnh đỉnh cao": tinh chỉnh gia tốc camera 3D, độ mượt của quán tính cuộn, các đường cong easing (`expo.out`, `power3.out`, `sine.inOut`), độ trễ phản hồi hover, mang lại cảm giác huyền bí, sang trọng và không gian vô tận.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 3 (Tham chiếu Noomo / Mont-fort / Anime.js) và mục 4.3 (Motion Principles: Easing & Duration).
2. `src/3d/components/CameraRig.jsx` — công thức nội suy `zEase`, `xyEase` và parallax chuột.
3. `src/hooks/useSmoothScroll.js` — tham số smooth của ScrollSmoother.
4. `src/components/Cursor.jsx` — thời gian phản hồi quickTo của con trỏ.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- gsap-performance
- react-3d-ui
- high-end-visual-design (nếu có) / ui-ux-pro-max

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. **CameraRig Damping:**
   - Tinh chỉnh hệ số quán tính camera khi cuộn nhanh và dừng lại: Không để camera dừng đột ngột gây giật mắt; độ trôi khi dừng phải êm ái như tàu không gian lướt trong chân không.
   - Parallax chuột: Đảm bảo độ nhạy chuyển động theo chuột vừa đủ tinh tế (subtle depth), không rung lắc mạnh gây mất tập trung đọc chữ.
2. **ScrollSmoother Tuning:**
   - Xác nhận giá trị `smooth: 1.2` (hoặc 1.0–1.4) tạo cảm giác lướt đầm chắc, sang trọng kiểu editorial, không bị trễ quá lâu gây ức chế thao tác.
3. **Micro-interactions:**
   - Card hover transition: 150ms – 250ms với ease tự nhiên; hiệu ứng đổi border mượt mà.
   - Custom Cursor: `quickTo` bám sát chuột với độ trễ vi mô (0.08s dot, 0.3s ring), tạo cảm giác có khối lượng nhẹ.
   - Nút CTA Email pulse glow: Tinh chỉnh nhịp đập chậm rãi, huyền bí (chu kỳ ~2.4s).

✅ DEFINITION OF DONE:
- Trải nghiệm chuyển động đạt độ chín muồi về thẩm mỹ, không giật cục, không trễ nải.
- Duy trì ổn định >120 FPS trong suốt quá trình chuyển động.

🔍 KIỂM CHỨNG (VERIFICATION):
Ghi lại video hoặc phân tích biểu đồ Frame Time trên DevTools Performance. Lưu báo cáo vào `outputs/task-4.13/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.13, ✅ Xong, các thông số easing đã hoàn thiện).
```

---

## 🎯 TASK 4.14 — Visual QA Pixel-Perfect & Dọn Tàn Dư Legacy (Footer, Root Text)
*(Agent: Codex · P0 · ~2h · Wave 2 — BẮT BUỘC ĐỂ ĐẠT CHUẨN PHASE 4)*

```markdown
Bạn là một Lead Visual QA Engineer kiêm Design System Enforcer. Nhiệm vụ của bạn là rà soát trực quan từng pixel và xử lý triệt để 2 vấn đề tồn dư từ Phase 0–2 đã được chỉ ra trong Báo Cáo Review Phase 2 — task 4.14 trong kế hoạch.

🎯 MỤC TIÊU:
1. **Viết lại dứt điểm `src/components/Footer.jsx`**: Thay thế toàn bộ mã cũ mang nền kem `#F5F5F0`, chữ đỏ `#FF3333` và font `syne` bằng thiết kế Monochrome B&W vũ trụ đúng chuẩn (nền đen `--bg-void`, viền `--bg-elevated`, font Unbounded + Space Grotesk, chữ trắng/xám).
2. **Sửa lớp màu chữ tại container gốc `src/App.jsx:64`**: Đổi `text-[#1a1a1a]` thành token `text-(--text-primary)`.
3. Kiểm tra toàn trang để loại bỏ bất kỳ viền, bóng, hay mã màu cứng nào còn lệch chuẩn Monochrome B&W.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/review-phase-2.md — mục "⚠️ DANH SÁCH VẤN ĐỀ VÀ ĐỀ XUẤT", Issue 1 (Footer) và Issue 2 (App.jsx).
2. `src/styles/globals.css` — bảng token màu chuẩn: `--bg-void`, `--bg-nebula`, `--text-primary`, `--text-secondary`, `--glow-button`.
3. `src/components/Footer.jsx` và `src/App.jsx`.
4. `src/i18n/locales/vi.json` & `en.json` — nhóm `footer.*` và `contact.*`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- web-design-guidelines
- ui-ux-pro-max (chống slop, pixel perfect, mono palette)

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. **Refactor `src/components/Footer.jsx`:**
   - Xóa bỏ hoàn toàn class `bg-[#F5F5F0]`, `border-black`, `text-[#FF3333]`, `font-syne`.
   - Nền: Sử dụng `bg-(--bg-void)` kết hợp đường viền phân tách mờ `border-t border-white/[0.08]`.
   - Typography: Chuyển tiêu đề sang `font-display` (Unbounded) màu `text-(--text-primary)` (trắng `#FAFAFA`); nội dung copyright/credits dùng `font-mono` (JetBrains Mono) màu `text-(--text-secondary)`.
   - Nút email và mạng xã hội: Áp dụng style mono viền `border-white/10 hover:border-white/35 hover:text-white`.
   - Đổi `id="contact"` của Footer thành thẻ ngữ nghĩa hoặc id phụ không xung đột với Contact section (`id="transmission"`).
2. **Sửa `src/App.jsx:64`:**
   - Đổi `className="noise bg-transparent text-[#1a1a1a] ..."` thành `className="noise bg-transparent text-(--text-primary) ..."`.
3. **Rà soát toàn bộ dự án:**
   - Chạy lệnh tìm kiếm mã màu HEX cứng: Tìm xem còn `#` nào xuất hiện trong các class CSS ngoài các token chuẩn không. Toàn bộ giao diện phải là một khối đen-trắng-xám thuần nhất, đẳng cấp.

✅ DEFINITION OF DONE:
- `Footer.jsx` hoàn toàn đồng nhất với phong cách vũ trụ điện ảnh; không còn chữ đỏ hay nền kem.
- `App.jsx` sạch sẽ, kế thừa đúng semantic text color.
- `npm run build` và `npm run lint` pass, 0 lỗi.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy trang trên browser, cuộn xuống chân trang kiểm tra trực tiếp Footer. Đo pixel màu nền và màu chữ. Lưu bằng chứng chụp ảnh màn hình vào `outputs/task-4.14/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.14, ✅ Xong, chi tiết refactor Footer).

⛔ CẤM:
- KHÔNG thêm màu nhấn mới (accent color) vào Footer.
- KHÔNG làm mất các key i18n đã nối ở Task 2.14.
```

---

## 🎯 TASK 4.15 — Dark / Light Mode Audit
*(Agent: Claude · P1 · ~1.5h · Wave 3)*

```markdown
Bạn là một Design System & Color Contrast Auditor. Nhiệm vụ của bạn là kiểm tra, đánh giá toàn diện trải nghiệm chuyển đổi giao diện Sáng / Tối (Dark / Light Mode) cho "Stellar Odyssey" — task 4.15 trong kế hoạch.

🎯 MỤC TIÊU:
Xác nhận rằng cơ chế Dark / Light toggle (`ThemeToggle.jsx` & `useThemeStore.js`) hoạt động hoàn hảo: Dark mode (chính) giữ vững chất sâu thẳm huyền bí của vũ trụ, Light mode (phụ) mang vẻ đẹp tối giản, thanh lịch kiểu bảo tàng hiện đại, độ tương phản ở cả 2 chế độ đều vượt chuẩn WCAG 2.1 AA (≥4.5:1).

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 4.1 (Color Palette: Dark primary & Light mode secondary tokens).
2. `src/styles/globals.css` — các biến CSS cho `[data-theme='light']`:
   - `--bg-void-light: #FAFAFA`, `--bg-nebula-light: #F2F2F2`, `--bg-surface-light: #FFFFFF`.
   - `--text-primary-light: #111111`, `--text-secondary-light: #666666`.
   - `--glow-button: 0 0 20px rgba(0,0,0,0.25)`.
3. `src/components/ui/ThemeToggle.jsx` và `public/theme-init.js`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- accessibility (color contrast auditing)
- web-design-guidelines
- ui-ux-pro-max

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ:
1. Kiểm tra chuyển đổi qua nút bấm:
   - Nhấn `ThemeToggle`: Thuộc tính `data-theme="light"` được gắn vào thẻ `<html>`, thẻ `<meta name="theme-color">` đổi sang `#FAFAFA`, lưu trạng thái vào `localStorage('stellar-theme')`.
   - Nhấn lần nữa: Quay lại dark mode (`#050505`).
2. Đo kiểm độ tương phản ở Light Mode:
   - Chữ chính `#111111` trên nền `#FAFAFA`: Tỷ lệ tương phản đạt ~16.5:1 (đạt chuẩn AAA).
   - Chữ phụ `#666666` trên nền `#FAFAFA`: Tỷ lệ tương phản đạt ~5.7:1 (đạt chuẩn AA).
   - Viền card, divider: Nhìn rõ ràng, phân định được các khối nội dung.
3. Khử Flash of Unstyled Content (FOUC):
   - Reload trang ở cả 2 chế độ: Script `public/theme-init.js` phải áp dụng theme trước khi React render, không để xảy ra hiện tượng chớp nháy màu nền.
4. Đảm bảo Canvas 3D thích ứng hợp lý hoặc giữ vai trò nền mờ không làm giảm độ tương phản đọc chữ ở Light Mode.

✅ DEFINITION OF DONE:
- Cả 2 chế độ Dark và Light đều đẹp, đọc rõ chữ, đạt chuẩn WCAG AA.
- Lưu trữ localStorage ổn định qua các lần reload trang.
- 0 lỗi console khi chuyển đổi qua lại liên tục.

🔍 KIỂM CHỨNG (VERIFICATION):
Chụp snapshot và đo độ tương phản màu của các phần tử chính ở cả 2 chế độ. Lưu báo cáo vào `outputs/task-4.15/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.15, ✅ Xong, kết quả audit dark/light).
```

---

## 🎯 TASK 4.16 — i18n Proofread & Hoàn Thiện Content Placeholders
*(Agent: Claude · P1 · ~1.5h · Wave 2)*

```markdown
Bạn là một Lead Bilingual Copywriter & Editor chuyên trách cho các portfolio thiết kế quốc tế. Nhiệm vụ của bạn là rà soát lần cuối chất lượng bản dịch song ngữ Vi/En và xử lý các placeholder còn khuyết trong "Stellar Odyssey" — task 4.16 trong kế hoạch.

🎯 MỤC TIÊU:
Giải quyết dứt điểm các đề xuất và placeholder đã được ghi nhận trong Báo Cáo Task 2.14 (`outputs/i18n-audit.md`): bảo đảm câu từ tiếng Anh tự nhiên, chuẩn phong cách quốc tế (Awwwards writing style), tiếng Việt trau chuốt, tự tin, giàu tính thẩm mỹ, 100% khớp khóa (key parity) giữa 2 file ngôn ngữ.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. outputs/i18n-audit.md — mục "6 đề xuất chờ xác nhận" và "Placeholder cần người dùng cung cấp".
2. CLAUDE.md — mục "Writing Style for Portfolio Content": bí ẩn, giàu trí tưởng tượng, tự tin, chuyên nghiệp, micro-copy vũ trụ ngắn rõ.
3. `src/i18n/locales/vi.json` và `src/i18n/locales/en.json`.
4. `outputs/content-vi.md` và `outputs/content-en.md`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- code-review

🔌 PLUGIN CÓ THỂ DÙNG: Browser, Documents.

📐 YÊU CẦU CỤ THỂ:
1. **Xử lý 6 đề xuất chuẩn hóa ngữ văn từ Task 2.14:**
   - `education.institutions.saigonUniversity.description`: Chuẩn hóa tiếng Anh tự nhiên (ví dụ: "Graduated with High Honors in Information Technology...").
   - `education.institutions.arenaMultimedia.description`: Chuẩn hóa câu tiếng Anh đạt chuẩn văn phạm quốc tế.
   - `education.institutions.arenaMultimedia.degree`: Thống nhất tên văn bằng "Advanced Diploma in Multimedia".
   - `experience.positions.designveloper.description`: Sửa câu kết thành "Handed off designs to development teams."
   - `works.projects.verisApp.description`: Thống nhất thì ngữ pháp diễn đạt hiện tại.
   - `common.marquees.collaboration`: Đồng bộ số lượng từ giữa 2 thứ tiếng.
2. **Xử lý các Placeholder dữ liệu còn trống:**
   - Link mạng xã hội: Kiểm tra các key `contact.linkedinUrl`, `contact.behanceUrl`. Nếu người dùng chưa cung cấp link thật, áp dụng cơ chế hiển thị link an toàn (trỏ tới profile mẫu hoặc ẩn icon thông minh thay vì để link chết).
   - `skills.technicalLevel`: Định dạng nhãn hiển thị trang nhã, không để text trống.
3. **Kiểm tra tính nhất quán thuật ngữ:**
   - Toàn trang sử dụng thống nhất thuật ngữ **"HỐ ĐEN"** (Black Hole), không dùng lẫn lộn "Lỗ đen".
4. Chạy script đối chiếu parity để đảm bảo số lượng khóa khớp 100%.

✅ DEFINITION OF DONE:
- Hai file `vi.json` và `en.json` đồng bộ 100% keys, 0 lỗi cú pháp JSON.
- Bản dịch tiếng Anh chuyên nghiệp, không mang văn phong dịch máy (machine translation).
- Ứng dụng chạy mượt, chuyển đổi ngôn ngữ không sót chữ nào.

🔍 KIỂM CHỨNG (VERIFICATION):
Chạy `node outputs/task-2.14/check-i18n.mjs` hoặc script đối chiếu JSON parity. Lưu kết quả vào `outputs/task-4.16/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 4.16, ✅ Xong, tóm tắt các chỉnh sửa copy).

⛔ CẤM:
- KHÔNG tự ý bịa đặt thành tích, giải thưởng không có trong tài liệu draft gốc.
```

---

# 🚀 BỘ PROMPTS CHI TIẾT — PHASE 5: LAUNCH & DEPLOY

---

## 🎯 TASK 5.1 — Final Build & Pre-flight Checklist
*(Agent: Codex · P0 · ~30m · Wave 1)*

```markdown
Bạn là một Release Engineer kiêm DevOps Specialist. Nhiệm vụ của bạn là thực hiện đợt đóng gói sản phẩm cuối cùng (Production Build) và chạy bảng kiểm tra trước chuyến bay (Pre-flight Checklist) cho "Stellar Odyssey" — task 5.1 trong kế hoạch.

🎯 MỤC TIÊU:
Xác nhận rằng mã nguồn dự án hoàn toàn sạch sẽ, không có bất kỳ lỗi biên dịch (build error), lỗi phân tích tĩnh (lint error), cảnh báo tài nguyên hỏng, sẵn sàng 100% để triển khai lên hạ tầng đám mây Vercel.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 10 (Phase 5: Launch) và mục 11 (Verification Plan).
2. `package.json`, `vite.config.js`, `eslint.config.js`.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- react-best-practices

🔌 PLUGIN CÓ THỂ DÙNG: Không bắt buộc.

📐 YÊU CẦU CỤ THỂ:
1. Chạy `npm run lint`:
   - Xác nhận 0 errors. Nếu còn warning, đánh giá mức độ an toàn.
2. Chạy `npm run build`:
   - Kiểm tra log build: Quá trình biên dịch Vite phải hoàn thành thành công trong < 10 giây.
   - Thư mục `dist/` được sinh ra đầy đủ với: `index.html`, thư mục `assets/` (CSS, JS chunks, fonts woff2), `manifest.webmanifest`, `sw.js`, các icons và images WebP.
3. Chạy `npm run preview`:
   - Mở preview local để xác thực rằng bản build minified chạy trơn tru, không bị lỗi thiếu biến môi trường, không có đường dẫn file tương đối bị sai lệch.
4. Kiểm tra Git working tree: Xác nhận tất cả thay đổi cần thiết đã được commit hoặc sẵn sàng để đẩy lên remote.

✅ DEFINITION OF DONE:
- Build production thành công 100%, 0 lỗi.
- Preview local hoạt động ổn định, 0 console error.

🔍 KIỂM CHỨNG (VERIFICATION):
Ghi lại toàn bộ log của `npm run lint` và `npm run build` vào `outputs/task-5.1/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 5.1, ✅ Xong, kết quả pre-flight build).
```

---

## 🎯 TASK 5.2 — Vercel Deployment & Production Setup
*(Agent: Codex · P0 · ~1h · Wave 2)*

```markdown
Bạn là một Cloud Deployment & Vercel Infrastructure Engineer. Nhiệm vụ của bạn là thiết lập cấu hình và triển khai dự án "Stellar Odyssey" lên nền tảng Vercel Edge Network — task 5.2 trong kế hoạch.

🎯 MỤC TIÊU:
Đưa website chính thức hoạt động trên mạng Internet thông qua domain Vercel (`*.vercel.app`), cấu hình tối ưu bộ nhớ đệm (Cache Headers), bảo mật HTTP headers, và định tuyến PWA mượt mà.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 1 (Deploy: Vercel) và mục 10 (Task 5.2).
2. `vercel.json` (tạo mới nếu chưa có).
3. `package.json` và cấu hình Vite output.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code

🔌 PLUGIN CÓ THỂ DÙNG: Không bắt buộc.

📐 YÊU CẦU CỤ THỂ:
1. **Tạo file cấu hình `vercel.json` tại thư mục gốc:**
   - **Headers bảo mật & Cache:**
     - Thiết lập cache vĩnh viễn (`Cache-Control: public, max-age=31536000, immutable`) cho các tài nguyên có băm nội dung trong `/assets/*` (js, css, woff2).
     - Thiết lập `Cache-Control: public, max-age=0, must-revalidate` cho `index.html` và `sw.js` để người dùng luôn nhận bản cập nhật mới nhất ngay lập tức.
     - Bảo mật: Thêm các headers `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
   - **Rewrites SPA:** Định tuyến tất cả các request về `/index.html` để hỗ trợ SPA routing nếu cần.
2. **Quy trình Deploy:**
   - Hướng dẫn hoặc thực thi việc liên kết repository với Vercel Project qua Vercel CLI (`vercel --prod`) hoặc GitHub integration trên branch `feature/stellar-odyssey`.
   - Kiểm tra build settings: Framework Preset = `Vite`, Build Command = `npm run build`, Output Directory = `dist`.
3. Ghi lại Production URL chính thức của dự án.

✅ DEFINITION OF DONE:
- Website được deploy thành công lên Vercel, trả về HTTP status 200 tại trang chủ.
- SSL/TLS HTTPS hoạt động tự động.
- File `vercel.json` chuẩn chỉ, bảo mật cao.

🔍 KIỂM CHỨNG (VERIFICATION):
Truy cập URL production, kiểm tra headers HTTP trả về qua curl hoặc DevTools Network. Lưu thông tin URL và headers vào `outputs/task-5.2/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 5.2, ✅ Xong, Production URL).
```

---

## 🎯 TASK 5.3 — Vercel Analytics & Speed Insights
*(Agent: Codex · P1 · ~30m · Wave 2)*

```markdown
Bạn là một Web Analytics & Observability Engineer. Nhiệm vụ của bạn là tích hợp công cụ đo lường trải nghiệm thực tế (Real User Monitoring - RUM) thông qua Vercel Analytics / Speed Insights vào dự án "Stellar Odyssey" — task 5.3 trong kế hoạch.

🎯 MỤC TIÊU:
Thu thập dữ liệu thực tế về tốc độ tải trang, Core Web Vitals của người dùng thực trên toàn cầu và lưu lượng truy cập mà không làm giảm điểm hiệu năng hay tăng dung lượng bundle quá mức.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. `src/App.jsx` hoặc `src/main.jsx`.
2. Tài liệu Vercel Analytics cho Vite / React SPA.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- react-best-practices

🔌 PLUGIN CÓ THỂ DÙNG: Không bắt buộc.

📐 YÊU CẦU CỤ THỂ:
1. Cài đặt các gói phụ thuộc siêu nhẹ từ Vercel: `@vercel/analytics` và `@vercel/speed-insights`.
2. Khởi tạo components tương ứng bên trong `src/App.jsx` hoặc `src/main.jsx`:
   - Đảm bảo các component analytics chỉ chạy trên môi trường production, không làm chậm môi trường development.
3. Xác nhận bundle size không tăng quá 2–3kB gzipped.
4. Build và deploy bản cập nhật lên Vercel.

✅ DEFINITION OF DONE:
- Thư viện analytics được nhúng an toàn, không có lỗi script.
- Dữ liệu lượt xem và Core Web Vitals bắt đầu được gửi về Vercel Dashboard khi truy cập URL production.

🔍 KIỂM CHỨNG (VERIFICATION):
Kiểm tra tab Network trên production URL để xác nhận beacon request gửi về `/_vercel/insights` thành công. Lưu kết quả vào `outputs/task-5.3/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 5.3, ✅ Xong, trạng thái analytics).
```

---

## 🎯 TASK 5.4 — Production Smoke Test & Live URL Verification
*(Agent: Claude · P0 · ~1h · Wave 3)*

```markdown
Bạn là một Principal QA Director kiêm Production Release Auditor. Nhiệm vụ của bạn là thực hiện đợt Smoke Test toàn diện trên đường dẫn Production thực tế (`*.vercel.app`) của dự án "Stellar Odyssey" — task 5.4 trong kế hoạch.

🎯 MỤC TIÊU:
Xác nhận rằng sản phẩm chạy trực tiếp trên môi trường đám mây thực tế đạt độ hoàn thiện cao nhất, không phát sinh bất kỳ lỗi đường dẫn (404), lỗi WebGL, lỗi font, hay trục trặc tương tác nào trên mạng Internet công cộng.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. URL Production được cấp từ Task 5.2.
2. kế-hoạch.md — mục 11 (Verification Plan).
3. Danh sách kiểm tra nghiệm thu Awwwards.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- webapp-testing (kiểm thử end-to-end trên môi trường live)
- accessibility
- code-review

🔌 PLUGIN CÓ THỂ DÙNG: Browser.

📐 YÊU CẦU CỤ THỂ — KIỂM TRA TRỰC TIẾP TRÊN PRODUCTION URL:
1. **Khởi tạo & Tải trang ban đầu:**
   - Preloader chạy mượt mà, sau đó fade mở cảnh vũ trụ và Hero.
   - 3D GalaxyScene render đúng vị trí, không bị màn hình đen hay context lost.
   - Fonts Unbounded, Space Grotesk, JetBrains Mono hiển thị sắc nét, không bị giật layout.
2. **Cuộn & Hiệu ứng chuyển động:**
   - Cuộn toàn bộ trang từ Hero tới Hố đen ở Contact: Camera di chuyển chuẩn xác, các set pieces xuất hiện đúng section.
   - Thử nghiệm trên cả máy tính để bàn (chuột + bàn phím) và điện thoại di động (vuốt chạm cảm ứng).
3. **Các tính năng tương tác:**
   - Mở/đóng MenuOverlay: 3D transition mượt mà, focus trap và Esc hoạt động.
   - Theme toggle Sáng / Tối: Hoạt động trơn tru, không chớp nền.
   - Đổi ngôn ngữ Vi / En: Toàn bộ text đổi tức thì, layout nguyên vẹn.
   - Bộ lọc dự án (Selected Works): Flip transition mượt, link Behance mở tab mới an toàn.
   - Thử nghiệm Live Demos trong Playground.
   - Link email, gọi điện, mạng xã hội hoạt động chuẩn xác.
4. **Console & Mạng:**
   - Tab Console: 0 lỗi đỏ (Uncaught Error / TypeError).
   - Tab Network: 0 mã lỗi 404 cho assets (images, icons, fonts, shaders).

✅ DEFINITION OF DONE:
- Biên bản nghiệm thu Production hoàn tất với 100% tiêu chí ĐẠT.
- Sản phẩm sẵn sàng để công bố rộng rãi tới công chúng và ban giám khảo Awwwards.

🔍 KIỂM CHỨNG (VERIFICATION):
Chụp ảnh màn hình các section trên production live và ghi biên bản kiểm thử vào `outputs/task-5.4/verification.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 5.4, ✅ Xong, biên bản nghiệm thu live).
```

---

## 🎯 TASK 5.5 — Comprehensive README & Portfolio Documentation
*(Agent: Claude · P1 · ~1.5h · Wave 3)*

```markdown
Bạn là một Lead Technical Writer & Open-Source Showcase Author. Nhiệm vụ của bạn là viết lại file `README.md` chính của repository theo tiêu chuẩn của một dự án mã nguồn mở đoạt giải thưởng Awwwards / GitHub Trending — task 5.5 trong kế hoạch.

🎯 MỤC TIÊU:
Tạo tài liệu README đẳng cấp, truyền cảm hứng và chuyên nghiệp: mô tả câu chuyện thiết kế "Stellar Odyssey", sơ đồ kiến trúc 5 tầng, các quyết định công nghệ quan trọng (React 19, R3F, GSAP Club, Tailwind 4, Mono B&W), benchmark hiệu năng vượt trội (>160 FPS), và hướng dẫn phát triển rõ ràng.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 1 (Tổng quan), 2 (Quyết định chốt), 4 (Design System), 5 (Tech stack), 6 (Kiến trúc).
2. AGENTS.md — lịch sử phát triển và các mốc hoàn thành từ Phase 0 đến Phase 5.
3. `package.json` và Production URL đã deploy.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- brand-guidelines

🔌 PLUGIN CÓ THỂ DÙNG: Không bắt buộc.

📐 YÊU CẦU CỤ THỂ:
1. **Cấu trúc README.md chuẩn Showcase:**
   - **Hero Banner & Badge:** Tên dự án "STELLAR ODYSSEY", huy hiệu React 19, Vite 7, Three.js, GSAP, Tailwind v4, Vercel, Awwwards Candidate.
   - **Live Demo Link:** Nút xem trang trực tiếp nổi bật.
   - **The Concept & Story:** Giới thiệu ngắn gọn ý tưởng du hành vũ trụ huyền bí, chất điện ảnh premium cinematic, triết lý thiết kế tối giản Monochrome B&W thuần khiết.
   - **Key Features:**
     - Persistent 3D Canvas với Hố đen Schwarzschild ray-traced và trường sao 24k hạt.
     - Scroll-linked Camera lượn 5 nhịp weave theo chiều sâu hành trình.
     - Fullscreen Menu chiều sâu 3D kiểu Mont-fort.
     - Hệ thống tương tác Live Demos kiểu Anime.js.
     - Đa ngôn ngữ song ngữ Vi/En hoàn chỉnh, WCAG 2.1 AA, PWA.
   - **Tech Stack & Architecture:** Bảng tóm tắt công nghệ và sơ đồ kiến trúc luồng dữ liệu 5 tầng.
   - **Performance Benchmark:** Bảng số liệu FPS thực tế (>160 FPS trên máy dev, >60 FPS mobile), điểm số Lighthouse 90+.
   - **Local Development Guide:** Các lệnh `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
   - **Credits & License:** Ghi nhận bản quyền thiết kế của Trần Vũ Anh Duy (Creative Designer).

✅ DEFINITION OF DONE:
- `README.md` được viết hoàn chỉnh bằng cả tiếng Anh (chuẩn quốc tế) hoặc song ngữ, trình bày đẹp mắt bằng Markdown cao cấp, có links hoạt động chuẩn xác.

🔍 KIỂM CHỨNG (VERIFICATION):
Xem lại file `README.md` sau khi hoàn thành, kiểm tra preview markdown.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 5.5, ✅ Xong, hoàn thành README).
```

---

## 🎯 TASK 5.6 — Awwwards / CSSDA Submission Package
*(Agent: Claude · P2 · ~1h · Wave 4)*

```markdown
Bạn là một Award Submission Strategist từng tư vấn nộp hồ sơ đoạt nhiều giải Site of the Day (SOTD), Developer Award và Studio of the Year trên Awwwards, FWA và CSS Design Awards. Nhiệm vụ của bạn là chuẩn bị gói tài liệu đăng ký dự thi (Submission Package) cho "Stellar Odyssey" — task 5.6 trong kế hoạch.

🎯 MỤC TIÊU:
Soạn thảo bộ nội dung dự thi hoàn hảo bằng tiếng Anh chuẩn mực: tiêu đề, đoạn pitch giới thiệu ngắn gọn đầy ấn tượng, câu chuyện sáng tạo (Design Narrative), giải thích đột phá kỹ thuật (Tech Highlights), danh sách credits, và hướng dẫn quay video demo / chụp ảnh màn hình dự thi.

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. kế-hoạch.md — mục 1, 2, 3 và mục 11 (Awwwards checklist).
2. Production URL thực tế của dự án.
3. Các tiêu chí chấm điểm của Awwwards: Design (40%), Usability (30%), Creativity (20%), Content (10%), Developer Site of the Day.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- clean-code
- brand-guidelines

🔌 PLUGIN CÓ THỂ DÙNG: Documents (nếu muốn lưu bản markdown / docx).

📐 YÊU CẦU CỤ THỂ — SOẠN BỘ TÀI LIỆU DỰ THI GỒM:
1. **Thông tin đăng ký cơ bản:**
   - Site Title: `Stellar Odyssey — Portfolio of Tran Vu Anh Duy`
   - Tagline: `A Cinematic Black-and-White Cosmic Journey for a Creative Designer`
   - URL: Production URL
   - Categories: `Portfolios`, `Animation`, `WebGL / 3D`, `Interaction Design`
   - Tags: `React 19`, `Three.js`, `GSAP`, `Monochrome`, `Cinematic`, `Minimalism`, `PWA`
2. **Project Pitch & Design Story (Khoảng 200–300 từ tiếng Anh):**
   - Làm nổi bật sự kết hợp giữa kỹ thuật kể chuyện điện ảnh 3D (Noomo Agency DNA), tính tương tác trực tiếp (Anime.js DNA) và chiều sâu tối giản sang trọng (Mont-fort DNA).
   - Nhấn mạnh quyết định táo bạo: Từ bỏ bảng màu neon sặc sỡ để theo đuổi thẩm mỹ **Monochrome B&W thuần khiết**, biến Hố đen vũ trụ thành biểu tượng nghệ thuật trung tâm.
3. **Developer Highlights (Dành cho Developer Award):**
   - R3F Persistent Canvas với Geodesic Ray-Tracing thời gian thực đạt tốc độ khung hình ấn tượng 160 FPS.
   - Sự kết hợp chuẩn mực giữa GSAP ScrollSmoother và React 19 concurrent features.
   - Tuân thủ khả năng tiếp cận WCAG 2.1 AA và hỗ trợ toàn diện `prefers-reduced-motion`.
4. **Hướng dẫn Media Assets:**
   - Kịch bản quay video demo màn hình 60s (Screencast preview) từ Hero → lướt qua các chòm sao tác phẩm → tiếp cận Hố đen tại Contact.
   - Danh sách 5 ảnh chụp màn hình đẹp nhất (Hero, Works, Orbital Skills, Depth Menu, Black Hole Contact).

✅ DEFINITION OF DONE:
- Tài liệu nộp bài hoàn chỉnh, chuyên nghiệp, lưu tại `outputs/awwwards-submission-package.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 5.6, ✅ Xong, gói tài liệu dự thi).
```

---

## 🎯 TASK 5.7 — Social Announcement Strategy (LinkedIn, X, Behance)
*(Agent: Claude · P2 · ~30m · Wave 4)*

```markdown
Bạn là một Creative Personal Branding & Social Content Strategist chuyên ngành Thiết kế & Công nghệ. Nhiệm vụ của bạn là soạn thảo bộ nội dung ra mắt (Launch Posts) trên các nền tảng mạng xã hội chính cho Trần Vũ Anh Duy — task 5.7 trong kế hoạch.

🎯 MỤC TIÊU:
Soạn thảo 3 bài đăng mạng xã hội chuyên nghiệp, thu hút lượt tương tác cao và mở ra cơ hội hợp tác quốc tế trên:
1. **LinkedIn** (Bài viết dài dạng Case Study / Thought Leadership hướng tới HR, Design Leaders, Founders)
2. **X / Twitter** (Thread ngắn gọn, thị giác mạnh mẽ kèm hashtag công nghệ dành cho cộng đồng Creative Dev)
3. **Behance / Facebook** (Bài chia sẻ cá nhân tự tin, truyền cảm hứng)

📖 ĐỌC TRƯỚC KHI BẮT ĐẦU:
1. CLAUDE.md — giọng điệu tác giả: tự tin, bí ẩn, chuyên nghiệp, truyền cảm hứng.
2. `outputs/content-vi.md` và `outputs/content-en.md`.
3. Production URL và kết quả benchmark của website.

🧰 SKILLS CẦN NẠP VÀ ÁP DỤNG:
- post-formatter (công thức AIDA / PAS cho LinkedIn)
- post-writer
- platform-content-strategy

🔌 PLUGIN CÓ THỂ DÙNG: Không bắt buộc.

📐 YÊU CẦU CỤ THỂ:
1. **LinkedIn Post (Song ngữ hoặc Tiếng Anh chuyên nghiệp):**
   - Hook mạnh mẽ: Hành trình tái định vị bản thân từ Multimedia Designer sang Creative Designer thông qua dự án Portfolio "Stellar Odyssey".
   - Câu chuyện kỹ thuật & nghệ thuật: Thử thách đưa WebGL 3D hố đen đạt 160 FPS kết hợp triết lý tối giản đơn sắc.
   - Lời kêu gọi hành động (Call to Action): Trải nghiệm live website và sẵn sàng cho các cơ hội nghề nghiệp / dự án mới.
2. **X / Twitter Thread:**
   - Tweet 1: Video teaser + link live demo + tuyên bố ra mắt.
   - Tweet 2: Tech stack (React 19 + Three.js + GSAP Club + Tailwind 4).
   - Tweet 3: Thử thách thiết kế Monochrome B&W và bài học tối ưu hiệu năng.
3. **Behance Project Description / Facebook Post:**
   - Lời cảm ơn và chia sẻ ngắn gọn, ấm áp gửi tới cộng đồng.

✅ DEFINITION OF DONE:
- Bộ bài đăng hoàn chỉnh, định dạng chuẩn từng nền tảng, sẵn sàng để copy-paste đăng ngay, lưu tại `outputs/social-announcement.md`.

📝 SAU KHI XONG:
Cập nhật `AGENTS.md` mục "## Tiến độ" (Task 5.7, ✅ Xong, nội dung truyền thông).
```

---

## 📌 HƯỚNG DẪN ĐIỀU PHỐI VÀ CHẠY THỰC TẾ

Sau khi Phase 3 hoàn thành nghiệm thu (Task 3.13), bạn có thể chạy Phase 4 và Phase 5 theo 5 đợt (Waves) cực kỳ an toàn sau đây để tránh xung đột file:

| Đợt | Các Tasks thực hiện | Lưu ý điều phối |
| :--- | :--- | :--- |
| **Wave 1 (Nền tảng & Layout)** | `4.1` ‖ `4.2` ‖ `4.6` ‖ `4.7` ‖ `4.8` | Chạy song song được vì đụng các file độc lập (`index.html`, `quality.js`, `vite.config.js`). |
| **Wave 2 (Dọn tàn dư & A11y lõi)** | `4.14` → `4.3` ‖ `4.4` ‖ `4.5` ‖ `4.16` | **4.14 chạy trước** để dọn sạch Footer cũ và class text App. Sau đó chạy kiểm toán bàn phím, screen reader và copy. |
| **Wave 3 (Bundle & Polish Easing)** | `4.9` → `4.10` ‖ `4.13` ‖ `4.15` | Tách code và cấu hình `manualChunks` trong `vite.config.js`. Tinh chỉnh easing và test dark/light. |
| **Wave 4 (Audit & Nghiệm thu Phase 4)** | `4.11` → `4.12` | Chạy Lighthouse audit toàn diện và kiểm tra đa trình duyệt sau khi mã nguồn đã hoàn toàn đóng gói tối ưu. |
| **Wave 5 (Launch & Triển khai Phase 5)** | `5.1` → `5.2` → `5.3` ‖ `5.4` → `5.5` ‖ `5.6` ‖ `5.7` | Pre-flight build → Deploy Vercel → Smoke test live → Hoàn thiện README và hồ sơ Awwwards. |

*Mỗi khi hoàn thành một task, nhớ nhắc agent cập nhật một dòng mới vào `AGENTS.md` (mục "## Tiến độ") và tick cột Trạng thái trong file `ke-hoach-stellar-odyssey.xlsx`!*
