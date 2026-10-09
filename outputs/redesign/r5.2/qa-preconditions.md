# R5.2 — Browser QA chuẩn bị

Harness `verify-browser.mjs` đã hoàn tất: native entry riêng **10/10 PASS**, full suite **386/386 PASS** trước sửa metadata chiều cao ảnh, và **final matrix340/340 PASS** sau sửa một height prop. Kết luận và giới hạn từng mốc nằm trong `browser-results.json` và `verify-notes.md`; không dùng partial cũ làm full pass. Agent QA chỉ sửa outputs, không sửa src/public/AGENTS. Browser đã đóng.

## Điều kiện chạy

- Dev app thật tại :5173; Edge và runtime Playwright hiện có. Không cài dependency/plugin.
- Chờ Agent tích hợp báo source frozen. Không chạy cùng Browser visual/performance của Agent khác.
- Selector thực tế: `[data-work-target="edura|veris|vie"]`, `[data-work-preview][data-active]`, `[data-work-background]`, `[data-work-action]`, `[data-work-behance]`, ảnh `[data-project-image]`. Root DOM nằm trong #work, không portal/fixed ngoài main. Không thêm probe production để phục vụ test.
- Store dùng `useScrollStore`, `worksSelection/Focus/Hover`, `worksOrbit` và progress contract R2.3/R5.1. Highlight Selection → Focus → Hover; kiểm focus vẫn giữ khi mouseleave. Phase origin/captures lấy object frame data thật.

## Bộ kiểm

320/390/768/1440/1920 × Vi/En × normal/reduced; ba preview ảnh gốc màu, đúng tên/lĩnh vực/alt/dimensions. Một preview box cố định, labels/hit targets≥44px đứng yên khi orbit chạy, đúng chart buffer+edges cho cả ba hình sao. Hover nhanh, native Tab/Escape, focus cùng pointer, orbit pause/resume không nhảy phase. Touch thật qua Edge hasTouch context: chọn, chạm lại clear và nền clear; nút hành động riêng.

Handoff tới **prototype/manual engine finale**, giữ origin qua forward/reverse/Contact và return Works; chưa giả rằng R7 production finale đã tồn tại. Ma trận 3 live reduced/resize/locale cycles giữ focus và preview. Kiểm links: VERIS/VIE không href hoặc nút hành động chạy; EDURA slot tạm disabled/không điều hướng khi route chưa tồn tại, Behance chỉ link phụ thật.

```powershell
$env:R52_PHASE='quick'
node outputs/redesign/r5.2/verify-browser.mjs *> outputs/redesign/r5.2/browser-quick.log
$env:R52_PHASE='all'
node outputs/redesign/r5.2/verify-browser.mjs *> outputs/redesign/r5.2/browser-run.log
```

Full gồm đủ 20 tổ hợp, 5 progress đọc/20 analytic phase scans (361 góc/cấu hình), ownership/orbit/touch/lifecycle/native entry/wheel/hidden/lens ảnh. So footprint target/preview trong hệ tọa độ stage, đồng thời giữ assert stage.top tuyệt đối <1px; sai số root phân số pixel không bị gọi nhầm là layout shift. PerformanceObserver ghi raw/official CLS và sources: cửa sổ preview reset sau manual reading/jump ổn định, các shift khi teleport p=1 sát Contact lưu riêng `readingShifts` thay vì gộp vào claim preview. Không benchmark FPS trong harness. Mobile/reduced/hidden đều là emulation trên Edge Windows, chưa xác minh điện thoại thật/OS setting.
