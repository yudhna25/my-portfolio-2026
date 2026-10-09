# R7.1 v1 — review sau tích hợp

09/10/2026. Source đọc lại sau patch tích hợp, chưa thay kết quả Browser/visual của root.

## Kết quả source và self-check

- App đã thêm một finale range 225vh, reduced 0; Works vẫn vùng đọc 160vh riêng.
- Work dùng label/transform trực tiếp cùng chapterProgress, giữ pin tiếp vào đoạn rút; effective selection được chụp đồng bộ trong setStoryPosition trước clear Hover/Focus. Renderer dùng cùng worksFinaleSelection. Snapshot presentation không thay orbit origin/idle writer.
- Contact bỏ contact-approach, timeline chữ/copy và scramble tự chạy cũ. Wrapper content dùng finaleState.contact và translate về vị trí Contact; DOM #transmission đứng yên cho hook/Nav. Inert chỉ mở ở chapterContact.
- Toàn bộ 4 caller contactProgress đã gỡ. Camera story vẫn owner duy nhất; legacy lab giữ cameraPath cơ bản. Không thêm FBO/Canvas/shader engine.
- StarField story approach trực tiếp từ published progress, time StarField/Nebula ngừng ở finale/Contact; cùng lượt finale không drift nền. Ambient ShootingStars vẫn nhường finale và còn tại chương yên.
- Route/Smoother/scroll hook/seed/cameraPath/finale.js/BlackHoleSystem/bloommask/shader/quality không đổi hash.

`node outputs/redesign/r7.1/check-finale.mjs`: **31,544 assertions pass** (checker R2.4 tái dùng tại thư mục R7.1); collision error≤1.0658141036401503e-14, boundaries clamp/reverse/finite camera/collision/gas≤.82/tier compile guards đúng.

`node outputs/redesign/r7.1/check-integration.mjs`: **160 assertions pass**, gồm store thật hover-only capture→clear live owner→reverse/hold, selection precedence, direct Contact default origin 0; production range/legacy removal/ambient schedule. Baseline 105: 10 file sửa trong phạm vi, 95 giữ hash; HEAD/staged diff không đổi, AGENTS chưa append. Script có thể chạy lại sau final patch và AGENTS append.

## Phần Browser cần chốt

1. Contact terminal cũ còn CSS animate-pulse ở status dot. Nó có thể tiếp tục nhấp nháy ở phần cuối finale khi wrapper alpha > 0; full-page screenshot tại cùng progress không nhất thiết trùng, dù Canvas/state story đã cố định. Root quyết định bỏ pulse trang trí đang chờ R7.2 hay ghi rõ giới hạn; không dùng full-page hash để tuyên bố toàn cảnh tĩnh nếu còn.
2. Contact inert trước chapter Contact bảo vệ thao tác khi chưa settle, nhưng Tab từ Works lúc đã sang finale không thể tự focus Contact để native browser cuộn đến đó. Nav Contact vẫn có entry thật. Kiểm flow bàn phím và bàn giao R7.2 tiêu chí hiện CTA khi đọc.
3. `worksFinaleSelection` chỉ là presentation của lượt hiện tại, không nằm trong R6.2 history snapshot. EDURA→Back Works không bị: lượt mới capture selection đã restore. Nếu về sau R8 kiểm history restore thẳng vào finale từ nhiều lượt có lựa chọn khác nhau, cần đối chiếu presentation chứ không chỉ orbit; hiện chưa mở rộng contract ngoài test case được giao.

Không sửa src/public/config/AGENTS ở review con. Build/lint/Browser/FPS/resources do root và agent QA thực hiện; các kết quả đó không được suy ra từ self-check CPU.

## Addendum bản cuối của agent tích hợp

- CSS pulse Contact đã gỡ để phần copy cuối finale không nhấp nháy khi dừng.
- Shared cameraPath thêm endpoint Contact riêng, thay vì dùng ABOUT đã được đẩy xa/phải ở R3.3. Endpoint/collision vẫn cùng progress và pose có continuity ở .44; portrait dành vùng đọc dưới. Không thêm camera writer.
- Self-check chạy lại sau patch: 31.544 math assertions và 161 integration assertions pass; 11 source thay đổi/94 baseline hash giữ. Nội dung kết quả v1 phía trên là lịch sử review, không phải số tổng cuối.
- Matrix render và compiled preview được chốt trong verification.md; Contact panel/terminal là dependency R7.2.
