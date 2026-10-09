# 🤖 BỘ PROMPT CHO AI AGENTS — PHASE 2 (CORE SECTIONS) + PHASE 3 (3D & MOTION)
## Dự án: Stellar Odyssey · Portfolio Trần Vũ Anh Duy

> Cách dùng: copy từng khối trong dấu ```` ``` ```` dán vào agent. Agent: Antigravity (Gemini) · Codex (OpenAI) · Claude (Anthropic).
> Mọi prompt đều yêu cầu agent ĐỌC TRƯỚC: kế-hoạch.md (spec), AGENTS.md (quy tắc + tiến độ), CLAUDE.md (nếu là Claude), và outputs/content-vi.md + content-en.md (nội dung chính chủ).
> **TẤT CẢ text hiển thị phải dùng i18n keys** (src/i18n/locales/) — không hardcode.

---

## 🚦 ĐIỀU KIỆN TIÊN QUYẾT — đọc kỹ trước khi chạy Phase 2

1. **Chạy nốt Phase 1 còn lại trước:** 1.6 StarField+Nebula+Hố đen, 1.7 CameraRig, 1.8 Bloom, 1.9 Theme toggle, 1.10 Review — prompt đã có trong `outputs/prompts-phase-1.md`.
   → 2.5 Hero và 2.8 Skills bắt buộc có 1.6/1.7 chạy rồi mới thấy hiệu ứng; 2.2 MenuOverlay phụ thuộc 1.7.
2. **File xung đột — chạy tuần tự:**
   - `Nav.jsx`: 2.3 trước → 2.2 sau.
   - `About.jsx`: 2.6 trước (xóa khối experience khỏi About) → 2.10 sau (tạo Experience.jsx).
   - `App.jsx`: agent làm section mới (2.8/2.10/2.11/2.12) gắn section vào App **sau cùng** — nếu chạy song song, agent cuối chịu trách nhiệm merge đúng thứ tự section theo kế-hoạch.md 4.2 sơ đồ.
3. **Nguyên tắc thiết kế bất di bất dịch (mọi task):**
   - MONO TRẮNG-ĐEN: chỉ #050505→#1A1A1A nền, #FAFAFA/#999/#555 text (xem src/styles/globals.css — dùng token, không hardcode màu mới).
   - Glow trắng CHỈ cho button/CTA (token --glow-button). Card không glow, chỉ đổi border.
   - Font: Unbounded (heading, hỗ trợ tiếng Việt) / Space Grotesk (body) / JetBrains Mono (label).
   - Animation trong useGSAP + cleanup; tôn trọng prefers-reduced-motion (useReducedMotion đã có).
   - State dùng Zustand (đã có 4 store); i18n keys cho mọi text.
4. **Tham chiếu trực quan:** prototype `/3d-lab.html` (vũ trụ + hố đen 165fps), `/design-lab.html` (token + typography mẫu), website Mont-fort (menu overlay) + Anime.js (live demo).

---

# 🎯 TASK 2.1 — Preloader điện ảnh (Mont-fort style)
*(Agent: Antigravity · P0 · ~3h · Wave 1)*

```
Bạn là một Motion Designer top 0,1% thế giới từng làm intro cho các site đoạt giải
Awwwards SOTD. Nhiệm vụ: viết lại Preloader cho "Stellar Odyssey" — task 2.1.

🎯 MỤC TIÊU: Preloader spinner điện ảnh kiểu Mont-fort + đếm % — thay Preloader WIP
cũ trong src/components/Preloader.jsx. Nền #050505, spinner gradient trắng-xám mono.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.1 (timeline Hero: preloader → camera) + mục 8
(Global Features); src/components/Preloader.jsx (bản WIP để biết contract onComplete);
src/stores/useLoadingStore.js; src/i18n/locales/vi.json nhóm "preloader"; xem Mont-fort
để nắm chất spinner + đếm %.

🧰 SKILLS: gsap-timeline · gsap-core · motion-foundations (ecc) · high-end-visual-design
· frontend-design · galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Spinner: 1 vòng SVG gradient trắng→xám quay đều (như Mont-fort nhưng mono) + % đếm
   tăng từ 0→100 bằng GSAP (tween 1.8–2.2s, ease power2.inOut) — không giả lừa quá lâu.
2. Chữ "ĐANG KẾT NỐI VỚI VŨ TRỤ..." (dùng i18n key) hiện dưới spinner, JetBrains Mono.
3. Kết thúc: fade + clip-path reveal màn (curtain kéo lên), sau đó gọi onComplete() —
   giữ nguyên contract với App (useLoadingStore).
4. Reduced-motion: bỏ spinner quay, chỉ % + fade nhanh.
5. KHÔNG dùng ảnh/video; SVG + CSS/GSAP thuần. Tôn trọng aria: role="status" + aria-label.

✅ DONE: build pass; preloader chạy 1 lần mỗi load; không chặn quá 2.5s; 0 console
error; reduced-motion hoạt động.
🔍 VERIFY: dev + Browser, reload 3 lần, bật reduced-motion.
📝 XONG: thêm dòng tiến độ vào AGENTS.md (mục "## Tiến độ").
⛔ CẤM: sửa App logic loading · thêm màu · làm preloader >3s · dùng sound.
```

---

# 🎯 TASK 2.3 — Nav glassmorphism auto-hide
*(Agent: Codex · P0 · ~2h · Wave 2 — chạy TRƯỚC 2.2 vì cùng đụng Nav.jsx)*

```
Bạn là một UI Engineer hàng đầu thế giới. Nhiệm vụ: viết lại Nav cho "Stellar
Odyssey" — task 2.3.

🎯 MỤC TIÊU: Nav glassmorphism mono, auto-hide khi cuộn xuống / hiện lại khi cuộn
lên; logo "ANH DUY" + các mục section; đặt NGOÀI smooth-wrapper (fixed).

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 8 (Nav glass, auto-hide); src/components/Nav.jsx WIP;
src/i18n/locales/vi.json nhóm "nav"; src/stores/useScrollStore.js (dùng currentSection
để highlight mục đang xem); AGENTS.md.

🧰 SKILLS: ui-styling · gsap-scrolltrigger · gsap-react · minimalist-ui · accessibility

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Cấu trúc: left = logo (Unbounded "ANH DUY" hoặc "D." + chấm trắng), right = các
   link section (Về tôi / Dự án / Kỹ năng / Học vấn / Kinh nghiệm / Thử nghiệm /
   Liên hệ — từ i18n nav.*). Desktop hiện đủ, mobile hiện nút menu (nút này sẽ được
   MenuOverlay 2.2 nối sau — để 1 slot onClick placeholder rõ ràng).
