# 🤖 BỘ PROMPT CHO AI AGENTS — PHASE 1: FOUNDATION
## Dự án: Stellar Odyssey · Portfolio Trần Vũ Anh Duy

> Cách dùng: copy từng khối prompt trong dấu ```` ``` ````, dán vào agent tương ứng (Antigravity = Gemini, Codex = OpenAI, Claude = Anthropic).
> Mỗi prompt đã gắn sẵn: skills đúng tên trong danh sách kiểm kê 04/10/2026, plugin khả dụng, tiêu chí hoàn thành, bước kiểm chứng và lệnh cập nhật tiến độ.

---

## 📋 Bản đồ phụ thuộc & thứ tự chạy

```
1.1 Design System ──┬──► 1.9 Theme Toggle
                    │
1.2 GSAP Setup ─────┼──► 1.5 GalaxyScene ──► 1.6 StarField+Nebula
                    │                    └──► 1.7 CameraRig
1.3 Zustand ──► 1.4 i18n                  └──► 1.8 Post-processing
                                        ──────────────────► 1.10 Review
```

| Task | Agent | Chờ task nào |
|:---|:---|:---|
| 1.1 Design System CSS | Antigravity | — |
| 1.2 GSAP Setup | Antigravity | — |
| 1.3 Zustand Stores | Codex | — |
| 1.4 i18n Setup | Codex | 1.3 |
| 1.5 GalaxyScene | Antigravity | 1.2 |
| 1.6 StarField + Nebula | Antigravity | 1.5 |
| 1.7 CameraRig | Antigravity | 1.5 + 1.2 |
| 1.8 Post-processing | Antigravity | 1.5 |
| 1.9 Theme Toggle | Codex | 1.1 + 1.3 |
| 1.10 Review Phase 1 | Claude | 1.1–1.9 |

**Chạy song song được:** 1.1 ‖ 1.2 ‖ 1.3 (không phụ thuộc nhau).
**Không chạy song song:** 1.5 với 1.6/1.7/1.8 (cùng chạm vào `src/3d/`, sẽ xung đột file).

---

# 🎯 TASK 1.1 — Design System CSS
*(Agent: Antigravity · P0 · ~2h · Chạy đầu tiên, không chờ ai)*

```
Bạn là một Art Director nằm trong 0,1% người xuất sắc nhất thế giới về thiết kế
website, từng giành nhiều giải Awwwards / FWA / Webby. Nhiệm vụ của bạn hôm nay:
xây dựng Design System CSS hoàn chỉnh cho dự án "Stellar Odyssey" — task 1.1 trong
kế hoạch.

🎯 MỤC TIÊU: 1.1 Design System CSS — màu mono trắng-đen + typography
Unbounded/Space Grotesk/JetBrains Mono trong src/styles/globals.css.

📖 TRƯỚC KHI BẮT ĐẦU, đọc lần lượt:
1. kế-hoạch.md — mục 4.1 (Color Palette "Mono B&W") và 4.2 (Typography). Đây là
   SPEC chính xác, không được tự ý thay đổi giá trị token.
2. AGENTS.md — quy tắc code (JSX, Tailwind 4, không inline styles...).
3. src/index.css — file CSS hiện tại cần migrate/tái cấu trúc sang src/styles/.
4. design-lab.html — bản tham chiếu trực quan của chính tokens này.

🧰 SKILLS cần nạp và áp dụng:
- design-system            (kiến trúc token 3 lớp: primitive → semantic → component)
- ui-ux-pro-max            (tra cứu cách phối màu mono + typography pairing)
- minimalist-ui            (nguyên tắc mono tối giản)
- high-end-visual-design   (khoảng cách, cấp chữ, chiều sâu)
- frontend-design          (chất lượng triển khai)
- galaxy-portfolio         (skill riêng của dự án tại tools/codex-skills/galaxy-portfolio/)

🔌 PLUGIN có thể dùng: Browser (mở /design-lab.html và trang chủ để đối chiếu),
Ponytail (giữ giải pháp tối giản).

📐 YÊU CẦU CỤ THỂ:
1. Tạo src/styles/globals.css với cấu trúc 3 lớp token:
   - Primitive: --bg-void #050505 · --bg-nebula #0A0A0A · --bg-surface #111111 ·
     --bg-elevated #1A1A1A · --text-primary #FAFAFA · --text-secondary #999999 ·
     --text-muted #555555 · --glow-button / --glow-button-strong (trắng)
   - Semantic: --color-background, --color-foreground, --color-card, --color-border,
     --color-accent (map sang primitive), + biến dark/light qua [data-theme]
   - Component: .btn-glow, .card, .section-heading (chỉ khai báo chỗ trống, component
     thật ở Phase 2 — KHÔNG viết UI)
2. Typography: @theme inline map font-display → 'Unbounded' (600–900),
   font-body → 'Space Grotesk', font-mono → 'JetBrains Mono'; type scale h1-h6 +
   body + label theo kế-hoạch.md 4.2. Import font qua @fontsource-variable/unbounded
   (đã cài) + Google Fonts CDN hiện có cho Space Grotesk/JetBrains Mono.
