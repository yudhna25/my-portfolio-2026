# V7 — Works figure interaction / bàn giao V8 và V9

09/10/2026. Chỉ sửa bốn file sở hữu V7; **chưa nối projected hotspots vào App/Lab**. Harness dùng chính Work, GalaxyScene, CameraRig, producer và WorksConstellations của repo, không renderer/camera/store mô phỏng.

## Interface V8 cần nối

```jsx
import { createWorksLayout } from '@/3d/utils/worksOrbit';

// Trong Portfolio, một ref cho cả DOM và renderer.
const worksLayout = useRef(null);
if (!worksLayout.current) worksLayout.current = createWorksLayout();

<WorksConstellations layoutRef={worksLayout} frozen={reduced} quality={quality} />
<Work layoutRef={worksLayout} />
```

Patch này **chưa áp dụng** vào `src/App.jsx`. `Work()` không nhận ref vẫn cung cấp ba nút fallback và reader/Behance; `WorksConstellations` không nhận ref vẫn render. Ref là telemetry hình học; interaction tiếp tục dùng store hiện có, không store Works thứ hai.

`layoutRef.current` gồm:

| Field | Writer / ý nghĩa |
|---|---|
| `ready` | Renderer; chỉ true khi chapter Works đang hiển thị |
| `width`, `height` | Kích thước Canvas bằng CSS pixel |
| `figures[3]` | Stable objects `{id,left,top,right,bottom}`; chiếu hợp bounds sao + artwork bằng `group.matrixWorld` và camera thực |
| `basis` | Basis hiện tại: `center`, `rotation`, `hole`, `centers[3]`, `scale`, `drift` trong local plane |
| `onChange` | Work đăng ký một callback, renderer gọi sau khi cập nhật projection; cleanup gỡ đúng callback |

Không subscribe scalars telemetry bằng React; không cập nhật state mỗi frame. Writer camera priority −1 giữ nguyên, Works priority −0.75. Width/height GSAP quickSetter là kích thước vùng tương tác khớp hình học, không hoạt cảnh đổi kích thước card.

App restore R6.2 cần chờ `worksLayout.current.ready` trước focus figure EDURA khi Canvas còn hoạt động. Thêm bounded RAF wait ở callback focus **sau** seek/settle hiện có; giữ cancellation input và native fallback. Không chặn seek bằng chờ `ready`, vì seek có thể là điều làm chapter Works hoạt động. Không sửa route schema hoặc tạo camera writer.

Lab nếu cần kiểm UI figure cũng truyền **cùng ref** cho hai consumer; không tạo một renderer thứ hai. Evidence của V7 nằm ở `qa.html`, không sửa Lab chung.

## Interaction và DOM

- Giữ `work-target-edura`, `work-case-edura`, `work-preview`, `data-work-background` và `data-work-target`. ID figure là nút thật, có label project/chòm sao, `aria-pressed`, `aria-expanded`, mô tả, outline và vùng ≥44px.
- Primary hover là cả projected figure. Header chỉ có heading/hướng dẫn; ba nút ở header khi thiếu ref là **fallback**, không phải interaction production V7 sau tích hợp.
- Selection → Focus → Hover giữ nguyên. Mouse hover/panel dùng cùng owner; exit grace 180ms. Click/tap pin; Escape hoặc click nền clear. CTA là anchor riêng, không toggle pin.
- Panel nằm ngay sau figure được chọn trong DOM; native Tab/Shift+Tab tới reader và Behance rồi figure tiếp theo. Không focus trap, không tabindex dương. Nút offscreen giữ `sr-only` để Tab từ chapter trước vẫn vào Works và dùng cơ chế focus/Smoother hiện có.
- Preview định vị từ projected bounds, chọn trái/phải/trên/dưới để tránh cả ba figure; vị trí giữ ổn định khi đã mở. Mobile <1024px đặt dưới tam giác. Không thêm chiều cao stage; section vẫn160vh, frame100vh.
- Thiếu WebGL/ref: controls DOM vẫn dùng được. Artwork load lỗi: giữ sao/nét/hotspot, opacity artwork0.

