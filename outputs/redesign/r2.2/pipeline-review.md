# R2.2 — Read-only audit HDR / NDC / portal

Đối chiếu source thật sau baseline R2.2 `2026-10-07T20:04:33Z`. Đây là audit kiến trúc trước triển khai, không phải bằng chứng portal đã chạy. Agent chỉ sở hữu file báo cáo và `check-portal.mjs`; root sở hữu source/AGENTS/verification.

## Pipeline hiện có

- `GalaxyScene` có một Canvas và `CameraRig` là camera writer duy nhất. Camera orthographic trong `BlackHole` chỉ render quad vào target, không sở hữu pose scene.
- `BlackHoleSystem` tạo một application HDR `WebGLRenderTarget` HalfFloat, không depth/stencil. `BlackHole` tích phân tia một lần mỗi frame vào target này, restore render target/autoClear/XR/clearAlpha trong finally.
- `BLACK_HOLE_VERT` ghi `gl_Position = vec4(position.xy, 0, 1)`: transform/scale mesh không thu hố đen thành O.
- Mesh copy `accretion-disk` lấy cùng HDR texture và đi qua một composer SelectiveBloom khi quality khác low. `BlackHoleBloomMask` sample ray alpha/light để phục hồi lõi đen sau bloom. Low tier không có composer.
- Composer có các target nội bộ riêng; “một target” ở đây là một **HDR ray target do ứng dụng tạo**, không phải tổng số render targets bằng một. Báo cáo chi phí/lifecycle phải đo cả target nội bộ.

## Mapping nhỏ nhất đủ yêu cầu

Thêm cùng một GLSL snippet và uniform objects cho copy và bloom mask. Không thêm shader ray khác, target khác hoặc camera writer. Canonical ray image tiếp tục dùng scene camera hiện có. Mini O remap sample UV và giới hạn bằng aperture đo theo CSS px/glyph counter; full mode dùng UV identity. Một scalar scale trong normalized viewport UV giữ tỷ lệ vật lý của hình HDR đang có.

`rayUV = rayCenter + (screenUV - portalCenter) / scale`

`rayCenter` được project từ tâm hố đen cố định bằng camera scene. Transformed UV phải được giới hạn `[0,1]` trước sample; texture clamp-to-edge có thể kéo alpha ở mép thành dải nếu thiếu điều kiện bounds. Copy và mask phải dùng cùng UV, aperture, visibility; chỉ một bên đổi sẽ làm bloom sáng/lõi tối bị lệch.

Hero đầu ẩn ambient lớn. StarField/Nebula hiện không đọc `material.opacity` trong shader, nên thay property này không fade được chúng. Có thể bật group ambient trong khoảng tối rồi reveal bằng composite cùng progress. Veil phải có thật trong copy path cho low tier không composer; final mask phải khóa cả bloom spill trong dark interval.

## Anchor / pose cần giải quyết

- R2.1 Hero cao một viewport, đứng trước portal. O ở đầu Hero đã ngoài màn hình khi portal bắt đầu. R2.2 cần giữ semantic heading tới portal và đo đúng pose DOM đang hiển thị. Tránh caching một rect đã transform rồi dùng như base rect khi jump/resize.
- R2.1 `storyAnchor` là full glyph bounds, không phải counter. Cần inset hoặc counter measurement được ghi rõ để mini image không vẽ lên nét chữ và vẫn đọc được PORTFOLIO.
- Đổi mini/full UV mapping trong khoảng tối hoàn toàn. Với contract root đề xuất: mini tắt `.43→.48`, switch `.52`, full mở `.60→.74`; không nội suy hai camera writer hay đưa observer vào chân trời.
- Tâm ray hiện `[0,0,-200]`, observer gần nhất R2.1 khoảng `r=8.183`, ngoài cutoff `r=1.01`. Không dùng literal sketch z=-420 cho camera mà giữ nguyên tâm shader.
- Story time dùng phase cố định: không tăng `uTime`, random hoặc damping riêng khi đang đối chiếu cùng progress. Reduced-motion dùng cùng effective progress endpoint như camera.

## Điểm số học / giới hạn

Growth cần clamp progress và mẫu số scale dương, finite. Mọi direct jump/deep link/resize phải sinh UV/uniform hữu hạn; canonical image màu finite là phép kiểm GPU, không thể suy ra chỉ từ build pass. Observer `r>1` là điều kiện của `sqrt(1 - 1/r)` trong ray fragment.

Fragment cũ có `smoothstep(1.55,1.18,minRadius)` với edges đảo chiều, không portable theo GLSL. Đây là vấn đề nền đã tồn tại; không tự đổi thuật toán ray trong R2.2 nếu kiểm màu/driver hiện tại không lộ lỗi. Dạng tương đương hợp lệ nếu cần sửa riêng là `1.0 - smoothstep(1.18,1.55,minRadius)`.

