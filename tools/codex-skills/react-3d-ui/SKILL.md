---
name: react-3d-ui
description: Build interactive 3D website UI with Three.js and React Three Fiber, glTF assets, shaders, GSAP motion and accessible fallbacks. Use for React web scenes and cinematic portfolios; ordinary DOM depth effects can use CSS.
---

# React 3D UI

Preserve the chosen art direction and content. Establish camera, silhouette,
material and lighting before adding particles, postprocessing or navigation.

## Stack and ownership

- Inspect package.json, lockfile, routing, React version and animation libraries.
  Reuse installed dependencies; don't replace the build system.
- Fiber 9 pairs with React 19; Fiber 8 with React 18. Verify current npm peers
  before upgrading. Start with `three` and `@react-three/fiber`; Drei supplies
  OrbitControls, useGLTF, Html and other helpers. Import only what is used.
- Add React postprocessing and its compatible core peer when bloom/outline/DOF is
  needed. Check the Three.js upper bound too. Don't run two composers per scene.
- `@types/three` is a dev dependency for TypeScript or editor support. Don't
  convert a JavaScript project solely to add a scene. Physics, WebGPU and external
  editors are conditional choices; ordinary tilt/parallax can use CSS or GSAP.
- Canvas needs a container with dimensions. Fiber hooks belong under Canvas;
  accessible navigation and content remain in the DOM. Lazy-load the scene.
  For SSR frameworks, keep WebGL/window/document in a client boundary.
- Use licensed local GLB/glTF assets with poster/loading states and an error
  boundary. Canvas fallback alone doesn't catch all renderer failures.
- Loader caches are shared: clone before mutating a cached hierarchy/material.
  Don't dispose shared assets while another scene uses them. Configure Draco,
  Meshopt or KTX2 only when needed; self-host matching decoders for offline use.
- Check current color-management docs. Color textures use sRGB; normal and
  roughness maps are data. Don't add manual color conversions without evidence.

## Motion and interaction

- In useFrame, mutate refs with delta-based motion; don't set React state every
  frame or allocate vectors/materials in the loop. One owner per animated property.
- Reuse GSAP/useGSAP for authored timelines. Animate Three properties directly,
  clean up tweens/ScrollTriggers, and call Fiber `invalidate` from onUpdate when
  using `frameloop="demand"`.
- Provide readable DOM buttons/links and keyboard equivalents for hotspots.
  Give alternatives to dragging. Preserve browser back, native scrolling, direct
  case-study URLs and CV/contact access; don't gate content behind puzzles.
- Honor prefers-reduced-motion and offer pause/reduced effects for ambient motion.
  Pause continuous rendering when hidden and preserve a static view.

## Budget and checks

- Start with modest DPR, geometry resolution, lights/shadows and effect resolution;
  profile representative mobile hardware. Don't promise FPS without measurements.
- Use demand rendering for idle scenes and continuous rendering while moving.
  Reuse resources; instance repeated meshes. Transmission, realtime reflections,
  volumetrics and stacked full-screen passes need an actual device budget.
- Validate peers and build the entry that imports the scene. Check console,
  rendered frames, resize, keyboard, pause/reduced motion, load errors and no-WebGL
  fallback. Dispose manually owned resources/listeners on unmount.
- Report pre-existing errors separately; don't conceal them by disabling rules.

## Maintained references

Read the APIs relevant to the task and check against installed versions:

- [Fiber installation](https://r3f.docs.pmnd.rs/getting-started/installation)
- [Canvas and fallback](https://r3f.docs.pmnd.rs/api/canvas)
- [Fiber performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [Drei useGLTF](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf)
- [React postprocessing](https://react-postprocessing.docs.pmnd.rs/introduction)
- [Three.js documentation](https://threejs.org/docs/)
- [GSAP React cleanup](https://gsap.com/resources/React/)
- [glTF Transform CLI](https://gltf-transform.dev/cli)

Community `threejs-*` skills are reference examples. Check deprecated APIs,
imports and old decoder/CDN versions against the installed Three.js release.
