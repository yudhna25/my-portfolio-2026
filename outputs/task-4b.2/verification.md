# Task 4B.2 — Layout Declutter & Playground Restructure

Ngày: 07/10/2026 · Agent: Codex · Kết quả: **PASS** các tiêu chí task 4B.2.

## Kết quả triển khai

- App còn đúng 7 section theo thứ tự: **Hero → About → Skills → Education → Experience → Work → Contact**. ID Contact giữ nguyên `transmission`; Footer tiếp tục là landmark riêng, không tính thành section thứ 8.
- Gỡ 3 Marquee và Playground khỏi App. Không còn component, import, key i18n hoặc ScrollTrigger của các khu vực này trong `src/`.
- `MissionProgressOrbit.jsx`: quỹ đạo đường kính 36px, HUD cố định góc phải dưới, ngoài ScrollSmoother; góc bằng `scrollProgress × 360`. Đọc trực tiếp subscription Zustand, không tạo ScrollTrigger hoặc đo scrollY mới. Cleanup unsubscribe qua `useGSAP`; reduced-motion khóa góc ở 0 nhưng vẫn cập nhật phần trăm. Accessible name Vi/En và giá trị `progressbar` 0–100.
- `navigationSections` là danh sách dùng chung cho Nav/Menu. Nav có logo dẫn đến Hero và 6 link section; Menu có đủ 7 link theo thứ tự trên. Xóa cơ chế link pending đã hết nhu cầu. Giữ skip-link, auto-hide, focus trap, Esc, scroll lock và ScrollTo offset.
- Bridge scroll chỉ chọn `section[id]`: Footer không ghi đè `currentSection`; Contact tiếp tục active khi tới cuối trang. ResizeObserver và refresh hiện có tự đo lại vị trí sau khi xóa các block, không dùng chỉ số/range section cố định.
- Skills: Constellation Grid nối 10 nhãn đã có bằng 9 đoạn SVG, theo hàng 1/2/5 cột; đo lại khi resize, font hoặc ngôn ngữ đổi. SVG trang trí được ẩn với accessibility tree. Hover chỉ tăng độ rõ đường nối, không thêm Canvas.
- Works: giữ magnetic trên 4 filter và thêm vào CTA EDURA. Tái dùng Cursor/quickTo hiện có, giới hạn dịch chuyển 8px và tắt khi reduced-motion; không thêm controller hay thư viện.

## File đã tạo, sửa và xóa

Tạo `src/components/ui/MissionProgressOrbit.jsx`.

Sửa `src/App.jsx`, `src/data/navigation.js`, `src/components/layout/Nav.jsx`, `src/components/layout/MenuOverlay.jsx`, `src/3d/hooks/useScrollProgress.js`, `src/components/sections/Skills.jsx`, `src/components/Work.jsx`, `src/index.css`, locales `vi.json` và `en.json`. CSS chỉ dọn selector focus `[data-experiment]` không còn dùng; giữ tokens của 4B.1.

Xóa 7 file không còn caller:

1. `src/components/Marquee.jsx`
2. `src/components/sections/Playground.jsx`
3. `src/components/effects/LiveDemo.jsx`
4. `src/components/effects/ScrollOrbitDemo.jsx`
5. `src/3d/components/ParticleFieldDemo.jsx`
6. `src/3d/components/ShaderPlaygroundDemo.jsx`
7. `src/data/playground.js`

Nguồn draft và báo cáo lịch sử trong `outputs/` được giữ lại. Dọn các nhóm i18n Playground/Marquee và nav pending đã hết caller; thêm `nav.hero`, `nav.missionProgress` cho cả Vi/En. Parity: **174 leaf keys/locale**, bao gồm các phần tử array, đúng 100%.

## Kiểm chứng

Chạy dev server tại `http://127.0.0.1:5173/`, Edge **154.0.4258.53**, Playwright headless, DPR 1, chiều cao 900px, service worker bị chặn để kiểm tra asset hiện tại. Script dùng assertions thật và ghi đầy đủ DOM/store/GSAP state trong [results.json](./results.json).

**878 assertions pass; console errors = 0; HTTP 404 = 0; request failures = 0.**

