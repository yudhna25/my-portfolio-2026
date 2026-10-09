# V3 backdrop — bàn giao tích hợp

09/10/2026. Đã sửa đúng `src/3d/components/StarField.jsx` và `Nebula.jsx`; không ghi portal helper, GalaxyScene, camera, HDR hoặc asset V4. Skill repo `react-3d-ui` / `galaxy-portfolio` đã đọc.

- Một star pool và hai Nebula hiện tại tiếp tục dùng shaderMaterial cũ, không thêm geometry pool/render pass/composer/camera writer. Geometry dispose StarField giữ nguyên; refs/Vector2/phase object tạo một lần, không cấp phát trong useFrame.
- Portal-only clip-space deformation đi từ tâm cap-height O tới viewport x=.5/y=.45 (UV y-up=.55). Differential angle theo bán kính/seed; quỹ đạo cong, inward convergence và crisp radial point streaks, không xoay toàn frame. NDC warp không đổi clip depth hoặc camera matrices.
- Star ejection bắt đầu p=.50 và về native projection p=.70, mỗi seed lệch nhịp nhỏ được suy từ p, không history. Nebula collapse/fade và eject dùng `portalState.intake/eject/center`; frustum culling tắt cho warped plane để native bounds không cắt quá sớm. Point sprites giữ quadratic falloff trắng/xám cũ, không blur hoặc bloom mới.
- Hero/portal full motion: shader time=p*12, nên held/reverse cùng p có cùng twinkle/noise. Reduced/non-story/non-portal giữ path và ambient behavior cũ; không sửa Skills/Works/finale logic. Geometry star positions có randomness lúc mount từ builder cũ, không random mỗi frame; reverse cùng mount giữ geometry.
- Integrator cung cấp shared `portalState` fields `intake`, `eject`, `center`, và `PortalBackdrop` visible trong intake/p0, hidden core, visible eject. Các API component không thêm prop.

**Đã chạy:** scoped ESLint hai file PASS, `node outputs/visual-revision-2026-10-09/v3/check-backdrop.mjs` PASS58 assertions về uniforms/varyings/no frame allocation và phase assumptions. Checker đầu tiên sai đường relative, đã sửa và rerun PASS.

**Chưa chạy riêng:** GPU compile/render, Browser checkpoint/reverse, build toàn bản tích hợp hoặc FPS. Parent cần verify shader và resource trong scene hiện tại; không coi lint/checker là GPU PASS. Đây là deformation screen-space cinematic; không phải truy tia vật lý cho từng sao hoặc mô phỏng accretion thực.
