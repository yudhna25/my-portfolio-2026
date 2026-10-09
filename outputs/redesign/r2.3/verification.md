# R2.3 — Works orbit / handoff verification

08/10/2026 · **✅ Prototype và contract bàn giao xong.** Chỉ thực hiện R2.3 sau R2.2. Chưa preview ảnh/reader/route production, chưa finale collision/trail/nebula. `App.jsx`, camera path, CameraRig, portal/shader/HDR và assets public giữ nguyên.

## Thay đổi

- Shared `src/3d/components/WorksConstellations.jsx`, data subset và `utils/worksOrbit.js`; `GalaxyScene` mount primitive chỉ khi `story=true`. Một Canvas/camera writer vẫn giữ nguyên.
- Ba chòm từ R0.2: EDURA/Centaurus17sao16cạnh, VERIS/Gemini17/16, VIE/Cygnus10/9. 44 sao tạo hình/41 cạnh +36 sao vùng phụ=80 điểm. Uniform scale/gnomonic/north-up/west-right giữ nguyên; điểm trắng sáng, cạnh phụ mờ0.13. Supporting không có cạnh mới.
- Orbit staged đều0.075rad/s, delta integration exponential6/s, dt≤0.05; dịch tâm trên ellipse và giữ figure orientation. Không astronomy simulation/random/physics. Basis cố định theo Works pose/aspect; không parent vào live camera.
- Store selection/hover/focus riêng; OR pause cả hệ, selected highlight. Object frame data giữ identity; chỉ discrete IDs subscribe React, không setState mỗi frame.
- Producer chốt origin đúng một lần từ phase vừa hiển thị khi finale p>0/Contact; reverse/finale0 không recapture. Canonical Works mới release, bỏ integration frame đầu để trả pha liên tục; deep Contact dùng pha0/seed20261007.
- Lab có selector fixed ngoài smoother, targets≥44px, Vi/En, keyboard/touch/clear/ARIA. Esc và nền chuyển focus sang group rồi clear; touch tap-again resume, pointerleave/blur không xóa selection. Đây là mẫu selector, chưa phải preview UI.
- Sửa root cause manual Resume trong bridge R2.1: proxy seek có thể để scrub playhead giữ visibleY dù nativeY đã tiến; reinit animation cùng ScrollSmoother owner một lần trước khi mở producer. Giữ smooth1.2; không thêm camera/controller. Regression sau refresh/resize/locale pass.

## Lệnh / kết quả

```powershell
npm run dev
node outputs/redesign/r2.3/check-orbit.mjs
node outputs/redesign/r2.3/verify-browser.mjs
npm run build
npm run lint
```

Dev sẵn có tại `127.0.0.1:5173`, HTTP200. Build Vite7.3.6 pass4.81s, PWA29 entries; warning chunk>500KB cũ. Scoped eslint 7 file sửa pass. Full lint:0errors/2warnings `SplashCursor.jsx` cũ (unsupported inline class), không tắt rule. Không dependency mới hoặc thay package/config.

### Self-check — 356 assertions PASS

[check-orbit.mjs](check-orbit.mjs) dùng Node assert, utility + store thật (harness đổi alias thành file URLs, không sửa source). [check-results.json](check-results.json):

- Subset/source deepEqual, graph không dangling edges; recompute gnomonic max sai số4.961×10⁻¹⁰. Source SHA256 `1047432e95bcea8105c521801fee19ff81f2dce92ccf1f1cdfd682f56cfe1c9f`, attribution và5sourceIDs đủ.
- Idle→hover→unhover+scroll cùng lượt: origin bằng phase hiển thị cuối, không advance chen giữa.
- Finale `.2→.8→.1→0→.7`, lặp producer write: origin/capture count giữ nguyên; release Works và frame đầu đúng returned origin.
- Deep jump Contact/finale, default seed/phase; OR ownership và ID/channel validation; frozen/offscreen guards.
- Tích phân60/165Hz: sai khác phase1.11×10⁻¹⁶rad, velocity1.39×10⁻¹⁷. Terminal pause snap sai khác8.65×10⁻⁸rad trong bound đã kiểm.

### Browser — 52 trạng thái PASS

[browser-results.json](browser-results.json) + [trace.zip](trace.zip), Edge154 headless/Playwright runtime đã cài, GPU ANGLE/NVIDIA GeForce RTX4060/D3D11. Browser plugin không chạy do kernel MXC lỗi volumeG:\/error87; dùng Edge fallback, không cài plugin/dependency mới.

