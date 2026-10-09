# R6.1 — Browser QA của reader trong shell preview

**08/10/2026.** Page đã freeze trước kiểm chứng; QA chỉ ghi outputs, không sửa source/public/AGENTS. Dùng Edge **154.0.4258.62** và Playwright có sẵn vì Browser CUA kernel không hoạt động. Base thật `http://127.0.0.1:5173/?reader-preview=edura`, existing App entry + Return callback spy; không tạo app/Canvas thứ hai.

## Kết quả thật

[browser-reader-results.json](browser-reader-results.json): **20/20 pass**, widths **320/390/768/1440/1920 × Vi/En × normal/reduced**, mỗi context mới và SW bị block để không đọc bản cache cũ. Không có console error, pageerror hoặc warning trong reader.

| Nhóm | Bằng chứng |
|---|---|
| Responsive / đọc | Overflow ngang0 ở đầu, cuối và150 vị trí đọc bằng wheel native; prose16–18px, intro18–24px, line-height≥1.4; max image CSS1280px, full frame đúng1400/989 |
| Landmarks / i18n | 1reader/1main/1h1; h2/h3 không nhảy cấp; `html.lang` Vi/En đúng sau native action; nút VI/EN cập nhật copy và alt/caption |
| Keyboard | **160 Tab records**, tất cả target focus outline2px; ShiftTab/Enter skip link đưa focus `#edura-main`; hai Return dùng Enter gọi callback2 lần, thêm native click/tap gọi lần3 |
| Target touch | Mọi link/button width và height≥44px; cấu hình≤768px dùng native tap cho locale và Return; không mất reader/focus sau locale |
| Ảnh | 3/3 decode thật1400×989; HTML width/height đúng, async; A02 eager, A07/A09 lazy; CSS filternone/object-fitcontain; mẫu80×56 có4.103/4.050/3.889 chromatic pixels cho A02/A07/A09 |
| Lazy network | Browser tự prefetch2 ảnh ở initial load (A02/A07); native wheel tải đủ3 uniqueURL sau đọc. Không giả định lazy đồng nghĩa chỉ1request lúc load |
| Controls | 3original-image links đúng `/projects/edura/{overview,problem,solution}.webp`, label Vi/En đủ, `_blank`+noopener/noreferrer; Behance secondary đúng project241524417, không placeholder |
| Reader scene | **0Canvas** ở cả20 cấu hình; không route/camera/orbit/controller trong page này |
| Reduced | `matchMedia` đúng mô phỏng; copy/ảnh/controls đầy đủ; intro settles và ảnh không bị effect đổi màu |

Đã mở thật screenshot full-page **390/En/normal**: ảnh màu giữ toàn khung, body/heading editorial, caption ngay dưới ảnh, footer Return/Behance rõ. Root đã nhìn thêm1440/390 đầu/cuối. Tám PNG desktop/mobile Vi/En normal/reduced ở `screenshots/browser-reader-{390,1440}-{vi,en}-{normal,reduced}.png`. PNG và runtime này là reader JSX thật, khác storyboard minh họa R1.1.

## CLS và giới hạn phép đo

Initial CLS được observe từ cold navigation trước interaction (lọc `hadRecentInput=false`), **min0.0003983539 / max0.0369638175**, không phải0. Max tại320/Vi/reduced, một entry ở2137.6ms với các nodeP/DIV/FIGURE bị dịch. Width/height/aspect ảnh vẫn đúng; log này không tự chứng minh nguyên nhân font swap. Không sửa hoặc bỏ entry để làm đẹp số. `initial` luôn là Vi bootstrap mặc định của store; cấu hình En được đổi bằng nút thật sau phép đo initial, rồi kiểm toàn bộ reader En. `allCLS` và các raw entry cũng được giữ trong JSON.

Chữ đã đốt trong slide A07/A09 vẫn nhỏ trên mobile; phần đọc là DOM summary/alt/caption và link ảnh gốc. Browser check không tuyên bố mọi label trong ảnh mobile đều đọc được, native2× tại CSS1280px/DPR2 hoặc WCAG audit toàn diện.

Return chỉ xác minh **callback invocation**. Chưa kiểm route/history/Back scroll/focus restore, deep link reader, metadata SEO, SW offline hoặc pause scene khi chuyển route; đều là tích hợp R6.2. Không mở Behance để claim HTTP200 hoặc video/flow/outcome. Điện thoại thật, OS reduced-motion thật và screen reader thật chưa dùng.

## Chạy lại / production subset

```powershell
node outputs/redesign/r6.1/verify-reader-browser.mjs
node outputs/redesign/r6.1/verify-reader-browser.mjs http://127.0.0.1:4173 --subset
```

Root đã chạy lệnh thứ hai:8/8 cấu hình390/1440 Vi/En normal/reduced pass,64Tabrecords/60wheelpositions/0console errors; `production-reader-results.json`. Initial CLS0.0072641627–0.0367171842. Có8warnings “Service Worker registration blocked by Playwright” do test chặn SW để tránh cache cũ; không claim warning-free hoặc offline pass. Harness sau đó đã gỡ, App đúng baseline và final build pass. Script này không phải test route production R6.2; muốn chạy lại phải bật preview switch tạm và build, rồi gỡ và build lại.

Một lỗi checker đầu tiên gọi `request.url()` trên object log có fieldstring; sửa thành `.url` trong output script, giữ [browser-reader-harness-first.json](browser-reader-harness-first.json) làm diagnostic. Lượt final20/20 chạy sau sửa, source reader không bị thay để chiều test. Edge đã đóng cuối script; không còn context QA giữ process đo của root.
