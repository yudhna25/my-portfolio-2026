# V0 — Kiểm chứng baseline hiện tại

**V0 hoàn tất về baseline/contract; chưa sửa ứng dụng, chưa thực thi V1/V2/V4.** Ngày09/10/2026. Skills đã dùng: `galaxy-portfolio`, `react-3d-ui` đọc từ `tools/codex-skills/`; không dùng skill tùy chọn hoặc cài dependency mới.

Mọi path trong tài liệu từ gốc repo; link ảnh bên dưới tương đối trong thư mục V0. Source fingerprint, working tree, installed versions và125 SHA-256 nằm trong `baseline.json`. HEAD `5296621304fa2192efd0e05bbd5c47679e7d4614`, branch main. Working tree trước V0 có `AGENTS.md` đã đổi, `prompts.md` và báo cáo `outputs/project-status-2026-10-09/` chưa commit; được giữ nguyên.

## Kiểm tra mới trong phiên

| Kiểm tra | Kết quả và giới hạn |
|---|---|
| Production build | PASS; Vite7.3.6 báo6.31s, toàn lệnh gồm PWA khoảng9.925s. Precache34 entries/2739.70KiB. Không chứng minh offline/HTTPS đã đạt. |
| Lint | PASS exit0;0 errors,2 warning cũ `react-hooks/unsupported-syntax` ở `SplashCursor.jsx:149/175`. Không sửa hoặc tắt rule. |
| Browser baseline | Edge154.0.4258.62, headless, Windows; ANGLE Intel UHD Graphics630/D3D11. Source hiện tại qua Vite local, service workers blocked để tránh cache cũ. |
| Desktop | 1440×900, device DPR1/render DPR1, high tier, một Canvas ở mọi frame. |
| Mobile viewport | 390×844, touch emulation, device DPR1/render DPR1, low tier. Đây vẫn là desktop GPU, không phải điện thoại. |
| Ảnh baseline | 34 PNG:28 desktop (6 section,2 active states,20 checkpoint transition) +6 mobile. Tất cả có file và metadata trong `browser-results.json`. |
| Reverse | 10 cặp portal/finale tại0/.25/.5/.75/1; camera/active uniforms khớp; Works transforms ở finale khớp; reading gate khớp. Không so full-frame pixel equality. |
| Native scroll | Hai wheel sample tới/lùi portal, `storyManual=false`; producer publish tiến độ theo scroll. Đây là smoke nhỏ, không toàn hành trình. |
| Console trong capture cuối | 0 page/console errors; warning THREE.Clock deprecated xuất hiện một lần mỗi viewport. Không phải lỗi mới do V0. |
| Overflow | 0px tại34 frame đã chụp. Không suy ra pass mọi viewport/language/content state. |
| Bảo toàn |124 file bất biến + AGENTS prefix trong inventory được kiểm SHA-256; chỉnh sửa chủ đích chỉ ở thư mục V0 và một dòng tiến độ. Build/Vite vẫn sinh dist/cache bị Git ignore như bình thường. Xem `integrity-results.json`. |

Build mặc định chỉ entry `index.html`; không build riêng Lab, không kiểm Browser Lab trong V0. Đã đọc source Lab và xác nhận dùng chung scene/PortalHeading/progress helpers; Lab khác production layout/ranges.

Lệnh: `npm run build`, `npm run lint`, `node outputs/visual-revision-2026-10-09/v0/capture-baseline.mjs`, `node outputs/visual-revision-2026-10-09/v0/capture-browser.mjs`, `node outputs/visual-revision-2026-10-09/v0/verify-integrity.mjs`. Browser harness cần Playwright có sẵn trong runtime/catalog; có thể truyền vị trí module bằng biến môi trường `STELLAR_PLAYWRIGHT_MODULE`, không cài vào package. Browser channel `msedge`, base URL local chỉ là môi trường kiểm thử, không deployment.

## Sáu section và trạng thái active

| Section | Desktop | Mobile | Chapter / p |
|---|---|---|---|
| Hero | [Ảnh](screenshots/1440-hero.png) | [Ảnh](screenshots/390-hero.png) | hero /0 |
| About | [Ảnh](screenshots/1440-about.png) | [Ảnh](screenshots/390-about.png) | about /0 |
| Education | [Ảnh](screenshots/1440-education.png) | [Ảnh](screenshots/390-education.png) | education /.12 |
| Experience | [Ảnh](screenshots/1440-experience.png) | [Ảnh](screenshots/390-experience.png) | experience /.32 |
| Works | [Ảnh](screenshots/1440-works.png) | [Ảnh](screenshots/390-works.png) | works /.20 |
| Contact | [Ảnh](screenshots/1440-contact.png) | [Ảnh](screenshots/390-contact.png) | contact /0 |

Hover school thật: [SGU active](screenshots/1440-education-active-sgu.png). Click project thật: [EDURA pinned preview](screenshots/1440-works-active-edura.png). Không mở Behance, gửi mail, sao chép clipboard hoặc bật âm thanh trong audit này.

## Checkpoint tới/lùi desktop