2. Style: bg blur rgba(5,5,5,0.55) + backdrop-filter blur(12px) + border-bottom
   rgba(255,255,255,0.08). Text Space Grotesk 0.875rem, uppercase tracking.
   KHÔNG glow.
3. Auto-hide: cuộn xuống > 80px → translateY(-100%); cuộn lên → hiện; dùng
   ScrollTrigger hoặc event + gsap.to transform. Mục đang xem (currentSection từ
   store) → chữ trắng + dấu gạch dưới; còn lại #999.
4. Click link → gsap scrollTo section id (ScrollToPlugin đã đăng ký) + offset.
5. A11y: <nav aria-label>, focus-visible, skip-link tới #smooth-content.

✅ DONE: build pass; auto-hide mượt; highlight đúng section khi cuộn; mobile hiện
nút menu; keyboard dùng được; 0 lỗi console.
🔍 VERIFY: dev + Browser, cuộn 2 chiều, click từng link, tab-key.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: tự tạo MenuOverlay (2.2) · đổi thứ tự section · thêm màu/glow.
```

---

# 🎯 TASK 2.2 — MenuOverlay fullscreen + transition chiều sâu
*(Agent: Antigravity · P0 · ~4h · Wave 2 — chạy SAU 2.3, nối vào nút menu của Nav)*

```
Bạn là một Creative Developer top 0,1% thế giới, chuyên các menu overlay fullscreen
đoạt giải Awwwards (chuẩn Mont-fort). Nhiệm vụ: dựng MenuOverlay cho "Stellar
Odyssey" — task 2.2.

🎯 MỤC TIÊU: Menu overlay fullscreen mở với transition CÓ CHIỀU SÂU (clip-path +
translateZ), link 2 lớp text lướt khi hover (kiểu Mont-fort), mono trắng-đen.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 8 (MenuOverlay) + R2-Q3 (menu overlay & transition có
chiều sâu + grid không gian); src/components/Nav.jsx (vừa làm 2.3 — nút menu slot);
src/i18n/locales/vi.json nhóm nav; tham khảo mont-fort.com để bắt chất menu.

🧰 SKILLS: gsap-timeline · gsap-react · gsap-utils · high-end-visual-design ·
frontend-design · accessibility · galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Tạo src/components/layout/MenuOverlay.jsx: fixed inset-0 z-40; nền #050505 (hoặc
   rgba(5,5,5,0.97) + blur); grid 24 cột tạo cảm giác không gian (R2-Q3).
2. Mở: clip-path circle/inset từ góc + nội dung translateZ(-60px)→0 + opacity;
   đóng ngược lại. Timeline GSAP ~0.7s expo.inOut. Esc + click overlay đóng.
3. Link: chữ Unbounded 8vw, mỗi link 2 span chồng nhau — hover span trên trượt
   translateY(-100%) lộ span dưới (hiệu ứng Mont-fort). Click → scrollTo + đóng menu.
4. Kèm social mini row + email dưới cùng (i18n). Ngôn ngữ Vi/En toggle cũng đặt ở
   đây (dùng useLangStore — KHÔNG làm nút LanguageSwitch riêng, tiết kiệm file).
5. A11y: focus trap đơn giản khi mở, aria-expanded trên nút trigger, Esc đóng,
   khóa cuộn khi mở (ScrollSmoother.paused(true) + trả lại khi đóng).
6. Nút trigger: hoàn thiện slot menu mobile ở Nav (2.3) — desktop cũng hiện nút
   "MENU" nhỏ cạnh link (Mont-fort style).

✅ DONE: build pass; mở/đóng mượt; Esc & overlay & link hoạt động; cuộn bị khóa khi
mở; keyboard + focus OK; 0 console error.
🔍 VERIFY: dev + Browser: mở menu → Esc → mở lại → click link → scroll đúng section.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: thay đổi Nav auto-hide của 2.3 · thêm màu · bỏ qua focus management.
```

---

# 🎯 TASK 2.4 — Custom Cursor "VIEW" + magnetic
*(Agent: Codex · P0 · ~2h · Wave 1)*

```
Bạn là một Interaction Engineer hàng đầu thế giới. Nhiệm vụ: viết lại Custom
Cursor cho "Stellar Odyssey" — task 2.4.

🎯 MỤC TIÊU: Cursor vòng + dot mono; biến thành label "XEM/VIEW" khi hover project;
hiệu ứng magnetic cho phần tử [data-magnetic].

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 8 (Custom Cursor "VIEW"); src/components/Cursor.jsx WIP
(giữ contract: không làm hỏng hover hiện tại); src/i18n (works.cursorCta); AGENTS.md.

🧰 SKILLS: gsap-core (quickTo) · gsap-utils · frontend-design · accessibility ·
gsap-performance

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Vòng 28px border trắng 40% + dot 4px trắng, blend-mode difference để thấy trên cả
   nền tối/sáng (mono).
2. quickTo theo pointermove (dot nhanh, vòng lerp chậm hơn — cảm giác cao cấp).
3. Hover [data-cursor="view"] → vòng phóng to 64px nền #FAFAFA chữ "XEM" đen
   (Unbounded 12px); hover link thường → vòng co nhỏ.
4. Magnetic: phần tử [data-magnetic] hút nhẹ về chuột (translate max ~8px, lerp,
   reset khi rời) — dùng cho nút email, icon social sau này.
5. Chỉ desktop (pointer: fine) — mobile/tablet ẩn cursor, không render div.
6. A11y: cursor chỉ là visual bổ sung, KHÔNG gỡ cursor hệ thống hoàn toàn (giữ
   cursor: auto mặc định? — giữ nguyên mặc định, vòng chạy theo). Reduced-motion:
   bỏ lerp, cập nhật thẳng.

✅ DONE: build pass; mượt 60fps+; hover VIEW đúng; magnetic hoạt động; mobile không
hiện; 0 console error.
🔍 VERIFY: dev + Browser, di chuột nhanh/chậm, hover card Work (tạm gắn data-cursor
thử 1 chỗ), mobile viewport.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: đổi Cursor WIP của section khác · thêm màu · làm cursor chiếm focus.
```

---

# 🎯 TASK 2.6 — About: split layout + avatar white border
*(Agent: Codex · P0 · ~3h · Wave 1 — chạy TRƯỚC 2.10, xóa khối experience khỏi About)*

```
Bạn là một UI Designer top 0,1% thế giới. Nhiệm vụ: viết lại section About cho
"Stellar Odyssey" — task 2.6.