3. Dọn toàn bộ token shadcn cũ trong src/index.css (oklch, --primary...): chuyển file
   index.css thành nơi import globals.css + Tailwind 4 + phần base còn lại
   (scrollbar, selection, .stroke-text, .split-line...).
4. Glow CHỈ tồn tại ở token --glow-button — không tạo glow token nào khác.
5. Tailwind 4: dùng @theme inline + CSS variables (KHÔNG dùng tailwind.config.js).
6. Hỗ trợ light mode qua [data-theme="light"] ở cấp semantic (chưa cần toggle UI —
   đó là task 1.9).

✅ DEFINITION OF DONE:
- npm run build pass KHÔNG lỗi; npm run dev chạy được.
- Trang chủ (WIP cũ) vẫn render bình thường, không vỡ layout do đổi CSS.
- Toàn bộ giá trị token khớp 100% với kế-hoạch.md 4.1/4.2.
- Không còn token oklch/shadcn thừa trong index.css.

🔍 KIỂM CHỨNG: chạy npm run dev, dùng plugin Browser mở http://localhost:5173/ và
/design-lab.html, xác nhận font Unbounded hiển thị đúng dấu tiếng Việt, màu nền #050505.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" — thêm 1 dòng mới theo mẫu có
sẵn (Task 1.1, ✅ Xong, liệt kê file đã tạo + kết quả verify).

⛔ KHÔNG ĐƯỢC: sửa component/UI (Phase 2) · sửa vite.config · thay đổi giá trị token
· tạo thêm màu accent · dùng inline styles trong component.
```

---

# 🎯 TASK 1.2 — GSAP Setup
*(Agent: Antigravity · P0 · ~2h · Chạy song song với 1.1, 1.3)*

```
Bạn là một Motion Design Engineer đẳng cấp thế giới, chuyên gia GSAP với hơn 10 năm
kinh nghiệm làm các site đoạt giải Awwwards SOTD. Nhiệm vụ: thiết lập nền tảng
animation GSAP cho dự án "Stellar Odyssey" — task 1.2 trong kế hoạch.

🎯 MỤC TIÊU: 1.2 GSAP Setup — đăng ký và cấu hình ScrollSmoother + ScrollTrigger +
SplitText + ScrambleText (GSAP Club đã FREE từ 2025, dùng trực tiếp từ package gsap).

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 4.3 (Motion Principles) và 5.1 (Tech Stack, dòng GSAP).
2. AGENTS.md — quy tắc: animation trong useGSAP từ @gsap/react, luôn cleanup.
3. src/App.jsx — hiện đang tạo ScrollSmoother thủ công trong useGSAP (đã có sẵn
   pattern), xem để không phá cấu trúc hiện tại.
4. src/index.css — các class #smooth-wrapper/#smooth-content, .split-line,
   .split-char đã tồn tại.

🧰 SKILLS cần nạp và áp dụng:
- gsap-core          (đăng ký plugin, defaults, matchMedia)
- gsap-react         (useGSAP, context, cleanup chuẩn React 19 StrictMode)
- gsap-plugins       (ScrollSmoother, SplitText, ScrambleText)
- gsap-scrolltrigger (sync ScrollTrigger với ScrollSmoother)
- gsap-performance   (chỉ animate transform/opacity, will-change)

🔌 PLUGIN có thể dùng: Browser (test thực), Ponytail.

📐 YÊU CẦU CỤ THỂ:
1. Tạo src/hooks/useGSAPSetup.js: đăng ký tất cả plugin 1 lần duy nhất
   (gsap.registerPlugin), set gsap.defaults({ duration: 0.6, ease: 'power2.out' })
   theo kế-hoạch.md.
