# V0 → V1 / V2 / V4

**V0 hoàn tất.** Chưa sửa ứng dụng hoặc chạy task kế tiếp. 09/10/2026.

Đọc `prompts.md`, `AGENTS.md`, rồi các file V0 tại `outputs/visual-revision-2026-10-09/v0/`: `baseline.json`, `ownership.md`, `contract.md`, `verification.md`, `integrity-results.json`. Mọi path từ gốc dự án, không cần đổi ổ đĩa/tài khoản khi chuyển máy.

## Các nhánh đã sẵn sàng giao

| Task | Nhận gì | Trả gì cho integrator |
|---|---|---|
| V1 | Hero/PortalHeading API, O rect contract, layer ownership, baseline typography | Outline/layout/decode/glitch, O slot đúng kích thước, props/layer/timeline và patch locale/Lab nếu cần |
| V2 | HDR target/ray/copy/mask, quality, O rect input, portal/finale uniform contract | Disk diagonal/O fit/close-up sharpness, ray mapping/target settings, observer/rebase đề xuất và API compatible |
| V4 | Canonical school/project IDs, current geometry/projection, art mapping mới | Sáu vector/manifest/license/source/anchors, Education geometry proposal, Works art transform giữ geometry |

V1/V2/V4 được chạy song song theo quyền file. Khi cần file chung, bàn giao patch; không tự sửa App/store/camera/Lab/locales. **Không coi tài liệu này là lệnh tự mở Agent hoặc thực thi ba task.**

## Những điểm không được bỏ qua

1. O cuối hiện vẫn là glyph trắng, BH fit counter nhỏ. V1 giữ slot đo được khi bỏ glyph; V2 đọc anchor hiện có, không tạo anchor/render riêng.
2. Shader đang ray full-screen, copy/mask remap UV và target có cap resolution. Cần xử lý cả sampling/projection, không chỉ tăng maxResolution hoặc rotate mesh.
3. V3 phải thay gate App `portal===1` và bù vị trí About trong flow; thay opacity đơn thuần không làm About eject. Giữ một About DOM, markers/Nav targets ổn định.
4. V5 bảo toàn pool192/Skills logos/behavior trong shared renderer. Không có artwork mới trong baseline; V4 chưa được thực hiện.
5. V6 giữ `onLayout` mutable ref và curve analytic. V7 giữ store precedence, canonical IDs, orbit identity/capture, `work-target-edura` và route snapshot.
6. Không làm R7.2 cũ trong bộ visual này: Contact terminal/copy/actions/Footer vẫn giữ. V9 chỉ đổi panel transparency và transition/framing.
7. Baseline GPU Intel UHD630 khác RTX4060 trong báo cáo cũ; chưa có FPS mới. Đừng kế thừa số165fps làm kết quả máy hiện tại.

## Kiểm chứng đã có

Build6.31s pass, lint0errors/2warnings cũ,34 PNG App hiện tại (desktop1440×900 và viewport mobile390×844).10 cặp portal/finale có pose/active uniforms và gate khớp;2native-wheel samples.0 Browser errors,2Clock warnings. Inventory125 SHA-256, không đổi124 file bất biến hoặc prefix AGENTS; kiểm integrity riêng sau append.

Đã đọc handoff R3.2/R4.2/R4.3/R5.1/R5.2/R6.2/R7.1. R4.1 không có handoff.md trong checkout; đã đọc `outputs/redesign/r4.1/contract.md` là bàn giao thực tế. Source hiện tại ưu tiên hơn pose/layout/CTA cũ trong các report lịch sử.

## Sau các nhánh

V3 tích hợp V1/V2 và chuẩn bị G1; V4 vẫn độc lập. Sau G1, V5/V7 cần V4, V6 chỉ cần G1; ba nhánh giao V8 rồi G2. Không đi tiếp gate khi chưa có xác nhận của người dùng. V0 không tạo xác nhận G1/G2/G3 và không deploy.

Skills repo đã đọc/apply: `galaxy-portfolio`, `react-3d-ui`. Skill palette/glow cũ được override đúng phạm vi trong prompts.md; không thêm ChromaticAberration toàn cảnh hoặc thư viện animation mới.