## Orbit / finale — V9 dùng nguyên primitive

Giữ `createWorksOrbit`, `syncWorksOrbit`, `advanceWorksOrbit` và object store hiện có. Idle speed0.075rad/s, damping6/s, delta cap0.05. V7 chuyển presentation sang tam giác cố định có orbit nhỏ4px mobile/8px desktop quanh mỗi vị trí, figure giữ hướng đọc; dừng êm khi Hover/Focus/Selection, static khi reduced/hidden.

`worksStage(width,height,bounds)` tạo tam giác và scalar fit; `worksFigure(p,origin,index,basis,out)` là pose helper **renderer và trails cùng dùng**. Không dùng `finaleFigure` cũ với radiusX/radiusY cho ba figure V7. Mọi sao/nét/art nằm cùng group và chịu cùng scale/position/basis/rotation; không artwork controller độc lập.

Producer vẫn latch `origin` đúng một lần khi finale p>0 (hoặc Contact); mọi forward/reverse trong finale giữ origin/captures. Chỉ khi về Works mới release ở phase=origin, skip idle frame đầu rồi resume. Fresh finale chưa qua Works có origin0 xác định. Work giữ snapshot tạm của owner selection/focus/hover qua excursion, phục hồi khi về Works; transient owner được kiểm lại với pointer/focus sau180ms. Snapshot route vẫn từ store R6.2.

V9 tiếp nhận `basis`, captured `worksOrbit.origin`, `worksFinaleSelection`, cùng group `works-constellations`; local collision center vẫn `basis.hole`. Không chụp lại origin theo wheel/direction/frame. Nếu thay finale phase, cập nhật `worksFigure` và trails chung; kiểm p0/reverse khớp pose Works trước khi sửa gas/BH. Resize đổi basis theo viewport có thể đổi layout, cần V9 xác định resize policy cho snapshot; V7 kiểm đảo chiều ở cùng viewport.

## Assets / locale / store patch

- Thêm **chỉ** `artwork` metadata V4 vào `worksConstellations.json`; toàn bộ nội dung còn lại deep-equal HEAD, stars/support/edges/projection không đổi. URLs `/constellations/centaurus.svg`, `gemini.svg`, `cygnus.svg`.
- Plane dùng center/width/height/localZ−0.01 đã calibrate; không center-fit hay áp transform source lần hai. Texture sRGB, transparent/depthWrite=false. Idle opacity0.10; active0.30; sao/nét trắng tăng rõ.
- **Store patch: không cần. Locale patch cho V7: không cần.** Dùng các keys Works hiện có. V8 vẫn cần notice attribution Vi/En của V4, chưa có UI credit trong scope V7.
- V4 ghi catalog commercial grant chưa được xác nhận riêng; giữ notice nguồn/license, không phát hành thương mại trong task này.

## Kiểm chứng và phần còn chờ

Xem [verification.md](./verification.md), JSON results và screenshots trong cùng thư mục. Full projected-figure → EDURA → Back/Forward trên App, menu/locale production và focus readiness sau mount vẫn **chờ V8**. Route đã kiểm thật qua fallback hiện có, không gọi đó là pass projected end-to-end.

Không sửa AGENTS.md đồng thời với V5/V6. V8 append tuần tự dòng sau, đúng một lần sau tích hợp:

```text
| 09/10/2026 | V7 — Works figure interaction | Codex | ✅ Component kiểm chứng; chờ V8 tích hợp | Work/WorksConstellations/worksOrbit + artwork metadata V4; projected semantic hit regions, preview/grace180ms/keyboard/touch, single orbit snapshot/reverse; build/scoped lint pass, 4 viewport/GL FPS/disposal evidence trong outputs/visual-revision-2026-10-09/v7; App ref + projected EDURA Back chờ V8. |
```
