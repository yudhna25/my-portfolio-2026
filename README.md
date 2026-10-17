# Stellar Odyssey

A cinematic, galaxy-themed personal portfolio. Built as a React single-page app with a persistent 3D scene, scroll-driven motion and full Vietnamese / English content.

## Tech stack

- **UI:** React 19 + Vite 7, Tailwind CSS 4
- **3D:** React Three Fiber, drei, postprocessing and custom GLSL shaders, with quality tiers in `src/3d/quality.js`
- **Motion:** GSAP + ScrollSmoother (`@gsap/react`)
- **State:** Zustand stores in `src/stores/`
- **i18n:** i18next. Vietnamese is the default and English is the fallback. Locales live in `src/i18n/locales/`
- **SEO:** react-helmet-async

## Getting started

```bash
npm install
npm run dev
```

| Script            | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR |
| `npm run build`   | Production build to `dist/`        |
| `npm run preview` | Serve the production build locally |
| `npm run lint`    | Run ESLint                         |

## Project structure

```
src/
  3d/          R3F galaxy scene, shaders, quality tiers
  components/  Page sections, layout, effects, UI primitives
  data/        Navigation, skills and education content
  hooks/       GSAP setup, smooth scroll, reduced-motion
  i18n/        i18next config and vi/en locales
  stores/      Zustand stores (language, theme, audio, scroll…)
tools/         QA scripts (i18n parity, SEO metadata, CLS checks)
docs/          Planning and design notes
```

## Quality checks

```bash
node tools/check-i18n-parity.mjs
```

This script checks that every Vietnamese key has a matching English key. The other scripts in `tools/` cover SEO metadata, image CLS and visual QA.

## Deployment

The site deploys to Vercel. `vercel.json` rewrites `/projects/edura` to the SPA entry so that deep links resolve.