| Viewport | clientWidth | scrollWidth | Tràn ngang | Section | Cột Constellation |
|:---|---:|---:|---:|---:|---:|
| 320px | 320 | 320 | 0px | 7 | 1 |
| 390px | 390 | 390 | 0px | 7 | 1 |
| 768px | 768 | 768 | 0px | 7 | 2 |
| 1024px | 1024 | 1024 | 0px | 7 | 5 |
| 1440px | 1440 | 1440 | 0px | 7 | 5 |
| 1920px | 1920 | 1920 | 0px | 7 | 5 |

- 56 pose kiểm tra scroll/endpoint: store khớp vị trí DOM nhìn thấy, section đúng từng mốc, progress nằm trong 0..1, HUD khớp phần trăm và góc. Đến cuối trang: `transmission`, progress = 1, HUD = 100%.
- 21 lượt kích hoạt link bằng bàn phím: 7 Nav desktop + 7 Menu desktop + 7 Menu mobile 390px. Hero về y=0; section khác cách đỉnh viewport 80px, sai số <1px; focus chuyển đúng đến section đích. Không còn anchor Playground hoặc anchor gãy.
- Wheel thật: ScrollSmoother đi xuống 1200.0048px; Nav ẩn hoàn toàn khi cuộn xuống và hiện lại khi cuộn lên. Menu tiếp tục khóa cuộn, đóng và trả focus/điểm neo đúng.
- Works Flip: Product còn 1 card, All trả lại 3 card; magnetic CTA đạt `translate: 5.6px 4px` (độ dài ≈6.88px), rời chuột trả `0px`.
- Constellation hover: opacity đường nối 0.4; đủ 10 node/9 segment tại cả 6 viewport. Snapshot mobile cho thấy mạng chuyển thành trục dọc.
- Vi → En → Vi: thứ tự link và geometry giữ đúng; HUD có accessible name song ngữ.
- 3 vòng đổi trực tiếp reduce ↔ no-preference: trigger count **0 ↔ 74**, lặp ổn định 3 lần; không tích lũy trigger. Smoother bị bypass khi reduce, quỹ đạo đứng yên tại góc 0; khi bật motion lại, góc khớp progress hiện tại.
- Toàn bộ các pose có **1 Canvas**; không còn Canvas demo hoặc production chunks ParticleFieldDemo/ShaderPlaygroundDemo/ScrollOrbitDemo.

## Build và lint

- `npm run build`: **PASS, 4.90s**; PWA precache 29 entries. Xem [build.log](./build.log).
- `npm run lint`: **0 errors, 2 warnings cũ** trong `SplashCursor.jsx` về inline class, không thêm issue. Xem [lint.log](./lint.log).
- Cảnh báo chunk >500KB vẫn còn; không đổi cấu hình bundler trong task này.

Chạy lại:

```powershell
npm run dev
node outputs/task-4b.2/verify.mjs
npm run build
npm run lint
```

Script dùng Playwright đã có trong runtime Codex và Edge cài trên máy; không thêm dependency vào dự án. Browser preference ở lượt này là mô phỏng bằng Playwright; không lặp lại kiểm chứng OS thật của task 4.3.

## Snapshot và thay đổi song song

- [Skills mobile 320px](./skills-320.png)
- [Skills desktop / Constellation Grid](./skills-desktop.png)
- [Works / magnetic CTA](./works-desktop.png)
- [Baseline hashes](./baseline.json) và [đối chiếu source](./source-changes.json).

Giữ nguyên SoundToggle/audio của 4B.3, GalaxyScene/CameraRig/shaders/chòm sao của 4B.4. Trong lúc chạy QA, phiên 4B.5 gắn CockpitRails vào App; thay đổi này được giữ và có mặt trong lượt kiểm chứng cuối. Snapshot desktop cho thấy HUD mới che một phần lề ngoài của Skills; vùng đệm giữa HUD và nội dung cần được rà trong review 4B.9, không nằm trong chỉnh sửa HUD của task này.

`initial-run.json` lưu lượt đầu: giả định test về giới hạn 40 triggers không đúng với SplitText/batch hiện tại và có warning SVG từ HUD vừa gắn. Lượt cuối dùng số lượng trigger thực tế để kiểm tra tích lũy; HUD đã được phiên 4B.5 sửa và browser sạch lỗi.

Skill áp dụng: `vercel-composition-patterns`. Không tìm thấy `clean-code` trong các nguồn skill cục bộ; áp dụng quy tắc clean code/Ponytail hiện hành: xóa caller và code thừa, tái dùng store/Cursor, không thêm abstraction hay thư viện.