## Kiểm chứng cần root thực hiện

Ảnh tới/lùi 0/.25/.5/.75/1 desktop/mobile; dừng/đảo chiều/direct jump; mini counter không hụt lúc resize/locale; first frame không galaxy/BH lớn/chòm; core tối và bloom đúng đĩa; low-tier veil; observer/color finite; console/WebGL; chi phí opening/ejection; ba vòng resize/mount với application HDR target và composer target totals trước/sau. Self-check Node chỉ kiểm logic/ownership invariants, không thay thế ảnh render/GPU.

## Kết quả self-check logic

`node outputs/redesign/r2.2/check-portal.mjs` chạy lại exit 0 sau khi thêm progress-driven dust và Browser fix: **31.187 assertions**, 1.001 progress samples, đi tới rồi quay ngược cùng trạng thái chính xác; observer thấp nhất `8.182909018191513`. Check clamp nonfinite, output reuse, dust pull bằng chính progress, khoảng tối `.48–.60`, endpoint, raw ray shader/vertex giữ baseline, shared GLSL copy/mask, một application HDR target/composer/Canvas/CameraRig và một ray render call; regression checks uniform identity và DOM subscription. JSON thật: `check-portal-result.json`. Không dùng kết quả này để tuyên bố màu GPU/visual/FPS đã pass.

Đọc source sau triển khai ban đầu thấy copy/mask đã nhận cùng `portal` uniform objects, raw ray fragment/vertex giữ nguyên và `PortalHeading` fixed tách khỏi smoother giải quyết anchor ra khỏi màn hình. Lưu ý review cho root: R3F `size` có thể trễ Canvas CSS khi live resize; dùng viewport CSS hiện tại nhất quán cho rect/center/aperture như `useSectionAnchor` đang làm. `storyAnchor.fixed` cần ghi trong handoff: fixed anchor là viewport px, content anchor cần trừ visible scroll.

Lần rà soát tiếp theo xác nhận root đã dùng `window.innerWidth/innerHeight` cho portal CSS mapping và `uPortalPull` lấy trực tiếp từ state clamp. Còn một rủi ro ordering nhỏ được báo root: `PortalHeading` draw và producer scroll có callback GSAP ticker riêng, thứ tự child/parent đăng ký có thể làm DOM đọc p của tick trước. Phương án nhỏ hơn: subscribe store trong useGSAP, cập nhật paused timeline ngay khi progress publish và cleanup unsubscribe; camera/composite vẫn chỉ đọc cùng progress và không có producer mới.

Rà soát sau Browser fix: `PortalHeading` đã dùng subscription store cleanup trong useGSAP; ordering concern trên đã được xử lý. Fiber assignment có thể clone scalar uniform wrappers; root giữ reference qua shader material `onUpdate` để copy/mask thật sự đọc cùng objects. Shared GLSL đã đổi thành initialized single return để tránh ANGLE warning. Old Constellations bị tắt riêng khi story=true; production vẫn giữ caller cũ. Không phát hiện thêm lỗi pipeline cụ thể trong lần đọc này. Pixel checker chuẩn bị riêng `check-pixels.py`; chỉ chạy khi root xác nhận 20 screenshots mới hoàn tất.

## Đối chiếu ảnh tới / lùi thật

Sau xác nhận của root rằng 20 PNG Browser mới đã ghi xong, chạy `C:/Users/PC/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe outputs/redesign/r2.2/check-pixels.py` với Pillow 12.3 có sẵn, exit 0. **10/10 cặp exact** tại 0/.25/.5/.75/1: desktop 1440×900 và mobile viewport 390×844. Mỗi cặp `changed_pixels=0`, `max_channel_difference=0`, MAE=0 trên toàn bộ ảnh gốc; không loại trừ vùng khác biệt. Harness Browser đã ẩn HUD/controls/back link trước capture.

20/20 ảnh mono: không pixel có chênh channel >1. Bốn ảnh `.5` dark interval có `maximum_rgb=0`. Kết quả và mọi metric nằm trong `pixel-results.json`. Tạo rồi mở/xem `contact-sheet.jpg`, ghép thumbnail từ ảnh thật; không sửa originals. Mini O/typography có ở hai frame đầu, khoảng tối ở .5, ejection nhìn về hố đen ở .75, endpoint mở nền sao ở 1. Đây là bằng chứng frame encoded/đảo chiều ở các mốc đã chụp; root vẫn sở hữu kiểm raw HDR finite, chi phí GPU/trace và lifecycle.
