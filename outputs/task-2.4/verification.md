# Task 2.4 — Custom Cursor

Hoàn thành ngày 05/10/2026 trong D:\Projects\my-portfolio-2026.

## Phạm vi thay đổi

- Viết lại src/components/Cursor.jsx, giữ default export để App tiếp tục dùng, thêm named export Cursor.
- Vòng SVG 28px, stroke trắng 40% và dot 4px. Hai phần tử dùng difference blending, không dùng layer blend phủ cả viewport. Nhãn 12px Unbounded lấy từ works.cursorCta.
- quickTo dùng lại cho x/y, scaleX/scaleY và opacity: dot 0.08s, vòng 0.3s, đổi hình 0.24s. Không animate width/height, không tạo tween mỗi pointermove. Pointer đầu tiên đặt ngay tại vị trí chuột.
- [data-cursor="view"] và .work-card hiện có: vòng 64px, fill #FAFAFA, chữ đen XEM/VIEW; dot ẩn để không che chữ. Link/button thường: vòng 18px.
- [data-magnetic]: translate riêng, lực tối đa 8px theo bán kính, reset khi rời. Không ghi đè transform của entrance/Flip. Khôi phục translate ban đầu khi cleanup.
- Chỉ render khi (min-width: 1024px) and (hover: hover) and (pointer: fine). Viewport nhỏ/coarse pointer: không có DOM cursor. Bỏ qua sự kiện touch trên thiết bị hybrid.
- Reduced-motion: quickSetter có đơn vị px cho tọa độ, cập nhật trực tiếp cả cursor/magnetic; không lerp. Theo dõi thay đổi preference trong phiên.
- aria-hidden, SVG focusable=false, pointer-events:none; không có tabIndex, không gỡ cursor hệ thống. Ẩn visual khi Tab, blur, pointerleave hoặc tab nền.
- useGSAP quản lý tween/context; cleanup đầy đủ 7 listener và magnetic style, kể cả StrictMode. Delegation hỗ trợ hover phần tử sinh thêm sau filter.
- Footer.jsx chỉ bỏ magnetic email cũ để tránh hai controller; giữ nguyên entrance, ScrambleText và markup. Không sửa Work.jsx hoặc EvilEye.jsx.

Task này không sửa App, locale hay CSS globals. Hash App/locales đã đổi trong phiên ở phần Nav ngoài phạm vi Cursor; các thay đổi đó được giữ nguyên. Xem scope.json và unchanged-files.json.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS, gồm PWA generateSW |
| npx eslint src/components/Cursor.jsx src/components/Footer.jsx | PASS |
| npm run lint toàn repo | Còn 1 lỗi Work/react-hooks/refs + 2 warnings SplashCursor cũ; phần sửa không thêm issue |
| Browser, Cursor thật trong React StrictMode | 35/35 checks pass |
| Default / VIEW / link | 28 / 64 / 18px đúng, dot 4px, font/Vi/En đúng |
| Dynamic/disabled/touch/keyboard/blur | Pass |
| Reduced-motion và live preference change | Cập nhật ngay; reset ngay; pass |
| Coarse pointer và 3 chu kỳ unmount/remount | 0 DOM/0 listener khi tắt; peak 1 listener/event khi bật |
| Mobile 390×844, tablet 820×1180, 1023×768 | 0 cursor DOM; mobile 0 listener Cursor |
| Desktop 1280×720 | 1 cursor DOM |
| Chuột thật trên Work | data-cursor=view chỉ gắn tạm trong QA; XEM hiện, hover ảnh vẫn scale 1.06 |
| Email thật trong App | Lực ~8px (sai số số thực 0.000002px), transform section giữ nguyên, reset x/y=0 |
| App + GalaxyScene, chuyển động chậm 2s | ~165.01fps; p95 6.1ms; 331 events; 0 quickTo mới trong lúc move |
| App + GalaxyScene, chuyển động nhanh 2s | ~165.01fps; p95 6.2ms; 2648 events; 0 quickTo mới trong lúc move |
| Console fixture cuối | 0 error, 0 warning |
| Console App tích hợp cuối | 0 error; 1 warning THREE.Clock cũ từ Fiber |

## Bằng chứng

- browser-checks.json: 35 checks tự động, Vi/En, direct reduced-motion, cleanup, quickTo reuse.
- app-checks.json: App thật, Work/email, FPS chậm/nhanh và native pointer events.
- responsive.json: kích thước viewport, DOM cursor và listener khi mobile.
- work-hover.png: hover project thật bằng chuột Browser; ảnh scale 1.06 vẫn hoạt động.
- cursor-xem-dark.png, cursor-view-light.png, mobile.png, tablet.png: ảnh bổ sung.
- fixture-console.json và app-console.json: console của tab sạch sau sửa.
- build.log, lint-changed.log, final-source-hashes.json: build/lint và fingerprint source.
- Cursor.before.jsx, Footer.before.jsx: bản WIP trước thay đổi, chỉ phục vụ đối chiếu.

## Giới hạn của phép đo

Reduced-motion/coarse pointer được mô phỏng bằng matchMedia trong QA; chưa đổi preference OS trực tiếp. Mobile/tablet được đổi viewport Browser thật. FPS là kết quả trên máy dev ở tab đang hoạt động; tab nền bị Browser throttle khoảng 1fps (giữ riêng background-throttled.json), không dùng lượt nền để đánh giá hiệu năng. Một số viewport capture IAB chỉ trả vùng repaint của layer difference; ảnh full-page/ảnh Work có ngữ cảnh dùng để đối chiếu.

QA được lưu trong outputs/task-2.4, không import vào production. Trong quá trình kiểm thử đã sửa harness để chỉ chọn #root .work-card và phân biệt reduce/no-preference. Lỗi harness cũ được giữ trong qa-harness-errors-resolved.json; tab App cuối đã xác nhận 0 error. Không sửa component production khác để xử lý các warning/lint WIP cũ.

