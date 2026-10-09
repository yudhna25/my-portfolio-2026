# Task 1.3 — Zustand stores

04/10/2026 — Codex.

Tạo bốn store riêng dùng `create()` và named export. App chỉ đổi import React/loading và hai selector; callback hoàn tất preloader, scroll lock và GSAP hooks giữ nguyên. Thêm Zustand `^5.0.15` thành dependency trực tiếp; đây là bản đã có trong dependency tree 3D, được đồng bộ offline sau khi registry bị chặn mạng.

| Store | State mặc định | Actions |
| --- | --- | --- |
| useScrollStore | scrollProgress: 0, currentSection: 'hero' | setProgress clamp 0..1 và bỏ qua số không hữu hạn; setCurrentSection |
| useThemeStore | theme: 'dark' | toggleTheme, setTheme, applyTheme |
| useLangStore | lang: 'vi' | setLang |
| useLoadingStore | isLoading: true | setLoading |

`applyTheme()` đọc theme hiện tại, ghi `document.documentElement.dataset.theme` khi được gọi và an toàn khi không có document. `setTheme()`/`setLang()` chỉ nhận hai giá trị hợp lệ. Chưa có persistence, middleware, đo scroll, i18n bridge hoặc state dẫn xuất thừa.

Kiểm chứng:

- `npm run build`: PASS, Vite/PWA hoàn tất, không cảnh báo build.
- `node tools/check-stores.mjs`: PASS; kiểm tra defaults, giới hạn progress, theme DOM action, language, loading isolation và action reference ổn định.
- `npx eslint src/App.jsx src/stores/*.js`: PASS.
- `npm run lint`: cùng hai lỗi refs trong Work/Preloader và hai cảnh báo unsupported-syntax trong SplashCursor như trước task. So sánh file/rule/severity không có issue mới; line number có thể dịch do task 1.2 cập nhật đồng thời.
- Browser tại `http://localhost:5173/`: lúc tải có preloader và `loading-lock`; khi hoàn tất preloader biến mất, lock được gỡ, Hero visible. Có ảnh `preloader.png` và `loaded.png`.
- Browser console: không có error hoặc warning về snapshot không cache, vòng lặp render/update, invalid hooks hay state update sau unmount. Các warning GSAP target cũ của Preloader vẫn còn.
- App được đối chiếu với snapshot đầu task: ngoài import loading store, bỏ import useState và thay một khai báo state bằng hai selector, nội dung không đổi. Preloader, hooks, CSS và Vite config không đổi.
- Bảy component WIP khác có thay đổi đồng thời trong phần hoàn tất task 1.2; task 1.3 giữ các thay đổi đó.