🎯 MỤC TIÊU: About "The Navigator" — split trái avatar (white glow border) / phải
bio + quote + tools + skills pills; MONO; text dùng i18n (about.*).

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.2; src/components/About.jsx WIP (đây là nguồn layout
+ hiệu ứng tham khảo — GIỮ hiệu ứng SplitText/reveal tốt, đổi skin mono); src/i18n
locales about.*; src/styles/globals.css tokens; outputs/content-vi.md mục About.

🧰 SKILLS: minimalist-ui · ui-ux-pro-max · gsap-scrolltrigger · gsap-react ·
frontend-design · galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Layout: grid 12 cột; trái 5 cột = avatar (ảnh /avatar.webp, border rgba(255,255,255,0.15)
   + box-shadow --glow-button RẤT nhẹ — đây là ngoại lệ glow cho ảnh chân dung, không
   phải card) + caption "FIG.01 — NGƯỜI DẪN ĐƯỜNG" (JetBrains Mono, --text-muted).
2. Phải 7 cột: heading "TRẦN VŨ / ANH DUY" (Unbounded, dòng 2 stroke-text-white) +
   sub-label + 2 đoạn bio (bioFirst/bioSecond) + quote nghiêng (Space Grotesk light)
   + "KHO VŨ KHÍ PHẦN MỀM" (icon tools từ public/icons/) + "NĂNG LỰC CỐT LÕI" pills
   (skills từ data).
3. Background section: --bg-void; viền ngăn section bằng border rgba(255,255,255,0.06).
4. Giữ animation WIP tốt: heading SplitText lines, avatar clip reveal + parallax,
   pills ScrollTrigger.batch — đổi easing chuẩn power3.out.
5. XÓA hoàn toàn khối "Professional History" (experience) khỏi About — 2.10 sẽ tạo
   Experience.jsx riêng.
6. i18n: mọi text qua t('about.*'); tools/skills vẫn lấy từ PORTFOLIO_DATA (src/data.js).

✅ DONE: build pass; layout đẹp 320→1920; không còn khối experience trong About;
dấu tiếng Việt OK; 0 console error.
🔍 VERIFY: dev + Browser, responsive, hover pills, cuộn xem reveal.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: tạo Experience.jsx (2.10) · đổi nội dung content draft · thêm màu · glow card.
```

---

# 🎯 TASK 2.7 — Selected Works: constellation cards + filters + coming soon
*(Agent: Antigravity · P0 · ~4h · Wave 1)*

```
Bạn là một Art Director top 0,1% thế giới, chuyên portfolio sites đoạt giải
Awwwards. Nhiệm vụ: viết lại section Works cho "Stellar Odyssey" — task 2.7.

🎯 MỤC TIÊU: Works "Chòm Sao Dự Án" — cards mono với filter (Tất cả / Product
Design / UX/UI / Graphic); EDURA có link, VERIS & VIE hiện "CASE STUDY COMING SOON";
hover → cursor "XEM" (đã có từ 2.4); dùng Flip khi filter.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.3; src/components/Work.jsx WIP (giữ cấu trúc pin/
filter Flip nếu tốt); src/data.js (3 projects); i18n works.*; outputs/content-vi.md.

🧰 SKILLS: frontend-design · ui-styling · gsap-react · gsap-plugins (Flip) ·
gsap-utils · galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Heading "CHÒM SAO DỰ ÁN" Unbounded 8vw + label phụ. Grid 12 cột: card lớn chiếm
   7-8 cột, xen kẽ trái/phải (không đều đều nhàm chán).
2. Card: ảnh WebP (project1/2/3.webp, aspect 16/10, object-cover) + overlay gradient
   đen mờ khi hover + title Unbounded + category label mono + tags pills nhỏ + mô tả
   (i18n). Border rgba(255,255,255,0.1), hover border trắng 0.35 — KHÔNG glow.
3. VERIS & VIE: nút "CASE STUDY COMING SOON" (mono outline, cursor default) thay
   cho link; EDURA giữ link Behance (target _blank rel noopener).
4. Filter: All/Product/UX/UI/Graphic (i18n works.filters.*) — dùng Flip.getState
   để animate reflow mượt (pattern WIP đã có, giữ lại).
5. Cursor: gắn data-cursor="view" trên card có link; data-cursor mặc định trên card
   coming soon.
6. Scroll reveal: ảnh clip-path inset từ dưới, text stagger — ScrollTrigger scrub nhẹ.

✅ DONE: build pass; filter mượt không nhảy layout; coming soon đúng 2 project; link
an toàn; 0 console error; responsive OK.
🔍 VERIFY: dev + Browser, filter qua lại, hover từng card, click EDURA mở tab mới.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: thêm project mới · đổi ảnh · glow card · bỏ Flip pattern nếu đang chạy tốt.
```

---

# 🎯 TASK 2.9 — Education timeline "Star Map"
*(Agent: Codex · P1 · ~2h · Wave 1)*

```
Bạn là một Frontend Designer top 0,1% thế giới. Nhiệm vụ: viết lại section Education
cho "Stellar Odyssey" — task 2.9.

🎯 MỤC TIÊU: Education "Star Map" — timeline dọc mono, mỗi trường là 1 nút sao,
đường nối vẽ theo scroll (SVG draw), 3 mục: Saigon University, Arena Multimedia,
Green Academy (i18n education.*).

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.5; src/components/Education.jsx WIP; src/i18n
education.*; src/data.js (PORTFOLIO_DATA.education); AGENTS.md.

🧰 SKILLS: ui-styling · gsap-scrolltrigger · gsap-plugins (DrawSVG — club free) ·
minimalist-ui · accessibility

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Cột giữa (desktop) / cột trái (mobile): đường SVG stroke rgba(255,255,255,0.2),
   DrawSVG theo scroll (scrub); nút sao tròn 10px trắng viền, node đang nhìn → nút
   to + box-shadow --glow-button nhẹ (điểm nhấn hợp lệ).
