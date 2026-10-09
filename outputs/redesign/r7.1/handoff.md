# R7.1 → R7.2 / R8 — shared finale production

## State và anchors thật

- `src/App.jsx`: `works` → `finale` → `contact`, finale `min-h-[225vh] motion-reduce:min-h-0`. Vùng đọc/chọn Works vẫn 160vh trước finale. `useScrollProgress` đo mốc DOM/visible Smoother hiện có; không thêm producer.
- Section IDs vẫn `#work` / `#transmission`. Contact root không transform; chỉ `[data-contact-content]` translate/opacity để giữ đúng anchor Nav/hash. R7.2 thay nội dung/layout trong root này.
- `useScrollStore.storyChapter/chapterProgress` là nguồn camera, quỹ đạo, trail, khí, glow và copy. `storyManual` dùng harness/lab tạm giữ producer hiện có. Không thêm timeline story khác.
- `worksOrbit` giữ nguyên identity và contract R2.3/R6.2. `worksFinaleSelection` là presentation được chụp khi từ Works sang finale/Contact, ưu tiên Selection → Focus → Hover. DOM và renderer cùng đọc snapshot; pointer leave khi preview đang rút không làm đổi độ sáng/chữ. Không writer orbit mới.

## Nhịp và poses dùng lại

`src/3d/utils/finale.js` / `WorksConstellations` / `BlackHole` / `BlackHoleSystem` / shader copy dùng nguyên R2.4. 0–.12 rút nhãn/preview; .12–.34 co/tăng tốc/trails; .34–.44 nén 10%; .44–.70 flare cục bộ/tinh vân; .70–1 khí về tâm/hố đen. CameraRig đến endpoint tại .44 và giữ; tâm collision và hố đen đều `[0,0,-200]`. Camera target/pose lấy `storyCameraPath` shared, không section camera writer. Endpoint Contact đã tách khỏi ABOUT sau khi render cho thấy pose About cắt hố đen sát mép: `[2,4,-160]`, aim desktop `[-22×frameBias,-5,-200]`; portrait giảm lookX về 0 và lookY tới −28. Framing blend cùng ease camera trong finale, không chuyển đột ngột; About giữ nguyên.

`finaleState.contact` mở copy .88–1. Nội dung Contact inert trước chapter `contact`; direct Nav/hash Contact vào pose endpoint và mở thao tác ngay. Nút/copy/layout terminal cũ được giữ để R7.2 thay đúng phạm vi; không gọi đây là Contact redesign đã hoàn thành.

StarField/Nebula dừng elapsed time trong finale/Contact; approach StarField story đọc progress trực tiếp. Ambient ShootingStars vẫn ở các chương yên và nhường finale theo lịch R5.1. CSS pulse Contact cũ đã bỏ. Background shell vẫn dùng geometry ambient hiện có, có thể khác khi mount/đổi tier; finale gas/trails/phase không reseed khi đảo cuộn cùng lượt.

## Cleanup và routing

Gỡ đủ bốn caller `contactProgress`: Contact timeline, store scalar/setter, legacy CameraRig z offset và BlackHole disk intensity. Không còn contact-approach/veil writer. Legacy non-story lab dùng cameraPath cơ bản/disk intensity 1.

R6.2 route/history giữ nguyên. EDURA reader unmount scene; Back khôi phục Works/selection/phase/focus, lượt finale sau đó chụp presentation từ selection đã restore. Fresh Contact mặc định phase/origin 0 với seed R2.1. Không cần onLeave Works từng chạy.

## R7.2 cần giữ

- Thay terminal/panel bằng email ở vùng tối, giữ progress visibility và section root anchor ổn định.
- Contact heading/email giải mã một lần sau settle rồi yên; nếu thêm hiệu ứng, không chạy chen vào progress finale hoặc tween camera/glow.
- Copy/mail/language/Sound opt-in và native keyboard/route phải giữ; reduced endpoint đầy đủ, không gap 225vh.
- Giữ một Canvas/một CameraRig/một HDR render mỗi frame và tiers/DPR hiện có. Gas là approximation fbm hai lớp shared R2.4, không mô phỏng volumetric vật lý/NASA nguyên bản.

Kết quả Browser/build/integrity hiện hành được chốt riêng trong `verification.md`; tài liệu handoff này mô tả contract, không tự thay bằng chứng render.
