---
name: galaxy-portfolio
description: Galaxy-themed portfolio specific guidelines for Stellar Odyssey — design tokens, 3D scene architecture, animation patterns and i18n rules.
---

# Galaxy Portfolio Skill (Stellar Odyssey)

## Concept
"Stellar Odyssey" — vũ trụ bí ẩn pha premium cinematic. Dark mode là PRIMARY.
Tham chiếu: Noomo (cinematic 3D), Anime.js (live demos + type lớn), Mont-fort (menu overlay + custom cursor + grid không gian).

## Design Tokens
- Dùng CSS custom properties định nghĩa trong globals.css.
- Dark mode là PRIMARY, light mode là secondary.
- **PALETTE MONO TRẮNG-ĐEN** (cập nhật 04/10/2026 — bỏ purple/cyan):
  - Nền: `--bg-void #050505` · `--bg-nebula #0A0A0A` · `--bg-surface #111111` · `--bg-elevated #1A1A1A`
  - Text: `--text-primary #FAFAFA` (90% text) · `--text-secondary #999999` · `--text-muted #555555`
  - KHÔNG có accent màu. Glow trắng `0 0 30px rgba(255,255,255,0.35)` — **CHỈ dùng cho button/CTA**
- Nguyên tắc: toàn bộ UI mono đen-trắng; glow là đặc quyền của button. 3D cũng mono (sao trắng, tinh vân xám, hố đen).

## Typography
- Display: **Unbounded** 600–900 (4rem–12vw) — import `@fontsource-variable/unbounded`
- Body: **Space Grotesk** 300–500 (1rem–1.25rem)
- Code/Label: **JetBrains Mono** 400 (0.875rem)
- KHÔNG dùng Syne (lỗi tiếng Việt), KHÔNG dùng Orbitron, KHÔNG dùng Geist Variable.

## 3D Architecture
- Tất cả code 3D nằm trong `src/3d/`.
- 1 Canvas R3F persistent `position: fixed` làm nền, DOM scroll phía trên.
- GalaxyScene gồm: StarField (10k particles) + Nebula (shader) + CameraRig (scroll-linked) + set pieces theo section + post-processing (Bloom + Chromatic Aberration).
- Dùng `useFrame` cho animation, KHÔNG dùng setInterval.
- Shader import bằng suffix `?raw` của Vite.
- Mobile: quality tiers (high/medium/low) — giảm particle count và tắt post-processing.
- Luôn có fallback cho no-WebGL (SceneBoundary + ErrorBoundary).

## Animation Pattern
- Smooth scroll: ScrollSmoother (GSAP Club — free), wrapper `#smooth-wrapper` / content `#smooth-content`.
- Entrance: `gsap.from({ y: 40, opacity: 0 })` stagger 0.1s.
- Text: SplitText char/line + ScrambleText cho tagline & số.
- Scroll: ScrollTrigger với scrub cho hiệu ứng liên kết.
- Hover: `gsap.to` duration 0.3 + cursor label "VIEW".
- Easing: `expo.out`, `power3.out`, `back.out(1.7)`.
- Tôn trọng `prefers-reduced-motion`.

## i18n
- react-i18next, mặc định **vi**, toggle sang **en**.
- Mọi text phải dùng translation keys từ `src/i18n/locales/`.

## Rules chung
- JSX (không TSX). Functional components + hooks.
- Tailwind CSS 4 cho styling, không inline styles.
- Zustand cho global state (scroll, theme, lang, loading), không React Context.
- Import alias `@/`.
- Xử lý prefers-reduced-motion mọi animation.
