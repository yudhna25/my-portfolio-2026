# R2.3 — Works orbit / selection / finale origin

08/10/2026. Prototype tại `3d-lab.html?story=1&chapter=works&p=.5`; không đổi App, preview, route hoặc camera. R2.4/R5.2 dùng lại **WorksConstellations**, không sao chép renderer. R2.1 giữ ownership camera/progress; R2.2 giữ portal/HDR. Bản này chỉ chốt gốc cho finale, chưa co/tăng tốc quỹ đạo, collision, trails hoặc nebula.

## Dữ liệu và hình sao

`src/3d/data/worksConstellations.json` là subset nguyên vẹn ba mục `section=works` của R0.2. `sourceFile/sourceSha256` dẫn tới bản nguồn; catalog, projection, edge convention và attribution giữ nguyên.

| ID store | Assignment | Figure | Sao chính / cạnh | Sao vùng phụ |
|---|---|---|---|---|
| edura | EDURA LMS | Cen / Centaurus | 17 / 16 | 12 |
| veris | VERIS APP | Gem / Gemini | 17 / 16 | 12 |
| vie | VIE PERFUME | Cyg / Cygnus | 10 / 9 | 12 |

44 sao chính, 41 cạnh, tổng 80 điểm. Supporting stars là context có thể thuộc chòm lân cận; không nối thêm cạnh. Nguồn HIP ICRS/J1991.25 và Stellarium Modern CC BY-SA 4.0. Không gọi đây là hình IAU duy nhất hoặc chuyển động thiên văn thật.

Hình local XY lấy đúng R0.2: north up, celestial west right, z=0. Tất cả dùng cùng scalar scale, không mirror/stretch/rotate riêng. Root có basis của **pose Works** theo aspect/FOV R2.1; không parent vào live camera, không ghi camera. Ba tâm đi trên cùng ellipse, lệch pha 2π/3; mỗi figure giữ orientation. Main stars 5–10 CSS px theo magnitude, field stars 2.5px/alpha0.25; đường trắng alpha0.13 phụ trợ. Pixel size là dàn cảnh để đọc, không photometry được hiệu chuẩn.

## API / ownership

- `useScrollStore`: `worksSelection`, `worksHover`, `worksFocus` (`null | edura | veris | vie`). `setWorksInteraction(channel,id)` với channel `Selection | Hover | Focus`; ID/channel không hợp lệ bỏ qua. `clearWorksInteraction()` xóa ba owner.
- Pause toàn hệ là OR của ba owner. Highlight ưu tiên Selection → Focus → Hover; một chòm sáng, hai chòm còn lại strength0.35. Pointerleave chỉ xóa Hover, blur chỉ xóa Focus; không xóa selection của touch/keyboard.
- `worksOrbit` là **object frame data có identity ổn định**, không phải reactive UI snapshot: `{phase, origin, velocity, latched, visited, captures, resumePending}`. Không subscribe scalar đó để render React từng frame. UI chỉ subscribe các ID; LabTelemetry đọc frame data theo nhịp diagnostic sẵn có. R5.2/R7 cần giữ object này qua pause/reader/Back, không tạo lại khi section inactive.
- `setStoryPosition()` là producer duy nhất. Nó gọi `syncWorksOrbit()` đồng bộ **trước** khi trả state mới. `WorksConstellations` là chủ sở hữu duy nhất của idle integration, priority−0.75 sau CameraRig−1; không thêm ticker đo scroll hoặc controller camera.
- Lab Resume vẫn gọi seek của R2.1, rồi một lần `trigger.update(); trigger.animation.invalidate().progress(trigger.progress)` trước khi mở producer. Browser tái hiện scrub playhead giữ visibleY cũ trong khi nativeY tiến sau manual proxy seek; reinit này khôi phục tween cùng owner. Native wheel sau refresh/resize/locale được kiểm riêng; không thêm timeline đo scroll hoặc thay smooth1.2.
- Idle dùng `useFrame(delta)`, tốc độ đích0.075rad/s, damping6/s với tích phân exponential chính xác; dt cap0.05s, terminal pause velocity<0.00001 về0. Không random/physics. Khung 60/165Hz gần như cùng pha; cap không bù thời gian tab đã ẩn.

