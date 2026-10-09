# R6.2 — route / history / PWA contract

## Entry points

- `src/stores/useRouteStore.js`: `EDURA_ROUTE`, `navigateRoute(event, href)`, `returnToWorks()`, `pushMainAnchor(id)`, `readMainSnapshot(value)` và `useRouteStore`.
- EDURA action thật: `a#work-case-edura[href="/projects/edura"]`; chọn dự án là `button#work-target-edura`. VERIS/VIE tiếp tục pending. Behance là liên kết phụ.
- `App` giữ Nav/Menu/Sound chung; chỉ mount `Portfolio` hoặc `Edura`. `Portfolio` sở hữu Canvas và các hooks GSAP/scroll. Reader không mount Canvas/Cursor/camera/ScrollSmoother.
- Không thêm router/dependency. `/projects/edura/` render cùng reader; các ảnh `/projects/edura/*.webp` vẫn là file tĩnh.

## History entry

Main entry được `replaceState` trước khi rời đi, giữ các field ngoài `stellar`:

```js
{ stellar: { id, snapshot: {
  y, width, height, chapter, p, scrollProgress,
  selection, orbit: { phase, origin, velocity, captures, latched, visited, resumePending },
  pose: [x, y, z, lookX, lookY, lookZ], focus
} } }
```

Case entry: `{stellar:{id,from}}`. `from` là ID main entry vừa lưu. Return dùng native Back nếu có `from`, còn direct reader dùng push `/#work`. Native Back không bị chặn để ép người dùng ở website. Modified/middle clicks dùng anchor native, không save/push vào tab gốc.

Snapshot được kiểm finite/range/chapter/selection/orbit/pose trước khi nhận lại. Cùng URL và cùng entry ID không prepare lặp khi browser phát cả popstate và hashchange. Root sở hữu hai event này; `historyManaged:true` tắt listener route trùng trong hook production. Lab giữ mặc định cũ.

## Restoration order

1. Trước render main, chuẩn bị store chapter/progress/selection; bỏ loading intro. Copy dữ liệu orbit vào object hiện có, dừng velocity khi có selection để giữ phase đã chụp.
2. `useScrollProgress` nhận `initialPosition` và áp dụng entry một lần sau đo DOM. Cùng viewport quay lại y tương ứng; resize dùng chapter/local progress để giữ điểm đọc thay vì pixel đã hết phù hợp. Locale/resize tiếp tục đo lại qua cơ chế cũ.
3. Chờ fonts/controller/Canvas sẵn, refresh/seek và hoàn tất scrub hiện có, rồi focus EDURA với `preventScroll`. Khi input mới đến trong lúc chờ, hủy seek/focus muộn để không giành thao tác của người dùng. Bounded wait vẫn cho DOM hoạt động nếu Canvas fallback.
4. CameraRig tiếp tục writer duy nhất và suy pose từ chapter/progress/aspect/reduced; pose lưu để kiểm chứng, không thêm camera writer hoặc replay meteor/portal.

R7 giữ `useScrollProgress` là producer story, `CameraRig` writer duy nhất. Không thêm offset/intensity contactProgress legacy vào tuyến mới. R8 giữ case unmount scene và kiểm lại snapshot/route khi đổi finale/chiều dài section.

## Deployment / offline / metadata

- `vercel.json` rewrite riêng hai đường reader sang `/index.html`, không wildcard nuốt ảnh. Preview đã dùng SPA fallback; production Vercel chưa deploy trong task này.
- Workbox `navigateFallback:'index.html'`, giữ precache core và cache ảnh hiện có. Chỉ ba ảnh R6.1 được đưa public: overview/problem/solution, 324276 bytes; không copy gallery nghiên cứu.
- Khi SW đã cài/cache thành công, cả shell reader và ba ảnh trên có sẵn offline. Visit đầu tiên khi chưa có SW/cache cần mạng; Behance và tài nguyên ngoài không được hứa offline.
- `i18n/config.js` theo route/lang để cập nhật title/description/canonical/alternate/OG/Twitter và khôi phục home metadata. Static HTML vẫn là SEO portfolio trước khi JS chạy; không coi đây là server-rendered case metadata cho crawler chỉ đọc HTML.
- Sound store/engine/registration SW/index metadata gốc và preferences không đổi. SoundToggle chung không unmount khi chuyển route; reload vẫn cần opt-in mới như trước.

## Scope

Chỉ R6.2. Reader nội dung được giữ từ R6.1, không thêm lesson/metric/flow thiếu nguồn. Không thực hiện R7/R8, không deploy, không cài dependency hoặc reset working tree.