2. Mỗi mục: năm (JetBrains Mono --text-muted), trường (Unbounded 1.5rem), bằng cấp
   (Space Grotesk #FAFAFA), chi tiết (#999) — từ i18n keys, KHÔNG đọc trực tiếp
   data.js để giữ song ngữ (nếu data.js đã có tiếng Anh cứng thì vẫn dùng i18n keys
   cho UI text, chi tiết học vấn lấy từ i18n).
3. Xen kẽ trái/phải trên desktop.
4. Reveal: mỗi mục fade-up khi vào viewport.

✅ DONE: build pass; đường vẽ mượt theo scroll; 3 mục đúng nội dung Vi/En; responsive;
0 console error.
🔍 VERIFY: dev + Browser, cuộn chậm xem draw, đổi ngôn ngữ.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: thêm mục mới · đổi nội dung · màu sắc ngoài mono.
```

---

# 🎯 TASK 2.10 — Experience timeline "Voyage Log"
*(Agent: Codex · P1 · ~2h · Wave 4 — chạy SAU 2.6)*

```
Bạn là một Frontend Designer top 0,1% thế giới. Nhiệm vụ: tạo section Experience
cho "Stellar Odyssey" — task 2.10.

🎯 MỤC TIÊU: Experience "Voyage Log" (Nhật Ký Hành Trình) — 3 mission cards:
HOSANA MEDIA, UPWORK, DESIGNVELOPER; mono borders + status badges; slide từ 2 bên.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.6; src/data.js (experience — nội dung gốc);
src/i18n experience.*; About.jsx (đã xóa khối này ở 2.6 — không tạo trùng).

🧰 SKILLS: minimalist-ui · ui-styling · gsap-scrolltrigger · gsap-react · accessibility

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Tạo src/components/sections/Experience.jsx (thư mục sections/ mới — các section
   Phase 2 dần chuyển vào đây; KHÔNG bắt buộc di dời section cũ, chỉ file mới).
2. Heading "NHẬT KÝ HÀNH TRÌNH" + label "Voyage Log" mono.
3. 3 cards ngang (desktop) / dọc (mobile): company (Unbounded), role (mono #999),
   năm + badge loại (Full-time/Freelance/Internship — badge outline trắng mờ),
   chi tiết (Space Grotesk #999). Border rgba(255,255,255,0.1) → hover 0.35.
   KHÔNG glow.
4. Animation: cards slide xen kẽ từ trái/phải (x: ±40) khi vào viewport, stagger.
5. Gắn section vào App.jsx (đúng vị trí sau Education, trước Marquee/Work theo sơ đồ).

✅ DONE: build pass; 3 cards đúng nội dung; responsive; 0 console error.
🔍 VERIFY: dev + Browser, cuộn xem slide, đổi ngôn ngữ.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: đổi nội dung · thêm màu · sửa About.jsx.
```

---

# 🎯 TASK 2.11 — Playground "Space Station": grid + slot live demos
*(Agent: Codex · P2 · ~3h · Wave 1)*

```
Bạn là một Creative Developer top 0,1% thế giới. Nhiệm vụ: dựng section Playground
cho "Stellar Odyssey" — task 2.11.

🎯 MỤC TIÊU: Playground "Trạm Không Gian" — bento grid 8 experiments (tên + mô tả +
loại), 2-3 SLOT LiveDemo (component khung sẵn, demo thật làm ở task 3.5).

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.7; i18n playground.* (8 thí nghiệm đã có tên trong
content draft); outputs/content-vi.md mục Playground.

🧰 SKILLS: frontend-design · ui-styling · prototype · vercel-react-best-practices ·
galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Tạo src/components/sections/Playground.jsx + src/components/effects/LiveDemo.jsx.
   LiveDemo: component nhận children + title, render trong khung 16/9 có border
   trắng mờ + label "LIVE" (JetBrains Mono) — demo thật nằm trong children (3.5).
2. Bento grid 12 cột: 2-3 ô lớn (LiveDemo slots) + 5-6 ô nhỏ (thumbnail text + tag
   loại: WebGL / GLSL / GSAP / DOM) + nút "Sắp ra mắt" outline cho ô chưa có demo.
3. Nội dung 8 experiments lấy đúng tên/loại từ i18n playground.* — KHÔNG tự bịa.
4. Reveal stagger khi vào viewport. Gắn vào App (sau Works).

✅ DONE: build pass; grid đẹp responsive; 3 slot LiveDemo + 5 ô nhỏ; 0 console error.
🔍 VERIFY: dev + Browser, hover từng ô, responsive.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: viết demo thật (3.5) · đổi tên experiments · thêm màu.
```

---

# 🎯 TASK 2.12 — Contact "Transmission"
*(Agent: Codex · P1 · ~2h · Wave 1)*

```
Bạn là một Frontend Designer top 0,1% thế giới. Nhiệm vụ: tạo section Contact cho
"Stellar Odyssey" — task 2.12.

🎯 MỤC TIÊU: Contact "Transmission" — headline "HÃY KẾT NỐI / LET'S CONNECT" khổng
lồ + nút email magnetic có glow (ngoại lệ hợp lệ) + 4 kênh social + phone.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.8; i18n contact.*; src/data.js (email/phone/
facebook); AGENTS.md. LinkedIn/Behance URL đang trống → dùng key contact.linkedinUrl
rỗng, ẩn nút nếu rỗng.

🧰 SKILLS: frontend-design · ui-styling · gsap-core · accessibility · galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Tạo src/components/sections/Contact.jsx: heading 2 dòng (Vi + En xen kẽ stroke/
   solid), sub "Gửi một tín hiệu — tôi luôn mở tần số." (i18n).
2. Nút email: data-magnetic (cursor 2.4 hỗ trợ) + bg #FAFAFA chữ đen + box-shadow
   --glow-button (đây là button CTA chính — glow HỢP LỆ), mailto:anhduy25work@gmail.com.
3. 4 social (Facebook có link; LinkedIn/Behance ẩn nếu URL rỗng — đọc từ data.js
   profile mở rộng hoặc i18n) + phone hiển thị mono.
4. Footer tách riêng giữ nguyên WIP — section Contact chỉ là phần trên.
5. Reveal text từng dòng + glow pulse nhẹ trên nút (GSAP, tôn trọng reduced-motion).
6. Gắn vào App (trước Footer).

✅ DONE: build pass; mailto hoạt động; magnetic + glow đúng; 0 console error.
🔍 VERIFY: dev + Browser, click email, hover nút, responsive.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: sửa Footer · bịa URL · glow ngoài nút CTA.
```

---

# 🎯 TASK 2.13 — Marquee tickers
*(Agent: Codex · P2 · ~1h · Wave 1)*

```
Bạn là một Motion UI Engineer top 0,1% thế giới. Nhiệm vụ: chuẩn hóa Marquee cho
"Stellar Odyssey" — task 2.13.

🎯 MỤC TIÊU: 3 dải marquee vô hạn mono (đã có component WIP) — text từ i18n
marquee.*, border trắng mờ, Unbounded/Space Grotesk, đổi hướng xen kẽ.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 8; src/components/Marquee.jsx WIP; i18n marquee.*;
AGENTS.md.

🧰 SKILLS: gsap-core · gsap-utils · gsap-performance · frontend-design

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Giữ API WIP (props text/speed/reverse/className) để App không phải đổi nhiều.
2. Skin mono: text #FAFAFA Unbounded 3rem hoặc Space Grotesk 600; separator "•" xám;
   border-y rgba(255,255,255,0.08) thay border-black cũ.
3. Infinite loop bằng GSAP xPercent -50 repeat -1 (nếu WIP dùng CSS animation cũng
   được — chọn cách nhẹ hơn), pause khi tab ẩn không cần (GSAP tự mượt).
4. Reduced-motion: marquee tĩnh.
5. Đổi text 3 dải trong App sang i18n marquee.* (nếu muốn gọn, để App gọi t()).

✅ DONE: build pass; 3 dải chạy mượt không giật; reduced-motion tĩnh; 0 console error.
🔍 VERIFY: dev + Browser, cuộn qua 3 dải, bật reduced-motion.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: đổi nội dung text · thêm màu · viết lại API không tương thích.
```

---

# 🎯 TASK 2.5 — Hero "Gateway to the Galaxy"
*(Agent: Antigravity · P0 · ~4h · Wave 3 — bắt buộc 1.6/1.7/1.8 đã chạy)*

```
Bạn là một Creative Director top 0,1% thế giới từng dựng hero cinematic cho các
site đoạt giải Awwwards (Noomo/Edolus chuẩn). Nhiệm vụ: viết lại Hero cho "Stellar
Odyssey" — task 2.5.

🎯 MỤC TIÊU: Hero fullscreen trong suốt (để lộ GalaxyScene phía sau): tên "TRẦN VŨ
ANH DUY" Unbounded 12vw trắng + tagline ScrambleText + scroll indicator; camera 3D
tiến về hố đen khi cuộn (CameraRig đã có từ 1.7).

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.1 (timeline chính xác); src/components/Hero.jsx WIP
(hiệu ứng welcome hiện tại để tham khảo); i18n hero.*; src/3d/ (GalaxyScene +
CameraRig — Hero KHÔNG tạo Canvas mới, chỉ là lớp DOM trong suốt phía trên).

🧰 SKILLS: frontend-design · high-end-visual-design · gsap-timeline · gsap-plugins
(SplitText + ScrambleText) · ui-ux-pro-max · galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. Hero section: min-h-screen flex center, NỀN TRONG SUỐT (để sao/hố đen hiện qua) —
   đây là lý do WIP cũ phải bỏ nền đục. Text đặt giữa, pointer-events none trừ CTA.
2. Timeline (sau preloader, dùng prop active): tên hiện SplitText chars stagger
   0.03 expo.out → tagline "Creative Designer" ScrambleText 1.2s → sub-tagline fade
   → scroll indicator (chevron + "CUỘN ĐỂ BẮT ĐẦU HÀNH TRÌNH" mono nhỏ) nhấp nháy.
3. Scroll: dùng ScrollTrigger scrub — hero content fade/scale nhẹ khi cuộn qua
   (camera tự bay do 1.7, Hero không đụng camera).
4. Tên responsive: clamp(44px, 12vw, 200px); letter-spacing -0.02em; màu #FAFAFA;
   KHÔNG gradient màu (mono).
5. i18n đầy đủ (hero.*); reduced-motion: bỏ ScrambleText, hiện text thẳng.
6. Chỉ sửa Hero.jsx + App (nếu cần truyền active) — không đụng src/3d.

✅ DONE: build pass; hero trong suốt thấy sao phía sau; timeline đúng thứ tự; cuộn
mượt; 0 console error; mobile OK.
🔍 VERIFY: dev + Browser: reload xem timeline, cuộn xem camera bay + hero fade.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: tạo Canvas mới · đổi camera · đặt nền đục · thêm màu.
```

---

# 🎯 TASK 2.8 — Skills & Tools "Arsenal Nebula" (orbital)
*(Agent: Antigravity · P1 · ~3h · Wave 3 — sau 1.5)*

```
Bạn là một Creative Technologist top 0,1% thế giới. Nhiệm vụ: dựng section Skills
cho "Stellar Odyssey" — task 2.8.

🎯 MỤC TIÊU: Skills "Tinh Vân Kỹ Năng" — phần DOM (3 nhóm: Công cụ / Năng lực cốt
lõi / Kỹ thuật) + orbital 3D nhẹ (tool icons quay quanh core) trong GalaxyScene.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7.4; i18n skills.*; src/data.js skills; src/3d/
GalaxyScene (children slot); prototype 3d-lab (cách dựng nhóm quay).

🧰 SKILLS: react-3d-ui · threejs-fundamentals · gsap-scrolltrigger · ui-ux-pro-max ·
galaxy-portfolio

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. src/components/sections/Skills.jsx: heading "TINH VÂN KỸ NĂNG" + 3 nhóm card mono
   (border trắng mờ, icon Lucide hoặc public/icons, tên + level bar xám→trắng).
2. 3D orbital: src/3d/components/OrbitalSkills.jsx — 8-10 icon tinh giản (KHÔNG
   load texture, dùng text/plane đơn giản hoặc icon SVG via drei Html KHÔNG — dùng
   mesh hình học nhỏ + label DOM riêng để nhẹ) quay quanh core trắng; hiện ở vùng
   Skills khi section vào viewport (dùng useScrollStore.currentSection === 'skills').
   Dừng quay khi reduced-motion.
3. Chỉ hiển thị khi section active (render theo currentSection — tiết kiệm GPU).
4. Gắn section vào App; OrbitalSkills vào GalaxyScene children.

✅ DONE: build pass; orbital quay mượt chỉ khi ở Skills; 3 nhóm DOM đẹp; 0 console
error; FPS >120.
🔍 VERIFY: dev + Browser, cuộn vào/ra Skills xem orbital bật/tắt.
📝 XONG: ghi tiến độ vào AGENTS.md.
⛔ CẤM: tạo Canvas riêng · texture ảnh · chạy orbital toàn trang.
```

---

# 🎯 TASK 2.14 — i18n hoàn thiện Vi/En
*(Agent: Claude · P1 · ~3h · Wave 4 — sau 2.5–2.12)*

```
Bạn là một Bilingual Content Reviewer hàng đầu thế giới. Nhiệm vụ: hoàn thiện i18n
cho "Stellar Odyssey" — task 2.14.

🎯 MỤC TIÊU: rà + bổ sung mọi key Vi/En còn thiếu sau khi các section Phase 2 được
viết lại; proofread chất lượng song ngữ.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 8 (i18n); outputs/content-vi.md + content-en.md
(nguồn chuẩn); src/i18n/locales/vi.json + en.json; CLAUDE.md (writing style);
soát tất cả section Phase 2 để phát hiện text hardcode còn sót.

🧰 SKILLS: ecc:i18n-sync · writing-guidelines · code-review

🔌 PLUGIN: Browser, Documents (nếu xuất báo cáo DOCX).

📐 YÊU CẦU:
1. Grep toàn src/ tìm chuỗi text hiển thị hardcode (tiếng Việt/Anh trong JSX) → liệt
   kê + đề xuất key; agent làm section sẽ sửa (hoặc bạn sửa trực tiếp nếu nhỏ).
2. Đối chiếu key parity Vi/En (script check đã có ở outputs/task-1.4) — key nào thiếu
   1 bên → bổ sung.
3. Proofread: ngữ pháp, dấu câu, nhất quán thuật ngữ ("Hố đen" vs "Lỗ đen" — chọn 1:
   dùng "HỐ ĐEN"); giọng văn bí ẩn-tự tin theo CLAUDE.md.
4. Ghi lại các chuỗi chưa có nội dung chính thức (linkedinUrl...) để user điền.

✅ DONE: 0 text hardcode ngoài i18n (trừ data.js legacy đã biết); parity 100%;
báo cáo danh sách placeholder còn trống.
🔍 VERIFY: build + Browser đổi ngôn ngữ, soát 8 section.
📝 XONG: ghi tiến độ AGENTS.md + outputs/i18n-audit.md.
⛔ CẤM: đổi nội dung draft đã duyệt khi chưa được yêu cầu · thêm ngôn ngữ mới.
```

---

# 🎯 TASK 2.15 — Review Phase 2
*(Agent: Claude · P1 · ~3h · Wave cuối)*

```
Bạn là Principal Engineer + Accessibility Auditor của agency đẳng cấp thế giới.
Nhiệm vụ: review toàn bộ Phase 2 — task 2.15. CHỈ REPORT, không sửa code.

🎯 MỤC TIÊU: đánh giá 2.1–2.14 theo 5 trục: spec, kiến trúc, hiệu năng, a11y, chất
lượng — như prompt 1.10 nhưng mở rộng cho UI thật.

📖 ĐỌC TRƯỚC: kế-hoạch.md mục 7 (spec từng section — đối chiếu từng dòng), 8
(features), 11 (verification); CLAUDE.md; AGENTS.md tiến độ; chạy trang thật.

🧰 SKILLS: code-review · review-agent · web-design-guidelines · accessibility ·
gsap-performance · ui-ux-pro-max

🔌 PLUGIN: Code Review, Browser.

📐 TRỌNG TÂM:
1. Spec: mỗi section có đúng element/visual như kế-hoạch.md 7.x? mono tuyệt đối?
   glow chỉ button (trừ 2 ngoại lệ đã chấp thuận: avatar About + nút CTA Contact)?
2. Hiệu năng: FPS khi cuộn full trang (target >120); ScrollTrigger không rò rỉ;
   orbital chỉ chạy khi active; preloader < 2.5s.
3. A11y: focus trap menu, aria cho mọi interactive, reduced-motion mọi animation,
   contrast mono đạt WCAG AA (#999 trên #050505 = ~7:1 OK).
4. i18n: không hardcode; Vi mặc định; chuyển ngôn ngữ không vỡ layout.
5. Report dạng bảng + lưu outputs/review-phase-2.md + ghi AGENTS.md.

⛔ CẤM: tự sửa code · đánh giá không dẫn chứng.
```

---

# 🔥 PHASE 3 — 3D & MOTION INTEGRATION (13 tasks)

> Điều kiện: Phase 2 xong + 1.6/1.7/1.8 xong. Trình tự: 3.1 → 3.2 → (3.3 ‖ 3.4) → 3.6 → 3.7 → (3.8 ‖ 3.9 ‖ 3.10) → 3.5 → 3.11 → 3.12 → 3.13.
> Chú ý: hố đen đã thay wormhole trong concept (R3-Q3) — 3.2 làm "Hố đen Contact transition".

# 🎯 TASK 3.1 — Set pieces: Planet / orbital rings / hố đen theo section
*(Antigravity · P0 · 4h)*
```
Bạn là một 3D Scene Artist top 0,1% thế giới (phong cách Noomo/Edolus). Nhiệm vụ:
3.1 — set pieces 3D cho từng section trong GalaxyScene (KHÔNG tạo canvas mới).

📖 ĐỌC: kế-hoạch.md 7.x (set piece mỗi section); src/3d/GalaxyScene.jsx; src/3d-lab.jsx
(prototype hố đen + nebula chuẩn); useScrollStore (currentSection để bật/tắt).

🧰 SKILLS: react-3d-ui · threejs-shaders · threejs-fundamentals · gsap-performance

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU:
1. src/3d/components/Planet.jsx: hành tinh mono (sphere #111111 + rim light trắng +
   vòng torus) cho About; OrbitalRings cho Skills (nếu 2.8 chưa tách); hố đen giữ
   nguyên vị trí Hero-cuối từ 1.6.
2. Mỗi set piece render theo currentSection (hiện/ẩn bằng visible + scale nhẹ) —
   KHÔNG chạy khi ngoài section.
3. Material đơn giản (meshStandard + basic), không texture; FPS >120.

✅ DONE: build pass; set piece đúng section; FPS >120; 0 console error.
📝 XONG: ghi AGENTS.md. ⛔ CẤM: canvas mới · texture · đổi vị trí hố đen.
```

# 🎯 TASK 3.2 — Hố đen Contact transition
*(Antigravity · P1 · 4h)*
```
Bạn là một Graphics Engineer top 0,1% thế giới. Nhiệm vụ: 3.2 — transition hố đen ở
Contact (thay wormhole cũ trong plan): cuộn tới Contact → camera tiến sát hố đen,
đĩa bồi tụ sáng dần → text Contact nổi trên đó.

📖 ĐỌC: kế-hoạch.md 7.8 + R3-Q3; src/3d/components/BlackHole.jsx (1.6); CameraRig (1.7).

🧰 SKILLS: threejs-shaders · react-3d-ui · gsap-scrolltrigger

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: timeline scrub gắn section Contact — camera z tiến thêm + disk intensity
tăng (uniform) + Contact text opacity tăng; tôn trọng reduced-motion (tĩnh).

✅ DONE: build pass; transition mượt; FPS >120. 📝 XONG: ghi AGENTS.md.
⛔ CẤM: đổi hành vi hố đen ở Hero.
```

# 🎯 TASK 3.3 — ShootingStars + 3.4 — FloatingObjects
*(Antigravity · P2 · 2h + 2h — làm chung 1 phiên)*
```
Bạn là một Creative Technologist top 0,1% thế giới. Nhiệm vụ: 3.3 + 3.4 — sao băng
ngẫu nhiên + vật thể trôi nổi mono trong GalaxyScene.

📖 ĐỌC: kế-hoạch.md 8; src/3d-lab.jsx; AGENTS.md.

🧰 SKILLS: react-3d-ui · threejs-fundamentals · gsap-performance

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: ShootingStars — 2-3 vệt trắng mảnh bắn ngẫu nhiên mỗi 4-7s (points +
trail nhẹ); FloatingObjects — 5-7 hình học nhỏ (icosahedron/torus, #1A1A1A + edge
trắng mờ) trôi chậm; cả hai dùng useFrame delta, tôn trọng reduced-motion + chỉ
hiện khi trang visible. KHÔNG đụng camera.

✅ DONE: build pass; hiệu ứng tinh tế không ồn; FPS >120; 0 console error.
📝 XONG: ghi AGENTS.md. ⛔ CẤM: thêm màu · hiệu ứng dày đặc gây nhiễu.
```

# 🎯 TASK 3.6 — ScrollTrigger timelines toàn bộ sections
*(Antigravity · P0 · 6h)*
```
Bạn là một Motion Director top 0,1% thế giới (chuẩn GSAP Showcase). Nhiệm vụ: 3.6 —
ScrollTrigger timelines cho toàn bộ 8 sections theo kế-hoạch.md 4.3 Motion
Principles.

📖 ĐỌC: kế-hoạch.md 4.3 + 7.x (animation mỗi section); toàn bộ components/sections;
useGSAPSetup + useReducedMotion.

🧰 SKILLS: gsap-scrolltrigger · gsap-timeline · gsap-react · gsap-performance ·
motion-patterns (ecc) · gsap-utils

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: thống nhất ngôn ngữ chuyển động: entrance fade-up y:40 stagger 0.1;
scrub cho parallax/3D; expo.out/power3.out; duration 0.8-1.2s major; mọi trigger
cleanup trong useGSAP; reduced-motion → tắt toàn bộ (chỉ hiện). KHÔNG đổi layout.

✅ DONE: build pass; mọi section có reveal đúng spec; cuộn nhanh không nhảy; FPS >120.
📝 XONG: ghi AGENTS.md. ⛔ CẤM: tự ý thêm hiệu ứng ngoài spec · bỏ cleanup.
```

# 🎯 TASK 3.7 — SplitText + ScrambleText reveals
*(Antigravity · P1 · 2h)*
```
Bạn là một Typography Animation Artist top 0,1% thế giới. Nhiệm vụ: 3.7 — hiệu ứng
chữ: SplitText chars/lines cho mọi heading + ScrambleText cho số/tagline.

📖 ĐỌC: kế-hoạch.md 4.3; components/sections hiện có; splitText helper trong
useGSAPSetup.

🧰 SKILLS: gsap-plugins · gsap-timeline · gsap-scrolltrigger

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: heading → SplitText lines/chars stagger 0.03; số đếm/counter → ScrambleText;
tagline Hero giữ (đã làm 2.5); cleanup revert; reduced-motion → không split.

✅ DONE: build pass; chữ mượt không vỡ dòng; 0 console error.
📝 XONG: ghi AGENTS.md. ⛔ CẤM: split text i18n đang đổi ngôn ngữ (re-split sau khi
đổi lang — xử lý bằng key phụ thuộc ngôn ngữ hoặc revert trước).
```

# 🎯 TASK 3.8 — Image reveal clip-path
*(Codex · P1 · 2h)*
```
Bạn là một Frontend Animator top 0,1% thế giới. Nhiệm vụ: 3.8 — ảnh project/avatar
reveal clip-path inset khi vào viewport (scrub nhẹ).

📖 ĐỌC: kế-hoạch.md 4.3; Work/About hiện tại; .reveal-clip helper trong index.css.

🧰 SKILLS: gsap-scrolltrigger · gsap-core · ui-styling

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: ảnh card Works + avatar About reveal inset(12% 8%) → 0 khi scroll; scrub
0.8; giữ tỉ lệ không méo; reduced-motion → hiện thẳng.

✅ DONE: build pass; mượt; 0 console error. 📝 XONG: ghi AGENTS.md.
⛔ CẤM: đổi layout · thêm hiệu ứng khác.
```

# 🎯 TASK 3.9 — Hover interactions (magnetic, scale, glow)
*(Codex · P1 · 2h)*
```
Bạn là một Interaction Engineer top 0,1% thế giới. Nhiệm vụ: 3.9 — hệ thống hover:
scale 1.05 + border trắng cho card; magnetic cho button; glow chỉ CTA.

📖 ĐỌC: kế-hoạch.md 4.3 (Hover); Cursor 2.4; components/sections.

🧰 SKILLS: gsap-core · gsap-utils · gsap-performance · gpt-taste

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: card hover → border #FAFAFA 0.35 + translateY(-4px) (KHÔNG glow); nút
CTA → shadow --glow-button-strong; magnetic [data-magnetic] mượt (nếu 2.4 chưa đủ);
reduced-motion → chỉ đổi border.

✅ DONE: build pass; hover phản hồi <150ms; FPS >120. 📝 XONG: ghi AGENTS.md.
⛔ CẤM: glow card · hiệu ứng phô trương.
```

# 🎯 TASK 3.10 — Parallax layers
*(Antigravity · P1 · 2h)*
```
Bạn là một Motion Engineer top 0,1% thế giới. Nhiệm vụ: 3.10 — parallax DOM theo
tốc độ 0.3/0.5/0.8 (kế-hoạch.md 4.3): ảnh About, heading nền section, marquee.

📖 ĐỌC: kế-hoạch.md 4.3; sections hiện có.

🧰 SKILLS: gsap-scrolltrigger · gsap-performance · gsap-react

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: dùng data-speed attribute + scrub; chỉ transform (không layout shift);
reduced-motion → tắt.

✅ DONE: build pass; mượt; 0 console error. 📝 XONG: ghi AGENTS.md.
⛔ CẤM: parallax 3D canvas (CameraRig lo) · top/left animate.
```

# 🎯 TASK 3.5 — LiveDemo: 2-3 demo tương tác thật
*(Antigravity · P0 · 5h)*
```
Bạn là một Creative Technologist top 0,1% thế giới (chuẩn Anime.js homepage). Nhiệm
vụ: 3.5 — 2-3 live demo tương tác nhét vào slot LiveDemo (2.11): particle field,
shader playground mini, scroll demo.

📖 ĐỌC: kế-hoạch.md 7.7 + R2-Q4 (2-3 demo interactive + còn lại link CodePen);
src/components/effects/LiveDemo.jsx; src/3d-lab.jsx (shader tham chiếu).

🧰 SKILLS: react-3d-ui · threejs-shaders · prototype · gsap-scrolltrigger ·
ui-ux-pro-max

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: (a) Particle field — canvas nhỏ R3F, chuột đẩy hạt (mono trắng);
(b) Shader playground — 1-2 slider chỉnh uniform fbm (xám); (c) Scroll demo —
thanh progress + orbit theo scroll. Mỗi demo < 120 dòng, frameloop demand khi idle,
reduced-motion → tĩnh. Tên demo lấy i18n playground.*.

✅ DONE: build pass; 3 demo chạy thật bấm được; FPS >120; 0 console error.
📝 XONG: ghi AGENTS.md. ⛔ CẤM: demo nặng > 200KB JS · iframe ngoài · thêm màu.
```

# 🎯 TASK 3.11 — Sync 3D ↔ DOM fine-tune
*(Antigravity · P0 · 3h)*
```
Bạn là một Graphics Engineer top 0,1% thế giới. Nhiệm vụ: 3.11 — đồng bộ hoàn hảo
giữa camera 3D (CameraRig) và DOM: timing Hero, set piece khớp vị trí section,
scroll progress khớp store.

📖 ĐỌC: kế-hoạch.md 6.2 (sơ đồ đồng bộ); CameraRig, useScrollProgress, useScrollStore.

🧰 SKILLS: react-3d-ui · gsap-scrolltrigger · gsap-performance

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: đo lại các mốc section → chỉnh hệ số CameraRig/lerp để hố đen đúng lúc
Contact, set piece đúng section; scroll store khớp 1:1; không jitter khi resize.

✅ DONE: build pass; hành trình mượt từ Hero → hố đen; FPS >120.
📝 XONG: ghi AGENTS.md. ⛔ CẤM: đổi kiến trúc store.
```

# 🎯 TASK 3.12 — Mobile 3D fallback tiers
*(Antigravity · P0 · 3h)*
```
Bạn là một Performance Engineer top 0,1% thế giới. Nhiệm vụ: 3.12 — quality tiers
thật cho mobile: low (mobile <768): 1.5k sao + tắt bloom + tắt chromatic; medium
(tablet): 4k + bloom nhẹ; high: nguyên bản.

📖 ĐỌC: kế-hoạch.md 4.2 (Mobile fallback); GalaxyScene data-quality đã có; 1.6
(StarField prop count), 1.8 (enableBloom).

🧰 SKILLS: react-3d-ui · gsap-performance · accessibility

🔌 PLUGIN: Browser, Ponytail.

📐 YÊU CẦU: truyền quality từ GalaxyScene xuống children (context hoặc props);
mobile còn giảm DPR xuống 1; đo FPS thực trên viewport 390px (target >50 mobile).

✅ DONE: build pass; mobile mượt, không nóng máy; desktop không đổi.
📝 XONG: ghi AGENTS.md. ⛔ CẤM: tắt 3D hẳn trên mobile.
```

# 🎯 TASK 3.13 — Review Phase 3
*(Claude · P1 · 3h — cuối)*
```
Bạn là Principal Engineer + Motion Auditor đẳng cấp thế giới. Nhiệm vụ: 3.13 —
review toàn bộ Phase 3 (3.1–3.12): hiệu năng FPS thực, chất lượng motion, spec,
a11y reduced-motion. CHỈ REPORT.

📖 ĐỌC: kế-hoạch.md 4.3 + 11 (verification); AGENTS.md tiến độ; chạy trang thật +
đo FPS bằng DevTools Performance trên desktop và mobile viewport.

🧰 SKILLS: code-review · review-agent · gsap-performance · accessibility · web-design-guidelines

🔌 PLUGIN: Code Review, Browser.

📐 TRỌNG TÂM: FPS desktop >120 / mobile >50; không rò rỉ listener/trigger sau
unmount; motion đúng spec 4.3; reduced-motion toàn bộ; hố đen transition đúng.
Report → outputs/review-phase-3.md + ghi AGENTS.md.

⛔ CẤM: tự sửa code.
```

---

## 📌 Điều phối nhanh cho bạn

| Đợt | Chạy gì | Ghi chú |
|---|---|---|
| 0 | 1.6 → 1.7 → 1.8 → 1.9 → 1.10 | Prompt ở `outputs/prompts-phase-1.md` — bắt buộc trước |
| 1 | 2.1 ‖ 2.4 ‖ 2.6 ‖ 2.7 ‖ 2.9 ‖ 2.11 ‖ 2.12 ‖ 2.13 | File khác nhau, chạy song song được |
| 2 | 2.3 → 2.2 | Cùng Nav.jsx, tuần tự |
| 3 | 2.5 (sau 1.6-1.8) ‖ 2.8 (sau 1.5) | |
| 4 | 2.10 → 2.14 → 2.15 | |
| 5 | 3.1 → 3.2 → 3.3+3.4 → 3.6 → 3.7 → 3.8/3.9/3.10 → 3.5 → 3.11 → 3.12 → 3.13 | Đa số Antigravity, tuần tự |

Sau mỗi phiên: kiểm tra dòng mới trong AGENTS.md → tick Excel sheet 7. Tasks.