| p | Portal tới | Portal lùi | Finale tới | Finale lùi |
|---:|---|---|---|---|
| 0 | [Ảnh](screenshots/1440-portal-fwd-0.png) | [Ảnh](screenshots/1440-portal-rev-0.png) | [Ảnh](screenshots/1440-finale-fwd-0.png) | [Ảnh](screenshots/1440-finale-rev-0.png) |
| .25 | [Ảnh](screenshots/1440-portal-fwd-0.25.png) | [Ảnh](screenshots/1440-portal-rev-0.25.png) | [Ảnh](screenshots/1440-finale-fwd-0.25.png) | [Ảnh](screenshots/1440-finale-rev-0.25.png) |
| .50 | [Ảnh](screenshots/1440-portal-fwd-0.5.png) | [Ảnh](screenshots/1440-portal-rev-0.5.png) | [Ảnh](screenshots/1440-finale-fwd-0.5.png) | [Ảnh](screenshots/1440-finale-rev-0.5.png) |
| .75 | [Ảnh](screenshots/1440-portal-fwd-0.75.png) | [Ảnh](screenshots/1440-portal-rev-0.75.png) | [Ảnh](screenshots/1440-finale-fwd-0.75.png) | [Ảnh](screenshots/1440-finale-rev-0.75.png) |
| 1 | [Ảnh](screenshots/1440-portal-fwd-1.png) | [Ảnh](screenshots/1440-portal-rev-1.png) | [Ảnh](screenshots/1440-finale-fwd-1.png) | [Ảnh](screenshots/1440-finale-rev-1.png) |

Các frame là trạng thái held của **App thật**, synchronize DOM scroll và store manual; không phải storyboard dựng lại. Native producer được kiểm riêng trước khi chuyển viewport. Ambient stars/time, Nav auto-hide và About reveal wall-clock có thể khác giữa ảnh; camera/active uniforms so từ scene thật. Reading rect khác tối đa0.25px do scroll/Smoother rounding; gate opacity/visibility/inert/aria-hidden khớp.

## Phát hiện ảnh hưởng task tiếp theo

- Hero còn O trắng bao mini BH, năm solid lệch phải, glitch nhanh; chưa có outline/diagonal disk/decode tên theo brief mới. V1/V2 giữ slot rect chung rồi V3 nối.
- About vẫn ẩn và inert tại portal.75, dù BH lớn đã hiện. Parent gate tại App:89 chỉ mở p=1; vị trí flow About còn dưới viewport giữa đoạn. V3 phải mở gate và bù ejection trên inner wrapper, giữ marker/root target không transform. Decode About hiện chỉ `.play()` trong chapter About nên cần tránh tranh property với ejection.
- Education vẫn Cir/Tel/Pic và một shared target pool; hover SGU chỉ vài sao/cạnh, chưa có art. V4 cung cấp nguồn/vector/anchor, V5 scope renderer Education và giữ Skills.
- Meteor là head5px/trail mảnh, không cyan/wake; path đã analytic, tiếp tục dùng được cho V6.
- Works vẫn header selectors và bottom preview; figure projection/semantic hit regions/preview cạnh là công việc V7, App ref wiring qua V8. Giữ focus ID để không phá EDURA restore.
- Finale gas hiện screen-space hai lớp, Contact panel đặc che BH. V9 tăng spectacle và framing, chỉ đổi panel transparency, không gỡ terminal hoặc sửa Footer.
- SymbolStars import logo runtime từ `outputs/redesign/r0.2/logos/mono/`; đã hash các asset này. Không xóa outputs như toàn bộ log thừa.

## Log môi trường và harness

- Build sandbox đầu tiên thất bại EPERM realpath tại index.css, chưa transform module. Lượt chạy cùng lệnh ngoài sandbox đã pass; `build-sandbox.log`/result giữ riêng, không sửa source né lỗi.
- Dev server cảnh báo dependency scan gặp HTML fixture cũ trong outputs; App vẫn compile/load thành công và capture cuối không có runtime errors. Không sửa vite.config trong V0.
- `browser-first-attempt.json`: comparator ban đầu so cả `uFinaleOrigin` chưa có tác dụng ở finale0; sửa harness để so active uniforms và cả figure transforms, giữ raw difference. Đây là hạn chế comparator, không kết luận bug visual.
- `browser-second-attempt.json`: desktop28frame/10pairs/native2 hoàn tất, mobile setup vướng harness gọi `.progress` khi mobile tween không có method. Guard giống implementation App đã có; chỉ chụp bổ sung mobile6frame. Không thay source để làm test pass.
- Các lượt cuối nằm ở `browser-results.json`; không dùng partial attempts để tuyên bố kết quả final. Report cũ không được tái sử dụng làm phép đo mới.

## Chưa kiểm chứng

Không benchmark FPS/GPU/thermal; không đo finite pixels HDR, live FBO size, one-ray-pass instrumentation hoặc dispose qua lifecycle. Không test En/reduced/fallback/context loss/resize/route roundtrip/screen reader/điện thoại thật/HTTPS/offline trong V0. Các kiểm tra đó thuộc V2/V3/V8–V11 theo phạm vi. Một Canvas ở34frame là phép đếm DOM, không tự chứng minh toàn bộ ownership render hoặc resource cleanup.

V0 chứng minh đủ baseline và contract để giao V1/V2/V4, **không phải nghiệm thu đợt visual mới**.
