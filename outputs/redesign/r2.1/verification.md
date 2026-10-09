# R2.1 — Progress / camera foundation trong lab

Ngày 08/10/2026. **✅ Xong trong phạm vi R2.1.** Chưa triển khai portal, Works orbit, finale hoặc redesign section production. Handoff R2.2: đọc [contract.md](./contract.md) và dùng `3d-lab.html?story=1`.

## Thay đổi và phạm vi

- Tái dùng `useLabScroll → useScrollProgress`, `useSmoothScroll`, `useScrollStore`, `cameraPath`, `GalaxyScene` và `CameraRig`. Lab bật nhánh story riêng; App giữ mặc định `story=false`.
- Thêm chapter/local progress theo DOM, visible ScrollSmoother position, đo lại font/locale/resize; manual seek sync scroll trước khi giữ, pause producer, resume về pose đã giữ. Không hardcode phần trăm tổng trang.
- CameraRig duy nhất ghi scene camera; story position/target trực tiếp từ progress, không damping riêng theo delta; output pose reuse, parallax 0. Legacy cameraPath và production branch giữ nguyên.
- Controls native select/range/buttons Vi/En: jump chương, 5 mốc pose, tua ngược, giữ/tiếp tục; URL direct jump Contact/Portal. Controls phụ trong details để canvas còn vùng xem ở 320px. Diagnostic DOM đọc camera/store, không React setState mỗi frame.
- 10 file source/shared thay đổi hợp lệ trong baseline 92 file, 82 file giữ SHA256: App/sections, public, dependencies/config và renderer HDR/shader không sửa. HEAD và tracked working tree giữ nguyên. Chi tiết [integrity.json](./integrity.json), [baseline.json](./baseline.json). Bản source trước thay đổi nằm trong `before/`.

## Lệnh và kết quả thật

| Kiểm tra | Kết quả |
|---|---|
| `npm run build` | Exit 0, Vite 5.33s; PWA 29 precache entries, sw.js/manifest sinh bình thường; [build.log](./build.log) |
| `npx eslint src/3d-lab.jsx src/3d/hooks/useLabScroll.js src/3d/hooks/useScrollProgress.js src/3d/components/CameraRig.jsx src/3d/components/LabTelemetry.jsx src/3d/utils/cameraPath.js src/3d/GalaxyScene.jsx src/stores/useScrollStore.js` | Exit 0, 0 scoped error/warning; [scoped-lint.log](./scoped-lint.log) |
| `node outputs/redesign/r2.1/check-path.mjs` | 181,030 assertions / 18,018 numeric pose samples pass; [check-path-results.json](./check-path-results.json) |
| `node outputs/redesign/r2.1/verify-browser.mjs` | Exit 0; 49 pose/interaction records + 298 rendered scroll samples; [browser-results.json](./browser-results.json) |
| Locale parity / baseline SHA256 | 66 lab string keys/locale, parity pass; 10 allowed changes, 82 unchanged; original HEAD `69ca97dcda6c9cbf3907ec5366b5b4e0247663bb` |

Self-check kiểm legacy 0/.25/.5/.75/1, output object identity, clamp/nonfinite/reverse, DOM segment, tất cả boundary và endpoint reduced. Minimum observer radius **8.182909 > 1.01**; horizon r=1, BH center `[0,0,-200]`. Dùng Three.js đã cài để project center + 128 điểm vành r14 tại 320/390/1440: Works center NDC x≈−2.60, điểm đĩa ngoài cùng vẫn x<−1. Không library/test framework mới. Read-only review [flow-review.md](./flow-review.md).

## Browser evidence

Plugin Browser/Chrome DevTools không khởi chạy được vì máy thiếu Chrome. Dùng **Edge 154.0.4258.62, Playwright bundled**, profile headless riêng, Vite dev 127.0.0.1:5173. Không cài browser/dependency hay đổi global browser setting.

- Hero / portal / About / Works / Contact; portal và finale mốc 0/.25/.5/.75/1 tới và ngược: camera ở cùng progress khớp tuyệt đối. Max position error **0**, max direction error **3.33e−16**.
- Manual wheel/pointer không đổi pose; Resume sync về pose đã giữ. Native wheel + smoother settling được lấy mẫu sau render: 298 frame, max raw progress error **0**, max camera pose error **0**; có frame nativeY khác visibleY nên chứng minh bridge đọc visible position.
- Resize 1440×900 → 390×844 → 320×844 → 1440×900, đổi Vi/En và fonts.ready: giữ chapter/p đã chọn, raw scroll đo lại đúng. **Overflow 0px** ở các pose kiểm.
- Live reduced-motion on/off và fresh reduced direct Portal: pose endpoint của chapter đang chọn, camera finite; không cần đi qua Works. Fresh direct Contact `p=.75` được áp dụng đúng.
- 3 vòng legacy↔story: **1 Canvas, 1 writer priority−1**, 8 Fiber subscribers và 0 ScrollTriggers ổn định tại cùng portal pose; hook cleanup được đối chiếu source. StrictMode mount/cleanup và fresh navigation cũng được kiểm.
- Smoke App mặc định Hero camera `(0,2.2,-168)`; Contact vẫn kết thúc gần `(−3.5,.18,−193)`, contactProgress=1, storyManual=false. App không bật story; 1 Canvas, 0 error.
- **0 console/runtime/WebGL error mới**. Warning cũ `THREE.Clock` còn; warning chunk >500KB trong build giữ riêng.

Ảnh thật đã mở xem: [Hero](./screenshots/hero.png), [portal](./screenshots/portal.png), [About](./screenshots/about.png), [Works](./screenshots/works.png), [Contact](./screenshots/contact.png), [390px](./screenshots/finale-390.png), [320px](./screenshots/finale-320.png). Đây là **scene cũ và controls foundation**, không phải ảnh chứng nhận redesign/portal/finale hoàn thành. Vector chòm sao/nebula cũ vẫn có trong lab; R2.1 không gỡ chúng.

## Giới hạn và bàn giao

- Viewport mobile và reduced-motion là mô phỏng; chưa thiết bị thật/OS toggle. FPS diagnostic ảnh khoảng 165 trên PC tham chiếu chỉ cho scene foundation hiện tại; không chứng minh chi phí portal/finale hay hiệu năng điện thoại. Không dùng số này làm DoD visual redesign.
- Lab hiện có là entry dev `3d-lab.html`; build Vite production hiện chỉ entry App (config giữ hash), chưa thêm lab vào bundle/deploy.
- Pose world trong R1 là ứng viên; R2.1 hiệu chỉnh theo shader BH fixed z=−200, xác minh continuity/exterior/Works framing. Chưa chứng nhận screen composition toàn bộ R1 ở renderer mới; R2.2–R2.4 kiểm lại khi dựng hiệu ứng tương ứng.
- Các lượt harness đầu đọc Fiber root trong StrictMode cleanup ở navigation dùng font cache; đã sửa chờ mount ổn định, không sửa production vì lỗi harness này. `browser-first-pass.json` giữ bằng chứng đầu, **không** dùng làm kết quả cuối. Native details cũng được mở trước khi kiểm nút phụ. Lượt cuối exit 0 và error list rỗng.
- R2.2 nhận state/path/anchor/progress thật theo contract. `STORY_SEED=20261007`, `STORY_IDLE_PHASE=0`; selection none, idle orbit/phase capture thuộc R2.3. Không tự thực hiện các task sau, không deploy/commit/đổi dependency.