## Handoff bắt buộc cho R2.4

1. Trong Works, phase tăng khi không có interaction; stop/resume chỉ đổi velocity mục tiêu, không đặt lại phase.
2. Lần đầu producer báo `finale,p>0` **hoặc jump Contact**, origin=phase vừa hiển thị, latched=true, velocity=0, captures tăng một lần. Nếu chưa qua Works, phase/origin=`STORY_IDLE_PHASE=0`, seed=`STORY_SEED=20261007`. Không clock/random/seed mới.
3. Các bước finale `.2→.8→.1→0→.7`, wheel đổi chiều, resize, locale, reduced preference và jump Contact đều giữ origin. **Manual finale,p=0 vẫn latched**; chỉ canonical chapter `works` mới release. Đây là quy ước ở biên DOM, không dựa vào dấu delta wheel.
4. Khi về Works, phase=origin; resumePending bỏ qua idle integration ở frame đầu, rồi tăng tốc lại từ0. Selection còn giữ thì tiếp tục đứng yên; bỏ selection/focus/hover mới resume. Pointerleave rồi scroll ngay vẫn capture last displayed phase, không ăn thêm một bước delta.
5. R2.4 tính trực tiếp `finaleAngle = origin + authoredAngle(progress)`; authoredAngle(0)=0. Mọi vị trí/trail/gas/opacity của finale là hàm origin+seed+progress. Không ghi lại origin hoặc tích phân idle trong finale. R2.3 hiện giữ nguyên các vị trí orbit tại origin, để camera R2.1 đổi hướng; việc chúng rời khung chưa phải collision.
6. R2.4 phải dùng cùng normalized star data và rigid Works basis cho điểm đầu; boundary finale0 = Works phase trả về. Resize có thể recompute projection/basis, không recapture. Endpoint finale→Contact giữ camera/HDR của bàn giao R2.1/R2.2 cho đến task được phép thay đổi.

## DOM, reduced / hidden / cleanup

WorksControls trong lab là mẫu 3 nút fixed ngoài smoother, mỗi target≥44px, i18n Vi/En, không di chuyển theo sao. Đây là selector mẫu, chưa preview ảnh hoặc CTA reader. Touch chọn/chạm lại bỏ chọn và resume; pointer focus do touch không giữ pause sau lần chạm bỏ chọn. Keyboard focus pause; Enter chọn, Escape chuyển focus sang group ổn định rồi clear; nền cũng chuyển focus group rồi clear. Tab không bị trap. Khi rời Works, Hover/Focus bị clear, Selection giữ cho việc quay lại.

Reduced-motion giữ nguyên phase hiện tại (fresh load=0), bỏ idle integration; selection vẫn đổi độ sáng tức thì. Finale reduced theo endpoint camera R2.1, Works group tắt trong finale để không giả chuyển động/explosion. Hidden Canvas `never` sẵn có; offscreen không tích phân. Toggle story mode chỉ unmount primitive, không xóa captured phase. 6 geometry do component dispose, 6 material do R3F sở hữu/dispose; không texture mới, không writer/listener/tween per-frame mới. WebGL fallback giữ DOM controls.

## Kiểm tra chạy lại

```powershell
npm run dev
node outputs/redesign/r2.3/check-orbit.mjs
node outputs/redesign/r2.3/verify-browser.mjs
npm run build
npm run lint
```

Checker dùng store thật (đổi alias thành file URL chỉ trong harness Node), source/projection, capture/reverse/return/deep jump/guards/integration. Browser dùng Edge và Playwright runtime đã cài, không dependency mới; cần dev :5173. `verification.md`, JSON và trace ghi cấu hình/số đo/giới hạn. Không dùng screenshot storyboard để nhận motion/FPS pass.
