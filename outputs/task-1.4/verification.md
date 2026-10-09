# Task 1.4 — i18n setup

04/10/2026 — Codex.

Tạo `src/i18n/config.js`, `src/i18n/locales/vi.json`, `src/i18n/locales/en.json`; thêm một import `./i18n/config` trước App trong main.jsx. Dùng dependencies i18next/react-i18next đã có, không cài thêm package.

Config lấy ngôn ngữ ban đầu từ useLangStore (mặc định `vi`), `fallbackLng: 'en'`, chỉ có resources Vi/En và `interpolation.escapeValue: false`. initReactI18next cung cấp cùng instance cho React. Một subscription store → i18n gọi changeLanguage khi cần; không ghi ngược từ languageChanged vào store. Subscription được dispose qua import.meta.hot để tránh tích lũy khi module thay đổi trong dev. Lấy store.lang khi init cũng giữ lựa chọn hiện tại nếu module được nạp lại.

## Locale và nội dung

- Mỗi locale có 12 nhóm section, cùng cấu trúc và 142 string-leaf paths (tính cả từng phần tử mảng): hero, about, works, skills, education, experience, playground, contact, nav, footer, preloader, common.
- Các nhóm section nằm trong namespace `translation`, để gọi đúng dạng `t('hero.tagline')` mà người dùng yêu cầu. Key là camelCase tiếng Anh.
- Lấy nội dung trực tiếp từ draft bằng serializer; `draft-locales.mjs` và `locale-source-map.json` ghi rõ source line cho từng key. Kiểm đối chiếu toàn bộ object với nội dung được trích từ draft, không tự dịch/sáng tác.
- Bỏ dấu bao Markdown và ghi chú biên tập (stroke-text, xác nhận, dấu ✅ đánh dấu link); giữ nguyên chữ, dấu, chữ hoa/thường, apostrophe và nội dung câu. Phân tách danh sách thành mảng, tên/timeline/role/type thành các field để Phase 2 sử dụng.
- `contact.linkedinUrl`, `contact.behanceUrl`, `skills.technicalLevel` là chuỗi rỗng cho placeholder.
- Draft En không có dòng tên tiếng Anh phụ của Profile. Giữ `common.profile.englishName: ""` ở En để không tự bổ sung nội dung; Vi giữ `Tran Vu Anh Duy` đúng dòng 10 của draft Vi.
- `hero.tagline` là `Creative Designer` ở cả hai draft. Chuỗi Vi phân biệt ngôn ngữ được kiểm thêm ở hero.subTagline và nav.about.
- Nav có 7 mục thực tế ở cả hai draft dù tiêu đề ghi 8. Chỉ có đúng 7 nhãn đã soạn, không tạo thêm mục.
- Profile trong common, thông tin liên lạc trong contact, copyright trong footer, ba dải marquee trong common.marquees. Giữ đủ 3 dự án, 3 trường, 3 vị trí công việc và 8 playground experiments.

## Kiểm chứng

| Kiểm tra | Kết quả |
| --- | --- |
| npm run build | PASS; Vite/PWA hoàn tất. Có cảnh báo chunk GalaxyScene >500 kB từ phần 3D được thêm đồng thời |
| npx eslint src/i18n/config.js src/main.jsx | PASS |
| node outputs/task-1.4/check-i18n.mjs | PASS; kết quả checks.json |
| JSON parse / key parity / camelCase | PASS; cùng 142 string leaves, 12 section groups và các mảng cùng chiều dài |
| Copy đối chiếu draft | PASS; toàn bộ giá trị khớp source mapping, không còn placeholder dạng [ ] trong locale |
| Bảo toàn source | Hash SHA256 của content-vi.md, content-en.md và useLangStore.js không đổi |
| Init React | isInitialized=true, getI18n() là cùng instance, default Vi, fallback En, escapeValue=false |
| changeLanguage('en') / ('vi') | PASS; t() trả đúng tất cả 142 giá trị ở mỗi ngôn ngữ và trả mảng với returnObjects:true |
| Fallback En | PASS; thử thiếu một giá trị Vi trong bộ nhớ, trả En rồi khôi phục ngay; không sửa file JSON |
| Store → i18n | PASS; 20 lần chuyển tạo đúng 20 languageChanged events; set cùng ngôn ngữ/giá trị không hợp lệ không tạo event thừa |
| Đồng bộ một chiều | PASS; gọi trực tiếp i18n.changeLanguage không đổi Zustand. Store vẫn có thể áp lại ngôn ngữ của nó sau lời gọi debug |
| Browser fixture | PASS tại http://localhost:5173/outputs/task-1.4/browser-i18n.html; Store EN/VI và direct changeLanguage EN/VI hoạt động; React binding đúng, URL rỗng, không warning/error |
| Browser console Vi | i18n.t('hero.tagline') → Creative Designer; hero.subTagline → Nối nhịp giữa UI chức năng và cách kể chuyện điện ảnh. |
| Browser console En | hero.subTagline → Bridging the gap between functional UI and cinematic storytelling.; nav.about → About |
| Browser trang chính | Entry mới tải được App/preloader và nội dung WIP. Phần 3D dùng static fallback khi Browser không có WebGL2 |

Không migrate text component trong task này. App được cập nhật 3D/scroll bridge từ một luồng làm việc khác trong lúc chạy; giữ nguyên các thay đổi đó, không dùng hash App để khẳng định toàn workspace không đổi. Phạm vi production của task i18n chỉ gồm config, hai locale và một import trong main.jsx.

Các file Browser QA / source mapping / check script nằm trong outputs để kiểm chứng, không được import vào bundle ứng dụng. Các ảnh và JSON `browser-en.*`, `browser-vi.*` ghi lại kiểm thử với instance production. Không thêm ngôn ngữ, detector, backend hoặc persistence.

## Tham chiếu

- [react-i18next quick start: initReactI18next/resources/interpolation](https://react.i18next.com/guides/quick-start)
- [i18next configuration options](https://www.i18next.com/overview/configuration-options)

## Dùng ở Phase 2

`useTranslation()` cung cấp `t`; ví dụ `t('hero.subTagline')`, `t('contact.emailCta')`. Với danh sách dùng `t('skills.tools', { returnObjects: true })`. Đổi ngôn ngữ giao diện qua `useLangStore.getState().setLang('en')` hoặc `'vi'`.
