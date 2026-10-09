# 🌌 KẾ HOẠCH CHI TIẾT: Portfolio Rebuild 2026
## "STELLAR ODYSSEY" — Portfolio của Trần Vũ Anh Duy (bản cập nhật sau grill-me)

> **Concept:** Vũ trụ bí ẩn pha chất **premium cinematic** — mỗi section là một vùng không gian, người dùng du hành qua ngân hà để khám phá câu chuyện của Creative Designer.
>
> **Tham chiếu chính:** [Edolus](https://edolus.com/) (3D journey) · [Noomo Agency](https://noomoagency.com/) (cinematic 3D storytelling) · [Anime.js](https://animejs.com/) (live interactive demos) · [Mont-fort](https://mont-fort.com/) (premium minimal + WebGL nền + menu overlay có chiều sâu)
>
> **Phiên bản:** v2.0 — cập nhật sau buổi grill-me ngày 04/10/2026

---

## Mục lục
1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Quyết định đã chốt (grill-me)](#2-quyết-định-đã-chốt-grill-me)
3. [Phân tích website tham chiếu](#3-phân-tích-website-tham-chiếu)
4. [Design System](#4-design-system)
5. [Tech Stack](#5-tech-stack)
6. [Kiến trúc & Cấu trúc](#6-kiến-trúc--cấu-trúc)
7. [Chi tiết 8 Sections](#7-chi-tiết-8-sections)
8. [Global Features](#8-global-features)
9. [Phân công AI Agent](#9-phân-công-ai-agent)
10. [Kế hoạch thực hiện (Phases)](#10-kế-hoạch-thực-hiện-phases)
11. [Verification Plan](#11-verification-plan)
12. [Việc còn bỏ ngỏ](#12-việc-còn-bỏ-ngỏ)

---

## 1. Tổng quan dự án

| Thuộc tính | Chi tiết |
|:---|:---|
| **Tên concept** | Stellar Odyssey — Galaxy / Mysterious / Premium Cinematic |
| **Vai trò thể hiện** | Creative Designer (UX/UI + Đồ họa + Motion) |
| **Tone** | Dark mode sang trọng, **MONO TRẮNG-ĐEN** — text trắng chủ đạo `#FAFAFA` trên nền đen sâu |
| **Accent colors** | KHÔNG có màu accent — glow trắng `rgba(255,255,255,.35)` chỉ dành cho button/CTA |
| **Typography** | **Unbounded** (display) + **Space Grotesk** (body) + **JetBrains Mono** (code/label) |
| **3D** | **Full 3D mono** — 1 canvas R3F persistent, camera gắn scroll, sao trắng + tinh vân xám + **HỐ ĐEN ở cuối hành trình** |
| **Animation** | GSAP Club (đã free toàn bộ): ScrollSmoother, ScrollTrigger, SplitText, ScrambleText, Flip |
| **Navigation** | SPA smooth scroll + **Menu overlay fullscreen có chiều sâu** (kiểu Mont-fort) |
| **Tính năng đặc biệt** | Custom cursor "VIEW", live interactive demos (kiểu Anime.js), Preloader điện ảnh, Marquee, i18n Vi/En (mặc định Vi), Dark/Light toggle, a11y, PWA |
| **Deploy** | Vercel (dùng `*.vercel.app` trước, mua domain sau nếu cần) |
| **Timeline** | Không deadline cứng — theo dõi bằng cột Trạng thái trong Excel |
| **Benchmark** | ✅ 165fps ổn định trên máy dev (prototype Phase 0) |

### Sections (8 sections)
1. 🌌 **Hero** — Galaxy entrance điện ảnh + tên & tagline
2. 👤 **About Me** — Storytelling giới thiệu bản thân
3. 💼 **Selected Works** — Dự án nổi bật (3 project + "Case study coming soon")
4. 🛠 **Skills & Tools** — Kỹ năng và công cụ
5. 📚 **Education** — Học vấn
6. 💫 **Experience / Timeline** — Kinh nghiệm làm việc
7. 🧪 **Playground / Lab** — Grid experiments + 2-3 live demos tương tác
8. 📬 **Contact** — Liên hệ (Email + LinkedIn + Behance + Facebook)

---

## 2. Quyết định đã chốt (grill-me)

| # | Câu hỏi | Quyết định cuối |
|:---|:---|:---|
| R1-Q1 | Yêu thích gì ở 3 site | Noomo = điện ảnh + 3D animation · Anime.js = tương tác live demo · Mont-fort = 3D layout + tinh tế tối giản |
| R1-Q2 | Concept | **Lai**: giữ linh hồn vũ trụ, tiết chế sang trọng; bỏ Orbitron |
| R1-Q3 | Màu | Giữ Purple `#8B5CF6` + Cyan `#00FFFF` + off-white `#F0F0FF` làm text chủ đạo |
| R1-Q4 | Mức độ 3D | **Full 3D** sát tham chiếu nhất có thể — ấn tượng là ưu tiên số 1, hiệu năng sau |
| R1-Q5 | GSAP Club | Đã free toàn bộ (2025) → dùng hết plugin, không cần Lenis thay thế |
| R1-Q6 | Tính năng đặc sản | Tất cả TRỪ ambient sound: custom cursor + live demos + menu overlay + preloader + marquee |
| R1-Q7 | Case study links | Nút **"Case study coming soon"** tạm thời cho VERIS & VIE PERFUME |
| R1-Q8 | Ngôn ngữ & phạm vi | Mặc định **Vi** + toggle En; giữ đủ **8 sections** |
| R2-Q1 | Font display | **Syne** (700–800) + Space Grotesk + JetBrains Mono |
| R2-Q2 | Kiến trúc 3D | **1 canvas persistent + camera scroll-linked + set pieces theo section** + Bloom + Chromatic Aberration |
| R2-Q3 | "3D layout" Mont-fort | **Cả (b) + (c)**: menu overlay & transition có chiều sâu không gian + grid layout tạo cảm giác không gian |
| R2-Q4 | Playground | Grid 6-8 experiments + 2-3 live demo interactive, còn lại link CodePen |
| R2-Q5 | Tên concept | Giữ **Stellar Odyssey** làm tên nội bộ (không hiển thị trên web) |
| R2-Q6 | Contact & hạ tầng | Email + LinkedIn + Behance + Facebook; domain `*.vercel.app` trước |
| R2-Q7 | Excel | Tasks + giờ + dependency + **cột Trạng thái**; không deadline cứng |
| R3-Q1 | Font Syne lỗi tiếng Việt | Đổi sang **Unbounded** (hỗ trợ đầy đủ tiếng Việt, dáng rộng futuristic hợp vũ trụ); khắc phục luôn lỗi font bị kéo giãn bất thường |
| R3-Q2 | Màu sắc | **MONO TRẮNG-ĐEN toàn bộ UI** — bỏ purple/cyan/pink/blue; glow trắng chỉ dành cho button |
| R3-Q3 | Điểm đến hành trình | **HỐ ĐEN** thay vì ngôi sao — horizon đen + đĩa bồi tụ trắng + vòng photon (chất Interstellar) |
| R3-Q4 | Benchmark FPS | **165fps ổn định** trên máy dev — prototype Phase 0 đạt chuẩn vượt mức |

---

## 3. Phân tích website tham chiếu

### 3.1 Noomo Agency — "Story dictates the medium"
- **DNA:** Cinematic 3D storytelling, WebGL đóng vai kể chuyện chứ không trang trí.
- **Áp dụng:** Hero và từng section phải có *câu chuyện* — camera bay có mục đích (tiến về phía trước = bắt đầu hành trình), không phải particle vô hồn.

### 3.2 Anime.js — "Documentation that plays"
- **DNA:** Dark mode + typography khổng lồ, **live demo nhúng trực tiếp** từng section, scroll-synced, code cards hiển thị cú pháp.
- **Áp dụng:** Playground/Lab + Skills hiển thị demo *chạy thật* người dùng bấm chơi được; type scale khổng lồ cho heading.

### 3.3 Mont-fort — "Premium corporate minimal"
- **DNA:** WebGL nền persistent, custom cursor nhiều lớp, **menu overlay fullscreen** với transition chiều sâu, chapter-based scroll, grid layout tạo cảm giác không gian.
- **Áp dụng:** Menu overlay fullscreen + view transition có depth; grid 24-cột tạo không gian; refinement tối giản — ít màu, nhiều khoảng trắng.

### Bảng tổng hợp bài học

| Website | DNA nổi bật | Áp dụng vào Stellar Odyssey |
|:---|:---|:---|
| Noomo | Cinematic 3D storytelling | Camera fly-through có kịch bản; 3D kể chuyện |
| Anime.js | Live demos + type lớn + dark | Live demos ở Playground/Skills; heading 8vw+ |
| Mont-fort | WebGL nền + menu overlay + custom cursor + grid không gian | MenuOverlay fullscreen + Cursor "VIEW" + grid 24 cột |

---

## 4. Design System

### 4.1 Color Palette — "Mono B&W" (dark primary, cập nhật 04/10/2026)

```
Background:
  --bg-void:        #050505  (deep black)
  --bg-nebula:      #0A0A0A  (nebula dark)
  --bg-surface:     #111111  (card surface)
  --bg-elevated:    #1A1A1A  (elevated card)

Text:
  --text-primary:   #FAFAFA  (white)      ← 90% text dùng màu này
  --text-secondary: #999999  (gray)
  --text-muted:     #555555  (dark gray)

Glow (CHỈ cho button/CTA):
  --glow-button:        0 0 30px rgba(255,255,255,0.35)
  --glow-button-strong: 0 0 50px rgba(255,255,255,0.55)
```

**Light mode (toggle, secondary):**
```
--bg-void: #FAFAFA | --bg-nebula: #F2F2F2 | --bg-surface: #FFFFFF
--text-primary: #111111 | --text-secondary: #666666
--glow-button: 0 0 20px rgba(0,0,0,0.25)  (giảm opacity trên nền sáng)
```

> Nguyên tắc màu (R3-Q2): **toàn bộ UI mono trắng-đen** — không accent màu, không gradient màu, không glow trên card. Glow trắng là đặc quyền duy nhất của button/CTA. 3D cũng mono: sao trắng, tinh vân xám, hố đen.

### 4.2 Typography

| Use | Font | Weight | Size Range |
|:---|:---|:---|:---|
| **Display / Headlines** | **Unbounded** | 600–900 | 4rem–12vw |
| **Body / Paragraphs** | **Space Grotesk** | 300–500 | 1rem–1.25rem |
| **Code / Labels** | **JetBrains Mono** | 400 | 0.875rem |

> **Tại sao Unbounded thay Syne? (R3-Q1)** Syne không hỗ trợ dấu tiếng Việt (ứa lỗi hiển thị "TRẦN VŨ ANH DUY") và bị kéo giãn bất thường trên trình duyệt. Unbounded hỗ trợ đầy đủ Vietnamese subset, dáng rộng futuristic đúng chất vũ trụ, cài qua `@fontsource-variable/unbounded`.

### 4.3 Motion Principles

- **Smooth scroll:** ScrollSmoother (GSAP Club — đã free)
- **Entrance:** Fade up + slide (`y: 40→0, opacity: 0→1`), stagger 0.1s
- **Text reveal:** SplitText char-by-char (tiêu đề), ScrambleText (tagline, số đếm)
- **Parallax:** Layers tốc độ khác nhau (0.3 / 0.5 / 0.8 / 1.0)
- **Scroll-linked 3D:** Camera position + particles phản ứng theo scroll progress
- **Hover:** Scale 1.05, glow, cursor magnetic, label "VIEW" trên cursor
- **Transition depth:** Menu overlay mở bằng clip-path/translateZ tạo chiều sâu (Mont-fort)
- **Easing:** `expo.out` (dramatic), `back.out(1.7)` (bouncy), `power3.out` (smooth)
- **Duration:** 0.8s–1.2s major, 0.3s–0.5s micro

---

## 5. Tech Stack

### 5.1 Core Stack (giữ nguyên từ masterplan)

| Layer | Công nghệ | Version | Vai trò |
|:---|:---|:---|:---|
| Framework | React | 19.2.0 | UI framework |
| Bundler | Vite | 7.2.4 | Build & dev server |
| Styling | Tailwind CSS | 4.x (upgrade) | Utility-first CSS |
| UI | Shadcn UI | 4.x | Reusable components |
| State | Zustand | latest | Global state (scroll, theme, lang) |
| Animation | GSAP + Club plugins | 3.15+ | **ScrollSmoother, ScrollTrigger, SplitText, ScrambleText, Flip** (tất cả đã free) |
| 3D | Three.js + R3F | 0.186 + 9.8 | 3D galaxy scene |
| 3D Helpers | @react-three/drei | 10.7 | 3D utilities |
| Post-processing | @react-three/postprocessing | 3.1 | Bloom, chromatic aberration |
| Icons | Lucide React | latest | Icon system |

### 5.2 Cài mới

| Package | Vai trò |
|:---|:---|
| `@fontsource-variable/unbounded` | Display font (thay Syne — hỗ trợ tiếng Việt) |
| `react-i18next` + `i18next` | Đa ngôn ngữ Vi/En (mặc định Vi) |
| `vite-plugin-pwa` | PWA support |
| `react-helmet-async` | SEO meta tags |
| `clsx` + `tailwind-merge` | Thay package `cn` |

### 5.3 Loại bỏ / Thay thế

| Loại bỏ | Lý do | Thay bằng |
|:---|:---|:---|
| `ogl` | Trùng Three.js, thêm bundle | Custom Three.js shaders |
| `cn` | Quá nhỏ | `clsx` + `tailwind-merge` |
| `@fontsource-variable/geist` | Không hợp theme | Unbounded + Space Grotesk |
| ~~Lenis~~ | *(bỏ phương án này)* GSAP Club giờ free → dùng **ScrollSmoother** chính chủ, sync hoàn hảo với ScrollTrigger |

### 5.4 Ghi chú GSAP Club
Từ 2025, toàn bộ GSAP Club plugins (ScrollSmoother, SplitText, ScrambleText, Flip, DrawSVG, MorphSVG...) **miễn phí 100%** — không cần license, không cần thay thế bằng Lenis hay tự viết split text.

---

## 6. Kiến trúc & Cấu trúc

### 6.1 Folder Structure

```
src/
├── 3d/                          # 3D Scene & Components
│   ├── GalaxyScene.jsx          # Persistent 3D canvas (fixed background)
│   ├── components/
│   │   ├── StarField.jsx        # 10,000+ particles
│   │   ├── Nebula.jsx           # Nebula shader clouds
│   │   ├── Planet.jsx           # Set piece — hành tinh theo section
│   │   ├── Wormhole.jsx         # Scroll transition ở Contact
│   │   ├── FloatingObjects.jsx  # Vật thể trôi nổi
│   │   ├── ShootingStars.jsx    # Sao băng random
│   │   └── CameraRig.jsx        # Camera gắn scroll progress
│   ├── shaders/                 # GLSL: nebula, stars, wormhole
│   └── hooks/
│       ├── useScrollProgress.js # Bridge scroll → 3D
│       └── useMediaQuery.js     # Responsive 3D quality
│
├── components/
│   ├── layout/
│   │   ├── Nav.jsx              # Glass navbar, auto-hide
│   │   ├── MenuOverlay.jsx      # ★ Menu fullscreen có chiều sâu (Mont-fort)
│   │   ├── Footer.jsx
│   │   └── ScrollProgress.jsx
│   ├── sections/
│   │   ├── Hero.jsx  About.jsx  Works.jsx  Skills.jsx
│   │   ├── Education.jsx  Experience.jsx  Playground.jsx  Contact.jsx
│   ├── ui/
│   │   ├── Button.jsx  Card.jsx  ThemeToggle.jsx
│   │   ├── LanguageSwitch.jsx  MagneticElement.jsx
│   ├── effects/
│   │   ├── Cursor.jsx           # ★ Custom cursor + label "VIEW"
│   │   ├── Preloader.jsx        # ★ Spinner điện ảnh kiểu Mont-fort
│   │   ├── Marquee.jsx  TextReveal.jsx  ImageReveal.jsx
│   │   ├── GlowCard.jsx
│   │   └── LiveDemo.jsx         # ★ Live interactive demo (kiểu Anime.js)
│   └── common/
│       ├── SectionHeading.jsx  AnimatedCounter.jsx
│
├── hooks/                       # useGSAPSetup, useTheme, useReducedMotion
├── i18n/                        # config.js + locales/vi.json + en.json
├── stores/                      # useScrollStore, useThemeStore, useLoadingStore
├── data/                        # portfolio.js, theme.js, navigation.js
├── styles/                      # globals.css, animations.css, fonts.css
├── lib/                         # utils.js (clsx+twMerge), constants.js
├── App.jsx  main.jsx
```

### 6.2 Kiến trúc chạy

```
main.jsx → App.jsx
  ├── Providers: ScrollSmoother (GSAP) + I18n + Theme
  ├── Global: Preloader → Nav + MenuOverlay + Cursor + ScrollProgress
  ├── 3D Layer: <Canvas position:fixed> → GalaxyScene
  │     ├── CameraRig (scroll-linked)
  │     ├── StarField + Nebula + Set pieces (Planet/Wormhole/Floating/Shooting)
  │     └── Post-processing (Bloom + Chromatic Aberration)
  ├── DOM Sections (8) ⇄ GSAP ScrollTrigger ⇄ Zustand ⇄ useFrame (3D)
  └── Footer
```

---

## 7. Chi tiết 8 Sections

### 7.1 🌌 Hero — "Gateway to the Galaxy" *(chất Noomo)*
- **Kịch bản camera:** Preloader xong → camera bay xuyên trường sao → tiến về phía **HỐ ĐEN** ở cuối hành trình (R3-Q3)
- **DOM:** Tên "TRẦN VŨ ANH DUY" (Unbounded, 12vw) trắng trên nền đen; tagline "Creative Designer" hiệu ứng ScrambleText; scroll indicator
- **Timeline:** 0s camera tiến → 0.5s sao blur → 1.2s camera dừng → 1.5s tên xuất hiện (SplitText, stagger 0.03s) → 2.0s tagline → 2.5s scroll indicator
- **Scroll:** cuộn xuống → camera zoom out, lộ ngân hà overview với hố đen ở xa

### 7.2 👤 About Me — "The Navigator"
- **Visual:** Floating platform, avatar với white glow border + orbital rings
- **Layout:** Split — trái avatar + 3D trang trí, phải bio reveal từng dòng + quote nổi bật
- **Motion:** Parallax layers + text reveal on scroll

### 7.3 💼 Selected Works — "Constellation of Projects"
- **Visual:** Mỗi project là một "ngôi sao" nối constellation lines; card có image + title + tags + mô tả
- **Projects:** 1. EDURA LMS (flagship, có link) · 2. VERIS APP — *"Case study coming soon"* · 3. VIE PERFUME — *"Case study coming soon"*
- **Interactions:** Filter buttons (All / Product / UX-UI / Graphic), hover → glow + image zoom + cursor hiện "VIEW"
- **Motion:** Cards xuất hiện từ depth (z-axis), stagger

### 7.4 🛠 Skills & Tools — "Arsenal Nebula"
- **Visual:** Skills như vệ tinh quay quanh core (orbital 3D)
- **DOM:** Skill cards (icon, tên, proficiency) + tool icons (Figma, PS, AI, AE, PR) với tooltip
- **Categories:** Design Tools | Soft Skills | Technical
- **★ Live demo:** 1 demo mini GSAP/shader người dùng tương tác được (kiểu Anime.js)

### 7.5 📚 Education — "Star Map"
- **Visual:** Timeline dọc như bản đồ sao, mỗi trường là ngôi sao nối constellation lines
- **Entries:** Saigon University, Arena Multimedia, Green Academy
- **Motion:** SVG path draw on scroll

### 7.6 💫 Experience — "Voyage Log"
- **Visual:** Flight log / captain's journal — mỗi kinh nghiệm là một "mission"
- **Entries:** Hosana Media, Upwork, Designveloper
- **Visual:** Mono card borders trắng-xám, status badges; cards slide từ 2 bên, stagger

### 7.7 🧪 Playground / Lab — "Space Station" *(chất Anime.js)*
- **Layout:** Grid 6-8 experiments (bento, tận dụng grid tạo cảm giác không gian kiểu Mont-fort)
- **★ 2-3 live interactive demos:** particle field, shader playground, scroll demo — bấm chơi ngay trong trang
- **Còn lại:** Thumbnail + hover preview, link CodePen/live demo
- **3D:** Vài mini experiment 3D nhỏ

### 7.8 📬 Contact — "Transmission"
- **DOM:** Headline lớn "LET'S CONNECT" (Unbounded, trắng); nút email magnetic + ScrambleText; social: **Email + LinkedIn + Behance + Facebook**; số điện thoại
- **3D:** Hố đen nền — camera tiến sát, đĩa bồi tụ trắng sáng dần; giữ nguyên hành vi Hero
- **Motion:** Timeline scrub Contact đồng bộ camera/đĩa bồi tụ/text reveal; magnetic cursor, glow pulse; reduced-motion tĩnh

---

## 8. Global Features

| Feature | Mô tả | Nguồn cảm hứng |
|:---|:---|:---|
| **Preloader** | Spinner gradient điện ảnh + tên hiện dần | Mont-fort |
| **MenuOverlay** | Fullscreen menu, transition clip-path + translateZ tạo chiều sâu, link có hiệu ứng 2 lớp text | Mont-fort |
| **Custom Cursor** | Vòng glow + dot, biến thành label "VIEW" khi hover project | Mont-fort |
| **LiveDemo** | Component nhúng demo tương tác thật vào section | Anime.js |
| **Marquee** | Dải chữ chạy vô hạn giữa các section | Awwwards |
| **ScrollSmoother** | Smooth scroll toàn trang (GSAP Club, free) | — |
| **Theme toggle** | Dark (mặc định) / Light | Masterplan |
| **i18n** | Mặc định **Vi**, toggle En | Q8 |
| **A11y** | prefers-reduced-motion, keyboard nav, ARIA | WCAG 2.1 AA |

---

## 9. Phân công AI Agent

| Agent | Vai trò | Nhiệm vụ chính |
|:---|:---|:---|
| **Antigravity (Gemini)** 🧠 | Architect & Lead Engineer | Kiến trúc, GLSL shaders, GalaxyScene + CameraRig, ScrollSmoother+ScrollTrigger sync, LiveDemo, post-processing, performance |
| **Codex (OpenAI)** ⚡ | Code Generator | Scaffold components, Tailwind styling, Zustand stores, i18n files, MenuOverlay/Cursor/Marquee DOM-heavy |
| **Claude (Anthropic)** 📝 | Reviewer & Writer | Code review, a11y audit, bio/copy Vi+En, SEO meta, documentation |
| **OpenCode** 🖥 | Terminal & DevOps | Dependencies, build, deploy Vercel, asset optimization, Lighthouse |

Cấu hình: `AGENTS.md` (Codex + OpenCode), `CLAUDE.md` (Claude), skill `tools/codex-skills/galaxy-portfolio/SKILL.md`.

---

## 10. Kế hoạch thực hiện (Phases)

> Trạng thái mặc định: **⬜ Chưa bắt đầu**. Cập nhật theo dõi trong file Excel `ke-hoach-stellar-odyssey.xlsx` (sheet Tasks).

### Phase 0: Pre-production — ✅ ĐÃ HOÀN THÀNH (04/10/2026)
> Mục tiêu: chuẩn bị đầy đủ trước khi code. Trạng thái chi tiết từng mục bên dưới.

| # | Task | Agent | P | Giờ | Deps | Trạng thái |
|:---|:---|:---|:---:|:---|:---|:---|
| 0.1 | Moodboard: Noomo / Anime.js / Mont-fort / Edolus + 10-15 refs Awwwards | Manual | P0 | 2h | — | ✅ `outputs/moodboard-stellar-odyssey.md` đã soạn — **còn chụp screenshot vào Figma (bạn)** |
| 0.2 | Test page color palette + type scale | Antigravity | P0 | 2h | 0.1 | ✅ `design-lab.html` — mở /design-lab.html |
| 0.3 | Content Vi+En: bio, projects, skills, experience, education | Claude | P0 | 4h | — | ✅ `outputs/content-vi.md` + `content-en.md` — **chờ bạn duyệt** |
| 0.4 | Assets: avatar, project covers WebP <300KB, favicon, PWA icons | OpenCode | P0 | 2h | 0.3 | ✅ avatar 110KB, project1 50KB, project2 61KB, project3 43KB, favicon.svg, pwa-192/512 |
| 0.5 | Git: branch `feature/stellar-odyssey` | OpenCode | P0 | 15m | — | ✅ đã tạo từ main |
| 0.6 | Dependencies: remove `ogl` `cn` `geist`; add Unbounded, i18next, PWA, clsx | OpenCode | P0 | 30m | 0.5 | ✅ đã cài/loại bỏ |
| 0.7 | Agent config: AGENTS.md, CLAUDE.md, galaxy-portfolio skill | Antigravity | P0 | 1h | — | ✅ 4 files đã tạo |
| 0.8 | Vite config: PWA plugin + GLSL imports + aliases | OpenCode | P1 | 1h | 0.6 | ✅ VitePWA + manifest + registerSW; GLSL dùng `?raw` |
| 0.9 | Tailwind v3 → v4 migration | OpenCode | P1 | 2h | 0.6 | ✅ v4.1 + @tailwindcss/postcss, build pass |
| 0.10 | 3D prototype lab: StarField 10k particles + Nebula + camera scroll + HỐ ĐEN | Antigravity | P0 | 4h | 0.6 | ✅ `3d-lab.html` viết lại: 10k sao mono, nebula xám, camera scroll-linked, **hố đen đĩa bồi tụ trắng** |
| 0.11 | Benchmark sơ bộ (target 60fps mid laptop) | OpenCode | P1 | 1h | 0.10 | ✅ **165fps ổn định** trên máy dev — vượt target |

### Phase 1: Foundation
> Mục tiêu: design system + bộ khung 3D chạy được

| # | Task | Agent | P | Giờ | Deps |
|:---|:---|:---|:---:|:---|:---|
| 1.1 | Design System CSS: màu mono, Unbounded/Space Grotesk/JetBrains Mono, globals.css | Antigravity | P0 | 2h | Phase 0 |
| 1.2 | GSAP setup: ScrollSmoother + ScrollTrigger + SplitText + ScrambleText | Antigravity | P0 | 2h | 0.6 |
| 1.3 | Zustand stores: scroll, theme, lang, loading | Codex | P1 | 1h | Phase 0 |
| 1.4 | i18n setup + vi.json / en.json skeleton | Codex | P1 | 2h | 1.3 |
| 1.5 | GalaxyScene.jsx — canvas R3F persistent | Antigravity | P0 | 3h | 1.2 |
| 1.6 | StarField + Nebula production | Antigravity | P0 | 4h | 1.5 |
| 1.7 | CameraRig scroll-linked | Antigravity | P1 | 2h | 1.5, 1.2 |
| 1.8 | Post-processing: Bloom + Chromatic Aberration | Antigravity | P1 | 2h | 1.5 |
| 1.9 | Theme toggle dark/light | Codex | P2 | 1h | 1.1, 1.3 |
| 1.10 | Review Phase 1 | Claude | P1 | 2h | 1.1–1.9 |

### Phase 2: Core Sections
> Mục tiêu: đủ 8 sections + global features, layout và animation cơ bản

| # | Task | Agent | P | Giờ | Deps |
|:---|:---|:---|:---:|:---|:---|
| 2.1 | Preloader spinner điện ảnh (Mont-fort style) | Antigravity | P0 | 3h | 1.1 |
| 2.2 | MenuOverlay fullscreen + transition chiều sâu | Antigravity | P0 | 4h | 1.7 |
| 2.3 | Nav glassmorphism auto-hide | Codex | P0 | 2h | 1.1 |
| 2.4 | Custom cursor (VIEW label + magnetic) | Codex | P0 | 2h | 1.1 |
| 2.5 | Hero: galaxy entrance + tên + scramble tagline | Antigravity | P0 | 4h | 1.5 |
| 2.6 | About: split layout + avatar white border | Codex | P0 | 3h | 1.2 |
| 2.7 | Selected Works: constellation cards + filters + coming soon | Antigravity | P0 | 4h | 1.2 |
| 2.8 | Skills & Tools: orbital layout | Antigravity | P1 | 3h | 1.5 |
| 2.9 | Education timeline (star map) | Codex | P1 | 2h | 1.2 |
| 2.10 | Experience timeline (voyage log) | Codex | P1 | 2h | 1.2 |
| 2.11 | Playground: grid + slots live demos | Codex | P2 | 3h | 1.1 |
| 2.12 | Contact: transmission + 4 kênh social | Codex | P1 | 2h | 1.1 |
| 2.13 | Marquee tickers | Codex | P2 | 1h | 1.2 |
| 2.14 | i18n: hoàn thiện Vi/En | Claude | P1 | 3h | 2.5–2.12 |
| 2.15 | Review Phase 2 | Claude | P1 | 3h | 2.1–2.14 |

### Phase 3: 3D & Motion Integration
> Mục tiêu: 3D set pieces + motion design đầy đủ

| # | Task | Agent | P | Giờ | Deps |
|:---|:---|:---|:---:|:---|:---|
| 3.1 | Set pieces: Planet / orbital rings / wormhole theo section | Antigravity | P0 | 4h | Phase 2 |
| 3.2 | Wormhole scroll transition (Contact) | Antigravity | P1 | 4h | 3.1, 1.7 |
| 3.3 | ShootingStars random | Antigravity | P2 | 2h | 3.1 |
| 3.4 | FloatingObjects | Antigravity | P2 | 2h | 3.1 |
| 3.5 | LiveDemo: 2-3 demo tương tác (particles, shader, scroll) | Antigravity | P0 | 5h | Phase 2 |
| 3.6 | ScrollTrigger timelines toàn bộ sections | Antigravity | P0 | 6h | Phase 2 |
| 3.7 | SplitText + ScrambleText reveals | Antigravity | P1 | 2h | 3.6 |
| 3.8 | Image reveal clip-path | Codex | P1 | 2h | 3.6 |
| 3.9 | Hover interactions (magnetic, scale, glow) | Codex | P1 | 2h | 2.4 |
| 3.10 | Parallax layers | Antigravity | P1 | 2h | 3.6 |
| 3.11 | Sync 3D ↔ DOM fine-tune | Antigravity | P0 | 3h | 3.1, 3.6 |
| 3.12 | Mobile 3D fallback tiers | Antigravity | P0 | 3h | 3.1 |
| 3.13 | Review Phase 3 | Claude | P1 | 3h | 3.1–3.12 |

### Phase 4: Polish & Optimization
> Mục tiêu: production-ready (hiệu năng vẫn phải đạt chuẩn dù 3D full)

| # | Task | Agent | P | Giờ | Deps |
|:---|:---|:---|:---:|:---|:---|
| 4.1 | Responsive 320px → 1920px | Codex + Antigravity | P0 | 6h | Phase 3 |
| 4.2 | 3D quality tiers (high/medium/low) | Antigravity | P0 | 3h | 3.12 |
| 4.3 | prefers-reduced-motion | Claude | P0 | 2h | Phase 3 |
| 4.4 | Keyboard nav & focus management | Claude | P0 | 3h | Phase 2 |
| 4.5 | ARIA labels & screen reader test | Claude | P0 | 2h | 4.4 |
| 4.6 | SEO: meta, Open Graph, structured data | Codex | P1 | 2h | Phase 2 |
| 4.7 | PWA: service worker, manifest, icons | OpenCode | P1 | 2h | 4.6 |
| 4.8 | Image optimization WebP + lazy loading | OpenCode | P0 | 2h | Phase 2 |
| 4.9 | Code splitting + lazy loading (React.lazy) | Antigravity | P1 | 2h | Phase 3 |
| 4.10 | Bundle analysis & tree shaking | OpenCode | P1 | 1h | 4.9 |
| 4.11 | Lighthouse audit (target 90+) | OpenCode | P0 | 2h | 4.1–4.10 |
| 4.12 | Cross-browser (Chrome/Firefox/Safari/Edge) | Claude | P1 | 2h | Phase 3 |
| 4.13 | Easing & timing polish | Antigravity | P1 | 3h | Phase 3 |
| 4.14 | Visual QA pixel-perfect | Claude | P1 | 2h | 4.1 |
| 4.15 | Dark/Light full test | Claude | P1 | 1h | 1.9 |
| 4.16 | i18n proofread Vi/En | Claude | P1 | 2h | 2.14 |

### Phase 5: Launch
> Mục tiêu: deploy & monitor

| # | Task | Agent | P | Giờ | Deps |
|:---|:---|:---|:---:|:---|:---|
| 5.1 | Final build test | OpenCode | P0 | 30m | Phase 4 |
| 5.2 | Vercel deployment | OpenCode | P0 | 1h | 5.1 |
| 5.3 | Vercel Analytics | OpenCode | P1 | 15m | 5.2 |
| 5.4 | Smoke test production | Claude | P0 | 1h | 5.2 |
| 5.5 | README + documentation | Claude | P1 | 2h | Phase 4 |
| 5.6 | Submit Awwwards (optional) | Manual | P2 | 1h | 5.4 |
| 5.7 | Social announcement | Manual | P2 | 30m | 5.4 |

**Tổng ước lượng: ~145 giờ**

---

## 11. Verification Plan

| Check | Target | Cách kiểm tra |
|:---|:---|:---|
| 3D fps | 60fps mid-range laptop (mặc dù 3D full) | DevTools → Performance |
| Smooth scroll | Không jitter | Manual + screen record |
| Responsive | 320px → 1920px+ | DevTools device toolbar |
| Dark/Light | Cả 2 đẹp | Toggle test |
| i18n | Vi (mặc định) + En đầy đủ | Switch test |
| a11y | Screen reader + keyboard OK | NVDA/VoiceOver + tab-through |
| reduced-motion | Tôn trọng OS setting | OS setting + verify |
| PWA | Installable, offline cache | Chrome → Application |
| Cross-browser | Chrome, Firefox, Safari, Edge | Test từng trình |
| Lighthouse | 90+ mọi hạng mục | Lighthouse audit |
| Load time | FCP < 3s | Lighthouse + WebPageTest |

**Awwwards checklist:** wow factor lần đầu · creativity không template-like · content song ngữ · usability · WCAG 2.1 AA · performance · mobile với 3D fallback · code sạch.

---

## 12. Việc còn bỏ ngỏ

- [ ] Link Behance/live demo cho **VERIS APP** và **VIE PERFUME** (hiện để "Case study coming soon")
- [ ] Ảnh `project2.jpg` 11.5MB → optimize WebP < 300KB
- [ ] Email + số điện thoại + URL chính xác của 4 kênh liên hệ (Email, LinkedIn, Behance, Facebook)
- [ ] Nội dung bio, experience, education Vi+En (Claude sẽ soạn — cần bạn duyệt)
- [ ] Domain riêng (mua sau khi ra mắt bản `*.vercel.app`)
- [ ] Danh sách 6-8 experiments cho Playground (đề xuất: particle field, shader aurora, magnetic buttons, scroll progress, text scramble, grid hover, wormhole shader, marquee)

---

*File này đi kèm file Excel `ke-hoach-stellar-odyssey.xlsx` — phiên bản bảng tính của cùng kế hoạch, có cột Trạng thái để theo dõi tiến độ.*