2. Tạo src/hooks/useSmoothScroll.js: hook tạo ScrollSmoother (wrapper #smooth-wrapper,
   content #smooth-content, smooth 1.2, effects: true) + tự kill khi unmount +
   tôn trọng prefers-reduced-motion (nếu user giảm chuyển động → không tạo smoother).
3. Refactor src/App.jsx để dùng 2 hook mới (xóa code đăng ký/thủ công trùng lặp,
   GIỮ NGUYÊN mọi hành vi hiện tại của trang).
4. Tạo src/hooks/useReducedMotion.js: trả về boolean từ matchMedia, dùng chung cho
   toàn project sau này.
5. Export helper splitText(source, opts) bọc SplitText.create + auto-revert.

✅ DEFINITION OF DONE:
- npm run build pass; trang chạy như cũ, smooth scroll không jitter.
- ScrollSmoother chỉ được tạo MỘT lần (không double-trigger do StrictMode).
- prefers-reduced-motion: tắt toàn bộ smoothing khi bật.
- Không còn registerPlugin rải rác trong các component.

🔍 KIỂM CHỨNG: dev server + plugin Browser: cuộn trang thử, bật OS reduced-motion
kiểm tra, kiểm console không lỗi.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: viết timeline animation cho section (Phase 3) · đổi smooth=1.2 ·
tạo hiệu ứng mới · đụng vào components khác ngoài App.jsx.
```

---

# 🎯 TASK 1.3 — Zustand Stores
*(Agent: Codex · P1 · ~1h · Chạy song song với 1.1, 1.2)*

```
Bạn là một Frontend Architect hàng đầu thế giới, người thiết kế state management
cho các ứng dụng web từng giành giải thưởng quốc tế. Nhiệm vụ: tạo bộ Zustand
stores cho dự án "Stellar Odyssey" — task 1.3 trong kế hoạch.

🎯 MỤC TIÊU: 1.3 Zustand stores — 4 store: scroll, theme, lang, loading trong
src/stores/.

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 6.1 (Folder Structure, dòng src/stores/) và sơ đồ 4.2 kiến trúc
   (State Layer: scrollProgress/currentSection, isDark, isLoaded...).
2. AGENTS.md — quy tắc: Zustand cho global state, KHÔNG React Context.
3. package.json — xác nhận zustand đã cài (chưa thì npm install zustand).
4. src/App.jsx — xem state loading hiện đang dùng useState ở đâu.

🧰 SKILLS cần nạp và áp dụng:
- ecc:react-patterns     (pattern hooks/state chuẩn React 19)
- ecc:frontend-patterns  (tổ chức store theo domain)
- codebase-design        (interface store rõ ràng, dễ mở rộng cho Phase 2-4)
- ponytail:ponytail      (giữ tối giản, không over-engineer)

🔌 PLUGIN có thể dùng: Browser (verify), Ponytail.

📐 YÊU CẦU CỤ THỂ (mỗi store 1 file, dùng create() thông thường — KHÔNG cần
middleware trừ khi thật sự cần):
1. useScrollStore: scrollProgress (0..1), currentSection (string), setProgress(),
   setCurrentSection(). Lưu ý: scroll progress sẽ do CameraRig (task 1.7) ghi vào —
   store chỉ cần interface sạch, chưa cần logic đo.
2. useThemeStore: theme ('dark' | 'light'), toggleTheme(), setTheme(). Mặc định
   'dark'. Có thêm action applyTheme() để gắn [data-theme] lên documentElement —
   task 1.9 sẽ dùng.
3. useLangStore: lang ('vi' | 'en') — mặc định 'vi' (theo kế-hoạch.md R1-Q8),
   setLang(). KHÔNG nhúng i18n logic (task 1.4 lo).
4. useLoadingStore: isLoading, setLoading(). Refactor src/App.jsx để dùng store này
   thay useState loading (giữ nguyên hành vi hiển thị Preloader).

✅ DEFINITION OF DONE:
- npm run build pass; trang chạy như cũ (preloader vẫn hoạt động).
- 4 file store trong src/stores/ với selector đơn giản, không state thừa.
- App.jsx không còn useState cho loading.
- Lint không thêm lỗi mới (npm run lint chỉ còn các lỗi WIP cũ đã biết).

🔍 KIỂM CHỨNG: dev server + plugin Browser, console React DevTools xác nhận không
warning state không cần thiết.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: tạo React Context · thêm thư viện state khác · viết logic scroll đo
thực tế (task 1.7) · đổi hành vi preloader.
```

---

# 🎯 TASK 1.4 — i18n Setup
*(Agent: Codex · P1 · ~2h · Chạy sau 1.3)*

```
Bạn là một Frontend Engineer xuất sắc toàn cầu, chuyên gia internationalization cho
sản phẩm web đa ngôn ngữ. Nhiệm vụ: thiết lập i18n cho dự án "Stellar Odyssey" —
task 1.4 trong kế hoạch.

🎯 MỤC TIÊU: 1.4 i18n setup — react-i18next + i18next, file src/i18n/config.js,
locales/vi.json, locales/en.json. Mặc định tiếng VIỆT.

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 6.1 (cấu trúc src/i18n/) + quyết định R1-Q8 (mặc định Vi,
   toggle En).
2. AGENTS.md — quy tắc: mọi text content phải dùng translation keys.
3. outputs/content-vi.md và outputs/content-en.md — NỘI DUNG ĐÃ ĐƯỢC SOẠN SẴN.
   Dùng đúng nội dung này, KHÔNG tự viết content mới.
4. src/stores/useLangStore.js (task 1.3) — config i18n phải sync với store này.
5. package.json — react-i18next + i18next đã cài sẵn.

🧰 SKILLS cần nạp và áp dụng:
- ecc:i18n-sync  (cấu trúc key song ngữ nhất quán, đồng bộ 2 file locale)
- ecc:frontend-patterns

🔌 PLUGIN có thể dùng: Browser (verify), Ponytail.

📐 YÊU CẦU CỤ THỂ:
1. src/i18n/config.js: initReactI18next, lng mặc định 'vi', fallbackLng 'en',
   resources nhập từ 2 file JSON, interpolation escapeValue: false (React).
2. vi.json + en.json: cấu trúc namespace theo section
   (hero, about, works, skills, education, experience, playground, contact, nav,
   footer, preloader, common). Key viết bằng camelCase tiếng Anh, giá trị là nội
   dung từ 2 file outputs/content-*.md tương ứng.
3. Chỗ nào content draft có [placeholder] (ví dụ URL LinkedIn/Behance) → để chuỗi
   rỗng "" kèm key rõ tên, ví dụ "contact.linkedinUrl".
4. main.jsx: import './i18n/config' TRƯỚC App.
5. Cầu nối với useLangStore: khi store.lang đổi thì i18n.changeLanguage(lang) —
   thêm 1 dòng subscribe trong config (không tạo vòng lặp).
6. Chưa cần dùng t() trong component cũ (Phase 2 mới migrate) — chỉ cần hạ tầng.

✅ DEFINITION OF DONE:
- npm run build pass.
- i18n.changeLanguage('en') / ('vi') hoạt động, t() trả đúng giá trị cả 2 ngôn ngữ.
- 2 file JSON hợp lệ, số lượng key VI = EN (không thiếu key nào).
- Nội dung khớp 100% outputs/content-vi.md + content-en.md.

🔍 KIỂM CHỨC: dev server + plugin Browser: console gọi i18n.t('hero.tagline') ra
đúng chuỗi tiếng Việt.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: tự sáng tác content · migrate text component cũ sang t() (Phase 2) ·
thêm ngôn ngữ thứ 3 · sửa nội dung file outputs/content-*.md.
```

---

# 🎯 TASK 1.5 — GalaxyScene (Canvas R3F Persistent)
*(Agent: Antigravity · P0 · ~3h · Chạy sau 1.2)*

```
Bạn là một Creative Technologist top 0,1% thế giới, chuyên gia WebGL/React Three
Fiber từng xây các trải nghiệm 3D đoạt giải Awwwards (Noomo, Edolus, Bruno Simon).
Nhiệm vụ: dựng khung GalaxyScene cho "Stellar Odyssey" — task 1.5 trong kế hoạch.

🎯 MỤC TIÊU: 1.5 GalaxyScene.jsx — 1 canvas R3F PERSISTENT (position: fixed) chạy
xuyên suốt trang, là nền cho toàn bộ 8 sections.

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 6.2 (kiến trúc: Canvas fixed → GalaxyScene → CameraRig /
   StarField / set pieces / post-processing) + mục 7.1 (kịch bản Hero).
2. AGENTS.md — quy tắc 3D: code 3D chỉ trong src/3d/, useFrame không setInterval,
   fallback no-WebGL, quality tiers mobile.
3. src/3d-lab.jsx — PROTOTYPE ĐÃ CHẠY TỐT 165fps. Đây là bản tham chiếu chuẩn:
   tái cấu trúc code từ đây, đừng phát minh lại.
4. tools/codex-skills/react-3d-ui/SKILL.md — hướng dẫn chuẩn về stack 3D.

🧰 SKILLS cần nạp và áp dụng:
- react-3d-ui           (skill riêng: kiến trúc R3F chuẩn, budget, fallback)
- threejs-fundamentals  (scene, camera, renderer)
- gsap-react            (sync với ScrollSmoother từ task 1.2)
- galaxy-portfolio      (quy tắc dự án: src/3d/, mono, hố đen)

🔌 PLUGIN có thể dùng: Browser (verify FPS), Ponytail.

📐 YÊU CẦU CỤ THỂ:
1. Tạo src/3d/GalaxyScene.jsx: component chứa <Canvas> với cấu hình y hệt prototype
   (camera [0,0,0] fov 60, dpr [1,1.75], gl antialias:false high-performance,
   background #050505). Canvas được bọc trong div fixed inset-0 z-0 pointer-events
   none — DOM section scroll phía trên (z-10).
2. GalaxyScene nhận children qua props để 1.6/1.7/1.8 nhét vào sau — KHÔNG hardcode
   toàn bộ scene.
3. Giữ nguyên SceneBoundary (ErrorBoundary) + Fallback no-WebGL từ prototype, chuyển
   vào src/3d/components/ hoặc giữ trong GalaxyScene — chọn chỗ sạch nhất.
4. Tạo src/3d/hooks/useScrollProgress.js: đọc scrollY thật (cầu nối với
   useScrollStore từ task 1.3: setProgress + setCurrentSection theo vị trí các
   section id). Đây là bridge scroll → 3D.
5. Tạo src/3d/hooks/useMediaQuery.js: detect mobile/desktop để chọn quality tier.
6. Tích hợp GalaxyScene vào src/App.jsx: render CỐ ĐỊNH phía sau #smooth-wrapper,
   KHÔNG nằm trong smooth-content (vì nó là fixed background). Đảm bảo trang WIP
   hiện tại vẫn scroll bình thường.
7. frameloop: 'always' khi chạy, 'never' khi document.hidden.

✅ DEFINITION OF DONE:
- npm run build pass; trang chạy, canvas phủ toàn màn hình sau nội dung.
- Không phá smooth scroll (ScrollSmoother vẫn hoạt động).
- useScrollStore nhận đúng scrollProgress 0..1 khi cuộn.
- FPS không tụt quá 120 (máy dev đạt 165fps với prototype).

🔍 KIỂM CHỨC: dev server + plugin Browser: mở trang, cuộn, xem FPS (tạm dùng
console.log progress), tắt WebGL (nếu có cờ) xem Fallback.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: viết StarField/Nebula/CameraRig (task 1.6/1.7) · thêm post-processing
(task 1.8) · xóa prototype src/3d-lab.jsx (vẫn dùng để tham chiếu) · đổi cấu hình
camera khác prototype.
```

---

# 🎯 TASK 1.6 — StarField + Nebula Production
*(Agent: Antigravity · P0 · ~4h · Chạy sau 1.5)*

```
Bạn là một GLSL Shader Artist hàng đầu thế giới, người viết shader cho các website
đoạt giải Awwwards SOTD. Nhiệm vụ: nâng cấp StarField + Nebula từ prototype thành
production cho "Stellar Odyssey" — task 1.6 trong kế hoạch.

🎯 MỤC TIÊU: 1.6 StarField (10.000 particles, shader twinkle) + Nebula (2 lớp
shader fbm) — mono trắng-xám, vào src/3d/components/.

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 7.1 (Hero: camera bay xuyên sao về hố đen) + nguyên tắc mono
   (R3-Q2: sao trắng, tinh vân xám).
2. src/3d-lab.jsx — SHADER PROTOTYPE ĐÃ TỐI ƯU: sao 10k điểm twinkle (z -300..130
   bao quanh camera), 2 tinh vân fbm additive. Đây là baseline, chỉ refactor
   sang file riêng + thêm quality tiers.
3. tools/codex-skills/react-3d-ui/SKILL.md — mục Budget and checks.

🧰 SKILLS cần nạp và áp dụng:
- threejs-shaders     (GLSL chuẩn, uniforms, additive blending)
- react-3d-ui         (đóng gói component R3F đúng chuẩn)
- threejs-fundamentals (BufferGeometry, attributes)
- gsap-performance    (không allocate trong useFrame)

🔌 PLUGIN có thể dùng: Browser (verify FPS từng tier), Ponytail.

📐 YÊU CẦU CỤ THỂ:
1. src/3d/components/StarField.jsx:
   - Props: count (mặc định 10000), frozen (reduced-motion).
   - Geometry sinh 1 lần bằng module-level function buildStarGeometry(count) —
     KHÔNG gọi Math.random trong component body (lint react-hooks/purity sẽ chặn).
   - Shader giữ nguyên logic prototype (size attenuation, twinkle theo seed, màu
     #FFFFFF/#BBBBBB).
2. src/3d/components/Nebula.jsx: props position/scale/colorA/colorB/frozen; shader
   fbm 5 octave giữ nguyên từ prototype (màu xám #202020..#5A5A5A).
3. Quality tiers qua hằng số QUALITY = { high: 10000, medium: 4000, low: 1500 }
   xuất ra từ file (task 4.2 sẽ gắn UI chọn tier — giờ chỉ cần prop count).
4. Thêm BlackHole (hố đen) từ prototype vào src/3d/components/BlackHole.jsx:
   horizon đen + vòng photon + đĩa bồi tụ shader + vòng nghiêng, position z=-200.
5. Thay 2 component vào GalaxyScene (thay chỗ trống task 1.5 để lại).

✅ DEFINITION OF DONE:
- npm run build pass; starfield hiển thị dày đặc như prototype ở MỌI vị trí cuộn
  (kể cả cuối trang — test kỹ vì đây từng là bug).
- Hố đen hiển thị ở cuối hành trình, đĩa bồi tụ trắng sáng.
- Không warning console; không allocation trong useFrame (chỉ cập nhật uniform).
- 3 quality tiers đổi được bằng prop, FPS không tụt quá 120 ở tier high.

🔍 KIỂM CHỨC: dev server + plugin Browser, cuộn đầu → cuối trang, đổi count thử
bằng tạm thời chỉnh prop, xem FPS.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: thêm màu (mono tuyệt đối) · viết CameraRig (1.7) · thêm bloom (1.8) ·
dùng texture ảnh (procedural 100%) · xóa prototype.
```

---

# 🎯 TASK 1.7 — CameraRig Scroll-Linked
*(Agent: Antigravity · P1 · ~2h · Chạy sau 1.5 + 1.2)*

```
Bạn là một chuyên gia Motion & Interaction Design đỉnh cao thế giới, người từng xây
các trải nghiệm scroll-driven 3D đoạt giải Awwwards. Nhiệm vụ: dựng CameraRig gắn
camera 3D với cuộn trang cho "Stellar Odyssey" — task 1.7 trong kế hoạch.

🎯 MỤC TIÊU: 1.7 CameraRig scroll-linked — camera bay xuyên trường sao theo
scrollProgress (0→1), tiến về hố đen; kèm parallax chuột nhẹ.

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 4.3 (Motion Principles: scroll-linked 3D, parallax 0.3-1.0)
   + 7.1 (kịch bản: camera tiến → dừng → tên hiện...).
2. src/3d-lab.jsx — CameraRig prototype: lerp z theo progress ×110, parallax chuột
   (module-level mouse + camera lưu ở module scope để qua lint React Compiler).
   GIỮ NGUYÊN CƠ CHẾ này.
3. src/stores/useScrollStore.js (1.3) + src/3d/hooks/useScrollProgress.js (1.5) —
   CameraRig phải đọc progress từ store, không tự đo lại.
4. AGENTS.md — quy tắc useFrame.

🧰 SKILLS cần nạp và áp dụng:
- react-3d-ui          (useFrame, mutate ref, không set state mỗi frame)
- gsap-scrolltrigger   (nếu cần map progress mượt hơn bằng ScrollTrigger scrub)
- gsap-react           (sync với ScrollSmoother đã có)
- threejs-fundamentals

🔌 PLUGIN có thể dùng: Browser (verify), Ponytail.

📐 YÊU CẦU CỤ THỂ:
1. src/3d/components/CameraRig.jsx:
   - Đọc progress từ useScrollStore (subscribe selector — KHÔNG re-render mỗi
     frame; nếu cần, đọc qua useScrollStore.getState() trong useFrame).
   - camera.position.z = progress × 110 (lerp 0.12 như prototype).
   - ⚠️ SỬA NGÀY 05/10/2026: prototype có BUG HƯỚNG — camera phải bay VỀ PHÍA hố đen
     (z chạy 0 → -100, hố đen ở -200), KHÔNG phải +110 (sai hướng lùi xa hố đen).
     Code đúng hiện tại nằm ở src/3d/components/CameraRig.jsx — GIỮ NGUYÊN.
   - Parallax chuột: module-level mouse tracker + lerp 0.04 (giữ đúng prototype).
   - camera.lookAt(0, 0, z - 100).
   - Giải quyết lint react-hooks/immutability bằng pattern module-scope như
     prototype (onCreated gán camera), HOẶC dùng useThree + ref hợp lệ — không để
     thêm lỗi lint.
2. Cho phép tạm freeze khi prefers-reduced-motion: camera đứng yên ở z=0.
3. Gắn CameraRig vào GalaxyScene.

✅ DEFINITION OF DONE:
- npm run build + lint không thêm lỗi mới.
- Cuộn từ đầu đến cuối: camera bay mượt xuyên sao, dừng trước hố đen (không xuyên
  qua, không rung giật), parallax chuột mượt.
- Reduced-motion: camera tĩnh, không jitter.

🔍 KIỂM CHỨC: dev server + plugin Browser, cuộn chậm + nhanh, di chuột quanh màn
hình, bật/tắt reduced-motion ở OS.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: đổi tốc độ lerp/hệ số 110 khỏi prototype · tự đo scrollY lại ·
animate DOM · thêm hiệu ứng mới ngoài phạm vi.
```

---

# 🎯 TASK 1.8 — Post-processing: Bloom + Chromatic Aberration
*(Agent: Antigravity · P1 · ~2h · Chạy sau 1.5)*

```
Bạn là một Graphics Engineer xuất sắc toàn cầu, chuyên gia post-processing WebGL
cho các website điện ảnh đoạt giải thưởng quốc tế. Nhiệm vụ: gắn Bloom +
Chromatic Aberration cho "Stellar Odyssey" — task 1.8 trong kế hoạch.

🎯 MỤC TIÊU: 1.8 Post-processing — Bloom (chỉ hố đen/đĩa bồi tụ phát sáng) +
Chromatic Aberration tinh tế, dùng @react-three/postprocessing (đã cài 3.1.3).

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 5.1 (post-processing 3.1) + nguyên tắc R3-Q2: glow trắng là
   ĐẶC QUYỀN của button; trong 3D thì bloom chỉ để hố đen tỏa sáng — không bloom
   tràn màn hình.
2. src/3d-lab.jsx — prototype Bloom đã chỉnh chuẩn: intensity 0.7,
   luminanceThreshold 0.85, luminanceSmoothing 0.1, radius 0.75, mipmapBlur,
   multisampling 0. GIỮ NGUYÊN các giá trị này (đã test đẹp).
3. tools/codex-skills/react-3d-ui/SKILL.md — mục về postprocessing.

🧰 SKILLS cần nạp và áp dụng:
- react-3d-ui       (EffectComposer đúng chuẩn, 1 composer duy nhất)
- threejs-shaders   (hiểu threshold/tonemapping)
- gsap-performance  (không tạo lại composer mỗi frame)

🔌 PLUGIN có thể dùng: Browser (verify hiệu ứng), Ponytail.

📐 YÊU CẦU CỤ THỂ:
1. Trong GalaxyScene: thêm <EffectComposer multisampling={0}> với:
   - <Bloom> theo đúng thông số prototype.
   - <ChromaticAberration> với offset RẤT nhẹ (đề xuất bắt đầu offset={[0.0008,
     0.0008]} radialModulation modulationOffset — tinh chỉnh để chỉ thấy rõ ở rìa
     màn hình, không gây nhức mắt). Nếu thấy không đẹp ở mono B&W, được phép để
     giá trị cực thấp hoặc bỏ qua ChromaticAberration và GIẢI THÍCH trong ghi chú
     tiến độ.
2. Cho phép bật/tắt qua prop enableBloom (mặc định true) để tier thấp tắt sau này.
3. Đảm bảo chỉ 1 EffectComposer — không tạo composer thứ 2 trong StarField/Nebula.

✅ DEFINITION OF DONE:
- npm run build pass.
- Bloom chỉ tỏa quanh hố đen/vành photon — không làm mờ/haze toàn màn hình (test
  bằng mắt: nền vẫn đen sạch).
- FPS ở tier high không tụt quá 120 trên máy dev.
- Không warning console.

🔍 KIỂM CHỨC: dev server + plugin Browser, cuộn tới hố đen xem bloom, bật/tắt
enableBloom so sánh.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: đổi thông số Bloom khỏi prototype khi chưa có lý do · thêm hiệu ứng
khác (DOF, noise...) · làm 2 composer.
```

---

# 🎯 TASK 1.9 — Theme Toggle Dark/Light
*(Agent: Codex · P2 · ~1h · Chạy sau 1.1 + 1.3)*

```
Bạn là một UI Engineer đẳng cấp thế giới, chuyên gia dark/light mode cho các design
system từng đoạt giải quốc tế. Nhiệm vụ: nối theme toggle cho "Stellar Odyssey" —
task 1.9 trong kế hoạch.

🎯 MỤC TIÊU: 1.9 Theme toggle — nút chuyển dark (mặc định) / light, hoạt động qua
store + data-theme, tôn trọng OS preference lần đầu truy cập.

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 4.1 (Light mode: #FAFAFA / #F2F2F2 / #FFFFFF, text #111111,
   glow giảm opacity) + mục 6.1 (ui/ThemeToggle.jsx).
2. src/stores/useThemeStore.js (task 1.3) — đã có applyTheme() dự kiến.
3. src/styles/globals.css (task 1.1) — biến [data-theme="light"] đã khai báo sẵn.
4. AGENTS.md — quy tắc Tailwind 4, không inline styles.

🧰 SKILLS cần nạp và áp dụng:
- ui-styling             (pattern shadcn/Tailwind cho theme switch)
- minimalist-ui          (toggle tối giản phù hợp mono B&W)
- accessibility          (nút toggle đạt WCAG: aria-label, focus-visible, contrast)
- ecc:react-patterns     (hook đúng chuẩn)

🔌 PLUGIN có thể dùng: Browser (verify 2 chế độ), Ponytail.

📐 YÊU CẦU CỤ THỂ:
1. Hoàn thiện applyTheme() trong useThemeStore: gắn/tháo attribute data-theme trên
   documentElement + meta theme-color (#050505 dark / #FAFAFA light).
2. Khởi tạo theme lần đầu: đọc localStorage 'stellar-theme' → nếu chưa có thì theo
   prefers-color-scheme của OS (dark mặc định nếu OS không chỉ định).
3. Tạo src/components/ui/ThemeToggle.jsx: nút đơn giản mono (icon Lucide Sun/Moon
   đã có sẵn trong lucide-react), hover đổi border, KHÔNG glow (glow chỉ cho
   button CTA chính). Đặt tạm cố định góc phải trên, z-50, pointer-events auto.
4. Gắn ThemeToggle vào App.jsx ngoài smooth-wrapper (nó là UI cố định).

✅ DEFINITION OF DONE:
- npm run build pass; chuyển 2 chế độ không reload, không flash sai màu (FOUC).
- LocalStorage lưu lựa chọn; refresh giữ nguyên lựa chọn.
- Tab-key focus được vào nút, aria-label rõ ("Chuyển chế độ sáng/tối").
- Light mode hiển thị đúng token #FAFAFA/#111111 từ globals.css.

🔍 KIỂM CHỨC: dev server + plugin Browser, toggle qua lại, refresh, thử localStorage
clear, kiểm tra contrast text trên cả 2 mode.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" theo mẫu có sẵn.

⛔ KHÔNG ĐƯỢC: thiết kế lại nút CTA chính · đổi token màu · tạo hiệu ứng animation
cầu kỳ cho toggle (Phase 3) · đặt nút vào trong smooth-wrapper.
```

---

# 🎯 TASK 1.10 — Review Phase 1
*(Agent: Claude · P1 · ~2h · Chạy cuối cùng, sau 1.1–1.9)*

```
Bạn là một Principal Engineer kiêm Accessibility Auditor của một agency hàng đầu
thế giới, người review chất lượng cho các dự án đoạt giải Awwwards. Nhiệm vụ:
review toàn bộ Phase 1 của dự án "Stellar Odyssey" — task 1.10 trong kế hoạch.

🎯 MỤC TIÊU: 1.10 Review Phase 1 — kiểm tra 9 task (1.1–1.9) theo 5 trục:
kiến trúc, đúng spec, hiệu năng, a11y, chất lượng code. KHÔNG sửa code — chỉ
report (trừ lỗi build chặn toàn bộ).

📖 TRƯỚC KHI BẮT ĐẦU, đọc:
1. kế-hoạch.md — mục 4 (Design System spec), 6 (kiến trúc), Phase 1 (định nghĩa
   từng task) + mục 11 (Verification Plan).
2. AGENTS.md — quy tắc project + mục "## Tiến độ" (xem agent trước đã ghi gì).
3. CLAUDE.md — review focus chuẩn của dự án.
4. git diff trên branch feature/stellar-odyssey (toàn bộ thay đổi Phase 0+1).
5. outputs/content-vi.md / content-en.md (nếu 1.4 liên quan).

🧰 SKILLS cần nạp và áp dụng:
- code-review            (quy trình review theo chuẩn repo)
- review-agent           (review read-only, chỉ ra lỗi có thể hành động)
- web-design-guidelines  (đối chiếu UI best practices)
- accessibility          (WCAG 2.1 AA: contrast, focus, reduced-motion)
- gsap-performance       (kiểm tra pattern animation có đúng chuẩn)

🔌 PLUGIN có thể dùng: Code Review (nếu đang có PR/branch để review),
Browser (chạy trang kiểm chứng), Documents (nếu muốn xuất report DOCX).

📐 YÊU CẦU CỤ THỂ — kiểm tra từng mục:
1. Spec compliance: token màu/typography khớp kế-hoạch.md 4.1/4.2? mono tuyệt đối?
   Unbounded hỗ trợ tiếng Việt? glow chỉ ở token button?
2. Kiến trúc: đúng cấu trúc src/styles, src/stores, src/3d, src/i18n, src/hooks?
   Zustand không bị lạm dụng? i18n mặc định vi?
3. Hiệu năng: ScrollSmoother tạo 1 lần? useFrame không allocate? GalaxyScene
   frameloop hợp lý? FPS thực tế khi cuộn?
4. A11y: ThemeToggle keyboard/focus/aria? prefers-reduced-motion được xử lý ở
   smoother + camera + shader time?
5. Chất lượng: lint — liệt kê lỗi còn lại, phân loại "mới sinh từ Phase 1" vs
   "WIP cũ đã biết (Work.jsx, SplashCursor)". Code mới phải KHÔNG thêm lỗi lint.
6. Regression: trang WIP cũ (Hero/About/Work/Education/Footer) vẫn hoạt động bình
   thường với hạ tầng mới?

✅ DEFINITION OF DONE:
- Report rõ ràng dạng bảng: | Task | Đạt? | Vấn đề | Mức độ (Blocker/Major/Minor)
  | Đề xuất sửa |
- Mọi vấn đề Major/Blocker kèm vị trí file + dòng cụ thể + cách sửa gợi ý.
- Kết luận: Phase 1 PASS / PASS-WITH-ISSUES / FAIL + danh sách việc cần làm trước
  khi sang Phase 2.

📝 SAU KHI XONG: cập nhật AGENTS.md mục "## Tiến độ" (Task 1.10) + lưu report vào
outputs/review-phase-1.md.

⛔ KHÔNG ĐƯỢC: tự sửa code (chỉ report) · đánh giá chủ quan không dẫn chứng file ·
bỏ qua việc test thực trên browser.
```

---

## 📌 Ghi chú cho bạn (người điều phối)

1. **Chạy theo 2 đợt:** Đợt 1 = 1.1 + 1.2 + 1.3 song song. Đợt 2 = 1.4 + 1.5 + 1.9.
   Đợt 3 = 1.6 + 1.7 + 1.8 (lần lượt, không song song). Cuối = 1.10.
2. **Mỗi phiên agent xong →** kiểm tra mục "## Tiến độ" trong AGENTS.md đã được
   ghi đúng chưa; sau đó tick trạng thái trong `ke-hoach-stellar-odyssey.xlsx`
   (sheet 7. Tasks).
3. **Khi có vấn đề:** cho agent đọc lại file gốc (kế-hoạch.md + prototype
   `src/3d-lab.jsx` đang chạy 165fps) — 2 nguồn này giải quyết 90% hiểu nhầm.
4. **Đừng chạy 2 agent cùng sửa 1 file** — bảng phụ thuộc phía trên đã xếp sẵn để
   tránh xung đột.