| Kiểm | Bằng chứng / kết quả |
|---|---|
| Idle / pause / resume | Phase tăng khi idle; hover settle velocity0, selected strength1/others0.35. DOM button rect giữ nguyên. Rapid đổi6targets không reset phase. |
| Handoff race / reverse | Unhover và set finale ngay trong một JS lượt: origin=last displayed phase;10pose tới/lùi gồm finale0 giữ captures/origin và group positions tại cùng p. |
| Native scroll | Works.95 → finale.10617 → Works.95013, capture count2 giữ trong lượt; release khi thật sự về Works. Pose error<1e-9,1writer. |
| Keyboard | Focus dừng, Enter chọn, Escape clear và activeElement là group; nền clear/blur đúng. Không focus trap. |
| Touch thật của browser | Context hasTouch ở390px: tap VIE chọn, tap lại bỏ chọn/Focusnull/velocity>0; không route/link giả. |
| Live / fresh reduced | Live preference không reset phase; hai samples giữ phase. Fresh reduced phase0; touch chọn vẫn đổi strength sau render; ScrollSmoother không tồn tại. |
| Hidden / offscreen | Hidden mô phỏng Canvas never: phase0.23203108205287618 giữ chính xác giữa hai samples600ms; visible không bù elapsed. Offscreen About giữ phase qua500ms. |
| Resize / Vi-En | 320/390/768/1024/1440px, portrait900/844high;1Canvas/0pxoverflow, geometry bounds nằm trongviewport, targets≥44px; figure quaternionlocal identity/scalesuniform. |
| Deep Contact | Fresh direct URL chưaWorks: origin0, visitedfalse, captures1; reverse vào finale giữ origin0. |
|3lifecycle | Story off/on: primitive mất/được mount đúng; mỗi lượt dispose6geometry+6material, captures/origin giữ. Restored memory12geometry/23texture và9subscribers ổn định. |
| Context loss | Giả lập WEBGL_lose_context: Canvas bị thay fallback; DOM còn3choice và group hiển thị. Không làm mất thông tin/chọn. |

Không có console/runtime/WebGL error trong phiên cuối. `THREE.Clock` warning cũ. Một warning `WEBGL_lose_context extension not supported` xuất hiện lúc renderer teardown sau khi chính harness đã ép mất context; ghi nguyên ở JSON, không gặp trong lượt thông thường.

### FPS / resources

Đếm `addAfterEffect` sau render trong cửa sổ≈1.8s; viewport/browser thật trên máy Windows RTX4060 high-refresh, DPR1. Các phép đo có trace capture ở desktop nên gồm overhead harness. Không suy ra tốc độ điện thoại thật từ viewport.

| Pose / thao tác | Frames / ms | FPS | Quality | Renderer memory |
|---|---|---:|---|---|
|1440×900 idle |297/1801.6 |164.85 |high24k |12geometry/23texture |
|1440×900 rapid hover |298/1804.5 |165.14 |high24k |12geometry/23texture |
|390×844 touch/idle |298/1804.4 |165.15 |low1500 |10geometry/1texture |

Primitive mới có6drawables/6geometry/6materials,0texture. Renderer memory gồm cả pipeline HDR/composer/LUT có sẵn; không gọi đó là tài nguyên chỉ của orbit. `gl.info.render.calls` ở cuối composer pass có reset nên không dùng giá trị1 trong JSON như tổng draw calls toànframe. Không có object/vector/material allocation trong callback orbit; các geometry/basis được tạo ngoài frame và dispose có đo.

### Resume regression / App bảo toàn

[resume-results.json](resume-results.json):3native lượt sau Resume→ScrollTrigger.refresh / resize1024 / localeEn. Cả3vào finale p≈.111112; native7875 vs visible7875.001575 (lệch0.001575px),0error. App smoke riêng:1Canvas/1camera writer, không có works prototype;7sections `hero/about/skills/education/experience/work/transmission`,0overflow/GLerror, preloader hoàn tất.

## Ảnh render và bàn giao

- [Desktop idle](screenshots/desktop-idle.png), [hover](screenshots/desktop-hover.png), [handoff origin](screenshots/desktop-handoff-0.png), [finale mid chỉ camera](screenshots/desktop-handoff-0.5.png).
- [Mobile idle](screenshots/mobile-idle.png), [touch](screenshots/mobile-touch.png), [fresh reduced](screenshots/mobile-reduced.png). Ảnh từ renderer thật, không dùng storyboard để chứng minh chuyển động.
- [contract.md](contract.md) là bàn giao selection/orbit/finale cho R2.4 và primitive/data cho R5.2. Finale renderer chưa có; R2.4 phải dùng origin+seed+progress, không lấy elapsed time hoặc chốt lại khi wheel đổi chiều. R5.2 dùng primitive này và thay selector mẫu bằng DOM/preview thật, vẫn fixed hit targets.
- [baseline.json](baseline.json)/[integrity.json](integrity.json): trước append AGENTS,89/96file giữ hash,7file có phép sửa;3shared source file mới. Sau append:88/96giữ hash,8thay đổi có phép gồm AGENTS; exact byte prefix của AGENTS giữ nguyên và chỉ1dòng R2.3. App/cameraPath/CameraRig/portal/HDR/StarField/3d-lab.html/public/package/config giữ nguyên; src/3d-lab.jsx được sửa trong phạm vi.

## Giới hạn

Viewport/touch/reduced preference/hidden/context-loss đều mô phỏng trong Edge; chưa đo nhiệt/FPS điện thoại thật hoặc toggleOS ở task này. Idle là ambient thời gian, không so screenshot idle như trạng thái progress xác định; chỉ so nhóm geometry/phase sau latch. Chưa case study route, preview, production Works hoặc explosion; các phần đó thuộc task kế tiếp, chưa triển khai.

API đối chiếu phiên bản đang cài: Fiber9.8.1/React19.2/Three0.186.1/GSAP3.15; callback frame và negative priority theo [Fiber hooks](https://r3f.docs.pmnd.rs/api/hooks), điểm shader dùng hệ point primitives theo [Three PointsMaterial](https://threejs.org/docs/pages/PointsMaterial.html). Không dùng API cũ từ ví dụ cộng đồng để thay camera hoặc renderer.
