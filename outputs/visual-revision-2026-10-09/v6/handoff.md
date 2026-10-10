# V6 → V8

V6 đã ngừng ghi source. G1 được người dùng duyệt; không phụ thuộc V4. Implementation và QA worker pass, nhưng **entry-tail exception** bên dưới cần được giữ rõ khi trình G2. Không áp dụng patch file chung, không tạo store/producer/Canvas/composer khác.

## File đã sửa

1. `src/3d/components/StoryMeteor.jsx`: thay points/line bằng một head billboard, một ribbon mesh và một wake mesh. Hai mesh dùng chung indexed geometry128pairs; tổng2geometry/3materials/510triangles/3draw calls. Core16px/halo80px desktop, 10/52px mobile, cyan chỉ rất nhẹ ngoài core. Taper/gas/visibility đều analytic theo progress, cached buffers không upload khi dừng.
2. `src/3d/utils/storyMeteor.js`: giữ các export cũ và curve hiện tại; thêm `meteorWake` và `writeStoryRibbon` cho presentation/local lighting.
3. `src/components/sections/Experience.jsx`: ba wake aria-hidden không nhận pointer/focus; dùng GSAP quickSetter opacity trong useGSAP hiện có, cùng store progress với label emphasis. Layout/copy/onLayout/departure giữ nguyên.

## Interface cần nối

**Không cần thay caller.** `App` hiện đã có stable `meteorLayout` ref và callback; vẫn dùng:

```jsx
<Experience onLayout={captureMeteorLayout} />
<StoryMeteor layout={meteorLayout} frozen={reduced} />
```

- `layout.current`: `{ width, height, range, points: Float64Array(10), milestones: Float64Array(3) }`, mutate cùng object sau DOM measure. Không đổi schema/store.
- Progress lấy từ `useScrollStore.getState()`; Experience q=p, departure q=1+p. CameraRig vẫn writer priority−1. Renderer chỉ gọi `camera.updateMatrixWorld()` để đọc pose vừa ghi; không thay position/lookAt/FOV.
- Giữ anchor35%/72%/35%, head24px trên label, depth24→96, visibility cũ (entry .035, departure fade .70→1), `worksArrival` .30→1. `STORY_METEOR_TRAIL`/`writeStoryMeteor` vẫn export tương thích consumer cũ; presentation ribbon chọn khoảng q theo chiều dài cung chiếu42% width.
- `writeStoryRibbon(layout, journey, positions, normals, screen, view, projection, out, pose, metrics)` dùng scratch tái sử dụng: positions Float32[128×2×3], normals Float32[128×2×2], screen Float64[128×2], matrices `.elements`. Trả lại metrics `{headX, headY, span, tailPixels}`; không cấp phát bên trong. Caller bảo đảm projection/camera/layout cùng pose. Cache hiện theo q/dimensions/range/10points; nếu V8 thay camera/FOV độc lập ở cùng q/layout thì cần invalidate cache.
- `meteorWake(layout,index,p)` là0 trước−.06H,1 tại crossing,0 sau+.26H; Experience tắt khi chapter khác/hidden/reduced.
- Telemetry names: `story-meteor`, `story-meteor-wake`, `story-meteor-trail`, `story-meteor-head`. Head **không còn point position attribute 1vertex/uSize**; đọc `head.material.uniforms.uHead/uCore/uDiameter`. Trail position có256vertices (128 cặp), normals làaNormal; group.userData cójourney/span/tailPixels. Không đổi API product; fixture cũ đo5px/128lineverts phải cập nhật nếu V8 dùng lại.
- Các scalar uniforms phải mutate qua **live mesh.material.uniforms**; R3F clone wrapper từ prop uniforms. Không mutate map khởi tạo để animation cập nhật đúng.

## Entry-tail exception

Ở milestone đầu, curve q=0 có ít đoạn đã đi: desktop89,70px (6,23%), mobile56,92px (14,60%). Hai milestone sau/departure ≈42%. Đây **không đạt35–50% tại milestone đầu**. Giữ nguyên contract curve/timing theo yêu cầu; không tự thêm trajectory trước entry. Muốn tail dài ngay từ entry cần một quyết định visual/contract của integrator; không che exception khi xin G2. Head/halo/wake/readability đã pass cả ba milestone.

## Evidence và tiến độ

[Verification](verification.md), [Actual App checks](browser-results.json), [Lifecycle](check-lifecycle-results.json), [Curve checks](check-meteor-results.json), [Protected hashes](scope-results.json). Build/scoped lint pass;22.023 helper assertions,3.138 App checks/115poses,17lifecycle checks,0console error. RTX4060:164,66–165,16FPS với meteor ở các viewport/DPR; GPU median delta0,126–0,255ms. Chưa đo điện thoại thật/OS motion/G2.

Theo V0 ownership, **chưa append AGENTS.md**. V8 append một lần sau đối chiếu patch, giữ các dòng cũ:

```text
| 09/10/2026 | V6 — Story meteor / local light wake | Codex | ✅ Worker triển khai/QA; entry-tail exception chờ V8/G2 | StoryMeteor/storyMeteor/Experience: core16px+halo80px desktop, mobile10/52, indexed ribbon/gas/cyan nhẹ, analytic wake; curve/departure/camera/ambient/composer giữ nguyên. Build/scoped lint pass;22.023 helper +3.138 App checks/115poses +17lifecycle pass,0console error; RTX4060 ~164,7–165,2fps,2geometry/3materials dispose. Tail trưởng thành42%, milestone đầu còn ngắn vì curve birth; outputs/visual-revision-2026-10-09/v6/verification.md. |
```

Không chạy V8/V9 từ worker này. V8 cần tạo evidence tích hợp mới trước G2; không coi dữ liệu desktop viewport là đo thiết bị mobile thật.
